import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck } from 'firebase/app-check';
import { getAI, GoogleAIBackend, AI } from 'firebase/ai';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock_dev_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'aivarion-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aivarion-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aivarion-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:mockdev123456',
};

// Check if Firebase configuration is provided
export const isFirebaseConfigured = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return (
    !!key &&
    key !== 'mock_dev_key' &&
    key !== 'mock_dev_api_key' &&
    key !== 'your_firebase_api_key_here' &&
    !key.startsWith('mock_')
  );
};

// Initialize Firebase App
export const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// Initialize Firebase App Check
export let appCheck: AppCheck | null = null;

if (typeof window !== 'undefined') {
  const isDebug = import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN === 'true' || import.meta.env.DEV;
  if (isDebug) {
    // In dev mode, enable App Check debug token
    // @ts-expect-error - App Check debug token on window
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  if (siteKey && siteKey !== 'your_recaptcha_site_key') {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('App Check initialization failed or skipped:', err);
    }
  }
}

// Initialize Firebase AI Logic
export let aiService: AI | null = null;
try {
  aiService = getAI(app, { backend: new GoogleAIBackend() });
} catch (err) {
  console.warn('Firebase AI Logic initialization note:', err);
}

// Helper to sign in anonymously
export const ensureAnonymousAuth = async (): Promise<User | null> => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  try {
    if (auth.currentUser) {
      return auth.currentUser;
    }
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous sign-in not available in offline/unconfigured environment:', err);
    return null;
  }
};
