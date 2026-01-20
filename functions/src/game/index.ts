/**
 * Game Cloud Functions - Server-Side Game Orchestration (#72)
 *
 * Exports all game-related Cloud Functions:
 * - startGame (#88) - Start game and generate P1
 * - submitAnswer (#81) - Validate answers per phase rules
 * - generatePhaseQuestions (Pub/Sub) - Background question generation
 * - nextPhase (future - #89)
 */

// Callable Cloud Functions
export { startGame } from './startGame';
export { submitAnswer } from './submitAnswer';

// Pub/Sub triggered function for background question generation
export { generatePhaseQuestions } from './generatePhaseQuestions';

// Helper functions for other CFs to use
export {
  publishGenerateAllPhases,
  publishGeneratePhase,
  GENERATE_PHASE_QUESTIONS_TOPIC,
} from './helpers/pubsubHelper';
