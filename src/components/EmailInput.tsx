import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEmailAnalysisSession, formatTimeRemaining } from '../hooks/useEmailAnalysisSession';
import { useClipboard } from '../hooks/useClipboard';

interface EmailInputProps {
  onAnalyze: (email: string, isGuestMode?: boolean) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  freeTrialUsed: boolean;
}

const EXAMPLE_EMAIL = `Subject: Quick question about your sales process

Hi Sarah,

I noticed your company recently expanded to the EMEA market. Congratulations on the growth!

I help SaaS companies reduce their sales cycle time by 30% using our AI-powered qualification tool.

Would you be available for a 15-minute call next Tuesday at 2pm EST or Wednesday at 10am EST?

Best regards,
John`;

export const EmailInput: React.FC<EmailInputProps> = ({ onAnalyze, isLoading, isAuthenticated, freeTrialUsed }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [analysisMode, setAnalysisMode] = useState<'email' | 'paste'>('paste'); // Default to paste mode

  // Email session hook (only creates session when in email mode)
  const { emailAddress, status, analysisId, error: sessionError, timeRemaining, retry } = useEmailAnalysisSession(analysisMode === 'email');
  const [copyToClipboard, isCopied] = useClipboard();

  // Redirect to dedicated analysis page when complete
  useEffect(() => {
    if (analysisMode === 'email' && status === 'completed' && analysisId) {
      // Small delay to show "Completed" state
      const timer = setTimeout(() => {
        navigate(`/analysis/${analysisId}`);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [analysisMode, status, analysisId, navigate]);

  const handleSubmit = (e: React.FormEvent, isGuestMode: boolean = false) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('emailInput.errors.empty'));
      return;
    }

    if (email.length < 10) {
      setError(t('emailInput.errors.tooShort'));
      return;
    }

    if (email.length > 10000) {
      setError(t('emailInput.errors.tooLong'));
      return;
    }

    onAnalyze(email.trim(), isGuestMode);
  };

  const handleTryExample = () => {
    setEmail(EXAMPLE_EMAIL);
    setError('');
  };

  const wordCount = email.trim().split(/\s+/).filter(Boolean).length;
  const isOptimalLength = wordCount >= 50 && wordCount <= 125;

  const handleCopy = () => {
    if (emailAddress) {
      copyToClipboard(emailAddress);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnalysisMode('email')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 ${
                analysisMode === 'email'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{t('emailInput.modes.email.title')}</span>
                <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">{t('emailInput.modes.email.badge')}</span>
              </div>
              <p className="text-xs mt-1 opacity-80">{t('emailInput.modes.email.subtitle')}</p>
            </button>
            <button
              type="button"
              onClick={() => setAnalysisMode('paste')}
              className={`flex-1 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-300 ${
                analysisMode === 'paste'
                  ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{t('emailInput.modes.paste.title')}</span>
              </div>
              <p className="text-xs mt-1 opacity-80">{t('emailInput.modes.paste.subtitle')}</p>
            </button>
          </div>
        </div>

        {/* Conditional Content based on mode */}
        {analysisMode === 'email' ? (
          // EMAIL FORWARD MODE - INLINE DISPLAY
          <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl shadow-lg border-2 border-purple-200 p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('emailInput.emailMode.title')}</h3>
                <p className="text-gray-600">{t('emailInput.emailMode.description')}</p>
              </div>

              {/* Loading state */}
              {status === 'loading' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
                  <p className="text-gray-600">{t('emailInput.emailMode.loading')}</p>
                </div>
              )}

              {/* Error state */}
              {sessionError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-1">{t('emailInput.emailMode.status.error')}</h3>
                      <p className="text-sm text-red-800">{sessionError}</p>
                    </div>
                  </div>
                  <button
                    onClick={retry}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {t('emailInput.emailMode.status.tryAgain')}
                  </button>
                </div>
              )}

              {/* Email address display */}
              {emailAddress && !sessionError && (
                <>
                  <div className="bg-white border-2 border-purple-300 rounded-xl p-6">
                    <label className="text-sm font-semibold text-purple-900 mb-3 block">
                      {t('emailInput.emailMode.yourEmail')}
                    </label>
                    <div className="flex items-center gap-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
                      <span className="flex-1 font-mono text-lg text-gray-900 select-all break-all">{emailAddress}</span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex-shrink-0 ${
                          isCopied
                            ? 'bg-green-500 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isCopied ? (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {t('emailInput.emailMode.copiedButton')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            {t('emailInput.emailMode.copyButton')}
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="mt-3 text-sm text-purple-700 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{t('emailInput.emailMode.expiresIn', { time: formatTimeRemaining(timeRemaining) })}</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path
                          fillRule="evenodd"
                          d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('emailInput.emailMode.howItWorks')}
                    </h3>
                    <ol className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                          1
                        </span>
                        <span>{t('emailInput.emailMode.step1')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                          2
                        </span>
                        <span>{t('emailInput.emailMode.step2')}</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                          3
                        </span>
                        <span>{t('emailInput.emailMode.step3')}</span>
                      </li>
                    </ol>
                  </div>

                  {/* Status indicator */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    {status === 'waiting' && (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-gray-600">{t('emailInput.emailMode.status.waiting')}</span>
                      </div>
                    )}

                    {status === 'received' && (
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <span className="text-blue-600 font-semibold">{t('emailInput.emailMode.status.received')}</span>
                      </div>
                    )}

                    {status === 'analyzing' && (
                      <div className="flex items-center gap-3">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-purple-200 border-t-purple-600"></div>
                        <span className="text-purple-600 font-semibold">{t('emailInput.emailMode.status.analyzing')}</span>
                      </div>
                    )}

                    {status === 'completed' && (
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-600 font-semibold">{t('emailInput.emailMode.status.completed')}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          // PASTE TEXT MODE
          <>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 hover:border-blue-200 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="email-input" className="text-base font-semibold text-gray-900">
                  {t('emailInput.label')}
                </label>
                <button
                  type="button"
                  onClick={handleTryExample}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 hover:gap-2 transition-all"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  {t('emailInput.tryExample')}
                </button>
              </div>

              <label htmlFor="email-input" className="sr-only">
                Your cold email content for analysis
              </label>
              <textarea
                id="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailInput.placeholder')}
                className="w-full h-72 px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-base leading-relaxed transition-all duration-200 placeholder:text-gray-400"
                aria-label="Email content for analysis"
                disabled={isLoading}
              />

              {/* Stats Row */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-900">{wordCount}</span> {t('emailInput.stats.words')}
                    {isOptimalLength && <span className="text-green-600 ml-1">{t('emailInput.stats.optimal')}</span>}
                    {wordCount > 0 && !isOptimalLength && wordCount < 50 && <span className="text-orange-600 ml-1">{t('emailInput.stats.addMore')}</span>}
                    {wordCount > 125 && <span className="text-orange-600 ml-1">{t('emailInput.stats.tooLong')}</span>}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`${email.length > 9000 ? 'text-orange-600' : 'text-gray-600'}`}>
                    <span className="font-medium">{email.length}</span> / 10000 {t('emailInput.stats.chars')}
                  </span>
                </div>

                {wordCount > 0 && (
                  <span className="text-xs text-gray-500">
                    {wordCount < 50 ? t('emailInput.stats.addWordsMore', { count: 50 - wordCount }) :
                     wordCount > 125 ? t('emailInput.stats.removeWordsMore', { count: wordCount - 125 }) :
                     t('emailInput.stats.perfectLength')}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Error Message and Submit Button - Only show in paste mode */}
        {analysisMode === 'paste' && (
          <>
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Submit Button - Conditional based on auth and trial status */}
            {isAuthenticated ? (
              // Authenticated user - normal analyze button
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                onClick={(e) => handleSubmit(e, false)}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg py-5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('emailInput.buttons.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>{t('emailInput.buttons.analyzeWithAI')}</span>
                  </>
                )}
              </button>
            ) : !freeTrialUsed ? (
              // Guest user - free trial available
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                onClick={(e) => handleSubmit(e, true)}
                className="w-full bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg py-5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden group"
              >
                {/* Sparkle effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>

                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('emailInput.buttons.analyzing')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{t('emailInput.buttons.tryFree')}</span>
                  </>
                )}
              </button>
            ) : (
              // Guest user - trial used, prompt to sign in
              <button
                type="button"
                onClick={() => onAnalyze('', false)}
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 hover:from-blue-700 hover:via-blue-800 hover:to-purple-700 text-white font-bold text-lg py-5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>{t('emailInput.buttons.signInToAnalyze')}</span>
              </button>
            )}
          </>
        )}

        {/* Tips - Only show in paste mode */}
        {analysisMode === 'paste' && !email && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 mb-2">{t('emailInput.tips.title')}</p>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{t('emailInput.tips.tip1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{t('emailInput.tips.tip2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{t('emailInput.tips.tip3')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
