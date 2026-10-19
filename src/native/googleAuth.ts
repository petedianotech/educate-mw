/**
 * Google Sign-In for web (popup) and Android APK (account picker).
 * Web client ID from google-services.json client_type 3.
 */
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export const GOOGLE_WEB_CLIENT_ID =
  ((import.meta as any).env?.VITE_GOOGLE_WEB_CLIENT_ID as string) ||
  "918710657536-r6uqkjpr4fons0h69flfkgnod68l5hnk.apps.googleusercontent.com";

function isNative(): boolean {
  try {
    // Avoid static import so web/vite builds without @capacitor/core still succeed
    const w = window as any;
    return !!(w.Capacitor?.isNativePlatform?.() || w.Capacitor?.getPlatform?.() === "android");
  } catch {
    return false;
  }
}

let socialReady = false;

async function ensureNativeGoogle() {
  if (socialReady) return;
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({
    google: { webClientId: GOOGLE_WEB_CLIENT_ID },
  });
  socialReady = true;
}

export async function signInWithGoogleNativeAware(): Promise<void> {
  if (isNative()) {
    await ensureNativeGoogle();
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    const login = await SocialLogin.login({
      provider: "google",
      options: { scopes: ["email", "profile"] },
    });
    const idToken =
      (login as any)?.result?.idToken ||
      (login as any)?.idToken ||
      (login as any)?.authentication?.idToken;
    if (!idToken) {
      throw new Error(
        "Google returned no ID token. Confirm SHA-1 and Web client ID in Firebase.",
      );
    }
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
    return;
  }
  await signInWithPopup(auth, googleProvider);
}

export function isNativeApp(): boolean {
  return isNative();
}
