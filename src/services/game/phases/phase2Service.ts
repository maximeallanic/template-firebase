/**
 * Phase 2 (Sucré Salé) - Binary choice service
 * Both teams have 20s to answer. First correct answer wins.
 *
 * Server-side validation via submitAnswer CF (#72)
 * Scoring handled by nextPhase CF
 */

import { ref, get, update, runTransaction } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF, revealTimeoutAnswer as revealTimeoutCF } from '../../firebase';
import { validateRoom } from '../roomService';
import type {
    Team, GameState, SimplePhase2Set, Phase2TeamAnswer, Phase2TeamAnswers
} from '../../../types/gameTypes';

// Module-level lock for Phase 2 auto-advance to prevent multiple setTimeout calls
// Key format: `${roomId}_${currentPhase2Item}`
const phase2AutoAdvanceScheduled: Record<string, boolean> = {};

/**
 * Advance to the next Phase 2 item
 * When called from idle state (via Phase2Intro), starts at item 0
 * When called after a result, advances to next item
 * If no more items, does nothing (UI will trigger phase_results)
 */
export const nextPhase2Item = async (code: string) => {
    const roomId = code.toUpperCase();
    console.log('[nextPhase2Item] Starting', { roomId });

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) {
        console.log('[nextPhase2Item] Room not found');
        return;
    }

    const room = validateRoom(snapshot.val());
    if (room.state.status !== 'phase2') {
        console.log('[nextPhase2Item] Not in phase2, status:', room.state.status);
        return;
    }

    const phaseState = room.state.phaseState;
    const currentIndex = room.state.currentPhase2Item ?? 0;

    // Guard: only allow transition from 'idle' (starting phase) or 'result' (after a question)
    if (phaseState !== 'idle' && phaseState !== 'result') {
        console.log('[nextPhase2Item] Invalid phaseState:', phaseState);
        return;
    }

    // Calculate next index based on current state
    // From 'idle': start at 0 (first item)
    // From 'result': advance to next item
    const nextIndex = phaseState === 'idle' ? 0 : currentIndex + 1;

    // Check if there are more questions
    // Handle both single set (from some generators) and array of sets
    const setIndex = room.state.currentPhase2Set ?? 0;
    const phase2Data = room.customQuestions?.phase2;
    let currentSet: SimplePhase2Set | undefined;

    if (Array.isArray(phase2Data)) {
        // Array of sets (expected multiplayer format)
        currentSet = phase2Data[setIndex];
    } else if (phase2Data && typeof phase2Data === 'object') {
        // Single set object (solo format or legacy)
        currentSet = phase2Data as SimplePhase2Set;
    }

    const totalItems = currentSet?.items?.length ?? 0;

    console.log('[nextPhase2Item] Question check', {
        phaseState,
        currentIndex,
        nextIndex,
        setIndex,
        totalItems,
        isArray: Array.isArray(phase2Data),
        hasPhase2Data: !!phase2Data,
        hasCurrentSet: !!currentSet,
        currentSetTitle: currentSet?.title
    });

    // If no more items, transition to phase_results
    if (nextIndex >= totalItems) {
        console.log('[nextPhase2Item] No more items, transitioning to phase_results');
        await update(ref(rtdb), {
            [`rooms/${roomId}/state/phaseState`]: 'phase_results'
        });
        return;
    }

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase2TeamAnswers`] = {};
    updates[`rooms/${roomId}/state/phase2RoundWinner`] = null;
    updates[`rooms/${roomId}/state/phase2BothCorrect`] = false;

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
 * Server-side validation via submitAnswer CF (#72)
 * Scoring handled by nextPhase CF
 */
export const submitPhase2Answer = async (
    roomId: string,
    playerId: string,
    answer: 'A' | 'B' | 'Both'
) => {
    // SECURITY: Fetch room data from server
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) return;

    const room = validateRoom(roomSnapshot.val());
    const player = room.players[playerId];
    if (!player?.team) return; // Player must have a team

    const myTeam = player.team;
    const otherTeam: Team = myTeam === 'spicy' ? 'sweet' : 'spicy';

    // Get current question data for display
    // Handle both single set (from some generators) and array of sets
    const setIndex = room.state.currentPhase2Set ?? 0;
    const itemIndex = room.state.currentPhase2Item ?? 0;
    const phase2Data = room.customQuestions?.phase2;
    let currentSet: SimplePhase2Set | undefined;

    if (Array.isArray(phase2Data)) {
        currentSet = phase2Data[setIndex];
    } else if (phase2Data && typeof phase2Data === 'object') {
        currentSet = phase2Data as SimplePhase2Set;
    }

    if (!currentSet?.items?.[itemIndex]) return;

    const item = currentSet.items[itemIndex];

    // Check if other team has real online players
    const otherTeamHasPlayers = Object.values(room.players).some(
        p => p.team === otherTeam && p.isOnline && !p.id.startsWith('mock_')
    );

    // Record timestamp BEFORE CF call for fair comparison
    const submitTimestamp = Date.now();

    // Call server-side validation
    let isCorrect = false;
    try {
        const response = await submitAnswerCF(roomId, 'phase2', itemIndex, answer, submitTimestamp);
        isCorrect = response.isCorrect;
    } catch (error) {
        console.error('[Phase2] Error calling submitAnswer CF:', error);
        return;
    }

    // Use transaction for atomic state update
    const stateRef = ref(rtdb, `rooms/${roomId}/state`);
    const result = await runTransaction(stateRef, (currentState: GameState | null) => {
        if (!currentState) return currentState;
        if (currentState.phaseState === 'result') return; // Round already ended

        const teamAnswers: Phase2TeamAnswers = currentState.phase2TeamAnswers || {};

        // Check if my team already answered
        if (teamAnswers[myTeam]) {
            return; // Abort - team already answered
        }

        // Record this team's answer
        const myAnswer: Phase2TeamAnswer = {
            playerId,
            playerName: player.name,
            answer,
            correct: isCorrect,
            timestamp: submitTimestamp
        };

        const newTeamAnswers: Phase2TeamAnswers = {
            ...teamAnswers,
            [myTeam]: myAnswer
        };

        const newState: GameState = {
            ...currentState,
            phase2TeamAnswers: newTeamAnswers
        };

        // PARALLEL MODE: Check if both teams have answered
        const otherTeamAnswer = newTeamAnswers[otherTeam];
        const bothTeamsAnswered = otherTeamAnswer !== undefined;

        if (bothTeamsAnswered) {
            // Both teams have answered - determine winner for display
            const myCorrect = isCorrect;
            const otherCorrect = otherTeamAnswer.correct;

            if (myCorrect && !otherCorrect) {
                newState.phase2RoundWinner = myTeam;
                newState.roundWinner = { playerId, name: player.name, team: myTeam };
            } else if (!myCorrect && otherCorrect) {
                newState.phase2RoundWinner = otherTeam;
                newState.roundWinner = {
                    playerId: otherTeamAnswer.playerId,
                    name: otherTeamAnswer.playerName,
                    team: otherTeam
                };
            } else if (myCorrect && otherCorrect) {
                newState.phase2RoundWinner = 'both';
                newState.phase2BothCorrect = true;
                newState.roundWinner = null;
            } else {
                newState.phase2RoundWinner = null;
                newState.roundWinner = null;
            }

            newState.phaseState = 'result';
        } else if (!otherTeamHasPlayers) {
            // Other team has no players - end round now
            if (isCorrect) {
                newState.phase2RoundWinner = myTeam;
                newState.roundWinner = { playerId, name: player.name, team: myTeam };
            } else {
                newState.phase2RoundWinner = null;
                newState.roundWinner = null;
            }
            newState.phaseState = 'result';
        }

        return newState;
    });

    // Transaction aborted or failed
    if (!result.committed) {
        return;
    }

    // Note: Scoring removed - nextPhase CF will calculate scores from revealedAnswers

    // Handle auto-advance if round ended (with lock to prevent multiple timers)
    const newState = result.snapshot.val() as GameState;
    if (newState?.phaseState === 'result') {
        const advanceKey = `${roomId}_${newState.currentPhase2Item ?? 0}`;
        if (!phase2AutoAdvanceScheduled[advanceKey]) {
            phase2AutoAdvanceScheduled[advanceKey] = true;
            const hasAnecdote = item.anecdote;
            const delay = hasAnecdote ? 10000 : 4000;
            setTimeout(() => {
                nextPhase2Item(roomId);
                delete phase2AutoAdvanceScheduled[advanceKey];
            }, delay);
        }
    }
};

/**
 * End Phase 2 round on timeout (20s elapsed).
 * Evaluates answers received and determines winner for display.
 *
 * Note: Scoring handled by nextPhase CF (#72)
 */
export const endPhase2Round = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();

    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    // Already in result state, skip
    if (room.state.phaseState === 'result') return;

    // Handle both single set (from some generators) and array of sets
    const setIndex = room.state.currentPhase2Set ?? 0;
    const itemIndex = room.state.currentPhase2Item ?? 0;
    const phase2Data = room.customQuestions?.phase2;
    let currentSet: SimplePhase2Set | undefined;

    if (Array.isArray(phase2Data)) {
        currentSet = phase2Data[setIndex];
    } else if (phase2Data && typeof phase2Data === 'object') {
        currentSet = phase2Data as SimplePhase2Set;
    }

    const item = currentSet?.items?.[itemIndex];
    const hasAnecdote = item?.anecdote;

    // Get team answers
    const teamAnswers = room.state.phase2TeamAnswers || {};
    const spicyAnswer = teamAnswers.spicy;
    const sweetAnswer = teamAnswers.sweet;

    // Determine winner based on answers received (for display)
    let winner: Team | null = null;
    let winnerPlayerId: string | null = null;
    let winnerPlayerName: string | null = null;

    const spicyCorrect = spicyAnswer?.correct ?? false;
    const sweetCorrect = sweetAnswer?.correct ?? false;

    if (spicyCorrect && !sweetCorrect) {
        winner = 'spicy';
        winnerPlayerId = spicyAnswer!.playerId;
        winnerPlayerName = spicyAnswer!.playerName;
    } else if (!spicyCorrect && sweetCorrect) {
        winner = 'sweet';
        winnerPlayerId = sweetAnswer!.playerId;
        winnerPlayerName = sweetAnswer!.playerName;
    }

    const bothCorrect = spicyCorrect && sweetCorrect;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/phaseState`] = 'result';
    updates[`rooms/${roomId}/state/phase2RoundWinner`] = bothCorrect ? 'both' : winner;
    updates[`rooms/${roomId}/state/phase2BothCorrect`] = bothCorrect;
    updates[`rooms/${roomId}/state/roundWinner`] = winner
        ? { playerId: winnerPlayerId, name: winnerPlayerName, team: winner }
        : null;

    await update(ref(rtdb), updates);

    // Always reveal the correct answer on timeout (whether or not teams answered)
    // This populates revealedAnswers.phase2.{setIndex}_{itemIndex}.answer
    // so the UI can display the correct answer
    try {
        await revealTimeoutCF(roomId, 'phase2', itemIndex, 'multi', setIndex);
    } catch (error) {
        console.error('[Phase2] Error revealing answer on timeout:', error);
    }

    // Note: Scoring removed - nextPhase CF will calculate scores from revealedAnswers

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
