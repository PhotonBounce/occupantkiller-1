# OccupantKiller — Quick Reference for New Developer

## The 5 Things You MUST Know

### 1. Boot Sequence (Load Order)
Scripts in `index.html` MUST load in this exact order. If you change it, things break.

1. `three.min.js` (Three.js global)
2. `page-prelude.js` (AudioSystem stub, error handlers)
3. `game-constants.js` (BLOCK palette, 0-127)
4. `voxel-world.js` (terrain generator, chunk system)
5. `city-buildings.js` (building functions + city blueprints)
6. `weapons-data.js` + `weapons.js` (weapon system)
7. All feature modules (150+ JS files)
8. `game-manager.js` (calls `init()` at bottom, inline)

### 2. How to Add a Building

In `city-buildings.js`, inside the `CityBuildings` IIFE:

```javascript
function myBuilding(ox, oz, gy, w, d, h, color) {
  // ox, oz = world position from blueprint
  // gy = ground Y (from terrain generator)
  // w, d, h = width, depth, height
  color = color || PAL.BRICK;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      for (var z = 0; z < d; z++) {
        setBlock(ox + x, gy + y, oz + z, color);
      }
    }
  }
}
```

Add to return object: `myBuilding: myBuilding` (the window export loop at the end handles this automatically for all keys).

Add to a city blueprint:
```javascript
CITIES.kyiv.push({
  type: 'myBuilding',
  params: [10, 8, 5, 65], // w, d, h, color
  x: 20, z: 15,
  note: 'My new building'
});
```

### 3. How to Run Locally

```bash
node server.js
# Open http://localhost:3000
```

For quick QA testing:
```
http://localhost:3000/?quickstart=1&stage=0&god=1&qa=1
```

### 4. How to Deploy

1. Bump cache-buster: find `v=20260702i` in `index.html`, increment letter (i→j→k)
2. Commit and push to `game-hud-extras-kyiv` branch
3. Force-push to `gh-pages`:
```bash
git push --force origin game-hud-extras-kyiv:gh-pages
```
4. Live at: https://photonbounce.github.io/occupantkiller-1/

### 5. Critical Globals

```javascript
window.THREE          // Three.js
window.BLOCK          // Block palette (0=AIR, 1=DIRT, 2=GRASS, 9=CONCRETE, 10=BRICK, etc.)
window.VoxelWorld     // Terrain generator
window.CityBuildings  // Building functions + CITIES blueprints
window.GameManager    // Main game loop (init, update, render)
window.HUD            // HUD controller
window.Weapons        // Weapon system
window.Enemies        // Enemy system
window.AudioSystem    // Audio engine (stub first, then real)
```

If any of these are missing during a module load, that module will crash. The `page-prelude.js` creates stubs for the most critical ones.

---

## File Sizes (Top 10)

| File | Lines | What it does |
|------|-------|-------------|
| `city-buildings.js` | 4991 | Building functions + 20 city blueprints |
| `voxel-world.js` | 11198 | Terrain generation, chunk system |
| `game-manager.js` | 10057 | Main game loop, boot, state machine |
| `audio-system.js` | 74597 | Audio engine (Web Audio + MP3) |
| `boot-manager.js` | 2397 | Boot preloader, progress bar, tips |
| `bradley.js` | 40843 | Bradley IFV vehicle system |
| `combat-manager.js` | 1210 | Combat calculations |
| `weapons.js` | 6830 | Weapon system |
| `enemies.js` | 4494 | Enemy AI |
| `hud.js` | 2052 | Core HUD |

Total JS: ~108,883 lines across 150+ files.

---

## Quick Commands

```bash
# Count all JS lines
wc -l *.js | sort -rn | head -20

# Find all building functions
grep "^  function " city-buildings.js

# List all cities
grep "CITIES\." city-buildings.js

# Find recent commits
git log --oneline -20

# Search for a function across all files
grep -r "functionName" *.js

# Find where a global is used
grep -r "GameManager\." *.js | head -20
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `CityBuildings.functionName is not a function` | Missing from CityBuildings return object | Add to return object AND window export loop |
| `GameManager is undefined` | Module loaded before game-manager.js | Check script load order in index.html |
| `AudioSystem.playX is not a function` | Module loaded before audio stub | Check page-prelude.js is first in head |
| `Cannot read property 'init' of undefined` | Three.js not loaded | Check three.min.js is first script |
| Boot timeout after 45s | Module hanging during init | Check console for which module failed |
| Black screen after boot | Canvas not rendering | Check if THREE.WebGLRenderer failed to init |
| Buildings not appearing | City blueprint type mismatch | Check `type` matches function name exactly |
| `setBlock is not defined` | Called outside city-buildings.js | Only available inside CityBuildings IIFE |

---

## Performance Tips

- Use `window.__OK_PERF` to disable heavy effects (particles, shadows, post-processing)
- Boot timeout is 45s — if hitting this, a module is hanging
- Enemy LOD: >30m = simple box, <30m = detailed geometry
- Chunk system: 32×32×64 blocks, loaded on-demand
- No object disposal system — memory may leak on long sessions

---

## Contact

- **GitHub:** https://github.com/PhotonBounce/occupantkiller-1
- **Live:** https://photonbounce.github.io/occupantkiller-1/
- **Branch:** `game-hud-extras-kyiv`
- **Deploy:** Force-push to `gh-pages`
