/**
 * Cloud Function: submitAnswer
 *
 * Main server-side validation for all game phases.
 * Handles answer validation without exposing correct answers to clients.
 *
 * Security features:
 * - Auth required (user must be logged in)
 * - Player must be in the room or own the solo session
 * - Answers validated server-side only
 * - Rate limiting via Firebase
 *
 * Latency considerations:
 * - P1/P2/P4: Direct comparison (~50ms)
 * - P3/P5: LLM validation (~1-2s)
 * - minInstances=1 to avoid cold start
 * - europe-west1 for low latency to EU users
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import {
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    GameDataServer,
    PendingAnswer,
    TeamType,
    Phase3ThemeServer,
} from './types';
import { validateAnswer } from '../services/answerValidator';

/**
 * Get player info from room
 */
async function getPlayerInfo(roomId: string, odId: string): Promise<{
    exists: boolean;
    team?: TeamType;
    name?: string;
    isOnline?: boolean;
}> {
    const db = getDatabase();
    const playerRef = db.ref(`rooms/${roomId}/players/${odId}`);
    const snapshot = await playerRef.get();

    if (!snapshot.exists()) {
        return { exists: false };
    }

    const player = snapshot.val();
    return {
        exists: true,
        team: player.team,
        name: player.name,
        isOnline: player.isOnline,
    };
}

/**
 * Get game data (with answers) from server-side storage
 */
async function getGameData(roomId: string): Promise<GameDataServer | null> {
    const db = getDatabase();
    const ref = db.ref(`gameData/${roomId}`);
    const snapshot = await ref.get();

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val() as GameDataServer;
}

/**
 * Award points to a player
 */
async function awardPoints(roomId: string, odId: string, points: number): Promise<void> {
    const db = getDatabase();
    const playerRef = db.ref(`rooms/${roomId}/players/${odId}/score`);
    await playerRef.transaction((current: number | null) => (current || 0) + points);
}

/**
 * Record answer and check if player won the round (P1)
 */
async function recordPhase1Answer(
    roomId: string,
    odId: string,
    team: TeamType,
    questionIndex: number,
    answer: number,
    clientTimestamp: number,
    correct: boolean
): Promise<{ isWinner: boolean; alreadyAnswered: boolean }> {
    const db = getDatabase();
    const answersRef = db.ref(`rooms/${roomId}/state/phase1Answers/${questionIndex}`);

    // Check if already answered correctly
    const existingSnapshot = await answersRef.child('winner').get();
    if (existingSnapshot.exists()) {
        return { isWinner: false, alreadyAnswered: true };
    }

    // If incorrect, just record it (no winner determination)
    if (!correct) {
        await answersRef.child(`attempts/${odId}`).set({
            answer,
            clientTimestamp,
            correct: false,
            serverTimestamp: Date.now(),
        });
        return { isWinner: false, alreadyAnswered: false };
    }

    // For correct answers, use transaction to determine winner
    const pendingRef = answersRef.child('pending');

    // Add to pending answers
    await pendingRef.child(odId).set({
        odId,
        team,
        answer,
        clientTimestamp,
        serverTimestamp: Date.now(),
        correct: true,
    } as PendingAnswer);

    // Wait for answer window, then determine winner
    // In a real implementation, this would be handled by a separate process
    // For now, we'll check immediately and let the first correct answer win

    const result = await answersRef.transaction((current) => {
        if (!current) {
            current = { pending: {}, winner: null };
        }

        // If already has winner, skip
        if (current.winner) {
            return current;
        }

        // Find the earliest correct answer
        // SECURITY FIX: Sort by serverTimestamp first (can't be spoofed), then clientTimestamp as tiebreaker
        const pendingAnswers = current.pending || {};
        const correctAnswers = Object.values(pendingAnswers as Record<string, PendingAnswer>)
            .filter((a: PendingAnswer) => a.correct);

        if (correctAnswers.length === 0) {
            return current;
        }

        // Sort by server timestamp first, client timestamp as tiebreaker
        correctAnswers.sort((a, b) =>
            a.serverTimestamp - b.serverTimestamp || a.clientTimestamp - b.clientTimestamp
        );
        const winner = correctAnswers[0];

        current.winner = {
            odId: winner.odId,
            team: winner.team,
            clientTimestamp: winner.clientTimestamp,
        };

        return current;
    });

    // Check if this player is the winner
    const winnerData = result.snapshot.val()?.winner;
    const isWinner = winnerData?.odId === odId;

    return { isWinner, alreadyAnswered: false };
}

/**
 * Phase 1: Speed MCQ - First correct answer wins
 */
async function handlePhase1(
    request: SubmitAnswerRequest,
    odId: string,
    team: TeamType,
    playerName: string,
    gameData: GameDataServer
): Promise<SubmitAnswerResponse> {
    const { roomId, questionIndex, answer, clientTimestamp } = request;

    if (typeof answer !== 'number') {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Phase 1 requires numeric answer',
        };
    }

    const questions = gameData.phase1;
    if (!questions || !questions[questionIndex]) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Question not found',
        };
    }

    const question = questions[questionIndex];
    const correct = answer === question.correctIndex;

    // Record answer and check if winner
    const { isWinner, alreadyAnswered } = await recordPhase1Answer(
        roomId,
        odId,
        team,
        questionIndex,
        answer,
        clientTimestamp,
        correct
    );

    if (alreadyAnswered) {
        return {
            success: true,
            correct,
            pointsAwarded: 0,
            alreadyAnswered: true,
        };
    }

    // Award point if winner and update room state to show result
    const pointsAwarded = isWinner ? 1 : 0;
    if (isWinner) {
        const db = getDatabase();
        await Promise.all([
            awardPoints(roomId, odId, 1),
            // Reveal correct answer to all players (for result display)
            db.ref(`rooms/${roomId}/state/phase1CorrectAnswer/${questionIndex}`).set(question.correctIndex),
            // CRITICAL: Transition to result state so UI shows the correct answer
            db.ref(`rooms/${roomId}/state/phaseState`).set('result'),
            // Set round winner for UI display
            db.ref(`rooms/${roomId}/state/roundWinner`).set({
                playerId: odId,
                name: playerName,
                team
            }),
            // Clear timeout flag (round ended with a winner, not timeout)
            db.ref(`rooms/${roomId}/state/isTimeout`).set(false)
        ]);
    }

    return {
        success: true,
        correct,
        pointsAwarded,
        // Only reveal correct answer when round is over (winner found)
        // This prevents cheating with rebond system (multiple attempts)
        correctAnswerIndex: isWinner ? question.correctIndex : undefined,
        roundWinner: isWinner ? { odId, name: playerName, team } : undefined,
    };
}

/**
 * Phase 2: Binary choice (A/B/Both)
 */
async function handlePhase2(
    request: SubmitAnswerRequest,
    odId: string,
    team: TeamType,
    gameData: GameDataServer
): Promise<SubmitAnswerResponse> {
    const { roomId, questionIndex, answer, clientTimestamp } = request;

    if (typeof answer !== 'string' || !['A', 'B', 'Both'].includes(answer)) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Phase 2 requires A, B, or Both',
        };
    }

    const phase2Data = gameData.phase2;
    if (!phase2Data || !phase2Data.items || !phase2Data.items[questionIndex]) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Question not found',
        };
    }

    const item = phase2Data.items[questionIndex];
    const correct = answer === item.answer;
    const serverTimestamp = Date.now();

    // SECURITY FIX: Use transaction for atomic winner determination
    // This prevents race conditions when both teams submit simultaneously
    const db = getDatabase();
    const answersRef = db.ref(`rooms/${roomId}/state/phase2Answers/${questionIndex}`);

    const result = await answersRef.transaction((current) => {
        if (!current) {
            current = {};
        }

        // Check if team already answered
        if (current[team]) {
            return; // Abort - team already answered
        }

        // Record this team's answer
        current[team] = {
            odId,
            answer,
            clientTimestamp,
            correct,
            serverTimestamp,
        };

        return current;
    });

    // Transaction aborted - team already answered
    if (!result.committed) {
        return {
            success: true,
            correct,
            pointsAwarded: 0,
            teamAlreadyAnswered: true,
        };
    }

    // Determine winner from transaction result
    const answers = result.snapshot.val() || {};
    const otherTeam = team === 'spicy' ? 'sweet' : 'spicy';
    const otherTeamAnswer = answers[otherTeam];

    let isWinner = false;
    if (correct) {
        if (!otherTeamAnswer) {
            // First correct answer
            isWinner = true;
        } else if (!otherTeamAnswer.correct) {
            // Other team was wrong, we win
            isWinner = true;
        } else {
            // Both correct - compare serverTimestamp first (can't be spoofed), then clientTimestamp
            isWinner = serverTimestamp < otherTeamAnswer.serverTimestamp ||
                (serverTimestamp === otherTeamAnswer.serverTimestamp && clientTimestamp < otherTeamAnswer.clientTimestamp);
        }
    }

    const pointsAwarded = isWinner ? 1 : 0;
    if (isWinner) {
        await awardPoints(roomId, odId, 1);
    }

    return {
        success: true,
        correct,
        pointsAwarded,
        roundWinner: isWinner ? { odId, name: '', team } : undefined,
    };
}

/**
 * Phase 3: Text answers with LLM validation
 */
async function handlePhase3(
    request: SubmitAnswerRequest,
    odId: string,
    team: TeamType,
    gameData: GameDataServer
): Promise<SubmitAnswerResponse> {
    const { roomId, answer } = request;

    if (typeof answer !== 'string') {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Phase 3 requires text answer',
        };
    }

    // Input sanitization for text answers
    if (answer.length > 500) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Answer too long (max 500 characters)',
        };
    }

    // FIX: Get actual questionIndex from team's progress in room state
    // The client passes 0, but we need to look up the real index from team progress
    const db = getDatabase();
    const teamProgressRef = db.ref(`rooms/${roomId}/state/phase3TeamProgress/${team}`);
    const progressSnapshot = await teamProgressRef.get();

    if (!progressSnapshot.exists()) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Team progress not found',
        };
    }

    const teamProgress = progressSnapshot.val();
    const actualQuestionIndex = teamProgress.currentQuestionIndex ?? 0;
    const themeIndex = teamProgress.themeIndex ?? 0;

    // Get questions for this team's selected theme
    const themes = gameData.phase3 as Phase3ThemeServer[] | undefined;
    if (!themes) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Phase 3 questions not found',
        };
    }

    // Phase 3 questions are organized by theme
    const theme = themes[themeIndex];
    if (!theme || !theme.questions || !theme.questions[actualQuestionIndex]) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Question not found for this theme',
        };
    }

    const question = theme.questions[actualQuestionIndex];

    // Check if team already answered this question
    const teamAnswerRef = db.ref(`rooms/${roomId}/state/phase3Answers/${team}/${actualQuestionIndex}`);
    const existingAnswer = await teamAnswerRef.get();

    if (existingAnswer.exists()) {
        return {
            success: true,
            correct: false,
            pointsAwarded: 0,
            teamAlreadyAnswered: true,
        };
    }

    // Validate answer using LLM
    const validation = await validateAnswer(
        answer,
        question.answer,
        question.acceptableAnswers
    );

    // Record answer
    await teamAnswerRef.set({
        odId,
        answer,
        correct: validation.isCorrect,
        confidence: validation.confidence,
        matchType: validation.matchType,
        serverTimestamp: Date.now(),
    });

    const pointsAwarded = validation.isCorrect ? 1 : 0;
    if (validation.isCorrect) {
        await awardPoints(roomId, odId, 1);
    }

    return {
        success: true,
        correct: validation.isCorrect,
        pointsAwarded,
        llmFeedback: validation.explanation,
        confidence: validation.confidence,
    };
}

/**
 * Phase 4: MCQ with buzzer (first correct wins)
 */
async function handlePhase4(
    request: SubmitAnswerRequest,
    odId: string,
    team: TeamType,
    gameData: GameDataServer
): Promise<SubmitAnswerResponse> {
    const { roomId, questionIndex, answer } = request;

    if (typeof answer !== 'number') {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Phase 4 requires numeric answer',
        };
    }

    const questions = gameData.phase4;
    if (!questions || !questions[questionIndex]) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Question not found',
        };
    }

    // Check if player is the one who buzzed
    const db = getDatabase();
    const buzzRef = db.ref(`rooms/${roomId}/state/phase4Buzz/${questionIndex}`);
    const buzzSnapshot = await buzzRef.get();

    if (!buzzSnapshot.exists()) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            notBuzzer: true,
            message: 'Must buzz first',
        };
    }

    const buzzData = buzzSnapshot.val();
    if (buzzData.odId !== odId) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            notBuzzer: true,
            message: 'Not the player who buzzed',
        };
    }

    const question = questions[questionIndex];
    const correct = answer === question.correctIndex;

    // Record answer
    const answerRef = db.ref(`rooms/${roomId}/state/phase4Answers/${questionIndex}`);
    await answerRef.set({
        odId,
        team,
        answer,
        correct,
        serverTimestamp: Date.now(),
    });

    const pointsAwarded = correct ? 1 : 0;
    if (correct) {
        await awardPoints(roomId, odId, 1);
    }

    return {
        success: true,
        correct,
        pointsAwarded,
        roundWinner: correct ? { odId, name: '', team } : undefined,
    };
}

/**
 * Phase 5: Memorization answers with LLM validation
 *
 * NOTE: Points are NOT awarded here. Scoring for Phase 5 requires checking
 * if first 5 are correct IN ORDER, or all 10 are correct IN ORDER.
 * This is calculated by the frontend service when both teams finish.
 */
async function handlePhase5(
    request: SubmitAnswerRequest,
    _odId: string,
    _team: TeamType,
    gameData: GameDataServer
): Promise<SubmitAnswerResponse> {
    const { questionIndex, answer } = request;

    if (typeof answer !== 'string') {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Phase 5 requires text answer',
        };
    }

    // Input sanitization for text answers
    if (answer.length > 500) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Answer too long (max 500 characters)',
        };
    }

    const questions = gameData.phase5;
    if (!questions || !questions[questionIndex]) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Question not found',
        };
    }

    const question = questions[questionIndex];

    // Validate answer using LLM
    const validation = await validateAnswer(
        answer,
        question.answer,
        question.acceptableAnswers
    );

    // Note: We don't store in RTDB here - the frontend service handles that
    // The CF just validates and returns the result

    // Check if this was the last question (for teamFinished flag)
    const totalQuestions = questions.length;
    const teamFinished = questionIndex >= totalQuestions - 1;

    // Points are calculated by frontend when both teams finish
    // (requires checking "in order" which needs all answers)
    return {
        success: true,
        correct: validation.isCorrect,
        pointsAwarded: 0, // Calculated by frontend based on "in order" rule
        llmFeedback: validation.explanation,
        confidence: validation.confidence,
        teamFinished,
    };
}

/**
 * Handle solo mode answers
 */
async function handleSoloAnswer(
    request: SubmitAnswerRequest,
    odId: string,
    gameData: GameDataServer
): Promise<SubmitAnswerResponse> {
    const { phase, questionIndex, answer } = request;

    switch (phase) {
        case 'phase1': {
            if (typeof answer !== 'number') {
                return { success: false, correct: false, pointsAwarded: 0, error: 'INVALID_PHASE' };
            }
            const question = gameData.phase1?.[questionIndex];
            if (!question) {
                return { success: false, correct: false, pointsAwarded: 0, error: 'INVALID_QUESTION' };
            }
            const correct = answer === question.correctIndex;
            return { success: true, correct, pointsAwarded: correct ? 1 : 0 };
        }

        case 'phase2': {
            if (typeof answer !== 'string') {
                return { success: false, correct: false, pointsAwarded: 0, error: 'INVALID_PHASE' };
            }
            const item = gameData.phase2?.items?.[questionIndex];
            if (!item) {
                return { success: false, correct: false, pointsAwarded: 0, error: 'INVALID_QUESTION' };
            }
            const correct = answer === item.answer;
            return { success: true, correct, pointsAwarded: correct ? 1 : 0 };
        }

        case 'phase4': {
            if (typeof answer !== 'number') {
                return { success: false, correct: false, pointsAwarded: 0, error: 'INVALID_PHASE' };
            }
            const question = gameData.phase4?.[questionIndex];
            if (!question) {
                return { success: false, correct: false, pointsAwarded: 0, error: 'INVALID_QUESTION' };
            }
            const correct = answer === question.correctIndex;
            return { success: true, correct, pointsAwarded: correct ? 1 : 0 };
        }

        default:
            return {
                success: false,
                correct: false,
                pointsAwarded: 0,
                error: 'INVALID_PHASE',
                message: `Solo mode not supported for ${phase}`,
            };
    }
}

/**
 * Cloud Function: revealPhase1Answer
 *
 * Called by host when Phase 1 timer expires with no correct answer.
 * Reveals the correct answer index to all players.
 */
export const revealPhase1Answer = onCall({
    region: 'europe-west1',
    memory: '128MiB',
}, async ({ data, auth }): Promise<{ success: boolean; correctIndex?: number; error?: string }> => {
    if (!auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { roomId, questionIndex } = data as { roomId: string; questionIndex: number };
    const odId = auth.uid;

    if (!roomId || questionIndex === undefined) {
        return { success: false, error: 'Missing roomId or questionIndex' };
    }

    // Verify user is host
    const db = getDatabase();
    const hostIdSnapshot = await db.ref(`rooms/${roomId}/hostId`).get();
    if (!hostIdSnapshot.exists() || hostIdSnapshot.val() !== odId) {
        return { success: false, error: 'Only host can reveal answer' };
    }

    // Get game data
    const gameData = await getGameData(roomId);
    if (!gameData?.phase1?.[questionIndex]) {
        return { success: false, error: 'Question not found' };
    }

    const correctIndex = gameData.phase1[questionIndex].correctIndex;

    // Write correct answer to room state
    await db.ref(`rooms/${roomId}/state/phase1CorrectAnswer/${questionIndex}`).set(correctIndex);

    return { success: true, correctIndex };
});

/**
 * Main Cloud Function: submitAnswer
 */
export const submitAnswer = onCall({
    minInstances: 1, // Avoid cold start (~$15/month)
    region: 'europe-west1', // Low latency for EU users
    memory: '256MiB',
}, async ({ data, auth }): Promise<SubmitAnswerResponse> => {
    // Auth check
    if (!auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const request = data as SubmitAnswerRequest;
    const { roomId, phase, isSolo } = request;
    const odId = auth.uid;

    // Validate request
    if (!roomId || !phase) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Missing roomId or phase',
        };
    }

    // Get game data (with correct answers)
    const gameData = await getGameData(roomId);
    if (!gameData) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_QUESTION',
            message: 'Game data not found',
        };
    }

    // SECURITY FIX: Verify solo mode server-side
    // In solo mode, roomId === auth.uid (the player's own session)
    const isActuallySolo = roomId === odId;
    if (isSolo && !isActuallySolo) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Invalid solo mode request - roomId must match user ID',
        };
    }

    // Solo mode: simpler validation (verified server-side)
    if (isActuallySolo) {
        return handleSoloAnswer(request, odId, gameData);
    }

    // Multiplayer: verify player is in room
    const playerInfo = await getPlayerInfo(roomId, odId);
    if (!playerInfo.exists) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'NOT_IN_ROOM',
            message: 'Player not found in room',
        };
    }

    const team = playerInfo.team;
    if (!team) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'NOT_IN_ROOM',
            message: 'Player not assigned to a team',
        };
    }

    // SECURITY FIX: Verify room is actually in the requested phase
    const db = getDatabase();
    const roomStatusRef = db.ref(`rooms/${roomId}/state/status`);
    const statusSnapshot = await roomStatusRef.get();
    const currentPhase = statusSnapshot.val();

    if (currentPhase !== phase) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: `Room is in ${currentPhase}, not ${phase}`,
        };
    }

    // Route to phase-specific handler
    switch (phase) {
        case 'phase1':
            return handlePhase1(request, odId, team, playerInfo.name || 'Joueur', gameData);
        case 'phase2':
            return handlePhase2(request, odId, team, gameData);
        case 'phase3':
            return handlePhase3(request, odId, team, gameData);
        case 'phase4':
            return handlePhase4(request, odId, team, gameData);
        case 'phase5':
            return handlePhase5(request, odId, team, gameData);
        default:
            return {
                success: false,
                correct: false,
                pointsAwarded: 0,
                error: 'INVALID_PHASE',
                message: `Unknown phase: ${phase}`,
            };
    }
});
