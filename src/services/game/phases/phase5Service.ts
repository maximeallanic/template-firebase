/**
 * Phase 5 (Burger Ultime) - Memory duel service
 * Teams select representatives who memorize and recall answers
 *
 * Server-Side Validation:
 * Answer validation is now handled by Cloud Function submitAnswer.
 * Each answer is validated immediately via LLM when submitted.
 */

import { ref, set, get, update, runTransaction } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF } from '../../firebase';
import type { SubmitAnswerResponse } from '../../firebase';
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
 * Result of a Phase 5 answer submission
 */
export interface Phase5AnswerResult {
    success: boolean;
    correct: boolean;
    llmFeedback?: string;
    confidence?: number;
    teamFinished: boolean;
    error?: string;
}

/**
 * Submit an answer (called by representative)
 * Uses Cloud Function for server-side LLM validation.
 *
 * SERVER-SIDE VALIDATION: Each answer is validated immediately by the CF.
 * The CF stores validation results in gameData and updates scores.
 *
 * @returns Validation result with immediate feedback
 */
export const submitPhase5Answer = async (
    roomCode: string,
    playerId: string,
    answer: string,
    team: Team
): Promise<Phase5AnswerResult> => {
    const roomId = roomCode.toUpperCase();

    // Verify player is the representative for this team
    const repSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5Representatives/${team}`));
    if (repSnap.val() !== playerId) {
        console.warn('Non-representative trying to submit answer');
        return { success: false, correct: false, teamFinished: false, error: 'NOT_REPRESENTATIVE' };
    }

    // Get current answer index for this team
    const indexSnap = await get(ref(rtdb, `rooms/${roomId}/state/phase5CurrentAnswerIndex/${team}`));
    const questionIndex = indexSnap.val() || 0;

    // Check if already completed
    if (questionIndex >= 10) {
        return { success: false, correct: false, teamFinished: true, error: 'ALREADY_COMPLETE' };
    }

    try {
        // Call Cloud Function for server-side LLM validation
        const result: SubmitAnswerResponse = await submitAnswerCF({
            roomId,
            phase: 'phase5',
            questionIndex,
            answer,
            clientTimestamp: Date.now(),
        });

        if (result.success) {
            // Store answer locally for UI display
            const answersRef = ref(rtdb, `rooms/${roomId}/state/phase5Answers/${team}`);
            await runTransaction(answersRef, (currentAnswers) => {
                const answers = currentAnswers || [];
                if (answers.length >= 10) return answers;
                return [...answers, {
                    text: answer,
                    correct: result.correct,
                    feedback: result.llmFeedback,
                }];
            });

            // Update index for UI
            const newIndex = questionIndex + 1;
            await set(ref(rtdb, `rooms/${roomId}/state/phase5CurrentAnswerIndex/${team}`), newIndex);

            // Check if both teams have finished
            const teamFinished = result.teamFinished || newIndex >= 10;
            if (teamFinished) {
                await checkPhase5AnswerCompletion(roomCode);
            }

            return {
                success: true,
                correct: result.correct,
                llmFeedback: result.llmFeedback,
                confidence: result.confidence,
                teamFinished,
            };
        } else {
            console.error('[Phase 5] CF validation failed:', result.message);
            return {
                success: false,
                correct: false,
                teamFinished: false,
                error: result.error || 'VALIDATION_FAILED',
            };
        }
    } catch (error) {
        console.error('[Phase 5] CF call failed:', error);
        return {
            success: false,
            correct: false,
            teamFinished: false,
            error: 'CF_ERROR',
        };
    }
};

/**
 * Check if both teams finished answering.
 * With server-side validation, we skip the "validating" state and go directly to "result".
 * Also awards points to representatives based on "in order" scoring.
 */
export const checkPhase5AnswerCompletion = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;

    const room = validateRoom(roomSnapshot.val());
    const state = room.state;

    const spicyIndex = state.phase5CurrentAnswerIndex?.spicy || 0;
    const sweetIndex = state.phase5CurrentAnswerIndex?.sweet || 0;

    const spicyDone = spicyIndex >= 10;
    const sweetDone = sweetIndex >= 10;

    if (spicyDone && sweetDone) {
        // Both teams finished - calculate final results from stored answers
        // Note: answers now contain { text, correct, feedback } objects, not plain strings
        interface Phase5AnswerItem { text: string; correct: boolean; feedback?: string }
        const answers = (state.phase5Answers || {}) as { spicy?: Phase5AnswerItem[]; sweet?: Phase5AnswerItem[] };
        const spicyAnswers: Phase5AnswerItem[] = answers.spicy || [];
        const sweetAnswers: Phase5AnswerItem[] = answers.sweet || [];

        // Calculate team results based on correct answers (already validated by CF)
        const calculateTeamResult = (teamAnswers: Array<{ correct: boolean }>) => {
            // First 5 must be correct in order
            const first5Correct = teamAnswers.slice(0, 5).every(a => a.correct);
            // All 10 must be correct in order
            const all10Correct = teamAnswers.every(a => a.correct);

            let points = 0;
            if (all10Correct) {
                points = 10;
            } else if (first5Correct) {
                points = 5;
            }

            return { first5Correct, all10Correct, points };
        };

        const spicyResult = calculateTeamResult(spicyAnswers);
        const sweetResult = calculateTeamResult(sweetAnswers);

        // Award points to representatives using transactions (prevent duplicates)
        const spicyRepId = state.phase5Representatives?.spicy;
        const sweetRepId = state.phase5Representatives?.sweet;

        if (spicyRepId && spicyResult.points > 0) {
            const spicyRepRef = ref(rtdb, `rooms/${roomId}/players/${spicyRepId}`);
            await runTransaction(spicyRepRef, (currentData) => {
                if (currentData && !currentData.phase5Scored) {
                    return {
                        ...currentData,
                        score: (currentData.score || 0) + spicyResult.points,
                        phase5Scored: true,
                    };
                }
                return currentData;
            });
        }

        if (sweetRepId && sweetResult.points > 0) {
            const sweetRepRef = ref(rtdb, `rooms/${roomId}/players/${sweetRepId}`);
            await runTransaction(sweetRepRef, (currentData) => {
                if (currentData && !currentData.phase5Scored) {
                    return {
                        ...currentData,
                        score: (currentData.score || 0) + sweetResult.points,
                        phase5Scored: true,
                    };
                }
                return currentData;
            });
        }

        // Store results and move to result state
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            phase5State: 'result',
            phase5Results: {
                spicy: {
                    answers: spicyAnswers,
                    first5Correct: spicyResult.first5Correct,
                    all10Correct: spicyResult.all10Correct,
                    points: spicyResult.points,
                },
                sweet: {
                    answers: sweetAnswers,
                    first5Correct: sweetResult.first5Correct,
                    all10Correct: sweetResult.all10Correct,
                    points: sweetResult.points,
                },
            },
        });
    }
};

// === PHASE 5 RESULTS ===

/**
 * Store validation results and calculate points.
 *
 * @deprecated This function is no longer used with server-side validation.
 * Results are now automatically calculated and stored by checkPhase5AnswerCompletion()
 * when both teams finish answering. Kept for backward compatibility only.
 */
export const setPhase5Results = async (
    roomCode: string,
    results: Phase5Results
) => {
    const roomId = roomCode.toUpperCase();
    console.warn('[Phase 5] setPhase5Results is deprecated. Results are now calculated automatically.');

    // Just update the state - scoring is handled by checkPhase5AnswerCompletion
    await update(ref(rtdb, `rooms/${roomId}/state`), {
        phase5State: 'result',
        phase5Results: results,
    });
};
