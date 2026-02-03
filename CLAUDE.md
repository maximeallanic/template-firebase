# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## TEMPLATE SETUP (First-time configuration)

> **IMPORTANT**: This section is for initial project setup only. Once the project is configured, Claude MUST:
> 1. **DELETE** this entire "TEMPLATE SETUP" section
> 2. **UPDATE** "Project Overview" with the actual project name and description
> 3. **ANALYZE** the codebase to understand what the project does
> 4. **DOCUMENT** the project's features in the "Project Features" section by breaking down functionality into logical categories

### Step 1: Help the User Define Their Project

Before any technical setup, Claude MUST have a conversation with the user to understand their project. Ask these questions one by one (use AskUserQuestion tool):

**1. Project Vision**
- "What is the name of your application?"
- "In one sentence, what does your app do?"
- "Who are your target users?" (e.g., freelancers, small businesses, consumers)

**2. Business Model**
- "What's your monetization strategy?"
  - Free only
  - Freemium (free + paid tier)
  - Subscription only
  - One-time purchase
- "What features will be free vs premium?"

**3. Core Features**
- "What are the 3-5 main features your users need?"
- "Do you need real-time features?" (live updates, collaboration)
- "Do you need file uploads/storage?"

**4. Technical Scope**
- "Which platforms do you need?"
  - Web only
  - Web + Mobile (iOS/Android)
  - Web + PWA
- "Which languages do you need to support?" (default: EN, FR, ES, DE, PT)

**5. Existing Resources**
- "Do you already have a Firebase project created?"
- "Do you have a domain name?"
- "Do you have a Stripe account?"

After gathering answers, Claude should **summarize the project** and confirm with the user before proceeding.

### Step 2: Create Firebase & Google Cloud Project (CLI Automated)

Claude can automate most of the setup using CLI commands. The user only needs to:
1. Configure OAuth consent screen manually (Google requirement)
2. Create OAuth credentials manually (copy the client ID)

**2.1 Create Firebase Project (CLI)**
```bash
# Check if gcloud is authenticated
gcloud auth list

# Create Firebase project (PROJECT_ID must be globally unique)
firebase projects:create <project-id> --display-name "<App Name>"

# Set as default project
firebase use <project-id>
```

**2.2 Link Billing Account (Required for Functions)**
```bash
# List available billing accounts
gcloud billing accounts list

# Link billing account to project
gcloud billing projects link <project-id> --billing-account=<BILLING_ACCOUNT_ID>
```

**2.3 Enable Required APIs (CLI)**
```bash
# Enable all required Google Cloud APIs
gcloud services enable \
  firebase.googleapis.com \
  firestore.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  identitytoolkit.googleapis.com \
  firebaserules.googleapis.com \
  firebasehosting.googleapis.com \
  firebasestorage.googleapis.com \
  storage.googleapis.com \
  --project=<project-id>

# If using Google Drive API (for Drive integrations)
gcloud services enable drive.googleapis.com --project=<project-id>

# If using Gemini/AI features
gcloud services enable generativelanguage.googleapis.com --project=<project-id>
```

**2.4 Create Firestore Database (CLI)**
```bash
gcloud firestore databases create --location=eur3 --project=<project-id>
```

**2.5 Register Web App & Get Config (CLI)**
```bash
# Create web app (returns app ID)
firebase apps:create WEB "<App Name>" --project=<project-id>

# Get Firebase config (save this output)
firebase apps:sdkconfig WEB --project=<project-id>
```

**2.6 Configure OAuth Consent Screen (MANUAL - Required by Google)**

Ask the user to configure OAuth consent screen:
```
1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=<project-id>
2. Choose "External" user type
3. Fill in:
   - App name: <App Name>
   - User support email: <user's email>
   - Developer contact: <user's email>
4. Add scopes:
   - email, profile, openid
   - If using Drive: https://www.googleapis.com/auth/drive
5. Save and continue through all steps
```

**2.7 Create OAuth Web Client ID (MANUAL)**

Ask user to create OAuth credentials:
```
1. Go to: https://console.cloud.google.com/apis/credentials?project=<project-id>
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "<App Name> Web Client"
5. Authorized JavaScript origins:
   - http://localhost:5173
   - https://<domain>
   - https://<project-id>.web.app
6. Authorized redirect URIs:
   - http://localhost:5173
   - https://<domain>
   - https://<project-id>.web.app
7. Copy the Client ID (format: xxxxx.apps.googleusercontent.com)
```

**2.8 Create Service Account for CI/CD (CLI)**
```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=<project-id>

# Grant required roles
for role in firebase.admin cloudfunctions.admin iam.serviceAccountUser firebasehosting.admin; do
  gcloud projects add-iam-policy-binding <project-id> \
    --member="serviceAccount:github-actions@<project-id>.iam.gserviceaccount.com" \
    --role="roles/$role"
done

# Create and download key
gcloud iam service-accounts keys create /tmp/sa-key.json \
  --iam-account=github-actions@<project-id>.iam.gserviceaccount.com

# Base64 encode for GitHub secret
cat /tmp/sa-key.json | base64 -w 0
# Save this output for FIREBASE_SERVICE_ACCOUNT GitHub secret

# Clean up local key file
rm /tmp/sa-key.json
```

**2.9 Create API Keys (CLI)**
```bash
# Create Gemini API key (if using AI features)
# Note: API keys created via CLI. User can also create manually at:
# https://console.cloud.google.com/apis/credentials?project=<project-id>
```

### Step 3: Gather Project Information

Collect or confirm these values from the user:

| Information | Description | Example |
|-------------|-------------|---------|
| **App Name** | Display name | "My SaaS App" |
| **App ID** | Bundle ID for mobile | "com.company.myapp" |
| **Domain** | Production domain | "myapp.com" |
| **Firebase Project ID** | From Firebase Console | "my-saas-12345" |
| **App Description** | Short SEO description | "The best productivity tool" |
| **Firebase Config** | apiKey, authDomain, etc. | From Step 2.3 |
| **Google OAuth Client IDs** | Web, Android, iOS | From Step 2.4 |

### Step 4: Replace Placeholders (CLI Automated)

Claude can replace all placeholders using sed commands:

| Placeholder | Value from |
|-------------|------------|
| `{{APP_NAME}}` | Step 1 - App name |
| `{{APP_ID}}` | Step 3 - Bundle ID |
| `{{APP_DESCRIPTION}}` | Step 1 - Description |
| `{{DOMAIN}}` | Step 3 - Domain |
| `{{PROJECT_ID}}` | Step 2 - Firebase project ID |
| `{{GOOGLE_WEB_CLIENT_ID}}` | Step 2.7 - OAuth Web Client |
| `{{GOOGLE_ANDROID_CLIENT_ID}}` | (Leave empty or create later for mobile) |
| `{{GOOGLE_IOS_CLIENT_ID}}` | (Leave empty or create later for mobile) |

**Automated replacement commands:**
```bash
# Set variables
APP_NAME="My App Name"
APP_ID="com.company.myapp"
APP_DESCRIPTION="My app description"
DOMAIN="myapp.com"
PROJECT_ID="my-project-id"
GOOGLE_WEB_CLIENT_ID="xxxxx.apps.googleusercontent.com"

# Find and replace in all files (excluding node_modules, .git, dist)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.gradle" -o -name "*.plist" -o -name "*.webmanifest" -o -name "*.txt" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" \
  -exec sed -i "s/{{APP_NAME}}/$APP_NAME/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.gradle" -o -name "*.plist" -o -name "*.webmanifest" -o -name "*.txt" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" \
  -exec sed -i "s/{{APP_ID}}/$APP_ID/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.gradle" -o -name "*.plist" -o -name "*.webmanifest" -o -name "*.txt" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" \
  -exec sed -i "s/{{APP_DESCRIPTION}}/$APP_DESCRIPTION/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.gradle" -o -name "*.plist" -o -name "*.webmanifest" -o -name "*.txt" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" \
  -exec sed -i "s/{{DOMAIN}}/$DOMAIN/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.gradle" -o -name "*.plist" -o -name "*.webmanifest" -o -name "*.txt" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" \
  -exec sed -i "s/{{PROJECT_ID}}/$PROJECT_ID/g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.html" -o -name "*.md" -o -name "*.xml" -o -name "*.gradle" -o -name "*.plist" -o -name "*.webmanifest" -o -name "*.txt" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" \
  -exec sed -i "s/{{GOOGLE_WEB_CLIENT_ID}}/$GOOGLE_WEB_CLIENT_ID/g" {} \;

# For Android/iOS client IDs (leave empty for now, fill when building mobile apps)
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.plist" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  -exec sed -i "s/{{GOOGLE_ANDROID_CLIENT_ID}}//g" {} \;

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.plist" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  -exec sed -i "s/{{GOOGLE_IOS_CLIENT_ID}}//g" {} \;
```

**Files containing placeholders:**
- `.firebaserc`, `capacitor.config.ts`, `index.html`
- `public/manifest.webmanifest`, `public/metadata.json`, `public/robots.txt`
- `functions/src/index.ts` (ALLOWED_ORIGINS)
- `android/app/build.gradle`, `ios/App/App/Info.plist`
- `public/locales/*/home.json` (all languages)
- Documentation files in `docs/`

### Step 4.5: Setup GitHub Repository (CLI Automated)

Claude can create and configure the GitHub repository:

```bash
# Create GitHub repository (if not exists)
gh repo create <org>/<repo-name> --public --source=. --remote=origin

# Or if repo exists, just add remote
git remote add origin git@github.com:<org>/<repo-name>.git

# Set GitHub secrets (run each command)
gh secret set FIREBASE_SERVICE_ACCOUNT --body="<base64-encoded-service-account-key>"
gh secret set VITE_FIREBASE_API_KEY --body="<api-key>"
gh secret set VITE_FIREBASE_AUTH_DOMAIN --body="<project-id>.firebaseapp.com"
gh secret set VITE_FIREBASE_PROJECT_ID --body="<project-id>"
gh secret set VITE_FIREBASE_STORAGE_BUCKET --body="<project-id>.firebasestorage.app"
gh secret set VITE_FIREBASE_MESSAGING_SENDER_ID --body="<sender-id>"
gh secret set VITE_FIREBASE_APP_ID --body="<app-id>"
gh secret set VITE_FIREBASE_DATABASE_URL --body="https://<project-id>-default-rtdb.firebaseio.com"
gh secret set VITE_RECAPTCHA_ENTERPRISE_SITE_KEY --body="<recaptcha-key>"  # Optional
gh secret set VITE_GOOGLE_WEB_CLIENT_ID --body="<oauth-client-id>"

# If using Stripe
gh secret set STRIPE_SECRET_KEY --body="<stripe-secret-key>"
gh secret set STRIPE_WEBHOOK_SECRET --body="<stripe-webhook-secret>"
```

### Step 5: Configure Environment Files

**Frontend (.env)**
```bash
cp .env.example .env
```
Then edit `.env` with Firebase config:
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_DATABASE_URL=https://project-id-default-rtdb.firebaseio.com
```

**Functions (functions/.env.local)**
```bash
cp functions/.env.example functions/.env.local
```
Then edit with:
```
APP_NAME=My SaaS App
APP_URL=https://myapp.com
```

**Production Secrets (Stripe)**
```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### Step 6: Install, Build & Test

```bash
# Install dependencies
npm install
cd functions && npm install && cd ..

# Verify configuration
npm run type-check
npm run lint
npm run build

# Test locally with emulators
npm start

# Login to Firebase CLI (if not already)
firebase login

# Select project
firebase use <project-id>
```

### Step 7: Initial Deployment

**Option A: Manual deployment (for testing)**
```bash
# Deploy everything
firebase deploy

# Or deploy separately
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

**Option B: CI/CD deployment via version tag (recommended for production)**
```bash
# Commit all changes
git add -A
git commit -m "feat: initialize <App Name> project"
git push origin master

# Create version tag to trigger GitHub Actions deployment
git tag v0.1.0
git push origin v0.1.0
```

The GitHub Actions workflow (`.github/workflows/create-release.yml`) will:
1. Run quality checks (lint, type-check)
2. Build frontend and functions
3. Deploy to Firebase Hosting and Functions
4. Create a GitHub release

### Step 8: Update This File (CRITICAL)

After setup is complete, Claude MUST:

1. **DELETE** this entire "TEMPLATE SETUP" section (from `## TEMPLATE SETUP` to this step)
2. **UPDATE** the "Project Overview" section with:
   - Actual project name
   - What the project does
   - Target users
   - Business model
3. **ANALYZE** the codebase and **DOCUMENT** features:
   - Read through `src/pages/`, `src/components/`, `functions/src/`
   - Identify all implemented features
   - Group features into logical categories
   - Update the "Project Features" section below
4. **ADD** any project-specific notes or conventions

---

## Project Overview

**Firebase SaaS Template** - A production-ready template for quickly bootstrapping Firebase-based SaaS applications with authentication, payments, internationalization, and mobile support.

This is a **template repository**. When creating a new project from this template, Claude will guide you through the setup process using the "TEMPLATE SETUP" section above.

**What's included:**
- Complete authentication flow (Email + Google Sign-In)
- Stripe subscription billing with multi-currency support
- 5-language internationalization (EN, FR, ES, DE, PT)
- Mobile apps via Capacitor (iOS + Android)
- PWA support with offline capabilities
- CI/CD pipelines for automated deployments
- PR preview environments

<!--
INSTRUCTIONS FOR CLAUDE (when setting up a new project):
After template setup, replace this section with actual project info. Example:

**TaskMaster Pro** is a productivity SaaS application that helps freelancers and small teams manage tasks, track time, and generate invoices. Built with Firebase, React, and TypeScript.

**Target Users:** Freelancers, small agencies, remote teams
**Business Model:** Freemium with Pro subscription ($9/month)
-->

## Project Features

<!--
INSTRUCTIONS FOR CLAUDE:
After template setup, analyze the codebase and document all features.
Break down into logical categories. Example:

### User Management
- **Authentication**: Email/password + Google Sign-In
- **Profile**: Avatar, display name, preferences
- **Account Deletion**: GDPR-compliant data removal

### Core Features
- **Task Board**: Kanban-style task management
- **Time Tracking**: Start/stop timer per task
- **Projects**: Organize tasks by project
- **Tags**: Color-coded task categorization

### Collaboration
- **Team Invites**: Invite members via email
- **Shared Projects**: Real-time collaboration
- **Activity Feed**: Track team actions

### Billing
- **Free Tier**: 3 projects, 50 tasks
- **Pro Tier**: Unlimited projects, priority support
- **Stripe Integration**: Secure payment processing
-->

**Template Base Features (update after customization):**
- **Authentication**: Firebase Auth (Email + Google Sign-In)
- **Payments**: Stripe subscriptions with multi-currency (EUR, USD, GBP, BRL)
- **Internationalization**: 5 languages (EN, FR, ES, DE, PT)
- **Mobile**: Capacitor for iOS & Android native apps
- **PWA**: Installable Progressive Web App
- **CI/CD**: GitHub Actions with preview deployments

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend**: Firebase Functions (Node 22) with v2 API
- **Database**: Firestore (user data) + Realtime Database (real-time features)
- **Auth**: Firebase Authentication
- **Payments**: Stripe
- **CI/CD**: GitHub Actions

## Development Commands

### Local Development
```bash
npm start                 # Dev server + emulators (recommended)
npm run dev              # Frontend only (port 5173)
npm run emulators        # Firebase emulators only (Auth:9099, Functions:5001, Firestore:8080)
```

### Quality Checks (MANDATORY)
```bash
npm run type-check       # TypeScript checking
npm run lint             # ESLint
```
**Never consider a task complete without running both checks successfully.**

### Build & Deploy
```bash
npm run build            # Production build
./scripts/deploy-all.sh  # Deploy everything
npm run deploy           # Hosting + Functions
```

### Functions
```bash
cd functions
npm run build            # Build TypeScript
npm run serve            # Functions emulator
npm run logs             # View production logs
```

## Architecture

### Firebase Functions v2 Pattern
```typescript
export const functionName = onCall(async ({ data, auth }) => {
  // auth.uid, auth.token available
  // data contains client payload
});
```

### Data Model (Firestore)
```
users/{userId}
  - email: string
  - emailVerified: boolean
  - profileName: string
  - subscriptionStatus: 'free' | 'active' | 'cancelled'
  - stripeCustomerId?: string
  - hasPremiumAccess: boolean
  - createdAt, updatedAt: Timestamp

processedWebhooks/{eventId}
  - eventType: string
  - processedAt: Timestamp
```

### Cloud Functions
- `getUserSubscription` - Fetch user subscription
- `createCheckoutSession` - Stripe checkout
- `createPortalSession` - Stripe billing portal
- `cancelSubscription` - Cancel subscription
- `stripeWebhook` - Handle Stripe events
- `deleteAccount` - GDPR account deletion

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication (AuthModal, AuthRequired, ProfileEdit...)
│   ├── layout/         # Layout (PersistentHeader)
│   ├── pwa/            # PWA (PWAHomePage, QuickSettings...)
│   ├── subscription/   # Payments (UpgradeModal, UsageBanner...)
│   └── ui/             # Shared UI (Logo, Spinner, PageTransition...)
├── pages/              # Route pages (HomePage, Dashboard, Login...)
├── services/           # Firebase, API, platform services
├── hooks/              # Custom React hooks
├── contexts/           # React contexts (Toast)
├── types/              # TypeScript types
├── animations/         # Framer Motion variants
├── i18n/               # Internationalization config
├── utils/              # Utility functions
└── config/             # App configuration (pricing)

functions/src/
├── index.ts            # Function exports
└── config/             # Firebase Admin setup

public/locales/         # Translation files (en, fr, es, de, pt)
```

## Common Tasks

### Adding a Cloud Function
1. Add in `functions/src/index.ts` using v2 syntax
2. Build: `cd functions && npm run build`
3. Export in `src/services/firebase.ts`
4. Call: `await myFunction({ param: value })`

### Adding a Page
1. Create in `src/pages/{PageName}.tsx`
2. Add route in `src/App.tsx`
3. Wrap with `<AuthRequired>` if protected

### Adding Translations
1. Add keys to `public/locales/{lang}/*.json` (all 5 languages)
2. Use `useTranslation(namespace)` from react-i18next

## Known Issues & Gotchas

- **Firebase Functions v2**: Use `.env.local` not `.env`, no `FIREBASE_` prefix variables
- **Stripe secrets**: Use `firebase functions:secrets:set`, never commit keys
- **PWA hooks**: `useAppInstall()`, `useOrientationLock()`, `useHaptic()`

## CI/CD

- **Production**: Push version tag (`v*`) → Deploy to Firebase
- **PR Preview**: Create PR → Automatic preview URL (7 days)
- **Mobile**: Version tag → iOS TestFlight + Android Play Store
