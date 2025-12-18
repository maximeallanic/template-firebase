import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary for catching and displaying errors in the game
 */
export class GameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('GameErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">
                            Oups ! Une erreur s'est produite
                        </h2>

                        <p className="text-slate-400 mb-6">
                            Le jeu a rencontre un probleme inattendu. Vous pouvez essayer de recharger ou retourner a l'accueil.
                        </p>

                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400">
                                    Details techniques
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-900 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleRetry}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reessayer
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold py-3 px-4 rounded-xl transition-colors"
                            >
                                Accueil
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
