/**
 * Language types for multi-language question generation
 *
 * Used across frontend and backend for:
 * - Player language preferences
 * - Room language determination
 * - AI question generation
 */

/**
 * Supported languages for AI question generation
 * Matches the UI languages supported by i18n
 */
export type GameLanguage = 'fr' | 'en' | 'es' | 'de' | 'pt';

/**
 * List of all supported game languages
 */
export const GAME_LANGUAGES: GameLanguage[] = ['fr', 'en', 'es', 'de', 'pt'];

/**
 * Language display names (in their native language)
 */
export const LANGUAGE_NAMES: Record<GameLanguage, string> = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    pt: 'Português'
};

/**
 * Language flag emojis for UI display
 */
export const LANGUAGE_FLAGS: Record<GameLanguage, string> = {
    fr: '🇫🇷',
    en: '🇬🇧',
    es: '🇪🇸',
    de: '🇩🇪',
    pt: '🇵🇹'
};

/**
 * Default language when none is specified
 */
export const DEFAULT_GAME_LANGUAGE: GameLanguage = 'en';

/**
 * Check if a string is a valid GameLanguage
 */
export function isValidGameLanguage(lang: string): lang is GameLanguage {
    return GAME_LANGUAGES.includes(lang as GameLanguage);
}

/**
 * Get GameLanguage from string, with fallback
 */
export function toGameLanguage(lang: string | undefined): GameLanguage {
    if (lang && isValidGameLanguage(lang)) {
        return lang;
    }
    return DEFAULT_GAME_LANGUAGE;
}
