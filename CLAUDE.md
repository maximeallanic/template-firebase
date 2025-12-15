# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Firebase + React SaaS Template** for building AI-powered web applications. It provides a complete foundation with authentication, subscriptions, and AI integration ready to use.

**Features:**
- **Free Trial**: 1 action without sign-up (IP+fingerprint tracked for 30 days)
- **Free Plan**: 5 actions/month (requires sign-up)
- **Pro Plan**: 250 actions/month at $5/month
- **Email Input Feature**: Users can send content via unique email addresses (powered by Mailgun)

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Firebase Functions (Node 22) with Firebase Functions v2 API
- AI: Google Vertex AI (Gemini 2.5 Flash) via `@google-cloud/vertexai`
- Database: Firestore with security rules
- Auth: Firebase Authentication (Google Sign-In)
- Payments: Stripe
- Email: Mailgun (receiving & parsing emails)
- Analytics: Firebase Analytics (production only)
- CI/CD: GitHub Actions with multi-stage pipeline
- Internationalization: i18next (5 languages: EN, FR, ES, DE, PT)

## Template Setup

### First-Time Setup

Run the setup script to configure your project:

```bash
./scripts/setup-template.sh
```

This script will:
1. Ask for your project configuration (app name, domain, Firebase project ID, etc.)
2. Replace all `{{PLACEHOLDER}}` values throughout the codebase
3. Create your `.env` and `functions/.env.local` files

### Placeholders Used

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{APP_NAME}}` | Display name | "MyApp" |
| `{{APP_NAME_SLUG}}` | URL-safe slug | "my-app" |
| `{{DOMAIN}}` | Your domain | "myapp.com" |
| `{{PROJECT_ID}}` | Firebase project ID | "myapp-12345" |
| `{{COMPANY_NAME}}` | Legal company name | "MyApp Inc." |
| `{{COMPANY_ADDRESS}}` | Company address | "123 Main St" |
| `{{SUPPORT_EMAIL}}` | Support email | "support@myapp.com" |
| `{{TWITTER_HANDLE}}` | Twitter/X handle | "@myapp" |
| `{{COOKIE_PREFIX}}` | Cookie prefix | "myapp" |

## Development Requirements

**Node.js Version:**
- **Frontend (Vite 7)**: Requires Node.js 20.19+ or 22.12+
- **Backend (Firebase Functions)**: Requires Node.js 22
- **Recommended**: Use Node.js 22 for both frontend and backend

To check your Node version:
```bash
node --version  # Should show v20.19+ or v22+
```

## Development Commands

### Local Development
```bash
# Start dev server (frontend only, port 5173)
npm run dev

# Start Firebase emulators (Auth:9099, Functions:5001, Firestore:8080, UI:4000)
npm run emulators

# Type checking
npm run type-check

# Linting
npm run lint

# Build production bundle
npm run build
```

### Functions Development
```bash
cd functions

# Build TypeScript to JavaScript
npm run build

# Start Functions emulator only
npm run serve

# View Functions logs (production)
npm run logs
```

### Deployment
```bash
# Deploy everything (recommended - uses script)
./scripts/deploy-all.sh

# Deploy via npm scripts
npm run deploy              # Hosting + Functions
npm run deploy:hosting      # Hosting only
npm run deploy:functions    # Functions only

# Deploy via Firebase CLI
firebase deploy --only hosting,functions,firestore:rules,firestore:indexes
```

### Quality Checks (MANDATORY)
**IMPORTANT**: After completing ANY code changes, you MUST run these quality checks:

```bash
# 1. TypeScript type checking (REQUIRED)
npm run type-check

# 2. ESLint code quality (REQUIRED)
npm run lint
```

**Never consider a task complete without running both checks successfully.**

## Architecture

### Application Flow
1. **Free Trial (No Auth)**: Frontend calls `analyzeEmailGuest` → Function creates IP+fingerprint hash → checks `guestUsage` collection → if not used, calls Vertex AI → records usage with 30-day expiry
2. **User Authentication**: Firebase Auth with Google Sign-In → creates/updates user document in Firestore
3. **Main Action (Authenticated)**: Frontend calls Cloud Function → Function validates auth & usage limits → calls Vertex AI → updates usage counter → returns result
4. **Email Input (via Mailgun)**:
   - User clicks "Input by Email" → Frontend calls `createEmailAnalysisSession` → generates unique email address using Faker → stores session in Firestore
   - User sends content to unique address → Mailgun receives → triggers webhook → processes with Vertex AI
   - Frontend listens to session updates in real-time → displays results
5. **Subscription Management**: Stripe Checkout Session → webhook updates Firestore → UI reflects new plan

### Key Design Patterns

**Data Access Priority:**
- **ALWAYS prefer direct Firestore calls** from frontend over Cloud Functions when possible
- Only use Cloud Functions for: auth validation, server-side logic, API calls (Stripe, Vertex AI), writes requiring server timestamp

**Firebase Functions v2 API:**
All functions use the v2 callable syntax with destructured parameters:
```typescript
export const functionName = onCall(async ({ data, auth }) => {
  // auth.uid, auth.token available
  // data contains client payload
});
```

**Firestore FieldValue/Timestamp Import:**
CRITICAL: Always import from `firebase-admin/firestore`, NOT from `admin.firestore`:
```typescript
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
const db = getFirestore();

// Use directly:
createdAt: FieldValue.serverTimestamp()
periodEnd: Timestamp.fromDate(new Date())
```

**Environment Variables:**
- Frontend: `VITE_*` prefix required (e.g., `VITE_FIREBASE_API_KEY`)
- Functions (local): `functions/.env.local` (NOT `.env` - v2 requirement)
- Functions (prod): Vertex AI uses service account automatically (no API key needed)
- IMPORTANT: Variables starting with `FIREBASE_` are filtered out by Functions v2

### Data Model

**Firestore Collections:**
```
users/{userId}
  - email: string
  - subscriptionStatus: 'free' | 'active'
  - analysesUsedThisMonth: number
  - analysesLimit: number (5 for free, 250 for pro)
  - currentPeriodStart: Timestamp
  - currentPeriodEnd: Timestamp
  - stripeCustomerId?: string
  - subscriptionId?: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

  analyses/{analysisId}  (subcollection)
    - content: string
    - result: object (JSON result)
    - usageMetadata?: { promptTokens, candidatesTokens, totalTokens }
    - source?: 'text' | 'email'
    - createdAt: Timestamp

guestUsage/{fingerprintHash}
  - fingerprint: string (SHA-256 hash)
  - ipAddressHash: string (SHA-256 hash for privacy)
  - usedAt: Timestamp
  - expiresAt: Timestamp (30 days after usedAt)

emailSessions/{sessionId}
  - sessionId: string
  - emailAddress: string (unique generated address)
  - userId?: string (if authenticated)
  - status: 'waiting' | 'received' | 'analyzing' | 'completed' | 'error'
  - createdAt: Timestamp
  - expiresAt: Timestamp (24 hours)
```

### Cloud Functions

**Exported Functions:**
- `analyzeEmailGuest` - Guest action (no auth, IP+fingerprint tracking)
- `analyzeEmail` - Main action (requires auth, calls Vertex AI)
- `getUserSubscription` - Fetches user subscription data
- `createCheckoutSession` - Creates Stripe checkout
- `createPortalSession` - Opens Stripe billing portal
- `cancelSubscription` - Cancels Stripe subscription
- `stripeWebhook` - Handles Stripe events
- `createEmailAnalysisSession` - Generates unique email address
- `receiveEmailWebhook` - Mailgun webhook for emails
- `cleanExpiredSessionsScheduled` - Daily cleanup at 3 AM UTC

**Vertex AI Integration:**
- Model: `gemini-2.5-flash` (temperature: 0.3, max tokens: 8192)
- Prompt: See `functions/src/prompts.ts`
- Response parsing: `result.response.candidates?.[0]?.content?.parts?.[0]?.text`

**Free Trial Anti-Abuse System:**
Multi-layer protection:
1. **Backend (Primary)**: SHA-256 hash from IP + User-Agent + Accept-Language
2. **Frontend (Secondary)**: localStorage + cookie (30 days)
3. **Auto-cleanup**: Expired records deleted during each call
4. **Privacy**: IP addresses hashed, never stored in plain text

## CI/CD Pipeline

### GitHub Actions Workflows

#### Production Deployment (`.github/workflows/firebase-hosting-merge.yml`)
**Triggers:** Push to `master` branch

**Stages:**
1. **Quality Checks** - ESLint, TypeScript type-check
2. **Build** - Frontend + Functions builds, upload artifacts
3. **Deploy** - Download artifacts, deploy to Firebase

#### PR Preview Environment (`.github/workflows/firebase-hosting-pull-request.yml`)
**Triggers:** Pull request creation or update

**Features:**
- Automatic preview deployment to Firebase Preview Channel
- Quality checks (ESLint, TypeScript, Functions build validation)
- Temporary preview URLs (expire after 7 days)

**Required GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `DOMAIN` - Your production domain
- `VITE_FIREBASE_*` - All Firebase config variables
- `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` - reCAPTCHA Enterprise site key

**Service Account Permissions Required:**
- `Firebase Admin` role or specific roles:
  - `Firebase Rules Admin`
  - `Cloud Functions Developer`
  - `Firebase Hosting Admin`
  - `Cloud Datastore Index Admin`
  - `Service Account User`
  - `Secret Manager Viewer` + `Secret Manager Secret Accessor`
  - `Cloud Scheduler Admin` (for scheduled functions)

## Configuration Files

### Environment Files
- `.env` - Frontend Firebase config (VITE_* variables)
- `functions/.env.local` - Functions local config (Stripe, Mailgun, APP_NAME, APP_URL)
- `.env.example` - Template for required variables

### Firebase Configuration
- `firebase.json` - Defines hosting, functions, Firestore rules, emulator ports
- `firestore.rules` - Security rules
- `.firebaserc` - Project configuration

### Mailgun Configuration (for Email Input Feature)

**DNS Records (add to domain registrar):**
```
MX      {{DOMAIN}}  →  mxa.mailgun.org (priority 10)
MX      {{DOMAIN}}  →  mxb.mailgun.org (priority 10)
TXT     {{DOMAIN}}  →  v=spf1 include:mailgun.org ~all
TXT     k1._domainkey...  →  [DKIM key from Mailgun]
```

**Mailgun Route:**
```
Match Recipient: *@{{DOMAIN}}
Forward to: https://us-central1-{{PROJECT_ID}}.cloudfunctions.net/receiveEmailWebhook
```

## Internationalization (i18n)

Supports **5 languages**: English (EN), French (FR), Spanish (ES), German (DE), Portuguese (PT).

**Structure:**
```
public/locales/
  {lang}/
    translation.json  # Main UI strings
```

**Using translations:**
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('hero.title')}</h1>;
}
```

## Common Tasks

### Adding a New Cloud Function
1. Add function in `functions/src/index.ts` using v2 syntax
2. Build: `cd functions && npm run build`
3. Export in frontend: `src/services/firebase.ts`
4. Call from frontend: `await myFunction({ param: value })`

### Modifying the AI Prompt
Edit `functions/src/prompts.ts` → `createAnalysisPrompt()` function.

### Changing Subscription Limits
Update in `functions/src/index.ts`:
- Free tier: `analysesLimit: 5`
- Pro tier: `analysesLimit: 250`

### Adding a New Secret to Firebase Functions

1. Create secret: `firebase functions:secrets:set SECRET_NAME`
2. Grant permissions to service accounts:
   ```bash
   gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
     --member="serviceAccount:SA_EMAIL" \
     --role="roles/secretmanager.viewer"
   gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
     --member="serviceAccount:SA_EMAIL" \
     --role="roles/secretmanager.secretAccessor"
   ```
3. Use in function: `const mySecret = defineSecret('SECRET_NAME');`

## Known Issues & Gotchas

### Firebase Functions v2 Specifics
- Must use `.env.local` not `.env` for local development
- Cannot use variables starting with `FIREBASE_` prefix
- Do NOT call `dotenv.config()` manually - Functions v2 auto-loads `.env.local`

### Vertex AI Response Parsing
Access text via: `result.response.candidates?.[0]?.content?.parts?.[0]?.text`

### Firebase Analytics
Only loads in production: `if (import.meta.env.PROD && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)`

### Stripe Integration
- Test mode in development (keys in `.env.local`)
- Production: `firebase functions:config:set stripe.secret_key="sk_live_..."`
- Webhook URL: `https://us-central1-{{PROJECT_ID}}.cloudfunctions.net/stripeWebhook`

## Deployment Checklist

Before deploying to production:
1. Run `./scripts/setup-template.sh` to configure all placeholders
2. Configure GitHub Secrets (all VITE_* variables, FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID, DOMAIN)
3. Ensure service account has Firebase Admin role
4. Set Stripe LIVE keys via `firebase functions:config:set`
5. Configure Stripe webhook with production URL
6. Add your domain to Firebase Auth authorized domains
7. Test in emulators first: `npm run emulators`

## Documentation Structure

All documentation is organized in the `docs/` directory:

- **Setup** (`docs/setup/`): Installation and configuration guides
- **Deployment** (`docs/deployment/`): CI/CD and deployment guides
- **Guides** (`docs/guides/`): User and developer guides
- **i18n** (`docs/i18n/`): Internationalization documentation

See `docs/README.md` for the complete documentation index.

## Performance Optimizations

The template includes performance optimizations:
- **Code Splitting**: React components and routes split into multiple chunks
- **Lazy Loading**: Heavy components loaded on demand
- **Critical CSS**: Inlined in HTML head for faster render
- **DNS Preconnect**: Early connection hints for Firebase and Google APIs
- **Cache Headers**: 1-year immutable cache for static assets
- **Build Optimization**: esbuild minification, vendor chunk separation
