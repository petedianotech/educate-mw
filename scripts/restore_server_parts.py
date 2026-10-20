#!/usr/bin/env python3
import base64
from pathlib import Path
parts = []
for i in range(3):
    parts.append(Path(f"scripts/server_b64_part{i}.txt").read_text().strip())
raw = base64.b64decode("".join(parts)).decode()
Path("server.ts").write_text(raw)
assert "extractGeminiText" in raw
print("server.ts restored", len(raw))
