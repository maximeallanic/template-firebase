import { useState, useEffect } from 'react';

/**
 * Hook to detect user's motion preference.
 * Returns true if the user prefers reduced motion (accessibility setting).
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * transition={prefersReducedMotion ? { duration: 0 } : springConfig}
 * ```
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(
        () => typeof window !== 'undefined'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        const handler = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return prefersReducedMotion;
}

export default useReducedMotion;
