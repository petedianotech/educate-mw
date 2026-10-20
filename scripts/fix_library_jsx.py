#!/usr/bin/env python3
from pathlib import Path

t = Path("src/App.tsx").read_text()

# Broken pattern: modal after closing root div, before ); of return
old = '''      </main>
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
}'''

new = '''      </main>
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
}'''

if old in t:
    t = t.replace(old, new, 1)
    print("fixed pattern A")
elif "{pdfViewer &&" in t:
    # more flexible
    old2 = '''    </div>
  
      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
);
}

function LibraryItem'''
    new2 = '''      {pdfViewer && (
        <PdfViewerModal
          url={pdfViewer.url}
          title={pdfViewer.title}
          theme={theme}
          onClose={() => setPdfViewer(null)}
        />
      )}
    </div>
  );
}

function LibraryItem'''
    if old2 in t:
        t = t.replace(old2, new2, 1)
        print("fixed pattern B")
    else:
        print("patterns not found, dumping context")
        i = t.find("{pdfViewer &&")
        print(repr(t[i-80:i+200]))
        raise SystemExit(1)
else:
    print("no pdfViewer modal")

Path("src/App.tsx").write_text(t)
print("ok")
