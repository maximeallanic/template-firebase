/**
 * Phase 2 question generation with dialogue system
 * Generator/Reviewer iterative approach for homophone-based questions
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
import { factCheckPhase2Items } from './factChecker';
import { shouldUseTargetedRegen } from './targetedRegen';
import {
    Phase2Set,
    Phase2GeneratorResponse,
    Phase2DialogueReview,
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
 * Generate Phase 2 set using dialogue between Generator and Reviewer agents
 * The two agents iterate until the set passes quality criteria
 */
export async function generatePhase2WithDialogue(
    topic: string,
    difficulty: string,
    language: SupportedLanguage = 'fr',
    completeCount?: number,
    existingItems?: unknown[],
    maxIterations: number = 3
): Promise<{ set: Phase2Set; embeddings: number[][] }> {
    // Get language-specific prompts
    const prompts = getPrompts(language);
    const languageName = LANGUAGE_NAMES[language];

    // Completion mode: generate fewer items
    const isCompletion = completeCount !== undefined && completeCount > 0;
    const targetCount = isCompletion ? completeCount : 12;

    console.log(`🎭 Starting Generator/Reviewer dialogue for Phase 2 (lang: ${language})...${isCompletion ? ` (COMPLETION: ${targetCount} items)` : ''}`);

    let previousFeedback = '';
    let lastSet: Phase2Set | null = null;

    // Track the BEST set seen so far (for fallback when max iterations reached)
    let bestSet: Phase2Set | null = null;
    let bestScore = 0;

    // Language instruction for non-English languages
    const languageInstruction = language !== 'en'
        ? `\n\n🌍 LANGUAGE: Generate ALL content in ${languageName}. Options, items, and descriptions MUST be written in ${languageName}. Use ${languageName} homophones/wordplay.`
        : '';

    // For completion mode, build context about existing items to avoid duplicates
    let existingContext = '';
    if (isCompletion && existingItems && existingItems.length > 0) {
        const existingSummary = existingItems.map((item, i) => {
            const itemObj = item as { text?: string };
            return `${i + 1}. ${itemObj.text || 'unknown'}`;
        }).join('\n');
        existingContext = `\n\n⚠️ EXISTING ITEMS (DO NOT REPEAT):\n${existingSummary}\n\nGenerate ${targetCount} NEW DIFFERENT items.`;
    }

    // Flag to skip generator and re-validate lastSet directly (after targeted regen)
    let revalidateOnly = false;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        let proposal: Phase2GeneratorResponse;

        // OPTIMIZATION: After successful targeted regen, skip generator and re-validate
        if (revalidateOnly && lastSet) {
            console.log('🔄 Re-validating improved set (skipping generator)...');
            revalidateOnly = false;

            // Convert lastSet to proposal format for reviewer
            proposal = {
                optionA: lastSet.optionA,
                optionB: lastSet.optionB,
                optionADescription: lastSet.optionADescription,
                optionBDescription: lastSet.optionBDescription,
                humorousDescription: lastSet.humorousDescription,
                items: lastSet.items.map(item => ({
                    text: item.text,
                    answer: item.answer,
                    acceptedAnswers: item.acceptedAnswers,
                    justification: item.justification || '',
                    anecdote: item.anecdote
                })),
                reasoning: 'Set amélioré après régénération ciblée'
            };
        } else {
            // 1. Generator proposes a complete set
            const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);
            let generatorPrompt = prompts.PHASE2_GENERATOR_PROMPT
                .replace('{TOPIC}', topic)
                .replace('{DIFFICULTY}', difficultyContext)
                .replace('{PREVIOUS_FEEDBACK}', previousFeedback)
                + languageInstruction;

            // For completion mode, modify the prompt
            if (isCompletion) {
                generatorPrompt = generatorPrompt
                    .replace(/12 items/gi, `${targetCount} items`)
                    .replace(/12 éléments/gi, `${targetCount} éléments`) + existingContext;
            }

            console.log('🤖 Generator creating set...');
            const proposalText = await callGemini(generatorPrompt, 'creative');

            try {
                proposal = parseJsonFromText(proposalText) as Phase2GeneratorResponse;
            } catch (err) {
                console.error('❌ Failed to parse generator response:', err);
                console.log('Raw response:', proposalText.slice(0, 500));
                continue; // Skip to next iteration
            }
        }

        console.log(`🎯 Proposition: "${proposal.optionA}" vs "${proposal.optionB}"`);
        console.log(`   Reasoning: ${proposal.reasoning}`);

        // Store last set (in case we reach max iterations) - preserve all fields
        lastSet = {
            optionA: proposal.optionA,
            optionB: proposal.optionB,
            optionADescription: proposal.optionADescription,
            optionBDescription: proposal.optionBDescription,
            humorousDescription: proposal.humorousDescription,
            items: proposal.items.map(item => ({
                text: item.text,
                answer: item.answer,
                acceptedAnswers: item.acceptedAnswers,
                justification: item.justification,
                anecdote: item.anecdote
            }))
        };

        // 2. Reviewer evaluates the complete set
        const reviewerPrompt = prompts.PHASE2_DIALOGUE_REVIEWER_PROMPT
            .replace('{SET}', JSON.stringify(proposal, null, 2))
            + languageInstruction;

        console.log('👨‍⚖️ Reviewer evaluating set...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'creative');
        let review: Phase2DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase2DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue; // Skip to next iteration
        }

        // Log scores
        const trapScore = (review.scores as { trap_quality?: number }).trap_quality ?? 'N/A';
        console.log(`📊 Scores: phonetic=${review.scores.phonetic}, concrete=${review.scores.concrete}, distribution=${review.scores.distribution}`);
        console.log(`          clarity=${review.scores.clarity}, b_concrete=${review.scores.b_concrete ?? 'N/A'}, humor=${review.scores.humor}`);
        console.log(`          celebrities=${review.scores.celebrities}, trap_quality=${trapScore}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check if score is sufficient
        // CRITICAL: Phonetic score must be >= 6, otherwise homophone is too weak
        if (review.scores.phonetic < 6) {
            console.log(`❌ Phonetic score too low (${review.scores.phonetic}/10). Must change homophone entirely.`);
            previousFeedback = `
⚠️ HOMOPHONE REJETÉ (score phonétique: ${review.scores.phonetic}/10)

Ton homophone précédent NE FONCTIONNE PAS :
- "${proposal.optionA}" vs "${proposal.optionB}"
- Raison: ${review.homophone_feedback}

Les deux phrases ne SE PRONONCENT PAS PAREIL. Tu dois changer COMPLÈTEMENT de jeu de mots.
Rappel: Un bon homophone = les deux phrases sonnent EXACTEMENT pareil à l'oral.
`;
            continue;
        }

        // Track the BEST set seen so far (only if phonetic is acceptable)
        // This ensures we use the best valid set if we hit max iterations
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestSet = lastSet;
            console.log(`📈 New best set! Score: ${bestScore}/10`);
        }

        // CRITICAL: Category B must be concrete (b_concrete >= 6)
        const bConcreteScore = review.scores.b_concrete ?? 5;
        if (bConcreteScore < 6) {
            console.log(`❌ Category B not concrete enough (${bConcreteScore}/10). Must change homophone.`);
            previousFeedback = `
⚠️ CATÉGORIE B TROP ABSTRAITE (score b_concrete: ${bConcreteScore}/10)

Ton calembour précédent : "${proposal.optionB}"
Problème: La catégorie B ne représente rien de CONCRET.

Pour que ça marche, il faut que B soit une VRAIE CHOSE avec des exemples ÉVIDENTS.
Exemples de B concrets:
- "Chère de Pouille" = région des Pouilles → Bari, Orecchiette, Trulli
- "Le teint est bon" = peau/complexion → bronzage, fond de teint
- "Verre vert" = objet coloré → bouteille, vase, vitre

Tu dois changer COMPLÈTEMENT de jeu de mots pour avoir un B CONCRET.
`;
            continue;
        }

        // Check trap quality - items should create doubt, not be too obvious
        // Threshold of 6 means we need at least a few real traps, not just obvious items
        const trapQualityScore = (review.scores as { trap_quality?: number }).trap_quality ?? 5;
        if (trapQualityScore < 6) {
            console.log(`❌ Trap quality too low (${trapQualityScore}/10). Items are too obvious!`);

            // Find obvious items from feedback
            const obviousItemsFeedback = (review.items_feedback as Array<{ index: number; text: string; is_too_obvious?: boolean; ok: boolean }>)
                .filter(item => item.is_too_obvious || !item.ok);
            const obviousIndices = obviousItemsFeedback.map(item => item.index);

            // If homophone is valid AND we have <= 60% obvious items → targeted regen
            const homophoneValid = review.scores.phonetic >= 6 && bConcreteScore >= 6;
            if (homophoneValid && shouldUseTargetedRegen(obviousIndices.length, proposal.items.length)) {
                console.log(`🔧 Trap quality targeted regen: homophone valid, replacing ${obviousIndices.length} obvious items`);

                const goodItems = proposal.items.filter((_, idx) => !obviousIndices.includes(idx));
                const badItems = proposal.items.filter((_, idx) => obviousIndices.includes(idx));

                // Calculate distribution needed for replacement items
                const currentGoodA = goodItems.filter(item => item.answer === 'A').length;
                const currentGoodB = goodItems.filter(item => item.answer === 'B').length;
                const currentGoodBoth = goodItems.filter(item => item.answer === 'Both').length;
                const neededA = Math.max(0, 5 - currentGoodA);
                const neededB = Math.max(0, 5 - currentGoodB);
                const neededBoth = Math.max(0, 2 - currentGoodBoth);

                const goodItemsText = goodItems.map((item, idx) =>
                    `${idx + 1}. "${item.text}" → ${item.answer}`
                ).join('\n');
                const badItemsText = badItems.map((item, idx) =>
                    `${idx + 1}. "${item.text}" → ${item.answer} (TROP ÉVIDENT)`
                ).join('\n');
                const rejectionReasons = obviousItemsFeedback
                    .map(item => `- "${item.text}": trop évident/prévisible`)
                    .join('\n');

                const targetedPrompt = prompts.PHASE2_TARGETED_REGENERATION_PROMPT
                    .replace('{OPTION_A}', proposal.optionA)
                    .replace('{OPTION_B}', proposal.optionB)
                    .replace('{GOOD_ITEMS}', goodItemsText)
                    .replace('{BAD_INDICES}', obviousIndices.map(i => i + 1).join(', '))
                    .replace('{BAD_ITEMS}', badItemsText)
                    .replace('{REJECTION_REASONS}', rejectionReasons)
                    .replace(/{COUNT}/g, String(obviousIndices.length))
                    .replace('{NEEDED_A}', String(neededA))
                    .replace('{NEEDED_B}', String(neededB))
                    .replace('{NEEDED_BOTH}', String(neededBoth))
                    + languageInstruction;

                try {
                    const regenText = await callGemini(targetedPrompt, 'creative');
                    const newItems = parseJsonArrayFromText<{
                        text: string;
                        answer: 'A' | 'B' | 'Both';
                        acceptedAnswers?: ('A' | 'B' | 'Both')[];
                        justification: string;
                        anecdote?: string;
                    }>(regenText);

                    const mergedItems = [
                        ...goodItems.map(item => ({
                            text: item.text,
                            answer: item.answer,
                            acceptedAnswers: item.acceptedAnswers,
                            justification: item.justification,
                            anecdote: item.anecdote
                        })),
                        ...newItems
                    ];

                    lastSet = {
                        optionA: proposal.optionA,
                        optionB: proposal.optionB,
                        optionADescription: proposal.optionADescription,
                        optionBDescription: proposal.optionBDescription,
                        humorousDescription: proposal.humorousDescription,
                        items: mergedItems.slice(0, 12)
                    };

                    console.log(`✅ Trap quality targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);
                    // Set flag to skip generator and re-validate directly
                    revalidateOnly = true;
                    previousFeedback = '';  // Clear feedback since we're re-validating, not regenerating
                    continue;
                } catch (err) {
                    console.warn('⚠️ Trap quality targeted regen failed:', err);
                }
            }

            // Full regen fallback
            const obviousItemsText = obviousItemsFeedback
                .map(item => `- "${item.text}"`)
                .join('\n');

            previousFeedback = `
⚠️ ITEMS TROP ÉVIDENTS (score pièges: ${trapQualityScore}/10)

Le set est ENNUYEUX car les réponses sont trop prévisibles.

Items trop évidents à remplacer :
${obviousItemsText || '(la plupart des items)'}

🎯 RAPPEL - Un bon piège :
- L'item SEMBLE appartenir à une catégorie mais appartient à l'AUTRE
- Le joueur doit HÉSITER avant de répondre
- La réponse est SURPRENANTE mais vérifiable

❌ À ÉVITER :
- Items où la réponse est immédiatement évidente
- Items qui ne créent aucun doute

Tu dois REMPLACER au moins 4-5 items par des PIÈGES contre-intuitifs.
`;
            continue;
        }

        // Check overall score (>= 7 is considered acceptable - increased from 6)
        if (review.overall_score >= 7) {
            console.log(`✅ Set validated by reviewer after ${i + 1} iteration(s)! (score: ${review.overall_score}/10, approved: ${review.approved})`);

            // === FACT-CHECK STEP ===
            // Run dedicated fact-checking on Phase 2 items
            if (!lastSet) {
                throw new Error('lastSet is null after successful review');
            }
            // Create local const for TypeScript narrowing inside callbacks
            const validSet = lastSet;
            const factCheckResult = await factCheckPhase2Items(validSet);

            if (factCheckResult.failed.length > 0) {
                console.log(`⚠️ Fact-check rejected ${factCheckResult.failed.length}/${validSet.items.length} items`);

                // Try targeted regen for failed fact-checks (up to 60%)
                if (shouldUseTargetedRegen(factCheckResult.failed.length, validSet.items.length)) {
                    const failedIndices = factCheckResult.failed.map(f =>
                        validSet.items.findIndex(item => item.text === f.item.text)
                    ).filter(idx => idx !== -1);

                    if (failedIndices.length > 0) {
                        console.log(`🔧 Phase 2 fact-check targeted regen: replacing ${failedIndices.length} items`);

                        const goodItems = validSet.items.filter((_, idx) => !failedIndices.includes(idx));
                        const badItems = validSet.items.filter((_, idx) => failedIndices.includes(idx));

                        // Calculate distribution needed
                        const currentGoodA = goodItems.filter(item => item.answer === 'A').length;
                        const currentGoodB = goodItems.filter(item => item.answer === 'B').length;
                        const currentGoodBoth = goodItems.filter(item => item.answer === 'Both').length;
                        const neededA = Math.max(0, 5 - currentGoodA);
                        const neededB = Math.max(0, 5 - currentGoodB);
                        const neededBoth = Math.max(0, 2 - currentGoodBoth);

                        const goodItemsText = goodItems.map((item, idx) =>
                            `${idx + 1}. "${item.text}" → ${item.answer}`
                        ).join('\n');
                        const badItemsText = badItems.map((item, idx) =>
                            `${idx + 1}. "${item.text}" → ${item.answer} (FACT-CHECK ÉCHOUÉ)`
                        ).join('\n');
                        const rejectionReasons = factCheckResult.failed
                            .map(f => `- "${f.item.text}": ${f.reason}`)
                            .join('\n');

                        const targetedPrompt = prompts.PHASE2_TARGETED_REGENERATION_PROMPT
                            .replace('{OPTION_A}', validSet.optionA)
                            .replace('{OPTION_B}', validSet.optionB)
                            .replace('{GOOD_ITEMS}', goodItemsText)
                            .replace('{BAD_INDICES}', failedIndices.map(i => i + 1).join(', '))
                            .replace('{BAD_ITEMS}', badItemsText)
                            .replace('{REJECTION_REASONS}', rejectionReasons)
                            .replace(/{COUNT}/g, String(failedIndices.length))
                            .replace('{NEEDED_A}', String(neededA))
                            .replace('{NEEDED_B}', String(neededB))
                            .replace('{NEEDED_BOTH}', String(neededBoth))
                            + languageInstruction;

                        try {
                            const regenText = await callGemini(targetedPrompt, 'creative');
                            const newItems = parseJsonArrayFromText<{
                                text: string;
                                answer: 'A' | 'B' | 'Both';
                                acceptedAnswers?: ('A' | 'B' | 'Both')[];
                                justification: string;
                                anecdote?: string;
                            }>(regenText);

                            const mergedItems = [
                                ...goodItems.map(item => ({
                                    text: item.text,
                                    answer: item.answer,
                                    acceptedAnswers: item.acceptedAnswers,
                                    justification: item.justification,
                                    anecdote: item.anecdote
                                })),
                                ...newItems
                            ];

                            lastSet = {
                                ...validSet,
                                items: mergedItems.slice(0, 12)
                            };

                            console.log(`✅ Phase 2 fact-check targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);
                            // Set flag to skip generator and re-validate directly
                            revalidateOnly = true;
                            previousFeedback = '';  // Clear feedback since we're re-validating, not regenerating
                            continue;
                        } catch (err) {
                            console.warn('⚠️ Phase 2 fact-check targeted regen failed:', err);
                        }
                    }
                }

                // Full regen if too many failures or targeted regen failed
                if (factCheckResult.failed.length > Math.floor(lastSet.items.length * TARGETED_REGEN_MAX_PERCENTAGE)) {
                    const failedFeedback = factCheckResult.failed
                        .map(f => `- "${f.item.text}" (${f.item.answer}): ${f.reason}`)
                        .join('\n');

                    previousFeedback = `
⚠️ VÉRIFICATION FACTUELLE ÉCHOUÉE

Le fact-checker externe a détecté des erreurs dans ces items :
${failedFeedback}

CRITIQUE : Les items doivent être CORRECTEMENT CATÉGORISÉS.
Vérifie que chaque item appartient VRAIMENT à la catégorie assignée (A, B, ou Both).
`;
                    continue; // Regenerate with feedback
                }

                // Otherwise, update set to only include passed items
                lastSet = {
                    ...lastSet,
                    items: factCheckResult.passed
                };
                console.log(`📋 Continuing with ${lastSet.items.length} fact-checked items`);
            } else {
                console.log(`✅ All ${lastSet.items.length} items passed fact-check!`);
            }

            // Run semantic deduplication on the approved set
            // Use findSemanticDuplicatesWithEmbeddings to generate embeddings once and reuse
            // IMPORTANT: Check against ALL phases to prevent cross-phase duplicates
            const itemsAsQuestions = lastSet.items.map(item => ({ text: item.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                // Generate embeddings once and reuse for both dedup checks and storage
                // checkAllPhases: true to detect cross-phase duplicates (P1↔P2, P2↔P4, etc.)
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(
                    itemsAsQuestions,
                    'phase2',
                    { checkAllPhases: true }
                );
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, itemsAsQuestions);
            } catch (err) {
                console.warn('⚠️ Duplicate check failed, skipping:', err);
            }

            // If duplicates found, REJECT and mark items for regeneration
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                const allDuplicates = [...semanticDuplicates, ...internalDuplicates];
                const duplicateIndices = new Set(allDuplicates.map(d => d.index));

                console.error(`❌ Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates - BLOCKING`);
                for (const dup of allDuplicates) {
                    console.log(`   - "${lastSet.items[dup.index].text}" ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }

                // Filter out duplicate items and keep only unique ones
                const uniqueItems = lastSet.items.filter((_, idx) => !duplicateIndices.has(idx));
                const uniqueEmbeddings = finalEmbeddings.filter((_, idx) => !duplicateIndices.has(idx));

                // If too many duplicates, trigger full regeneration by continuing loop
                if (uniqueItems.length < 6) {
                    console.warn(`⚠️ Only ${uniqueItems.length} unique items remaining - need full regeneration`);
                    // Don't return, let the loop continue for regeneration
                } else {
                    // Store only unique items and return partial set
                    console.log(`📦 Storing ${uniqueItems.length} unique items (filtered ${duplicateIndices.size} duplicates)`);
                    const uniqueItemsAsQuestions = uniqueItems.map(item => ({ text: item.text }));
                    if (uniqueEmbeddings.length > 0) {
                        await storeQuestionsWithEmbeddings(
                            uniqueItemsAsQuestions,
                            uniqueEmbeddings,
                            'phase2'
                        );
                    }
                    return { set: { ...lastSet, items: uniqueItems }, embeddings: uniqueEmbeddings };
                }
            } else {
                // No duplicates - store all items and return
                if (finalEmbeddings.length > 0) {
                    await storeQuestionsWithEmbeddings(
                        itemsAsQuestions,
                        finalEmbeddings,
                        'phase2'
                    );
                }
                return { set: lastSet, embeddings: finalEmbeddings };
            }
        }

        // 4. Decide: targeted item regeneration or full regeneration?
        // If homophone is good (>= 6) and b_concrete is good (>= 6), we can do targeted regeneration
        const canDoTargetedRegen = review.scores.phonetic >= 6 && bConcreteScore >= 6;

        // Find problematic items
        const badItemIndices = review.items_feedback
            .filter(item => !item.ok || (item as { is_too_obvious?: boolean }).is_too_obvious)
            .map(item => item.index);

        const goodItems = proposal.items.filter((_, idx) => !badItemIndices.includes(idx));
        const badItems = proposal.items.filter((_, idx) => badItemIndices.includes(idx));

        // If homophone is good and we have <= 60% bad items, do TARGETED regeneration
        if (canDoTargetedRegen && shouldUseTargetedRegen(badItemIndices.length, proposal.items.length)) {
            console.log(`🔧 Targeted regeneration: keeping homophone, replacing ${badItemIndices.length} items`);

            // Calculate distribution needed for replacement items
            const currentGoodA = goodItems.filter(item => item.answer === 'A').length;
            const currentGoodB = goodItems.filter(item => item.answer === 'B').length;
            const currentGoodBoth = goodItems.filter(item => item.answer === 'Both').length;

            // Target: 5A, 5B, 2Both
            const neededA = Math.max(0, 5 - currentGoodA);
            const neededB = Math.max(0, 5 - currentGoodB);
            const neededBoth = Math.max(0, 2 - currentGoodBoth);

            // Build targeted regeneration prompt
            const goodItemsText = goodItems.map((item, idx) =>
                `${idx + 1}. "${item.text}" → ${item.answer}`
            ).join('\n');

            const badItemsText = badItems.map((item, idx) =>
                `${idx + 1}. "${item.text}" → ${item.answer} (REJETÉ)`
            ).join('\n');

            const rejectionReasons = review.items_feedback
                .filter(item => !item.ok || (item as { is_too_obvious?: boolean }).is_too_obvious)
                .map(item => `- "${item.text}": ${item.issue || 'trop évident'}`)
                .join('\n');

            const targetedPrompt = prompts.PHASE2_TARGETED_REGENERATION_PROMPT
                .replace('{OPTION_A}', proposal.optionA)
                .replace('{OPTION_B}', proposal.optionB)
                .replace('{GOOD_ITEMS}', goodItemsText)
                .replace('{BAD_INDICES}', badItemIndices.map(i => i + 1).join(', '))
                .replace('{BAD_ITEMS}', badItemsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                .replace(/{COUNT}/g, String(badItemIndices.length))
                .replace('{NEEDED_A}', String(neededA))
                .replace('{NEEDED_B}', String(neededB))
                .replace('{NEEDED_BOTH}', String(neededBoth))
                + languageInstruction;

            try {
                const regenText = await callGemini(targetedPrompt, 'creative');
                const newItems = parseJsonArrayFromText<{
                    text: string;
                    answer: 'A' | 'B' | 'Both';
                    acceptedAnswers?: ('A' | 'B' | 'Both')[];
                    justification: string;
                    anecdote?: string;
                }>(regenText);

                // Merge: keep good items + add new items (preserve all fields)
                const mergedItems = [
                    ...goodItems.map(item => ({
                        text: item.text,
                        answer: item.answer,
                        acceptedAnswers: item.acceptedAnswers,
                        justification: item.justification,
                        anecdote: item.anecdote
                    })),
                    ...newItems.map(item => ({
                        text: item.text,
                        answer: item.answer,
                        acceptedAnswers: item.acceptedAnswers,
                        justification: item.justification,
                        anecdote: item.anecdote
                    }))
                ];

                // Update lastSet with merged items (keeping same homophone and descriptions)
                lastSet = {
                    optionA: proposal.optionA,
                    optionB: proposal.optionB,
                    optionADescription: proposal.optionADescription,
                    optionBDescription: proposal.optionBDescription,
                    humorousDescription: proposal.humorousDescription,
                    items: mergedItems.slice(0, 12) // Ensure max 12 items
                };

                console.log(`✅ Targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);

                // Set flag to skip generator and re-validate directly
                revalidateOnly = true;
                previousFeedback = '';  // Clear feedback since we're re-validating, not regenerating
                continue;
            } catch (err) {
                console.warn('⚠️ Targeted regeneration failed, falling back to full regen:', err);
            }
        }

        // FULL regeneration (homophone bad or targeted regen failed)
        const problemItems = review.items_feedback
            .filter(item => !item.ok)
            .map(item => `- Item ${item.index + 1} "${item.text}": ${item.issue}`)
            .join('\n');

        previousFeedback = `
⚠️ TENTATIVE PRÉCÉDENTE REJETÉE (score: ${review.overall_score}/10)

Ton set précédent :
- Option A : ${proposal.optionA}
- Option B : ${proposal.optionB}
- Reasoning : ${proposal.reasoning}

PROBLÈME HOMOPHONE :
${review.homophone_feedback}

ITEMS PROBLÉMATIQUES :
${problemItems || '(aucun item spécifique)'}

SUGGESTIONS DU REVIEWER :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

FEEDBACK GLOBAL :
${review.global_feedback}

→ CORRIGE ces problèmes dans ta nouvelle proposition.
→ NE RÉPÈTE PAS les mêmes erreurs.
→ CHANGE COMPLÈTEMENT le jeu de mots si le score phonétique < 6.
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating with feedback...`);
    }

    // If we reach here, use the BEST set seen (with valid phonetic), not the last one
    const fallbackSet = bestSet || lastSet;
    if (fallbackSet) {
        if (bestSet) {
            console.warn(`⚠️ Max iterations (${maxIterations}) reached. Using BEST set (score: ${bestScore}/10).`);
        } else {
            console.warn(`⚠️ Max iterations (${maxIterations}) reached. No valid phonetic found, using last set.`);
        }
        // Generate embeddings and store for future deduplication (even fallback)
        const fallbackItems = fallbackSet.items.map(item => ({ text: item.text }));
        const { embeddings: finalEmbeddings } = await findSemanticDuplicatesWithEmbeddings(fallbackItems, 'phase2');
        await storeQuestionsWithEmbeddings(fallbackItems, finalEmbeddings, 'phase2');

        return { set: fallbackSet, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen, but just in case
    throw new Error('Failed to generate Phase 2 set after all iterations');
}
