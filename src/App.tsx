import { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { AuthRequired } from './components/auth/AuthRequired';
import { ProfileGate } from './components/auth/ProfileGate';
import { PageTransition } from './components/ui/PageTransition';
import { SharedBackground, type BackgroundVariant } from './components/ui/SharedBackground';
import { FoodLoader } from './components/ui/FoodLoader';
import { PersistentHeader } from './components/layout/PersistentHeader';

// Game Modules
const HomePage = lazy(() => import('./pages/HomePage'));
const HostLobby = lazy(() => import('./pages/HostLobby'));
const GameRoom = lazy(() => import('./pages/GameRoom'));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

// Solo Mode
const SoloSetup = lazy(() => import('./pages/SoloSetup'));
const SoloGame = lazy(() => import('./pages/SoloGame'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));

// Legal Pages
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

function App() {
  const location = useLocation();

  // Determine background variant based on current route
  const bgVariant = useMemo((): BackgroundVariant => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/host' || path === '/login' || path === '/solo' || path === '/leaderboard') return 'lobby';
    if (path === '/terms' || path === '/privacy') return 'legal';
    if (path.startsWith('/room/') || path.startsWith('/solo/')) return 'game';
    return 'home';
  }, [location.pathname]);

  // Minimal loading fallback - cooking dots loader (background from SharedBackground)
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <FoodLoader size="lg" />
    </div>
  );

  return (
    <LayoutGroup>
      {/* Shared background - outside AnimatePresence for smooth transitions */}
      <SharedBackground variant={bgVariant} />

      {/* Profile gate - shows mandatory setup modal for users without complete profile */}
      <ProfileGate>
        {/* Persistent header - outside AnimatePresence to stay visible during transitions */}
        <PersistentHeader />

        <Suspense fallback={<LoadingFallback />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <PageTransition>
              <HomePage />
            </PageTransition>
          } />

          {/* Game Routes - Require Authentication */}
          <Route path="/host" element={
            <AuthRequired>
              <PageTransition>
                <HostLobby />
              </PageTransition>
            </AuthRequired>
          } />
          <Route path="/room/:id" element={
            <AuthRequired>
              <PageTransition>
                <GameRoom />
              </PageTransition>
            </AuthRequired>
          } />

          {/* Solo Mode Routes */}
          <Route path="/solo" element={
            <AuthRequired>
              <PageTransition>
                <SoloSetup />
              </PageTransition>
            </AuthRequired>
          } />
          <Route path="/solo/game" element={
            <AuthRequired>
              <PageTransition>
                <SoloGame />
              </PageTransition>
            </AuthRequired>
          } />
          <Route path="/leaderboard" element={
            <PageTransition>
              <Leaderboard />
            </PageTransition>
          } />

          {/* Login Page - handles redirect after auth */}
          <Route path="/login" element={
            <PageTransition>
              <LoginPage />
            </PageTransition>
          } />

          {/* Legal Pages */}
          <Route path="/terms" element={
            <PageTransition>
              <TermsAndConditions />
            </PageTransition>
          } />
          <Route path="/privacy" element={
            <PageTransition>
              <TermsOfService />
            </PageTransition>
          } />
          </Routes>
        </AnimatePresence>
      </Suspense>
      </ProfileGate>
    </LayoutGroup>
  );
}

export default App;
