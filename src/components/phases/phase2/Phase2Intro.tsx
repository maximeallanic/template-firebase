import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    type Room,
    nextPhase2Item,
    markPlayerReady,
    getReadinessStatus,
} from '../../../services/gameService';
import { ArrowLeft, ArrowRight, ArrowUp, Users, CheckCircle } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';
import { useAuthUser } from '../../../hooks/useAuthUser';

interface Phase2IntroProps {
    room: Room;
    isHost: boolean;
}

export function Phase2Intro({ room, isHost }: Phase2IntroProps) {
    const { t } = useTranslation(['game-ui', 'common']);
    const { user } = useAuthUser();
    const [isMarking, setIsMarking] = useState(false);

    const readiness = useMemo(() => getReadinessStatus(room, 'phase2'), [room]);
    const isPlayerReady = user?.uid
        ? Boolean(room.state.playersReady?.['phase2']?.[user.uid])
        : false;

    console.log('[Phase2Intro] render', {
        isHost,
        userId: user?.uid,
        isPlayerReady,
        readiness,
        playersReady: room.state.playersReady,
        phaseState: room.state.phaseState
    });

    const handleReady = useCallback(async () => {
        console.log('[Phase2Intro] handleReady called', {
            userId: user?.uid,
            isMarking,
            roomCode: room.code,
            currentPlayersReady: room.state.playersReady
        });
        if (!user?.uid || isMarking) return;
        setIsMarking(true);
        try {
            audioService.playClick();
            await markPlayerReady(room.code, user.uid, 'phase2');
            console.log('[Phase2Intro] markPlayerReady completed');
        } catch (error) {
            console.error('[Phase2Intro] markPlayerReady failed:', error);
        } finally {
            setIsMarking(false);
        }
    }, [room.code, user?.uid, isMarking, room.state.playersReady]);

    const handleStart = async () => {
        console.log('[Phase2Intro] handleStart called', {
            roomCode: room.code,
            phase2Data: room.customQuestions?.phase2,
            currentPhase2Set: room.state.currentPhase2Set
        });
        audioService.playClick();
        // Start Phase 2 with first item
        await nextPhase2Item(room.code);
        console.log('[Phase2Intro] nextPhase2Item completed');
    };

    const steps = [
        { icon: ArrowLeft, text: t('phase2Intro.step1SwipeLeft'), color: 'text-blue-400' },
        { icon: ArrowRight, text: t('phase2Intro.step2SwipeRight'), color: 'text-pink-400' },
        { icon: ArrowUp, text: t('phase2Intro.step3SwipeUp'), color: 'text-purple-400' },
        { icon: Users, text: t('phase2Intro.step4FirstWins'), color: 'text-green-400' },
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
                    <div className="flex justify-center gap-2 md:gap-4 mb-1 md:mb-4">
                        <ArrowLeft className="w-6 h-6 md:w-12 md:h-12 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <ArrowUp className="w-6 h-6 md:w-12 md:h-12 text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                        <ArrowRight className="w-6 h-6 md:w-12 md:h-12 text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                    </div>
                    <h1 className="text-2xl md:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-pink-300 to-pink-600">
                        {t('phase2Intro.title')}
                    </h1>
                    <p className="hidden md:block mt-4 text-xl text-slate-400">{t('phase2Intro.subtitle')}</p>
                </div>

                {/* Rules */}
                <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl md:rounded-3xl p-2 md:p-8 mb-2 md:mb-8 border border-white/10">
                    <h2 className="hidden md:block text-2xl font-bold mb-6 text-pink-400">{t('phase2Intro.howToPlay')}</h2>

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
                                        {t('phase2Intro.stepLabel', { number: idx + 1 })}
                                    </div>
                                    <div className="font-medium text-[11px] md:text-base leading-tight">{step.text}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Controls hint - hidden on mobile */}
                    <div className="hidden md:block mt-6 pt-6 border-t border-white/10">
                        <h3 className="font-bold text-lg mb-3">{t('phase2Intro.controls')}</h3>
                        <div className="flex justify-center gap-4 text-sm">
                            <div className="bg-blue-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4 text-blue-400" />
                                <span className="text-slate-400">{t('phase2Intro.optionA')}</span>
                            </div>
                            <div className="bg-pink-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-pink-400" />
                                <span className="text-slate-400">{t('phase2Intro.optionB')}</span>
                            </div>
                            <div className="bg-purple-500/20 px-4 py-2 rounded-lg flex items-center gap-2">
                                <ArrowUp className="w-4 h-4 text-purple-400" />
                                <span className="text-slate-400">{t('phase2Intro.optionBoth')}</span>
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
                            whileHover={readiness.allReady ? { scale: 1.05, boxShadow: "0 0 30px rgba(236,72,153,0.4)" } : {}}
                            whileTap={readiness.allReady ? { scale: 0.95 } : {}}
                            onClick={handleStart}
                            disabled={!readiness.allReady}
                            className={`px-8 py-3 md:px-12 md:py-5 rounded-xl md:rounded-2xl text-lg md:text-2xl font-black shadow-2xl uppercase tracking-wider transition-all ${
                                readiness.allReady
                                    ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white cursor-pointer'
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
