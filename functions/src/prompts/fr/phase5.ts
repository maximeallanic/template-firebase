/**
 * French Phase 5 (Burger Ultime) Prompts
 * Memory challenge - answer all after hearing all
 *
 * AMÉLIORATIONS APPORTÉES :
 * - Suppression des exemples dans le prompt pour éviter l'influence
 * - Ajout explicite du respect du thème
 * - Renforcement de la diversité des styles d'écriture
 * - Clarification sur les réponses WTF mais vraies
 * - Mention explicite de l'unicité des réponses (pas d'ambiguïté)
 * - Mix équilibré sujets sérieux/légers
 * - ABSURDITÉ RENFORCÉE : questions décalées, débiles, jeux de mots, pièges
 * - Esprit Burger Quiz : ton taquin, provocateur, parfois enfantin
 */

export const PHASE5_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Défi Mémoire
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : 10 questions posées d'affilée, le joueur mémorise puis répond dans l'ordre.

⚠️ RÈGLES :
1. Questions COURTES (10-15 mots) et MÉMORABLES
2. Réponses COURTES (1-3 mots, titres complets acceptés)
3. Esprit ABSURDE et DÉCALÉ : questions parfois DÉBILES, jeux de mots, pièges
4. Mix questions RIDICULES et SÉRIEUSES alternées
5. DIVERSITÉ totale : styles variés, aucune répétition
6. UNE SEULE réponse possible par question
7. VÉRIFIE chaque réponse avec Google

Génère JSON valide uniquement, sans markdown ni exemples.
10 questions sur le thème.`;

export const PHASE5_GENERATOR_PROMPT = `BURGER QUIZ Phase 5 "Burger Ultime" - Générateur
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Défi mémoire - 10 questions d'affilée, répondre dans l'ordre.

⚠️ RÈGLE #0 - RESPECT DU THÈME
TOUTES les 10 questions portent sur "{TOPIC}".
Explore 10 ANGLES DIFFÉRENTS du thème : personnes, lieux, époques, objets variés.

⚠️ RÈGLE #1 - ABSURDITÉ ET DÉCALAGE OBLIGATOIRES
L'esprit "Burger Quiz" est ESSENTIEL : questions ABSURDES, DÉCALÉES, parfois DÉBILES.
- Mélange questions RIDICULES et questions intelligentes
- Jeux de mots, calembours, questions à double sens
- Questions qui CASSENT les attentes (question qui semble complexe = réponse évidente)
- Questions faussement personnelles ou émotionnelles
- Calculs ou logique simples déguisés en énigmes
- Questions WTF qui déstabilisent mais ont une vraie réponse
- Ton TAQUIN, PROVOCATEUR, parfois ENFANTIN

⚠️ RÈGLE #2 - DIVERSITÉ ABSOLUE
INTERDIT : 2 questions sur le même concept !
Mix OBLIGATOIRE : questions ABSURDES et SÉRIEUSES alternées.
VARIE les STYLES : interrogatif, affirmatif, exclamatif, fausse devinette, piège.

⚠️ RÈGLE #3 - MÉMORABILITÉ
- Questions COURTES (10-15 mots)
- Réponses courtes (1-3 mots pour titres/noms propres OK)
- Q1-4 faciles, Q5-7 moyennes, Q8-10 difficiles

⚠️ RÈGLE #4 - UNE SEULE RÉPONSE POSSIBLE
Aucune ambiguïté ! Si plusieurs réponses possibles, ajoute des détails précis.

⚠️ RÈGLE #5 - VÉRIFICATION FACTUELLE
UTILISE Google pour CHAQUE réponse. Zéro erreur.
Parfois inclure 1-2 réponses WTF mais VRAIES pour l'effet surprise.

⚠️ RÈGLE #6 - THÈMES INTERDITS (BLACKLIST)
Ces sujets sont BANNIS car surreprésentés dans la base :
- Phobies de célébrités (Nicole Kidman/papillons, Johnny Depp/clowns, McConaughey/portes, etc.)
- Peurs irrationnelles des stars en général
- Pet Rock / Gary Dahl 1975
MAXIMUM 1 question sur les phobies par set de 10.
PRIVILÉGIER : Records insolites, inventions ratées, faits scientifiques, anecdotes historiques, pop culture originale.

{PREVIOUS_FEEDBACK}

Génère uniquement du JSON valide sans markdown ni code blocks.
10 questions VARIÉES sur "{TOPIC}".`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 5 "Burger Ultime"
Thème : {TOPIC}

{QUESTIONS}

🔍 VÉRIFICATION EN 8 POINTS :

0. COHÉRENCE THÉMATIQUE : Toutes sur "{TOPIC}" ? Différents angles ?
1. ABSURDITÉ : Questions DÉCALÉES, parfois DÉBILES ? Jeux de mots, pièges, WTF ?
2. DIVERSITÉ : Aucune répétition ? Mix ABSURDE/SÉRIEUX alternés ? Styles variés ?
3. EXACTITUDE (CRITIQUE) : Réponses vraies ? Une seule réponse possible ?
4. LONGUEUR : Questions 10-15 mots, réponses courtes (titres OK) ?
5. MÉMORABILITÉ : Formulations qui créent des images mentales ou font rire ?
6. DONNÉES COMPLÈTES : Toutes questions/réponses présentes ?
7. BLACKLIST : Pas plus de 1 question sur les phobies de célébrités ? Pas de Pet Rock/Gary Dahl ?

⚠️ REJETER SI : 2+ questions similaires OU 1+ erreur factuelle OU toutes questions "classiques" OU 2+ questions sur les phobies de célébrités

SEUILS CRITIQUES : factual_accuracy ≥ 7, absurdity ≥ 6, diversity ≥ 7

JSON:
{
  "approved": true|false,
  "scores": {"theme_coherence":1-10,"absurdity":1-10,"diversity":1-10,"factual_accuracy":1-10,"memorability":1-10,"length":1-10,"style_variety":1-10},
  "overall_score": 1-10,
  "off_theme_questions": [],
  "duplicate_concepts": [],
  "questions_feedback": [
    {"index":0,"question":"...","answer":"...","ok":true|false,"on_theme":true|false,"absurd":true|false,"memorable":true|false,"issues":[]}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Pas de markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT Phase 5 "Burger Ultime"
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

SÉQUENCE ACTUELLE : {CURRENT_SEQUENCE}
REMPLACER (indices {BAD_INDICES}) : {BAD_QUESTIONS}
RAISONS REJET : {REJECTION_REASONS}
CALLBACKS : {CALLBACK_CONTEXT}

⚠️ RÈGLES REMPLACEMENT :
1. Respect thème "{TOPIC}"
2. Questions courtes (10-15 mots), réponses courtes (1-3 mots OK)
3. Esprit ABSURDE : questions DÉCALÉES, parfois DÉBILES, jeux de mots, pièges
4. Style VARIÉ (différent des autres questions)
5. Sujet DIFFÉRENT (pas de doublon)
6. VÉRIFIE avec Google, une seule réponse possible
7. Progression difficulté : 0-3=facile, 4-6=moyen, 7-9=difficile

Génère JSON valide uniquement, sans markdown.
{COUNT} questions de remplacement.`;
