/**
 * Game Question Generation Flow
 *
 * Main Genkit flow for generating game questions across all phases.
 * This file orchestrates the generation process using extracted phase generators.
 */

import { ai } from '../config/genkit';
import { calculateCost, formatCost } from '../utils/costCalculator';

// Import types from generation module
import {
    Phase1Question,
    Phase2Set,
    Phase3Menu,
    Phase4Question,
    Phase5Question,
    SUPPORTED_LANGUAGES,
    GenerationLanguage,
    GameGenerationInputSchema,
    GameGenerationOutputSchema,
} from './generation/types';

// Import language type from prompts
import { type SupportedLanguage } from '../prompts';

// Import topic generation
import { generateCreativeTopic } from './generation/topicGenerator';

// Import phase generators from extracted modules
import { generatePhase1WithDialogue } from './generation/phase1Generator';
import { generatePhase2WithDialogue } from './generation/phase2Generator';
import { generatePhase3WithDialogue } from './generation/phase3Generator';
import { generatePhase4WithDialogue } from './generation/phase4Generator';
import { generatePhase5WithDialogue } from './generation/phase5Generator';

// Import subject+angle utilities for deduplication system
import {
    generateSubjectAngle,
    checkAnswerAmbiguity,
    markSubjectAngleUsed,
} from './generation/subjectAngle';

// Re-export schemas for external use
export { GameGenerationInputSchema, GameGenerationOutputSchema, type GenerationLanguage } from './generation/types';

// Re-export subject+angle functions for future integration
export { generateSubjectAngle, checkAnswerAmbiguity, markSubjectAngleUsed };

// ============================================================================
// GENKIT FLOW
// ============================================================================

export const generateGameQuestionsFlow = ai.defineFlow(
    {
        name: 'generateGameQuestions',
        inputSchema: GameGenerationInputSchema,
        outputSchema: GameGenerationOutputSchema,
    },
    async (input) => {
        const { phase, difficulty, language = 'fr', completeCount, existingQuestions } = input;

        // Cast language to SupportedLanguage (validated below)
        const lang = language as SupportedLanguage;

        // Check if we're in completion mode
        const isCompletionMode = completeCount !== undefined && completeCount > 0;
        if (isCompletionMode) {
            console.log(`🔧 COMPLETION MODE: Generating ${completeCount} additional questions for ${phase}`);
            console.log(`   Existing questions count: ${existingQuestions?.length || 0}`);
        }

        // Validate language is supported
        if (!SUPPORTED_LANGUAGES.includes(language as GenerationLanguage)) {
            throw new Error(`Language '${language}' is not yet supported. Available languages: ${SUPPORTED_LANGUAGES.join(', ')}`);
        }

        // Generate creative topic with AI if none provided or default
        // Phase 2 uses a specific prompt for topics that work well with homophones
        const topic = (!input.topic || input.topic === 'General Knowledge')
            ? await generateCreativeTopic(phase, difficulty, lang)
            : input.topic;

        console.log(`🎲 Generating ${phase} content on topic: "${topic}" (${difficulty}, lang: ${language})`);

        // Track start time for metrics
        const startTime = Date.now();

        // Route to appropriate phase generator
        let jsonData: unknown;
        let embeddings: number[][] | undefined;

        if (phase === 'phase1') {
            // Phase 1: Generator/Reviewer dialogue system
            console.log('📋 Using dialogue system for Phase 1...');
            const result = await generatePhase1WithDialogue(
                topic,
                difficulty,
                lang,
                isCompletionMode ? completeCount : undefined,
                isCompletionMode ? existingQuestions as Phase1Question[] : undefined
            );
            jsonData = result.questions;
            embeddings = result.embeddings;

        } else if (phase === 'phase2') {
            // Phase 2: Generator/Reviewer dialogue system
            console.log('📋 Using dialogue system for Phase 2...');
            const result = await generatePhase2WithDialogue(
                topic,
                difficulty,
                lang,
                isCompletionMode ? completeCount : undefined,
                isCompletionMode ? existingQuestions : undefined
            );
            jsonData = result.set;
            embeddings = result.embeddings;

        } else if (phase === 'phase3') {
            // Phase 3: Generator/Reviewer dialogue system for menus
            console.log('📋 Using dialogue system for Phase 3...');
            const result = await generatePhase3WithDialogue(topic, difficulty, lang);
            jsonData = result.menus;
            embeddings = result.embeddings;

        } else if (phase === 'phase4') {
            // Phase 4: Generator/Reviewer dialogue system for buzzer questions
            console.log('📋 Using dialogue system for Phase 4...');
            const result = await generatePhase4WithDialogue(
                topic,
                difficulty,
                lang,
                isCompletionMode ? completeCount : undefined,
                isCompletionMode ? existingQuestions as Phase4Question[] : undefined
            );
            jsonData = result.questions;
            embeddings = result.embeddings;

        } else if (phase === 'phase5') {
            // Phase 5: Generator/Reviewer dialogue system for memory sequence
            console.log('📋 Using dialogue system for Phase 5...');
            const result = await generatePhase5WithDialogue(topic, difficulty, lang);
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
            language, // Include the language used
            embeddings,
            usage: {
                totalTokens: estimatedTokens,
                thinkingTokens: 0,
                estimatedCost
            }
        };
    }
);
