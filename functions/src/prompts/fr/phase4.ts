/**
 * French Phase 4 (La Note) Prompts
 * Buzzer-based quick questions
 */

export const PHASE4_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "La Note" (buzzer).
Génère 15 questions rapides pour un round de buzzer.

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT :
- Questions TRÈS courtes et directes
- Réponses en 1-3 mots maximum

HUMOUR DANS LA FORME, SÉRIEUX DANS LE FOND :
✅ FORMULATION HUMORISTIQUE :
- Formulations pièges style Alain Chabat : "Quelle est la couleur du cheval blanc d'Henri IV ?"
- Tournures inattendues pour des questions classiques
- Questions qui semblent faciles mais font réfléchir

❌ CONTENU SÉRIEUX :
- Les RÉPONSES doivent être des FAITS réels
- Pas de questions sur des sujets inventés ou absurdes
- Culture générale, histoire, science = OK avec réponses factuelles

IMPORTANT - VÉRIFICATION DES FAITS :
- Utilise la recherche Google pour VÉRIFIER chaque réponse
- Les réponses doivent être indiscutables

FORMAT TEXTE - INTERDIT :
- PAS de markdown
- Texte brut uniquement

JSON Format (STRICTEMENT ce format) :
[
  { "question": "Question courte et directe ?", "answer": "Réponse courte" }
] (Array of exactly 15 items)`;

export const PHASE4_GENERATOR_PROMPT = `Tu es un expert en quiz rapide pour "Burger Quiz" (phase "La Note" - Buzzer).

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

CONCEPT DE LA PHASE "LA NOTE" (BUZZER) :
- Les équipes ont un buzzer
- Première équipe à buzzer donne sa réponse
- Questions RAPIDES : le joueur doit répondre en moins de 3 secondes après le buzz

GÉNÈRE 15 QUESTIONS pour le round buzzer.

=== RÈGLE D'OR : VITESSE ===

Les questions doivent être :
- COURTES : max 15 mots par question
- DIRECTES : la question doit être comprise instantanément
- RÉPONSE RAPIDE : 1-3 mots maximum

=== FORMULATIONS PIÈGES (OBLIGATOIRE) ===

Au moins 5-6 questions sur 15 doivent être des PIÈGES de formulation !

✅ EXEMPLES DE PIÈGES CLASSIQUES :

Type 1 - La réponse est dans la question :
- "Quel est le prénom du Père Noël ?" → "Père" (pas "Nicolas")
- "De quelle couleur sont les M&M's bleus ?" → "Bleus"
- "Qui est le meilleur ami de Batman qui s'appelle Robin ?" → "Robin"
- "Quel est le nom de famille de Louis de Funès ?" → "de Funès"

Type 2 - L'évidence trompeuse :
- "Combien de mois ont 28 jours ?" → "12" (tous les mois ont au moins 28 jours)
- "Dans quel pays trouve-t-on le mont Fuji ?" → "Japon" (semble facile mais fait hésiter)

Type 3 - Le piège historique :
- "Qui a peint le plafond du Louvre ?" → piège (le Louvre n'a pas UN plafond peint célèbre, c'est la Sixtine)
- "Combien d'animaux Moïse a-t-il mis dans l'arche ?" → "0" (c'est Noé, pas Moïse)

=== FORMULATIONS INTERDITES ===

❌ TROP LONG (buzzer = rapidité) :
- "Pouvez-vous me dire quel est le nom du célèbre peintre italien né en 1452 qui a peint la Joconde ?"
  → INTERDIT (trop long, format exam)

❌ TROP SCOLAIRE :
- "Quelle est la formule chimique de l'eau ?" → INTERDIT (format exam)
- "En quelle année a eu lieu la Révolution française ?" → INTERDIT (format encyclopédique)

❌ SANS PIÈGE :
- "Quelle est la capitale de la France ?" → INTERDIT (trop évident, pas de piège)

=== VARIÉTÉ THÉMATIQUE ===

Mélange obligatoire sur 15 questions :
- 3-4 questions culture pop / célébrités
- 3-4 questions histoire / géographie
- 3-4 questions sciences / nature
- 3-4 questions expressions / jeux de mots
- 1-2 questions d'actualité récente

=== EXACTITUDE FACTUELLE ===

- UTILISE Google Search pour vérifier CHAQUE réponse
- La réponse doit être INDISCUTABLE
- Pas d'ambiguïté : UNE SEULE réponse possible

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
[
  { "question": "Question courte (max 15 mots) ?", "answer": "Réponse 1-3 mots" }
]

15 questions exactement. Pas de markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge STRICT pour "Burger Quiz" phase "La Note" (Buzzer).
Analyse ces questions et donne un feedback détaillé.

QUESTIONS PROPOSÉES :
{QUESTIONS}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. VITESSE (CRITIQUE) : Les questions sont-elles assez COURTES pour un buzzer ?
   - Max 15 mots par question
   - Compréhension instantanée requise
   ✅ BON : "Quel est le prénom du Père Noël ?"
   ❌ MAUVAIS : "Pouvez-vous me dire quel est le nom du célèbre peintre..."

2. PIÈGES : Y a-t-il assez de questions-pièges (min 5/15) ?
   - Réponse dans la question
   - Évidence trompeuse
   - Piège de formulation

3. VARIÉTÉ THÉMATIQUE : Mix de sujets différents ?
   - Culture pop, histoire, sciences, actualité...

4. EXACTITUDE FACTUELLE (CRITIQUE) : Les réponses sont-elles 100% correctes ?
   - UTILISE Google Search pour vérifier
   - Une seule réponse possible par question

5. LONGUEUR RÉPONSES : Toutes en 1-3 mots ?

6. STYLE BURGER QUIZ : Ton décalé, formulations drôles ?

FORMAT JSON (STRICTEMENT) :
{
  "approved": true | false,
  "scores": {
    "speed_friendly": 1-10,
    "trap_quality": 1-10,
    "thematic_variety": 1-10,
    "factual_accuracy": 1-10,
    "answer_length": 1-10,
    "burger_style": 1-10
  },
  "overall_score": 1-10,
  "trap_count": 0-15,
  "questions_feedback": [
    {
      "index": 0,
      "question": "La question",
      "answer": "La réponse",
      "ok": true | false,
      "is_trap": true | false,
      "issues": ["trop_long" | "trop_scolaire" | "reponse_incorrecte" | "trop_evident" | "reponse_longue"],
      "word_count": 8,
      "correction": "Correction si nécessaire"
    }
  ],
  "global_feedback": "Feedback général",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}

CRITÈRES DE REJET (approved = false) :
- speed_friendly < 6 (questions trop longues)
- trap_count < 4 (pas assez de pièges)
- factual_accuracy < 7 (trop d'erreurs)

Pas de markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certaines questions Phase 4 "La Note" (Buzzer).

QUESTIONS À GARDER (indices non listés) :
{GOOD_QUESTIONS}

QUESTIONS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_QUESTIONS}

RAISONS DU REJET :
{REJECTION_REASONS}

RÈGLES POUR LES NOUVELLES QUESTIONS :

1. COURTES : max 15 mots par question
2. PIÈGES : la réponse doit surprendre
3. FACTUELLES : utilise Google Search pour vérifier
4. RÉPONSES : 1-3 mots max

Types de pièges à utiliser :
- Réponse dans la question ("prénom du Père Noël")
- Évidence trompeuse ("couleur des M&M's bleus")
- Piège logique ("mois avec 28 jours")

GÉNÈRE UNIQUEMENT les {COUNT} questions de remplacement en JSON :
[
  { "question": "Nouvelle question piège ?", "answer": "Réponse courte" }
]

{COUNT} questions exactement. Pas de markdown.`;
