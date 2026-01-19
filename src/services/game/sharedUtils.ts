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
