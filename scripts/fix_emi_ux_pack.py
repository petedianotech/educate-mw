#!/usr/bin/env python3
"""Emi UX pack: Google Search on live, memory panel, Start-call, fresh chats, welcome, quick prompts."""
from pathlib import Path

APP = Path("src/App.tsx")
LIVE = Path("src/services/geminiLive.ts")
SERVER = Path("server.ts")


def patch_live_search() -> None:
    if not LIVE.exists():
        return
    t = LIVE.read_text(encoding="utf-8")
    orig = t

    if "tools: [{ googleSearch: {} }]" not in t:
        if "systemInstruction: systemInstructionText," in t:
            t = t.replace(
                "systemInstruction: systemInstructionText,",
                "tools: [{ googleSearch: {} }],\n              systemInstruction: systemInstructionText,",
                1,
            )
            print("live: googleSearch tool added")

    search_block = (
        "\nSEARCH & TOOLS:\n"
        "You have Google Search enabled on this live call. When the student asks you to search, "
        "look something up, or needs current facts (news, dates, definitions beyond your knowledge), "
        "you MUST use the google_search tool. Never say you cannot search the web or that you lack internet access.\n"
    )
    if "You have Google Search enabled" not in t:
        for marker in ("ON THIS LIVE CALL:", "SPOKEN RULES:", "LIVE CALL:"):
            if marker in t:
                t = t.replace(marker, search_block + marker, 1)
                print("live: search instruction injected")
                break

    if "userMemory?:" not in t and "systemInstruction?: string;" in t:
        t = t.replace(
            "systemInstruction?: string;",
            "systemInstruction?: string;\n  userMemory?: string;",
            1,
        )
    if "this.config.userMemory" not in t and "this.config.userLevel" in t:
        t = t.replace(
            "${this.config.userLevel ? `Student level: ${this.config.userLevel}.` : \"\"}",
            "${this.config.userLevel ? `Student level: ${this.config.userLevel}.` : \"\"}${this.config.userMemory ? `\\nSTUDENT MEMORY:\\n${this.config.userMemory}` : \"\"}",
            1,
        )

    if t != orig:
        LIVE.write_text(t, encoding="utf-8")
        print("wrote geminiLive.ts")


def patch_server() -> None:
    if not SERVER.exists():
        return
    t = SERVER.read_text(encoding="utf-8")
    if "You have Google Search" not in t and "You are Emi" in t:
        t = t.replace(
            "You are Emi",
            "You are Emi. You have Google Search — use it when students ask to search or need current facts. Never claim you cannot search. You are Emi",
            1,
        )
        SERVER.write_text(t, encoding="utf-8")
        print("server: search instruction")


def patch_app() -> None:
    if not APP.exists():
        return
    t = APP.read_text(encoding="utf-8")
    orig = t

    if "Brain," not in t[:8000]:
        t = t.replace("ArrowLeft,", "ArrowLeft,\n  Brain,\n  BookOpen,\n  Sparkles,", 1)

    old_active = """  const [activeConvoId, setActiveConvoId] = useState<string>(() => {
    return conversations[0]?.id || "convo-" + Date.now();
  });"""
    new_active = """  const [activeConvoId, setActiveConvoId] = useState<string>(() => {
    return "convo-" + Date.now();
  });
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [emiMemory, setEmiMemory] = useState<string>(() => {
    try {
      return localStorage.getItem(`mw_emi_memory_${userKey}`) || "";
    } catch {
      return "";
    }
  });
  const [showWelcome, setShowWelcome] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setShowWelcome(false), 5000);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === activeConvoId)) return prev;
      const blank = {
        id: activeConvoId,
        title: "New Study Chat",
        messages: [] as any[],
        updatedAt: Date.now(),
        tone: "step-by-step" as EmiTone,
      };
      return [blank, ...prev].slice(0, 40);
    });
  }, []);
  const saveEmiMemory = (text: string) => {
    setEmiMemory(text);
    try {
      localStorage.setItem(`mw_emi_memory_${userKey}`, text);
    } catch {}
  };"""
    if old_active in t and "showMemoryPanel" not in t:
        t = t.replace(old_active, new_active, 1)
        print("fresh chat + memory + welcome state")

    chip_start = t.find("{/* Quick Suggestion Chips */}")
    if chip_start > 0 and "Crush this maths problem" not in t:
        after = t.find("</button>", t.find("Explain photosynthesis", chip_start) if "Explain photosynthesis" in t[chip_start:chip_start+5000] else chip_start)
        if "Explain photosynthesis" in t:
            after = t.find("</button>", t.find("Explain photosynthesis")) + len("</button>")
            grid_end = t.find("\n            </div>", after)
            new_chips = """            {/* Quick Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-2 text-left">
              <button type="button" onClick={() => handleSend("Help me crush this maths problem step-by-step. I'll paste the question next.")} className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${theme === "dark" ? "bg-gray-900/80 border-gray-800 text-gray-300 hover:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-white hover:border-indigo-300 shadow-sm"}`}>
                <Calculator size={16} className="text-indigo-500 shrink-0" />
                <span className="line-clamp-2">Crush this maths problem</span>
              </button>
              <button type="button" onClick={() => handleSend("Help me with my homework. Guide me step-by-step without just giving the final answer.")} className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${theme === "dark" ? "bg-gray-900/80 border-gray-800 text-gray-300 hover:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-white hover:border-indigo-300 shadow-sm"}`}>
                <BookOpen size={16} className="text-sky-500 shrink-0" />
                <span className="line-clamp-2">Help with my homework</span>
              </button>
              <button type="button" onClick={() => handleSend("Give me practical MSCE exam tips I can use this week — focus, timing, and common traps.")} className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${theme === "dark" ? "bg-gray-900/80 border-gray-800 text-gray-300 hover:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-white hover:border-indigo-300 shadow-sm"}`}>
                <Trophy size={16} className="text-amber-500 shrink-0" />
                <span className="line-clamp-2">MSCE exam tips that work</span>
              </button>
              <button type="button" onClick={() => handleSend("Build me a simple study guide for my next test. Ask which subject and topic first.")} className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${theme === "dark" ? "bg-gray-900/80 border-gray-800 text-gray-300 hover:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-white hover:border-indigo-300 shadow-sm"}`}>
                <Sparkles size={16} className="text-violet-500 shrink-0" />
                <span className="line-clamp-2">Build my study guide</span>
              </button>
            </div>"""
            if grid_end > chip_start:
                t = t[:chip_start] + new_chips + t[grid_end + len("\n            </div>") :]
                print("quick prompts replaced")

    if "showWelcome" in t and "let&apos;s level up today" not in t and "level up today" not in t:
        marker = """  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${
        theme === "dark" ? "emw-page-bg-dark text-white" : "emw-page-bg text-slate-900"
      } animate-in slide-in-from-right duration-300 overflow-hidden`}
    >
      {/* Top Header */}"""
        welcome = """  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col ${
        theme === "dark" ? "emw-page-bg-dark text-white" : "emw-page-bg text-slate-900"
      } animate-in slide-in-from-right duration-300 overflow-hidden`}
    >
      {showWelcome && (
        <div className="absolute top-16 left-4 right-4 z-[60] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-500">
          <div className={`mx-auto max-w-md rounded-2xl px-4 py-3 text-center shadow-xl border ${
            theme === "dark" ? "bg-indigo-600/90 border-indigo-400/30 text-white" : "bg-indigo-600 border-indigo-500 text-white"
          }`}>
            <p className="text-sm font-medium">
              Hello{" "}
              <span className="font-black tracking-tight">{profile?.displayName || profile?.name || "scholar"}</span>
              {" — "}
              <span className="font-extrabold text-amber-200">let&apos;s level up today</span>
            </p>
          </div>
        </div>
      )}
      {/* Top Header */}"""
        if marker in t:
            t = t.replace(marker, welcome, 1)
            print("welcome banner added")

    if "showMemoryPanel" in t and "setShowMemoryPanel(true)" not in t:
        call_btn = t.find("onClick={() => setIsCalling(true)}")
        if call_btn > 0:
            btn_start = t.rfind("<button", call_btn - 200, call_btn)
            if btn_start > 0:
                brain_btn = """          <button type="button" onClick={() => setShowMemoryPanel(true)} className={`p-2.5 rounded-full border transition active:scale-90 ${theme === "dark" ? "bg-white/5 border-white/10 text-violet-300 hover:bg-white/10" : "bg-white border-slate-200 text-violet-600 hover:bg-slate-50"}`} title="Emi Memory" aria-label="Open memory"><Brain size={18} /></button>\n"""
                t = t[:btn_start] + brain_btn + t[btn_start:]
                print("brain button added")

        if "Emi Memory" not in t[t.find("function EmiChatView") : t.find("function CallingView")]:
            panel = """
      {showMemoryPanel && (
        <div className="absolute inset-0 z-[70] flex justify-end">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close memory" onClick={() => setShowMemoryPanel(false)} />
          <div className={`relative h-full w-[min(92vw,360px)] border-l shadow-2xl flex flex-col ${theme === "dark" ? "bg-[#121826] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"} animate-in slide-in-from-right duration-300`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2"><Brain size={18} className="text-violet-400" /><h2 className="font-black text-sm tracking-tight">Emi Memory</h2></div>
              <button type="button" onClick={() => setShowMemoryPanel(false)} className="p-2 rounded-full hover:bg-white/10"><X size={16} /></button>
            </div>
            <p className="px-4 pt-3 text-[11px] opacity-70 leading-relaxed">Notes Emi uses to personalize tutoring (subjects, goals, weak topics). Stored on this device.</p>
            <textarea value={emiMemory} onChange={(e) => saveEmiMemory(e.target.value)} placeholder="e.g. Form 4, weak in quadratic equations, preparing for MSCE Biology…" className={`mx-4 mt-3 flex-1 mb-4 rounded-xl border p-3 text-sm outline-none resize-none ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
            <button type="button" onClick={() => setShowMemoryPanel(false)} className="mx-4 mb-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold active:scale-[0.98]">Save memory</button>
          </div>
        </div>
      )}
"""
            anchor = t.find("function CallingView({")
            if anchor > 0:
                emi_end = t.rfind("\n  );\n}", 0, anchor)
                div_close = t.rfind("</div>", 0, emi_end)
                if div_close > 0:
                    t = t[:div_close] + panel + t[div_close:]
                    print("memory panel injected")

    if "userMemory:" not in t[t.find("new GeminiLiveService") : t.find("new GeminiLiveService") + 900]:
        n = 'userLevel: profile?.classLevel || "MSCE Form 4",'
        if n in t:
            rep = (
                'userLevel: profile?.classLevel || "MSCE Form 4",\n'
                '        userMemory: (typeof window !== "undefined" && profile?.uid) '
                '? (localStorage.getItem(`mw_emi_memory_${profile.uid}`) || "") : "",'
            )
            t = t.replace(n, rep, 1)
            print("live service memory wire")

    if "callArmed" not in t and "function CallingView" in t:
        marker = "const [showVoicePicker, setShowVoicePicker] = useState(false);"
        if marker in t:
            t = t.replace(marker, marker + "\n  const [callArmed, setCallArmed] = useState(false);", 1)
        else:
            m2 = "const [isConnected, setIsConnected] = useState(false);"
            if m2 in t:
                t = t.replace(m2, m2 + "\n  const [callArmed, setCallArmed] = useState(false);", 1)

        sess = t.find("Main Gemini Live Session Lifecycle")
        if sess > 0:
            effect_start = t.find("useEffect(() => {", sess)
            if effect_start > 0:
                t = t[:effect_start] + "useEffect(() => {\n    if (!callArmed) return;\n" + t[effect_start + len("useEffect(() => {") :]
                dep = t.find("}, [voiceName]);", effect_start)
                if dep > 0:
                    t = t[:dep] + "}, [voiceName, callArmed]);" + t[dep + len("}, [voiceName]);") :]
                print("live session gated on callArmed")

        if "Start call" not in t:
            start_block = """
      {!callArmed && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0b0f19]/80 backdrop-blur-sm px-6">
          <p className="text-sm text-white/70 mb-4 text-center max-w-xs">Ready when you are. Tap start to begin your live tutoring session with Emi.</p>
          <button type="button" onClick={() => setCallArmed(true)} className="px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base tracking-wide shadow-lg shadow-indigo-600/40 active:scale-95 transition">Start call</button>
          <button type="button" onClick={onEnd} className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white/70">Cancel</button>
        </div>
      )}
"""
            header_end = t.find("</header>", t.find("function CallingView"))
            if header_end > 0:
                t = t[: header_end + len("</header>")] + start_block + t[header_end + len("</header>") :]
                print("Start call overlay added")

    if t != orig:
        if len(t) < len(orig) * 0.5:
            print("ERROR: abort shrink")
            return
        APP.write_text(t, encoding="utf-8")
        print("wrote App.tsx", len(t))
    else:
        print("App.tsx unchanged")


def main() -> None:
    patch_live_search()
    patch_server()
    patch_app()
    print("emi ux pack done")


if __name__ == "__main__":
    main()
