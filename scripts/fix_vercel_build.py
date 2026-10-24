#!/usr/bin/env python3
"""Final prebuild: fix nested refreshKey in theme useState (TypeError reading length)."""
from pathlib import Path
import re

APP = Path("src/App.tsx")


def main() -> None:
    if not APP.exists():
        return
    t = APP.read_text(encoding="utf-8")
    orig = t

    # CRITICAL: refreshKey inserted inside theme useState initializer
    t = re.sub(
        r'(const \[theme, setTheme\] = useState<"light" \| "dark">\(\(\) => \{\s*)'
        r'const \[refreshKey, setRefreshKey\] = useState\(0\);\s*',
        r'\1',
        t,
        count=1,
    )
    if t != orig:
        print("CRITICAL: removed refreshKey from inside theme useState")

    t2 = t
    t = re.sub(
        r'(useState<"light" \| "dark">\(\(\) => \{)\s*const \[refreshKey, setRefreshKey\] = useState\(0\);\s*',
        r'\1\n',
        t,
        count=1,
    )
    if t != t2:
        print("CRITICAL: nested refreshKey cleaned (alt)")

    if "const [refreshKey, setRefreshKey]" not in t:
        m = re.search(
            r'const \[theme, setTheme\] = useState<"light" \| "dark">\(\(\) => \{[\s\S]*?\n  \}\);',
            t,
        )
        if m:
            t = t[: m.end()] + "\n  const [refreshKey, setRefreshKey] = useState(0);" + t[m.end() :]
            print("refreshKey placed after theme useState")
        else:
            needle = "const [isOnline, setIsOnline] = useState(navigator.onLine);"
            if needle in t:
                t = t.replace(
                    needle,
                    needle + "\n  const [refreshKey, setRefreshKey] = useState(0);",
                    1,
                )
                print("refreshKey after isOnline")

    while t.count("const [refreshKey, setRefreshKey]") > 1:
        first = t.find("const [refreshKey, setRefreshKey]")
        second = t.find("const [refreshKey, setRefreshKey]", first + 10)
        if second < 0:
            break
        line_end = t.find("\n", second)
        t = t[:second] + t[line_end + 1 :]
        print("removed duplicate refreshKey")

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
        print("removed handleAppRefresh from JSX")
        seo = t.find("<SEO")

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
      try {
        window.dispatchEvent(new CustomEvent("educate-mw-refresh", { detail: { at: Date.now() } }));
      } catch {}
      if (typeof setRefreshKey === "function") setRefreshKey((k) => k + 1);
      await new Promise((r) => setTimeout(r, 450));
    } catch (e) { console.warn("handleAppRefresh", e); }
  };

'''
        auth = t.find("if (isAuthChecking && !userProfile)")
        if auth > 0:
            t = t[:auth] + handler + t[auth:]
            print("handleAppRefresh before auth check")
        else:
            seo = t.find("<SEO")
            ret = t.rfind("\n  return (", 0, seo) if seo > 0 else -1
            if ret > 0:
                t = t[:ret] + "\n" + handler + t[ret:]
                print("handleAppRefresh before main return")

    svg = '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              </svg>'''
    if "<MoreVertical size={20} />" in t:
        t = t.replace("<MoreVertical size={20} />", svg, 1)
        print("square control button")

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
    pos = t.find("new GeminiLiveService")
    if old in t and pos > 0 and "You are NOT Gemini" not in t[pos : pos + 600]:
        t = t.replace(old, new, 1)
        print("CallingView systemInstruction")

    old_scroll = """        {/* Scrollable Main Content */}
        <div
          className={`flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >"""
    new_scroll = """        {/* Scrollable Main Content + pull-to-refresh */}
        <PullToRefresh
          theme={theme}
          onRefresh={handleAppRefresh}
          disabled={currentView === "emi-live"}
          className={`flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >
          <div key={refreshKey}>"""
    if (
        "onRefresh={handleAppRefresh}" not in t
        and old_scroll in t
        and "PullToRefresh" in t
        and "const handleAppRefresh" in t
        and "const [refreshKey" in t
    ):
        t = t.replace(old_scroll, new_scroll, 1)
        idx = t.find("<PullToRefresh")
        for close_pat in (
            "\n        </div>\n\n        {/* Bottom",
            "\n        </div>\n      </div>",
        ):
            pos = t.find(close_pat, idx)
            if pos > 0:
                t = (
                    t[:pos]
                    + "\n          </div>\n        </PullToRefresh>"
                    + close_pat.replace("\n        </div>", "", 1)
                )
                print("PullToRefresh wired")
                break

    if 'from "./components/PullToRefresh"' not in t and "PullToRefresh" in t:
        t = 'import { PullToRefresh } from "./components/PullToRefresh";\n' + t

    if t != orig:
        APP.write_text(t, encoding="utf-8")
        print("wrote App.tsx")
    else:
        print("vercel build fix: no changes needed")

    t2 = APP.read_text(encoding="utf-8")
    if re.search(
        r'useState<"light" \| "dark">\(\(\) => \{[^}]*refreshKey',
        t2,
        flags=re.S,
    ):
        print("ERROR: refreshKey still nested in theme")
        raise SystemExit(1)
    print("validation OK")


if __name__ == "__main__":
    main()
