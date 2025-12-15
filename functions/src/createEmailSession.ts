import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './config/firebase';
import { generateUniqueEmailAddress } from './utils/nameGenerator';
import { generateSessionId } from './utils/sessionIdGenerator';
import * as crypto from 'crypto';
const DOMAIN = process.env.MAILGUN_DOMAIN || 'example.com';
const MAX_GENERATION_ATTEMPTS = 20;
const SESSION_EXPIRY_MINUTES = 20;

/**
 * Creates a new email analysis session with a unique email address
 * Protected by Firebase App Check to prevent email session spam
 * Returns: { emailAddress, displayName, sessionId, expiresAt }
 */
export const createEmailAnalysisSession = onCall(
  {
    consumeAppCheckToken: true,
  },
  async ({ auth, rawRequest }) => {
  try {
    // Get user info or fingerprint for guest
    const userId = auth?.uid;
    const userEmail = auth?.token?.email;

    // For guests, create fingerprint from IP and User-Agent
    let fingerprint: string | undefined;
    if (!userId) {
      const req = rawRequest;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const acceptLanguage = req.headers['accept-language'] || 'unknown';
      const fingerprintString = `${ipAddress}|${userAgent}|${acceptLanguage}`;
      fingerprint = crypto.createHash('sha256').update(fingerprintString).digest('hex');
    }

    // Check rate limiting - max 5 sessions per hour per user/IP
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
    const rateLimitQuery = await db
      .collection('emailSessions')
      .where(userId ? 'userId' : 'fingerprint', '==', userId || fingerprint)
      .where('createdAt', '>', oneHourAgo)
      .get();

    if (rateLimitQuery.size >= 5) {
      throw new HttpsError(
        'resource-exhausted',
        'Rate limit exceeded. Maximum 5 email addresses per hour. Please try again later.'
      );
    }

    // Check user quota (for authenticated users)
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (userData) {
        const used = userData.analysesUsedThisMonth || 0;
        const limit = userData.analysesLimit || 5;

        if (used >= limit && userData.subscriptionStatus === 'free') {
          throw new HttpsError(
            'resource-exhausted',
            `You have reached your monthly limit of ${limit} analyses. Upgrade to Pro for more!`
          );
        }
      }
    }

    // Check guest free trial (for non-authenticated users)
    if (!userId && fingerprint) {
      const guestUsageRef = db.collection('guestUsage').doc(fingerprint);
      const guestDoc = await guestUsageRef.get();

      if (guestDoc.exists) {
        const data = guestDoc.data();
        const expiresAt = data?.expiresAt;

        if (expiresAt && Timestamp.now().toMillis() < expiresAt.toMillis()) {
          throw new HttpsError(
            'resource-exhausted',
            'Free trial already used. Sign up for a free account to get 5 analyses per month!'
          );
        }
      }
    }

    // Generate unique email address
    let emailAddress = '';
    let displayName = '';
    let sessionId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < MAX_GENERATION_ATTEMPTS) {
      attempts++;

      // Generate name and email (seed is handled internally)
      const generated = generateUniqueEmailAddress(DOMAIN);
      emailAddress = generated.emailAddress;
      displayName = generated.displayName;
      sessionId = generateSessionId(emailAddress);

      // Check if session already exists and is active
      const existingSession = await db.collection('emailSessions').doc(sessionId).get();

      if (!existingSession.exists) {
        isUnique = true;
      } else {
        const existingData = existingSession.data();
        const expiresAt = existingData?.expiresAt;

        // If expired, we can reuse
        if (expiresAt && Timestamp.now().toMillis() > expiresAt.toMillis()) {
          // Delete expired session
          await existingSession.ref.delete();
          isUnique = true;
        }
      }
    }

    if (!isUnique) {
      throw new HttpsError(
        'internal',
        'Failed to generate unique email address. Please try again.'
      );
    }

    // Calculate expiry time (20 minutes from now)
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000));

    // Create session document
    await db
      .collection('emailSessions')
      .doc(sessionId)
      .set({
        sessionId,
        emailAddress,
        displayName,
        userId: userId || null,
        userEmail: userEmail || null,
        fingerprint: fingerprint || null,
        status: 'waiting',
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
        usedQuota: false,
      });

    return {
      success: true,
      data: {
        emailAddress,
        displayName,
        sessionId,
        expiresAt: expiresAt.toMillis(),
      },
    };
  } catch (error: unknown) {
    console.error('Error creating email session:', error);
    if (error instanceof HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed to create email session: ${message}`);
  }
});
