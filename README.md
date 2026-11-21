# EducateMW

**Malawi secondary curriculum & AI study companion** for Form 1–4 students preparing for **JCE** and **MSCE** (MANEB).

**Live:** [educatemw.vercel.app](https://educatemw.vercel.app) · [educatemw.app](https://educatemw.app)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square)

---

## Overview

EducateMW helps Malawian secondary students access curriculum-aligned materials, past papers, and AI-supported study tools. The app works as a Progressive Web App and as an Android package, with offline-friendly content where possible.

---

## Features

- **Emi AI** — text tutor + live voice (Gemini), with search grounding where available
- **Study library** — notes, past papers, offline-friendly materials
- **MSCE points calculator** — aggregate score + university course matching
- **Learning tools** — quizzes, flashcards, dictionary, videos, community
- **Cross-platform** — PWA + Android APK (Capacitor)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind |
| Backend / AI | Express API on Vercel, Gemini |
| Data & Auth | Firebase Auth & Firestore |
| Mobile | Capacitor (package `mw.educate.app`) |
| CI | GitHub Actions (release APK) |

---

## Local development

```bash
npm install
# Configure .env.local with GEMINI_API_KEY and VITE_FIREBASE_*
npm run dev
```

### Production secrets

| Secret | Where | Purpose |
|--------|--------|---------|
| `GEMINI_API_KEY` | Vercel | Server-side Gemini chat & live tokens |
| `VITE_FIREBASE_*` | Vercel + GitHub Actions | Client Firebase |
| `ANDROID_KEYSTORE_*` | GitHub Actions | Signed release APK |

APK targets the live API at `https://educatemw.vercel.app`.

---

## Android APK

1. GitHub → **Actions** → **Build Release APK** → Run workflow  
2. Download artifact **EducateMW-release-apk**

Package ID: `mw.educate.app` · minSdk 23 (Android 6+)

---

## Credits

Built by **Peter Damiano** ([portfolio](https://peterdamiano.vercel.app)) with the MSCE preparation team (**S. Lifa**, **E. Muthipo**).

---

## License

Private / educational use unless otherwise stated by the owner.
