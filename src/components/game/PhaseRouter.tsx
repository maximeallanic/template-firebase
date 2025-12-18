import { type Room, type Avatar } from '../../services/gameService';
import { Phase1Player } from '../Phase1Player';
import { Phase2Player } from '../Phase2Player';
import { Phase3Player } from '../Phase3Player';
import { Phase4Player } from '../Phase4Player';
import { Phase5Player } from '../Phase5Player';
import { GameHeader } from '../GameHeader';
import { DebugPanel } from '../DebugPanel';
import { PhaseTransition } from '../PhaseTransition';
import { Loader } from 'lucide-react';

type GameStatus = 'lobby' | 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5' | 'victory';

interface PhaseRouterProps {
    room: Room;
    myId: string | null;
    isHost: boolean;
    currentPlayer: Room['players'][string] | null;
    onProfileUpdate: (name: string, avatar: Avatar) => void;
    showTransition: boolean;
    transitionPhase: GameStatus;
    onTransitionComplete: () => void;
    isGeneratingPhase2: boolean;
}

/**
 * Routes to the correct phase component based on game status
 */
export function PhaseRouter({
    room,
    myId,
    isHost,
    currentPlayer,
    onProfileUpdate,
    showTransition,
    transitionPhase,
    onTransitionComplete,
    isGeneratingPhase2
}: PhaseRouterProps) {
    const status = room.state.status;

    // Common layout wrapper for game phases
    const GamePhaseLayout = ({ children }: { children: React.ReactNode }) => (
        <div className="min-h-screen bg-slate-900 flex flex-col relative">
            <GameHeader
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
            />
            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col items-center justify-center p-4 pt-20">
                {children}
            </div>
            <PhaseTransition
                phase={transitionPhase}
                isVisible={showTransition}
                onComplete={onTransitionComplete}
            />
            <DebugPanel room={room} />
        </div>
    );

    // Phase 1: Tenders (MCQ)
    if (status === 'phase1') {
        return (
            <GamePhaseLayout>
                <Phase1Player
                    room={room}
                    playerId={myId || ''}
                    isHost={isHost}
                />
            </GamePhaseLayout>
        );
    }

    // Phase 2: Sucre Sale (Binary)
    if (status === 'phase2') {
        return (
            <GamePhaseLayout>
                <Phase2Player
                    room={room}
                    playerId={myId || ''}
                    isHost={isHost}
                />

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
                            <h2 className="text-2xl font-black text-white">Preparation de Sucre Sale...</h2>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                L'IA genere des questions binaires sur mesure
                            </p>
                        </div>
                    </div>
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 3: La Carte (Menus)
    if (status === 'phase3') {
        return (
            <GamePhaseLayout>
                <Phase3Player
                    room={room}
                    isHost={isHost}
                />
            </GamePhaseLayout>
        );
    }

    // Phase 4: La Note (Buzzer)
    if (status === 'phase4') {
        return (
            <GamePhaseLayout>
                <Phase4Player
                    playerId={myId || ''}
                    room={room}
                    isHost={isHost}
                />
            </GamePhaseLayout>
        );
    }

    // Phase 5: Burger Ultime
    if (status === 'phase5') {
        return (
            <GamePhaseLayout>
                <Phase5Player
                    room={room}
                    isHost={isHost}
                />
            </GamePhaseLayout>
        );
    }

    // Fallback for unknown phases
    return (
        <>
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
                Phase inconnue : {status}
            </div>
            <PhaseTransition
                phase={transitionPhase}
                isVisible={showTransition}
                onComplete={onTransitionComplete}
            />
            <DebugPanel room={room} />
        </>
    );
}
