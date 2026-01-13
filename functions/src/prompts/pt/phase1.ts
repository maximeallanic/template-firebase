/**
 * Portuguese Phase 1 (Tenders) Prompts
 * Speed MCQ questions in Burger Quiz style
 * OPTIMIZED: Condensed prompts for faster generation
 */

export const PHASE1_PROMPT = `BURGER QUIZ - 10 perguntas Tenders
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}

⚠️ REGRAS RIGOROSAS:
1. 4 opções CRÍVEIS do mesmo registro (o jogador HESITA de verdade)
2. UMA ÚNICA resposta correta verificável, 3 FALSAS mas plausíveis
3. Perguntas claras e diretas (15 palavras máx)
4. Curiosidade interessante e VERDADEIRA (20 palavras máx)

❌ PROIBIDO: trocadilhos nas opções, duplicatas

JSON: [{"text":"Pergunta criativa?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fato WTF"}]`;

export const PHASE1_GENERATOR_PROMPT = `Você é um criador de perguntas BURGER QUIZ para a fase "Tenders" (Speed MCQ).

📋 CONTEXTO
Tema imposto: {TOPIC}
Dificuldade: {DIFFICULTY}
Número de perguntas: 10

🎯 REGRA #0 - COERÊNCIA TEMÁTICA RIGOROSA
TODAS as 10 perguntas DEVEM ser sobre o tema "{TOPIC}".
Explore 10 ângulos DIFERENTES do mesmo tema.
❌ ZERO pergunta fora do tema tolerada.

🎯 REGRA #1 - EXATIDÃO FACTUAL ABSOLUTA
Cada pergunta deve ter UMA ÚNICA resposta correta 100% verificável.
VERIFIQUE mentalmente cada fato ANTES de escrevê-lo.
As 3 respostas erradas devem ser FALSAS mas críveis.
❌ Nenhuma ambiguidade possível entre as respostas.

⚠️ ATENÇÃO AOS MITOS E LENDAS URBANAS:
Certas "curiosidades famosas" são na verdade FALSAS:
- Verifique SEMPRE afirmações extraordinárias com pesquisa
- Se uma história parece "boa demais para ser verdade", provavelmente é
- Prefira formulações prudentes para fatos contestados ("Segundo a lenda...", "Teria...")
- Um erro factual = REJEIÇÃO da pergunta inteira

MITOS COMUNS A NUNCA USAR COMO FATOS:
- Calígula NÃO nomeou seu cavalo cônsul
- Einstein era BOM em matemática
- Os vikings NÃO tinham capacetes com chifres
- Newton e a maçã: anedota NÃO COMPROVADA

🎯 REGRA #2 - OPÇÕES CRÍVEIS
As 4 opções devem ser CRÍVEIS e do mesmo registro.
O jogador deve DUVIDAR sinceramente entre as opções.
❌ PROIBIDO: trocadilhos óbvios, 4 opções muito similares (ex: 4 palavras em "-ismo")
✅ OBRIGATÓRIO: Variedade de formatos (nomes, números, datas, lugares, conceitos)
✅ ARMADILHA: 1-2 respostas surpreendentes que PARECEM verdadeiras

🎯 REGRA #3 - DIVERSIDADE DE ASSUNTOS
Alterne inteligentemente entre:
- Assuntos SÉRIOS (ciências, história, geografia)
- Assuntos LEVES (cultura pop, curiosidades, recordes bizarros)
- Fatos contra-intuitivos ou surpreendentes
❌ Nenhuma pergunta similar ou redundante.

🎯 REGRA #4 - CURIOSIDADES OBRIGATÓRIAS
Cada pergunta DEVE ter uma curiosidade WTF/inusitada de 20 palavras máx.
A curiosidade enriquece a resposta correta com um detalhe surpreendente VERIFICÁVEL.
❌ A curiosidade NÃO deve ser vazia ou genérica.

{PREVIOUS_FEEDBACK}

FORMATO DE SAÍDA (JSON puro, sem markdown):
[
  {
    "text": "Pergunta criativa aqui?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctIndex": 2,
    "anecdote": "Fato WTF surpreendente e verificável."
  }
]

Gere 10 perguntas DIFERENTES sobre o tema "{TOPIC}".`;

export const PHASE1_DIALOGUE_REVIEWER_PROMPT = `Você é um reviewer RIGOROSO para perguntas BURGER QUIZ Fase 1.

TEMA ESPERADO: {TOPIC}

PERGUNTAS A AVALIAR:
{QUESTIONS}

🔍 CRITÉRIOS DE AVALIAÇÃO RIGOROSOS (10 critérios):

1. COERÊNCIA TEMÁTICA (nota de 10)
   - TODAS as perguntas são sobre "{TOPIC}"?
   - ZERO tolerância para perguntas fora do tema
   - Nota < 8 = REJEIÇÃO IMEDIATA

2. EXATIDÃO FACTUAL (nota de 10)
   - Cada resposta correta é 100% verdadeira e verificável?
   - Há UMA ÚNICA resposta correta sem ambiguidade?
   - As respostas erradas são realmente falsas?
   - Nota < 8 = REJEIÇÃO IMEDIATA

3. QUALIDADE DAS OPÇÕES (nota de 10)
   - As 4 opções parecem todas plausíveis?
   - Formatos variados (não 4 nomes em "-ismo" ou 4 datas similares)?
   - Presença de 1-2 opções WTF/absurdas que parecem verdadeiras?
   - ❌ Trocadilhos óbvios, invenções cômicas
   - Nota < 7 = REJEIÇÃO

4. HUMOR & ESTILO (nota de 10)
   - Formulações criativas, absurdas, irreverentes?
   - As perguntas fazem sorrir?
   - Nota < 6 = REJEIÇÃO

5. DIVERSIDADE DE ESTILOS (nota de 10)
   - Estruturas de frases VARIADAS entre perguntas?
   - Mix de perguntas diretas, afirmativas, provocativas?
   - Nota < 7 = REJEIÇÃO

6. CLAREZA (nota de 10)
   - Perguntas curtas (≤ 15 palavras)?
   - Sem ambiguidade na formulação?
   - Nota < 7 = REJEIÇÃO

7. VARIEDADE DE ASSUNTOS (nota de 10)
   - Mix sérios/leves?
   - Sem duplicatas ou perguntas similares?
   - Nota < 7 = REJEIÇÃO

8. CURIOSIDADES (nota de 10)
   - Cada pergunta tem uma curiosidade WTF verificável?
   - Curiosidades surpreendentes e não genéricas?
   - Tamanho razoável (≤ 20 palavras)?

9. ORIGINALIDADE (nota de 10)
   - Perguntas inesperadas e frescas?
   - Sem clichês ou perguntas vistas 1000 vezes?

10. CAPACIDADE DE ENGANAR (nota de 10)
    - As perguntas fazem realmente hesitar?
    - O jogador pode errar facilmente?

⚠️ CRITÉRIOS DE REJEIÇÃO AUTOMÁTICA:
- 1+ pergunta fora do tema → approved: false
- 1+ erro factual → approved: false
- 1+ ambiguidade → approved: false
- Opções ridículas/muito similares → approved: false
- Duplicatas internas → approved: false
- Curiosidades faltando → approved: false
- Não engraçado o suficiente (humor < 6) → approved: false

✅ LIMIARES DE APROVAÇÃO (TODOS obrigatórios):
- factual_accuracy ≥ 8
- options_quality ≥ 7
- humor ≥ 6
- clarity ≥ 7
- variety ≥ 7
- overall_score ≥ 7

FORMATO DE SAÍDA (JSON puro, sem markdown):
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
      "text": "Texto da pergunta",
      "ok": true|false,
      "funny": true|false,
      "issue": "Descrição do problema se ok=false",
      "issue_type": "factual_error"|"off_topic"|"ambiguous"|"not_funny"|"too_long"|"duplicate"|"implausible_options"|"missing_anecdote"|null
    }
  ],
  "global_feedback": "Feedback detalhado sobre o conjunto de perguntas",
  "suggestions": ["Sugestão 1", "Sugestão 2", "..."]
}

Seja IMPIEDOSO. É melhor rejeitar e iterar do que validar perguntas medíocres.`;

export const PHASE1_TARGETED_REGENERATION_PROMPT = `SUBSTITUIÇÃO - Gere {COUNT} pergunta(s) Burger Quiz
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}

REJEITADAS: {BAD_QUESTIONS}
RAZÕES: {REJECTION_REASONS}

🎯 LEMBRETE ANTI-SPOILER:
• Nunca colocar a característica distintiva na pergunta
• Usar CONSEQUÊNCIAS ou AÇÕES indiretas
• 4 opções DISTINTAS (sem sinônimos)

JSON: [{"text":"Pergunta sem spoiler?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fato verificável"}]`;

export const REVIEW_PHASE1_PROMPT = `FACT-CHECK Fase 1: {QUESTIONS}

Verifique cada pergunta: 1) Resposta verdadeira? 2) Uma única resposta possível? 3) Estilo divertido? 4) Curiosidade verdadeira?

JSON: {"reviews":[{"index":0,"status":"approved"|"rejected","reason":"..."|null,"issue":"answer_wrong"|"ambiguous"|"style"|"anecdote"|null}],"summary":{"approved":8,"rejected":2,"rejectedIndices":[3,7]}}`;

export const REGENERATE_PHASE1_PROMPT = `REGENERE {COUNT} pergunta(s) Burger Quiz
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}
Rejeitadas: {REJECTED_REASONS}

Estilo divertido, respostas verificáveis, 4 opções críveis.

JSON: [{"text":"Pergunta?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"Fato WTF"}]`;
