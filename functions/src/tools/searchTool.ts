import { z } from 'zod';
import { ai } from '../config/genkit';

/**
 * Google Custom Search API configuration
 *
 * Required environment variables:
 * - GOOGLE_CSE_API_KEY: API key from Google Cloud Console
 * - GOOGLE_CSE_ENGINE_ID: Custom Search Engine ID (cx parameter)
 *
 * Setup instructions:
 * 1. Create a Custom Search Engine at https://programmablesearchengine.google.com/
 * 2. Enable "Search the entire web" in Search features
 * 3. Enable Custom Search API in Google Cloud Console
 * 4. Create an API key and restrict it to Custom Search API
 * 5. Set secrets: firebase functions:secrets:set GOOGLE_CSE_API_KEY
 */

const CSE_API_URL = 'https://www.googleapis.com/customsearch/v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Types
interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

interface GoogleCSEItem {
  title?: string;
  link?: string;
  snippet?: string;
}

interface GoogleCSEResponse {
  items?: GoogleCSEItem[];
  error?: {
    code: number;
    message: string;
    errors?: Array<{ reason: string }>;
  };
}

// In-memory cache to reduce API costs
const searchCache = new Map<string, CacheEntry>();

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate a cache key from query and result count
 */
function getCacheKey(query: string, numResults: number): string {
  return `${query.toLowerCase().trim()}:${numResults}`;
}

/**
 * Check if a cache entry is still valid
 */
function isValidCache(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Execute a Google Custom Search request
 */
async function executeGoogleSearch(
  query: string,
  numResults: number
): Promise<SearchResult[]> {
  // API key priority: GOOGLE_CSE_API_KEY > GOOGLE_API_KEY > GEMINI_API_KEY
  const apiKey = process.env.GOOGLE_CSE_API_KEY
    || process.env.GOOGLE_API_KEY
    || process.env.GEMINI_API_KEY;
  const engineId = process.env.GOOGLE_CSE_ENGINE_ID;

  if (!apiKey) {
    console.error('❌ Missing API key (GOOGLE_CSE_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY)');
    return [];
  }
  if (!engineId) {
    console.error('❌ Missing GOOGLE_CSE_ENGINE_ID');
    return [];
  }

  // Build the URL with query parameters
  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: query,
    num: String(Math.min(numResults, 10)), // Max 10 results per request
  });

  const url = `${CSE_API_URL}?${params}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔍 Google CSE search: "${query}" (attempt ${attempt}/${MAX_RETRIES})`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = (await response.json()) as GoogleCSEResponse;

      // Handle API errors
      if (data.error) {
        const errorCode = data.error.code;
        const errorMessage = data.error.message;
        const errorReason = data.error.errors?.[0]?.reason;

        // Quota exceeded - return empty results gracefully
        if (errorCode === 403 || errorReason === 'dailyLimitExceeded' || errorReason === 'rateLimitExceeded') {
          console.warn(`⚠️ Google CSE quota exceeded: ${errorMessage}`);
          return [];
        }

        // Other API errors
        console.error(`❌ Google CSE API error: ${errorCode} - ${errorMessage}`);

        // Retry on server errors
        if (errorCode >= 500 && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }

        return [];
      }

      // Parse successful response
      const results: SearchResult[] = (data.items || []).map((item: GoogleCSEItem) => ({
        title: item.title || '',
        url: item.link || '',
        description: item.snippet || '',
      }));

      console.log(`✅ Found ${results.length} results for "${query}"`);
      return results;

    } catch (error) {
      const isNetworkError = error instanceof TypeError;

      if (isNetworkError && attempt < MAX_RETRIES) {
        console.log(`⏳ Network error, retrying in ${RETRY_DELAY_MS * attempt}ms...`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      console.error(`❌ Google CSE search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  return [];
}

/**
 * Google Custom Search tool for fact-checking
 *
 * Uses Google Custom Search JSON API with in-memory caching.
 * Gracefully handles quota limits and errors by returning empty results.
 */
export const googleSearch = ai.defineTool(
  {
    name: 'webSearch',
    description:
      'Search the web to verify facts or find information. Use this to fact-check claims, verify dates, names, or other factual details.',
    inputSchema: z.object({
      query: z.string().describe('The search query to look up'),
      numResults: z
        .number()
        .optional()
        .default(3)
        .describe('Number of results to return (1-10)'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          description: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    const numResults = Math.min(Math.max(input.numResults || 3, 1), 10);
    const cacheKey = getCacheKey(input.query, numResults);

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (isValidCache(cached)) {
      console.log(`📦 Cache hit for "${input.query}"`);
      return { results: cached.results };
    }

    // Execute search
    const results = await executeGoogleSearch(input.query, numResults);

    // Cache results (even empty ones to avoid repeated failed requests)
    searchCache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    // Clean old cache entries periodically
    if (searchCache.size > 100) {
      const now = Date.now();
      for (const [key, entry] of searchCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
          searchCache.delete(key);
        }
      }
    }

    return { results };
  }
);

// Export alias for backward compatibility during migration
export { googleSearch as duckDuckGoSearch };
