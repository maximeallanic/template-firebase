/**
 * submitAnswer - Cloud Function (#81)
 *
 * Validates player answers and reveals correct answers according to phase rules.
 * Does NOT recalculate total scores (that's done by nextPhase).
 *
 * Phase Rules:
 * - P1: First correct wins, reveal to all
 * - P2: Reveal to team first, then to all when both answered
 * - P3: Immediate LLM feedback to answering player
 * - P4: Correct reveals to all, incorrect allows rebond
 * - P5: Immediate LLM feedback to representative
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { admin } from '../config/firebase';
import {
  validatePhase1Answer,
  validatePhase2Answer,
  validatePhase3Answer,
  validatePhase4Answer,
  validatePhase5Answer,
} from './helpers/validators';
import type {
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  PhaseId,
  Team,
  GameMode,
  Phase1AnswerPrivate,
  Phase2SetAnswerPrivate,
  Phase3ThemeAnswerPrivate,
  Phase4AnswerPrivate,
  Phase5AnswerPrivate,
} from '../types/secureGameTypes';

// Secrets needed for LLM validation (P3/P5)
const geminiApiKey = defineSecret('GEMINI_API_KEY');

/**
 * Get the RTDB base path for a game session
 */
function getBasePath(roomId: string, mode: GameMode): string {
  return mode === 'solo' ? `soloSessions/${roomId}` : `rooms/${roomId}`;
}

/**
 * Get player info from room data
 */
interface PlayerInfo {
  id: string;
  name: string;
  team: Team | null;
}

async function getPlayerInfo(
  roomId: string,
  playerId: string,
  mode: GameMode
): Promise<PlayerInfo | null> {
  const db = admin.database();
  const basePath = getBasePath(roomId, mode);

  const playerRef = db.ref(`${basePath}/players/${playerId}`);
  const playerSnap = await playerRef.once('value');

  if (!playerSnap.exists()) {
    return null;
  }

  const playerData = playerSnap.val();
  return {
    id: playerId,
    name: playerData.name || 'Unknown',
    team: playerData.team || null,
  };
}

/**
 * Store submitted answer for later score calculation by nextPhase
 */
async function storeSubmittedAnswer(
  roomId: string,
  playerId: string,
  phase: PhaseId,
  questionIndex: number,
  answer: number | string,
  isCorrect: boolean,
  clientTimestamp: number,
  mode: GameMode
): Promise<void> {
  const db = admin.database();
  const basePath = getBasePath(roomId, mode);

  await db.ref(`${basePath}/state/submittedAnswers/${playerId}/${phase}_${questionIndex}`).set({
    phase,
    questionIndex,
    answer,
    isCorrect,
    clientTimestamp,
    serverTimestamp: Date.now(),
  });
}

/**
 * Get private answers from gameData
 */
async function getPrivateAnswers<T>(roomId: string, phase: PhaseId): Promise<T | null> {
  const db = admin.database();
  const ref = db.ref(`gameData/${roomId}/${phase}`);
  const snap = await ref.once('value');
  return snap.val() as T | null;
}

/**
 * Determine game mode from room path existence
 */
async function determineGameMode(roomId: string): Promise<GameMode> {
  const db = admin.database();

  // Check if it's a solo session
  const soloRef = db.ref(`soloSessions/${roomId}`);
  const soloSnap = await soloRef.once('value');

  if (soloSnap.exists()) {
    return 'solo';
  }

  return 'multi';
}

/**
 * submitAnswer Cloud Function
 *
 * Configuration:
 * - Memory: 512MiB (for LLM validation)
 * - Timeout: 30s (quick for MCQ, up to 30s for LLM)
 * - minInstances: 1 (reduce latency for real-time game)
 */
export const submitAnswer = onCall(
  {
    memory: '512MiB',
    timeoutSeconds: 30,
    minInstances: 1,
    secrets: [geminiApiKey],
    consumeAppCheckToken: true,
  },
  async ({ data, auth }): Promise<SubmitAnswerResponse> => {
    // 1. Auth check
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const playerId = auth.uid;

    // 2. Validate input
    const { roomId, phase, questionIndex, answer, clientTimestamp } = data as SubmitAnswerRequest;

    if (!roomId || typeof roomId !== 'string') {
      throw new HttpsError('invalid-argument', 'roomId is required');
    }

    if (!phase || !['phase1', 'phase2', 'phase3', 'phase4', 'phase5'].includes(phase)) {
      throw new HttpsError('invalid-argument', 'Invalid phase');
    }

    if (typeof questionIndex !== 'number' || questionIndex < 0) {
      throw new HttpsError('invalid-argument', 'Invalid questionIndex');
    }

    if (answer === undefined || answer === null) {
      throw new HttpsError('invalid-argument', 'Answer is required');
    }

    // 3. Determine game mode
    const mode = await determineGameMode(roomId);
    const basePath = getBasePath(roomId, mode);

    // 4. Get player info
    const playerInfo = await getPlayerInfo(roomId, playerId, mode);
    if (!playerInfo) {
      throw new HttpsError('not-found', 'Player not found in room');
    }

    // 5. Validate based on phase
    let isCorrect = false;
    let correctAnswer: number | string | undefined;
    let explanation: string | undefined;

    try {
      switch (phase) {
        case 'phase1': {
          const answers = await getPrivateAnswers<Phase1AnswerPrivate[]>(roomId, 'phase1');
          if (!answers) {
            throw new HttpsError('not-found', 'Phase 1 answers not found');
          }

          // Debug logging for solo mode validation
          console.log(`[submitAnswer] Phase1 validation: roomId=${roomId}, mode=${mode}, qIdx=${questionIndex}, userAnswer=${answer}`);
          console.log(`[submitAnswer] Private answers found: ${answers.length} items`);
          console.log(`[submitAnswer] Expected correctIndex: ${answers[questionIndex]?.correctIndex}`);

          const result = await validatePhase1Answer(
            roomId,
            questionIndex,
            answer as number,
            playerId,
            playerInfo.name,
            playerInfo.team || 'spicy',
            answers,
            basePath
          );

          console.log(`[submitAnswer] Validation result: isCorrect=${result.isCorrect}, shouldReveal=${result.shouldReveal}`);

          isCorrect = result.isCorrect;
          // In solo mode, always reveal correct answer immediately for feedback
          // In multi mode, only reveal after first correct or if already revealed
          correctAnswer = (mode === 'solo' || result.shouldReveal)
            ? answers[questionIndex]?.correctIndex
            : undefined;

          console.log(`[submitAnswer] Returning: isCorrect=${isCorrect}, correctAnswer=${correctAnswer}`);
          explanation = result.explanation;
          break;
        }

        case 'phase2': {
          const answers = await getPrivateAnswers<Phase2SetAnswerPrivate | Phase2SetAnswerPrivate[]>(
            roomId,
            'phase2'
          );
          if (!answers) {
            throw new HttpsError('not-found', 'Phase 2 answers not found');
          }

          // Extract setIndex from questionIndex if needed (setIndex_itemIndex format)
          // For now, assume single set with questionIndex as item index
          const setIndex = 0;

          const result = await validatePhase2Answer(
            roomId,
            questionIndex,
            answer as 'A' | 'B' | 'Both',
            playerId,
            playerInfo.name,
            playerInfo.team || 'spicy',
            setIndex,
            answers,
            basePath
          );

          isCorrect = result.isCorrect;
          // In solo mode, always reveal correct answer immediately for feedback
          if (mode === 'solo' || result.shouldReveal) {
            // Get correct answer from private data
            const answersArray = Array.isArray(answers) ? answers : [answers];
            const setAnswers = answersArray[setIndex];
            correctAnswer = setAnswers?.items?.[questionIndex]?.answer;
          }
          explanation = result.explanation;
          break;
        }

        case 'phase3': {
          const answers = await getPrivateAnswers<Phase3ThemeAnswerPrivate[]>(roomId, 'phase3');
          if (!answers) {
            throw new HttpsError('not-found', 'Phase 3 answers not found');
          }

          // For P3, questionIndex encodes both theme and question
          // Format: themeIndex * 100 + questionIndexInTheme
          const themeIndex = Math.floor(questionIndex / 100);
          const questionInTheme = questionIndex % 100;

          const result = await validatePhase3Answer(
            roomId,
            themeIndex,
            questionInTheme,
            answer as string,
            playerId,
            answers,
            basePath
          );

          isCorrect = result.isCorrect;
          correctAnswer = result.expectedAnswer;
          explanation = result.explanation;
          break;
        }

        case 'phase4': {
          const answers = await getPrivateAnswers<Phase4AnswerPrivate[]>(roomId, 'phase4');
          if (!answers) {
            throw new HttpsError('not-found', 'Phase 4 answers not found');
          }

          // Debug logging for Phase 4 validation
          console.log(`[submitAnswer] Phase4 validation: roomId=${roomId}, mode=${mode}, qIdx=${questionIndex}, userAnswer=${answer}`);
          console.log(`[submitAnswer] Phase4 private answers found: ${answers.length} items`);
          console.log(`[submitAnswer] Phase4 expected correctIndex at qIdx ${questionIndex}: ${answers[questionIndex]?.correctIndex}`);

          const result = await validatePhase4Answer(
            roomId,
            questionIndex,
            answer as number,
            playerId,
            playerInfo.name,
            playerInfo.team || 'spicy',
            answers,
            basePath
          );

          console.log(`[submitAnswer] Phase4 validation result: isCorrect=${result.isCorrect}, shouldReveal=${result.shouldReveal}`);

          isCorrect = result.isCorrect;
          // In solo mode, always reveal correct answer immediately for feedback
          correctAnswer = (mode === 'solo' || result.shouldReveal)
            ? answers[questionIndex]?.correctIndex
            : undefined;
          explanation = result.explanation;
          break;
        }

        case 'phase5': {
          const answers = await getPrivateAnswers<Phase5AnswerPrivate[]>(roomId, 'phase5');
          if (!answers) {
            throw new HttpsError('not-found', 'Phase 5 answers not found');
          }

          const result = await validatePhase5Answer(
            roomId,
            questionIndex,
            answer as string,
            playerInfo.team || 'spicy',
            playerId,
            answers,
            basePath
          );

          isCorrect = result.isCorrect;
          correctAnswer = result.expectedAnswer;
          explanation = result.explanation;
          break;
        }

        default:
          throw new HttpsError('invalid-argument', `Unknown phase: ${phase}`);
      }

      // 6. Store submitted answer for score calculation
      await storeSubmittedAnswer(
        roomId,
        playerId,
        phase,
        questionIndex,
        answer,
        isCorrect,
        clientTimestamp || Date.now(),
        mode
      );

      // 7. Return result
      return {
        success: true,
        isCorrect,
        correctAnswer,
        explanation,
      };
    } catch (error) {
      console.error(`[submitAnswer] Error for ${roomId}/${phase}/${questionIndex}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to validate answer';
      throw new HttpsError('internal', message);
    }
  }
);
