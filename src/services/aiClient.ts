import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface GameGenerationInput {
    phase: 'phase1' | 'phase2' | 'phase5';
    topic?: string;
    difficulty?: 'easy' | 'normal' | 'hard' | 'wtf';
}

export interface GameGenerationOutput {
    success: boolean;
    data: Record<string, unknown> | unknown[];
    usage: {
        totalTokens: number;
        estimatedCost: number;
    };
}

/**
 * Call the AI Cloud Function to generate game questions.
 * Validates phase and topic on the server side.
 */
export const generateGameQuestions = async (input: GameGenerationInput): Promise<GameGenerationOutput> => {
    const generateFn = httpsCallable<GameGenerationInput, GameGenerationOutput>(functions, 'generateGameQuestions');
    try {
        const result = await generateFn(input);
        return result.data;
    } catch (error) {
        console.error("AI Client Error:", error);
        throw error;
    }
};
