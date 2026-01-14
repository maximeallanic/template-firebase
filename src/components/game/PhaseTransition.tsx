import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhaseIcon } from './PhaseIcon';
import { Flame, Candy, Trophy, SkipForward } from 'lucide-react';
import { type PhaseStatus } from '../../services/gameService';
import { organicEase } from '../../animations';
import { usePhaseTranslation } from '../../hooks/useGameTranslation';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { audioService } from '../../services/audioService';

interface PhaseTransitionProps {
    phase: PhaseStatus;
    isVisible: boolean;
    onComplete: () => void;
    onCurtainsClosed?: () => void; // Called when curtains are fully closed (before they open)
    isHost?: boolean; // Whether the current user is the host (can skip)
    onSkip?: () => void; // Called when host skips the transition
}

const PHASE_INFO: Record<PhaseStatus, {
    number: number;
    icon: 'nuggets' | 'saltpepper' | 'menus' | 'addition' | 'burger';
    color: string;
    bgGradient: string;
    isVictory?: boolean;
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
        number: 0, // No phase number for victory
        icon: 'burger', // Will be overridden with Trophy in TransitionContent
        color: 'text-yellow-400',
        bgGradient: 'from-yellow-600/90 via-amber-500/80 to-yellow-600/90',
        isVictory: true, // Flag for special handling
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

// Transition Card component - modern dark gaming style
interface TransitionCardProps {
    children: React.ReactNode;
    isVisible: boolean;
    reducedMotion?: boolean;
    boardDuration?: number; // in ms
}

const TransitionCard: React.FC<TransitionCardProps> = ({
    children,
    isVisible,
    reducedMotion = false,
    boardDuration = BOARD_ANIMATION_DURATION
}) => {
    const durationSec = boardDuration / 1000;

    // Simple lateral slide animation
    const animateProps = isVisible
        ? { x: 0, opacity: 1 }
        : { x: '-100vw', opacity: 0 };

    const transitionProps = reducedMotion
        ? { duration: 0.3, ease: "easeOut" as const }
        : {
            duration: durationSec * 0.3, // Faster slide (30% of original duration)
            ease: [0.22, 1, 0.36, 1] as const, // Smooth ease-out
        };

    return (
        <motion.div
            className="relative p-8 md:p-12 max-w-2xl mx-4 rounded-3xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-md border border-white/10 shadow-2xl"
            initial={{ x: '-100vw', opacity: 0 }}
            animate={animateProps}
            exit={{ x: '100vw', opacity: 0 }}
            transition={transitionProps}
        >
            {children}
        </motion.div>
    );
};

// Transition content component - displays phase info with modern dark gaming style
interface TransitionContentProps {
    phase: PhaseStatus;
    getPhaseInfo: (phase: PhaseStatus) => { name: string; subtitle: string };
    t: (key: string) => string;
}

const TransitionContent: React.FC<TransitionContentProps> = ({ phase, getPhaseInfo, t }) => {
    const info = PHASE_INFO[phase];
    const phaseNames = getPhaseInfo(phase);
    const isVictory = info.isVictory;

    return (
        <div className="relative z-50 flex flex-col items-center text-center">
            {/* Icon container */}
            <div className="relative">
                {/* Subtle glow */}
                <div className={`absolute inset-0 blur-2xl rounded-full ${isVictory ? 'bg-yellow-500/40' : 'bg-white/10'}`} />

                {/* Icon with modern border */}
                <div
                    className={`relative rounded-2xl p-5 border-2 ${isVictory
                        ? 'bg-yellow-500/20 border-yellow-500/50'
                        : 'bg-white/10 border-white/20'}`}
                >
                    {isVictory ? (
                        <Trophy className="w-[60px] h-[60px] text-yellow-400" />
                    ) : (
                        <PhaseIcon phase={info.icon} size={60} />
                    )}
                </div>
            </div>

            {/* Phase Number (skip for victory) */}
            {!isVictory && (
                <div className="mt-4">
                    <span className="text-sm md:text-base text-white/60 font-bold tracking-widest uppercase">
                        {t('labels.phase')} {info.number}
                    </span>
                </div>
            )}

            {/* Title */}
            <h1
                className={`text-4xl md:text-6xl font-black ${isVictory ? 'mt-4' : 'mt-2'} ${isVictory ? 'text-yellow-400' : 'text-white'}`}
            >
                {phaseNames.name}
            </h1>

            {/* Simple separator */}
            <div className={`w-24 h-1 mt-4 rounded-full ${isVictory ? 'bg-yellow-500/50' : 'bg-white/20'}`} />

            {/* Subtitle */}
            <p className={`text-lg md:text-xl mt-4 ${isVictory ? 'text-yellow-300/80' : 'text-white/70'}`}>
                {phaseNames.subtitle}
            </p>

            {/* Team names */}
            <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-spicy-500/20 border border-spicy-500/30">
                    <Flame className="w-5 h-5 text-spicy-400" />
                    <span className="text-base font-semibold text-spicy-400">
                        {t('teams.spicy')}
                    </span>
                </div>

                <span className="text-xl font-bold text-white/40">
                    {t('labels.vs')}
                </span>

                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sweet-500/20 border border-sweet-500/30">
                    <span className="text-base font-semibold text-sweet-400">
                        {t('teams.sweet')}
                    </span>
                    <Candy className="w-5 h-5 text-sweet-400" />
                </div>
            </div>
        </div>
    );
};

// Animation timing constants (in ms) - Normal mode
const CURTAIN_CLOSE_DURATION = 800;   // 0.8s to close
const BOARD_ANIMATION_DURATION = 3500; // 3.5s total: 0.4s descent, 2.7s stable, 0.4s fall
const CURTAIN_OPEN_DURATION = 700;    // 0.7s to open
const TOTAL_DURATION = CURTAIN_CLOSE_DURATION + BOARD_ANIMATION_DURATION + CURTAIN_OPEN_DURATION; // 5s total

// Reduced motion timing (much faster, minimal animation)
const REDUCED_CURTAIN_CLOSE = 300;
const REDUCED_BOARD_DURATION = 1500;
const REDUCED_CURTAIN_OPEN = 200;
const REDUCED_TOTAL_DURATION = REDUCED_CURTAIN_CLOSE + REDUCED_BOARD_DURATION + REDUCED_CURTAIN_OPEN; // 2s total

export const PhaseTransition: React.FC<PhaseTransitionProps> = ({
    phase,
    isVisible,
    onComplete,
    onCurtainsClosed,
    isHost = false,
    onSkip
}) => {
    const [showContent, setShowContent] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [curtainsOpen, setCurtainsOpen] = useState(false);
    // Capture the phase when transition starts to prevent changes during animation
    const capturedPhaseRef = useRef<PhaseStatus>(phase);
    const { getPhaseInfo } = usePhaseTranslation();
    const { t } = useTranslation('common');
    const prefersReducedMotion = useReducedMotion();

    // Calculate timing based on reduced motion preference
    const curtainClose = prefersReducedMotion ? REDUCED_CURTAIN_CLOSE : CURTAIN_CLOSE_DURATION;
    const boardDuration = prefersReducedMotion ? REDUCED_BOARD_DURATION : BOARD_ANIMATION_DURATION;
    const totalDuration = prefersReducedMotion ? REDUCED_TOTAL_DURATION : TOTAL_DURATION;

    // Store callbacks in refs to avoid effect re-runs when callback references change
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;
    const onCurtainsClosedRef = useRef(onCurtainsClosed);
    onCurtainsClosedRef.current = onCurtainsClosed;
    const onSkipRef = useRef(onSkip);
    onSkipRef.current = onSkip;

    // Handle skip action
    const handleSkip = () => {
        if (isSkipping) return;
        setIsSkipping(true);
        // Immediately trigger curtains closed callback if not yet called
        onCurtainsClosedRef.current?.();
        // Then complete the transition
        setTimeout(() => {
            setShowContent(false);
            onCompleteRef.current();
            onSkipRef.current?.();
        }, 100);
    };

    useEffect(() => {
        if (isVisible) {
            // Reset states
            setIsSkipping(false);
            setCurtainsOpen(false);
            // Capture the phase at the START of the transition
            capturedPhaseRef.current = phase;

            // Play curtains closing sound immediately
            audioService.play('curtainsClose');

            // Timeline (adjusted for reduced motion):
            // Normal: 0-0.8s close, 0.8-4.3s board, 4.3-5s open
            // Reduced: 0-0.3s close, 0.3-1.8s board, 1.8-2s open

            // Call onCurtainsClosed when curtains are fully closed
            const curtainsClosedTimer = setTimeout(() => {
                onCurtainsClosedRef.current?.();
            }, curtainClose);

            // Show chalkboard after curtains closed + play dish ready sound
            const showContentTimer = setTimeout(() => {
                setShowContent(true);
                audioService.play('dishReady');
            }, curtainClose);

            // Hide chalkboard after its animation completes (before curtains open)
            const hideContentTimer = setTimeout(() => {
                setShowContent(false);
            }, curtainClose + boardDuration);

            // Enable pointer events when curtains start opening + play curtains open sound
            const curtainsOpenTimer = setTimeout(() => {
                setCurtainsOpen(true);
                audioService.play('curtainsOpen');
            }, curtainClose + boardDuration);

            // Complete animation
            const completeTimer = setTimeout(() => {
                onCompleteRef.current();
            }, totalDuration);

            return () => {
                clearTimeout(curtainsClosedTimer);
                clearTimeout(showContentTimer);
                clearTimeout(hideContentTimer);
                clearTimeout(curtainsOpenTimer);
                clearTimeout(completeTimer);
            };
        } else {
            setShowContent(false);
            setIsSkipping(false);
            setCurtainsOpen(false);
        }
    }, [isVisible, phase, curtainClose, boardDuration, totalDuration]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={`fixed inset-0 z-[200] flex items-center justify-center overflow-hidden ${curtainsOpen ? 'pointer-events-none' : ''}`}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Skip Button for Host */}
                    {isHost && !isSkipping && (
                        <motion.button
                            className="absolute top-4 right-4 z-[300] pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
                            onClick={handleSkip}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <SkipForward className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('buttons.skip', 'Skip')}</span>
                        </motion.button>
                    )}

                    {/* TV Effects - visible when curtains closed (skip for reduced motion) */}
                    {!prefersReducedMotion && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none z-40"
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 0, 1, 1, 0, 0],
                            }}
                            transition={{
                                duration: totalDuration / 1000,
                                // Visible while curtains closed (16% to 86%)
                                times: [0, 0.14, 0.18, 0.82, 0.88, 1],
                                ease: "easeInOut",
                            }}
                        >
                            <TVStatic />
                            <Scanlines />
                        </motion.div>
                    )}

                    {/* Curtain Left - with fabric sway physics */}
                    <motion.div
                        className="absolute top-0 h-full z-30"
                        style={{
                            left: '-5%',
                            width: '55%',
                            background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
                            boxShadow: '10px 0 20px rgba(0,0,0,0.5)',
                            transformOrigin: 'top center',
                        }}
                        initial={{ x: '-100%', skewX: 0 }}
                        animate={{
                            // Close (0-16%), stay closed (16-84%), open (84-100%)
                            x: ['calc(-100% - 10px)', '0%', '0%', 'calc(-100% - 10px)'],
                            // Fabric sway: swing on close, settle, swing on open, settle (skip for reduced motion)
                            skewX: prefersReducedMotion ? 0 : [0, -8, 3, 0, 0, 0, 8, -3, 0],
                        }}
                        exit={{ x: '0%', skewX: 0 }}
                        transition={{
                            duration: totalDuration / 1000,
                            x: {
                                duration: totalDuration / 1000,
                                times: [0, 0.16, 0.84, 1],
                                ease: "easeInOut",
                            },
                            skewX: prefersReducedMotion ? { duration: 0 } : {
                                duration: totalDuration / 1000,
                                // Sway timing: close swing, settle, hold, open swing, settle
                                times: [0, 0.08, 0.14, 0.16, 0.84, 0.86, 0.92, 0.96, 1],
                                ease: "easeOut",
                            }
                        }}
                    >
                        {/* Velvet Texture/Folds - enhanced for depth */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.4) 50px, rgba(0,0,0,0.2) 60px, transparent 80px)'
                        }} />

                        {/* Highlight fold */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.3) 35px, transparent 45px)'
                        }} />

                        {/* Gold Trim with subtle shimmer */}
                        <motion.div
                            className="absolute right-0 top-0 h-full w-2 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                            animate={{
                                boxShadow: [
                                    '0 0 15px rgba(234,179,8,0.6)',
                                    '0 0 25px rgba(234,179,8,0.8)',
                                    '0 0 15px rgba(234,179,8,0.6)'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>

                    {/* Curtain Right - with fabric sway physics (mirrored) */}
                    <motion.div
                        className="absolute top-0 h-full z-30"
                        style={{
                            right: '-5%',
                            width: '55%',
                            background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%)',
                            boxShadow: '-10px 0 20px rgba(0,0,0,0.5)',
                            transformOrigin: 'top center',
                        }}
                        initial={{ x: '100%', skewX: 0 }}
                        animate={{
                            // Close (0-16%), stay closed (16-84%), open (84-100%)
                            x: ['calc(100% + 10px)', '0%', '0%', 'calc(100% + 10px)'],
                            // Mirrored sway: opposite direction to left curtain (skip for reduced motion)
                            skewX: prefersReducedMotion ? 0 : [0, 8, -3, 0, 0, 0, -8, 3, 0],
                        }}
                        exit={{ x: '0%', skewX: 0 }}
                        transition={{
                            duration: totalDuration / 1000,
                            delay: prefersReducedMotion ? 0 : 0.03,
                            x: {
                                duration: totalDuration / 1000,
                                times: [0, 0.16, 0.84, 1],
                                ease: "easeInOut",
                            },
                            skewX: prefersReducedMotion ? { duration: 0 } : {
                                duration: totalDuration / 1000,
                                // Sway timing: close swing, settle, hold, open swing, settle
                                times: [0, 0.08, 0.14, 0.16, 0.84, 0.86, 0.92, 0.96, 1],
                                ease: "easeOut",
                            }
                        }}
                    >
                        {/* Velvet Texture/Folds - enhanced for depth */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.4) 50px, rgba(0,0,0,0.2) 60px, transparent 80px)'
                        }} />

                        {/* Highlight fold */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(255,255,255,0.3) 35px, transparent 45px)'
                        }} />

                        {/* Gold Trim with subtle shimmer */}
                        <motion.div
                            className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                            animate={{
                                boxShadow: [
                                    '0 0 15px rgba(234,179,8,0.6)',
                                    '0 0 25px rgba(234,179,8,0.8)',
                                    '0 0 15px rgba(234,179,8,0.6)'
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                    </motion.div>

                    {/* Spotlights - start when curtain opens (at 84%) - skip for reduced motion */}
                    {!prefersReducedMotion && (
                        <div className="absolute inset-0 overflow-hidden">
                            <SpotlightBeam delay={(totalDuration * 0.84) / 1000} x={20} />
                            <SpotlightBeam delay={(totalDuration * 0.84) / 1000 + 0.15} x={50} />
                            <SpotlightBeam delay={(totalDuration * 0.84) / 1000 + 0.3} x={80} />
                        </div>
                    )}

                    {/* Particles - start when curtain opens - skip for reduced motion */}
                    {!prefersReducedMotion && (
                        <div className="absolute inset-0 overflow-hidden">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <Particle
                                    key={i}
                                    color={i % 2 === 0 ? 'bg-yellow-400' : 'bg-orange-400'}
                                    delay={(totalDuration * 0.84) / 1000 + i * 0.04}
                                />
                            ))}
                        </div>
                    )}

                    {/* Main Content - Transition Card */}
                    <div className="absolute inset-0 flex items-center justify-center z-50">
                        <AnimatePresence>
                            {showContent && (
                                <TransitionCard
                                    isVisible={showContent}
                                    reducedMotion={prefersReducedMotion}
                                    boardDuration={boardDuration}
                                >
                                    <TransitionContent
                                        phase={capturedPhaseRef.current}
                                        getPhaseInfo={getPhaseInfo}
                                        t={t}
                                    />
                                </TransitionCard>
                            )}
                        </AnimatePresence>
                    </div>

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
