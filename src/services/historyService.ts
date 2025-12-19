import { ref, get, update, child } from 'firebase/database';
import { rtdb, auth } from './firebase';
import type { Player } from '../types/gameTypes';
import { QUESTIONS } from '../data/questions';
import { generateQuestionHash } from '../utils/hash';

/**
 * Marks a question as seen by the current authenticated user in the RTDB.
 * Path: userHistory/{auth.uid}/{questionId} = timestamp
 * Note: Uses auth.uid (not playerId) to match database security rules.
 */
export async function markQuestionAsSeen(_playerId: string, questionText: string): Promise<void> {
    // Use auth.uid for database path (required by security rules)
    const userId = auth.currentUser?.uid;

    if (!userId || !questionText) {
        return;
    }

    try {
        const qId = generateQuestionHash(questionText);
        const historyRef = ref(rtdb, `userHistory/${userId}`);
        await update(historyRef, {
            [qId]: Date.now()
        });
    } catch (error) {
        console.error("Error marking question as seen:", error);
    }
}

/**
 * Checks if a specific player has seen a specific question.
 */
export async function hasUserSeenQuestion(playerId: string, questionText: string): Promise<boolean> {
    if (!playerId || !questionText) return false;

    try {
        const qId = generateQuestionHash(questionText);
        const snapshot = await get(child(ref(rtdb), `userHistory/${playerId}/${qId}`));
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking question history:", error);
        return false;
    }
}

/**
 * Retrieves all question hashes seen by the current authenticated user.
 * Returns a Set of hash strings for efficient lookup.
 */
export async function getSeenQuestionHashes(): Promise<Set<string>> {
    const user = auth.currentUser;
    if (!user) {
        console.log('[HISTORY-SVC] getSeenQuestionHashes: No authenticated user');
        return new Set();
    }

    try {
        const historyRef = ref(rtdb, `userHistory/${user.uid}`);
        const snapshot = await get(historyRef);
        const seenHashes = snapshot.exists() ? new Set(Object.keys(snapshot.val())) : new Set<string>();
        console.log('[HISTORY-SVC] getSeenQuestionHashes result:', {
            userId: user.uid,
            seenCount: seenHashes.size
        });
        return seenHashes;
    } catch (error) {
        console.error('[HISTORY-SVC] Error getting seen questions:', error);
        return new Set();
    }
}

/**
 * Filters out questions that have been seen by the current user.
 * Uses a callback function to extract the text from each question object.
 * If all questions have been seen, returns all questions to allow cycling.
 *
 * @param questions - Array of question objects to filter
 * @param getTextFn - Function to extract the text from a question object
 * @returns Array of unseen questions, or all questions if all have been seen
 */
export async function filterUnseenQuestions<T>(
    questions: T[],
    getTextFn: (q: T) => string
): Promise<T[]> {
    console.log('[HISTORY-SVC] filterUnseenQuestions called:', {
        inputCount: questions?.length || 0
    });

    if (!questions || questions.length === 0) {
        console.log('[HISTORY-SVC] filterUnseenQuestions: Empty input, returning as-is');
        return questions;
    }

    const seenHashes = await getSeenQuestionHashes();
    if (seenHashes.size === 0) {
        console.log('[HISTORY-SVC] filterUnseenQuestions: No seen history, returning all questions');
        return questions;
    }

    const unseen = questions.filter(q => {
        const text = getTextFn(q);
        if (!text) return true; // Keep items without text
        const hash = generateQuestionHash(text);
        return !seenHashes.has(hash);
    });

    console.log('[HISTORY-SVC] filterUnseenQuestions result:', {
        input: questions.length,
        seenByUser: seenHashes.size,
        unseen: unseen.length,
        filtered: questions.length - unseen.length,
        willCycle: unseen.length === 0
    });

    // If all questions have been seen, return all to allow cycling
    return unseen.length > 0 ? unseen : questions;
}

/**
 * Check if ANY player in the room has exhausted the static Phase 1 questions.
 * Returns true if for any player, the number of seen static questions >= total static questions.
 * (Or a more sophisticated check: if the intersection of unseen questions for all players is empty).
 */
export async function checkPhase1Exhaustion(players: Player[]): Promise<boolean> {
    console.log('[HISTORY-SVC] checkPhase1Exhaustion called:', {
        playerCount: players?.length || 0,
        playerNames: players?.map(p => p.name) || []
    });

    if (!players || players.length === 0) {
        console.log('[HISTORY-SVC] checkPhase1Exhaustion: No players, returning false');
        return false;
    }

    try {
        const totalStaticQuestions = QUESTIONS.length;
        console.log('[HISTORY-SVC] Total static questions:', totalStaticQuestions);

        // If no default questions exist, always trigger AI generation
        if (totalStaticQuestions === 0) {
            console.log('[HISTORY-SVC] checkPhase1Exhaustion: No static questions, returning true');
            return true;
        }

        console.log('[HISTORY-SVC] Fetching history for all players...');
        const histories = await Promise.all(
            players.map(p => get(child(ref(rtdb), `userHistory/${p.id}`)))
        );

        // Let's just grab the FULL history keys for each player
        const playerSeenIds = histories.map(snap => {
            if (!snap.exists()) return new Set<string>();
            return new Set(Object.keys(snap.val()));
        });

        // Log each player's seen count
        const playerStats: { name: string; seenCount: number; totalSeen: number }[] = [];
        for (let i = 0; i < playerSeenIds.length; i++) {
            const seenSet = playerSeenIds[i];
            let seenStaticCount = 0;
            for (const q of QUESTIONS) {
                const qId = generateQuestionHash(q.text);
                if (seenSet.has(qId)) {
                    seenStaticCount++;
                }
            }
            playerStats.push({
                name: players[i].name,
                seenCount: seenStaticCount,
                totalSeen: seenSet.size
            });

            // If a single player has seen 100% of questions, trigger AI generation
            if (seenStaticCount >= totalStaticQuestions) {
                console.log('[HISTORY-SVC] 🚨 Player exhausted static pool!', {
                    player: players[i].name,
                    seenStaticCount,
                    totalStaticQuestions
                });
                return true;
            }
        }

        console.log('[HISTORY-SVC] checkPhase1Exhaustion: Player stats:', playerStats);
        console.log('[HISTORY-SVC] checkPhase1Exhaustion: No exhaustion detected, returning false');
        return false;
    } catch (error) {
        console.error('[HISTORY-SVC] Error checking exhaustion:', error);
        return false;
    }
}
