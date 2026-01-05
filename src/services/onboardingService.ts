/**
 * Onboarding Service
 * Tracks which onboarding screens the user has seen
 * Uses Firestore for authenticated users, localStorage as fallback
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { safeStorage } from '../utils/storage';

// Storage keys for localStorage (cache + fallback for non-auth users)
const STORAGE_KEYS = {
    HOME_INTRO: 'spicy_onboarding_home',
    LOBBY_INTRO: 'spicy_onboarding_lobby',
    PHASE1_INTRO: 'spicy_onboarding_phase1',
    PHASE2_INTRO: 'spicy_onboarding_phase2',
    PHASE3_INTRO: 'spicy_onboarding_phase3',
    PHASE4_INTRO: 'spicy_onboarding_phase4',
} as const;

export type OnboardingKey = keyof typeof STORAGE_KEYS;

export interface OnboardingProgress {
    HOME_INTRO: boolean;
    LOBBY_INTRO: boolean;
    PHASE1_INTRO: boolean;
    PHASE2_INTRO: boolean;
    PHASE3_INTRO: boolean;
    PHASE4_INTRO: boolean;
}

// Default state (nothing seen)
const DEFAULT_PROGRESS: OnboardingProgress = {
    HOME_INTRO: false,
    LOBBY_INTRO: false,
    PHASE1_INTRO: false,
    PHASE2_INTRO: false,
    PHASE3_INTRO: false,
    PHASE4_INTRO: false,
};

/**
 * Load onboarding progress from Firestore with localStorage fallback
 * Priority: Firestore > localStorage
 */
export async function loadOnboardingProgress(): Promise<OnboardingProgress> {
    const user = auth.currentUser;

    // If not authenticated, use localStorage only
    if (!user) {
        return getLocalOnboardingProgress();
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.onboardingProgress) {
                // Found in Firestore - update localStorage cache
                const progress = data.onboardingProgress as OnboardingProgress;
                cacheOnboardingLocally(progress);
                return progress;
            }
        }

        // No Firestore data - check localStorage and migrate if needed
        const localProgress = getLocalOnboardingProgress();
        const hasLocalData = Object.values(localProgress).some(v => v);

        if (hasLocalData) {
            // Migrate localStorage data to Firestore
            await saveOnboardingToFirestore(localProgress);
            return localProgress;
        }

        // No data anywhere - return defaults
        return { ...DEFAULT_PROGRESS };
    } catch (error) {
        console.error('Error loading onboarding from Firestore:', error);
        // Fallback to localStorage on error
        return getLocalOnboardingProgress();
    }
}

/**
 * Mark an onboarding intro as seen
 * Saves to both Firestore (if authenticated) and localStorage
 */
export async function markIntroSeenAsync(key: OnboardingKey): Promise<void> {
    // Always update localStorage first (immediate cache)
    safeStorage.setItem(STORAGE_KEYS[key], 'true');

    const user = auth.currentUser;
    if (!user) {
        return;
    }

    try {
        // Load current progress and update
        const currentProgress = await loadOnboardingProgress();
        const updatedProgress = { ...currentProgress, [key]: true };
        await saveOnboardingToFirestore(updatedProgress);
    } catch (error) {
        console.error('Error saving onboarding to Firestore:', error);
        // Data is still saved locally
    }
}

/**
 * Save onboarding progress to Firestore
 */
async function saveOnboardingToFirestore(progress: OnboardingProgress): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            onboardingProgress: progress,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        // If document doesn't exist, we can't create it here
        // (profile must be created first via profileService)
        console.error('Error saving onboarding to Firestore:', error);
        throw error;
    }
}

/**
 * Get onboarding progress from localStorage only (for quick access)
 */
export function getLocalOnboardingProgress(): OnboardingProgress {
    return {
        HOME_INTRO: safeStorage.getItem(STORAGE_KEYS.HOME_INTRO) === 'true',
        LOBBY_INTRO: safeStorage.getItem(STORAGE_KEYS.LOBBY_INTRO) === 'true',
        PHASE1_INTRO: safeStorage.getItem(STORAGE_KEYS.PHASE1_INTRO) === 'true',
        PHASE2_INTRO: safeStorage.getItem(STORAGE_KEYS.PHASE2_INTRO) === 'true',
        PHASE3_INTRO: safeStorage.getItem(STORAGE_KEYS.PHASE3_INTRO) === 'true',
        PHASE4_INTRO: safeStorage.getItem(STORAGE_KEYS.PHASE4_INTRO) === 'true',
    };
}

/**
 * Cache onboarding progress to localStorage
 */
function cacheOnboardingLocally(progress: OnboardingProgress): void {
    Object.entries(progress).forEach(([key, value]) => {
        const storageKey = STORAGE_KEYS[key as OnboardingKey];
        if (value) {
            safeStorage.setItem(storageKey, 'true');
        } else {
            safeStorage.removeItem(storageKey);
        }
    });
}

/**
 * Check if user has seen a specific intro (sync, from cache)
 */
export function hasSeenIntroLocal(key: OnboardingKey): boolean {
    return safeStorage.getItem(STORAGE_KEYS[key]) === 'true';
}

/**
 * Check if this is a first-time user (sync, from cache)
 */
export function isFirstTimeUserLocal(): boolean {
    return !hasSeenIntroLocal('HOME_INTRO');
}

/**
 * Reset all onboarding states (for testing/debugging)
 */
export async function resetAllOnboarding(): Promise<void> {
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
        safeStorage.removeItem(key);
    });

    // Clear Firestore if authenticated
    const user = auth.currentUser;
    if (user) {
        try {
            await saveOnboardingToFirestore({ ...DEFAULT_PROGRESS });
        } catch (error) {
            console.error('Error resetting onboarding in Firestore:', error);
        }
    }
}

/**
 * Get all onboarding states (for debug panel, sync from cache)
 */
export function getOnboardingStates(): OnboardingProgress {
    return getLocalOnboardingProgress();
}

// ============================================
// Legacy sync functions (for backward compatibility during migration)
// These use localStorage only - prefer async versions
// ============================================

/**
 * @deprecated Use hasSeenIntroLocal or check progress from useOnboarding hook
 */
export function hasSeenIntro(key: OnboardingKey): boolean {
    return hasSeenIntroLocal(key);
}

/**
 * @deprecated Use markIntroSeenAsync
 */
export function markIntroSeen(key: OnboardingKey): void {
    safeStorage.setItem(STORAGE_KEYS[key], 'true');
    // Fire async save but don't wait
    markIntroSeenAsync(key).catch(console.error);
}

/**
 * @deprecated Use isFirstTimeUserLocal or check progress from useOnboarding hook
 */
export function isFirstTimeUser(): boolean {
    return isFirstTimeUserLocal();
}
