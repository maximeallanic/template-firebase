import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { joinRoom, type Avatar } from '../services/gameService';
import {
    Flame, Cookie, IceCream, Pizza, Circle, Fish, Sandwich, Utensils,
    ChefHat, ArrowRight, User
} from 'lucide-react';

const AVATARS: Avatar[] = ['donut', 'pizza', 'taco', 'sushi', 'chili', 'cookie', 'icecream', 'fries'];

import { safeStorage } from '../utils/storage';

export default function JoinGame() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState(searchParams.get('code') || '');
    const [playerName, setPlayerName] = useState('');
    const [avatar, setAvatar] = useState<Avatar>('donut'); // Keep original initial avatar for now, will adjust if needed
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedName = safeStorage.getItem('spicy_player_name');
        if (storedName) setPlayerName(storedName);

        const storedAvatar = safeStorage.getItem('spicy_player_avatar') as Avatar;
        if (storedAvatar && AVATARS.includes(storedAvatar)) { // Keep original AVATARS check
            setAvatar(storedAvatar);
        }
    }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode || !playerName) return;

        setError(null);
        setIsJoining(true);

        try {
            const result = await joinRoom(joinCode, playerName, avatar);
            if (!result) throw new Error("Join failed");

            const { playerId } = result;

            // Check for Debug Mode
            const isDebug = searchParams.get('debug') === 'true';

            if (!isDebug) {
                // Normal User: Persist Identity
                safeStorage.setItem('spicy_player_id', playerId);
                safeStorage.setItem('spicy_player_name', playerName);
                safeStorage.setItem('spicy_player_avatar', avatar);
                safeStorage.setItem('spicy_room_code', joinCode);
                navigate(`/room/${joinCode.toUpperCase()}`);
            } else {
                // Debug / E2E: Do NOT persist (prevents overwriting Host ID in same browser)
                // Pass identity via URL
                navigate(`/room/${joinCode.toUpperCase()}?debugPlayerId=${playerId}`);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Could not join room. Check the code!");
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center p-6 text-white overflow-y-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 pointer-events-none" />

            <div className="md:w-full md:max-w-md w-full space-y-8 mt-10 z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter flex items-center justify-center gap-2">
                        <span className="text-red-500 drop-shadow-lg">SPICY</span>
                        <ChefHat className="w-8 h-8 text-white/20" />
                        <span className="text-pink-400 drop-shadow-lg">SWEET</span>
                    </h1>
                    <p className="text-indigo-200 font-medium">Enter the kitchen!</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6 bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div>
                        <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Room Code</label>
                        <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="W4ZY"
                            maxLength={4}
                            className="w-full bg-slate-950/60 border-2 border-indigo-500/30 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.5em] focus:border-red-500 focus:outline-none transition-all placeholder:tracking-normal placeholder:font-normal uppercase text-white shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Chef Name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Gordon Ramsay"
                            maxLength={12}
                            className="w-full bg-slate-950/60 border-2 border-indigo-500/30 rounded-2xl p-4 text-xl font-bold focus:border-pink-500 focus:outline-none transition-all placeholder:text-slate-600 text-white shadow-inner"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-300 mb-4 uppercase tracking-wide">Choose Avatar</label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATARS.map(item => {
                                const Icon = getAvatarIcon(item);
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setAvatar(item)}
                                        className={`aspect-square rounded-xl p-2 flex items-center justify-center transition-all duration-300 ${avatar === item ? 'bg-gradient-to-br from-red-500 to-pink-500 scale-110 shadow-lg shadow-pink-500/30 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                                    >
                                        <Icon className="w-8 h-8" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 text-red-200 p-4 rounded-xl text-center font-bold animate-pulse text-sm border border-red-500/30">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isJoining || !joinCode || !playerName}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 py-5 rounded-2xl font-black text-xl shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 text-white"
                    >
                        {isJoining ? 'JOINING...' : <>ENTER KITCHEN <ArrowRight className="w-6 h-6" /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}

function getAvatarIcon(avatar: string) {
    const map: Record<string, any> = {
        donut: Circle, pizza: Pizza, taco: Sandwich, sushi: Fish,
        chili: Flame, cookie: Cookie, icecream: IceCream, fries: Utensils
    };
    return map[avatar] || User;
}
