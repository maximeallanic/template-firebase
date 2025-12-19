/**
 * Answer Validation Service for Phase 3
 * Validates player answers against correct answers using:
 * 1. Fast path: Exact normalized match
 * 2. Alternative answers check
 * 3. LLM validation for fuzzy matching (typos, synonyms, etc.)
 */

import { ai, REVIEWER_MODEL, MODEL_CONFIG } from '../config/genkit';
import { ANSWER_VALIDATION_PROMPT } from '../prompts/fr/phase3';

export interface ValidationResult {
    isCorrect: boolean;
    confidence: number; // 0-100
    explanation?: string;
    matchType: 'exact' | 'alternative' | 'llm' | 'rejected';
}

/**
 * Normalizes an answer for comparison.
 * More aggressive than normalizeText - removes accents, punctuation, articles.
 */
export function normalizeAnswer(answer: string): string {
    if (!answer) return '';

    return answer
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
        .replace(/\b(le|la|les|l|un|une|des|du|de|d)\b/g, '') // Remove French articles
        .replace(/\b(the|a|an)\b/g, '') // Remove English articles
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
}

/**
 * Quick check for exact match (normalized)
 */
function isExactMatch(playerAnswer: string, correctAnswer: string): boolean {
    return normalizeAnswer(playerAnswer) === normalizeAnswer(correctAnswer);
}

/**
 * Check against alternative answers
 */
function matchesAlternative(playerAnswer: string, acceptableAnswers?: string[]): boolean {
    if (!acceptableAnswers || acceptableAnswers.length === 0) return false;

    const normalizedPlayer = normalizeAnswer(playerAnswer);
    return acceptableAnswers.some(alt => normalizeAnswer(alt) === normalizedPlayer);
}

/**
 * Validate answer using LLM for fuzzy matching
 */
async function validateWithLLM(
    playerAnswer: string,
    correctAnswer: string,
    acceptableAnswers?: string[]
): Promise<ValidationResult> {
    try {
        const prompt = ANSWER_VALIDATION_PROMPT
            .replace('{PLAYER_ANSWER}', playerAnswer)
            .replace('{CORRECT_ANSWER}', correctAnswer)
            .replace('{ALTERNATIVES}', JSON.stringify(acceptableAnswers || []));

        const response = await ai.generate({
            model: REVIEWER_MODEL,
            config: MODEL_CONFIG.factCheck,
            prompt,
        });

        const text = response.text?.trim() || '';

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('[AnswerValidator] Failed to parse LLM response:', text);
            return {
                isCorrect: false,
                confidence: 0,
                matchType: 'rejected',
                explanation: 'Failed to parse LLM response',
            };
        }

        const result = JSON.parse(jsonMatch[0]);

        return {
            isCorrect: result.isCorrect === true,
            confidence: Math.min(100, Math.max(0, result.confidence || 0)),
            matchType: 'llm',
            explanation: result.explanation || undefined,
        };
    } catch (error) {
        console.error('[AnswerValidator] LLM validation error:', error);
        return {
            isCorrect: false,
            confidence: 0,
            matchType: 'rejected',
            explanation: 'LLM validation error',
        };
    }
}

/**
 * Main validation function
 * Validates a player's answer against the correct answer.
 *
 * @param playerAnswer - The answer submitted by the player
 * @param correctAnswer - The expected correct answer
 * @param acceptableAnswers - Optional array of alternative correct answers
 * @returns ValidationResult with isCorrect, confidence, and match type
 */
export async function validateAnswer(
    playerAnswer: string,
    correctAnswer: string,
    acceptableAnswers?: string[]
): Promise<ValidationResult> {
    // Sanitize inputs
    const sanitizedPlayer = (playerAnswer || '').trim();
    const sanitizedCorrect = (correctAnswer || '').trim();

    // Empty answer is always wrong
    if (!sanitizedPlayer) {
        return {
            isCorrect: false,
            confidence: 100,
            matchType: 'rejected',
            explanation: 'Empty answer',
        };
    }

    // Fast path 1: Exact match
    if (isExactMatch(sanitizedPlayer, sanitizedCorrect)) {
        return {
            isCorrect: true,
            confidence: 100,
            matchType: 'exact',
        };
    }

    // Fast path 2: Alternative match
    if (matchesAlternative(sanitizedPlayer, acceptableAnswers)) {
        return {
            isCorrect: true,
            confidence: 100,
            matchType: 'alternative',
        };
    }

    // Check if answers are very different in length (likely wrong)
    const normalizedPlayer = normalizeAnswer(sanitizedPlayer);
    const normalizedCorrect = normalizeAnswer(sanitizedCorrect);

    // If normalized answers are very different lengths, reject without LLM
    const lengthRatio = Math.min(normalizedPlayer.length, normalizedCorrect.length) /
        Math.max(normalizedPlayer.length, normalizedCorrect.length);

    if (lengthRatio < 0.3 && normalizedPlayer.length > 3 && normalizedCorrect.length > 3) {
        return {
            isCorrect: false,
            confidence: 80,
            matchType: 'rejected',
            explanation: 'Answer length too different',
        };
    }

    // Use LLM for fuzzy matching
    return validateWithLLM(sanitizedPlayer, sanitizedCorrect, acceptableAnswers);
}

/**
 * Batch validation for multiple answers (for efficiency)
 */
export async function validateAnswerBatch(
    answers: Array<{
        playerAnswer: string;
        correctAnswer: string;
        acceptableAnswers?: string[];
    }>
): Promise<ValidationResult[]> {
    // Process in parallel with a limit
    const BATCH_SIZE = 5;
    const results: ValidationResult[] = [];

    for (let i = 0; i < answers.length; i += BATCH_SIZE) {
        const batch = answers.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(a => validateAnswer(a.playerAnswer, a.correctAnswer, a.acceptableAnswers))
        );
        results.push(...batchResults);
    }

    return results;
}
