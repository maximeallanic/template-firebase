/**
 * Phase 3 menu generation with dialogue system
 * Generator/Reviewer iterative approach for themed menu questions
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
import { shouldUseTargetedRegen } from './targetedRegen';
import {
    Phase3Menu,
    Phase3DialogueReview,
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
 * Generate Phase 3 menus using dialogue between Generator and Reviewer agents
 * Creates 4 themed menus with 5 questions each: 3 normal + 1 trap menu
 */
export async function generatePhase3WithDialogue(
    topic: string,
    difficulty: string,
    language: SupportedLanguage = 'fr',
    maxIterations: number = 4
): Promise<{ menus: Phase3Menu[]; embeddings: number[][] }> {
    // Get language-specific prompts
    const prompts = getPrompts(language);
    const languageName = LANGUAGE_NAMES[language];

    console.log(`🎭 Starting Generator/Reviewer dialogue for Phase 3 (lang: ${language})...`);

    // Language instruction for non-English languages
    const languageInstruction = language !== 'en'
        ? `\n\n🌍 LANGUAGE: Generate ALL content in ${languageName}. Menu names, questions, and answers MUST be written in ${languageName}.`
        : '';

    let previousFeedback = '';
    let lastMenus: Phase3Menu[] = [];
    let bestMenus: Phase3Menu[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes menus
        const difficultyContext = getFullDifficultyContext(difficulty as DifficultyLevel);
        const generatorPrompt = prompts.PHASE3_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficultyContext)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback)
            + languageInstruction;

        console.log('🤖 Generator creating menus...');
        const proposalText = await callGemini(generatorPrompt, 'creative');
        let proposal: Phase3Menu[];

        try {
            proposal = parseJsonArrayFromText<Phase3Menu>(proposalText);
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue;
        }

        console.log(`📋 Generated ${proposal.length} menus`);
        for (const menu of proposal) {
            const trapIndicator = menu.isTrap ? ' 🎭 TRAP' : '';
            console.log(`   - "${menu.title}": ${menu.questions.length} questions${trapIndicator}`);
        }

        // Validate menu count (expecting 4 menus: 3 normal + 1 trap)
        if (proposal.length !== 4) {
            console.log(`❌ Expected 4 menus, got ${proposal.length}. Retrying...`);
            previousFeedback = `
⚠️ NOMBRE DE MENUS INCORRECT

Tu as généré ${proposal.length} menus, mais il en faut exactement 4 :
- 3 menus normaux (isTrap: false)
- 1 menu piège (isTrap: true)

Recommence avec 4 menus.
`;
            continue;
        }

        // Validate question count (each menu must have EXACTLY 5 questions)
        const menusWithWrongQuestionCount = proposal.filter(m => m.questions.length !== 5);
        if (menusWithWrongQuestionCount.length > 0) {
            const details = menusWithWrongQuestionCount
                .map((m) => {
                    const menuIndex = proposal.indexOf(m) + 1;
                    return `- Menu ${menuIndex} "${m.title}": ${m.questions.length} questions au lieu de 5`;
                })
                .join('\n');

            console.log(`❌ Some menus don't have exactly 5 questions. Retrying...`);
            previousFeedback = `
⚠️ NOMBRE DE QUESTIONS INCORRECT

CRITIQUE : CHAQUE menu doit avoir EXACTEMENT 5 questions !

Problèmes détectés :
${details}

Recommence et vérifie que TOUS les 4 menus ont bien 5 questions chacun (total = 20 questions).
`;
            continue;
        }

        // Validate trap menu presence
        const trapMenus = proposal.filter(m => m.isTrap === true);
        if (trapMenus.length !== 1) {
            console.log(`❌ Expected exactly 1 trap menu, got ${trapMenus.length}. Retrying...`);
            previousFeedback = `
⚠️ MENU PIÈGE MANQUANT OU INCORRECT

Tu as ${trapMenus.length} menu(s) piège(s), mais il en faut exactement 1.
- Mets "isTrap": true pour UN seul menu (celui avec les questions les plus difficiles)
- Les 3 autres menus doivent avoir "isTrap": false

Recommence avec exactement 1 menu piège.
`;
            continue;
        }

        lastMenus = proposal;

        // 2. Reviewer evaluates the menus
        const reviewerPrompt = prompts.PHASE3_DIALOGUE_REVIEWER_PROMPT
            .replace('{MENUS}', JSON.stringify(proposal, null, 2))
            + languageInstruction;

        console.log('👨‍⚖️ Reviewer evaluating menus...');
        const reviewText = await callGeminiForReview(reviewerPrompt, 'review');
        let review: Phase3DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase3DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue;
        }

        // Validate review structure
        if (!review.scores || !review.menus_feedback || !Array.isArray(review.menus_feedback)) {
            console.error('❌ Invalid review structure - missing required fields');
            console.log('Review keys:', Object.keys(review));
            continue;
        }

        // Ensure menus_feedback has questions_feedback arrays
        for (const menuFb of review.menus_feedback) {
            if (!menuFb.questions_feedback || !Array.isArray(menuFb.questions_feedback)) {
                menuFb.questions_feedback = [];
            }
        }

        // Log scores
        console.log(`📊 Scores: titles=${review.scores.title_creativity || 0}, descs=${review.scores.descriptions || 0}, variety=${review.scores.thematic_variety || 0}`);
        console.log(`          style=${review.scores.question_style}, factual=${review.scores.factual_accuracy}, clarity=${review.scores.clarity}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        if (review.scores.factual_accuracy < 7) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10).`);

            const problematicQuestions: string[] = [];
            for (const menuFb of review.menus_feedback) {
                for (const qFb of menuFb.questions_feedback) {
                    if (!qFb.ok && qFb.issues.includes('reponse_incorrecte')) {
                        problematicQuestions.push(`- Menu "${menuFb.title}", Q${qFb.index + 1}: "${qFb.question}" (correction: ${qFb.correction || 'N/A'})`);
                    }
                }
            }

            previousFeedback = `
⚠️ ERREURS FACTUELLES DÉTECTÉES (score: ${review.scores.factual_accuracy}/10)

Questions avec erreurs :
${problematicQuestions.join('\n') || '(Vérifier toutes les réponses)'}

CRITIQUE : Utilise Google Search pour VÉRIFIER chaque réponse.
`;
            continue;
        }

        if (review.scores.title_creativity < 5) {
            console.log(`❌ Titles too generic (${review.scores.title_creativity}/10).`);

            const genericTitles = review.menus_feedback
                .filter(m => !m.title_ok)
                .map(m => `- "${m.title}": ${m.title_issue || 'trop générique'}`)
                .join('\n');

            previousFeedback = `
⚠️ TITRES TROP GÉNÉRIQUES (score: ${review.scores.title_creativity}/10)

Titres à améliorer :
${genericTitles}

Rappel : Les titres doivent être CRÉATIFS et FUN, pas "Menu Culture Générale".
Exemples de bons titres : "Menu Catastrophes Culinaires", "Menu Scandales Royaux".
`;
            continue;
        }

        // Track best menus (only if all have 5 questions)
        if (review.overall_score > bestScore) {
            const allHave5Questions = lastMenus.every(m => m.questions.length === 5);
            if (allHave5Questions) {
                bestScore = review.overall_score;
                bestMenus = [...lastMenus];
                console.log(`📈 New best menus! Score: ${bestScore}/10`);
            } else {
                console.log(`⚠️ Skipping bestMenus update - not all menus have 5 questions`);
            }
        }

        // Check overall score
        if (review.overall_score >= 7) {
            console.log(`✅ Menus validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // CRITICAL: Final validation - ensure each menu has exactly 5 questions
            const menusWithWrongCount = lastMenus.filter(m => m.questions.length !== 5);
            if (menusWithWrongCount.length > 0) {
                const menuDetails = menusWithWrongCount
                    .map(m => `"${m.title}": ${m.questions.length}/5 questions`)
                    .join(', ');
                console.error(`❌ CRITICAL: Validated menus don't all have 5 questions: ${menuDetails}`);
                previousFeedback = `
⚠️ VALIDATION ÉCHOUÉE - NOMBRE DE QUESTIONS INCORRECT

Les menus suivants n'ont pas exactement 5 questions :
${menuDetails}

RÈGLE ABSOLUE : CHAQUE menu doit avoir EXACTEMENT 5 questions !
Recommence la génération complète en vérifiant le compte.
`;
                continue; // Force regeneration
            }

            // Fact-check all questions and regenerate failed ones
            const factCheckFailures: Array<{ menu_index: number; question_index: number; reason: string }> = [];

            for (let menuIdx = 0; menuIdx < lastMenus.length; menuIdx++) {
                const menu = lastMenus[menuIdx];
                const factCheckResult = await factCheckSimpleQuestions(menu.questions);

                if (factCheckResult.failed.length > 0) {
                    console.warn(`⚠️ Menu "${menu.title}": ${factCheckResult.failed.length} questions failed fact-check`);

                    for (const failed of factCheckResult.failed) {
                        // Find the question index in the menu
                        const qIdx = menu.questions.findIndex(q =>
                            q.question === failed.question.question && q.answer === failed.question.answer
                        );
                        if (qIdx !== -1) {
                            factCheckFailures.push({
                                menu_index: menuIdx,
                                question_index: qIdx,
                                reason: `fact-check: ${failed.reason}`
                            });
                            console.warn(`   - Q${qIdx + 1}: "${failed.question.question}" → "${failed.question.answer}" (${failed.reason})`);
                        }
                    }
                }
            }

            // If there are fact-check failures, try targeted regeneration
            if (factCheckFailures.length > 0 && factCheckFailures.length <= 8) {
                console.log(`🔧 Fact-check targeted regeneration: replacing ${factCheckFailures.length} questions`);

                const menusStructure = lastMenus.map(m => ({
                    title: m.title,
                    description: m.description,
                    question_count: m.questions.length
                }));

                const badQuestionsText = factCheckFailures.map(bq =>
                    `- Menu ${bq.menu_index + 1} Q${bq.question_index + 1}: "${lastMenus[bq.menu_index].questions[bq.question_index].question}" (${bq.reason})`
                ).join('\n');

                const rejectionReasons = factCheckFailures.map(bq => bq.reason).join('; ');

                const targetedPrompt = prompts.PHASE3_TARGETED_REGENERATION_PROMPT
                    .replace('{MENUS_STRUCTURE}', JSON.stringify(menusStructure, null, 2))
                    .replace('{BAD_QUESTIONS}', badQuestionsText)
                    .replace('{REJECTION_REASONS}', rejectionReasons)
                    + languageInstruction;

                try {
                    const regenText = await callGemini(targetedPrompt, 'creative');
                    interface ReplacementItem {
                        menu_index: number;
                        question_index: number;
                        new_question: string;
                        new_answer: string;
                    }
                    const replacements = parseJsonFromText(regenText) as { replacements: ReplacementItem[] };

                    // Apply replacements
                    for (const repl of replacements.replacements) {
                        if (lastMenus[repl.menu_index] && lastMenus[repl.menu_index].questions[repl.question_index]) {
                            console.log(`   ✓ Replaced Menu ${repl.menu_index + 1} Q${repl.question_index + 1}`);
                            lastMenus[repl.menu_index].questions[repl.question_index] = {
                                question: repl.new_question,
                                answer: repl.new_answer
                            };
                        }
                    }

                    console.log(`✅ Applied ${replacements.replacements.length} fact-check replacements`);
                } catch (err) {
                    console.warn('⚠️ Fact-check targeted regeneration failed, keeping original questions:', err);
                }
            } else if (factCheckFailures.length > 8) {
                console.warn(`⚠️ Too many fact-check failures (${factCheckFailures.length}), keeping original questions`);
            }

            // Run semantic deduplication and generate embeddings in one pass
            const allQuestions = lastMenus.flatMap(m => m.questions.map(q => q.question));
            const questionsAsItems = allQuestions.map(q => ({ text: q }));

            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];
            let finalEmbeddings: number[][] = [];

            try {
                const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase3');
                semanticDuplicates = dedupResult.duplicates;
                finalEmbeddings = dedupResult.embeddings;
                internalDuplicates = findInternalDuplicates(finalEmbeddings, questionsAsItems);
            } catch (err) {
                console.warn('⚠️ Phase 3 duplicate check failed, skipping:', err);
            }

            // Log duplicates if found (Phase 3 doesn't filter, just logs)
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                console.warn(`⚠️ Phase 3: Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${questionsAsItems[dup.index]?.text?.slice(0, 40)}..." ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }
            }

            // Store for deduplication (reusing already-generated embeddings)
            if (finalEmbeddings.length > 0) {
                await storeQuestionsWithEmbeddings(
                    questionsAsItems,
                    finalEmbeddings,
                    'phase3'
                );
            }

            return { menus: lastMenus, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration for bad questions
        const badQuestions: Array<{ menu_index: number; question_index: number; reason: string }> = [];
        for (const menuFb of review.menus_feedback) {
            for (const qFb of menuFb.questions_feedback) {
                if (!qFb.ok) {
                    badQuestions.push({
                        menu_index: menuFb.menu_index,
                        question_index: qFb.index,
                        reason: qFb.issues.join(', ') || 'problème non spécifié'
                    });
                }
            }
        }

        // Calculate total questions across all menus
        const totalQuestions = lastMenus.reduce((sum, menu) => sum + menu.questions.length, 0);

        if (shouldUseTargetedRegen(badQuestions.length, totalQuestions, 5, review.overall_score)) {
            console.log(`🔧 Targeted regeneration: replacing ${badQuestions.length} questions`);

            const menusStructure = lastMenus.map(m => ({
                title: m.title,
                description: m.description,
                question_count: m.questions.length
            }));

            const badQuestionsText = badQuestions.map(bq =>
                `- Menu ${bq.menu_index + 1} Q${bq.question_index + 1}: "${lastMenus[bq.menu_index].questions[bq.question_index].question}" (${bq.reason})`
            ).join('\n');

            const rejectionReasons = badQuestions.map(bq => bq.reason).join('; ');

            const targetedPrompt = prompts.PHASE3_TARGETED_REGENERATION_PROMPT
                .replace('{MENUS_STRUCTURE}', JSON.stringify(menusStructure, null, 2))
                .replace('{BAD_QUESTIONS}', badQuestionsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                + languageInstruction;

            try {
                const regenText = await callGemini(targetedPrompt, 'creative');
                interface ReplacementItem {
                    menu_index: number;
                    question_index: number;
                    new_question: string;
                    new_answer: string;
                }
                const replacements = parseJsonFromText(regenText) as { replacements: ReplacementItem[] };

                // Apply replacements
                for (const repl of replacements.replacements) {
                    if (lastMenus[repl.menu_index] && lastMenus[repl.menu_index].questions[repl.question_index]) {
                        lastMenus[repl.menu_index].questions[repl.question_index] = {
                            question: repl.new_question,
                            answer: repl.new_answer
                        };
                    }
                }

                console.log(`✅ Applied ${replacements.replacements.length} replacements`);
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

${replacements.replacements.length} questions remplacées.
Le reviewer va maintenant re-valider les menus.
`;
                continue;
            } catch (err) {
                console.warn('⚠️ Targeted regeneration failed:', err);
            }
        }

        // Full regeneration feedback
        previousFeedback = `
⚠️ TENTATIVE REJETÉE (score: ${review.overall_score}/10)

${review.global_feedback}

SUGGESTIONS :
${review.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

→ CORRIGE ces problèmes.
`;

        console.log(`❌ Rejected (score ${review.overall_score}/10). Iterating...`);
    }

    // Fallback to best menus
    let fallbackMenus = bestMenus.length > 0 ? bestMenus : lastMenus;
    if (fallbackMenus.length > 0) {
        console.warn(`⚠️ Max iterations reached. Using best menus (score: ${bestScore}/10).`);

        // CRITICAL: Ensure we have exactly 4 menus (3 normal + 1 trap)
        // If we don't have 4 menus, throw an error so frontend uses default PHASE3_DATA
        if (fallbackMenus.length !== 4) {
            console.error(`❌ FALLBACK FAILED: Only ${fallbackMenus.length} menus generated, need exactly 4`);
            throw new Error(`Insufficient menus generated: ${fallbackMenus.length}/4 - frontend will use default data`);
        }

        // CRITICAL: Ensure each menu has exactly 5 questions
        // If some menus are incomplete, pad them with placeholder questions
        for (let menuIdx = 0; menuIdx < fallbackMenus.length; menuIdx++) {
            const menu = fallbackMenus[menuIdx];
            const missingCount = 5 - menu.questions.length;

            if (missingCount > 0) {
                console.warn(`⚠️ FALLBACK: Menu "${menu.title}" has only ${menu.questions.length}/5 questions. Adding ${missingCount} placeholder(s)...`);

                // Add simple placeholder questions to complete the menu
                for (let i = 0; i < missingCount; i++) {
                    menu.questions.push({
                        question: `Question bonus ${i + 1} : Quel est le thème de ce menu ?`,
                        answer: menu.title.replace('Menu ', '')
                    });
                }
            } else if (missingCount < 0) {
                // Menu has too many questions - trim to 5
                console.warn(`⚠️ FALLBACK: Menu "${menu.title}" has ${menu.questions.length} questions. Trimming to 5...`);
                menu.questions = menu.questions.slice(0, 5);
            }
        }

        // Ensure exactly one trap menu exists (fallback logic)
        const trapCount = fallbackMenus.filter(m => m.isTrap === true).length;
        if (trapCount !== 1) {
            console.warn(`⚠️ Trap menu fix: found ${trapCount} trap(s), expected 1. Auto-assigning...`);
            // Reset all isTrap to false first
            fallbackMenus = fallbackMenus.map(m => ({ ...m, isTrap: false }));
            // Pick a random menu to be the trap (index 0-3)
            const trapIndex = Math.floor(Math.random() * fallbackMenus.length);
            fallbackMenus[trapIndex].isTrap = true;
            console.log(`   → Menu "${fallbackMenus[trapIndex].title}" marked as trap`);
        }
        const allQuestions = fallbackMenus.flatMap(m => m.questions.map(q => q.question));
        const questionsAsItems = allQuestions.map(q => ({ text: q }));

        // Run deduplication and generate embeddings
        let finalEmbeddings: number[][] = [];
        try {
            const dedupResult = await findSemanticDuplicatesWithEmbeddings(questionsAsItems, 'phase3');
            finalEmbeddings = dedupResult.embeddings;

            if (dedupResult.duplicates.length > 0) {
                console.warn(`⚠️ Phase 3 fallback: Found ${dedupResult.duplicates.length} duplicates`);
            }
        } catch (err) {
            console.warn('⚠️ Phase 3 fallback dedup failed:', err);
        }

        if (finalEmbeddings.length > 0) {
            await storeQuestionsWithEmbeddings(
                questionsAsItems,
                finalEmbeddings,
                'phase3'
            );
        }

        return { menus: fallbackMenus, embeddings: finalEmbeddings };
    }

    throw new Error('Failed to generate Phase 3 menus after all iterations');
}
