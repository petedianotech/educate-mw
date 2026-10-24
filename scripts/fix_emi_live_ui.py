#!/usr/bin/env python3
"""Replace CallingView live UI with new layout: header, card, spectrum, side panel."""
from pathlib import Path
import re

APP = Path("src/App.tsx")
WAVE = Path("src/components/EmiLiveWaveform.tsx")

WAVEFORM_FILE = open(Path(__file__).resolve().parent.parent / "src/components/EmiLiveWaveform.tsx").read() if (Path(__file__).resolve().parent.parent / "src/components/EmiLiveWaveform.tsx").exists() else ""

NEW_RETURN = r'''  return (
    <div
      className={`flex flex-col absolute inset-0 z-50 overflow-hidden font-sans ${
        theme === "dark" ? "bg-[#0b0f19] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[70%] h-[45%] bg-violet-600/15 rounded-full blur-[90px] pointer-events-none" />

      <header className="relative z-30 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={onEnd}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-90 transition"
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-black tracking-tight text-white">Emi</h1>
        <button
          type="button"
          onClick={() => setShowVoicePicker((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 active:scale-95 transition"
        >
          Voice
          <ChevronDown size={14} className={showVoicePicker ? "rotate-180 transition" : "transition"} />
        </button>
      </header>

      {showVoicePicker && (
        <div className="absolute right-4 top-14 z-40 w-64 rounded-2xl border border-white/10 bg-[#121826]/95 backdrop-blur-xl shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 px-1">Female</p>
          <div className="space-y-1.5 mb-3">
            {[
              { name: "Kore", desc: "Warm & friendly" },
              { name: "Aoede", desc: "Soft & calm" },
            ].map((opt) => (
              <button
                key={opt.name}
                type="button"
                onClick={() => handleVoiceChange(opt.name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition active:scale-[0.98] ${
                  voiceName === opt.name
                    ? "bg-indigo-600/25 border-indigo-400 text-white"
                    : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <span className="font-bold block">{opt.name}</span>
                <span className="text-[11px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/90 mb-2 px-1">Male</p>
          <div className="space-y-1.5">
            {[
              { name: "Puck", desc: "Upbeat & lively" },
              { name: "Charon", desc: "Deep & calm" },
            ].map((opt) => (
              <button
                key={opt.name}
                type="button"
                onClick={() => handleVoiceChange(opt.name)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition active:scale-[0.98] ${
                  voiceName === opt.name
                    ? "bg-indigo-600/25 border-indigo-400 text-white"
                    : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                <span className="font-bold block">{opt.name}</span>
                <span className="text-[11px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col px-5 pb-6 min-h-0">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div
            className={`relative w-[min(72vw,280px)] aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.25)] ${
              isEmiSpeaking ? "ring-2 ring-emerald-400/50" : isUserSpeaking && !isMuted ? "ring-2 ring-amber-400/50" : ""
            }`}
          >
            <img
              src="/emiai.png"
              alt="Emi AI"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://i.ibb.co/cS5rBBny/emi-AI-logo.png";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19]/80 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isConnected ? "Live" : isThinking ? "Connecting" : "Ready"}
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-[10px] font-mono font-bold text-white/80">
              {typeof formatTime === "function" ? formatTime(seconds) : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
            </div>
          </div>

          <div className="w-full max-w-sm mt-5 flex items-start gap-2">
            <div className="flex-1 min-w-0 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 min-h-[4.5rem]">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                {isUserSpeaking && !isMuted ? "You" : "Emi"}
              </p>
              <p className="text-sm leading-relaxed text-white/90 line-clamp-4">
                {isUserSpeaking && liveTranscript ? liveTranscript : emiSubtitles || "Listening\u2026"}
              </p>
              {errorMsg && <p className="mt-2 text-xs text-rose-400 font-medium">{errorMsg}</p>}
            </div>
            <button
              type="button"
              onClick={() => setShowSidePanel((v) => !v)}
              className="shrink-0 w-11 h-11 mt-1 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 active:scale-90 transition"
              aria-label="Controls"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="w-full max-w-sm mt-4">
            <EmiLiveWaveform
              mode={isEmiSpeaking ? "emi" : isUserSpeaking && !isMuted ? "user" : "idle"}
              analyser={isEmiSpeaking ? emiAnalyserNode : isUserSpeaking ? userAnalyserNode : emiAnalyserNode}
              height={64}
            />
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
              Spectrum \u00b7 {isEmiSpeaking ? "Emi" : isUserSpeaking && !isMuted ? "You" : "Idle"}
            </p>
          </div>
        </div>

        {showTextInput && (
          <form
            className="flex gap-2 mt-3 animate-in slide-in-from-bottom-2 duration-200"
            onSubmit={(e) => {
              e.preventDefault();
              sendVoiceQuery(liveTranscript);
            }}
          >
            <input
              value={liveTranscript}
              onChange={(e) => setLiveTranscript(e.target.value)}
              placeholder="Type a message for Emi\u2026"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-indigo-500"
            />
            <button type="submit" className="px-4 rounded-xl bg-indigo-600 font-bold text-sm active:scale-95">
              Send
            </button>
          </form>
        )}
      </div>

      {showSidePanel && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            aria-label="Close panel"
            onClick={() => setShowSidePanel(false)}
          />
          <div className="relative h-full w-[min(78vw,280px)] bg-[#121826] border-l border-white/10 shadow-2xl flex flex-col justify-center gap-4 px-6 animate-in slide-in-from-right duration-300">
            <button
              type="button"
              onClick={() => {
                setShowSidePanel(false);
                onEnd();
              }}
              className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 active:scale-95 transition"
            >
              End
            </button>
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider border active:scale-95 transition ${
                isMuted
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              }`}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowTextInput((v) => !v);
                setShowSidePanel(false);
              }}
              className="w-full py-4 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 font-black text-sm uppercase tracking-wider active:scale-95 transition"
            >
              Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
'''


def main() -> None:
    # Waveform is already on repo; ensure present
    if not WAVE.exists() and WAVEFORM_FILE:
        WAVE.parent.mkdir(parents=True, exist_ok=True)
        WAVE.write_text(WAVEFORM_FILE, encoding="utf-8")
        print("wrote waveform")

    if not APP.exists():
        print("no App.tsx")
        return

    t = APP.read_text(encoding="utf-8")
    if "EmiLiveWaveform" in t and "showSidePanel" in t and 'title "Emi"' in t.replace(">Emi<", 'title "Emi"'):
        # already partially applied
        pass
    if "showSidePanel" in t and "EmiLiveWaveform" in t and "Spectrum" in t:
        print("Emi live UI already applied")
        return

    orig = t

    if 'from "./components/EmiLiveWaveform"' not in t:
        t = 'import { EmiLiveWaveform } from "./components/EmiLiveWaveform";\n' + t
        print("import waveform")

    if "ChevronDown" not in t[:6000]:
        t = t.replace("ArrowLeft,", "ArrowLeft,\n  ChevronDown,", 1)
    if "MoreVertical" not in t[:6000]:
        t = t.replace("ArrowLeft,", "ArrowLeft,\n  MoreVertical,", 1)

    if "showSidePanel" not in t:
        old = "  const [showVoicePicker, setShowVoicePicker] = useState(false);"
        new = """  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);"""
        if old in t:
            t = t.replace(old, new, 1)
            print("side panel state")

    old_voices = re.search(r"const voiceOptions = \[[\s\S]*?\];", t)
    if old_voices and "Aoede" not in old_voices.group(0)[:200]:
        t = (
            t[: old_voices.start()]
            + """const voiceOptions = [
    { name: "Kore", desc: "Female \u00b7 Warm & friendly" },
    { name: "Aoede", desc: "Female \u00b7 Soft & calm" },
    { name: "Puck", desc: "Male \u00b7 Upbeat & lively" },
    { name: "Charon", desc: "Male \u00b7 Deep & calm" },
  ];"""
            + t[old_voices.end() :]
        )
        print("voice options 2+2")

    start = t.find("function CallingView({")
    if start < 0:
        print("CallingView not found")
        if t != orig:
            APP.write_text(t, encoding="utf-8")
        return

    next_fn = t.find("\nfunction ", start + 20)
    block = t[start:next_fn]
    ui_ret = block.rfind("  return (\n    <div")
    if ui_ret < 0:
        ui_ret = block.rfind("  return (")
    if ui_ret < 0:
        print("CallingView return not found")
        return

    abs_ret = start + ui_ret
    close = t.find("\n}\n\nfunction ", abs_ret)
    if close < 0:
        close = t.find("\n}\nfunction ", abs_ret)
    if close < 0:
        print("could not find CallingView end")
        return

    ret_end = t.rfind("  );", abs_ret, close)
    if ret_end < 0:
        print("could not find return end")
        return
    ret_end += len("  );")

    t = t[:abs_ret] + NEW_RETURN + t[ret_end:]
    print("CallingView UI replaced")

    if t != orig:
        APP.write_text(t, encoding="utf-8")
        print("wrote App.tsx")
    else:
        print("unchanged")


if __name__ == "__main__":
    main()
