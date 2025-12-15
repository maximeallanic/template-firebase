import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmailAnalysisSession, formatTimeRemaining } from '../hooks/useEmailAnalysisSession';
import { useClipboard } from '../hooks/useClipboard';

interface AnalyzeByEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyzeByEmailModal: React.FC<AnalyzeByEmailModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { emailAddress, status, analysisId, error, timeRemaining, retry } =
    useEmailAnalysisSession();
  const [copyToClipboard, isCopied] = useClipboard();

  // Redirect to dedicated analysis page when complete
  useEffect(() => {
    if (status === 'completed' && analysisId) {
      // Small delay to show "Completed" state
      const timer = setTimeout(() => {
        navigate(`/analysis/${analysisId}`);
        onClose();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [status, analysisId, navigate, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (emailAddress) {
      copyToClipboard(emailAddress);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-8 relative animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyze by Email</h2>
          <p className="text-gray-600">Forward your cold email to receive instant AI feedback</p>
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
            <p className="text-gray-600">Generating your unique email address...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
            <button
              onClick={retry}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Email address display */}
        {emailAddress && !error && (
          <>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
              <label className="text-sm font-semibold text-purple-900 mb-2 block">
                Your unique email address:
              </label>
              <div className="flex items-center gap-2 bg-white rounded-lg p-4 border-2 border-purple-300">
                <span className="flex-1 font-mono text-lg text-gray-900 select-all">{emailAddress}</span>
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isCopied ? (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-3 text-sm text-purple-700 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Expires in: <strong>{formatTimeRemaining(timeRemaining)}</strong></span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                How it works:
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    1
                  </span>
                  <span>Copy the email address above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    2
                  </span>
                  <span>Forward your cold email to it from Gmail, Outlook, or any email client</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold">
                    3
                  </span>
                  <span>Your AI analysis will appear here automatically in ~30 seconds</span>
                </li>
              </ol>
            </div>

            {/* Status indicator */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
              {status === 'waiting' && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-gray-600">Waiting for your email...</span>
                </div>
              )}

              {status === 'received' && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="text-blue-600 font-semibold">Email received!</span>
                </div>
              )}

              {status === 'analyzing' && (
                <div className="flex items-center gap-3">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-purple-200 border-t-purple-600"></div>
                  <span className="text-purple-600 font-semibold">AI analyzing your email...</span>
                </div>
              )}

              {status === 'completed' && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-600 font-semibold">Analysis complete!</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            {status === 'completed' ? 'View Analysis' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
