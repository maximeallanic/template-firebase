/**
 * TeammatePointer - Individual teammate cursor with avatar and ripple effect
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AvatarIcon } from '../AvatarIcon';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { TeammateCursor } from '../../types/cursorTypes';

type TeammatePointerProps = TeammateCursor;

// Team color configurations
const teamColors = {
    spicy: {
        border: 'border-red-500',
        bg: 'bg-red-500/20',
        shadow: 'shadow-red-500/40',
        ripple: 'bg-red-500',
        text: 'text-red-100',
        labelBg: 'bg-red-900/90',
    },
    sweet: {
        border: 'border-pink-500',
        bg: 'bg-pink-500/20',
        shadow: 'shadow-pink-500/40',
        ripple: 'bg-pink-500',
        text: 'text-pink-100',
        labelBg: 'bg-pink-900/90',
    },
};

// Spring config aligned with 100ms polling interval
const cursorTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
    mass: 0.5,
};

// Reduced motion transition
const reducedMotionTransition = {
    duration: 0,
};

// Ripple animation variants
const rippleVariants = {
    initial: { scale: 0.5, opacity: 0.7 },
    animate: {
        scale: 2.5,
        opacity: 0,
        transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const },
    },
};

export function TeammatePointer({
    playerId,
    name,
    avatar,
    team,
    x,
    y,
    isTouch,
    interaction,
}: TeammatePointerProps) {
    const prefersReducedMotion = useReducedMotion();
    const colors = teamColors[team];

    // Use reduced motion settings
    const motionTransition = prefersReducedMotion ? reducedMotionTransition : cursorTransition;

    return (
        <motion.div
            key={playerId}
            className="absolute pointer-events-none"
            style={{
                left: 0,
                top: 0,
            }}
            initial={{ opacity: 0, scale: 0, x: x - 12, y: y - 12 }}
            animate={{
                opacity: 1,
                scale: 1,
                x: x - 12, // Center the 24px avatar
                y: y - 12,
            }}
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.15 } }}
            transition={motionTransition}
        >
            {/* Ripple effect on click/tap */}
            <AnimatePresence>
                {interaction && (
                    <motion.div
                        key={`ripple-${interaction.startTime}`}
                        className={`absolute w-6 h-6 rounded-full ${colors.ripple} opacity-70`}
                        style={{
                            left: 0,
                            top: 0,
                        }}
                        variants={rippleVariants}
                        initial="initial"
                        animate="animate"
                    />
                )}
            </AnimatePresence>

            {/* Avatar with team-colored ring */}
            <div
                className={`
                    relative w-6 h-6 rounded-full
                    ${colors.border} ${colors.bg}
                    border-2 shadow-lg ${colors.shadow}
                    flex items-center justify-center
                    overflow-hidden
                `}
            >
                <AvatarIcon avatar={avatar} size={20} />

                {/* Touch indicator (finger icon overlay) */}
                {isTouch && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-white rounded-full border border-slate-400 flex items-center justify-center">
                        <span className="text-[6px]">👆</span>
                    </div>
                )}
            </div>

            {/* Player name label */}
            <div
                className={`
                    absolute left-1/2 -translate-x-1/2 top-7
                    ${colors.labelBg} ${colors.text}
                    text-[10px] font-medium
                    px-1.5 py-0.5 rounded
                    whitespace-nowrap
                    shadow-sm
                    max-w-20 truncate
                `}
            >
                {name}
            </div>
        </motion.div>
    );
}
