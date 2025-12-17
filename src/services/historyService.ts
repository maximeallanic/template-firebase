import { ref, get, update, child } from 'firebase/database';
import { rtdb, auth } from './firebase';
import type { Player } from './gameService';
import { QUESTIONS } from '../data/questions';

/**
 * Generates a consistent hash ID from a question string.
 * Used to track "seen" questions without modifying the static data files.
 */
export function generateQuestionId(text: string): string {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

/**
 * Marks a question as seen by the current authenticated user in the RTDB.
 * Path: userHistory/{auth.uid}/{questionId} = timestamp
 * Note: Uses auth.uid (not playerId) to match database security rules.
 */
export async function markQuestionAsSeen(_playerId: string, questionText: string): Promise<void> {
    // Use auth.uid for database path (required by security rules)
    const userId = auth.currentUser?.uid;
    console.log('🔍 markQuestionAsSeen called:', { userId, questionText: questionText?.substring(0, 30) });

    if (!userId || !questionText) {
        console.warn('⚠️ markQuestionAsSeen skipped:', { userId, hasText: !!questionText });
        return;
    }

    try {
        const qId = generateQuestionId(questionText);
        console.log('📝 Marking question as seen:', { qId, userId });
        const historyRef = ref(rtdb, `userHistory/${userId}`);
        await update(historyRef, {
            [qId]: Date.now()
        });
        console.log('✅ Question marked as seen successfully');
    } catch (error) {
        console.error("❌ Error marking question as seen:", error);
    }
}

/**
 * Checks if a specific player has seen a specific question.
 */
export async function hasUserSeenQuestion(playerId: string, questionText: string): Promise<boolean> {
    if (!playerId || !questionText) return false;

    try {
        const qId = generateQuestionId(questionText);
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
    if (!user) return new Set();

    try {
        const historyRef = ref(rtdb, `userHistory/${user.uid}`);
        const snapshot = await get(historyRef);
        return snapshot.exists() ? new Set(Object.keys(snapshot.val())) : new Set();
    } catch (error) {
        console.error('Error getting seen questions:', error);
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
    if (!questions || questions.length === 0) return questions;

    const seenHashes = await getSeenQuestionHashes();
    if (seenHashes.size === 0) return questions;

    const unseen = questions.filter(q => {
        const text = getTextFn(q);
        if (!text) return true; // Keep items without text
        const hash = generateQuestionId(text);
        return !seenHashes.has(hash);
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
    if (!players || players.length === 0) return false;

    try {
        const totalStaticQuestions = QUESTIONS.length;

        // If no default questions exist, always trigger AI generation
        if (totalStaticQuestions === 0) {
            console.log("📋 Aucune question par défaut - génération IA requise");
            return true;
        }
        // Optimization: checking specific questions is expensive for many players.
        // For now, we can check count or assume if they have a lot of history.
        // Better approach: Get all history for all players and check overlap.

        const histories = await Promise.all(
            players.map(p => get(child(ref(rtdb), `userHistory/${p.id}`)))
        );

        // Simple check: Is there any question in QUESTIONS that EVERYONE has seen?
        // Wait, requirements says: "If a user ... has already had all existing questions".
        // Let's interpret as: If the intersection of "Unseen by Player A" AND "Unseen by Player B" ... is empty.
        // Actually simpler: If the game cannot find a question that at least ONE person hasn't seen?
        // Or strictly: if WE define the question set for the game, we want to pick one that is new to AS MANY as possible.
        // But the prompt says: "Si un utilisateur ... a déja eu toute les questions" -> "If A user has already had ALL questions".
        // So if ANY player has seen all questions, we generate new ones? Or only if ALL players have?
        // Usually, you generate if you can't serve a "fresh" question to the current player.
        // But Phase 1 is for everyone.
        // Let's go with: If > 50% of the static pool is seen by the majority, or simpler:
        // If (Unseen Questions Count) < 5 (Threshold), trigger generation.

        // Let's just grab the FULL history keys for each player
        const playerSeenIds = histories.map(snap => {
            if (!snap.exists()) return new Set<string>();
            return new Set(Object.keys(snap.val()));
        });

        // Calculate available static questions that are "Fresh" (seen by no one, or few)
        // Actually, trigger condition: "Si un utilisateur ... a déja eu TOUTE les questions"
        // So checking if ANY player has seen ALL static questions.

        for (let i = 0; i < playerSeenIds.length; i++) {
            const seenSet = playerSeenIds[i];
            let seenCount = 0;
            for (const q of QUESTIONS) {
                const qId = generateQuestionId(q.text);
                if (seenSet.has(qId)) {
                    seenCount++;
                }
            }
            console.log(`📋 Joueur ${players[i]?.id?.slice(0, 8)}... : ${seenCount}/${totalStaticQuestions} questions vues`);
            // If a single player has seen 100% of questions, trigger AI generation
            if (seenCount >= totalStaticQuestions) {
                console.log("✅ Exhaustion détectée pour ce joueur !");
                return true;
            }
        }

        console.log("❌ Aucun joueur n'a vu 100% des questions");
        return false;
    } catch (error) {
        console.error("Error checking exhaustion:", error);
        return false;
    }
}
