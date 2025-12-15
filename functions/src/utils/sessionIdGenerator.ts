import * as crypto from 'crypto';

/**
 * Generates a deterministic session ID from an email address
 * Uses SHA256 hash of the email (lowercase) and returns first 16 characters
 */
export function generateSessionId(emailAddress: string): string {
  return crypto
    .createHash('sha256')
    .update(emailAddress.toLowerCase())
    .digest('hex')
    .substring(0, 16);
}

/**
 * Checks if an email address is a system email that should not be processed
 */
export function isSystemEmail(emailAddress: string): boolean {
  const systemPrefixes = [
    'support',
    'noreply',
    'no-reply',
    'admin',
    'hello',
    'contact',
    'info',
    'help',
    'postmaster',
    'webmaster',
    'abuse',
  ];

  const username = emailAddress.split('@')[0];
  return systemPrefixes.includes(username.toLowerCase());
}

/**
 * Validates that an email address is properly formatted
 */
export function isValidEmail(emailAddress: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailAddress);
}
