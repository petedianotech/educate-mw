#!/usr/bin/env python3
"""Certificate signatories: Damiano MD; Lifa & Muthipo same teacher role."""
from pathlib import Path
import re

p = Path("src/components/CertificatesCleanView.tsx")
if not p.exists():
    print("skip certs")
    raise SystemExit(0)

t = p.read_text(encoding="utf-8")
orig = t

# Normalize names first
t = t.replace("S. Liffa", "P. Damiano")

# Role lines under each name (order-independent simple replacements)
replacements = [
    ("Teacher & Mentor", "Managing Director"),  # was under Damiano/Liffa slot
    ("Director of Academic Affairs", "Teacher & Academic Lead"),
    ("Teacher & Registrar", "Teacher & Academic Lead"),
]
for a, b in replacements:
    if a in t:
        t = t.replace(a, b)
        print(f"{a} -> {b}")

# If Damiano block still says Teacher & Academic Lead as first role only, force Managing Director under Damiano
# Pattern: after P. Damiano label, next role line
t = re.sub(
    r"(P\. Damiano\s*</div>\s*<div className=\"text-\[5\.5px\][^\"]*\"[^>]*>\s*)Teacher & Academic Lead",
    r"\1Managing Director",
    t,
    count=1,
)

if "P. Damiano" not in t and "S. Liffa" not in t:
    print("WARN: expected names not found")
else:
    print("Damiano present:", "P. Damiano" in t)
    print("Muthipo/Lifa role Teacher & Academic Lead count:", t.count("Teacher & Academic Lead"))
    print("Managing Director count:", t.count("Managing Director"))

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
    print("no cert changes needed")
