/**
 * Score Storage Service
 * Persists final game scores to localStorage to handle refresh scenarios
 * on the victory screen where Firebase data might not be loaded yet.
 */

import { safeStorage } from '../utils/storage';
import type { Player, Team } from '../types/gameTypes';

const SCORES_STORAGE_KEY = 'spicy_final_scores';

interface StoredScores {
    roomCode: string;
    timestamp: number;
    spicyScore: number;
    sweetScore: number;
    winnerTeam: Team | 'tie';
    players: Array<{
        id: string;
        name: string;
        team: Team | null;
        score: number;
        avatar: string;
    }>;
}

/**
 * Save final scores when game reaches victory state.
 * Called when victory screen is displayed.
 */
export function saveFinalScores(
    roomCode: string,
    players: Record<string, Player>,
    winnerTeam: Team | 'tie'
): void {
    const playersList = Object.values(players);

    const spicyScore = playersList
        .filter(p => p.team === 'spicy')
        .reduce((sum, p) => sum + (p.score || 0), 0);

    const sweetScore = playersList
        .filter(p => p.team === 'sweet')
        .reduce((sum, p) => sum + (p.score || 0), 0);

    const storedScores: StoredScores = {
        roomCode: roomCode.toUpperCase(),
        timestamp: Date.now(),
        spicyScore,
        sweetScore,
        winnerTeam,
        players: playersList.map(p => ({
            id: p.id,
            name: p.name,
            team: p.team,
            score: p.score || 0,
            avatar: p.avatar,
        })),
    };

    safeStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(storedScores));
}

/**
 * Get stored final scores for a room.
 * Returns null if no scores are stored or if they're for a different room.
 * Scores are valid for 1 hour (to handle page refreshes but not stale data).
 */
export function getStoredScores(roomCode: string): StoredScores | null {
    try {
        const stored = safeStorage.getItem(SCORES_STORAGE_KEY);
        if (!stored) return null;

        const scores: StoredScores = JSON.parse(stored);

        // Check if scores are for this room
        if (scores.roomCode !== roomCode.toUpperCase()) {
            return null;
        }

        // Check if scores are still valid (1 hour expiry)
        const ONE_HOUR = 60 * 60 * 1000;
        if (Date.now() - scores.timestamp > ONE_HOUR) {
            clearStoredScores();
            return null;
        }

        return scores;
    } catch {
        return null;
    }
}

/**
 * Clear stored scores (called when starting a new game).
 */
export function clearStoredScores(): void {
    safeStorage.removeItem(SCORES_STORAGE_KEY);
}

/**
 * Merge Firebase players with stored scores as fallback.
 * If Firebase players have scores, use them. Otherwise, use stored scores.
 * This handles the case where page is refreshed before Firebase data loads.
 */
export function getPlayersWithFallbackScores(
    roomCode: string,
    firebasePlayers: Record<string, Player>
): Record<string, Player> {
    const playersList = Object.values(firebasePlayers);

    // Check if Firebase already has scores (any non-zero score means data is loaded)
    const hasFirebaseScores = playersList.some(p => (p.score || 0) > 0);
    if (hasFirebaseScores) {
        return firebasePlayers;
    }

    // Try to get stored scores as fallback
    const storedScores = getStoredScores(roomCode);
    if (!storedScores) {
        return firebasePlayers;
    }

    // Merge stored scores into Firebase players
    const mergedPlayers: Record<string, Player> = {};

    for (const [playerId, player] of Object.entries(firebasePlayers)) {
        const storedPlayer = storedScores.players.find(p => p.id === playerId);
        mergedPlayers[playerId] = {
            ...player,
            score: storedPlayer?.score ?? player.score ?? 0,
        };
    }

    return mergedPlayers;
}
