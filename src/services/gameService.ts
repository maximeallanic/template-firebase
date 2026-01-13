import { ref, get, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from './firebase';
import type { Question } from '../data/questions';

// Re-export all types from centralized types file
export type {
    Avatar,
    PhaseStatus,
    PhaseInfo,
    Team,
    Player,
    GameState,
    PhaseState,
    SimplePhase2Set,
    Phase5Question,
    Phase5Data,
    Phase5State,
    Phase5Votes,
    Phase5Representatives,
    Phase5Answers,
    Phase5AnswerIndices,
    Phase5ValidationResult,
    Phase5TeamResult,
    Phase5Results,
    Phase3Menu,
    Phase4Question,
    Room,
    Difficulty,
    GameOptions
} from '../types/gameTypes';

export { AVATAR_LIST, PHASE_NAMES, DIFFICULTY_LIST, DEFAULT_DIFFICULTY } from '../types/gameTypes';

// Import types for internal use
import type {
    Player, GameState, SimplePhase2Set, Phase3Menu,
    Phase4Question, Phase5Data, PhaseStatus
} from '../types/gameTypes';

// ============================================================================
// EXTRACTED MODULES - Re-export for backward compatibility
// ============================================================================

// Room management functions
export {
    getAuthUserId,
    validateRoom,
    createRoom,
    joinRoom,
    subscribeToRoom,
    leaveRoom,
    markPlayerOnline,
    updatePlayerTeam,
    updatePlayerProfile,
    updateRoomDifficulty,
    getRoomDifficulty,
} from './game/roomService';

// Shared utilities
export {
    addTeamPoints,
    getTeamScores,
} from './game/sharedUtils';

// Phase 1 functions
export {
    startNextQuestion,
    submitAnswer,
    handlePhase1Timeout,
} from './game/phases/phase1Service';

// Phase 2 functions
export {
    nextPhase2Item,
    submitPhase2Answer,
    endPhase2Round,
    setPhase2GeneratingState,
    getPhase2GeneratingState,
} from './game/phases/phase2Service';

// Phase 3 functions
export {
    getPhase3SelectionOrder,
    initPhase3,
    selectPhase3Theme,
    submitPhase3Answer,
    skipPhase3Question,
    getPhase3VisibleThemes,
    checkPhase3Completion,
    getPhase3Results,
    updatePhase3Typing,
    clearPhase3Typing,
} from './game/phases/phase3Service';

// Phase 4 functions
export {
    submitPhase4Answer,
    handlePhase4Timeout,
    nextPhase4Question,
} from './game/phases/phase4Service';

// Phase 5 functions
export {
    startPhase5,
    setPhase5State,
    submitPhase5Vote,
    checkPhase5VoteCompletion,
    nextPhase5MemoryQuestion,
    submitPhase5Answer,
    checkPhase5AnswerCompletion,
    setPhase5Results,
} from './game/phases/phase5Service';

// Import for internal use
import { validateRoom } from './game/roomService';

// ============================================================================
// PHASE INITIAL STATE
// ============================================================================

/**
 * Returns the initial state updates for a given phase.
 * Used by both setGameStatus and debugService.skipToPhase.
 * @param roomId - The uppercase room ID
 * @param phase - The target phase status
 * @returns Record of Firebase update paths and values
 */
export function getPhaseInitialUpdates(roomId: string, phase: PhaseStatus): Record<string, unknown> {
    const updates: Record<string, unknown> = {};

    switch (phase) {
        case 'lobby':
            updates[`rooms/${roomId}/state/phaseState`] = 'idle';
            // Clear all phase-specific state
            updates[`rooms/${roomId}/state/currentQuestionIndex`] = null;
            updates[`rooms/${roomId}/state/phase1Answers`] = null;
            updates[`rooms/${roomId}/state/phase1BlockedTeams`] = null;
            updates[`rooms/${roomId}/state/phase1TriedWrongOptions`] = null;
            updates[`rooms/${roomId}/state/phase1LastWrongTeam`] = null;
            updates[`rooms/${roomId}/state/currentPhase2Set`] = null;
            updates[`rooms/${roomId}/state/currentPhase2Item`] = null;
            updates[`rooms/${roomId}/state/phase2TeamAnswers`] = null;
            updates[`rooms/${roomId}/state/phase2RoundWinner`] = null;
            updates[`rooms/${roomId}/state/phase3MenuSelection`] = null;
            updates[`rooms/${roomId}/state/phase3CompletedMenus`] = null;
            updates[`rooms/${roomId}/state/currentMenuTeam`] = null;
            updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = null;
            updates[`rooms/${roomId}/state/phase4State`] = null;
            updates[`rooms/${roomId}/state/phase4Answers`] = null;
            updates[`rooms/${roomId}/state/phase4QuestionStartTime`] = null;
            updates[`rooms/${roomId}/state/phase4Winner`] = null;
            updates[`rooms/${roomId}/state/buzzedTeam`] = null;  // Legacy cleanup
            updates[`rooms/${roomId}/state/phase5State`] = null;
            updates[`rooms/${roomId}/state/phase5QuestionIndex`] = null;
            updates[`rooms/${roomId}/state/phase5Score`] = null;
            break;

        case 'phase1':
            updates[`rooms/${roomId}/state/currentQuestionIndex`] = 0;
            updates[`rooms/${roomId}/state/phaseState`] = 'answering'; // Skip reading delay, go directly to answering
            updates[`rooms/${roomId}/state/phase1Answers`] = {};
            updates[`rooms/${roomId}/state/phase1BlockedTeams`] = [];
            updates[`rooms/${roomId}/state/phase1TriedWrongOptions`] = [];
            updates[`rooms/${roomId}/state/phase1LastWrongTeam`] = null;
            updates[`rooms/${roomId}/state/roundWinner`] = null;
            updates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
            break;

        case 'phase2':
            updates[`rooms/${roomId}/state/currentPhase2Set`] = 0;
            updates[`rooms/${roomId}/state/currentPhase2Item`] = 0;
            updates[`rooms/${roomId}/state/phaseState`] = 'answering'; // Phase 2 allows immediate answering (no reading delay)
            updates[`rooms/${roomId}/state/phase2TeamAnswers`] = {};
            updates[`rooms/${roomId}/state/phase2RoundWinner`] = null;
            updates[`rooms/${roomId}/state/phase2BothCorrect`] = false;
            updates[`rooms/${roomId}/state/roundWinner`] = null;
            updates[`rooms/${roomId}/state/phase2QuestionStartTime`] = Date.now();
            break;

        case 'phase3':
            // Phase 3 v2 - Parallel play with theme selection
            updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
            updates[`rooms/${roomId}/state/phase3State`] = 'selecting';
            // Selection order will be set by initPhase3 based on scores
            updates[`rooms/${roomId}/state/phase3SelectionOrder`] = ['spicy', 'sweet']; // Default, updated at runtime
            updates[`rooms/${roomId}/state/phase3ThemeSelection`] = {};
            updates[`rooms/${roomId}/state/phase3TeamProgress`] = {};
            // Clear legacy fields
            updates[`rooms/${roomId}/state/phase3MenuSelection`] = null;
            updates[`rooms/${roomId}/state/phase3CompletedMenus`] = null;
            updates[`rooms/${roomId}/state/currentMenuTeam`] = null;
            updates[`rooms/${roomId}/state/currentMenuQuestionIndex`] = null;
            updates[`rooms/${roomId}/state/roundWinner`] = null;
            break;

        case 'phase4':
            updates[`rooms/${roomId}/state/phaseState`] = 'questioning';
            updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = 0;
            updates[`rooms/${roomId}/state/phase4State`] = 'questioning';
            updates[`rooms/${roomId}/state/phase4Answers`] = {};
            updates[`rooms/${roomId}/state/phase4QuestionStartTime`] = Date.now();
            updates[`rooms/${roomId}/state/phase4Winner`] = null;
            // Clean up old buzzer state
            updates[`rooms/${roomId}/state/buzzedTeam`] = null;
            break;

        case 'phase5':
            updates[`rooms/${roomId}/state/phase5State`] = 'idle';
            updates[`rooms/${roomId}/state/phase5QuestionIndex`] = 0;
            updates[`rooms/${roomId}/state/phase5TimerStart`] = null;
            updates[`rooms/${roomId}/state/phase5Votes`] = null;
            updates[`rooms/${roomId}/state/phase5Representatives`] = null;
            updates[`rooms/${roomId}/state/phase5Answers`] = null;
            updates[`rooms/${roomId}/state/phase5CurrentAnswerIndex`] = null;
            updates[`rooms/${roomId}/state/phase5Results`] = null;
            updates[`rooms/${roomId}/state/phaseState`] = 'idle';
            // Clear phase5Scored flag from all players to prevent score duplication
            // This is handled in setGameStatus to avoid async issues in getPhaseInitialUpdates
            break;
    }

    return updates;
}

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

export const overwriteGameQuestions = async (
    code: string,
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5',
    data: Question[] | SimplePhase2Set | SimplePhase2Set[] | Phase3Menu[] | Phase4Question[] | Phase5Data | Record<string, unknown> | unknown[]
) => {
    const roomId = code.toUpperCase();
    const updatePath = `rooms/${roomId}/customQuestions/${phase}`;

    // For Phase 2, the AI returns a single set object, but our system supports array of sets.
    // We will wrap it in an array if phase is phase2.
    let contentStore: Question[] | SimplePhase2Set[] | Phase3Menu[] | Phase4Question[] | Phase5Data | unknown[] | Record<string, unknown> = data as Question[] | SimplePhase2Set[] | Phase3Menu[] | Phase4Question[] | Phase5Data | unknown[] | Record<string, unknown>;
    if (phase === 'phase2' && !Array.isArray(data)) {
        contentStore = [data as SimplePhase2Set]; // AI generates one set, we store as first item
    }

    const { set } = await import('firebase/database');
    await set(ref(rtdb, updatePath), contentStore);

    // Note: We do NOT set status here - that's handled by setGameStatus()
    // which also schedules phase transitions. Only initialize data-related state.
    // CRITICAL: Only initialize phase state if we're actually ON that phase.
    // This prevents background pregen from corrupting the current phase's state.
    const stateSnapshot = await get(ref(rtdb, `rooms/${roomId}/state/status`));
    const currentStatus = stateSnapshot.exists() ? stateSnapshot.val() : null;

    const updates: Record<string, unknown> = {};

    // Only apply phase-specific state initialization if we're actually on that phase
    if (phase === 'phase3' && currentStatus === 'phase3') {
        updates[`rooms/${roomId}/state/phase3CompletedMenus`] = [];
        updates[`rooms/${roomId}/state/phase3MenuSelection`] = {};
        updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
    } else if (phase === 'phase4' && currentStatus === 'phase4') {
        updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/phase4State`] = 'idle';
        updates[`rooms/${roomId}/state/buzzedTeam`] = null;
    }

    if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
    }
};

// ============================================================================
// GAME STATUS MANAGEMENT
// ============================================================================

/**
 * Premium phases that require a subscription
 */
export const PREMIUM_PHASES: GameState['status'][] = ['phase3', 'phase4', 'phase5'];

export const setGameStatus = async (code: string, status: GameState['status']) => {
    const roomId = code.toUpperCase();

    // Guard against duplicate calls: check current status first
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/state`));
    if (snapshot.exists()) {
        const currentState = snapshot.val() as GameState;
        if (currentState.status === status) {
            return;
        }
    }

    // Premium phase gate: check if host has subscription
    if (PREMIUM_PHASES.includes(status)) {
        const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
        if (roomSnapshot.exists()) {
            const room = validateRoom(roomSnapshot.val());
            const hostId = room.hostId;

            // Check host's subscription status in Firestore
            const hostDoc = await getDoc(doc(db, 'users', hostId));
            const hostData = hostDoc.data();

            if (hostData?.subscriptionStatus !== 'active') {
                throw new Error('PREMIUM_REQUIRED');
            }
        }
    }

    // Get phase-specific state updates
    const phaseUpdates = getPhaseInitialUpdates(roomId, status);

    // Add the status change
    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/status`]: status,
        ...phaseUpdates
    };

    // Phase 5 specific: Clear phase5Scored flag from all players
    if (status === 'phase5') {
        const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
        if (roomSnapshot.exists()) {
            const room = validateRoom(roomSnapshot.val());
            Object.keys(room.players).forEach(playerId => {
                updates[`rooms/${roomId}/players/${playerId}/phase5Scored`] = null;
            });
        }
    }

    await update(ref(rtdb), updates);

    // Note: Phase 1 now starts directly in 'answering' state (no reading delay)
    // Question marking is done client-side in Phase1Player.tsx
};

/**
 * Show the phase results screen (intermediate results between phases)
 * This sets phaseState to 'phase_results' without changing the current phase status
 */
export const showPhaseResults = async (code: string) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb), {
        [`rooms/${roomId}/state/phaseState`]: 'phase_results'
    });
};

/**
 * Set the generation state (visible to all players)
 */
export const setGeneratingState = async (code: string, isGenerating: boolean) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/state`), { isGenerating });
};

// ============================================================================
// VICTORY LOGIC
// ============================================================================

export const endGameWithVictory = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = validateRoom(snapshot.val());
    const players = room.players || {};

    // Calculate team scores
    let spicyScore = 0;
    let sweetScore = 0;

    Object.values(players).forEach((player: Player) => {
        if (player.team === 'spicy') {
            spicyScore += player.score || 0;
        } else if (player.team === 'sweet') {
            sweetScore += player.score || 0;
        }
    });

    // Determine winner
    let winnerTeam: 'spicy' | 'sweet' | 'tie';
    if (spicyScore > sweetScore) {
        winnerTeam = 'spicy';
    } else if (sweetScore > spicyScore) {
        winnerTeam = 'sweet';
    } else {
        winnerTeam = 'tie';
    }

    // Update game state to victory
    await update(ref(rtdb, `rooms/${roomId}/state`), {
        status: 'victory',
        phaseState: 'idle',
        winnerTeam: winnerTeam
    });
};

/**
 * Restart the game - reset all scores and return to lobby
 * This function resets all game state and player scores via Firebase
 */
export const restartGame = async (roomCode: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);

    // Get phase initial updates for lobby to clear all phase-specific state
    const phaseUpdates = getPhaseInitialUpdates(roomId, 'lobby');

    // Prepare state reset updates
    const stateUpdates: Record<string, unknown> = {
        [`rooms/${roomId}/state/status`]: 'lobby',
        ...phaseUpdates,
        [`rooms/${roomId}/state/winnerTeam`]: null,
        [`rooms/${roomId}/state/isGenerating`]: null,
        [`rooms/${roomId}/customQuestions`]: null,
        [`rooms/${roomId}/generationStatus`]: null
    };

    // Reset all player scores
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
        const room = validateRoom(snapshot.val());
        Object.keys(room.players).forEach(playerId => {
            stateUpdates[`rooms/${roomId}/players/${playerId}/score`] = 0;
            stateUpdates[`rooms/${roomId}/players/${playerId}/phase5Scored`] = null;
        });
    }

    // Apply all updates atomically
    await update(ref(rtdb), stateUpdates);
};
