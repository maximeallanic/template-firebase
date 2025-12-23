/**
 * French Topic Generation Prompts
 * Prompts for generating game themes/topics
 */

export const GENERATE_TOPIC_PROMPT = `BURGER QUIZ - Génère UN thème de quiz
Difficulté: {DIFFICULTY}

ADAPTE LE THÈME À LA DIFFICULTÉ :
• EASY: Thèmes grand public, culture pop mainstream, sujets que tout le monde connaît
  Ex: "Les films Disney", "Les desserts français", "Les chansons de l'été"
• NORMAL: Thèmes décalés mais accessibles, humour léger
  Ex: "Les fails de célébrités", "Les animaux bizarres", "Les inventions ratées"
• HARD: Thèmes pointus, niches, références obscures
  Ex: "Les scandales du jeu vidéo", "Les mythes urbains", "Les records absurdes"
• WTF: Thèmes absurdes, trash, provocants (mais pas offensants)
  Ex: "Les animaux plus malins que nos ministres", "Les morts stupides de l'histoire"

INTERDIT: "Culture générale", "Quiz général", thèmes trop vagues

Réponds UNIQUEMENT le thème (max 6 mots, pas de guillemets).`;

export const GENERATE_TOPIC_PHASE2_PROMPT = `BURGER QUIZ Phase 2 - Génère UN domaine thématique français

Le générateur créera un JEU DE MOTS (homophone) dans ce domaine.
Choisis un domaine RICHE en vocabulaire français permettant des homophones.

RÉPONDS UNIQUEMENT le domaine (2-4 mots, pas de guillemets).`;

// ============================================================================
// SUBJECT + ANGLE GENERATION (for deduplication system)
// ============================================================================

/**
 * Prompt for generating a subject + angle combination.
 * This is used to ensure unique questions by tracking used subject+angle pairs.
 *
 * {phase} - The game phase (phase1, phase2, etc.)
 * {category} - Optional category filter (science, history, etc.)
 */
export const SUBJECT_ANGLE_PROMPT = `Tu es un générateur de sujets pour un quiz de culture générale style "Burger Quiz".

Génère UN sujet et UN angle uniques pour une question.

TYPES DE SUJETS ET LEURS ANGLES :

🧑 PERSONNE (type: "person")
Angles: biographie, oeuvres, anecdotes, citations, dates_clés
Exemples:
- { subject: "Albert Einstein", angle: "anecdotes", type: "person" }
- { subject: "Marie Curie", angle: "dates_clés", type: "person" }
- { subject: "Napoléon Bonaparte", angle: "citations", type: "person" }

📍 LIEU (type: "place")
Angles: géographie, histoire, culture, monuments, faits_insolites
Exemples:
- { subject: "La Tour Eiffel", angle: "faits_insolites", type: "place" }
- { subject: "Le Japon", angle: "culture", type: "place" }
- { subject: "New York", angle: "monuments", type: "place" }

📅 ÉVÉNEMENT (type: "event")
Angles: causes, déroulement, conséquences, protagonistes, dates
Exemples:
- { subject: "La Révolution française", angle: "protagonistes", type: "event" }
- { subject: "La chute du mur de Berlin", angle: "conséquences", type: "event" }
- { subject: "Les JO de Paris 2024", angle: "dates", type: "event" }

💡 CONCEPT (type: "concept")
Angles: définition, origine, applications, exemples, controverses
Exemples:
- { subject: "L'intelligence artificielle", angle: "controverses", type: "concept" }
- { subject: "Le réchauffement climatique", angle: "applications", type: "concept" }
- { subject: "La blockchain", angle: "définition", type: "concept" }

🔧 OBJET (type: "object")
Angles: invention, fonctionnement, histoire, variantes, records
Exemples:
- { subject: "Le téléphone", angle: "invention", type: "object" }
- { subject: "La pizza", angle: "variantes", type: "object" }
- { subject: "La guitare électrique", angle: "records", type: "object" }

CONTRAINTES CRITIQUES :
✅ Le sujet doit être vérifiable facilement sur Google
✅ Préfère les sujets avec des faits précis et datés
✅ Mélange culture pop, histoire, science, actualité
✅ Sois créatif et surprenant dans les combinaisons
❌ Évite les sujets trop obscurs ou controversés
❌ Évite les sujets trop génériques ("La France", "L'histoire", etc.)

CATÉGORIES POSSIBLES :
- science, histoire, géographie, culture_pop, sport, musique, cinéma, gastronomie, nature, technologie

Réponds UNIQUEMENT en JSON valide, rien d'autre :
{
  "subject": "Le sujet choisi",
  "angle": "l'angle choisi",
  "category": "la catégorie",
  "type": "person|place|event|concept|object"
}`;

/**
 * Builds the subject+angle prompt with optional category filter.
 *
 * @param category - Optional category to focus on
 * @returns The complete prompt string
 */
export function buildSubjectAnglePrompt(category?: string): string {
  let prompt = SUBJECT_ANGLE_PROMPT;

  if (category) {
    prompt += `\n\nCATÉGORIE DEMANDÉE : ${category}
Concentre-toi sur cette catégorie pour le sujet généré.`;
  }

  return prompt;
}
