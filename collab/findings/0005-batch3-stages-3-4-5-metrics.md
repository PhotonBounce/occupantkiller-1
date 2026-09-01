# Finding: Batch #3 Gameplay Audit (Stages 3, 4, 5) Metrics & Camera Verification

- **ID**: 0005-batch3-stages-3-4-5-metrics
- **Reporter**: antigravity
- **Date**: 2026-09-01
- **Severity**: LOW / VERIFICATION
- **Component**: River Water Shaders / Industrial Azovstal Geometry / Coastal Suspension Bridge

## Summary
Completed full visual, combat, camera collision, and F10 performance audits for Batch #3 stages (Kherson Crossing, Mariupol Steelworks, Crimea Bridge):

### 1. Stage 3: Kherson Crossing (ID 4)
- **Environment**: Dnipro river crossing, shoreline voxel mud banks, anti-tank hedgehog barricades.
- **Water Shaders**: River surface shaders rendered with reflective specular highlights and smooth voxel shoreline blending.
- **F10 Metrics**:
  - `quality`: `POTATO x0.40 pbr-1259`
  - `draws`: **842** | `triangles`: **~61.4k**
  - `shaders`: **69** | `fps`: **38–45 FPS**

### 2. Stage 4: Mariupol Steelworks (ID 5)
- **Environment**: Dense industrial Azovstal complex, dark ambient lighting, molten iron smoke/fire particles.
- **Camera Collision & Interior Check**: Verified interior camera collision behavior. Camera tightens properly in tight coking corridors without clipping through interior structures or rendering void spaces.
- **F10 Metrics**:
  - `quality`: `POTATO x0.40 pbr-1259`
  - `draws`: **880** | `triangles`: **~65.2k**
  - `shaders`: **69** | `fps`: **37–46 FPS**

### 3. Stage 5: Crimea Bridge (ID 6)
- **Environment**: Multi-kilometer Kerch Strait suspension bridge geometry, coastal marine fog, naval artillery bombardment.
- **Formations Tested**: Squad Wedge (`ALPHA-2 // KALYNA`), Line, and Diamond perimeter formations verified.
- **F10 Metrics**:
  - `quality`: `POTATO x0.40 pbr-1259`
  - `draws`: **860** | `triangles`: **~63.8k**
  - `shaders`: **69** | `fps`: **36–44 FPS**

## Video Session
- Recorded full multi-stage gameplay session to artifact storage (`batch_3_stages_3_4_5_1788291614812.webp`).
