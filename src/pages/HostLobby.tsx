import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, type Avatar } from '../services/gameService';
import {
    Flame, Cookie, IceCream, Pizza, Circle, Fish, Sandwich, Utensils,
    ChefHat, Lock
} from 'lucide-react';

const AVATARS: Avatar[] = ['donut', 'pizza', 'taco', 'sushi', 'chili', 'cookie', 'icecream', 'fries'];

import { safeStorage } from '../utils/storage';

export default function HostLobby() {
    const navigate = useNavigate();
    const [hostName, setHostName] = useState('');
    const [hostAvatar, setHostAvatar] = useState<Avatar>('chili');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const storedName = safeStorage.getItem('spicy_host_name');
        if (storedName) setHostName(storedName);

        const storedAvatar = safeStorage.getItem('spicy_host_avatar') as Avatar;
        // Validate stored avatar against the Avatar type list
        if (storedAvatar && AVATARS.includes(storedAvatar)) {
            setHostAvatar(storedAvatar);
        }
    }, []);

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostName.trim()) return;
        setIsCreating(true);
        try {
            const result = await createRoom(hostName, hostAvatar);
            if (result) {
                // Save host info
                safeStorage.setItem('spicy_player_id', result.playerId); // Fix: use result.playerId not result.hostId (createRoom returns playerId which IS the hostId)
                safeStorage.setItem('spicy_host_name', hostName);
                safeStorage.setItem('spicy_host_avatar', hostAvatar);
                safeStorage.setItem('spicy_room_code', result.code);

                navigate(`/room/${result.code}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to create room');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
                <div className="text-center mb-8">
                    <h2 className="text-red-500 font-bold uppercase tracking-widest text-sm mb-2 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> Host Access
                    </h2>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
                        Open Kitchen <ChefHat className="w-10 h-10 text-red-500" />
                    </h1>
                </div>

                <form onSubmit={handleCreateRoom} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">CHEF NAME</label>
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
                        <label className="block text-gray-300 font-bold mb-2 ml-1 text-sm">SELECT AVATAR</label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATARS.map(av => {
                                const Icon = getAvatarIcon(av);
                                return (
                                    <button
                                        key={av}
                                        type="button"
                                        onClick={() => setHostAvatar(av)}
                                        className={`
                                            text-3xl p-3 rounded-xl transition-all duration-200 aspect-square flex items-center justify-center
                                            ${hostAvatar === av
                                                ? 'bg-gradient-to-br from-spicy-500 to-sweet-500 scale-110 shadow-lg shadow-spicy-500/30'
                                                : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-8 h-8 ${hostAvatar === av ? 'text-white' : 'text-gray-400'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isCreating || !hostName}
                        className="w-full bg-gradient-to-r from-spicy-600 to-spicy-500 hover:from-spicy-500 hover:to-spicy-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-spicy-900/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all text-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(to right, #dc2626, #ef4444)' }} // Fallback Spicy Gradient
                    >
                        {isCreating ? 'Starting...' : <>Let's Cook! <Flame className="w-6 h-6 fill-current" /></>}
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
    return map[avatar] || Circle;
}
