# Dev → Live merge plan (pending user go-ahead: "deploy everything")

## Trees
- **Live** (`gh-pages`, tip `df3b42c`): curated ~179-script build, 20 levels, newer UI
  (drone-ammo HUD, inventory, start menu, mobile), LOD/culling perf layer.
- **Dev** (`claude/peaceful-cannon-oqez4t`, PR #3): full tree — bundled loading (90 tags,
  ~3s core-ready), 128 unique levels (dup-stage + endgame fixes), QA'd enemies/weapons/
  drones/vehicles/missions, 6 QA gate tools.

## Compatibility recon (2026-07-09)
- Live `game-manager` calls `VoxelWorld.*`: init, generateLevel, get/setBlock, isSolid,
  raycastBlock, getTerrainHeight, getTopSolidY, getBuildings, getRoadWaypoints,
  updateDirtyChunks, **cullChunks**.
- Dev `voxel-world` satisfies all EXCEPT `cullChunks` (and `getLODScale`) — the live
  tree's LOD/frustum-culling additions.

## Strategy (live-first, minimal blast radius)
1. Base = live tree (preserves their UI + packaging).
2. Port `cullChunks` + `getLODScale` implementations from live `voxel-world.js` into dev
   `voxel-world.js` (or land them on dev first so both trees share one file).
3. Replace live `voxel-world.js` with the dev version (128 levels + all fixes) once (2) done.
4. Replace live `enemies.js` with dev version ONLY after diffing their HUD hooks
   (their build predates the typeName elite-gear blocks; dev version is QA'd but must not
   break their drone-ammo HUD integration).
5. Leave live `index.html`/HUD/menu untouched (their newer UI wins).
6. Do NOT port the bundling to live — live is already a curated 179-tag build.
7. Gate before push: run tools/qa-level-sweep.js + qa-combat-sweep.js against the merged
   worktree (tools read ./voxel-world.js etc. — run from the worktree root with
   three.min.js present).
8. Bump cache-busters on every replaced file; fast-forward push to gh-pages.

## Already deployed to live
`df3b42c` — grenade crash fix, overhang-safe spawn fallback, deterministic proc themes,
drone/vehicle spawn hardening.

## Update (post world-engine staging)
- World-engine merge DEPLOYED to live 2026-07-09 (`df3b42c..41e69d8` on gh-pages) —
  20/20 live stages gated clean before push; patch retained for reference.
- Enemies API recon: live game-manager calls (clear, damage, damageInRadius, findByMesh,
  getAliveCount, getAll, getAssaultGroups, getEnemyMeshes, setPlayerStealth, spawnSingle,
  startWave, tagAttacker, update) are ALL exported by dev enemies.js — swap is API-safe
  whenever we choose to unify combat too.

## Live-tree QA sweep (2026-07-10, opus loop)
Ran node harness sweeps against the LIVE gh-pages tree (what players actually run):
- **CRITICAL FOUND+FIXED**: live `enemies.js` `buildMesh` threw `legL is not defined`
  (unguarded, at every `spawnOne`) → **no enemy ever spawned**. Swapped in the QA'd
  enemies.js; verified spawn+fight clean on live stages 0/2/7/13. Deployed `578e017`.
- Levels 0-59: 60/60 generate clean.
- Weapons: 117/117 build+switch+fire clean (loaded via weapons-data.js).
- DroneSystem / VehicleSystem / UkrainianTactics: init+spawn+800 ticks clean.
Live deploy chain now: df3b42c → 41e69d8 (world engine) → 578568e (LOD/lag) →
3604ffd (audit fixes) → 578e017 (enemy spawn crash).
