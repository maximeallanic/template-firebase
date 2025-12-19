import { ai } from '../config/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { db } from '../config/firebase';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

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
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const result = await ai.embed({
        embedder,
        content: text,
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
 * Pagination batch size for Firestore queries
 * Prevents loading entire collection into memory
 */
const PAGINATION_BATCH_SIZE = 100;

/**
 * Find semantic duplicates by comparing new questions against existing ones in Firestore
 * Uses pagination to handle large collections efficiently
 *
 * @param questions - Array of new questions to check
 * @param phase - Game phase (phase1, phase2, etc.) to filter existing questions
 * @returns Array of duplicates with their similarity scores
 */
export async function findSemanticDuplicates(
    questions: Array<{ text: string }>,
    phase: string
): Promise<SemanticDuplicate[]> {
    const duplicates: SemanticDuplicate[] = [];
    const foundDuplicateIndices = new Set<number>();

    // 1. Generate embeddings for new questions first (we'll need them regardless)
    console.log(`📊 Generating embeddings for ${questions.length} new questions...`);
    const newEmbeddings = await generateEmbeddings(questions.map(q => q.text));

    // 2. Paginated fetch of existing questions with embeddings
    let lastDoc: DocumentSnapshot | null = null;
    let totalExistingChecked = 0;
    let hasMore = true;

    while (hasMore) {
        // Build paginated query
        let query = db.collection('questions')
            .where('phase', '==', phase)
            .orderBy('createdAt', 'desc')
            .limit(PAGINATION_BATCH_SIZE);

        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            hasMore = false;
            break;
        }

        // Filter to only questions that have compatible embeddings
        // Only compare embeddings from the same model (or legacy ones without model tag)
        const docsWithEmbeddings = snapshot.docs.filter(doc => {
            const data = doc.data();
            if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
                return false;
            }
            // Accept if same model or no model specified (legacy data)
            const docModel = data.embeddingModel as string | undefined;
            return !docModel || docModel === EMBEDDING_MODEL;
        });

        totalExistingChecked += docsWithEmbeddings.length;

        // Compare each new question against this batch of existing ones
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

        // If all questions have duplicates, stop early
        if (foundDuplicateIndices.size >= questions.length) {
            console.log(`📊 All ${questions.length} questions have duplicates, stopping early`);
            break;
        }

        // Prepare for next page
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        hasMore = snapshot.docs.length === PAGINATION_BATCH_SIZE;
    }

    if (totalExistingChecked === 0) {
        console.log(`📊 No existing questions with embeddings for ${phase}, skipping duplicate check`);
    } else {
        console.log(`📊 Checked ${questions.length} questions against ${totalExistingChecked} existing embeddings (paginated)`);
    }

    return duplicates;
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
        const docRef = db.collection('questions').doc();
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
        console.log(`📦 Stored ${questions.length} questions with embeddings for ${phase}`);
    } catch (err) {
        console.error(`❌ Failed to store questions:`, err);
    }
}
