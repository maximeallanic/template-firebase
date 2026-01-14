/**
 * Portuguese Phase 4 (A Conta) Prompts
 * MCQ Race - Cultura Geral clássica
 */

export const PHASE4_PROMPT = `BURGER QUIZ Fase 4 "A Conta" - Corrida de QCM
Tema: {TOPIC} | Dificuldade: {DIFFICULTY}

🎯 CONCEITO: Corrida de rapidez, o primeiro a responder corretamente ganha.

⚠️ REGRAS:
1. 4 opções por pergunta (1 correta, 3 distratores PLAUSÍVEIS)
2. Respostas VERIFICÁVEIS (use Google)
3. Mix de temas: história, geo, ciências, artes, esporte

JSON:
[
  {
    "text": "Pergunta clara?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fato divertido (opcional)"
  }
]

10 perguntas. Sem markdown.`;

export const PHASE4_GENERATOR_PROMPT = `BURGER QUIZ Fase 4 "A Conta" - QCM Cultura Geral
Tema sugerido: {TOPIC} | Dificuldade: {DIFFICULTY}

🎯 CONCEITO: Corrida de rapidez QCM - Cultura geral variada como no Burger Quiz TV!

⚠️ REGRA #1 - VARIEDADE TEMÁTICA (CRÍTICO!)
ATENÇÃO: O tema acima é apenas uma SUGESTÃO para 2-3 perguntas no máximo.
As 10 perguntas DEVEM obrigatoriamente cobrir domínios VARIADOS:

DISTRIBUIÇÃO OBRIGATÓRIA:
- 2-3 perguntas História / Geografia (datas, países, personagens históricos)
- 2-3 perguntas Ciências / Natureza / Animais (biologia, física, astronomia)
- 2-3 perguntas Artes / Música / Cinema (obras, artistas, filmes)
- 2-3 perguntas Esporte / Cultura pop / Cotidiano (recordes, celebridades, tradições)

PROIBIDO: Mais de 3 perguntas sobre o mesmo assunto. Varie ao máximo!

⚠️ REGRA #2 - FORMATO QCM
- 4 opções (1 correta, 3 distratores PLAUSÍVEIS do mesmo registro)
- Perguntas claras e diretas (máx 25 palavras)
- Curiosidade curta e impactante (máx 30 palavras)

⚠️ REGRA #2b - DISTRATORES DO MESMO UNIVERSO (CRÍTICO!)
As 4 opções DEVEM pertencer ao MESMO universo/contexto que a pergunta:

✅ BONS DISTRATORES:
- Pergunta sobre Star Wars → 4 naves de STAR WARS (não Star Trek!)
- Pergunta sobre o Brasil → 4 cidades/estados BRASILEIROS
- Pergunta sobre os Beatles → 4 grupos da MESMA ÉPOCA
- Pergunta sobre um esporte → 4 atletas do MESMO ESPORTE

❌ MAUS DISTRATORES (REJEIÇÃO IMEDIATA):
- Misturar Star Wars e Star Trek (universos diferentes!)
- Misturar futebol e tênis na mesma pergunta
- Colocar uma resposta absurda que não engana ninguém
- Incluir uma opção de outro domínio/época/universo

REGRA DE OURO: Um especialista do domínio deve hesitar entre as 4 opções.
Se uma opção é "obviamente falsa" pois fora do assunto → MAU distrator.

⚠️ REGRA #3 - DISTRIBUIÇÃO DE DIFICULDADE
- 3 FÁCEIS (conhecimento comum: capitais, datas célebres, filmes cult)
- 4 MÉDIAS (cultura geral sólida necessária)
- 3 DIFÍCEIS (curiosidades específicas, detalhes pouco conhecidos)

⚠️ REGRA #4 - EXATIDÃO ABSOLUTA
USE Google para verificar CADA resposta antes de escrevê-la.
Nenhuma ambiguidade, nenhum debate possível. Se hesitar, mude a pergunta.

⚠️ REGRA #5 - ATENÇÃO AOS MITOS E LENDAS URBANAS
Certas "curiosidades famosas" são na verdade FALSAS:
- Verifique SEMPRE afirmações extraordinárias com pesquisa
- Se uma história parece "boa demais para ser verdade", provavelmente é
- Prefira formulações prudentes para fatos contestados ("Segundo a lenda...", "Teria...")
- Um erro factual = REJEIÇÃO da pergunta inteira

MITOS COMUNS A NUNCA USAR COMO FATOS:
- Calígula NÃO nomeou seu cavalo cônsul (apenas considerava fazer)
- Einstein era BOM em matemática
- Os vikings NÃO tinham capacetes com chifres
- Newton e a maçã: anedota NÃO COMPROVADA
- Maria Antonieta: "que comam brioches" nunca documentado

{PREVIOUS_FEEDBACK}

JSON:
[
  {
    "text": "Pergunta precisa?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "anecdote": "Fato verificado e impactante"
  }
]

10 perguntas VARIADAS. Sem markdown.`;

export const PHASE4_DIALOGUE_REVIEWER_PROMPT = `REVIEWER Fase 4 "A Conta" (QCM)

{QUESTIONS}

🔍 VERIFICAÇÃO EM 4 PONTOS:

1. EXATIDÃO (CRÍTICO): Respostas verdadeiras? Use Google!
2. OPÇÕES: 4 opções plausíveis do mesmo registro?
3. DIFICULDADE: 3 fáceis + 4 médias + 3 difíceis?
4. VARIEDADE: Mix história, geo, ciências, artes, esporte?

LIMIARES: factual_accuracy ≥ 7, option_plausibility ≥ 6

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

Sem markdown.`;

export const PHASE4_TARGETED_REGENERATION_PROMPT = `SUBSTITUIÇÃO Fase 4 "A Conta" (QCM)

MANTER: {GOOD_QUESTIONS}
SUBSTITUIR (índices {BAD_INDICES}): {BAD_QUESTIONS}
RAZÕES: {REJECTION_REASONS}

REGRAS: 4 opções plausíveis, 1 correta, verifique no Google, curiosidade opcional.

JSON:
[
  {"text":"...?","options":["A","B","C","D"],"correctIndex":0,"anecdote":"..."}
]

{COUNT} perguntas. Sem markdown.`;
