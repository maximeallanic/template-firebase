import { collection, query, where, getDocs, orderBy, limit, Timestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from './firebase';
import type { Question } from '../data/questions';
import { generateQuestionHash } from '../utils/hash';

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
    question?: string; // For phase3, phase4, phase5
    answer?: string;   // For phase3, phase4, phase5
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
 * Fetches individual questions from Firestore and groups them into a set.
 * Returns questions that haven't been seen by any player in the room.
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
        const questionsRef = collection(db, 'questions');
        const q = query(
            questionsRef,
            where('phase', '==', phase),
            orderBy('usageCount', 'asc'), // Prefer less-used questions
            orderBy('createdAt', 'desc'),
            limit(count * 3) // Fetch more to filter out seen ones
        );

        const snapshot = await getDocs(q);
        console.log('📦 Firestore returned:', snapshot.size, 'documents for phase', phase);
        const questions: StoredQuestion[] = [];

        let skippedCount = 0;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const questionText = data.text || data.question || '';
            const qId = generateQuestionHash(questionText);

            // Skip if already seen
            if (seenQuestionIds.has(qId)) {
                skippedCount++;
                return;
            }

            questions.push({
                id: docSnap.id,
                phase: data.phase,
                topic: data.topic,
                difficulty: data.difficulty,
                text: data.text,
                options: data.options,
                correctIndex: data.correctIndex,
                anecdote: data.anecdote,
                question: data.question,
                answer: data.answer,
                createdAt: data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : new Date(data.createdAt),
                usageCount: data.usageCount || 0,
            });
        });

        // If not enough unseen questions, return empty to trigger AI generation
        // Phase 1 needs 10 questions minimum
        console.log('✅ getAvailableQuestions result:', {
            fromFirestore: snapshot.size,
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
        phase2: 15,
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
    } else {
        // For other phases, return raw data
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
