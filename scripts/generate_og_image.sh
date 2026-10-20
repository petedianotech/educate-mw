#!/bin/bash
set -e
ICON=public/app-icon.png
OUT=public/og-image.png
if [ ! -f "$ICON" ]; then ICON=public/logo.png; fi
if [ ! -f "$ICON" ]; then echo no icon; exit 0; fi
if ! command -v convert >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq imagemagick
fi
convert -size 1200x630 "xc:#1e3a8a" \
  \( "$ICON" -resize 280x280 \) -gravity center -geometry +0-40 -composite \
  -gravity south -fill white -pointsize 48 -annotate +0+80 "Educate MW" \
  -fill "#93c5fd" -pointsize 26 -annotate +0+36 "MSCE notes · Emi AI · Malawi" \
  "$OUT"
echo "Wrote $OUT ($(wc -c < "$OUT") bytes)"
