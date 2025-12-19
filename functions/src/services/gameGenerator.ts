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
    findSemanticDuplicates,
    findInternalDuplicates,
    generateEmbeddings,
    storeQuestionsWithEmbeddings,
    type SemanticDuplicate
} from '../utils/embeddingService';

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

// --- PHASE 4 DIALOGUE TYPES ---

interface Phase4Question {
    question: string;
    answer: string;
}

interface Phase4DialogueReview {
    approved: boolean;
    scores: {
        speed_friendly: number;
        trap_quality: number;
        thematic_variety: number;
        factual_accuracy: number;
        answer_length: number;
        burger_style: number;
    };
    overall_score: number;
    trap_count: number;
    questions_feedback: Array<{
        index: number;
        question: string;
        answer: string;
        ok: boolean;
        is_trap: boolean;
        issues: string[];
        word_count: number;
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
 * Call Gemini 3 Pro for GENERATION tasks (with search tools)
 * Uses ai.chat() to properly handle thought_signature for Gemini 3 Pro with tools
 * @param prompt - The prompt to send to the model
 * @param configType - 'creative' for high temperature, 'factual' for lower temperature
 */
async function callGemini(prompt: string, configType: 'creative' | 'factual' = 'creative'): Promise<string> {
    const config = MODEL_CONFIG[configType];

    console.log(`🔧 Generator: gemini-3-pro-preview, config: ${configType}, tools: ${isSearchAvailable ? 'webSearch' : 'none'}`);

    if (isSearchAvailable) {
        // Use ai.chat() which properly handles thought signatures for Gemini 3 Pro with tools
        const chat = ai.chat({
            model: GENERATOR_MODEL,
            config,
            tools: [googleSearch],
        });
        const response = await chat.send(prompt);
        return response.text;
    } else {
        const response = await ai.generate({
            model: GENERATOR_MODEL,
            prompt,
            config,
        });
        return response.text;
    }
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
 */
function findBalancedJson(text: string): string | null {
    const startChars = ['{', '['];
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

    // Check items in parallel (batches of 4 to avoid rate limits)
    const batchSize = 4;
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
    maxIterations: number = 5
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
        // CRITICAL: Phonetic score must be >= 7, otherwise homophone is too weak
        if (review.scores.phonetic < 7) {
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
            const obviousItems = (review.items_feedback as Array<{ index: number; text: string; is_too_obvious?: boolean }>)
                .filter(item => item.is_too_obvious)
                .map(item => `- "${item.text}"`)
                .join('\n');

            previousFeedback = `
⚠️ ITEMS TROP ÉVIDENTS (score pièges: ${trapQualityScore}/10)

Le set est ENNUYEUX car les réponses sont trop prévisibles.

Items trop évidents à remplacer :
${obviousItems || '(la plupart des items)'}

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
            const factCheckResult = await factCheckPhase2Items(lastSet);

            if (factCheckResult.failed.length > 0) {
                console.log(`⚠️ Fact-check rejected ${factCheckResult.failed.length}/${lastSet.items.length} items`);

                // If more than 3 items failed, regenerate the set
                if (factCheckResult.failed.length > 3) {
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
            const itemsAsQuestions = lastSet.items.map(item => ({ text: item.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];

            try {
                semanticDuplicates = await findSemanticDuplicates(itemsAsQuestions, 'phase2');
                const embeddings = await generateEmbeddings(lastSet.items.map(item => item.text));
                internalDuplicates = findInternalDuplicates(embeddings, itemsAsQuestions);
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

            // Generate final embeddings for storage
            const finalEmbeddings = await generateEmbeddings(lastSet.items.map(item => item.text));

            // Store questions with embeddings for future deduplication
            await storeQuestionsWithEmbeddings(
                lastSet.items.map(item => ({ text: item.text })),
                finalEmbeddings,
                'phase2'
            );

            return { set: lastSet, embeddings: finalEmbeddings };
        }

        // 4. Decide: targeted item regeneration or full regeneration?
        // If homophone is good (>= 7) and b_concrete is good (>= 6), we can do targeted regeneration
        const canDoTargetedRegen = review.scores.phonetic >= 7 && bConcreteScore >= 6;

        // Find problematic items
        const badItemIndices = review.items_feedback
            .filter(item => !item.ok || (item as { is_too_obvious?: boolean }).is_too_obvious)
            .map(item => item.index);

        const goodItems = proposal.items.filter((_, idx) => !badItemIndices.includes(idx));
        const badItems = proposal.items.filter((_, idx) => badItemIndices.includes(idx));

        // If homophone is good and we have some bad items, do TARGETED regeneration
        if (canDoTargetedRegen && badItemIndices.length > 0 && badItemIndices.length <= 6) {
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
        const finalEmbeddings = await generateEmbeddings(fallbackSet.items.map(item => item.text));

        // Store questions with embeddings for future deduplication (even fallback)
        await storeQuestionsWithEmbeddings(
            fallbackSet.items.map(item => ({ text: item.text })),
            finalEmbeddings,
            'phase2'
        );

        return { set: fallbackSet, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen, but just in case
    throw new Error('Failed to generate Phase 2 set after all iterations');
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
            proposal = parseJsonFromText(proposalText) as Phase1GeneratorQuestion[];
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

            const problematicQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'factual_error')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

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

            const ambiguousQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'ambiguous')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

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

                // If more than 2 questions failed fact-check, regenerate
                if (factCheckResult.failed.length > 2) {
                    const failedFeedback = factCheckResult.failed
                        .map(f => `- "${f.question.text.slice(0, 50)}...": ${f.reason}`)
                        .join('\n');

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
            const questionsAsItems = lastQuestions.map(q => ({ text: q.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];

            try {
                semanticDuplicates = await findSemanticDuplicates(questionsAsItems, 'phase1');
                const embeddings = await generateEmbeddings(lastQuestions.map(q => q.text));
                internalDuplicates = findInternalDuplicates(embeddings, questionsAsItems);
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

                // Filter out duplicates
                lastQuestions = lastQuestions.filter((_, idx) => !duplicateIndices.has(idx));

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

            // Generate final embeddings
            const finalEmbeddings = await generateEmbeddings(lastQuestions.map(q => q.text));

            // Store questions with embeddings for future deduplication
            await storeQuestionsWithEmbeddings(
                lastQuestions.map(q => ({ text: q.text })),
                finalEmbeddings,
                'phase1'
            );

            return { questions: lastQuestions, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration if only a few questions are bad
        const badQuestionIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        // If only 1-4 questions are bad and overall score is decent, do targeted regeneration
        if (badQuestionIndices.length > 0 && badQuestionIndices.length <= 4 && review.overall_score >= 5) {
            console.log(`🔧 Targeted regeneration: replacing ${badQuestionIndices.length} questions`);

            const goodQuestions = lastQuestions.filter((_, idx) => !badQuestionIndices.includes(idx));
            const badQuestionsData = lastQuestions.filter((_, idx) => badQuestionIndices.includes(idx));

            const goodQuestionsText = goodQuestions.map((q, idx) =>
                `${idx + 1}. "${q.text}" → ${q.options[q.correctIndex]}`
            ).join('\n');

            const badQuestionsText = badQuestionsData.map((q, idx) =>
                `${idx + 1}. "${q.text}" (REJETÉ)`
            ).join('\n');

            const rejectionReasons = review.questions_feedback
                .filter(q => !q.ok)
                .map(q => `- Q${q.index + 1}: ${q.issue} (${q.issue_type})`)
                .join('\n');

            const targetedPrompt = PHASE1_TARGETED_REGENERATION_PROMPT
                .replace('{TOPIC}', topic)
                .replace('{DIFFICULTY}', difficulty)
                .replace('{GOOD_QUESTIONS}', goodQuestionsText)
                .replace('{BAD_INDICES}', badQuestionIndices.map(i => i + 1).join(', '))
                .replace('{BAD_QUESTIONS}', badQuestionsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                .replace(/{COUNT}/g, String(badQuestionIndices.length));

            try {
                const regenText = await callGemini(targetedPrompt, 'factual'); // Use factual config for Phase 1
                const newQuestions = parseJsonFromText(regenText) as Phase1GeneratorQuestion[];

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

                lastQuestions = mergedQuestions.slice(0, 10); // Ensure max 10 questions
                console.log(`✅ Targeted regen: merged ${goodQuestions.length} good + ${newQuestions.length} new questions`);

                // Continue to next iteration to re-validate
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

Questions gardées : ${goodQuestions.length}
Nouvelles questions : ${newQuestions.length}

Le reviewer va maintenant re-valider le set complet.
`;
                continue;
            } catch (err) {
                console.warn('⚠️ Targeted regeneration failed, falling back to full regen:', err);
            }
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
        const finalEmbeddings = await generateEmbeddings(fallbackQuestions.map(q => q.text));

        // Store questions with embeddings for future deduplication (even fallback)
        await storeQuestionsWithEmbeddings(
            fallbackQuestions.map(q => ({ text: q.text })),
            finalEmbeddings,
            'phase1'
        );

        return { questions: fallbackQuestions, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen
    throw new Error('Failed to generate Phase 1 questions after all iterations');
}

/**
 * Generate Phase 3 menus using dialogue between Generator and Reviewer agents
 * Creates 3 themed menus with 5 questions each
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
            proposal = parseJsonFromText(proposalText) as Phase3Menu[];
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📋 Generated ${proposal.length} menus`);
        for (const menu of proposal) {
            console.log(`   - "${menu.title}": ${menu.questions.length} questions`);
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

            // Generate embeddings
            const allQuestions = lastMenus.flatMap(m => m.questions.map(q => q.question));
            const finalEmbeddings = await generateEmbeddings(allQuestions);

            // Store for deduplication
            await storeQuestionsWithEmbeddings(
                allQuestions.map(q => ({ text: q })),
                finalEmbeddings,
                'phase3'
            );

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

        if (badQuestions.length > 0 && badQuestions.length <= 6 && review.overall_score >= 5) {
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
    const fallbackMenus = bestMenus.length > 0 ? bestMenus : lastMenus;
    if (fallbackMenus.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best menus (score: ${bestScore}/10).`);
        const allQuestions = fallbackMenus.flatMap(m => m.questions.map(q => q.question));
        const finalEmbeddings = await generateEmbeddings(allQuestions);

        await storeQuestionsWithEmbeddings(
            allQuestions.map(q => ({ text: q })),
            finalEmbeddings,
            'phase3'
        );

        return { menus: fallbackMenus, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 3 menus after all iterations');
}

/**
 * Generate Phase 4 buzzer questions using dialogue between Generator and Reviewer agents
 * Creates 15 fast questions with traps
 */
async function generatePhase4WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 4
): Promise<{ questions: Phase4Question[]; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 4...');

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

        console.log('🤖 Generator creating buzzer questions...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase4Question[];

        try {
            proposal = parseJsonFromText(proposalText) as Phase4Question[];
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📝 Generated ${proposal.length} questions`);
        lastQuestions = proposal;

        // 2. Reviewer evaluates the questions
        const reviewerPrompt = PHASE4_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating questions...');
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
        console.log(`📊 Scores: speed=${review.scores.speed_friendly}, traps=${review.scores.trap_quality}, variety=${review.scores.thematic_variety}`);
        console.log(`          factual=${review.scores.factual_accuracy}, answers=${review.scores.answer_length}, style=${review.scores.burger_style}`);
        console.log(`   Trap count: ${review.trap_count}/15, Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        if (review.scores.speed_friendly < 6) {
            console.log(`❌ Questions too long (speed score: ${review.scores.speed_friendly}/10).`);

            const longQuestions = review.questions_feedback
                .filter(q => q.word_count > 15)
                .map(q => `- Q${q.index + 1} (${q.word_count} mots): "${q.question.slice(0, 50)}..."`)
                .join('\n');

            previousFeedback = `
⚠️ QUESTIONS TROP LONGUES (score vitesse: ${review.scores.speed_friendly}/10)

Questions à raccourcir (max 15 mots) :
${longQuestions || '(Toutes les questions)'}

RAPPEL : Phase buzzer = RAPIDITÉ. Questions COURTES et DIRECTES.
`;
            continue;
        }

        if (review.trap_count < 4) {
            console.log(`❌ Not enough traps (${review.trap_count}/15, need at least 5).`);

            previousFeedback = `
⚠️ PAS ASSEZ DE PIÈGES (${review.trap_count}/15, minimum 5)

Les questions sont trop évidentes. Ajoute des PIÈGES de formulation :
- Réponse dans la question ("prénom du Père Noël" → "Père")
- Évidence trompeuse ("couleur des M&M's bleus" → "Bleus")
- Piège logique ("mois avec 28 jours" → "12")

Au moins 5-6 questions sur 15 doivent être des pièges.
`;
            continue;
        }

        if (review.scores.factual_accuracy < 7) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10).`);

            const wrongQuestions = review.questions_feedback
                .filter(q => q.issues.includes('reponse_incorrecte'))
                .map(q => `- Q${q.index + 1}: "${q.question}" → ${q.correction || '?'}`)
                .join('\n');

            previousFeedback = `
⚠️ ERREURS FACTUELLES (score: ${review.scores.factual_accuracy}/10)

Questions incorrectes :
${wrongQuestions || '(Vérifier toutes les réponses)'}

CRITIQUE : Utilise Google Search pour vérifier CHAQUE réponse.
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
            console.log(`✅ Questions validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // Fact-check
            const factCheckResult = await factCheckSimpleQuestions(lastQuestions);
            if (factCheckResult.failed.length > 0) {
                console.warn(`⚠️ ${factCheckResult.failed.length}/${lastQuestions.length} questions failed fact-check`);

                if (factCheckResult.failed.length > 3) {
                    previousFeedback = `
⚠️ VÉRIFICATION FACTUELLE ÉCHOUÉE

${factCheckResult.failed.length} questions incorrectes. Régénère avec des FAITS VÉRIFIABLES.
`;
                    continue;
                }
                lastQuestions = factCheckResult.passed;
            }

            // Generate embeddings
            const finalEmbeddings = await generateEmbeddings(lastQuestions.map(q => q.question));

            await storeQuestionsWithEmbeddings(
                lastQuestions.map(q => ({ text: q.question })),
                finalEmbeddings,
                'phase4'
            );

            return { questions: lastQuestions, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration
        const badIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        if (badIndices.length > 0 && badIndices.length <= 5 && review.overall_score >= 5) {
            console.log(`🔧 Targeted regeneration: replacing ${badIndices.length} questions`);

            const goodQuestions = lastQuestions.filter((_, idx) => !badIndices.includes(idx));
            const badQuestionsText = badIndices.map(idx =>
                `- Q${idx + 1}: "${lastQuestions[idx].question}" (${review.questions_feedback[idx]?.issues?.join(', ') || 'problème'})`
            ).join('\n');

            const rejectionReasons = badIndices.map(idx =>
                review.questions_feedback.find(q => q.index === idx)?.issues?.join(', ') || ''
            ).join('; ');

            const targetedPrompt = PHASE4_TARGETED_REGENERATION_PROMPT
                .replace('{GOOD_QUESTIONS}', JSON.stringify(goodQuestions, null, 2))
                .replace('{BAD_INDICES}', badIndices.map(i => i + 1).join(', '))
                .replace('{BAD_QUESTIONS}', badQuestionsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                .replace(/{COUNT}/g, String(badIndices.length));

            try {
                const regenText = await callGemini(targetedPrompt, 'creative');
                const newQuestions = parseJsonFromText(regenText) as Phase4Question[];

                lastQuestions = [...goodQuestions, ...newQuestions].slice(0, 15);
                console.log(`✅ Merged ${goodQuestions.length} good + ${newQuestions.length} new questions`);

                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${newQuestions.length} nouvelles questions ajoutées.
Le reviewer va maintenant re-valider.
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
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating...`);
    }

    // Fallback
    const fallbackQuestions = bestQuestions.length > 0 ? bestQuestions : lastQuestions;
    if (fallbackQuestions.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best questions (score: ${bestScore}/10).`);
        const finalEmbeddings = await generateEmbeddings(fallbackQuestions.map(q => q.question));

        await storeQuestionsWithEmbeddings(
            fallbackQuestions.map(q => ({ text: q.question })),
            finalEmbeddings,
            'phase4'
        );

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
            proposal = parseJsonFromText(proposalText) as Phase5Question[];
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
                .filter(q => !q.ok && q.issues.includes('reponse_incorrecte'))
                .map(q => `- Q${q.index + 1}: "${q.question}" → ${q.correction || '?'}`)
                .join('\n');

            previousFeedback = `
⚠️ ERREURS FACTUELLES (score: ${review.scores.factual_accuracy}/10)

Questions incorrectes :
${wrongQuestions || '(Vérifier toutes les réponses)'}

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

                if (factCheckResult.failed.length > 2) {
                    previousFeedback = `
⚠️ VÉRIFICATION FACTUELLE ÉCHOUÉE

${factCheckResult.failed.length} questions incorrectes. Régénère avec des FAITS VÉRIFIABLES.
`;
                    continue;
                }
                lastQuestions = factCheckResult.passed;
            }

            // Generate embeddings
            const finalEmbeddings = await generateEmbeddings(lastQuestions.map(q => q.question));

            await storeQuestionsWithEmbeddings(
                lastQuestions.map(q => ({ text: q.question })),
                finalEmbeddings,
                'phase5'
            );

            return { questions: lastQuestions, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration
        const badIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        if (badIndices.length > 0 && badIndices.length <= 4 && review.overall_score >= 5) {
            console.log(`🔧 Targeted regeneration: replacing ${badIndices.length} questions`);

            // Prepare callback context
            const callbackContext = review.identified_callbacks.map(cb =>
                `Q${cb.question_index + 1} référence Q${cb.references_question + 1}: ${cb.description}`
            ).join('\n');

            const currentSequence = lastQuestions.map((q, idx) =>
                `${idx + 1}. "${q.question}" → "${q.answer}"`
            ).join('\n');

            const badQuestionsText = badIndices.map(idx =>
                `- Q${idx + 1}: "${lastQuestions[idx].question}" (${review.questions_feedback[idx]?.issues?.join(', ') || 'problème'})`
            ).join('\n');

            const targetedPrompt = PHASE5_TARGETED_REGENERATION_PROMPT
                .replace('{CURRENT_SEQUENCE}', currentSequence)
                .replace('{BAD_INDICES}', badIndices.map(i => i + 1).join(', '))
                .replace('{BAD_QUESTIONS}', badQuestionsText)
                .replace('{REJECTION_REASONS}', review.questions_feedback
                    .filter(q => badIndices.includes(q.index))
                    .map(q => q.issues.join(', '))
                    .join('; '))
                .replace('{CALLBACK_CONTEXT}', callbackContext || 'Aucun callback identifié')
                .replace(/{COUNT}/g, String(badIndices.length));

            try {
                const regenText = await callGemini(targetedPrompt, 'creative');
                interface ReplacementItem {
                    replaces_index: number;
                    new_question: string;
                    new_answer: string;
                }
                const newQuestions = parseJsonFromText(regenText) as ReplacementItem[];

                // Apply replacements
                for (const repl of newQuestions) {
                    if (lastQuestions[repl.replaces_index]) {
                        lastQuestions[repl.replaces_index] = {
                            question: repl.new_question,
                            answer: repl.new_answer
                        };
                    }
                }

                console.log(`✅ Applied ${newQuestions.length} replacements`);

                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${newQuestions.length} questions remplacées.
Le reviewer va maintenant re-valider la séquence.
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
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating...`);
    }

    // Fallback
    const fallbackQuestions = bestQuestions.length > 0 ? bestQuestions : lastQuestions;
    if (fallbackQuestions.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best sequence (score: ${bestScore}/10).`);
        const finalEmbeddings = await generateEmbeddings(fallbackQuestions.map(q => q.question));

        await storeQuestionsWithEmbeddings(
            fallbackQuestions.map(q => ({ text: q.question })),
            finalEmbeddings,
            'phase5'
        );

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
