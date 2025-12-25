import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { organicEase, durations } from '../../../animations';

interface Phase4TimerProps {
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
}

// Number of dots to display (groups of time)
const TOTAL_DOTS = 10;

export function Phase4Timer({ timeRemaining, totalTime, isActive }: Phase4TimerProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const lastTickRef = useRef<number>(-1);

    // Calculate how many dots should be active
    const progress = timeRemaining / totalTime;
    const activeDots = Math.ceil(progress * TOTAL_DOTS);

    // Determine urgency level
    const isUrgent = timeRemaining <= 5;
    const isWarning = timeRemaining <= 10 && timeRemaining > 5;

    // Get dot color based on time remaining
    const getDotColor = () => {
        if (isUrgent) return 'bg-red-500';
        if (isWarning) return 'bg-yellow-400';
        return 'bg-green-500';
    };

    // Get bar color for mobile progress bar
    const getBarColor = () => {
        if (isUrgent) return 'bg-red-500';
        if (isWarning) return 'bg-yellow-400';
        return 'bg-white/50';
    };

    // Get glow color for shadow
    const getGlowClass = () => {
        if (isUrgent) return 'shadow-red-500/50';
        if (isWarning) return 'shadow-yellow-400/40';
        return 'shadow-green-500/30';
    };

    // Play tick sound when timer is urgent (< 5s)
    useEffect(() => {
        if (isActive && isUrgent && timeRemaining > 0 && timeRemaining !== lastTickRef.current) {
            audioService.playTimerTick();
            lastTickRef.current = timeRemaining;
        }
    }, [isActive, isUrgent, timeRemaining]);

    // Reset tick tracker when timer becomes inactive
    useEffect(() => {
        if (!isActive) {
            lastTickRef.current = -1;
        }
    }, [isActive]);

    // Create dot animation variants
    const dotVariants = {
        active: (i: number) => ({
            scale: 1,
            opacity: 1,
            transition: {
                duration: durations.fast,
                ease: organicEase,
                delay: i * 0.02
            }
        }),
        inactive: {
            scale: 0.3,
            opacity: 0.2,
            transition: {
                duration: durations.normal,
                ease: organicEase
            }
        },
        pulse: (i: number) => ({
            scale: [1, 1.3, 1],
            transition: {
                duration: 0.6,
                repeat: Infinity,
                ease: 'easeInOut' as const,
                delay: i * 0.1
            }
        })
    };

    // SVG circle parameters for progress ring
    const circleSize = 64;
    const strokeWidth = 4;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    // Get stroke color based on urgency
    const getStrokeColor = () => {
        if (isUrgent) return '#f87171'; // red-400
        if (isWarning) return '#facc15'; // yellow-400
        return '#4ade80'; // green-400
    };

    return (
        <>
            {/* Mobile: Simple progress bar with number on the right */}
            <div className="md:hidden w-full max-w-xs mx-auto flex items-center gap-2">
                <div className="flex-1 relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur">
                    <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${getBarColor()} transition-colors duration-300`}
                        initial={{ width: '100%' }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.3, ease: 'linear' }}
                    />
                    {/* Pulse effect when urgent */}
                    {isUrgent && !prefersReducedMotion && (
                        <motion.div
                            className="absolute inset-0 bg-red-500/30 rounded-full"
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    )}
                </div>
                {/* Time number on the right */}
                <span
                    className={`text-xs font-bold tabular-nums min-w-[24px] text-right ${
                        isUrgent ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white/70'
                    }`}
                >
                    {timeRemaining}s
                </span>
            </div>

            {/* Desktop: Full timer with circle and dots */}
            <div className="hidden md:flex items-center gap-3">
                {/* Timer Display */}
                <div className="flex flex-col items-center gap-2">
                    {/* Number Display with Progress Ring */}
                    <div className="relative" style={{ width: circleSize, height: circleSize }}>
                    {/* Background circle */}
                    <svg
                        className="absolute inset-0 -rotate-90"
                        width={circleSize}
                        height={circleSize}
                    >
                        <circle
                            cx={circleSize / 2}
                            cy={circleSize / 2}
                            r={radius}
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            fill="none"
                            className="text-slate-700"
                        />
                        {/* Progress circle */}
                        <circle
                            cx={circleSize / 2}
                            cy={circleSize / 2}
                            r={radius}
                            stroke={getStrokeColor()}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>

                    {/* Number centered in circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={timeRemaining}
                                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.2 }}
                                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15, ease: organicEase }}
                                className={`
                                    text-2xl md:text-3xl font-black tabular-nums
                                    ${isUrgent ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'}
                                `}
                            >
                                {timeRemaining}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    {/* Pulse ring when urgent */}
                    {isUrgent && !prefersReducedMotion && (
                        <motion.div
                            className="absolute -inset-1 rounded-full border-2 border-red-500/30"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.3, opacity: 0 }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: 'easeOut'
                            }}
                        />
                    )}
                </div>

                {/* Progressive Dots Bar */}
                <div className="flex gap-1" role="progressbar" aria-valuenow={timeRemaining} aria-valuemin={0} aria-valuemax={totalTime}>
                    {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
                        const isActiveDot = i < activeDots;
                        const shouldPulse = isUrgent && isActiveDot && !prefersReducedMotion;

                        return (
                            <motion.div
                                key={i}
                                custom={i}
                                variants={dotVariants}
                                initial="inactive"
                                animate={shouldPulse ? 'pulse' : isActiveDot ? 'active' : 'inactive'}
                                className={`
                                    w-2 h-2 md:w-2.5 md:h-2.5 rounded-full
                                    ${isActiveDot ? getDotColor() : 'bg-slate-700'}
                                    ${isActiveDot ? `shadow-lg ${getGlowClass()}` : ''}
                                `}
                            />
                        );
                    })}
                </div>
            </div>

                {/* Label */}
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {t('phase4.timer')}
                    </span>
                    <span
                        className={`text-sm font-bold ${
                            isUrgent ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-slate-300'
                        }`}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {isUrgent
                            ? t('phase4.hurry')
                            : t('phase4.timeRemaining', { seconds: timeRemaining })
                        }
                    </span>
                </div>
            </div>
        </>
    );
}
