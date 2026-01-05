import { motion } from 'framer-motion';
import { Users, UserPlus, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { organicEase } from '../../animations';

interface PWAActionButtonsProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSoloMode: () => void;
  isCreatingRoom?: boolean;
}

/**
 * Action buttons for PWA homepage.
 * Displays Create Game, Join Game, and Solo Mode buttons vertically.
 */
export function PWAActionButtons({
  onCreateRoom,
  onJoinRoom,
  onSoloMode,
  isCreatingRoom = false,
}: PWAActionButtonsProps) {
  const { t } = useTranslation('home');

  const actions = [
    {
      id: 'create',
      icon: Users,
      label: t('createGame'),
      description: t('hostDescription'),
      onClick: onCreateRoom,
      gradient: 'from-rose-500 to-red-600',
      loading: isCreatingRoom,
    },
    {
      id: 'join',
      icon: UserPlus,
      label: t('joinGame'),
      description: t('joinDescription'),
      onClick: onJoinRoom,
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      id: 'solo',
      icon: User,
      label: t('soloMode'),
      description: t('soloDescription'),
      onClick: onSoloMode,
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="w-full max-w-sm mx-auto px-4 space-y-3">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={action.onClick}
          disabled={action.loading}
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/80 backdrop-blur-sm border border-white/10 hover:bg-slate-700/80 transition-colors group disabled:opacity-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2 + index * 0.1,
            ease: organicEase,
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-lg`}
          >
            {action.loading ? (
              <motion.div
                className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <action.icon className="w-7 h-7 text-white" />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 text-left">
            <h3 className="text-lg font-semibold text-white">{action.label}</h3>
            <p className="text-sm text-white/60">{action.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
