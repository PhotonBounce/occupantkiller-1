# OccupantKiller — Project Handoff

_Handoff for the next Claude Code instance. Written 2026-06-19. Everything below is current as of this session's end._

## 1. What this project is
**OccupantKiller** — a browser-based first-person voxel shooter (Three.js, no build step). Survive waves across 20 Ukraine-war-themed levels. Also packaged for Android (separate `apk-build/`) and now scaffolded as a Windows `.exe`.

- **Game repo:** `D:\occupantkiller\occupantkiller\`  ← the real project
- **⚠ Shell working directory is `D:\guidedmeditationapp`** (a *different* project). Grep/Glob/Read need an **explicit path** to the game repo, e.g. `Grep(path="D:\\occupantkiller\\occupantkiller", ...)`. The game dir is also a registered additional working dir.
- **Parallel copy:** `microsite/play/` is a near-duplicate of the root game. **PARITY RULE: every game-code edit must be made in BOTH** `D:\occupantkiller\occupantkiller\<file>` **and** `microsite/play/<file>` (e.g. `index.html`, `game-manager.js`).

## 2. Git / deploy
- Branch: **`game-hud-extras-kyiv`** → upstream `origin/game-hud-extras-kyiv` (`https://github.com/PhotonBounce/occupantkiller-1.git`, public). Main is `main`.
- **Everything is committed and pushed.** Latest tip `653172b`. No unpushed commits, clean working tree.
- **Pushing requires the USER** to complete the **Git Credential Manager GUI sign-in popup** (creds are NOT persisted between pushes). A plain `git push` hangs on that popup. `GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git push` fails fast with "could not read Username" (use only to confirm creds aren't cached). **Claude must NOT enter/store/use the GitHub token.**
- **The user deploys to production (FTP/WordPress) themselves.** Claude must NOT FTP to prod or handle the FTP password, wp-admin password, GitHub token, or ElevenLabs key.

## 3. What was done this session (all pushed)
1. **Performance fix** (`b7d2425`, `7bbb411`, `0fd8d2c`):
   - Removed the full-screen **circular scanner** (`tactical-ping.js` had a unit bug — `_lastPing` stored in seconds but compared as ms → fired every frame after 90s). It's referenced in **no** HTML now (gone in both modes).
   - **De-duped 62 duplicate `<script>` tags** (257→194) in both `index.html` copies.
   - **Performance Mode**: `window.__OK_PERF` flag (set in `index.html:56` from `localStorage.ok_perf_mode`). A conditional loader skips **27 cosmetic full-screen-canvas FX modules** when on. **Default is ON** (`'0'`=full-FX, `'1'`/unset=perf). Toggle button `#perf-mode-btn` on the start screen (persists + reloads). Canvas count: **60 (full-FX) → 38 (perf)**.
2. **`.exe` packaging scaffolded** (`8b2be6c`, `653172b`) — **build deferred until the user confirms the browser version feels smooth**:
   - `electron-main.js` (forks `server.js` via `ELECTRON_RUN_AS_NODE` on a free port → `/healthz` → Chromium window; GPU flags; kills server on quit).
   - `package.json`: `main`→`electron-main.js`; scripts `electron:dev/pack/build`; electron + electron-builder devDeps; NSIS `build` config → output `D:\occupantkiller\dist`, `asar:false`, files whitelist (no node_modules — `server.js` uses only Node built-ins).
   - `app-icon.ico` (multi-res, from the 1024px Android icon); `ELECTRON-BUILD.md` (steps + C-drive-protecting cache redirects).
   - **To build:** `npm install && npm run electron:build` → `D:\occupantkiller\dist\OccupantKiller Setup 1.0.0.exe`. Boot path already validated with plain Node (PASS).
3. **Mega-QA screenshot pass** — **10,282 shots** (256/level × 20 levels × 2 modes) in **`D:\occupantkiller\level-screenshots\`** (`perf\` + `fullfx\`, each 20 level folders with `000–255.jpg` + `_contact.jpg` + `QA.json`; plus `QA-SUMMARY.md` and `_ALL_LEVELS_perf/fullfx.jpg`). **Verdict: 40/40 PASS, 0 FAIL, 0 JS errors, 0 blank frames.** Game is clean.

## 4. Active loop + in-flight work (NOT inherited by a new session)
- A `/loop` is running: **"keep qa and fix issues and improve levels till i tell u to stop"** (dynamic self-paced). Its `ScheduleWakeup` + a background watcher live in THIS session only — **the new instance should re-establish the loop** (`/loop keep qa and fix issues and improve levels...`) if the user wants it continued.
- The 7-level QA re-capture (bot-cleared + drone levels) **finished** (RECAP_DONE) → all PASS.
- **Next planned QA angle:** a **survival/balance pass in NON-god mode** — let the bot play normally per level, measure survival time / wave reached / death cause, flag levels that are too brutal or trivially easy (visual QA found zero defects, so balance is the next place real improvements come from).
- **`.exe` build** is queued, gated on the user saying the browser version feels **"smooth"** (vs "still laggy" → more perf work: ~115 remaining rAF HUD loops, draw-call batching, light count).

## 5. QA harness (how to capture/verify — reuse, don't reinvent)
- Run the game server: `PORT=3020 node server.js` (env `PORT`, `/healthz` endpoint, serves from `__dirname`; blocks `tools/`, `server.js`, `node_modules`).
- Headless Puppeteer with **software WebGL**: `--use-gl=angle --use-angle=swiftshader` (renders correctly but ~1-3 FPS — represents layout/visuals, NOT real-GPU perf).
- Temp QA scripts are `tools/_*.js` (local/gitignored). Key one: **`tools/_megaqa.js`** (capture + per-level QA judgment + montages; supports `node _megaqa.js <url> [perf|fullfx] [comma,levels]`; resumable). Re-judge existing results without re-capture: `tools/_rejudge.js`.
- **In-page hooks** (verified):
  - `GameManager.getState() / getPlayer() / getCamera() / forceStartGame()` (player accessor is `GameManager.getPlayer()`, NOT `window.player`).
  - Start a QA run: set `window.__QA_MODE=true`, `window.__QA_START_STAGE=<0-based idx>`, `localStorage.ok_has_played='1'`, `localStorage.ok_perf_mode='0'|'1'`; then `forceStartGame()`; toggle god via `GameManager.toggleGodMode()` (check `isGodMode()`).
  - Game enters DEAD only when `player.hp<=0` (one place, game-manager.js). Stage state set via `__QA_START_STAGE` clamped to `[0,19]`.
  - Camera pan (for varied shots): `CameraSystem.setYaw(rad)` / `CameraSystem.handleMouseMove(dx,0)` (camera-system.js).
  - **Overlays to dismiss for clean shots** (hide each frame right before screenshot): `#mission-briefing-overlay`, `#aa-overlay` (after-action), `#overlay-stageclear`, `#overlay-win`, plus any large fixed/absolute panel whose text matches `BRIEFING|AFTER-ACTION|PRESS ANY KEY|AUTO-DEPLOY|WAVE…COMPLETE|STAGE CLEAR|VICTORY`. **Dismiss must be the LAST action before the screenshot** (these cards pop up on timers).
  - Objective levels (no soldier waves; don't hold `W` or it flies the drone/vehicle away): **#18 Refinery FPV Drone, #19 Treeline (Bradley)** (0-based idx 17, 18).

## 6. Critical rules / gotchas
- **Screenshots & QA output → D: drive only.** C: has ~13.8 GB free (low); D: has ~760 GB. Memory notes repeatedly warn: do NOT write screenshots to C:.
- **Parity** (§1) and **credentials** (§2) above.
- App is the *browser game* here (web work = ONLY the OccupantKiller microsite + the homepage `index.php`; don't touch other microsites — see memory `photon-bounce-homepage-scope`).
- Mobile/Android perf has its own context (memory `mobile-perf-architecture`): `__OK_LOWSPEC` quality tier, push APK to phone `R9TW40J7W1E` after builds.

## 7. The 20 levels (index = `__QA_START_STAGE`; id = index+1)
0 Hostomel Airport · 1 Avdiivka Sector · 2 Bakhmut Ruins · 3 Kherson Crossing · 4 Mariupol Steelworks · 5 Crimea Bridge · 6 Chornobyl Zone · 7 Outer Moscow · 8 Sevastopol Naval Base · 9 Donbas Final Push · 10 Belgorod Offensive · 11 Kremlin Showdown · 12 Battle of Kyiv · 13 Snake Island Defense · 14 Saky Airbase Strike · 15 Vuhledar Tank Graveyard · 16 Antonov Bridge Strike · 17 **Refinery Strike — FPV Drone** (objective) · 18 **Treeline Assault** (Bradley) · 19 Siege of Moscow (Kremlin boss: bald zombie president, dark-purple suit + red tie).

## 8. Pointers
- Persistent memory index: `C:\Users\fucktrumpandrednecks\.claude\projects\D--guidedmeditationapp\memory\MEMORY.md` (relevant: `photon-bounce-homepage-scope`, `occupantkiller-qa-megasweep-ops`, `git-push-credentials`, `mobile-perf-architecture`, `conversation-engine-architecture`).
- Plan file (last task): `C:\Users\fucktrumpandrednecks\.claude\plans\adaptive-inventing-flurry.md`.
- This doc: `D:\occupantkiller\occupantkiller\HANDOFF.md` (local; not committed — commit if you want it in the repo).
