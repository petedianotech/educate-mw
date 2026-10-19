#!/bin/bash
set -e
ICON=""
for c in public/app-icon.png public/logo.png public/favicon.png; do
  if [ -f "$c" ]; then ICON="$c"; break; fi
done
if [ -z "$ICON" ]; then
  echo "No app icon found in public/"; exit 0
fi
echo "Using icon: $ICON"
if ! command -v convert >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq imagemagick || true
fi
if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick missing"; exit 0
fi
RES=android/app/src/main/res
mkdir -p "$RES/mipmap-mdpi" "$RES/mipmap-hdpi" "$RES/mipmap-xhdpi" "$RES/mipmap-xxhdpi" "$RES/mipmap-xxxhdpi"
convert "$ICON" -resize 48x48 "$RES/mipmap-mdpi/ic_launcher.png"
convert "$ICON" -resize 72x72 "$RES/mipmap-hdpi/ic_launcher.png"
convert "$ICON" -resize 96x96 "$RES/mipmap-xhdpi/ic_launcher.png"
convert "$ICON" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher.png"
convert "$ICON" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher.png"
convert "$ICON" -resize 48x48 "$RES/mipmap-mdpi/ic_launcher_round.png"
convert "$ICON" -resize 72x72 "$RES/mipmap-hdpi/ic_launcher_round.png"
convert "$ICON" -resize 96x96 "$RES/mipmap-xhdpi/ic_launcher_round.png"
convert "$ICON" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher_round.png"
convert "$ICON" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher_round.png"
echo "Icons applied"
