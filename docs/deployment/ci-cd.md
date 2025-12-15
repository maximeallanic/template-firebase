# CI/CD Deployment Guide

This document explains the automatic CI/CD pipeline and deployment process.

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Automatic Deployment (CI/CD)](#automatic-deployment)
3. [Manual Deployment](#manual-deployment)
4. [Secrets Configuration](#secrets-configuration)
5. [Verification](#deployment-verification)
6. [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

The application uses 3 Firebase services:

| Service | Description | Local Port |
|---------|-------------|------------|
| **🌐 Firebase Hosting** | Frontend React + Vite | 5173 |
| **⚡ Cloud Functions** | Backend with AI + Stripe | 5001 |
| **🔥 Firestore** | Database + security rules | 8080 |

## 🚀 Automatic Deployment

### Push to `master` → Full Deployment

```bash
git add .
git commit -m "feat: new feature"
git push origin master
```

**GitHub Actions Pipeline (automatic):**

```
┌─────────────────────────────────────────────┐
│ Stage 1: Quality Checks (~1-2 min)         │
├─────────────────────────────────────────────┤
│ ✓ ESLint                                    │
│ ✓ TypeScript type-check                     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│ Stage 2: Build (~2-3 min)                   │
├─────────────────────────────────────────────┤
│ ✓ Build frontend (Vite)                     │
│ ✓ Build functions (TypeScript)              │
│ ✓ Upload artifacts (dist/ + functions/lib/) │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│ Stage 3: Deploy (~2-3 min)                  │
├─────────────────────────────────────────────┤
│ ✓ Download artifacts                        │
│ ✓ Install production dependencies           │
│ ✓ Deploy to Firebase:                       │
│   - Hosting (dist/)                          │
│   - Functions (functions/lib/)               │
│   - Firestore Rules (firestore.rules)       │
│   - Firestore Indexes (firestore.indexes)   │
└─────────────────────────────────────────────┘

Total: ~5-8 minutes
```

**The workflow automatically deploys:**
- ✅ **Hosting** - React frontend (optimized Vite build)
- ✅ **Functions** - Compiled TypeScript backend (AI + Stripe)
- ✅ **Firestore Rules** - Database security rules
- ✅ **Firestore Indexes** - Optimized query indexes

### Pull Requests → Preview

Each PR triggers:
1. Quality checks (lint + types)
2. Complete build
3. Deployment to temporary URL (expires after 7 days)
4. Automatic comment with preview link

## 🛠️ Manual Deployment

### Option 1: Automatic Script ⭐ (Recommended)

```bash
./scripts/deploy-all.sh
```

The script handles everything:
- Verifies Firebase CLI
- Builds frontend + functions
- Type checking
- Asks for confirmation
- Deploys everything
- Shows colored summary

### Option 2: Firebase CLI

```bash
# Deploy EVERYTHING (Hosting + Functions + Firestore)
firebase deploy --project spicy-vs-sweety

# Deploy hosting only
npm run build
firebase deploy --only hosting --project spicy-vs-sweety

# Deploy functions only
cd functions && npm run build && cd ..
firebase deploy --only functions --project spicy-vs-sweety

# Deploy Firestore rules only
firebase deploy --only firestore:rules --project spicy-vs-sweety

# Deploy Firestore indexes only
firebase deploy --only firestore:indexes --project spicy-vs-sweety

# Deploy rules + indexes together
firebase deploy --only firestore:rules,firestore:indexes --project spicy-vs-sweety

# Deploy Hosting + Functions + Firestore (like CI/CD)
firebase deploy --only hosting,functions,firestore:rules,firestore:indexes --project spicy-vs-sweety
```

### Option 3: npm Scripts

```bash
npm run deploy              # Everything
npm run deploy:hosting      # Hosting only
npm run deploy:functions    # Functions only
```

## 🔐 Secrets Configuration

### GitHub Actions Secrets

In Settings > Secrets and variables > Actions, configure:

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON |
| `FIREBASE_PROJECT_ID` | Firebase Project ID |
| `DOMAIN` | Your production domain |
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | reCAPTCHA Enterprise Site Key |
| `GITHUB_TOKEN` | Auto-generated |

**How to configure these secrets:**

1. Go to **GitHub > Your Repository > Settings > Secrets and variables > Actions**
2. Click **"New repository secret"**
3. Add each secret with its name and value
4. Values are available in your local `.env` file

**⚠️ IMPORTANT:** Firebase environment variables are **public** (embedded in client-side JavaScript bundle). They are not sensitive because security is ensured by Firebase Security Rules.

### Firebase Functions Secrets (Production)

```bash
# Configure Stripe LIVE keys
firebase functions:config:set \
  stripe.secret_key="sk_live_..." \
  stripe.webhook_secret="whsec_..." \
  --project spicy-vs-sweety

# Verify
firebase functions:config:get --project spicy-vs-sweety

# Deploy with new config
firebase deploy --only functions --project spicy-vs-sweety
```

⚠️ **IMPORTANT:**
- ✅ **LIVE** keys (`sk_live_...`) in production
- ✅ **TEST** keys (`sk_test_...`) in development
- ❌ NEVER commit keys
- ✅ Stripe Webhook: `https://us-central1-spicy-vs-sweety.cloudfunctions.net/stripeWebhook`

### Local Environment Variables

File `functions/.env.local` (development):
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## ✅ Deployment Verification

### 1. Application Online

```bash
# Open the application
open https://spicy-vs-sweet.com

# Firebase Hosting Console
open https://console.firebase.google.com/project/spicy-vs-sweety/hosting
```

### 2. Functions

```bash
# Real-time logs
firebase functions:log --project spicy-vs-sweety --lines 50

# List functions
firebase functions:list --project spicy-vs-sweety
```

### 3. Functional Tests

Test checklist:
- [ ] Sign in / Sign up
- [ ] Main action (with free account)
- [ ] Detailed results display
- [ ] Usage counter (5 max free)
- [ ] "Upgrade to Pro" button
- [ ] Stripe payment (test card: `4242 4242 4242 4242`)
- [ ] Limit increase after payment

## 🔄 Rollback

### Hosting

```bash
# View history
firebase hosting:channel:list --project spicy-vs-sweety

# Rollback (or redeploy an old commit)
git checkout <old-commit>
npm run build
firebase deploy --only hosting
git checkout master
```

### Functions

```bash
# Redeploy a previous version
git checkout <old-commit>
cd functions && npm run build && cd ..
firebase deploy --only functions
git checkout master
```

### Firestore Rules

In the Firebase Console:
1. Firestore > Rules
2. Select previous version
3. Publish

## 🔧 Troubleshooting

### ❌ Build failed

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

cd functions
rm -rf node_modules package-lock.json
npm install
cd ..

# Test locally
npm run build
npm run type-check
```

### ❌ Functions deployment failed

```bash
# Check logs
firebase functions:log --project spicy-vs-sweety

# Verify lib/ exists
cd functions
npm run build
ls -la lib/  # Should contain index.js
cd ..

# Redeploy
firebase deploy --only functions --project spicy-vs-sweety
```

### ❌ Stripe webhook not working

1. Check webhook in Stripe Dashboard
2. Correct URL: `https://us-central1-spicy-vs-sweety.cloudfunctions.net/stripeWebhook`
3. Configured events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Signing secret copied to Functions config

### ❌ GitHub Actions failing

1. Go to repository "Actions" tab
2. Click on the failed workflow
3. Check logs
4. Verify `FIREBASE_SERVICE_ACCOUNT` secret
5. Re-trigger the workflow

### ❌ Error 403: "The caller does not have permission"

If you see this error when deploying Firestore rules:
```
Error: Request to https://firebaserules.googleapis.com/v1/projects/spicy-vs-sweety:test had HTTP Error: 403
```

**Solution:** The service account doesn't have necessary permissions.

1. **Go to Google Cloud Console > IAM:**
   ```
   https://console.cloud.google.com/iam-admin/iam?project=spicy-vs-sweety
   ```

2. **Find the service account** used (visible in the GitHub secret JSON)

3. **Add the role:** `Firebase Admin`

4. **Or add these specific roles:**
   - `Firebase Rules Admin`
   - `Cloud Functions Developer`
   - `Firebase Hosting Admin`
   - `Cloud Datastore Index Admin`

📄 See complete guide: [service-account.md](./service-account.md)

## 📊 Monitoring

### Important Metrics

| Metric | Where to View | Alert Threshold |
|--------|---------------|-----------------|
| Functions Errors | Firebase Console > Functions | > 5% |
| Functions Latency | Firebase Console > Functions | > 2s |
| AI Cost | Google Cloud Console > Billing | > budget |
| Hosting Traffic | Firebase Console > Hosting | Monitor |
| Stripe Errors | Stripe Dashboard > Developers > Logs | Any |

### Useful Commands

```bash
# Real-time Functions logs
firebase functions:log --follow

# Usage stats
firebase projects:list

# Deployed version
firebase hosting:channel:list
```

## 🌐 Important URLs

| Service | URL |
|---------|-----|
| 🌐 **Production** | https://spicy-vs-sweet.com |
| 🔥 **Firebase Console** | https://console.firebase.google.com/project/spicy-vs-sweety |
| 💳 **Stripe Dashboard** | https://dashboard.stripe.com/ |
| 🤖 **GitHub Actions** | Check your repository's Actions tab |
| 📊 **Google Cloud Console** | https://console.cloud.google.com/ |

## 📚 Documentation

- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore](https://firebase.google.com/docs/firestore)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
