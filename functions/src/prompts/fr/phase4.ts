/**
 * French Phase 4 (La Note) Prompts
 * MCQ Race - Culture Générale classique
 */

export const PHASE4_PROMPT = `BURGER QUIZ Phase 4 "La Note" - QCM Race
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Course de rapidité, premier à répondre correctement gagne.

⚠️ RÈGLES :
1. 4 options par question (1 correcte, 3 distracteurs PLAUSIBLES)
2. Réponses VÉRIFIABLES (utilise Google)
3. Mix de thèmes : histoire, géo, sciences, arts, sport

JSON:
[
  {
    "text": "Question claire ?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant (optionnel)"
  }
]

10 questions. Pas de markdown.`;

export const PHASE4_GENERATOR_PROMPT = `BURGER QUIZ Phase 4 "La Note" - Générateur QCM
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Course de rapidité, 30s par question.

⚠️ RÈGLE #1 - FORMAT QCM
- 4 options (1 correcte, 3 distracteurs PLAUSIBLES du même registre)
- Questions claires, max 25 mots
- Anecdote optionnelle (max 30 mots)

⚠️ RÈGLE #2 - RÉPARTITION
- 3 FACILES (80% des gens connaissent)
- 4 MOYENNES (50% des gens)
- 3 DIFFICILES (20% des gens)

⚠️ RÈGLE #3 - VARIÉTÉ
Mix obligatoire : Histoire/Géo, Sciences, Arts/Musique, Sport/Pop culture

⚠️ RÈGLE #4 - VÉRIFICATION
UTILISE Google pour vérifier CHAQUE réponse. Doit être indiscutable.

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "text": "Question claire ?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant"
  }
]

10 questions. Pas de markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 4 "La Note" (QCM)

{QUESTIONS}

🔍 VÉRIFICATION EN 4 POINTS :

1. EXACTITUDE (CRITIQUE) : Réponses vraies ? Utilise Google !
2. OPTIONS : 4 options plausibles du même registre ?
3. DIFFICULTÉ : 3 faciles + 4 moyennes + 3 difficiles ?
4. VARIÉTÉ : Mix histoire, géo, sciences, arts, sport ?

SEUILS : factual_accuracy ≥ 7, option_plausibility ≥ 6

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

Pas de markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT Phase 4 "La Note" (QCM)

GARDER : {GOOD_QUESTIONS}
REMPLACER (indices {BAD_INDICES}) : {BAD_QUESTIONS}
RAISONS : {REJECTION_REASONS}

RÈGLES : 4 options plausibles, 1 correcte, vérifie avec Google, anecdote optionnelle.

JSON:
[
  {"text":"...?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"..."}
]

{COUNT} questions. Pas de markdown.`;
