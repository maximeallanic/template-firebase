/**
 * Share Service
 * Native share on Capacitor, Web Share API fallback.
 */
import { Share } from '@capacitor/share';
import { isNative } from './platformService';

interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

/**
 * Error codes/patterns that indicate user cancellation across platforms
 */
const CANCELLATION_PATTERNS = [
  'cancel',
  'abort',
  'dismiss',
  'share was not completed',
  'user did not share',
] as const;

/**
 * Check if an error represents a user cancellation
 * Uses multiple patterns to handle different platforms and SDK versions
 */
function isCancelledError(error: unknown): boolean {
  if (!error) return false;

  // Check for error code (preferred method)
  const errorCode = (error as { code?: string }).code;
  if (errorCode && CANCELLATION_PATTERNS.some(pattern =>
    errorCode.toLowerCase().includes(pattern)
  )) {
    return true;
  }

  // Fallback to message checking for backward compatibility
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return CANCELLATION_PATTERNS.some(pattern => message.includes(pattern));
  }

  return false;
}

/**
 * Share content using native share sheet or Web Share API
 */
export const shareContent = async (options: ShareOptions): Promise<boolean> => {
  try {
    if (isNative()) {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.title
      });
      return true;
    }

    // Web Share API fallback
    if (navigator.share) {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url
      });
      return true;
    }

    // No share API available
    return false;
  } catch (error) {
    // User cancelled share dialog or share failed
    // Check for cancellation patterns across different platforms
    const isCancellation = isCancelledError(error);
    if (!isCancellation) {
      console.warn('Share failed:', error instanceof Error ? error.message : error);
    }
    return false;
  }
};

/**
 * Check if native share is available
 */
export const canShare = (): boolean => {
  return isNative() || 'share' in navigator;
};

interface ShareRoomInviteOptions {
  /** Translated title for the share dialog */
  title: string;
  /** Translated message body (use {code} placeholder for room code) */
  message: string;
}

/**
 * Share room code with invite message
 * @param roomCode - The 4-character room code
 * @param appUrl - The base URL of the app
 * @param options - Translated strings for the share content
 */
export const shareRoomInvite = async (
  roomCode: string,
  appUrl: string,
  options: ShareRoomInviteOptions
): Promise<boolean> => {
  const text = options.message.replace('{code}', roomCode);
  return shareContent({
    title: options.title,
    text,
    url: `${appUrl}?code=${roomCode}`
  });
};
