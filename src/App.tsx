import { Suspense, lazy, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import { AuthRequired } from './components/auth/AuthRequired';
import { PageTransition } from './components/ui/PageTransition';
import { SharedBackground, type BackgroundVariant } from './components/ui/SharedBackground';

// Game Modules
const HomePage = lazy(() => import('./pages/HomePage'));
const HostLobby = lazy(() => import('./pages/HostLobby'));
const GameRoom = lazy(() => import('./pages/GameRoom'));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

// Legal Pages
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

function App() {
  const location = useLocation();

  // Determine background variant based on current route
  const bgVariant = useMemo((): BackgroundVariant => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/host' || path === '/login') return 'lobby';
    if (path === '/terms' || path === '/privacy') return 'legal';
    if (path.startsWith('/room/')) return 'game';
    return 'home';
  }, [location.pathname]);

  // Minimal loading fallback - just a small spinner (background from SharedBackground)
  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
    </div>
  );

  return (
    <LayoutGroup>
      {/* Shared background - outside AnimatePresence for smooth transitions */}
      <SharedBackground variant={bgVariant} />

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
    </LayoutGroup>
  );
}

export default App;
