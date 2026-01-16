import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, initPhase3 } from '../../../services/gameService';
import { markPlayerReady, areAllPlayersReady, getReadinessCount } from '../../../services/game';
import { Utensils, Users, Keyboard, Trophy, Check, Loader2 } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { useMemo } from 'react';

interface Phase3IntroProps {
    room: Room;
    isHost: boolean;
}

export function Phase3Intro({ room, isHost }: Phase3IntroProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const { user } = useAuthUser();
    const playerId = user?.uid;

    // Readiness state
    const playersReady = room.state.playersReady;
    const isPlayerReady = playerId ? playersReady?.[playerId] === true : false;
    const allReady = useMemo(() => areAllPlayersReady(room.players, playersReady), [room.players, playersReady]);
    const { ready, total } = useMemo(() => getReadinessCount(room.players, playersReady), [room.players, playersReady]);

    const handleReady = async () => {
        if (!playerId) return;
        audioService.playClick();
        await markPlayerReady(room.code, playerId);
    };

    const handleStart = async () => {
        audioService.playClick();
        // Initialize Phase 3 (sets up selection order based on scores)
        await initPhase3(room.code);
    };

    const steps = [
        { icon: Utensils, text: t('phase3Intro.step1SelectMenu'), color: 'text-orange-400' },
        { icon: Keyboard, text: t('phase3Intro.step2TypeAnswers'), color: 'text-blue-400' },
        { icon: Users, text: t('phase3Intro.step3TeamRace'), color: 'text-green-400' },
        { icon: Trophy, text: t('phase3Intro.step4EarnPoints'), color: 'text-yellow-400' },
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 text-white bg-gradient-to-br from-slate-900 via-slate-800 to-black">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: durations.medium, ease: organicEase }}
                className="text-center max-w-2xl"
            >
                {/* Title */}
                <div className="mb-8">
                    <Utensils className="w-20 h-20 text-orange-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-orange-600">
                        {t('phase3Intro.title')}
                    </h1>
                    <p className="mt-4 text-xl text-slate-400">{t('phase3Intro.subtitle')}</p>
                </div>

                {/* Rules */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/10">
                    <h2 className="text-2xl font-bold mb-6 text-orange-400">{t('phase3Intro.howToPlay')}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1, duration: durations.fast }}
                                className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl"
                            >
                                <div className={`w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center ${step.color}`}>
                                    <step.icon className="w-6 h-6" />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-slate-500 text-xs uppercase tracking-wider">
                                        {t('phase3Intro.stepLabel', { number: idx + 1 })}
                                    </div>
                                    <div className="font-medium">{step.text}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Scoring */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h3 className="font-bold text-lg mb-3">{t('phase3Intro.scoring')}</h3>
                        <div className="flex justify-center gap-6 text-sm">
                            <div className="bg-green-500/20 px-4 py-2 rounded-lg">
                                <span className="font-bold text-green-400">{t('phase3Intro.correctAnswer')}</span>
                                <span className="text-slate-400 ml-2">= +1 pt</span>
                            </div>
                            <div className="bg-blue-500/20 px-4 py-2 rounded-lg">
                                <span className="font-bold text-blue-400">{t('phase3Intro.approxSpelling')}</span>
                                <span className="text-slate-400 ml-2">= OK!</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ready/Start Button */}
                <div className="flex flex-col items-center gap-4">
                    {/* Readiness indicator */}
                    {ready > 0 && (
                        <div className="text-slate-400 text-sm flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <span>{t('phase1Intro.playersReady', { ready, total })}</span>
                        </div>
                    )}

                    {/* Player: "Understood" button */}
                    {!isPlayerReady && (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,197,94,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReady}
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-12 py-5 rounded-2xl text-2xl font-black shadow-2xl uppercase tracking-wider"
                        >
                            {t('common:buttons.understood')}
                        </motion.button>
                    )}

                    {/* Player ready: waiting for others */}
                    {isPlayerReady && !isHost && !allReady && (
                        <div className="flex items-center gap-3 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-lg">{t('phase1Intro.waitingForOthers')}</span>
                        </div>
                    )}

                    {/* Host: Start button (enabled when all ready) */}
                    {isHost && isPlayerReady && (
                        <motion.button
                            whileHover={allReady ? { scale: 1.05, boxShadow: "0 0 30px rgba(249,115,22,0.4)" } : {}}
                            whileTap={allReady ? { scale: 0.95 } : {}}
                            onClick={handleStart}
                            disabled={!allReady}
                            className={`px-12 py-5 rounded-2xl text-2xl font-black shadow-2xl uppercase tracking-wider transition-all ${
                                allReady
                                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white cursor-pointer'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {allReady ? t('common:buttons.start') : t('phase1Intro.waitingForPlayers')}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
