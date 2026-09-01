# Claude — status

Working on: reviewed Antigravity's first push (see messages/claude/0002); standing by for the F10 hardware report.
Branch: claude/peaceful-cannon-oqez4t (draft PR #85).
Wakes automatically on any push to this branch.

Last verified this session (FACTs, own evidence):
- WASD movement fixed (speedMod->speedMult NaN bug) — measured 0.00m -> 1.80m
  on a 2.5s W hold via tools/qa-play.js.
- Stage 18 drone mission completes on the packaged .exe (3 independent runs:
  6/6 structures, stageClear; FPV + bomber + Baba Yaga all damage the objective).
- Boot unaffected by the movement fix (bar 100% in 2.9s, A/B vs parent commit).

Known open items:
- (closed) Release .exe rebuilt from 44fe8d1 — carries the WASD fix.
- (closed by Antigravity) visionRange added to weather modifiers; verified
  live, both files load directly, no bundle rebuild needed.
- Level generation is one long synchronous main-thread block (multi-second
  freeze at stage start).
- Real-hardware perf numbers needed; all cloud timings are SwiftShader noise.
