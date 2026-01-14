import { useState } from 'react';
import { Flame, Candy } from 'lucide-react';
import { UserBar } from '../auth/UserBar';
import { ProfileEditModal } from '../auth/ProfileEditModal';
import { QuickSettings } from '../pwa/QuickSettings';
import { useAppInstall } from '../../hooks/useAppInstall';
import type { Player, Avatar } from '../../services/gameService';

interface GameHeaderProps {
    players: Record<string, Player>;
    currentPlayer: Player | null;
    roomCode: string;
    playerId?: string;
    onProfileUpdate: (name: string, avatar: Avatar) => void;
}

export function GameHeader({
    players,
    currentPlayer,
    roomCode,
    playerId,
    onProfileUpdate,
}: GameHeaderProps) {
    const { isInstalled } = useAppInstall();
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const playersList = Object.values(players);

    const spicyScore = playersList
        .filter(p => p.team === 'spicy')
        .reduce((sum, p) => sum + p.score, 0);

    const sweetScore = playersList
        .filter(p => p.team === 'sweet')
        .reduce((sum, p) => sum + p.score, 0);

    // Determine if current player is on spicy or sweet team
    const playerTeam = currentPlayer?.team;
    const isSpicy = playerTeam === 'spicy';
    const isSweet = playerTeam === 'sweet';

    // Player's own team score (highlighted)
    const myTeamScore = isSpicy ? spicyScore : isSweet ? sweetScore : null;

    return (
        <div className="absolute top-4 left-4 right-4 z-[100] flex items-center justify-between gap-2">
            {/* Left: Spicy Score - highlighted if player's team */}
            <div className={`flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border ${
                isSpicy ? 'border-spicy-500 ring-2 ring-spicy-500/50' : 'border-spicy-500/30'
            }`}>
                <Flame className="w-4 h-4 text-spicy-400" />
                <span className={`text-lg font-black min-w-[1.5rem] text-center ${
                    isSpicy ? 'text-spicy-300' : 'text-white'
                }`}>
                    {spicyScore}
                </span>
            </div>

            {/* Center: VS badge - hidden on very small screens */}
            <div className="hidden xs:flex items-center justify-center">
                <span className="text-slate-500 font-bold text-sm bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    VS
                </span>
            </div>

            {/* Right: Sweet Score + Team indicator + User */}
            <div className="flex items-center gap-2">
                {/* Sweet Score - highlighted if player's team */}
                <div className={`flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border ${
                    isSweet ? 'border-sweet-500 ring-2 ring-sweet-500/50' : 'border-sweet-500/30'
                }`}>
                    <span className={`text-lg font-black min-w-[1.5rem] text-center ${
                        isSweet ? 'text-sweet-300' : 'text-white'
                    }`}>
                        {sweetScore}
                    </span>
                    <Candy className="w-4 h-4 text-sweet-400" />
                </div>

                {/* Player's team indicator - shows which score is theirs */}
                {playerTeam && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                        isSpicy
                            ? 'bg-spicy-500/20 text-spicy-400 border border-spicy-500/30'
                            : 'bg-sweet-500/20 text-sweet-400 border border-sweet-500/30'
                    }`}>
                        {isSpicy ? <Flame className="w-3 h-3" /> : <Candy className="w-3 h-3" />}
                        <span>{myTeamScore}</span>
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
