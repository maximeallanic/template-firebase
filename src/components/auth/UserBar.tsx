import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown, Settings, Power } from 'lucide-react';
import { ProfileEditModal } from './ProfileEditModal';
import { AvatarIcon } from '../AvatarIcon';
import { safeStorage } from '../../utils/storage';
import { getLocalProfile } from '../../services/profileService';
import { leaveRoom, type Avatar } from '../../services/gameService';
import { signOut } from '../../services/firebase';

interface UserBarProps {
    playerName?: string;
    avatar?: Avatar;
    roomCode?: string;
    playerId?: string;
    onProfileUpdate?: (name: string, avatar: Avatar) => void;
    /** When true, applies edge-attached styling (rounded left only, no right border) */
    attachedToEdge?: boolean;
}

export const UserBar: React.FC<UserBarProps> = ({
    playerName: propPlayerName,
    avatar: propAvatar,
    roomCode,
    playerId,
    onProfileUpdate,
    attachedToEdge = false
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Read from localStorage cache if props not provided
    const localProfile = getLocalProfile();
    const playerName = propPlayerName || localProfile?.profileName || '';
    const avatar = propAvatar || localProfile?.profileAvatar || 'burger';

    // Close dropdown when clicking outside or pressing Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isDropdownOpen) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDropdownOpen]);

    // Don't render if no user identity
    if (!playerName) {
        return null;
    }

    const handleLeaveGame = async () => {
        setIsDropdownOpen(false);

        // Remove player from the room
        if (roomCode && playerId) {
            try {
                await leaveRoom(roomCode, playerId);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }

        // Clear room-related data but keep profile
        safeStorage.removeItem('spicy_room_code');
        safeStorage.removeItem('spicy_player_id');

        // Navigate to home
        window.location.href = '/';
    };

    const handleEditProfile = () => {
        setIsDropdownOpen(false);
        setIsProfileModalOpen(true);
    };

    const handleProfileSave = (newName: string, newAvatar: Avatar) => {
        // ProfileEditModal already saves to Firestore and localStorage via saveProfile()
        // Just notify parent and close modal
        if (onProfileUpdate) {
            onProfileUpdate(newName, newAvatar);
        }

        setIsProfileModalOpen(false);
    };

    const handleLogout = async () => {
        setIsDropdownOpen(false);

        // Quitter la room si présent
        if (roomCode && playerId) {
            try {
                await leaveRoom(roomCode, playerId);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }

        // Déconnexion Firebase
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }

        // Nettoyer le localStorage
        safeStorage.removeItem('spicy_room_code');
        safeStorage.removeItem('spicy_player_id');
        safeStorage.removeItem('spicy_profile');

        // Rediriger vers la page de connexion
        window.location.href = '/login';
    };

    return (
        <>
            <div ref={dropdownRef} className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="menu"
                    aria-label={`Menu utilisateur pour ${playerName}`}
                    className={`flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 px-3 py-2 transition-all hover:bg-slate-700/80 ${
                        attachedToEdge ? 'rounded-l-full border-r-0' : 'rounded-full'
                    }`}
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                        <AvatarIcon avatar={avatar} size={28} />
                    </div>
                    <span className="text-sm font-semibold text-white max-w-[100px] truncate">
                        {playerName}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
                        >
                            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                        <AvatarIcon avatar={avatar} size={36} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{playerName}</p>
                                        <p className="text-xs text-slate-400">Joueur</p>
                                    </div>
                                </div>
                            </div>

                            <div className="py-1" role="menu" aria-label="Actions utilisateur">
                                <button
                                    onClick={handleEditProfile}
                                    role="menuitem"
                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" aria-hidden="true" />
                                    Modifier le Profil
                                </button>
                                {roomCode && (
                                    <button
                                        onClick={handleLeaveGame}
                                        role="menuitem"
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" aria-hidden="true" />
                                        Quitter la Partie
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    role="menuitem"
                                    className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Power className="w-4 h-4" aria-hidden="true" />
                                    Se déconnecter
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ProfileEditModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                currentName={playerName}
                currentAvatar={avatar}
                roomCode={roomCode}
                playerId={playerId}
                onSave={handleProfileSave}
            />
        </>
    );
};
