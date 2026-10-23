#!/usr/bin/env python3
"""Certificate signatories: Damiano MD; Lifa & Muthipo same teacher role."""
from pathlib import Path

p = Path("src/components/CertificatesCleanView.tsx")
if not p.exists():
    print("skip certs")
    raise SystemExit(0)

t = p.read_text(encoding="utf-8")
orig = t

# Signature 1: P. Damiano — Managing Director (replace S. Liffa)
if "P. Damiano" not in t:
    t = t.replace("S. Liffa", "P. Damiano")
    t = t.replace("Teacher & Mentor", "Managing Director", 1)
    print("Damiano set")
else:
    print("Damiano already present")

# S. Lifa role
for old in ("Director of Academic Affairs",):
    if old in t:
        t = t.replace(old, "Teacher & Academic Lead")
        print("Lifa role aligned")

# E. Muthipo same role as S. Lifa
if "Teacher & Registrar" in t:
    t = t.replace("Teacher & Registrar", "Teacher & Academic Lead")
    print("Muthipo role = Lifa (Teacher & Academic Lead)")

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
