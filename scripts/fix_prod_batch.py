#!/usr/bin/env python3
"""Production batch: library download-only, Emi voices/identity, cert download, blue index splash."""
from pathlib import Path
import re

ROOT = Path(".")

def fix_library_download() -> None:
    app = ROOT / "src/App.tsx"
    if not app.exists():
        return
    t = app.read_text(encoding="utf-8")
    orig = t
    old = """    if (item.type === "pdf" && item.content) {
      try {
        if (isNativeApp()) {
          await openPdf(item.content, item.title);
        } else {
          await triggerExplicitDownload(item.content, item.title);
"""
    new = """    if (item.type === "pdf" && item.content) {
      try {
        // Download only — open/read is via row onClick -> library-item reader
        {
          await triggerExplicitDownload(item.content, item.title);
"""
    if old in t:
        t = t.replace(old, new, 1)
        print("library: download no longer opens reader on APK")
    elif "await openPdf(item.content, item.title)" in t and "handleDownload" in t:
        t = t.replace(
            """        if (isNativeApp()) {
          await openPdf(item.content, item.title);
        } else {
          await triggerExplicitDownload(item.content, item.title);
""",
            """        {
          await triggerExplicitDownload(item.content, item.title);
""",
            1,
        )
        print("library: download fixed (alt)")
    else:
        print("library: pattern skip")
    if t != orig:
        app.write_text(t, encoding="utf-8")

def fix_emi_voices_and_reconnect() -> None:
    app = ROOT / "src/App.tsx"
    if not app.exists():
        return
    t = app.read_text(encoding="utf-8")
    orig = t
    new_voices = """  const voiceOptions = [
    { name: "Kore", desc: "Female · Warm & friendly (default)" },
    { name: "Aoede", desc: "Female · Soft & calm" },
    { name: "Leda", desc: "Female · Bright & clear" },
    { name: "Puck", desc: "Male · Upbeat & lively" },
    { name: "Charon", desc: "Male · Deep & calm" },
    { name: "Fenrir", desc: "Male · Strong & clear" },
  ];"""
    if "Female · Warm" not in t and "voiceOptions = [" in t:
        t = re.sub(r"const voiceOptions = \[[^\]]+\];", new_voices.replace("  const voiceOptions = ", "const voiceOptions = "), t, count=1)
        print("voices: male/female English labels")
    old_pick = """    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
  };"""
    new_pick = """    setVoiceName(v);
    localStorage.setItem("emi_voice", v);
    setShowVoicePicker(false);
    try {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect?.();
        liveServiceRef.current = null;
        setIsConnected(false);
        setLiveState("idle");
        setErrorMsg("Voice updated. Tap Call again to use the new voice.");
      }
    } catch (e) {
      console.warn("voice switch reconnect:", e);
    }
  };"""
    if old_pick in t and "Voice updated. Tap Call" not in t:
        t = t.replace(old_pick, new_pick, 1)
        print("voices: reconnect on change")
    if t != orig:
        app.write_text(t, encoding="utf-8")

def fix_gemini_live_identity() -> None:
    p = ROOT / "src/services/geminiLive.ts"
    if not p.exists():
        return
    t = p.read_text(encoding="utf-8")
    orig = t
    if '"Leda"' not in t and "allowedVoices" in t:
        t = t.replace(
            '"Kore", "Zephyr", "Puck", "Charon", "Fenrir", "Aoede"',
            '"Kore", "Zephyr", "Puck", "Charon", "Fenrir", "Aoede", "Leda", "Orus"',
        )
        print("live: Leda allowed")
    identity = """IDENTITY (mandatory — never break this):
Your name is Emi (Emi AI). You are the AI study tutor inside the Educate MW (Educate Malawi) mobile app.
You are NOT Google, NOT Gemini, NOT ChatGPT, and NOT a generic large language model to the student.
If asked who you are, what model you are, or who made you, answer ONLY:
\"I am Emi, your study tutor in the Educate MW app. I was built by Peter Damiano with the MSCE Preparation team for Malawian students.\"
Never say you were developed by Google or that you are Gemini.

ABOUT EDUCATE MW:
Malawian secondary-school app (Forms 1–4, JCE/MSCE / MANEB): notes, past papers, quizzes, flashcards, dictionary, MSCE points calculator, certificates, leaderboard, community, video lessons, Emi text chat and Emi live voice. Sites: educatemw.app / educatemw.vercel.app.

WHO BUILT YOU:
Peter Damiano (Petediano), full-stack developer from Mulanje, Malawi — https://peterdamiano.vercel.app — with teachers S. Lifa and E. Muthipo (MSCE Preparation team).

YOUR JOB ON THIS LIVE CALL:
Warm secondary-school tutor. Teach step-by-step for MANEB subjects. Prefer clear English (en-US). Chichewa only if the student uses or requests it. Never invent exam facts. You may use Google Search grounding for current facts only — still introduce yourself as Emi.

SPOKEN STYLE:
1. Short turns (1–3 sentences). No markdown, bullets, asterisks, or emojis.
2. Name: \"I am Emi, your study tutor in the Educate MW app.\"
3. Builder: \"Built by Peter Damiano with the MSCE Preparation team for Educate MW.\"
"""
    if "You are NOT Google, NOT Gemini" not in t:
        start = t.find("const systemInstructionText =")
        if start > 0:
            tick = t.find("`", start)
            end = t.find("}`", tick)
            if end > tick:
                end = end + 2
            else:
                end = t.find("`;", tick)
                if end > 0:
                    end = end + 2
            if end > tick:
                block = (
                    "const systemInstructionText =\n"
                    "        this.config.systemInstruction ||\n"
                    "        `" + identity + "\n"
                    "${this.config.userLevel ? `Student level: ${this.config.userLevel}. Match depth to that form.` : \"\"}`"
                )
                t = t[:start] + block + t[end:]
                print("live: strong anti-Google identity")
    if "tools: [{ googleSearch: {} }]" not in t and "systemInstruction: systemInstructionText" in t:
        t = t.replace(
            "systemInstruction: systemInstructionText,",
            "tools: [{ googleSearch: {} }],\n              systemInstruction: systemInstructionText,",
            1,
        )
    if t != orig:
        p.write_text(t, encoding="utf-8")

def fix_certificates_download() -> None:
    p = ROOT / "src/components/CertificatesCleanView.tsx"
    if not p.exists():
        return
    t = p.read_text(encoding="utf-8")
    orig = t
    t = t.replace("S. Liffa", "P. Damiano")
    t = t.replace("Teacher & Mentor", "Managing Director")
    t = t.replace("Director of Academic Affairs", "Teacher & Academic Lead")
    t = t.replace("Teacher & Registrar", "Teacher & Academic Lead")
    if "simple PDF certificate was saved" not in t and "handleDownloadPNG" in t:
        start = t.find("  const handleDownloadPNG = async () => {")
        end = t.find("  // Render SVG QR code for verification")
        if start > 0 and end > start:
            new_dl = '''  const saveBlob = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn(e);
      window.open(url, "_blank");
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDownloadPNG = async () => {
    if (!printRef.current) return;
    if (!activeStatus.isUnlocked) {
      alert("Pay and wait for admin approval before downloading the official certificate.");
      return;
    }
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const canvas = await html2canvas(printRef.current, {
        scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: "#ffffff",
        logging: false, imageTimeout: 0,
        onclone: (_d, node) => {
          node.querySelectorAll("img").forEach((img) => {
            try { if (!(img as HTMLImageElement).complete) (img as HTMLImageElement).style.visibility = "hidden"; } catch {}
          });
        },
      });
      const name = `Educate_MW_Certificate_${(recipientName || "Student").trim().replace(/\\s+/g, "_")}.png`;
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (blob) await saveBlob(blob, name);
      else { const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = name; a.click(); }
    } catch (err) {
      console.error(err);
      try {
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        pdf.setFontSize(22); pdf.text("Educate MW — Certificate", 40, 60);
        pdf.setFontSize(16);
        pdf.text(`Recipient: ${recipientName || "Student"}`, 40, 120);
        pdf.text(`Date: ${certificateDate}`, 40, 150);
        pdf.text("P. Damiano — Managing Director", 40, 200);
        pdf.text("S. Lifa · E. Muthipo — Teachers & Academic Lead", 40, 230);
        await saveBlob(pdf.output("blob"), `Educate_MW_Certificate_${(recipientName || "Student").trim().replace(/\\s+/g, "_")}.pdf`);
        alert("Image capture failed on this device. A simple PDF certificate was saved instead.");
      } catch (e2) {
        alert("PNG download failed. Try PDF, or take a screenshot of the certificate.");
      }
    } finally { setDownloading(false); }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    if (!activeStatus.isUnlocked) {
      alert("Pay and wait for admin approval before downloading the official certificate.");
      return;
    }
    setDownloading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const canvas = await html2canvas(printRef.current, {
        scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: "#ffffff",
        logging: false, imageTimeout: 0,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      await saveBlob(pdf.output("blob"), `Educate_MW_Certificate_${(recipientName || "Student").trim().replace(/\\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error(err);
      try {
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        pdf.setFontSize(22); pdf.text("Educate MW — Official Certificate", 40, 60);
        pdf.setFontSize(16);
        pdf.text(`Recipient: ${recipientName || "Student"}`, 40, 120);
        pdf.text(`Date: ${certificateDate}`, 40, 150);
        pdf.text("P. Damiano — Managing Director", 40, 200);
        pdf.text("S. Lifa · E. Muthipo — Teachers & Academic Lead", 40, 230);
        await saveBlob(pdf.output("blob"), `Educate_MW_Certificate_${(recipientName || "Student").trim().replace(/\\s+/g, "_")}.pdf`);
        alert("Full design capture failed. A simple PDF was saved instead.");
      } catch (e2) {
        alert("PDF download failed. Please take a screenshot of the certificate.");
      }
    } finally { setDownloading(false); }
  };

'''
            t = t[:start] + new_dl + t[end:]
            print("certs: robust download + jsPDF fallback")
    if t != orig:
        p.write_text(t, encoding="utf-8")

def fix_index_splash_bg() -> None:
    p = ROOT / "index.html"
    if not p.exists():
        return
    t = p.read_text(encoding="utf-8")
    if "background:#1e3a8a" in t or "background: #1e3a8a" in t:
        print("index: blue bg already")
        return
    t = t.replace(
        '<body class="bg-slate-50 dark:bg-gray-950" style="touch-action: manipulation; -ms-touch-action: manipulation;">',
        '<body class="bg-slate-50 dark:bg-gray-950" style="background:#1e3a8a; touch-action: manipulation; -ms-touch-action: manipulation;">',
    )
    t = t.replace(
        """      #root {
        height: 100%;
        width: 100%;
        overflow: hidden;
        position: fixed;
        inset: 0;
      }""",
        """      #root {
        height: 100%;
        width: 100%;
        overflow: hidden;
        position: fixed;
        inset: 0;
        background: #1e3a8a;
      }
      body { background: #1e3a8a !important; }""",
    )
    p.write_text(t, encoding="utf-8")
    print("index: blue loading background")

def main() -> None:
    fix_library_download()
    fix_emi_voices_and_reconnect()
    fix_gemini_live_identity()
    fix_certificates_download()
    fix_index_splash_bg()
    print("batch done")

if __name__ == "__main__":
    main()
