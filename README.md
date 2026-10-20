# Educate MW

**Malawi national secondary curriculum & AI study companion** for Form 1–4 students preparing for **JCE** and **MSCE** (MANEB).

**Live app:** [https://educatemw.vercel.app](https://educatemw.vercel.app) · **Canonical:** [https://educatemw.app](https://educatemw.app)

## Features

- **Emi AI** — text tutor + live voice (Gemini), Google Search grounding where available
- **Study library** — notes, past papers, offline-friendly materials
- **MSCE points calculator** — aggregate + university course match
- **Quizzes, flashcards, dictionary, videos, community**
- **PWA** + **Android APK** (Capacitor, package `mw.educate.app`)

## Stack

- React 19 + TypeScript + Vite + Tailwind
- Firebase Auth & Firestore
- Express API (`server.ts`) on Vercel for Gemini
- Capacitor for Android release builds via GitHub Actions

## Local development

```bash
npm install
# .env.local — GEMINI_API_KEY and VITE_FIREBASE_*
npm run dev
```

## Production secrets

| Secret | Where | Purpose |
|--------|--------|---------|
| `GEMINI_API_KEY` | **Vercel** (required for Emi) | Server-side Gemini chat & live tokens |
| `VITE_FIREBASE_*` | Vercel + GitHub Actions | Client Firebase |
| `ANDROID_KEYSTORE_*` | GitHub Actions | Signed release APK |

APK calls the live API at `https://educatemw.vercel.app` (`VITE_API_BASE_URL`).

## Android APK

1. GitHub → **Actions** → **Build Release APK** → Run workflow
2. Download artifact **EducateMW-release-apk**

Package ID: `mw.educate.app` · minSdk 23 (Android 6+)

## Credits

Built by **Peter Damiano** ([portfolio](https://peterdamiano.vercel.app)) with the MSCE preparation team (**S. Lifa**, **E. Muthipo**).

## License

Private / educational use unless otherwise stated by the owner.
