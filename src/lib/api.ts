/**
 * API base for web vs APK.
 * Capacitor APK serves static files only — /api/* must hit production (Vercel).
 * GEMINI_API_KEY stays on the server (Vercel + GitHub for CI); never embed it in the client.
 */
export function getApiBase(): string {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (envBase && envBase.trim()) return envBase.replace(/\/$/, "");

  try {
    const w = window as any;
    if (w.Capacitor?.isNativePlatform?.()) {
      return "https://educatemw.vercel.app";
    }
  } catch {
    /* web */
  }
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
