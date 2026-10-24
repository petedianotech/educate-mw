#!/usr/bin/env python3
"""Strengthen Emi identity + Google Search grounding for text and Live modes."""
from pathlib import Path


def patch_gemini_live() -> None:
    p = Path("src/services/geminiLive.ts")
    if not p.exists():
        print("skip geminiLive")
        return
    t = p.read_text(encoding="utf-8")
    orig = t

    if "tools: [{ googleSearch: {} }]" not in t:
        needle = "systemInstruction: systemInstructionText,"
        if needle in t:
            t = t.replace(
                needle,
                "tools: [{ googleSearch: {} }],\n              systemInstruction: systemInstructionText,",
                1,
            )
            print("geminiLive: googleSearch tool added")

    # Always force HARD identity (models otherwise default to "I am Gemini by Google")
    start = t.find("const systemInstructionText =")
    if start > 0:
        end_m = t.find("\n      // Prefer the model", start)
        if end_m < 0:
            end_m = t.find("\n      const preferred", start)
        if end_m < 0:
            tick = t.find("`", start)
            end2 = t.find("}`", tick)
            if end2 > tick:
                end_m = end2 + 2
        if end_m and end_m > start:
            new_block = (
                "const systemInstructionText =\n"
                "        this.config.systemInstruction ||\n"
                "        `HARD IDENTITY RULES (never break):\n"
                "You are Emi — the voice study tutor in the Educate MW app for Malawian secondary students.\n"
                "You are NOT Gemini. You are NOT Google. You are NOT ChatGPT.\n"
                "If asked who you are or who made you, say ONLY:\n"
                '"I am Emi, your study tutor in the Educate MW app. I was built by Peter Damiano with the MSCE Preparation team for Malawian students."\n'
                "Never say you were developed by Google or that you are Gemini.\n"
                "\n"
                "EDUCATE MW: notes, past papers, quizzes, flashcards, dictionary, MSCE points calculator, certificates, community, video lessons, Emi text and live voice. Sites: educatemw.app / educatemw.vercel.app\n"
                "Builder: Peter Damiano (Mulanje, Malawi) — peterdamiano.vercel.app — with teachers S. Lifa and E. Muthipo.\n"
                "\n"
                "LIVE CALL: Warm Form 1–4 tutor. 1–3 short sentences. No markdown/emojis. Clear English; Chichewa only if the student uses it.\n"
                '${this.config.userLevel ? `Student level: ${this.config.userLevel}.` : ""}`\n'
            )
            t = t[:start] + new_block + t[end_m:]
            print("geminiLive: HARD identity forced")

    if t != orig:
        p.write_text(t, encoding="utf-8")
        print("wrote", p)
    else:
        print("geminiLive: no change")


def patch_server() -> None:
    p = Path("server.ts")
    if not p.exists():
        print("skip server")
        return
    t = p.read_text(encoding="utf-8")
    orig = t

    for old, new in [
        (
            'const TEXT_MODELS = ["gemini-3.5-flash-lite"] as const; // Search grounding supported; high free-tier limits',
            'const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"] as const; // Grounding (Google Search tool)',
        ),
        (
            'const TEXT_MODELS = ["gemini-3.5-flash-lite"] as const;',
            'const TEXT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"] as const;',
        ),
    ]:
        if old in t:
            t = t.replace(old, new, 1)
            print("server: TEXT_MODELS updated")
            break

    if "You are NOT Gemini" not in t and "You are Emi" in t:
        t = t.replace(
            "You are Emi",
            "You are Emi (NOT Gemini, NOT Google). You are Emi",
            1,
        )
        print("server: identity strengthened")

    if t != orig:
        p.write_text(t, encoding="utf-8")
        print("wrote", p)
    else:
        print("server: no change")


def main() -> None:
    patch_gemini_live()
    patch_server()


if __name__ == "__main__":
    main()
