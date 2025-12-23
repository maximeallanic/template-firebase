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

export const FACT_CHECK_PHASE2_PROMPT = `FACT-CHECK Phase 2 - Vérification BATCH

JEU DE MOTS :
- Catégorie A : {OPTION_A}
- Catégorie B : {OPTION_B}

ITEMS À VÉRIFIER :
{ITEMS_JSON}

INSTRUCTIONS :
1. UTILISE webSearch pour vérifier CHAQUE item
2. Vérifie si l'item appartient à la catégorie assignée
3. Vérifie s'il pourrait appartenir à l'AUTRE catégorie (→ Both)

CRITÈRES PAR ITEM :
- Assignation correcte ?
- Justification factuelle ?
- Exclusion de l'autre catégorie vérifiée ?

JSON:
{
  "results": [
    {
      "index": 0,
      "text": "Item text",
      "assignedCategory": "A",
      "isCorrect": true|false,
      "confidence": 0-100,
      "shouldBe": "A"|"B"|"Both",
      "reasoning": "Explication courte"
    }
  ],
  "summary": {
    "total": 12,
    "correct": 10,
    "incorrect": 2
  }
}

Confiance : 90+ = certain, 70-89 = probable, <70 = doute.
Pas de markdown.`;

// ============================================================================
// AMBIGUITY CHECK PROMPT (dedicated check after fact-checking)
// ============================================================================

/**
 * Prompt for checking answer ambiguity.
 * This is a dedicated check that runs AFTER fact-checking to ensure
 * the question has exactly ONE correct answer with no ambiguity.
 *
 * {QUESTION} - The question text
 * {CORRECT_ANSWER} - The proposed correct answer
 * {WRONG_ANSWERS} - Array of wrong answer options (for MCQ)
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const AMBIGUITY_CHECK_PROMPT = `Tu es un expert en contrôle qualité de questions de quiz.
Ta mission : vérifier qu'une question n'a AUCUNE AMBIGUÏTÉ et qu'elle a UNE SEULE réponse correcte.

QUESTION : {QUESTION}
BONNE RÉPONSE : {CORRECT_ANSWER}
MAUVAISES RÉPONSES : {WRONG_ANSWERS}
ANECDOTE : {ANECDOTE}

INSTRUCTIONS :
1. UTILISE l'outil webSearch pour vérifier chaque point d'ambiguïté potentiel
2. Recherche des cas où la réponse pourrait être contestée
3. Vérifie si les mauvaises réponses pourraient être acceptables dans certains contextes

⚠️ VÉRIFICATIONS CRITIQUES (toutes doivent passer) :

1. UNICITÉ DE LA RÉPONSE
   - La bonne réponse est-elle LA SEULE réponse possible ?
   - Existe-t-il des controverses ou désaccords sur ce fait ?
   - La question admet-elle plusieurs réponses valides selon les sources ?

2. SYNONYMES ET ÉQUIVALENTS
   - Une mauvaise option est-elle un SYNONYME de la bonne réponse ?
   - Deux options signifient-elles la MÊME CHOSE ?
   - Un terme pourrait-il être ÉQUIVALENT dans un autre contexte ?

   Exemples de synonymes à détecter :
   - Janitor / Concierge / Gardien
   - Football / Soccer
   - Aubergine / Eggplant
   - Courgette / Zucchini
   - Avocat (fruit) / Avocado
   - Maïs / Blé d'Inde

3. MAUVAISES RÉPONSES POTENTIELLEMENT CORRECTES
   - Une mauvaise option pourrait-elle être correcte selon certaines sources ?
   - Y a-t-il une controverse historique/scientifique ?
   - Une mauvaise option serait-elle acceptable dans un contexte différent ?

4. AMBIGUÏTÉ DE LA QUESTION
   - La question peut-elle être interprétée de plusieurs façons ?
   - Un mot a-t-il plusieurs sens possibles ?
   - Le contexte est-il suffisant pour une réponse unique ?

5. PRÉCISION FACTUELLE
   - Les dates, chiffres, noms sont-ils EXACTS ?
   - L'anecdote contient-elle des erreurs ?
   - Les faits sont-ils vérifiables et non contestés ?

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "hasIssues": true | false,
  "ambiguityScore": 0-10,
  "issues": [
    {
      "type": "synonym" | "multiple_answers" | "wrong_option_correct" | "unclear_question" | "factual_error",
      "severity": "critical" | "major" | "minor",
      "description": "Description du problème",
      "evidence": "Source ou preuve du problème"
    }
  ],
  "suggestions": [
    "Suggestion pour corriger le problème..."
  ],
  "confidence": 0-100,
  "reasoning": "Résumé de l'analyse"
}

ÉCHELLE D'AMBIGUÏTÉ (ambiguityScore) :
- 10 : Parfait - question claire, réponse unique, pas d'ambiguïté
- 8-9 : Excellent - très léger doute possible mais acceptable
- 6-7 : Acceptable - petite ambiguïté mais réponse reste claire
- 4-5 : Problématique - ambiguïté significative, à revoir
- 0-3 : Rejeté - ambiguïté majeure, plusieurs réponses possibles

RÈGLES :
- hasIssues = true si ambiguityScore < 7
- severity "critical" si la question doit être rejetée
- severity "major" si la question doit être reformulée
- severity "minor" si la question peut être acceptée avec une note

Pas de markdown. JSON uniquement.`;

/**
 * Type definitions for ambiguity check results
 */
export interface AmbiguityIssue {
  type: 'synonym' | 'multiple_answers' | 'wrong_option_correct' | 'unclear_question' | 'factual_error';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  evidence: string;
}

export interface AmbiguityCheckResult {
  hasIssues: boolean;
  ambiguityScore: number;
  issues: AmbiguityIssue[];
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Builds the ambiguity check prompt with question data.
 *
 * @param question - The question text
 * @param correctAnswer - The correct answer
 * @param wrongAnswers - Array of wrong answer options
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildAmbiguityCheckPrompt(
  question: string,
  correctAnswer: string,
  wrongAnswers: string[],
  anecdote?: string
): string {
  return AMBIGUITY_CHECK_PROMPT
    .replace('{QUESTION}', question)
    .replace('{CORRECT_ANSWER}', correctAnswer)
    .replace('{WRONG_ANSWERS}', JSON.stringify(wrongAnswers))
    .replace('{ANECDOTE}', anecdote || 'Aucune');
}
