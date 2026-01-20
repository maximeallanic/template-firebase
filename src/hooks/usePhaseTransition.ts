import { useCallback } from 'react';
import {
    showPhaseResults,
    startNextQuestion,
    nextPhase2Item,
    nextPhase4Question,
    type Room,
    type PhaseStatus,
} from '../services/gameService';
import { nextPhase as nextPhaseCF } from '../services/firebase';

interface UsePhaseTransitionOptions {
    /**
     * The current room state
     */
    room: Room | null;

    /**
     * Whether the current player is the host
     */
    isHost: boolean;

    /**
     * Whether the game is in solo mode
     */
    isSolo?: boolean;
}

interface UsePhaseTransitionReturn {
    /**
     * Advance to the next question within the current phase.
     * Supports Phase 1, Phase 2, and Phase 4.
     * Note: Phase 5 has a specialized flow and handles its own transitions.
     * @param nextIndex - The index of the next question (required for Phase 1)
     */
    advanceToNextQuestion: (nextIndex?: number) => Promise<void>;

    /**
     * Show the phase results screen before transitioning to the next phase.
     * Sets phaseState to 'phase_results'.
     */
    showPhaseResults: () => Promise<void>;

    /**
     * Advance to the next game phase.
     * Handles premium phase gating automatically.
     * @param targetPhase - The phase to transition to
     */
    advanceToNextPhase: (targetPhase: PhaseStatus) => Promise<void>;

    /**
     * End the game and show the victory screen.
     * Calculates final scores and determines the winner.
     */
    endGame: () => Promise<void>;

    /**
     * Check if the current player can trigger transitions.
     * Returns true if the player is the host (or in solo mode).
     */
    canTransition: boolean;
}

/**
 * Centralized hook for managing phase transitions in the game.
 *
 * This hook provides a unified interface for:
 * - Advancing to the next question within a phase
 * - Showing phase results before moving on
 * - Transitioning between game phases
 * - Ending the game
 *
 * All transition functions include host/solo mode guards to prevent
 * unauthorized state changes.
 *
 * @example
 * ```tsx
 * const { advanceToNextQuestion, showPhaseResults, endGame, canTransition } = usePhaseTransition({
 *   room,
 *   isHost,
 *   isSolo: false
 * });
 *
 * // In Phase 1, after showing result:
 * if (canTransition && isFinished) {
 *   await showPhaseResults();
 * } else if (canTransition) {
 *   await advanceToNextQuestion(nextQuestionIndex);
 * }
 * ```
 */
export function usePhaseTransition({
    room,
    isHost,
    isSolo = false,
}: UsePhaseTransitionOptions): UsePhaseTransitionReturn {
    /**
     * Whether the current player can trigger transitions.
     * In multiplayer, only the host can transition.
     * In solo mode, the player can always transition.
     */
    const canTransition = isSolo || isHost;

    /**
     * Advance to the next question within the current phase.
     */
    const advanceToNextQuestionFn = useCallback(async (nextIndex?: number) => {
        if (!room || !canTransition) return;

        const currentPhase = room.state.status;

        switch (currentPhase) {
            case 'phase1':
                if (nextIndex !== undefined) {
                    await startNextQuestion(room.code, nextIndex);
                }
                break;

            case 'phase2':
                await nextPhase2Item(room.code);
                break;

            case 'phase4':
                await nextPhase4Question(room.code);
                break;

            // Note: Phase 5 has a different flow (voting -> memorizing -> answering -> validating -> results)
            // and uses specialized functions like nextPhase5MemoryQuestion(code, totalQuestions)
            // Phase 5 transitions are handled within its sub-components (Phase5Memorizing, etc.)

            default:
                console.warn(`advanceToNextQuestion called in unsupported phase: ${currentPhase}`);
        }
    }, [room, canTransition]);

    /**
     * Show the phase results screen.
     */
    const showPhaseResultsFn = useCallback(async () => {
        if (!room || !canTransition) return;

        await showPhaseResults(room.code);
    }, [room, canTransition]);

    /**
     * Advance to the next game phase.
     * Uses nextPhase CF to calculate scores and transition (#72)
     */
    const advanceToNextPhaseFn = useCallback(async (targetPhase: PhaseStatus) => {
        // Only host can transition to next phase (not solo)
        if (!room || !isHost) return;

        // Get the current phase to pass to nextPhase CF
        const currentPhase = room.state.status;
        if (currentPhase === 'lobby' || currentPhase === 'victory') return;

        try {
            // nextPhase CF will calculate scores and transition to next phase
            await nextPhaseCF(room.code, currentPhase);
            console.log(`[usePhaseTransition] Transitioned from ${currentPhase} to ${targetPhase}`);
        } catch (error) {
            console.error('[usePhaseTransition] Error calling nextPhase CF:', error);
        }
    }, [room, isHost]);

    /**
     * End the game and show victory screen.
     * Uses nextPhase CF with phase5 to calculate final scores and transition to victory (#72)
     */
    const endGameFn = useCallback(async () => {
        // Only host can end the game (not solo - solo uses different flow)
        if (!room || !isHost) return;

        try {
            // nextPhase CF from phase5 will calculate scores and transition to victory
            await nextPhaseCF(room.code, 'phase5');
            console.log('[usePhaseTransition] Game ended, transitioned to victory');
        } catch (error) {
            console.error('[usePhaseTransition] Error ending game:', error);
        }
    }, [room, isHost]);

    return {
        advanceToNextQuestion: advanceToNextQuestionFn,
        showPhaseResults: showPhaseResultsFn,
        advanceToNextPhase: advanceToNextPhaseFn,
        endGame: endGameFn,
        canTransition,
    };
}

/**
 * Helper function to get the next phase in the game flow.
 *
 * @param currentPhase - The current phase status
 * @returns The next phase status, or 'victory' if the game is complete
 */
export function getNextPhase(currentPhase: PhaseStatus): PhaseStatus {
    const phaseOrder: PhaseStatus[] = ['lobby', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'victory'];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    if (currentIndex === -1 || currentIndex >= phaseOrder.length - 1) {
        return 'victory';
    }

    return phaseOrder[currentIndex + 1];
}

/**
 * Helper function to check if a phase is a premium phase.
 *
 * @param phase - The phase to check
 * @returns True if the phase requires a premium subscription
 */
export function isPremiumPhase(phase: PhaseStatus): boolean {
    const premiumPhases: PhaseStatus[] = ['phase3', 'phase4', 'phase5'];
    return premiumPhases.includes(phase);
}
