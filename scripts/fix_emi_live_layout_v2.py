#!/usr/bin/env python3
"""Force-update CallingView: bottom spectrum card + horizontal control bar from right."""
from pathlib import Path

APP = Path("src/App.tsx")

NEW_RETURN = r"""  return (
    <div
      className={`flex flex-col absolute inset-0 z-50 overflow-hidden font-sans ${
        theme === "dark" ? "bg-[#0b0f19] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[40%] bg-violet-600/12 rounded-full blur-[90px] pointer-events-none" />

      <header className="relative z-30 flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button type="button" onClick={onEnd} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-90 transition" aria-label="Back">
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black tracking-tight text-white">Emi</h1>
        <button type="button" onClick={() => setShowVoicePicker((v) => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 active:scale-95 transition">
          Voice
          <ChevronDown size={14} className={showVoicePicker ? "rotate-180 transition" : "transition"} />
        </button>
      </header>

      {showVoicePicker && (
        <div className="absolute right-4 top-14 z-40 w-64 rounded-2xl border border-white/10 bg-[#121826]/95 backdrop-blur-xl shadow-2xl p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 px-1">Female</p>
          <div className="space-y-1.5 mb-3">
            {[{ name: "Kore", desc: "Warm & friendly" }, { name: "Aoede", desc: "Soft & calm" }].map((opt) => (
              <button key={opt.name} type="button" onClick={() => handleVoiceChange(opt.name)} className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition active:scale-[0.98] ${voiceName === opt.name ? "bg-indigo-600/25 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"}`}>
                <span className="font-bold block">{opt.name}</span>
                <span className="text-[11px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/90 mb-2 px-1">Male</p>
          <div className="space-y-1.5">
            {[{ name: "Puck", desc: "Upbeat & lively" }, { name: "Charon", desc: "Deep & calm" }].map((opt) => (
              <button key={opt.name} type="button" onClick={() => handleVoiceChange(opt.name)} className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition active:scale-[0.98] ${voiceName === opt.name ? "bg-indigo-600/25 border-indigo-400 text-white" : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"}`}>
                <span className="font-bold block">{opt.name}</span>
                <span className="text-[11px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col min-h-0 px-5">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 pt-2">
          <div className={`relative w-[min(68vw,260px)] aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.22)] ${isEmiSpeaking ? "ring-2 ring-emerald-400/50" : isUserSpeaking && !isMuted ? "ring-2 ring-amber-400/50" : ""}`}>
            <img src="/emiai.png" alt="Emi AI" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://i.ibb.co/cS5rBBny/emi-AI-logo.png"; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19]/75 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isConnected ? "Live" : isThinking ? "Connecting" : "Ready"}
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-mono font-bold text-white/80">
              {typeof formatTime === "function" ? formatTime(seconds) : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
            </div>
          </div>

          <div className="w-full max-w-sm mt-5 rounded-2xl bg-white/[0.06] border border-white/10 px-4 py-3 min-h-[4.25rem]">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{isUserSpeaking && !isMuted ? "You" : "Emi"}</p>
            <p className="text-sm leading-relaxed text-white/90 line-clamp-4">{isUserSpeaking && liveTranscript ? liveTranscript : emiSubtitles || "Listening…"}</p>
            {errorMsg && <p className="mt-2 text-xs text-rose-400 font-medium">{errorMsg}</p>}
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto mt-4 mb-3 shrink-0">
          <div className="relative flex items-center justify-end min-h-[48px]">
            <div className={`absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 transition-all duration-300 ease-out origin-right ${showSidePanel ? "opacity-100 scale-x-100 translate-x-0 pointer-events-auto" : "opacity-0 scale-x-75 translate-x-3 pointer-events-none"}`}>
              <button type="button" onClick={() => { setShowSidePanel(false); onEnd(); }} className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/25 active:scale-95 transition whitespace-nowrap">End</button>
              <button type="button" onClick={() => setIsMuted((m) => !m)} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border active:scale-95 transition whitespace-nowrap ${isMuted ? "bg-amber-500/20 border-amber-400/40 text-amber-300" : "bg-white/8 border-white/12 text-white hover:bg-white/12"}`}>{isMuted ? "Unmute" : "Mute"}</button>
              <button type="button" onClick={() => { setShowTextInput((v) => !v); setShowSidePanel(false); }} className="px-4 py-2.5 rounded-xl bg-indigo-600/35 border border-indigo-400/30 text-indigo-100 text-xs font-black uppercase tracking-wider active:scale-95 transition whitespace-nowrap">Text</button>
            </div>
            <button type="button" onClick={() => setShowSidePanel((v) => !v)} className={`relative z-10 shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition active:scale-90 ${showSidePanel ? "bg-indigo-600 border-indigo-400/40 text-white shadow-lg shadow-indigo-600/30" : "bg-indigo-600/85 border-indigo-400/30 text-white shadow-md shadow-indigo-600/25"}`} aria-label="Controls" aria-expanded={showSidePanel}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {showTextInput && (
            <form className="flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); sendVoiceQuery(liveTranscript); }}>
              <input value={liveTranscript} onChange={(e) => setLiveTranscript(e.target.value)} placeholder="Type a message for Emi…" className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-indigo-500" />
              <button type="submit" className="px-4 rounded-xl bg-indigo-600 font-bold text-sm active:scale-95">Send</button>
            </form>
          )}
        </div>

        <div className="w-full max-w-sm mx-auto shrink-0 pb-6 pt-1">
          <div className="rounded-2xl bg-[#0d1220]/90 border border-white/[0.08] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <EmiLiveWaveform
              mode={isEmiSpeaking ? "emi" : isUserSpeaking && !isMuted ? "user" : "idle"}
              analyser={isEmiSpeaking ? emiAnalyserNode : isUserSpeaking ? userAnalyserNode : emiAnalyserNode}
              height={52}
            />
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 mt-1.5">
              Spectrum · {isEmiSpeaking ? "Emi" : isUserSpeaking && !isMuted ? "You" : "Idle"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
"""


def main() -> None:
    if not APP.exists():
        return
    t = APP.read_text(encoding="utf-8")
    if "scale-x-100" in t and "rounded-2xl bg-[#0d1220]" in t:
        print("layout v2 already applied")
        return
    if 'from "./components/EmiLiveWaveform"' not in t:
        t = 'import { EmiLiveWaveform } from "./components/EmiLiveWaveform";\n' + t
    if "ChevronDown" not in t[:6000]:
        t = t.replace("ArrowLeft,", "ArrowLeft,\n  ChevronDown,", 1)
    if "showSidePanel" not in t:
        old = "  const [showVoicePicker, setShowVoicePicker] = useState(false);"
        if old in t:
            t = t.replace(
                old,
                old
                + "\n  const [showSidePanel, setShowSidePanel] = useState(false);"
                + "\n  const [showTextInput, setShowTextInput] = useState(false);",
                1,
            )

    start = t.find("function CallingView({")
    if start < 0:
        print("CallingView not found")
        return
    next_fn = t.find("\nfunction ", start + 20)
    block = t[start:next_fn]
    ui_ret = block.rfind("  return (\n    <div")
    if ui_ret < 0:
        ui_ret = block.rfind("  return (")
    if ui_ret < 0:
        print("return not found")
        return
    abs_ret = start + ui_ret
    close = t.find("\n}\n\nfunction ", abs_ret)
    if close < 0:
        close = t.find("\n}\nfunction ", abs_ret)
    if close < 0:
        print("end not found")
        return
    ret_end = t.rfind("  );", abs_ret, close)
    if ret_end < 0:
        print("ret end not found")
        return
    ret_end += len("  );")
    t = t[:abs_ret] + NEW_RETURN + t[ret_end:]
    APP.write_text(t, encoding="utf-8")
    print("CallingView layout v2 applied", len(t))


if __name__ == "__main__":
    main()
