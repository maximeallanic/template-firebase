import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToRoom, type Room, type Avatar, markPlayerOnline } from '../services/gameService';
import { safeStorage } from '../utils/storage';

interface UseGameRoomOptions {
    roomId: string | undefined;
    debugPlayerId?: string | null;
}

interface UseGameRoomReturn {
    room: Room | null;
    myId: string | null;
    isHost: boolean;
    currentPlayer: Room['players'][string] | null;
    isLoading: boolean;
    isSpectator: boolean;
    handleProfileUpdate: (newName: string, newAvatar: Avatar) => void;
}

/**
 * Hook for managing game room subscription, player identity, and reconnection
 */
export function useGameRoom({ roomId, debugPlayerId }: UseGameRoomOptions): UseGameRoomReturn {
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [myId, setMyId] = useState<string | null>(null);
    const hasMarkedOnline = useRef(false);

    // Subscribe to room updates
    useEffect(() => {
        // Get player ID from storage or debug param
        const storedId = debugPlayerId || safeStorage.getItem('spicy_player_id');
        setMyId(storedId);

        if (!roomId) return;

        const unsubscribe = subscribeToRoom(roomId, (data) => {
            setRoom(data);

            // Handle deep linking / auth logic
            if (data) {
                const localId = debugPlayerId || safeStorage.getItem('spicy_player_id');
                const isPlayerInRoom = localId && data.players && data.players[localId];

                if (isPlayerInRoom) {
                    // Player is in the room - mark them as online (handles reconnection)
                    if (!hasMarkedOnline.current && localId) {
                        hasMarkedOnline.current = true;
                        markPlayerOnline(data.code, localId);
                    }
                } else {
                    // User is NOT a recognized player
                    // Case A: Game is in Lobby -> Redirect to Join
                    if (data.state.status === 'lobby') {
                        setTimeout(() => {
                            const currentId = debugPlayerId || safeStorage.getItem('spicy_player_id');
                            if (!currentId || !data.players[currentId]) {
                                const debugSuffix = debugPlayerId ? `&debugPlayerId=${debugPlayerId}` : '';
                                navigate(`/?code=${data.code}${debugSuffix ? `&${debugSuffix.slice(1)}` : ''}`);
                            }
                        }, 500);
                    }
                    // Case B: Game Started -> Stay as Spectator
                }
            }
        });

        return () => unsubscribe();
    }, [roomId, navigate, debugPlayerId]);

    // Computed values
    const isHost = !!(room?.hostId && myId && room.hostId === myId);
    const currentPlayer = room?.players && myId ? room.players[myId] : null;
    const isLoading = room === null;
    const isSpectator = !myId && room !== null && room.state.status !== 'lobby';

    // Handler for profile update
    const handleProfileUpdate = useCallback((newName: string, newAvatar: Avatar) => {
        console.log(`Profile updated: ${newName}, ${newAvatar}`);
    }, []);

    return {
        room,
        myId,
        isHost,
        currentPlayer,
        isLoading,
        isSpectator,
        handleProfileUpdate
    };
}
