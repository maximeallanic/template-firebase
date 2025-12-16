import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeToRoom, type Room, type Player, setGameStatus, updatePlayerTeam, markPlayerOnline } from '../services/gameService';
import { checkPhase1Exhaustion } from '../services/historyService';
import { Phase1Player } from '../components/Phase1Player';
import { Phase2Player } from '../components/Phase2Player';
import { Phase3Player } from '../components/Phase3Player';
import Phase4Player from '../components/Phase4Player';
import { Phase5Player } from '../components/Phase5Player';
import { AIGeneratorModal } from '../components/AIGeneratorModal';
import {
    Flame, Candy, Link, Eye, Clapperboard, Loader,
    User, Pizza, Circle, Cookie, IceCream, Fish, Sandwich, Utensils,
    Volume2, VolumeX
} from 'lucide-react';

import { safeStorage } from '../utils/storage';
import { audioService } from '../services/audioService';

export default function GameRoom() {
    // Fix: App.tsx defines route as /room/:id, so we must destructure 'id', not 'roomId'
    // We alias it to 'roomId' for consistency with the rest of this file.
    const { id: roomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [myId, setMyId] = useState<string | null>(null);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiAutoTrigger, setAiAutoTrigger] = useState(false);
    const hasCheckedExhaustion = useRef(false);
    const hasMarkedOnline = useRef(false);

    // Safe boolean check for host
    const isHost = !!(room?.hostId && myId && room.hostId === myId);

    // Debug / E2E Override
    const query = new URLSearchParams(window.location.search);
    const debugPlayerId = query.get('debugPlayerId');

    useEffect(() => {
        // Try to get player ID from storage or Debug Param
        const storedId = debugPlayerId || safeStorage.getItem('spicy_player_id');
        setMyId(storedId);

        if (roomId) {
            const unsubscribe = subscribeToRoom(roomId, (data) => {
                setRoom(data);

                // Deep Linking / Auth Logic
                if (data) {
                    const localId = debugPlayerId || safeStorage.getItem('spicy_player_id');
                    const isPlayerInRoom = localId && data.players && data.players[localId];

                    if (isPlayerInRoom) {
                        // Player is in the room - mark them as online (handles reconnection)
                        if (!hasMarkedOnline.current && localId) {
                            hasMarkedOnline.current = true;
                            markPlayerOnline(data.code, localId);
                        }
                    } else {
                        // User is NOT a recognized player

                        // Case A: Game is in Lobby -> Redirect to Join
                        if (data.state.status === 'lobby') {
                            setTimeout(() => {
                                const currentId = debugPlayerId || safeStorage.getItem('spicy_player_id');
                                if (!currentId || !data.players[currentId]) {
                                    // Navigate to join, preserving debug param if present
                                    const debugSuffix = debugPlayerId ? `&debugPlayerId=${debugPlayerId}` : '';
                                    navigate(`/join?code=${data.code}${debugSuffix}`);
                                }
                            }, 500);
                        }
                        // Case B: Game Started -> Stay as Spectator (Don't redirect, just don't set myId)
                        // User stays on this page, but 'myId' remains null.
                    }
                }
            });
            return () => unsubscribe();
        }
    }, [roomId, navigate, debugPlayerId]);

    // Auto-Generation Check (Smart Logic)
    useEffect(() => {
        const checkSmartGeneration = async () => {
            if (room && room.state.status === 'lobby' && isHost && !hasCheckedExhaustion.current && room.players) {
                hasCheckedExhaustion.current = true;
                // Only check if we are using default questions (no custom phase 1)
                if (!room.customQuestions?.phase1) {
                    const isExhausted = await checkPhase1Exhaustion(Object.values(room.players));
                    if (isExhausted) {
                        console.log("Static pool exhausted! Prompting AI generation.");
                        setAiAutoTrigger(true);
                        setIsAIModalOpen(true);
                        // Optional: Show a toast or alert? Modal opening is strong enough signal.
                    }
                }
            }
        };
        checkSmartGeneration();
    }, [room, isHost]);

    // Audio Effect: Player Joined & Ambience
    const prevPlayerCount = useRef(0);
    const prevStatus = useRef<string>('');

    useEffect(() => {
        if (!room) return;

        // 1. Join Sound
        const count = Object.keys(room.players || {}).length;
        if (count > prevPlayerCount.current && prevPlayerCount.current > 0) {
            audioService.playJoin();
        }
        prevPlayerCount.current = count;

        // 2. Ambient Loops & Transitions
        if (room.state.status !== prevStatus.current) {
            // Phase Transition Sound
            if (prevStatus.current) {
                audioService.playTransition();
            }

            // Ambience Logic
            if (room.state.status === 'lobby') {
                audioService.playAmbient('lobby');
            } else if (room.state.status === 'phase5') {
                // Phase 5 manages its own specific tension in the component, 
                // but we can set a base tension here or let component handle it.
                // Let's set a base tension for all game phases
                audioService.playAmbient('tension');
            } else {
                // Active Game Phases
                audioService.playAmbient('tension');
            }

            prevStatus.current = room.state.status;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.players, room?.state.status]);

    const [isMuted, setIsMuted] = useState(false);
    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        audioService.setEnabled(!newState);
    };

    if (!room) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-pulse text-2xl font-bold flex items-center gap-3">
                    <Loader className="w-8 h-8 animate-spin" /> Connecting to Kitchen...
                </div>
            </div>
        )
    }

    // ----- LOBBY PHASE -----
    if (room.state.status === 'lobby') {
        const players = Object.values(room.players);
        const spicyTeam = players.filter(p => p.team === 'spicy');
        const sweetTeam = players.filter(p => p.team === 'sweet');
        const unassigned = players.filter(p => !p.team);

        return (
            <div className="min-h-screen bg-brand-dark overflow-hidden flex flex-col md:flex-row relative">
                {/* GLOBAL MUTE BUTTON */}
                <button
                    onClick={toggleMute}
                    className="absolute top-4 right-4 z-[100] p-3 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-black/60 transition-all"
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>

                {/* Spicy Side (Left/Top) */}
                <div className="flex-1 bg-red-900/20 border-b-4 md:border-b-0 md:border-r-4 border-red-600/30 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                    {/* Decorative bg */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/0 via-red-600/5 to-red-500/10 pointer-events-none" />

                    <h2 className="text-3xl md:text-5xl font-black text-red-500 uppercase tracking-tighter mb-8 drop-shadow-xl z-0 opacity-80 flex items-center gap-3">
                        Team Spicy <Flame className="w-10 h-10 md:w-16 md:h-16" />
                    </h2>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md z-10">
                        {spicyTeam.map(p => <PlayerCard key={p.id} player={p} theme="spicy" />)}
                        {spicyTeam.length === 0 && <p className="col-span-2 text-center text-red-300/50 font-medium italic">Waiting for brave souls...</p>}
                    </div>
                </div>

                {/* Sweet Side (Right/Bottom) */}
                <div className="flex-1 bg-pink-900/20 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tl from-pink-900/0 via-pink-600/5 to-pink-500/10 pointer-events-none" />

                    <h2 className="text-3xl md:text-5xl font-black text-pink-500 uppercase tracking-tighter mb-8 drop-shadow-xl z-0 opacity-80 flex items-center gap-3">
                        Team Sweet <Candy className="w-10 h-10 md:w-16 md:h-16" />
                    </h2>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md z-10">
                        {sweetTeam.map(p => <PlayerCard key={p.id} player={p} theme="sweet" />)}
                        {sweetTeam.length === 0 && <p className="col-span-2 text-center text-sweet-300/50 font-medium italic">Waiting for sugar rush...</p>}
                    </div>
                </div>

                {/* Center / Unassigned Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto max-w-md w-full mx-4 flex flex-col items-center">
                        <header className="mb-6 text-center">
                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Room Code</span>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400" style={{ backgroundImage: 'linear-gradient(to right, #f87171, #f472b6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                                    {room.code}
                                </span>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.protocol}//${window.location.host}/join?code=${room.code}`;
                                        navigator.clipboard.writeText(url);
                                        // Optional: Visual feedback could be added here, but for now simple copy
                                        alert('Link copied to clipboard! 📋');
                                    }}
                                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                    title="Copy Join Link"
                                >
                                    <Link className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        {/* Unassigned List */}
                        <div className="w-full space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                            {unassigned.length > 0 ? (
                                unassigned.map(player => {
                                    const AvatarIcon = getAvatarIcon(player.avatar);
                                    return (
                                        <div key={player.id} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700 shadow-sm animate-fade-in">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl text-white"><AvatarIcon className="w-6 h-6" /></span>
                                                <span className="font-bold text-white max-w-[120px] truncate">{player.name}</span>
                                            </div>
                                            {isHost && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => updatePlayerTeam(room.code, player.id, 'spicy')} className="w-9 h-9 rounded-lg bg-spicy-600 text-white flex items-center justify-center hover:bg-spicy-500 transition-colors shadow-lg"><Flame className="w-4 h-4" /></button>
                                                    <button onClick={() => updatePlayerTeam(room.code, player.id, 'sweet')} className="w-9 h-9 rounded-lg bg-sweet-600 text-white flex items-center justify-center hover:bg-sweet-500 transition-colors shadow-lg"><Candy className="w-4 h-4" /></button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-gray-500 text-center text-sm py-4">All chefs assigned!</p>
                            )}
                        </div>

                        {/* Start Button & AI Controls */}
                        {isHost ? (
                            <div className="w-full space-y-3">


                                <button
                                    onClick={() => setGameStatus(room.code, 'phase1')}
                                    disabled={players.length < 2}
                                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-brand-darker text-xl font-black py-4 px-8 rounded-xl shadow-lg hover:shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    START THE SHOW <Clapperboard className="w-6 h-6" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center animate-pulse">
                                <p className="text-gray-400 font-medium">Waiting for host to start...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Spectator Overlay */}
                {!myId && room.state.status !== 'lobby' && (
                    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur text-white p-2 text-center z-50 flex items-center justify-center gap-2">
                        <span className="font-bold text-yellow-400 flex items-center gap-1"><Eye className="w-4 h-4" /> SPECTATOR MODE</span> - Game in progress.
                    </div>
                )}
            </div>
        );
    }

    // ----- PHASE 1: THE SNACKS (MCQ) -----
    if (room.state.status === 'phase1') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4">
                    {/* Unified View: Phase 1 */}
                    <Phase1Player
                        room={room}
                        playerId={myId || ''}
                        isHost={isHost}
                    />
                </div>
            </div>
        );
    }

    // ----- PHASE 2: THE ENTREE (BINARY) -----
    if (room.state.status === 'phase2') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4">
                    {/* Unified View: Phase 2 */}
                    <Phase2Player
                        roomId={roomId!}
                        playerId={myId || ''}
                        players={room.players}
                        setIndex={room.state.currentPhase2Set || 0}
                        itemIndex={room.state.currentPhase2Item || 0}
                        phaseState={room.state.phaseState || 'idle'}
                        phase2Answers={room.state.phase2Answers}
                        roundWinner={room.state.roundWinner}
                        isHost={!!isHost}
                        customQuestions={room.customQuestions}
                    />
                </div>
            </div>
        );
    }
    // ----- PHASE 3: THE MENUS -----
    if (room.state.status === 'phase3') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4">
                    <Phase3Player
                        room={room}
                        isHost={!!isHost}
                    />
                </div>
            </div>
        );
    }
    // ----- PHASE 4: L'ADDITION -----
    if (room.state.status === 'phase4') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4">
                    <Phase4Player
                        playerId={myId || ''}
                        room={room}
                        isHost={!!isHost}
                    />
                </div>
            </div>
        );
    }

    // ----- PHASE 5: BURGER DE LA MORT -----
    if (room.state.status === 'phase5') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4">
                    <Phase5Player
                        room={room}
                        isHost={!!isHost}
                    />
                </div>
            </div>
        );
    }

    // Default Fallback
    return (
        <>
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                Unknown Phase: {room.state.status}
            </div>
            {/* AI Modal */}
            {room && (
                <AIGeneratorModal
                    isOpen={isAIModalOpen}
                    onClose={() => {
                        setIsAIModalOpen(false);
                        setAiAutoTrigger(false);
                    }}
                    roomCode={room.code}
                    autoTrigger={aiAutoTrigger}
                />
            )}
        </>
    );
}

function PlayerCard({ player, theme }: { player: Player, theme: 'spicy' | 'sweet' }) {
    const borderColor = theme === 'spicy' ? 'border-spicy-500/50' : theme === 'sweet' ? 'border-sweet-500/50' : 'border-white/5';
    const bgColor = theme === 'spicy' ? 'bg-spicy-900/40' : theme === 'sweet' ? 'bg-sweet-900/40' : 'bg-white/10';
    const AvatarIcon = getAvatarIcon(player.avatar);

    return (
        <div className={`${bgColor} backdrop-blur-md p-3 rounded-xl flex items-center space-x-3 border ${borderColor} shadow-sm transition-all hover:scale-105`}>
            <span className="text-2xl filter drop-shadow-md text-white"><AvatarIcon className="w-8 h-8" /></span>
            <span className="font-bold text-white tracking-wide">{player.name}</span>
        </div>
    )
}

function getAvatarIcon(avatar: string) {
    const map: Record<string, React.ElementType> = {
        donut: Circle, // Fallback
        pizza: Pizza,
        taco: Sandwich, // Fallback
        sushi: Fish, // Fallback
        chili: Flame,
        cookie: Cookie,
        icecream: IceCream,
        fries: Utensils // Fallback
    };
    return map[avatar] || User;
}
