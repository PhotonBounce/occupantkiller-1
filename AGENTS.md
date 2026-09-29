# AGENTS.md — onboarding for AI agents working on Occupant Killer

Two agents work on this repo:

- **Claude** (Claude Code, cloud session) — fixes, CI/desktop builds, verification.
  Works on branch `claude/peaceful-cannon-oqez4t` (draft PR #85).
- **Antigravity** — browser-based game testing and QA on real hardware.

Read `AGENT-RULES.md` first. It is binding for every agent in this repo: never
claim something works without direct evidence from your own session, label
every statement FACT / ASSUMPTION / CANNOT VERIFY. It was written in blood.

How agents talk to each other: see `collab/PROTOCOL.md`. Short version — write
a file under `collab/messages/<your-name>/`, commit, push. Pushes to the branch
wake Claude automatically (it is subscribed to PR #85 activity).

## What this is

A Three.js (r137) voxel FPS set in Ukraine. 100% static frontend — no backend
required (`api-client.js` degrades gracefully). Entry point `index.html`, which
loads a mix of root-level scripts (`game-manager.js`, `drone-system.js`,
`npc-system.js`, `weather-system.js`, `hud.js`, ...) and generated bundles
(`bundles/bundle-0NN.js`) containing the several hundred smaller modules.

~20 stages defined in `STAGES` in `game-manager.js`. Stage 18 is a drone-only
mission (`RefineryStrike`), stage 19 a Bradley tank duel. `window.__chosenStartStage`
is a stage INDEX, and `index.html` resets it to 0 in a load-time IIFE — set it
after load, not before.

## The one gotcha that will waste your day

**`bundles/*.js` are GENERATED.** Never edit them by hand. After editing any
root module that is bundled, run:

    node tools/build-bundles.js

Each bundle lists its member files in its own markers. If you edit a root file
and your change doesn't show up in the game, this is why. Conversely, editing a
bundle directly will be silently reverted by the next rebuild.

Also generated / do not touch:
- `microsite/play/` — stale checked-in copy, excluded from deploys; the deploy
  workflow regenerates that path from the live game. Never edit it.

## Running and testing the game

Serve the repo root over HTTP (any static server) and open `index.html`.

- `tools/qa-play.js` — plays the game with REAL input (keyboard/mouse via
  Playwright): boots, clicks QUICK START (a genuine user gesture, so pointer
  lock works), runs a movement sanity check, then a rotation of play actions
  with screenshots. `node tools/qa-play.js --stage 0 --secs 60 --shots 5`.
  This is the only harness that exercises the input path; the other 20
  `tools/qa-*.js` scripts and `desktop/*.js` probes call the game's modules
  directly and will not catch input bugs.
- **Audio gotcha:** do NOT launch the test browser with
  `--autoplay-policy=no-user-gesture-required` in an environment without a
  sound device — audio init during boot wedges the page (300s stall, renderer
  crash). Use `--mute-audio`.
- F10 in-game toggles a diagnostic overlay: fps, draw calls, triangles, live
  shader program count, quality tier, pixel ratio, PBR downgrade count, GPU
  string. Same counts the CI probes read, so screenshots are comparable.

## Facts about the environments (hard-won; do not re-learn these)

- **Launch headless Chromium with `--use-gl=angle --use-angle=swiftshader`,
  never `--use-gl=swiftshader`.** With the raw GL passthrough (and
  `--ignore-gpu-blocklist`) the game page deadlocks while creating its WebGL
  context: the process hangs indefinitely and NO timeout fires — not
  Playwright's own 30s launch timeout, not an explicit deadline around the
  call. With ANGLE the identical page boots in 4.1s. This cost several CI jobs
  an hour each, silently, and three wrong diagnoses. Note a bare `about:blank`
  WebGL probe passes on BOTH flag sets, so only loading the real game exposes
  it — `tools/browser-smoke.js` (MODE=blank|server|game) is the bisect harness.
- **Boots wedge because the renderer runs out of memory, not because it hangs.**
  Watching total Chromium RSS through a boot in Claude's container: it climbs
  to **7.9 GB** during world build, the renderer is killed, and the page is
  left with the boot bar stuck below 100%. Playwright then reports either
  `Target crashed` or a timeout on whatever it was waiting for, which reads
  like a deadlock and is not one. Two of six stages in one Gameplay QA run
  lost all three attempts to this. Retry, keep the viewport small (qa-play
  uses 480x270 for exactly this reason), and do not run two harnesses at once
  in the same container. Under SwiftShader every texture and render target is
  host memory, so this number is not what a machine with a real GPU would
  use — but it is why CI is flaky, and it is worth measuring on real hardware
  before assuming players are fine.
- **Keys collide, and a collision can pause the game.** Bare `R` was bound to
  both RELOAD and the radio support radial; the radial calls
  `document.exitPointerLock()`, and the `pointerlockchange` handler
  (`game-manager.js`) treats any lock loss during play as the player opening a
  menu — `STATE.PAUSED` plus the inventory overlay. So reloading paused the
  game. `extras-panel.js` had taken bare `H` and `K` the same way, on top of
  the ballistic shield and the killstreak panel. Around 180 bolt-on modules
  register window-level keydown listeners, so assume nothing about a key being
  free. `tools/qa-keys.js` presses every key and fails if a non-menu key takes
  the screen; run it after touching any input code.
- **`Tab` could not close the inventory — two causes, both fixed; verify on
  real hardware.** First, `intelligence-briefing.js` also bound bare Tab and
  its `_openPanel()` calls `document.exitPointerLock()`, so one press opened
  the inventory AND the briefing and dropped the lock twice; the inventory
  ended up on screen with the game still in `playing`. Removing that binding
  (F1 still opens the briefing) was measured to fix it: `Tab open` went from
  `playing + flex` to `paused + flex`. Second, the Tab handler itself sat
  inside `if (gameState === PLAYING || BUILD_MODE)` while
  `toggleInventory()`'s close branch requires `PAUSED` — so once Tab paused
  the game, the block was skipped and the close path was unreachable by
  construction. Tab now sits beside the pause toggle, which was never gated
  for the same reason. Keep `Tab` in `tools/qa-keys.js`'s press list: the
  first sweep allowlisted it as a menu key and never pressed it, which is
  why the sweep could not catch this. Both causes are now confirmed in a
  running browser, not just from the code:

      baseline  : playing, overlay none, locked
      Tab open  : paused,  overlay flex, unlocked
      Tab close : playing, overlay none, locked
      Tab open2 : paused,  overlay flex, unlocked
      Tab close2: playing, overlay none, locked

  One more datum for the OOM above: that run only completed at a 320x180
  viewport, after three consecutive crashes at 480x270. One observation, not
  a law — but if a probe keeps losing its renderer, shrink the window before
  assuming the page is at fault.
- **The old note, kept for the history:**
  From a clean playing state, pressing Tab leaves the game in `playing` with
  `#inventory-overlay` at `display:flex` — the inventory painted over a live
  fight with the pointer unlocked — and no further Tab or Escape ever closes
  it. Measured, repeatedly, not inferred. `Tab` is bound in at least four
  loaded places: `game-manager.js` (`toggleInventory`), `weapon-skins.js:349`
  (skin selector), `objective-tracker.js:707` (objective board, only when
  `IntelligenceBriefing` is absent) and `intelligence-briefing.js:1240`, whose
  `_openPanel()` also calls `document.exitPointerLock()`. `J` (shop) lands in
  the same state. What has NOT been established is which path flips the state
  back to `playing` while leaving the overlay up — a MutationObserver on the
  overlay, a wrapped `requestPointerLock` and a `console.log` on all 13
  `gameState = STATE.PLAYING` sites all lost their run to the renderer OOM
  above before the trace landed. Do not "fix" this by hiding the overlay
  whenever the state is `playing`: that was tried, and A/B'd against the same
  probe without it — it makes Tab and J silently do nothing instead, which is
  worse. Fix the duplicate bindings, or make overlay visibility derive from
  the state instead of a dozen imperative writes.
- GitHub CI runners and Claude's cloud container render via **SwiftShader**
  (software rasterizer, confirmed from the renderer string). Frame-time numbers
  from those environments are meaningless — observed 34–62x spread on identical
  code. **Counts are trustworthy** (draw calls, triangles, shader programs,
  quality tier); **timings are not**. Real-hardware measurements are the only
  ones that count, which is exactly what a browser-testing agent on a real GPU
  can contribute.
- The game auto-calibrates quality across 6 tiers (ULTRA→POTATO); the emergency
  branch jumps straight to POTATO below 15 fps. This works (verified).
- Physics `delta` is clamped to 0.1s. Correct for movement, WRONG for anything
  the player perceives as wall-clock. This class of bug has been found and
  fixed four times (world clock, wildlife spawner, stray pets, weather cycle).
  If a schedule seems frozen on slow hardware, suspect this first.
- The whole player speed calculation multiplies through ~8 systems; one
  `undefined` multiplier = NaN = player silently frozen. There is now a guard,
  but treat any `getModifiers()`-style cross-module read with suspicion:
  the `speedMod` vs `speedMult` typo made WASD dead for every player and no
  test caught it for the project's entire history.
- **The `.visionRange` open item listed here was wrong; it is closed.**
  `enemies.js:2563` reads `WeatherSystem.getModifiers().visionRange`, and that
  property does exist: all 8 entries of `MODIFIER_CONFIG` in `weather-system.js`
  define it. `getModifiers()` returns `MODIFIER_CONFIG[_currentState]`, and every
  one of the five `_setState()` call sites passes a valid key (`forceWeather()`
  validates against `STATES` and warns; `_pickState()` falls back to `CLEAR`), so
  it cannot return undefined. Nothing to fix. Note the `|| 1.0` would NOT have
  masked the bug as described — if `getModifiers()` ever did return undefined,
  that line would throw, not fall back.
- A closer relative of the NaN class was real and is fixed: `npc-system.js`
  averaged `morale` over `npcs[]`, which also holds wildlife and stray pets that
  carry no morale, so the HUD printed `Morale: NaN%` on screen for whole missions.

## Desktop build

`.github/workflows/desktop-exe.yml` (manual dispatch) packages Electron,
smoke-tests the packaged .exe, runs feature verification and flies the stage-18
drone mission end to end, then overwrites the assets on the `desktop-exe`
release. If you change game code, the release .exe does not have it until
someone dispatches that workflow.

## Branch discipline

Both agents work on `claude/peaceful-cannon-oqez4t`. Always
`git pull --rebase origin claude/peaceful-cannon-oqez4t` before pushing.
Never force-push, never rewrite shared history. Small, single-topic commits
with commit messages that say WHY.
