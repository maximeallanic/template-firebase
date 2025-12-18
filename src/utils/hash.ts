/**
 * Generates a consistent hash from text.
 * Used to create unique identifiers for questions without modifying static data.
 */
export function generateQuestionHash(text: string): string {
    let hash = 0;
    if (!text || text.length === 0) return hash.toString();
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
