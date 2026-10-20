#!/usr/bin/env python3
from pathlib import Path
import re

def main():
    gl = Path("src/services/geminiLive.ts")
    g = gl.read_text()
    if 'languageCode: "en-US"' not in g:
        g = g.replace(
            "speechConfig: {\n                voiceConfig: {",
            'speechConfig: {\n                languageCode: "en-US",\n                voiceConfig: {',
            1,
        )
        print("languageCode")
    old_line = "- Simple English; respond in Chichewa when the student uses Chichewa."
    new_line = "- Prefer clear English (en-US) for speech recognition and replies. Only use Chichewa if the student clearly speaks or asks in Chichewa."
    if old_line in g:
        g = g.replace(old_line, new_line, 1)
        print("prompt")
    gl.write_text(g)

    app = Path("src/App.tsx")
    t = app.read_text()

    # import
    if 'from "./components/PdfViewerModal"' not in t:
        if 'from "./components/MscePointsCalculatorView"' in t:
            t = t.replace(
                'from "./components/MscePointsCalculatorView";',
                'from "./components/MscePointsCalculatorView";\nimport { PdfViewerModal } from "./components/PdfViewerModal";',
                1,
            )
            print("import")

    # Pro: replace ALL amber with blue inside SubscriptionView only
    s = t.find("function SubscriptionView")
    e = t.find("\nfunction ", s + 20)
    assert s > 0 and e > s
    pro = t[s:e]
    pro2 = pro
    pro2 = pro2.replace("amber-", "blue-")
    # step numbers red -> blue (except leave phone number text emphasis)
    pro2 = pro2.replace("bg-red-500 text-white", "bg-blue-600 text-white")
    pro2 = pro2.replace("bg-red-500/15", "bg-blue-500/10")
    pro2 = pro2.replace("border-red-500/30", "border-blue-500/25")
    pro2 = pro2.replace("text-xs font-black text-red-500", "text-xs font-bold text-blue-600")
    # WhatsApp CTA can stay green for brand recognition OR use blue - user asked app colors -> blue
    pro2 = pro2.replace("bg-emerald-600 hover:bg-emerald-700", "bg-blue-600 hover:bg-blue-700")
    pro2 = pro2.replace("bg-emerald-500/15 text-emerald-500", "bg-blue-500/10 text-blue-600")
    pro2 = pro2.replace("border-emerald-500/30", "border-blue-500/25")
    # soften shouting type
    pro2 = pro2.replace("font-black uppercase", "font-bold")
    t = t[:s] + pro2 + t[e:]
    print("pro amber left", pro2.count("amber"))

    # pdfViewer state after LibraryView {
    if "const [pdfViewer, setPdfViewer]" not in t:
        needle = "function LibraryView("
        i = t.find(needle)
        # find "}) {\n  const [filter"
        j = t.find("const [filter, setFilter]", i)
        if j > 0:
            t = t[:j] + "const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);\n  " + t[j:]
            print("state")

    # Replace pdf open block
    old_pdf = '''    if (item.type === "pdf" && item.content) {
      try {
        if (isNativeApp()) {
          await openPdf(item.content, item.title);
        } else {
          await triggerExplicitDownload(item.content, item.title);
        }
      } catch (err) {
        console.error("PDF open/download failed:", err);
      }
    }'''
    new_pdf = '''    if (item.type === "pdf" && item.content) {
      try {
        setPdfViewer({ url: item.content, title: item.title || "PDF" });
      } catch (err) {
        console.error("PDF open failed:", err);
      }
    }'''
    if old_pdf in t:
        t = t.replace(old_pdf, new_pdf, 1)
        print("pdf open")
    else:
        print("pdf block not exact")

    # Modal inside LibraryView return - before function LibraryItem
    if "{pdfViewer &&" not in t:
        # Find LibraryView end: search for onSelectLocalFile usage area then LibraryItem
        li = t.find("\nfunction LibraryItem(")
        if li > 0:
            # Insert modal just before the closing of return - find last occurrence of pattern before LibraryItem
            # Typical:     </div>\n  );\n}\n\nfunction LibraryItem
            prefix = t[:li]
            # Insert before the final `}\n` of LibraryView - i.e. before li, walk back to `);`
            k = prefix.rfind(");")
            if k > 0:
                modal = '''
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
'''
                t = t[:k] + modal + t[k:]
                print("modal")

    # Live header polish
    t = t.replace(
        'text-[10px] font-black tracking-[0.2em] text-indigo-500 uppercase',
        'text-[10px] font-semibold tracking-wide text-blue-600',
    )

    app.write_text(t)
    print("ok", "PdfViewer" in t, "setPdfViewer" in t, 'languageCode' in Path("src/services/geminiLive.ts").read_text())

if __name__ == "__main__":
    main()
