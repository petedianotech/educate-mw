#!/usr/bin/env python3
"""Restore server.ts from last known good SHA and add extractGeminiText."""
import urllib.request
from pathlib import Path

GOOD = "0747b870ffc3d41268bbec1b289bdc2b29ccf823"
url = f"https://raw.githubusercontent.com/petedianotech/educate-mw/{GOOD}/server.ts"
print("fetch", url)
raw = urllib.request.urlopen(url, timeout=60).read().decode()

if "PLACEHOLDER" in raw or len(raw) < 500:
    raise SystemExit("bad source server")

helper = '''
  function extractGeminiText(response: any): string {
    if (!response) return "";
    try {
      if (typeof response.text === "string" && response.text.trim()) return response.text;
    } catch {}
    try {
      const parts = response?.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts.map((p: any) => p?.text || "").filter(Boolean).join("\\n").trim();
      }
    } catch {}
    return "";
  }

'''

if "function extractGeminiText" not in raw:
    raw = raw.replace("  /** Text models:", helper + "  /** Text models:")

old = """        const response = await generateWithFallback({ contents, config });
        responseText = response.text || \"Sorry, I couldn't find an answer to that.\";"""
new = """        const response = await generateWithFallback({ contents, config });
        responseText = extractGeminiText(response) || \"Sorry, I couldn't find an answer to that.\";"""
# try without escaped quotes
old2 = """        const response = await generateWithFallback({ contents, config });
        responseText = response.text || "Sorry, I couldn't find an answer to that.";"""
new2 = """        const response = await generateWithFallback({ contents, config });
        responseText = extractGeminiText(response) || "Sorry, I couldn't find an answer to that.";"""
if old2 in raw:
    raw = raw.replace(old2, new2)
    print("chat extract patched")
elif "extractGeminiText(response)" in raw:
    print("chat already uses extract")
else:
    print("WARN chat pattern not found")

raw = raw.replace("const text = response.text || '';", "const text = extractGeminiText(response);")
raw = raw.replace(
    'let responseText = response.text || "I have some ideas for you. Let\'s discuss your interests further.";',
    'let responseText = extractGeminiText(response) || "I have some ideas for you. Let\'s discuss your interests further.";',
)

Path("server.ts").write_text(raw)
print("wrote server.ts", len(raw), "extractGeminiText" in raw)
