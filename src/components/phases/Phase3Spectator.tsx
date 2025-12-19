import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, Flame, Candy, Clock, Eye, PartyPopper, Loader2 } from 'lucide-react';
import type { Team, Phase3TeamProgress, Phase3Theme, Player } from '../../types/gameTypes';

interface Phase3SpectatorProps {
    playerTeam: Team;
    ownProgress: Phase3TeamProgress;
    otherProgress?: Phase3TeamProgress;
    otherTheme?: Phase3Theme;
    players: Record<string, Player>;
    bothFinished: boolean;
}

export const Phase3Spectator: React.FC<Phase3SpectatorProps> = ({
    playerTeam,
    ownProgress,
    otherProgress,
    otherTheme,
    players,
    bothFinished,
}) => {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);

    const otherTeam: Team = playerTeam === 'spicy' ? 'sweet' : 'spicy';
    const OtherTeamIcon = otherTeam === 'spicy' ? Flame : Candy;
    const otherTeamColor = otherTeam === 'spicy' ? 'text-red-500' : 'text-pink-400';
    const OwnTeamIcon = playerTeam === 'spicy' ? Flame : Candy;
    const ownTeamColor = playerTeam === 'spicy' ? 'text-red-500' : 'text-pink-400';

    // Get player name who answered a question
    const getAnsweredByName = (progress: Phase3TeamProgress, questionIndex: number): string | null => {
        const playerId = progress.questionAnsweredBy?.[questionIndex];
        if (!playerId) return null;
        return players[playerId]?.name || null;
    };

    if (bothFinished) {
        // Both teams finished - show final comparison
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <PartyPopper className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                    <h2 className="text-3xl font-bold mb-8">{t('phase3.phaseComplete')}</h2>

                    {/* Score Comparison */}
                    <div className="flex items-center justify-center gap-8 mb-8">
                        {/* Spicy Score */}
                        <div className={`text-center ${playerTeam === 'spicy' ? 'ring-4 ring-yellow-400' : ''} p-6 rounded-2xl bg-red-500/20`}>
                            <Flame className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p className="text-red-400 font-bold mb-1">{t('common:teams.spicy')}</p>
                            <p className="text-4xl font-black text-white">
                                {playerTeam === 'spicy' ? ownProgress.score : otherProgress?.score || 0}
                            </p>
                            <p className="text-white/50 text-sm">{t('phase3.points')}</p>
                        </div>

                        <div className="text-4xl font-bold text-white/30">VS</div>

                        {/* Sweet Score */}
                        <div className={`text-center ${playerTeam === 'sweet' ? 'ring-4 ring-yellow-400' : ''} p-6 rounded-2xl bg-pink-500/20`}>
                            <Candy className="w-12 h-12 text-pink-400 mx-auto mb-2" />
                            <p className="text-pink-400 font-bold mb-1">{t('common:teams.sweet')}</p>
                            <p className="text-4xl font-black text-white">
                                {playerTeam === 'sweet' ? ownProgress.score : otherProgress?.score || 0}
                            </p>
                            <p className="text-white/50 text-sm">{t('phase3.points')}</p>
                        </div>
                    </div>

                    <p className="text-white/60">{t('phase3.waitingForHost')}</p>
                </motion.div>
            </div>
        );
    }

    // Team finished, watching other team
    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto px-4">
            {/* Own Score Summary */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full bg-gradient-to-r ${
                    playerTeam === 'spicy'
                        ? 'from-red-500/20 to-orange-500/20'
                        : 'from-pink-500/20 to-purple-500/20'
                } rounded-2xl p-6 mb-8`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <OwnTeamIcon className={`w-10 h-10 ${ownTeamColor}`} />
                        <div>
                            <h3 className={`text-xl font-bold ${ownTeamColor}`}>
                                {t('phase3.yourScore')}
                            </h3>
                            <p className="text-white/60 text-sm">{t('phase3.finished')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400" />
                        <span className="text-4xl font-black text-white">{ownProgress.score}</span>
                        <span className="text-white/50">/ 5</span>
                    </div>
                </div>
            </motion.div>

            {/* Watching Other Team */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-white/60" />
                    <span className="text-white/60">{t('phase3.watchingOtherTeam')}</span>
                </div>

                {otherProgress ? (
                    <div className="space-y-4">
                        {/* Other Team Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <OtherTeamIcon className={`w-8 h-8 ${otherTeamColor}`} />
                                <div>
                                    <h4 className={`font-bold ${otherTeamColor}`}>
                                        {t(`common:teams.${otherTeam}`)}
                                    </h4>
                                    {otherTheme && (
                                        <p className="text-white/50 text-sm">{otherTheme.title}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-white">{otherProgress.score}</p>
                                <p className="text-white/50 text-xs">{t('phase3.points')}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-white/60">
                                <span>{t('phase3.question')} {otherProgress.currentQuestionIndex + 1} / 5</span>
                                {otherProgress.finished ? (
                                    <span className="text-green-400 flex items-center gap-1">
                                        <Trophy className="w-4 h-4" />
                                        {t('phase3.finished')}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('phase3.inProgress')}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                    const answeredBy = getAnsweredByName(otherProgress, idx);
                                    const isCurrent = idx === otherProgress.currentQuestionIndex;
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex-1 h-3 rounded-full transition-all ${
                                                answeredBy
                                                    ? 'bg-green-500'
                                                    : isCurrent && !otherProgress.finished
                                                    ? 'bg-yellow-400 animate-pulse'
                                                    : 'bg-white/20'
                                            }`}
                                            title={answeredBy || undefined}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Answers */}
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: otherProgress.currentQuestionIndex }).map((_, idx) => {
                                const answeredBy = getAnsweredByName(otherProgress, idx);
                                if (!answeredBy) return null;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full"
                                    >
                                        Q{idx + 1}: {answeredBy}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-white/30 mx-auto mb-2" />
                        <p className="text-white/50">{t('phase3.waitingForOtherTeam')}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
