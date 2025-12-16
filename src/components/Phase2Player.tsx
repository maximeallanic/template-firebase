import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { submitPhase2Answer, endPhase2Round } from '../services/gameService';
import type { Player, PhaseState } from '../services/gameService';
import { PHASE2_SETS } from '../data/phase2';
import { audioService } from '../services/audioService';
import { SimpleConfetti } from './SimpleConfetti';
import { ArrowLeft, ArrowRight, ArrowUp, Check, X, Utensils, Info } from 'lucide-react';

interface Phase2PlayerProps {
    roomId: string;
    playerId: string;
    players: Record<string, Player>;
    setIndex: number;
    itemIndex: number;
    phaseState: PhaseState;
    phase2Answers?: Record<string, boolean>;
    roundWinner?: { playerId: string; name: string; team: string } | null;
    isHost?: boolean;
}

export const Phase2Player: React.FC<Phase2PlayerProps> = ({
    roomId,
    playerId,
    setIndex,
    itemIndex,
    isHost,
    phaseState,
    phase2Answers,
    players,
    // roundWinner - unused for now in binary phase
}) => {
    const currentSet = PHASE2_SETS[setIndex];
    const currentItem = currentSet?.items[itemIndex];
    const [hasAnswered, setHasAnswered] = useState(false);
    const controls = useAnimation();

    // Determine correctness for local player
    const isRoundOver = phaseState === 'result';
    const didIWin = isRoundOver && phase2Answers?.[playerId] === true;
    const hasAudioPlayedRef = useRef(false);

    // Audio Logic
    useEffect(() => {
        if (isRoundOver && !hasAudioPlayedRef.current) {
            hasAudioPlayedRef.current = true;
            if (didIWin) {
                audioService.playSuccess();
                audioService.playWinRound();
            } else {
                audioService.playError();
            }
        } else if (!isRoundOver) {
            hasAudioPlayedRef.current = false;
        }
    }, [isRoundOver, didIWin]);

    // Reset local state when item changes
    useEffect(() => {
        setHasAnswered(false);
        controls.set({ x: 0, y: 0, opacity: 1, scale: 1 });
    }, [itemIndex, controls]);

    // HOST ONLY: Monitor Completion
    useEffect(() => {
        if (!isHost || phaseState !== 'reading') return;

        // Robust Completion Logic
        const allPlayers = Object.values(players).filter((p: Player) => p.isOnline);
        const activePlayers = allPlayers.filter((p: Player) => !p.isHost);

        let shouldAdvance = false;
        const currentAnswers = phase2Answers || {};

        console.log(`[Phase2 HOST Check] Active Players: ${activePlayers.length}`, {
            answers: currentAnswers,
            activeIds: activePlayers.map(p => p.id)
        });

        if (activePlayers.length > 0) {
            // Multiplayer: Wait for all Active Players
            const answeredCount = activePlayers.filter((p: Player) => p.id in currentAnswers).length;
            console.log(`[Phase2 HOST Check] Answered: ${answeredCount}/${activePlayers.length}`);
            if (answeredCount >= activePlayers.length) {
                shouldAdvance = true;
            }
        } else {
            // Solo Host: Wait for Host
            const hostPlayer = allPlayers.find((p: Player) => p.isHost);
            if (hostPlayer && hostPlayer.id in currentAnswers) {
                shouldAdvance = true;
            }
        }

        if (shouldAdvance) {
            console.log('[Phase2 HOST Check] ADVANCING ROUND');
            endPhase2Round(roomId);
        }

    }, [isHost, phaseState, Object.keys(players).length, JSON.stringify(phase2Answers), roomId, players, phase2Answers]);

    const handleAnswer = useCallback(async (choice: 'A' | 'B' | 'Both', direction: 'left' | 'right' | 'up') => {
        if (hasAnswered || phaseState === 'result') return;

        setHasAnswered(true);
        audioService.playClick();

        // Animate card off-screen
        let exitX = 0;
        let exitY = 0;
        if (direction === 'left') exitX = -500;
        if (direction === 'right') exitX = 500;
        if (direction === 'up') exitY = -500;

        await controls.start({
            x: exitX,
            y: exitY,
            opacity: 0,
            transition: { duration: 0.3, ease: "easeIn" }
        });

        // Submit answer
        if (currentItem) {
            submitPhase2Answer(roomId, playerId, choice, currentItem.answer);
        }
    }, [hasAnswered, phaseState, controls, roomId, playerId, currentItem]);

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (hasAnswered) return;
            // Prevent default scrolling for arrow keys
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === 'ArrowLeft') handleAnswer('A', 'left');
            if (e.key === 'ArrowRight') handleAnswer('B', 'right');
            if (e.key === 'ArrowUp') handleAnswer('Both', 'up');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAnswer, hasAnswered]);

    // Drag End Handler
    const handleDragEnd = async (_: any, info: PanInfo) => {
        const threshold = 100;
        const { x, y } = info.offset;

        // Prioritize vertical swipe for "Both" (Swipe Up)
        if (y < -threshold) {
            handleAnswer('Both', 'up');
        } else if (x < -threshold) {
            handleAnswer('A', 'left');
        } else if (x > threshold) {
            handleAnswer('B', 'right');
        } else {
            // Snap back
            controls.start({ x: 0, y: 0 });
        }
    };

    if (!currentSet || !currentItem) {
        if (isHost) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white space-y-8">
                    <h2 className="text-4xl font-bold">End of Phase 2!</h2>
                    <button
                        onClick={() => import('../services/gameService').then(mod => mod.setGameStatus(roomId, 'phase3'))}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black text-2xl font-bold px-12 py-6 rounded-full shadow-lg transform transition-transform hover:scale-105 flex items-center gap-3"
                    >
                        <Utensils className="w-8 h-8" /> START PHASE 3: MENUS
                    </button>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <div className="text-2xl font-bold animate-pulse flex items-center gap-2">
                    <Info className="w-8 h-8" /> Waiting for the Host...
                </div>
                <div className="text-slate-400 mt-2">Getting the menus ready</div>
            </div>
        );
    }


    return (
        <div className="fixed inset-0 flex overflow-hidden">

            {/* Confetti if Won */}
            {didIWin && <SimpleConfetti />}

            {/* LEFT ZONE (Option A) */}
            <div className="w-1/2 h-full bg-red-600/20 border-r border-white/10 flex items-center justify-start pl-8 relative group">
                <div className="absolute inset-0 bg-red-900/10 group-hover:bg-red-900/20 transition-colors" />
                <div className="text-4xl md:text-6xl font-black text-red-500 opacity-30 select-none uppercase tracking-tighter transform -rotate-90 md:rotate-0 origin-left">
                    {currentSet.optionA}
                </div>
                {/* Mobile Arrow Hint */}
                <div className="absolute left-4 top-1/2 text-red-500 opacity-50 md:hidden animate-pulse">
                    <ArrowLeft className="w-10 h-10" />
                </div>
            </div>

            {/* RIGHT ZONE (Option B) */}
            <div className="w-1/2 h-full bg-pink-600/20 flex items-center justify-end pr-8 relative group">
                <div className="absolute inset-0 bg-pink-900/10 group-hover:bg-pink-900/20 transition-colors" />
                <div className="text-4xl md:text-6xl font-black text-pink-500 opacity-30 select-none uppercase tracking-tighter transform rotate-90 md:rotate-0 origin-right">
                    {currentSet.optionB}
                </div>
                {/* Mobile Arrow Hint */}
                <div className="absolute right-4 top-1/2 text-pink-500 opacity-50 md:hidden animate-pulse">
                    <ArrowRight className="w-10 h-10" />
                </div>
            </div>

            {/* UP ZONE HINT (Both) */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none flex justify-center pt-8">
                <div className="text-purple-400 font-bold tracking-widest uppercase opacity-20 text-xl flex flex-col items-center">
                    <ArrowUp className="w-8 h-8 mb-1" /> Les Deux
                </div>
            </div>

            {/* CENTER: THE CARD & RESULTS */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">

                {/* Result Message (Appears when round ends) */}
                <AnimatePresence>
                    {phaseState === 'result' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                            {/* Only show Win/Loss if I actually played */}
                            {phase2Answers && phase2Answers[playerId] !== undefined ? (
                                <div className={`p-8 rounded-3xl shadow-2xl transform scale-125 border-4 ${didIWin
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-white text-white'
                                    : 'bg-white border-red-500 text-red-500'
                                    }`}>
                                    <div className="text-6xl mb-4 flex justify-center">
                                        {didIWin ? <Check className="w-24 h-24" /> : <X className="w-24 h-24" />}
                                    </div>
                                    <div className="text-4xl font-black tracking-wider uppercase">
                                        {didIWin ? "Correct!" : "Wrong!"}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white text-black p-8 rounded-3xl shadow-2xl border-4 border-indigo-600">
                                    <div className="text-4xl font-black tracking-wider uppercase">
                                        Round Over
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* The Drag Card */}
                {
                    !hasAnswered && (
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.7}
                            onDragEnd={handleDragEnd}
                            animate={controls}
                            className="bg-white text-slate-900 w-full max-w-sm aspect-[4/5] md:aspect-square rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center cursor-grab active:cursor-grabbing pointer-events-auto relative overflow-hidden"
                        >
                            {/* Card Decorative Elements */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-400 via-purple-400 to-pink-400" />

                            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-6">
                                {currentSet.title}
                            </h3>

                            <div className="flex-1 flex items-center justify-center">
                                <h1 className="text-4xl md:text-5xl font-black leading-tight text-slate-800">
                                    {currentItem.text}
                                </h1>
                            </div>

                            <div className="mt-8 text-xs font-medium text-slate-400 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 p-1 rounded"><ArrowLeft className="w-3 h-3" /></span>
                                    <span className="uppercase">{currentSet.optionA}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 p-1 rounded"><ArrowRight className="w-3 h-3" /></span>
                                    <span className="uppercase">{currentSet.optionB}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 p-1 rounded"><ArrowUp className="w-3 h-3" /></span>
                                    <span>LES DEUX</span>
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {/* Feedback for Answered State */}
                {
                    hasAnswered && phaseState !== 'result' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-800/80 backdrop-blur text-white px-8 py-4 rounded-full font-bold text-xl animate-pulse flex items-center gap-2"
                        >
                            Waiting for opponent...
                        </motion.div>
                    )
                }
            </div >

            {/* Host Controls */}
            {
                isHost && (
                    <div className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-2 pointer-events-auto">
                        {/* Only show answer if Host has answered OR round is over */}
                        {(hasAnswered || phaseState === 'result') && (
                            <div className="bg-white text-black p-4 rounded-xl shadow-xl border-4 border-indigo-600 animate-slide-up">
                                <span className="text-xl font-bold">Answer: {currentItem.answer}</span>
                            </div>
                        )}
                        <button
                            onClick={() => endPhase2Round(roomId)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow-xl font-bold flex items-center gap-2 transform transition hover:scale-105 active:scale-95"
                        >
                            Force Next Item <ArrowRight />
                        </button>
                    </div>
                )
            }
        </div >
    );
};
