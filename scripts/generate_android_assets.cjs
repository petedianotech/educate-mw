const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generate() {
  const iconPath = path.resolve('public/app-icon.png');
  if (!fs.existsSync(iconPath)) {
    console.error('Error: public/app-icon.png not found');
    process.exit(1);
  }

  console.log('Generating Android assets from:', iconPath);

  // Target directories
  const targetDirs = [
    path.resolve('android-config/res'),
    path.resolve('android/app/src/main/res'),
  ];

  for (const baseRes of targetDirs) {
    fs.mkdirSync(baseRes, { recursive: true });

    // 1. Standard Launcher mipmaps (ic_launcher.png, ic_launcher_round.png)
    const mipmapSizes = {
      'mipmap-mdpi': 48,
      'mipmap-hdpi': 72,
      'mipmap-xhdpi': 96,
      'mipmap-xxhdpi': 144,
      'mipmap-xxxhdpi': 192,
    };

    for (const [folder, size] of Object.entries(mipmapSizes)) {
      const folderPath = path.join(baseRes, folder);
      fs.mkdirSync(folderPath, { recursive: true });

      // Regular launcher icon
      await sharp(iconPath)
        .resize(size, size, { fit: 'contain', background: { r: 30, g: 58, b: 138, alpha: 1 } })
        .png()
        .toFile(path.join(folderPath, 'ic_launcher.png'));

      // Round launcher icon
      const circleSvg = Buffer.from(
        `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#1e3a8a"/></svg>`
      );
      await sharp(iconPath)
        .resize(Math.round(size * 0.82), Math.round(size * 0.82), { fit: 'contain' })
        .toBuffer()
        .then(innerBuf =>
          sharp(circleSvg)
            .composite([{ input: innerBuf, gravity: 'center' }])
            .png()
            .toFile(path.join(folderPath, 'ic_launcher_round.png'))
        );

      // Adaptive foreground for each mipmap density
      const fgSize = Math.round(size * 2.25);
      const fgIconSize = Math.round(fgSize * 0.72);
      const iconResized = await sharp(iconPath)
        .resize(fgIconSize, fgIconSize, { fit: 'contain' })
        .toBuffer();

      await sharp({
        create: {
          width: fgSize,
          height: fgSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: iconResized, gravity: 'center' }])
        .png()
        .toFile(path.join(folderPath, 'ic_launcher_foreground.png'));
    }

    // 2. Drawable directory for adaptive background & foreground
    const drawableDir = path.join(baseRes, 'drawable');
    fs.mkdirSync(drawableDir, { recursive: true });

    // Clean up duplicate background PNG if any
    const bgPng = path.join(drawableDir, 'ic_launcher_background.png');
    if (fs.existsSync(bgPng)) fs.unlinkSync(bgPng);

    // Delete any default vector ic_launcher_foreground.xml that Capacitor/Android puts in drawable-v24
    const drawableV24 = path.join(baseRes, 'drawable-v24');
    if (fs.existsSync(drawableV24)) {
      const defaultXml = path.join(drawableV24, 'ic_launcher_foreground.xml');
      if (fs.existsSync(defaultXml)) fs.unlinkSync(defaultXml);
    }

    // Write background XML
    fs.writeFileSync(
      path.join(drawableDir, 'ic_launcher_background.xml'),
      `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#1e3a8a"/>
</shape>\n`
    );

    // Foreground PNG for drawable (432x432, 72% icon size)
    const fg432 = await sharp(iconPath)
      .resize(312, 312, { fit: 'contain' })
      .toBuffer();
    await sharp({
      create: {
        width: 432,
        height: 432,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: fg432, gravity: 'center' }])
      .png()
      .toFile(path.join(drawableDir, 'ic_launcher_foreground.png'));

    // 3. mipmap-anydpi-v26 adaptive icon XMLs
    const anydpiDir = path.join(baseRes, 'mipmap-anydpi-v26');
    fs.mkdirSync(anydpiDir, { recursive: true });
    const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>\n`;
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);

    // 4. Generate Splash screens with centered app icon and ( . . . ) dots loading indicator on bottom
    async function makeSplash(w, h, iconSize, dotY) {
      const resizedIcon = await sharp(iconPath)
        .resize(iconSize, iconSize, { fit: 'contain' })
        .toBuffer();

      const r = Math.max(7, Math.round(w / 110));
      const spacing = Math.round(r * 3.6);
      const cx = Math.round(w / 2);
      const dotsSvg = Buffer.from(`
        <svg width="${w}" height="${h}">
          <circle cx="${cx - spacing}" cy="${dotY}" r="${r}" fill="#ffffff" opacity="0.6"/>
          <circle cx="${cx}" cy="${dotY}" r="${r + 1}" fill="#ffffff" opacity="0.95"/>
          <circle cx="${cx + spacing}" cy="${dotY}" r="${r}" fill="#ffffff" opacity="0.6"/>
        </svg>
      `);

      return sharp({
        create: {
          width: w,
          height: h,
          channels: 4,
          background: { r: 30, g: 58, b: 138, alpha: 1 },
        },
      })
        .composite([
          {
            input: resizedIcon,
            top: Math.round((h - iconSize) / 2 - Math.max(30, Math.round(h * 0.04))),
            left: Math.round((w - iconSize) / 2),
          },
          {
            input: dotsSvg,
            top: 0,
            left: 0,
          },
        ])
        .png();
    }

    // Default splash (1080x1920)
    const splash1080 = await makeSplash(1080, 1920, 380, 1700);
    await splash1080.toFile(path.join(drawableDir, 'splash.png'));
    await splash1080.toFile(path.join(drawableDir, 'splashscreen.png'));
    await splash1080.toFile(path.join(drawableDir, 'splash_icon.png'));

    // Public splash
    try {
      await splash1080.toFile(path.resolve('public/splash.png'));
    } catch {}

    // Density specific splash screens
    const splashConfigs = [
      { folder: 'drawable-port-hdpi', w: 480, h: 800, icon: 180, dotY: 710 },
      { folder: 'drawable-port-xhdpi', w: 720, h: 1280, icon: 260, dotY: 1140 },
      { folder: 'drawable-port-xxhdpi', w: 1080, h: 1920, icon: 380, dotY: 1700 },
      { folder: 'drawable-port-xxxhdpi', w: 1440, h: 2560, icon: 500, dotY: 2280 },
      { folder: 'drawable-hdpi', w: 480, h: 800, icon: 180, dotY: 710 },
      { folder: 'drawable-xhdpi', w: 720, h: 1280, icon: 260, dotY: 1140 },
      { folder: 'drawable-xxhdpi', w: 1080, h: 1920, icon: 380, dotY: 1700 },
      { folder: 'drawable-land-hdpi', w: 800, h: 480, icon: 160, dotY: 430 },
      { folder: 'drawable-land-xhdpi', w: 1280, h: 720, icon: 240, dotY: 650 },
      { folder: 'drawable-land-xxhdpi', w: 1920, h: 1080, icon: 340, dotY: 980 },
      { folder: 'drawable-land', w: 1920, h: 1080, icon: 340, dotY: 980 },
    ];

    for (const cfg of splashConfigs) {
      const folderPath = path.join(baseRes, cfg.folder);
      fs.mkdirSync(folderPath, { recursive: true });
      const img = await makeSplash(cfg.w, cfg.h, cfg.icon, cfg.dotY);
      await img.toFile(path.join(folderPath, 'splash.png'));
    }

    // Styles.xml for Android splash theme
    const valuesDir = path.join(baseRes, 'values');
    fs.mkdirSync(valuesDir, { recursive: true });
    const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
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
        <item name="android:statusBarColor">#1e3a8a</item>
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>\n`;
    fs.writeFileSync(path.join(valuesDir, 'styles.xml'), stylesXml);
  }

  console.log('All Android assets (icons, splash with loading dots) generated successfully!');
}

generate().catch(err => {
  console.error('Asset generation error:', err);
  process.exit(1);
});
