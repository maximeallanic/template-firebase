import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Star, Flame, Candy } from 'lucide-react';
import { AvatarIcon } from '../../AvatarIcon';
import type { Player } from '../../../types/gameTypes';
import { organicEase, durations } from '../../../animations';

interface PlayerLeaderboardProps {
    players: Record<string, Player>;
    /** Show top N players (default: 3) */
    topN?: number;
}

// Medal colors for top 3
const MEDAL_STYLES = [
    { bg: 'bg-yellow-500', text: 'text-yellow-900', icon: Trophy, label: '1er' },
    { bg: 'bg-slate-300', text: 'text-slate-800', icon: Medal, label: '2e' },
    { bg: 'bg-amber-600', text: 'text-amber-100', icon: Medal, label: '3e' },
];

export function PlayerLeaderboard({ players, topN = 3 }: PlayerLeaderboardProps) {
    const { t } = useTranslation(['game-ui', 'common']);

    // Sort players by score and get top N
    const rankedPlayers = useMemo(() => {
        const playersWithTeam = Object.values(players).filter(p => p.team);
        return playersWithTeam
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, topN);
    }, [players, topN]);

    // Find MVP (highest scorer)
    const mvpId = rankedPlayers[0]?.id;

    if (rankedPlayers.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="w-full max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: durations.normal, ease: organicEase }}
        >
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                    {t('victory.leaderboard', 'Classement')}
                </h3>
                <Star className="w-5 h-5 text-yellow-400" />
            </div>

            {/* Leaderboard List */}
            <div className="space-y-3">
                {rankedPlayers.map((player, index) => {
                    const medalStyle = MEDAL_STYLES[index] || null;
                    const isMvp = player.id === mvpId;
                    const MedalIcon = medalStyle?.icon || Medal;

                    return (
                        <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                delay: 0.8 + index * 0.15,
                                duration: durations.normal,
                                ease: organicEase,
                            }}
                            className={`
                                flex items-center gap-4 p-3 rounded-xl
                                ${index === 0
                                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                                    : 'bg-slate-800/60 border border-slate-700/50'
                                }
                            `}
                        >
                            {/* Rank Badge */}
                            <div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                    ${medalStyle ? `${medalStyle.bg} ${medalStyle.text}` : 'bg-slate-700 text-slate-300'}
                                `}
                            >
                                {medalStyle ? (
                                    <MedalIcon className="w-5 h-5" />
                                ) : (
                                    index + 1
                                )}
                            </div>

                            {/* Avatar */}
                            <div className="relative">
                                <AvatarIcon avatar={player.avatar} size={44} />
                                {isMvp && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                        <Star className="w-3 h-3 text-black" fill="currentColor" />
                                    </div>
                                )}
                            </div>

                            {/* Name & Team */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold truncate ${index === 0 ? 'text-yellow-300' : 'text-white'}`}>
                                        {player.name}
                                    </span>
                                    {isMvp && (
                                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                                            MVP
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-slate-400">
                                    {player.team === 'spicy' ? (
                                        <>
                                            <Flame className="w-3 h-3 text-spicy-400" />
                                            <span className="text-spicy-400">{t('common:teams.spicy', 'Spicy')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Candy className="w-3 h-3 text-sweet-400" />
                                            <span className="text-sweet-400">{t('common:teams.sweet', 'Sweet')}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Score */}
                            <div className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                {player.score || 0}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
