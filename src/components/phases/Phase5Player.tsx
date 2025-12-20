import { useMemo } from 'react';
import { type Room, type Team, type Phase5State } from '../../services/gameService';
import { FoodLoader } from '../ui/FoodLoader';

// Sub-components for each Phase 5 state
import {
    Phase5Intro,
    Phase5Voting,
    Phase5Memorizing,
    Phase5Answering,
    Phase5Spectator,
    Phase5Validating,
    Phase5Results,
} from './phase5';

interface Phase5PlayerProps {
    room: Room;
    isHost: boolean;
    currentPlayerId: string;
}

/**
 * Phase 5 "Burger Ultime" - Team Memory Duel
 *
 * Flow:
 * 1. idle -> Intro screen with rules
 * 2. selecting -> Each team votes for their representative
 * 3. memorizing -> Representatives see 10 Q&A (10s each)
 * 4. answering -> Representatives type answers in order (blind)
 * 5. validating -> LLM validates all answers
 * 6. result -> Show results and points
 */
export function Phase5Player({ room, isHost, currentPlayerId }: Phase5PlayerProps) {
    const phase5State: Phase5State = room.state.phase5State || 'idle';

    // Get current player's team
    const currentPlayer = room.players[currentPlayerId];
    const currentPlayerTeam: Team | null = currentPlayer?.team || null;

    // Check if current player is a representative
    const isRepresentative = useMemo(() => {
        if (!currentPlayerTeam) return false;
        const repId = room.state.phase5Representatives?.[currentPlayerTeam];
        return repId === currentPlayerId;
    }, [room.state.phase5Representatives, currentPlayerTeam, currentPlayerId]);

    // Loading state if player not found
    if (!currentPlayer || !currentPlayerTeam) {
        return (
            <div className="flex items-center justify-center min-h-full p-6 text-white">
                <FoodLoader size="lg" />
            </div>
        );
    }

    // Route based on phase5State
    switch (phase5State) {
        case 'idle':
            return <Phase5Intro room={room} isHost={isHost} />;

        case 'selecting':
            return (
                <Phase5Voting
                    room={room}
                    currentPlayerId={currentPlayerId}
                    currentPlayerTeam={currentPlayerTeam}
                />
            );

        case 'memorizing':
            // Representatives see questions, others see spectator view
            if (isRepresentative) {
                return <Phase5Memorizing room={room} isHost={isHost} />;
            } else {
                return (
                    <Phase5Spectator
                        room={room}
                        currentPlayerTeam={currentPlayerTeam}
                        phase5State={phase5State}
                    />
                );
            }

        case 'answering':
            // Representatives enter answers, others watch in real-time
            if (isRepresentative) {
                return (
                    <Phase5Answering
                        room={room}
                        currentPlayerId={currentPlayerId}
                        currentPlayerTeam={currentPlayerTeam}
                    />
                );
            } else {
                return (
                    <Phase5Spectator
                        room={room}
                        currentPlayerTeam={currentPlayerTeam}
                        phase5State={phase5State}
                    />
                );
            }

        case 'validating':
            return <Phase5Validating room={room} isHost={isHost} />;

        case 'result':
            return <Phase5Results room={room} isHost={isHost} />;

        default:
            // Fallback to intro for unknown states
            return <Phase5Intro room={room} isHost={isHost} />;
    }
}
