#!/usr/bin/env python3
"""Point all icons to public/app-icon.png; Pro subscription blue theme."""
from pathlib import Path

for path in list(Path("src").rglob("*.tsx")) + list(Path("src").rglob("*.ts")):
    t = path.read_text()
    if "app-icon.jpg" in t:
        path.write_text(t.replace("/app-icon.jpg", "/app-icon.png"))
        print("icon:", path)

p = Path("src/App.tsx")
t = p.read_text()
start = t.find("function SubscriptionView({")
end = t.find("function RegisterView({")
assert start > 0 and end > start
before, mid, after = t[:start], t[start:end], t[end:]
for a, b in [
    ("text-amber-500", "text-blue-600"),
    ("border-amber-500/40", "border-blue-500/30"),
    ("border-amber-300", "border-blue-200"),
    ("shadow-amber-500/5", "shadow-blue-500/5"),
    ("bg-amber-500/15", "bg-blue-500/15"),
    ("border-amber-500/30", "border-blue-500/30"),
    ("bg-amber-500", "bg-blue-600"),
    ("text-amber-400", "text-blue-500"),
    ("border-amber-500/20", "border-blue-500/20"),
    ("bg-amber-500/10", "bg-blue-500/10"),
]:
    mid = mid.replace(a, b)
mid = mid.replace(
    "text-base font-black uppercase tracking-tight",
    "text-base font-bold tracking-tight",
    1,
)
mid = mid.replace(
    "font-black uppercase tracking-wider bg-blue-500/15",
    "font-semibold tracking-wide bg-blue-500/15",
)
p.write_text(before + mid + after)
print("Pro blue + icons done")
print("jpg left", p.read_text().count("app-icon.jpg"))
print("amber in sub", mid.count("amber"))
