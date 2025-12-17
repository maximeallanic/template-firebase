import { z } from 'zod';
import { ai, genAI, MODEL_CONFIG, MODEL_CONFIG_FACTUAL } from '../config/genkit';
import {
    GAME_GENERATION_SYSTEM_PROMPT,
    GENERATE_TOPIC_PROMPT,
    GENERATE_TOPIC_PHASE2_PROMPT,
    PHASE1_PROMPT,
    PHASE2_PROMPT,
    PHASE3_PROMPT,
    PHASE4_PROMPT,
    PHASE5_PROMPT,
    PHASE2_GENERATOR_PROMPT,
    PHASE2_DIALOGUE_REVIEWER_PROMPT,
    PHASE2_TARGETED_REGENERATION_PROMPT,
    PHASE1_GENERATOR_PROMPT,
    PHASE1_DIALOGUE_REVIEWER_PROMPT,
    PHASE1_TARGETED_REGENERATION_PROMPT
} from '../prompts';
import { calculateCost, formatCost } from '../utils/costCalculator';
import {
    findSemanticDuplicates,
    findInternalDuplicates,
    generateEmbeddings,
    storeQuestionsWithEmbeddings,
    type SemanticDuplicate
} from '../utils/embeddingService';

// --- TYPES ---

interface Phase1Question {
    text: string;
    options: string[];
    correctIndex: number;
    anecdote?: string;
}

interface Phase2Set {
    optionA: string;
    optionB: string;
    items: Array<{ text: string; answer: 'A' | 'B' | 'Both'; justification?: string }>;
}

// --- DIALOGUE REVIEW TYPES ---

interface Phase2GeneratorResponse {
    optionA: string;
    optionB: string;
    reasoning: string;
    items: Array<{
        text: string;
        answer: 'A' | 'B' | 'Both';
        justification: string;
    }>;
}

interface Phase2DialogueReview {
    approved: boolean;
    scores: {
        phonetic: number;
        concrete: number;
        distribution: number;
        clarity: number;
        b_concrete: number;
        humor: number;
        celebrities: number;
        both_detection: number;
        trap_quality: number;
    };
    overall_score: number;
    homophone_feedback: string;
    items_feedback: Array<{
        index: number;
        text: string;
        current_answer: string;
        ok: boolean;
        issue: string;
        should_be_both?: boolean;
        both_reasoning?: string;
        is_trap?: boolean;
        is_too_obvious?: boolean;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- PHASE 1 DIALOGUE TYPES ---

interface Phase1GeneratorQuestion {
    text: string;
    options: string[];
    correctIndex: number;
    anecdote: string;
    verification?: string; // Optional - how the fact was verified
}

interface Phase1DialogueReview {
    approved: boolean;
    scores: {
        factual_accuracy: number;
        clarity: number;
        burger_quiz_style: number;
        variety: number;
        anecdotes: number;
        celebrities: number;
    };
    overall_score: number;
    questions_feedback: Array<{
        index: number;
        text: string;
        ok: boolean;
        issue: string;
        issue_type: 'factual_error' | 'ambiguous' | 'boring' | 'too_long' | 'bad_anecdote' | null;
    }>;
    global_feedback: string;
    suggestions: string[];
}

// --- SCHEMAS ---

export const GameGenerationInputSchema = z.object({
    phase: z.enum(['phase1', 'phase2', 'phase3', 'phase4', 'phase5']),
    topic: z.string().optional().default('General Knowledge'),
    difficulty: z.enum(['easy', 'normal', 'hard', 'wtf']).optional().default('normal')
});

export const GameGenerationOutputSchema = z.object({
    data: z.any(), // Flexible output based on phase
    phase: z.string(),
    topic: z.string(), // The topic used for generation (may be AI-generated)
    embeddings: z.array(z.array(z.number())).optional(), // Embeddings for deduplication
    usage: z.object({
        totalTokens: z.number(),
        thinkingTokens: z.number(),
        estimatedCost: z.number(),
    }),
});

// --- HELPER ---

function getPromptForPhase(phase: string, topic: string, difficulty: string): string {
    let promptTemplate = '';
    switch (phase) {
        case 'phase1': promptTemplate = PHASE1_PROMPT; break;
        case 'phase2': promptTemplate = PHASE2_PROMPT; break;
        case 'phase3': promptTemplate = PHASE3_PROMPT; break;
        case 'phase4': promptTemplate = PHASE4_PROMPT; break;
        case 'phase5': promptTemplate = PHASE5_PROMPT; break;
        default: return '';
    }

    return promptTemplate
        .replace('{TOPIC}', topic)
        .replace('{DIFFICULTY}', difficulty);
}

// --- REVIEW FUNCTIONS ---

async function callGeminiWithSearch(prompt: string, useFactualConfig = false): Promise<string> {
    // Google Search grounding only available with Vertex AI (not API key)
    const useGoogleSearch = !process.env.GEMINI_API_KEY;
    const config = useFactualConfig ? MODEL_CONFIG_FACTUAL : MODEL_CONFIG;

    console.log(`🔧 Using model: ${config.model}, factual: ${useFactualConfig}, API key mode: ${!!process.env.GEMINI_API_KEY}`);

    const response = await genAI.models.generateContent({
        model: config.model,
        config: {
            ...config.config,
            ...(useGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const text = response.text || '';
    if (!text) {
        console.error('⚠️ Empty response from model. Full response:', JSON.stringify(response, null, 2));
    }
    return text;
}

function parseJsonFromText(text: string): unknown {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
}

/**
 * Generate a creative topic using AI
 * Fast call to get a fun, original theme for the quiz
 * @param phase - The game phase (phase2 uses special prompt for homophones)
 */
async function generateCreativeTopic(phase?: string): Promise<string> {
    console.log('🎲 Generating creative topic with AI...');

    // Use specific prompt for Phase 2 (homophones need specific topics)
    const prompt = phase === 'phase2' ? GENERATE_TOPIC_PHASE2_PROMPT : GENERATE_TOPIC_PROMPT;

    const response = await genAI.models.generateContent({
        model: MODEL_CONFIG.model,
        config: {
            ...MODEL_CONFIG.config,
            maxOutputTokens: 50, // Very short response expected
            temperature: 1.2, // Higher creativity
        },
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Clean up the response - remove quotes, extra spaces, etc.
    const topic = (response.text || 'Culture générale')
        .trim()
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/\n/g, ' ')
        .slice(0, 60); // Max 60 chars

    console.log(`✨ AI generated topic: "${topic}"`);
    return topic;
}

/**
 * Generate Phase 2 set using dialogue between Generator and Reviewer agents
 * The two agents iterate until the set passes quality criteria
 */
async function generatePhase2WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 5
): Promise<{ set: Phase2Set; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 2...');

    let previousFeedback = '';
    let lastSet: Phase2Set | null = null;

    // Track the BEST set seen so far (for fallback when max iterations reached)
    let bestSet: Phase2Set | null = null;
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes a complete set
        const generatorPrompt = PHASE2_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating set...');
        const proposalText = await callGeminiWithSearch(generatorPrompt);
        let proposal: Phase2GeneratorResponse;

        try {
            proposal = parseJsonFromText(proposalText) as Phase2GeneratorResponse;
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue; // Skip to next iteration
        }

        console.log(`🎯 Proposition: "${proposal.optionA}" vs "${proposal.optionB}"`);
        console.log(`   Reasoning: ${proposal.reasoning}`);

        // Store last set (in case we reach max iterations) - preserve justification
        lastSet = {
            optionA: proposal.optionA,
            optionB: proposal.optionB,
            items: proposal.items.map(item => ({ text: item.text, answer: item.answer, justification: item.justification }))
        };

        // 2. Reviewer evaluates the complete set
        const reviewerPrompt = PHASE2_DIALOGUE_REVIEWER_PROMPT
            .replace('{SET}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating set...');
        const reviewText = await callGeminiWithSearch(reviewerPrompt);
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
        // CRITICAL: Phonetic score must be >= 7, otherwise homophone is too weak
        if (review.scores.phonetic < 7) {
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
            const obviousItems = (review.items_feedback as Array<{ index: number; text: string; is_too_obvious?: boolean }>)
                .filter(item => item.is_too_obvious)
                .map(item => `- "${item.text}"`)
                .join('\n');

            previousFeedback = `
⚠️ ITEMS TROP ÉVIDENTS (score pièges: ${trapQualityScore}/10)

Le set est ENNUYEUX car les réponses sont trop prévisibles.

Items trop évidents à remplacer :
${obviousItems || '(la plupart des items)'}

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

        // Check overall score (>= 6 is considered acceptable when phonetic is good)
        if (review.overall_score >= 6) {
            console.log(`✅ Set validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10, approved: ${review.approved})`);

            // Run semantic deduplication on the approved set
            const itemsAsQuestions = lastSet.items.map(item => ({ text: item.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];

            try {
                semanticDuplicates = await findSemanticDuplicates(itemsAsQuestions, 'phase2');
                const embeddings = await generateEmbeddings(lastSet.items.map(item => item.text));
                internalDuplicates = findInternalDuplicates(embeddings, itemsAsQuestions);
            } catch (err) {
                console.warn('⚠️ Duplicate check failed, skipping:', err);
            }

            // If duplicates found, note them but continue (set was approved by reviewer)
            if (semanticDuplicates.length > 0 || internalDuplicates.length > 0) {
                console.warn(`⚠️ Found ${semanticDuplicates.length} semantic + ${internalDuplicates.length} internal duplicates`);
                for (const dup of [...semanticDuplicates, ...internalDuplicates]) {
                    console.log(`   - "${lastSet.items[dup.index].text}" ≈ "${dup.similarTo.slice(0, 30)}..." (${(dup.score * 100).toFixed(0)}%)`);
                }
            }

            // Generate final embeddings for storage
            const finalEmbeddings = await generateEmbeddings(lastSet.items.map(item => item.text));

            // Store questions with embeddings for future deduplication
            await storeQuestionsWithEmbeddings(
                lastSet.items.map(item => ({ text: item.text })),
                finalEmbeddings,
                'phase2'
            );

            return { set: lastSet, embeddings: finalEmbeddings };
        }

        // 4. Decide: targeted item regeneration or full regeneration?
        // If homophone is good (>= 7) and b_concrete is good (>= 6), we can do targeted regeneration
        const canDoTargetedRegen = review.scores.phonetic >= 7 && bConcreteScore >= 6;

        // Find problematic items
        const badItemIndices = review.items_feedback
            .filter(item => !item.ok || (item as { is_too_obvious?: boolean }).is_too_obvious)
            .map(item => item.index);

        const goodItems = proposal.items.filter((_, idx) => !badItemIndices.includes(idx));
        const badItems = proposal.items.filter((_, idx) => badItemIndices.includes(idx));

        // If homophone is good and we have some bad items, do TARGETED regeneration
        if (canDoTargetedRegen && badItemIndices.length > 0 && badItemIndices.length <= 6) {
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

            const targetedPrompt = PHASE2_TARGETED_REGENERATION_PROMPT
                .replace('{OPTION_A}', proposal.optionA)
                .replace('{OPTION_B}', proposal.optionB)
                .replace('{GOOD_ITEMS}', goodItemsText)
                .replace('{BAD_INDICES}', badItemIndices.map(i => i + 1).join(', '))
                .replace('{BAD_ITEMS}', badItemsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                .replace(/{COUNT}/g, String(badItemIndices.length))
                .replace('{NEEDED_A}', String(neededA))
                .replace('{NEEDED_B}', String(neededB))
                .replace('{NEEDED_BOTH}', String(neededBoth));

            try {
                const regenText = await callGeminiWithSearch(targetedPrompt);
                const newItems = parseJsonFromText(regenText) as Array<{ text: string; answer: 'A' | 'B' | 'Both'; justification: string }>;

                // Merge: keep good items + add new items (preserve justification)
                const mergedItems = [
                    ...goodItems.map(item => ({ text: item.text, answer: item.answer, justification: item.justification })),
                    ...newItems.map(item => ({ text: item.text, answer: item.answer, justification: item.justification }))
                ];

                // Update lastSet with merged items (keeping same homophone)
                lastSet = {
                    optionA: proposal.optionA,
                    optionB: proposal.optionB,
                    items: mergedItems.slice(0, 12) // Ensure max 12 items
                };

                console.log(`✅ Targeted regen: merged ${goodItems.length} good + ${newItems.length} new items`);

                // Continue to next iteration to re-validate
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

Homophone conservé : "${proposal.optionA}" vs "${proposal.optionB}"
Items gardés : ${goodItems.length}
Nouveaux items : ${newItems.length}

Le reviewer va maintenant re-valider le set complet.
`;
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
        const finalEmbeddings = await generateEmbeddings(fallbackSet.items.map(item => item.text));

        // Store questions with embeddings for future deduplication (even fallback)
        await storeQuestionsWithEmbeddings(
            fallbackSet.items.map(item => ({ text: item.text })),
            finalEmbeddings,
            'phase2'
        );

        return { set: fallbackSet, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen, but just in case
    throw new Error('Failed to generate Phase 2 set after all iterations');
}

/**
 * Generate Phase 1 questions using dialogue between Generator and Reviewer agents
 * The two agents iterate until questions pass quality criteria
 */
async function generatePhase1WithDialogue(
    topic: string,
    difficulty: string,
    maxIterations: number = 4
): Promise<{ questions: Phase1Question[]; embeddings: number[][] }> {
    console.log('🎭 Starting Generator/Reviewer dialogue for Phase 1...');

    let previousFeedback = '';
    let lastQuestions: Phase1Question[] = [];

    // Track the BEST questions seen so far (for fallback when max iterations reached)
    let bestQuestions: Phase1Question[] = [];
    let bestScore = 0;

    for (let i = 0; i < maxIterations; i++) {
        console.log(`\n🔄 === ITERATION ${i + 1}/${maxIterations} ===`);

        // 1. Generator proposes questions
        const generatorPrompt = PHASE1_GENERATOR_PROMPT
            .replace('{TOPIC}', topic)
            .replace('{DIFFICULTY}', difficulty)
            .replace('{PREVIOUS_FEEDBACK}', previousFeedback);

        console.log('🤖 Generator creating questions...');
        const proposalText = await callGeminiWithSearch(generatorPrompt, true); // Use factual config for Phase 1
        let proposal: Phase1GeneratorQuestion[];

        try {
            proposal = parseJsonFromText(proposalText) as Phase1GeneratorQuestion[];
        } catch (err) {
            console.error('❌ Failed to parse generator response:', err);
            console.log('Raw response:', proposalText.slice(0, 500));
            continue; // Skip to next iteration
        }

        console.log(`📝 Generated ${proposal.length} questions`);

        // Store for fallback
        lastQuestions = proposal.map(q => ({
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            anecdote: q.anecdote
        }));

        // 2. Reviewer evaluates the questions
        const reviewerPrompt = PHASE1_DIALOGUE_REVIEWER_PROMPT
            .replace('{QUESTIONS}', JSON.stringify(proposal, null, 2));

        console.log('👨‍⚖️ Reviewer evaluating questions...');
        const reviewText = await callGeminiWithSearch(reviewerPrompt, true); // Use factual config for Phase 1
        let review: Phase1DialogueReview;

        try {
            review = parseJsonFromText(reviewText) as Phase1DialogueReview;
        } catch (err) {
            console.error('❌ Failed to parse reviewer response:', err);
            console.log('Raw response:', reviewText.slice(0, 500));
            continue; // Skip to next iteration
        }

        // Log scores
        console.log(`📊 Scores: factual=${review.scores.factual_accuracy}, clarity=${review.scores.clarity}, style=${review.scores.burger_quiz_style}`);
        console.log(`          variety=${review.scores.variety}, anecdotes=${review.scores.anecdotes}, celebrities=${review.scores.celebrities}`);
        console.log(`   Overall: ${review.overall_score}/10`);

        // 3. Check critical criteria
        // CRITICAL: Factual accuracy must be >= 7
        if (review.scores.factual_accuracy < 7) {
            console.log(`❌ Factual accuracy too low (${review.scores.factual_accuracy}/10). Questions have errors!`);

            const problematicQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'factual_error')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

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

        // CRITICAL: Clarity must be >= 6
        if (review.scores.clarity < 6) {
            console.log(`❌ Clarity too low (${review.scores.clarity}/10). Questions are ambiguous!`);

            const ambiguousQuestions = review.questions_feedback
                .filter(q => !q.ok && q.issue_type === 'ambiguous')
                .map(q => `- Q${q.index + 1}: "${q.text}" → ${q.issue}`)
                .join('\n');

            previousFeedback = `
⚠️ QUESTIONS REJETÉES - AMBIGUÏTÉ (score clarté: ${review.scores.clarity}/10)

Les questions suivantes sont AMBIGUËS :
${ambiguousQuestions || '(Reformuler pour avoir une seule réponse possible)'}

CRITIQUE : Chaque question doit avoir UNE SEULE réponse correcte.
Si plusieurs réponses pourraient être valides → reformule la question.
`;
            continue;
        }

        // Track the BEST questions seen so far (only if critical scores are acceptable)
        if (review.overall_score > bestScore) {
            bestScore = review.overall_score;
            bestQuestions = [...lastQuestions];
            console.log(`📈 New best questions! Score: ${bestScore}/10`);
        }

        // Check overall score (>= 6 is considered acceptable)
        if (review.overall_score >= 6) {
            console.log(`✅ Questions validated after ${i + 1} iteration(s)! (score: ${review.overall_score}/10)`);

            // Run semantic deduplication
            const questionsAsItems = lastQuestions.map(q => ({ text: q.text }));
            let semanticDuplicates: SemanticDuplicate[] = [];
            let internalDuplicates: SemanticDuplicate[] = [];

            try {
                semanticDuplicates = await findSemanticDuplicates(questionsAsItems, 'phase1');
                const embeddings = await generateEmbeddings(lastQuestions.map(q => q.text));
                internalDuplicates = findInternalDuplicates(embeddings, questionsAsItems);
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

                // Filter out duplicates
                lastQuestions = lastQuestions.filter((_, idx) => !duplicateIndices.has(idx));

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

            // Generate final embeddings
            const finalEmbeddings = await generateEmbeddings(lastQuestions.map(q => q.text));

            // Store questions with embeddings for future deduplication
            await storeQuestionsWithEmbeddings(
                lastQuestions.map(q => ({ text: q.text })),
                finalEmbeddings,
                'phase1'
            );

            return { questions: lastQuestions, embeddings: finalEmbeddings };
        }

        // 4. Try targeted regeneration if only a few questions are bad
        const badQuestionIndices = review.questions_feedback
            .filter(q => !q.ok)
            .map(q => q.index);

        // If only 1-4 questions are bad and overall score is decent, do targeted regeneration
        if (badQuestionIndices.length > 0 && badQuestionIndices.length <= 4 && review.overall_score >= 5) {
            console.log(`🔧 Targeted regeneration: replacing ${badQuestionIndices.length} questions`);

            const goodQuestions = lastQuestions.filter((_, idx) => !badQuestionIndices.includes(idx));
            const badQuestionsData = lastQuestions.filter((_, idx) => badQuestionIndices.includes(idx));

            const goodQuestionsText = goodQuestions.map((q, idx) =>
                `${idx + 1}. "${q.text}" → ${q.options[q.correctIndex]}`
            ).join('\n');

            const badQuestionsText = badQuestionsData.map((q, idx) =>
                `${idx + 1}. "${q.text}" (REJETÉ)`
            ).join('\n');

            const rejectionReasons = review.questions_feedback
                .filter(q => !q.ok)
                .map(q => `- Q${q.index + 1}: ${q.issue} (${q.issue_type})`)
                .join('\n');

            const targetedPrompt = PHASE1_TARGETED_REGENERATION_PROMPT
                .replace('{TOPIC}', topic)
                .replace('{DIFFICULTY}', difficulty)
                .replace('{GOOD_QUESTIONS}', goodQuestionsText)
                .replace('{BAD_INDICES}', badQuestionIndices.map(i => i + 1).join(', '))
                .replace('{BAD_QUESTIONS}', badQuestionsText)
                .replace('{REJECTION_REASONS}', rejectionReasons)
                .replace(/{COUNT}/g, String(badQuestionIndices.length));

            try {
                const regenText = await callGeminiWithSearch(targetedPrompt, true); // Use factual config for Phase 1
                const newQuestions = parseJsonFromText(regenText) as Phase1GeneratorQuestion[];

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

                lastQuestions = mergedQuestions.slice(0, 10); // Ensure max 10 questions
                console.log(`✅ Targeted regen: merged ${goodQuestions.length} good + ${newQuestions.length} new questions`);

                // Continue to next iteration to re-validate
                previousFeedback = `
⚠️ RÉGÉNÉRATION CIBLÉE EFFECTUÉE

Questions gardées : ${goodQuestions.length}
Nouvelles questions : ${newQuestions.length}

Le reviewer va maintenant re-valider le set complet.
`;
                continue;
            } catch (err) {
                console.warn('⚠️ Targeted regeneration failed, falling back to full regen:', err);
            }
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
- Clarté : ${review.scores.clarity}/10
- Style Burger Quiz : ${review.scores.burger_quiz_style}/10
- Variété : ${review.scores.variety}/10
- Anecdotes : ${review.scores.anecdotes}/10
- Célébrités : ${review.scores.celebrities}/10

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
        const finalEmbeddings = await generateEmbeddings(fallbackQuestions.map(q => q.text));

        // Store questions with embeddings for future deduplication (even fallback)
        await storeQuestionsWithEmbeddings(
            fallbackQuestions.map(q => ({ text: q.text })),
            finalEmbeddings,
            'phase1'
        );

        return { questions: fallbackQuestions, embeddings: finalEmbeddings };
    }

    // Fallback: this shouldn't happen
    throw new Error('Failed to generate Phase 1 questions after all iterations');
}

// --- GENKIT FLOW ---

export const generateGameQuestionsFlow = ai.defineFlow(
    {
        name: 'generateGameQuestions',
        inputSchema: GameGenerationInputSchema,
        outputSchema: GameGenerationOutputSchema,
    },
    async (input) => {
        const { phase, difficulty } = input;

        // Generate creative topic with AI if none provided or default
        // Phase 2 uses a specific prompt for topics that work well with homophones
        const topic = (!input.topic || input.topic === 'General Knowledge')
            ? await generateCreativeTopic(phase)
            : input.topic;

        console.log(`🎲 Generating ${phase} content on topic: "${topic}" (${difficulty})`);

        // Track start time for metrics
        const startTime = Date.now();

        // For Phase 1 and Phase 2: Use reviewed generation with retry + embeddings
        // For other phases: Direct generation without review
        let jsonData: unknown;
        let embeddings: number[][] | undefined;

        if (phase === 'phase1') {
            // Phase 1: Generator/Reviewer dialogue system
            console.log('📋 Using dialogue system for Phase 1...');
            const result = await generatePhase1WithDialogue(topic, difficulty);
            jsonData = result.questions;
            embeddings = result.embeddings;

        } else if (phase === 'phase2') {
            // Phase 2: Generator/Reviewer dialogue system
            console.log('📋 Using dialogue system for Phase 2...');
            const result = await generatePhase2WithDialogue(topic, difficulty);
            jsonData = result.set;
            embeddings = result.embeddings;

        } else {
            // Phase 3, 4, 5: Direct generation (no review agent yet)
            const userPrompt = getPromptForPhase(phase, topic, difficulty);

            if (!userPrompt) {
                throw new Error(`Invalid phase: ${phase}`);
            }

            const fullPrompt = `${GAME_GENERATION_SYSTEM_PROMPT}\n\nTasks:\n${userPrompt}`;

            // Google Search grounding only available with Vertex AI (not API key)
            const useGoogleSearch = !process.env.GEMINI_API_KEY;

            const response = await genAI.models.generateContent({
                model: MODEL_CONFIG.model,
                config: {
                    ...MODEL_CONFIG.config,
                    ...(useGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: fullPrompt }]
                }]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);

            const text = response.text || '';

            try {
                const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                if (!jsonMatch) throw new Error('No JSON found');
                jsonData = JSON.parse(jsonMatch[0]);
            } catch {
                console.error('Failed to parse GenAI response:', text);
                throw new Error('AI Generation failed to produce valid JSON');
            }
        }

        // Calculate approximate metrics (review calls add overhead)
        const elapsedMs = Date.now() - startTime;
        const estimatedTokens = phase === 'phase1' || phase === 'phase2'
            ? 15000  // Higher estimate for reviewed phases (multiple API calls)
            : 5000;  // Standard estimate for direct generation

        const estimatedCost = calculateCost(estimatedTokens * 0.3, estimatedTokens * 0.7);

        // Log structured metrics for observability
        const metrics = {
            phase,
            topic,
            difficulty,
            durationMs: elapsedMs,
            durationSec: (elapsedMs / 1000).toFixed(1),
            estimatedTokens,
            estimatedCost: formatCost(estimatedCost),
            questionsCount: phase === 'phase1'
                ? (jsonData as Phase1Question[]).length
                : phase === 'phase2'
                    ? (jsonData as Phase2Set).items.length
                    : 'N/A',
            embeddingsGenerated: embeddings?.length || 0,
            timestamp: new Date().toISOString(),
        };

        console.log('📊 Generation metrics:', JSON.stringify(metrics));
        console.log(`✅ Generated ${phase} content in ${(elapsedMs / 1000).toFixed(1)}s. Estimated cost: ${formatCost(estimatedCost)}`);

        return {
            data: jsonData,
            phase,
            topic, // Include the generated/used topic
            embeddings,
            usage: {
                totalTokens: estimatedTokens,
                thinkingTokens: 0,
                estimatedCost
            }
        };
    }
);
