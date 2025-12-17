import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom, type Avatar, AVATAR_LIST } from '../services/gameService';
import { Flame, ChefHat, Lock, Users } from 'lucide-react';
import { AvatarIcon } from '../components/AvatarIcon';
import { UserBar } from '../components/UserBar';
import { Logo } from '../components/Logo';
import { safeStorage } from '../utils/storage';
import { getLocalProfile, saveProfile } from '../services/profileService';

export default function HostLobby() {
    const navigate = useNavigate();
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
        // Check for pending join code (from redirect after login)
        const pendingJoinCode = sessionStorage.getItem('spicy_pending_join_code');

        // Get profile from localStorage (cached from Firestore)
        const localProfile = getLocalProfile();

        // If there's a pending join code and user has profile, join that room
        if (pendingJoinCode && localProfile?.profileName && !hasAutoCreated.current) {
            hasAutoCreated.current = true;
            sessionStorage.removeItem('spicy_pending_join_code'); // Clear pending code

            const validAvatar = localProfile.profileAvatar && (AVATAR_LIST as string[]).includes(localProfile.profileAvatar)
                ? localProfile.profileAvatar
                : 'burger';

            // Join the pending room
            joinRoom(pendingJoinCode, localProfile.profileName, validAvatar).then(async result => {
                if (result) {
                    safeStorage.setItem('spicy_player_id', result.playerId);
                    safeStorage.setItem('spicy_room_code', pendingJoinCode);
                    // Save profile to Firestore (in case it's not already there)
                    await saveProfile(localProfile.profileName, validAvatar);
                    navigate(`/room/${pendingJoinCode}`, { replace: true });
                }
            }).catch(err => {
                console.error('Auto-join failed:', err);
                hasAutoCreated.current = false;
                // Fall back to showing the form
                setHostName(localProfile.profileName);
                if (localProfile.profileAvatar && (AVATAR_LIST as string[]).includes(localProfile.profileAvatar)) {
                    setHostAvatar(localProfile.profileAvatar);
                }
            });
            return;
        }

        // No pending join code - auto-create room if user has profile
        if (localProfile?.profileName && !hasAutoCreated.current) {
            hasAutoCreated.current = true;
            const validAvatar = localProfile.profileAvatar && (AVATAR_LIST as string[]).includes(localProfile.profileAvatar)
                ? localProfile.profileAvatar
                : 'chili';

            // Auto-create room with stored profile
            createRoom(localProfile.profileName, validAvatar).then(async result => {
                if (result) {
                    safeStorage.setItem('spicy_player_id', result.playerId);
                    safeStorage.setItem('spicy_room_code', result.code);
                    // Save profile to Firestore (in case it's not already there)
                    await saveProfile(localProfile.profileName, validAvatar);
                    // Replace history to fix back button (Home -> Room, not Home -> Host -> Room)
                    navigate(`/room/${result.code}`, { replace: true });
                }
            }).catch(err => {
                console.error('Auto-create failed:', err);
                hasAutoCreated.current = false;
                // Fall back to showing the form
                setHostName(localProfile.profileName);
                if (localProfile.profileAvatar && (AVATAR_LIST as string[]).includes(localProfile.profileAvatar)) {
                    setHostAvatar(localProfile.profileAvatar);
                }
            });
        } else if (localProfile?.profileName) {
            setHostName(localProfile.profileName);
            if (localProfile.profileAvatar && (AVATAR_LIST as string[]).includes(localProfile.profileAvatar)) {
                setHostAvatar(localProfile.profileAvatar);
            }
        }
    }, [navigate]);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostName.trim()) return;
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
            alert(pendingJoinCode ? 'Room introuvable' : 'Échec de la création de la room');
        } finally {
            setIsCreating(false);
        }
    };

    // Auto-creating happens in useEffect - no loader needed, direct redirect

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background is now handled by SharedBackground in App.tsx */}

            {/* UserBar */}
            <div className="fixed top-4 right-0 z-50">
                <UserBar attachedToEdge />
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    {/* Logo */}
                    <div className="mb-6">
                        <Logo className="h-16 md:h-20 mx-auto" />
                    </div>
                    {pendingCode ? (
                        <>
                            <h2 className="text-pink-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                                <Users className="w-4 h-4" /> Rejoindre la partie
                            </h2>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                Créer ton profil
                            </h1>
                            <p className="text-gray-400 text-sm mt-2">Code: <span className="font-mono font-bold text-white">{pendingCode}</span></p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                                <Lock className="w-4 h-4" /> Accès Hôte
                            </h2>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
                                Ouvrir la Cuisine <ChefHat className="w-8 h-8 text-red-500" />
                            </h1>
                        </>
                    )}
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">NOM DU CHEF</label>
                        <input
                            type="text"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            className="w-full bg-slate-950/50 border-2 border-slate-700/50 rounded-xl p-4 text-xl font-bold text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-gray-600"
                            placeholder="Gordon R."
                            maxLength={12}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">CHOISIR UN AVATAR</label>
                        <div className="grid grid-cols-5 gap-2">
                            {AVATAR_LIST.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setHostAvatar(av as Avatar)}
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
                            ? (pendingCode ? 'Connexion...' : 'Création...')
                            : pendingCode
                                ? <>Rejoindre la partie <Users className="w-6 h-6" /></>
                                : <>À vos fourneaux ! <Flame className="w-6 h-6 fill-current" /></>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
