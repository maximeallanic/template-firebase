import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, type Phase5Question, nextPhase5MemoryQuestion, setPhase5State } from '../../../services/gameService';
import { Brain, Clock, ChevronRight, Lightbulb } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { markQuestionAsSeen } from '../../../services/historyService';
import { organicEase, durations } from '../../../animations';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface Phase5MemorizingProps {
    room: Room;
    isHost: boolean;
}

const MEMORIZATION_TIME_MS = 10000; // 10 seconds per question

export function Phase5Memorizing({ room, isHost }: Phase5MemorizingProps) {
    const { t } = useTranslation(['game-ui', 'common', 'game-content']);
    const prefersReducedMotion = useReducedMotion();
    const [timeLeft, setTimeLeft] = useState(MEMORIZATION_TIME_MS);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentIdx = room.state.phase5QuestionIndex || 0;
    const timerStart = room.state.phase5TimerStart || Date.now();

    // Get questions list
    const defaultQuestions = t('game-content:phase5.questions', { returnObjects: true }) as Phase5Question[];
    const questionsList: Phase5Question[] = (room.customQuestions?.phase5 as Phase5Question[]) || defaultQuestions;
    const currentQ = questionsList[currentIdx];
    const totalQuestions = questionsList.length;
    const isLastQuestion = currentIdx >= totalQuestions - 1;

    // Calculate remaining time based on server timestamp
    useEffect(() => {
        const updateTimer = () => {
            const elapsed = Date.now() - timerStart;
            const remaining = Math.max(0, MEMORIZATION_TIME_MS - elapsed);
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [timerStart]);

    // Track question as seen
    useEffect(() => {
        if (currentQ?.question) {
            markQuestionAsSeen('', currentQ.question);
        }
    }, [currentQ?.question]);

    // Auto-advance when timer expires (host only)
    const handleAdvance = useCallback(async () => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        audioService.playClick();

        try {
            if (isLastQuestion) {
                // Move to answering phase
                await setPhase5State(room.code, 'answering');
            } else {
                // Move to next question
                await nextPhase5MemoryQuestion(room.code, totalQuestions);
            }
        } catch (error) {
            console.error('Failed to advance:', error);
        } finally {
            // Reset transitioning after a short delay
            setTimeout(() => setIsTransitioning(false), 500);
        }
    }, [room.code, isLastQuestion, totalQuestions, isTransitioning]);

    // Auto-advance when timer hits 0 (host only)
    useEffect(() => {
        if (isHost && timeLeft === 0 && !isTransitioning) {
            handleAdvance();
        }
    }, [isHost, timeLeft, handleAdvance, isTransitioning]);

    // Sound effect on new question
    useEffect(() => {
        audioService.playJoin();
    }, [currentIdx]);

    // Timer warning sound
    useEffect(() => {
        if (timeLeft <= 3000 && timeLeft > 2900) {
            audioService.playTimerTick();
        }
    }, [timeLeft]);

    const progressPercent = ((MEMORIZATION_TIME_MS - timeLeft) / MEMORIZATION_TIME_MS) * 100;
    const secondsLeft = Math.ceil(timeLeft / 1000);

    if (!currentQ) {
        return null;
    }

    return (
        <div className="flex flex-col h-full w-full bg-gradient-to-b from-slate-900 to-black text-white relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 z-10">
                <motion.div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.1, ease: 'linear' }}
                />
            </div>

            {/* Question Counter */}
            <div className="absolute top-4 left-4 z-10">
                <div className="bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold">
                    {currentIdx + 1} / {totalQuestions}
                </div>
            </div>

            {/* Timer */}
            <div className="absolute top-4 right-4 z-10">
                <motion.div
                    animate={prefersReducedMotion
                        ? { color: secondsLeft <= 3 ? '#ef4444' : '#fbbf24' }
                        : {
                            scale: secondsLeft <= 3 ? [1, 1.1, 1] : 1,
                            color: secondsLeft <= 3 ? '#ef4444' : '#fbbf24',
                        }
                    }
                    transition={{ duration: 0.5, repeat: secondsLeft <= 3 && !prefersReducedMotion ? Infinity : 0 }}
                    className="bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2"
                >
                    <Clock className="w-5 h-5" />
                    <span className="text-2xl font-black tabular-nums">{secondsLeft}s</span>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4"
                >
                    <Brain className="w-16 h-16 text-yellow-500" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-yellow-500/60 text-lg font-bold uppercase tracking-[0.3em] mb-6"
                >
                    {t('phase5.memorize')}
                </motion.div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: durations.fast, ease: organicEase }}
                        className="w-full max-w-3xl"
                    >
                        {/* Question Card */}
                        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                            {/* Question */}
                            <div className="p-8 border-b border-white/5">
                                <div className="text-slate-400 text-sm uppercase tracking-wider mb-3">
                                    {t('phase5.question')} {currentIdx + 1}
                                </div>
                                <p className="text-3xl md:text-4xl font-bold leading-tight">
                                    {currentQ.question}
                                </p>
                            </div>

                            {/* Answer */}
                            <div className="p-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                                <div className="text-yellow-400 text-sm uppercase tracking-wider mb-3">
                                    {t('phase5.answer')}
                                </div>
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-4xl md:text-5xl font-black text-yellow-400"
                                >
                                    {currentQ.answer}
                                </motion.p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Manual Advance Button (Host only, for accessibility/testing) */}
                {isHost && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={handleAdvance}
                        disabled={isTransitioning}
                        className="mt-8 flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                    >
                        {isLastQuestion ? t('phase5.startAnsweringPhase') : t('phase5.nextQuestionManual')}
                        <ChevronRight className="w-5 h-5" />
                    </motion.button>
                )}
            </div>

            {/* Cognitive Hint */}
            {!prefersReducedMotion && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="flex items-center justify-center gap-2 text-yellow-400/80 text-sm mb-2"
                >
                    <Lightbulb className="w-4 h-4" />
                    <span>{t('phase5.memorizeHint')}</span>
                </motion.div>
            )}
            {prefersReducedMotion && (
                <div className="flex items-center justify-center gap-2 text-yellow-400/80 text-sm mb-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>{t('phase5.memorizeHint')}</span>
                </div>
            )}

            {/* Bottom Reminder */}
            <div className="p-6 text-center">
                <p className="text-slate-500 text-sm">
                    {isLastQuestion
                        ? t('phase5.lastQuestionReminder')
                        : t('phase5.memorizeReminder', { remaining: totalQuestions - currentIdx - 1 })
                    }
                </p>
            </div>
        </div>
    );
}
