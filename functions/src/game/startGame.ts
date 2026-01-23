/**
 * startGame - Cloud Function (#88)
 *
 * Starts a game by generating Phase 1 questions synchronously
 * and triggering background generation for phases 2-5.
 *
 * Flow:
 * 1. Verify user is host of the room (multi) or session owner (solo)
 * 2. Generate P1 questions via Genkit
 * 3. Separate questions (public) from answers (private)
 * 4. Store in RTDB and gameData
 * 5. Trigger Pub/Sub for P2-P5 generation
 * 6. Update room state to phase1
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { admin } from '../config/firebase';
import { generateGameQuestionsFlow } from '../services/gameGenerator';
import { separatePhase1Questions } from '../services/generation/questionSeparator';
import { publishGenerateAllPhases } from './helpers/pubsubHelper';
import type {
  StartGameRequest,
  StartGameResponse,
  Difficulty,
  GameMode,
  TeamScores,
  GenerationStatus,
} from '../types/secureGameTypes';
import type { Phase1Question } from '../services/generation/types';

// Secrets needed for AI generation
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const googleCseEngineId = defineSecret('GOOGLE_CSE_ENGINE_ID');

// Default values
const DEFAULT_DIFFICULTY: Difficulty = 'normal';
const DEFAULT_LANGUAGE = 'fr';

/**
 * Get the RTDB base path for a game session
 */
function getBasePath(roomId: string, mode: GameMode): string {
  return mode === 'solo' ? `soloSessions/${roomId}` : `rooms/${roomId}`;
}

/**
 * Verify user is authorized to start the game
 */
async function verifyHost(
  roomId: string,
  userId: string,
  mode: GameMode
): Promise<boolean> {
  const db = admin.database();
  const basePath = getBasePath(roomId, mode);

  if (mode === 'solo') {
    // For solo mode, the roomId IS the odId (player's unique identifier)
    // Verify the session exists and belongs to this user
    const sessionRef = db.ref(`${basePath}/playerId`);
    const sessionSnap = await sessionRef.once('value');
    return sessionSnap.val() === userId;
  }

  // For multi mode, check if user is the host
  const hostRef = db.ref(`${basePath}/hostId`);
  const hostSnap = await hostRef.once('value');
  return hostSnap.val() === userId;
}

/**
 * Initialize game state in RTDB
 */
async function initializeGameState(
  roomId: string,
  mode: GameMode,
  questionCount: number
): Promise<void> {
  const db = admin.database();
  const basePath = getBasePath(roomId, mode);

  // Initialize scores
  const scores: TeamScores = { spicy: 0, sweet: 0 };

  // Set initial game state - phaseState is 'idle' until all players are ready
  // The readiness system (#80) handles transition to 'answering' when all players
  // have dismissed the intro modal
  await db.ref(`${basePath}/state`).update({
    status: 'phase1',
    phaseState: 'idle', // Wait for all players to be ready
    currentQuestionIndex: 0,
    scores,
    startedAt: Date.now(),
    // Phase 1 specific state
    phase1Answers: {},
    phase1BlockedTeams: [],
    phase1TriedWrongOptions: [],
    phase1LastWrongTeam: null,
    roundWinner: null,
    isTimeout: false,
    isGenerating: false, // Clear loading state when game actually starts
  });

  // Reset readiness for all players (used by Phase1Intro to track who's ready)
  await db.ref(`${basePath}/state/playersReady`).remove();

  console.log(`[startGame] Initialized game state for ${roomId}, ${questionCount} questions`);
}

/**
 * Shuffle options for MCQ questions to randomize correct answer position
 */
function shufflePhase1Options(questions: Phase1Question[]): Phase1Question[] {
  return questions.map(q => {
    const options = [...q.options];
    const correctAnswer = options[q.correctIndex];

    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Find new position of correct answer
    const newCorrectIndex = options.indexOf(correctAnswer);

    return {
      ...q,
      options,
      correctIndex: newCorrectIndex,
    };
  });
}

/**
 * startGame Cloud Function
 *
 * Configuration:
 * - Region: europe-west1 (same as other functions)
 * - Memory: 1GiB (for AI generation)
 * - Timeout: 120s (2 minutes for P1 generation)
 * - minInstances: 1 (reduce cold start for better UX)
 */
export const startGame = onCall(
  {
    memory: '1GiB',
    timeoutSeconds: 300, // 5 minutes - AI generation with dialogue system can take 2-3 min
    minInstances: 1,
    secrets: [geminiApiKey, googleCseEngineId],
    consumeAppCheckToken: true,
  },
  async ({ data, auth }): Promise<StartGameResponse> => {
    // 1. Auth check
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = auth.uid;

    // 2. Validate input
    const { roomId, mode, difficulty, language } = data as StartGameRequest;

    if (!roomId || typeof roomId !== 'string') {
      throw new HttpsError('invalid-argument', 'roomId is required');
    }

    if (!mode || (mode !== 'multi' && mode !== 'solo')) {
      throw new HttpsError('invalid-argument', 'mode must be "multi" or "solo"');
    }

    // 3. Verify user is host
    const isHost = await verifyHost(roomId, userId, mode);
    if (!isHost) {
      throw new HttpsError(
        'permission-denied',
        mode === 'solo'
          ? 'You are not the owner of this solo session'
          : 'Only the host can start the game'
      );
    }

    const db = admin.database();
    const basePath = getBasePath(roomId, mode);
    const gameDifficulty = difficulty || DEFAULT_DIFFICULTY;
    const gameLanguage = language || DEFAULT_LANGUAGE;

    // 4. Check if game already started (idempotency)
    const statusRef = db.ref(`${basePath}/state/status`);
    const statusSnap = await statusRef.once('value');
    const currentStatus = statusSnap.val();

    if (currentStatus && currentStatus !== 'lobby') {
      console.log(`[startGame] Game already started for ${roomId}, status: ${currentStatus}`);
      return {
        success: true,
        phase: 'phase1',
      };
    }

    // 5. Check if P1 questions already exist (client may have pre-generated them)
    const existingP1Ref = db.ref(`${basePath}/customQuestions/phase1`);
    const existingP1Snap = await existingP1Ref.once('value');

    if (existingP1Snap.exists()) {
      console.log(`[startGame] P1 already exists for ${roomId}, extracting answers`);
      const existingQuestions = existingP1Snap.val() as Phase1Question[];
      const questionCount = Array.isArray(existingQuestions) ? existingQuestions.length : 0;

      // Check if answers were already extracted (game was already started before)
      const existingAnswersRef = db.ref(`gameData/${roomId}/phase1`);
      const existingAnswersSnap = await existingAnswersRef.once('value');

      if (!existingAnswersSnap.exists() && questionCount > 0) {
        // Extract answers from existing questions and store privately
        // Questions may include correctIndex which needs to be separated
        const { publicQuestions, privateAnswers } = separatePhase1Questions(existingQuestions);

        // Update public questions (remove any answer data)
        await db.ref(`${basePath}/customQuestions/phase1`).set(publicQuestions);

        // Store private answers
        await db.ref(`gameData/${roomId}/phase1`).set(privateAnswers);

        console.log(`[startGame] Extracted ${privateAnswers.length} answers from existing P1 questions`);
      }

      // Initialize state and trigger P2-P5 generation if not done
      await initializeGameState(roomId, mode, questionCount);

      // Check if P2-P5 generation was already triggered
      const genStatusRef = db.ref(`${basePath}/generationStatus`);
      const genStatusSnap = await genStatusRef.once('value');

      if (!genStatusSnap.exists()) {
        // Trigger P2-P5 generation
        await publishGenerateAllPhases(roomId, gameDifficulty, gameLanguage, mode);
      }

      return {
        success: true,
        phase: 'phase1',
      };
    }

    try {
      // 6. Set isGenerating so all players see loading UI immediately
      await db.ref(`${basePath}/state/isGenerating`).set(true);

      // 7. Set generation status to "generating"
      const generationStatus: GenerationStatus = {
        status: 'generating',
        startedAt: Date.now(),
        phases: [{ phase: 'phase1' }],
      };
      await db.ref(`${basePath}/generationStatus`).set(generationStatus);

      // 7. Generate P1 questions
      console.log(`[startGame] Generating P1 for ${roomId}...`);

      const result = await generateGameQuestionsFlow({
        phase: 'phase1',
        topic: 'General Knowledge',
        difficulty: gameDifficulty,
        language: gameLanguage as 'fr' | 'en' | 'es' | 'de' | 'pt',
      });

      const questions = result.data as Phase1Question[];

      // 8. Shuffle options
      const shuffledQuestions = shufflePhase1Options(questions);

      // 9. Separate public questions from private answers
      const { publicQuestions, privateAnswers } = separatePhase1Questions(shuffledQuestions);

      // 10. Store public questions (visible to clients)
      await db.ref(`${basePath}/customQuestions/phase1`).set(publicQuestions);

      // 11. Store private answers (only accessible by Cloud Functions)
      await db.ref(`gameData/${roomId}/phase1`).set(privateAnswers);

      console.log(`[startGame] P1 generated: ${publicQuestions.length} questions for ${roomId}`);

      // 12. Initialize game state
      await initializeGameState(roomId, mode, publicQuestions.length);

      // 13. Trigger P2-P5 generation in background via Pub/Sub
      await publishGenerateAllPhases(roomId, gameDifficulty, gameLanguage, mode);

      // 14. Update generation status for P1
      await db.ref(`${basePath}/generationStatus/phases/0`).update({
        phase: 'phase1',
        generated: true,
        count: publicQuestions.length,
      });

      console.log(`[startGame] Game started for ${roomId}, P2-P5 generation triggered`);

      return {
        success: true,
        phase: 'phase1',
      };
    } catch (error) {
      console.error(`[startGame] Error for ${roomId}:`, error);

      // Update generation status to error
      const errorStatus: GenerationStatus = {
        status: 'error',
        completedAt: Date.now(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
      await db.ref(`${basePath}/generationStatus`).set(errorStatus);

      // Clear loading state on error
      await db.ref(`${basePath}/state/isGenerating`).set(false);

      const message = error instanceof Error ? error.message : 'Failed to start game';
      throw new HttpsError('internal', message);
    }
  }
);
