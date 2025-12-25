import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, LayoutGroup, type Variants } from 'framer-motion';
import { submitAnswer, startNextQuestion, showPhaseResults, handlePhase1Timeout, type Room } from '../../services/gameService';
import { audioService } from '../../services/audioService';
import { markQuestionAsSeen } from '../../services/historyService';
import { SimpleConfetti } from '../ui/SimpleConfetti';
import { TeammateRoster } from '../game/TeammateRoster';
import { QuestionTransition } from '../game/QuestionTransition';
import { Phase4Timer } from './phase4/Phase4Timer';
import { springConfig, organicEase, durations, flashIndicatorVariants, transitionDurations, getTransitionDuration } from '../../animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHaptic } from '../../hooks/useHaptic';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import {
    Triangle, Diamond, Circle, Square,
    Clock, Trophy, XCircle, Play, AlertTriangle
} from 'lucide-react';

// Phase 1 answering timer (60 seconds)
const PHASE1_TIMER_SECONDS = 60;


interface Phase1PlayerProps {
    room: Room;
    playerId: string;
    isHost?: boolean;
    mode?: 'solo' | 'multiplayer';
    soloHandlers?: SoloPhaseHandlers;
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

// Button variants for entrance animation and dynamic states
// Using variants prevents animation restarts on re-render (stable references)
const answerButtonVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        x: 0,
        transition: { duration: durations.normal, ease: organicEase }
    },
    exit: { opacity: 0, y: -10, transition: { duration: durations.fast } },
    shake: {
        x: [0, -8, 8, -8, 8, 0],
        scale: 1,
        transition: { duration: 0.3, ease: "easeInOut" }
    },
    fadeOut: {
        opacity: 0,
        transition: { duration: durations.quick, ease: organicEase }
    }
};

const answerButtonReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.fast } },
    shake: { opacity: 1 }, // No shake animation for reduced motion
    fadeOut: { opacity: 0, transition: { duration: durations.fast } }
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

// Memoized question card to prevent re-animation when timer state changes
interface QuestionCardProps {
    questionText: string;
    questionIndex: number | undefined;
    prefersReducedMotion: boolean;
}

const QuestionCard = memo(({ questionText, questionIndex, prefersReducedMotion }: QuestionCardProps) => {
    return (
        <motion.div
            key={questionIndex}
            layoutId={`question-card-${questionIndex}`}
            variants={prefersReducedMotion ? questionReducedVariants : questionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-slate-800/80 p-6 rounded-xl backdrop-blur-sm border border-slate-700 shadow-xl"
        >
            <p className="text-white font-bold text-xl md:text-2xl leading-relaxed text-left select-none">
                {questionText}
            </p>
        </motion.div>
    );
});

export function Phase1Player({ room, playerId, isHost, mode = 'multiplayer', soloHandlers }: Phase1PlayerProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const haptic = useHaptic();
    const isSolo = mode === 'solo';
    const { state, players } = room;
    const { phaseState, currentQuestionIndex, phase1Answers, phase1BlockedTeams, phase1TriedWrongOptions } = state;

    // Rebond: track tried wrong options (disabled in solo mode)
    const triedWrongOptions = isSolo ? [] : (phase1TriedWrongOptions || []);

    // Use custom questions from database (no fallback - questions must be generated/saved first)
    const questionsList = room.customQuestions?.phase1 || [];
    const currentQuestion = (currentQuestionIndex !== undefined && currentQuestionIndex >= 0 && questionsList.length > 0)
        ? questionsList[currentQuestionIndex]
        : null;

    const [myAnswer, setMyAnswer] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState(false);
    const [showQuestionTransition, setShowQuestionTransition] = useState(false);
    const [wrongFeedbackIndex, setWrongFeedbackIndex] = useState<number | null>(null);
    // Separate displayed index from incoming index to prevent flash
    const [displayedQuestionIndex, setDisplayedQuestionIndex] = useState<number | undefined>(undefined);
    const pendingQuestionRef = useRef<number | undefined>(undefined);
    // Result reveal animation phase: 'idle' → 'shaking' → 'revealing'
    const [resultRevealPhase, setResultRevealPhase] = useState<'idle' | 'shaking' | 'revealing'>('idle');
    // Track if we already showed wrong feedback animation (to avoid double shake)
    // Using state instead of ref to ensure proper React lifecycle synchronization
    const [hasShownWrongFeedback, setHasShownWrongFeedback] = useState(false);
    // Solo mode: delay showing result state while wrong feedback animation plays
    const [soloDelayingResult, setSoloDelayingResult] = useState(false);

    // Check if my team is blocked (disabled in solo mode)
    const myTeam = players[playerId]?.team;
    const blockedTeams = phase1BlockedTeams || [];
    const isMyTeamBlocked = isSolo ? false : (myTeam ? blockedTeams.includes(myTeam) : false);

    // Reset myAnswer when team becomes unblocked (rebond in favor)
    // This allows the player to answer again after their team is unblocked
    const wasBlockedRef = useRef(isMyTeamBlocked);
    useEffect(() => {
        // Detect transition from blocked → unblocked while still in answering phase
        if (wasBlockedRef.current && !isMyTeamBlocked && phaseState === 'answering') {
            // Team was blocked but is now unblocked (rebond) - allow answering again
            setMyAnswer(null);
            setWrongFeedbackIndex(null);
        }
        wasBlockedRef.current = isMyTeamBlocked;
    }, [isMyTeamBlocked, phaseState]);

    // Get the displayed question (uses displayedQuestionIndex to prevent flash during transition)
    const displayedQuestion = (displayedQuestionIndex !== undefined && displayedQuestionIndex >= 0 && questionsList.length > 0)
        ? questionsList[displayedQuestionIndex]
        : null;

    // Trigger transition effect only when question actually changes
    // NEW: Don't update displayedQuestionIndex immediately - wait for transition to hide content
    useEffect(() => {
        const hasValidIndex = currentQuestionIndex !== undefined && currentQuestionIndex >= 0;

        if (hasValidIndex) {
            if (displayedQuestionIndex === undefined) {
                // First question - display immediately (no transition needed)
                setDisplayedQuestionIndex(currentQuestionIndex);
                setMyAnswer(null);
                setSubmitError(false);
                setWrongFeedbackIndex(null);
                setHasShownWrongFeedback(false);
            } else if (currentQuestionIndex !== displayedQuestionIndex) {
                // Subsequent question - store pending and show transition
                // The actual index update happens in handleContentHidden
                pendingQuestionRef.current = currentQuestionIndex;
                setShowQuestionTransition(true);
                // FIX: Reset myAnswer immediately to unblock clicks during transition
                // (displayed question is still old until handleContentHidden, but input is unblocked)
                setMyAnswer(null);
                setHasShownWrongFeedback(false);
                setSoloDelayingResult(false);
            }
        }
    }, [currentQuestionIndex, displayedQuestionIndex]);

    // Callback called when transition overlay is fully opaque - NOW we can swap content
    const handleContentHidden = useCallback(() => {
        if (pendingQuestionRef.current !== undefined) {
            setDisplayedQuestionIndex(pendingQuestionRef.current);
            setMyAnswer(null);
            setSubmitError(false);
            setWrongFeedbackIndex(null);
            setResultRevealPhase('idle');
            setHasShownWrongFeedback(false); // Reset for next question
            setSoloDelayingResult(false); // Reset solo delay for next question
            pendingQuestionRef.current = undefined;
        }
    }, []);

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
    // Adaptive based on reduced motion preference
    useEffect(() => {
        if (showQuestionTransition) {
            const baseDuration = getTransitionDuration('questionTransition', prefersReducedMotion);
            const safetyTimer = setTimeout(() => {
                // FIX: Also call handleContentHidden to reset state if callback was never called
                handleContentHidden();
                setShowQuestionTransition(false);
            }, baseDuration + transitionDurations.safetyMargin);
            return () => clearTimeout(safetyTimer);
        }
    }, [showQuestionTransition, prefersReducedMotion, handleContentHidden]);

    const handleAnswer = async (index: number) => {
        // Also check if this option was already tried and wrong (rebond system)
        // Also prevent interaction during wrong feedback animation
        if (phaseState !== 'answering' || myAnswer !== null || isMyTeamBlocked ||
            triedWrongOptions.includes(index) || wrongFeedbackIndex !== null) {
            return;
        }

        audioService.playClick();
        haptic.tap();
        setSubmitError(false);

        // Check if answer is wrong BEFORE submitting (for immediate visual feedback)
        // Use displayedQuestion (what user sees) not currentQuestion (which may have changed)
        const isWrongAnswer = displayedQuestion && index !== displayedQuestion.correctIndex;

        // Start the network submission immediately (optimistic UI)
        const submitPromise = (async () => {
            try {
                if (isSolo && soloHandlers) {
                    soloHandlers.submitPhase1Answer(index);
                } else {
                    await submitAnswer(room.code, playerId, index);
                }
                return { success: true };
            } catch (error) {
                console.error('Failed to submit answer:', error);
                return { success: false, error };
            }
        })();

        if (isWrongAnswer && !prefersReducedMotion) {
            // Show immediate wrong answer feedback
            setWrongFeedbackIndex(index);
            setHasShownWrongFeedback(true); // Mark that we showed the animation
            audioService.playError();
            haptic.error();

            // Solo mode: delay result state to let animation play
            if (isSolo) {
                setSoloDelayingResult(true);
            }

            // Run animation and network call in PARALLEL (not sequential)
            const feedbackDuration = getTransitionDuration('wrongFeedback', prefersReducedMotion);
            const [, networkResult] = await Promise.all([
                new Promise<void>(resolve => setTimeout(resolve, feedbackDuration)),
                submitPromise
            ]);

            setWrongFeedbackIndex(null);
            // Solo mode: animation done, allow result state now
            if (isSolo) {
                setSoloDelayingResult(false);
            }

            if (!networkResult.success) {
                setSubmitError(true);
                audioService.playError();
                return; // Don't lock answer, allow retry
            }
        } else {
            // Correct answer or reduced motion: just wait for network
            const networkResult = await submitPromise;
            if (!networkResult.success) {
                setSubmitError(true);
                audioService.playError();
                return;
            }
        }

        // Success: lock the answer
        setMyAnswer(index);
    };

    // HOST LOGIC
    const nextQIndex = (currentQuestionIndex ?? -1) + 1;
    const isFinished = nextQIndex >= questionsList.length;

    const handleNextQuestion = () => {
        if (!isFinished) {
            if (isSolo && soloHandlers) {
                soloHandlers.nextPhase1Question();
            } else {
                startNextQuestion(room.code, nextQIndex);
            }
        }
    };

    const isAnswering = phaseState === 'answering';
    // In solo mode, delay showing result state while wrong feedback animation plays
    const isResult = phaseState === 'result' && !soloDelayingResult;
    const isReading = phaseState === 'reading';

    // Countdown Logic (reading phase - 3 second countdown)
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

    // Answering phase timer (60 seconds countdown)
    // Now synchronized with Firebase server timestamp for consistency across all players
    const [answeringTimeRemaining, setAnsweringTimeRemaining] = useState(PHASE1_TIMER_SECONDS);
    const answeringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasHandledTimeoutRef = useRef(false);

    // Reset timeout handler ref when question changes (critical for solo mode progression)
    useEffect(() => {
        hasHandledTimeoutRef.current = false;
    }, [currentQuestionIndex]);

    useEffect(() => {
        // Start timer when entering answering phase
        // Timer continues running even after player answers (for other players to see)
        // Timer is disabled in solo mode - player has unlimited time
        if (!isSolo && isAnswering && state.questionStartTime) {
            const updateTimer = () => {
                // Use Firebase server timestamp for accurate countdown (not local time)
                const elapsed = Math.floor((Date.now() - (state.questionStartTime ?? Date.now())) / 1000);
                const remaining = Math.max(0, PHASE1_TIMER_SECONDS - elapsed);
                setAnsweringTimeRemaining(remaining);

                // Handle timeout (host triggers transition to result state)
                if (remaining === 0 && !hasHandledTimeoutRef.current) {
                    hasHandledTimeoutRef.current = true;

                    if (isSolo && soloHandlers) {
                        // Solo mode: use handlers to advance
                        if (isFinished) {
                            soloHandlers.advanceToNextPhase();
                        } else {
                            soloHandlers.nextPhase1Question();
                        }
                    } else if (isHost) {
                        // Multiplayer: host sets phaseState to 'result' (timeout)
                        // The existing isResult effect will then handle advancing to next question
                        handlePhase1Timeout(room.code);
                    }
                }
            };

            // Initial update
            updateTimer();
            // Update every second
            answeringTimerRef.current = setInterval(updateTimer, 1000);

            return () => {
                if (answeringTimerRef.current) {
                    clearInterval(answeringTimerRef.current);
                    answeringTimerRef.current = null;
                }
            };
        }

        // Reset timer when phase changes
        if (!isAnswering) {
            setAnsweringTimeRemaining(PHASE1_TIMER_SECONDS);
            if (answeringTimerRef.current) {
                clearInterval(answeringTimerRef.current);
                answeringTimerRef.current = null;
            }
        }
    }, [isAnswering, state.questionStartTime, isHost, isSolo, isFinished, room.code, nextQIndex, soloHandlers]);

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

    // Result reveal animation sequence: first shake wrong answer, then reveal correct
    useEffect(() => {
        if (isResult && myAnswer !== null) {
            const isWrongAnswer = displayedQuestion && myAnswer !== displayedQuestion.correctIndex;

            // Only show shake animation if we haven't already shown it via wrongFeedbackIndex
            if (isWrongAnswer && !prefersReducedMotion && !hasShownWrongFeedback) {
                // Step 1: Show shake animation on wrong answer
                setResultRevealPhase('shaking');

                // Step 2: After shake duration, reveal the correct answer
                const shakeDuration = getTransitionDuration('wrongFeedback', false);
                const timer = setTimeout(() => {
                    setResultRevealPhase('revealing');
                }, shakeDuration);

                return () => clearTimeout(timer);
            } else if (isWrongAnswer && hasShownWrongFeedback) {
                // Already showed feedback via wrongFeedbackIndex - go directly to revealing
                // (the shake animation has already completed since wrongFeedbackIndex is managed separately)
                setResultRevealPhase('revealing');
            } else {
                // Correct answer or reduced motion: go directly to revealing
                setResultRevealPhase('revealing');
            }
        } else if (isResult && myAnswer === null) {
            // Player didn't answer - go directly to revealing
            setResultRevealPhase('revealing');
        } else if (!isResult) {
            setResultRevealPhase('idle');
        }
    }, [isResult, myAnswer, displayedQuestion, prefersReducedMotion, hasShownWrongFeedback]);

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
        } else if (myAnswer !== null) {
            // Player answered but was wrong - check this BEFORE !state.roundWinner
            resultMessage = t('results.wrongAnswer');
            resultIcon = <XCircle className="w-8 h-8 text-white" />;
        } else if (!state.roundWinner) {
            // No winner and player didn't answer (timeout)
            resultMessage = isSolo ? t('results.solo.timeout') : t('results.nobodyFound');
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
                haptic.success();
            } else if (didMyTeamWin) {
                audioService.playSuccess();
                haptic.success();
            } else if (winnerTeam && winnerTeam !== 'neutral') {
                audioService.playError(); // Other team won
                haptic.error();
            } else {
                audioService.playError(); // No winner
                haptic.error();
            }
        }
    }, [isResult, state.roundWinner, playerId, myTeam, haptic]);

    // Timer Tick Audio
    useEffect(() => {
        if (isReading) {
            const interval = setInterval(() => {
                audioService.playTimerTick();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isReading]);

    // Auto-advance to next question after showing result (host only in multiplayer)
    // Solo mode always advances; multiplayer requires host to prevent race conditions
    // Longer delay when there's an anecdote to read
    // Auto-transition to Phase 2 when all questions are done
    useEffect(() => {
        // Solo mode: always advance; Multiplayer: only host advances
        if (isResult && (isSolo || isHost)) {
            const hasAnecdote = currentQuestion?.anecdote;
            const delay = hasAnecdote ? 7000 : 5000; // 7s with anecdote, 5s without
            const timer = setTimeout(() => {
                if (isSolo && soloHandlers) {
                    // Solo mode: use handlers
                    if (isFinished) {
                        soloHandlers.advanceToNextPhase();
                    } else {
                        soloHandlers.nextPhase1Question();
                    }
                } else {
                    // Multiplayer: Only host triggers transition (prevents race conditions)
                    if (isFinished) {
                        showPhaseResults(room.code);
                    } else {
                        startNextQuestion(room.code, nextQIndex);
                    }
                }
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isResult, isHost, isFinished, room.code, nextQIndex, currentQuestion?.anecdote, isSolo, soloHandlers]);

    // Show transition for question number display (1-indexed)
    const displayQuestionNumber = (currentQuestionIndex ?? 0) + 1;

    // Detect if this is the last question
    const isLastQuestion = currentQuestionIndex !== undefined && currentQuestionIndex === questionsList.length - 1;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-4 space-y-2 relative">
            {/* Question Transition Overlay */}
            <QuestionTransition
                questionNumber={displayQuestionNumber}
                totalQuestions={questionsList.length}
                isVisible={showQuestionTransition}
                onComplete={handleTransitionComplete}
                onContentHidden={handleContentHidden}
            />

            {/* Answering Phase Timer - Shows countdown during answering phase (disabled in solo mode) */}
            <AnimatePresence>
                {!isSolo && isAnswering && !isResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: durations.fast }}
                        className="w-full flex justify-center"
                    >
                        <Phase4Timer
                            timeRemaining={answeringTimeRemaining}
                            totalTime={PHASE1_TIMER_SECONDS}
                            isActive={isAnswering && myAnswer === null && !isMyTeamBlocked}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar: Progress & Roster - hidden on mobile in solo (shown in header) */}
            <div className={`w-full items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-white/5 mb-2 ${isSolo ? 'hidden md:flex' : 'flex'}`}>
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

                {/* Teammates Mini Roster - Shows answer status (hidden in solo mode) */}
                {!isSolo && (
                    <TeammateRoster
                        players={room.players}
                        currentPlayerId={playerId}
                        myTeam={myTeam}
                        answers={phase1Answers}
                        maxDisplay={6}
                    />
                )}
            </div>

            {/* Context Header */}
            <div className="space-y-4 w-full">
                {/* Question Text - Uses displayedQuestion to prevent flash during transition */}
                {/* Memoized to prevent re-animation when timer state changes (e.g. hurry mode at 5s) */}
                <AnimatePresence mode="popLayout">
                    {displayedQuestion && (
                        <QuestionCard
                            questionText={displayedQuestion.text}
                            questionIndex={displayedQuestionIndex}
                            prefersReducedMotion={prefersReducedMotion}
                        />
                    )}
                </AnimatePresence>

                <h3 className="text-xl font-bold text-white opacity-80 flex items-center justify-center gap-2" aria-live="polite">
                    {/* Reading countdown - only show during reading phase AND when countdown is active */}
                    {isReading && phaseState === 'reading' && countdown > 0 && (
                        <>
                            <Clock className="w-6 h-6 animate-pulse" aria-hidden="true" />
                            {t('player.reading')}{' '}
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={countdown}
                                    initial={{ opacity: 0, y: -20, scale: 1.5 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                                    transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                                    className="inline-block min-w-[2ch] text-center tabular-nums"
                                >
                                    {countdown}s
                                </motion.span>
                            </AnimatePresence>
                        </>
                    )}
                    {isAnswering && !isMyTeamBlocked && !submitError && triedWrongOptions.length === 0 && <span className={`${isSolo ? 'hidden md:flex' : 'flex'} items-center gap-2`}><Play className="w-6 h-6" aria-hidden="true" /> <span className="hidden md:inline">{t('player.answerNow')}</span></span>}
                    {isAnswering && !isMyTeamBlocked && !submitError && triedWrongOptions.length > 0 && <><Play className="w-6 h-6 text-green-400" aria-hidden="true" /> <span className="text-green-400 font-bold">{t('player.rebond', 'REBOND ! À vous !')}</span></>}
                    {isAnswering && !isMyTeamBlocked && submitError && <><XCircle className="w-6 h-6 text-orange-400" aria-hidden="true" /> <span className="text-orange-400">{t('player.submitError', 'Erreur, réessayez')}</span></>}
                    {isAnswering && isMyTeamBlocked && <><XCircle className="w-6 h-6 text-red-400" aria-hidden="true" /> <span className="text-red-400">{t('player.teamBlocked')}</span></>}
                    {isResult && t('results.roundOver')}
                    {phaseState === 'idle' && t('player.getReady')}
                </h3>
            </div>

            {/* Answer Grid with staggered entrance animation - Button transforms into result card */}
            {/* Outer wrapper handles scroll, inner grid allows horizontal overflow for shake animation */}
            <div className={`w-full ${isHost ? 'mb-16' : ''}`}>
                <LayoutGroup>
                <AnimatePresence mode="popLayout">
                    {displayedQuestion && (
                        <motion.div
                            key={displayedQuestionIndex}
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
                            // Rebond: check if this option was already tried and wrong
                            const isTriedWrong = triedWrongOptions.includes(idx);
                            // Immediate wrong answer feedback (shake + X)
                            const isShowingWrongFeedback = wrongFeedbackIndex === idx;
                            const isDisabled = !isAnswering || myAnswer !== null || isMyTeamBlocked || isTriedWrong || wrongFeedbackIndex !== null;
                            const optionLabel = displayedQuestion ? displayedQuestion.options[idx] : `Option ${['A', 'B', 'C', 'D'][idx]}`;
                            // Pulse animation when buttons become clickable (staggered by index)
                            const shouldPulse = !prefersReducedMotion && justBecameAnswering && !isMyTeamBlocked && !isTriedWrong;
                            // Gray out when: not answering, team blocked, tried wrong, OR showing wrong feedback
                            const isGrayed = (!isAnswering && !isResult) || isMyTeamBlocked || isTriedWrong || isShowingWrongFeedback;
                            const isSelected = myAnswer === idx;
                            const isFaded = myAnswer !== null && !isSelected;

                            // Check if this is the correct answer during result phase
                            const isCorrectAnswer = displayedQuestion && idx === displayedQuestion.correctIndex;
                            // Only transform to result card after the shake animation is done
                            const shouldTransformToResult = isResult && isCorrectAnswer && resultRevealPhase === 'revealing';

                            // Animation during result shake phase (only if immediate feedback wasn't shown)
                            // Skip result shake if we already showed immediate feedback OR if immediate feedback is currently showing
                            const isResultShaking = resultRevealPhase === 'shaking' && myAnswer === idx && !isCorrectAnswer && !hasShownWrongFeedback && wrongFeedbackIndex === null;
                            // Fade out only after the shake animation is complete
                            const shouldFadeOut = resultRevealPhase === 'revealing' && isResult && !isCorrectAnswer;

                            // Determine animation: wrong feedback shake > result shake > fade out > pulse > default
                            // Using variant names for shake/fadeOut prevents animation restarts on re-render
                            const buttonAnimate = isShowingWrongFeedback || isResultShaking
                                ? "shake"
                                : shouldFadeOut
                                    ? "fadeOut"
                                    : shouldPulse
                                        // Pulse needs inline object for per-button staggered delay
                                        ? { scale: [1, 1.03, 1], transition: { duration: durations.quick, delay: idx * 0.05, ease: "easeInOut" as const } }
                                        : "visible";

                            // If this button should transform into result card (layout animation from button)
                            if (shouldTransformToResult) {
                                return (
                                    <motion.div
                                        key={idx}
                                        data-cursor-target={`phase1:answer:${idx}`}
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
                                            <span className="text-white font-bold text-lg select-none">{displayedQuestion.options[idx]}</span>
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
                                        {displayedQuestion?.anecdote && (
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
                                                        <p className="text-sm text-amber-100/90 italic leading-relaxed text-left select-none">
                                                            {displayedQuestion.anecdote}
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
                                    data-cursor-target={`phase1:answer:${idx}`}
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
                                        transition-[filter] duration-300 ease-out relative
                                        ${COLORS[idx]}
                                        ${(isResult && isSelected) ? 'ring-4 ring-white' : ''}
                                        ${isGrayed ? 'grayscale brightness-50' : ''}
                                        ${isFaded ? 'opacity-40' : ''}
                                        ${shouldFadeOut ? 'pointer-events-none' : ''}
                                        ${isTriedWrong ? 'opacity-30' : ''}
                                        border-black/20 text-left
                                    `}
                                >
                                    {/* Immediate wrong answer feedback - simple X icon (no animation) */}
                                    {isShowingWrongFeedback && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-20 pointer-events-none">
                                            <XCircle className="w-16 h-16 text-red-500 drop-shadow-lg" aria-label={t('player.wrongAnswer', 'Mauvaise réponse')} />
                                        </div>
                                    )}
                                    {/* Result phase: X icon for player's wrong answer */}
                                    {isResultShaking && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-20 pointer-events-none">
                                            <XCircle className="w-16 h-16 text-red-500 drop-shadow-lg" aria-label={t('player.wrongAnswer', 'Mauvaise réponse')} />
                                        </div>
                                    )}
                                    {/* Rebond: X overlay for eliminated options */}
                                    {isTriedWrong && !isShowingWrongFeedback && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10 pointer-events-none">
                                            <XCircle className="w-12 h-12 text-red-500 drop-shadow-lg" aria-label={t('player.optionEliminated', 'Option éliminée')} />
                                        </div>
                                    )}
                                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black/20 rounded-full text-2xl text-white">
                                        <ShapeIcon fill="currentColor" className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <div className="flex-1">
                                        {/* Option Text */}
                                        {displayedQuestion ? (
                                            <span className="text-white font-bold text-lg leading-tight block select-none">
                                                {displayedQuestion.options[idx]}
                                            </span>
                                        ) : (
                                            <span className="text-white/60 font-bold text-lg select-none">Option {['A', 'B', 'C', 'D'][idx]}</span>
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

            {/* HOST CONTROLS - Fixed at bottom (hidden in solo mode) */}

            {!isSolo && isHost && currentQuestionIndex === -1 && (
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
