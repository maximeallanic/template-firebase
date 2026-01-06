/**
 * Room management service
 * Handles room lifecycle, player management, and disconnection handling
 */

import { ref, set, get, update, onValue, onDisconnect, remove } from 'firebase/database';
import { rtdb, auth, getUserSubscriptionDirect } from '../firebase';
import i18n from 'i18next';
import type {
    Avatar, Team, Player, GameState, Room, Difficulty
} from '../../types/gameTypes';
import {
    type GameLanguage,
    DEFAULT_GAME_LANGUAGE,
    toGameLanguage
} from '../../types/languageTypes';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current authenticated user ID
 * Throws if not authenticated
 */
export function getAuthUserId(): string {
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
export function validateRoom(data: unknown): Room {
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

/**
 * Generate a random 4-character room code
 * Excludes confusing characters like 0/O, 1/I/L
 */
const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Setup disconnect handler to mark player offline when they disconnect
 */
const setupDisconnectHandler = (roomId: string, playerId: string): void => {
    const playerOnlineRef = ref(rtdb, `rooms/${roomId}/players/${playerId}/isOnline`);
    onDisconnect(playerOnlineRef).set(false);
};

// ============================================================================
// ROOM LIFECYCLE
// ============================================================================

/**
 * Create a new game room
 * @param hostName - Display name for the host
 * @param avatar - Avatar selection for the host
 * @returns Room code and player ID
 */
export const createRoom = async (hostName: string, avatar: Avatar): Promise<{ code: string; playerId: string }> => {
    // Use Firebase Auth UID as player ID for security
    const playerId = getAuthUserId();

    // NOTE: We no longer clear question history on room creation
    // The history is used to filter out already-seen questions during generation
    // Clearing it here would defeat the purpose of the deduplication system

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

    // Get current language from i18next
    const playerLanguage = toGameLanguage(i18n.language);

    const hostPlayer: Player = {
        id: playerId,
        name: hostName,
        avatar: avatar,
        team: null,
        isHost: true,
        score: 0,
        joinedAt: Date.now(),
        isOnline: true,
        language: playerLanguage
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

/**
 * Join an existing game room
 * @param code - Room code to join
 * @param playerName - Display name for the player
 * @param avatar - Avatar selection
 * @returns Player ID or null if join failed
 */
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

    // Get current language from i18next
    const playerLanguage = toGameLanguage(i18n.language);

    // Check if player already exists in room (reconnection scenario)
    if (room.players && room.players[playerId]) {
        // Player is reconnecting - update their info and mark online
        await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), {
            name: playerName,
            avatar,
            isOnline: true,
            language: playerLanguage
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
        isOnline: true,
        language: playerLanguage
    };

    await set(playerRef, newPlayer);
    setupDisconnectHandler(roomId, playerId);

    return { playerId };
};

/**
 * Subscribe to room updates
 * @param code - Room code
 * @param callback - Callback function when room data changes
 * @returns Unsubscribe function
 */
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

/**
 * Leave room (remove player from room without logging out)
 */
export const leaveRoom = async (code: string, playerId: string): Promise<void> => {
    const roomId = code.toUpperCase();
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${playerId}`);
    await remove(playerRef);
};

/**
 * Mark player as online (for reconnection scenarios)
 */
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

// ============================================================================
// PLAYER MANAGEMENT
// ============================================================================

/**
 * Update a player's team assignment
 */
export const updatePlayerTeam = async (code: string, playerId: string, team: Team): Promise<void> => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), { team });
};

/**
 * Update a player's profile (name and avatar)
 */
export const updatePlayerProfile = async (code: string, playerId: string, name: string, avatar: Avatar): Promise<void> => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}/players/${playerId}`), { name, avatar });
};

/**
 * Update room difficulty setting (host only action)
 * @param code - Room code
 * @param difficulty - The difficulty level to set
 */
export const updateRoomDifficulty = async (code: string, difficulty: Difficulty): Promise<void> => {
    const roomId = code.toUpperCase();
    await update(ref(rtdb, `rooms/${roomId}`), {
        'gameOptions/difficulty': difficulty
    });
};

/**
 * Get current room difficulty (defaults to 'normal' if not set)
 * @param room - The room object
 * @returns The difficulty level
 */
export const getRoomDifficulty = (room: Room | null): Difficulty => {
    return room?.gameOptions?.difficulty ?? 'normal';
};

// ============================================================================
// LANGUAGE MANAGEMENT
// ============================================================================

/**
 * Calculate the room language based on players or host override.
 * Priority:
 * 1. If host forced a language -> use it
 * 2. If all players have the same language -> use it
 * 3. Otherwise -> default to English
 *
 * @param room - The room object
 * @returns The language to use for AI question generation
 */
export const getRoomLanguage = (room: Room | null): GameLanguage => {
    if (!room) return DEFAULT_GAME_LANGUAGE;

    // 1. Host override takes priority
    if (room.gameOptions?.forcedLanguage) {
        return room.gameOptions.forcedLanguage;
    }

    // 2. Check player languages (exclude mock players and offline players)
    const realPlayers = Object.values(room.players || {})
        .filter(p => p.isOnline && !p.id.startsWith('mock_'));

    if (realPlayers.length === 0) return DEFAULT_GAME_LANGUAGE;

    // Get unique languages (default to 'en' if player has no language set)
    const languages = new Set(
        realPlayers.map(p => p.language || DEFAULT_GAME_LANGUAGE)
    );

    // 3. If all players have the same language, use it
    if (languages.size === 1) {
        return Array.from(languages)[0];
    }

    // 4. Mixed languages - default to English
    return DEFAULT_GAME_LANGUAGE;
};

/**
 * Check if all players in the room have the same language.
 * Useful to show UI hints about language selection.
 *
 * @param room - The room object
 * @returns Object with isUnanimous flag and the unanimous language (if any)
 */
export const getRoomLanguageInfo = (room: Room | null): {
    isUnanimous: boolean;
    unanimousLanguage: GameLanguage | null;
    forcedLanguage: GameLanguage | null;
    effectiveLanguage: GameLanguage;
} => {
    const effectiveLanguage = getRoomLanguage(room);
    const forcedLanguage = room?.gameOptions?.forcedLanguage || null;

    if (!room || !room.players) {
        return {
            isUnanimous: true,
            unanimousLanguage: DEFAULT_GAME_LANGUAGE,
            forcedLanguage,
            effectiveLanguage
        };
    }

    const realPlayers = Object.values(room.players)
        .filter(p => p.isOnline && !p.id.startsWith('mock_'));

    if (realPlayers.length === 0) {
        return {
            isUnanimous: true,
            unanimousLanguage: DEFAULT_GAME_LANGUAGE,
            forcedLanguage,
            effectiveLanguage
        };
    }

    const languages = new Set(
        realPlayers.map(p => p.language || DEFAULT_GAME_LANGUAGE)
    );

    if (languages.size === 1) {
        return {
            isUnanimous: true,
            unanimousLanguage: Array.from(languages)[0],
            forcedLanguage,
            effectiveLanguage
        };
    }

    return {
        isUnanimous: false,
        unanimousLanguage: null,
        forcedLanguage,
        effectiveLanguage
    };
};

/**
 * Update room's forced language (host only action).
 * Set to null to use automatic language detection.
 *
 * @param code - Room code
 * @param language - Language to force, or null for auto-detection
 */
export const updateRoomForcedLanguage = async (
    code: string,
    language: GameLanguage | null
): Promise<void> => {
    const roomId = code.toUpperCase();
    if (language) {
        await update(ref(rtdb, `rooms/${roomId}`), {
            'gameOptions/forcedLanguage': language
        });
    } else {
        // Remove override (use auto-detection)
        await update(ref(rtdb, `rooms/${roomId}/gameOptions`), {
            forcedLanguage: null
        });
    }
};
