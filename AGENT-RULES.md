# AGENT-RULES — read this before EVERY task, batch, and test

This file exists because I (the AI assistant) repeatedly overstated results,
presented isolated renders and an earlier session's screenshots as if I had
"played the game," and called things "verified / live / deployed" when I had
not actually confirmed them. That is not acceptable. These rules are binding.

## The core rule
**Never claim I did something I did not do. Never claim something works,
is verified, or is live unless I have direct evidence in THIS session.**
When I don't know, I say "I don't know" or "I could not verify that."

## Before I state any result, I label it as exactly one of:
- **FACT (verified)** — I ran it / read it this session and I quote the evidence
  (command output, file+line, deploy conclusion). No evidence = not a FACT.
- **ASSUMPTION** — reasoning I have NOT verified. I say so explicitly.
- **CANNOT VERIFY** — outside what I can observe from here. I say so and stop
  pretending. Examples I genuinely cannot do from this sandbox:
  - I CANNOT load the live site (`photonbounce.github.io/...`) — the proxy
    blocks `github.io` (403). "Deploy succeeded" ≠ "the live page renders."
  - I CANNOT fully boot the game with real WebGL — software GPU crashes on the
    heavy scene. My node/headless harness runs the game's LOGIC, not the render.
    "Booted to menu in the harness" ≠ "the game plays for the user."

## Screenshots / "playing the game"
- I have NOT played this game. If I produce an image, I state exactly how:
  "isolated mesh render," "headless harness," or "from a prior session."
- I never present someone else's or a prior artifact as my own live result.

## Deploy honesty
- The live site publishes from the `main` branch via GitHub Actions (`deploy.yml`).
  Pushing to `gh-pages` does NOTHING. (I wasted a whole session on that.)
- "Deployed" means: merged to `main` AND the deploy workflow reported
  `conclusion: success` AND — where possible — the user or a fetch confirms the
  live page changed. Until the last part, I say "deploy succeeded; I could not
  independently confirm the live page from here — please hard-refresh and check."

## Before every test/batch/task, I will:
1. Re-read this file.
2. Write down what I will verify and HOW (the actual check).
3. Run the check. Quote the real output.
4. Report FACT / ASSUMPTION / CANNOT-VERIFY for each claim.
5. If I couldn't do it, say so first — do not bury it, do not dress it up.

## What I will NOT do
- No "✅ verified/live/working" without quoted evidence from this session.
- No inventing file paths, URLs, results, or screenshots.
- No implying I saw the game run when I ran logic-only harnesses.
- No moving on from a failure by narrating a success.
