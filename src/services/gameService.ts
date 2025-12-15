import { ref, set, get, update, onValue, push, child, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from './firebase';

// Types
export type Avatar = 'donut' | 'pizza' | 'taco' | 'sushi' | 'chili' | 'cookie' | 'icecream' | 'fries';
export type Team = 'spicy' | 'sweet' | null;

export interface Player {
    id: string;
    name: string;
    avatar: Avatar;
    team: Team;
    isHost: boolean;
    score: number;
    joinedAt: number;
    isOnline: boolean;
}

export interface GameState {
    status: 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'finale' | 'finished';
    phaseData?: any; // To hold questions, current question index, etc.
    currentQuestionId?: string;
    scores: {
        spicy: number;
        sweet: number;
    }
}

export interface Room {
    code: string;
    hostId: string;
    players: Record<string, Player>;
    state: GameState;
    createdAt: number;
}

// Utils
const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Service Functions

export const createRoom = async (hostName: string): Promise<{ code: string; playerId: string }> => {
    const code = generateRoomCode();
    const roomId = code; // Use code as ID for simplicity
    const playersRef = ref(rtdb, `rooms/${roomId}/players`);

    const newPlayerRef = push(playersRef);
    const playerId = newPlayerRef.key!;

    const hostPlayer: Player = {
        id: playerId,
        name: hostName,
        avatar: 'chili', // Default host avatar
        team: null,
        isHost: true,
        score: 0,
        joinedAt: Date.now(),
        isOnline: true
    };

    const initialGameState: GameState = {
        status: 'lobby',
        scores: { spicy: 0, sweet: 0 }
    };

    const roomData: Room = {
        code,
        hostId: playerId,
        players: { [playerId]: hostPlayer },
        state: initialGameState,
        createdAt: Date.now()
    };

    await set(ref(rtdb, `rooms/${roomId}`), roomData);

    // Set up disconnect handler
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

    const playersRef = ref(rtdb, `rooms/${roomId}/players`);
    const newPlayerRef = push(playersRef);
    const playerId = newPlayerRef.key!;

    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        avatar,
        team: null, // To be assigned by host or auto
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
        const data = snapshot.val();
        callback(data);
    });
};

export const updatePlayerTeam = async (code: string, playerId: string, team: Team) => {
    const roomId = code.toUpperCase();
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${playerId}`);
    await update(playerRef, { team });
}

export const setGameStatus = async (code: string, status: GameState['status']) => {
    const roomId = code.toUpperCase();
    const stateRef = ref(rtdb, `rooms/${roomId}/state`);
    await update(stateRef, { status });
}

const setupDisconnectHandler = (roomId: string, playerId: string) => {
    const playerOnlineRef = ref(rtdb, `rooms/${roomId}/players/${playerId}/isOnline`);
    onDisconnect(playerOnlineRef).set(false);
};
