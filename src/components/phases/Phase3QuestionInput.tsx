import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Check, X, Flame, Candy, Trophy, Users, Clock } from 'lucide-react';
import { FoodLoader } from '../ui/FoodLoader';
import type { Team, Phase3Theme, Phase3TeamProgress, Player } from '../../types/gameTypes';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import { submitPhase3Answer, skipPhase3Question, updatePhase3Typing, clearPhase3Typing } from '../../services/gameService';
import { audioService } from '../../services/audioService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { bouncySpring, durations } from '../../animations';

// Max character limit for answers
const MAX_ANSWER_LENGTH = 50;

// Time limit per question in seconds
const QUESTION_TIME_LIMIT = 60;

interface Phase3QuestionInputProps {
    roomCode: string;
    playerId: string;
    playerTeam: Team;
    theme: Phase3Theme;
    teamProgress: Phase3TeamProgress;
    players: Record<string, Player>;
    otherTeamProgress?: Phase3TeamProgress;
    mode?: 'solo' | 'multiplayer';
    soloHandlers?: SoloPhaseHandlers;
    currentTyping?: Record<string, string>;  // playerId -> current typing text
}

type AnswerFeedback = 'correct' | 'incorrect' | 'already_answered' | null;

export const Phase3QuestionInput: React.FC<Phase3QuestionInputProps> = ({
    roomCode,
    playerId,
    playerTeam,
    theme,
    teamProgress,
    players,
    otherTeamProgress,
    mode = 'multiplayer',
    soloHandlers,
    currentTyping,
}) => {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const isSolo = mode === 'solo';
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<AnswerFeedback>(null);
    const [lastQuestionIndex, setLastQuestionIndex] = useState(teamProgress.currentQuestionIndex);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
    const hasPlayedFeedbackRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const skipTriggeredRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentQuestionIndex = teamProgress.currentQuestionIndex;
    const currentQuestion = theme.questions[currentQuestionIndex];
    const isFinished = teamProgress.finished;

    // Get who answered each question
    const getAnsweredBy = useCallback((questionIndex: number): Player | null => {
        const answeredById = teamProgress.questionAnsweredBy?.[questionIndex];
        if (!answeredById) return null;
        return players[answeredById] || null;
    }, [teamProgress.questionAnsweredBy, players]);

    // Get teammates (same team, not self)
    const teammates = Object.values(players).filter(
        p => p.team === playerTeam && p.id !== playerId && p.isOnline && !p.id.startsWith('mock_')
    );

    // Get teammates' current typing
    const teammatesTyping = teammates
        .map(teammate => ({
            player: teammate,
            text: currentTyping?.[teammate.id] || '',
        }))
        .filter(t => t.text.length > 0);

    // Update typing to Firebase with debounce (300ms)
    const updateTypingDebounced = useCallback((text: string) => {
        if (isSolo) return; // No need in solo mode

        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        typingDebounceRef.current = setTimeout(() => {
            updatePhase3Typing(roomCode, playerId, text).catch(console.error);
        }, 300);
    }, [roomCode, playerId, isSolo]);

    // Clear typing on unmount or when question changes
    useEffect(() => {
        return () => {
            if (typingDebounceRef.current) {
                clearTimeout(typingDebounceRef.current);
            }
            if (!isSolo) {
                clearPhase3Typing(roomCode, playerId).catch(console.error);
            }
        };
    }, [roomCode, playerId, isSolo]);

    // Reset state when question changes (someone else answered correctly)
    useEffect(() => {
        if (currentQuestionIndex !== lastQuestionIndex) {
            setAnswer('');
            setFeedback(null);
            setIsSubmitting(false);
            setLastQuestionIndex(currentQuestionIndex);
            setTimeLeft(QUESTION_TIME_LIMIT);
            hasPlayedFeedbackRef.current = false;
            skipTriggeredRef.current = false;
            // Clear typing when question changes
            if (!isSolo) {
                clearPhase3Typing(roomCode, playerId).catch(console.error);
            }
            // Re-focus the input for the next question
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [currentQuestionIndex, lastQuestionIndex, isSolo, roomCode, playerId]);

    // Timer countdown
    useEffect(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Don't run timer if already answered or finished
        if (feedback === 'correct' || feedback === 'already_answered' || isFinished) {
            return;
        }

        // Start countdown
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up - clear timer and set feedback
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    audioService.playError();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [currentQuestionIndex, feedback, isFinished]);

    // Auto-skip to next question after incorrect answer or timeout (multiplayer only)
    useEffect(() => {
        // Only trigger skip once per question
        if (skipTriggeredRef.current) return;

        const shouldSkip = feedback === 'incorrect' && !isSolo && !isFinished;
        if (!shouldSkip) return;

        skipTriggeredRef.current = true;
        console.log('[Phase3] Will skip question in 2s (incorrect answer)');

        // Wait 2 seconds to show feedback, then skip to next question
        const skipTimer = setTimeout(async () => {
            try {
                console.log('[Phase3] Skipping question now...');
                const result = await skipPhase3Question(roomCode, playerTeam);
                console.log('[Phase3] Skip result:', result);
                if (!result.success) {
                    console.warn('[Phase3] Skip failed, will retry...');
                    // Retry once after 1 second
                    setTimeout(async () => {
                        try {
                            await skipPhase3Question(roomCode, playerTeam);
                        } catch (retryError) {
                            console.error('[Phase3] Skip retry failed:', retryError);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('[Phase3] Failed to skip question:', error);
                // Retry once after 1 second
                setTimeout(async () => {
                    try {
                        await skipPhase3Question(roomCode, playerTeam);
                    } catch (retryError) {
                        console.error('[Phase3] Skip retry failed:', retryError);
                    }
                }, 1000);
            }
        }, 2000);

        return () => clearTimeout(skipTimer);
    }, [feedback, isSolo, roomCode, playerTeam, isFinished]);

    // Auto-skip when time runs out (multiplayer only)
    useEffect(() => {
        // Only trigger skip once per question
        if (skipTriggeredRef.current) return;

        const shouldSkip = timeLeft === 0 && !isSolo && !isFinished && !feedback;
        if (!shouldSkip) return;

        skipTriggeredRef.current = true;
        console.log('[Phase3] Will skip question in 2s (timeout)');

        // Wait 2 seconds to show feedback, then skip to next question
        const skipTimer = setTimeout(async () => {
            try {
                console.log('[Phase3] Skipping question now...');
                const result = await skipPhase3Question(roomCode, playerTeam);
                console.log('[Phase3] Skip result:', result);
                if (!result.success) {
                    console.warn('[Phase3] Skip failed, will retry...');
                    // Retry once after 1 second
                    setTimeout(async () => {
                        try {
                            await skipPhase3Question(roomCode, playerTeam);
                        } catch (retryError) {
                            console.error('[Phase3] Skip retry failed:', retryError);
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('[Phase3] Failed to skip question:', error);
                // Retry once after 1 second
                setTimeout(async () => {
                    try {
                        await skipPhase3Question(roomCode, playerTeam);
                    } catch (retryError) {
                        console.error('[Phase3] Skip retry failed:', retryError);
                    }
                }, 1000);
            }
        }, 2000);

        return () => clearTimeout(skipTimer);
    }, [timeLeft, isSolo, roomCode, playerTeam, isFinished, feedback]);

    // Recovery mechanism: Reset state if stuck for too long (5 seconds after skip was triggered)
    useEffect(() => {
        if (!skipTriggeredRef.current) return;
        if (feedback !== 'incorrect' && timeLeft !== 0) return;

        // If we're stuck (skipTriggered but question hasn't changed after 5s), allow retry
        const recoveryTimer = setTimeout(() => {
            console.log('[Phase3] Recovery: resetting state after being stuck');
            setFeedback(null);
            setAnswer('');
            skipTriggeredRef.current = false;
            setTimeLeft(QUESTION_TIME_LIMIT);
        }, 5000);

        return () => clearTimeout(recoveryTimer);
    }, [feedback, timeLeft, currentQuestionIndex]);

    // Auto-advance to next question in solo mode after correct answer
    useEffect(() => {
        const nextQuestion = soloHandlers?.nextPhase3Question;
        if (feedback === 'correct' && isSolo && nextQuestion) {
            const timer = setTimeout(() => {
                nextQuestion();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [feedback, isSolo, soloHandlers]);

    // Auto-reset state after correct answer in multiplayer mode
    useEffect(() => {
        if (feedback === 'correct' && !isSolo && !isFinished) {
            // Only trigger skip once per question
            if (skipTriggeredRef.current) return;

            skipTriggeredRef.current = true;
            console.log('[Phase3] Will reset after correct answer in 2s');

            // Wait 2 seconds to show feedback, then reset state
            // The question index will be incremented by the backend
            const resetTimer = setTimeout(() => {
                console.log('[Phase3] Resetting state after correct answer');
                setAnswer('');
                setFeedback(null);
                setIsSubmitting(false);
            }, 2000);

            return () => clearTimeout(resetTimer);
        }
    }, [feedback, isSolo, isFinished]);

    // Play audio feedback when feedback changes
    useEffect(() => {
        if (hasPlayedFeedbackRef.current) return;

        if (feedback === 'correct') {
            hasPlayedFeedbackRef.current = true;
            audioService.playSuccess();
        } else if (feedback === 'incorrect') {
            hasPlayedFeedbackRef.current = true;
            audioService.playError();
        } else if (feedback === 'already_answered') {
            hasPlayedFeedbackRef.current = true;
            // Play a neutral sound for "already answered"
            audioService.playClick();
        }
    }, [feedback]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim() || isSubmitting || feedback === 'correct' || feedback === 'incorrect' || feedback === 'already_answered') return;

        // Play click sound on submit
        audioService.playClick();

        setIsSubmitting(true);
        setFeedback(null);

        try {
            let isCorrect = false;

            if (isSolo && soloHandlers?.submitPhase3Answer) {
                // Solo mode: use soloHandlers (Phase 3 not used in solo mode anymore)
                soloHandlers.submitPhase3Answer(answer.trim());
                isCorrect = false; // This path is deprecated
            } else {
                // Multiplayer mode: use gameService
                const result = await submitPhase3Answer(roomCode, playerId, answer.trim());
                if (result.alreadyAnswered) {
                    setFeedback('already_answered');
                    setIsSubmitting(false);
                    return;
                }
                isCorrect = result.isCorrect;
            }

            if (isCorrect) {
                setFeedback('correct');
                // Answer will be cleared by the useEffect when question changes
            } else {
                setFeedback('incorrect');
                // Don't clear answer on incorrect - let user modify it
            }
        } catch (error) {
            console.error('[Phase3] Submit error:', error);
            setFeedback('incorrect');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Team info
    const TeamIcon = playerTeam === 'spicy' ? Flame : Candy;
    const teamColor = playerTeam === 'spicy' ? 'text-red-500' : 'text-pink-400';
    const teamBg = playerTeam === 'spicy' ? 'bg-red-500/10' : 'bg-pink-500/10';
    const teamBorder = playerTeam === 'spicy' ? 'border-red-500/30' : 'border-pink-500/30';

    // If finished, show completion state
    if (isFinished) {
        return null; // Parent component will show Phase3Spectator
    }

    // Validate that question exists and has text
    if (!currentQuestion || !currentQuestion.question) {
        return (
            <div className="text-center text-white">
                <p>{t('phase3.noMoreQuestions')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4">
            {/* Progress Header */}
            <div className={`w-full ${teamBg} rounded-2xl p-4 mb-6 border ${teamBorder}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TeamIcon className={`w-8 h-8 ${teamColor}`} />
                        <div>
                            <h3 className={`font-bold ${teamColor}`}>{theme.title}</h3>
                            <p className="text-white/60 text-sm">
                                {t('phase3.question')} {currentQuestionIndex + 1} / {theme.questions.length}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                            timeLeft <= 10 ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/80'
                        }`}>
                            <Clock className={`w-4 h-4 ${timeLeft <= 10 && !prefersReducedMotion ? 'animate-pulse' : ''}`} />
                            <span className="font-mono font-bold text-lg">
                                {t('phase3.timeRemaining', { seconds: timeLeft })}
                            </span>
                        </div>
                        {/* Score */}
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            <span className="text-2xl font-bold text-white">{teamProgress.score}</span>
                        </div>
                    </div>
                </div>

                {/* Progress dots - larger for better visibility */}
                <div className="flex gap-2 mt-3">
                    {theme.questions.map((_, idx) => {
                        const answeredBy = getAnsweredBy(idx);
                        const isCurrent = idx === currentQuestionIndex;
                        return (
                            <div
                                key={idx}
                                className={`flex-1 h-3 md:h-4 rounded-full transition-all ${
                                    answeredBy
                                        ? 'bg-green-500'
                                        : isCurrent
                                        ? `bg-yellow-400 ${prefersReducedMotion ? '' : 'animate-pulse'}`
                                        : 'bg-white/20'
                                }`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                key={currentQuestionIndex}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                className="w-full bg-white rounded-3xl p-8 shadow-2xl"
            >
                <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center select-none">
                    {currentQuestion.question || '[Question manquante]'}
                </h2>

                {/* Answer Input Form */}
                <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            data-cursor-target="phase3:input"
                            type="text"
                            value={answer}
                            onChange={(e) => {
                                const newValue = e.target.value.slice(0, MAX_ANSWER_LENGTH);
                                setAnswer(newValue);
                                updateTypingDebounced(newValue);
                            }}
                            placeholder={t('phase3.typeAnswer')}
                            disabled={isSubmitting || feedback === 'correct' || feedback === 'incorrect' || feedback === 'already_answered' || timeLeft === 0}
                            autoFocus
                            maxLength={MAX_ANSWER_LENGTH}
                            aria-label={t('phase3.typeAnswer')}
                            aria-describedby="answer-hint"
                            className={`w-full px-6 py-4 pr-16 text-xl rounded-2xl border-2 transition-all outline-none ${
                                feedback === 'correct'
                                    ? 'border-green-500 bg-green-50 text-green-800'
                                    : feedback === 'incorrect'
                                    ? 'border-red-400 bg-red-50 text-red-800'
                                    : feedback === 'already_answered'
                                    ? 'border-orange-400 bg-orange-50 text-orange-800'
                                    : timeLeft === 0
                                    ? 'border-slate-300 bg-slate-100 text-slate-500'
                                    : 'border-slate-200 focus:border-yellow-400 text-slate-800'
                            }`}
                        />

                        {/* Submit Button */}
                        <button
                            data-cursor-target="phase3:submit"
                            type="submit"
                            disabled={!answer.trim() || isSubmitting || feedback === 'correct' || feedback === 'incorrect' || feedback === 'already_answered' || timeLeft === 0}
                            aria-label={t('phase3.submitAnswer')}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${
                                !answer.trim() || isSubmitting || feedback === 'correct' || feedback === 'incorrect' || feedback === 'already_answered' || timeLeft === 0
                                    ? 'bg-slate-200 text-slate-400'
                                    : 'bg-yellow-400 hover:bg-yellow-300 text-slate-800'
                            }`}
                        >
                            {isSubmitting ? (
                                <FoodLoader size="sm" variant={playerTeam === 'spicy' ? 'spicy' : 'sweet'} />
                            ) : feedback === 'correct' ? (
                                <Check className="w-6 h-6 text-green-600" />
                            ) : (
                                <Send className="w-6 h-6" />
                            )}
                        </button>
                    </div>

                    {/* Character counter and hint */}
                    <div id="answer-hint" className="flex justify-between text-xs text-slate-500 px-2">
                        <span>{t('phase3.exactMatch')}</span>
                        <span className={answer.length >= MAX_ANSWER_LENGTH ? 'text-red-500 font-bold' : ''}>
                            {answer.length}/{MAX_ANSWER_LENGTH}
                        </span>
                    </div>
                </form>

                {/* Teammates typing indicator - only in multiplayer */}
                {!isSolo && teammatesTyping.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                    >
                        {teammatesTyping.map(({ player, text }) => (
                            <div
                                key={player.id}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm"
                            >
                                <span className="font-medium text-slate-600">{player.name}:</span>
                                <span className="text-slate-500 italic truncate flex-1">{text}</span>
                                <span className="text-slate-400 text-xs">{t('phase3.typing', { defaultValue: '...' })}</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Feedback Messages */}
                <AnimatePresence mode="wait">
                    {feedback === 'correct' && (
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                            className="mt-4 p-4 bg-green-100 rounded-xl text-center"
                            role="alert"
                            aria-live="polite"
                        >
                            <div className="flex items-center justify-center gap-2 text-green-700 font-bold">
                                <Check className="w-5 h-5" aria-hidden="true" />
                                {t('phase3.correctAnswer')}
                            </div>
                        </motion.div>
                    )}

                    {feedback === 'incorrect' && (
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                            className="mt-4 p-4 bg-red-100 rounded-xl text-center"
                            role="alert"
                            aria-live="polite"
                        >
                            <div className="flex items-center justify-center gap-2 text-red-700 font-bold">
                                <X className="w-5 h-5" aria-hidden="true" />
                                {t('phase3.incorrectLocked')}
                            </div>
                        </motion.div>
                    )}

                    {feedback === 'already_answered' && (
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                            className="mt-4 p-4 bg-orange-100 rounded-xl text-center"
                            role="alert"
                            aria-live="polite"
                        >
                            <div className="flex items-center justify-center gap-2 text-orange-700 font-bold">
                                <Users className="w-5 h-5" aria-hidden="true" />
                                {t('phase3.teammateAnswered')}
                            </div>
                        </motion.div>
                    )}

                    {timeLeft === 0 && !feedback && (
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                            className="mt-4 p-4 bg-slate-200 rounded-xl text-center"
                            role="alert"
                            aria-live="polite"
                        >
                            <div className="flex items-center justify-center gap-2 text-slate-700 font-bold">
                                <Clock className="w-5 h-5" aria-hidden="true" />
                                {t('phase3.timeUp')}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Other Team Progress (small indicator) - only in multiplayer */}
            {!isSolo && otherTeamProgress && (
                <div className="mt-6 text-white/50 text-sm flex items-center gap-2">
                    {playerTeam === 'spicy' ? (
                        <Candy className="w-4 h-4 text-pink-400" />
                    ) : (
                        <Flame className="w-4 h-4 text-red-500" />
                    )}
                    <span>
                        {t('phase3.otherTeamProgress', {
                            question: otherTeamProgress.currentQuestionIndex + 1,
                            total: 5,
                            score: otherTeamProgress.score,
                        })}
                    </span>
                </div>
            )}

            {/* Answered By History - only in multiplayer (no teammates in solo) */}
            {!isSolo && (
                <div className="mt-6 w-full">
                    <div className="flex flex-wrap gap-2 justify-center">
                        {Array.from({ length: currentQuestionIndex }).map((_, idx) => {
                            const answeredBy = getAnsweredBy(idx);
                            if (!answeredBy) return null;
                            return (
                                <div
                                    key={idx}
                                    className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full flex items-center gap-1"
                                >
                                    <span>Q{idx + 1}:</span>
                                    <span className="font-bold">{answeredBy.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
