/**
 * Game services module
 * Re-exports all game-related services for easy imports
 */

// Room management
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
    // Player readiness
    markPlayerReady,
    clearPlayersReady,
    getReadinessStatus,
} from './roomService';

// Shared utilities
export {
    addTeamPoints,
    getTeamScores,
} from './sharedUtils';

// Phase 1 - Tenders (Speed MCQ)
export {
    startNextQuestion,
    submitAnswer,
} from './phases/phase1Service';

// Phase 2 - Sucré Salé (Binary choice)
export {
    nextPhase2Item,
    submitPhase2Answer,
    endPhase2Round,
    setPhase2GeneratingState,
    getPhase2GeneratingState,
} from './phases/phase2Service';

// Phase 3 - La Carte (Parallel play with LLM validation)
export {
    getPhase3SelectionOrder,
    initPhase3,
    selectPhase3Theme,
    submitPhase3Answer,
    skipPhase3Question,
    getPhase3VisibleThemes,
    checkPhase3Completion,
    getPhase3Results,
} from './phases/phase3Service';

// Phase 4 - La Note (Speed MCQ race)
export {
    submitPhase4Answer,
    handlePhase4Timeout,
    nextPhase4Question,
} from './phases/phase4Service';

// Phase 5 - Burger Ultime (Memory duel)
export {
    startPhase5,
    setPhase5State,
    submitPhase5Vote,
    checkPhase5VoteCompletion,
    nextPhase5MemoryQuestion,
    submitPhase5Answer,
    checkPhase5AnswerCompletion,
    setPhase5Results,
} from './phases/phase5Service';
