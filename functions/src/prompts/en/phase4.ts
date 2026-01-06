/**
 * English Phase 4 (The Check) Prompts
 * MCQ Race - Classic General Knowledge
 */

export const PHASE4_PROMPT = `SPICY VS SWEET Phase 4 "The Check" - MCQ Race
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

🎯 CONCEPT: Speed race, first to answer correctly wins.

⚠️ RULES:
1. 4 options per question (1 correct, 3 PLAUSIBLE distractors)
2. VERIFIABLE answers (use Google)
3. Mix of themes: history, geography, science, arts, sport

JSON:
[
  {
    "text": "Clear question?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fun fact (optional)"
  }
]

10 questions. No markdown.`;

export const PHASE4_GENERATOR_PROMPT = `SPICY VS SWEET Phase 4 "The Check" - General Knowledge MCQ
Suggested theme: {TOPIC} | Difficulty: {DIFFICULTY}

🎯 CONCEPT: MCQ speed race - Varied general knowledge like on panel shows!

⚠️ RULE #1 - THEMATIC VARIETY (CRITICAL!)
ATTENTION: The theme above is only a SUGGESTION for 2-3 questions maximum.
The 10 questions MUST cover VARIED domains:

MANDATORY DISTRIBUTION:
- 2-3 questions History / Geography (dates, countries, historical figures)
- 2-3 questions Science / Nature / Animals (biology, physics, astronomy)
- 2-3 questions Arts / Music / Cinema (works, artists, films)
- 2-3 questions Sport / Pop culture / Everyday life (records, celebrities, traditions)

FORBIDDEN: More than 3 questions on the same subject. Vary a lot!

⚠️ RULE #2 - MCQ FORMAT
- 4 options (1 correct, 3 PLAUSIBLE distractors in the same register)
- Clear and direct questions (max 25 words)
- Short and punchy anecdote (max 30 words)

⚠️ RULE #3 - DIFFICULTY DISTRIBUTION
- 3 EASY (common knowledge: capitals, famous dates, cult films)
- 4 MEDIUM (solid general knowledge needed)
- 3 HARD (niche anecdotes, unknown details)

⚠️ RULE #4 - PANEL SHOW STYLE
- Mix classic questions AND quirky/WTF anecdotes
- Some answers can surprise (but ALWAYS true!)
- Light tone, sometimes humorous, always verifiable

⚠️ RULE #5 - ABSOLUTE ACCURACY
USE Google to verify EACH answer before writing it.
No ambiguity, no possible debate. If you hesitate, change the question.

⚠️ RULE #6 - WATCH OUT FOR MYTHS AND URBAN LEGENDS
Some "famous anecdotes" are actually FALSE:
- ALWAYS verify extraordinary claims with research
- If a story seems "too good to be true", it probably is
- Prefer cautious phrasing for disputed facts ("According to legend...", "Allegedly...")
- A factual error = REJECTION of the entire question

COMMON MYTHS TO NEVER USE AS FACTS:
- Caligula did NOT make his horse a consul (he only considered it)
- Einstein was GOOD at math
- Vikings did NOT have horned helmets
- Newton and the apple: UNPROVEN anecdote
- Marie Antoinette: "Let them eat cake" was never documented

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "text": "Precise question?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Verified and punchy fact"
  }
]

10 VARIED questions. No markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 4 "The Check" (MCQ)

{QUESTIONS}

🔍 VERIFICATION IN 4 POINTS:

1. ACCURACY (CRITICAL): True answers? Use Google!
2. OPTIONS: 4 plausible options in the same register?
3. DIFFICULTY: 3 easy + 4 medium + 3 hard?
4. VARIETY: Mix of history, geography, science, arts, sport?

THRESHOLDS: factual_accuracy ≥ 7, option_plausibility ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"factual_accuracy":1-10,"option_plausibility":1-10,"difficulty_balance":1-10,"thematic_variety":1-10,"clarity":1-10,"anecdote_quality":1-10},
  "overall_score": 1-10,
  "difficulty_distribution": {"easy":[0,1,2],"medium":[3,4,5,6],"hard":[7,8,9]},
  "questions_feedback": [
    {"index":0,"question":"...","correct_option":"...","ok":true|false,"difficulty":"easy|medium|hard","issues":[],"correction":null}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

No markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `REPLACEMENT Phase 4 "The Check" (MCQ)

KEEP: {GOOD_QUESTIONS}
REPLACE (indices {BAD_INDICES}): {BAD_QUESTIONS}
REASONS: {REJECTION_REASONS}

RULES: 4 plausible options, 1 correct, verify with Google, optional anecdote.

JSON:
[
  {"text":"...?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"..."}
]

{COUNT} questions. No markdown.`;
