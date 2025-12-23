/**
 * Shared Animation System
 *
 * Centralized animation variants and easing curves for consistent,
 * organic transitions throughout the game.
 *
 * RULES:
 * - Backdrops/overlays: opacity only (no scale/translate)
 * - Content: opacity + y translation allowed
 * - Interactive elements: scale allowed (buttons, cards)
 * - Objects (curtains, swipe cards): x/y translation allowed
 */

import type { Variants, Transition } from 'framer-motion';

// Organic easing curve - used everywhere for smooth, natural feel
export const organicEase = [0.25, 0.46, 0.45, 0.94] as const;

// Fast easing for quick feedback
export const quickEase = [0.4, 0, 0.2, 1] as const;

// Spring configuration for bouncy effects (content only, not backdrops)
export const springConfig = {
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
};

// Spring config for snappy UI feedback (faster response)
export const snappySpring = {
    type: "spring" as const,
    stiffness: 300,
    damping: 25,
};

// Spring config for bouncy icon animations (more bounce)
export const bouncySpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
};

// Standard durations
export const durations = {
    fast: 0.2,
    quick: 0.3,      // Quick feedback (badges, micro-interactions)
    normal: 0.4,
    medium: 0.5,     // Medium transitions (ripples, progress bars)
    slow: 0.6,
    verySlow: 0.8,
};

// Extended durations for loading animations
export const loadingDurations = {
    wobble: 2.5,      // Chef hat wobble
    spin: 1,          // Spinner rotation
    pulse: 1.5,       // Dot pulsation
    curtain: 1.8,     // Curtain slide (slightly longer for natural feel)
    cookingDots: 1.2, // Cooking dots loader cycle
};

/**
 * Transition Durations (in milliseconds)
 * Standardized timing for all phase and question transitions
 */
export const transitionDurations = {
    questionTransition: { normal: 800, reduced: 300 },
    phaseTransition: { normal: 5000, reduced: 2000 },
    countdownTick: { normal: 800, reduced: 300 },
    wrongFeedback: { normal: 500, reduced: 100 },
    safetyMargin: 700,
} as const;

/**
 * Countdown easing curve - intentional overshoot for bouncy number animation
 * Used in Phase 1 and Phase 4 countdown displays
 */
export const countdownEase = [0.34, 1.56, 0.64, 1] as const;

/**
 * Helper to get transition duration based on reduced motion preference
 */
export const getTransitionDuration = (
    type: keyof typeof transitionDurations,
    reducedMotion: boolean
): number => {
    const config = transitionDurations[type];
    return typeof config === 'number'
        ? config
        : (reducedMotion ? config.reduced : config.normal);
};

/**
 * Cooking Dots Loader Variants
 * For the unified FoodLoader component - 3 dots pulsing sequentially
 */
export const cookingDotsVariants = {
    dot: (delay: number) => ({
        opacity: [0.3, 1, 0.3],
        scale: [0.85, 1, 0.85],
        transition: {
            duration: loadingDurations.cookingDots,
            repeat: Infinity,
            delay,
            ease: organicEase,
        },
    }),
    static: {
        opacity: 0.7,
        scale: 1,
    },
};

// Curtain spring configuration - simulates heavy velvet fabric
export const curtainSpring = {
    type: "spring" as const,
    stiffness: 80,     // Lower = heavier, slower movement
    damping: 12,       // Controls oscillation - lower = more bounce
    mass: 1.2,         // Heavier mass for theatrical feel
};

// Curtain easing for keyframe fallback - custom for theatrical effect
export const curtainEase = [0.22, 1, 0.36, 1] as const;

/**
 * Backdrop Variants - OPACITY ONLY
 * For overlays, backgrounds, and elements with backdrop-blur
 */
export const backdropVariants: Variants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            duration: durations.normal,
            ease: organicEase
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: durations.fast,
            ease: organicEase
        }
    }
};

/**
 * Content Variants - Opacity + Y translation
 * For content that appears within containers
 */
export const contentVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: durations.normal,
            ease: organicEase
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: durations.fast,
            ease: organicEase
        }
    }
};

/**
 * Staggered Content Variants
 * For lists of items that appear one after another
 */
export const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        }
    }
};

export const staggerItemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 20
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: durations.normal,
            ease: organicEase
        }
    }
};

/**
 * Interactive Variants - Scale allowed
 * For buttons, cards, and interactive elements
 */
export const interactiveVariants = {
    tap: { scale: 0.95 },
    hover: { scale: 1.02 },
};

export const buttonVariants: Variants = {
    idle: { scale: 1 },
    hover: {
        scale: 1.05,
        transition: { duration: durations.fast, ease: organicEase }
    },
    tap: {
        scale: 0.95,
        transition: { duration: 0.1 }
    }
};

/**
 * Shimmer/Scintillation Variants
 * For particles and decorative elements - opacity pulsation only
 */
export const shimmerVariants: Variants = {
    hidden: {
        opacity: 0
    },
    visible: (delay: number = 0) => ({
        opacity: [0, 1, 0.5, 1, 0],
        transition: {
            duration: 2.5,
            delay,
            ease: "easeInOut",
            repeat: 0,
        }
    })
};

/**
 * Spotlight Variants - Opacity pulsation only (no scaleY)
 */
export const spotlightVariants: Variants = {
    hidden: {
        opacity: 0
    },
    visible: (delay: number = 0) => ({
        opacity: [0, 0.3, 0.1, 0.3, 0],
        transition: {
            duration: 2.5,
            delay,
            ease: "easeInOut",
        }
    })
};

/**
 * Decorative Bar Variants - Opacity with gradient animation via CSS
 */
export const decorativeBarVariants: Variants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            delay: 0.3,
            duration: durations.slow,
            ease: organicEase
        }
    }
};

/**
 * Result Overlay Variants - For showing results (opacity only on backdrop)
 */
export const resultOverlayVariants: Variants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            duration: durations.normal,
            ease: organicEase
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: durations.fast,
            ease: organicEase
        }
    }
};

/**
 * Result Content Variants - For content inside result overlay
 * Can use y translation and scale since it's content, not backdrop
 */
export const resultContentVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 50
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            delay: 0.3,
            duration: durations.slow,
            ease: organicEase
        }
    }
};

/**
 * Card Position Variants - For Phase 2 swipe card
 * Used when showing where the card should have gone
 */
export const cardPositionVariants: Variants = {
    center: {
        x: 0,
        y: 0,
        opacity: 1
    },
    left: {
        x: -150,
        y: 0,
        opacity: 1,
        transition: {
            delay: 0.2,
            duration: durations.slow,
            ease: organicEase
        }
    },
    right: {
        x: 150,
        y: 0,
        opacity: 1,
        transition: {
            delay: 0.2,
            duration: durations.slow,
            ease: organicEase
        }
    },
    up: {
        x: 0,
        y: -100,
        opacity: 1,
        transition: {
            delay: 0.2,
            duration: durations.slow,
            ease: organicEase
        }
    }
};

/**
 * Flash Indicator Variants - For quick status indicators
 * Used for badges, alerts, last question indicator
 */
export const flashIndicatorVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.8
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: durations.fast,
            ease: organicEase
        }
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: {
            duration: durations.fast,
            ease: organicEase
        }
    }
};

/**
 * Wrong Answer Shake Variants - For immediate feedback on wrong answers
 * Used in Phase 1 and Phase 4 when player clicks a wrong answer
 */
export const wrongAnswerShakeVariants: Variants = {
    idle: { x: 0 },
    shake: {
        x: [0, -12, 12, -12, 12, -8, 8, 0],
        transition: {
            duration: durations.medium,
            ease: "easeInOut"
        }
    }
};

/**
 * Helper: Create a custom transition with organic easing
 */
export const createTransition = (
    duration: number = durations.normal,
    delay: number = 0
): Transition => ({
    duration,
    delay,
    ease: organicEase,
});

/**
 * Phase-specific color schemes for SharedBackground
 */
export const phaseColors = {
    lobby: {
        red: 0.2,
        pink: 0.2,
        purple: 0,
    },
    phase1: {
        red: 0.25,
        pink: 0.1,
        purple: 0.05,
    },
    phase2: {
        red: 0.15,
        pink: 0.15,
        purple: 0.1,
    },
    phase3: {
        red: 0.2,
        pink: 0.2,
        purple: 0,
    },
    phase4: {
        red: 0.3,
        pink: 0.1,
        purple: 0,
    },
    phase5: {
        red: 0.15,
        pink: 0.15,
        purple: 0.15,
    },
} as const;

// Note: Phase-specific transitions are in ./phaseTransitions.ts
// Import directly from there to avoid circular dependency
