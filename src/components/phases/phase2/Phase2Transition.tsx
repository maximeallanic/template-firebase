import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shuffle } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { phase2StackedCardVariants } from '../../../animations/phaseTransitions';
import { bouncySpring, durations } from '../../../animations';

interface Phase2TransitionProps {
    itemNumber: number;
    totalItems: number;
    setName: string;
    onComplete: () => void;
}

export function Phase2Transition({
    itemNumber,
    totalItems,
    setName,
    onComplete
}: Phase2TransitionProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const [showCards, setShowCards] = useState(false);

    // Animation sequence
    useEffect(() => {
        // Play sound at start
        audioService.playClick();

        // Show stacked cards
        const cardTimer = setTimeout(() => {
            setShowCards(true);
        }, 200);

        // Complete transition
        const completeTimer = setTimeout(() => {
            onComplete();
        }, prefersReducedMotion ? 800 : 1500);

        return () => {
            clearTimeout(cardTimer);
            clearTimeout(completeTimer);
        };
    }, [onComplete, prefersReducedMotion]);

    const progress = itemNumber / totalItems;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.fast }}
            className="fixed inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800"
        >
            <div className="flex flex-col items-center space-y-8">
                {/* Stacked Cards Animation */}
                <div className="relative w-32 h-40">
                    <AnimatePresence>
                        {showCards && !prefersReducedMotion && (
                            <>
                                {/* Three stacked cards */}
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={phase2StackedCardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="absolute inset-0 bg-white rounded-2xl shadow-lg border-2 border-slate-200"
                                        style={{
                                            zIndex: 3 - i,
                                            transformOrigin: 'center center'
                                        }}
                                    >
                                        {/* Card decoration */}
                                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-purple-400 to-pink-400 rounded-t-2xl" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Shuffle className="w-8 h-8 text-slate-300" />
                                        </div>
                                    </motion.div>
                                ))}
                            </>
                        )}

                        {/* Reduced motion: single card */}
                        {showCards && prefersReducedMotion && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-white rounded-2xl shadow-lg border-2 border-slate-200"
                            >
                                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-purple-400 to-pink-400 rounded-t-2xl" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Shuffle className="w-8 h-8 text-slate-300" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Set Name & Item Number */}
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ...bouncySpring }}
                    className="text-center"
                >
                    <div className="text-slate-400 text-sm uppercase tracking-wider mb-2">
                        {setName}
                    </div>
                    <div className="text-white text-3xl font-black">
                        {t('phase2.elementNumber', {
                            current: itemNumber,
                            total: totalItems
                        })}
                    </div>
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: '100%' }}
                    transition={{ delay: 0.5, duration: durations.normal }}
                    className="w-64"
                >
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: progress }}
                            transition={{ duration: durations.normal }}
                            className="h-full bg-gradient-to-r from-red-400 via-purple-400 to-pink-400 origin-left"
                        />
                    </div>
                    <div className="text-center text-slate-500 text-xs mt-2">
                        {Math.round(progress * 100)}% {t('phase2.completed')}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
