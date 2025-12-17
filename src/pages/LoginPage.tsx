import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signIn, signUp, signInWithGoogle, sendPasswordReset, auth } from '../services/firebase';
import { joinRoom, type Avatar, AVATAR_LIST } from '../services/gameService';
import { safeStorage } from '../utils/storage';
import { Logo } from '../components/Logo';
import { ChefHat, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'reset';

export function LoginPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // After successful login, handle redirect based on pending action
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Check for pending join code
                const pendingJoinCode = sessionStorage.getItem('spicy_pending_join_code');

                if (pendingJoinCode) {
                    sessionStorage.removeItem('spicy_pending_join_code');

                    // Check for profile
                    const storedName = safeStorage.getItem('spicy_profile_name')
                        || safeStorage.getItem('spicy_player_name')
                        || safeStorage.getItem('spicy_host_name');
                    const storedAvatar = (safeStorage.getItem('spicy_profile_avatar')
                        || safeStorage.getItem('spicy_player_avatar')
                        || safeStorage.getItem('spicy_host_avatar')) as Avatar | null;

                    if (storedName) {
                        // Has profile - join the room directly
                        try {
                            const validAvatar = storedAvatar && (AVATAR_LIST as string[]).includes(storedAvatar)
                                ? storedAvatar
                                : 'burger';

                            const result = await joinRoom(pendingJoinCode, storedName, validAvatar);
                            if (result) {
                                safeStorage.setItem('spicy_player_id', result.playerId);
                                safeStorage.setItem('spicy_room_code', pendingJoinCode);
                                navigate(`/room/${pendingJoinCode}`, { replace: true });
                                return;
                            }
                        } catch (err) {
                            console.error('Failed to join room after login:', err);
                        }
                    }
                    // No profile or join failed - go to host to create profile, but keep the pending code
                    sessionStorage.setItem('spicy_pending_join_code', pendingJoinCode);
                    navigate('/host', { replace: true });
                } else {
                    // No pending action - go to home
                    navigate('/', { replace: true });
                }
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await signIn(email, password);
            } else if (mode === 'register') {
                await signUp(email, password);
                setSuccess('Compte créé ! Vérifiez votre email.');
            } else if (mode === 'reset') {
                await sendPasswordReset(email);
                setSuccess('Email de réinitialisation envoyé !');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Échec de la connexion Google';
            if (errorMessage !== 'Sign-in cancelled') {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                {/* Header */}
                <div className="text-center mb-8 space-y-4">
                    <Logo className="h-16 md:h-20 mx-auto" />
                    <p className="text-indigo-200 font-medium flex items-center justify-center gap-2">
                        <ChefHat className="w-5 h-5" />
                        {mode === 'login' && 'Connectez-vous pour jouer'}
                        {mode === 'register' && 'Créez votre compte'}
                        {mode === 'reset' && 'Réinitialisez votre mot de passe'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-gray-100 text-slate-900 py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuer avec Google
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-gray-500 text-sm font-medium">OU</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-slate-950/60 border-2 border-indigo-500/30 rounded-xl p-4 pl-12 font-medium focus:border-pink-500 focus:outline-none transition-all text-white"
                                />
                            </div>
                        </div>

                        {mode !== 'reset' && (
                            <div>
                                <label className="block text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="******"
                                        required
                                        minLength={6}
                                        className="w-full bg-slate-950/60 border-2 border-indigo-500/30 rounded-xl p-4 pl-12 font-medium focus:border-pink-500 focus:outline-none transition-all text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/20 text-red-200 p-4 rounded-xl text-center font-medium text-sm border border-red-500/30">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/20 text-green-200 p-4 rounded-xl text-center font-medium text-sm border border-green-500/30">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-red-600 to-pink-600 py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-white"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'login' && 'Se connecter'}
                                    {mode === 'register' && 'Créer un compte'}
                                    {mode === 'reset' && 'Envoyer l\'email'}
                                    <ArrowRight className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Mode Switchers */}
                    <div className="text-center space-y-2 text-sm">
                        {mode === 'login' && (
                            <>
                                <button
                                    onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                                    className="text-indigo-300 hover:text-white transition-colors"
                                >
                                    Pas de compte ? <span className="font-bold">S'inscrire</span>
                                </button>
                                <br />
                                <button
                                    onClick={() => { setMode('reset'); setError(null); setSuccess(null); }}
                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    Mot de passe oublié ?
                                </button>
                            </>
                        )}
                        {mode === 'register' && (
                            <button
                                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                                className="text-indigo-300 hover:text-white transition-colors"
                            >
                                Déjà un compte ? <span className="font-bold">Se connecter</span>
                            </button>
                        )}
                        {mode === 'reset' && (
                            <button
                                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                                className="text-indigo-300 hover:text-white transition-colors"
                            >
                                Retour à la <span className="font-bold">Connexion</span>
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
