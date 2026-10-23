#!/usr/bin/env bash
# Download Emi logo into public/ and point App.tsx at the local path (offline-safe).
set -e
mkdir -p public
EMI_URL="https://i.ibb.co/cS5rBBny/emi-AI-logo.png"
TARGET="public/emiai.png"

if [ ! -s "$TARGET" ]; then
  echo "Downloading Emi AI logo -> $TARGET"
  curl -fsSL -A "Mozilla/5.0 EducateMW" -o "$TARGET" "$EMI_URL" || {
    echo "WARN: could not download Emi logo; upload public/emiai.png manually"
  }
fi

if [ -s "$TARGET" ]; then
  echo "Emi logo ready: $(wc -c < "$TARGET") bytes"
fi

# Replace remote ibb URLs with local asset in source (idempotent)
if [ -f src/App.tsx ] && grep -q 'i.ibb.co/cS5rBBny/emi-AI-logo.png' src/App.tsx 2>/dev/null; then
  sed -i 's|https://i.ibb.co/cS5rBBny/emi-AI-logo.png|/emiai.png|g' src/App.tsx
  echo "App.tsx: Emi image URLs -> /emiai.png"
fi
