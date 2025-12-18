import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, get, child } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { type Room, setGameStatus, overwriteGameQuestions } from '../services/gameService';
import { generateWithRetry } from '../services/aiClient';
import { checkPhase1Exhaustion, filterUnseenQuestions } from '../services/historyService';
import { getRandomQuestionSet } from '../services/questionStorageService';
import { QUESTIONS } from '../data/questions';
import { PHASE4_QUESTIONS } from '../data/phase4';
import { PHASE5_QUESTIONS } from '../data/phase5';

// Module-level lock to survive React StrictMode remounts
// Keys are formatted as `${roomCode}_${phase}`
const generationInProgress: Record<string, boolean> = {};

interface UseQuestionGenerationOptions {
    room: Room | null;
    isHost: boolean;
    myId: string | null;
}

interface UseQuestionGenerationReturn {
    isGenerating: boolean;
    isGeneratingPhase2: boolean;
    generationError: string | null;
    handleStartGame: () => Promise<void>;
}

/**
 * Hook for managing AI question generation and filtering across all phases
 */
export function useQuestionGeneration({
    room,
    isHost,
    myId
}: UseQuestionGenerationOptions): UseQuestionGenerationReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingPhase2, setIsGeneratingPhase2] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const hasCheckedExhaustion = useRef(false);
    const hasFilteredPhase4 = useRef(false);
    const hasFilteredPhase5 = useRef(false);

    // Auto-Generation Check for Phase 1 (in lobby)
    useEffect(() => {
        const checkSmartGeneration = async () => {
            if (room && room.state.status === 'lobby' && isHost && !hasCheckedExhaustion.current && room.players) {
                hasCheckedExhaustion.current = true;
                if (!room.customQuestions?.phase1) {
                    const isExhausted = await checkPhase1Exhaustion(Object.values(room.players));
                    if (isExhausted) {
                        console.log("Static pool exhausted! Generation will happen when host clicks Start.");
                    }
                }
            }
        };
        checkSmartGeneration();
    }, [room, isHost]);

    // Automatic Phase 2 Generation
    useEffect(() => {
        if (room?.state.status !== 'phase2') return;

        const generatePhase2Questions = async () => {
            if (!room) return;

            const lockKey = `${room.code}_phase2`;
            if (generationInProgress[lockKey]) {
                console.log("Phase 2 generation already triggered for this room");
                return;
            }

            if (room.customQuestions?.phase2) {
                console.log("Phase 2: Questions personnalisees deja presentes");
                return;
            }

            const currentIsHost = room.hostId === myId;
            if (!currentIsHost) return;

            generationInProgress[lockKey] = true;
            setIsGeneratingPhase2(true);
            console.log("Phase 2: Generation automatique des questions...");

            try {
                const result = await generateWithRetry({ phase: 'phase2', roomCode: room.code });
                await overwriteGameQuestions(room.code, 'phase2', result.data as unknown[]);
                console.log("Phase 2: Questions generees avec succes !");
            } catch (err) {
                console.error("Phase 2: Echec generation:", err);
                generationInProgress[lockKey] = false;
            } finally {
                setIsGeneratingPhase2(false);
            }
        };

        generatePhase2Questions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.state.status]);

    // Automatic Phase 4 Filtering
    useEffect(() => {
        const filterPhase4Questions = async () => {
            if (!room || room.state.status !== 'phase4') return;
            if (hasFilteredPhase4.current) return;
            if (room.customQuestions?.phase4) return;
            if (!isHost) return;

            hasFilteredPhase4.current = true;
            console.log("Phase 4: Filtrage des questions deja vues...");

            const filtered = await filterUnseenQuestions(PHASE4_QUESTIONS, q => q.question);
            if (filtered.length < PHASE4_QUESTIONS.length) {
                console.log(`Phase 4: ${filtered.length}/${PHASE4_QUESTIONS.length} questions non vues`);
                await overwriteGameQuestions(room.code, 'phase4', filtered);
            }
        };
        filterPhase4Questions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.state.status, room?.customQuestions?.phase4, room?.code, isHost]);

    // Automatic Phase 5 Filtering
    useEffect(() => {
        const filterPhase5Questions = async () => {
            if (!room || room.state.status !== 'phase5') return;
            if (hasFilteredPhase5.current) return;
            if (room.customQuestions?.phase5) return;
            if (!isHost) return;

            hasFilteredPhase5.current = true;
            console.log("Phase 5: Filtrage des questions deja vues...");

            const filtered = await filterUnseenQuestions(PHASE5_QUESTIONS, q => q.question);
            if (filtered.length < PHASE5_QUESTIONS.length) {
                console.log(`Phase 5: ${filtered.length}/${PHASE5_QUESTIONS.length} questions non vues`);
                await overwriteGameQuestions(room.code, 'phase5', filtered);
            }
        };
        filterPhase5Questions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.state.status, room?.customQuestions?.phase5, room?.code, isHost]);

    // Handler for starting the game with automatic AI generation if needed
    const handleStartGame = useCallback(async () => {
        if (!room) return;

        const lockKey = `${room.code}_phase1`;
        if (generationInProgress[lockKey]) {
            console.log("Phase 1 generation already in progress, skipping");
            return;
        }

        setGenerationError(null);

        // Check if custom questions already exist
        if (room.customQuestions?.phase1) {
            console.log("Questions personnalisees deja presentes, lancement direct");
            setGameStatus(room.code, 'phase1');
            return;
        }

        generationInProgress[lockKey] = true;

        // Check if generation is needed
        const players = Object.values(room.players);
        console.log("Verification exhaustion pour", players.length, "joueurs...");
        const isExhausted = await checkPhase1Exhaustion(players);
        console.log("Resultat exhaustion:", isExhausted);

        if (!isExhausted) {
            // Default questions available - filter to prioritize unseen questions
            console.log("Filtrage des questions deja vues...");
            const filteredQuestions = await filterUnseenQuestions(QUESTIONS, q => q.text);

            if (filteredQuestions.length < QUESTIONS.length) {
                console.log(`${filteredQuestions.length}/${QUESTIONS.length} questions non vues, stockage...`);
                await overwriteGameQuestions(room.code, 'phase1', filteredQuestions);
            } else {
                console.log("Toutes les questions sont nouvelles, lancement direct");
            }

            generationInProgress[lockKey] = false;
            setGameStatus(room.code, 'phase1');
            return;
        }

        // Need new questions - first check Firestore for stored sets
        setIsGenerating(true);

        try {
            // Build set of seen question IDs from all players
            const seenIds = new Set<string>();
            for (const player of players) {
                try {
                    const historySnap = await get(child(ref(rtdb), `userHistory/${player.id}`));
                    if (historySnap.exists()) {
                        Object.keys(historySnap.val()).forEach(id => seenIds.add(id));
                    }
                } catch (e) {
                    console.warn(`Failed to get history for player ${player.id}:`, e);
                }
            }

            console.log(`${seenIds.size} questions deja vues par les joueurs`);

            // Try to get a stored question set from Firestore
            console.log("Recherche de questions stockees dans Firestore...");
            const storedSet = await getRandomQuestionSet('phase1', seenIds);

            if (storedSet) {
                console.log(`Questions trouvees dans Firestore ! (Set ${storedSet.id}, ${storedSet.questions.length} questions)`);
                await overwriteGameQuestions(room.code, 'phase1', storedSet.questions);
                setIsGenerating(false);
                generationInProgress[lockKey] = false;
                setGameStatus(room.code, 'phase1');
                return;
            }

            // No suitable stored set found - generate new ones
            console.log("Aucune question stockee disponible, generation IA en cours...");
            const result = await generateWithRetry({ phase: 'phase1', roomCode: room.code });
            await overwriteGameQuestions(room.code, 'phase1', result.data as unknown[]);
            console.log("Questions generees avec succes !");
        } catch (err) {
            console.error("Echec:", err);
            setGenerationError("Impossible de charger les questions. Reessayez.");
            setIsGenerating(false);
            generationInProgress[lockKey] = false;
            return;
        }

        setIsGenerating(false);
        generationInProgress[lockKey] = false;
        setGameStatus(room.code, 'phase1');
    }, [room]);

    return {
        isGenerating,
        isGeneratingPhase2,
        generationError,
        handleStartGame
    };
}
