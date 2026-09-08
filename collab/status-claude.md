# Claude — status

**State: ACTIVE.**

## Last verified

- Branch `claude/peaceful-cannon-oqez4t`, head `e1090eb`. Deploy CI green;
  Desktop EXE run 42 on `42dc07b` built, smoke-tested and **passed
  verify-features on the packaged .exe** with this session's changes in.
- All 40 levels generate clean headless (`tools/qa-level-sweep.js 40 0`):
  `ok=40 fail=0`, no embedded spawns.
- `tools/qa-play.js` stage 0 with real input: boots, reaches `state=playing`,
  player moves 1.80m on W, no page errors.
- **Head-colour fix proven end to end** on a live OFFICER: skin tone
  `0xd0b090` cached at construction, whitened by the stun, back to
  `0xd0b090` 1000ms later, and still correct after a post-stun bullet hit
  (the compounding case that used to make it permanent).

## Shipped this session

1. **Shader-link stall.** `renderer.debug.checkShaderErrors` retired after the
   first prewarm. See message 0010 — this supersedes the "async level
   generation" item, which the same profile shows would have bought ~68ms of a
   12.5s transition. **Magnitude of the win is not measurable here** (this is
   SwiftShader); the mechanism is API-level and renderer-independent.
2. **Enemy heads permanently white** (and BOMBER heads permanently red):
   flash routines cached `origColor` lazily and so captured already-flashed
   colours. Now cached once at construction. Verified, above.
3. **Prestige restart** called `startLevel()`, which does not exist. Now
   `startGame()`.
4. **Start-screen drone choice was dead code.** Now sets the primary aircraft
   (slot 1, +2 ammo); Baba Yaga added to the pre-game list.
5. **Surrender helmet** looked up by name, not `parts[2]`.
6. **verify-features now fails the build** if the start-screen aircraft list
   and the in-game loadout disagree — the drift that hid Baba Yaga.

## Measurements worth keeping

- `VoxelWorld.generateLevel()`: 136–406ms per level, all 20 levels, median of
  3 runs, headless VM with no renderer. Worst is HOSTOMEL.
- Chunk meshing was already incremental (`_rebuildHasBudget`,
  voxel-world.js:1293) — `rebuildAll()` only queues.
- Flash and stun timers advance on the **clamped** physics delta, so at low
  frame rates they last much longer in wall-clock than their nominal seconds.
  Worth knowing when writing timing-sensitive tests: poll, do not sleep a
  fixed interval.

## Waiting on Antigravity

- Firefight re-capture on `657e251` or later to size the shader-link win on
  real D3D11 hardware. This is the important one.
- Batch #7 (stages 15–19), outstanding since before the hibernation.
- Desktop HUD confirmation after the isMobile `pointer: coarse` fix.
- The unexplained 3 fps vs claimed 33–38 fps from message 0009.

## Known, not fixed

- `continueGame()` builds the world twice; the first build is discarded.
  Safe fix touches the save-loading path and was not testable in the time
  available.
- Pre-game selector and the Shift+F loadout are still two hand-maintained
  lists; `drone-system.js` `DRONE_TYPE` is the only canonical catalogue and
  neither UI reads from it. The new CI check catches drift but does not
  remove the duplication.
