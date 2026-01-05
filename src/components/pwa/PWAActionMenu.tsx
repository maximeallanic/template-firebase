import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { backdropVariants, organicEase } from '../../animations';

interface PWAActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSoloMode: () => void;
  isCreatingRoom?: boolean;
}

/**
 * Slide-up action menu for PWA homepage.
 * Shows Create Game, Join Game, and Solo Mode options.
 */
export function PWAActionMenu({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onSoloMode,
  isCreatingRoom = false,
}: PWAActionMenuProps) {
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg rounded-t-3xl border-t border-white/10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 space-y-3">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  onClick={action.onClick}
                  disabled={action.loading}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group disabled:opacity-50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.1,
                    ease: organicEase,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
