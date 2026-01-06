import { useTranslation } from 'react-i18next';
import { type Difficulty, DIFFICULTY_LIST } from '../../types/gameTypes';

interface DifficultySelectorProps {
    value: Difficulty;
    onChange: (difficulty: Difficulty) => void;
    disabled?: boolean;
    /** Show as compact version (for small spaces) */
    compact?: boolean;
}

/** Color and style config for each difficulty level */
const DIFFICULTY_STYLES: Record<Difficulty, { bg: string; bgSelected: string; ring: string; emoji: string }> = {
    easy: {
        bg: 'bg-emerald-900/30 hover:bg-emerald-800/40',
        bgSelected: 'bg-emerald-600',
        ring: 'ring-emerald-500',
        emoji: '🌱'
    },
    normal: {
        bg: 'bg-blue-900/30 hover:bg-blue-800/40',
        bgSelected: 'bg-blue-600',
        ring: 'ring-blue-500',
        emoji: '⚡'
    },
    hard: {
        bg: 'bg-orange-900/30 hover:bg-orange-800/40',
        bgSelected: 'bg-orange-600',
        ring: 'ring-orange-500',
        emoji: '🔥'
    },
    wtf: {
        bg: 'bg-purple-900/30 hover:bg-purple-800/40',
        bgSelected: 'bg-gradient-to-r from-purple-600 to-pink-600',
        ring: 'ring-purple-500',
        emoji: '🤯'
    }
};

export function DifficultySelector({ value, onChange, disabled = false, compact = false }: DifficultySelectorProps) {
    const { t } = useTranslation('game-ui');

    return (
        <div className="w-full">
            {!compact && (
                <label className="block text-gray-400 text-sm font-medium mb-2 text-center">
                    {t('difficulty.label')}
                </label>
            )}
            <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-1.5 sm:gap-2'} justify-center`}>
                {DIFFICULTY_LIST.map((level) => {
                    const isSelected = value === level;
                    const styles = DIFFICULTY_STYLES[level];

                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => !disabled && onChange(level)}
                            disabled={disabled}
                            className={`
                                ${compact ? 'px-2 py-1 text-xs' : 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm'}
                                font-bold rounded-lg transition-all duration-200
                                ${isSelected
                                    ? `${styles.bgSelected} text-white ring-2 ${styles.ring} shadow-lg scale-105`
                                    : `${styles.bg} text-gray-300 hover:text-white`
                                }
                                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                flex items-center gap-1
                            `}
                            aria-pressed={isSelected}
                            aria-label={t(`difficulty.${level}`)}
                        >
                            <span className="hidden sm:inline">{styles.emoji}</span>
                            <span>{t(`difficulty.${level}`)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
