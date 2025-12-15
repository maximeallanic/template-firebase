import { convert } from 'html-to-text';

/**
 * Extracts plain text from Mailgun payload
 * Prioritizes body-plain, falls back to cleaned HTML
 */
export function extractPlainText(mailgunPayload: Record<string, unknown>): string {
  // First try plain text body
  if (mailgunPayload['body-plain'] && typeof mailgunPayload['body-plain'] === 'string') {
    return mailgunPayload['body-plain'];
  }

  // Fall back to HTML conversion
  if (mailgunPayload['body-html'] && typeof mailgunPayload['body-html'] === 'string') {
    return convert(mailgunPayload['body-html'], {
      wordwrap: false,
      selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'style', format: 'skip' },
        { selector: 'script', format: 'skip' },
      ],
    });
  }

  return '';
}

/**
 * Cleans email content by removing signatures, disclaimers, and excessive whitespace
 */
export function cleanEmailContent(text: string): string {
  let cleaned = text;

  // Remove multiple consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Common signature patterns to detect and remove
  const signaturePatterns = [
    /^--\s*$/m, // Standard email signature delimiter
    /^Sent from my .*/mi,
    /^Get Outlook for .*/mi,
    /^Sent from Yahoo Mail.*/mi,
    /^Sent via .*/mi,
    /^This email has been scanned.*/mi,
    /^Confidentiality Notice:.*/mi,
  ];

  // Find the earliest signature pattern and cut there
  let earliestSignatureIndex = cleaned.length;
  signaturePatterns.forEach((pattern) => {
    const match = cleaned.search(pattern);
    if (match !== -1 && match < earliestSignatureIndex) {
      earliestSignatureIndex = match;
    }
  });

  if (earliestSignatureIndex < cleaned.length) {
    cleaned = cleaned.substring(0, earliestSignatureIndex);
  }

  // Remove quoted replies (lines starting with > or |)
  const lines = cleaned.split('\n');
  const nonQuotedLines = lines.filter((line) => {
    const trimmed = line.trim();
    return !trimmed.startsWith('>') && !trimmed.startsWith('|');
  });
  cleaned = nonQuotedLines.join('\n');

  // Final cleanup
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Extracts subject and body from Mailgun payload
 */
export function extractEmailBody(mailgunPayload: Record<string, unknown>): {
  subject: string;
  body: string;
} {
  const subject =
    typeof mailgunPayload.subject === 'string' ? mailgunPayload.subject : '(No subject)';

  const rawBody = extractPlainText(mailgunPayload);
  const body = cleanEmailContent(rawBody);

  return { subject, body };
}

/**
 * Validates that email content is within acceptable limits
 */
export function validateEmailContent(
  subject: string,
  body: string
): { valid: boolean; error?: string } {
  if (!body || body.trim().length === 0) {
    return {
      valid: false,
      error: 'Email body is empty',
    };
  }

  if (body.length < 10) {
    return {
      valid: false,
      error: 'Email is too short (minimum 10 characters)',
    };
  }

  if (body.length > 10000) {
    return {
      valid: false,
      error: 'Email is too long (maximum 10000 characters)',
    };
  }

  return { valid: true };
}

/**
 * Formats email content for analysis (combines subject and body)
 */
export function formatForAnalysis(subject: string, body: string): string {
  return `Subject: ${subject}\n\n${body}`;
}
