import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface HostSubscriptionState {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionStatus: 'free' | 'active' | 'loading';
}

/**
 * Hook to check if the host has a premium subscription.
 * Listens to Firestore in real-time for subscription status changes.
 *
 * @param hostId - The Firebase UID of the room host
 * @returns Premium status and loading state
 */
export function useHostSubscription(hostId: string | undefined): HostSubscriptionState {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'active' | 'loading'>('loading');

  useEffect(() => {
    if (!hostId) {
      setIsPremium(false);
      setIsLoading(false);
      setSubscriptionStatus('free');
      return;
    }

    setIsLoading(true);
    setSubscriptionStatus('loading');

    // Listen to host's user document in Firestore
    const unsubscribe = onSnapshot(
      doc(db, 'users', hostId),
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
        console.error('[useHostSubscription] Error listening to host subscription:', error);
        // On error, default to free (fail safe)
        setIsPremium(false);
        setSubscriptionStatus('free');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hostId]);

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
