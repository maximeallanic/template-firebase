/**
 * Solo Game Page
 * Main container for solo mode - wraps PhaseX components with solo context
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Trophy } from 'lucide-react';
import { GenerationLoadingCard } from '../components/ui/GenerationLoadingCard';
import { submitScore } from '../services/leaderboardService';
import { useAuthUser } from '../hooks/useAuthUser';
import type { Room, Avatar, Difficulty } from '../types/gameTypes';
import { DEFAULT_DIFFICULTY } from '../types/gameTypes';
import { SoloGameProvider, useSoloGame, createSoloHandlers } from '../contexts/SoloGameContext';
import { mapSoloStateToGameState, SOLO_PHASE_NAMES, SOLO_MAX_SCORE, SOLO_SCORING, type SoloPhaseStatus } from '../types/soloTypes';
import type { SimplePhase2Set } from '../types/gameTypes';
import { Phase1Player } from '../components/phases/Phase1Player';
import { Phase2Player } from '../components/phases/Phase2Player';
import { Phase4Player } from '../components/phases/Phase4Player';
import { SoloGameHeader } from '../components/solo/SoloGameHeader';
import { PhaseTransition } from '../components/game/PhaseTransition';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { PhaseStatus } from '../services/gameService';

// Inner component that uses the context
function SoloGameInner() {
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();
    const { user } = useAuthUser();
    const context = useSoloGame();
    const { state, startGame, resetGame, retryBackgroundGeneration } = context;
    const soloHandlers = useMemo(() => createSoloHandlers(context), [context]);

    // Ref to prevent double-calling startGame (React Strict Mode calls effects twice)
    const hasStartedRef = useRef(false);
    // Ref to prevent double-submitting score to leaderboard
    const hasSubmittedRef = useRef(false);

    // Transition state (like GameRoom.tsx)
    const [showTransition, setShowTransition] = useState(false);
    const [transitionPhase, setTransitionPhase] = useState<PhaseStatus>('phase1');
    const [displayStatus, setDisplayStatus] = useState<SoloPhaseStatus>(state.status);

    // Refs for stable callback access during transitions
    const prevStatusRef = useRef(state.status);
    const isTransitioning = useRef(false);
    const targetPhaseRef = useRef<PhaseStatus>('phase1');

    // Create a virtual Room object for PhaseX components
    const soloRoom: Room = useMemo(() => ({
        code: 'SOLO',
        hostId: state.playerId,
        players: {
            [state.playerId]: {
                id: state.playerId,
                name: state.playerName,
                avatar: state.playerAvatar,
                team: 'spicy', // Always spicy in solo mode
                isHost: true,
                score: state.totalScore,
                isOnline: true,
                joinedAt: state.startedAt || Date.now(),
            }
        },
        state: mapSoloStateToGameState(state),
        createdAt: state.startedAt || Date.now(),
        customQuestions: state.customQuestions,
    }), [state]);

    // Calculate current round info for header display (mobile)
    const roundInfo = useMemo(() => {
        if (state.status === 'phase1' && state.phase1State) {
            const total = state.customQuestions?.phase1?.length || SOLO_SCORING.phase1.maxQuestions;
            return { current: state.phase1State.currentQuestionIndex + 1, total };
        }
        if (state.status === 'phase2' && state.phase2State) {
            const phase2 = state.customQuestions?.phase2 as SimplePhase2Set | undefined;
            const total = phase2?.items?.length || SOLO_SCORING.phase2.maxItems;
            return { current: state.phase2State.currentItemIndex + 1, total };
        }
        if (state.status === 'phase4' && state.phase4State) {
            const total = state.customQuestions?.phase4?.length || SOLO_SCORING.phase4.maxQuestions;
            return { current: state.phase4State.currentQuestionIndex + 1, total };
        }
        return null;
    }, [state.status, state.phase1State, state.phase2State, state.phase4State, state.customQuestions]);

    // Auto-start game on mount (ref prevents double-call from React Strict Mode)
    // Note: "Replay" button calls startGame() directly, so no need to handle that case here
    useEffect(() => {
        if (state.status === 'setup' && !state.isGenerating && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startGame();
        }
    }, [state.status, state.isGenerating, startGame]);

    // Submit score to leaderboard when game ends
    useEffect(() => {
        if (state.status === 'results' && user && !hasSubmittedRef.current) {
            hasSubmittedRef.current = true;

            const accuracy = state.totalQuestions > 0
                ? Math.round((state.correctAnswers / state.totalQuestions) * 100)
                : 0;

            submitScore({
                playerId: user.uid,
                playerName: state.playerName,
                playerAvatar: state.playerAvatar,
                score: state.totalScore,
                phase1Score: state.phaseScores.phase1,
                phase2Score: state.phaseScores.phase2,
                phase4Score: state.phaseScores.phase4,
                accuracy,
                totalTimeMs: state.totalTimeMs || 0,
                isAuthenticated: true,
            }).catch(err => {
                console.error('[SoloGame] Failed to submit score:', err);
            });
        }
    }, [state.status, user, state.totalQuestions, state.correctAnswers, state.playerName,
        state.playerAvatar, state.totalScore, state.phaseScores, state.totalTimeMs]);

    // Phase Transition detection (synchronous before paint, like GameRoom.tsx)
    useLayoutEffect(() => {
        if (isTransitioning.current) return;

        // Game phases + waiting + results (mapped to 'victory' for transition)
        const transitionableStatuses = ['phase1', 'phase2', 'phase4', 'waiting_for_phase', 'results'];
        const isTransitionable = transitionableStatuses.includes(state.status);
        const wasTransitionable = transitionableStatuses.includes(prevStatusRef.current);
        // Also trigger transition when starting the game (generating -> phase1)
        const isGameStart = prevStatusRef.current === 'generating' && state.status === 'phase1';

        if (state.status !== prevStatusRef.current && isTransitionable) {
            if (wasTransitionable || isGameStart) {
                // Transition between phases, to results, or game start
                isTransitioning.current = true;
                // Map special statuses for PhaseTransition component
                let targetPhase: string;
                if (state.status === 'results') {
                    targetPhase = 'victory';
                } else if (state.status === 'waiting_for_phase' && state.pendingPhase) {
                    // Show the pending phase name in transition (even though questions aren't ready)
                    targetPhase = state.pendingPhase;
                } else {
                    targetPhase = state.status;
                }
                targetPhaseRef.current = targetPhase as PhaseStatus;
                setTransitionPhase(targetPhase as PhaseStatus);
                setShowTransition(true);
                // DON'T update displayStatus yet - wait for curtains to close
            } else {
                // Other cases - update directly (shouldn't happen in normal flow)
                setDisplayStatus(state.status);
            }
        }

        prevStatusRef.current = state.status;
    }, [state.status, state.pendingPhase]);

    // Callback when curtains are fully closed - update displayStatus before they open
    const handleCurtainsClosed = useCallback(() => {
        // Map 'victory' back to 'results' for displayStatus
        // targetPhaseRef.current can only be 'phase1', 'phase2', 'phase4', or 'victory' in solo mode
        const newStatus = targetPhaseRef.current === 'victory'
            ? 'results'
            : targetPhaseRef.current as SoloPhaseStatus;
        setDisplayStatus(newStatus);
    }, []);

    // Callback when transition animation completes
    const handleTransitionComplete = useCallback(() => {
        setShowTransition(false);
        isTransitioning.current = false;
    }, []);

    // --- SETUP/GENERATING VIEW ---
    if (state.status === 'setup' || state.status === 'generating') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full"
                >
                    <GenerationLoadingCard
                        error={state.generationError}
                        onRetry={() => { hasSubmittedRef.current = false; resetGame(); startGame(); }}
                    />
                </motion.div>
            </div>
        );
    }

    // --- WAITING FOR PHASE VIEW ---
    if (displayStatus === 'waiting_for_phase' && state.pendingPhase) {
        const phase = state.pendingPhase;
        const genStatus = state.backgroundGeneration[phase];
        const error = state.backgroundErrors[phase];

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full"
                >
                    <GenerationLoadingCard
                        error={genStatus === 'error' ? (error || 'Une erreur est survenue') : null}
                        onRetry={() => retryBackgroundGeneration(phase)}
                    />
                </motion.div>
            </div>
        );
    }

    // --- RESULTS VIEW ---
    if (displayStatus === 'results') {
        const accuracy = state.totalQuestions > 0
            ? Math.round((state.correctAnswers / state.totalQuestions) * 100)
            : 0;

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
                >
                    <motion.div
                        initial={prefersReducedMotion ? {} : { scale: 0 }}
                        animate={prefersReducedMotion ? {} : { scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="text-7xl mb-6"
                    >
                        {state.totalScore >= SOLO_MAX_SCORE * 0.8 ? '🏆' :
                         state.totalScore >= SOLO_MAX_SCORE * 0.5 ? '🎉' :
                         state.totalScore >= SOLO_MAX_SCORE * 0.3 ? '👍' : '💪'}
                    </motion.div>

                    <h2 className="text-3xl font-black mb-2">Partie terminée !</h2>

                    <div className="text-6xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent my-6">
                        {state.totalScore} / {SOLO_MAX_SCORE}
                    </div>

                    {/* Phase breakdown */}
                    <div className="space-y-2 mb-6">
                        {Object.entries(SOLO_PHASE_NAMES).map(([key, info]) => {
                            const phaseScore = state.phaseScores[key as keyof typeof state.phaseScores];
                            return (
                                <div
                                    key={key}
                                    className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3"
                                >
                                    <span className="font-medium">{info.name}</span>
                                    <span className="text-orange-400 font-mono">
                                        {phaseScore} / {info.maxScore}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-400">{accuracy}%</div>
                            <div className="text-sm text-gray-400">Précision</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-400">
                                {Math.floor((state.totalTimeMs || 0) / 1000)}s
                            </div>
                            <div className="text-sm text-gray-400">Temps total</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => { hasSubmittedRef.current = false; resetGame(); startGame(); }}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Rejouer
                        </button>
                        <button
                            onClick={() => navigate('/leaderboard')}
                            className="w-full bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                        >
                            <Trophy className="w-5 h-5" />
                            Classement
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full text-gray-400 hover:text-white py-2 transition-colors"
                        >
                            Retour à l'accueil
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // --- GAME PHASE VIEWS ---
    const currentPhase = SOLO_PHASE_NAMES[displayStatus as keyof typeof SOLO_PHASE_NAMES];

    return (
        <div className="min-h-screen flex flex-col">
            <SoloGameHeader
                score={state.totalScore}
                maxScore={SOLO_MAX_SCORE}
                phaseName={currentPhase?.shortName || ''}
                currentRound={roundInfo?.current}
                totalRounds={roundInfo?.total}
            />

            <div className="flex-1 flex items-center justify-center">
                {/* Phase Transition overlay (curtains + chalkboard) */}
                <PhaseTransition
                    phase={transitionPhase}
                    isVisible={showTransition}
                    onComplete={handleTransitionComplete}
                    onCurtainsClosed={handleCurtainsClosed}
                    isHost={false}
                />

                {/* Phase content - uses displayStatus (lags behind during transitions) */}
                {displayStatus === 'phase1' && (
                    <div className="w-full">
                        <Phase1Player
                            room={soloRoom}
                            playerId={state.playerId}
                            isHost={true}
                            mode="solo"
                            soloHandlers={soloHandlers}
                        />
                    </div>
                )}

                {displayStatus === 'phase2' && (
                    <div className="w-full">
                        <Phase2Player
                            room={soloRoom}
                            playerId={state.playerId}
                            isHost={true}
                            mode="solo"
                            soloHandlers={soloHandlers}
                        />
                    </div>
                )}

                {displayStatus === 'phase4' && (
                    <div className="w-full">
                        <Phase4Player
                            room={soloRoom}
                            playerId={state.playerId}
                            isHost={true}
                            mode="solo"
                            soloHandlers={soloHandlers}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrapper component that provides the context
export default function SoloGame() {
    const location = useLocation();
    const navigate = useNavigate();
    const { playerId, playerName, playerAvatar, difficulty } = (location.state as {
        playerId?: string;
        playerName?: string;
        playerAvatar?: Avatar;
        difficulty?: Difficulty;
    }) || {};

    // Redirect if no player info
    useEffect(() => {
        if (!playerName) {
            navigate('/solo', { replace: true });
        }
    }, [playerName, navigate]);

    if (!playerName) {
        return null;
    }

    return (
        <SoloGameProvider
            initialPlayerId={playerId || `solo_${Date.now()}`}
            initialPlayerName={playerName}
            initialPlayerAvatar={playerAvatar || 'chili'}
            initialDifficulty={difficulty || DEFAULT_DIFFICULTY}
        >
            <SoloGameInner />
        </SoloGameProvider>
    );
}
