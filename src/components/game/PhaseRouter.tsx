import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type Room, type Avatar } from '../../services/gameService';
import { Phase1Player } from '../phases/Phase1Player';
import { Phase2Player } from '../phases/Phase2Player';
import { Phase3Player } from '../phases/Phase3Player';
import { Phase4Player } from '../phases/Phase4Player';
import { Phase5Player } from '../phases/Phase5Player';
import { GameHeader } from './GameHeader';
import { TeamIndicator } from './TeamIndicator';
import { DebugPanel } from './DebugPanel';
import { GenerationLoadingCard } from '../ui/GenerationLoadingCard';
import { TeammateCursors } from './TeammateCursors';
import { useTeammateCursors } from '../../hooks/useTeammateCursors';
import { AnimatePresence } from 'framer-motion';
import { OnboardingIntro } from '../onboarding/OnboardingIntro';
import { hasSeenIntro, markIntroSeen } from '../../services/onboardingService';
import {
    Zap, Hand, Star, Users,           // Phase 1 icons
    ListChecks, Repeat, Layers, Timer, // Phase 2 icons
    BookOpen, Keyboard, Check, Clock,  // Phase 3 icons
    User, MousePointer, Trophy,        // Phase 4 icons
    Flame, Cookie, UtensilsCrossed     // Phase icons (main)
} from 'lucide-react';

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
            />
            {/* Team Indicator - shows player's team affiliation */}
            <AnimatePresence>
                {currentPlayer?.team && <TeamIndicator team={currentPlayer.team} />}
            </AnimatePresence>
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
    const { t } = useTranslation('onboarding');

    // Use displayStatus for rendering (it lags behind during transitions)
    const status = displayStatus;
    // Read generation state from Firebase (visible to all players)
    const isGenerating = room.state.isGenerating ?? false;

    // Onboarding states for each phase
    const [showPhase1Onboarding, setShowPhase1Onboarding] = useState(false);
    const [showPhase2Onboarding, setShowPhase2Onboarding] = useState(false);
    const [showPhase3Onboarding, setShowPhase3Onboarding] = useState(false);
    const [showPhase4Onboarding, setShowPhase4Onboarding] = useState(false);

    // Check if onboarding should be shown when entering each phase
    useEffect(() => {
        if (status === 'phase1' && !hasSeenIntro('PHASE1_INTRO')) {
            setShowPhase1Onboarding(true);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'phase2' && !hasSeenIntro('PHASE2_INTRO')) {
            setShowPhase2Onboarding(true);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'phase3' && !hasSeenIntro('PHASE3_INTRO')) {
            setShowPhase3Onboarding(true);
        }
    }, [status]);

    useEffect(() => {
        if (status === 'phase4' && !hasSeenIntro('PHASE4_INTRO')) {
            setShowPhase4Onboarding(true);
        }
    }, [status]);

    // Onboarding handlers
    const handlePhase1OnboardingComplete = () => {
        markIntroSeen('PHASE1_INTRO');
        setShowPhase1Onboarding(false);
    };

    const handlePhase2OnboardingComplete = () => {
        markIntroSeen('PHASE2_INTRO');
        setShowPhase2Onboarding(false);
    };

    const handlePhase3OnboardingComplete = () => {
        markIntroSeen('PHASE3_INTRO');
        setShowPhase3Onboarding(false);
    };

    const handlePhase4OnboardingComplete = () => {
        markIntroSeen('PHASE4_INTRO');
        setShowPhase4Onboarding(false);
    };

    // Onboarding steps for each phase
    const phase1Steps = [
        { icon: Zap, label: t('phase1.steps.speed.label'), text: t('phase1.steps.speed.text'), color: 'text-yellow-400' },
        { icon: Hand, label: t('phase1.steps.tap.label'), text: t('phase1.steps.tap.text'), color: 'text-blue-400' },
        { icon: Star, label: t('phase1.steps.points.label'), text: t('phase1.steps.points.text'), color: 'text-green-400' },
        { icon: Users, label: t('phase1.steps.team.label'), text: t('phase1.steps.team.text'), color: 'text-purple-400' },
    ];

    const phase2Steps = [
        { icon: ListChecks, label: t('phase2.steps.classify.label'), text: t('phase2.steps.classify.text'), color: 'text-orange-400' },
        { icon: Repeat, label: t('phase2.steps.swipe.label'), text: t('phase2.steps.swipe.text'), color: 'text-blue-400' },
        { icon: Layers, label: t('phase2.steps.both.label'), text: t('phase2.steps.both.text'), color: 'text-purple-400' },
        { icon: Timer, label: t('phase2.steps.race.label'), text: t('phase2.steps.race.text'), color: 'text-red-400' },
    ];

    const phase3Steps = [
        { icon: BookOpen, label: t('phase3.steps.pick.label'), text: t('phase3.steps.pick.text'), color: 'text-amber-400' },
        { icon: Keyboard, label: t('phase3.steps.answer.label'), text: t('phase3.steps.answer.text'), color: 'text-blue-400' },
        { icon: Check, label: t('phase3.steps.spelling.label'), text: t('phase3.steps.spelling.text'), color: 'text-green-400' },
        { icon: Clock, label: t('phase3.steps.clock.label'), text: t('phase3.steps.clock.text'), color: 'text-red-400' },
    ];

    const phase4Steps = [
        { icon: User, label: t('phase4.steps.individual.label'), text: t('phase4.steps.individual.text'), color: 'text-purple-400' },
        { icon: MousePointer, label: t('phase4.steps.pick.label'), text: t('phase4.steps.pick.text'), color: 'text-blue-400' },
        { icon: Timer, label: t('phase4.steps.timer.label'), text: t('phase4.steps.timer.text'), color: 'text-yellow-400' },
        { icon: Trophy, label: t('phase4.steps.first.label'), text: t('phase4.steps.first.text'), color: 'text-green-400' },
    ];

    // Phase 1: Tenders (MCQ)
    if (status === 'phase1') {
        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                <Phase1Player
                    room={room}
                    playerId={myId || ''}
                    isHost={isHost}
                />
                {/* Phase 1 Onboarding */}
                {showPhase1Onboarding && (
                    <OnboardingIntro
                        title={t('phase1.title')}
                        subtitle={t('phase1.subtitle')}
                        icon={Flame}
                        iconColor="text-orange-500"
                        steps={phase1Steps}
                        buttonText={t('phase1.button')}
                        onContinue={handlePhase1OnboardingComplete}
                        gradientFrom="from-orange-500/20"
                        gradientTo="to-red-500/20"
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 2: Sucre Sale (Binary)
    if (status === 'phase2') {
        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                <Phase2Player
                    room={room}
                    playerId={myId || ''}
                    isHost={isHost}
                />

                {/* Generation Loading Overlay (visible to all players) */}
                {isGenerating && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
                        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4">
                            <GenerationLoadingCard />
                        </div>
                    </div>
                )}

                {/* Phase 2 Onboarding */}
                {showPhase2Onboarding && (
                    <OnboardingIntro
                        title={t('phase2.title')}
                        subtitle={t('phase2.subtitle')}
                        icon={Cookie}
                        iconColor="text-pink-500"
                        steps={phase2Steps}
                        buttonText={t('phase2.button')}
                        onContinue={handlePhase2OnboardingComplete}
                        gradientFrom="from-pink-500/20"
                        gradientTo="to-orange-500/20"
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 3: La Carte (Menus)
    if (status === 'phase3') {
        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                <Phase3Player
                    room={room}
                    playerId={myId || ''}
                    isHost={isHost}
                />
                {/* Phase 3 Onboarding */}
                {showPhase3Onboarding && (
                    <OnboardingIntro
                        title={t('phase3.title')}
                        subtitle={t('phase3.subtitle')}
                        icon={UtensilsCrossed}
                        iconColor="text-amber-500"
                        steps={phase3Steps}
                        buttonText={t('phase3.button')}
                        onContinue={handlePhase3OnboardingComplete}
                        gradientFrom="from-amber-500/20"
                        gradientTo="to-orange-500/20"
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 4: La Note (Buzzer)
    if (status === 'phase4') {
        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                <Phase4Player
                    playerId={myId || ''}
                    room={room}
                    isHost={isHost}
                />
                {/* Phase 4 Onboarding */}
                {showPhase4Onboarding && (
                    <OnboardingIntro
                        title={t('phase4.title')}
                        subtitle={t('phase4.subtitle')}
                        icon={Clock}
                        iconColor="text-green-500"
                        steps={phase4Steps}
                        buttonText={t('phase4.button')}
                        onContinue={handlePhase4OnboardingComplete}
                        gradientFrom="from-green-500/20"
                        gradientTo="to-emerald-500/20"
                    />
                )}
            </GamePhaseLayout>
        );
    }

    // Phase 5: Burger Ultime
    if (status === 'phase5') {
        return (
            <GamePhaseLayout
                players={room.players}
                currentPlayer={currentPlayer}
                roomCode={room.code}
                playerId={myId || undefined}
                onProfileUpdate={onProfileUpdate}
                room={room}
            >
                <Phase5Player
                    room={room}
                    isHost={isHost}
                    currentPlayerId={myId || ''}
                />
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
