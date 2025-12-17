/**
 * Debug utilities for single-window game testing
 * Only active in development mode (import.meta.env.DEV)
 */

import { ref, set, get, update } from 'firebase/database';
import { rtdb } from './firebase';
import {
    type Player,
    type Team,
    type Avatar,
    type GameState,
    type Room,
    AVATAR_LIST
} from './gameService';

// ==================== MOCK PLAYERS ====================

const MOCK_NAMES_SPICY = [
    'Chef Pepper',
    'Captain Jalapeno',
    'Baron Wasabi',
    'Madame Curry',
    'Sir Sriracha',
    'Duke Tabasco'
];

const MOCK_NAMES_SWEET = [
    'Princess Honey',
    'Sir Caramel',
    'Lady Vanilla',
    'Duke Chocolate',
    'Countess Sugar',
    'Baron Maple'
];

let mockPlayerCounter = 0;

/**
 * Generate a mock player with a unique ID and food-themed name
 */
export function generateMockPlayer(team: Team): Player {
    mockPlayerCounter++;
    const names = team === 'spicy' ? MOCK_NAMES_SPICY : MOCK_NAMES_SWEET;
    const nameIndex = (mockPlayerCounter - 1) % names.length;
    const avatarIndex = (mockPlayerCounter - 1) % AVATAR_LIST.length;

    return {
        id: `mock_${mockPlayerCounter.toString().padStart(3, '0')}`,
        name: names[nameIndex],
        avatar: AVATAR_LIST[avatarIndex] as Avatar,
        team,
        isHost: false,
        score: 0,
        joinedAt: Date.now(),
        isOnline: true
    };
}

/**
 * Add a mock player to the room
 */
export async function addMockPlayer(code: string, team: Team): Promise<string> {
    const roomId = code.toUpperCase();
    const player = generateMockPlayer(team);

    await set(ref(rtdb, `rooms/${roomId}/players/${player.id}`), player);

    return player.id;
}

/**
 * Remove all mock players from the room
 */
export async function clearMockPlayers(code: string): Promise<number> {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) return 0;

    const room = snapshot.val() as Room;
    const mockPlayerIds = Object.keys(room.players || {}).filter(id => id.startsWith('mock_'));

    const updates: Record<string, null> = {};
    mockPlayerIds.forEach(id => {
        updates[`rooms/${roomId}/players/${id}`] = null;
    });

    if (mockPlayerIds.length > 0) {
        await update(ref(rtdb), updates);
    }

    return mockPlayerIds.length;
}

/**
 * Count mock players in a room by team
 */
export function countMockPlayers(room: Room | null): { total: number; spicy: number; sweet: number } {
    if (!room?.players) return { total: 0, spicy: 0, sweet: 0 };

    const mockPlayers = Object.values(room.players).filter(p => p.id.startsWith('mock_'));

    return {
        total: mockPlayers.length,
        spicy: mockPlayers.filter(p => p.team === 'spicy').length,
        sweet: mockPlayers.filter(p => p.team === 'sweet').length
    };
}

// ==================== PHASE SKIP ====================

type PhaseStatus = GameState['status'];

/**
 * Skip directly to a specific game phase
 * Initializes all required state for the target phase
 */
export async function skipToPhase(code: string, phase: PhaseStatus): Promise<void> {
    const roomId = code.toUpperCase();
    const updates: Record<string, unknown> = {};

    // Set base status
    updates[`rooms/${roomId}/state/status`] = phase;

    // Clear common state
    updates[`rooms/${roomId}/state/roundWinner`] = null;

    // Initialize phase-specific state
    switch (phase) {
        case 'lobby':
            updates[`rooms/${roomId}/state/phaseState`] = 'idle';
            // Clear all phase-specific state
            updates[`rooms/${roomId}/state/currentQuestionIndex`] = null;
            updates[`rooms/${roomId}/state/phase1Answers`] = null;
            updates[`rooms/${roomId}/state/phase1BlockedTeams`] = null;
            updates[`rooms/${roomId}/state/currentPhase2Set`] = null;
            updates[`rooms/${roomId}/state/currentPhase2Item`] = null;
            updates[`rooms/${roomId}/state/phase2Answers`] = null;
            updates[`rooms/${roomId}/state/phase3MenuSelection`] = null;
            updates[`rooms/${roomId}/state/phase3CompletedMenus`] = null;
            updates[`rooms/${roomId}/state/currentMenuTeam`] = null;
            updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = null;
            updates[`rooms/${roomId}/state/buzzedTeam`] = null;
            updates[`rooms/${roomId}/state/phase5State`] = null;
            updates[`rooms/${roomId}/state/phase5QuestionIndex`] = null;
            updates[`rooms/${roomId}/state/phase5Score`] = null;
            break;

        case 'phase1':
            updates[`rooms/${roomId}/state/currentQuestionIndex`] = 0;
            updates[`rooms/${roomId}/state/phaseState`] = 'reading';
            updates[`rooms/${roomId}/state/phase1Answers`] = {};
            updates[`rooms/${roomId}/state/phase1BlockedTeams`] = [];
            updates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
            break;

        case 'phase2':
            updates[`rooms/${roomId}/state/currentPhase2Set`] = 0;
            updates[`rooms/${roomId}/state/currentPhase2Item`] = 0;
            updates[`rooms/${roomId}/state/phaseState`] = 'reading';
            updates[`rooms/${roomId}/state/phase2Answers`] = {};
            break;

        case 'phase3':
            updates[`rooms/${roomId}/state/phaseState`] = 'menu_selection';
            updates[`rooms/${roomId}/state/phase3MenuSelection`] = {};
            updates[`rooms/${roomId}/state/phase3CompletedMenus`] = [];
            updates[`rooms/${roomId}/state/currentMenuTeam`] = 'spicy';
            updates[`rooms/${roomId}/state/currentMenuQuestionIndex`] = 0;
            break;

        case 'phase4':
            updates[`rooms/${roomId}/state/phaseState`] = 'idle';
            updates[`rooms/${roomId}/state/currentPhase4QuestionIndex`] = 0;
            updates[`rooms/${roomId}/state/buzzedTeam`] = null;
            updates[`rooms/${roomId}/state/phase4State`] = 'idle';
            break;

        case 'phase5':
            updates[`rooms/${roomId}/state/phase5State`] = 'idle';
            updates[`rooms/${roomId}/state/phase5QuestionIndex`] = 0;
            updates[`rooms/${roomId}/state/phase5Score`] = 0;
            updates[`rooms/${roomId}/state/phaseState`] = 'idle';
            break;
    }

    await update(ref(rtdb), updates);

    // For phase1, auto-transition to answering after reading delay
    if (phase === 'phase1') {
        setTimeout(async () => {
            const answeringUpdates: Record<string, unknown> = {};
            answeringUpdates[`rooms/${roomId}/state/phaseState`] = 'answering';
            answeringUpdates[`rooms/${roomId}/state/questionStartTime`] = Date.now();
            await update(ref(rtdb), answeringUpdates);
        }, 3000);
    }
}

/**
 * Reset all player scores to 0
 */
export async function resetAllScores(code: string): Promise<void> {
    const roomId = code.toUpperCase();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) return;

    const room = snapshot.val() as Room;
    const updates: Record<string, number> = {};

    Object.keys(room.players || {}).forEach(playerId => {
        updates[`rooms/${roomId}/players/${playerId}/score`] = 0;
    });

    if (Object.keys(updates).length > 0) {
        await update(ref(rtdb), updates);
    }
}
