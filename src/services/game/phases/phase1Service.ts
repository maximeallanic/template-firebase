/**
 * Phase 1 (Tenders) - Speed MCQ service
 * First correct answer wins the point for their team
 */

import { ref, get, update, runTransaction, increment } from 'firebase/database';
import { rtdb } from '../../firebase';
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

    // Transition to 'result' with no winner (timeout)
    await update(ref(rtdb, `rooms/${roomId}/state`), {
        phaseState: 'result',
        roundWinner: null
    });
};

/**
 * Submit an answer for Phase 1
 * First correct answer from a team wins the round
 * Implements "rebond" logic: wrong answer blocks team, other team gets a chance
 */
export const submitAnswer = async (code: string, playerId: string, answerIndex: number): Promise<void> => {
    const roomId = code.toUpperCase();
    const stateRef = ref(rtdb, `rooms/${roomId}/state`);

    // First, get room data to access questions and player info (read-only)
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

    const questionsList = room.customQuestions?.phase1 || [];

    // Determine which teams have real (non-mock) online players
    // This allows solo play/debug mode to work when only one team is active
    const teamsWithRealPlayers = new Set<Team>();
    Object.values(room.players).forEach(p => {
        if (p.team && p.isOnline && !p.id.startsWith('mock_')) {
            teamsWithRealPlayers.add(p.team);
        }
    });
    const activeTeams = Array.from(teamsWithRealPlayers);

    // Use transaction for atomic state updates to prevent race conditions
    const result = await runTransaction(stateRef, (currentState: GameState | null) => {
        if (!currentState) return currentState;

        const qIndex = currentState.currentQuestionIndex ?? -1;

        // Validate state
        if (currentState.phaseState !== 'answering' || qIndex === -1) {
            return; // Abort transaction
        }

        // Check if player's team is blocked
        const blockedTeams = currentState.phase1BlockedTeams || [];
        if (player.team && blockedTeams.includes(player.team)) {
            return; // Abort - team already blocked
        }

        // Check if player already answered
        const existingAnswers = currentState.phase1Answers || {};
        if (playerId in existingAnswers) {
            return; // Abort - already answered
        }

        // REBOND: Check if this option was already tried and failed
        const triedWrongOptions = currentState.phase1TriedWrongOptions || [];
        if (triedWrongOptions.includes(answerIndex)) {
            return; // Abort - option already eliminated
        }

        // Get current question
        const currentQuestion = questionsList[qIndex];
        if (!currentQuestion) return;

        const isCorrect = answerIndex === currentQuestion.correctIndex;

        // Build new state
        const newState = { ...currentState };
        newState.phase1Answers = { ...existingAnswers, [playerId]: isCorrect };

        if (isCorrect) {
            // TEAM WINS! First correct answer wins the round
            newState.roundWinner = {
                playerId: playerId,
                name: player.name,
                team: player.team || 'neutral'
            };
            newState.phaseState = 'result';
        } else if (player.team) {
            // WRONG ANSWER: Implement rebond logic

            // 1. Record this option as tried-wrong
            const newTriedWrongOptions = [...triedWrongOptions, answerIndex];
            newState.phase1TriedWrongOptions = newTriedWrongOptions;
            newState.phase1LastWrongTeam = player.team;

            // 2. Check if only 1 option remains (3 wrong options tried = only correct answer left)
            // In this case, no team gets a point (the answer is obvious)
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
            } else if (blockedTeams.includes(otherTeam) && otherTeamHasPlayers) {
                // REBOND: Other team was blocked, now unblock them and block current team
                newState.phase1BlockedTeams = [player.team];

                // Clear all answers on rebond so the unblocked team can answer again
                // The blocked team can't answer anyway (blocked), and the unblocked team gets a fresh start
                newState.phase1Answers = {};
            } else {
                // First wrong answer: just block current team
                newState.phase1BlockedTeams = [...blockedTeams, player.team];
            }
        }

        return newState;
    });

    // If transaction committed and player won, update their score atomically
    if (result.committed) {
        const newState = result.snapshot.val() as GameState;
        if (newState?.roundWinner?.playerId === playerId) {
            // Use increment() for atomic score update (prevents race conditions)
            await update(ref(rtdb), {
                [`rooms/${roomId}/players/${playerId}/score`]: increment(1)
            });
        }
    }
};
