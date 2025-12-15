# Complete Setup Guide

Step-by-step guide to deploy the Firebase + React SaaS Template with Vertex AI, Authentication, and Stripe.

## 📋 Prerequisites

- Node.js 22+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Google Cloud account (for Firebase/Vertex AI)
- Stripe account (for payments)

---

## 🚀 Step 1: Run Setup Script

Before anything else, run the setup script to configure your project:

```bash
./scripts/setup-template.sh
```

This will:
- Ask for your project details (app name, domain, project ID, etc.)
- Replace all placeholders in the codebase
- Create initial configuration files

---

## 🔥 Step 2: Firebase Project Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Project name: Your chosen name
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Required Services

#### Authentication:
1. In Firebase Console → Authentication
2. Click "Get started"
3. Enable "Google" provider
4. Save

#### Firestore:
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Choose location: `us-central1` (or closest to you)
5. Click "Enable"

#### Cloud Functions:
1. In Firebase Console → Functions
2. Click "Get started"
3. Upgrade to **Blaze (Pay as you go)** plan
   - Don't worry! You won't be charged unless you exceed the generous free tier

---

## 🔧 Step 3: Local Project Configuration

### 3.1 Initialize Firebase

```bash
cd /path/to/your-project

# Login to Firebase
firebase login

# Set your project
firebase use spicy-vs-sweety
```

### 3.2 Get Firebase Config

1. Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "</>" (Web app) icon
4. Register app: "Your App Web"
5. Copy the config object

### 3.3 Create `.env` File

```bash
cp .env.example .env
nano .env
```

Paste your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=spicy-vs-sweety.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=spicy-vs-sweety
VITE_FIREBASE_STORAGE_BUCKET=spicy-vs-sweety.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=your_recaptcha_key
```

---

## 🤖 Step 4: Enable Vertex AI (Gemini)

### 4.1 Enable API in Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Library"
4. Search for "Vertex AI API"
5. Click "Enable"

### 4.2 Verify Permissions

The API will automatically use your Firebase project's service account. No additional keys needed!

---

## 💳 Step 5: Stripe Configuration

### 5.1 Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up / Log in
3. Activate your account (add business details)

### 5.2 Get API Keys

1. Stripe Dashboard → Developers → API Keys
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### 5.3 Set Firebase Config

```bash
firebase functions:config:set \
  stripe.secret_key="sk_test_YOUR_SECRET_KEY" \
  --project spicy-vs-sweety
```

### 5.4 Create Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://us-central1-spicy-vs-sweety.cloudfunctions.net/stripeWebhook`
4. Description: "Subscription Events"
5. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Click "Add endpoint"
7. Copy the **Signing secret** (starts with `whsec_...`)

### 5.5 Set Webhook Secret

```bash
firebase functions:config:set \
  stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET" \
  --project spicy-vs-sweety
```

---

## 🏗️ Step 6: Install Dependencies

```bash
# Root project
npm install

# Functions
cd functions
npm install
cd ..
```

---

## 🧪 Step 7: Test Locally (Optional)

### 7.1 Start Firebase Emulators

```bash
npm run emulators
```

This will start:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Emulator UI: http://localhost:4000

### 7.2 Start Dev Server

In a new terminal:

```bash
npm run dev
```

Visit: http://localhost:5173

### 7.3 Test Flow

1. Sign up with a test email
2. Test main functionality
3. Check usage counter
4. Try to upgrade (will use Stripe test mode)

---

## 🚀 Step 8: Deploy to Production

### 8.1 Build Frontend

```bash
npm run build
```

Verify build success (should create `dist/` folder).

### 8.2 Deploy Everything

```bash
./scripts/deploy-all.sh
```

Or manually:

```bash
firebase deploy --project spicy-vs-sweety
```

This deploys:
- ✅ Firestore rules
- ✅ Firestore indexes
- ✅ Cloud Functions
- ✅ Hosting

### 8.3 Verify Deployment

Visit: `https://spicy-vs-sweety.web.app` (or your custom domain)

---

## 🌐 Step 9: Custom Domain (Optional)

### 9.1 Add Domain in Firebase

1. Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter: `spicy-vs-sweet.com`
4. Follow verification steps:
   - Add TXT record to DNS
   - Wait for verification

### 9.2 Update DNS Records

Add these A records to your DNS:

```
Type  Name  Value
A     @     151.101.1.195
A     @     151.101.65.195
```

Wait for SSL certificate (up to 24 hours).

---

## ✅ Step 10: Post-Deployment Checklist

- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test main functionality
- [ ] Verify usage counter increments
- [ ] Test reaching free limit
- [ ] Test upgrade flow (use Stripe test cards)
- [ ] Verify subscription activation
- [ ] Test subscription cancellation
- [ ] Check Firebase Functions logs for errors
- [ ] Monitor Firestore usage
- [ ] Set up billing alerts in Google Cloud

---

## 🧪 Step 11: Test with Stripe Test Cards

Use these test cards in checkout:

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

**Payment Requires Authentication:**
```
Card: 4000 0027 6000 3184
```

**Declined Card:**
```
Card: 4000 0000 0000 0002
```

More test cards: https://stripe.com/docs/testing

---

## 📊 Step 12: Monitoring

### Firebase Logs

```bash
# View all logs
firebase functions:log --project spicy-vs-sweety

# View specific function
firebase functions:log --only analyzeEmail --project spicy-vs-sweety

# Real-time logs
firebase functions:log --follow --project spicy-vs-sweety
```

### Stripe Dashboard

- Monitor payments: Dashboard → Payments
- View subscriptions: Dashboard → Subscriptions
- Check webhook deliveries: Developers → Webhooks → Click your endpoint

---

## 💰 Step 13: Switch to Production Mode

### Stripe

1. Stripe Dashboard → Developers
2. Toggle "Viewing test data" to OFF
3. Update Firebase config with live keys:

```bash
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY" \
  stripe.webhook_secret="whsec_YOUR_LIVE_WEBHOOK_SECRET" \
  --project spicy-vs-sweety
```

4. Create new webhook with live mode endpoint
5. Deploy:

```bash
firebase deploy --only functions --project spicy-vs-sweety
```

---

## 🎉 You're Done!

Your SaaS is now live! 🚀

**What's Working:**
- ✅ User authentication
- ✅ AI analysis with Gemini
- ✅ Usage tracking (5 free, 250 pro)
- ✅ Stripe subscriptions
- ✅ Automatic billing
- ✅ Free trial with fingerprinting

---

## 🆘 Troubleshooting

### "Permission denied" errors

```bash
# Re-authenticate
firebase login --reauth

# Check project
firebase use
```

### Vertex AI errors

```bash
# Verify API is enabled
gcloud services list --enabled | grep aiplatform
```

### Stripe webhook not receiving events

1. Check endpoint URL is correct
2. Verify webhook secret matches
3. Check Firebase Functions logs
4. Test webhook in Stripe Dashboard

### Build fails

```bash
# Clear cache
rm -rf node_modules dist functions/lib
npm install
cd functions && npm install && cd ..
npm run build
```

---

## 📞 Support

- **Firebase:** https://firebase.google.com/support
- **Vertex AI:** https://cloud.google.com/vertex-ai/docs
- **Stripe:** https://support.stripe.com

---

**Setup Time:** 30-60 minutes
**Difficulty:** Intermediate

Happy deploying! 🎉
