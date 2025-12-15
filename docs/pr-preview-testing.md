# Pull Request Preview Testing Guide

This guide explains how to test pull requests using Firebase Preview Channels and local emulators.

## Overview

When you create a pull request, GitHub Actions automatically:
1. Runs quality checks (ESLint, TypeScript, Functions build)
2. Builds the frontend with production Firebase config
3. Deploys to a Firebase Preview Channel (temporary URL)
4. Posts a comment on the PR with the preview URL and testing instructions

## Preview Environment Architecture

```
┌─────────────────────────────────────────────────┐
│         PR Preview Environment                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Frontend (Hosting)                             │
│  ├─ Deployed to Preview Channel                 │
│  ├─ URL: pr-123--{{PROJECT_ID}}.web.app        │
│  └─ Expires: 7 days                             │
│                                                  │
│  Backend (Functions, Firestore, Auth)           │
│  ├─ Uses PRODUCTION resources                   │
│  ├─ No isolated test environment                │
│  └─ Test with local emulators instead           │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Testing Workflow

### 1. Frontend Testing (Preview Channel)

When a PR is created, you'll receive a comment with a preview URL:

```
🔥 Firebase Preview Deployment
✅ Status: Ready for Testing
🌐 Preview URL: https://pr-123--{{PROJECT_ID}}.web.app
```

**What's deployed:**
- React frontend with production build
- Firebase config pointing to production project
- Firebase App Check (reCAPTCHA) enabled
- All environment variables from GitHub Secrets

**What's NOT deployed:**
- Cloud Functions (uses production backend)
- Firestore rules (uses production rules)
- Custom domain (uses Firebase subdomain)

**Testing steps:**
1. Click the preview URL in the PR comment
2. Test UI changes, routing, and frontend logic
3. Be aware that backend calls hit production Functions

### 2. Functions Testing (Local Emulators)

Since Firebase Preview Channels don't support Cloud Functions, you must test Functions locally.

**Setup:**

```bash
# 1. Checkout the PR branch
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 2. Install dependencies
npm ci
cd functions && npm ci && cd ..

# 3. Copy environment files
cp .env.example .env
cp functions/.env.local.example functions/.env.local

# 4. Add required secrets to functions/.env.local
# - MAILGUN_API_KEY
# - MAILGUN_DOMAIN
# - MAILGUN_WEBHOOK_SIGNING_KEY
# - STRIPE_SECRET_KEY_TEST
# - STRIPE_WEBHOOK_SECRET_TEST
```

**Running emulators:**

```bash
# Start Firebase emulators (in one terminal)
npm run emulators

# Start frontend dev server (in another terminal)
npm run dev
```

**Emulator endpoints:**
- Frontend: http://localhost:5173
- Emulator UI: http://localhost:4000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099

### 3. End-to-End Testing

**Scenario 1: Guest Action**
```bash
# 1. Start emulators
npm run emulators

# 2. In another terminal, start dev server
npm run dev

# 3. Open http://localhost:5173
# 4. Test the main action as a guest
# 5. Check Firestore UI to verify guestUsage collection
```

**Scenario 2: Authenticated User**
```bash
# 1. Same setup as above
# 2. Sign in with Google (emulator allows any email)
# 3. Run 5 actions to test free tier limit
# 4. Verify usage counter in Firestore
```

**Scenario 3: Stripe Subscription**
```bash
# 1. Same setup, sign in
# 2. Click "Upgrade to Pro"
# 3. Use Stripe test card: 4242 4242 4242 4242
# 4. Complete checkout
# 5. Verify subscription in Firestore
```

## Simulating Webhooks Locally

### Stripe Webhook

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local emulator
stripe listen --forward-to localhost:5001/{{PROJECT_ID}}/us-central1/stripeWebhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Quality Checks

Before submitting your PR, run these checks locally:

```bash
# 1. ESLint
npm run lint

# 2. TypeScript type checking
npm run type-check

# 3. Build frontend
npm run build

# 4. Build functions
cd functions && npm run build
```

All checks must pass for the PR to be approved.

## Troubleshooting

### Preview deployment failed

**Error:** `Permission denied on Secret Manager`

**Solution:** Service account needs `roles/secretmanager.viewer` and `roles/secretmanager.secretAccessor` roles.

```bash
gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
  --member="serviceAccount:github-action-XXXXX@{{PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.viewer"

gcloud projects add-iam-policy-binding {{PROJECT_ID}} \
  --member="serviceAccount:github-action-XXXXX@{{PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Emulators won't start

**Error:** `Port already in use`

**Solution:** Kill existing processes on emulator ports:

```bash
# Find and kill processes
lsof -ti:5173,4000,5001,8080,9099 | xargs kill -9
```

### App Check blocking requests

**Error:** `App Check token is invalid`

**Solution:** App Check is enabled in production but not in emulators. Use debug token:

```bash
# In Firebase Console > App Check > Apps > Web
# Add debug token for localhost
# Then add to .env:
VITE_APP_CHECK_DEBUG_TOKEN=your-debug-token
```

## CI/CD Pipeline

The PR preview workflow runs in 2 stages:

### Stage 1: Quality Checks
- Checkout code
- Install dependencies (frontend + functions)
- Run ESLint
- Run TypeScript type check
- Build Functions

### Stage 2: Build and Deploy
- Checkout code
- Create .env with GitHub Secrets
- Build frontend
- Calculate bundle size
- Deploy to Preview Channel
- Post comment on PR with preview URL

## Preview Channel Lifecycle

- **Creation:** Automatic on PR creation
- **Updates:** Automatic on every push to PR branch
- **Expiration:** 7 days after last update
- **Cleanup:** Automatic by Firebase
- **Channel ID:** `pr-{PR_NUMBER}` (e.g., `pr-42`)

## Best Practices

1. **Test locally first:** Always run emulators before pushing to PR
2. **Check bundle size:** Preview comment shows bundle size - watch for increases
3. **Review PR comment:** Read the preview comment for deployment status
4. **Clean up branches:** Delete PR branches after merge to avoid orphaned previews
5. **Use test data:** Never use production data in emulators
6. **Verify Functions build:** Even though Functions aren't deployed, they're validated

---

**Quick Reference:**

| Task | Command |
|------|---------|
| Checkout PR | `git fetch origin pull/{PR}/head:pr-{PR} && git checkout pr-{PR}` |
| Start emulators | `npm run emulators` |
| Start dev server | `npm run dev` |
| Run quality checks | `npm run lint && npm run type-check` |
| Build frontend | `npm run build` |
| Build functions | `cd functions && npm run build` |
| View emulator UI | http://localhost:4000 |
