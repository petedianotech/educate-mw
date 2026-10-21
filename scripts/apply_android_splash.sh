#!/bin/bash
# Splash from real app icon: deep blue, centered logo, three white loading dots
set +e
ICON=public/app-icon.png
if [ ! -f "$ICON" ]; then
  echo "no app-icon.png — skip splash"
  exit 0
fi
if ! command -v convert >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq imagemagick 2>/dev/null || true
fi
if ! command -v convert >/dev/null 2>&1; then
  echo "ImageMagick missing — skip splash"
  exit 0
fi
RES=android/app/src/main/res
mkdir -p "$RES/drawable" "$RES/drawable-land" "$RES/values"

convert -size 1080x1920 "xc:#1e3a8a" \
  \( "$ICON" -resize 400x400 \) -gravity center -geometry +0-60 -composite \
  -fill white -draw "circle 490,1680 505,1680" \
  -fill white -draw "circle 540,1680 555,1680" \
  -fill white -draw "circle 590,1680 605,1680" \
  "$RES/drawable/splash.png" || true

convert -size 1920x1080 "xc:#1e3a8a" \
  \( "$ICON" -resize 320x320 \) -gravity center -geometry +0-40 -composite \
  -fill white -draw "circle 910,960 922,960" \
  -fill white -draw "circle 960,960 972,960" \
  -fill white -draw "circle 1010,960 1022,960" \
  "$RES/drawable-land/splash.png" || true

# Also write public/splash.png for web reference
convert -size 1080x1920 "xc:#1e3a8a" \
  \( "$ICON" -resize 400x400 \) -gravity center -geometry +0-60 -composite \
  -fill white -draw "circle 490,1680 505,1680" \
  -fill white -draw "circle 540,1680 555,1680" \
  -fill white -draw "circle 590,1680 605,1680" \
  public/splash.png 2>/dev/null || true

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
        <item name="android:statusBarColor">#1e3a8a</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:statusBarColor">#1e3a8a</item>
    </style>
</resources>
XML

echo "Splash generated from real app-icon (centered + dots)"
exit 0
