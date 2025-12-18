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
1. UTILISE Google Search pour vérifier la réponse proposée
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
1. Pour CHAQUE question, UTILISE Google Search pour vérifier la réponse
2. Recherche des sources FIABLES (Wikipedia, sites officiels, encyclopédies)
3. Ne te fie PAS à ta mémoire - VÉRIFIE avec une recherche pour chaque question

CRITÈRES DE VALIDATION (pour chaque question) :
- La réponse est-elle FACTUELLEMENT CORRECTE ?
- La réponse est-elle la SEULE réponse possible ?
- Y a-t-il une AMBIGUÏTÉ ?

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
      "synonymIssue": "Si une autre option est synonyme/équivalent de la réponse (null sinon)"
    }
  ],
  "summary": {
    "total": 10,
    "correct": 8,
    "incorrect": 1,
    "ambiguous": 1,
    "synonymIssues": 0
  }
}

RÈGLES DE CONFIANCE :
- 95-100 : Fait vérifié, aucun doute, pas de synonymes
- 80-94 : Probablement correct, pas de synonymes évidents
- 60-79 : Doute significatif OU synonyme potentiel détecté
- 0-59 : Probablement faux OU synonyme clair détecté

⚠️ Si tu détectes un synonyme, mets confidence <= 60 même si la réponse est correcte !

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
1. UTILISE Google Search pour vérifier si l'item appartient VRAIMENT à la catégorie assignée
2. Vérifie si l'item pourrait AUSSI appartenir à l'autre catégorie (auquel cas = Both)
3. Vérifie si la justification est CORRECTE et FACTUELLE

CRITÈRES :
- L'item appartient-il CLAIREMENT à la catégorie assignée ?
- Pourrait-il appartenir à l'AUTRE catégorie aussi ?
- La justification est-elle un FAIT vérifiable ?

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "isCorrectlyAssigned": true | false,
  "confidence": 0-100,
  "shouldBe": "A" | "B" | "Both",
  "source": "Source de vérification",
  "reasoning": "Pourquoi l'assignation est correcte ou incorrecte",
  "factualIssue": "Si la justification contient une erreur factuelle (null sinon)"
}

Pas de markdown. JSON uniquement.`;
