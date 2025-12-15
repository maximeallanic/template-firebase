# Firebase App Check Setup Guide

Firebase App Check protects your backend resources (Cloud Functions, Firestore, Authentication) from abuse and automated attacks using reCAPTCHA Enterprise.

## Quick Overview

**What App Check Does:**
- Verifies requests come from legitimate users, not bots
- Protects against credential stuffing, spam, and abuse
- Works invisibly for real users (no CAPTCHA challenges in most cases)
- Uses machine learning to detect suspicious behavior

## Setup Steps

### 1. Create reCAPTCHA Enterprise Key

1. Go to [Google Cloud Console > Security > reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha?project={{PROJECT_ID}})

2. Click **"Create Key"**

3. Configure the key:
   - **Display name**: `{{APP_NAME}} Web`
   - **Platform type**: Website
   - **Domains**:
     - `{{DOMAIN}}` (production)
     - `localhost` (for local testing)
   - **reCAPTCHA type**:
     - **Score-based (recommended)**: Invisible, uses risk analysis (0.0 = likely bot, 1.0 = likely human)
     - **Checkbox**: Traditional "I'm not a robot" checkbox
   - **Security preference**:
     - For score-based: Set threshold to `0.5` (default) or adjust based on your needs
   - **WAF Settings**: Optional - integrate with Cloud Armor if needed

4. Click **"Create"**

5. Copy the **Site Key** (starts with `6L...`)
   - Example: `6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 2. Enable App Check in Firebase Console

1. Go to [Firebase Console > App Check](https://console.firebase.google.com/project/{{PROJECT_ID}}/appcheck)

2. Click **"Get started"** (or go to "Apps" tab)

3. Select your web app from the list

4. Click **"Register"** or **"Add provider"**

5. Choose **"reCAPTCHA Enterprise"** as the provider

6. Paste the **Site Key** from Step 1

7. Click **"Save"**

### 3. Configure Frontend Environment Variable

Add the reCAPTCHA Enterprise site key to your `.env` file:

```bash
# Firebase App Check (reCAPTCHA Enterprise)
VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**The frontend code already initializes App Check automatically!**
See `src/services/firebase.ts:38-52` - no code changes needed.

### 4. Configure Enforcement (IMPORTANT - Do This Gradually!)

**Start with "Unenforced" mode to monitor without blocking legitimate users:**

1. In Firebase Console > App Check > APIs
2. For each service, set to **"Unenforced"** initially:
   - ✅ **Cloud Functions**: Unenforced
   - ✅ **Cloud Firestore**: Unenforced
   - ✅ **Authentication**: Unenforced (or enforce if you're confident)

3. **Monitor for 1-2 weeks:**
   - Check App Check metrics daily
   - Look for false positives (legitimate users flagged as bots)
   - Analyze attack patterns

4. **Gradually enable enforcement:**
   - Start with **Authentication** (safest to enforce)
   - Then **Cloud Functions** (after monitoring)
   - Finally **Firestore** (after testing thoroughly)

### 5. Optional: Enforce App Check in Cloud Functions

To require valid App Check tokens in specific functions, update the function options:

**Example - Enforce on `analyzeEmail` function:**

```typescript
// functions/src/index.ts
import { onCall } from 'firebase-functions/v2/https';

export const analyzeEmail = onCall(
  {
    consumeAppCheckToken: true, // ✅ Validates and consumes App Check token
  },
  async ({ data, auth, app }) => {
    // app parameter is now available:
    // - app.alreadyConsumed: boolean - true if token was consumed
    // - app.token: AppCheckToken - the validated token

    // Your function logic...
  }
);
```

**Apply to these functions for best protection:**
- ✅ `analyzeEmail` - Prevents bot abuse of AI analysis
- ✅ `analyzeEmailGuest` - Protects free trial from bots
- ✅ `createEmailAnalysisSession` - Prevents email session spam
- ⚠️ `stripeWebhook` - **DO NOT** apply (webhook comes from Stripe, not users)
- ⚠️ `receiveEmailWebhook` - **DO NOT** apply (webhook comes from Mailgun)

### 6. Testing App Check

**Local Development:**
- App Check works with `localhost` if you added it to allowed domains
- Browser console will show: `✅ Firebase App Check initialized with reCAPTCHA Enterprise`

**Production Testing:**
1. Deploy your app with the site key configured
2. Open browser DevTools > Console
3. Look for App Check initialization message
4. Test an analysis request
5. Check Firebase Console > App Check > Metrics

**Debug Tokens (for CI/CD):**
If your tests or CI/CD pipeline fails due to App Check:
1. Go to Firebase Console > App Check > Apps > Debug Tokens
2. Create a debug token
3. Add to your CI environment:
   ```bash
   self.FIREBASE_APPCHECK_DEBUG_TOKEN = "your-debug-token-here"
   ```

## Monitoring & Metrics

### Firebase Console Metrics

Go to [Firebase Console > App Check > Metrics](https://console.firebase.google.com/project/{{PROJECT_ID}}/appcheck/insights)

**Key metrics to watch:**
- ✅ **Valid token attempts**: Legitimate users
- ❌ **Invalid token attempts**: Bots or attacks
- 📊 **Verification rate**: % of requests with valid tokens
- 🚨 **Error rate**: Failed verifications

### Google Cloud Console (reCAPTCHA Enterprise)

Go to [Cloud Console > Security > reCAPTCHA Enterprise](https://console.cloud.google.com/security/recaptcha?project={{PROJECT_ID}})

**Additional insights:**
- Score distribution (for score-based keys)
- Top reasons for low scores
- Geographic distribution of requests
- Attack patterns and trends

## Troubleshooting

### Frontend shows warning: "App Check not initialized"

**Cause**: Missing or invalid site key

**Solution**:
1. Check `.env` file has `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`
2. Verify the site key is correct (starts with `6L...`)
3. Restart dev server: `npm run dev`

### Functions fail with "App Check token is invalid"

**Cause**: Enforcement enabled but frontend not sending tokens

**Solution**:
1. Verify frontend has App Check initialized (check browser console)
2. Check Firebase Console > App Check > Apps shows your site key
3. Temporarily set enforcement to "Unenforced" while debugging
4. Clear browser cache and cookies

### Legitimate users blocked by App Check

**Cause**: reCAPTCHA threshold too strict or false positives

**Solution**:
1. Lower the score threshold (e.g., 0.3 instead of 0.5)
2. Switch from score-based to checkbox (more user-friendly but less invisible)
3. Check if specific browsers/extensions are causing issues
4. Review Cloud Console metrics for patterns

### CI/CD pipeline fails with App Check errors

**Cause**: Automated tests can't pass App Check verification

**Solution**:
1. Create a debug token in Firebase Console
2. Add to CI environment variables
3. Or exclude App Check from test environment:
   ```typescript
   if (import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY && !import.meta.env.TEST) {
     initializeAppCheck(...)
   }
   ```

## Security Best Practices

### 1. Keep Site Key Secure
- ✅ Site key is safe to expose (it's public)
- ❌ Never expose secret/server keys
- ✅ Use environment variables

### 2. Monitor Metrics Regularly
- Check for unusual spikes in invalid tokens
- Investigate sudden drops in verification rates
- Review attack patterns monthly

### 3. Gradual Rollout
- Start unenforced, monitor for 1-2 weeks
- Enable enforcement on low-risk services first
- Have a rollback plan if issues occur

### 4. Combine with Other Security
- App Check complements Firestore Security Rules (doesn't replace them)
- Still validate data server-side in Cloud Functions
- Use rate limiting for additional protection

### 5. Plan for Failures
- App Check can occasionally have outages
- Consider graceful degradation:
  ```typescript
  export const analyzeEmail = onCall(
    {
      consumeAppCheckToken: true,
      // Allow requests to proceed even if App Check fails
      // (Firebase will log warnings but not block)
    },
    async ({ data, auth }) => { ... }
  );
  ```

## Cost Considerations

**reCAPTCHA Enterprise Pricing:**
- First 10,000 assessments/month: **FREE**
- Additional assessments: **$1 per 1,000 assessments**

**Typical Usage:**
- Free tier users: 5 analyses/month
- Pro tier users: 250 analyses/month
- Estimated usage: ~1,000-5,000 assessments/month
- **Expected cost: FREE (under 10K limit)**

See [reCAPTCHA Enterprise Pricing](https://cloud.google.com/recaptcha-enterprise/pricing) for details.

## References

- [Firebase App Check Docs](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Enterprise Docs](https://cloud.google.com/recaptcha-enterprise/docs)
- [App Check with Cloud Functions](https://firebase.google.com/docs/app-check/cloud-functions)
- [Project CLAUDE.md](../../CLAUDE.md#firebase-app-check-configuration-security-layer)
