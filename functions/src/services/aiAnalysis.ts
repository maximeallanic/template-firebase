import { z } from 'zod';
import { ai, genAI, MODEL_CONFIG } from '../config/genkit';
import { createAnalysisPrompt } from '../prompts';
import { calculateCost, formatCost } from '../utils/costCalculator';

/**
 * Input schema for email analysis
 */
const AnalysisInputSchema = z.object({
  emailContent: z.string().min(10).max(10000),
  userId: z.string().optional(),
});

/**
 * Output schema for email analysis
 */
const AnalysisOutputSchema = z.object({
  analysis: z.any(), // EmailAnalysis type from ../types/analysis.ts
  usage: z.object({
    promptTokens: z.number(),
    candidatesTokens: z.number(),
    totalTokens: z.number(),
    thinkingTokens: z.number(),
    estimatedCost: z.number(),
  }),
});

/**
 * Genkit Flow for analyzing emails with Gemini
 *
 * This flow is automatically traced and monitored in Firebase Console:
 * - Metrics: Latency, success rate, token usage
 * - Traces: Detailed execution with input/output
 * - Logs: Structured logging to Cloud Logging
 *
 * @param emailContent - The cold email to analyze
 * @param userId - Optional user ID for logging (or 'guest')
 * @returns Analysis result with usage metadata
 */
export const analyzeEmailFlow = ai.defineFlow(
  {
    name: 'analyzeEmail',
    inputSchema: AnalysisInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const { emailContent, userId } = input;

    // Log context for debugging
    console.log(`🔍 Analyzing email for user: ${userId || 'guest'}`);

    // Generate analysis using Gemini 2.5 Flash
    const prompt = createAnalysisPrompt(emailContent);

    const response = await genAI.models.generateContent({
      ...MODEL_CONFIG,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    // Extract text and usage metadata
    const analysisText = response.text || '';
    const usageMetadata = response.usageMetadata;

    // Calculate tokens
    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || 0;

    // Calculate thinking tokens (Gemini 2.5 internal reasoning)
    // Thinking tokens = totalTokens - (promptTokens + candidatesTokens)
    const thinkingTokens = Math.max(0, totalTokens - (promptTokens + candidatesTokens));

    // Calculate cost (thinking tokens billed as output tokens)
    const estimatedCost = calculateCost(promptTokens, candidatesTokens + thinkingTokens);

    console.log(
      `📊 Analysis tokens: ${totalTokens} total ` +
        `(input: ${promptTokens}, output: ${candidatesTokens}, thinking: ${thinkingTokens}) - ${formatCost(
          estimatedCost
        )}`
    );

    // Parse JSON response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', analysisText, parseError);
      throw new Error('Failed to parse analysis response');
    }

    return {
      analysis,
      usage: {
        promptTokens,
        candidatesTokens,
        totalTokens,
        thinkingTokens,
        estimatedCost,
      },
    };
  }
);
