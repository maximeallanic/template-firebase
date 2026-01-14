/**
 * Debug Panel for single-window game testing
 * Works in both multiplayer and solo modes
 * Only visible in development mode
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    addMockPlayer,
    clearMockPlayers,
    countMockPlayers,
    skipToPhase as multiplayerSkipToPhase,
    resetAllScores
} from '../../services/debugService';
import { FoodLoader } from '../ui/FoodLoader';
import { PHASE_NAMES, type Room, type PhaseStatus } from '../../services/gameService';
import { useMockPlayerOptional } from '../../hooks/useMockPlayer';
import { formatAnswerForDisplay } from '../../services/mockAnswerService';
import type { SoloGameContextValue } from '../../contexts/SoloGameContext';
import type { SoloPhaseStatus } from '../../types/soloTypes';

interface DebugPanelProps {
    // Multiplayer mode
    room?: Room;
    // Solo mode
    soloContext?: SoloGameContextValue;
}

// Generate debug labels from canonical PHASE_NAMES (multiplayer)
const getPhaseLabel = (phase: PhaseStatus): string => {
    const info = PHASE_NAMES[phase];
    if (phase === 'lobby') return info.shortName;
    const num = phase.replace('phase', 'P');
    return `${num}: ${info.shortName}`;
};

// Generate debug labels for solo phases
const getSoloPhaseLabel = (phase: SoloPhaseStatus): string => {
    switch (phase) {
        case 'setup': return 'Setup';
        case 'generating': return 'Generating';
        case 'phase1': return 'P1: Tenders';
        case 'phase2': return 'P2: Sucré Salé';
        case 'phase4': return 'P4: La Note';
        case 'waiting_for_phase': return 'Waiting...';
        case 'results': return 'Results';
        default: return phase;
    }
};

export function DebugPanel({ room, soloContext }: DebugPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Detect mode
    const mode = room ? 'multiplayer' : soloContext ? 'solo' : null;

    // Mock player context (may be null if not wrapped in provider)
    const mockPlayer = useMockPlayerOptional();

    // Only render in dev mode and if a mode is detected
    if (!import.meta.env.DEV || !mode) return null;

    // === MULTIPLAYER MODE HELPERS ===
    const mockCounts = mode === 'multiplayer' ? countMockPlayers(room!) : { total: 0, spicy: 0, sweet: 0 };
    const multiplayerPhase = mode === 'multiplayer' ? room!.state.status : null;
    const supportsMockAnswers = multiplayerPhase ? ['phase1', 'phase2', 'phase4'].includes(multiplayerPhase) : false;

    const handleAddBot = async (team: 'spicy' | 'sweet') => {
        if (mode !== 'multiplayer') return;
        setIsLoading(true);
        try {
            await addMockPlayer(room!.code, team);
        } catch (error) {
            console.error('Failed to add mock player:', error);
        }
        setIsLoading(false);
    };

    const handleClearBots = async () => {
        if (mode !== 'multiplayer') return;
        setIsLoading(true);
        try {
            await clearMockPlayers(room!.code);
        } catch (error) {
            console.error('Failed to clear mock players:', error);
        }
        setIsLoading(false);
    };

    const handleMultiplayerSkipToPhase = async (phase: PhaseStatus) => {
        if (mode !== 'multiplayer') return;
        setIsLoading(true);
        try {
            await multiplayerSkipToPhase(room!.code, phase);
        } catch (error) {
            console.error('Failed to skip to phase:', error);
        }
        setIsLoading(false);
    };

    const handleResetScores = async () => {
        if (mode !== 'multiplayer') return;
        setIsLoading(true);
        try {
            await resetAllScores(room!.code);
        } catch (error) {
            console.error('Failed to reset scores:', error);
        }
        setIsLoading(false);
    };

    // === SOLO MODE HELPERS ===
    const soloState = mode === 'solo' ? soloContext!.state : null;
    const soloPhase = soloState?.status ?? null;
    const soloSupportsAutoAnswer = soloPhase ? ['phase1', 'phase2', 'phase4'].includes(soloPhase) : false;

    // Check if questions are available for each solo phase
    const isSoloPhaseReady = (phase: SoloPhaseStatus): boolean => {
        if (!soloState) return false;
        if (phase === 'setup' || phase === 'results') return true;
        if (phase === 'phase1') return (soloState.customQuestions.phase1?.length ?? 0) > 0;
        if (phase === 'phase2') return (soloState.customQuestions.phase2?.items?.length ?? 0) > 0;
        if (phase === 'phase4') return (soloState.customQuestions.phase4?.length ?? 0) > 0;
        return false;
    };

    const handleSoloSkipToPhase = (phase: SoloPhaseStatus) => {
        if (mode !== 'solo') return;
        soloContext!.skipToPhase(phase);
    };

    const handleSoloReset = () => {
        if (mode !== 'solo') return;
        soloContext!.resetGame();
    };

    // Auto-answer with random choice for solo mode
    const handleSoloRandomAnswer = () => {
        if (mode !== 'solo' || !soloPhase) return;

        if (soloPhase === 'phase1') {
            const randomIndex = Math.floor(Math.random() * 4);
            soloContext!.submitPhase1Answer(randomIndex);
        } else if (soloPhase === 'phase2') {
            const choices: ('A' | 'B' | 'Both')[] = ['A', 'B', 'Both'];
            const randomChoice = choices[Math.floor(Math.random() * 3)];
            soloContext!.submitPhase2Answer(randomChoice);
        } else if (soloPhase === 'phase4') {
            const randomIndex = Math.floor(Math.random() * 4);
            soloContext!.submitPhase4Answer(randomIndex);
        }
    };

    // === RENDER ===
    const headerLabel = mode === 'multiplayer' ? room!.code : 'SOLO';
    const currentPhaseDisplay = mode === 'multiplayer'
        ? getPhaseLabel(multiplayerPhase!)
        : getSoloPhaseLabel(soloPhase!);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-[9999] font-mono text-xs"
        >
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden min-w-[240px]">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 cursor-pointer select-none"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-400">DEBUG</span>
                        <span className="text-gray-500">|</span>
                        <span className={mode === 'solo' ? 'text-orange-400' : 'text-gray-400'}>
                            {headerLabel}
                        </span>
                    </div>
                    <button className="text-gray-400 hover:text-white transition-colors">
                        {isCollapsed ? '+' : '-'}
                    </button>
                </div>

                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Mock Players Section - Multiplayer only */}
                            {mode === 'multiplayer' && (
                                <div className="p-3 border-b border-gray-700">
                                    <div className="text-gray-400 mb-2 flex items-center gap-1">
                                        <span>Joueurs fictifs</span>
                                    </div>

                                    <div className="flex gap-2 mb-2">
                                        <button
                                            onClick={() => handleAddBot('spicy')}
                                            disabled={isLoading}
                                            className="flex-1 px-2 py-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 rounded text-white transition-colors"
                                        >
                                            + Spicy
                                        </button>
                                        <button
                                            onClick={() => handleAddBot('sweet')}
                                            disabled={isLoading}
                                            className="flex-1 px-2 py-1.5 bg-pink-500/80 hover:bg-pink-500 disabled:opacity-50 rounded text-white transition-colors"
                                        >
                                            + Sweet
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">
                                            Bots: {mockCounts.total}
                                            <span className="text-red-400 ml-1">({mockCounts.spicy})</span>
                                            <span className="text-pink-400 ml-1">({mockCounts.sweet})</span>
                                        </span>
                                        {mockCounts.total > 0 && (
                                            <button
                                                onClick={handleClearBots}
                                                disabled={isLoading}
                                                className="px-2 py-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mock Answers Section - Multiplayer only (when context is available and in supported phase) */}
                            {mode === 'multiplayer' && mockPlayer && supportsMockAnswers && mockCounts.total > 0 && (
                                <div className="p-3 border-b border-gray-700">
                                    <div className="text-gray-400 mb-2 flex items-center justify-between">
                                        <span>Réponses Mock</span>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={mockPlayer.isAutoAnswerEnabled}
                                                onChange={(e) => mockPlayer.setAutoAnswerEnabled(e.target.checked)}
                                                className="w-3 h-3 rounded border-gray-600 bg-gray-700 text-green-500 focus:ring-0 focus:ring-offset-0"
                                            />
                                            <span className="text-gray-500 text-[10px]">Auto</span>
                                        </label>
                                    </div>

                                    {/* Pending answers list */}
                                    {mockPlayer.pendingAnswers.length > 0 ? (
                                        <>
                                            <div className="mb-2 max-h-24 overflow-y-auto space-y-1">
                                                {mockPlayer.pendingAnswers.map((answer, idx) => (
                                                    <div
                                                        key={`${answer.mockPlayerId}-${idx}`}
                                                        className="flex items-center justify-between text-[10px] py-0.5"
                                                    >
                                                        <span className={answer.playerTeam === 'spicy' ? 'text-red-400' : 'text-pink-400'}>
                                                            {answer.playerName}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {formatAnswerForDisplay(answer.phase, answer.answer)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => mockPlayer.validateAllAnswers()}
                                                disabled={mockPlayer.isValidating}
                                                className="w-full px-2 py-1.5 bg-green-600/80 hover:bg-green-600 disabled:opacity-50 rounded text-white transition-colors flex items-center justify-center gap-2"
                                            >
                                                {mockPlayer.isValidating ? (
                                                    <>
                                                        <FoodLoader size="sm" />
                                                        <span>Envoi...</span>
                                                    </>
                                                ) : (
                                                    <span>Valider tout ({mockPlayer.pendingAnswers.length})</span>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-gray-600 text-center py-2">
                                            Aucune réponse en attente
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Auto-answer Section - Solo only */}
                            {mode === 'solo' && soloSupportsAutoAnswer && (
                                <div className="p-3 border-b border-gray-700">
                                    <div className="text-gray-400 mb-2">Auto-réponse</div>
                                    <button
                                        onClick={handleSoloRandomAnswer}
                                        className="w-full px-2 py-1.5 bg-purple-600/80 hover:bg-purple-600 rounded text-white transition-colors"
                                    >
                                        🎲 Réponse aléatoire
                                    </button>
                                </div>
                            )}

                            {/* Phase Skip Section - Multiplayer */}
                            {mode === 'multiplayer' && (
                                <div className="p-3 border-b border-gray-700">
                                    <div className="text-gray-400 mb-2">
                                        Phase actuelle: <span className="text-white">{currentPhaseDisplay}</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1">
                                        {(['lobby', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5'] as PhaseStatus[]).map((phase) => (
                                            <button
                                                key={phase}
                                                onClick={() => handleMultiplayerSkipToPhase(phase)}
                                                disabled={isLoading || phase === multiplayerPhase}
                                                className={`px-2 py-1.5 rounded text-center transition-colors ${
                                                    phase === multiplayerPhase
                                                        ? 'bg-green-600/50 text-green-300 cursor-default'
                                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50'
                                                }`}
                                            >
                                                {phase === 'lobby' ? 'Lobby' : phase.replace('phase', 'P')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Phase Skip Section - Solo */}
                            {mode === 'solo' && (
                                <div className="p-3 border-b border-gray-700">
                                    <div className="text-gray-400 mb-2">
                                        Phase actuelle: <span className="text-white">{currentPhaseDisplay}</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-1">
                                        {(['setup', 'phase1', 'phase2', 'phase4', 'results'] as SoloPhaseStatus[]).map((phase) => {
                                            const isReady = isSoloPhaseReady(phase);
                                            const isCurrent = phase === soloPhase;
                                            const isDisabled = !isReady || isCurrent;

                                            return (
                                                <button
                                                    key={phase}
                                                    onClick={() => handleSoloSkipToPhase(phase)}
                                                    disabled={isDisabled}
                                                    title={!isReady ? 'Questions non générées' : undefined}
                                                    className={`px-2 py-1.5 rounded text-center transition-colors ${
                                                        isCurrent
                                                            ? 'bg-green-600/50 text-green-300 cursor-default'
                                                            : isReady
                                                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {phase === 'setup' ? 'Setup' :
                                                     phase === 'results' ? 'End' :
                                                     phase.replace('phase', 'P')}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Actions Section */}
                            <div className="p-3">
                                {mode === 'multiplayer' ? (
                                    <button
                                        onClick={handleResetScores}
                                        disabled={isLoading}
                                        className="w-full px-2 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-gray-300 transition-colors"
                                    >
                                        Reset scores
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSoloReset}
                                        className="w-full px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                                    >
                                        Recommencer
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Loading indicator - Multiplayer only (solo is sync) */}
            {mode === 'multiplayer' && isLoading && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
                    <FoodLoader size="sm" />
                </div>
            )}
        </motion.div>
    );
}
