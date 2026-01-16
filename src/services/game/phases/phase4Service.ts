/**
 * Phase 4 (La Note) - Speed MCQ race service
 * First correct answer wins 2 points
 *
 * Server-Side Validation:
 * Answer validation is now handled by Cloud Function submitAnswer.
 * This service only handles state management (advancing questions, timeouts).
 */

import { ref, get, update, runTransaction } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF } from '../../firebase';
import type { SubmitAnswerResponse } from '../../firebase';
import { validateRoom } from '../roomService';

/**
 * Submit an answer for Phase 4.
 * Uses a transaction to handle race conditions.
 * First player to answer correctly wins 2 points.
 *
 * SERVER-SIDE VALIDATION: All validation is now done by Cloud Function submitAnswer.
 * This function is a thin wrapper that forwards the request to the CF.
 *
 * @returns The response from the Cloud Function
 */
export const submitPhase4Answer = async (
    roomCode: string,
    _playerId: string, // Unused - kept for API compatibility
    answerIndex: number
): Promise<SubmitAnswerResponse> => {
    const roomId = roomCode.toUpperCase();

    // Get current question index from room state
    const stateSnapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (!stateSnapshot.exists()) {
        return {
            success: false,
            correct: false,
            pointsAwarded: 0,
            error: 'NOT_IN_ROOM',
            message: 'Room not found'
        };
    }

    const state = stateSnapshot.val();
    const questionIndex = state.currentPhase4QuestionIndex ?? 0;

    // Call Cloud Function for server-side validation
    const result = await submitAnswerCF({
        roomId,
        phase: 'phase4',
        questionIndex,
        answer: answerIndex,
        clientTimestamp: Date.now(),
        isSolo: false
    });

    return result;
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
