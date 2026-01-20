import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room } from '../../../services/gameService';
import { Brain, Sparkles } from 'lucide-react';
import { FoodLoader } from '../../ui/FoodLoader';
import { organicEase, durations } from '../../../animations';

/**
 * Phase 5 Validating View
 *
 * NOTE: With server-side validation (#72), each answer is validated when submitted
 * via the submitAnswer CF. The 'validating' state is now skipped, going directly
 * from 'answering' to 'result'. This component is kept for backwards compatibility
 * but should rarely be rendered.
 *
 * Props are maintained for interface compatibility with Phase5Player routing.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Phase5Validating(_props: { room: Room; isHost: boolean }) {
    const { t } = useTranslation(['game-ui', 'common']);

    // Log if we unexpectedly reach this state
    useEffect(() => {
        console.warn('[Phase5Validating] Unexpected validating state - should transition directly to result');
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-6 text-white">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: durations.medium, ease: organicEase }}
                className="text-center max-w-md"
            >
                {/* Brain with sparkles */}
                <div className="relative mb-8 inline-block">
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Brain className="w-24 h-24 text-yellow-500" />
                    </motion.div>

                    {/* Floating sparkles */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                top: `${20 + i * 20}%`,
                                left: `${80 + i * 10}%`,
                            }}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                                duration: 1.5,
                                delay: i * 0.3,
                                repeat: Infinity,
                            }}
                        >
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                        </motion.div>
                    ))}
                </div>

                <h2 className="text-3xl font-black mb-4">{t('phase5.validatingAnswers')}</h2>
                <p className="text-slate-400 mb-8">{t('phase5.validatingDescription')}</p>

                {/* Simple loading indicator */}
                <div className="flex items-center justify-center gap-3 text-slate-500">
                    <FoodLoader size="md" />
                    <span>{t('common:loading')}</span>
                </div>
            </motion.div>
        </div>
    );
}
