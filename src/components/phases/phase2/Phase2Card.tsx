import { useEffect, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUp, Check, X } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { phase2CardVariants } from '../../../animations/phaseTransitions';
import { organicEase, durations } from '../../../animations';

export type Phase2Answer = 'A' | 'B' | 'Both';
export type SwipeDirection = 'left' | 'right' | 'up';

interface Phase2Item {
    text: string;
    answer: Phase2Answer;
    justification?: string;
    anecdote?: string;
    acceptedAnswers?: Phase2Answer[];
}

interface Phase2CardProps {
    item: Phase2Item;
    hasAnswered: boolean;
    isRoundOver: boolean;
    didWin: boolean;
    onAnswer: (answer: Phase2Answer, direction: SwipeDirection) => void;
}

export function Phase2Card({
    item,
    hasAnswered,
    isRoundOver,
    didWin,
    onAnswer
}: Phase2CardProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const controls = useAnimation();

    // Reset card position when item changes
    useEffect(() => {
        controls.set({ x: 0, y: 0, opacity: 1 });
    }, [item.text, controls]);

    // Animate card to correct position when result is shown
    useEffect(() => {
        if (isRoundOver && hasAnswered && !prefersReducedMotion) {
            const correctX = item.answer === 'A' ? -150 : item.answer === 'B' ? 150 : 0;
            const correctY = item.answer === 'Both' ? -80 : 0;

            controls.start({
                x: correctX,
                y: correctY,
                opacity: 1,
                transition: {
                    duration: 0.6,
                    ease: organicEase,
                    delay: 0.2
                }
            });
        }
    }, [isRoundOver, hasAnswered, item.answer, controls, prefersReducedMotion]);

    // Handle answer submission
    const handleAnswer = useCallback((choice: Phase2Answer, direction: SwipeDirection) => {
        if (hasAnswered || isRoundOver) return;

        // Play click sound
        audioService.playClick();

        // Animate card to initial swipe position
        let swipeX = 0;
        let swipeY = 0;
        if (direction === 'left') swipeX = -120;
        if (direction === 'right') swipeX = 120;
        if (direction === 'up') swipeY = -80;

        if (!prefersReducedMotion) {
            controls.start({
                x: swipeX,
                y: swipeY,
                transition: { duration: durations.quick, ease: organicEase }
            });
        }

        onAnswer(choice, direction);
    }, [hasAnswered, isRoundOver, onAnswer, controls, prefersReducedMotion]);

    // Keyboard listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (hasAnswered || isRoundOver) return;

            if (['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === 'ArrowLeft') handleAnswer('A', 'left');
            if (e.key === 'ArrowRight') handleAnswer('B', 'right');
            if (e.key === 'ArrowUp') handleAnswer('Both', 'up');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAnswer, hasAnswered, isRoundOver]);

    // Drag end handler
    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (hasAnswered || isRoundOver) return;

        const threshold = 100;
        const { x, y } = info.offset;

        // Prioritize vertical swipe for "Both"
        if (y < -threshold) {
            handleAnswer('Both', 'up');
        } else if (x < -threshold) {
            handleAnswer('A', 'left');
        } else if (x > threshold) {
            handleAnswer('B', 'right');
        } else {
            // Snap back
            controls.start({ x: 0, y: 0 });
        }
    }, [hasAnswered, isRoundOver, handleAnswer, controls]);

    // Get ring color based on result
    const getRingClass = () => {
        if (!isRoundOver || !hasAnswered) return '';
        return didWin
            ? 'ring-4 ring-green-500 shadow-green-500/30'
            : 'ring-4 ring-red-500 shadow-red-500/30';
    };

    // Get top bar gradient based on result
    const getTopBarGradient = () => {
        if (isRoundOver && didWin) {
            return 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-400';
        }
        if (isRoundOver && hasAnswered && !didWin) {
            return 'bg-gradient-to-r from-red-400 via-rose-400 to-red-400';
        }
        return 'bg-gradient-to-r from-red-400 via-purple-400 to-pink-400';
    };

    return (
        <motion.div
            variants={prefersReducedMotion ? undefined : phase2CardVariants}
            initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
            animate={prefersReducedMotion ? { opacity: 1 } : "visible"}
            drag={!hasAnswered && !isRoundOver}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={hasAnswered || isRoundOver ? undefined : handleDragEnd}
            style={prefersReducedMotion ? undefined : { x: 0, y: 0 }}
            className={`
                bg-white text-slate-900 w-full max-w-xs aspect-square rounded-3xl shadow-2xl
                flex flex-col items-center justify-center p-6 text-center relative overflow-hidden
                transition-shadow duration-300
                ${!hasAnswered && !isRoundOver ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'}
                ${getRingClass()}
            `}
            role="button"
            aria-label={t('phase2.swipeCard', { item: item.text })}
            tabIndex={hasAnswered ? -1 : 0}
        >
            {/* Top decorative bar */}
            <div
                className={`absolute top-0 left-0 right-0 h-2 transition-colors duration-300 ${getTopBarGradient()}`}
                aria-hidden="true"
            />

            {/* Answer label badge (shows only during result phase) */}
            {isRoundOver && hasAnswered && (
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ delay: durations.quick, duration: durations.quick, ease: organicEase }}
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white ${
                        item.answer === 'A' ? 'bg-red-500' :
                        item.answer === 'B' ? 'bg-pink-500' :
                        'bg-purple-500'
                    }`}
                    aria-hidden="true"
                />
            )}

            {/* Item text */}
            <h1 className="text-3xl md:text-4xl font-black leading-tight text-slate-800">
                {item.text}
            </h1>

            {/* Justification (shows during result) */}
            {isRoundOver && item.justification && (
                <motion.p
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1 }}
                    transition={{ delay: durations.medium, duration: durations.quick, ease: organicEase }}
                    className="text-xs text-slate-600 mt-3 px-2 italic leading-snug"
                >
                    {item.justification}
                </motion.p>
            )}

            {/* Swipe hint at bottom (only when not answered) */}
            {!hasAnswered && !isRoundOver && (
                <div
                    className="text-xs text-slate-400 mt-6 flex items-center gap-2"
                    aria-hidden="true"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <ArrowUp className="w-4 h-4" />
                    <ArrowRight className="w-4 h-4" />
                </div>
            )}

            {/* Result icon overlay */}
            {isRoundOver && hasAnswered && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    aria-hidden="true"
                    className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center ${
                        didWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}
                >
                    {didWin ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                </motion.div>
            )}
        </motion.div>
    );
}
