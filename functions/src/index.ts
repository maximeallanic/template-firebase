import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, admin } from './config/firebase';
import Stripe from 'stripe';
import { z } from 'zod';

// Define secrets for production (Secret Manager)
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const googleCseEngineId = defineSecret('GOOGLE_CSE_ENGINE_ID');

// ============================================================================
// MULTI-CURRENCY PRICING CONFIGURATION
// ============================================================================

type SupportedCurrency = 'eur' | 'usd' | 'gbp' | 'brl';

const ALLOWED_CURRENCIES: SupportedCurrency[] = ['eur', 'usd', 'gbp', 'brl'];

/**
 * Pricing in cents for each currency (all end with .99)
 * EUR/USD/GBP: 1.99, BRL: 11.99 (~6x EUR due to exchange rate)
 */
const CURRENCY_PRICING: Record<SupportedCurrency, number> = {
  eur: 199,   // 1.99 EUR
  usd: 199,   // $1.99
  gbp: 199,   // £1.99
  brl: 1199,  // R$ 11.99
};

/**
 * Validates and returns a supported currency, defaulting to EUR
 */
function validateCurrency(currency: string | undefined): SupportedCurrency {
  const normalized = (currency || 'eur').toLowerCase() as SupportedCurrency;
  return ALLOWED_CURRENCIES.includes(normalized) ? normalized : 'eur';
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Allowed origins for URL validation (SEC-001)
 */
const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  'https://spicy-vs-sweet.com',
  'https://spicyvssweet.com',
  'https://spicy-vs-sweet.web.app',
  'https://spicy-vs-sweet.firebaseapp.com',
].filter(Boolean) as string[];

/**
 * Validates return URLs to prevent open redirect attacks (SEC-001)
 */
function validateReturnUrl(url: string | undefined): string {
  const defaultUrl = process.env.APP_URL || 'https://spicy-vs-sweet.com';
  if (!url) return defaultUrl;

  try {
    const parsed = new URL(url);
    const isAllowed = ALLOWED_ORIGINS.some(origin => {
      try {
        return new URL(origin).hostname === parsed.hostname;
      } catch {
        return false;
      }
    });
    return isAllowed ? url : defaultUrl;
  } catch {
    return defaultUrl;
  }
}

/**
 * Sanitizes log messages to prevent sensitive data exposure (SEC-010)
 */
function sanitizeLog(message: string): string {
  return message
    .replace(/sk_[a-zA-Z0-9_]+/g, '[STRIPE_KEY]')
    .replace(/pi_[a-zA-Z0-9_]+/g, '[PAYMENT_INTENT]')
    .replace(/cs_[a-zA-Z0-9_]+/g, '[CHECKOUT_SESSION]')
    .replace(/sub_[a-zA-Z0-9_]+/g, '[SUBSCRIPTION_ID]')
    .replace(/cus_[a-zA-Z0-9_]+/g, '[CUSTOMER_ID]');
}

/**
 * Rate limiting configuration per operation (SEC-004)
 */
const RATE_LIMITS: Record<string, number> = {
  generateGameQuestions: 20, // 20 per hour
  validatePhase3Answer: 200, // 200 per hour
  validatePhase5Answers: 50, // 50 per hour
};

/**
 * Checks and enforces rate limits per user (SEC-004)
 */
async function checkRateLimit(
  userId: string,
  operation: string
): Promise<void> {
  const maxPerHour = RATE_LIMITS[operation];
  if (!maxPerHour) return; // No limit configured

  const hour = Math.floor(Date.now() / 3600000);
  const docId = `${userId}_${operation}_${hour}`;
  const ref = db.collection('rateLimits').doc(docId);

  const doc = await ref.get();
  const count = doc.data()?.count || 0;

  if (count >= maxPerHour) {
    throw new HttpsError(
      'resource-exhausted',
      `Rate limit exceeded: max ${maxPerHour} ${operation} calls per hour`
    );
  }

  await ref.set({
    count: count + 1,
    userId,
    operation,
    hour,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

/**
 * Zod schemas for input validation (SEC-005)
 */
const GenerateQuestionsSchema = z.object({
  phase: z.enum(['phase1', 'phase2', 'phase3', 'phase4', 'phase5']),
  topic: z.string()
    .min(1)
    .max(100)
    .regex(/^[\w\s\-'àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ.,!?]+$/i, 'Invalid characters in topic')
    .optional(),
  difficulty: z.enum(['easy', 'normal', 'hard', 'wtf']).optional(),
  language: z.enum(['fr', 'en']).optional().default('fr'),
  roomCode: z.string()
    .regex(/^[A-Z0-9]{4}$/, 'Room code must be 4 uppercase alphanumeric characters')
    .optional(),
  soloMode: z.boolean().optional().default(false),
  // Completion mode: generate only missing questions
  completeCount: z.number().int().min(1).max(20).optional(),
  existingQuestions: z.array(z.unknown()).optional(),
});

const ValidatePhase3Schema = z.object({
  playerAnswer: z.string().min(1).max(500),
  correctAnswer: z.string().min(1).max(500),
  acceptableAnswers: z.array(z.string().max(500)).nullish(), // Accept null, undefined, or array
});

const ValidatePhase5Schema = z.object({
  questions: z.array(z.object({
    answer: z.string().min(1),
    acceptableAnswers: z.array(z.string()).nullish(), // Accept null, undefined, or array
  })).length(10),
  spicyAnswers: z.array(z.string()).length(10),
  sweetAnswers: z.array(z.string()).length(10),
});

/**
 * Get User Subscription
 * SEC-003: Verifies email before creating new user records
 */
export const getUserSubscription = onCall(async ({ auth }) => {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = auth.uid;
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (!userData) {
    // SEC-003: Verify email before creating user record
    // Google Sign-In emails are considered verified
    const isGoogleUser = auth.token.firebase?.sign_in_provider === 'google.com';
    const isEmailVerified = auth.token.email_verified === true || isGoogleUser;

    if (!isEmailVerified) {
      throw new HttpsError(
        'permission-denied',
        'Email must be verified before accessing this feature. Please check your inbox for a verification email.'
      );
    }

    // Create default user only after email verification
    await db.collection('users').doc(userId).set({
      email: auth.token.email,
      emailVerified: true,
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

      // Initialize Stripe with secret (trim to remove trailing newlines from Secret Manager)
      const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: '2023-10-16' });

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

      // SEC-001: Validate return URL to prevent open redirect
      const validatedReturnUrl = validateReturnUrl(data.returnUrl);

      // Validate and use currency from client (with whitelist validation)
      const currency = validateCurrency(data.currency);
      const unitAmount = CURRENCY_PRICING[currency];

      // Create checkout session for Premium subscription (phases 3-5 access)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: 'Spicy vs Sweet Premium',
                description: 'Unlimited access to all 5 game phases',
              },
              unit_amount: unitAmount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        success_url: `${validatedReturnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: validatedReturnUrl,
        metadata: {
          firebaseUID: userId,
          subscriptionType: 'premium',
          currency: currency,
        },
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
      const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: '2023-10-16' });

      const userId = auth.uid;
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.stripeCustomerId) {
        throw new HttpsError('not-found', 'No Stripe customer found');
      }

      // SEC-001: Validate return URL to prevent open redirect
      const validatedReturnUrl = validateReturnUrl(data.returnUrl);

      const session = await stripe.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: validatedReturnUrl,
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
    const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: '2023-10-16' });

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
 * SEC-009: Added idempotency to prevent duplicate processing
 * SEC-010: Sanitized logging
 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    // SEC-009: Validate signature header exists
    if (!sig) {
      console.error('Webhook error: Missing stripe-signature header');
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    // Initialize Stripe with secret
    const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: '2023-10-16' });

    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        sig,
        stripeWebhookSecret.value()
      );

      // SEC-009: Check idempotency - prevent duplicate processing
      const eventId = event.id;
      const processedRef = db.collection('processedWebhooks').doc(eventId);
      const processedDoc = await processedRef.get();

      if (processedDoc.exists) {
        console.log(`Webhook ${eventId} already processed, skipping`);
        res.json({ received: true, skipped: true });
        return;
      }

      // Mark as processed immediately to prevent race conditions
      await processedRef.set({
        eventType: event.type,
        processedAt: FieldValue.serverTimestamp(),
      });

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.firebaseUID;

          // SEC-009: Validate userId format
          if (!userId || typeof userId !== 'string' || !/^[a-zA-Z0-9]+$/.test(userId)) {
            console.error('Invalid userId in webhook metadata');
            break;
          }

          if (session.subscription) {
            await db.collection('users').doc(userId).update({
              subscriptionStatus: 'active',
              subscriptionId: session.subscription,
              hasPremiumAccess: true, // Unlocks phases 3, 4, 5
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

            // SEC-009: Validate userId format
            if (typeof userId !== 'string' || !/^[a-zA-Z0-9]+$/.test(userId)) {
              console.error('Invalid userId in customer metadata');
              break;
            }

            const isActive = subscription.status === 'active';

            await db.collection('users').doc(userId).update({
              subscriptionStatus: isActive ? 'active' : 'free',
              hasPremiumAccess: isActive, // Phases 3-5 access based on subscription status
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (error: unknown) {
      // SEC-010: Sanitize error logs
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Webhook error:', sanitizeLog(message));
      res.status(400).send(`Webhook Error: ${sanitizeLog(message)}`);
    }
  }
);


import { generateGameQuestionsFlow } from './services/gameGenerator';
import { validateAnswer } from './services/answerValidator';

/**
 * Generate Game Questions (AI)
 * Use Gemini to generate funny/absurd questions for the game.
 * Protected by App Check.
 * Automatically saves generated questions to Firestore for reuse.
 * SEC-004: Rate limited
 * SEC-005: Input validation with Zod
 */
export const generateGameQuestions = onCall(
  {
    consumeAppCheckToken: true,
    timeoutSeconds: 300, // gemini-3-flash-preview uses "thinking" tokens, needs more time
    memory: "1GiB",     // Genkit + Gemini needs some memory
    secrets: [geminiApiKey, googleCseEngineId], // Required for Genkit/Gemini + fact-check search
  },
  async ({ data, auth }) => {
    // 1. Auth Check (Host only ideally, but at least authenticated)
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to generate content.');
    }

    // SEC-004: Check rate limit BEFORE any expensive operations
    await checkRateLimit(auth.uid, 'generateGameQuestions');

    // SEC-005: Validate input with Zod schema
    let validatedData;
    try {
      validatedData = GenerateQuestionsSchema.parse(data);
    } catch (zodError) {
      const message = zodError instanceof z.ZodError
        ? zodError.errors.map(e => e.message).join(', ')
        : 'Invalid input';
      throw new HttpsError('invalid-argument', message);
    }

    const { phase, topic, difficulty, language, roomCode, soloMode, completeCount, existingQuestions } = validatedData;

    // 2. Premium Check for phases 3, 4, 5 (BEFORE generation to save costs)
    // Solo mode bypasses premium check (free practice mode with no persistence)
    const PREMIUM_PHASES = ['phase3', 'phase4', 'phase5'];
    if (PREMIUM_PHASES.includes(phase) && !soloMode) {
      const userDoc = await db.collection('users').doc(auth.uid).get();
      const userData = userDoc.data();
      if (userData?.subscriptionStatus !== 'active') {
        throw new HttpsError('permission-denied', 'Premium subscription required for phases 3-5');
      }
    }

    // 3. Idempotency Check: If room already has questions for this phase, return them
    if (roomCode) {
      const roomSnap = await admin.database()
        .ref(`rooms/${roomCode}/customQuestions/${phase}`)
        .once('value');

      if (roomSnap.exists()) {
        // SEC-010: Don't log room codes in production
        console.log(`Room already has ${phase} questions, skipping generation`);
        return {
          success: true,
          data: roomSnap.val(),
          skipped: true,
          topic: topic || 'cached',
          usage: { totalTokens: 0, estimatedCost: 0 }
        };
      }
    }

    try {
      // 4. Call Genkit Flow (with optional completion mode)
      const result = await generateGameQuestionsFlow({
        phase,
        topic: topic || 'General Knowledge',
        difficulty: difficulty || 'normal',
        language: language || 'fr',
        // Completion mode parameters
        completeCount,
        existingQuestions,
      });

      // 5. Shuffle options for MCQ questions (phase1) to randomize correct answer position
      let processedData = result.data;
      if (phase === 'phase1' && Array.isArray(result.data)) {
        processedData = result.data.map((q: { text: string; options: string[]; correctIndex: number; anecdote?: string }) => {
          // Fisher-Yates shuffle with index tracking
          const options = [...q.options];
          const correctAnswer = options[q.correctIndex];

          // Shuffle the options array
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }

          // Find new position of correct answer
          const newCorrectIndex = options.indexOf(correctAnswer);

          return {
            ...q,
            options,
            correctIndex: newCorrectIndex,
          };
        });
      }

      // 6. Save to Firestore for reuse (different structure per phase)
      // Include embeddings for semantic deduplication
      const embeddings = result.embeddings || [];
      try {
        if (phase === 'phase2') {
          // Phase 2: Save each item individually with its embedding
          const setData = processedData as { optionA: string; optionB: string; optionADescription?: string; optionBDescription?: string; humorousDescription?: string; items: Array<{ text: string; answer: string }> };
          const batch = db.batch();
          const questionsRef = db.collection('questions');

          for (let i = 0; i < setData.items.length; i++) {
            const item = setData.items[i];
            const docRef = questionsRef.doc();
            batch.set(docRef, {
              phase,
              topic: topic || 'General Knowledge',
              difficulty: difficulty || 'normal',
              optionA: setData.optionA,
              optionB: setData.optionB,
              optionADescription: setData.optionADescription || null,
              optionBDescription: setData.optionBDescription || null,
              humorousDescription: setData.humorousDescription || null,
              text: item.text,
              answer: item.answer,
              embedding: embeddings[i] || null,
              embeddingModel: embeddings[i] ? 'text-embedding-004' : null,
              createdAt: FieldValue.serverTimestamp(),
              usageCount: 0,
              generatedBy: auth?.uid || 'anonymous',
            });
          }

          await batch.commit();
          console.log(`📦 Saved ${setData.items.length} ${phase} items to Firestore with embeddings`);
        } else if (phase === 'phase1') {
          // Phase 1: Save each question individually with embedding
          const questions = Array.isArray(processedData) ? processedData : [];
          const batch = db.batch();
          const questionsRef = db.collection('questions');

          for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const docRef = questionsRef.doc();
            batch.set(docRef, {
              phase,
              topic: topic || 'General Knowledge',
              difficulty: difficulty || 'normal',
              ...question,
              embedding: embeddings[i] || null,
              embeddingModel: embeddings[i] ? 'text-embedding-004' : null,
              createdAt: FieldValue.serverTimestamp(),
              usageCount: 0,
              generatedBy: auth?.uid || 'anonymous',
            });
          }

          await batch.commit();
          console.log(`📦 Saved ${questions.length} ${phase} questions to Firestore with embeddings`);
        } else {
          // Phase 3, 4, 5: Save each question individually (no embeddings yet)
          const questions = Array.isArray(processedData) ? processedData : [];
          const batch = db.batch();
          const questionsRef = db.collection('questions');

          for (const question of questions) {
            const docRef = questionsRef.doc();
            batch.set(docRef, {
              phase,
              topic: topic || 'General Knowledge',
              difficulty: difficulty || 'normal',
              ...question,
              createdAt: FieldValue.serverTimestamp(),
              usageCount: 0,
              generatedBy: auth?.uid || 'anonymous',
            });
          }

          await batch.commit();
          console.log(`📦 Saved ${questions.length} ${phase} questions to Firestore`);
        }
      } catch (saveError) {
        // Log but don't fail the request - questions are still usable
        console.error('Failed to save questions to Firestore:', saveError);
      }

      return {
        success: true,
        data: processedData,
        topic: result.topic, // Return the AI-generated topic
        language: result.language, // Return the language used
        usage: result.usage
      };
    } catch (e: unknown) {
      console.error('AI Generation Error:', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      throw new HttpsError('internal', `Generation failed: ${message}`);
    }
  }
);

/**
 * Validate Phase 3 Answer
 * Uses LLM to validate player answers against correct answers.
 * Supports fuzzy matching for typos, synonyms, and abbreviations.
 * Protected by App Check.
 */
export const validatePhase3Answer = onCall(
  {
    consumeAppCheckToken: true,
    timeoutSeconds: 30, // Quick validation should be fast
    secrets: [geminiApiKey], // Required for LLM validation
  },
  async ({ data, auth }) => {
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // SEC-004: Check rate limit
    await checkRateLimit(auth.uid, 'validatePhase3Answer');

    // SEC-005: Validate input with Zod schema
    let validatedData;
    try {
      validatedData = ValidatePhase3Schema.parse(data);
    } catch (zodError) {
      const message = zodError instanceof z.ZodError
        ? zodError.errors.map(e => e.message).join(', ')
        : 'Invalid input';
      throw new HttpsError('invalid-argument', message);
    }

    const { playerAnswer, correctAnswer, acceptableAnswers } = validatedData;

    try {
      const result = await validateAnswer(
        playerAnswer,
        correctAnswer,
        acceptableAnswers ?? undefined // Convert null to undefined
      );

      return {
        isCorrect: result.isCorrect,
        confidence: result.confidence,
        matchType: result.matchType,
        explanation: result.explanation,
      };
    } catch (error) {
      console.error('[validatePhase3Answer] Error:', error);
      const message = error instanceof Error ? error.message : 'Validation failed';
      throw new HttpsError('internal', message);
    }
  }
);

import { validateAnswerBatch } from './services/answerValidator';

/**
 * Validate Phase 5 Answers
 * Validates 10 answers from each team representative using LLM.
 * Calculates points: +5 if first 5 correct in order, +10 if all 10 correct in order, 0 otherwise.
 * Protected by App Check.
 */
export const validatePhase5Answers = onCall(
  {
    consumeAppCheckToken: true,
    timeoutSeconds: 120, // May need more time for 20 validations
    memory: '512MiB',
    secrets: [geminiApiKey], // Required for LLM validation
  },
  async ({ data, auth }) => {
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // SEC-004: Check rate limit
    await checkRateLimit(auth.uid, 'validatePhase5Answers');

    // SEC-005: Validate input with Zod schema
    let validatedData;
    try {
      validatedData = ValidatePhase5Schema.parse(data);
    } catch (zodError) {
      const message = zodError instanceof z.ZodError
        ? zodError.errors.map(e => e.message).join(', ')
        : 'Invalid input';
      throw new HttpsError('invalid-argument', message);
    }

    const { questions, spicyAnswers, sweetAnswers } = validatedData;

    try {
      // Prepare validation batches for both teams
      const spicyValidationInput = questions.map((q, i) => ({
        playerAnswer: spicyAnswers[i] || '',
        correctAnswer: q.answer,
        acceptableAnswers: q.acceptableAnswers ?? undefined, // Convert null to undefined
      }));

      const sweetValidationInput = questions.map((q, i) => ({
        playerAnswer: sweetAnswers[i] || '',
        correctAnswer: q.answer,
        acceptableAnswers: q.acceptableAnswers ?? undefined, // Convert null to undefined
      }));

      // Validate both teams in parallel
      const [spicyResults, sweetResults] = await Promise.all([
        validateAnswerBatch(spicyValidationInput),
        validateAnswerBatch(sweetValidationInput),
      ]);

      // Build team results
      const buildTeamResult = (
        validationResults: Awaited<ReturnType<typeof validateAnswerBatch>>,
        answers: string[],
        questionsList: Array<{ answer: string }>
      ) => {
        const answerResults = validationResults.map((result, index) => ({
          index,
          expected: questionsList[index].answer,
          given: answers[index] || '',
          isCorrect: result.isCorrect,
          explanation: result.explanation,
        }));

        // Check if first 5 are all correct (in order)
        const first5Correct = answerResults.slice(0, 5).every(r => r.isCorrect);

        // Check if all 10 are correct (in order)
        const all10Correct = answerResults.every(r => r.isCorrect);

        // Calculate points: +10 for all 10, +5 for first 5, 0 otherwise
        let points = 0;
        if (all10Correct) {
          points = 10;
        } else if (first5Correct) {
          points = 5;
        }

        return {
          answers: answerResults,
          first5Correct,
          all10Correct,
          points,
        };
      };

      const spicyTeamResult = buildTeamResult(spicyResults, spicyAnswers, questions);
      const sweetTeamResult = buildTeamResult(sweetResults, sweetAnswers, questions);

      console.log(`[validatePhase5Answers] Spicy: ${spicyTeamResult.points}pts (5/5: ${spicyTeamResult.first5Correct}, 10/10: ${spicyTeamResult.all10Correct})`);
      console.log(`[validatePhase5Answers] Sweet: ${sweetTeamResult.points}pts (5/5: ${sweetTeamResult.first5Correct}, 10/10: ${sweetTeamResult.all10Correct})`);

      return {
        spicy: spicyTeamResult,
        sweet: sweetTeamResult,
      };
    } catch (error) {
      console.error('[validatePhase5Answers] Error:', error);
      const message = error instanceof Error ? error.message : 'Validation failed';
      throw new HttpsError('internal', message);
    }
  }
);

// ============================================================================
// SOLO LEADERBOARD SCORE VALIDATION
// ============================================================================

/**
 * Scoring constants for solo mode (must match frontend soloTypes.ts)
 */
const SOLO_SCORING_SERVER = {
  phase1: {
    correctAnswer: 1, // +1 per correct answer
    maxQuestions: 10,
  },
  phase2: {
    correctAnswer: 1, // +1 per correct classification
    maxItems: 12,
  },
  phase4: {
    // Speed-based scoring
    fast: { threshold: 5000, points: 3 },    // < 5s = 3 pts
    medium: { threshold: 15000, points: 2 }, // < 15s = 2 pts
    slow: { threshold: 30000, points: 1 },   // < 30s = 1 pt
    timeout: 0, // timeout = 0 pts
    maxQuestions: 10,
    questionTimeLimit: 30000, // 30 seconds
  },
} as const;

/**
 * Calculate Phase 4 score based on response time (server-side)
 */
function calculatePhase4ScoreServer(timeMs: number): number {
  const { fast, medium, slow, timeout, questionTimeLimit } = SOLO_SCORING_SERVER.phase4;

  if (timeMs >= questionTimeLimit) return timeout;
  if (timeMs < fast.threshold) return fast.points;
  if (timeMs < medium.threshold) return medium.points;
  return slow.points;
}

/**
 * Zod schema for solo score validation input
 */
const ValidateSoloScoreSchema = z.object({
  // Player info
  playerName: z.string().min(1).max(50),
  playerAvatar: z.string().min(1).max(30),

  // Phase 1 answers: array of { answerIndex, isCorrect }
  phase1Answers: z.array(z.object({
    answerIndex: z.number().int().min(0).max(3),
    isCorrect: z.boolean(),
  })).max(SOLO_SCORING_SERVER.phase1.maxQuestions),

  // Phase 2 answers: array of { answer: 'A'|'B'|'Both', isCorrect }
  phase2Answers: z.array(z.object({
    answer: z.enum(['A', 'B', 'Both']),
    isCorrect: z.boolean(),
  })).max(SOLO_SCORING_SERVER.phase2.maxItems),

  // Phase 4 answers: array of { answerIndex, isCorrect, timeMs }
  phase4Answers: z.array(z.object({
    answerIndex: z.number().int().min(-1).max(3), // -1 for timeout
    isCorrect: z.boolean(),
    timeMs: z.number().int().min(0).max(SOLO_SCORING_SERVER.phase4.questionTimeLimit + 1000), // +1s tolerance
  })).max(SOLO_SCORING_SERVER.phase4.maxQuestions),

  // Submitted scores (for validation)
  submittedScore: z.number().int().min(0).max(100), // Max possible is ~52
  submittedPhase1Score: z.number().int().min(0).max(SOLO_SCORING_SERVER.phase1.maxQuestions),
  submittedPhase2Score: z.number().int().min(0).max(SOLO_SCORING_SERVER.phase2.maxItems),
  submittedPhase4Score: z.number().int().min(0).max(SOLO_SCORING_SERVER.phase4.fast.points * SOLO_SCORING_SERVER.phase4.maxQuestions),

  // Stats
  totalTimeMs: z.number().int().min(0).max(1800000), // Max 30 minutes
});

/**
 * Validate Solo Score
 * Recalculates the score from answer history and writes to leaderboard if valid.
 * Protected by authentication - only logged-in users can submit scores.
 * SEC-010: Server-side validation prevents score manipulation.
 */
export const validateSoloScore = onCall(
  {
    consumeAppCheckToken: true,
  },
  async ({ data, auth }) => {
    // 1. Auth Check
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to submit score');
    }

    // 2. Validate input with Zod schema
    let validatedData;
    try {
      validatedData = ValidateSoloScoreSchema.parse(data);
    } catch (zodError) {
      const message = zodError instanceof z.ZodError
        ? zodError.errors.map(e => e.message).join(', ')
        : 'Invalid input';
      throw new HttpsError('invalid-argument', message);
    }

    const {
      playerName,
      playerAvatar,
      phase1Answers,
      phase2Answers,
      phase4Answers,
      submittedScore,
      submittedPhase1Score,
      submittedPhase2Score,
      submittedPhase4Score,
      totalTimeMs,
    } = validatedData;

    // 3. Recalculate scores from answers
    const calculatedPhase1Score = phase1Answers.reduce((sum, a) => sum + (a.isCorrect ? SOLO_SCORING_SERVER.phase1.correctAnswer : 0), 0);
    const calculatedPhase2Score = phase2Answers.reduce((sum, a) => sum + (a.isCorrect ? SOLO_SCORING_SERVER.phase2.correctAnswer : 0), 0);
    const calculatedPhase4Score = phase4Answers.reduce((sum, a) => sum + (a.isCorrect ? calculatePhase4ScoreServer(a.timeMs) : 0), 0);
    const calculatedTotalScore = calculatedPhase1Score + calculatedPhase2Score + calculatedPhase4Score;

    // 4. Validate scores match (with small tolerance for edge cases)
    const scoreTolerance = 1; // Allow 1 point tolerance for timing edge cases

    if (Math.abs(calculatedPhase1Score - submittedPhase1Score) > scoreTolerance) {
      console.warn(`[validateSoloScore] Phase 1 score mismatch: calculated=${calculatedPhase1Score}, submitted=${submittedPhase1Score}`);
      throw new HttpsError('invalid-argument', 'Score validation failed: Phase 1 mismatch');
    }

    if (Math.abs(calculatedPhase2Score - submittedPhase2Score) > scoreTolerance) {
      console.warn(`[validateSoloScore] Phase 2 score mismatch: calculated=${calculatedPhase2Score}, submitted=${submittedPhase2Score}`);
      throw new HttpsError('invalid-argument', 'Score validation failed: Phase 2 mismatch');
    }

    if (Math.abs(calculatedPhase4Score - submittedPhase4Score) > scoreTolerance) {
      console.warn(`[validateSoloScore] Phase 4 score mismatch: calculated=${calculatedPhase4Score}, submitted=${submittedPhase4Score}`);
      throw new HttpsError('invalid-argument', 'Score validation failed: Phase 4 mismatch');
    }

    if (Math.abs(calculatedTotalScore - submittedScore) > scoreTolerance) {
      console.warn(`[validateSoloScore] Total score mismatch: calculated=${calculatedTotalScore}, submitted=${submittedScore}`);
      throw new HttpsError('invalid-argument', 'Score validation failed: Total mismatch');
    }

    // 5. Calculate accuracy
    const totalQuestions = phase1Answers.length + phase2Answers.length + phase4Answers.length;
    const correctAnswers = phase1Answers.filter(a => a.isCorrect).length +
                          phase2Answers.filter(a => a.isCorrect).length +
                          phase4Answers.filter(a => a.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // 6. Check if player already has a score - only keep best score
    const userId = auth.uid;
    const leaderboardRef = db.collection('soloLeaderboard');

    const existingQuery = leaderboardRef.where('playerId', '==', userId).limit(1);
    const existingDocs = await existingQuery.get();

    // Use the calculated score (server-validated) for the leaderboard
    const validatedScore = calculatedTotalScore;

    if (!existingDocs.empty) {
      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data();

      // Only update if new score is better
      if (validatedScore > existingData.score) {
        await existingDoc.ref.update({
          playerName,
          playerAvatar,
          score: validatedScore,
          phase1Score: calculatedPhase1Score,
          phase2Score: calculatedPhase2Score,
          phase4Score: calculatedPhase4Score,
          accuracy,
          totalTimeMs,
          isAuthenticated: true,
          createdAt: FieldValue.serverTimestamp(),
        });

        console.log(`[validateSoloScore] Updated score for ${userId}: ${existingData.score} -> ${validatedScore}`);
        return {
          success: true,
          validatedScore,
          isNewBest: true,
          previousScore: existingData.score,
        };
      }

      // Score is not better, don't update
      console.log(`[validateSoloScore] Score not better for ${userId}: current=${existingData.score}, new=${validatedScore}`);
      return {
        success: true,
        validatedScore,
        isNewBest: false,
        previousScore: existingData.score,
      };
    }

    // 7. Create new leaderboard entry
    await leaderboardRef.add({
      playerId: userId,
      playerName,
      playerAvatar,
      score: validatedScore,
      phase1Score: calculatedPhase1Score,
      phase2Score: calculatedPhase2Score,
      phase4Score: calculatedPhase4Score,
      accuracy,
      totalTimeMs,
      isAuthenticated: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`[validateSoloScore] New score for ${userId}: ${validatedScore}`);
    return {
      success: true,
      validatedScore,
      isNewBest: true,
      previousScore: null,
    };
  }
);

