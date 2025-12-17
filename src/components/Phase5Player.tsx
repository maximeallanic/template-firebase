import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { type Room, nextPhase5State, nextPhase5Question } from '../services/gameService';
import { PHASE5_QUESTIONS } from '../data/phase5';
import { Check, X, Star, Trophy, Volume2, Gamepad2 } from 'lucide-react';
import { audioService } from '../services/audioService';

interface Phase5PlayerProps {
    room: Room;
    isHost: boolean;
}

export function Phase5Player({ room, isHost }: Phase5PlayerProps) {
    const { phase5State, phase5QuestionIndex, phase5Score } = room.state;
    const currentIdx = phase5QuestionIndex || 0;
    const score = phase5Score || 0;
    const currentQ = PHASE5_QUESTIONS[currentIdx];

    // SFX for state changes
    useEffect(() => {
        if (phase5State === 'reading') {
            audioService.playJoin(); // Soft chime for start
        } else if (phase5State === 'answering') {
            audioService.playTimerTick(); // Ticking feel for memory recall
        }
    }, [phase5State]);

    const handleCorrect = () => {
        audioService.playSuccess();
        nextPhase5Question(room.code, currentIdx, true);
    };

    const handleWrong = () => {
        audioService.playError();
        nextPhase5Question(room.code, currentIdx, false);
    };

    // --- RENDER HELPERS ---

    // Organic easing curve
    const organicEase = [0.25, 0.46, 0.45, 0.94] as const;

    // 0. IDLE / INTRO
    if (phase5State === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-8 h-full w-full text-white bg-gradient-to-br from-slate-900 via-slate-800 to-black">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: organicEase }}
                    className="text-center"
                >
                    <div className="mb-4 flex justify-center">
                        <Gamepad2 className="w-24 h-24 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm">
                        Burger<br />Ultime
                    </h1>
                    <p className="mt-6 text-xl md:text-2xl font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        10 Questions. <span className="text-yellow-400 font-bold">Memorize only.</span><br />
                        Answer them all <span className="underline decoration-yellow-500 underline-offset-4">in order</span> only after hearing them all.
                    </p>
                </motion.div>

                {isHost ? (
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(234,179,8,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            audioService.playClick();
                            nextPhase5State(room.code, 'reading');
                        }}
                        className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-12 py-6 rounded-2xl text-3xl font-black shadow-2xl uppercase tracking-widest"
                    >
                        Start Reading
                    </motion.button>
                ) : (
                    <div className="animate-pulse text-yellow-500/50 text-xl font-bold uppercase tracking-widest">
                        Waiting for Host...
                    </div>
                )}
            </div>
        );
    }

    // 1. FINISHED / RESULT
    // If index >= 10
    if (!currentQ) { // Reached end of questions
        const isBigBurger = score === 10;
        const isSmallBurger = score >= 5 && score < 10;

        return (
            <div className="flex flex-col items-center justify-center p-8 h-full w-full text-white overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: organicEase }}
                    className="text-center relative z-10"
                >
                    <h2 className="text-4xl font-bold mb-2 tracking-widest text-slate-400 uppercase">Final Score</h2>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-[12rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl"
                    >
                        {score}<span className="text-4xl align-top text-slate-600">/10</span>
                    </motion.div>

                    <div className="mt-8 space-y-4">
                        {isBigBurger && (
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-6xl text-yellow-500 flex items-center justify-center gap-4 filter drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]"
                            >
                                <Trophy className="w-24 h-24" /> GRAND BURGER!
                            </motion.div>
                        )}
                        {isSmallBurger && (
                            <div className="text-4xl text-yellow-600 flex items-center justify-center gap-2">
                                <Star className="w-12 h-12 fill-current" /> Petit Burger
                            </div>
                        )}
                        {!isBigBurger && !isSmallBurger && (
                            <div className="text-2xl text-slate-500 font-medium">Try again next time!</div>
                        )}
                    </div>
                </motion.div>

                {/* Background Confetti Effect could go here */}
            </div>
        );
    }

    // 2. READING PHASE (Host reads, players listen)
    if (phase5State === 'reading') {
        const isLastQuestion = currentIdx === 9; // 0-based index, 10th question is index 9

        return (
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-6 md:p-12 relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-800">
                    <motion.div
                        className="h-full bg-yellow-500"
                        initial={{ width: `${(currentIdx / 10) * 100}%` }}
                        animate={{ width: `${((currentIdx + 1) / 10) * 100}%` }}
                    />
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
                    <div className="text-yellow-500/50 text-xl font-bold tracking-[0.5em] uppercase">Memorization Phase</div>

                    {isHost ? (
                        <div className="bg-slate-800/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl w-full">
                            <h3 className="text-2xl text-slate-400 font-serif italic mb-6">Question {currentIdx + 1}</h3>
                            <p className="text-3xl md:text-5xl font-bold leading-tight text-white mb-8">{currentQ.question}</p>
                            <div className="bg-black/40 p-6 rounded-xl border-l-4 border-yellow-500">
                                <span className="text-slate-400 text-sm uppercase tracking-wider block mb-2">Answer</span>
                                <p className="text-2xl md:text-3xl font-bold text-yellow-400">{currentQ.answer}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-pulse opacity-80">
                            <Volume2 className="w-32 h-32 text-slate-600 mb-8" />
                            <h2 className="text-4xl md:text-6xl font-black text-slate-700 uppercase tracking-tighter">Listen Carefully...</h2>
                        </div>
                    )}

                    {isHost && (
                        <div className="pt-8">
                            {isLastQuestion ? (
                                <button
                                    onClick={() => {
                                        audioService.playClick();
                                        nextPhase5State(room.code, 'answering');
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl text-2xl font-bold shadow-lg transition-all transform hover:scale-105"
                                >
                                    Start Answering Phase
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        audioService.playClick();
                                        nextPhase5Question(room.code, currentIdx);
                                    }}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl text-xl font-bold transition-all"
                                >
                                    Next Question
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 3. ANSWERING PHASE (Recall)
    if (phase5State === 'answering') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-900 text-white relative">
                <div className="absolute top-0 left-0 h-2 bg-green-600 transition-all duration-500" style={{ width: `${((currentIdx) / 10) * 100}%` }} />

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="mb-4 text-slate-500 font-bold uppercase tracking-widest text-lg">
                        Recall Question {currentIdx + 1}
                    </div>

                    {isHost ? (
                        <div className="bg-slate-800 p-8 rounded-3xl border-2 border-slate-600 shadow-2xl max-w-3xl w-full text-left">
                            <div className="mb-6 pb-6 border-b border-slate-700">
                                <div className="text-sm text-slate-400 uppercase font-bold mb-2">Question (Remind them if needed)</div>
                                <div className="text-2xl font-medium text-slate-300 opacity-75">{currentQ.question}</div>
                            </div>

                            <div className="mb-8">
                                <div className="text-sm text-yellow-500 uppercase font-bold mb-2">Expected Answer</div>
                                <div className="text-4xl font-black text-white">{currentQ.answer}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleCorrect}
                                    className="bg-green-600 hover:bg-green-500 text-white p-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg"
                                >
                                    <Check className="w-8 h-8" /> CORRECT
                                </button>
                                <button
                                    onClick={handleWrong}
                                    className="bg-red-600 hover:bg-red-500 text-white p-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg"
                                >
                                    <X className="w-8 h-8" /> WRONG
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto">
                            <h2 className="text-5xl md:text-7xl font-black uppercase text-white mb-8 leading-none">
                                What was the answer?
                            </h2>
                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                <p className="text-xl text-slate-300">
                                    Question {currentIdx + 1}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
