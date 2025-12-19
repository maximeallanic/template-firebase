import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from 'firebase/auth';
import { signOut, createPortalSession } from '../../services/firebase';
import { LanguageSelector } from '../LanguageSelector';
import { Logo } from '../ui/Logo';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  subscriptionStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({ user, onSignIn, subscriptionStatus = 'free' }) => {
  const { t } = useTranslation(['translation', 'common']);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setShowMenu(false);
      const { url } = await createPortalSession(window.location.origin);
      window.location.href = url;
    } catch (error: unknown) {
      console.error('Error opening portal:', error);
      const message = error instanceof Error ? error.message : 'Failed to open subscription management';
      alert(message);
    }
  };

  // Format subscription status for display
  const getPlanLabel = () => {
    if (subscriptionStatus === 'active' || subscriptionStatus === 'pro') {
      return t('common:plans.pro');
    }
    return t('common:plans.free');
  };

  return (
    <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40 shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Clickable to home */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-250">
            <Logo className="h-12 w-auto" />
          </Link>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <LanguageSelector />
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-button hover:bg-gray-100 transition-all duration-250"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-gray-700">{user.email}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-250 ${showMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    ></div>

                    {/* Dropdown menu */}
                    <div className="absolute right-0 mt-2 w-56 card-lg py-2 z-20 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{getPlanLabel()}</p>
                      </div>

                      <Link
                        to="/history"
                        onClick={() => setShowMenu(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-250"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('nav.history')}
                      </Link>

                      <button
                        onClick={handleManageSubscription}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors duration-250"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('nav.manageSubscription')}
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-250"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="btn-primary"
              >
                {t('nav.signIn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
