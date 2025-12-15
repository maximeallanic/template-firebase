import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, subscribeToRoom, updatePlayerTeam, setGameStatus, type Room, type Player } from '../services/gameService';

export default function HostLobby() {
    const navigate = useNavigate();
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const { code } = await createRoom("Chef"); // Host is always named Chef for now
            setRoomCode(code);
        } catch (error) {
            console.error("Failed to create room:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (roomCode) {
            const unsubscribe = subscribeToRoom(roomCode, (data) => {
                setRoomData(data);
            });
            return () => unsubscribe();
        }
    }, [roomCode]);

    const handleStartGame = async () => {
        if (roomCode) {
            await setGameStatus(roomCode, 'phase1');
            navigate(`/room/${roomCode}`); // Or specific host view if different
        }
    };

    if (!roomCode) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                        The Kitchen
                    </h1>
                    <p className="text-gray-600">Open your kitchen and invite players!</p>

                    <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-xl disabled:opacity-50"
                    >
                        {loading ? 'Opening...' : 'Open Kitchen'}
                    </button>
                </div>
            </div>
        );
    }

    const players = roomData ? Object.values(roomData.players) : [];
    const spicyTeam = players.filter(p => p.team === 'spicy');
    const sweetTeam = players.filter(p => p.team === 'sweet');
    const unassigned = players.filter(p => !p.team && !p.isHost);

    return (
        <div className="min-h-screen bg-slate-900 p-8 text-white">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-2xl font-bold text-gray-400">HOST MODE</h1>
                <div className="text-center">
                    <span className="block text-sm text-gray-400 uppercase tracking-widest">Room Code</span>
                    <span className="text-6xl font-black tracking-widest bg-white text-slate-900 px-6 py-2 rounded-xl">
                        {roomCode}
                    </span>
                </div>
                <button className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition">
                    Settings
                </button>
            </header>

            <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto h-[60vh]">
                {/* Spicy Team Zone */}
                <div className="bg-red-900/30 border-2 border-red-500/30 rounded-3xl p-6 relative">
                    <h2 className="text-center text-3xl font-bold text-red-500 mb-6">SPICY TEAM</h2>
                    <div className="space-y-4">
                        {spicyTeam.map(player => (
                            <PlayerCard key={player.id} player={player} />
                        ))}
                    </div>
                </div>

                {/* Unassigned / Center */}
                <div className="flex flex-col items-center justify-center space-y-4">
                    <h3 className="text-xl text-gray-400 mb-4">{unassigned.length} players joining...</h3>
                    <div className="w-full space-y-3">
                        {unassigned.map(player => (
                            <div key={player.id} className="bg-white text-slate-900 p-3 rounded-xl font-bold flex items-center justify-between shadow-lg animate-bounce-in">
                                <span className="mr-2 text-2xl">{getAvatarEmoji(player.avatar)}</span>
                                <span>{player.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => updatePlayerTeam(roomCode, player.id, 'spicy')} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition">🌶️</button>
                                    <button onClick={() => updatePlayerTeam(roomCode, player.id, 'sweet')} className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center hover:bg-pink-600 transition">🍬</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sweet Team Zone */}
                <div className="bg-pink-900/30 border-2 border-pink-500/30 rounded-3xl p-6 relative">
                    <h2 className="text-center text-3xl font-bold text-pink-400 mb-6">SWEET TEAM</h2>
                    <div className="space-y-4">
                        {sweetTeam.map(player => (
                            <PlayerCard key={player.id} player={player} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-8 left-0 right-0 flex justify-center">
                <button
                    onClick={handleStartGame}
                    disabled={players.length < 2} // Need at least 2 players (including host if host plays, but let's say 1 other for now)
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-2xl font-black py-4 px-12 rounded-full shadow-2xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    START SERVICE 🔔
                </button>
            </div>
        </div>
    );
}

function PlayerCard({ player }: { player: Player }) {
    return (
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl flex items-center space-x-3 border border-white/5">
            <span className="text-2xl">{getAvatarEmoji(player.avatar)}</span>
            <span className="font-bold">{player.name}</span>
        </div>
    )
}

function getAvatarEmoji(avatar: string) {
    const map: Record<string, string> = {
        donut: '🍩', pizza: '🍕', taco: '🌮', sushi: '🍣',
        chili: '🌶️', cookie: '🍪', icecream: '🍦', fries: '🍟'
    };
    return map[avatar] || '👤';
}
