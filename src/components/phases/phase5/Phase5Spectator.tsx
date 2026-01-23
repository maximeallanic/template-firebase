import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, type Team, type Phase5State } from '../../../services/gameService';
import { AvatarIcon } from '../../AvatarIcon';
import { Eye, Clock, Brain, ChevronRight } from 'lucide-react';
import { FoodLoader } from '../../ui/FoodLoader';
import { organicEase, durations } from '../../../animations';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface Phase5SpectatorProps {
    room: Room;
    currentPlayerTeam: Team;
    phase5State: Phase5State;
}

export function Phase5Spectator({ room, currentPlayerTeam, phase5State }: Phase5SpectatorProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const prefersReducedMotion = useReducedMotion();

    const TOTAL_QUESTIONS = 10;

    // Get representative for my team
    const representativeId = room.state.phase5Representatives?.[currentPlayerTeam];
    const representative = representativeId ? room.players[representativeId] : null;

    // Get my team's answers
    const myTeamAnswers = room.state.phase5Answers?.[currentPlayerTeam] || [];
    const currentAnswerIndex = myTeamAnswers.length;

    // Get opponent team's progress
    const opponentTeam = currentPlayerTeam === 'spicy' ? 'sweet' : 'spicy';
    const opponentRepId = room.state.phase5Representatives?.[opponentTeam];
    const opponentRep = opponentRepId ? room.players[opponentRepId] : null;
    const opponentAnswers = room.state.phase5Answers?.[opponentTeam] || [];

    // === MEMORIZING STATE ===
    if (phase5State === 'memorizing') {
        const currentIdx = room.state.phase5QuestionIndex || 0;

        return (
            <div className="flex flex-col items-center justify-center min-h-full p-6 text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: durations.medium, ease: organicEase }}
                    className="text-center max-w-md"
                >
                    {/* Representative Info */}
                    {representative && (
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-sm px-6 py-3 rounded-2xl">
                                <AvatarIcon avatar={representative.avatar} size={32} />
                                <div className="text-left">
                                    <div className="font-bold text-lg">{representative.name}</div>
                                    <div className="text-sm text-slate-400">{t('phase5.yourChampion')}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Brain Icon */}
                    <motion.div
                        animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                        transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity }}
                        className="mb-6"
                    >
                        <Brain className="w-20 h-20 text-yellow-500 mx-auto" />
                    </motion.div>

                    {/* Status */}
                    <h2 className="text-3xl font-black mb-4">
                        {t('phase5.championMemorizing')}
                    </h2>

                    {/* Progress */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6">
                        <div className="flex items-center justify-center gap-3 text-yellow-500">
                            <Clock className="w-6 h-6" />
                            <span className="text-2xl font-bold">
                                {t('phase5.questionProgress', { current: currentIdx + 1, total: TOTAL_QUESTIONS })}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 h-3 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                initial={{ width: '0%' }}
                                animate={{ width: `${((currentIdx + 1) / TOTAL_QUESTIONS) * 100}%` }}
                                transition={{ duration: 0.5, ease: organicEase }}
                            />
                        </div>
                    </div>

                    <p className="text-slate-400">
                        {t('phase5.spectatorMemorizeHint')}
                    </p>
                </motion.div>
            </div>
        );
    }

    // === ANSWERING STATE ===
    if (phase5State === 'answering') {
        return (
            <div className="flex flex-col min-h-full p-6 text-white">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-6"
                >
                    <Eye className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
                        {t('phase5.watchingChampion')}
                    </h1>
                    {representative && (
                        <p className="text-slate-400">
                            {t('phase5.championIsAnswering', { name: representative.name })}
                        </p>
                    )}
                </motion.div>

                {/* Representative Card */}
                {representative && (
                    <div className="flex justify-center mb-8">
                        <div className={`
                            inline-flex items-center gap-4 px-6 py-4 rounded-2xl
                            ${currentPlayerTeam === 'spicy'
                                ? 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border border-red-500/30'
                                : 'bg-gradient-to-r from-pink-900/50 to-purple-900/50 border border-pink-500/30'
                            }
                        `}>
                            <AvatarIcon avatar={representative.avatar} size={48} />
                            <div>
                                <div className="font-bold text-xl">{representative.name}</div>
                                <div className="text-sm text-slate-400 flex items-center gap-2">
                                    <FoodLoader size="sm" variant={currentPlayerTeam === 'spicy' ? 'spicy' : 'sweet'} />
                                    {t('phase5.answering')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Live Answers Grid */}
                <div className="flex-1">
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center text-slate-500 text-sm uppercase tracking-wider mb-4">
                            {t('phase5.liveAnswers')}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: TOTAL_QUESTIONS }).map((_, idx) => {
                                const answerData = myTeamAnswers[idx];
                                // Handle both old string format and new { answer, isCorrect } format (#72)
                                const answer = typeof answerData === 'string' ? answerData : answerData?.answer;
                                const isCurrent = idx === currentAnswerIndex;
                                const isAnswered = idx < currentAnswerIndex;

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`
                                            relative p-4 rounded-xl border transition-all
                                            ${isAnswered
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : isCurrent
                                                    ? `bg-yellow-500/10 border-yellow-500/50 ${prefersReducedMotion ? '' : 'animate-pulse'}`
                                                    : 'bg-slate-800/30 border-slate-700/30'
                                            }
                                        `}
                                    >
                                        <div className="text-xs text-slate-500 mb-1">
                                            {t('phase5.answerLabel', { number: idx + 1 })}
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {answer ? (
                                                <motion.div
                                                    key={`answer-${idx}`}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="font-bold text-lg text-white truncate"
                                                >
                                                    {answer}
                                                </motion.div>
                                            ) : isCurrent ? (
                                                <motion.div
                                                    key="typing"
                                                    className="flex items-center gap-1.5"
                                                    aria-label={t('phase5.typing')}
                                                >
                                                    {/* Better contrast with white dots */}
                                                    <span className={`w-2 h-2 bg-white rounded-full ${prefersReducedMotion ? '' : 'animate-bounce'}`} style={prefersReducedMotion ? {} : { animationDelay: '0ms' }} />
                                                    <span className={`w-2 h-2 bg-white rounded-full ${prefersReducedMotion ? '' : 'animate-bounce'}`} style={prefersReducedMotion ? {} : { animationDelay: '150ms' }} />
                                                    <span className={`w-2 h-2 bg-white rounded-full ${prefersReducedMotion ? '' : 'animate-bounce'}`} style={prefersReducedMotion ? {} : { animationDelay: '300ms' }} />
                                                </motion.div>
                                            ) : (
                                                <div className="text-slate-600">—</div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Opponent Progress Comparison */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                    <div className="flex justify-center items-center gap-8">
                        {/* My Team */}
                        <div className={`text-center ${currentPlayerTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {representative && <AvatarIcon avatar={representative.avatar} size={20} />}
                                <span className="font-bold">{representative?.name || t('phase5.yourTeam')}</span>
                            </div>
                            <div className="text-3xl font-black">{currentAnswerIndex}/{TOTAL_QUESTIONS}</div>
                        </div>

                        <ChevronRight className="w-6 h-6 text-slate-600 rotate-90" />

                        {/* Opponent */}
                        <div className={`text-center ${opponentTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                {opponentRep && <AvatarIcon avatar={opponentRep.avatar} size={20} />}
                                <span className="font-bold">{opponentRep?.name || t('phase5.opponent')}</span>
                            </div>
                            <div className="text-3xl font-black">{opponentAnswers.length}/{TOTAL_QUESTIONS}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fallback for other states
    return (
        <div className="flex items-center justify-center min-h-full p-6 text-white">
            <FoodLoader size="lg" />
        </div>
    );
}
