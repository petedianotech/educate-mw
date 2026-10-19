from pathlib import Path

def main():
    p = Path("src/services/geminiLive.ts")
    text = p.read_text()
    old_map = '''      const voiceMapping: Record<string, string> = {
        Aoede: "Zephyr",
        Kore: "Kore",
        Puck: "Puck",
        Charon: "Charon",
        Fenrir: "Fenrir",
        Zephyr: "Zephyr",
      };
      const targetVoice = voiceMapping[this.config.voiceName || ""] || "Kore";'''
    new_map = '''      const allowedVoices = new Set([
        "Kore", "Zephyr", "Puck", "Charon", "Fenrir", "Aoede",
        "Orus", "Autonoe", "Umbriel", "Erinome", "Laomedeia", "Schedar", "Achird",
      ]);
      const requested = (this.config.voiceName || "Kore").trim();
      const targetVoice = allowedVoices.has(requested) ? requested : "Kore";
      console.log("[Emi Live] voice:", targetVoice);'''
    if old_map in text:
        text = text.replace(old_map, new_map, 1)
        print("OK voice")
    else:
        print("MISS voice")

    old_si_start = "`You are Emi, an elite AI study tutor for JCE and MSCE"
    if old_si_start in text and "Peter Damiano" not in text:
        start = text.find(old_si_start)
        end = text.find("`;", start)
        new_si = '''`You are Emi, the AI study tutor inside the Educate MW (Educate Malawi) app.
Your name is Emi. Always introduce yourself as Emi when asked who you are.

ABOUT THE APP (Educate MW):
- Study platform for Malawian secondary students (JCE and MSCE / MANEB).
- Features: past papers, notes, quizzes, flashcards, certificates, leaderboard, community groups, dictionary, MSCE points calculator, and live/text tutoring with you.
- Live site: educatemw.vercel.app

WHO BUILT YOU:
- Developed by Peter Damiano (Petediano), full-stack developer from Mulanje, Malawi.
- Portfolio: https://peterdamiano.vercel.app
- Built with the MSCE Preparation team. Teachers include S. Lifa and E. Muthipo.
- Pro payments are handled in-app (Airtel Money to S. Lifa as shown on the subscription screen).

YOUR ROLE:
- Warm secondary-school tutor for Forms 1–4. Guide step-by-step.
- Simple English; respond in Chichewa when the student uses Chichewa.
- Never invent MANEB facts; if unsure, say so.

You are on a LIVE VOICE CALL.
SPOKEN RULES:
1. Short turns (1–3 sentences). No markdown, asterisks, or emojis.
2. If asked your name: "I am Emi, your study tutor in the Educate MW app."
3. If asked who built you: Peter Damiano (full-stack developer) with the MSCE Preparation team (S. Lifa, E. Muthipo). More at peterdamiano.vercel.app.
${this.config.userLevel ? `The student is studying in ${this.config.userLevel}.` : ""}`'''
        text = text[:start] + new_si + text[end+2:]
        print("OK identity")
    elif "Peter Damiano" in text:
        print("identity already")
    else:
        print("MISS identity")

    p.write_text(text)

    # server models
    sp = Path("server.ts")
    st = sp.read_text()
    old_m = 'const TEXT_MODELS = ["gemini-3.1-flash-lite", "gemini-3.8-flash"] as const;'
    new_m = 'const TEXT_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"] as const;'
    if old_m in st:
        st = st.replace(old_m, new_m, 1)
        print("OK models")
    # strengthen live voice-reply system instruction if present
    if "Peter Damiano" not in st[st.find("voice-reply"):st.find("voice-reply")+2500] if "voice-reply" in st else True:
        old_v = "You are Emi AI, a friendly, encouraging, and knowledgeable Malawi secondary school study tutor from Educate Malawi (Educate MW)."
        new_v = "You are Emi, the AI study tutor in the Educate MW app. Built by Peter Damiano (peterdamiano.vercel.app) with the MSCE Preparation team (teachers S. Lifa and E. Muthipo)."
        if old_v in st:
            st = st.replace(old_v, new_v, 1)
            print("OK voice-reply identity")
    sp.write_text(st)

    # App calling UI
    ap = Path("src/App.tsx")
    at = ap.read_text()
    old_hv = '''  const handleVoiceChange = (v: string) => {
    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
  };'''
    new_hv = '''  const handleVoiceChange = (v: string) => {
    if (v === voiceName) {
      setShowVoicePicker(false);
      return;
    }
    setIsConnected(false);
    setIsThinking(true);
    setEmiSubtitles(`Switching to ${v} voice… Please wait a moment.`);
    setLiveTranscript("");
    setSeconds(0);
    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
  };'''
    if old_hv in at:
        at = at.replace(old_hv, new_hv, 1)
        print("OK voice UX")
    old_sub = '''              <span className="text-[10px] uppercase font-black text-emerald-500 tracking-wider">
                You are saying:
              </span>
              <p className="text-xs font-semibold leading-relaxed line-clamp-2">
                "{liveTranscript}"
              </p>'''
    new_sub = '''              <span className="text-[10px] uppercase font-black text-emerald-600 tracking-wider">
                You said
              </span>
              <p className="text-[13px] font-semibold leading-relaxed line-clamp-3 text-left w-full">
                {liveTranscript}
              </p>'''
    if old_sub in at:
        at = at.replace(old_sub, new_sub, 1)
        print("OK user sub")
    ap.write_text(at)
    print("done")

if __name__ == "__main__":
    main()
