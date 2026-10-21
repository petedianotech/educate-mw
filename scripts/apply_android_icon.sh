#!/bin/bash
set +e
ICON=""
for c in public/app-icon.png public/logo.png public/favicon.png; do
  if [ -f "$c" ]; then ICON="$c"; break; fi
done
if [ -z "$ICON" ]; then
  echo "No app icon found"; exit 0
fi
echo "Using icon: $ICON"
if ! command -v convert >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq imagemagick 2>/dev/null || true
fi
if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick missing"; exit 0
fi
RES=android/app/src/main/res
for dens in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  mkdir -p "$RES/mipmap-$dens"
done
convert "$ICON" -resize 48x48   "$RES/mipmap-mdpi/ic_launcher.png" || true
convert "$ICON" -resize 72x72   "$RES/mipmap-hdpi/ic_launcher.png" || true
convert "$ICON" -resize 96x96   "$RES/mipmap-xhdpi/ic_launcher.png" || true
convert "$ICON" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher.png" || true
convert "$ICON" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher.png" || true
convert "$ICON" -resize 48x48   "$RES/mipmap-mdpi/ic_launcher_round.png" || true
convert "$ICON" -resize 72x72   "$RES/mipmap-hdpi/ic_launcher_round.png" || true
convert "$ICON" -resize 96x96   "$RES/mipmap-xhdpi/ic_launcher_round.png" || true
convert "$ICON" -resize 144x144 "$RES/mipmap-xxhdpi/ic_launcher_round.png" || true
convert "$ICON" -resize 192x192 "$RES/mipmap-xxxhdpi/ic_launcher_round.png" || true
mkdir -p "$RES/mipmap-anydpi-v26" "$RES/drawable"
convert "$ICON" -resize 432x432 -background none -gravity center -extent 432x432 \
  "$RES/drawable/ic_launcher_foreground.png" || true
convert -size 108x108 "xc:#1e3a8a" "$RES/drawable/ic_launcher_background.png" || true
if [ -f "$RES/drawable/ic_launcher_foreground.png" ]; then
  cat > "$RES/mipmap-anydpi-v26/ic_launcher.xml" << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
XML
  cp "$RES/mipmap-anydpi-v26/ic_launcher.xml" "$RES/mipmap-anydpi-v26/ic_launcher_round.xml" 2>/dev/null || true
fi
echo "Icons applied"
exit 0
