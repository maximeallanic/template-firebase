/**
 * Mock Player Context Definition
 * Separated from provider for react-refresh compatibility
 */

import { createContext } from 'react';
import type { Team } from '../types/gameTypes';
import type { Phase2Choice } from '../services/mockAnswerService';

// === Types ===

export interface MockAnswer {
    mockPlayerId: string;
    playerName: string;
    playerTeam: Team;
    phase: 'phase1' | 'phase2' | 'phase4';
    answer: number | Phase2Choice;
    generatedAt: number;
}

export interface MockPlayerContextValue {
    pendingAnswers: MockAnswer[];
    isAutoAnswerEnabled: boolean;
    setAutoAnswerEnabled: (enabled: boolean) => void;
    validateAllAnswers: () => Promise<void>;
    clearPendingAnswers: () => void;
    isValidating: boolean;
}

// === Context ===

export const MockPlayerContext = createContext<MockPlayerContextValue | null>(null);
