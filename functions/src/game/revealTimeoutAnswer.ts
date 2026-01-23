/**
 * revealTimeoutAnswer - Cloud Function (#72)
 *
 * Reveals the correct answer when a timeout occurs (no player answered correctly).
 * Used for Phase 1, Phase 2, and Phase 4 when the timer expires.
 *
 * This function:
 * 1. Reads the correct answer from gameData/{roomCode}/phase{N}/{questionIndex}
 * 2. Stores it in rooms/{roomCode}/revealedAnswers/phase{N}/{questionIndex}
 * 3. Updates the room state to 'result' with isTimeout: true
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from '../config/firebase';
import type {
  GameMode,
  Phase1AnswerPrivate,
  Phase2SetAnswerPrivate,
  Phase4AnswerPrivate,
  Phase1RevealedAnswer,
  Phase2RevealedAnswer,
  Phase4RevealedAnswer,
} from '../types/secureGameTypes';

/**
 * Get the RTDB base path for a game session
 */
function getBasePath(roomId: string, mode: GameMode): string {
  return mode === 'solo' ? `soloSessions/${roomId}` : `rooms/${roomId}`;
}

/**
 * Get the gameData path for private answers
 */
function getGameDataPath(roomId: string, mode: GameMode): string {
  return mode === 'solo' ? `soloGameData/${roomId}` : `gameData/${roomId}`;
}

interface RevealTimeoutRequest {
  roomId: string;
  phase: 'phase1' | 'phase2' | 'phase4';
  questionIndex: number;
  setIndex?: number; // For Phase 2 only
  mode?: GameMode;
}

interface RevealTimeoutResponse {
  success: boolean;
  correctIndex?: number; // For Phase 1 and Phase 4
  correctAnswer?: 'A' | 'B' | 'Both'; // For Phase 2
}

export const revealTimeoutAnswer = onCall(
  async ({ data, auth }): Promise<RevealTimeoutResponse> => {
    // 1. Auth check (only host should call this, but any room member is acceptable)
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // 2. Validate input
    const { roomId, phase, questionIndex, setIndex = 0, mode = 'multi' } = data as RevealTimeoutRequest;

    if (!roomId || typeof roomId !== 'string') {
      throw new HttpsError('invalid-argument', 'roomId is required');
    }

    if (phase !== 'phase1' && phase !== 'phase2' && phase !== 'phase4') {
      throw new HttpsError('invalid-argument', 'phase must be phase1, phase2, or phase4');
    }

    if (typeof questionIndex !== 'number' || questionIndex < 0) {
      throw new HttpsError('invalid-argument', 'questionIndex must be a non-negative number');
    }

    const db = admin.database();
    const basePath = getBasePath(roomId, mode);
    const gameDataPath = getGameDataPath(roomId, mode);

    // Handle Phase 2 separately (different answer format)
    if (phase === 'phase2') {
      return handlePhase2Timeout(db, basePath, gameDataPath, setIndex, questionIndex);
    }

    // Phase 1 and Phase 4 handling
    // 3. Check if already revealed (prevent duplicate calls)
    const revealedRef = db.ref(`${basePath}/revealedAnswers/${phase}/${questionIndex}`);
    const revealedSnap = await revealedRef.once('value');

    if (revealedSnap.exists()) {
      // Already revealed, return existing data
      const existing = revealedSnap.val();
      return {
        success: true,
        correctIndex: existing.correctIndex,
      };
    }

    // 4. Read the correct answer from private gameData
    const answerRef = db.ref(`${gameDataPath}/${phase}/${questionIndex}`);
    const answerSnap = await answerRef.once('value');

    if (!answerSnap.exists()) {
      throw new HttpsError('not-found', `No answer found for ${phase} question ${questionIndex}`);
    }

    const answerData = answerSnap.val() as Phase1AnswerPrivate | Phase4AnswerPrivate;
    const correctIndex = answerData.correctIndex;

    // 5. Write revealed answer (without winner info since it's a timeout)
    const revealed: Phase1RevealedAnswer | Phase4RevealedAnswer = {
      correctIndex,
      // No winnerId, winnerName, winnerTeam since nobody won
      revealedAt: Date.now(),
    };

    await revealedRef.set(revealed);

    // 6. Update room state to 'result' with timeout flag
    const stateRef = db.ref(`${basePath}/state`);
    await stateRef.update({
      phaseState: 'result',
      roundWinner: null,
      isTimeout: true,
    });

    return {
      success: true,
      correctIndex,
    };
  }
);

/**
 * Handle Phase 2 timeout - reveals the correct answer for a Phase 2 item
 */
async function handlePhase2Timeout(
  db: ReturnType<typeof admin.database>,
  basePath: string,
  gameDataPath: string,
  setIndex: number,
  questionIndex: number
): Promise<RevealTimeoutResponse> {
  const revealKey = `${setIndex}_${questionIndex}`;
  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase2/${revealKey}`);
  const revealedSnap = await revealedRef.once('value');

  // Check if already has the answer field revealed
  if (revealedSnap.exists()) {
    const existing = revealedSnap.val() as Phase2RevealedAnswer;
    if (existing.answer) {
      // Already revealed
      return {
        success: true,
        correctAnswer: existing.answer,
      };
    }
  }

  // Read the correct answer from private gameData
  // Phase 2 answers are stored as array or single object
  const answerRef = db.ref(`${gameDataPath}/phase2`);
  const answerSnap = await answerRef.once('value');

  if (!answerSnap.exists()) {
    throw new HttpsError('not-found', 'No answer found for phase2');
  }

  const answerData = answerSnap.val();
  let answerSet: Phase2SetAnswerPrivate | undefined;

  if (Array.isArray(answerData)) {
    answerSet = answerData[setIndex];
  } else {
    answerSet = answerData as Phase2SetAnswerPrivate;
  }

  const itemAnswer = answerSet?.items?.[questionIndex];
  if (!itemAnswer) {
    throw new HttpsError('not-found', `No answer found for phase2 set ${setIndex} item ${questionIndex}`);
  }

  const correctAnswer = itemAnswer.answer;

  // Update revealed answer with the correct answer
  const updateData: Partial<Phase2RevealedAnswer> = {
    answer: correctAnswer,
    revealedAt: Date.now(),
    // Keep existing teamAnswers if any
    ...(revealedSnap.exists() ? { teamAnswers: revealedSnap.val().teamAnswers } : {}),
  };

  await revealedRef.update(updateData);

  // Note: For Phase 2, we don't update phaseState here because
  // endPhase2Round already handles that before calling this function

  return {
    success: true,
    correctAnswer,
  };
}
