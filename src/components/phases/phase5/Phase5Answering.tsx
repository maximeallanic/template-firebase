import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, type Team, submitPhase5Answer, checkPhase5AnswerCompletion } from '../../../services/gameService';
import { Send, Check } from 'lucide-react';
import { FoodLoader } from '../../ui/FoodLoader';
import { audioService } from '../../../services/audioService';
import { useHaptic } from '../../../hooks/useHaptic';
import { organicEase, durations } from '../../../animations';

interface Phase5AnsweringProps {
    room: Room;
    currentPlayerId: string;
    currentPlayerTeam: Team;
}

export function Phase5Answering({ room, currentPlayerId, currentPlayerTeam }: Phase5AnsweringProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const haptic = useHaptic();
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const TOTAL_QUESTIONS = 10;

    // Get current answer index for my team
    const myTeamAnswers = room.state.phase5Answers?.[currentPlayerTeam] || [];
    const currentAnswerIndex = myTeamAnswers.length;
    const isFinished = currentAnswerIndex >= TOTAL_QUESTIONS;

    // Debug logging
    console.log('[Phase5Answering] Render:', {
        currentPlayerTeam,
        myTeamAnswersCount: myTeamAnswers.length,
        currentAnswerIndex,
        isFinished,
        phase5State: room.state.phase5State,
        phaseState: room.state.phaseState,
    });

    // Focus input on mount and after each submission
    useEffect(() => {
        if (!isFinished) {
            // Delay to wait for the AnimatePresence entry animation to complete (durations.fast = 200ms)
            const timeoutId = setTimeout(() => {
                inputRef.current?.focus();
            }, 250);
            return () => clearTimeout(timeoutId);
        }
    }, [currentAnswerIndex, isFinished]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[Phase5Answering] handleSubmit called:', {
            currentAnswer: currentAnswer.substring(0, 20),
            isSubmitting,
            isFinished,
            currentAnswerIndex,
        });

        if (!currentAnswer.trim() || isSubmitting || isFinished) {
            console.log('[Phase5Answering] Early return - conditions not met');
            return;
        }

        setIsSubmitting(true);
        audioService.playClick();
        haptic.tap();

        try {
            console.log('[Phase5Answering] Calling submitPhase5Answer...');
            const result = await submitPhase5Answer(room.code, currentPlayerId, currentAnswer.trim(), currentPlayerTeam);
            console.log('[Phase5Answering] submitPhase5Answer returned:', result);
            setCurrentAnswer('');

            // Check if both teams are done
            console.log('[Phase5Answering] Calling checkPhase5AnswerCompletion...');
            await checkPhase5AnswerCompletion(room.code);
            console.log('[Phase5Answering] checkPhase5AnswerCompletion done');

            audioService.playSuccess();
            haptic.success();
        } catch (error) {
            console.error('[Phase5Answering] Failed to submit answer:', error);
            audioService.playError();
            haptic.error();
        } finally {
            setIsSubmitting(false);
            console.log('[Phase5Answering] Submission complete, isSubmitting set to false');
        }
    };

    // Get opponent team progress
    const opponentTeam = currentPlayerTeam === 'spicy' ? 'sweet' : 'spicy';
    const opponentAnswers = room.state.phase5Answers?.[opponentTeam] || [];
    const opponentProgress = opponentAnswers.length;

    // If finished, show waiting state
    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full p-6 text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: durations.medium, ease: organicEase }}
                    className="text-center"
                >
                    <Check className="w-24 h-24 text-green-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-black mb-4">{t('phase5.allAnswersSubmitted')}</h2>
                    <p className="text-slate-400 text-xl mb-8">
                        {t('phase5.waitingForOpponent')}
                    </p>

                    {/* Progress comparison */}
                    <div className="bg-slate-800/60 rounded-2xl p-6 backdrop-blur-sm max-w-md mx-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div className={`text-center ${currentPlayerTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}`}>
                                <div className="text-3xl font-black">{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}</div>
                                <div className="text-sm opacity-70">{t('phase5.yourTeam')}</div>
                            </div>
                            <div className={`text-center ${opponentTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}`}>
                                <div className="text-3xl font-black">{opponentProgress}/{TOTAL_QUESTIONS}</div>
                                <div className="text-sm opacity-70">{t('phase5.opponentTeam')}</div>
                            </div>
                        </div>

                        {opponentProgress < TOTAL_QUESTIONS && (
                            <div className="mt-4 flex items-center justify-center gap-3 text-slate-500">
                                <FoodLoader size="sm" variant={opponentTeam === 'spicy' ? 'spicy' : 'sweet'} />
                                <span>{t('phase5.opponentStillAnswering')}</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full p-6 text-white">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: durations.medium, ease: organicEase }}
                className="text-center mb-6"
            >
                <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
                    {t('phase5.recallPhase')}
                </h1>
                <p className="text-slate-400">
                    {t('phase5.typeAnswersInOrder')}
                </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-8">
                {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`w-3 h-3 rounded-full transition-colors ${
                            idx < currentAnswerIndex
                                ? 'bg-green-500'
                                : idx === currentAnswerIndex
                                    ? 'bg-yellow-500 animate-pulse'
                                    : 'bg-slate-700'
                        }`}
                    />
                ))}
            </div>

            {/* Current Answer Input */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentAnswerIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: durations.fast, ease: organicEase }}
                        className="w-full max-w-xl"
                    >
                        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                            <div className="text-center mb-6">
                                <span className="text-yellow-500 text-sm uppercase tracking-wider font-bold">
                                    {t('phase5.answerNumber', { number: currentAnswerIndex + 1, total: TOTAL_QUESTIONS })}
                                </span>
                                <h2 className="text-2xl font-bold mt-2">
                                    {t('phase5.whatWasAnswerQuestion', { number: currentAnswerIndex + 1 })}
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <input
                                        ref={inputRef}
                                        data-cursor-target="phase5:input"
                                        type="text"
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                        placeholder={t('phase5.typeAnswer')}
                                        disabled={isSubmitting}
                                        className="w-full px-6 py-4 bg-slate-900/80 border-2 border-slate-600 rounded-xl text-2xl font-bold text-center focus:border-yellow-500 focus:outline-none transition-colors disabled:opacity-50"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"
                                    />
                                </div>

                                <motion.button
                                    data-cursor-target="phase5:submit"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={!currentAnswer.trim() || isSubmitting}
                                    className={`
                                        w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3
                                        transition-all duration-200
                                        ${isSubmitting
                                            ? 'bg-slate-700 text-white cursor-wait'
                                            : currentAnswer.trim()
                                                ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        }
                                    `}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <FoodLoader size="md" />
                                            {t('phase5.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-6 h-6" />
                                            {t('phase5.submitAnswer')}
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Previously submitted answers */}
                {myTeamAnswers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-8 w-full max-w-xl"
                    >
                        <div className="text-slate-500 text-sm mb-2 text-center">
                            {t('phase5.previousAnswers')}
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {myTeamAnswers.map((answerData, idx) => {
                                // Handle both old string format and new { answer, isCorrect } format
                                const answerText = typeof answerData === 'string' ? answerData : answerData?.answer;
                                return (
                                    <div
                                        key={idx}
                                        className="bg-slate-800/40 px-3 py-1 rounded-lg text-sm text-slate-400"
                                    >
                                        <span className="text-slate-600 mr-1">{idx + 1}.</span>
                                        {answerText}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom Progress Comparison */}
            <div className="mt-6 flex justify-center gap-8 text-sm">
                <div className={`text-center ${currentPlayerTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}`}>
                    <div className="font-bold">{t('phase5.you')}</div>
                    <div className="text-2xl font-black">{currentAnswerIndex}/{TOTAL_QUESTIONS}</div>
                </div>
                <div className="text-slate-600">vs</div>
                <div className={`text-center ${opponentTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}`}>
                    <div className="font-bold">{t('phase5.opponent')}</div>
                    <div className="text-2xl font-black">{opponentProgress}/{TOTAL_QUESTIONS}</div>
                </div>
            </div>
        </div>
    );
}
