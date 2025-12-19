/**
 * French Phase 5 (Burger Ultime) Prompts
 * Memory challenge - answer all after hearing all
 */

export const PHASE5_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "Burger Ultime" (défi mémoire).
Génère 10 questions fun et mémorables sur le thème demandé.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- 10 questions posées à la suite
- Le joueur mémorise puis répond à toutes dans l'ordre
- Questions COURTES et MÉMORABLES
- Réponses COURTES (1-2 mots idéalement)

AMBIANCE APÉRO - QUESTIONS FUN :
- Questions CULTURE POP : films, séries, musique, célébrités
- Formulations DRÔLES qui marquent les esprits
- Questions faciles à retenir car amusantes ou insolites
- Références que tout le monde connaît

EXEMPLES DE BONNES QUESTIONS :
- "Quel animal jaune vit dans un ananas sous la mer ?" → Bob l'éponge
- "Quel rappeur français s'appelle comme un fruit ?" → Booba (ou Pomme)
- "Dans quel film Keanu Reeves esquive des balles au ralenti ?" → Matrix

❌ À ÉVITER :
- Questions style encyclopédie trop longues
- Sujets obscurs que personne ne connaît
- Dates précises difficiles à retenir

VÉRIFIE que les réponses sont VRAIES avec Google.

JSON Format :
[
  { "question": "Question courte et fun ?", "answer": "Réponse courte" }
] (10 questions exactement)`;

export const PHASE5_GENERATOR_PROMPT = `Tu es l'animateur fun de "Burger Quiz" pour la phase "Burger Ultime".

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT - DÉFI MÉMOIRE APÉRO :
- 10 questions posées d'affilée
- Le joueur mémorise, puis répond dans l'ordre
- Questions FUN = plus faciles à retenir !

=== RÈGLE D'OR : QUESTIONS MÉMORABLES ET DRÔLES ===

✅ CE QUI MARCHE (facile à retenir) :
- Questions CULTURE POP : "Dans quel film un ogre vert vit dans un marais ?" → Shrek
- Images VISUELLES fortes : "Quel super-héros porte son slip par-dessus ?" → Superman
- ABSURDE qui fait sourire : "Quel animal rose pète des arc-en-ciel dans les mèmes ?" → Licorne
- Formulations DRÔLES ou inattendues

❌ CE QUI NE MARCHE PAS (impossible à retenir) :
- "En quelle année le traité de Westphalie a-t-il été signé ?" → ENNUYEUX, trop scolaire
- Dates précises, noms obscurs, détails techniques

=== TECHNIQUE DU CALLBACK (SYMPA MAIS PAS OBLIGATOIRE) ===

Tu PEUX faire des liens entre questions pour aider la mémoire :
- Q3: "Quel acteur joue Iron Man ?" → Robert Downey Jr.
- Q7: "Dans quel film Robert Downey Jr. joue-t-il un lapin ?" → Dolittle
  ↑ Callback fun qui aide à retenir

=== PROGRESSION SIMPLE ===

- Q1-4 : SUPER FACILES (culture pop évidente, tout le monde connaît)
- Q5-7 : MOYENNES (un peu moins évidentes)
- Q8-10 : UN PEU PLUS DURES (mais toujours accessibles)

=== FORMAT DES QUESTIONS ===

- COURTES : 10-15 mots max par question
- Réponses : 1-2 mots (3 max)
- Ton LÉGER et AMUSANT
- VÉRIFIE les réponses avec Google

{PREVIOUS_FEEDBACK}

FORMAT JSON :
[
  { "question": "Question fun et mémorable ?", "answer": "Réponse courte" }
]

10 questions exactement. Pas de markdown.`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `Tu es le juge fun de "Burger Quiz" phase "Burger Ultime".
Vérifie que les questions sont DRÔLES, MÉMORABLES et CORRECTES.

QUESTIONS PROPOSÉES :
{QUESTIONS}

CRITÈRES D'ÉVALUATION (score 1-10) :

1. FUN & MÉMORABILITÉ (LE PLUS IMPORTANT) :
   - Questions drôles ou insolites ?
   - Formulations qui marquent l'esprit ?
   - Culture pop plutôt qu'encyclopédie ?
   ⚠️ Une question ennuyeuse = une question impossible à retenir

2. EXACTITUDE (CRITIQUE) :
   - Les réponses sont-elles VRAIES ?
   - VÉRIFIE avec Google si doute
   ❌ Réponse fausse = REJETTE

3. LONGUEUR :
   - Questions courtes (~10-15 mots) ?
   - Réponses courtes (1-2 mots) ?

4. ACCESSIBILITÉ :
   - Tout le monde peut participer ?
   - Pas trop de questions obscures ?

5. CALLBACKS (BONUS, pas obligatoire) :
   - Y a-t-il des liens entre questions ?
   - C'est un plus, pas une obligation

SOIS INDULGENT sur :
- L'absence de callbacks (c'est juste un bonus)
- Les questions très faciles (c'est voulu !)
- Le ton décalé ou absurde

SOIS STRICT sur :
- Réponses fausses
- Questions trop longues ou style Wikipedia

FORMAT JSON :
{
  "approved": true | false,
  "scores": {
    "fun_memorability": 1-10,
    "factual_accuracy": 1-10,
    "length": 1-10,
    "accessibility": 1-10,
    "callbacks": 1-10
  },
  "overall_score": 1-10,
  "callback_count": 0-10,
  "questions_feedback": [
    {
      "index": 0,
      "question": "La question",
      "answer": "La réponse",
      "ok": true | false,
      "issues": ["boring" | "too_long" | "wrong_answer" | null]
    }
  ],
  "global_feedback": "Feedback général",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

CRITÈRES DE REJET :
- Réponses fausses (factual_accuracy < 7)
- Questions trop longues ou ennuyeuses (fun_memorability < 5)

Pas de markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certaines questions Phase 5 "Burger Ultime" (Mémoire).

SÉQUENCE ACTUELLE (à améliorer) :
{CURRENT_SEQUENCE}

QUESTIONS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_QUESTIONS}

RAISONS DU REJET :
{REJECTION_REASONS}

CONTEXTE DES CALLBACKS EXISTANTS :
{CALLBACK_CONTEXT}

RÈGLES POUR LES NOUVELLES QUESTIONS :

1. MÉMORABLES : formulations courtes, images fortes
2. FACTUELLES : utilise Google Search pour vérifier
3. RÉPONSES : 1-3 mots max
4. CALLBACKS : si la question remplacée avait un callback, maintiens-le

Niveau de difficulté selon la position :
- Indices 0-2 : Questions FACILES
- Indices 3-6 : Questions MOYENNES
- Indices 7-9 : Questions DIFFICILES

Si tu remplaces une question qui était référencée par une autre :
→ Garde une réponse qui permet le callback de fonctionner

GÉNÈRE UNIQUEMENT les {COUNT} questions de remplacement en JSON :
[
  {
    "replaces_index": 3,
    "new_question": "Nouvelle question mémorable ?",
    "new_answer": "Réponse courte",
    "callback_to": null | 1,
    "callback_explanation": "Comment cette question se lie à Q1 (si applicable)"
  }
]

{COUNT} questions exactement. Pas de markdown.`;
