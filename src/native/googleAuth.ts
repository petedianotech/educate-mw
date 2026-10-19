/**
 * Google Sign-In for web (popup) and Android APK (system account picker).
 */
import { Capacitor } from "@capacitor/core";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

let socialReady = false;

async function ensureNativeGoogle() {
  if (socialReady) return;
  const webClientId = (import.meta as any).env?.VITE_GOOGLE_WEB_CLIENT_ID as
    | string
    | undefined;
  if (!webClientId) {
    throw new Error(
      "Missing VITE_GOOGLE_WEB_CLIENT_ID. Add your Google Web OAuth client ID to secrets.",
    );
  }
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({
    google: { webClientId },
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
        "Google returned no ID token. Confirm Web client ID and SHA-1 in Firebase.",
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
