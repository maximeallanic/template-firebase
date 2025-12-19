/**
 * French Phase 5 (Burger Ultime) Prompts
 * Memory challenge - answer all after hearing all
 */

export const PHASE5_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "Burger Ultime" (défi mémoire).
Génère une séquence de 10 questions sur le thème demandé.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- 10 questions posées à la suite
- Le joueur doit répondre à TOUTES après avoir entendu les 10
- Les questions peuvent être liées entre elles
- Réponses courtes (1-3 mots)

HUMOUR DANS LA FORME, SÉRIEUX DANS LE FOND :
✅ FORMULATION HUMORISTIQUE :
- Tournures décalées, inattendues, amusantes
- Façon de poser la question drôle ou piège
- Enchaînements surprenants entre questions

❌ CONTENU SÉRIEUX :
- Les RÉPONSES doivent être des FAITS réels et vérifiables
- Pas de questions sur des sujets inventés ou absurdes
- Pas de réponses fantaisistes ou humoristiques

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER chaque réponse
- Les réponses doivent être 100% correctes

FORMAT TEXTE - INTERDIT :
- PAS de markdown
- Texte brut uniquement

JSON Format (STRICTEMENT ce format) :
[
  { "question": "Question ?", "answer": "Réponse" }
] (Array of exactly 10 items)`;

export const PHASE5_GENERATOR_PROMPT = `Tu es un expert en quiz mémoire pour "Burger Quiz" (phase "Burger Ultime").

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT DE LA PHASE "BURGER ULTIME" (DÉFI MÉMOIRE) :
- Le joueur écoute 10 questions D'AFFILÉE sans répondre
- Ensuite, il doit répondre aux 10 questions DANS L'ORDRE
- La mémoire est testée : le joueur doit retenir les questions ET les réponses
- Chaque bonne réponse = points pour son équipe

GÉNÈRE 10 QUESTIONS pour le défi mémoire.

=== RÈGLE D'OR : MÉMORABILITÉ ===

Les questions doivent être :
- MÉMORABLES : formulations qui restent en tête
- LIÉES ENTRE ELLES : thème commun ou enchaînements logiques
- PROGRESSIVES : courbe de difficulté (facile → difficile)

=== TECHNIQUE DU CALLBACK (OBLIGATOIRE) ===

Au moins 2-3 questions doivent faire des "callbacks" à des questions précédentes !

✅ EXEMPLE DE SÉQUENCE AVEC CALLBACKS :

Q1: "Quel est le prénom de la reine d'Angleterre décédée en 2022 ?" → "Elizabeth"
Q2: "Combien de rois de France s'appelaient Louis ?" → "18"
Q3: "Si Elizabeth avait été française, elle aurait été Elizabeth combien ?" → "3"
     ↑ CALLBACK : référence Q1 + utilise le format de Q2

Q7: "Quel rappeur français a sorti l'album 'Ipséité' ?" → "Damso"
Q8: "Quel autre rappeur belge a collaboré avec lui sur 'Macarena' ?" → "Stromae"
     ↑ CALLBACK : référence Q7

=== TECHNIQUES DE MÉMORISATION ===

1. THÈME COMMUN : Toutes les questions tournent autour du même sujet
   - Si thème = "Animaux" : Q1-Q10 sur les animaux, mais angles différents

2. HISTOIRE QUI AVANCE : Les questions racontent une histoire
   - Q1: Naissance d'un personnage → Q10: Sa mort ou fin de carrière

3. PROGRESSION NUMÉRIQUE : Les réponses suivent une logique
   - Réponses qui augmentent/diminuent
   - Dates qui avancent chronologiquement

4. ASSOCIATIONS MNÉMOTECHNIQUES : Formulations qui s'enchaînent
   - "Le premier..." "Le dernier..." "Entre les deux..."

=== FORMULATIONS MÉMORABLES ===

✅ BON (facile à retenir) :
- "Quel animal dort debout ?" → court, visuel, étonnant
- "Dans quel film Tom Hanks parle-t-il à un ballon ?" → image forte
- "Quel super-héros est allergique au vert ?" → absurde mais vrai

❌ MAUVAIS (difficile à retenir) :
- "Quel est le nom du traité signé en 1648 qui a mis fin à la guerre de Trente Ans ?"
  → trop long, trop de détails, format encyclopédique

=== COURBE DE DIFFICULTÉ ===

- Questions 1-3 : FACILES (faits connus, pour mettre en confiance)
- Questions 4-7 : MOYENNES (un peu plus obscures)
- Questions 8-10 : DIFFICILES (pièges, détails, callbacks)

=== EXACTITUDE FACTUELLE ===

- UTILISE Google Search pour vérifier CHAQUE réponse
- Réponses COURTES : 1-3 mots maximum
- UNE SEULE réponse possible par question

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
[
  { "question": "Question mémorable ?", "answer": "Réponse 1-3 mots" }
]

10 questions exactement. Pas de markdown.`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge STRICT pour "Burger Quiz" phase "Burger Ultime" (Mémoire).
Analyse ces questions et donne un feedback détaillé.

QUESTIONS PROPOSÉES :
{QUESTIONS}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. MÉMORABILITÉ : Les questions sont-elles faciles à retenir ?
   - Formulations courtes et percutantes
   - Images mentales fortes
   - Éviter le format encyclopédique

2. LIENS/CALLBACKS : Y a-t-il des connexions entre questions ?
   - Minimum 2 callbacks attendus
   - Thème commun qui aide la mémoire
   - Progression logique

3. PROGRESSION : La difficulté évolue-t-elle bien ?
   - Q1-3 : Faciles
   - Q4-7 : Moyennes
   - Q8-10 : Difficiles

4. EXACTITUDE FACTUELLE (CRITIQUE) : Les réponses sont-elles 100% correctes ?
   - UTILISE Google Search pour vérifier
   - Une seule réponse possible

5. LONGUEUR RÉPONSES : Toutes en 1-3 mots ?

6. STYLE BURGER QUIZ : Ton décalé, formulations amusantes ?

7. COHÉRENCE THÉMATIQUE : Les questions forment-elles un ensemble cohérent ?

FORMAT JSON (STRICTEMENT) :
{
  "approved": true | false,
  "scores": {
    "memorability": 1-10,
    "callbacks": 1-10,
    "progression": 1-10,
    "factual_accuracy": 1-10,
    "answer_length": 1-10,
    "burger_style": 1-10,
    "thematic_coherence": 1-10
  },
  "overall_score": 1-10,
  "callback_count": 0-10,
  "identified_callbacks": [
    {
      "question_index": 3,
      "references_question": 1,
      "description": "Q3 fait référence à la réponse de Q1"
    }
  ],
  "difficulty_curve": {
    "easy_questions": [0, 1, 2],
    "medium_questions": [3, 4, 5, 6],
    "hard_questions": [7, 8, 9],
    "curve_ok": true | false
  },
  "questions_feedback": [
    {
      "index": 0,
      "question": "La question",
      "answer": "La réponse",
      "ok": true | false,
      "memorable": true | false,
      "issues": ["trop_long" | "format_encyclopedique" | "reponse_incorrecte" | "reponse_longue" | "pas_de_lien"],
      "correction": "Correction si nécessaire"
    }
  ],
  "global_feedback": "Feedback général",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

CRITÈRES DE REJET (approved = false) :
- memorability < 6 (questions pas assez mémorables)
- callback_count < 2 (pas assez de liens)
- factual_accuracy < 7 (trop d'erreurs)
- progression.curve_ok = false (pas de courbe de difficulté)

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
