import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { User } from 'firebase/auth';
import { Header } from '../components/Header';
import { AnalysisResults } from '../components/AnalysisResults';
import { getAnalysisById } from '../services/firebase';
import type { AnalysisRecord } from '../types/analysis';

interface AnalysisDetailPageProps {
  user: User | null;
  onSignIn: () => void;
  subscriptionStatus?: string;
}

export const AnalysisDetailPage: React.FC<AnalysisDetailPageProps> = ({ user, onSignIn, subscriptionStatus = 'free' }) => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!id) {
      setError('Invalid analysis ID');
      setIsLoading(false);
      return;
    }

    const loadAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAnalysisById(id);

        if (!data) {
          setError('Analysis not found');
        } else {
          setAnalysis(data);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load analysis';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysis();
  }, [id, user]);

  const handleReset = () => {
    navigate('/');
  };

  // Not authenticated
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
            <p className="text-gray-600 mb-6">Please sign in to view this analysis</p>
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

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header user={user} onSignIn={onSignIn} subscriptionStatus={subscriptionStatus} />
        <main className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading analysis...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error or Not Found
  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Header user={user} onSignIn={onSignIn} subscriptionStatus={subscriptionStatus} />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This analysis does not exist or you do not have access to it'}</p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                New Analysis
              </Link>
              <Link
                to="/history"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-8 rounded-xl transition-all duration-200"
              >
                View History
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success - Show Analysis
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header user={user} onSignIn={onSignIn} subscriptionStatus={subscriptionStatus} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link to="/history" className="hover:text-blue-600 transition-colors">
            History
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Analysis</span>
        </div>

        {/* Analysis Metadata */}
        <div className="mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {analysis.source === 'email' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Analyzed via Email
              </span>
            )}
          </div>
          {analysis.senderEmail && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">From:</span> {analysis.senderEmail}
            </p>
          )}
          {analysis.emailSubject && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Subject:</span> {analysis.emailSubject}
            </p>
          )}
        </div>

        {/* Share Button */}
        <div className="mb-4 flex justify-end">

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              // Could add a toast notification here
              alert('Link copied to clipboard!');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>

        <AnalysisResults
          analysis={analysis.analysis}
          originalEmail={analysis.emailContent}
          onReset={handleReset}
        />
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="text-center mt-20 pt-10 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <p className="text-sm font-medium text-gray-600">{t('app.name')}</p>
        </div>
        <p className="text-xs text-gray-500 mb-2">Powered by Gemini AI</p>
        <div className="text-xs text-gray-500">
          <Link to="/terms-of-service" className="text-blue-600 hover:text-blue-700 underline">
            Terms of Service
          </Link>
          {' • '}
          <Link to="/terms-and-conditions" className="text-blue-600 hover:text-blue-700 underline">
            Terms and Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};
