import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import type { Phase2Answer, SwipeDirection } from './Phase2Card';

interface Phase2ZonesProps {
    optionA: string;
    optionB: string;
    optionADescription?: string;
    optionBDescription?: string;
    onZoneClick?: (answer: Phase2Answer, direction: SwipeDirection) => void;
    disabled?: boolean;
}

export function Phase2Zones({
    optionA,
    optionB,
    optionADescription,
    optionBDescription,
    onZoneClick,
    disabled = false
}: Phase2ZonesProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();

    // Check if both options are spelled identically (true homonyms)
    const areIdentical = optionA.toLowerCase() === optionB.toLowerCase();

    // Format option B display (lowercase articles)
    const lowercaseStarters = ['le ', 'la ', 'les ', 'un ', 'une ', 'l\'', 'du ', 'des ', 'au ', 'aux '];
    const startsWithArticle = lowercaseStarters.some(art => optionB.toLowerCase().startsWith(art));
    const optionBDisplay = startsWithArticle
        ? optionB.charAt(0).toLowerCase() + optionB.slice(1)
        : optionB;

    const handleZoneClick = (answer: Phase2Answer, direction: SwipeDirection) => {
        if (!disabled && onZoneClick) {
            onZoneClick(answer, direction);
        }
    };

    return (
        <>
            {/* LEFT ZONE (Option A) */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-600/20 border-r border-white/10 flex items-center justify-start pl-8 group"
                role="button"
                aria-label={t('phase2.selectOption', { option: optionA })}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleZoneClick('A', 'left')}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleZoneClick('A', 'left');
                    }
                }}
            >
                <div
                    className="absolute inset-0 bg-red-900/10 group-hover:bg-red-900/20 transition-colors"
                    aria-hidden="true"
                />
                <div
                    className="text-4xl md:text-6xl font-black text-red-500 opacity-30 select-none uppercase tracking-tighter transform -rotate-90 md:rotate-0 origin-left"
                    aria-hidden="true"
                >
                    {optionA}
                </div>

                {/* Mobile Arrow Hint */}
                {!prefersReducedMotion && (
                    <motion.div
                        className="absolute left-4 top-1/2 text-red-500 opacity-50 md:hidden"
                        animate={{ x: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden="true"
                    >
                        <ArrowLeft className="w-10 h-10" />
                    </motion.div>
                )}
            </motion.div>

            {/* RIGHT ZONE (Option B) */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-pink-600/20 flex items-center justify-end pr-8 group"
                role="button"
                aria-label={t('phase2.selectOption', { option: optionB })}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleZoneClick('B', 'right')}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleZoneClick('B', 'right');
                    }
                }}
            >
                <div
                    className="absolute inset-0 bg-pink-900/10 group-hover:bg-pink-900/20 transition-colors"
                    aria-hidden="true"
                />
                <div
                    className="text-4xl md:text-6xl font-black text-pink-500 opacity-30 select-none uppercase tracking-tighter transform rotate-90 md:rotate-0 origin-right"
                    aria-hidden="true"
                >
                    {optionB}
                </div>

                {/* Mobile Arrow Hint */}
                {!prefersReducedMotion && (
                    <motion.div
                        className="absolute right-4 top-1/2 text-pink-500 opacity-50 md:hidden"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        aria-hidden="true"
                    >
                        <ArrowRight className="w-10 h-10" />
                    </motion.div>
                )}
            </motion.div>

            {/* UP ZONE HINT (Both) */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none flex justify-center pt-8"
                role="button"
                aria-label={t('phase2.selectBoth')}
                tabIndex={disabled ? -1 : 0}
                onClick={() => handleZoneClick('Both', 'up')}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleZoneClick('Both', 'up');
                    }
                }}
                style={{ pointerEvents: disabled ? 'none' : 'auto' }}
            >
                <div className="text-purple-400 font-bold tracking-widest uppercase opacity-20 text-xl flex flex-col items-center">
                    {!prefersReducedMotion ? (
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ArrowUp className="w-8 h-8 mb-1" />
                        </motion.div>
                    ) : (
                        <ArrowUp className="w-8 h-8 mb-1" />
                    )}
                    {t('phase2.optionBoth')}
                </div>
            </motion.div>

            {/* Options Text Legend - Above the card area */}
            {!disabled && (
                <div className="absolute top-24 md:top-20 left-0 right-0 text-center pointer-events-none z-30">
                    <p className="text-white/80 text-lg md:text-xl font-medium">
                        <span className="text-red-400">
                            {optionA}
                            {areIdentical && optionADescription && (
                                <span className="text-red-300/70 text-sm"> ({optionADescription})</span>
                            )}
                        </span>
                        <span className="text-white/50">, </span>
                        <span className="text-pink-400">
                            {optionBDisplay}
                            {areIdentical && optionBDescription && (
                                <span className="text-pink-300/70 text-sm"> ({optionBDescription})</span>
                            )}
                        </span>
                        <span className="text-white/50">, {t('phase2.optionOr')} </span>
                        <span className="text-purple-400">{t('phase2.optionBoth').toLowerCase()}</span>
                        <span className="text-white/50"> ?</span>
                    </p>

                    {/* Hint explaining the wordplay */}
                    <p className="text-white/40 text-xs md:text-sm mt-2 max-w-md mx-auto px-4">
                        🎭 {t('phase2.homophoneHint')}
                        <br className="hidden md:block" />
                        <span className="hidden md:inline">{t('phase2.swipeHint')}</span>
                    </p>
                </div>
            )}
        </>
    );
}
