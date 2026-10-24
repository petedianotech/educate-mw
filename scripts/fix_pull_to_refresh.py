#!/usr/bin/env python3
"""Wire real pull-to-refresh into the main App scroll shell."""
from pathlib import Path
import re

APP = Path("src/App.tsx")
COMP = Path("src/components/PullToRefresh.tsx")

PTR = r'''import React, { useCallback, useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

type Props = {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  theme?: "light" | "dark";
  disabled?: boolean;
  className?: string;
};

const THRESHOLD = 72;
const MAX_PULL = 120;

/** Native-feeling pull-to-refresh. onRefresh reloads real app data. */
export function PullToRefresh({
  children,
  onRefresh,
  theme = "light",
  disabled = false,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const dark = theme === "dark";

  const finish = useCallback(async () => {
    if (refreshing) return;
    if (pull < THRESHOLD) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(THRESHOLD);
    try {
      await onRefresh();
    } catch (e) {
      console.warn("Pull refresh failed:", e);
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  }, [onRefresh, pull, refreshing]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 2) {
      pulling.current = false;
      return;
    }
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!pulling.current || disabled || refreshing) return;
    const el = containerRef.current;
    if (!el || el.scrollTop > 2) {
      pulling.current = false;
      setPull(0);
      return;
    }
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    const damped = Math.min(MAX_PULL, dy * 0.55);
    setPull(damped);
    if (damped > 8) e.preventDefault();
  };

  const onTouchEnd = () => {
    if (!pulling.current) return;
    pulling.current = false;
    void finish();
  };

  const indicatorOpacity = Math.min(1, pull / (THRESHOLD * 0.6));
  const ready = pull >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain" }}
    >
      <div
        aria-hidden
        className="pointer-events-none flex items-center justify-center"
        style={{
          height: refreshing ? 56 : pull,
          transition: refreshing || pull === 0 ? "height 0.2s ease" : undefined,
          overflow: "hidden",
        }}
      >
        <div
          className={`flex items-center gap-2 text-xs font-bold tracking-wide ${
            dark ? "text-indigo-300" : "text-indigo-600"
          }`}
          style={{ opacity: refreshing ? 1 : indicatorOpacity }}
        >
          {refreshing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Refreshing…</span>
            </>
          ) : (
            <>
              <ArrowDown
                size={18}
                style={{
                  transform: ready ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              />
              <span>{ready ? "Release to refresh" : "Pull to refresh"}</span>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
'''

COMP.parent.mkdir(parents=True, exist_ok=True)
if not COMP.exists() or "Pull to refresh" not in COMP.read_text(encoding="utf-8"):
    COMP.write_text(PTR, encoding="utf-8")
    print("wrote", COMP)

if not APP.exists():
    raise SystemExit(0)

t = APP.read_text(encoding="utf-8")
if "onRefresh={handleAppRefresh}" in t and "</PullToRefresh>" in t:
    print("pull-to-refresh already wired")
    raise SystemExit(0)

orig = t

if 'from "./components/PullToRefresh"' not in t:
    t = 'import { PullToRefresh } from "./components/PullToRefresh";\n' + t
    print("import added")

if "const [refreshKey, setRefreshKey]" not in t:
    for needle in (
        'const [theme, setTheme]',
        'const [currentView, setCurrentView]',
        'const [userProfile, setUserProfile]',
    ):
        if needle in t:
            idx = t.find(needle)
            line_end = t.find("\n", idx)
            t = t[: line_end + 1] + "  const [refreshKey, setRefreshKey] = useState(0);\n" + t[line_end + 1 :]
            print("refreshKey state")
            break

if "const handleAppRefresh" not in t:
    marker = "      <SEO "
    if marker not in t:
        marker = "      {/* Scrollable Main Content */}"
    handler = '''
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

'''
    if marker in t:
        t = t.replace(marker, handler + marker, 1)
        print("handleAppRefresh added")

old_scroll = '''        {/* Scrollable Main Content */}
        <div
          className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >'''

new_scroll = '''        {/* Scrollable Main Content + pull-to-refresh */}
        <PullToRefresh
          theme={theme}
          onRefresh={handleAppRefresh}
          disabled={currentView === "emi-live"}
          className={`flex-1 overflow-x-hidden overflow-y-auto hide-scrollbar ${theme === "dark" ? "bg-gray-950" : "bg-slate-50"}`}
        >
          <div key={refreshKey}>'''

if old_scroll in t and "onRefresh={handleAppRefresh}" not in t:
    t = t.replace(old_scroll, new_scroll, 1)
    print("opened PullToRefresh wrapper")

if "onRefresh={handleAppRefresh}" in t and "</PullToRefresh>" not in t:
    idx = t.find("<PullToRefresh")
    for close_pat in (
        "\n        </div>\n\n        {/* Bottom",
        "\n        </div>\n        <div className={`absolute bottom",
        "\n        </div>\n        <nav",
        "\n        </div>\n      </div>",
    ):
        pos = t.find(close_pat, idx)
        if pos > 0:
            t = t[:pos] + "\n          </div>\n        </PullToRefresh>" + close_pat.replace("\n        </div>", "", 1)
            print("closed PullToRefresh")
            break
    else:
        sub = "\n        </div>\n      </div>"
        rest = t[idx:]
        p = rest.find(sub)
        if p > 0:
            t = t[: idx + p] + "\n          </div>\n        </PullToRefresh>\n      </div>" + t[idx + p + len(sub) :]
            print("closed PullToRefresh fallback")

if "getDoc" not in t[:4000]:
    m = re.search(r'import \{([^}]+)\} from ["\']firebase/firestore["\']', t)
    if m and "getDoc" not in m.group(1):
        t = t[: m.start(1)] + m.group(1).rstrip() + ", getDoc " + t[m.end(1) :]
        print("getDoc import added")

if t != orig:
    APP.write_text(t, encoding="utf-8")
    print("wrote App.tsx")
else:
    print("App.tsx unchanged")
