import { ref, set, get, update, onValue, push, onDisconnect, increment } from 'firebase/database';
import { rtdb } from './firebase';
import { QUESTIONS } from '../data/questions';

// === TYPES ===
export type Team = 'spicy' | 'sweet';
export type Avatar = 'donut' | 'pizza' | 'taco' | 'sushi' | 'chili' | 'cookie' | 'icecream' | 'fries';
export type GameStatus = 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'results';
export type PhaseState = 'idle' | 'reading' | 'answering' | 'result' | 'menu_selection' | 'questioning';

export interface Player {
    id: string;
    name: string;
    avatar: Avatar;
    team: Team | null;
    isHost: boolean;
    score: number;
    joinedAt: number;
    isOnline: boolean;
}

export interface GameState {
    status: GameStatus;
    // Phase 1 (MCQ) specific
    // Phase 1 (MCQ) specific
    phaseState?: PhaseState;
    currentQuestionIndex?: number; // For Phase 1
    phase1Answers?: Record<string, boolean>; // playerId -> true/false

    // Phase 2 State
    currentPhase2Set?: number;
    currentPhase2Item?: number;
    phase2Answers?: Record<string, boolean>; // playerId -> true (correct) / false (wrong)

    // Phase 3 State
    phase3MenuSelection?: {
        spicy?: number; // Index of menu chosen by Spicy
        sweet?: number; // Index of menu chosen by Sweet
    };
    phase3CompletedMenus?: number[]; // Indices of menus already played
    currentMenuTeam?: 'spicy' | 'sweet';
    currentMenuQuestionIndex?: number;
    questionStartTime?: number;
    roundWinner?: { playerId: string; name: string; team: Team } | null;

    // Phase 4 State (L'Addition)
    phase4State?: 'idle' | 'buzzed' | 'answering';
    buzzedTeam?: Team | null;
    currentPhase4QuestionIndex?: number;

    // Phase 5 State (Burger de la Mort)
    phase5State?: 'idle' | 'reading' | 'answering';
    phase5QuestionIndex?: number;
    phase5Score?: number;
}



export interface Room {
    code: string;
    hostId: string;
    players: Record<string, Player>;
    state: GameState;
    createdAt: number;
}

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
    const code = generateRoomCode();
    const roomId = code;

    // Create Host Player
    const playersRef = ref(rtdb, `rooms/${roomId}/players`);
    const newPlayerRef = push(playersRef);
    const playerId = newPlayerRef.key!;

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
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);

    const snapshot = await get(roomRef);
    if (!snapshot.exists()) {
        throw new Error('Room not found');
    }

    const room = snapshot.val() as Room;

    // Check if game has already started
    if (room.state.status !== 'lobby') {
        throw new Error('Game already started');
    }

    const playersRef = ref(rtdb, `rooms/${roomId}/players`);
    const newPlayerRef = push(playersRef);
    const playerId = newPlayerRef.key!;

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

    await set(newPlayerRef, newPlayer);
    setupDisconnectHandler(roomId, playerId);

    return { playerId };
};

export const subscribeToRoom = (code: string, callback: (room: Room | null) => void) => {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
};
const setupDisconnectHandler = (roomId: string, playerId: string) => {
    const playerOnlineRef = ref(rtdb, `rooms/${roomId}/players/${playerId}/isOnline`);
    onDisconnect(playerOnlineRef).set(false);
};

// === HOST ACTIONS ===

export const updatePlayerTeam = async (code: string, playerId: string, team: Team) => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), { team });
};

export const setGameStatus = async (code: string, status: GameState['status']) => {
    const roomId = code.toUpperCase();
    const updates: any = {};
    updates[`rooms/${roomId}/state/status`] = status;

    // Reset phase 1 state when entering it
    if (status === 'phase1') {
        updates[`rooms/${roomId}/state/currentQuestionIndex`] = 0;
        updates[`rooms/${roomId}/state/phaseState`] = 'reading';
        updates[`rooms/${roomId}/state/phase1Answers`] = {}; // Reset answers
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
            const answeringUpdates: any = {};
            answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
            answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
            await update(ref(rtdb), answeringUpdates);
        }, 3000); // 3 seconds reading time
    }
};

// === PHASE 1: SPEED MCQ LOGIC ===

export const startNextQuestion = async (code: string, nextIndex: number) => {
    const roomId = code.toUpperCase();

    // Safety check
    if (nextIndex >= QUESTIONS.length) return;

    const updates: any = {};
    updates[`rooms/${roomId}/state/currentQuestionIndex`] = nextIndex;
    updates[`rooms/${roomId}/state/phaseState`] = 'reading'; // Give players a moment to read Q
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase1Answers`] = {}; // Clear previous answers

    await update(ref(rtdb), updates);

    // Auto-switch to answering mode after 3 seconds (Reading time)
    setTimeout(async () => {
        const answeringUpdates: any = {};
        answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
        answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
        await update(ref(rtdb), answeringUpdates);
    }, 3000);
};

export const submitAnswer = async (code: string, playerId: string, answerIndex: number) => {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;
    const { state, players } = room;
    const qIndex = state.currentQuestionIndex ?? -1;
    const player = players[playerId];

    // Validation: Correct Phase, Valid Question, Valid Player
    if (state.phaseState !== 'answering' || qIndex === -1 || !player) return;

    // Start Phase 1 Logic
    const currentQuestion = QUESTIONS[qIndex];
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    const updates: any = {};

    // 1. Record Answer
    updates[`rooms/${roomId}/state/phase1Answers/${playerId}`] = isCorrect;
    if (isCorrect) {
        // Update Score
        const newScore = (player.score || 0) + 1;
        updates[`rooms/${roomId}/players/${playerId}/score`] = newScore;
    }

    // 2. Check if ALL players have answered
    const currentAnswers = state.phase1Answers || {};
    const nextAnswers = { ...currentAnswers, [playerId]: isCorrect };

    // Filter active players (online, not host)
    const activePlayers = Object.values(players).filter(p => !p.isHost && p.isOnline);
    const totalActive = activePlayers.length;
    const answeredCount = activePlayers.filter(p => p.id in nextAnswers).length;

    // If everyone answered, show result then auto-advance
    if (answeredCount >= totalActive) {
        updates[`rooms/${roomId}/state/phaseState`] = 'result';
        // Trigger auto-advance
        setTimeout(() => {
            startNextQuestion(code, qIndex + 1);
        }, 3000); // 3s delay to see result
    }

    await update(ref(rtdb), updates);
};

// --- PHASE 2 LOGIC ---

export const nextPhase2Item = async (code: string) => {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;
    if (room.state.status !== 'phase2') return;

    // Reset loop or finish? 
    // Assuming infinite loop or check length? The data is infinite logic usually for Phase 2 (Salt/Pepper list).
    // Let's just increment.

    const updates: any = {};
    updates[`rooms/${roomId}/state/roundWinner`] = null;
    updates[`rooms/${roomId}/state/phase2Answers`] = {}; // Clear previous answers

    // Increment item
    const nextIndex = (room.state.currentPhase2Item ?? 0) + 1;
    updates[`rooms/${roomId}/state/currentPhase2Item`] = nextIndex;
    updates[`rooms/${roomId}/state/phaseState`] = 'reading';

    await update(ref(rtdb), updates);
};

export const submitPhase2Answer = async (
    roomId: string,
    playerId: string,
    answer: 'A' | 'B' | 'Both',
    correctAnswer: 'A' | 'B' | 'Both'
) => {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;

    // Validation
    if (room.state.status !== 'phase2' || room.state.phaseState !== 'reading' || !room.players[playerId]) return;

    // Remove "Start Winner" block - Allow all to answer
    // if (room.state.roundWinner) return; 

    const isCorrect = answer === correctAnswer;
    const updates: any = {};

    // 1. Record that this player answered
    updates[`rooms/${roomId}/state/phase2Answers/${playerId}`] = isCorrect;

    if (isCorrect) {
        const player = room.players[playerId];
        const newScore = (player.score || 0) + 1;
        updates[`rooms/${roomId}/players/${playerId}/score`] = newScore;
    }

    // 2. Check completions
    // MOVED TO HOST CLIENT SIDE (Phase2Player.tsx) to avoid race conditions.
    // The Host will monitor the answers and trigger the transition.

    await update(ref(rtdb), updates);
};

export const endPhase2Round = async (roomCode: string) => {
    const roomId = roomCode.toUpperCase();
    const updates: any = {};
    updates[`rooms/${roomId}/state/phaseState`] = 'result';
    // Dummy winner to signal round end, though individual client checks their own answer
    updates[`rooms/${roomId}/state/roundWinner`] = {
        playerId: 'ALL',
        name: 'Round Over',
        team: 'neutral'
    };

    await update(ref(rtdb), updates);

    // Auto-Advance logic
    setTimeout(() => {
        nextPhase2Item(roomId);
    }, 2000);
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

    const room = snapshot.val() as Room;
    const currentTeam = room.state.currentMenuTeam;

    const updates: any = {};
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

    const room = snapshot.val() as Room;
    const updates: any = {};

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

// --- PHASE 4 LOGIC (L'Addition) ---

export const buzz = async (roomCode: string, team: Team) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;

    // Race condition check: If someone already buzzed, ignore
    if (room.state.buzzedTeam) return;

    await update(ref(rtdb, `rooms/${roomId}/state`), {
        buzzedTeam: team,
        phase4State: 'buzzed'
    });
};

export const resolveBuzz = async (roomCode: string, correct: boolean) => {
    const roomId = roomCode.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (!snapshot.exists()) return;
    const room = snapshot.val() as Room;

    const currentTeam = room.state.buzzedTeam;
    if (!currentTeam) return;

    if (correct) {
        // Add points to team
        await addTeamPoints(roomId, currentTeam, 3); // Phase 4 usually 3 points? Or 1? Let's say 2 for speed.
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
    const room = snapshot.val() as Room;

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
    const updates: any = {};
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
    const updates: any = {};
    updates[`rooms/${roomId}/state/phase5QuestionIndex`] = currentIndex + 1;
    if (correct) {
        updates[`rooms/${roomId}/state/phase5Score`] = increment(1);
    }
    await update(ref(rtdb), updates);
};
