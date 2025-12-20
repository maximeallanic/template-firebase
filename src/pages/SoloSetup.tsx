/**
 * Solo Setup Page
 * Entry point for solo mode - player configures their name/avatar before starting
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AVATAR_LIST, type Avatar } from '../types/gameTypes';
import { Play, Trophy, Zap } from 'lucide-react';
import { AvatarIcon } from '../components/AvatarIcon';
import { UserBar } from '../components/auth/UserBar';
import { Logo } from '../components/ui/Logo';
import { useAuthUser } from '../hooks/useAuthUser';
import { SOLO_MAX_SCORE, SOLO_PHASE_NAMES } from '../types/soloTypes';

export default function SoloSetup() {
    const { t } = useTranslation(['lobby', 'common', 'game-ui']);
    const navigate = useNavigate();
    const { profile, loading: profileLoading, user } = useAuthUser();
    const [playerName, setPlayerName] = useState('');
    const [playerAvatar, setPlayerAvatar] = useState<Avatar>('chili');

    // Pre-fill with profile data if available
    useEffect(() => {
        if (profileLoading) return;
        if (profile?.profileName) {
            setPlayerName(profile.profileName);
        }
        if (profile?.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)) {
            setPlayerAvatar(profile.profileAvatar);
        }
    }, [profile, profileLoading]);

    const handleStartGame = () => {
        if (!playerName.trim()) return;
        // Navigate to solo game with player info as state
        navigate('/solo/game', {
            state: {
                playerId: user?.uid || `solo_${Date.now()}`,
                playerName: playerName.trim(),
                playerAvatar,
            },
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
                    <h2 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" /> Mode Solo
                    </h2>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        Arcade Challenge
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Score max: {SOLO_MAX_SCORE} points
                    </p>
                </div>

                {/* Phase Info Cards */}
                <div className="mb-6 space-y-2">
                    {Object.entries(SOLO_PHASE_NAMES).map(([key, info]) => (
                        <div
                            key={key}
                            className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between"
                        >
                            <div>
                                <span className="font-bold text-white">{info.name}</span>
                                <span className="text-gray-400 text-sm ml-2">{info.subtitle}</span>
                            </div>
                            <span className="text-orange-400 font-mono text-sm">
                                +{info.maxScore} pts
                            </span>
                        </div>
                    ))}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleStartGame(); }} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">
                            {t('create.chefName')}
                        </label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-slate-950/50 border-2 border-slate-700/50 rounded-xl p-4 text-xl font-bold text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-600"
                            placeholder={t('create.chefNamePlaceholder')}
                            maxLength={12}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">
                            {t('create.chooseAvatar')}
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {AVATAR_LIST.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setPlayerAvatar(av)}
                                    className={`
                                        aspect-square rounded-xl p-1 flex items-center justify-center transition-all duration-300
                                        ${playerAvatar === av
                                            ? 'bg-gradient-to-br from-orange-500 to-red-500 scale-110 shadow-lg shadow-orange-500/30'
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
                        disabled={!playerName.trim()}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        Lancer la partie
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/leaderboard')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Trophy className="w-5 h-5" />
                        Voir le classement
                    </button>
                </form>
            </div>
        </div>
    );
}
