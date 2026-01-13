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
        easy: `LEICHTER MODUS - Zugängliche Fragen für alle
🎯 REGELN FÜR LEICHTEN SCHWIERIGKEITSGRAD:
• ALLTÄGLICHE Themen: gängiges Essen, bekannte Prominente, populäre Sportarten
• EINFACHES Vokabular: keine Fachbegriffe oder Spezialausdrücke
• POPULÄRE Kultur: Mainstream-Filme/Serien, bekannte Musik
• Antworten, die OFFENSICHTLICH sind, sobald man sie sieht
• Beispiele: "Welche Farbe hat eine Banane?", "Welcher Rapper heißt Bushido?"

⚠️ VERBOTEN IM LEICHTEN MODUS:
❌ Obskure kulinarische Begriffe (Brunoise, Salpikon, etc.)
❌ Nischen-Referenzen oder Underground-Kultur
❌ Präzise Daten oder komplexe Zahlen
❌ Vertiefte wissenschaftliche Kenntnisse`,

        normal: `NORMALER MODUS - Standard-Allgemeinwissen
🎯 REGELN FÜR NORMALEN SCHWIERIGKEITSGRAD:
• Mix aus POPKULTUR und weniger bekannten Fakten
• ABWECHSLUNGSREICHES Vokabular, aber nicht spezialisiert
• Fragen, bei denen man zwischen 2 Optionen ZÖGERN kann
• Interessante Anekdoten, aber nicht obskur
• Beispiele: "Welches Land konsumiert am meisten Käse?", "Welches Gewürz stammt aus der Narbe einer Blume?"

✅ GUTE BALANCE:
• 60% zugängliches Allgemeinwissen
• 30% weniger bekannte, aber auffindbare Fakten
• 10% überraschende Anekdoten`,

        hard: `SCHWERER MODUS - Vertiefte Kenntnisse
🎯 REGELN FÜR SCHWEREN SCHWIERIGKEITSGRAD:
• FACHBEGRIFFE aus Kulinarik und Wissenschaft
• PRÄZISE historische Referenzen
• OBSKURE, aber verifizierbare Fakten
• Fragen, bei denen sogar die Optionen komplex sind
• Beispiele: "Welche Technik bezeichnet das Glasieren durch Reduzieren mit Butter?", "Welcher Chemiker hat Saccharin erfunden?"

✅ IM SCHWEREN MODUS ERLAUBT:
• Professionelles kulinarisches Vokabular
• Präzise Daten und Zahlen
• Nischen-Kulturreferenzen
• Komplexe wissenschaftliche Prozesse`,

        wtf: `WTF-MODUS - Totale Absurdität
🎯 REGELN FÜR WTF-SCHWIERIGKEITSGRAD:
• UNMÖGLICH zu erratende Fragen
• ABSURDE, aber wahre Anekdoten
• VÖLLIG unerwartete Zusammenhänge
• Fakten so bizarr, dass man sie nicht glauben kann
• Beispiele: "Wie viele Liter Schleim produziert eine Schnecke pro Jahr?", "Welches Tier kann im Weltraum-Vakuum überleben?"

✅ WTF-MODUS = TOTALES CHAOS:
• Alle 4 Optionen scheinen falsch zu sein
• Die richtige Antwort ist kontraintuitiv
• Anekdote, die einen sagen lässt "Das ist doch Quatsch!"
• Level "ultimatives nutzloses Wissen"`
    };

    return instructions[difficulty] || instructions.normal;
}

/**
 * Get a short difficulty label to replace {DIFFICULTY} in prompts
 * @param difficulty The difficulty level
 * @returns Short label (e.g., "LEICHT", "NORMAL", "SCHWER", "WTF")
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
    const labels = {
        easy: 'LEICHT',
        normal: 'NORMAL',
        hard: 'SCHWER',
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
