import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './config/firebase';
import Stripe from 'stripe';
import * as crypto from 'crypto';
import { analyzeEmailFlow } from './services/aiAnalysis';

// Define secrets (automatically loaded from .env.local in emulator, from Secret Manager in production)
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

/**
 * Analyze Email Function
 * Protected by Firebase App Check to prevent bot abuse
 * Uses Genkit flow for automatic monitoring in Firebase Console
 */
export const analyzeEmail = onCall(
  {
    consumeAppCheckToken: true, // Validates and consumes App Check token
  },
  async ({ data, auth }) => {
    try {
      const { emailContent } = data;

      // Check authentication
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to analyze emails');
      }

      // Check email verification
      if (!auth.token.email_verified) {
        throw new HttpsError(
          'failed-precondition',
          'Email address must be verified before analyzing emails. Please check your inbox and verify your email.'
        );
      }

      const userId = auth.uid;

      // Validation
      if (!emailContent || typeof emailContent !== 'string') {
        throw new HttpsError('invalid-argument', 'Email content is required and must be a string');
      }

      if (emailContent.trim().length === 0) {
        throw new HttpsError('invalid-argument', 'Email content cannot be empty');
      }

      if (emailContent.length > 10000) {
        throw new HttpsError('invalid-argument', 'Email content is too long (max 10000 characters)');
      }

      // Check user's subscription and usage
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        // Create user document
        await db.collection('users').doc(userId).set({
          email: auth.token.email,
          subscriptionStatus: 'free',
          analysesUsedThisMonth: 0,
          analysesLimit: 5,
          currentPeriodStart: FieldValue.serverTimestamp(),
          currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Check if period ended and reset
        const now = Timestamp.now();
        const periodEnd = userData.currentPeriodEnd;

        if (periodEnd && now.toMillis() > periodEnd.toMillis()) {
          await db.collection('users').doc(userId).update({
            analysesUsedThisMonth: 0,
            currentPeriodStart: FieldValue.serverTimestamp(),
            currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          });
        } else {
          // Check limit
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

      // Call Genkit flow for analysis (automatically traced in Firebase Console)
      const result = await analyzeEmailFlow({
        emailContent,
        userId,
      });

      // Increment usage counter atomically (prevents race conditions)
      await db.collection('users').doc(userId).update({
        analysesUsedThisMonth: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Get updated usage for response
      const updatedUserDoc = await db.collection('users').doc(userId).get();
      const updatedUserData = updatedUserDoc.data();
      const currentUsage = updatedUserData?.analysesUsedThisMonth || 0;

      // Save analysis to history subcollection with token usage metrics
      const analysisDoc = await db.collection('users').doc(userId).collection('analyses').add({
        emailContent,
        analysis: result.analysis,
        usageMetadata: {
          promptTokens: result.usage.promptTokens,
          candidatesTokens: result.usage.candidatesTokens,
          totalTokens: result.usage.totalTokens,
          thinkingTokens: result.usage.thinkingTokens,
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      // Return analysis with usage info and analysis ID
      return {
        success: true,
        data: result.analysis,
        analysisId: analysisDoc.id,
        usage: {
          used: currentUsage,
          limit: updatedUserData?.analysesLimit || 5,
        },
      };
    } catch (error: unknown) {
      console.error('Error analyzing email:', error);
      if (error instanceof HttpsError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', `Failed to analyze email: ${message}`);
    }
  }
);

/**
 * Analyze Email for Guest (No Authentication Required)
 * Uses IP + Browser Fingerprint to prevent abuse (1 free trial per unique visitor)
 * Protected by Firebase App Check to prevent bot abuse
 */
export const analyzeEmailGuest = onCall(
  {
    consumeAppCheckToken: true, // Validates and consumes App Check token
  },
  async ({ data, auth, rawRequest }) => {
  try {
    const { emailContent } = data;

    // Guest users should not be authenticated
    if (auth) {
      throw new HttpsError('failed-precondition', 'This endpoint is for guest users only. Please use the regular analyze endpoint.');
    }

    // Validation
    if (!emailContent || typeof emailContent !== 'string') {
      throw new HttpsError('invalid-argument', 'Email content is required and must be a string');
    }

    if (emailContent.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'Email content cannot be empty');
    }

    if (emailContent.length > 10000) {
      throw new HttpsError('invalid-argument', 'Email content is too long (max 10000 characters)');
    }

    // Extract IP address and browser fingerprint
    const req = rawRequest;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';

    // Create unique fingerprint hash (SHA-256)
    const fingerprintString = `${ipAddress}|${userAgent}|${acceptLanguage}`;
    const fingerprint = crypto.createHash('sha256').update(fingerprintString).digest('hex');

    // Hash IP separately for privacy (we don't store raw IPs)
    const hashedIP = crypto.createHash('sha256').update(ipAddress.toString()).digest('hex');

    // Check if this fingerprint has already used the free trial
    const guestUsageRef = db.collection('guestUsage').doc(fingerprint);
    const guestDoc = await guestUsageRef.get();

    if (guestDoc.exists) {
      const data = guestDoc.data();
      const expiresAt = data?.expiresAt;

      // Check if not expired (30 days)
      if (expiresAt && Timestamp.now().toMillis() < expiresAt.toMillis()) {
        throw new HttpsError(
          'resource-exhausted',
          'Free trial already used. Sign up for a free account to get 5 analyses per month!'
        );
      }

      // If expired, delete old record and allow new trial
      await guestUsageRef.delete();
    }

    // Call Genkit flow for analysis (automatically traced in Firebase Console)
    const result = await analyzeEmailFlow({
      emailContent,
      userId: 'guest',
    });

    // Record this free trial usage
    await guestUsageRef.set({
      fingerprint,
      ipAddressHash: hashedIP,
      usedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days
      userAgent: userAgent.substring(0, 200), // Store truncated for debugging
    });

    // Clean up expired guest usage records (older than 30 days)
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const expiredDocs = await db.collection('guestUsage')
      .where('expiresAt', '<', thirtyDaysAgo)
      .limit(100)
      .get();

    const deletePromises = expiredDocs.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // Return analysis (no usage info since guest user)
    return {
      success: true,
      data: result.analysis,
      message: 'Free trial used! Sign up to get 5 analyses per month.',
    };
  } catch (error: unknown) {
    console.error('Error analyzing email (guest):', error);
    if (error instanceof HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', `Failed to analyze email: ${message}`);
  }
});

/**
 * Get User Subscription
 */
export const getUserSubscription = onCall(async ({ auth }) => {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = auth.uid;
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    // Create default user
    await db.collection('users').doc(userId).set({
      email: auth.token.email,
      subscriptionStatus: 'free',
      analysesUsedThisMonth: 0,
      analysesLimit: 5,
      currentPeriodStart: FieldValue.serverTimestamp(),
      currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      subscriptionStatus: 'free',
      analysesUsed: 0,
      analysesLimit: 5,
    };
  }

  return {
    subscriptionStatus: userData.subscriptionStatus || 'free',
    analysesUsed: userData.analysesUsedThisMonth || 0,
    analysesLimit: userData.analysesLimit || 5,
    currentPeriodEnd: userData.currentPeriodEnd,
  };
});

/**
 * Create Stripe Checkout Session
 * Protected by Firebase App Check to prevent unauthorized payment attempts
 */
export const createCheckoutSession = onCall(
  {
    secrets: [stripeSecretKey],
    consumeAppCheckToken: true,
  },
  async ({ data, auth }) => {
    try {
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      // Initialize Stripe with secret
      const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2023-10-16' });

      const userId = auth.uid;
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      // Create or retrieve Stripe customer
      let customerId = userData?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: auth.token.email,
          metadata: { firebaseUID: userId },
        });
        customerId = customer.id;

        await db.collection('users').doc(userId).update({
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${process.env.APP_NAME || 'App'} Pro`,
                description: '250 analyses per month',
              },
              unit_amount: 500,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        success_url: `${data.returnUrl || process.env.APP_URL || 'https://example.com'}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.returnUrl || process.env.APP_URL || 'https://example.com'}/pricing`,
        metadata: { firebaseUID: userId },
      });

      return { sessionId: session.id, url: session.url };
    } catch (error: unknown) {
      console.error('Error creating checkout session:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * Create Customer Portal Session
 * Protected by Firebase App Check to prevent unauthorized portal access
 */
export const createPortalSession = onCall(
  {
    secrets: [stripeSecretKey],
    consumeAppCheckToken: true,
  },
  async ({ data, auth }) => {
    try {
      if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      // Initialize Stripe with secret
      const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2023-10-16' });

      const userId = auth.uid;
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.stripeCustomerId) {
        throw new HttpsError('not-found', 'No Stripe customer found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: data.returnUrl || process.env.APP_URL || 'https://example.com',
      });

      return { url: session.url };
    } catch (error: unknown) {
      console.error('Error creating portal session:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpsError('internal', message);
    }
  }
);

/**
 * Cancel subscription
 * Protected by Firebase App Check to prevent unauthorized cancellations
 */
export const cancelSubscription = onCall(
  {
    secrets: [stripeSecretKey],
    consumeAppCheckToken: true,
  },
  async ({ auth }) => {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Initialize Stripe with secret
  const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2023-10-16' });

  const userId = auth.uid;
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData?.subscriptionId) {
    throw new HttpsError('not-found', 'No active subscription found');
  }

  try {
    await stripe.subscriptions.cancel(userData.subscriptionId);
    return { success: true, message: 'Subscription cancelled successfully' };
  } catch (error: unknown) {
    console.error('Error cancelling subscription:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new HttpsError('internal', message);
  }
});

/**
 * Handle Stripe Webhooks
 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    // Initialize Stripe with secret
    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: '2023-10-16' });

    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        stripeWebhookSecret.value()
      );

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.firebaseUID;

          if (userId && session.subscription) {
            await db.collection('users').doc(userId).update({
              subscriptionStatus: 'active',
              subscriptionId: session.subscription,
              analysesLimit: 250,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(subscription.customer as string);

          if ('metadata' in customer && customer.metadata.firebaseUID) {
            const userId = customer.metadata.firebaseUID;
            const status = subscription.status === 'active' ? 'active' : 'free';

            await db.collection('users').doc(userId).update({
              subscriptionStatus: status,
              analysesLimit: status === 'active' ? 250 : 5,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error: unknown) {
      console.error('Webhook error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).send(`Webhook Error: ${message}`);
    }
  }
);

/**
 * Email Analysis Functions
 */
export { createEmailAnalysisSession } from './createEmailSession';
export { receiveEmailWebhook } from './receiveEmailWebhook';
export { cleanExpiredSessions, cleanExpiredSessionsScheduled } from './cleanExpiredSessions';

/**
 * Usage Analytics Functions
 */
export { getUserUsageStats } from './getUserUsageStats';
