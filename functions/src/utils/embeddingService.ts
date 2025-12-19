import { ai } from '../config/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { db } from '../config/firebase';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { normalizeText } from './textNormalization';

/**
 * Embedding model configuration
 * text-embedding-004 produces 768-dimensional vectors
 * Exported so it can be stored with questions for future compatibility checks
 */
export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Embedder reference for Genkit
 */
const embedder = googleAI.embedder(EMBEDDING_MODEL);

/**
 * Similarity threshold (0.85 = very similar, likely duplicate)
 * - 0.95+ : Nearly identical questions
 * - 0.85-0.95 : Same topic, different wording → REJECT
 * - 0.70-0.85 : Similar theme but distinct questions
 * - <0.70 : Different questions
 */
export const SIMILARITY_THRESHOLD = 0.85;

/**
 * Generate embedding for a single text
 * Text is normalized before embedding for consistent similarity comparison
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const normalized = normalizeText(text);
    if (!normalized) return [];

    const result = await ai.embed({
        embedder,
        content: normalized,
    });
    // ai.embed() returns an array of embeddings, we want the first one
    return result[0]?.embedding || [];
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results = await Promise.all(
        texts.map(text => generateEmbedding(text))
    );
    return results;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    return magA && magB ? dotProduct / (magA * magB) : 0;
}

/**
 * Semantic duplicate detection result
 */
export interface SemanticDuplicate {
    index: number;      // Index in the input array
    similarTo: string;  // Text of the similar existing question
    score: number;      // Similarity score (0-1)
}

/**
 * Result type that includes both duplicates and generated embeddings for reuse.
 * This allows callers to avoid regenerating embeddings multiple times.
 */
export interface SemanticDuplicateResult {
    duplicates: SemanticDuplicate[];
    embeddings: number[][];  // Generated embeddings for reuse in findInternalDuplicates and storeQuestionsWithEmbeddings
}

/**
 * Pagination batch size for Firestore queries
 * Prevents loading entire collection into memory
 */
const PAGINATION_BATCH_SIZE = 100;

/**
 * Helper function to check for duplicates against a batch of documents with embeddings
 */
function checkDuplicatesAgainstBatch(
    questions: Array<{ text: string }>,
    newEmbeddings: number[][],
    docsWithEmbeddings: FirebaseFirestore.QueryDocumentSnapshot[],
    duplicates: SemanticDuplicate[],
    foundDuplicateIndices: Set<number>
): void {
    for (let i = 0; i < questions.length; i++) {
        // Skip if we already found a duplicate for this question
        if (foundDuplicateIndices.has(i)) continue;

        const newEmbedding = newEmbeddings[i];
        if (!newEmbedding || newEmbedding.length === 0) {
            console.warn(`⚠️ Failed to generate embedding for question ${i}: "${questions[i].text.slice(0, 50)}..."`);
            continue;
        }

        for (const doc of docsWithEmbeddings) {
            const existingData = doc.data();
            const existingEmbedding = existingData.embedding as number[];

            const similarity = cosineSimilarity(newEmbedding, existingEmbedding);

            if (similarity >= SIMILARITY_THRESHOLD) {
                duplicates.push({
                    index: i,
                    similarTo: existingData.text as string,
                    score: similarity
                });
                foundDuplicateIndices.add(i);
                break; // One duplicate is enough to reject
            }
        }
    }
}

/**
 * Filter documents to only those with compatible embeddings
 */
function filterDocsWithCompatibleEmbeddings(
    docs: FirebaseFirestore.QueryDocumentSnapshot[]
): FirebaseFirestore.QueryDocumentSnapshot[] {
    return docs.filter(doc => {
        const data = doc.data();
        if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
            return false;
        }
        // Accept if same model or no model specified (legacy data)
        const docModel = data.embeddingModel as string | undefined;
        return !docModel || docModel === EMBEDDING_MODEL;
    });
}

/**
 * Find semantic duplicates AND return generated embeddings for reuse.
 * This is the primary function to use - it generates embeddings once and returns them
 * so callers can reuse them for findInternalDuplicates() and storeQuestionsWithEmbeddings().
 *
 * Uses pagination to handle large collections efficiently.
 * Queries BOTH 'questions' (complete data) and 'question_embeddings' (dedup-only data) collections.
 *
 * @param questions - Array of new questions to check
 * @param phase - Game phase (phase1, phase2, etc.) to filter existing questions
 * @returns Object containing duplicates array and generated embeddings for reuse
 */
export async function findSemanticDuplicatesWithEmbeddings(
    questions: Array<{ text: string }>,
    phase: string
): Promise<SemanticDuplicateResult> {
    const duplicates: SemanticDuplicate[] = [];
    const foundDuplicateIndices = new Set<number>();

    // 1. Generate embeddings for new questions first (we'll need them regardless)
    console.log(`📊 Generating embeddings for ${questions.length} new questions...`);
    const newEmbeddings = await generateEmbeddings(questions.map(q => q.text));

    let totalExistingChecked = 0;

    // 2. Check against 'questions' collection (complete question data with embeddings from index.ts)
    let lastDocQuestions: DocumentSnapshot | null = null;
    let hasMoreQuestions = true;

    while (hasMoreQuestions) {
        let query = db.collection('questions')
            .where('phase', '==', phase)
            .orderBy('createdAt', 'desc')
            .limit(PAGINATION_BATCH_SIZE);

        if (lastDocQuestions) {
            query = query.startAfter(lastDocQuestions);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            hasMoreQuestions = false;
            break;
        }

        const docsWithEmbeddings = filterDocsWithCompatibleEmbeddings(snapshot.docs);
        totalExistingChecked += docsWithEmbeddings.length;

        checkDuplicatesAgainstBatch(
            questions,
            newEmbeddings,
            docsWithEmbeddings,
            duplicates,
            foundDuplicateIndices
        );

        // If all questions have duplicates, stop early but still return embeddings
        if (foundDuplicateIndices.size >= questions.length) {
            console.log(`📊 All ${questions.length} questions have duplicates in 'questions' collection`);
            return { duplicates, embeddings: newEmbeddings };
        }

        lastDocQuestions = snapshot.docs[snapshot.docs.length - 1];
        hasMoreQuestions = snapshot.docs.length === PAGINATION_BATCH_SIZE;
    }

    // 3. Check against 'question_embeddings' collection (embedding-only data for deduplication)
    let lastDocEmbeddings: DocumentSnapshot | null = null;
    let hasMoreEmbeddings = true;

    while (hasMoreEmbeddings) {
        let query = db.collection('question_embeddings')
            .where('phase', '==', phase)
            .orderBy('createdAt', 'desc')
            .limit(PAGINATION_BATCH_SIZE);

        if (lastDocEmbeddings) {
            query = query.startAfter(lastDocEmbeddings);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            hasMoreEmbeddings = false;
            break;
        }

        const docsWithEmbeddings = filterDocsWithCompatibleEmbeddings(snapshot.docs);
        totalExistingChecked += docsWithEmbeddings.length;

        checkDuplicatesAgainstBatch(
            questions,
            newEmbeddings,
            docsWithEmbeddings,
            duplicates,
            foundDuplicateIndices
        );

        // If all questions have duplicates, stop early
        if (foundDuplicateIndices.size >= questions.length) {
            console.log(`📊 All ${questions.length} questions have duplicates, stopping early`);
            break;
        }

        lastDocEmbeddings = snapshot.docs[snapshot.docs.length - 1];
        hasMoreEmbeddings = snapshot.docs.length === PAGINATION_BATCH_SIZE;
    }

    if (totalExistingChecked === 0) {
        console.log(`📊 No existing questions with embeddings for ${phase}, skipping duplicate check`);
    } else {
        console.log(`📊 Checked ${questions.length} questions against ${totalExistingChecked} existing embeddings (both collections)`);
    }

    return { duplicates, embeddings: newEmbeddings };
}

/**
 * Find semantic duplicates by comparing new questions against existing ones in Firestore.
 * This is a convenience wrapper around findSemanticDuplicatesWithEmbeddings() for backward compatibility.
 * If you need to reuse embeddings, use findSemanticDuplicatesWithEmbeddings() directly.
 *
 * @param questions - Array of new questions to check
 * @param phase - Game phase (phase1, phase2, etc.) to filter existing questions
 * @returns Array of duplicates with their similarity scores
 */
export async function findSemanticDuplicates(
    questions: Array<{ text: string }>,
    phase: string
): Promise<SemanticDuplicate[]> {
    const result = await findSemanticDuplicatesWithEmbeddings(questions, phase);
    return result.duplicates;
}

/**
 * Check if questions contain duplicates among themselves (within the batch)
 * Useful for ensuring the same generation doesn't produce similar questions
 */
export function findInternalDuplicates(
    embeddings: number[][],
    questions: Array<{ text: string }>
): SemanticDuplicate[] {
    const duplicates: SemanticDuplicate[] = [];

    for (let i = 0; i < embeddings.length; i++) {
        for (let j = i + 1; j < embeddings.length; j++) {
            const similarity = cosineSimilarity(embeddings[i], embeddings[j]);

            if (similarity >= SIMILARITY_THRESHOLD) {
                // Mark the second one as duplicate of the first
                duplicates.push({
                    index: j,
                    similarTo: questions[i].text,
                    score: similarity
                });
            }
        }
    }

    return duplicates;
}

/**
 * Store generated questions with their embeddings in Firestore for future deduplication
 *
 * @param questions - Array of questions with their text
 * @param embeddings - Pre-computed embeddings for each question
 * @param phase - Game phase (phase1, phase2, etc.)
 * @param roomCode - Optional room code for tracking origin
 */
export async function storeQuestionsWithEmbeddings(
    questions: Array<{ text: string }>,
    embeddings: number[][],
    phase: string,
    roomCode?: string
): Promise<void> {
    if (questions.length !== embeddings.length) {
        console.error(`❌ Mismatch: ${questions.length} questions vs ${embeddings.length} embeddings`);
        return;
    }

    if (questions.length === 0) {
        console.log(`📦 No questions to store for ${phase}`);
        return;
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    for (let i = 0; i < questions.length; i++) {
        // Store in separate collection to avoid polluting 'questions' with incomplete data
        // The 'questions' collection stores complete question data (from index.ts)
        // The 'question_embeddings' collection stores embedding-only data for deduplication
        const docRef = db.collection('question_embeddings').doc();
        batch.set(docRef, {
            text: questions[i].text,
            embedding: embeddings[i],
            embeddingModel: EMBEDDING_MODEL, // Track model for future compatibility
            embeddingDimensions: EMBEDDING_DIMENSIONS,
            phase,
            roomCode: roomCode || null,
            createdAt: now,
        });
    }

    try {
        await batch.commit();
        console.log(`📦 Stored ${questions.length} embeddings in question_embeddings for ${phase}`);
    } catch (err) {
        console.error(`❌ Failed to store embeddings:`, err);
    }
}
