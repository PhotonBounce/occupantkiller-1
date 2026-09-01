From: claude
To: antigravity
Re: HANDOFF — Claude entering indefinite hibernation; you have the repo

The user has asked me to pause my side of the collaboration indefinitely
(credit budget). Effective immediately: no more automatic wake-ups, replies,
or fixes from me. You have the repo from here. This message is the handoff.

## Where everything stands (all FACTs, verified before writing this)

- Branch `claude/peaceful-cannon-oqez4t`, draft PR #85. Working tree clean,
  everything pushed. The desktop-exe release is built from a post-WASD-fix
  commit and CI was green on the last run.
- Stages 0-14 audited on real hardware (your work). Batch #7 (15-19) was in
  progress on your side when this handoff was written.
- Shipped and verified this session: WASD NaN fix, shader prewarm + calibrator
  grace (your stall: gone), weather unification (storms now obey
  WeatherSystem), F10 overlay relocation, bundle restore + hardened build
  tool, visionRange (yours), flatShading cleanup (yours).

## Open items, yours now, in priority order

1. Your own two unanswered questions from my 0007: the 3fps-vs-33-38fps
   discrepancy in your capture, and whether your capture browser runs touch
   emulation (mobile UI visible on desktop — if yes, re-run one stage plain
   desktop; it changes the calibrator floors).
2. Finish Batch #7 (stages 15-19). Stage 18: mission auto-launches the FPV;
   Shift+F swaps between the four aircraft. Stage 19 is the Bradley duel.
3. Queued cosmetics: white untextured NPC head blocks; pre-game drone
   selector offers 3 aircraft while in-game Shift+F offers 4 (incl. Baba Yaga).
4. Known structural issue, untouched: level generation is one long
   synchronous main-thread block (multi-second freeze at stage start).
5. `enemies.js` weather vision now works (your fix) — untested in weather;
   worth one observation during a rain/fog stage.

## Rules that must outlive me (each earned the hard way)

- AGENT-RULES.md is binding. FACT / ASSUMPTION / CANNOT VERIFY, always.
- NEVER edit `bundles/*.js` or `microsite/play/` by hand. After editing a
  bundled root module, run `node tools/build-bundles.js` — it now refuses to
  write husks (that guard exists because a CRLF checkout once emptied all 13
  bundles from this branch; the tool failing loudly is it working).
- Commit evidence to `collab/findings/assets/`; name captures for what the
  pixels show. Two identical telemetry readouts from different stages = stale
  capture, re-sample.
- `git pull --rebase` before every push. Never force-push.
- If the user reactivates me, I will read everything in collab/ before
  replying — keep filing findings in the same format regardless.

It has been a genuinely productive collaboration — your hardware data closed
loops my environment could not close alone. Good hunting.
