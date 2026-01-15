import { useEffect } from 'react';

/**
 * Konami code: ↑ ↑ ↓ ↓ ← → ← →
 * Sets window.__SPICY_DEV_MODE__ to true when activated
 */

const KONAMI_SEQUENCE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
const inputSequence: string[] = [];

// Global flag - simple as that
declare global {
    interface Window {
        __SPICY_DEV_MODE__?: boolean;
    }
}

// Init from localStorage
if (typeof window !== 'undefined') {
    window.__SPICY_DEV_MODE__ = localStorage.getItem('spicy-dev-mode') === 'true';
}

export function useKonamiCode() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (!event.key.startsWith('Arrow')) return;

            inputSequence.push(event.key);
            if (inputSequence.length > KONAMI_SEQUENCE.length) {
                inputSequence.shift();
            }

            console.log('[Konami]', inputSequence.map(k => k.replace('Arrow', '')).join(' '));

            if (inputSequence.length === KONAMI_SEQUENCE.length) {
                const isMatch = inputSequence.every((k, i) => k === KONAMI_SEQUENCE[i]);
                if (isMatch && !window.__SPICY_DEV_MODE__) {
                    console.log('[Konami] ACTIVATED!');
                    window.__SPICY_DEV_MODE__ = true;
                    localStorage.setItem('spicy-dev-mode', 'true');

                    // Force re-render by triggering a state update event
                    window.dispatchEvent(new Event('devmode'));

                    // Visual feedback
                    const el = document.createElement('div');
                    el.innerHTML = '🎮 Dev Mode ON';
                    el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#f59e0b,#ef4444);color:white;font-weight:bold;font-size:24px;padding:20px 40px;border-radius:16px;z-index:99999;';
                    document.body.appendChild(el);
                    setTimeout(() => el.remove(), 1500);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}

export function isDevMode(): boolean {
    return window.__SPICY_DEV_MODE__ === true;
}

export function resetDevMode() {
    window.__SPICY_DEV_MODE__ = false;
    localStorage.removeItem('spicy-dev-mode');
    window.dispatchEvent(new Event('devmode'));
}
