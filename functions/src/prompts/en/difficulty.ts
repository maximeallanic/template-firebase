/**
 * English Difficulty Level Instructions
 * Provides specific guidance for each difficulty level
 */

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'wtf';

/**
 * Get detailed instructions for a specific difficulty level
 * @param difficulty The difficulty level
 * @returns Detailed instructions to include in prompts
 */
export function getDifficultyInstructions(difficulty: DifficultyLevel): string {
    const instructions = {
        easy: `EASY MODE - Accessible questions for everyone
🎯 EASY DIFFICULTY RULES:
• EVERYDAY topics: common food, well-known celebrities, popular sports
• SIMPLE vocabulary: avoid technical or specialized terms
• POPULAR culture: mainstream movies/shows, chart-topping music
• Answers should be OBVIOUS once you see them
• Examples: "What color is a ripe banana?", "Which superhero wears a red cape and has an 'S' on his chest?"

⚠️ FORBIDDEN IN EASY MODE:
❌ Obscure culinary terms (brunoise, chiffonade, etc.)
❌ Niche or underground cultural references
❌ Precise dates or complex numbers
❌ Advanced scientific knowledge`,

        normal: `NORMAL MODE - Standard general knowledge
🎯 NORMAL DIFFICULTY RULES:
• Mix of POPULAR CULTURE and lesser-known facts
• VARIED vocabulary but not specialized
• Questions where you can HESITATE between 2 options
• Interesting anecdotes but not obscure
• Examples: "Which country consumes the most cheese per capita?", "Which spice comes from a flower's stigma?"

✅ GOOD BALANCE:
• 60% accessible general knowledge
• 30% lesser-known but findable facts
• 10% surprising anecdotes`,

        hard: `HARD MODE - In-depth knowledge
🎯 HARD DIFFICULTY RULES:
• TECHNICAL culinary and scientific terms
• PRECISE historical references
• OBSCURE but verifiable facts
• Questions where even the options are complex
• Examples: "What technique involves glazing by reducing with butter?", "Which chemist invented saccharin?"

✅ ALLOWED IN HARD MODE:
• Professional culinary vocabulary
• Precise dates and numbers
• Niche cultural references
• Complex scientific processes`,

        wtf: `WTF MODE - Total absurdity
🎯 WTF DIFFICULTY RULES:
• IMPOSSIBLE to guess questions
• ABSURD but true anecdotes
• TOTALLY unexpected connections
• Facts so bizarre you can't believe them
• Examples: "How many gallons of slime does a snail produce per year?", "Which animal can survive in the vacuum of space?"

✅ WTF MODE = TOTAL CHAOS:
• All 4 options seem fake
• The correct answer is counter-intuitive
• Anecdote that makes you say "That's insane!"
• "Ultimate useless knowledge" level`
    };

    return instructions[difficulty] || instructions.normal;
}

/**
 * Get a short difficulty label to replace {DIFFICULTY} in prompts
 * @param difficulty The difficulty level
 * @returns Short label (e.g., "EASY", "NORMAL", "HARD", "WTF")
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
    const labels = {
        easy: 'EASY',
        normal: 'NORMAL',
        hard: 'HARD',
        wtf: 'WTF'
    };
    return labels[difficulty] || 'NORMAL';
}

/**
 * Get full difficulty context to inject into prompts
 * Combines label + detailed instructions
 * @param difficulty The difficulty level
 * @returns Full difficulty context string
 */
export function getFullDifficultyContext(difficulty: DifficultyLevel): string {
    const label = getDifficultyLabel(difficulty);
    const instructions = getDifficultyInstructions(difficulty);
    return `${label}\n\n${instructions}`;
}
