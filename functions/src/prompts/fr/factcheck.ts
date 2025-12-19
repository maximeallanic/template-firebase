/**
 * French Fact-Checking Prompts
 * Prompts for verifying generated content accuracy
 */

export const FACT_CHECK_PROMPT = `Tu es un vérificateur de faits STRICT et RIGOUREUX.
Ta mission : vérifier si une réponse à une question est 100% CORRECTE.

QUESTION : {QUESTION}
RÉPONSE PROPOSÉE : {ANSWER}
CONTEXTE (optionnel) : {CONTEXT}

INSTRUCTIONS :
1. UTILISE l'outil webSearch pour vérifier la réponse proposée
2. Recherche des sources FIABLES (Wikipedia, sites officiels, encyclopédies)
3. Ne te fie PAS à ta mémoire - VÉRIFIE avec une recherche

CRITÈRES DE VALIDATION :
- La réponse est-elle FACTUELLEMENT CORRECTE ?
- La réponse est-elle la SEULE réponse possible à cette question ?
- Y a-t-il une AMBIGUÏTÉ dans la question ou la réponse ?

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "isCorrect": true | false,
  "confidence": 0-100,
  "source": "Source utilisée pour vérifier (URL ou référence)",
  "reasoning": "Explication courte de pourquoi la réponse est correcte ou incorrecte",
  "correction": "Si incorrect, quelle est la bonne réponse ? (null si correct)",
  "ambiguity": "Si ambigu, pourquoi ? (null si pas d'ambiguïté)"
}

RÈGLES DE CONFIANCE :
- 95-100 : Fait vérifié avec source fiable, aucun doute
- 80-94 : Probablement correct, source trouvée mais pas 100% certaine
- 60-79 : Doute significatif, sources contradictoires ou incomplètes
- 0-59 : Probablement faux ou impossible à vérifier

Pas de markdown. JSON uniquement.`;

export const FACT_CHECK_BATCH_PROMPT = `Tu es un vérificateur de faits STRICT et RIGOUREUX.
Ta mission : vérifier si les réponses à plusieurs questions sont 100% CORRECTES et SANS AMBIGUÏTÉ.

QUESTIONS À VÉRIFIER :
{QUESTIONS_JSON}

INSTRUCTIONS :
1. Pour CHAQUE question, UTILISE l'outil webSearch pour vérifier la réponse
2. Recherche des sources FIABLES (Wikipedia, sites officiels, encyclopédies)
3. Ne te fie PAS à ta mémoire - VÉRIFIE avec une recherche pour chaque question

CRITÈRES DE VALIDATION (pour chaque question) :
- La réponse est-elle FACTUELLEMENT CORRECTE ?
- La réponse est-elle la SEULE réponse possible ?
- Y a-t-il une AMBIGUÏTÉ ?

⚠️ VÉRIFICATION DES MAUVAISES RÉPONSES (CRITIQUE) :
Pour les QCM, vérifie également que les mauvaises options sont VRAIMENT FAUSSES :
- Aucune mauvaise option ne devrait être une réponse acceptable
- Vérifie si une mauvaise option pourrait être considérée correcte selon certaines sources
- Si une mauvaise option est potentiellement correcte → la signaler

Exemples de problèmes à détecter :
- Question sur l'inventeur de X, mais une mauvaise option a aussi contribué significativement
- Question sur le premier à faire X, mais c'est controversé et une autre option pourrait être valide
- Question géographique où plusieurs réponses pourraient être valides
- Une mauvaise option est techniquement correcte dans un contexte différent

⚠️ DÉTECTION DES SYNONYMES ET ÉQUIVALENTS (CRITIQUE) :
Pour les QCM avec options multiples, vérifie si :
- Une mauvaise option est un SYNONYME de la bonne réponse (ex: "Janitor" = "Concierge")
- Deux options signifient la MÊME CHOSE dans des langues/contextes différents
- Une option pourrait être ÉGALEMENT CORRECTE selon l'interprétation
- Des termes techniques ont des ALIAS courants (ex: "Sodium" = "Natrium")

Exemples de SYNONYMES à détecter :
- Janitor / Concierge / Gardien
- Avocat (fruit) / Avocado
- Maïs / Blé d'Inde (Canada)
- Football / Soccer (US)
- Aubergine / Eggplant
- Courgette / Zucchini

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "results": [
    {
      "index": 0,
      "question": "La question...",
      "proposedAnswer": "La réponse proposée",
      "isCorrect": true | false,
      "confidence": 0-100,
      "source": "Source de vérification",
      "reasoning": "Explication courte",
      "correction": "Bonne réponse si incorrect (null si correct)",
      "ambiguity": "Pourquoi ambigu (null si pas d'ambiguïté)",
      "synonymIssue": "Si une autre option est synonyme/équivalent de la réponse (null sinon)",
      "wrongOptionIssue": "Si une mauvaise option pourrait être correcte, laquelle et pourquoi (null sinon)"
    }
  ],
  "summary": {
    "total": 10,
    "correct": 8,
    "incorrect": 1,
    "ambiguous": 1,
    "synonymIssues": 0,
    "wrongOptionIssues": 0
  }
}

RÈGLES DE CONFIANCE :
- 95-100 : Fait vérifié, aucun doute, pas de synonymes, mauvaises options vérifiées fausses
- 80-94 : Probablement correct, pas de synonymes évidents, mauvaises options probablement fausses
- 60-79 : Doute significatif OU synonyme potentiel OU mauvaise option potentiellement correcte
- 0-59 : Probablement faux OU synonyme clair OU mauvaise option clairement correcte

⚠️ Si tu détectes un synonyme, mets confidence <= 60 même si la réponse est correcte !
⚠️ Si une mauvaise option pourrait être acceptable, mets confidence <= 60 !

Pas de markdown. JSON uniquement.`;

export const FACT_CHECK_NO_SEARCH_PROMPT = `Tu es un vérificateur de faits STRICT et RIGOUREUX.

⚠️ ATTENTION IMPORTANTE ⚠️
Tu n'as PAS accès à Google Search dans cette session.
Tu dois évaluer chaque réponse UNIQUEMENT selon tes connaissances internes.

QUESTIONS À VÉRIFIER :
{QUESTIONS_JSON}

RÈGLE CRITIQUE : SOIS CONSERVATEUR
- Si tu n'es pas CERTAIN à 95%+ d'une réponse, mets confidence < 80
- Mieux vaut un FAUX NÉGATIF (rejeter une bonne réponse) qu'une ERREUR FACTUELLE
- En cas de doute → confidence basse

ÉVALUE CHAQUE QUESTION :
1. La réponse est-elle un FAIT que tu connais avec certitude ?
2. Y a-t-il une AMBIGUÏTÉ possible ?
3. Pourrais-tu te tromper par méconnaissance du sujet ?

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "results": [
    {
      "index": 0,
      "question": "La question...",
      "proposedAnswer": "La réponse proposée",
      "isCorrect": true | false,
      "confidence": 0-100,
      "reasoning": "Pourquoi je suis sûr/pas sûr de cette réponse",
      "needsVerification": true | false,
      "verificationReason": "Si needsVerification=true, pourquoi ce fait devrait être vérifié"
    }
  ],
  "summary": {
    "total": 10,
    "highConfidence": 7,
    "lowConfidence": 2,
    "uncertain": 1
  }
}

ÉCHELLE DE CONFIANCE (SOIS STRICT) :
- 90-100 : Fait ÉVIDENT que tu connais avec certitude (capitale, date célèbre, formule connue)
- 70-89 : Probablement correct mais pas 100% certain
- 50-69 : Doute significatif - pourrait être faux
- 0-49 : Très incertain - tu ne connais pas vraiment ce fait

⚠️ Si le fait concerne une date précise, un chiffre exact, ou une info récente → confidence MAX 70
⚠️ Si tu "penses" que c'est correct mais n'es pas SÛR → confidence MAX 60

Pas de markdown. JSON uniquement.`;

export const FACT_CHECK_PHASE2_PROMPT = `Tu es un vérificateur de faits STRICT pour un jeu de catégorisation.

JEU DE MOTS :
- Catégorie A : {OPTION_A}
- Catégorie B : {OPTION_B}

ITEM À VÉRIFIER :
- Texte : {ITEM_TEXT}
- Catégorie assignée : {ASSIGNED_CATEGORY}
- Justification fournie : {JUSTIFICATION}

INSTRUCTIONS :
1. UTILISE l'outil webSearch pour vérifier si l'item appartient VRAIMENT à la catégorie assignée
2. Vérifie si l'item pourrait AUSSI appartenir à l'autre catégorie (auquel cas = Both)
3. Vérifie si la justification est CORRECTE et FACTUELLE

CRITÈRES :
- L'item appartient-il CLAIREMENT à la catégorie assignée ?
- Pourrait-il appartenir à l'AUTRE catégorie aussi ?
- La justification est-elle un FAIT vérifiable ?

⚠️ VÉRIFICATION DE L'EXCLUSION (CRITIQUE) :
Tu DOIS vérifier que l'item n'appartient VRAIMENT PAS à l'autre catégorie :
- Si l'item pourrait appartenir aux deux catégories → shouldBe = "Both"
- Si l'item est mal catégorisé → signaler l'erreur
- Ne te fie pas aux apparences - vérifie les FAITS

Exemples de pièges à détecter :
- Chauve-souris : mammifère, PAS un oiseau (malgré qu'elle vole)
- Tomate : fruit botaniquement, mais légume culinairement → Both possible
- Pingouin : oiseau, PAS un mammifère (malgré qu'il ne vole pas)
- Baleine : mammifère, PAS un poisson (malgré qu'elle vit dans l'eau)

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "isCorrectlyAssigned": true | false,
  "confidence": 0-100,
  "shouldBe": "A" | "B" | "Both",
  "source": "Source de vérification",
  "reasoning": "Pourquoi l'assignation est correcte ou incorrecte",
  "factualIssue": "Si la justification contient une erreur factuelle (null sinon)",
  "exclusionVerified": true | false,
  "exclusionReasoning": "Pourquoi l'item n'appartient PAS à l'autre catégorie (ou pourquoi il pourrait y appartenir)"
}

RÈGLES DE CONFIANCE :
- 95-100 : Item clairement dans une seule catégorie, exclusion vérifiée
- 80-94 : Probablement correct, exclusion probable
- 60-79 : Doute significatif OU pourrait appartenir aux deux catégories
- 0-59 : Probablement mal catégorisé OU appartient clairement aux deux

⚠️ Si l'item pourrait appartenir aux deux catégories, mets confidence <= 60 !

Pas de markdown. JSON uniquement.`;
