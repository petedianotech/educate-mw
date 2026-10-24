#!/usr/bin/env python3
"""Wire pull-to-refresh; handler MUST be before App return (never inside JSX)."""
from pathlib import Path

APP = Path("src/App.tsx")
COMP = Path("src/components/PullToRefresh.tsx")

PTR = open(Path(__file__).resolve().parent.parent / "src/components/PullToRefresh.tsx").read() if (Path(__file__).resolve().parent.parent / "src/components/PullToRefresh.tsx").exists() else ""

HANDLER = """
  /** Pull-to-refresh: reload profile + clear caches + remount views */
  const handleAppRefresh = async () => {
    try {
      try {
        localStorage.removeItem("mw_library_materials_cache");
      } catch {}
      const u = auth.currentUser;
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setUserProfile({ ...snap.data(), id: snap.id });
          }
        } catch (e) {
          console.warn("refresh profile:", e);
        }
      }
      try {
        window.dispatchEvent(new CustomEvent("educate-mw-refresh", { detail: { at: Date.now() } }));
      } catch {}
      setRefreshKey((k) => k + 1);
      await new Promise((r) => setTimeout(r, 450));
    } catch (e) {
      console.warn("handleAppRefresh", e);
    }
  };

"""


def main() -> None:
    COMP.parent.mkdir(parents=True, exist_ok=True)
    if not COMP.exists() and PTR:
        COMP.write_text(PTR, encoding="utf-8")

    if not APP.exists():
        return

    t = APP.read_text(encoding="utf-8")
    orig = t

    # Strip any handleAppRefresh stuck inside JSX (between return and <SEO)
    seo = t.find("<SEO")
    while seo > 0:
        ret = t.rfind("return (", 0, seo)
        ha = t.find("const handleAppRefresh")
        if not (ha > 0 and ret > 0 and ha > ret and ha < seo):
            break
        end = t.find("\n  };\n", ha)
        if end < 0:
            break
        end = end + len("\n  };\n")
        start = t.rfind("\n", 0, ha)
        comment = t.rfind("/** Pull-to-refresh", max(0, ha - 200), ha)
        if comment > 0:
            start = t.rfind("\n", 0, comment)
        t = t[: start + 1] + t[end:]
        print("removed handleAppRefresh from inside JSX")
        seo = t.find("<SEO")

    if 'from "./components/PullToRefresh"' not in t:
        t = 'import { PullToRefresh } from "./components/PullToRefresh";\n' + t

    if "const [refreshKey, setRefreshKey]" not in t:
        for needle in (
            "const [theme, setTheme]",
            "const [currentView, setCurrentView]",
            "const [userProfile, setUserProfile]",
        ):
            if needle in t:
                idx = t.find(needle)
                line_end = t.find("\n", idx)
                t = t[: line_end + 1] + "  const [refreshKey, setRefreshKey] = useState(0);\n" + t[line_end + 1 :]
                break

    if "const handleAppRefresh" not in t:
        seo = t.find("<SEO")
        if seo < 0:
            seo = t.find("{/* Scrollable Main Content")
        ret = t.rfind("\n  return (", 0, seo) if seo > 0 else -1
        if ret > 0:
            t = t[:ret] + "\n" + HANDLER + t[ret:]
            print("handleAppRefresh before App return (safe)")

    old_scroll = """        {/* Scrollable Main Content */}
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >"""

    new_scroll = """        {/* Scrollable Main Content + pull-to-refresh */}
        <PullToRefresh
          theme={theme}
          onRefresh={handleAppRefresh}
          disabled={currentView === "emi-live"}
          className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >
          <div key={refreshKey}>"""

    if old_scroll in t and "onRefresh={handleAppRefresh}" not in t:
        t = t.replace(old_scroll, new_scroll, 1)

    if "onRefresh={handleAppRefresh}" in t and "</PullToRefresh>" not in t:
        idx = t.find("<PullToRefresh")
        for close_pat in (
            "\n        </div>\n\n        {/* Bottom",
            "\n        </div>\n        <div className={`absolute bottom",
            "\n        </div>\n      </div>",
        ):
            pos = t.find(close_pat, idx)
            if pos > 0:
                t = t[:pos] + "\n          </div>\n        </PullToRefresh>" + close_pat.replace("\n        </div>", "", 1)
                break

    if t != orig:
        APP.write_text(t, encoding="utf-8")
        print("wrote App.tsx")
    else:
        print("pull-to-refresh ok")


if __name__ == "__main__":
    main()
