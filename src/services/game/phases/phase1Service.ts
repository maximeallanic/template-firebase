/**
 * Phase 1 (Tenders) - Speed MCQ service
 * First correct answer wins the point for their team
 *
 * Server-Side Validation:
 * Answer validation is now handled by Cloud Function submitAnswer.
 * This service only handles state management (starting questions, timeouts).
 */

import { ref, get, update } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF, revealPhase1Answer } from '../../firebase';
import type { SubmitAnswerResponse } from '../../firebase';
import { validateRoom } from '../roomService';
import type { GameState } from '../../../types/gameTypes';

/**
 * @deprecated This function is no longer used. Phase 1 now starts directly in 'answering' state.
 * Kept for backward compatibility but does nothing.
 */
export const schedulePhase1Transition = (): void => {
    // No-op: Phase 1 now starts directly in 'answering' state (no 3s countdown)
};

/**
 * Start the next question in Phase 1
 * @param code - Room code
 * @param nextIndex - Index of the next question
 */
export const startNextQuestion = async (code: string, nextIndex: number): Promise<void> => {
    const roomId = code.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    const questionsList = room.customQuestions?.phase1 || [];

    // Safety check: prevent out of bounds
    if (nextIndex >= questionsList.length) return;

    // Guard against duplicate calls: only advance if in 'result' state
    // and the current question index is actually the previous one
    const currentIndex = room.state.currentQuestionIndex ?? -1;
    if (room.state.phaseState !== 'result' && room.state.phaseState !== 'idle') {
        return;
    }
    if (currentIndex !== nextIndex - 1) {
        return;
    }

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/currentQuestionIndex`] = nextIndex;
    updates[`rooms/${roomId}/state/phaseState`] = 'answering'; // Skip reading delay, go directly to answering
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/isTimeout`] = false; // Reset timeout flag for new question
    updates[`rooms/${roomId}/state/phase1Answers`] = {};
    updates[`rooms/${roomId}/state/phase1BlockedTeams`] = []; // Reset blocked teams
    updates[`rooms/${roomId}/state/phase1TriedWrongOptions`] = []; // Reset tried wrong options for rebond
    updates[`rooms/${roomId}/state/phase1LastWrongTeam`] = null;
    updates[`rooms/${roomId}/state/questionStartTime`] = Date.now();

    // Note: Question marking is now done client-side in Phase1Player.tsx
    // Each player's component marks the question as seen on their own device
    // This ensures the correct user's history is updated (auth.currentUser.uid)

    await update(ref(rtdb), updates);
};

/**
 * Handle Phase 1 timeout (timer expired with no correct answer)
 * Sets phaseState to 'result' with no winner, allowing normal flow to continue
 * Also reveals the correct answer via Cloud Function
 * @param code - Room code
 */
export const handlePhase1Timeout = async (code: string): Promise<void> => {
    const roomId = code.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (!snapshot.exists()) return;

    const state = snapshot.val() as GameState;

    // Only handle timeout if currently in 'answering' state
    if (state.phaseState !== 'answering') {
        return;
    }

    const questionIndex = state.currentQuestionIndex ?? 0;

    // Transition to 'result' with no winner (timeout)
    // Run both in parallel: update state + reveal correct answer
    await Promise.all([
        update(ref(rtdb, `rooms/${roomId}/state`), {
            phaseState: 'result',
            roundWinner: null,
            isTimeout: true
        }),
        // Reveal the correct answer via Cloud Function (only host calls this)
        revealPhase1Answer(roomId, questionIndex)
    ]);
};

/**
 * Submit an answer for Phase 1
 * First correct answer from a team wins the round
 * Implements "rebond" logic: wrong answer blocks team, other team gets a chance
 *
 * SERVER-SIDE VALIDATION: All validation is now done by Cloud Function submitAnswer.
 * This function is a thin wrapper that forwards the request to the CF.
 *
 * @returns The response from the Cloud Function
 */
export const submitAnswer = async (
    code: string,
    _playerId: string, // Unused - kept for API compatibility
    answerIndex: number
): Promise<SubmitAnswerResponse> => {
    const roomId = code.toUpperCase();

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
    const questionIndex = state.currentQuestionIndex ?? 0;

    // Call Cloud Function for server-side validation
    const result = await submitAnswerCF({
        roomId,
        phase: 'phase1',
        questionIndex,
        answer: answerIndex,
        clientTimestamp: Date.now(),
        isSolo: false
    });

    return result;
};
