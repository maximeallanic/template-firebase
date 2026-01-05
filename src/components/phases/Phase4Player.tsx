import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { FoodLoader } from '../ui/FoodLoader';
import type { Room, Phase4Question as Phase4QuestionType } from '../../services/gameService';
import { submitPhase4Answer, handlePhase4Timeout, nextPhase4Question } from '../../services/gameService';
import { usePhaseTransition } from '../../hooks/usePhaseTransition';
import { markQuestionAsSeen } from '../../services/historyService';
import { audioService } from '../../services/audioService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHaptic } from '../../hooks/useHaptic';
import { getTransitionDuration } from '../../animations';
import { PHASE4_QUESTIONS } from '../../data/phase4';
import type { SoloPhaseHandlers } from '../../types/soloTypes';

// Modular components
import { Phase4Timer } from './phase4/Phase4Timer';
import { Phase4Question } from './phase4/Phase4Question';
import { Phase4Options } from './phase4/Phase4Options';
import { Phase4Result } from './phase4/Phase4Result';

// Constants
const QUESTION_TIMER = 15;
const RESULT_DISPLAY_TIME = 5000;
const RESULT_WITH_ANECDOTE_TIME = 7000;

interface Phase4PlayerProps {
    room: Room;
    playerId: string;
    isHost: boolean;
    mode?: 'solo' | 'multiplayer';
    soloHandlers?: SoloPhaseHandlers;
}

export function Phase4Player({ room, playerId, isHost, mode = 'multiplayer', soloHandlers }: Phase4PlayerProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const haptic = useHaptic();
    const isSolo = mode === 'solo';

    // Use centralized phase transition hook for multiplayer transitions
    const { showPhaseResults } = usePhaseTransition({
        room,
        isHost,
        isSolo,
    });

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

    // Immediate wrong answer feedback state
    const [wrongFeedbackIndex, setWrongFeedbackIndex] = useState<number | null>(null);

    // Local state to immediately lock answers on submit (prevents race condition)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Result reveal animation phase: 'idle' → 'shaking' → 'revealing'
    const [resultRevealPhase, setResultRevealPhase] = useState<'idle' | 'shaking' | 'revealing'>('idle');

    // Check if current player has answered
    const myAnswer = phase4Answers?.[playerId];
    const hasAnswered = myAnswer !== undefined;

    // Count how many players have answered
    const realPlayers = Object.values(room.players).filter(p => p.isOnline && !p.id.startsWith('mock_'));
    const answeredCount = Object.keys(phase4Answers || {}).filter(id => !id.startsWith('mock_')).length;
    const totalPlayers = realPlayers.length;

    // Track question as seen when displayed
    useEffect(() => {
        if (currentQuestion?.text) {
            markQuestionAsSeen('', currentQuestion.text);
        }
    }, [currentQuestion?.text]);

    // Reset interaction states when question changes (allows answering new question)
    useEffect(() => {
        setIsSubmitting(false);
        setWrongFeedbackIndex(null);
        setResultRevealPhase('idle'); // Reset reveal phase on new question
    }, [currentQuestionIdx]);

    // Result reveal animation sequence: first shake wrong answer, then reveal correct
    useEffect(() => {
        if (phase4State === 'result' && myAnswer !== undefined) {
            const isWrongAnswer = currentQuestion && myAnswer.answer !== currentQuestion.correctIndex;

            if (isWrongAnswer && !prefersReducedMotion) {
                // Step 1: Show shake animation on wrong answer
                setResultRevealPhase('shaking');

                // Step 2: After shake duration, reveal the correct answer
                const shakeDuration = getTransitionDuration('wrongFeedback', false);
                const timer = setTimeout(() => {
                    setResultRevealPhase('revealing');
                }, shakeDuration);

                return () => clearTimeout(timer);
            } else {
                // No wrong answer or reduced motion: go directly to revealing
                setResultRevealPhase('revealing');
            }
        } else if (phase4State === 'result' && myAnswer === undefined) {
            // Player didn't answer - go directly to revealing
            setResultRevealPhase('revealing');
        } else if (phase4State !== 'result') {
            setResultRevealPhase('idle');
        }
    }, [phase4State, myAnswer, currentQuestion, prefersReducedMotion]);

    // Refs for timeout handling to avoid unnecessary timer recreation
    const isHostRef = useRef(isHost);
    const roomCodeRef = useRef(room.code);
    const isSoloRef = useRef(isSolo);
    const soloHandlersRef = useRef(soloHandlers);

    // Keep refs updated
    useEffect(() => {
        isHostRef.current = isHost;
        roomCodeRef.current = room.code;
        isSoloRef.current = isSolo;
        soloHandlersRef.current = soloHandlers;
    }, [isHost, room.code, isSolo, soloHandlers]);

    // Timer countdown (minimal dependencies for performance)
    useEffect(() => {
        if (phase4State !== 'questioning' || !phase4QuestionStartTime) {
            setTimeRemaining(QUESTION_TIMER);
            hasHandledTimeoutRef.current = false;
            return;
        }

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - phase4QuestionStartTime) / 1000);
            const remaining = Math.max(0, QUESTION_TIMER - elapsed);
            setTimeRemaining(remaining);

            // Handle timeout using refs to avoid dependency on changing values
            if (remaining === 0 && !hasHandledTimeoutRef.current) {
                if (isSoloRef.current && soloHandlersRef.current) {
                    hasHandledTimeoutRef.current = true;
                    soloHandlersRef.current.handlePhase4Timeout();
                } else if (isHostRef.current) {
                    hasHandledTimeoutRef.current = true;
                    handlePhase4Timeout(roomCodeRef.current);
                }
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [phase4State, phase4QuestionStartTime]); // Uses refs to avoid recreating timer unnecessarily

    // Auto-advance after result display (solo always auto-advances, multiplayer host only)
    useEffect(() => {
        if (phase4State !== 'result') return;
        if (!isSolo && !isHost) return;

        const delay = currentQuestion?.anecdote ? RESULT_WITH_ANECDOTE_TIME : RESULT_DISPLAY_TIME;
        const timeout = setTimeout(() => {
            if (isSolo && soloHandlers) {
                soloHandlers.nextPhase4Question();
            } else {
                nextPhase4Question(room.code);
            }
        }, delay);

        return () => clearTimeout(timeout);
    }, [phase4State, isHost, isSolo, soloHandlers, room.code, currentQuestion?.anecdote]);

    // Auto-advance to results when phase 4 finishes in solo mode
    useEffect(() => {
        if (isFinished && isSolo && soloHandlers) {
            soloHandlers.advanceToNextPhase();
        }
    }, [isFinished, isSolo, soloHandlers]);

    // Auto-advance to Phase 5 when Phase 4 finishes in multiplayer mode
    useEffect(() => {
        if (isFinished && !isSolo && isHost) {
            const delay = RESULT_DISPLAY_TIME;
            const timer = setTimeout(() => {
                showPhaseResults();
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isFinished, isSolo, isHost, showPhaseResults]);

    // Handle answer submission with parallel animations
    const handleAnswerClick = useCallback(async (answerIndex: number) => {
        // Prevent interaction during wrong feedback animation or if already submitting
        if (isSubmitting || hasAnswered || phase4State !== 'questioning' || wrongFeedbackIndex !== null) return;
        // In multiplayer, need team. In solo, always allowed
        if (!isSolo && !team) return;

        // Lock immediately to prevent double-clicks (fixes race condition)
        setIsSubmitting(true);
        haptic.buzzer();

        // Check if answer is wrong BEFORE submitting (for immediate visual feedback)
        const isWrongAnswer = currentQuestion && answerIndex !== currentQuestion.correctIndex;

        // Create submit promise (optimistic - starts immediately)
        const submitPromise = (async () => {
            if (isSolo && soloHandlers) {
                soloHandlers.submitPhase4Answer(answerIndex);
                return { success: true };
            } else {
                try {
                    await submitPhase4Answer(room.code, playerId, answerIndex);
                    return { success: true };
                } catch (error) {
                    console.error('Phase4 submit error:', error);
                    return { success: false, error };
                }
            }
        })();

        if (isWrongAnswer && !prefersReducedMotion) {
            // Show immediate wrong answer feedback
            setWrongFeedbackIndex(answerIndex);
            audioService.playError();
            haptic.error();

            // Animation and network call run in PARALLEL (no blocking)
            const feedbackDuration = getTransitionDuration('wrongFeedback', prefersReducedMotion);
            await Promise.all([
                new Promise<void>(resolve => setTimeout(resolve, feedbackDuration)),
                submitPromise
            ]);

            setWrongFeedbackIndex(null);
        } else {
            // No animation needed, just submit
            await submitPromise;
        }
    }, [isSubmitting, hasAnswered, phase4State, team, room.code, playerId, isSolo, soloHandlers, currentQuestion, prefersReducedMotion, wrongFeedbackIndex, haptic]);

    // --- FINISHED VIEW ---
    // En mode solo, on ne montre pas cette vue car le rideau gère la transition vers results
    if (isFinished && isSolo) {
        return null; // Le rideau couvre l'écran pendant la transition
    }

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

                {/* Multiplayer mode: host starts Phase 5 */}
                {isHost && (
                    <motion.button
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => showPhaseResults()}
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
                        className="text-xl flex items-center gap-3"
                    >
                        <FoodLoader size="sm" />
                        {t('player.waitingForHost')}
                    </motion.p>
                )}
            </div>
        );
    }

    // --- RESULT VIEW ---
    // During 'shaking' phase: show options with shake animation on wrong answer
    if (phase4State === 'result' && resultRevealPhase === 'shaking') {
        return (
            <div className="flex flex-col items-center p-4 space-y-4 max-h-screen overflow-y-auto w-full text-white">
                {/* Header: Question info - hidden on mobile in solo (shown in header) */}
                <div className={`w-full max-w-lg justify-between items-center ${isSolo ? 'hidden md:flex' : 'flex'}`}>
                    <div className="text-gray-400 font-bold uppercase tracking-wider">
                        {t('phase4.questionNumber', { current: currentQuestionIdx + 1, total: totalQuestions })}
                    </div>
                </div>

                {/* Question Card */}
                <Phase4Question
                    question={currentQuestion.text}
                    questionNumber={currentQuestionIdx + 1}
                    totalQuestions={totalQuestions}
                />

                {/* MCQ Options with shake animation on wrong answer */}
                <Phase4Options
                    options={currentQuestion.options}
                    selectedAnswer={myAnswer?.answer}
                    onSelectAnswer={() => {}} // Disabled during result
                    disabled={true}
                    wrongFeedbackIndex={myAnswer?.answer} // Triggers shake animation
                />
            </div>
        );
    }

    // After 'shaking' phase: show the result
    if (phase4State === 'result' && resultRevealPhase === 'revealing') {
        return (
            <Phase4Result
                question={currentQuestion}
                winner={phase4Winner || null}
                myAnswer={myAnswer}
                isSolo={isSolo}
            />
        );
    }

    // --- QUESTIONING VIEW ---
    return (
        <div className="flex flex-col items-center p-4 space-y-4 max-h-screen overflow-y-auto w-full text-white">
            {/* Header: Question info + Timer */}
            <div className="w-full max-w-lg flex justify-between items-center">
                {/* Question number - hidden on mobile in solo (shown in header) */}
                <div className={`text-gray-400 font-bold uppercase tracking-wider ${isSolo ? 'hidden md:block' : ''}`}>
                    {t('phase4.questionNumber', { current: currentQuestionIdx + 1, total: totalQuestions })}
                </div>
                <Phase4Timer
                    timeRemaining={timeRemaining}
                    totalTime={QUESTION_TIMER}
                    isActive={phase4State === 'questioning'}
                />
            </div>

            {/* Question Card */}
            <Phase4Question
                question={currentQuestion.text}
                questionNumber={currentQuestionIdx + 1}
                totalQuestions={totalQuestions}
            />

            {/* MCQ Options */}
            <Phase4Options
                options={currentQuestion.options}
                selectedAnswer={myAnswer?.answer}
                onSelectAnswer={handleAnswerClick}
                disabled={hasAnswered || wrongFeedbackIndex !== null || isSubmitting}
                wrongFeedbackIndex={wrongFeedbackIndex}
            />

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
                    <div className="text-center text-gray-400 hidden md:block">
                        {t('phase4.selectAnswer')}
                    </div>
                )}

                {/* Player Answer Status - only show in multiplayer */}
                {!isSolo && (
                    <div className="mt-3 text-center text-sm text-gray-500">
                        {answeredCount === totalPlayers ? (
                            <span className="text-green-400">{t('phase4.everyoneAnswered')}</span>
                        ) : (
                            <span>{t('phase4.waitingForPlayers')} ({answeredCount}/{totalPlayers})</span>
                        )}
                    </div>
                )}
            </div>

            {/* Host Controls - only show in multiplayer */}
            {!isSolo && isHost && (
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
