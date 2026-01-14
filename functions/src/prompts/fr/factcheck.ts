/**
 * French Fact-Checking Prompts
 * Prompts for verifying generated content accuracy
 */

// ============================================================================
// COMMON MYTHS DATABASE - Urban legends that MUST be detected and rejected
// ============================================================================

/**
 * Liste des mythes et légendes urbaines courants à détecter (50+)
 * Si une question reprend un de ces mythes comme fait, elle doit être rejetée
 */
export const COMMON_MYTHS = [
  // === MYTHES HISTORIQUES ===
  { myth: "Caligula a nommé son cheval consul", truth: "Il a seulement envisagé de le faire", keywords: ["Caligula", "Incitatus", "consul"] },
  { myth: "Marie-Antoinette a dit 'qu'ils mangent de la brioche'", truth: "Aucune preuve historique, attribué à Rousseau", keywords: ["Marie-Antoinette", "brioche"] },
  { myth: "Les vikings portaient des casques à cornes", truth: "Invention romantique du 19ème siècle", keywords: ["vikings", "casques", "cornes"] },
  { myth: "Napoléon était petit", truth: "1m68, taille moyenne pour l'époque", keywords: ["Napoléon", "petit", "taille"] },
  { myth: "Newton a découvert la gravité avec une pomme", truth: "Anecdote probablement apocryphe", keywords: ["Newton", "pomme", "gravité"] },
  { myth: "Christophe Colomb a prouvé que la Terre était ronde", truth: "Les Grecs le savaient 2000 ans avant", keywords: ["Colomb", "Terre", "ronde", "plate"] },
  { myth: "Les gladiateurs combattaient toujours à mort", truth: "Rare, ils étaient trop coûteux à former", keywords: ["gladiateurs", "mort", "arène"] },
  { myth: "Cléopâtre était égyptienne", truth: "Elle était d'origine grecque (Ptolémée)", keywords: ["Cléopâtre", "égyptienne", "grecque"] },
  { myth: "Les ceintures de chasteté existaient au Moyen Âge", truth: "Invention du 19ème siècle", keywords: ["ceinture", "chasteté", "Moyen Âge"] },
  { myth: "On brûlait les sorcières au Moyen Âge", truth: "Surtout à la Renaissance, et souvent pendaison", keywords: ["sorcières", "brûlées", "Moyen Âge"] },
  { myth: "Salieri a empoisonné Mozart", truth: "Aucune preuve, mythe romantique", keywords: ["Salieri", "Mozart", "empoisonné"] },
  { myth: "Van Gogh s'est coupé toute l'oreille", truth: "Seulement le lobe", keywords: ["Van Gogh", "oreille", "coupé"] },
  { myth: "Les pyramides ont été construites par des esclaves", truth: "Par des ouvriers salariés", keywords: ["pyramides", "esclaves", "Égypte"] },

  // === MYTHES SCIENTIFIQUES ===
  { myth: "Einstein était mauvais en maths", truth: "Il excellait en mathématiques", keywords: ["Einstein", "mauvais", "maths"] },
  { myth: "On utilise seulement 10% du cerveau", truth: "On utilise tout notre cerveau", keywords: ["10%", "cerveau"] },
  { myth: "La muraille de Chine est visible depuis l'espace", truth: "Trop étroite pour être visible", keywords: ["muraille", "Chine", "espace", "visible"] },
  { myth: "Les chauves-souris sont aveugles", truth: "Elles voient très bien", keywords: ["chauves-souris", "aveugles"] },
  { myth: "Les poissons rouges ont 3 secondes de mémoire", truth: "Ils ont plusieurs mois de mémoire", keywords: ["poisson", "rouge", "mémoire", "secondes"] },
  { myth: "Les autruches mettent la tête dans le sable", truth: "Elles ne font jamais ça", keywords: ["autruche", "tête", "sable"] },
  { myth: "Le sang désoxygéné est bleu", truth: "Il est toujours rouge", keywords: ["sang", "bleu", "veines"] },
  { myth: "La foudre ne frappe jamais deux fois au même endroit", truth: "Elle peut frapper le même endroit", keywords: ["foudre", "frappe", "même endroit"] },
  { myth: "Les humains ont 5 sens", truth: "On en a au moins 9 (équilibre, douleur, etc.)", keywords: ["5 sens", "cinq sens"] },
  { myth: "On avale 8 araignées par an en dormant", truth: "Légende urbaine sans fondement", keywords: ["araignées", "avaler", "dormir"] },
  { myth: "Les cheveux/ongles continuent de pousser après la mort", truth: "La peau se rétracte donnant cette illusion", keywords: ["cheveux", "ongles", "mort", "poussent"] },
  { myth: "L'eau conduit l'électricité", truth: "L'eau pure est isolante, ce sont les impuretés", keywords: ["eau", "électricité", "conducteur"] },
  { myth: "Le tournesol suit le soleil", truth: "Seulement les jeunes plants, pas les fleurs matures", keywords: ["tournesol", "soleil", "suit"] },
  { myth: "Les caméléons changent de couleur pour se camoufler", truth: "C'est pour la communication et la température", keywords: ["caméléon", "couleur", "camouflage"] },
  { myth: "On perd la chaleur corporelle par la tête", truth: "On en perd pareil par toute surface exposée", keywords: ["chaleur", "tête", "perdre"] },
  { myth: "Les lemmings se suicident en masse", truth: "Mythe créé par Disney", keywords: ["lemmings", "suicide", "falaise"] },
  { myth: "Le verre est un liquide très visqueux", truth: "C'est un solide amorphe", keywords: ["verre", "liquide", "visqueux"] },

  // === MYTHES ALIMENTAIRES ===
  { myth: "Le sucre rend les enfants hyperactifs", truth: "Aucune preuve scientifique", keywords: ["sucre", "enfants", "hyperactifs"] },
  { myth: "On doit attendre avant de se baigner après manger", truth: "Pas de risque de noyade prouvé", keywords: ["baigner", "manger", "digestion", "attendre"] },
  { myth: "Le lait est bon pour les os", truth: "Peu de preuves, les pays gros consommateurs ont plus d'ostéoporose", keywords: ["lait", "os", "calcium"] },
  { myth: "Manger des carottes améliore la vision", truth: "Propagande britannique WWII", keywords: ["carottes", "vision", "yeux"] },
  { myth: "Le chocolat donne des boutons", truth: "Aucun lien scientifique prouvé", keywords: ["chocolat", "boutons", "acné"] },
  { myth: "L'alcool réchauffe", truth: "Il dilate les vaisseaux et fait perdre de la chaleur", keywords: ["alcool", "réchauffe", "froid"] },

  // === MYTHES CULTURELS ET GÉOGRAPHIQUES ===
  { myth: "Les Inuits ont 50 mots pour la neige", truth: "Exagération linguistique", keywords: ["Inuits", "Esquimaux", "neige", "mots"] },
  { myth: "Frankenstein est le nom du monstre", truth: "C'est le nom du docteur", keywords: ["Frankenstein", "monstre", "docteur"] },
  { myth: "Sherlock Holmes a dit 'Élémentaire, mon cher Watson'", truth: "Jamais dans les livres originaux", keywords: ["Sherlock", "Holmes", "Élémentaire", "Watson"] },
  { myth: "La tomate est un légume", truth: "C'est botaniquement un fruit", keywords: ["tomate", "légume", "fruit"] },
  { myth: "Le Père Noël rouge a été inventé par Coca-Cola", truth: "Il existait en rouge avant", keywords: ["Père Noël", "Coca-Cola", "rouge"] },
  { myth: "Les taureaux sont énervés par le rouge", truth: "Ils sont daltoniens, c'est le mouvement qui les énerve", keywords: ["taureau", "rouge", "corrida"] },
  { myth: "Les sables mouvants aspirent les gens", truth: "Impossible de couler complètement", keywords: ["sables", "mouvants", "couler"] },

  // === MYTHES TECHNOLOGIQUES ===
  { myth: "Mac ne peut pas avoir de virus", truth: "Ils sont juste moins ciblés", keywords: ["Mac", "Apple", "virus"] },
  { myth: "Les téléphones causent le cancer", truth: "Aucune preuve scientifique solide", keywords: ["téléphone", "cancer", "ondes"] },
  { myth: "Il faut vider complètement la batterie avant de recharger", truth: "Obsolète avec les batteries lithium-ion", keywords: ["batterie", "vider", "recharger"] },
  { myth: "La NASA a dépensé des millions pour un stylo spatial", truth: "Paul Fisher a investi ses propres fonds, la NASA a juste acheté les stylos à 6$ pièce", keywords: ["NASA", "stylo", "Fisher", "millions", "crayon", "espace"] },

  // === MYTHES SUR LES PERSONNALITÉS ===
  { myth: "Walt Disney est cryogénisé", truth: "Il a été incinéré", keywords: ["Disney", "cryogénisé", "congelé"] },
  { myth: "Marilyn Monroe avait un QI de 168", truth: "Aucune preuve fiable", keywords: ["Marilyn", "Monroe", "QI"] },
  { myth: "Al Capone est mort en prison", truth: "Il est mort chez lui de syphilis", keywords: ["Al Capone", "prison", "mort"] },

  // === MYTHES RELIGIEUX/BIBLIQUES ===
  { myth: "Adam et Ève ont mangé une pomme", truth: "La Bible parle d'un 'fruit' non spécifié", keywords: ["Adam", "Ève", "pomme", "fruit"] },
  { myth: "Les Rois Mages étaient trois", truth: "La Bible ne précise pas leur nombre", keywords: ["Rois Mages", "trois", "3"] },
];

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

⚠️ PROTOCOLE DE VÉRIFICATION MULTI-SOURCES (OBLIGATOIRE) :

Pour CHAQUE fait, tu DOIS :
1. Chercher sur Wikipedia EN PREMIER comme référence principale
2. Croiser avec AU MOINS UNE source fiable supplémentaire :
   - Sites officiels (.gov, .edu, institutionnels)
   - Encyclopédies (Britannica, Larousse, Universalis, etc.)
   - Médias réputés (AFP, Reuters, BBC, Le Monde, etc.)
   - Bases spécialisées (IMDB pour le cinéma, Discogs pour la musique, etc.)

3. Un fait est VALIDÉ uniquement si :
   - Wikipedia ET une autre source sont d'accord
   - OU 2+ sources fiables non-Wikipedia sont d'accord
   - JAMAIS valider sur une seule source

4. Seuils de confiance basés sur les sources :
   - 95-100 : Wikipedia + 1 source officielle confirment
   - 85-94 : Wikipedia seul confirme (sans contradiction trouvée)
   - 70-84 : 1 seule source fiable confirme
   - <70 : Sources en désaccord OU sources douteuses uniquement

CRITÈRES DE VALIDATION (pour chaque question) :
- La réponse est-elle FACTUELLEMENT CORRECTE ? (vérifié multi-sources)
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

⚠️ DÉTECTION DES LÉGENDES URBAINES ET MYTHES POPULAIRES (CRITIQUE) :

Certains "faits" célèbres sont en réalité FAUX ou EXAGÉRÉS. Vérifie :

1. MYTHES HISTORIQUES COURANTS À REJETER :
   - "Caligula a nommé son cheval consul" → FAUX (il voulait le faire, jamais fait)
   - "Einstein était mauvais en maths" → FAUX
   - "On n'utilise que 10% de notre cerveau" → FAUX
   - "Les vikings portaient des casques à cornes" → FAUX
   - "Napoléon était petit" → MYTHE (taille moyenne pour l'époque)
   - "Marie-Antoinette a dit 'qu'ils mangent de la brioche'" → AUCUNE PREUVE
   - "Newton a découvert la gravité avec une pomme" → ANECDOTE NON PROUVÉE

2. RÈGLE DE VÉRIFICATION DES CLAIMS HISTORIQUES :
   - Si la question affirme qu'un personnage historique "A FAIT" quelque chose d'extraordinaire
   - VÉRIFIE si c'est un FAIT DOCUMENTÉ ou une LÉGENDE
   - Cherche "myth", "legend", "actually never", "commonly believed but false"
   - DIFFÉRENCIE : "a fait" vs "aurait voulu faire" vs "selon la légende"

3. FORMULATIONS PRUDENTES REQUISES :
   - Au lieu de "X a fait Y" → "X aurait fait Y" ou "Selon la légende, X..."
   - Au lieu de "X est le premier à" → Vérifier s'il y a controverse
   - Une affirmation trop catégorique pour un fait contesté = confidence MAX 60

4. CONFIANCE RÉDUITE POUR ANECDOTES EXTRAORDINAIRES :
   - Plus une affirmation est surprenante/WTF, plus elle doit être vérifiée
   - Une anecdote "trop belle pour être vraie" est souvent FAUSSE
   - Confiance MAX 70 pour les claims extraordinaires non vérifiés avec source

⚠️ Si tu détectes un MYTHE POPULAIRE présenté comme fait → isCorrect: false, confidence: 0
⚠️ Note le mythe détecté dans le champ "mythDetected"

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "results": [
    {
      "index": 0,
      "question": "La question...",
      "proposedAnswer": "La réponse proposée",
      "isCorrect": true | false,
      "confidence": 0-100,
      "sources": ["Source 1 URL/nom", "Source 2 URL/nom"],
      "sourceCount": 2,
      "wikipediaVerified": true | false,
      "reasoning": "Explication courte avec citations des sources",
      "correction": "Bonne réponse si incorrect (null si correct)",
      "ambiguity": "Pourquoi ambigu (null si pas d'ambiguïté)",
      "synonymIssue": "Si une autre option est synonyme/équivalent de la réponse (null sinon)",
      "wrongOptionIssue": "Si une mauvaise option pourrait être correcte, laquelle et pourquoi (null sinon)",
      "mythDetected": "Si un mythe/légende urbaine est présenté comme fait, lequel (null sinon)"
    }
  ],
  "summary": {
    "total": 10,
    "correct": 8,
    "incorrect": 1,
    "ambiguous": 1,
    "synonymIssues": 0,
    "wrongOptionIssues": 0,
    "mythsDetected": 0,
    "multiSourceVerified": 8,
    "singleSourceOnly": 2
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

6. COHÉRENCE SÉMANTIQUE QUESTION/RÉPONSE (CRITIQUE!)
   - La réponse répond-elle DIRECTEMENT à ce que la question demande ?
   - Si question propose des choix (A ou B) → réponse parmi les choix ?
   - Type de réponse attendu vs type de réponse donnée ?

   ✅ Mappings à vérifier :
   - "Pourquoi X ?" → Réponse = RAISON
   - "Qui a fait X ?" → Réponse = PERSONNE
   - "Quand X ?" → Réponse = DATE/PÉRIODE
   - "Où X ?" → Réponse = LIEU
   - "Combien X ?" → Réponse = NOMBRE
   - "Est-ce A ou B ?" → Réponse = A, B ou "les deux"

   ❌ Incohérences à rejeter :
   - "Pourquoi X fait Y ?" → Réponse : "Bleu" (couleur au lieu de raison)
   - "Est-ce A ou B ?" → Réponse : "C" (choix hors options)
   - "Qui a inventé X ?" → Réponse : "En 1954" (date au lieu de nom)

RÉPONDS en JSON (STRICTEMENT ce format) :
{
  "hasIssues": true | false,
  "ambiguityScore": 0-10,
  "issues": [
    {
      "type": "synonym" | "multiple_answers" | "wrong_option_correct" | "unclear_question" | "factual_error" | "qa_incoherence",
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
  type: 'synonym' | 'multiple_answers' | 'wrong_option_correct' | 'unclear_question' | 'factual_error' | 'qa_incoherence';
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

// ============================================================================
// MYTH DETECTION PROMPT - Dedicated check for urban legends
// ============================================================================

/**
 * Prompt for detecting myths and urban legends in questions.
 * This is a dedicated check that runs to ensure no popular myths
 * are presented as facts in the game.
 *
 * {QUESTION} - The question text
 * {ANSWER} - The proposed answer
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const MYTH_DETECTION_PROMPT = `Tu es un détecteur de MYTHES et LÉGENDES URBAINES.

QUESTION À VÉRIFIER :
{QUESTION}
RÉPONSE PROPOSÉE : {ANSWER}
ANECDOTE : {ANECDOTE}

INSTRUCTIONS :
1. UTILISE webSearch pour vérifier si cette affirmation est un MYTHE CONNU
2. Recherche : "[sujet] myth", "[sujet] actually false", "[sujet] legend debunked"
3. Vérifie si des sites de fact-checking (Snopes, Wikipedia, etc.) ont démenti ce fait

QUESTIONS CRITIQUES :
- Est-ce une LÉGENDE URBAINE présentée comme un fait ?
- La formulation est-elle trop catégorique pour un fait contesté ?
- Y a-t-il une nuance importante omise (aurait voulu vs a fait) ?
- L'affirmation est-elle "trop belle/étonnante pour être vraie" ?

MYTHES COURANTS À DÉTECTER (exemples) :
- Caligula et son cheval consul (jamais fait, seulement envisagé)
- Einstein mauvais en maths (faux, il excellait)
- 10% du cerveau utilisé (mythe total)
- Vikings avec casques à cornes (invention du 19ème siècle)
- Newton et la pomme (anecdote non prouvée)

RÉPONDS en JSON :
{
  "isMyth": true | false,
  "mythType": "urban_legend" | "exaggeration" | "misattribution" | "oversimplification" | null,
  "reality": "Ce qui s'est vraiment passé (si mythe)",
  "sources": ["URLs de vérification"],
  "suggestedReformulation": "Comment reformuler correctement (si mythe)",
  "confidence": 0-100
}

RÈGLES :
- isMyth = true → la question doit être REJETÉE ou REFORMULÉE
- confidence 95-100 : mythe certain, bien documenté
- confidence 70-94 : mythe probable, sources contradictoires
- confidence < 70 : doute, vérification supplémentaire nécessaire

Pas de markdown. JSON uniquement.`;

/**
 * Type definitions for myth detection results
 */
export interface MythDetectionResult {
  isMyth: boolean;
  mythType: 'urban_legend' | 'exaggeration' | 'misattribution' | 'oversimplification' | null;
  reality: string | null;
  sources: string[];
  suggestedReformulation: string | null;
  confidence: number;
}

/**
 * Builds the myth detection prompt with question data.
 *
 * @param question - The question text
 * @param answer - The proposed answer
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildMythDetectionPrompt(
  question: string,
  answer: string,
  anecdote?: string
): string {
  return MYTH_DETECTION_PROMPT
    .replace('{QUESTION}', question)
    .replace('{ANSWER}', answer)
    .replace('{ANECDOTE}', anecdote || 'Aucune');
}
