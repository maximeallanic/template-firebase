import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Send, Check, X, Flame, Candy, Trophy, Users } from 'lucide-react';
import { FoodLoader } from '../ui/FoodLoader';
import type { Team, Phase3Theme, Phase3TeamProgress, Player } from '../../types/gameTypes';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import { submitPhase3Answer } from '../../services/gameService';
import { audioService } from '../../services/audioService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { bouncySpring, durations } from '../../animations';

// Max character limit for answers
const MAX_ANSWER_LENGTH = 50;

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
}) => {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const isSolo = mode === 'solo';
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<AnswerFeedback>(null);
    const [lastQuestionIndex, setLastQuestionIndex] = useState(teamProgress.currentQuestionIndex);
    const hasPlayedFeedbackRef = useRef(false);

    const currentQuestionIndex = teamProgress.currentQuestionIndex;
    const currentQuestion = theme.questions[currentQuestionIndex];
    const isFinished = teamProgress.finished;

    // Get who answered each question
    const getAnsweredBy = useCallback((questionIndex: number): Player | null => {
        const answeredById = teamProgress.questionAnsweredBy?.[questionIndex];
        if (!answeredById) return null;
        return players[answeredById] || null;
    }, [teamProgress.questionAnsweredBy, players]);

    // Reset state when question changes (someone else answered correctly)
    useEffect(() => {
        if (currentQuestionIndex !== lastQuestionIndex) {
            setAnswer('');
            setFeedback(null);
            setIsSubmitting(false);
            setLastQuestionIndex(currentQuestionIndex);
            hasPlayedFeedbackRef.current = false;
        }
    }, [currentQuestionIndex, lastQuestionIndex]);

    // Clear feedback after a delay for incorrect answers
    useEffect(() => {
        if (feedback === 'incorrect') {
            const timer = setTimeout(() => {
                setFeedback(null);
                // Reset so the user can try again and get audio feedback
                hasPlayedFeedbackRef.current = false;
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

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

    // Play audio feedback when feedback changes
    useEffect(() => {
        if (hasPlayedFeedbackRef.current) return;

        if (feedback === 'correct') {
            hasPlayedFeedbackRef.current = true;
            audioService.playSuccess();
            audioService.playWinRound();
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
        if (!answer.trim() || isSubmitting || feedback === 'correct') return;

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

    if (!currentQuestion) {
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
                    <div className="text-right">
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
                    {currentQuestion.question}
                </h2>

                {/* Answer Input Form */}
                <form onSubmit={handleSubmit} className="space-y-2">
                    <div className="relative">
                        <input
                            data-cursor-target="phase3:input"
                            type="text"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
                            placeholder={t('phase3.typeAnswer')}
                            disabled={isSubmitting || feedback === 'correct' || feedback === 'already_answered'}
                            autoFocus
                            maxLength={MAX_ANSWER_LENGTH}
                            aria-label={t('phase3.typeAnswer')}
                            aria-describedby="answer-hint"
                            className={`w-full px-6 py-4 pr-16 text-xl rounded-2xl border-2 transition-all outline-none ${
                                feedback === 'correct'
                                    ? 'border-green-500 bg-green-50 text-green-800'
                                    : feedback === 'incorrect'
                                    ? 'border-red-400 bg-red-50'
                                    : feedback === 'already_answered'
                                    ? 'border-orange-400 bg-orange-50'
                                    : 'border-slate-200 focus:border-yellow-400'
                            }`}
                        />

                        {/* Submit Button */}
                        <button
                            data-cursor-target="phase3:submit"
                            type="submit"
                            disabled={!answer.trim() || isSubmitting || feedback === 'correct' || feedback === 'already_answered'}
                            aria-label={t('phase3.submitAnswer')}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all ${
                                !answer.trim() || isSubmitting || feedback === 'correct'
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
                                {t('phase3.incorrectTryAgain')}
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
