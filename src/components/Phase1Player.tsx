import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitAnswer, startNextQuestion, setGameStatus, type Room } from '../services/gameService';
import { QUESTIONS } from '../data/questions';
import { audioService } from '../services/audioService';
import { SimpleConfetti } from './SimpleConfetti';
import {
    Triangle, Diamond, Circle, Square,
    Clock, Trophy, XCircle, Play, ArrowRight, Flag, Utensils,
    Pizza, Cookie, IceCream, Flame, Fish, Sandwich, User
} from 'lucide-react';

interface Phase1PlayerProps {
    room: Room;
    playerId: string;
    isHost?: boolean;
}

const COLORS = [
    'bg-red-500',    // Option A
    'bg-blue-500',   // Option B
    'bg-yellow-500', // Option C
    'bg-green-500'   // Option D
];

const ICONS = [Triangle, Diamond, Circle, Square]; // Shapes corresponding to colors

export function Phase1Player({ room, playerId, isHost }: Phase1PlayerProps) {
    const { state } = room;
    const { phaseState, currentQuestionIndex } = state;
    const currentQuestion = (currentQuestionIndex !== undefined && currentQuestionIndex >= 0)
        ? QUESTIONS[currentQuestionIndex]
        : null;

    const [myAnswer, setMyAnswer] = useState<number | null>(null);

    // Reset local answer when question changes
    const prevQIndex = useRef(currentQuestionIndex);
    if (prevQIndex.current !== currentQuestionIndex) {
        setMyAnswer(null);
        prevQIndex.current = currentQuestionIndex;
    }

    const handleAnswer = (index: number) => {
        if (phaseState === 'answering' && myAnswer === null) {
            audioService.playClick();
            setMyAnswer(index);
            submitAnswer(room.code, playerId, index);
        }
    };

    // HOST LOGIC
    const nextQIndex = (currentQuestionIndex ?? -1) + 1;
    const isFinished = nextQIndex >= QUESTIONS.length;

    const handleNextQuestion = () => {
        if (!isFinished) {
            startNextQuestion(room.code, nextQIndex);
        }
    };

    const isAnswering = phaseState === 'answering';
    const isResult = phaseState === 'result';
    const isReading = phaseState === 'reading';

    // Countdown Logic
    const [countdown, setCountdown] = useState(3);
    useEffect(() => {
        if (isReading) {
            setCountdown(3);
            const timer = setInterval(() => {
                setCountdown(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isReading]);

    // Determining feedback if result is shown
    let resultMessage = "Waiting...";
    let resultIcon = <Clock className="w-8 h-8" />;
    let resultColor = "text-slate-400";

    if (isResult) {
        if (state.roundWinner?.playerId === playerId) {
            resultMessage = "YOU WON! +1 YUM";
            resultIcon = <Trophy className="w-8 h-8" />;
            resultColor = "text-green-400";
        } else if (myAnswer !== null) {
            const correctIdx = currentQuestion ? currentQuestion.correctIndex : -1;
            if (myAnswer === correctIdx) {
                resultMessage = "Correct, but too slow!";
                resultIcon = <Clock className="w-8 h-8" />;
                resultColor = "text-yellow-400";
            } else {
                resultMessage = "Wrong Answer!";
                resultIcon = <XCircle className="w-8 h-8" />;
                resultColor = "text-red-400";
            }
        } else {
            resultMessage = "Time's up!";
            resultIcon = <Clock className="w-8 h-8" />;
            resultColor = "text-slate-400";
        }
    }

    // Audio & Visual Effects Logic
    useEffect(() => {
        if (isResult) {
            if (state.roundWinner?.playerId === playerId) {
                audioService.playWinRound();
            } else if (myAnswer !== null) {
                const correctIdx = currentQuestion ? currentQuestion.correctIndex : -1;
                if (myAnswer === correctIdx) {
                    audioService.playSuccess();
                } else {
                    audioService.playError();
                }
            } else {
                audioService.playError(); // Time's up is also a "fail"
            }
        }
    }, [isResult, state.roundWinner, playerId, myAnswer, currentQuestion]);

    // Timer Tick Audio
    useEffect(() => {
        if (isReading) {
            const interval = setInterval(() => {
                audioService.playTimerTick();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isReading]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-4 space-y-6 relative">

            {/* Top Bar: Progress & Roster */}
            <div className="w-full flex items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-white/5 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Round</span>
                    <span className="text-white font-black bg-slate-700 px-2 py-0.5 rounded text-sm">
                        {(currentQuestionIndex ?? -1) + 1} / {QUESTIONS.length}
                    </span>
                </div>

                {/* Teammates Mini Roster */}
                <div className="flex -space-x-2">
                    {Object.values(room.players)
                        .filter(p => p.id !== playerId && p.team === room.players[playerId]?.team)
                        .slice(0, 4) // Show max 4 teammates
                        .map(p => {
                            const AvatarIcon = getAvatarIcon(p.avatar);
                            return (
                                <div key={p.id} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-sm relative group text-white" title={p.name}>
                                    <AvatarIcon className="w-4 h-4" />
                                </div>
                            );
                        })}
                    {Object.values(room.players).filter(p => p.id !== playerId && p.team === room.players[playerId]?.team).length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold">
                            +{Object.values(room.players).filter(p => p.id !== playerId && p.team === room.players[playerId]?.team).length - 4}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Header */}
            <div className="text-center space-y-4 w-full">
                {/* Question Text */}
                {currentQuestion && (
                    <div className="bg-slate-800/80 p-4 rounded-xl backdrop-blur-sm border border-slate-700 shadow-xl">
                        <p className="text-white font-bold text-lg md:text-xl leading-snug">
                            {currentQuestion.text}
                        </p>
                    </div>
                )}

                <h3 className="text-xl font-bold text-white opacity-80 flex items-center justify-center gap-2">
                    {isReading && <><Clock className="w-6 h-6 animate-pulse" /> Reading Time... {countdown}s</>}
                    {isAnswering && <><Play className="w-6 h-6" /> ANSWER NOW!</>}
                    {isResult && "Round Over"}
                    {phaseState === 'idle' && "Get Ready..."}
                </h3>
            </div>

            {/* Answer Grid */}
            <div className={`grid grid-cols-1 gap-3 w-full max-h-[50vh] overflow-y-auto ${isHost ? 'mb-16' : ''}`}>
                {[0, 1, 2, 3].map((idx) => {
                    const ShapeIcon = ICONS[idx];
                    return (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.98 }}
                            animate={
                                isResult && myAnswer === idx && idx !== currentQuestion?.correctIndex
                                    ? { x: [0, -10, 10, -10, 10, 0] }
                                    : {}
                            }
                            transition={{ duration: 0.4 }}
                            onClick={() => handleAnswer(idx)}
                            disabled={!isAnswering || myAnswer !== null}
                            className={`
                                relative w-full p-4 rounded-xl flex items-center space-x-4 shadow-lg border-b-4 transition-all
                                ${COLORS[idx]}
                                ${(!isAnswering && !isResult) ? 'opacity-50 grayscale' : ''}
                                ${(myAnswer !== null && myAnswer !== idx) ? 'opacity-40' : 'opacity-100'}
                                ${(isResult && myAnswer === idx) ? 'ring-4 ring-white scale-[1.02]' : ''}
                                border-black/20 text-left
                            `}
                        >
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-black/20 rounded-full text-2xl text-white">
                                <ShapeIcon fill="currentColor" className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                {/* Option Text */}
                                {currentQuestion ? (
                                    <span className="text-white font-bold text-lg leading-tight block">
                                        {currentQuestion.options[idx]}
                                    </span>
                                ) : (
                                    <span className="text-white/60 font-bold text-lg">Option {['A', 'B', 'C', 'D'][idx]}</span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Result Feedback Overlay */}
            <AnimatePresence>
                {isResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute bottom-24 left-0 right-0 mx-auto w-max max-w-[90%] bg-slate-900/95 backdrop-blur px-6 py-4 rounded-xl border border-slate-700 shadow-2xl ${resultColor} z-20 text-center flex flex-col items-center gap-2`}
                    >
                        <div className="flex items-center gap-2">
                            {resultIcon}
                            <span className="text-xl md:text-2xl font-black">{resultMessage}</span>
                        </div>
                        {state.roundWinner && (
                            <div className="text-sm text-white mt-1 flex items-center gap-1">
                                Winner: <Trophy className="w-4 h-4 text-yellow-400" /> <span className="text-yellow-400 font-bold">{state.roundWinner.name}</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Celebration Confetti */}
            {isResult && state.roundWinner?.playerId === playerId && <SimpleConfetti />}

            {/* HOST CONTROLS - Fixed at bottom */}

            {isHost && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur border-t border-slate-800 flex justify-center z-50">
                    {isFinished ? (
                        <div className="flex flex-col items-center space-y-4 animate-fade-in">
                            <div className="text-2xl font-black text-white drop-shadow-lg flex items-center gap-2">
                                <Flag className="w-8 h-8 text-yellow-500" /> Phase 1 Complete!
                            </div>
                            <button
                                onClick={() => setGameStatus(room.code, 'phase2')}
                                className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-full font-bold shadow-xl transition-transform active:scale-95 flex items-center gap-2"
                            >
                                <Utensils className="w-5 h-5" /> Start Phase 2
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            disabled={isReading}
                            className={`
                                px-8 py-3 rounded-full text-lg font-bold text-white shadow-lg transition-all w-full max-w-sm flex items-center justify-center gap-2
                                ${(isReading)
                                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-spicy-500 to-sweet-500 hover:scale-105 active:scale-95'
                                }
                            `}
                        >
                            {currentQuestionIndex === -1 ? <><Play className="w-5 h-5" /> Start Game</> : (isAnswering ? <><ArrowRight className="w-5 h-5" /> Skip / Next</> : <><ArrowRight className="w-5 h-5" /> Next Question</>)}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function getAvatarIcon(avatar: string) {
    const map: Record<string, React.ElementType> = {
        donut: Circle, // Fallback
        pizza: Pizza,
        taco: Sandwich, // Fallback
        sushi: Fish, // Fallback
        chili: Flame,
        cookie: Cookie,
        icecream: IceCream,
        fries: Utensils // Fallback
    };
    return map[avatar] || User;
}
