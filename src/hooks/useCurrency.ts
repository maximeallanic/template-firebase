/**
 * React hook for currency detection
 * Provides the user's currency based on their location
 */

import { useState, useEffect } from 'react';
import {
  getUserCurrency,
  getCachedUserCurrency,
} from '../services/currencyService';
import { PRICING, DEFAULT_CURRENCY, type PriceConfig } from '../config/pricing';

interface UseCurrencyReturn {
  /** Current price configuration */
  price: PriceConfig;
  /** Whether currency detection is in progress */
  loading: boolean;
  /** Error message if detection failed */
  error: string | null;
}

/**
 * Hook to get the user's currency based on their location
 *
 * @example
 * ```tsx
 * const { price, loading } = useCurrency();
 *
 * return (
 *   <span>
 *     {loading ? '...' : `${price.formatted}/month`}
 *   </span>
 * );
 * ```
 */
export function useCurrency(): UseCurrencyReturn {
  // Start with cached value for immediate display (no flash)
  const [price, setPrice] = useState<PriceConfig>(() => getCachedUserCurrency());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function detectCurrency() {
      try {
        const detected = await getUserCurrency();
        if (isMounted) {
          setPrice(detected);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Currency detection failed');
          setPrice(PRICING[DEFAULT_CURRENCY]);
          setLoading(false);
        }
      }
    }

    detectCurrency();

    return () => {
      isMounted = false;
    };
  }, []);

  return { price, loading, error };
}
