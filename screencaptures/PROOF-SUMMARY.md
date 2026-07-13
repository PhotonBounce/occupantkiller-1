# Screen-Capture Proofs — Bug Audit Fixes

Captured headless via Puppeteer + SwiftShader WebGL (`tools/_proof-capture.js`),
booting each stage in QA mode (`__QA_MODE` / `forceStartGame`) in god mode.
The single console error in every run is a harmless external resource
(`ERR_CERT_AUTHORITY_INVALID`) unrelated to gameplay.

Full machine-readable results: [`report.json`](./report.json).

## 1. Russian terrain colors (red-purple, not Ukrainian blue)
The `GRASS` block color was globally Ukrainian blue (`0x005BBB`) on every map.
Now Russian levels (Moscow/Kremlin/Belgorod) override to deep rose-red.

| Level | Grass color (live, read from engine) | Meaning |
|-------|--------------------------------------|---------|
| Hostomel (Ukraine) | `0x005BBB` | Ukrainian blue ✓ |
| Moscow (Russia) | `0x8B1A4A` | Russian red ✓ |
| Belgorod (Russia) | `0x8B1A4A` | Russian red ✓ |
| Kremlin (Russia) | `0x8B1A4A` | Russian red ✓ |

- `terrain-HOSTOMEL-*.png` — blue water/terrain (Ukraine)
- `terrain-BELGOROD-*.png` — **red-purple grassland** (clearest contrast)
- `terrain-MOSCOW-*.png`, `terrain-KREMLIN-*.png` — red cityscape

## 2. Spawn no longer embedded in buildings
Root cause: game-manager hardcoded the player to world origin `(0,0,0)`, bypassing
the validated `spawnCandidates` + `isSpawnAreaClear` system. Now uses `getSpawnPoint()`.

| Level | Spawn | Embedded in wall? |
|-------|-------|-------------------|
| Hostomel | (10, 11, -22) | feet:false head:false ✓ |
| Moscow | (0, 11, 0) | feet:false head:false ✓ |
| Belgorod | (-12, 10, -12) | feet:false head:false ✓ |
| Kremlin | (-18, 8, 52) | feet:false head:false ✓ |

See `terrain-*-01-spawn.png` (ground-level spawn views).

## 3. Bradley IFV now spawns in its mission
Root cause: game-manager passed an undeclared `_controls` variable to `Bradley.init`
(and `Mortar.init`); the resulting ReferenceError was swallowed by try/catch, so init
never ran and `Bradley._scene` stayed null → `spawnAt()` returned null → no vehicle.

- `bradley-mission-01.png` — mission active, doctrine toast
- `bradley-mission-02-framed.png` — **the Bradley IFV** (3rd-person chase cam)
- report: `bradleyExists: true` at `{x:2, z:-4}`

## 4. Drone payload count in HUD
FPV attack drones carry 99 charges but the count was never shown.

- `drone-payload-hud-01.png`
- report: payload label `💥 FPV Charge [×99]`, display `💣 PAYLOAD READY ×99`

## 5. Enemy facing fix (no crookedness) + rendering
`rotation.y += Math.PI` after each `lookAt()` (model built +Z; lookAt aligns −Z).

- `enemy-facing-01.png` — enemies rendering and oriented (88 alive, no crash)

## 6. Weapons now render the correct, intact models
Root cause of "lots of weapons are not intact": M16A2 (#3) and RG-6 Inferno (#5)
were added to the WEAPONS list without mesh builders, so the positional
`meshBuilders` array was 2 short (117 for 119 weapons). Every weapon from index 3
onward rendered the model 1-2 slots off (M16→AK, AK→RPK, AKM→grenade sphere…) and
the final two (IRIS-T SLM, ATACMS) fell into the magenta `0xff00ff` placeholder.

Fixed by adding `NB.m16` / `NB.rg6` builders and realigning the array to 119/119.

- `weapons-gallery-1.png` … `weapons-gallery-4.png` — all 119 weapon view-models
- Before: #117 IRIS-T and #118 ATACMS were solid magenta boxes; AK-47 was a tiny
  green sphere; AXMC/PPSh were specks.
- After: IRIS-T = launch vehicle, ATACMS = missile, AK-47 = rifle, AXMC = sniper
  rifle, PPSh = SMG. (Diagnostic: 0 magenta placeholders; builder count 119/119.)

## 7. Kremlin landmarks
New `generateKremlinWall` / `generateSpasskayaTower` / `generateRedSquare` /
`generateKremlinInterior`. Level generates cleanly (13 buildings, no runtime error).

- `terrain-KREMLIN-*.png`
