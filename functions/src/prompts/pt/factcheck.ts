/**
 * Portuguese Fact-Checking Prompts
 * Prompts for verifying generated content accuracy
 */

// ============================================================================
// COMMON MYTHS DATABASE - Urban legends that MUST be detected and rejected
// ============================================================================

/**
 * Lista de mitos e lendas urbanas comuns a detectar (50+)
 * Se uma pergunta usa um destes mitos como fato, ela deve ser rejeitada
 */
export const COMMON_MYTHS = [
  // === MITOS HISTÓRICOS ===
  { myth: "Calígula nomeou seu cavalo cônsul", truth: "Ele apenas considerou fazer isso", keywords: ["Calígula", "Incitatus", "cônsul"] },
  { myth: "Maria Antonieta disse 'que comam brioches'", truth: "Nenhuma prova histórica, atribuído a Rousseau", keywords: ["Maria Antonieta", "brioche"] },
  { myth: "Os vikings usavam capacetes com chifres", truth: "Invenção romântica do século 19", keywords: ["vikings", "capacetes", "chifres"] },
  { myth: "Napoleão era baixo", truth: "1m68, altura média para a época", keywords: ["Napoleão", "baixo", "altura"] },
  { myth: "Newton descobriu a gravidade com uma maçã", truth: "Anedota provavelmente apócrifa", keywords: ["Newton", "maçã", "gravidade"] },
  { myth: "Cristóvão Colombo provou que a Terra era redonda", truth: "Os gregos sabiam disso 2000 anos antes", keywords: ["Colombo", "Terra", "redonda", "plana"] },
  { myth: "Os gladiadores sempre lutavam até a morte", truth: "Raro, eram muito caros para treinar", keywords: ["gladiadores", "morte", "arena"] },
  { myth: "Cleópatra era egípcia", truth: "Ela era de origem grega (Ptolemeu)", keywords: ["Cleópatra", "egípcia", "grega"] },
  { myth: "Cintos de castidade existiam na Idade Média", truth: "Invenção do século 19", keywords: ["cinto", "castidade", "Idade Média"] },
  { myth: "Queimavam bruxas na Idade Média", truth: "Principalmente no Renascimento, e frequentemente enforcamento", keywords: ["bruxas", "queimadas", "Idade Média"] },
  { myth: "Salieri envenenou Mozart", truth: "Nenhuma prova, mito romântico", keywords: ["Salieri", "Mozart", "envenenou"] },
  { myth: "Van Gogh cortou toda a orelha", truth: "Apenas o lóbulo", keywords: ["Van Gogh", "orelha", "cortou"] },
  { myth: "As pirâmides foram construídas por escravos", truth: "Por trabalhadores assalariados", keywords: ["pirâmides", "escravos", "Egito"] },

  // === MITOS CIENTÍFICOS ===
  { myth: "Einstein era ruim em matemática", truth: "Ele era excelente em matemática", keywords: ["Einstein", "ruim", "matemática"] },
  { myth: "Usamos apenas 10% do cérebro", truth: "Usamos todo o nosso cérebro", keywords: ["10%", "cérebro"] },
  { myth: "A Muralha da China é visível do espaço", truth: "Muito estreita para ser visível", keywords: ["muralha", "China", "espaço", "visível"] },
  { myth: "Os morcegos são cegos", truth: "Eles enxergam muito bem", keywords: ["morcegos", "cegos"] },
  { myth: "Os peixes dourados têm 3 segundos de memória", truth: "Eles têm vários meses de memória", keywords: ["peixe", "dourado", "memória", "segundos"] },
  { myth: "Os avestruzes enfiam a cabeça na areia", truth: "Eles nunca fazem isso", keywords: ["avestruz", "cabeça", "areia"] },
  { myth: "O sangue desoxigenado é azul", truth: "Ele é sempre vermelho", keywords: ["sangue", "azul", "veias"] },
  { myth: "O raio nunca cai duas vezes no mesmo lugar", truth: "Pode cair no mesmo lugar", keywords: ["raio", "cai", "mesmo lugar"] },
  { myth: "Os humanos têm 5 sentidos", truth: "Temos pelo menos 9 (equilíbrio, dor, etc.)", keywords: ["5 sentidos", "cinco sentidos"] },
  { myth: "Engolimos 8 aranhas por ano dormindo", truth: "Lenda urbana sem fundamento", keywords: ["aranhas", "engolir", "dormir"] },
  { myth: "Os cabelos/unhas continuam crescendo após a morte", truth: "A pele retrai dando essa ilusão", keywords: ["cabelos", "unhas", "morte", "crescem"] },
  { myth: "A água conduz eletricidade", truth: "A água pura é isolante, são as impurezas", keywords: ["água", "eletricidade", "conduz"] },
  { myth: "O girassol segue o sol", truth: "Apenas as plantas jovens, não as flores maduras", keywords: ["girassol", "sol", "segue"] },
  { myth: "Os camaleões mudam de cor para camuflagem", truth: "É para comunicação e temperatura", keywords: ["camaleão", "cor", "camuflagem"] },
  { myth: "Perdemos calor corporal pela cabeça", truth: "Perdemos igual por toda superfície exposta", keywords: ["calor", "cabeça", "perder"] },
  { myth: "Os lemingues cometem suicídio em massa", truth: "Mito criado pela Disney", keywords: ["lemingues", "suicídio", "penhasco"] },
  { myth: "O vidro é um líquido muito viscoso", truth: "É um sólido amorfo", keywords: ["vidro", "líquido", "viscoso"] },

  // === MITOS ALIMENTARES ===
  { myth: "O açúcar deixa as crianças hiperativas", truth: "Nenhuma prova científica", keywords: ["açúcar", "crianças", "hiperativas"] },
  { myth: "Devemos esperar antes de nadar após comer", truth: "Nenhum risco de afogamento provado", keywords: ["nadar", "comer", "digestão", "esperar"] },
  { myth: "O leite é bom para os ossos", truth: "Poucas provas, países grandes consumidores têm mais osteoporose", keywords: ["leite", "ossos", "cálcio"] },
  { myth: "Comer cenoura melhora a visão", truth: "Propaganda britânica da Segunda Guerra", keywords: ["cenouras", "visão", "olhos"] },
  { myth: "O chocolate dá espinhas", truth: "Nenhuma ligação científica comprovada", keywords: ["chocolate", "espinhas", "acne"] },
  { myth: "O álcool aquece", truth: "Ele dilata os vasos e faz perder calor", keywords: ["álcool", "aquece", "frio"] },

  // === MITOS CULTURAIS E GEOGRÁFICOS ===
  { myth: "Os Inuítes têm 50 palavras para neve", truth: "Exagero linguístico", keywords: ["Inuítes", "Esquimós", "neve", "palavras"] },
  { myth: "Frankenstein é o nome do monstro", truth: "É o nome do doutor", keywords: ["Frankenstein", "monstro", "doutor"] },
  { myth: "Sherlock Holmes disse 'Elementar, meu caro Watson'", truth: "Nunca nos livros originais", keywords: ["Sherlock", "Holmes", "Elementar", "Watson"] },
  { myth: "O tomate é um legume", truth: "É botanicamente uma fruta", keywords: ["tomate", "legume", "fruta"] },
  { myth: "O Papai Noel vermelho foi inventado pela Coca-Cola", truth: "Ele existia de vermelho antes", keywords: ["Papai Noel", "Coca-Cola", "vermelho"] },
  { myth: "Os touros ficam irritados com o vermelho", truth: "Eles são daltônicos, é o movimento que os irrita", keywords: ["touro", "vermelho", "tourada"] },
  { myth: "A areia movediça suga as pessoas", truth: "Impossível afundar completamente", keywords: ["areia", "movediça", "afundar"] },

  // === MITOS TECNOLÓGICOS ===
  { myth: "Mac não pode ter vírus", truth: "Eles são apenas menos visados", keywords: ["Mac", "Apple", "vírus"] },
  { myth: "Os telefones causam câncer", truth: "Nenhuma prova científica sólida", keywords: ["telefone", "câncer", "ondas"] },
  { myth: "Deve-se esvaziar completamente a bateria antes de recarregar", truth: "Obsoleto com baterias de íon-lítio", keywords: ["bateria", "esvaziar", "recarregar"] },
  { myth: "A NASA gastou milhões com uma caneta espacial", truth: "Paul Fisher investiu seus próprios fundos, a NASA apenas comprou as canetas a 6$ cada", keywords: ["NASA", "caneta", "Fisher", "milhões", "lápis", "espaço"] },

  // === MITOS SOBRE PERSONALIDADES ===
  { myth: "Walt Disney está criogenizado", truth: "Ele foi cremado", keywords: ["Disney", "criogenizado", "congelado"] },
  { myth: "Marilyn Monroe tinha QI de 168", truth: "Nenhuma prova confiável", keywords: ["Marilyn", "Monroe", "QI"] },
  { myth: "Al Capone morreu na prisão", truth: "Ele morreu em casa de sífilis", keywords: ["Al Capone", "prisão", "morreu"] },

  // === MITOS RELIGIOSOS/BÍBLICOS ===
  { myth: "Adão e Eva comeram uma maçã", truth: "A Bíblia fala de um 'fruto' não especificado", keywords: ["Adão", "Eva", "maçã", "fruto"] },
  { myth: "Os Reis Magos eram três", truth: "A Bíblia não especifica o número deles", keywords: ["Reis Magos", "três", "3"] },
];

export const FACT_CHECK_PROMPT = `Você é um verificador de fatos RIGOROSO e EXIGENTE.
Sua missão: verificar se uma resposta a uma pergunta é 100% CORRETA.

PERGUNTA: {QUESTION}
RESPOSTA PROPOSTA: {ANSWER}
CONTEXTO (opcional): {CONTEXT}

INSTRUÇÕES:
1. USE a ferramenta webSearch para verificar a resposta proposta
2. Pesquise fontes CONFIÁVEIS (Wikipedia, sites oficiais, enciclopédias)
3. Não confie na sua memória - VERIFIQUE com pesquisa

CRITÉRIOS DE VALIDAÇÃO:
- A resposta é FACTUALMENTE CORRETA?
- A resposta é a ÚNICA resposta possível para esta pergunta?
- Há AMBIGUIDADE na pergunta ou na resposta?

RESPONDA em JSON (ESTRITAMENTE este formato):
{
  "isCorrect": true | false,
  "confidence": 0-100,
  "source": "Fonte usada para verificar (URL ou referência)",
  "reasoning": "Explicação curta de por que a resposta está correta ou incorreta",
  "correction": "Se incorreto, qual é a resposta correta? (null se correto)",
  "ambiguity": "Se ambíguo, por quê? (null se sem ambiguidade)"
}

REGRAS DE CONFIANÇA:
- 95-100: Fato verificado com fonte confiável, nenhuma dúvida
- 80-94: Provavelmente correto, fonte encontrada mas não 100% certa
- 60-79: Dúvida significativa, fontes contraditórias ou incompletas
- 0-59: Provavelmente falso ou impossível verificar

Sem markdown. Apenas JSON.`;

export const FACT_CHECK_BATCH_PROMPT = `Você é um verificador de fatos RIGOROSO e EXIGENTE.
Sua missão: verificar se as respostas a várias perguntas são 100% CORRETAS e SEM AMBIGUIDADE.

PERGUNTAS A VERIFICAR:
{QUESTIONS_JSON}

⚠️ PROTOCOLO DE VERIFICAÇÃO MULTI-FONTES (OBRIGATÓRIO):

Para CADA fato, você DEVE:
1. Pesquisar na Wikipedia PRIMEIRO como referência principal
2. Cruzar com PELO MENOS UMA fonte confiável adicional:
   - Sites oficiais (.gov, .edu, institucionais)
   - Enciclopédias (Britannica, Larousse, Universalis, etc.)
   - Mídia reputada (AFP, Reuters, BBC, Folha, etc.)
   - Bases especializadas (IMDB para cinema, Discogs para música, etc.)

3. Um fato é VALIDADO apenas se:
   - Wikipedia E outra fonte concordam
   - OU 2+ fontes confiáveis não-Wikipedia concordam
   - NUNCA validar com uma única fonte

4. Limiares de confiança baseados nas fontes:
   - 95-100: Wikipedia + 1 fonte oficial confirmam
   - 85-94: Wikipedia sozinha confirma (sem contradição encontrada)
   - 70-84: 1 única fonte confiável confirma
   - <70: Fontes em desacordo OU apenas fontes duvidosas

CRITÉRIOS DE VALIDAÇÃO (para cada pergunta):
- A resposta é FACTUALMENTE CORRETA? (verificado multi-fontes)
- A resposta é a ÚNICA resposta possível?
- Há AMBIGUIDADE?

⚠️ VERIFICAÇÃO DAS RESPOSTAS ERRADAS (CRÍTICO):
Para QCMs, verifique também que as opções erradas são REALMENTE FALSAS:
- Nenhuma opção errada deveria ser uma resposta aceitável
- Verifique se uma opção errada poderia ser considerada correta segundo certas fontes
- Se uma opção errada é potencialmente correta → sinalize

Exemplos de problemas a detectar:
- Pergunta sobre o inventor de X, mas uma opção errada também contribuiu significativamente
- Pergunta sobre o primeiro a fazer X, mas é controverso e outra opção poderia ser válida
- Pergunta geográfica onde várias respostas poderiam ser válidas
- Uma opção errada é tecnicamente correta em contexto diferente

⚠️ DETECÇÃO DE SINÔNIMOS E EQUIVALENTES (CRÍTICO):
Para QCMs com opções múltiplas, verifique se:
- Uma opção errada é um SINÔNIMO da resposta correta (ex: "Porteiro" = "Zelador")
- Duas opções significam a MESMA COISA em línguas/contextos diferentes
- Uma opção poderia ser IGUALMENTE CORRETA segundo a interpretação
- Termos técnicos têm ALIAS comuns (ex: "Sódio" = "Natrium")

Exemplos de SINÔNIMOS a detectar:
- Porteiro / Zelador / Vigilante
- Abacate (fruta) / Avocado
- Milho / Maize (inglês)
- Futebol / Soccer (EUA)
- Berinjela / Eggplant
- Abobrinha / Zucchini

⚠️ DETECÇÃO DE LENDAS URBANAS E MITOS POPULARES (CRÍTICO):

Certos "fatos" famosos são na verdade FALSOS ou EXAGERADOS. Verifique:

1. MITOS HISTÓRICOS COMUNS A REJEITAR:
   - "Calígula nomeou seu cavalo cônsul" → FALSO (ele queria fazer, nunca fez)
   - "Einstein era ruim em matemática" → FALSO
   - "Usamos apenas 10% do cérebro" → FALSO
   - "Os vikings usavam capacetes com chifres" → FALSO
   - "Napoleão era baixo" → MITO (altura média para a época)
   - "Maria Antonieta disse 'que comam brioches'" → NENHUMA PROVA
   - "Newton descobriu a gravidade com uma maçã" → ANEDOTA NÃO COMPROVADA

2. REGRA DE VERIFICAÇÃO DE AFIRMAÇÕES HISTÓRICAS:
   - Se a pergunta afirma que um personagem histórico "FEZ" algo extraordinário
   - VERIFIQUE se é um FATO DOCUMENTADO ou uma LENDA
   - Pesquise "myth", "legend", "actually never", "commonly believed but false"
   - DIFERENCIE: "fez" vs "teria querido fazer" vs "segundo a lenda"

3. FORMULAÇÕES PRUDENTES REQUERIDAS:
   - Em vez de "X fez Y" → "X teria feito Y" ou "Segundo a lenda, X..."
   - Em vez de "X é o primeiro a" → Verificar se há controvérsia
   - Uma afirmação muito categórica para um fato contestado = confiança MÁX 60

4. CONFIANÇA REDUZIDA PARA ANEDOTAS EXTRAORDINÁRIAS:
   - Quanto mais surpreendente/WTF uma afirmação, mais deve ser verificada
   - Uma anedota "boa demais para ser verdade" é frequentemente FALSA
   - Confiança MÁX 70 para afirmações extraordinárias não verificadas com fonte

⚠️ Se detectar um MITO POPULAR apresentado como fato → isCorrect: false, confidence: 0
⚠️ Anote o mito detectado no campo "mythDetected"

RESPONDA em JSON (ESTRITAMENTE este formato):
{
  "results": [
    {
      "index": 0,
      "question": "A pergunta...",
      "proposedAnswer": "A resposta proposta",
      "isCorrect": true | false,
      "confidence": 0-100,
      "sources": ["Fonte 1 URL/nome", "Fonte 2 URL/nome"],
      "sourceCount": 2,
      "wikipediaVerified": true | false,
      "reasoning": "Explicação curta com citações das fontes",
      "correction": "Resposta correta se incorreto (null se correto)",
      "ambiguity": "Por que ambíguo (null se sem ambiguidade)",
      "synonymIssue": "Se outra opção é sinônimo/equivalente da resposta (null senão)",
      "wrongOptionIssue": "Se uma opção errada poderia ser correta, qual e por quê (null senão)",
      "mythDetected": "Se um mito/lenda urbana é apresentado como fato, qual (null senão)"
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

REGRAS DE CONFIANÇA:
- 95-100: Fato verificado, nenhuma dúvida, sem sinônimos, opções erradas verificadas falsas
- 80-94: Provavelmente correto, sem sinônimos óbvios, opções erradas provavelmente falsas
- 60-79: Dúvida significativa OU sinônimo potencial OU opção errada potencialmente correta
- 0-59: Provavelmente falso OU sinônimo claro OU opção errada claramente correta

⚠️ Se detectar um sinônimo, coloque confiança <= 60 mesmo se a resposta está correta!
⚠️ Se uma opção errada poderia ser aceitável, coloque confiança <= 60!

Sem markdown. Apenas JSON.`;

export const FACT_CHECK_NO_SEARCH_PROMPT = `Você é um verificador de fatos RIGOROSO e EXIGENTE.

⚠️ ATENÇÃO IMPORTANTE ⚠️
Você NÃO tem acesso ao Google Search nesta sessão.
Você deve avaliar cada resposta APENAS segundo seus conhecimentos internos.

PERGUNTAS A VERIFICAR:
{QUESTIONS_JSON}

REGRA CRÍTICA: SEJA CONSERVADOR
- Se não tem CERTEZA de 95%+ de uma resposta, coloque confiança < 80
- É melhor um FALSO NEGATIVO (rejeitar uma boa resposta) que um ERRO FACTUAL
- Em caso de dúvida → confiança baixa

AVALIE CADA PERGUNTA:
1. A resposta é um FATO que você conhece com certeza?
2. Há AMBIGUIDADE possível?
3. Poderia estar errado por desconhecimento do assunto?

RESPONDA em JSON (ESTRITAMENTE este formato):
{
  "results": [
    {
      "index": 0,
      "question": "A pergunta...",
      "proposedAnswer": "A resposta proposta",
      "isCorrect": true | false,
      "confidence": 0-100,
      "reasoning": "Por que tenho certeza/não tenho certeza desta resposta",
      "needsVerification": true | false,
      "verificationReason": "Se needsVerification=true, por que este fato deveria ser verificado"
    }
  ],
  "summary": {
    "total": 10,
    "highConfidence": 7,
    "lowConfidence": 2,
    "uncertain": 1
  }
}

ESCALA DE CONFIANÇA (SEJA RIGOROSO):
- 90-100: Fato ÓBVIO que você conhece com certeza (capital, data célebre, fórmula conhecida)
- 70-89: Provavelmente correto mas não 100% certo
- 50-69: Dúvida significativa - pode ser falso
- 0-49: Muito incerto - você não conhece realmente este fato

⚠️ Se o fato envolve data precisa, número exato, ou info recente → confiança MÁX 70
⚠️ Se você "acha" que está correto mas não tem CERTEZA → confiança MÁX 60

Sem markdown. Apenas JSON.`;

export const FACT_CHECK_PHASE2_PROMPT = `FACT-CHECK Fase 2 - Verificação BATCH

TROCADILHO:
- Categoria A: {OPTION_A}
- Categoria B: {OPTION_B}

ITENS A VERIFICAR:
{ITEMS_JSON}

INSTRUÇÕES:
1. USE webSearch para verificar CADA item
2. Verifique se o item pertence à categoria atribuída
3. Verifique se poderia pertencer à OUTRA categoria (→ Both)

CRITÉRIOS POR ITEM:
- Atribuição correta?
- Justificativa factual?
- Exclusão da outra categoria verificada?

JSON:
{
  "results": [
    {
      "index": 0,
      "text": "Texto do item",
      "assignedCategory": "A",
      "isCorrect": true|false,
      "confidence": 0-100,
      "shouldBe": "A"|"B"|"Both",
      "reasoning": "Explicação curta"
    }
  ],
  "summary": {
    "total": 12,
    "correct": 10,
    "incorrect": 2
  }
}

Confiança: 90+ = certo, 70-89 = provável, <70 = dúvida.
Sem markdown.`;

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
export const AMBIGUITY_CHECK_PROMPT = `Você é um especialista em controle de qualidade de perguntas de quiz.
Sua missão: verificar que uma pergunta não tem NENHUMA AMBIGUIDADE e que tem UMA ÚNICA resposta correta.

PERGUNTA: {QUESTION}
RESPOSTA CORRETA: {CORRECT_ANSWER}
RESPOSTAS ERRADAS: {WRONG_ANSWERS}
CURIOSIDADE: {ANECDOTE}

INSTRUÇÕES:
1. USE a ferramenta webSearch para verificar cada ponto de ambiguidade potencial
2. Pesquise casos onde a resposta poderia ser contestada
3. Verifique se as respostas erradas poderiam ser aceitáveis em certos contextos

⚠️ VERIFICAÇÕES CRÍTICAS (todas devem passar):

1. UNICIDADE DA RESPOSTA
   - A resposta correta é A ÚNICA resposta possível?
   - Existem controvérsias ou desacordos sobre este fato?
   - A pergunta admite várias respostas válidas segundo as fontes?

2. SINÔNIMOS E EQUIVALENTES
   - Uma opção errada é um SINÔNIMO da resposta correta?
   - Duas opções significam a MESMA COISA?
   - Um termo poderia ser EQUIVALENTE em outro contexto?

   Exemplos de sinônimos a detectar:
   - Porteiro / Zelador / Vigilante
   - Futebol / Soccer
   - Berinjela / Eggplant
   - Abobrinha / Zucchini
   - Abacate / Avocado
   - Milho / Maize

3. RESPOSTAS ERRADAS POTENCIALMENTE CORRETAS
   - Uma opção errada poderia ser correta segundo certas fontes?
   - Há controvérsia histórica/científica?
   - Uma opção errada seria aceitável em contexto diferente?

4. AMBIGUIDADE DA PERGUNTA
   - A pergunta pode ser interpretada de várias formas?
   - Uma palavra tem vários sentidos possíveis?
   - O contexto é suficiente para uma resposta única?

5. PRECISÃO FACTUAL
   - As datas, números, nomes estão EXATOS?
   - A curiosidade contém erros?
   - Os fatos são verificáveis e não contestados?

6. COERÊNCIA SEMÂNTICA PERGUNTA/RESPOSTA (CRÍTICO!)
   - A resposta responde DIRETAMENTE ao que a pergunta pede?
   - Se a pergunta propõe escolhas (A ou B) → resposta entre as escolhas?
   - Tipo de resposta esperado vs tipo de resposta dada?

   ✅ Mapeamentos a verificar:
   - "Por que X?" → Resposta = RAZÃO
   - "Quem fez X?" → Resposta = PESSOA
   - "Quando X?" → Resposta = DATA/PERÍODO
   - "Onde X?" → Resposta = LUGAR
   - "Quantos X?" → Resposta = NÚMERO
   - "É A ou B?" → Resposta = A, B ou "os dois"

   ❌ Incoerências a rejeitar:
   - "Por que X faz Y?" → Resposta: "Azul" (cor em vez de razão)
   - "É A ou B?" → Resposta: "C" (escolha fora das opções)
   - "Quem inventou X?" → Resposta: "Em 1954" (data em vez de nome)

RESPONDA em JSON (ESTRITAMENTE este formato):
{
  "hasIssues": true | false,
  "ambiguityScore": 0-10,
  "issues": [
    {
      "type": "synonym" | "multiple_answers" | "wrong_option_correct" | "unclear_question" | "factual_error" | "qa_incoherence",
      "severity": "critical" | "major" | "minor",
      "description": "Descrição do problema",
      "evidence": "Fonte ou prova do problema"
    }
  ],
  "suggestions": [
    "Sugestão para corrigir o problema..."
  ],
  "confidence": 0-100,
  "reasoning": "Resumo da análise"
}

ESCALA DE AMBIGUIDADE (ambiguityScore):
- 10: Perfeito - pergunta clara, resposta única, sem ambiguidade
- 8-9: Excelente - dúvida muito leve possível mas aceitável
- 6-7: Aceitável - pequena ambiguidade mas resposta permanece clara
- 4-5: Problemático - ambiguidade significativa, a rever
- 0-3: Rejeitado - ambiguidade maior, várias respostas possíveis

REGRAS:
- hasIssues = true se ambiguityScore < 7
- severity "critical" se a pergunta deve ser rejeitada
- severity "major" se a pergunta deve ser reformulada
- severity "minor" se a pergunta pode ser aceita com nota

Sem markdown. Apenas JSON.`;

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
    .replace('{ANECDOTE}', anecdote || 'Nenhuma');
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
export const MYTH_DETECTION_PROMPT = `Você é um detector de MITOS e LENDAS URBANAS.

PERGUNTA A VERIFICAR:
{QUESTION}
RESPOSTA PROPOSTA: {ANSWER}
CURIOSIDADE: {ANECDOTE}

INSTRUÇÕES:
1. USE webSearch para verificar se esta afirmação é um MITO CONHECIDO
2. Pesquise: "[assunto] myth", "[assunto] actually false", "[assunto] legend debunked"
3. Verifique se sites de fact-checking (Snopes, Wikipedia, etc.) desmentiram este fato

PERGUNTAS CRÍTICAS:
- É uma LENDA URBANA apresentada como fato?
- A formulação é muito categórica para um fato contestado?
- Há uma nuance importante omitida (teria querido vs fez)?
- A afirmação é "boa/surpreendente demais para ser verdade"?

MITOS COMUNS A DETECTAR (exemplos):
- Calígula e seu cavalo cônsul (nunca fez, apenas considerava)
- Einstein ruim em matemática (falso, ele era excelente)
- 10% do cérebro usado (mito total)
- Vikings com capacetes com chifres (invenção do século 19)
- Newton e a maçã (anedota não comprovada)

RESPONDA em JSON:
{
  "isMyth": true | false,
  "mythType": "urban_legend" | "exaggeration" | "misattribution" | "oversimplification" | null,
  "reality": "O que realmente aconteceu (se mito)",
  "sources": ["URLs de verificação"],
  "suggestedReformulation": "Como reformular corretamente (se mito)",
  "confidence": 0-100
}

REGRAS:
- isMyth = true → a pergunta deve ser REJEITADA ou REFORMULADA
- confiança 95-100: mito certo, bem documentado
- confiança 70-94: mito provável, fontes contraditórias
- confiança < 70: dúvida, verificação adicional necessária

Sem markdown. Apenas JSON.`;

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
    .replace('{ANECDOTE}', anecdote || 'Nenhuma');
}
