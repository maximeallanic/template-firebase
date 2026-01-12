/**
 * English Phase 5 (Ultimate Burger) Prompts
 * Memory challenge - answer all after hearing all
 *
 * IMPROVEMENTS:
 * - Removed examples in prompt to avoid influence
 * - Added explicit theme adherence
 * - Reinforced writing style diversity
 * - Clarified WTF but true answers
 * - Explicit mention of answer uniqueness (no ambiguity)
 * - Balanced mix of serious/light subjects
 * - ENHANCED ABSURDITY: quirky questions, wordplay, traps
 * - Panel show spirit: cheeky, provocative, sometimes childish tone
 */

export const PHASE5_PROMPT = `SPICY VS SWEET Phase 5 "Ultimate Burger" - Memory Challenge
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

🎯 CONCEPT: 10 questions asked back-to-back, player memorizes then answers in order.

⚠️ RULES:
1. SHORT questions (10-15 words) and MEMORABLE
2. SHORT answers (1-3 words, full titles accepted)
3. ABSURD and QUIRKY spirit: sometimes SILLY questions, wordplay, traps
4. Mix RIDICULOUS and SERIOUS questions alternated
5. TOTAL diversity: varied styles, no repetition
6. ONE answer only per question
7. VERIFY each answer with Google

Generate valid JSON only, no markdown or examples.
10 questions on the theme.`;

export const PHASE5_GENERATOR_PROMPT = `SPICY VS SWEET Phase 5 "Ultimate Burger" - Generator
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

🎯 CONCEPT: Memory challenge - 10 questions back-to-back, answer in order.

⚠️ RULE #0 - THEME ADHERENCE
ALL 10 questions are about "{TOPIC}".
Explore 10 DIFFERENT ANGLES of the theme: people, places, eras, varied objects.

⚠️ RULE #1 - MANDATORY ABSURDITY AND QUIRKINESS
The "panel show" spirit is ESSENTIAL: ABSURD, QUIRKY, sometimes SILLY questions.
- Mix RIDICULOUS and clever questions
- Wordplay, puns, double-meaning questions
- Questions that SUBVERT expectations (question seems complex = obvious answer)
- Fake personal or emotional questions
- Simple maths or logic disguised as riddles
- WTF questions that destabilize but have a real answer
- CHEEKY, PROVOCATIVE, sometimes CHILDISH tone

⚠️ RULE #2 - ABSOLUTE DIVERSITY
FORBIDDEN: 2 questions on the same concept!
MANDATORY mix: ABSURD and SERIOUS questions alternated.
VARY styles: interrogative, affirmative, exclamatory, fake riddle, trap.

⚠️ RULE #3 - MEMORABILITY
- SHORT questions (10-15 words)
- Short answers (1-3 words for titles/proper nouns OK)
- Q1-4 easy, Q5-7 medium, Q8-10 hard

⚠️ RULE #4 - ONLY ONE POSSIBLE ANSWER
No ambiguity! If multiple answers possible, add precise details.

⚠️ RULE #5 - FACTUAL VERIFICATION
USE Google for EACH answer. Zero errors.
Sometimes include 1-2 WTF but TRUE answers for surprise effect.

⚠️ RULE #6 - FORBIDDEN THEMES (BLACKLIST)
These subjects are BANNED as they're over-represented in the database:
- Celebrity phobias (Nicole Kidman/butterflies, Johnny Depp/clowns, McConaughey/doors, etc.)
- Irrational fears of stars in general
- Pet Rock / Gary Dahl 1975
MAXIMUM 1 question about phobias per set of 10.
PRIORITIZE: Unusual records, failed inventions, scientific facts, historical anecdotes, original pop culture.

⚠️ RULE #7 - QUESTION/ANSWER COHERENCE (CRITICAL!)
The answer MUST directly respond to what the question asks.
CHECK the expected answer TYPE before validating:

- Question "Why X?" → Answer = a REASON (not a name, not a color)
- Question "Who is/did X?" → Answer = a PERSON
- Question "When X?" → Answer = a DATE or PERIOD
- Question "Where X?" → Answer = a PLACE
- Question "What is X called?" → Answer = a NAME
- Question "How many X?" → Answer = a NUMBER
- Question "Is it A or B?" → Answer = A, B, or "both" (NEVER something else!)

❌ FATAL ERROR TO AVOID:
BAD Example: "Mickey wears gloves, is it to hide fingerprints or to not get dirty?" → "White"
The question asks for a REASON, not a COLOR → TOTAL INCOHERENCE!

✅ MANDATORY CHECK:
Before validating each question, ask yourself: "Does the answer really respond to what I'm asking?"
If the answer seems off-topic → REPHRASE the question or CHANGE the answer.

{PREVIOUS_FEEDBACK}

Generate valid JSON only without markdown or code blocks.
10 VARIED questions on "{TOPIC}".`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 5 "Ultimate Burger"
Theme: {TOPIC}

{QUESTIONS}

🔍 VERIFICATION IN 9 POINTS:

0. THEMATIC COHERENCE: All about "{TOPIC}"? Different angles?
1. ABSURDITY: QUIRKY questions, sometimes SILLY? Wordplay, traps, WTF?
2. DIVERSITY: No repetition? ABSURD/SERIOUS mix alternated? Varied styles?
3. ACCURACY (CRITICAL): True answers? Only one possible answer?
4. LENGTH: Questions 10-15 words, short answers (titles OK)?
5. MEMORABILITY: Phrasing that creates mental images or makes you laugh?
6. COMPLETE DATA: All questions/answers present?
7. BLACKLIST: No more than 1 question about celebrity phobias? No Pet Rock/Gary Dahl?
8. Q/A COHERENCE (CRITICAL!): Does the answer DIRECTLY respond to the question?
   - Question "Why X?" → Answer = REASON?
   - Question "A or B?" → Answer = A, B, or both?
   - Question "Who/What/Where/When" → Correct answer type?
   - BAD Example: "Is it X or Y?" → Answer: "Blue" = IMMEDIATE REJECTION!

⚠️ REJECT IF: 2+ similar questions OR 1+ factual error OR all questions "classic" OR 2+ questions about celebrity phobias OR 1+ Q/A incoherence

CRITICAL THRESHOLDS: factual_accuracy ≥ 7, absurdity ≥ 6, diversity ≥ 7, qa_coherence ≥ 8

JSON:
{
  "approved": true|false,
  "scores": {"theme_coherence":1-10,"absurdity":1-10,"diversity":1-10,"factual_accuracy":1-10,"memorability":1-10,"length":1-10,"style_variety":1-10,"qa_coherence":1-10},
  "overall_score": 1-10,
  "off_theme_questions": [],
  "duplicate_concepts": [],
  "questions_feedback": [
    {"index":0,"question":"...","answer":"...","ok":true|false,"on_theme":true|false,"absurd":true|false,"memorable":true|false,"qa_coherent":true|false,"issues":[]}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

No markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `REPLACEMENT Phase 5 "Ultimate Burger"
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

CURRENT SEQUENCE: {CURRENT_SEQUENCE}
REPLACE (indices {BAD_INDICES}): {BAD_QUESTIONS}
REJECTION REASONS: {REJECTION_REASONS}
CALLBACKS: {CALLBACK_CONTEXT}

⚠️ REPLACEMENT RULES:
1. Respect theme "{TOPIC}"
2. Short questions (10-15 words), short answers (1-3 words OK)
3. ABSURD spirit: QUIRKY questions, sometimes SILLY, wordplay, traps
4. VARIED style (different from other questions)
5. DIFFERENT subject (no duplicate)
6. VERIFY with Google, only one possible answer
7. Difficulty progression: 0-3=easy, 4-6=medium, 7-9=hard

Generate valid JSON only, no markdown.
{COUNT} replacement questions.`;
