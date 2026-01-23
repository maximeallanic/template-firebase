import { collection, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from './firebase';
import type { Question } from '../types/gameTypes';
import { generateQuestionHash } from '../utils/hash';
import { createQuestionCache, createQuestionByIdCache, generateQuestionCacheKey } from '../utils/questionCache';

/**
 * Service for fetching AI-generated questions from Firestore.
 * Questions are stored individually by Cloud Functions after generation.
 *
 * Collection structure:
 * questions/{docId}
 *   - phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5'
 *   - topic: string (optional)
 *   - difficulty: string (optional)
 *   - text: string (question text)
 *   - options: string[] (for MCQ phases)
 *   - correctIndex: number (for MCQ phases)
 *   - anecdote: string (optional fun fact)
 *   - createdAt: Timestamp
 *   - usageCount: number (times fetched)
 *   - generatedBy: string (user ID)
 */

export interface StoredQuestion {
    id: string;
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
    topic?: string;
    difficulty?: string;
    text?: string;
    options?: string[];
    correctIndex?: number;
    anecdote?: string;
    justification?: string;  // For phase2 item explanations
    acceptedAnswers?: ('A' | 'B' | 'Both')[];  // For phase2 alternative answers
    question?: string; // For phase3, phase4, phase5
    answer?: string;   // For phase3, phase4, phase5
    optionA?: string;  // For phase2 (e.g., "Sucré")
    optionB?: string;  // For phase2 (e.g., "Salé")
    optionADescription?: string;  // For phase2 homonyms
    optionBDescription?: string;  // For phase2 homonyms
    humorousDescription?: string; // For phase2 humorous description
    createdAt: Date;
    usageCount: number;
}

// Keep legacy interface for compatibility
export interface StoredQuestionSet {
    id: string;
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
    topic?: string;
    difficulty?: string;
    questions: Question[] | unknown[];
    createdAt: Date;
    usageCount: number;
}

/**
 * LRU cache for question sets fetched from Firestore.
 * Reduces Firestore reads by caching frequently accessed questions.
 * - Max 100 question sets
 * - 1 hour TTL
 */
const questionCache = createQuestionCache<StoredQuestion>();

/**
 * LRU cache for individual questions by document ID.
 * - Max 200 questions
 * - 1 hour TTL
 */
const questionByIdCache = createQuestionByIdCache<StoredQuestion>();

/**
 * Clears all question caches. Useful when new questions are generated.
 */
export function clearQuestionCaches(): void {
    questionCache.clear();
    questionByIdCache.clear();
    console.log('🗑️ Question caches cleared');
}

/**
 * Gets cache statistics for debugging/monitoring.
 */
export function getQuestionCacheStats(): { questionCache: { size: number; maxSize: number; ttlMs: number }; questionByIdCache: { size: number; maxSize: number; ttlMs: number } } {
    return {
        questionCache: questionCache.getStats(),
        questionByIdCache: questionByIdCache.getStats(),
    };
}

/**
 * Fetches questions from Firestore (raw, without filtering).
 * This is used internally to populate the cache.
 */
async function fetchQuestionsFromFirestore(
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5',
    fetchLimit: number
): Promise<StoredQuestion[]> {
    const questionsRef = collection(db, 'questions');
    const q = query(
        questionsRef,
        where('phase', '==', phase),
        orderBy('usageCount', 'asc'), // Prefer less-used questions
        orderBy('createdAt', 'desc'),
        limit(fetchLimit)
    );

    const snapshot = await getDocs(q);
    console.log('📦 Firestore returned:', snapshot.size, 'documents for phase', phase);

    const questions: StoredQuestion[] = [];

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const question: StoredQuestion = {
            id: docSnap.id,
            phase: data.phase,
            topic: data.topic,
            difficulty: data.difficulty,
            text: data.text,
            options: data.options,
            correctIndex: data.correctIndex,
            anecdote: data.anecdote,
            justification: data.justification,
            acceptedAnswers: data.acceptedAnswers,
            question: data.question,
            answer: data.answer,
            optionA: data.optionA,
            optionB: data.optionB,
            optionADescription: data.optionADescription,
            optionBDescription: data.optionBDescription,
            humorousDescription: data.humorousDescription,
            createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
            usageCount: data.usageCount || 0,
        };

        questions.push(question);

        // Cache individual questions by ID for future lookups
        questionByIdCache.set(docSnap.id, question);
    });

    return questions;
}

/**
 * Fetches individual questions from Firestore and groups them into a set.
 * Returns questions that haven't been seen by any player in the room.
 * Uses LRU cache to reduce Firestore reads.
 *
 * @param phase - The game phase to fetch questions for
 * @param seenQuestionIds - Set of question IDs already seen by players
 * @param count - Number of questions to return (default: 10 for phase1)
 */
export async function getAvailableQuestions(
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5',
    seenQuestionIds: Set<string> = new Set(),
    count = 10
): Promise<StoredQuestion[]> {
    console.log('🔍 getAvailableQuestions called:', { phase, seenCount: seenQuestionIds.size, requestedCount: count });

    try {
        const fetchLimit = count * 3; // Fetch more to filter out seen ones
        const cacheKey = generateQuestionCacheKey(phase, seenQuestionIds, fetchLimit);

        // Check cache first
        let allQuestions = questionCache.get(cacheKey);

        if (allQuestions) {
            console.log('✅ Cache hit for', phase, '- retrieved', allQuestions.length, 'questions');
        } else {
            console.log('⚠️ Cache miss for', phase, '- fetching from Firestore');
            allQuestions = await fetchQuestionsFromFirestore(phase, fetchLimit);

            // Store in cache for future requests
            if (allQuestions.length > 0) {
                questionCache.set(cacheKey, allQuestions);
            }
        }

        // Filter out seen questions
        const questions: StoredQuestion[] = [];
        let skippedCount = 0;

        for (const q of allQuestions) {
            const questionText = q.text || q.question || '';
            const qId = generateQuestionHash(questionText);

            if (seenQuestionIds.has(qId)) {
                skippedCount++;
                continue;
            }

            questions.push(q);
        }

        console.log('✅ getAvailableQuestions result:', {
            fromCache: allQuestions.length,
            skipped: skippedCount,
            available: questions.length,
            requested: count
        });

        // Return empty array if we don't have enough unseen questions
        // This will trigger AI generation in GameRoom.tsx
        if (questions.length < count) {
            console.log(`⚠️ Not enough unseen questions (${questions.length}/${count}), returning empty to trigger AI generation`);
            return [];
        }

        return questions.slice(0, count);
    } catch (error) {
        console.error('Error fetching questions from Firestore:', error);
        return [];
    }
}

/**
 * Fetches a set of questions ready for game use.
 * Converts individual StoredQuestion documents to the Question format expected by the game.
 */
export async function getRandomQuestionSet(
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5',
    seenQuestionIds: Set<string> = new Set()
): Promise<StoredQuestionSet | null> {
    // Determine count based on phase
    const countByPhase: Record<string, number> = {
        phase1: 10,
        phase2: 12, // Match MINIMUM_QUESTION_COUNTS.phase2
        phase3: 15, // 3 menus × 5 questions
        phase4: 15,
        phase5: 10,
    };
    const count = countByPhase[phase] || 10;

    const questions = await getAvailableQuestions(phase, seenQuestionIds, count);

    if (questions.length === 0) {
        return null;
    }

    // Increment usage count for all fetched questions
    try {
        const updatePromises = questions.map(q =>
            updateDoc(doc(db, 'questions', q.id), { usageCount: increment(1) })
        );
        await Promise.all(updatePromises);
    } catch (error) {
        console.warn('Failed to update question usage counts:', error);
    }

    // Convert to game-ready format based on phase
    let gameQuestions: Question[] | unknown[];

    if (phase === 'phase1') {
        gameQuestions = questions.map(q => ({
            text: q.text || '',
            options: q.options || [],
            correctIndex: q.correctIndex || 0,
            anecdote: q.anecdote,
        })) as Question[];
    } else if (phase === 'phase2') {
        // Phase2: Reconstruct SimplePhase2Set from individual items
        // All items share the same optionA/optionB/humorousDescription from the same generation
        const firstQ = questions[0];
        gameQuestions = {
            optionA: firstQ.optionA || 'A',
            optionB: firstQ.optionB || 'B',
            optionADescription: firstQ.optionADescription,
            optionBDescription: firstQ.optionBDescription,
            humorousDescription: firstQ.humorousDescription,
            items: questions.map(q => ({
                text: q.text || '',
                answer: q.answer || 'A',
                anecdote: q.anecdote,
                justification: q.justification,
                acceptedAnswers: q.acceptedAnswers,
            })),
        } as unknown as Question[];
    } else if (phase === 'phase4') {
        // Phase4: MCQ format with text, options, correctIndex
        gameQuestions = questions.map(q => ({
            text: q.question || q.text || '',
            options: q.options || [],
            correctIndex: q.correctIndex ?? 0,
            anecdote: q.anecdote,
        }));
    } else {
        // For other phases (phase3, phase5), return raw data
        gameQuestions = questions.map(q => ({
            question: q.question || q.text,
            answer: q.answer,
            ...q,
        }));
    }

    return {
        id: `set-${Date.now()}`, // Virtual set ID
        phase,
        topic: questions[0]?.topic,
        difficulty: questions[0]?.difficulty,
        questions: gameQuestions,
        createdAt: new Date(),
        usageCount: 0,
    };
}

/**
 * Legacy function for backward compatibility.
 * @deprecated Use getRandomQuestionSet instead. maxSets parameter is ignored.
 */
export async function getAvailableQuestionSets(
    phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5',
    seenQuestionIds: Set<string> = new Set()
): Promise<StoredQuestionSet[]> {
    const set = await getRandomQuestionSet(phase, seenQuestionIds);
    if (!set) return [];
    // For backward compat, return single set in array
    return [set];
}

/**
 * Counts total available questions for a phase.
 */
export async function countQuestions(phase: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5'): Promise<number> {
    try {
        const questionsRef = collection(db, 'questions');
        const q = query(
            questionsRef,
            where('phase', '==', phase)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error counting questions:', error);
        return 0;
    }
}

/**
 * @deprecated Use countQuestions instead
 */
export const countQuestionSets = countQuestions;
