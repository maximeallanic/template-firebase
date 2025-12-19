import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, admin } from './config/firebase';
import Stripe from 'stripe';

// Define secrets for production (Secret Manager)
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

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

      // Create checkout session for Premium subscription (phases 3-5 access)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Spicy vs Sweet Premium',
                description: 'Accès illimité aux 5 phases de jeu',
              },
              unit_amount: 499, // 4.99 EUR
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        success_url: `${data.returnUrl || process.env.APP_URL || 'https://example.com'}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: data.returnUrl || process.env.APP_URL || 'https://example.com',
        metadata: { firebaseUID: userId, subscriptionType: 'premium' },
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
 */
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    // Initialize Stripe with secret
    const stripe = new Stripe(stripeSecretKey.value().trim(), { apiVersion: '2023-10-16' });

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
      console.error('Webhook error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).send(`Webhook Error: ${message}`);
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
 */
export const generateGameQuestions = onCall(
  {
    consumeAppCheckToken: true,
    timeoutSeconds: 300, // gemini-3-flash-preview uses "thinking" tokens, needs more time
    memory: "1GiB",     // Genkit + Gemini needs some memory
  },
  async ({ data, auth }) => {
    // 1. Auth Check (Host only ideally, but at least authenticated)
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to generate content.');
    }

    // 2. Data Validation
    const { phase, topic, difficulty, roomCode } = data;

    // 3. Premium Check for phases 3, 4, 5
    const PREMIUM_PHASES = ['phase3', 'phase4', 'phase5'];
    if (PREMIUM_PHASES.includes(phase)) {
      const userDoc = await db.collection('users').doc(auth.uid).get();
      const userData = userDoc.data();
      if (userData?.subscriptionStatus !== 'active') {
        throw new HttpsError('permission-denied', 'Premium subscription required for phases 3-5');
      }
    }
    if (!phase || !['phase1', 'phase2', 'phase3', 'phase4', 'phase5'].includes(phase)) {
      throw new HttpsError('invalid-argument', 'Invalid phase provided.');
    }

    // 3. Idempotency Check: If room already has questions for this phase, return them
    if (roomCode) {
      const roomSnap = await admin.database()
        .ref(`rooms/${roomCode.toUpperCase()}/customQuestions/${phase}`)
        .once('value');

      if (roomSnap.exists()) {
        console.log(`⏭️ Room ${roomCode} already has ${phase} questions, skipping generation`);
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
      // 4. Call Genkit Flow
      const result = await generateGameQuestionsFlow({
        phase,
        topic: topic || 'General Knowledge',
        difficulty: difficulty || 'normal',
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
          const setData = processedData as { optionA: string; optionB: string; items: Array<{ text: string; answer: string }> };
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
  },
  async ({ data, auth }) => {
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { playerAnswer, correctAnswer, acceptableAnswers } = data;

    if (!playerAnswer || !correctAnswer) {
      throw new HttpsError('invalid-argument', 'playerAnswer and correctAnswer are required');
    }

    try {
      const result = await validateAnswer(
        playerAnswer,
        correctAnswer,
        acceptableAnswers
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
  },
  async ({ data, auth }) => {
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { questions, spicyAnswers, sweetAnswers } = data;

    // Validate input
    if (!Array.isArray(questions) || questions.length !== 10) {
      throw new HttpsError('invalid-argument', 'questions must be an array of 10 items');
    }
    if (!Array.isArray(spicyAnswers) || spicyAnswers.length !== 10) {
      throw new HttpsError('invalid-argument', 'spicyAnswers must be an array of 10 items');
    }
    if (!Array.isArray(sweetAnswers) || sweetAnswers.length !== 10) {
      throw new HttpsError('invalid-argument', 'sweetAnswers must be an array of 10 items');
    }

    try {
      // Prepare validation batches for both teams
      const spicyValidationInput = questions.map((q: { answer: string; acceptableAnswers?: string[] }, i: number) => ({
        playerAnswer: spicyAnswers[i] || '',
        correctAnswer: q.answer,
        acceptableAnswers: q.acceptableAnswers,
      }));

      const sweetValidationInput = questions.map((q: { answer: string; acceptableAnswers?: string[] }, i: number) => ({
        playerAnswer: sweetAnswers[i] || '',
        correctAnswer: q.answer,
        acceptableAnswers: q.acceptableAnswers,
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

