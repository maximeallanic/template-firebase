import { useTranslation } from 'react-i18next';
import { Flame, Candy } from 'lucide-react';
import type { Team } from '../../types/gameTypes';
import { motion } from 'framer-motion';

interface TeamIndicatorProps {
    team: Team;
}

export function TeamIndicator({ team }: TeamIndicatorProps) {
    const { t } = useTranslation('common');

    const isSpicy = team === 'spicy';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className={`
                fixed top-20 right-4 z-50
                px-4 py-2 rounded-full
                font-bold text-white text-sm
                ${isSpicy ? 'bg-spicy-500' : 'bg-sweet-500'}
                shadow-lg
                flex items-center gap-2
                border-2 ${isSpicy ? 'border-spicy-400' : 'border-sweet-400'}
            `}
            role="status"
            aria-label={`${t('teams.yourTeam')}: ${t(`teams.${team}`)}`}
        >
            {isSpicy ? (
                <Flame className="w-4 h-4" aria-hidden="true" />
            ) : (
                <Candy className="w-4 h-4" aria-hidden="true" />
            )}
            <span>
                {t(`teams.${team}`)}
            </span>
        </motion.div>
    );
}
