#!/bin/bash
set -e
OUT=src/App.tsx
if ! ls scripts/emi_app_part*.b64 >/dev/null 2>&1; then
  echo "No emi_app parts; keeping existing App.tsx"
  exit 0
fi
rm -f "$OUT"
for f in scripts/emi_app_part*.b64; do
  base64 -d "$f" >> "$OUT"
done
wc -c "$OUT"
grep -q stopGeneration "$OUT"
grep -q showChatSidebar "$OUT"
echo "App.tsx restored from parts"
