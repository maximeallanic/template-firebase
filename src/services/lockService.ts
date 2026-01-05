/**
 * Firebase-based distributed lock service for question generation.
 * Replaces module-level locks that only work within a single browser tab.
 *
 * Features:
 * - Atomic lock acquisition using Firebase transactions
 * - Automatic expiration (2 minutes timeout)
 * - Owner tracking to prevent unauthorized releases
 * - Cross-tab/cross-client synchronization
 */

import { ref, runTransaction, get, update, onValue, off } from 'firebase/database';
import { rtdb } from './firebase';

// Lock timeout: 2 minutes (120,000ms)
const LOCK_TIMEOUT_MS = 2 * 60 * 1000;

/**
 * Lock structure stored in Firebase
 */
export interface GenerationLock {
    isLocked: boolean;
    ownerId: string;
    acquiredAt: number;
    expiresAt: number;
    phase: string; // Which phase is being generated
}

/**
 * Try to acquire a generation lock for a room/phase combination.
 * Uses Firebase transactions for atomic acquisition.
 *
 * @param roomCode - The room code
 * @param playerId - The player trying to acquire the lock
 * @param phase - The phase being generated (phase1, phase2, etc.)
 * @returns true if lock was acquired, false if already locked by another process
 */
export async function acquireGenerationLock(
    roomCode: string,
    playerId: string,
    phase: string
): Promise<boolean> {
    const roomId = roomCode.toUpperCase();
    const lockRef = ref(rtdb, `rooms/${roomId}/generationLock`);

    const result = await runTransaction(lockRef, (current: GenerationLock | null) => {
        const now = Date.now();

        // Case 1: No lock exists - acquire it
        if (!current) {
            return {
                isLocked: true,
                ownerId: playerId,
                acquiredAt: now,
                expiresAt: now + LOCK_TIMEOUT_MS,
                phase
            };
        }

        // Case 2: Lock exists but is expired - take over
        if (current.isLocked && now > current.expiresAt) {
            console.log('[LOCK] Taking over expired lock', {
                previousOwner: current.ownerId,
                previousPhase: current.phase,
                expiredAt: new Date(current.expiresAt).toISOString(),
                now: new Date(now).toISOString()
            });
            return {
                isLocked: true,
                ownerId: playerId,
                acquiredAt: now,
                expiresAt: now + LOCK_TIMEOUT_MS,
                phase
            };
        }

        // Case 3: Lock is not active - acquire it
        if (!current.isLocked) {
            return {
                isLocked: true,
                ownerId: playerId,
                acquiredAt: now,
                expiresAt: now + LOCK_TIMEOUT_MS,
                phase
            };
        }

        // Case 4: Lock is active and valid - abort transaction
        // Returning undefined aborts the transaction
        return undefined;
    });

    if (result.committed) {
        console.log('[LOCK] Acquired generation lock', {
            roomCode,
            playerId,
            phase,
            expiresAt: new Date(Date.now() + LOCK_TIMEOUT_MS).toISOString()
        });
    } else {
        console.log('[LOCK] Failed to acquire lock (already held)', { roomCode, phase });
    }

    return result.committed;
}

/**
 * Release a generation lock.
 * Only the lock owner can release it (security measure).
 *
 * @param roomCode - The room code
 * @param playerId - The player trying to release the lock
 * @returns true if lock was released, false if not owned by this player
 */
export async function releaseGenerationLock(
    roomCode: string,
    playerId: string
): Promise<boolean> {
    const roomId = roomCode.toUpperCase();
    const lockRef = ref(rtdb, `rooms/${roomId}/generationLock`);

    const result = await runTransaction(lockRef, (current: GenerationLock | null) => {
        // No lock exists
        if (!current || !current.isLocked) {
            return current;
        }

        // Only owner can release
        if (current.ownerId !== playerId) {
            console.warn('[LOCK] Attempted to release lock owned by another player', {
                attemptedBy: playerId,
                ownedBy: current.ownerId
            });
            return undefined; // Abort - not the owner
        }

        // Release the lock
        return {
            ...current,
            isLocked: false
        };
    });

    if (result.committed) {
        console.log('[LOCK] Released generation lock', { roomCode, playerId });
    }

    return result.committed;
}

/**
 * Force release a lock (for cleanup of stale locks).
 * Should only be called by host or during room cleanup.
 *
 * @param roomCode - The room code
 */
export async function forceReleaseLock(roomCode: string): Promise<void> {
    const roomId = roomCode.toUpperCase();
    await update(ref(rtdb), {
        [`rooms/${roomId}/generationLock/isLocked`]: false
    });
    console.log('[LOCK] Force released generation lock', { roomCode });
}

/**
 * Check if a room currently has an active (non-expired) generation lock.
 *
 * @param roomCode - The room code
 * @returns Lock info if locked, null otherwise
 */
export async function getActiveLock(roomCode: string): Promise<GenerationLock | null> {
    const roomId = roomCode.toUpperCase();
    const snapshot = await get(ref(rtdb, `rooms/${roomId}/generationLock`));

    if (!snapshot.exists()) {
        return null;
    }

    const lock = snapshot.val() as GenerationLock;
    const now = Date.now();

    // Check if lock is active and not expired
    if (lock.isLocked && now <= lock.expiresAt) {
        return lock;
    }

    return null;
}

/**
 * Check if generation is currently in progress (lock is held).
 *
 * @param roomCode - The room code
 * @returns true if generation is in progress
 */
export async function isGenerationLocked(roomCode: string): Promise<boolean> {
    const lock = await getActiveLock(roomCode);
    return lock !== null;
}

/**
 * Clean up expired locks for a room.
 * This is called automatically but can also be triggered manually.
 *
 * @param roomCode - The room code
 * @returns true if a stale lock was cleaned up
 */
export async function cleanupStaleLock(roomCode: string): Promise<boolean> {
    const roomId = roomCode.toUpperCase();
    const lockRef = ref(rtdb, `rooms/${roomId}/generationLock`);

    const result = await runTransaction(lockRef, (current: GenerationLock | null) => {
        if (!current || !current.isLocked) {
            return current;
        }

        const now = Date.now();
        if (now > current.expiresAt) {
            console.log('[LOCK] Cleaning up stale lock', {
                roomCode,
                phase: current.phase,
                ownerId: current.ownerId,
                expiredAt: new Date(current.expiresAt).toISOString(),
                age: Math.round((now - current.acquiredAt) / 1000) + 's'
            });
            return {
                ...current,
                isLocked: false
            };
        }

        return current; // Lock is still valid
    });

    return result.committed;
}

/**
 * Subscribe to lock state changes for a room.
 * Useful for updating UI when lock state changes.
 *
 * @param roomCode - The room code
 * @param callback - Called when lock state changes
 * @returns Unsubscribe function
 */
export function subscribeLockState(
    roomCode: string,
    callback: (lock: GenerationLock | null) => void
): () => void {
    const roomId = roomCode.toUpperCase();
    const lockRef = ref(rtdb, `rooms/${roomId}/generationLock`);

    const listener = onValue(lockRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(null);
            return;
        }

        const lock = snapshot.val() as GenerationLock;
        const now = Date.now();

        // Return null if lock is expired or not active
        if (!lock.isLocked || now > lock.expiresAt) {
            callback(null);
        } else {
            callback(lock);
        }
    });

    return () => off(lockRef, 'value', listener);
}

/**
 * Extend the lock timeout (for long-running generations).
 * Only the lock owner can extend.
 *
 * @param roomCode - The room code
 * @param playerId - The player extending the lock
 * @param additionalTime - Additional time in milliseconds (default: LOCK_TIMEOUT_MS)
 * @returns true if extended, false if not owner or no lock
 */
export async function extendLockTimeout(
    roomCode: string,
    playerId: string,
    additionalTime: number = LOCK_TIMEOUT_MS
): Promise<boolean> {
    const roomId = roomCode.toUpperCase();
    const lockRef = ref(rtdb, `rooms/${roomId}/generationLock`);

    const result = await runTransaction(lockRef, (current: GenerationLock | null) => {
        if (!current || !current.isLocked) {
            return current;
        }

        if (current.ownerId !== playerId) {
            return undefined; // Not owner, abort
        }

        const now = Date.now();
        return {
            ...current,
            expiresAt: now + additionalTime
        };
    });

    return result.committed;
}
