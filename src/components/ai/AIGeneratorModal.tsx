import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, AlertTriangle, BrainCircuit, Zap } from 'lucide-react';
import { FoodLoader } from '../ui/FoodLoader';
import { generateGameQuestions } from '../../services/aiClient';
import { overwriteGameQuestions } from '../../services/gameService';

type Difficulty = 'easy' | 'normal' | 'hard' | 'wtf';
type Phase = 'phase1' | 'phase2' | 'phase5';
type GeneratedData = Record<string, unknown> | unknown[] | null;

interface AIGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomCode: string;
    autoTrigger?: boolean;
    autoGenerateAll?: boolean; // New prop to auto-generate all phases
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose, roomCode, autoTrigger = false, autoGenerateAll = false }) => {
    const [phase, setPhase] = useState<Phase>('phase1');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState<Difficulty>('normal');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedData, setGeneratedData] = useState<GeneratedData>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const hasAutoTriggered = useRef(false);

    // Progress for "Generate All" mode
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [allPhasesProgress, setAllPhasesProgress] = useState<{
        phase1: 'pending' | 'generating' | 'done' | 'error';
        phase2: 'pending' | 'generating' | 'done' | 'error';
        phase5: 'pending' | 'generating' | 'done' | 'error';
    }>({ phase1: 'pending', phase2: 'pending', phase5: 'pending' });

    const handleGenerate = useCallback(async () => {
        const startTime = performance.now();
        console.log('[AI-MODAL] 🎯 handleGenerate triggered', {
            phase,
            topic: topic || '(empty)',
            difficulty,
            roomCode,
            timestamp: new Date().toISOString()
        });

        setIsLoading(true);
        setError(null);
        setGeneratedData(null);
        setSuccessMessage(null);

        try {
            console.log('[AI-MODAL] 📤 Calling generateGameQuestions...');
            const result = await generateGameQuestions({
                phase,
                topic: topic || undefined,
                difficulty
            });

            const duration = Math.round(performance.now() - startTime);
            console.log('[AI-MODAL] 📥 Generation result received', {
                success: !!result.data,
                dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
                dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
                topic: result.topic,
                usage: result.usage,
                duration: `${duration}ms`
            });

            if (result.data) {
                setGeneratedData(result.data);
            } else {
                console.error('[AI-MODAL] ❌ No data in result!', result);
                throw new Error("No data received from AI");
            }
        } catch (err: unknown) {
            const duration = Math.round(performance.now() - startTime);
            console.error('[AI-MODAL] ❌ Generation error after', `${duration}ms:`, {
                errorName: (err as Error)?.name,
                errorMessage: (err as Error)?.message,
                errorCode: (err as { code?: string })?.code
            });
            const message = err instanceof Error ? err.message : "Échec de la génération. Réessayez.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [phase, topic, difficulty, roomCode]);

    // Generate all phases at once
    const handleGenerateAll = useCallback(async () => {
        const totalStartTime = performance.now();
        console.log('[AI-MODAL] 🚀 handleGenerateAll triggered', {
            topic: topic || '(empty)',
            difficulty,
            roomCode,
            timestamp: new Date().toISOString()
        });

        setIsGeneratingAll(true);
        setError(null);
        setSuccessMessage(null);
        setAllPhasesProgress({ phase1: 'pending', phase2: 'pending', phase5: 'pending' });

        const phases: Phase[] = ['phase1', 'phase2', 'phase5'];
        let hasError = false;

        for (const p of phases) {
            const phaseStartTime = performance.now();
            console.log(`[AI-MODAL] 🎲 Starting generation for ${p}...`);
            setAllPhasesProgress(prev => ({ ...prev, [p]: 'generating' }));

            try {
                const result = await generateGameQuestions({
                    phase: p,
                    topic: topic || undefined,
                    difficulty
                });

                const phaseDuration = Math.round(performance.now() - phaseStartTime);
                console.log(`[AI-MODAL] 📥 ${p} result received in ${phaseDuration}ms`, {
                    hasData: !!result.data,
                    dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
                    topic: result.topic
                });

                if (result.data) {
                    console.log(`[AI-MODAL] 💾 Saving ${p} to Firebase...`);
                    await overwriteGameQuestions(roomCode, p, result.data);
                    setAllPhasesProgress(prev => ({ ...prev, [p]: 'done' }));
                    console.log(`[AI-MODAL] ✅ ${p} generated and saved successfully!`);
                } else {
                    console.error(`[AI-MODAL] ❌ ${p} returned no data!`);
                    throw new Error(`No data for ${p}`);
                }
            } catch (err) {
                const phaseDuration = Math.round(performance.now() - phaseStartTime);
                console.error(`[AI-MODAL] ❌ Error generating ${p} after ${phaseDuration}ms:`, {
                    errorMessage: (err as Error)?.message,
                    errorCode: (err as { code?: string })?.code
                });
                setAllPhasesProgress(prev => ({ ...prev, [p]: 'error' }));
                hasError = true;
            }
        }

        const totalDuration = Math.round(performance.now() - totalStartTime);
        console.log(`[AI-MODAL] 🏁 handleGenerateAll completed in ${totalDuration}ms`, {
            hasError,
            phases: ['phase1', 'phase2', 'phase5']
        });

        setIsGeneratingAll(false);

        if (!hasError) {
            setSuccessMessage("🎉 Toutes les phases ont été générées avec succès!");
            setTimeout(() => {
                onClose();
            }, 2000);
        } else {
            setError("Certaines phases ont échoué. Réessayez ou générez-les individuellement.");
        }
    }, [topic, difficulty, roomCode, onClose]);

    // Auto-Trigger Logic
    useEffect(() => {
        if (isOpen && autoTrigger && !hasAutoTriggered.current) {
            console.log('[AI-MODAL] 🔄 Auto-trigger: Starting single phase generation');
            hasAutoTriggered.current = true;
            handleGenerate();
        }
        if (isOpen && autoGenerateAll && !hasAutoTriggered.current) {
            console.log('[AI-MODAL] 🔄 Auto-trigger: Starting all phases generation');
            hasAutoTriggered.current = true;
            handleGenerateAll();
        }
        if (!isOpen) {
            if (hasAutoTriggered.current) {
                console.log('[AI-MODAL] Modal closed, resetting auto-trigger flag');
            }
            hasAutoTriggered.current = false;
            // Reset progress when modal closes
            setAllPhasesProgress({ phase1: 'pending', phase2: 'pending', phase5: 'pending' });
        }
    }, [isOpen, autoTrigger, autoGenerateAll, handleGenerate, handleGenerateAll]);

    const handleApply = async () => {
        if (!generatedData) {
            console.warn('[AI-MODAL] handleApply called with no generated data!');
            return;
        }

        console.log('[AI-MODAL] 💾 handleApply: Saving generated data to Firebase...', {
            phase,
            roomCode,
            dataLength: Array.isArray(generatedData) ? generatedData.length : 'N/A'
        });

        setIsLoading(true);
        try {
            await overwriteGameQuestions(roomCode, phase, generatedData);
            console.log('[AI-MODAL] ✅ Questions applied to game successfully');
            setSuccessMessage("Jeu mis à jour avec succès ! 🎮");
            setTimeout(() => {
                onClose();
                setSuccessMessage(null);
                setGeneratedData(null);
            }, 1500);
        } catch (err: unknown) {
            console.error('[AI-MODAL] ❌ Apply error:', {
                errorMessage: (err as Error)?.message,
                errorCode: (err as { code?: string })?.code
            });
            setError("Échec de l'application des questions au jeu.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* Backdrop - opacity animation only (no scale/translate) */}
            <motion.div
                key="ai-modal-backdrop"
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onClose}
            />

            {/* Modal content container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                    key="ai-modal-content"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-900 border border-indigo-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Générateur IA</h2>
                                <p className="text-xs text-indigo-300">Propulsé par Google Gemini</p>
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
                                <label className="text-sm font-medium text-slate-300">Phase du Jeu</label>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={() => setPhase('phase1')}
                                        className={`p-3 rounded-lg border text-left transition-all ${phase === 'phase1' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold">Phase 1: Tenders</div>
                                        <div className="text-xs opacity-70">QCM Rapide</div>
                                    </button>
                                    <button
                                        onClick={() => setPhase('phase2')}
                                        className={`p-3 rounded-lg border text-left transition-all ${phase === 'phase2' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold">Phase 2: Sucré Salé</div>
                                        <div className="text-xs opacity-70">Choix Binaire Ultra Rapide</div>
                                    </button>
                                    <button
                                        onClick={() => setPhase('phase5')}
                                        className={`p-3 rounded-lg border text-left transition-all ${phase === 'phase5' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <div className="font-bold">Phase 5: Burger Ultime</div>
                                        <div className="text-xs opacity-70">Défi Mémoire</div>
                                    </button>
                                </div>
                            </div>

                            {/* Parameters */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Thème (Optionnel)</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="ex: Musique des 90s, Star Wars, Fromages..."
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
                                    />
                                    <p className="text-xs text-slate-500">Laissez vide pour un chaos culinaire aléatoire.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Difficulté / Ton</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="normal">Normal (Classique)</option>
                                        <option value="easy">Facile (Enfants)</option>
                                        <option value="hard">Difficile (Experts)</option>
                                        <option value="wtf">WTF (Absurde/Troll)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Generate All Progress */}
                        {isGeneratingAll && (
                            <div className="mt-6 bg-slate-950 rounded-xl border border-indigo-500/30 p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                                    <span className="font-bold text-white">Génération de toutes les phases...</span>
                                </div>
                                <div className="space-y-2">
                                    {(['phase1', 'phase2', 'phase5'] as const).map((p) => (
                                        <div key={p} className="flex items-center gap-3">
                                            {allPhasesProgress[p] === 'pending' && (
                                                <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                                            )}
                                            {allPhasesProgress[p] === 'generating' && (
                                                <FoodLoader size="sm" />
                                            )}
                                            {allPhasesProgress[p] === 'done' && (
                                                <Check className="w-5 h-5 text-green-400" />
                                            )}
                                            {allPhasesProgress[p] === 'error' && (
                                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                            )}
                                            <span className={`text-sm ${allPhasesProgress[p] === 'done' ? 'text-green-400' : allPhasesProgress[p] === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                                                {p === 'phase1' ? 'Phase 1: Tenders' : p === 'phase2' ? 'Phase 2: Sucré Salé' : 'Phase 5: Burger Ultime'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview Area */}
                        {generatedData && !isGeneratingAll && (
                            <div className="mt-6 bg-slate-950 rounded-xl border border-slate-800 p-4 max-h-60 overflow-y-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1">
                                        <BrainCircuit className="w-4 h-4" /> Contenu Généré
                                    </label>
                                    <span className="text-xs text-slate-500">
                                        {Array.isArray(generatedData) ? `${generatedData.length} éléments` : '1 Set'}
                                    </span>
                                </div>
                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                                    {JSON.stringify(generatedData, null, 2)}
                                </pre>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-indigo-500/20 bg-slate-900/50 flex flex-wrap justify-end gap-3 sticky bottom-0">
                        <button
                            onClick={onClose}
                            disabled={isGeneratingAll}
                            className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            {isGeneratingAll ? 'Patientez...' : 'Annuler'}
                        </button>

                        {/* Generate All button - always visible when not generating */}
                        {!isGeneratingAll && !generatedData && (
                            <button
                                onClick={handleGenerateAll}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                            >
                                <Zap className="w-5 h-5" /> Générer TOUT
                            </button>
                        )}

                        {!generatedData && !isGeneratingAll ? (
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform hover:translate-y-px"
                            >
                                {isLoading ? (
                                    <>
                                        <FoodLoader size="sm" /> Génération...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" /> Générer cette phase
                                    </>
                                )}
                            </button>
                        ) : generatedData && !isGeneratingAll ? (
                            <button
                                onClick={handleApply}
                                disabled={isLoading}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-all animate-bounce-short"
                            >
                                {isLoading ? <FoodLoader size="sm" /> : <Check className="w-5 h-5" />}
                                Appliquer au jeu
                            </button>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

