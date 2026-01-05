/**
 * useOnboarding Hook
 * Manages onboarding state with Firebase sync
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthChange } from '../services/firebase';
import {
    loadOnboardingProgress,
    markIntroSeenAsync,
    getLocalOnboardingProgress,
    type OnboardingProgress,
    type OnboardingKey,
} from '../services/onboardingService';

export interface OnboardingState {
    /** Current onboarding progress */
    progress: OnboardingProgress;
    /** Whether onboarding data is still loading */
    loading: boolean;
    /** Check if a specific intro has been seen */
    hasSeenIntro: (key: OnboardingKey) => boolean;
    /** Mark an intro as seen (async, updates Firebase + localStorage) */
    markIntroSeen: (key: OnboardingKey) => Promise<void>;
    /** Check if this is a first-time user */
    isFirstTimeUser: () => boolean;
    /** Refresh onboarding progress from Firebase */
    refreshProgress: () => Promise<void>;
}

export function useOnboarding(): OnboardingState {
    // Start with localStorage data for immediate display (no flash)
    const [progress, setProgress] = useState<OnboardingProgress>(() => getLocalOnboardingProgress());
    const [loading, setLoading] = useState(true);

    const refreshProgress = useCallback(async () => {
        try {
            const loadedProgress = await loadOnboardingProgress();
            setProgress(loadedProgress);
        } catch (error) {
            console.error('Failed to refresh onboarding progress:', error);
        }
    }, []);

    // Load onboarding progress when auth state changes
    useEffect(() => {
        const unsubscribe = onAuthChange(async (authUser) => {
            if (authUser) {
                // User logged in - load from Firestore (with migration if needed)
                try {
                    const loadedProgress = await loadOnboardingProgress();
                    setProgress(loadedProgress);
                } catch (error) {
                    console.error('Failed to load onboarding progress:', error);
                    // Keep localStorage data as fallback
                }
            } else {
                // User logged out - use localStorage only
                setProgress(getLocalOnboardingProgress());
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const hasSeenIntro = useCallback((key: OnboardingKey): boolean => {
        return progress[key];
    }, [progress]);

    const markIntroSeen = useCallback(async (key: OnboardingKey): Promise<void> => {
        // Optimistic update
        setProgress(prev => ({ ...prev, [key]: true }));

        // Save to Firebase + localStorage
        try {
            await markIntroSeenAsync(key);
        } catch (error) {
            console.error('Failed to mark intro as seen:', error);
            // Keep optimistic update - data is still in localStorage
        }
    }, []);

    const isFirstTimeUser = useCallback((): boolean => {
        return !progress.HOME_INTRO;
    }, [progress]);

    return {
        progress,
        loading,
        hasSeenIntro,
        markIntroSeen,
        isFirstTimeUser,
        refreshProgress,
    };
}

export default useOnboarding;
