import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { onAuthChange } from './services/firebase';

// Lazy load route components for better code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(module => ({ default: module.HistoryPage })));
const AnalysisDetailPage = lazy(() => import('./pages/AnalysisDetailPage').then(module => ({ default: module.AnalysisDetailPage })));
const EmailActionHandler = lazy(() => import('./components/EmailActionHandler'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));

function App() {
  const [user, setUser] = useState<User | null>(null);

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage user={user} setUser={setUser} />} />
        <Route
          path="/history"
          element={
            <HistoryPage
              user={user}
              onSignIn={() => {}}
              subscriptionStatus="free"
            />
          }
        />
        <Route
          path="/analysis/:id"
          element={
            <AnalysisDetailPage
              user={user}
              onSignIn={() => {}}
              subscriptionStatus="free"
            />
          }
        />
        <Route path="/auth/action" element={<EmailActionHandler />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      </Routes>
    </Suspense>
  );
}

export default App;
