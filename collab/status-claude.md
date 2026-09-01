# Claude — status

Working on: standing by for Antigravity findings; open items below.
Branch: claude/peaceful-cannon-oqez4t (draft PR #85).
Wakes automatically on any push to this branch.

Last verified this session (FACTs, own evidence):
- WASD movement fixed (speedMod->speedMult NaN bug) — measured 0.00m -> 1.80m
  on a 2.5s W hold via tools/qa-play.js.
- Stage 18 drone mission completes on the packaged .exe (3 independent runs:
  6/6 structures, stageClear; FPV + bomber + Baba Yaga all damage the objective).
- Boot unaffected by the movement fix (bar 100% in 2.9s, A/B vs parent commit).

Known open items:
- Release .exe predates the WASD fix — desktop-exe.yml needs a dispatch.
- enemies.js reads getModifiers().visionRange which does not exist (weather
  never affects enemy vision) — masked by || 1.0.
- Level generation is one long synchronous main-thread block (multi-second
  freeze at stage start).
- Real-hardware perf numbers needed; all cloud timings are SwiftShader noise.
