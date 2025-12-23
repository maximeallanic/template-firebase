/**
 * French Phase 4 (La Note) Prompts
 * MCQ Race - Culture Générale classique
 */

export const PHASE4_PROMPT = `BURGER QUIZ Phase 4 "La Note" - QCM Race
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Course de rapidité, premier à répondre correctement gagne.

⚠️ RÈGLES :
1. 4 options par question (1 correcte, 3 distracteurs PLAUSIBLES)
2. Réponses VÉRIFIABLES (utilise Google)
3. Mix de thèmes : histoire, géo, sciences, arts, sport

JSON:
[
  {
    "text": "Question claire ?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fait amusant (optionnel)"
  }
]

10 questions. Pas de markdown.`;

export const PHASE4_GENERATOR_PROMPT = `BURGER QUIZ Phase 4 "La Note" - QCM Culture Générale
Thème suggéré : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : Course de rapidité QCM - Culture générale variée comme au Burger Quiz TV !

⚠️ RÈGLE #1 - VARIÉTÉ THÉMATIQUE (CRITIQUE !)
ATTENTION : Le thème ci-dessus n'est qu'une SUGGESTION pour 2-3 questions maximum.
Les 10 questions DOIVENT impérativement couvrir des domaines VARIÉS :

RÉPARTITION OBLIGATOIRE :
- 2-3 questions Histoire / Géographie (dates, pays, personnages historiques)
- 2-3 questions Sciences / Nature / Animaux (biologie, physique, astronomie)
- 2-3 questions Arts / Musique / Cinéma (œuvres, artistes, films)
- 2-3 questions Sport / Pop culture / Vie quotidienne (records, célébrités, traditions)

INTERDIT : Plus de 3 questions sur le même sujet. Varie à fond !

⚠️ RÈGLE #2 - FORMAT QCM
- 4 options (1 correcte, 3 distracteurs PLAUSIBLES du même registre)
- Questions claires et directes (max 25 mots)
- Anecdote courte et percutante (max 30 mots)

⚠️ RÈGLE #3 - RÉPARTITION DIFFICULTÉ
- 3 FACILES (connaissance commune : capitales, dates célèbres, films cultes)
- 4 MOYENNES (culture générale solide nécessaire)
- 3 DIFFICILES (anecdotes pointues, détails méconnus)

⚠️ RÈGLE #4 - STYLE BURGER QUIZ
- Mix questions classiques ET anecdotes décalées/WTF
- Certaines réponses peuvent surprendre (mais TOUJOURS vraies !)
- Ton léger, parfois humoristique, toujours vérifiable

⚠️ RÈGLE #5 - EXACTITUDE ABSOLUE
UTILISE Google pour vérifier CHAQUE réponse avant de l'écrire.
Aucune ambiguïté, aucun débat possible. Si tu hésites, change de question.

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "text": "Question précise ?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fait vérifié et percutant"
  }
]

10 questions VARIÉES. Pas de markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 4 "La Note" (QCM)

{QUESTIONS}

🔍 VÉRIFICATION EN 4 POINTS :

1. EXACTITUDE (CRITIQUE) : Réponses vraies ? Utilise Google !
2. OPTIONS : 4 options plausibles du même registre ?
3. DIFFICULTÉ : 3 faciles + 4 moyennes + 3 difficiles ?
4. VARIÉTÉ : Mix histoire, géo, sciences, arts, sport ?

SEUILS : factual_accuracy ≥ 7, option_plausibility ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"factual_accuracy":1-10,"option_plausibility":1-10,"difficulty_balance":1-10,"thematic_variety":1-10,"clarity":1-10,"anecdote_quality":1-10},
  "overall_score": 1-10,
  "difficulty_distribution": {"easy":[0,1,2],"medium":[3,4,5,6],"hard":[7,8,9]},
  "questions_feedback": [
    {"index":0,"question":"...","correct_option":"...","ok":true|false,"difficulty":"easy|medium|hard","issues":[],"correction":null}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Pas de markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT Phase 4 "La Note" (QCM)

GARDER : {GOOD_QUESTIONS}
REMPLACER (indices {BAD_INDICES}) : {BAD_QUESTIONS}
RAISONS : {REJECTION_REASONS}

RÈGLES : 4 options plausibles, 1 correcte, vérifie avec Google, anecdote optionnelle.

JSON:
[
  {"text":"...?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"..."}
]

{COUNT} questions. Pas de markdown.`;
