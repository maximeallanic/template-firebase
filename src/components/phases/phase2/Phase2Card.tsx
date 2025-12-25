import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, ArrowUp, Check, X, AlertCircle } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { phase2CardVariants } from '../../../animations/phaseTransitions';
import { organicEase, durations, bouncySpring } from '../../../animations';
import type { Team, Phase2TeamAnswer } from '../../../types/gameTypes';

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
    // New props for adjacent message
    optionA?: string;
    optionB?: string;
    roundWinner?: Team | 'both' | null;
    myTeamAnswer?: Phase2TeamAnswer;
    isSolo?: boolean;
    bothTeamsCorrect?: boolean;
}

export function Phase2Card({
    item,
    hasAnswered,
    isRoundOver,
    didWin,
    onAnswer,
    optionA,
    optionB,
    roundWinner,
    myTeamAnswer,
    isSolo = false,
    bothTeamsCorrect = false
}: Phase2CardProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const controls = useAnimation();
    const hasPlayedAudioRef = useRef(false);

    // Determine result type
    // Use != null to check for both null and undefined
    // 'both' means both teams won - treat as a win for everyone
    const hasWinner = roundWinner != null;
    const noWinner = !hasWinner && !bothTeamsCorrect;
    const otherTeamWon = !didWin && hasWinner && roundWinner !== 'both' && !bothTeamsCorrect;

    // Reset card position and animate to visible when item changes
    useEffect(() => {
        // First reset position, then animate to visible state
        controls.set({ x: 0, y: 0 });
        if (!prefersReducedMotion) {
            controls.start({
                opacity: 1,
                scale: 1,
                rotateZ: 0,
                y: 0,
            });
        } else {
            controls.set({ opacity: 1, scale: 1, rotateZ: 0, y: 0 });
        }
        hasPlayedAudioRef.current = false;
    }, [item.text, controls, prefersReducedMotion]);

    // Play audio feedback when result is shown
    useEffect(() => {
        if (!isRoundOver || !hasAnswered || hasPlayedAudioRef.current) return;
        hasPlayedAudioRef.current = true;

        if (didWin) {
            audioService.playSuccess();
            audioService.playWinRound();
        } else if (otherTeamWon) {
            audioService.playError();
        }
    }, [isRoundOver, hasAnswered, didWin, otherTeamWon]);

    // Card stays at swipe position - no animation to "correct" position

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
        // Both teams correct = green ring (positive)
        if (bothTeamsCorrect) return 'ring-4 ring-purple-500 shadow-purple-500/30';
        return didWin
            ? 'ring-4 ring-green-500 shadow-green-500/30'
            : 'ring-4 ring-red-500 shadow-red-500/30';
    };

    // Get top bar gradient based on result
    const getTopBarGradient = () => {
        if (isRoundOver && (didWin || bothTeamsCorrect)) {
            return 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-400';
        }
        if (isRoundOver && hasAnswered && !didWin && !bothTeamsCorrect) {
            return 'bg-gradient-to-r from-red-400 via-rose-400 to-red-400';
        }
        return 'bg-gradient-to-r from-red-400 via-purple-400 to-pink-400';
    };

    // Get message position - fixed to bottom-center of screen via Portal
    // Uses flexbox centering (inset-x-0 + justify-center) instead of transform
    // to avoid positioning issues on mobile browsers
    const getMessagePosition = () => {
        return 'bottom-24 inset-x-0 flex justify-center';
    };

    // Get result style based on outcome
    const getResultStyle = () => {
        if (bothTeamsCorrect) {
            // Both teams win - purple/gradient to celebrate both
            return 'bg-gradient-to-br from-purple-500 to-pink-600 border-white text-white';
        }
        if (didWin) {
            return 'bg-gradient-to-br from-green-500 to-emerald-600 border-white text-white';
        }
        if (otherTeamWon) {
            return 'bg-white border-red-500 text-red-500';
        }
        // No winner
        return 'bg-white border-amber-500 text-amber-600';
    };

    // Get result message
    const getResultMessage = () => {
        if (isSolo) {
            if (didWin) {
                return t('phase2.solo.correct', { defaultValue: 'Correct !' });
            }
            return t('phase2.solo.incorrect', { defaultValue: 'Raté !' });
        }
        // Both teams correct - both win!
        if (bothTeamsCorrect) {
            return t('phase2.bothTeamsWon', { defaultValue: 'Les deux équipes gagnent !' });
        }
        if (didWin) {
            return t('phase2.yourTeamWon', { defaultValue: 'Votre équipe gagne !' });
        }
        if (otherTeamWon) {
            return t('phase2.yourTeamLost', { defaultValue: "L'équipe adverse a gagné" });
        }
        return t('phase2.nobodyWon', { defaultValue: "Aucune équipe n'a trouvé !" });
    };

    // Get result icon
    const getResultIcon = () => {
        if (bothTeamsCorrect) return <Check className="w-8 h-8" />; // Both win = positive icon
        if (didWin) return <Check className="w-8 h-8" />;
        if (otherTeamWon) return <X className="w-8 h-8" />;
        return <AlertCircle className="w-8 h-8" />;
    };

    // Get answer display text
    const getAnswerText = (answer: Phase2Answer) => {
        switch (answer) {
            case 'A': return optionA || 'A';
            case 'B': return optionB || 'B';
            case 'Both': return t('phase2.optionBoth');
        }
    };

    // Get team display name
    const getTeamName = (team: Team | null | undefined) => {
        if (!team) return '';
        return team === 'spicy' ? '🌶️ Spicy' : '🍬 Sweet';
    };

    return (
        <motion.div
            variants={prefersReducedMotion ? undefined : phase2CardVariants}
            initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
            animate={controls}
            drag={!hasAnswered && !isRoundOver}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={hasAnswered || isRoundOver ? undefined : handleDragEnd}
            className="relative"
        >
            {/* The Card */}
            <div
                className={`
                    bg-white text-slate-900 w-full max-w-[260px] md:max-w-sm aspect-square rounded-3xl shadow-2xl
                    max-h-[40vh] md:max-h-[50vh]
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
                <h1 className="text-3xl md:text-4xl font-black leading-tight text-slate-800 select-none">
                    {item.text}
                </h1>

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
            </div>

            {/* Adjacent Result Message - rendered via Portal to avoid transform issues */}
            {isRoundOver && hasAnswered && createPortal(
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, ...bouncySpring }}
                    role="alert"
                    aria-live="assertive"
                    className={`fixed ${getMessagePosition()} pointer-events-none z-50`}
                >
                    <div className={`w-72 max-w-[90vw] md:w-48 md:max-w-[200px] p-4 rounded-xl shadow-xl border-2 ${getResultStyle()}`}>
                        {/* Result Icon */}
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                            transition={{ delay: 0.5, ...bouncySpring }}
                            className="flex justify-center mb-2"
                            aria-hidden="true"
                        >
                            {getResultIcon()}
                        </motion.div>

                        {/* Result Text */}
                        <div className="text-sm font-black tracking-wide uppercase text-center">
                            {getResultMessage()}
                        </div>

                        {/* Winner team badge (hidden in solo mode or when both teams win) */}
                        {!isSolo && roundWinner && roundWinner !== 'both' && (
                            <div className="text-xs mt-1 text-center opacity-80">
                                {getTeamName(roundWinner)}
                            </div>
                        )}

                        {/* Who answered for my team (hidden in solo mode) */}
                        {!isSolo && myTeamAnswer && (
                            <div className={`text-xs mt-1 text-center ${didWin ? 'text-white/70' : 'text-current opacity-60'}`}>
                                {myTeamAnswer.playerName}
                            </div>
                        )}

                        {/* Correct answer (show if team lost or no winner) */}
                        {!didWin && (
                            <div className={`text-xs mt-2 select-none ${noWinner ? 'text-amber-700' : 'text-red-400'}`}>
                                {t('phase2.itWas')}{' '}
                                <span className={`font-bold ${noWinner ? 'text-amber-800' : 'text-red-600'}`}>
                                    {getAnswerText(item.answer)}
                                </span>
                            </div>
                        )}

                        {/* Justification */}
                        {item.justification && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: durations.normal }}
                                className={`text-xs mt-2 pt-2 border-t italic select-none ${
                                    didWin
                                        ? 'border-white/20 text-white/90'
                                        : noWinner
                                        ? 'border-amber-200 text-amber-700'
                                        : 'border-red-200 text-red-600'
                                }`}
                            >
                                {item.justification}
                            </motion.p>
                        )}

                        {/* Anecdote */}
                        {item.anecdote && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9, duration: durations.normal }}
                                className={`text-sm md:text-xs mt-2 italic select-none ${
                                    didWin ? 'text-white/70' : 'opacity-60'
                                }`}
                            >
                                💡 {item.anecdote}
                            </motion.p>
                        )}
                    </div>
                </motion.div>,
                document.body
            )}
        </motion.div>
    );
}
