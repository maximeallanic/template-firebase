import { genkit } from 'genkit';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { GoogleGenAI } from '@google/genai';

/**
 * IMPORTANT: Enable Firebase telemetry FIRST (before genkit(...) initialization)
 * This enables automatic monitoring in Firebase Console with:
 * - Metrics (latency, success rate, token usage)
 * - Traces (detailed execution flow with input/output)
 * - Logs (structured logging to Cloud Logging)
 */
enableFirebaseTelemetry({
  // Force export in development (optional - useful for local testing)
  forceDevExport: process.env.NODE_ENV === 'development',

  // Privacy controls (optional)
  // disableLoggingInputAndOutput: true,  // Disable logging of input/output for privacy
  // disableMetrics: false,               // Keep metrics enabled
});

/**
 * Configure Genkit
 * Telemetry is automatically exported to Google Cloud Observability via enableFirebaseTelemetry()
 */
export const ai = genkit({
  // No plugins array needed - Firebase telemetry is enabled globally via enableFirebaseTelemetry()
});

/**
 * Configure Google Gen AI client
 * - With GEMINI_API_KEY: Use Gemini API for gemini-3-pro-preview
 * - Without: Fall back to Vertex AI with gemini-2.0-flash
 */
const useGeminiApi = !!process.env.GEMINI_API_KEY;

export const genAI = useGeminiApi
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : new GoogleGenAI({
      vertexai: true,
      project: process.env.GCLOUD_PROJECT || 'spicy-vs-sweety',
      location: 'us-central1',
    });

/**
 * Model configuration
 * - gemini-3-pro-preview: Best reasoning model (requires GEMINI_API_KEY)
 * - gemini-2.0-flash: Fast, capable, with Google Search grounding (Vertex AI)
 */
export const MODEL_CONFIG = {
  model: useGeminiApi ? 'gemini-3-pro-preview' : 'gemini-2.0-flash',
  config: {
    // gemini-3-pro-preview uses ~8K tokens for "thinking" before producing output
    maxOutputTokens: useGeminiApi ? 32768 : 8192,
    temperature: 1,
    topP: 0.95,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
    ],
  },
} as const;

/**
 * Model configuration for factual content (Phase 1, Phase 3, Phase 4)
 * Lower temperature for more accurate, deterministic responses
 */
export const MODEL_CONFIG_FACTUAL = {
  model: useGeminiApi ? 'gemini-3-pro-preview' : 'gemini-2.0-flash',
  config: {
    maxOutputTokens: useGeminiApi ? 32768 : 8192,
    temperature: 0.8, // Lower for more factual accuracy
    topP: 0.95,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
    ],
  },
} as const;
