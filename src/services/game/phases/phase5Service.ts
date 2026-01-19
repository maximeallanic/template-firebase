/**
 * Phase 5 (Burger Ultime) - Memory duel service
 * Teams select representatives who memorize and recall answers
 */

import { ref, set, get, update, runTransaction } from 'firebase/database';
import { rtdb } from '../../firebase';
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
 * Answers are stored in order as they are submitted
 */
export const submitPhase5Answer = async (
    roomCode: string,
    playerId: string,
    answer: string,
    team: Team
) => {
    const roomId = roomCode.toUpperCase();

    // Verify player is the representative for this team
    const repSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5Representatives/${team}`));
    if (repSnap.val() !== playerId) {
        console.warn('Non-representative trying to submit answer');
        return;
    }

    // Use transaction to append answer atomically
    const answersRef = ref(rtdb, `rooms/${roomId}/state/phase5Answers/${team}`);
    const indexRef = ref(rtdb, `rooms/${roomId}/state/phase5CurrentAnswerIndex/${team}`);

    const result = await runTransaction(answersRef, (currentAnswers) => {
        const answers = currentAnswers || [];
        if (answers.length >= 10) return; // Already complete
        return [...answers, answer];
    });

    if (result.committed) {
        // Update index for UI
        const newLength = (result.snapshot.val() || []).length;
        await set(indexRef, newLength);

        // Check if both teams have submitted all 10
        await checkPhase5AnswerCompletion(roomCode);
    }
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
        // Move to validating state - Cloud Function will be called by client
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phase5State: 'validating'
        });
    }
};

// === PHASE 5 RESULTS ===

/**
 * Store validation results and calculate points
 * Called after Cloud Function returns
 */
export const setPhase5Results = async (
    roomCode: string,
    results: Phase5Results
) => {
    const roomId = roomCode.toUpperCase();

    // Get current room data to identify representatives
    const snapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    // Award points ONLY to the team representatives (prevent score duplication)
    const spicyRepId = room.state.phase5Representatives?.spicy;
    const sweetRepId = room.state.phase5Representatives?.sweet;

    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/phase5State`]: 'result',
        [`rooms/${roomId}/state/phase5Results`]: results
    };

    // Add score to Spicy representative using transaction to prevent duplicates
    if (spicyRepId && results.spicy.points > 0) {
        const spicyRepRef = ref(rtdb, `rooms/${roomId}/players/${spicyRepId}`);
        await runTransaction(spicyRepRef, (currentData) => {
            if (currentData && !currentData.phase5Scored) {
                return {
                    ...currentData,
                    score: (currentData.score || 0) + results.spicy.points,
                    phase5Scored: true
                };
            }
            return currentData;
        });
    }

    // Add score to Sweet representative using transaction to prevent duplicates
    if (sweetRepId && results.sweet.points > 0) {
        const sweetRepRef = ref(rtdb, `rooms/${roomId}/players/${sweetRepId}`);
        await runTransaction(sweetRepRef, (currentData) => {
            if (currentData && !currentData.phase5Scored) {
                return {
                    ...currentData,
                    score: (currentData.score || 0) + results.sweet.points,
                    phase5Scored: true
                };
            }
            return currentData;
        });
    }

    // Update game state
    await update(ref(rtdb), updates);
};
