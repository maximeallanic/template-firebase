/**
 * Spanish Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 * OPTIMIZED: Condensed prompts for faster generation
 */

export const PHASE1_PROMPT = `BURGER QUIZ - 10 preguntas Tenders
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

⚠️ REGLAS ESTRICTAS:
1. 4 opciones CREÍBLES del mismo registro (el jugador DUDA de verdad)
2. UNA SOLA respuesta correcta verificable, 3 FALSAS pero plausibles
3. Preguntas claras y directas (15 palabras máx)
4. Anécdota interesante y VERDADERA (20 palabras máx)

❌ PROHIBIDO: juegos de palabras en las opciones, duplicados

JSON: [{"text":"¿Pregunta original?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Dato WTF"}]`;

export const PHASE1_GENERATOR_PROMPT = `Eres un creador de preguntas BURGER QUIZ para la fase "Tenders" (Speed MCQ).

📋 CONTEXTO
Tema impuesto: {TOPIC}
Dificultad: {DIFFICULTY}
Número de preguntas: 10

🎯 REGLA #0 - COHERENCIA TEMÁTICA ESTRICTA
TODAS las 10 preguntas DEBEN tratar sobre el tema "{TOPIC}".
Explora 10 ángulos DIFERENTES del mismo tema.
❌ CERO preguntas fuera de tema toleradas.

🎯 REGLA #1 - EXACTITUD FACTUAL ABSOLUTA
Cada pregunta debe tener UNA SOLA respuesta correcta 100% verificable.
VERIFICA mentalmente cada hecho ANTES de escribirlo.
Las 3 respuestas incorrectas deben ser FALSAS pero creíbles.
❌ Sin ambigüedad posible entre las respuestas.

⚠️ ATENCIÓN A LOS MITOS Y LEYENDAS URBANAS:
Algunas "anécdotas famosas" son en realidad FALSAS:
- Verifica SIEMPRE las afirmaciones extraordinarias con una búsqueda
- Si una historia parece "demasiado bonita para ser verdad", probablemente lo sea
- Prefiere formulaciones prudentes para hechos contestados ("Según la leyenda...", "Habría...")
- Un error factual = RECHAZO de la pregunta completa

MITOS COMUNES A NO USAR NUNCA COMO HECHOS:
- Calígula NO nombró cónsul a su caballo
- Einstein era BUENO en matemáticas
- Los vikingos NO llevaban cascos con cuernos
- Newton y la manzana: anécdota NO PROBADA

🎯 REGLA #2 - OPCIONES CREÍBLES
Las 4 opciones deben ser CREÍBLES y del mismo registro.
El jugador debe DUDAR sinceramente entre las opciones.
❌ PROHIBIDO: juegos de palabras obvios, 4 opciones demasiado similares (ej: 4 palabras en "-ismo")
✅ OBLIGATORIO: Variedad de formatos (nombres, números, fechas, lugares, conceptos)
✅ TRAMPA: 1-2 respuestas sorprendentes que SUENAN verdaderas

🎯 REGLA #3 - DIVERSIDAD DE TEMAS
Alterna inteligentemente entre:
- Temas SERIOS (ciencias, historia, geografía)
- Temas LIGEROS (cultura pop, insólito, récords extraños)
- Hechos contraintuitivos o sorprendentes
❌ Sin preguntas similares o redundantes.

🎯 REGLA #4 - ANÉCDOTAS OBLIGATORIAS
Cada pregunta DEBE tener una anécdota WTF/insólita de 20 palabras máx.
La anécdota enriquece la respuesta correcta con un detalle sorprendente VERIFICABLE.
❌ La anécdota NO debe estar vacía o ser genérica.

{PREVIOUS_FEEDBACK}

FORMATO DE SALIDA (JSON puro, sin markdown):
[
  {
    "text": "¿Pregunta original aquí?",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 2,
    "anecdote": "Dato WTF sorprendente y verificable."
  }
]

Genera 10 preguntas DIFERENTES sobre el tema "{TOPIC}".`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Eres un revisor ESTRICTO para preguntas BURGER QUIZ Fase 1.

TEMA ESPERADO: {TOPIC}

PREGUNTAS A EVALUAR:
{QUESTIONS}

🔍 PARRILLA DE EVALUACIÓN ESTRICTA (10 criterios):

1. COHERENCIA TEMÁTICA (puntuación sobre 10)
   - ¿TODAS las preguntas tratan sobre "{TOPIC}"?
   - CERO tolerancia para preguntas fuera de tema
   - Puntuación < 8 = RECHAZO INMEDIATO

2. EXACTITUD FACTUAL (puntuación sobre 10)
   - ¿Cada respuesta correcta es 100% verdadera y verificable?
   - ¿Hay UNA SOLA respuesta correcta sin ambigüedad?
   - ¿Las respuestas incorrectas son realmente falsas?
   - Puntuación < 8 = RECHAZO INMEDIATO

3. CALIDAD DE LAS OPCIONES (puntuación sobre 10)
   - ¿Las 4 opciones suenan todas plausibles?
   - ¿Formatos variados (no 4 nombres en "-ismo" o 4 fechas similares)?
   - ¿Presencia de 1-2 opciones WTF/absurdas que suenan verdaderas?
   - ❌ Juegos de palabras obvios, invenciones cómicas
   - Puntuación < 7 = RECHAZO

4. HUMOR Y ESTILO (puntuación sobre 10)
   - ¿Formulaciones originales, absurdas, irreverentes?
   - ¿Las preguntas hacen sonreír?
   - Puntuación < 6 = RECHAZO

5. DIVERSIDAD DE ESTILOS (puntuación sobre 10)
   - ¿Estructuras de frases VARIADAS entre preguntas?
   - ¿Mix de preguntas directas, afirmativas, provocadoras?
   - Puntuación < 7 = RECHAZO

6. CLARIDAD (puntuación sobre 10)
   - ¿Preguntas cortas (≤ 15 palabras)?
   - ¿Sin ambigüedad en la formulación?
   - Puntuación < 7 = RECHAZO

7. VARIEDAD DE TEMAS (puntuación sobre 10)
   - ¿Mix serio/ligero?
   - ¿Sin duplicados o preguntas similares?
   - Puntuación < 7 = RECHAZO

8. ANÉCDOTAS (puntuación sobre 10)
   - ¿Cada pregunta tiene una anécdota WTF verificable?
   - ¿Anécdotas sorprendentes y no genéricas?
   - ¿Longitud razonable (≤ 20 palabras)?

9. ORIGINALIDAD (puntuación sobre 10)
   - ¿Preguntas inesperadas y frescas?
   - ¿Sin clichés o preguntas vistas 1000 veces?

10. CAPACIDAD DE ENGAÑO (puntuación sobre 10)
    - ¿Las preguntas realmente hacen dudar?
    - ¿El jugador puede equivocarse fácilmente?

⚠️ CRITERIOS DE RECHAZO AUTOMÁTICO:
- 1+ pregunta fuera de tema → approved: false
- 1+ error factual → approved: false
- 1+ ambigüedad → approved: false
- Opciones ridículas/demasiado similares → approved: false
- Duplicados internos → approved: false
- Anécdotas faltantes → approved: false
- No suficientemente divertido (humor < 6) → approved: false

✅ UMBRALES DE APROBACIÓN (TODOS requeridos):
- factual_accuracy ≥ 8
- options_quality ≥ 7
- humor ≥ 6
- clarity ≥ 7
- variety ≥ 7
- overall_score ≥ 7

FORMATO DE SALIDA (JSON puro, sin markdown):
{
  "approved": true|false,
  "scores": {
    "factual_accuracy": 1-10,
    "humor": 1-10,
    "clarity": 1-10,
    "variety": 1-10,
    "options_quality": 1-10
  },
  "overall_score": 1-10,
  "questions_feedback": [
    {
      "index": 0,
      "text": "Texto de la pregunta",
      "ok": true|false,
      "funny": true|false,
      "issue": "Descripción del problema si ok=false",
      "issue_type": "factual_error"|"off_topic"|"ambiguous"|"not_funny"|"too_long"|"duplicate"|"implausible_options"|"missing_anecdote"|null
    }
  ],
  "global_feedback": "Feedback detallado sobre el conjunto de preguntas",
  "suggestions": ["Sugerencia 1", "Sugerencia 2", "..."]
}

Sé IMPLACABLE. Es mejor rechazar e iterar que validar preguntas mediocres.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `REEMPLAZO - Genera {COUNT} pregunta(s) Burger Quiz
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

RECHAZADAS: {BAD_QUESTIONS}
RAZONES: {REJECTION_REASONS}

🎯 RECORDATORIO ANTI-SPOILER:
• NUNCA poner el rasgo distintivo en la pregunta
• Usar CONSECUENCIAS o ACCIONES indirectas
• 4 opciones DISTINTAS (sin sinónimos)

JSON: [{"text":"¿Pregunta sin spoiler?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Dato verificable"}]`;

export const REVIEW_PHASE1_PROMPT = `FACT-CHECK Fase 1: {QUESTIONS}

Verifica cada pregunta: 1) ¿Respuesta verdadera? 2) ¿Una sola respuesta posible? 3) ¿Estilo divertido? 4) ¿Anécdota verdadera?

JSON: {"reviews":[{"index":0,"status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"style"|"anecdote"|null}],"summary":{"approved":8,"rejected":2,"rejectedIndices":[3,7]}}`;

export const REGENERATE_PHASE1_PROMPT = `REGENERA {COUNT} pregunta(s) Burger Quiz
Tema: {TOPIC} | Dificultad: {DIFFICULTY}
Rechazadas: {REJECTED_REASONS}

Estilo divertido, respuestas verificables, 4 opciones creíbles.

JSON: [{"text":"¿Pregunta?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Dato WTF"}]`;
