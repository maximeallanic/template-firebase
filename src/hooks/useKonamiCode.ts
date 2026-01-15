import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom Konami code sequence: ↑ ↑ ↓ ↓ ← → ← → A D D E U S
 * Only works on Firebase preview URLs (spicy-vs-sweety--pr-XX-XXXX.web.app)
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

// Storage key for persisting debug mode
const DEBUG_MODE_KEY = 'spicy-debug-mode';

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
 * Hook to detect Konami code input and toggle debug mode
 * Only activates on Firebase preview URLs
 */
export function useKonamiCode(): {
    isDebugEnabled: boolean;
    isPreviewEnv: boolean;
    resetDebugMode: () => void;
} {
    const [isDebugEnabled, setIsDebugEnabled] = useState(() => {
        // Check localStorage for persisted state
        if (typeof window !== 'undefined') {
            return localStorage.getItem(DEBUG_MODE_KEY) === 'true';
        }
        return false;
    });

    const isPreviewEnv = typeof window !== 'undefined' && isFirebasePreviewUrl();
    const inputSequenceRef = useRef<string[]>([]);

    const resetDebugMode = useCallback(() => {
        setIsDebugEnabled(false);
        localStorage.removeItem(DEBUG_MODE_KEY);
        inputSequenceRef.current = [];
    }, []);

    useEffect(() => {
        // Only listen for Konami code on preview environments
        if (!isPreviewEnv) return;
        // If already enabled, no need to listen
        if (isDebugEnabled) return;

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
                    setIsDebugEnabled(true);
                    localStorage.setItem(DEBUG_MODE_KEY, 'true');
                    inputSequenceRef.current = [];
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPreviewEnv, isDebugEnabled]);

    return {
        isDebugEnabled,
        isPreviewEnv,
        resetDebugMode,
    };
}
