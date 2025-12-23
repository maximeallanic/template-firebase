/**
 * Topic generation system for game questions
 * Topic generation with quality control and fallbacks
 */

import { ai, REVIEWER_MODEL, MODEL_CONFIG } from '../../config/genkit';
import {
    GENERATE_TOPIC_PROMPT,
    GENERATE_TOPIC_PHASE2_PROMPT,
    getFullDifficultyContext,
    type DifficultyLevel
} from '../../prompts';

// --- BANNED TOPICS ---

/** List of banned generic topics that we want to avoid */
export const BANNED_TOPICS = [
    'culture générale',
    'quiz général',
    'questions diverses',
    'tout et n\'importe quoi',
    'le monde',
    'général',
    'divers',
    'connaissance',
    'savoir',
    'quiz',
    'questions',
];

/** Fallback topics to use when AI fails to generate something creative */
export const FALLBACK_TOPICS = [
    'Les ratés de l\'histoire',
    'Les animaux qui font peur',
    'Les inventions bizarres',
    'Les dramas de célébrités',
    'Les sports qu\'on ne comprend pas',
    'Les expressions mal utilisées',
    'Les records inutiles',
    'Les superstitions absurdes',
    'Les modes qui ont mal vieilli',
    'Les scandales culinaires',
    'Les chansons incompréhensibles',
    'Les prénoms improbables',
    'Les pires films de tous les temps',
    'Les légendes urbaines',
    'Les trucs qu\'on fait en cachette',
];

/**
 * Check if a topic is too generic/banned
 */
export function isTopicBanned(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return BANNED_TOPICS.some(banned => lowerTopic.includes(banned));
}

/**
 * Get a random fallback topic
 */
export function getRandomFallbackTopic(): string {
    return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
}

/**
 * Generate a creative topic using AI
 * Fast call to get a fun, original theme for the quiz
 * @param phase - The game phase (phase2 uses special prompt for homophones)
 * @param difficulty - The difficulty level (easy, normal, hard, wtf)
 */
export async function generateCreativeTopic(phase?: string, difficulty: string = 'normal'): Promise<string> {
    console.log(`🎲 Generating creative topic with AI (difficulty: ${difficulty})...`);

    // Use specific prompt for Phase 2 (homophones need specific topics)
    const basePrompt = phase === 'phase2' ? GENERATE_TOPIC_PHASE2_PROMPT : GENERATE_TOPIC_PROMPT;
    const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);
    const prompt = basePrompt.replace('{DIFFICULTY}', difficultyContext);

    // Try up to 3 times to get a non-generic topic
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Use REVIEWER_MODEL (gemini-3-flash) for topic generation - more stable for simple text
            const response = await ai.generate({
                model: REVIEWER_MODEL,
                prompt,
                config: {
                    ...MODEL_CONFIG.topic,
                    temperature: 1.2 + (attempt * 0.1), // Increase creativity with each attempt
                },
            });

            const rawTopic = response.text;

            // Debug logging for topic generation issues
            if (!rawTopic) {
                console.warn(`⚠️ Attempt ${attempt}: Empty response from model`);
                console.warn(`⚠️ Full response:`, JSON.stringify(response, null, 2));
            }

            // Clean up the response - remove quotes, extra spaces, etc.
            const topic = rawTopic
                .trim()
                .replace(/^["']|["']$/g, '') // Remove surrounding quotes
                .replace(/\n/g, ' ')
                .slice(0, 60); // Max 60 chars

            // Check if topic is valid (not empty and not banned)
            if (topic && !isTopicBanned(topic)) {
                console.log(`✨ AI generated topic (attempt ${attempt}): "${topic}"`);
                return topic;
            }

            console.warn(`⚠️ Attempt ${attempt}: Topic "${topic}" is too generic or empty, retrying...`);
        } catch (err) {
            console.warn(`⚠️ Attempt ${attempt} failed:`, err);
        }
    }

    // All attempts failed - use a random fallback topic
    const fallbackTopic = getRandomFallbackTopic();
    console.warn(`⚠️ All AI attempts failed. Using fallback topic: "${fallbackTopic}"`);
    return fallbackTopic;
}
