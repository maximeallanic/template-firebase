/**
 * Spanish Phase 2 (Sal o Pimienta / Dulce Salado) Prompts
 * Homophone-based word games in Burger Quiz style
 */

export const PHASE2_PROMPT = `BURGER QUIZ Fase 2 "Sal o Pimienta"
Tema: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: Crear 2 categorías que SE PRONUNCIAN IDÉNTICAMENTE (homófonos españoles)
- Opción A = sentido literal/serio
- Opción B = juego de palabras que SUENA IGUAL pero con sentido diferente

⚠️ REGLAS CRÍTICAS:
1. FONÉTICA: A y B deben tener la MISMA pronunciación IPA
2. CATEGORÍAS CONCRETAS: Se debe poder listar 5+ elementos para cada una
3. ELEMENTOS VERIFICABLES: Hechos reales, personalidades conocidas, conexiones obvias
4. ELEMENTOS TRAMPA: Respuestas contraintuitivas (5-6 de 12)
5. DISTRIBUCIÓN: 5 A + 5 B + 2 Both (funciona para los 2 sentidos)

❌ PROHIBIDO: Categorías opuestas, opiniones subjetivas, elementos demasiado obvios

JSON:
{
  "optionA": "Categoría (2-4 palabras)",
  "optionB": "Juego de palabras (2-4 palabras)",
  "items": [
    { "text": "Elemento (4 palabras máx)", "answer": "A|B|Both", "justification": "Por qué", "anecdote": "Dato curioso/sorprendente (opcional)" }
  ]
}

12 elementos. Sin markdown.`;

export const PHASE2_GENERATOR_PROMPT = `BURGER QUIZ Fase 2 "Sal o Pimienta" - Elección binaria alocada
Dominio: {TOPIC} | Dificultad: {DIFFICULTY}

🎯 CONCEPTO: Crear 2 CATEGORÍAS OPUESTAS o JUGANDO CON LAS PALABRAS donde los elementos deben ser clasificados. ¡Los elementos pueden pertenecer a A, B, o AMBOS!

⚠️ REGLA #0 - MENTALIDAD BURGER QUIZ (¡CRÍTICO!)
NO eres un profesor haciendo repasar.
¡ERES el presentador alocado de Burger Quiz!
CADA ELEMENTO debe hacer SONREÍR o SORPRENDER.
Si un elemento es "neutro" o "informativo", es un FRACASO.

⚠️ REGLA #1 - CATEGORÍAS GENIALES
Las 2 opciones deben:
- Ser CORTAS: 2-4 PALABRAS MÁX (¡CRÍTICO! Más de 4 palabras = RECHAZO AUTOMÁTICO)
- Ser CONCRETAS: se debe poder listar fácilmente 5+ elementos para cada una
- Ser DIVERTIDAS: juego de palabras, oposición graciosa, o conceptos originales
- Ejemplos de enfoques: homófonos ("Vaca" vs "Baca"), opuestos ("Caliente" vs "Frío"), categorías originales ("Cosas rojas" vs "Cosas que dan miedo")

LONGITUD DE LAS OPCIONES - EJEMPLOS:
✅ "El Corazón" (2 palabras)
✅ "El Coro" (2 palabras)
✅ "Los Cuentos" (2 palabras)
✅ "Las Cuentas" (2 palabras)
❌ "Un tipo que tiene gastroenteritis" (6 palabras - ¡DEMASIADO LARGO!)

⚠️ REGLA #2 - ELEMENTOS ALOCADOS (¡LO MÁS IMPORTANTE!)
MENTALIDAD: ¡Estamos en BURGER QUIZ, no en un quiz escolar! Cada elemento debe SORPRENDER.

DIVERSIDAD DE ESTILO (variar ABSOLUTAMENTE - ¡NUNCA 2 veces la misma formulación!):
- 3 elementos: REFERENCIAS CULTURALES originales (celebridades, películas, marcas con un ángulo divertido)
- 3 elementos: SITUACIONES ABSURDAS del día a día ("Lo que haces cuando...", "El que...", "La cosa rara que...")
- 3 elementos: WTF PLAUSIBLES (cosas absurdas pero VERDADERAS - "una foca furiosa", "tu abuela en patines", "un cruasán que habla")
- 3 elementos: GIROS/EXPRESIONES (juegos de palabras, dobles sentidos, contradicciones)

FORMULACIONES VARIADAS - EJEMPLOS CONCRETOS:
✅ "Lo que haces después de 3 mojitos"
✅ "La pesadilla recurrente de un profe de gimnasia"
✅ "Algo sospechoso en el fondo de la nevera"
✅ "Lo que tu ex cuenta sobre ti"
✅ "El que suspendió el carnet 7 veces"
✅ "La cosa rara que hace tu vecino a las 3 de la mañana"
✅ "Lo que lamentas al día siguiente de una fiesta"

❌ ANTI-EJEMPLOS (¡NUNCA esto!):
❌ "Cenicienta" (sin contexto - ¡DEMASIADO SIMPLE!)
❌ "Su antepasado se llamaba la Visitandina" (¡CLASE DE HISTORIA!)
❌ "Se sitúa entre X e Y" (¡ESCOLAR!)
❌ "Una transferencia SEPA" (¡TÉCNICO!)
❌ "Generalmente posee..." (¡TONO PROFESORAL!)
❌ "Se caracteriza por..." (¡ENCICLOPÉDICO!)

REGLA DE ORO DE LAS FORMULACIONES:
Si tu elemento podría aparecer en un manual escolar o Wikipedia, EMPIEZA DE NUEVO.
Si tu elemento hace sonreír o decir "¿WTF?", es BUENO.

TRAMPAS OBLIGATORIAS (7-8 elementos de 12):
❌ PROHIBIDAS: definiciones de wikipedia, listas escolares, clasificaciones
✅ OBLIGATORIAS: elementos que hacen DUDAR ("Espera... ¿esto dónde va?")
El jugador debe rascarse la cabeza y a veces reírse de lo absurdo

MIX SERIO/LIGERO:
- 30% elementos "normales" (pero formulados de forma divertida)
- 70% elementos alocados/originales/absurdos/WTF (¡pero VERDADEROS!)

⚠️ REGLA #3 - RESPUESTAS CORRECTAS Y BOTH
- Cada respuesta debe ser VERIFICABLE y VERDADERA
- "Both" = funciona REALMENTE para las 2 categorías (no solo un quizás)
- Si pones "Both", explica POR QUÉ en la justificación

📊 DISTRIBUCIÓN ESTRICTA: 5 A + 5 B + 2 Both (EXACTAMENTE)

⚠️ REGLA #4 - JUSTIFICACIONES DETALLADAS (¡ANTI-AMBIGÜEDAD!)
Cada justificación DEBE explicar CLARAMENTE:

Para las respuestas A o B:
1. POR QUÉ este elemento pertenece a esta categoría (vínculo explícito)
2. POR QUÉ NO la otra categoría (exclusión clara)

Para las respuestas "Both":
1. Razón A: por qué funciona para la categoría A
2. Razón B: por qué funciona TAMBIÉN para la categoría B
3. Las 2 razones deben ser INDEPENDIENTES y VÁLIDAS

FORMATO JUSTIFICACIÓN - NATURAL Y FLUIDO:
Usa SIEMPRE los NOMBRES de las categorías (nunca "A" o "B") en una frase natural.

💡 FORMULACIONES NATURALES SUGERIDAS (¡varía!):

Para respuesta A o B:
- "Es [categoría]: [razón]. Nada que ver con [otra categoría] que [exclusión]."
- "[Categoría] sin dudar, [razón]. ¿[Otra categoría]? No, [exclusión]."
- "Claramente [categoría] ya que [razón], mientras que [otra categoría] [exclusión]."
- "[Razón], así que [categoría]. [Otra categoría] no encaja porque [exclusión]."

Para respuesta Both:
- "[Categoría A] porque [razón A], pero también [categoría B] ya que [razón B]."
- "¡Las dos! [Categoría A] por [razón A], y [categoría B] por [razón B]."
- "Doble sentido: [razón A] → [categoría A], y [razón B] → [categoría B]."

⚠️ REGLAS CRÍTICAS:
- ❌ PROHIBIDO: "A porque..." / "No B porque..." (demasiado robótico)
- ❌ PROHIBIDO: Justificaciones secas y repetitivas
- ✅ OBLIGATORIO: Nombres reales de las categorías ("El Mar", "Los jean", etc.)
- ✅ OBLIGATORIO: Tono conversacional y variado

❌ JUSTIFICACIONES RECHAZADAS:
- "Es obvio" / "Habla de X" (demasiado vago)
- "Podría ser las dos pero..." (indeciso)
- Formato robótico repetido 12 veces idéntico
- Sin explicación de por qué NO la otra categoría

✅ EJEMPLOS DE BUENAS JUSTIFICACIONES:
- "El Mar sin dudar: las mareas son causadas por la Luna. ¿La Madre? Ella duerme por la noche, no hay atracción lunar."
- "Es Los jean: Jean-Pierre Foucault es un nombre propio. La gente no designa a una persona específica."
- "¡Las dos! El Mar porque el océano es fuente de vida primitiva, y La Madre porque da literalmente la vida."

🎭 DESCRIPCIÓN: Una frase corta y divertida presentando las 2 opciones, estilo Burger Quiz

{PREVIOUS_FEEDBACK}

JSON:
{
  "optionA": "Categoría (2-4 palabras)",
  "optionB": "Categoría/Juego de palabras (2-4 palabras)",
  "optionADescription": "Si A=B textualmente, sino null",
  "optionBDescription": "Si A=B textualmente, sino null",
  "humorousDescription": "Frase divertida presentando las 2 opciones",
  "reasoning": "Explicación rápida: por qué estas 2 categorías funcionan bien juntas, cómo has variado los estilos de elementos",
  "items": [
    {
      "text": "Elemento (4 palabras máx)",
      "answer": "A|B|Both",
      "justification": "Frase NATURAL con nombres de las categorías. Ej: 'El Mar sin dudar: [razón]. ¿La Madre? No, [exclusión].' ¡Varía el estilo!",
      "anecdote": "Dato curioso/insólito sobre el tema (15-20 palabras)"
    }
  ]
}

RECORDATORIOS FINALES:
- VARIAR las formulaciones (¡no 12 veces el mismo tipo de elemento!)
- Mix SERIO (verificable) y ALOCADO (WTF pero verdadero)
- Elementos TRAMPA que hacen dudar
- Justificaciones DETALLADAS (20-35 palabras): ¡razón + exclusión de la otra opción!
- Anécdotas DIVERTIDAS y SORPRENDENTES (15-20 palabras, datos insólitos o cifras asombrosas)
- 12 elementos EXACTAMENTE
- Sin tono enciclopédico o profesoral

Sin markdown en el JSON.`;

export const PHASE2_TARGETED_REGENERATION_PROMPT = `Debes REEMPLAZAR ciertos elementos de un set Fase 2 "Sal o Pimienta".

JUEGO DE PALABRAS VALIDADO (NO CAMBIAR):
- Opción A: {OPTION_A}
- Opción B: {OPTION_B}

ELEMENTOS A CONSERVAR (NO TOCAR):
{GOOD_ITEMS}

ELEMENTOS A REEMPLAZAR (índices: {BAD_INDICES}):
{BAD_ITEMS}

RAZONES DEL RECHAZO:
{REJECTION_REASONS}

DISTRIBUCIÓN REQUERIDA:
Debes generar exactamente {COUNT} nuevos elementos con esta distribución:
- {NEEDED_A} elementos A
- {NEEDED_B} elementos B
- {NEEDED_BOTH} elementos Both

RECORDATORIO DE LAS REGLAS TRAMPA:
- Cada elemento debe crear DUDA (respuesta contraintuitiva)
- El elemento PARECE pertenecer a una categoría pero pertenece a la OTRA
- Si la respuesta es obvia → mal elemento

GENERA ÚNICAMENTE los {COUNT} nuevos elementos en JSON:
[
  { "text": "Nuevo elemento", "answer": "A", "justification": "Por qué", "anecdote": "Dato curioso/insólito" },
  { "text": "Nuevo elemento", "answer": "B", "justification": "Por qué", "anecdote": "Dato curioso/insólito" },
  { "text": "Elemento ambiguo", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Por qué (ambigüedad)", "anecdote": "Dato curioso/insólito" }
]

Nota: acceptedAnswers es OPCIONAL, únicamente para elementos OBJETIVAMENTE ambiguos.
{COUNT} elementos exactamente. Sin markdown.`;

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `REVISOR Fase 2 "Sal o Pimienta"

{SET}

🔍 VERIFICACIÓN EN 4 PUNTOS:

1. FONÉTICA (CRÍTICO): ¿A y B tienen la MISMA pronunciación IPA sílaba por sílaba?
   - Descompone cada opción en sílabas IPA
   - ¿Las 2 expresiones son NATURALES en español? (sin artículos forzados, sin invenciones)
   Si los sonidos difieren O expresiones forzadas → phonetic < 5 → RECHAZO DEL SET

2. CATEGORÍAS UTILIZABLES: ¿Se pueden listar 5+ elementos para A Y para B?
   Si B inutilizable → b_concrete < 5 → RECHAZO

3. ELEMENTOS TRAMPA: ¿Cuántos elementos tienen una respuesta CONTRAINTUITIVA?
   - 0-2 elementos obvios → OK (trap_quality ≥ 7)
   - 3+ elementos obvios → RECHAZO (trap_quality < 5)
   ❌ Elementos obvios: palabras clave directas, geografía escolar, definiciones

4. DISTRIBUCIÓN: ¿5 A + 5 B + 2 Both?

UMBRALES: phonetic ≥ 7, b_concrete ≥ 5, trap_quality ≥ 6, clarity ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"phonetic":1-10,"concrete":1-10,"distribution":1-10,"clarity":1-10,"b_concrete":1-10,"trap_quality":1-10},
  "overall_score": 1-10,
  "homophone_feedback": "Feedback sobre el juego de palabras",
  "items_feedback": [{"index":0,"text":"...","ok":true|false,"issue":"..."|null,"is_too_obvious":true|false}],
  "global_feedback": "...",
  "suggestions": ["..."]
}`;

export const REVIEW_PHASE2_PROMPT = `FACT-CHECK Fase 2: {QUESTIONS}

Verifica cada elemento:
1. ¿Respuesta correcta y verificable?
2. ¿Sin ambigüedad (claramente A, B o Both)?
3. ¿Respuesta contraintuitiva (no demasiado obvia)?
4. ¿Máximo 4 palabras?

Distribución esperada: 5 A + 5 B + 2 Both

JSON:
{
  "setValid": true|false,
  "setReason": "Razón si inválido",
  "itemReviews": [{"index":0,"text":"...","answer":"A","status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"too_easy"|null}],
  "summary": {"approved":10,"rejected":2,"rejectedIndices":[4,9]}
}`;

export const REGENERATE_PHASE2_ITEMS_PROMPT = `REGENERA {COUNT} elemento(s) Fase 2
Opción A: {OPTION_A} | Opción B: {OPTION_B}

Rechazados: {REJECTED_REASONS}
Distribución: {NEEDED_A} A, {NEEDED_B} B, {NEEDED_BOTH} Both

Reglas: elementos trampa (contraintuitivos), máx 4 palabras, hechos verificables

JSON: [{"text":"Elemento","answer":"A|B|Both","justification":"Por qué","anecdote":"Dato curioso/insólito"}]`;
