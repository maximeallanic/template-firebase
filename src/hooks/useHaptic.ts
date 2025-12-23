import { useCallback } from 'react';
import { hapticService } from '../services/hapticService';
import { useReducedMotion } from './useReducedMotion';

/**
 * Hook for haptic feedback that respects user's motion preferences.
 * Returns wrapped haptic methods that won't trigger if user prefers reduced motion.
 *
 * Usage:
 * ```tsx
 * const haptic = useHaptic();
 * <button onClick={() => { haptic.tap(); handleClick(); }}>Click</button>
 * ```
 */
export function useHaptic() {
  const prefersReducedMotion = useReducedMotion();

  const tap = useCallback(() => {
    if (!prefersReducedMotion) {
      hapticService.tap();
    }
  }, [prefersReducedMotion]);

  const success = useCallback(() => {
    if (!prefersReducedMotion) {
      hapticService.success();
    }
  }, [prefersReducedMotion]);

  const error = useCallback(() => {
    if (!prefersReducedMotion) {
      hapticService.error();
    }
  }, [prefersReducedMotion]);

  const buzzer = useCallback(() => {
    if (!prefersReducedMotion) {
      hapticService.buzzer();
    }
  }, [prefersReducedMotion]);

  return {
    tap,
    success,
    error,
    buzzer,
  };
}

export default useHaptic;
