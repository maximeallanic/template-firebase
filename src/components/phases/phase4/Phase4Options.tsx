import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import {
    optionsContainerVariants,
    optionItemVariants,
    optionsContainerReducedVariants,
    optionItemReducedVariants
} from '../../../animations/phaseTransitions';

interface Phase4OptionsProps {
    options: string[];
    selectedAnswer: number | undefined;
    onSelectAnswer: (index: number) => void;
    disabled: boolean;
}

export function Phase4Options({
    options,
    selectedAnswer,
    onSelectAnswer,
    disabled
}: Phase4OptionsProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();

    const handleClick = useCallback((index: number) => {
        if (disabled) return;
        audioService.playClick();
        onSelectAnswer(index);
    }, [disabled, onSelectAnswer]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(index);
        }
    }, [handleClick]);

    // Select appropriate variants based on motion preference
    const containerVariants = prefersReducedMotion
        ? optionsContainerReducedVariants
        : optionsContainerVariants;
    const itemVariants = prefersReducedMotion
        ? optionItemReducedVariants
        : optionItemVariants;

    return (
        <motion.div
            className="w-full max-w-lg space-y-3"
            role="radiogroup"
            aria-label={t('phase4.selectAnswer')}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {options.map((option, index) => {
                const letter = String.fromCharCode(65 + index); // A, B, C, D
                const isSelected = selectedAnswer === index;

                return (
                    <motion.button
                        key={index}
                        data-cursor-target={`phase4:answer:${index}`}
                        variants={itemVariants}
                        whileTap={!disabled && !prefersReducedMotion ? { scale: 0.98 } : undefined}
                        onClick={() => handleClick(index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        disabled={disabled}
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={t('phase4.answerOption', { letter, option })}
                        tabIndex={disabled ? -1 : 0}
                        className={`
                            w-full p-4 rounded-xl text-left font-semibold text-lg
                            flex items-center gap-4 transition-colors
                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
                            ${disabled
                                ? isSelected
                                    ? 'bg-blue-600 border-2 border-blue-400'
                                    : 'bg-slate-700/50 opacity-50 cursor-not-allowed'
                                : 'bg-slate-700 hover:bg-slate-600 border-2 border-transparent hover:border-blue-400 cursor-pointer'
                            }
                        `}
                    >
                        {/* Letter Badge */}
                        <span
                            className={`
                                w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl
                                flex-shrink-0 transition-colors
                                ${isSelected ? 'bg-blue-400 text-blue-900' : 'bg-slate-600 text-white'}
                            `}
                            aria-hidden="true"
                        >
                            {letter}
                        </span>

                        {/* Option Text */}
                        <span className="flex-1 text-white">{option}</span>

                        {/* Selected Indicator */}
                        {isSelected && (
                            <motion.span
                                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                                className="flex-shrink-0"
                            >
                                <Check className="w-6 h-6 text-blue-200" aria-hidden="true" />
                            </motion.span>
                        )}
                    </motion.button>
                );
            })}
        </motion.div>
    );
}
