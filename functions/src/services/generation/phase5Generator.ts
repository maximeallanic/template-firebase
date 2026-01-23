/**
 * Phase 5 memory sequence generation with dialogue system
 * Generator/Reviewer iterative approach for linked question sequences
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
import { parseJsonFromText, parseJsonArrayFromText } from './jsonUtils';
import { factCheckSimpleQuestions } from './factChecker';
import { shouldUseTargetedRegen, performPhase5TargetedRegen } from './targetedRegen';
import { normalizePhase5Questions } from './questionValidator';
import {
    Phase5Question,
    Phase5DialogueReview,
    TARGETED_REGEN_MAX_PERCENTAGE,
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
 * Generate Phase 5 memory sequence using dialogue between Generator and Reviewer agents
 * Creates 10 linked questions with callbacks for memory challenge
 */
export async function generatePhase5WithDialogue(
    topic: string,
    difficulty: string,
    language: SupportedLanguage = 'fr',
    maxIterations: number = 4
): Promise<{ questions: Phase5Question[]; embeddings: number[][] }> {
    // Get language-specific prompts
    const prompts = getPrompts(language);
    const languageName = LANGUAGE_NAMES[language];

    console.log(`🎭 Starting Generator/Reviewer dialogue for Phase 5 (lang: ${language})...`);

    // Language instruction for non-English languages
    const languageInstruction = language !== 'en'
        ? `\n\n🌍 LANGUAGE: Generate ALL content in ${languageName}. Questions, answers, and anecdotes MUST be written in ${languageName}.`
        : '';

    let previousFeedback = '';
    let lastQuestions: Phase5Question[] = [];
    let bestQuestions: Phase5Question[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes questions
        const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);
        const generatorPrompt = prompts.PHASE5_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficultyContext)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback)
            + languageInstruction;

        console.log('🤖 Generator creating memory sequence...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase5Question[];

        try {
            const rawProposal = parseJsonArrayFromText<Phase5Question>(proposalText);

            // Validate and normalize questions to ensure proper structure (prevents question/answer desync)
            console.log(`🔍 Validating ${rawProposal.length} generated questions...`);
            const normalized = normalizePhase5Questions(rawProposal);

            if (normalized.length === 0) {
                console.error('❌ All questions failed validation!');
                console.log('Raw response:', proposalText.slice(0, 500));
                continue;
            }

            if (normalized.length < rawProposal.length) {
                console.warn(`⚠️ ${rawProposal.length - normalized.length} questions were invalid and filtered out`);
            }

            proposal = normalized;
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📝 Generated ${proposal.length} valid questions for memory sequence`);
        lastQuestions = proposal;

        // 2. Reviewer evaluates the sequence
        const reviewerPrompt = prompts.PHASE5_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2))
            + languageInstruction;

        console.log('👨‍⚖️ Reviewer evaluating sequence...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'review');
        let review: Phase5DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase5DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue;
        }

        // Log scores
        console.log(`📊 Scores: absurdity=${review.scores.absurdity || review.scores.humor || 0}, diversity=${review.scores.diversity || 0}, memorability=${review.scores.memorability || 0}`);
        console.log(`          factual=${review.scores.factual_accuracy || 0}, qa_coherence=${review.scores.qa_coherence || 'N/A'}, theme=${review.scores.theme_coherence || 'N/A'}`);
        console.log(`   Overall: ${review.overall_score}/10`);
        if (review.duplicate_concepts && review.duplicate_concepts.length > 0) {
            console.log(`   ⚠️ Duplicates: ${review.duplicate_concepts.join(', ')}`);
        }

        // 3. Check critical criteria

        // Check absurdity/humor (absurdity is the primary field, humor is fallback for backwards compatibility)
        const absurdityScore = review.scores.absurdity || review.scores.humor || 0;
        if (absurdityScore < 6) {
            console.log(`❌ Not absurd/funny enough (${absurdityScore}/10).`);

            const boringQuestions = review.questions_feedback
                .filter(q => !q.absurd && !q.funny)
                .map(q => `- Q${q.index + 1}: "${q.question?.slice(0, 40) || '?'}..."`)
                .join('\n');

            previousFeedback = `
⚠️ QUESTIONS PAS ASSEZ DÉCALÉES (score: ${absurdityScore}/10)

Questions ennuyeuses :
${boringQuestions || '(Toutes)'}

RAPPEL : Les questions doivent faire SOURIRE. Formulations DÉCALÉES et ABSURDES.
`;
            continue;
        }

        // Check diversity
        if ((review.scores.diversity || 0) < 7 || (review.duplicate_concepts && review.duplicate_concepts.length > 0)) {
            console.log(`❌ Not diverse enough (${review.scores.diversity}/10).`);

            previousFeedback = `
⚠️ MANQUE DE DIVERSITÉ (score: ${review.scores.diversity}/10)

Concepts répétés : ${review.duplicate_concepts?.join(', ') || '(non spécifiés)'}

INTERDIT : 2 questions sur le même sujet !
Mix OBLIGATOIRE : cinéma, musique, sport, animaux, nourriture, histoire, sciences...
`;
            continue;
        }

        if ((review.scores.factual_accuracy || 0) < 7) {
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

        // Check Q/A coherence (new - fixes issue #19)
        if ((review.scores.qa_coherence || 10) < 8) {
            console.log(`❌ Q/A coherence too low (${review.scores.qa_coherence}/10).`);

            const incoherentQuestions = review.questions_feedback
                .filter(q => q.qa_coherent === false)
                .map(q => `- Q${q.index + 1}: "${q.question?.slice(0, 40) || '?'}..." → "${q.answer}" (${q.issues?.join(', ') || 'incohérent'})`)
                .join('\n');

            previousFeedback = `
⚠️ INCOHÉRENCE QUESTION/RÉPONSE (score: ${review.scores.qa_coherence}/10)

Questions incohérentes :
${incoherentQuestions || '(Vérifier toutes les Q/R)'}

CRITIQUE : La réponse doit correspondre au TYPE de question :
- "Pourquoi X ?" → Réponse = RAISON
- "Qui a fait X ?" → Réponse = PERSONNE
- "Est-ce A ou B ?" → Réponse = A, B, ou "les deux"

REFORMULE les questions ou CHANGE les réponses pour corriger.
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
                    const failedIndices = factCheckResult.failed.map((f: { question: { question: string; answer: string }; reason: string }) =>
                        lastQuestions.findIndex(q => q.question === f.question.question)
                    ).filter((idx: number) => idx !== -1);

                    if (failedIndices.length > 0) {
                        const failedReasons = factCheckResult.failed.map((f: { question: { question: string; answer: string }; reason: string }) =>
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
                // checkAllPhases: true to detect cross-phase duplicates (P1↔P5, P2↔P5, etc.)
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(
                    questionsAsItems,
                    'phase5',
                    { checkAllPhases: true }
                );
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Phase 5 duplicate check failed, skipping:', err);
            }

            // Filter out duplicates if found
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                const allDuplicates = [...semanticDuplicates, ...internalDuplicates];
                const duplicateIndices = new Set(allDuplicates.map(d => d.index));

                console.error(`❌ Phase 5: Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates - FILTERING`);
                for (const dup of allDuplicates) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }

                // Filter out duplicate questions
                const uniqueQuestions = lastQuestions.filter((_, idx) => !duplicateIndices.has(idx));
                const uniqueEmbeddings = finalEmbeddings.filter((_, idx) => !duplicateIndices.has(idx));

                // If too many duplicates, we still return what we have (better than nothing)
                if (uniqueQuestions.length < 4) {
                    console.warn(`⚠️ Phase 5: Too many duplicates (${uniqueQuestions.length} unique), using fallback`);
                } else {
                    console.log(`✅ Phase 5: Filtered duplicates, keeping ${uniqueQuestions.length}/${lastQuestions.length} unique questions`);
                    lastQuestions = uniqueQuestions;
                    finalEmbeddings = uniqueEmbeddings;
                }
            }

            // Store only unique questions
            const finalQuestionsAsItems = lastQuestions.map(q => ({ text: q.question }));
            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    finalQuestionsAsItems,
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
        let finalQuestions = fallbackQuestions;
        try {
            // checkAllPhases: true to detect cross-phase duplicates
            const dedupResult = await findSemanticDuplicatesWithEmbeddings(
                questionsAsItems,
                'phase5',
                { checkAllPhases: true }
            );
            finalEmbeddings = dedupResult.embeddings;
            const internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);

            // Filter out duplicates if found
            const allDuplicates = [...dedupResult.duplicates, ...internalDuplicates];
            if (allDuplicates.length > 0) {
                const duplicateIndices = new Set(allDuplicates.map(d => d.index));
                console.warn(`⚠️ Phase 5 fallback: Found ${dedupResult.duplicates.length} semantic + ${internalDuplicates.length} internal duplicates - FILTERING`);
                for (const dup of allDuplicates) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }

                // Filter out duplicate questions
                finalQuestions = fallbackQuestions.filter((_, idx) => !duplicateIndices.has(idx));
                finalEmbeddings = finalEmbeddings.filter((_, idx) => !duplicateIndices.has(idx));
                console.log(`✅ Phase 5 fallback: Filtered to ${finalQuestions.length}/${fallbackQuestions.length} unique questions`);
            }
        } catch (err) {
            console.warn('⚠️ Phase 5 fallback dedup failed:', err);
        }

        // Store only unique questions
        const finalQuestionsAsItems = finalQuestions.map(q => ({ text: q.question }));
        if (finalEmbeddings.length > 0) {
            await storeQuestionsWithEmbeddings(
                finalQuestionsAsItems,
                finalEmbeddings,
                'phase5'
            );
        }

        return { questions: finalQuestions, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 5 sequence after all iterations');
}
