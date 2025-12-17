import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { submitPhase2Answer } from '../services/gameService';
import type { Player, PhaseState, Room } from '../services/gameService';
import { PHASE2_SETS } from '../data/phase2';
import { audioService } from '../services/audioService';
import { SimpleConfetti } from './SimpleConfetti';
import { ArrowLeft, ArrowRight, ArrowUp, Check, X, Info, Utensils } from 'lucide-react';
import { AvatarIcon } from './AvatarIcon';
import { markQuestionAsSeen } from '../services/historyService';

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
    customQuestions?: Room['customQuestions'];
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
    customQuestions,
}) => {
    // Prefer custom questions if available
    const currentSet = customQuestions?.phase2?.[setIndex] || PHASE2_SETS[setIndex];
    const currentItem = currentSet?.items[itemIndex];

    // Calculate online players for answer completion check (exclude mock players)
    const onlinePlayers = Object.values(players).filter((p: Player) => p.isOnline && !p.id.startsWith('mock_'));

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
        controls.set({ x: 0, y: 0, opacity: 1 });
    }, [itemIndex, controls]);

    // Track question as seen when displayed
    useEffect(() => {
        if (currentItem?.text) {
            markQuestionAsSeen('', currentItem.text);
        }
    }, [currentItem?.text]);

    // Animate card to correct position when result is shown
    useEffect(() => {
        if (isRoundOver && hasAnswered && currentItem) {
            // Calculate correct position based on the answer
            const correctX = currentItem.answer === 'A' ? -150 : currentItem.answer === 'B' ? 150 : 0;
            const correctY = currentItem.answer === 'Both' ? -80 : 0;

            // Animate card to the correct zone
            controls.start({
                x: correctX,
                y: correctY,
                opacity: 1,
                transition: {
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.2
                }
            });
        }
    }, [isRoundOver, hasAnswered, currentItem, controls]);

    // Completion check is now handled server-side in submitPhase2Answer
    // The host still has a "Force Next Item" button for emergencies

    const handleAnswer = useCallback((choice: 'A' | 'B' | 'Both', direction: 'left' | 'right' | 'up') => {
        if (hasAnswered || phaseState === 'result') {
            return;
        }

        // Submit answer FIRST (before state change unmounts the card)
        // SECURITY: correctAnswer is now fetched server-side, not passed from client
        if (currentItem) {
            submitPhase2Answer(roomId, playerId, choice, onlinePlayers.length);
        } else {
            return;
        }

        // Animate card to initial swipe position (not off-screen, card stays visible)
        let swipeX = 0;
        let swipeY = 0;
        if (direction === 'left') swipeX = -120;
        if (direction === 'right') swipeX = 120;
        if (direction === 'up') swipeY = -80;

        controls.start({
            x: swipeX,
            y: swipeY,
            transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
        });

        // Update local state (card remains visible, will animate to correct position on result)
        setHasAnswered(true);
        audioService.playClick();
    }, [hasAnswered, phaseState, controls, roomId, playerId, currentItem, onlinePlayers.length]);

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
    const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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


    // Get current player's team and teammates (exclude mock players from display)
    const myTeam = players[playerId]?.team;
    const teammates = Object.values(players).filter(
        (p: Player) => p.id !== playerId && p.team === myTeam && p.isOnline && !p.id.startsWith('mock_')
    );

    return (
        <div className="fixed inset-0 flex overflow-hidden">

            {/* Teammates Answer Status - Top Bar */}
            {teammates.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="text-xs text-slate-400 mr-2">Team:</span>
                    {teammates.slice(0, 5).map((p: Player) => {
                        const hasAnswered = phase2Answers && p.id in phase2Answers;
                        const wasCorrect = phase2Answers?.[p.id];
                        return (
                            <div
                                key={p.id}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm relative text-white transition-all
                                    ${hasAnswered
                                        ? (wasCorrect ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400')
                                        : 'bg-slate-700 border-slate-600 animate-pulse'}
                                `}
                                title={`${p.name}${hasAnswered ? (wasCorrect ? ' ✓' : ' ✗') : ' (thinking...)'}`}
                            >
                                <AvatarIcon avatar={p.avatar} size={16} />
                                {hasAnswered && (
                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${wasCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                                        {wasCorrect ? '✓' : '✗'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {teammates.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs text-white font-bold">
                            +{teammates.length - 5}
                        </div>
                    )}
                </div>
            )}

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

                {/* Result Message (Appears when round ends) - OPACITY ONLY on backdrop */}
                <AnimatePresence>
                    {phaseState === 'result' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                        >
                            {/* Result Badge - moved up, no ghost card (card is reused below) */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-auto mb-8"
                            >
                                {/* Only show Win/Loss if I actually played */}
                                {phase2Answers && phase2Answers[playerId] !== undefined ? (
                                    <div className={`p-6 rounded-2xl shadow-2xl border-4 ${didIWin
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-white text-white'
                                        : 'bg-white border-red-500 text-red-500'
                                        }`}>
                                        <div className="text-4xl mb-2 flex justify-center">
                                            {didIWin ? <Check className="w-16 h-16" /> : <X className="w-16 h-16" />}
                                        </div>
                                        <div className="text-2xl font-black tracking-wider uppercase">
                                            {didIWin ? "Correct!" : "Mauvaise réponse"}
                                        </div>
                                        {!didIWin && currentItem && (
                                            <div className="text-sm mt-2 text-red-400">
                                                C'était <span className="font-bold text-red-600">
                                                    {currentItem.answer === 'A' ? currentSet.optionA :
                                                     currentItem.answer === 'B' ? currentSet.optionB :
                                                     'Les Deux'}
                                                </span>
                                            </div>
                                        )}
                                        {/* Justification explaining why */}
                                        {currentItem?.justification && (
                                            <p className={`text-sm mt-3 pt-3 border-t ${didIWin ? 'border-white/20 text-white/90' : 'border-red-200 text-red-600'} italic max-w-xs text-center`}>
                                                📝 {currentItem.justification}
                                            </p>
                                        )}
                                        {/* Anecdote display */}
                                        {currentItem?.anecdote && (
                                            <p className={`text-xs mt-2 ${didIWin ? 'text-white/70' : 'text-red-400'} italic max-w-xs text-center`}>
                                                💡 {currentItem.anecdote}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white text-black p-6 rounded-2xl shadow-2xl border-4 border-indigo-600">
                                        <div className="text-2xl font-black tracking-wider uppercase">
                                            Round Over
                                        </div>
                                        {/* Justification display for spectators */}
                                        {currentItem?.justification && (
                                            <p className="text-sm mt-3 pt-3 border-t border-slate-200 italic max-w-xs text-center text-slate-600">
                                                📝 {currentItem.justification}
                                            </p>
                                        )}
                                        {/* Anecdote display for spectators */}
                                        {currentItem?.anecdote && (
                                            <p className="text-xs mt-2 italic max-w-xs text-center text-slate-500">
                                                💡 {currentItem.anecdote}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Options Text - Above the card */}
                {!hasAnswered && (
                    <div className="absolute top-24 md:top-20 left-0 right-0 text-center pointer-events-none z-30">
                        <p className="text-white/80 text-lg md:text-xl font-medium">
                            <span className="text-red-400">{currentSet.optionA}</span>
                            <span className="text-white/50">, </span>
                            <span className="text-pink-400">{currentSet.optionB}</span>
                            <span className="text-white/50">, ou </span>
                            <span className="text-purple-400">les deux</span>
                            <span className="text-white/50"> ?</span>
                        </p>
                        {/* Hint explaining the wordplay */}
                        <p className="text-white/40 text-xs md:text-sm mt-2 max-w-md mx-auto px-4">
                            🎭 Ces deux expressions se prononcent pareil !
                            <br className="hidden md:block" />
                            <span className="hidden md:inline">Swipe pour classer chaque élément dans la bonne catégorie.</span>
                        </p>
                    </div>
                )}

                {/* The Drag Card - STAYS VISIBLE after answering, animates to correct position */}
                <motion.div
                    drag={!hasAnswered}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.7}
                    onDragEnd={hasAnswered ? undefined : handleDragEnd}
                    animate={controls}
                    className={`
                        bg-white text-slate-900 w-full max-w-xs aspect-square rounded-3xl shadow-2xl
                        flex flex-col items-center justify-center p-6 text-center relative overflow-hidden
                        transition-shadow duration-300
                        ${!hasAnswered ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'}
                        ${isRoundOver && didIWin ? 'ring-4 ring-green-500 shadow-green-500/30' : ''}
                        ${isRoundOver && hasAnswered && !didIWin ? 'ring-4 ring-red-500 shadow-red-500/30' : ''}
                    `}
                >
                    {/* Card Decorative Elements - changes color based on result */}
                    <div className={`absolute top-0 left-0 right-0 h-2 transition-colors duration-300 ${
                        isRoundOver && didIWin ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-400' :
                        isRoundOver && hasAnswered && !didIWin ? 'bg-gradient-to-r from-red-400 via-rose-400 to-red-400' :
                        'bg-gradient-to-r from-red-400 via-purple-400 to-pink-400'
                    }`} />

                    {/* Answer Label Badge (shows after answering) */}
                    {hasAnswered && currentItem && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white ${
                                currentItem.answer === 'A' ? 'bg-red-500' :
                                currentItem.answer === 'B' ? 'bg-pink-500' :
                                'bg-purple-500'
                            }`}
                        >
                            {currentItem.answer === 'A' ? currentSet.optionA :
                             currentItem.answer === 'B' ? currentSet.optionB :
                             'Les Deux'}
                        </motion.div>
                    )}

                    {/* Item Text - Centered */}
                    <h1 className="text-3xl md:text-4xl font-black leading-tight text-slate-800">
                        {currentItem.text}
                    </h1>

                    {/* Justification (shows during result) */}
                    {isRoundOver && currentItem?.justification && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            className="text-xs text-slate-600 mt-3 px-2 italic leading-snug"
                        >
                            {currentItem.justification}
                        </motion.p>
                    )}

                    {/* Swipe hint at bottom (only when not answered) */}
                    {!hasAnswered && (
                        <div className="text-xs text-slate-400 mt-6 flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            <ArrowUp className="w-4 h-4" />
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    )}

                    {/* Result icon overlay */}
                    {isRoundOver && hasAnswered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center ${
                                didIWin ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}
                        >
                            {didIWin ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                        </motion.div>
                    )}
                </motion.div>

                {/* Feedback for Answered State - OPACITY ONLY (no scale) */}
                {hasAnswered && phaseState !== 'result' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute bottom-20 bg-slate-800/80 backdrop-blur text-white px-8 py-4 rounded-full font-bold text-xl flex items-center gap-2"
                    >
                        <span className="animate-pulse">En attente des autres...</span>
                    </motion.div>
                )}
            </div >

        </div >
    );
};

