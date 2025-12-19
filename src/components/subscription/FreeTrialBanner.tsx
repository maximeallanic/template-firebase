import React from 'react';
import { useTranslation } from 'react-i18next';

interface FreeTrialBannerProps {
  onSignIn: () => void;
}

export const FreeTrialBanner: React.FC<FreeTrialBannerProps> = ({ onSignIn }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto mb-6">
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-6 shadow-lg relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200 rounded-full -ml-12 -mb-12 opacity-20"></div>

        <div className="relative flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{t('freeTrial.title')}</p>
                <p className="text-sm text-gray-600">{t('hero.freeTrial').replace('🎉 ', '').replace(' - No Sign-Up Required!', '')}</p>
              </div>
            </div>
            <p className="text-base text-gray-700 leading-relaxed">
              {t('freeTrial.description')}
            </p>
          </div>

          <button
            onClick={onSignIn}
            className="hidden md:flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {t('nav.signIn')}
          </button>
        </div>
      </div>
    </div>
  );
};
