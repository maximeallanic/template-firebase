import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { backdropVariants, contentVariants } from '../../animations';

/**
 * Full-screen overlay shown when device is in landscape mode.
 * Used as CSS fallback for iOS Safari where Screen Orientation API is not supported.
 *
 * CSS media query in index.css controls visibility:
 * @media (orientation: landscape) and (max-height: 500px)
 */
export function LandscapeWarning() {
  const { t } = useTranslation('home');

  return (
    <motion.div
      className="pwa-landscape-warning fixed inset-0 z-[100] hidden items-center justify-center bg-slate-900"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 p-8 text-center"
        variants={contentVariants}
      >
        {/* Rotating phone icon */}
        <motion.div
          className="relative"
          animate={{ rotate: [0, -90, -90, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
            ease: 'easeInOut',
          }}
        >
          {/* Phone outline */}
          <div className="w-16 h-24 rounded-xl border-4 border-white/80 relative">
            {/* Screen */}
            <div className="absolute inset-2 rounded-md bg-gradient-to-br from-rose-500/50 to-red-500/50" />
            {/* Home button */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full bg-white/60" />
          </div>
          {/* Rotation arrow */}
          <RotateCcw className="absolute -right-4 -top-4 w-8 h-8 text-rose-400" />
        </motion.div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {t('pwa.rotateDevice', 'Tournez votre appareil')}
          </h2>
          <p className="text-white/70 text-sm max-w-xs">
            {t('pwa.portraitRequired', 'Ce jeu se joue en mode portrait')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
