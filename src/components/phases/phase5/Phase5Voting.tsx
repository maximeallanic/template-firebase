import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, type Team, submitPhase5Vote, checkPhase5VoteCompletion } from '../../../services/gameService';
import { AvatarIcon } from '../../AvatarIcon';
import { Check, Vote, Users } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';

interface Phase5VotingProps {
    room: Room;
    currentPlayerId: string;
    currentPlayerTeam: Team;
}

export function Phase5Voting({ room, currentPlayerId, currentPlayerTeam }: Phase5VotingProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get teammates (same team, excluding mock players for voting)
    const teammates = useMemo(() => {
        return Object.values(room.players).filter(
            (p) => p.team === currentPlayerTeam && p.isOnline && !p.id.startsWith('mock_')
        );
    }, [room.players, currentPlayerTeam]);

    // Check if current player has already voted
    const myVote = room.state.phase5Votes?.[currentPlayerTeam]?.[currentPlayerId];
    const alreadyVoted = !!myVote;

    // Count how many have voted in my team
    const teamVotes = room.state.phase5Votes?.[currentPlayerTeam] || {};
    const votedCount = Object.keys(teamVotes).length;
    const totalVoters = teammates.length;

    // Get list of who has voted (to show checkmarks)
    const voterIds = new Set(Object.keys(teamVotes));

    const handleVote = async () => {
        if (!selectedPlayerId || hasVoted || alreadyVoted || isSubmitting) return;

        setIsSubmitting(true);
        audioService.playClick();

        try {
            await submitPhase5Vote(room.code, currentPlayerId, selectedPlayerId, currentPlayerTeam);
            setHasVoted(true);

            // Check if all votes are in
            await checkPhase5VoteCompletion(room.code);
        } catch (error) {
            console.error('Failed to submit vote:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // If already voted, show waiting state
    if (alreadyVoted || hasVoted) {
        const votedFor = room.players[myVote || selectedPlayerId || ''];

        return (
            <div className="flex flex-col items-center justify-center min-h-full p-6 text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: durations.medium, ease: organicEase }}
                    className="text-center"
                >
                    <Check className="w-20 h-20 text-green-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-2">{t('phase5.voteSubmitted')}</h2>
                    {votedFor && (
                        <p className="text-slate-400 text-lg mb-6">
                            {t('phase5.youVotedFor', { name: votedFor.name })}
                        </p>
                    )}

                    <div className="bg-slate-800/60 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-center gap-2 text-slate-300 mb-4">
                            <Users className="w-5 h-5" />
                            <span>{t('phase5.votesCount', { count: votedCount, total: totalVoters })}</span>
                        </div>

                        {/* Show who has voted */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {teammates.map((teammate) => (
                                <div
                                    key={teammate.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                        voterIds.has(teammate.id)
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-slate-700/50 text-slate-500'
                                    }`}
                                >
                                    <AvatarIcon avatar={teammate.avatar} size={20} />
                                    <span className="text-sm">{teammate.name}</span>
                                    {voterIds.has(teammate.id) && <Check className="w-4 h-4" />}
                                </div>
                            ))}
                        </div>

                        {votedCount < totalVoters && (
                            <p className="text-slate-500 mt-4 animate-pulse">
                                {t('phase5.waitingForVotes')}
                            </p>
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
                className="text-center mb-8"
            >
                <Vote className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
                    {t('phase5.selectChampion')}
                </h1>
                <p className="text-slate-400 text-lg">
                    {t('phase5.selectChampionSubtitle')}
                </p>
            </motion.div>

            {/* Teammate Selection Grid */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl w-full">
                    {teammates.map((teammate, index) => {
                        const isSelected = selectedPlayerId === teammate.id;
                        const isCurrentPlayer = teammate.id === currentPlayerId;

                        return (
                            <motion.button
                                key={teammate.id}
                                data-cursor-target={`phase5:vote:${teammate.id}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: index * 0.1,
                                    duration: durations.medium,
                                    ease: organicEase,
                                }}
                                onClick={() => {
                                    if (!isCurrentPlayer) {
                                        audioService.playClick();
                                        setSelectedPlayerId(teammate.id);
                                    }
                                }}
                                disabled={isCurrentPlayer}
                                className={`
                                    relative p-6 rounded-2xl border-2 transition-all duration-200
                                    ${isSelected
                                        ? 'border-yellow-500 bg-yellow-500/20 scale-105'
                                        : isCurrentPlayer
                                            ? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                                            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="vote-selection"
                                        className="absolute inset-0 border-2 border-yellow-400 rounded-2xl"
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <div className="flex flex-col items-center gap-3">
                                    <AvatarIcon
                                        avatar={teammate.avatar}
                                        size={48}
                                        className={isSelected ? 'ring-4 ring-yellow-500/50' : ''}
                                    />
                                    <span className={`font-bold text-lg ${isSelected ? 'text-yellow-300' : 'text-white'}`}>
                                        {teammate.name}
                                    </span>
                                    {isCurrentPlayer && (
                                        <span className="text-xs text-slate-500">{t('phase5.you')}</span>
                                    )}
                                </div>

                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center"
                                    >
                                        <Check className="w-5 h-5 text-black" />
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Vote Button */}
                <motion.button
                    data-cursor-target="phase5:confirm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: durations.medium, ease: organicEase }}
                    onClick={handleVote}
                    disabled={!selectedPlayerId || isSubmitting}
                    className={`
                        mt-8 px-10 py-4 rounded-xl font-bold text-xl uppercase tracking-wider
                        transition-all duration-200
                        ${selectedPlayerId
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/30'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        }
                    `}
                >
                    {isSubmitting ? t('common:loading') : t('phase5.confirmVote')}
                </motion.button>
            </div>
        </div>
    );
}
