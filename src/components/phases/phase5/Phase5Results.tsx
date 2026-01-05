import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room } from '../../../services/gameService';
import { usePhaseTransition } from '../../../hooks/usePhaseTransition';
import { AvatarIcon } from '../../AvatarIcon';
import { Check, X, Trophy, Star, Flame } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { getTeamTextColor } from '../../../utils/teamColors';

interface Phase5ResultsProps {
    room: Room;
    isHost: boolean;
}

export function Phase5Results({ room, isHost }: Phase5ResultsProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const prefersReducedMotion = useReducedMotion();

    // Use centralized phase transition hook for end game
    const { endGame } = usePhaseTransition({
        room,
        isHost,
        isSolo: false, // Phase 5 is multiplayer only
    });

    const results = room.state.phase5Results;

    // Play sound on mount
    useEffect(() => {
        if (results) {
            const spicyPoints = results.spicy?.points || 0;
            const sweetPoints = results.sweet?.points || 0;

            if (spicyPoints >= 10 || sweetPoints >= 10) {
                audioService.playSuccess();
            } else if (spicyPoints > 0 || sweetPoints > 0) {
                audioService.playSuccess();
            }
        }
    }, [results]);

    if (!results) {
        return null;
    }

    const spicyRep = room.state.phase5Representatives?.spicy;
    const sweetRep = room.state.phase5Representatives?.sweet;
    const spicyPlayer = spicyRep ? room.players[spicyRep] : null;
    const sweetPlayer = sweetRep ? room.players[sweetRep] : null;

    const renderTeamResults = (team: 'spicy' | 'sweet', delay: number) => {
        const teamResults = results[team];
        const representative = team === 'spicy' ? spicyPlayer : sweetPlayer;
        const isWinner = teamResults.points > 0;
        const isPerfect = teamResults.all10Correct;
        const isHalf = teamResults.first5Correct && !teamResults.all10Correct;

        // Use static Tailwind classes - dynamic classes like `text-${color}` don't work
        const teamTextColor = getTeamTextColor(team);
        const bgGradient = team === 'spicy'
            ? 'from-red-900/50 to-orange-900/50'
            : 'from-pink-900/50 to-purple-900/50';
        const borderColor = team === 'spicy' ? 'border-red-500/30' : 'border-pink-500/30';

        return (
            <motion.div
                initial={{ opacity: 0, x: team === 'spicy' ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay, duration: durations.medium, ease: organicEase }}
                className={`bg-gradient-to-b ${bgGradient} rounded-3xl border ${borderColor} p-6 flex-1`}
            >
                {/* Team Header */}
                <div className="text-center mb-6">
                    {representative && (
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <AvatarIcon avatar={representative.avatar} size={48} />
                            <div className="text-left">
                                <div className="font-bold text-xl">{representative.name}</div>
                                <div className={`text-sm ${teamTextColor} uppercase tracking-wider`}>
                                    {team === 'spicy' ? t('phase5.teamSpicy') : t('phase5.teamSweet')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Points Badge */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl ${
                            isPerfect
                                ? 'bg-yellow-500 text-black'
                                : isHalf
                                    ? 'bg-green-500 text-black'
                                    : 'bg-slate-700 text-slate-300'
                        }`}
                    >
                        {isPerfect && <Trophy className="w-6 h-6" />}
                        {isHalf && <Star className="w-6 h-6" />}
                        <span className="text-3xl font-black">+{teamResults.points}</span>
                        <span className="text-lg font-bold">{t('phase5.points')}</span>
                    </motion.div>

                    {/* Status Text */}
                    <div className="mt-3">
                        {isPerfect && (
                            <motion.div
                                animate={prefersReducedMotion ? {} : { scale: [1, 1.05, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-yellow-400 font-bold text-lg"
                            >
                                {t('phase5.perfectScore')}
                            </motion.div>
                        )}
                        {isHalf && (
                            <div className="text-green-400 font-bold">{t('phase5.halfCorrect')}</div>
                        )}
                        {!isWinner && (
                            <div className="text-slate-500">{t('phase5.noPoints')}</div>
                        )}
                    </div>
                </div>

                {/* Answers Grid */}
                <div className="space-y-2">
                    {teamResults.answers.map((answer, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: delay + 0.5 + idx * 0.1 }}
                            className={`flex items-center gap-3 p-3 rounded-xl ${
                                answer.isCorrect
                                    ? 'bg-green-500/20 border border-green-500/30'
                                    : 'bg-red-500/20 border border-red-500/30'
                            }`}
                        >
                            {/* Status Icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                answer.isCorrect ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                                {answer.isCorrect ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : (
                                    <X className="w-5 h-5 text-white" />
                                )}
                            </div>

                            {/* Answer Content */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-slate-400 mb-0.5">#{idx + 1}</div>
                                <div className="font-medium truncate">
                                    {answer.given || <span className="text-slate-500 italic">{t('phase5.noAnswer')}</span>}
                                </div>
                                {!answer.isCorrect && (
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {t('phase5.expected')}: <span className="text-yellow-400">{answer.expected}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Score Summary */}
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <div className="text-slate-400 text-sm">
                        {teamResults.answers.filter(a => a.isCorrect).length}/10 {t('phase5.correct')}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col min-h-full p-6 text-white overflow-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <Flame className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
                    {t('phase5.finalResults')}
                </h1>
                <p className="text-slate-400">{t('phase5.resultsSubtitle')}</p>
            </motion.div>

            {/* Results Grid */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto w-full">
                {renderTeamResults('spicy', 0.2)}
                {renderTeamResults('sweet', 0.4)}
            </div>

            {/* End Game Button (Host only) */}
            {isHost && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="mt-8 text-center"
                >
                    <button
                        onClick={() => {
                            audioService.playClick();
                            endGame();
                        }}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-12 py-4 rounded-2xl text-xl font-black shadow-2xl hover:shadow-yellow-500/30 transition-all"
                    >
                        <Trophy className="w-6 h-6 inline-block mr-2" />
                        {t('phase5.endGame')}
                    </button>
                </motion.div>
            )}

            {!isHost && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className={`mt-8 text-center text-slate-500 ${prefersReducedMotion ? '' : 'animate-pulse'}`}
                >
                    {t('phase5.waitingForHost')}
                </motion.div>
            )}
        </div>
    );
}
