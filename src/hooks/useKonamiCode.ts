import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Konami code sequence: ↑ ↑ ↓ ↓ ← → ← →
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
];

// Storage key for persisting dev mode
const DEV_MODE_KEY = 'spicy-dev-mode';

/**
 * Show a brief visual feedback when dev mode is activated
 */
function showActivationFeedback() {
    const el = document.createElement('div');
    el.textContent = '🎮 Dev Mode ON';
    el.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #f59e0b, #ef4444);
        color: white;
        font-weight: bold;
        font-size: 24px;
        padding: 20px 40px;
        border-radius: 16px;
        z-index: 99999;
        animation: konamiFadeOut 1.5s ease-out forwards;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;

    // Add keyframes if not already present
    if (!document.getElementById('konami-styles')) {
        const style = document.createElement('style');
        style.id = 'konami-styles';
        style.textContent = `
            @keyframes konamiFadeOut {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                70% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
}

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
        // Always listen (for debugging, we want to know if keys are detected)
        console.log('[Konami] Hook mounted, isDevModeEnabled:', isDevModeEnabled, 'isAllowed:', isKonamiCodeAllowed());

        if (typeof window === 'undefined') return;

        // Still listen even if enabled, just won't activate again
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

            // Only track arrow keys
            if (!key.startsWith('Arrow')) return;

            // Add key to sequence
            inputSequenceRef.current = [...inputSequenceRef.current, key];

            // Keep only the last N keys (where N is the length of the Konami sequence)
            inputSequenceRef.current = inputSequenceRef.current.slice(-KONAMI_SEQUENCE.length);

            console.log('[Konami] Sequence:', inputSequenceRef.current.map(k => k.replace('Arrow', '')).join(' '));

            // Check if sequence matches
            if (inputSequenceRef.current.length === KONAMI_SEQUENCE.length) {
                const isMatch = inputSequenceRef.current.every(
                    (k, i) => k.toLowerCase() === KONAMI_SEQUENCE[i].toLowerCase()
                );

                if (isMatch && !isDevModeEnabled) {
                    console.log('[Konami] MATCH! Activating dev mode');
                    // Activate dev mode
                    setIsDevModeEnabled(true);
                    localStorage.setItem(DEV_MODE_KEY, 'true');
                    inputSequenceRef.current = [];
                    showActivationFeedback();
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
