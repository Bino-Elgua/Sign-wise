import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Stripe from 'stripe';

initializeApp();

const db = getFirestore();

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured.');
  return new Stripe(key);
}

const FREE_LIMIT = 3;

async function getMonthlyAnalysisCount(uid: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const snap = await db
    .collection(`users/${uid}/documents`)
    .where('uploadedAt', '>=', monthStart)
    .where('status', 'in', ['pending', 'analyzing', 'complete'])
    .count()
    .get();
  return snap.data().count;
}

// ─────────────────────────────────────────────────────────────
// createCheckoutSession — Stripe Checkout for Pro plan
// ─────────────────────────────────────────────────────────────
export const createCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const uid = request.auth.uid;
  const userSnap = await db.doc(`users/${uid}`).get();
  const email = userSnap.data()?.email || request.auth.token.email;

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) throw new HttpsError('internal', 'STRIPE_PRO_PRICE_ID not configured.');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL || 'https://signwise.app'}/settings?upgraded=true`,
    cancel_url: `${process.env.APP_URL || 'https://signwise.app'}/settings`,
    metadata: { firebaseUID: uid },
  });

  return { url: session.url };
});

// ─────────────────────────────────────────────────────────────
// stripeWebhook — handles Stripe events
// ─────────────────────────────────────────────────────────────
export const stripeWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).send('Webhook secret not configured.');
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.metadata?.firebaseUID;
    if (uid) {
      await db.doc(`users/${uid}`).update({
        plan: 'pro',
        stripeCustomerId: session.customer,
        subscriptionId: session.subscription,
        planExpiresAt: null,
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    // Find user by stripeCustomerId
    const usersSnap = await db
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (!usersSnap.empty) {
      await usersSnap.docs[0].ref.update({
        plan: 'free',
        subscriptionId: null,
        planExpiresAt: null,
      });
    }
  }

  res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────────────────────
// deleteUserAccount — wipes all user data (Firestore + Storage)
// ─────────────────────────────────────────────────────────────
export const deleteUserAccount = onCall(
  { timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = request.auth.uid;

    // 1. Delete all Firestore documents in users/{uid}/documents
    const docsRef = db.collection(`users/${uid}/documents`);
    const docsSnap = await docsRef.listDocuments();

    const batch = db.batch();
    for (const docRef of docsSnap) {
      batch.delete(docRef);
    }
    // Delete the user root document
    batch.delete(db.doc(`users/${uid}`));
    await batch.commit();

    // 2. Delete all Storage files under users/{uid}/
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });
    await Promise.all(files.map((file) => file.delete().catch(() => {})));

    // Auth user deletion is handled client-side (deleteUser)
    return { success: true };
  }
);

// ─────────────────────────────────────────────────────────────
// getUploadToken — returns a signed URL for client-side upload
// ─────────────────────────────────────────────────────────────
export const getUploadToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const uid = request.auth.uid;
  const { filename, contentType, docId } = request.data as {
    filename: string;
    contentType: string;
    docId: string;
  };

  if (!filename || !contentType || !docId) {
    throw new HttpsError('invalid-argument', 'filename, contentType, and docId are required.');
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
  ];

  if (!allowedTypes.includes(contentType)) {
    throw new HttpsError('invalid-argument', `Unsupported content type: ${contentType}`);
  }

  const storagePath = `users/${uid}/documents/${docId}/${filename}`;
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);

  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000,
    contentType,
  });

  return { signedUrl, storagePath };
});

// ─────────────────────────────────────────────────────────────
// analyzeDocument — the core AI analysis engine
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are SignWise AI — a forensic contract analysis sentinel.
Your role is to protect signers from predatory language, hidden terms, and legal traps.

Analyze the provided contract text and return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "summary": "A clear, plain-English summary of what this contract says and does. 3-5 sentences.",
  "riskRating": "LOW" | "MEDIUM" | "HIGH",
  "riskReason": "One sentence explaining the overall risk level.",
  "redFlags": [
    { "clause": "The exact problematic clause text", "explanation": "Why this is dangerous for the signer" }
  ],
  "hiddenTerms": [
    { "clause": "The exact hidden or obscured term", "explanation": "What it actually means in plain English" }
  ],
  "disclaimer": "This analysis is AI-generated and does not constitute legal advice. Consult a licensed attorney before signing any binding agreement."
}

Rules:
- Always include the disclaimer exactly as shown.
- If there are no red flags, return an empty array for redFlags.
- If there are no hidden terms, return an empty array for hiddenTerms.
- riskRating must be exactly "LOW", "MEDIUM", or "HIGH".
- Be thorough but honest. Do not invent issues that don't exist.
- Focus on: liability caps, indemnification, arbitration clauses, auto-renewal, termination penalties, non-compete scope, data rights, IP assignment, payment terms.`;

async function extractText(buffer: Buffer, contentType: string): Promise<string> {
  if (contentType === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Images handled separately via Gemini Vision
  return '';
}

function isImageType(contentType: string): boolean {
  return contentType === 'image/jpeg' || contentType === 'image/png';
}

export const analyzeDocument = onCall(
  { timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = request.auth.uid;
    const { docId } = request.data as { docId: string };

    if (!docId) {
      throw new HttpsError('invalid-argument', 'docId is required.');
    }

    // ── Server-side plan limit enforcement ──
    const userSnap = await db.doc(`users/${uid}`).get();
    const userPlan = userSnap.data()?.plan || 'free';

    if (userPlan === 'free') {
      const monthCount = await getMonthlyAnalysisCount(uid);
      if (monthCount >= FREE_LIMIT) {
        throw new HttpsError(
          'resource-exhausted',
          `Free plan limit reached (${FREE_LIMIT}/month). Upgrade to Pro for unlimited analyses.`
        );
      }
    }

    const docRef = db.doc(`users/${uid}/documents/${docId}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new HttpsError('not-found', 'Document not found.');
    }

    const docData = docSnap.data()!;
    const { storagePath, fileType } = docData as { storagePath: string; fileType: string };

    // Mark as analyzing
    await docRef.update({ status: 'analyzing' });

    try {
      // Download file from Storage
      const bucket = getStorage().bucket();
      const file = bucket.file(storagePath);
      const [fileBuffer] = await file.download();

      // Initialize Gemini (server-side only, GEMINI_API_KEY from environment)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured in Cloud Functions environment.');
      }

      const ai = new GoogleGenAI({ apiKey });

      let responseText: string;

      if (isImageType(fileType)) {
        // Vision path — send image as inline base64
        const base64Data = fileBuffer.toString('base64');
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: SYSTEM_PROMPT + '\n\nAnalyze this contract document image:' },
                {
                  inlineData: {
                    mimeType: fileType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });
        responseText = response.text ?? '';
      } else {
        // Text extraction path — PDF or DOCX
        const extractedText = await extractText(fileBuffer, fileType);

        if (!extractedText.trim()) {
          throw new Error('No text could be extracted from the document.');
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${SYSTEM_PROMPT}\n\n--- CONTRACT TEXT ---\n${extractedText}\n--- END ---` },
              ],
            },
          ],
        });
        responseText = response.text ?? '';
      }

      // Parse JSON from Gemini response (strip markdown fences if present)
      const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysisResult = JSON.parse(jsonStr);

      // Validate required fields
      if (!analysisResult.summary || !analysisResult.riskRating || !analysisResult.disclaimer) {
        throw new Error('Gemini returned incomplete analysis structure.');
      }

      // Update Firestore with results
      await docRef.update({
        status: 'complete',
        analysisResult,
      });

      return { status: 'complete', analysisResult };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown analysis error.';

      await docRef.update({
        status: 'failed',
        error: errorMessage,
      });

      throw new HttpsError('internal', `Analysis failed: ${errorMessage}`);
    }
  }
);
