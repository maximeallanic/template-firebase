/**
 * JSON parsing utilities for game question generation
 * Helper utilities for extracting and processing structured data from LLM responses
 */

import type { Phase4Question } from './types';

/**
 * Remove trailing commas from JSON string (common LLM mistake)
 * Handles: {"key": "value",} and ["item",]
 */
function removeTrailingCommas(jsonString: string): string {
    // Remove trailing commas before } or ] (with optional whitespace/newlines)
    return jsonString.replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Helper to find a balanced JSON structure (handles nested objects/arrays)
 * @param text - The text to search for JSON
 * @param preferArray - If true, searches for '[' before '{' to prioritize array extraction
 */
export function findBalancedJson(text: string, preferArray: boolean = false): string | null {
    const startChars = preferArray ? ['[', '{'] : ['{', '['];
    const endChars = ['}', ']'];

    for (const startChar of startChars) {
        const startIdx = text.indexOf(startChar);
        if (startIdx === -1) continue;

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let i = startIdx; i < text.length; i++) {
            const char = text[i];

            if (escaped) { escaped = false; continue; }
            if (char === '\\') { escaped = true; continue; }
            if (char === '"') { inString = !inString; continue; }
            if (inString) continue;

            if (startChars.includes(char)) depth++;
            if (endChars.includes(char)) depth--;

            if (depth === 0) {
                return text.slice(startIdx, i + 1);
            }
        }
    }
    return null;
}

/**
 * Parse JSON from text, handling markdown artifacts and nested structures
 */
export function parseJsonFromText(text: string): unknown {
    // Clean markdown artifacts
    let cleanText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Remove trailing commas (common LLM mistake)
    cleanText = removeTrailingCommas(cleanText);

    // Try direct parse first (fastest path)
    try {
        return JSON.parse(cleanText);
    } catch {
        // Continue to balanced extraction
    }

    // Find balanced JSON structure
    const jsonMatch = findBalancedJson(cleanText);
    if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
    }

    // Also clean trailing commas from extracted JSON
    return JSON.parse(removeTrailingCommas(jsonMatch));
}

/**
 * Parse JSON array from text, prioritizing array extraction over objects.
 * Handles cases where AI returns preamble text before JSON.
 * If a single object is found, wraps it in an array.
 */
export function parseJsonArrayFromText<T>(text: string): T[] {
    // Clean markdown artifacts
    let cleanText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // Remove trailing commas (common LLM mistake)
    cleanText = removeTrailingCommas(cleanText);

    // Try direct parse first (fastest path)
    try {
        const result = JSON.parse(cleanText);
        return Array.isArray(result) ? result : [result];
    } catch {
        // Continue to balanced extraction
    }

    // Find balanced JSON structure, prioritizing arrays
    const jsonMatch = findBalancedJson(cleanText, true);
    if (!jsonMatch) {
        throw new Error('No valid JSON array found in response');
    }

    // Also clean trailing commas from extracted JSON
    const result = JSON.parse(removeTrailingCommas(jsonMatch));
    return Array.isArray(result) ? result : [result];
}

/**
 * Shuffle MCQ options to prevent AI positional bias
 * Returns a new question with shuffled options and updated correctIndex
 */
export function shuffleMCQOptions(question: Phase4Question): Phase4Question {
    const correctAnswer = question.options[question.correctIndex];

    // Fisher-Yates shuffle
    const shuffled = [...question.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Find new index of correct answer
    const newCorrectIndex = shuffled.indexOf(correctAnswer);

    return {
        ...question,
        options: shuffled,
        correctIndex: newCorrectIndex
    };
}
