# OccupantKiller — HUD Extras handoff

Autonomous `/loop` added a self-contained, **toggleable** suite of HUD/FX/stat features
over 8 rounds. Everything is additive and defensive (feature-detects every game global,
no-ops if missing), so it can't break gameplay. All QA'd headless at **0 errors**.

## What was added (9 modules)

| File | Round | Features |
|---|---|---|
| `hud-extras.js`  | 1 | compass strip · tactical readout (FPS/hostiles/weapon) · animated reticle |
| `hud-extras2.js` | 2 | top-down minimap (+radar sweep) · wave tracker bar · multi-kill streak banner |
| `hud-extras3.js` | 3 | damage direction indicator · kill feed · speedometer + motion lines |
| `hud-extras4.js` | 6 | off-screen enemy arrows · on-screen enemy brackets · target lock |
| `fx-extras.js`   | 4 | cinematic mode (C) · atmosphere particles (V) · stage intro title card |
| `match-stats.js` | 8 | live stats (kills/time/wave/streak) · tactical callouts · end-of-match summary |
| `extras-panel.js`| 5,7,9 | settings panel (H) · clean-view (K) · cheatsheet (?) · quick presets · first-run onboarding |

Loaded via `<script>` tags added to **`index.html`** and **`microsite/play/index.html`**
(between `hud.js` and `weapon-details.js`).

## Controls
- **H** — open the Extras settings panel (toggle any feature; saved per device)
- **K** — clean view (hide all extras, for screenshots/streaming)
- **?** — controls cheatsheet
- **C** / **V** — cinematic mode / atmosphere particles
- Panel presets: **Minimal · Combat · Full · Off**

## Toggling internals
Each module honors `window.__OK_EXTRAS.<key>` (`hud1..hud4`, `stats`); the panel sets these
+ persists to `localStorage['ok_extras_prefs']`. FX cinematic/particles via `FXExtras` API.

## QA screenshots (for review)
In `tools/screenshots/`:
`hud-extras-*`, `hud-extras2-*`, `hud-extras3-*`, `fx-extras-*`, `extras-panel-*`,
`threat-tracking-*`, `polish-*`, `match-stats-*`. QA scripts: `tools/_*shot.js`.

## ⚠ Committing — read first
The working tree also contains **unrelated uncommitted changes** from the earlier game-dev
phase (`enemies.js`, `game-manager.js`, `vehicles.js`, `missions.js`, `npc-system.js`,
`pickups.js`, `tracers.js`, `voxel-world.js`, `style.css`, both root + `microsite/play`),
plus untracked `apk-build/` and a few unrelated files. **I did not auto-commit** to avoid
entangling those.

To commit **only** the HUD Extras suite onto a feature branch:

```bash
git checkout -b hud-extras
git add hud-extras.js hud-extras2.js hud-extras3.js hud-extras4.js \
        fx-extras.js match-stats.js extras-panel.js \
        index.html \
        microsite/play/hud-extras.js microsite/play/hud-extras2.js \
        microsite/play/hud-extras3.js microsite/play/hud-extras4.js \
        microsite/play/fx-extras.js microsite/play/match-stats.js \
        microsite/play/extras-panel.js microsite/play/index.html \
        tools/_hudextrashot.js tools/_hudextra2shot.js tools/_hudextra3shot.js \
        tools/_fxextrashot.js tools/_extraspanelshot.js tools/_threatshot.js \
        tools/_polishshot.js tools/_matchstatsshot.js HUD-EXTRAS-HANDOFF.md
git commit -m "feat: toggleable HUD Extras suite (compass, minimap, threat tracking, FX, match stats, control panel)"
```

> Note: `index.html` / `microsite/play/index.html` carry only the new `<script>` lines from
> this work — review the diff before committing if you also have older pending edits there.
> The earlier game-dev changes are separate and yours to commit (or discard) on their own.

## To curate in-game
Press **H**, pick a preset (or toggle individually), or **K** to hide everything. Choices persist.
