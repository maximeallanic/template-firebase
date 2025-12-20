import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { organicEase } from '../../animations';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';
type LoaderVariant = 'spicy' | 'sweet' | 'neutral';

interface FoodLoaderProps {
    size?: LoaderSize;
    variant?: LoaderVariant;
    label?: string;
    className?: string;
}

const sizeConfig: Record<LoaderSize, { dot: string; gap: string }> = {
    sm: { dot: 'w-1.5 h-1.5', gap: 'gap-1' },      // 6px dots, 4px gap
    md: { dot: 'w-2 h-2', gap: 'gap-1.5' },        // 8px dots, 6px gap
    lg: { dot: 'w-3 h-3', gap: 'gap-2' },          // 12px dots, 8px gap
    xl: { dot: 'w-4 h-4', gap: 'gap-2.5' },        // 16px dots, 10px gap
};

const variantConfig: Record<LoaderVariant, string> = {
    neutral: 'bg-yellow-400',
    spicy: 'bg-red-500',
    sweet: 'bg-pink-500',
};

const ANIMATION_DURATION = 1.2;
const STAGGER_DELAY = 0.15;

export function FoodLoader({
    size = 'md',
    variant = 'neutral',
    label = 'Chargement...',
    className = '',
}: FoodLoaderProps) {
    const prefersReducedMotion = useReducedMotion();
    const { dot: dotSize, gap } = sizeConfig[size];
    const colorClass = variantConfig[variant];

    return (
        <div
            role="status"
            aria-label={label}
            className={`inline-flex items-center ${gap} ${className}`}
        >
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={`${dotSize} rounded-full ${colorClass}`}
                    animate={
                        prefersReducedMotion
                            ? { opacity: 0.7 }
                            : {
                                opacity: [0.3, 1, 0.3],
                                scale: [0.85, 1, 0.85],
                            }
                    }
                    transition={
                        prefersReducedMotion
                            ? { duration: 0 }
                            : {
                                duration: ANIMATION_DURATION,
                                repeat: Infinity,
                                delay: i * STAGGER_DELAY,
                                ease: organicEase,
                            }
                    }
                />
            ))}
            <span className="sr-only">{label}</span>
        </div>
    );
}

export default FoodLoader;
