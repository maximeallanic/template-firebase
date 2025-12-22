import { ref, set, get, update, onValue, onDisconnect, increment, runTransaction, remove } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, auth, db, getUserSubscriptionDirect } from './firebase';
import { type Question } from '../data/questions';
import { PHASE2_SETS } from '../data/phase2';

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
    Room
} from '../types/gameTypes';

export { AVATAR_LIST, PHASE_NAMES } from '../types/gameTypes';

// Import types for internal use
import type {
    Avatar, Team, Player, GameState, Room, SimplePhase2Set, Phase3Menu, Phase3Theme, Phase3TeamProgress,
    Phase4Question, Phase4Answer, Phase4Winner, Phase5Data, PhaseStatus,
    Phase5State, Phase5Results, Phase2TeamAnswer, Phase2TeamAnswers
} from '../types/gameTypes';

// Import LLM validation for Phase 3
import { validatePhase3Answer as validatePhase3AnswerLLM } from './aiClient';

// Import default Phase 3 themes
import { PHASE3_DATA } from './data/phase3';

// Module-level lock for Phase 2 auto-advance to prevent multiple setTimeout calls
// Key format: `${roomId}_${currentPhase2Item}`
const phase2AutoAdvanceScheduled: Record<string, boolean> = {};

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
            updates[`rooms/${roomId}/state/phaseState`] = 'reading';
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
            updates[`rooms/${roomId}/state/phaseState`] = 'reading';
            updates[`rooms/${roomId}/state/phase2TeamAnswers`] = {};
            updates[`rooms/${roomId}/state/phase2RoundWinner`] = null;
            updates[`rooms/${roomId}/state/roundWinner`] = null;
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
            break;
    }

    return updates;
}

/**
 * Triggers auto-transition to answering state after reading delay for phase1
 */
export function schedulePhase1Transition(roomId: string): void {
    setTimeout(async () => {
        try {
            const answeringUpdates: Record<string, unknown> = {};
            answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
            answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
            await update(ref(rtdb), answeringUpdates);
        } catch (error) {
            console.error('Failed to transition to answering state:', error);
        }
    }, 3000); // 3 seconds reading time
}

/**
 * Get current authenticated user ID
 * Throws if not authenticated
 */
function getAuthUserId(): string {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated to perform this action');
    }
    return user.uid;
}

/**
 * Validates that data from Firebase has required Room structure.
 * Throws error if validation fails for critical fields.
 */
function validateRoom(data: unknown): Room {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid room data: not an object');
    }
    const room = data as Record<string, unknown>;
    if (typeof room.code !== 'string' || !room.code) {
        throw new Error('Invalid room: missing code');
    }
    if (typeof room.hostId !== 'string') {
        throw new Error('Invalid room: missing hostId');
    }
    if (!room.state || typeof room.state !== 'object') {
        throw new Error('Invalid room: missing state');
    }
    // Players can be empty object but must exist (Firebase may return null if no players)
    if (room.players === undefined) {
        (room as Record<string, unknown>).players = {};
    }
    return room as unknown as Room;
}

// ... existing helpers/core services

// === CONTENT MANAGEMENT ===

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

    await set(ref(rtdb, updatePath), contentStore);

    // Note: We do NOT set status here - that's handled by setGameStatus()
    // which also schedules phase transitions. Only initialize data-related state.
    const updates: Record<string, unknown> = {};

    if (phase === 'phase3') {
        updates[`rooms/${roomId}/state/phase3CompletedMenus`] = [];
        updates[`rooms/${roomId}/state/phase3MenuSelection`] = {};
        updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
    } else if (phase === 'phase4') {
        updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/phase4State`] = 'idle';
        updates[`rooms/${roomId}/state/buzzedTeam`] = null;
    }

    if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
    }
};

// ... existing host actions

export const startNextQuestion = async (code: string, nextIndex: number) => {
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
    updates[`rooms/${roomId}/state/phaseState`] = 'reading';
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase1Answers`] = {};
    updates[`rooms/${roomId}/state/phase1BlockedTeams`] = []; // Reset blocked teams
    updates[`rooms/${roomId}/state/phase1TriedWrongOptions`] = []; // Reset tried wrong options for rebond
    updates[`rooms/${roomId}/state/phase1LastWrongTeam`] = null;

    // Note: Question marking is now done client-side in Phase1Player.tsx
    // Each player's component marks the question as seen on their own device
    // This ensures the correct user's history is updated (auth.currentUser.uid)

    await update(ref(rtdb), updates);

    // Auto-switch to answering mode after 3s reading time (with retry on failure)
    setTimeout(async () => {
        let retries = 2;
        while (retries >= 0) {
            try {
                const answeringUpdates: Record<string, unknown> = {};
                answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
                answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
                await update(ref(rtdb), answeringUpdates);
                return; // Success - exit retry loop
            } catch (error) {
                console.error('Failed to transition to answering state:', error);
                retries--;
                if (retries >= 0) {
                    // Wait 500ms before retrying
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }
        // After all retries failed, log critical error
        console.error('[CRITICAL] Unable to transition to answering state after 3 retries');
    }, 3000);
};

export const submitAnswer = async (code: string, playerId: string, answerIndex: number) => {
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

            // 2. Check if all 4 options exhausted
            if (newTriedWrongOptions.length >= 4) {
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

// --- PHASE 2 LOGIC ---

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

    const nextIndex = (room.state.currentPhase2Item ?? 0) + 1;
    updates[`rooms/${roomId}/state/currentPhase2Item`] = nextIndex;
    updates[`rooms/${roomId}/state/phaseState`] = 'reading';

    await update(ref(rtdb), updates);
};

// ... submitPhase2Answer is handled by client state check usually, but let's update it in case
// Actually `Phase2Player` does the `currentItem` lookup. Verification in `submitPhase2Answer` uses `answer === correctAnswer` passed from client?
// Checking `gameService.ts`: 
// `submitPhase2Answer` takes `answer` and `correctAnswer` as ARGUMENTS. So it trusts the client.
// So `submitPhase2Answer` does NOT need modification for data source, `Phase2Player` DOES. 

// === HELPER ===
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// === CORE SERVICES ===

export const createRoom = async (hostName: string, avatar: Avatar): Promise<{ code: string; playerId: string }> => {
    // Use Firebase Auth UID as player ID for security
    const playerId = getAuthUserId();

    const code = generateRoomCode();
    const roomId = code;

    // Fetch host's subscription status (stored in room so guests can access it)
    let hostIsPremium = false;
    try {
        const subscription = await getUserSubscriptionDirect();
        hostIsPremium = subscription.subscriptionStatus === 'active';
    } catch (error) {
        // If we can't fetch subscription, default to free (fail-safe)
        console.warn('[createRoom] Could not fetch host subscription, defaulting to free:', error);
    }

    const hostPlayer: Player = {
        id: playerId,
        name: hostName,
        avatar: avatar,
        team: null,
        isHost: true,
        score: 0,
        joinedAt: Date.now(),
        isOnline: true
    };

    const initialGameState: GameState = {
        status: 'lobby',
        phaseState: 'idle'
    };

    const roomData: Room = {
        code,
        hostId: playerId,
        hostIsPremium, // Store premium status for all players to access
        players: { [playerId]: hostPlayer },
        state: initialGameState,
        createdAt: Date.now()
    };

    await set(ref(rtdb, `rooms/${roomId}`), roomData);
    setupDisconnectHandler(roomId, playerId);

    return { code, playerId };
};

export const joinRoom = async (code: string, playerName: string, avatar: Avatar): Promise<{ playerId: string } | null> => {
    // Use Firebase Auth UID as player ID for security
    const playerId = getAuthUserId();
    console.log('🔍 joinRoom - playerId:', playerId);

    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    console.log('🔍 joinRoom - looking for room:', roomId);

    // DEBUG: Log RTDB config at query time
    console.log('🔍 joinRoom - rtdb app options:', JSON.stringify({
        projectId: rtdb.app.options.projectId,
        databaseURL: rtdb.app.options.databaseURL,
    }, null, 2));

    const snapshot = await get(roomRef);
    console.log('🔍 joinRoom - snapshot.exists():', snapshot.exists());
    console.log('🔍 joinRoom - snapshot.val():', snapshot.val());

    if (!snapshot.exists()) {
        throw new Error('Room not found');
    }

    const room = validateRoom(snapshot.val());

    // Check if player already exists in room (reconnection scenario)
    if (room.players && room.players[playerId]) {
        // Player is reconnecting - update their info and mark online
        await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), {
            name: playerName,
            avatar,
            isOnline: true
        });
        setupDisconnectHandler(roomId, playerId);
        return { playerId };
    }

    // Check if game has already started (new players can't join mid-game)
    if (room.state.status !== 'lobby') {
        throw new Error('Game already started');
    }

    // Check player limit (max 20 players per room)
    const MAX_PLAYERS = 20;
    const currentPlayerCount = room.players ? Object.keys(room.players).length : 0;
    if (currentPlayerCount >= MAX_PLAYERS) {
        throw new Error(`Room is full (max ${MAX_PLAYERS} players)`);
    }

    // Create new player with auth.uid as key
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${playerId}`);

    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        avatar,
        team: null,
        isHost: false,
        score: 0,
        joinedAt: Date.now(),
        isOnline: true
    };

    await set(playerRef, newPlayer);
    setupDisconnectHandler(roomId, playerId);

    return { playerId };
};

export const subscribeToRoom = (code: string, callback: (room: Room | null) => void) => {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
            try {
                callback(validateRoom(snapshot.val()));
            } catch (error) {
                console.error('Invalid room data:', error);
                callback(null);
            }
        } else {
            callback(null);
        }
    });
};
const setupDisconnectHandler = (roomId: string, playerId: string) => {
    const playerOnlineRef = ref(rtdb, `rooms/${roomId}/players/${playerId}/isOnline`);
    onDisconnect(playerOnlineRef).set(false);
};

// Leave room (remove player from room without logging out)
export const leaveRoom = async (code: string, playerId: string) => {
    const roomId = code.toUpperCase();
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${playerId}`);
    await remove(playerRef);
};

// Mark player as online (for reconnection scenarios)
export const markPlayerOnline = async (code: string, playerId: string): Promise<boolean> => {
    try {
        const roomId = code.toUpperCase();
        const playerRef = ref(rtdb, `rooms/${roomId}/players/${playerId}`);
        const snapshot = await get(playerRef);

        if (snapshot.exists()) {
            await update(ref(rtdb), {
                [`rooms/${roomId}/players/${playerId}/isOnline`]: true
            });
            // Re-setup disconnect handler
            setupDisconnectHandler(roomId, playerId);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to mark player online:', error);
        return false;
    }
};

// === HOST ACTIONS ===

export const updatePlayerTeam = async (code: string, playerId: string, team: Team) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), { team });
};

export const updatePlayerProfile = async (code: string, playerId: string, name: string, avatar: Avatar) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), { name, avatar });
};

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

    await update(ref(rtdb), updates);

    // If starting Phase 1, auto-transition to answering after delay
    if (status === 'phase1') {
        schedulePhase1Transition(roomId);
        // Note: Question marking is now done client-side in Phase1Player.tsx
    }
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

// --- PHASE 2 LOGIC ---



/**
 * Submit a Phase 2 answer - Team-based logic
 * Only 1 person per team needs to answer. First correct answer wins.
 * If a team answers wrong, the other team can still try.
 * Round ends when: correct answer found OR both teams answered wrong.
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
            timestamp: Date.now()
        };

        const newTeamAnswers: Phase2TeamAnswers = {
            ...teamAnswers,
            [myTeam]: myAnswer
        };

        const newState: GameState = {
            ...currentState,
            phase2TeamAnswers: newTeamAnswers
        };

        if (isCorrect) {
            // TEAM WINS! Round ends immediately
            newState.phase2RoundWinner = myTeam;
            newState.phaseState = 'result';
            newState.roundWinner = {
                playerId,
                name: player.name,
                team: myTeam
            };
        } else {
            // Wrong answer - check if round should end
            const otherTeamAnswer = teamAnswers[otherTeam];

            if (otherTeamAnswer && !otherTeamAnswer.correct) {
                // Both teams answered wrong - no winner
                newState.phase2RoundWinner = null;
                newState.phaseState = 'result';
                newState.roundWinner = null;
            } else if (!otherTeamHasPlayers) {
                // Other team has no players - end round with no winner
                newState.phase2RoundWinner = null;
                newState.phaseState = 'result';
                newState.roundWinner = null;
            }
            // Otherwise, other team can still try - keep phaseState as is
        }

        return newState;
    });

    // Transaction aborted or failed
    if (!result.committed) {
        return;
    }

    // If correct answer committed, award point to the player who answered
    const newState = result.snapshot.val() as GameState;
    if (newState?.phase2RoundWinner === myTeam) {
        await update(ref(rtdb), {
            [`rooms/${roomId}/players/${playerId}/score`]: increment(1)
        });
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
 * Force end Phase 2 round (for edge cases like host skip or timeout).
 * Normal round end is handled in submitPhase2Answer.
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
    const hasAnecdote = currentSet?.items?.[itemIndex]?.anecdote;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/phaseState`] = 'result';
    updates[`rooms/${roomId}/state/phase2RoundWinner`] = null; // No winner (forced end)
    updates[`rooms/${roomId}/state/roundWinner`] = null;

    await update(ref(rtdb), updates);

    // Auto-advance
    const delay = hasAnecdote ? 10000 : 4000;
    setTimeout(() => nextPhase2Item(roomId), delay);
};

// --- PHASE 3 LEGACY (DEPRECATED - kept for reference, new logic is below) ---
// The old selectMenu, nextMenuQuestion, endMenuTurn functions have been removed.
// Phase 3 now uses parallel play with LLM validation - see Phase 3 V2 section below.

export const addTeamPoints = async (roomCode: string, team: Team, points: number) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = validateRoom(snapshot.val());
    const updates: Record<string, unknown> = {};

    Object.values(room.players).forEach(player => {
        if (player.team === team) {
            const newScore = (player.score || 0) + points;
            updates[`rooms/${roomId}/players/${player.id}/score`] = newScore;
        }
    });

    if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
    }
};

// --- PHASE 3 V2 LOGIC (La Carte - Parallel play with LLM validation) ---

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
 * Calculate team scores from players.
 * @param players - Record of players in the room
 * @returns Object with spicy and sweet scores
 */
export function getTeamScores(players: Record<string, Player>): { spicy: number; sweet: number } {
    let spicy = 0;
    let sweet = 0;

    Object.values(players).forEach(player => {
        if (player.team === 'spicy') {
            spicy += player.score || 0;
        } else if (player.team === 'sweet') {
            sweet += player.score || 0;
        }
    });

    return { spicy, sweet };
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
 * Uses LLM validation for fuzzy matching.
 * First player from team to answer correctly wins the point.
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

    // Get the question
    const themes = room.customQuestions?.phase3 || PHASE3_DATA;
    const theme = themes[teamProgress.themeIndex];
    if (!theme || !theme.questions[questionIndex]) {
        return { success: false, isCorrect: false, error: 'Question not found' };
    }

    const question = theme.questions[questionIndex];

    // Validate answer using LLM
    let isCorrect = false;
    try {
        const validationResult = await validatePhase3AnswerLLM({
            playerAnswer: answer,
            correctAnswer: question.answer,
            acceptableAnswers: question.acceptableAnswers,
        });
        isCorrect = validationResult.isCorrect;
    } catch (error) {
        console.error('[Phase3] LLM validation error, using fallback:', error);
        // Fallback: Check exact match first, then acceptable answers
        const normalizedAnswer = answer.toLowerCase().trim();
        const normalizedCorrect = question.answer.toLowerCase().trim();
        isCorrect = normalizedAnswer === normalizedCorrect;

        // If exact match failed, check acceptable answers
        if (!isCorrect && question.acceptableAnswers?.length) {
            isCorrect = question.acceptableAnswers.some(alt =>
                alt.toLowerCase().trim() === normalizedAnswer
            );
        }

        // Log if answer was rejected in fallback mode (for debugging)
        if (!isCorrect) {
            console.warn('[Phase3] Answer rejected in fallback mode:', {
                playerAnswer: answer,
                expectedAnswer: question.answer,
                acceptableCount: question.acceptableAnswers?.length || 0
            });
        }
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

    // Award point to player
    await update(ref(rtdb), {
        [`rooms/${roomId}/players/${playerId}/score`]: increment(1),
    });

    return { success: true, isCorrect: true };
};

/**
 * Get visible themes (excludes trap theme) for client display.
 * @param themes - Array of all themes
 * @returns Array of visible themes with their original indices
 */
export function getPhase3VisibleThemes(themes: Phase3Theme[]): { theme: Phase3Theme; originalIndex: number }[] {
    return themes
        .map((theme, index) => ({ theme, originalIndex: index }))
        .filter(({ theme }) => !theme.isTrap);
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

// --- PHASE 4 LOGIC (La Note - Course de rapidité MCQ) ---

/**
 * Soumet une réponse pour Phase 4.
 * Utilise une transaction pour gérer les conditions de course.
 * Le premier joueur à répondre correctement gagne 2 points.
 */
export const submitPhase4Answer = async (
    roomCode: string,
    playerId: string,
    answerIndex: number
): Promise<void> => {
    const roomId = roomCode.toUpperCase();
    const timestamp = Date.now();

    // Get room data
    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;
    const room = validateRoom(roomSnapshot.val());

    // Validate state
    if (room.state.phase4State !== 'questioning') return;

    const player = room.players[playerId];
    if (!player || !player.team) return;

    // Get current question
    const questionsList = room.customQuestions?.phase4 || [];
    const currentIdx = room.state.currentPhase4QuestionIndex ?? 0;
    const currentQuestion = questionsList[currentIdx];
    if (!currentQuestion) return;

    const isCorrect = answerIndex === currentQuestion.correctIndex;

    // Use transaction for atomic answer submission
    const answersRef = ref(rtdb, `rooms/${roomId}/state/phase4Answers`);

    const result = await runTransaction(answersRef, (currentAnswers) => {
        const answers = currentAnswers || {};

        // If already answered, abort
        if (playerId in answers) return;

        // Add this player's answer with timestamp
        return {
            ...answers,
            [playerId]: { answer: answerIndex, timestamp }
        };
    });

    if (!result.committed) return;

    // If this is a correct answer, check if it's the first
    if (isCorrect) {
        const stateRef = ref(rtdb, `rooms/${roomId}/state`);

        await runTransaction(stateRef, (currentState) => {
            if (!currentState) return currentState;

            // Only process if still in questioning state and no winner yet
            if (currentState.phase4State !== 'questioning') return;
            if (currentState.phase4Winner) return;

            // Check all answers to find the first correct one
            const allAnswers = currentState.phase4Answers || {};
            let firstCorrectPlayer: string | null = null;
            let firstCorrectTime = Infinity;

            for (const [pid, data] of Object.entries(allAnswers)) {
                const answerData = data as Phase4Answer;
                if (answerData.answer === currentQuestion.correctIndex) {
                    if (answerData.timestamp < firstCorrectTime) {
                        firstCorrectTime = answerData.timestamp;
                        firstCorrectPlayer = pid;
                    }
                }
            }

            // If this player is the first correct, set winner and transition to result
            if (firstCorrectPlayer === playerId) {
                return {
                    ...currentState,
                    phase4State: 'result',
                    phase4Winner: {
                        playerId,
                        name: player.name,
                        team: player.team
                    } as Phase4Winner
                };
            }

            return currentState;
        });

        // Award points if this player won
        const updatedState = (await get(ref(rtdb, `rooms/${roomId}/state`))).val();
        if (updatedState?.phase4Winner?.playerId === playerId) {
            await update(ref(rtdb), {
                [`rooms/${roomId}/players/${playerId}/score`]: increment(2)
            });
        }
    }
};

/**
 * Gère le timeout (30s écoulées sans bonne réponse).
 * Passe à l'état 'result' sans gagnant.
 */
export const handlePhase4Timeout = async (roomCode: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();

    const stateRef = ref(rtdb, `rooms/${roomId}/state`);

    await runTransaction(stateRef, (currentState) => {
        if (!currentState) return currentState;
        if (currentState.phase4State !== 'questioning') return;

        // Time's up - no winner
        return {
            ...currentState,
            phase4State: 'result',
            phase4Winner: null
        };
    });
};

/**
 * Passe à la question suivante.
 * Réinitialise les réponses et le timer.
 */
export const nextPhase4Question = async (roomCode: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();

    const roomSnapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!roomSnapshot.exists()) return;
    const room = validateRoom(roomSnapshot.val());

    const nextIndex = (room.state.currentPhase4QuestionIndex || 0) + 1;

    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/currentPhase4QuestionIndex`]: nextIndex,
        [`rooms/${roomId}/state/phase4State`]: 'questioning',
        [`rooms/${roomId}/state/phase4Answers`]: {},
        [`rooms/${roomId}/state/phase4QuestionStartTime`]: Date.now(),
        [`rooms/${roomId}/state/phase4Winner`]: null
    };

    await update(ref(rtdb), updates);
};

// ----- PHASE 5 LOGIC (BURGER ULTIME - Duel de mémoire) -----

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
 */
export const setPhase5State = async (roomCode: string, newState: Phase5State) => {
    const roomId = roomCode.toUpperCase();
    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/phase5State`]: newState
    };

    // Initialize state-specific data
    if (newState === 'selecting') {
        updates[`rooms/${roomId}/state/phase5Votes`] = { spicy: {}, sweet: {} };
        updates[`rooms/${roomId}/state/phase5Representatives`] = { spicy: null, sweet: null };
    } else if (newState === 'memorizing') {
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

    // Award team points based on results
    if (results.spicy.points > 0) {
        await addTeamPoints(roomCode, 'spicy', results.spicy.points);
    }
    if (results.sweet.points > 0) {
        await addTeamPoints(roomCode, 'sweet', results.sweet.points);
    }

    await update(ref(rtdb, `rooms/${roomId}/state`), {
        phase5State: 'result',
        phase5Results: results
    });
};

// --- VICTORY LOGIC ---

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
    let winnerTeam: Team | 'tie';
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
