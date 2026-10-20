#!/usr/bin/env python3
from pathlib import Path

app = Path("src/App.tsx")
t = app.read_text()
marker = "const dataItems = await response.json();"
if "Emi API returned HTML" in t:
    print("already patched")
elif marker in t and 'apiUrl("/api/gemini/chat")' in t:
    idx = t.find('apiUrl("/api/gemini/chat")')
    j = t.find(marker, idx)
    k = t.rfind("if (!response.ok)", idx, j)
    if k >= 0 and j > k:
        end = j + len(marker)
        replacement = (
            "const rawBody = await response.text();\n"
            "      let dataItems: any = {};\n"
            "      try {\n"
            "        dataItems = rawBody ? JSON.parse(rawBody) : {};\n"
            "      } catch {\n"
            "        throw new Error(\n"
            '          "Emi API returned HTML instead of JSON. Rebuild APK / check Vercel GEMINI_API_KEY and /api routes.",\n'
            "        );\n"
            "      }\n"
            "      if (!response.ok) {\n"
            "        throw new Error(dataItems.error || `Server Error: ${response.status}`);\n"
            "      }"
        )
        t = t[:k] + replacement + t[end:]
        app.write_text(t)
        print("patched client")
    else:
        print("structure mismatch")
else:
    print("nothing to do")
