import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { verifyEmailCode, verifyPasswordResetCodeAndGetEmail, resetPassword } from '../services/firebase';

type ActionMode = 'verifyEmail' | 'resetPassword' | null;
type VerificationStatus = 'loading' | 'success' | 'error';
type ResetStatus = 'verifying' | 'form' | 'resetting' | 'success' | 'error';

export const EmailActionHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [actionMode, setActionMode] = useState<ActionMode>(null);

  // Email verification states
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState(3);

  // Password reset states
  const [resetStatus, setResetStatus] = useState<ResetStatus>('verifying');
  const [userEmail, setUserEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus('error');
      setErrorMessage('Invalid or missing parameters');
      return;
    }

    if (mode === 'verifyEmail') {
      setActionMode('verifyEmail');
      handleEmailVerification(oobCode);
    } else if (mode === 'resetPassword') {
      setActionMode('resetPassword');
      handlePasswordResetVerification(oobCode);
    } else {
      setStatus('error');
      setErrorMessage('Unknown action mode');
    }
  }, [mode, oobCode]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = '/';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  const handleEmailVerification = async (code: string) => {
    try {
      await verifyEmailCode(code);
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to verify email';
      setErrorMessage(message);
    }
  };

  const handlePasswordResetVerification = async (code: string) => {
    setResetStatus('verifying');

    try {
      const { email } = await verifyPasswordResetCodeAndGetEmail(code);
      setUserEmail(email);
      setResetStatus('form');
    } catch (error: unknown) {
      setResetStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to verify reset link';
      setErrorMessage(message);
    }
  };

  const handlePasswordReset = async () => {
    setPasswordError('');

    // Validation
    if (!newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setResetStatus('resetting');

    try {
      await resetPassword(oobCode!, newPassword);
      setResetStatus('success');

      // Redirect after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error: unknown) {
      setResetStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to reset password';
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {"Spicy vs Sweet"}
              </span>
            </h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-10">
          {/* Email Verification Mode */}
          {actionMode === 'verifyEmail' && (
            <>
              {/* Loading State */}
              {status === 'loading' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Verifying Your Email
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your email has been verified. You can now access all features.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Redirecting to dashboard in <span className="font-bold">{countdown}</span> second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Verification Failed
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Return Home
              </button>
            </div>
          )}
            </>
          )}

          {/* Password Reset Mode */}
          {actionMode === 'resetPassword' && (
            <>
              {/* Verifying State */}
              {resetStatus === 'verifying' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Verifying Reset Link
                  </h2>
                  <p className="text-gray-600">
                    Please wait while we verify your password reset link...
                  </p>
                </div>
              )}

              {/* Form State */}
              {resetStatus === 'form' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                    Reset Your Password
                  </h2>
                  <p className="text-gray-600 mb-6 text-center">
                    Enter a new password for <span className="font-semibold text-blue-600">{userEmail}</span>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                    </div>

                    {passwordError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {passwordError}
                      </div>
                    )}

                    <button
                      onClick={handlePasswordReset}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              )}

              {/* Resetting State */}
              {resetStatus === 'resetting' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Resetting Password
                  </h2>
                  <p className="text-gray-600">
                    Please wait while we update your password...
                  </p>
                </div>
              )}

              {/* Success State */}
              {resetStatus === 'success' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Password Reset Successfully!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Redirecting to sign in in <span className="font-bold">{countdown}</span> second{countdown !== 1 ? 's' : ''}...
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {resetStatus === 'error' && (
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Reset Failed
                  </h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">
                      {errorMessage}
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Return Home
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmailActionHandler;
