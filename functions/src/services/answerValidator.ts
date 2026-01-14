/**
 * Answer Validation Service for Phase 3
 * Validates player answers against correct answers using:
 * 1. Fast path: Exact normalized match
 * 2. Alternative answers check
 * 3. LLM validation for fuzzy matching (typos, synonyms, etc.)
 */

import { ai, FACTCHECK_MODEL, MODEL_CONFIG } from '../config/genkit';
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
 * SEC-002: Sanitizes input to prevent LLM prompt injection attacks.
 * Removes newlines, control characters, and structural patterns.
 * Limits length to prevent token exhaustion.
 *
 * Note: Keyword removal is NOT done here because:
 * 1. isLikelyInjection() already rejects obvious injection attempts
 * 2. Removing keywords could corrupt legitimate answers containing common words
 */
function sanitizeLLMInput(input: string, maxLength = 500): string {
    if (!input) return '';

    return input
        .replace(/[\r\n]+/g, ' ')                      // Replace newlines with space
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1f\x7f]/g, '')               // Remove control characters
        .replace(/[<>{}[\]]/g, '')                     // Remove brackets that could confuse parsing
        .replace(/```/g, '')                           // Remove code block markers
        .substring(0, maxLength)                        // Limit length
        .trim();
}

/**
 * SEC-002: Detects if an answer looks like a prompt injection attempt.
 * Returns true if the answer appears to be trying to manipulate the LLM.
 */
function isLikelyInjection(answer: string): boolean {
    if (!answer) return false;

    const normalized = answer.toLowerCase().trim();

    // Patterns that look like instructions rather than answers
    // Note: Removed /^(oui|non|yes|no)$/i - these can be valid answers to quiz questions
    const injectionPatterns = [
        /^(valide|accepte|refuse|approve|reject)/i,
        /la (question|r[eé]ponse)/i,
        /(bonne|mauvaise) r[eé]ponse/i,
        /isCorrect/i,
        /confidence/i,
        /json/i,
        /\b(true|false)\b/i,  // Word boundaries to avoid matching "Trueblood", "falsehood", etc.
        /\{.*\}/,  // JSON-like pattern
        /^(correct|incorrect)$/i,
    ];

    return injectionPatterns.some(pattern => pattern.test(normalized));
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
 * Calculate Levenshtein distance between two strings.
 * Used for detecting typos.
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Fast path similarity check to avoid LLM calls for common variations.
 * Returns true if the answers are likely the same (typos, plurals, containment).
 */
function isFastPathSimilar(playerAnswer: string, correctAnswer: string): boolean {
    const normalizedPlayer = normalizeAnswer(playerAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);

    // Empty check
    if (!normalizedPlayer || !normalizedCorrect) return false;

    // One contains the other (e.g., "Paris" vs "ville Paris")
    if (normalizedPlayer.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedPlayer)) {
        return true;
    }

    // Check for small typos using Levenshtein distance
    // Allow 1 error per 4 characters, minimum 1
    const maxDistance = Math.max(1, Math.floor(normalizedCorrect.length / 4));
    const distance = levenshteinDistance(normalizedPlayer, normalizedCorrect);
    if (distance <= maxDistance) {
        return true;
    }

    // Check for plural variations (French: +s, +x, +aux)
    const pluralPatterns = [
        { player: normalizedPlayer + 's', correct: normalizedCorrect },
        { player: normalizedPlayer, correct: normalizedCorrect + 's' },
        { player: normalizedPlayer + 'x', correct: normalizedCorrect },
        { player: normalizedPlayer, correct: normalizedCorrect + 'x' },
    ];

    for (const pattern of pluralPatterns) {
        if (pattern.player === pattern.correct) return true;
    }

    return false;
}

/**
 * Validate answer using LLM for fuzzy matching
 * SEC-002: Applies input sanitization to prevent prompt injection
 */
async function validateWithLLM(
    playerAnswer: string,
    correctAnswer: string,
    acceptableAnswers?: string[]
): Promise<ValidationResult> {
    try {
        // SEC-002: Sanitize all inputs before passing to LLM
        const safePlayerAnswer = sanitizeLLMInput(playerAnswer);
        const safeCorrectAnswer = sanitizeLLMInput(correctAnswer);
        const safeAlternatives = (acceptableAnswers || [])
            .map(alt => sanitizeLLMInput(alt, 200))
            .filter(alt => alt.length > 0);

        const prompt = ANSWER_VALIDATION_PROMPT
            .replace('{PLAYER_ANSWER}', safePlayerAnswer)
            .replace('{CORRECT_ANSWER}', safeCorrectAnswer)
            .replace('{ALTERNATIVES}', JSON.stringify(safeAlternatives));

        const response = await ai.generate({
            model: FACTCHECK_MODEL, // gemini-2.0-flash: fastest & cheapest
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

    // SEC-002: Check for prompt injection attempts BEFORE any validation
    if (isLikelyInjection(sanitizedPlayer)) {
        console.warn('[AnswerValidator] Rejected likely injection attempt:', sanitizedPlayer);
        return {
            isCorrect: false,
            confidence: 100,
            matchType: 'rejected',
            explanation: 'Invalid answer format',
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

    // Fast path 3: Similar enough (typos, plurals, containment)
    if (isFastPathSimilar(sanitizedPlayer, sanitizedCorrect)) {
        return {
            isCorrect: true,
            confidence: 90,
            matchType: 'exact', // Mark as exact since it's a deterministic match
            explanation: 'Similar enough (fast path)',
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
