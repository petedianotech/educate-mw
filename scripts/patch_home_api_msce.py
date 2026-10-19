#!/usr/bin/env python3
"""Unify home icons to blue, wire apiUrl for Gemini, simplify MSCE calculator chrome."""
from pathlib import Path
import re

def main():
    n = 0
    app = Path("src/App.tsx")
    if app.exists():
        t = app.read_text()
        if 'from "./lib/api"' not in t and 'from \'./lib/api\'' not in t:
            # insert after firebase import block if possible
            idx = t.find('from "./native/pdfReader"')
            if idx > 0:
                end = t.find("\n", idx)
                t = t[: end + 1] + 'import { apiUrl } from "./lib/api";\n' + t[end + 1 :]
                n += 1
                print("OK api import")
            else:
                idx = t.find('from "./native/googleAuth"')
                if idx > 0:
                    end = t.find("\n", idx)
                    t = t[: end + 1] + 'import { apiUrl } from "./lib/api";\n' + t[end + 1 :]
                    n += 1

        for old, new in [
            ('fetch("/api/gemini/chat"', 'fetch(apiUrl("/api/gemini/chat")'),
            ("fetch('/api/gemini/chat'", "fetch(apiUrl('/api/gemini/chat')"),
            ('fetch("/api/gemini/quiz"', 'fetch(apiUrl("/api/gemini/quiz")'),
            ('fetch("/api/gemini/flashcards"', 'fetch(apiUrl("/api/gemini/flashcards")'),
            ('fetch("/api/gemini/dictionary"', 'fetch(apiUrl("/api/gemini/dictionary")'),
            ('fetch("/api/gemini/career"', 'fetch(apiUrl("/api/gemini/career")'),
            ('fetch("/api/gemini/voice-reply"', 'fetch(apiUrl("/api/gemini/voice-reply")'),
            ('fetch("/api/gemini/token"', 'fetch(apiUrl("/api/gemini/token")'),
        ]:
            if old in t:
                t = t.replace(old, new)
                n += 1
                print("OK", old[:40])

        # Unify FeatureCard colors to blue-600
        for color in ["bg-emerald-600", "bg-amber-600", "bg-indigo-600", "bg-purple-600", "bg-sky-600", "bg-green-600", "bg-orange-600", "bg-pink-600"]:
            if f'bgColor="{color}"' in t:
                t = t.replace(f'bgColor="{color}"', 'bgColor="bg-blue-600"')
                n += 1
                print("OK icon", color)

        app.write_text(t)

    # geminiLive service
    gl = Path("src/services/geminiLive.ts")
    if gl.exists():
        t = gl.read_text()
        if "apiUrl" not in t:
            if 'from "../lib/api"' not in t:
                t = 'import { apiUrl } from "../lib/api";\n' + t
            t = t.replace(
                "`/api/gemini/token?model=${encodeURIComponent(preferredModel)}`",
                "apiUrl(`/api/gemini/token?model=${encodeURIComponent(preferredModel)}`)",
            )
            t = t.replace(
                "'/api/gemini/token'",
                "apiUrl('/api/gemini/token')",
            )
            gl.write_text(t)
            n += 1
            print("OK geminiLive")

    # MSCE calculator visual simplify — blue system, less shouty headers
    msce = Path("src/components/MscePointsCalculatorView.tsx")
    if msce.exists():
        t = msce.read_text()
        replacements = [
            ("bg-indigo-600", "bg-blue-600"),
            ("bg-indigo-700", "bg-blue-700"),
            ("shadow-indigo-600/20", "shadow-blue-600/15"),
            ("text-indigo-400", "text-blue-500"),
            ("text-indigo-600", "text-blue-600"),
            ("border-indigo-500/30", "border-blue-500/25"),
            ("bg-indigo-500/15", "bg-blue-500/10"),
            ("hover:bg-indigo-700", "hover:bg-blue-700"),
            ("uppercase tracking-tight", "tracking-tight"),
            ("uppercase tracking-widest", "tracking-wide"),
            ("font-black", "font-bold"),
            ("MSCE POINTS\n              CALCULATOR", "MSCE points calculator"),
            ("MSCE POINTS CALCULATOR", "MSCE points calculator"),
            ("AGGREGATE & UNIVERSITY\n              MATCH", "Aggregate & university match"),
            ("SELECT YOUR SUBJECT GRADES\n              BELOW", "Set your grades"),
            ("SELECT SUBJECT GRADES (8 SUBJECTS)", "Your subjects"),
            ("EXAMPLE PRESETS:", "Quick examples"),
            ("MALAWI UNIVERSITIES (25 COURSES)", "Universities"),
            ("MANDATORY FOR MSCE", "Required"),
            ("Tap grade to set", "Tap to set grade"),
        ]
        for a, b in replacements:
            if a in t:
                t = t.replace(a, b)
                n += 1
        # Soften giant POINTS box if present
        t = t.replace("text-4xl font-black", "text-3xl font-bold")
        t = t.replace("text-5xl font-black", "text-3xl font-bold")
        msce.write_text(t)
        print("OK msce polish")

    print("total", n)

if __name__ == "__main__":
    main()
