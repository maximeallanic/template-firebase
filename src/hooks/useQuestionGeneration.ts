import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, get, child } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { type Room, setGameStatus, overwriteGameQuestions, setGeneratingState, setPhase2GeneratingState, getPhase2GeneratingState } from '../services/gameService';
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
    // Generation state is now stored in Firebase (room.state.isGenerating)
    // so all players can see the loading modal
    const [generationError, setGenerationError] = useState<string | null>(null);

    // Derive generation state from room (visible to all players)
    const isGenerating = room?.state.isGenerating ?? false;

    const hasCheckedExhaustion = useRef(false);
    const hasFilteredPhase4 = useRef(false);
    const hasFilteredPhase5 = useRef(false);

    // Auto-Generation Check for Phase 1 (in lobby)
    useEffect(() => {
        const checkSmartGeneration = async () => {
            if (room && room.state.status === 'lobby' && isHost && !hasCheckedExhaustion.current && room.players) {
                hasCheckedExhaustion.current = true;
                console.log('[QUESTION-GEN] 🔍 Checking Phase 1 exhaustion in lobby...', {
                    roomCode: room.code,
                    playerCount: Object.keys(room.players).length,
                    hasCustomPhase1: !!room.customQuestions?.phase1
                });

                if (!room.customQuestions?.phase1) {
                    const isExhausted = await checkPhase1Exhaustion(Object.values(room.players));
                    console.log('[QUESTION-GEN] 📊 Phase 1 exhaustion check result:', isExhausted);
                    if (isExhausted) {
                        console.log('[QUESTION-GEN] ⚠️ Static pool exhausted! AI generation will happen on Start.');
                    }
                }
            }
        };
        checkSmartGeneration();
    }, [room, isHost]);

    // NOTE: Phase 2 pre-generation is now triggered in handleStartGame (after game starts)
    // instead of automatically during lobby, to avoid unnecessary API calls before the game begins.

    // Automatic Phase 2 Generation (fallback if pregen failed or wasn't done)
    // Uses Firebase lock to prevent double generation with triggerPhase2Pregen
    useEffect(() => {
        if (room?.state.status !== 'phase2') return;

        const generatePhase2Questions = async () => {
            if (!room) return;

            console.log('[QUESTION-GEN] 📍 Phase 2 entered, checking generation needs...', {
                roomCode: room.code,
                hasCustomQuestions: !!room.customQuestions?.phase2,
                isHost: room.hostId === myId
            });

            // Check Firebase lock (shared with triggerPhase2Pregen)
            const isAlreadyGenerating = await getPhase2GeneratingState(room.code);
            if (isAlreadyGenerating) {
                console.log('[QUESTION-GEN] Phase 2: Skipping - generation already in progress (Firebase lock)');
                return;
            }

            if (room.customQuestions?.phase2) {
                console.log('[QUESTION-GEN] Phase 2: Using existing custom questions', {
                    questionCount: Array.isArray(room.customQuestions.phase2) ? room.customQuestions.phase2.length : 'N/A'
                });
                return;
            }

            const currentIsHost = room.hostId === myId;
            if (!currentIsHost) {
                console.log('[QUESTION-GEN] Phase 2: Not host, waiting for host to generate...');
                return;
            }

            // Take the Firebase lock
            await setPhase2GeneratingState(room.code, true);
            // Also set visible generation state for loading UI
            await setGeneratingState(room.code, true);
            console.log('[QUESTION-GEN] 🎯 Phase 2: Starting automatic generation...', {
                roomCode: room.code,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await generateWithRetry({ phase: 'phase2', roomCode: room.code });
                console.log('[QUESTION-GEN] Phase 2: Saving generated questions to Firebase...');
                await overwriteGameQuestions(room.code, 'phase2', result.data as unknown[]);
                console.log('[QUESTION-GEN] ✅ Phase 2: Generation complete!');
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 2: Generation failed:', {
                    error: (err as Error).message,
                    errorCode: (err as { code?: string })?.code
                });
                setGenerationError("Échec de la génération Phase 2. Questions par défaut utilisées.");
            } finally {
                // Clear both locks
                await setPhase2GeneratingState(room.code, false);
                await setGeneratingState(room.code, false);
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
            if (room.customQuestions?.phase4) {
                console.log('[QUESTION-GEN] Phase 4: Using existing custom questions');
                return;
            }
            if (!isHost) return;

            hasFilteredPhase4.current = true;
            console.log('[QUESTION-GEN] 🔍 Phase 4: Filtering seen questions...', {
                roomCode: room.code,
                totalQuestions: PHASE4_QUESTIONS.length
            });

            const filtered = await filterUnseenQuestions(PHASE4_QUESTIONS, q => q.question);
            console.log('[QUESTION-GEN] Phase 4: Filter result', {
                original: PHASE4_QUESTIONS.length,
                filtered: filtered.length,
                removed: PHASE4_QUESTIONS.length - filtered.length
            });

            if (filtered.length < PHASE4_QUESTIONS.length) {
                await overwriteGameQuestions(room.code, 'phase4', filtered);
                console.log('[QUESTION-GEN] ✅ Phase 4: Filtered questions saved to Firebase');
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
            if (room.customQuestions?.phase5) {
                console.log('[QUESTION-GEN] Phase 5: Using existing custom questions');
                return;
            }
            if (!isHost) return;

            hasFilteredPhase5.current = true;
            console.log('[QUESTION-GEN] 🔍 Phase 5: Filtering seen questions...', {
                roomCode: room.code,
                totalQuestions: PHASE5_QUESTIONS.length
            });

            const filtered = await filterUnseenQuestions(PHASE5_QUESTIONS, q => q.question);
            console.log('[QUESTION-GEN] Phase 5: Filter result', {
                original: PHASE5_QUESTIONS.length,
                filtered: filtered.length,
                removed: PHASE5_QUESTIONS.length - filtered.length
            });

            if (filtered.length < PHASE5_QUESTIONS.length) {
                await overwriteGameQuestions(room.code, 'phase5', filtered);
                console.log('[QUESTION-GEN] ✅ Phase 5: Filtered questions saved to Firebase');
            }
        };
        filterPhase5Questions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.state.status, room?.customQuestions?.phase5, room?.code, isHost]);

    // Helper function to trigger Phase 2 pre-generation in background (non-blocking)
    // Uses Firebase lock to prevent double generation race condition
    const triggerPhase2Pregen = async (roomCode: string) => {
        if (room?.customQuestions?.phase2) {
            console.log('[QUESTION-GEN] Phase 2: Skipping pregen - already has custom questions');
            return;
        }

        // Check Firebase lock before starting
        const isAlreadyGenerating = await getPhase2GeneratingState(roomCode);
        if (isAlreadyGenerating) {
            console.log('[QUESTION-GEN] Phase 2: Skipping pregen - already generating (Firebase lock)');
            return;
        }

        // Take the Firebase lock
        await setPhase2GeneratingState(roomCode, true);

        console.log('[QUESTION-GEN] 🎯 Phase 2: Starting background pre-generation after game start...', {
            roomCode,
            timestamp: new Date().toISOString()
        });

        try {
            const result = await generateWithRetry({ phase: 'phase2', roomCode });
            console.log('[QUESTION-GEN] Phase 2: Pregen result received, saving to Firebase...');
            await overwriteGameQuestions(roomCode, 'phase2', result.data as unknown[]);
            console.log('[QUESTION-GEN] ✅ Phase 2: Pre-generation successful!');
        } catch (err) {
            console.warn('[QUESTION-GEN] ❌ Phase 2: Pre-generation failed:', {
                error: (err as Error).message,
                willRetryOnPhaseEntry: true
            });
            // Don't throw - pregen failure is not critical, fallback will happen on Phase 2 entry
        } finally {
            // Always release the Firebase lock
            await setPhase2GeneratingState(roomCode, false);
        }
    };

    // Handler for starting the game with automatic AI generation if needed
    const handleStartGame = useCallback(async () => {
        if (!room) {
            console.warn('[QUESTION-GEN] handleStartGame called with no room!');
            return;
        }

        const startTime = performance.now();
        console.log('[QUESTION-GEN] 🚀 handleStartGame called', {
            roomCode: room.code,
            playerCount: Object.keys(room.players || {}).length,
            hasCustomPhase1: !!room.customQuestions?.phase1,
            timestamp: new Date().toISOString()
        });

        const lockKey = `${room.code}_phase1`;
        if (generationInProgress[lockKey]) {
            console.log('[QUESTION-GEN] ⏸️ Phase 1 generation already in progress, skipping');
            return;
        }

        // CRITICAL: Set lock IMMEDIATELY after check to prevent race conditions
        generationInProgress[lockKey] = true;
        setGenerationError(null);

        try {
            // Fast path: if custom questions exist, just start
            if (room.customQuestions?.phase1) {
                console.log('[QUESTION-GEN] ⚡ Fast path: Using existing custom questions', {
                    questionCount: Array.isArray(room.customQuestions.phase1) ? room.customQuestions.phase1.length : 'N/A'
                });
                await setGameStatus(room.code, 'phase1');
                triggerPhase2Pregen(room.code);
                return;
            }

            // Check if generation is needed
            const players = Object.values(room.players);
            console.log('[QUESTION-GEN] 🔍 Checking static pool exhaustion...', { playerCount: players.length });
            const isExhausted = await checkPhase1Exhaustion(players);
            console.log('[QUESTION-GEN] 📊 Exhaustion check result:', { isExhausted, totalStaticQuestions: QUESTIONS.length });

            const PHASE1_QUESTION_COUNT = 10;

            if (!isExhausted) {
                // Default questions available - filter to prioritize unseen questions
                console.log('[QUESTION-GEN] 🔍 Filtering unseen questions from static pool...');
                const filteredQuestions = await filterUnseenQuestions(QUESTIONS, q => q.text);
                console.log('[QUESTION-GEN] Filter result:', {
                    original: QUESTIONS.length,
                    afterFilter: filteredQuestions.length,
                    needed: PHASE1_QUESTION_COUNT
                });

                // If we have enough questions, shuffle and select 10
                if (filteredQuestions.length >= PHASE1_QUESTION_COUNT) {
                    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
                    const selectedQuestions = shuffled.slice(0, PHASE1_QUESTION_COUNT);

                    console.log('[QUESTION-GEN] ✅ Using filtered static questions', {
                        selected: selectedQuestions.length,
                        available: filteredQuestions.length
                    });
                    await overwriteGameQuestions(room.code, 'phase1', selectedQuestions);

                    await setGameStatus(room.code, 'phase1');
                    triggerPhase2Pregen(room.code);
                    console.log(`[QUESTION-GEN] 🎮 Game started in ${Math.round(performance.now() - startTime)}ms (static questions)`);
                    return;
                }

                // Not enough unseen questions, need AI generation
                console.log('[QUESTION-GEN] ⚠️ Not enough unseen static questions, need AI generation', {
                    available: filteredQuestions.length,
                    needed: PHASE1_QUESTION_COUNT
                });
            }

            // Need new questions - show loading state in Firebase (visible to all)
            console.log('[QUESTION-GEN] 📡 Setting generation state to true (visible to all players)...');
            await setGeneratingState(room.code, true);

            // Build set of seen question IDs from all players
            console.log('[QUESTION-GEN] 📖 Building seen question IDs from player history...');
            const seenIds = new Set<string>();
            for (const player of players) {
                try {
                    const historySnap = await get(child(ref(rtdb), `userHistory/${player.id}`));
                    if (historySnap.exists()) {
                        const playerSeenCount = Object.keys(historySnap.val()).length;
                        Object.keys(historySnap.val()).forEach(id => seenIds.add(id));
                        console.log(`[QUESTION-GEN]   - Player ${player.name}: ${playerSeenCount} seen questions`);
                    }
                } catch (e) {
                    console.warn(`[QUESTION-GEN] ⚠️ Failed to get history for player ${player.id}:`, e);
                }
            }
            console.log('[QUESTION-GEN] 📊 Total unique seen questions across all players:', seenIds.size);

            // Try to get a stored question set from Firestore
            console.log('[QUESTION-GEN] 🔎 Searching for stored questions in Firestore...');
            const storedSet = await getRandomQuestionSet('phase1', seenIds);

            if (storedSet) {
                console.log('[QUESTION-GEN] ✅ Found stored questions in Firestore!', {
                    setId: storedSet.id,
                    questionCount: storedSet.questions.length,
                    topic: storedSet.topic
                });
                await overwriteGameQuestions(room.code, 'phase1', storedSet.questions);
                await setGameStatus(room.code, 'phase1');
                triggerPhase2Pregen(room.code);
                console.log(`[QUESTION-GEN] 🎮 Game started in ${Math.round(performance.now() - startTime)}ms (Firestore questions)`);
                return;
            }

            // No suitable stored set found - generate new ones
            console.log('[QUESTION-GEN] 🤖 No stored questions available, starting AI generation...');
            const result = await generateWithRetry({ phase: 'phase1', roomCode: room.code });

            console.log('[QUESTION-GEN] 💾 Saving AI-generated questions to Firebase...', {
                questionCount: Array.isArray(result.data) ? result.data.length : 'N/A',
                topic: result.topic
            });
            await overwriteGameQuestions(room.code, 'phase1', result.data as unknown[]);
            console.log('[QUESTION-GEN] ✅ AI questions saved successfully!');

            await setGameStatus(room.code, 'phase1');
            triggerPhase2Pregen(room.code);
            console.log(`[QUESTION-GEN] 🎮 Game started in ${Math.round(performance.now() - startTime)}ms (AI-generated questions)`);
        } catch (err) {
            const duration = Math.round(performance.now() - startTime);
            console.error('[QUESTION-GEN] ❌ handleStartGame failed after', `${duration}ms:`, {
                error: (err as Error).message,
                errorCode: (err as { code?: string })?.code,
                stack: (err as Error).stack
            });
            setGenerationError("Impossible de charger les questions. Reessayez.");
        } finally {
            // Always release lock and reset loading state in Firebase
            generationInProgress[lockKey] = false;
            if (room) {
                await setGeneratingState(room.code, false);
            }
        }
        // Note: room?.customQuestions?.phase1 is intentionally NOT in deps to prevent
        // callback recreation during generation (which could cause double calls).
        // The check for existing questions is done INSIDE the function (line 202).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.code, room?.players]);

    return {
        isGenerating,
        generationError,
        handleStartGame
    };
}
