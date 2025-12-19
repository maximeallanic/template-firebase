import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Utensils, Flame, Candy } from 'lucide-react';
import type { Team } from '../../../types/gameTypes';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { durations, organicEase } from '../../../animations';
import { phase3MenuVariants } from '../../../animations/phaseTransitions';

interface Phase3TransitionProps {
    themeTitle: string;
    questionNumber: number;
    totalQuestions: number;
    team: Team;
    onComplete: () => void;
}

export function Phase3Transition({
    themeTitle,
    questionNumber,
    totalQuestions,
    team,
    onComplete,
}: Phase3TransitionProps) {
    const { t } = useTranslation(['game-ui', 'game-phases']);
    const prefersReducedMotion = useReducedMotion();
    const hasPlayedAudioRef = useRef(false);

    // Team colors
    const TeamIcon = team === 'spicy' ? Flame : Candy;
    const teamColor = team === 'spicy' ? 'text-red-400' : 'text-pink-400';
    const teamBorder = team === 'spicy' ? 'border-red-500/30' : 'border-pink-500/30';
    const teamGlow = team === 'spicy' ? 'shadow-red-500/20' : 'shadow-pink-500/20';

    // Play sound on mount
    useEffect(() => {
        if (hasPlayedAudioRef.current) return;
        hasPlayedAudioRef.current = true;
        audioService.playClick();
    }, []);

    // Auto-complete after animation
    useEffect(() => {
        const duration = prefersReducedMotion ? 1000 : 2500;
        const timer = setTimeout(onComplete, duration);
        return () => clearTimeout(timer);
    }, [onComplete, prefersReducedMotion]);

    if (prefersReducedMotion) {
        return (
            <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: durations.fast }}
                    className={`bg-white/95 rounded-3xl p-8 text-center border-2 ${teamBorder} shadow-2xl ${teamGlow}`}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Utensils className="w-8 h-8 text-yellow-500" />
                        <TeamIcon className={`w-8 h-8 ${teamColor}`} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">
                        {themeTitle}
                    </h2>
                    <p className="text-slate-600 text-lg">
                        {t('phase3.question')} {questionNumber} / {totalQuestions}
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50 overflow-hidden">
            {/* Background decorative elements */}
            <motion.div
                className="absolute inset-0 opacity-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Decorative utensils pattern */}
                <div className="absolute top-10 left-10 transform -rotate-12">
                    <Utensils className="w-24 h-24 text-yellow-500" />
                </div>
                <div className="absolute bottom-10 right-10 transform rotate-12">
                    <Utensils className="w-24 h-24 text-yellow-500" />
                </div>
                <div className="absolute top-1/4 right-1/4">
                    <TeamIcon className={`w-16 h-16 ${teamColor}`} />
                </div>
                <div className="absolute bottom-1/4 left-1/4">
                    <TeamIcon className={`w-16 h-16 ${teamColor}`} />
                </div>
            </motion.div>

            {/* Menu card that unfolds */}
            <motion.div
                variants={phase3MenuVariants}
                initial="hidden"
                animate="visible"
                className={`bg-white/95 rounded-3xl p-10 text-center border-2 ${teamBorder} shadow-2xl ${teamGlow} max-w-md mx-4`}
            >
                {/* Menu header decoration */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, ease: organicEase }}
                    className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-6 rounded-full"
                />

                {/* Icon row */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="flex items-center justify-center gap-4 mb-6"
                >
                    <Utensils className="w-10 h-10 text-yellow-500" />
                    <div className="w-px h-8 bg-slate-300" />
                    <TeamIcon className={`w-10 h-10 ${teamColor}`} />
                </motion.div>

                {/* Theme title */}
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-4xl font-black text-slate-800 mb-3"
                >
                    {themeTitle}
                </motion.h2>

                {/* Question number */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    className="flex items-center justify-center gap-2 text-slate-600"
                >
                    <span className="text-lg font-medium">
                        {t('phase3.question')}
                    </span>
                    <span className={`text-2xl font-black ${teamColor}`}>
                        {questionNumber}
                    </span>
                    <span className="text-lg text-slate-400">
                        / {totalQuestions}
                    </span>
                </motion.div>

                {/* Progress dots */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.4 }}
                    className="flex justify-center gap-2 mt-6"
                >
                    {Array.from({ length: totalQuestions }).map((_, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.2 + idx * 0.1, duration: 0.3 }}
                            className={`w-3 h-3 rounded-full ${
                                idx < questionNumber - 1
                                    ? 'bg-green-500'
                                    : idx === questionNumber - 1
                                    ? team === 'spicy' ? 'bg-red-500' : 'bg-pink-500'
                                    : 'bg-slate-300'
                            }`}
                        />
                    ))}
                </motion.div>

                {/* Menu footer decoration */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.5, duration: 0.5, ease: organicEase }}
                    className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-6 rounded-full"
                />
            </motion.div>

            {/* Pulsing ready text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.7, 1] }}
                transition={{ delay: 2, duration: 0.5 }}
                className="absolute bottom-20 text-white/60 text-sm font-medium"
            >
                {t('phase3.getReady')}
            </motion.div>
        </div>
    );
}
