import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { type Room, type Phase5Question, setPhase5State, setPhase5Results } from '../../../services/gameService';
import { validatePhase5Answers } from '../../../services/aiClient';
import { Brain, Sparkles } from 'lucide-react';
import { FoodLoader } from '../../ui/FoodLoader';
import { audioService } from '../../../services/audioService';
import { organicEase, durations } from '../../../animations';

interface Phase5ValidatingProps {
    room: Room;
    isHost: boolean;
}

export function Phase5Validating({ room, isHost }: Phase5ValidatingProps) {
    const { t } = useTranslation(['game-ui', 'common', 'game-content']);
    const [validationProgress, setValidationProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Get questions and answers
    const defaultQuestions = t('game-content:phase5.questions', { returnObjects: true }) as Phase5Question[];
    const questions: Phase5Question[] = (room.customQuestions?.phase5 as Phase5Question[]) || defaultQuestions;

    const spicyAnswers = useMemo(
        () => room.state.phase5Answers?.spicy || [],
        [room.state.phase5Answers?.spicy]
    );
    const sweetAnswers = useMemo(
        () => room.state.phase5Answers?.sweet || [],
        [room.state.phase5Answers?.sweet]
    );

    // Host triggers validation
    useEffect(() => {
        if (!isHost) return;

        const validate = async () => {
            try {
                setValidationProgress(10);
                audioService.playJoin();

                // Ensure we have 10 answers for each team (pad with empty strings if needed)
                const paddedSpicy = [...spicyAnswers];
                const paddedSweet = [...sweetAnswers];
                while (paddedSpicy.length < 10) paddedSpicy.push('');
                while (paddedSweet.length < 10) paddedSweet.push('');

                setValidationProgress(30);

                // Call the validation Cloud Function
                const results = await validatePhase5Answers({
                    questions: questions.slice(0, 10),
                    spicyAnswers: paddedSpicy.slice(0, 10),
                    sweetAnswers: paddedSweet.slice(0, 10),
                });

                setValidationProgress(80);

                // Store results
                await setPhase5Results(room.code, results);

                setValidationProgress(100);
                audioService.playSuccess();

                // Transition to result state
                await setPhase5State(room.code, 'result');
            } catch (err) {
                console.error('Validation failed:', err);
                setError(err instanceof Error ? err.message : 'Validation failed');
                audioService.playError();
            }
        };

        validate();
    }, [isHost, room.code, questions, spicyAnswers, sweetAnswers]);

    // Simulated progress animation
    useEffect(() => {
        if (validationProgress > 0 && validationProgress < 80) {
            const timer = setTimeout(() => {
                setValidationProgress((p) => Math.min(p + 5, 75));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [validationProgress]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-full p-6 text-white">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-6xl mb-4">!</div>
                    <h2 className="text-2xl font-bold mb-4">{t('phase5.validationError')}</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    {isHost && (
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold"
                        >
                            {t('common:retry')}
                        </button>
                    )}
                </div>
            </div>
        );
    }

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

                {/* Progress Bar */}
                <div className="w-full max-w-xs mx-auto">
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${validationProgress}%` }}
                            transition={{ duration: 0.3, ease: organicEase }}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                        <FoodLoader size="sm" />
                        <span>{validationProgress}%</span>
                    </div>
                </div>

                {/* Fun loading messages */}
                <motion.div
                    key={Math.floor(validationProgress / 25)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-slate-500 text-sm"
                >
                    {validationProgress < 25 && t('phase5.loadingMessage1')}
                    {validationProgress >= 25 && validationProgress < 50 && t('phase5.loadingMessage2')}
                    {validationProgress >= 50 && validationProgress < 75 && t('phase5.loadingMessage3')}
                    {validationProgress >= 75 && t('phase5.loadingMessage4')}
                </motion.div>
            </motion.div>
        </div>
    );
}
