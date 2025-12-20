/**
 * Solo Mode Types
 * Types spécifiques au mode solo (arcade contre le chrono)
 */

import type { Timestamp } from 'firebase/firestore';
import type { Avatar, Question, Phase3Theme, Phase4Question } from './gameTypes';

// === SOLO GAME STATUS ===

export type SoloPhaseStatus = 'setup' | 'generating' | 'phase1' | 'phase3' | 'phase4' | 'results';

export interface SoloPhaseInfo {
    name: string;
    subtitle: string;
    shortName: string;
    maxScore: number;
}

export const SOLO_PHASE_NAMES: Record<Exclude<SoloPhaseStatus, 'setup' | 'generating' | 'results'>, SoloPhaseInfo> = {
    phase1: { name: 'Tenders', subtitle: 'Réponds aux questions !', shortName: 'Tenders', maxScore: 10 },
    phase3: { name: 'La Carte', subtitle: 'Choisis un thème et réponds !', shortName: 'La Carte', maxScore: 5 },
    phase4: { name: 'La Note', subtitle: 'Réponds vite pour plus de points !', shortName: 'La Note', maxScore: 30 },
};

// Order of phases in solo mode
export const SOLO_PHASE_ORDER: (keyof typeof SOLO_PHASE_NAMES)[] = ['phase1', 'phase3', 'phase4'];

// === SOLO GAME STATE ===

export interface SoloPhase1State {
    currentQuestionIndex: number;
    answers: (number | null)[]; // Player's answer indices (null if not answered)
    correctCount: number;
    questionStartTime?: number;
}

export interface SoloPhase3State {
    selectedThemeIndex: number | null;
    currentQuestionIndex: number;
    answers: string[]; // Player's text answers
    correctCount: number;
    validationResults: (boolean | null)[]; // null = pending, true/false = validated
}

export interface SoloPhase4State {
    currentQuestionIndex: number;
    answers: (number | null)[]; // Player's answer indices
    timeTaken: number[]; // Time in ms for each answer
    score: number; // Running score (speed-based)
    questionStartTime?: number;
}

export interface SoloGameState {
    // Player info
    playerId: string;
    playerName: string;
    playerAvatar: Avatar;

    // Game progress
    status: SoloPhaseStatus;
    currentPhaseIndex: number; // 0, 1, 2 for phase1, phase3, phase4

    // Scoring
    totalScore: number;
    phaseScores: {
        phase1: number;
        phase3: number;
        phase4: number;
    };

    // Stats
    totalQuestions: number;
    correctAnswers: number;
    totalTimeMs: number;

    // Phase-specific state
    phase1State: SoloPhase1State | null;
    phase3State: SoloPhase3State | null;
    phase4State: SoloPhase4State | null;

    // AI-generated questions (stored locally)
    customQuestions: {
        phase1?: Question[];
        phase3?: Phase3Theme[];
        phase4?: Phase4Question[];
    };

    // Generation state
    isGenerating: boolean;
    generationProgress: {
        phase1: 'pending' | 'generating' | 'done' | 'error';
        phase3: 'pending' | 'generating' | 'done' | 'error';
        phase4: 'pending' | 'generating' | 'done' | 'error';
    };
    generationError: string | null;

    // Timestamps
    startedAt: number | null;
    endedAt: number | null;
}

// === SCORING CONSTANTS ===

export const SOLO_SCORING = {
    phase1: {
        correctAnswer: 1, // +1 per correct answer
        maxQuestions: 10,
    },
    phase3: {
        correctAnswer: 1, // +1 per correct answer
        maxQuestions: 5,
    },
    phase4: {
        // Speed-based scoring
        fast: { threshold: 5000, points: 3 },    // < 5s = 3 pts
        medium: { threshold: 15000, points: 2 }, // < 15s = 2 pts
        slow: { threshold: 30000, points: 1 },   // < 30s = 1 pt
        timeout: 0, // timeout = 0 pts
        maxQuestions: 10,
        questionTimeLimit: 30000, // 30 seconds
    },
} as const;

// Maximum possible score: 10 + 5 + 30 = 45
export const SOLO_MAX_SCORE =
    SOLO_SCORING.phase1.correctAnswer * SOLO_SCORING.phase1.maxQuestions +
    SOLO_SCORING.phase3.correctAnswer * SOLO_SCORING.phase3.maxQuestions +
    SOLO_SCORING.phase4.fast.points * SOLO_SCORING.phase4.maxQuestions;

// === SOLO PHASE HANDLERS ===
// Interface for callbacks passed to PhaseX components in solo mode

export interface SoloPhaseHandlers {
    // Phase 1 (Tenders)
    submitPhase1Answer: (answerIndex: number) => void;
    nextPhase1Question: () => void;

    // Phase 3 (La Carte)
    selectPhase3Theme: (themeIndex: number) => void;
    submitPhase3Answer: (answer: string) => Promise<boolean>;
    nextPhase3Question: () => void;

    // Phase 4 (La Note)
    submitPhase4Answer: (answerIndex: number) => void;
    nextPhase4Question: () => void;
    handlePhase4Timeout: () => void;

    // Phase transitions
    advanceToNextPhase: () => void;
    endGame: () => void;
}

// === LEADERBOARD ===

export interface LeaderboardEntry {
    id: string; // Firestore document ID

    // Player info
    playerId: string; // Firebase Auth UID
    playerName: string;
    playerAvatar: Avatar;

    // Scores
    totalScore: number;
    phase1Score: number;
    phase3Score: number;
    phase4Score: number;

    // Stats
    accuracy: number; // Percentage (0-100)
    totalTimeMs: number;
    totalQuestions: number;
    correctAnswers: number;

    // Metadata
    playedAt: Timestamp;
    gameVersion: string;
}

// For creating new entries (without id and playedAt which are auto-generated)
export type LeaderboardEntryInput = Omit<LeaderboardEntry, 'id' | 'playedAt'>;

// === INITIAL STATE ===

export function createInitialSoloState(
    playerId: string,
    playerName: string,
    playerAvatar: Avatar
): SoloGameState {
    return {
        playerId,
        playerName,
        playerAvatar,
        status: 'setup',
        currentPhaseIndex: 0,
        totalScore: 0,
        phaseScores: {
            phase1: 0,
            phase3: 0,
            phase4: 0,
        },
        totalQuestions: 0,
        correctAnswers: 0,
        totalTimeMs: 0,
        phase1State: null,
        phase3State: null,
        phase4State: null,
        customQuestions: {},
        isGenerating: false,
        generationProgress: {
            phase1: 'pending',
            phase3: 'pending',
            phase4: 'pending',
        },
        generationError: null,
        startedAt: null,
        endedAt: null,
    };
}

// === HELPER FUNCTIONS ===

/**
 * Calculate Phase 4 score based on response time
 */
export function calculatePhase4Score(timeMs: number): number {
    const { fast, medium, slow, timeout, questionTimeLimit } = SOLO_SCORING.phase4;

    if (timeMs >= questionTimeLimit) return timeout;
    if (timeMs < fast.threshold) return fast.points;
    if (timeMs < medium.threshold) return medium.points;
    return slow.points;
}

/**
 * Get current phase key from index
 */
export function getPhaseKeyFromIndex(index: number): keyof typeof SOLO_PHASE_NAMES | null {
    return SOLO_PHASE_ORDER[index] ?? null;
}

/**
 * Check if all phases are completed
 */
export function isGameComplete(state: SoloGameState): boolean {
    return state.currentPhaseIndex >= SOLO_PHASE_ORDER.length;
}

/**
 * Map SoloGameState to GameState for PhaseX components
 * This creates a GameState-compatible object from solo state
 */
export function mapSoloStateToGameState(state: SoloGameState): import('./gameTypes').GameState {
    const baseState: import('./gameTypes').GameState = {
        status: state.status === 'results' ? 'victory' : state.status as import('./gameTypes').PhaseStatus,
        phaseState: 'answering', // Default to answering state
        isGenerating: state.isGenerating,
    };

    // Phase 1 state mapping
    if (state.status === 'phase1' && state.phase1State) {
        baseState.currentQuestionIndex = state.phase1State.currentQuestionIndex;
        baseState.phaseState = 'answering';
    }

    // Phase 3 state mapping
    if (state.status === 'phase3' && state.phase3State) {
        baseState.phase3State = state.phase3State.selectedThemeIndex !== null ? 'playing' : 'selecting';
        if (state.phase3State.selectedThemeIndex !== null) {
            baseState.phase3ThemeSelection = {
                spicy: state.phase3State.selectedThemeIndex,
                sweet: state.phase3State.selectedThemeIndex, // Same theme for solo
            };
            baseState.phase3TeamProgress = {
                spicy: {
                    themeIndex: state.phase3State.selectedThemeIndex,
                    currentQuestionIndex: state.phase3State.currentQuestionIndex,
                    score: state.phase3State.correctCount,
                    finished: state.phase3State.currentQuestionIndex >= SOLO_SCORING.phase3.maxQuestions,
                },
                sweet: {
                    themeIndex: state.phase3State.selectedThemeIndex,
                    currentQuestionIndex: state.phase3State.currentQuestionIndex,
                    score: state.phase3State.correctCount,
                    finished: state.phase3State.currentQuestionIndex >= SOLO_SCORING.phase3.maxQuestions,
                },
            };
        }
    }

    // Phase 4 state mapping
    if (state.status === 'phase4' && state.phase4State) {
        baseState.currentPhase4QuestionIndex = state.phase4State.currentQuestionIndex;
        baseState.phase4State = 'questioning';
        baseState.phase4QuestionStartTime = state.phase4State.questionStartTime;
    }

    return baseState;
}
