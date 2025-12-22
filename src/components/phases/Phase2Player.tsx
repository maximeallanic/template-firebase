import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Utensils, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { FoodLoader } from '../ui/FoodLoader';
import { submitPhase2Answer as submitPhase2AnswerToRoom, showPhaseResults } from '../../services/gameService';
import type { Room, Team } from '../../services/gameService';
import type { SimplePhase2Set } from '../../types/gameTypes';
import { PHASE2_SETS } from '../../data/phase2';
import { markQuestionAsSeen } from '../../services/historyService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SimpleConfetti } from '../ui/SimpleConfetti';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import { SOLO_SCORING } from '../../types/soloTypes';

// Modular components
import { Phase2Card, Phase2Zones, Phase2Transition } from './phase2';
import type { Phase2Answer } from './phase2';

interface Phase2PlayerProps {
    room: Room;
    playerId: string;
    isHost: boolean;
    mode?: 'solo' | 'multiplayer';
    soloHandlers?: SoloPhaseHandlers;
}

export function Phase2Player({ room, playerId, isHost, mode = 'multiplayer', soloHandlers }: Phase2PlayerProps) {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const controls = useAnimation();
    const isSolo = mode === 'solo';

    // Extract values from room
    const roomId = room.code;
    const { players, customQuestions } = room;
    const {
        currentPhase2Set: setIndex = 0,
        currentPhase2Item: itemIndex = 0,
        phaseState = 'idle',
        phase2TeamAnswers,
        phase2RoundWinner,
    } = room.state;

    // In solo mode, customQuestions.phase2 is a single set, not an array
    const currentSet: SimplePhase2Set | undefined = isSolo
        ? (customQuestions?.phase2 as SimplePhase2Set | undefined) || PHASE2_SETS[0]
        : (customQuestions?.phase2 as SimplePhase2Set[] | undefined)?.[setIndex] || PHASE2_SETS[setIndex];
    const currentItem = currentSet?.items[itemIndex];
    const totalItems = currentSet?.items.length || 0;
    const currentAnecdote = currentItem?.anecdote;

    // Get current player's team (in solo mode, always 'spicy')
    const myTeam = isSolo ? 'spicy' : players[playerId]?.team;
    const otherTeam: Team | null = isSolo ? null : (myTeam === 'spicy' ? 'sweet' : myTeam === 'sweet' ? 'spicy' : null);

    // Team-based answer tracking (multiplayer)
    const myTeamAnswer = myTeam ? phase2TeamAnswers?.[myTeam] : undefined;
    const otherTeamAnswer = otherTeam ? phase2TeamAnswers?.[otherTeam] : undefined;

    // Local state
    const [showTransition, setShowTransition] = useState(false);
    const previousItemIdxRef = useRef<number | null>(null);

    // Solo mode state
    const [soloAnswered, setSoloAnswered] = useState(false);
    const [soloResult, setSoloResult] = useState<{ correct: boolean; answer: Phase2Answer } | null>(null);

    // Reset solo state when item changes
    useEffect(() => {
        if (isSolo) {
            setSoloAnswered(false);
            setSoloResult(null);
        }
    }, [itemIndex, isSolo]);

    // Determine round state
    const isRoundOver = isSolo ? soloAnswered : phaseState === 'result';
    const didMyTeamWin = isSolo ? (soloResult?.correct ?? false) : (isRoundOver && phase2RoundWinner === myTeam);

    // Can this player answer?
    const hasMyTeamAnswered = isSolo ? soloAnswered : !!myTeamAnswer;
    const didIAnswer = isSolo ? soloAnswered : myTeamAnswer?.playerId === playerId;
    const canAnswer = !isRoundOver && !hasMyTeamAnswered;

    // Reset card position when item changes
    useEffect(() => {
        controls.set({ x: 0, y: 0, opacity: 1 });
    }, [itemIndex, controls]);

    // Track question as seen when displayed
    useEffect(() => {
        if (currentItem?.text) {
            markQuestionAsSeen('', currentItem.text);
        }
    }, [currentItem?.text]);

    // Show transition when item index changes
    useEffect(() => {
        if (previousItemIdxRef.current !== null &&
            previousItemIdxRef.current !== itemIndex &&
            currentItem &&
            !prefersReducedMotion) {
            setShowTransition(true);
        }
        previousItemIdxRef.current = itemIndex;
    }, [itemIndex, currentItem, prefersReducedMotion]);

    // Handle answer submission
    const handleAnswer = useCallback((choice: Phase2Answer) => {
        if (!canAnswer || !currentItem) return;

        if (isSolo && soloHandlers) {
            // Solo mode: use solo handlers
            const isCorrect = choice === currentItem.answer ||
                (currentItem.acceptedAnswers?.includes(choice) ?? false);

            soloHandlers.submitPhase2Answer(choice);
            setSoloAnswered(true);
            setSoloResult({ correct: isCorrect, answer: choice });
        } else {
            // Multiplayer mode: submit to room
            submitPhase2AnswerToRoom(roomId, playerId, choice);
        }
    }, [canAnswer, currentItem, isSolo, soloHandlers, roomId, playerId]);

    // Auto-advance for solo mode
    useEffect(() => {
        if (!isSolo || !soloAnswered || !soloResult || !soloHandlers) return;

        // Longer delay when there's an anecdote to read
        const delay = currentAnecdote ? 10000 : 4000;

        const timer = setTimeout(() => {
            if (itemIndex + 1 < SOLO_SCORING.phase2.maxItems && itemIndex + 1 < totalItems) {
                soloHandlers.nextPhase2Item();
            } else {
                // Phase complete
                soloHandlers.advanceToNextPhase();
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [isSolo, soloAnswered, soloResult, soloHandlers, itemIndex, totalItems, currentAnecdote]);

    // Handle transition complete
    const handleTransitionComplete = useCallback(() => {
        setShowTransition(false);
    }, []);

    // --- TRANSITION VIEW ---
    if (showTransition && currentSet && currentItem) {
        return (
            <Phase2Transition
                itemNumber={itemIndex + 1}
                totalItems={totalItems}
                setName={`${currentSet.optionA} / ${currentSet.optionB}`}
                onComplete={handleTransitionComplete}
            />
        );
    }

    // --- FINISHED VIEW ---
    if (!currentSet || !currentItem) {
        if (isHost) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white space-y-8">
                    <motion.h2
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        className="text-4xl font-bold"
                    >
                        {t('game-phases:endPhase.phase2Complete')}
                    </motion.h2>
                    <motion.button
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => showPhaseResults(roomId)}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black text-2xl font-bold px-12 py-6 rounded-full shadow-lg transform transition-transform hover:scale-105 flex items-center gap-3"
                    >
                        <Utensils className="w-8 h-8" aria-hidden="true" />
                        {t('game-phases:navigation.startPhase3')}
                    </motion.button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <div className="text-2xl font-bold flex items-center gap-3">
                    <FoodLoader size="lg" />
                    {t('player.waitingForHost')}
                </div>
                <div className="text-slate-400 mt-2">
                    {t('game-phases:endPhase.gettingMenusReady')}
                </div>
            </div>
        );
    }

    // --- MAIN GAME VIEW ---
    return (
        <div className="fixed inset-0 flex overflow-hidden">
            {/* Team Status Bar - Top (multiplayer only) */}
            {!isSolo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                    {/* My Team Status */}
                    <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                        myTeam === 'spicy' ? 'bg-red-500/80' : 'bg-pink-500/80'
                    } text-white backdrop-blur`}>
                        <span>{myTeam === 'spicy' ? '🌶️' : '🍬'}</span>
                        {hasMyTeamAnswered ? (
                            myTeamAnswer?.correct ? '✓' : '✗'
                        ) : (
                            <FoodLoader size="sm" variant={myTeam === 'spicy' ? 'spicy' : 'sweet'} />
                        )}
                    </div>

                    {/* Other Team Status */}
                    {otherTeam && (
                        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                            otherTeam === 'spicy' ? 'bg-red-500/80' : 'bg-pink-500/80'
                        } text-white backdrop-blur`}>
                            <span>{otherTeam === 'spicy' ? '🌶️' : '🍬'}</span>
                            {otherTeamAnswer ? (
                                otherTeamAnswer.correct ? '✓' : '✗'
                            ) : (
                                <FoodLoader size="sm" variant={otherTeam === 'spicy' ? 'spicy' : 'sweet'} />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Solo Progress Indicator */}
            {isSolo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                    <div className="px-4 py-2 rounded-full text-sm font-bold bg-slate-800/80 text-white backdrop-blur flex items-center gap-2">
                        <span>{itemIndex + 1} / {totalItems}</span>
                        {soloResult && (
                            soloResult.correct
                                ? <CheckCircle className="w-4 h-4 text-green-400" />
                                : <XCircle className="w-4 h-4 text-red-400" />
                        )}
                    </div>
                </div>
            )}

            {/* Confetti if team won (respects reduced motion) */}
            {didMyTeamWin && !prefersReducedMotion && <SimpleConfetti />}

            {/* Screen reader instructions */}
            <div className="sr-only" aria-live="polite">
                {t('phase2.classify', {
                    item: currentItem.text,
                    optionA: currentSet.optionA,
                    optionB: currentSet.optionB
                })}
            </div>

            {/* Drop Zones (Left / Right / Up) */}
            <Phase2Zones
                optionA={currentSet.optionA}
                optionB={currentSet.optionB}
                optionADescription={currentSet.optionADescription}
                optionBDescription={currentSet.optionBDescription}
                humorousDescription={currentSet.humorousDescription}
                onZoneClick={canAnswer ? handleAnswer : undefined}
                disabled={!canAnswer}
            />

            {/* CENTER: Card & Results */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                {/* Team Lock Overlay - When teammate answered but round not over (multiplayer only) */}
                {!isSolo && (
                    <AnimatePresence>
                        {hasMyTeamAnswered && !didIAnswer && !isRoundOver && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                            >
                                <div className="bg-slate-800/90 backdrop-blur p-8 rounded-2xl text-center text-white max-w-sm">
                                    <Lock className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                                    <h3 className="text-xl font-bold mb-2">
                                        {t('phase2.teammateAnswered', { defaultValue: 'Un coéquipier a répondu !' })}
                                    </h3>
                                    <p className="text-slate-300">
                                        {t('phase2.waitingForResult', {
                                            name: myTeamAnswer?.playerName,
                                            defaultValue: `${myTeamAnswer?.playerName} a fait son choix...`
                                        })}
                                    </p>
                                    {!myTeamAnswer?.correct && otherTeam && !otherTeamAnswer && (
                                        <p className="mt-4 text-yellow-300 text-sm flex items-center justify-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            {t('phase2.otherTeamTurn', { defaultValue: "L'équipe adverse peut tenter !" })}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* The Drag Card with Adjacent Result Message */}
                <Phase2Card
                    item={currentItem}
                    hasAnswered={hasMyTeamAnswered}
                    isRoundOver={isRoundOver}
                    didWin={didMyTeamWin}
                    onAnswer={handleAnswer}
                    optionA={currentSet.optionA}
                    optionB={currentSet.optionB}
                    roundWinner={phase2RoundWinner}
                    myTeamAnswer={myTeamAnswer}
                />

                {/* Waiting Feedback - When I answered and waiting for other team (multiplayer only) */}
                {!isSolo && didIAnswer && !isRoundOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute bottom-20 bg-slate-800/80 backdrop-blur text-white px-8 py-4 rounded-full font-bold text-xl flex items-center gap-3"
                    >
                        <FoodLoader size="sm" />
                        <span>
                            {myTeamAnswer?.correct
                                ? t('phase2.yourTeamWon', { defaultValue: 'Votre équipe gagne !' })
                                : t('phase2.waitingForOtherTeam', { defaultValue: "En attente de l'autre équipe..." })
                            }
                        </span>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
