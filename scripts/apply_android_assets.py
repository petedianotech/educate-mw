#!/usr/bin/env python3
"""Generate Android launcher icons + splash from public/app-icon.png (any format)."""
import os
import re
import sys

from PIL import Image, ImageDraw


def ensure_png_rgba(path: str) -> Image.Image:
    img = Image.open(path)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    try:
        img.save(path if path.lower().endswith(".png") else "public/app-icon.png", format="PNG")
    except OSError:
        pass
    return img


def apply_assets() -> None:
    icon_path = None
    for candidate in (
        "public/app-icon.png",
        "public/logo.png",
        "public/favicon.png",
        "public/splash.png",
    ):
        if os.path.exists(candidate) and os.path.getsize(candidate) > 100:
            icon_path = candidate
            break
    if not icon_path:
        print("Error: App icon not found under public/", file=sys.stderr)
        sys.exit(1)

    print("Using app icon:", icon_path, "size=", os.path.getsize(icon_path))
    img = ensure_png_rgba(icon_path)

    res_dir = "android/app/src/main/res"
    os.makedirs(res_dir, exist_ok=True)

    sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in sizes.items():
        d = os.path.join(res_dir, folder)
        os.makedirs(d, exist_ok=True)
        r = img.resize((size, size), Image.Resampling.LANCZOS)
        for name in ("ic_launcher.png", "ic_launcher_round.png"):
            out = os.path.join(d, name)
            r.save(out, format="PNG")
            webp = out.replace(".png", ".webp")
            if os.path.exists(webp):
                os.remove(webp)

    drawable_dir = os.path.join(res_dir, "drawable")
    anydpi_dir = os.path.join(res_dir, "mipmap-anydpi-v26")
    os.makedirs(drawable_dir, exist_ok=True)
    os.makedirs(anydpi_dir, exist_ok=True)

    bg_png = os.path.join(drawable_dir, "ic_launcher_background.png")
    if os.path.exists(bg_png):
        os.remove(bg_png)

    fg = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
    fi = img.resize((324, 324), Image.Resampling.LANCZOS)
    fg.paste(fi, ((432 - 324) // 2, (432 - 324) // 2), fi)
    fg.save(os.path.join(drawable_dir, "ic_launcher_foreground.png"), format="PNG")

    with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w") as f:
        f.write(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            '<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n'
            '    <solid android:color="#1e3a8a"/>\n'
            "</shape>\n"
        )

    adaptive = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@drawable/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
        "</adaptive-icon>\n"
    )
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(os.path.join(anydpi_dir, name), "w") as f:
            f.write(adaptive)

    def make_splash(w, h, icon_size, dot_y, dots):
        splash = Image.new("RGBA", (w, h), (30, 58, 138, 255))
        icon = img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        y = max(0, (h - icon_size) // 2 - max(40, h // 32))
        splash.paste(icon, ((w - icon_size) // 2, y), icon)
        draw = ImageDraw.Draw(splash)
        r = max(6, w // 120)
        for dx in dots:
            draw.ellipse([dx - r, dot_y - r, dx + r, dot_y + r], fill=(255, 255, 255, 255))
        return splash.convert("RGB")

    splash_p = make_splash(1080, 1920, 400, 1680, [490, 540, 590])
    splash_path = os.path.join(drawable_dir, "splash.png")
    splash_p.save(splash_path, format="PNG")
    with open(splash_path, "rb") as f:
        magic = f.read(8)
    if magic[:4] != b"\x89PNG":
        print("Error: splash.png is not a valid PNG", magic, file=sys.stderr)
        sys.exit(1)
    print("Wrote splash.png", os.path.getsize(splash_path), "bytes")

    for alt in ("splashscreen.png", "splash_icon.png"):
        splash_p.save(os.path.join(drawable_dir, alt), format="PNG")

    land = os.path.join(res_dir, "drawable-land")
    os.makedirs(land, exist_ok=True)
    make_splash(1920, 1080, 320, 960, [910, 960, 1010]).save(
        os.path.join(land, "splash.png"), format="PNG"
    )
    for dens, size in (("hdpi", (480, 800)), ("xhdpi", (720, 1280)), ("xxhdpi", (1080, 1920))):
        d = os.path.join(res_dir, "drawable-" + dens)
        os.makedirs(d, exist_ok=True)
        make_splash(
            size[0],
            size[1],
            int(size[0] * 0.35),
            int(size[1] * 0.88),
            [size[0] // 2 - 40, size[0] // 2, size[0] // 2 + 40],
        ).save(os.path.join(d, "splash.png"), format="PNG")

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
    with open(os.path.join(values, "styles.xml"), "w") as f:
        f.write(styles)

    strings = os.path.join(values, "strings.xml")
    if os.path.exists(strings):
        with open(strings, "r", encoding="utf-8") as f:
            s = f.read()
        s2 = re.sub(
            r'<string name="app_name">[^<]*</string>',
            '<string name="app_name">Educate MW</string>',
            s,
        )
        with open(strings, "w", encoding="utf-8") as f:
            f.write(s2)

    manifest = "android/app/src/main/AndroidManifest.xml"
    if os.path.exists(manifest):
        with open(manifest, "r", encoding="utf-8") as f:
            xml = f.read()
        xml2 = re.sub(
            r'android:theme="[^"]*"',
            'android:theme="@style/AppTheme.NoActionBarLaunch"',
            xml,
            count=1,
        )
        if "android:icon=" not in xml2:
            xml2 = xml2.replace(
                "<application",
                '<application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"',
                1,
            )
        else:
            xml2 = re.sub(r'android:icon="[^"]*"', 'android:icon="@mipmap/ic_launcher"', xml2)
            xml2 = re.sub(
                r'android:roundIcon="[^"]*"',
                'android:roundIcon="@mipmap/ic_launcher_round"',
                xml2,
            )
        xml2 = re.sub(
            r'(<application[^>]*android:theme=")[^"]*(")',
            r"\1@style/AppTheme.NoActionBar\2",
            xml2,
            count=1,
        )
        if xml2 != xml:
            with open(manifest, "w", encoding="utf-8") as f:
                f.write(xml2)
            print("AndroidManifest themes + icons patched")

    mdpi = os.path.join(res_dir, "mipmap-mdpi", "ic_launcher.png")
    with open(mdpi, "rb") as f:
        if f.read(4) != b"\x89PNG":
            print("Error: ic_launcher.png not PNG", file=sys.stderr)
            sys.exit(1)
    print("Android assets applied from", icon_path)


if __name__ == "__main__":
    apply_assets()
