/**
 * Solo Game Context
 * Manages all state for solo mode gameplay
 */
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Avatar, Question, Phase3Theme, Phase4Question } from '../types/gameTypes';
import {
    type SoloGameState,
    type SoloPhaseStatus,
    type SoloPhaseHandlers,
    createInitialSoloState,
    calculatePhase4Score,
    SOLO_PHASE_ORDER,
    SOLO_SCORING,
} from '../types/soloTypes';
import { generateWithRetry, validatePhase3Answer } from '../services/aiClient';

// === ACTION TYPES ===

type SoloGameAction =
    | { type: 'SET_PLAYER_INFO'; playerId: string; playerName: string; playerAvatar: Avatar }
    | { type: 'START_GENERATION' }
    | { type: 'SET_GENERATION_PROGRESS'; phase: 'phase1' | 'phase3' | 'phase4'; status: 'generating' | 'done' | 'error' }
    | { type: 'SET_QUESTIONS'; phase: 'phase1' | 'phase3' | 'phase4'; questions: unknown[] }
    | { type: 'GENERATION_COMPLETE' }
    | { type: 'GENERATION_ERROR'; error: string }
    | { type: 'START_PHASE'; phase: SoloPhaseStatus }
    | { type: 'SUBMIT_PHASE1_ANSWER'; answerIndex: number; isCorrect: boolean }
    | { type: 'NEXT_PHASE1_QUESTION' }
    | { type: 'SELECT_PHASE3_THEME'; themeIndex: number }
    | { type: 'SUBMIT_PHASE3_ANSWER'; answer: string; isCorrect: boolean }
    | { type: 'NEXT_PHASE3_QUESTION' }
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
                    phase3: 'generating',
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

        case 'START_PHASE': {
            const newState = { ...state, status: action.phase };

            if (action.phase === 'phase1') {
                newState.phase1State = {
                    currentQuestionIndex: 0,
                    answers: [],
                    correctCount: 0,
                    questionStartTime: Date.now(),
                };
            } else if (action.phase === 'phase3') {
                newState.phase3State = {
                    selectedThemeIndex: null,
                    currentQuestionIndex: 0,
                    answers: [],
                    correctCount: 0,
                    validationResults: [],
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

            return {
                ...state,
                phase1State: {
                    ...state.phase1State,
                    currentQuestionIndex: state.phase1State.currentQuestionIndex + 1,
                    questionStartTime: Date.now(),
                },
            };
        }

        case 'SELECT_PHASE3_THEME': {
            if (!state.phase3State) return state;

            return {
                ...state,
                phase3State: {
                    ...state.phase3State,
                    selectedThemeIndex: action.themeIndex,
                },
            };
        }

        case 'SUBMIT_PHASE3_ANSWER': {
            if (!state.phase3State) return state;

            const newCorrectCount = state.phase3State.correctCount + (action.isCorrect ? 1 : 0);
            const newAnswers = [...state.phase3State.answers, action.answer];
            const newValidationResults = [...state.phase3State.validationResults, action.isCorrect];
            const scoreIncrease = action.isCorrect ? SOLO_SCORING.phase3.correctAnswer : 0;

            return {
                ...state,
                phase3State: {
                    ...state.phase3State,
                    answers: newAnswers,
                    correctCount: newCorrectCount,
                    validationResults: newValidationResults,
                },
                totalScore: state.totalScore + scoreIncrease,
                phaseScores: {
                    ...state.phaseScores,
                    phase3: state.phaseScores.phase3 + scoreIncrease,
                },
                correctAnswers: state.correctAnswers + (action.isCorrect ? 1 : 0),
                totalQuestions: state.totalQuestions + 1,
            };
        }

        case 'NEXT_PHASE3_QUESTION': {
            if (!state.phase3State) return state;

            return {
                ...state,
                phase3State: {
                    ...state.phase3State,
                    currentQuestionIndex: state.phase3State.currentQuestionIndex + 1,
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
            const newState: SoloGameState = {
                ...state,
                status: nextPhase,
                currentPhaseIndex: nextPhaseIndex,
            };

            // Initialize next phase state
            if (nextPhase === 'phase3') {
                newState.phase3State = {
                    selectedThemeIndex: null,
                    currentQuestionIndex: 0,
                    answers: [],
                    correctCount: 0,
                    validationResults: [],
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
            return createInitialSoloState(state.playerId, state.playerName, state.playerAvatar);

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
    // Phase 3 actions
    selectPhase3Theme: (themeIndex: number) => void;
    submitPhase3Answer: (answer: string) => Promise<boolean>;
    nextPhase3Question: () => void;
    // Phase 4 actions
    submitPhase4Answer: (answerIndex: number) => void;
    nextPhase4Question: () => void;
    handlePhase4Timeout: () => void;
    // Phase transitions
    advanceToNextPhase: () => void;
    endGame: () => void;
}

const SoloGameContext = createContext<SoloGameContextValue | null>(null);

// === PROVIDER ===

interface SoloGameProviderProps {
    children: ReactNode;
    initialPlayerId?: string;
    initialPlayerName?: string;
    initialPlayerAvatar?: Avatar;
}

export function SoloGameProvider({
    children,
    initialPlayerId = '',
    initialPlayerName = '',
    initialPlayerAvatar = 'burger',
}: SoloGameProviderProps) {
    const [state, dispatch] = useReducer(
        soloGameReducer,
        createInitialSoloState(initialPlayerId, initialPlayerName, initialPlayerAvatar)
    );

    // Player setup
    const setPlayerInfo = useCallback((playerId: string, playerName: string, playerAvatar: Avatar) => {
        dispatch({ type: 'SET_PLAYER_INFO', playerId, playerName, playerAvatar });
    }, []);

    // Start game with AI question generation
    const startGame = useCallback(async () => {
        dispatch({ type: 'START_GENERATION' });

        try {
            // Generate questions sequentially to avoid overwhelming the API
            // Phase 1
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'generating' });
            const phase1Result = await generateWithRetry({ phase: 'phase1' });
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase1', questions: phase1Result.data as Question[] });

            // Phase 3
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase3', status: 'generating' });
            const phase3Result = await generateWithRetry({ phase: 'phase3' });
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase3', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase3', questions: phase3Result.data as Phase3Theme[] });

            // Phase 4
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase4', status: 'generating' });
            const phase4Result = await generateWithRetry({ phase: 'phase4' });
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase4', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase4', questions: phase4Result.data as Phase4Question[] });

            console.log('[SOLO] Questions generated successfully', {
                phase1: Array.isArray(phase1Result.data) ? phase1Result.data.length : 0,
                phase3: Array.isArray(phase3Result.data) ? phase3Result.data.length : 0,
                phase4: Array.isArray(phase4Result.data) ? phase4Result.data.length : 0,
            });

            dispatch({ type: 'GENERATION_COMPLETE' });
        } catch (error) {
            console.error('[SOLO] Question generation failed:', error);
            dispatch({
                type: 'GENERATION_ERROR',
                error: 'Impossible de générer les questions. Veuillez réessayer.',
            });
        }
    }, []);

    // Reset game
    const resetGame = useCallback(() => {
        dispatch({ type: 'RESET_GAME' });
    }, []);

    // Phase 1 actions
    const submitPhase1Answer = useCallback((answerIndex: number) => {
        const questions = state.customQuestions.phase1;
        if (!questions || !state.phase1State) return;

        const currentQuestion = questions[state.phase1State.currentQuestionIndex];
        if (!currentQuestion) return;

        const isCorrect = answerIndex === currentQuestion.correctIndex;
        dispatch({ type: 'SUBMIT_PHASE1_ANSWER', answerIndex, isCorrect });
    }, [state.customQuestions.phase1, state.phase1State]);

    const nextPhase1Question = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE1_QUESTION' });
    }, []);

    // Phase 3 actions
    const selectPhase3Theme = useCallback((themeIndex: number) => {
        dispatch({ type: 'SELECT_PHASE3_THEME', themeIndex });
    }, []);

    const submitPhase3Answer = useCallback(async (answer: string): Promise<boolean> => {
        const themes = state.customQuestions.phase3;
        if (!themes || !state.phase3State || state.phase3State.selectedThemeIndex === null) {
            return false;
        }

        const theme = themes[state.phase3State.selectedThemeIndex];
        const question = theme?.questions[state.phase3State.currentQuestionIndex];
        if (!question) return false;

        try {
            // Validate answer using LLM
            const validationResult = await validatePhase3Answer({
                playerAnswer: answer,
                correctAnswer: question.answer,
                acceptableAnswers: question.acceptableAnswers,
            });

            const isCorrect = validationResult.isCorrect;
            dispatch({ type: 'SUBMIT_PHASE3_ANSWER', answer, isCorrect });
            return isCorrect;
        } catch (error) {
            console.error('[SOLO] Phase 3 answer validation failed:', error);
            // On error, mark as incorrect
            dispatch({ type: 'SUBMIT_PHASE3_ANSWER', answer, isCorrect: false });
            return false;
        }
    }, [state.customQuestions.phase3, state.phase3State]);

    const nextPhase3Question = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE3_QUESTION' });
    }, []);

    // Phase 4 actions
    const submitPhase4Answer = useCallback((answerIndex: number) => {
        const questions = state.customQuestions.phase4;
        if (!questions || !state.phase4State) return;

        const currentQuestion = questions[state.phase4State.currentQuestionIndex];
        if (!currentQuestion) return;

        const isCorrect = answerIndex === currentQuestion.correctIndex;
        const timeMs = Date.now() - (state.phase4State.questionStartTime || Date.now());

        dispatch({ type: 'SUBMIT_PHASE4_ANSWER', answerIndex, isCorrect, timeMs });
    }, [state.customQuestions.phase4, state.phase4State]);

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

    const value: SoloGameContextValue = {
        state,
        setPlayerInfo,
        startGame,
        resetGame,
        submitPhase1Answer,
        nextPhase1Question,
        selectPhase3Theme,
        submitPhase3Answer,
        nextPhase3Question,
        submitPhase4Answer,
        nextPhase4Question,
        handlePhase4Timeout,
        advanceToNextPhase,
        endGame,
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
        // Phase 3
        selectPhase3Theme: context.selectPhase3Theme,
        submitPhase3Answer: context.submitPhase3Answer,
        nextPhase3Question: context.nextPhase3Question,
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
