import { type Room, startNextQuestion } from '../services/gameService';
import { QUESTIONS } from '../data/questions';

interface Phase1HostProps {
    room: Room;
}

export default function Phase1Host({ room }: Phase1HostProps) {
    const { state } = room;
    const currentQIndex = state.currentQuestionIndex ?? -1;
    const currentQuestion = currentQIndex >= 0 ? QUESTIONS[currentQIndex] : null;
    const isReading = state.phaseState === 'reading';
    const isAnswering = state.phaseState === 'answering';
    const isResult = state.phaseState === 'result';

    // Determine next question index
    const nextQIndex = currentQIndex + 1;
    const isFinished = nextQIndex >= QUESTIONS.length;

    const handleNextQuestion = () => {
        if (!isFinished) {
            startNextQuestion(room.code, nextQIndex);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8">
            {/* Header / Context */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-spicy-400 to-sweet-400">
                    Phase 1: The Snacks 🍿
                </h2>
                <p className="text-slate-400">Question {currentQIndex + 1} / {QUESTIONS.length}</p>
            </div>

            {/* Current Question Status Card */}
            <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50">
                {currentQuestion ? (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white text-center">
                            {currentQuestion.text}
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            {currentQuestion.options.map((opt, idx) => (
                                <div key={idx}
                                    className={`p-4 rounded-xl border transition-all ${idx === currentQuestion.correctIndex
                                        ? 'bg-green-500/20 border-green-500 text-green-300'
                                        : 'bg-slate-800/50 border-slate-700 text-slate-400'
                                        }`}
                                >
                                    <span className="font-bold mr-2">{['A', 'B', 'C', 'D'][idx]}.</span> {opt}
                                </div>
                            ))}
                        </div>

                        {/* Status Indicator */}
                        <div className="flex justify-center mt-6">
                            {isReading && <span className="text-yellow-400 font-bold animate-pulse">Reading Time... ⏳</span>}
                            {isAnswering && <span className="text-blue-400 font-bold animate-bounce">Players Answering! ⚡</span>}
                            {isResult && (
                                <div className="text-center">
                                    <span className="text-green-400 font-bold text-xl block mb-2">Round Over! 🎉</span>
                                    {state.roundWinner ? (
                                        <div className="text-white">
                                            Winner: <span className="font-bold text-yellow-300">{state.roundWinner.name}</span> (+1 Yum)
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">No winner this round.</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-12">
                        <p>Ready to start the quiz? Check Question 1.</p>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex gap-6 w-full max-w-md justify-center">
                {!isFinished ? (
                    <button
                        onClick={handleNextQuestion}
                        disabled={isReading || isAnswering}
                        className={`
                            px-8 py-4 rounded-xl text-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 w-full
                            ${(isReading || isAnswering)
                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 ring-2 ring-blue-400/20'
                            }
                        `}
                    >
                        {currentQIndex === -1 ? "Start The Snacks! 🚀" : "Next Question ➡️"}
                    </button>
                ) : (
                    <div className="text-2xl font-bold text-white">
                        End of Phase 1! 🏁
                    </div>
                )}
            </div>
        </div>
    );
}
