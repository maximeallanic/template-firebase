import { motion } from 'framer-motion';
import { AvatarIcon } from '../AvatarIcon';
import { useAuthUser } from '../../hooks/useAuthUser';
import { contentVariants } from '../../animations';
import type { Avatar } from '../../types/gameTypes';

/**
 * Player profile display for PWA homepage.
 * Shows avatar and player name at the top of the screen.
 */
export function PWAPlayerProfile() {
  const { profile, loading } = useAuthUser();

  // Default values for non-authenticated users
  const playerName = profile?.profileName || 'Joueur';
  const playerAvatar = (profile?.profileAvatar as Avatar) || 'burger';

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 pt-20 pb-4">
        <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
        <div className="h-6 w-24 rounded bg-white/10 animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-2 pb-4"
      variants={contentVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Avatar with glow effect */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500/40 to-pink-500/40 blur-md scale-110" />

        {/* Avatar container */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-1 ring-2 ring-white/20">
          <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
            <AvatarIcon avatar={playerAvatar} size={64} />
          </div>
        </div>
      </motion.div>

      {/* Player name */}
      <motion.h2
        className="text-xl font-bold text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {playerName}
      </motion.h2>
    </motion.div>
  );
}
