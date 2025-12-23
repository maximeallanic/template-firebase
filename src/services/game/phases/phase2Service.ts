/**
 * Phase 2 (Sucré Salé) - Binary choice service
 * Both teams have 20s to answer. First correct answer wins.
 */

import { ref, get, update, runTransaction, increment } from 'firebase/database';
import { rtdb } from '../../firebase';
import { validateRoom } from '../roomService';
import { PHASE2_SETS } from '../../../data/phase2';
import type {
    Team, GameState, SimplePhase2Set, Phase2TeamAnswer, Phase2TeamAnswers
} from '../../../types/gameTypes';

// Module-level lock for Phase 2 auto-advance to prevent multiple setTimeout calls
// Key format: `${roomId}_${currentPhase2Item}`
const phase2AutoAdvanceScheduled: Record<string, boolean> = {};

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

    // Get current question data
    const setIndex = room.state.currentPhase2Set ?? 0;
    const itemIndex = room.state.currentPhase2Item ?? 0;
    const phase2Sets = room.customQuestions?.phase2 as SimplePhase2Set[] | undefined;
    const currentSet = phase2Sets?.[setIndex] || PHASE2_SETS[setIndex];
    if (!currentSet?.items?.[itemIndex]) return;

    const item = currentSet.items[itemIndex];
    const correctAnswer = item.answer;
    const acceptedAnswers = item.acceptedAnswers || [correctAnswer];
    const isCorrect = answer === correctAnswer || acceptedAnswers.includes(answer);

    // Check if other team has real online players
    const otherTeamHasPlayers = Object.values(room.players).some(
        p => p.team === otherTeam && p.isOnline && !p.id.startsWith('mock_')
    );

    // Record timestamp BEFORE transaction for fair comparison
    // (timestamp reflects when user clicked, not when transaction runs)
    const submitTimestamp = Date.now();

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
            timestamp: submitTimestamp // Use pre-recorded timestamp
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
            // Both teams have answered - determine winner
            const myCorrect = isCorrect;
            const otherCorrect = otherTeamAnswer.correct;

            if (myCorrect && !otherCorrect) {
                // Only my team got it right
                newState.phase2RoundWinner = myTeam;
                newState.roundWinner = { playerId, name: player.name, team: myTeam };
            } else if (!myCorrect && otherCorrect) {
                // Only other team got it right
                newState.phase2RoundWinner = otherTeam;
                newState.roundWinner = {
                    playerId: otherTeamAnswer.playerId,
                    name: otherTeamAnswer.playerName,
                    team: otherTeam
                };
            } else if (myCorrect && otherCorrect) {
                // Both correct - BOTH TEAMS WIN
                newState.phase2RoundWinner = 'both';
                newState.phase2BothCorrect = true;
                newState.roundWinner = null; // No single winner
            } else {
                // Both wrong - no winner
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
        // If only one team has answered and other team has players, wait for them or timeout

        return newState;
    });

    // Transaction aborted or failed
    if (!result.committed) {
        return;
    }

    // Award points (if round ended)
    const newState = result.snapshot.val() as GameState;
    if (newState?.phaseState === 'result') {
        if (newState.phase2BothCorrect) {
            // Both teams correct - award point to BOTH players who answered
            const spicyAnswer = newState.phase2TeamAnswers?.spicy;
            const sweetAnswer = newState.phase2TeamAnswers?.sweet;
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
        } else if (newState.phase2RoundWinner && newState.phase2RoundWinner !== 'both') {
            // Single winner - award point to winning team's player
            const winningTeam = newState.phase2RoundWinner;
            const winningAnswer = newState.phase2TeamAnswers?.[winningTeam];
            if (winningAnswer) {
                await update(ref(rtdb), {
                    [`rooms/${roomId}/players/${winningAnswer.playerId}/score`]: increment(1)
                });
            }
        }
    }

    // Handle auto-advance if round ended (with lock to prevent multiple timers)
    if (newState?.phaseState === 'result') {
        const advanceKey = `${roomId}_${newState.currentPhase2Item ?? 0}`;
        if (!phase2AutoAdvanceScheduled[advanceKey]) {
            phase2AutoAdvanceScheduled[advanceKey] = true;
            const hasAnecdote = item.anecdote;
            const delay = hasAnecdote ? 10000 : 4000;
            setTimeout(() => {
                nextPhase2Item(roomId);
                delete phase2AutoAdvanceScheduled[advanceKey]; // Cleanup after advance
            }, delay);
        }
    }
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
    const currentSet = phase2Sets?.[setIndex] || PHASE2_SETS[setIndex];
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
 */
export const setPhase2GeneratingState = async (code: string, isGenerating: boolean) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/state`), { phase2Generating: isGenerating });
};

/**
 * Get the Phase 2 generation lock state
 */
export const getPhase2GeneratingState = async (code: string): Promise<boolean> => {
    const roomId = code.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/state/phase2Generating`));
    return snapshot.val() === true;
};
