#!/usr/bin/env python3
from pathlib import Path
import re

t = Path("src/App.tsx").read_text()

# Any variant of broken structure: closing div then modal then );
pat = re.compile(
    r"</main>\s*</div>\s*\{pdfViewer && \([\s\S]*?\)\}\s*\);\s*\}",
    re.M,
)
m = pat.search(t)
if m:
    modal_body = re.search(r"\{pdfViewer && \([\s\S]*?\)\}", m.group(0))
    modal = modal_body.group(0) if modal_body else ""
    replacement = f"""</main>
      {modal}
    </div>
  );
}}"""
    t = t[: m.start()] + replacement + t[m.end() :]
    Path("src/App.tsx").write_text(t)
    print("fixed with regex")
else:
    # simpler line-based
    if "{pdfViewer &&" not in t:
        print("no modal")
        raise SystemExit(0)
    # Find and rebuild
    broken = """      </main>
    </div>
  
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
);
}"""
    fixed = """      </main>
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
    </div>
  );
}"""
    if broken in t:
        t = t.replace(broken, fixed, 1)
        Path("src/App.tsx").write_text(t)
        print("fixed exact")
    else:
        # last resort: remove modal and reinsert properly
        t2 = re.sub(
            r"\s*\{pdfViewer && \(\s*<PdfViewerModal[\s\S]*?/>\s*\)\}",
            "",
            t,
            count=1,
        )
        # insert before last </div> prior to function LibraryItem
        li = t2.find("\nfunction LibraryItem")
        if li < 0:
            print("no LibraryItem")
            raise SystemExit(1)
        # find </main> before LibraryItem
        main_close = t2.rfind("</main>", 0, li)
        if main_close < 0:
            print("no main")
            raise SystemExit(1)
        insert_at = main_close + len("</main>")
        modal = """
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}"""
        t2 = t2[:insert_at] + modal + t2[insert_at:]
        Path("src/App.tsx").write_text(t2)
        print("fixed last resort")

# verify
t = Path("src/App.tsx").read_text()
i = t.find("{pdfViewer &&")
snippet = t[i - 40 : i + 80]
print("snippet:", repr(snippet))
if "</div>" in t[i - 30 : i] and "</main>" not in t[i - 80 : i]:
    # modal still after a closing div without main - check structure
    print("WARN may still be wrong")
else:
    print("structure looks better")
