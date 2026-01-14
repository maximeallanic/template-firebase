import { initializeApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  applyActionCode,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type User as FirebaseUser
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { isNative } from './platformService';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_AUTH_ATTEMPTS = 5;
const MAX_PASSWORD_RESET_ATTEMPTS = 3;

// Rate limiting state
const rateLimitState = {
  authAttempts: [] as number[],
  passwordResetAttempts: [] as number[],
};

function checkRateLimit(attempts: number[], maxAttempts: number): boolean {
  const now = Date.now();
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  attempts.length = 0;
  attempts.push(...recentAttempts);

  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limited
  }
  attempts.push(now);
  return true;
}

function getRateLimitRemainingTime(attempts: number[]): number {
  if (attempts.length === 0) return 0;
  const oldestAttempt = Math.min(...attempts);
  return Math.max(0, RATE_LIMIT_WINDOW_MS - (Date.now() - oldestAttempt));
}

export type User = FirebaseUser;
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, Timestamp } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
// Analytics imported dynamically for performance (see initializeAnalytics)
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// DEBUG: Log database URL configuration
if (!firebaseConfig.databaseURL) {
  console.error('❌ CRITICAL: databaseURL is undefined! RTDB will not work.');
} else {
  console.log('✅ databaseURL configured:', firebaseConfig.databaseURL.substring(0, 50) + '...');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check with reCAPTCHA Enterprise
// This protects Firebase services (Auth, Functions, Firestore) from abuse
if (import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled: true, // Automatically refresh tokens
    });
    console.log('✅ Firebase App Check initialized with reCAPTCHA Enterprise');
  } catch (error) {
    console.warn('⚠️ Failed to initialize App Check:', error);
  }
}
// App Check is optional in development - no warning needed

// Lazy initialization flags
let authInitialized = false;
let analyticsInitialized = false;

// Export auth, functions, and db - auth will be lazy-initialized
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// DEBUG: Log RTDB initialization
console.log('🔥 RTDB initialized - app options:', JSON.stringify({
  projectId: rtdb.app.options.projectId,
  databaseURL: rtdb.app.options.databaseURL,
}, null, 2));

// Initialize Analytics only in production
let analytics: Analytics | null = null;

/**
 * Lazy-initialize Firebase Auth
 * This defers loading the Auth iframe until user interaction (sign-in)
 * Saves ~1000ms on initial page load
 */
export async function initializeAuth(): Promise<void> {
  if (authInitialized) return;

  authInitialized = true;

  // Note: In DEV mode, emulator is already connected synchronously at module load
  // to avoid race condition with persisted sessions

  // Set Persistence safely
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('✅ Auth persistence set to LOCAL');
  } catch (err) {
    console.warn('⚠️ Failed to set local persistence, trying session...', err);
    try {
      await setPersistence(auth, browserSessionPersistence);
      console.log('✅ Auth persistence set to SESSION');
    } catch (err2) {
      console.warn('⚠️ Failed to set session persistence, falling back to NONE (memory)...', err2);
      try {
        await setPersistence(auth, inMemoryPersistence);
        console.log('✅ Auth persistence set to MEMORY (Top Secret Spy Mode 🕵️)');
      } catch (err3) {
        console.error('❌ Failed to set ANY auth persistence. Auth might not work.', err3);
      }
    }
  }
}

/**
 * Lazy-initialize Firebase Analytics
 * Dynamically imports analytics module for optimal performance
 * Only loads when explicitly called (e.g., after user consent or idle time)
 */
export async function initializeAnalytics(): Promise<void> {
  if (analyticsInitialized || !import.meta.env.PROD || !import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    return;
  }

  analyticsInitialized = true;

  try {
    // Dynamic import to avoid loading Analytics in main bundle
    const { getAnalytics, isSupported } = await import('firebase/analytics');

    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics initialized (lazy, dynamic import)');
    }
  } catch (err) {
    console.warn('⚠️ Analytics not supported:', err);
  }
}

export { analytics };

// Initialize ALL emulators in development (must happen BEFORE any auth state change)
if (import.meta.env.DEV) {
  try {
    // Auth emulator MUST connect synchronously to avoid race condition with persisted sessions
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
    // Mark auth as initialized since we just connected to emulator
    authInitialized = true;
  } catch (error) {
    console.warn('⚠️ Failed to connect to emulators:', error);
  }
}

// Auth functions
export async function signIn(email: string, password: string) {
  await initializeAuth(); // Lazy-load auth on first use

  // Rate limiting check
  if (!checkRateLimit(rateLimitState.authAttempts, MAX_AUTH_ATTEMPTS)) {
    const remainingMs = getRateLimitRemainingTime(rateLimitState.authAttempts);
    const remainingSec = Math.ceil(remainingMs / 1000);
    throw new Error(`Trop de tentatives. Réessayez dans ${remainingSec} secondes.`);
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sign in';
    throw new Error(message);
  }
}

export async function signUp(email: string, password: string) {
  await initializeAuth(); // Lazy-load auth on first use

  // Rate limiting check
  if (!checkRateLimit(rateLimitState.authAttempts, MAX_AUTH_ATTEMPTS)) {
    const remainingMs = getRateLimitRemainingTime(rateLimitState.authAttempts);
    const remainingSec = Math.ceil(remainingMs / 1000);
    throw new Error(`Trop de tentatives. Réessayez dans ${remainingSec} secondes.`);
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Send verification email
    await sendEmailVerification(result.user);

    return result.user;
  } catch (error: unknown) {
    console.error('Sign up error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create account';
    throw new Error(message);
  }
}

export async function signInWithGoogle() {
  await initializeAuth(); // Lazy-load auth on first use

  // Use native Google Sign-In on Capacitor apps
  if (isNative()) {
    try {
      // Sign in with native Google on iOS/Android
      const result = await FirebaseAuthentication.signInWithGoogle();

      // Get the ID token and create Firebase credential
      const credential = GoogleAuthProvider.credential(result.credential?.idToken);

      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);
      return userCredential.user;
    } catch (error: unknown) {
      console.error('Native Google sign in error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';

      // Handle user cancellation
      if (errorMessage.includes('cancel') || errorMessage.includes('Cancel')) {
        throw new Error('Sign-in cancelled');
      }

      throw new Error(errorMessage);
    }
  }

  // Web: Use popup-based sign-in
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');

  try {
    const result = await signInWithPopup(auth, provider);
    // Note: result.user.emailVerified is automatically true for Google sign-in
    return result.user;
  } catch (error: unknown) {
    console.error('Google sign in error:', error);

    // Handle specific Google auth errors
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';

    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('Un compte existe déjà avec cet email. Connectez-vous avec email/mot de passe.');
    }
    if (errorCode === 'auth/cancelled-popup-request' || errorCode === 'auth/popup-closed-by-user') {
      // User closed popup, don't show error
      throw new Error('Sign-in cancelled');
    }

    throw new Error(errorMessage);
  }
}

export async function signOut() {
  try {
    // Sign out from native provider on Capacitor apps
    if (isNative()) {
      await FirebaseAuthentication.signOut();
    }
    await firebaseSignOut(auth);
  } catch (error: unknown) {
    console.error('Sign out error:', error);
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    throw new Error(message);
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  // Defer auth initialization to improve LCP (don't block initial render)
  // Use requestIdleCallback to run during browser idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initializeAuth().catch(err => console.error('Failed to initialize auth:', err));
    }, { timeout: 2000 }); // Fallback to setTimeout after 2s
  } else {
    // Fallback for browsers without requestIdleCallback (Safari)
    setTimeout(() => {
      initializeAuth().catch(err => console.error('Failed to initialize auth:', err));
    }, 100);
  }
  return onAuthStateChanged(auth, callback);
}

export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user signed in');
    }
    if (user.emailVerified) {
      throw new Error('Email already verified');
    }
    await sendEmailVerification(user);
  } catch (error: unknown) {
    console.error('Resend verification error:', error);
    const message = error instanceof Error ? error.message : 'Failed to resend verification email';
    throw new Error(message);
  }
}

export async function reloadUser() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user signed in');
    }

    // Reload user data
    await user.reload();

    // Force token refresh to update email_verified claim
    await user.getIdToken(true);

    return auth.currentUser;
  } catch (error: unknown) {
    console.error('Reload user error:', error);
    const message = error instanceof Error ? error.message : 'Failed to reload user';
    throw new Error(message);
  }
}

export async function verifyEmailCode(code: string) {
  try {
    // Apply the action code to verify the email
    await applyActionCode(auth, code);

    // Force token refresh to update email_verified claim in JWT
    const user = auth.currentUser;
    if (user) {
      await user.reload();
      await user.getIdToken(true);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Email verification error:', error);

    // Handle specific error codes
    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'auth/invalid-action-code') {
      throw new Error('The verification link is invalid or has expired. Please request a new one.');
    }
    if (errorCode === 'auth/expired-action-code') {
      throw new Error('The verification link has expired. Please request a new one.');
    }

    const message = error instanceof Error ? error.message : 'Failed to verify email';
    throw new Error(message);
  }
}

export async function sendPasswordReset(email: string) {
  // Rate limiting check (stricter for password reset to prevent email enumeration)
  if (!checkRateLimit(rateLimitState.passwordResetAttempts, MAX_PASSWORD_RESET_ATTEMPTS)) {
    const remainingMs = getRateLimitRemainingTime(rateLimitState.passwordResetAttempts);
    const remainingSec = Math.ceil(remainingMs / 1000);
    throw new Error(`Trop de tentatives. Réessayez dans ${remainingSec} secondes.`);
  }

  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (error: unknown) {
    console.error('Password reset email error:', error);

    const errorCode = (error as { code?: string }).code;
    // Security: Don't reveal if email exists or not (prevents enumeration)
    // Always return success message to prevent user enumeration attacks
    if (errorCode === 'auth/user-not-found') {
      // Silently succeed to prevent email enumeration
      return { success: true };
    }
    if (errorCode === 'auth/invalid-email') {
      throw new Error('Adresse email invalide');
    }

    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    throw new Error(message);
  }
}

export async function verifyPasswordResetCodeAndGetEmail(code: string) {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return { email, success: true };
  } catch (error: unknown) {
    console.error('Password reset code verification error:', error);

    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'auth/invalid-action-code') {
      throw new Error('The reset link is invalid or has expired');
    }
    if (errorCode === 'auth/expired-action-code') {
      throw new Error('The reset link has expired');
    }

    const message = error instanceof Error ? error.message : 'Failed to verify reset code';
    throw new Error(message);
  }
}

export async function resetPassword(code: string, newPassword: string) {
  try {
    await confirmPasswordReset(auth, code, newPassword);
    return { success: true };
  } catch (error: unknown) {
    console.error('Password reset error:', error);

    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'auth/weak-password') {
      throw new Error('Password is too weak. Use at least 6 characters');
    }
    if (errorCode === 'auth/invalid-action-code') {
      throw new Error('The reset link is invalid or has already been used');
    }

    const message = error instanceof Error ? error.message : 'Failed to reset password';
    throw new Error(message);
  }
}

// Callable functions
const getUserSubscriptionFunction = httpsCallable<void, {
  subscriptionStatus: string;
  analysesUsed: number;
  analysesLimit: number;
  currentPeriodEnd?: unknown;
}>(functions, 'getUserSubscription');

const createCheckoutSessionFunction = httpsCallable<
  { returnUrl: string; currency?: string },
  { sessionId: string; url: string }
>(functions, 'createCheckoutSession');

const cancelSubscriptionFunction = httpsCallable<void, { success: boolean; message: string }>(
  functions,
  'cancelSubscription'
);

const createPortalSessionFunction = httpsCallable<{ returnUrl: string }, { url: string }>(
  functions,
  'createPortalSession'
);

export async function getUserSubscription() {
  try {
    const result = await getUserSubscriptionFunction();
    return result.data;
  } catch (error: unknown) {
    console.error('Error getting subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to get subscription info';
    throw new Error(message);
  }
}

/**
 * Get user subscription directly from Firestore (optimized version)
 * This replaces the Cloud Function call with direct Firestore access
 */
export async function getUserSubscriptionDirect() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const userId = user.uid;
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    if (!userData) {
      // User document doesn't exist yet - Cloud Function will create it on first analysis
      return {
        subscriptionStatus: 'free',
        analysesUsed: 0,
        analysesLimit: 5,
      };
    }

    // Check if period ended and return reset values
    const now = Date.now();
    const periodEnd = userData.currentPeriodEnd;
    const periodEndMillis = periodEnd instanceof Timestamp ? periodEnd.toMillis() : 0;

    if (periodEndMillis > 0 && now > periodEndMillis) {
      // Period expired - return reset values (actual reset happens in Cloud Function)
      return {
        subscriptionStatus: userData.subscriptionStatus || 'free',
        analysesUsed: 0,
        analysesLimit: userData.analysesLimit || 5,
        currentPeriodEnd: userData.currentPeriodEnd,
      };
    }

    // Return current data
    return {
      subscriptionStatus: userData.subscriptionStatus || 'free',
      analysesUsed: userData.analysesUsedThisMonth || 0,
      analysesLimit: userData.analysesLimit || 5,
      currentPeriodEnd: userData.currentPeriodEnd,
    };
  } catch (error: unknown) {
    console.error('Error getting subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to get subscription info';
    throw new Error(message);
  }
}

export async function createCheckoutSession(returnUrl: string, currency?: string) {
  try {
    const result = await createCheckoutSessionFunction({ returnUrl, currency });
    return result.data;
  } catch (error: unknown) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    throw new Error(message);
  }
}

export async function createPortalSession(returnUrl: string) {
  try {
    const result = await createPortalSessionFunction({ returnUrl });
    return result.data;
  } catch (error: unknown) {
    console.error('Error creating portal session:', error);
    const message = error instanceof Error ? error.message : 'Failed to create portal session';
    throw new Error(message);
  }
}

export async function cancelSubscription() {
  try {
    const result = await cancelSubscriptionFunction();
    return result.data;
  } catch (error: unknown) {
    console.error('Error cancelling subscription:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
    throw new Error(message);
  }
}
