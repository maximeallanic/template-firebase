/**
 * Prompts Loader
 * Provides language-aware prompt loading for the game generator
 *
 * Supported languages:
 * - 'fr' (French) - Default
 * - 'en' (English)
 * - 'es' (Spanish)
 * - 'de' (German)
 * - 'pt' (Portuguese)
 */

import * as frPrompts from './fr';
import * as enPrompts from './en';
import * as esPrompts from './es';
import * as dePrompts from './de';
import * as ptPrompts from './pt';

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'pt';

// Type for all prompts
export type PromptSet = typeof frPrompts;

// Language to prompts map
const promptsByLanguage: Record<SupportedLanguage, PromptSet> = {
    fr: frPrompts,
    en: enPrompts as unknown as PromptSet,
    es: esPrompts as unknown as PromptSet,
    de: dePrompts as unknown as PromptSet,
    pt: ptPrompts as unknown as PromptSet
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
