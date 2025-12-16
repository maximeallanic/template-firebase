import { initializeApp } from 'firebase/app';
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

export type User = FirebaseUser;
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator, collection, query, orderBy, limit as firestoreLimit, getDocs, doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
// Analytics imported dynamically for performance (see initializeAnalytics)
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import type { AnalyzeEmailRequest, AnalyzeEmailResponse, AnalysisRecord } from '../types/analysis';

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
} else {
  console.warn('⚠️ App Check not initialized: VITE_RECAPTCHA_ENTERPRISE_SITE_KEY not set');
}

// Lazy initialization flags
let authInitialized = false;
let analyticsInitialized = false;

// Export auth, functions, and db - auth will be lazy-initialized
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Initialize Analytics only in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let analytics: any = null;

/**
 * Lazy-initialize Firebase Auth
 * This defers loading the Auth iframe until user interaction (sign-in)
 * Saves ~1000ms on initial page load
 */
export async function initializeAuth(): Promise<void> {
  if (authInitialized) return;

  authInitialized = true;

  // Use emulators in development
  if (import.meta.env.DEV) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator (9099)');
    } catch (error) {
      console.warn('⚠️ Failed to connect to Auth emulator:', error);
    }
  }

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

// Initialize Functions and Firestore emulators in development (no auth yet)
if (import.meta.env.DEV) {
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
    console.log('✅ Connected to Firebase emulators (Functions:5001, Firestore:8080, RTDB:9000)');
    console.log('ℹ️  Auth emulator will connect on first use');
  } catch (error) {
    console.warn('⚠️ Failed to connect to emulators:', error);
  }
}

// Auth functions
export async function signIn(email: string, password: string) {
  await initializeAuth(); // Lazy-load auth on first use
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
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const result = await signInWithPopup(auth, provider);
    // Note: result.user.emailVerified is automatically true for Google sign-in
    return result.user;
  } catch (error: unknown) {
    console.error('Google sign in error:', error);

    // Handle specific Google auth errors
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';

    if (errorCode === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled');
    }
    if (errorCode === 'auth/popup-blocked') {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with this email. Please sign in with email/password.');
    }
    if (errorCode === 'auth/cancelled-popup-request') {
      // User closed popup, don't show error
      throw new Error('Sign-in cancelled');
    }

    throw new Error(errorMessage);
  }
}

export async function signOut() {
  try {
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
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (error: unknown) {
    console.error('Password reset email error:', error);

    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'auth/user-not-found') {
      throw new Error('No account found with this email address');
    }
    if (errorCode === 'auth/invalid-email') {
      throw new Error('Invalid email address');
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
const analyzeEmailFunction = httpsCallable<AnalyzeEmailRequest, AnalyzeEmailResponse>(
  functions,
  'analyzeEmail'
);

const analyzeEmailGuestFunction = httpsCallable<AnalyzeEmailRequest, AnalyzeEmailResponse>(
  functions,
  'analyzeEmailGuest'
);

const getUserSubscriptionFunction = httpsCallable<void, {
  subscriptionStatus: string;
  analysesUsed: number;
  analysesLimit: number;
  currentPeriodEnd?: unknown;
}>(functions, 'getUserSubscription');

const createCheckoutSessionFunction = httpsCallable<{ returnUrl: string }, { sessionId: string; url: string }>(
  functions,
  'createCheckoutSession'
);

const cancelSubscriptionFunction = httpsCallable<void, { success: boolean; message: string }>(
  functions,
  'cancelSubscription'
);

const createPortalSessionFunction = httpsCallable<{ returnUrl: string }, { url: string }>(
  functions,
  'createPortalSession'
);

const createEmailAnalysisSessionFunction = httpsCallable<
  void,
  {
    success: boolean;
    data?: {
      emailAddress: string;
      displayName: string;
      sessionId: string;
      expiresAt: number;
    };
    error?: string;
  }
>(functions, 'createEmailAnalysisSession');

export async function analyzeEmail(emailContent: string) {
  try {
    const result = await analyzeEmailFunction({ emailContent });
    return result.data;
  } catch (error: unknown) {
    console.error('Error calling analyzeEmail:', error);

    // Handle specific error codes
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze email';

    if (errorCode === 'functions/unauthenticated') {
      throw new Error('Please sign in to analyze emails');
    }
    if (errorCode === 'functions/resource-exhausted') {
      throw new Error(errorMessage || 'You have reached your monthly limit');
    }
    if (errorCode === 'functions/failed-precondition') {
      throw new Error(errorMessage || 'Please verify your email address before analyzing emails');
    }

    throw new Error(errorMessage);
  }
}

// Free Trial Helper Functions
export function markFreeTrialUsed(): void {
  try {
    localStorage.setItem('hasUsedFreeTrial', 'true');
    localStorage.setItem('freeTrialUsedAt', Date.now().toString());
    // Set cookie for 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    const cookiePrefix = import.meta.env.VITE_COOKIE_PREFIX || 'app';
    document.cookie = `${cookiePrefix}_trial=used; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
  } catch (error) {
    console.warn('Failed to mark free trial as used:', error);
  }
}

export function hasUsedFreeTrial(): boolean {
  try {
    // Check localStorage
    const localStorageUsed = localStorage.getItem('hasUsedFreeTrial') === 'true';

    // Check cookie
    const cookiePrefix = import.meta.env.VITE_COOKIE_PREFIX || 'app';
    const cookieUsed = document.cookie.split(';').some(cookie =>
      cookie.trim().startsWith(`${cookiePrefix}_trial=used`)
    );

    return localStorageUsed || cookieUsed;
  } catch (error) {
    console.warn('Failed to check free trial status:', error);
    return false;
  }
}

export function clearFreeTrialStatus(): void {
  try {
    localStorage.removeItem('hasUsedFreeTrial');
    localStorage.removeItem('freeTrialUsedAt');
    const cookiePrefix = import.meta.env.VITE_COOKIE_PREFIX || 'app';
    document.cookie = `${cookiePrefix}_trial=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.warn('Failed to clear free trial status:', error);
  }
}

export async function analyzeEmailGuest(emailContent: string) {
  try {
    const result = await analyzeEmailGuestFunction({ emailContent });

    // Mark trial as used on client side
    markFreeTrialUsed();

    return result.data;
  } catch (error: unknown) {
    console.error('Error calling analyzeEmailGuest:', error);

    // Handle specific error codes
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze email';

    if (errorCode === 'functions/resource-exhausted') {
      // Mark as used even on error (they already used it)
      markFreeTrialUsed();
      throw new Error(errorMessage || 'Free trial already used. Sign up for a free account!');
    }
    if (errorCode === 'functions/invalid-argument') {
      throw new Error(errorMessage || 'Invalid email content');
    }

    throw new Error(errorMessage);
  }
}

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

export async function createCheckoutSession(returnUrl: string) {
  try {
    const result = await createCheckoutSessionFunction({ returnUrl });
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

export async function createEmailAnalysisSession() {
  try {
    const result = await createEmailAnalysisSessionFunction();
    return result.data;
  } catch (error: unknown) {
    console.error('Error creating email analysis session:', error);

    // Handle specific error codes
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Failed to create email analysis session';

    if (errorCode === 'functions/resource-exhausted') {
      throw new Error(errorMessage || 'Rate limit exceeded or quota reached');
    }

    throw new Error(errorMessage);
  }
}

// Analysis History Functions
export async function getAnalysisHistory(limitCount: number = 20): Promise<AnalysisRecord[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to view history');
    }

    const analysesRef = collection(db, 'users', user.uid, 'analyses');
    const q = query(analysesRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        emailContent: data.emailContent,
        analysis: data.analysis,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        originalEmail: data.originalEmail,
      };
    });
  } catch (error: unknown) {
    console.error('Error fetching analysis history:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analysis history';
    throw new Error(message);
  }
}

export async function getAnalysisById(analysisId: string): Promise<AnalysisRecord | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to view analysis');
    }

    const analysisRef = doc(db, 'users', user.uid, 'analyses', analysisId);
    const analysisDoc = await getDoc(analysisRef);

    if (!analysisDoc.exists()) {
      return null;
    }

    const data = analysisDoc.data();
    return {
      id: analysisDoc.id,
      emailContent: data.emailContent,
      analysis: data.analysis,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      originalEmail: data.originalEmail,
    };
  } catch (error: unknown) {
    console.error('Error fetching analysis:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch analysis';
    throw new Error(message);
  }
}

export function subscribeToAnalysisHistory(
  callback: (analyses: AnalysisRecord[]) => void,
  limitCount: number = 20
): () => void {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to view history');
  }

  const analysesRef = collection(db, 'users', user.uid, 'analyses');
  const q = query(analysesRef, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const analyses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        emailContent: data.emailContent,
        analysis: data.analysis,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        originalEmail: data.originalEmail,
      };
    });
    callback(analyses);
  });
}
