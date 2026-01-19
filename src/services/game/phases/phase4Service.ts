/**
 * Phase 4 (La Note) - Speed MCQ race service
 * First correct answer wins 2 points
 */

import { ref, get, update, runTransaction, increment } from 'firebase/database';
import { rtdb } from '../../firebase';
import { validateRoom } from '../roomService';
import { PHASE4_QUESTIONS } from '../../../data/phase4';
import type { Phase4Answer, Phase4Winner } from '../../../types/gameTypes';

/**
 * Submit an answer for Phase 4.
 * Uses a transaction to handle race conditions.
 * First player to answer correctly wins 2 points.
 */
export const submitPhase4Answer = async (
    roomCode: string,
    playerId: string,
    answerIndex: number
): Promise<void> => {
    const roomId = roomCode.toUpperCase();
    const timestamp = Date.now();

    // Get room data
    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;
    const room = validateRoom(roomSnapshot.val());

    // Validate state
    if (room.state.phase4State !== 'questioning') return;

    const player = room.players[playerId];
    if (!player || !player.team) return;

    // Get current question
    const questionsList = room.customQuestions?.phase4 || PHASE4_QUESTIONS;
    const currentIdx = room.state.currentPhase4QuestionIndex ?? 0;
    const currentQuestion = questionsList[currentIdx];
    if (!currentQuestion) return;

    const isCorrect = answerIndex === currentQuestion.correctIndex;

    // Use transaction for atomic answer submission
    const answersRef = ref(rtdb, `rooms/${roomId}/state/phase4Answers`);

    const result = await runTransaction(answersRef, (currentAnswers) => {
        const answers = currentAnswers || {};

        // If already answered, abort
        if (playerId in answers) return;

        // Add this player's answer with timestamp
        return {
            ...answers,
            [playerId]: { answer: answerIndex, timestamp }
        };
    });

    if (!result.committed) return;

    // If this is a correct answer, check if it's the first
    if (isCorrect) {
        const stateRef = ref(rtdb, `rooms/${roomId}/state`);

        await runTransaction(stateRef, (currentState) => {
            if (!currentState) return currentState;

            // Only process if still in questioning state and no winner yet
            if (currentState.phase4State !== 'questioning') return;
            if (currentState.phase4Winner) return;

            // Check all answers to find the first correct one
            const allAnswers = currentState.phase4Answers || {};
            let firstCorrectPlayer: string | null = null;
            let firstCorrectTime = Infinity;

            for (const [pid, data] of Object.entries(allAnswers)) {
                const answerData = data as Phase4Answer;
                if (answerData.answer === currentQuestion.correctIndex) {
                    if (answerData.timestamp < firstCorrectTime) {
                        firstCorrectTime = answerData.timestamp;
                        firstCorrectPlayer = pid;
                    }
                }
            }

            // If this player is the first correct, set winner and transition to result
            if (firstCorrectPlayer === playerId) {
                return {
                    ...currentState,
                    phase4State: 'result',
                    phase4Winner: {
                        playerId,
                        name: player.name,
                        team: player.team
                    } as Phase4Winner
                };
            }

            return currentState;
        });

        // Award points if this player won
        const updatedState = (await get(ref(rtdb, `rooms/${roomId}/state`))).val();
        if (updatedState?.phase4Winner?.playerId === playerId) {
            await update(ref(rtdb), {
                [`rooms/${roomId}/players/${playerId}/score`]: increment(2)
            });
        }
    }

    // Check if all real players have answered (handles "all wrong" case)
    const updatedSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!updatedSnapshot.exists()) return;
    const updatedRoom = validateRoom(updatedSnapshot.val());

    // Skip if already transitioned to result (e.g., someone got it right)
    if (updatedRoom.state.phase4State !== 'questioning') return;

    // Count real online players (exclude mock players)
    const realPlayers = Object.values(updatedRoom.players).filter(
        (p) => p.isOnline && !p.id.startsWith('mock_')
    );

    const allAnswers = updatedRoom.state.phase4Answers || {};
    const realAnswerCount = Object.keys(allAnswers).filter(
        pid => !pid.startsWith('mock_')
    ).length;

    // If all real players have answered
    if (realAnswerCount >= realPlayers.length && realPlayers.length > 0) {
        // Check if any answer is correct
        const hasCorrectAnswer = Object.values(allAnswers).some(
            (a) => (a as Phase4Answer).answer === currentQuestion.correctIndex
        );

        // If no correct answer, transition to result with no winner
        if (!hasCorrectAnswer) {
            const stateRef = ref(rtdb, `rooms/${roomId}/state`);
            await runTransaction(stateRef, (currentState) => {
                if (!currentState) return currentState;
                // Double-check still in questioning (avoid race)
                if (currentState.phase4State !== 'questioning') return;

                return {
                    ...currentState,
                    phase4State: 'result',
                    phase4Winner: null
                };
            });
        }
    }
};

/**
 * Handle timeout (15s elapsed without correct answer).
 * Transitions to 'result' state with no winner.
 */
export const handlePhase4Timeout = async (roomCode: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();

    const stateRef = ref(rtdb, `rooms/${roomId}/state`);

    await runTransaction(stateRef, (currentState) => {
        if (!currentState) return currentState;
        if (currentState.phase4State !== 'questioning') return;

        // Time's up - no winner
        return {
            ...currentState,
            phase4State: 'result',
            phase4Winner: null,
            isTimeout: true
        };
    });
};

/**
 * Move to the next question.
 * Resets answers and timer.
 */
export const nextPhase4Question = async (roomCode: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();

    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;
    const room = validateRoom(roomSnapshot.val());

    const nextIndex = (room.state.currentPhase4QuestionIndex || 0) + 1;

    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/currentPhase4QuestionIndex`]: nextIndex,
        [`rooms/${roomId}/state/phase4State`]: 'questioning',
        [`rooms/${roomId}/state/phase4Answers`]: {},
        [`rooms/${roomId}/state/phase4QuestionStartTime`]: Date.now(),
        [`rooms/${roomId}/state/phase4Winner`]: null,
        [`rooms/${roomId}/state/isTimeout`]: false  // Reset timeout flag for new question
    };

    await update(ref(rtdb), updates);
};
