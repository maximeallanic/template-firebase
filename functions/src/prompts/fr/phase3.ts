/**
 * French Phase 3 (La Carte) Prompts
 * Menu-based themed question sets
 */

export const PHASE3_PROMPT = `BURGER QUIZ Phase 3 "La Carte"
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : 4 menus (3 normaux + 1 PIÈGE) avec 5 questions chacun

⚠️ RÈGLES CRITIQUES :
1. TITRES : Créatifs et thématiques (pas "Menu Culture Générale")
2. DESCRIPTIONS : Accrocheuses et drôles
3. QUESTIONS : Formulation décalée, réponses FACTUELLES (1-3 mots)
4. MENU PIÈGE : 1 menu avec isTrap:true, apparence normale mais questions TRÈS difficiles
5. VÉRIFIE chaque réponse avec Google

JSON:
[
  {
    "title": "Menu [Nom Créatif]",
    "description": "Accroche fun",
    "isTrap": false,
    "questions": [
      { "question": "Question ?", "answer": "Réponse" }
    ]
  }
]

4 menus × 5 questions. Pas de markdown.`;

export const PHASE3_GENERATOR_PROMPT = `BURGER QUIZ Phase 3 "La Carte" - Générateur
Thème : {TOPIC} | Difficulté : {DIFFICULTY}

🎯 CONCEPT : L'équipe choisit 1 menu parmi 4, puis répond aux 5 questions.

⚠️ RÈGLE #1 - TITRES & DESCRIPTIONS
- Titres CRÉATIFS et thématiques (pas "Menu Culture Générale")
- Descriptions ACCROCHEUSES qui donnent envie
- Chaque menu = un ANGLE DIFFÉRENT du thème

⚠️ RÈGLE #2 - QUESTIONS
- Formulation DÉCALÉE et drôle (pas scolaire)
- Réponses = FAITS VÉRIFIABLES (utilise Google)
- Réponses courtes : 1-3 mots max

⚠️ RÈGLE #3 - MENU PIÈGE (1 sur 4)
- Apparence NORMALE (titre/description identiques aux autres)
- Questions BEAUCOUP plus difficiles (faits obscurs)
- Marque avec isTrap: true

📊 DIFFICULTÉ :
- easy : Faits très connus
- normal : Anecdotes, liens inattendus
- hard : Faits obscurs, détails précis
- wtf : Faits absurdes mais vrais

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "title": "Menu [Nom Créatif]",
    "description": "Accroche fun",
    "isTrap": false,
    "questions": [
      { "question": "Question décalée ?", "answer": "Réponse 1-3 mots" }
    ]
  }
]

4 menus × 5 questions. Pas de markdown.`;

export const PHASE3_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Phase 3 "La Carte"

{MENUS}

🔍 VÉRIFICATION EN 5 POINTS :

1. TITRES & DESCRIPTIONS : Créatifs ? Thématiques ? Accrocheurs ?
2. EXACTITUDE (CRITIQUE) : Réponses vérifiables ? Utilise Google !
3. FORMULATION : Style décalé (pas scolaire) ?
4. MENU PIÈGE : 1 menu isTrap:true avec questions plus dures ?
5. RÉPONSES : 1-3 mots max ?

SEUILS : factual_accuracy ≥ 7, title_creativity ≥ 5, trap_menu ≥ 5

JSON:
{
  "approved": true|false,
  "scores": {"title_creativity":1-10,"descriptions":1-10,"thematic_variety":1-10,"question_style":1-10,"factual_accuracy":1-10,"clarity":1-10,"difficulty":1-10,"answer_length":1-10,"trap_menu":1-10},
  "overall_score": 1-10,
  "menus_feedback": [
    {
      "menu_index": 0,
      "title": "...",
      "title_ok": true|false,
      "questions_feedback": [
        {"index":0,"question":"...","answer":"...","ok":true|false,"issues":[],"correction":null}
      ]
    }
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Pas de markdown.`;

export const PHASE3_TARGETED_REGENERATION_PROMPT = `REMPLACEMENT Phase 3 "La Carte"

STRUCTURE : {MENUS_STRUCTURE}
À REMPLACER : {BAD_QUESTIONS}
RAISONS : {REJECTION_REASONS}

RÈGLES : Formulation décalée, réponse vérifiable (Google), 1-3 mots, même thème.

JSON:
{
  "replacements": [
    {"menu_index":0,"question_index":2,"new_question":"...?","new_answer":"..."}
  ]
}

Pas de markdown.`;

/**
 * Answer Validation Prompt
 * Used by answerValidator.ts for LLM-based fuzzy matching
 */
export const ANSWER_VALIDATION_PROMPT = `Tu es un validateur de quiz FUN style Burger Quiz. Sois GÉNÉREUX !

RÉPONSE JOUEUR : "{PLAYER_ANSWER}"
RÉPONSE CORRECTE : "{CORRECT_ANSWER}"
ALTERNATIVES ACCEPTÉES : {ALTERNATIVES}

=== PHILOSOPHIE : C'EST UN JEU, PAS UN EXAMEN ! ===
Si le joueur montre qu'il connaît le sujet, ACCEPTE sa réponse.
On veut des moments de joie, pas des frustrations sur des détails.

✅ ACCEPTE GÉNÉREUSEMENT si :
- Synonyme ou mot de la même famille (ex: "arbalète" ≈ "carreau d'arbalète")
- Réponse plus précise que demandé (ex: "Tour Eiffel" pour "monument parisien")
- Réponse liée au même concept (ex: "munition d'arbalète" ≈ "arbalète")
- Faute d'orthographe, même grosse (ex: "Napoleyon" = "Napoléon")
- Variante avec/sans accent (ex: "Etats-Unis" = "États-Unis")
- Abréviation ou nom complet (ex: "USA" = "États-Unis")
- Avec ou sans article (ex: "Le Louvre" = "Louvre")
- Chiffres en lettres ou nombres (ex: "3" = "trois")
- Ordre des mots inversé (ex: "Barack Obama" = "Obama Barack")
- Surnom connu (ex: "Messi" = "Lionel Messi")

❌ REFUSE SEULEMENT si :
- Réponse TOTALEMENT hors sujet (aucun lien avec la bonne réponse)
- Confusion évidente entre deux choses distinctes (ex: "Napoléon" pour "César")
- Réponse trop vague qui pourrait être n'importe quoi (ex: "un truc" pour "France")
- Invention pure (réponse qui n'existe pas du tout)

EXEMPLES CONCRETS :
- "Une arbalète" attendu, "Carreau d'arbalète" donné → ✅ ACCEPTE (même concept)
- "Tour Eiffel" attendu, "La tour" donné → ✅ ACCEPTE (assez précis dans le contexte)
- "Napoléon" attendu, "Bonaparte" donné → ✅ ACCEPTE (même personne)
- "Napoléon" attendu, "Louis XIV" donné → ❌ REFUSE (personne différente)

FORMAT JSON :
{
    "isCorrect": true | false,
    "confidence": 1-100,
    "explanation": "Raison courte"
}

Pas de markdown.`;
