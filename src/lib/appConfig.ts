/**
 * Canonical public URL for Educate MW.
 * Capacitor WebView often reports origin as https://localhost — never use that for share links.
 */
export const APP_ORIGIN = "https://educatemw.vercel.app";
export const APP_ORIGIN_ALT = "https://educatemw.app";

export function getAppOrigin(): string {
  try {
    const o = typeof window !== "undefined" ? window.location?.origin : "";
    if (
      o &&
      !/localhost|127\.0\.0\.1|capacitor|ionic|file:\/\//i.test(o) &&
      o.startsWith("http")
    ) {
      return o.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return APP_ORIGIN;
}

export function appShareUrl(path = "/"): string {
  const base = getAppOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
