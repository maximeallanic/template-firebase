import { genkit } from 'genkit/beta';
import { googleAI } from '@genkit-ai/googleai';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

/**
 * IMPORTANT: Enable Firebase telemetry FIRST (before genkit(...) initialization)
 * This enables automatic monitoring in Firebase Console with:
 * - Metrics (latency, success rate, token usage)
 * - Traces (detailed execution flow with input/output)
 * - Logs (structured logging to Cloud Logging)
 */
// Only enable telemetry in production (Cloud Logging integration)
const isProduction = process.env.NODE_ENV === 'production' || process.env.K_SERVICE;
if (isProduction) {
  enableFirebaseTelemetry();
}

/**
 * Configure Genkit with Google AI plugin
 * Uses GEMINI_API_KEY environment variable
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

/**
 * Generator model - Gemini 3 Pro Preview
 * Powerful reasoning model for game content generation with tool support
 */
export const GENERATOR_MODEL = googleAI.model('gemini-3-pro-preview');

/**
 * Reviewer model - Gemini 3 Flash Preview
 * Fast model for reviewing/evaluating generated content (no tools needed)
 */
export const REVIEWER_MODEL = googleAI.model('gemini-3-flash-preview');

/**
 * Fact-check model - Gemini 2.0 Flash
 * Used for fact-checking with web search tools
 * Note: gemini-3-pro-preview requires "thought_signature" which Genkit doesn't support yet
 */
export const FACTCHECK_MODEL = googleAI.model('gemini-2.0-flash');

/**
 * Default model - alias to GENERATOR_MODEL for backward compatibility
 */
export const DEFAULT_MODEL = GENERATOR_MODEL;

/**
 * Safety settings configuration
 * Applies to all ai.generate() calls
 * Uses Genkit's expected enum values for safety thresholds
 */
const SAFETY_SETTINGS: Array<{
  category: 'HARM_CATEGORY_HATE_SPEECH' | 'HARM_CATEGORY_DANGEROUS_CONTENT' | 'HARM_CATEGORY_SEXUALLY_EXPLICIT' | 'HARM_CATEGORY_HARASSMENT';
  threshold: 'BLOCK_NONE';
}> = [
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
];

/**
 * Model configuration presets with different temperature settings
 * Note: thinkingConfig removed for compatibility - gemini-3-pro-preview works without it
 */
export const MODEL_CONFIG = {
  // Creative generation (Phase 2, 5) - high temperature
  creative: {
    temperature: 1,
    topP: 0.95,
    maxOutputTokens: 32768,
    safetySettings: SAFETY_SETTINGS,
  },
  // Factual generation (Phase 1, 3, 4) - medium temperature
  factual: {
    temperature: 0.5,
    topP: 0.95,
    maxOutputTokens: 32768,
    safetySettings: SAFETY_SETTINGS,
  },
  // Fact-checking (post-generation verification) - low temperature
  factCheck: {
    temperature: 0.1,
    topP: 0.9,
    maxOutputTokens: 4096,
    safetySettings: SAFETY_SETTINGS,
  },
  // Topic generation (high creativity)
  topic: {
    temperature: 1.2,
    topP: 0.95,
    maxOutputTokens: 512,
    safetySettings: SAFETY_SETTINGS,
  },
};

/**
 * Web search enabled for fact-checking
 * Uses Google Custom Search API with in-memory caching
 *
 * Required environment variables:
 * - GOOGLE_CSE_API_KEY: API key from Google Cloud Console
 * - GOOGLE_CSE_ENGINE_ID: Custom Search Engine ID
 *
 * Set to false to disable fact-checking web searches
 */
export const isSearchAvailable = true;
