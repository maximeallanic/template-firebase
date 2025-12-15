import { useState, useEffect } from 'react';
import { subscribeToAnalysisHistory } from '../services/firebase';
import type { AnalysisRecord } from '../types/analysis';

export function useAnalysisHistory(limitCount: number = 20) {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToAnalysisHistory((data) => {
        setAnalyses(data);
        setIsLoading(false);
      }, limitCount);

      return () => unsubscribe();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      setError(message);
      setIsLoading(false);
    }
  }, [limitCount]);

  return { analyses, isLoading, error };
}
