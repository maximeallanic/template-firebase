import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { UserBar } from '../components/auth/UserBar';
import { Logo } from '../components/ui/Logo';
import { AvatarIcon } from '../components/AvatarIcon';
import { PhaseIcon } from '../components/game/PhaseIcon';
import { createRoom, joinRoom, AVATAR_LIST } from '../services/gameService';
import { safeStorage } from '../utils/storage';
import { saveProfile } from '../services/profileService';
import { useAuthUser } from '../hooks/useAuthUser';
import { Users, Zap, Trophy, ChefHat, Flame, Candy, X } from 'lucide-react';

// Floating mascots configuration
const floatingMascots = [
  { avatar: 'burger', x: '5%', y: '15%', delay: 0, duration: 6 },
  { avatar: 'pizza', x: '90%', y: '20%', delay: 1, duration: 7 },
  { avatar: 'taco', x: '15%', y: '75%', delay: 2, duration: 5 },
  { avatar: 'sushi', x: '85%', y: '70%', delay: 0.5, duration: 6.5 },
  { avatar: 'donut', x: '8%', y: '45%', delay: 1.5, duration: 5.5 },
  { avatar: 'icecream', x: '92%', y: '45%', delay: 2.5, duration: 7.5 },
  { avatar: 'chili', x: '25%', y: '10%', delay: 3, duration: 6 },
  { avatar: 'cupcake', x: '75%', y: '85%', delay: 1.2, duration: 5.8 },
] as const;

export default function HomePage() {
  const { t } = useTranslation(['home', 'common', 'errors']);
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useAuthUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [joinCode, setJoinCode] = useState(searchParams.get('code')?.toUpperCase() || '');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const hasAutoJoined = useRef(false);

  // Handle error from URL (e.g., kicked from room)
  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      // Map error codes to translation keys
      const errorMessages: Record<string, string> = {
        'notInRoom': t('errors:room.notInRoom'),
      };
      setUrlError(errorMessages[errorCode] || t('errors:general.somethingWrong'));
      // Remove error from URL without triggering navigation
      searchParams.delete('error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  // Auto-join if code from URL - triggers login if needed
  useEffect(() => {
    // Wait for profile to be loaded from Firestore
    if (profileLoading) return;

    const codeFromUrl = searchParams.get('code');
    if (!codeFromUrl || hasAutoJoined.current) return;

    // If user has profile AND is authenticated, auto-join
    if (profile?.profileName && user) {
      hasAutoJoined.current = true;
      const validAvatar = profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
        ? profile.profileAvatar
        : 'burger';

      joinRoom(codeFromUrl, profile.profileName, validAvatar).then(async result => {
        if (result) {
          safeStorage.setItem('spicy_player_id', result.playerId);
          safeStorage.setItem('spicy_room_code', codeFromUrl.toUpperCase());
          // Save profile to Firestore (in case it's not already there)
          await saveProfile(profile.profileName, validAvatar);
          navigate(`/room/${codeFromUrl.toUpperCase()}`, { replace: true });
        }
      }).catch(err => {
        console.error('Auto-join failed:', err);
        hasAutoJoined.current = false;
        setJoinError(t('common:errors.roomNotFound'));
      });
    } else if (!user) {
      // Not logged in - save code and redirect to login page
      // User can choose Google OR email/password login
      hasAutoJoined.current = true;
      sessionStorage.setItem('spicy_pending_join_code', codeFromUrl.toUpperCase());
      navigate('/login'); // Dedicated login page with both options
    }
  }, [profile, profileLoading, user, searchParams, navigate, t]);

  // Preload GameRoom for smooth transition (no Suspense fallback flash)
  useLayoutEffect(() => {
    import('./GameRoom');
  }, []);

  // Handle "Create Room" - if user has profile AND is authenticated, create directly; otherwise go to /host
  const handleCreateRoom = async () => {
    // Must have profile AND be authenticated to create room directly
    if (!profile?.profileName || !user || profileLoading) {
      // No profile or not authenticated - go to /host (AuthRequired will handle login)
      navigate('/host');
      return;
    }

    // Has profile AND authenticated - create room directly
    setIsCreatingRoom(true);
    try {
      const validAvatar = profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
        ? profile.profileAvatar
        : 'chili';

      const result = await createRoom(profile.profileName, validAvatar);
      if (result) {
        safeStorage.setItem('spicy_player_id', result.playerId);
        safeStorage.setItem('spicy_room_code', result.code);
        // Save profile to Firestore (in case it's not already there)
        await saveProfile(profile.profileName, validAvatar);
        navigate(`/room/${result.code}`);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      // Fallback to /host on error
      navigate('/host');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Handle "Join Room" - requires profile and auth
  const handleJoinRoom = async () => {
    if (joinCode.length !== 4) return;
    setJoinError(null);

    // If not authenticated, save code and redirect to login page
    if (!user) {
      sessionStorage.setItem('spicy_pending_join_code', joinCode.toUpperCase());
      navigate('/login'); // Dedicated login page with both options
      return;
    }

    // If no profile or still loading, redirect to /host to create one (with pending code)
    if (!profile?.profileName || profileLoading) {
      sessionStorage.setItem('spicy_pending_join_code', joinCode.toUpperCase());
      navigate('/host');
      return;
    }

    // Has profile AND authenticated - join room directly
    setIsJoiningRoom(true);
    try {
      const validAvatar = profile.profileAvatar && (AVATAR_LIST as string[]).includes(profile.profileAvatar)
        ? profile.profileAvatar
        : 'burger';

      const result = await joinRoom(joinCode, profile.profileName, validAvatar);
      if (result) {
        safeStorage.setItem('spicy_player_id', result.playerId);
        safeStorage.setItem('spicy_room_code', joinCode.toUpperCase());
        // Save profile to Firestore (in case it's not already there)
        await saveProfile(profile.profileName, validAvatar);
        navigate(`/room/${joinCode.toUpperCase()}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setJoinError('Room introuvable');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background is now handled by SharedBackground in App.tsx */}

      {/* Loading Overlay - Only for joining, not for creating (smooth transition) */}
      <AnimatePresence>
        {isJoiningRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 rounded-full mb-4 border-pink-500/30 border-t-pink-500"
            />
            <p className="text-white font-bold text-lg">
              {t('loading.joining')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {urlError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <span className="font-medium">{urlError}</span>
            <button
              onClick={() => setUrlError(null)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label={t('common:buttons.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UserBar */}
      <div className="fixed top-4 right-0 z-50">
        <UserBar attachedToEdge />
      </div>

      {/* Floating Food Mascots - fade out on page exit */}
      {floatingMascots.map((mascot, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none opacity-20 hidden md:block"
          style={{ left: mascot.x, top: mascot.y }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 0.2,
            y: [0, -20, 0],
            rotate: [-5, 5, -5],
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.3 },
            y: { duration: mascot.duration, repeat: Infinity, delay: mascot.delay, ease: "easeInOut" },
            rotate: { duration: mascot.duration, repeat: Infinity, delay: mascot.delay, ease: "easeInOut" },
          }}
        >
          <AvatarIcon avatar={mascot.avatar} size={64} />
        </motion.div>
      ))}

      <div className="max-w-6xl w-full z-10 flex flex-col items-center pt-8">

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          {/* Main Logo */}
          <div className="w-full max-w-4xl mx-auto flex justify-center">
            <Logo className="w-full max-w-2xl h-auto" />
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-2 mt-4"
          >
            <p className="text-2xl md:text-3xl text-white font-bold">
              {t('hero.tagline')}
            </p>
            <p className="text-lg text-indigo-300/80 max-w-2xl mx-auto">
              {t('hero.description', {
                replace: { spicy: t('common:teams.spicy'), sweet: t('common:teams.sweet') }
              }).split(/<spicy>|<\/spicy>|<sweet>|<\/sweet>/).map((part, i) => {
                if (i === 1) return <span key={i} className="text-spicy-400 font-bold"> {part} </span>;
                if (i === 3) return <span key={i} className="text-sweet-400 font-bold"> {part} </span>;
                return part;
              })}
            </p>
          </motion.div>
        </motion.div>

        {/* How It Works - Quick Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-6 md:gap-12 mb-12"
        >
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm font-medium">{t('features.players')}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-sm font-medium">{t('features.challenges')}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-200">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium">{t('features.winner')}</span>
          </div>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-16"
        >
          {/* Host Card */}
          <button onClick={handleCreateRoom} disabled={isCreatingRoom} className="block group text-left w-full">
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="relative h-72 rounded-3xl bg-gradient-to-br from-red-900/40 to-orange-900/20 backdrop-blur-lg border-2 border-red-500/30 p-8 flex flex-col items-center justify-center text-center overflow-hidden transition-all hover:border-red-500/60 hover:shadow-2xl hover:shadow-red-500/20"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-orange-500/0 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-all duration-500"></div>

              {/* Icon */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
                  <ChefHat className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-6 h-6 text-orange-400" />
                </motion.div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{t('create.title')}</h2>
              <p className="text-red-200/80 text-sm mb-4">
                {t('create.subtitle')}
              </p>

              <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm tracking-wide shadow-lg opacity-80 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                {t('create.button')}
              </div>
            </motion.div>
          </button>

          {/* Join Card */}
          <div className="block group">
            <motion.div
              whileHover={{ scale: 1.03, y: -5 }}
              className="relative h-72 rounded-3xl bg-gradient-to-br from-pink-900/40 to-purple-900/20 backdrop-blur-lg border-2 border-pink-500/30 p-8 flex flex-col items-center justify-center text-center overflow-hidden transition-all hover:border-pink-500/60 hover:shadow-2xl hover:shadow-pink-500/20"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500 pointer-events-none"></div>

              {/* Icon */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Candy className="w-6 h-6 text-pink-400" />
                </motion.div>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{t('join.title')}</h2>
              <p className="text-pink-200/80 text-sm mb-4">
                {t('join.subtitle')}
              </p>

              {/* Input + Button grouped */}
              <div className="flex items-stretch">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null); }}
                  placeholder={t('join.placeholder')}
                  maxLength={4}
                  className="w-24 h-11 px-3 rounded-l-full bg-white/10 border border-r-0 border-pink-500/30 text-white text-center font-bold text-lg tracking-widest uppercase placeholder:text-pink-300/50 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/30 focus:z-10"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={joinCode.length !== 4 || isJoiningRoom}
                  className="h-11 px-6 rounded-r-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-pink-500/30 transition-all"
                >
                  {isJoiningRoom ? '...' : t('join.button')}
                </button>
              </div>
              {joinError && (
                <p className="text-red-400 text-xs font-medium mt-2">{joinError}</p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Game Phases Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="w-full max-w-4xl mb-16"
        >
          <h3 className="text-center text-lg font-bold text-indigo-300 mb-6 uppercase tracking-wider">
            {t('phases.title')}
          </h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4 sm:gap-2 md:gap-4">
            {[
              { key: 'tenders', icon: 'nuggets' as const, color: 'from-amber-500 to-orange-500' },
              { key: 'sucreSale', icon: 'sweetysalty' as const, color: 'from-pink-400 to-amber-500' },
              { key: 'laCarte', icon: 'menus' as const, color: 'from-emerald-500 to-teal-500' },
              { key: 'laNote', icon: 'addition' as const, color: 'from-blue-500 to-indigo-500' },
              { key: 'burgerUltime', icon: 'burger' as const, color: 'from-red-500 to-pink-500' },
            ].map((phase, i) => (
              <motion.div
                key={phase.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
                className="p-3 text-center transition-colors group"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto flex items-center justify-center mb-3 hover:scale-110 transition-transform duration-300">
                  <PhaseIcon phase={phase.icon} size={64} className="md:hidden drop-shadow-lg" />
                  <PhaseIcon phase={phase.icon} size={80} className="hidden md:block drop-shadow-xl" />
                </div>
                <p className="text-xs md:text-sm text-indigo-100 font-bold truncate tracking-wide mb-1">{t(`phases.${phase.key}.name`)}</p>
                <p className="text-[10px] md:text-xs text-indigo-300/80 leading-tight max-w-[100px] md:max-w-full mx-auto">{t(`phases.${phase.key}.description`)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-4 text-center text-sm font-mono tracking-widest uppercase text-white/20">
          <div className="mb-4">
            Spicy VS Sweet • {new Date().getFullYear()} • {t('common:footer.copyright')}
          </div>
          <div className="flex justify-center gap-4">
            <Link to="/terms" className="hover:text-white/50 transition-colors">{t('common:footer.terms')}</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-white/50 transition-colors">{t('common:footer.privacy')}</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
