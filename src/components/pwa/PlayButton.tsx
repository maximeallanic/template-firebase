import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PlayButtonProps {
  onPress: () => void;
}

/**
 * Central animated PLAY button for PWA homepage.
 * Features a pulsing glow effect and Candy Crush-inspired design.
 */
export function PlayButton({ onPress }: PlayButtonProps) {
  const { t } = useTranslation('home');
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onPress}
      className="relative group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.3,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow ring - pulsing */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(244,63,94,0.4) 0%, rgba(244,63,94,0) 70%)',
          transform: 'scale(1.5)',
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                opacity: [0.5, 0.8, 0.5],
                scale: [1.5, 1.8, 1.5],
              }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Second glow ring - offset timing */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(236,72,153,0.3) 0%, rgba(236,72,153,0) 70%)',
          transform: 'scale(1.3)',
        }}
        animate={
          shouldReduceMotion
            ? {}
            : {
                opacity: [0.4, 0.7, 0.4],
                scale: [1.3, 1.6, 1.3],
              }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      {/* Main button */}
      <div className="relative w-36 h-36 rounded-full overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-red-500 to-pink-600" />

        {/* Inner highlight */}
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-rose-400 via-red-500 to-pink-600" />

        {/* Top shine */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-20 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-sm" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -2, 0],
                  }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Play className="w-12 h-12 text-white fill-white drop-shadow-lg" />
          </motion.div>
          <span className="text-white font-bold text-xl tracking-wider drop-shadow-lg">
            {t('pwa.play', 'JOUER')}
          </span>
        </div>

        {/* Border ring */}
        <div className="absolute inset-0 rounded-full ring-4 ring-white/20" />
      </div>

      {/* Bottom shadow */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/30 rounded-full blur-md" />
    </motion.button>
  );
}
