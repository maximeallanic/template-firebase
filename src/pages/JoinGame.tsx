import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom, type Avatar } from '../services/gameService';

const AVATARS: Avatar[] = ['donut', 'pizza', 'taco', 'sushi', 'chili', 'cookie', 'icecream', 'fries'];

export default function JoinGame() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar>('donut');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name) return;

        setLoading(true);
        setError(null);

        try {
            await joinRoom(code, name, selectedAvatar);
            // Save info locally if needed for reconnect
            navigate(`/room/${code.toUpperCase()}`);
        } catch (err: any) {
            console.error(err);
            setError("Could not join room. Check the code!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-indigo-950 flex flex-col items-center p-6 text-white overflow-y-auto">
            <div className="w-full max-w-md space-y-8 mt-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter">
                        <span className="text-red-500">SPICY</span>
                        <span className="text-white mx-2">VS</span>
                        <span className="text-pink-400">SWEET</span>
                    </h1>
                    <p className="text-indigo-200">Join the chaos!</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Room Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="W4ZY"
                            maxLength={4}
                            className="w-full bg-white/10 border-2 border-indigo-500/50 rounded-2xl p-4 text-center text-3xl font-black tracking-[0.5em] focus:border-pink-500 focus:outline-none transition-colors placeholder:tracking-normal placeholder:font-normal uppercase"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Chef Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Gordon Ramsay"
                            maxLength={12}
                            className="w-full bg-white/10 border-2 border-indigo-500/50 rounded-2xl p-4 text-xl font-bold focus:border-pink-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-indigo-300 mb-4 uppercase tracking-wide">Choose Avatar</label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATARS.map(avatar => (
                                <button
                                    key={avatar}
                                    type="button"
                                    onClick={() => setSelectedAvatar(avatar)}
                                    className={`aspect-square rounded-xl text-3xl flex items-center justify-center transition-all ${selectedAvatar === avatar ? 'bg-white scale-110 shadow-lg ring-4 ring-pink-500' : 'bg-white/5 hover:bg-white/20'}`}
                                >
                                    {getAvatarEmoji(avatar)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 text-red-200 p-4 rounded-xl text-center font-bold animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !code || !name}
                        className="w-full bg-gradient-to-r from-pink-500 to-red-500 py-5 rounded-2xl font-black text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'JOINING...' : 'ENTER KITCHEN'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function getAvatarEmoji(avatar: string) {
    const map: Record<string, string> = {
        donut: '🍩', pizza: '🍕', taco: '🌮', sushi: '🍣',
        chili: '🌶️', cookie: '🍪', icecream: '🍦', fries: '🍟'
    };
    return map[avatar] || '👤';
}
