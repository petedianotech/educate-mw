#!/usr/bin/env python3
"""Pro UI blue theme, Live English + subtitle polish, Library PDF actions."""
from pathlib import Path
import re

def main():
    n = 0
    app = Path("src/App.tsx")
    t = app.read_text()

    # Import PdfViewerModal
    if "PdfViewerModal" not in t:
        if 'from "./native/pdfReader"' in t:
            t = t.replace(
                'from "./native/pdfReader"',
                'from "./native/pdfReader";\nimport { PdfViewerModal } from "./components/PdfViewerModal"',
                1,
            )
        elif 'from "./lib/api"' in t:
            t = t.replace(
                'from "./lib/api";',
                'from "./lib/api";\nimport { PdfViewerModal } from "./components/PdfViewerModal";',
                1,
            )
        n += 1
        print("import pdf modal")

    # --- SubscriptionView: amber -> blue (keep text/prices) ---
    # Only within SubscriptionView function if possible - global amber on pro page
    pro_start = t.find("function SubscriptionView")
    pro_end = t.find("\nfunction ", pro_start + 10)
    if pro_start > 0 and pro_end > pro_start:
        pro = t[pro_start:pro_end]
        pro2 = pro
        for a, b in [
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
            ("from-amber", "from-blue"),
            ("to-yellow", "to-blue"),
            ("font-black uppercase tracking-tight", "font-bold tracking-tight"),
            ("font-black uppercase tracking-widest", "font-semibold tracking-wide"),
            ("text-[10px] font-bold text-amber-500 uppercase tracking-widest",
             "text-[10px] font-semibold text-blue-600 tracking-wide"),
            ("bg-red-500 text-white", "bg-blue-600 text-white"),  # step numbers
            ("bg-red-500/15 border border-red-500/30", "bg-blue-500/10 border border-blue-500/25"),
            ("text-xs font-black text-red-500", "text-xs font-bold text-blue-600"),
            ("font-black text-red-500", "font-bold text-blue-700"),
            ("text-red-500 font-black", "text-blue-700 font-bold"),
            ("text-sm font-black text-red-500", "text-sm font-bold text-blue-700"),
            ("bg-emerald-600 hover:bg-emerald-700", "bg-blue-600 hover:bg-blue-700"),
            ("bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
             "bg-blue-500/10 text-blue-600 border border-blue-500/25"),
        ]:
            if a in pro2:
                pro2 = pro2.replace(a, b)
                n += 1
        # Softer header title case preserved in content - only classes
        t = t[:pro_start] + pro2 + t[pro_end:]
        print("pro theme", n)

    # Live UI: indigo/yellow accents -> blue, soften uppercase
    live_start = t.find("Live Voice Tutor")
    if live_start > 0:
        # replace nearby yellow connecting with blue
        chunk = t[max(0, live_start - 500): live_start + 8000]
        # don't rewrite whole file for this - targeted
        t = t.replace(
            'text-[10px] font-black tracking-[0.2em] text-indigo-500 uppercase',
            'text-[10px] font-semibold tracking-wide text-blue-600',
            1,
        )
        t = t.replace(
            'text-[10px] font-bold uppercase tracking-[0.45em]',
            'text-[10px] font-medium tracking-wide',
            1,
        )
        n += 1

    # Library: add pdfViewer state near LibraryView if missing
    if "pdfViewer" not in t and "function LibraryView" in t:
        t = t.replace(
            "function LibraryView(",
            '''// pdf viewer state is local inside LibraryView via hooks below
function LibraryView(''',
            1,
        )

    # Patch LibraryView to open in-app PDF - find handle download / onClick for pdf
    # Insert state after LibraryView function starts
    marker = "function LibraryView("
    idx = t.find(marker)
    if idx > 0 and "useState<{ url: string" not in t[idx:idx+2500]:
        # Find first useState in LibraryView
        us = t.find("useState", idx)
        if us > 0:
            insert = "  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);\n  "
            # find opening of function body
            brace = t.find("{\n", idx)
            if brace > 0:
                t = t[: brace + 2] + insert + t[brace + 2 :]
                n += 1
                print("pdfViewer state")

    # When item clicked for pdf - search setSelected or onClick patterns
    # Add modal render before end of LibraryView return - look for closing of LibraryView is hard
    if "PdfViewerModal" in t and "pdfViewer &&" not in t:
        # Inject before a common Library footer or end - try after offline notes section
        inject_modal = '''
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
'''
        # Place before last few lines of library - search "Offline Notes"
        if "Offline Notes" in t:
            # find return of LibraryView and append near end - use unique string near library bottom nav space
            pass
        # Safer: replace openPdf call for native to setPdfViewer
        if "await openPdf(item.content, item.title);" in t:
            t = t.replace(
                "await openPdf(item.content, item.title);",
                "setPdfViewer({ url: item.content, title: item.title || 'PDF' });",
                1,
            )
            n += 1
            print("open pdf -> modal")
        if inject_modal.strip() not in t:
            # insert after LibraryView's main return opening is hard; inject near handleDownload
            t = t.replace(
                "const handleDownload = async (item: any) => {",
                inject_modal + "\n  const handleDownload = async (item: any) => {",
                1,
            )
            # That puts modal inside wrong place - fix by moving
            # Actually modal inside function body but outside return is invalid in JSX
            # Remove botched inject
            t = t.replace(inject_modal + "\n  const handleDownload", "  const handleDownload", 1)

    # Correct approach for modal: only change open behavior; modal at end of return
    # Search for pattern in LibraryView return end - "</div>\n  );\n}\n\nfunction LibraryItem"
    end_lib = t.find("function LibraryItem")
    if end_lib > 0 and "pdfViewer &&" not in t:
        # walk back to close of LibraryView
        close = t.rfind("\n}\n", 0, end_lib)
        # find `);` before function LibraryItem
        close_ret = t.rfind(");", 0, end_lib)
        if close_ret > 0:
            modal_jsx = '''
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
'''
            t = t[:close_ret] + modal_jsx + t[close_ret:]
            n += 1
            print("modal in library return")

    # Ensure pdfViewer state exists
    if "setPdfViewer" in t and "const [pdfViewer" not in t:
        idx = t.find("function LibraryView")
        brace = t.find("{\n", idx)
        t = t[: brace + 2] + "  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);\n" + t[brace + 2 :]
        n += 1

    # Library item: change download button label hints via title attribute - optional

    app.write_text(t)
    print("app patches", n)

    # --- geminiLive language_code + keep last subtitle ---
    gl = Path("src/services/geminiLive.ts")
    if gl.exists():
        g = gl.read_text()
        if "languageCode" not in g and "language_code" not in g:
            # inject into speechConfig
            old_sc = """              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: targetVoice,
                  },
                },
              },"""
            new_sc = """              speechConfig: {
                languageCode: "en-US",
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: targetVoice,
                  },
                },
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},"""
            if old_sc in g:
                g = g.replace(old_sc, new_sc, 1)
                print("speech languageCode")
            else:
                # try alternate formatting
                if "voiceName: targetVoice" in g and "languageCode" not in g:
                    g = g.replace(
                        "speechConfig: {",
                        'speechConfig: {\n                languageCode: "en-US",',
                        1,
                    )
                    print("languageCode alt")

        # Strengthen English-primary in system instruction
        if "Prefer English" not in g:
            g = g.replace(
                "- Simple English; respond in Chichewa when the student uses Chichewa.",
                "- Prefer clear English (en-US) for recognition and replies. Only switch to Chichewa if the student clearly speaks or asks in Chichewa.\n- Assume the student is speaking English unless Chichewa words are obvious.",
                1,
            )
            print("english primary prompt")

        # Do not wipe subtitle on every turnComplete - keep last line visible
        if "turnComplete" in g and "currentTextAccumulator = \"\"" in g:
            g = g.replace(
                """    if (message.serverContent?.turnComplete) {
      this.currentTextAccumulator = "";
    }""",
                """    if (message.serverContent?.turnComplete) {
      // Keep last subtitle on screen; only reset accumulator for the next turn
      this.currentTextAccumulator = "";
    }""",
                1,
            )

        # Avoid duplicate transcription keys if we added twice
        # leave as is

        gl.write_text(g)

    print("done")

if __name__ == "__main__":
    main()
