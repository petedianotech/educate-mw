import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';

/** Prefer Vite env (CI/Vercel secrets). Fallback JSON is for local only and must not hold real keys in git. */
const envKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY as string | undefined;
const rawApiKey = envKey || (fallbackConfig as any).apiKey;
const apiKey = !rawApiKey || rawApiKey === "REPLACE_WITH_VITE_FIREBASE_API_KEY"
  ? "AIzaSyD-PreviewModeDummyApiKeyForEducateMw123456"
  : rawApiKey;

const firebaseConfig = {
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || (fallbackConfig as any).projectId || "educate-mw",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || (fallbackConfig as any).appId || "1:918710657536:web:779b9ef743a0fc3138eee5",
  apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || (fallbackConfig as any).authDomain || "educate-mw.firebaseapp.com",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || (fallbackConfig as any).storageBucket || "educate-mw.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || (fallbackConfig as any).messagingSenderId || "918710657536",
  measurementId: (fallbackConfig as any).measurementId || "G-JGG2DZ823L",
};

const app = initializeApp(firebaseConfig);

const config = fallbackConfig as any;
const databaseId =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? config.firestoreDatabaseId
    : undefined;

export const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  databaseId,
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export let isSigningIn = false;
export const setIsSigningIn = (val: boolean) => {
  isSigningIn = val;
};

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}
