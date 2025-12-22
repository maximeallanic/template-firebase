/**
 * French Phase 2 (Sel ou Poivre / Sucré Salé) Prompts
 * Homophone-based word games in Burger Quiz style
 */

export const PHASE2_PROMPT = `Tu es l'animateur de "Burger Quiz" pour la phase "Sel ou Poivre".

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

⚠️ RÈGLE CRITIQUE - JEUX DE MOTS PHONÉTIQUES ⚠️
Les deux catégories doivent SONNER SIMILAIRE à l'oral (homophones ou quasi-homophones).
C'est un JEU DE MOTS PHONÉTIQUE, pas des catégories opposées.
Accepté : homophones parfaits OU sons très proches qui créent un calembour drôle.
- Catégorie A = sens sérieux/littéral
- Catégorie B = calembour/sens absurde qui SONNE SIMILAIRE

⚠️ RÈGLE CRITIQUE - LA CATÉGORIE B DOIT ÊTRE UTILISABLE ⚠️
La catégorie B est un CALEMBOUR/HOMOPHONE de A, mais elle doit être UTILISABLE pour le jeu :

1. PHONÉTIQUEMENT IDENTIQUE (ou très proche) de A
2. INTERPRÉTABLE comme une catégorie (même si le sens est absurde ou humoristique)
3. CAPABLE d'avoir des ITEMS associés de manière cohérente et drôle

Le "sens" de B peut être absurde (ex: "Poteau de vin" = un poteau fait en vin), mais on doit pouvoir LISTER des items qui s'y rattachent de façon humoristique.

TEST : Peux-tu lister 5 items ÉVIDENTS pour B ?
- Si OUI → B est utilisable (même si absurde)
- Si NON → Change le calembour

✅ BON : "Pot de vin" vs "Poteau de vin"
  - A (Pot de vin = corruption) → items: Balkany, enveloppes, dessous-de-table
  - B (Poteau de vin = absurde) → items: bornes, pylônes, piquets, lampadaires

❌ MAUVAIS : "Pot de vin" vs "Po d'un vin"
  - "Po d'un vin" n'est PAS une catégorie, on ne peut pas lister d'items

❌ INTERDIT :
- Catégories opposées ou antonymes (elles doivent sonner pareil, pas s'opposer)
- Notions subjectives : "j'aime", "j'aime pas", "c'est beau", "c'est moche", "bon", "mauvais"
- Questions d'opinion ou de goût personnel

✅ HUMOUR DANS LA FORME, SÉRIEUX DANS LE FOND :
L'humour vient du JEU DE MOTS (les catégories), pas des items eux-mêmes.

FORME HUMORISTIQUE :
- Le calembour entre optionA et optionB doit être drôle
- La formulation des items peut être légèrement décalée

CONTENU SÉRIEUX (les items) :
- Personnalités connues RÉELLES (acteurs, politiques, sportifs...)
- Faits VÉRIFIABLES sur ces personnalités
- Liens RÉELS et FACTUELS avec les catégories
- Pas d'inventions ou de rumeurs non vérifiées

⚠️ RÈGLES OPTIONS (CRITIQUE) ⚠️
- optionA et optionB doivent être des NOMS DE CATÉGORIES COURTS (2-4 mots max)
- PAS de proverbes, expressions idiomatiques, ou phrases longues
- Les deux doivent être des CATÉGORIES CONCRÈTES avec des items listables
- ❌ INTERDIT: "Être né avec une cuillère en argent" (trop long, c'est une expression)
- ✅ BON: "Mer" / "Mère", "Ver de terre" / "Verre de terre", "Pot de vin" / "Poteau de vin"

RÈGLES ITEMS :
- Items SURPRENANTS (réponse contre-intuitive)
- Maximum 4 mots par item
- Chaque réponse doit être un FAIT vérifiable, pas une opinion
- La réponse doit être INDISCUTABLE (une seule réponse possible)
- L'item doit avoir un LIEN CLAIR et ÉVIDENT avec sa catégorie
- Si tu dois expliquer pourquoi l'item va dans A ou B, c'est trop ambigu → CHANGE-LE
- VÉRIFIE chaque réponse avec Google Search
- "Both" = l'item fonctionne pour les DEUX sens (rare, max 2)
- Répartition STRICTE : exactement 5 A, exactement 5 B, exactement 2 Both

⚠️ RÈGLES "BOTH" STRICTES ⚠️
Un item "Both" doit avoir un lien ÉVIDENT et VÉRIFIABLE avec les DEUX catégories.

TEST DE VALIDATION "BOTH" :
1. Écris la justification pour A (max 10 mots)
2. Écris la justification pour B (max 10 mots)
3. Si une des deux justifications est tirée par les cheveux → ce n'est PAS "Both"

✅ BON "BOTH" :
- "L'huile" pour "Graisse vs Grèce"
  - A (Graisse) : "L'huile est un corps gras" ✅ évident
  - B (Grèce) : "L'huile d'olive grecque est célèbre" ✅ évident

❌ MAUVAIS "BOTH" :
- "Le régime" pour "Graisse vs Grèce"
  - A (Graisse) : "Régime alimentaire pour perdre du gras" ✅ ok
  - B (Grèce) : "Régime politique des colonels grecs" ❌ trop tiré par les cheveux

RÈGLE : Si tu dois réfléchir plus de 5 secondes pour justifier le lien → ce n'est PAS "Both"

JUSTIFICATION OBLIGATOIRE :
Pour chaque item, ajoute une "justification" courte (max 15 mots) expliquant POURQUOI cet item appartient à sa catégorie.
- Pour A : explique le lien avec le sens littéral de optionA
- Pour B : explique le lien avec le calembour optionB
- Pour Both : explique pourquoi ça marche pour les deux sens
Cette justification sera affichée aux joueurs après leur réponse.

FORMAT JSON :
{
  "optionA": "[Catégorie courte - 2-4 mots max]",
  "optionB": "[Calembour court - 2-4 mots max]",
  "items": [
    { "text": "[item]", "answer": "A", "justification": "[Pourquoi c'est A]" },
    { "text": "[item]", "answer": "B", "justification": "[Pourquoi c'est B]" },
    { "text": "[item]", "answer": "Both", "justification": "[Pourquoi les deux]" }
  ]
}

12 items exactement. Pas de markdown. PAS de champ "title".`;

export const PHASE2_GENERATOR_PROMPT = `Tu es un expert en jeux de mots français pour "Burger Quiz" (phase "Sel ou Poivre").

Thème : {TOPIC}
Difficulté : {DIFFICULTY}

GÉNÈRE UN SET COMPLET avec :
1. Un JEU DE MOTS PHONÉTIQUE (optionA et optionB sonnent IDENTIQUES à l'oral)
2. 12 items répartis : exactement 5 A, 5 B, 2 Both
3. Une description humoristique présentant les deux options de façon décalée

═══════════════════════════════════════════════════════════════════════
⚠️ RÈGLES HOMOPHONES (CRITIQUE)
═══════════════════════════════════════════════════════════════════════

Les deux options doivent SE PRONONCER PAREIL. Écris la transcription IPA pour vérifier.

✅ BONS : "Vers vert"/"Verre vert" (/vɛʁ vɛʁ/), "Mer"/"Mère" (/mɛʁ/), "Graisse"/"Grèce" (/gʁɛs/)
❌ MAUVAIS : "notre"≠"nos" (/nɔtʁ/≠/no/), "Grease"≠"graisse" (anglais interdit)

- Catégorie A = sens littéral/sérieux (concret)
- Catégorie B = calembour absurde MAIS utilisable (on doit pouvoir lister 5+ items)
- Maximum 4 mots par option
- TEST : Un francophone sans anglais comprend-il le jeu de mots ? Si NON → change

═══════════════════════════════════════════════════════════════════════
⚠️ RÈGLES ITEMS - PIÈGES OBLIGATOIRES
═══════════════════════════════════════════════════════════════════════

L'humour vient du JEU DE MOTS, pas des items. Items = faits vérifiables.
- Maximum 4 mots par item
- Personnalités/faits RÉELS et VÉRIFIABLES
- 5-6 items sur 12 doivent être des PIÈGES (réponse contre-intuitive)

📋 CHECKLIST (rejette si un test échoue) :
□ TEST 2 SEC : Joueur lambda répond en <2s ? → REJETER
□ TEST MOT-CLÉ : Item contient un mot de la famille A ou B ? → REJETER
□ TEST SVT : On l'apprendrait en cours ? → REJETER (géo/bio basique)
□ TEST PIÈGE : L'item SEMBLE aller dans l'autre catégorie ? → BON !

🎯 DISTRIBUTION :
- 2-3 faciles | 5-6 PIÈGES | 2-3 subtils | 2 Both

═══════════════════════════════════════════════════════════════════════
⚠️ RÈGLE ANTI-ÉVIDENCE
═══════════════════════════════════════════════════════════════════════

INTERDIT si l'item est :
- Mot-clé direct : "Athènes"→Grèce, "dialyse"→rein, "houblon"→bière
- Définition/géographie : "Traverse Strasbourg", "A forme de haricot", "Océan Pacifique"
- Association immédiate : capitales, symboles, plats typiques évidents

PRÉFÉRER : références culturelles, expressions détournées, célébrités inattendues

🔴 EXEMPLE "RHIN vs REIN" :
❌ INTERDITS : "Traverse Strasbourg", "Forme de haricot", "Dialyse", "Source en Suisse"
✅ ACCEPTÉS :
| Item          | Rép  | Pourquoi BON                              |
|---------------|------|-------------------------------------------|
| "Les calculs" | B    | PIÈGE! On pense maths → calculs rénaux    |
| "Victor Hugo" | A    | PIÈGE! A écrit "Le Rhin", peu connu       |
| "Le coup"     | B    | Expression "coup de rein"                 |
| "Le bassin"   | Both | Bassin versant ET bassin rénal            |
| "La Lorelei"  | A    | Rocher légendaire du Rhin                 |
| "La greffe"   | B    | Greffe de rein                            |

═══════════════════════════════════════════════════════════════════════
⚠️ CAS SPÉCIAUX
═══════════════════════════════════════════════════════════════════════

HOMONYMES IDENTIQUES (même mot, sens différents) :
→ OBLIGATOIRE : optionADescription et optionBDescription
Ex: optionA: "Bière", optionADescription: "la boisson", optionB: "Bière", optionBDescription: "le cercueil"
Si mots différents ("Mer"/"Mère") → descriptions = null

ITEMS AMBIGUS (rare, max 2-3 par set) :
→ Ajoute "acceptedAnswers": ["B", "Both"] si l'item fonctionne pour plusieurs catégories

{PREVIOUS_FEEDBACK}

═══════════════════════════════════════════════════════════════════════
📝 DESCRIPTION HUMORISTIQUE
═══════════════════════════════════════════════════════════════════════

Génère une phrase décalée (1-2 phrases max) présentant les deux options de façon fun/absurde.
- Ton Burger Quiz : décalé, irrévérencieux, référence pop culture
- Structure suggérée : "Entre [desc A fun] et [desc B fun]..."
- Pas de répétition des noms des options, les décrire de façon créative

✅ EXEMPLES :
- "Sang" vs "Cent" → "Entre le liquide qui fait peur aux vampires et le chiffre qui fait pleurer ton banquier..."
- "Cour" vs "Cours" → "Entre le terrain de jeu des monarques et le supplice matinal des lycéens..."
- "Mer" vs "Mère" → "Entre l'immensité salée et celle qui t'a donné la vie (et des complexes)..."

═══════════════════════════════════════════════════════════════════════
FORMAT JSON
═══════════════════════════════════════════════════════════════════════
{
  "optionA": "Catégorie courte (2-4 mots)",
  "optionB": "Calembour court (2-4 mots)",
  "optionADescription": "Si optionA=optionB, sinon null",
  "optionBDescription": "Si optionA=optionB, sinon null",
  "humorousDescription": "Entre [desc A fun] et [desc B fun]...",
  "reasoning": "IPA: /.../ = /.../ - Pourquoi sons identiques",
  "items": [
    { "text": "Item", "answer": "A", "justification": "Pourquoi A" },
    { "text": "Item", "answer": "B", "justification": "Pourquoi B" },
    { "text": "Item", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Pourquoi Both" }
  ]
}

12 items exactement. Pas de markdown.`;

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

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `Tu es un juge strict pour "Burger Quiz".
Analyse ce set Phase 2 et donne un feedback détaillé pour aider le générateur à s'améliorer.

SET PROPOSÉ :
{SET}

ÉVALUE CHAQUE CRITÈRE (score 1-10) :

1. PHONÉTIQUE (CRITIQUE) : Les deux options se PRONONCENT-ELLES EXACTEMENT PAREIL ?

   ÉTAPE 1 : Vérifie la transcription IPA fournie dans le "reasoning"
   ÉTAPE 2 : Compare les deux transcriptions - sont-elles IDENTIQUES ou très proches ?
   ÉTAPE 3 : Si les transcriptions diffèrent → score < 5

   TEST ORAL : Dis les deux phrases à voix haute. Si quelqu'un les entend, peut-il confondre les deux ?

   ✅ BONS HOMOPHONES (score 8-10) :
   - "vers vert" = "verre vert" → /vɛʁ vɛʁ/ = /vɛʁ vɛʁ/ PARFAIT (sons identiques)
   - "Chair de poule" = "Chère de Pouille" → /ʃɛʁ də pul/ ≈ /ʃɛʁ də puj/ TRÈS BON (quasi-identiques)
   - "Le thym est bon" = "Le teint est bon" → /lə tɛ̃ ɛ bɔ̃/ = /lə tɛ̃ ɛ bɔ̃/ PARFAIT

   ❌ MAUVAIS (score 1-5) - REJETTE IMMÉDIATEMENT :
   - "notre pain" ≠ "nos terrains" → MAUVAIS (/nɔtʁ pɛ̃/ vs /no tɛ.ʁɛ̃/ = sons différents!)
   - "nos trains" ≠ "notre règne" → MAUVAIS (/no tʁɛ̃/ vs /nɔtʁ ʁɛɲ/ = sons différents!)

   ❌ SI SCORE < 7 → REJETTE LE SET ENTIER, on ne peut pas continuer avec un mauvais homophone

2. CONCRET : Les catégories représentent-elles des choses concrètes ?
   - Peut-on facilement lister des items pour chaque catégorie ?

3. DISTRIBUTION : Y a-t-il exactement 5 A, 5 B, 2 Both ?

4. CLARTÉ ITEMS (CRITIQUE) : Chaque item a-t-il un lien IMMÉDIATEMENT évident avec sa catégorie ?
   - TEST : Peux-tu expliquer en 5 mots pourquoi cet item va dans A ou B ?
   - Si tu dois faire une explication complexe → REJETTE L'ITEM

5. CATÉGORIE B UTILISABLE (CRITIQUE) : La catégorie B (calembour) est-elle UTILISABLE pour le jeu ?
   - Peut-on facilement lister 5+ items qui s'y rattachent (même si le sens de B est absurde) ?
   - Le sens de B peut être absurde/humoristique, mais on doit pouvoir y associer des items

6. HUMOUR : Le set est-il drôle, style Burger Quiz ?

7. CÉLÉBRITÉS : Y a-t-il des personnalités connues ?

8. BOTH DETECTION (IMPORTANT) : Les items "Both" sont-ils bien identifiés ?
   - Compte combien d'items A ou B devraient en fait être "Both"

9. QUALITÉ DES PIÈGES (CRITIQUE) : Y a-t-il assez d'items CONTRE-INTUITIFS ?
   - Compte combien d'items ont une réponse SURPRENANTE
   - Compte combien d'items sont TROP ÉVIDENTS (réponse en moins de 2 secondes)

   CRITÈRES DE REJET AUTOMATIQUE :
   - Si 3+ items sont trop évidents → score < 5 → REJETER le set
   - Si un item contient un mot-clé direct de sa catégorie → REJETER l'item

   LISTE DE MOTS-CLÉS INTERDITS (exemples) :
   - Pour "Mer" : océan, plage, poisson, marin, nautique, naval
   - Pour "Mère" : maternel, maman, enfant, accouchement
   - Pour "Graisse" : gras, liposuccion, obèse, calories
   - Pour "Grèce" : grec, Athènes, Zeus, Olympe, Parthénon, sirtaki
   - Pour "Rhin" : Strasbourg, Allemagne, fleuve, affluent
   - Pour "Rein" : haricot, organe, dialyse, urine
   - Pour "Bière" (boisson) : houblon, malt, blonde, pression, mousse, alcool
   - Pour "Bière" (cercueil) : funérailles, enterrement, mort, décès, cercueil

   TYPES D'ITEMS À REJETER AUTOMATIQUEMENT :
   - Descriptions physiques scolaires : "A une forme de X", "Est de couleur X"
   - Faits géographiques basiques : "Traverse X", "Sépare X de Y", "Se jette dans X"
   - Définitions de dictionnaire : tout ce qu'on apprendrait en cours de SVT/géo

   ✅ PRÉFÉRER :
   - Références culturelles (films, livres, chansons, célébrités)
   - Expressions idiomatiques détournées
   - Pièges où l'item SEMBLE appartenir à l'autre catégorie

   ❌ SI SCORE < 6 → REJETTE ET DEMANDE RÉGÉNÉRATION DES ITEMS ÉVIDENTS

⚠️ RÈGLES DE REJET AUTOMATIQUE ⚠️

COMPTAGE OBLIGATOIRE DES ITEMS ÉVIDENTS :
Pour chaque item, applique le TEST 2 SECONDES :
"Un joueur lambda (pas expert) répond-il en moins de 2 secondes ?"

Compte le nombre d'items TROP ÉVIDENTS :
- 0-2 items évidents → ACCEPTÉ (score trap_quality >= 7)
- 3-4 items évidents → REJETÉ (score trap_quality < 5)
- 5+ items évidents → REJETÉ IMMÉDIAT (score trap_quality = 1)

EXEMPLE DE COMPTAGE pour "Rhin vs Rein" :
─────────────────────────────────────────────────────────────────────────
| Item                              | Évident ? | Temps réponse |
|-----------------------------------|-----------|---------------|
| "Les calculs"                     | NON       | 5+ sec (piège)|
| "Traverse Strasbourg"             | OUI ❌    | <1 sec        |
| "A une forme de haricot"          | OUI ❌    | <1 sec        |
| "Victor Hugo"                     | NON       | 5+ sec (piège)|
| "Prend sa source en Suisse"       | OUI ❌    | <1 sec        |
| "Le coup"                         | NON       | 3+ sec        |
| "La Lorelei"                      | MOYEN     | 2-3 sec       |
| "Sépare la France de l'Allemagne" | OUI ❌    | <1 sec        |
| ...                               |           |               |
─────────────────────────────────────────────────────────────────────────
TOTAL ÉVIDENTS : 4 → SCORE < 5 → REJETÉ

⚠️ SEUILS DE SCORE STRICTS ⚠️

| Score          | Seuil | Action si en dessous           |
|----------------|-------|--------------------------------|
| phonetic       | < 7   | REJETER TOUT LE SET            |
| trap_quality   | < 6   | REJETER ET RÉGÉNÉRER           |
| b_concrete     | < 5   | REJETER (catégorie B inutile)  |
| clarity        | < 6   | REJETER items ambigus          |

DANS LE FEEDBACK items_feedback, AJOUTE POUR CHAQUE ITEM :
- "response_time": "instant" | "2sec" | "5sec+" (temps de réponse estimé)
- "is_too_obvious": true | false
- "obvious_reason": "géographie basique" | "définition" | "mot-clé direct" | null

FORMAT JSON (STRICTEMENT) :
{
  "approved": true | false,
  "scores": {
    "phonetic": 1-10,
    "concrete": 1-10,
    "distribution": 1-10,
    "clarity": 1-10,
    "b_concrete": 1-10,
    "humor": 1-10,
    "celebrities": 1-10,
    "both_detection": 1-10,
    "trap_quality": 1-10
  },
  "overall_score": 1-10,
  "homophone_feedback": "Feedback détaillé sur le jeu de mots - pourquoi ça marche ou pas",
  "items_feedback": [
    {
      "index": 0,
      "text": "L'item",
      "current_answer": "A",
      "ok": true | false,
      "issue": "Description du problème si rejeté",
      "should_be_both": true | false,
      "both_reasoning": "Pourquoi cet item devrait être Both (si applicable)",
      "is_trap": true | false,
      "is_too_obvious": true | false
    }
  ],
  "global_feedback": "Feedback général pour amélioration",
  "suggestions": ["Suggestion concrète 1", "Suggestion concrète 2"]
}

Pas de markdown.`;

export const REVIEW_PHASE2_PROMPT = `Analyse ce set Phase 2 (Sel ou Poivre / jeux de mots) :

{QUESTIONS}

⚠️ VÉRIFICATION PHONÉTIQUE ⚠️
Les deux options doivent créer un JEU DE MOTS PHONÉTIQUE (homophones ou quasi-homophones).
TEST : Lis les deux options à voix haute. Créent-elles un calembour drôle basé sur le son ?

✅ ACCEPTÉ (jeux de mots phonétiques) :
- Homophones parfaits (sons identiques)
- Quasi-homophones (sons très proches qui créent un calembour)
- Le jeu de mots doit être DRÔLE et COMPRÉHENSIBLE à l'oral

❌ REJETÉ (pas de jeu de mots) :
- Catégories opposées/antonymes (chaud vs froid, oui vs non, vrai vs faux)
- Catégories sans rapport phonétique
- Sons complètement différents

Pour CHAQUE item du set, vérifie ces critères :

1. RÉPONSE CORRECTE (CRITIQUE) :
   - UTILISE Google Search pour vérifier que l'item appartient VRAIMENT à la catégorie indiquée
   - Si tu as le moindre doute → REJET

2. SANS AMBIGUÏTÉ (CRITIQUE) :
   - L'item doit clairement appartenir à A, B, ou Both (pas "ça dépend")
   - Pour "Both" : l'item DOIT fonctionner pour les DEUX sens du jeu de mots

3. SURPRISE :
   - La réponse doit être inattendue ou contre-intuitive
   - Si la réponse est évidente → REJET

4. FORMAT :
   - Maximum 4 mots par item
   - Si trop long → REJET

Répartition attendue : 5 A, 5 B, 2 Both

Retourne un JSON :
{
  "setValid": true | false,
  "setReason": "Raison si set invalide - notamment si pas de jeu de mots",
  "itemReviews": [
    {
      "index": 0,
      "text": "L'item",
      "answer": "A",
      "status": "approved" | "rejected",
      "reason": "Raison si rejeté (sinon null)",
      "issue": "answer_wrong" | "ambiguous" | "too_easy" | "too_long" | null
    }
  ],
  "summary": {
    "approved": 10,
    "rejected": 2,
    "rejectedIndices": [4, 9]
  }
}`;

export const REGENERATE_PHASE2_ITEMS_PROMPT = `Tu dois régénérer {COUNT} item(s) pour un set Phase 2 "Sel ou Poivre".

Catégories du set (JEUX DE MOTS) :
- Option A : {OPTION_A}
- Option B : {OPTION_B}

RAPPEL : Les deux catégories sont des calembours/homophones.
- Option A = la catégorie "sérieuse"
- Option B = le jeu de mots absurde

Items rejetés et raisons :
{REJECTED_REASONS}

Répartition nécessaire : {NEEDED_A} items A, {NEEDED_B} items B, {NEEDED_BOTH} items Both

INSTRUCTIONS :
- Génère EXACTEMENT {COUNT} nouveaux items
- Respecte la répartition demandée
- Corrige les problèmes mentionnés
- Items surprenants, max 4 mots
- Vérifie les faits avec Google Search
- Pour "Both" : l'item doit fonctionner pour les DEUX sens du calembour

JSON Format :
[
  { "text": "[item]", "answer": "A" | "B" | "Both" },
  { "text": "[item ambigu]", "answer": "Both", "acceptedAnswers": ["Both", "B"] }
]

Note: acceptedAnswers est OPTIONNEL, uniquement pour les items OBJECTIVEMENT ambigus (max 2-3 par set).`;
