import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { Phase2Answer, SwipeDirection } from './Phase2Card';

interface Phase2KeyboardControlsProps {
    optionA: string;
    optionB: string;
    onAnswer: (answer: Phase2Answer, direction: SwipeDirection) => void;
    disabled?: boolean;
}

/**
 * Accessible keyboard alternative controls for Phase 2 swipe cards.
 * Provides visible buttons for users who prefer clicking over swiping.
 *
 * Keyboard shortcuts (also handled in Phase2Card):
 * - Left arrow (or click left button) = Option A
 * - Right arrow (or click right button) = Option B
 * - Up arrow (or click center button) = Both
 */
export function Phase2KeyboardControls({
    optionA,
    optionB,
    onAnswer,
    disabled = false
}: Phase2KeyboardControlsProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();

    const handleClick = (answer: Phase2Answer, direction: SwipeDirection) => {
        if (!disabled) {
            onAnswer(answer, direction);
        }
    };

    const buttonBaseClass = `
        flex flex-col items-center justify-center gap-1
        px-4 py-3 rounded-xl font-bold text-sm
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-40 disabled:cursor-not-allowed
        pointer-events-auto
    `;

    return (
        <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 z-30 pointer-events-none"
            role="group"
            aria-label={t('phase2.keyboardControls', { defaultValue: 'Answer controls' })}
        >
            {/* Option A (Left) */}
            <button
                type="button"
                onClick={() => handleClick('A', 'left')}
                disabled={disabled}
                className={`${buttonBaseClass} bg-red-600/80 hover:bg-red-500 text-white focus:ring-red-400 min-w-[80px]`}
                aria-label={t('phase2.selectOptionKeyboard', { option: optionA, key: '(←)', defaultValue: `${optionA} (←)` })}
            >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span className="truncate max-w-[70px]">{optionA}</span>
                <span className="text-xs opacity-70 hidden md:inline">←</span>
            </button>

            {/* Both (Up/Center) */}
            <button
                type="button"
                onClick={() => handleClick('Both', 'up')}
                disabled={disabled}
                className={`${buttonBaseClass} bg-purple-600/80 hover:bg-purple-500 text-white focus:ring-purple-400 min-w-[80px]`}
                aria-label={t('phase2.selectBothKeyboard', { key: '(↑)', defaultValue: `${t('phase2.optionBoth')} (↑)` })}
            >
                <ArrowUp className="w-5 h-5" aria-hidden="true" />
                <span>{t('phase2.optionBoth')}</span>
                <span className="text-xs opacity-70 hidden md:inline">↑</span>
            </button>

            {/* Option B (Right) */}
            <button
                type="button"
                onClick={() => handleClick('B', 'right')}
                disabled={disabled}
                className={`${buttonBaseClass} bg-pink-600/80 hover:bg-pink-500 text-white focus:ring-pink-400 min-w-[80px]`}
                aria-label={t('phase2.selectOptionKeyboard', { option: optionB, key: '(→)', defaultValue: `${optionB} (→)` })}
            >
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
                <span className="truncate max-w-[70px]">{optionB}</span>
                <span className="text-xs opacity-70 hidden md:inline">→</span>
            </button>
        </motion.div>
    );
}
