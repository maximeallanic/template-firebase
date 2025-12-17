import { Flame, Candy } from 'lucide-react';
import type { Player } from '../services/gameService';

interface TeamScoresProps {
    players: Record<string, Player>;
}

export function TeamScores({ players }: TeamScoresProps) {
    const playersList = Object.values(players);

    const spicyScore = playersList
        .filter(p => p.team === 'spicy')
        .reduce((sum, p) => sum + p.score, 0);

    const sweetScore = playersList
        .filter(p => p.team === 'sweet')
        .reduce((sum, p) => sum + p.score, 0);

    return (
        <div className="flex items-center justify-center gap-6 bg-slate-800/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
            {/* Spicy Team */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-red-400">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wide">Spicy</span>
                </div>
                <span className="text-2xl font-black text-white bg-red-500/20 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                    {spicyScore}
                </span>
            </div>

            {/* Separator */}
            <div className="text-slate-500 font-bold text-xl">vs</div>

            {/* Sweet Team */}
            <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white bg-pink-500/20 px-3 py-1 rounded-lg min-w-[3rem] text-center">
                    {sweetScore}
                </span>
                <div className="flex items-center gap-1 text-pink-400">
                    <span className="font-bold text-sm uppercase tracking-wide">Sweet</span>
                    <Candy className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
