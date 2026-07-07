# OccupantKiller — Project Transfer Document

**For:** Claude AI / Next Developer
**Date:** July 2026
**Version:** 2.0.4-kyiv
**Live URL:** https://photonbounce.github.io/occupantkiller-1/
**Source:** https://github.com/PhotonBounce/occupantkiller-1 (branch: `game-hud-extras-kyiv`)
**Upstream:** https://github.com/lindapot-art/occupantkiller (branch: `main`)

---

## 1. What This Is

A browser-based voxel FPS built with raw Three.js (no game engine). 20 stages across real Ukrainian and Russian cities. Features: wave-based combat, squad AI, drones, vehicles (Bradley IFV, tank), building placement, loot, inventory, perks, marketplace, music jukebox, day/night cycle, weather, and ~60+ HUD features.

The game runs entirely in the browser at 60fps. No install. Uses a Node.js server for local development (serves static files with gzip).

---

## 2. Tech Stack

| Layer | Tech |
|-------|------|
| Renderer | Three.js (three.min.js, bundled, ~r150) |
| Physics | Custom (AABB collision, raycast, gravity) |
| Terrain | Procedural voxel chunks (32×32×64 blocks) |
| Audio | Custom audio-system.js (Web Audio API + MP3 jukebox) |
| State | LocalStorage (saves, inventory, wallet, settings) |
| Server | Node.js http server (server.js, gzip, MIME types) |
| Build | None — static files, cache-busted via `?v=TIMESTAMP` |
| Electron | Supported (electron-main.js, electron-builder) |
| QA | Puppeteer/Playwright headless browser testing |

---

## 3. File Structure

### Core (load order matters — see index.html)

| File | Lines | Purpose |
|------|-------|---------|
| `index.html` | 2652 | Entry point, all HUD DOM elements, script tags in load order |
| `three.min.js` | ~800k | Three.js bundle (must load FIRST) |
| `page-prelude.js` | ~200 | Boot preloader, AudioSystem stub, error handlers |
| `game-constants.js` | ~500 | BLOCK palette, color constants, stage data |
| `voxel-world.js` | 11198 | Terrain generation, chunk system, city blueprint loader |
| `city-buildings.js` | 4991 | 100+ building functions, CITIES object with 20 stage blueprints |
| `weapons-data.js` | ~1000 | Weapon definitions (moved from weapons.js) |
| `weapons.js` | 6830 | Weapon system, firing, reloading, switching, jamming |
| `enemies.js` | 4494 | Enemy spawning, AI pathfinding, behavior states |
| `enemy-types.js` | ~1000 | Enemy type definitions (soldier, tank, drone, etc.) |
| `game-manager.js` | 10057 | Main game loop, boot sequence, state machine, wave manager integration |
| `hud.js` | 2052 | Core HUD (health, ammo, minimap, crosshair) |
| `input-manager.js` | ~1500 | Keyboard, mouse, touch, gyro input handling |
| `player-state.js` | 957 | Player health, armor, inventory, resources |
| `combat-manager.js` | 1210 | Combat calculations, damage, hit detection |
| `audio-system.js` | 74597 | Full audio engine (Web Audio API + procedural sounds + MP3 jukebox) |
| `server.js` | ~200 | Node.js static file server with gzip |

### Feature Modules (~150+ JS files)

These are loaded after core. They add HUD features, effects, abilities, etc. Most export a single global object (e.g., `KillStreak`, `NightVision`). They register themselves with `GameManager` or `HUD` via callbacks.

Key ones:
- `drone-system.js` — FPV drone controls (3 types: kamikaze, surveillance, bomber)
- `bradley.js` — M2A2 Bradley IFV vehicle
- `vehicles.js` — Tank, truck, vehicle physics
- `building.js` — Build mode (place/remove blocks)
- `npc-system.js` — Squad AI teammates
- `missions.js` + `mission-manager.js` — Mission objectives
- `save-manager.js` — LocalStorage persistence
- `marketplace.js` — In-game shop (OKC currency)
- `blockchain.js` + `tokenomics.js` — MetaMask wallet integration (optional)
- `premium.js` — Premium time tiers
- `jukebox.js` — Music player (MP3 + procedural)
- `lottery.js` — Daily slot machine
- `perks.js` — Perk/ability system
- `skills.js` — Skill progression
- `time-system.js` — Day/night cycle, seasons
- `weather-system.js` — Rain, snow, embers, wind
- `fx-manager.js` — Particle effects, explosions
- `radar-minimap.js` — Tactical map overlay
- `screen-effects.js` — Damage vignette, flashbang, etc.

---

## 4. Boot Sequence (Critical — Read This)

The game has a multi-stage boot process controlled by `game-manager.js` and `boot-manager.js`:

1. **HTML parse** — index.html loads, DOM elements created, preloader visible
2. **page-prelude.js** — Creates `AudioSystem` stub (real audio loads later), error handlers
3. **three.min.js** — Three.js loads (global `THREE`)
4. **game-constants.js** — Defines `BLOCK` palette (0-127), colors
5. **voxel-world.js** — Defines `VoxelWorld` global (terrain generation, chunk system)
6. **city-buildings.js** — Defines `CityBuildings` global (building functions + city blueprints)
7. **weapons-data.js** — Weapon stats
8. **weapons.js** — Weapon logic (needs `WeaponData` from weapons-data.js)
9. **Remaining modules** — All feature modules loaded in order via `<script>` tags
10. **GameManager.init()** — Called from `game-manager.js` inline at bottom, triggers full boot

**Boot timeout is 45 seconds** (increased from 15s due to heavy modules). If boot fails, error overlay shows with retry button.

**Cache-buster:** All script tags have `?v=20260702i` (increment letter when deploying). Search/replace this string to bump.

---

## 5. City/Level System

### Stage Map (20 levels)

```javascript
// In game-constants.js or voxel-world.js
STAGE_MAP = {
  0: 'HOSTOMEL', 1: 'AVDIIVKA', 2: 'BAKHMUT', 3: 'KHERSON',
  4: 'MARIUPOL', 5: 'CRIMEA', 6: 'CHORNOBYL', 7: 'MOSCOW',
  8: 'SEVASTOPOL', 9: 'DONBAS', 10: 'BELGOROD', 11: 'KREMLIN',
  12: 'KYIV', 13: 'SNAKE', 14: 'SAKY', 15: 'VUHLEDAR',
  16: 'ANTONOV', 17: 'REFINERY', 18: 'TREELINE', 19: 'SIEGE'
};
```

### City Blueprints

Each city is an array of building objects in `city-buildings.js`:

```javascript
CITIES.kyiv = [
  { type: 'monument', params: ["obelisk", 9], x: 0, z: 0, note: 'Independence Monument' },
  { type: 'officeBuilding', params: [14, 10, 8, 9], x: -20, z: -5, note: 'Trade Unions Building' },
  // ... 50+ buildings per city
];
```

**Building function signature:** `functionName(ox, oz, gy, ...params)`
- `ox`, `oz` — world X/Z coordinates (passed from blueprint)
- `gy` — ground Y height (calculated by terrain generator)
- `params` — additional params from blueprint (width, depth, height, color, etc.)

**Building function registration:** All functions must be in `CityBuildings` return object AND exported to `window`:

```javascript
const CityBuildings = (function () {
  // ... building functions ...
  return { monument: monument, officeBuilding: officeBuilding, ... };
})();
// CRITICAL: Also export to window for voxel-world.js access
for (var key in CityBuildings) { window[key] = CityBuildings[key]; }
```

### Terrain Generation

`voxel-world.js` generates terrain per chunk (32×32×64 blocks). Each stage has a `THEME` (grassland, urban, industrial, coastal, wasteland, cityscape) that determines surface block, fog color, height scale. Cities are built on top of generated terrain using `getTerrainHeight(x, z)` to find ground level.

---

## 6. Building System (CRITICAL — Recent Major Work)

There are 100+ building functions in `city-buildings.js`. Key architectural landmarks were recently enhanced with real-world accuracy:

| Function | Real Building | City |
|----------|-------------|------|
| `stBasilCathedral` | Pokrovsky Sobor (1555-1561) | Moscow |
| `independenceMonument` | Berehynia Monument (62m) | Kyiv |
| `spasskayaTower` | Spasskaya Tower (Kremlin clock) | Moscow |
| `bakhmutFortress` | Bakhmut city ruins | Bakhmut |
| `dramaTheater` | Mariupol Drama Theater (bombed 2022) | Mariupol |
| `monument` | Independence Monument / Motherland | Kyiv |
| `azovstalComplex` | Azovstal Steel Works | Mariupol |
| `motherlandMonument` | Rodina Mat (62m, sword+shield) | Kyiv |
| `kremlinWall` | Moscow Kremlin walls (2.2km, 20 towers) | Moscow |
| `kyivBaroqueChurch` | St. Sophia / St. Michael's style | Kyiv |
| `pripyatFerrisWheel` | Chornobyl Ferris Wheel (26m, abandoned 1986) | Chornobyl |
| `crimeaBridge` | Kerch Strait Bridge (19km, attacked 2022-2024) | Crimea |

### Building Function Pattern

```javascript
function myBuilding(ox, oz, gy, w, d, h, color) {
  // ox, oz = world coordinates from blueprint
  // gy = ground Y from terrain
  // w, d, h = width, depth, height (optional, defaults)
  // color = palette index (optional)
  
  var detail = (typeof window !== 'undefined' && window.detailLevel) || 0;
  var damage = (typeof window !== 'undefined' && window.destructionLevel) || 0;
  
  // Build with setBlock(x, y, z, blockType)
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      for (var z = 0; z < d; z++) {
        setBlock(ox + x, gy + y, oz + z, PAL.BRICK);
      }
    }
  }
}
```

**Palette:** 128 block types in `game-constants.js`. Common ones: `AIR=0, DIRT=1, GRASS=2, STONE=3, METAL=5, SAND=7, CONCRETE=9, BRICK=10, GLASS=11, WOOD=12, ROOFTILE=13, ASPHALT=18, FIRE=19, SMOKE=20, WATER=21, LEAVES=22, RUBBLE=23, RUST=24, etc.`

---

## 7. Combat System

### Weapons

23 weapons in Ukrainian war arsenal. Keys 1-0 switch. Unlock 2 per stage.

Key weapons: Army Shovel (melee), PM Makarov (pistol), AK-74, PKM, RPG-7, Javelin, Stugna-P, Stinger, NLAW, M320, SMAW, Bradley Bushmaster 25mm, tank cannon, etc.

Weapon system in `weapons.js` handles: fire rate, recoil, reloading, jamming, ammo types, scope zoom, shell ejection, tracers, muzzle flash.

### Enemies

Types: soldier, soldier_armored, soldier_elite, soldier_sniper, drone, kamikaze_drone, tank, bradley, vehicle, helicopter, boss.

Enemy AI in `enemies.js`: pathfinding to player, cover seeking, flanking, alert states. LOD system: distance > 30m = simple geometry, < 30m = detailed.

### Waves

10 waves per stage, escalating difficulty. Wave manager spawns enemies in intervals. Boss every 3rd wave. Wave complete = all enemies dead + timer.

---

## 8. HUD System

The HUD has 60+ features. They are ALL DOM elements in index.html. Many are `display:none` by default and toggled via JS.

Key HUD elements:
- `#hud` — main game HUD (health, ammo, crosshair, minimap)
- `#overlay-start` — start screen with role/drone/formation/map selection
- `#overlay-pause` — pause menu
- `#drone-controls-hud` — drone piloting overlay
- `#tank-hud` / `#tank-interior-overlay` — tank commander view
- `#vehicle-hud` — general vehicle HUD
- `#build-hud` — building mode
- `#skill-hud-overlay` — skill tree
- `#inventory-btn` — inventory button (always visible)
- `#hud-god-mode-btn` — God Mode toggle (always visible, prominent)
- `#jukebox-panel` — music player UI
- `#perks-menu` — perk selection
- `#stats-panel` — career stats
- `#journal-panel` — war journal
- `#leaderboard-panel` — leaderboard
- `#mission-tracker` — active mission objectives
- Various indicators: bleed, prone, jammed, overheated, sliding, swimming, mantling, etc.

---

## 9. Key Global Objects

These are expected to exist on `window` after boot:

```javascript
window.THREE          // Three.js
window.BLOCK          // Block palette (0-127)
window.VoxelWorld     // Terrain generator
window.CityBuildings  // Building functions + city blueprints
window.GameManager    // Main game loop + state
window.HUD            // HUD controller
window.Weapons        // Weapon system
window.Enemies        // Enemy system
window.AudioSystem    // Audio engine (stub first, then real)
window.InputManager   // Input handling
window.SaveManager    // Save/load
window.PlayerState    // Player stats
window.MissionManager // Mission system
window.WeatherSystem  // Weather
window.TimeSystem     // Day/night
window.FXManager      // Particle effects
// + 50+ feature modules (KillStreak, NightVision, etc.)
```

---

## 10. Input Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Aim + look |
| LMB | Fire / Place block (build mode) |
| RMB | Remove block (build mode) / Alt fire |
| R | Reload |
| 1-0 | Weapon slots |
| Q/E | Scroll weapons |
| Shift | Sprint |
| Space | Jump |
| Z | Prone |
| X | Bandage |
| B | Build mode |
| F | Drone / Possess drone |
| G | God Mode toggle |
| Shift+G | Enter vehicle |
| I / TAB | Inventory |
| J | Marketplace / Jukebox |
| P | Perks menu |
| Y | War journal |
| L | Night vision |
| N | Airdrop / Mortar |
| M | Tactical map / Ping |
| K | Killstreaks |
| C | Ammo type |
| V | Camera mode / Inspect weapon |
| T | Tank view toggle |
| ESC | Pause |
| ` | Stealth mode |
| , | Toggle music |

---

## 11. Build & Deploy

### Local Development

```bash
# Start server
node server.js
# Open http://localhost:3000

# Or with npx serve
npm run dev
```

### Git Workflow

```bash
# Current branch: game-hud-extras-kyiv
# Deploy target: gh-pages (force-push)

# Commit
# git add -A && git commit -m "message"

# Push to feature branch
git push origin game-hud-extras-kyiv

# Deploy to GitHub Pages (force-push to gh-pages)
# git push --force origin game-hud-extras-kyiv:gh-pages
```

**Cache-buster:** When deploying, increment the version string in index.html. Search for `v=20260702i` and increment the letter (i → j → k, etc.). There are 63 script tags that need this.

**GitHub Pages URL:** https://photonbounce.github.io/occupantkiller-1/

---

## 12. QA / Testing Process

The project has an automated QA system using Playwright/Puppeteer:

1. **Server must be running** (`node server.js` on localhost:3000)
2. **QA script loads** `http://localhost:3000/?quickstart=1&stage=STAGE&god=1&qa=1`
3. **Automated checks:**
   - Game boots within 45 seconds
   - No console errors
   - Canvas renders
   - HUD visible
   - Wave starts
   - Enemies spawn
   - Can kill enemies
   - Stage progression works
4. **Screenshot capture** at each stage
5. **Error logging** to server `/qa-log` endpoint

**QA stages to test:** All 20 stages (0-19). Map: HOSTOMEL, AVDIIVKA, BAKHMUT, KHERSON, MARIUPOL, CRIMEA, CHORNOBYL, MOSCOW, SEVASTOPOL, DONBAS, BELGOROD, KREMLIN, KYIV, SNAKE, SAKY, VUHLEDAR, ANTONOV, REFINERY, TREELINE, SIEGE.

**QA parameters:** `?quickstart=1&stage=N&god=1&qa=1&notimeout=1`

---

## 13. Known Issues & Quirks

1. **AudioSystem stub vs real:** The real audio system loads asynchronously. A stub is placed first in `<head>` so modules that reference `AudioSystem` don't crash during load. The real one replaces it later.

2. **Boot timeout:** Was 15s, now 45s. If it still fails, check if a module is hanging.

3. **Module load order:** Scripts MUST load in the exact order in index.html. The game-manager.js init call is at the bottom of the file, inline.

4. **CityBuildings export:** New building functions must be added to BOTH the `CityBuildings` return object AND exported to `window` via the loop at the end. If missing, `voxel-world.js` will throw "function not found" when generating cities.

5. **Performance mode:** `window.__OK_PERF` disables heavy effects (particles, shadows). Default ON. Toggle via "PERFORMANCE" button.

6. **Mobile touch controls:** Sized at 56px minimum for accessibility. Gyro aim supported.

7. **Building function signature mismatch:** Old functions use `(ox, oz, gy, ...)` while some newer code might expect `(gx, gy, gz, ...)`. The `generateCityFromBlueprints` passes `(b.x, b.z, gy, ...params)` so functions must accept `(ox, oz, gy, ...)`.

8. **Enemy LOD:** Enemies beyond 30m are simple boxes. Within 30m they have full legs+arms+weapon geometry. This was fixed in a recent commit.

9. **Memory leaks:** The game creates many Three.js objects. No explicit disposal system. May leak on long sessions.

10. **WebBridge timeout:** WebBridge browser times out during heavy game load. Use Playwright for QA instead.

---

## 14. Recent Changes (July 2026)

1. **Enhanced 8 major building functions** with real-world architectural accuracy (dramaTheater, monument, azovstalComplex, motherlandMonument, kremlinWall, kyivBaroqueChurch, pripyatFerrisWheel, crimeaBridge)

2. **Added 30+ missing building stubs** (playground, cityHall, library, marketStall, fireDepartment, cafe, hospitalBuilding, dataCenter, gasStation, etc.)

3. **Fixed CityBuildings exports** — all functions now properly exported to window

4. **Increased boot timeout** from 15s to 45s

5. **Real terrain geography** for all 20 stages (rivers, hills, forests, landmarks)

6. **Bradley IFV** added with full vehicle physics, Bushmaster 25mm cannon, interior/exterior view

7. **FPV drones** with 3 types (kamikaze, surveillance, bomber)

8. **Shell ejection physics** for all firearms

9. **Enemy LOD fix** — distant enemies now have simple legs+arms instead of floating boxes

10. **3 clean QA cycles** passed — all 20 stages boot without errors

---

## 15. What Needs Work (Priority)

1. **Performance optimization** — Memory disposal, object pooling, chunk culling for far distances
2. **More building enhancements** — Many buildings still use generic shapes. Need real-world accuracy for: potemkinStairs (Odesa), derzhprom (Kharkiv), lvivCityHall, lvivOperaHouse, etc.
3. **AI improvements** — Enemy AI is basic. Could use better cover-seeking, squad tactics, flanking.
4. **Sound system** — AudioSystem is large (~75k lines). Could be split into modules.
5. **Mobile optimization** — Touch controls work but could be smoother. Gyro aim needs tuning.
6. **Multiplayer** — Currently single-player only. WebSocket server would be needed.
7. **Save system** — Currently LocalStorage only. Could add cloud saves.
8. **Testing** — No unit tests. Only integration/QA tests via browser automation.

---

## 16. How to Add a New Building

1. Add function to `city-buildings.js` inside the `CityBuildings` IIFE
2. Add to `CityBuildings` return object: `myBuilding: myBuilding`
3. Add to window export loop at end of IIFE (already covers all keys)
4. Add blueprint entry to `CITIES[cityName]` array with `{ type: 'myBuilding', params: [w, d, h, color], x, z, note }`
5. Bump cache-buster in index.html
6. Test by loading that stage with `?quickstart=1&stage=N&god=1`

---

## 17. How to Add a New Stage

1. Add entry to `STAGE_MAP` in `game-constants.js` or `voxel-world.js`
2. Create `CITIES.newCity` array in `city-buildings.js` with building blueprints
3. Add theme to `THEMES` object if needed
4. Add stage name to UI (start screen map selector, stage splash, etc.)
5. Update wave configuration in `wave-manager.js` or `game-manager.js`
6. Test with QA parameters

---

## 18. Useful Commands

```bash
# Start server
node server.js

# Count JS lines
wc -l *.js | sort -rn

# Find all building functions
grep "function " city-buildings.js

# List all cities and their buildings
grep -n "CITIES\." city-buildings.js

# Find recent commits
git log --oneline -20

# Deploy to GitHub Pages
# git push --force origin game-hud-extras-kyiv:gh-pages

# QA test all stages (automated)
# Use Playwright/Puppeteer script (see qa/ directory if exists)
```

---

## 19. Contact & References

- **GitHub:** https://github.com/PhotonBounce/occupantkiller-1
- **Live:** https://photonbounce.github.io/occupantkiller-1/
- **Upstream:** https://github.com/lindapot-art/occupantkiller
- **Branch:** `game-hud-extras-kyiv`
- **Deploy target:** `gh-pages` (force-push)

---

## 20. One-Line Architecture Summary

`index.html` → loads 63 JS modules in order → `GameManager.init()` → generates voxel terrain → loads city blueprint → spawns buildings → spawns player → starts game loop → renders with Three.js → 60fps browser FPS with 20 real-world cities, 23 weapons, drones, vehicles, and 60+ HUD features.
