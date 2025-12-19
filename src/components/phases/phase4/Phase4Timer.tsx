import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { organicEase, durations, snappySpring } from '../../../animations';

interface Phase4TimerProps {
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
}

// SVG circle properties
const CIRCLE_RADIUS = 36;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

export function Phase4Timer({ timeRemaining, totalTime, isActive }: Phase4TimerProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const lastTickRef = useRef<number>(-1);

    // Calculate progress (0 to 1)
    const progress = timeRemaining / totalTime;
    const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

    // Determine urgency level
    const isUrgent = timeRemaining <= 5;
    const isWarning = timeRemaining <= 10 && timeRemaining > 5;

    // Get color based on time remaining
    const getStrokeColor = () => {
        if (isUrgent) return '#ef4444'; // red-500
        if (isWarning) return '#eab308'; // yellow-500
        return '#22c55e'; // green-500
    };

    // Get glow color for shadow
    const getGlowColor = () => {
        if (isUrgent) return 'rgba(239, 68, 68, 0.5)';
        if (isWarning) return 'rgba(234, 179, 8, 0.4)';
        return 'rgba(34, 197, 94, 0.3)';
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

    return (
        <div className="flex items-center gap-3">
            {/* Circular Timer with SVG Ring */}
            <motion.div
                className="relative"
                animate={
                    !prefersReducedMotion && isUrgent
                        ? { scale: [1, 1.05, 1] }
                        : { scale: 1 }
                }
                transition={
                    isUrgent
                        ? { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: durations.fast }
                }
            >
                {/* Background ring (track) */}
                <svg
                    className="w-16 h-16 md:w-20 md:h-20 -rotate-90"
                    viewBox="0 0 80 80"
                    aria-hidden="true"
                >
                    <circle
                        cx="40"
                        cy="40"
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="6"
                    />

                    {/* Progress ring */}
                    <motion.circle
                        cx="40"
                        cy="40"
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke={getStrokeColor()}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={CIRCLE_CIRCUMFERENCE}
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: organicEase }}
                        style={{
                            filter: `drop-shadow(0 0 8px ${getGlowColor()})`
                        }}
                    />
                </svg>

                {/* Center number */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={timeRemaining}
                            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.3, y: -5 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 5 }}
                            transition={prefersReducedMotion ? { duration: 0.1 } : snappySpring}
                            className={`
                                text-2xl md:text-3xl font-black tabular-nums
                                ${isUrgent ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'}
                            `}
                        >
                            {timeRemaining}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Pulse ring (urgent only) */}
                {isUrgent && !prefersReducedMotion && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-red-500/50"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'easeOut'
                        }}
                    />
                )}
            </motion.div>

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
    );
}
