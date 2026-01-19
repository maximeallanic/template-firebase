/**
 * Phase 2 (Sucré Salé) - Binary choice service
 * Both teams have 20s to answer. First correct answer wins.
 *
 * Server-Side Validation:
 * Answer validation is now handled by Cloud Function submitAnswer.
 * This service only handles state management (advancing items, timeouts).
 */

import { ref, get, update, increment } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF } from '../../firebase';
import type { SubmitAnswerResponse } from '../../firebase';
import { validateRoom } from '../roomService';
import type { Team, SimplePhase2Set } from '../../../types/gameTypes';

// Note: Auto-advance is now handled by Cloud Function
// Legacy lock removed - CF handles all state transitions

/**
 * Advance to the next Phase 2 item
 */
export const nextPhase2Item = async (code: string) => {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = validateRoom(snapshot.val());
    if (room.state.status !== 'phase2') return;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase2TeamAnswers`] = {};
    updates[`rooms/${roomId}/state/phase2RoundWinner`] = null;
    updates[`rooms/${roomId}/state/phase2BothCorrect`] = false;

    const nextIndex = (room.state.currentPhase2Item ?? 0) + 1;
    updates[`rooms/${roomId}/state/currentPhase2Item`] = nextIndex;
    updates[`rooms/${roomId}/state/phaseState`] = 'answering'; // Phase 2 allows immediate answering
    updates[`rooms/${roomId}/state/phase2QuestionStartTime`] = Date.now();

    await update(ref(rtdb), updates);
};

/**
 * Submit a Phase 2 answer - Parallel mode (both teams have 20s to answer)
 * Only 1 person per team needs to answer.
 * Round ends when: both teams answered OR timeout (20s).
 * Winner determined by: first correct answer wins (by timestamp if both correct).
 *
 * SERVER-SIDE VALIDATION: All validation is now done by Cloud Function submitAnswer.
 * This function is a thin wrapper that forwards the request to the CF.
 *
 * @returns The response from the Cloud Function
 */
export const submitPhase2Answer = async (
    roomId: string,
    _playerId: string, // Unused - kept for API compatibility
    answer: 'A' | 'B' | 'Both'
): Promise<SubmitAnswerResponse> => {
    const roomCode = roomId.toUpperCase();

    // Get current question index from room state
    const stateSnapshot = await get(ref(rtdb, `rooms/${roomCode}/state`));
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
    const questionIndex = state.currentPhase2Item ?? 0;

    // Call Cloud Function for server-side validation
    const result = await submitAnswerCF({
        roomId: roomCode,
        phase: 'phase2',
        questionIndex,
        answer,
        clientTimestamp: Date.now(),
        isSolo: false
    });

    return result;
};

/**
 * End Phase 2 round on timeout (20s elapsed).
 * Evaluates answers received and determines winner.
 */
export const endPhase2Round = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    // Already in result state, skip
    if (room.state.phaseState === 'result') return;

    const setIndex = room.state.currentPhase2Set ?? 0;
    const itemIndex = room.state.currentPhase2Item ?? 0;
    const phase2Sets = room.customQuestions?.phase2 as SimplePhase2Set[] | undefined;
    const currentSet = phase2Sets?.[setIndex];

    // Server-side questions required - return early if missing
    if (!currentSet) {
        console.error('[Phase2Service] No question set available for timeout handling');
        return;
    }

    const item = currentSet?.items?.[itemIndex];
    const hasAnecdote = item?.anecdote;

    // Get team answers
    const teamAnswers = room.state.phase2TeamAnswers || {};
    const spicyAnswer = teamAnswers.spicy;
    const sweetAnswer = teamAnswers.sweet;

    // Determine winner based on answers received
    let winner: Team | null = null;
    let winnerPlayerId: string | null = null;
    let winnerPlayerName: string | null = null;

    const spicyCorrect = spicyAnswer?.correct ?? false;
    const sweetCorrect = sweetAnswer?.correct ?? false;

    if (spicyCorrect && !sweetCorrect) {
        // Only spicy got it right
        winner = 'spicy';
        winnerPlayerId = spicyAnswer!.playerId;
        winnerPlayerName = spicyAnswer!.playerName;
    } else if (!spicyCorrect && sweetCorrect) {
        // Only sweet got it right
        winner = 'sweet';
        winnerPlayerId = sweetAnswer!.playerId;
        winnerPlayerName = sweetAnswer!.playerName;
    }
    // Else: both wrong or neither answered = no winner

    // Check if both teams got it correct
    const bothCorrect = spicyCorrect && sweetCorrect;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/phaseState`] = 'result';
    updates[`rooms/${roomId}/state/phase2RoundWinner`] = bothCorrect ? 'both' : winner;
    updates[`rooms/${roomId}/state/phase2BothCorrect`] = bothCorrect;
    updates[`rooms/${roomId}/state/roundWinner`] = winner
        ? { playerId: winnerPlayerId, name: winnerPlayerName, team: winner }
        : null;

    await update(ref(rtdb), updates);

    // Award points
    if (bothCorrect) {
        // Both teams correct - award point to BOTH players
        const pointUpdates: Record<string, ReturnType<typeof increment>> = {};
        if (spicyAnswer) {
            pointUpdates[`rooms/${roomId}/players/${spicyAnswer.playerId}/score`] = increment(1);
        }
        if (sweetAnswer) {
            pointUpdates[`rooms/${roomId}/players/${sweetAnswer.playerId}/score`] = increment(1);
        }
        if (Object.keys(pointUpdates).length > 0) {
            await update(ref(rtdb), pointUpdates);
        }
    } else if (winner && winnerPlayerId) {
        // Single winner
        await update(ref(rtdb), {
            [`rooms/${roomId}/players/${winnerPlayerId}/score`]: increment(1)
        });
    }

    // Auto-advance after delay
    const delay = hasAnecdote ? 10000 : 4000;
    setTimeout(() => nextPhase2Item(roomId), delay);
};

/**
 * Set the Phase 2 generation lock state (prevents double generation)
 * @deprecated Use acquireGenerationLock/releaseGenerationLock from lockService.ts instead.
 * This function is kept for backward compatibility but the new Firebase-based
 * distributed lock system should be used for all new code.
 */
export const setPhase2GeneratingState = async (code: string, isGenerating: boolean) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/state`), { phase2Generating: isGenerating });
};

/**
 * Get the Phase 2 generation lock state
 * @deprecated Use isGenerationLocked from lockService.ts instead.
 * This function is kept for backward compatibility but the new Firebase-based
 * distributed lock system should be used for all new code.
 */
export const getPhase2GeneratingState = async (code: string): Promise<boolean> => {
    const roomId = code.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/state/phase2Generating`));
    return snapshot.val() === true;
};
