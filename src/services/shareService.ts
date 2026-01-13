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
  } catch {
    // User cancelled or error
    return false;
  }
};

/**
 * Check if native share is available
 */
export const canShare = (): boolean => {
  return isNative() || 'share' in navigator;
};

/**
 * Share room code with invite message
 */
export const shareRoomInvite = async (
  roomCode: string,
  appUrl: string
): Promise<boolean> => {
  return shareContent({
    title: 'Spicy vs Sweet - Rejoins ma partie !',
    text: `🌶️ vs 🍬 Rejoins ma partie Spicy vs Sweet !\n\nCode de room : ${roomCode}`,
    url: `${appUrl}?code=${roomCode}`
  });
};
