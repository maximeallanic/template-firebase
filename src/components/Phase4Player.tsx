import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Room, Phase4Question } from '../services/gameService';
import { buzz, resolveBuzz, nextPhase4Question, startPhase5 } from '../services/gameService';
import { PHASE4_QUESTIONS } from '../data/phase4';
import { Hand, Check, X, Mic, Lock, Zap } from 'lucide-react';
import { markQuestionAsSeen } from '../services/historyService';

interface Phase4PlayerProps {
    room: Room;
    playerId: string;
    isHost: boolean;
}

export default function Phase4Player({ room, playerId, isHost }: Phase4PlayerProps) {
    const player = room.players[playerId];
    const team = player?.team;
    const { phase4State, buzzedTeam, currentPhase4QuestionIndex } = room.state;

    // Use custom AI-generated questions if available, fallback to default PHASE4_QUESTIONS
    const questionsList: Phase4Question[] = room.customQuestions?.phase4 || PHASE4_QUESTIONS;

    const currentQuestionIdx = currentPhase4QuestionIndex || 0;
    const currentQuestion = questionsList[currentQuestionIdx];
    const isFinished = !currentQuestion;

    // Track question as seen when displayed
    useEffect(() => {
        if (currentQuestion?.question) {
            markQuestionAsSeen('', currentQuestion.question);
        }
    }, [currentQuestion?.question]);

    // --- HOST VIEW ---
    if (isHost) {
        if (isFinished) {
            return (
                <div className="flex flex-col items-center justify-center p-8 space-y-6 max-h-screen overflow-y-auto w-full text-white">
                    <h2 className="text-4xl font-black">PHASE 4 COMPLETE!</h2>
                    <div className="text-2xl">La Note is served.</div>

                    <button
                        onClick={() => startPhase5(room.code)}
                        className="bg-yellow-500 hover:bg-yellow-400 px-8 py-4 rounded-xl text-xl font-bold shadow-lg flex items-center gap-2"
                    >
                        <span>Start Phase 5 (Burger Ultime)</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-4 space-y-6 h-full w-full text-white">
                <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-2xl border-2 border-slate-600 shadow-xl">
                    <div className="text-gray-400 font-bold uppercase tracking-widest mb-2">Question {currentQuestionIdx + 1}</div>
                    <div className="text-3xl font-bold mb-6 text-center text-white leading-tight">
                        {currentQuestion.question}
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700 mb-6">
                        <span className="text-yellow-400 font-bold text-xl uppercase mr-2">Answer:</span>
                        <span className="text-2xl font-black">{currentQuestion.answer}</span>
                    </div>

                    {phase4State === 'buzzed' ? (
                        <div className="animate-pulse bg-yellow-500/20 border-2 border-yellow-500 p-4 rounded-xl text-center mb-6 flex flex-col items-center">
                            <Hand className="w-12 h-12 text-yellow-500 mb-2" />
                            <div className="text-xl font-bold text-yellow-500">
                                {buzzedTeam?.toUpperCase()} TEAM BUZZED!
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 italic mb-6">Waiting for buzzer...</div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => resolveBuzz(room.code, true)}
                            disabled={phase4State !== 'buzzed'}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-xl text-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Check className="w-8 h-8" /> CORRECT (+2)
                        </button>
                        <button
                            onClick={() => resolveBuzz(room.code, false)}
                            disabled={phase4State !== 'buzzed'}
                            className="bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed p-4 rounded-xl text-xl font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <X className="w-8 h-8" /> WRONG
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col gap-4">
                        <button
                            onClick={() => nextPhase4Question(room.code)}
                            className="bg-gray-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-600 transition w-full"
                        >
                            Skip / Next Question
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- PLAYER VIEW ---
    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <h2 className="text-3xl font-bold mb-4">Phase Complete!</h2>
                <p className="text-xl opacity-70">Waiting for host...</p>
            </div>
        );
    }

    const myTeamBuzzed = buzzedTeam === team;
    const otherTeamBuzzed = buzzedTeam && buzzedTeam !== team;
    const isLocked = phase4State === 'buzzed' && !myTeamBuzzed;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 relative overflow-hidden">
            {/* Question Display for Accessibility */}
            <div className={`
                absolute top-6 left-6 right-6 p-6 rounded-2xl border-2 shadow-2xl z-10
                backdrop-blur-md transition-colors duration-300
                ${myTeamBuzzed ? 'bg-green-900/40 border-green-500/50' :
                    isLocked ? 'bg-slate-900/60 border-slate-700/50 opacity-50' :
                        'bg-indigo-900/40 border-indigo-500/30'}
            `}>
                <div className="text-center">
                    <h3 className="text-white text-xl md:text-2xl font-bold leading-relaxed drop-shadow-md">
                        {currentQuestion.question}
                    </h3>
                </div>
            </div>

            {/* BUZZER BUTTON */}
            <div className="relative z-20 mt-32">
                <motion.button
                    whileTap={!isLocked && !myTeamBuzzed ? { scale: 0.9 } : {}}
                    onClick={() => {
                        if (!isLocked && !myTeamBuzzed && team) {
                            buzz(room.code, team);
                        }
                    }}
                    disabled={isLocked || myTeamBuzzed || !team}
                    className={`
                        w-64 h-64 rounded-full border-[12px] shadow-[0_0_50px_rgba(0,0,0,0.5)]
                        flex flex-col items-center justify-center
                        transition-all duration-200
                        ${myTeamBuzzed
                            ? 'bg-green-500 border-green-700 shadow-green-500/50 scale-110'
                            : isLocked
                                ? 'bg-gray-600 border-gray-700 grayscale cursor-not-allowed opacity-50'
                                : 'bg-red-600 border-red-800 hover:bg-red-500 hover:scale-105 shadow-red-500/30'}
                    `}
                >
                    <div className="text-white mb-2 filter drop-shadow-lg">
                        {myTeamBuzzed ? <Mic className="w-20 h-20" /> : isLocked ? <Lock className="w-20 h-20" /> : <Zap className="w-24 h-24 stroke-[3]" />}
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-md">
                        {myTeamBuzzed ? 'ANSWER!' : isLocked ? 'LOCKED' : 'BUZZ!'}
                    </span>
                </motion.button>
            </div>

            {/* Status Text */}
            <div className="mt-12 text-center h-12">
                {myTeamBuzzed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-green-400 uppercase tracking-widest animate-pulse"
                    >
                        It's your turn!
                    </motion.div>
                )}
                {otherTeamBuzzed && (
                    <div className="text-xl font-bold text-gray-400 flex items-center justify-center gap-2">
                        <Lock className="w-6 h-6" /> Opponent is answering...
                    </div>
                )}
            </div>
        </div>
    );
}
