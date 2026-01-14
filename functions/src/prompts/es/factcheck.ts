/**
 * Spanish Fact-Checking Prompts
 * Prompts for verifying generated content accuracy
 */

// ============================================================================
// COMMON MYTHS DATABASE - Urban legends that MUST be detected and rejected
// ============================================================================

/**
 * Lista de mitos y leyendas urbanas comunes a detectar (50+)
 * Si una pregunta repite uno de estos mitos como hecho, debe ser rechazada
 */
export const COMMON_MYTHS = [
  // === MITOS HISTÓRICOS ===
  { myth: "Calígula nombró cónsul a su caballo", truth: "Solo consideró hacerlo", keywords: ["Calígula", "Incitatus", "cónsul"] },
  { myth: "María Antonieta dijo 'que coman pasteles'", truth: "Sin prueba histórica, atribuido a Rousseau", keywords: ["María Antonieta", "pasteles", "brioche"] },
  { myth: "Los vikingos llevaban cascos con cuernos", truth: "Invención romántica del siglo XIX", keywords: ["vikingos", "cascos", "cuernos"] },
  { myth: "Napoleón era bajo", truth: "1m68, estatura media para la época", keywords: ["Napoleón", "bajo", "estatura"] },
  { myth: "Newton descubrió la gravedad con una manzana", truth: "Anécdota probablemente apócrifa", keywords: ["Newton", "manzana", "gravedad"] },
  { myth: "Cristóbal Colón demostró que la Tierra era redonda", truth: "Los griegos lo sabían 2000 años antes", keywords: ["Colón", "Tierra", "redonda", "plana"] },
  { myth: "Los gladiadores siempre luchaban a muerte", truth: "Raro, eran demasiado costosos de entrenar", keywords: ["gladiadores", "muerte", "arena"] },
  { myth: "Cleopatra era egipcia", truth: "Era de origen griego (Ptolomeo)", keywords: ["Cleopatra", "egipcia", "griega"] },
  { myth: "Los cinturones de castidad existían en la Edad Media", truth: "Invención del siglo XIX", keywords: ["cinturón", "castidad", "Edad Media"] },
  { myth: "Quemaban brujas en la Edad Media", truth: "Sobre todo en el Renacimiento, y a menudo ahorcamiento", keywords: ["brujas", "quemadas", "Edad Media"] },
  { myth: "Salieri envenenó a Mozart", truth: "Sin pruebas, mito romántico", keywords: ["Salieri", "Mozart", "envenenó"] },
  { myth: "Van Gogh se cortó toda la oreja", truth: "Solo el lóbulo", keywords: ["Van Gogh", "oreja", "cortó"] },
  { myth: "Las pirámides fueron construidas por esclavos", truth: "Por trabajadores asalariados", keywords: ["pirámides", "esclavos", "Egipto"] },

  // === MITOS CIENTÍFICOS ===
  { myth: "Einstein era malo en matemáticas", truth: "Sobresalía en matemáticas", keywords: ["Einstein", "malo", "matemáticas"] },
  { myth: "Solo usamos el 10% del cerebro", truth: "Usamos todo nuestro cerebro", keywords: ["10%", "cerebro"] },
  { myth: "La muralla china es visible desde el espacio", truth: "Demasiado estrecha para ser visible", keywords: ["muralla", "China", "espacio", "visible"] },
  { myth: "Los murciélagos son ciegos", truth: "Ven muy bien", keywords: ["murciélagos", "ciegos"] },
  { myth: "Los peces dorados tienen 3 segundos de memoria", truth: "Tienen varios meses de memoria", keywords: ["pez", "dorado", "memoria", "segundos"] },
  { myth: "Los avestruces meten la cabeza en la arena", truth: "Nunca hacen eso", keywords: ["avestruz", "cabeza", "arena"] },
  { myth: "La sangre desoxigenada es azul", truth: "Siempre es roja", keywords: ["sangre", "azul", "venas"] },
  { myth: "El rayo nunca cae dos veces en el mismo lugar", truth: "Puede caer en el mismo lugar", keywords: ["rayo", "cae", "mismo lugar"] },
  { myth: "Los humanos tenemos 5 sentidos", truth: "Tenemos al menos 9 (equilibrio, dolor, etc.)", keywords: ["5 sentidos", "cinco sentidos"] },
  { myth: "Tragamos 8 arañas al año durmiendo", truth: "Leyenda urbana sin fundamento", keywords: ["arañas", "tragar", "dormir"] },
  { myth: "El pelo/uñas siguen creciendo después de morir", truth: "La piel se retrae dando esa ilusión", keywords: ["pelo", "uñas", "muerte", "crecen"] },
  { myth: "El agua conduce la electricidad", truth: "El agua pura es aislante, son las impurezas", keywords: ["agua", "electricidad", "conductor"] },
  { myth: "El girasol sigue al sol", truth: "Solo las plantas jóvenes, no las flores maduras", keywords: ["girasol", "sol", "sigue"] },
  { myth: "Los camaleones cambian de color para camuflarse", truth: "Es para la comunicación y la temperatura", keywords: ["camaleón", "color", "camuflaje"] },
  { myth: "Perdemos el calor corporal por la cabeza", truth: "Perdemos igual por toda superficie expuesta", keywords: ["calor", "cabeza", "perder"] },
  { myth: "Los lemmings se suicidan en masa", truth: "Mito creado por Disney", keywords: ["lemmings", "suicidio", "acantilado"] },
  { myth: "El vidrio es un líquido muy viscoso", truth: "Es un sólido amorfo", keywords: ["vidrio", "líquido", "viscoso"] },

  // === MITOS ALIMENTARIOS ===
  { myth: "El azúcar vuelve hiperactivos a los niños", truth: "Sin prueba científica", keywords: ["azúcar", "niños", "hiperactivos"] },
  { myth: "Hay que esperar antes de bañarse después de comer", truth: "Sin riesgo de ahogamiento probado", keywords: ["bañarse", "comer", "digestión", "esperar"] },
  { myth: "La leche es buena para los huesos", truth: "Pocas pruebas, los países grandes consumidores tienen más osteoporosis", keywords: ["leche", "huesos", "calcio"] },
  { myth: "Comer zanahorias mejora la vista", truth: "Propaganda británica de la WWII", keywords: ["zanahorias", "vista", "ojos"] },
  { myth: "El chocolate da granos", truth: "Sin vínculo científico probado", keywords: ["chocolate", "granos", "acné"] },
  { myth: "El alcohol calienta", truth: "Dilata los vasos y hace perder calor", keywords: ["alcohol", "calienta", "frío"] },

  // === MITOS CULTURALES Y GEOGRÁFICOS ===
  { myth: "Los inuit tienen 50 palabras para la nieve", truth: "Exageración lingüística", keywords: ["inuit", "esquimales", "nieve", "palabras"] },
  { myth: "Frankenstein es el nombre del monstruo", truth: "Es el nombre del doctor", keywords: ["Frankenstein", "monstruo", "doctor"] },
  { myth: "Sherlock Holmes dijo 'Elemental, mi querido Watson'", truth: "Nunca en los libros originales", keywords: ["Sherlock", "Holmes", "Elemental", "Watson"] },
  { myth: "El tomate es una verdura", truth: "Es botánicamente una fruta", keywords: ["tomate", "verdura", "fruta"] },
  { myth: "Papá Noel rojo fue inventado por Coca-Cola", truth: "Ya existía en rojo antes", keywords: ["Papá Noel", "Coca-Cola", "rojo"] },
  { myth: "Los toros se enfadan con el rojo", truth: "Son daltónicos, es el movimiento lo que los enfada", keywords: ["toro", "rojo", "corrida"] },
  { myth: "Las arenas movedizas aspiran a la gente", truth: "Imposible hundirse completamente", keywords: ["arenas", "movedizas", "hundirse"] },

  // === MITOS TECNOLÓGICOS ===
  { myth: "Mac no puede tener virus", truth: "Solo son menos objetivo", keywords: ["Mac", "Apple", "virus"] },
  { myth: "Los teléfonos causan cáncer", truth: "Sin prueba científica sólida", keywords: ["teléfono", "cáncer", "ondas"] },
  { myth: "Hay que vaciar completamente la batería antes de recargar", truth: "Obsoleto con las baterías de litio-ion", keywords: ["batería", "vaciar", "recargar"] },
  { myth: "La NASA gastó millones en un bolígrafo espacial", truth: "Paul Fisher invirtió sus propios fondos, la NASA solo compró los bolígrafos a 6$ cada uno", keywords: ["NASA", "bolígrafo", "Fisher", "millones", "lápiz", "espacio"] },

  // === MITOS SOBRE PERSONALIDADES ===
  { myth: "Walt Disney está criogenizado", truth: "Fue incinerado", keywords: ["Disney", "criogenizado", "congelado"] },
  { myth: "Marilyn Monroe tenía un CI de 168", truth: "Sin prueba fiable", keywords: ["Marilyn", "Monroe", "CI"] },
  { myth: "Al Capone murió en prisión", truth: "Murió en su casa de sífilis", keywords: ["Al Capone", "prisión", "murió"] },

  // === MITOS RELIGIOSOS/BÍBLICOS ===
  { myth: "Adán y Eva comieron una manzana", truth: "La Biblia habla de un 'fruto' no especificado", keywords: ["Adán", "Eva", "manzana", "fruto"] },
  { myth: "Los Reyes Magos eran tres", truth: "La Biblia no precisa su número", keywords: ["Reyes Magos", "tres", "3"] },
];

export const FACT_CHECK_PROMPT = `Eres un verificador de hechos ESTRICTO y RIGUROSO.
Tu misión: verificar si una respuesta a una pregunta es 100% CORRECTA.

PREGUNTA: {QUESTION}
RESPUESTA PROPUESTA: {ANSWER}
CONTEXTO (opcional): {CONTEXT}

INSTRUCCIONES:
1. USA la herramienta webSearch para verificar la respuesta propuesta
2. Busca fuentes FIABLES (Wikipedia, sitios oficiales, enciclopedias)
3. No te fíes de tu memoria - VERIFICA con una búsqueda

CRITERIOS DE VALIDACIÓN:
- ¿La respuesta es FACTUALMENTE CORRECTA?
- ¿La respuesta es la ÚNICA respuesta posible a esta pregunta?
- ¿Hay AMBIGÜEDAD en la pregunta o la respuesta?

RESPONDE en JSON (ESTRICTAMENTE este formato):
{
  "isCorrect": true | false,
  "confidence": 0-100,
  "source": "Fuente utilizada para verificar (URL o referencia)",
  "reasoning": "Explicación corta de por qué la respuesta es correcta o incorrecta",
  "correction": "Si incorrecto, ¿cuál es la respuesta correcta? (null si correcto)",
  "ambiguity": "Si ambiguo, ¿por qué? (null si no hay ambigüedad)"
}

REGLAS DE CONFIANZA:
- 95-100: Hecho verificado con fuente fiable, ninguna duda
- 80-94: Probablemente correcto, fuente encontrada pero no 100% segura
- 60-79: Duda significativa, fuentes contradictorias o incompletas
- 0-59: Probablemente falso o imposible de verificar

Sin markdown. Solo JSON.`;

export const FACT_CHECK_BATCH_PROMPT = `Eres un verificador de hechos ESTRICTO y RIGUROSO.
Tu misión: verificar si las respuestas a varias preguntas son 100% CORRECTAS y SIN AMBIGÜEDAD.

PREGUNTAS A VERIFICAR:
{QUESTIONS_JSON}

⚠️ PROTOCOLO DE VERIFICACIÓN MULTI-FUENTES (OBLIGATORIO):

Para CADA hecho, DEBES:
1. Buscar en Wikipedia EN PRIMER LUGAR como referencia principal
2. Cruzar con AL MENOS UNA fuente fiable adicional:
   - Sitios oficiales (.gov, .edu, institucionales)
   - Enciclopedias (Britannica, Larousse, etc.)
   - Medios reputados (AFP, Reuters, BBC, El País, etc.)
   - Bases especializadas (IMDB para cine, Discogs para música, etc.)

3. Un hecho es VALIDADO únicamente si:
   - Wikipedia Y otra fuente están de acuerdo
   - O 2+ fuentes fiables no-Wikipedia están de acuerdo
   - NUNCA validar con una sola fuente

4. Umbrales de confianza basados en las fuentes:
   - 95-100: Wikipedia + 1 fuente oficial confirman
   - 85-94: Solo Wikipedia confirma (sin contradicción encontrada)
   - 70-84: 1 sola fuente fiable confirma
   - <70: Fuentes en desacuerdo O solo fuentes dudosas

CRITERIOS DE VALIDACIÓN (para cada pregunta):
- ¿La respuesta es FACTUALMENTE CORRECTA? (verificado multi-fuentes)
- ¿La respuesta es la ÚNICA respuesta posible?
- ¿Hay AMBIGÜEDAD?

⚠️ VERIFICACIÓN DE LAS RESPUESTAS INCORRECTAS (CRÍTICO):
Para los tests, verifica también que las opciones incorrectas son REALMENTE FALSAS:
- Ninguna opción incorrecta debería ser una respuesta aceptable
- Verifica si una opción incorrecta podría ser considerada correcta según ciertas fuentes
- Si una opción incorrecta es potencialmente correcta → señalarla

Ejemplos de problemas a detectar:
- Pregunta sobre el inventor de X, pero una opción incorrecta también contribuyó significativamente
- Pregunta sobre el primero en hacer X, pero es controvertido y otra opción podría ser válida
- Pregunta geográfica donde varias respuestas podrían ser válidas
- Una opción incorrecta es técnicamente correcta en un contexto diferente

⚠️ DETECCIÓN DE SINÓNIMOS Y EQUIVALENTES (CRÍTICO):
Para los tests con opciones múltiples, verifica si:
- Una opción incorrecta es un SINÓNIMO de la respuesta correcta (ej: "Conserje" = "Portero")
- Dos opciones significan lo MISMO en diferentes lenguas/contextos
- Una opción podría ser IGUALMENTE CORRECTA según la interpretación
- Términos técnicos tienen ALIAS comunes (ej: "Sodio" = "Natrio")

Ejemplos de SINÓNIMOS a detectar:
- Conserje / Portero / Guardián
- Aguacate / Palta
- Maíz / Elote (México)
- Fútbol / Balompié
- Berenjena / Eggplant
- Calabacín / Zucchini

⚠️ DETECCIÓN DE LEYENDAS URBANAS Y MITOS POPULARES (CRÍTICO):

Algunos "hechos" famosos son en realidad FALSOS o EXAGERADOS. Verifica:

1. MITOS HISTÓRICOS COMUNES A RECHAZAR:
   - "Calígula nombró cónsul a su caballo" → FALSO (quería hacerlo, nunca lo hizo)
   - "Einstein era malo en matemáticas" → FALSO
   - "Solo usamos el 10% del cerebro" → FALSO
   - "Los vikingos llevaban cascos con cuernos" → FALSO
   - "Napoleón era bajo" → MITO (estatura media para la época)
   - "María Antonieta dijo 'que coman pasteles'" → SIN PRUEBA
   - "Newton descubrió la gravedad con una manzana" → ANÉCDOTA NO PROBADA

2. REGLA DE VERIFICACIÓN DE AFIRMACIONES HISTÓRICAS:
   - Si la pregunta afirma que un personaje histórico "HIZO" algo extraordinario
   - VERIFICA si es un HECHO DOCUMENTADO o una LEYENDA
   - Busca "myth", "legend", "actually never", "commonly believed but false"
   - DIFERENCIA: "hizo" vs "habría querido hacer" vs "según la leyenda"

3. FORMULACIONES PRUDENTES REQUERIDAS:
   - En lugar de "X hizo Y" → "X habría hecho Y" o "Según la leyenda, X..."
   - En lugar de "X es el primero en" → Verificar si hay controversia
   - Una afirmación demasiado categórica para un hecho contestado = confianza MÁX 60

4. CONFIANZA REDUCIDA PARA ANÉCDOTAS EXTRAORDINARIAS:
   - Cuanto más sorprendente/WTF es una afirmación, más debe verificarse
   - Una anécdota "demasiado bonita para ser verdad" es a menudo FALSA
   - Confianza MÁX 70 para afirmaciones extraordinarias no verificadas con fuente

⚠️ Si detectas un MITO POPULAR presentado como hecho → isCorrect: false, confidence: 0
⚠️ Anota el mito detectado en el campo "mythDetected"

RESPONDE en JSON (ESTRICTAMENTE este formato):
{
  "results": [
    {
      "index": 0,
      "question": "La pregunta...",
      "proposedAnswer": "La respuesta propuesta",
      "isCorrect": true | false,
      "confidence": 0-100,
      "sources": ["Fuente 1 URL/nombre", "Fuente 2 URL/nombre"],
      "sourceCount": 2,
      "wikipediaVerified": true | false,
      "reasoning": "Explicación corta con citas de las fuentes",
      "correction": "Respuesta correcta si incorrecta (null si correcta)",
      "ambiguity": "Por qué ambiguo (null si no hay ambigüedad)",
      "synonymIssue": "Si otra opción es sinónimo/equivalente de la respuesta (null si no)",
      "wrongOptionIssue": "Si una opción incorrecta podría ser correcta, cuál y por qué (null si no)",
      "mythDetected": "Si un mito/leyenda urbana se presenta como hecho, cuál (null si no)"
    }
  ],
  "summary": {
    "total": 10,
    "correct": 8,
    "incorrect": 1,
    "ambiguous": 1,
    "synonymIssues": 0,
    "wrongOptionIssues": 0,
    "mythsDetected": 0,
    "multiSourceVerified": 8,
    "singleSourceOnly": 2
  }
}

REGLAS DE CONFIANZA:
- 95-100: Hecho verificado, ninguna duda, sin sinónimos, opciones incorrectas verificadas falsas
- 80-94: Probablemente correcto, sin sinónimos evidentes, opciones incorrectas probablemente falsas
- 60-79: Duda significativa O sinónimo potencial O opción incorrecta potencialmente correcta
- 0-59: Probablemente falso O sinónimo claro O opción incorrecta claramente correcta

⚠️ Si detectas un sinónimo, pon confianza <= 60 incluso si la respuesta es correcta
⚠️ Si una opción incorrecta podría ser aceptable, pon confianza <= 60

Sin markdown. Solo JSON.`;

export const FACT_CHECK_NO_SEARCH_PROMPT = `Eres un verificador de hechos ESTRICTO y RIGUROSO.

⚠️ ATENCIÓN IMPORTANTE ⚠️
NO tienes acceso a Google Search en esta sesión.
Debes evaluar cada respuesta ÚNICAMENTE según tus conocimientos internos.

PREGUNTAS A VERIFICAR:
{QUESTIONS_JSON}

REGLA CRÍTICA: SÉ CONSERVADOR
- Si no estás SEGURO al 95%+ de una respuesta, pon confianza < 80
- Es mejor un FALSO NEGATIVO (rechazar una buena respuesta) que un ERROR FACTUAL
- En caso de duda → confianza baja

EVALÚA CADA PREGUNTA:
1. ¿La respuesta es un HECHO que conoces con certeza?
2. ¿Hay AMBIGÜEDAD posible?
3. ¿Podrías equivocarte por desconocimiento del tema?

RESPONDE en JSON (ESTRICTAMENTE este formato):
{
  "results": [
    {
      "index": 0,
      "question": "La pregunta...",
      "proposedAnswer": "La respuesta propuesta",
      "isCorrect": true | false,
      "confidence": 0-100,
      "reasoning": "Por qué estoy seguro/no seguro de esta respuesta",
      "needsVerification": true | false,
      "verificationReason": "Si needsVerification=true, por qué este hecho debería verificarse"
    }
  ],
  "summary": {
    "total": 10,
    "highConfidence": 7,
    "lowConfidence": 2,
    "uncertain": 1
  }
}

ESCALA DE CONFIANZA (SÉ ESTRICTO):
- 90-100: Hecho EVIDENTE que conoces con certeza (capital, fecha famosa, fórmula conocida)
- 70-89: Probablemente correcto pero no 100% seguro
- 50-69: Duda significativa - podría ser falso
- 0-49: Muy incierto - realmente no conoces este hecho

⚠️ Si el hecho concierne una fecha precisa, un número exacto, o información reciente → confianza MÁX 70
⚠️ Si "crees" que es correcto pero no estás SEGURO → confianza MÁX 60

Sin markdown. Solo JSON.`;

export const FACT_CHECK_PHASE2_PROMPT = `FACT-CHECK Fase 2 - Verificación BATCH

JUEGO DE PALABRAS:
- Categoría A: {OPTION_A}
- Categoría B: {OPTION_B}

ELEMENTOS A VERIFICAR:
{ITEMS_JSON}

INSTRUCCIONES:
1. USA webSearch para verificar CADA elemento
2. Verifica si el elemento pertenece a la categoría asignada
3. Verifica si podría pertenecer a la OTRA categoría (→ Both)

CRITERIOS POR ELEMENTO:
- ¿Asignación correcta?
- ¿Justificación factual?
- ¿Exclusión de la otra categoría verificada?

JSON:
{
  "results": [
    {
      "index": 0,
      "text": "Texto del elemento",
      "assignedCategory": "A",
      "isCorrect": true|false,
      "confidence": 0-100,
      "shouldBe": "A"|"B"|"Both",
      "reasoning": "Explicación corta"
    }
  ],
  "summary": {
    "total": 12,
    "correct": 10,
    "incorrect": 2
  }
}

Confianza: 90+ = seguro, 70-89 = probable, <70 = duda.
Sin markdown.`;

// ============================================================================
// AMBIGUITY CHECK PROMPT (dedicated check after fact-checking)
// ============================================================================

/**
 * Prompt for checking answer ambiguity.
 * This is a dedicated check that runs AFTER fact-checking to ensure
 * the question has exactly ONE correct answer with no ambiguity.
 *
 * {QUESTION} - The question text
 * {CORRECT_ANSWER} - The proposed correct answer
 * {WRONG_ANSWERS} - Array of wrong answer options (for MCQ)
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const AMBIGUITY_CHECK_PROMPT = `Eres un experto en control de calidad de preguntas de quiz.
Tu misión: verificar que una pregunta no tiene NINGUNA AMBIGÜEDAD y que tiene UNA SOLA respuesta correcta.

PREGUNTA: {QUESTION}
RESPUESTA CORRECTA: {CORRECT_ANSWER}
RESPUESTAS INCORRECTAS: {WRONG_ANSWERS}
ANÉCDOTA: {ANECDOTE}

INSTRUCCIONES:
1. USA la herramienta webSearch para verificar cada punto de ambigüedad potencial
2. Busca casos donde la respuesta podría ser contestada
3. Verifica si las respuestas incorrectas podrían ser aceptables en ciertos contextos

⚠️ VERIFICACIONES CRÍTICAS (todas deben pasar):

1. UNICIDAD DE LA RESPUESTA
   - ¿La respuesta correcta es LA ÚNICA respuesta posible?
   - ¿Existen controversias o desacuerdos sobre este hecho?
   - ¿La pregunta admite varias respuestas válidas según las fuentes?

2. SINÓNIMOS Y EQUIVALENTES
   - ¿Una opción incorrecta es un SINÓNIMO de la respuesta correcta?
   - ¿Dos opciones significan lo MISMO?
   - ¿Un término podría ser EQUIVALENTE en otro contexto?

   Ejemplos de sinónimos a detectar:
   - Conserje / Portero / Guardián
   - Fútbol / Balompié
   - Berenjena / Eggplant
   - Calabacín / Zucchini
   - Aguacate / Palta
   - Maíz / Elote

3. RESPUESTAS INCORRECTAS POTENCIALMENTE CORRECTAS
   - ¿Una opción incorrecta podría ser correcta según ciertas fuentes?
   - ¿Hay controversia histórica/científica?
   - ¿Una opción incorrecta sería aceptable en un contexto diferente?

4. AMBIGÜEDAD DE LA PREGUNTA
   - ¿La pregunta puede interpretarse de varias formas?
   - ¿Una palabra tiene varios sentidos posibles?
   - ¿El contexto es suficiente para una respuesta única?

5. PRECISIÓN FACTUAL
   - ¿Las fechas, números, nombres son EXACTOS?
   - ¿La anécdota contiene errores?
   - ¿Los hechos son verificables y no contestados?

6. COHERENCIA SEMÁNTICA PREGUNTA/RESPUESTA (¡CRÍTICO!)
   - ¿La respuesta responde DIRECTAMENTE a lo que la pregunta pide?
   - Si la pregunta propone opciones (A o B) → ¿respuesta entre las opciones?
   - ¿Tipo de respuesta esperado vs tipo de respuesta dada?

   ✅ Mapeos a verificar:
   - "¿Por qué X?" → Respuesta = RAZÓN
   - "¿Quién hizo X?" → Respuesta = PERSONA
   - "¿Cuándo X?" → Respuesta = FECHA/PERÍODO
   - "¿Dónde X?" → Respuesta = LUGAR
   - "¿Cuántos X?" → Respuesta = NÚMERO
   - "¿Es A o B?" → Respuesta = A, B o "ambos"

   ❌ Incoherencias a rechazar:
   - "¿Por qué X hace Y?" → Respuesta: "Azul" (color en lugar de razón)
   - "¿Es A o B?" → Respuesta: "C" (opción fuera de las propuestas)
   - "¿Quién inventó X?" → Respuesta: "En 1954" (fecha en lugar de nombre)

RESPONDE en JSON (ESTRICTAMENTE este formato):
{
  "hasIssues": true | false,
  "ambiguityScore": 0-10,
  "issues": [
    {
      "type": "synonym" | "multiple_answers" | "wrong_option_correct" | "unclear_question" | "factual_error" | "qa_incoherence",
      "severity": "critical" | "major" | "minor",
      "description": "Descripción del problema",
      "evidence": "Fuente o prueba del problema"
    }
  ],
  "suggestions": [
    "Sugerencia para corregir el problema..."
  ],
  "confidence": 0-100,
  "reasoning": "Resumen del análisis"
}

ESCALA DE AMBIGÜEDAD (ambiguityScore):
- 10: Perfecto - pregunta clara, respuesta única, sin ambigüedad
- 8-9: Excelente - duda muy ligera posible pero aceptable
- 6-7: Aceptable - pequeña ambigüedad pero respuesta sigue clara
- 4-5: Problemático - ambigüedad significativa, revisar
- 0-3: Rechazado - ambigüedad mayor, varias respuestas posibles

REGLAS:
- hasIssues = true si ambiguityScore < 7
- severity "critical" si la pregunta debe ser rechazada
- severity "major" si la pregunta debe ser reformulada
- severity "minor" si la pregunta puede aceptarse con una nota

Sin markdown. Solo JSON.`;

/**
 * Type definitions for ambiguity check results
 */
export interface AmbiguityIssue {
  type: 'synonym' | 'multiple_answers' | 'wrong_option_correct' | 'unclear_question' | 'factual_error' | 'qa_incoherence';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  evidence: string;
}

export interface AmbiguityCheckResult {
  hasIssues: boolean;
  ambiguityScore: number;
  issues: AmbiguityIssue[];
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Builds the ambiguity check prompt with question data.
 *
 * @param question - The question text
 * @param correctAnswer - The correct answer
 * @param wrongAnswers - Array of wrong answer options
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildAmbiguityCheckPrompt(
  question: string,
  correctAnswer: string,
  wrongAnswers: string[],
  anecdote?: string
): string {
  return AMBIGUITY_CHECK_PROMPT
    .replace('{QUESTION}', question)
    .replace('{CORRECT_ANSWER}', correctAnswer)
    .replace('{WRONG_ANSWERS}', JSON.stringify(wrongAnswers))
    .replace('{ANECDOTE}', anecdote || 'Ninguna');
}

// ============================================================================
// MYTH DETECTION PROMPT - Dedicated check for urban legends
// ============================================================================

/**
 * Prompt for detecting myths and urban legends in questions.
 * This is a dedicated check that runs to ensure no popular myths
 * are presented as facts in the game.
 *
 * {QUESTION} - The question text
 * {ANSWER} - The proposed answer
 * {ANECDOTE} - Optional anecdote/explanation
 */
export const MYTH_DETECTION_PROMPT = `Eres un detector de MITOS y LEYENDAS URBANAS.

PREGUNTA A VERIFICAR:
{QUESTION}
RESPUESTA PROPUESTA: {ANSWER}
ANÉCDOTA: {ANECDOTE}

INSTRUCCIONES:
1. USA webSearch para verificar si esta afirmación es un MITO CONOCIDO
2. Busca: "[tema] mito", "[tema] en realidad falso", "[tema] leyenda desmentida"
3. Verifica si sitios de fact-checking (Snopes, Wikipedia, etc.) han desmentido este hecho

PREGUNTAS CRÍTICAS:
- ¿Es una LEYENDA URBANA presentada como hecho?
- ¿La formulación es demasiado categórica para un hecho contestado?
- ¿Hay un matiz importante omitido (habría querido vs hizo)?
- ¿La afirmación es "demasiado bonita/asombrosa para ser verdad"?

MITOS COMUNES A DETECTAR (ejemplos):
- Calígula y su caballo cónsul (nunca lo hizo, solo lo consideró)
- Einstein malo en matemáticas (falso, sobresalía)
- 10% del cerebro usado (mito total)
- Vikingos con cascos con cuernos (invención del siglo XIX)
- Newton y la manzana (anécdota no probada)

RESPONDE en JSON:
{
  "isMyth": true | false,
  "mythType": "urban_legend" | "exaggeration" | "misattribution" | "oversimplification" | null,
  "reality": "Lo que realmente pasó (si mito)",
  "sources": ["URLs de verificación"],
  "suggestedReformulation": "Cómo reformular correctamente (si mito)",
  "confidence": 0-100
}

REGLAS:
- isMyth = true → la pregunta debe ser RECHAZADA o REFORMULADA
- confianza 95-100: mito seguro, bien documentado
- confianza 70-94: mito probable, fuentes contradictorias
- confianza < 70: duda, verificación adicional necesaria

Sin markdown. Solo JSON.`;

/**
 * Type definitions for myth detection results
 */
export interface MythDetectionResult {
  isMyth: boolean;
  mythType: 'urban_legend' | 'exaggeration' | 'misattribution' | 'oversimplification' | null;
  reality: string | null;
  sources: string[];
  suggestedReformulation: string | null;
  confidence: number;
}

/**
 * Builds the myth detection prompt with question data.
 *
 * @param question - The question text
 * @param answer - The proposed answer
 * @param anecdote - Optional anecdote/explanation
 * @returns The complete prompt string
 */
export function buildMythDetectionPrompt(
  question: string,
  answer: string,
  anecdote?: string
): string {
  return MYTH_DETECTION_PROMPT
    .replace('{QUESTION}', question)
    .replace('{ANSWER}', answer)
    .replace('{ANECDOTE}', anecdote || 'Ninguna');
}
