import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Game Modules
const HomePage = lazy(() => import('./pages/HomePage'));
const HostLobby = lazy(() => import('./pages/HostLobby'));
const JoinGame = lazy(() => import('./pages/JoinGame'));
const GameRoom = lazy(() => import('./pages/GameRoom'));

function App() {
  // Loading fallback component
  const LoadingFallback = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-gray-400 font-medium tracking-widest uppercase">Loading Kitchen...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Game Routes */}
        <Route path="/host" element={<HostLobby />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/room/:id" element={<GameRoom />} />
      </Routes>
    </Suspense>
  );
}

export default App;
