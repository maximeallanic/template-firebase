/**
 * Types for game question generation
 * Extracted from gameGenerator.ts for better modularity
 */

import { z } from 'zod';

// --- CONSTANTS ---

/** Maximum percentage of questions that can be regenerated using targeted regen (60%) */
export const TARGETED_REGEN_MAX_PERCENTAGE = 0.6;

/** Minimum confidence threshold for fact-check (85%) */
export const FACT_CHECK_CONFIDENCE_THRESHOLD = 85;

// --- PHASE 1 TYPES ---

export interface Phase1Question {
    text: string;
    options: string[];
    correctIndex: number;
    anecdote?: string;
}

export interface Phase1GeneratorQuestion {
    text: string;
    options: string[];
    correctIndex: number;
    anecdote: string;
    verification?: string; // Optional - how the fact was verified
}

export interface Phase1DialogueReview {
    approved: boolean;
    scores: {
        factual_accuracy: number;
        humor: number;
        clarity: number;
        variety: number;
        options_quality: number;
    };
    overall_score: number;
    questions_feedback: Array<{
        index: number;
        text: string;
        ok: boolean;
        funny?: boolean;
        issue: string;
        issue_type: 'factual_error' | 'not_funny' | 'too_long' | 'ambiguous' | 'duplicate_options' | null;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- PHASE 2 TYPES ---

export interface Phase2Set {
    optionA: string;
    optionB: string;
    optionADescription?: string;  // Description pour différencier les homonymes
    optionBDescription?: string;  // Description pour différencier les homonymes
    humorousDescription?: string; // Description humoristique des options (générée par IA)
    items: Array<{
        text: string;
        answer: 'A' | 'B' | 'Both';
        acceptedAnswers?: ('A' | 'B' | 'Both')[];  // Réponses alternatives valides
        justification?: string;
    }>;
}

export interface Phase2GeneratorResponse {
    optionA: string;
    optionB: string;
    optionADescription?: string;  // Description pour différencier les homonymes
    optionBDescription?: string;  // Description pour différencier les homonymes
    humorousDescription?: string; // Description humoristique des options (générée par IA)
    reasoning: string;
    items: Array<{
        text: string;
        answer: 'A' | 'B' | 'Both';
        acceptedAnswers?: ('A' | 'B' | 'Both')[];  // Réponses alternatives valides
        justification: string;
    }>;
}

export interface Phase2DialogueReview {
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

export interface Phase2FactCheckBatchResult {
    results: Array<{
        index: number;
        text: string;
        assignedCategory: string;
        isCorrect: boolean;
        confidence: number;
        shouldBe: 'A' | 'B' | 'Both';
        reasoning: string;
    }>;
    summary: {
        total: number;
        correct: number;
        incorrect: number;
    };
}

// --- PHASE 3 TYPES ---

export interface Phase3Menu {
    title: string;
    description: string;
    isTrap?: boolean;
    questions: Array<{ question: string; answer: string }>;
}

export interface Phase3DialogueReview {
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

// --- PHASE 4 TYPES ---

export interface Phase4Question {
    text: string;           // Question text (same field name as Phase1 for consistency)
    options: string[];      // 4 options MCQ
    correctIndex: number;   // Index de la bonne réponse (0-3)
    anecdote?: string;      // Fait amusant optionnel
}

export interface Phase4DialogueReview {
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

// --- PHASE 5 TYPES ---

export interface Phase5Question {
    question: string;
    answer: string;
}

export interface Phase5DialogueReview {
    approved: boolean;
    scores: {
        humor: number;
        diversity: number;
        factual_accuracy: number;
        memorability: number;
        length: number;
        accessibility: number;
    };
    overall_score: number;
    duplicate_concepts?: string[];
    questions_feedback: Array<{
        index: number;
        question: string;
        answer: string;
        ok: boolean;
        funny: boolean;
        issues: string[];
        correction?: string;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- FACT-CHECK TYPES ---

export interface FactCheckResult {
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

export interface FactCheckBatchResponse {
    results: FactCheckResult[];
    summary: {
        total: number;
        correct: number;
        incorrect: number;
        ambiguous: number;
        synonymIssues?: number; // Count of questions with synonym issues
    };
}

// --- SCHEMAS ---

/** Supported languages for question generation */
export type GenerationLanguage = 'fr' | 'en';
export const SUPPORTED_LANGUAGES: GenerationLanguage[] = ['fr']; // Only FR is implemented for now

export const GameGenerationInputSchema = z.object({
    phase: z.enum(['phase1', 'phase2', 'phase3', 'phase4', 'phase5']),
    topic: z.string().optional().default('General Knowledge'),
    difficulty: z.enum(['easy', 'normal', 'hard', 'wtf']).optional().default('normal'),
    language: z.enum(['fr', 'en']).optional().default('fr'),
    // Completion mode: generate only missing questions
    completeCount: z.number().int().min(1).max(20).optional(),
    existingQuestions: z.array(z.unknown()).optional(),
});

export const GameGenerationOutputSchema = z.object({
    data: z.any(), // Flexible output based on phase
    phase: z.string(),
    topic: z.string(), // The topic used for generation (may be AI-generated)
    language: z.string(), // The language used for generation
    embeddings: z.array(z.array(z.number())).optional(), // Embeddings for deduplication
    usage: z.object({
        totalTokens: z.number(),
        thinkingTokens: z.number(),
        estimatedCost: z.number(),
    }),
});

export type GameGenerationInput = z.infer<typeof GameGenerationInputSchema>;
export type GameGenerationOutput = z.infer<typeof GameGenerationOutputSchema>;
