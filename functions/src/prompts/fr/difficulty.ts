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
        easy: `MODE FACILE - Questions accessibles pour tous
🎯 RÈGLES DE DIFFICULTÉ FACILE :
• Sujets du QUOTIDIEN : nourriture courante, célébrités connues, sports populaires
• Vocabulaire SIMPLE : éviter les termes techniques ou spécialisés
• Culture POPULAIRE : films/séries grand public, musique mainstream
• Réponses ÉVIDENTES une fois qu'on les voit
• Exemples : "Quelle couleur a une banane ?", "Quel rappeur s'appelle Maître Gims ?"

⚠️ INTERDIT EN MODE FACILE :
❌ Termes culinaires obscurs (brunoise, salpicon, etc.)
❌ Références de niche ou culture underground
❌ Dates précises ou chiffres complexes
❌ Connaissances scientifiques pointues`,

        normal: `MODE NORMAL - Culture générale standard
🎯 RÈGLES DE DIFFICULTÉ NORMALE :
• Mix de CULTURE POPULAIRE et faits moins connus
• Vocabulaire VARIÉ mais pas spécialisé
• Questions où on peut HÉSITER entre 2 options
• Anecdotes intéressantes mais pas obscures
• Exemples : "Quel pays consomme le plus de fromage ?", "Quelle épice vient du pistil d'une fleur ?"

✅ BON ÉQUILIBRE :
• 60% culture générale accessible
• 30% faits moins connus mais trouvables
• 10% anecdotes surprenantes`,

        hard: `MODE DIFFICILE - Connaissances approfondies
🎯 RÈGLES DE DIFFICULTÉ DIFFICILE :
• TERMES TECHNIQUES culinaires et scientifiques
• Références HISTORIQUES précises
• Faits OBSCURS mais vérifiables
• Questions où même les options sont complexes
• Exemples : "Quelle technique consiste à glacer en réduisant au beurre ?", "Quel chimiste a inventé la saccharine ?"

✅ AUTORISÉ EN MODE DIFFICILE :
• Vocabulaire culinaire professionnel
• Dates et chiffres précis
• Références culturelles de niche
• Processus scientifiques complexes`,

        wtf: `MODE WTF - Absurdité totale
🎯 RÈGLES DE DIFFICULTÉ WTF :
• Questions IMPOSSIBLES à deviner
• Anecdotes ABSURDES mais vraies
• Connexions TOTALEMENT inattendues
• Faits si bizarres qu'on ne peut pas y croire
• Exemples : "Combien de litres de bave produit un escargot par an ?", "Quel animal peut survivre dans le vide spatial ?"

✅ MODE WTF = CHAOS TOTAL :
• Les 4 options semblent toutes fausses
• La bonne réponse est contre-intuitive
• Anecdote qui fait dire "C'est n'importe quoi !"
• Niveau "culture inutile ultime"`
    };

    return instructions[difficulty] || instructions.normal;
}

/**
 * Get a short difficulty label to replace {DIFFICULTY} in prompts
 * @param difficulty The difficulty level
 * @returns Short label (e.g., "FACILE", "NORMAL", "DIFFICILE", "WTF")
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
    const labels = {
        easy: 'FACILE',
        normal: 'NORMAL',
        hard: 'DIFFICILE',
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
