/**
 * Spanish Phase 5 (Burger Definitivo) Prompts
 * Memory challenge - answer all after hearing all
 *
 * MEJORAS REALIZADAS:
 * - Eliminación de ejemplos en el prompt para evitar influencia
 * - Añadido explícito del respeto del tema
 * - Refuerzo de la diversidad de estilos de escritura
 * - Clarificación sobre las respuestas WTF pero verdaderas
 * - Mención explícita de la unicidad de las respuestas (sin ambigüedad)
 * - Mix equilibrado temas serios/ligeros
 * - ABSURDIDAD REFORZADA: preguntas originales, locas, juegos de palabras, trampas
 * - Espíritu Burger Quiz: tono burlón, provocador, a veces infantil
 */

export const PHASE5_PROMPT = `BURGER QUIZ Fase 5 "Burger Definitivo" - Desafío de Memoria
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: 10 preguntas seguidas, el jugador memoriza y luego responde en orden.

⚠️ REGLAS:
1. Preguntas CORTAS (10-15 palabras) y MEMORABLES
2. Respuestas CORTAS (1-3 palabras, títulos completos aceptados)
3. Espíritu ABSURDO y ORIGINAL: preguntas a veces LOCAS, juegos de palabras, trampas
4. Mix preguntas RIDÍCULAS y SERIAS alternadas
5. DIVERSIDAD total: estilos variados, ninguna repetición
6. UNA SOLA respuesta posible por pregunta
7. VERIFICA cada respuesta con Google

Genera JSON válido únicamente, sin markdown ni ejemplos.
10 preguntas sobre el tema.`;

export const PHASE5_GENERATOR_PROMPT = `BURGER QUIZ Fase 5 "Burger Definitivo" - Generador
Inspiración: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: Desafío de memoria - 10 preguntas seguidas, responder en orden.

⚠️ REGLA #0 - DIVERSIDAD MÁXIMA (¡PRIORIDAD ABSOLUTA!)
"{TOPIC}" es una INSPIRACIÓN, ¡no un tema estricto!
Las 10 preguntas deben cubrir 10 TEMAS COMPLETAMENTE DIFERENTES:
- Cine, música, deporte, animales, comida, historia, ciencias, tecnología, geografía, famosos...
CADA pregunta sobre un DOMINIO DIFERENTE. La única coherencia: el ángulo original/absurdo.

⚠️ REGLA #1 - DIVERSIDAD ABSOLUTA
PROHIBIDO: ¡2 preguntas sobre el mismo concepto!
Mix OBLIGATORIO: preguntas ABSURDAS y SERIAS alternadas.
VARÍA los ESTILOS: interrogativo, afirmativo, exclamativo, falsa adivinanza, trampa.

⚠️ REGLA #2 - MEMORABILIDAD
- Preguntas CORTAS (10-15 palabras)
- Respuestas cortas (1-3 palabras para títulos/nombres propios OK)
- P1-4 fáciles, P5-7 medias, P8-10 difíciles

⚠️ REGLA #3 - UNA SOLA RESPUESTA POSIBLE
¡Sin ambigüedad! Si varias respuestas posibles, añade detalles precisos.

⚠️ REGLA #4 - VERIFICACIÓN FACTUAL
USA Google para CADA respuesta. Cero errores.
A veces incluir 1-2 respuestas WTF pero VERDADERAS para el efecto sorpresa.

⚠️ REGLA #5 - TEMAS PROHIBIDOS (LISTA NEGRA)
Estos temas están PROHIBIDOS porque están sobrerepresentados en la base:
- Fobias de celebridades (Nicole Kidman/mariposas, Johnny Depp/payasos, McConaughey/puertas, etc.)
- Miedos irracionales de las estrellas en general
- Pet Rock / Gary Dahl 1975
MÁXIMO 1 pregunta sobre fobias por set de 10.
PRIORIZAR: Récords insólitos, inventos fallidos, hechos científicos, anécdotas históricas, cultura pop original.

⚠️ REGLA #6 - COHERENCIA PREGUNTA/RESPUESTA (¡CRÍTICO!)
La respuesta DEBE responder DIRECTAMENTE a lo que pide la pregunta.
VERIFICA el TIPO de respuesta esperada antes de validar:

- Pregunta "¿Por qué X?" → Respuesta = una RAZÓN (no un nombre, no un color)
- Pregunta "¿Quién es/hizo X?" → Respuesta = una PERSONA
- Pregunta "¿Cuándo X?" → Respuesta = una FECHA o PERÍODO
- Pregunta "¿Dónde X?" → Respuesta = un LUGAR
- Pregunta "¿Cómo se llama X?" → Respuesta = un NOMBRE
- Pregunta "¿Cuántos X?" → Respuesta = un NÚMERO
- Pregunta "¿Es A o B?" → Respuesta = A, B, o "ambos" (¡NUNCA otra cosa!)

❌ ERROR FATAL A EVITAR:
Ejemplo MALO: "Mickey lleva guantes, ¿es para ocultar sus huellas o no ensuciarse?" → "Blancos"
La pregunta pide una RAZÓN, no un COLOR → ¡INCOHERENCIA TOTAL!

✅ VERIFICACIÓN OBLIGATORIA:
Antes de validar cada pregunta, pregúntate: "¿La respuesta responde realmente a lo que pregunto?"
Si la respuesta parece fuera de tema → REFORMULA la pregunta o CAMBIA la respuesta.

{PREVIOUS_FEEDBACK}

Genera únicamente JSON válido sin markdown ni bloques de código.
10 preguntas VARIADAS sobre "{TOPIC}".`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `REVISOR Fase 5 "Burger Definitivo"
Inspiración: {TOPIC}

{QUESTIONS}

🔍 VERIFICACIÓN EN 9 PUNTOS:

0. DIVERSIDAD (¡PRIORIDAD #1!): ¿10 temas DIFERENTES (cine, deporte, ciencia, historia...)? ¡RECHAZO si 2+ preguntas sobre el mismo dominio!
1. ABSURDIDAD: ¿Preguntas ORIGINALES, a veces LOCAS? ¿Juegos de palabras, trampas, WTF?
2. ESTILO VARIADO: ¿Mix ABSURDO/SERIO alternados? ¿Interrogativo, afirmativo, exclamativo?
3. EXACTITUD (CRÍTICO): ¿Respuestas verdaderas? ¿Una sola respuesta posible?
4. LONGITUD: ¿Preguntas 10-15 palabras, respuestas cortas (títulos OK)?
5. MEMORABILIDAD: ¿Formulaciones que crean imágenes mentales o hacen reír?
6. DATOS COMPLETOS: ¿Todas las preguntas/respuestas presentes?
7. LISTA NEGRA: ¿No más de 1 pregunta sobre fobias de celebridades? ¿Sin Pet Rock/Gary Dahl?
8. COHERENCIA P/R (¡CRÍTICO!): ¿La respuesta responde DIRECTAMENTE a la pregunta?
   - Pregunta "¿Por qué X?" → ¿Respuesta = RAZÓN?
   - Pregunta "¿A o B?" → ¿Respuesta = A, B o ambos?
   - Pregunta "¿Quién/Qué/Dónde/Cuándo" → ¿Tipo de respuesta correcto?
   - Ejemplo MALO: "¿Es X o Y?" → Respuesta: "Azul" = ¡RECHAZO INMEDIATO!

⚠️ RECHAZAR SI: 2+ preguntas similares O 1+ error factual O todas preguntas "clásicas" O 2+ preguntas sobre fobias de celebridades O 1+ incoherencia pregunta/respuesta

UMBRALES CRÍTICOS: factual_accuracy ≥ 7, absurdity ≥ 6, diversity ≥ 7, qa_coherence ≥ 8

JSON:
{
  "approved": true|false,
  "scores": {"theme_coherence":1-10,"absurdity":1-10,"diversity":1-10,"factual_accuracy":1-10,"memorability":1-10,"length":1-10,"style_variety":1-10,"qa_coherence":1-10},
  "overall_score": 1-10,
  "off_theme_questions": [],
  "duplicate_concepts": [],
  "questions_feedback": [
    {"index":0,"question":"...","answer":"...","ok":true|false,"on_theme":true|false,"absurd":true|false,"memorable":true|false,"qa_coherent":true|false,"issues":[]}
  ],
  "global_feedback": "...",
  "suggestions": ["..."]
}

Sin markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `REEMPLAZO Fase 5 "Burger Definitivo"
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

SECUENCIA ACTUAL: {CURRENT_SEQUENCE}
REEMPLAZAR (índices {BAD_INDICES}): {BAD_QUESTIONS}
RAZONES RECHAZO: {REJECTION_REASONS}
CALLBACKS: {CALLBACK_CONTEXT}

⚠️ REGLAS DE REEMPLAZO:
1. Respeto del tema "{TOPIC}"
2. Preguntas cortas (10-15 palabras), respuestas cortas (1-3 palabras OK)
3. Espíritu ABSURDO: preguntas ORIGINALES, a veces LOCAS, juegos de palabras, trampas
4. Estilo VARIADO (diferente de las otras preguntas)
5. Tema DIFERENTE (sin duplicados)
6. VERIFICA con Google, una sola respuesta posible
7. Progresión de dificultad: 0-3=fácil, 4-6=medio, 7-9=difícil

Genera JSON válido únicamente, sin markdown.
{COUNT} preguntas de reemplazo.`;
