import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, VolumeX, Globe, User, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSoundSettings } from '../../hooks/useSoundSettings';
import { backdropVariants, organicEase } from '../../animations';

interface QuickSettingsProps {
  onEditProfile?: () => void;
}

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

/**
 * Quick settings panel for PWA homepage.
 * Provides access to sound toggle, language selection, and profile edit.
 */
export function QuickSettings({ onEditProfile }: QuickSettingsProps) {
  const { t, i18n } = useTranslation('home');
  const [isOpen, setIsOpen] = useState(false);
  const { soundEnabled, toggleSound } = useSoundSettings();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <>
      {/* Settings button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-6 h-6 text-white/80" />
      </motion.button>

      {/* Settings panel - rendered via Portal to escape header's stacking context */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => setIsOpen(false)}
              />

              {/* Panel */}
              <motion.div
                className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-[55] border-r border-white/10 overflow-hidden"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                style={{
                  paddingTop: 'env(safe-area-inset-top)',
                  paddingBottom: 'env(safe-area-inset-bottom)',
                }}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950" />
                  <div className="absolute top-[-20%] left-[-30%] w-64 h-64 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/10 blur-3xl" />
                  <div className="absolute bottom-[10%] right-[-20%] w-48 h-48 rounded-full bg-gradient-to-br from-red-500/15 to-orange-500/10 blur-3xl" />
                </div>
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">
                    {t('pwa.settings', 'Réglages')}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>

                {/* Settings content */}
                <div className="relative z-10 p-4 space-y-6">
                  {/* Sound toggle */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, ease: organicEase }}
                  >
                    <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                      {t('pwa.sound', 'Son')}
                    </h3>
                    <button
                      onClick={toggleSound}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-white/40" />
                        )}
                        <span className="text-white">
                          {soundEnabled ? t('pwa.soundOn', 'Activé') : t('pwa.soundOff', 'Désactivé')}
                        </span>
                      </div>
                      {/* Toggle switch */}
                      <div
                        className={`w-12 h-7 rounded-full p-1 transition-colors ${
                          soundEnabled ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          className="w-5 h-5 rounded-full bg-white shadow"
                          animate={{ x: soundEnabled ? 20 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </button>
                  </motion.div>

                  {/* Language selection */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, ease: organicEase }}
                  >
                    <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t('pwa.language', 'Langue')}
                    </h3>
                    <div className="space-y-2">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            i18n.language === lang.code
                              ? 'bg-rose-500/20 ring-1 ring-rose-500/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xl">{lang.flag}</span>
                          <span className="text-white">{lang.label}</span>
                          {i18n.language === lang.code && (
                            <motion.div
                              className="ml-auto w-2 h-2 rounded-full bg-rose-500"
                              layoutId="language-indicator"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Profile edit */}
                  {onEditProfile && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, ease: organicEase }}
                    >
                      <h3 className="text-sm font-medium text-white/60 mb-3 uppercase tracking-wider">
                        {t('pwa.profile', 'Profil')}
                      </h3>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onEditProfile();
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <User className="w-5 h-5 text-white/60" />
                        <span className="text-white">{t('editProfile', 'Modifier le profil')}</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
