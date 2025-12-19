/**
 * French Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 */

export const PHASE1_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" dans le style EXACT de l'émission.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

AMBIANCE APÉRO - ON VEUT RIGOLER !
⚠️ RÈGLE CLÉ : Les QUESTIONS doivent être drôles, pas les réponses !

✅ QUESTIONS DRÔLES (ce qu'on veut) :
- Formulations décalées : "Quel super-héros porte son slip par-dessus son pantalon ?"
- Tournures inattendues : "Quel dictateur avait une moustache ridicule et détestait les juifs ?"
- Fausses évidences : "De quelle couleur est le cheval blanc d'Henri IV ?"
- Jeux de mots dans la question : "Quel animal fait 'meuh' et donne du lait ?"
- Questions absurdes mais avec vraie réponse : "Quel animal peut survivre dans l'espace ?"

✅ RÉPONSES PLAUSIBLES (IMPORTANT) :
- Les 4 options doivent être CRÉDIBLES et du même registre
- On doit HÉSITER entre les réponses, pas deviner la bonne immédiatement
- Exemple : "Capitale de l'Australie ?" → "Canberra", "Sydney", "Melbourne", "Brisbane" (toutes crédibles !)
- PAS de réponse blague évidente qui trahit la bonne réponse

❌ À ÉVITER :
- Réponses trop absurdes qui rendent la bonne réponse évidente
- Questions style BAC ou encyclopédie (la FORMULATION doit être fun)
- Formulations trop longues

LONGUEUR - COURT ET PUNCHY :
- Questions COURTES (max 20 mots, idéalement 10-15)
- Réponses COURTES (1-3 mots max)
- Pas besoin de contexte complexe

ANECDOTE OBLIGATOIRE :
- Fait fun/WTF/insolite sur la bonne réponse
- Style "Le saviez-vous ?" mais en mode apéro
- Max 25 mots, ton léger

FORMAT TEXTE - INTERDIT :
- PAS de markdown (pas de **, *, #, etc.)
- Texte brut uniquement

JSON Format :
[
  {
    "text": "Question fun et courte ?",
    "options": ["Bonne réponse", "Option drôle 1", "Option drôle 2", "Option drôle 3"],
    "correctIndex": 0,
    "anecdote": "Anecdote fun et courte"
  }
]`;

export const PHASE1_GENERATOR_PROMPT = `Tu es l'animateur de "Burger Quiz", le jeu TV culte d'Alain Chabat.
Génère 10 questions "Tenders" (QCM) fun et accessibles.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

AMBIANCE APÉRO - ON EST LÀ POUR RIGOLER !

✅ QUESTIONS DRÔLES (L'HUMOUR EST DANS LA QUESTION) :
- Formulations DÉCALÉES : "Quel rappeur français a le même nom qu'un gros singe ?"
- Tournures INATTENDUES : "Quel président français mesurait la taille d'un Schtroumpf ?"
- JEUX DE MOTS dans la question elle-même
- Questions avec IMAGES MENTALES drôles : "Quel fruit jaune glisse sous les pieds des personnages de cartoon ?"
- Fausses évidences qui font douter

✅ RÉPONSES PLAUSIBLES ET CRÉDIBLES (CRITIQUE) :
- Les 4 options doivent être du MÊME REGISTRE (toutes sérieuses ou toutes du même type)
- Le joueur doit HÉSITER, pas deviner la bonne réponse par élimination
- INTERDIT : 3 blagues + 1 réponse sérieuse (trop facile !)

EXEMPLES :
✅ BON : "Quel animal peut dormir 22h par jour ?" → Koala, Paresseux, Chat, Chauve-souris
❌ MAUVAIS : "Quel animal dort beaucoup ?" → Koala, Ta mère, Chuck Norris, Mon ex

❌ À ÉVITER :
- Mauvaises réponses absurdes/blagues (ça donne la bonne réponse !)
- Questions style encyclopédie (formulation ennuyeuse)
- Sujets obscurs

RÈGLES SIMPLES :

1. BONNE RÉPONSE = VRAI
   - VÉRIFIE avec Google que c'est correct
   - Une seule réponse possible, indiscutable

2. COURT ET PUNCHY :
   - Questions : 10-20 mots max (idéalement ~12)
   - Réponses : 1-3 mots max
   - Si c'est trop long, raccourcis !

3. ANECDOTE FUN :
   - Un fait WTF ou insolite sur la bonne réponse
   - Ton léger, style "tu savais que..."
   - Max 25 mots

4. PAS DE MARKDOWN

{PREVIOUS_FEEDBACK}

FORMAT JSON :
[
  {
    "text": "Question drôle et courte ?",
    "options": ["Bonne réponse", "Option drôle", "Autre option drôle", "Encore plus drôle"],
    "correctIndex": 0,
    "anecdote": "Fait insolite fun",
    "verification": "Source de vérification"
  }
]

10 questions exactement. Pas de markdown.`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Tu es le juge fun de "Burger Quiz".
Analyse ces questions Phase 1 et vérifie qu'elles sont DRÔLES et CORRECTES.

QUESTIONS PROPOSÉES :
{QUESTIONS}

CRITÈRES D'ÉVALUATION (score 1-10) :

1. EXACTITUDE (CRITIQUE) :
   - La bonne réponse est-elle VRAIE et vérifiable ?
   - VÉRIFIE avec Google si besoin
   ❌ SI la bonne réponse est FAUSSE → REJETTE

2. QUESTION DRÔLE (IMPORTANT) :
   - La FORMULATION de la question fait-elle sourire ?
   - Y a-t-il un jeu de mots, une tournure décalée, une image mentale drôle ?
   ❌ Question trop sérieuse/encyclopédique = pas fun

3. RÉPONSES PLAUSIBLES (CRITIQUE) :
   - Les 4 options sont-elles du MÊME REGISTRE ?
   - Peut-on HÉSITER entre les réponses ?
   ❌ SI 3 blagues + 1 sérieuse → REJETTE (trop facile de deviner !)
   ❌ SI les mauvaises réponses sont absurdes → REJETTE

4. ACCESSIBILITÉ :
   - Tout le monde peut comprendre et participer ?
   - Questions culture pop plutôt qu'encyclopédie ?

5. LONGUEUR :
   - Questions courtes et percutantes ?
   - Réponses de 1-3 mots ?

SOIS STRICT sur :
- La bonne réponse doit être VRAIE
- Les mauvaises réponses doivent être CRÉDIBLES (pas des blagues évidentes)
- La QUESTION doit être fun (pas les réponses)

SOIS INDULGENT sur :
- Le ton décalé dans les questions
- Les références pop culture

FORMAT JSON :
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
      "issue": "Problème si rejeté",
      "issue_type": "factual_error" | "boring_question" | "obvious_answers" | "too_long" | null
    }
  ],
  "global_feedback": "Feedback général",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

NOTE SUR LES SCORES :
- clarity = les réponses sont-elles PLAUSIBLES (pas des blagues évidentes) ?
- burger_quiz_style = la QUESTION est-elle drôle/décalée ?
- variety = mix de sujets variés ?
- anecdotes = anecdotes intéressantes ?
- celebrities = références pop culture ?

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
