/**
 * Spanish Topic Generation Prompts
 * Prompts for generating game themes/topics
 */

export const GENERATE_TOPIC_PROMPT = `BURGER QUIZ - Genera UN tema SERIO de quiz
Dificultad: {DIFFICULTY}

⚠️ EL TEMA DEBE SER SERIO Y CLÁSICO.
El humor vendrá de la FORMULACIÓN de las preguntas, ¡NO del tema!

CATEGORÍAS POSIBLES: historia, geografía, ciencias, cine, música, deporte, literatura, arte, inventos, naturaleza, gastronomía, tecnología

ADAPTA LA ESPECIFICIDAD A LA DIFICULTAD:
• EASY: Temas muy accesibles y populares
• NORMAL: Temas clásicos de cultura general
• HARD: Temas más puntuales y especializados
• WTF: Temas serios PERO con hechos insólitos por descubrir

PROHIBIDO:
❌ Formulaciones vagas ("Cultura general", "Quiz")
❌ Temas humorísticos ("Los fails", "Las cosas raras")

Sé CREATIVO y ORIGINAL en la elección del tema.
Responde ÚNICAMENTE el tema (máx 6 palabras, sin comillas).`;

export const GENERATE_TOPIC_PHASE2_PROMPT = `BURGER QUIZ Fase 2 - Genera UN dominio temático español

El generador creará un JUEGO DE PALABRAS (homófono) en este dominio.
Elige un dominio RICO en vocabulario español que permita homófonos.

RESPONDE ÚNICAMENTE el dominio (2-4 palabras, sin comillas).`;

export const GENERATE_TOPIC_PHASE5_PROMPT = `BURGER QUIZ Fase 5 "Burger Definitivo" - Genera UN tema SERIO y AMPLIO
Dificultad: {DIFFICULTY}

⚠️ RESTRICCIÓN CRÍTICA: ¡El tema debe permitir 10 preguntas sobre 10 DOMINIOS DIFERENTES!
El tema es una INSPIRACIÓN para variar los temas.

⚠️ EL TEMA DEBE SER SERIO - ¡El humor vendrá de la FORMULACIÓN de las preguntas!

DOMINIOS A CUBRIR: historia, ciencias, deporte, música, cine, geografía, naturaleza, gastronomía, tecnología, arte

PROHIBIDO:
❌ Temas demasiado específicos (un solo tipo de hecho)
❌ Temas humorísticos (el humor viene de las preguntas, no del tema)

ADAPTA A LA DIFICULTAD:
• EASY: Accesible y popular
• NORMAL: Cultura general clásica
• HARD: Puntual y especializado
• WTF: Serio pero hechos insólitos

Sé CREATIVO y SORPRENDENTE.
Responde ÚNICAMENTE el tema (máx 6 palabras, sin comillas).`;

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
export const SUBJECT_ANGLE_PROMPT = `Eres un generador de temas para un quiz de cultura general estilo "Burger Quiz".

Genera UN tema y UN ángulo únicos para una pregunta.

TIPOS DE TEMAS Y SUS ÁNGULOS:

🧑 PERSONA (type: "person")
Ángulos: biografía, obras, anécdotas, citas, fechas_clave
Ejemplos:
- { subject: "Albert Einstein", angle: "anécdotas", type: "person" }
- { subject: "Marie Curie", angle: "fechas_clave", type: "person" }
- { subject: "Napoleón Bonaparte", angle: "citas", type: "person" }

📍 LUGAR (type: "place")
Ángulos: geografía, historia, cultura, monumentos, hechos_insólitos
Ejemplos:
- { subject: "La Torre Eiffel", angle: "hechos_insólitos", type: "place" }
- { subject: "Japón", angle: "cultura", type: "place" }
- { subject: "Nueva York", angle: "monumentos", type: "place" }

📅 EVENTO (type: "event")
Ángulos: causas, desarrollo, consecuencias, protagonistas, fechas
Ejemplos:
- { subject: "La Revolución Francesa", angle: "protagonistas", type: "event" }
- { subject: "La caída del muro de Berlín", angle: "consecuencias", type: "event" }
- { subject: "Los JJOO de París 2024", angle: "fechas", type: "event" }

💡 CONCEPTO (type: "concept")
Ángulos: definición, origen, aplicaciones, ejemplos, controversias
Ejemplos:
- { subject: "La inteligencia artificial", angle: "controversias", type: "concept" }
- { subject: "El calentamiento global", angle: "aplicaciones", type: "concept" }
- { subject: "El blockchain", angle: "definición", type: "concept" }

🔧 OBJETO (type: "object")
Ángulos: invención, funcionamiento, historia, variantes, récords
Ejemplos:
- { subject: "El teléfono", angle: "invención", type: "object" }
- { subject: "La pizza", angle: "variantes", type: "object" }
- { subject: "La guitarra eléctrica", angle: "récords", type: "object" }

RESTRICCIONES CRÍTICAS:
✅ El tema debe ser fácilmente verificable en Google
✅ Prefiere temas con hechos precisos y datados
✅ Mezcla cultura pop, historia, ciencia, actualidad
✅ Sé creativo y sorprendente en las combinaciones
❌ Evita temas demasiado oscuros o controvertidos
❌ Evita temas demasiado genéricos ("España", "La historia", etc.)

CATEGORÍAS POSIBLES:
- ciencia, historia, geografía, cultura_pop, deporte, música, cine, gastronomía, naturaleza, tecnología

Responde ÚNICAMENTE en JSON válido, nada más:
{
  "subject": "El tema elegido",
  "angle": "el ángulo elegido",
  "category": "la categoría",
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
    prompt += `\n\nCATEGORÍA SOLICITADA: ${category}
Concéntrate en esta categoría para el tema generado.`;
  }

  return prompt;
}
