#!/usr/bin/env python3
from pathlib import Path
import re

t = Path("src/App.tsx").read_text()

# Match broken LibraryView header regardless of whitespace
pat = re.compile(
    r"function LibraryView\(\{\s*"
    r"const \[pdfViewer, setPdfViewer\] = useState<\{ url: string; title: string \} \| null>\(null\);\s*"
    r"onBack,\s*"
    r"theme,\s*"
    r"onSelectItem,\s*"
    r"onSelectLocalFile,\s*"
    r"initialSearch = \"\"\s*,?\s*"
    r"\}: \{\s*"
    r"onBack: \(\) => void;\s*"
    r"theme: \"light\" \| \"dark\";\s*"
    r"onSelectItem: \(slug: string\) => void;\s*"
    r"onSelectLocalFile: \(url: string, name: string\) => void;\s*"
    r"initialSearch\?: string;\s*"
    r"\}\) \{\s*"
    r"const \[filter, setFilter\]",
    re.M,
)

repl = '''function LibraryView({
  onBack,
  theme,
  onSelectItem,
  onSelectLocalFile,
  initialSearch = "",
}: {
  onBack: () => void;
  theme: "light" | "dark";
  onSelectItem: (slug: string) => void;
  onSelectLocalFile: (url: string, name: string) => void;
  initialSearch?: string;
}) {
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);
  const [filter, setFilter]'''

m = pat.search(t)
if not m:
    print("regex failed")
    i = t.find("function LibraryView")
    print(repr(t[i:i+400]))
    raise SystemExit(1)

t = pat.sub(repl, t, count=1)
Path("src/App.tsx").write_text(t)
print("fixed")
assert "function LibraryView({\n  const [pdfViewer" not in t
print("verified")
