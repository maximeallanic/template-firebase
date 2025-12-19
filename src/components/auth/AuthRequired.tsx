import { useState, useEffect, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { auth, onAuthChange, resendVerificationEmail } from '../../services/firebase';
import type { User } from '../../services/firebase';
import { Mail, RefreshCw } from 'lucide-react';

// Lazy load LoginPage to avoid circular import and improve code splitting
const LoginPage = lazy(() => import('../../pages/LoginPage').then(m => ({ default: m.LoginPage })));

interface AuthRequiredProps {
    children: ReactNode;
    requireEmailVerified?: boolean;
}

export function AuthRequired({ children, requireEmailVerified = true }: AuthRequiredProps) {
    // Initialize with current auth state to avoid loading flash when user is already authenticated
    const [user, setUser] = useState<User | null | undefined>(() => auth.currentUser ?? undefined);
    const [loading, setLoading] = useState(() => auth.currentUser === null);
    const [resendingEmail, setResendingEmail] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthChange((authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleResendEmail = async () => {
        setResendingEmail(true);
        setResendSuccess(false);
        try {
            await resendVerificationEmail();
            setResendSuccess(true);
        } catch (error) {
            console.error('Failed to resend verification email:', error);
        } finally {
            setResendingEmail(false);
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-gray-400 font-medium tracking-widest uppercase">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Suspense fallback={
                <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500" />
                </div>
            }>
                <LoginPage disableAutoRedirect />
            </Suspense>
        );
    }

    // Check email verification for email/password users (Google users are auto-verified)
    if (requireEmailVerified && !user.emailVerified && user.providerData[0]?.providerId === 'password') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 flex items-center justify-center p-6">
                <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-10 h-10 text-yellow-500" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Vérifiez votre email</h2>
                        <p className="text-gray-400">
                            Un email de vérification a été envoyé à <span className="text-white font-medium">{user.email}</span>.
                            Cliquez sur le lien pour activer votre compte.
                        </p>
                    </div>

                    {resendSuccess && (
                        <div className="bg-green-500/20 text-green-200 p-3 rounded-xl text-sm border border-green-500/30">
                            Email envoyé avec succès !
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleRefresh}
                            className="w-full bg-gradient-to-r from-red-600 to-pink-600 py-3 rounded-xl font-bold text-white hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" />
                            J'ai vérifié mon email
                        </button>

                        <button
                            onClick={handleResendEmail}
                            disabled={resendingEmail}
                            className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                        >
                            {resendingEmail ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                        </button>
                    </div>

                    <p className="text-gray-500 text-sm">
                        Vérifiez aussi vos spams si vous ne trouvez pas l'email.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
