# Occupant Killer — Android app

A full-screen WebView wrapper around the deployed browser game
(`https://photonbounce.github.io/occupantkiller-1/`). Installs like a native
app: launcher icon, immersive full-screen, keeps the screen awake, hardware
Back navigates in-game history. Needs an internet connection (it loads the live
build, so it is always up to date and tiny).

## Get the APK (no local Android SDK needed)

The APK is built in GitHub Actions, which has the Android SDK and full network
access (the dev sandbox cannot reach `dl.google.com`).

1. GitHub → **Actions** tab → **Build Android APK** → **Run workflow**.
2. When it finishes, open the run → **Artifacts** → download `occupant-killer-apk`.
3. Unzip → `app-release.apk`. Copy to your phone, tap it, allow
   "install from unknown sources", install.

The workflow also runs automatically on any push under `android/`.

## Build locally (if you have the SDK)

```bash
cd android
keytool -genkeypair -keystore ok-release.keystore -alias occupant \
  -keyalg RSA -keysize 2048 -validity 10000 -storepass occupant -keypass occupant \
  -dname "CN=Occupant Killer"
OK_KEYSTORE=ok-release.keystore OK_KEYSTORE_PASS=occupant \
  OK_KEY_ALIAS=occupant OK_KEY_PASS=occupant \
  gradle assembleRelease
# → app/build/outputs/apk/release/app-release.apk
```

## Notes

- Signed with a self-signed keystore for sideloading — **not** a Play Store
  upload key. Regenerate a real key before any store submission.
- `minSdk 24` (Android 7.0+), `targetSdk 34`. Landscape, WebGL required.
- To ship an **offline** build instead, the game files under the repo root would
  be copied into `app/src/main/assets/` and `GAME_URL` pointed at
  `file:///android_asset/index.html` — heavier, and needs a pass over any
  `fetch()`/backend calls for the `file://` origin.
