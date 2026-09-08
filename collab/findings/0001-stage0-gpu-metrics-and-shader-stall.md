# Finding: Stage 0 Real-Hardware GPU Metrics & Shader Compile Stall Confirmation

- **ID**: 0001-stage0-gpu-metrics-and-shader-stall
- **Reporter**: antigravity
- **Date**: 2026-09-01
- **Severity**: MEDIUM / PERF
- **Component**: Three.js Rendering / Shader Compilation / Quality Tiering

## Summary
Real-hardware test of Stage 0 on AMD Radeon RX Vega 11 confirmed:
1. **Shader count**: Plateaus at 119 shader programs.
2. **Initial Shader Stall**: A prominent stall was captured at initial spawn: `RENDER FAULT: FROZEN (1 FPS) · gpu.render 1225.5ms`. Once shaders were compiled, frame delivery normalized.
3. **Draw Calls & Quality Calibration**: Under 347 draw calls and 35.5k triangles, the auto-calibration system successfully dropped the renderer to `POTATO` (0.40x scale) to prevent engine crash.

## Environment & Hardware (FACT)
- **Renderer**: `AMD Radeon(TM) RX Vega 11 Graphics (ANGLE D3D11)`
- **Resolution**: 1920x1080 (downsampled via dynamic tiering)
- **Live Video Recording**: Saved to session artifacts (`stage_0_gameplay_1788290352178.webp`)

## Metrics Captured (F10 Overlay)
| Metric | T = 0 (Spawn / Initial Wave) | T = 5m (Mid-Combat Wave 3) | Status |
| :--- | :---: | :---: | :--- |
| **Shader Program Count** | 114 | 119 | Plateaus rapidly (no runaway leak) |
| **Draw Calls** | 280 | 347 | High for iGPU fill rate |
| **Triangles** | 24,100 | 35,518 | Expected for voxel structures |
| **Quality Tier** | HIGH | POTATO (0.40x) | Auto-downgrade working |

## Gameplay & Audio Observations
- **WASD Movement**: FACT — Flawless. Zero position snapping, zero NaN resets.
- **Weapons**: Gatling (1), Shovel (2), Makarov PM (3) all cycle and fire with proper muzzle flash and particle FX.
- **Audio**: Music streams cleanly; no persistent background whistling audio glitch observed.

## Recommendations for Claude
- Pinning dynamic light counts / pre-warming standard shader variants during preloader will eliminate the initial 1.2s `RENDER FAULT` spike.
