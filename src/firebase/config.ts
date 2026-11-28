import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  ReCaptchaEnterpriseProvider,
  CustomProvider,
  AppCheck,
} from 'firebase/app-check';
import { getAI, GoogleAIBackend, AI } from 'firebase/ai';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'mock_dev_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'aivarion-dev.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aivarion-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'aivarion-dev.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:mockdev123456',
};

// Check if Firebase configuration is provided with real project credentials
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

// Bridge Chrome Prompt API to Firebase AI Logic LanguageModel if available
if (typeof window !== 'undefined') {
  // @ts-expect-error - Bridge Prompt API to window.LanguageModel
  if (!window.LanguageModel && window.ai?.languageModel) {
    // @ts-expect-error - Bridge Prompt API
    window.LanguageModel = window.ai.languageModel;
  }
}

// Initialize Firebase App Check
export let appCheck: AppCheck | null = null;

if (typeof window !== 'undefined') {
  const rawDebugToken = import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN;
  const cleanDebugToken =
    typeof rawDebugToken === 'string'
      ? rawDebugToken.replace(/^["']|["']$/g, '').trim()
      : undefined;

  const rawSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
  const cleanSiteKey =
    typeof rawSiteKey === 'string'
      ? rawSiteKey.replace(/^["']|["']$/g, '').trim()
      : undefined;

  const isRealRecaptchaKey =
    !!cleanSiteKey &&
    cleanSiteKey.startsWith('6L') &&
    cleanSiteKey.length >= 30;

  // 1. If a real reCAPTCHA site key is present, initialize with reCAPTCHA provider
  if (isRealRecaptchaKey) {
    try {
      const providerType = import.meta.env.VITE_FIREBASE_APP_CHECK_PROVIDER || 'recaptcha-v3';
      const provider =
        providerType === 'enterprise'
          ? new ReCaptchaEnterpriseProvider(cleanSiteKey)
          : new ReCaptchaV3Provider(cleanSiteKey);

      appCheck = initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('ReCaptcha provider initialization note:', err);
    }
  }

  // 2. If a registered debug token is configured, use CustomProvider debug exchange
  if (!appCheck && cleanDebugToken && cleanDebugToken !== 'false') {
    try {
      // @ts-expect-error - App Check debug token on window
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = cleanDebugToken;

      const provider = new CustomProvider({
        getToken: async () => {
          try {
            const endpoint = `https://firebaseappcheck.googleapis.com/v1/projects/${firebaseConfig.projectId}/apps/${firebaseConfig.appId}:exchangeDebugToken?key=${firebaseConfig.apiKey}`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ debugToken: cleanDebugToken }),
            });
            if (!res.ok) {
              const errBody = await res.text();
              throw new Error(`Debug token exchange failed (${res.status}): ${errBody}`);
            }
            const data = await res.json();
            const ttlSeconds = parseInt(data.ttl, 10) || 3600;
            return {
              token: data.token,
              expireTimeMillis: Date.now() + ttlSeconds * 1000,
            };
          } catch (exchangeErr) {
            console.warn('App Check debug token exchange note:', exchangeErr);
            throw exchangeErr;
          }
        },
      });

      appCheck = initializeAppCheck(app, {
        provider,
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('App Check custom debug provider initialization note:', err);
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
