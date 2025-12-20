/**
 * Solo Setup Page
 * Entry point for solo mode - player sees their profile and starts the game
 */

import { useNavigate } from 'react-router-dom';
import { AVATAR_LIST, type Avatar } from '../types/gameTypes';
import { Play, Trophy, Zap, AlertCircle } from 'lucide-react';
import { AvatarIcon } from '../components/AvatarIcon';
import { UserBar } from '../components/auth/UserBar';
import { Logo } from '../components/ui/Logo';
import { useAuthUser } from '../hooks/useAuthUser';
import { SOLO_MAX_SCORE, SOLO_PHASE_NAMES } from '../types/soloTypes';

export default function SoloSetup() {
    const navigate = useNavigate();
    const { profile, loading: profileLoading, user } = useAuthUser();

    // Check if profile is complete
    const profileComplete = !!(
        profile?.profileName &&
        profile?.profileAvatar &&
        (AVATAR_LIST as string[]).includes(profile.profileAvatar)
    );

    const handleStartGame = () => {
        if (!profileComplete) return;
        // Navigate to solo game with player info from profile
        navigate('/solo/game', {
            state: {
                playerId: user?.uid || `solo_${Date.now()}`,
                playerName: profile!.profileName,
                playerAvatar: profile!.profileAvatar as Avatar,
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

                <div className="space-y-6">
                    {/* Profile incomplete warning */}
                    {!profileLoading && !profileComplete && (
                        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                <p className="text-amber-200 text-sm">
                                    Configure ton profil pour jouer en solo ! Clique sur ton avatar en haut à droite.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Profile preview */}
                    {profileComplete && (
                        <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4">
                            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-2">
                                <AvatarIcon avatar={profile!.profileAvatar as Avatar} size={48} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">{profile!.profileName}</p>
                                <p className="text-gray-400 text-sm">Prêt à jouer</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleStartGame}
                        disabled={!profileComplete || profileLoading}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                </div>
            </div>
        </div>
    );
}
