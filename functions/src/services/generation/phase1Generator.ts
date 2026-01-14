/**
 * Phase 1 question generation with dialogue system
 * Generator/Reviewer iterative approach for high-quality trivia questions
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
import { factCheckPhase1Questions } from './factChecker';
import { shouldUseTargetedRegen, performPhase1TargetedRegen } from './targetedRegen';
import { normalizePhase1Questions } from './questionValidator';
import {
    Phase1Question,
    Phase1GeneratorQuestion,
    Phase1DialogueReview,
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
 * Generate Phase 1 questions using dialogue between Generator and Reviewer agents
 * The two agents iterate until questions pass quality criteria
 */
export async function generatePhase1WithDialogue(
    topic: string,
    difficulty: string,
    language: SupportedLanguage = 'fr',
    completeCount?: number,
    existingQuestions?: Phase1Question[],
    maxIterations: number = 4
): Promise<{ questions: Phase1Question[]; embeddings: number[][] }> {
    // Get language-specific prompts
    const prompts = getPrompts(language);
    const languageName = LANGUAGE_NAMES[language];

    // Completion mode: generate fewer questions
    const isCompletion = completeCount !== undefined && completeCount > 0;
    const targetCount = isCompletion ? completeCount : 10;

    console.log(`🎭 Starting Generator/Reviewer dialogue for Phase 1 (lang: ${language})...${isCompletion ? ` (COMPLETION: ${targetCount} questions)` : ''}`);

    let previousFeedback = '';
    let lastQuestions: Phase1Question[] = [];

    // Track the BEST questions seen so far (for fallback when max iterations reached)
    let bestQuestions: Phase1Question[] = [];
    let bestScore = 0;

    // Language instruction for non-English languages
    const languageInstruction = language !== 'en'
        ? `\n\n🌍 LANGUAGE: Generate ALL content in ${languageName}. Questions, answers, options, and anecdotes MUST be written in ${languageName}.`
        : '';

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
        let generatorPrompt = prompts.PHASE1_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficultyContext)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback)
            + languageInstruction;

        // For completion mode, modify the prompt to request fewer questions
        if (isCompletion) {
            generatorPrompt = generatorPrompt
                .replace(/10 questions/gi, `${targetCount} questions`)
                .replace(/10 nouvelles/gi, `${targetCount} nouvelles`)
                .replace(/10 new/gi, `${targetCount} new`) + existingContext;
        }

        console.log('🤖 Generator creating questions...');
        const proposalText = await callGemini(generatorPrompt, 'factual'); // Use factual config for Phase 1
        let proposal: Phase1GeneratorQuestion[];

        try {
            const rawProposal = parseJsonArrayFromText<Phase1GeneratorQuestion>(proposalText);

            // Validate and normalize questions to ensure proper structure (prevents question/answer desync)
            console.log(`🔍 Validating ${rawProposal.length} generated questions...`);
            const normalized = normalizePhase1Questions(rawProposal);

            if (normalized.length === 0) {
                console.error('❌ All questions failed validation!');
                console.log('Raw response:', proposalText.slice(0, 500));
                continue; // Skip to next iteration
            }

            if (normalized.length < rawProposal.length) {
                console.warn(`⚠️ ${rawProposal.length - normalized.length} questions were invalid and filtered out`);
            }

            // Map back to Phase1GeneratorQuestion format (preserving anecdotes and verification)
            proposal = normalized.map((q, idx) => ({
                text: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                anecdote: q.anecdote || rawProposal[idx]?.anecdote || '',
                verification: rawProposal[idx]?.verification
            }));
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue; // Skip to next iteration
        }

        console.log(`📝 Generated ${proposal.length} valid questions`);

        // Store for fallback
        lastQuestions = proposal.map(q => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            anecdote: q.anecdote
        }));

        // 2. Reviewer evaluates the questions
        const reviewerPrompt = prompts.PHASE1_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2))
            + languageInstruction;

        console.log('👨‍⚖️ Reviewer evaluating questions...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'review'); // Use factual config for Phase 1
        let review: Phase1DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase1DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue; // Skip to next iteration
        }

        // Log scores
        console.log(`📊 Scores: factual=${review.scores.factual_accuracy}, humor=${review.scores.humor || 0}, clarity=${review.scores.clarity}`);
        console.log(`          variety=${review.scores.variety}, options=${review.scores.options_quality || 0}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        // CRITICAL: Factual accuracy must be >= 8 (increased from 7)
        if (review.scores.factual_accuracy < 8) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10). Questions have errors!`);

            // Identify questions with factual errors
            const factualErrorIndices = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'factual_error')
                .map(q => q.index);

            const problematicQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'factual_error')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

            // Try targeted regeneration if <= 60% have errors
            if (factualErrorIndices.length > 0 && shouldUseTargetedRegen(factualErrorIndices.length, lastQuestions.length)) {
                console.log(`🎯 Attempting targeted regen for ${factualErrorIndices.length} factual errors`);
                const rejectionReasons = review.questions_feedback
                    .filter(q => !q.ok && q.issue_type === 'factual_error')
                    .map(q => `- Q${q.index + 1}: ${q.issue} (erreur factuelle)`)
                    .join('\n');

                const newQuestions = await performPhase1TargetedRegen(
                    lastQuestions,
                    factualErrorIndices,
                    topic,
                    difficulty,
                    rejectionReasons
                );

                if (newQuestions) {
                    lastQuestions = newQuestions;
                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (erreurs factuelles)

${factualErrorIndices.length} questions remplacées pour erreurs factuelles.
Le reviewer va maintenant re-valider le set complet.
`;
                    continue;
                }
                // If targeted regen failed, fall through to full regen
                console.log('⚠️ Targeted regen failed, falling back to full regen');
            }

            // Full regeneration
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

        // Check humor (new!)
        if ((review.scores.humor || 0) < 6) {
            console.log(`❌ Not funny enough (${review.scores.humor}/10).`);

            const boringQuestions = review.questions_feedback
                .filter(q => q.funny === false || q.issue_type === 'not_funny')
                .map(q => `- Q${q.index + 1}: "${q.text?.slice(0, 40) || '?'}..."`)
                .join('\n');

            previousFeedback = `
⚠️ QUESTIONS PAS ASSEZ DRÔLES (score: ${review.scores.humor}/10)

Questions ennuyeuses :
${boringQuestions || '(Toutes)'}

RAPPEL : Formulations DÉCALÉES et ABSURDES obligatoires !
`;
            continue;
        }

        // Check clarity
        if (review.scores.clarity < 7) {
            console.log(`❌ Clarity too low (${review.scores.clarity}/10). Questions are ambiguous!`);

            const ambiguousQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'ambiguous')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

            previousFeedback = `
⚠️ QUESTIONS AMBIGUËS (score clarté: ${review.scores.clarity}/10)

${ambiguousQuestions || '(Reformuler pour avoir une seule réponse possible)'}
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

                const failedFeedback = factCheckResult.failed
                    .map(f => `- "${f.question.text.slice(0, 50)}...": ${f.reason}`)
                    .join('\n');

                // Try targeted regeneration if <= 60% failed
                if (shouldUseTargetedRegen(factCheckResult.failed.length, lastQuestions.length)) {
                    // Find indices of failed questions
                    const failedIndices = factCheckResult.failed.map(f =>
                        lastQuestions.findIndex(q => q.text === f.question.text)
                    ).filter(idx => idx !== -1);

                    if (failedIndices.length > 0) {
                        console.log(`🎯 Attempting targeted regen for ${failedIndices.length} fact-check failures`);
                        const rejectionReasons = factCheckResult.failed
                            .map(f => `- "${f.question.text.slice(0, 40)}...": ${f.reason}`)
                            .join('\n');

                        const newQuestions = await performPhase1TargetedRegen(
                            lastQuestions,
                            failedIndices,
                            topic,
                            difficulty,
                            rejectionReasons
                        );

                        if (newQuestions) {
                            lastQuestions = newQuestions;

                            // OPTIMIZATION: If original score was excellent (>= 9.0), skip iteration 2
                            // Just re-run fact-check on the new questions and proceed if they pass
                            if (review.overall_score >= 9.0) {
                                console.log(`🚀 Score excellent (${review.overall_score}/10), vérification rapide des nouvelles questions...`);
                                const recheck = await factCheckPhase1Questions(lastQuestions);

                                if (recheck.failed.length === 0) {
                                    console.log(`✅ Toutes les questions passent le fact-check, skip itération ${i + 2}`);
                                    // Continue to deduplication below (don't use continue)
                                } else {
                                    console.log(`⚠️ Encore ${recheck.failed.length} échecs, nouvelle itération nécessaire`);
                                    previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (échec fact-check)

${failedIndices.length} questions remplacées après échec de vérification factuelle.
Le reviewer va maintenant re-valider le set complet.
`;
                                    continue;
                                }
                            } else {
                                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE (échec fact-check)

${failedIndices.length} questions remplacées après échec de vérification factuelle.
Le reviewer va maintenant re-valider le set complet.
`;
                                continue;
                            }
                        }
                        console.log('⚠️ Targeted regen failed, falling back to full regen');
                    }
                }

                // Full regeneration if too many failed or targeted regen failed
                if (factCheckResult.failed.length > Math.floor(lastQuestions.length * 0.6)) {
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
            // Use findSemanticDuplicatesWithEmbeddings to generate embeddings once and reuse
            // IMPORTANT: Check against ALL phases to prevent cross-phase duplicates (P1↔P4, P1↔P5, etc.)
            const questionsAsItems = lastQuestions.map(q => ({ text: q.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let allEmbeddings: number[][] = [];

            try {
                // Generate embeddings once and reuse for both dedup checks and storage
                // checkAllPhases: true to detect cross-phase duplicates
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(
                    questionsAsItems,
                    'phase1',
                    { checkAllPhases: true }
                );
                semanticDuplicates = dedupResult.duplicates;
                allEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(allEmbeddings, questionsAsItems);
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

                // Filter out duplicates from questions AND embeddings
                const filteredQuestions: typeof lastQuestions = [];
                const filteredEmbeddings: number[][] = [];
                for (let idx = 0; idx < lastQuestions.length; idx++) {
                    if (!duplicateIndices.has(idx)) {
                        filteredQuestions.push(lastQuestions[idx]);
                        if (allEmbeddings[idx]) {
                            filteredEmbeddings.push(allEmbeddings[idx]);
                        }
                    }
                }
                lastQuestions = filteredQuestions;
                allEmbeddings = filteredEmbeddings;

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

            // Store questions with embeddings for future deduplication (reusing already-generated embeddings)
            if (allEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    lastQuestions.map(q => ({ text: q.text })),
                    allEmbeddings,
                    'phase1'
                );
            }

            // VALIDATION: Ensure we have the target number of questions
            if (lastQuestions.length < targetCount) {
                console.warn(`⚠️ Only ${lastQuestions.length}/${targetCount} questions generated, completing with fallback questions`);

                // Import fallback questions (note: this is a dynamic import since we're in functions/)
                // For now, we'll use a simple inline fallback set
                const fallbackQuestions: Phase1Question[] = [
                    {
                        text: "Quel animal est le plus rapide en vitesse de pointe ?",
                        options: ["Le guépard", "Le faucon pèlerin", "L'espadon voilier", "Le colibri"],
                        correctIndex: 1,
                        anecdote: "Le faucon pèlerin atteint 389 km/h en piqué, bien plus que le guépard (120 km/h) !"
                    },
                    {
                        text: "Combien de temps dure un jour sur Vénus ?",
                        options: ["24 heures", "243 jours terrestres", "30 minutes", "1 an terrestre"],
                        correctIndex: 1,
                        anecdote: "Vénus tourne si lentement qu'un jour y dure plus longtemps qu'une année vénusienne !"
                    },
                    {
                        text: "De quelle couleur est la boîte noire d'un avion ?",
                        options: ["Noire", "Orange", "Rouge", "Jaune"],
                        correctIndex: 1,
                        anecdote: "Elle est orange fluo pour être facilement repérable dans les débris !"
                    },
                    {
                        text: "Quel est le plus grand désert du monde ?",
                        options: ["Le Sahara", "Le désert de Gobi", "L'Antarctique", "Le désert d'Arabie"],
                        correctIndex: 2,
                        anecdote: "L'Antarctique est un désert froid ! Il reçoit moins de précipitations que le Sahara."
                    },
                    {
                        text: "Quel organe humain consomme le plus d'énergie ?",
                        options: ["Le cœur", "Les muscles", "Le cerveau", "Le foie"],
                        correctIndex: 2,
                        anecdote: "Le cerveau ne représente que 2% du poids du corps mais consomme 20% de l'énergie !"
                    },
                ];

                // Add fallback questions until we reach target count
                let addedCount = 0;
                while (lastQuestions.length < targetCount && addedCount < fallbackQuestions.length) {
                    lastQuestions.push(fallbackQuestions[addedCount]);
                    addedCount++;
                }

                console.log(`✅ Added ${addedCount} fallback questions to reach ${lastQuestions.length} total`);
            }

            return { questions: lastQuestions, embeddings: allEmbeddings };
        }

        // 4. Try targeted regeneration if <= 60% of questions are bad
        const badQuestionIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        // Use helper to check if targeted regen is appropriate (60% threshold, min score 4)
        if (shouldUseTargetedRegen(badQuestionIndices.length, lastQuestions.length, 4, review.overall_score)) {
            const rejectionReasons = review.questions_feedback
                .filter(q => !q.ok)
                .map(q => `- Q${q.index + 1}: ${q.issue} (${q.issue_type})`)
                .join('\n');

            const newQuestions = await performPhase1TargetedRegen(
                lastQuestions,
                badQuestionIndices,
                topic,
                difficulty,
                rejectionReasons
            );

            if (newQuestions) {
                lastQuestions = newQuestions;
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${badQuestionIndices.length} questions remplacées.
Le reviewer va maintenant re-valider le set complet.
`;
                continue;
            }
            // If targeted regen failed, fall through to full regen
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
- Humour : ${review.scores.humor || 0}/10
- Clarté : ${review.scores.clarity}/10
- Variété : ${review.scores.variety}/10
- Options : ${review.scores.options_quality || 0}/10

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

        // VALIDATION: Ensure we have the target number of questions
        if (fallbackQuestions.length < targetCount) {
            console.warn(`⚠️ Only ${fallbackQuestions.length}/${targetCount} questions in fallback set, completing with default questions`);

            const defaultQuestions: Phase1Question[] = [
                {
                    text: "Quel animal est le plus rapide en vitesse de pointe ?",
                    options: ["Le guépard", "Le faucon pèlerin", "L'espadon voilier", "Le colibri"],
                    correctIndex: 1,
                    anecdote: "Le faucon pèlerin atteint 389 km/h en piqué, bien plus que le guépard (120 km/h) !"
                },
                {
                    text: "Combien de temps dure un jour sur Vénus ?",
                    options: ["24 heures", "243 jours terrestres", "30 minutes", "1 an terrestre"],
                    correctIndex: 1,
                    anecdote: "Vénus tourne si lentement qu'un jour y dure plus longtemps qu'une année vénusienne !"
                },
                {
                    text: "De quelle couleur est la boîte noire d'un avion ?",
                    options: ["Noire", "Orange", "Rouge", "Jaune"],
                    correctIndex: 1,
                    anecdote: "Elle est orange fluo pour être facilement repérable dans les débris !"
                },
                {
                    text: "Quel est le plus grand désert du monde ?",
                    options: ["Le Sahara", "Le désert de Gobi", "L'Antarctique", "Le désert d'Arabie"],
                    correctIndex: 2,
                    anecdote: "L'Antarctique est un désert froid ! Il reçoit moins de précipitations que le Sahara."
                },
                {
                    text: "Quel organe humain consomme le plus d'énergie ?",
                    options: ["Le cœur", "Les muscles", "Le cerveau", "Le foie"],
                    correctIndex: 2,
                    anecdote: "Le cerveau ne représente que 2% du poids du corps mais consomme 20% de l'énergie !"
                },
            ];

            // Add default questions until we reach target count
            let addedCount = 0;
            while (fallbackQuestions.length < targetCount && addedCount < defaultQuestions.length) {
                fallbackQuestions.push(defaultQuestions[addedCount]);
                addedCount++;
            }

            console.log(`✅ Added ${addedCount} default questions to reach ${fallbackQuestions.length} total`);
        }

        // Generate embeddings and store for future deduplication (even fallback)
        const fallbackItems = fallbackQuestions.map(q => ({ text: q.text }));
        const { embeddings: finalEmbeddings } = await findSemanticDuplicatesWithEmbeddings(fallbackItems, 'phase1');
        await storeQuestionsWithEmbeddings(fallbackItems, finalEmbeddings, 'phase1');

        return { questions: fallbackQuestions, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen
    throw new Error('Failed to generate Phase 1 questions after all iterations');
}
