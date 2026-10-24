#!/usr/bin/env python3
"""Wire pull-to-refresh. NEVER truncate App.tsx when closing the wrapper."""
from pathlib import Path

APP = Path("src/App.tsx")

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
    if not APP.exists():
        return

    t = APP.read_text(encoding="utf-8")
    orig_len = len(t)
    if orig_len < 100000 and "function CallingView" not in t and "function EmiChatView" not in t:
        print("WARN: App.tsx looks truncated already; skip pull-to-refresh")
        return

    orig = t

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
        seo = t.find("<SEO")

    if 'from "./components/PullToRefresh"' not in t:
        t = 'import { PullToRefresh } from "./components/PullToRefresh";\n' + t

    if "const [refreshKey, setRefreshKey]" not in t:
        needle = "const [isOnline, setIsOnline] = useState(navigator.onLine);"
        if needle in t:
            t = t.replace(
                needle,
                needle + "\n  const [refreshKey, setRefreshKey] = useState(0);",
                1,
            )
        else:
            needle2 = "const [isSidebarOpen, setIsSidebarOpen] = useState(false);"
            if needle2 in t:
                t = t.replace(
                    needle2,
                    needle2 + "\n  const [refreshKey, setRefreshKey] = useState(0);",
                    1,
                )

    if "const handleAppRefresh" not in t:
        auth = t.find("if (isAuthChecking && !userProfile)")
        if auth > 0:
            t = t[:auth] + HANDLER + t[auth:]
        else:
            seo = t.find("<SEO")
            ret = t.rfind("\n  return (", 0, seo) if seo > 0 else -1
            if ret > 0:
                t = t[:ret] + "\n" + HANDLER + t[ret:]

    if "onRefresh={handleAppRefresh}" in t and "</PullToRefresh>" in t:
        print("pull-to-refresh already wired")
        if t != orig:
            APP.write_text(t, encoding="utf-8")
        return

    openers = [
        """        {/* Scrollable Main Content */}
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >""",
        """        {/* Scrollable Main Content */}
        <div
          className={`flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >""",
    ]
    new_open = """        {/* Scrollable Main Content + pull-to-refresh */}
        <PullToRefresh
          theme={theme}
          onRefresh={handleAppRefresh}
          disabled={currentView === "emi-live"}
          className={`flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >
          <div key={refreshKey}>"""

    opened = False
    for old_scroll in openers:
        if old_scroll in t:
            t = t.replace(old_scroll, new_open, 1)
            opened = True
            print("opened PullToRefresh")
            break

    if opened and "</PullToRefresh>" not in t:
        idx = t.find("<PullToRefresh")
        marker = "\n        {/* Bottom Navigation */}"
        pos = t.find(marker, idx)
        if pos > 0:
            before = t.rfind("</div>", idx, pos)
            if before > 0:
                t = (
                    t[:before]
                    + "</div>\n        </PullToRefresh>"
                    + t[before + len("</div>") :]
                )
                print("closed PullToRefresh before Bottom Navigation")
            else:
                t = t[:pos] + "          </div>\n        </PullToRefresh>\n" + t[pos:]
                print("closed PullToRefresh (insert before Bottom Nav)")
        else:
            print("WARN: Bottom Navigation marker not found; not closing (avoid truncate)")

    if len(t) < orig_len * 0.5:
        print("ERROR: refusing to write truncated App.tsx", len(t), "vs", orig_len)
        return
    if "function CallingView" not in t and "function CallingView" in orig:
        print("ERROR: CallingView would be lost; abort write")
        return

    if t != orig:
        APP.write_text(t, encoding="utf-8")
        print("wrote App.tsx", len(t), "bytes")
    else:
        print("unchanged")


if __name__ == "__main__":
    main()
