import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { subscribeToRoom, type Room } from '../services/gameService';

export default function GameRoom() {
    const { id: roomId } = useParams();
    const [room, setRoom] = useState<Room | null>(null);

    useEffect(() => {
        if (roomId) {
            const unsubscribe = subscribeToRoom(roomId, (data) => {
                setRoom(data);
            });
            return () => unsubscribe();
        }
    }, [roomId]);

    if (!room) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-pulse">Connecting to Kitchen...</div>
            </div>
        )
    }

    // Waiting Room View
    if (room.state.status === 'lobby') {
        return (
            <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center text-white text-center">
                <h2 className="text-2xl font-bold mb-8">Waiting for Host...</h2>
                <div className="bg-white/10 p-8 rounded-full h-48 w-48 flex items-center justify-center mb-8 animate-bounce-slow">
                    <div className="text-6xl">👨‍🍳</div>
                </div>
                <p className="text-gray-400">You are in room</p>
                <p className="text-4xl font-black tracking-widest mt-2">{room.code}</p>
            </div>
        );
    }

    // Placeholder for Game Phases
    return (
        <div className="min-h-screen bg-slate-900 p-4 text-white">
            <h1 className="text-center font-bold text-xl">GAME IN PROGRESS</h1>
            <p className="text-center text-gray-400 mt-4">Phase: {room.state.status}</p>

            {/* Dynamic Content based on phase would go here */}
            <div className="mt-20 flex justify-center">
                <div className="w-full h-64 bg-slate-800 rounded-3xl flex items-center justify-center border-4 border-slate-700">
                    <span className="text-slate-500 font-bold">GAME CONTENT AREA</span>
                </div>
            </div>
        </div>
    );
}
