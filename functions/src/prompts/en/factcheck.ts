/**
 * English Fact-Checking Prompts
 * Prompts for verifying generated content accuracy
 */

// ============================================================================
// COMMON MYTHS DATABASE - Urban legends that MUST be detected and rejected
// ============================================================================

/**
 * List of common myths and urban legends to detect (50+)
 * If a question uses one of these myths as fact, it must be rejected
 */
export const COMMON_MYTHS = [
  // === HISTORICAL MYTHS ===
  { myth: "Caligula made his horse a consul", truth: "He only considered doing it", keywords: ["Caligula", "Incitatus", "consul"] },
  { myth: "Marie Antoinette said 'let them eat cake'", truth: "No historical evidence, attributed to Rousseau", keywords: ["Marie Antoinette", "cake", "brioche"] },
  { myth: "Vikings wore horned helmets", truth: "19th century romantic invention", keywords: ["Vikings", "helmets", "horns"] },
  { myth: "Napoleon was short", truth: "5'6\", average height for the time", keywords: ["Napoleon", "short", "height"] },
  { myth: "Newton discovered gravity from a falling apple", truth: "Probably apocryphal anecdote", keywords: ["Newton", "apple", "gravity"] },
  { myth: "Christopher Columbus proved the Earth was round", truth: "Greeks knew this 2000 years earlier", keywords: ["Columbus", "Earth", "round", "flat"] },
  { myth: "Gladiators always fought to the death", truth: "Rare, they were too expensive to train", keywords: ["gladiators", "death", "arena"] },
  { myth: "Cleopatra was Egyptian", truth: "She was of Greek origin (Ptolemy)", keywords: ["Cleopatra", "Egyptian", "Greek"] },
  { myth: "Chastity belts existed in Medieval times", truth: "19th century invention", keywords: ["chastity", "belt", "Medieval"] },
  { myth: "Witches were burned at the stake in Medieval times", truth: "Mostly Renaissance, often hanged", keywords: ["witches", "burned", "Medieval"] },
  { myth: "Salieri poisoned Mozart", truth: "No evidence, romantic myth", keywords: ["Salieri", "Mozart", "poison"] },
  { myth: "Van Gogh cut off his whole ear", truth: "Only the lobe", keywords: ["Van Gogh", "ear", "cut"] },
  { myth: "Pyramids were built by slaves", truth: "By paid workers", keywords: ["pyramids", "slaves", "Egypt"] },

  // === SCIENTIFIC MYTHS ===
  { myth: "Einstein was bad at math", truth: "He excelled at mathematics", keywords: ["Einstein", "bad", "math"] },
  { myth: "We only use 10% of our brain", truth: "We use our entire brain", keywords: ["10%", "brain"] },
  { myth: "The Great Wall of China is visible from space", truth: "Too narrow to be visible", keywords: ["Great Wall", "China", "space", "visible"] },
  { myth: "Bats are blind", truth: "They can see very well", keywords: ["bats", "blind"] },
  { myth: "Goldfish have a 3-second memory", truth: "They have several months of memory", keywords: ["goldfish", "memory", "seconds"] },
  { myth: "Ostriches bury their heads in the sand", truth: "They never do this", keywords: ["ostrich", "head", "sand"] },
  { myth: "Deoxygenated blood is blue", truth: "It's always red", keywords: ["blood", "blue", "veins"] },
  { myth: "Lightning never strikes the same place twice", truth: "It can strike the same spot", keywords: ["lightning", "strikes", "same place"] },
  { myth: "Humans have 5 senses", truth: "We have at least 9 (balance, pain, etc.)", keywords: ["5 senses", "five senses"] },
  { myth: "We swallow 8 spiders a year while sleeping", truth: "Urban legend with no basis", keywords: ["spiders", "swallow", "sleep"] },
  { myth: "Hair/nails continue growing after death", truth: "Skin retracts giving this illusion", keywords: ["hair", "nails", "death", "grow"] },
  { myth: "Water conducts electricity", truth: "Pure water is an insulator, impurities conduct", keywords: ["water", "electricity", "conductor"] },
  { myth: "Sunflowers follow the sun", truth: "Only young plants, not mature flowers", keywords: ["sunflower", "sun", "follow"] },
  { myth: "Chameleons change color for camouflage", truth: "It's for communication and temperature", keywords: ["chameleon", "color", "camouflage"] },
  { myth: "We lose body heat through our head", truth: "We lose it equally through any exposed surface", keywords: ["heat", "head", "lose"] },
  { myth: "Lemmings commit mass suicide", truth: "Myth created by Disney", keywords: ["lemmings", "suicide", "cliff"] },
  { myth: "Glass is a very viscous liquid", truth: "It's an amorphous solid", keywords: ["glass", "liquid", "viscous"] },

  // === FOOD MYTHS ===
  { myth: "Sugar makes children hyperactive", truth: "No scientific evidence", keywords: ["sugar", "children", "hyperactive"] },
  { myth: "You must wait before swimming after eating", truth: "No proven drowning risk", keywords: ["swimming", "eating", "wait"] },
  { myth: "Milk is good for bones", truth: "Little evidence, high-consuming countries have more osteoporosis", keywords: ["milk", "bones", "calcium"] },
  { myth: "Eating carrots improves vision", truth: "British WWII propaganda", keywords: ["carrots", "vision", "eyes"] },
  { myth: "Chocolate causes acne", truth: "No proven scientific link", keywords: ["chocolate", "acne", "spots"] },
  { myth: "Alcohol warms you up", truth: "It dilates vessels and causes heat loss", keywords: ["alcohol", "warm", "cold"] },

  // === CULTURAL AND GEOGRAPHICAL MYTHS ===
  { myth: "Inuits have 50 words for snow", truth: "Linguistic exaggeration", keywords: ["Inuits", "Eskimos", "snow", "words"] },
  { myth: "Frankenstein is the name of the monster", truth: "It's the name of the doctor", keywords: ["Frankenstein", "monster", "doctor"] },
  { myth: "Sherlock Holmes said 'Elementary, my dear Watson'", truth: "Never in the original books", keywords: ["Sherlock", "Holmes", "Elementary", "Watson"] },
  { myth: "Tomato is a vegetable", truth: "It's botanically a fruit", keywords: ["tomato", "vegetable", "fruit"] },
  { myth: "Red Santa Claus was invented by Coca-Cola", truth: "He existed in red before", keywords: ["Santa Claus", "Coca-Cola", "red"] },
  { myth: "Bulls are angered by the color red", truth: "They're colorblind, it's the movement that angers them", keywords: ["bull", "red", "bullfight"] },
  { myth: "Quicksand sucks people down", truth: "Impossible to sink completely", keywords: ["quicksand", "sink"] },

  // === TECHNOLOGY MYTHS ===
  { myth: "Macs can't get viruses", truth: "They're just less targeted", keywords: ["Mac", "Apple", "virus"] },
  { myth: "Phones cause cancer", truth: "No solid scientific evidence", keywords: ["phone", "cancer", "waves"] },
  { myth: "You must fully drain the battery before recharging", truth: "Obsolete with lithium-ion batteries", keywords: ["battery", "drain", "recharge"] },

  // === PERSONALITY MYTHS ===
  { myth: "Walt Disney is cryogenically frozen", truth: "He was cremated", keywords: ["Disney", "cryogenically", "frozen"] },
  { myth: "Marilyn Monroe had an IQ of 168", truth: "No reliable evidence", keywords: ["Marilyn", "Monroe", "IQ"] },
  { myth: "Al Capone died in prison", truth: "He died at home of syphilis", keywords: ["Al Capone", "prison", "died"] },

  // === RELIGIOUS/BIBLICAL MYTHS ===
  { myth: "Adam and Eve ate an apple", truth: "The Bible mentions an unspecified 'fruit'", keywords: ["Adam", "Eve", "apple", "fruit"] },
  { myth: "There were three Wise Men", truth: "The Bible doesn't specify their number", keywords: ["Wise Men", "Magi", "three", "3"] },
];

export const FACT_CHECK_PROMPT = `You are a STRICT and RIGOROUS fact-checker.
Your mission: verify if an answer to a question is 100% CORRECT.

QUESTION: {QUESTION}
PROPOSED ANSWER: {ANSWER}
CONTEXT (optional): {CONTEXT}

INSTRUCTIONS:
1. USE the webSearch tool to verify the proposed answer
2. Search for RELIABLE sources (Wikipedia, official sites, encyclopedias)
3. Do NOT rely on your memory - VERIFY with a search

VALIDATION CRITERIA:
- Is the answer FACTUALLY CORRECT?
- Is the answer the ONLY possible answer to this question?
- Is there any AMBIGUITY in the question or answer?

RESPOND in JSON (STRICTLY this format):
{
  "isCorrect": true | false,
  "confidence": 0-100,
  "source": "Source used to verify (URL or reference)",
  "reasoning": "Short explanation of why the answer is correct or incorrect",
  "correction": "If incorrect, what is the correct answer? (null if correct)",
  "ambiguity": "If ambiguous, why? (null if no ambiguity)"
}

CONFIDENCE RULES:
- 95-100: Fact verified with reliable source, no doubt
- 80-94: Probably correct, source found but not 100% certain
- 60-79: Significant doubt, contradictory or incomplete sources
- 0-59: Probably false or impossible to verify

No markdown. JSON only.`;

export const FACT_CHECK_BATCH_PROMPT = `You are a STRICT and RIGOROUS fact-checker.
Your mission: verify if the answers to multiple questions are 100% CORRECT and UNAMBIGUOUS.

QUESTIONS TO VERIFY:
{QUESTIONS_JSON}

INSTRUCTIONS:
1. For EACH question, USE the webSearch tool to verify the answer
2. Search for RELIABLE sources (Wikipedia, official sites, encyclopedias)
3. Do NOT rely on your memory - VERIFY with a search for each question

VALIDATION CRITERIA (for each question):
- Is the answer FACTUALLY CORRECT?
- Is the answer the ONLY possible answer?
- Is there any AMBIGUITY?

⚠️ WRONG ANSWER VERIFICATION (CRITICAL):
For MCQs, also verify that wrong options are REALLY FALSE:
- No wrong option should be an acceptable answer
- Check if a wrong option could be considered correct according to some sources
- If a wrong option is potentially correct → flag it

Examples of problems to detect:
- Question about the inventor of X, but a wrong option also contributed significantly
- Question about the first to do X, but it's controversial and another option could be valid
- Geographic question where multiple answers could be valid
- A wrong option is technically correct in a different context

⚠️ SYNONYM AND EQUIVALENT DETECTION (CRITICAL):
For MCQs with multiple options, check if:
- A wrong option is a SYNONYM of the correct answer (e.g., "Janitor" = "Caretaker")
- Two options mean the SAME THING in different languages/contexts
- An option could be EQUALLY CORRECT depending on interpretation
- Technical terms have common ALIASES (e.g., "Sodium" = "Natrium")

Examples of SYNONYMS to detect:
- Janitor / Caretaker / Custodian
- Lawyer / Attorney / Solicitor
- Football / Soccer (UK vs US)
- Aubergine / Eggplant
- Courgette / Zucchini
- Pavement / Sidewalk

⚠️ URBAN LEGEND AND POPULAR MYTH DETECTION (CRITICAL):

Some "famous facts" are actually FALSE or EXAGGERATED. Check:

1. COMMON HISTORICAL MYTHS TO REJECT:
   - "Caligula made his horse a consul" → FALSE (he wanted to, never did)
   - "Einstein was bad at math" → FALSE
   - "We only use 10% of our brain" → FALSE
   - "Vikings wore horned helmets" → FALSE
   - "Napoleon was short" → MYTH (average height for the time)
   - "Marie Antoinette said 'let them eat cake'" → NO PROOF
   - "Newton discovered gravity from an apple" → UNPROVEN ANECDOTE

2. HISTORICAL CLAIM VERIFICATION RULE:
   - If the question claims a historical figure "DID" something extraordinary
   - VERIFY if it's a DOCUMENTED FACT or a LEGEND
   - Search "myth", "legend", "actually never", "commonly believed but false"
   - DISTINGUISH: "did" vs "wanted to do" vs "according to legend"

3. CAUTIOUS PHRASING REQUIRED:
   - Instead of "X did Y" → "X allegedly did Y" or "According to legend, X..."
   - Instead of "X was the first to" → Check if there's controversy
   - A statement too categorical for a disputed fact = confidence MAX 60

4. REDUCED CONFIDENCE FOR EXTRAORDINARY ANECDOTES:
   - The more surprising/WTF a claim is, the more it must be verified
   - An anecdote "too good to be true" is often FALSE
   - Confidence MAX 70 for unverified extraordinary claims

⚠️ If you detect a POPULAR MYTH presented as fact → isCorrect: false, confidence: 0
⚠️ Note the detected myth in the "mythDetected" field

RESPOND in JSON (STRICTLY this format):
{
  "results": [
    {
      "index": 0,
      "question": "The question...",
      "proposedAnswer": "The proposed answer",
      "isCorrect": true | false,
      "confidence": 0-100,
      "source": "Verification source",
      "reasoning": "Short explanation",
      "correction": "Correct answer if incorrect (null if correct)",
      "ambiguity": "Why ambiguous (null if no ambiguity)",
      "synonymIssue": "If another option is synonym/equivalent of the answer (null otherwise)",
      "wrongOptionIssue": "If a wrong option could be correct, which one and why (null otherwise)",
      "mythDetected": "If a myth/urban legend is presented as fact, which one (null otherwise)"
    }
  ],
  "summary": {
    "total": 10,
    "correct": 8,
    "incorrect": 1,
    "ambiguous": 1,
    "synonymIssues": 0,
    "wrongOptionIssues": 0,
    "mythsDetected": 0
  }
}

CONFIDENCE RULES:
- 95-100: Verified fact, no doubt, no synonyms, wrong options verified false
- 80-94: Probably correct, no obvious synonyms, wrong options probably false
- 60-79: Significant doubt OR potential synonym OR wrong option potentially correct
- 0-59: Probably false OR clear synonym OR wrong option clearly correct

⚠️ If you detect a synonym, set confidence <= 60 even if the answer is correct!
⚠️ If a wrong option could be acceptable, set confidence <= 60!

No markdown. JSON only.`;

export const FACT_CHECK_NO_SEARCH_PROMPT = `You are a STRICT and RIGOROUS fact-checker.

⚠️ IMPORTANT WARNING ⚠️
You do NOT have access to Google Search in this session.
You must evaluate each answer ONLY based on your internal knowledge.

QUESTIONS TO VERIFY:
{QUESTIONS_JSON}

CRITICAL RULE: BE CONSERVATIVE
- If you're not 95%+ CERTAIN of an answer, set confidence < 80
- Better a FALSE NEGATIVE (rejecting a good answer) than a FACTUAL ERROR
- When in doubt → low confidence

EVALUATE EACH QUESTION:
1. Is the answer a FACT you know with certainty?
2. Is there possible AMBIGUITY?
3. Could you be wrong due to lack of knowledge on the subject?

RESPOND in JSON (STRICTLY this format):
{
  "results": [
    {
      "index": 0,
      "question": "The question...",
      "proposedAnswer": "The proposed answer",
      "isCorrect": true | false,
      "confidence": 0-100,
      "reasoning": "Why I'm sure/not sure of this answer",
      "needsVerification": true | false,
      "verificationReason": "If needsVerification=true, why this fact should be verified"
    }
  ],
  "summary": {
    "total": 10,
    "highConfidence": 7,
    "lowConfidence": 2,
    "uncertain": 1
  }
}

CONFIDENCE SCALE (BE STRICT):
- 90-100: OBVIOUS fact you know with certainty (capital, famous date, known formula)
- 70-89: Probably correct but not 100% certain
- 50-69: Significant doubt - could be wrong
- 0-49: Very uncertain - you don't really know this fact

⚠️ If the fact concerns a precise date, exact number, or recent info → confidence MAX 70
⚠️ If you "think" it's correct but aren't SURE → confidence MAX 60

No markdown. JSON only.`;

export const FACT_CHECK_PHASE2_PROMPT = `FACT-CHECK Phase 2 - BATCH Verification

WORDPLAY:
- Category A: {OPTION_A}
- Category B: {OPTION_B}

ITEMS TO VERIFY:
{ITEMS_JSON}

INSTRUCTIONS:
1. USE webSearch to verify EACH item
2. Verify if the item belongs to the assigned category
3. Verify if it could belong to the OTHER category (→ Both)

CRITERIA PER ITEM:
- Correct assignment?
- Factual justification?
- Exclusion from other category verified?

JSON:
{
  "results": [
    {
      "index": 0,
      "text": "Item text",
      "assignedCategory": "A",
      "isCorrect": true|false,
      "confidence": 0-100,
      "shouldBe": "A"|"B"|"Both",
      "reasoning": "Short explanation"
    }
  ],
  "summary": {
    "total": 12,
    "correct": 10,
    "incorrect": 2
  }
}

Confidence: 90+ = certain, 70-89 = probable, <70 = doubt.
No markdown.`;

// ============================================================================
// AMBIGUITY CHECK PROMPT (dedicated check after fact-checking)
// ============================================================================

/**
 * Prompt for checking answer ambiguity.
 * This is a dedicated check that runs AFTER fact-checking to ensure
 * the question has exactly ONE correct answer with no ambiguity.
 *
 * {QUESTION} - The question text
 * {CORRECT_ANSWER} - The proposed correct answer
 * {WRONG_ANSWERS} - Array of wrong answer options (for MCQ)
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const AMBIGUITY_CHECK_PROMPT = `You are a quiz quality control expert.
Your mission: verify that a question has NO AMBIGUITY and has ONLY ONE correct answer.

QUESTION: {QUESTION}
CORRECT ANSWER: {CORRECT_ANSWER}
WRONG ANSWERS: {WRONG_ANSWERS}
ANECDOTE: {ANECDOTE}

INSTRUCTIONS:
1. USE the webSearch tool to verify each potential ambiguity point
2. Search for cases where the answer could be contested
3. Verify if wrong answers could be acceptable in certain contexts

⚠️ CRITICAL VERIFICATIONS (all must pass):

1. ANSWER UNIQUENESS
   - Is the correct answer THE ONLY possible answer?
   - Are there controversies or disagreements about this fact?
   - Does the question allow multiple valid answers according to sources?

2. SYNONYMS AND EQUIVALENTS
   - Is a wrong option a SYNONYM of the correct answer?
   - Do two options mean the SAME THING?
   - Could a term be EQUIVALENT in another context?

   Examples of synonyms to detect:
   - Janitor / Caretaker / Custodian
   - Football / Soccer
   - Aubergine / Eggplant
   - Courgette / Zucchini
   - Attorney / Lawyer
   - Pavement / Sidewalk

3. POTENTIALLY CORRECT WRONG ANSWERS
   - Could a wrong option be correct according to some sources?
   - Is there a historical/scientific controversy?
   - Would a wrong option be acceptable in a different context?

4. QUESTION AMBIGUITY
   - Can the question be interpreted in multiple ways?
   - Does a word have multiple possible meanings?
   - Is context sufficient for a unique answer?

5. FACTUAL PRECISION
   - Are dates, numbers, names EXACT?
   - Does the anecdote contain errors?
   - Are the facts verifiable and uncontested?

6. QUESTION/ANSWER SEMANTIC COHERENCE (CRITICAL!)
   - Does the answer DIRECTLY respond to what the question asks?
   - If question offers choices (A or B) → answer among the choices?
   - Expected answer type vs given answer type?

   ✅ Mappings to verify:
   - "Why X?" → Answer = REASON
   - "Who did X?" → Answer = PERSON
   - "When X?" → Answer = DATE/PERIOD
   - "Where X?" → Answer = PLACE
   - "How many X?" → Answer = NUMBER
   - "Is it A or B?" → Answer = A, B, or "both"

   ❌ Incoherences to reject:
   - "Why does X do Y?" → Answer: "Blue" (color instead of reason)
   - "Is it A or B?" → Answer: "C" (choice outside options)
   - "Who invented X?" → Answer: "In 1954" (date instead of name)

RESPOND in JSON (STRICTLY this format):
{
  "hasIssues": true | false,
  "ambiguityScore": 0-10,
  "issues": [
    {
      "type": "synonym" | "multiple_answers" | "wrong_option_correct" | "unclear_question" | "factual_error" | "qa_incoherence",
      "severity": "critical" | "major" | "minor",
      "description": "Problem description",
      "evidence": "Source or proof of the problem"
    }
  ],
  "suggestions": [
    "Suggestion to fix the problem..."
  ],
  "confidence": 0-100,
  "reasoning": "Analysis summary"
}

AMBIGUITY SCALE (ambiguityScore):
- 10: Perfect - clear question, unique answer, no ambiguity
- 8-9: Excellent - very slight possible doubt but acceptable
- 6-7: Acceptable - small ambiguity but answer remains clear
- 4-5: Problematic - significant ambiguity, needs review
- 0-3: Rejected - major ambiguity, multiple possible answers

RULES:
- hasIssues = true if ambiguityScore < 7
- severity "critical" if the question must be rejected
- severity "major" if the question must be rephrased
- severity "minor" if the question can be accepted with a note

No markdown. JSON only.`;

/**
 * Type definitions for ambiguity check results
 */
export interface AmbiguityIssue {
  type: 'synonym' | 'multiple_answers' | 'wrong_option_correct' | 'unclear_question' | 'factual_error' | 'qa_incoherence';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  evidence: string;
}

export interface AmbiguityCheckResult {
  hasIssues: boolean;
  ambiguityScore: number;
  issues: AmbiguityIssue[];
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Builds the ambiguity check prompt with question data.
 *
 * @param question - The question text
 * @param correctAnswer - The correct answer
 * @param wrongAnswers - Array of wrong answer options
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildAmbiguityCheckPrompt(
  question: string,
  correctAnswer: string,
  wrongAnswers: string[],
  anecdote?: string
): string {
  return AMBIGUITY_CHECK_PROMPT
    .replace('{QUESTION}', question)
    .replace('{CORRECT_ANSWER}', correctAnswer)
    .replace('{WRONG_ANSWERS}', JSON.stringify(wrongAnswers))
    .replace('{ANECDOTE}', anecdote || 'None');
}

// ============================================================================
// MYTH DETECTION PROMPT - Dedicated check for urban legends
// ============================================================================

/**
 * Prompt for detecting myths and urban legends in questions.
 * This is a dedicated check that runs to ensure no popular myths
 * are presented as facts in the game.
 *
 * {QUESTION} - The question text
 * {ANSWER} - The proposed answer
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const MYTH_DETECTION_PROMPT = `You are a MYTH and URBAN LEGEND detector.

QUESTION TO VERIFY:
{QUESTION}
PROPOSED ANSWER: {ANSWER}
ANECDOTE: {ANECDOTE}

INSTRUCTIONS:
1. USE webSearch to verify if this claim is a KNOWN MYTH
2. Search: "[subject] myth", "[subject] actually false", "[subject] legend debunked"
3. Check if fact-checking sites (Snopes, Wikipedia, etc.) have debunked this fact

CRITICAL QUESTIONS:
- Is this an URBAN LEGEND presented as fact?
- Is the phrasing too categorical for a disputed fact?
- Is an important nuance omitted (wanted to do vs did)?
- Is the claim "too good/surprising to be true"?

COMMON MYTHS TO DETECT (examples):
- Caligula and his horse consul (never done, only considered)
- Einstein bad at math (false, he excelled)
- 10% of brain used (total myth)
- Vikings with horned helmets (19th century invention)
- Newton and the apple (unproven anecdote)

RESPOND in JSON:
{
  "isMyth": true | false,
  "mythType": "urban_legend" | "exaggeration" | "misattribution" | "oversimplification" | null,
  "reality": "What really happened (if myth)",
  "sources": ["Verification URLs"],
  "suggestedReformulation": "How to correctly rephrase (if myth)",
  "confidence": 0-100
}

RULES:
- isMyth = true → question must be REJECTED or REPHRASED
- confidence 95-100: certain myth, well documented
- confidence 70-94: probable myth, contradictory sources
- confidence < 70: doubt, additional verification needed

No markdown. JSON only.`;

/**
 * Type definitions for myth detection results
 */
export interface MythDetectionResult {
  isMyth: boolean;
  mythType: 'urban_legend' | 'exaggeration' | 'misattribution' | 'oversimplification' | null;
  reality: string | null;
  sources: string[];
  suggestedReformulation: string | null;
  confidence: number;
}

/**
 * Builds the myth detection prompt with question data.
 *
 * @param question - The question text
 * @param answer - The proposed answer
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildMythDetectionPrompt(
  question: string,
  answer: string,
  anecdote?: string
): string {
  return MYTH_DETECTION_PROMPT
    .replace('{QUESTION}', question)
    .replace('{ANSWER}', answer)
    .replace('{ANECDOTE}', anecdote || 'None');
}
