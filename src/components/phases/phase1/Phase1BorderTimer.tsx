import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { durations, organicEase } from '../../../animations';

interface Phase1BorderTimerProps {
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
    children: React.ReactNode;
}

/**
 * Phase 1 Border Timer
 *
 * A non-intrusive timer that displays as an animated border around the question card.
 * The border starts full (100%) and decreases to 0% as time runs out.
 * Color transitions from green -> yellow -> red as time decreases.
 *
 * Uses conic-gradient for the animated border effect.
 */
export function Phase1BorderTimer({
    timeRemaining,
    totalTime,
    isActive,
    children
}: Phase1BorderTimerProps) {
    const prefersReducedMotion = useReducedMotion();

    // Calculate progress (1 = full, 0 = empty)
    const progress = totalTime > 0 ? timeRemaining / totalTime : 1;

    // Determine color based on time remaining
    const { borderColor, glowColor } = useMemo(() => {
        const percentage = progress * 100;

        if (percentage <= 15) {
            // Urgent: Red
            return {
                borderColor: '#ef4444', // red-500
                glowColor: 'rgba(239, 68, 68, 0.4)'
            };
        } else if (percentage <= 30) {
            // Warning: Yellow
            return {
                borderColor: '#eab308', // yellow-500
                glowColor: 'rgba(234, 179, 8, 0.3)'
            };
        } else {
            // Normal: Green
            return {
                borderColor: '#22c55e', // green-500
                glowColor: 'rgba(34, 197, 94, 0.2)'
            };
        }
    }, [progress]);

    // Calculate the gradient angle (360 degrees = full, 0 degrees = empty)
    // Start from top (12 o'clock position) and go clockwise
    const gradientAngle = progress * 360;

    // Border width
    const borderWidth = 3;

    // Create the conic gradient for the border
    // The gradient goes from the border color to transparent
    const conicGradient = useMemo(() => {
        if (progress <= 0) {
            return 'transparent';
        }
        // Start from top (-90deg offset in conic-gradient = 12 o'clock)
        // Fill clockwise from top
        return `conic-gradient(from -90deg, ${borderColor} ${gradientAngle}deg, transparent ${gradientAngle}deg)`;
    }, [borderColor, gradientAngle, progress]);

    // Check if we should show urgency pulse
    const isUrgent = progress <= 0.15;
    const isWarning = progress <= 0.30 && progress > 0.15;

    return (
        <div className="relative w-full">
            {/* Outer container with the animated border */}
            <div
                className="relative rounded-xl overflow-visible"
                style={{
                    padding: `${borderWidth}px`,
                }}
            >
                {/* Animated border layer using pseudo-element technique */}
                <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                        background: conicGradient,
                        transition: prefersReducedMotion
                            ? 'none'
                            : `background ${durations.normal}s ease-out`,
                    }}
                />

                {/* Glow effect when active (behind the border) */}
                <AnimatePresence>
                    {isActive && (isUrgent || isWarning) && !prefersReducedMotion && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: isUrgent ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2]
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: isUrgent ? 0.5 : 1,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{
                                boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Inner content container */}
                <div
                    className="relative bg-slate-800/80 rounded-[10px] backdrop-blur-sm border-0 shadow-xl"
                    style={{
                        // Inner border radius slightly less than outer for smooth corners
                        borderRadius: `calc(0.75rem - ${borderWidth}px)`,
                    }}
                >
                    {children}
                </div>
            </div>

            {/* Small time indicator in corner (optional, subtle) */}
            <AnimatePresence>
                {isActive && timeRemaining > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: durations.fast, ease: organicEase }}
                        role="timer"
                        aria-live={isUrgent ? 'assertive' : 'polite'}
                        aria-atomic="true"
                        aria-label={`${timeRemaining} seconds remaining`}
                        className={`
                            absolute -top-2 -right-2
                            w-8 h-8 rounded-full
                            flex items-center justify-center
                            text-xs font-bold tabular-nums
                            shadow-lg border-2 border-slate-900
                            ${isUrgent
                                ? 'bg-red-500 text-white'
                                : isWarning
                                    ? 'bg-yellow-500 text-slate-900'
                                    : 'bg-slate-700 text-slate-300'
                            }
                        `}
                    >
                        {timeRemaining}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
