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

    return (
        <div className="absolute top-4 left-4 right-4 z-[100] flex items-center justify-between gap-2">
            {/* Left: Spicy Score */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border border-spicy-500/30">
                <Flame className="w-4 h-4 text-spicy-400" />
                <span className="text-lg font-black text-white min-w-[1.5rem] text-center">
                    {spicyScore}
                </span>
            </div>

            {/* Center: VS badge - hidden on very small screens */}
            <div className="hidden xs:flex items-center justify-center">
                <span className="text-slate-500 font-bold text-sm bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                    VS
                </span>
            </div>

            {/* Right: Sweet Score + User */}
            <div className="flex items-center gap-2">
                {/* Sweet Score */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-full border border-sweet-500/30">
                    <span className="text-lg font-black text-white min-w-[1.5rem] text-center">
                        {sweetScore}
                    </span>
                    <Candy className="w-4 h-4 text-sweet-400" />
                </div>

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
