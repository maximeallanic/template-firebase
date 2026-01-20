/**
 * Phase 5 (Burger Ultime) - Memory duel service
 * Teams select representatives who memorize and recall answers
 *
 * Server-side validation via submitAnswer CF (#72)
 * Scoring handled by nextPhase CF
 */

import { ref, set, get, update, runTransaction } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF } from '../../firebase';
import { validateRoom } from '../roomService';
import type { Team, Phase5State, Phase5Results } from '../../../types/gameTypes';

/**
 * Initialize Phase 5 with idle state
 */
export const startPhase5 = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/status`] = 'phase5';
    updates[`rooms/${roomId}/state/phase5State`] = 'idle';
    updates[`rooms/${roomId}/state/phase5QuestionIndex`] = 0;
    updates[`rooms/${roomId}/state/phase5TimerStart`] = null;
    updates[`rooms/${roomId}/state/phase5Votes`] = null;
    updates[`rooms/${roomId}/state/phase5Representatives`] = null;
    updates[`rooms/${roomId}/state/phase5Answers`] = null;
    updates[`rooms/${roomId}/state/phase5CurrentAnswerIndex`] = null;
    updates[`rooms/${roomId}/state/phase5Results`] = null;

    await update(ref(rtdb), updates);
};

/**
 * Transition Phase 5 to a new state
 * Handles auto-skip of voting for solo teams
 */
export const setPhase5State = async (roomCode: string, newState: Phase5State) => {
    const roomId = roomCode.toUpperCase();

    // Special handling for 'selecting' state - check for solo teams
    if (newState === 'selecting') {
        const snapshot = await get(ref(rtdb, `rooms/${roomId}`));
        if (!snapshot.exists()) return;
        const room = validateRoom(snapshot.val());

        // Count real online players per team (exclude mock players)
        const spicyPlayers = Object.values(room.players)
            .filter(p => p.team === 'spicy' && p.isOnline && !p.id.startsWith('mock_'));
        const sweetPlayers = Object.values(room.players)
            .filter(p => p.team === 'sweet' && p.isOnline && !p.id.startsWith('mock_'));

        // Determine auto-representatives for solo teams
        const autoSpicyRep = spicyPlayers.length === 1 ? spicyPlayers[0].id : null;
        const autoSweetRep = sweetPlayers.length === 1 ? sweetPlayers[0].id : null;

        // If BOTH teams are solo → skip voting entirely, go to 'memorizing'
        if (autoSpicyRep && autoSweetRep) {
            await update(ref(rtdb), {
                [`rooms/${roomId}/state/phase5State`]: 'memorizing',
                [`rooms/${roomId}/state/phase5Votes`]: { spicy: {}, sweet: {} },
                [`rooms/${roomId}/state/phase5Representatives`]: {
                    spicy: autoSpicyRep,
                    sweet: autoSweetRep
                },
                [`rooms/${roomId}/state/phase5QuestionIndex`]: 0,
                [`rooms/${roomId}/state/phase5TimerStart`]: Date.now()
            });
            return;
        }

        // Initialize voting with auto-votes for solo teams
        await update(ref(rtdb), {
            [`rooms/${roomId}/state/phase5State`]: 'selecting',
            [`rooms/${roomId}/state/phase5Votes`]: {
                spicy: autoSpicyRep ? { [autoSpicyRep]: autoSpicyRep } : {},
                sweet: autoSweetRep ? { [autoSweetRep]: autoSweetRep } : {}
            },
            [`rooms/${roomId}/state/phase5Representatives`]: {
                spicy: autoSpicyRep,
                sweet: autoSweetRep
            }
        });

        // If one team is already complete, check if voting is done
        if (autoSpicyRep || autoSweetRep) {
            await checkPhase5VoteCompletion(roomCode);
        }
        return;
    }

    // Standard state transitions
    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/phase5State`]: newState
    };

    if (newState === 'memorizing') {
        updates[`rooms/${roomId}/state/phase5QuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/phase5TimerStart`] = Date.now();
    } else if (newState === 'answering') {
        updates[`rooms/${roomId}/state/phase5Answers`] = { spicy: [], sweet: [] };
        updates[`rooms/${roomId}/state/phase5CurrentAnswerIndex`] = { spicy: 0, sweet: 0 };
    }

    await update(ref(rtdb), updates);
};

// === PHASE 5 VOTING ===

/**
 * Submit a vote for representative selection
 * Only team members can vote for their own team
 */
export const submitPhase5Vote = async (
    roomCode: string,
    voterId: string,
    votedPlayerId: string,
    team: Team
) => {
    const roomId = roomCode.toUpperCase();
    const voteRef = ref(rtdb, `rooms/${roomId}/state/phase5Votes/${team}/${voterId}`);
    await set(voteRef, votedPlayerId);

    // Check if all team members have voted
    await checkPhase5VoteCompletion(roomCode);
};

/**
 * Tally votes and return the winner (most votes)
 */
function tallyVotes(votes: Record<string, string>): string | null {
    const counts: Record<string, number> = {};
    for (const votedId of Object.values(votes)) {
        counts[votedId] = (counts[votedId] || 0) + 1;
    }

    let maxVotes = 0;
    let winner: string | null = null;
    for (const [playerId, count] of Object.entries(counts)) {
        if (count > maxVotes) {
            maxVotes = count;
            winner = playerId;
        }
    }
    return winner;
}

/**
 * Check if all votes are in and determine representatives
 */
export const checkPhase5VoteCompletion = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!snapshot.exists()) return;

    const room = validateRoom(snapshot.val());
    const votes = room.state.phase5Votes;
    if (!votes) return;

    // Count online players per team (exclude mock players)
    const spicyPlayers = Object.values(room.players)
        .filter(p => p.team === 'spicy' && p.isOnline && !p.id.startsWith('mock_'));
    const sweetPlayers = Object.values(room.players)
        .filter(p => p.team === 'sweet' && p.isOnline && !p.id.startsWith('mock_'));

    const spicyVoteCount = Object.keys(votes.spicy || {}).length;
    const sweetVoteCount = Object.keys(votes.sweet || {}).length;

    // All votes in?
    if (spicyVoteCount >= spicyPlayers.length && sweetVoteCount >= sweetPlayers.length) {
        // Tally votes and determine winners
        const spicyWinner = tallyVotes(votes.spicy || {});
        const sweetWinner = tallyVotes(votes.sweet || {});

        // Update representatives and move to memorizing
        await update(ref(rtdb), {
            [`rooms/${roomId}/state/phase5Representatives`]: { spicy: spicyWinner, sweet: sweetWinner },
            [`rooms/${roomId}/state/phase5State`]: 'memorizing',
            [`rooms/${roomId}/state/phase5QuestionIndex`]: 0,
            [`rooms/${roomId}/state/phase5TimerStart`]: Date.now()
        });
    }
};

// === PHASE 5 MEMORIZATION ===

/**
 * Auto-advance to next question during memorization (10s timer)
 */
export const nextPhase5MemoryQuestion = async (roomCode: string, totalQuestions: number) => {
    const roomId = roomCode.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (!snapshot.exists()) return;

    const state = snapshot.val();
    const currentIdx = state.phase5QuestionIndex || 0;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= totalQuestions) {
        // All questions shown - move to answering phase
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phase5State: 'answering',
            phase5Answers: { spicy: [], sweet: [] },
            phase5CurrentAnswerIndex: { spicy: 0, sweet: 0 }
        });
    } else {
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phase5QuestionIndex: nextIdx,
            phase5TimerStart: Date.now()
        });
    }
};

// === PHASE 5 ANSWERING ===

/**
 * Submit an answer (called by representative)
 * Validates via submitAnswer CF and stores result
 *
 * Scoring handled by nextPhase CF
 */
export const submitPhase5Answer = async (
    roomCode: string,
    playerId: string,
    answer: string,
    team: Team
): Promise<{ isCorrect: boolean } | null> => {
    const roomId = roomCode.toUpperCase();

    // Verify player is the representative for this team
    const repSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5Representatives/${team}`));
    if (repSnap.val() !== playerId) {
        console.warn('Non-representative trying to submit answer');
        return null;
    }

    // Get current answer index for this team
    const answersSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5Answers/${team}`));
    const currentAnswers = answersSnap.val() || [];
    const questionIndex = currentAnswers.length;

    if (questionIndex >= 10) {
        console.warn('Already submitted all 10 answers');
        return null;
    }

    // Call server-side validation via submitAnswer CF
    let isCorrect = false;
    try {
        const response = await submitAnswerCF(roomId, 'phase5', questionIndex, answer, Date.now());
        isCorrect = response.isCorrect;
    } catch (error) {
        console.error('[Phase5] Error calling submitAnswer CF:', error);
        // Continue anyway to store the answer
    }

    // Use transaction to append answer atomically (with validation result)
    const answersRef = ref(rtdb, `rooms/${roomId}/state/phase5Answers/${team}`);
    const indexRef = ref(rtdb, `rooms/${roomId}/state/phase5CurrentAnswerIndex/${team}`);

    const result = await runTransaction(answersRef, (currentAnswersInTx) => {
        const answers = currentAnswersInTx || [];
        if (answers.length >= 10) return; // Already complete
        return [...answers, { answer, isCorrect }];
    });

    if (result.committed) {
        // Update index for UI
        const newLength = (result.snapshot.val() || []).length;
        await set(indexRef, newLength);

        // Check if both teams have submitted all 10
        await checkPhase5AnswerCompletion(roomCode);
    }

    return { isCorrect };
};

/**
 * Check if both teams finished answering
 */
export const checkPhase5AnswerCompletion = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (!snapshot.exists()) return;

    const state = snapshot.val();
    const answers = state.phase5Answers || {};

    const spicyDone = (answers.spicy?.length || 0) >= 10;
    const sweetDone = (answers.sweet?.length || 0) >= 10;

    if (spicyDone && sweetDone) {
        // Server-side validation already done per-answer via submitAnswer CF (#72)
        // Go directly to result state - no need for separate validation phase
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phase5State: 'result'
        });
    }
};

// === PHASE 5 RESULTS ===

/**
 * Store validation results for display
 * Called after all answers submitted and validated
 *
 * Note: Scoring removed - nextPhase CF will calculate scores from revealedAnswers (#72)
 */
export const setPhase5Results = async (
    roomCode: string,
    results: Phase5Results
) => {
    const roomId = roomCode.toUpperCase();

    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/phase5State`]: 'result',
        [`rooms/${roomId}/state/phase5Results`]: results
    };

    // Note: Scoring removed - nextPhase CF will calculate scores

    await update(ref(rtdb), updates);
};
