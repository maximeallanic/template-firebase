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
    type Room,
    AVATAR_LIST,
    getPhaseInitialUpdates
} from './gameService';
import type { PhaseStatus } from '../types/gameTypes';

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

/**
 * Skip directly to a specific game phase
 * Initializes all required state for the target phase
 */
export async function skipToPhase(code: string, phase: PhaseStatus): Promise<void> {
    const roomId = code.toUpperCase();

    // Get phase-specific state updates from shared function
    const phaseUpdates = getPhaseInitialUpdates(roomId, phase);

    // Add the status change and clear round winner
    const updates: Record<string, unknown> = {
        [`rooms/${roomId}/state/status`]: phase,
        [`rooms/${roomId}/state/roundWinner`]: null,
        ...phaseUpdates
    };

    await update(ref(rtdb), updates);

    // Note: Phase 1 now starts directly in 'answering' state (no reading delay)
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
