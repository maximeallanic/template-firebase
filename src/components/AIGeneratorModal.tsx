import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Check, AlertTriangle, BrainCircuit } from 'lucide-react';
import { generateGameQuestions } from '../services/aiClient';
import { overwriteGameQuestions } from '../services/gameService';

type Difficulty = 'easy' | 'normal' | 'hard' | 'wtf';
type GeneratedData = Record<string, unknown> | unknown[] | null;

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomCode: string;
    autoTrigger?: boolean;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose, roomCode, autoTrigger = false }) => {
    const [phase, setPhase] = useState<'phase1' | 'phase2' | 'phase5'>('phase1');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<GeneratedData>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const hasAutoTriggered = useRef(false);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedData(null);
        setSuccessMessage(null);

        try {
            const result = await generateGameQuestions({
                phase,
                topic: topic || undefined,
                difficulty
            });

            if (result.data) {
                setGeneratedData(result.data);
            } else {
                throw new Error("No data received from AI");
            }
        } catch (err: unknown) {
            console.error("AI Generation Error:", err);
            const message = err instanceof Error ? err.message : "Failed to generate questions. Try again.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [phase, topic, difficulty]);

    // Auto-Trigger Logic
    useEffect(() => {
        if (isOpen && autoTrigger && !hasAutoTriggered.current) {
            hasAutoTriggered.current = true;
            handleGenerate();
        }
        if (!isOpen) {
            hasAutoTriggered.current = false;
        }
    }, [isOpen, autoTrigger, handleGenerate]);

    const handleApply = async () => {
        if (!generatedData) return;
        setIsLoading(true);
        try {
            await overwriteGameQuestions(roomCode, phase, generatedData);
            setSuccessMessage("Game updated successfully! 🎮");
            setTimeout(() => {
                onClose();
                setSuccessMessage(null);
                setGeneratedData(null);
            }, 1500);
        } catch (err: unknown) {
            console.error("Apply Error:", err);
            setError("Failed to apply questions to game.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-slate-900 border border-indigo-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">AI Game Generator</h2>
                                <p className="text-xs text-indigo-300">Powered by Google Gemini</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/50 text-green-200 p-4 rounded-xl flex items-center gap-3">
                                <Check className="w-5 h-5 shrink-0" />
                                {successMessage}
                            </div>
                        )}

                        {/* Configuration Form */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Phase Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Game Phase</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => setPhase('phase1')}
                                        className={`p-3 rounded-lg border text-left transition-all ${phase === 'phase1' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold">Phase 1: Nuggets</div>
                                        <div className="text-xs opacity-70">Speed Multiple Choice</div>
                                    </button>
                                    <button
                                        onClick={() => setPhase('phase2')}
                                        className={`p-3 rounded-lg border text-left transition-all ${phase === 'phase2' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold">Phase 2: Salt or Pepper</div>
                                        <div className="text-xs opacity-70">Rapid Fire Binary Choice</div>
                                    </button>
                                    <button
                                        onClick={() => setPhase('phase5')}
                                        className={`p-3 rounded-lg border text-left transition-all ${phase === 'phase5' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold">Phase 5: Burger de la Mort</div>
                                        <div className="text-xs opacity-70">Memory Challenge</div>
                                    </button>
                                </div>
                            </div>

                            {/* Parameters */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Topic (Optional)</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., 90s Music, Star Wars, Cheeses..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                                    />
                                    <p className="text-xs text-slate-500">Leave empty for random "Burger Quiz" chaos.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Difficulty / Tone</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="normal">Normal (Classic)</option>
                                        <option value="easy">Easy (Kids)</option>
                                        <option value="hard">Hard (Experts)</option>
                                        <option value="wtf">WTF (Absurd/Troll)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Preview Area */}
                        {generatedData && (
                            <div className="mt-6 bg-slate-950 rounded-xl border border-slate-800 p-4 max-h-60 overflow-y-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                                        <BrainCircuit className="w-4 h-4" /> Generated Content
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        {Array.isArray(generatedData) ? `${generatedData.length} items` : '1 Set'}
                                    </span>
                                </div>
                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                                    {JSON.stringify(generatedData, null, 2)}
                                </pre>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-indigo-500/20 bg-slate-900/50 flex justify-end gap-3 sticky bottom-0">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>

                        {!generatedData ? (
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform hover:translate-y-px"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" /> Generate Magic
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleApply}
                                disabled={isLoading}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-all animate-bounce-short"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Apply to Game
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
