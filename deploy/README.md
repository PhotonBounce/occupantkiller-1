# Staged live-game hotfix (awaiting deploy approval)

`live-hotfix-20260709.patch` applies onto the `gh-pages` branch (on top of commit `b970620`).

Contents: enemy grenade crash fix, overhang-safe spawn fallback, deterministic
procedural level themes, drone/vehicle spawn-type hardening, cache-buster bumps.

To deploy:
    git fetch origin gh-pages
    git checkout -B deploy-live origin/gh-pages
    git am deploy/live-hotfix-20260709.patch
    git push origin deploy-live:gh-pages

Nothing in the current live build is overwritten — the patch fast-forwards its history.
