import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, AlertTriangle, RotateCcw } from 'lucide-react';
import { LoadingMessages } from './LoadingMessages';
import { useLoadingMessages } from '../../hooks/useGameTranslation';
import { organicEase, loadingDurations } from '../../animations';
import { audioService } from '../../services/audioService';

interface GenerationLoadingCardProps {
    error?: string | null;
    onRetry?: () => void;
}

export function GenerationLoadingCard({
    error,
    onRetry,
}: GenerationLoadingCardProps) {
    const { generationTitle, errorTitle, retryButton } = useLoadingMessages();

    // Play cooking sounds while loading
    useEffect(() => {
        if (!error) {
            audioService.play('cookingLoading');
        }
        return () => {
            audioService.stop('cookingLoading');
        };
    }, [error]);

    if (error) {
        return (
            <div className="text-center space-y-4 py-6">
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold">{errorTitle}</span>
                    </div>
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" /> {retryButton}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="text-center space-y-5 py-6">
            {/* Animated Chef Hat */}
            <motion.div
                className="mx-auto w-20 h-20"
                animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                transition={{ duration: loadingDurations.wobble, repeat: Infinity, ease: organicEase }}
            >
                <ChefHat className="w-20 h-20 text-yellow-400" />
            </motion.div>

            {/* Title */}
            <h2 className="text-xl font-black text-white">
                {generationTitle}
            </h2>

            {/* Rotating Messages */}
            <LoadingMessages />

            {/* Progress indicator dots */}
            <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-yellow-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                            duration: loadingDurations.pulse,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
