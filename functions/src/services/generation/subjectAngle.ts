/**
 * Subject + Angle generation utilities for deduplication system
 * Extracted from gameGenerator.ts for better modularity
 */

import { ai, REVIEWER_MODEL, FACTCHECK_MODEL, MODEL_CONFIG, isSearchAvailable } from '../../config/genkit';
import { googleSearch } from '../../tools/searchTool';
import {
    buildSubjectAnglePrompt,
    buildAmbiguityCheckPrompt,
    type AmbiguityCheckResult
} from '../../prompts';
import {
    hashCombo,
    checkComboExists,
    markComboUsed,
    type SubjectAngle,
    type SubjectType,
    ANGLES_BY_TYPE
} from '../subjectAngleService';
import { parseJsonFromText } from './jsonUtils';

/**
 * Generate a unique subject + angle combination for question generation.
 * This ensures that each question is on a unique topic+angle combo.
 *
 * @param category - Optional category filter (science, history, etc.)
 * @param maxAttempts - Maximum attempts to find a unique combo (default: 10)
 * @returns SubjectAngle object with unique subject, angle, category, and type
 */
export async function generateSubjectAngle(
    category?: string,
    maxAttempts: number = 10
): Promise<SubjectAngle> {
    console.log('🎯 Generating unique subject + angle combo...');

    const prompt = buildSubjectAnglePrompt(category);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Use REVIEWER_MODEL for stability (like topic generation)
            const response = await ai.generate({
                model: REVIEWER_MODEL,
                prompt,
                config: {
                    ...MODEL_CONFIG.topic,
                    temperature: 1.2 + (attempt * 0.05), // Slightly increase creativity with each attempt
                },
            });

            const rawResponse = response.text;

            // Parse JSON response
            let subjectAngle: SubjectAngle;
            try {
                subjectAngle = parseJsonFromText(rawResponse) as SubjectAngle;
            } catch {
                console.warn(`⚠️ Attempt ${attempt}: Failed to parse JSON response`);
                continue;
            }

            // Validate required fields
            if (!subjectAngle.subject || !subjectAngle.angle || !subjectAngle.type) {
                console.warn(`⚠️ Attempt ${attempt}: Missing required fields in response`);
                continue;
            }

            // Validate angle is valid for the type
            const validAngles = ANGLES_BY_TYPE[subjectAngle.type as SubjectType];
            if (!validAngles) {
                console.warn(`⚠️ Attempt ${attempt}: Invalid subject type "${subjectAngle.type}"`);
                continue;
            }

            // Check if this combo already exists
            const comboHash = hashCombo(subjectAngle.subject, subjectAngle.angle);
            const exists = await checkComboExists(comboHash);

            if (exists) {
                console.log(`🔄 Attempt ${attempt}: Combo "${subjectAngle.subject}|${subjectAngle.angle}" already used, retrying...`);
                continue;
            }

            console.log(`✨ Generated unique combo (attempt ${attempt}): "${subjectAngle.subject}" + "${subjectAngle.angle}"`);
            return subjectAngle;

        } catch (err) {
            console.warn(`⚠️ Attempt ${attempt} failed:`, err);
        }
    }

    // All attempts failed - throw error (caller should handle fallback)
    throw new Error(`Failed to generate unique subject+angle after ${maxAttempts} attempts`);
}

/**
 * Check a question for ambiguity issues.
 * Uses Google Search to verify that the question has exactly one correct answer.
 *
 * @param question - The question text
 * @param correctAnswer - The correct answer
 * @param wrongAnswers - Array of wrong answer options
 * @param anecdote - Optional anecdote/explanation
 * @returns AmbiguityCheckResult with issues and suggestions
 */
export async function checkAnswerAmbiguity(
    question: string,
    correctAnswer: string,
    wrongAnswers: string[],
    anecdote?: string
): Promise<AmbiguityCheckResult> {
    console.log('🔍 Checking answer ambiguity...');

    const prompt = buildAmbiguityCheckPrompt(question, correctAnswer, wrongAnswers, anecdote);

    try {
        // Use FACTCHECK_MODEL with Google Search for verification
        const response = await ai.generate({
            model: FACTCHECK_MODEL,
            prompt,
            config: {
                ...MODEL_CONFIG.factCheck,
                temperature: 0.1, // Very conservative for accuracy
            },
            tools: isSearchAvailable ? [googleSearch] : undefined,
        });

        const rawResponse = response.text;

        // Parse JSON response
        const result = parseJsonFromText(rawResponse) as AmbiguityCheckResult;

        // Ensure required fields have defaults
        const ambiguityResult: AmbiguityCheckResult = {
            hasIssues: result.hasIssues ?? false,
            ambiguityScore: result.ambiguityScore ?? 10,
            issues: result.issues ?? [],
            suggestions: result.suggestions ?? [],
            confidence: result.confidence ?? 100,
            reasoning: result.reasoning ?? 'No issues detected'
        };

        // Log results
        if (ambiguityResult.hasIssues) {
            console.log(`⚠️ Ambiguity detected (score: ${ambiguityResult.ambiguityScore}/10):`);
            ambiguityResult.issues.forEach(issue => {
                console.log(`   - [${issue.severity}] ${issue.type}: ${issue.description}`);
            });
        } else {
            console.log(`✅ No ambiguity detected (score: ${ambiguityResult.ambiguityScore}/10)`);
        }

        return ambiguityResult;

    } catch (err) {
        console.error('❌ Ambiguity check failed:', err);
        // Return safe default (assume no issues if check fails)
        return {
            hasIssues: false,
            ambiguityScore: 7,
            issues: [],
            suggestions: [],
            confidence: 50,
            reasoning: 'Ambiguity check failed, assuming no issues'
        };
    }
}

/**
 * Mark a subject+angle combo as used after successful question generation.
 * This should be called after a question passes all validation.
 *
 * @param subjectAngle - The subject+angle data
 * @param questionId - The ID of the generated question
 */
export async function markSubjectAngleUsed(
    subjectAngle: SubjectAngle,
    questionId: string
): Promise<void> {
    const comboHash = hashCombo(subjectAngle.subject, subjectAngle.angle);
    await markComboUsed(comboHash, subjectAngle, questionId);
}
