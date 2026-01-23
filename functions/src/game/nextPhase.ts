/**
 * nextPhase - Cloud Function (#89)
 *
 * Calculates phase scores and transitions to the next game phase.
 * Called by the host when a phase is complete.
 *
 * Responsibilities:
 * - Calculate scores from submitted answers (stored by submitAnswer)
 * - Update team scores in room state
 * - Transition game state to next phase (or victory)
 * - Wait for next phase questions if not ready
 * - Clean up current phase state
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { admin } from '../config/firebase';
import type {
  NextPhaseRequest,
  NextPhaseResponse,
  PhaseId,
  Team,
  TeamScores,
  GameMode,
  GenerationStatus,
} from '../types/secureGameTypes';
import { getBasePath, getNextPhase } from '../types/secureGameTypes';

// Point values per phase
const PHASE_POINTS: Record<PhaseId, number> = {
  phase1: 1,   // Tenders - Speed MCQ
  phase2: 1,   // Sucré Salé - Binary choice
  phase3: 1,   // La Carte - Theme questions
  phase4: 2,   // La Note - Buzzer MCQ
  phase5: 0,   // Burger Ultime - Uses bonus scoring (see calculatePhase5Scores)
};

/**
 * Calculate team scores for Phase 1 (Tenders - Speed MCQ)
 * First correct answer wins points
 */
async function calculatePhase1Scores(
  roomId: string,
  basePath: string
): Promise<TeamScores> {
  const db = admin.database();
  const scores: TeamScores = { spicy: 0, sweet: 0 };

  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase1`);
  const revealedSnap = await revealedRef.once('value');
  const revealedAnswers = revealedSnap.val() || {};

  for (const answer of Object.values(revealedAnswers)) {
    const revealed = answer as { winnerTeam?: Team };
    if (revealed.winnerTeam) {
      scores[revealed.winnerTeam] += PHASE_POINTS.phase1;
    }
  }

  return scores;
}

/**
 * Calculate team scores for Phase 2 (Sucré Salé - Binary choice)
 * Each correct team answer gets points
 */
async function calculatePhase2Scores(
  roomId: string,
  basePath: string
): Promise<TeamScores> {
  const db = admin.database();
  const scores: TeamScores = { spicy: 0, sweet: 0 };

  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase2`);
  const revealedSnap = await revealedRef.once('value');
  const revealedAnswers = revealedSnap.val() || {};

  for (const answer of Object.values(revealedAnswers)) {
    const revealed = answer as {
      teamAnswers?: {
        spicy?: { isCorrect: boolean };
        sweet?: { isCorrect: boolean };
      };
    };

    if (revealed.teamAnswers?.spicy?.isCorrect) {
      scores.spicy += PHASE_POINTS.phase2;
    }
    if (revealed.teamAnswers?.sweet?.isCorrect) {
      scores.sweet += PHASE_POINTS.phase2;
    }
  }

  return scores;
}

/**
 * Calculate team scores for Phase 3 (La Carte - Theme questions)
 * Correct answers by team members get points
 */
async function calculatePhase3Scores(
  roomId: string,
  basePath: string
): Promise<TeamScores> {
  const db = admin.database();
  const scores: TeamScores = { spicy: 0, sweet: 0 };

  // Get player team mappings
  const playersRef = db.ref(`${basePath}/players`);
  const playersSnap = await playersRef.once('value');
  const players = playersSnap.val() || {};

  const playerTeams: Record<string, Team> = {};
  for (const [playerId, player] of Object.entries(players)) {
    const p = player as { team?: Team };
    if (p.team) {
      playerTeams[playerId] = p.team;
    }
  }

  // Get submitted answers
  const submittedRef = db.ref(`${basePath}/state/submittedAnswers`);
  const submittedSnap = await submittedRef.once('value');
  const submittedAnswers = submittedSnap.val() || {};

  // Calculate scores from phase3 submissions
  for (const [playerId, answers] of Object.entries(submittedAnswers)) {
    const team = playerTeams[playerId];
    if (!team) continue;

    const playerAnswers = answers as Record<string, { phase: PhaseId; isCorrect: boolean }>;
    for (const answer of Object.values(playerAnswers)) {
      if (answer.phase === 'phase3' && answer.isCorrect) {
        scores[team] += PHASE_POINTS.phase3;
      }
    }
  }

  return scores;
}

/**
 * Calculate team scores for Phase 4 (La Note - Buzzer MCQ)
 * First correct answer wins points (with rebond possibility)
 */
async function calculatePhase4Scores(
  roomId: string,
  basePath: string
): Promise<TeamScores> {
  const db = admin.database();
  const scores: TeamScores = { spicy: 0, sweet: 0 };

  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase4`);
  const revealedSnap = await revealedRef.once('value');
  const revealedAnswers = revealedSnap.val() || {};

  for (const answer of Object.values(revealedAnswers)) {
    const revealed = answer as { winnerTeam?: Team };
    if (revealed.winnerTeam) {
      scores[revealed.winnerTeam] += PHASE_POINTS.phase4;
    }
  }

  return scores;
}

/**
 * Calculate team scores for Phase 5 (Burger Ultime - Memory questions)
 * Bonus exclusif: 5pts if first 5 correct, OR 10pts if all 10 correct (not cumulative)
 */
async function calculatePhase5Scores(
  roomId: string,
  basePath: string
): Promise<TeamScores> {
  const db = admin.database();
  const scores: TeamScores = { spicy: 0, sweet: 0 };

  const revealedRef = db.ref(`${basePath}/revealedAnswers/phase5`);
  const revealedSnap = await revealedRef.once('value');
  const revealedAnswers = revealedSnap.val() || {};

  // Calculate bonus scoring for each team
  for (const team of ['spicy', 'sweet'] as Team[]) {
    const teamAnswers: boolean[] = [];
    for (let i = 0; i < 10; i++) {
      const key = `${i}_${team}`;
      const revealed = revealedAnswers[key] as { isCorrect: boolean } | undefined;
      teamAnswers.push(revealed?.isCorrect ?? false);
    }

    const first5Correct = teamAnswers.slice(0, 5).every(c => c);
    const all10Correct = teamAnswers.length === 10 && teamAnswers.every(c => c);

    // Bonus exclusif: 5pts if first 5 correct, OR 10pts if all 10 correct
    if (all10Correct) {
      scores[team] = 10;
    } else if (first5Correct) {
      scores[team] = 5;
    }
  }

  return scores;
}

/**
 * Calculate scores for a specific phase
 */
async function calculatePhaseScores(
  roomId: string,
  phase: PhaseId,
  basePath: string
): Promise<TeamScores> {
  switch (phase) {
    case 'phase1':
      return calculatePhase1Scores(roomId, basePath);
    case 'phase2':
      return calculatePhase2Scores(roomId, basePath);
    case 'phase3':
      return calculatePhase3Scores(roomId, basePath);
    case 'phase4':
      return calculatePhase4Scores(roomId, basePath);
    case 'phase5':
      return calculatePhase5Scores(roomId, basePath);
    default:
      return { spicy: 0, sweet: 0 };
  }
}

/**
 * Wait for next phase questions to be ready
 */
async function waitForQuestionsReady(
  roomId: string,
  nextPhase: PhaseId,
  basePath: string,
  maxWaitMs: number = 30000
): Promise<boolean> {
  const db = admin.database();
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // Check if questions exist for next phase
    const questionsRef = db.ref(`${basePath}/customQuestions/${nextPhase}`);
    const questionsSnap = await questionsRef.once('value');

    if (questionsSnap.exists()) {
      return true;
    }

    // Check generation status
    const statusRef = db.ref(`${basePath}/generationStatus`);
    const statusSnap = await statusRef.once('value');
    const status = statusSnap.val() as GenerationStatus | null;

    if (status?.status === 'error') {
      console.error(`[nextPhase] Question generation failed for ${nextPhase}`);
      return false;
    }

    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.warn(`[nextPhase] Timeout waiting for ${nextPhase} questions`);
  return false;
}

/**
 * Determine game mode from room path existence
 */
async function determineGameMode(roomId: string): Promise<GameMode> {
  const db = admin.database();

  const soloRef = db.ref(`soloSessions/${roomId}`);
  const soloSnap = await soloRef.once('value');

  if (soloSnap.exists()) {
    return 'solo';
  }

  return 'multi';
}

/**
 * Get current team scores from room state
 */
async function getCurrentScores(basePath: string): Promise<TeamScores> {
  const db = admin.database();

  const scoresRef = db.ref(`${basePath}/state/teamScores`);
  const scoresSnap = await scoresRef.once('value');

  return scoresSnap.val() || { spicy: 0, sweet: 0 };
}

/**
 * nextPhase Cloud Function
 *
 * Configuration:
 * - Memory: 256MiB (light processing)
 * - Timeout: 60s (may wait for question generation)
 * - minInstances: 0 (not time-critical)
 */
export const nextPhase = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 60,
    minInstances: 0,
    consumeAppCheckToken: true,
  },
  async ({ data, auth }): Promise<NextPhaseResponse> => {
    // 1. Auth check
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const playerId = auth.uid;

    // 2. Validate input
    const { roomId, currentPhase } = data as NextPhaseRequest;

    if (!roomId || typeof roomId !== 'string') {
      throw new HttpsError('invalid-argument', 'roomId is required');
    }

    if (!currentPhase || !['phase1', 'phase2', 'phase3', 'phase4', 'phase5'].includes(currentPhase)) {
      throw new HttpsError('invalid-argument', 'Invalid currentPhase');
    }

    // 3. Determine game mode and base path
    const mode = await determineGameMode(roomId);
    const basePath = getBasePath(roomId, mode);

    const db = admin.database();

    // 4. Verify caller is host
    const hostRef = db.ref(`${basePath}/hostId`);
    const hostSnap = await hostRef.once('value');
    const hostId = hostSnap.val();

    if (hostId !== playerId) {
      throw new HttpsError('permission-denied', 'Only the host can advance to next phase');
    }

    // 5. Verify current game state
    const stateRef = db.ref(`${basePath}/state/status`);
    const stateSnap = await stateRef.once('value');
    const currentStatus = stateSnap.val();

    if (currentStatus !== currentPhase) {
      throw new HttpsError(
        'failed-precondition',
        `Game is not in ${currentPhase}. Current status: ${currentStatus}`
      );
    }

    try {
      // 6. Calculate phase scores
      const phaseScores = await calculatePhaseScores(roomId, currentPhase, basePath);
      console.log(`[nextPhase] Phase ${currentPhase} scores:`, phaseScores);

      // 7. Get current total scores and add phase scores
      const currentScores = await getCurrentScores(basePath);
      const newScores: TeamScores = {
        spicy: currentScores.spicy + phaseScores.spicy,
        sweet: currentScores.sweet + phaseScores.sweet,
      };

      // 8. Determine next phase
      const nextPhaseId = getNextPhase(currentPhase);

      // 9. If not victory, wait for questions to be ready
      if (nextPhaseId !== 'victory') {
        const questionsReady = await waitForQuestionsReady(roomId, nextPhaseId, basePath);
        if (!questionsReady) {
          throw new HttpsError('failed-precondition', `Questions for ${nextPhaseId} not ready`);
        }
      }

      // 10. Update game state atomically
      const updates: Record<string, unknown> = {
        [`${basePath}/state/status`]: nextPhaseId,
        [`${basePath}/state/teamScores`]: newScores,
        [`${basePath}/state/phaseState`]: 'idle',
        [`${basePath}/state/currentQuestionIndex`]: 0,
        [`${basePath}/state/roundWinner`]: null,
        [`${basePath}/state/lastPhaseTransition`]: Date.now(),
        // Reset player readiness for new phase (used by PhaseXIntro screens)
        [`${basePath}/state/playersReady`]: null,
      };

      // Clear submitted answers for previous phase
      // Note: We keep them for potential analytics, but clear active state
      updates[`${basePath}/state/currentPhase`] = nextPhaseId;

      await db.ref().update(updates);

      console.log(`[nextPhase] Transitioned ${roomId} from ${currentPhase} to ${nextPhaseId}`);

      // 11. Return result
      return {
        success: true,
        nextPhase: nextPhaseId,
        scores: newScores,
      };
    } catch (error) {
      console.error(`[nextPhase] Error for ${roomId}/${currentPhase}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to advance to next phase';
      throw new HttpsError('internal', message);
    }
  }
);
