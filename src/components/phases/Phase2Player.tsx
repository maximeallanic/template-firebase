import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { FoodLoader } from '../ui/FoodLoader';
import { submitPhase2Answer as submitPhase2AnswerToRoom, endPhase2Round } from '../../services/gameService';
import { usePhaseTransition } from '../../hooks/usePhaseTransition';
import type { Room, Team } from '../../services/gameService';
import type { SimplePhase2Set } from '../../types/gameTypes';
import { markQuestionAsSeen } from '../../services/historyService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useHaptic } from '../../hooks/useHaptic';
import { SimpleConfetti } from '../ui/SimpleConfetti';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import { SOLO_SCORING } from '../../types/soloTypes';

// Modular components
import { Phase2Card, Phase2Zones, Phase2Transition, Phase2Timer } from './phase2';
import type { Phase2Answer } from './phase2';

// Timer constants for parallel mode (multiplayer)
const PHASE2_TIMER_SECONDS = 20;

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
    const haptic = useHaptic();
    const controls = useAnimation();
    const isSolo = mode === 'solo';

    // Use centralized phase transition hook for multiplayer transitions
    const { showPhaseResults } = usePhaseTransition({
        room,
        isHost,
        isSolo,
    });

    // Extract values from room
    const roomId = room.code;
    const { players, customQuestions } = room;
    const {
        currentPhase2Set: setIndex = 0,
        currentPhase2Item: itemIndex = 0,
        phaseState = 'idle',
        phase2TeamAnswers,
        phase2RoundWinner,
        phase2BothCorrect,
    } = room.state;

    // In solo mode, customQuestions.phase2 is a single set, not an array
    // AI-generated questions are mandatory - no fallback data
    const currentSet: SimplePhase2Set | undefined = isSolo
        ? (customQuestions?.phase2 as SimplePhase2Set | undefined)
        : (customQuestions?.phase2 as SimplePhase2Set[] | undefined)?.[setIndex];
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

    // Timer state for parallel mode (multiplayer only)
    const [timeRemaining, setTimeRemaining] = useState(PHASE2_TIMER_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasHandledTimeoutRef = useRef(false);
    const phase2QuestionStartTime = room.state.phase2QuestionStartTime;

    // Reset solo state when item changes
    useEffect(() => {
        if (isSolo) {
            setSoloAnswered(false);
            setSoloResult(null);
        }
    }, [itemIndex, isSolo]);

    // Determine round state
    const isRoundOver = isSolo ? soloAnswered : phaseState === 'result';
    // My team wins if: single winner is my team OR both teams won (phase2RoundWinner === 'both')
    const didMyTeamWin = isSolo
        ? (soloResult?.correct ?? false)
        : (isRoundOver && (phase2RoundWinner === myTeam || phase2RoundWinner === 'both' || phase2BothCorrect === true));

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
    // Always show transition - Phase2Transition handles reduced motion internally
    useEffect(() => {
        if (previousItemIdxRef.current !== null &&
            previousItemIdxRef.current !== itemIndex &&
            currentItem) {
            setShowTransition(true);
        }
        previousItemIdxRef.current = itemIndex;
    }, [itemIndex, currentItem]);

    // Timer countdown for parallel mode (multiplayer only)
    useEffect(() => {
        // Skip timer for solo mode or when round is over
        if (isSolo || phaseState === 'result' || !phase2QuestionStartTime) {
            setTimeRemaining(PHASE2_TIMER_SECONDS);
            hasHandledTimeoutRef.current = false;
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - phase2QuestionStartTime) / 1000);
            const remaining = Math.max(0, PHASE2_TIMER_SECONDS - elapsed);
            setTimeRemaining(remaining);

            // Handle timeout (host triggers end)
            if (remaining === 0 && !hasHandledTimeoutRef.current && isHost) {
                hasHandledTimeoutRef.current = true;
                endPhase2Round(roomId);
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isSolo, phaseState, phase2QuestionStartTime, isHost, roomId, itemIndex]);

    // Handle answer submission
    const handleAnswer = useCallback((choice: Phase2Answer) => {
        if (!canAnswer || !currentItem) return;
        haptic.tap();

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
    }, [canAnswer, currentItem, isSolo, soloHandlers, roomId, playerId, haptic]);

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

    // Auto-trigger phase results when phase 2 is complete (multiplayer only)
    // Guard: only trigger if we're still in phase2 (prevents re-triggering after phase3 starts)
    useEffect(() => {
        if ((!currentSet || !currentItem) && isHost && !isSolo && room.state.status === 'phase2') {
            showPhaseResults();
        }
    }, [currentSet, currentItem, isHost, isSolo, room.state.status, showPhaseResults]);

    // --- FINISHED VIEW ---
    // Phase 2 complete - show brief loading while auto-transitioning to results
    if (!currentSet || !currentItem) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <FoodLoader size="lg" />
                <motion.h2
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    className="text-2xl font-bold mt-4"
                >
                    {t('game-phases:endPhase.phase2Complete')}
                </motion.h2>
            </div>
        );
    }

    // --- MAIN GAME VIEW ---
    return (
        <div className="fixed inset-0 flex overflow-hidden">
            {/* Team Status Bar - Top (multiplayer only) */}
            {!isSolo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-5 flex flex-col items-center gap-3">
                    {/* Discreet Timer */}
                    <Phase2Timer
                        timeRemaining={timeRemaining}
                        totalTime={PHASE2_TIMER_SECONDS}
                        isActive={!isRoundOver && phaseState === 'answering'}
                    />

                    {/* Team Status Indicators */}
                    <div className="flex gap-4">
                        {/* My Team Status */}
                        <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${
                            myTeam === 'spicy' ? 'bg-red-500/80' : 'bg-pink-500/80'
                        } text-white backdrop-blur`}>
                            <span>{myTeam === 'spicy' ? '🌶️' : '🍬'}</span>
                            {hasMyTeamAnswered ? (
                                isRoundOver ? (
                                    myTeamAnswer?.correct ? <CheckCircle className="w-4 h-4 text-green-300" /> : <XCircle className="w-4 h-4 text-red-300" />
                                ) : (
                                    <Lock className="w-4 h-4 text-yellow-300" />
                                )
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
                                    isRoundOver ? (
                                        otherTeamAnswer.correct ? <CheckCircle className="w-4 h-4 text-green-300" /> : <XCircle className="w-4 h-4 text-red-300" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-yellow-300" />
                                    )
                                ) : (
                                    <FoodLoader size="sm" variant={otherTeam === 'spicy' ? 'spicy' : 'sweet'} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Solo Progress Indicator - hidden on mobile (shown in header) */}
            {isSolo && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 hidden md:block">
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

            {/* Transition Screen - renders UNDERNEATH when transitioning */}
            <AnimatePresence>
                {showTransition && currentSet && currentItem && (
                    <Phase2Transition
                        itemNumber={itemIndex + 1}
                        totalItems={totalItems}
                        setName={`${currentSet.optionA} / ${currentSet.optionB}`}
                        onComplete={handleTransitionComplete}
                    />
                )}
            </AnimatePresence>

            {/* Drop Zones (Left / Right / Up) - split apart on transition */}
            <AnimatePresence mode="wait">
                {!showTransition && (
                    <Phase2Zones
                        key={`zones-${itemIndex}`}
                        optionA={currentSet.optionA}
                        optionB={currentSet.optionB}
                        optionADescription={currentSet.optionADescription}
                        optionBDescription={currentSet.optionBDescription}
                        humorousDescription={currentSet.humorousDescription}
                        onZoneClick={canAnswer ? handleAnswer : undefined}
                        disabled={!canAnswer}
                        isSolo={isSolo}
                    />
                )}
            </AnimatePresence>

            {/* CENTER: Card & Results - hidden during transition */}
            <AnimatePresence mode="wait">
                {!showTransition && (
                    <motion.div
                        key={`center-${itemIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-4 pb-24 md:pb-28 lg:pb-32 pointer-events-none z-20"
                    >
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
                            optionADescription={currentSet.optionADescription}
                            optionBDescription={currentSet.optionBDescription}
                            roundWinner={phase2RoundWinner}
                            myTeamAnswer={myTeamAnswer}
                            isSolo={isSolo}
                            bothTeamsCorrect={phase2BothCorrect ?? false}
                            revealedAnswer={room.revealedAnswers?.phase2?.[`${setIndex}_${itemIndex}`]?.answer}
                        />

                        {/* Waiting Feedback - When I answered and waiting for other team (multiplayer only) */}
                        {!isSolo && didIAnswer && !isRoundOver && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute bottom-20 bg-slate-800/80 backdrop-blur text-white px-8 py-4 rounded-full font-bold text-xl flex items-center gap-3"
                            >
                                <Lock className="w-5 h-5 text-yellow-400" />
                                <span>
                                    {t('phase2.lockedIn', { defaultValue: 'Réponse verrouillée !' })}
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
