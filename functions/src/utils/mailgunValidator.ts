import * as crypto from 'crypto';

/**
 * Verifies the authenticity of a Mailgun webhook signature
 * This ensures the webhook request actually came from Mailgun
 *
 * @param timestamp - Timestamp from webhook
 * @param token - Random token from webhook
 * @param signature - HMAC signature from webhook
 * @param signingKey - Your Mailgun webhook signing key
 * @returns true if signature is valid
 */
export function verifyMailgunWebhook(
  timestamp: string,
  token: string,
  signature: string,
  signingKey: string
): boolean {
  try {
    const encodedData = `${timestamp}${token}`;
    const hmac = crypto.createHmac('sha256', signingKey);
    hmac.update(encodedData);
    const computedSignature = hmac.digest('hex');

    return signature === computedSignature;
  } catch (error) {
    console.error('Error verifying Mailgun webhook:', error);
    return false;
  }
}

/**
 * Checks if a webhook timestamp is within acceptable range (prevents replay attacks)
 * Mailgun recommends rejecting webhooks older than 15 minutes
 */
export function isWebhookTimestampValid(timestamp: string): boolean {
  const webhookTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(currentTime - webhookTime);

  // 15 minutes in seconds
  const maxAge = 15 * 60;

  return timeDifference <= maxAge;
}
