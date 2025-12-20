import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { initPhase3, showPhaseResults } from '../../services/gameService';
import type { Room } from '../../services/gameService';
import type { Phase3Theme, Team } from '../../types/gameTypes';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import { PHASE3_DATA } from '../../services/data/phase3';
import { Zap, Loader2, ChevronRight } from 'lucide-react';
import { markQuestionAsSeen } from '../../services/historyService';
import { Phase3ThemeSelection } from './Phase3ThemeSelection';
import { Phase3QuestionInput } from './Phase3QuestionInput';
import { Phase3Spectator } from './Phase3Spectator';
import { auth } from '../../services/firebase';

interface Phase3PlayerProps {
    room: Room;
    playerId?: string; // Optional: used in solo mode
    isHost: boolean;
    mode?: 'solo' | 'multiplayer';
    soloHandlers?: SoloPhaseHandlers;
}

export const Phase3Player: React.FC<Phase3PlayerProps> = ({ room, playerId, isHost, mode = 'multiplayer', soloHandlers }) => {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);
    const isSolo = mode === 'solo';

    // Get current player info (use playerId prop in solo mode, auth in multiplayer)
    const currentUserId = isSolo && playerId ? playerId : auth.currentUser?.uid;
    const currentPlayer = currentUserId ? room.players[currentUserId] : null;
    const playerTeam = currentPlayer?.team as Team | null;

    // Get Phase 3 state (v2)
    const {
        phase3State,
        phase3SelectionOrder,
        phase3ThemeSelection,
        phase3TeamProgress,
    } = room.state;

    // Use custom AI-generated themes if available, fallback to default PHASE3_DATA
    // Cast to Phase3Theme[] since Phase3Menu is now an alias for Phase3Theme
    const themes: Phase3Theme[] = (room.customQuestions?.phase3 || PHASE3_DATA) as Phase3Theme[];

    // Get team-specific data
    const ownProgress = playerTeam ? phase3TeamProgress?.[playerTeam] : undefined;
    const otherTeam: Team | null = playerTeam === 'spicy' ? 'sweet' : playerTeam === 'sweet' ? 'spicy' : null;
    const otherProgress = otherTeam ? phase3TeamProgress?.[otherTeam] : undefined;

    // Get themes for each team
    const ownTheme = useMemo(() => {
        if (!playerTeam || !phase3ThemeSelection) return undefined;
        const themeIndex = phase3ThemeSelection[playerTeam];
        return themeIndex !== undefined ? themes[themeIndex] : undefined;
    }, [playerTeam, phase3ThemeSelection, themes]);

    const otherTheme = useMemo(() => {
        if (!otherTeam || !phase3ThemeSelection) return undefined;
        const themeIndex = phase3ThemeSelection[otherTeam];
        return themeIndex !== undefined ? themes[themeIndex] : undefined;
    }, [otherTeam, phase3ThemeSelection, themes]);

    // Check completion states
    const ownFinished = ownProgress?.finished || false;
    const otherFinished = otherProgress?.finished || false;
    const bothFinished = ownFinished && otherFinished;

    // Initialize Phase 3 on first load if host and not already initialized
    useEffect(() => {
        if (isHost && phase3State === undefined) {
            initPhase3(room.code);
        }
    }, [isHost, room.code, phase3State]);

    // Track questions as seen when displayed
    useEffect(() => {
        if (phase3State === 'playing' && ownTheme && ownProgress) {
            const currentQuestion = ownTheme.questions[ownProgress.currentQuestionIndex];
            if (currentQuestion?.question) {
                markQuestionAsSeen('', currentQuestion.question);
            }
        }
    }, [phase3State, ownTheme, ownProgress]);

    // Loading state
    if (!phase3State || !phase3SelectionOrder) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-white">
                <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mb-4" />
                <p className="text-white/60">{t('common:loading')}</p>
            </div>
        );
    }

    // No team assigned (skip check in solo mode - always on 'spicy' team)
    if (!isSolo && (!playerTeam || !currentPlayer)) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-white">
                <p className="text-xl">{t('phase3.noTeamAssigned')}</p>
            </div>
        );
    }

    // View 1: Theme Selection
    if (phase3State === 'selecting') {
        return (
            <Phase3ThemeSelection
                roomCode={room.code}
                themes={themes}
                selectionOrder={phase3SelectionOrder as Team[]}
                currentSelections={(phase3ThemeSelection || {}) as Record<Team, number>}
                currentTeam={playerTeam || 'spicy'}
                mode={mode}
                soloHandlers={soloHandlers}
            />
        );
    }

    // View 2: Playing (or Spectating if own team finished)
    if (phase3State === 'playing') {
        // If own team finished, show spectator view (only in multiplayer)
        if (!isSolo && ownFinished && ownProgress) {
            return (
                <Phase3Spectator
                    playerTeam={playerTeam || 'spicy'}
                    ownProgress={ownProgress}
                    otherProgress={otherProgress}
                    otherTheme={otherTheme}
                    players={room.players}
                    bothFinished={bothFinished}
                />
            );
        }

        // Still playing - show question input
        if (ownTheme && ownProgress && currentUserId) {
            return (
                <Phase3QuestionInput
                    roomCode={room.code}
                    playerId={currentUserId}
                    playerTeam={playerTeam || 'spicy'}
                    theme={ownTheme}
                    teamProgress={ownProgress}
                    players={room.players}
                    otherTeamProgress={otherProgress}
                    mode={mode}
                    soloHandlers={soloHandlers}
                />
            );
        }
    }

    // View 3: Finished (both teams done)
    if (phase3State === 'finished' && ownProgress) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                {/* Only show spectator view in multiplayer */}
                {!isSolo && playerTeam && (
                    <Phase3Spectator
                        playerTeam={playerTeam}
                        ownProgress={ownProgress}
                        otherProgress={otherProgress}
                        otherTheme={otherTheme}
                        players={room.players}
                        bothFinished={true}
                    />
                )}

                {/* Solo mode: Show score summary and advance button */}
                {isSolo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center text-white"
                    >
                        <div className="text-6xl mb-4">🍽️</div>
                        <h2 className="text-3xl font-black mb-2">{t('game-phases:phase3.title')}</h2>
                        <p className="text-xl text-gray-400 mb-6">{t('game-phases:phase3.complete', 'Phase terminée !')}</p>

                        <div className="bg-white/10 rounded-xl p-4 mb-6">
                            <div className="text-lg text-gray-300">Score cette phase</div>
                            <div className="text-4xl font-black text-green-400">
                                {ownProgress.score} / {ownTheme?.questions.length || 5}
                            </div>
                        </div>

                        <button
                            onClick={() => soloHandlers?.advanceToNextPhase()}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 px-8 py-4 rounded-xl text-xl font-bold shadow-lg flex items-center gap-2 mx-auto transition-colors"
                        >
                            <ChevronRight className="w-6 h-6" />
                            {t('common:actions.continue', 'Continuer')}
                        </button>
                    </motion.div>
                )}

                {/* Multiplayer: Host Controls */}
                {!isSolo && isHost && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur border-t border-slate-700 flex justify-center gap-4 z-50"
                    >
                        <button
                            onClick={() => showPhaseResults(room.code)}
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-brand-dark px-12 py-4 rounded-full font-black text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <Zap className="w-6 h-6" />
                            {t('game-phases:navigation.startPhase4')}
                        </button>
                    </motion.div>
                )}
            </div>
        );
    }

    // Fallback
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-white">
            <p className="text-white/60">{t('common:loading')}</p>
        </div>
    );
};
