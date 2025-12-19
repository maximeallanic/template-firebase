/**
 * Cursor Service
 * Handles real-time cursor position sharing between teammates
 * Path: cursors/{roomCode}/{playerId}
 */

import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
import { rtdb } from './firebase';
import type { CursorPosition, CursorTargetElement } from '../types/cursorTypes';

/**
 * Update own cursor position in Firebase
 * @param roomCode - The room code
 * @param playerId - The player's ID
 * @param position - Normalized position (0-1), touch flag, and optional target element
 */
export async function updateCursorPosition(
    roomCode: string,
    playerId: string,
    position: { x: number; y: number; isTouch: boolean; targetElement?: CursorTargetElement }
): Promise<void> {
    const path = `cursors/${roomCode.toUpperCase()}/${playerId}`;
    const cursorRef = ref(rtdb, path);

    const cursorData: CursorPosition = {
        x: position.x,
        y: position.y,
        isTouch: position.isTouch,
        timestamp: Date.now(),
    };

    // Add target element if provided (for element-based positioning)
    if (position.targetElement) {
        cursorData.targetElement = position.targetElement;
    }

    await set(cursorRef, cursorData);
}

/**
 * Record an interaction (click/tap) at current position
 * @param roomCode - The room code
 * @param playerId - The player's ID
 * @param position - Normalized position (0-1) with optional target element
 * @param type - Interaction type ('click' or 'tap')
 */
export async function recordInteraction(
    roomCode: string,
    playerId: string,
    position: { x: number; y: number; isTouch: boolean; targetElement?: CursorTargetElement },
    type: 'click' | 'tap'
): Promise<void> {
    const cursorRef = ref(rtdb, `cursors/${roomCode.toUpperCase()}/${playerId}`);

    const cursorData: CursorPosition = {
        x: position.x,
        y: position.y,
        isTouch: position.isTouch,
        timestamp: Date.now(),
        interaction: {
            type,
            startTime: Date.now(),
        },
    };

    if (position.targetElement) {
        cursorData.targetElement = position.targetElement;
    }

    await set(cursorRef, cursorData);
}

/**
 * Clear the interaction flag after ripple animation completes
 * @param roomCode - The room code
 * @param playerId - The player's ID
 * @param position - Current position to maintain with optional target element
 */
export async function clearInteraction(
    roomCode: string,
    playerId: string,
    position: { x: number; y: number; isTouch: boolean; targetElement?: CursorTargetElement }
): Promise<void> {
    const cursorRef = ref(rtdb, `cursors/${roomCode.toUpperCase()}/${playerId}`);

    const cursorData: CursorPosition = {
        x: position.x,
        y: position.y,
        isTouch: position.isTouch,
        timestamp: Date.now(),
        // No interaction field = cleared
    };

    if (position.targetElement) {
        cursorData.targetElement = position.targetElement;
    }

    await set(cursorRef, cursorData);
}

/**
 * Subscribe to all cursors in a room
 * @param roomCode - The room code
 * @param callback - Callback receiving cursor updates
 * @returns Unsubscribe function
 */
export function subscribeToCursors(
    roomCode: string,
    callback: (cursors: Record<string, CursorPosition>) => void
): () => void {
    const cursorsRef = ref(rtdb, `cursors/${roomCode.toUpperCase()}`);

    const unsubscribe = onValue(cursorsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as Record<string, CursorPosition>);
        } else {
            callback({});
        }
    });

    return unsubscribe;
}

/**
 * Set up disconnect handler to remove cursor when player disconnects
 * @param roomCode - The room code
 * @param playerId - The player's ID
 */
export function setupCursorDisconnect(roomCode: string, playerId: string): void {
    const cursorRef = ref(rtdb, `cursors/${roomCode.toUpperCase()}/${playerId}`);
    onDisconnect(cursorRef).remove();
}

/**
 * Remove cursor data when leaving room or changing phase
 * @param roomCode - The room code
 * @param playerId - The player's ID
 */
export async function removeCursor(roomCode: string, playerId: string): Promise<void> {
    const cursorRef = ref(rtdb, `cursors/${roomCode.toUpperCase()}/${playerId}`);
    await remove(cursorRef);
}

/**
 * Check if a cursor is stale (older than threshold)
 * @param cursor - The cursor position data
 * @param maxAgeMs - Maximum age in milliseconds (default 3000ms)
 * @returns True if cursor is stale
 */
export function isCursorStale(cursor: CursorPosition, maxAgeMs: number = 3000): boolean {
    return Date.now() - cursor.timestamp > maxAgeMs;
}
