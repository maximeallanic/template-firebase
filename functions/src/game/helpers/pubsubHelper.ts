/**
 * Pub/Sub Helper - Server-Side Game Orchestration (#72)
 *
 * Helper functions to publish messages to Pub/Sub topics
 * for background question generation.
 */

import { PubSub } from '@google-cloud/pubsub';
import type {
  GenerateAllPhasesMessage,
  Difficulty,
  GameMode,
  PhaseId,
} from '../../types/secureGameTypes';

// Initialize PubSub client
const pubsub = new PubSub();

// Topic names
export const GENERATE_PHASE_QUESTIONS_TOPIC = 'generate-phase-questions';

// Detect if running in emulator (Pub/Sub not supported)
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

/**
 * Publish a message to generate all remaining phases (P2-P5) in background.
 * Called by startGame after generating P1 synchronously.
 *
 * @param roomId - The room code or odId (for solo)
 * @param difficulty - Game difficulty level
 * @param language - Language for question generation
 * @param mode - 'multi' or 'solo'
 */
export async function publishGenerateAllPhases(
  roomId: string,
  difficulty: Difficulty,
  language: string,
  mode: GameMode
): Promise<void> {
  const topic = pubsub.topic(GENERATE_PHASE_QUESTIONS_TOPIC);

  const message: GenerateAllPhasesMessage = {
    roomId,
    phases: ['phase2', 'phase3', 'phase4', 'phase5'] as PhaseId[],
    difficulty,
    language,
    mode,
    requestedAt: Date.now(),
  };

  try {
    const messageId = await topic.publishMessage({
      json: message,
    });
    console.log(`[Pub/Sub] Published generateAllPhases message ${messageId} for room ${roomId}`);
  } catch (error) {
    // In emulator mode, Pub/Sub is not supported - log warning but don't fail
    // P2-P5 will be generated on-demand when needed
    if (isEmulator) {
      console.warn('[Pub/Sub] Emulator mode: Pub/Sub not available. P2-P5 will be generated on-demand.');
      return;
    }
    console.error('[Pub/Sub] Failed to publish generateAllPhases message:', error);
    throw error;
  }
}

/**
 * Publish a message to generate a specific phase.
 * Can be used for targeted regeneration if a phase fails.
 *
 * @param roomId - The room code or odId (for solo)
 * @param phase - The phase to generate
 * @param difficulty - Game difficulty level
 * @param language - Language for question generation
 * @param mode - 'multi' or 'solo'
 */
export async function publishGeneratePhase(
  roomId: string,
  phase: PhaseId,
  difficulty: Difficulty,
  language: string,
  mode: GameMode
): Promise<void> {
  const topic = pubsub.topic(GENERATE_PHASE_QUESTIONS_TOPIC);

  const message: GenerateAllPhasesMessage = {
    roomId,
    phases: [phase],
    difficulty,
    language,
    mode,
    requestedAt: Date.now(),
  };

  try {
    const messageId = await topic.publishMessage({
      json: message,
    });
    console.log(`[Pub/Sub] Published generatePhase message ${messageId} for ${phase} in room ${roomId}`);
  } catch (error) {
    // In emulator mode, Pub/Sub is not supported - log warning but don't fail
    if (isEmulator) {
      console.warn(`[Pub/Sub] Emulator mode: Pub/Sub not available. ${phase} will be generated on-demand.`);
      return;
    }
    console.error(`[Pub/Sub] Failed to publish generatePhase message for ${phase}:`, error);
    throw error;
  }
}
