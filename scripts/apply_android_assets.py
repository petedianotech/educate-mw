import os
import sys
from PIL import Image, ImageDraw

def apply_assets():
    icon_path = "public/app-icon.png"
    if not os.path.exists(icon_path):
        for alt in ["public/logo.png", "public/favicon.png"]:
            if os.path.exists(alt):
                icon_path = alt
                break
    if not os.path.exists(icon_path):
        print("Error: App icon not found in public/")
        return

    print(f"Using app icon: {icon_path}")
    img = Image.open(icon_path).convert("RGBA")

    res_dir = "android/app/src/main/res"
    os.makedirs(res_dir, exist_ok=True)
    
    # 1. Launcher icons
    icon_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }
    
    for folder, size in icon_sizes.items():
        d = os.path.join(res_dir, folder)
        os.makedirs(d, exist_ok=True)
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(d, "ic_launcher.png"))
        resized.save(os.path.join(d, "ic_launcher_round.png"))

    # Adaptive foreground (432x432)
    anydpi_dir = os.path.join(res_dir, "mipmap-anydpi-v26")
    drawable_dir = os.path.join(res_dir, "drawable")
    os.makedirs(anydpi_dir, exist_ok=True)
    os.makedirs(drawable_dir, exist_ok=True)
    
    # Never leave a PNG background next to the XML (duplicate resource crash)
    bg_png = os.path.join(drawable_dir, "ic_launcher_background.png")
    if os.path.exists(bg_png):
        os.remove(bg_png)
    
    fg_resized = img.resize((432, 432), Image.Resampling.LANCZOS)
    fg_resized.save(os.path.join(drawable_dir, "ic_launcher_foreground.png"))
    
    # Background xml
    bg_xml = '''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#1e3a8a"/>
</shape>
'''
    with open(os.path.join(drawable_dir, "ic_launcher_background.xml"), "w") as f:
        f.write(bg_xml)

    # Adaptive icon xml
    adaptive_xml = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
'''
    with open(os.path.join(anydpi_dir, "ic_launcher.xml"), "w") as f:
        f.write(adaptive_xml)
    with open(os.path.join(anydpi_dir, "ic_launcher_round.xml"), "w") as f:
        f.write(adaptive_xml)

    # 2. Splash Screens
    # Portrait 1080x1920
    splash_p = Image.new("RGBA", (1080, 1920), (30, 58, 138, 255)) # #1e3a8a
    icon_splash = img.resize((400, 400), Image.Resampling.LANCZOS)
    p_x = (1080 - 400) // 2
    p_y = (1920 - 400) // 2 - 60
    splash_p.paste(icon_splash, (p_x, p_y), icon_splash)
    
    draw_p = ImageDraw.Draw(splash_p)
    dot_y = 1680
    for dx in [490, 540, 590]:
        draw_p.ellipse([dx - 8, dot_y - 8, dx + 8, dot_y + 8], fill=(255, 255, 255, 255))
    
    splash_p.convert("RGB").save(os.path.join(drawable_dir, "splash.png"))
    
    # Also save to public for web reference
    splash_p.convert("RGB").save("public/splash.png")

    # Landscape 1920x1080
    drawable_land = os.path.join(res_dir, "drawable-land")
    os.makedirs(drawable_land, exist_ok=True)
    splash_l = Image.new("RGBA", (1920, 1080), (30, 58, 138, 255))
    icon_splash_l = img.resize((320, 320), Image.Resampling.LANCZOS)
    l_x = (1920 - 320) // 2
    l_y = (1080 - 320) // 2 - 40
    splash_l.paste(icon_splash_l, (l_x, l_y), icon_splash_l)
    
    draw_l = ImageDraw.Draw(splash_l)
    for dx in [910, 960, 1010]:
        draw_l.ellipse([dx - 6, 960 - 6, dx + 6, 960 + 6], fill=(255, 255, 255, 255))
    
    splash_l.convert("RGB").save(os.path.join(drawable_land, "splash.png"))

    # Also ensure styles.xml has splash background theme
    values_dir = os.path.join(res_dir, "values")
    os.makedirs(values_dir, exist_ok=True)
    styles_xml = '''<?xml version="1.0" encoding="utf-8"?>
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
'''
    with open(os.path.join(values_dir, "styles.xml"), "w") as f:
        f.write(styles_xml)

    print("Android assets (icons and splash screens) successfully generated and applied!")

if __name__ == "__main__":
    apply_assets()
