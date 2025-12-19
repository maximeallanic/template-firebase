/**
 * French Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 */

export const PHASE1_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" dans le style EXACT de l'émission.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

STYLE BURGER QUIZ - HUMOUR DANS LA FORME, PAS LE FOND :
⚠️ RÈGLE CLÉ : La FORMULATION doit être drôle, mais le CONTENU doit être sérieux et vérifiable.

✅ FORME HUMORISTIQUE (ce qu'il faut faire) :
- Formulations trompeuses ou inattendues ("Quel est le prénom du Père Noël ?")
- Tournures décalées et surprenantes pour poser des questions classiques
- Fausses évidences qui font douter par la façon de demander
- Jeux de mots dans la formulation de la question
- Questions qui semblent faciles mais la formulation piège

❌ PAS D'HUMOUR SUR LE FOND :
- Les RÉPONSES doivent être des FAITS réels et vérifiables
- Pas de questions sur des sujets inventés ou absurdes
- Le sujet lui-même doit être sérieux (culture, histoire, science, etc.)
- Les 4 options de réponse doivent être des choses réelles

LONGUEUR DES QUESTIONS - TRÈS VARIÉ (OBLIGATOIRE) :
Tu DOIS alterner entre différentes longueurs pour garder le rythme dynamique :
- 3-4 questions TRÈS COURTES (5-10 mots) : "Capitale de la France ?" / "Couleur du ciel ?"
- 3-4 questions COURTES (12-18 mots) : "Quel animal est le symbole de la République française ?"
- 2-3 questions MOYENNES (20-30 mots) : questions avec contexte ou mise en situation
- Maximum 35 mots par question, jamais plus
- Les réponses doivent être courtes (1-3 mots max)

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER que chaque bonne réponse est 100% factuelle
- Ne génère JAMAIS de question avec une réponse douteuse ou approximative
- Les 3 mauvaises réponses doivent être plausibles mais fausses

ANECDOTE OBLIGATOIRE :
- Ajoute une anecdote fun/surprenante/WTF sur la bonne réponse
- L'anecdote doit être COURTE (1-2 phrases, max 30 mots)
- Doit être lisible rapidement à l'écran

FORMAT TEXTE - INTERDIT :
- PAS de markdown (pas de **, *, #, etc.)
- PAS de caractères spéciaux inutiles
- Texte brut uniquement, lisible directement à l'écran

JSON Format (STRICTEMENT ce format, texte brut sans markdown) :
[
  {
    "text": "Question style Burger Quiz en français...",
    "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse"
  }
]`;

export const PHASE1_GENERATOR_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" (QCM) dans le style EXACT de l'émission.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

STYLE BURGER QUIZ - HUMOUR DANS LA FORME, PAS LE FOND :
⚠️ RÈGLE CLÉ : La FORMULATION doit être drôle, mais le CONTENU doit être sérieux et vérifiable.

✅ FORME HUMORISTIQUE (ce qu'il faut faire) :
- Formulations trompeuses ou inattendues ("Quel est le prénom du Père Noël ?")
- Tournures décalées et surprenantes pour poser des questions classiques
- Fausses évidences qui font douter par la façon de demander
- Jeux de mots dans la formulation de la question
- Questions qui semblent faciles mais la formulation piège

❌ PAS D'HUMOUR SUR LE FOND :
- Les RÉPONSES doivent être des FAITS réels et vérifiables
- Pas de questions sur des sujets inventés ou absurdes
- Le sujet lui-même doit être sérieux (culture, histoire, science, etc.)
- Les 4 options de réponse doivent être des choses réelles

RÈGLES CRITIQUES :

1. RÉPONSE VÉRIFIABLE (CRITIQUE) :
   - CHAQUE réponse doit être un FAIT 100% vérifiable
   - UTILISE Google Search pour vérifier AVANT de proposer
   - Si tu as le moindre doute → NE PROPOSE PAS cette question

   ✅ BONS exemples de questions vérifiables :
   - "Quelle est la capitale de l'Australie ?" → Canberra (fait vérifiable)
   - "Qui a peint la Joconde ?" → Léonard de Vinci (fait vérifiable)
   - "En quelle année est sorti le premier iPhone ?" → 2007 (fait vérifiable)

   ❌ MAUVAIS exemples (ÉVITER) :
   - Questions d'opinion ("Quel est le meilleur film ?")
   - Questions avec réponses débattues ou approximatives
   - Questions où la réponse dépend de l'interprétation

2. UNE SEULE RÉPONSE POSSIBLE (CRITIQUE) :
   - La question doit avoir UNE SEULE réponse correcte, INDISCUTABLE
   - Les 3 mauvaises réponses doivent être CLAIREMENT fausses
   - TEST : Si quelqu'un pouvait argumenter qu'une autre réponse est valide → CHANGE LA QUESTION

3. LONGUEUR DES QUESTIONS - TRÈS VARIÉ :
   - 3-4 questions TRÈS COURTES (5-10 mots)
   - 3-4 questions COURTES (12-18 mots)
   - 2-3 questions MOYENNES (20-30 mots max)
   - Les réponses doivent être courtes (1-3 mots max)

4. ANECDOTE OBLIGATOIRE :
   - Ajoute une anecdote fun/surprenante/WTF sur la bonne réponse
   - L'anecdote doit être VRAIE et vérifiable
   - Maximum 30 mots

5. PAS DE MARKDOWN :
   - Texte brut uniquement
   - Pas de **, *, #, etc.

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
[
  {
    "text": "Question style Burger Quiz en français ?",
    "options": ["Bonne réponse", "Mauvaise 1", "Mauvaise 2", "Mauvaise 3"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse",
    "verification": "Comment j'ai vérifié cette réponse"
  }
]

10 questions exactement. Pas de markdown.`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge strict pour "Burger Quiz".
Analyse ces questions Phase 1 (Tenders/QCM) et donne un feedback détaillé.

QUESTIONS PROPOSÉES :
{QUESTIONS}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. EXACTITUDE FACTUELLE (CRITIQUE) :
   - UTILISE Google Search pour vérifier CHAQUE réponse
   - La bonne réponse est-elle 100% correcte et vérifiable ?
   - Les 3 mauvaises réponses sont-elles clairement fausses ?

   ✅ Score 9-10 : Toutes les réponses vérifiées, 100% exactes
   ❌ Score 1-5 : Une ou plusieurs réponses douteuses/fausses

   ❌ SI SCORE < 7 → REJETTE IMMÉDIATEMENT (on ne peut pas avoir de fausses réponses)

2. CLARTÉ / NON-AMBIGUÏTÉ (CRITIQUE) :
   - Chaque question a-t-elle UNE SEULE réponse possible ?
   - La formulation est-elle claire et sans équivoque ?
   - TEST : Quelqu'un pourrait-il argumenter qu'une autre option est valide ?

   ✅ Score 9-10 : Questions claires, une seule réponse possible
   ⚠️ Score 6-8 : Formulation un peu vague mais acceptable
   ❌ Score 1-5 : Questions ambiguës ou plusieurs réponses possibles

   ❌ SI SCORE < 6 → REJETTE (les questions ambiguës créent des disputes)

3. STYLE BURGER QUIZ (HUMOUR DANS LA FORME) :
   - La FORMULATION est-elle drôle, décalée, ou piège ?
   - Le CONTENU reste-t-il sérieux et factuel ?
   - Évite-t-on le style trop scolaire dans la façon de poser la question ?

   ✅ Score 9-10 : Formulation Burger Quiz parfaite (drôle) + contenu sérieux
   ⚠️ Score 6-8 : Formulation acceptable, contenu OK
   ❌ Score 1-5 : Formulation trop scolaire OU contenu absurde/inventé

4. VARIÉTÉ LONGUEUR :
   - Y a-t-il un mix de questions courtes/moyennes/longues ?
   - Les réponses sont-elles courtes (1-3 mots) ?

5. ANECDOTES :
   - Les anecdotes sont-elles vraies et vérifiables ?
   - Apportent-elles quelque chose d'intéressant/surprenant ?

6. CÉLÉBRITÉS / CULTURE POP :
   - Y a-t-il des références à des personnalités connues ?
   - Y a-t-il des questions sur l'actualité ou la culture populaire ?

Pour chaque question problématique, explique PRÉCISÉMENT pourquoi elle pose problème.

FORMAT JSON (STRICTEMENT) :
{
  "approved": true | false,
  "scores": {
    "factual_accuracy": 1-10,
    "clarity": 1-10,
    "burger_quiz_style": 1-10,
    "variety": 1-10,
    "anecdotes": 1-10,
    "celebrities": 1-10
  },
  "overall_score": 1-10,
  "questions_feedback": [
    {
      "index": 0,
      "text": "La question",
      "ok": true | false,
      "issue": "Description du problème si rejeté",
      "issue_type": "factual_error" | "ambiguous" | "boring" | "too_long" | "bad_anecdote" | null
    }
  ],
  "global_feedback": "Feedback général pour amélioration",
  "suggestions": ["Suggestion concrète 1", "Suggestion concrète 2"]
}

Pas de markdown.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certaines questions Phase 1 "Tenders" qui ont été rejetées.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

QUESTIONS À GARDER (NE PAS TOUCHER) :
{GOOD_QUESTIONS}

QUESTIONS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_QUESTIONS}

RAISONS DU REJET :
{REJECTION_REASONS}

INSTRUCTIONS :
- Génère EXACTEMENT {COUNT} nouvelles questions pour remplacer celles rejetées
- HUMOUR DANS LA FORME : formulations drôles, décalées, pièges
- SÉRIEUX DANS LE FOND : contenu factuel et vérifiable
- VÉRIFIE les faits avec Google Search
- Ajoute une anecdote pour chaque question
- Les réponses doivent être 100% vérifiables et INDISCUTABLES
- NE RÉPÈTE PAS les erreurs des questions rejetées

JSON Format (STRICTEMENT ce format) :
[
  {
    "text": "Question style Burger Quiz en français ?",
    "options": ["Bonne réponse", "Mauvaise 1", "Mauvaise 2", "Mauvaise 3"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse"
  }
]

{COUNT} questions exactement. Pas de markdown.`;

export const REVIEW_PHASE1_PROMPT = `Analyse ces questions Phase 1 (Tenders/MCQ) :

{QUESTIONS}

Pour CHAQUE question, vérifie ces critères (DANS L'ORDRE) :

1. RÉPONSE CORRECTE (CRITIQUE) :
   - UTILISE Google Search pour vérifier que la bonne réponse est 100% factuelle
   - Si tu as le moindre doute → REJET
   - Les 3 mauvaises réponses doivent être clairement fausses

2. QUESTION SANS AMBIGUÏTÉ (CRITIQUE) :
   - La question doit avoir UNE SEULE réponse possible
   - Pas de formulation vague ou interprétable
   - Pas de "peut-être" ou "généralement"
   - Si plusieurs réponses pourraient être valides → REJET

3. STYLE BURGER QUIZ (HUMOUR DANS LA FORME) :
   - La FORMULATION doit être drôle, décalée, ou piège
   - Le CONTENU doit rester sérieux et factuel
   - PAS de formulation académique/style Wikipedia
   - Si formulation trop scolaire OU contenu inventé → REJET

4. ANECDOTE :
   - Doit être vraie et vérifiable
   - Doit apporter quelque chose d'intéressant

Retourne un JSON :
{
  "reviews": [
    {
      "index": 0,
      "status": "approved" | "rejected",
      "reason": "Raison si rejeté (sinon null)",
      "issue": "answer_wrong" | "ambiguous" | "style" | "anecdote" | null
    }
  ],
  "summary": {
    "approved": 8,
    "rejected": 2,
    "rejectedIndices": [3, 7]
  }
}`;

export const REGENERATE_PHASE1_PROMPT = `Tu dois régénérer {COUNT} question(s) pour remplacer celles qui ont été rejetées.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

Questions rejetées et raisons :
{REJECTED_REASONS}

INSTRUCTIONS :
- Génère EXACTEMENT {COUNT} nouvelles questions
- Corrige les problèmes mentionnés
- HUMOUR DANS LA FORME : formulations drôles, décalées, pièges
- SÉRIEUX DANS LE FOND : contenu factuel et vérifiable
- Vérifie les faits avec Google Search
- Ajoute une anecdote pour chaque question

JSON Format (STRICTEMENT ce format) :
[
  {
    "text": "Question style Burger Quiz en français...",
    "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant court sur la bonne réponse"
  }
]`;
