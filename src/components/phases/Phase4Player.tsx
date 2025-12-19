import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import type { Room, Phase4Question as Phase4QuestionType } from '../../services/gameService';
import { submitPhase4Answer, handlePhase4Timeout, nextPhase4Question, showPhaseResults } from '../../services/gameService';
import { markQuestionAsSeen } from '../../services/historyService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { PHASE4_QUESTIONS } from '../../data/phase4';

// Modular components
import { Phase4Timer } from './phase4/Phase4Timer';
import { Phase4Question } from './phase4/Phase4Question';
import { Phase4Options } from './phase4/Phase4Options';
import { Phase4Result } from './phase4/Phase4Result';
import { Phase4Transition } from './phase4/Phase4Transition';

// Constants
const QUESTION_TIMER = 30;
const RESULT_DISPLAY_TIME = 5000;
const RESULT_WITH_ANECDOTE_TIME = 7000;

interface Phase4PlayerProps {
    room: Room;
    playerId: string;
    isHost: boolean;
}

export function Phase4Player({ room, playerId, isHost }: Phase4PlayerProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const prefersReducedMotion = useReducedMotion();

    const player = room.players[playerId];
    const team = player?.team;
    const { phase4State, currentPhase4QuestionIndex, phase4Answers, phase4Winner, phase4QuestionStartTime } = room.state;

    // Use custom AI-generated questions if available, fallback to static questions
    const questionsList: Phase4QuestionType[] = room.customQuestions?.phase4 || PHASE4_QUESTIONS;
    const totalQuestions = questionsList.length;

    const currentQuestionIdx = currentPhase4QuestionIndex ?? 0;
    const currentQuestion = questionsList[currentQuestionIdx];
    const isFinished = !currentQuestion;

    // Timer state
    const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIMER);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasHandledTimeoutRef = useRef(false);

    // Transition state
    const [showTransition, setShowTransition] = useState(false);
    const previousQuestionIdxRef = useRef<number | null>(null);

    // Check if current player has answered
    const myAnswer = phase4Answers?.[playerId];
    const hasAnswered = myAnswer !== undefined;

    // Count how many players have answered
    const realPlayers = Object.values(room.players).filter(p => p.isOnline && !p.id.startsWith('mock_'));
    const answeredCount = Object.keys(phase4Answers || {}).filter(id => !id.startsWith('mock_')).length;
    const totalPlayers = realPlayers.length;

    // Track question as seen when displayed
    useEffect(() => {
        if (currentQuestion?.question) {
            markQuestionAsSeen('', currentQuestion.question);
        }
    }, [currentQuestion?.question]);

    // Show transition when question index changes
    useEffect(() => {
        if (previousQuestionIdxRef.current !== null &&
            previousQuestionIdxRef.current !== currentQuestionIdx &&
            currentQuestion &&
            !prefersReducedMotion) {
            setShowTransition(true);
        }
        previousQuestionIdxRef.current = currentQuestionIdx;
    }, [currentQuestionIdx, currentQuestion, prefersReducedMotion]);

    // Timer countdown
    useEffect(() => {
        if (phase4State !== 'questioning' || !phase4QuestionStartTime || showTransition) {
            setTimeRemaining(QUESTION_TIMER);
            hasHandledTimeoutRef.current = false;
            return;
        }

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - phase4QuestionStartTime) / 1000);
            const remaining = Math.max(0, QUESTION_TIMER - elapsed);
            setTimeRemaining(remaining);

            // Host handles timeout
            if (remaining === 0 && isHost && !hasHandledTimeoutRef.current) {
                hasHandledTimeoutRef.current = true;
                handlePhase4Timeout(room.code);
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [phase4State, phase4QuestionStartTime, isHost, room.code, showTransition]);

    // Auto-advance after result display (host only)
    useEffect(() => {
        if (phase4State !== 'result' || !isHost) return;

        const delay = currentQuestion?.anecdote ? RESULT_WITH_ANECDOTE_TIME : RESULT_DISPLAY_TIME;
        const timeout = setTimeout(() => {
            nextPhase4Question(room.code);
        }, delay);

        return () => clearTimeout(timeout);
    }, [phase4State, isHost, room.code, currentQuestion?.anecdote]);

    // Handle answer submission
    const handleAnswerClick = useCallback(async (answerIndex: number) => {
        if (hasAnswered || phase4State !== 'questioning' || !team) return;
        await submitPhase4Answer(room.code, playerId, answerIndex);
    }, [hasAnswered, phase4State, team, room.code, playerId]);

    // Handle transition complete
    const handleTransitionComplete = useCallback(() => {
        setShowTransition(false);
    }, []);

    // --- TRANSITION VIEW ---
    if (showTransition && currentQuestion) {
        return (
            <Phase4Transition
                questionNumber={currentQuestionIdx + 1}
                totalQuestions={totalQuestions}
                onComplete={handleTransitionComplete}
            />
        );
    }

    // --- FINISHED VIEW ---
    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 max-h-screen overflow-y-auto w-full text-white">
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                    className="text-6xl mb-4"
                >
                    🎉
                </motion.div>
                <h2 className="text-4xl font-black text-center">{t('phase4.phaseComplete')}</h2>
                <div className="text-2xl text-gray-300">{t('phase4.laNote')}</div>

                {isHost && (
                    <motion.button
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => showPhaseResults(room.code)}
                        className="bg-yellow-500 hover:bg-yellow-400 px-8 py-4 rounded-xl text-xl font-bold shadow-lg flex items-center gap-2 text-black transition-colors"
                    >
                        <span>{t('host.startPhase5')}</span>
                        <ChevronRight className="w-6 h-6" aria-hidden="true" />
                    </motion.button>
                )}

                {!isHost && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl flex items-center gap-2"
                    >
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                        {t('player.waitingForHost')}
                    </motion.p>
                )}
            </div>
        );
    }

    // --- RESULT VIEW ---
    if (phase4State === 'result') {
        return (
            <Phase4Result
                question={currentQuestion}
                winner={phase4Winner || null}
                myAnswer={myAnswer}
            />
        );
    }

    // --- QUESTIONING VIEW ---
    return (
        <div className="flex flex-col items-center p-4 space-y-4 max-h-screen overflow-y-auto w-full text-white">
            {/* Header: Question info + Timer */}
            <div className="w-full max-w-lg flex justify-between items-center">
                <div className="text-gray-400 font-bold uppercase tracking-wider">
                    {t('phase4.questionNumber', { current: currentQuestionIdx + 1, total: totalQuestions })}
                </div>
                <Phase4Timer
                    timeRemaining={timeRemaining}
                    totalTime={QUESTION_TIMER}
                    isActive={phase4State === 'questioning'}
                />
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
                <Phase4Question
                    key={currentQuestionIdx}
                    question={currentQuestion.question}
                    questionNumber={currentQuestionIdx + 1}
                    totalQuestions={totalQuestions}
                />
            </AnimatePresence>

            {/* MCQ Options */}
            <AnimatePresence mode="wait">
                <Phase4Options
                    key={`options-${currentQuestionIdx}`}
                    options={currentQuestion.options}
                    selectedAnswer={myAnswer?.answer}
                    onSelectAnswer={handleAnswerClick}
                    disabled={hasAnswered}
                />
            </AnimatePresence>

            {/* Status Footer */}
            <div className="w-full max-w-lg pt-4 border-t border-slate-700">
                {hasAnswered ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-green-400 font-bold flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" aria-hidden="true" />
                        {t('phase4.answered')}
                    </motion.div>
                ) : (
                    <div className="text-center text-gray-400">
                        {t('phase4.selectAnswer')}
                    </div>
                )}

                {/* Player Answer Status */}
                <div className="mt-3 text-center text-sm text-gray-500">
                    {answeredCount === totalPlayers ? (
                        <span className="text-green-400">{t('phase4.everyoneAnswered')}</span>
                    ) : (
                        <span>{t('phase4.waitingForPlayers')} ({answeredCount}/{totalPlayers})</span>
                    )}
                </div>
            </div>

            {/* Host Controls */}
            {isHost && (
                <div className="w-full max-w-lg pt-4 border-t border-slate-700">
                    <button
                        onClick={() => nextPhase4Question(room.code)}
                        className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                    >
                        {t('host.skipNextQuestion')}
                    </button>
                </div>
            )}
        </div>
    );
}
