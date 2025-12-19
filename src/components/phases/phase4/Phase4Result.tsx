import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, X, Check, Sparkles } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { getTeamBgColor } from '../../../utils/teamColors';
import { bouncySpring, durations } from '../../../animations';
import type { Phase4Question } from '../../../services/gameService';
import type { Team } from '../../../types/gameTypes';

interface WinnerInfo {
    playerId: string;
    name: string;
    team: Team;
}

interface Phase4ResultProps {
    question: Phase4Question;
    winner: WinnerInfo | null;
    myAnswer: { answer: number; timestamp: number } | undefined;
}

export function Phase4Result({
    question,
    winner,
    myAnswer
}: Phase4ResultProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const hasPlayedAudioRef = useRef(false);

    const correctIndex = question.correctIndex;
    const correctOption = question.options[correctIndex];
    const myAnswerCorrect = myAnswer?.answer === correctIndex;

    // Play audio feedback once when result is shown
    useEffect(() => {
        if (hasPlayedAudioRef.current) return;
        hasPlayedAudioRef.current = true;

        if (myAnswer !== undefined) {
            if (myAnswerCorrect) {
                audioService.playSuccess();
            } else {
                audioService.playError();
            }
        }

        // Winner celebration (if this player won)
        if (winner) {
            audioService.playWinRound();
        }
    }, [myAnswer, myAnswerCorrect, winner]);

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-6 max-h-screen overflow-y-auto w-full text-white">
            {/* Winner Display */}
            <AnimatePresence mode="wait">
                {winner ? (
                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                        transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                        className="flex flex-col items-center space-y-4"
                    >
                        <motion.div
                            animate={prefersReducedMotion ? {} : { rotate: [0, -10, 10, -5, 0] }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <Trophy className="w-16 h-16 text-yellow-400" aria-hidden="true" />
                        </motion.div>

                        <div
                            className="text-2xl font-bold text-yellow-400"
                            aria-live="polite"
                        >
                            {t('phase4.firstCorrect')}
                        </div>

                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, ...bouncySpring }}
                            className="text-4xl font-black"
                        >
                            {winner.name}
                        </motion.div>

                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, ...bouncySpring }}
                            className={`text-xl font-bold px-4 py-2 rounded-full ${getTeamBgColor(winner.team)}`}
                        >
                            {t('phase4.pointsWon', { points: 2 })}
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: durations.normal }}
                        className="flex flex-col items-center space-y-4"
                    >
                        <X className="w-16 h-16 text-gray-400" aria-hidden="true" />
                        <div
                            className="text-2xl font-bold text-gray-400"
                            aria-live="polite"
                        >
                            {t('phase4.noWinner')}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Correct Answer Card */}
            <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: durations.normal }}
                className="bg-slate-800/80 p-6 rounded-2xl w-full max-w-lg text-center border border-green-500/50"
            >
                <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                    {t('phase4.correctAnswerWas')}
                </div>
                <div className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
                    <Check className="w-6 h-6" aria-hidden="true" />
                    {correctOption}
                </div>
            </motion.div>

            {/* Anecdote (if available) */}
            {question.anecdote && (
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: durations.normal }}
                    className="bg-yellow-500/20 p-4 rounded-xl w-full max-w-lg text-center border border-yellow-500/50"
                >
                    <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-yellow-100 italic">{question.anecdote}</p>
                </motion.div>
            )}

            {/* Player's Own Answer Feedback */}
            {myAnswer !== undefined && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: durations.normal }}
                    className="text-center text-gray-400"
                    aria-live="polite"
                >
                    {t('phase4.youAnswered')}:{' '}
                    <span className={myAnswerCorrect ? 'text-green-400 font-bold' : 'text-red-400'}>
                        {question.options[myAnswer.answer]}
                    </span>
                </motion.div>
            )}
        </div>
    );
}
