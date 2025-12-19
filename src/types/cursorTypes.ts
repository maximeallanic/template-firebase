import type { Avatar, Team } from './gameTypes';

// === CURSOR SHARING ===

/**
 * Cursor interaction event (click/tap)
 */
export interface CursorInteraction {
    type: 'click' | 'tap';
    startTime: number;
}

/**
 * Target element information for element-based cursor positioning
 * Allows cursors to appear on the same UI element regardless of screen size
 */
export interface CursorTargetElement {
    id: string;          // Element identifier, e.g. "phase1:answer:1"
    relativeX: number;   // Position 0-1 within the element (left to right)
    relativeY: number;   // Position 0-1 within the element (top to bottom)
}

/**
 * Cursor position stored in Firebase
 * Path: cursors/{roomCode}/{playerId}
 */
export interface CursorPosition {
    x: number;           // Normalized 0-1 (percentage of container width) - fallback
    y: number;           // Normalized 0-1 (percentage of container height) - fallback
    isTouch: boolean;    // true = touch device, false = mouse
    timestamp: number;   // Server timestamp for ordering/staleness detection
    interaction?: CursorInteraction;
    targetElement?: CursorTargetElement;  // Element-based positioning (priority)
}

/**
 * Teammate cursor with player info (for rendering)
 */
export interface TeammateCursor {
    playerId: string;
    name: string;
    avatar: Avatar;
    team: Team;
    x: number;           // Screen pixels (converted from normalized)
    y: number;           // Screen pixels (converted from normalized)
    isTouch: boolean;
    interaction: CursorInteraction | null;
}

/**
 * Options for the useTeammateCursors hook
 */
export interface UseTeammateCursorsOptions {
    roomCode: string;
    playerId: string;
    myTeam: Team | null;
    players: Record<string, { id: string; name: string; avatar: Avatar; team: Team | null; isOnline: boolean }>;
    enabled: boolean;
}

/**
 * Return type for the useTeammateCursors hook
 */
export interface UseTeammateCursorsReturn {
    teammateCursors: TeammateCursor[];
}
