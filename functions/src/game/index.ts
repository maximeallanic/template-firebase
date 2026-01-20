/**
 * Game Cloud Functions - Server-Side Game Orchestration (#72)
 *
 * Exports all game-related Cloud Functions:
 * - startGame (#88) - Start game and generate P1
 * - generatePhaseQuestions (Pub/Sub) - Background question generation
 * - submitAnswer (future - #81)
 * - nextPhase (future - #89)
 */

// Callable Cloud Functions
export { startGame } from './startGame';

// Pub/Sub triggered function for background question generation
export { generatePhaseQuestions } from './generatePhaseQuestions';

// Helper functions for other CFs to use
export {
  publishGenerateAllPhases,
  publishGeneratePhase,
  GENERATE_PHASE_QUESTIONS_TOPIC,
} from './helpers/pubsubHelper';
