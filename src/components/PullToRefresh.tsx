import React, { useCallback, useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

type Props = {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  theme?: "light" | "dark";
  /** Disable during Emi live call so gestures stay for the call UI */
  disabled?: boolean;
  className?: string;
};

const THRESHOLD = 72;
const MAX_PULL = 120;

/**
 * Native-feeling pull-to-refresh for the main app scroll container.
 * Works on touch (APK + mobile PWA). onRefresh must reload real app data.
 */
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
