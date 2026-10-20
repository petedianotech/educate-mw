#!/usr/bin/env python3
from pathlib import Path

t = Path("src/App.tsx").read_text()

old = """</main>
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

new = """</main>
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

if old not in t:
    print("OLD NOT FOUND")
    i = t.find("{pdfViewer &&")
    print(repr(t[i-60:i+200]))
    raise SystemExit(1)

t = t.replace(old, new, 1)
Path("src/App.tsx").write_text(t)
print("FIXED")
# verify
t2 = Path("src/App.tsx").read_text()
i = t2.find("{pdfViewer &&")
print(repr(t2[i-40:i+50]))
assert "</main>" in t2[i-80:i] or t2[i-20:i].count("</") == 0
# modal should appear before closing div of return
assert t2.find("{pdfViewer &&") < t2.find("function LibraryItem")
print("verified")
