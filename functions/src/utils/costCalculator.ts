/**
 * Cost Calculator for Vertex AI Gemini API
 *
 * Pricing for gemini-2.5-flash (as of January 2025):
 * - Input: $0.075 per 1M tokens (≤128K context)
 * - Output: $0.30 per 1M tokens (≤128K context)
 *
 * For latest pricing, see: https://cloud.google.com/vertex-ai/generative-ai/pricing
 */

const PRICING = {
  'gemini-2.5-flash': {
    inputPer1M: 0.075,   // $0.075 per 1M input tokens
    outputPer1M: 0.30,   // $0.30 per 1M output tokens
  },
} as const;

/**
 * Calculate the estimated cost of a Vertex AI API call
 *
 * @param promptTokens - Number of input tokens
 * @param candidatesTokens - Number of output tokens
 * @param modelName - Model name (default: 'gemini-2.5-flash')
 * @returns Estimated cost in USD
 */
export function calculateCost(
  promptTokens: number,
  candidatesTokens: number,
  modelName: keyof typeof PRICING = 'gemini-2.5-flash'
): number {
  const pricing = PRICING[modelName];

  const inputCost = (promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (candidatesTokens / 1_000_000) * pricing.outputPer1M;

  return inputCost + outputCost;
}

/**
 * Format cost as a readable string
 *
 * @param cost - Cost in USD
 * @returns Formatted cost string (e.g., "$0.0012" or "$0.000045")
 */
export function formatCost(cost: number): string {
  if (cost >= 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost >= 0.001) {
    return `$${cost.toFixed(6)}`;
  } else {
    return `$${cost.toExponential(2)}`;
  }
}

/**
 * Example usage:
 *
 * const usageMetadata = result.response.usageMetadata;
 * const cost = calculateCost(
 *   usageMetadata.promptTokenCount,
 *   usageMetadata.candidatesTokenCount
 * );
 *
 * console.log(`Cost: ${formatCost(cost)}`);
 * // Output: Cost: $0.0012
 */
