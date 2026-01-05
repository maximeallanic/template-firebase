import { useMemo } from 'react';
import { useAuthUser } from './useAuthUser';
import { AVATAR_LIST } from '../types/gameTypes';

export interface ProfileCompleteState {
    profileComplete: boolean;
    needsSetup: boolean;
    loading: boolean;
}

/**
 * Hook to check if the authenticated user has a complete profile.
 * Returns needsSetup: true when user is authenticated but profile is incomplete.
 */
export function useProfileComplete(): ProfileCompleteState {
    const { user, profile, loading } = useAuthUser();

    const profileComplete = useMemo(() => {
        if (!profile) return false;
        return !!(
            profile.profileName &&
            profile.profileAvatar &&
            (AVATAR_LIST as string[]).includes(profile.profileAvatar)
        );
    }, [profile]);

    // User is authenticated but profile is incomplete
    const needsSetup = !!user && !loading && !profileComplete;

    return { profileComplete, needsSetup, loading };
}
