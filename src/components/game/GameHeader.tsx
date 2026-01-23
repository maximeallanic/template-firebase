import { useState, useMemo } from 'react';
import { Flame, Candy } from 'lucide-react';
import { UserBar } from '../auth/UserBar';
import { ProfileEditModal } from '../auth/ProfileEditModal';
import { QuickSettings } from '../pwa/QuickSettings';
import { useAppInstall } from '../../hooks/useAppInstall';
import type { Player, Avatar, Room, Team } from '../../services/gameService';

// Points per correct answer in each phase
const PHASE_POINTS: Record<string, number> = {
    phase1: 10,
    phase2: 10,
    phase3: 15,
    phase4: 15,
    phase5: 20,
};

/**
 * Calculate running phase scores from revealedAnswers.
 * This provides real-time score updates during a phase before nextPhase CF is called.
 */
function calculateRunningPhaseScores(room: Room): { spicy: number; sweet: number } {
    const scores = { spicy: 0, sweet: 0 };
    const revealed = room.revealedAnswers;
    if (!revealed) return scores;

    // Phase 1: First correct answer wins
    if (revealed.phase1) {
        for (const answer of Object.values(revealed.phase1)) {
            if (answer.winnerTeam) {
                scores[answer.winnerTeam] += PHASE_POINTS.phase1;
            }
        }
    }

    // Phase 2: Each correct team answer gets points
    if (revealed.phase2) {
        for (const answer of Object.values(revealed.phase2)) {
            if (answer.teamAnswers?.spicy?.isCorrect) {
                scores.spicy += PHASE_POINTS.phase2;
            }
            if (answer.teamAnswers?.sweet?.isCorrect) {
                scores.sweet += PHASE_POINTS.phase2;
            }
        }
    }

    // Phase 3: Correct answers by team members get points
    if (revealed.phase3) {
        for (const [team, teamAnswers] of Object.entries(revealed.phase3)) {
            for (const answer of Object.values(teamAnswers)) {
                if (answer.isCorrect) {
                    scores[team as Team] += PHASE_POINTS.phase3;
                }
            }
        }
    }

    // Phase 4: First correct answer wins
    if (revealed.phase4) {
        for (const answer of Object.values(revealed.phase4)) {
            if (answer.winnerTeam) {
                scores[answer.winnerTeam] += PHASE_POINTS.phase4;
            }
        }
    }

    // Phase 5: Correct answers by team representatives get points
    if (revealed.phase5) {
        for (const teamAnswers of Object.values(revealed.phase5)) {
            for (const answer of Object.values(teamAnswers)) {
                if (answer.isCorrect && answer.team) {
                    scores[answer.team] += PHASE_POINTS.phase5;
                }
            }
        }
    }

    return scores;
}

interface GameHeaderProps {
    players: Record<string, Player>;
    currentPlayer: Player | null;
    roomCode: string;
    playerId?: string;
    onProfileUpdate: (name: string, avatar: Avatar) => void;
    room?: Room;
}

export function GameHeader({
    players,
    currentPlayer,
    roomCode,
    playerId,
    onProfileUpdate,
    room,
}: GameHeaderProps) {
    const { isInstalled } = useAppInstall();
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const playersList = Object.values(players);

    // Calculate running phase scores from revealedAnswers (real-time during phase)
    const runningPhaseScores = useMemo(() => {
        if (!room) return { spicy: 0, sweet: 0 };
        return calculateRunningPhaseScores(room);
    }, [room]);

    // Fallback: calculate from player scores if room not provided
    const playerBasedSpicy = playersList
        .filter(p => p.team === 'spicy')
        .reduce((sum, p) => sum + p.score, 0);
    const playerBasedSweet = playersList
        .filter(p => p.team === 'sweet')
        .reduce((sum, p) => sum + p.score, 0);

    // Use running phase scores if room available, otherwise fallback to player scores
    // Note: With #72 architecture, revealedAnswers provides real-time scores during phases
    const spicyScore = room ? runningPhaseScores.spicy : playerBasedSpicy;
    const sweetScore = room ? runningPhaseScores.sweet : playerBasedSweet;

    // Determine if current player is on spicy or sweet team
    const playerTeam = currentPlayer?.team;
    const isSpicy = playerTeam === 'spicy';

    // Swap scores based on player's team: YOUR team score is always on the RIGHT (near your pseudo)
    // If player is Spicy: Left = Sweet (opponent), Right = Spicy (yours)
    // If player is Sweet: Left = Spicy (opponent), Right = Sweet (yours) - default layout

    return (
        <div className="absolute top-4 left-4 right-4 z-[100] flex items-center justify-between gap-2">
            {/* Left: Opponent's Score */}
            {isSpicy ? (
                // Player is Spicy -> Show Sweet (opponent) on left
                <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border border-sweet-500/30">
                    <Candy className="w-4 h-4 text-sweet-400" />
                    <span className="text-lg font-black min-w-[1.5rem] text-center text-white">
                        {sweetScore}
                    </span>
                </div>
            ) : (
                // Player is Sweet -> Show Spicy (opponent) on left
                <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border border-spicy-500/30">
                    <Flame className="w-4 h-4 text-spicy-400" />
                    <span className="text-lg font-black min-w-[1.5rem] text-center text-white">
                        {spicyScore}
                    </span>
                </div>
            )}

            {/* Center: VS badge - hidden on very small screens */}
            <div className="hidden xs:flex items-center justify-center">
                <span className="text-slate-500 font-bold text-sm bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    VS
                </span>
            </div>

            {/* Right: Your Team Score + User */}
            <div className="flex items-center gap-2">
                {/* Your Team Score - highlighted */}
                {isSpicy ? (
                    // Player is Spicy -> Show Spicy (yours) on right, highlighted
                    <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border-2 border-spicy-500 ring-2 ring-spicy-500/50">
                        <span className="text-lg font-black min-w-[1.5rem] text-center text-spicy-300">
                            {spicyScore}
                        </span>
                        <Flame className="w-4 h-4 text-spicy-400" />
                    </div>
                ) : (
                    // Player is Sweet -> Show Sweet (yours) on right, highlighted
                    <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border-2 border-sweet-500 ring-2 ring-sweet-500/50">
                        <span className="text-lg font-black min-w-[1.5rem] text-center text-sweet-300">
                            {sweetScore}
                        </span>
                        <Candy className="w-4 h-4 text-sweet-400" />
                    </div>
                )}

                {/* User Bar / Quick Settings (PWA) */}
                {currentPlayer && (
                    isInstalled ? (
                        <QuickSettings
                            onEditProfile={() => setShowProfileEdit(true)}
                            roomCode={roomCode}
                            playerId={playerId}
                        />
                    ) : (
                        <UserBar
                            playerName={currentPlayer.name}
                            avatar={currentPlayer.avatar}
                            roomCode={roomCode}
                            playerId={playerId}
                            onProfileUpdate={onProfileUpdate}
                        />
                    )
                )}
            </div>

            {/* Profile Edit Modal - for PWA mode */}
            {currentPlayer && (
                <ProfileEditModal
                    isOpen={showProfileEdit}
                    onClose={() => setShowProfileEdit(false)}
                    currentName={currentPlayer.name}
                    currentAvatar={currentPlayer.avatar}
                    roomCode={roomCode}
                    playerId={playerId}
                    onSave={(newName, newAvatar) => {
                        onProfileUpdate(newName, newAvatar);
                        setShowProfileEdit(false);
                    }}
                />
            )}
        </div>
    );
}
