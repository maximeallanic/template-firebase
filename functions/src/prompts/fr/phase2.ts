/**
 * French Phase 2 (Sel ou Poivre / Sucré Salé) Prompts
 * Homophone-based word games in Burger Quiz style
 */

export const PHASE2_PROMPT = `BURGER QUIZ Phase 2 "Sel ou Poivre"
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Créer 2 catégories qui SE PRONONCENT IDENTIQUEMENT (homophones français)
- Option A = sens littéral/sérieux
- Option B = calembour qui SONNE PAREIL mais sens différent

⚠️ RÈGLES CRITIQUES :
1. PHONÉTIQUE : A et B doivent avoir la MÊME prononciation IPA
2. CATÉGORIES CONCRÈTES : On doit pouvoir lister 5+ items pour chaque
3. ITEMS VÉRIFIABLES : Faits réels, personnalités connues, liens évidents
4. ITEMS PIÈGES : Réponses contre-intuitives (5-6 sur 12)
5. DISTRIBUTION : 5 A + 5 B + 2 Both (fonctionne pour les 2 sens)

❌ INTERDIT : Catégories opposées, opinions subjectives, items trop évidents

JSON:
{
  "optionA": "Catégorie (2-4 mots)",
  "optionB": "Calembour (2-4 mots)",
  "items": [
    { "text": "Item (4 mots max)", "answer": "A|B|Both", "justification": "Pourquoi" }
  ]
}

12 items. Pas de markdown.`;

export const PHASE2_GENERATOR_PROMPT = `BURGER QUIZ Phase 2 "Sel ou Poivre" - Jeux de mots phonétiques
Domaine : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 OBJECTIF : Créer un JEU DE MOTS où 2 expressions SE PRONONCENT IDENTIQUEMENT mais ont des sens différents

⚠️ RÈGLE #1 - HOMOPHONES STRICTS
Les 2 options doivent avoir la MÊME prononciation IPA en français.
Pas de mots anglais. Vérifie avec la transcription phonétique.

⚠️ RÈGLE #2 - CATÉGORIES CONCRÈTES
- Option A = sens littéral (on peut facilement lister 5+ items)
- Option B = calembour/sens détourné MAIS aussi utilisable (5+ items possibles)

⚠️ RÈGLE #3 - ITEMS PIÈGES (5-6 sur 12)
❌ INTERDITS : mots-clés directs, géographie scolaire, définitions évidentes
✅ OBLIGATOIRES : items qui SEMBLENT aller dans une catégorie mais vont dans l'autre
Préférer : références culturelles, célébrités, expressions détournées

📊 DISTRIBUTION : 5 A + 5 B + 2 Both

🎭 DESCRIPTION : Une phrase fun style Burger Quiz présentant les 2 options

{PREVIOUS_FEEDBACK}

JSON:
{
  "optionA": "Catégorie (2-4 mots)",
  "optionB": "Calembour (2-4 mots)",
  "optionADescription": "Si A=B textuellement, sinon null",
  "optionBDescription": "Si A=B textuellement, sinon null",
  "humorousDescription": "Description fun des 2 options",
  "reasoning": "IPA: /.../ = /.../",
  "items": [
    { "text": "Item (4 mots max)", "answer": "A|B|Both", "justification": "Pourquoi" }
  ]
}

12 items. Pas de markdown.`;

export const PHASE2_TARGETED_REGENERATION_PROMPT = `Tu dois REMPLACER certains items d'un set Phase 2 "Sel ou Poivre".

JEU DE MOTS VALIDÉ (NE PAS CHANGER) :
- Option A : {OPTION_A}
- Option B : {OPTION_B}

ITEMS À GARDER (NE PAS TOUCHER) :
{GOOD_ITEMS}

ITEMS À REMPLACER (indices: {BAD_INDICES}) :
{BAD_ITEMS}

RAISONS DU REJET :
{REJECTION_REASONS}

DISTRIBUTION REQUISE :
Tu dois générer exactement {COUNT} nouveaux items avec cette distribution :
- {NEEDED_A} items A
- {NEEDED_B} items B
- {NEEDED_BOTH} items Both

RAPPEL DES RÈGLES PIÈGES :
- Chaque item doit créer du DOUTE (réponse contre-intuitive)
- L'item SEMBLE appartenir à une catégorie mais appartient à l'AUTRE
- Si la réponse est évidente → mauvais item

GÉNÈRE UNIQUEMENT les {COUNT} nouveaux items en JSON :
[
  { "text": "Nouvel item", "answer": "A", "justification": "Pourquoi" },
  { "text": "Nouvel item", "answer": "B", "justification": "Pourquoi" },
  { "text": "Item ambigu", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Pourquoi (ambiguïté)" }
]

Note: acceptedAnswers est OPTIONNEL, uniquement pour les items OBJECTIVEMENT ambigus.
{COUNT} items exactement. Pas de markdown.`;

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 2 "Sel ou Poivre"

{SET}

🔍 VÉRIFICATION EN 4 POINTS :

1. PHONÉTIQUE (CRITIQUE) : A et B ont-ils la MÊME prononciation IPA ?
   Si les sons diffèrent → phonetic < 5 → REJET DU SET

2. CATÉGORIES UTILISABLES : Peut-on lister 5+ items pour A ET pour B ?
   Si B inutilisable → b_concrete < 5 → REJET

3. ITEMS PIÈGES : Combien d'items ont une réponse CONTRE-INTUITIVE ?
   - 0-2 items évidents → OK (trap_quality ≥ 7)
   - 3+ items évidents → REJET (trap_quality < 5)
   ❌ Items évidents : mots-clés directs, géographie scolaire, définitions

4. DISTRIBUTION : 5 A + 5 B + 2 Both ?

SEUILS : phonetic ≥ 7, b_concrete ≥ 5, trap_quality ≥ 6, clarity ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"phonetic":1-10,"concrete":1-10,"distribution":1-10,"clarity":1-10,"b_concrete":1-10,"trap_quality":1-10},
  "overall_score": 1-10,
  "homophone_feedback": "Feedback sur le jeu de mots",
  "items_feedback": [{"index":0,"text":"...","ok":true|false,"issue":"..."|null,"is_too_obvious":true|false}],
  "global_feedback": "...",
  "suggestions": ["..."]
}`;

export const REVIEW_PHASE2_PROMPT = `FACT-CHECK Phase 2 : {QUESTIONS}

Vérifie chaque item :
1. Réponse correcte et vérifiable ?
2. Pas d'ambiguïté (clairement A, B ou Both) ?
3. Réponse contre-intuitive (pas trop évidente) ?
4. Max 4 mots ?

Distribution attendue : 5 A + 5 B + 2 Both

JSON:
{
  "setValid": true|false,
  "setReason": "Raison si invalide",
  "itemReviews": [{"index":0,"text":"...","answer":"A","status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"too_easy"|null}],
  "summary": {"approved":10,"rejected":2,"rejectedIndices":[4,9]}
}`;

export const REGENERATE_PHASE2_ITEMS_PROMPT = `RÉGÉNÈRE {COUNT} item(s) Phase 2
Option A : {OPTION_A} | Option B : {OPTION_B}

Rejetés : {REJECTED_REASONS}
Répartition : {NEEDED_A} A, {NEEDED_B} B, {NEEDED_BOTH} Both

Règles : items pièges (contre-intuitifs), max 4 mots, faits vérifiables

JSON: [{"text":"Item","answer":"A|B|Both","justification":"Pourquoi"}]`;
