/**
 * Difficulty Level Instructions
 * Provides specific guidance for each difficulty level
 */

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'wtf';

/**
 * Get detailed instructions for a specific difficulty level
 * @param difficulty The difficulty level
 * @returns Detailed instructions to include in prompts
 */
export function getDifficultyInstructions(difficulty: DifficultyLevel): string {
    const instructions = {
        easy: `MODO FÁCIL - Perguntas acessíveis para todos
🎯 REGRAS DE DIFICULDADE FÁCIL:
• Assuntos do COTIDIANO: comida comum, celebridades conhecidas, esportes populares
• Vocabulário SIMPLES: evitar termos técnicos ou especializados
• Cultura POPULAR: filmes/séries populares, música mainstream
• Respostas ÓBVIAS quando você as vê
• Exemplos: "Qual é a cor de uma banana?", "Qual rapper se chama Snoop Dogg?"

⚠️ PROIBIDO NO MODO FÁCIL:
❌ Termos culinários obscuros (brunoise, salpicon, etc.)
❌ Referências de nicho ou cultura underground
❌ Datas precisas ou números complexos
❌ Conhecimentos científicos avançados`,

        normal: `MODO NORMAL - Cultura geral padrão
🎯 REGRAS DE DIFICULDADE NORMAL:
• Mix de CULTURA POPULAR e fatos menos conhecidos
• Vocabulário VARIADO mas não especializado
• Perguntas onde você pode HESITAR entre 2 opções
• Curiosidades interessantes mas não obscuras
• Exemplos: "Qual país consome mais queijo?", "Qual tempero vem do pistilo de uma flor?"

✅ BOM EQUILÍBRIO:
• 60% cultura geral acessível
• 30% fatos menos conhecidos mas encontráveis
• 10% curiosidades surpreendentes`,

        hard: `MODO DIFÍCIL - Conhecimentos aprofundados
🎯 REGRAS DE DIFICULDADE DIFÍCIL:
• TERMOS TÉCNICOS culinários e científicos
• Referências HISTÓRICAS precisas
• Fatos OBSCUROS mas verificáveis
• Perguntas onde até as opções são complexas
• Exemplos: "Qual técnica consiste em glacear reduzindo com manteiga?", "Qual químico inventou a sacarina?"

✅ PERMITIDO NO MODO DIFÍCIL:
• Vocabulário culinário profissional
• Datas e números precisos
• Referências culturais de nicho
• Processos científicos complexos`,

        wtf: `MODO WTF - Absurdidade total
🎯 REGRAS DE DIFICULDADE WTF:
• Perguntas IMPOSSÍVEIS de adivinhar
• Curiosidades ABSURDAS mas verdadeiras
• Conexões TOTALMENTE inesperadas
• Fatos tão bizarros que ninguém acredita
• Exemplos: "Quantos litros de baba um caracol produz por ano?", "Qual animal pode sobreviver no vácuo espacial?"

✅ MODO WTF = CAOS TOTAL:
• As 4 opções parecem todas falsas
• A resposta correta é contra-intuitiva
• Curiosidade que faz dizer "Isso é loucura!"
• Nível "cultura inútil suprema"`
    };

    return instructions[difficulty] || instructions.normal;
}

/**
 * Get a short difficulty label to replace {DIFFICULTY} in prompts
 * @param difficulty The difficulty level
 * @returns Short label (e.g., "FÁCIL", "NORMAL", "DIFÍCIL", "WTF")
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
    const labels = {
        easy: 'FÁCIL',
        normal: 'NORMAL',
        hard: 'DIFÍCIL',
        wtf: 'WTF'
    };
    return labels[difficulty] || 'NORMAL';
}

/**
 * Get full difficulty context to inject into prompts
 * Combines label + detailed instructions
 * @param difficulty The difficulty level
 * @returns Full difficulty context string
 */
export function getFullDifficultyContext(difficulty: DifficultyLevel): string {
    const label = getDifficultyLabel(difficulty);
    const instructions = getDifficultyInstructions(difficulty);
    return `${label}\n\n${instructions}`;
}
