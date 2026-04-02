<div align="center">

# ⚖️ SignWise AI

**Your AI-powered legal bodyguard.**

Analyze contracts for red flags, hidden terms, and predatory language — before you sign.

Built with React + TypeScript • Firebase • Gemini AI • Stripe

</div>

---

## Features

| Feature | Description |
|---|---|
| **Document Upload** | Drag-drop PDF, DOCX, PNG, JPG — 10MB max, stored in Firebase Storage |
| **AI Analysis** | Gemini 2.5 Flash forensic engine — red flags, hidden terms, risk rating |
| **Dashboard** | Real-time document history, risk breakdown stats, pagination |
| **Plan Gating** | Free: 3/month, Pro ($9/mo): unlimited — server-enforced |
| **Stripe Billing** | Hosted Checkout, webhook-driven plan management |
| **Auth** | Email/password + Google OAuth, protected routes |
| **PWA** | Installable, offline page, static asset caching |
| **Security** | CSP headers, UID-scoped rules, rate limiting, no client-side API keys |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Client (React + Vite)                              │
│  ├── /              HomeDashboard                   │
│  ├── /upload        DocumentUpload                  │
│  ├── /analyze/:id   AnalysisPage                    │
│  ├── /settings      SettingsPage (profile, billing) │
│  └── /login|register|forgot-password                │
├─────────────────────────────────────────────────────┤
│  Cloud Functions                                    │
│  ├── analyzeDocument   (Gemini AI, rate-limited)    │
│  ├── createCheckoutSession  (Stripe)                │
│  ├── stripeWebhook    (plan management)             │
│  ├── getUploadToken   (signed Storage URL)          │
│  └── deleteUserAccount (full data wipe)             │
├─────────────────────────────────────────────────────┤
│  Firebase                                           │
│  ├── Auth       (email/password + Google)            │
│  ├── Firestore  (users, documents, rateLimits)      │
│  ├── Storage    (contract files, UID-scoped)        │
│  └── Hosting    (SPA, cache headers)                │
└─────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- Firebase CLI: `npm install -g firebase-tools`
- Stripe account (for billing)

### 1. Clone & Install

```bash
git clone https://github.com/Bino-Elgua/Sign-wise.git
cd Sign-wise
npm install
cd functions && npm install && cd ..
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Firebase project values (from Firebase Console → Project Settings):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
GEMINI_API_KEY=your-gemini-key
```

### 3. Firebase Project Setup

```bash
firebase login
firebase use --add   # select your project
```

Enable these in Firebase Console:
- **Authentication** → Email/Password + Google sign-in
- **Cloud Firestore** → Create database (production mode)
- **Cloud Storage** → Create default bucket
- **Cloud Functions** → Enable (requires Blaze plan)

### 4. Cloud Functions Environment

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRO_PRICE_ID
firebase functions:secrets:set APP_URL       # e.g. https://your-app.web.app
```

### 5. Stripe Setup

1. Create a Product in Stripe Dashboard → "SignWise Pro"
2. Add a Price → $9/month recurring
3. Copy the Price ID → set as `STRIPE_PRO_PRICE_ID`
4. Create a Webhook endpoint → `https://your-project.cloudfunctions.net/stripeWebhook`
5. Events to listen: `checkout.session.completed`, `customer.subscription.deleted`
6. Copy Webhook Signing Secret → set as `STRIPE_WEBHOOK_SECRET`

### 6. Deploy

```bash
# Build client
npm run build

# Deploy everything
firebase deploy
```

Or deploy individually:

```bash
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only firestore:indexes
```

### 7. Local Development

```bash
npm run dev          # Vite dev server on :3000
```

---

## Project Structure

```
Sign-wise/
├── public/                    # Static assets (PWA icons, SW, offline page)
├── src/
│   ├── components/
│   │   ├── auth/              # Login, Register, ForgotPassword, ProtectedRoute
│   │   ├── AnalysisPage.tsx   # AI analysis results
│   │   ├── ConfirmModal.tsx   # Reusable confirmation dialog
│   │   ├── DocumentCard.tsx   # Document list item
│   │   ├── DocumentUpload.tsx # Upload with drag-drop
│   │   ├── HomeDashboard.tsx  # Main dashboard
│   │   ├── Layout.tsx         # App shell (nav, footer)
│   │   ├── PlanGate.tsx       # Feature gating wrapper
│   │   ├── SettingsPage.tsx   # Profile, subscription, danger zone
│   │   └── UpgradePrompt.tsx  # Stripe upgrade CTA
│   ├── context/
│   │   └── AuthContext.tsx    # Firebase Auth provider
│   ├── hooks/
│   │   ├── useAnalysisLimit.ts # Monthly usage tracking
│   │   └── usePlan.ts         # Real-time plan state
│   ├── services/
│   │   ├── documentService.ts # Firestore CRUD + Storage delete
│   │   ├── firebase.ts        # Firebase SDK init
│   │   ├── geminiService.ts   # Legacy Gemini client (unused in prod)
│   │   └── uploadService.ts   # Client-to-Storage upload
│   ├── types/
│   │   └── types.ts           # All TypeScript interfaces
│   ├── App.tsx                # Router
│   └── index.tsx              # Entry point + SW registration
├── functions/
│   └── src/
│       └── index.ts           # All Cloud Functions
├── firebase.json              # Hosting + Functions config
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Composite indexes
├── storage.rules              # Storage security rules
├── .env.example               # Environment variable template
└── .firebaserc                # Project aliases
```

---

## Security

- ✅ No API keys in client bundle — Gemini key is server-side only
- ✅ Storage rules reject unauthenticated access, enforce UID scope
- ✅ Firestore rules reject cross-UID reads, protect plan fields
- ✅ Stripe webhook validates signature before any Firestore write
- ✅ Content-Security-Policy meta tag on index.html
- ✅ Rate limiting: max 10 analyses per UID per hour
- ✅ `.env.local` in `.gitignore` — never committed

---

## License

MIT
