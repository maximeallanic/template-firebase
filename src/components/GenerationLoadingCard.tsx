import { motion } from 'framer-motion';
import { ChefHat, AlertTriangle, RotateCcw } from 'lucide-react';
import { LoadingMessages } from './LoadingMessages';
import { useLoadingMessages } from '../hooks/useGameTranslation';

interface GenerationLoadingCardProps {
    error?: string | null;
    onRetry?: () => void;
}

export function GenerationLoadingCard({
    error,
    onRetry,
}: GenerationLoadingCardProps) {
    const { generationTitle, errorTitle, retryButton } = useLoadingMessages();

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
                className="relative mx-auto w-20 h-20"
                animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
                <ChefHat className="w-20 h-20 text-yellow-400" />
                {/* Spinning indicator below the hat */}
                <motion.div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
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
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
