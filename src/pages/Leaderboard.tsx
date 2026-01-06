/**
 * Leaderboard Page
 * Displays solo mode high scores
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Medal, Clock, Target, Zap } from 'lucide-react';
import { FoodLoader } from '../components/ui/FoodLoader';
import { getTopScores, getMyBestScore, getMyRank, type LeaderboardEntry } from '../services/leaderboardService';
import { AvatarIcon } from '../components/AvatarIcon';
import { useAuthUser } from '../hooks/useAuthUser';
import { useAppInstall } from '../hooks/useAppInstall';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { UserBar } from '../components/auth/UserBar';
import { ProfileEditModal } from '../components/auth/ProfileEditModal';
import { QuickSettings } from '../components/pwa/QuickSettings';
import { PWABackButton } from '../components/pwa/PWABackButton';
import type { Avatar } from '../types/gameTypes';

export default function Leaderboard() {
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { user, profile } = useAuthUser();
    const { isInstalled } = useAppInstall();
    const prefersReducedMotion = useReducedMotion();

    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [myBest, setMyBest] = useState<LeaderboardEntry | null>(null);
    const [myRank, setMyRank] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    useEffect(() => {
        async function loadLeaderboard() {
            try {
                setLoading(true);
                setError(null);

                const [topScores, bestScore] = await Promise.all([
                    getTopScores(50),
                    user ? getMyBestScore() : Promise.resolve(null),
                ]);

                setScores(topScores);
                setMyBest(bestScore);

                // Récupérer le rang si l'utilisateur a un score
                if (bestScore) {
                    const rank = await getMyRank(bestScore.score);
                    setMyRank(rank);
                } else {
                    setMyRank(null);
                }
            } catch (err) {
                console.error('[Leaderboard] Load error:', err);
                setError('error');
            } finally {
                setLoading(false);
            }
        }

        loadLeaderboard();
    }, [user]);

    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatFrenchOrdinal = (n: number): string => {
        if (n === 1) return '1er';
        return `${n}e`;
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return <Medal className="w-6 h-6 text-yellow-400" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-300" />;
            case 3:
                return <Medal className="w-6 h-6 text-amber-600" />;
            default:
                return <span className="w-6 text-center font-mono text-gray-400">{rank}</span>;
        }
    };

    const isUserInTop50 = useMemo(() => {
        if (!user || !myBest) return false;
        return scores.some(entry => entry.playerId === user.uid);
    }, [user, myBest, scores]);

    return (
        <div className="min-h-screen flex flex-col p-4 text-white">
            {/* UserBar / QuickSettings (PWA) */}
            <div className="fixed top-4 right-0 z-50">
                {isInstalled ? (
                    <QuickSettings onEditProfile={() => setShowProfileEdit(true)} />
                ) : (
                    <UserBar />
                )}
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <PWABackButton />
            </div>

            {/* Title */}
            <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-10 h-10 text-yellow-400" />
                    <h1 className="text-4xl font-black">{t('solo.leaderboardTitle')}</h1>
                </div>
                <p className="text-gray-400">{t('solo.leaderboardSubtitle')}</p>
            </motion.div>

            {/* My Best Score */}
            {myBest && (
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl p-4 mb-6 max-w-2xl mx-auto w-full"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-orange-400 font-bold flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            {t('solo.myBestScore')}
                        </div>
                        {myRank !== null && (
                            <div className="flex items-center gap-1 text-orange-300 font-bold">
                                <Trophy className="w-4 h-4" />
                                <span>{formatFrenchOrdinal(myRank)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <AvatarIcon avatar={myBest.playerAvatar} size={48} />
                        <div className="flex-1">
                            <div className="font-bold text-lg">{myBest.playerName}</div>
                            <div className="text-sm text-gray-400 flex gap-4">
                                <span className="flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    {myBest.accuracy}%
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatTime(myBest.totalTimeMs)}
                                </span>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-orange-400">
                            {myBest.score}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-4">
                        <FoodLoader size="lg" />
                    </div>
                    <p className="text-gray-400">{t('solo.loadingLeaderboard')}</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-center py-20">
                    <p className="text-red-400 mb-4">{t('solo.errorOccurred')}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-lg transition-colors"
                    >
                        {t('buttons.retry')}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && scores.length === 0 && (
                <div className="text-center py-20">
                    <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{t('solo.noScores')}</h3>
                    <p className="text-gray-400 mb-6">{t('solo.beFirstToPlay')}</p>
                    <button
                        onClick={() => navigate('/solo')}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 px-6 py-3 rounded-xl font-bold transition-all"
                    >
                        {t('solo.playSolo')}
                    </button>
                </div>
            )}

            {/* Leaderboard List */}
            {!loading && !error && scores.length > 0 && (
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto w-full"
                >
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-sm text-gray-500 font-bold uppercase">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">{t('solo.player')}</div>
                        <div className="col-span-2 text-center">{t('solo.accuracy')}</div>
                        <div className="col-span-2 text-center">{t('solo.time')}</div>
                        <div className="col-span-2 text-right">{t('labels.score')}</div>
                    </div>

                    {/* Scores */}
                    <div className="space-y-2">
                        {scores.map((entry, idx) => {
                            const rank = idx + 1;
                            const isMe = user && entry.playerId === user.uid;

                            return (
                                <motion.div
                                    key={entry.id}
                                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -20 }}
                                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl ${
                                        isMe
                                            ? 'bg-orange-500/20 border border-orange-500/30'
                                            : rank <= 3
                                            ? 'bg-white/10'
                                            : 'bg-white/5'
                                    }`}
                                >
                                    <div className="col-span-1 flex items-center">
                                        {getRankBadge(rank)}
                                    </div>
                                    <div className="col-span-5 flex items-center gap-3">
                                        <AvatarIcon avatar={entry.playerAvatar} size={32} />
                                        <span className={`font-bold truncate ${isMe ? 'text-orange-400' : ''}`}>
                                            {entry.playerName}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center text-gray-400">
                                        {entry.accuracy}%
                                    </div>
                                    <div className="col-span-2 text-center text-gray-400 font-mono">
                                        {formatTime(entry.totalTimeMs)}
                                    </div>
                                    <div className={`col-span-2 text-right font-black text-xl ${
                                        rank === 1 ? 'text-yellow-400' :
                                        rank === 2 ? 'text-gray-300' :
                                        rank === 3 ? 'text-amber-600' :
                                        'text-white'
                                    }`}>
                                        {entry.score}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Position de l'utilisateur (si pas dans le top 50) */}
            {!loading && !error && myBest && myRank !== null && !isUserInTop50 && (
                <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    className="max-w-2xl mx-auto w-full mt-6"
                >
                    {/* Séparateur */}
                    <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                        <span>• • •</span>
                    </div>

                    {/* Ligne utilisateur */}
                    <div className="grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
                        <div className="col-span-1 flex items-center">
                            <span className="w-6 text-center font-mono text-orange-400">{myRank}</span>
                        </div>
                        <div className="col-span-5 flex items-center gap-3">
                            <AvatarIcon avatar={myBest.playerAvatar} size={32} />
                            <span className="font-bold truncate text-orange-400">{myBest.playerName}</span>
                        </div>
                        <div className="col-span-2 text-center text-gray-400">{myBest.accuracy}%</div>
                        <div className="col-span-2 text-center text-gray-400 font-mono">{formatTime(myBest.totalTimeMs)}</div>
                        <div className="col-span-2 text-right font-black text-xl text-orange-400">{myBest.score}</div>
                    </div>
                </motion.div>
            )}

            {/* Play CTA */}
            {!loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2"
                >
                    <button
                        onClick={() => navigate('/solo')}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Zap className="w-5 h-5" />
                        {t('solo.playSolo')}
                    </button>
                </motion.div>
            )}

            {/* Profile Edit Modal - for PWA mode */}
            <ProfileEditModal
                isOpen={showProfileEdit}
                onClose={() => setShowProfileEdit(false)}
                currentName={profile?.profileName || ''}
                currentAvatar={(profile?.profileAvatar as Avatar) || 'burger'}
                onSave={() => setShowProfileEdit(false)}
            />
        </div>
    );
}
