import { ref, set, get, update, onValue, onDisconnect, increment, runTransaction, remove } from 'firebase/database';
import { rtdb, auth } from './firebase';
import { QUESTIONS, type Question } from '../data/questions';
import { PHASE2_SETS } from '../data/phase2';
import { markQuestionAsSeen } from './historyService';

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
    Phase3Menu,
    Phase4Question,
    Room
} from '../types/gameTypes';

export { AVATAR_LIST, PHASE_NAMES } from '../types/gameTypes';

// Import types for internal use
import type { Avatar, Team, Player, GameState, Room, SimplePhase2Set, Phase3Menu, Phase4Question, Phase5Data } from '../types/gameTypes';

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

    // Reset state for new content
    const updates: Record<string, unknown> = {};
    if (phase === 'phase1') {
        updates[`rooms/${roomId}/state/currentQuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/status`] = 'phase1';
        updates[`rooms/${roomId}/state/phaseState`] = 'reading';
    } else if (phase === 'phase2') {
        updates[`rooms/${roomId}/state/currentPhase2Set`] = 0;
        updates[`rooms/${roomId}/state/currentPhase2Item`] = 0;
        updates[`rooms/${roomId}/state/status`] = 'phase2';
    } else if (phase === 'phase3') {
        updates[`rooms/${roomId}/state/phase3CompletedMenus`] = [];
        updates[`rooms/${roomId}/state/phase3MenuSelection`] = {};
        updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
    } else if (phase === 'phase4') {
        updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/phase4State`] = 'idle';
        updates[`rooms/${roomId}/state/buzzedTeam`] = null;
    }

    await update(ref(rtdb), updates);
};

// ... existing host actions

export const startNextQuestion = async (code: string, nextIndex: number) => {
    console.log('🎮 startNextQuestion CALLED:', { code, nextIndex });
    const roomId = code.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}`));
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    const questionsList = room.customQuestions?.phase1 || QUESTIONS;

    // Safety check
    if (nextIndex >= questionsList.length) return;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/currentQuestionIndex`] = nextIndex;
    updates[`rooms/${roomId}/state/phaseState`] = 'reading';
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase1Answers`] = {};
    updates[`rooms/${roomId}/state/phase1BlockedTeams`] = []; // Reset blocked teams

    // Mark question as seen for all players
    const currentQ = questionsList[nextIndex];
    console.log('🎯 startNextQuestion - currentQ:', currentQ);
    console.log('🎯 currentQ.text:', currentQ?.text);
    console.log('🎯 room.players:', Object.keys(room.players || {}));
    if (currentQ && room.players) {
        Object.keys(room.players).forEach(pid => {
            console.log('🎯 Calling markQuestionAsSeen for player:', pid);
            markQuestionAsSeen(pid, currentQ.text);
        });
    } else {
        console.warn('⚠️ Skipped markQuestionAsSeen - currentQ:', !!currentQ, 'players:', !!room.players);
    }

    await update(ref(rtdb), updates);

    // Auto-switch to answering mode
    setTimeout(async () => {
        const answeringUpdates: Record<string, unknown> = {};
        answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
        answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
        await update(ref(rtdb), answeringUpdates);
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

    const questionsList = room.customQuestions?.phase1 || QUESTIONS;

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
            // WRONG ANSWER: Block the player's team
            const newBlockedTeams = [...blockedTeams, player.team];
            newState.phase1BlockedTeams = newBlockedTeams;

            // Check if ALL teams are now blocked
            const allTeams: Team[] = ['spicy', 'sweet'];
            const allBlocked = allTeams.every(t => newBlockedTeams.includes(t));

            if (allBlocked) {
                // Nobody got it right - show result and move on
                newState.roundWinner = null;
                newState.phaseState = 'result';
            }
        }

        return newState;
    });

    // If transaction committed and player won, update their score
    if (result.committed) {
        const newState = result.snapshot.val() as GameState;
        if (newState?.roundWinner?.playerId === playerId) {
            // Update score separately (host-only write rule, but this runs on host's behalf)
            const newScore = (player.score || 0) + 1;
            await update(ref(rtdb), {
                [`rooms/${roomId}/players/${playerId}/score`]: newScore
            });
        }
    }
};

// --- PHASE 2 LOGIC ---

export const nextPhase2Item = async (code: string) => {
    // ... setup
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = validateRoom(snapshot.val());
    if (room.state.status !== 'phase2') return;

    // ... logic
    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase2Answers`] = {};

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

    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);

    const snapshot = await get(roomRef);
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

export const setGameStatus = async (code: string, status: GameState['status']) => {
    const roomId = code.toUpperCase();
    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/status`] = status;

    // Reset phase 1 state when entering it
    if (status === 'phase1') {
        updates[`rooms/${roomId}/state/currentQuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/phaseState`] = 'reading';
        updates[`rooms/${roomId}/state/phase1Answers`] = {}; // Reset answers
        updates[`rooms/${roomId}/state/phase1BlockedTeams`] = []; // Reset blocked teams
        updates[`rooms/${roomId}/state/roundWinner`] = null; // Ensure round winner is reset
    } else if (status === 'phase2') {
        updates[`rooms/${roomId}/state/currentPhase2Set`] = 0; // Default to first set
        updates[`rooms/${roomId}/state/currentPhase2Item`] = 0;
        updates[`rooms/${roomId}/state/phaseState`] = 'reading';
        updates[`rooms/${roomId}/state/phase2Answers`] = {}; // Reset answers
    } else if (status === 'phase3') {
        updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
        updates[`rooms/${roomId}/state/phase3MenuSelection`] = {};
        updates[`rooms/${roomId}/state/phase3CompletedMenus`] = [];
        updates[`rooms/${roomId}/state/currentMenuTeam`] = 'spicy'; // Spicy starts choosing
        updates[`rooms/${roomId}/state/currentMenuQuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/roundWinner`] = null;
    } else if (status === 'phase4') {
        updates[`rooms/${roomId}/state/phaseState`] = 'idle'; // Hosting reading mode
        updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/buzzedTeam`] = null;
    }

    await update(ref(rtdb), updates);

    // If starting Phase 1, auto-transition to answering after delay
    if (status === 'phase1') {
        setTimeout(async () => {
            const answeringUpdates: Record<string, unknown> = {};
            answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
            answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
            await update(ref(rtdb), answeringUpdates);
        }, 3000); // 3 seconds reading time
    }
};



// --- PHASE 2 LOGIC ---



export const submitPhase2Answer = async (
    roomId: string,
    playerId: string,
    answer: 'A' | 'B' | 'Both',
    totalOnlinePlayers: number
) => {
    // SECURITY: Fetch correct answer from server data, NOT from client
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) return;

    const room = validateRoom(roomSnapshot.val());
    const setIndex = room.state.currentPhase2Set ?? 0;
    const itemIndex = room.state.currentPhase2Item ?? 0;

    // Get the current set from custom questions or default
    const currentSet = room.customQuestions?.phase2?.[setIndex] || PHASE2_SETS[setIndex];
    if (!currentSet?.items?.[itemIndex]) return;

    const correctAnswer = currentSet.items[itemIndex].answer;
    const isCorrect = answer === correctAnswer;
    const answersRef = ref(rtdb, `rooms/${roomId}/state/phase2Answers`);

    // Use transaction to atomically add answer
    const result = await runTransaction(answersRef, (currentAnswers) => {
        const answers = currentAnswers || {};
        // If already answered, abort
        if (playerId in answers) {
            return; // Abort transaction
        }
        // Add this player's answer
        return { ...answers, [playerId]: isCorrect };
    });

    // Transaction aborted (player already answered) or failed
    if (!result.committed) {
        return;
    }

    // Update score if correct (outside transaction since it's a different path)
    if (isCorrect) {
        const scoreRef = ref(rtdb, `rooms/${roomId}/players/${playerId}/score`);
        await runTransaction(scoreRef, (currentScore) => (currentScore || 0) + 1);
    }

    // Check if all players answered using the transaction result (no stale data)
    const updatedAnswers = result.snapshot.val() || {};
    const answeredCount = Object.keys(updatedAnswers).length;

    // If this player was the last to answer, end the round
    if (answeredCount >= totalOnlinePlayers && totalOnlinePlayers > 0) {
        // Small delay to let UI update before showing result
        setTimeout(() => {
            endPhase2Round(roomId);
        }, 300);
    }
};

export const endPhase2Round = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();

    // Récupérer la room pour accéder à l'item actuel
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    // Vérifier si l'item actuel a une anecdote
    const setIndex = room.state.currentPhase2Set ?? 0;
    const itemIndex = room.state.currentPhase2Item ?? 0;
    const currentSet = room.customQuestions?.phase2?.[setIndex] || PHASE2_SETS[setIndex];
    const hasAnecdote = currentSet?.items?.[itemIndex]?.anecdote;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/phaseState`] = 'result';
    // Dummy winner to signal round end, though individual client checks their own answer
    updates[`rooms/${roomId}/state/roundWinner`] = {
        playerId: 'ALL',
        name: 'Round Over',
        team: 'neutral'
    };

    await update(ref(rtdb), updates);

    // Auto-Advance avec délai conditionnel (7s avec anecdote, 4s sans)
    const delay = hasAnecdote ? 7000 : 4000;
    setTimeout(() => {
        nextPhase2Item(roomId);
    }, delay);
};

// --- PHASE 3 LOGIC ---

export const selectMenu = async (roomCode: string, team: 'spicy' | 'sweet', menuIndex: number) => {
    // Just update the selection
    await update(ref(rtdb, `rooms/${roomCode}/state/phase3MenuSelection`), {
        [team]: menuIndex
    });

    // After selection, we usually move to questioning for that team
    // Or if both need to select, we wait.
    // Simplified flow: Team selects -> Immediately starts questioning for that menu
    const stateUpdates: Partial<GameState> = {
        phaseState: 'questioning', // Using 'questioning' for this phase
        currentMenuTeam: team,
        currentMenuQuestionIndex: 0
    };
    await update(ref(rtdb, `rooms/${roomCode}/state`), stateUpdates);
};

export const nextMenuQuestion = async (roomCode: string, currentQuestionIndex: number) => {
    await update(ref(rtdb, `rooms/${roomCode}/state`), {
        currentMenuQuestionIndex: currentQuestionIndex + 1
    });
};

export const endMenuTurn = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = validateRoom(snapshot.val());
    const currentTeam = room.state.currentMenuTeam;

    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
    updates[`rooms/${roomId}/state/currentMenuQuestionIndex`] = 0;

    // Mark current menu as completed
    if (currentTeam && room.state.phase3MenuSelection && room.state.phase3MenuSelection[currentTeam] !== undefined) {
        const completedMenuIdx = room.state.phase3MenuSelection[currentTeam]!;
        const alreadyCompleted = room.state.phase3CompletedMenus || [];
        if (!alreadyCompleted.includes(completedMenuIdx)) {
            updates[`rooms/${roomId}/state/phase3CompletedMenus`] = [...alreadyCompleted, completedMenuIdx];
        }
    }

    // Switch team (optional/simple flow)
    // For now we rely on host/players to pick next, but we could toggle currentMenuTeam here if we wanted strict turns.
    // Let's toggle for convenience if next menu selection needed.
    const nextTeam = currentTeam === 'spicy' ? 'sweet' : 'spicy';
    updates[`rooms/${roomId}/state/currentMenuTeam`] = nextTeam;

    await update(ref(rtdb), updates);
};

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

// --- PHASE 4 LOGIC (La Note) ---

export const buzz = async (roomCode: string, team: Team) => {
    const roomId = roomCode.toUpperCase();
    const stateRef = ref(rtdb, `rooms/${roomId}/state`);

    // Use transaction for atomic read-modify-write to prevent race condition
    await runTransaction(stateRef, (currentState) => {
        if (!currentState) return currentState;

        // If someone already buzzed, abort transaction
        if (currentState.buzzedTeam) return;

        // First team to buzz wins
        return {
            ...currentState,
            buzzedTeam: team,
            phase4State: 'buzzed'
        };
    });
};

export const resolveBuzz = async (roomCode: string, correct: boolean) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    const currentTeam = room.state.buzzedTeam;
    if (!currentTeam) return;

    if (correct) {
        // Add points to team (2 points for buzzer round, matches UI)
        await addTeamPoints(roomId, currentTeam, 2);
        // Move to next question automatically
        const nextIndex = (room.state.currentPhase4QuestionIndex || 0) + 1;
        await update(ref(rtdb), {
            [`rooms/${roomId}/state/currentPhase4QuestionIndex`]: nextIndex,
            [`rooms/${roomId}/state/buzzedTeam`]: null,
            [`rooms/${roomId}/state/phase4State`]: 'idle'
        });
    } else {
        // Wrong answer -> Unlock buzzer for other team? Or just reset?
        // Usually hand passes to other team. Or just reset to let anyone buzz again?
        // Simple version: Reset buzz, let anyone try again (or same team).
        await update(ref(rtdb, `rooms/${roomId}/state`), {
            buzzedTeam: null,
            phase4State: 'idle'
        });
    }
};

export const nextPhase4Question = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    const room = validateRoom(snapshot.val());

    const nextIndex = (room.state.currentPhase4QuestionIndex || 0) + 1;

    await update(ref(rtdb, `rooms/${roomId}/state`), {
        currentPhase4QuestionIndex: nextIndex,
        buzzedTeam: null,
        phase4State: 'idle'
    });
};

// ----- PHASE 5 LOGIC (BURGER DE LA MORT) -----

export const startPhase5 = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/status`] = 'phase5';
    updates[`rooms/${roomId}/state/phase5State`] = 'idle';
    updates[`rooms/${roomId}/state/phase5QuestionIndex`] = 0;
    updates[`rooms/${roomId}/state/phase5Score`] = 0;

    await update(ref(rtdb), updates);
};

export const nextPhase5State = async (roomCode: string, newState: 'reading' | 'answering') => {
    const roomId = roomCode.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/state`), {
        phase5State: newState,
        // If moving to answering, start at Q1 (index 0) again
        phase5QuestionIndex: 0
    });
};

export const nextPhase5Question = async (roomCode: string, currentIndex: number, correct?: boolean) => {
    const roomId = roomCode.toUpperCase();
    const updates: Record<string, unknown> = {};
    updates[`rooms/${roomId}/state/phase5QuestionIndex`] = currentIndex + 1;
    if (correct) {
        updates[`rooms/${roomId}/state/phase5Score`] = increment(1);
    }
    await update(ref(rtdb), updates);
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
