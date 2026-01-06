/**
 * PersistentHeader - Header that stays visible during page transitions
 * Contains UserBar (web) or QuickSettings (PWA) depending on context
 * Also includes back button on relevant pages in PWA mode
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { UserBar } from '../auth/UserBar';
import { QuickSettings } from '../pwa/QuickSettings';
import { ProfileEditModal } from '../auth/ProfileEditModal';
import { useAuthUser } from '../../hooks/useAuthUser';
import { useAppInstall } from '../../hooks/useAppInstall';
import type { Avatar } from '../../types/gameTypes';

// Routes where the header should NOT be shown (game is in progress, etc.)
const HIDDEN_ROUTES = [
    '/room/', // Active multiplayer game
    '/solo/game', // Active solo game
    '/login', // Login page has its own layout
];

// Routes where we should show the back button (PWA only)
const BACK_BUTTON_ROUTES = [
    '/host',
    '/solo',
    '/leaderboard',
];

export function PersistentHeader() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { profile } = useAuthUser();
    const { isInstalled } = useAppInstall();
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    // Check if header should be hidden on this route
    const shouldHide = HIDDEN_ROUTES.some(route => location.pathname.startsWith(route));
    if (shouldHide) return null;

    // Check if this is a route with back button
    const showBackButton = isInstalled && BACK_BUTTON_ROUTES.some(route => location.pathname.startsWith(route));

    return (
        <>
            <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between">
                {/* Back button (PWA only, on specific routes) */}
                {showBackButton ? (
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors h-12"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>{t('buttons.back', 'Retour')}</span>
                    </button>
                ) : (
                    <div />
                )}

                {/* Settings/Profile button */}
                <div className="flex items-center h-12">
                    {isInstalled ? (
                        <QuickSettings onEditProfile={() => setShowProfileEdit(true)} />
                    ) : (
                        <UserBar />
                    )}
                </div>
            </div>

            {/* Profile Edit Modal - for PWA mode */}
            <ProfileEditModal
                isOpen={showProfileEdit}
                onClose={() => setShowProfileEdit(false)}
                currentName={profile?.profileName || ''}
                currentAvatar={(profile?.profileAvatar as Avatar) || 'burger'}
                onSave={() => setShowProfileEdit(false)}
            />
        </>
    );
}
