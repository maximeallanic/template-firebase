# Deployment Summary

## 🚀 Complete CI/CD Configuration

### Automatically Deployed Services

When you push to `master`, the GitHub Actions pipeline **automatically** deploys:

| Service | Description | Files Deployed |
|---------|-------------|----------------|
| **🌐 Hosting** | Frontend React/Vite | `dist/` |
| **⚡ Functions** | Backend Node.js | `functions/lib/` |
| **🔒 Firestore Rules** | Security rules | `firestore.rules` |
| **📊 Firestore Indexes** | Query indexes | `firestore.indexes.json` |

### GitHub Actions Workflow

**File:** `.github/workflows/firebase-hosting-merge.yml`

**Stages:**
1. **Quality Checks** - ESLint + TypeScript
2. **Build** - Frontend + Functions
3. **Deploy** - All Firebase services

**Deployment command:**
```bash
firebase deploy \
  --only hosting,functions,firestore:rules,firestore:indexes \
  --project {{PROJECT_ID}} \
  --non-interactive \
  --force
```

---

## 📋 Deployment Checklist

### Before Deploying

- [ ] Local tests pass (emulators)
- [ ] Build succeeds without errors
- [ ] Environment variables are configured
- [ ] GitHub secrets are up to date

### Automatic Deployment (Recommended)

```bash
git add .
git commit -m "feat: description of change"
git push origin master
```

**Duration:** ~5-8 minutes

### Manual Deployment

```bash
# Option 1: Automatic script
./scripts/deploy-all.sh

# Option 2: Direct Firebase CLI
firebase deploy --project {{PROJECT_ID}}
```

---

## 🔐 Environment Variables and Secrets

### Frontend (.env)

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN={{PROJECT_ID}}.firebaseapp.com
VITE_FIREBASE_PROJECT_ID={{PROJECT_ID}}
VITE_FIREBASE_STORAGE_BUCKET={{PROJECT_ID}}.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_recaptcha_key
```

### Backend Functions (functions/.env.local)

```bash
GOOGLE_API_KEY=your_api_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### GitHub Secrets

Configured in: **Settings → Secrets and variables → Actions**

- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON
- `FIREBASE_PROJECT_ID` - Your project ID
- `DOMAIN` - Your production domain
- All `VITE_*` variables

---

## 🔥 Deployed Firebase Services

### 1. Firebase Hosting

- **Production URL:** https://{{DOMAIN}}
- **Alternative URL:** https://{{PROJECT_ID}}.web.app
- **Content:** Compiled React/Vite application
- **Cache:** Automatic (Firebase CDN)

### 2. Cloud Functions

- **Region:** us-central1
- **Deployed Functions:**
  - `analyzeEmail` - AI analysis
  - `analyzeEmailGuest` - Guest analysis with fingerprinting
  - `getUserSubscription` - Get subscription
  - `createCheckoutSession` - Create Stripe session
  - `createPortalSession` - Stripe customer portal
  - `cancelSubscription` - Cancel subscription
  - `stripeWebhook` - Stripe webhook
  - `createEmailAnalysisSession` - Email-based analysis
  - `receiveEmailWebhook` - Mailgun webhook

### 3. Firestore Database

- **Security rules:** `firestore.rules`
- **Indexes:** `firestore.indexes.json`
- **Collections:**
  - `users` - User data and subscriptions
  - `guestUsage` - Guest trial tracking
  - `emailSessions` - Email-based analysis sessions

---

## 📊 Monitoring and Logs

### View Logs

```bash
# All Functions logs
firebase functions:log --project {{PROJECT_ID}}

# Specific function logs
firebase functions:log --only analyzeEmail --project {{PROJECT_ID}}

# Real-time logs
firebase functions:log --tail --project {{PROJECT_ID}}
```

### Firebase Console

1. **Functions:** https://console.firebase.google.com/project/{{PROJECT_ID}}/functions
2. **Hosting:** https://console.firebase.google.com/project/{{PROJECT_ID}}/hosting
3. **Firestore:** https://console.firebase.google.com/project/{{PROJECT_ID}}/firestore
4. **Analytics:** https://console.firebase.google.com/project/{{PROJECT_ID}}/analytics

---

## 🐛 Troubleshooting

### Deployment fails on GitHub Actions

**Possible causes:**
1. Expired or invalid service account
2. Build fails (TypeScript/ESLint errors)
3. Firebase quota exceeded

**Solutions:**
```bash
# Check workflow
cat .github/workflows/firebase-hosting-merge.yml

# Test build locally
npm run build
cd functions && npm run build

# Verify GitHub secrets
# Settings → Secrets → FIREBASE_SERVICE_ACCOUNT
```

### Functions won't deploy

**Check:**
```bash
# Functions build succeeds
cd functions
npm run build
ls -la lib/

# Deploy functions only
firebase deploy --only functions --project {{PROJECT_ID}}
```

### Firestore rules won't update

**Check:**
```bash
# Rules syntax
firebase firestore:rules --project {{PROJECT_ID}}

# Deploy rules only
firebase deploy --only firestore:rules --project {{PROJECT_ID}}
```

---

## ✅ Post-Deployment Verification

After each deployment, verify:

1. **Hosting accessible:**
   ```bash
   curl -I https://{{DOMAIN}}
   # Should return HTTP 200
   ```

2. **Functions active:**
   - Firebase Console → Functions
   - All functions in "Active" status

3. **Analytics functional (production only):**
   - Firebase Console → Analytics → Realtime
   - Visit site and verify appearance in Realtime

4. **Functional test:**
   - Sign up/Sign in
   - Test main action
   - Verify usage in profile

---

## 🎯 Quick Commands

```bash
# Complete automatic deployment
./scripts/deploy-all.sh

# Selective manual deployment
firebase deploy --only hosting --project {{PROJECT_ID}}
firebase deploy --only functions --project {{PROJECT_ID}}
firebase deploy --only firestore:rules,firestore:indexes --project {{PROJECT_ID}}

# Monitoring
firebase functions:log --tail --project {{PROJECT_ID}}
```
