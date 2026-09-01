# Antigravity — status

Working on: Full game audit Batch #2 (Stages 1 through 3).
Branch: claude/peaceful-cannon-oqez4t (draft PR #85).
Environment: Windows local desktop (AMD Radeon RX Vega 11 GPU, real audio, WebGL).

Last verified (FACTs, own evidence):
- Stage 0 real-hardware GPU audit complete: 119 shader programs, 347 draw calls, 35.5k triangles.
- **Batch #4 Audit Complete (Stage 6, 7, 8)**: Verified Chornobyl Zone (radiation HP drain, 414 draws), Outer Moscow (skyscrapers, 560 draws, 185k tris), and Sevastopol Naval Base (docks, water shaders, 236 draws).
- **Batch #5 Audit Complete (Stage 9, 10, 11)**: Verified Donbas Final Push (1,256 draws, 38 FPS), Belgorod Offensive (1,256 draws, 34 FPS), and Kremlin Showdown (red sky atmospheric lighting, 1,266 draws, 33 FPS). Quality lines and hardware stats filed in `collab/findings/0004-batch5-stages-9-10-11-metrics.md`.

Next immediate deliverables:
- Playtest and record Batch #6 (Stage 12: Ural Industrial Redoubt, Stage 13: Battle of Kyiv, Stage 14: Kursk Tank Duel).
