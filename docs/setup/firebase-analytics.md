# Firebase Analytics & AI Setup Guide

This guide explains how Firebase Analytics and Firebase AI SDK are configured for this template.

## Firebase Analytics

### Overview

Firebase Analytics is **only enabled in production builds** to avoid polluting analytics data with development traffic.

**Status:** ⚠️ Requires configuration
- **Measurement ID:** Set via `VITE_FIREBASE_MEASUREMENT_ID` in `.env`
- **Mode:** Production only (disabled in `npm run dev`)

### How it Works

1. **Development Mode:**
   - Analytics is disabled
   - Console shows: `📊 Firebase Analytics: Disabled (development mode)`

2. **Production Build:**
   - Analytics initializes automatically
   - Console shows: `📊 Firebase Analytics initialized`
   - Tracks page views and custom events automatically

### Configuration Files

- [.env](.env) - Contains `VITE_FIREBASE_MEASUREMENT_ID`
- [src/services/firebase.ts](src/services/firebase.ts#L33-L48) - Analytics initialization logic

### Tracking Custom Events

Firebase Analytics is exported from `firebase.ts` and can be used to track custom events:

```typescript
import { analytics } from './services/firebase';
import { logEvent } from 'firebase/analytics';

// Track email analysis
if (analytics) {
  logEvent(analytics, 'email_analyzed', {
    score: 85,
    user_plan: 'free',
  });
}

// Track subscription upgrade
if (analytics) {
  logEvent(analytics, 'subscription_upgrade', {
    plan: 'pro',
    price: 5,
  });
}
```

### Viewing Analytics Data

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **spicy-vs-sweety**
3. Click **Analytics** → **Dashboard**
4. View real-time data in **Realtime** tab
5. Standard reports appear after 24-48 hours

---

## Firebase AI SDK (Gemini)

### Overview

This template uses Firebase AI SDK with Gemini for AI analysis. This provides automatic monitoring and observability through Firebase.

**Status:** ✅ Configured
- **Model:** `gemini-2.5-flash`
- **Backend:** Firebase AI SDK (not direct Vertex AI)
- **Monitoring:** Automatic through Firebase Console

### Benefits of Firebase AI SDK

1. **Automatic Monitoring** - All AI calls visible in Firebase Console
2. **Better Integration** - Uses same Firebase credentials
3. **Cost Tracking** - See AI usage in Firebase billing
4. **Error Reporting** - Better error tracking through Firebase

### Backend Configuration

The Cloud Functions use Firebase AI SDK:

```typescript
// functions/src/index.ts
import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel } from 'firebase/ai';

const firebaseApp = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
});

const ai = getAI(firebaseApp);
const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 8192,
  },
});
```

### Environment Variables

**Development (functions/.env.local):**
```bash
GOOGLE_API_KEY=your-api-key-here
```

**Production:**
In production, Vertex AI uses the service account automatically - no API key configuration needed.

### Monitoring AI Usage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **spicy-vs-sweety**
3. Click **Functions** → **Logs**
4. Filter by function: `analyzeEmail`
5. View AI request/response data and errors

---

## Privacy & GDPR

### Analytics Privacy

Firebase Analytics respects user privacy:
- No personally identifiable information (PII) is collected by default
- IP addresses are anonymized
- Users can opt-out via browser settings

### GDPR Compliance (Recommended)

For full GDPR compliance, consider:

1. **Cookie Consent Banner**
   - Only initialize Analytics after user consent
   - Use a library like `react-cookie-consent`

2. **Privacy Policy**
   - Disclose Analytics usage
   - Link in app footer

3. **Data Retention**
   - Configure in Firebase Console → Analytics → Data Settings
   - Recommended: 14 months

### Example: Conditional Analytics Init

```typescript
// src/services/firebase.ts
let analytics: any = null;

export function initAnalyticsWithConsent() {
  if (import.meta.env.PROD && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    isAnalyticsSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('📊 Firebase Analytics initialized');
      }
    });
  }
}

// Call this after user accepts cookies
// initAnalyticsWithConsent();
```

---

## Troubleshooting

### Analytics Not Working

**Symptoms:**
- No data in Firebase Console → Analytics
- Console shows: "Analytics: Disabled"

**Solutions:**
1. Verify you're testing production build: `npm run build && npm run preview`
2. Check `VITE_FIREBASE_MEASUREMENT_ID` is set in `.env`
3. Verify Measurement ID format: `G-XXXXXXXXXX`
4. Clear browser cache and cookies

### AI Calls Failing

**Symptoms:**
- Email analysis returns errors
- Console shows Firebase AI errors

**Solutions:**
1. Verify `FIREBASE_API_KEY` is set in `functions/.env`
2. Check API key is valid in [Firebase Console](https://console.firebase.google.com/)
3. Ensure Gemini API is enabled in Google Cloud Console
4. Check Cloud Function logs for detailed errors:
   ```bash
   firebase functions:log
   ```

### Ad Blockers

Many ad blockers block Firebase Analytics (30-40% of users). This is expected and cannot be bypassed without compromising privacy.

**Alternatives:**
- **Plausible Analytics** - Privacy-friendly, not blocked
- **Fathom Analytics** - Simple, GDPR compliant
- **Umami** - Open-source, self-hosted

---

## Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Firebase AI SDK Documentation](https://firebase.google.com/docs/ai)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Console](https://console.firebase.google.com/project/spicy-vs-sweety)

## Support

Need help?
- Firebase Support: [firebase.google.com/support](https://firebase.google.com/support)
- Project Support: [{{SUPPORT_EMAIL}}](mailto:{{SUPPORT_EMAIL}})
