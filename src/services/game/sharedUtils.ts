/**
 * Shared utility functions for game services
 */

import { ref, get, update } from 'firebase/database';
import { rtdb } from '../firebase';
import { validateRoom } from './roomService';
import type { Team, Player } from '../../types/gameTypes';

/**
 * Add points to all players of a team
 * @param roomCode - Room code
 * @param team - Team to award points to
 * @param points - Number of points to add
 */
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

// ============================================================================
// PLAYER READINESS SYSTEM
// ============================================================================

/**
 * Mark a player as ready for the current phase (clicked "Understood" on intro screen)
 * @param roomCode - Room code
 * @param playerId - Player ID
 */
export const markPlayerReady = async (roomCode: string, playerId: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();
    await update(ref(rtdb), {
        [`rooms/${roomId}/state/playersReady/${playerId}`]: true,
    });
};

/**
 * Clear all player readiness (called when transitioning to a new phase)
 * @param roomCode - Room code
 */
export const clearPlayersReady = async (roomCode: string): Promise<void> => {
    const roomId = roomCode.toUpperCase();
    await update(ref(rtdb), {
        [`rooms/${roomId}/state/playersReady`]: null,
    });
};

/**
 * Check if all online players are ready
 * @param players - Record of players in the room
 * @param playersReady - Record of ready players
 * @returns True if all online (non-mock) players are ready
 */
export function areAllPlayersReady(
    players: Record<string, Player>,
    playersReady: Record<string, boolean> | undefined
): boolean {
    if (!playersReady) return false;

    // Get all online, non-mock players
    const onlineRealPlayers = Object.values(players).filter(
        p => p.isOnline && !p.id.startsWith('mock_')
    );

    // Check if all of them are in playersReady with value true
    return onlineRealPlayers.every(player => playersReady[player.id] === true);
}

/**
 * Count how many players are ready vs total online players
 * @param players - Record of players in the room
 * @param playersReady - Record of ready players
 * @returns Object with ready count and total count
 */
export function getReadinessCount(
    players: Record<string, Player>,
    playersReady: Record<string, boolean> | undefined
): { ready: number; total: number } {
    const onlineRealPlayers = Object.values(players).filter(
        p => p.isOnline && !p.id.startsWith('mock_')
    );

    const readyCount = playersReady
        ? onlineRealPlayers.filter(p => playersReady[p.id] === true).length
        : 0;

    return { ready: readyCount, total: onlineRealPlayers.length };
}
