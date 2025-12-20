import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export interface HostSubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionStatus: 'free' | 'active' | 'loading';
}

/**
 * Hook to check if the host has a premium subscription.
 * Reads directly from the room data (hostIsPremium field) instead of Firestore.
 * This avoids permission issues for guests who can't read the host's Firestore document.
 *
 * @param hostIsPremium - The hostIsPremium value from the room data
 * @returns Premium status and loading state
 */
export function useHostSubscription(hostIsPremium: boolean | undefined): HostSubscriptionState {
  // Simply derive values from the room's hostIsPremium field
  // No async loading needed since room data is already available via RTDB subscription
  const isPremium = hostIsPremium === true;
  const isLoading = false;
  const subscriptionStatus: 'free' | 'active' | 'loading' = isPremium ? 'active' : 'free';

  return { isPremium, isLoading, subscriptionStatus };
}

/**
 * Hook to check if the CURRENT USER has a premium subscription.
 * Listens to the current user's own Firestore document.
 * Use this for checking the logged-in user's premium status (e.g., on HomePage).
 *
 * @returns Premium status and loading state
 */
export function useCurrentUserSubscription(): HostSubscriptionState {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'active' | 'loading'>('loading');

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      setSubscriptionStatus('free');
      return;
    }

    setIsLoading(true);
    setSubscriptionStatus('loading');

    // Listen to current user's own document in Firestore
    // This is allowed by Firestore rules since users can read their own data
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isActive = data?.subscriptionStatus === 'active';
          setIsPremium(isActive);
          setSubscriptionStatus(isActive ? 'active' : 'free');
        } else {
          // User document doesn't exist yet (new user)
          setIsPremium(false);
          setSubscriptionStatus('free');
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('[useCurrentUserSubscription] Error listening to subscription:', error);
        // On error, default to free (fail safe)
        setIsPremium(false);
        setSubscriptionStatus('free');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { isPremium, isLoading, subscriptionStatus };
}

/**
 * Phases that require a premium subscription
 */
export const PREMIUM_PHASES = ['phase3', 'phase4', 'phase5'] as const;

/**
 * Check if a phase requires premium subscription
 */
export function isPremiumPhase(phase: string): boolean {
  return PREMIUM_PHASES.includes(phase as typeof PREMIUM_PHASES[number]);
}
