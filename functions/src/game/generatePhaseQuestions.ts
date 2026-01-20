/**
 * generatePhaseQuestions - Pub/Sub Cloud Function (#90)
 *
 * Generates all remaining phases (P2-P5) in background after startGame.
 * Questions are generated in parallel for faster completion.
 *
 * Triggered by: Pub/Sub topic 'generate-phase-questions'
 * Called from: startGame Cloud Function
 */

import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { defineSecret } from 'firebase-functions/params';
import { admin } from '../config/firebase';
import { generateGameQuestionsFlow } from '../services/gameGenerator';
import {
  separatePhase1Questions,
  separatePhase2Set,
  separatePhase2Sets,
  separatePhase3Themes,
  separatePhase4Questions,
  separatePhase5Questions,
} from '../services/generation/questionSeparator';
import type {
  GenerateAllPhasesMessage,
  PhaseId,
  GenerationStatus,
  PhaseGenerationResult,
  GameMode,
} from '../types/secureGameTypes';
import type {
  Phase1Question,
  Phase2Set,
  Phase3Theme,
  Phase4Question,
  Phase5Question,
} from '../services/generation/types';

// Topic name must match pubsubHelper.ts
const TOPIC_NAME = 'generate-phase-questions';

// Secrets needed for AI generation
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const googleCseEngineId = defineSecret('GOOGLE_CSE_ENGINE_ID');

/**
 * Get the RTDB base path for a game session
 */
function getBasePath(roomId: string, mode: GameMode): string {
  return mode === 'solo' ? `soloSessions/${roomId}` : `rooms/${roomId}`;
}

/**
 * Generate questions for a single phase and store them
 */
async function generateAndStorePhase(
  roomId: string,
  phase: PhaseId,
  difficulty: string,
  language: string,
  mode: GameMode
): Promise<PhaseGenerationResult> {
  const basePath = getBasePath(roomId, mode);
  const db = admin.database();

  // Check if already generated (idempotency)
  const existingRef = db.ref(`${basePath}/customQuestions/${phase}`);
  const existingSnap = await existingRef.once('value');
  if (existingSnap.exists()) {
    console.log(`[generatePhaseQuestions] ${phase} already exists for ${roomId}, skipping`);
    return { phase, skipped: true };
  }

  console.log(`[generatePhaseQuestions] Generating ${phase} for ${roomId}...`);

  // Generate questions using the existing flow
  const result = await generateGameQuestionsFlow({
    phase,
    topic: 'General Knowledge', // Can be customized later
    difficulty: difficulty as 'easy' | 'normal' | 'hard' | 'wtf',
    language: language as 'fr' | 'en' | 'es' | 'de' | 'pt',
  });

  // Separate public questions from private answers
  let publicData: unknown;
  let privateData: unknown;

  switch (phase) {
    case 'phase1': {
      const separated = separatePhase1Questions(result.data as Phase1Question[]);
      publicData = separated.publicQuestions;
      privateData = separated.privateAnswers;
      break;
    }
    case 'phase2': {
      const data = result.data;
      if (Array.isArray(data)) {
        const separated = separatePhase2Sets(data as Phase2Set[]);
        publicData = separated.publicSets;
        privateData = separated.privateAnswers;
      } else {
        const separated = separatePhase2Set(data as Phase2Set);
        publicData = separated.publicSet;
        privateData = separated.privateAnswers;
      }
      break;
    }
    case 'phase3': {
      const separated = separatePhase3Themes(result.data as Phase3Theme[]);
      publicData = separated.publicThemes;
      privateData = separated.privateAnswers;
      break;
    }
    case 'phase4': {
      const separated = separatePhase4Questions(result.data as Phase4Question[]);
      publicData = separated.publicQuestions;
      privateData = separated.privateAnswers;
      break;
    }
    case 'phase5': {
      const separated = separatePhase5Questions(result.data as Phase5Question[]);
      publicData = separated.publicQuestions;
      privateData = separated.privateAnswers;
      break;
    }
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }

  // Store public questions (visible to clients)
  await db.ref(`${basePath}/customQuestions/${phase}`).set(publicData);

  // Store private answers (only accessible by Cloud Functions)
  await db.ref(`gameData/${roomId}/${phase}`).set(privateData);

  const count = Array.isArray(publicData) ? publicData.length :
    (publicData as { items?: unknown[] })?.items?.length ?? 1;

  console.log(`[generatePhaseQuestions] ${phase} generated: ${count} questions for ${roomId}`);

  return { phase, generated: true, count };
}

/**
 * Pub/Sub triggered Cloud Function to generate all phases in parallel.
 *
 * Configuration:
 * - Region: europe-west1 (same as other functions)
 * - Memory: 2GiB (for parallel AI generation)
 * - Timeout: 540s (9 minutes for 4 phases in parallel)
 * - Retry: enabled (Pub/Sub will retry on failure)
 */
export const generatePhaseQuestions = onMessagePublished(
  {
    topic: TOPIC_NAME,
    region: 'europe-west1',
    memory: '2GiB',
    timeoutSeconds: 540, // 9 minutes
    retry: true,
    secrets: [geminiApiKey, googleCseEngineId],
  },
  async (event) => {
    const message = event.data.message.json as GenerateAllPhasesMessage;
    const { roomId, phases, difficulty, language, mode } = message;

    console.log(`[generatePhaseQuestions] Starting generation for room ${roomId}, phases: ${phases.join(', ')}`);

    const basePath = getBasePath(roomId, mode);
    const db = admin.database();

    // Mark as generating
    const generationStatus: GenerationStatus = {
      status: 'generating',
      startedAt: Date.now(),
      phases: phases.map(p => ({ phase: p })),
    };
    await db.ref(`${basePath}/generationStatus`).set(generationStatus);

    try {
      // Generate all phases in PARALLEL
      const results = await Promise.allSettled(
        phases.map(phase =>
          generateAndStorePhase(roomId, phase, difficulty, language, mode)
        )
      );

      // Process results
      const phaseResults: PhaseGenerationResult[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          phaseResults.push(result.value);
        } else {
          const errorMsg = result.reason?.message || 'Unknown error';
          errors.push(`${phases[index]}: ${errorMsg}`);
          phaseResults.push({
            phase: phases[index],
            error: errorMsg,
          });
          console.error(`[generatePhaseQuestions] Failed to generate ${phases[index]}:`, result.reason);
        }
      });

      // Determine final status
      const failedCount = errors.length;
      const finalStatus: GenerationStatus['status'] =
        failedCount === 0 ? 'ready' :
          failedCount === phases.length ? 'error' : 'partial';

      // Update generation status
      const finalGenerationStatus: GenerationStatus = {
        status: finalStatus,
        startedAt: generationStatus.startedAt,
        completedAt: Date.now(),
        phases: phaseResults,
        errors: errors.length > 0 ? errors : undefined,
      };
      await db.ref(`${basePath}/generationStatus`).set(finalGenerationStatus);

      if (failedCount > 0) {
        console.error(`[generatePhaseQuestions] Completed with ${failedCount} failures for room ${roomId}`);
        // Throw to trigger retry for partial failures
        if (finalStatus === 'partial') {
          throw new Error(`Failed to generate ${failedCount} phases: ${errors.join(', ')}`);
        }
      } else {
        console.log(`[generatePhaseQuestions] All phases generated successfully for room ${roomId}`);
      }
    } catch (error) {
      // Update status to error
      const errorStatus: GenerationStatus = {
        status: 'error',
        startedAt: generationStatus.startedAt,
        completedAt: Date.now(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
      await db.ref(`${basePath}/generationStatus`).set(errorStatus);

      console.error(`[generatePhaseQuestions] Fatal error for room ${roomId}:`, error);
      throw error; // Re-throw to trigger Pub/Sub retry
    }
  }
);
