import React, { useEffect, useRef } from "react";

type Mode = "idle" | "emi" | "user";

type Props = {
  mode: Mode;
  analyser?: AnalyserNode | null;
  className?: string;
  height?: number;
};

/** Gemini-style continuous spectrum: soft multi-layer sine waves, refined gradients. */
export function EmiLiveWaveform({
  mode,
  analyser,
  className = "",
  height = 56,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);
  const ampRef = useRef(0.32);

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

    const palette = () => {
      if (mode === "emi") {
        return {
          stops: [
            [0, "rgba(56, 189, 248, 0.95)"],
            [0.4, "rgba(52, 211, 153, 0.9)"],
            [0.75, "rgba(167, 243, 208, 0.85)"],
            [1, "rgba(255, 255, 255, 0.55)"],
          ] as [number, string][],
          glow: "rgba(52, 211, 153, 0.28)",
          base: 0.55,
        };
      }
      if (mode === "user") {
        return {
          stops: [
            [0, "rgba(96, 165, 250, 0.95)"],
            [0.4, "rgba(251, 191, 36, 0.9)"],
            [0.75, "rgba(253, 230, 138, 0.8)"],
            [1, "rgba(255, 255, 255, 0.5)"],
          ] as [number, string][],
          glow: "rgba(251, 191, 36, 0.25)",
          base: 0.55,
        };
      }
      return {
        stops: [
          [0, "rgba(96, 165, 250, 0.75)"],
          [0.35, "rgba(129, 140, 248, 0.7)"],
          [0.65, "rgba(226, 232, 240, 0.55)"],
          [1, "rgba(30, 41, 59, 0.5)"],
        ] as [number, string][],
        glow: "rgba(99, 102, 241, 0.18)",
        base: 0.28,
      };
    };

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth || 320;
      const h = height;
      ctx.clearRect(0, 0, w, h);

      let target = palette().base;
      if (analyser && data) {
        try {
          analyser.getByteTimeDomainData(data as Uint8Array);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          target = Math.min(0.92, 0.22 + Math.sqrt(sum / data.length) * 2.6);
        } catch {}
      }
      ampRef.current += (target - ampRef.current) * 0.1;
      phaseRef.current += mode === "idle" ? 0.028 : 0.055;

      const phase = phaseRef.current;
      const amp = ampRef.current;
      const mid = h / 2;
      const p = palette();

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      for (const [stop, color] of p.stops) grad.addColorStop(stop, color);

      const glowGrad = ctx.createLinearGradient(0, mid - 12, 0, mid + 12);
      glowGrad.addColorStop(0, "transparent");
      glowGrad.addColorStop(0.5, p.glow);
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, mid - 14, w, 28);

      const layers = [
        { scale: 1.0, alpha: 0.95, freq: 1.15, width: 2.2 },
        { scale: 0.62, alpha: 0.45, freq: 1.7, width: 1.6 },
        { scale: 0.35, alpha: 0.28, freq: 2.35, width: 1.2 },
        { scale: 0.18, alpha: 0.15, freq: 3.1, width: 1.0 },
      ];

      for (const layer of layers) {
        ctx.beginPath();
        ctx.globalAlpha = layer.alpha;
        ctx.strokeStyle = grad;
        ctx.lineWidth = layer.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = p.glow;
        ctx.shadowBlur = mode === "idle" ? 6 : 12;

        for (let x = 0; x <= w; x += 1.5) {
          const t = x / w;
          const y =
            mid +
            Math.sin(t * Math.PI * 2 * layer.freq + phase) * amp * mid * 0.48 * layer.scale +
            Math.sin(t * Math.PI * 3.4 + phase * 1.25) * amp * mid * 0.14 * layer.scale;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
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
