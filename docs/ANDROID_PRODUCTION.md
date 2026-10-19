# Educate MW — Android production setup

## Package
- **Application ID:** `mw.educate.app`
- **App name:** Educate MW

## Release signing (already in GitHub Secrets)
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS` = `educatemw`
- `ANDROID_KEY_PASSWORD`

### Fingerprints of the release keystore
- **SHA-1:** `97:6C:0E:FA:4A:D6:21:30:D1:CD:7E:A2:2A:33:56:11:3B:4C:6A:CA`
- **SHA-256:** `D4:2D:26:25:FF:7D:FF:E5:5D:D1:3D:82:EE:B3:C3:21:31:7E:5E:9A:5E:73:9A:32:B5:C6:62:14:E3:B9:BE:BA`

## Google Sign-In on APK (required)
1. Firebase Console → Project settings → Your apps → **Add Android app**
   - Package name: `mw.educate.app`
   - SHA-1: paste the SHA-1 above
   - Download `google-services.json` (optional if using JS SDK only)
2. Firebase → Authentication → Sign-in method → **Google** enabled
3. Google Cloud Console → APIs & Services → Credentials
   - Ensure a **Web client** OAuth 2.0 client exists (used by the app)
   - Create an **Android** OAuth client: package `mw.educate.app` + same SHA-1
4. Copy the **Web client ID** (`….apps.googleusercontent.com`)
5. GitHub Secret + Vercel env: `VITE_GOOGLE_WEB_CLIENT_ID` = that Web client ID

## Build downloadable release APK
1. Repo → **Actions** → **Build Release APK** → **Run workflow**
2. Wait until green
3. Artifacts → **EducateMW-release-apk** → download `EducateMW-release.apk`

## PDF reader (APK)
Android does not allow apps to silently list every PDF on the phone.
The app uses the **system document picker** (user chooses PDFs from Downloads/Documents/Drive).
Library materials that are PDFs open in the device PDF viewer via File Opener.

## Optional Vite secrets for full feature parity in CI builds
`VITE_FIREBASE_*`, `VITE_CLOUDINARY_*`, `VITE_GOOGLE_WEB_CLIENT_ID`
