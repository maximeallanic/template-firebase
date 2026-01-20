/**
 * Game Cloud Functions - Server-Side Game Orchestration (#72)
 *
 * Exports all game-related Cloud Functions:
 * - generatePhaseQuestions (Pub/Sub) - Background question generation
 * - startGame (future - #88)
 * - submitAnswer (future - #81)
 * - nextPhase (future - #89)
 */

// Pub/Sub triggered function for background question generation
export { generatePhaseQuestions } from './generatePhaseQuestions';

// Helper functions for other CFs to use
export {
  publishGenerateAllPhases,
  publishGeneratePhase,
  GENERATE_PHASE_QUESTIONS_TOPIC,
} from './helpers/pubsubHelper';
