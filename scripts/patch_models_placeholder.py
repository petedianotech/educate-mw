#!/usr/bin/env python3
"""Update Gemini models + Emi placeholder in server.ts and App.tsx."""
from pathlib import Path

def main():
    n = 0
    server = Path("server.ts")
    if server.exists():
        t = server.read_text()
        old_text = 'const TEXT_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash"] as const;'
        new_text = 'const TEXT_MODELS = ["gemini-3.5-flash-lite"] as const; // Search grounding supported; high free-tier limits'
        if old_text in t:
            t = t.replace(old_text, new_text)
            n += 1
            print("OK TEXT_MODELS")
        elif "gemini-3.5-flash-lite" not in t:
            # broader replace
            import re
            t2, c = re.subn(
                r'const TEXT_MODELS = \[[^\]]+\] as const;',
                new_text,
                t,
                count=1,
            )
            if c:
                t = t2
                n += 1
                print("OK TEXT_MODELS regex")

        old_live = 'const liveModels = ["gemini-3.8-live", "gemini-3.1-flash-live-preview"];'
        new_live = 'const liveModels = ["gemini-3.8-live", "gemini-3.8-live-extended-thinking"];'
        if old_live in t:
            t = t.replace(old_live, new_live)
            n += 1
            print("OK liveModels")
        elif "gemini-3.8-live-extended-thinking" not in t:
            import re
            t2, c = re.subn(
                r'const liveModels = \[[^\]]+\];',
                new_live,
                t,
                count=1,
            )
            if c:
                t = t2
                n += 1
                print("OK liveModels regex")

        server.write_text(t)

    app = Path("src/App.tsx")
    if app.exists():
        t = app.read_text()
        for old, new in [
            ('placeholder="Ask Emi about notes, formulas, past papers..."', 'placeholder="Ask about MSCE, notes, or formulas…"'),
            ("placeholder=\"Ask Emi about notes, formulas, past papers...\"", 'placeholder="Ask about MSCE, notes, or formulas…"'),
        ]:
            if old in t:
                t = t.replace(old, new)
                n += 1
                print("OK placeholder")
                break
        app.write_text(t)

    print("patches", n)

if __name__ == "__main__":
    main()
