from pathlib import Path
text = Path("src/App.tsx").read_text()
n = 0
old = """  const handleVoiceChange = (v: string) => {
    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
  };"""
new = """  const handleVoiceChange = (v: string) => {
    if (v === voiceName) {
      setShowVoicePicker(false);
      return;
    }
    // Live API sets voice only at session start — restart call with new voice.
    setIsConnected(false);
    setIsThinking(true);
    setEmiSubtitles(`Switching to ${v} voice… Please wait a moment.`);
    setLiveTranscript("");
    setSeconds(0);
    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
  };"""
if old in text:
    text = text.replace(old, new, 1)
    n += 1
    print("OK voice")
else:
    print("MISS voice")
old2 = """              <span className=\"text-[10px] uppercase font-black text-emerald-500 tracking-wider\">
                You are saying:
              </span>
              <p className=\"text-xs font-semibold leading-relaxed line-clamp-2\">
                \"{liveTranscript}\"
              </p>"""
new2 = """              <span className=\"text-[10px] uppercase font-black text-emerald-600 tracking-wider\">
                You said
              </span>
              <p className=\"text-[13px] font-semibold leading-relaxed line-clamp-3 text-left w-full\">
                {liveTranscript}
              </p>"""
if old2 in text:
    text = text.replace(old2, new2, 1)
    n += 1
    print("OK sub")
else:
    print("MISS sub")
Path("src/App.tsx").write_text(text)
print("done", n)
