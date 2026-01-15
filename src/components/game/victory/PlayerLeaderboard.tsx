import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star, Flame, Candy, Users } from 'lucide-react';
import { AvatarIcon } from '../../AvatarIcon';
import type { Player, Team } from '../../../types/gameTypes';
import { organicEase, durations } from '../../../animations';

interface PlayerLeaderboardProps {
    players: Record<string, Player>;
    /** Show top N players per team (default: 2) */
    topNPerTeam?: number;
}

export function PlayerLeaderboard({ players, topNPerTeam = 2 }: PlayerLeaderboardProps) {
    const { t } = useTranslation(['game-ui', 'common']);

    // Get top contributors per team
    const { spicyPlayers, sweetPlayers, mvpId } = useMemo(() => {
        const allPlayers = Object.values(players).filter(p => p.team);

        // Find MVP (highest scorer overall)
        const sortedAll = [...allPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
        const mvp = sortedAll[0];

        // Get top players per team
        const spicy = allPlayers
            .filter(p => p.team === 'spicy')
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, topNPerTeam);

        const sweet = allPlayers
            .filter(p => p.team === 'sweet')
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, topNPerTeam);

        return {
            spicyPlayers: spicy,
            sweetPlayers: sweet,
            mvpId: mvp?.id,
        };
    }, [players, topNPerTeam]);

    // Don't render if no players
    if (spicyPlayers.length === 0 && sweetPlayers.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: durations.normal, ease: organicEase }}
        >
            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <Users className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                    {t('victory.topContributors', 'Meilleurs contributeurs')}
                </h3>
                <Users className="w-5 h-5 text-slate-400" />
            </div>

            {/* Team Columns */}
            <div className="grid grid-cols-2 gap-4">
                {/* Spicy Team */}
                <TeamColumn
                    team="spicy"
                    players={spicyPlayers}
                    mvpId={mvpId}
                    baseDelay={0.7}
                />

                {/* Sweet Team */}
                <TeamColumn
                    team="sweet"
                    players={sweetPlayers}
                    mvpId={mvpId}
                    baseDelay={0.8}
                />
            </div>
        </motion.div>
    );
}

interface TeamColumnProps {
    team: Team;
    players: Player[];
    mvpId: string | undefined;
    baseDelay: number;
}

function TeamColumn({ team, players, mvpId, baseDelay }: TeamColumnProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const isSpicy = team === 'spicy';

    return (
        <div className={`rounded-2xl p-4 ${
            isSpicy
                ? 'bg-spicy-500/10 border border-spicy-500/30'
                : 'bg-sweet-500/10 border border-sweet-500/30'
        }`}>
            {/* Team Header */}
            <div className={`flex items-center justify-center gap-2 mb-4 pb-3 border-b ${
                isSpicy ? 'border-spicy-500/30' : 'border-sweet-500/30'
            }`}>
                {isSpicy ? (
                    <Flame className="w-5 h-5 text-spicy-400" />
                ) : (
                    <Candy className="w-5 h-5 text-sweet-400" />
                )}
                <span className={`font-bold uppercase tracking-wide text-sm ${
                    isSpicy ? 'text-spicy-400' : 'text-sweet-400'
                }`}>
                    {t(`common:teams.${team}`)}
                </span>
            </div>

            {/* Players */}
            <div className="space-y-3">
                {players.length > 0 ? (
                    players.map((player, index) => {
                        const isMvp = player.id === mvpId;

                        return (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: baseDelay + index * 0.1,
                                    duration: durations.fast,
                                    ease: organicEase,
                                }}
                                className={`flex items-center gap-3 p-2 rounded-xl ${
                                    isMvp
                                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                                        : 'bg-slate-800/50'
                                }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <AvatarIcon avatar={player.avatar} size={36} />
                                    {isMvp && (
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                                            <Star className="w-2.5 h-2.5 text-black" fill="currentColor" />
                                        </div>
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`font-bold text-sm truncate ${
                                            isMvp ? 'text-yellow-300' : 'text-white'
                                        }`}>
                                            {player.name}
                                        </span>
                                        {isMvp && (
                                            <span className="text-[10px] bg-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                                                MVP
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Score */}
                                <div className={`text-lg font-black flex-shrink-0 ${
                                    isMvp ? 'text-yellow-400' : 'text-white'
                                }`}>
                                    {player.score || 0}
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <p className="text-sm text-slate-500 text-center py-2 italic">
                        {t('victory.noPlayers', 'Aucun joueur')}
                    </p>
                )}
            </div>
        </div>
    );
}
