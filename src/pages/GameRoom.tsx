import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Player, setGameStatus, updatePlayerTeam, PREMIUM_PHASES } from '../services/gameService';
import { useGameRoom } from '../hooks/useGameRoom';
import { useQuestionGeneration } from '../hooks/useQuestionGeneration';
import { useHostSubscription } from '../hooks/useHostSubscription';
import { PhaseRouter } from '../components/game/PhaseRouter';
import { PhaseResults } from '../components/game/PhaseResults';
import { GameErrorBoundary } from '../components/game/GameErrorBoundary';
import { GenerationLoadingCard } from '../components/ui/GenerationLoadingCard';
import { UpgradeModal } from '../components/subscription/UpgradeModal';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { durations, organicEase, snappySpring } from '../animations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { UserBar } from '../components/auth/UserBar';
import { PhaseTransition } from '../components/game/PhaseTransition';
import { DebugPanel } from '../components/game/DebugPanel';
import { MockPlayerProvider } from '../contexts/MockPlayerContext';
import {
    Flame, Candy, Link, Eye, Clapperboard, Check
} from 'lucide-react';
import { AvatarIcon } from '../components/AvatarIcon';
import { audioService } from '../services/audioService';
import { SimpleConfetti } from '../components/ui/SimpleConfetti';
import { TEAM_CONFETTI_COLORS } from '../components/ui/confettiColors';
import { PlayerLeaderboard } from '../components/game/victory/PlayerLeaderboard';

type GameStatus = 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'victory';

// Animation variants for player cards in lobby
const playerCardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, y: 15 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: snappySpring
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: durations.fast, ease: organicEase }
    }
};

// Reduced motion variants (accessibility)
const playerCardReducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
};

export default function GameRoom() {
    const { t } = useTranslation(['lobby', 'game-ui', 'common']);
    const { id: roomId } = useParams<{ id: string }>();
    const query = new URLSearchParams(window.location.search);
    const debugPlayerId = query.get('debugPlayerId');

    // Custom hooks for room and question generation
    const { room, myId, isHost, currentPlayer, isLoading, isSpectator, handleProfileUpdate } = useGameRoom({
        roomId,
        debugPlayerId
    });

    const { isGenerating, generationError, handleStartGame } = useQuestionGeneration({
        room,
        isHost,
        myId
    });

    // Premium subscription check (based on host's subscription stored in room data)
    const { isPremium: hostIsPremium } = useHostSubscription(room?.hostIsPremium);

    // UI State
    const [linkCopied, setLinkCopied] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showTransition, setShowTransition] = useState(false);
    const [transitionPhase, setTransitionPhase] = useState<GameStatus>('lobby');
    // displayStatus: what the UI shows (lags behind during transitions)
    const [displayStatus, setDisplayStatus] = useState<GameStatus>('lobby');

    // Refs for tracking previous values
    const prevStatus = useRef<string>('');
    const prevPlayerCount = useRef(0);
    const prevAudioStatus = useRef<string>('');
    const isFirstRender = useRef(true);
    const isTransitioning = useRef(false);
    const targetPhaseRef = useRef<GameStatus>('lobby'); // Capture target phase when transition starts
    const roomStatusRef = useRef<string | undefined>(undefined); // Stable ref for room status

    // Extract values for stable dependency tracking
    const roomStatus = room?.state.status;
    const roomPlayers = room?.players;

    // Phase Transition - useLayoutEffect for SYNCHRONOUS execution before paint
    useLayoutEffect(() => {
        if (!room || !roomStatus || isTransitioning.current) return;

        // Keep ref updated for stable callback access
        roomStatusRef.current = roomStatus;

        if (roomStatus !== prevStatus.current) {
            if (prevStatus.current && !isFirstRender.current) {
                if (roomStatus !== 'lobby') {
                    isTransitioning.current = true;
                    // Capture the target phase in ref BEFORE setting state
                    targetPhaseRef.current = roomStatus as GameStatus;
                    setTransitionPhase(roomStatus as GameStatus);
                    setShowTransition(true);
                    // DON'T update displayStatus yet - keep showing old phase
                }
            } else {
                // First render or returning to lobby: update displayStatus immediately
                setDisplayStatus(roomStatus as GameStatus);
            }
            isFirstRender.current = false;
            prevStatus.current = roomStatus;
        }
    }, [room, roomStatus]);

    // Audio Effects: Player Joined & Ambience
    useEffect(() => {
        if (!room || !roomStatus) return;

        // Join Sound
        const count = Object.keys(roomPlayers || {}).length;
        if (count > prevPlayerCount.current && prevPlayerCount.current > 0) {
            audioService.playJoin();
        }
        prevPlayerCount.current = count;

        // Ambient Loops & Transitions Sound
        if (roomStatus !== prevAudioStatus.current) {
            if (prevAudioStatus.current) {
                audioService.playTransition();
            }

            if (roomStatus === 'lobby') {
                audioService.playAmbient('lobby');
            } else {
                audioService.playAmbient('tension');
            }

            prevAudioStatus.current = roomStatus;
        }
    }, [room, roomPlayers, roomStatus]);

    // Handle curtains closed - update displayStatus BEFORE curtains open
    // This ensures the new phase content is visible when curtains open
    // Uses ref instead of dependency for stable callback
    const handleCurtainsClosed = useCallback(() => {
        // Get the current game state from ref (stable, no stale closure issues)
        const currentGameStatus = roomStatusRef.current as GameStatus | undefined;

        // If game has already moved past the target phase, skip to current phase
        if (currentGameStatus && currentGameStatus !== 'lobby' && currentGameStatus !== targetPhaseRef.current) {
            // Game progressed during animation - skip directly to current phase
            setDisplayStatus(currentGameStatus);
            // Update prevStatus to prevent useLayoutEffect from triggering another transition
            prevStatus.current = currentGameStatus;
        } else {
            // Normal case: show the phase we transitioned to
            setDisplayStatus(targetPhaseRef.current);
        }
    }, []); // No dependencies - uses refs for stable access

    // Handle transition completion - just clean up the transition state
    const handleTransitionComplete = useCallback(() => {
        setShowTransition(false);
        isTransitioning.current = false;
    }, []);

    // Handle link copy
    const handleCopyLink = useCallback(() => {
        if (!room) return;
        const url = `${window.location.protocol}//${window.location.host}/?code=${room.code}`;
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    }, [room]);

    // Handler for PhaseResults "Continue" button - transitions to next phase
    const handlePhaseResultsContinue = useCallback(async () => {
        if (!room) return;

        const nextPhaseMap: Record<string, 'phase2' | 'phase3' | 'phase4' | 'phase5'> = {
            phase1: 'phase2',
            phase2: 'phase3',
            phase3: 'phase4',
            phase4: 'phase5',
        };

        const nextPhase = nextPhaseMap[room.state.status];
        if (!nextPhase) return;

        // Check if next phase is premium and host doesn't have subscription
        if (PREMIUM_PHASES.includes(nextPhase) && !hostIsPremium) {
            setShowUpgradeModal(true);
            return;
        }

        try {
            await setGameStatus(room.code, nextPhase);
        } catch (error) {
            // Handle PREMIUM_REQUIRED error from service layer
            if (error instanceof Error && error.message === 'PREMIUM_REQUIRED') {
                setShowUpgradeModal(true);
            } else {
                console.error('Failed to transition to next phase:', error);
            }
        }
    }, [room, hostIsPremium]);

    // Loading State - return null to let PageTransition handle smooth fade-in
    if (isLoading) {
        return null;
    }

    if (!room) return null;

    // Prepare lobby data (only used when displayStatus === 'lobby')
    const players = Object.values(room.players);
    const spicyTeam = players.filter(p => p.team === 'spicy');
    const sweetTeam = players.filter(p => p.team === 'sweet');
    const unassigned = players.filter(p => !p.team);

    // Render content based on displayStatus
    const renderContent = () => {
        // ----- LOBBY PHASE -----
        if (displayStatus === 'lobby') {
            return (
                <div className="min-h-screen bg-brand-dark overflow-hidden flex flex-col md:flex-row relative">
                    {/* TOP RIGHT CONTROLS */}
                    <div className="absolute top-4 right-4 z-[100] flex items-center gap-3">
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

                    {/* Spicy Side */}
                    <TeamSide team="spicy" players={spicyTeam} />

                    {/* Sweet Side */}
                    <TeamSide team="sweet" players={sweetTeam} />

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
                                        <LobbyHeader roomCode={room.code} linkCopied={linkCopied} onCopyLink={handleCopyLink} />
                                        <UnassignedPlayersList
                                            players={unassigned}
                                            roomCode={room.code}
                                            isHost={isHost}
                                        />
                                        <StartGameButton
                                            isHost={isHost}
                                            canStart={players.length >= 2 && unassigned.length === 0}
                                            onStart={handleStartGame}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Spectator Overlay */}
                    {isSpectator && (
                        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur text-white p-2 text-center z-50 flex items-center justify-center gap-2">
                            <span className="font-bold text-yellow-400 flex items-center gap-1">
                                <Eye className="w-4 h-4" /> {t('lobby:game.spectatorMode')}
                            </span> - {t('lobby:room.gameInProgress')}
                        </div>
                    )}

                    {import.meta.env.DEV && (
                        <MockPlayerProvider room={room}>
                            <DebugPanel room={room} />
                        </MockPlayerProvider>
                    )}
                </div>
            );
        }

        // ----- VICTORY SCREEN -----
        if (displayStatus === 'victory') {
            return <VictoryScreen room={room} isHost={isHost} />;
        }

        // ----- GAME PHASES (1-5) -----
        return (
            <PhaseRouter
                room={room}
                myId={myId}
                isHost={isHost}
                currentPlayer={currentPlayer}
                onProfileUpdate={handleProfileUpdate}
                displayStatus={displayStatus}
            />
        );
    };

    // Check if we should show PhaseResults overlay
    const showPhaseResults = room?.state.phaseState === 'phase_results' && !showTransition;

    // Single render point - PhaseTransition is ALWAYS rendered at the same place
    // This prevents mount/unmount issues when switching between lobby and phases
    return (
        <GameErrorBoundary>
            {renderContent()}
            <PhaseTransition
                phase={transitionPhase}
                isVisible={showTransition}
                onComplete={handleTransitionComplete}
                onCurtainsClosed={handleCurtainsClosed}
                isHost={isHost}
            />
            {/* Phase Results Overlay - shown between phases */}
            <AnimatePresence>
                {showPhaseResults && room && (
                    <PhaseResults
                        room={room}
                        currentPhase={room.state.status}
                        isHost={isHost}
                        onContinue={handlePhaseResultsContinue}
                    />
                )}
            </AnimatePresence>
            {/* Premium Upgrade Modal - shown when trying to access premium phases */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </GameErrorBoundary>
    );
}

// --- Sub-components ---

function TeamSide({ team, players }: { team: 'spicy' | 'sweet'; players: Player[] }) {
    const { t } = useTranslation(['lobby', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const isSpicy = team === 'spicy';
    const variants = prefersReducedMotion ? playerCardReducedVariants : playerCardVariants;

    return (
        <div className={`flex-1 ${isSpicy ? 'bg-red-900/20 border-b-4 md:border-b-0 md:border-r-4 border-red-600/30' : 'bg-pink-900/20'} flex flex-col items-center justify-center p-8 relative overflow-hidden group`}>
            <div className={`absolute inset-0 bg-gradient-to-${isSpicy ? 'br' : 'tl'} from-${isSpicy ? 'red' : 'pink'}-900/0 via-${isSpicy ? 'red' : 'pink'}-600/5 to-${isSpicy ? 'red' : 'pink'}-500/10 pointer-events-none`} />

            <h2 className={`text-3xl md:text-5xl font-black ${isSpicy ? 'text-red-500' : 'text-pink-500'} uppercase tracking-tighter mb-8 drop-shadow-xl z-0 opacity-80 flex items-center gap-3`}>
                Team {t(`common:teams.${team}`)} {isSpicy ? <Flame className="w-10 h-10 md:w-16 md:h-16" /> : <Candy className="w-10 h-10 md:w-16 md:h-16" />}
            </h2>

            <div className="grid grid-cols-2 gap-4 w-full max-w-md z-10">
                <AnimatePresence mode="popLayout">
                    {players.map(p => (
                        <motion.div
                            key={p.id}
                            layout
                            variants={variants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <PlayerCard player={p} theme={team} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                {players.length === 0 && (
                    <p className={`col-span-2 text-center ${isSpicy ? 'text-red-300/50' : 'text-sweet-300/50'} font-medium italic`}>
                        {isSpicy ? t('lobby:teams.waitingSpicy') : t('lobby:teams.waitingSweet')}
                    </p>
                )}
            </div>
        </div>
    );
}

function PlayerCard({ player, theme }: { player: Player; theme: 'spicy' | 'sweet' }) {
    const borderColor = theme === 'spicy' ? 'border-spicy-500/50' : 'border-sweet-500/50';
    const bgColor = theme === 'spicy' ? 'bg-spicy-900/40' : 'bg-sweet-900/40';

    return (
        <div className={`${bgColor} backdrop-blur-md p-3 rounded-xl flex items-center space-x-3 border ${borderColor} shadow-sm transition-all hover:scale-105`}>
            <AvatarIcon avatar={player.avatar} size={32} />
            <span className="font-bold text-white tracking-wide">{player.name}</span>
        </div>
    );
}

function LobbyHeader({ roomCode, linkCopied, onCopyLink }: { roomCode: string; linkCopied: boolean; onCopyLink: () => void }) {
    const { t } = useTranslation('lobby');
    return (
        <header className="mb-6 text-center">
            <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('room.roomCode')}</span>
            <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400" style={{ backgroundImage: 'linear-gradient(to right, #f87171, #f472b6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    {roomCode}
                </span>
                <div className="relative">
                    <AnimatePresence>
                        {linkCopied && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg"
                            >
                                {t('room.linkCopied')}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={onCopyLink}
                        className={`p-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'}`}
                        title={t('room.copyLink')}
                        aria-label={linkCopied ? t('room.linkCopied') : t('room.copyInviteLink')}
                    >
                        {linkCopied ? <Check className="w-5 h-5" /> : <Link className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
}

function UnassignedPlayersList({ players, roomCode, isHost }: { players: Player[]; roomCode: string; isHost: boolean }) {
    const { t } = useTranslation('lobby');
    const prefersReducedMotion = useReducedMotion();
    const variants = prefersReducedMotion ? playerCardReducedVariants : playerCardVariants;

    return (
        <div className="w-full space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar" role="list" aria-label={t('teams.unassigned')}>
            <AnimatePresence mode="popLayout">
                {players.length > 0 ? (
                    players.map(player => (
                        <motion.div
                            key={player.id}
                            layout
                            variants={variants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700 shadow-sm"
                            role="listitem"
                        >
                            <div className="flex items-center gap-3">
                                <AvatarIcon avatar={player.avatar} size={24} />
                                <span className="font-bold text-white max-w-[120px] truncate">{player.name}</span>
                            </div>
                            {isHost && (
                                <div className="flex gap-2" role="group" aria-label={t('teams.assignPlayer', { name: player.name })}>
                                    <button
                                        onClick={() => updatePlayerTeam(roomCode, player.id, 'spicy')}
                                        className="w-9 h-9 rounded-lg bg-spicy-600 text-white flex items-center justify-center hover:bg-spicy-500 transition-colors shadow-lg"
                                        aria-label={t('teams.assignToSpicy', { name: player.name })}
                                    >
                                        <Flame className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => updatePlayerTeam(roomCode, player.id, 'sweet')}
                                        className="w-9 h-9 rounded-lg bg-sweet-600 text-white flex items-center justify-center hover:bg-sweet-500 transition-colors shadow-lg"
                                        aria-label={t('teams.assignToSweet', { name: player.name })}
                                    >
                                        <Candy className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))
                ) : (
                    <motion.p
                        key="empty-message"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-gray-500 text-center text-sm py-4"
                    >
                        {t('teams.allAssigned')}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

function StartGameButton({ isHost, canStart, onStart }: { isHost: boolean; canStart: boolean; onStart: () => void }) {
    const { t } = useTranslation('lobby');
    if (!isHost) {
        return (
            <div className="text-center animate-pulse">
                <p className="text-gray-400 font-medium">{t('game.waitingForHost')}</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            <button
                onClick={onStart}
                disabled={!canStart}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-brand-darker text-xl font-black py-4 px-8 rounded-xl shadow-lg hover:shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-disabled={!canStart}
            >
                {t('game.startGame')} <Clapperboard className="w-6 h-6" />
            </button>
        </div>
    );
}

function VictoryScreen({ room, isHost }: { room: NonNullable<ReturnType<typeof useGameRoom>['room']>; isHost: boolean }) {
    const { t } = useTranslation(['game-ui', 'common']);
    const players = Object.values(room.players);
    const spicyScore = players.filter(p => p.team === 'spicy').reduce((sum, p) => sum + (p.score || 0), 0);
    const sweetScore = players.filter(p => p.team === 'sweet').reduce((sum, p) => sum + (p.score || 0), 0);
    const winnerTeam = room.state.winnerTeam;

    // Get confetti colors based on winner
    const confettiColors = winnerTeam === 'spicy'
        ? TEAM_CONFETTI_COLORS.spicy
        : winnerTeam === 'sweet'
            ? TEAM_CONFETTI_COLORS.sweet
            : TEAM_CONFETTI_COLORS.tie;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Confetti with team colors - continuous for victory celebration */}
            <SimpleConfetti colors={confettiColors} continuous intensity={120} />

            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${winnerTeam === 'spicy' ? 'bg-spicy-500' : winnerTeam === 'sweet' ? 'bg-sweet-500' : 'bg-yellow-500'}`} />
                <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse delay-500 ${winnerTeam === 'spicy' ? 'bg-orange-500' : winnerTeam === 'sweet' ? 'bg-purple-500' : 'bg-amber-500'}`} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: organicEase }}
                className="text-center z-10 w-full max-w-2xl"
            >
                {/* Winner Announcement */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {winnerTeam === 'tie' ? (
                        <h1 className="text-6xl md:text-8xl font-black text-yellow-400 uppercase tracking-tighter mb-4">
                            {t('victory.tie')}
                        </h1>
                    ) : (
                        <>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {t('victory.winner')}
                            </h2>
                            <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 flex items-center justify-center gap-4 ${winnerTeam === 'spicy' ? 'text-spicy-500' : 'text-sweet-500'}`}>
                                {winnerTeam === 'spicy' ? (
                                    <>Team {t('common:teams.spicy')} <Flame className="w-12 h-12 md:w-20 md:h-20" /></>
                                ) : (
                                    <>Team {t('common:teams.sweet')} <Candy className="w-12 h-12 md:w-20 md:h-20" /></>
                                )}
                            </h1>
                        </>
                    )}
                </motion.div>

                {/* Score Display */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="flex items-center justify-center gap-6 md:gap-12 my-8"
                    role="region"
                    aria-label={t('scores.finalScores')}
                >
                    <ScoreCard team="spicy" score={spicyScore} isWinner={winnerTeam === 'spicy'} />
                    <div className="text-3xl font-black text-slate-600" aria-hidden="true">VS</div>
                    <ScoreCard team="sweet" score={sweetScore} isWinner={winnerTeam === 'sweet'} />
                </motion.div>

                {/* Player Leaderboard */}
                <PlayerLeaderboard players={room.players} topN={3} />

                {/* Play Again Button */}
                {isHost && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGameStatus(room.code, 'lobby')}
                        className="mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-12 py-4 rounded-xl text-xl font-black shadow-lg hover:shadow-yellow-500/30"
                    >
                        {t('common:buttons.playAgain')}
                    </motion.button>
                )}
            </motion.div>

            {import.meta.env.DEV && (
                <MockPlayerProvider room={room}>
                    <DebugPanel room={room} />
                </MockPlayerProvider>
            )}
        </div>
    );
}

function ScoreCard({ team, score, isWinner }: { team: 'spicy' | 'sweet'; score: number; isWinner: boolean }) {
    const { t } = useTranslation(['common', 'game-ui']);
    const isSpicy = team === 'spicy';

    return (
        <div className={`text-center p-6 rounded-2xl ${isWinner ? (isSpicy ? 'bg-spicy-500/20 ring-4 ring-spicy-500' : 'bg-sweet-500/20 ring-4 ring-sweet-500') : 'bg-slate-800/50'}`}>
            {isSpicy ? (
                <Flame className={`w-12 h-12 mx-auto mb-2 ${isWinner ? 'text-spicy-400' : 'text-slate-500'}`} aria-hidden="true" />
            ) : (
                <Candy className={`w-12 h-12 mx-auto mb-2 ${isWinner ? 'text-sweet-400' : 'text-slate-500'}`} aria-hidden="true" />
            )}
            <div className="text-lg font-bold text-slate-400 uppercase">{t(`common:teams.${team}`)}</div>
            <div className={`text-6xl md:text-8xl font-black ${isWinner ? (isSpicy ? 'text-spicy-400' : 'text-sweet-400') : 'text-slate-500'}`} aria-label={t('game-ui:scores.points', { count: score })}>
                {score}
            </div>
        </div>
    );
}
