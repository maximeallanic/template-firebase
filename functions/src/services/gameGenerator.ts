import { z } from 'zod';
import { ai, genAI, MODEL_CONFIG } from '../config/genkit';
import {
    GAME_GENERATION_SYSTEM_PROMPT,
    PHASE1_PROMPT,
    PHASE2_PROMPT,
    PHASE5_PROMPT
} from '../prompts';
import { calculateCost, formatCost } from '../utils/costCalculator';

// --- SCHEMAS ---

export const GameGenerationInputSchema = z.object({
    phase: z.enum(['phase1', 'phase2', 'phase5']),
    topic: z.string().optional().default('General Knowledge'),
    difficulty: z.enum(['easy', 'normal', 'hard', 'wtf']).optional().default('normal')
});

export const GameGenerationOutputSchema = z.object({
    data: z.any(), // Flexible output based on phase
    phase: z.string(),
    usage: z.object({
        totalTokens: z.number(),
        thinkingTokens: z.number(),
        estimatedCost: z.number(),
    }),
});

// --- HELPER ---

function getPromptForPhase(phase: string, topic: string, difficulty: string): string {
    let promptTemplate = '';
    switch (phase) {
        case 'phase1': promptTemplate = PHASE1_PROMPT; break;
        case 'phase2': promptTemplate = PHASE2_PROMPT; break;
        case 'phase5': promptTemplate = PHASE5_PROMPT; break;
        default: return '';
    }

    return promptTemplate
        .replace('{TOPIC}', topic)
        .replace('{DIFFICULTY}', difficulty);
}

// --- GENKIT FLOW ---

export const generateGameQuestionsFlow = ai.defineFlow(
    {
        name: 'generateGameQuestions',
        inputSchema: GameGenerationInputSchema,
        outputSchema: GameGenerationOutputSchema,
    },
    async (input) => {
        const { phase, topic, difficulty } = input;

        console.log(`🎲 Generating ${phase} content on topic: "${topic}" (${difficulty})`);

        // Construct complete prompt
        const systemPrompt = GAME_GENERATION_SYSTEM_PROMPT;
        const userPrompt = getPromptForPhase(phase, topic, difficulty);

        if (!userPrompt) {
            throw new Error(`Invalid phase: ${phase}`);
        }

        const fullPrompt = `${systemPrompt}\n\nTasks:\n${userPrompt}`;

        // Call Gemini
        const response = await genAI.models.generateContent({
            ...MODEL_CONFIG,
            contents: [{
                role: 'user',
                parts: [{ text: fullPrompt }]
            }]
        });

        // Parse Response
        const text = response.text || '';
        const usageMetadata = response.usageMetadata;

        let jsonData;
        try {
            // Robust JSON extraction
            const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/); // Match {} or []
            if (!jsonMatch) throw new Error('No JSON found');
            jsonData = JSON.parse(jsonMatch[0]);
        } catch {
            console.error('Failed to parse GenAI response:', text);
            throw new Error('AI Generation failed to produce valid JSON');
        }

        // Calculate Metrics
        const promptTokens = usageMetadata?.promptTokenCount || 0;
        const candidatesTokens = usageMetadata?.candidatesTokenCount || 0;
        const totalTokens = usageMetadata?.totalTokenCount || 0;
        // Thinking tokens approximation (if supported by model/response)
        const thinkingTokens = Math.max(0, totalTokens - (promptTokens + candidatesTokens));
        const estimatedCost = calculateCost(promptTokens, candidatesTokens);

        console.log(`✅ Generated ${phase} content. Cost: ${formatCost(estimatedCost)}`);

        return {
            data: jsonData,
            phase,
            usage: {
                totalTokens,
                thinkingTokens,
                estimatedCost
            }
        };
    }
);
