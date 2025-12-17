import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeToRoom, type Room, type Player, type Avatar, setGameStatus, updatePlayerTeam, markPlayerOnline, overwriteGameQuestions } from '../services/gameService';
import { generateWithRetry } from '../services/aiClient';
import { checkPhase1Exhaustion } from '../services/historyService';
import { getRandomQuestionSet } from '../services/questionStorageService';
import { ref, get, child } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { Phase1Player } from '../components/Phase1Player';
import { Phase2Player } from '../components/Phase2Player';
import { Phase3Player } from '../components/Phase3Player';
import Phase4Player from '../components/Phase4Player';
import { Phase5Player } from '../components/Phase5Player';
import { GenerationLoadingCard } from '../components/GenerationLoadingCard';
import { motion, AnimatePresence } from 'framer-motion';
import { durations, organicEase } from '../animations';
import { UserBar } from '../components/UserBar';
import { PhaseTransition } from '../components/PhaseTransition';
import { GameHeader } from '../components/GameHeader';
import { DebugPanel } from '../components/DebugPanel';
import {
    Flame, Candy, Link, Eye, Clapperboard, Loader, Check
} from 'lucide-react';
import { AvatarIcon } from '../components/AvatarIcon';

import { safeStorage } from '../utils/storage';
import { audioService } from '../services/audioService';

type GameStatus = 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';

export default function GameRoom() {
    // Fix: App.tsx defines route as /room/:id, so we must destructure 'id', not 'roomId'
    // We alias it to 'roomId' for consistency with the rest of this file.
    const { id: roomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [myId, setMyId] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [showTransition, setShowTransition] = useState(false);
    const [transitionPhase, setTransitionPhase] = useState<GameStatus>('lobby');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isGeneratingPhase2, setIsGeneratingPhase2] = useState(false);
    const hasCheckedExhaustion = useRef(false);
    const hasMarkedOnline = useRef(false);
    const isFirstRender = useRef(true);
    const hasTriggeredPhase2Gen = useRef(false);

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
                                    navigate(`/?code=${data.code}${debugSuffix ? `&${debugSuffix.slice(1)}` : ''}`);
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

    // Auto-Generation Check (Smart Logic) - Just log for now, generation happens on Start Game click
    useEffect(() => {
        const checkSmartGeneration = async () => {
            if (room && room.state.status === 'lobby' && isHost && !hasCheckedExhaustion.current && room.players) {
                hasCheckedExhaustion.current = true;
                // Only check if we are using default questions (no custom phase 1)
                if (!room.customQuestions?.phase1) {
                    const isExhausted = await checkPhase1Exhaustion(Object.values(room.players));
                    if (isExhausted) {
                        console.log("Static pool exhausted! Generation will happen when host clicks Start.");
                        // Generation is handled inline when host clicks "Start Game"
                    }
                }
            }
        };
        checkSmartGeneration();
    }, [room, isHost]);

    // Phase Transition - useLayoutEffect for SYNCHRONOUS execution before paint
    const prevStatus = useRef<string>('');

    useLayoutEffect(() => {
        if (!room) return;

        if (room.state.status !== prevStatus.current) {
            // Phase Transition Animation (skip on first render)
            if (prevStatus.current && !isFirstRender.current) {
                // Trigger TV-style transition animation for phase changes (not lobby)
                if (room.state.status !== 'lobby') {
                    setTransitionPhase(room.state.status as GameStatus);
                    setShowTransition(true);
                }
            }
            isFirstRender.current = false;
            prevStatus.current = room.state.status;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.state.status]);

    // Automatic Phase 2 Generation - triggers when entering Phase 2 without custom questions
    useEffect(() => {
        const generatePhase2Questions = async () => {
            if (!room || room.state.status !== 'phase2') return;
            if (hasTriggeredPhase2Gen.current) return;
            if (room.customQuestions?.phase2) {
                console.log("✅ Phase 2: Questions personnalisées déjà présentes");
                return;
            }
            if (!isHost) return; // Only host generates

            hasTriggeredPhase2Gen.current = true;
            setIsGeneratingPhase2(true);
            console.log("🍔 Phase 2: Génération automatique des questions...");

            try {
                const result = await generateWithRetry({ phase: 'phase2' });
                await overwriteGameQuestions(room.code, 'phase2', result.data as unknown[]);
                console.log("✅ Phase 2: Questions générées avec succès !");
            } catch (err) {
                console.error("❌ Phase 2: Échec génération:", err);
                // Continue with default questions if generation fails
            }

            setIsGeneratingPhase2(false);
        };

        generatePhase2Questions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.state.status, room?.customQuestions?.phase2, room?.code, isHost]);

    // Audio Effects: Player Joined & Ambience (can use regular useEffect)
    const prevPlayerCount = useRef(0);
    const prevAudioStatus = useRef<string>('');

    useEffect(() => {
        if (!room) return;

        // 1. Join Sound
        const count = Object.keys(room.players || {}).length;
        if (count > prevPlayerCount.current && prevPlayerCount.current > 0) {
            audioService.playJoin();
        }
        prevPlayerCount.current = count;

        // 2. Ambient Loops & Transitions Sound
        if (room.state.status !== prevAudioStatus.current) {
            // Phase Transition Sound
            if (prevAudioStatus.current) {
                audioService.playTransition();
            }

            // Ambience Logic
            if (room.state.status === 'lobby') {
                audioService.playAmbient('lobby');
            } else if (room.state.status === 'phase5') {
                audioService.playAmbient('tension');
            } else {
                audioService.playAmbient('tension');
            }

            prevAudioStatus.current = room.state.status;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room?.players, room?.state.status]);

    // Handle transition completion
    const handleTransitionComplete = useCallback(() => {
        setShowTransition(false);
    }, []);

    // Get current player info
    const currentPlayer = room?.players && myId ? room.players[myId] : null;

    // Handler for profile update
    const handleProfileUpdate = useCallback((newName: string, newAvatar: Avatar) => {
        // Storage is already updated in UserBar, this is just for any additional actions
        console.log(`Profile updated: ${newName}, ${newAvatar}`);
    }, []);

    // Handler for starting the game with automatic AI generation if needed
    const handleStartGame = useCallback(async () => {
        if (!room) return;

        setGenerationError(null);

        // Check if custom questions already exist
        if (room.customQuestions?.phase1) {
            console.log("✅ Questions personnalisées déjà présentes, lancement direct");
            setGameStatus(room.code, 'phase1');
            return;
        }

        // Check if generation is needed (at least one player exhausted default questions)
        const players = Object.values(room.players);
        console.log("🔍 Vérification exhaustion pour", players.length, "joueurs...");
        const isExhausted = await checkPhase1Exhaustion(players);
        console.log("📊 Résultat exhaustion:", isExhausted);

        if (!isExhausted) {
            // Default questions are fine, start the game
            console.log("✅ Questions par défaut disponibles, lancement direct");
            setGameStatus(room.code, 'phase1');
            return;
        }

        // Need new questions - first check Firestore for stored sets
        setIsGenerating(true);

        try {
            // Build set of seen question IDs from all players
            const seenIds = new Set<string>();
            for (const player of players) {
                try {
                    const historySnap = await get(child(ref(rtdb), `userHistory/${player.id}`));
                    if (historySnap.exists()) {
                        Object.keys(historySnap.val()).forEach(id => seenIds.add(id));
                    }
                } catch (e) {
                    console.warn(`Failed to get history for player ${player.id}:`, e);
                }
            }

            console.log(`📋 ${seenIds.size} questions déjà vues par les joueurs`);

            // Try to get a stored question set from Firestore
            console.log("🔍 Recherche de questions stockées dans Firestore...");
            const storedSet = await getRandomQuestionSet('phase1', seenIds);

            if (storedSet) {
                console.log(`📦 Questions trouvées dans Firestore ! (Set ${storedSet.id}, ${storedSet.questions.length} questions)`);
                await overwriteGameQuestions(room.code, 'phase1', storedSet.questions);
                setIsGenerating(false);
                setGameStatus(room.code, 'phase1');
                return;
            }

            // No suitable stored set found - generate new ones
            console.log("🍔 Aucune question stockée disponible, génération IA en cours...");
            const result = await generateWithRetry({ phase: 'phase1' });
            await overwriteGameQuestions(room.code, 'phase1', result.data as unknown[]);
            console.log("✅ Questions générées avec succès !");
        } catch (err) {
            console.error("❌ Échec:", err);
            setGenerationError("Impossible de charger les questions. Réessayez.");
            setIsGenerating(false);
            return;
        }

        setIsGenerating(false);
        setGameStatus(room.code, 'phase1');
    }, [room]);

    if (!room) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-pulse text-2xl font-bold flex items-center gap-3">
                    <Loader className="w-8 h-8 animate-spin" /> Connexion à la Cuisine...
                </div>
            </div>
        )
    }

    // Render the phase transition overlay
    const renderTransition = () => (
        <PhaseTransition
            phase={transitionPhase}
            isVisible={showTransition}
            onComplete={handleTransitionComplete}
        />
    );

    // ----- LOBBY PHASE -----
    if (room.state.status === 'lobby') {
        const players = Object.values(room.players);
        const spicyTeam = players.filter(p => p.team === 'spicy');
        const sweetTeam = players.filter(p => p.team === 'sweet');
        const unassigned = players.filter(p => !p.team);

        return (
            <div className="min-h-screen bg-brand-dark overflow-hidden flex flex-col md:flex-row relative">
                {/* TOP RIGHT CONTROLS */}
                <div className="absolute top-4 right-4 z-[100] flex items-center gap-3">
                    {/* UserBar */}
                    {currentPlayer && (
                        <UserBar
                            playerName={currentPlayer.name}
                            avatar={currentPlayer.avatar}
                            roomCode={room.code}
                            playerId={myId || undefined}
                            onProfileUpdate={handleProfileUpdate}
                        />
                    )}
                </div>

                {/* Spicy Side (Left/Top) */}
                <div className="flex-1 bg-red-900/20 border-b-4 md:border-b-0 md:border-r-4 border-red-600/30 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                    {/* Decorative bg */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/0 via-red-600/5 to-red-500/10 pointer-events-none" />

                    <h2 className="text-3xl md:text-5xl font-black text-red-500 uppercase tracking-tighter mb-8 drop-shadow-xl z-0 opacity-80 flex items-center gap-3">
                        Team Spicy <Flame className="w-10 h-10 md:w-16 md:h-16" />
                    </h2>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-md z-10">
                        {spicyTeam.map(p => <PlayerCard key={p.id} player={p} theme="spicy" />)}
                        {spicyTeam.length === 0 && <p className="col-span-2 text-center text-red-300/50 font-medium italic">En attente de braves...</p>}
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
                        {sweetTeam.length === 0 && <p className="col-span-2 text-center text-sweet-300/50 font-medium italic">En attente de gourmands...</p>}
                    </div>
                </div>

                {/* Center / Unassigned Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto max-w-md w-full mx-4">
                        <AnimatePresence mode="wait">
                            {isGenerating ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: durations.fast, ease: organicEase }}
                                >
                                    <GenerationLoadingCard
                                        error={generationError}
                                        onRetry={handleStartGame}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: durations.fast, ease: organicEase }}
                                    className="flex flex-col items-center"
                                >
                                    <header className="mb-6 text-center">
                                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Code de la Room</span>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400" style={{ backgroundImage: 'linear-gradient(to right, #f87171, #f472b6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                                                {room.code}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const url = `${window.location.protocol}//${window.location.host}/?code=${room.code}`;
                                                    navigator.clipboard.writeText(url);
                                                    setLinkCopied(true);
                                                    setTimeout(() => setLinkCopied(false), 2000);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
                                                title="Copier le lien"
                                            >
                                                {linkCopied ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </header>

                                    {/* Unassigned List */}
                                    <div className="w-full space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                                        {unassigned.length > 0 ? (
                                            unassigned.map(player => {
                                                return (
                                                    <div key={player.id} className="bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700 shadow-sm animate-fade-in">
                                                        <div className="flex items-center gap-3">
                                                            <AvatarIcon avatar={player.avatar} size={24} />
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
                                            <p className="text-gray-500 text-center text-sm py-4">Tous les chefs sont assignés !</p>
                                        )}
                                    </div>

                                    {/* Start Button */}
                                    {isHost ? (
                                        <div className="w-full space-y-3">
                                            <button
                                                onClick={handleStartGame}
                                                disabled={players.length < 2 || unassigned.length > 0}
                                                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-brand-darker text-xl font-black py-4 px-8 rounded-xl shadow-lg hover:shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                LANCER LA PARTIE <Clapperboard className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center animate-pulse">
                                            <p className="text-gray-400 font-medium">En attente que l'hôte lance la partie...</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Spectator Overlay */}
                {!myId && room.state.status !== 'lobby' && (
                    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur text-white p-2 text-center z-50 flex items-center justify-center gap-2">
                        <span className="font-bold text-yellow-400 flex items-center gap-1"><Eye className="w-4 h-4" /> MODE SPECTATEUR</span> - Partie en cours.
                    </div>
                )}

                {/* Phase Transition Overlay */}
                {renderTransition()}

                {/* Debug Panel (dev only) */}
                <DebugPanel room={room} />
            </div>
        );
    }

    // ----- PHASE 1: THE SNACKS (MCQ) -----
    if (room.state.status === 'phase1') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative">
                {/* Game Header: Scores + User + Mute */}
                <GameHeader
                    players={room.players}
                    currentPlayer={currentPlayer}
                    roomCode={room.code}
                    playerId={myId || undefined}
                    onProfileUpdate={handleProfileUpdate}
                />
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20">
                    {/* Unified View: Phase 1 */}
                    <Phase1Player
                        room={room}
                        playerId={myId || ''}
                        isHost={isHost}
                    />
                </div>

                {/* Phase Transition Overlay */}
                {renderTransition()}

                {/* Debug Panel (dev only) */}
                <DebugPanel room={room} />
            </div>
        );
    }

    // ----- PHASE 2: THE ENTREE (BINARY) -----
    if (room.state.status === 'phase2') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative">
                {/* Game Header: Scores + User + Mute */}
                <GameHeader
                    players={room.players}
                    currentPlayer={currentPlayer}
                    roomCode={room.code}
                    playerId={myId || undefined}
                    onProfileUpdate={handleProfileUpdate}
                />
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20">
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

                {/* Phase 2 Generation Loading Overlay */}
                {isGeneratingPhase2 && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200]">
                        <div className="text-center space-y-4">
                            <div className="relative">
                                <Loader className="w-16 h-16 text-purple-400 animate-spin mx-auto" />
                                <div className="absolute inset-0 animate-ping">
                                    <Loader className="w-16 h-16 text-purple-400/30 mx-auto" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white">Préparation de Sucré Salé...</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                L'IA génère des questions binaires sur mesure 🧂🌶️
                            </p>
                        </div>
                    </div>
                )}

                {/* Phase Transition Overlay */}
                {renderTransition()}

                {/* Debug Panel (dev only) */}
                <DebugPanel room={room} />
            </div>
        );
    }
    // ----- PHASE 3: THE MENUS -----
    if (room.state.status === 'phase3') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative">
                {/* Game Header: Scores + User */}
                <GameHeader
                    players={room.players}
                    currentPlayer={currentPlayer}
                    roomCode={room.code}
                    playerId={myId || undefined}
                    onProfileUpdate={handleProfileUpdate}
                />
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20">
                    <Phase3Player
                        room={room}
                        isHost={!!isHost}
                    />
                </div>

                {/* Phase Transition Overlay */}
                {renderTransition()}

                {/* Debug Panel (dev only) */}
                <DebugPanel room={room} />
            </div>
        );
    }
    // ----- PHASE 4: L'ADDITION -----
    if (room.state.status === 'phase4') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative">
                {/* Game Header: Scores + User */}
                <GameHeader
                    players={room.players}
                    currentPlayer={currentPlayer}
                    roomCode={room.code}
                    playerId={myId || undefined}
                    onProfileUpdate={handleProfileUpdate}
                />
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20">
                    <Phase4Player
                        playerId={myId || ''}
                        room={room}
                        isHost={!!isHost}
                    />
                </div>

                {/* Phase Transition Overlay */}
                {renderTransition()}

                {/* Debug Panel (dev only) */}
                <DebugPanel room={room} />
            </div>
        );
    }

    // ----- PHASE 5: BURGER DE LA MORT -----
    if (room.state.status === 'phase5') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative">
                {/* Game Header: Scores + User */}
                <GameHeader
                    players={room.players}
                    currentPlayer={currentPlayer}
                    roomCode={room.code}
                    playerId={myId || undefined}
                    onProfileUpdate={handleProfileUpdate}
                />
                <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20">
                    <Phase5Player
                        room={room}
                        isHost={!!isHost}
                    />
                </div>

                {/* Phase Transition Overlay */}
                {renderTransition()}

                {/* Debug Panel (dev only) */}
                <DebugPanel room={room} />
            </div>
        );
    }

    // Default Fallback
    return (
        <>
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                Phase inconnue : {room.state.status}
            </div>
            {/* Phase Transition Overlay */}
            {renderTransition()}

            {/* Debug Panel (dev only) */}
            <DebugPanel room={room} />
        </>
    );
}

function PlayerCard({ player, theme }: { player: Player, theme: 'spicy' | 'sweet' }) {
    const borderColor = theme === 'spicy' ? 'border-spicy-500/50' : theme === 'sweet' ? 'border-sweet-500/50' : 'border-white/5';
    const bgColor = theme === 'spicy' ? 'bg-spicy-900/40' : theme === 'sweet' ? 'bg-sweet-900/40' : 'bg-white/10';

    return (
        <div className={`${bgColor} backdrop-blur-md p-3 rounded-xl flex items-center space-x-3 border ${borderColor} shadow-sm transition-all hover:scale-105`}>
            <AvatarIcon avatar={player.avatar} size={32} />
            <span className="font-bold text-white tracking-wide">{player.name}</span>
        </div>
    )
}
