/**
 * Google Sign-In for web (popup) and Android APK (system account picker).
 *
 * Web client ID (client_type 3 from google-services.json):
 * 918710657536-r6uqkjpr4fons0h69flfkgnod68l5hnk.apps.googleusercontent.com
 *
 * Android does NOT need Firebase Authorized Domains for native Google Sign-In.
 * Package mw.educate.app + SHA-1 in Firebase is what matters.
 */
import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

/** From google-services.json oauth_client client_type 3 (Web) */
export const GOOGLE_WEB_CLIENT_ID =
  ((import.meta as any).env?.VITE_GOOGLE_WEB_CLIENT_ID as string) ||
  "918710657536-r6uqkjpr4fons0h69flfkgnod68l5hnk.apps.googleusercontent.com";

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
  if (Capacitor.isNativePlatform()) {
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
  return Capacitor.isNativePlatform();
}
