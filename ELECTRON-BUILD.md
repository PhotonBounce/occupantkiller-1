# OccupantKiller — Windows `.exe` build

Wraps the browser game (unchanged) as a standalone Windows installer via
**Electron + electron-builder (NSIS)**. The game runs exactly as in the
browser: `electron-main.js` boots the existing `server.js` on a free local
port, waits for `/healthz`, then opens a Chromium window at it. localStorage
(saves + the ⚡ Performance Mode toggle), `/api/music`, and all relative
asset paths work identically.

## Why this isn't already built
The actual install + build is **deferred until the in-browser version is
confirmed smooth** — Electron renders with the *same* Chromium/WebGL engine,
so the performance fixes (scanner removed, FX gated, Performance Mode default
ON) are what make it run well; Electron just adds a dedicated process, GPU
flags, and double-click convenience. The scaffolding below is ready; only the
two `npm` commands remain.

## One-time: protect the C: drive
Electron's downloads (~200 MB) and electron-builder's cache default to
`%LOCALAPPDATA%` on **C:** (which is low on space). Redirect both to **D:**
before installing/building (PowerShell):

```powershell
$env:ELECTRON_CACHE         = "D:\occupantkiller\.ecache"
$env:ELECTRON_BUILDER_CACHE = "D:\occupantkiller\.ecache"
```

(For a permanent redirect use `setx ELECTRON_CACHE "D:\occupantkiller\.ecache"`
and `setx ELECTRON_BUILDER_CACHE "D:\occupantkiller\.ecache"`, then reopen the shell.)

## Build steps
```powershell
# from D:\occupantkiller\occupantkiller
npm install                 # pulls electron + electron-builder (devDeps)
npm run electron:dev        # OPTIONAL: launch unpackaged to sanity-check
npm run electron:build      # produces the NSIS installer
```

Output: **`D:\occupantkiller\dist\OccupantKiller Setup 1.0.0.exe`**
(installs with a Start-menu + desktop shortcut and an uninstaller; the install
directory is user-choosable).

## What ships in the bundle
- `electron-main.js`, `server.js`, root `*.js` / `*.html` / `*.css` / `*.json`,
  `favicon.ico`, and `gamemusic/` (+ `audio/` if present).
- **No `node_modules`** — `server.js` uses only Node built-ins, so the bundle
  stays lean (the tensorflow/puppeteer deps are QA tooling, excluded via the
  `build.files` whitelist in `package.json`).
- Non-runtime dirs (`tools/`, `microsite/`, `backend/`, `admin/`, `photon-*`,
  `reference/`, `supergame_extracted/`, …) are excluded.

## Notes / optional polish
- `asar` is **off** so `server.js` serves loose files reliably.
- **Installer/taskbar icon**: `app-icon.ico` (multi-res 256/128/64/48/32/16),
  generated from the game's own 1024×1024 Android app icon
  (`apk-build/resources/icon.png`). `build.win.icon` already points at it.
- Bump `version` in `package.json` to change the installer filename/version.
