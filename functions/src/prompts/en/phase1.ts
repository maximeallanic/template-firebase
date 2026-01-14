/**
 * English Phase 1 (Tenders) Prompts
 * Speed MCQ questions in QI/panel show style
 * OPTIMIZED: Condensed prompts for faster generation
 */

export const PHASE1_PROMPT = `SPICY VS SWEET - 10 Tenders questions
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

⚠️ STRICT RULES:
1. 4 BELIEVABLE options in the same register (genuine hesitation)
2. ONE verifiable correct answer, 3 FALSE but plausible
3. Clear and direct questions (15 words max)
4. TRUE and interesting anecdote (20 words max)

❌ FORBIDDEN: puns in options, duplicates

JSON: [{"text":"Quirky question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"WTF fact"}]`;

export const PHASE1_GENERATOR_PROMPT = `You are a question creator for SPICY VS SWEET in the "Tenders" phase (Speed MCQ).

📋 CONTEXT
Imposed theme: {TOPIC}
Difficulty: {DIFFICULTY}
Number of questions: 10

🎯 RULE #0 - STRICT THEMATIC COHERENCE
ALL 10 questions MUST be about the theme "{TOPIC}".
Explore 10 DIFFERENT angles of the same theme.
❌ ZERO off-topic questions tolerated.

🎯 RULE #1 - ABSOLUTE FACTUAL ACCURACY
Each question must have ONE correct answer that is 100% verifiable.
MENTALLY VERIFY each fact BEFORE writing it.
The 3 wrong answers must be FALSE but credible.
❌ No ambiguity possible between answers.

⚠️ WATCH OUT FOR MYTHS AND URBAN LEGENDS:
Some "famous anecdotes" are actually FALSE:
- ALWAYS verify extraordinary claims with research
- If a story seems "too good to be true", it probably is
- Prefer cautious phrasing for disputed facts ("According to legend...", "Allegedly...")
- A factual error = REJECTION of the entire question

COMMON MYTHS TO NEVER USE AS FACTS:
- Caligula did NOT make his horse a consul (he only considered it)
- Einstein was GOOD at math (the bad student myth is false)
- Vikings did NOT have horned helmets (19th century romantic invention)
- Newton and the apple: UNPROVEN anecdote
- "Let them eat cake": Marie Antoinette never said this

🎯 RULE #2 - BELIEVABLE OPTIONS
All 4 options must be BELIEVABLE and in the same register.
The player must GENUINELY doubt between options.
❌ FORBIDDEN: obvious puns, ridiculous options, 4 too-similar options (e.g., 4 words ending in "-ism")
✅ REQUIRED: Variety of formats (names, numbers, dates, places, concepts)
✅ INCLUDE 1-2 surprising answers that SOUND true (trap for the player)

🎯 RULE #3 - SUBJECT DIVERSITY
Intelligently alternate between:
- SERIOUS subjects (science, history, geography)
- LIGHT subjects (pop culture, unusual facts, bizarre records)
- Counter-intuitive or surprising facts
❌ No similar or redundant questions.

🎯 RULE #4 - MANDATORY ANECDOTES
Each question MUST have a WTF/unusual anecdote of 20 words max.
The anecdote enriches the correct answer with a surprising VERIFIABLE detail.
❌ The anecdote must NOT be empty or generic.

{PREVIOUS_FEEDBACK}

OUTPUT FORMAT (pure JSON, no markdown):
[
  {
    "text": "Quirky question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 2,
    "anecdote": "Surprising and verifiable WTF fact."
  }
]

Generate 10 DIFFERENT questions on the theme "{TOPIC}".`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `You are a STRICT reviewer for SPICY VS SWEET Phase 1 questions.

EXPECTED THEME: {TOPIC}

QUESTIONS TO EVALUATE:
{QUESTIONS}

🔍 STRICT EVALUATION GRID (10 criteria):

1. THEMATIC COHERENCE (score out of 10)
   - Do ALL questions relate to "{TOPIC}"?
   - ZERO tolerance for off-topic questions
   - Score < 8 = IMMEDIATE REJECTION

2. FACTUAL ACCURACY (score out of 10)
   - Is each correct answer 100% true and verifiable?
   - Is there ONLY ONE unambiguous correct answer?
   - Are the wrong answers truly false?
   - Score < 8 = IMMEDIATE REJECTION

3. OPTION QUALITY (score out of 10)
   - Do all 4 options sound plausible?
   - Varied formats (not 4 names ending in "-ism" or 4 similar dates)?
   - Presence of 1-2 WTF/absurd options that sound true?
   - ❌ Obvious puns, comic inventions
   - Score < 7 = REJECTION

4. HUMOR & STYLE (score out of 10)
   - Quirky, absurd, irreverent phrasing?
   - Do the questions make you smile?
   - Score < 6 = REJECTION

5. STYLE DIVERSITY (score out of 10)
   - VARIED sentence structures between questions?
   - Mix of direct, affirmative, provocative questions?
   - Score < 7 = REJECTION

6. CLARITY (score out of 10)
   - Short questions (≤ 15 words)?
   - No ambiguity in wording?
   - Score < 7 = REJECTION

7. SUBJECT VARIETY (score out of 10)
   - Mix of serious/light topics?
   - No duplicates or similar questions?
   - Score < 7 = REJECTION

8. ANECDOTES (score out of 10)
   - Does each question have a verifiable WTF anecdote?
   - Surprising and non-generic anecdotes?
   - Reasonable length (≤ 20 words)?

9. ORIGINALITY (score out of 10)
   - Unexpected and fresh questions?
   - No clichés or questions seen 1000 times?

10. TRAP QUALITY (score out of 10)
    - Do questions make you genuinely hesitate?
    - Can the player easily be tricked?

⚠️ AUTOMATIC REJECTION CRITERIA:
- 1+ off-topic question → approved: false
- 1+ factual error → approved: false
- 1+ ambiguity → approved: false
- Ridiculous/too-similar options → approved: false
- Internal duplicates → approved: false
- Missing anecdotes → approved: false
- Not funny enough (humor < 6) → approved: false

✅ APPROVAL THRESHOLDS (ALL required):
- factual_accuracy ≥ 8
- options_quality ≥ 7
- humor ≥ 6
- clarity ≥ 7
- variety ≥ 7
- overall_score ≥ 7

OUTPUT FORMAT (pure JSON, no markdown):
{
  "approved": true|false,
  "scores": {
    "factual_accuracy": 1-10,
    "humor": 1-10,
    "clarity": 1-10,
    "variety": 1-10,
    "options_quality": 1-10
  },
  "overall_score": 1-10,
  "questions_feedback": [
    {
      "index": 0,
      "text": "Question text",
      "ok": true|false,
      "funny": true|false,
      "issue": "Problem description if ok=false",
      "issue_type": "factual_error"|"off_topic"|"ambiguous"|"not_funny"|"too_long"|"duplicate"|"implausible_options"|"missing_anecdote"|null
    }
  ],
  "global_feedback": "Detailed feedback on all questions",
  "suggestions": ["Suggestion 1", "Suggestion 2", "..."]
}

Be RUTHLESS. Better to reject and iterate than validate mediocre questions.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `REPLACEMENT - Generate {COUNT} Spicy vs Sweet question(s)
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

REJECTED: {BAD_QUESTIONS}
REASONS: {REJECTION_REASONS}

🎯 ANTI-SPOILER REMINDER:
• NEVER put the distinctive trait in the question
• Use indirect CONSEQUENCES or ACTIONS
• 4 DISTINCT options (no synonyms)

JSON: [{"text":"Question without spoiler?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Verifiable fact"}]`;

export const REVIEW_PHASE1_PROMPT = `FACT-CHECK Phase 1: {QUESTIONS}

Verify each question: 1) Answer true? 2) Only one possible answer? 3) Fun style? 4) Anecdote true?

JSON: {"reviews":[{"index":0,"status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"style"|"anecdote"|null}],"summary":{"approved":8,"rejected":2,"rejectedIndices":[3,7]}}`;

export const REGENERATE_PHASE1_PROMPT = `REGENERATE {COUNT} Spicy vs Sweet question(s)
Theme: {TOPIC} | Difficulty: {DIFFICULTY}
Rejected: {REJECTED_REASONS}

Fun style, verifiable answers, 4 believable options.

JSON: [{"text":"Question?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"WTF fact"}]`;
