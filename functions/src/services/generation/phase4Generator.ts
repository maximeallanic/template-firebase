/**
 * Phase 4 MCQ question generation with dialogue system
 * Generator/Reviewer iterative approach for buzzer-style trivia questions
 */

import { getPrompts, type SupportedLanguage } from '../../prompts';
import { getFullDifficultyContext, type DifficultyLevel } from '../../prompts/fr/difficulty';
import {
    findSemanticDuplicatesWithEmbeddings,
    findInternalDuplicates,
    storeQuestionsWithEmbeddings,
    type SemanticDuplicate
} from '../../utils/embeddingService';
import { callGemini, callGeminiForReview } from './geminiBridge';
import { parseJsonFromText, parseJsonArrayFromText, shuffleMCQOptions } from './jsonUtils';
import { shouldUseTargetedRegen, performPhase4TargetedRegen } from './targetedRegen';
import { normalizePhase4Questions } from './questionValidator';
import {
    Phase4Question,
    Phase4DialogueReview,
} from './types';

/** Language names for AI prompts */
const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    fr: 'French',
    en: 'English',
    es: 'Spanish',
    de: 'German',
    pt: 'Portuguese',
};

/**
 * Generate Phase 4 MCQ culture générale questions using dialogue between Generator and Reviewer agents
 * Creates 10 MCQ questions with 4 options each
 */
export async function generatePhase4WithDialogue(
    topic: string,
    difficulty: string,
    language: SupportedLanguage = 'fr',
    completeCount?: number,
    existingQuestions?: Phase4Question[],
    maxIterations: number = 4
): Promise<{ questions: Phase4Question[]; embeddings: number[][] }> {
    // Get language-specific prompts
    const prompts = getPrompts(language);
    const languageName = LANGUAGE_NAMES[language];

    // Completion mode: generate fewer questions
    const isCompletion = completeCount !== undefined && completeCount > 0;
    const targetCount = isCompletion ? completeCount : 10;

    console.log(`🎭 Starting Generator/Reviewer dialogue for Phase 4 MCQ (lang: ${language})...${isCompletion ? ` (COMPLETION: ${targetCount} questions)` : ''}`);

    // Language instruction for non-English languages
    const languageInstruction = language !== 'en'
        ? `\n\n🌍 LANGUAGE: Generate ALL content in ${languageName}. Questions, answers, and options MUST be written in ${languageName}.`
        : '';

    let previousFeedback = '';
    let lastQuestions: Phase4Question[] = [];
    let bestQuestions: Phase4Question[] = [];
    let bestScore = 0;

    // For completion mode, build context about existing questions to avoid duplicates
    let existingContext = '';
    if (isCompletion && existingQuestions && existingQuestions.length > 0) {
        const existingSummary = existingQuestions.map((q, i) => `${i + 1}. ${q.text}`).join('\n');
        existingContext = `\n\n⚠️ EXISTING QUESTIONS (DO NOT REPEAT):\n${existingSummary}\n\nGenerate ${targetCount} NEW DIFFERENT questions.`;
    }

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes questions
        const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);
        let generatorPrompt = prompts.PHASE4_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficultyContext)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback)
            + languageInstruction;

        // For completion mode, modify the prompt
        if (isCompletion) {
            generatorPrompt = generatorPrompt
                .replace(/10 questions/gi, `${targetCount} questions`)
                .replace(/10 nouvelles/gi, `${targetCount} nouvelles`) + existingContext;
        }

        console.log('🤖 Generator creating MCQ questions...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase4Question[];

        try {
            const rawProposal = parseJsonArrayFromText<Phase4Question>(proposalText);

            // Validate and normalize questions to ensure proper structure (prevents question/answer desync)
            console.log(`🔍 Validating ${rawProposal.length} generated MCQ questions...`);
            const normalized = normalizePhase4Questions(rawProposal);

            if (normalized.length === 0) {
                console.error('❌ All questions failed validation!');
                console.log('Raw response:', proposalText.slice(0, 500));
                continue;
            }

            if (normalized.length < rawProposal.length) {
                console.warn(`⚠️ ${rawProposal.length - normalized.length} questions were invalid and filtered out`);
            }

            // Shuffle options to prevent AI bias (correct answer not always in same position)
            proposal = normalized.map(q => shuffleMCQOptions(q));
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📝 Generated ${proposal.length} valid MCQ questions`);
        lastQuestions = proposal;

        // 2. Reviewer evaluates the questions
        const reviewerPrompt = prompts.PHASE4_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2))
            + languageInstruction;

        console.log('👨‍⚖️ Reviewer evaluating MCQ questions...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'review');
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
            const questionsAsItems = lastQuestions.map(q => ({ text: q.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                // checkAllPhases: true to detect cross-phase duplicates (P1↔P4, P2↔P4, etc.)
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(
                    questionsAsItems,
                    'phase4',
                    { checkAllPhases: true }
                );
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Phase 4 duplicate check failed, skipping:', err);
            }

            // Filter out duplicates if found
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                const allDuplicates = [...semanticDuplicates, ...internalDuplicates];
                const duplicateIndices = new Set(allDuplicates.map(d => d.index));

                console.error(`❌ Phase 4: Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates - FILTERING`);
                for (const dup of allDuplicates) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }

                // Filter out duplicate questions
                const uniqueQuestions = lastQuestions.filter((_, idx) => !duplicateIndices.has(idx));
                const uniqueEmbeddings = finalEmbeddings.filter((_, idx) => !duplicateIndices.has(idx));

                // If too many duplicates, we still return what we have (better than nothing)
                if (uniqueQuestions.length < 4) {
                    console.warn(`⚠️ Phase 4: Too many duplicates (${uniqueQuestions.length} unique), using fallback`);
                } else {
                    console.log(`✅ Phase 4: Filtered duplicates, keeping ${uniqueQuestions.length}/${lastQuestions.length} unique questions`);
                    lastQuestions = uniqueQuestions;
                    finalEmbeddings = uniqueEmbeddings;
                }
            }

            // Store only unique questions
            const finalQuestionsAsItems = lastQuestions.map(q => ({ text: q.text }));
            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    finalQuestionsAsItems,
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
        const questionsAsItems = fallbackQuestions.map(q => ({ text: q.text }));

        // Run deduplication and generate embeddings
        let finalEmbeddings: number[][] = [];
        let finalQuestions = fallbackQuestions;
        try {
            // checkAllPhases: true to detect cross-phase duplicates
            const dedupResult = await findSemanticDuplicatesWithEmbeddings(
                questionsAsItems,
                'phase4',
                { checkAllPhases: true }
            );
            finalEmbeddings = dedupResult.embeddings;
            const internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);

            // Filter out duplicates if found
            const allDuplicates = [...dedupResult.duplicates, ...internalDuplicates];
            if (allDuplicates.length > 0) {
                const duplicateIndices = new Set(allDuplicates.map(d => d.index));
                console.warn(`⚠️ Phase 4 fallback: Found ${dedupResult.duplicates.length} semantic + ${internalDuplicates.length} internal duplicates - FILTERING`);
                for (const dup of allDuplicates) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }

                // Filter out duplicate questions
                finalQuestions = fallbackQuestions.filter((_, idx) => !duplicateIndices.has(idx));
                finalEmbeddings = finalEmbeddings.filter((_, idx) => !duplicateIndices.has(idx));
                console.log(`✅ Phase 4 fallback: Filtered to ${finalQuestions.length}/${fallbackQuestions.length} unique questions`);
            }
        } catch (err) {
            console.warn('⚠️ Phase 4 fallback dedup failed:', err);
        }

        // Store only unique questions
        const finalQuestionsAsItems = finalQuestions.map(q => ({ text: q.text }));
        if (finalEmbeddings.length > 0) {
            await storeQuestionsWithEmbeddings(
                finalQuestionsAsItems,
                finalEmbeddings,
                'phase4'
            );
        }

        return { questions: finalQuestions, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 4 questions after all iterations');
}
