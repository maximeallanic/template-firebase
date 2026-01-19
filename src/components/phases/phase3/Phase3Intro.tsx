import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, initPhase3 } from '../../../services/gameService';
import { Utensils, Users, Keyboard, Trophy } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';

interface Phase3IntroProps {
    room: Room;
    isHost: boolean;
}

export function Phase3Intro({ room, isHost }: Phase3IntroProps) {
    const { t } = useTranslation(['game-ui', 'common']);

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

                {/* Start Button */}
                {isHost ? (
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(249,115,22,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-12 py-5 rounded-2xl text-2xl font-black shadow-2xl uppercase tracking-wider"
                    >
                        {t('common:buttons.start')}
                    </motion.button>
                ) : (
                    <div className="animate-pulse text-orange-500/50 text-xl font-bold uppercase tracking-widest">
                        {t('player.waitingForHost')}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
