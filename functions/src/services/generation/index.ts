/**
 * Game question generation module
 * Re-exports all generation utilities for easy imports
 */

// Types
export * from './types';

// Gemini interaction
export { callGemini, callGeminiForReview, callGeminiForFactCheck } from './geminiBridge';

// JSON utilities
export { findBalancedJson, parseJsonFromText, parseJsonArrayFromText, shuffleMCQOptions } from './jsonUtils';

// Topic generation
export {
    BANNED_TOPICS,
    FALLBACK_TOPICS,
    isTopicBanned,
    getRandomFallbackTopic,
    generateCreativeTopic,
} from './topicGenerator';

// Fact checking
export {
    factCheckPhase1Questions,
    factCheckPhase2Items,
    factCheckSimpleQuestions,
} from './factChecker';

// Targeted regeneration
export {
    shouldUseTargetedRegen,
    performPhase1TargetedRegen,
    performPhase4TargetedRegen,
    performPhase5TargetedRegen,
} from './targetedRegen';

// Question validation
export {
    validatePhase1Question,
    normalizePhase1Question,
    normalizePhase1Questions,
    validatePhase4Question,
    normalizePhase4Question,
    normalizePhase4Questions,
    validatePhase2Item,
    validatePhase2Set,
    validatePhase5Question,
    normalizePhase5Questions,
    type ValidationResult,
} from './questionValidator';

// Subject + Angle utilities (deduplication)
export {
    generateSubjectAngle,
    checkAnswerAmbiguity,
    markSubjectAngleUsed,
} from './subjectAngle';

// Phase generators (dialogue-based)
export { generatePhase1WithDialogue } from './phase1Generator';
export { generatePhase2WithDialogue } from './phase2Generator';
export { generatePhase3WithDialogue } from './phase3Generator';
export { generatePhase4WithDialogue } from './phase4Generator';
export { generatePhase5WithDialogue } from './phase5Generator';
