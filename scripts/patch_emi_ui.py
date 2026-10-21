#!/usr/bin/env python3
"""Apply Emi AI UI upgrades to src/App.tsx (idempotent)."""
from pathlib import Path
import sys

APP = Path("src/App.tsx")
if not APP.exists():
    print("No App.tsx"); sys.exit(0)
t = APP.read_text(encoding="utf-8")
if "stopGeneration" in t and "showChatSidebar" in t:
    print("Emi UI already patched"); sys.exit(0)

# Icons
if "\n  Menu," not in t[:8000]:
    t = t.replace("\n  Phone,", "\n  Menu,\n  Plus,\n  Square,\n  RotateCcw,\n  Phone,", 1)

t = t.replace('      responseText = responseText.replace(/\\$/g, "");\n', "")

needle = '  const [isLoading, setIsLoading] = useState(false);\n  const [lastQuery, setLastQuery] = useState("");'
if needle in t and "abortRef" not in t:
    t = t.replace(needle, '''  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ name: string; mime: string; dataUrl: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  type ChatThread = { id: string; title: string; pinned?: boolean; updatedAt: number; messages: Message[] };
  const chatsKey = `mw_emi_chats_${profile?.uid || "guest"}`;
  const [chatThreads, setChatThreads] = useState<ChatThread[]>(() => {
    try {
      const raw = localStorage.getItem(`mw_emi_chats_${profile?.uid || "guest"}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [activeChatId, setActiveChatId] = useState<string>("current");''', 1)

p_old = '''  useEffect(() => {
    try {
      localStorage.setItem(
        `mw_emi_chat_${profile?.uid || "guest"}`,
        JSON.stringify(messages),
      );
    } catch (e) {}
  }, [messages, profile?.uid]);'''
if p_old in t and "chatsKey" not in t[t.find(p_old):t.find(p_old)+400]:
    t = t.replace(p_old, p_old + '''

  useEffect(() => {
    try {
      localStorage.setItem(chatsKey, JSON.stringify(chatThreads));
      localStorage.setItem(chatsKey + "_active", activeChatId);
    } catch (e) {}
  }, [chatThreads, activeChatId, chatsKey]);''', 1)

hs = '  const handleSend = async (text: string) => {\n    if (!text.trim() || isLoading) return;'
if hs in t and "stopGeneration" not in t:
    t = t.replace(hs, '''  const stopGeneration = () => {
    try { abortRef.current?.abort(); } catch {}
    setIsLoading(false);
    setLoadingStatus("Stopped");
  };

  const handleRetry = () => {
    if (lastQuery && !isLoading) handleSend(lastQuery);
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const next: { name: string; mime: string; dataUrl: string }[] = [];
    for (const file of files.slice(0, 3)) {
      if (file.size > 8 * 1024 * 1024) continue;
      const mime = file.type || "application/octet-stream";
      if (!mime.startsWith("image/") && mime !== "application/pdf") continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      next.push({ name: file.name, mime, dataUrl });
    }
    if (next.length) setPendingFiles((prev) => [...prev, ...next].slice(0, 3));
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      const title = messages.find((m) => m.sender === "user")?.text?.slice(0, 40) || "Chat";
      setChatThreads((prev) => [{ id: Date.now().toString(), title, updatedAt: Date.now(), messages: [...messages] }, ...prev].slice(0, 40));
    }
    setMessages([]);
    setActiveChatId("current");
    setShowChatSidebar(false);
  };

  const openChatThread = (id: string) => {
    const thread = chatThreads.find((c) => c.id === id);
    if (!thread) return;
    if (messages.length > 0 && activeChatId === "current") {
      const title = messages.find((m) => m.sender === "user")?.text?.slice(0, 40) || "Chat";
      setChatThreads((prev) => [{ id: Date.now().toString(), title, updatedAt: Date.now(), messages: [...messages] }, ...prev].slice(0, 40));
    }
    setMessages(thread.messages);
    setActiveChatId(id);
    setShowChatSidebar(false);
  };

  const renameChat = (id: string) => {
    const name = prompt("Rename chat");
    if (!name?.trim()) return;
    setChatThreads((prev) => prev.map((c) => (c.id === id ? { ...c, title: name.trim() } : c)));
  };

  const deleteChat = (id: string) => {
    setChatThreads((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) { setMessages([]); setActiveChatId("current"); }
  };

  const pinChat = (id: string) => {
    setChatThreads((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c));
      return [...next].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
    });
  };

  const handleSend = async (text: string) => {
    if ((!text.trim() && pendingFiles.length === 0) || isLoading) return;''', 1)

old_um = '    const userMessage: Message = {\n      id: Date.now().toString(),\n      sender: "user",\n      text,'
if old_um in t and "setLastQuery(text)" not in t[t.find("const handleSend"):t.find("const handleSend")+800]:
    t = t.replace(old_um, '    setLastQuery(text);\n    const userMessage: Message = {\n      id: Date.now().toString(),\n      sender: "user",\n      text,', 1)

m = "    setMessages((prev) => [...prev, userMessage]);"
if m in t and "setPendingFiles([])" not in t[t.find(m):t.find(m)+80]:
    t = t.replace(m, m + "\n    setPendingFiles([]);", 1)

if "abortRef.current = controller" not in t:
    t = t.replace("const controller = new AbortController();", "const controller = new AbortController();\n      abortRef.current = controller;", 1)

body_old = '''        body: JSON.stringify({
          messages: messages.slice(-10),
          userMessage: { sender: "user", text },
          userLevel: profile?.level || "Form 4",
          isPro: Boolean(profile?.isPro),
        }),'''
body_new = '''        body: JSON.stringify({
          messages: messages.slice(-10),
          userMessage: { sender: "user", text },
          userLevel: profile?.level || "Form 4",
          isPro: Boolean(profile?.isPro),
          attachments: pendingFiles.slice(0, 3).map((f) => ({
            mimeType: f.mime,
            data: (f.dataUrl.split(",")[1] || ""),
            name: f.name,
          })),
        }),'''
if body_old in t:
    t = t.replace(body_old, body_new, 1)

old_btn = '''          <button
            onClick={() => setIsCalling(true)}
            className={`w-10 h-10 relative group ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"} rounded-full flex items-center justify-center shrink-0 transition-all`}
            title="Start Live Call"
          >
            <Phone size={18} fill="currentColor" />
          </button>
        </div>
      </div>'''
new_btn = '''          <button
            onClick={() => setShowChatSidebar(true)}
            className={`w-10 h-10 relative group ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-300" : "bg-slate-100 border-slate-200 text-slate-600"} border rounded-full flex items-center justify-center shrink-0 transition-all`}
            title="Previous chats"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {showChatSidebar && (
        <div className="fixed inset-0 z-[80] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChatSidebar(false)} />
          <div className={`relative w-[86%] max-w-sm h-full ${theme === "dark" ? "bg-gray-950 border-gray-800" : "bg-white border-slate-200"} border-r shadow-2xl flex flex-col animate-in slide-in-from-left duration-200`}>
            <div className="p-4 border-b border-inherit flex items-center justify-between gap-2">
              <h3 className="font-bold text-base">Chats</h3>
              <button onClick={startNewChat} className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-600 text-white">New chat</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatThreads.length === 0 && (
                <p className="text-sm text-gray-500 px-2 py-6 text-center">No previous chats yet.</p>
              )}
              {chatThreads.map((c) => (
                <div key={c.id} className={`rounded-xl p-3 border ${theme === "dark" ? "border-gray-800 bg-gray-900/60" : "border-slate-200 bg-slate-50"}`}>
                  <button onClick={() => openChatThread(c.id)} className="w-full text-left">
                    <div className="font-semibold text-sm">{c.pinned ? "📌 " : ""}{c.title || "Chat"}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{new Date(c.updatedAt).toLocaleString()}</div>
                  </button>
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => renameChat(c.id)} className="text-[10px] font-bold text-indigo-500">Rename</button>
                    <button onClick={() => pinChat(c.id)} className="text-[10px] font-bold text-amber-500">{c.pinned ? "Unpin" : "Pin"}</button>
                    <button onClick={() => deleteChat(c.id)} className="text-[10px] font-bold text-red-500">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}'''
if old_btn in t:
    t = t.replace(old_btn, new_btn, 1)

old_input = '''            <div className="flex items-end gap-2.5 w-full">
              <textarea
                placeholder="Ask about MSCE, notes, or formulas…"
                className={`flex-1 bg-transparent text-[15px] outline-none ${theme === "dark" ? "text-white placeholder-gray-500" : "text-slate-900 placeholder-slate-400"} font-medium py-3.5 resize-none max-h-40 min-h-[48px] leading-relaxed overflow-y-auto`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      handleSend(input);
                    }
                  }
                }}
                rows={Math.min(5, input.split("\\n").length || 1)}
              />
              <button
                className={`w-[44px] h-[44px] rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  !input.trim() || isLoading
                    ? theme === "dark"
                      ? "bg-gray-800 text-gray-600"
                      : "bg-slate-200 text-slate-400"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                } mb-1.5`}
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
              >
                <Send
                  size={18}
                  fill={!input.trim() || isLoading ? "none" : "currentColor"}
                />
              </button>
            </div>'''

new_input = '''            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onFilesSelected} />
            {pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1 pb-2">
                {pendingFiles.map((f, i) => (
                  <span key={i} className={`text-[11px] font-medium px-2 py-1 rounded-lg ${theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-slate-100 text-slate-700"}`}>
                    {f.name.slice(0, 18)}
                    <button type="button" className="ml-1 text-red-400" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-1.5 w-full">
              <button type="button" onClick={handlePickFiles} title="Attach image or PDF"
                className={`w-[42px] h-[42px] rounded-2xl flex items-center justify-center shrink-0 mb-1.5 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-slate-100 text-slate-600"}`}>
                <Plus size={20} />
              </button>
              <textarea
                placeholder="Ask about MSCE, notes, or formulas…"
                className={`flex-1 bg-transparent text-[15px] outline-none ${theme === "dark" ? "text-white placeholder-gray-500" : "text-slate-900 placeholder-slate-400"} font-medium py-3.5 resize-none max-h-40 min-h-[48px] leading-relaxed overflow-y-auto`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if ((input.trim() || pendingFiles.length) && !isLoading) {
                      handleSend(input || "Please analyse the attached file(s).");
                    }
                  }
                }}
                rows={Math.min(5, input.split("\\n").length || 1)}
              />
              <button type="button" onClick={() => setIsCalling(true)} title="Emi Live call"
                className={`w-[42px] h-[42px] rounded-2xl flex items-center justify-center shrink-0 mb-1.5 ${theme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                <Phone size={18} fill="currentColor" />
              </button>
              {isLoading ? (
                <button type="button" onClick={stopGeneration} title="Stop"
                  className="w-[44px] h-[44px] rounded-2xl flex items-center justify-center shrink-0 mb-1.5 bg-red-500 text-white shadow-lg">
                  <Square size={16} fill="currentColor" />
                </button>
              ) : (
                <button
                  className={`w-[44px] h-[44px] rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    !input.trim() && !pendingFiles.length
                      ? theme === "dark" ? "bg-gray-800 text-gray-600" : "bg-slate-200 text-slate-400"
                      : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  } mb-1.5`}
                  onClick={() => handleSend(input || "Please analyse the attached file(s).")}
                  disabled={!input.trim() && !pendingFiles.length}
                >
                  <Send size={18} fill={!input.trim() && !pendingFiles.length ? "none" : "currentColor"} />
                </button>
              )}
            </div>'''
if old_input in t:
    t = t.replace(old_input, new_input, 1)

if "{chatBubbles}" in t and "handleRetry" in t and "Retry" not in t[t.find("{chatBubbles}"):t.find("{chatBubbles}")+400]:
    t = t.replace("{chatBubbles}", '''{chatBubbles}
        {messages.length > 0 && /error|trouble connecting|timed out|Failed to fetch/i.test(messages[messages.length - 1]?.text || "") && !isLoading && (
          <div className="flex justify-center py-2">
            <button onClick={handleRetry} className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-bold shadow-lg active:scale-95">
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        )}''', 1)

APP.write_text(t, encoding="utf-8")
print("Emi UI patched", APP.stat().st_size)
assert "stopGeneration" in t
