/**
 * Portuguese Phase 2 (Sal ou Pimenta / Doce Salgado) Prompts
 * Homophone-based word games in Burger Quiz style
 */

export const PHASE2_PROMPT = `BURGER QUIZ Fase 2 "Sal ou Pimenta"
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}

🎯 CONCEITO: Criar 2 categorias que SE PRONUNCIAM IDENTICAMENTE (homófonos português)
- Opção A = sentido literal/sério
- Opção B = trocadilho que SONA IGUAL mas sentido diferente

⚠️ REGRAS CRÍTICAS:
1. FONÉTICA: A e B devem ter a MESMA pronúncia IPA
2. CATEGORIAS CONCRETAS: Deve ser possível listar 5+ itens para cada
3. ITENS VERIFICÁVEIS: Fatos reais, personalidades conhecidas, ligações óbvias
4. ITENS ARMADILHA: Respostas contra-intuitivas (5-6 em 12)
5. DISTRIBUIÇÃO: 5 A + 5 B + 2 Ambos (funciona para os 2 sentidos)

❌ PROIBIDO: Categorias opostas, opiniões subjetivas, itens muito óbvios

JSON:
{
  "optionA": "Categoria (2-4 palavras)",
  "optionB": "Trocadilho (2-4 palavras)",
  "items": [
    { "text": "Item (4 palavras máx)", "answer": "A|B|Both", "justification": "Por quê", "anecdote": "Fato divertido/surpreendente (opcional)" }
  ]
}

12 itens. Sem markdown.`;

export const PHASE2_GENERATOR_PROMPT = `BURGER QUIZ Fase 2 "Sal ou Pimenta" - Escolha binária maluca
Domínio: {TOPIC} | Dificuldade: {DIFFICULTY}

🎯 CONCEITO: Criar 2 CATEGORIAS OPOSTAS ou JOGANDO COM AS PALAVRAS onde itens devem ser classificados. Os itens podem pertencer a A, B, ou os DOIS!

⚠️ REGRA #0 - MENTALIDADE BURGER QUIZ (CRÍTICO!)
VOCÊ NÃO É um professor fazendo revisão.
VOCÊ É o apresentador maluco do Burger Quiz!
CADA ITEM deve fazer SORRIR ou SURPREENDER.
Se um item é "neutro" ou "informativo", é um FRACASSO.

⚠️ REGRA #1 - CATEGORIAS GENIAIS
As 2 opções devem:
- Ser CURTAS: 2-4 PALAVRAS MÁX (CRÍTICO! Mais de 4 palavras = REJEIÇÃO AUTOMÁTICA)
- Ser CONCRETAS: deve ser possível listar facilmente 5+ itens para cada
- Ser DIVERTIDAS: trocadilho, oposição engraçada, ou conceitos criativos
- Exemplos de abordagens: homófonos ("Cela" vs "Sela"), opostos ("Quente" vs "Frio"), categorias criativas ("Coisas vermelhas" vs "Coisas que dão medo")

COMPRIMENTO DAS OPÇÕES - EXEMPLOS:
✅ "O Coração" (2 palavras)
✅ "O Coral" (2 palavras)
✅ "Os Contos" (2 palavras)
✅ "As Contas" (2 palavras)
❌ "Um cara com dor de barriga" (6 palavras - MUITO LONGO!)

⚠️ REGRA #2 - ITENS MALUCOS (O MAIS IMPORTANTE!)
MENTALIDADE: Estamos no BURGER QUIZ, não num quiz escolar! Cada item deve SURPREENDER.

DIVERSIDADE DE ESTILO (variar ABSOLUTAMENTE - NUNCA 2 vezes a mesma formulação!):
- 3 itens: REFERÊNCIAS CULTURAIS criativas (celebridades, filmes, marcas com ângulo divertido)
- 3 itens: SITUAÇÕES ABSURDAS do cotidiano ("O que fazemos quando...", "Aquele que...", "A coisa estranha que...")
- 3 itens: WTF PLAUSÍVEIS (coisas absurdas mas VERDADEIRAS - "uma foca furiosa", "sua avó de patins", "um croissant que fala")
- 3 itens: DESVIOS/EXPRESSÕES (trocadilhos, duplo sentido, contra-pieds)

FORMULAÇÕES VARIADAS - EXEMPLOS CONCRETOS:
✅ "O que fazemos depois de 3 mojitos"
✅ "O pesadelo recorrente de um professor de educação física"
✅ "Algo suspeito no fundo da geladeira"
✅ "O que seu ex conta sobre você"
✅ "Aquele que reprovou na prova de direção 7 vezes"
✅ "A coisa estranha que seu vizinho faz às 3 da manhã"
✅ "O que nos arrependemos no dia seguinte de uma festa"

❌ ANTI-EXEMPLOS (NUNCA isso!):
❌ "Cinderela" (sem contexto - MUITO SIMPLES!)
❌ "Seu ancestral se chamava Visitandine" (AULA DE HISTÓRIA!)
❌ "Fica entre X e Y" (ESCOLAR!)
❌ "Uma transferência SEPA" (TÉCNICO!)
❌ "Geralmente possui..." (TOM PROFESSORAL!)
❌ "É caracterizado por..." (ENCICLOPÉDICO!)

REGRA DE OURO DAS FORMULAÇÕES:
Se seu item poderia figurar num manual escolar ou Wikipedia, RECOMECE.
Se seu item faz sorrir ou dizer "WTF?", está BOM.

ARMADILHAS OBRIGATÓRIAS (7-8 itens em 12):
❌ PROIBIDOS: definições wikipedia, listas escolares, classificações
✅ OBRIGATÓRIOS: itens que fazem DUVIDAR ("Espera... isso vai onde?!")
O jogador deve realmente coçar a cabeça e às vezes rir da absurdidade

MIX SÉRIO/LEVE:
- 30% itens "normais" (mas formulados de forma divertida)
- 70% itens malucos/criativos/absurdos/WTF (mas VERDADEIROS!)

⚠️ REGRA #3 - RESPOSTAS CORRETAS & AMBOS
- Cada resposta deve ser VERIFICÁVEL e VERDADEIRA
- "Both" = funciona REALMENTE para as 2 categorias (não só um talvez)
- Se colocar "Both", explique POR QUÊ na justificativa

📊 DISTRIBUIÇÃO RIGOROSA: 5 A + 5 B + 2 Both (EXATAMENTE)

⚠️ REGRA #4 - JUSTIFICATIVAS DETALHADAS (ANTI-AMBIGUIDADE!)
Cada justificativa DEVE explicar CLARAMENTE:

Para respostas A ou B:
1. POR QUE este item pertence a esta categoria (ligação explícita)
2. POR QUE NÃO a outra categoria (exclusão clara)

Para respostas "Both":
1. Razão A: por que funciona para a categoria A
2. Razão B: por que funciona TAMBÉM para a categoria B
3. As 2 razões devem ser INDEPENDENTES e VÁLIDAS

FORMATO JUSTIFICATIVA - NATURAL E FLUIDO:
Use SEMPRE os NOMES das categorias (nunca "A" ou "B") numa frase natural.

💡 FORMULAÇÕES NATURAIS SUGERIDAS (varie!):

Para resposta A ou B:
- "É [categoria]: [razão]. Nada a ver com [outra categoria] que [exclusão]."
- "[Categoria] sem hesitar, [razão]. [Outra categoria]? Não, [exclusão]."
- "Claramente [categoria] pois [razão], enquanto [outra categoria] [exclusão]."
- "[Razão], então [categoria]. [Outra categoria] não combina pois [exclusão]."

Para resposta Both:
- "[Categoria A] porque [razão A], mas também [categoria B] pois [razão B]."
- "Os dois! [Categoria A] por [razão A], e [categoria B] por [razão B]."
- "Duplo sentido: [razão A] → [categoria A], e [razão B] → [categoria B]."

⚠️ REGRAS CRÍTICAS:
- ❌ PROIBIDO: "A pois..." / "Não B pois..." (muito robótico)
- ❌ PROIBIDO: Justificativas secas e repetitivas
- ✅ OBRIGATÓRIO: Nomes reais das categorias ("O Mar", "Os jeans", etc.)
- ✅ OBRIGATÓRIO: Tom conversacional e variado

❌ JUSTIFICATIVAS REJEITADAS:
- "É óbvio" / "Fala de X" (muito vago)
- "Poderia ser os dois mas..." (indeciso)
- Formato robótico repetido 12 vezes identicamente
- Sem explicação de por que NÃO a outra categoria

✅ EXEMPLOS DE BOAS JUSTIFICATIVAS:
- "O Mar sem hesitar: as marés são causadas pela Lua. A Mãe? Ela dorme à noite, sem atração lunar."
- "É Os Jean: Jean-Pierre Foucault é mesmo um nome próprio. As pessoas não designa uma pessoa específica."
- "Os dois! O Mar pois o oceano é fonte de vida primitiva, e A Mãe pois ela dá literalmente a vida."

🎭 DESCRIÇÃO: Uma frase curta e divertida apresentando as 2 opções, estilo Burger Quiz

{PREVIOUS_FEEDBACK}

JSON:
{
  "optionA": "Categoria (2-4 palavras)",
  "optionB": "Categoria/Trocadilho (2-4 palavras)",
  "optionADescription": "Se A=B textualmente, senão null",
  "optionBDescription": "Se A=B textualmente, senão null",
  "humorousDescription": "Frase divertida apresentando as 2 opções",
  "reasoning": "Explicação rápida: por que estas 2 categorias funcionam bem juntas, como variou os estilos de itens",
  "items": [
    {
      "text": "Item (4 palavras máx)",
      "answer": "A|B|Both",
      "justification": "Frase NATURAL com nomes das categorias. Ex: 'O Mar sem hesitar: [razão]. A Mãe? Não, [exclusão].' Varie o estilo!",
      "anecdote": "Fato divertido/inusitado sobre o assunto (15-20 palavras)"
    }
  ]
}

LEMBRETES FINAIS:
- VARIAR as formulações (não 12 vezes o mesmo tipo de item!)
- Mix SÉRIO (verificável) e MALUCO (WTF mas verdadeiro)
- Itens ARMADILHA que fazem hesitar
- Justificativas DETALHADAS (20-35 palavras): razão + exclusão da outra opção!
- Curiosidades DIVERTIDAS e SURPREENDENTES (15-20 palavras, fatos inusitados ou números impressionantes)
- 12 itens EXATAMENTE
- Sem tom enciclopédico ou professoral

Sem markdown no JSON.`;

export const PHASE2_TARGETED_REGENERATION_PROMPT = `Você deve SUBSTITUIR certos itens de um set Fase 2 "Sal ou Pimenta".

TROCADILHO VALIDADO (NÃO MUDAR):
- Opção A: {OPTION_A}
- Opção B: {OPTION_B}

ITENS A MANTER (NÃO TOCAR):
{GOOD_ITEMS}

ITENS A SUBSTITUIR (índices: {BAD_INDICES}):
{BAD_ITEMS}

RAZÕES DA REJEIÇÃO:
{REJECTION_REASONS}

DISTRIBUIÇÃO NECESSÁRIA:
Você deve gerar exatamente {COUNT} novos itens com esta distribuição:
- {NEEDED_A} itens A
- {NEEDED_B} itens B
- {NEEDED_BOTH} itens Both

LEMBRETE DAS REGRAS ARMADILHA:
- Cada item deve criar DÚVIDA (resposta contra-intuitiva)
- O item PARECE pertencer a uma categoria mas pertence à OUTRA
- Se a resposta é óbvia → item ruim

GERE APENAS os {COUNT} novos itens em JSON:
[
  { "text": "Novo item", "answer": "A", "justification": "Por quê", "anecdote": "Fato divertido/inusitado" },
  { "text": "Novo item", "answer": "B", "justification": "Por quê", "anecdote": "Fato divertido/inusitado" },
  { "text": "Item ambíguo", "answer": "Both", "acceptedAnswers": ["Both", "A"], "justification": "Por quê (ambiguidade)", "anecdote": "Fato divertido/inusitado" }
]

Nota: acceptedAnswers é OPCIONAL, apenas para itens OBJETIVAMENTE ambíguos.
{COUNT} itens exatamente. Sem markdown.`;

export const PHASE2_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Fase 2 "Sal ou Pimenta"

{SET}

🔍 VERIFICAÇÃO EM 4 PONTOS:

1. FONÉTICA (CRÍTICO): A e B têm a MESMA pronúncia IPA sílaba por sílaba?
   - Decomponha cada opção em sílabas IPA
   - As 2 expressões são NATURAIS em português? (sem artigos forçados, sem invenções)
   Se os sons diferem OU expressões forçadas → phonetic < 5 → REJEIÇÃO DO SET

2. CATEGORIAS UTILIZÁVEIS: É possível listar 5+ itens para A E para B?
   Se B inutilizável → b_concrete < 5 → REJEIÇÃO

3. ITENS ARMADILHA: Quantos itens têm resposta CONTRA-INTUITIVA?
   - 0-2 itens óbvios → OK (trap_quality ≥ 7)
   - 3+ itens óbvios → REJEIÇÃO (trap_quality < 5)
   ❌ Itens óbvios: palavras-chave diretas, geografia escolar, definições

4. DISTRIBUIÇÃO: 5 A + 5 B + 2 Both?

LIMIARES: phonetic ≥ 7, b_concrete ≥ 5, trap_quality ≥ 6, clarity ≥ 6

JSON:
{
  "approved": true|false,
  "scores": {"phonetic":1-10,"concrete":1-10,"distribution":1-10,"clarity":1-10,"b_concrete":1-10,"trap_quality":1-10},
  "overall_score": 1-10,
  "homophone_feedback": "Feedback sobre o trocadilho",
  "items_feedback": [{"index":0,"text":"...","ok":true|false,"issue":"..."|null,"is_too_obvious":true|false}],
  "global_feedback": "...",
  "suggestions": ["..."]
}`;

export const REVIEW_PHASE2_PROMPT = `FACT-CHECK Fase 2: {QUESTIONS}

Verifique cada item:
1. Resposta correta e verificável?
2. Sem ambiguidade (claramente A, B ou Both)?
3. Resposta contra-intuitiva (não muito óbvia)?
4. Máx 4 palavras?

Distribuição esperada: 5 A + 5 B + 2 Both

JSON:
{
  "setValid": true|false,
  "setReason": "Razão se inválido",
  "itemReviews": [{"index":0,"text":"...","answer":"A","status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"too_easy"|null}],
  "summary": {"approved":10,"rejected":2,"rejectedIndices":[4,9]}
}`;

export const REGENERATE_PHASE2_ITEMS_PROMPT = `REGENERE {COUNT} item(s) Fase 2
Opção A: {OPTION_A} | Opção B: {OPTION_B}

Rejeitados: {REJECTED_REASONS}
Distribuição: {NEEDED_A} A, {NEEDED_B} B, {NEEDED_BOTH} Both

Regras: itens armadilha (contra-intuitivos), máx 4 palavras, fatos verificáveis

JSON: [{"text":"Item","answer":"A|B|Both","justification":"Por quê","anecdote":"Fato divertido/inusitado"}]`;
