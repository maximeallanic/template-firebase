/**
 * Solo Mode Types
 * Types spécifiques au mode solo (arcade contre le chrono)
 */

import type { Timestamp } from 'firebase/firestore';
import type { Avatar, Question, SimplePhase2Set, Phase4Question, Difficulty } from './gameTypes';

// === SOLO GAME STATUS ===

export type SoloPhaseStatus = 'setup' | 'generating' | 'phase1' | 'phase2' | 'phase4' | 'waiting_for_phase' | 'results';

export interface SoloPhaseInfo {
    name: string;
    subtitle: string;
    shortName: string;
    maxScore: number;
}

export const SOLO_PHASE_NAMES: Record<Exclude<SoloPhaseStatus, 'setup' | 'generating' | 'waiting_for_phase' | 'results'>, SoloPhaseInfo> = {
    phase1: { name: 'Tenders', subtitle: 'Réponds aux questions !', shortName: 'Tenders', maxScore: 10 },
    phase2: { name: 'Sucré Salé', subtitle: 'Classe les éléments !', shortName: 'Sucré Salé', maxScore: 12 },
    phase4: { name: 'La Note', subtitle: 'Réponds vite pour plus de points !', shortName: 'La Note', maxScore: 30 },
};

// Order of phases in solo mode
export const SOLO_PHASE_ORDER: (keyof typeof SOLO_PHASE_NAMES)[] = ['phase1', 'phase2', 'phase4'];

// === SOLO GAME STATE ===

export interface SoloPhase1State {
    currentQuestionIndex: number;
    answers: (number | null)[]; // Player's answer indices (null if not answered)
    correctCount: number;
    questionStartTime?: number;
}

export interface SoloPhase2State {
    currentItemIndex: number;
    answers: ('A' | 'B' | 'Both' | null)[]; // Player's answers per item
    correctCount: number;
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
    difficulty: Difficulty;

    // Game progress
    status: SoloPhaseStatus;
    currentPhaseIndex: number; // 0, 1, 2 for phase1, phase3, phase4

    // Scoring
    totalScore: number;
    phaseScores: {
        phase1: number;
        phase2: number;
        phase4: number;
    };

    // Stats
    totalQuestions: number;
    correctAnswers: number;
    totalTimeMs: number;

    // Phase-specific state
    phase1State: SoloPhase1State | null;
    phase2State: SoloPhase2State | null;
    phase4State: SoloPhase4State | null;

    // AI-generated questions (stored locally)
    customQuestions: {
        phase1?: Question[];
        phase2?: SimplePhase2Set;
        phase4?: Phase4Question[];
    };

    // Generation state
    isGenerating: boolean;
    generationProgress: {
        phase1: 'pending' | 'generating' | 'done' | 'error';
        phase2: 'pending' | 'generating' | 'done' | 'error';
        phase4: 'pending' | 'generating' | 'done' | 'error';
    };
    generationError: string | null;

    // Background generation tracking (Phase 2 & 4 while playing Phase 1)
    backgroundGeneration: {
        phase2: 'idle' | 'generating' | 'done' | 'error';
        phase4: 'idle' | 'generating' | 'done' | 'error';
    };
    backgroundErrors: {
        phase2?: string;
        phase4?: string;
    };
    pendingPhase?: 'phase2' | 'phase4'; // Phase waiting for questions

    // Revealed answers from CF validation (#72 - server-side orchestration)
    // Mirrors the structure in Room type for compatibility with PhaseX components
    revealedAnswers: {
        phase1: Record<number, { correctIndex: number; revealedAt: number }>;
        phase2: Record<string, { answer: 'A' | 'B' | 'Both'; revealedAt: number }>; // Key format: "setIndex_itemIndex"
        phase4: Record<number, { correctIndex: number; revealedAt: number }>;
    };

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
    phase2: {
        correctAnswer: 1, // +1 per correct classification
        maxItems: 12,
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

// Maximum possible score: 10 + 12 + 30 = 52
export const SOLO_MAX_SCORE =
    SOLO_SCORING.phase1.correctAnswer * SOLO_SCORING.phase1.maxQuestions +
    SOLO_SCORING.phase2.correctAnswer * SOLO_SCORING.phase2.maxItems +
    SOLO_SCORING.phase4.fast.points * SOLO_SCORING.phase4.maxQuestions;

// === SOLO PHASE HANDLERS ===
// Interface for callbacks passed to PhaseX components in solo mode

export interface SoloPhaseHandlers {
    // Phase 1 (Tenders) - async for CF validation (#83)
    submitPhase1Answer: (answerIndex: number) => void | Promise<void>;
    nextPhase1Question: () => void;

    // Phase 2 (Sucré Salé) - async for CF validation (#83)
    submitPhase2Answer: (answer: 'A' | 'B' | 'Both') => void | Promise<void>;
    nextPhase2Item: () => void;

    // Phase 3 (La Carte) - Optional, not used in solo mode but kept for compatibility
    selectPhase3Theme?: (themeIndex: number) => void;
    submitPhase3Answer?: (answer: string) => void | Promise<void>;
    nextPhase3Question?: () => void;

    // Phase 4 (La Note) - async for CF validation (#83)
    submitPhase4Answer: (answerIndex: number) => void | Promise<void>;
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
    phase2Score: number;
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
    playerAvatar: Avatar,
    difficulty: Difficulty = 'normal'
): SoloGameState {
    return {
        playerId,
        playerName,
        playerAvatar,
        difficulty,
        status: 'setup',
        currentPhaseIndex: 0,
        totalScore: 0,
        phaseScores: {
            phase1: 0,
            phase2: 0,
            phase4: 0,
        },
        totalQuestions: 0,
        correctAnswers: 0,
        totalTimeMs: 0,
        phase1State: null,
        phase2State: null,
        phase4State: null,
        customQuestions: {},
        isGenerating: false,
        generationProgress: {
            phase1: 'pending',
            phase2: 'pending',
            phase4: 'pending',
        },
        generationError: null,
        backgroundGeneration: {
            phase2: 'idle',
            phase4: 'idle',
        },
        backgroundErrors: {},
        pendingPhase: undefined,
        revealedAnswers: {
            phase1: {},
            phase2: {},
            phase4: {},
        },
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
        const currentIdx = state.phase1State.currentQuestionIndex;
        baseState.currentQuestionIndex = currentIdx;
        baseState.questionStartTime = state.phase1State.questionStartTime; // Timer sync for solo mode
        // Check if current question has been answered
        const currentAnswered = state.phase1State.answers.length > currentIdx;
        baseState.phaseState = currentAnswered ? 'result' : 'answering';

        // Set roundWinner if player answered correctly (for result display)
        // Use revealedAnswers from CF validation - correctIndex is stripped from public questions (#72)
        if (currentAnswered) {
            const playerAnswer = state.phase1State.answers[currentIdx];
            const revealedCorrect = state.revealedAnswers.phase1[currentIdx]?.correctIndex;
            if (playerAnswer === null) {
                // Timeout occurred - set isTimeout flag
                baseState.isTimeout = true;
            } else if (revealedCorrect !== undefined && playerAnswer === revealedCorrect) {
                baseState.roundWinner = {
                    playerId: state.playerId,
                    name: state.playerName,
                    team: 'spicy', // Solo player is always spicy
                };
            }
        }
    }

    // Phase 2 state mapping
    if (state.status === 'phase2' && state.phase2State) {
        baseState.currentPhase2Set = 0; // Solo uses single set
        baseState.currentPhase2Item = state.phase2State.currentItemIndex;
        baseState.phaseState = 'answering';
    }

    // Phase 4 state mapping
    if (state.status === 'phase4' && state.phase4State) {
        const currentIndex = state.phase4State.currentQuestionIndex;
        const hasAnsweredCurrent = state.phase4State.answers.length > currentIndex;

        baseState.currentPhase4QuestionIndex = currentIndex;
        baseState.phase4State = hasAnsweredCurrent ? 'result' : 'questioning';
        baseState.phase4QuestionStartTime = state.phase4State.questionStartTime;

        // Populate phase4Answers so Phase4Player can detect hasAnswered
        if (hasAnsweredCurrent) {
            const answerValue = state.phase4State.answers[currentIndex];
            baseState.phase4Answers = {
                [state.playerId]: {
                    answer: answerValue ?? -1,  // -1 for timeout (null)
                    timestamp: Date.now()
                }
            };

            // Set isTimeout if the answer was null (timeout occurred)
            if (answerValue === null) {
                baseState.isTimeout = true;
            }

            // Set phase4Winner if answer was correct
            // Use revealedAnswers from CF validation - correctIndex is stripped from public questions (#72)
            if (answerValue !== null) {
                const revealedCorrect = state.revealedAnswers.phase4[currentIndex]?.correctIndex;
                if (revealedCorrect !== undefined && answerValue === revealedCorrect) {
                    baseState.phase4Winner = {
                        playerId: state.playerId,
                        name: state.playerName,
                        team: 'spicy', // Solo player is always spicy
                    };
                }
            }
        }
    }

    return baseState;
}
