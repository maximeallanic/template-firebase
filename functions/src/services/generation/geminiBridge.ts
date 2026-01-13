/**
 * Gemini interaction layer for game question generation
 * Abstraction for different Gemini model calls with different configurations
 */

import { ai, GENERATOR_MODEL, REVIEWER_MODEL, FACTCHECK_MODEL, MODEL_CONFIG, isSearchAvailable } from '../../config/genkit';
import { googleSearch } from '../../tools/searchTool';

/**
 * Call Gemini 3 Pro for GENERATION tasks (with Google Search grounding)
 * Uses native googleSearchRetrieval for web search (avoids thought_signature issues with custom tools)
 * @param prompt - The prompt to send to the model
 * @param configType - 'creative' for high temperature, 'factual' for lower temperature
 */
export async function callGemini(prompt: string, configType: 'creative' | 'factual' = 'creative'): Promise<string> {
    const baseConfig = MODEL_CONFIG[configType];

    console.log(`🔧 Generator: ${GENERATOR_MODEL}, config: ${configType}, grounding: ${isSearchAvailable ? 'googleSearch' : 'none'}`);

    // Use native Google Search grounding instead of custom tool
    // This avoids thought_signature issues with Gemini 3 Pro
    const config = isSearchAvailable
        ? { ...baseConfig, googleSearchRetrieval: true }
        : baseConfig;

    const response = await ai.generate({
        model: GENERATOR_MODEL,
        prompt,
        config,
    });
    return response.text;
}

/**
 * Call Gemini 3 Flash for REVIEW tasks (no tools needed)
 * Fast model optimized for evaluation/scoring
 * Uses LOW temperature for consistent, reliable reviews
 * @param prompt - The prompt to send to the model
 * @param configType - 'review' for low temperature (default), 'creative' for generation-like tasks
 */
export async function callGeminiForReview(prompt: string, configType: 'review' | 'creative' | 'factual' = 'review'): Promise<string> {
    const config = MODEL_CONFIG[configType];

    console.log(`🔧 Reviewer: gemini-3-flash, config: ${configType}, temp: ${config.temperature}`);

    const response = await ai.generate({
        model: REVIEWER_MODEL,
        prompt,
        config,
    });

    return response.text;
}

/**
 * Call Gemini with fact-check config (very low temperature)
 * Uses gemini-2.0-flash with web search for accurate fact verification
 * Note: gemini-3-pro-preview requires "thought_signature" which Genkit doesn't support yet
 */
export async function callGeminiForFactCheck(prompt: string): Promise<string> {
    if (isSearchAvailable) {
        console.log(`🔍 Fact-check: gemini-2.0-flash with web search`);

        // Use ai.chat() for tool-enabled fact-checking
        const chat = ai.chat({
            model: FACTCHECK_MODEL,
            config: MODEL_CONFIG.factCheck,
            tools: [googleSearch],
        });

        const response = await chat.send(prompt);
        return response.text;
    } else {
        console.log(`🔍 Fact-check: gemini-3-flash-preview (no search)`);

        const response = await ai.generate({
            model: REVIEWER_MODEL,
            prompt,
            config: MODEL_CONFIG.factCheck,
        });

        return response.text;
    }
}
