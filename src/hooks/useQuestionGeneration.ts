import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, get, child } from 'firebase/database';
import { rtdb, startGame as startGameCF } from '../services/firebase';
import { type Room, overwriteGameQuestions, setGeneratingState } from '../services/gameService';
import { getRoomDifficulty, getRoomLanguage } from '../services/game/roomService';
import { type Question, hasEnoughQuestions, getMissingQuestionCount } from '../types/gameTypes';
import { generateWithRetry } from '../services/aiClient';
import { filterUnseenQuestions } from '../services/historyService';
import { getRandomQuestionSet } from '../services/questionStorageService';
import {
    acquireGenerationLock,
    releaseGenerationLock,
    isGenerationLocked,
    cleanupStaleLock
} from '../services/lockService';

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
    const hasFilteredPhase3 = useRef(false);
    const hasFilteredPhase4 = useRef(false);

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
        }
    }, [room, isHost]);

    // NOTE: Phase 2 pre-generation is now triggered in handleStartGame (after game starts)
    // instead of automatically during lobby, to avoid unnecessary API calls before the game begins.

    // Automatic Phase 2 Generation (fallback if pregen failed or wasn't done)
    // Uses Firebase-based distributed lock to prevent double generation across all clients
    const roomStatus = room?.state.status;
    useEffect(() => {
        if (roomStatus !== 'phase2') return;

        const generatePhase2Questions = async () => {
            const currentRoom = roomRef.current;
            const currentMyId = myIdRef.current;
            if (!currentRoom || !currentMyId) return;

            // Check Firebase distributed lock (works across all clients/tabs)
            const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
            if (isAlreadyGenerating) {
                return;
            }

            // Check if we have enough Phase 2 questions (items in set)
            const hasEnough = hasEnoughQuestions(currentRoom.customQuestions, 'phase2');
            const existingPhase2 = currentRoom.customQuestions?.phase2;

            if (hasEnough) {
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                return;
            }

            // Try to acquire the Firebase distributed lock (atomic operation)
            const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase2');
            if (!lockAcquired) {
                return;
            }

            // Also set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);

            // Check for completion mode (partial questions exist)
            const missingCount = getMissingQuestionCount(currentRoom.customQuestions, 'phase2');
            const existingItems = Array.isArray(existingPhase2) ? existingPhase2[0]?.items : (existingPhase2 as { items?: unknown[] })?.items;

            if (existingItems && existingItems.length > 0 && missingCount > 0) {
                try {
                    const result = await generateWithRetry({
                        phase: 'phase2',
                        roomCode: currentRoom.code,
                        difficulty: getRoomDifficulty(currentRoom),
                        language: getRoomLanguage(currentRoom),
                        completeCount: missingCount,
                        existingQuestions: existingItems
                    });

                    // Merge items into existing set structure
                    const newItems = Array.isArray(result.data)
                        ? (result.data[0] as { items?: unknown[] })?.items || result.data
                        : (result.data as { items?: unknown[] })?.items || [];
                    const existingSet = Array.isArray(existingPhase2) ? existingPhase2[0] : existingPhase2;
                    const mergedSet = {
                        ...existingSet,
                        items: [...(existingItems || []), ...newItems]
                    };

                    await overwriteGameQuestions(currentRoom.code, 'phase2', [mergedSet]);
                    return;
                } catch (err) {
                    console.error('[QUESTION-GEN] ❌ Phase 2: Completion failed, trying full generation:', err);
                    // Fall through to full generation
                }
            }

            // Full generation
            try {
                const result = await generateWithRetry({ phase: 'phase2', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom), language: getRoomLanguage(currentRoom) });

                // Filter out already-seen items (Phase 2 has items array inside the object)
                let filteredData = result.data;
                if ((filteredData as { items?: unknown[] })?.items) {
                    const setData = filteredData as { items: { text: string }[] };
                    const filteredItems = await filterUnseenQuestions(setData.items, (item: { text: string }) => item.text);
                    filteredData = [{ ...setData, items: filteredItems }];
                }

                await overwriteGameQuestions(currentRoom.code, 'phase2', filteredData as unknown[]);
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 2: Generation failed:', {
                    error: (err as Error).message,
                    errorCode: (err as { code?: string })?.code
                });
                setGenerationError("Échec de la génération Phase 2. Questions par défaut utilisées.");
            } finally {
                // Release the Firebase distributed lock
                await releaseGenerationLock(currentRoom.code, currentMyId);
                await setGeneratingState(currentRoom.code, false);
            }
        };

        generatePhase2Questions();
    }, [roomStatus]);

    // Automatic Phase 3 Generation (AI-generated menus)
    // Uses Firebase-based distributed lock to prevent double generation across all clients
    useEffect(() => {
        if (roomStatus !== 'phase3') return;

        const generatePhase3Questions = async () => {
            const currentRoom = roomRef.current;
            const currentMyId = myIdRef.current;
            if (!currentRoom || !currentMyId) return;
            if (hasFilteredPhase3.current) return;

            // Check if we have Phase 3 custom questions (menus)
            const existingPhase3 = currentRoom.customQuestions?.phase3;


            // If we already have menus, skip generation
            if (existingPhase3 && Array.isArray(existingPhase3) && existingPhase3.length >= 4) {
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                return;
            }

            // Check Firebase distributed lock (works across all clients/tabs)
            const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
            if (isAlreadyGenerating) {
                return;
            }

            // Try to acquire the Firebase distributed lock (atomic operation)
            const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase3');
            if (!lockAcquired) {
                return;
            }

            hasFilteredPhase3.current = true;

            // Set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);

            // Full generation (Phase 3 always generates all 4 menus)

            try {
                const result = await generateWithRetry({ phase: 'phase3', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom), language: getRoomLanguage(currentRoom) });

                // Filter out already-seen questions from each menu
                let filteredData = result.data;
                if (Array.isArray(filteredData)) {
                    const menus = filteredData as Array<{ title: string; description: string; isTrap?: boolean; questions: { question: string; answer: string }[] }>;
                    for (const menu of menus) {
                        if (menu.questions && Array.isArray(menu.questions)) {
                            const filteredQuestions = await filterUnseenQuestions(
                                menu.questions,
                                (q: { question: string }) => q.question
                            );
                            menu.questions = filteredQuestions;
                        }
                    }
                    filteredData = menus;
                }


                await overwriteGameQuestions(currentRoom.code, 'phase3', filteredData as unknown[]);
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 3: AI generation failed:', err);
                setGenerationError('Phase 3 generation failed - using default menus');
                // Phase 3 will fallback to PHASE3_DATA in the component
            } finally {
                // Release the Firebase distributed lock
                await releaseGenerationLock(currentRoom.code, currentMyId);
                await setGeneratingState(currentRoom.code, false);
            }
        };

        generatePhase3Questions();
    }, [roomStatus]);

    // Automatic Phase 4 Generation (AI or fallback to static questions)
    // Uses Firebase-based distributed lock to prevent double generation across all clients
    useEffect(() => {
        if (roomStatus !== 'phase4') return;

        const generatePhase4Questions = async () => {
            const currentRoom = roomRef.current;
            const currentMyId = myIdRef.current;
            if (!currentRoom || !currentMyId) return;
            if (hasFilteredPhase4.current) return;

            // Check if we have enough Phase 4 questions
            const existingPhase4 = currentRoom.customQuestions?.phase4 || [];
            const missingCount = getMissingQuestionCount(currentRoom.customQuestions, 'phase4');


            // Fast path: enough questions
            if (missingCount === 0 && existingPhase4.length > 0) {
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                return;
            }

            // Check Firebase distributed lock (works across all clients/tabs)
            const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
            if (isAlreadyGenerating) {
                return;
            }

            // Try to acquire the Firebase distributed lock (atomic operation)
            const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase4');
            if (!lockAcquired) {
                return;
            }

            hasFilteredPhase4.current = true;

            // Set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);

            // Completion mode: we have some questions but not enough
            if (existingPhase4.length > 0 && missingCount > 0) {

                try {
                    const result = await generateWithRetry({
                        phase: 'phase4',
                        roomCode: currentRoom.code,
                        difficulty: getRoomDifficulty(currentRoom),
                        language: getRoomLanguage(currentRoom),
                        completeCount: missingCount,
                        existingQuestions: existingPhase4
                    });

                    // Merge existing + new questions
                    const mergedQuestions = [...existingPhase4, ...(result.data as unknown[])];

                    await overwriteGameQuestions(currentRoom.code, 'phase4', mergedQuestions);
                    return;
                } catch (err) {
                    console.error('[QUESTION-GEN] ❌ Phase 4: Completion failed, trying full generation:', err);
                    // Fall through to full generation
                }
            }

            // Full generation

            try {
                const result = await generateWithRetry({ phase: 'phase4', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom), language: getRoomLanguage(currentRoom) });

                // Filter out already-seen questions
                let filteredData = result.data;
                if (Array.isArray(filteredData)) {
                    filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                }

                await overwriteGameQuestions(currentRoom.code, 'phase4', filteredData as unknown[]);
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 4: AI generation failed:', {
                    error: (err as Error).message,
                    errorCode: (err as { code?: string })?.code
                });
                // No fallback - AI generation is mandatory
                setGenerationError("Échec de la génération Phase 4. Veuillez réessayer.");
            } finally {
                // Release the Firebase distributed lock
                await releaseGenerationLock(currentRoom.code, currentMyId);
                await setGeneratingState(currentRoom.code, false);
            }
        };

        generatePhase4Questions();
    }, [roomStatus]);

    // Phase 5 questions are now generated server-side via Pub/Sub CF (generatePhaseQuestions)
    // No client-side fallback needed - questions must be AI-generated
    const roomCode = room?.code;

    // NOTE: Background pre-generation for phases 2-5 is now handled server-side
    // via the startGame Cloud Function and Pub/Sub triggered generatePhaseQuestions.
    // This eliminates the need for client-side distributed locking and generation.

    // Handler for starting the game with automatic AI generation if needed
    // Uses Firebase-based distributed lock to prevent duplicate generation across all clients
    const handleStartGame = useCallback(async () => {
        const currentRoom = roomRef.current;
        const currentMyId = myIdRef.current;
        if (!currentRoom || !roomCode || !currentMyId) {
            return;
        }

        const startTime = performance.now();

        // Clean up any stale locks before checking
        await cleanupStaleLock(currentRoom.code);

        // Check if generation is already in progress (Firebase distributed lock)
        const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
        if (isAlreadyGenerating) {
            return;
        }

        // Try to acquire the Firebase distributed lock (atomic operation)
        const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase1');
        if (!lockAcquired) {
            return;
        }

        setGenerationError(null);

        try {
            // Check if we have enough Phase 1 questions
            const existingPhase1 = currentRoom.customQuestions?.phase1 || [];
            const missingCount = getMissingQuestionCount(currentRoom.customQuestions, 'phase1');

            // Fast path: if we have enough questions, just start via CF
            // The CF will extract answers and trigger P2-P5 background generation
            if (missingCount === 0 && existingPhase1.length > 0) {
                await startGameCF(currentRoom.code, 'multi', getRoomDifficulty(currentRoom), getRoomLanguage(currentRoom));
                return;
            }

            // Completion mode: we have some questions but not enough
            if (existingPhase1.length > 0 && missingCount > 0) {

                // Show loading state
                await setGeneratingState(currentRoom.code, true);

                try {
                    const result = await generateWithRetry({
                        phase: 'phase1',
                        roomCode: currentRoom.code,
                        difficulty: getRoomDifficulty(currentRoom),
                        language: getRoomLanguage(currentRoom),
                        completeCount: missingCount,
                        existingQuestions: existingPhase1
                    });

                    // Merge existing + new questions
                    const mergedQuestions = [...existingPhase1, ...(result.data as Question[])];

                    await overwriteGameQuestions(currentRoom.code, 'phase1', mergedQuestions);
                    // CRITICAL: Clear loading state BEFORE starting game
                    await setGeneratingState(currentRoom.code, false);
                    // Start game via CF - extracts answers and triggers P2-P5 generation
                    await startGameCF(currentRoom.code, 'multi', getRoomDifficulty(currentRoom), getRoomLanguage(currentRoom));
                    return;
                } catch (err) {
                    console.error('[QUESTION-GEN] ❌ Phase 1 completion failed:', err);
                    // Continue to try full generation as fallback
                }
            }

            // Full generation: no questions at all
            const players = Object.values(currentRoom.players);

            // Show loading state in Firebase (visible to all) - CRITICAL: Set BEFORE starting generation
            await setGeneratingState(currentRoom.code, true);

            // Build set of seen question IDs from all players
            const seenIds = new Set<string>();
            for (const player of players) {
                try {
                    const historySnap = await get(child(ref(rtdb), `userHistory/${player.id}`));
                    if (historySnap.exists()) {
                        Object.keys(historySnap.val()).forEach(id => seenIds.add(id));
                    }
                } catch {
                    // Ignore history fetch errors - player may not have history yet
                }
            }

            // Try to get a stored question set from Firestore
            const storedSet = await getRandomQuestionSet('phase1', seenIds);

            if (storedSet) {
                await overwriteGameQuestions(currentRoom.code, 'phase1', storedSet.questions);
                // CRITICAL: Clear loading state BEFORE starting game
                await setGeneratingState(currentRoom.code, false);
                // Start game via CF - extracts answers and triggers P2-P5 generation
                await startGameCF(currentRoom.code, 'multi', getRoomDifficulty(currentRoom), getRoomLanguage(currentRoom));
                return;
            }

            // No suitable stored set found - generate new ones
            const result = await generateWithRetry({ phase: 'phase1', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom), language: getRoomLanguage(currentRoom) });

            // Filter out already-seen questions (same logic as solo mode)
            let filteredData = result.data;
            if (Array.isArray(filteredData)) {
                filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
            }

            await overwriteGameQuestions(currentRoom.code, 'phase1', filteredData as unknown[]);

            // CRITICAL: Clear loading state BEFORE starting game
            await setGeneratingState(currentRoom.code, false);
            // Start game via CF - extracts answers and triggers P2-P5 generation
            await startGameCF(currentRoom.code, 'multi', getRoomDifficulty(currentRoom), getRoomLanguage(currentRoom));
        } catch (err) {
            const duration = Math.round(performance.now() - startTime);
            console.error('[QUESTION-GEN] ❌ handleStartGame failed after', `${duration}ms:`, {
                error: (err as Error).message,
                errorCode: (err as { code?: string })?.code,
                stack: (err as Error).stack
            });
            setGenerationError("Impossible de charger les questions. Reessayez.");
        } finally {
            // Always release the Firebase distributed lock and reset loading state
            await releaseGenerationLock(currentRoom.code, currentMyId);
            await setGeneratingState(currentRoom.code, false);
        }
    }, [roomCode]);

    return {
        isGenerating,
        generationError,
        handleStartGame
    };
}
