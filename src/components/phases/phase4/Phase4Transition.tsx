import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { phase4BuzzerVariants, phase4RippleVariants } from '../../../animations/phaseTransitions';
import { bouncySpring, durations } from '../../../animations';

interface Phase4TransitionProps {
    questionNumber: number;
    totalQuestions: number;
    onComplete: () => void;
}

export function Phase4Transition({
    questionNumber,
    totalQuestions,
    onComplete
}: Phase4TransitionProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const [countdown, setCountdown] = useState(3);

    // Countdown effect
    useEffect(() => {
        if (countdown === 0) {
            onComplete();
            return;
        }

        // Play tick sound for each countdown number
        if (countdown <= 3 && countdown > 0) {
            audioService.playTimerTick();
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 800);

        return () => clearTimeout(timer);
    }, [countdown, onComplete]);

    const progress = questionNumber / totalQuestions;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.fast }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800"
        >
            <div className="flex flex-col items-center space-y-8">
                {/* Buzzer Icon with Ripple Effect */}
                <div className="relative">
                    {/* Ripple rings (only if motion allowed) */}
                    {!prefersReducedMotion && (
                        <>
                            <motion.div
                                variants={phase4RippleVariants}
                                initial="hidden"
                                animate="visible"
                                className="absolute inset-0 rounded-full bg-yellow-400/20"
                                style={{ width: 160, height: 160, marginLeft: -40, marginTop: -40 }}
                            />
                            <motion.div
                                variants={phase4RippleVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: 0.2 }}
                                className="absolute inset-0 rounded-full bg-orange-400/15"
                                style={{ width: 200, height: 200, marginLeft: -60, marginTop: -60 }}
                            />
                        </>
                    )}

                    {/* Main Buzzer Button */}
                    <motion.div
                        variants={prefersReducedMotion ? undefined : phase4BuzzerVariants}
                        initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
                        animate={prefersReducedMotion ? { opacity: 1 } : "visible"}
                        className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
                    >
                        <Zap className="w-10 h-10 text-slate-900" aria-hidden="true" />

                        {/* Pulsing ring */}
                        {!prefersReducedMotion && (
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-yellow-400/50"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0, 0.5]
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}
                    </motion.div>
                </div>

                {/* Question Number */}
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, ...bouncySpring }}
                    className="text-center"
                >
                    <div className="text-slate-400 text-sm uppercase tracking-wider mb-2">
                        {t('phase4.prepareForQuestion')}
                    </div>
                    <div className="text-white text-3xl font-black">
                        {t('phase4.questionNumber', {
                            current: questionNumber,
                            total: totalQuestions
                        })}
                    </div>
                </motion.div>

                {/* Countdown Number */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={countdown}
                        initial={prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 2, y: -20 }
                        }
                        animate={prefersReducedMotion
                            ? { opacity: 1 }
                            : { opacity: 1, scale: 1, y: 0 }
                        }
                        exit={prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.5, y: 20 }
                        }
                        transition={prefersReducedMotion
                            ? { duration: 0.1 }
                            : { duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }
                        }
                        className="text-7xl font-black text-yellow-400"
                        aria-live="assertive"
                        aria-atomic="true"
                    >
                        {countdown}
                    </motion.div>
                </AnimatePresence>

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
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 origin-left"
                        />
                    </div>
                    <div className="text-center text-slate-500 text-xs mt-2">
                        {Math.round(progress * 100)}% {t('phase4.completed')}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
