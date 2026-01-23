import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    type Room,
    nextPhase4Question,
    markPlayerReady,
    getReadinessStatus,
} from '../../../services/gameService';
import { FileQuestion, Clock, Zap, Trophy, Users, CheckCircle } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';
import { useAuthUser } from '../../../hooks/useAuthUser';

interface Phase4IntroProps {
    room: Room;
    isHost: boolean;
}

export function Phase4Intro({ room, isHost }: Phase4IntroProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const { user } = useAuthUser();
    const [isMarking, setIsMarking] = useState(false);

    const readiness = useMemo(() => getReadinessStatus(room, 'phase4'), [room]);
    const isPlayerReady = user?.uid
        ? Boolean(room.state.playersReady?.['phase4']?.[user.uid])
        : false;

    const handleReady = useCallback(async () => {
        if (!user?.uid || isMarking) return;
        setIsMarking(true);
        try {
            audioService.playClick();
            await markPlayerReady(room.code, user.uid, 'phase4');
        } finally {
            setIsMarking(false);
        }
    }, [room.code, user?.uid, isMarking]);

    const handleStart = async () => {
        audioService.playClick();
        // Start Phase 4 with first question
        await nextPhase4Question(room.code);
    };

    const steps = [
        { icon: FileQuestion, text: t('phase4Intro.step1ReadQuestion'), color: 'text-purple-400' },
        { icon: Clock, text: t('phase4Intro.step2Timer'), color: 'text-blue-400' },
        { icon: Zap, text: t('phase4Intro.step3AnswerFast'), color: 'text-yellow-400' },
        { icon: Trophy, text: t('phase4Intro.step4FirstCorrectWins'), color: 'text-green-400' },
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
                    <FileQuestion className="w-20 h-20 text-purple-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-600">
                        {t('phase4Intro.title')}
                    </h1>
                    <p className="mt-4 text-xl text-slate-400">{t('phase4Intro.subtitle')}</p>
                </div>

                {/* Rules */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/10">
                    <h2 className="text-2xl font-bold mb-6 text-purple-400">{t('phase4Intro.howToPlay')}</h2>

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
                                        {t('phase4Intro.stepLabel', { number: idx + 1 })}
                                    </div>
                                    <div className="font-medium">{step.text}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Scoring */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h3 className="font-bold text-lg mb-3">{t('phase4Intro.scoring')}</h3>
                        <div className="flex justify-center gap-6 text-sm">
                            <div className="bg-green-500/20 px-4 py-2 rounded-lg">
                                <span className="font-bold text-green-400">{t('phase4Intro.firstCorrect')}</span>
                                <span className="text-slate-400 ml-2">= +1 pt</span>
                            </div>
                            <div className="bg-red-500/20 px-4 py-2 rounded-lg">
                                <span className="font-bold text-red-400">{t('phase4Intro.timerSeconds', { seconds: 15 })}</span>
                                <span className="text-slate-400 ml-2">{t('phase4Intro.perQuestion')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Readiness & Start Button */}
                <div className="flex flex-col items-center gap-4">
                    {/* Readiness indicator */}
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                            {t('player.readyCount', {
                                ready: readiness.readyCount,
                                total: readiness.totalCount
                            })}
                        </span>
                    </div>

                    {isHost && !isPlayerReady ? (
                        // Host must also mark ready first
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,197,94,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReady}
                            disabled={isMarking}
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-12 py-5 rounded-2xl text-2xl font-black shadow-2xl uppercase tracking-wider"
                        >
                            {t('player.iUnderstood')}
                        </motion.button>
                    ) : isHost && isPlayerReady ? (
                        // Host is ready, show Start button
                        <motion.button
                            whileHover={readiness.allReady ? { scale: 1.05, boxShadow: "0 0 30px rgba(168,85,247,0.4)" } : {}}
                            whileTap={readiness.allReady ? { scale: 0.95 } : {}}
                            onClick={handleStart}
                            disabled={!readiness.allReady}
                            className={`px-12 py-5 rounded-2xl text-2xl font-black shadow-2xl uppercase tracking-wider transition-all ${
                                readiness.allReady
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white cursor-pointer'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {readiness.allReady ? t('common:buttons.start') : t('player.waitingForPlayers')}
                        </motion.button>
                    ) : isPlayerReady ? (
                        <div className="flex items-center gap-2 text-green-400 text-xl font-bold">
                            <CheckCircle className="w-6 h-6" />
                            <span>{t('player.youAreReady')}</span>
                        </div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,197,94,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReady}
                            disabled={isMarking}
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-12 py-5 rounded-2xl text-2xl font-black shadow-2xl uppercase tracking-wider"
                        >
                            {t('player.iUnderstood')}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
