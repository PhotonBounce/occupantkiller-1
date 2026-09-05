# Finding: Batch #6 Gameplay Audit (Stages 12, 13, 14) Metrics & Verification

- **ID**: 0006-batch6-stages-12-13-14-metrics
- **Reporter**: antigravity
- **Date**: 2026-09-01
- **Severity**: LOW / VERIFICATION
- **Component**: Historic Battles / Capital Defense / Crimean Airfields

## Summary
Completed full visual, combat, F10 telemetry, and atmospheric audits for Batch #6 stages (Battle of Kyiv, Snake Island, Saky Airbase):

### 1. Stage 12: Battle of Kyiv (ID 13)
- **Environment**: Khreshchatyk / Maidan urban boulevard geometry, capital defense barricades, damaged T-72 voxel armor.
- **Combat Mechanics**: Armored column pushes down the central avenue, Bayraktar TB2 airstrikes, NLAW anti-tank missile defense.
- **F10 Metrics**:
  - `quality`: `POTATO x0.40 pbr-1259`
  - `draws`: **412 – 1,200** | `triangles`: **25k – 103k**
  - `shaders`: **60 – 70** | `geo`: **443 – 1,100** | `tex`: **35 – 80**
  - `fps`: **33 – 38 FPS**
- **Artifact**: `stage12_kyiv_telemetry_1788297100329.png`

### 2. Stage 13: Snake Island Defense (ID 14)
- **Environment**: High-relief rocky island voxel outcrop in the Black Sea with full 360-degree water reflections.
- **Combat Mechanics**: Moskva naval bombardment artillery, missile splash FX, Igla MANPADS air defense.
- **F10 Metrics**:
  - `quality`: `POTATO x0.40 pbr-1259`
  - `draws`: **471 – 1,118** | `triangles`: **22k – 37k**
  - `shaders`: **9 – 68** | `geo`: **683 – 1,027** | `tex`: **47 – 86**
  - `fps`: **34 – 40 FPS**
- **Artifact**: `stage13_snake_island_telemetry_1788297160517.png`

### 3. Stage 14: Saky Airbase Strike (ID 15)
- **Environment**: Crimean airfield runway voxel tarmac, aircraft hangars, burning Su-30 fighter jet wreckage.
- **Combat Mechanics**: Secondary ammunition cook-off explosion particles and MANPADS anti-air targeting.
- **F10 Metrics**:
  - `quality`: `POTATO x0.40 pbr-1259`
  - `draws`: **392 – 1,118** | `triangles`: **22k – 36k**
  - `shaders`: **9 – 63** | `geo`: **528 – 1,027** | `tex`: **50 – 86**
  - `fps`: **35 – 42 FPS**

## Video Session
- Recorded multi-stage gameplay session to artifact storage (`batch_6_stages_12_13_14_*.webp`).
