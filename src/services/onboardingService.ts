/**
 * Onboarding Service
 * Tracks which onboarding screens the user has seen using localStorage
 */

import { safeStorage } from '../utils/storage';

// Storage keys for each onboarding screen
const STORAGE_KEYS = {
    HOME_INTRO: 'spicy_onboarding_home',
    LOBBY_INTRO: 'spicy_onboarding_lobby',
    PHASE1_INTRO: 'spicy_onboarding_phase1',
    PHASE2_INTRO: 'spicy_onboarding_phase2',
    PHASE3_INTRO: 'spicy_onboarding_phase3',
    PHASE4_INTRO: 'spicy_onboarding_phase4',
} as const;

export type OnboardingKey = keyof typeof STORAGE_KEYS;

/**
 * Check if the user has seen a specific onboarding intro
 */
export function hasSeenIntro(key: OnboardingKey): boolean {
    const value = safeStorage.getItem(STORAGE_KEYS[key]);
    return value === 'true';
}

/**
 * Mark an onboarding intro as seen
 */
export function markIntroSeen(key: OnboardingKey): void {
    safeStorage.setItem(STORAGE_KEYS[key], 'true');
}

/**
 * Check if this is a first-time user (has never seen any intro)
 */
export function isFirstTimeUser(): boolean {
    return !hasSeenIntro('HOME_INTRO');
}

/**
 * Reset all onboarding states (useful for testing/debugging)
 */
export function resetAllOnboarding(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
        safeStorage.removeItem(key);
    });
}

/**
 * Get all onboarding states (for debug panel)
 */
export function getOnboardingStates(): Record<OnboardingKey, boolean> {
    return {
        HOME_INTRO: hasSeenIntro('HOME_INTRO'),
        LOBBY_INTRO: hasSeenIntro('LOBBY_INTRO'),
        PHASE1_INTRO: hasSeenIntro('PHASE1_INTRO'),
        PHASE2_INTRO: hasSeenIntro('PHASE2_INTRO'),
        PHASE3_INTRO: hasSeenIntro('PHASE3_INTRO'),
        PHASE4_INTRO: hasSeenIntro('PHASE4_INTRO'),
    };
}
