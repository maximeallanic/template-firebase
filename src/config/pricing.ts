/**
 * Multi-currency pricing configuration
 * Prices are set to end with .99 in each currency
 */

export type SupportedCurrency = 'eur' | 'usd' | 'gbp' | 'brl';

export interface PriceConfig {
  currency: SupportedCurrency;
  amount: number;           // In cents (199 = 1.99)
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: '.' | ',';
  formatted: string;        // Pre-formatted display string (without period suffix)
}

/**
 * Pricing configuration for each supported currency
 * All prices are equivalent to ~1.99 EUR
 */
export const PRICING: Record<SupportedCurrency, PriceConfig> = {
  eur: {
    currency: 'eur',
    amount: 199,
    symbol: '\u20ac',
    symbolPosition: 'after',
    decimalSeparator: ',',
    formatted: '1,99 \u20ac',
  },
  usd: {
    currency: 'usd',
    amount: 199,
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    formatted: '$1.99',
  },
  gbp: {
    currency: 'gbp',
    amount: 199,
    symbol: '\u00a3',
    symbolPosition: 'before',
    decimalSeparator: '.',
    formatted: '\u00a31.99',
  },
  brl: {
    currency: 'brl',
    amount: 1199,           // ~6x EUR due to exchange rate
    symbol: 'R$',
    symbolPosition: 'before',
    decimalSeparator: ',',
    formatted: 'R$ 11,99',
  },
};

/**
 * Country code (ISO 3166-1 alpha-2) to currency mapping
 */
export const COUNTRY_TO_CURRENCY: Record<string, SupportedCurrency> = {
  // EUR zone - Eurozone countries
  FR: 'eur', // France
  DE: 'eur', // Germany
  ES: 'eur', // Spain
  IT: 'eur', // Italy
  PT: 'eur', // Portugal
  NL: 'eur', // Netherlands
  BE: 'eur', // Belgium
  AT: 'eur', // Austria
  IE: 'eur', // Ireland
  FI: 'eur', // Finland
  GR: 'eur', // Greece
  LU: 'eur', // Luxembourg
  SK: 'eur', // Slovakia
  SI: 'eur', // Slovenia
  EE: 'eur', // Estonia
  LV: 'eur', // Latvia
  LT: 'eur', // Lithuania
  CY: 'eur', // Cyprus
  MT: 'eur', // Malta

  // USD zone - Dollar-based economies
  US: 'usd', // United States
  CA: 'usd', // Canada (also uses CAD but USD is common for digital)
  MX: 'usd', // Mexico (also uses MXN but USD is common for digital)

  // GBP zone - United Kingdom
  GB: 'gbp', // Great Britain
  UK: 'gbp', // UK (alternative code)

  // BRL zone - Brazil
  BR: 'brl', // Brazil
};

/**
 * Default currency when country is not detected or not in mapping
 */
export const DEFAULT_CURRENCY: SupportedCurrency = 'eur';

/**
 * List of all supported currencies for backend validation
 */
export const ALLOWED_CURRENCIES: SupportedCurrency[] = ['eur', 'usd', 'gbp', 'brl'];

/**
 * Get currency for a country code
 */
export function getCurrencyForCountry(countryCode: string): SupportedCurrency {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}

/**
 * Get price config for a currency
 */
export function getPriceConfig(currency: SupportedCurrency): PriceConfig {
  return PRICING[currency] || PRICING[DEFAULT_CURRENCY];
}
