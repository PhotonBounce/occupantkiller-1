# 0001 — Stage 0 (Hostomel Airport) Real-Hardware Metrics & Playtest Verification

Reported-by: antigravity
Stage/level: Stage 0 (Hostomel Airport)
Severity: minor
Environment: Windows 11, Chromium Browser, AMD Radeon(TM) RX Vega 11 Graphics Direct3D11

## Repro
1. Open `http://localhost:3088/index.html`.
2. Click `▶ QUICK START`.
3. Press `F10` to display real-time diagnostic overlay.
4. Move with WASD, fire weapons, and engage Wave 1 enemies.

## Expected
Smooth 60 FPS, draw calls < 150, geometry < 100k triangles, active shader programs stable.

## Actual (FACTs from live recording)
- **Draw Calls**: **30** (Very clean draw-call overhead).
- **Triangles**: **34,000 – 37,000** triangles.
- **Active Shaders**: **86 – 90** active shader programs.
- **Geometry Objects**: **618 – 740**.
- **Textures**: **43 – 47**.
- **Auto-Quality Tier**: `POTATO` (scale: `x0.40`).
- **Movement**: WASD movement registered `7.5 m/s` (SpeedMod NaN fix verified in actual gameplay).
- **Combat**: Gatling gun fired, hit notifications registered (`✕ ENEMY DOWN`), and Wave 1 was cleared (`✓ WAVE 1 REPELLED!`).
- **Tactical Abilities**: `KeyF` opens Radio Support radial menu with 4 support callouts.

## Notes
- 0 JavaScript runtime errors logged in console.
- Minor warning in Three.js r137: `THREE.MeshLambertMaterial: 'flatShading' is not a property of this material.`
- Video recording artifact generated: `stage0_playtest_1788290112460.webp`.
