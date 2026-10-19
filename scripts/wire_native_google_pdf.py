#!/usr/bin/env python3
"""Wire native Google auth + PDF open into App.tsx (production)."""
from pathlib import Path

def main():
    p = Path("src/App.tsx")
    text = p.read_text()
    n = 0

    if 'from "./native/googleAuth"' not in text and 'from \'./native/googleAuth\'' not in text:
        # insert import after firebase auth imports block
        needle = 'GoogleAuthProvider,'
        if needle in text:
            # add side import near top after other imports - find last import line of firebase/auth
            idx = text.find('from "firebase/auth"')
            if idx > 0:
                end = text.find("\n", idx)
                insert = '\nimport { signInWithGoogleNativeAware, isNativeApp } from "./native/googleAuth";\nimport { openPdf, pickDevicePdfs } from "./native/pdfReader";\n'
                text = text[: end + 1] + insert + text[end + 1 :]
                n += 1
                print("OK imports")

    old = "await signInWithPopup(auth, googleProvider);"
    new = "await signInWithGoogleNativeAware();"
    if old in text:
        text = text.replace(old, new)  # all occurrences
        n += 1
        print("OK google login")

    # Library PDF: prefer openPdf on native when type pdf
    old_dl = """    if (item.type === "pdf" && item.content) {
      try {
        await triggerExplicitDownload(item.content, item.title);
      } catch (err) {
        console.error("Trigger explicit download failed:", err);
      }
    }"""
    new_dl = """    if (item.type === "pdf" && item.content) {
      try {
        if (isNativeApp()) {
          await openPdf(item.content, item.title);
        } else {
          await triggerExplicitDownload(item.content, item.title);
        }
      } catch (err) {
        console.error("PDF open/download failed:", err);
      }
    }"""
    if old_dl in text:
        text = text.replace(old_dl, new_dl, 1)
        n += 1
        print("OK library pdf")

    # Soften a few shouty uppercase page labels (titles, not micro-badges)
    for a, b in [
        ("Study Library", "Study library"),
        ("Community Feed", "Community"),
        ("Universal Community Feed", "Community feed"),
    ]:
        if a in text:
            text = text.replace(a, b)
            n += 1
            print("OK case", a)

    p.write_text(text)
    print("patches", n)

if __name__ == "__main__":
    main()
