import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhaseIcon } from './PhaseIcon';
import { Flame, Candy, Trophy } from 'lucide-react';
import { type PhaseStatus } from '../services/gameService';
import { organicEase } from '../animations';
import { usePhaseTranslation } from '../hooks/useGameTranslation';
import { useTranslation } from 'react-i18next';

interface PhaseTransitionProps {
    phase: PhaseStatus;
    isVisible: boolean;
    onComplete: () => void;
}

const PHASE_INFO: Record<PhaseStatus, {
    number: number;
    icon: 'nuggets' | 'saltpepper' | 'menus' | 'addition' | 'burger';
    color: string;
    bgGradient: string;
}> = {
    lobby: {
        number: 0,
        icon: 'nuggets',
        color: 'text-yellow-400',
        bgGradient: 'from-slate-900 via-slate-800 to-slate-900',
    },
    phase1: {
        number: 1,
        icon: 'nuggets',
        color: 'text-amber-400',
        bgGradient: 'from-amber-900/90 via-orange-800/80 to-amber-900/90',
    },
    phase2: {
        number: 2,
        icon: 'saltpepper',
        color: 'text-gray-300',
        bgGradient: 'from-gray-900/90 via-slate-700/80 to-gray-900/90',
    },
    phase3: {
        number: 3,
        icon: 'menus',
        color: 'text-yellow-300',
        bgGradient: 'from-yellow-900/90 via-amber-700/80 to-yellow-900/90',
    },
    phase4: {
        number: 4,
        icon: 'addition',
        color: 'text-red-400',
        bgGradient: 'from-red-900/90 via-rose-800/80 to-red-900/90',
    },
    phase5: {
        number: 5,
        icon: 'burger',
        color: 'text-orange-400',
        bgGradient: 'from-orange-900/90 via-red-800/80 to-orange-900/90',
    },
    victory: {
        number: 6,
        icon: 'burger',
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-600/90 via-amber-500/80 to-yellow-600/90',
    },
};

// Spotlight beam component - OPACITY ONLY (no scaleY on backdrop)
const SpotlightBeam: React.FC<{ delay: number; x: number }> = ({ delay, x }) => (
    <motion.div
        className="absolute top-0 w-32 h-full"
        style={{ left: `${x}%` }}
        initial={{ opacity: 0 }}
        animate={{
            opacity: [0, 0.4, 0.15, 0.4, 0],
        }}
        transition={{
            duration: 2.5,
            delay,
            ease: "easeInOut",
        }}
    >
        <div
            className="w-full h-full"
            style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
                clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
            }}
        />
    </motion.div>
);

// Particle component - SHIMMER EFFECT (opacity only, no y translation)
const Particle: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
    // Fixed random position (computed once per particle)
    const randomX = Math.random() * 100;
    const randomY = 20 + Math.random() * 60; // Spread across screen
    const randomSize = 4 + Math.random() * 8; // Varied sizes
    const randomDuration = 1.5 + Math.random() * 1.5;

    return (
        <motion.div
            className={`absolute rounded-full ${color}`}
            style={{
                left: `${randomX}%`,
                top: `${randomY}%`,
                width: randomSize,
                height: randomSize,
            }}
            initial={{ opacity: 0 }}
            animate={{
                opacity: [0, 0.8, 0.3, 0.9, 0],
            }}
            transition={{
                duration: randomDuration,
                delay,
                ease: "easeInOut",
            }}
        />
    );
};

// TV Static effect
const TVStatic: React.FC = () => (
    <motion.div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-10"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        animate={{ opacity: [0.1, 0.05, 0.1, 0.08, 0.1] }}
        transition={{ duration: 0.5, repeat: Infinity }}
    />
);

// Scanline effect
const Scanlines: React.FC = () => (
    <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
    />
);

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({ phase, isVisible, onComplete }) => {
    const [showContent, setShowContent] = useState(false);
    const info = PHASE_INFO[phase];
    const { getPhaseInfo } = usePhaseTranslation();
    const { t } = useTranslation('common');
    const phaseNames = getPhaseInfo(phase);

    useEffect(() => {
        if (isVisible) {
            // Show content after curtain opens
            const contentTimer = setTimeout(() => setShowContent(true), 400);
            // Auto-complete after animation
            const completeTimer = setTimeout(() => {
                onComplete();
            }, 3500);

            return () => {
                clearTimeout(contentTimer);
                clearTimeout(completeTimer);
            };
        } else {
            setShowContent(false);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-black"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Background with blur and tint */}
                    <motion.div
                        className={`absolute inset-0 backdrop-blur-xl bg-black/40`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />

                    {/* TV Effects */}
                    <TVStatic />
                    <Scanlines />

                    {/* Curtain Left */}
                    <motion.div
                        className="absolute top-0 left-0 w-1/2 h-full z-30"
                        style={{
                            background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
                            boxShadow: '10px 0 20px rgba(0,0,0,0.5)'
                        }}
                        initial={{ x: 0 }}
                        animate={{ x: '-100%' }}
                        exit={{ x: 0 }}
                        transition={{
                            duration: 1.5,
                            ease: [0.22, 1, 0.36, 1], // Custom easeOut
                            delay: 0.5,
                        }}
                    >
                        {/* Velvet Texture/Folds */}
                        <div className="absolute inset-0 opacity-30" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.3) 70px, transparent 100px)'
                        }} />

                        {/* Gold Trim */}
                        <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    </motion.div>

                    {/* Curtain Right */}
                    <motion.div
                        className="absolute top-0 right-0 w-1/2 h-full z-30"
                        style={{
                            background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
                            boxShadow: '-10px 0 20px rgba(0,0,0,0.5)'
                        }}
                        initial={{ x: 0 }}
                        animate={{ x: '100%' }}
                        exit={{ x: 0 }}
                        transition={{
                            duration: 1.5,
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.5,
                        }}
                    >
                        {/* Velvet Texture/Folds */}
                        <div className="absolute inset-0 opacity-30" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.3) 70px, transparent 100px)'
                        }} />

                        {/* Gold Trim */}
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    </motion.div>

                    {/* Spotlights */}
                    <div className="absolute inset-0 overflow-hidden">
                        <SpotlightBeam delay={0.5} x={20} />
                        <SpotlightBeam delay={0.7} x={50} />
                        <SpotlightBeam delay={0.9} x={80} />
                    </div>

                    {/* Particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <Particle
                                key={i}
                                color={i % 2 === 0 ? 'bg-yellow-400' : 'bg-orange-400'}
                                delay={0.8 + i * 0.1}
                            />
                        ))}
                    </div>

                    {/* Main Content */}
                    <AnimatePresence>
                        {showContent && (
                            <div className="relative z-20 flex flex-col items-center">
                                {/* Phase Number with glow */}
                                <motion.div
                                    className="relative"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 200,
                                        damping: 15,
                                        delay: 0.1,
                                    }}
                                >
                                    {/* Glow effect */}
                                    <div className={`absolute inset-0 blur-3xl ${info.color} opacity-50`} />

                                    {/* Icon container */}
                                    <div className="relative bg-black/50 backdrop-blur-md rounded-full p-6 border-4 border-white/20">
                                        <motion.div
                                            animate={{
                                                rotate: [0, 5, -5, 0],
                                                scale: [1, 1.1, 1],
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                delay: 0.5,
                                            }}
                                        >
                                            <PhaseIcon phase={info.icon} size={80} />
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* Phase Number */}
                                <motion.div
                                    className="mt-6"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                    <span className="text-2xl md:text-3xl font-bold text-white/60 tracking-[0.3em] uppercase">
                                        Phase {info.number}
                                    </span>
                                </motion.div>

                                {/* Title */}
                                <motion.h1
                                    className={`text-5xl md:text-8xl font-black tracking-tight mt-2 ${info.color} drop-shadow-2xl`}
                                    initial={{ y: 50, opacity: 0, scale: 0.8 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: 0.4,
                                        duration: 0.6,
                                        type: "spring",
                                        stiffness: 100,
                                    }}
                                >
                                    {phaseNames.name.toUpperCase()}
                                </motion.h1>

                                {/* Subtitle */}
                                <motion.p
                                    className="text-xl md:text-2xl text-white/70 mt-4 font-medium tracking-wide"
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.4 }}
                                >
                                    {phaseNames.subtitle}
                                </motion.p>

                                {/* Team icons */}
                                <motion.div
                                    className="flex items-center gap-8 mt-8"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.4 }}
                                >
                                    <motion.div
                                        className="flex items-center gap-2 text-red-500"
                                        animate={{ x: [-5, 5, -5] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <Flame className="w-8 h-8" />
                                        <span className="font-bold text-lg">{t('teams.spicy').toUpperCase()}</span>
                                    </motion.div>

                                    <Trophy className="w-10 h-10 text-yellow-400" />

                                    <motion.div
                                        className="flex items-center gap-2 text-pink-500"
                                        animate={{ x: [5, -5, 5] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <span className="font-bold text-lg">{t('teams.sweet').toUpperCase()}</span>
                                        <Candy className="w-8 h-8" />
                                    </motion.div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Bottom decorative bar - OPACITY ONLY (no scaleX) */}
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-pink-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6, ease: organicEase }}
                    />

                    {/* Top decorative bar - OPACITY ONLY (no scaleX) */}
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-yellow-500 to-red-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.6, ease: organicEase }}
                    />
                </motion.div>
            )
            }
        </AnimatePresence >
    );
};

export default PhaseTransition;
