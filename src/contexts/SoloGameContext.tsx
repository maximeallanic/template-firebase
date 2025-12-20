/**
 * Solo Game Context
 * Manages all state for solo mode gameplay
 */
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { ref, child, get } from 'firebase/database';
import type { Avatar, Question, SimplePhase2Set, Phase4Question } from '../types/gameTypes';
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
import { rtdb } from '../services/firebase';
import { getRandomQuestionSet } from '../services/questionStorageService';

// === ACTION TYPES ===

type SoloGameAction =
    | { type: 'SET_PLAYER_INFO'; playerId: string; playerName: string; playerAvatar: Avatar }
    | { type: 'START_GENERATION' }
    | { type: 'SET_GENERATION_PROGRESS'; phase: 'phase1' | 'phase2' | 'phase4'; status: 'generating' | 'done' | 'error' }
    | { type: 'SET_QUESTIONS'; phase: 'phase1' | 'phase2' | 'phase4'; questions: unknown }
    | { type: 'GENERATION_COMPLETE' }
    | { type: 'GENERATION_ERROR'; error: string }
    | { type: 'START_PHASE'; phase: SoloPhaseStatus }
    | { type: 'SUBMIT_PHASE1_ANSWER'; answerIndex: number; isCorrect: boolean }
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

        case 'START_PHASE': {
            const newState = { ...state, status: action.phase };

            if (action.phase === 'phase1') {
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

            return {
                ...state,
                phase1State: {
                    ...state.phase1State,
                    currentQuestionIndex: state.phase1State.currentQuestionIndex + 1,
                    questionStartTime: Date.now(),
                },
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

    // Start game with Firestore-first question loading (like multiplayer mode)
    const startGame = useCallback(async () => {
        dispatch({ type: 'START_GENERATION' });

        try {
            // Build seenIds from player history (like multiplayer mode)
            const seenIds = new Set<string>();
            try {
                const historySnap = await get(child(ref(rtdb), `userHistory/${state.playerId}`));
                if (historySnap.exists()) {
                    Object.keys(historySnap.val()).forEach(id => seenIds.add(id));
                    console.log('[SOLO] Loaded player history:', seenIds.size, 'seen questions');
                }
            } catch (e) {
                console.warn('[SOLO] Failed to get player history:', e);
            }

            // Phase 1 - Try Firestore first, then AI
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'generating' });
            let phase1Questions: Question[];
            const storedPhase1 = await getRandomQuestionSet('phase1', seenIds);
            if (storedPhase1) {
                console.log('[SOLO] ✅ Using Firestore questions for phase1:', storedPhase1.questions.length);
                phase1Questions = storedPhase1.questions as Question[];
            } else {
                console.log('[SOLO] 🤖 Generating AI questions for phase1...');
                const result = await generateWithRetry({ phase: 'phase1', soloMode: true });
                phase1Questions = result.data as Question[];
            }
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase1', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase1', questions: phase1Questions });

            // Phase 2 - Try Firestore first, then AI
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase2', status: 'generating' });
            let phase2Questions: SimplePhase2Set;
            const storedPhase2 = await getRandomQuestionSet('phase2', seenIds);
            if (storedPhase2) {
                console.log('[SOLO] ✅ Using Firestore questions for phase2');
                // getRandomQuestionSet returns SimplePhase2Set structure for phase2
                phase2Questions = storedPhase2.questions as unknown as SimplePhase2Set;
            } else {
                console.log('[SOLO] 🤖 Generating AI questions for phase2...');
                const result = await generateWithRetry({ phase: 'phase2', soloMode: true });
                phase2Questions = result.data as unknown as SimplePhase2Set;
            }
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase2', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase2', questions: phase2Questions });

            // Phase 4 - Try Firestore first, then AI
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase4', status: 'generating' });
            let phase4Questions: Phase4Question[];
            const storedPhase4 = await getRandomQuestionSet('phase4', seenIds);
            if (storedPhase4) {
                console.log('[SOLO] ✅ Using Firestore questions for phase4');
                phase4Questions = storedPhase4.questions as Phase4Question[];
            } else {
                console.log('[SOLO] 🤖 Generating AI questions for phase4...');
                const result = await generateWithRetry({ phase: 'phase4', soloMode: true });
                phase4Questions = result.data as Phase4Question[];
            }
            dispatch({ type: 'SET_GENERATION_PROGRESS', phase: 'phase4', status: 'done' });
            dispatch({ type: 'SET_QUESTIONS', phase: 'phase4', questions: phase4Questions });

            console.log('[SOLO] Questions loaded successfully', {
                phase1: phase1Questions.length,
                phase2: phase2Questions?.items?.length ?? 0,
                phase4: phase4Questions.length,
            });

            dispatch({ type: 'GENERATION_COMPLETE' });
        } catch (error) {
            console.error('[SOLO] Question loading failed:', error);
            dispatch({
                type: 'GENERATION_ERROR',
                error: 'Impossible de charger les questions. Veuillez réessayer.',
            });
        }
    }, [state.playerId]);

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

    // Phase 2 actions
    const submitPhase2Answer = useCallback((answer: 'A' | 'B' | 'Both') => {
        const setData = state.customQuestions.phase2;
        if (!setData || !state.phase2State) return;

        const currentItem = setData.items[state.phase2State.currentItemIndex];
        if (!currentItem) return;

        // Check if answer is correct (including accepted alternatives)
        const isCorrect = answer === currentItem.answer ||
            (currentItem.acceptedAnswers?.includes(answer) ?? false);

        dispatch({ type: 'SUBMIT_PHASE2_ANSWER', answer, isCorrect });
    }, [state.customQuestions.phase2, state.phase2State]);

    const nextPhase2Item = useCallback(() => {
        dispatch({ type: 'NEXT_PHASE2_ITEM' });
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
        submitPhase2Answer,
        nextPhase2Item,
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
