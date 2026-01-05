/**
 * Leaderboard Service
 * Handles persistence and retrieval of solo mode high scores
 */

import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    Timestamp,
    doc,
    deleteDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from './firebase';
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

// ============================================================================
// SERVER-VALIDATED SCORE SUBMISSION
// ============================================================================

/**
 * Answer history for Phase 1 (MCQ)
 */
export interface Phase1Answer {
    answerIndex: number;
    isCorrect: boolean;
}

/**
 * Answer history for Phase 2 (Sucre Sale)
 */
export interface Phase2Answer {
    answer: 'A' | 'B' | 'Both';
    isCorrect: boolean;
}

/**
 * Answer history for Phase 4 (Speed round)
 */
export interface Phase4Answer {
    answerIndex: number; // -1 for timeout
    isCorrect: boolean;
    timeMs: number;
}

/**
 * Input for server-validated score submission
 */
export interface ValidatedScoreInput {
    playerName: string;
    playerAvatar: Avatar;
    phase1Answers: Phase1Answer[];
    phase2Answers: Phase2Answer[];
    phase4Answers: Phase4Answer[];
    submittedScore: number;
    submittedPhase1Score: number;
    submittedPhase2Score: number;
    submittedPhase4Score: number;
    totalTimeMs: number;
}

/**
 * Response from server-validated score submission
 */
export interface ValidatedScoreResponse {
    success: boolean;
    validatedScore: number;
    isNewBest: boolean;
    previousScore: number | null;
}

// Callable function for server-validated score submission
const validateSoloScoreFunction = httpsCallable<ValidatedScoreInput, ValidatedScoreResponse>(
    functions,
    'validateSoloScore'
);

/**
 * Submit a score with server-side validation
 * The server recalculates the score from answer history to prevent cheating.
 * Requires authentication.
 */
export async function submitValidatedScore(input: ValidatedScoreInput): Promise<ValidatedScoreResponse> {
    try {
        const result = await validateSoloScoreFunction(input);
        console.log('[Leaderboard] Validated score submitted:', result.data);
        return result.data;
    } catch (error) {
        console.error('[Leaderboard] Failed to submit validated score:', error);
        throw error;
    }
}

// ============================================================================
// LEGACY DIRECT SUBMISSION (DEPRECATED - Use submitValidatedScore instead)
// ============================================================================

/**
 * @deprecated Use submitValidatedScore for secure score submission
 * This function writes directly to Firestore without server validation.
 * Kept for backwards compatibility but should not be used for new code.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function submitScore(_entry: Omit<LeaderboardEntry, 'id' | 'createdAt'>): Promise<string> {
    // This function is deprecated - validated scores go through Cloud Function
    console.warn('[Leaderboard] submitScore is deprecated. Use submitValidatedScore instead.');
    throw new Error('Direct score submission is disabled. Use submitValidatedScore for server-validated submission.');
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
