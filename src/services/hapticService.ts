/**
 * Haptic Feedback Service
 * Uses native haptics on Capacitor, falls back to navigator.vibrate on web.
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platformService';

class HapticService {
  /**
   * Fallback to web vibration
   */
  private webVibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Safe wrapper for native haptics - catches errors for unsupported platforms
   */
  private safeHaptic(action: () => Promise<void>): void {
    action().catch((error) => {
      // Haptics may not be available on all devices/platforms
      // Use console.warn for better visibility in production debugging
      console.warn('Haptic feedback not available:', error);
    });
  }

  /**
   * Short tap feedback - for button presses
   */
  public tap(): void {
    if (isNative()) {
      this.safeHaptic(() => Haptics.impact({ style: ImpactStyle.Light }));
    } else {
      this.webVibrate(10);
    }
  }

  /**
   * Success feedback - for correct answers
   */
  public success(): void {
    if (isNative()) {
      this.safeHaptic(() => Haptics.notification({ type: NotificationType.Success }));
    } else {
      this.webVibrate(100);
    }
  }

  /**
   * Error feedback - for wrong answers
   */
  public error(): void {
    if (isNative()) {
      this.safeHaptic(() => Haptics.notification({ type: NotificationType.Error }));
    } else {
      this.webVibrate([50, 30, 50]);
    }
  }

  /**
   * Buzzer feedback - for Phase 4 buzzer press
   */
  public buzzer(): void {
    if (isNative()) {
      this.safeHaptic(() => Haptics.impact({ style: ImpactStyle.Medium }));
    } else {
      this.webVibrate(20);
    }
  }

  /**
   * Legacy vibrate method for backwards compatibility
   */
  public vibrate(pattern: number | number[]): void {
    if (isNative()) {
      this.safeHaptic(() => Haptics.vibrate());
    } else {
      this.webVibrate(pattern);
    }
  }
}

export const hapticService = new HapticService();
