import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { durations, organicEase } from '../../../animations';
import type { Phase2Answer, SwipeDirection } from './Phase2Card';

// Animation variants for zone split effect
const zoneTransition = {
    duration: durations.normal,
    ease: organicEase,
};

const leftZoneVariants = {
    initial: { opacity: 0, x: '-50%' },
    animate: { opacity: 1, x: 0, transition: zoneTransition },
    exit: { opacity: 0, x: '-100%', transition: zoneTransition },
};

const rightZoneVariants = {
    initial: { opacity: 0, x: '50%' },
    animate: { opacity: 1, x: 0, transition: zoneTransition },
    exit: { opacity: 0, x: '100%', transition: zoneTransition },
};

const topZoneVariants = {
    initial: { opacity: 0, y: '-100%' },
    animate: { opacity: 1, y: 0, transition: { ...zoneTransition, delay: 0.1 } },
    exit: { opacity: 0, y: '-100%', transition: zoneTransition },
};

const legendVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { ...zoneTransition, delay: 0.2 } },
    exit: { opacity: 0, transition: { duration: durations.fast } },
};

interface Phase2ZonesProps {
    optionA: string;
    optionB: string;
    optionADescription?: string;
    optionBDescription?: string;
    humorousDescription?: string;
    onZoneClick?: (answer: Phase2Answer, direction: SwipeDirection) => void;
    disabled?: boolean;
    isSolo?: boolean;
}

export function Phase2Zones({
    optionA,
    optionB,
    optionADescription,
    optionBDescription,
    humorousDescription,
    onZoneClick,
    disabled = false,
    isSolo = false
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
                variants={prefersReducedMotion ? undefined : leftZoneVariants}
                initial={prefersReducedMotion ? { opacity: 0 } : "initial"}
                animate={prefersReducedMotion ? { opacity: 1 } : "animate"}
                exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-red-600/20 border-r border-white/10 flex items-center justify-start pl-8 group z-20"
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
                variants={prefersReducedMotion ? undefined : rightZoneVariants}
                initial={prefersReducedMotion ? { opacity: 0 } : "initial"}
                animate={prefersReducedMotion ? { opacity: 1 } : "animate"}
                exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-pink-600/20 flex items-center justify-end pr-8 group z-20"
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
                variants={prefersReducedMotion ? undefined : topZoneVariants}
                initial={prefersReducedMotion ? { opacity: 0 } : "initial"}
                animate={prefersReducedMotion ? { opacity: 1 } : "animate"}
                exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                className={`absolute left-0 right-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none flex justify-center group z-20 ${isSolo ? 'top-14 pt-0' : 'top-0 pt-4'}`}
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
                <div
                    className="absolute inset-0 bg-purple-900/10 group-hover:bg-purple-900/20 transition-colors"
                    aria-hidden="true"
                />
                <div className="text-purple-500 font-black tracking-tighter uppercase opacity-30 text-3xl md:text-5xl flex flex-col items-center z-10">
                    {!prefersReducedMotion ? (
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <ArrowUp className="w-10 h-10 md:w-12 md:h-12 mb-1" />
                        </motion.div>
                    ) : (
                        <ArrowUp className="w-10 h-10 md:w-12 md:h-12 mb-1" />
                    )}
                    {t('phase2.optionBoth')}
                </div>
            </motion.div>

            {/* Options Text Legend - Below the card */}
            {!disabled && (
                <motion.div
                    variants={legendVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute bottom-24 md:bottom-32 lg:bottom-36 left-0 right-0 text-center pointer-events-none z-30"
                >
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

                    {/* Humorous description of the options */}
                    {humorousDescription && (
                        <p className="text-white/60 text-sm md:text-base mt-3 italic max-w-lg mx-auto px-4">
                            "{humorousDescription}"
                        </p>
                    )}

                    {/* Hint explaining the wordplay */}
                    <p className="text-white/40 text-xs md:text-sm mt-2 max-w-md mx-auto px-4">
                        🎭 {t('phase2.homophoneHint')}
                        <br className="hidden md:block" />
                        <span className="hidden md:inline">{t('phase2.swipeHint')}</span>
                    </p>
                </motion.div>
            )}
        </>
    );
}
