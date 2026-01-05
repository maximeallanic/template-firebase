/**
 * Leaderboard Service
 * Handles persistence and retrieval of solo mode high scores
 */

import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    Timestamp,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Avatar } from '../types/gameTypes';

export interface LeaderboardEntry {
    id?: string;
    playerId: string;
    playerName: string;
    playerAvatar: Avatar;
    score: number;
    phase1Score: number;
    phase2Score: number;
    phase4Score: number;
    accuracy: number; // percentage (0-100)
    totalTimeMs: number;
    createdAt: Timestamp | null;
    isAuthenticated: boolean; // true if user was logged in
}

const COLLECTION_NAME = 'soloLeaderboard';

/**
 * Validate score entry before submission
 * Basic client-side validation to catch obvious errors
 * Note: For real security, validation should happen in a Cloud Function
 */
function validateScoreEntry(entry: Omit<LeaderboardEntry, 'id' | 'createdAt'>): void {
    // Validate total score
    if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 300) {
        throw new Error(`Invalid score value: ${entry.score}`);
    }

    // Validate accuracy percentage
    if (typeof entry.accuracy !== 'number' || entry.accuracy < 0 || entry.accuracy > 100) {
        throw new Error(`Invalid accuracy value: ${entry.accuracy}`);
    }

    // Validate phase scores are non-negative integers
    if (!Number.isInteger(entry.phase1Score) || entry.phase1Score < 0) {
        throw new Error(`Invalid phase1Score: ${entry.phase1Score}`);
    }
    if (!Number.isInteger(entry.phase2Score) || entry.phase2Score < 0) {
        throw new Error(`Invalid phase2Score: ${entry.phase2Score}`);
    }
    if (!Number.isInteger(entry.phase4Score) || entry.phase4Score < 0) {
        throw new Error(`Invalid phase4Score: ${entry.phase4Score}`);
    }

    // Check score consistency (sum of phases should roughly equal total)
    const sumPhaseScores = entry.phase1Score + entry.phase2Score + entry.phase4Score;
    if (Math.abs(entry.score - sumPhaseScores) > 10) {
        console.warn('[Leaderboard] Score mismatch detected:', {
            totalScore: entry.score,
            sumPhaseScores,
            difference: Math.abs(entry.score - sumPhaseScores),
        });
    }

    // Validate time is positive
    if (typeof entry.totalTimeMs !== 'number' || entry.totalTimeMs < 0) {
        throw new Error(`Invalid totalTimeMs: ${entry.totalTimeMs}`);
    }
}

/**
 * Submit a score to the leaderboard
 * If the player already has an entry, only updates if the new score is better
 */
export async function submitScore(entry: Omit<LeaderboardEntry, 'id' | 'createdAt'>): Promise<string> {
    // Validate entry before submission
    validateScoreEntry(entry);

    try {
        // Check if player already has an entry
        const q = query(
            collection(db, COLLECTION_NAME),
            where('playerId', '==', entry.playerId),
            limit(1)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const existingDoc = snapshot.docs[0];
            const existingData = existingDoc.data() as LeaderboardEntry;

            // Only update if new score is better
            if (entry.score > existingData.score) {
                await updateDoc(doc(db, COLLECTION_NAME, existingDoc.id), {
                    ...entry,
                    createdAt: serverTimestamp(),
                });
            }
            return existingDoc.id;
        }

        // No existing entry, create new one
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...entry,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('[Leaderboard] Failed to submit score:', error);
        throw error;
    }
}

/**
 * Get top scores from the leaderboard
 */
export async function getTopScores(limitCount: number = 50): Promise<LeaderboardEntry[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as LeaderboardEntry));
    } catch (error) {
        console.error('[Leaderboard] Failed to get top scores:', error);
        throw error;
    }
}

/**
 * Get scores for the current authenticated user
 */
export async function getMyScores(limitCount: number = 10): Promise<LeaderboardEntry[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        return [];
    }

    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('playerId', '==', userId),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        } as LeaderboardEntry));
    } catch (error) {
        console.error('[Leaderboard] Failed to get my scores:', error);
        throw error;
    }
}

/**
 * Get the user's best score
 */
export async function getMyBestScore(): Promise<LeaderboardEntry | null> {
    const scores = await getMyScores(1);
    return scores.length > 0 ? scores[0] : null;
}

/**
 * Get the user's rank on the leaderboard
 */
export async function getMyRank(score: number): Promise<number> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('score', '>', score)
        );

        const snapshot = await getDocs(q);
        return snapshot.size + 1; // Rank is number of higher scores + 1
    } catch (error) {
        console.error('[Leaderboard] Failed to get rank:', error);
        return -1;
    }
}

/**
 * Cleanup duplicate entries, keeping only the best score per player
 * Run this once to migrate existing data
 */
export async function cleanupDuplicates(): Promise<{ deleted: number; kept: number }> {
    const allDocs = await getDocs(collection(db, COLLECTION_NAME));

    // Group by playerId and keep the best score
    const bestByPlayer = new Map<string, { docId: string; score: number }>();
    const toDelete: string[] = [];

    allDocs.forEach((docSnap) => {
        const data = docSnap.data() as LeaderboardEntry;
        const existing = bestByPlayer.get(data.playerId);

        if (!existing) {
            bestByPlayer.set(data.playerId, { docId: docSnap.id, score: data.score });
        } else if (data.score > existing.score) {
            // This score is better, delete the old one
            toDelete.push(existing.docId);
            bestByPlayer.set(data.playerId, { docId: docSnap.id, score: data.score });
        } else {
            // Existing is better, delete this one
            toDelete.push(docSnap.id);
        }
    });

    // Delete duplicates
    for (const docId of toDelete) {
        await deleteDoc(doc(db, COLLECTION_NAME, docId));
    }

    console.log(`[Leaderboard] Cleanup complete: deleted ${toDelete.length}, kept ${bestByPlayer.size}`);
    return { deleted: toDelete.length, kept: bestByPlayer.size };
}
