/**
 * Phase 3 (La Carte) - Parallel play with theme selection and LLM validation
 * Teams choose themes and answer questions in parallel
 *
 * Server-side validation via submitAnswer CF (#72)
 * Scoring handled by nextPhase CF
 */

import { ref, get, update, runTransaction } from 'firebase/database';
import { rtdb, submitAnswer as submitAnswerCF } from '../../firebase';
import { validateRoom } from '../roomService';
import type {
    Team, Player, GameState, Phase3Theme, Phase3TeamProgress
} from '../../../types/gameTypes';

// Import default Phase 3 themes
import { PHASE3_DATA } from '../../data/phase3';

/**
 * Calculate the selection order based on team scores.
 * Team with lower score chooses first.
 * @param players - Record of players in the room
 * @returns Array of teams in selection order
 */
export function getPhase3SelectionOrder(players: Record<string, Player>): Team[] {
    let spicyScore = 0;
    let sweetScore = 0;

    Object.values(players).forEach(player => {
        if (player.team === 'spicy') {
            spicyScore += player.score || 0;
        } else if (player.team === 'sweet') {
            sweetScore += player.score || 0;
        }
    });

    // Team with lower score chooses first
    // In case of tie, spicy goes first (arbitrary)
    if (sweetScore < spicyScore) {
        return ['sweet', 'spicy'];
    }
    return ['spicy', 'sweet'];
}

/**
 * Initialize Phase 3 v2 state.
 * Sets selection order based on current scores.
 * @param code - Room code
 */
export const initPhase3 = async (code: string): Promise<void> => {
    const roomId = code.toUpperCase();
    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;

    const room = validateRoom(roomSnapshot.val());

    // Calculate selection order based on scores
    const selectionOrder = getPhase3SelectionOrder(room.players);

    // Get themes (filter out trap for display, but keep it in data)
    const themes = room.customQuestions?.phase3 || PHASE3_DATA;

    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/phase3State`]: 'selecting',
        [`rooms/${roomId}/state/phase3SelectionOrder`]: selectionOrder,
        [`rooms/${roomId}/state/phase3ThemeSelection`]: {},
        [`rooms/${roomId}/state/phase3TeamProgress`]: {},
        [`rooms/${roomId}/state/phaseState`]: 'menu_selection',
    };

    // Store visible themes count for UI (excludes trap)
    const visibleThemes = themes.filter((t: Phase3Theme) => !t.isTrap);
    updates[`rooms/${roomId}/state/phase3VisibleThemeCount`] = visibleThemes.length;

    await update(ref(rtdb), updates);
};

/**
 * Select a theme for a team.
 * Only allows selection if it's the team's turn and theme is available.
 * @param code - Room code
 * @param team - Team selecting
 * @param themeIndex - Index of theme to select
 */
export const selectPhase3Theme = async (
    code: string,
    team: Team,
    themeIndex: number
): Promise<{ success: boolean; error?: string }> => {
    const roomId = code.toUpperCase();

    const result = await runTransaction(ref(rtdb, `rooms/${roomId}/state`), (currentState: GameState | null) => {
        if (!currentState) return currentState;

        // Validate state
        if (currentState.phase3State !== 'selecting') {
            return; // Abort
        }

        const selectionOrder = currentState.phase3SelectionOrder || ['spicy', 'sweet'];
        const currentSelections: Partial<Record<Team, number>> = currentState.phase3ThemeSelection || {};

        // Check if it's this team's turn
        const selectingTeamsCount = Object.keys(currentSelections).length;
        const expectedTeam = selectionOrder[selectingTeamsCount];

        if (team !== expectedTeam) {
            return; // Not this team's turn
        }

        // Check if theme is already taken
        const takenThemes = Object.values(currentSelections);
        if (takenThemes.includes(themeIndex)) {
            return; // Theme already taken
        }

        // Update selection
        const newSelections: Partial<Record<Team, number>> = { ...currentSelections, [team]: themeIndex };
        const newState = { ...currentState, phase3ThemeSelection: newSelections as Record<Team, number> };

        // If both teams have selected, transition to playing
        if (Object.keys(newSelections).length >= 2) {
            // Initialize team progress for both teams - at this point both keys exist
            const teamProgress: Record<Team, Phase3TeamProgress> = {
                spicy: {
                    themeIndex: newSelections.spicy as number,
                    currentQuestionIndex: 0,
                    score: 0,
                    finished: false,
                    questionAnsweredBy: {},
                },
                sweet: {
                    themeIndex: newSelections.sweet as number,
                    currentQuestionIndex: 0,
                    score: 0,
                    finished: false,
                    questionAnsweredBy: {},
                },
            };

            newState.phase3State = 'playing';
            newState.phase3TeamProgress = teamProgress;
            newState.phaseState = 'answering';
        }

        return newState;
    });

    if (!result.committed) {
        return { success: false, error: 'Transaction failed or conditions not met' };
    }

    return { success: true };
};

/**
 * Submit a Phase 3 answer.
 * Uses server-side LLM validation via submitAnswer CF (#72).
 * First player from team to answer correctly wins the point.
 *
 * Scoring handled by nextPhase CF
 *
 * @param code - Room code
 * @param playerId - Player submitting answer
 * @param answer - Player's answer text
 */
export const submitPhase3Answer = async (
    code: string,
    playerId: string,
    answer: string
): Promise<{ success: boolean; isCorrect: boolean; alreadyAnswered?: boolean; error?: string }> => {
    const roomId = code.toUpperCase();

    // Get room data
    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) {
        return { success: false, isCorrect: false, error: 'Room not found' };
    }

    const room = validateRoom(roomSnapshot.val());

    // Validate state
    if (room.state.phase3State !== 'playing') {
        return { success: false, isCorrect: false, error: 'Not in playing state' };
    }

    const player = room.players[playerId];
    if (!player || !player.team) {
        return { success: false, isCorrect: false, error: 'Player not found or no team' };
    }

    const team = player.team;
    const teamProgress = room.state.phase3TeamProgress?.[team];
    if (!teamProgress) {
        return { success: false, isCorrect: false, error: 'Team progress not found' };
    }

    // Check if team already finished
    if (teamProgress.finished) {
        return { success: false, isCorrect: false, error: 'Team already finished' };
    }

    const questionIndex = teamProgress.currentQuestionIndex;

    // Check if this question was already answered by someone on the team
    if (teamProgress.questionAnsweredBy?.[questionIndex]) {
        return { success: false, isCorrect: false, alreadyAnswered: true, error: 'Question already answered' };
    }

    // Call server-side LLM validation via submitAnswer CF
    // questionIndex for P3 encodes: themeIndex * 100 + questionIndexInTheme
    const encodedQuestionIndex = teamProgress.themeIndex * 100 + questionIndex;

    let isCorrect = false;
    try {
        const response = await submitAnswerCF(roomId, 'phase3', encodedQuestionIndex, answer, Date.now());
        isCorrect = response.isCorrect;
    } catch (error) {
        console.error('[Phase3] Error calling submitAnswer CF:', error);
        return { success: false, isCorrect: false, error: 'Server validation failed' };
    }

    if (!isCorrect) {
        // Wrong answer - don't update state, just return
        return { success: true, isCorrect: false };
    }

    // Correct answer - use transaction to update state atomically
    const stateRef = ref(rtdb, `rooms/${roomId}/state`);
    const txResult = await runTransaction(stateRef, (currentState: GameState | null) => {
        if (!currentState) return currentState;

        const progress = currentState.phase3TeamProgress?.[team];
        if (!progress) return currentState;

        // Double-check the question hasn't been answered yet (race condition)
        if (progress.questionAnsweredBy?.[questionIndex]) {
            return; // Abort - already answered
        }

        // Check if the question has already advanced (due to skip/timeout)
        if (progress.currentQuestionIndex !== questionIndex) {
            return; // Abort - question already skipped
        }

        // Update progress
        const newProgress: Phase3TeamProgress = {
            ...progress,
            questionAnsweredBy: {
                ...progress.questionAnsweredBy,
                [questionIndex]: playerId,
            },
            score: progress.score + 1,
            currentQuestionIndex: questionIndex + 1,
        };

        // Check if team finished (5 questions answered)
        if (newProgress.currentQuestionIndex >= 5) {
            newProgress.finished = true;
            newProgress.finishedAt = Date.now();
        }

        const newTeamProgress = {
            ...currentState.phase3TeamProgress,
            [team]: newProgress,
        };

        // Check if both teams finished
        const otherTeam = team === 'spicy' ? 'sweet' : 'spicy';
        const otherProgress = newTeamProgress[otherTeam];
        const bothFinished = newProgress.finished && otherProgress?.finished;

        return {
            ...currentState,
            phase3TeamProgress: newTeamProgress,
            phase3State: bothFinished ? 'finished' : currentState.phase3State,
        };
    });

    if (!txResult.committed) {
        return { success: false, isCorrect: true, alreadyAnswered: true, error: 'Question already answered by teammate' };
    }

    // Note: Scoring removed - nextPhase CF will calculate scores from revealedAnswers

    return { success: true, isCorrect: true };
};

/**
 * Skip to the next Phase 3 question without awarding points.
 * Called when time runs out or after an incorrect answer.
 * @param code - Room code
 * @param team - Team to advance
 */
export const skipPhase3Question = async (
    code: string,
    team: Team
): Promise<{ success: boolean; error?: string }> => {
    const roomId = code.toUpperCase();
    console.log('[Phase3] skipPhase3Question called:', { roomId, team });

    const stateRef = ref(rtdb, `rooms/${roomId}/state`);
    const result = await runTransaction(stateRef, (currentState: GameState | null) => {
        console.log('[Phase3] Transaction state:', {
            hasState: !!currentState,
            phase3State: currentState?.phase3State,
            teamProgress: currentState?.phase3TeamProgress?.[team]
        });

        if (!currentState) {
            console.log('[Phase3] No state, aborting');
            return currentState;
        }

        // Allow skip if in playing state OR if phase3State is undefined (legacy)
        if (currentState.phase3State !== 'playing' && currentState.phase3State !== undefined) {
            console.log('[Phase3] Not in playing state, aborting:', currentState.phase3State);
            return; // Abort
        }

        const progress = currentState.phase3TeamProgress?.[team];
        if (!progress) {
            console.log('[Phase3] No team progress found');
            return; // Abort - team not found
        }

        if (progress.finished) {
            console.log('[Phase3] Team already finished');
            return; // Abort - team already finished
        }

        // Advance to next question without awarding points
        const newProgress: Phase3TeamProgress = {
            ...progress,
            currentQuestionIndex: progress.currentQuestionIndex + 1,
        };

        // Check if team finished (5 questions)
        if (newProgress.currentQuestionIndex >= 5) {
            newProgress.finished = true;
            newProgress.finishedAt = Date.now();
        }

        console.log('[Phase3] Advancing to question:', newProgress.currentQuestionIndex);

        const newTeamProgress = {
            ...currentState.phase3TeamProgress,
            [team]: newProgress,
        };

        // Check if both teams finished
        const otherTeam = team === 'spicy' ? 'sweet' : 'spicy';
        const otherProgress = newTeamProgress[otherTeam];
        const bothFinished = newProgress.finished && otherProgress?.finished;

        return {
            ...currentState,
            phase3TeamProgress: newTeamProgress,
            phase3State: bothFinished ? 'finished' : currentState.phase3State,
        };
    });

    console.log('[Phase3] Transaction result:', { committed: result.committed });

    if (!result.committed) {
        return { success: false, error: 'Transaction failed or aborted' };
    }

    return { success: true };
};

/**
 * Get all themes for client display during selection.
 * Trap menus are included - they look like normal menus but have harder questions.
 * The trap is only revealed after selection (or during gameplay).
 * @param themes - Array of all themes
 * @returns Array of all themes with their original indices
 */
export function getPhase3VisibleThemes(themes: Phase3Theme[]): { theme: Phase3Theme; originalIndex: number }[] {
    return themes.map((theme, index) => ({ theme, originalIndex: index }));
}

/**
 * Check if Phase 3 is complete (both teams finished).
 * @param code - Room code
 */
export const checkPhase3Completion = async (code: string): Promise<boolean> => {
    const roomId = code.toUpperCase();
    const stateSnapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (!stateSnapshot.exists()) return false;

    const state = stateSnapshot.val() as GameState;
    return state.phase3State === 'finished';
};

/**
 * Get Phase 3 results for display.
 * @param code - Room code
 */
export const getPhase3Results = async (code: string): Promise<{
    spicy: { score: number; finishedAt?: number };
    sweet: { score: number; finishedAt?: number };
} | null> => {
    const roomId = code.toUpperCase();
    const stateSnapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (!stateSnapshot.exists()) return null;

    const state = stateSnapshot.val() as GameState;
    const progress = state.phase3TeamProgress;

    if (!progress) return null;

    return {
        spicy: {
            score: progress.spicy?.score || 0,
            finishedAt: progress.spicy?.finishedAt,
        },
        sweet: {
            score: progress.sweet?.score || 0,
            finishedAt: progress.sweet?.finishedAt,
        },
    };
};

/**
 * Update player's current typing text for real-time teammate visibility.
 * Called with debounce from the input component.
 * @param code - Room code
 * @param playerId - Player typing
 * @param text - Current text being typed
 */
export const updatePhase3Typing = async (
    code: string,
    playerId: string,
    text: string
): Promise<void> => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb), {
        [`rooms/${roomId}/state/phase3CurrentTyping/${playerId}`]: text,
    });
};

/**
 * Clear player's typing text (when they submit or question changes).
 * @param code - Room code
 * @param playerId - Player to clear
 */
export const clearPhase3Typing = async (
    code: string,
    playerId: string
): Promise<void> => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb), {
        [`rooms/${roomId}/state/phase3CurrentTyping/${playerId}`]: null,
    });
};
