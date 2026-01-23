import { type Room, type Avatar } from '../../services/gameService';
import { Phase1Player } from '../phases/Phase1Player';
import { Phase1Intro } from '../phases/phase1/Phase1Intro';
import { Phase2Player } from '../phases/Phase2Player';
import { Phase2Intro } from '../phases/phase2/Phase2Intro';
import { Phase3Player } from '../phases/Phase3Player';
import { Phase3Intro } from '../phases/phase3/Phase3Intro';
import { Phase4Player } from '../phases/Phase4Player';
import { Phase4Intro } from '../phases/phase4/Phase4Intro';
import { Phase5Player } from '../phases/Phase5Player';
import { Phase5Intro } from '../phases/phase5/Phase5Intro';
import { GameHeader } from './GameHeader';
import { DebugPanel } from './DebugPanel';
import { GenerationLoadingCard } from '../ui/GenerationLoadingCard';
import { TeammateCursors } from './TeammateCursors';
import { useTeammateCursors } from '../../hooks/useTeammateCursors';

type GameStatus = 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'victory';

/**
 * Props for GamePhaseLayout - extracted outside PhaseRouter to prevent
 * unnecessary remounts of children on every render
 */
interface GamePhaseLayoutProps {
    children: React.ReactNode;
    players: Room['players'];
    currentPlayer: Room['players'][string] | null;
    roomCode: string;
    playerId?: string;
    onProfileUpdate: (name: string, avatar: Avatar) => void;
    room: Room;
}

// Phases where cursor sharing is enabled
const CURSOR_ENABLED_PHASES: GameStatus[] = ['phase1', 'phase2', 'phase3', 'phase4'];

/**
 * Common layout wrapper for game phases
 * IMPORTANT: This component is defined OUTSIDE PhaseRouter to maintain
 * a stable reference across renders, preventing child component remounts
 */
function GamePhaseLayout({
    children,
    players,
    currentPlayer,
    roomCode,
    playerId,
    onProfileUpdate,
    room
}: GamePhaseLayoutProps) {
    // Check if cursor sharing should be enabled for this phase
    const isCursorEnabled = CURSOR_ENABLED_PHASES.includes(room.state.status as GameStatus);

    // Use teammate cursors hook
    const { teammateCursors } = useTeammateCursors({
        roomCode,
        playerId: playerId || '',
        myTeam: currentPlayer?.team ?? null,
        players,
        enabled: isCursorEnabled && !!playerId,
    });

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col relative">
            <GameHeader
                players={players}
                currentPlayer={currentPlayer}
                roomCode={roomCode}
                playerId={playerId}
                onProfileUpdate={onProfileUpdate}
                room={room}
            />
            <div
                data-cursor-container
                className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20"
            >
                {children}
            </div>
            <DebugPanel room={room} />
            {/* Teammate cursors overlay */}
            {isCursorEnabled && <TeammateCursors cursors={teammateCursors} />}
        </div>
    );
}

interface PhaseRouterProps {
    room: Room;
    myId: string | null;
    isHost: boolean;
    currentPlayer: Room['players'][string] | null;
    onProfileUpdate: (name: string, avatar: Avatar) => void;
    displayStatus: GameStatus; // What phase to visually show (lags during transitions)
}

/**
 * Routes to the correct phase component based on game status
 * Note: PhaseTransition is rendered at GameRoom level to avoid mount/unmount issues
 */
export function PhaseRouter({
    room,
    myId,
    isHost,
    currentPlayer,
    onProfileUpdate,
    displayStatus
}: PhaseRouterProps) {
    // Use displayStatus for rendering (it lags behind during transitions)
    const status = displayStatus;
    // Read generation state from Firebase (visible to all players)
    const isGenerating = room.state.isGenerating ?? false;

    // Phase 1: Tenders (MCQ)
    if (status === 'phase1') {
        // Show Phase1Intro (readiness screen) when phaseState is 'idle'
        // This allows all players to signal they're ready before starting questions
        const isPhase1Idle = room.state.phaseState === 'idle';

        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                {isPhase1Idle ? (
                    // Readiness screen - all players must mark ready before host can start
                    <Phase1Intro
                        room={room}
                        isHost={isHost}
                    />
                ) : (
                    // Game in progress - show player interface
                    <Phase1Player
                        room={room}
                        playerId={myId || ''}
                        isHost={isHost}
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 2: Sucre Sale (Binary)
    if (status === 'phase2') {
        // Show Phase2Intro (readiness screen) when phaseState is 'idle'
        const isPhase2Idle = room.state.phaseState === 'idle';

        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                {isPhase2Idle ? (
                    // Readiness screen - all players must mark ready before host can start
                    <Phase2Intro
                        room={room}
                        isHost={isHost}
                    />
                ) : (
                    // Game in progress - show player interface
                    <Phase2Player
                        room={room}
                        playerId={myId || ''}
                        isHost={isHost}
                    />
                )}

                {/* Generation Loading Overlay (visible to all players) */}
                {isGenerating && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4">
                            <GenerationLoadingCard />
                        </div>
                    </div>
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 3: La Carte (Menus)
    if (status === 'phase3') {
        // Show Phase3Intro (readiness screen) when phaseState is 'idle'
        const isPhase3Idle = room.state.phaseState === 'idle';

        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                {isPhase3Idle ? (
                    // Readiness screen - all players must mark ready before host can start
                    <Phase3Intro
                        room={room}
                        isHost={isHost}
                    />
                ) : (
                    // Game in progress - show player interface
                    <Phase3Player
                        room={room}
                        playerId={myId || ''}
                        isHost={isHost}
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 4: La Note (Buzzer)
    if (status === 'phase4') {
        // Show Phase4Intro (readiness screen) when phaseState is 'idle'
        const isPhase4Idle = room.state.phaseState === 'idle';

        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                {isPhase4Idle ? (
                    // Readiness screen - all players must mark ready before host can start
                    <Phase4Intro
                        room={room}
                        isHost={isHost}
                    />
                ) : (
                    // Game in progress - show player interface
                    <Phase4Player
                        playerId={myId || ''}
                        room={room}
                        isHost={isHost}
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 5: Burger Ultime
    if (status === 'phase5') {
        // Show Phase5Intro (readiness screen) when phaseState is 'idle'
        const isPhase5Idle = room.state.phaseState === 'idle';

        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                {isPhase5Idle ? (
                    // Readiness screen - all players must mark ready before host can start
                    <Phase5Intro
                        room={room}
                        isHost={isHost}
                    />
                ) : (
                    // Game in progress - show player interface
                    <Phase5Player
                        room={room}
                        isHost={isHost}
                        currentPlayerId={myId || ''}
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Fallback for unknown phases
    // Note: PhaseTransition is rendered at GameRoom level
    return (
        <>
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                Phase inconnue : {status}
            </div>
            <DebugPanel room={room} />
        </>
    );
}
