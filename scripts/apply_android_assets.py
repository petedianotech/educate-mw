#!/usr/bin/env python3
"""
Build Android launcher + splash ONLY from public/app-icon.png.

Critical: Capacitor's default template ships adaptive-icon VECTORS with the
Android robot. Those win over PNG if left in place. We delete every default
vector and anydpi adaptive XML, then write full composite PNG icons so the
launcher always shows the real Educate MW logo.
"""
from __future__ import annotations

import os
import re
import shutil
import sys

from PIL import Image, ImageDraw


BLUE = (30, 58, 138, 255)


def load_logo() -> Image.Image:
    for candidate in (
        "public/app-icon.png",
        "public/logo.png",
        "public/favicon.png",
    ):
        if os.path.exists(candidate) and os.path.getsize(candidate) > 100:
            img = Image.open(candidate).convert("RGBA")
            print("Using logo:", candidate, img.size, "bytes=", os.path.getsize(candidate))
            try:
                img.save(candidate, format="PNG")
            except OSError:
                pass
            return img
    print("Error: public/app-icon.png not found", file=sys.stderr)
    sys.exit(1)


def composite_icon(logo: Image.Image, size: int) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BLUE)
    side = max(1, int(size * 0.78))
    logo_r = logo.resize((side, side), Image.Resampling.LANCZOS)
    x = (size - side) // 2
    y = (size - side) // 2
    canvas.paste(logo_r, (x, y), logo_r)
    return canvas


def wipe_default_robot(res_dir: str) -> None:
    anydpi = os.path.join(res_dir, "mipmap-anydpi-v26")
    if os.path.isdir(anydpi):
        shutil.rmtree(anydpi)
        print("Removed", anydpi)

    for root, _dirs, files in os.walk(res_dir):
        for name in files:
            path = os.path.join(root, name)
            if name in ("ic_launcher_foreground.xml", "ic_launcher_background.xml"):
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        body = f.read()
                    if "vector" in body or "path" in body:
                        os.remove(path)
                        print("Deleted robot vector:", path)
                except OSError:
                    pass

    for root, _dirs, files in os.walk(res_dir):
        for name in files:
            if name.startswith("ic_launcher") and name.endswith(".webp"):
                try:
                    os.remove(os.path.join(root, name))
                except OSError:
                    pass


def write_mipmaps(res_dir: str, logo: Image.Image) -> None:
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        d = os.path.join(res_dir, folder)
        os.makedirs(d, exist_ok=True)
        icon = composite_icon(logo, size)
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            out = os.path.join(d, name)
            icon.save(out, format="PNG")
            with open(out, "rb") as f:
                assert f.read(4) == b"\x89PNG", out
        print("Wrote", folder, size)


def write_splash(res_dir: str, logo: Image.Image) -> None:
    drawable = os.path.join(res_dir, "drawable")
    os.makedirs(drawable, exist_ok=True)

    def make(w: int, h: int, icon_size: int, dot_y: int, dots: list) -> Image.Image:
        splash = Image.new("RGBA", (w, h), BLUE)
        tile = composite_icon(logo, icon_size)
        y = max(0, (h - icon_size) // 2 - max(40, h // 32))
        splash.paste(tile, ((w - icon_size) // 2, y), tile)
        draw = ImageDraw.Draw(splash)
        r = max(6, w // 120)
        for dx in dots:
            draw.ellipse([dx - r, dot_y - r, dx + r, dot_y + r], fill=(255, 255, 255, 255))
        return splash.convert("RGB")

    portrait = make(1080, 1920, 420, 1680, [490, 540, 590])
    path = os.path.join(drawable, "splash.png")
    portrait.save(path, format="PNG")
    with open(path, "rb") as f:
        assert f.read(4) == b"\x89PNG"
    print("Wrote splash.png", os.path.getsize(path))

    for alt in ("splashscreen.png", "splash_icon.png"):
        portrait.save(os.path.join(drawable, alt), format="PNG")

    land = os.path.join(res_dir, "drawable-land")
    os.makedirs(land, exist_ok=True)
    make(1920, 1080, 320, 960, [910, 960, 1010]).save(
        os.path.join(land, "splash.png"), format="PNG"
    )
    for dens, size in (("hdpi", (480, 800)), ("xhdpi", (720, 1280)), ("xxhdpi", (1080, 1920))):
        d = os.path.join(res_dir, "drawable-" + dens)
        os.makedirs(d, exist_ok=True)
        make(
            size[0],
            size[1],
            int(size[0] * 0.38),
            int(size[1] * 0.88),
            [size[0] // 2 - 40, size[0] // 2, size[0] // 2 + 40],
        ).save(os.path.join(d, "splash.png"), format="PNG")


def write_styles(res_dir: str) -> None:
    values = os.path.join(res_dir, "values")
    os.makedirs(values, exist_ok=True)
    styles = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">#1e3a8a</item>
        <item name="colorPrimaryDark">#1e3a8a</item>
        <item name="colorAccent">#3b82f6</item>
        <item name="android:statusBarColor">#1e3a8a</item>
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:statusBarColor">#1e3a8a</item>
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:statusBarColor">#1e3a8a</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    </style>
</resources>
"""
    with open(os.path.join(values, "styles.xml"), "w", encoding="utf-8") as f:
        f.write(styles)

    strings = os.path.join(values, "strings.xml")
    if os.path.exists(strings):
        with open(strings, "r", encoding="utf-8") as f:
            s = f.read()
        s = re.sub(
            r'<string name="app_name">[^<]*</string>',
            '<string name="app_name">Educate MW</string>',
            s,
        )
        with open(strings, "w", encoding="utf-8") as f:
            f.write(s)


def patch_manifest() -> None:
    manifest = "android/app/src/main/AndroidManifest.xml"
    if not os.path.exists(manifest):
        return
    with open(manifest, "r", encoding="utf-8") as f:
        xml = f.read()

    if "android:icon=" in xml:
        xml = re.sub(r'android:icon="[^"]*"', 'android:icon="@mipmap/ic_launcher"', xml)
    else:
        xml = xml.replace(
            "<application",
            '<application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"',
            1,
        )
    if "android:roundIcon=" in xml:
        xml = re.sub(
            r'android:roundIcon="[^"]*"',
            'android:roundIcon="@mipmap/ic_launcher_round"',
            xml,
        )

    xml = re.sub(
        r'android:theme="[^"]*"',
        'android:theme="@style/AppTheme.NoActionBarLaunch"',
        xml,
        count=1,
    )
    xml = re.sub(
        r'(<application[^>]*android:theme=")[^"]*(")',
        r"\1@style/AppTheme.NoActionBar\2",
        xml,
        count=1,
    )

    if "android.intent.category.APP_EDUCATION" not in xml:
        xml = xml.replace(
            '<category android:name="android.intent.category.LAUNCHER" />',
            '<category android:name="android.intent.category.LAUNCHER" />\n'
            '                <category android:name="android.intent.category.APP_EDUCATION" />',
            1,
        )

    with open(manifest, "w", encoding="utf-8") as f:
        f.write(xml)
    print("AndroidManifest: icons + APP_EDUCATION patched")


def apply_assets() -> None:
    logo = load_logo()
    res_dir = "android/app/src/main/res"
    if not os.path.isdir("android"):
        print("Error: android/ missing — run after cap add android", file=sys.stderr)
        sys.exit(1)
    os.makedirs(res_dir, exist_ok=True)

    wipe_default_robot(res_dir)
    write_mipmaps(res_dir, logo)
    write_splash(res_dir, logo)
    write_styles(res_dir)
    patch_manifest()

    mdpi = os.path.join(res_dir, "mipmap-mdpi", "ic_launcher.png")
    splash = os.path.join(res_dir, "drawable", "splash.png")
    for p in (mdpi, splash):
        with open(p, "rb") as f:
            magic = f.read(4)
        if magic != b"\x89PNG":
            print("Error: not PNG", p, magic, file=sys.stderr)
            sys.exit(1)
    if os.path.isdir(os.path.join(res_dir, "mipmap-anydpi-v26")):
        print("Error: anydpi still present — robot may return", file=sys.stderr)
        sys.exit(1)
    print("OK: launcher + splash from public/app-icon.png (no adaptive robot)")


if __name__ == "__main__":
    apply_assets()
