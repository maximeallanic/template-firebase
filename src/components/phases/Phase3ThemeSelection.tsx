import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Flame, Candy, Lock, Sparkles } from 'lucide-react';
import type { Team, Phase3Theme } from '../../types/gameTypes';
import type { SoloPhaseHandlers } from '../../types/soloTypes';
import { selectPhase3Theme, getPhase3VisibleThemes } from '../../services/gameService';
import { audioService } from '../../services/audioService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { bouncySpring, durations } from '../../animations';

interface Phase3ThemeSelectionProps {
    roomCode: string;
    themes: Phase3Theme[];
    selectionOrder: Team[];
    currentSelections: Record<Team, number>;
    currentTeam: Team | null;
    mode?: 'solo' | 'multiplayer';
    soloHandlers?: SoloPhaseHandlers;
}

export const Phase3ThemeSelection: React.FC<Phase3ThemeSelectionProps> = ({
    roomCode,
    themes,
    selectionOrder,
    currentSelections,
    currentTeam,
    mode = 'multiplayer',
    soloHandlers,
}) => {
    const { t } = useTranslation(['game-ui', 'game-phases', 'common']);
    const prefersReducedMotion = useReducedMotion();
    const isSolo = mode === 'solo';

    // Get visible themes (exclude trap)
    const visibleThemes = getPhase3VisibleThemes(themes);

    // Determine which themes are already taken
    const takenThemes = new Set(Object.values(currentSelections));

    // Which team is selecting next? (In solo mode, always 'spicy')
    const selectingTeamCount = Object.keys(currentSelections).length;
    const selectingTeam = isSolo ? 'spicy' : selectionOrder[selectingTeamCount];
    // In solo mode, done after 1 selection; in multiplayer, done after 2
    const isBothTeamsDone = isSolo ? selectingTeamCount >= 1 : selectingTeamCount >= 2;

    // Check if current user is on the selecting team (always true in solo)
    const isOnSelectingTeam = isSolo ? true : currentTeam === selectingTeam;

    // Get team display info
    const TeamIcon = selectingTeam === 'spicy' ? Flame : Candy;
    const teamColor = selectingTeam === 'spicy' ? 'text-red-500' : 'text-pink-400';
    const teamBg = selectingTeam === 'spicy' ? 'bg-red-500/20' : 'bg-pink-500/20';

    const handleThemeSelect = async (originalIndex: number) => {
        if (!isOnSelectingTeam || !selectingTeam) return;
        if (takenThemes.has(originalIndex)) return;

        // Play selection sound
        audioService.playClick();

        try {
            if (isSolo && soloHandlers?.selectPhase3Theme) {
                soloHandlers.selectPhase3Theme(originalIndex);
                audioService.playSuccess();
            } else {
                await selectPhase3Theme(roomCode, selectingTeam, originalIndex);
                audioService.playSuccess();
            }
        } catch (error) {
            console.error('[Phase3] Theme selection error:', error);
            audioService.playError();
        }
    };

    if (isBothTeamsDone) {
        // Both teams selected, waiting for transition
        return (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                    transition={prefersReducedMotion ? { duration: durations.fast } : bouncySpring}
                    className="text-center"
                >
                    <Sparkles className={`w-16 h-16 mx-auto mb-4 text-yellow-400 ${prefersReducedMotion ? '' : 'animate-pulse'}`} />
                    <h2 className="text-3xl font-bold mb-2">{t('phase3.themesSelected')}</h2>
                    <p className="text-white/70">{t('phase3.preparingQuestions')}</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-6 space-y-6 w-full max-w-4xl mx-auto">
            {/* Solo mode header */}
            {isSolo && (
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-black text-white mb-2">{t('phase3.chooseMenu', 'Choisissez votre menu')}</h2>
                    <p className="text-white/60">{t('phase3.selectThemeDescription', 'Sélectionnez un thème pour débloquer ses questions')}</p>
                </div>
            )}

            {/* Selection Order Info - only in multiplayer */}
            {!isSolo && (
                <div className="text-center mb-4">
                    <p className="text-white/60 text-sm mb-2">
                        {t('phase3.selectionOrderInfo')}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        {selectionOrder.map((team, idx) => {
                            const Icon = team === 'spicy' ? Flame : Candy;
                            const color = team === 'spicy' ? 'text-red-500' : 'text-pink-400';
                            const isDone = currentSelections[team] !== undefined;
                            return (
                                <div
                                    key={team}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                        isDone ? 'bg-green-500/20 text-green-400' : team === selectingTeam ? 'bg-white/10' : 'bg-white/5'
                                    }`}
                                >
                                    <span className="text-white/50 font-mono">{idx + 1}.</span>
                                    <Icon className={`w-5 h-5 ${color}`} />
                                    <span className={color}>{t(`common:teams.${team}`)}</span>
                                    {isDone && <span className="text-green-400">✓</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Current Team Selecting - only in multiplayer */}
            {!isSolo && (
                <motion.div
                    key={selectingTeam}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`${teamBg} px-6 py-3 rounded-full flex items-center gap-3`}
                >
                    <TeamIcon className={`w-8 h-8 ${teamColor}`} />
                    <span className={`text-xl font-bold ${teamColor}`}>
                        {t('phase3.teamSelecting', { team: t(`common:teams.${selectingTeam}`) })}
                    </span>
                </motion.div>
            )}

            {/* Theme Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {visibleThemes.map(({ theme, originalIndex }) => {
                    const isTaken = takenThemes.has(originalIndex);
                    const takenByTeam = Object.entries(currentSelections).find(
                        ([, idx]) => idx === originalIndex
                    )?.[0] as Team | undefined;

                    return (
                        <motion.button
                            key={originalIndex}
                            data-cursor-target={`phase3:theme:${originalIndex}`}
                            whileHover={!isTaken && isOnSelectingTeam ? { scale: 1.02 } : {}}
                            whileTap={!isTaken && isOnSelectingTeam ? { scale: 0.98 } : {}}
                            onClick={() => handleThemeSelect(originalIndex)}
                            disabled={isTaken || !isOnSelectingTeam}
                            className={`p-6 rounded-2xl text-left transition-all relative overflow-hidden ${
                                isTaken
                                    ? 'bg-slate-800/50 cursor-not-allowed'
                                    : isOnSelectingTeam
                                    ? 'bg-white hover:ring-4 ring-yellow-400 cursor-pointer'
                                    : 'bg-white/80 cursor-default'
                            }`}
                        >
                            {/* Taken Overlay */}
                            {isTaken && takenByTeam && (
                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-white">
                                        <Lock className="w-5 h-5" />
                                        <span className="font-bold">
                                            {t('phase3.takenBy', { team: t(`common:teams.${takenByTeam}`) })}
                                        </span>
                                        {takenByTeam === 'spicy' ? (
                                            <Flame className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <Candy className="w-5 h-5 text-pink-400" />
                                        )}
                                    </div>
                                </div>
                            )}

                            <h3 className={`text-xl font-black mb-2 ${isTaken ? 'text-gray-500' : 'text-slate-800'}`}>
                                {theme.title}
                            </h3>
                            <p className={`text-sm ${isTaken ? 'text-gray-500' : 'text-slate-600'}`}>
                                {theme.description}
                            </p>
                            <div className="mt-3 text-xs text-slate-400">
                                {theme.questions.length} {t('phase3.questions')}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Waiting Message for non-selecting team - only in multiplayer */}
            {!isSolo && !isOnSelectingTeam && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/60 text-center animate-pulse"
                >
                    {t('phase3.waitingForTeamSelection', { team: t(`common:teams.${selectingTeam}`) })}
                </motion.p>
            )}
        </div>
    );
};
