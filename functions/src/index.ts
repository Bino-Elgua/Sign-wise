import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

initializeApp();

/**
 * getUploadToken — callable Cloud Function
 *
 * Validates the caller is authenticated, then returns a signed upload URL
 * scoped to their UID path. The client uploads directly to Storage using
 * this URL. GEMINI_API_KEY is never touched here.
 */
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
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  return { signedUrl, storagePath };
});
