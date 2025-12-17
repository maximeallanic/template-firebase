import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitAnswer, startNextQuestion, setGameStatus, type Room } from '../services/gameService';
import { QUESTIONS } from '../data/questions';
import { audioService } from '../services/audioService';
import { SimpleConfetti } from './SimpleConfetti';
import {
    Triangle, Diamond, Circle, Square,
    Clock, Trophy, XCircle, Play, Utensils,
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
    const { state, players } = room;
    const { phaseState, currentQuestionIndex, phase1Answers, phase1BlockedTeams } = state;

    // Use custom AI-generated questions if available, fallback to default QUESTIONS
    const questionsList = room.customQuestions?.phase1 || QUESTIONS;
    const currentQuestion = (currentQuestionIndex !== undefined && currentQuestionIndex >= 0)
        ? questionsList[currentQuestionIndex]
        : null;

    const [myAnswer, setMyAnswer] = useState<number | null>(null);

    // Check if my team is blocked
    const myTeam = players[playerId]?.team;
    const blockedTeams = phase1BlockedTeams || [];
    const isMyTeamBlocked = myTeam ? blockedTeams.includes(myTeam) : false;

    // Reset local answer when question changes
    const prevQIndex = useRef(currentQuestionIndex);
    if (prevQIndex.current !== currentQuestionIndex) {
        setMyAnswer(null);
        prevQIndex.current = currentQuestionIndex;
    }

    const handleAnswer = (index: number) => {
        if (phaseState === 'answering' && myAnswer === null && !isMyTeamBlocked) {
            audioService.playClick();
            setMyAnswer(index);
            submitAnswer(room.code, playerId, index);
        }
    };

    // HOST LOGIC
    const nextQIndex = (currentQuestionIndex ?? -1) + 1;
    const isFinished = nextQIndex >= questionsList.length;

    const handleNextQuestion = () => {
        console.log('🔘 handleNextQuestion clicked:', { isFinished, nextQIndex, roomCode: room.code });
        if (!isFinished) {
            console.log('🔘 Calling startNextQuestion...');
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
    let resultMessage = "En attente...";
    let resultIcon = <Clock className="w-8 h-8" />;
    let resultColor = "text-slate-400";

    if (isResult) {
        const winnerTeam = state.roundWinner?.team;
        const didMyTeamWin = winnerTeam && winnerTeam === myTeam;

        if (state.roundWinner?.playerId === playerId) {
            resultMessage = "BRAVO ! +1 POINT";
            resultIcon = <Trophy className="w-8 h-8" />;
            resultColor = "text-green-400";
        } else if (didMyTeamWin) {
            resultMessage = "Ton équipe a gagné !";
            resultIcon = <Trophy className="w-8 h-8" />;
            resultColor = "text-green-400";
        } else if (winnerTeam && winnerTeam !== 'neutral') {
            resultMessage = `L'équipe ${winnerTeam === 'spicy' ? 'Spicy' : 'Sweet'} gagne !`;
            resultIcon = <XCircle className="w-8 h-8" />;
            resultColor = "text-red-400";
        } else if (!state.roundWinner) {
            resultMessage = "Personne n'a trouvé !";
            resultIcon = <XCircle className="w-8 h-8" />;
            resultColor = "text-slate-400";
        } else if (myAnswer !== null) {
            resultMessage = "Mauvaise réponse !";
            resultIcon = <XCircle className="w-8 h-8" />;
            resultColor = "text-red-400";
        } else {
            resultMessage = "Manche terminée";
            resultIcon = <Clock className="w-8 h-8" />;
            resultColor = "text-slate-400";
        }
    }

    // Audio & Visual Effects Logic
    useEffect(() => {
        if (isResult) {
            const winnerTeam = state.roundWinner?.team;
            const didMyTeamWin = winnerTeam && winnerTeam === myTeam;

            if (state.roundWinner?.playerId === playerId) {
                audioService.playWinRound();
            } else if (didMyTeamWin) {
                audioService.playSuccess();
            } else if (winnerTeam && winnerTeam !== 'neutral') {
                audioService.playError(); // Other team won
            } else {
                audioService.playError(); // No winner
            }
        }
    }, [isResult, state.roundWinner, playerId, myTeam]);

    // Timer Tick Audio
    useEffect(() => {
        if (isReading) {
            const interval = setInterval(() => {
                audioService.playTimerTick();
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isReading]);

    // Auto-advance to next question after showing result (host only)
    // Longer delay when there's an anecdote to read
    // Auto-transition to Phase 2 when all questions are done
    useEffect(() => {
        console.log('🔄 Auto-advance useEffect:', {
            isResult,
            isHost,
            isFinished,
            nextQIndex,
            questionsListLength: questionsList.length,
            currentQuestionIndex,
            customQuestionsPhase1: room.customQuestions?.phase1?.length ?? 'none'
        });
        if (isResult && isHost) {
            const hasAnecdote = currentQuestion?.anecdote;
            const delay = hasAnecdote ? 7000 : 5000; // 7s with anecdote, 5s without
            console.log('⏱️ Setting timeout for auto-advance:', { hasAnecdote, delay, isFinished });
            const timer = setTimeout(() => {
                console.log('⏰ Timeout fired! isFinished:', isFinished);
                if (isFinished) {
                    // Auto-transition to Phase 2
                    console.log('🏁 Transitioning to Phase 2!');
                    setGameStatus(room.code, 'phase2');
                } else {
                    console.log('➡️ Going to next question:', nextQIndex);
                    startNextQuestion(room.code, nextQIndex);
                }
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [isResult, isHost, isFinished, room.code, nextQIndex, currentQuestion?.anecdote]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto p-4 space-y-6 relative">
            {/* Top Bar: Progress & Roster */}
            <div className="w-full flex items-center justify-between bg-slate-800/50 p-2 rounded-xl border border-white/5 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Manche</span>
                    <span className="text-white font-black bg-slate-700 px-2 py-0.5 rounded text-sm">
                        {(currentQuestionIndex ?? -1) + 1} / {questionsList.length}
                    </span>
                </div>

                {/* Teammates Mini Roster - Shows answer status */}
                <div className="flex -space-x-1 items-center">
                    {Object.values(room.players)
                        .filter(p => p.id !== playerId && p.team === room.players[playerId]?.team)
                        .slice(0, 6) // Show max 6 teammates
                        .map(p => {
                            const AvatarIcon = getAvatarIcon(p.avatar);
                            const hasAnswered = phase1Answers && p.id in phase1Answers;
                            const wasCorrect = phase1Answers?.[p.id];
                            return (
                                <div
                                    key={p.id}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm relative text-white transition-all
                                        ${hasAnswered
                                            ? (wasCorrect ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400')
                                            : 'bg-slate-700 border-slate-600'}
                                        ${hasAnswered ? 'scale-110 z-10' : ''}
                                    `}
                                    title={`${p.name}${hasAnswered ? (wasCorrect ? ' ✓' : ' ✗') : ' (en attente...)'}`}
                                >
                                    <AvatarIcon className="w-4 h-4" />
                                    {hasAnswered && (
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${wasCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                                            {wasCorrect ? '✓' : '✗'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    {Object.values(room.players).filter(p => p.id !== playerId && p.team === room.players[playerId]?.team).length > 6 && (
                        <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs text-white font-bold">
                            +{Object.values(room.players).filter(p => p.id !== playerId && p.team === room.players[playerId]?.team).length - 6}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Header */}
            <div className="space-y-4 w-full">
                {/* Question Text */}
                {currentQuestion && (
                    <div className="bg-slate-800/80 p-6 rounded-xl backdrop-blur-sm border border-slate-700 shadow-xl">
                        <p className="text-white font-bold text-xl md:text-2xl leading-relaxed text-left">
                            {currentQuestion.text}
                        </p>
                    </div>
                )}

                <h3 className="text-xl font-bold text-white opacity-80 flex items-center justify-center gap-2">
                    {isReading && <><Clock className="w-6 h-6 animate-pulse" /> Lecture... {countdown}s</>}
                    {isAnswering && !isMyTeamBlocked && <><Play className="w-6 h-6" /> RÉPONDEZ !</>}
                    {isAnswering && isMyTeamBlocked && <><XCircle className="w-6 h-6 text-red-400" /> <span className="text-red-400">Équipe bloquée - Attendez !</span></>}
                    {isResult && "Manche terminée"}
                    {phaseState === 'idle' && "Préparez-vous..."}
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
                            disabled={!isAnswering || myAnswer !== null || isMyTeamBlocked}
                            className={`
                                relative w-full p-4 rounded-xl flex items-center space-x-4 shadow-lg border-b-4 transition-all
                                ${COLORS[idx]}
                                ${(!isAnswering && !isResult) || isMyTeamBlocked ? 'opacity-50 grayscale' : ''}
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
                                Gagnant : <Trophy className="w-4 h-4 text-yellow-400" /> <span className="text-yellow-400 font-bold">{state.roundWinner.name}</span>
                            </div>
                        )}
                        {/* Show correct answer when nobody found it */}
                        {!state.roundWinner && currentQuestion && (
                            <div className="text-sm text-white mt-2 bg-green-600/30 border border-green-500/50 px-4 py-2 rounded-lg">
                                <span className="text-green-400 font-bold">Bonne réponse :</span>{' '}
                                <span className="text-white font-semibold">{currentQuestion.options[currentQuestion.correctIndex]}</span>
                            </div>
                        )}
                        {/* Anecdote display for AI-generated questions */}
                        {currentQuestion?.anecdote && (
                            <p className="text-sm text-slate-300 italic mt-3 max-w-md text-center border-t border-slate-700 pt-3">
                                💡 {currentQuestion.anecdote}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Celebration Confetti - for personal wins or team wins */}
            {isResult && (state.roundWinner?.playerId === playerId || (state.roundWinner?.team === myTeam)) && <SimpleConfetti />}

            {/* HOST CONTROLS - Fixed at bottom */}

            {isHost && currentQuestionIndex === -1 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur border-t border-slate-800 flex justify-center z-50">
                    <button
                        onClick={handleNextQuestion}
                        className="px-8 py-3 rounded-full text-lg font-bold text-white shadow-lg transition-all w-full max-w-sm flex items-center justify-center gap-2 bg-gradient-to-r from-spicy-500 to-sweet-500 hover:scale-105 active:scale-95"
                    >
                        <Play className="w-5 h-5" /> Commencer
                    </button>
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
