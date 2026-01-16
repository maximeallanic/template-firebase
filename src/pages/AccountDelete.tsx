import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { deleteAccount, signOut } from '../services/firebase';
import { clearLocalProfile } from '../services/profileService';
import { FoodLoader } from '../components/ui/FoodLoader';
import { useAuthUser } from '../hooks/useAuthUser';

type DeletionStep = 'confirm' | 'processing' | 'success' | 'error';

const AccountDelete = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthUser();

  const [step, setStep] = useState<DeletionStep>('confirm');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [finalConfirmChecked, setFinalConfirmChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!confirmChecked || !finalConfirmChecked) return;

    setStep('processing');
    setError(null);

    try {
      await deleteAccount();

      // Clear local data
      clearLocalProfile();

      // Sign out the user
      try {
        await signOut();
      } catch {
        // User is already deleted, sign out may fail
      }

      setStep('success');
    } catch (err) {
      console.error('Account deletion failed:', err);
      setError(err instanceof Error ? err.message : t('accountDelete.errorGeneric'));
      setStep('error');
    }
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FoodLoader size="lg" />
      </div>
    );
  }

  // User not logged in - redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t('accountDelete.backHome')}
            </Link>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('accountDelete.loginRequired')}</h1>
            <p className="text-indigo-100/80">{t('accountDelete.loginRequiredDesc')}</p>
            <Link
              to="/login"
              className="inline-block bg-gradient-to-r from-red-600 to-pink-600 px-8 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition-all"
            >
              {t('accountDelete.loginButton')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('accountDelete.backHome')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('accountDelete.title')}</h1>
          <p className="text-indigo-300/70 mt-2">{t('accountDelete.subtitle')}</p>
        </div>

        {/* Content based on step */}
        {step === 'confirm' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Warning Card */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-300">{t('accountDelete.warningTitle')}</h2>
                  <p className="text-red-200/80 mt-1">{t('accountDelete.warningDesc')}</p>
                </div>
              </div>
            </div>

            {/* Data to be deleted */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">{t('accountDelete.dataDeleted')}</h3>
              <ul className="space-y-3 text-indigo-100/80">
                <li className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                  {t('accountDelete.dataProfile')}
                </li>
                <li className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                  {t('accountDelete.dataHistory')}
                </li>
                <li className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                  {t('accountDelete.dataLeaderboard')}
                </li>
                <li className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400 flex-shrink-0" />
                  {t('accountDelete.dataAuth')}
                </li>
              </ul>
            </div>

            {/* Connected account info */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <p className="text-indigo-100/80">
                {t('accountDelete.connectedAs')} <span className="text-white font-semibold">{user.email}</span>
              </p>
            </div>

            {/* Double confirmation */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">{t('accountDelete.confirmTitle')}</h3>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-2 border-indigo-500/50 bg-transparent checked:bg-red-500 checked:border-red-500 focus:ring-2 focus:ring-red-500/50 cursor-pointer"
                />
                <span className="text-indigo-100/80 group-hover:text-white transition-colors">
                  {t('accountDelete.confirm1')}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={finalConfirmChecked}
                  onChange={(e) => setFinalConfirmChecked(e.target.checked)}
                  disabled={!confirmChecked}
                  className="mt-1 w-5 h-5 rounded border-2 border-indigo-500/50 bg-transparent checked:bg-red-500 checked:border-red-500 focus:ring-2 focus:ring-red-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`transition-colors ${confirmChecked ? 'text-indigo-100/80 group-hover:text-white' : 'text-indigo-100/50'}`}>
                  {t('accountDelete.confirm2')}
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/"
                className="flex-1 bg-white/10 hover:bg-white/20 py-4 rounded-xl font-bold text-white text-center transition-all"
              >
                {t('common:buttons.cancel')}
              </Link>
              <button
                onClick={handleDeleteAccount}
                disabled={!confirmChecked || !finalConfirmChecked}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                {t('accountDelete.deleteButton')}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center space-y-6"
          >
            <FoodLoader size="lg" />
            <h2 className="text-xl font-bold text-white">{t('accountDelete.processing')}</h2>
            <p className="text-indigo-100/80">{t('accountDelete.processingDesc')}</p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">{t('accountDelete.successTitle')}</h2>
            <p className="text-indigo-100/80">{t('accountDelete.successDesc')}</p>
            <button
              onClick={handleGoHome}
              className="bg-gradient-to-r from-red-600 to-pink-600 px-8 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition-all"
            >
              {t('accountDelete.goHome')}
            </button>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">{t('accountDelete.errorTitle')}</h2>
            <p className="text-red-200/80">{error || t('accountDelete.errorGeneric')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('confirm');
                  setError(null);
                }}
                className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-xl font-bold text-white transition-all"
              >
                {t('common:buttons.retry')}
              </button>
              <Link
                to="/"
                className="bg-gradient-to-r from-red-600 to-pink-600 px-8 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition-all"
              >
                {t('accountDelete.goHome')}
              </Link>
            </div>
          </motion.div>
        )}

        {/* GDPR info */}
        {step === 'confirm' && (
          <div className="mt-8 text-center text-sm text-indigo-300/50">
            <p>{t('accountDelete.gdprInfo')}</p>
            <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline transition-colors mt-2 inline-block">
              {t('accountDelete.privacyLink')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountDelete;
