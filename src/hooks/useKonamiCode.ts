import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom Konami code sequence: ↑ ↑ ↓ ↓ ← → ← → A D D E U S
 * Works on localhost and Firebase preview URLs
 */

const KONAMI_SEQUENCE = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'a',
    'd',
    'd',
    'e',
    'u',
    's',
];

// Storage key for persisting dev mode
const DEV_MODE_KEY = 'spicy-dev-mode';

/**
 * Check if current URL is a Firebase preview deployment
 * Preview URLs look like: spicy-vs-sweety--pr-42-4buksjf1.web.app
 */
export function isFirebasePreviewUrl(): boolean {
    const hostname = window.location.hostname;
    // Match pattern: spicy-vs-sweety--pr-{number}-{id}.web.app
    const previewPattern = /^spicy-vs-sweety--pr-\d+-[a-z0-9]+\.web\.app$/i;
    return previewPattern.test(hostname);
}

/**
 * Check if Konami code should be active (localhost or preview)
 */
export function isKonamiCodeAllowed(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || isFirebasePreviewUrl();
}

/**
 * Hook to detect Konami code input and toggle dev mode
 * Works on localhost and Firebase preview URLs
 */
export function useKonamiCode(): {
    isDevModeEnabled: boolean;
    isPreviewEnv: boolean;
    resetDevMode: () => void;
} {
    const [isDevModeEnabled, setIsDevModeEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(DEV_MODE_KEY) === 'true';
        }
        return false;
    });

    const isPreviewEnv = typeof window !== 'undefined' && isFirebasePreviewUrl();
    const inputSequenceRef = useRef<string[]>([]);

    const resetDevMode = useCallback(() => {
        setIsDevModeEnabled(false);
        localStorage.removeItem(DEV_MODE_KEY);
        inputSequenceRef.current = [];
    }, []);

    useEffect(() => {
        // Only listen on localhost or preview environments
        if (typeof window === 'undefined' || !isKonamiCodeAllowed()) return;
        // If already enabled, no need to listen
        if (isDevModeEnabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

            // Add key to sequence
            inputSequenceRef.current = [...inputSequenceRef.current, key];

            // Keep only the last N keys (where N is the length of the Konami sequence)
            inputSequenceRef.current = inputSequenceRef.current.slice(-KONAMI_SEQUENCE.length);

            // Check if sequence matches
            if (inputSequenceRef.current.length === KONAMI_SEQUENCE.length) {
                const isMatch = inputSequenceRef.current.every(
                    (k, i) => k.toLowerCase() === KONAMI_SEQUENCE[i].toLowerCase()
                );

                if (isMatch) {
                    // Activate dev mode
                    setIsDevModeEnabled(true);
                    localStorage.setItem(DEV_MODE_KEY, 'true');
                    inputSequenceRef.current = [];
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDevModeEnabled]);

    return {
        isDevModeEnabled,
        isPreviewEnv,
        resetDevMode,
    };
}
