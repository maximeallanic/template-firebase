/**
 * Solo Game Context
 * Manages all state for solo mode gameplay
 */
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useReducer, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ref, child, get, set, onValue, off } from 'firebase/database';
import type { Avatar, SimplePhase2Set, Difficulty } from '../types/gameTypes';
import { toGameLanguage } from '../types/languageTypes';
import { hasEnoughQuestions, MINIMUM_QUESTION_COUNTS, DIFFICULTY_MULTIPLIERS } from '../types/gameTypes';
import {
    type SoloGameState,
    type SoloPhaseStatus,
    type SoloPhaseHandlers,
    createInitialSoloState,
    calculatePhase4Score,
    SOLO_PHASE_ORDER,
    SOLO_SCORING,
} from '../types/soloTypes';
import { generateWithRetry } from '../services/aiClient';
import {
    rtdb,
    startGame as startGameCF,
    submitAnswer as submitAnswerCF,
} from '../services/firebase';
import { getRandomQuestionSet } from '../services/questionStorageService';

// === ACTION TYPES ===

type SoloGameAction =
    | { type: 'SET_PLAYER_INFO'; playerId: string; playerName: string; playerAvatar: Avatar }
    | { type: 'START_GENERATION' }
    | { type: 'SET_GENERATION_PROGRESS'; phase: 'phase1' | 'phase2' | 'phase4'; status: 'generating' | 'done' | 'error' }
    | { type: 'SET_QUESTIONS'; phase: 'phase1' | 'phase2' | 'phase4'; questions: unknown }
    | { type: 'GENERATION_COMPLETE' }
    | { type: 'GENERATION_ERROR'; error: string }
    | { type: 'PHASE1_READY' } // Start game immediately after Phase 1 is ready
    | { type: 'BACKGROUND_GEN_START'; phase: 'phase2' | 'phase4' }
    | { type: 'BACKGROUND_GEN_DONE'; phase: 'phase2' | 'phase4'; questions: unknown }
    | { type: 'BACKGROUND_GEN_ERROR'; phase: 'phase2' | 'phase4'; error: string }
    | { type: 'EXIT_WAITING' } // Transition from waiting_for_phase to actual phase
    | { type: 'START_PHASE'; phase: SoloPhaseStatus }
    | { type: 'SUBMIT_PHASE1_ANSWER'; answerIndex: number; isCorrect: boolean; correctIndex: number }
    | { type: 'NEXT_PHASE1_QUESTION' }
    | { type: 'SUBMIT_PHASE2_ANSWER'; answer: 'A' | 'B' | 'Both'; isCorrect: boolean; correctAnswer: 'A' | 'B' | 'Both' }
    | { type: 'NEXT_PHASE2_ITEM' }
    | { type: 'SUBMIT_PHASE4_ANSWER'; answerIndex: number; isCorrect: boolean; timeMs: number; correctIndex: number }
    | { type: 'NEXT_PHASE4_QUESTION' }
    | { type: 'PHASE4_TIMEOUT' }
    | { type: 'ADVANCE_TO_NEXT_PHASE' }
    | { type: 'END_GAME' }
    | { type: 'RESET_GAME' };

// === REDUCER ===

function soloGameReducer(state: SoloGameState, action: SoloGameAction): SoloGameState {
    switch (action.type) {
        case 'SET_PLAYER_INFO':
            return {
                ...state,
                playerId: action.playerId,
                playerName: action.playerName,
                playerAvatar: action.playerAvatar,
            };

        case 'START_GENERATION':
            return {
                ...state,
                status: 'generating',
                isGenerating: true,
                generationError: null,
                generationProgress: {
                    phase1: 'generating',
                    phase2: 'generating',
                    phase4: 'generating',
                },
            };

        case 'SET_GENERATION_PROGRESS':
            return {
                ...state,
                generationProgress: {
                    ...state.generationProgress,
                    [action.phase]: action.status,
                },
            };

        case 'SET_QUESTIONS':
            return {
                ...state,
                customQuestions: {
                    ...state.customQuestions,
                    [action.phase]: action.questions,
                },
            };

        case 'GENERATION_COMPLETE':
            return {
                ...state,
                isGenerating: false,
                status: 'phase1',
                startedAt: Date.now(),
                phase1State: {
                    currentQuestionIndex: 0,
                    answers: [],
                    correctCount: 0,
                    questionStartTime: Date.now(),
                },
            };

        case 'GENERATION_ERROR':
            return {
                ...state,
                isGenerating: false,
                generationError: action.error,
                status: 'setup',
            };

        case 'PHASE1_READY':
            return {
                ...state,
                isGenerating: false,
                status: 'phase1',
                startedAt: Date.now(),
                phase1State: {
                    currentQuestionIndex: 0,
                    answers: [],
                    correctCount: 0,
                    questionStartTime: Date.now(),
                },
            };

        case 'BACKGROUND_GEN_START':
            return {
                ...state,
                backgroundGeneration: {
                    ...state.backgroundGeneration,
                    [action.phase]: 'generating',
                },
                backgroundErrors: {
                    ...state.backgroundErrors,
                    [action.phase]: undefined,
                },
            };

        case 'BACKGROUND_GEN_DONE':
            return {
                ...state,
                customQuestions: {
                    ...state.customQuestions,
                    [action.phase]: action.questions,
                },
                backgroundGeneration: {
                    ...state.backgroundGeneration,
                    [action.phase]: 'done',
                },
                generationProgress: {
                    ...state.generationProgress,
                    [action.phase]: 'done',
                },
            };

        case 'BACKGROUND_GEN_ERROR':
            return {
                ...state,
                backgroundGeneration: {
                    ...state.backgroundGeneration,
                    [action.phase]: 'error',
                },
                backgroundErrors: {
                    ...state.backgroundErrors,
                    [action.phase]: action.error,
                },
                generationProgress: {
                    ...state.generationProgress,
                    [action.phase]: 'error',
                },
            };

        case 'EXIT_WAITING': {
            const phase = state.pendingPhase;
            if (!phase) return state;

            const newState: SoloGameState = {
                ...state,
                status: phase,
                pendingPhase: undefined,
            };

            // Initialize phase state
            if (phase === 'phase2') {
                newState.phase2State = {
                    currentItemIndex: 0,
                    answers: [],
                    correctCount: 0,
                };
            } else if (phase === 'phase4') {
                newState.phase4State = {
                    currentQuestionIndex: 0,
                    answers: [],
                    timeTaken: [],
                    score: 0,
                    questionStartTime: Date.now(),
                };
            }

            return newState;
        }

        case 'START_PHASE': {
            const newState: SoloGameState = { ...state, status: action.phase };

            if (action.phase === 'setup') {
                // Reset to initial setup state
                return createInitialSoloState(state.playerId, state.playerName, state.playerAvatar, state.difficulty);
            } else if (action.phase === 'results') {
                // Jump to results (end game)
                newState.endedAt = Date.now();
                newState.totalTimeMs = Date.now() - (state.startedAt || Date.now());
            } else if (action.phase === 'phase1') {
                newState.phase1State = {
                    currentQuestionIndex: 0,
                    answers: [],
                    correctCount: 0,
                    questionStartTime: Date.now(),
                };
            } else if (action.phase === 'phase2') {
                newState.phase2State = {
                    currentItemIndex: 0,
                    answers: [],
                    correctCount: 0,
                };
            } else if (action.phase === 'phase4') {
                newState.phase4State = {
                    currentQuestionIndex: 0,
                    answers: [],
                    timeTaken: [],
                    score: 0,
                    questionStartTime: Date.now(),
                };
            }

            return newState;
        }

        case 'SUBMIT_PHASE1_ANSWER': {
            if (!state.phase1State) return state;

            const newCorrectCount = state.phase1State.correctCount + (action.isCorrect ? 1 : 0);
            const newAnswers = [...state.phase1State.answers, action.answerIndex];
            const baseScore = action.isCorrect ? SOLO_SCORING.phase1.correctAnswer : 0;
            const multiplier = DIFFICULTY_MULTIPLIERS[state.difficulty] || 1;
            const scoreIncrease = baseScore * multiplier;
            const questionIndex = state.phase1State.currentQuestionIndex;

            return {
                ...state,
                phase1State: {
                    ...state.phase1State,
                    answers: newAnswers,
                    correctCount: newCorrectCount,
                },
                totalScore: state.totalScore + scoreIncrease,
                phaseScores: {
                    ...state.phaseScores,
                    phase1: state.phaseScores.phase1 + scoreIncrease,
                },
                correctAnswers: state.correctAnswers + (action.isCorrect ? 1 : 0),
                totalQuestions: state.totalQuestions + 1,
                // Store revealed answer for Phase1Player to display correct answer (#72)
                revealedAnswers: {
                    ...state.revealedAnswers,
                    phase1: {
                        ...state.revealedAnswers.phase1,
                        [questionIndex]: {
                            correctIndex: action.correctIndex,
                            revealedAt: Date.now(),
                        },
                    },
                },
            };
        }

        case 'NEXT_PHASE1_QUESTION': {
            if (!state.phase1State) return state;

            // Add null for timed-out question to keep answers array aligned with currentQuestionIndex
            const currentIdx = state.phase1State.currentQuestionIndex;
            const currentAnswers = state.phase1State.answers;
            const needsNullEntry = currentAnswers.length <= currentIdx;
            const newAnswers = needsNullEntry
                ? [...currentAnswers, null]
                : currentAnswers;

            return {
                ...state,
                phase1State: {
                    ...state.phase1State,
                    answers: newAnswers,
                    currentQuestionIndex: state.phase1State.currentQuestionIndex + 1,
                    questionStartTime: Date.now(),
                },
                // Increment totalQuestions for timeout (unanswered question counts)
                totalQuestions: needsNullEntry ? state.totalQuestions + 1 : state.totalQuestions,
            };
        }

        case 'SUBMIT_PHASE2_ANSWER': {
            if (!state.phase2State) return state;

            const newCorrectCount = state.phase2State.correctCount + (action.isCorrect ? 1 : 0);
            const newAnswers = [...state.phase2State.answers, action.answer];
            const baseScore = action.isCorrect ? SOLO_SCORING.phase2.correctAnswer : 0;
            const multiplier = DIFFICULTY_MULTIPLIERS[state.difficulty] || 1;
            const scoreIncrease = baseScore * multiplier;
            const itemIndex = state.phase2State.currentItemIndex;

            return {
                ...state,
                phase2State: {
                    ...state.phase2State,
                    answers: newAnswers,
                    correctCount: newCorrectCount,
                },
                totalScore: state.totalScore + scoreIncrease,
                phaseScores: {
                    ...state.phaseScores,
                    phase2: state.phaseScores.phase2 + scoreIncrease,
                },
                correctAnswers: state.correctAnswers + (action.isCorrect ? 1 : 0),
                totalQuestions: state.totalQuestions + 1,
                // Store revealed answer for Phase2Player (#72)
                // Key format: "setIndex_itemIndex" - solo mode always uses setIndex 0
                revealedAnswers: {
                    ...state.revealedAnswers,
                    phase2: {
                        ...state.revealedAnswers.phase2,
                        [`0_${itemIndex}`]: {
                            answer: action.correctAnswer,
                            revealedAt: Date.now(),
                        },
                    },
                },
            };
        }

        case 'NEXT_PHASE2_ITEM': {
            if (!state.phase2State) return state;

            return {
                ...state,
                phase2State: {
                    ...state.phase2State,
                    currentItemIndex: state.phase2State.currentItemIndex + 1,
                },
            };
        }

        case 'SUBMIT_PHASE4_ANSWER': {
            if (!state.phase4State) return state;

            const basePoints = action.isCorrect ? calculatePhase4Score(action.timeMs) : 0;
            const multiplier = DIFFICULTY_MULTIPLIERS[state.difficulty] || 1;
            const pointsEarned = basePoints * multiplier;
            const newAnswers = [...state.phase4State.answers, action.answerIndex];
            const newTimeTaken = [...state.phase4State.timeTaken, action.timeMs];
            const questionIndex = state.phase4State.currentQuestionIndex;

            return {
                ...state,
                phase4State: {
                    ...state.phase4State,
                    answers: newAnswers,
                    timeTaken: newTimeTaken,
                    score: state.phase4State.score + pointsEarned,
                },
                totalScore: state.totalScore + pointsEarned,
                phaseScores: {
                    ...state.phaseScores,
                    phase4: state.phaseScores.phase4 + pointsEarned,
                },
                correctAnswers: state.correctAnswers + (action.isCorrect ? 1 : 0),
                totalQuestions: state.totalQuestions + 1,
                // Store revealed answer for Phase4Player (#72)
                revealedAnswers: {
                    ...state.revealedAnswers,
                    phase4: {
                        ...state.revealedAnswers.phase4,
                        [questionIndex]: {
                            correctIndex: action.correctIndex,
                            revealedAt: Date.now(),
                        },
                    },
                },
            };
        }

        case 'NEXT_PHASE4_QUESTION': {
            if (!state.phase4State) return state;

            return {
                ...state,
                phase4State: {
                    ...state.phase4State,
                    currentQuestionIndex: state.phase4State.currentQuestionIndex + 1,
                    questionStartTime: Date.now(),
                },
            };
        }

        case 'PHASE4_TIMEOUT': {
            if (!state.phase4State) return state;

            const newAnswers = [...state.phase4State.answers, null];
            const newTimeTaken = [...state.phase4State.timeTaken, SOLO_SCORING.phase4.questionTimeLimit];

            return {
                ...state,
                phase4State: {
                    ...state.phase4State,
                    answers: newAnswers,
                    timeTaken: newTimeTaken,
                },
                totalQuestions: state.totalQuestions + 1,
            };
        }

        case 'ADVANCE_TO_NEXT_PHASE': {
            const nextPhaseIndex = state.currentPhaseIndex + 1;

            if (nextPhaseIndex >= SOLO_PHASE_ORDER.length) {
                // Game complete
                return {
                    ...state,
                    status: 'results',
                    currentPhaseIndex: nextPhaseIndex,
                    endedAt: Date.now(),
                    totalTimeMs: Date.now() - (state.startedAt || Date.now()),
                };
            }

            const nextPhase = SOLO_PHASE_ORDER[nextPhaseIndex];

            // Check if we have ENOUGH questions for next phase (not just existence)
            // Note: nextPhase is 'phase1' | 'phase2' | 'phase4' from SOLO_PHASE_ORDER
            const questionsReady = nextPhase && hasEnoughQuestions(state.customQuestions, nextPhase);

            if (!questionsReady && (nextPhase === 'phase2' || nextPhase === 'phase4')) {
                // Questions not ready (missing or insufficient) - enter waiting state
                return {
                    ...state,
                    status: 'waiting_for_phase',
                    pendingPhase: nextPhase,
                    currentPhaseIndex: nextPhaseIndex,
                };
            }

            // Questions ready - proceed normally
            const newState: SoloGameState = {
                ...state,
                status: nextPhase,
                currentPhaseIndex: nextPhaseIndex,
            };

            // Initialize next phase state
            if (nextPhase === 'phase2') {
                newState.phase2State = {
                    currentItemIndex: 0,
                    answers: [],
                    correctCount: 0,
                };
            } else if (nextPhase === 'phase4') {
                newState.phase4State = {
                    currentQuestionIndex: 0,
                    answers: [],
                    timeTaken: [],
                    score: 0,
                    questionStartTime: Date.now(),
                };
            }

            return newState;
        }

        case 'END_GAME':
            return {
                ...state,
                status: 'results',
                endedAt: Date.now(),
                totalTimeMs: Date.now() - (state.startedAt || Date.now()),
            };

        case 'RESET_GAME':
            return createInitialSoloState(state.playerId, state.playerName, state.playerAvatar, state.difficulty);

        default:
            return state;
    }
}

// === CONTEXT ===

interface SoloGameContextValue {
    state: SoloGameState;
    // Player setup
    setPlayerInfo: (playerId: string, playerName: string, playerAvatar: Avatar) => void;
    // Game flow
    startGame: () => Promise<void>;
    resetGame: () => void;
    // Phase 1 actions - now async for CF validation (#83)
    submitPhase1Answer: (answerIndex: number) => Promise<void>;
    nextPhase1Question: () => void;
    // Phase 2 actions - now async for CF validation (#83)
    submitPhase2Answer: (answer: 'A' | 'B' | 'Both') => Promise<void>;
    nextPhase2Item: () => void;
    // Phase 4 actions - now async for CF validation (#83)
    submitPhase4Answer: (answerIndex: number) => Promise<void>;
    nextPhase4Question: () => void;
    handlePhase4Timeout: () => void;
    // Phase transitions
    advanceToNextPhase: () => void;
    endGame: () => void;
    // Background generation retry
    retryBackgroundGeneration: (phase: 'phase2' | 'phase4') => Promise<void>;
    // Debug: Skip to phase (dev only)
    skipToPhase: (phase: SoloPhaseStatus) => void;
}

const SoloGameContext = createContext<SoloGameContextValue | null>(null);

// === PROVIDER ===

interface SoloGameProviderProps {
    children: ReactNode;
    initialPlayerId?: string;
    initialPlayerName?: string;
    initialPlayerAvatar?: Avatar;
    initialDifficulty?: Difficulty;
}

export function SoloGameProvider({
    children,
    initialPlayerId = '',
    initialPlayerName = '',
    initialPlayerAvatar = 'burger',
    initialDifficulty = 'normal',
}: SoloGameProviderProps) {
    const { i18n } = useTranslation();
    const [state, dispatch] = useReducer(
        soloGameReducer,
        createInitialSoloState(initialPlayerId, initialPlayerName, initialPlayerAvatar, initialDifficulty)
    );

    // Ref for background generation abort controller
    const backgroundAbortRef = useRef<AbortController | null>(null);
    // Ref to store seenIds for retry
    const seenIdsRef = useRef<Set<string>>(new Set());
    // Ref to store current language for AI generation
    const languageRef = useRef(toGameLanguage(i18n.language));
    // Ref for solo session Firebase listener (#83)
    const soloSessionRef = useRef<ReturnType<typeof ref> | null>(null);

    // Keep language ref updated
    useEffect(() => {
        languageRef.current = toGameLanguage(i18n.language);
    }, [i18n.language]);

    // Helper: Generate a phase with retries (silent retry on failure)
    const generatePhaseWithRetries = useCallback(async (
        phase: 'phase1' | 'phase2' | 'phase4',
        seenIds: Set<string>,
        signal: AbortSignal,
        difficulty: Difficulty,
        maxRetries = 3
    ): Promise<unknown> => {
        const language = languageRef.current;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            if (signal.aborted) throw new Error('Generation cancelled');

            try {
                // Try Firestore cache first (fast path) - only for French since stored questions are in French
                // For other languages, skip cache and use AI generation directly
                if (language === 'fr') {
                    const storedSet = await getRandomQuestionSet(phase, seenIds);
                    if (storedSet) {
                        return phase === 'phase2'
                            ? storedSet.questions as unknown as SimplePhase2Set
                            : storedSet.questions;
                    }
                }

                // Fall back to AI generation with difficulty and language
                const result = await generateWithRetry({ phase, soloMode: true, difficulty, language });

                // Filter generated questions by seenIds (client-side safety filter)
                const { filterUnseenQuestions } = await import('../services/historyService');
                let filteredData = result.data;

                if (phase === 'phase1' && Array.isArray(filteredData)) {
                    filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);

                    // Check if we need completion after filtering
                    const minRequired = MINIMUM_QUESTION_COUNTS.phase1;
                    const currentCount = (filteredData as unknown[]).length;
                    if (currentCount < minRequired) {
                        const missingCount = minRequired - currentCount;
                        const completionResult = await generateWithRetry({
                            phase: 'phase1',
                            soloMode: true,
                            difficulty,
                            language,
                            completeCount: missingCount,
                            existingQuestions: filteredData as unknown[]
                        });
                        if (Array.isArray(completionResult.data)) {
                            const completionFiltered = await filterUnseenQuestions(
                                completionResult.data as { text: string }[],
                                (q: { text: string }) => q.text
                            );
                            filteredData = [...(filteredData as unknown[]), ...completionFiltered];
                        }
                    }
                } else if (phase === 'phase2' && (filteredData as { items?: unknown[] })?.items) {
                    const setData = filteredData as { items: { text: string }[] };
                    const filteredItems = await filterUnseenQuestions(setData.items, (item: { text: string }) => item.text);
                    filteredData = { ...setData, items: filteredItems };

                    // Check if we need completion after filtering
                    const minRequired = MINIMUM_QUESTION_COUNTS.phase2;
                    const currentCount = filteredItems.length;
                    if (currentCount < minRequired) {
                        const missingCount = minRequired - currentCount;
                        const completionResult = await generateWithRetry({
                            phase: 'phase2',
                            soloMode: true,
                            difficulty,
                            language,
                            completeCount: missingCount,
                            existingQuestions: filteredItems
                        });
                        if ((completionResult.data as { items?: unknown[] })?.items) {
                            const completionItems = (completionResult.data as { items: { text: string }[] }).items;
                            const completionFiltered = await filterUnseenQuestions(completionItems, (item: { text: string }) => item.text);
                            filteredData = { ...setData, items: [...filteredItems, ...completionFiltered] };
                        }
                    }
                    // Ensure we don't exceed the expected count
                    const phase2Items = (filteredData as { items: unknown[] }).items;
                    if (phase2Items.length > minRequired) {
                        filteredData = { ...filteredData as object, items: phase2Items.slice(0, minRequired) };
                    }
                } else if (phase === 'phase4' && Array.isArray(filteredData)) {
                    filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);

                    // Check if we need completion after filtering
                    const minRequired = MINIMUM_QUESTION_COUNTS.phase4;
                    const currentCount = (filteredData as unknown[]).length;
                    if (currentCount < minRequired) {
                        const missingCount = minRequired - currentCount;
                        const completionResult = await generateWithRetry({
                            phase: 'phase4',
                            soloMode: true,
                            difficulty,
                            language,
                            completeCount: missingCount,
                            existingQuestions: filteredData as unknown[]
                        });
                        if (Array.isArray(completionResult.data)) {
                            const completionFiltered = await filterUnseenQuestions(
                                completionResult.data as { text: string }[],
                                (q: { text: string }) => q.text
                            );
                            filteredData = [...(filteredData as unknown[]), ...completionFiltered];
                        }
                    }
                }

                return filteredData;
            } catch (error) {
                lastError = error as Error;

                if (attempt < maxRetries && !signal.aborted) {
                    await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
                }
            }
        }

        throw lastError || new Error(`${phase} generation failed after ${maxRetries} attempts`);
    }, []);

    // Helper: Load player history
    const loadPlayerHistory = useCallback(async (playerId: string): Promise<Set<string>> => {
        const seenIds = new Set<string>();
        try {
            const historySnap = await get(child(ref(rtdb), `userHistory/${playerId}`));
            if (historySnap.exists()) {
                Object.keys(historySnap.val()).forEach(id => seenIds.add(id));
            }
        } catch {
            // Ignore history fetch errors - player may not have history yet
        }
        return seenIds;
    }, []);

    // NOTE: Background generation for P2/P4 is now handled by CF via Pub/Sub (#83)
    // The startGame CF triggers generatePhaseQuestions which generates all phases server-side

    // Player setup
    const setPlayerInfo = useCallback((playerId: string, playerName: string, playerAvatar: Avatar) => {
        dispatch({ type: 'SET_PLAYER_INFO', playerId, playerName, playerAvatar });
    }, []);

    // Start game: Create solo session and call startGame CF (#83)
    // The CF handles question generation and stores them in soloSessions/{playerId}/
    const startGame = useCallback(async () => {
        dispatch({ type: 'START_GENERATION' });

        const playerId = state.playerId;
        const difficulty = state.difficulty;
        const language = languageRef.current;

        try {
            // Load player history for local deduplication hints
            const seenIds = await loadPlayerHistory(playerId);
            seenIdsRef.current = seenIds;


            // 1. Create solo session entry in RTDB (required for CF to verify ownership)
            const sessionRef = ref(rtdb, `soloSessions/${playerId}`);
            await set(sessionRef, {
                playerId,
                playerName: state.playerName,
                playerAvatar: state.playerAvatar,
                difficulty,
                language,
                createdAt: Date.now(),
                hostId: playerId, // For CF compatibility (verifyHost checks hostId)
                players: {
                    [playerId]: {
                        id: playerId,
                        name: state.playerName,
                        avatar: state.playerAvatar,
                        team: 'spicy', // Solo player is always spicy team
                        isHost: true,
                        score: 0,
                        joinedAt: Date.now(),
                        isOnline: true,
                    }
                }
            });


            // 2. Call startGame CF - this generates P1 and triggers P2-P5 background generation
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'generating' });

            const result = await startGameCF(playerId, 'solo', difficulty, language);

            if (!result.success) {
                throw new Error(result.error || 'Failed to start game');
            }


            // 3. Subscribe to solo session state for real-time updates
            const stateRef = ref(rtdb, `soloSessions/${playerId}`);
            onValue(stateRef, (snapshot) => {
                if (!snapshot.exists()) return;

                const sessionData = snapshot.val();

                // Update questions from CF-generated data
                if (sessionData.customQuestions) {
                    if (sessionData.customQuestions.phase1) {
                        dispatch({ type: 'SET_QUESTIONS', phase: 'phase1', questions: sessionData.customQuestions.phase1 });
                        dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'done' });
                    }
                    if (sessionData.customQuestions.phase2) {
                        dispatch({ type: 'BACKGROUND_GEN_DONE', phase: 'phase2', questions: sessionData.customQuestions.phase2 });
                    }
                    if (sessionData.customQuestions.phase4) {
                        dispatch({ type: 'BACKGROUND_GEN_DONE', phase: 'phase4', questions: sessionData.customQuestions.phase4 });
                    }
                }

                // Update generation status from CF
                if (sessionData.generationStatus) {
                    const status = sessionData.generationStatus;
                    if (status.phases) {
                        for (const phaseStatus of status.phases) {
                            if (phaseStatus.phase === 'phase2' && phaseStatus.generated) {
                                dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase2', status: 'done' });
                            }
                            if (phaseStatus.phase === 'phase4' && phaseStatus.generated) {
                                dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase4', status: 'done' });
                            }
                        }
                    }
                }
            });

            // Store the session ref for cleanup
            soloSessionRef.current = stateRef;

            // 4. Start the game immediately with Phase 1 (CF has generated it)
            dispatch({ type: 'PHASE1_READY' });

            // Mark P2/P4 as generating (they'll be updated when CF completes them)
            dispatch({ type: 'BACKGROUND_GEN_START', phase: 'phase2' });
            dispatch({ type: 'BACKGROUND_GEN_START', phase: 'phase4' });

        } catch (error) {
            console.error('[SOLO] Game start failed:', error);
            dispatch({
                type: 'GENERATION_ERROR',
                error: error instanceof Error ? error.message : 'Impossible de démarrer la partie. Veuillez réessayer.',
            });
        }
    }, [state.playerId, state.playerName, state.playerAvatar, state.difficulty, loadPlayerHistory]);

    // Retry background generation for a specific phase (used when waiting_for_phase with error)
    const retryBackgroundGeneration = useCallback(async (phase: 'phase2' | 'phase4') => {
        dispatch({ type: 'BACKGROUND_GEN_START', phase });

        try {
            const seenIds = seenIdsRef.current;
            const questions = await generatePhaseWithRetries(phase, seenIds, new AbortController().signal, state.difficulty, 3);
            dispatch({ type: 'BACKGROUND_GEN_DONE', phase, questions });
        } catch (error) {
            dispatch({ type: 'BACKGROUND_GEN_ERROR', phase, error: (error as Error).message });
        }
    }, [generatePhaseWithRetries, state.difficulty]);

    // Effect: Auto-transition from waiting_for_phase when ENOUGH questions become available
    useEffect(() => {
        if (state.status === 'waiting_for_phase' && state.pendingPhase) {
            const questionsReady = hasEnoughQuestions(state.customQuestions, state.pendingPhase);
            if (questionsReady) {
                dispatch({ type: 'EXIT_WAITING' });
            }
        }
    }, [state.status, state.pendingPhase, state.customQuestions]);

    // Effect: Cleanup background generation and Firebase listener on unmount
    useEffect(() => {
        return () => {
            if (backgroundAbortRef.current) {
                backgroundAbortRef.current.abort();
                backgroundAbortRef.current = null;
            }
            // Cleanup Firebase listener (#83)
            if (soloSessionRef.current) {
                off(soloSessionRef.current);
                soloSessionRef.current = null;
            }
        };
    }, []);

    // Reset game
    const resetGame = useCallback(() => {
        dispatch({ type: 'RESET_GAME' });
    }, []);

    // Phase 1 actions - Uses submitAnswer CF for server-side validation (#83)
    const submitPhase1Answer = useCallback(async (answerIndex: number) => {
        if (!state.phase1State) return;

        const playerId = state.playerId;
        const questionIndex = state.phase1State.currentQuestionIndex;

        console.log(`[SOLO] submitPhase1Answer called: playerId=${playerId}, qIdx=${questionIndex}, answer=${answerIndex}`);

        try {
            // Call CF for server-side validation
            const result = await submitAnswerCF(
                playerId,
                'phase1',
                questionIndex,
                answerIndex,
                Date.now()
            );

            console.log(`[SOLO] CF result:`, result);

            const isCorrect = result.isCorrect;
            // CF returns correctAnswer for revealed answers (#72)
            const correctIndex = typeof result.correctAnswer === 'number' ? result.correctAnswer : answerIndex;
            console.log(`[SOLO] Dispatching: isCorrect=${isCorrect}, correctIndex=${correctIndex}`);
            dispatch({ type: 'SUBMIT_PHASE1_ANSWER', answerIndex, isCorrect, correctIndex });

        } catch (error) {
            console.error('[SOLO] submitPhase1Answer CF error:', error);
            // Fallback: mark as incorrect, use player's answer as dummy correctIndex
            dispatch({ type: 'SUBMIT_PHASE1_ANSWER', answerIndex, isCorrect: false, correctIndex: -1 });
        }
    }, [state.playerId, state.phase1State]);

    const nextPhase1Question = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE1_QUESTION' });
    }, []);

    // Phase 2 actions - Uses submitAnswer CF for server-side validation (#83)
    const submitPhase2Answer = useCallback(async (answer: 'A' | 'B' | 'Both') => {
        if (!state.phase2State) return;

        const playerId = state.playerId;
        const questionIndex = state.phase2State.currentItemIndex;

        try {
            // Call CF for server-side validation
            const result = await submitAnswerCF(
                playerId,
                'phase2',
                questionIndex,
                answer,
                Date.now()
            );

            const isCorrect = result.isCorrect;
            // CF returns correctAnswer for revealed answers (#72)
            const correctAnswer = (result.correctAnswer as 'A' | 'B' | 'Both') || answer;
            dispatch({ type: 'SUBMIT_PHASE2_ANSWER', answer, isCorrect, correctAnswer });

        } catch (error) {
            console.error('[SOLO] submitPhase2Answer CF error:', error);
            // Fallback: mark as incorrect, use player's answer as dummy correctAnswer
            dispatch({ type: 'SUBMIT_PHASE2_ANSWER', answer, isCorrect: false, correctAnswer: answer });
        }
    }, [state.playerId, state.phase2State]);

    const nextPhase2Item = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE2_ITEM' });
    }, []);

    // Phase 4 actions - Uses submitAnswer CF for server-side validation (#83)
    const submitPhase4Answer = useCallback(async (answerIndex: number) => {
        if (!state.phase4State) return;

        const playerId = state.playerId;
        const questionIndex = state.phase4State.currentQuestionIndex;
        const timeMs = Date.now() - (state.phase4State.questionStartTime || Date.now());
        const clientTimestamp = Date.now();

        try {
            // Call CF for server-side validation
            const result = await submitAnswerCF(
                playerId,
                'phase4',
                questionIndex,
                answerIndex,
                clientTimestamp
            );

            const isCorrect = result.isCorrect;
            // CF returns correctAnswer for revealed answers (#72)
            const correctIndex = typeof result.correctAnswer === 'number' ? result.correctAnswer : answerIndex;
            dispatch({ type: 'SUBMIT_PHASE4_ANSWER', answerIndex, isCorrect, timeMs, correctIndex });

        } catch (error) {
            console.error('[SOLO] submitPhase4Answer CF error:', error);
            // Fallback: mark as incorrect, use -1 as dummy correctIndex
            dispatch({ type: 'SUBMIT_PHASE4_ANSWER', answerIndex, isCorrect: false, timeMs, correctIndex: -1 });
        }
    }, [state.playerId, state.phase4State]);

    const nextPhase4Question = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE4_QUESTION' });
    }, []);

    const handlePhase4Timeout = useCallback(() => {
        dispatch({ type: 'PHASE4_TIMEOUT' });
    }, []);

    // Phase transitions
    const advanceToNextPhase = useCallback(() => {
        dispatch({ type: 'ADVANCE_TO_NEXT_PHASE' });
    }, []);

    const endGame = useCallback(() => {
        dispatch({ type: 'END_GAME' });
    }, []);

    // Debug: Skip directly to a phase (dev only)
    const skipToPhase = useCallback((phase: SoloPhaseStatus) => {
        dispatch({ type: 'START_PHASE', phase });
    }, []);

    const value: SoloGameContextValue = {
        state,
        setPlayerInfo,
        startGame,
        resetGame,
        submitPhase1Answer,
        nextPhase1Question,
        submitPhase2Answer,
        nextPhase2Item,
        submitPhase4Answer,
        nextPhase4Question,
        handlePhase4Timeout,
        advanceToNextPhase,
        endGame,
        retryBackgroundGeneration,
        skipToPhase,
    };

    return (
        <SoloGameContext.Provider value={value}>
            {children}
        </SoloGameContext.Provider>
    );
}

// === HOOK ===

export function useSoloGame(): SoloGameContextValue {
    const context = useContext(SoloGameContext);
    if (!context) {
        throw new Error('useSoloGame must be used within a SoloGameProvider');
    }
    return context;
}

/**
 * Creates a SoloPhaseHandlers object from context value.
 * This is passed to PhaseX components when mode='solo'.
 */
export function createSoloHandlers(context: SoloGameContextValue): SoloPhaseHandlers {
    return {
        // Phase 1
        submitPhase1Answer: context.submitPhase1Answer,
        nextPhase1Question: context.nextPhase1Question,
        // Phase 2
        submitPhase2Answer: context.submitPhase2Answer,
        nextPhase2Item: context.nextPhase2Item,
        // Phase 4
        submitPhase4Answer: context.submitPhase4Answer,
        nextPhase4Question: context.nextPhase4Question,
        handlePhase4Timeout: context.handlePhase4Timeout,
        // Transitions
        advanceToNextPhase: context.advanceToNextPhase,
        endGame: context.endGame,
    };
}

// Export types for external use
export type { SoloGameContextValue };
