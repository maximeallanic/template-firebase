/**
 * Mock Player Context
 * Manages auto-answering for mock players in debug mode
 * Stores pending answers locally until validated
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    type ReactNode
} from 'react';
import type { Room, Player, Team } from '../types/gameTypes';
import {
    generatePhase1Answer,
    generatePhase2Answer,
    generatePhase4Answer,
    type Phase2Choice
} from '../services/mockAnswerService';
import {
    submitAnswer,
    submitPhase2Answer,
    submitPhase4Answer
} from '../services/gameService';

// === Types ===

export interface MockAnswer {
    mockPlayerId: string;
    playerName: string;
    playerTeam: Team;
    phase: 'phase1' | 'phase2' | 'phase4';
    answer: number | Phase2Choice;
    generatedAt: number;
}

interface MockPlayerContextValue {
    pendingAnswers: MockAnswer[];
    isAutoAnswerEnabled: boolean;
    setAutoAnswerEnabled: (enabled: boolean) => void;
    validateAllAnswers: () => Promise<void>;
    clearPendingAnswers: () => void;
    isValidating: boolean;
}

// === Context ===

const MockPlayerContext = createContext<MockPlayerContextValue | null>(null);

// === Provider ===

interface MockPlayerProviderProps {
    room: Room;
    children: ReactNode;
}

export function MockPlayerProvider({ room, children }: MockPlayerProviderProps) {
    const [pendingAnswers, setPendingAnswers] = useState<MockAnswer[]>([]);
    const [isAutoAnswerEnabled, setAutoAnswerEnabled] = useState(true);
    const [isValidating, setIsValidating] = useState(false);

    // Track previous state to detect changes
    const prevStateRef = useRef<{
        phaseState?: string;
        phase4State?: string;
        currentPhase2Item?: number;
        currentQuestionIndex?: number;
        currentPhase4QuestionIndex?: number;
    }>({});

    // Get online mock players
    const getMockPlayers = useCallback((): Player[] => {
        if (!room?.players) return [];
        return Object.values(room.players).filter(
            p => p.id.startsWith('mock_') && p.isOnline && p.team
        );
    }, [room?.players]);

    // Generate Phase 1 answers
    const generatePhase1Answers = useCallback(() => {
        const mockPlayers = getMockPlayers();
        const blockedTeams = room.state.phase1BlockedTeams || [];
        const existingAnswers = room.state.phase1Answers || {};
        const triedWrongOptions = room.state.phase1TriedWrongOptions || [];

        const newAnswers: MockAnswer[] = [];

        for (const mock of mockPlayers) {
            // Skip if team is blocked
            if (mock.team && blockedTeams.includes(mock.team)) continue;
            // Skip if already answered
            if (mock.id in existingAnswers) continue;
            // Skip if already has pending answer
            if (pendingAnswers.some(a => a.mockPlayerId === mock.id && a.phase === 'phase1')) continue;

            const answer = generatePhase1Answer(triedWrongOptions);
            newAnswers.push({
                mockPlayerId: mock.id,
                playerName: mock.name,
                playerTeam: mock.team!,
                phase: 'phase1',
                answer,
                generatedAt: Date.now()
            });
        }

        if (newAnswers.length > 0) {
            setPendingAnswers(prev => [...prev, ...newAnswers]);
        }
    }, [getMockPlayers, room.state, pendingAnswers]);

    // Generate Phase 2 answers (team-based: 1 answer per team)
    const generatePhase2Answers = useCallback(() => {
        const mockPlayers = getMockPlayers();
        const teamAnswers = room.state.phase2TeamAnswers || {};

        const newAnswers: MockAnswer[] = [];

        for (const mock of mockPlayers) {
            // Skip if team already answered
            if (mock.team && teamAnswers[mock.team]) continue;
            // Skip if team already has pending answer
            if (pendingAnswers.some(a => a.phase === 'phase2' && a.playerTeam === mock.team)) continue;

            const answer = generatePhase2Answer();
            newAnswers.push({
                mockPlayerId: mock.id,
                playerName: mock.name,
                playerTeam: mock.team!,
                phase: 'phase2',
                answer,
                generatedAt: Date.now()
            });
        }

        if (newAnswers.length > 0) {
            setPendingAnswers(prev => [...prev, ...newAnswers]);
        }
    }, [getMockPlayers, room.state.phase2TeamAnswers, pendingAnswers]);

    // Generate Phase 4 answers
    const generatePhase4Answers = useCallback(() => {
        const mockPlayers = getMockPlayers();
        const existingAnswers = room.state.phase4Answers || {};

        const newAnswers: MockAnswer[] = [];

        for (const mock of mockPlayers) {
            // Skip if already answered
            if (mock.id in existingAnswers) continue;
            // Skip if already has pending answer
            if (pendingAnswers.some(a => a.mockPlayerId === mock.id && a.phase === 'phase4')) continue;

            const answer = generatePhase4Answer();
            newAnswers.push({
                mockPlayerId: mock.id,
                playerName: mock.name,
                playerTeam: mock.team!,
                phase: 'phase4',
                answer,
                generatedAt: Date.now()
            });
        }

        if (newAnswers.length > 0) {
            setPendingAnswers(prev => [...prev, ...newAnswers]);
        }
    }, [getMockPlayers, room.state.phase4Answers, pendingAnswers]);

    // Detect state changes and trigger answer generation
    useEffect(() => {
        if (!isAutoAnswerEnabled) return;

        const prevState = prevStateRef.current;
        const currentState = room.state;

        // Phase 1: Generate when entering 'answering' state
        if (
            currentState.status === 'phase1' &&
            currentState.phaseState === 'answering' &&
            (prevState.phaseState !== 'answering' ||
             prevState.currentQuestionIndex !== currentState.currentQuestionIndex)
        ) {
            // Small delay to ensure state is fully propagated
            setTimeout(() => generatePhase1Answers(), 100);
        }

        // Phase 2: Generate when item changes
        if (
            currentState.status === 'phase2' &&
            currentState.phaseState !== 'result' &&
            prevState.currentPhase2Item !== currentState.currentPhase2Item
        ) {
            setTimeout(() => generatePhase2Answers(), 100);
        }

        // Phase 4: Generate when in questioning state
        if (
            currentState.status === 'phase4' &&
            currentState.phase4State === 'questioning' &&
            (prevState.phase4State !== 'questioning' ||
             prevState.currentPhase4QuestionIndex !== currentState.currentPhase4QuestionIndex)
        ) {
            setTimeout(() => generatePhase4Answers(), 100);
        }

        // Update prev state ref
        prevStateRef.current = {
            phaseState: currentState.phaseState,
            phase4State: currentState.phase4State,
            currentPhase2Item: currentState.currentPhase2Item,
            currentQuestionIndex: currentState.currentQuestionIndex,
            currentPhase4QuestionIndex: currentState.currentPhase4QuestionIndex
        };
    }, [
        isAutoAnswerEnabled,
        room.state,
        generatePhase1Answers,
        generatePhase2Answers,
        generatePhase4Answers
    ]);

    // Clear pending answers when phase changes
    useEffect(() => {
        setPendingAnswers([]);
    }, [room.state.status]);

    // Validate (submit) all pending answers
    const validateAllAnswers = useCallback(async () => {
        if (pendingAnswers.length === 0 || isValidating) return;

        setIsValidating(true);

        try {
            // Submit answers with small delays to avoid race conditions
            for (const answer of pendingAnswers) {
                switch (answer.phase) {
                    case 'phase1':
                        await submitAnswer(room.code, answer.mockPlayerId, answer.answer as number);
                        break;
                    case 'phase2':
                        await submitPhase2Answer(
                            room.code,
                            answer.mockPlayerId,
                            answer.answer as Phase2Choice
                        );
                        break;
                    case 'phase4':
                        await submitPhase4Answer(room.code, answer.mockPlayerId, answer.answer as number);
                        break;
                }
                // Small delay between submissions
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            setPendingAnswers([]);
        } catch (error) {
            console.error('Failed to validate mock answers:', error);
        } finally {
            setIsValidating(false);
        }
    }, [pendingAnswers, isValidating, room.code, room.players]);

    // Clear all pending answers without submitting
    const clearPendingAnswers = useCallback(() => {
        setPendingAnswers([]);
    }, []);

    const value: MockPlayerContextValue = {
        pendingAnswers,
        isAutoAnswerEnabled,
        setAutoAnswerEnabled,
        validateAllAnswers,
        clearPendingAnswers,
        isValidating
    };

    return (
        <MockPlayerContext.Provider value={value}>
            {children}
        </MockPlayerContext.Provider>
    );
}

// === Hooks ===

// eslint-disable-next-line react-refresh/only-export-components
export function useMockPlayer(): MockPlayerContextValue {
    const context = useContext(MockPlayerContext);
    if (!context) {
        throw new Error('useMockPlayer must be used within a MockPlayerProvider');
    }
    return context;
}

// Optional hook that returns null if not in provider (for components that might be outside)
// eslint-disable-next-line react-refresh/only-export-components
export function useMockPlayerOptional(): MockPlayerContextValue | null {
    return useContext(MockPlayerContext);
}
