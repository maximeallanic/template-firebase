/**
 * Phase 1 (Tenders) - Speed MCQ service
 * First correct answer wins the point for their team
 *
 * Server-side validation via submitAnswer CF (#72)
 * Scoring handled by nextPhase CF
 */

import { ref, get, update, runTransaction } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF, revealTimeoutAnswer as revealTimeoutCF } from '../../firebase';
import { validateRoom } from '../roomService';
import type { Team, GameState } from '../../../types/gameTypes';

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

    // Guard against duplicate calls: only advance from valid states
    const currentIndex = room.state.currentQuestionIndex ?? -1;
    const phaseState = room.state.phaseState;

    // Allow transition from:
    // 1. 'idle' state (first question start from readiness screen)
    // 2. 'result' state (advancing to next question)
    if (phaseState !== 'result' && phaseState !== 'idle') {
        return;
    }

    // For 'idle' state: allow starting first question (nextIndex 0) when currentIndex is 0
    // For 'result' state: require currentIndex to be exactly nextIndex - 1
    if (phaseState === 'idle') {
        // Starting from readiness screen - only allow index 0
        if (nextIndex !== 0) {
            return;
        }
    } else {
        // Advancing from result - must be sequential
        if (currentIndex !== nextIndex - 1) {
            return;
        }
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
 * Calls Cloud Function to reveal correct answer and transition to result state
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

    // Call CF to reveal correct answer and transition to result state
    try {
        await revealTimeoutCF(roomId, 'phase1', questionIndex, 'multi');
    } catch (error) {
        console.error('[Phase1] Error revealing timeout answer:', error);
        // Fallback: just transition to result state without revealing answer
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phaseState: 'result',
            roundWinner: null,
            isTimeout: true
        });
    }
};

/**
 * Submit an answer for Phase 1
 * First correct answer from a team wins the round
 * Implements "rebond" logic: wrong answer blocks team, other team gets a chance
 *
 * Uses server-side validation via submitAnswer CF (#72)
 * Scoring is handled by nextPhase CF
 */
export const submitAnswer = async (code: string, playerId: string, answerIndex: number): Promise<void> => {
    const roomId = code.toUpperCase();

    // First, get room data to access player info (read-only)
    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;

    const room = validateRoom(roomSnapshot.val());
    const player = room.players[playerId];
    if (!player) return;

    // Reject answers from players without a team assigned
    if (!player.team) {
        console.warn('Player has no team assigned, rejecting answer:', playerId);
        return;
    }

    const qIndex = room.state.currentQuestionIndex ?? -1;

    // Pre-checks before calling CF (to save latency on obvious rejections)
    if (room.state.phaseState !== 'answering' || qIndex === -1) {
        return;
    }

    // Check if player's team is blocked
    const blockedTeams = room.state.phase1BlockedTeams || [];
    if (blockedTeams.includes(player.team)) {
        return;
    }

    // Check if player already answered
    const existingAnswers = room.state.phase1Answers || {};
    if (playerId in existingAnswers) {
        return;
    }

    // Check if this option was already tried and failed
    const triedWrongOptions = room.state.phase1TriedWrongOptions || [];
    if (triedWrongOptions.includes(answerIndex)) {
        return;
    }

    // Determine which teams have real (non-mock) online players
    const teamsWithRealPlayers = new Set<Team>();
    Object.values(room.players).forEach(p => {
        if (p.team && p.isOnline && !p.id.startsWith('mock_')) {
            teamsWithRealPlayers.add(p.team);
        }
    });
    const activeTeams = Array.from(teamsWithRealPlayers);

    // Call server-side validation
    let isCorrect = false;
    try {
        const response = await submitAnswerCF(roomId, 'phase1', qIndex, answerIndex, Date.now());
        isCorrect = response.isCorrect;
    } catch (error) {
        console.error('[Phase1] Error calling submitAnswer CF:', error);
        return;
    }

    // Use transaction to update local state for display (rebond logic)
    const stateRef = ref(rtdb, `rooms/${roomId}/state`);
    const result = await runTransaction(stateRef, (currentState: GameState | null) => {
        if (!currentState) return currentState;

        // Re-validate state (might have changed during CF call)
        if (currentState.phaseState !== 'answering') {
            return; // Someone else already won
        }

        // Re-check if player already answered (race condition protection)
        const currentAnswers = currentState.phase1Answers || {};
        if (playerId in currentAnswers) {
            return;
        }

        // Re-check team blocking
        const currentBlockedTeams = currentState.phase1BlockedTeams || [];
        if (player.team && currentBlockedTeams.includes(player.team)) {
            return;
        }

        // Build new state
        const newState = { ...currentState };
        newState.phase1Answers = { ...currentAnswers, [playerId]: isCorrect };

        if (isCorrect) {
            // Check revealedAnswers to see if we're the winner
            // The CF atomically stores winner info in revealedAnswers/phase1/{qIndex}
            // We set roundWinner here for display, but authoritative winner is in revealedAnswers
            newState.roundWinner = {
                playerId: playerId,
                name: player.name,
                team: player.team || 'neutral'
            };
            newState.phaseState = 'result';
        } else if (player.team) {
            // WRONG ANSWER: Implement rebond logic

            // 1. Record this option as tried-wrong
            const currentTriedWrongOptions = currentState.phase1TriedWrongOptions || [];
            const newTriedWrongOptions = [...currentTriedWrongOptions, answerIndex];
            newState.phase1TriedWrongOptions = newTriedWrongOptions;
            newState.phase1LastWrongTeam = player.team;

            // 2. Check if only 1 option remains (3 wrong options tried = only correct answer left)
            if (newTriedWrongOptions.length >= 3) {
                newState.roundWinner = null;
                newState.phaseState = 'result';
                return newState;
            }

            // 3. Determine team blocking with rebond
            const otherTeam: Team = player.team === 'spicy' ? 'sweet' : 'spicy';
            const otherTeamHasPlayers = activeTeams.includes(otherTeam);

            if (activeTeams.length === 1) {
                // SOLO MODE: Don't block, let them keep trying with fewer options
                newState.phase1BlockedTeams = [];
            } else if (currentBlockedTeams.includes(otherTeam) && otherTeamHasPlayers) {
                // REBOND: Other team was blocked, now unblock them and block current team
                newState.phase1BlockedTeams = [player.team];
                // Clear all answers on rebond
                newState.phase1Answers = {};
            } else {
                // First wrong answer: just block current team
                newState.phase1BlockedTeams = [...currentBlockedTeams, player.team];
            }
        }

        return newState;
    });

    // Update player score if they won the round (real-time feedback)
    // Only award points if transaction committed AND this player is the winner
    if (result.committed) {
        const finalState = result.snapshot.val() as GameState | null;
        if (finalState?.roundWinner?.playerId === playerId && finalState?.phaseState === 'result') {
            const playerScoreRef = ref(rtdb, `rooms/${roomId}/players/${playerId}/score`);
            const currentScoreSnap = await get(playerScoreRef);
            const currentScore = currentScoreSnap.val() || 0;
            await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), {
                score: currentScore + 1 // Phase 1 gives 1 point per correct answer
            });
        }

        // If all options exhausted (3 wrong answers tried) without a winner,
        // reveal the correct answer so the UI can display it
        // Note: Check !roundWinner because Firebase RTDB converts null to undefined (key deletion)
        const allOptionsExhausted = (finalState?.phase1TriedWrongOptions?.length ?? 0) >= 3;
        if (finalState?.phaseState === 'result' &&
            !finalState?.roundWinner &&
            allOptionsExhausted) {
            try {
                await revealTimeoutCF(roomId, 'phase1', qIndex, 'multi');
            } catch (error) {
                console.error('[Phase1] Error revealing answer after all options exhausted:', error);
            }
        }
    }
};
