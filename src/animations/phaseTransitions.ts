/**
 * Phase-Specific Transition Animations
 *
 * Each phase has a unique transition style that matches its gameplay:
 * - Phase 2: Card shuffle (swipe mechanic)
 * - Phase 3: Menu unfold (restaurant theme)
 * - Phase 4: Buzzer pulse (quiz show urgency)
 * - Phase 5: Finale burst (grand finale)
 */

import type { Variants } from 'framer-motion';
import { organicEase, durations, springConfig, bouncySpring } from './index';

// ============================================================================
// PHASE 2 - Card Shuffle Transition
// ============================================================================

export const phase2CardVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        rotateZ: -15,
        y: 50
    },
    visible: {
        opacity: 1,
        scale: 1,
        rotateZ: 0,
        y: 0,
        transition: {
            ...springConfig,
            staggerChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: -30,
        transition: { duration: durations.fast }
    }
};

export const phase2StackedCardVariants: Variants = {
    hidden: (i: number) => ({
        opacity: 0,
        scale: 0.9,
        rotateZ: (i - 1) * 5, // -5, 0, 5 degrees
        x: (i - 1) * 10 // stacked offset
    }),
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        rotateZ: (i - 1) * 3,
        x: (i - 1) * 8,
        transition: {
            delay: i * 0.1,
            ...springConfig
        }
    }),
    shuffle: {
        rotateZ: [0, 10, -10, 5, 0],
        x: [0, 20, -20, 10, 0],
        transition: { duration: 0.6, ease: organicEase }
    }
};

// ============================================================================
// PHASE 3 - Menu Unfold Transition
// ============================================================================

export const phase3MenuVariants: Variants = {
    hidden: {
        opacity: 0,
        scaleY: 0,
        originY: 0
    },
    visible: {
        opacity: 1,
        scaleY: 1,
        transition: {
            duration: durations.medium,
            ease: organicEase
        }
    },
    exit: {
        opacity: 0,
        scaleY: 0,
        transition: { duration: durations.fast }
    }
};

export const phase3ThemeRevealVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 30,
        rotateX: -15
    },
    visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: {
            duration: durations.normal,
            ease: organicEase
        }
    }
};

// ============================================================================
// PHASE 4 - Buzzer Pulse Transition
// ============================================================================

export const phase4BuzzerVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: bouncySpring
    },
    pulse: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 0.5,
            repeat: 2,
            ease: 'easeInOut'
        }
    }
};

export const phase4RippleVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.5
    },
    visible: {
        opacity: [0, 0.5, 0],
        scale: [0.5, 2, 3],
        transition: {
            duration: 1,
            ease: organicEase
        }
    }
};

export const phase4TimerRingVariants: Variants = {
    normal: {
        scale: 1,
        borderColor: 'rgba(34, 197, 94, 0.5)' // green
    },
    warning: {
        scale: 1,
        borderColor: 'rgba(234, 179, 8, 0.5)' // yellow
    },
    urgent: {
        scale: [1, 1.05, 1],
        borderColor: 'rgba(239, 68, 68, 0.5)', // red
        transition: {
            scale: {
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut'
            }
        }
    }
};

// ============================================================================
// PHASE 5 - Finale Burst Transition
// ============================================================================

export const phase5BurstVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            ...bouncySpring,
            staggerChildren: 0.05
        }
    }
};

export const phase5StarVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0,
        rotate: -180
    },
    visible: (i: number) => ({
        opacity: [0, 1, 0.5],
        scale: [0, 1.5, 1],
        rotate: 0,
        transition: {
            delay: i * 0.1,
            duration: durations.slow,
            ease: organicEase
        }
    })
};

// ============================================================================
// Shared Transition Container Variants
// ============================================================================

export const transitionBackdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: durations.fast }
    },
    exit: {
        opacity: 0,
        transition: { duration: durations.fast }
    }
};

export const transitionContentVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: springConfig
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
        transition: { duration: durations.fast }
    }
};

export const transitionProgressVariants: Variants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: (progress: number) => ({
        scaleX: progress,
        transition: { duration: durations.medium, ease: organicEase }
    })
};

// ============================================================================
// Timer-specific Variants (for Phase 4)
// ============================================================================

export const timerCountdownVariants: Variants = {
    enter: {
        opacity: 0,
        y: -20,
        scale: 1.5
    },
    center: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { ...springConfig }
    },
    exit: {
        opacity: 0,
        y: 20,
        scale: 0.5,
        transition: { duration: durations.fast }
    }
};

// ============================================================================
// Staggered Options Variants (for Phase 4 MCQ)
// ============================================================================

export const optionsContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        transition: { duration: durations.fast }
    }
};

export const optionItemVariants: Variants = {
    hidden: {
        opacity: 0,
        x: -20,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            duration: durations.normal,
            ease: organicEase
        }
    },
    exit: {
        opacity: 0,
        x: 20,
        transition: { duration: durations.fast }
    }
};

// Reduced motion versions
export const optionsContainerReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.fast } }
};

export const optionItemReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: durations.fast } },
    exit: { opacity: 0, transition: { duration: durations.fast } }
};
