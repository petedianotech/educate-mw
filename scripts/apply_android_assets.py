#!/usr/bin/env python3
import os, re
from PIL import Image, ImageDraw

def apply_assets():
    icon_path = "public/app-icon.png"
    if not os.path.exists(icon_path):
        for alt in ["public/logo.png", "public/favicon.png"]:
            if os.path.exists(alt):
                icon_path = alt
                break
    if not os.path.exists(icon_path):
        print("Error: App icon not found")
        return
    print("Using app icon:", icon_path)
    img = Image.open(icon_path).convert("RGBA")
    res_dir = "android/app/src/main/res"
    os.makedirs(res_dir, exist_ok=True)
    sizes = {"mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192}
    for folder, size in sizes.items():
        d = os.path.join(res_dir, folder)
        os.makedirs(d, exist_ok=True)
        r = img.resize((size, size), Image.Resampling.LANCZOS)
        r.save(os.path.join(d, "ic_launcher.png"))
        r.save(os.path.join(d, "ic_launcher_round.png"))
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
    fg.save(os.path.join(drawable_dir, "ic_launcher_foreground.png"))
    with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n')
        f.write('<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">\n')
        f.write('    <solid android:color="#1e3a8a"/>\n')
        f.write('</shape>\n')
    adaptive = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@drawable/ic_launcher_background"/>\n'
        '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
        '</adaptive-icon>\n'
    )
    for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(os.path.join(anydpi_dir, name), "w") as f:
            f.write(adaptive)

    def make_splash(w, h, icon_size, dot_y, dots):
        splash = Image.new("RGBA", (w, h), (30, 58, 138, 255))
        icon = img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        splash.paste(icon, ((w - icon_size) // 2, (h - icon_size) // 2 - max(40, h // 32)), icon)
        draw = ImageDraw.Draw(splash)
        r = max(6, w // 120)
        for dx in dots:
            draw.ellipse([dx - r, dot_y - r, dx + r, dot_y + r], fill=(255, 255, 255, 255))
        return splash.convert("RGB")

    splash_p = make_splash(1080, 1920, 400, 1680, [490, 540, 590])
    splash_p.save(os.path.join(drawable_dir, "splash.png"))
    try:
        splash_p.save("public/splash.png")
    except OSError:
        pass
    for alt in ("splashscreen.png", "splash_icon.png"):
        try:
            splash_p.save(os.path.join(drawable_dir, alt))
        except OSError:
            pass
    land = os.path.join(res_dir, "drawable-land")
    os.makedirs(land, exist_ok=True)
    make_splash(1920, 1080, 320, 960, [910, 960, 1010]).save(os.path.join(land, "splash.png"))
    for dens, size in (("hdpi", (480, 800)), ("xhdpi", (720, 1280)), ("xxhdpi", (1080, 1920))):
        d = os.path.join(res_dir, "drawable-" + dens)
        os.makedirs(d, exist_ok=True)
        make_splash(size[0], size[1], int(size[0] * 0.35), int(size[1] * 0.88),
                    [size[0] // 2 - 40, size[0] // 2, size[0] // 2 + 40]).save(os.path.join(d, "splash.png"))

    values = os.path.join(res_dir, "values")
    os.makedirs(values, exist_ok=True)
    styles = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<resources>\n'
        '    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">\n'
        '        <item name="colorPrimary">#1e3a8a</item>\n'
        '        <item name="colorPrimaryDark">#1e3a8a</item>\n'
        '        <item name="colorAccent">#3b82f6</item>\n'
        '        <item name="android:statusBarColor">#1e3a8a</item>\n'
        '        <item name="android:windowBackground">@drawable/splash</item>\n'
        '    </style>\n'
        '    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">\n'
        '        <item name="windowActionBar">false</item>\n'
        '        <item name="windowNoTitle">true</item>\n'
        '        <item name="android:statusBarColor">#1e3a8a</item>\n'
        '        <item name="android:windowBackground">@drawable/splash</item>\n'
        '    </style>\n'
        '    <style name="AppTheme.NoActionBarLaunch" parent="Theme.AppCompat.DayNight.NoActionBar">\n'
        '        <item name="windowActionBar">false</item>\n'
        '        <item name="windowNoTitle">true</item>\n'
        '        <item name="android:windowBackground">@drawable/splash</item>\n'
        '        <item name="android:statusBarColor">#1e3a8a</item>\n'
        '        <item name="android:windowFullscreen">true</item>\n'
        '    </style>\n'
        '</resources>\n'
    )
    with open(os.path.join(values, "styles.xml"), "w") as f:
        f.write(styles)

    manifest = "android/app/src/main/AndroidManifest.xml"
    if os.path.exists(manifest):
        with open(manifest, "r", encoding="utf-8") as f:
            xml = f.read()
        xml2 = re.sub(r'android:theme="[^"]*"', 'android:theme="@style/AppTheme.NoActionBarLaunch"', xml, count=1)
        xml2 = re.sub(r'(<application[^>]*android:theme=")[^"]*(")', r'\1@style/AppTheme.NoActionBar\2', xml2, count=1)
        if xml2 != xml:
            with open(manifest, "w", encoding="utf-8") as f:
                f.write(xml2)
            print("AndroidManifest themes patched")
    print("Android assets applied from public/app-icon.png")

if __name__ == "__main__":
    apply_assets()
