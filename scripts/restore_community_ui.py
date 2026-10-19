#!/usr/bin/env python3
from pathlib import Path
import base64
b = Path('scripts/blobs/community_cv0.b64').read_text() + Path('scripts/blobs/community_cv1.b64').read_text()
data = base64.b64decode(b)
Path('src/components/CommunityView.tsx').write_bytes(data)
print('restored', len(data))
