/**
 * Text normalization utilities for consistent hashing and embedding comparison.
 * Used by both the hash service (user history) and embedding service (semantic dedup).
 */

/**
 * Normalizes text for consistent hashing and embedding comparison.
 * - Trims leading/trailing whitespace
 * - Converts to lowercase
 * - Normalizes Unicode (NFC form for consistent accented characters)
 * - Collapses multiple spaces to single space
 *
 * @param text - The input text to normalize
 * @returns Normalized text, or empty string if input is falsy
 */
export function normalizeText(text: string): string {
    if (!text) return '';

    return text
        .trim()
        .toLowerCase()
        .normalize('NFC') // Normalize Unicode (é vs e + ́)
        .replace(/\s+/g, ' '); // Collapse multiple whitespace
}
