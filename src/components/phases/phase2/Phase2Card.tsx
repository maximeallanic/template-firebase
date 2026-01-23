import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimation } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRandomTranslation } from '../../../hooks/useGameTranslation';
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
    optionADescription?: string;
    optionBDescription?: string;
    roundWinner?: Team | 'both' | null;
    myTeamAnswer?: Phase2TeamAnswer;
    isSolo?: boolean;
    bothTeamsCorrect?: boolean;
    /** Revealed correct answer from CF validation (#72) - used in multiplayer when correctAnswer is stripped */
    revealedAnswer?: Phase2Answer;
}

export function Phase2Card({
    item,
    hasAnswered,
    isRoundOver,
    didWin,
    onAnswer,
    optionA,
    optionB,
    optionADescription,
    optionBDescription,
    roundWinner,
    myTeamAnswer,
    isSolo = false,
    bothTeamsCorrect = false,
    revealedAnswer
}: Phase2CardProps) {
    // Use revealedAnswer from CF validation in multiplayer, fallback to item.answer for solo (#72)
    const correctAnswer = revealedAnswer ?? item.answer;
    const { t } = useTranslation(['game-ui']);
    const { tRandom } = useRandomTranslation();
    const prefersReducedMotion = useReducedMotion();
    const controls = useAnimation();
    const hasPlayedAudioRef = useRef(false);

    // Determine result type
    // Use != null to check for both null and undefined
    // 'both' means both teams won - treat as a win for everyone
    const hasWinner = roundWinner != null;
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
        if (!isRoundOver) return '';
        // No one answered = amber ring
        if (!hasAnswered) return 'ring-4 ring-amber-500 shadow-amber-500/30';
        // Both teams correct = purple ring (positive)
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
        // Timeout - no one answered
        if (isRoundOver && !hasAnswered) {
            return 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400';
        }
        return 'bg-gradient-to-r from-red-400 via-purple-400 to-pink-400';
    };

    // Get message position - fixed to bottom-center of screen via Portal
    // Uses flexbox centering (inset-x-0 + justify-center) instead of transform
    // to avoid positioning issues on mobile browsers
    const getMessagePosition = () => {
        return 'bottom-24 inset-x-0 flex justify-center';
    };

    // Get accent color based on outcome (for top bar and glow)
    const getAccentColor = () => {
        if (bothTeamsCorrect) return 'purple';
        if (didWin) return 'emerald';
        if (otherTeamWon) return 'red';
        return 'amber'; // No winner
    };

    // Get result message
    const getResultMessage = () => {
        if (isSolo) {
            if (didWin) {
                return tRandom('phase2.solo.correct');
            }
            return tRandom('phase2.solo.incorrect');
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

    // Check if both options are spelled identically (true homonyms)
    const areIdentical = optionA && optionB && optionA.toLowerCase() === optionB.toLowerCase();

    // Get answer display text with description for homophones
    const getAnswerText = (answer: Phase2Answer) => {
        switch (answer) {
            case 'A': {
                const text = optionA || 'A';
                if (areIdentical && optionADescription) {
                    return `${text} (${optionADescription})`;
                }
                return text;
            }
            case 'B': {
                const text = optionB || 'B';
                if (areIdentical && optionBDescription) {
                    return `${text} (${optionBDescription})`;
                }
                return text;
            }
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
                            correctAnswer === 'A' ? 'bg-red-500' :
                            correctAnswer === 'B' ? 'bg-pink-500' :
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
            {/* Show on timeout too (when no one answered) */}
            {isRoundOver && createPortal(
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, ...bouncySpring }}
                    role="alert"
                    aria-live="assertive"
                    className={`fixed ${getMessagePosition()} pointer-events-none z-50`}
                >
                    {/* TV Quiz Style Result Card */}
                    <div className="relative w-[340px] max-w-[90vw] md:w-96 overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-sm border border-white/10 shadow-2xl">
                        {/* Top accent bar */}
                        <div className={`
                            absolute top-0 left-0 right-0 h-1.5
                            ${getAccentColor() === 'emerald'
                                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
                                : getAccentColor() === 'purple'
                                    ? 'bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500'
                                    : getAccentColor() === 'red'
                                        ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-500'
                                        : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                            }
                        `} />

                        <div className="p-4 pt-5">
                            {/* Result Icon */}
                            <motion.div
                                initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                                animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                                transition={{ delay: 0.5, ...bouncySpring }}
                                className="flex justify-center mb-3"
                                aria-hidden="true"
                            >
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center
                                    ${getAccentColor() === 'emerald'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : getAccentColor() === 'purple'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : getAccentColor() === 'red'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-amber-500/20 text-amber-400'
                                    }
                                `}>
                                    {getResultIcon()}
                                </div>
                            </motion.div>

                            {/* Result Text */}
                            <div className={`
                                text-sm font-black tracking-wide uppercase text-center
                                ${getAccentColor() === 'emerald'
                                    ? 'text-emerald-400'
                                    : getAccentColor() === 'purple'
                                        ? 'text-purple-400'
                                        : getAccentColor() === 'red'
                                            ? 'text-red-400'
                                            : 'text-amber-400'
                                }
                            `}>
                                {getResultMessage()}
                            </div>

                            {/* Winner team badge (hidden in solo mode or when both teams win) */}
                            {!isSolo && roundWinner && roundWinner !== 'both' && (
                                <div className="text-xs mt-2 text-center text-white/60">
                                    {getTeamName(roundWinner)}
                                </div>
                            )}

                            {/* Who answered for my team (hidden in solo mode) */}
                            {!isSolo && myTeamAnswer && (
                                <div className="text-xs mt-1 text-center text-white/50">
                                    {myTeamAnswer.playerName}
                                </div>
                            )}

                            {/* Correct answer (show if team lost or no winner) */}
                            {!didWin && (
                                <div className="text-xs mt-3 text-center select-none text-white/60">
                                    {t('phase2.itWas')}{' '}
                                    <span className={`
                                        font-bold
                                        ${getAccentColor() === 'red' ? 'text-red-400' : 'text-amber-400'}
                                    `}>
                                        {getAnswerText(correctAnswer)}
                                    </span>
                                </div>
                            )}

                            {/* Justification */}
                            {item.justification && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7, duration: durations.normal }}
                                    className="text-xs mt-3 pt-3 border-t border-white/10 italic text-white/70 select-none text-center"
                                >
                                    {item.justification}
                                </motion.p>
                            )}

                            {/* Anecdote Card - Nested TV Quiz Style */}
                            {item.anecdote && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1, duration: durations.normal, ease: 'easeOut' }}
                                    className="mt-4 w-full"
                                >
                                    <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-3">
                                        {/* Header with icon */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`
                                                flex items-center justify-center w-5 h-5 rounded-md
                                                ${getAccentColor() === 'emerald'
                                                    ? 'bg-emerald-500/20'
                                                    : getAccentColor() === 'purple'
                                                        ? 'bg-purple-500/20'
                                                        : getAccentColor() === 'red'
                                                            ? 'bg-purple-500/20'
                                                            : 'bg-amber-500/20'
                                                }
                                            `}>
                                                <span className="text-xs">💡</span>
                                            </div>
                                            <span className={`
                                                text-[9px] font-black uppercase tracking-widest
                                                ${getAccentColor() === 'emerald'
                                                    ? 'text-emerald-400/80'
                                                    : getAccentColor() === 'purple'
                                                        ? 'text-purple-400/80'
                                                        : getAccentColor() === 'red'
                                                            ? 'text-purple-400/80'
                                                            : 'text-amber-400/80'
                                                }
                                            `}>
                                                {t('phase2.funFact', { defaultValue: 'Le saviez-vous ?' })}
                                            </span>
                                        </div>

                                        {/* Anecdote text */}
                                        <p className="text-[11px] leading-relaxed text-white/70 select-none">
                                            {item.anecdote}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Subtle corner glow effect */}
                        <div className={`
                            absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20
                            ${getAccentColor() === 'emerald'
                                ? 'bg-emerald-500'
                                : getAccentColor() === 'purple'
                                    ? 'bg-purple-500'
                                    : getAccentColor() === 'red'
                                        ? 'bg-red-500'
                                        : 'bg-amber-500'
                            }
                        `} />
                    </div>
                </motion.div>,
                document.body
            )}
        </motion.div>
    );
}
