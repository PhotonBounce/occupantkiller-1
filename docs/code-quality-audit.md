# Code Quality Audit — `game-manager.js`

**File:** `D:\occupantkiller\occupantkiller\game-manager.js`  
**Lines:** 9525  
**Issues Found:** 29 (top 15 shown)  

| # | Severity | Category | Line | Issue |
|---|----------|----------|------|-------|
| 1 | High | Long Function | 1280 | Function 'init' is 396 lines (>200). Consider splitting into smaller functions. |
| 2 | High | Long Function | 1688 | Function 'setupInput' is 825 lines (>200). Consider splitting into smaller functions. |
| 3 | High | Long Function | 3094 | Function 'startGame' is 224 lines (>200). Consider splitting into smaller functions. |
| 4 | High | Long Function | 3683 | Function 'beginWave' is 923 lines (>200). Consider splitting into smaller functions. |
| 5 | High | Long Function | 4607 | Function 'onWaveComplete' is 368 lines (>200). Consider splitting into smaller functions. |
| 6 | High | Long Function | 4977 | Function 'updatePlayer' is 331 lines (>200). Consider splitting into smaller functions. |
| 7 | High | Long Function | 5494 | Function 'onEnemyHit' is 485 lines (>200). Consider splitting into smaller functions. |
| 8 | High | Long Function | 6005 | Function 'onPlayerHit' is 274 lines (>200). Consider splitting into smaller functions. |
| 9 | High | Long Function | 6370 | Function 'update' is 1613 lines (>200). Consider splitting into smaller functions. |
| 10 | High | Long Function | 8132 | Function 'setupMobileControls' is 358 lines (>200). Consider splitting into smaller functions. |
| 11 | High | Performance | 216 | `_updateThreatBehind` allocates `new THREE.Vector3()` every frame for `getWorldDirection()`. Use a cached `_gmTmp` vector instead. |
| 12 | High | Performance | 170 | `_spawnFootstepPuff` creates `new THREE.MeshBasicMaterial()` on every footstep. Use a shared material with `opacity`/`color` tweaks, or a pre-allocated material pool. |
| 13 | High | Performance | 6512 | `new THREE.Vector3()` allocated 20 times inside the main game loop / updateCombat (lines 6512-7855). Use pre-allocated temp vectors. |
| 14 | High | Performance | 7037 | `new THREE.Vector3()` allocated inside `update()` (dust particle position). Use a pre-allocated temp vector. |
| 15 | High | Long Function | 4977 | `updatePlayer` is 331 lines. Contains movement, physics, camera, swimming, mantling, and vehicle logic. Split into sub-functions. |

## Summary of Top 5 Concerns

1. **Massive Functions (`beginWave` ~923 lines, `setupInput` ~825 lines):** These are impossible to unit-test and extremely brittle. `beginWave` should use a data-driven spawn table per stage. `setupInput` should be split by input type.

2. **Per-Frame Object Allocation (`new THREE.Vector3` in `updateThreatBehind`, `update` loop):** Creating Vector3 objects inside the main loop and threat detection causes GC stutter. Use the pre-allocated `_gmTmp1–3` vectors instead.

3. **Per-Event Material Allocation (`_spawnFootstepPuff`):** Every footstep spawns a new `MeshBasicMaterial`. With 24 puffs max, this creates unnecessary GPU memory pressure. Pool materials and vary opacity.

4. **Duplicate Spawn Logic:** `triggerBattlefieldEvent` and `beginWave` repeat the same `Math.cos/sin * radius` spawn pattern dozens of times. Extract `spawnCircle(count, type, radius)` and `spawnLine(count, type, spacing)` helpers.

5. **Dead Code / Unused Variables:** `_waveStartTimer`, `_musicIntTimer` are declared but never wired. They add cognitive load and suggest unfinished features that should be removed or implemented.

## Recommendations

- **Refactor `beginWave`**: Replace the giant switch/if ladder with a `STAGE_SPAWN_CONFIGS` array of descriptors. Each descriptor lists enemy types, counts, and formations. A single loop reads the config and spawns.
- **Extract input handlers**: `setupInput` → `setupKeyboard()`, `setupMouse()`, `setupTouch()`, `setupGamepad()`. Each returns a cleanup function.
- **Use object pools**: For footstep puffs, loot particles, and temporary vectors, create pools at init time rather than allocating per frame.
- **Magic number constants**: Define `const FPS_SEVERE = 24`, `const FPS_HIGH = 52`, `const BLEED_DPS = 3`, etc. in a `CONFIG` block at the top.