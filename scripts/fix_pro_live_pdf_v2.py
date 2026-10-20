#!/usr/bin/env python3
from pathlib import Path
import re

def main():
    # ---- geminiLive ----
    gl = Path("src/services/geminiLive.ts")
    g = gl.read_text()
    if 'languageCode: "en-US"' not in g:
        g = g.replace(
            "speechConfig: {\n                voiceConfig: {",
            'speechConfig: {\n                languageCode: "en-US",\n                voiceConfig: {',
            1,
        )
        print("added languageCode")
    if "Prefer clear English" not in g:
        g = g.replace(
            "- Simple English; respond in Chichewa when the student uses Chichewa.",
            "- Prefer clear English (en-US) for speech recognition and replies. Only use Chichewa if the student clearly speaks or asks in Chichewa.",
            1,
        )
        print("english prompt")
    gl.write_text(g)

    # ---- App Pro theme ----
    app = Path("src/App.tsx")
    t = app.read_text()

    if "PdfViewerModal" not in t.split("import")[0] and 'from "./components/PdfViewerModal"' not in t:
        # add import near other component imports
        if 'from "./components/MscePointsCalculatorView"' in t:
            t = t.replace(
                'from "./components/MscePointsCalculatorView";',
                'from "./components/MscePointsCalculatorView";\nimport { PdfViewerModal } from "./components/PdfViewerModal";',
                1,
            )
            print("import modal")
        elif 'from "./native/pdfReader"' in t:
            t = t.replace(
                'from "./native/pdfReader";',
                'from "./native/pdfReader";\nimport { PdfViewerModal } from "./components/PdfViewerModal";',
                1,
            )

    s = t.find("function SubscriptionView")
    e = t.find("\nfunction ", s + 20)
    if s > 0 and e > s:
        pro = t[s:e]
        pro2 = pro
        reps = [
            ("border-amber-500/40", "border-blue-500/30"),
            ("border-amber-300", "border-blue-200"),
            ("shadow-amber-500/5", "shadow-blue-500/5"),
            ("text-amber-500", "text-blue-600"),
            ("bg-amber-100", "bg-blue-50"),
            ("bg-amber-50", "bg-blue-50"),
            ("text-amber-600", "text-blue-600"),
            ("border-amber-200", "border-blue-200"),
            ("bg-amber-500/15", "bg-blue-500/10"),
            ("bg-amber-500", "bg-blue-600"),
            ("bg-red-500 text-white text-xs font-black", "bg-blue-600 text-white text-xs font-bold"),
            ("bg-red-500/15 border border-red-500/30", "bg-blue-500/10 border border-blue-500/25"),
            ("text-xs font-black text-red-500", "text-xs font-bold text-blue-600"),
            ("font-black text-red-500", "font-bold text-blue-700"),
            ("text-red-500 font-black", "text-blue-700 font-bold"),
            ("text-sm font-black text-red-500", "text-sm font-bold text-blue-700"),
            ("bg-emerald-600 hover:bg-emerald-700", "bg-blue-600 hover:bg-blue-700"),
            ("bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
             "bg-blue-500/10 text-blue-600 border border-blue-500/25"),
            ("font-black uppercase tracking-tight", "font-bold tracking-tight"),
            ("text-[10px] font-bold uppercase tracking-widest", "text-[10px] font-semibold tracking-wide"),
        ]
        for a, b in reps:
            pro2 = pro2.replace(a, b)
        t = t[:s] + pro2 + t[e:]
        print("pro blue applied", pro.count("amber"), "->", pro2.count("amber"))

    # pdfViewer state in LibraryView
    if "const [pdfViewer, setPdfViewer]" not in t:
        idx = t.find("function LibraryView")
        if idx > 0:
            # first line after {
            m = re.search(r"function LibraryView\([^{]*\{\n", t)
            if m:
                pos = m.end()
                t = t[:pos] + "  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);\n" + t[pos:]
                print("pdfViewer state")

    # open in-app instead of only FileOpener on download of pdf
    if "setPdfViewer({ url: item.content" not in t:
        t = t.replace(
            """    if (item.type === "pdf" && item.content) {
      try {
        if (isNativeApp()) {
          await openPdf(item.content, item.title);
        } else {
          await triggerExplicitDownload(item.content, item.title);
        }
      } catch (err) {
        console.error("PDF open/download failed:", err);
      }
    }""",
            """    if (item.type === "pdf" && item.content) {
      try {
        // In-app reader (PWA + APK); user can still open externally from the modal
        setPdfViewer({ url: item.content, title: item.title || "PDF" });
      } catch (err) {
        console.error("PDF open failed:", err);
      }
    }""",
            1,
        )
        print("download opens modal")

    # Also when tapping item for pdf content - search openPdf(
    if 'openPdf(' in t and 'setPdfViewer' in t:
        # replace remaining openPdf for library materials if any simple pattern
        pass

    # Inject modal before function LibraryItem
    if "pdfViewer &&" not in t and "PdfViewerModal" in t:
        anchor = "\nfunction LibraryItem("
        if anchor in t:
            t = t.replace(
                anchor,
                """
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
"""
                + anchor,
                1,
            )
            print("modal jsx")
            # Wait - that injects outside return. Need inside return of LibraryView.
            # Revert botched placement: the modal must be inside LibraryView's return JSX.
            # Find LibraryView return and insert before closing of outermost div

    # Fix if modal was placed before LibraryItem outside return - check structure
    # Move: if modal appears between ); and function LibraryItem incorrectly...
    bad = """      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}

function LibraryItem("""
    if bad in t:
        t = t.replace(bad, "\nfunction LibraryItem(", 1)
        # Insert properly: before the closing of LibraryView - look for pattern near end
        # LibraryView typically ends with ); then }\n\nfunction LibraryItem
        # Find last ); before function LibraryItem that closes return
        li = t.find("function LibraryItem")
        # search backwards for \n  );\n}
        chunk = t[:li]
        # insert before final ); of LibraryView return - find "  );\n}" at end of LibraryView
        m = list(re.finditer(r"\n  \);\n\}", chunk))
        if m:
            pos = m[-1].start()
            modal = """
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}"""
            t = t[:pos] + modal + t[pos:]
            print("modal placed in return")

    app.write_text(t)
    print("done")

if __name__ == "__main__":
    main()
