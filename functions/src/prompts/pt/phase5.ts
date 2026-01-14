/**
 * Portuguese Phase 5 (Burger Supremo) Prompts
 * Memory challenge - answer all after hearing all
 *
 * MELHORIAS APLICADAS:
 * - Remoção dos exemplos no prompt para evitar influência
 * - Adição explícita do respeito ao tema
 * - Reforço da diversidade de estilos de escrita
 * - Clarificação sobre respostas WTF mas verdadeiras
 * - Menção explícita da unicidade das respostas (sem ambiguidade)
 * - Mix equilibrado assuntos sérios/leves
 * - ABSURDIDADE REFORÇADA: perguntas criativas, bobas, trocadilhos, armadilhas
 * - Espírito Burger Quiz: tom provocador, às vezes infantil
 */

export const PHASE5_PROMPT = `BURGER QUIZ Fase 5 "Burger Supremo" - Desafio de Memória
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}

🎯 CONCEITO: 10 perguntas feitas em sequência, o jogador memoriza e depois responde na ordem.

⚠️ REGRAS:
1. Perguntas CURTAS (10-15 palavras) e MEMORÁVEIS
2. Respostas CURTAS (1-3 palavras, títulos completos aceitos)
3. Espírito ABSURDO e CRIATIVO: perguntas às vezes BOBAS, trocadilhos, armadilhas
4. Mix perguntas RIDÍCULAS e SÉRIAS alternadas
5. DIVERSIDADE total: estilos variados, nenhuma repetição
6. UMA ÚNICA resposta possível por pergunta
7. VERIFIQUE cada resposta no Google

Gere JSON válido apenas, sem markdown nem exemplos.
10 perguntas sobre o tema.`;

export const PHASE5_GENERATOR_PROMPT = `BURGER QUIZ Fase 5 "Burger Supremo" - Gerador
Inspiração: {TOPIC} | Dificuldade: {DIFFICULTY}

🎯 CONCEITO: Desafio de memória - 10 perguntas em sequência, responder na ordem.

⚠️ REGRA #0 - DIVERSIDADE MÁXIMA (PRIORIDADE ABSOLUTA!)
"{TOPIC}" é uma INSPIRAÇÃO, não um tema rígido!
As 10 perguntas devem cobrir 10 ASSUNTOS COMPLETAMENTE DIFERENTES:
- Cinema, música, esporte, animais, comida, história, ciências, tech, geografia, celebridades...
CADA pergunta sobre um DOMÍNIO DIFERENTE. A única coerência: o ângulo criativo/absurdo.

⚠️ REGRA #1 - DIVERSIDADE ABSOLUTA
PROIBIDO: 2 perguntas sobre o mesmo conceito!
Mix OBRIGATÓRIO: perguntas ABSURDAS e SÉRIAS alternadas.
VARIE os ESTILOS: interrogativo, afirmativo, exclamativo, falsa adivinhação, armadilha.

⚠️ REGRA #2 - MEMORABILIDADE
- Perguntas CURTAS (10-15 palavras)
- Respostas curtas (1-3 palavras para títulos/nomes próprios OK)
- P1-4 fáceis, P5-7 médias, P8-10 difíceis

⚠️ REGRA #3 - UMA ÚNICA RESPOSTA POSSÍVEL
Nenhuma ambiguidade! Se várias respostas possíveis, adicione detalhes precisos.

⚠️ REGRA #4 - VERIFICAÇÃO FACTUAL
USE Google para CADA resposta. Zero erro.
Às vezes incluir 1-2 respostas WTF mas VERDADEIRAS para efeito surpresa.

⚠️ REGRA #5 - TEMAS PROIBIDOS (BLACKLIST)
Estes assuntos são BANIDOS pois super-representados na base:
- Fobias de celebridades (Nicole Kidman/borboletas, Johnny Depp/palhaços, McConaughey/portas, etc.)
- Medos irracionais de estrelas em geral
- Pet Rock / Gary Dahl 1975
MÁXIMO 1 pergunta sobre fobias por set de 10.
PRIVILEGIE: Recordes inusitados, invenções fracassadas, fatos científicos, curiosidades históricas, cultura pop original.

⚠️ REGRA #6 - COERÊNCIA PERGUNTA/RESPOSTA (CRÍTICO!)
A resposta DEVE responder DIRETAMENTE ao que a pergunta pede.
VERIFIQUE o TIPO de resposta esperado antes de validar:

- Pergunta "Por que X?" → Resposta = uma RAZÃO (não um nome, não uma cor)
- Pergunta "Quem é/fez X?" → Resposta = uma PESSOA
- Pergunta "Quando X?" → Resposta = uma DATA ou PERÍODO
- Pergunta "Onde X?" → Resposta = um LUGAR
- Pergunta "Como se chama X?" → Resposta = um NOME
- Pergunta "Quantos X?" → Resposta = um NÚMERO
- Pergunta "É A ou B?" → Resposta = A, B, ou "os dois" (NUNCA outra coisa!)

❌ ERRO FATAL A EVITAR:
Exemplo RUIM: "Mickey usa luvas, é para esconder suas impressões digitais ou não se sujar?" → "Brancas"
A pergunta pede uma RAZÃO, não uma COR → INCOERÊNCIA TOTAL!

✅ VERIFICAÇÃO OBRIGATÓRIA:
Antes de validar cada pergunta, pergunte-se: "A resposta responde realmente ao que eu pergunto?"
Se a resposta parece fora do assunto → REFORMULE a pergunta ou MUDE a resposta.

{PREVIOUS_FEEDBACK}

Gere apenas JSON válido sem markdown nem blocos de código.
10 perguntas VARIADAS sobre "{TOPIC}".`;

export const PHASE5_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Fase 5 "Burger Supremo"
Inspiração: {TOPIC}

{QUESTIONS}

🔍 VERIFICAÇÃO EM 9 PONTOS:

0. DIVERSIDADE (PRIORIDADE #1!): 10 assuntos DIFERENTES (cinema, esporte, ciência, história...)? REJEIÇÃO se 2+ perguntas sobre o mesmo domínio!
1. ABSURDIDADE: Perguntas CRIATIVAS, às vezes BOBAS? Trocadilhos, armadilhas, WTF?
2. ESTILO VARIADO: Mix ABSURDO/SÉRIO alternados? Interrogativo, afirmativo, exclamativo?
3. EXATIDÃO (CRÍTICO): Respostas verdadeiras? Uma única resposta possível?
4. COMPRIMENTO: Perguntas 10-15 palavras, respostas curtas (títulos OK)?
5. MEMORABILIDADE: Formulações que criam imagens mentais ou fazem rir?
6. DADOS COMPLETOS: Todas perguntas/respostas presentes?
7. BLACKLIST: Não mais de 1 pergunta sobre fobias de celebridades? Sem Pet Rock/Gary Dahl?
8. COERÊNCIA P/R (CRÍTICO!): A resposta responde DIRETAMENTE à pergunta?
   - Pergunta "Por que X?" → Resposta = RAZÃO?
   - Pergunta "A ou B?" → Resposta = A, B ou os dois?
   - Pergunta "Quem/O que/Onde/Quando" → Tipo de resposta correto?
   - Exemplo RUIM: "É X ou Y?" → Resposta: "Azul" = REJEIÇÃO IMEDIATA!

⚠️ REJEITAR SE: 2+ perguntas similares OU 1+ erro factual OU todas perguntas "clássicas" OU 2+ perguntas sobre fobias de celebridades OU 1+ incoerência pergunta/resposta

LIMIARES CRÍTICOS: factual_accuracy ≥ 7, absurdity ≥ 6, diversity ≥ 7, qa_coherence ≥ 8

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

Sem markdown.`;

export const PHASE5_TARGETED_REGENERATION_PROMPT = `SUBSTITUIÇÃO Fase 5 "Burger Supremo"
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}

SEQUÊNCIA ATUAL: {CURRENT_SEQUENCE}
SUBSTITUIR (índices {BAD_INDICES}): {BAD_QUESTIONS}
RAZÕES REJEIÇÃO: {REJECTION_REASONS}
CALLBACKS: {CALLBACK_CONTEXT}

⚠️ REGRAS DE SUBSTITUIÇÃO:
1. Respeito ao tema "{TOPIC}"
2. Perguntas curtas (10-15 palavras), respostas curtas (1-3 palavras OK)
3. Espírito ABSURDO: perguntas CRIATIVAS, às vezes BOBAS, trocadilhos, armadilhas
4. Estilo VARIADO (diferente das outras perguntas)
5. Assunto DIFERENTE (sem duplicata)
6. VERIFIQUE no Google, uma única resposta possível
7. Progressão de dificuldade: 0-3=fácil, 4-6=médio, 7-9=difícil

Gere JSON válido apenas, sem markdown.
{COUNT} perguntas de substituição.`;
