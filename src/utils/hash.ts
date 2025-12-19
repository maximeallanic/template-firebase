import { normalizeText } from './textNormalization';

/**
 * Generates a consistent hash from text using FNV-1a 64-bit algorithm.
 * Used to create unique identifiers for questions without modifying static data.
 *
 * Improvements over the original 32-bit hash:
 * - Uses FNV-1a 64-bit for much lower collision probability
 * - Normalizes text before hashing (lowercase, trim, collapse whitespace)
 * - This means "CAPITALE?" and "capitale?" will produce the same hash
 *
 * Note: Changing the hash algorithm means existing user history hashes won't match
 * new hashes for the same questions. This is acceptable as questions naturally
 * cycle and the mismatch only affects the "have I seen this?" check temporarily.
 */
export function generateQuestionHash(text: string): string {
    const normalized = normalizeText(text);
    if (!normalized) return '0';

    // FNV-1a 64-bit constants
    // Using BigInt for 64-bit precision
    const FNV_OFFSET_BASIS = BigInt('14695981039346656037');
    const FNV_PRIME = BigInt('1099511628211');
    const MASK_64 = BigInt('0xFFFFFFFFFFFFFFFF');

    let hash = FNV_OFFSET_BASIS;

    for (let i = 0; i < normalized.length; i++) {
        // XOR with byte
        hash ^= BigInt(normalized.charCodeAt(i));
        // Multiply by prime and mask to 64 bits
        hash = (hash * FNV_PRIME) & MASK_64;
    }

    return hash.toString(16);
}
