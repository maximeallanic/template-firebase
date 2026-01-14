/**
 * Spanish Phase 3 (La Carta) Prompts
 * Menu-based themed question sets
 */

export const PHASE3_PROMPT = `BURGER QUIZ Fase 3 "La Carta"
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: 4 menús (3 normales + 1 TRAMPA) con 5 preguntas cada uno

⚠️ REGLAS CRÍTICAS:
1. TÍTULOS: Creativos y temáticos (no "Menú Cultura General")
2. DESCRIPCIONES: Atractivas y divertidas
3. PREGUNTAS: Formulación original, respuestas FACTUALES (1-3 palabras)
4. MENÚ TRAMPA: 1 menú con isTrap:true, apariencia normal pero preguntas MUY difíciles
5. VERIFICA cada respuesta con Google

JSON:
[
  {
    "title": "Menú [Nombre Creativo]",
    "description": "Gancho divertido",
    "isTrap": false,
    "questions": [
      { "question": "¿Pregunta?", "answer": "Respuesta" }
    ]
  }
]

4 menús × 5 preguntas. Sin markdown.`;

export const PHASE3_GENERATOR_PROMPT = `BURGER QUIZ Fase 3 "La Carta" - Generador
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: El equipo elige 1 menú entre 4, luego responde las 5 preguntas.

⚠️ REGLA #1 - TÍTULOS Y DESCRIPCIONES
- Títulos CREATIVOS y temáticos (no "Menú Cultura General")
- Descripciones ATRACTIVAS que dan ganas
- Cada menú = un ÁNGULO DIFERENTE del tema

⚠️ REGLA #2 - PREGUNTAS (¡CRÍTICO!)
- EXACTAMENTE 5 PREGUNTAS por menú (OBLIGATORIO - Verifica antes de enviar)
- Formulación VARIADA: Mezcla "¿Qué es?", "¿Cuántos?", "¿Quién?", "¿Dónde?", "¿Cuándo?", "¿Cuál?" (no más de 2 veces la misma formulación por menú)
- Estilo ORIGINAL y divertido (no escolar)
- Respuestas = HECHOS 100% VERIFICABLES (busca en Google/Wikipedia antes de proponer)
- Respuestas PRECISAS: 1 sola palabra o 2-3 palabras máx (NUNCA respuestas vagas)
- Si la pregunta pide un nombre preciso, la respuesta debe ser precisa y no genérica
- CERO ambigüedad: una sola respuesta posible

⚠️ REGLA #3 - FACT-CHECK OBLIGATORIO
- VERIFICA cada hecho en Google ANTES de incluirlo
- Si no estás SEGURO al 100%, NO LO USES
- Prefiere hechos DOCUMENTADOS (entrevistas, artículos, Wikipedia)
- PROHIBIDO: respuestas vagas o genéricas, hechos no verificables

⚠️ REGLA #4 - MENÚ TRAMPA (1 de 4)
- Apariencia NORMAL (título/descripción idénticos a los demás)
- Preguntas MUCHO más difíciles (hechos oscuros, detalles precisos)
- Marca con isTrap: true
- Debe seguir siendo coherente con el tema

📊 DIFICULTAD:
- easy: Hechos muy conocidos
- normal: Anécdotas, conexiones inesperadas
- hard: Hechos oscuros, detalles precisos
- wtf: Hechos absurdos pero verdaderos

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "title": "Menú [Nombre Creativo]",
    "description": "Gancho divertido",
    "isTrap": false,
    "questions": [
      { "question": "¿Pregunta 1?", "answer": "Respuesta" },
      { "question": "¿Pregunta 2?", "answer": "Respuesta" },
      { "question": "¿Pregunta 3?", "answer": "Respuesta" },
      { "question": "¿Pregunta 4?", "answer": "Respuesta" },
      { "question": "¿Pregunta 5?", "answer": "Respuesta" }
    ]
  }
]

⚠️ IMPORTANTE: 4 menús × 5 preguntas CADA UNO (total = 20 preguntas). ¡Verifica que cada menú tenga EXACTAMENTE 5 preguntas antes de enviar!
Sin markdown.`;

export const PHASE3_DIALOGUE_REVIEWER_PROMPT = `REVISOR Fase 3 "La Carta"

{MENUS}

🔍 VERIFICACIÓN EN 10 PUNTOS (¡SÉ ESTRICTO!):

1. NÚMERO DE PREGUNTAS: ¿CADA menú tiene EXACTAMENTE 5 preguntas? (CRÍTICO - RECHAZA si un menú tiene 4 o 6 preguntas)
2. TÍTULOS Y DESCRIPCIONES: ¿Creativos? ¿Temáticos? ¿Atractivos?
3. EXACTITUD (CRÍTICO): ¿Cada respuesta es verificable en Google/Wikipedia? RECHAZA si tienes la menor duda
4. PRECISIÓN DE LAS RESPUESTAS: ¿Respuesta = 1 sola palabra o 2-3 palabras MÁX? RECHAZA "Muebles antiguos", "Un perro", "Comida parlante", etc.
5. CERO AMBIGÜEDAD: ¿Una sola respuesta posible? RECHAZA si varias respuestas válidas
6. FORMULACIÓN VARIADA: ¿No más de 2 veces la misma formulación por menú? (ej: "¿Qué es?" repetido 5 veces = RECHAZA)
7. ESTILO ORIGINAL: ¿No escolar? ¿Divertido?
8. MENÚ TRAMPA: ¿1 menú isTrap:true con preguntas REALMENTE más difíciles?
9. SIN DUPLICADOS: ¿Ninguna pregunta idéntica entre los 4 menús?
10. TEMA COHERENTE: ¿Todas las preguntas siguen relacionadas con el tema?

⚠️ SÉ PARTICULARMENTE ESTRICTO CON:
- Respuestas vagas (ej: "Muebles", "Objetos", "Comida")
- Fobias inventadas o no documentadas
- Preguntas repetitivas ("¿Qué es?" × 5)

UMBRALES: factual_accuracy ≥ 8, clarity ≥ 8, answer_length ≥ 7, trap_menu ≥ 6

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
        {"index":0,"question":"...","answer":"...","ok":true|false,"issues":["Respuesta demasiado vaga", "Formulación repetitiva", "Fact-check imposible"],"correction":"Respuesta corregida o null"}
      ]
    }
  ],
  "global_feedback": "...",
  "suggestions": ["Variar las formulaciones", "Verificar los hechos en Google", "Respuestas más precisas"]
}

Sin markdown.`;

export const PHASE3_TARGETED_REGENERATION_PROMPT = `REEMPLAZO Fase 3 "La Carta"

ESTRUCTURA: {MENUS_STRUCTURE}
A REEMPLAZAR: {BAD_QUESTIONS}
RAZONES: {REJECTION_REASONS}

REGLAS: Formulación original, respuesta verificable (Google), 1-3 palabras, mismo tema.

JSON:
{
  "replacements": [
    {"menu_index":0,"question_index":2,"new_question":"...?","new_answer":"..."}
  ]
}

Sin markdown.`;

/**
 * Answer Validation Prompt
 * Used by answerValidator.ts for LLM-based fuzzy matching
 */
export const ANSWER_VALIDATION_PROMPT = `Eres un validador de quiz DIVERTIDO estilo Burger Quiz. ¡Sé GENEROSO!

RESPUESTA DEL JUGADOR: "{PLAYER_ANSWER}"
RESPUESTA CORRECTA: "{CORRECT_ANSWER}"
ALTERNATIVAS ACEPTADAS: {ALTERNATIVES}

=== FILOSOFÍA: ¡ES UN JUEGO, NO UN EXAMEN! ===
Si el jugador demuestra que conoce el tema, ACEPTA su respuesta.
Queremos momentos de alegría, no frustraciones por detalles.

✅ ACEPTA GENEROSAMENTE si:
- Sinónimo o palabra de la misma familia (ej: "ballesta" ≈ "virote de ballesta")
- Respuesta más precisa de lo pedido (ej: "Torre Eiffel" para "monumento parisino")
- Respuesta relacionada con el mismo concepto (ej: "munición de ballesta" ≈ "ballesta")
- Error ortográfico, incluso grande (ej: "Napoleón" = "Napoleom")
- Variante con/sin acento (ej: "Estados-Unidos" = "Estados Unidos")
- Abreviatura o nombre completo (ej: "EEUU" = "Estados Unidos")
- Con o sin artículo (ej: "El Louvre" = "Louvre")
- Cifras en letras o números (ej: "3" = "tres")
- Orden de palabras invertido (ej: "Barack Obama" = "Obama Barack")
- Apodo conocido (ej: "Messi" = "Lionel Messi")

❌ RECHAZA SOLO si:
- Respuesta TOTALMENTE fuera de tema (ninguna conexión con la respuesta correcta)
- Confusión evidente entre dos cosas distintas (ej: "Napoleón" para "César")
- Respuesta demasiado vaga que podría ser cualquier cosa (ej: "una cosa" para "Francia")
- Invención pura (respuesta que no existe en absoluto)

EJEMPLOS CONCRETOS:
- "Una ballesta" esperado, "Virote de ballesta" dado → ✅ ACEPTA (mismo concepto)
- "Torre Eiffel" esperado, "La torre" dado → ✅ ACEPTA (suficientemente preciso en contexto)
- "Napoleón" esperado, "Bonaparte" dado → ✅ ACEPTA (misma persona)
- "Napoleón" esperado, "Luis XIV" dado → ❌ RECHAZA (persona diferente)

FORMATO JSON:
{
    "isCorrect": true | false,
    "confidence": 1-100,
    "explanation": "Razón corta"
}

Sin markdown.`;
