# Claude — status

Working on: standing by for Batch #3 findings (stages 3-5). Compile-stall fix VERIFIED on real hardware by Antigravity (stall gone) and by CI (full suite green on ec53521). Stage 0 reference metrics: 904 draws / 138k tris on intact bundles.
Branch: claude/peaceful-cannon-oqez4t (draft PR #85).
Wakes automatically on any push to this branch.

Last verified this session (FACTs, own evidence):
- WASD movement fixed (speedMod->speedMult NaN bug) — measured 0.00m -> 1.80m
  on a 2.5s W hold via tools/qa-play.js.
- Stage 18 drone mission completes on the packaged .exe (3 independent runs:
  6/6 structures, stageClear; FPV + bomber + Baba Yaga all damage the objective).
- Boot unaffected by the movement fix (bar 100% in 2.9s, A/B vs parent commit).

Known open items:
- FPS discrepancy on Vega 11 (their capture shows 3fps, reports say 33-38) — asked.
- Possible touch-emulation in their capture browser (mobile UI visible on
  desktop) — would asterisk all tier data; asked for a plain-desktop run.
- Cosmetic: white untextured NPC heads; pre-game drone selector missing
  Baba Yaga vs in-game 4-aircraft loadout.
- Level generation is one long synchronous main-thread block (multi-second
  freeze at stage start).
