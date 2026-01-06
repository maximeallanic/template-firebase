/**
 * English Topic Generation Prompts
 * Prompts for generating game themes/topics
 */

export const GENERATE_TOPIC_PROMPT = `SPICY VS SWEET - Generate ONE quiz theme
Difficulty: {DIFFICULTY}

ADAPT THE THEME TO THE DIFFICULTY:
• EASY: Mainstream themes, popular pop culture, topics everyone knows
  Ex: "Disney movies", "British desserts", "Summer hit songs"
• NORMAL: Quirky but accessible themes, light humor
  Ex: "Celebrity fails", "Weird animals", "Failed inventions"
• HARD: Niche themes, obscure references
  Ex: "Video game scandals", "Urban myths", "Absurd world records"
• WTF: Absurd, wild, provocative themes (but not offensive)
  Ex: "Animals smarter than politicians", "Stupid deaths in history"

FORBIDDEN: "General knowledge", "General quiz", themes that are too vague

Reply with ONLY the theme (max 6 words, no quotes).`;

export const GENERATE_TOPIC_PHASE2_PROMPT = `SPICY VS SWEET Phase 2 - Generate ONE English thematic domain

The generator will create a WORDPLAY (homophone/pun) in this domain.
Choose a domain RICH in English vocabulary that allows for homophones and puns.

REPLY with ONLY the domain (2-4 words, no quotes).`;

// ============================================================================
// SUBJECT + ANGLE GENERATION (for deduplication system)
// ============================================================================

/**
 * Prompt for generating a subject + angle combination.
 * This is used to ensure unique questions by tracking used subject+angle pairs.
 *
 * {phase} - The game phase (phase1, phase2, etc.)
 * {category} - Optional category filter (science, history, etc.)
 */
export const SUBJECT_ANGLE_PROMPT = `You are a topic generator for a "QI-style" general knowledge quiz game.

Generate ONE unique subject and ONE unique angle for a question.

SUBJECT TYPES AND THEIR ANGLES:

🧑 PERSON (type: "person")
Angles: biography, works, anecdotes, quotes, key_dates
Examples:
- { subject: "Albert Einstein", angle: "anecdotes", type: "person" }
- { subject: "Marie Curie", angle: "key_dates", type: "person" }
- { subject: "Winston Churchill", angle: "quotes", type: "person" }

📍 PLACE (type: "place")
Angles: geography, history, culture, landmarks, fun_facts
Examples:
- { subject: "The Eiffel Tower", angle: "fun_facts", type: "place" }
- { subject: "Japan", angle: "culture", type: "place" }
- { subject: "New York", angle: "landmarks", type: "place" }

📅 EVENT (type: "event")
Angles: causes, progression, consequences, protagonists, dates
Examples:
- { subject: "The French Revolution", angle: "protagonists", type: "event" }
- { subject: "The Moon Landing", angle: "consequences", type: "event" }
- { subject: "The 2024 Paris Olympics", angle: "dates", type: "event" }

💡 CONCEPT (type: "concept")
Angles: definition, origin, applications, examples, controversies
Examples:
- { subject: "Artificial intelligence", angle: "controversies", type: "concept" }
- { subject: "Climate change", angle: "applications", type: "concept" }
- { subject: "Blockchain", angle: "definition", type: "concept" }

🔧 OBJECT (type: "object")
Angles: invention, how_it_works, history, variants, records
Examples:
- { subject: "The telephone", angle: "invention", type: "object" }
- { subject: "Pizza", angle: "variants", type: "object" }
- { subject: "The electric guitar", angle: "records", type: "object" }

CRITICAL CONSTRAINTS:
✅ Subject must be easily verifiable on Google
✅ Prefer subjects with precise, dated facts
✅ Mix pop culture, history, science, current events
✅ Be creative and surprising in combinations
❌ Avoid topics that are too obscure or controversial
❌ Avoid overly generic topics ("France", "History", etc.)

POSSIBLE CATEGORIES:
- science, history, geography, pop_culture, sport, music, cinema, food, nature, technology

Reply ONLY with valid JSON, nothing else:
{
  "subject": "The chosen subject",
  "angle": "the chosen angle",
  "category": "the category",
  "type": "person|place|event|concept|object"
}`;

/**
 * Builds the subject+angle prompt with optional category filter.
 *
 * @param category - Optional category to focus on
 * @returns The complete prompt string
 */
export function buildSubjectAnglePrompt(category?: string): string {
  let prompt = SUBJECT_ANGLE_PROMPT;

  if (category) {
    prompt += `\n\nREQUESTED CATEGORY: ${category}
Focus on this category for the generated subject.`;
  }

  return prompt;
}
