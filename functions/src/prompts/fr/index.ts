/**
 * French Prompts Index
 * Exports all French prompts for Spicy vs Sweet game
 */

// System prompts
export {
    GAME_GENERATION_SYSTEM_PROMPT,
    REVIEW_SYSTEM_PROMPT
} from './system';

// Topic generation
export {
    GENERATE_TOPIC_PROMPT,
    GENERATE_TOPIC_PHASE2_PROMPT
} from './topic';

// Phase 1 (Tenders)
export {
    PHASE1_PROMPT,
    PHASE1_GENERATOR_PROMPT,
    PHASE1_DIALOGUE_REVIEWER_PROMPT,
    PHASE1_TARGETED_REGENERATION_PROMPT,
    REVIEW_PHASE1_PROMPT,
    REGENERATE_PHASE1_PROMPT
} from './phase1';

// Phase 2 (Sel ou Poivre)
export {
    PHASE2_PROMPT,
    PHASE2_GENERATOR_PROMPT,
    PHASE2_TARGETED_REGENERATION_PROMPT,
    PHASE2_DIALOGUE_REVIEWER_PROMPT,
    REVIEW_PHASE2_PROMPT,
    REGENERATE_PHASE2_ITEMS_PROMPT
} from './phase2';

// Phase 3 (La Carte)
export { PHASE3_PROMPT } from './phase3';

// Phase 4 (La Note)
export { PHASE4_PROMPT } from './phase4';

// Phase 5 (Burger Ultime)
export { PHASE5_PROMPT } from './phase5';

// Fact-checking
export {
    FACT_CHECK_PROMPT,
    FACT_CHECK_BATCH_PROMPT,
    FACT_CHECK_PHASE2_PROMPT
} from './factcheck';
