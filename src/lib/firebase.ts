import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use the explicit database ID if provided, otherwise the default.
const config = firebaseConfig as any;
const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' 
  ? config.firestoreDatabaseId 
  : undefined;

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/docs');
googleProvider.addScope('https://www.googleapis.com/auth/drive');

// Flag to indicate if we are in the middle of a sign-in flow.
export let isSigningIn = false;
// Cache the access token in memory.
export let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};
export const setIsSigningIn = (val: boolean) => {
  isSigningIn = val;
};

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}

