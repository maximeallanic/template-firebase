/**
 * Mock Answer Service
 * Pure functions for generating random answers for mock players
 */

export type Phase2Choice = 'A' | 'B' | 'Both';

/**
 * Generate a random answer for Phase 1 (Tenders - Speed MCQ)
 * Returns an index 0-3, avoiding already tried wrong options
 */
export function generatePhase1Answer(triedWrongOptions: number[] = []): number {
    const availableOptions = [0, 1, 2, 3].filter(
        idx => !triedWrongOptions.includes(idx)
    );

    if (availableOptions.length === 0) {
        // All options tried, return random (shouldn't happen in normal flow)
        return Math.floor(Math.random() * 4);
    }

    return availableOptions[Math.floor(Math.random() * availableOptions.length)];
}

/**
 * Generate a random answer for Phase 2 (Sucre Sale - Binary choice)
 * Returns 'A', 'B', or 'Both'
 */
export function generatePhase2Answer(): Phase2Choice {
    const choices: Phase2Choice[] = ['A', 'B', 'Both'];
    return choices[Math.floor(Math.random() * choices.length)];
}

/**
 * Generate a random answer for Phase 4 (La Note - Buzzer round)
 * Returns an index 0-3
 */
export function generatePhase4Answer(): number {
    return Math.floor(Math.random() * 4);
}

/**
 * Format answer for display in debug panel
 */
export function formatAnswerForDisplay(
    phase: 'phase1' | 'phase2' | 'phase4',
    answer: number | Phase2Choice
): string {
    switch (phase) {
        case 'phase1':
            return `P1: ${answer}`;
        case 'phase2':
            return `P2: ${answer}`;
        case 'phase4':
            return `P4: ${answer}`;
        default:
            return String(answer);
    }
}
