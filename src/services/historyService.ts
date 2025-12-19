import { ref, get, update, child } from 'firebase/database';
import { rtdb, auth } from './firebase';
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
