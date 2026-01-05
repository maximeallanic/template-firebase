/**
 * Currency detection service
 * Detects user's country via IP geolocation and returns appropriate currency
 */

import {
  COUNTRY_TO_CURRENCY,
  DEFAULT_CURRENCY,
  PRICING,
  type SupportedCurrency,
  type PriceConfig,
} from '../config/pricing';

const CURRENCY_STORAGE_KEY = 'spicy_user_currency';
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedCurrency {
  currency: SupportedCurrency;
  country: string;
  detectedAt: number;
}

/**
 * Safe localStorage access (handles SSR and private browsing)
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

/**
 * Get cached currency from localStorage
 */
function getCachedCurrency(): CachedCurrency | null {
  try {
    const cached = safeGetItem(CURRENCY_STORAGE_KEY);
    if (!cached) return null;

    const parsed: CachedCurrency = JSON.parse(cached);
    const isExpired = Date.now() - parsed.detectedAt > CACHE_DURATION_MS;

    return isExpired ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Cache currency to localStorage
 */
function cacheCurrency(currency: SupportedCurrency, country: string): void {
  const data: CachedCurrency = {
    currency,
    country,
    detectedAt: Date.now(),
  };
  safeSetItem(CURRENCY_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Detect user's country via IP geolocation
 * Uses ipinfo.io free tier (50,000 requests/month)
 * Falls back to 'FR' (France) on error
 */
async function detectCountry(): Promise<string> {
  try {
    // ipinfo.io can be called without token for basic info (limited)
    // For production, add token via VITE_IPINFO_TOKEN env var
    const token = import.meta.env.VITE_IPINFO_TOKEN;
    const url = token
      ? `https://ipinfo.io/json?token=${token}`
      : 'https://ipinfo.io/json';

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      // Short timeout to avoid blocking UI
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`IP detection failed: ${response.status}`);
    }

    const data = await response.json();
    return data.country || 'FR';
  } catch (error) {
    console.warn('Country detection failed, using default (FR):', error);
    return 'FR'; // Fallback to France (EUR)
  }
}

/**
 * Get user's currency based on their country
 * Uses cache if available, otherwise detects via IP
 */
export async function getUserCurrency(): Promise<PriceConfig> {
  // Check cache first
  const cached = getCachedCurrency();
  if (cached) {
    return PRICING[cached.currency];
  }

  // Detect country via IP
  const country = await detectCountry();
  const currency = COUNTRY_TO_CURRENCY[country] || DEFAULT_CURRENCY;

  // Cache for future use
  cacheCurrency(currency, country);

  return PRICING[currency];
}

/**
 * Get currency synchronously from cache (for immediate display)
 * Returns default EUR if not cached
 */
export function getCachedUserCurrency(): PriceConfig {
  const cached = getCachedCurrency();
  return cached ? PRICING[cached.currency] : PRICING[DEFAULT_CURRENCY];
}

/**
 * Get cached country code (or null if not cached)
 */
export function getCachedCountry(): string | null {
  const cached = getCachedCurrency();
  return cached ? cached.country : null;
}

/**
 * Clear currency cache (useful for testing or user preference reset)
 */
export function clearCurrencyCache(): void {
  try {
    localStorage.removeItem(CURRENCY_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
