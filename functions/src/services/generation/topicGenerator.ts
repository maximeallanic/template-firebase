/**
 * Topic generation system for game questions
 * Topic generation with quality control and fallbacks
 */

import { ai, REVIEWER_MODEL, MODEL_CONFIG } from '../../config/genkit';
import { getPrompts, type SupportedLanguage } from '../../prompts';
import { type DifficultyLevel, getFullDifficultyContext } from '../../prompts/fr/difficulty';

// --- BANNED TOPICS (by language) ---

/** List of banned generic topics that we want to avoid (by language) */
const BANNED_TOPICS_BY_LANG: Record<SupportedLanguage, string[]> = {
    fr: [
        'culture générale', 'quiz général', 'questions diverses',
        'tout et n\'importe quoi', 'le monde', 'général', 'divers',
        'connaissance', 'savoir', 'quiz', 'questions',
    ],
    en: [
        'general knowledge', 'general quiz', 'miscellaneous questions',
        'everything', 'the world', 'general', 'misc', 'knowledge',
        'quiz', 'questions', 'trivia',
    ],
    es: [
        'cultura general', 'quiz general', 'preguntas diversas',
        'de todo', 'el mundo', 'general', 'varios', 'conocimiento',
        'saber', 'quiz', 'preguntas',
    ],
    de: [
        'allgemeinwissen', 'allgemeines quiz', 'verschiedene fragen',
        'alles mögliche', 'die welt', 'allgemein', 'diverses',
        'wissen', 'quiz', 'fragen',
    ],
    pt: [
        'cultura geral', 'quiz geral', 'perguntas diversas',
        'tudo', 'o mundo', 'geral', 'diversos', 'conhecimento',
        'saber', 'quiz', 'perguntas',
    ],
};

/** Fallback topics by language when AI fails */
const FALLBACK_TOPICS_BY_LANG: Record<SupportedLanguage, string[]> = {
    fr: [
        'Les ratés de l\'histoire', 'Les animaux qui font peur',
        'Les inventions bizarres', 'Les dramas de célébrités',
        'Les records inutiles', 'Les superstitions absurdes',
        'Les scandales culinaires', 'Les légendes urbaines',
    ],
    en: [
        'History\'s biggest fails', 'Terrifying animals',
        'Bizarre inventions', 'Celebrity drama',
        'Useless world records', 'Absurd superstitions',
        'Food scandals', 'Urban legends',
    ],
    es: [
        'Los fracasos de la historia', 'Animales aterradores',
        'Inventos extraños', 'Dramas de celebridades',
        'Records inútiles', 'Supersticiones absurdas',
        'Escándalos culinarios', 'Leyendas urbanas',
    ],
    de: [
        'Historische Fehlschläge', 'Furchterregende Tiere',
        'Bizarre Erfindungen', 'Promi-Dramen',
        'Nutzlose Rekorde', 'Absurder Aberglaube',
        'Lebensmittelskandale', 'Urbane Legenden',
    ],
    pt: [
        'Fracassos da história', 'Animais assustadores',
        'Invenções bizarras', 'Dramas de celebridades',
        'Records inúteis', 'Superstições absurdas',
        'Escândalos culinários', 'Lendas urbanas',
    ],
};

/** Legacy export for backward compatibility */
export const BANNED_TOPICS = BANNED_TOPICS_BY_LANG.fr;
export const FALLBACK_TOPICS = FALLBACK_TOPICS_BY_LANG.fr;

/**
 * Check if a topic is too generic/banned
 */
export function isTopicBanned(topic: string, language: SupportedLanguage = 'fr'): boolean {
    const lowerTopic = topic.toLowerCase();
    const bannedList = BANNED_TOPICS_BY_LANG[language] || BANNED_TOPICS_BY_LANG.en;
    return bannedList.some(banned => lowerTopic.includes(banned));
}

/**
 * Get a random fallback topic
 */
export function getRandomFallbackTopic(language: SupportedLanguage = 'fr'): string {
    const fallbacks = FALLBACK_TOPICS_BY_LANG[language] || FALLBACK_TOPICS_BY_LANG.en;
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Get language name in its own language for prompts
 */
function getLanguageName(language: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
        fr: 'French',
        en: 'English',
        es: 'Spanish',
        de: 'German',
        pt: 'Portuguese',
    };
    return names[language] || 'English';
}

/**
 * Generate a creative topic using AI
 * Fast call to get a fun, original theme for the quiz
 * @param phase - The game phase (phase2 uses special prompt for homophones)
 * @param difficulty - The difficulty level (easy, normal, hard, wtf)
 * @param language - The target language for the topic (fr, en, es, de, pt)
 */
export async function generateCreativeTopic(
    phase?: string,
    difficulty: string = 'normal',
    language: SupportedLanguage = 'fr'
): Promise<string> {
    console.log(`🎲 Generating creative topic with AI (difficulty: ${difficulty}, lang: ${language})...`);

    // Get language-specific prompts
    const prompts = getPrompts(language);

    // Use specific prompt for Phase 2 (homophones need specific topics)
    const basePrompt = phase === 'phase2'
        ? prompts.GENERATE_TOPIC_PHASE2_PROMPT
        : prompts.GENERATE_TOPIC_PROMPT;
    const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);

    // Add explicit language instruction to the prompt
    const languageName = getLanguageName(language);
    const languageInstruction = language !== 'en'
        ? `\n\nIMPORTANT: Generate the topic in ${languageName}. The topic MUST be written in ${languageName}.`
        : '';

    const prompt = basePrompt.replace('{DIFFICULTY}', difficultyContext) + languageInstruction;

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
            if (topic && !isTopicBanned(topic, language)) {
                console.log(`✨ AI generated topic (attempt ${attempt}): "${topic}"`);
                return topic;
            }

            console.warn(`⚠️ Attempt ${attempt}: Topic "${topic}" is too generic or empty, retrying...`);
        } catch (err) {
            console.warn(`⚠️ Attempt ${attempt} failed:`, err);
        }
    }

    // All attempts failed - use a random fallback topic
    const fallbackTopic = getRandomFallbackTopic(language);
    console.warn(`⚠️ All AI attempts failed. Using fallback topic: "${fallbackTopic}"`);
    return fallbackTopic;
}
