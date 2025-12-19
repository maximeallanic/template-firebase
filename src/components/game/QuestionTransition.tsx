import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { organicEase, durations, springConfig, snappySpring, bouncySpring } from '../../animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Zap } from 'lucide-react';

interface QuestionTransitionProps {
    questionNumber: number;
    totalQuestions: number;
    isVisible: boolean;
    onComplete: () => void;
}

// Pre-computed particle data interface
interface ParticleData {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
}

// Floating particle for visual interest (receives pre-computed position)
const FloatingParticle: React.FC<{ particle: ParticleData; delay: number; reducedMotion: boolean }> = ({
    particle,
    delay,
    reducedMotion
}) => {
    if (reducedMotion) return null;

    return (
        <motion.div
            className={`absolute rounded-full ${particle.color}`}
            style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.2, 0.8],
            }}
            transition={{
                duration: durations.slow,
                delay,
                ease: organicEase,
            }}
        />
    );
};

// Ripple effect emanating from center
const Ripple: React.FC<{ delay: number; reducedMotion: boolean }> = ({ delay, reducedMotion }) => {
    if (reducedMotion) return null;

    return (
        <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: durations.medium, delay, ease: organicEase }}
        >
            <motion.div
                className="w-32 h-32 rounded-full border-2 border-amber-400/50"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: durations.slow, delay, ease: organicEase }}
            />
        </motion.div>
    );
};

// Transition duration constant
const TRANSITION_DURATION = 800; // ms - reduced from 1200ms for snappier feel

export const QuestionTransition: React.FC<QuestionTransitionProps> = ({
    questionNumber,
    totalQuestions,
    isVisible,
    onComplete,
}) => {
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const prefersReducedMotion = useReducedMotion();

    // Memoize particles to avoid recalculating random positions on each render
    // We intentionally depend on questionNumber to get fresh random positions per question
    const particles = useMemo<ParticleData[]>(() =>
        Array.from({ length: 12 }).map((_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 20 + Math.random() * 60,
            size: 4 + Math.random() * 6,
            color: i % 3 === 0 ? 'bg-amber-400' : i % 3 === 1 ? 'bg-orange-400' : 'bg-yellow-400'
        }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [questionNumber]); // Recalculate only when question changes

    useEffect(() => {
        if (isVisible) {
            // Auto-complete after animation (faster if reduced motion)
            const duration = prefersReducedMotion ? 300 : TRANSITION_DURATION;
            const timer = setTimeout(() => {
                onCompleteRef.current();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, prefersReducedMotion]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: durations.fast }}
                >
                    {/* Semi-transparent backdrop with blur */}
                    <motion.div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: durations.quick, ease: organicEase }}
                    />

                    {/* Ripple effects */}
                    <Ripple delay={0} reducedMotion={prefersReducedMotion} />
                    <Ripple delay={0.15} reducedMotion={prefersReducedMotion} />

                    {/* Floating particles (memoized) */}
                    <div className="absolute inset-0 overflow-hidden">
                        {particles.map((particle) => (
                            <FloatingParticle
                                key={particle.id}
                                particle={particle}
                                delay={particle.id * 0.04}
                                reducedMotion={prefersReducedMotion}
                            />
                        ))}
                    </div>

                    {/* Main content */}
                    <motion.div
                        className="relative flex flex-col items-center gap-3"
                        initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0, y: 20 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: -10 }}
                        transition={prefersReducedMotion ? { duration: 0.15 } : snappySpring}
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 blur-3xl bg-amber-500/30 rounded-full scale-150" />

                        {/* Icon with bounce */}
                        <motion.div
                            className="relative"
                            initial={prefersReducedMotion ? { opacity: 0 } : { rotate: -20, scale: 0 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { rotate: 0, scale: 1 }}
                            transition={prefersReducedMotion
                                ? { duration: 0.15 }
                                : { ...bouncySpring, delay: 0.1 }
                            }
                        >
                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg shadow-amber-500/30">
                                <Zap className="w-8 h-8 text-white" fill="currentColor" />
                            </div>
                        </motion.div>

                        {/* Question number */}
                        <motion.div
                            className="relative flex flex-col items-center"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15, duration: durations.normal, ease: organicEase }}
                        >
                            <span className="text-amber-400/80 text-sm font-bold uppercase tracking-[0.3em]">
                                Question
                            </span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <motion.span
                                    className="text-6xl md:text-7xl font-black text-white"
                                    initial={prefersReducedMotion ? { opacity: 0 } : { scale: 1.5, opacity: 0 }}
                                    animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                                    transition={prefersReducedMotion
                                        ? { duration: 0.15 }
                                        : { ...springConfig, delay: 0.2 }
                                    }
                                >
                                    {questionNumber}
                                </motion.span>
                                <span className="text-2xl text-white/50 font-medium">
                                    /{totalQuestions}
                                </span>
                            </div>
                        </motion.div>

                        {/* Progress bar */}
                        <motion.div
                            className="relative w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ delay: durations.quick, duration: durations.normal, ease: organicEase }}
                        >
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                                initial={{ width: `${((questionNumber - 1) / totalQuestions) * 100}%` }}
                                animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                                transition={{ delay: durations.normal, duration: durations.medium, ease: organicEase }}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Decorative corner accents */}
                    <motion.div
                        className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-amber-500/30 rounded-tl-lg"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: durations.normal, ease: organicEase }}
                    />
                    <motion.div
                        className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-amber-500/30 rounded-tr-lg"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, duration: durations.normal, ease: organicEase }}
                    />
                    <motion.div
                        className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-amber-500/30 rounded-bl-lg"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: durations.normal, ease: organicEase }}
                    />
                    <motion.div
                        className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-amber-500/30 rounded-br-lg"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35, duration: durations.normal, ease: organicEase }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuestionTransition;
