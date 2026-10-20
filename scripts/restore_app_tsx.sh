#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
cat scripts/app_restore_part*.b64 | tr -d '\n' | base64 -d | python3 -c "import sys,zlib; sys.stdout.buffer.write(zlib.decompress(sys.stdin.buffer.read()))" > src/App.tsx
echo "Restored App.tsx $(wc -c < src/App.tsx) bytes"
