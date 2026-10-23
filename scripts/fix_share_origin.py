#!/usr/bin/env python3
"""Force shareable educatemw.vercel.app URLs instead of capacitor localhost."""
from pathlib import Path

APP = Path("src/App.tsx")
CFG = Path("src/lib/appConfig.ts")

CFG.write_text(
    '''/**\n * Canonical public URL for Educate MW.\n * Capacitor WebView often reports origin as https://localhost — never use that for share links.\n */\nexport const APP_ORIGIN = "https://educatemw.vercel.app";\nexport const APP_ORIGIN_ALT = "https://educatemw.app";\n\nexport function getAppOrigin(): string {\n  try {\n    const o = typeof window !== "undefined" ? window.location?.origin : "";\n    if (\n      o &&\n      !/localhost|127\\.0\\.0\\.1|capacitor|ionic|file:\\/\\//i.test(o) &&\n      o.startsWith("http")\n    ) {\n      return o.replace(/\\/$/, "");\n    }\n  } catch {\n    /* ignore */\n  }\n  return APP_ORIGIN;\n}\n\nexport function appShareUrl(path = "/"): string {\n  const base = getAppOrigin();\n  const p = path.startsWith("/") ? path : `/${path}`;\n  return `${base}${p}`;\n}\n''',
    encoding="utf-8",
)
print("wrote", CFG)

if not APP.exists():
    raise SystemExit(0)

t = APP.read_text(encoding="utf-8")
orig = t

if "from \"./lib/appConfig\"" not in t and "from './lib/appConfig'" not in t:
    marker = 'from "./lib/cloudinary"'
    if marker in t:
        t = t.replace(
            marker,
            marker + ';\nimport { appShareUrl, getAppOrigin } from "./lib/appConfig"',
            1,
        )
    else:
        t = 'import { appShareUrl, getAppOrigin } from "./lib/appConfig";\n' + t
    print("import added")

old = 'const referralLink = `${window.location.origin}/?ref=${profile?.referralCode || "MW-LINK"}`;'
new = 'const referralLink = `${getAppOrigin()}/?ref=${profile?.referralCode || "MW-LINK"}`;'
if old in t:
    t = t.replace(old, new, 1)
    print("referralLink fixed")
elif "${window.location.origin}/?ref=" in t:
    t = t.replace("${window.location.origin}/?ref=", "${getAppOrigin()}/?ref=", 1)
    print("referralLink fixed (alt)")

if t != orig:
    APP.write_text(t, encoding="utf-8")
    print("wrote App.tsx")
