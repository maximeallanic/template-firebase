import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronDown, Settings, Power, Crown, Globe, Check, Volume2, VolumeX } from 'lucide-react';
import { ProfileEditModal } from './ProfileEditModal';
import { AvatarIcon } from '../AvatarIcon';
import { safeStorage } from '../../utils/storage';
import { getLocalProfile, clearLocalProfile } from '../../services/profileService';
import { leaveRoom, type Avatar } from '../../services/gameService';
import { signOut, createCheckoutSession } from '../../services/firebase';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useCurrentUserSubscription } from '../../hooks/useHostSubscription';
import { useSoundSettings } from '../../hooks/useSoundSettings';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n/types';

interface UserBarProps {
    playerName?: string;
    avatar?: Avatar;
    roomCode?: string;
    playerId?: string;
    onProfileUpdate?: (name: string, avatar: Avatar) => void;
}

export const UserBar: React.FC<UserBarProps> = ({
    playerName: propPlayerName,
    avatar: propAvatar,
    roomCode,
    playerId,
    onProfileUpdate
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // i18n
    const { t, i18n } = useTranslation('common');
    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

    // Get authenticated user and their subscription status
    const { user } = useAuthUser();
    const { isPremium, isLoading: isSubscriptionLoading } = useCurrentUserSubscription();

    // Sound settings
    const { soundEnabled, toggleSound } = useSoundSettings();

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
        clearLocalProfile();

        // Rediriger vers la page de connexion
        window.location.href = '/login';
    };

    const handleUpgrade = async () => {
        if (!user) return;

        setIsUpgrading(true);
        try {
            const returnUrl = window.location.href;
            const { url } = await createCheckoutSession(returnUrl);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Failed to create checkout session:', error);
            setIsUpgrading(false);
        }
    };

    const handleLanguageChange = (languageCode: SupportedLanguage) => {
        i18n.changeLanguage(languageCode);
        setShowLanguageMenu(false);
    };

    return (
        <>
            <div ref={dropdownRef} className="relative">
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="menu"
                    aria-label={`Menu utilisateur pour ${playerName}`}
                    className={`flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 hover:border-indigo-500/50 px-3 py-2 transition-all hover:bg-slate-700/80 rounded-full`}
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
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            {isPremium ? (
                                                <>
                                                    <Crown className="w-3 h-3 text-amber-400" />
                                                    <span className="text-amber-400">{t('subscription.premium')}</span>
                                                </>
                                            ) : (
                                                t('labels.player')
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="py-1" role="menu" aria-label="Actions utilisateur">
                                {/* Premium upgrade button - only show if not premium and user is authenticated */}
                                {user && !isPremium && !isSubscriptionLoading && (
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={isUpgrading}
                                        role="menuitem"
                                        className="w-full px-4 py-2 text-left text-sm bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Crown className="w-4 h-4" aria-hidden="true" />
                                        {isUpgrading ? t('pwa.upgrading') : `${t('pwa.upgrade')} — 4,99 €/${t('subscription.perMonth')}`}
                                    </button>
                                )}
                                <button
                                    onClick={handleEditProfile}
                                    role="menuitem"
                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Settings className="w-4 h-4" aria-hidden="true" />
                                    {t('pwa.editProfile')}
                                </button>
                                {/* Language selector */}
                                <div>
                                    <button
                                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                        role="menuitem"
                                        className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <Globe className="w-4 h-4" aria-hidden="true" />
                                        <span className="flex-1">{t('pwa.language')}</span>
                                        <span className="text-lg">{currentLanguage.flag}</span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {showLanguageMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="overflow-hidden bg-slate-900/50"
                                            >
                                                {SUPPORTED_LANGUAGES.map((language) => (
                                                    <button
                                                        key={language.code}
                                                        onClick={() => handleLanguageChange(language.code)}
                                                        className={`w-full px-4 pl-8 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                                                            language.code === currentLanguage.code
                                                                ? 'bg-indigo-500/20 text-indigo-300'
                                                                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                                        }`}
                                                    >
                                                        <span className="text-lg">{language.flag}</span>
                                                        <span className="flex-1">{language.nativeName}</span>
                                                        {language.code === currentLanguage.code && (
                                                            <Check className="w-4 h-4 text-indigo-400" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* Sound toggle */}
                                <button
                                    onClick={toggleSound}
                                    role="menuitem"
                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    {soundEnabled ? (
                                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                                    ) : (
                                        <VolumeX className="w-4 h-4" aria-hidden="true" />
                                    )}
                                    <span className="flex-1">{t('pwa.sound')}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/50 text-slate-400'}`}>
                                        {soundEnabled ? t('pwa.soundOn') : t('pwa.soundOff')}
                                    </span>
                                </button>
                                {roomCode && (
                                    <button
                                        onClick={handleLeaveGame}
                                        role="menuitem"
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" aria-hidden="true" />
                                        {t('pwa.leaveGame')}
                                    </button>
                                )}
                                <button
                                    onClick={handleLogout}
                                    role="menuitem"
                                    className="w-full px-4 py-2 text-left text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Power className="w-4 h-4" aria-hidden="true" />
                                    {t('pwa.logout')}
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
