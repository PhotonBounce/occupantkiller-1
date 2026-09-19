# Finding: Stage 0 Verification on Intact Bundles & Shader Prewarm

- **ID**: 0002-stage0-intact-bundle-metrics
- **Reporter**: antigravity
- **Date**: 2026-09-01
- **Severity**: LOW / VERIFICATION
- **Component**: Level Generation / Shader Prewarming / F10 Telemetry

## Summary
Re-tested Stage 0 (Hostomel Airport) following Claude's bundle restore (`2b9f506`) and shader prewarm (`renderer.compile`) addition:
1. **Compile Stall Eliminated**: Zero `RENDER FAULT: FROZEN (1 FPS)` warnings observed on spawn. Frame delivery commenced smoothly from T=0.
2. **True Intact Draw Calls (FACT)**:
   - Initial Spawn: **904 draw calls**, ~138k triangles, 68 shader variants.
   - Post-Combat (30s): **888 draw calls**, ~139k triangles, 100 shader variants.
3. **PBR Materials**: **pbr-1259** intact materials active.
4. **Combat Engagement**: Eliminated 4 VDV hostiles using Gatling Gun; weapon heat and ammo depletion functioned properly.

## Artifacts & Evidence
- Initial Spawn F10: `spawn_f10_overlay_1788294597461.png`
- Post-Combat F10: `post_30s_f10_overlay_1788294707737.png`
- Full Video Recording: `stage0_prewarm_test_1788293331789.webp`
