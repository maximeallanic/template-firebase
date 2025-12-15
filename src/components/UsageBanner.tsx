import React from 'react';
import { useTranslation } from 'react-i18next';

interface UsageBannerProps {
  analysesUsed: number;
  analysesLimit: number;
  subscriptionStatus: string;
  onUpgrade: () => void;
  isUpgrading?: boolean;
}

export const UsageBanner: React.FC<UsageBannerProps> = ({
  analysesUsed,
  analysesLimit,
  subscriptionStatus,
  onUpgrade,
  isUpgrading = false,
}) => {
  const { t } = useTranslation(['translation', 'common']);
  const percentage = (analysesUsed / analysesLimit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = analysesUsed >= analysesLimit;

  const getStatusColor = () => {
    if (isAtLimit) return 'bg-red-100 border-red-300 text-red-800';
    if (isNearLimit) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  return (
    <div className={`max-w-4xl mx-auto mb-6 rounded-card-lg border-2 ${getStatusColor()} p-5 transition-all duration-250`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-[250px]">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-bold text-base">
              {subscriptionStatus === 'free' ? `🆓 ${t('common:plans.free')}` : `⭐ ${t('common:plans.pro')}`}
            </span>
            <span className="text-sm font-medium">
              {t('usage.analyses', { used: analysesUsed, limit: analysesLimit })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/60 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            ></div>
          </div>

          {isAtLimit && (
            <p className="text-sm mt-2 font-medium">
              {t('usage.atLimit')}
            </p>
          )}
          {isNearLimit && !isAtLimit && (
            <p className="text-sm mt-2 font-medium">
              {t('usage.nearLimit')}
            </p>
          )}
        </div>

        {subscriptionStatus === 'free' && (
          <button
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpgrading ? (
              <>
                <div className="spinner h-4 w-4"></div>
                {t('usage.loading')}
              </>
            ) : (
              t('usage.upgradeCta')
            )}
          </button>
        )}
      </div>
    </div>
  );
};
