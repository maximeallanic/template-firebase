/**
 * Hook for tracking and sharing teammate cursors
 * Handles mouse/touch position broadcasting and subscribing to teammates
 * Uses element-based positioning for consistent cursor display across screen sizes
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    updateCursorPosition,
    recordInteraction,
    clearInteraction,
    subscribeToCursors,
    setupCursorDisconnect,
    removeCursor,
    isCursorStale,
} from '../services/cursorService';
import type {
    UseTeammateCursorsOptions,
    UseTeammateCursorsReturn,
    TeammateCursor,
    CursorPosition,
    CursorTargetElement,
} from '../types/cursorTypes';
import type { Team } from '../types/gameTypes';

// Throttle interval in milliseconds (100ms = very responsive)
const THROTTLE_MS = 100;

// Stale cursor threshold in milliseconds (must be > THROTTLE_MS * 2)
const STALE_THRESHOLD_MS = 6000;

// Ripple animation duration in milliseconds
const RIPPLE_DURATION_MS = 400;

// Selector for the game container
const CONTAINER_SELECTOR = '[data-cursor-container]';

// Selector for cursor target elements
const TARGET_SELECTOR = '[data-cursor-target]';

/**
 * Detect the target element under the cursor
 * @returns Target element info or null if no target element found
 */
function detectTargetElement(clientX: number, clientY: number): CursorTargetElement | null {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;

    // Find the closest parent with data-cursor-target attribute
    const targetElement = element.closest(TARGET_SELECTOR) as HTMLElement | null;
    if (!targetElement) return null;

    const targetId = targetElement.getAttribute('data-cursor-target');
    if (!targetId) return null;

    // Calculate relative position within the element
    const rect = targetElement.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;

    return {
        id: targetId,
        relativeX: Math.max(0, Math.min(1, relativeX)),
        relativeY: Math.max(0, Math.min(1, relativeY)),
    };
}

/**
 * Resolve cursor position from target element (priority) or fallback to normalized coordinates
 * @returns Screen position in pixels
 */
function resolveTargetPosition(cursor: CursorPosition): { x: number; y: number } {
    // Priority 1: Element-based positioning
    if (cursor.targetElement?.id) {
        const element = document.querySelector(`[data-cursor-target="${cursor.targetElement.id}"]`) as HTMLElement | null;
        if (element) {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left + cursor.targetElement.relativeX * rect.width,
                y: rect.top + cursor.targetElement.relativeY * rect.height,
            };
        }
    }

    // Priority 2: Fallback to normalized container coordinates
    return denormalizePosition(cursor.x, cursor.y);
}

/**
 * Throttle function that always uses the LATEST arguments for trailing calls
 * This ensures the final position is always sent, even during rapid movement
 */
function throttle<Args extends unknown[]>(
    fn: (...args: Args) => void,
    delay: number
): (...args: Args) => void {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let latestArgs: Args | null = null;

    return (...args: Args) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        // Always store the latest arguments
        latestArgs = args;

        if (timeSinceLastCall >= delay) {
            lastCall = now;
            fn(...args);
            latestArgs = null;
        } else if (!timeoutId) {
            // Schedule a trailing call that uses the LATEST args (not the captured ones)
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                timeoutId = null;
                if (latestArgs) {
                    fn(...latestArgs);
                    latestArgs = null;
                }
            }, delay - timeSinceLastCall);
        }
    };
}

/**
 * Detect if device supports touch
 */
function isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get the game container element
 */
function getContainer(): HTMLElement | null {
    return document.querySelector(CONTAINER_SELECTOR);
}

/**
 * Normalize coordinates to 0-1 range relative to the game container
 * Falls back to viewport if container not found
 */
function normalizePosition(clientX: number, clientY: number): { x: number; y: number } {
    const container = getContainer();

    if (container) {
        const rect = container.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    }

    // Fallback to viewport
    return {
        x: clientX / window.innerWidth,
        y: clientY / window.innerHeight,
    };
}

/**
 * Convert normalized coordinates back to screen pixels relative to container
 * Falls back to viewport if container not found
 */
function denormalizePosition(x: number, y: number): { x: number; y: number } {
    const container = getContainer();

    if (container) {
        const rect = container.getBoundingClientRect();
        return {
            x: rect.left + x * rect.width,
            y: rect.top + y * rect.height,
        };
    }

    // Fallback to viewport
    return {
        x: x * window.innerWidth,
        y: y * window.innerHeight,
    };
}

export function useTeammateCursors(options: UseTeammateCursorsOptions): UseTeammateCursorsReturn {
    const { roomCode, playerId, myTeam, players, enabled } = options;

    // State for teammate cursors
    const [rawCursors, setRawCursors] = useState<Record<string, CursorPosition>>({});

    // Force re-render when window resizes to update cursor positions
    const [, setWindowSize] = useState({ w: 0, h: 0 });

    // Track current position for interaction clearing
    const currentPositionRef = useRef<{ x: number; y: number; isTouch: boolean; targetElement?: CursorTargetElement }>({
        x: 0.5,
        y: 0.5,
        isTouch: isTouchDevice(),
    });

    // Track if disconnect handler is set up
    const disconnectSetupRef = useRef(false);

    // Note: We no longer use device-based touch detection
    // Instead, we listen to both mouse and touch events and detect the type from the actual event

    // Handle window resize to recalculate cursor positions
    useEffect(() => {
        if (!enabled) return;

        const handleResize = () => {
            setWindowSize({ w: window.innerWidth, h: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [enabled]);

    // Throttled position update function
    // Includes target element detection for element-based positioning
    const throttledUpdatePosition = useMemo(
        () =>
            throttle((x: number, y: number, isTouchEvent: boolean, targetElement?: CursorTargetElement) => {
                if (!enabled || !playerId || !roomCode) return;

                currentPositionRef.current = { x, y, isTouch: isTouchEvent, targetElement };
                updateCursorPosition(roomCode, playerId, { x, y, isTouch: isTouchEvent, targetElement }).catch((err) => {
                    console.warn('Failed to update cursor position:', err);
                });
            }, THROTTLE_MS),
        [enabled, playerId, roomCode]
    );

    // Handle mouse move
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            const { x, y } = normalizePosition(e.clientX, e.clientY);
            const targetElement = detectTargetElement(e.clientX, e.clientY);
            throttledUpdatePosition(x, y, false, targetElement ?? undefined);
        },
        [throttledUpdatePosition]
    );

    // Handle touch move
    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (e.touches.length === 0) return;
            const touch = e.touches[0];
            const { x, y } = normalizePosition(touch.clientX, touch.clientY);
            const targetElement = detectTargetElement(touch.clientX, touch.clientY);
            throttledUpdatePosition(x, y, true, targetElement ?? undefined);
        },
        [throttledUpdatePosition]
    );

    // Handle mouse click
    const handleMouseDown = useCallback(
        (e: MouseEvent) => {
            if (!enabled || !playerId || !roomCode) return;

            const { x, y } = normalizePosition(e.clientX, e.clientY);
            const targetElement = detectTargetElement(e.clientX, e.clientY);
            currentPositionRef.current = { x, y, isTouch: false, targetElement: targetElement ?? undefined };

            recordInteraction(roomCode, playerId, { x, y, isTouch: false, targetElement: targetElement ?? undefined }, 'click').catch((err) => {
                console.warn('Failed to record click:', err);
            });

            // Clear interaction after ripple animation
            setTimeout(() => {
                clearInteraction(roomCode, playerId, currentPositionRef.current).catch((err) => {
                    console.warn('Failed to clear interaction:', err);
                });
            }, RIPPLE_DURATION_MS);
        },
        [enabled, playerId, roomCode]
    );

    // Handle touch start
    const handleTouchStart = useCallback(
        (e: TouchEvent) => {
            if (!enabled || !playerId || !roomCode) return;
            if (e.touches.length === 0) return;

            const touch = e.touches[0];
            const { x, y } = normalizePosition(touch.clientX, touch.clientY);
            const targetElement = detectTargetElement(touch.clientX, touch.clientY);
            currentPositionRef.current = { x, y, isTouch: true, targetElement: targetElement ?? undefined };

            recordInteraction(roomCode, playerId, { x, y, isTouch: true, targetElement: targetElement ?? undefined }, 'tap').catch((err) => {
                console.warn('Failed to record tap:', err);
            });

            // Clear interaction after ripple animation
            setTimeout(() => {
                clearInteraction(roomCode, playerId, currentPositionRef.current).catch((err) => {
                    console.warn('Failed to clear interaction:', err);
                });
            }, RIPPLE_DURATION_MS);
        },
        [enabled, playerId, roomCode]
    );

    // Handle mouse leaving the document (cursor goes off-screen)
    const handleMouseLeave = useCallback(() => {
        if (!enabled || !playerId || !roomCode) return;

        // Send off-screen coordinates (-1, -1) to indicate cursor is outside
        // This will be filtered out by the isOutOfBounds check on the receiving side
        currentPositionRef.current = { x: -1, y: -1, isTouch: false };
        updateCursorPosition(roomCode, playerId, { x: -1, y: -1, isTouch: false }).catch((err) => {
            console.warn('Failed to update cursor position on leave:', err);
        });
    }, [enabled, playerId, roomCode]);

    // Set up event listeners - Listen to BOTH mouse and touch events
    // Many devices support both (laptops with touchscreens, etc.)
    useEffect(() => {
        if (!enabled) return;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchstart', handleTouchStart, { passive: true });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchstart', handleTouchStart);
        };
    }, [enabled, handleMouseMove, handleMouseLeave, handleMouseDown, handleTouchMove, handleTouchStart]);

    // Set up disconnect handler (once)
    useEffect(() => {
        if (!enabled || !playerId || !roomCode || disconnectSetupRef.current) return;

        setupCursorDisconnect(roomCode, playerId);
        disconnectSetupRef.current = true;
    }, [enabled, playerId, roomCode]);

    // Subscribe to cursors
    useEffect(() => {
        if (!enabled || !roomCode) {
            setRawCursors({});
            return;
        }

        const unsubscribe = subscribeToCursors(roomCode, setRawCursors);
        return () => unsubscribe();
    }, [enabled, roomCode]);

    // Clean up cursor when disabled or unmounting
    useEffect(() => {
        return () => {
            if (playerId && roomCode) {
                removeCursor(roomCode, playerId).catch((err) => {
                    console.warn('Failed to remove cursor on cleanup:', err);
                });
            }
        };
    }, [playerId, roomCode]);

    // Transform raw cursors to TeammateCursor array
    const teammateCursors = useMemo((): TeammateCursor[] => {
        if (!myTeam || !enabled) return [];

        return Object.entries(rawCursors)
            .filter(([cursorPlayerId, cursor]) => {
                // Skip own cursor
                if (cursorPlayerId === playerId) return false;

                // Skip stale cursors
                if (isCursorStale(cursor, STALE_THRESHOLD_MS)) return false;

                // Get player info
                const player = players[cursorPlayerId];
                if (!player) return false;

                // Skip offline players
                if (!player.isOnline) return false;

                // Skip players on different team
                if (player.team !== myTeam) return false;

                return true;
            })
            .map(([cursorPlayerId, cursor]) => {
                const player = players[cursorPlayerId];
                // Use element-based positioning (priority) or fallback to normalized coordinates
                const screenPos = resolveTargetPosition(cursor);

                // Filter out cursors that are outside the viewport
                const isOutOfBounds =
                    screenPos.x < 0 ||
                    screenPos.x > window.innerWidth ||
                    screenPos.y < 0 ||
                    screenPos.y > window.innerHeight;

                if (isOutOfBounds) return null;

                return {
                    playerId: cursorPlayerId,
                    name: player.name,
                    avatar: player.avatar,
                    team: player.team as Team,
                    x: screenPos.x,
                    y: screenPos.y,
                    isTouch: cursor.isTouch,
                    interaction: cursor.interaction ?? null,
                };
            })
            .filter((cursor): cursor is TeammateCursor => cursor !== null);
    }, [rawCursors, players, playerId, myTeam, enabled]);

    return { teammateCursors };
}
