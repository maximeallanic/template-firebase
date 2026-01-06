/**
 * Prompts Loader
 * Provides language-aware prompt loading for the game generator
 *
 * Supported languages:
 * - 'fr' (French) - Default
 * - 'en' (English)
 * - 'es' (Spanish) - Coming soon
 * - 'de' (German) - Coming soon
 * - 'pt' (Portuguese) - Coming soon
 */

import * as frPrompts from './fr';
import * as enPrompts from './en';
// Future language imports (uncomment when ready):
// import * as esPrompts from './es';
// import * as dePrompts from './de';
// import * as ptPrompts from './pt';

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'pt';

// Type for all prompts
export type PromptSet = typeof frPrompts;

// Language to prompts map
// Note: ES, DE, PT will fall back to EN until their prompts are created
const promptsByLanguage: Record<SupportedLanguage, PromptSet> = {
    fr: frPrompts,
    en: enPrompts as unknown as PromptSet,
    // Fallback to English for languages not yet implemented
    es: enPrompts as unknown as PromptSet,  // TODO: Replace with esPrompts when ready
    de: enPrompts as unknown as PromptSet,  // TODO: Replace with dePrompts when ready
    pt: enPrompts as unknown as PromptSet   // TODO: Replace with ptPrompts when ready
};

/**
 * Get all prompts for a given language
 * @param language The language code (defaults to 'fr')
 * @returns All prompts for the specified language
 */
export function getPrompts(language: SupportedLanguage = 'fr'): PromptSet {
    const prompts = promptsByLanguage[language];
    if (!prompts) {
        console.warn(`Prompts for language '${language}' not found, falling back to English`);
        return promptsByLanguage.en;
    }
    return prompts;
}

/**
 * Get a specific prompt by key for a given language
 * @param key The prompt key (e.g., 'PHASE1_PROMPT')
 * @param language The language code (defaults to 'fr')
 * @returns The prompt string or undefined if not found
 */
export function getPrompt<K extends keyof PromptSet>(
    key: K,
    language: SupportedLanguage = 'fr'
): PromptSet[K] {
    const prompts = getPrompts(language);
    return prompts[key];
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguage {
    return language in promptsByLanguage;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): SupportedLanguage[] {
    return Object.keys(promptsByLanguage) as SupportedLanguage[];
}

// Re-export all French prompts as default for backward compatibility
export * from './fr';

// Default export for convenience
export default frPrompts;
