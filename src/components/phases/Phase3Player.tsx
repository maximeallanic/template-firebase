import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { initPhase3, showPhaseResults } from '../../services/gameService';
import type { Room } from '../../services/gameService';
import type { Phase3Theme, Team } from '../../types/gameTypes';
import { PHASE3_DATA } from '../../services/data/phase3';
import { Zap, Loader2 } from 'lucide-react';
import { markQuestionAsSeen } from '../../services/historyService';
import { Phase3ThemeSelection } from './Phase3ThemeSelection';
import { Phase3QuestionInput } from './Phase3QuestionInput';
import { Phase3Spectator } from './Phase3Spectator';
import { auth } from '../../services/firebase';

interface Phase3PlayerProps {
    room: Room;
    isHost: boolean;
}

export const Phase3Player: React.FC<Phase3PlayerProps> = ({ room, isHost }) => {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);

    // Get current player info
    const currentUserId = auth.currentUser?.uid;
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

    // No team assigned
    if (!playerTeam || !currentPlayer) {
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
                currentTeam={playerTeam}
            />
        );
    }

    // View 2: Playing (or Spectating if own team finished)
    if (phase3State === 'playing') {
        // If own team finished, show spectator view
        if (ownFinished && ownProgress) {
            return (
                <Phase3Spectator
                    playerTeam={playerTeam}
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
                    playerTeam={playerTeam}
                    theme={ownTheme}
                    teamProgress={ownProgress}
                    players={room.players}
                    otherTeamProgress={otherProgress}
                />
            );
        }
    }

    // View 3: Finished (both teams done)
    if (phase3State === 'finished' && ownProgress) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Phase3Spectator
                    playerTeam={playerTeam}
                    ownProgress={ownProgress}
                    otherProgress={otherProgress}
                    otherTheme={otherTheme}
                    players={room.players}
                    bothFinished={true}
                />

                {/* Host Controls */}
                {isHost && (
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
