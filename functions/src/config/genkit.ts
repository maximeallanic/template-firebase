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
 * Configure Google Gen AI client for Vertex AI
 * Uses service account authentication (no API key required)
 */
export const genAI = new GoogleGenAI({
  vertexai: true,  // Use Vertex AI instead of Google AI Developer API
  project: process.env.GCLOUD_PROJECT,  // Set via Firebase project configuration
  location: 'us-central1',
});

/**
 * Model configuration for Gemini 2.5 Flash
 * Optimized for fast, high-quality email analysis
 */
export const MODEL_CONFIG = {
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.3,      // Low temperature for consistent, factual analysis
    maxOutputTokens: 8192, // Allow long analysis responses
  },
  thinkingConfig: {
    thinkingBudget: -1,    // Enable thinking tokens (internal reasoning)
  },
} as const;
