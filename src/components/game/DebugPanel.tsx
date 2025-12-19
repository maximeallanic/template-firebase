/**
 * Debug Panel for single-window game testing
 * Only visible in development mode
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    addMockPlayer,
    clearMockPlayers,
    countMockPlayers,
    skipToPhase,
    resetAllScores
} from '../../services/debugService';
import { PHASE_NAMES, type Room, type PhaseStatus } from '../../services/gameService';
import { useMockPlayerOptional } from '../../hooks/useMockPlayer';
import { formatAnswerForDisplay } from '../../services/mockAnswerService';

interface DebugPanelProps {
    room: Room;
}

// Generate debug labels from canonical PHASE_NAMES
const getPhaseLabel = (phase: PhaseStatus): string => {
    const info = PHASE_NAMES[phase];
    if (phase === 'lobby') return info.shortName;
    const num = phase.replace('phase', 'P');
    return `${num}: ${info.shortName}`;
};

export function DebugPanel({ room }: DebugPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock player context (may be null if not wrapped in provider)
    const mockPlayer = useMockPlayerOptional();

    // Only render in dev mode
    if (!import.meta.env.DEV) return null;

    const mockCounts = countMockPlayers(room);
    const currentPhase = room.state.status;

    // Check if we're in a phase that supports mock answers
    const supportsMockAnswers = ['phase1', 'phase2', 'phase4'].includes(currentPhase);

    const handleAddBot = async (team: 'spicy' | 'sweet') => {
        setIsLoading(true);
        try {
            await addMockPlayer(room.code, team);
        } catch (error) {
            console.error('Failed to add mock player:', error);
        }
        setIsLoading(false);
    };

    const handleClearBots = async () => {
        setIsLoading(true);
        try {
            await clearMockPlayers(room.code);
        } catch (error) {
            console.error('Failed to clear mock players:', error);
        }
        setIsLoading(false);
    };

    const handleSkipToPhase = async (phase: PhaseStatus) => {
        setIsLoading(true);
        try {
            await skipToPhase(room.code, phase);
        } catch (error) {
            console.error('Failed to skip to phase:', error);
        }
        setIsLoading(false);
    };

    const handleResetScores = async () => {
        setIsLoading(true);
        try {
            await resetAllScores(room.code);
        } catch (error) {
            console.error('Failed to reset scores:', error);
        }
        setIsLoading(false);
    };

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
                        <span className="text-gray-400">{room.code}</span>
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
                            {/* Mock Players Section */}
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

                            {/* Mock Answers Section - Only show when context is available and in supported phase */}
                            {mockPlayer && supportsMockAnswers && mockCounts.total > 0 && (
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
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

                            {/* Phase Skip Section */}
                            <div className="p-3 border-b border-gray-700">
                                <div className="text-gray-400 mb-2">
                                    Phase actuelle: <span className="text-white">{getPhaseLabel(currentPhase)}</span>
                                </div>

                                <div className="grid grid-cols-3 gap-1">
                                    {(['lobby', 'phase1', 'phase2', 'phase3', 'phase4', 'phase5'] as PhaseStatus[]).map((phase) => (
                                        <button
                                            key={phase}
                                            onClick={() => handleSkipToPhase(phase)}
                                            disabled={isLoading || phase === currentPhase}
                                            className={`px-2 py-1.5 rounded text-center transition-colors ${
                                                phase === currentPhase
                                                    ? 'bg-green-600/50 text-green-300 cursor-default'
                                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50'
                                            }`}
                                        >
                                            {phase === 'lobby' ? 'Lobby' : phase.replace('phase', 'P')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div className="p-3">
                                <button
                                    onClick={handleResetScores}
                                    disabled={isLoading}
                                    className="w-full px-2 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-gray-300 transition-colors"
                                >
                                    Reset scores
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </motion.div>
    );
}
