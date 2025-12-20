/**
 * Solo Game Page
 * Main container for solo mode - wraps PhaseX components with solo context
 */

import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw, Trophy } from 'lucide-react';
import { FoodLoader } from '../components/ui/FoodLoader';
import type { Room, Avatar } from '../types/gameTypes';
import { SoloGameProvider, useSoloGame, createSoloHandlers } from '../contexts/SoloGameContext';
import { mapSoloStateToGameState, SOLO_PHASE_NAMES, SOLO_MAX_SCORE } from '../types/soloTypes';
import { Phase1Player } from '../components/phases/Phase1Player';
import { Phase2Player } from '../components/phases/Phase2Player';
import { Phase4Player } from '../components/phases/Phase4Player';
import { SoloGameHeader } from '../components/solo/SoloGameHeader';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Inner component that uses the context
function SoloGameInner() {
    const navigate = useNavigate();
    const prefersReducedMotion = useReducedMotion();
    const context = useSoloGame();
    const { state, startGame, resetGame } = context;
    const soloHandlers = useMemo(() => createSoloHandlers(context), [context]);

    // Ref to prevent double-calling startGame (React Strict Mode calls effects twice)
    const hasStartedRef = useRef(false);

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

    // Auto-start game on mount (ref prevents double-call from React Strict Mode)
    // Note: "Replay" button calls startGame() directly, so no need to handle that case here
    useEffect(() => {
        if (state.status === 'setup' && !state.isGenerating && !hasStartedRef.current) {
            hasStartedRef.current = true;
            startGame();
        }
    }, [state.status, state.isGenerating, startGame]);

    // --- SETUP/GENERATING VIEW ---
    if (state.status === 'setup' || state.status === 'generating') {
        const progress = state.generationProgress;
        const phases = ['phase1', 'phase2', 'phase4'] as const;

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
                >
                    {state.generationError ? (
                        <>
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Erreur</h2>
                            <p className="text-gray-400 mb-6">{state.generationError}</p>
                            <button
                                onClick={() => { resetGame(); startGame(); }}
                                className="bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Réessayer
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-center mb-4">
                                <FoodLoader size="xl" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Préparation du quiz...</h2>
                            <p className="text-gray-400 mb-6">Génération des questions par IA</p>

                            {/* Progress indicators */}
                            <div className="space-y-3">
                                {phases.map((phase) => {
                                    const status = progress[phase];
                                    const info = SOLO_PHASE_NAMES[phase];
                                    return (
                                        <div
                                            key={phase}
                                            className={`flex items-center justify-between p-3 rounded-lg ${
                                                status === 'done' ? 'bg-green-500/20' :
                                                status === 'generating' ? 'bg-orange-500/20' :
                                                status === 'error' ? 'bg-red-500/20' :
                                                'bg-slate-800/50'
                                            }`}
                                        >
                                            <span className="font-medium">{info.name}</span>
                                            <span className={`text-sm ${
                                                status === 'done' ? 'text-green-400' :
                                                status === 'generating' ? 'text-orange-400' :
                                                status === 'error' ? 'text-red-400' :
                                                'text-gray-500'
                                            }`}>
                                                {status === 'done' ? '✓' :
                                                 status === 'generating' ? 'En cours...' :
                                                 status === 'error' ? '✗' :
                                                 'En attente'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        );
    }

    // --- RESULTS VIEW ---
    if (state.status === 'results') {
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
                            onClick={() => { resetGame(); startGame(); }}
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
    const currentPhase = SOLO_PHASE_NAMES[state.status as keyof typeof SOLO_PHASE_NAMES];

    return (
        <div className="min-h-screen flex flex-col">
            <SoloGameHeader
                score={state.totalScore}
                maxScore={SOLO_MAX_SCORE}
                phaseName={currentPhase?.shortName || ''}
                phaseScores={state.phaseScores}
            />

            <div className="flex-1 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {state.status === 'phase1' && (
                        <motion.div
                            key="phase1"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="w-full"
                        >
                            <Phase1Player
                                room={soloRoom}
                                playerId={state.playerId}
                                isHost={true}
                                mode="solo"
                                soloHandlers={soloHandlers}
                            />
                        </motion.div>
                    )}

                    {state.status === 'phase2' && (
                        <motion.div
                            key="phase2"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="w-full"
                        >
                            <Phase2Player
                                room={soloRoom}
                                playerId={state.playerId}
                                isHost={true}
                                mode="solo"
                                soloHandlers={soloHandlers}
                            />
                        </motion.div>
                    )}

                    {state.status === 'phase4' && (
                        <motion.div
                            key="phase4"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="w-full"
                        >
                            <Phase4Player
                                room={soloRoom}
                                playerId={state.playerId}
                                isHost={true}
                                mode="solo"
                                soloHandlers={soloHandlers}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Wrapper component that provides the context
export default function SoloGame() {
    const location = useLocation();
    const navigate = useNavigate();
    const { playerId, playerName, playerAvatar } = (location.state as {
        playerId?: string;
        playerName?: string;
        playerAvatar?: Avatar;
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
        >
            <SoloGameInner />
        </SoloGameProvider>
    );
}
