/**
 * Haptic Feedback Service
 * Provides vibration patterns for game interactions on mobile devices.
 * Gracefully degrades on unsupported browsers.
 */
class HapticService {
  /**
   * Check if the Vibration API is supported
   */
  private isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger a vibration with the given pattern
   * @param pattern - Duration in ms, or array of [vibrate, pause, vibrate, ...]
   */
  public vibrate(pattern: number | number[]): void {
    if (this.isSupported()) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Short tap feedback - for button presses
   */
  public tap(): void {
    this.vibrate(10);
  }

  /**
   * Success feedback - for correct answers
   */
  public success(): void {
    this.vibrate(100);
  }

  /**
   * Error feedback - for wrong answers
   */
  public error(): void {
    this.vibrate([50, 30, 50]);
  }

  /**
   * Buzzer feedback - for Phase 4 buzzer press
   */
  public buzzer(): void {
    this.vibrate(20);
  }
}

export const hapticService = new HapticService();
