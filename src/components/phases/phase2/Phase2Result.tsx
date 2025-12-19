import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertCircle } from 'lucide-react';
import { audioService } from '../../../services/audioService';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { bouncySpring, durations, organicEase } from '../../../animations';
import type { Phase2Answer } from './Phase2Card';
import type { Team, Phase2TeamAnswer } from '../../../types/gameTypes';

interface Phase2Item {
    text: string;
    answer: Phase2Answer;
    justification?: string;
    anecdote?: string;
    acceptedAnswers?: Phase2Answer[];
}

interface Phase2ResultProps {
    item: Phase2Item;
    optionA: string;
    optionB: string;
    didWin: boolean;           // Did my team win?
    myTeam?: Team | null;      // My team
    roundWinner?: Team | null; // Which team won (null = no winner)
    myTeamAnswer?: Phase2TeamAnswer; // My team's answer details
}

export function Phase2Result({
    item,
    optionA,
    optionB,
    didWin,
    myTeam,
    roundWinner,
    myTeamAnswer
}: Phase2ResultProps) {
    const { t } = useTranslation(['game-ui']);
    const prefersReducedMotion = useReducedMotion();
    const hasPlayedAudioRef = useRef(false);

    // Determine result type
    const noWinner = roundWinner === null;
    const otherTeamWon = !didWin && roundWinner !== null;

    // Play audio feedback once when result is shown
    useEffect(() => {
        if (hasPlayedAudioRef.current) return;
        hasPlayedAudioRef.current = true;

        if (didWin) {
            audioService.playSuccess();
            audioService.playWinRound();
        } else if (otherTeamWon) {
            audioService.playError();
        }
    }, [didWin, otherTeamWon]);

    // Get answer display text
    const getAnswerText = (answer: Phase2Answer) => {
        switch (answer) {
            case 'A': return optionA;
            case 'B': return optionB;
            case 'Both': return t('phase2.optionBoth');
        }
    };

    // Get team display name
    const getTeamName = (team: Team | null | undefined) => {
        if (!team) return '';
        return team === 'spicy' ? '🌶️ Spicy' : '🍬 Sweet';
    };

    // Get result style based on outcome
    const getResultStyle = () => {
        if (didWin) {
            return 'bg-gradient-to-br from-green-500 to-emerald-600 border-white text-white';
        }
        if (otherTeamWon) {
            return 'bg-white border-red-500 text-red-500';
        }
        // No winner
        return 'bg-white border-amber-500 text-amber-600';
    };

    // Get result message
    const getResultMessage = () => {
        if (didWin) {
            return t('phase2.yourTeamWon', { defaultValue: 'Votre équipe gagne !' });
        }
        if (otherTeamWon) {
            return t('phase2.yourTeamLost', { defaultValue: "L'équipe adverse a gagné" });
        }
        return t('phase2.nobodyWon', { defaultValue: "Aucune équipe n'a trouvé !" });
    };

    // Get result icon
    const getResultIcon = () => {
        if (didWin) return <Check className="w-16 h-16" />;
        if (otherTeamWon) return <X className="w-16 h-16" />;
        return <AlertCircle className="w-16 h-16" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: organicEase }}
            role="alert"
            aria-live="assertive"
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            {/* Result Badge */}
            <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { y: 50, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                transition={{ delay: 0.3, ...bouncySpring }}
                className="mt-auto mb-8"
            >
                <div className={`p-6 rounded-2xl shadow-2xl border-4 ${getResultStyle()}`}>
                    {/* Result Icon */}
                    <motion.div
                        initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                        transition={{ delay: 0.5, ...bouncySpring }}
                        className="text-4xl mb-2 flex justify-center"
                        aria-hidden="true"
                    >
                        {getResultIcon()}
                    </motion.div>

                    {/* Result Text */}
                    <div className="text-2xl font-black tracking-wider uppercase text-center">
                        {getResultMessage()}
                    </div>

                    {/* Winner team badge */}
                    {roundWinner && (
                        <div className="text-sm mt-2 text-center opacity-80">
                            {getTeamName(roundWinner)}
                        </div>
                    )}

                    {/* Who answered for my team */}
                    {myTeamAnswer && (
                        <div className={`text-xs mt-2 text-center ${didWin ? 'text-white/70' : 'text-current opacity-60'}`}>
                            {myTeamAnswer.playerName} {t('phase2.answeredFor', { defaultValue: 'a répondu pour' })} {getTeamName(myTeam)}
                        </div>
                    )}

                    {/* Correct answer (show if team lost or no winner) */}
                    {!didWin && (
                        <div className={`text-sm mt-3 ${noWinner ? 'text-amber-700' : 'text-red-400'}`}>
                            {t('phase2.itWas')}{' '}
                            <span className={`font-bold ${noWinner ? 'text-amber-800' : 'text-red-600'}`}>
                                {getAnswerText(item.answer)}
                            </span>

                            {/* Alternative accepted answers */}
                            {item.acceptedAnswers && item.acceptedAnswers.length > 1 && (
                                <span className="opacity-70 text-xs block mt-1">
                                    {t('phase2.alsoAccepted')}:{' '}
                                    {item.acceptedAnswers
                                        .filter(a => a !== item.answer)
                                        .map(a => getAnswerText(a))
                                        .join(', ')}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Justification */}
                    {item.justification && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7, duration: durations.normal }}
                            className={`text-sm mt-3 pt-3 border-t italic max-w-xs text-center ${
                                didWin
                                    ? 'border-white/20 text-white/90'
                                    : noWinner
                                    ? 'border-amber-200 text-amber-700'
                                    : 'border-red-200 text-red-600'
                            }`}
                        >
                            <span aria-hidden="true">📝</span> {item.justification}
                        </motion.p>
                    )}

                    {/* Anecdote */}
                    {item.anecdote && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9, duration: durations.normal }}
                            className={`text-xs mt-2 italic max-w-xs text-center ${
                                didWin ? 'text-white/70' : 'opacity-60'
                            }`}
                        >
                            <span aria-hidden="true">💡</span> {item.anecdote}
                        </motion.p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
