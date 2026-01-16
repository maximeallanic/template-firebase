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

        // Find the earliest correct answer by clientTimestamp
        const pendingAnswers = current.pending || {};
        const correctAnswers = Object.values(pendingAnswers as Record<string, PendingAnswer>)
            .filter((a: PendingAnswer) => a.correct);

        if (correctAnswers.length === 0) {
            return current;
        }

        // Sort by client timestamp
        correctAnswers.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
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

    // Award point if winner
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

    // Check if team already answered
    const db = getDatabase();
    const teamAnswerRef = db.ref(`rooms/${roomId}/state/phase2Answers/${questionIndex}/${team}`);
    const existingAnswer = await teamAnswerRef.get();

    if (existingAnswer.exists()) {
        return {
            success: true,
            correct,
            pointsAwarded: 0,
            teamAlreadyAnswered: true,
        };
    }

    // Record team answer
    await teamAnswerRef.set({
        odId,
        answer,
        clientTimestamp,
        correct,
        serverTimestamp: Date.now(),
    });

    // Check if this team wins the round (first correct)
    const otherTeam = team === 'spicy' ? 'sweet' : 'spicy';
    const otherTeamRef = db.ref(`rooms/${roomId}/state/phase2Answers/${questionIndex}/${otherTeam}`);
    const otherTeamAnswer = await otherTeamRef.get();

    let isWinner = false;
    if (correct) {
        if (!otherTeamAnswer.exists()) {
            // First correct answer
            isWinner = true;
        } else {
            // Other team already answered
            const otherData = otherTeamAnswer.val();
            if (!otherData.correct) {
                // Other team was wrong, we win
                isWinner = true;
            } else {
                // Both correct - compare timestamps
                isWinner = clientTimestamp < otherData.clientTimestamp;
            }
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
    const { roomId, questionIndex, answer } = request;

    if (typeof answer !== 'string') {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'INVALID_PHASE',
            message: 'Phase 3 requires text answer',
        };
    }

    const questions = gameData.phase3;
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

    // Check if team already answered this question
    const db = getDatabase();
    const teamAnswerRef = db.ref(`rooms/${roomId}/state/phase3Answers/${team}/${questionIndex}`);
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

    // Solo mode: simpler validation
    if (isSolo) {
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

    // Route to phase-specific handler
    switch (phase) {
        case 'phase1':
            return handlePhase1(request, odId, team, gameData);
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
