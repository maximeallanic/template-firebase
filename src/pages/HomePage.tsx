import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from 'firebase/auth';
import { EmailInput } from '../components/EmailInput';
import { Header } from '../components/Header';
import { UsageBanner } from '../components/UsageBanner';
import { EmailVerification } from '../components/EmailVerification';
import { FreeTrialBanner } from '../components/FreeTrialBanner';

// Lazy load heavy components for better initial load performance
const AnalysisResults = lazy(() => import('../components/AnalysisResults').then(module => ({ default: module.AnalysisResults })));
const AuthModal = lazy(() => import('../components/AuthModal').then(module => ({ default: module.AuthModal })));
import {
  analyzeEmail,
  analyzeEmailGuest,
  hasUsedFreeTrial,
  getUserSubscriptionDirect,
  createCheckoutSession,
  reloadUser
} from '../services/firebase';
import type { EmailAnalysis } from '../types/analysis';

interface HomePageProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

export default function HomePage({ user, setUser }: HomePageProps) {
  const { t } = useTranslation(['translation', 'common']);
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);

  // LCP Optimization: Lazy render features/pricing sections
  const [showFeatures, setShowFeatures] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Subscription state
  const [subscription, setSubscription] = useState({
    analysesUsed: 0,
    analysesLimit: 5,
    subscriptionStatus: 'free',
  });

  // Check free trial status on mount
  useEffect(() => {
    setFreeTrialUsed(hasUsedFreeTrial());
  }, []);

  // Load subscription when user changes
  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  // LCP Optimization: Intersection Observer for features section
  // Defer rendering of features/pricing until they're about to be visible
  useEffect(() => {
    if (!featuresRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShowFeatures(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before element is visible
      }
    );

    observer.observe(featuresRef.current);

    return () => observer.disconnect();
  }, []);

  // Track purchase after Stripe checkout success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    // If we have a session_id and user is logged in, it means successful payment
    if (sessionId && user) {
      // Check if we already tracked this session (to avoid duplicates)
      const trackedSessions = sessionStorage.getItem('tracked_purchases') || '[]';
      const tracked = JSON.parse(trackedSessions);

      if (!tracked.includes(sessionId)) {
        // GA4 Event: Purchase (Revenue conversion) - DISABLED FOR PERFORMANCE
        // Using Firebase Analytics instead (automatically tracks conversions)
        // const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
        // if (typeof window !== 'undefined' && gtag) {
        //   gtag('event', 'purchase', {
        //     'transaction_id': sessionId,
        //     'value': 5,
        //     'currency': 'USD',
        //     'items': [{
        //       'item_id': 'pro_subscription',
        //       'item_name': 'Pro Subscription',
        //       'item_category': 'Subscription',
        //       'price': 5,
        //       'quantity': 1
        //     }]
        //   });
        //   console.log('✅ GA4: Purchase event tracked', sessionId);
        // }
        console.log('✅ Purchase completed', sessionId);

        // Mark this session as tracked
        tracked.push(sessionId);
        sessionStorage.setItem('tracked_purchases', JSON.stringify(tracked));

        // Show success message to user
        setSuccessMessage(t('success.welcomePro'));

        // Refresh subscription data
        loadSubscription();

        // Clean URL (remove session_id parameter)
        window.history.replaceState({}, '', window.location.pathname);

        // Hide success message after 10 seconds
        setTimeout(() => setSuccessMessage(null), 10000);
      }
    }
  }, [user, setSuccessMessage, t]);

  const loadSubscription = async () => {
    try {
      const data = await getUserSubscriptionDirect();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleAnalyze = async (emailContent: string, isGuestMode: boolean = false) => {
    setIsLoading(true);
    setError(null);
    setOriginalEmail(emailContent);

    try {
      // Guest mode analysis
      if (isGuestMode && !user) {
        const result = await analyzeEmailGuest(emailContent);

        if (result.success && result.data) {
          setAnalysis(result.data);
          setFreeTrialUsed(true);

          // Show success message prompting sign up
          setSuccessMessage(t('success.freeTrialUsed'));
          setTimeout(() => setSuccessMessage(null), 15000);

          // GA4 Event: Free Trial Analysis Completed - DISABLED FOR PERFORMANCE
          // Using Firebase Analytics instead
          // const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
          // if (typeof window !== 'undefined' && gtag) {
          //   gtag('event', 'free_trial_analysis_completed', {
          //     'event_category': 'engagement',
          //     'event_label': 'guest',
          //     'value': 0,
          //     'currency': 'USD'
          //   });
          //   console.log('✅ GA4: Free trial analysis completed event tracked');
          // }
          console.log('✅ Free trial analysis completed');
        } else {
          setError(result.error || 'Failed to analyze email');
        }
      }
      // Authenticated user analysis
      else if (user) {
        const result = await analyzeEmail(emailContent);

        if (result.success && result.data) {
          // GA4 Event: Analysis Completed (Micro-conversion) - DISABLED FOR PERFORMANCE
          // Using Firebase Analytics instead
          // const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
          // if (typeof window !== 'undefined' && gtag) {
          //   gtag('event', 'email_analysis_completed', {
          //     'event_category': 'engagement',
          //     'event_label': subscription.subscriptionStatus,
          //     'value': 0,
          //     'currency': 'USD'
          //   });
          //   console.log('✅ GA4: Analysis completed event tracked');
          // }
          console.log('✅ Analysis completed');

          // Update usage
          if (result.usage) {
            setSubscription(prev => ({
              ...prev,
              analysesUsed: result.usage!.used,
              analysesLimit: result.usage!.limit,
            }));
          }

          // Redirect to dedicated analysis page with ID
          if (result.analysisId) {
            navigate(`/analysis/${result.analysisId}`);
          } else {
            // Fallback: show on current page if no ID
            setAnalysis(result.data);
          }
        } else {
          setError(result.error || 'Failed to analyze email');
        }
      }
      // Not authenticated and not guest mode
      else {
        setAuthModalOpen(true);
        setIsLoading(false);
        return;
      }
    } catch (err: unknown) {
      console.error('Error:', err);
      const message = err instanceof Error ? err.message : 'An error occurred while analyzing your email';
      setError(message);

      // If free trial error, update state
      if (message.includes('Free trial already used') || message.includes('trial')) {
        setFreeTrialUsed(true);
      }

      // If unauthenticated, show auth modal
      if (err instanceof Error && err.message?.includes('sign in')) {
        setAuthModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setOriginalEmail('');
    setError(null);
  };

  const handleUpgrade = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      setIsUpgrading(true);

      // GA4 Event: Begin Checkout (Funnel tracking) - DISABLED FOR PERFORMANCE
      // Using Firebase Analytics instead
      // const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      // if (typeof window !== 'undefined' && gtag) {
      //   gtag('event', 'begin_checkout', {
      //     'event_category': 'ecommerce',
      //     'value': 5,
      //     'currency': 'USD',
      //     'items': [{
      //       'item_name': 'Pro Subscription',
      //       'item_category': 'Subscription',
      //       'price': 5
      //     }]
      //   });
      //   console.log('✅ GA4: Begin checkout event tracked');
      // }
      console.log('✅ Begin checkout');

      const { url } = await createCheckoutSession(window.location.origin);
      window.location.href = url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      setError(message);
      setIsUpgrading(false);
    }
  };

  const handleEmailVerified = async () => {
    try {
      const updatedUser = await reloadUser();
      if (updatedUser) {
        setUser(updatedUser);
        await loadSubscription();
      }
    } catch (error) {
      console.error('Failed to reload user after verification:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with auth */}
      <header role="banner">
        <Header
          user={user}
          onSignIn={() => setAuthModalOpen(true)}
          subscriptionStatus={subscription.subscriptionStatus}
        />
      </header>

      {/* Auth Modal - Lazy Loaded */}
      <Suspense fallback={null}>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => {
            setAuthModalOpen(false);
            loadSubscription();

            // GA4 Event: Sign Up (Macro-conversion) - DISABLED FOR PERFORMANCE
            // Using Firebase Analytics instead
            // const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
            // if (typeof window !== 'undefined' && gtag) {
            //   gtag('event', 'sign_up', {
            //     'method': 'Google',
            //     'event_category': 'conversion',
            //     'value': 0,
            //     'currency': 'USD'
            //   });
            //   console.log('✅ GA4: Sign-up event tracked');
            // }
            console.log('✅ Sign-up completed');
          }}
        />
      </Suspense>

      <main role="main" className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Email Verification Gate - Show if user is not verified */}
        {user && !user.emailVerified ? (
          <EmailVerification user={user} onVerified={handleEmailVerified} />
        ) : !analysis ? (
          <>
            {/* Hero Section - Ultra Attractive & Conversion-Focused */}
            <section aria-label="Hero section" className="text-center mb-16 mt-12 relative">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-soft"></div>
                <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-soft" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-soft" style={{ animationDelay: '2s' }}></div>
              </div>

              <div className="relative z-10">
                {/* Badge - Show free trial for non-users only */}
                {!user && !freeTrialUsed && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-6 py-3 rounded-full text-sm font-bold mb-8 shadow-button-hover animate-scale-in">
                    <svg className="w-5 h-5 animate-bounce-soft" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {t('hero.freeTrial')}
                  </div>
                )}

                {/* Main Headline - More Compelling */}
                <h1 className="text-display-2 md:text-display-1 gradient-text mb-6 leading-tight animate-fade-in px-4">
                  {t('hero.title')}
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">{t('hero.titleHighlight')}</span>
                </h1>

                {/* Subheadline - Benefit-Focused */}
                <p className="text-body-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8 px-4">
                  {t('hero.subtitle')}
                  <br className="hidden md:block" />
                  <span className="font-bold text-primary-700">{t('hero.subtitleBold')}</span> {t('hero.subtitleEnd')}
                </p>

                {/* Social Proof - Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-8 mb-10 text-sm text-gray-600 animate-fade-in px-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{t('hero.stats.emailsAnalyzed')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{t('hero.stats.averageRating')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">{t('hero.stats.instantResults')}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* GAME ENTRY POINTS */}
            <section className="max-w-4xl mx-auto mb-16 px-4">
              <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-indigo-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-pink-500 to-indigo-500"></div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black italic tracking-tighter mb-2">
                    <span className="text-red-500">SPICY</span> <span className="text-gray-900">VS</span> <span className="text-pink-500">SWEET</span>
                  </h2>
                  <p className="text-gray-500 font-medium">The Ultimate Live Interactive Game Show</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link to="/host" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-center hover:shadow-2xl transition-all hover:-translate-y-1">
                    <div className="relative z-10">
                      <div className="text-4xl mb-3">👨‍🍳</div>
                      <h3 className="text-xl font-bold text-white mb-2">HOST A GAME</h3>
                      <p className="text-slate-400 text-sm">Open your kitchen, invite friends, and run the show!</p>
                    </div>
                  </Link>

                  <Link to="/play" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-center hover:shadow-2xl transition-all hover:-translate-y-1">
                    <div className="relative z-10">
                      <div className="text-4xl mb-3">🎮</div>
                      <h3 className="text-xl font-bold text-white mb-2">JOIN A GAME</h3>
                      <p className="text-indigo-100 text-sm">Enter a room code and jump into the chaos!</p>
                    </div>
                  </Link>
                </div>
              </div>
            </section>

            {/* Success Message */}
            {successMessage && (
              <div className="max-w-4xl mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Free Trial Banner (only for non-authenticated users who haven't used trial) */}
            {!user && !freeTrialUsed && (
              <FreeTrialBanner onSignIn={() => setAuthModalOpen(true)} />
            )}

            {/* Usage Banner (only for authenticated users) */}
            {user && (
              <UsageBanner
                analysesUsed={subscription.analysesUsed}
                analysesLimit={subscription.analysesLimit}
                subscriptionStatus={subscription.subscriptionStatus}
                onUpgrade={handleUpgrade}
                isUpgrading={isUpgrading}
              />
            )}

            {/* Main Input - More prominent */}
            <div className="mb-8">
              <EmailInput
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                isAuthenticated={!!user}
                freeTrialUsed={freeTrialUsed}
              />

              {error && (
                <div className="max-w-4xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                      {error.includes('limit') && (
                        <button
                          onClick={handleUpgrade}
                          className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 underline"
                        >
                          Upgrade to Pro →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Features Grid - Enhanced & More Visual */}
            {/* LCP Optimization: Add ref for Intersection Observer */}
            <div ref={featuresRef} style={{ minHeight: showFeatures ? 'auto' : '400px' }}>
              {showFeatures && (
                <section aria-label="Features" className="max-w-6xl mx-auto mb-20">
                  <div className="text-center mb-12">
                    <h2 className="text-h2 text-gray-900 mb-4">{t('features.title')}</h2>
                    <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">{t('features.subtitle')}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="card-hover p-8 border-2 group">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-card flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300 shadow-button">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-h4 text-gray-900 mb-3">{t('features.instant.title')}</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">{t('features.instant.description')}</p>
                      <div className="flex items-center text-sm text-primary-700 font-semibold">
                        <span>{t('features.instant.link')}</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <div className="card-hover p-8 border-2 group">
                      <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-card flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300 shadow-button">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-h4 text-gray-900 mb-3">{t('features.metrics.title')}</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">{t('features.metrics.description')}</p>
                      <div className="flex items-center text-sm text-secondary-700 font-semibold">
                        <span>{t('features.metrics.link')}</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    <div className="card-hover p-8 border-2 group">
                      <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-card flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300 shadow-button">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-h4 text-gray-900 mb-3">{t('features.insights.title')}</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">{t('features.insights.description')}</p>
                      <div className="flex items-center text-sm text-accent-700 font-semibold">
                        <span>{t('features.insights.link')}</span>
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Pricing - Enhanced & More Compelling */}
            {!user && showFeatures && (
              <section aria-label="Pricing" className="max-w-6xl mx-auto mt-24 mb-16 px-4">
                <div className="text-center mb-16">
                  <h2 className="text-h2 text-gray-900 mb-4">{t('pricing.title')}</h2>
                  <p className="text-body-lg text-gray-600 max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Free Plan */}
                  <div className="card-lg p-8 border-2 hover:border-gray-300 transition-all duration-300 mt-6">
                    <div className="text-center">
                      <div className="inline-block mb-4">
                        <span className="badge-success text-sm px-4 py-1.5">{t('pricing.free.badge')}</span>
                      </div>
                      <h3 className="text-h3 text-gray-900 mb-2">{t('pricing.free.title')}</h3>
                      <div className="mb-8">
                        <span className="text-5xl font-extrabold text-gray-900">{t('pricing.free.price')}</span>
                        <span className="text-gray-600 text-lg">{t('pricing.free.period')}</span>
                      </div>
                      <ul className="text-left space-y-4 mb-8">
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span dangerouslySetInnerHTML={{ __html: t('pricing.free.features.analyses') }} />
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.free.features.metrics')}</span>
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.free.features.recommendations')}</span>
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.free.features.noCard')}</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="btn-outline w-full"
                      >
                        {t('pricing.free.cta')}
                      </button>
                    </div>
                  </div>

                  {/* Pro Plan - Enhanced */}
                  <div className="card-lg p-8 border-4 border-primary-500 relative transform hover:scale-105 transition-all duration-300 shadow-card-hover mt-6">
                    {/* Popular badge */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold px-6 py-2 rounded-full shadow-button-hover z-10 whitespace-nowrap">
                      {t('pricing.pro.badge')}
                    </div>

                    {/* Background gradient effect */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-48 h-48 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-full filter blur-3xl opacity-30"></div>

                    <div className="text-center relative z-10">
                      <div className="inline-block mb-4">
                        <span className="badge-primary text-sm px-4 py-1.5">{t('pricing.pro.badgeAlt')}</span>
                      </div>
                      <h3 className="text-h3 text-gray-900 mb-2">{t('pricing.pro.title')}</h3>
                      <div className="mb-2">
                        <span className="text-5xl font-extrabold gradient-text-primary">{t('pricing.pro.price')}</span>
                        <span className="text-gray-600 text-lg">{t('pricing.pro.period')}</span>
                      </div>
                      <p className="text-sm text-primary-700 font-semibold mb-8">{t('pricing.pro.perAnalysis')}</p>

                      <ul className="text-left space-y-4 mb-8">
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span dangerouslySetInnerHTML={{ __html: t('pricing.pro.features.analyses') }} />
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.pro.features.metrics')}</span>
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.pro.features.history')}</span>
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.pro.features.support')}</span>
                        </li>
                        <li className="flex items-start text-base">
                          <svg className="w-6 h-6 text-accent-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{t('pricing.pro.features.cancel')}</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="btn-primary w-full text-lg py-4 relative overflow-hidden group"
                      >
                        <span className="relative z-10">{t('pricing.pro.cta')}</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-3">{t('pricing.pro.trial')}</p>
                    </div>
                  </div>
                </div>

                {/* Money-back guarantee badge */}
                <div className="text-center mt-12">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{t('pricing.moneyBack')}</span>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          }>
            <AnalysisResults analysis={analysis} originalEmail={originalEmail} onReset={handleReset} />
          </Suspense>
        )}

      </main>

      {/* Footer */}
      <footer role="contentinfo" className="text-center mt-20 pt-10 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <p className="text-sm font-medium text-gray-600">{t('app.name')}</p>
        </div>
        <p className="text-xs text-gray-500 mb-2">{t('footer.poweredBy')}</p>
        <div className="text-xs text-gray-500">
          <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 underline">
            {t('footer.termsOfService')}
          </Link>
          {' • '}
          <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-700 underline">
            {t('footer.termsAndConditions')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
