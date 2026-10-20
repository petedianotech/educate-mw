#!/bin/bash
set -e
# Keep only: app-icon.png, favicon.png, favicon.svg, og-image.png, robots.txt, sitemap.xml, manifest if any
cd public 2>/dev/null || exit 0
# Generate og-image from app-icon
if [ -f app-icon.png ]; then
  if ! command -v convert >/dev/null 2>&1; then
    sudo apt-get update -qq && sudo apt-get install -y -qq imagemagick
  fi
  convert -size 1200x630 "xc:#1e3a8a" \
    \( app-icon.png -resize 300x300 \) -gravity center -geometry +0-50 -composite \
    -gravity south -fill white -pointsize 52 -annotate +0+90 "Educate MW" \
    -fill "#93c5fd" -pointsize 28 -annotate +0+40 "MSCE notes · Emi AI · Malawi" \
    og-image.png
  echo "og-image.png generated"
fi
# Remove duplicate / unused marketing images
for f in app-icon.jpg app_icon_emi.png educate_malawi_og.png logo.png og-image.jpg; do
  if [ -f "$f" ]; then
    rm -f "$f"
    echo "removed $f"
  fi
done
ls -la
