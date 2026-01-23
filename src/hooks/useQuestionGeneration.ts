import { useState, useCallback } from 'react';
import { startGame as startGameCF } from '../services/firebase';
import { type Room } from '../services/gameService';
import { getRoomDifficulty, getRoomLanguage } from '../services/game/roomService';

interface UseQuestionGenerationOptions {
    room: Room | null;
    isHost: boolean;
    myId: string | null;
}

interface UseQuestionGenerationReturn {
    isGenerating: boolean;
    generationError: string | null;
    handleStartGame: () => Promise<void>;
}

/**
 * Hook for managing game start and question generation state.
 *
 * All question generation is now handled server-side:
 * - startGame CF: Generates Phase 1 questions and triggers P2-P5 via Pub/Sub
 * - generatePhaseQuestions Pub/Sub CF: Generates P2-P5 in parallel in the background
 * - nextPhase CF: Waits for questions to be ready before transitioning
 *
 * This hook only:
 * - Derives isGenerating state from room (visible to all players)
 * - Provides handleStartGame to call the startGame CF
 */
export function useQuestionGeneration({
    room,
    isHost,
    myId
}: UseQuestionGenerationOptions): UseQuestionGenerationReturn {
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Derive generation state from room (visible to all players)
    const isGenerating = room?.state.isGenerating ?? false;

    const handleStartGame = useCallback(async () => {
        if (!room || !room.code || !myId || !isHost) {
            return;
        }

        setGenerationError(null);

        try {
            // Call startGame CF - handles P1 generation and triggers P2-P5 via Pub/Sub
            await startGameCF(
                room.code,
                'multi',
                getRoomDifficulty(room),
                getRoomLanguage(room)
            );
        } catch (err) {
            console.error('[handleStartGame] Failed:', err);
            setGenerationError("Impossible de démarrer le jeu. Réessayez.");
        }
    }, [room, myId, isHost]);

    return {
        isGenerating,
        generationError,
        handleStartGame
    };
}
