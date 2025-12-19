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
1. Un JEU DE MOTS PHONÉTIQUE (optionA et optionB qui sonnent pareil ou très proche)
2. 12 items répartis : exactement 5 A, exactement 5 B, exactement 2 Both

RÈGLES HOMOPHONE (CRITIQUE) :
Les deux phrases doivent SE PRONONCER EXACTEMENT PAREIL à l'oral !

✅ BONS EXEMPLES D'HOMOPHONES :
- "Les poules du couvent couvent" (les poules du monastère font éclore des œufs)
- "Vers vert" vs "Verre vert" (un lombric vs une vitre colorée)
- "Mer, mère, maire" (océan, maman, élu)
- "Sot, seau, sceau, saut" (idiot, récipient, cachet, bond)
- "Vingt vins" vs "20 vins" (même prononciation)
- "Salle comble" vs "Sale con" (si on coupe différemment)

❌ MAUVAIS EXEMPLES (NE FONT PAS CE TYPE) :
- "notre pain" vs "nos terrains" → FAUX! /nɔtʁ pɛ̃/ ≠ /no tɛ.ʁɛ̃/ (sons différents)
- "nos trains" vs "notre règne" → FAUX! /no tʁɛ̃/ ≠ /nɔtʁ ʁɛɲ/ (sons différents)
- "Pot de chambre" vs "Impose des membres" → PAS DU TOUT LE MÊME SON
- "Assurance bateau" vs "Science d'un bateau" → PAS LE MÊME SON

⚠️ PIÈGE À ÉVITER :
- "notre" (/nɔtʁ/) et "nos" (/no/) ne sont JAMAIS homophones !
- Des syllabes similaires ne suffisent pas - les SONS doivent être IDENTIQUES
- Écris la transcription phonétique (IPA) pour vérifier AVANT de proposer

RÈGLES SUPPLÉMENTAIRES :
- Catégorie A = sens sérieux/littéral (toujours concret)
- Catégorie B = calembour/sens absurde ou humoristique
- B peut avoir un sens absurde MAIS doit être UTILISABLE : on doit pouvoir lister des items qui s'y rattachent
- TEST : Si tu ne peux pas trouver 5 items évidents pour B → change le calembour

⚠️ RÈGLE OPTIONS (CRITIQUE) ⚠️
Les options doivent être des NOMS DE CATÉGORIES COURTS, pas des phrases !
- Maximum 4 mots par option (optionA ET optionB)
- Les deux doivent représenter des CATÉGORIES concrètes (pas des expressions idiomatiques)

❌ MAUVAIS EXEMPLES D'OPTIONS (trop long ou abstrait) :
- "Être né avec une cuillère en argent" → INTERDIT (expression idiomatique, trop long)
- "Avoir le cafard du dimanche soir" → INTERDIT (trop long, pas une catégorie)
- "Les trains qui arrivent à l'heure" → INTERDIT (phrase, pas catégorie)

✅ BONS EXEMPLES D'OPTIONS :
- "Mer" / "Mère" (1 mot, concret)
- "Ver de terre" / "Verre de terre" (3 mots, concret)
- "Pot de vin" / "Poteau de vin" (3 mots, concret)
- "Saint" / "Sein" (1 mot, concret)

RÈGLES ITEMS - HUMOUR FORME, SÉRIEUX FOND :
⚠️ L'humour vient du JEU DE MOTS (catégories), pas des items.

- Maximum 4 mots par item
- Réponse = FAIT vérifiable (pas opinion, pas rumeur)
- Personnalités connues RÉELLES (acteurs, politiques, sportifs...)
- Liens FACTUELS avec les catégories
- VÉRIFIE chaque fait avec Google Search
- Pas d'inventions ou d'anecdotes non vérifiables

⚠️ PIÈGES OBLIGATOIRES (TRÈS IMPORTANT) ⚠️
Au moins 5-6 items sur 12 doivent être des PIÈGES où la réponse est CONTRE-INTUITIVE !

Un bon piège = l'item SEMBLE appartenir à une catégorie mais appartient en fait à L'AUTRE (ou Both).

✅ EXEMPLES DE BONS PIÈGES (réponse SURPRENANTE) :
- "Mer" vs "Mère" :
  • "Jacques Cousteau" → On pense MÈRE (papa de 2 enfants)... MAIS c'est MER (explorateur des océans) = PIÈGE!
  • "Cordon" → On pense MER (cordon littoral)... MAIS c'est MÈRE (cordon ombilical) = PIÈGE!
  • "Bretagne" → On pense MER (côtes bretonnes)... MAIS c'est BOTH (aussi "mère patrie" des Bretons) = PIÈGE!

❌ MAUVAIS ITEMS (TROP ÉVIDENTS - INTERDIT) :
- "Mer" vs "Mère" → "Océan" = INTERDIT (évidemment Mer, zéro hésitation)
- "Mer" vs "Mère" → "Biberon" = INTERDIT (évidemment Mère, zéro hésitation)

🎯 RÈGLE D'OR : Pour chaque item, demande-toi :
"Est-ce que le joueur va HÉSITER avant de répondre ?"
- Si NON (réponse évidente) → REMPLACE PAR UN PIÈGE
- Si OUI (il y a doute) → BON ITEM

INTERDIT :
- Catégories opposées (oui/non, vrai/faux, chaud/froid)
- Notions subjectives (j'aime, c'est beau, bon/mauvais)
- Calembours où la catégorie B est trop abstraite ou n'a pas de sens concret

⚠️ HOMONYMES IDENTIQUES ⚠️
Si optionA et optionB sont LE MÊME MOT avec des sens différents, tu DOIS fournir optionADescription et optionBDescription pour les différencier.
Exemple :
- optionA: "Financier", optionADescription: "le gâteau"
- optionB: "Financier", optionBDescription: "le banquier"
Si les mots sont différents (ex: "Mer" vs "Mère"), laisse les descriptions à null.

⚠️ ITEMS AMBIGUS - RÉPONSES MULTIPLES ⚠️
Certains items peuvent légitimement appartenir à PLUSIEURS catégories.
Si un item est OBJECTIVEMENT ambigu (pas juste mal formulé), ajoute "acceptedAnswers" :
Exemple :
{
  "text": "Opère sur les marchés",
  "answer": "B",
  "acceptedAnswers": ["B", "Both"],
  "justification": "Le banquier opère sur les marchés financiers, mais les pâtisseries sont aussi vendues aux marchés de village"
}
ATTENTION : N'utilise acceptedAnswers que pour les VRAIES ambiguïtés factuelles.
Maximum 2-3 items avec acceptedAnswers par set.

{PREVIOUS_FEEDBACK}

FORMAT JSON (STRICTEMENT) :
{
  "optionA": "Catégorie courte (2-4 mots max)",
  "optionB": "Calembour court (2-4 mots max)",
  "optionADescription": "Description courte si optionA = optionB, sinon null",
  "optionBDescription": "Description courte si optionA = optionB, sinon null",
  "reasoning": "Transcription IPA: /.../ = /.../ - Explication de pourquoi les sons sont IDENTIQUES",
  "items": [
    { "text": "Item max 4 mots", "answer": "A", "justification": "Pourquoi cet item va dans A" },
    { "text": "Item max 4 mots", "answer": "B", "justification": "Pourquoi cet item va dans B" },
    { "text": "Item max 4 mots", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Pourquoi cet item va dans Both (et aussi acceptable comme A)" }
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
