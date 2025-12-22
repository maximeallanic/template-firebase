import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhaseIcon } from './PhaseIcon';
import { Flame, Candy, Trophy, SkipForward } from 'lucide-react';
import { type PhaseStatus } from '../../services/gameService';
import { organicEase } from '../../animations';
import { usePhaseTranslation } from '../../hooks/useGameTranslation';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../../hooks/useReducedMotion';

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

// Chalkboard Panel component - restaurant-style blackboard with wood frame
interface ChalkboardPanelProps {
    children: React.ReactNode;
    isVisible: boolean;
    reducedMotion?: boolean;
    boardDuration?: number; // in ms
}

const ChalkboardPanel: React.FC<ChalkboardPanelProps> = ({
    children,
    isVisible,
    reducedMotion = false,
    boardDuration = BOARD_ANIMATION_DURATION
}) => {
    const boardThickness = 30; // pixels - visible thickness when falling
    const durationSec = boardDuration / 1000;

    // Simplified animation for reduced motion
    const animateProps = reducedMotion
        ? {
            y: isVisible ? '35vh' : '-60vh',
            opacity: isVisible ? 1 : 0,
        }
        : isVisible ? {
            // Suspended descent - lowered gently like hanging from ropes
            y: ['-60vh', '-30vh', '33vh', '36vh', '35vh', '35vh'],
            // Subtle natural sway - like suspended from two ropes
            rotateZ: [1.5, -1, 0.5, -0.3, 0.1, 0],
            // Slight tension release when settled
            scale: [0.98, 1, 1, 1, 1, 1],
            // Gentle tilt at the end instead of full fall
            rotateX: [0, 0, 0, 0, 0, 25],
            // Shadow follows the descent
            boxShadow: [
                '0 -20px 40px rgba(0,0,0,0.2), inset 0 0 100px rgba(0,0,0,0.5)',
                '0 -10px 30px rgba(0,0,0,0.25), inset 0 0 100px rgba(0,0,0,0.5)',
                '0 8px 35px rgba(0,0,0,0.35), inset 0 0 100px rgba(0,0,0,0.5)',
                '0 10px 30px rgba(0,0,0,0.4), inset 0 0 100px rgba(0,0,0,0.5)',
                '0 8px 25px rgba(0,0,0,0.35), inset 0 0 100px rgba(0,0,0,0.5)',
                '0 5px 20px rgba(0,0,0,0.3), inset 0 0 100px rgba(0,0,0,0.5)',
            ],
        } : { y: '-60vh', rotateX: 0, rotateZ: 1.5, scale: 0.98 };

    const transitionProps = reducedMotion
        ? { duration: 0.3, ease: "easeOut" as const }
        : {
            duration: durationSec,
            // Suspended descent: slow start, acceleration, rope braking, settle, rest
            times: [0, 0.25, 0.55, 0.70, 0.85, 1],
            ease: [0.33, 0, 0.2, 1] as const,  // Slow start, soft landing
        };

    return (
        <motion.div
            className="relative p-8 md:p-12 max-w-2xl mx-4 rounded-sm"
            style={{
                // Black chalkboard background
                background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)',
                // Wood frame effect
                border: '16px solid #8B4513',
                borderImage: 'linear-gradient(135deg, #8B4513 0%, #D2691E 25%, #A0522D 50%, #D2691E 75%, #8B4513 100%) 1',
                // Static shadow for reduced motion (animated shadow overrides in normal mode)
                boxShadow: reducedMotion
                    ? 'inset 0 0 100px rgba(0,0,0,0.5), 0 8px 25px rgba(0,0,0,0.35)'
                    : undefined,
                // Pivot point for fall animation - bottom edge
                transformOrigin: 'bottom center',
                transformStyle: reducedMotion ? undefined : 'preserve-3d',
            }}
            initial={{ y: '-60vh', rotateX: 0, rotateZ: reducedMotion ? 0 : 1.5, scale: reducedMotion ? 1 : 0.98, opacity: 1 }}
            animate={animateProps}
            exit={{ y: '100vh', rotateX: 0, opacity: 0 }}
            transition={transitionProps}
        >
            {/* 3D THICKNESS - Bottom edge (visible when board falls forward) */}
            <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                    bottom: 0,
                    height: `${boardThickness}px`,
                    background: 'linear-gradient(180deg, #5D3A1A 0%, #3D2510 50%, #2D1A0A 100%)',
                    transform: `translateY(100%) rotateX(-90deg)`,
                    transformOrigin: 'top center',
                    boxShadow: 'inset 0 -5px 15px rgba(0,0,0,0.5)',
                }}
            />

            {/* 3D THICKNESS - Left edge */}
            <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                    left: 0,
                    width: `${boardThickness}px`,
                    background: 'linear-gradient(90deg, #3D2510 0%, #5D3A1A 100%)',
                    transform: `translateX(-100%) rotateY(90deg)`,
                    transformOrigin: 'right center',
                    boxShadow: 'inset 5px 0 15px rgba(0,0,0,0.5)',
                }}
            />

            {/* 3D THICKNESS - Right edge */}
            <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                    right: 0,
                    width: `${boardThickness}px`,
                    background: 'linear-gradient(90deg, #5D3A1A 0%, #3D2510 100%)',
                    transform: `translateX(100%) rotateY(-90deg)`,
                    transformOrigin: 'left center',
                    boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.5)',
                }}
            />

            {/* Chalk dust texture */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none rounded-sm"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />
            {/* Erased chalk traces */}
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(255,255,255,0.1) 0%, transparent 40%)',
                }}
            />
            {children}
        </motion.div>
    );
};

// Transition content component - displays phase info with chalk style
interface TransitionContentProps {
    phase: PhaseStatus;
    getPhaseInfo: (phase: PhaseStatus) => { name: string; subtitle: string };
    t: (key: string) => string;
}

const TransitionContent: React.FC<TransitionContentProps> = ({ phase, getPhaseInfo, t }) => {
    const info = PHASE_INFO[phase];
    const phaseNames = getPhaseInfo(phase);
    const isVictory = info.isVictory;

    // Handwriting font style - natural chalk look
    const handwritingFont = '"Segoe Script", "Bradley Hand", "Comic Sans MS", cursive';
    // Chalk text shadow for realistic chalk effect
    const chalkShadow = '1px 1px 2px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.1)';

    return (
        <div className="relative z-50 flex flex-col items-center text-center">
            {/* Icon container - no animation */}
            <div className="relative">
                {/* Subtle chalk glow - gold for victory */}
                <div className={`absolute inset-0 blur-2xl rounded-full ${isVictory ? 'bg-yellow-400/20' : 'bg-white/10'}`} />

                {/* Icon with chalk-style border */}
                <div
                    className={`relative rounded-full p-5 border-2 ${isVictory ? 'border-yellow-400/70' : 'border-white/50'}`}
                    style={{
                        background: isVictory ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.03)',
                    }}
                >
                    {isVictory ? (
                        <Trophy className="w-[60px] h-[60px] text-yellow-400" />
                    ) : (
                        <PhaseIcon phase={info.icon} size={60} />
                    )}
                </div>
            </div>

            {/* Phase Number - handwriting style (skip for victory) */}
            {!isVictory && (
                <div className="mt-4">
                    <span
                        className="text-lg md:text-xl text-white/90 tracking-wider"
                        style={{
                            fontFamily: handwritingFont,
                            textShadow: chalkShadow,
                        }}
                    >
                        ~ Phase {info.number} ~
                    </span>
                </div>
            )}

            {/* Title - large handwriting style */}
            <h1
                className={`text-5xl md:text-8xl ${isVictory ? 'mt-4' : 'mt-1'} ${isVictory ? 'text-yellow-400' : 'text-white'}`}
                style={{
                    fontFamily: handwritingFont,
                    textShadow: isVictory
                        ? '2px 2px 4px rgba(234,179,8,0.3), 0 0 20px rgba(234,179,8,0.2)'
                        : '2px 2px 4px rgba(255,255,255,0.2), 0 0 15px rgba(255,255,255,0.1)',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                }}
            >
                {phaseNames.name}
            </h1>

            {/* Decorative chalk underline - hand-drawn style (gold for victory) */}
            <svg
                className="w-56 h-3 mt-2"
                viewBox="0 0 200 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M5 6 Q 30 2, 60 7 T 100 5 T 140 8 T 195 5"
                    stroke={isVictory ? 'rgba(234,179,8,0.6)' : 'rgba(255,255,255,0.5)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            </svg>

            {/* Subtitle - handwriting style */}
            <p
                className={`text-xl md:text-2xl mt-3 ${isVictory ? 'text-yellow-200/90' : 'text-white/80'}`}
                style={{
                    fontFamily: handwritingFont,
                    textShadow: chalkShadow,
                    fontStyle: 'italic',
                }}
            >
                "{phaseNames.subtitle}"
            </p>

            {/* Team names - handwriting style */}
            <div className="flex items-center gap-8 mt-6">
                <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-red-400" />
                    <span
                        className="text-lg text-red-300"
                        style={{
                            fontFamily: handwritingFont,
                            textShadow: chalkShadow,
                        }}
                    >
                        {t('teams.spicy')}
                    </span>
                </div>

                <span
                    className="text-2xl text-white/60"
                    style={{ fontFamily: handwritingFont }}
                >
                    vs
                </span>

                <div className="flex items-center gap-2">
                    <span
                        className="text-lg text-pink-300"
                        style={{
                            fontFamily: handwritingFont,
                            textShadow: chalkShadow,
                        }}
                    >
                        {t('teams.sweet')}
                    </span>
                    <Candy className="w-5 h-5 text-pink-400" />
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

            // Timeline (adjusted for reduced motion):
            // Normal: 0-0.8s close, 0.8-4.3s board, 4.3-5s open
            // Reduced: 0-0.3s close, 0.3-1.8s board, 1.8-2s open

            // Call onCurtainsClosed when curtains are fully closed
            const curtainsClosedTimer = setTimeout(() => {
                onCurtainsClosedRef.current?.();
            }, curtainClose);

            // Show chalkboard after curtains closed
            const showContentTimer = setTimeout(() => {
                setShowContent(true);
            }, curtainClose);

            // Hide chalkboard after its animation completes (before curtains open)
            const hideContentTimer = setTimeout(() => {
                setShowContent(false);
            }, curtainClose + boardDuration);

            // Enable pointer events when curtains start opening
            const curtainsOpenTimer = setTimeout(() => {
                setCurtainsOpen(true);
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

                    {/* Main Content - Chalkboard with 3D perspective for fall animation */}
                    <div
                        className="absolute inset-0 flex items-center justify-center z-50"
                        style={{ perspective: prefersReducedMotion ? undefined : '1000px' }}
                    >
                        <AnimatePresence>
                            {showContent && (
                                <ChalkboardPanel
                                    isVisible={showContent}
                                    reducedMotion={prefersReducedMotion}
                                    boardDuration={boardDuration}
                                >
                                    <TransitionContent
                                        phase={capturedPhaseRef.current}
                                        getPhaseInfo={getPhaseInfo}
                                        t={t}
                                    />
                                </ChalkboardPanel>
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
