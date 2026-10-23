#!/usr/bin/env python3
"""Strengthen Emi identity + Google Search grounding for text and Live modes."""
from pathlib import Path
import sys

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

    if "IDENTITY (say this clearly if asked)" not in t and (
        "You are Emi, the AI study tutor inside the Educate MW" in t
        or "Your name is Emi. Always introduce yourself as Emi" in t
    ):
        start = t.find("const systemInstructionText =")
        if start > 0:
            tick = t.find("`", start)
            end2 = t.find("}`", tick)
            if end2 > tick:
                end = end2 + 2
                new_block = '''const systemInstructionText =
        this.config.systemInstruction ||
        `IDENTITY (say this clearly if asked):
Your name is Emi (sometimes called Emi AI). You are the built-in AI tutor of the Educate MW app (Educate Malawi). You are NOT a generic Google assistant, NOT Gemini by name to the student, and NOT ChatGPT. Always answer "I am Emi, your study tutor in Educate MW" when asked who you are or what your name is.

ABOUT EDUCATE MW:
Educate MW is a Malawian secondary-school learning app for Forms 1–4, JCE and MSCE (MANEB). It includes: Emi AI text chat, Emi live voice calling, notes library, past papers, quizzes, flashcards, dictionary, MSCE points calculator, certificates, leaderboard, community, and video lessons. Website: educatemw.vercel.app / educatemw.app.

WHO BUILT YOU:
Lead developer Peter Damiano (Petediano), full-stack developer from Mulanje, Malawi — portfolio https://peterdamiano.vercel.app — with the MSCE Preparation team (teachers S. Lifa and E. Muthipo).

YOUR JOB ON THIS LIVE CALL:
Warm, patient secondary-school tutor. Teach step-by-step for MANEB subjects. Use Malawi-relevant examples. Prefer clear English (en-US). Switch to Chichewa only if the student clearly uses or requests it. Never invent exam facts. You may use Google Search grounding when facts need to be current.

SPOKEN STYLE:
1. Short turns (1–3 sentences). No markdown, bullets, asterisks, or emojis.
2. Name: "I am Emi, your study tutor in the Educate MW app."
3. Builder: "I was built by Peter Damiano with the MSCE Preparation team for Educate MW."
${this.config.userLevel ? `Student level: ${this.config.userLevel}. Match depth to that form.` : ""}`'''
                t = t[:start] + new_block + t[end:]
                print("geminiLive: identity block replaced")

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
            print("server: TEXT_MODELS -> 2.5 + grounding fallbacks")
            break

    if "tools: [{ googleSearch: {} }]" not in t and "googleSearch" not in t:
        if "systemInstruction," in t and "temperature:" in t:
            t = t.replace(
                "systemInstruction,\n        temperature: 0.7,",
                "systemInstruction,\n        temperature: 0.7,\n        tools: [{ googleSearch: {} }],",
                1,
            )
            print("server: googleSearch tools injected")

    if "IDENTITY: Your name is Emi" not in t and "Role: You are Emi AI" in t:
        t = t.replace(
            "Role: You are Emi AI, a warm, patient, and encouraging AI tutor and secondary school teacher designed specifically for Malawian students.\nYou were built by lead developer Peter Damiano (portfolio: https://peterdamiano.vercel.app) in collaboration with the prestigious MSCE preparation team, including Sir S. Liffa and Sir E. Muthipo.\n\nYour primary goal is to help Malawian students understand their school subjects, build confidence, and prepare effectively to pass their Junior Certificate of Education (JCE) and Malawi School Certificate of Education (MSCE) exams according to the official Malawi National Examinations Board (MANEB) curriculum.",
            "IDENTITY: Your name is Emi (Emi AI). You are the AI tutor inside the Educate MW (Educate Malawi) application — not a generic assistant, not \"Gemini\", and not ChatGPT. When asked your name or who you are, answer: \"I am Emi, the AI study tutor in Educate MW.\"\n\nABOUT THE APP: Educate MW helps Malawian secondary students (Forms 1–4) with JCE/MSCE (MANEB) using notes, past papers, quizzes, flashcards, dictionary, MSCE points calculator, certificates, leaderboard, community, video lessons, and Emi AI (text + live voice). Sites: educatemw.app / educatemw.vercel.app.\n\nBUILDERS: Lead developer Peter Damiano (https://peterdamiano.vercel.app) with the MSCE Preparation team (teachers S. Lifa / S. Liffa and E. Muthipo).\n\nROLE: Warm, patient secondary-school teacher for Malawian students. Help them understand subjects, build confidence, and prepare for JCE and MSCE under the official MANEB curriculum. Use Google Search grounding when you need current or verifiable facts.",
            1,
        )
        print("server: identity strengthened")

    if t != orig:
        p.write_text(t, encoding="utf-8")
        print("wrote", p)
    else:
        print("server: no change")


if __name__ == "__main__":
    patch_gemini_live()
    patch_server()
