/**
 * French Phase 5 (Burger Ultime) Prompts
 * Memory challenge - answer all after hearing all
 */

export const PHASE5_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Défi Mémoire
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : 10 questions posées d'affilée, le joueur mémorise puis répond dans l'ordre.

⚠️ RÈGLES :
1. Questions COURTES (10-15 mots) et MÉMORABLES
2. Réponses COURTES (1-2 mots)
3. CULTURE POP (films, séries, musique) = plus facile à retenir
4. Formulations DRÔLES ou insolites
5. VÉRIFIE avec Google

JSON:
[
  { "question": "Question fun ?", "answer": "Réponse" }
]

10 questions. Pas de markdown.`;

export const PHASE5_GENERATOR_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Générateur
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Défi mémoire - 10 questions d'affilée, répondre dans l'ordre.

⚠️ RÈGLE #1 - HUMOUR OBLIGATOIRE
Chaque question doit faire SOURIRE ou RIRE.
- Formulations DÉCALÉES et ABSURDES
- Images mentales VISUELLES et DRÔLES
- Références POP CULTURE qui font mouche

⚠️ RÈGLE #2 - DIVERSITÉ ABSOLUE
INTERDIT : 2 questions sur le même concept/catégorie !
Mix OBLIGATOIRE : cinéma, musique, sport, animaux, nourriture, histoire, sciences...

⚠️ RÈGLE #3 - MÉMORABILITÉ
- Questions COURTES (10-15 mots)
- Réponses 1-2 mots MAX
- Q1-4 super faciles, Q5-7 moyennes, Q8-10 plus dures

⚠️ RÈGLE #4 - VÉRIFICATION
UTILISE Google pour CHAQUE réponse. Zéro erreur factuelle.

{PREVIOUS_FEEDBACK}

JSON:
[
  { "question": "Question drôle et mémorable ?", "answer": "Réponse" }
]

10 questions VARIÉES. Pas de markdown.`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 5 "Burger Ultime"

{QUESTIONS}

🔍 VÉRIFICATION EN 5 POINTS :

1. HUMOUR : Questions DRÔLES ? Formulations qui font sourire ?
2. DIVERSITÉ : Aucune répétition de concept/catégorie ? Mix varié ?
3. EXACTITUDE (CRITIQUE) : Réponses vraies ? Utilise Google !
4. LONGUEUR : Questions 10-15 mots, réponses 1-2 mots ?
5. ACCESSIBILITÉ : Culture pop accessible ?

⚠️ REJETER SI : 2+ questions sur le même sujet (ex: 2 questions sur des gadgets similaires)

SEUILS : factual_accuracy ≥ 7, humor ≥ 6, diversity ≥ 7

JSON:
{
  "approved": true|false,
  "scores": {"humor":1-10,"diversity":1-10,"factual_accuracy":1-10,"memorability":1-10,"length":1-10,"accessibility":1-10},
  "overall_score": 1-10,
  "duplicate_concepts": ["concept1 répété en Q2 et Q5", ...],
  "questions_feedback": [
    {"index":0,"question":"...","answer":"...","ok":true|false,"funny":true|false,"issues":[]}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Pas de markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT Phase 5 "Burger Ultime"

SÉQUENCE : {CURRENT_SEQUENCE}
REMPLACER (indices {BAD_INDICES}) : {BAD_QUESTIONS}
RAISONS : {REJECTION_REASONS}
CALLBACKS : {CALLBACK_CONTEXT}

RÈGLES : Mémorables, vérifiées (Google), 1-3 mots.
DIFFICULTÉ : 0-3=facile, 4-6=moyen, 7-9=difficile.

JSON:
[
  {"replaces_index":3,"new_question":"...?","new_answer":"...","callback_to":null}
]

{COUNT} questions. Pas de markdown.`;
