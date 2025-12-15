# Deployment Checklist

## 🔴 Urgent - Required for Deployment to Work

### 1. Configure GitHub Secrets (Firebase Environment Variables)

**Where:** `https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/secrets/actions`

**Secrets to add:**

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `DOMAIN` | Your production domain |
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | reCAPTCHA Enterprise Site Key |

**Why:** Without these variables, the production build doesn't have Firebase configuration, causing `auth/invalid-api-key` errors.

---

### 2. Add Permissions to Service Account

**Where:** `https://console.cloud.google.com/iam-admin/iam?project=spicy-vs-sweety`

**Actions:**
1. Find the service account used in GitHub Actions (look for `firebase-adminsdk` or check `client_email` in the secret JSON)
2. Click the pencil (Edit) next to the service account
3. Add role: **`Firebase Admin`**
4. Save

**Why:** Without these permissions, deployment fails with 403 error when deploying Firestore rules.

---

## 🟡 Important - Functions Production Configuration

### 3. Configure Functions Environment Variables (Production)

**Create file:** `functions/.env.local` (if not already done)

```bash
# Google API Key (for Vertex AI / Gemini)
GOOGLE_API_KEY=your_api_key_here

# Stripe Keys (TEST for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**For production, configure via Firebase:**

```bash
# Replace with your Stripe LIVE keys
firebase functions:config:set \
  stripe.secret_key="sk_live_YOUR_LIVE_KEY" \
  stripe.webhook_secret="whsec_YOUR_LIVE_WEBHOOK_SECRET" \
  --project spicy-vs-sweety

# Deploy with new config
firebase deploy --only functions --project spicy-vs-sweety
```

**Note:** `GOOGLE_API_KEY` is NOT needed in production because Functions use Vertex AI with the service account automatically.

---

## 🟢 Optional - Enhancement

### 4. Configure Stripe Webhook in Production

1. **Go to Stripe Dashboard:**
   ```
   https://dashboard.stripe.com/webhooks
   ```

2. **Create webhook with URL:**
   ```
   https://us-central1-spicy-vs-sweety.cloudfunctions.net/stripeWebhook
   ```

3. **Events to listen:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

4. **Copy the Signing Secret** and configure with `firebase functions:config:set`

---

## 📋 Deployment Checklist

- [ ] GitHub Secrets configured (all `VITE_FIREBASE_*` variables)
- [ ] Service Account has `Firebase Admin` role
- [ ] File `functions/.env.local` exists locally
- [ ] Stripe LIVE keys configured via `firebase functions:config:set` (production)
- [ ] Stripe webhook configured (production)
- [ ] Push to `master` to trigger deployment
- [ ] Verify GitHub Actions build passes
- [ ] Test application in production: https://spicy-vs-sweet.com
- [ ] Verify Firebase Analytics works
- [ ] Test main functionality
- [ ] Test Stripe payment

---

## 🚀 Test Commands

### Test Locally (Emulators)
```bash
npm run dev
```

### Deploy Manually
```bash
./scripts/deploy-all.sh
```

### View Functions Logs
```bash
firebase functions:log --project spicy-vs-sweety --lines 50
```

### Test in Production
1. Open: https://spicy-vs-sweet.com
2. Sign in with Google
3. Test main functionality
4. Verify it works

---

## 📚 Complete Documentation

- [ci-cd.md](./ci-cd.md) - Complete CI/CD guide
- [service-account.md](./service-account.md) - Service account configuration
- [../setup/firebase-analytics.md](../setup/firebase-analytics.md) - Firebase Analytics setup
