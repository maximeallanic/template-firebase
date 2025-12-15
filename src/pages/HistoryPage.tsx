import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { useAnalysisHistory } from '../hooks/useAnalysisHistory';
import { Header } from '../components/Header';

interface HistoryPageProps {
  user: User | null;
  onSignIn: () => void;
  subscriptionStatus?: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ user, onSignIn, subscriptionStatus = 'free' }) => {
  const { analyses, isLoading, error } = useAnalysisHistory(50);
  const navigate = useNavigate();

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get score background color
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header user={user} onSignIn={onSignIn} subscriptionStatus={subscriptionStatus} />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your analysis history</p>
            <button
              onClick={onSignIn}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Sign In
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header user={user} onSignIn={onSignIn} subscriptionStatus={subscriptionStatus} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Analysis History
            </h1>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Analysis
            </Link>
          </div>
          <p className="text-gray-600">View and revisit your past email analyses</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && analyses.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Analyses Yet</h2>
            <p className="text-gray-600 mb-6">Start analyzing your cold emails to build your history</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Analyze Your First Email
            </button>
          </div>
        )}

        {/* Analysis List */}
        {!isLoading && !error && analyses.length > 0 && (
          <div className="grid gap-4">
            {analyses.map((record) => (
              <div
                key={record.id}
                onClick={() => navigate(`/analysis/${record.id}`)}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 cursor-pointer border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Content Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg ${getScoreBgColor(record.analysis.overallScore)} ${getScoreColor(record.analysis.overallScore)}`}>
                        {record.analysis.overallScore}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-500">{formatDate(record.createdAt)}</p>
                          {record.source === 'email' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                              Via Email
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 font-medium truncate">
                          {record.emailSubject ? `${record.emailSubject}` : record.emailContent.substring(0, 80)}...
                        </p>
                        {record.senderEmail && (
                          <p className="text-xs text-gray-500 mt-1">From: {record.senderEmail}</p>
                        )}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(record.analysis.scores).map(([key, scoreData]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          <span className="font-medium capitalize">{key}:</span>
                          <span className={getScoreColor(scoreData.score)}>{scoreData.score}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Arrow */}
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
