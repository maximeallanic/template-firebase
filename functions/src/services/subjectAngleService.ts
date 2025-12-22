/**
 * Subject + Angle Service
 *
 * Manages the tracking of used subject+angle combinations to prevent duplicate questions.
 * Uses Firestore collection `usedSubjectAngles` with SHA-256 hash as document ID.
 */

import * as crypto from 'crypto';
import { db } from '../config/firebase';
import { normalizeText } from '../utils/textNormalization';
import { FieldValue } from 'firebase-admin/firestore';

// ============================================================================
// TYPES
// ============================================================================

export type SubjectType = 'person' | 'place' | 'event' | 'concept' | 'object';

export interface SubjectAngle {
  subject: string;           // "Albert Einstein", "La Tour Eiffel"
  angle: string;             // "biographie", "anecdotes", "dates_clés"
  category: string;          // "science", "history", "geography"
  type: SubjectType;         // Type of subject for angle validation
}

export interface UsedSubjectAngle extends SubjectAngle {
  hash: string;              // SHA-256 of normalized "subject|angle"
  questionId: string;        // Reference to the generated question
  createdAt: FirebaseFirestore.Timestamp;
}

// ============================================================================
// ANGLES BY SUBJECT TYPE
// ============================================================================

export const ANGLES_BY_TYPE: Record<SubjectType, string[]> = {
  person: ['biographie', 'oeuvres', 'anecdotes', 'citations', 'dates_clés'],
  place: ['géographie', 'histoire', 'culture', 'monuments', 'faits_insolites'],
  event: ['causes', 'déroulement', 'conséquences', 'protagonistes', 'dates'],
  concept: ['définition', 'origine', 'applications', 'exemples', 'controverses'],
  object: ['invention', 'fonctionnement', 'histoire', 'variantes', 'records']
};

// Firestore collection name
const COLLECTION_NAME = 'usedSubjectAngles';

// ============================================================================
// HASH FUNCTIONS
// ============================================================================

/**
 * Creates a deterministic hash of a subject+angle combination.
 * Uses SHA-256 for virtually zero collision probability.
 *
 * @param subject - The subject (e.g., "Albert Einstein")
 * @param angle - The angle (e.g., "biographie")
 * @returns 64-character hex hash
 */
export function hashCombo(subject: string, angle: string): string {
  const normalized = `${normalizeText(subject)}|${normalizeText(angle)}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Validates that an angle is valid for the given subject type.
 *
 * @param type - The subject type
 * @param angle - The angle to validate
 * @returns true if angle is valid for type
 */
export function isValidAngle(type: SubjectType, angle: string): boolean {
  const normalizedAngle = normalizeText(angle);
  return ANGLES_BY_TYPE[type].some(a => normalizeText(a) === normalizedAngle);
}

// ============================================================================
// FIRESTORE OPERATIONS
// ============================================================================

/**
 * Checks if a subject+angle combination has already been used.
 * O(1) lookup using hash as document ID.
 *
 * @param hash - The SHA-256 hash of the combo
 * @returns true if combo exists
 */
export async function checkComboExists(hash: string): Promise<boolean> {
  try {
    const doc = await db.collection(COLLECTION_NAME).doc(hash).get();
    return doc.exists;
  } catch (error) {
    console.error('❌ Error checking combo existence:', error);
    // Fail open - if we can't check, assume it doesn't exist
    return false;
  }
}

/**
 * Marks a subject+angle combination as used.
 * Called after a question is successfully generated and stored.
 *
 * @param hash - The SHA-256 hash of the combo
 * @param subjectAngle - The subject+angle data
 * @param questionId - The ID of the generated question
 */
export async function markComboUsed(
  hash: string,
  subjectAngle: SubjectAngle,
  questionId: string
): Promise<void> {
  try {
    const data: Omit<UsedSubjectAngle, 'createdAt'> & { createdAt: FirebaseFirestore.FieldValue } = {
      hash,
      subject: subjectAngle.subject,
      angle: subjectAngle.angle,
      category: subjectAngle.category,
      type: subjectAngle.type,
      questionId,
      createdAt: FieldValue.serverTimestamp()
    };

    await db.collection(COLLECTION_NAME).doc(hash).set(data);
    console.log(`✅ Marked combo as used: ${subjectAngle.subject}|${subjectAngle.angle}`);
  } catch (error) {
    console.error('❌ Error marking combo as used:', error);
    throw error;
  }
}

/**
 * Gets all used combos for a specific category (for analytics/debugging).
 *
 * @param category - Optional category filter
 * @param limit - Max number of results
 * @returns Array of used subject+angle combinations
 */
export async function getUsedCombos(
  category?: string,
  limit: number = 100
): Promise<UsedSubjectAngle[]> {
  try {
    let query = db.collection(COLLECTION_NAME)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (category) {
      query = db.collection(COLLECTION_NAME)
        .where('category', '==', category)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as UsedSubjectAngle);
  } catch (error) {
    console.error('❌ Error getting used combos:', error);
    return [];
  }
}

/**
 * Gets count of used combos (for analytics).
 *
 * @param category - Optional category filter
 * @returns Number of used combos
 */
export async function getUsedCombosCount(category?: string): Promise<number> {
  try {
    let query: FirebaseFirestore.Query = db.collection(COLLECTION_NAME);

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error('❌ Error counting used combos:', error);
    return 0;
  }
}

/**
 * Deletes a used combo (for testing/cleanup).
 *
 * @param hash - The hash of the combo to delete
 */
export async function deleteCombo(hash: string): Promise<void> {
  try {
    await db.collection(COLLECTION_NAME).doc(hash).delete();
    console.log(`🗑️ Deleted combo: ${hash}`);
  } catch (error) {
    console.error('❌ Error deleting combo:', error);
    throw error;
  }
}
