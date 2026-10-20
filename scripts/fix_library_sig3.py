#!/usr/bin/env python3
from pathlib import Path

lines = Path("src/App.tsx").read_text().splitlines(keepends=True)
out = []
i = 0
fixed = False
while i < len(lines):
    line = lines[i]
    if (
        not fixed
        and line.startswith("function LibraryView({")
        and i + 1 < len(lines)
        and "const [pdfViewer" in lines[i + 1]
    ):
        # Rebuild the whole function header
        # Skip broken lines until we see ") {" that closes the type annotation
        j = i + 1
        while j < len(lines) and not (
            lines[j].strip() == ") {" or lines[j].rstrip().endswith(") {")
        ):
            j += 1
        if j >= len(lines):
            raise SystemExit("could not find end of LibraryView header")
        # j is the line with `}) {`
        out.append("function LibraryView({\n")
        out.append("  onBack,\n")
        out.append("  theme,\n")
        out.append("  onSelectItem,\n")
        out.append("  onSelectLocalFile,\n")
        out.append('  initialSearch = "",\n')
        out.append("}: {\n")
        out.append("  onBack: () => void;\n")
        out.append('  theme: "light" | "dark";\n')
        out.append("  onSelectItem: (slug: string) => void;\n")
        out.append("  onSelectLocalFile: (url: string, name: string) => void;\n")
        out.append("  initialSearch?: string;\n")
        out.append("}) {\n")
        out.append(
            "  const [pdfViewer, setPdfViewer] = useState<{ url: string; title: string } | null>(null);\n"
        )
        i = j + 1  # continue after original `}) {`
        fixed = True
        print("rebuilt header, skipped to", i)
        continue
    out.append(line)
    i += 1

if not fixed:
    raise SystemExit("LibraryView broken header not found")

Path("src/App.tsx").write_text("".join(out))
# verify
text = Path("src/App.tsx").read_text()
assert "function LibraryView({\n  const [pdfViewer" not in text
assert "const [pdfViewer, setPdfViewer]" in text
print("OK")
