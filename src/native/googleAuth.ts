/**
 * Google Sign-In for web (popup) and Android APK (account picker).
 * Native path uses Capacitor.Plugins (never ES-import the plugin —
 * Vite marks it external and APK WebView then fails with
 * "Failed to resolve module specifier '@capgo/capacitor-social-login'").
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
    const w = window as any;
    return !!(
      w.Capacitor?.isNativePlatform?.() ||
      w.Capacitor?.getPlatform?.() === "android"
    );
  } catch {
    return false;
  }
}

function getSocialLoginPlugin(): any {
  const w = window as any;
  const fromPlugins = w.Capacitor?.Plugins?.SocialLogin;
  if (fromPlugins) return fromPlugins;
  if (w.Capacitor?.Plugins?.CapgoSocialLogin) return w.Capacitor.Plugins.CapgoSocialLogin;
  return null;
}

let socialReady = false;

async function ensureNativeGoogle() {
  if (socialReady) return;
  const SocialLogin = getSocialLoginPlugin();
  if (!SocialLogin) {
    throw new Error(
      "Google Sign-In plugin not available on this device. Update the APK or use phone/email sign-in.",
    );
  }
  if (typeof SocialLogin.initialize === "function") {
    await SocialLogin.initialize({
      google: { webClientId: GOOGLE_WEB_CLIENT_ID },
    });
  }
  socialReady = true;
}

export async function signInWithGoogleNativeAware(): Promise<void> {
  if (isNative()) {
    await ensureNativeGoogle();
    const SocialLogin = getSocialLoginPlugin();
    if (!SocialLogin?.login) {
      throw new Error("Google Sign-In is not available. Please use phone or email.");
    }
    const login = await SocialLogin.login({
      provider: "google",
      options: {},
    });
    const idToken =
      (login as any)?.result?.idToken ||
      (login as any)?.idToken ||
      (login as any)?.authentication?.idToken ||
      (login as any)?.result?.accessToken?.idToken;
    if (!idToken) {
      throw new Error(
        "Google returned no ID token. Confirm SHA-1 and Web client ID in Firebase Console.",
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
