#!/usr/bin/env python3
from pathlib import Path

t = Path("src/App.tsx").read_text()

old = '''function LibraryView({
  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);
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
  const [filter, setFilter] = useState<"all" | "offline">("all");
'''

new = '''function LibraryView({
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
  const [filter, setFilter] = useState<"all" | "offline">("all");
'''

if old not in t:
    print("pattern missing")
    i = t.find("function LibraryView")
    print(repr(t[i:i+350]))
    raise SystemExit(1)

t = t.replace(old, new, 1)
Path("src/App.tsx").write_text(t)
print("FIXED signature")
# ensure no state left in params
assert "function LibraryView({\n  const [pdfViewer" not in t
print("ok")
