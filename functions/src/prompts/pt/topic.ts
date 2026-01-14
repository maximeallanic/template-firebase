/**
 * Portuguese Topic Generation Prompts
 * Prompts for generating game themes/topics
 */

export const GENERATE_TOPIC_PROMPT = `BURGER QUIZ - Gere UM tema SÉRIO de quiz
Dificuldade: {DIFFICULTY}

⚠️ O TEMA DEVE SER SÉRIO E CLÁSSICO.
O humor virá da FORMULAÇÃO das perguntas, NÃO do tema!

CATEGORIAS POSSÍVEIS: história, geografia, ciências, cinema, música, esporte, literatura, arte, invenções, natureza, gastronomia, tecnologia

ADAPTE A ESPECIFICIDADE À DIFICULDADE:
• EASY: Temas muito acessíveis e populares
• NORMAL: Temas clássicos de cultura geral
• HARD: Temas mais específicos e especializados
• WTF: Temas sérios MAS com fatos inusitados a descobrir

PROIBIDO:
❌ Formulações vagas ("Cultura geral", "Quiz")
❌ Temas humorísticos ("Os fails", "Coisas bizarras")

Seja CRIATIVO e ORIGINAL na escolha do tema.
Responda APENAS o tema (máx 6 palavras, sem aspas).`;

export const GENERATE_TOPIC_PHASE2_PROMPT = `BURGER QUIZ Fase 2 - Gere UM domínio temático em português

O gerador criará um TROCADILHO (homófono) neste domínio.
Escolha um domínio RICO em vocabulário português que permita homófonos.

RESPONDA APENAS o domínio (2-4 palavras, sem aspas).`;

export const GENERATE_TOPIC_PHASE5_PROMPT = `BURGER QUIZ Fase 5 "Burger Supremo" - Gere UM tema SÉRIO e AMPLO
Dificuldade: {DIFFICULTY}

⚠️ RESTRIÇÃO CRÍTICA: O tema deve permitir 10 perguntas sobre 10 DOMÍNIOS DIFERENTES!
O tema é uma INSPIRAÇÃO para variar os assuntos.

⚠️ O TEMA DEVE SER SÉRIO - O humor virá da FORMULAÇÃO das perguntas!

DOMÍNIOS A COBRIR: história, ciências, esporte, música, cinema, geografia, natureza, gastronomia, tecnologia, arte

PROIBIDO:
❌ Temas muito específicos (um único tipo de fato)
❌ Temas humorísticos (o humor vem das perguntas, não do tema)

ADAPTE À DIFICULDADE:
• EASY: Acessível e popular
• NORMAL: Cultura geral clássica
• HARD: Específico e especializado
• WTF: Sério mas fatos inusitados

Seja CRIATIVO e SURPREENDENTE.
Responda APENAS o tema (máx 6 palavras, sem aspas).`;

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
export const SUBJECT_ANGLE_PROMPT = `Você é um gerador de assuntos para um quiz de cultura geral estilo "Burger Quiz".

Gere UM assunto e UM ângulo únicos para uma pergunta.

TIPOS DE ASSUNTOS E SEUS ÂNGULOS:

🧑 PESSOA (type: "person")
Ângulos: biografia, obras, curiosidades, citações, datas_importantes
Exemplos:
- { subject: "Albert Einstein", angle: "curiosidades", type: "person" }
- { subject: "Marie Curie", angle: "datas_importantes", type: "person" }
- { subject: "Napoleão Bonaparte", angle: "citações", type: "person" }

📍 LUGAR (type: "place")
Ângulos: geografia, história, cultura, monumentos, fatos_inusitados
Exemplos:
- { subject: "A Torre Eiffel", angle: "fatos_inusitados", type: "place" }
- { subject: "O Japão", angle: "cultura", type: "place" }
- { subject: "Nova York", angle: "monumentos", type: "place" }

📅 EVENTO (type: "event")
Ângulos: causas, desenvolvimento, consequências, protagonistas, datas
Exemplos:
- { subject: "A Revolução Francesa", angle: "protagonistas", type: "event" }
- { subject: "A queda do Muro de Berlim", angle: "consequências", type: "event" }
- { subject: "Os Jogos Olímpicos de Paris 2024", angle: "datas", type: "event" }

💡 CONCEITO (type: "concept")
Ângulos: definição, origem, aplicações, exemplos, controvérsias
Exemplos:
- { subject: "A inteligência artificial", angle: "controvérsias", type: "concept" }
- { subject: "O aquecimento global", angle: "aplicações", type: "concept" }
- { subject: "O blockchain", angle: "definição", type: "concept" }

🔧 OBJETO (type: "object")
Ângulos: invenção, funcionamento, história, variantes, recordes
Exemplos:
- { subject: "O telefone", angle: "invenção", type: "object" }
- { subject: "A pizza", angle: "variantes", type: "object" }
- { subject: "A guitarra elétrica", angle: "recordes", type: "object" }

RESTRIÇÕES CRÍTICAS:
✅ O assunto deve ser verificável facilmente no Google
✅ Prefira assuntos com fatos precisos e datados
✅ Misture cultura pop, história, ciência, atualidades
✅ Seja criativo e surpreendente nas combinações
❌ Evite assuntos muito obscuros ou controversos
❌ Evite assuntos muito genéricos ("O Brasil", "A história", etc.)

CATEGORIAS POSSÍVEIS:
- ciência, história, geografia, cultura_pop, esporte, música, cinema, gastronomia, natureza, tecnologia

Responda APENAS em JSON válido, nada mais:
{
  "subject": "O assunto escolhido",
  "angle": "o ângulo escolhido",
  "category": "a categoria",
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
    prompt += `\n\nCATEGORIA SOLICITADA: ${category}
Concentre-se nesta categoria para o assunto gerado.`;
  }

  return prompt;
}
