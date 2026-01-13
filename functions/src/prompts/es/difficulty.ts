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
        easy: `MODO FÁCIL - Preguntas accesibles para todos
🎯 REGLAS DE DIFICULTAD FÁCIL:
• Temas del DÍA A DÍA: comida común, celebridades conocidas, deportes populares
• Vocabulario SIMPLE: evitar términos técnicos o especializados
• Cultura POPULAR: películas/series mainstream, música comercial
• Respuestas OBVIAS una vez que las ves
• Ejemplos: "¿De qué color es un plátano?", "¿Qué cantante interpreta 'Despacito'?"

⚠️ PROHIBIDO EN MODO FÁCIL:
❌ Términos culinarios oscuros (brunoise, salpicón, etc.)
❌ Referencias de nicho o cultura underground
❌ Fechas precisas o números complejos
❌ Conocimientos científicos avanzados`,

        normal: `MODO NORMAL - Cultura general estándar
🎯 REGLAS DE DIFICULTAD NORMAL:
• Mix de CULTURA POPULAR y hechos menos conocidos
• Vocabulario VARIADO pero no especializado
• Preguntas donde puedes DUDAR entre 2 opciones
• Anécdotas interesantes pero no oscuras
• Ejemplos: "¿Qué país consume más queso?", "¿Qué especia viene del pistilo de una flor?"

✅ BUEN EQUILIBRIO:
• 60% cultura general accesible
• 30% hechos menos conocidos pero encontrables
• 10% anécdotas sorprendentes`,

        hard: `MODO DIFÍCIL - Conocimientos profundos
🎯 REGLAS DE DIFICULTAD DIFÍCIL:
• TÉRMINOS TÉCNICOS culinarios y científicos
• Referencias HISTÓRICAS precisas
• Hechos OSCUROS pero verificables
• Preguntas donde incluso las opciones son complejas
• Ejemplos: "¿Qué técnica consiste en glasear reduciendo con mantequilla?", "¿Qué químico inventó la sacarina?"

✅ PERMITIDO EN MODO DIFÍCIL:
• Vocabulario culinario profesional
• Fechas y números precisos
• Referencias culturales de nicho
• Procesos científicos complejos`,

        wtf: `MODO WTF - Absurdo total
🎯 REGLAS DE DIFICULTAD WTF:
• Preguntas IMPOSIBLES de adivinar
• Anécdotas ABSURDAS pero verdaderas
• Conexiones TOTALMENTE inesperadas
• Hechos tan raros que no se pueden creer
• Ejemplos: "¿Cuántos litros de baba produce un caracol al año?", "¿Qué animal puede sobrevivir en el vacío del espacio?"

✅ MODO WTF = CAOS TOTAL:
• Las 4 opciones parecen todas falsas
• La respuesta correcta es contraintuitiva
• Anécdota que hace decir "¡Esto es una locura!"
• Nivel "cultura inútil definitiva"`
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
