#!/bin/bash
set -e
ICON=public/app-icon.png
if [ ! -f "$ICON" ]; then echo "no app-icon.png"; exit 0; fi
if ! command -v convert >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq imagemagick || true
fi
if ! command -v convert >/dev/null 2>&1; then exit 0; fi
RES=android/app/src/main/res
mkdir -p "$RES/drawable" "$RES/drawable-land" "$RES/values"
# Full-bleed blue splash with centered icon
convert -size 1080x1920 "xc:#1e3a8a" \
  \( "$ICON" -resize 420x420 \) -gravity center -composite \
  "$RES/drawable/splash.png"
convert -size 1920x1080 "xc:#1e3a8a" \
  \( "$ICON" -resize 360x360 \) -gravity center -composite \
  "$RES/drawable-land/splash.png"
# Also write styles for splash theme if missing
if [ ! -f "$RES/values/styles.xml" ]; then
  cat > "$RES/values/styles.xml" << 'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#1e3a8a</item>
        <item name="colorPrimaryDark">#1e3a8a</item>
        <item name="colorAccent">#3b82f6</item>
        <item name="android:statusBarColor">#1e3a8a</item>
    </style>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">#1e3a8a</item>
        <item name="android:statusBarColor">#1e3a8a</item>
    </style>
</resources>
XML
fi
echo "Splash generated from app-icon.png"
