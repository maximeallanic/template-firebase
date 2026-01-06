import { useTranslation } from 'react-i18next';
import {
    type GameLanguage,
    GAME_LANGUAGES,
    LANGUAGE_NAMES,
    LANGUAGE_FLAGS
} from '../../types/languageTypes';

interface RoomLanguageSelectorProps {
    /** Current effective language (what will be used for AI generation) */
    effectiveLanguage: GameLanguage;
    /** Currently forced language (null = auto-detection) */
    forcedLanguage: GameLanguage | null;
    /** Whether all players have the same language (unanimous) */
    isUnanimous: boolean;
    /** The unanimous language if all players share one */
    unanimousLanguage: GameLanguage | null;
    /** Callback when host changes the forced language */
    onChange: (language: GameLanguage | null) => void;
    /** Is the selector disabled (non-host or game started) */
    disabled?: boolean;
    /** Show as compact version (for small spaces) */
    compact?: boolean;
}

/**
 * Language selector for AI question generation in multiplayer rooms
 *
 * Features:
 * - "Auto" mode: uses unanimous player language, or English if mixed
 * - Manual override: host can force a specific language
 * - Visual feedback: shows flags and current selection status
 */
export function RoomLanguageSelector({
    effectiveLanguage,
    forcedLanguage,
    isUnanimous,
    unanimousLanguage,
    onChange,
    disabled = false,
    compact = false
}: RoomLanguageSelectorProps) {
    const { t } = useTranslation('game-ui');

    // Auto mode = no forced language
    const isAutoMode = forcedLanguage === null;

    // Build auto label with detected language info
    const autoLabel = isUnanimous && unanimousLanguage
        ? `Auto (${LANGUAGE_FLAGS[unanimousLanguage]})`
        : `Auto (${LANGUAGE_FLAGS.en})`;

    // Auto tooltip explanation
    const autoTooltip = isUnanimous && unanimousLanguage
        ? t('language.autoUnanimous', { lang: LANGUAGE_NAMES[unanimousLanguage] })
        : t('language.autoMixed');

    return (
        <div className="w-full">
            {!compact && (
                <label className="block text-gray-400 text-sm font-medium mb-2 text-center">
                    {t('language.label')}
                </label>
            )}
            <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-2'} justify-center`}>
                {/* Auto option */}
                <button
                    type="button"
                    onClick={() => !disabled && onChange(null)}
                    disabled={disabled}
                    title={autoTooltip}
                    className={`
                        ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
                        font-bold rounded-lg transition-all duration-200
                        ${isAutoMode
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white ring-2 ring-cyan-500 shadow-lg scale-105'
                            : 'bg-cyan-900/30 hover:bg-cyan-800/40 text-gray-300 hover:text-white'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        flex items-center gap-1
                    `}
                    aria-pressed={isAutoMode}
                    aria-label={t('language.auto')}
                >
                    <span>{autoLabel}</span>
                </button>

                {/* Language options */}
                {GAME_LANGUAGES.map((lang) => {
                    const isSelected = forcedLanguage === lang;

                    return (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => !disabled && onChange(lang)}
                            disabled={disabled}
                            className={`
                                ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}
                                font-bold rounded-lg transition-all duration-200
                                ${isSelected
                                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 shadow-lg scale-105'
                                    : 'bg-indigo-900/30 hover:bg-indigo-800/40 text-gray-300 hover:text-white'
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                flex items-center gap-1
                            `}
                            aria-pressed={isSelected}
                            aria-label={LANGUAGE_NAMES[lang]}
                        >
                            <span>{LANGUAGE_FLAGS[lang]}</span>
                            {!compact && <span>{LANGUAGE_NAMES[lang]}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Current effective language hint (only shown when not compact) */}
            {!compact && !disabled && (
                <p className="text-center text-xs text-gray-500 mt-2">
                    {t('language.hint', { lang: LANGUAGE_NAMES[effectiveLanguage] })}
                </p>
            )}
        </div>
    );
}
