import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './config/firebase';
import { verifyMailgunWebhook, isWebhookTimestampValid } from './utils/mailgunValidator';
import { generateSessionId, isSystemEmail } from './utils/sessionIdGenerator';
import { extractEmailBody, validateEmailContent, formatForAnalysis } from './utils/emailParser';
import { analyzeEmailFlow } from './services/aiAnalysis';

const mailgunWebhookSecret = defineSecret('MAILGUN_WEBHOOK_SIGNING_KEY');

/**
 * Webhook endpoint for receiving emails from Mailgun
 * Processes the email and performs AI analysis
 */
export const receiveEmailWebhook = onRequest(
  {
    timeoutSeconds: 300,
    secrets: [mailgunWebhookSecret]
  },
  async (req, res) => {
    try {
      console.log('📧 Received email webhook from Mailgun');

      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
      }

      // Extract Mailgun signature for verification (fields are directly in body)
      const timestamp = req.body.timestamp;
      const token = req.body.token;
      const signature = req.body.signature;

      // Verify webhook authenticity
      if (!timestamp || !token || !signature) {
        console.error('❌ Missing signature fields');
        console.error('Received timestamp:', timestamp);
        console.error('Received token:', token);
        console.error('Received signature:', signature);
        res.status(401).send('Unauthorized: Missing signature');
        return;
      }

      // Check timestamp to prevent replay attacks
      if (!isWebhookTimestampValid(timestamp)) {
        console.error('❌ Webhook timestamp too old');
        res.status(401).send('Unauthorized: Timestamp expired');
        return;
      }

      // Verify HMAC signature
      if (!verifyMailgunWebhook(timestamp, token, signature, mailgunWebhookSecret.value())) {
        console.error('❌ Invalid webhook signature');
        res.status(401).send('Unauthorized: Invalid signature');
        return;
      }

      console.log('✅ Webhook signature verified');

      // Extract recipient email
      const recipient = req.body.recipient;
      if (!recipient || typeof recipient !== 'string') {
        console.error('❌ No recipient found');
        res.status(200).send('OK'); // Return 200 to prevent retries
        return;
      }

      console.log('📬 Recipient:', recipient);

      // Check if it's a system email we should ignore
      if (isSystemEmail(recipient)) {
        console.log('⚠️ System email, ignoring');
        res.status(200).send('OK');
        return;
      }

      // Generate session ID from recipient email
      const sessionId = generateSessionId(recipient);
      console.log('🔑 Session ID:', sessionId);

      // Get session from Firestore
      const sessionRef = db.collection('emailSessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists) {
        console.error('❌ Session not found for email:', recipient);
        res.status(200).send('OK'); // Return 200 to prevent retries
        return;
      }

      const sessionData = sessionDoc.data();

      // Check if session is expired
      const expiresAt = sessionData?.expiresAt;
      if (expiresAt && Timestamp.now().toMillis() > expiresAt.toMillis()) {
        console.error('❌ Session expired');
        await sessionRef.update({
          status: 'error',
          error: 'Session expired. Please generate a new email address.',
        });
        res.status(200).send('OK');
        return;
      }

      // Check if session already used (prevent double analysis)
      if (sessionData?.status !== 'waiting') {
        console.log('⚠️ Session already processed, status:', sessionData?.status);
        res.status(200).send('OK');
        return;
      }

      console.log('📝 Extracting email content...');

      // Extract and clean email content
      const { subject, body } = extractEmailBody(req.body);
      const senderEmail = req.body.sender || req.body.from;

      console.log('📧 Subject:', subject);
      console.log('📧 Body length:', body.length);

      // Update session to "received"
      await sessionRef.update({
        status: 'received',
        emailSubject: subject,
        senderEmail,
        receivedAt: FieldValue.serverTimestamp(),
      });

      // Validate email content
      const validation = validateEmailContent(subject, body);
      if (!validation.valid) {
        console.error('❌ Invalid email content:', validation.error);
        await sessionRef.update({
          status: 'error',
          error: validation.error,
        });
        res.status(200).send('OK');
        return;
      }

      // Update status to "analyzing"
      await sessionRef.update({
        status: 'analyzing',
      });

      console.log('🤖 Starting AI analysis...');

      // Perform AI analysis using Genkit flow (automatically traced)
      const emailContent = formatForAnalysis(subject, body);
      const userId = sessionData?.userId || 'guest';

      let result;
      try {
        result = await analyzeEmailFlow({
          emailContent,
          userId,
        });
      } catch (error) {
        console.error('❌ Failed to analyze email:', error);
        await sessionRef.update({
          status: 'error',
          error: 'Failed to analyze email. Please try again.',
        });
        res.status(200).send('OK');
        return;
      }

      console.log('✅ Analysis completed successfully');

      const analysis = result.analysis;
      const tokenUsage = {
        promptTokens: result.usage.promptTokens,
        candidatesTokens: result.usage.candidatesTokens,
        totalTokens: result.usage.totalTokens,
        thinkingTokens: result.usage.thinkingTokens,
      };

      // Increment usage counter and save to history (only if not already incremented)
      let analysisId: string | undefined;

      if (!sessionData?.usedQuota) {
        const userId = sessionData?.userId;
        const fingerprint = sessionData?.fingerprint;

        if (userId) {
          // Authenticated user - increment counter and save to history
          const userDoc = await db.collection('users').doc(userId).get();
          const userData = userDoc.data();

          if (userData) {
            // Check if period ended and reset
            const now = Timestamp.now();
            const periodEnd = userData.currentPeriodEnd;

            if (periodEnd && now.toMillis() > periodEnd.toMillis()) {
              await db.collection('users').doc(userId).update({
                analysesUsedThisMonth: 1,
                currentPeriodStart: FieldValue.serverTimestamp(),
                currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
              });
            } else {
              await db.collection('users').doc(userId).update({
                analysesUsedThisMonth: FieldValue.increment(1),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }

            // Save analysis to user's history subcollection with token usage
            const analysisDoc = await db.collection('users').doc(userId).collection('analyses').add({
              emailContent,
              analysis,
              usageMetadata: tokenUsage,
              createdAt: FieldValue.serverTimestamp(),
              source: 'email', // Mark as email-based analysis
              emailSubject: subject,
              senderEmail,
            });
            analysisId = analysisDoc.id;
            console.log('✅ Analysis saved to user history with ID:', analysisId);
          }
        } else if (fingerprint) {
          // Guest user - record free trial usage
          const guestUsageRef = db.collection('guestUsage').doc(fingerprint);
          await guestUsageRef.set({
            fingerprint,
            usedAt: FieldValue.serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            userAgent: req.headers['user-agent']?.substring(0, 200) || 'unknown',
          });
        }
      }

      // Update session with analysis result, completion status, and analysis ID (all in one update)
      const sessionUpdate: Record<string, unknown> = {
        status: 'completed',
        originalEmail: emailContent,
        analysis,
      };

      if (analysisId) {
        sessionUpdate.analysisId = analysisId;
      }

      if (!sessionData?.usedQuota) {
        sessionUpdate.usedQuota = true;
      }

      await sessionRef.update(sessionUpdate);

      console.log('✅ Email analysis webhook completed');
      res.status(200).send('OK');
    } catch (error: unknown) {
      console.error('❌ Error in email webhook:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).send(`Error: ${message}`);
    }
  }
);
