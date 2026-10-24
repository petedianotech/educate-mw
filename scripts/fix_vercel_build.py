#!/usr/bin/env python3
"""Last prebuild pass: strip JSX-broken handlers, square control btn, CallingView systemInstruction."""
from pathlib import Path
import re

APP = Path("src/App.tsx")


def main() -> None:
    if not APP.exists():
        return
    t = APP.read_text(encoding="utf-8")
    orig = t

    # Remove handleAppRefresh if still inside JSX (between return and SEO)
    seo = t.find("<SEO")
    while seo > 0:
        ret = t.rfind("return (", 0, seo)
        ha = t.find("const handleAppRefresh")
        if not (ha > 0 and ret > 0 and ha > ret and ha < seo):
            break
        end = t.find("\n  };\n", ha)
        if end < 0:
            break
        end += len("\n  };\n")
        start = t.rfind("\n", 0, ha)
        c = t.rfind("/** Pull-to-refresh", max(0, ha - 200), ha)
        if c > 0:
            start = t.rfind("\n", 0, c)
        t = t[: start + 1] + t[end:]
        print("vercel: removed handleAppRefresh from JSX")
        seo = t.find("<SEO")

    # Re-add handler safely before App return if missing
    if "const handleAppRefresh" not in t:
        handler = '''
  const handleAppRefresh = async () => {
    try {
      try { localStorage.removeItem("mw_library_materials_cache"); } catch {}
      const u = auth.currentUser;
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) setUserProfile({ ...snap.data(), id: snap.id });
        } catch (e) { console.warn(e); }
      }
      try { window.dispatchEvent(new CustomEvent("educate-mw-refresh", { detail: { at: Date.now() } })); } catch {}
      setRefreshKey((k) => k + 1);
      await new Promise((r) => setTimeout(r, 450));
    } catch (e) { console.warn("handleAppRefresh", e); }
  };

'''
        seo = t.find("<SEO")
        ret = t.rfind("\n  return (", 0, seo) if seo > 0 else -1
        if ret > 0:
            t = t[:ret] + "\n" + handler + t[ret:]
            print("vercel: handleAppRefresh placed before return")

    # Square + vertical line control (not 3 dots)
    svg = '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              </svg>'''
    if "<MoreVertical size={20} />" in t:
        t = t.replace("<MoreVertical size={20} />", svg, 1)
        print("vercel: square control button")

    # Explicit systemInstruction on live service
    old = """    const liveService = new GeminiLiveService(
      {
        voiceName: voiceName,
        userLevel: profile?.classLevel || "MSCE Form 4",
      },"""
    new = """    const liveService = new GeminiLiveService(
      {
        voiceName: voiceName,
        userLevel: profile?.classLevel || "MSCE Form 4",
        systemInstruction:
          "You are Emi, the live voice tutor in the Educate MW app for Malawian MSCE/JCE students. " +
          "You are NOT Gemini and NOT Google. Never say you were made by Google. " +
          "If asked who you are: I am Emi, built by Peter Damiano with the MSCE Preparation team for Educate MW. " +
          "Teach in short clear English. Chichewa only if the student uses it.",
      },"""
    if old in t and "You are NOT Gemini" not in t[t.find("new GeminiLiveService"): t.find("new GeminiLiveService") + 600]:
        t = t.replace(old, new, 1)
        print("vercel: CallingView systemInstruction")

    if t != orig:
        APP.write_text(t, encoding="utf-8")
        print("wrote App.tsx")
    else:
        print("vercel build fix: no changes")


if __name__ == "__main__":
    main()
