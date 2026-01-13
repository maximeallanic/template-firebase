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
    const otherTeamWon = !didWin && roundWinner !== null;

    // Play audio feedback once when result is shown
    useEffect(() => {
        if (hasPlayedAudioRef.current) return;
        hasPlayedAudioRef.current = true;

        if (didWin) {
            audioService.playSuccess();
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

    // Get accent color based on outcome (for top bar and glow)
    const getAccentColor = () => {
        if (didWin) return 'emerald';
        if (otherTeamWon) return 'red';
        return 'amber'; // No winner
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
            {/* TV Quiz Style Result Card */}
            <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { y: 50, opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
                transition={{ delay: 0.3, ...bouncySpring }}
                className="mt-auto mb-8"
            >
                <div className="relative w-[400px] max-w-[90vw] md:w-[480px] overflow-hidden rounded-3xl bg-slate-900/95 backdrop-blur-sm border border-white/10 shadow-2xl">
                    {/* Top accent bar */}
                    <div className={`
                        absolute top-0 left-0 right-0 h-2
                        ${getAccentColor() === 'emerald'
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
                            : getAccentColor() === 'red'
                                ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-500'
                                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'
                        }
                    `} />

                    <div className="p-6 pt-8">
                        {/* Result Icon */}
                        <motion.div
                            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0 }}
                            animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1 }}
                            transition={{ delay: 0.5, ...bouncySpring }}
                            className="flex justify-center mb-4"
                            aria-hidden="true"
                        >
                            <div className={`
                                w-20 h-20 rounded-2xl flex items-center justify-center
                                ${getAccentColor() === 'emerald'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : getAccentColor() === 'red'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                }
                            `}>
                                {getResultIcon()}
                            </div>
                        </motion.div>

                        {/* Result Text */}
                        <div className={`
                            text-xl font-black tracking-wider uppercase text-center
                            ${getAccentColor() === 'emerald'
                                ? 'text-emerald-400'
                                : getAccentColor() === 'red'
                                    ? 'text-red-400'
                                    : 'text-amber-400'
                            }
                        `}>
                            {getResultMessage()}
                        </div>

                        {/* Winner team badge */}
                        {roundWinner && (
                            <div className="text-sm mt-3 text-center text-white/60">
                                {getTeamName(roundWinner)}
                            </div>
                        )}

                        {/* Who answered for my team */}
                        {myTeamAnswer && (
                            <div className="text-xs mt-2 text-center text-white/50">
                                {myTeamAnswer.playerName} {t('phase2.answeredFor', { defaultValue: 'a répondu pour' })} {getTeamName(myTeam)}
                            </div>
                        )}

                        {/* Correct answer (show if team lost or no winner) */}
                        {!didWin && (
                            <div className="text-sm mt-4 text-center text-white/60">
                                {t('phase2.itWas')}{' '}
                                <span className={`
                                    font-bold
                                    ${getAccentColor() === 'red' ? 'text-red-400' : 'text-amber-400'}
                                `}>
                                    {getAnswerText(item.answer)}
                                </span>

                                {/* Alternative accepted answers */}
                                {item.acceptedAnswers && item.acceptedAnswers.length > 1 && (
                                    <span className="text-white/40 text-xs block mt-1">
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
                                className="text-sm mt-4 pt-4 border-t border-white/10 italic text-white/70 text-center"
                            >
                                <span aria-hidden="true">📝</span> {item.justification}
                            </motion.p>
                        )}

                        {/* Anecdote Card - Nested TV Quiz Style */}
                        {item.anecdote && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: durations.normal, ease: 'easeOut' }}
                                className="mt-4 w-full"
                            >
                                <div className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-3">
                                    {/* Header with icon */}
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <div className={`
                                            flex items-center justify-center w-6 h-6 rounded-lg
                                            ${getAccentColor() === 'emerald'
                                                ? 'bg-emerald-500/20'
                                                : getAccentColor() === 'red'
                                                    ? 'bg-purple-500/20'
                                                    : 'bg-amber-500/20'
                                            }
                                        `}>
                                            <span className="text-sm" aria-hidden="true">💡</span>
                                        </div>
                                        <span className={`
                                            text-[10px] font-black uppercase tracking-widest
                                            ${getAccentColor() === 'emerald'
                                                ? 'text-emerald-400/80'
                                                : getAccentColor() === 'red'
                                                    ? 'text-purple-400/80'
                                                    : 'text-amber-400/80'
                                            }
                                        `}>
                                            {t('phase2.funFact', { defaultValue: 'Le saviez-vous ?' })}
                                        </span>
                                    </div>

                                    {/* Anecdote text */}
                                    <p className="text-xs leading-relaxed text-center text-white/70 select-none">
                                        {item.anecdote}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Subtle corner glow effect */}
                    <div className={`
                        absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20
                        ${getAccentColor() === 'emerald'
                            ? 'bg-emerald-500'
                            : getAccentColor() === 'red'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                        }
                    `} />
                </div>
            </motion.div>
        </motion.div>
    );
}
