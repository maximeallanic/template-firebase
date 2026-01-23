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
                [`rooms/${roomId}/state/phaseState`]: 'memorizing',  // Global phaseState - needed for PhaseRouter
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
            [`rooms/${roomId}/state/phaseState`]: 'selecting',  // Global phaseState - needed for PhaseRouter
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
        [`rooms/${roomId}/state/phaseState`]: newState,  // Global phaseState - needed for PhaseRouter
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
            [`rooms/${roomId}/state/phaseState`]: 'memorizing',  // Global phaseState for consistency
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
            phaseState: 'answering',  // Global phaseState for consistency
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
    console.log('[Phase5] submitPhase5Answer called:', { roomId, playerId, team, answer: answer.substring(0, 20) });

    // Verify player is the representative for this team
    const repSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5Representatives/${team}`));
    if (repSnap.val() !== playerId) {
        console.warn('[Phase5] Non-representative trying to submit answer');
        return null;
    }

    // Get current answer index for this team
    const answersSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5Answers/${team}`));
    const currentAnswers = answersSnap.val() || [];
    const questionIndex = currentAnswers.length;
    console.log('[Phase5] Current answer index:', questionIndex, 'for team:', team);

    if (questionIndex >= 10) {
        console.warn('[Phase5] Already submitted all 10 answers');
        return null;
    }

    // Call server-side validation via submitAnswer CF
    let isCorrect = false;
    try {
        console.log('[Phase5] Calling submitAnswer CF...');
        const response = await submitAnswerCF(roomId, 'phase5', questionIndex, answer, Date.now());
        isCorrect = response.isCorrect;
        console.log('[Phase5] submitAnswer CF response:', { isCorrect });
    } catch (error) {
        console.error('[Phase5] Error calling submitAnswer CF:', error);
        // Continue anyway to store the answer
    }

    // Use transaction to append answer atomically (with validation result)
    const answersRef = ref(rtdb, `rooms/${roomId}/state/phase5Answers/${team}`);
    const indexRef = ref(rtdb, `rooms/${roomId}/state/phase5CurrentAnswerIndex/${team}`);

    console.log('[Phase5] Running transaction to store answer...');
    const result = await runTransaction(answersRef, (currentAnswersInTx) => {
        const answers = currentAnswersInTx || [];
        console.log('[Phase5] Transaction: current length:', answers.length);
        if (answers.length >= 10) {
            console.log('[Phase5] Transaction: already complete, aborting');
            return; // Already complete
        }
        return [...answers, { answer, isCorrect }];
    });

    console.log('[Phase5] Transaction result:', { committed: result.committed });

    if (result.committed) {
        // Update index for UI
        const newLength = (result.snapshot.val() || []).length;
        console.log('[Phase5] New answer count for', team, ':', newLength);
        await set(indexRef, newLength);

        // Check if both teams have submitted all 10
        console.log('[Phase5] Checking completion...');
        await checkPhase5AnswerCompletion(roomCode);
    }

    return { isCorrect };
};

/**
 * Revealed answer structure from submitAnswer CF
 */
interface Phase5RevealedAnswer {
    expectedAnswer: string;
    team: Team;
    givenAnswer: string;
    isCorrect: boolean;
    explanation?: string;
}

/**
 * Build team results from revealed answers
 */
function buildTeamResult(
    revealedAnswers: Record<string, Phase5RevealedAnswer>,
    team: Team
): { answers: Array<{ expected: string; given: string; isCorrect: boolean }>; first5Correct: boolean; all10Correct: boolean; points: number } {
    // Extract answers for this team, sorted by question index
    const teamAnswers: Array<{ expected: string; given: string; isCorrect: boolean }> = [];

    for (let i = 0; i < 10; i++) {
        const key = `${i}_${team}`;
        const revealed = revealedAnswers[key];
        if (revealed) {
            teamAnswers.push({
                expected: revealed.expectedAnswer || '',
                given: revealed.givenAnswer || '',
                isCorrect: revealed.isCorrect,
            });
        } else {
            // Fallback if revealed answer not found
            teamAnswers.push({
                expected: '',
                given: '',
                isCorrect: false,
            });
        }
    }

    const correctCount = teamAnswers.filter(a => a.isCorrect).length;
    const first5Correct = teamAnswers.slice(0, 5).every(a => a.isCorrect);
    const all10Correct = correctCount === 10;

    // Bonus exclusif: 5pts if first 5 correct, OR 10pts if all 10 correct (not cumulative)
    let points = 0;
    if (all10Correct) {
        points = 10;
    } else if (first5Correct) {
        points = 5;
    }

    return { answers: teamAnswers, first5Correct, all10Correct, points };
}

/**
 * Check if both teams finished answering
 */
export const checkPhase5AnswerCompletion = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    console.log('[Phase5] checkPhase5AnswerCompletion called for room:', roomId);

    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) {
        console.log('[Phase5] No room found:', roomId);
        return;
    }

    const room = roomSnapshot.val();
    const state = room.state || {};
    const answers = state.phase5Answers || {};

    const spicyCount = answers.spicy?.length || 0;
    const sweetCount = answers.sweet?.length || 0;
    const spicyDone = spicyCount >= 10;
    const sweetDone = sweetCount >= 10;

    console.log('[Phase5] Answer completion check:', {
        spicyCount,
        sweetCount,
        spicyDone,
        sweetDone,
        currentPhase5State: state.phase5State,
        currentPhaseState: state.phaseState,
    });

    if (spicyDone && sweetDone) {
        console.log('[Phase5] Both teams done! Building results...');

        // Get revealed answers (contains expectedAnswer from server-side validation)
        const revealedAnswers = room.revealedAnswers?.phase5 || {};
        console.log('[Phase5] Revealed answers keys:', Object.keys(revealedAnswers));

        // Build results for both teams from revealed answers
        const spicyResult = buildTeamResult(revealedAnswers, 'spicy');
        const sweetResult = buildTeamResult(revealedAnswers, 'sweet');

        console.log('[Phase5] Built results:', {
            spicy: { points: spicyResult.points, first5: spicyResult.first5Correct, all10: spicyResult.all10Correct },
            sweet: { points: sweetResult.points, first5: sweetResult.first5Correct, all10: sweetResult.all10Correct },
        });

        // Update state with results
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phaseState: 'result',  // Global phaseState - needed for PhaseRouter
            phase5State: 'result',
            phase5Results: {
                spicy: spicyResult,
                sweet: sweetResult,
            },
        });
        console.log('[Phase5] State updated to result with phase5Results');
    } else {
        console.log('[Phase5] Not all teams done yet, waiting...');
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
        [`rooms/${roomId}/state/phaseState`]: 'result',  // Global phaseState for consistency
        [`rooms/${roomId}/state/phase5State`]: 'result',
        [`rooms/${roomId}/state/phase5Results`]: results
    };

    // Note: Scoring removed - nextPhase CF will calculate scores

    await update(ref(rtdb), updates);
};
