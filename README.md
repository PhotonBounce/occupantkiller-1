# Occupant Killer — 3D FPS

A browser-based first-person shooter built with [Three.js](https://threejs.org/) r137.
Fight through **20 stages** of increasingly dangerous occupants across Ukraine and beyond.

## Quick Start

```bash
node server.js          # Start on port 3000
# or
start.bat               # Windows: auto-kills port conflict + starts server
```

Open `http://localhost:3000` in Chrome, Firefox, or Edge.

## Controls

| Key / Action | Description |
|---|---|
| `W A S D` / Arrow keys | Move |
| Mouse | Look |
| Left click | Shoot (hold for auto-fire) |
| `R` | Reload |
| `Shift` | Sprint |
| `Space` | Jump |
| `C` | Crouch |
| `V` | Mantle over obstacles |
| `E` | Enter/exit vehicle |
| `Q` | Toggle drone possession |
| `B` | Toggle build mode |
| `Tab` | Scoreboard |
| `1-9` | Weapon select |
| `Esc` | Pause / Resume |

## Game Features

- **20 stages** (Hostomel Airport → Siege of Moscow), 7 waves each
- **600+ realistic buildings** across 20 cities based on real-world landmarks
- **200+ road networks** with vehicle pathfinding waypoints
- **30+ enemy types** — infantry, snipers, medics, tanks, drones, mechs, 9 unique bosses
- **Extensive weapon arsenal** with attachments, recoil patterns, and ammo types
- **Vehicles** — transport, combat, turret rover (drivable + AI patrols, road-restricted)
- **Drones** — recon, combat, supply (possessable with Q key)
- **Friendly NPCs** — civilians, trainees, squadmates with squad commands
- **Building system** — barracks, factories, walls, hangars, command centers
- **Voxel world** — procedural terrain, destructible environment, 12 biomes, 600+ landmark buildings
- **Dynamic weather** — rain, snow, fog, sandstorm, radiation
- **Progression** — XP, ranks, prestige, daily missions, perks, skills
- **Audio** — procedural SFX, ambient soundscapes, adaptive music

## Architecture

All client modules use the IIFE singleton pattern (`const Module = (function() { ... })();`).
Custom static file server with gzip compression and security headers (no Express).

### Core Files (40+ JS modules)

| File | Purpose |
|---|---|
| `server.js` | HTTP server (gzip, cache, security headers, /healthz) |
| `game-manager.js` | Main orchestrator (stages, waves, player, game loop) |
| `game-constants.js` | Centralized magic-number constants (FPS, combat, wave, economy) |
| `player-state.js` | Player state (HP, stamina, armor, stats) + helper methods |
| `wave-manager.js` | Wave spawning, battlefield events, wave completion |
| `boot-manager.js` | Renderer, scene, camera, lights, terrain, UI init |
| `fx-manager.js` | Loot particles, footstep puffs, suppression, screen shake |
| `input-manager.js` | Keyboard, mouse, touch, mobile controls, gyro |
| `save-manager.js` | Save/load, stage progression, localStorage |
| `combat-manager.js` | Combat loop, hit registration, grenades, kill tracking |
| `ui-manager.js` | Overlays, inventory, shop/sell/premium/assets, marketplace |
| `mission-manager.js` | Mission tracker, leaderboard, challenges, achievements |
| `voxel-world.js` | Procedural voxel terrain + 12 biome generators |
| `city-buildings.js` | 600+ realistic building blueprints + 200 road networks for 20 cities |
| `weapons.js` | Weapon behavior (fire, reload, attachments, raycasting) |
| `weapons-data.js` | Weapon definitions (30+ weapons, stats, ammo) |
| `enemies.js` | Enemy spawning, AI, damage, death, wave management |
| `enemy-types.js` | 30+ enemy type definitions and specialized AI |
| `npc-system.js` | Friendly NPC AI, squads, combat, patrol |
| `vehicles.js` | Vehicle spawning, driving, AI patrols, turrets |
| `drone-system.js` | Drone control, AI, camera, possession |
| `camera-system.js` | FPS/RTS/Drone/Vehicle camera modes |
| `audio-system.js` | Procedural SFX, ambient, music (Web Audio API) |
| `hud.js` | HUD rendering (health, ammo, minimap, compass) |
| `combat-extras.js` | Grenades, melee, prone, attachments |
| `tracers.js` | Bullet tracers, casings, impact effects |
| `pickups.js` | Health, ammo, armor collectibles |
| `building.js` | Structure placement, templates, build queue |
| `weather-system.js` | Dynamic weather (rain, snow, fog, sandstorm) |
| `world-features.js` | Fire, trees, airdrops, landmines, sandbags |
| `stage-vfx.js` | Stage-specific particle effects |
| `progression.js` | XP, levels, prestige, daily missions |
| `missions.js` | Mission objectives and tracking |
| `mission-types.js` | Mission type definitions |
| `perks.js` | Perk tree and effects |
| `skills.js` | Skill system |
| `ranks.js` | Military rank progression |
| `traversal.js` | Mantling, climbing, sliding |
| `feedback.js` | Hit markers, kill feed, notifications |
| `time-system.js` | Day/night cycle |
| `automation.js` | Auto-crafting, auto-repair |
| `ml-system.js` | ML-based difficulty adaptation |

### Recent Refactoring (2025)

- **9 modules extracted** from `game-manager.js` (9,500 → organized): PlayerState, WaveManager, BootManager, FXManager, InputManager, SaveManager, CombatManager, UIManager, MissionManager
- **Object pooling**: 48 damage-number sprites, 64 blood decals, 40 enemy meshes, 8 footstep materials
- **Dead code stripped**: Removed blockchain.js, economy.js, marketplace.js, tokenomics.js (~1MB+ stubs)
- **Weapons data separated**: Weapon definitions extracted to `weapons-data.js`
- **City blueprint system**: 30+ landmark buildings per city, 10 roads per city, vehicle road restriction
- **Performance fixes**: Eliminated per-frame `THREE.Vector3` allocations, per-event material creation

## Testing

```bash
node tools/test-master.js   # 32 tests across 7 phases
```

## Deployment

Configured for [Render.com](https://render.com) via `render.yaml`. Health check at `/healthz`.
