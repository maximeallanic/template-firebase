import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, get, child } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { type Room, setGameStatus, overwriteGameQuestions, setGeneratingState, setPhase2GeneratingState, getPhase2GeneratingState } from '../services/gameService';
import { generateWithRetry } from '../services/aiClient';
import { filterUnseenQuestions } from '../services/historyService';
import { getRandomQuestionSet } from '../services/questionStorageService';
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

    // Refs to hold latest values for use in effects that shouldn't re-run on every change
    const roomRef = useRef(room);
    const myIdRef = useRef(myId);
    const isHostRef = useRef(isHost);

    // Keep refs updated
    useEffect(() => {
        roomRef.current = room;
        myIdRef.current = myId;
        isHostRef.current = isHost;
    }, [room, myId, isHost]);

    // Phase 1 now always uses AI generation (no static questions)
    useEffect(() => {
        if (room && room.state.status === 'lobby' && isHost && !hasCheckedExhaustion.current && room.players) {
            hasCheckedExhaustion.current = true;
            console.log('[QUESTION-GEN] 🔍 Phase 1 ready for AI generation', {
                roomCode: room.code,
                playerCount: Object.keys(room.players).length,
                hasCustomPhase1: !!room.customQuestions?.phase1
            });
        }
    }, [room, isHost]);

    // NOTE: Phase 2 pre-generation is now triggered in handleStartGame (after game starts)
    // instead of automatically during lobby, to avoid unnecessary API calls before the game begins.

    // Automatic Phase 2 Generation (fallback if pregen failed or wasn't done)
    // Uses Firebase lock to prevent double generation with triggerPhase2Pregen
    const roomStatus = room?.state.status;
    useEffect(() => {
        if (roomStatus !== 'phase2') return;

        const generatePhase2Questions = async () => {
            const currentRoom = roomRef.current;
            const currentMyId = myIdRef.current;
            if (!currentRoom) return;

            console.log('[QUESTION-GEN] 📍 Phase 2 entered, checking generation needs...', {
                roomCode: currentRoom.code,
                hasCustomQuestions: !!currentRoom.customQuestions?.phase2,
                isHost: currentRoom.hostId === currentMyId
            });

            // Check Firebase lock (shared with triggerPhase2Pregen)
            const isAlreadyGenerating = await getPhase2GeneratingState(currentRoom.code);
            if (isAlreadyGenerating) {
                console.log('[QUESTION-GEN] Phase 2: Skipping - generation already in progress (Firebase lock)');
                return;
            }

            if (currentRoom.customQuestions?.phase2) {
                console.log('[QUESTION-GEN] Phase 2: Using existing custom questions', {
                    questionCount: Array.isArray(currentRoom.customQuestions.phase2) ? currentRoom.customQuestions.phase2.length : 'N/A'
                });
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                console.log('[QUESTION-GEN] Phase 2: Not host, waiting for host to generate...');
                return;
            }

            // Take the Firebase lock
            await setPhase2GeneratingState(currentRoom.code, true);
            // Also set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);
            console.log('[QUESTION-GEN] 🎯 Phase 2: Starting automatic generation...', {
                roomCode: currentRoom.code,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await generateWithRetry({ phase: 'phase2', roomCode: currentRoom.code });
                console.log('[QUESTION-GEN] Phase 2: Saving generated questions to Firebase...');
                await overwriteGameQuestions(currentRoom.code, 'phase2', result.data as unknown[]);
                console.log('[QUESTION-GEN] ✅ Phase 2: Generation complete!');
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 2: Generation failed:', {
                    error: (err as Error).message,
                    errorCode: (err as { code?: string })?.code
                });
                setGenerationError("Échec de la génération Phase 2. Questions par défaut utilisées.");
            } finally {
                // Clear both locks
                await setPhase2GeneratingState(currentRoom.code, false);
                await setGeneratingState(currentRoom.code, false);
            }
        };

        generatePhase2Questions();
    }, [roomStatus]);

    // Automatic Phase 4 Generation (AI or fallback to static questions)
    useEffect(() => {
        if (roomStatus !== 'phase4') return;

        const generatePhase4Questions = async () => {
            const currentRoom = roomRef.current;
            const currentMyId = myIdRef.current;
            if (!currentRoom) return;
            if (hasFilteredPhase4.current) return;

            console.log('[QUESTION-GEN] 📍 Phase 4 entered, checking generation needs...', {
                roomCode: currentRoom.code,
                hasCustomQuestions: !!currentRoom.customQuestions?.phase4,
                isHost: currentRoom.hostId === currentMyId
            });

            if (currentRoom.customQuestions?.phase4) {
                console.log('[QUESTION-GEN] Phase 4: Using existing custom questions', {
                    questionCount: Array.isArray(currentRoom.customQuestions.phase4) ? currentRoom.customQuestions.phase4.length : 'N/A'
                });
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                console.log('[QUESTION-GEN] Phase 4: Not host, waiting for host to generate...');
                return;
            }

            hasFilteredPhase4.current = true;

            // Set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);
            console.log('[QUESTION-GEN] 🎯 Phase 4: Starting AI generation...', {
                roomCode: currentRoom.code,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await generateWithRetry({ phase: 'phase4', roomCode: currentRoom.code });
                console.log('[QUESTION-GEN] Phase 4: Saving generated questions to Firebase...');
                await overwriteGameQuestions(currentRoom.code, 'phase4', result.data as unknown[]);
                console.log('[QUESTION-GEN] ✅ Phase 4: AI generation complete!');
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 4: AI generation failed, using fallback:', {
                    error: (err as Error).message,
                    errorCode: (err as { code?: string })?.code
                });
                setGenerationError("Échec de la génération Phase 4. Questions par défaut utilisées.");

                // Fallback to filtered static questions
                console.log('[QUESTION-GEN] 🔍 Phase 4: Filtering static fallback questions...');
                const filtered = await filterUnseenQuestions(PHASE4_QUESTIONS, q => q.question);
                console.log('[QUESTION-GEN] Phase 4: Fallback filter result', {
                    original: PHASE4_QUESTIONS.length,
                    filtered: filtered.length
                });
                await overwriteGameQuestions(currentRoom.code, 'phase4', filtered);
                console.log('[QUESTION-GEN] ✅ Phase 4: Fallback questions saved');
            } finally {
                await setGeneratingState(currentRoom.code, false);
            }
        };

        generatePhase4Questions();
    }, [roomStatus]);

    // Automatic Phase 5 Filtering
    const roomCode = room?.code;
    const hasPhase5CustomQuestions = !!room?.customQuestions?.phase5;
    useEffect(() => {
        const filterPhase5Questions = async () => {
            const currentRoom = roomRef.current;
            const currentIsHost = isHostRef.current;
            if (!currentRoom || roomStatus !== 'phase5') return;
            if (hasFilteredPhase5.current) return;
            if (hasPhase5CustomQuestions) {
                console.log('[QUESTION-GEN] Phase 5: Using existing custom questions');
                return;
            }
            if (!currentIsHost) return;

            hasFilteredPhase5.current = true;
            console.log('[QUESTION-GEN] 🔍 Phase 5: Filtering seen questions...', {
                roomCode: currentRoom.code,
                totalQuestions: PHASE5_QUESTIONS.length
            });

            const filtered = await filterUnseenQuestions(PHASE5_QUESTIONS, q => q.question);
            console.log('[QUESTION-GEN] Phase 5: Filter result', {
                original: PHASE5_QUESTIONS.length,
                filtered: filtered.length,
                removed: PHASE5_QUESTIONS.length - filtered.length
            });

            if (filtered.length < PHASE5_QUESTIONS.length) {
                await overwriteGameQuestions(currentRoom.code, 'phase5', filtered);
                console.log('[QUESTION-GEN] ✅ Phase 5: Filtered questions saved to Firebase');
            }
        };
        filterPhase5Questions();
    }, [roomStatus, hasPhase5CustomQuestions, roomCode, isHost]);

    // Helper function to trigger Phase 2 pre-generation in background (non-blocking)
    // Uses Firebase lock to prevent double generation race condition
    const hasPhase2CustomQuestions = !!room?.customQuestions?.phase2;
    const triggerPhase2Pregen = useCallback(async (pregenRoomCode: string) => {
        if (hasPhase2CustomQuestions) {
            console.log('[QUESTION-GEN] Phase 2: Skipping pregen - already has custom questions');
            return;
        }

        // Check Firebase lock before starting
        const isAlreadyGenerating = await getPhase2GeneratingState(pregenRoomCode);
        if (isAlreadyGenerating) {
            console.log('[QUESTION-GEN] Phase 2: Skipping pregen - already generating (Firebase lock)');
            return;
        }

        // Take the Firebase lock
        await setPhase2GeneratingState(pregenRoomCode, true);

        console.log('[QUESTION-GEN] 🎯 Phase 2: Starting background pre-generation after game start...', {
            roomCode: pregenRoomCode,
            timestamp: new Date().toISOString()
        });

        try {
            const result = await generateWithRetry({ phase: 'phase2', roomCode: pregenRoomCode });
            console.log('[QUESTION-GEN] Phase 2: Pregen result received, saving to Firebase...');
            await overwriteGameQuestions(pregenRoomCode, 'phase2', result.data as unknown[]);
            console.log('[QUESTION-GEN] ✅ Phase 2: Pre-generation successful!');
        } catch (err) {
            console.warn('[QUESTION-GEN] ❌ Phase 2: Pre-generation failed:', {
                error: (err as Error).message,
                willRetryOnPhaseEntry: true
            });
            // Don't throw - pregen failure is not critical, fallback will happen on Phase 2 entry
        } finally {
            // Always release the Firebase lock
            await setPhase2GeneratingState(pregenRoomCode, false);
        }
    }, [hasPhase2CustomQuestions]);

    // Handler for starting the game with automatic AI generation if needed
    const handleStartGame = useCallback(async () => {
        const currentRoom = roomRef.current;
        if (!currentRoom || !roomCode) {
            console.warn('[QUESTION-GEN] handleStartGame called with no room!');
            return;
        }

        const startTime = performance.now();
        console.log('[QUESTION-GEN] 🚀 handleStartGame called', {
            roomCode: currentRoom.code,
            playerCount: Object.keys(currentRoom.players || {}).length,
            hasCustomPhase1: !!currentRoom.customQuestions?.phase1,
            timestamp: new Date().toISOString()
        });

        const lockKey = `${currentRoom.code}_phase1`;
        if (generationInProgress[lockKey]) {
            console.log('[QUESTION-GEN] ⏸️ Phase 1 generation already in progress, skipping');
            return;
        }

        // CRITICAL: Set lock IMMEDIATELY after check to prevent race conditions
        generationInProgress[lockKey] = true;
        setGenerationError(null);

        try {
            // Fast path: if custom questions exist, just start
            if (currentRoom.customQuestions?.phase1) {
                console.log('[QUESTION-GEN] ⚡ Fast path: Using existing custom questions', {
                    questionCount: Array.isArray(currentRoom.customQuestions.phase1) ? currentRoom.customQuestions.phase1.length : 'N/A'
                });
                await setGameStatus(currentRoom.code, 'phase1');
                triggerPhase2Pregen(currentRoom.code);
                return;
            }

            // Always use AI generation for Phase 1 (no static questions)
            const players = Object.values(currentRoom.players);
            console.log('[QUESTION-GEN] 🤖 Starting AI generation for Phase 1...', { playerCount: players.length });

            // Show loading state in Firebase (visible to all)
            console.log('[QUESTION-GEN] 📡 Setting generation state to true (visible to all players)...');
            await setGeneratingState(currentRoom.code, true);

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
                await overwriteGameQuestions(currentRoom.code, 'phase1', storedSet.questions);
                await setGameStatus(currentRoom.code, 'phase1');
                triggerPhase2Pregen(currentRoom.code);
                console.log(`[QUESTION-GEN] 🎮 Game started in ${Math.round(performance.now() - startTime)}ms (Firestore questions)`);
                return;
            }

            // No suitable stored set found - generate new ones
            console.log('[QUESTION-GEN] 🤖 No stored questions available, starting AI generation...');
            const result = await generateWithRetry({ phase: 'phase1', roomCode: currentRoom.code });

            console.log('[QUESTION-GEN] 💾 Saving AI-generated questions to Firebase...', {
                questionCount: Array.isArray(result.data) ? result.data.length : 'N/A',
                topic: result.topic
            });
            await overwriteGameQuestions(currentRoom.code, 'phase1', result.data as unknown[]);
            console.log('[QUESTION-GEN] ✅ AI questions saved successfully!');

            await setGameStatus(currentRoom.code, 'phase1');
            triggerPhase2Pregen(currentRoom.code);
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
            const finalRoom = roomRef.current;
            if (finalRoom) {
                await setGeneratingState(finalRoom.code, false);
            }
        }
    }, [roomCode, triggerPhase2Pregen]);

    return {
        isGenerating,
        generationError,
        handleStartGame
    };
}
