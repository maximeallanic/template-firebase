import { useEffect } from 'react';

/**
 * Hook to lock screen orientation to portrait mode in PWA.
 * Uses Screen Orientation API where supported (Android Chrome).
 * Falls back to CSS-based solution for iOS Safari.
 *
 * @param enabled - Whether to attempt orientation lock (default: true)
 */
export function useOrientationLock(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const lockOrientation = async () => {
      try {
        // Screen Orientation API - not fully typed in TypeScript
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.lock === 'function') {
          await orientation.lock('portrait-primary');
        }
      } catch (error) {
        // Silently fail - CSS fallback (LandscapeWarning) will handle this
        // Common reasons: API not supported, not in fullscreen, or browser restrictions
        console.debug('Orientation lock not supported:', error);
      }
    };

    lockOrientation();

    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orientation = screen.orientation as any;
        if (orientation && typeof orientation.unlock === 'function') {
          orientation.unlock();
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [enabled]);
}
