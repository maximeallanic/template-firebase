import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createRoom, joinRoom, type Avatar, AVATAR_LIST } from '../services/gameService';
import { Flame, ChefHat, Lock, Users } from 'lucide-react';
import { AvatarIcon } from '../components/AvatarIcon';
import { safeStorage } from '../utils/storage';
import { saveProfile } from '../services/profileService';
import { useAuthUser } from '../hooks/useAuthUser';
import { useHaptic } from '../hooks/useHaptic';

export default function HostLobby() {
    const { t } = useTranslation(['lobby', 'common']);
    const navigate = useNavigate();
    const { profile, loading: profileLoading } = useAuthUser();
    const haptic = useHaptic();
    const [hostName, setHostName] = useState('');
    const [hostAvatar, setHostAvatar] = useState<Avatar>('chili');
    const [isCreating, setIsCreating] = useState(false);
    const [pendingCode, setPendingCode] = useState<string | null>(null);
    const hasAutoCreated = useRef(false);

    // Check for pending join code on mount
    useEffect(() => {
        const code = sessionStorage.getItem('spicy_pending_join_code');
        if (code) {
            setPendingCode(code);
        }
    }, []);

    // Auto-join pending room OR auto-create room if user has stored profile
    useEffect(() => {
        // Wait for profile to be loaded from Firestore
        if (profileLoading) return;

        // Check for pending join code (from redirect after login)
        const pendingJoinCode = sessionStorage.getItem('spicy_pending_join_code');

        // If there's a pending join code and user has profile, join that room
        if (pendingJoinCode && profile?.profileName && !hasAutoCreated.current) {
            hasAutoCreated.current = true;
            sessionStorage.removeItem('spicy_pending_join_code'); // Clear pending code

            const validAvatar = profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
                ? profile.profileAvatar
                : 'burger';

            // Join the pending room
            joinRoom(pendingJoinCode, profile.profileName, validAvatar).then(async result => {
                if (result) {
                    safeStorage.setItem('spicy_player_id', result.playerId);
                    safeStorage.setItem('spicy_room_code', pendingJoinCode);
                    // Save profile to Firestore (in case it's not already there)
                    await saveProfile(profile.profileName, validAvatar);
                    navigate(`/room/${pendingJoinCode}`, { replace: true });
                }
            }).catch(err => {
                console.error('Auto-join failed:', err);
                hasAutoCreated.current = false;
                // Fall back to showing the form
                setHostName(profile.profileName);
                if (profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)) {
                    setHostAvatar(profile.profileAvatar);
                }
            });
            return;
        }

        // No pending join code - auto-create room if user has profile
        if (profile?.profileName && !hasAutoCreated.current) {
            hasAutoCreated.current = true;
            const validAvatar = profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
                ? profile.profileAvatar
                : 'chili';

            // Auto-create room with stored profile
            createRoom(profile.profileName, validAvatar).then(async result => {
                if (result) {
                    safeStorage.setItem('spicy_player_id', result.playerId);
                    safeStorage.setItem('spicy_room_code', result.code);
                    // Save profile to Firestore (in case it's not already there)
                    await saveProfile(profile.profileName, validAvatar);
                    // Replace history to fix back button (Home -> Room, not Home -> Host -> Room)
                    navigate(`/room/${result.code}`, { replace: true });
                }
            }).catch(err => {
                console.error('Auto-create failed:', err);
                hasAutoCreated.current = false;
                // Fall back to showing the form
                setHostName(profile.profileName);
                if (profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)) {
                    setHostAvatar(profile.profileAvatar);
                }
            });
        } else if (profile?.profileName) {
            setHostName(profile.profileName);
            if (profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)) {
                setHostAvatar(profile.profileAvatar);
            }
        }
    }, [profile, profileLoading, navigate]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostName.trim()) return;
        haptic.tap();
        setIsCreating(true);

        // Check for pending join code - if exists, join instead of create
        const pendingJoinCode = sessionStorage.getItem('spicy_pending_join_code');

        try {
            if (pendingJoinCode) {
                // Join pending room instead of creating
                sessionStorage.removeItem('spicy_pending_join_code');
                const result = await joinRoom(pendingJoinCode, hostName, hostAvatar);
                if (result) {
                    safeStorage.setItem('spicy_player_id', result.playerId);
                    safeStorage.setItem('spicy_room_code', pendingJoinCode);
                    // Save profile to Firestore
                    await saveProfile(hostName, hostAvatar);
                    navigate(`/room/${pendingJoinCode}`, { replace: true });
                    return;
                }
                // If join failed, fall through to create
            }

            // Create new room
            const result = await createRoom(hostName, hostAvatar);
            if (result) {
                // Save host info
                safeStorage.setItem('spicy_player_id', result.playerId);
                safeStorage.setItem('spicy_room_code', result.code);
                // Save profile to Firestore
                await saveProfile(hostName, hostAvatar);

                // Replace history to fix back button
                navigate(`/room/${result.code}`, { replace: true });
            }
        } catch (err) {
            console.error(err);
            alert(pendingJoinCode ? t('common:errors.roomNotFound') : t('common:errors.createFailed'));
        } finally {
            setIsCreating(false);
        }
    };

    // Auto-creating happens in useEffect - no loader needed, direct redirect

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background is now handled by SharedBackground in App.tsx */}

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    {pendingCode ? (
                        <>
                            <h2 className="text-pink-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                                <Users className="w-4 h-4" /> {t('create.joinGame')}
                            </h2>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                {t('create.createProfile')}
                            </h1>
                            <p className="text-gray-400 text-sm mt-2">{t('room.code')}: <span className="font-mono font-bold text-white">{pendingCode}</span></p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4" /> {t('create.hostAccess')}
                            </h2>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
                                {t('create.title')} <ChefHat className="w-8 h-8 text-red-500" />
                            </h1>
                        </>
                    )}
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">{t('create.chefName')}</label>
                        <input
                            type="text"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            className="w-full bg-slate-950/50 border-2 border-slate-700/50 rounded-xl p-4 text-xl font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-600"
                            placeholder={t('create.chefNamePlaceholder')}
                            maxLength={12}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">{t('create.chooseAvatar')}</label>
                        <div className="grid grid-cols-5 gap-2">
                            {AVATAR_LIST.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => { haptic.tap(); setHostAvatar(av as Avatar); }}
                                    className={`
                                        aspect-square rounded-xl p-1 flex items-center justify-center transition-all duration-300
                                        ${hostAvatar === av
                                            ? 'bg-gradient-to-br from-red-500 to-pink-500 scale-110 shadow-lg shadow-pink-500/30'
                                            : 'bg-slate-800 hover:bg-slate-700'
                                        }
                                    `}
                                >
                                    <AvatarIcon avatar={av} size={36} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isCreating || !hostName}
                        className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 ${
                            pendingCode
                                ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-900/50'
                                : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-900/50'
                        }`}
                    >
                        {isCreating
                            ? (pendingCode ? t('create.connecting') : t('create.creating'))
                            : pendingCode
                                ? <>{t('create.joinButton')} <Users className="w-6 h-6" /></>
                                : <>{t('create.createButton')} <Flame className="w-6 h-6 fill-current" /></>
                        }
                    </button>
                </form>
            </div>

        </div>
    );
}
