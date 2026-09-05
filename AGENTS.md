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
  test caught it for the project's entire history. (`enemies.js` still reads a
  nonexistent `.visionRange` — masked by `|| 1.0`, open item.)

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
