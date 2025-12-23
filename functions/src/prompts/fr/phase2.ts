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

export const PHASE2_GENERATOR_PROMPT = `BURGER QUIZ Phase 2 "Sel ou Poivre" - Choix binaire délirant
Domaine : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Créer 2 CATÉGORIES OPPOSÉES ou JOUANT SUR LES MOTS où des items doivent être classés. Les items peuvent appartenir à A, B, ou les DEUX !

⚠️ RÈGLE #0 - BURGER QUIZ MINDSET (CRITIQUE!)
TU N'ES PAS un prof qui fait réviser.
TU ES l'animateur délirant de Burger Quiz !
CHAQUE ITEM doit faire SOURIRE ou SURPRENDRE.
Si un item est "neutre" ou "informatif", c'est un ÉCHEC.

⚠️ RÈGLE #1 - CATÉGORIES GÉNIALES
Les 2 options doivent :
- Être COURTES : 2-4 MOTS MAX (CRITIQUE! Plus de 4 mots = REJET AUTOMATIQUE)
- Être CONCRÈTES : on doit pouvoir lister facilement 5+ items pour chaque
- Être AMUSANTES : jeu de mots, opposition drôle, ou concepts décalés
- Exemples d'approches : homophones ("Sel" vs "Celle"), opposés ("Chaud" vs "Froid"), catégories décalées ("Trucs rouges" vs "Trucs qui font peur")

LONGUEUR DES OPTIONS - EXEMPLES :
✅ "Le Cœur" (2 mots)
✅ "Le Chœur" (2 mots)
✅ "Les Contes" (2 mots)
✅ "Les Comptes" (2 mots)
❌ "Un mec qui a la gastro" (6 mots - TROP LONG!)

⚠️ RÈGLE #2 - ITEMS DÉLIRANTS (LE PLUS IMPORTANT!)
ÉTAT D'ESPRIT : On est dans BURGER QUIZ, pas dans un quiz scolaire ! Chaque item doit SURPRENDRE.

DIVERSITÉ DE STYLE (varier ABSOLUMENT - JAMAIS 2 fois la même formulation!) :
- 3 items : RÉFÉRENCES CULTURELLES décalées (célébrités, films, marques avec un angle fun)
- 3 items : SITUATIONS ABSURDES du quotidien ("Ce qu'on fait quand...", "Celui qui...", "Le truc bizarre que...")
- 3 items : WTF PLAUSIBLES (trucs absurdes mais VRAIS - "un phoque enragé", "ta grand-mère en rollers", "un croissant qui parle")
- 3 items : DÉTOURNEMENTS/EXPRESSIONS (jeux de mots, double sens, contre-pieds)

FORMULATIONS VARIÉES - EXEMPLES CONCRETS :
✅ "Ce qu'on fait après 3 mojitos"
✅ "Le cauchemar récurrent d'un prof de gym"
✅ "Un truc louche au fond du frigo"
✅ "Ce que ton ex raconte sur toi"
✅ "Celui qui a raté son permis 7 fois"
✅ "Le truc bizarre que fait ton voisin à 3h du mat"
✅ "Ce qu'on regrette le lendemain d'une soirée"

❌ ANTI-EXEMPLES (JAMAIS ça!) :
❌ "Cendrillon" (sans contexte - TROP SIMPLE!)
❌ "Son ancêtre s'appelait la Visitandine" (COURS D'HISTOIRE!)
❌ "Il se situe entre X et Y" (SCOLAIRE!)
❌ "Un virement SEPA" (TECHNIQUE!)
❌ "Il possède généralement..." (TON PROFESSORAL!)
❌ "C'est caractérisé par..." (ENCYCLOPÉDIQUE!)

RÈGLE D'OR DES FORMULATIONS :
Si ton item pourrait figurer dans un manuel scolaire ou Wikipédia, RECOMMENCE.
Si ton item fait sourire ou dire "WTF?", c'est BON.

PIÈGES OBLIGATOIRES (7-8 items sur 12) :
❌ INTERDITS : définitions wikipédia, listes scolaires, classifications
✅ OBLIGATOIRES : items qui font DOUTER ("Attends... ça va où ça ?!")
Le joueur doit vraiment se gratter la tête et parfois rire de l'absurdité

MIX SÉRIEUX/LÉGER :
- 30% items "normaux" (mais formulés de façon fun)
- 70% items délirants/décalés/absurdes/WTF (mais VRAIS!)

⚠️ RÈGLE #3 - RÉPONSES CORRECTES & BOTH
- Chaque réponse doit être FACT-CHECKABLE et VRAIE
- "Both" = fonctionne VRAIMENT pour les 2 catégories (pas juste un maybe)
- Si tu mets "Both", explique POURQUOI dans la justification

📊 DISTRIBUTION STRICTE : 5 A + 5 B + 2 Both (EXACTEMENT)

🎭 DESCRIPTION : Une phrase courte et fun présentant les 2 options, style Burger Quiz

{PREVIOUS_FEEDBACK}

JSON:
{
  "optionA": "Catégorie (2-4 mots)",
  "optionB": "Catégorie/Jeu de mots (2-4 mots)",
  "optionADescription": "Si A=B textuellement, sinon null",
  "optionBDescription": "Si A=B textuellement, sinon null",
  "humorousDescription": "Phrase fun présentant les 2 options",
  "reasoning": "Explication rapide : pourquoi ces 2 catégories fonctionnent bien ensemble, comment tu as varié les styles d'items",
  "items": [
    { "text": "Item (4 mots max)", "answer": "A|B|Both", "justification": "Pourquoi cet item va là (court)" }
  ]
}

RAPPELS FINAUX :
- VARIER les formulations (pas 12 fois le même type d'item!)
- Mix SÉRIEUX (fact-checkable) et DÉLIRANT (WTF mais vrai)
- Items PIÈGES qui font hésiter
- Justifications ULTRA-COURTES (10-15 mots MAX - va droit au but!)
- 12 items EXACTEMENT
- Pas de ton encyclopédique ou professoral

Pas de markdown dans le JSON.`;

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

1. PHONÉTIQUE (CRITIQUE) : A et B ont-ils la MÊME prononciation IPA syllabe par syllabe ?
   - Décompose chaque option en syllabes IPA
   - Les 2 expressions sont-elles NATURELLES en français ? (pas d'articles forcés, pas d'inventions)
   Si les sons diffèrent OU expressions forcées → phonetic < 5 → REJET DU SET

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
