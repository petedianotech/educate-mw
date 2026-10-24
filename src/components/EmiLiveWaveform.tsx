import React, { useEffect, useRef } from "react";

type Mode = "idle" | "emi" | "user";

type Props = {
  mode: Mode;
  analyser?: AnalyserNode | null;
  className?: string;
  height?: number;
};

/**
 * Continuous Gemini-style spectrum wave (smooth curves, not bars).
 * idle → blue / white / navy; emi → +green; user → gold.
 */
export function EmiLiveWaveform({
  mode,
  analyser,
  className = "",
  height = 72,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);
  const ampRef = useRef(0.35);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.clientWidth || 320;
      const h = height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const colors = () => {
      if (mode === "emi") {
        return {
          a: "rgba(59, 130, 246, 0.95)",
          b: "rgba(52, 211, 153, 0.95)",
          c: "rgba(255, 255, 255, 0.9)",
          d: "rgba(30, 27, 75, 0.85)",
          glow: "rgba(52, 211, 153, 0.35)",
        };
      }
      if (mode === "user") {
        return {
          a: "rgba(59, 130, 246, 0.95)",
          b: "rgba(251, 191, 36, 0.95)",
          c: "rgba(255, 255, 255, 0.9)",
          d: "rgba(30, 27, 75, 0.85)",
          glow: "rgba(251, 191, 36, 0.35)",
        };
      }
      return {
        a: "rgba(96, 165, 250, 0.85)",
        b: "rgba(255, 255, 255, 0.75)",
        c: "rgba(129, 140, 248, 0.7)",
        d: "rgba(15, 23, 42, 0.9)",
        glow: "rgba(99, 102, 241, 0.25)",
      };
    };

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth || 320;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      let target = mode === "idle" ? 0.28 : 0.55;
      if (analyser && data) {
        try {
          analyser.getByteTimeDomainData(data as any);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          target = Math.min(0.95, 0.25 + Math.sqrt(sum / data.length) * 2.8);
        } catch {}
      }
      ampRef.current += (target - ampRef.current) * 0.12;

      phaseRef.current += mode === "idle" ? 0.035 : 0.07;
      const phase = phaseRef.current;
      const amp = ampRef.current;
      const c = colors();

      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, c.a);
      g.addColorStop(0.35, c.b);
      g.addColorStop(0.65, c.c);
      g.addColorStop(1, c.d);

      ctx.save();
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = mode === "idle" ? 8 : 16;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = g;

      const mid = h / 2;
      const layers = [
        { scale: 1, alpha: 1, freq: 1.2 },
        { scale: 0.55, alpha: 0.45, freq: 1.8 },
        { scale: 0.3, alpha: 0.25, freq: 2.4 },
      ];

      for (const layer of layers) {
        ctx.globalAlpha = layer.alpha;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const t = x / w;
          const y =
            mid +
            Math.sin(t * Math.PI * 2 * layer.freq + phase) * amp * mid * 0.55 * layer.scale +
            Math.sin(t * Math.PI * 4 + phase * 1.3) * amp * mid * 0.18 * layer.scale;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [mode, analyser, height]);

  return (
    <div className={`w-full ${className}`}>
      <canvas ref={canvasRef} className="w-full block rounded-xl" style={{ height }} aria-hidden />
    </div>
  );
}
