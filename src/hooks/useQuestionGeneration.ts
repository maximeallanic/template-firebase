import { useEffect, useState, useRef, useCallback } from 'react';
import { ref, get, child } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { type Room, setGameStatus, overwriteGameQuestions, setGeneratingState } from '../services/gameService';
import { getRoomDifficulty } from '../services/game/roomService';
import { type Question, hasEnoughQuestions, getMissingQuestionCount, MINIMUM_QUESTION_COUNTS } from '../types/gameTypes';
import { generateWithRetry } from '../services/aiClient';
import { filterUnseenQuestions } from '../services/historyService';
import { getRandomQuestionSet } from '../services/questionStorageService';
import { PHASE4_QUESTIONS } from '../data/phase4';
import { PHASE5_QUESTIONS } from '../data/phase5';
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
    // Uses Firebase-based distributed lock to prevent double generation across all clients
    const roomStatus = room?.state.status;
    useEffect(() => {
        if (roomStatus !== 'phase2') return;

        const generatePhase2Questions = async () => {
            const currentRoom = roomRef.current;
            const currentMyId = myIdRef.current;
            if (!currentRoom || !currentMyId) return;

            console.log('[QUESTION-GEN] 📍 Phase 2 entered, checking generation needs...', {
                roomCode: currentRoom.code,
                hasCustomQuestions: !!currentRoom.customQuestions?.phase2,
                isHost: currentRoom.hostId === currentMyId
            });

            // Check Firebase distributed lock (works across all clients/tabs)
            const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
            if (isAlreadyGenerating) {
                console.log('[QUESTION-GEN] Phase 2: Skipping - generation already in progress (Firebase lock)');
                return;
            }

            // Check if we have enough Phase 2 questions (items in set)
            const hasEnough = hasEnoughQuestions(currentRoom.customQuestions, 'phase2');
            const existingPhase2 = currentRoom.customQuestions?.phase2;

            if (hasEnough) {
                console.log('[QUESTION-GEN] Phase 2: Enough questions, skipping generation', {
                    itemCount: Array.isArray(existingPhase2) ? existingPhase2[0]?.items?.length : (existingPhase2 as { items?: unknown[] })?.items?.length
                });
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                console.log('[QUESTION-GEN] Phase 2: Not host, waiting for host to generate...');
                return;
            }

            // Try to acquire the Firebase distributed lock (atomic operation)
            const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase2');
            if (!lockAcquired) {
                console.log('[QUESTION-GEN] Phase 2: Could not acquire lock, another client is generating');
                return;
            }

            // Also set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);

            // Check for completion mode (partial questions exist)
            const missingCount = getMissingQuestionCount(currentRoom.customQuestions, 'phase2');
            const existingItems = Array.isArray(existingPhase2) ? existingPhase2[0]?.items : (existingPhase2 as { items?: unknown[] })?.items;

            if (existingItems && existingItems.length > 0 && missingCount > 0) {
                console.log('[QUESTION-GEN] 🔧 Phase 2: Completion mode - generating missing items', {
                    existing: existingItems.length,
                    missing: missingCount,
                    required: MINIMUM_QUESTION_COUNTS.phase2
                });

                try {
                    const result = await generateWithRetry({
                        phase: 'phase2',
                        roomCode: currentRoom.code,
                        difficulty: getRoomDifficulty(currentRoom),
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

                    console.log('[QUESTION-GEN] ✅ Phase 2 completion successful', {
                        existing: existingItems?.length || 0,
                        generated: newItems.length,
                        total: mergedSet.items.length
                    });

                    await overwriteGameQuestions(currentRoom.code, 'phase2', [mergedSet]);
                    return;
                } catch (err) {
                    console.error('[QUESTION-GEN] ❌ Phase 2: Completion failed, trying full generation:', err);
                    // Fall through to full generation
                }
            }

            // Full generation
            console.log('[QUESTION-GEN] 🎯 Phase 2: Starting full generation...', {
                roomCode: currentRoom.code,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await generateWithRetry({ phase: 'phase2', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom) });

                // Filter out already-seen items (Phase 2 has items array inside the object)
                let filteredData = result.data;
                if ((filteredData as { items?: unknown[] })?.items) {
                    const setData = filteredData as { items: { text: string }[] };
                    const filteredItems = await filterUnseenQuestions(setData.items, (item: { text: string }) => item.text);
                    filteredData = [{ ...setData, items: filteredItems }];
                    console.log(`[QUESTION-GEN] 🔍 Filtered phase2 items: ${setData.items.length} -> ${filteredItems.length}`);
                }

                console.log('[QUESTION-GEN] Phase 2: Saving generated questions to Firebase...');
                await overwriteGameQuestions(currentRoom.code, 'phase2', filteredData as unknown[]);
                console.log('[QUESTION-GEN] ✅ Phase 2: Generation complete!');
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

            console.log('[QUESTION-GEN] 📍 Phase 3 entered, checking generation needs...', {
                roomCode: currentRoom.code,
                hasCustomQuestions: !!existingPhase3,
                menuCount: Array.isArray(existingPhase3) ? existingPhase3.length : 0,
                isHost: currentRoom.hostId === currentMyId
            });

            // If we already have menus, skip generation
            if (existingPhase3 && Array.isArray(existingPhase3) && existingPhase3.length >= 4) {
                console.log('[QUESTION-GEN] Phase 3: Already has menus, skipping generation', {
                    menuCount: existingPhase3.length
                });
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                console.log('[QUESTION-GEN] Phase 3: Not host, waiting for host to generate...');
                return;
            }

            // Check Firebase distributed lock (works across all clients/tabs)
            const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
            if (isAlreadyGenerating) {
                console.log('[QUESTION-GEN] Phase 3: Skipping - generation already in progress (Firebase lock)');
                return;
            }

            // Try to acquire the Firebase distributed lock (atomic operation)
            const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase3');
            if (!lockAcquired) {
                console.log('[QUESTION-GEN] Phase 3: Could not acquire lock, another client is generating');
                return;
            }

            hasFilteredPhase3.current = true;

            // Set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);

            // Full generation (Phase 3 always generates all 4 menus)
            console.log('[QUESTION-GEN] 🎯 Phase 3: Starting full AI generation...', {
                roomCode: currentRoom.code,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await generateWithRetry({ phase: 'phase3', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom) });

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
                            console.log(`[QUESTION-GEN] 🔍 Filtered phase3 menu "${menu.title}": ${menu.questions.length} -> ${filteredQuestions.length}`);
                            menu.questions = filteredQuestions;
                        }
                    }
                    filteredData = menus;
                }

                console.log('[QUESTION-GEN] ✅ Phase 3 generation successful', {
                    menuCount: Array.isArray(filteredData) ? filteredData.length : 0
                });

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

            console.log('[QUESTION-GEN] 📍 Phase 4 entered, checking generation needs...', {
                roomCode: currentRoom.code,
                existingCount: existingPhase4.length,
                missingCount,
                isHost: currentRoom.hostId === currentMyId
            });

            // Fast path: enough questions
            if (missingCount === 0 && existingPhase4.length > 0) {
                console.log('[QUESTION-GEN] Phase 4: Enough questions, skipping generation', {
                    count: existingPhase4.length,
                    required: MINIMUM_QUESTION_COUNTS.phase4
                });
                return;
            }

            const currentIsHost = currentRoom.hostId === currentMyId;
            if (!currentIsHost) {
                console.log('[QUESTION-GEN] Phase 4: Not host, waiting for host to generate...');
                return;
            }

            // Check Firebase distributed lock (works across all clients/tabs)
            const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
            if (isAlreadyGenerating) {
                console.log('[QUESTION-GEN] Phase 4: Skipping - generation already in progress (Firebase lock)');
                return;
            }

            // Try to acquire the Firebase distributed lock (atomic operation)
            const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase4');
            if (!lockAcquired) {
                console.log('[QUESTION-GEN] Phase 4: Could not acquire lock, another client is generating');
                return;
            }

            hasFilteredPhase4.current = true;

            // Set visible generation state for loading UI
            await setGeneratingState(currentRoom.code, true);

            // Completion mode: we have some questions but not enough
            if (existingPhase4.length > 0 && missingCount > 0) {
                console.log('[QUESTION-GEN] 🔧 Phase 4: Completion mode - generating missing questions', {
                    existing: existingPhase4.length,
                    missing: missingCount,
                    required: MINIMUM_QUESTION_COUNTS.phase4
                });

                try {
                    const result = await generateWithRetry({
                        phase: 'phase4',
                        roomCode: currentRoom.code,
                        difficulty: getRoomDifficulty(currentRoom),
                        completeCount: missingCount,
                        existingQuestions: existingPhase4
                    });

                    // Merge existing + new questions
                    const mergedQuestions = [...existingPhase4, ...(result.data as unknown[])];
                    console.log('[QUESTION-GEN] ✅ Phase 4 completion successful', {
                        existing: existingPhase4.length,
                        generated: Array.isArray(result.data) ? result.data.length : 0,
                        total: mergedQuestions.length
                    });

                    await overwriteGameQuestions(currentRoom.code, 'phase4', mergedQuestions);
                    return;
                } catch (err) {
                    console.error('[QUESTION-GEN] ❌ Phase 4: Completion failed, trying full generation:', err);
                    // Fall through to full generation
                }
            }

            // Full generation
            console.log('[QUESTION-GEN] 🎯 Phase 4: Starting full AI generation...', {
                roomCode: currentRoom.code,
                timestamp: new Date().toISOString()
            });

            try {
                const result = await generateWithRetry({ phase: 'phase4', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom) });

                // Filter out already-seen questions
                let filteredData = result.data;
                if (Array.isArray(filteredData)) {
                    filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                    console.log(`[QUESTION-GEN] 🔍 Filtered phase4: ${(result.data as unknown[]).length} -> ${(filteredData as unknown[]).length}`);
                }

                console.log('[QUESTION-GEN] Phase 4: Saving generated questions to Firebase...');
                await overwriteGameQuestions(currentRoom.code, 'phase4', filteredData as unknown[]);
                console.log('[QUESTION-GEN] ✅ Phase 4: AI generation complete!');
            } catch (err) {
                console.error('[QUESTION-GEN] ❌ Phase 4: AI generation failed, using fallback:', {
                    error: (err as Error).message,
                    errorCode: (err as { code?: string })?.code
                });
                setGenerationError("Échec de la génération Phase 4. Questions par défaut utilisées.");

                // Fallback to filtered static questions
                console.log('[QUESTION-GEN] 🔍 Phase 4: Filtering static fallback questions...');
                const filtered = await filterUnseenQuestions(PHASE4_QUESTIONS, q => q.text);
                console.log('[QUESTION-GEN] Phase 4: Fallback filter result', {
                    original: PHASE4_QUESTIONS.length,
                    filtered: filtered.length
                });
                await overwriteGameQuestions(currentRoom.code, 'phase4', filtered);
                console.log('[QUESTION-GEN] ✅ Phase 4: Fallback questions saved');
            } finally {
                // Release the Firebase distributed lock
                await releaseGenerationLock(currentRoom.code, currentMyId);
                await setGeneratingState(currentRoom.code, false);
            }
        };

        generatePhase4Questions();
    }, [roomStatus]);

    // Automatic Phase 5 Filtering
    const roomCode = room?.code;
    const hasPhase2CustomQuestions = !!room?.customQuestions?.phase2;
    const hasPhase3CustomQuestions = !!room?.customQuestions?.phase3;
    const hasPhase4CustomQuestions = !!room?.customQuestions?.phase4;
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

    // Helper function to trigger background pre-generation for all phases (non-blocking)
    // Chains Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 generation
    // Uses Firebase-based distributed locks to prevent duplicate generation across all clients
    const triggerPhase2Pregen = useCallback(async (pregenRoomCode: string) => {
        const currentMyId = myIdRef.current;
        if (!currentMyId) {
            console.warn('[QUESTION-GEN] triggerPhase2Pregen: No player ID available');
            return;
        }

        // ===== PHASE 2 =====
        if (!hasPhase2CustomQuestions) {
            // Try to acquire Firebase distributed lock
            const lockAcquired = await acquireGenerationLock(pregenRoomCode, currentMyId, 'phase2-pregen');
            if (lockAcquired) {
                console.log('[QUESTION-GEN] 🎯 Phase 2: Starting background pre-generation...', {
                    roomCode: pregenRoomCode,
                    timestamp: new Date().toISOString()
                });

                try {
                    const result = await generateWithRetry({ phase: 'phase2', roomCode: pregenRoomCode, difficulty: getRoomDifficulty(roomRef.current) });
                    console.log('[QUESTION-GEN] Phase 2: Pregen result received, filtering and saving...');

                    let filteredData = result.data;
                    if ((filteredData as { items?: unknown[] })?.items) {
                        const setData = filteredData as { items: { text: string }[] };
                        const filteredItems = await filterUnseenQuestions(setData.items, (item: { text: string }) => item.text);
                        filteredData = [{ ...setData, items: filteredItems }];
                        console.log(`[QUESTION-GEN] 🔍 Filtered phase2 pregen items: ${setData.items.length} -> ${filteredItems.length}`);
                    }

                    await overwriteGameQuestions(pregenRoomCode, 'phase2', filteredData as unknown[]);
                    console.log('[QUESTION-GEN] ✅ Phase 2: Pre-generation successful!');
                } catch (err) {
                    console.warn('[QUESTION-GEN] ❌ Phase 2: Pre-generation failed:', (err as Error).message);
                } finally {
                    await releaseGenerationLock(pregenRoomCode, currentMyId);
                }
            } else {
                console.log('[QUESTION-GEN] Phase 2: Skipping pregen - lock already held');
            }
        } else {
            console.log('[QUESTION-GEN] Phase 2: Skipping pregen - already has custom questions');
        }

        // ===== PHASE 3 =====
        if (!hasPhase3CustomQuestions) {
            // Try to acquire Firebase distributed lock
            const lockAcquired = await acquireGenerationLock(pregenRoomCode, currentMyId, 'phase3-pregen');
            if (lockAcquired) {
                console.log('[QUESTION-GEN] 🎯 Phase 3: Starting background pre-generation...', {
                    roomCode: pregenRoomCode,
                    timestamp: new Date().toISOString()
                });

                try {
                    const result = await generateWithRetry({ phase: 'phase3', roomCode: pregenRoomCode, difficulty: getRoomDifficulty(roomRef.current) });
                    console.log('[QUESTION-GEN] Phase 3: Pregen result received, filtering and saving...');

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

                    await overwriteGameQuestions(pregenRoomCode, 'phase3', filteredData as unknown[]);
                    console.log('[QUESTION-GEN] ✅ Phase 3: Pre-generation successful!');
                } catch (err) {
                    console.warn('[QUESTION-GEN] ❌ Phase 3: Pre-generation failed:', (err as Error).message);
                } finally {
                    await releaseGenerationLock(pregenRoomCode, currentMyId);
                }
            } else {
                console.log('[QUESTION-GEN] Phase 3: Skipping pregen - lock already held');
            }
        } else {
            console.log('[QUESTION-GEN] Phase 3: Skipping pregen - already has custom questions');
        }

        // ===== PHASE 4 =====
        if (!hasPhase4CustomQuestions) {
            // Try to acquire Firebase distributed lock
            const lockAcquired = await acquireGenerationLock(pregenRoomCode, currentMyId, 'phase4-pregen');
            if (lockAcquired) {
                console.log('[QUESTION-GEN] 🎯 Phase 4: Starting background pre-generation...', {
                    roomCode: pregenRoomCode,
                    timestamp: new Date().toISOString()
                });

                try {
                    const result = await generateWithRetry({ phase: 'phase4', roomCode: pregenRoomCode, difficulty: getRoomDifficulty(roomRef.current) });
                    console.log('[QUESTION-GEN] Phase 4: Pregen result received, filtering and saving...');

                    let filteredData = result.data;
                    if (Array.isArray(filteredData)) {
                        filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                    }

                    await overwriteGameQuestions(pregenRoomCode, 'phase4', filteredData as unknown[]);
                    console.log('[QUESTION-GEN] ✅ Phase 4: Pre-generation successful!');
                } catch (err) {
                    console.warn('[QUESTION-GEN] ❌ Phase 4: Pre-generation failed:', (err as Error).message);
                } finally {
                    await releaseGenerationLock(pregenRoomCode, currentMyId);
                }
            } else {
                console.log('[QUESTION-GEN] Phase 4: Skipping pregen - lock already held');
            }
        } else {
            console.log('[QUESTION-GEN] Phase 4: Skipping pregen - already has custom questions');
        }

        // ===== PHASE 5 =====
        if (!hasPhase5CustomQuestions) {
            // Try to acquire Firebase distributed lock
            const lockAcquired = await acquireGenerationLock(pregenRoomCode, currentMyId, 'phase5-pregen');
            if (lockAcquired) {
                console.log('[QUESTION-GEN] 🎯 Phase 5: Starting background pre-generation...', {
                    roomCode: pregenRoomCode,
                    timestamp: new Date().toISOString()
                });

                try {
                    const result = await generateWithRetry({ phase: 'phase5', roomCode: pregenRoomCode, difficulty: getRoomDifficulty(roomRef.current) });
                    console.log('[QUESTION-GEN] Phase 5: Pregen result received, filtering and saving...');

                    let filteredData = result.data;
                    if (Array.isArray(filteredData)) {
                        filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                    }

                    await overwriteGameQuestions(pregenRoomCode, 'phase5', filteredData as unknown[]);
                    console.log('[QUESTION-GEN] ✅ Phase 5: Pre-generation successful!');
                } catch (err) {
                    console.warn('[QUESTION-GEN] ❌ Phase 5: Pre-generation failed:', (err as Error).message);
                } finally {
                    await releaseGenerationLock(pregenRoomCode, currentMyId);
                }
            } else {
                console.log('[QUESTION-GEN] Phase 5: Skipping pregen - lock already held');
            }
        } else {
            console.log('[QUESTION-GEN] Phase 5: Skipping pregen - already has custom questions');
        }

        console.log('[QUESTION-GEN] 🏁 All phases pre-generation complete!');
    }, [hasPhase2CustomQuestions, hasPhase3CustomQuestions, hasPhase4CustomQuestions, hasPhase5CustomQuestions]);

    // Handler for starting the game with automatic AI generation if needed
    // Uses Firebase-based distributed lock to prevent duplicate generation across all clients
    const handleStartGame = useCallback(async () => {
        const currentRoom = roomRef.current;
        const currentMyId = myIdRef.current;
        if (!currentRoom || !roomCode || !currentMyId) {
            console.warn('[QUESTION-GEN] handleStartGame called with no room or player ID!');
            return;
        }

        const startTime = performance.now();
        console.log('[QUESTION-GEN] 🚀 handleStartGame called', {
            roomCode: currentRoom.code,
            playerCount: Object.keys(currentRoom.players || {}).length,
            hasCustomPhase1: !!currentRoom.customQuestions?.phase1,
            timestamp: new Date().toISOString()
        });

        // Clean up any stale locks before checking
        await cleanupStaleLock(currentRoom.code);

        // Check if generation is already in progress (Firebase distributed lock)
        const isAlreadyGenerating = await isGenerationLocked(currentRoom.code);
        if (isAlreadyGenerating) {
            console.log('[QUESTION-GEN] ⏸️ Phase 1 generation already in progress (Firebase lock), skipping');
            return;
        }

        // Try to acquire the Firebase distributed lock (atomic operation)
        const lockAcquired = await acquireGenerationLock(currentRoom.code, currentMyId, 'phase1');
        if (!lockAcquired) {
            console.log('[QUESTION-GEN] ⏸️ Could not acquire Phase 1 lock, another client is generating');
            return;
        }

        setGenerationError(null);

        try {
            // Check if we have enough Phase 1 questions
            const existingPhase1 = currentRoom.customQuestions?.phase1 || [];
            const missingCount = getMissingQuestionCount(currentRoom.customQuestions, 'phase1');

            // Fast path: if we have enough questions, just start
            if (missingCount === 0 && existingPhase1.length > 0) {
                console.log('[QUESTION-GEN] ⚡ Fast path: Enough questions', {
                    count: existingPhase1.length,
                    required: MINIMUM_QUESTION_COUNTS.phase1
                });
                await setGameStatus(currentRoom.code, 'phase1');
                triggerPhase2Pregen(currentRoom.code);
                return;
            }

            // Completion mode: we have some questions but not enough
            if (existingPhase1.length > 0 && missingCount > 0) {
                console.log('[QUESTION-GEN] 🔧 Completion mode: generating missing Phase 1 questions', {
                    existing: existingPhase1.length,
                    missing: missingCount,
                    required: MINIMUM_QUESTION_COUNTS.phase1
                });

                // Show loading state
                await setGeneratingState(currentRoom.code, true);

                try {
                    const result = await generateWithRetry({
                        phase: 'phase1',
                        roomCode: currentRoom.code,
                        difficulty: getRoomDifficulty(currentRoom),
                        completeCount: missingCount,
                        existingQuestions: existingPhase1
                    });

                    // Merge existing + new questions
                    const mergedQuestions = [...existingPhase1, ...(result.data as Question[])];
                    console.log('[QUESTION-GEN] ✅ Phase 1 completion successful', {
                        existing: existingPhase1.length,
                        generated: Array.isArray(result.data) ? result.data.length : 0,
                        total: mergedQuestions.length
                    });

                    await overwriteGameQuestions(currentRoom.code, 'phase1', mergedQuestions);
                    // CRITICAL: Clear loading state BEFORE starting game
                    await setGeneratingState(currentRoom.code, false);
                    await setGameStatus(currentRoom.code, 'phase1');
                    triggerPhase2Pregen(currentRoom.code);
                    return;
                } catch (err) {
                    console.error('[QUESTION-GEN] ❌ Phase 1 completion failed:', err);
                    // Continue to try full generation as fallback
                }
            }

            // Full generation: no questions at all
            const players = Object.values(currentRoom.players);
            console.log('[QUESTION-GEN] 🤖 Starting AI generation for Phase 1...', { playerCount: players.length });

            // Show loading state in Firebase (visible to all) - CRITICAL: Set BEFORE starting generation
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
                // CRITICAL: Clear loading state BEFORE starting game
                await setGeneratingState(currentRoom.code, false);
                await setGameStatus(currentRoom.code, 'phase1');
                triggerPhase2Pregen(currentRoom.code);
                console.log(`[QUESTION-GEN] 🎮 Game started in ${Math.round(performance.now() - startTime)}ms (Firestore questions)`);
                return;
            }

            // No suitable stored set found - generate new ones
            console.log('[QUESTION-GEN] 🤖 No stored questions available, starting AI generation...');
            const result = await generateWithRetry({ phase: 'phase1', roomCode: currentRoom.code, difficulty: getRoomDifficulty(currentRoom) });

            // Filter out already-seen questions (same logic as solo mode)
            let filteredData = result.data;
            if (Array.isArray(filteredData)) {
                filteredData = await filterUnseenQuestions(filteredData as { text: string }[], (q: { text: string }) => q.text);
                console.log(`[QUESTION-GEN] 🔍 Filtered phase1: ${(result.data as unknown[]).length} -> ${(filteredData as unknown[]).length}`);
            }

            console.log('[QUESTION-GEN] 💾 Saving AI-generated questions to Firebase...', {
                questionCount: Array.isArray(filteredData) ? filteredData.length : 'N/A',
                topic: result.topic
            });
            await overwriteGameQuestions(currentRoom.code, 'phase1', filteredData as unknown[]);
            console.log('[QUESTION-GEN] ✅ AI questions saved successfully!');

            // CRITICAL: Clear loading state BEFORE starting game
            await setGeneratingState(currentRoom.code, false);
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
            // Always release the Firebase distributed lock and reset loading state
            await releaseGenerationLock(currentRoom.code, currentMyId);
            await setGeneratingState(currentRoom.code, false);
        }
    }, [roomCode, triggerPhase2Pregen]);

    return {
        isGenerating,
        generationError,
        handleStartGame
    };
}
