
import React from 'react';
import { motion } from 'framer-motion';
import { selectMenu, nextMenuQuestion, endMenuTurn, addTeamPoints, setGameStatus } from '../services/gameService';
import type { Room, Phase3Menu } from '../services/gameService';
import { PHASE3_DATA } from '../services/data/phase3';
import { Flame, Candy, Check, X, ChefHat, Info, Zap } from 'lucide-react';

interface Phase3PlayerProps {
    room: Room;
    isHost: boolean;
}

export const Phase3Player: React.FC<Phase3PlayerProps> = ({ room, isHost }) => {
    const { phaseState, phase3MenuSelection, currentMenuTeam, currentMenuQuestionIndex } = room.state;

    // Use custom AI-generated menus if available, fallback to default PHASE3_DATA
    const menuData: Phase3Menu[] = room.customQuestions?.phase3 || PHASE3_DATA;

    const completedMenus = room.state.phase3CompletedMenus || [];
    const isMenuTaken = (idx: number) => completedMenus.includes(idx);
    const allMenusTaken = menuData.length > 0 && completedMenus.length >= menuData.length;

    // Helper to get remaining menus
    const getAvailableMenus = () => {
        const usedIndicesFromSelection = Object.values(phase3MenuSelection || {});
        return menuData.map((menu, index) => ({
            ...menu,
            index,
            taken: usedIndicesFromSelection.includes(index) || isMenuTaken(index)
        }));
    };

    const handleMenuSelect = (index: number) => {
        if (!isHost) return;
        if (isMenuTaken(index)) return; // New check from the snippet
        // Logic: If Spicy hasn't chosen, they choose. Else Sweet chooses.
        // Assuming 'spicy' goes first as per rules or derived from state.
        const teamTurn = !phase3MenuSelection?.spicy ? 'spicy' : 'sweet';
        selectMenu(room.code, teamTurn, index);
    };

    if (phaseState === 'menu_selection') {
        const availableMenus = getAvailableMenus();
        const TeamIcon = !phase3MenuSelection?.spicy ? Flame : Candy;
        const teamName = !phase3MenuSelection?.spicy ? 'Spicy' : 'Sweet';
        const teamColor = !phase3MenuSelection?.spicy ? 'text-red-500' : 'text-pink-500';

        return (
            <div className="flex flex-col items-center justify-center p-6 space-y-8 w-full max-w-4xl mx-auto h-[80vh]">
                <h2 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
                    Choose a Menu <span className={`${teamColor} flex items-center gap-2`}>
                        {teamName} <TeamIcon className="w-10 h-10" />
                    </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {availableMenus.map((menu) => (
                        <motion.button
                            key={menu.title}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => !menu.taken && handleMenuSelect(menu.index)}
                            disabled={menu.taken || !isHost}
                            className={`p-6 rounded-2xl shadow-xl flex flex-col items-center text-center transition-all
                                ${menu.taken
                                    ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                                    : 'bg-white hover:bg-yellow-100 cursor-pointer border-4 border-transparent hover:border-yellow-400'
                                }`}
                        >
                            <h3 className={`text-2xl font-black mb-2 flex items-center gap-2 ${menu.taken ? 'text-gray-500' : 'text-brand-dark'}`}>
                                {menu.title}
                            </h3>
                            <p className="text-sm text-gray-600">{menu.description}</p>
                            {menu.taken && <span className="mt-2 text-xs font-bold text-red-500 uppercase flex items-center gap-1"><ChefHat className="w-4 h-4" /> TAKEN</span>}
                        </motion.button>
                    ))}
                </div>
                {!isHost && <p className="text-white opacity-70 animate-pulse flex items-center gap-2"><Info className="w-5 h-5" /> Waiting for host to select...</p>}

                {isHost && availableMenus.every(m => m.taken) && (
                    <div className="mt-8 animate-bounce">
                        <button
                            onClick={() => setGameStatus(room.code, 'phase4')}
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-brand-dark px-12 py-4 rounded-full font-black text-2xl shadow-xl hover:scale-105 transition-transform"
                        >
                            START PHASE 4: L'ADDITION 🧾
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (phaseState === 'questioning' && currentMenuTeam && phase3MenuSelection) {
        const menuIndex = phase3MenuSelection[currentMenuTeam];
        if (menuIndex === undefined) return <div>Error loading menu</div>;

        const menu = menuData[menuIndex];
        const questionData = menu?.questions[currentMenuQuestionIndex || 0];

        // Check if finished
        if (!questionData) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white">
                    <h2 className="text-4xl font-black mb-4">Menu Complete!</h2>
                    {isHost && (
                        <button
                            onClick={() => endMenuTurn(room.code)}
                            className="bg-yellow-400 text-brand-dark px-8 py-3 rounded-full font-bold text-xl hover:bg-yellow-300 transition-colors"
                        >
                            Back to Menu Selection
                        </button>
                    )}
                    {/* Host Controls */}
                    {isHost && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur border-t border-slate-700 flex justify-center gap-4 z-50">
                            {/* Show Start Phase 4 if all menus are done */}
                            {allMenusTaken && (
                                <button
                                    onClick={() => setGameStatus(room.code, 'phase4')}
                                    className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-3 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2"
                                >
                                    <Zap className="w-5 h-5" /> Start Phase 4: La Note
                                </button>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center h-[80vh]">
                <div className={`px-4 py-2 rounded-full mb-6 font-bold text-sm uppercase tracking-wider flex items-center gap-2
                    ${currentMenuTeam === 'spicy' ? 'bg-red-100 text-red-600' : 'bg-pink-100 text-pink-600'}
                 `}>
                    {currentMenuTeam === 'spicy' ? <Flame className="w-4 h-4" /> : <Candy className="w-4 h-4" />}
                    Team {currentMenuTeam} is Playing
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentMenuQuestionIndex}
                    className="bg-white rounded-3xl p-8 shadow-2xl w-full"
                >
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">{questionData.question}</h3>

                    {isHost ? (
                        <div className="space-y-6">
                            <div className="bg-yellow-100 p-4 rounded-xl">
                                <span className="text-sm text-yellow-800 font-bold uppercase block mb-1">Answer</span>
                                <p className="text-2xl font-black text-brand-dark">{questionData.answer}</p>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => nextMenuQuestion(room.code, currentMenuQuestionIndex!)}
                                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" /> Wrong / Skip
                                </button>
                                <button
                                    onClick={() => {
                                        addTeamPoints(room.code, currentMenuTeam, 1);
                                        nextMenuQuestion(room.code, currentMenuQuestionIndex!);
                                    }}
                                    className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-400 shadow-lg flex items-center gap-2"
                                >
                                    <Check className="w-5 h-5" /> Correct (+1 Miam)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8">
                            {/* Display Question to Players too (for accessibility/no-voice) */}
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">{questionData.question}</h3>
                            <div className="bg-slate-100 p-4 rounded-xl inline-block flex items-center gap-2 mx-auto">
                                <Info className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-400 italic animate-pulse">Waiting for the judge...</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                <div className="mt-8 text-white opacity-60 font-mono">
                    Question {currentMenuQuestionIndex! + 1} / {menu.questions.length}
                </div>
            </div>
        );
    }

    return null;
};
