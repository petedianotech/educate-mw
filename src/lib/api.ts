/**
 * API base for web vs APK.
 * Capacitor APK serves static files only — /api/* must hit production (Vercel).
 */
export function getApiBase(): string {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (envBase && String(envBase).trim()) {
    return String(envBase).replace(/\/$/, "");
  }
  try {
    const w = window as any;
    const native =
      !!w.Capacitor?.isNativePlatform?.() ||
      w.Capacitor?.getPlatform?.() === "android" ||
      w.Capacitor?.getPlatform?.() === "ios";
    if (native) return "https://educatemw.vercel.app";
  } catch {}
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base && typeof window !== "undefined") {
    try {
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        return `https://educatemw.vercel.app${p}`;
      }
    } catch {}
  }
  return `${base}${p}`;
}
