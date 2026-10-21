#!/usr/bin/env python3
import base64, zlib, pathlib
parts = sorted(pathlib.Path("scripts/blobs/app_zlib").glob("part*.txt"), key=lambda p: int(p.stem.replace("part","")))
b64 = "".join(p.read_text().strip() for p in parts)
raw = zlib.decompress(base64.b64decode(b64))
pathlib.Path("src/App.tsx").write_bytes(raw)
print("Restored src/App.tsx", len(raw))
