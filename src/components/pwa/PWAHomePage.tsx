import { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Logo } from '../ui/Logo';
import { FoodLoader } from '../ui/FoodLoader';
import { LandscapeWarning } from '../ui/LandscapeWarning';
import { PWABackground } from './PWABackground';
import { FloatingMascots } from './FloatingMascots';
import { PWAPlayerProfile } from './PWAPlayerProfile';
import { PWAActionButtons } from './PWAActionButtons';
import { useOrientationLock } from '../../hooks/useOrientationLock';
import { useAuthUser } from '../../hooks/useAuthUser';
import { createRoom, joinRoom, AVATAR_LIST } from '../../services/gameService';
import { saveProfile } from '../../services/profileService';
import { safeStorage } from '../../utils/storage';

/**
 * PWA-specific homepage with Candy Crush-style design.
 * Shown only when the app is installed as a PWA (standalone mode).
 */
export function PWAHomePage() {
  const { t } = useTranslation(['home', 'common', 'errors']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading: profileLoading } = useAuthUser();

  // Lock orientation to portrait
  useOrientationLock(true);

  // UI state
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const hasAutoJoined = useRef(false);

  // Preload GameRoom for smooth transition
  useLayoutEffect(() => {
    import('../../pages/GameRoom');
  }, []);

  // Handle auto-join from URL code
  useLayoutEffect(() => {
    if (profileLoading) return;

    const codeFromUrl = searchParams.get('code');
    if (!codeFromUrl || hasAutoJoined.current) return;

    if (profile?.profileName && user) {
      hasAutoJoined.current = true;
      const validAvatar =
        profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
          ? profile.profileAvatar
          : 'burger';

      joinRoom(codeFromUrl, profile.profileName, validAvatar)
        .then(async (result) => {
          if (result) {
            safeStorage.setItem('spicy_player_id', result.playerId);
            safeStorage.setItem('spicy_room_code', codeFromUrl.toUpperCase());
            await saveProfile(profile.profileName, validAvatar);
            navigate(`/room/${codeFromUrl.toUpperCase()}`, { replace: true });
          }
        })
        .catch((err) => {
          console.error('Auto-join failed:', err);
          hasAutoJoined.current = false;
        });
    } else if (!user) {
      hasAutoJoined.current = true;
      sessionStorage.setItem('spicy_pending_join_code', codeFromUrl.toUpperCase());
      navigate('/login');
    }
  }, [profile, profileLoading, user, searchParams, navigate]);

  // Handle "Create Room"
  const handleCreateRoom = async () => {
    if (!profile?.profileName || !user || profileLoading) {
      navigate('/host');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const validAvatar =
        profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
          ? profile.profileAvatar
          : 'chili';

      const result = await createRoom(profile.profileName, validAvatar);
      if (result) {
        safeStorage.setItem('spicy_player_id', result.playerId);
        safeStorage.setItem('spicy_room_code', result.code);
        await saveProfile(profile.profileName, validAvatar);
        navigate(`/room/${result.code}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      navigate('/host');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Handle "Join Room"
  const handleJoinRoom = () => {
    setShowJoinInput(true);
  };

  // Submit join code
  const submitJoinCode = async () => {
    if (joinCode.length !== 4) return;
    setJoinError(null);

    if (!user) {
      sessionStorage.setItem('spicy_pending_join_code', joinCode.toUpperCase());
      navigate('/login');
      return;
    }

    if (!profile?.profileName || profileLoading) {
      sessionStorage.setItem('spicy_pending_join_code', joinCode.toUpperCase());
      navigate('/host');
      return;
    }

    setIsJoiningRoom(true);
    try {
      const validAvatar =
        profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
          ? profile.profileAvatar
          : 'burger';

      const result = await joinRoom(joinCode, profile.profileName, validAvatar);
      if (result) {
        safeStorage.setItem('spicy_player_id', result.playerId);
        safeStorage.setItem('spicy_room_code', joinCode.toUpperCase());
        await saveProfile(profile.profileName, validAvatar);
        navigate(`/room/${joinCode.toUpperCase()}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      if (err instanceof Error) {
        if (err.message.includes('PERMISSION_DENIED') || err.message.includes('Game already started')) {
          setJoinError(t('common:errors.gameAlreadyStarted'));
        } else if (err.message.includes('Room not found')) {
          setJoinError(t('common:errors.roomNotFound'));
        } else if (err.message.includes('Room is full')) {
          setJoinError(t('common:errors.roomFull'));
        } else {
          setJoinError(t('common:errors.generic'));
        }
      } else {
        setJoinError(t('common:errors.roomNotFound'));
      }
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Handle "Solo Mode"
  const handleSoloMode = () => {
    navigate('/solo');
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <PWABackground />

      {/* Floating mascots */}
      <FloatingMascots />

      {/* Landscape warning (CSS-controlled visibility) */}
      <LandscapeWarning />

      {/* Loading overlay */}
      <AnimatePresence>
        {(isJoiningRoom || isCreatingRoom) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <FoodLoader />
            <p className="mt-4 text-white/70">
              {isCreatingRoom ? t('creatingRoom') : t('joiningRoom')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className="pwa-main-content flex-1 flex flex-col relative z-20"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Header with logo */}
        <header className="flex items-center justify-center p-4">
          <div className="w-32 h-32">
            <Logo className="w-full h-full" />
          </div>
        </header>

        {/* Player profile */}
        <PWAPlayerProfile />

        {/* Action buttons */}
        <div className="flex-1 flex items-center justify-center py-4">
          <PWAActionButtons
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onSoloMode={handleSoloMode}
            isCreatingRoom={isCreatingRoom}
          />
        </div>
      </div>

      {/* Join code input modal */}
      <AnimatePresence>
        {showJoinInput && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinInput(false)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-full max-w-80 bg-slate-800 rounded-2xl p-6 border border-white/10 relative">
                <button
                  onClick={() => setShowJoinInput(false)}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-white/70 hover:text-white transition-colors"
                  aria-label={t('common:buttons.close')}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-white text-center mb-4">
                  {t('enterCode')}
                </h3>

                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                  placeholder="XXXX"
                  className="w-full text-center text-3xl font-bold tracking-[0.3em] bg-slate-700 text-white rounded-xl p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                  maxLength={4}
                />

                {joinError && <p className="text-red-400 text-sm text-center mb-4">{joinError}</p>}

                <button
                  onClick={submitJoinCode}
                  disabled={joinCode.length !== 4 || isJoiningRoom}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoiningRoom ? t('joining') : t('join.button')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
