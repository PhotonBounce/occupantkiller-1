════════════════════════════════════════════════════════════════════
  OCCUPANT KILLER — MICROSITE  ·  Deploy package for HostUpon / cPanel
════════════════════════════════════════════════════════════════════

WHAT'S IN THIS ZIP
------------------
  index.html ............ Landing page (game pitch, features, tokenomics)
  assets/
    site.css ............ Styling (mimics the in-game tactical HUD look)
    site.js ............. Gallery loader, donut chart, counters
    data.js ............. Weapon roster + tokenomics data
  gallery/
    *.jpg ............... 1000+ real in-engine gameplay screenshots
    manifest.json ....... List the gallery reads to display every shot
  play/
    index.html + *.js ... The FULL playable game (runs in-browser)
    gamemusic/ .......... Soundtrack
  README-DEPLOY.txt ..... This file


HOW TO UPLOAD (cPanel / HostUpon shared hosting)
------------------------------------------------
1. Log into cPanel → File Manager.
2. Go to the folder you want the site in:
      - whole domain  -> public_html/
      - subfolder     -> public_html/occupantkiller/   (then visit /occupantkiller/)
3. Upload this ZIP into that folder.
4. Right-click the ZIP in File Manager → "Extract".
5. Done. Visit your domain. The landing page loads; "PLAY FREE"
   opens play/index.html.

No database, no Node.js, no special PHP needed. Everything is static
HTML/CSS/JS — exactly what HostUpon shared hosting serves out of the box.


NOTES
-----
* The game in /play/ runs 100% client-side (Three.js / WebGL). It works
  with no backend. Online extras (cloud save, leaderboards, on-chain
  $OKC claims) are optional and require the separate Node server —
  the game silently runs in offline mode without them.

* The gallery auto-loads every image listed in gallery/manifest.json.
  To add or remove screenshots later, just edit that JSON list (or drop
  a new manifest); the page adapts. If manifest.json is missing, the
  page falls back to probing gallery/0001.png… sequentially.

* Recommended: keep the whole folder structure intact. Relative paths
  are used throughout so it works in a subfolder or at the domain root.

* Mobile is supported (touch joysticks + look controls). The landing
  page is fully responsive.

* For best first-load speed you can enable gzip in cPanel (Optimize
  Website → Compress All Content) — the JS bundle compresses well.

$OKC is an in-game utility/reward token. Figures reflect the current
build and are subject to change before TGE. Not financial advice.
