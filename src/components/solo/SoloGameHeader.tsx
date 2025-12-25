/**
 * Solo Game Header
 * Displays score and phase info for solo mode (without Spicy vs Sweet teams)
 */

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SoloGameHeaderProps {
    score: number;
    maxScore: number;
    phaseName: string;
    currentRound?: number;
    totalRounds?: number;
}

export function SoloGameHeader({ score, maxScore, phaseName, currentRound, totalRounds }: SoloGameHeaderProps) {
    const prefersReducedMotion = useReducedMotion();
    const scorePercentage = Math.round((score / maxScore) * 100);

    return (
        <header className="relative z-40 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                {/* Left: Phase name */}
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">
                            Mode Solo
                        </div>
                        <div className="font-bold text-white">
                            {phaseName}
                        </div>
                    </div>
                </div>

                {/* Center: Score bar */}
                <div className="flex-1 mx-4 md:mx-6 max-w-xs">
                    <div className="relative h-8 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-red-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${scorePercentage}%` }}
                            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 100 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-bold text-white text-sm drop-shadow-md">
                                {score} / {maxScore}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Round indicator (mobile) */}
                {currentRound !== undefined && totalRounds !== undefined && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
                            Manche
                        </span>
                        <span className="font-bold text-white bg-slate-700 px-2 py-1 rounded text-sm">
                            {currentRound} / {totalRounds}
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
}
