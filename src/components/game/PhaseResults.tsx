import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Candy, Trophy, ArrowRight, Star } from 'lucide-react';
import { type Room, type PhaseStatus, type Team } from '../../services/gameService';
import { AvatarIcon } from '../AvatarIcon';
import { audioService } from '../../services/audioService';
import { organicEase, durations, springConfig } from '../../animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { usePhaseTranslation } from '../../hooks/useGameTranslation';

interface PhaseResultsProps {
    room: Room;
    currentPhase: PhaseStatus;
    isHost: boolean;
    onContinue: () => void;
}

// Map current phase to next phase
const NEXT_PHASE: Record<string, PhaseStatus> = {
    phase1: 'phase2',
    phase2: 'phase3',
    phase3: 'phase4',
    phase4: 'phase5',
};

// Get phase number from status
const getPhaseNumber = (phase: PhaseStatus): number => {
    const match = phase.match(/phase(\d)/);
    return match ? parseInt(match[1], 10) : 0;
};

export function PhaseResults({ room, currentPhase, isHost, onContinue }: PhaseResultsProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const { getPhaseInfo } = usePhaseTranslation();
    const prefersReducedMotion = useReducedMotion();

    const players = Object.values(room.players);
    const phaseNumber = getPhaseNumber(currentPhase);
    const nextPhase = NEXT_PHASE[currentPhase];
    const nextPhaseNumber = nextPhase ? getPhaseNumber(nextPhase) : 0;
    const phaseInfo = getPhaseInfo(currentPhase);

    // Calculate team scores
    const teamScores = useMemo(() => {
        const spicyPlayers = players.filter(p => p.team === 'spicy');
        const sweetPlayers = players.filter(p => p.team === 'sweet');

        return {
            spicy: spicyPlayers.reduce((sum, p) => sum + (p.score || 0), 0),
            sweet: sweetPlayers.reduce((sum, p) => sum + (p.score || 0), 0),
        };
    }, [players]);

    // Find MVP (highest scorer overall)
    const mvp = useMemo(() => {
        const scoredPlayers = players.filter(p => p.team && (p.score || 0) > 0);
        if (scoredPlayers.length === 0) return null;
        return scoredPlayers.reduce((best, player) =>
            (player.score || 0) > (best.score || 0) ? player : best
        );
    }, [players]);

    // Determine which team is leading
    const leadingTeam: Team | 'tie' = teamScores.spicy > teamScores.sweet
        ? 'spicy'
        : teamScores.sweet > teamScores.spicy
            ? 'sweet'
            : 'tie';

    const handleContinue = () => {
        audioService.playClick();
        onContinue();
    };

    return (
        <motion.div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.normal, ease: organicEase }}
        >
            <motion.div
                className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-white/10"
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={prefersReducedMotion ? { duration: 0.2 } : { ...springConfig, delay: 0.1 }}
            >
                {/* Phase Complete Header */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: durations.normal, ease: organicEase }}
                >
                    <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full mb-4">
                        <Trophy className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wide text-sm">
                            Phase {phaseNumber} {t('phaseResults.complete', 'terminée')}
                        </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{phaseInfo.name}</h2>
                </motion.div>

                {/* Team Scores */}
                <motion.div
                    className="space-y-4 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: durations.normal }}
                >
                    {/* Spicy Team */}
                    <TeamScoreBar
                        team="spicy"
                        score={teamScores.spicy}
                        maxScore={Math.max(teamScores.spicy, teamScores.sweet, 1)}
                        isLeading={leadingTeam === 'spicy'}
                        delay={0.4}
                        reducedMotion={prefersReducedMotion}
                    />

                    {/* Sweet Team */}
                    <TeamScoreBar
                        team="sweet"
                        score={teamScores.sweet}
                        maxScore={Math.max(teamScores.spicy, teamScores.sweet, 1)}
                        isLeading={leadingTeam === 'sweet'}
                        delay={0.5}
                        reducedMotion={prefersReducedMotion}
                    />
                </motion.div>

                {/* MVP Section */}
                {mvp && (
                    <motion.div
                        className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl p-4 mb-8 border border-yellow-500/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: durations.normal, ease: organicEase }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <AvatarIcon avatar={mvp.avatar} size={56} />
                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                                    <Star className="w-3 h-3 text-black" fill="currentColor" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-yellow-400 uppercase tracking-wider font-bold mb-1">
                                    {t('phaseResults.mvp', 'MVP')}
                                </div>
                                <div className="text-lg font-bold text-white">{mvp.name}</div>
                                <div className="text-sm text-slate-400">
                                    {mvp.score} {t('phaseResults.points', 'points')}
                                </div>
                            </div>
                            {mvp.team && (
                                <div className={`p-2 rounded-full ${mvp.team === 'spicy' ? 'bg-spicy-500/20' : 'bg-sweet-500/20'}`}>
                                    {mvp.team === 'spicy' ? (
                                        <Flame className="w-6 h-6 text-spicy-400" />
                                    ) : (
                                        <Candy className="w-6 h-6 text-sweet-400" />
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Continue Button (Host) or Waiting Message */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    {isHost ? (
                        <motion.button
                            onClick={handleContinue}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-8 py-4 rounded-xl text-lg font-black shadow-lg hover:shadow-yellow-500/30 transition-shadow flex items-center gap-3 mx-auto"
                            whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                        >
                            {nextPhase ? (
                                <>
                                    {t('phaseResults.continue', 'Continuer vers Phase')} {nextPhaseNumber}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            ) : (
                                <>
                                    {t('phaseResults.finish', 'Voir les résultats')}
                                    <Trophy className="w-5 h-5" />
                                </>
                            )}
                        </motion.button>
                    ) : (
                        <div className="text-slate-500 animate-pulse">
                            {t('phaseResults.waitingForHost', "En attente de l'hôte...")}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}

// Team Score Bar Component
interface TeamScoreBarProps {
    team: Team;
    score: number;
    maxScore: number;
    isLeading: boolean;
    delay: number;
    reducedMotion: boolean;
}

function TeamScoreBar({ team, score, maxScore, isLeading, delay, reducedMotion }: TeamScoreBarProps) {
    const { t } = useTranslation('common');
    const isSpicy = team === 'spicy';
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return (
        <motion.div
            className={`rounded-xl p-4 ${isLeading
                ? (isSpicy ? 'bg-spicy-500/20 ring-2 ring-spicy-500/50' : 'bg-sweet-500/20 ring-2 ring-sweet-500/50')
                : 'bg-slate-700/50'
                }`}
            initial={{ opacity: 0, x: isSpicy ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: durations.normal, ease: organicEase }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {isSpicy ? (
                        <Flame className={`w-5 h-5 ${isLeading ? 'text-spicy-400' : 'text-slate-400'}`} />
                    ) : (
                        <Candy className={`w-5 h-5 ${isLeading ? 'text-sweet-400' : 'text-slate-400'}`} />
                    )}
                    <span className={`font-bold ${isLeading ? 'text-white' : 'text-slate-400'}`}>
                        {t(`teams.${team}`)}
                    </span>
                </div>
                <span className={`text-2xl font-black ${isLeading
                    ? (isSpicy ? 'text-spicy-400' : 'text-sweet-400')
                    : 'text-slate-500'
                    }`}>
                    {score}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full rounded-full ${isSpicy
                        ? 'bg-gradient-to-r from-spicy-600 to-spicy-400'
                        : 'bg-gradient-to-r from-sweet-600 to-sweet-400'
                        }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={reducedMotion
                        ? { duration: 0.2 }
                        : { delay: delay + 0.2, duration: 0.8, ease: organicEase }
                    }
                />
            </div>
        </motion.div>
    );
}
