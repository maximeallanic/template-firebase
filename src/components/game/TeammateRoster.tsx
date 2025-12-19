import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, Team } from '../../types/gameTypes';
import { AvatarIcon } from '../AvatarIcon';
import { springConfig, durations, organicEase } from '../../animations';

interface TeammateRosterProps {
    players: Record<string, Player>;
    currentPlayerId: string;
    myTeam: Team | null;
    answers?: Record<string, boolean>;
    maxDisplay?: number;
    /** Label to show before avatars (optional) */
    label?: string;
    /** Style variant */
    variant?: 'inline' | 'bar';
}

// Variants for teammate avatars
const avatarVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: springConfig
    },
    exit: {
        opacity: 0,
        scale: 0.5,
        transition: { duration: durations.fast, ease: organicEase }
    },
    answered: {
        scale: 1.15,
        transition: springConfig
    },
    waiting: {
        scale: 1,
        transition: springConfig
    }
};

// Variants for the answer badge
const badgeVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 500,
            damping: 20,
            delay: 0.1
        }
    }
};

/**
 * Displays a row of teammate avatars with answer status badges.
 * Filters out mock players and offline players automatically.
 */
export function TeammateRoster({
    players,
    currentPlayerId,
    myTeam,
    answers,
    maxDisplay = 5,
    label,
    variant = 'inline'
}: TeammateRosterProps) {
    const { t } = useTranslation(['game-ui', 'common']);

    // Filter to get real, online teammates only
    const teammates = Object.values(players).filter(
        p => p.id !== currentPlayerId &&
             p.team === myTeam &&
             p.isOnline &&
             !p.id.startsWith('mock_')
    );

    if (teammates.length === 0) return null;

    const displayedTeammates = teammates.slice(0, maxDisplay);
    const overflowCount = teammates.length - maxDisplay;

    const containerClass = variant === 'bar'
        ? 'bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-white/10 flex items-center gap-2'
        : 'flex -space-x-1 items-center';

    return (
        <div className={containerClass}>
            {label && (
                <span className="text-xs text-slate-400 mr-2">{label}</span>
            )}
            <AnimatePresence mode="popLayout">
                {displayedTeammates.map(p => {
                    const hasAnswered = answers && p.id in answers;
                    const wasCorrect = answers?.[p.id];
                    return (
                        <motion.div
                            key={p.id}
                            layout
                            variants={avatarVariants}
                            initial="hidden"
                            animate={hasAnswered ? "answered" : "waiting"}
                            exit="exit"
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm relative text-white
                                ${hasAnswered
                                    ? (wasCorrect ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400')
                                    : 'bg-slate-700 border-slate-600'}
                                ${hasAnswered ? 'z-10' : ''}
                            `}
                            title={`${p.name}${hasAnswered ? (wasCorrect ? ' ✓' : ' ✗') : ` (${t('common:labels.waiting')})`}`}
                        >
                            <AvatarIcon avatar={p.avatar} size={16} />
                            <AnimatePresence>
                                {hasAnswered && (
                                    <motion.div
                                        variants={badgeVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${wasCorrect ? 'bg-green-600' : 'bg-red-600'}`}
                                    >
                                        {wasCorrect ? '✓' : '✗'}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {/* Pulse animation for waiting teammates in bar variant */}
                            {!hasAnswered && variant === 'bar' && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-slate-400"
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.5, 0, 0.5]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
            {overflowCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs text-white font-bold"
                >
                    +{overflowCount}
                </motion.div>
            )}
        </div>
    );
}
