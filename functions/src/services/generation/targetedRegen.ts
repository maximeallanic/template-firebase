/**
 * Targeted regeneration system for game questions
 * Intelligent partial regeneration to avoid full regeneration when only a few questions fail
 */

import {
    PHASE1_TARGETED_REGENERATION_PROMPT,
    PHASE4_TARGETED_REGENERATION_PROMPT,
    PHASE5_TARGETED_REGENERATION_PROMPT,
    getFullDifficultyContext,
    type DifficultyLevel
} from '../../prompts';
import { callGemini } from './geminiBridge';
import { parseJsonArrayFromText } from './jsonUtils';
import {
    Phase1Question,
    Phase1GeneratorQuestion,
    Phase4Question,
    Phase5Question,
    TARGETED_REGEN_MAX_PERCENTAGE,
} from './types';

/**
 * Helper function to determine if targeted regeneration should be used
 * @param badCount Number of problematic items
 * @param totalCount Total number of items
 * @param minOverallScore Minimum overall score to allow targeted regen (optional)
 * @param overallScore Current overall score (optional)
 */
export function shouldUseTargetedRegen(
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
export async function performPhase1TargetedRegen(
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

    const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);
    const targetedPrompt = PHASE1_TARGETED_REGENERATION_PROMPT
        .replace('{TOPIC}', topic)
        .replace('{DIFFICULTY}', difficultyContext)
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
export async function performPhase4TargetedRegen(
    lastQuestions: Phase4Question[],
    badIndices: number[],
    rejectionReasons: string
): Promise<Phase4Question[] | null> {
    const goodQuestions = lastQuestions.filter((_, idx) => !badIndices.includes(idx));
    const badQuestionsText = badIndices.map(idx =>
        `- Q${idx + 1}: "${lastQuestions[idx].text}" (REJETÉ)`
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
export async function performPhase5TargetedRegen(
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
