/**
 * French Phase 4 (La Note) Prompts
 * MCQ Race - Culture Générale classique
 */

export const PHASE4_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "La Note".
Génère 10 questions de culture générale en format QCM.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- Course de rapidité : tous les joueurs répondent en même temps
- Premier à répondre CORRECTEMENT gagne 2 points
- Questions style quiz TV (Questions pour un Champion, QPUC)

FORMAT QCM :
- Exactement 4 options de réponse
- UNE SEULE réponse correcte
- Les 3 distracteurs doivent être PLAUSIBLES

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER chaque réponse
- Les réponses doivent être indiscutables

JSON Format (STRICTEMENT ce format) :
[
  {
    "question": "Question claire et directe ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant optionnel"
  }
]

10 questions exactement. Pas de markdown.`;

export const PHASE4_GENERATOR_PROMPT = `Tu es un expert en quiz culture générale pour "Burger Quiz" (phase "La Note").

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT DE LA PHASE "LA NOTE" (COURSE MCQ) :
- Tous les joueurs voient la question en même temps
- Premier joueur à répondre CORRECTEMENT gagne 2 points
- Timer de 30 secondes par question
- Questions de culture générale style TV quiz

GÉNÈRE 10 QUESTIONS en format QCM.

=== RÈGLES DE DIFFICULTÉ ===

Répartition obligatoire :
- 3 questions FACILES : Connu de 80% des gens (capitales, faits basiques)
- 4 questions MOYENNES : Connu de 50% des gens (culture générale classique)
- 3 questions DIFFICILES : Connu de 20% des gens (pour départager)

=== FORMAT QCM STRICT ===

1. QUESTION :
   - Claire et directe (pas de piège de formulation)
   - Max 25 mots
   - Compréhension immédiate

2. OPTIONS (exactement 4) :
   - Une seule réponse correcte (correctIndex 0-3)
   - 3 distracteurs PLAUSIBLES du même registre
   - Longueur similaire entre options
   - Pas de "blague" évidente

✅ BON EXEMPLE :
{
  "question": "Quelle est la capitale de l'Australie ?",
  "options": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
  "correctIndex": 2,
  "anecdote": "Canberra a été construite spécialement pour être capitale !"
}

❌ MAUVAIS EXEMPLE :
{
  "question": "Quelle est la capitale de l'Australie ?",
  "options": ["Canberra", "Pizza", "42", "Le chat"],  // Distracteurs absurdes
  "correctIndex": 0
}

=== VARIÉTÉ THÉMATIQUE ===

Sur 10 questions, mélange obligatoire :
- 2-3 questions Histoire / Géographie
- 2-3 questions Sciences / Nature
- 2-3 questions Arts / Littérature / Musique
- 2-3 questions Sport / Actualité / Pop culture

=== ANECDOTE (OPTIONNEL) ===

- Fait amusant ou surprenant sur la bonne réponse
- Max 30 mots
- Ton ludique et informatif

=== EXACTITUDE FACTUELLE (CRITIQUE) ===

- UTILISE Google Search pour VÉRIFIER chaque réponse
- La réponse doit être INDISCUTABLE
- Pas d'ambiguïté : une seule réponse correcte

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
[
  {
    "question": "Question claire (max 25 mots) ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant (optionnel)"
  }
]

10 questions exactement. Pas de markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge STRICT pour "Burger Quiz" phase "La Note" (QCM).
Analyse ces questions et donne un feedback détaillé.

QUESTIONS PROPOSÉES :
{QUESTIONS}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. EXACTITUDE FACTUELLE (CRITIQUE) :
   - La bonne réponse est-elle VRAIE ?
   - UTILISE Google Search pour vérifier
   - UNE SEULE réponse possible par question

2. PLAUSIBILITÉ DES OPTIONS :
   - Les 4 options sont-elles du MÊME REGISTRE ?
   - Les distracteurs font-ils hésiter ?
   - Pas de réponse "blague" évidente

3. DIFFICULTÉ ÉQUILIBRÉE :
   - Mix de faciles (3), moyennes (4), difficiles (3) ?
   - Pas trop obscur (jouable par tous)

4. VARIÉTÉ THÉMATIQUE :
   - Mix de thèmes différents (histoire, géo, sciences, arts, sport) ?
   - Pas de répétition de thème

5. CLARTÉ :
   - Questions sans ambiguïté ?
   - Options de longueur similaire ?

6. QUALITÉ DES ANECDOTES :
   - Faits intéressants et vrais ?
   - Longueur appropriée (max 30 mots) ?

FORMAT JSON (STRICTEMENT) :
{
  "approved": true | false,
  "scores": {
    "factual_accuracy": 1-10,
    "option_plausibility": 1-10,
    "difficulty_balance": 1-10,
    "thematic_variety": 1-10,
    "clarity": 1-10,
    "anecdote_quality": 1-10
  },
  "overall_score": 1-10,
  "difficulty_distribution": {
    "easy": [0, 1, 2],
    "medium": [3, 4, 5, 6],
    "hard": [7, 8, 9]
  },
  "questions_feedback": [
    {
      "index": 0,
      "question": "La question",
      "correct_option": "La bonne réponse",
      "ok": true | false,
      "difficulty": "easy" | "medium" | "hard",
      "issues": ["factual_error" | "implausible_options" | "ambiguous" | "bad_anecdote"],
      "correction": "Correction si nécessaire"
    }
  ],
  "global_feedback": "Feedback général",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

CRITÈRES DE REJET (approved = false) :
- factual_accuracy < 7 (erreurs factuelles)
- option_plausibility < 6 (distracteurs mauvais)
- Plus de 3 questions avec issues

Pas de markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certaines questions Phase 4 "La Note" (QCM).

QUESTIONS À GARDER (indices non listés) :
{GOOD_QUESTIONS}

QUESTIONS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_QUESTIONS}

RAISONS DU REJET :
{REJECTION_REASONS}

RÈGLES POUR LES NOUVELLES QUESTIONS :

1. Culture générale style TV quiz
2. Exactement 4 options plausibles du même registre
3. UNE seule réponse correcte
4. Vérifie les faits avec Google Search
5. Anecdote optionnelle (max 30 mots)

GÉNÈRE UNIQUEMENT les {COUNT} questions de remplacement en JSON :
[
  {
    "question": "Nouvelle question ?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fait intéressant optionnel"
  }
]

{COUNT} questions exactement. Pas de markdown.`;
