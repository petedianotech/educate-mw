#!/usr/bin/env python3
"""Certificate signatories (Damiano MD) + reliable paid download gates."""
from pathlib import Path

p = Path("src/components/CertificatesCleanView.tsx")
if not p.exists():
    print("skip certs")
    raise SystemExit(0)

t = p.read_text(encoding="utf-8")
orig = t

old1 = """                    <div className=\"text-[11px] font-bold font-serif italic text-indigo-900 leading-none mb-1.5 h-4 flex items-end\">
                      {activeStatus.isUnlocked ? 'S. Liffa' : '••••••••••••'}
                    </div>
                    <div className=\"text-[7px] font-black uppercase tracking-widest text-indigo-950/60 leading-none\">
                      S. Liffa
                    </div>
                    <div className=\"text-[5.5px] font-bold uppercase tracking-widest text-indigo-950/40 mt-1\">
                      Teacher & Mentor
                    </div>"""

new1 = """                    <div className=\"text-[11px] font-bold font-serif italic text-indigo-900 leading-none mb-1.5 h-4 flex items-end\">
                      {activeStatus.isUnlocked ? 'P. Damiano' : '••••••••••••'}
                    </div>
                    <div className=\"text-[7px] font-black uppercase tracking-widest text-indigo-950/60 leading-none\">
                      P. Damiano
                    </div>
                    <div className=\"text-[5.5px] font-bold uppercase tracking-widest text-indigo-950/40 mt-1\">
                      Managing Director
                    </div>"""

if old1 in t:
    t = t.replace(old1, new1, 1)
    print("Damiano MD set")
elif "P. Damiano" in t:
    print("Damiano already present")
else:
    t = t.replace("S. Liffa", "P. Damiano")
    t = t.replace("Teacher & Mentor", "Managing Director", 1)
    print("Damiano via loose replace")

if "Director of Academic Affairs" in t:
    t = t.replace("Director of Academic Affairs", "Teacher & Academic Lead", 1)
    print("Lifa role -> teacher")

if "Pay and wait for admin approval" not in t:
    t = t.replace(
        "const handleDownloadPNG = async () => {\n    if (!printRef.current) return;\n    setDownloading(true);",
        "const handleDownloadPNG = async () => {\n    if (!printRef.current) return;\n    if (!activeStatus.isUnlocked) {\n      alert(\"Pay and wait for admin approval before downloading the official certificate.\");\n      return;\n    }\n    setDownloading(true);",
        1,
    )
    t = t.replace(
        "const handleDownloadPDF = async () => {\n    if (!printRef.current) return;\n    setDownloading(true);",
        "const handleDownloadPDF = async () => {\n    if (!printRef.current) return;\n    if (!activeStatus.isUnlocked) {\n      alert(\"Pay and wait for admin approval before downloading the official certificate.\");\n      return;\n    }\n    setDownloading(true);",
        1,
    )
    print("unlock gates added")

t = t.replace("allowTaint: false", "allowTaint: true")

if t != orig:
    p.write_text(t, encoding="utf-8")
    print("wrote", p)
else:
    print("no cert changes")
