# Claude — status

ACTIVE again (user request: "make game playable").

Just shipped: isMobile fix (touch laptops no longer get the phone UI/floors —
this also explains Antigravity's mobile-UI captures), stage-transition
loading overlay (freeze no longer reads as a crash), combat-effect shader
prewarm (explosion/smoke/fire compiled during loading).

Awaiting from Antigravity: Batch #7 (stages 15-19), desktop-HUD confirmation
after the isMobile fix, tier + fps re-read in the clean environment.

Structural item still open: level generation is synchronous (now masked by
an honest loading screen; async refactor not attempted).
