import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, LayoutGroup, type Variants } from 'framer-motion';
import { submitAnswer, startNextQuestion, setGameStatus, type Room } from '../../services/gameService';
import { QUESTIONS } from '../../data/questions';
import { audioService } from '../../services/audioService';
import { markQuestionAsSeen } from '../../services/historyService';
import { SimpleConfetti } from '../ui/SimpleConfetti';
import { TeammateRoster } from '../game/TeammateRoster';
import { QuestionTransition } from '../game/QuestionTransition';
import { springConfig, organicEase, durations, flashIndicatorVariants, snappySpring } from '../../animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
    Triangle, Diamond, Circle, Square,
    Clock, Trophy, XCircle, Play, AlertTriangle
} from 'lucide-react';


interface Phase1PlayerProps {
    room: Room;
    playerId: string;
    isHost?: boolean;
}

const COLORS = [
    'bg-red-500',    // Option A
    'bg-blue-500',   // Option B
    'bg-yellow-500', // Option C
    'bg-green-500'   // Option D
];

const ICONS = [Triangle, Diamond, Circle, Square]; // Shapes corresponding to colors

// Extracted animation variants (outside component to avoid recreation on each render)
const answerGridVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    },
    exit: { opacity: 0, transition: { duration: durations.fast } }
};

// Reduced motion variants (simple fade only)
const answerGridReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.fast } }
};

// Static button variants for entrance animation only
const answerButtonVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: durations.normal, ease: organicEase }
    },
    exit: { opacity: 0, y: -10, transition: { duration: durations.fast } }
};

const answerButtonReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.fast } }
};

// Question card variants (extracted to avoid recreation on each render)
const questionVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: springConfig
    },
    exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: durations.fast } }
};

const questionReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.fast } }
};

export function Phase1Player({ room, playerId, isHost }: Phase1PlayerProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const { state, players } = room;
    const { phaseState, currentQuestionIndex, phase1Answers, phase1BlockedTeams } = state;

    // Use custom AI-generated questions if available, fallback to default QUESTIONS
    const questionsList = room.customQuestions?.phase1 || QUESTIONS;
    const currentQuestion = (currentQuestionIndex !== undefined && currentQuestionIndex >= 0)
        ? questionsList[currentQuestionIndex]
        : null;

    const [myAnswer, setMyAnswer] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState(false);
    const [showQuestionTransition, setShowQuestionTransition] = useState(false);

    // Check if my team is blocked
    const myTeam = players[playerId]?.team;
    const blockedTeams = phase1BlockedTeams || [];
    const isMyTeamBlocked = myTeam ? blockedTeams.includes(myTeam) : false;

    // Track previous question index to detect actual changes
    const prevQuestionIndexRef = useRef<number | undefined>(undefined);

    // Trigger transition effect only when question actually changes
    // Proper useEffect pattern - no mutation during render
    useEffect(() => {
        const prevIndex = prevQuestionIndexRef.current;
        const hasValidIndex = currentQuestionIndex !== undefined && currentQuestionIndex >= 0;

        if (hasValidIndex && currentQuestionIndex !== prevIndex) {
            setMyAnswer(null);
            setSubmitError(false);
            // Only show transition animation for subsequent questions (not the first)
            if (prevIndex !== undefined) {
                setShowQuestionTransition(true);
            }
            // Update ref INSIDE useEffect, not during render
            prevQuestionIndexRef.current = currentQuestionIndex;
        }
    }, [currentQuestionIndex]);

    // Track question as seen when displayed (each player marks on their own device)
    useEffect(() => {
        if (currentQuestion?.text) {
            markQuestionAsSeen('', currentQuestion.text);
        }
    }, [currentQuestion?.text]);

    const handleTransitionComplete = useCallback(() => {
        setShowQuestionTransition(false);
    }, []);

    // Safety timeout: force hide transition if it stays visible too long
    // This prevents the UI from being stuck if onComplete callback fails
    useEffect(() => {
        if (showQuestionTransition) {
            const safetyTimer = setTimeout(() => {
                setShowQuestionTransition(false);
            }, 1500); // Max 1.5s before force-hiding
            return () => clearTimeout(safetyTimer);
        }
    }, [showQuestionTransition]);

    const handleAnswer = async (index: number) => {
        if (phaseState === 'answering' && myAnswer === null && !isMyTeamBlocked) {
            audioService.playClick();
            setMyAnswer(index);
            setSubmitError(false);
            try {
                await submitAnswer(room.code, playerId, index);
            } catch (error) {
                console.error('Failed to submit answer:', error);
                setMyAnswer(null); // Reset UI so player can try again
                setSubmitError(true);
                audioService.playError();
            }
        }
    };

    // HOST LOGIC
    const nextQIndex = (currentQuestionIndex ?? -1) + 1;
    const isFinished = nextQIndex >= questionsList.length;

    const handleNextQuestion = () => {
        if (!isFinished) {
            startNextQuestion(room.code, nextQIndex);
        }
    };

    const isAnswering = phaseState === 'answering';
    const isResult = phaseState === 'result';
    const isReading = phaseState === 'reading';

    // Countdown Logic
    const [countdown, setCountdown] = useState(3);
    useEffect(() => {
        if (isReading) {
            setCountdown(3);
            const timer = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isReading]);

    // Track when buttons become clickable for activation feedback
    const [justBecameAnswering, setJustBecameAnswering] = useState(false);
    const wasAnsweringRef = useRef(false);
    useEffect(() => {
        // Detect transition from non-answering to answering
        if (isAnswering && !wasAnsweringRef.current) {
            setJustBecameAnswering(true);
            // Reset after animation completes
            const timer = setTimeout(() => setJustBecameAnswering(false), 400);
            return () => clearTimeout(timer);
        }
        wasAnsweringRef.current = isAnswering;
    }, [isAnswering]);

    // Determining feedback if result is shown
    let resultMessage = t('common:labels.waiting');
    let resultIcon = <Clock className="w-8 h-8 text-white" />;

    if (isResult) {
        const winnerTeam = state.roundWinner?.team;
        const didMyTeamWin = winnerTeam && winnerTeam === myTeam;

        if (state.roundWinner?.playerId === playerId) {
            resultMessage = t('results.bravo');
            resultIcon = <Trophy className="w-8 h-8 text-white" />;
        } else if (didMyTeamWin) {
            resultMessage = t('results.yourTeamWins');
            resultIcon = <Trophy className="w-8 h-8 text-white" />;
        } else if (winnerTeam && winnerTeam !== 'neutral') {
            resultMessage = t('results.teamWins', { team: t(`common:teams.${winnerTeam}`) });
            resultIcon = <XCircle className="w-8 h-8 text-white" />;
        } else if (!state.roundWinner) {
            resultMessage = t('results.nobodyFound');
            resultIcon = <XCircle className="w-8 h-8 text-white" />;
        } else if (myAnswer !== null) {
            resultMessage = t('results.wrongAnswer');
            resultIcon = <XCircle className="w-8 h-8 text-white" />;
        } else {
            resultMessage = t('results.roundOver');
            resultIcon = <Clock className="w-8 h-8 text-white" />;
        }
    }

    // Audio & Visual Effects Logic
    useEffect(() => {
        if (isResult) {
            const winnerTeam = state.roundWinner?.team;
            const didMyTeamWin = winnerTeam && winnerTeam === myTeam;

            if (state.roundWinner?.playerId === playerId) {
                audioService.playWinRound();
            } else if (didMyTeamWin) {
                audioService.playSuccess();
            } else if (winnerTeam && winnerTeam !== 'neutral') {
                audioService.playError(); // Other team won
            } else {
                audioService.playError(); // No winner
            }
        }
    }, [isResult, state.roundWinner, playerId, myTeam]);

    // Timer Tick Audio
    useEffect(() => {
        if (isReading) {
            const interval = setInterval(() => {
                audioService.playTimerTick();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isReading]);

    // Auto-advance to next question after showing result (any player can trigger)
    // This ensures the game doesn't get stuck if the host disconnects
    // Longer delay when there's an anecdote to read
    // Auto-transition to Phase 2 when all questions are done
    useEffect(() => {
        if (isResult) {
            const hasAnecdote = currentQuestion?.anecdote;
            const delay = hasAnecdote ? 7000 : 5000; // 7s with anecdote, 5s without
            const timer = setTimeout(() => {
                // All players trigger this, but Firebase operations are idempotent
                // The first one to succeed advances the game, others will be no-ops
                if (isFinished) {
                    setGameStatus(room.code, 'phase2');
                } else {
                    startNextQuestion(room.code, nextQIndex);
                }
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isResult, isFinished, room.code, nextQIndex, currentQuestion?.anecdote]);

    // Show transition for question number display (1-indexed)
    const displayQuestionNumber = (currentQuestionIndex ?? 0) + 1;

    // Detect if this is the last question
    const isLastQuestion = currentQuestionIndex !== undefined && currentQuestionIndex === questionsList.length - 1;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-4 space-y-6 relative">
            {/* Question Transition Overlay */}
            <QuestionTransition
                questionNumber={displayQuestionNumber}
                totalQuestions={questionsList.length}
                isVisible={showQuestionTransition}
                onComplete={handleTransitionComplete}
            />

            {/* Top Bar: Progress & Roster */}
            <div className="w-full flex items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-white/5 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{t('common:labels.round')}</span>
                    <span className="text-white font-black bg-slate-700 px-2 py-0.5 rounded text-sm">
                        {(currentQuestionIndex ?? -1) + 1} / {questionsList.length}
                    </span>
                    {/* Last Question Indicator */}
                    <AnimatePresence>
                        {isLastQuestion && (
                            <motion.span
                                variants={flashIndicatorVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            >
                                <AlertTriangle className="w-3 h-3" />
                                {t('player.lastQuestion', 'Dernière !')}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Teammates Mini Roster - Shows answer status */}
                <TeammateRoster
                    players={room.players}
                    currentPlayerId={playerId}
                    myTeam={myTeam}
                    answers={phase1Answers}
                    maxDisplay={6}
                />
            </div>

            {/* Context Header */}
            <div className="space-y-4 w-full">
                {/* Question Text - Always render when question exists, transition overlay shows on top */}
                <AnimatePresence mode="popLayout">
                    {currentQuestion && (
                        <motion.div
                            key={currentQuestionIndex}
                            variants={prefersReducedMotion ? questionReducedVariants : questionVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-slate-800/80 p-6 rounded-xl backdrop-blur-sm border border-slate-700 shadow-xl"
                        >
                            <p className="text-white font-bold text-xl md:text-2xl leading-relaxed text-left">
                                {currentQuestion.text}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <h3 className="text-xl font-bold text-white opacity-80 flex items-center justify-center gap-2" aria-live="polite">
                    {isReading && (
                        <>
                            <Clock className="w-6 h-6 animate-pulse" aria-hidden="true" />
                            {t('player.reading')}{' '}
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={countdown}
                                    initial={{ opacity: 0, y: -20, scale: 1.5 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                                    transition={snappySpring}
                                    className="inline-block min-w-[2ch] text-center tabular-nums"
                                >
                                    {countdown}s
                                </motion.span>
                            </AnimatePresence>
                        </>
                    )}
                    {isAnswering && !isMyTeamBlocked && !submitError && <><Play className="w-6 h-6" aria-hidden="true" /> {t('player.answerNow')}</>}
                    {isAnswering && !isMyTeamBlocked && submitError && <><XCircle className="w-6 h-6 text-orange-400" aria-hidden="true" /> <span className="text-orange-400">{t('player.submitError', 'Erreur, réessayez')}</span></>}
                    {isAnswering && isMyTeamBlocked && <><XCircle className="w-6 h-6 text-red-400" aria-hidden="true" /> <span className="text-red-400">{t('player.teamBlocked')}</span></>}
                    {isResult && t('results.roundOver')}
                    {phaseState === 'idle' && t('player.getReady')}
                </h3>
            </div>

            {/* Answer Grid with staggered entrance animation - Button transforms into result card */}
            {/* Outer wrapper handles scroll, inner grid allows horizontal overflow for shake animation */}
            <div className={`w-full ${isResult ? 'overflow-hidden' : 'max-h-[50vh] overflow-y-auto'} ${isHost ? 'mb-16' : ''}`}>
                <LayoutGroup>
                <AnimatePresence mode="popLayout">
                    {currentQuestion && (
                        <motion.div
                            key={currentQuestionIndex}
                            role="radiogroup"
                            aria-label={t('options.answerOptions')}
                            className="grid grid-cols-1 gap-3 w-full px-3 relative"
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            layoutRoot
                            transition={{ layout: { duration: durations.normal, ease: organicEase } }}
                            variants={prefersReducedMotion ? answerGridReducedVariants : answerGridVariants}
                        >
                        {[0, 1, 2, 3].map((idx) => {
                            const ShapeIcon = ICONS[idx];
                            const isDisabled = !isAnswering || myAnswer !== null || isMyTeamBlocked;
                            const optionLabel = currentQuestion ? currentQuestion.options[idx] : `Option ${['A', 'B', 'C', 'D'][idx]}`;
                            // Only animate shake for wrong answers during result phase (disabled for reduced motion)
                            const shouldShake = !prefersReducedMotion && isResult && myAnswer === idx && idx !== currentQuestion?.correctIndex;
                            // Pulse animation when buttons become clickable (staggered by index)
                            const shouldPulse = !prefersReducedMotion && justBecameAnswering && !isMyTeamBlocked;
                            const isGrayed = (!isAnswering && !isResult) || isMyTeamBlocked;
                            const isSelected = myAnswer === idx;
                            const isFaded = myAnswer !== null && !isSelected;

                            // Check if this is the correct answer during result phase
                            const isCorrectAnswer = currentQuestion && idx === currentQuestion.correctIndex;
                            const shouldTransformToResult = isResult && isCorrectAnswer;

                            // Determine animation based on state
                            const shouldFadeOut = isResult && !isCorrectAnswer;

                            // Determine animation: fade out, shake, pulse, or default
                            const buttonAnimate = shouldFadeOut
                                ? { opacity: 0, scale: 0.95 }
                                : shouldShake
                                    ? { x: [0, -10, 10, -10, 10, 0] }
                                    : shouldPulse
                                        ? { scale: [1, 1.03, 1], transition: { duration: durations.quick, delay: idx * 0.05, ease: "easeInOut" as const } }
                                        : "visible";

                            // If this button should transform into result card (layout animation from button)
                            if (shouldTransformToResult) {
                                return (
                                    <motion.div
                                        key={idx}
                                        layoutId="correct-answer-card"
                                        layout
                                        role="alert"
                                        aria-live="assertive"
                                        transition={{ layout: { duration: durations.normal, ease: organicEase } }}
                                        className={`absolute inset-0 ${COLORS[idx]} p-6 rounded-xl border-b-4 border-black/20 shadow-2xl text-center flex flex-col items-center justify-center gap-4 z-10`}
                                    >
                                        {/* Correct Answer Text */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.1, duration: durations.fast }}
                                            className="flex items-center gap-3 bg-black/20 px-5 py-3 rounded-full"
                                        >
                                            <ShapeIcon fill="currentColor" className="w-6 h-6 text-white" aria-hidden="true" />
                                            <span className="text-white font-bold text-lg">{currentQuestion.options[idx]}</span>
                                        </motion.div>

                                        {/* Result Header - Icon + Message */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.15, duration: durations.fast }}
                                            className="flex items-center gap-2"
                                        >
                                            <span aria-hidden="true">{resultIcon}</span>
                                            <span className="text-xl md:text-2xl font-black text-white">{resultMessage}</span>
                                        </motion.div>

                                        {/* Winner Name */}
                                        {state.roundWinner && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2, duration: durations.fast }}
                                                className="text-sm text-white flex items-center gap-1"
                                            >
                                                {t('results.winner')} <Trophy className="w-4 h-4 text-yellow-400" aria-hidden="true" />
                                                <span className="text-yellow-400 font-bold">{state.roundWinner.name}</span>
                                            </motion.div>
                                        )}

                                        {/* Highlighted Anecdote Card */}
                                        {currentQuestion?.anecdote && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25, duration: durations.fast }}
                                                className="mt-2 w-full"
                                            >
                                                <div className="relative bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20 border border-amber-400/40 rounded-lg px-4 py-3 shadow-lg">
                                                    {/* Decorative corners */}
                                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
                                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

                                                    <div className="flex items-start gap-2">
                                                        <span className="text-amber-400 text-lg flex-shrink-0" aria-hidden="true">💡</span>
                                                        <p className="text-sm text-amber-100/90 italic leading-relaxed text-left">
                                                            {currentQuestion.anecdote}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    layoutId={isCorrectAnswer ? "correct-answer-card" : undefined}
                                    layout={isCorrectAnswer}
                                    role="radio"
                                    aria-checked={isSelected}
                                    aria-disabled={isDisabled || shouldFadeOut}
                                    aria-label={t('options.answerLetter', { letter: ['A', 'B', 'C', 'D'][idx], label: optionLabel })}
                                    variants={prefersReducedMotion ? answerButtonReducedVariants : answerButtonVariants}
                                    animate={buttonAnimate}
                                    transition={{
                                        duration: durations.normal,
                                        ease: organicEase,
                                        layout: { duration: durations.normal, ease: organicEase }
                                    }}
                                    whileTap={prefersReducedMotion || shouldFadeOut ? undefined : { scale: 0.95 }}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={isDisabled || shouldFadeOut}
                                    className={`
                                        w-full p-4 rounded-xl flex items-center space-x-4 shadow-lg border-b-4
                                        transition-[filter] duration-300 ease-out
                                        ${COLORS[idx]}
                                        ${(isResult && isSelected) ? 'ring-4 ring-white' : ''}
                                        ${isGrayed ? 'grayscale brightness-50' : ''}
                                        ${isFaded ? 'opacity-40' : ''}
                                        ${shouldFadeOut ? 'pointer-events-none' : ''}
                                        border-black/20 text-left
                                    `}
                                >
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black/20 rounded-full text-2xl text-white">
                                        <ShapeIcon fill="currentColor" className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1">
                                        {/* Option Text */}
                                        {currentQuestion ? (
                                            <span className="text-white font-bold text-lg leading-tight block">
                                                {currentQuestion.options[idx]}
                                            </span>
                                        ) : (
                                            <span className="text-white/60 font-bold text-lg">Option {['A', 'B', 'C', 'D'][idx]}</span>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                )}
                </AnimatePresence>
                </LayoutGroup>
            </div>

            {/* Celebration Confetti - for personal wins or team wins */}
            {isResult && (state.roundWinner?.playerId === playerId || (state.roundWinner?.team === myTeam)) && <SimpleConfetti />}

            {/* HOST CONTROLS - Fixed at bottom */}

            {isHost && currentQuestionIndex === -1 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur border-t border-slate-800 flex justify-center z-50">
                    <button
                        onClick={handleNextQuestion}
                        aria-label={t('host.startReading')}
                        className="px-8 py-3 rounded-full text-lg font-bold text-white shadow-lg transition-all w-full max-w-sm flex items-center justify-center gap-2 bg-gradient-to-r from-spicy-500 to-sweet-500 hover:scale-105 active:scale-95"
                    >
                        <Play className="w-5 h-5" aria-hidden="true" /> {t('common:buttons.start')}
                    </button>
                </div>
            )}
        </div>
    );
}
