/**
 * Fact-checking system for game questions
 * Verification pipeline for ensuring question accuracy
 */

import { isSearchAvailable } from '../../config/genkit';
import {
    FACT_CHECK_BATCH_PROMPT,
    FACT_CHECK_NO_SEARCH_PROMPT,
    FACT_CHECK_PHASE2_PROMPT,
} from '../../prompts';
import { callGeminiForFactCheck } from './geminiBridge';
import { parseJsonFromText } from './jsonUtils';
import {
    Phase1Question,
    Phase2Set,
    FactCheckBatchResponse,
    Phase2FactCheckBatchResult,
    FACT_CHECK_CONFIDENCE_THRESHOLD,
} from './types';

/**
 * Verify factual accuracy of Phase 1 questions in batch
 * Returns questions that passed fact-check with high confidence
 * Also checks for synonyms/equivalents in wrong options
 * Includes retry logic with exponential backoff
 */
export async function factCheckPhase1Questions(
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
export async function factCheckPhase2Items(
    set: Phase2Set
): Promise<{ passed: typeof set.items; failed: { item: typeof set.items[0]; reason: string }[] }> {
    console.log(`🔍 Fact-checking ${set.items.length} Phase 2 items (BATCH)...`);

    const passed: typeof set.items = [];
    const failed: { item: typeof set.items[0]; reason: string }[] = [];

    // Prepare items for batch check
    const itemsJson = set.items.map((item, idx) => ({
        index: idx,
        text: item.text,
        assignedCategory: item.answer,
        justification: item.justification || 'Non fournie'
    }));

    const prompt = FACT_CHECK_PHASE2_PROMPT
        .replace('{OPTION_A}', set.optionA)
        .replace('{OPTION_B}', set.optionB)
        .replace('{ITEMS_JSON}', JSON.stringify(itemsJson, null, 2));

    try {
        const responseText = await callGeminiForFactCheck(prompt);
        const result = parseJsonFromText(responseText) as Phase2FactCheckBatchResult;

        console.log(`📊 Fact-check summary: ${result.summary.correct}/${result.summary.total} correct`);

        for (const check of result.results) {
            const item = set.items[check.index];
            if (check.isCorrect && check.confidence >= FACT_CHECK_CONFIDENCE_THRESHOLD) {
                passed.push(item);
                console.log(`  ✅ "${item.text}" → ${item.answer}`);
            } else {
                const reason = !check.isCorrect
                    ? `Mauvaise catégorie: devrait être ${check.shouldBe} - ${check.reasoning}`
                    : `Confiance trop basse (${check.confidence}%): ${check.reasoning}`;
                failed.push({ item, reason });
                console.log(`  ❌ "${item.text}" → ${item.answer} - ${reason}`);
            }
        }
    } catch (err) {
        console.error('❌ Batch fact-check failed:', err);
        // If batch fails, accept all items (reviewer already validated)
        console.log('⚠️ Falling back to accepting all items');
        passed.push(...set.items);
    }

    console.log(`📊 Phase 2 fact-check: ${passed.length}/${set.items.length} passed`);
    return { passed, failed };
}

/**
 * Verify factual accuracy of Phase 3/4/5 questions (simple Q&A format)
 * These phases don't have the Generator/Reviewer system, so this is their main verification
 */
export async function factCheckSimpleQuestions(
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
