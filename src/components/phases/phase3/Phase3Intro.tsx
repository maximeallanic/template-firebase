import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    type Room,
    initPhase3,
    markPlayerReady,
    getReadinessStatus,
} from '../../../services/gameService';
import { Utensils, Users, Keyboard, Trophy, CheckCircle } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';
import { useAuthUser } from '../../../hooks/useAuthUser';

interface Phase3IntroProps {
    room: Room;
    isHost: boolean;
}

export function Phase3Intro({ room, isHost }: Phase3IntroProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const { user } = useAuthUser();
    const [isMarking, setIsMarking] = useState(false);

    const readiness = useMemo(() => getReadinessStatus(room, 'phase3'), [room]);
    const isPlayerReady = user?.uid
        ? Boolean(room.state.playersReady?.['phase3']?.[user.uid])
        : false;

    const handleReady = useCallback(async () => {
        if (!user?.uid || isMarking) return;
        setIsMarking(true);
        try {
            audioService.playClick();
            await markPlayerReady(room.code, user.uid, 'phase3');
        } finally {
            setIsMarking(false);
        }
    }, [room.code, user?.uid, isMarking]);

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
        <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 text-white bg-gradient-to-br from-slate-900 via-slate-800 to-black">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: durations.medium, ease: organicEase }}
                className="text-center max-w-2xl w-full"
            >
                {/* Title */}
                <div className="mb-2 md:mb-8">
                    <Utensils className="w-10 h-10 md:w-20 md:h-20 text-orange-500 mx-auto mb-1 md:mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                    <h1 className="text-2xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-300 to-orange-600">
                        {t('phase3Intro.title')}
                    </h1>
                    <p className="hidden md:block mt-4 text-xl text-slate-400">{t('phase3Intro.subtitle')}</p>
                </div>

                {/* Rules */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl md:rounded-3xl p-2 md:p-8 mb-2 md:mb-8 border border-white/10">
                    <h2 className="hidden md:block text-2xl font-bold mb-6 text-orange-400">{t('phase3Intro.howToPlay')}</h2>

                    <div className="grid grid-cols-2 gap-1.5 md:gap-4">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1, duration: durations.fast }}
                                className="flex items-center gap-1.5 md:gap-4 bg-slate-900/50 p-1.5 md:p-4 rounded-lg md:rounded-xl"
                            >
                                <div className={`w-7 h-7 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0 ${step.color}`}>
                                    <step.icon className="w-3.5 h-3.5 md:w-6 md:h-6" />
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="text-slate-500 text-[10px] md:text-xs uppercase tracking-wider hidden md:block">
                                        {t('phase3Intro.stepLabel', { number: idx + 1 })}
                                    </div>
                                    <div className="font-medium text-[11px] md:text-base leading-tight">{step.text}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Scoring - hidden on mobile */}
                    <div className="hidden md:block mt-6 pt-6 border-t border-white/10">
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

                {/* Readiness & Start Button */}
                <div className="flex flex-col items-center gap-2 md:gap-4">
                    {/* Readiness indicator */}
                    <div className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
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
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-3 md:px-12 md:py-5 rounded-xl md:rounded-2xl text-lg md:text-2xl font-black shadow-2xl uppercase tracking-wider"
                        >
                            {t('player.iUnderstood')}
                        </motion.button>
                    ) : isHost && isPlayerReady ? (
                        // Host is ready, show Start button
                        <motion.button
                            whileHover={readiness.allReady ? { scale: 1.05, boxShadow: "0 0 30px rgba(249,115,22,0.4)" } : {}}
                            whileTap={readiness.allReady ? { scale: 0.95 } : {}}
                            onClick={handleStart}
                            disabled={!readiness.allReady}
                            className={`px-8 py-3 md:px-12 md:py-5 rounded-xl md:rounded-2xl text-lg md:text-2xl font-black shadow-2xl uppercase tracking-wider transition-all ${
                                readiness.allReady
                                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white cursor-pointer'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {readiness.allReady ? t('common:buttons.start') : t('player.waitingForPlayers')}
                        </motion.button>
                    ) : isPlayerReady ? (
                        <div className="flex items-center gap-2 text-green-400 text-base md:text-xl font-bold">
                            <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                            <span>{t('player.youAreReady')}</span>
                        </div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34,197,94,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleReady}
                            disabled={isMarking}
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-3 md:px-12 md:py-5 rounded-xl md:rounded-2xl text-lg md:text-2xl font-black shadow-2xl uppercase tracking-wider"
                        >
                            {t('player.iUnderstood')}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
