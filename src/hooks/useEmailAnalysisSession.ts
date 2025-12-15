import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, createEmailAnalysisSession } from '../services/firebase';
import type { EmailAnalysis } from '../types/analysis';

interface EmailSession {
  sessionId: string;
  emailAddress: string;
  displayName: string;
  status: 'waiting' | 'received' | 'analyzing' | 'completed' | 'error';
  analysis?: EmailAnalysis;
  analysisId?: string;
  error?: string;
  expiresAt: number;
  createdAt?: number;
}

interface UseEmailAnalysisSessionResult {
  emailAddress: string | null;
  displayName: string | null;
  status: 'loading' | 'waiting' | 'received' | 'analyzing' | 'completed' | 'error';
  analysis: EmailAnalysis | null;
  analysisId: string | null;
  error: string | null;
  timeRemaining: number;
  retry: () => Promise<void>;
}

/**
 * Hook to manage email analysis session
 * - Creates a new session when enabled
 * - Listens to session updates in real-time
 * - Calculates time remaining until expiration
 */
export function useEmailAnalysisSession(enabled: boolean = true): UseEmailAnalysisSessionResult {
  const [session, setSession] = useState<EmailSession | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const sessionCreatedRef = useRef(false);

  const createSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await createEmailAnalysisSession();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create email session');
      }

      const sessionData: EmailSession = {
        sessionId: result.data.sessionId,
        emailAddress: result.data.emailAddress,
        displayName: result.data.displayName,
        status: 'waiting',
        expiresAt: result.data.expiresAt,
      };

      setSession(sessionData);
      sessionCreatedRef.current = true;
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error creating email session:', err);
      const message = err instanceof Error ? err.message : 'Failed to create email session';
      setError(message);
      setLoading(false);
    }
  };

  // Create session only when enabled and not already created
  useEffect(() => {
    if (enabled && !sessionCreatedRef.current) {
      createSession();
    }
  }, [enabled]);

  // Listen to session updates in real-time
  useEffect(() => {
    if (!session?.sessionId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'emailSessions', session.sessionId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSession((prev) => ({
            ...prev!,
            status: data.status || prev!.status,
            analysis: data.analysis,
            analysisId: data.analysisId,
            error: data.error,
            createdAt: data.createdAt?.toMillis?.(),
          }));
        }
      },
      (err) => {
        console.error('Error listening to session updates:', err);
        setError('Failed to listen to session updates');
      }
    );

    return () => unsubscribe();
  }, [session?.sessionId]);

  // Calculate time remaining
  useEffect(() => {
    if (!session?.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, session.expiresAt - Date.now());
      setTimeRemaining(remaining);

      // If expired, stop interval
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  return {
    emailAddress: session?.emailAddress || null,
    displayName: session?.displayName || null,
    status: loading ? 'loading' : (session?.status || 'waiting'),
    analysis: session?.analysis || null,
    analysisId: session?.analysisId || null,
    error: error || session?.error || null,
    timeRemaining,
    retry: createSession,
  };
}

/**
 * Format time remaining into human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Expired';

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
