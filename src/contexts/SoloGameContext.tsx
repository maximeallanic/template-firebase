/**
 * Solo Game Context
 * Manages all state for solo mode gameplay
 */
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useReducer, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ref, child, get, set } from 'firebase/database';
import type { Avatar, SimplePhase2Set, Difficulty } from '../types/gameTypes';
import { toGameLanguage } from '../types/languageTypes';
import { hasEnoughQuestions, MINIMUM_QUESTION_COUNTS } from '../types/gameTypes';
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
import { rtdb, submitAnswer as submitAnswerCF } from '../services/firebase';
import type { SubmitAnswerResponse } from '../services/firebase';
import { getRandomQuestionSet } from '../services/questionStorageService';

/**
 * Sanitizes an object by removing all undefined values recursively.
 * Firebase RTDB does not accept undefined values, so we need to clean the data before storing.
 */
function sanitizeForRTDB<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForRTDB(item)) as T;
    }

    if (typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (value !== undefined) {
                result[key] = sanitizeForRTDB(value);
            }
        }
        return result as T;
    }

    return obj;
}

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
    | { type: 'SUBMIT_PHASE1_ANSWER'; answerIndex: number; isCorrect: boolean }
    | { type: 'SET_SUBMITTING'; isSubmitting: boolean } // Loading state for CF calls
    | { type: 'NEXT_PHASE1_QUESTION' }
    | { type: 'SUBMIT_PHASE2_ANSWER'; answer: 'A' | 'B' | 'Both'; isCorrect: boolean }
    | { type: 'NEXT_PHASE2_ITEM' }
    | { type: 'SUBMIT_PHASE4_ANSWER'; answerIndex: number; isCorrect: boolean; timeMs: number }
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
            const scoreIncrease = action.isCorrect ? SOLO_SCORING.phase1.correctAnswer : 0;

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
            const scoreIncrease = action.isCorrect ? SOLO_SCORING.phase2.correctAnswer : 0;

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

            const pointsEarned = action.isCorrect ? calculatePhase4Score(action.timeMs) : 0;
            const newAnswers = [...state.phase4State.answers, action.answerIndex];
            const newTimeTaken = [...state.phase4State.timeTaken, action.timeMs];

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
                console.log('[SOLO] Insufficient questions for', nextPhase, {
                    currentCount: state.customQuestions[nextPhase]
                        ? (nextPhase === 'phase2'
                            ? (state.customQuestions.phase2 as SimplePhase2Set)?.items?.length
                            : (state.customQuestions[nextPhase] as unknown[])?.length)
                        : 0,
                    required: MINIMUM_QUESTION_COUNTS[nextPhase]
                });
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

        case 'SET_SUBMITTING':
            return {
                ...state,
                isSubmitting: action.isSubmitting,
            };

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
    // Phase 1 actions
    submitPhase1Answer: (answerIndex: number) => void;
    nextPhase1Question: () => void;
    // Phase 2 actions
    submitPhase2Answer: (answer: 'A' | 'B' | 'Both') => void;
    nextPhase2Item: () => void;
    // Phase 4 actions
    submitPhase4Answer: (answerIndex: number) => void;
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
                        console.log(`[SOLO] ✅ Using Firestore questions for ${phase} (French cache)`);
                        return phase === 'phase2'
                            ? storedSet.questions as unknown as SimplePhase2Set
                            : storedSet.questions;
                    }
                } else {
                    console.log(`[SOLO] 🌍 Skipping Firestore cache for ${phase} (language: ${language})`);
                }

                // Fall back to AI generation with difficulty and language
                console.log(`[SOLO] 🤖 AI generation for ${phase} (difficulty: ${difficulty}, language: ${language}, seenIds: ${seenIds.size}, attempt ${attempt}/${maxRetries})`);
                const result = await generateWithRetry({ phase, soloMode: true, difficulty, language });

                // Filter generated questions by seenIds (client-side safety filter)
                const { filterUnseenQuestions } = await import('../services/historyService');
                let filteredData = result.data;

                if (phase === 'phase1' && Array.isArray(filteredData)) {
                    filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                    console.log(`[SOLO] Filtered phase1 questions: ${(result.data as unknown[]).length} -> ${(filteredData as unknown[]).length}`);

                    // Check if we need completion after filtering
                    const minRequired = MINIMUM_QUESTION_COUNTS.phase1;
                    const currentCount = (filteredData as unknown[]).length;
                    if (currentCount < minRequired) {
                        const missingCount = minRequired - currentCount;
                        console.log(`[SOLO] ⚠️ Phase1 needs completion: ${currentCount}/${minRequired} (missing: ${missingCount})`);
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
                            console.log(`[SOLO] ✅ Phase1 completed: ${(filteredData as unknown[]).length} questions`);
                        }
                    }
                } else if (phase === 'phase2') {
                    // Phase 2 expects { items: [...] } format
                    const rawData = filteredData as { items?: { text: string }[] };

                    if (rawData?.items && Array.isArray(rawData.items)) {
                        const setData = rawData as { items: { text: string }[] };
                        const filteredItems = await filterUnseenQuestions(setData.items, (item: { text: string }) => item.text);
                        filteredData = { ...setData, items: filteredItems };
                        console.log(`[SOLO] Filtered phase2 items: ${setData.items.length} -> ${filteredItems.length}`);

                        // Check if we need completion after filtering
                        const minRequired = MINIMUM_QUESTION_COUNTS.phase2;
                        const currentCount = filteredItems.length;
                        if (currentCount < minRequired) {
                            const missingCount = minRequired - currentCount;
                            console.log(`[SOLO] ⚠️ Phase2 needs completion: ${currentCount}/${minRequired} (missing: ${missingCount})`);
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
                                console.log(`[SOLO] ✅ Phase2 completed: ${(filteredData as { items: unknown[] }).items.length} items`);
                            }
                        }
                        // Ensure we don't exceed the expected count
                        const phase2Items = (filteredData as { items: unknown[] }).items;
                        if (phase2Items.length > minRequired) {
                            filteredData = { ...filteredData as object, items: phase2Items.slice(0, minRequired) };
                            console.log(`[SOLO] 📏 Phase2 trimmed to ${minRequired} items`);
                        }
                    } else {
                        // Invalid format - log error and throw to trigger retry
                        console.error(`[SOLO] ❌ Phase2 data missing items property:`, {
                            hasData: !!filteredData,
                            keys: filteredData ? Object.keys(filteredData as object) : [],
                        });
                        throw new Error('Phase2 generation returned invalid format (missing items array)');
                    }
                } else if (phase === 'phase4' && Array.isArray(filteredData)) {
                    filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                    console.log(`[SOLO] Filtered phase4 questions: ${(result.data as unknown[]).length} -> ${(filteredData as unknown[]).length}`);

                    // Check if we need completion after filtering
                    const minRequired = MINIMUM_QUESTION_COUNTS.phase4;
                    const currentCount = (filteredData as unknown[]).length;
                    if (currentCount < minRequired) {
                        const missingCount = minRequired - currentCount;
                        console.log(`[SOLO] ⚠️ Phase4 needs completion: ${currentCount}/${minRequired} (missing: ${missingCount})`);
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
                            console.log(`[SOLO] ✅ Phase4 completed: ${(filteredData as unknown[]).length} questions`);
                        }
                    }
                }

                return filteredData;
            } catch (error) {
                lastError = error as Error;
                console.warn(`[SOLO] ${phase}: Attempt ${attempt} failed:`, error);

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
                console.log('[SOLO] Loaded player history:', seenIds.size, 'seen questions');
            }
        } catch (e) {
            console.warn('[SOLO] Failed to get player history:', e);
        }
        return seenIds;
    }, []);

    // Start background generation for Phase 2 and Phase 4 (non-blocking, fire-and-forget)
    const startBackgroundGeneration = useCallback((seenIds: Set<string>, difficulty: Difficulty, playerId: string) => {
        const abort = new AbortController();
        backgroundAbortRef.current = abort;

        // Phase 2 (fire-and-forget)
        dispatch({ type: 'BACKGROUND_GEN_START', phase: 'phase2' });
        generatePhaseWithRetries('phase2', seenIds, abort.signal, difficulty, 3)
            .then(async questions => {
                if (!abort.signal.aborted) {
                    console.log('[SOLO] ✅ Background phase2 ready');
                    // Store Phase 2 questions in gameData for CF validation
                    // Sanitize to remove undefined values (RTDB doesn't accept undefined)
                    const gameDataRef = ref(rtdb, `gameData/${playerId}/phase2`);
                    await set(gameDataRef, sanitizeForRTDB(questions));
                    console.log('[SOLO] Phase 2 questions stored in gameData for CF validation');
                    dispatch({ type: 'BACKGROUND_GEN_DONE', phase: 'phase2', questions });
                }
            })
            .catch(error => {
                if (!abort.signal.aborted) {
                    console.error('[SOLO] ❌ Background phase2 failed:', error);
                    dispatch({ type: 'BACKGROUND_GEN_ERROR', phase: 'phase2', error: (error as Error).message });
                }
            });

        // Phase 4 (fire-and-forget, runs in parallel with Phase 2)
        dispatch({ type: 'BACKGROUND_GEN_START', phase: 'phase4' });
        generatePhaseWithRetries('phase4', seenIds, abort.signal, difficulty, 3)
            .then(async questions => {
                if (!abort.signal.aborted) {
                    console.log('[SOLO] ✅ Background phase4 ready');
                    // Store Phase 4 questions in gameData for CF validation
                    // Sanitize to remove undefined values (RTDB doesn't accept undefined)
                    const gameDataRef = ref(rtdb, `gameData/${playerId}/phase4`);
                    await set(gameDataRef, sanitizeForRTDB(questions));
                    console.log('[SOLO] Phase 4 questions stored in gameData for CF validation');
                    dispatch({ type: 'BACKGROUND_GEN_DONE', phase: 'phase4', questions });
                }
            })
            .catch(error => {
                if (!abort.signal.aborted) {
                    console.error('[SOLO] ❌ Background phase4 failed:', error);
                    dispatch({ type: 'BACKGROUND_GEN_ERROR', phase: 'phase4', error: (error as Error).message });
                }
            });
    }, [generatePhaseWithRetries]);

    // Player setup
    const setPlayerInfo = useCallback((playerId: string, playerName: string, playerAvatar: Avatar) => {
        dispatch({ type: 'SET_PLAYER_INFO', playerId, playerName, playerAvatar });
    }, []);

    // Start game: Generate Phase 1 (blocking), then start background generation for Phase 2 & 4
    const startGame = useCallback(async () => {
        dispatch({ type: 'START_GENERATION' });

        try {
            // Load player history
            const seenIds = await loadPlayerHistory(state.playerId);
            seenIdsRef.current = seenIds;

            const difficulty = state.difficulty;
            console.log(`[SOLO] Starting game with difficulty: ${difficulty}`);

            // Phase 1 only (blocking) - game starts as soon as this is ready
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'generating' });
            const phase1Questions = await generatePhaseWithRetries('phase1', seenIds, new AbortController().signal, difficulty, 3);
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase1', questions: phase1Questions });

            // Store Phase 1 questions in gameData for CF validation
            // roomId = playerId in solo mode
            // Sanitize to remove undefined values (RTDB doesn't accept undefined)
            const gameDataRef = ref(rtdb, `gameData/${state.playerId}/phase1`);
            await set(gameDataRef, sanitizeForRTDB(phase1Questions));
            console.log('[SOLO] Phase 1 questions stored in gameData for CF validation');

            console.log('[SOLO] Phase 1 ready - starting game immediately');

            // Start the game immediately with Phase 1
            dispatch({ type: 'PHASE1_READY' });

            // Start background generation for Phase 2 & 4 (non-blocking)
            startBackgroundGeneration(seenIds, difficulty, state.playerId);
        } catch (error) {
            console.error('[SOLO] Phase 1 generation failed:', error);
            dispatch({
                type: 'GENERATION_ERROR',
                error: 'Impossible de charger les questions. Veuillez réessayer.',
            });
        }
    }, [state.playerId, state.difficulty, loadPlayerHistory, generatePhaseWithRetries, startBackgroundGeneration]);

    // Retry background generation for a specific phase (used when waiting_for_phase with error)
    const retryBackgroundGeneration = useCallback(async (phase: 'phase2' | 'phase4') => {
        dispatch({ type: 'BACKGROUND_GEN_START', phase });

        try {
            const seenIds = seenIdsRef.current;
            const questions = await generatePhaseWithRetries(phase, seenIds, new AbortController().signal, state.difficulty, 3);
            // Store questions in gameData for CF validation
            // Sanitize to remove undefined values (RTDB doesn't accept undefined)
            const gameDataRef = ref(rtdb, `gameData/${state.playerId}/${phase}`);
            await set(gameDataRef, sanitizeForRTDB(questions));
            console.log(`[SOLO] ${phase} questions stored in gameData for CF validation (retry)`);
            dispatch({ type: 'BACKGROUND_GEN_DONE', phase, questions });
        } catch (error) {
            dispatch({ type: 'BACKGROUND_GEN_ERROR', phase, error: (error as Error).message });
        }
    }, [generatePhaseWithRetries, state.difficulty, state.playerId]);

    // Effect: Auto-transition from waiting_for_phase when ENOUGH questions become available
    useEffect(() => {
        if (state.status === 'waiting_for_phase' && state.pendingPhase) {
            const questionsReady = hasEnoughQuestions(state.customQuestions, state.pendingPhase);
            if (questionsReady) {
                console.log(`[SOLO] Enough questions ready for ${state.pendingPhase} - transitioning`);
                dispatch({ type: 'EXIT_WAITING' });
            }
        }
    }, [state.status, state.pendingPhase, state.customQuestions]);

    // Effect: Cleanup background generation on unmount
    useEffect(() => {
        return () => {
            if (backgroundAbortRef.current) {
                backgroundAbortRef.current.abort();
                backgroundAbortRef.current = null;
            }
        };
    }, []);

    // Reset game
    const resetGame = useCallback(() => {
        dispatch({ type: 'RESET_GAME' });
    }, []);

    // Phase 1 actions - now uses Cloud Function for server-side validation
    const submitPhase1Answer = useCallback(async (answerIndex: number) => {
        if (!state.phase1State || state.isSubmitting) return;

        const questionIndex = state.phase1State.currentQuestionIndex;

        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

        try {
            // Call Cloud Function for validation (roomId = playerId in solo mode)
            const result: SubmitAnswerResponse = await submitAnswerCF({
                roomId: state.playerId,
                phase: 'phase1',
                questionIndex,
                answer: answerIndex,
                clientTimestamp: Date.now(),
                isSolo: true,
            });

            if (result.success) {
                dispatch({ type: 'SUBMIT_PHASE1_ANSWER', answerIndex, isCorrect: result.correct });
            } else {
                console.error('[SOLO] Phase 1 CF validation failed:', result.message);
                // Fallback: still update UI to prevent stuck state
                dispatch({ type: 'SUBMIT_PHASE1_ANSWER', answerIndex, isCorrect: false });
            }
        } catch (error) {
            console.error('[SOLO] Phase 1 CF call failed:', error);
            // Fallback: still update UI to prevent stuck state
            dispatch({ type: 'SUBMIT_PHASE1_ANSWER', answerIndex, isCorrect: false });
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    }, [state.phase1State, state.playerId, state.isSubmitting]);

    const nextPhase1Question = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE1_QUESTION' });
    }, []);

    // Phase 2 actions - now uses Cloud Function for server-side validation
    const submitPhase2Answer = useCallback(async (answer: 'A' | 'B' | 'Both') => {
        if (!state.phase2State || state.isSubmitting) return;

        const questionIndex = state.phase2State.currentItemIndex;

        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

        try {
            // Call Cloud Function for validation (roomId = playerId in solo mode)
            const result: SubmitAnswerResponse = await submitAnswerCF({
                roomId: state.playerId,
                phase: 'phase2',
                questionIndex,
                answer,
                clientTimestamp: Date.now(),
                isSolo: true,
            });

            if (result.success) {
                dispatch({ type: 'SUBMIT_PHASE2_ANSWER', answer, isCorrect: result.correct });
            } else {
                console.error('[SOLO] Phase 2 CF validation failed:', result.message);
                dispatch({ type: 'SUBMIT_PHASE2_ANSWER', answer, isCorrect: false });
            }
        } catch (error) {
            console.error('[SOLO] Phase 2 CF call failed:', error);
            dispatch({ type: 'SUBMIT_PHASE2_ANSWER', answer, isCorrect: false });
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    }, [state.phase2State, state.playerId, state.isSubmitting]);

    const nextPhase2Item = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE2_ITEM' });
    }, []);

    // Phase 4 actions - now uses Cloud Function for server-side validation
    const submitPhase4Answer = useCallback(async (answerIndex: number) => {
        if (!state.phase4State || state.isSubmitting) return;

        const questionIndex = state.phase4State.currentQuestionIndex;
        const timeMs = Date.now() - (state.phase4State.questionStartTime || Date.now());

        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

        try {
            // Call Cloud Function for validation (roomId = playerId in solo mode)
            const result: SubmitAnswerResponse = await submitAnswerCF({
                roomId: state.playerId,
                phase: 'phase4',
                questionIndex,
                answer: answerIndex,
                clientTimestamp: Date.now(),
                isSolo: true,
            });

            if (result.success) {
                dispatch({ type: 'SUBMIT_PHASE4_ANSWER', answerIndex, isCorrect: result.correct, timeMs });
            } else {
                console.error('[SOLO] Phase 4 CF validation failed:', result.message);
                dispatch({ type: 'SUBMIT_PHASE4_ANSWER', answerIndex, isCorrect: false, timeMs });
            }
        } catch (error) {
            console.error('[SOLO] Phase 4 CF call failed:', error);
            dispatch({ type: 'SUBMIT_PHASE4_ANSWER', answerIndex, isCorrect: false, timeMs });
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    }, [state.phase4State, state.playerId, state.isSubmitting]);

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
