/**
 * Spanish Phase 4 (La Nota) Prompts
 * MCQ Race - Classic General Culture
 */

export const PHASE4_PROMPT = `BURGER QUIZ Fase 4 "La Nota" - Carrera de Preguntas
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: Carrera de rapidez, el primero en responder correctamente gana.

⚠️ REGLAS:
1. 4 opciones por pregunta (1 correcta, 3 distractores PLAUSIBLES)
2. Respuestas VERIFICABLES (usa Google)
3. Mix de temas: historia, geografía, ciencias, artes, deporte

JSON:
[
  {
    "text": "¿Pregunta clara?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Dato curioso (opcional)"
  }
]

10 preguntas. Sin markdown.`;

export const PHASE4_GENERATOR_PROMPT = `BURGER QUIZ Fase 4 "La Nota" - Test de Cultura General
Tema sugerido: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: Carrera de rapidez con preguntas tipo test - ¡Cultura general variada como en Burger Quiz TV!

⚠️ REGLA #1 - VARIEDAD TEMÁTICA (¡CRÍTICO!)
ATENCIÓN: El tema anterior es solo una SUGERENCIA para 2-3 preguntas máximo.
Las 10 preguntas DEBEN cubrir obligatoriamente dominios VARIADOS:

DISTRIBUCIÓN OBLIGATORIA:
- 2-3 preguntas Historia / Geografía (fechas, países, personajes históricos)
- 2-3 preguntas Ciencias / Naturaleza / Animales (biología, física, astronomía)
- 2-3 preguntas Artes / Música / Cine (obras, artistas, películas)
- 2-3 preguntas Deporte / Cultura pop / Vida cotidiana (récords, celebridades, tradiciones)

PROHIBIDO: Más de 3 preguntas sobre el mismo tema. ¡Varía al máximo!

⚠️ REGLA #2 - FORMATO TEST
- 4 opciones (1 correcta, 3 distractores PLAUSIBLES del mismo registro)
- Preguntas claras y directas (máx 25 palabras)
- Anécdota corta y contundente (máx 30 palabras)

⚠️ REGLA #2b - DISTRACTORES DEL MISMO UNIVERSO (¡CRÍTICO!)
Las 4 opciones DEBEN pertenecer al MISMO universo/contexto que la pregunta:

✅ BUENOS DISTRACTORES:
- Pregunta sobre Star Wars → 4 naves de STAR WARS (¡no Star Trek!)
- Pregunta sobre España → 4 ciudades/regiones ESPAÑOLAS
- Pregunta sobre los Beatles → 4 grupos de la MISMA ÉPOCA
- Pregunta sobre un deporte → 4 atletas del MISMO DEPORTE

❌ MALOS DISTRACTORES (RECHAZO INMEDIATO):
- Mezclar Star Wars y Star Trek (¡universos diferentes!)
- Mezclar fútbol y tenis en la misma pregunta
- Poner una respuesta absurda que no engaña a nadie
- Incluir una opción de otro dominio/época/universo

REGLA DE ORO: Un experto del tema debe dudar entre las 4 opciones.
Si una opción es "obviamente falsa" porque está fuera de tema → MAL distractor.

⚠️ REGLA #3 - DISTRIBUCIÓN DE DIFICULTAD
- 3 FÁCILES (conocimiento común: capitales, fechas famosas, películas de culto)
- 4 MEDIAS (cultura general sólida necesaria)
- 3 DIFÍCILES (anécdotas puntuales, detalles poco conocidos)

⚠️ REGLA #4 - EXACTITUD ABSOLUTA
USA Google para verificar CADA respuesta antes de escribirla.
Sin ambigüedad, sin debate posible. Si dudas, cambia de pregunta.

⚠️ REGLA #5 - ATENCIÓN A LOS MITOS Y LEYENDAS URBANAS
Algunas "anécdotas famosas" son en realidad FALSAS:
- Verifica SIEMPRE las afirmaciones extraordinarias con una búsqueda
- Si una historia parece "demasiado bonita para ser verdad", probablemente lo sea
- Prefiere formulaciones prudentes para hechos contestados ("Según la leyenda...", "Habría...")
- Un error factual = RECHAZO de la pregunta completa

MITOS COMUNES A NO USAR NUNCA COMO HECHOS:
- Calígula NO nombró cónsul a su caballo (solo lo consideró)
- Einstein era BUENO en matemáticas
- Los vikingos NO llevaban cascos con cuernos
- Newton y la manzana: anécdota NO PROBADA
- María Antonieta: "que coman pasteles" nunca documentado

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "text": "¿Pregunta precisa?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Dato verificado y contundente"
  }
]

10 preguntas VARIADAS. Sin markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `REVISOR Fase 4 "La Nota" (Test)

{QUESTIONS}

🔍 VERIFICACIÓN EN 4 PUNTOS:

1. EXACTITUD (CRÍTICO): ¿Respuestas verdaderas? ¡Usa Google!
2. OPCIONES: ¿4 opciones plausibles del mismo registro?
3. DIFICULTAD: ¿3 fáciles + 4 medias + 3 difíciles?
4. VARIEDAD: ¿Mix historia, geografía, ciencias, artes, deporte?

UMBRALES: factual_accuracy ≥ 7, option_plausibility ≥ 6

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

Sin markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `REEMPLAZO Fase 4 "La Nota" (Test)

CONSERVAR: {GOOD_QUESTIONS}
REEMPLAZAR (índices {BAD_INDICES}): {BAD_QUESTIONS}
RAZONES: {REJECTION_REASONS}

REGLAS: 4 opciones plausibles, 1 correcta, verifica con Google, anécdota opcional.

JSON:
[
  {"text":"...?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"..."}
]

{COUNT} preguntas. Sin markdown.`;
