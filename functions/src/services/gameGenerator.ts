import { z } from 'zod';
import { ai, GENERATOR_MODEL, REVIEWER_MODEL, FACTCHECK_MODEL, MODEL_CONFIG, isSearchAvailable } from '../config/genkit';
import { googleSearch } from '../tools/searchTool';
import {
    // Topic generation
    GENERATE_TOPIC_PROMPT,
    GENERATE_TOPIC_PHASE2_PROMPT,
    // Phase 1 dialogue prompts
    PHASE1_GENERATOR_PROMPT,
    PHASE1_DIALOGUE_REVIEWER_PROMPT,
    PHASE1_TARGETED_REGENERATION_PROMPT,
    // Phase 2 dialogue prompts
    PHASE2_GENERATOR_PROMPT,
    PHASE2_DIALOGUE_REVIEWER_PROMPT,
    PHASE2_TARGETED_REGENERATION_PROMPT,
    // Phase 3 dialogue prompts
    PHASE3_GENERATOR_PROMPT,
    PHASE3_DIALOGUE_REVIEWER_PROMPT,
    PHASE3_TARGETED_REGENERATION_PROMPT,
    // Phase 4 dialogue prompts
    PHASE4_GENERATOR_PROMPT,
    PHASE4_DIALOGUE_REVIEWER_PROMPT,
    PHASE4_TARGETED_REGENERATION_PROMPT,
    // Phase 5 dialogue prompts
    PHASE5_GENERATOR_PROMPT,
    PHASE5_DIALOGUE_REVIEWER_PROMPT,
    PHASE5_TARGETED_REGENERATION_PROMPT,
    // Fact-check prompts
    FACT_CHECK_BATCH_PROMPT,
    FACT_CHECK_NO_SEARCH_PROMPT,
    FACT_CHECK_PHASE2_PROMPT
} from '../prompts';
import { calculateCost, formatCost } from '../utils/costCalculator';
import {
    findSemanticDuplicatesWithEmbeddings,
    findInternalDuplicates,
    storeQuestionsWithEmbeddings,
    type SemanticDuplicate
} from '../utils/embeddingService';

// --- CONSTANTS ---

// Maximum percentage of questions that can be regenerated using targeted regen (60%)
const TARGETED_REGEN_MAX_PERCENTAGE = 0.6;

// --- TYPES ---

interface Phase1Question {
    text: string;
    options: string[];
    correctIndex: number;
    anecdote?: string;
}

interface Phase2Set {
    optionA: string;
    optionB: string;
    optionADescription?: string;  // Description pour différencier les homonymes
    optionBDescription?: string;  // Description pour différencier les homonymes
    items: Array<{
        text: string;
        answer: 'A' | 'B' | 'Both';
        acceptedAnswers?: ('A' | 'B' | 'Both')[];  // Réponses alternatives valides
        justification?: string;
    }>;
}

// --- DIALOGUE REVIEW TYPES ---

interface Phase2GeneratorResponse {
    optionA: string;
    optionB: string;
    optionADescription?: string;  // Description pour différencier les homonymes
    optionBDescription?: string;  // Description pour différencier les homonymes
    reasoning: string;
    items: Array<{
        text: string;
        answer: 'A' | 'B' | 'Both';
        acceptedAnswers?: ('A' | 'B' | 'Both')[];  // Réponses alternatives valides
        justification: string;
    }>;
}

interface Phase2DialogueReview {
    approved: boolean;
    scores: {
        phonetic: number;
        concrete: number;
        distribution: number;
        clarity: number;
        b_concrete: number;
        humor: number;
        celebrities: number;
        both_detection: number;
        trap_quality: number;
    };
    overall_score: number;
    homophone_feedback: string;
    items_feedback: Array<{
        index: number;
        text: string;
        current_answer: string;
        ok: boolean;
        issue: string;
        should_be_both?: boolean;
        both_reasoning?: string;
        is_trap?: boolean;
        is_too_obvious?: boolean;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- PHASE 1 DIALOGUE TYPES ---

interface Phase1GeneratorQuestion {
    text: string;
    options: string[];
    correctIndex: number;
    anecdote: string;
    verification?: string; // Optional - how the fact was verified
}

interface Phase1DialogueReview {
    approved: boolean;
    scores: {
        factual_accuracy: number;
        clarity: number;
        burger_quiz_style: number;
        variety: number;
        anecdotes: number;
        celebrities: number;
    };
    overall_score: number;
    questions_feedback: Array<{
        index: number;
        text: string;
        ok: boolean;
        issue: string;
        issue_type: 'factual_error' | 'ambiguous' | 'boring' | 'too_long' | 'bad_anecdote' | null;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- PHASE 3 DIALOGUE TYPES ---

interface Phase3Menu {
    title: string;
    description: string;
    isTrap?: boolean;
    questions: Array<{ question: string; answer: string }>;
}

interface Phase3DialogueReview {
    approved: boolean;
    scores: {
        title_creativity: number;
        descriptions: number;
        thematic_variety: number;
        question_style: number;
        factual_accuracy: number;
        clarity: number;
        difficulty: number;
        answer_length: number;
        trap_menu?: number;
    };
    overall_score: number;
    menus_feedback: Array<{
        menu_index: number;
        title: string;
        title_ok: boolean;
        title_issue?: string;
        description_ok: boolean;
        description_issue?: string;
        questions_feedback: Array<{
            index: number;
            question: string;
            answer: string;
            ok: boolean;
            issues: string[];
            correction?: string;
        }>;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- PHASE 4 DIALOGUE TYPES (MCQ Culture Générale) ---

interface Phase4Question {
    question: string;
    options: string[];      // 4 options MCQ
    correctIndex: number;   // Index de la bonne réponse (0-3)
    anecdote?: string;      // Fait amusant optionnel
}

interface Phase4DialogueReview {
    approved: boolean;
    scores: {
        factual_accuracy: number;
        option_plausibility: number;
        difficulty_balance: number;
        thematic_variety: number;
        clarity: number;
        anecdote_quality: number;
    };
    overall_score: number;
    difficulty_distribution: {
        easy: number[];
        medium: number[];
        hard: number[];
    };
    questions_feedback: Array<{
        index: number;
        question: string;
        correct_option: string;
        ok: boolean;
        difficulty: 'easy' | 'medium' | 'hard';
        issues: string[];
        correction?: string;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- PHASE 5 DIALOGUE TYPES ---

interface Phase5Question {
    question: string;
    answer: string;
}

interface Phase5DialogueReview {
    approved: boolean;
    scores: {
        memorability: number;
        callbacks: number;
        progression: number;
        factual_accuracy: number;
        answer_length: number;
        burger_style: number;
        thematic_coherence: number;
    };
    overall_score: number;
    callback_count: number;
    identified_callbacks: Array<{
        question_index: number;
        references_question: number;
        description: string;
    }>;
    difficulty_curve: {
        easy_questions: number[];
        medium_questions: number[];
        hard_questions: number[];
        curve_ok: boolean;
    };
    questions_feedback: Array<{
        index: number;
        question: string;
        answer: string;
        ok: boolean;
        memorable: boolean;
        issues: string[];
        correction?: string;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- FACT-CHECK TYPES ---

interface FactCheckResult {
    index: number;
    question: string;
    proposedAnswer: string;
    isCorrect: boolean;
    confidence: number;
    source?: string;
    reasoning: string;
    correction?: string | null;
    ambiguity?: string | null;
    synonymIssue?: string | null; // Detected synonym/equivalent in wrong options
}

interface FactCheckBatchResponse {
    results: FactCheckResult[];
    summary: {
        total: number;
        correct: number;
        incorrect: number;
        ambiguous: number;
        synonymIssues?: number; // Count of questions with synonym issues
    };
}

interface Phase2FactCheckResult {
    isCorrectlyAssigned: boolean;
    confidence: number;
    shouldBe: 'A' | 'B' | 'Both';
    source?: string;
    reasoning: string;
    factualIssue?: string | null;
}

// Minimum confidence threshold for fact-check (85%)
const FACT_CHECK_CONFIDENCE_THRESHOLD = 85;

// --- SCHEMAS ---

export const GameGenerationInputSchema = z.object({
    phase: z.enum(['phase1', 'phase2', 'phase3', 'phase4', 'phase5']),
    topic: z.string().optional().default('General Knowledge'),
    difficulty: z.enum(['easy', 'normal', 'hard', 'wtf']).optional().default('normal')
});

export const GameGenerationOutputSchema = z.object({
    data: z.any(), // Flexible output based on phase
    phase: z.string(),
    topic: z.string(), // The topic used for generation (may be AI-generated)
    embeddings: z.array(z.array(z.number())).optional(), // Embeddings for deduplication
    usage: z.object({
        totalTokens: z.number(),
        thinkingTokens: z.number(),
        estimatedCost: z.number(),
    }),
});

// --- HELPER FUNCTIONS ---

/**
 * Call Gemini 3 Pro for GENERATION tasks (with Google Search grounding)
 * Uses native googleSearchRetrieval for web search (avoids thought_signature issues with custom tools)
 * @param prompt - The prompt to send to the model
 * @param configType - 'creative' for high temperature, 'factual' for lower temperature
 */
async function callGemini(prompt: string, configType: 'creative' | 'factual' = 'creative'): Promise<string> {
    const baseConfig = MODEL_CONFIG[configType];

    console.log(`🔧 Generator: gemini-3-pro-preview, config: ${configType}, grounding: ${isSearchAvailable ? 'googleSearch' : 'none'}`);

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
 * @param prompt - The prompt to send to the model
 * @param configType - 'creative' for high temperature, 'factual' for lower temperature
 */
async function callGeminiForReview(prompt: string, configType: 'creative' | 'factual' = 'creative'): Promise<string> {
    const config = MODEL_CONFIG[configType];

    console.log(`🔧 Reviewer: gemini-3-flash, config: ${configType}`);

    const response = await ai.generate({
        model: REVIEWER_MODEL,
        prompt,
        config,
    });

    return response.text;
}

/**
 * Helper to find a balanced JSON structure (handles nested objects/arrays)
 * @param preferArray - If true, searches for '[' before '{' to prioritize array extraction
 */
function findBalancedJson(text: string, preferArray: boolean = false): string | null {
    const startChars = preferArray ? ['[', '{'] : ['{', '['];
    const endChars = ['}', ']'];

    for (const startChar of startChars) {
        const startIdx = text.indexOf(startChar);
        if (startIdx === -1) continue;

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let i = startIdx; i < text.length; i++) {
            const char = text[i];

            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === '"') { inString = !inString; continue; }
            if (inString) continue;

            if (startChars.includes(char)) depth++;
            if (endChars.includes(char)) depth--;

            if (depth === 0) {
                return text.slice(startIdx, i + 1);
            }
        }
    }
    return null;
}

/**
 * Parse JSON from text, handling markdown artifacts and nested structures
 */
function parseJsonFromText(text: string): unknown {
    // Clean markdown artifacts
    const cleanText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Try direct parse first (fastest path)
    try {
        return JSON.parse(cleanText);
    } catch {
        // Continue to balanced extraction
    }

    // Find balanced JSON structure
    const jsonMatch = findBalancedJson(cleanText);
    if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch);
}

/**
 * Parse JSON array from text, prioritizing array extraction over objects.
 * Handles cases where AI returns preamble text before JSON.
 * If a single object is found, wraps it in an array.
 */
function parseJsonArrayFromText<T>(text: string): T[] {
    // Clean markdown artifacts
    const cleanText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Try direct parse first (fastest path)
    try {
        const result = JSON.parse(cleanText);
        return Array.isArray(result) ? result : [result];
    } catch {
        // Continue to balanced extraction
    }

    // Find balanced JSON structure, prioritizing arrays
    const jsonMatch = findBalancedJson(cleanText, true);
    if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
    }

    const result = JSON.parse(jsonMatch);
    return Array.isArray(result) ? result : [result];
}

/**
 * Shuffle MCQ options to prevent AI positional bias
 * Returns a new question with shuffled options and updated correctIndex
 */
function shuffleMCQOptions(question: Phase4Question): Phase4Question {
    const correctAnswer = question.options[question.correctIndex];

    // Fisher-Yates shuffle
    const shuffled = [...question.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Find new index of correct answer
    const newCorrectIndex = shuffled.indexOf(correctAnswer);

    return {
        ...question,
        options: shuffled,
        correctIndex: newCorrectIndex
    };
}

// --- FACT-CHECK FUNCTIONS ---

/**
 * Call Gemini with fact-check config (very low temperature)
 * Uses gemini-2.0-flash with web search for accurate fact verification
 * Note: gemini-3-pro-preview requires "thought_signature" which Genkit doesn't support yet
 */
async function callGeminiForFactCheck(prompt: string): Promise<string> {
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

/**
 * Verify factual accuracy of Phase 1 questions in batch
 * Returns questions that passed fact-check with high confidence
 * Also checks for synonyms/equivalents in wrong options
 * Includes retry logic with exponential backoff
 */
async function factCheckPhase1Questions(
    questions: Phase1Question[],
    maxRetries: number = 3
): Promise<{ passed: Phase1Question[]; failed: { question: Phase1Question; reason: string }[] }> {
    console.log(`🔍 Fact-checking ${questions.length} Phase 1 questions...`);

    // Format questions for batch verification - include ALL options for synonym detection
    const questionsForCheck = questions.map((q, idx) => ({
        index: idx,
        question: q.text,
        proposedAnswer: q.options[q.correctIndex],
        allOptions: q.options, // Send all options so fact-checker can detect synonyms
        correctIndex: q.correctIndex
    }));

    // Use appropriate prompt based on search availability
    const basePrompt = isSearchAvailable ? FACT_CHECK_BATCH_PROMPT : FACT_CHECK_NO_SEARCH_PROMPT;
    const prompt = basePrompt.replace(
        '{QUESTIONS_JSON}',
        JSON.stringify(questionsForCheck, null, 2)
    );

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const responseText = await callGeminiForFactCheck(prompt);
            const response = parseJsonFromText(responseText) as FactCheckBatchResponse;

            const synonymCount = response.summary.synonymIssues || 0;
            console.log(`📊 Fact-check summary: ${response.summary.correct}/${response.summary.total} correct, ${response.summary.incorrect} incorrect, ${response.summary.ambiguous} ambiguous, ${synonymCount} synonymes`);

            const passed: Phase1Question[] = [];
            const failed: { question: Phase1Question; reason: string }[] = [];

            for (const result of response.results) {
                const question = questions[result.index];

                // Check for synonym issues (even if answer is correct)
                if (result.synonymIssue) {
                    const reason = `Synonyme détecté: ${result.synonymIssue}`;
                    failed.push({ question, reason });
                    console.log(`  ⚠️ Q${result.index + 1}: "${question.text.slice(0, 40)}..." - ${reason}`);
                    continue;
                }

                if (result.isCorrect && result.confidence >= FACT_CHECK_CONFIDENCE_THRESHOLD) {
                    passed.push(question);
                    console.log(`  ✅ Q${result.index + 1}: "${question.text.slice(0, 40)}..." (${result.confidence}%)`);
                } else {
                    const reason = result.isCorrect
                        ? `Confiance trop basse (${result.confidence}%): ${result.reasoning}`
                        : `Erreur factuelle: ${result.reasoning}${result.correction ? ` (correction: ${result.correction})` : ''}`;
                    failed.push({ question, reason });
                    console.log(`  ❌ Q${result.index + 1}: "${question.text.slice(0, 40)}..." - ${reason}`);
                }
            }

            return { passed, failed };
        } catch (err) {
            console.warn(`⚠️ Fact-check attempt ${attempt}/${maxRetries} failed:`, err);

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`   Retrying in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            // All retries exhausted - REJECT all questions to be safe
            console.error('❌ All fact-check retries failed, rejecting entire batch');
            return {
                passed: [],
                failed: questions.map(q => ({
                    question: q,
                    reason: 'Fact-check unavailable after retries'
                }))
            };
        }
    }

    // Unreachable, but TypeScript needs this
    return { passed: [], failed: [] };
}

/**
 * Verify factual accuracy of Phase 2 items
 * Checks if items are correctly categorized
 */
async function factCheckPhase2Items(
    set: Phase2Set
): Promise<{ passed: typeof set.items; failed: { item: typeof set.items[0]; reason: string }[] }> {
    console.log(`🔍 Fact-checking ${set.items.length} Phase 2 items...`);

    const passed: typeof set.items = [];
    const failed: { item: typeof set.items[0]; reason: string }[] = [];

    // Check all items in parallel (no batching needed, Gemini handles it)
    const batchSize = 12;
    for (let i = 0; i < set.items.length; i += batchSize) {
        const batch = set.items.slice(i, i + batchSize);

        const checks = batch.map(async (item) => {
            const prompt = FACT_CHECK_PHASE2_PROMPT
                .replace('{OPTION_A}', set.optionA)
                .replace('{OPTION_B}', set.optionB)
                .replace('{ITEM_TEXT}', item.text)
                .replace('{ASSIGNED_CATEGORY}', item.answer)
                .replace('{JUSTIFICATION}', item.justification || 'Non fournie');

            try {
                const responseText = await callGeminiForFactCheck(prompt);
                const result = parseJsonFromText(responseText) as Phase2FactCheckResult;

                if (result.isCorrectlyAssigned && result.confidence >= FACT_CHECK_CONFIDENCE_THRESHOLD) {
                    return { item, passed: true, reason: '' };
                } else {
                    const reason = !result.isCorrectlyAssigned
                        ? `Mauvaise catégorie: devrait être ${result.shouldBe} - ${result.reasoning}`
                        : `Confiance trop basse (${result.confidence}%): ${result.reasoning}`;
                    return { item, passed: false, reason };
                }
            } catch (err) {
                console.error(`❌ Fact-check failed for item "${item.text}":`, err);
                // Conservative approach: reject if we can't verify
                // This prevents potentially incorrect items from passing
                return { item, passed: false, reason: 'Vérification impossible - item rejeté par précaution' };
            }
        });

        const results = await Promise.all(checks);

        for (const result of results) {
            if (result.passed) {
                passed.push(result.item);
                console.log(`  ✅ "${result.item.text}" → ${result.item.answer}`);
            } else {
                failed.push({ item: result.item, reason: result.reason });
                console.log(`  ❌ "${result.item.text}" → ${result.item.answer} - ${result.reason}`);
            }
        }
    }

    console.log(`📊 Phase 2 fact-check: ${passed.length}/${set.items.length} passed`);
    return { passed, failed };
}

/**
 * Verify factual accuracy of Phase 3/4/5 questions (simple Q&A format)
 * These phases don't have the Generator/Reviewer system, so this is their main verification
 */
async function factCheckSimpleQuestions(
    questions: Array<{ question: string; answer: string }>
): Promise<{ passed: typeof questions; failed: { question: typeof questions[0]; reason: string }[] }> {
    console.log(`🔍 Fact-checking ${questions.length} simple Q&A questions...`);

    // Format for batch verification
    const questionsForCheck = questions.map((q, idx) => ({
        index: idx,
        question: q.question,
        proposedAnswer: q.answer
    }));

    // Use appropriate prompt based on search availability
    const basePrompt = isSearchAvailable ? FACT_CHECK_BATCH_PROMPT : FACT_CHECK_NO_SEARCH_PROMPT;
    const prompt = basePrompt.replace(
        '{QUESTIONS_JSON}',
        JSON.stringify(questionsForCheck, null, 2)
    );

    try {
        const responseText = await callGeminiForFactCheck(prompt);
        const response = parseJsonFromText(responseText) as FactCheckBatchResponse;

        console.log(`📊 Fact-check summary: ${response.summary.correct}/${response.summary.total} correct`);

        const passed: typeof questions = [];
        const failed: { question: typeof questions[0]; reason: string }[] = [];

        for (const result of response.results) {
            const question = questions[result.index];

            if (result.isCorrect && result.confidence >= FACT_CHECK_CONFIDENCE_THRESHOLD) {
                passed.push(question);
            } else {
                const reason = result.isCorrect
                    ? `Confiance trop basse (${result.confidence}%)`
                    : `Erreur: ${result.reasoning}`;
                failed.push({ question, reason });
                console.log(`  ❌ "${question.question.slice(0, 40)}..." - ${reason}`);
            }
        }

        return { passed, failed };
    } catch (err) {
        console.error('❌ Fact-check failed:', err);
        return { passed: questions, failed: [] };
    }
}

// List of banned generic topics that we want to avoid
const BANNED_TOPICS = [
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

// Fallback topics to use when AI fails to generate something creative
const FALLBACK_TOPICS = [
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
function isTopicBanned(topic: string): boolean {
    const lowerTopic = topic.toLowerCase();
    return BANNED_TOPICS.some(banned => lowerTopic.includes(banned));
}

/**
 * Get a random fallback topic
 */
function getRandomFallbackTopic(): string {
    return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
}

/**
 * Generate a creative topic using AI
 * Fast call to get a fun, original theme for the quiz
 * @param phase - The game phase (phase2 uses special prompt for homophones)
 */
async function generateCreativeTopic(phase?: string): Promise<string> {
    console.log('🎲 Generating creative topic with AI...');

    // Use specific prompt for Phase 2 (homophones need specific topics)
    const prompt = phase === 'phase2' ? GENERATE_TOPIC_PHASE2_PROMPT : GENERATE_TOPIC_PROMPT;

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

/**
 * Generate Phase 2 set using dialogue between Generator and Reviewer agents
 * The two agents iterate until the set passes quality criteria
 */
async function generatePhase2WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 3
): Promise<{ set: Phase2Set; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 2...');

    let previousFeedback = '';
    let lastSet: Phase2Set | null = null;

    // Track the BEST set seen so far (for fallback when max iterations reached)
    let bestSet: Phase2Set | null = null;
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes a complete set
        const generatorPrompt = PHASE2_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating set...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase2GeneratorResponse;

        try {
            proposal = parseJsonFromText(proposalText) as Phase2GeneratorResponse;
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue; // Skip to next iteration
        }

        console.log(`🎯 Proposition: "${proposal.optionA}" vs "${proposal.optionB}"`);
        console.log(`   Reasoning: ${proposal.reasoning}`);

        // Store last set (in case we reach max iterations) - preserve all fields
        lastSet = {
            optionA: proposal.optionA,
            optionB: proposal.optionB,
            optionADescription: proposal.optionADescription,
            optionBDescription: proposal.optionBDescription,
            items: proposal.items.map(item => ({
                text: item.text,
                answer: item.answer,
                acceptedAnswers: item.acceptedAnswers,
                justification: item.justification
            }))
        };

        // 2. Reviewer evaluates the complete set
        const reviewerPrompt = PHASE2_DIALOGUE_REVIEWER_PROMPT
            .replace('{SET}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating set...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'creative');
        let review: Phase2DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase2DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue; // Skip to next iteration
        }

        // Log scores
        const trapScore = (review.scores as { trap_quality?: number }).trap_quality ?? 'N/A';
        console.log(`📊 Scores: phonetic=${review.scores.phonetic}, concrete=${review.scores.concrete}, distribution=${review.scores.distribution}`);
        console.log(`          clarity=${review.scores.clarity}, b_concrete=${review.scores.b_concrete ?? 'N/A'}, humor=${review.scores.humor}`);
        console.log(`          celebrities=${review.scores.celebrities}, trap_quality=${trapScore}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check if score is sufficient
        // CRITICAL: Phonetic score must be >= 6, otherwise homophone is too weak
        if (review.scores.phonetic < 6) {
            console.log(`❌ Phonetic score too low (${review.scores.phonetic}/10). Must change homophone entirely.`);
            previousFeedback = `
⚠️ HOMOPHONE REJETÉ (score phonétique: ${review.scores.phonetic}/10)

Ton homophone précédent NE FONCTIONNE PAS :
- "${proposal.optionA}" vs "${proposal.optionB}"
- Raison: ${review.homophone_feedback}

Les deux phrases ne SE PRONONCENT PAS PAREIL. Tu dois changer COMPLÈTEMENT de jeu de mots.
Rappel: Un bon homophone = les deux phrases sonnent EXACTEMENT pareil à l'oral.
`;
            continue;
        }

        // Track the BEST set seen so far (only if phonetic is acceptable)
        // This ensures we use the best valid set if we hit max iterations
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestSet = lastSet;
            console.log(`📈 New best set! Score: ${bestScore}/10`);
        }

        // CRITICAL: Category B must be concrete (b_concrete >= 6)
        const bConcreteScore = review.scores.b_concrete ?? 5;
        if (bConcreteScore < 6) {
            console.log(`❌ Category B not concrete enough (${bConcreteScore}/10). Must change homophone.`);
            previousFeedback = `
⚠️ CATÉGORIE B TROP ABSTRAITE (score b_concrete: ${bConcreteScore}/10)

Ton calembour précédent : "${proposal.optionB}"
Problème: La catégorie B ne représente rien de CONCRET.

Pour que ça marche, il faut que B soit une VRAIE CHOSE avec des exemples ÉVIDENTS.
Exemples de B concrets:
- "Chère de Pouille" = région des Pouilles → Bari, Orecchiette, Trulli
- "Le teint est bon" = peau/complexion → bronzage, fond de teint
- "Verre vert" = objet coloré → bouteille, vase, vitre

Tu dois changer COMPLÈTEMENT de jeu de mots pour avoir un B CONCRET.
`;
            continue;
        }

        // Check trap quality - items should create doubt, not be too obvious
        // Threshold of 6 means we need at least a few real traps, not just obvious items
        const trapQualityScore = (review.scores as { trap_quality?: number }).trap_quality ?? 5;
        if (trapQualityScore < 6) {
            console.log(`❌ Trap quality too low (${trapQualityScore}/10). Items are too obvious!`);

            // Find obvious items from feedback
            const obviousItemsFeedback = (review.items_feedback as Array<{ index: number; text: string; is_too_obvious?: boolean; ok: boolean }>)
                .filter(item => item.is_too_obvious || !item.ok);
            const obviousIndices = obviousItemsFeedback.map(item => item.index);

            // If homophone is valid AND we have <= 60% obvious items → targeted regen
            const homophoneValid = review.scores.phonetic >= 6 && bConcreteScore >= 6;
            if (homophoneValid && shouldUseTargetedRegen(obviousIndices.length, proposal.items.length)) {
                console.log(`🔧 Trap quality targeted regen: homophone valid, replacing ${obviousIndices.length} obvious items`);

                const goodItems = proposal.items.filter((_, idx) => !obviousIndices.includes(idx));
                const badItems = proposal.items.filter((_, idx) => obviousIndices.includes(idx));

                // Calculate distribution needed for replacement items
                const currentGoodA = goodItems.filter(item => item.answer === 'A').length;
                const currentGoodB = goodItems.filter(item => item.answer === 'B').length;
                const currentGoodBoth = goodItems.filter(item => item.answer === 'Both').length;
                const neededA = Math.max(0, 5 - currentGoodA);
                const neededB = Math.max(0, 5 - currentGoodB);
                const neededBoth = Math.max(0, 2 - currentGoodBoth);

                const goodItemsText = goodItems.map((item, idx) =>
                    `${idx + 1}. "${item.text}" → ${item.answer}`
                ).join('\n');
                const badItemsText = badItems.map((item, idx) =>
                    `${idx + 1}. "${item.text}" → ${item.answer} (TROP ÉVIDENT)`
                ).join('\n');
                const rejectionReasons = obviousItemsFeedback
                    .map(item => `- "${item.text}": trop évident/prévisible`)
                    .join('\n');

                const targetedPrompt = PHASE2_TARGETED_REGENERATION_PROMPT
                    .replace('{OPTION_A}', proposal.optionA)
                    .replace('{OPTION_B}', proposal.optionB)
                    .replace('{GOOD_ITEMS}', goodItemsText)
                    .replace('{BAD_INDICES}', obviousIndices.map(i => i + 1).join(', '))
                    .replace('{BAD_ITEMS}', badItemsText)
                    .replace('{REJECTION_REASONS}', rejectionReasons)
                    .replace(/{COUNT}/g, String(obviousIndices.length))
                    .replace('{NEEDED_A}', String(neededA))
                    .replace('{NEEDED_B}', String(neededB))
                    .replace('{NEEDED_BOTH}', String(neededBoth));

                try {
                    const regenText = await callGemini(targetedPrompt, 'creative');
                    const newItems = parseJsonFromText(regenText) as Array<{
                        text: string;
                        answer: 'A' | 'B' | 'Both';
                        acceptedAnswers?: ('A' | 'B' | 'Both')[];
                        justification: string;
                    }>;

                    const mergedItems = [
                        ...goodItems.map(item => ({
                            text: item.text,
                            answer: item.answer,
                            acceptedAnswers: item.acceptedAnswers,
                            justification: item.justification
                        })),
                        ...newItems
                    ];

                    lastSet = {
                        optionA: proposal.optionA,
                        optionB: proposal.optionB,
                        optionADescription: proposal.optionADescription,
                        optionBDescription: proposal.optionBDescription,
                        items: mergedItems.slice(0, 12)
                    };

                    console.log(`✅ Trap quality targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE (pièges trop évidents)

Homophone conservé : "${proposal.optionA}" vs "${proposal.optionB}"
${obviousIndices.length} items évidents remplacés par des pièges.
Le reviewer va maintenant re-valider.
`;
                    continue;
                } catch (err) {
                    console.warn('⚠️ Trap quality targeted regen failed:', err);
                }
            }

            // Full regen fallback
            const obviousItemsText = obviousItemsFeedback
                .map(item => `- "${item.text}"`)
                .join('\n');

            previousFeedback = `
⚠️ ITEMS TROP ÉVIDENTS (score pièges: ${trapQualityScore}/10)

Le set est ENNUYEUX car les réponses sont trop prévisibles.

Items trop évidents à remplacer :
${obviousItemsText || '(la plupart des items)'}

🎯 RAPPEL - Un bon piège :
- L'item SEMBLE appartenir à une catégorie mais appartient à l'AUTRE
- Le joueur doit HÉSITER avant de répondre
- La réponse est SURPRENANTE mais vérifiable

❌ À ÉVITER :
- Items où la réponse est immédiatement évidente
- Items qui ne créent aucun doute

Tu dois REMPLACER au moins 4-5 items par des PIÈGES contre-intuitifs.
`;
            continue;
        }

        // Check overall score (>= 7 is considered acceptable - increased from 6)
        if (review.overall_score >= 7) {
            console.log(`✅ Set validated by reviewer after ${i + 1} iteration(s)! (score: ${review.overall_score}/10, approved: ${review.approved})`);

            // === FACT-CHECK STEP ===
            // Run dedicated fact-checking on Phase 2 items
            if (!lastSet) {
                throw new Error('lastSet is null after successful review');
            }
            // Create local const for TypeScript narrowing inside callbacks
            const validSet = lastSet;
            const factCheckResult = await factCheckPhase2Items(validSet);

            if (factCheckResult.failed.length > 0) {
                console.log(`⚠️ Fact-check rejected ${factCheckResult.failed.length}/${validSet.items.length} items`);

                // Try targeted regen for failed fact-checks (up to 60%)
                if (shouldUseTargetedRegen(factCheckResult.failed.length, validSet.items.length)) {
                    const failedIndices = factCheckResult.failed.map(f =>
                        validSet.items.findIndex(item => item.text === f.item.text)
                    ).filter(idx => idx !== -1);

                    if (failedIndices.length > 0) {
                        console.log(`🔧 Phase 2 fact-check targeted regen: replacing ${failedIndices.length} items`);

                        const goodItems = validSet.items.filter((_, idx) => !failedIndices.includes(idx));
                        const badItems = validSet.items.filter((_, idx) => failedIndices.includes(idx));

                        // Calculate distribution needed
                        const currentGoodA = goodItems.filter(item => item.answer === 'A').length;
                        const currentGoodB = goodItems.filter(item => item.answer === 'B').length;
                        const currentGoodBoth = goodItems.filter(item => item.answer === 'Both').length;
                        const neededA = Math.max(0, 5 - currentGoodA);
                        const neededB = Math.max(0, 5 - currentGoodB);
                        const neededBoth = Math.max(0, 2 - currentGoodBoth);

                        const goodItemsText = goodItems.map((item, idx) =>
                            `${idx + 1}. "${item.text}" → ${item.answer}`
                        ).join('\n');
                        const badItemsText = badItems.map((item, idx) =>
                            `${idx + 1}. "${item.text}" → ${item.answer} (FACT-CHECK ÉCHOUÉ)`
                        ).join('\n');
                        const rejectionReasons = factCheckResult.failed
                            .map(f => `- "${f.item.text}": ${f.reason}`)
                            .join('\n');

                        const targetedPrompt = PHASE2_TARGETED_REGENERATION_PROMPT
                            .replace('{OPTION_A}', validSet.optionA)
                            .replace('{OPTION_B}', validSet.optionB)
                            .replace('{GOOD_ITEMS}', goodItemsText)
                            .replace('{BAD_INDICES}', failedIndices.map(i => i + 1).join(', '))
                            .replace('{BAD_ITEMS}', badItemsText)
                            .replace('{REJECTION_REASONS}', rejectionReasons)
                            .replace(/{COUNT}/g, String(failedIndices.length))
                            .replace('{NEEDED_A}', String(neededA))
                            .replace('{NEEDED_B}', String(neededB))
                            .replace('{NEEDED_BOTH}', String(neededBoth));

                        try {
                            const regenText = await callGemini(targetedPrompt, 'creative');
                            const newItems = parseJsonFromText(regenText) as Array<{
                                text: string;
                                answer: 'A' | 'B' | 'Both';
                                acceptedAnswers?: ('A' | 'B' | 'Both')[];
                                justification: string;
                            }>;

                            const mergedItems = [
                                ...goodItems.map(item => ({
                                    text: item.text,
                                    answer: item.answer,
                                    acceptedAnswers: item.acceptedAnswers,
                                    justification: item.justification
                                })),
                                ...newItems
                            ];

                            lastSet = {
                                ...validSet,
                                items: mergedItems.slice(0, 12)
                            };

                            console.log(`✅ Phase 2 fact-check targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);
                            previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE (fact-check)

Homophone conservé : "${lastSet.optionA}" vs "${lastSet.optionB}"
${failedIndices.length} items incorrects remplacés.
Le reviewer va maintenant re-valider.
`;
                            continue;
                        } catch (err) {
                            console.warn('⚠️ Phase 2 fact-check targeted regen failed:', err);
                        }
                    }
                }

                // Full regen if too many failures or targeted regen failed
                if (factCheckResult.failed.length > Math.floor(lastSet.items.length * TARGETED_REGEN_MAX_PERCENTAGE)) {
                    const failedFeedback = factCheckResult.failed
                        .map(f => `- "${f.item.text}" (${f.item.answer}): ${f.reason}`)
                        .join('\n');

                    previousFeedback = `
⚠️ VÉRIFICATION FACTUELLE ÉCHOUÉE

Le fact-checker externe a détecté des erreurs dans ces items :
${failedFeedback}

CRITIQUE : Les items doivent être CORRECTEMENT CATÉGORISÉS.
Vérifie que chaque item appartient VRAIMENT à la catégorie assignée (A, B, ou Both).
`;
                    continue; // Regenerate with feedback
                }

                // Otherwise, update set to only include passed items
                lastSet = {
                    ...lastSet,
                    items: factCheckResult.passed
                };
                console.log(`📋 Continuing with ${lastSet.items.length} fact-checked items`);
            } else {
                console.log(`✅ All ${lastSet.items.length} items passed fact-check!`);
            }

            // Run semantic deduplication on the approved set
            // Use findSemanticDuplicatesWithEmbeddings to generate embeddings once and reuse
            const itemsAsQuestions = lastSet.items.map(item => ({ text: item.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                // Generate embeddings once and reuse for both dedup checks and storage
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(itemsAsQuestions, 'phase2');
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, itemsAsQuestions);
            } catch (err) {
                console.warn('⚠️ Duplicate check failed, skipping:', err);
            }

            // If duplicates found, note them but continue (set was approved by reviewer)
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                console.warn(`⚠️ Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${lastSet.items[dup.index].text}" ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }
            }

            // Store questions with embeddings for future deduplication (reusing already-generated embeddings)
            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    itemsAsQuestions,
                    finalEmbeddings,
                    'phase2'
                );
            }

            return { set: lastSet, embeddings: finalEmbeddings };
        }

        // 4. Decide: targeted item regeneration or full regeneration?
        // If homophone is good (>= 6) and b_concrete is good (>= 6), we can do targeted regeneration
        const canDoTargetedRegen = review.scores.phonetic >= 6 && bConcreteScore >= 6;

        // Find problematic items
        const badItemIndices = review.items_feedback
            .filter(item => !item.ok || (item as { is_too_obvious?: boolean }).is_too_obvious)
            .map(item => item.index);

        const goodItems = proposal.items.filter((_, idx) => !badItemIndices.includes(idx));
        const badItems = proposal.items.filter((_, idx) => badItemIndices.includes(idx));

        // If homophone is good and we have <= 60% bad items, do TARGETED regeneration
        if (canDoTargetedRegen && shouldUseTargetedRegen(badItemIndices.length, proposal.items.length)) {
            console.log(`🔧 Targeted regeneration: keeping homophone, replacing ${badItemIndices.length} items`);

            // Calculate distribution needed for replacement items
            const currentGoodA = goodItems.filter(item => item.answer === 'A').length;
            const currentGoodB = goodItems.filter(item => item.answer === 'B').length;
            const currentGoodBoth = goodItems.filter(item => item.answer === 'Both').length;

            // Target: 5A, 5B, 2Both
            const neededA = Math.max(0, 5 - currentGoodA);
            const neededB = Math.max(0, 5 - currentGoodB);
            const neededBoth = Math.max(0, 2 - currentGoodBoth);

            // Build targeted regeneration prompt
            const goodItemsText = goodItems.map((item, idx) =>
                `${idx + 1}. "${item.text}" → ${item.answer}`
            ).join('\n');

            const badItemsText = badItems.map((item, idx) =>
                `${idx + 1}. "${item.text}" → ${item.answer} (REJETÉ)`
            ).join('\n');

            const rejectionReasons = review.items_feedback
                .filter(item => !item.ok || (item as { is_too_obvious?: boolean }).is_too_obvious)
                .map(item => `- "${item.text}": ${item.issue || 'trop évident'}`)
                .join('\n');

            const targetedPrompt = PHASE2_TARGETED_REGENERATION_PROMPT
                .replace('{OPTION_A}', proposal.optionA)
                .replace('{OPTION_B}', proposal.optionB)
                .replace('{GOOD_ITEMS}', goodItemsText)
                .replace('{BAD_INDICES}', badItemIndices.map(i => i + 1).join(', '))
                .replace('{BAD_ITEMS}', badItemsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                .replace(/{COUNT}/g, String(badItemIndices.length))
                .replace('{NEEDED_A}', String(neededA))
                .replace('{NEEDED_B}', String(neededB))
                .replace('{NEEDED_BOTH}', String(neededBoth));

            try {
                const regenText = await callGemini(targetedPrompt, 'creative');
                const newItems = parseJsonFromText(regenText) as Array<{
                    text: string;
                    answer: 'A' | 'B' | 'Both';
                    acceptedAnswers?: ('A' | 'B' | 'Both')[];
                    justification: string;
                }>;

                // Merge: keep good items + add new items (preserve all fields)
                const mergedItems = [
                    ...goodItems.map(item => ({
                        text: item.text,
                        answer: item.answer,
                        acceptedAnswers: item.acceptedAnswers,
                        justification: item.justification
                    })),
                    ...newItems.map(item => ({
                        text: item.text,
                        answer: item.answer,
                        acceptedAnswers: item.acceptedAnswers,
                        justification: item.justification
                    }))
                ];

                // Update lastSet with merged items (keeping same homophone and descriptions)
                lastSet = {
                    optionA: proposal.optionA,
                    optionB: proposal.optionB,
                    optionADescription: proposal.optionADescription,
                    optionBDescription: proposal.optionBDescription,
                    items: mergedItems.slice(0, 12) // Ensure max 12 items
                };

                console.log(`✅ Targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);

                // Continue to next iteration to re-validate
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

Homophone conservé : "${proposal.optionA}" vs "${proposal.optionB}"
Items gardés : ${goodItems.length}
Nouveaux items : ${newItems.length}

Le reviewer va maintenant re-valider le set complet.
`;
                continue;
            } catch (err) {
                console.warn('⚠️ Targeted regeneration failed, falling back to full regen:', err);
            }
        }

        // FULL regeneration (homophone bad or targeted regen failed)
        const problemItems = review.items_feedback
            .filter(item => !item.ok)
            .map(item => `- Item ${item.index + 1} "${item.text}": ${item.issue}`)
            .join('\n');

        previousFeedback = `
⚠️ TENTATIVE PRÉCÉDENTE REJETÉE (score: ${review.overall_score}/10)

Ton set précédent :
- Option A : ${proposal.optionA}
- Option B : ${proposal.optionB}
- Reasoning : ${proposal.reasoning}

PROBLÈME HOMOPHONE :
${review.homophone_feedback}

ITEMS PROBLÉMATIQUES :
${problemItems || '(aucun item spécifique)'}

SUGGESTIONS DU REVIEWER :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

FEEDBACK GLOBAL :
${review.global_feedback}

→ CORRIGE ces problèmes dans ta nouvelle proposition.
→ NE RÉPÈTE PAS les mêmes erreurs.
→ CHANGE COMPLÈTEMENT le jeu de mots si le score phonétique < 6.
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating with feedback...`);
    }

    // If we reach here, use the BEST set seen (with valid phonetic), not the last one
    const fallbackSet = bestSet || lastSet;
    if (fallbackSet) {
        if (bestSet) {
            console.warn(`⚠️ Max iterations (${maxIterations}) reached. Using BEST set (score: ${bestScore}/10).`);
        } else {
            console.warn(`⚠️ Max iterations (${maxIterations}) reached. No valid phonetic found, using last set.`);
        }
        // Generate embeddings and store for future deduplication (even fallback)
        const fallbackItems = fallbackSet.items.map(item => ({ text: item.text }));
        const { embeddings: finalEmbeddings } = await findSemanticDuplicatesWithEmbeddings(fallbackItems, 'phase2');
        await storeQuestionsWithEmbeddings(fallbackItems, finalEmbeddings, 'phase2');

        return { set: fallbackSet, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen, but just in case
    throw new Error('Failed to generate Phase 2 set after all iterations');
}

/**
 * Helper function to determine if targeted regeneration should be used
 * @param badCount Number of problematic items
 * @param totalCount Total number of items
 * @param minOverallScore Minimum overall score to allow targeted regen (optional)
 * @param overallScore Current overall score (optional)
 */
function shouldUseTargetedRegen(
    badCount: number,
    totalCount: number,
    minOverallScore?: number,
    overallScore?: number
): boolean {
    if (badCount === 0) return false;
    const maxBad = Math.floor(totalCount * TARGETED_REGEN_MAX_PERCENTAGE);
    const thresholdOk = badCount <= maxBad;
    const scoreOk = minOverallScore === undefined || overallScore === undefined || overallScore >= minOverallScore;
    return thresholdOk && scoreOk;
}

/**
 * Perform targeted regeneration for Phase 1 questions
 * Keeps good questions and regenerates only the bad ones
 */
async function performPhase1TargetedRegen(
    lastQuestions: Phase1Question[],
    badIndices: number[],
    topic: string,
    difficulty: string,
    rejectionReasons: string
): Promise<Phase1Question[] | null> {
    const goodQuestions = lastQuestions.filter((_, idx) => !badIndices.includes(idx));
    const badQuestionsData = lastQuestions.filter((_, idx) => badIndices.includes(idx));

    const goodQuestionsText = goodQuestions.map((q, idx) =>
        `${idx + 1}. "${q.text}" → ${q.options[q.correctIndex]}`
    ).join('\n');

    const badQuestionsText = badQuestionsData.map((q, idx) =>
        `${idx + 1}. "${q.text}" (REJETÉ)`
    ).join('\n');

    const targetedPrompt = PHASE1_TARGETED_REGENERATION_PROMPT
        .replace('{TOPIC}', topic)
        .replace('{DIFFICULTY}', difficulty)
        .replace('{GOOD_QUESTIONS}', goodQuestionsText || '(aucune)')
        .replace('{BAD_INDICES}', badIndices.map(i => i + 1).join(', '))
        .replace('{BAD_QUESTIONS}', badQuestionsText)
        .replace('{REJECTION_REASONS}', rejectionReasons)
        .replace(/{COUNT}/g, String(badIndices.length));

    try {
        console.log(`🔧 Targeted regeneration: replacing ${badIndices.length} questions (indices: ${badIndices.map(i => i + 1).join(', ')})`);
        const regenText = await callGemini(targetedPrompt, 'factual');
        const newQuestions = parseJsonArrayFromText<Phase1GeneratorQuestion>(regenText);

        // Merge: keep good questions + add new questions
        const mergedQuestions = [
            ...goodQuestions,
            ...newQuestions.map(q => ({
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                anecdote: q.anecdote
            }))
        ];

        console.log(`✅ Targeted regen: merged ${goodQuestions.length} good + ${newQuestions.length} new questions`);
        return mergedQuestions.slice(0, 10); // Ensure max 10 questions
    } catch (err) {
        console.warn('⚠️ Targeted regeneration failed:', err);
        return null;
    }
}

/**
 * Perform targeted regeneration for Phase 4 questions
 * Keeps good questions and regenerates only the bad ones
 */
async function performPhase4TargetedRegen(
    lastQuestions: Phase4Question[],
    badIndices: number[],
    rejectionReasons: string
): Promise<Phase4Question[] | null> {
    const goodQuestions = lastQuestions.filter((_, idx) => !badIndices.includes(idx));
    const badQuestionsText = badIndices.map(idx =>
        `- Q${idx + 1}: "${lastQuestions[idx].question}" (REJETÉ)`
    ).join('\n');

    const targetedPrompt = PHASE4_TARGETED_REGENERATION_PROMPT
        .replace('{GOOD_QUESTIONS}', JSON.stringify(goodQuestions, null, 2))
        .replace('{BAD_INDICES}', badIndices.map(i => i + 1).join(', '))
        .replace('{BAD_QUESTIONS}', badQuestionsText)
        .replace('{REJECTION_REASONS}', rejectionReasons)
        .replace(/{COUNT}/g, String(badIndices.length));

    try {
        console.log(`🔧 Targeted regeneration: replacing ${badIndices.length} questions (indices: ${badIndices.map(i => i + 1).join(', ')})`);
        const regenText = await callGemini(targetedPrompt, 'creative');
        const newQuestions = parseJsonArrayFromText<Phase4Question>(regenText);

        const mergedQuestions = [...goodQuestions, ...newQuestions];
        console.log(`✅ Targeted regen: merged ${goodQuestions.length} good + ${newQuestions.length} new questions`);
        return mergedQuestions.slice(0, 10); // Ensure max 10 questions (MCQ format)
    } catch (err) {
        console.warn('⚠️ Targeted regeneration failed:', err);
        return null;
    }
}

/**
 * Perform targeted regeneration for Phase 5 questions
 * Keeps good questions and regenerates only the bad ones
 */
async function performPhase5TargetedRegen(
    lastQuestions: Phase5Question[],
    badIndices: number[],
    rejectionReasons: string
): Promise<Phase5Question[] | null> {
    const goodQuestions = lastQuestions.filter((_, idx) => !badIndices.includes(idx));
    const badQuestionsText = badIndices.map(idx =>
        `- Q${idx + 1}: "${lastQuestions[idx].question}" (REJETÉ)`
    ).join('\n');

    const targetedPrompt = PHASE5_TARGETED_REGENERATION_PROMPT
        .replace('{GOOD_QUESTIONS}', JSON.stringify(goodQuestions, null, 2))
        .replace('{BAD_INDICES}', badIndices.map(i => i + 1).join(', '))
        .replace('{BAD_QUESTIONS}', badQuestionsText)
        .replace('{REJECTION_REASONS}', rejectionReasons)
        .replace(/{COUNT}/g, String(badIndices.length));

    try {
        console.log(`🔧 Targeted regeneration: replacing ${badIndices.length} questions (indices: ${badIndices.map(i => i + 1).join(', ')})`);
        const regenText = await callGemini(targetedPrompt, 'creative');
        const newQuestions = parseJsonArrayFromText<Phase5Question>(regenText);

        const mergedQuestions = [...goodQuestions, ...newQuestions];
        console.log(`✅ Targeted regen: merged ${goodQuestions.length} good + ${newQuestions.length} new questions`);
        return mergedQuestions.slice(0, 10); // Ensure max 10 questions
    } catch (err) {
        console.warn('⚠️ Targeted regeneration failed:', err);
        return null;
    }
}

/**
 * Generate Phase 1 questions using dialogue between Generator and Reviewer agents
 * The two agents iterate until questions pass quality criteria
 */
async function generatePhase1WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 4
): Promise<{ questions: Phase1Question[]; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 1...');

    let previousFeedback = '';
    let lastQuestions: Phase1Question[] = [];

    // Track the BEST questions seen so far (for fallback when max iterations reached)
    let bestQuestions: Phase1Question[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes questions
        const generatorPrompt = PHASE1_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating questions...');
        const proposalText = await callGemini(generatorPrompt, 'factual'); // Use factual config for Phase 1
        let proposal: Phase1GeneratorQuestion[];

        try {
            proposal = parseJsonArrayFromText<Phase1GeneratorQuestion>(proposalText);
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue; // Skip to next iteration
        }

        console.log(`📝 Generated ${proposal.length} questions`);

        // Store for fallback
        lastQuestions = proposal.map(q => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            anecdote: q.anecdote
        }));

        // 2. Reviewer evaluates the questions
        const reviewerPrompt = PHASE1_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating questions...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'factual'); // Use factual config for Phase 1
        let review: Phase1DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase1DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue; // Skip to next iteration
        }

        // Log scores
        console.log(`📊 Scores: factual=${review.scores.factual_accuracy}, clarity=${review.scores.clarity}, style=${review.scores.burger_quiz_style}`);
        console.log(`          variety=${review.scores.variety}, anecdotes=${review.scores.anecdotes}, celebrities=${review.scores.celebrities}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        // CRITICAL: Factual accuracy must be >= 8 (increased from 7)
        if (review.scores.factual_accuracy < 8) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10). Questions have errors!`);

            // Identify questions with factual errors
            const factualErrorIndices = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'factual_error')
                .map(q => q.index);

            const problematicQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'factual_error')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

            // Try targeted regeneration if <= 60% have errors
            if (factualErrorIndices.length > 0 && shouldUseTargetedRegen(factualErrorIndices.length, lastQuestions.length)) {
                console.log(`🎯 Attempting targeted regen for ${factualErrorIndices.length} factual errors`);
                const rejectionReasons = review.questions_feedback
                    .filter(q => !q.ok && q.issue_type === 'factual_error')
                    .map(q => `- Q${q.index + 1}: ${q.issue} (erreur factuelle)`)
                    .join('\n');

                const newQuestions = await performPhase1TargetedRegen(
                    lastQuestions,
                    factualErrorIndices,
                    topic,
                    difficulty,
                    rejectionReasons
                );

                if (newQuestions) {
                    lastQuestions = newQuestions;
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (erreurs factuelles)

${factualErrorIndices.length} questions remplacées pour erreurs factuelles.
Le reviewer va maintenant re-valider le set complet.
`;
                    continue;
                }
                // If targeted regen failed, fall through to full regen
                console.log('⚠️ Targeted regen failed, falling back to full regen');
            }

            // Full regeneration
            previousFeedback = `
⚠️ QUESTIONS REJETÉES - ERREURS FACTUELLES (score: ${review.scores.factual_accuracy}/10)

Les questions suivantes contiennent des ERREURS :
${problematicQuestions || '(Vérifier toutes les réponses)'}

CRITIQUE : Chaque réponse DOIT être un FAIT 100% vérifiable.
Utilise Google Search pour vérifier AVANT de proposer.
NE RÉUTILISE PAS les questions rejetées.
`;
            continue;
        }

        // CRITICAL: Clarity must be >= 7 (increased from 6)
        if (review.scores.clarity < 7) {
            console.log(`❌ Clarity too low (${review.scores.clarity}/10). Questions are ambiguous!`);

            // Identify ambiguous questions
            const ambiguousIndices = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'ambiguous')
                .map(q => q.index);

            const ambiguousQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'ambiguous')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

            // Try targeted regeneration if <= 60% are ambiguous
            if (ambiguousIndices.length > 0 && shouldUseTargetedRegen(ambiguousIndices.length, lastQuestions.length)) {
                console.log(`🎯 Attempting targeted regen for ${ambiguousIndices.length} ambiguous questions`);
                const rejectionReasons = review.questions_feedback
                    .filter(q => !q.ok && q.issue_type === 'ambiguous')
                    .map(q => `- Q${q.index + 1}: ${q.issue} (ambiguë)`)
                    .join('\n');

                const newQuestions = await performPhase1TargetedRegen(
                    lastQuestions,
                    ambiguousIndices,
                    topic,
                    difficulty,
                    rejectionReasons
                );

                if (newQuestions) {
                    lastQuestions = newQuestions;
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (questions ambiguës)

${ambiguousIndices.length} questions remplacées car ambiguës.
Le reviewer va maintenant re-valider le set complet.
`;
                    continue;
                }
                console.log('⚠️ Targeted regen failed, falling back to full regen');
            }

            // Full regeneration
            previousFeedback = `
⚠️ QUESTIONS REJETÉES - AMBIGUÏTÉ (score clarté: ${review.scores.clarity}/10)

Les questions suivantes sont AMBIGUËS :
${ambiguousQuestions || '(Reformuler pour avoir une seule réponse possible)'}

CRITIQUE : Chaque question doit avoir UNE SEULE réponse correcte.
Si plusieurs réponses pourraient être valides → reformule la question.
`;
            continue;
        }

        // Track the BEST questions seen so far (only if critical scores are acceptable)
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestQuestions = [...lastQuestions];
            console.log(`📈 New best questions! Score: ${bestScore}/10`);
        }

        // Check overall score (>= 7 is considered acceptable - increased from 6)
        if (review.overall_score >= 7) {
            console.log(`✅ Questions validated by reviewer after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // === FACT-CHECK STEP ===
            // Run dedicated fact-checking with low temperature and Google Search
            const factCheckResult = await factCheckPhase1Questions(lastQuestions);

            if (factCheckResult.failed.length > 0) {
                console.log(`⚠️ Fact-check rejected ${factCheckResult.failed.length}/${lastQuestions.length} questions`);

                const failedFeedback = factCheckResult.failed
                    .map(f => `- "${f.question.text.slice(0, 50)}...": ${f.reason}`)
                    .join('\n');

                // Try targeted regeneration if <= 60% failed
                if (shouldUseTargetedRegen(factCheckResult.failed.length, lastQuestions.length)) {
                    // Find indices of failed questions
                    const failedIndices = factCheckResult.failed.map(f =>
                        lastQuestions.findIndex(q => q.text === f.question.text)
                    ).filter(idx => idx !== -1);

                    if (failedIndices.length > 0) {
                        console.log(`🎯 Attempting targeted regen for ${failedIndices.length} fact-check failures`);
                        const rejectionReasons = factCheckResult.failed
                            .map(f => `- "${f.question.text.slice(0, 40)}...": ${f.reason}`)
                            .join('\n');

                        const newQuestions = await performPhase1TargetedRegen(
                            lastQuestions,
                            failedIndices,
                            topic,
                            difficulty,
                            rejectionReasons
                        );

                        if (newQuestions) {
                            lastQuestions = newQuestions;
                            previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (échec fact-check)

${failedIndices.length} questions remplacées après échec de vérification factuelle.
Le reviewer va maintenant re-valider le set complet.
`;
                            continue;
                        }
                        console.log('⚠️ Targeted regen failed, falling back to full regen');
                    }
                }

                // Full regeneration if too many failed or targeted regen failed
                if (factCheckResult.failed.length > Math.floor(lastQuestions.length * TARGETED_REGEN_MAX_PERCENTAGE)) {
                    previousFeedback = `
⚠️ VÉRIFICATION FACTUELLE ÉCHOUÉE

Le fact-checker externe a détecté des erreurs dans ces questions :
${failedFeedback}

CRITIQUE : Génère de NOUVELLES questions avec des FAITS VÉRIFIABLES.
Chaque réponse doit être 100% correcte et vérifiable avec une recherche Google.
`;
                    continue; // Regenerate with feedback
                }

                // Otherwise, just use the questions that passed
                lastQuestions = factCheckResult.passed;
                console.log(`📋 Continuing with ${lastQuestions.length} fact-checked questions`);
            } else {
                console.log(`✅ All ${lastQuestions.length} questions passed fact-check!`);
            }

            // Run semantic deduplication
            // Use findSemanticDuplicatesWithEmbeddings to generate embeddings once and reuse
            const questionsAsItems = lastQuestions.map(q => ({ text: q.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let allEmbeddings: number[][] = [];

            try {
                // Generate embeddings once and reuse for both dedup checks and storage
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase1');
                semanticDuplicates = dedupResult.duplicates;
                allEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(allEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Duplicate check failed, skipping:', err);
            }

            // BLOCKING: Filter out duplicates
            const duplicateIndices = new Set([
                ...semanticDuplicates.map(d => d.index),
                ...internalDuplicates.map(d => d.index)
            ]);

            if (duplicateIndices.size > 0) {
                console.warn(`🔄 Filtering ${duplicateIndices.size} duplicate questions`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${lastQuestions[dup.index].text.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }

                // Filter out duplicates from questions AND embeddings
                const filteredQuestions: typeof lastQuestions = [];
                const filteredEmbeddings: number[][] = [];
                for (let idx = 0; idx < lastQuestions.length; idx++) {
                    if (!duplicateIndices.has(idx)) {
                        filteredQuestions.push(lastQuestions[idx]);
                        if (allEmbeddings[idx]) {
                            filteredEmbeddings.push(allEmbeddings[idx]);
                        }
                    }
                }
                lastQuestions = filteredQuestions;
                allEmbeddings = filteredEmbeddings;

                // If too many filtered, iterate with feedback to get new questions
                if (lastQuestions.length < 8) {
                    previousFeedback = `
⚠️ DUPLICATS DÉTECTÉS - ${duplicateIndices.size} questions similaires à des questions existantes.
Génère des questions DIFFÉRENTES et ORIGINALES.
NE RÉPÈTE PAS des questions déjà posées.
`;
                    continue;
                }
            }

            // Store questions with embeddings for future deduplication (reusing already-generated embeddings)
            if (allEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    lastQuestions.map(q => ({ text: q.text })),
                    allEmbeddings,
                    'phase1'
                );
            }

            return { questions: lastQuestions, embeddings: allEmbeddings };
        }

        // 4. Try targeted regeneration if <= 60% of questions are bad
        const badQuestionIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        // Use helper to check if targeted regen is appropriate (60% threshold, min score 4)
        if (shouldUseTargetedRegen(badQuestionIndices.length, lastQuestions.length, 4, review.overall_score)) {
            const rejectionReasons = review.questions_feedback
                .filter(q => !q.ok)
                .map(q => `- Q${q.index + 1}: ${q.issue} (${q.issue_type})`)
                .join('\n');

            const newQuestions = await performPhase1TargetedRegen(
                lastQuestions,
                badQuestionIndices,
                topic,
                difficulty,
                rejectionReasons
            );

            if (newQuestions) {
                lastQuestions = newQuestions;
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${badQuestionIndices.length} questions remplacées.
Le reviewer va maintenant re-valider le set complet.
`;
                continue;
            }
            // If targeted regen failed, fall through to full regen
        }

        // 5. Full regeneration - build feedback for next iteration
        const problemQuestions = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => `- Q${q.index + 1} "${q.text.slice(0, 50)}...": ${q.issue} (type: ${q.issue_type})`)
            .join('\n');

        previousFeedback = `
⚠️ TENTATIVE PRÉCÉDENTE REJETÉE (score: ${review.overall_score}/10)

SCORES :
- Exactitude factuelle : ${review.scores.factual_accuracy}/10
- Clarté : ${review.scores.clarity}/10
- Style Burger Quiz : ${review.scores.burger_quiz_style}/10
- Variété : ${review.scores.variety}/10
- Anecdotes : ${review.scores.anecdotes}/10
- Célébrités : ${review.scores.celebrities}/10

QUESTIONS PROBLÉMATIQUES :
${problemQuestions || '(aucune question spécifique)'}

SUGGESTIONS DU REVIEWER :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

FEEDBACK GLOBAL :
${review.global_feedback}

→ CORRIGE ces problèmes dans tes nouvelles questions.
→ NE RÉUTILISE PAS les questions rejetées.
→ VÉRIFIE chaque fait avec Google Search.
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating with feedback...`);
    }

    // Use the BEST questions seen, not just the last ones
    const fallbackQuestions = bestQuestions.length > 0 ? bestQuestions : lastQuestions;
    if (fallbackQuestions.length > 0) {
        if (bestQuestions.length > 0) {
            console.warn(`⚠️ Max iterations (${maxIterations}) reached. Using BEST questions (score: ${bestScore}/10).`);
        } else {
            console.warn(`⚠️ Max iterations (${maxIterations}) reached. No valid set found, using last questions.`);
        }
        // Generate embeddings and store for future deduplication (even fallback)
        const fallbackItems = fallbackQuestions.map(q => ({ text: q.text }));
        const { embeddings: finalEmbeddings } = await findSemanticDuplicatesWithEmbeddings(fallbackItems, 'phase1');
        await storeQuestionsWithEmbeddings(fallbackItems, finalEmbeddings, 'phase1');

        return { questions: fallbackQuestions, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen
    throw new Error('Failed to generate Phase 1 questions after all iterations');
}

/**
 * Generate Phase 3 menus using dialogue between Generator and Reviewer agents
 * Creates 4 themed menus with 5 questions each: 3 normal + 1 trap menu
 */
async function generatePhase3WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 4
): Promise<{ menus: Phase3Menu[]; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 3...');

    let previousFeedback = '';
    let lastMenus: Phase3Menu[] = [];
    let bestMenus: Phase3Menu[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes menus
        const generatorPrompt = PHASE3_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating menus...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase3Menu[];

        try {
            proposal = parseJsonArrayFromText<Phase3Menu>(proposalText);
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📋 Generated ${proposal.length} menus`);
        for (const menu of proposal) {
            const trapIndicator = menu.isTrap ? ' 🎭 TRAP' : '';
            console.log(`   - "${menu.title}": ${menu.questions.length} questions${trapIndicator}`);
        }

        // Validate menu count (expecting 4 menus: 3 normal + 1 trap)
        if (proposal.length !== 4) {
            console.log(`❌ Expected 4 menus, got ${proposal.length}. Retrying...`);
            previousFeedback = `
⚠️ NOMBRE DE MENUS INCORRECT

Tu as généré ${proposal.length} menus, mais il en faut exactement 4 :
- 3 menus normaux (isTrap: false)
- 1 menu piège (isTrap: true)

Recommence avec 4 menus.
`;
            continue;
        }

        // Validate trap menu presence
        const trapMenus = proposal.filter(m => m.isTrap === true);
        if (trapMenus.length !== 1) {
            console.log(`❌ Expected exactly 1 trap menu, got ${trapMenus.length}. Retrying...`);
            previousFeedback = `
⚠️ MENU PIÈGE MANQUANT OU INCORRECT

Tu as ${trapMenus.length} menu(s) piège(s), mais il en faut exactement 1.
- Mets "isTrap": true pour UN seul menu (celui avec les questions les plus difficiles)
- Les 3 autres menus doivent avoir "isTrap": false

Recommence avec exactement 1 menu piège.
`;
            continue;
        }

        lastMenus = proposal;

        // 2. Reviewer evaluates the menus
        const reviewerPrompt = PHASE3_DIALOGUE_REVIEWER_PROMPT
            .replace('{MENUS}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating menus...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'creative');
        let review: Phase3DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase3DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue;
        }

        // Log scores
        console.log(`📊 Scores: titles=${review.scores.title_creativity}, descs=${review.scores.descriptions}, variety=${review.scores.thematic_variety}`);
        console.log(`          style=${review.scores.question_style}, factual=${review.scores.factual_accuracy}, clarity=${review.scores.clarity}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        if (review.scores.factual_accuracy < 7) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10).`);

            const problematicQuestions: string[] = [];
            for (const menuFb of review.menus_feedback) {
                for (const qFb of menuFb.questions_feedback) {
                    if (!qFb.ok && qFb.issues.includes('reponse_incorrecte')) {
                        problematicQuestions.push(`- Menu "${menuFb.title}", Q${qFb.index + 1}: "${qFb.question}" (correction: ${qFb.correction || 'N/A'})`);
                    }
                }
            }

            previousFeedback = `
⚠️ ERREURS FACTUELLES DÉTECTÉES (score: ${review.scores.factual_accuracy}/10)

Questions avec erreurs :
${problematicQuestions.join('\n') || '(Vérifier toutes les réponses)'}

CRITIQUE : Utilise Google Search pour VÉRIFIER chaque réponse.
`;
            continue;
        }

        if (review.scores.title_creativity < 5) {
            console.log(`❌ Titles too generic (${review.scores.title_creativity}/10).`);

            const genericTitles = review.menus_feedback
                .filter(m => !m.title_ok)
                .map(m => `- "${m.title}": ${m.title_issue || 'trop générique'}`)
                .join('\n');

            previousFeedback = `
⚠️ TITRES TROP GÉNÉRIQUES (score: ${review.scores.title_creativity}/10)

Titres à améliorer :
${genericTitles}

Rappel : Les titres doivent être CRÉATIFS et FUN, pas "Menu Culture Générale".
Exemples de bons titres : "Menu Catastrophes Culinaires", "Menu Scandales Royaux".
`;
            continue;
        }

        // Track best menus
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestMenus = [...lastMenus];
            console.log(`📈 New best menus! Score: ${bestScore}/10`);
        }

        // Check overall score
        if (review.overall_score >= 7) {
            console.log(`✅ Menus validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // Fact-check all questions
            for (const menu of lastMenus) {
                const factCheckResult = await factCheckSimpleQuestions(menu.questions);
                if (factCheckResult.failed.length > 0) {
                    console.warn(`⚠️ Menu "${menu.title}": ${factCheckResult.failed.length} questions failed fact-check`);
                    menu.questions = factCheckResult.passed;
                }
            }

            // Run semantic deduplication and generate embeddings in one pass
            const allQuestions = lastMenus.flatMap(m => m.questions.map(q => q.question));
            const questionsAsItems = allQuestions.map(q => ({ text: q }));

            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase3');
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Phase 3 duplicate check failed, skipping:', err);
            }

            // Log duplicates if found (Phase 3 doesn't filter, just logs)
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                console.warn(`⚠️ Phase 3: Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }
            }

            // Store for deduplication (reusing already-generated embeddings)
            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    questionsAsItems,
                    finalEmbeddings,
                    'phase3'
                );
            }

            return { menus: lastMenus, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration for bad questions
        const badQuestions: Array<{ menu_index: number; question_index: number; reason: string }> = [];
        for (const menuFb of review.menus_feedback) {
            for (const qFb of menuFb.questions_feedback) {
                if (!qFb.ok) {
                    badQuestions.push({
                        menu_index: menuFb.menu_index,
                        question_index: qFb.index,
                        reason: qFb.issues.join(', ') || 'problème non spécifié'
                    });
                }
            }
        }

        // Calculate total questions across all menus
        const totalQuestions = lastMenus.reduce((sum, menu) => sum + menu.questions.length, 0);

        if (shouldUseTargetedRegen(badQuestions.length, totalQuestions, 5, review.overall_score)) {
            console.log(`🔧 Targeted regeneration: replacing ${badQuestions.length} questions`);

            const menusStructure = lastMenus.map(m => ({
                title: m.title,
                description: m.description,
                question_count: m.questions.length
            }));

            const badQuestionsText = badQuestions.map(bq =>
                `- Menu ${bq.menu_index + 1} Q${bq.question_index + 1}: "${lastMenus[bq.menu_index].questions[bq.question_index].question}" (${bq.reason})`
            ).join('\n');

            const rejectionReasons = badQuestions.map(bq => bq.reason).join('; ');

            const targetedPrompt = PHASE3_TARGETED_REGENERATION_PROMPT
                .replace('{MENUS_STRUCTURE}', JSON.stringify(menusStructure, null, 2))
                .replace('{BAD_QUESTIONS}', badQuestionsText)
                .replace('{REJECTION_REASONS}', rejectionReasons);

            try {
                const regenText = await callGemini(targetedPrompt, 'creative');
                interface ReplacementItem {
                    menu_index: number;
                    question_index: number;
                    new_question: string;
                    new_answer: string;
                }
                const replacements = parseJsonFromText(regenText) as { replacements: ReplacementItem[] };

                // Apply replacements
                for (const repl of replacements.replacements) {
                    if (lastMenus[repl.menu_index] && lastMenus[repl.menu_index].questions[repl.question_index]) {
                        lastMenus[repl.menu_index].questions[repl.question_index] = {
                            question: repl.new_question,
                            answer: repl.new_answer
                        };
                    }
                }

                console.log(`✅ Applied ${replacements.replacements.length} replacements`);
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${replacements.replacements.length} questions remplacées.
Le reviewer va maintenant re-valider les menus.
`;
                continue;
            } catch (err) {
                console.warn('⚠️ Targeted regeneration failed:', err);
            }
        }

        // Full regeneration feedback
        previousFeedback = `
⚠️ TENTATIVE REJETÉE (score: ${review.overall_score}/10)

${review.global_feedback}

SUGGESTIONS :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

→ CORRIGE ces problèmes.
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating...`);
    }

    // Fallback to best menus
    let fallbackMenus = bestMenus.length > 0 ? bestMenus : lastMenus;
    if (fallbackMenus.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best menus (score: ${bestScore}/10).`);

        // Ensure exactly one trap menu exists (fallback logic)
        const trapCount = fallbackMenus.filter(m => m.isTrap === true).length;
        if (trapCount !== 1) {
            console.warn(`⚠️ Trap menu fix: found ${trapCount} trap(s), expected 1. Auto-assigning...`);
            // Reset all isTrap to false first
            fallbackMenus = fallbackMenus.map(m => ({ ...m, isTrap: false }));
            // Pick a random menu to be the trap (index 0-3)
            const trapIndex = Math.floor(Math.random() * fallbackMenus.length);
            fallbackMenus[trapIndex].isTrap = true;
            console.log(`   → Menu "${fallbackMenus[trapIndex].title}" marked as trap`);
        }
        const allQuestions = fallbackMenus.flatMap(m => m.questions.map(q => q.question));
        const questionsAsItems = allQuestions.map(q => ({ text: q }));

        // Run deduplication and generate embeddings
        let finalEmbeddings: number[][] = [];
        try {
            const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase3');
            finalEmbeddings = dedupResult.embeddings;

            if (dedupResult.duplicates.length > 0) {
                console.warn(`⚠️ Phase 3 fallback: Found ${dedupResult.duplicates.length} duplicates`);
            }
        } catch (err) {
            console.warn('⚠️ Phase 3 fallback dedup failed:', err);
        }

        if (finalEmbeddings.length > 0) {
            await storeQuestionsWithEmbeddings(
                questionsAsItems,
                finalEmbeddings,
                'phase3'
            );
        }

        return { menus: fallbackMenus, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 3 menus after all iterations');
}

/**
 * Generate Phase 4 MCQ culture générale questions using dialogue between Generator and Reviewer agents
 * Creates 10 MCQ questions with 4 options each
 */
async function generatePhase4WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 4
): Promise<{ questions: Phase4Question[]; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 4 MCQ...');

    let previousFeedback = '';
    let lastQuestions: Phase4Question[] = [];
    let bestQuestions: Phase4Question[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes questions
        const generatorPrompt = PHASE4_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating MCQ questions...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase4Question[];

        try {
            proposal = parseJsonArrayFromText<Phase4Question>(proposalText);
            // Validate MCQ format
            proposal = proposal.filter(q =>
                q.question &&
                Array.isArray(q.options) &&
                q.options.length === 4 &&
                typeof q.correctIndex === 'number' &&
                q.correctIndex >= 0 &&
                q.correctIndex <= 3
            );

            // Shuffle options to prevent AI bias (correct answer not always in same position)
            proposal = proposal.map(q => shuffleMCQOptions(q));
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📝 Generated ${proposal.length} valid MCQ questions`);
        lastQuestions = proposal;

        // 2. Reviewer evaluates the questions
        const reviewerPrompt = PHASE4_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating MCQ questions...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'creative');
        let review: Phase4DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase4DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue;
        }

        // Log scores
        console.log(`📊 Scores: factual=${review.scores.factual_accuracy}, options=${review.scores.option_plausibility}, difficulty=${review.scores.difficulty_balance}`);
        console.log(`          variety=${review.scores.thematic_variety}, clarity=${review.scores.clarity}, anecdotes=${review.scores.anecdote_quality}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        if (review.scores.factual_accuracy < 7) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10).`);

            // Identify questions with factual errors
            const wrongIndices = review.questions_feedback
                .filter(q => q.issues.includes('factual_error'))
                .map(q => q.index);

            const wrongQuestions = review.questions_feedback
                .filter(q => q.issues.includes('factual_error'))
                .map(q => `- Q${q.index + 1}: "${q.question}" → ${q.correction || '?'}`)
                .join('\n');

            // Try targeted regeneration if <= 60% have errors
            if (wrongIndices.length > 0 && shouldUseTargetedRegen(wrongIndices.length, lastQuestions.length)) {
                console.log(`🎯 Attempting targeted regen for ${wrongIndices.length} factual errors`);
                const rejectionReasons = `Erreurs factuelles:\n${wrongQuestions}`;

                const newQuestions = await performPhase4TargetedRegen(
                    lastQuestions,
                    wrongIndices,
                    rejectionReasons
                );

                if (newQuestions) {
                    lastQuestions = newQuestions.map(q => shuffleMCQOptions(q));
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (erreurs factuelles)

${wrongIndices.length} questions remplacées pour erreurs factuelles.
Le reviewer va maintenant re-valider le set complet.
`;
                    continue;
                }
                console.log('⚠️ Targeted regen failed, falling back to full regen');
            }

            // Full regeneration
            previousFeedback = `
⚠️ ERREURS FACTUELLES (score: ${review.scores.factual_accuracy}/10)

Questions incorrectes :
${wrongQuestions || '(Vérifier toutes les réponses)'}

CRITIQUE : Utilise Google Search pour vérifier CHAQUE réponse.
`;
            continue;
        }

        if (review.scores.option_plausibility < 6) {
            console.log(`❌ Options not plausible enough (${review.scores.option_plausibility}/10).`);

            // Identify questions with implausible options
            const badIndices = review.questions_feedback
                .filter(q => q.issues.includes('implausible_options'))
                .map(q => q.index);

            const badQuestions = review.questions_feedback
                .filter(q => q.issues.includes('implausible_options'))
                .map(q => `- Q${q.index + 1}: "${q.question.slice(0, 40)}..."`)
                .join('\n');

            // Try targeted regeneration
            if (badIndices.length > 0 && shouldUseTargetedRegen(badIndices.length, lastQuestions.length)) {
                console.log(`🎯 Attempting targeted regen for ${badIndices.length} bad options`);
                const rejectionReasons = `Options non plausibles:\n${badQuestions}`;

                const newQuestions = await performPhase4TargetedRegen(
                    lastQuestions,
                    badIndices,
                    rejectionReasons
                );

                if (newQuestions) {
                    lastQuestions = newQuestions.map(q => shuffleMCQOptions(q));
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (options non plausibles)

${badIndices.length} questions remplacées car options trop évidentes.
Le reviewer va maintenant re-valider.
`;
                    continue;
                }
            }

            // Full regeneration
            previousFeedback = `
⚠️ OPTIONS NON PLAUSIBLES (score: ${review.scores.option_plausibility}/10)

Questions avec options évidentes :
${badQuestions || '(Toutes les questions)'}

RAPPEL : Les 4 options doivent être du MÊME REGISTRE et faire hésiter.
`;
            continue;
        }

        // Track best questions
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestQuestions = [...lastQuestions];
            console.log(`📈 New best questions! Score: ${bestScore}/10`);
        }

        // Check overall score
        if (review.overall_score >= 7) {
            console.log(`✅ MCQ Questions validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // Run semantic deduplication and generate embeddings in one pass
            const questionsAsItems = lastQuestions.map(q => ({ text: q.question }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase4');
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Phase 4 duplicate check failed, skipping:', err);
            }

            // Log duplicates if found
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                console.warn(`⚠️ Phase 4: Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }
            }

            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    questionsAsItems,
                    finalEmbeddings,
                    'phase4'
                );
            }

            return { questions: lastQuestions, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration (up to 60% of questions)
        const badIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        if (shouldUseTargetedRegen(badIndices.length, lastQuestions.length, 4, review.overall_score)) {
            console.log(`🔧 Phase 4 targeted regeneration: replacing ${badIndices.length}/${lastQuestions.length} questions`);

            const rejectionReasons = badIndices.map(idx =>
                review.questions_feedback.find(q => q.index === idx)?.issues?.join(', ') || ''
            ).join('; ');

            const regenResult = await performPhase4TargetedRegen(
                lastQuestions,
                badIndices,
                rejectionReasons
            );

            if (regenResult) {
                lastQuestions = regenResult.map(q => shuffleMCQOptions(q));
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${badIndices.length} questions remplacées.
Le reviewer va maintenant re-valider.
`;
                continue;
            }
        }

        // Full regeneration feedback
        previousFeedback = `
⚠️ TENTATIVE REJETÉE (score: ${review.overall_score}/10)

${review.global_feedback}

SUGGESTIONS :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating...`);
    }

    // Fallback
    const fallbackQuestions = bestQuestions.length > 0 ? bestQuestions : lastQuestions;
    if (fallbackQuestions.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best questions (score: ${bestScore}/10).`);
        const questionsAsItems = fallbackQuestions.map(q => ({ text: q.question }));

        // Run deduplication and generate embeddings
        let finalEmbeddings: number[][] = [];
        try {
            const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase4');
            finalEmbeddings = dedupResult.embeddings;

            if (dedupResult.duplicates.length > 0) {
                console.warn(`⚠️ Phase 4 fallback: Found ${dedupResult.duplicates.length} duplicates`);
            }
        } catch (err) {
            console.warn('⚠️ Phase 4 fallback dedup failed:', err);
        }

        if (finalEmbeddings.length > 0) {
            await storeQuestionsWithEmbeddings(
                questionsAsItems,
                finalEmbeddings,
                'phase4'
            );
        }

        return { questions: fallbackQuestions, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 4 questions after all iterations');
}

/**
 * Generate Phase 5 memory sequence using dialogue between Generator and Reviewer agents
 * Creates 10 linked questions with callbacks for memory challenge
 */
async function generatePhase5WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 4
): Promise<{ questions: Phase5Question[]; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 5...');

    let previousFeedback = '';
    let lastQuestions: Phase5Question[] = [];
    let bestQuestions: Phase5Question[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes questions
        const generatorPrompt = PHASE5_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating memory sequence...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase5Question[];

        try {
            proposal = parseJsonArrayFromText<Phase5Question>(proposalText);
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📝 Generated ${proposal.length} questions for memory sequence`);
        lastQuestions = proposal;

        // 2. Reviewer evaluates the sequence
        const reviewerPrompt = PHASE5_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating sequence...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'creative');
        let review: Phase5DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase5DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue;
        }

        // Log scores
        console.log(`📊 Scores: memorability=${review.scores.memorability}, callbacks=${review.scores.callbacks}, progression=${review.scores.progression}`);
        console.log(`          factual=${review.scores.factual_accuracy}, answers=${review.scores.answer_length}, coherence=${review.scores.thematic_coherence}`);
        console.log(`   Callbacks: ${review.callback_count}/10, Curve OK: ${review.difficulty_curve?.curve_ok}, Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        if (review.scores.memorability < 6) {
            console.log(`❌ Questions not memorable enough (${review.scores.memorability}/10).`);

            const boringQuestions = review.questions_feedback
                .filter(q => !q.memorable)
                .map(q => `- Q${q.index + 1}: "${q.question.slice(0, 40)}..."`)
                .join('\n');

            previousFeedback = `
⚠️ QUESTIONS PAS ASSEZ MÉMORABLES (score: ${review.scores.memorability}/10)

Questions à reformuler :
${boringQuestions || '(Toutes)'}

RAPPEL : Les questions doivent être COURTES, avec des IMAGES MENTALES fortes.
Évite le format encyclopédique.
`;
            continue;
        }

        if (review.callback_count < 2) {
            console.log(`❌ Not enough callbacks (${review.callback_count}, need at least 2).`);

            previousFeedback = `
⚠️ PAS ASSEZ DE CALLBACKS (${review.callback_count}/10, minimum 2)

Les questions doivent être LIÉES entre elles !

TECHNIQUE DU CALLBACK (OBLIGATOIRE) :
- Q3 doit référencer la réponse de Q1 ou Q2
- Q7-10 peuvent référencer des questions précédentes

Exemple :
Q1: "Prénom de la reine d'Angleterre décédée en 2022 ?" → "Elizabeth"
Q3: "Si Elizabeth avait été française, elle aurait été Elizabeth combien ?" → "3"
`;
            continue;
        }

        if (review.scores.factual_accuracy < 7) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10).`);

            const wrongQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issues.includes('reponse_incorrecte'));
            const wrongIndices = wrongQuestions.map(q => q.index);

            // Try targeted regen if <= 60% have factual errors
            if (shouldUseTargetedRegen(wrongIndices.length, lastQuestions.length) && wrongIndices.length > 0) {
                console.log(`🔧 Phase 5 factual targeted regen: replacing ${wrongIndices.length} questions`);

                const rejectionReasons = wrongQuestions
                    .map(q => `Q${q.index + 1}: "${q.question}" - erreur factuelle: ${q.correction || 'correction inconnue'}`)
                    .join('\n');

                const regenResult = await performPhase5TargetedRegen(
                    lastQuestions,
                    wrongIndices,
                    `Erreurs factuelles:\n${rejectionReasons}`
                );

                if (regenResult) {
                    lastQuestions = regenResult;
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE (erreurs factuelles)

${wrongIndices.length} questions incorrectes remplacées.
Le reviewer va maintenant re-valider.
`;
                    continue;
                }
            }

            // Full regen fallback
            const wrongQuestionsText = wrongQuestions
                .map(q => `- Q${q.index + 1}: "${q.question}" → ${q.correction || '?'}`)
                .join('\n');

            previousFeedback = `
⚠️ ERREURS FACTUELLES (score: ${review.scores.factual_accuracy}/10)

Questions incorrectes :
${wrongQuestionsText || '(Vérifier toutes les réponses)'}

CRITIQUE : Utilise Google Search pour vérifier CHAQUE réponse.
`;
            continue;
        }

        if (review.difficulty_curve && !review.difficulty_curve.curve_ok) {
            console.log(`❌ Difficulty curve not respected.`);

            previousFeedback = `
⚠️ COURBE DE DIFFICULTÉ INCORRECTE

La progression doit être :
- Q1-3 : FACILES (faits connus)
- Q4-7 : MOYENNES
- Q8-10 : DIFFICILES (détails, callbacks)

Réorganise ou remplace les questions pour respecter cette courbe.
`;
            continue;
        }

        // Track best questions
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestQuestions = [...lastQuestions];
            console.log(`📈 New best sequence! Score: ${bestScore}/10`);
        }

        // Check overall score
        if (review.overall_score >= 7) {
            console.log(`✅ Sequence validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // Fact-check
            const factCheckResult = await factCheckSimpleQuestions(lastQuestions);
            if (factCheckResult.failed.length > 0) {
                console.warn(`⚠️ ${factCheckResult.failed.length}/${lastQuestions.length} questions failed fact-check`);

                // Try targeted regen for failed fact-checks (up to 60%)
                if (shouldUseTargetedRegen(factCheckResult.failed.length, lastQuestions.length)) {
                    const failedIndices = factCheckResult.failed.map(f =>
                        lastQuestions.findIndex(q => q.question === f.question.question)
                    ).filter(idx => idx !== -1);

                    if (failedIndices.length > 0) {
                        const failedReasons = factCheckResult.failed.map(f =>
                            `"${f.question.question.slice(0, 50)}...": ${f.reason}`
                        ).join('\n');

                        const regenResult = await performPhase5TargetedRegen(
                            lastQuestions,
                            failedIndices,
                            `Fact-check failed:\n${failedReasons}`
                        );

                        if (regenResult) {
                            lastQuestions = regenResult;
                            console.log(`✅ Phase 5 fact-check targeted regen: replaced ${failedIndices.length} questions`);
                            previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE (fact-check)

${failedIndices.length} questions incorrectes remplacées.
Le reviewer va maintenant re-valider.
`;
                            continue;
                        }
                    }
                }

                // Full regen if too many failures or targeted regen failed
                if (factCheckResult.failed.length > Math.floor(lastQuestions.length * TARGETED_REGEN_MAX_PERCENTAGE)) {
                    previousFeedback = `
⚠️ VÉRIFICATION FACTUELLE ÉCHOUÉE

${factCheckResult.failed.length} questions incorrectes. Régénère avec des FAITS VÉRIFIABLES.
`;
                    continue;
                }
                lastQuestions = factCheckResult.passed;
            }

            // Run semantic deduplication and generate embeddings in one pass
            const questionsAsItems = lastQuestions.map(q => ({ text: q.question }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase5');
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Phase 5 duplicate check failed, skipping:', err);
            }

            // Log duplicates if found
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                console.warn(`⚠️ Phase 5: Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }
            }

            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    questionsAsItems,
                    finalEmbeddings,
                    'phase5'
                );
            }

            return { questions: lastQuestions, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration (up to 60% of questions)
        const badIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        if (shouldUseTargetedRegen(badIndices.length, lastQuestions.length, 4, review.overall_score)) {
            console.log(`🔧 Phase 5 targeted regeneration: replacing ${badIndices.length}/${lastQuestions.length} questions`);

            const rejectionReasons = review.questions_feedback
                .filter(q => badIndices.includes(q.index))
                .map(q => q.issues.join(', '))
                .join('; ');

            const regenResult = await performPhase5TargetedRegen(
                lastQuestions,
                badIndices,
                rejectionReasons
            );

            if (regenResult) {
                lastQuestions = regenResult;
                console.log(`✅ Phase 5 targeted regen: replaced ${badIndices.length} questions`);

                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${badIndices.length} questions remplacées.
Le reviewer va maintenant re-valider la séquence.
`;
                continue;
            }
        }

        // Full regeneration feedback
        previousFeedback = `
⚠️ TENTATIVE REJETÉE (score: ${review.overall_score}/10)

${review.global_feedback}

SUGGESTIONS :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating...`);
    }

    // Fallback
    const fallbackQuestions = bestQuestions.length > 0 ? bestQuestions : lastQuestions;
    if (fallbackQuestions.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best sequence (score: ${bestScore}/10).`);
        const questionsAsItems = fallbackQuestions.map(q => ({ text: q.question }));

        // Run deduplication and generate embeddings
        let finalEmbeddings: number[][] = [];
        try {
            const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase5');
            finalEmbeddings = dedupResult.embeddings;

            if (dedupResult.duplicates.length > 0) {
                console.warn(`⚠️ Phase 5 fallback: Found ${dedupResult.duplicates.length} duplicates`);
            }
        } catch (err) {
            console.warn('⚠️ Phase 5 fallback dedup failed:', err);
        }

        if (finalEmbeddings.length > 0) {
            await storeQuestionsWithEmbeddings(
                questionsAsItems,
                finalEmbeddings,
                'phase5'
            );
        }

        return { questions: fallbackQuestions, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 5 sequence after all iterations');
}

// --- GENKIT FLOW ---

export const generateGameQuestionsFlow = ai.defineFlow(
    {
        name: 'generateGameQuestions',
        inputSchema: GameGenerationInputSchema,
        outputSchema: GameGenerationOutputSchema,
    },
    async (input) => {
        const { phase, difficulty } = input;

        // Generate creative topic with AI if none provided or default
        // Phase 2 uses a specific prompt for topics that work well with homophones
        const topic = (!input.topic || input.topic === 'General Knowledge')
            ? await generateCreativeTopic(phase)
            : input.topic;

        console.log(`🎲 Generating ${phase} content on topic: "${topic}" (${difficulty})`);

        // Track start time for metrics
        const startTime = Date.now();

        // For Phase 1 and Phase 2: Use reviewed generation with retry + embeddings
        // For other phases: Direct generation without review
        let jsonData: unknown;
        let embeddings: number[][] | undefined;

        if (phase === 'phase1') {
            // Phase 1: Generator/Reviewer dialogue system
            console.log('📋 Using dialogue system for Phase 1...');
            const result = await generatePhase1WithDialogue(topic, difficulty);
            jsonData = result.questions;
            embeddings = result.embeddings;

        } else if (phase === 'phase2') {
            // Phase 2: Generator/Reviewer dialogue system
            console.log('📋 Using dialogue system for Phase 2...');
            const result = await generatePhase2WithDialogue(topic, difficulty);
            jsonData = result.set;
            embeddings = result.embeddings;

        } else if (phase === 'phase3') {
            // Phase 3: Generator/Reviewer dialogue system for menus
            console.log('📋 Using dialogue system for Phase 3...');
            const result = await generatePhase3WithDialogue(topic, difficulty);
            jsonData = result.menus;
            embeddings = result.embeddings;

        } else if (phase === 'phase4') {
            // Phase 4: Generator/Reviewer dialogue system for buzzer questions
            console.log('📋 Using dialogue system for Phase 4...');
            const result = await generatePhase4WithDialogue(topic, difficulty);
            jsonData = result.questions;
            embeddings = result.embeddings;

        } else if (phase === 'phase5') {
            // Phase 5: Generator/Reviewer dialogue system for memory sequence
            console.log('📋 Using dialogue system for Phase 5...');
            const result = await generatePhase5WithDialogue(topic, difficulty);
            jsonData = result.questions;
            embeddings = result.embeddings;

        } else {
            throw new Error(`Invalid phase: ${phase}`);
        }

        // Calculate approximate metrics (all phases now use dialogue system)
        const elapsedMs = Date.now() - startTime;
        // All phases now use dialogue system with multiple API calls
        const estimatedTokens = 15000;

        const estimatedCost = calculateCost(estimatedTokens * 0.3, estimatedTokens * 0.7);

        // Calculate question count based on phase
        const getQuestionsCount = () => {
            if (phase === 'phase1') return (jsonData as Phase1Question[]).length;
            if (phase === 'phase2') return (jsonData as Phase2Set).items.length;
            if (phase === 'phase3') return (jsonData as Phase3Menu[]).reduce((acc, m) => acc + m.questions.length, 0);
            if (phase === 'phase4') return (jsonData as Phase4Question[]).length;
            if (phase === 'phase5') return (jsonData as Phase5Question[]).length;
            return 0;
        };

        // Log structured metrics for observability
        const metrics = {
            phase,
            topic,
            difficulty,
            durationMs: elapsedMs,
            durationSec: (elapsedMs / 1000).toFixed(1),
            estimatedTokens,
            estimatedCost: formatCost(estimatedCost),
            questionsCount: getQuestionsCount(),
            embeddingsGenerated: embeddings?.length || 0,
            timestamp: new Date().toISOString(),
        };

        console.log('📊 Generation metrics:', JSON.stringify(metrics));
        console.log(`✅ Generated ${phase} content in ${(elapsedMs / 1000).toFixed(1)}s. Estimated cost: ${formatCost(estimatedCost)}`);

        return {
            data: jsonData,
            phase,
            topic, // Include the generated/used topic
            embeddings,
            usage: {
                totalTokens: estimatedTokens,
                thinkingTokens: 0,
                estimatedCost
            }
        };
    }
);
