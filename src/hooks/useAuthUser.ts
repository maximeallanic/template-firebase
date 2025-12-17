import { useState, useEffect, useCallback } from 'react';
import { onAuthChange, type User } from '../services/firebase';
import { loadProfile, type UserProfile } from '../services/profileService';

export type { User, UserProfile };

export interface AuthState {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

export function useAuthUser(): AuthState {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const loadedProfile = await loadProfile();
            setProfile(loadedProfile);
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (authUser) => {
            setUser(authUser);

            if (authUser) {
                // Load profile from Firestore (or localStorage fallback)
                try {
                    const loadedProfile = await loadProfile();
                    setProfile(loadedProfile);
                } catch (error) {
                    console.error('Failed to load profile:', error);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, profile, loading, refreshProfile };
}
