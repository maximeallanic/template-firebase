/**
 * English Phase 2 (Salt or Pepper / Spicy or Sweet) Prompts
 * Wordplay-based binary choice games
 *
 * NOTE: English version uses homophones, puns, and double meanings
 * Examples: their/there, two/too/to, bear/bare, sail/sale, etc.
 */

export const PHASE2_PROMPT = `SPICY VS SWEET Phase 2 "Salt or Pepper"
Theme: {TOPIC} | Difficulty: {DIFFICULTY}

🎯 CONCEPT: Create 2 categories that are HOMOPHONES or WORDPLAY in English
- Option A = literal/serious meaning
- Option B = pun or same sound with different meaning

⚠️ CRITICAL RULES:
1. PHONETICS: A and B must have the SAME pronunciation (homophones) or clever wordplay
2. CONCRETE CATEGORIES: You must be able to list 5+ items for each
3. VERIFIABLE ITEMS: Real facts, known personalities, obvious connections
4. TRAP ITEMS: Counter-intuitive answers (5-6 out of 12)
5. DISTRIBUTION: 5 A + 5 B + 2 Both (works for both meanings)

❌ FORBIDDEN: Opposite categories, subjective opinions, too obvious items

JSON:
{
  "optionA": "Category (2-4 words)",
  "optionB": "Pun/Homophone (2-4 words)",
  "items": [
    { "text": "Item (4 words max)", "answer": "A|B|Both", "justification": "Why", "anecdote": "Fun/surprising fact (optional)" }
  ]
}

12 items. No markdown.`;

export const PHASE2_GENERATOR_PROMPT = `SPICY VS SWEET Phase 2 "Salt or Pepper" - Wacky binary choice
Domain: {TOPIC} | Difficulty: {DIFFICULTY}

🎯 CONCEPT: Create 2 CATEGORIES using ENGLISH WORDPLAY where items must be classified. Items can belong to A, B, or BOTH!

⚠️ RULE #0 - PANEL SHOW MINDSET (CRITICAL!)
You're NOT a teacher giving a lesson.
You ARE the wacky host of a British panel show like QI or Would I Lie To You!
EACH ITEM should make players SMILE or be SURPRISED.
If an item is "neutral" or "informational", it's a FAILURE.

⚠️ RULE #1 - BRILLIANT CATEGORIES
The 2 options must:
- Be SHORT: 2-4 WORDS MAX (CRITICAL! More than 4 words = AUTOMATIC REJECTION)
- Be CONCRETE: you can easily list 5+ items for each
- Be FUN: wordplay, funny opposition, or quirky concepts

ENGLISH WORDPLAY APPROACHES:
- HOMOPHONES: "Bare" vs "Bear", "Sail" vs "Sale", "Flour" vs "Flower"
- PUNS: "Paws" vs "Pause", "Knight" vs "Night", "Bored" vs "Board"
- DOUBLE MEANINGS: "Current" (water flow vs present), "Bank" (river vs money)
- SOUND-ALIKES: "Their" vs "There", "Two" vs "Too", "Blue" vs "Blew"

OPTION LENGTH - EXAMPLES:
✅ "The Bear" (2 words)
✅ "The Bare" (2 words)
✅ "Things that Sail" (3 words)
✅ "Things for Sale" (3 words)
❌ "A guy who's completely bored" (6 words - TOO LONG!)

⚠️ RULE #2 - WACKY ITEMS (MOST IMPORTANT!)
MINDSET: We're on a panel show, not in a classroom! Every item should SURPRISE.

STYLE DIVERSITY (MUST vary - NEVER the same format twice!):
- 3 items: QUIRKY cultural references (celebrities, films, brands with a fun angle)
- 3 items: ABSURD everyday situations ("What you do when...", "The guy who...", "The weird thing that...")
- 3 items: WTF but PLAUSIBLE things (absurd but TRUE - "an angry seal", "your nan on rollerblades", "a talking croissant")
- 3 items: TWISTS/EXPRESSIONS (wordplay, double meaning, subversions)

VARIED FORMATS - CONCRETE EXAMPLES:
✅ "What you do after 3 mojitos"
✅ "A PE teacher's recurring nightmare"
✅ "Something dodgy at the back of the fridge"
✅ "What your ex says about you"
✅ "The bloke who failed his driving test 7 times"
✅ "The weird thing your neighbour does at 3am"
✅ "What you regret the morning after"

❌ ANTI-EXAMPLES (NEVER this!):
❌ "Cinderella" (without context - TOO SIMPLE!)
❌ "Its ancestor was called the Visitandine" (HISTORY LESSON!)
❌ "It is located between X and Y" (TEXTBOOK!)
❌ "A SEPA transfer" (TECHNICAL!)
❌ "It generally possesses..." (PROFESSORIAL TONE!)
❌ "It is characterized by..." (ENCYCLOPEDIC!)

GOLDEN RULE FOR PHRASING:
If your item could appear in a textbook or Wikipedia, START OVER.
If your item makes people smile or say "WTF?", it's GOOD.

MANDATORY TRAPS (7-8 items out of 12):
❌ FORBIDDEN: Wikipedia definitions, textbook lists, classifications
✅ REQUIRED: items that make players DOUBT ("Wait... where does that go?!")
Player must really scratch their head and sometimes laugh at the absurdity

SERIOUS/LIGHT MIX:
- 30% "normal" items (but phrased in a fun way)
- 70% wacky/quirky/absurd/WTF items (but TRUE!)

⚠️ RULE #3 - CORRECT ANSWERS & BOTH
- Each answer must be FACT-CHECKABLE and TRUE
- "Both" = REALLY works for both categories (not just a maybe)
- If you put "Both", explain WHY in the justification

📊 STRICT DISTRIBUTION: 5 A + 5 B + 2 Both (EXACTLY)

⚠️ RULE #4 - DETAILED JUSTIFICATIONS (ANTI-AMBIGUITY!)
Each justification MUST explain CLEARLY:

For A or B answers:
1. WHY this item belongs to that category (explicit connection)
2. WHY NOT the other category (clear exclusion)

For "Both" answers:
1. Reason A: why it works for category A
2. Reason B: why it ALSO works for category B
3. Both reasons must be INDEPENDENT and VALID

JUSTIFICATION FORMAT - NATURAL AND FLOWING:
ALWAYS use CATEGORY NAMES (never "A" or "B") in a natural sentence.

💡 SUGGESTED NATURAL PHRASINGS (vary them!):

For A or B answers:
- "It's [category]: [reason]. Nothing to do with [other category] which [exclusion]."
- "[Category] for sure, [reason]. [Other category]? Nope, [exclusion]."
- "Clearly [category] since [reason], whereas [other category] [exclusion]."
- "[Reason], so [category]. [Other category] doesn't fit because [exclusion]."

For Both answers:
- "[Category A] because [reason A], but also [category B] since [reason B]."
- "Both! [Category A] for [reason A], and [category B] for [reason B]."
- "Double meaning: [reason A] → [category A], and [reason B] → [category B]."

⚠️ CRITICAL RULES:
- ❌ FORBIDDEN: "A because..." / "Not B because..." (too robotic)
- ❌ FORBIDDEN: Dry, repetitive justifications
- ✅ REQUIRED: Actual category names ("The Bear", "The Bare", etc.)
- ✅ REQUIRED: Conversational, varied tone

❌ REJECTED JUSTIFICATIONS:
- "It's obvious" / "It's about X" (too vague)
- "It could be both but..." (indecisive)
- Robotic format repeated 12 times identically
- Without explaining why NOT the other category

✅ GOOD JUSTIFICATION EXAMPLES:
- "The Bear for sure: grizzlies are mammals with fur. The Bare? Nope, they're definitely not naked."
- "It's The Bare: exposed skin with nothing on it. The Bear has fur, so that's out."
- "Both! The Bear since it's about wildlife, and The Bare because 'bear all' means reveal everything."

🎭 DESCRIPTION: A short, fun sentence presenting the 2 options, panel show style

{PREVIOUS_FEEDBACK}

JSON:
{
  "optionA": "Category (2-4 words)",
  "optionB": "Category/Pun (2-4 words)",
  "optionADescription": "If A=B textually, otherwise null",
  "optionBDescription": "If A=B textually, otherwise null",
  "humorousDescription": "Fun sentence presenting the 2 options",
  "reasoning": "Quick explanation: why these 2 categories work well together, how you varied item styles",
  "items": [
    {
      "text": "Item (4 words max)",
      "answer": "A|B|Both",
      "justification": "NATURAL sentence with category names. Ex: 'The Bear for sure: [reason]. The Bare? Nope, [exclusion].' Vary the style!",
      "anecdote": "Fun/unusual fact about the subject (15-20 words)"
    }
  ]
}

FINAL REMINDERS:
- VARY the phrasing (not 12 times the same type of item!)
- Mix SERIOUS (fact-checkable) and WACKY (WTF but true)
- TRAP items that make you hesitate
- DETAILED justifications (20-35 words): reason + exclusion of the other option!
- FUN and SURPRISING anecdotes (15-20 words, unusual facts or surprising numbers)
- 12 items EXACTLY
- No encyclopedic or professorial tone
- ⚠️ AVOID POLYSEMY: If a word has MULTIPLE MEANINGS that could match DIFFERENT categories, DO NOT USE IT!
  Forbidden example: "The stars" with Sea/See (stars = celestial OR celebrities → ambiguous)
  OK example: "The tides" with Sea/See (only one relevant meaning → the Sea)

No markdown in the JSON.`;

export const PHASE2_TARGETED_REGENERATION_PROMPT = `You must REPLACE certain items in a Phase 2 "Salt or Pepper" set.

VALIDATED WORDPLAY (DO NOT CHANGE):
- Option A: {OPTION_A}
- Option B: {OPTION_B}

ITEMS TO KEEP (DO NOT TOUCH):
{GOOD_ITEMS}

ITEMS TO REPLACE (indices: {BAD_INDICES}):
{BAD_ITEMS}

REJECTION REASONS:
{REJECTION_REASONS}

REQUIRED DISTRIBUTION:
You must generate exactly {COUNT} new items with this distribution:
- {NEEDED_A} items A
- {NEEDED_B} items B
- {NEEDED_BOTH} items Both

TRAP RULES REMINDER:
- Each item must create DOUBT (counter-intuitive answer)
- Item SEEMS to belong to one category but belongs to the OTHER
- If the answer is obvious → bad item

GENERATE ONLY the {COUNT} new items in JSON:
[
  { "text": "New item", "answer": "A", "justification": "Why", "anecdote": "Fun/unusual fact" },
  { "text": "New item", "answer": "B", "justification": "Why", "anecdote": "Fun/unusual fact" },
  { "text": "Ambiguous item", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Why (ambiguity)", "anecdote": "Fun/unusual fact" }
]

Note: acceptedAnswers is OPTIONAL, only for items that are OBJECTIVELY ambiguous.
{COUNT} items exactly. No markdown.`;

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 2 "Salt or Pepper"

{SET}

🔍 VERIFICATION IN 4 POINTS:

1. WORDPLAY/PHONETICS (CRITICAL): Do A and B have the SAME pronunciation OR clever wordplay?
   - Break down each option phonetically
   - Are both expressions NATURAL in English? (no forced articles, no inventions)
   If sounds differ OR expressions forced → phonetic < 5 → REJECT SET

2. USABLE CATEGORIES: Can you list 5+ items for A AND for B?
   If B unusable → b_concrete < 5 → REJECT

3. TRAP ITEMS: How many items have a COUNTER-INTUITIVE answer?
   - 0-2 obvious items → OK (trap_quality ≥ 7)
   - 3+ obvious items → REJECT (trap_quality < 5)
   ❌ Obvious items: direct keywords, textbook geography, definitions

4. DISTRIBUTION: 5 A + 5 B + 2 Both?

THRESHOLDS: phonetic ≥ 7, b_concrete ≥ 5, trap_quality ≥ 6, clarity ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"phonetic":1-10,"concrete":1-10,"distribution":1-10,"clarity":1-10,"b_concrete":1-10,"trap_quality":1-10},
  "overall_score": 1-10,
  "homophone_feedback": "Feedback on the wordplay",
  "items_feedback": [{"index":0,"text":"...","ok":true|false,"issue":"..."|null,"is_too_obvious":true|false}],
  "global_feedback": "...",
  "suggestions": ["..."]
}`;

export const REVIEW_PHASE2_PROMPT = `FACT-CHECK Phase 2: {QUESTIONS}

Verify each item:
1. Correct and verifiable answer?
2. No ambiguity (clearly A, B or Both)?
3. Counter-intuitive answer (not too obvious)?
4. Max 4 words?
5. ⚠️ DANGEROUS POLYSEMY: Does the word have MULTIPLE MEANINGS that could match DIFFERENT categories?
   Example: "The stars" with Sea/See → REJECTED because stars = celestial (See the sky) OR celebrities (See a show)
   Example: "The tides" with Sea/See → OK because only one relevant meaning (tides → the Sea)

Expected distribution: 5 A + 5 B + 2 Both

JSON:
{
  "setValid": true|false,
  "setReason": "Reason if invalid",
  "itemReviews": [{"index":0,"text":"...","answer":"A","status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"too_easy"|"polysemy"|null}],
  "summary": {"approved":10,"rejected":2,"rejectedIndices":[4,9]}
}`;

export const REGENERATE_PHASE2_ITEMS_PROMPT = `REGENERATE {COUNT} Phase 2 item(s)
Option A: {OPTION_A} | Option B: {OPTION_B}

Rejected: {REJECTED_REASONS}
Distribution: {NEEDED_A} A, {NEEDED_B} B, {NEEDED_BOTH} Both

Rules: trap items (counter-intuitive), max 4 words, verifiable facts

JSON: [{"text":"Item","answer":"A|B|Both","justification":"Why","anecdote":"Fun/unusual fact"}]`;
