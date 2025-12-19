import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Utensils, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { submitPhase2Answer, showPhaseResults } from '../../services/gameService';
import type { Room, Team } from '../../services/gameService';
import { PHASE2_SETS } from '../../data/phase2';
import { markQuestionAsSeen } from '../../services/historyService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { SimpleConfetti } from '../ui/SimpleConfetti';

// Modular components
import { Phase2Card, Phase2Zones, Phase2Result, Phase2Transition } from './phase2';
import type { Phase2Answer } from './phase2';

interface Phase2PlayerProps {
    room: Room;
    playerId: string;
    isHost: boolean;
}

export function Phase2Player({ room, playerId, isHost }: Phase2PlayerProps) {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const controls = useAnimation();

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

    // Prefer custom questions if available
    const currentSet = customQuestions?.phase2?.[setIndex] || PHASE2_SETS[setIndex];
    const currentItem = currentSet?.items[itemIndex];
    const totalItems = currentSet?.items.length || 0;

    // Get current player's team
    const myTeam = players[playerId]?.team;
    const otherTeam: Team | null = myTeam === 'spicy' ? 'sweet' : myTeam === 'sweet' ? 'spicy' : null;

    // Team-based answer tracking
    const myTeamAnswer = myTeam ? phase2TeamAnswers?.[myTeam] : undefined;
    const otherTeamAnswer = otherTeam ? phase2TeamAnswers?.[otherTeam] : undefined;

    // Local state
    const [showTransition, setShowTransition] = useState(false);
    const previousItemIdxRef = useRef<number | null>(null);

    // Determine round state
    const isRoundOver = phaseState === 'result';
    const didMyTeamWin = isRoundOver && phase2RoundWinner === myTeam;

    // Can this player answer?
    const hasMyTeamAnswered = !!myTeamAnswer;
    const didIAnswer = myTeamAnswer?.playerId === playerId;
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

    // Handle answer submission (team-based: only 1 person per team)
    const handleAnswer = useCallback((choice: Phase2Answer) => {
        if (!canAnswer) return;

        // Submit answer for team
        if (currentItem) {
            submitPhase2Answer(roomId, playerId, choice);
        }
    }, [canAnswer, roomId, playerId, currentItem]);

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
                <div className="text-2xl font-bold flex items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
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
            {/* Team Status Bar - Top */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-4">
                {/* My Team Status */}
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                    myTeam === 'spicy' ? 'bg-red-500/80' : 'bg-pink-500/80'
                } text-white backdrop-blur`}>
                    <span>{myTeam === 'spicy' ? '🌶️' : '🍬'}</span>
                    {hasMyTeamAnswered ? (
                        myTeamAnswer?.correct ? '✓' : '✗'
                    ) : (
                        <Loader2 className="w-4 h-4 animate-spin" />
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
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                    </div>
                )}
            </div>

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
                onZoneClick={canAnswer ? handleAnswer : undefined}
                disabled={!canAnswer}
            />

            {/* CENTER: Card & Results */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                {/* Result Overlay */}
                <AnimatePresence>
                    {isRoundOver && (
                        <Phase2Result
                            item={currentItem}
                            optionA={currentSet.optionA}
                            optionB={currentSet.optionB}
                            didWin={didMyTeamWin}
                            myTeam={myTeam}
                            roundWinner={phase2RoundWinner}
                            myTeamAnswer={myTeamAnswer}
                        />
                    )}
                </AnimatePresence>

                {/* Team Lock Overlay - When teammate answered but round not over */}
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

                {/* The Drag Card */}
                <Phase2Card
                    item={currentItem}
                    hasAnswered={hasMyTeamAnswered}
                    isRoundOver={isRoundOver}
                    didWin={didMyTeamWin}
                    onAnswer={handleAnswer}
                />

                {/* Waiting Feedback - When I answered and waiting for other team */}
                {didIAnswer && !isRoundOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute bottom-20 bg-slate-800/80 backdrop-blur text-white px-8 py-4 rounded-full font-bold text-xl flex items-center gap-2"
                    >
                        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
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
