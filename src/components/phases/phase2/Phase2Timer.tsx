import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface Phase2TimerProps {
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
}

/**
 * A discreet timer bar for Phase 2 multiplayer mode.
 * Shows a thin progress bar that fades in subtly and changes color when urgent.
 */
export function Phase2Timer({ timeRemaining, totalTime, isActive }: Phase2TimerProps) {
    const prefersReducedMotion = useReducedMotion();
    const lastTickRef = useRef<number>(-1);

    // Calculate progress
    const progress = timeRemaining / totalTime;

    // Determine urgency level
    const isUrgent = timeRemaining <= 5;
    const isWarning = timeRemaining <= 10 && timeRemaining > 5;

    // Get bar color based on time remaining
    const getBarColor = () => {
        if (isUrgent) return 'bg-red-500';
        if (isWarning) return 'bg-yellow-400';
        return 'bg-white/50';
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

    if (!isActive) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-xs px-4"
        >
            {/* Discreet progress bar */}
            <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden backdrop-blur">
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

            {/* Time number - only visible when warning/urgent */}
            {(isWarning || isUrgent) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-center mt-1 text-xs font-bold tabular-nums ${
                        isUrgent ? 'text-red-400' : 'text-yellow-400'
                    }`}
                >
                    {timeRemaining}s
                </motion.div>
            )}
        </motion.div>
    );
}
