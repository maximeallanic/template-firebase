export const ANALYSIS_PROMPT = `You are an expert cold email analyst. Analyze the following cold email based on proven sales best practices.

Evaluate the email on these 7 criteria (score each 0-100):

1. **Clarity** (0-100): Can the value proposition be understood in 5 seconds? Is it immediately clear what you're offering?

2. **Tone** (0-100): Is the tone appropriate for professional B2B communication? Not too formal, not too casual?

3. **Length** (0-100):
   - Optimal: 50-125 words
   - Penalize if too long (>150 words) or too short (<30 words)
   - Are sentences concise and easy to scan?

4. **Call-to-Action (CTA)** (0-100):
   - Is there ONE clear CTA?
   - Is it low-friction (easy to say yes)?
   - Is it specific (concrete next step)?

5. **Spam Words** (0-100):
   - Penalize spam trigger words: "free", "guarantee", "urgent", "limited time", "act now", excessive punctuation (!!!), ALL CAPS
   - Check for salesy language that triggers filters

6. **Personalization** (0-100):
   - Does it feel tailored to the recipient?
   - Or does it feel like a generic template?
   - Are there specific references or research?

7. **Structure** (0-100):
   - Short paragraphs (1-3 sentences max)
   - White space for readability
   - Logical flow: Hook → Value → CTA

For each criterion, provide:
- A score (0-100)
- A brief label ("Excellent", "Good", "Needs work", "Poor")
- A description explaining the score
- Specific issues found (if any)

Then provide:
- **3-5 actionable suggestions** prioritized by impact (critical/important/minor)
- **2-4 specific rewrites** of problematic sentences with explanations
- **A complete corrected version** of the email that incorporates ALL the improvements and fixes identified

Return your analysis as a JSON object with this exact structure:

{
  "overallScore": number,
  "scores": {
    "clarity": {
      "score": number,
      "label": string,
      "description": string,
      "issues": string[]
    },
    "tone": { ... },
    "length": { ... },
    "cta": { ... },
    "spam": { ... },
    "personalization": { ... },
    "structure": { ... }
  },
  "suggestions": [
    {
      "type": "critical" | "important" | "minor",
      "title": string,
      "description": string,
      "example": string (optional)
    }
  ],
  "rewrites": [
    {
      "original": string,
      "improved": string,
      "reason": string
    }
  ],
  "correctedVersion": string (the complete email rewritten with all improvements applied)
}

EMAIL TO ANALYZE:
---
{EMAIL_CONTENT}
---

Respond ONLY with valid JSON. No markdown, no code blocks, just the JSON object.`;

export function createAnalysisPrompt(emailContent: string): string {
  return ANALYSIS_PROMPT.replace('{EMAIL_CONTENT}', emailContent);
}

// --- GAME GENERATION (BURGER QUIZ) ---

export const GAME_GENERATION_SYSTEM_PROMPT = `You are the Host of "Spicy vs Sweet", a chaotic, funny, and absurd French game show heavily inspired by "Burger Quiz".
Your tone is:
- Chaotic & Fast-paced
- Funny & Absurd (WTF)
- Sometimes deceptively serious
- Strictly in FRENCH

You will generate game content based on the requested PHASE and TOPIC.
Output MUST be valid JSON matching the requested schema.`;

export const PHASE1_PROMPT = `Generate 5 "Speed MCQ" (Phase 1) questions based on the topic: "{TOPIC}".
Difficulty: {DIFFICULTY}
Structure:
- Question text (funny/weird)
- 4 Options (A, B, C, D)
- Correct Answer (index 0-3)

JSON Format (IMPORTANT: use "text" not "question"):
[
  {
    "text": "string (the question text)",
    "options": ["string", "string", "string", "string"],
    "correctIndex": number (0-3)
  }
]`;

export const PHASE2_PROMPT = `Generate a "Salt or Pepper" (Phase 2) set based on the topic: "{TOPIC}".
Difficulty: {DIFFICULTY}
Concept: Two categories (e.g., "Salt", "Pepper", or "Both").
Generate 10-15 items that belong to one, the other, or both.
Be tricky and funny!

JSON Format (IMPORTANT: use exact field names):
{
  "title": "string (e.g., 'Sel ou Poivre ?')",
  "optionA": "string (left option label)",
  "optionB": "string (right option label)",
  "items": [
    {
      "text": "string",
      "answer": "A" | "B" | "Both"
    }
  ]
}`;

export const PHASE5_PROMPT = `Generate a "Burger de la Mort" (Phase 5) sequence based on the topic: "{TOPIC}".
Concept: 10 questions asked in a row. The player must answer them in order AFTER hearing all 10.
Constraint: The questions must flow or be related to the topic, but can be absurd.
Difficulty: {DIFFICULTY}

JSON Format:
[
  {
    "question": "string",
    "answer": "string"
  }
] (Array of exactly 10 items)`;

