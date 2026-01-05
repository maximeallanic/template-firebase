import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { createCheckoutSession } from '../../services/firebase';
import { PHASE_NAMES } from '../../types/gameTypes';
import { FoodLoader } from '../ui/FoodLoader';
import { useCurrency } from '../../hooks/useCurrency';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['common', 'game-phases']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's currency based on their location
  const { price, loading: priceLoading } = useCurrency();

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const returnUrl = window.location.href;
      // Pass detected currency to Stripe checkout
      const { url } = await createCheckoutSession(returnUrl, price.currency);

      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      setError(t('subscription.error'));
      setIsLoading(false);
    }
  };

  // Phases that require premium (with emojis)
  const premiumPhases = [
    { key: 'phase3', emoji: '🍽️', ...PHASE_NAMES.phase3 },
    { key: 'phase4', emoji: '🔔', ...PHASE_NAMES.phase4 },
    { key: 'phase5', emoji: '🍔', ...PHASE_NAMES.phase5 },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={t('common:buttons.close')}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">
                <span role="img" aria-label="crown">👑</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('subscription.upgradeTitle')}
              </h2>
              <p className="text-gray-600">
                {t('subscription.upgradeDescription')}
              </p>
            </div>

            {/* Locked phases */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-500 mb-3">
                {t('subscription.phasesIncluded')}
              </p>
              <div className="space-y-2">
                {premiumPhases.map((phase) => (
                  <div
                    key={phase.key}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200"
                  >
                    <span className="text-2xl">{phase.emoji}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{phase.name}</p>
                      <p className="text-sm text-gray-500">{phase.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <FoodLoader size="sm" />
                  {t('subscription.loading')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span role="img" aria-label="star">⭐</span>
                  {t('subscription.upgradeButton')}
                  <span className="text-amber-100">—</span>
                  {priceLoading ? '...' : `${price.formatted}/${t('subscription.perMonth')}`}
                </span>
              )}
            </button>

            {/* Cancel link */}
            <button
              onClick={onClose}
              className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
            >
              {t('subscription.cancel')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
