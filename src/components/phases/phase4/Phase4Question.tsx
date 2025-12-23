import { motion } from 'framer-motion';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { springConfig, durations } from '../../../animations';

interface Phase4QuestionProps {
    question: string;
    questionNumber: number;
    totalQuestions: number;
}

export function Phase4Question({
    question,
    questionNumber,
    totalQuestions
}: Phase4QuestionProps) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            initial={prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 30, scale: 0.95 }
            }
            animate={prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -20, scale: 0.98 }
            }
            transition={prefersReducedMotion
                ? { duration: durations.fast }
                : springConfig
            }
            className="bg-slate-800/80 p-6 rounded-2xl w-full max-w-lg border border-slate-600 shadow-xl"
        >
            {/* Question Number Badge */}
            <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, ...springConfig }}
                className="flex justify-center mb-4"
            >
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                    {questionNumber} / {totalQuestions}
                </span>
            </motion.div>

            {/* Question Text */}
            <motion.p
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: durations.normal }}
                className="text-2xl md:text-3xl font-bold text-center text-white leading-tight select-none"
                aria-live="polite"
            >
                {question}
            </motion.p>
        </motion.div>
    );
}
