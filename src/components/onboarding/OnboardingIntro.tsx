/**
 * OnboardingIntro Component
 * Reusable intro screen for explaining features to first-time users
 * Based on Phase5Intro pattern
 */

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { audioService } from '../../services/audioService';
import { organicEase, durations, backdropVariants, contentVariants } from '../../animations';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { LucideIcon } from 'lucide-react';

interface OnboardingStep {
    icon: LucideIcon;
    label: string;
    text: string;
    color: string; // Tailwind text color class
}

interface OnboardingIntroProps {
    /** Main title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Main icon displayed above title */
    icon: LucideIcon;
    /** Icon color class (Tailwind) */
    iconColor?: string;
    /** Array of steps to display in grid */
    steps: OnboardingStep[];
    /** CTA button text */
    buttonText: string;
    /** Called when user clicks continue */
    onContinue: () => void;
    /** Optional: show a close button */
    showCloseButton?: boolean;
    /** Optional: gradient colors for title */
    gradientFrom?: string;
    gradientTo?: string;
}

export function OnboardingIntro({
    title,
    subtitle,
    icon: Icon,
    iconColor = 'text-yellow-500',
    steps,
    buttonText,
    onContinue,
    showCloseButton = false,
    gradientFrom = 'from-yellow-300',
    gradientTo = 'to-yellow-600',
}: OnboardingIntroProps) {
    const { t } = useTranslation('onboarding');
    const prefersReducedMotion = useReducedMotion();

    const handleContinue = useCallback(() => {
        audioService.playClick();
        onContinue();
    }, [onContinue]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleContinue();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleContinue]);

    const animationDuration = prefersReducedMotion ? 0.15 : durations.medium;
    const stepDelay = prefersReducedMotion ? 0 : 0.1;

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-title"
            >
                <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative w-full max-w-2xl text-center text-white"
                >
                    {/* Close button */}
                    {showCloseButton && (
                        <button
                            onClick={handleContinue}
                            className="absolute -top-2 -right-2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
                            aria-label={t('common:close')}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {/* Title Section */}
                    <div className="mb-8">
                        <Icon
                            className={`w-16 h-16 md:w-20 md:h-20 ${iconColor} mx-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]`}
                        />
                        <h1
                            id="onboarding-title"
                            className={`text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gradientFrom} ${gradientTo}`}
                        >
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-3 text-lg md:text-xl text-slate-400">{subtitle}</p>
                        )}
                    </div>

                    {/* Rules Card */}
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 mb-8 border border-white/10">
                        <h2 className="text-xl md:text-2xl font-bold mb-6 text-yellow-400">
                            {t('howToPlay')}
                        </h2>

                        <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
                            role="list"
                            aria-label={t('howToPlay')}
                        >
                            {steps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                                    transition={{
                                        delay: idx * stepDelay,
                                        duration: animationDuration,
                                        ease: organicEase,
                                    }}
                                    className="flex items-center gap-3 md:gap-4 bg-slate-900/50 p-3 md:p-4 rounded-xl"
                                    role="listitem"
                                >
                                    <div
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 ${step.color}`}
                                    >
                                        <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="text-slate-500 text-xs uppercase tracking-wider">
                                            {step.label}
                                        </div>
                                        <div className="font-medium text-sm md:text-base">
                                            {step.text}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <motion.button
                        whileHover={prefersReducedMotion ? {} : { scale: 1.05, boxShadow: "0 0 30px rgba(234,179,8,0.4)" }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                        onClick={handleContinue}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-10 md:px-12 py-4 md:py-5 rounded-2xl text-xl md:text-2xl font-black shadow-2xl uppercase tracking-wider transition-all"
                    >
                        {buttonText}
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default OnboardingIntro;
