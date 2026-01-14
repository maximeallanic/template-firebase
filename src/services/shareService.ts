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
    // Only log actual errors, not user cancellations
    if (error instanceof Error && !error.message.includes('cancel')) {
      console.warn('Share failed:', error.message);
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
