// Gameplay clip recorder: plays a level in god mode with an auto-aim kill bot,
// switching weapons throughout, while recording a video and saving a screenshot
// every 5 seconds.
//
// Runs headless on a software GL stack (no GPU), so the recorded framerate is
// whatever the renderer manages — the clip is real-time, not sped up.
//
// Usage: PORT=4500 STAGE=0 SECS=30 OUT=/tmp/clips node tools/gameplay-clip.js
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
catch (e) { ({ chromium } = require('playwright')); }

const ROOT = __dirname.replace(/\/tools$/, '');
const PORT = parseInt(process.env.PORT || '4500', 10);
const STAGE = parseInt(process.env.STAGE || '0', 10);
const SECS = parseInt(process.env.SECS || '30', 10);
const OUT = process.env.OUT || '/tmp/clips';
const W = parseInt(process.env.VW || '640', 10), H = parseInt(process.env.VH || '360', 10);
fs.mkdirSync(OUT, { recursive: true });

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(fp, (e, d) => {
    if (e) { s.writeHead(404); return s.end('404'); }
    s.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' }); s.end(d);
  });
});

// In-page kill bot: aims the camera at the nearest living enemy and reports kills.
function BOT_SRC() {
  window.__botKills = 0; window.__botTargets = 0;
  window.__botPrevAlive = null;
  // Headless has no real pointer lock, and the game deliberately swallows any
  // click made while unlocked ("don't fire on the lock-acquiring click") — so
  // without this the bot could never fire a single shot. Report the canvas as
  // the locked element so input is treated as in-game.
  try {
    var _cv = document.querySelector('#game-container canvas') || document.querySelector('canvas');
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: function () { return _cv; } });
  } catch (e) { }
  // Cycle only through weapons that can actually kill infantry. switchNext()
  // walks all 125 entries, so the bot spent most of each clip holding an Army
  // Shovel, an Igla anti-air missile or a Makarov — hence 0 kills on levels
  // with 95+ enemies alive.
  window.__goodW = [];
  try {
    var GOOD = /^(ASSAULT|RIFLE|LMG|SMG|HMG|HMG_HEAVY|SNIPER|SHOTGUN|SILENT|NATO)$/;
    var wn = (window.Weapons && Weapons.getWeaponCount) ? Weapons.getWeaponCount() : 0;
    for (var wi = 0; wi < wn; wi++) {
      var wd = Weapons.getWeaponDef ? Weapons.getWeaponDef(wi) : null;
      if (wd && GOOD.test(String(wd.type || ''))) window.__goodW.push(wi);
    }
  } catch (e) { }
  window.__wIdx = 0;
  try { if (window.__goodW.length && Weapons.switchTo) Weapons.switchTo(window.__goodW[0]); } catch (e) { }
  window.__wpnSwap = setInterval(function () {
    try {
      if (!window.__goodW.length || !Weapons.switchTo) return;
      window.__wIdx = (window.__wIdx + 1) % window.__goodW.length;
      Weapons.switchTo(window.__goodW[window.__wIdx]);
    } catch (e) { }
  }, 2500);
  window.__bot = setInterval(function () {
    try {
      var cam = window.GameManager && GameManager.getCamera && GameManager.getCamera();
      if (!cam || !window.Enemies || !Enemies.getAll) return;
      var all = Enemies.getAll() || [];
      var alive = 0, best = null, bd = 1e12;
      if (!window.__tv) window.__tv = new THREE.Vector3();
      var cw = cam.getWorldPosition(window.__tv2 || (window.__tv2 = new THREE.Vector3()));
      for (var i = 0; i < all.length; i++) {
        var e = all[i]; if (!e || e.alive === false) continue;
        var m = e.mesh || e.group; if (!m || !m.position) continue;
        alive++;
        // World position — enemy meshes hang off parent groups, so the local
        // .position aimed the camera at empty sky.
        var wp = m.getWorldPosition(window.__tv);
        var dx = wp.x - cw.x;
        var dy = (wp.y + 1.1) - cw.y;   // chest height
        var dz = wp.z - cw.z;
        var d2 = dx * dx + dz * dz;
        if (d2 > 90 * 90) continue;      // ignore anything absurdly far
        if (d2 < bd) { bd = d2; best = { dx: dx, dy: dy, dz: dz }; }
      }
      // Falling alive-count across ticks is the kill signal.
      if (window.__botPrevAlive != null && alive < window.__botPrevAlive) {
        window.__botKills += (window.__botPrevAlive - alive);
      }
      window.__botPrevAlive = alive;
      window.__botTargets = alive;
      window.__nearestD = best ? Math.round(Math.sqrt(bd)) : -1;
      window.__hasCam = !!(window.CameraSystem && CameraSystem.setYaw);
      if (best && window.CameraSystem && CameraSystem.setYaw) {
        var horiz = Math.sqrt(best.dx * best.dx + best.dz * best.dz);
        CameraSystem.setYaw(Math.atan2(-best.dx, -best.dz));
        CameraSystem.setPitch(Math.atan2(best.dy, horiz));
        window.__camYaw = CameraSystem.getYaw ? +CameraSystem.getYaw().toFixed(2) : null;
        // Close the distance: enemies often spawn beyond the fog, so standing
        // still produced empty grey footage and no kills.
        window.__wantAdvance = Math.sqrt(bd) > 9;
      }
    } catch (e) { }
  }, 80);
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const t0 = Date.now(); const el = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--mute-audio'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: OUT, size: { width: W, height: H } } });
  const pg = await ctx.newPage();
  const tag = 'stage-' + String(STAGE).padStart(2, '0');

  // Hard watchdog. A level that never finishes building blocks inside the page,
  // so the run would sit there until the whole CI job was killed — that is what
  // stalled 19 levels behind one bad level. Salvage the video and move on.
  const HARD = parseInt(process.env.HARD_MS || '270000', 10);
  let finished = false;
  const watchdog = setTimeout(async () => {
    if (finished) return;
    console.log('[' + tag + '] HARD TIMEOUT after ' + el() + ' — salvaging');
    try { const v = pg.video(); await ctx.close(); if (v) { const p = await v.path(); fs.renameSync(p, path.join(OUT, tag + '.webm')); } } catch (e) { }
    try { await browser.close(); } catch (e) { }
    try { server.close(); } catch (e) { }
    process.exit(0);
  }, HARD);
  try {
    await pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
    await pg.waitForFunction(() => ['THREE', 'VoxelWorld', 'Weapons', 'Enemies', 'HUD', 'GameManager'].every(m => typeof window[m] !== 'undefined') && !!window.GameManager.startGame, { timeout: 90000 });
    console.log('[' + tag + '] booted ' + el());

    // Kick off asynchronously: a heavy level build blocks synchronously inside
    // startGame(), and awaiting that evaluate hung the whole job.
    await pg.evaluate((i) => { window.__chosenStartStage = i; setTimeout(function () { try { GameManager.startGame(); } catch (e) { } }, 0); }, STAGE);
    await pg.waitForTimeout(2500);
    try { await pg.mouse.click(W / 2, H / 2); } catch (e) { }
    // Wait for actual gameplay rather than a fixed sleep, so we never record a
    // loading screen — but bounded, so a slow level can't stall the job.
    try {
      await pg.waitForFunction(() => window.GameManager && GameManager.getState && GameManager.getState() === 'playing', { timeout: 150000 });
    } catch (e) { console.log('[' + tag + '] not in PLAYING state in time — recording anyway'); }
    await pg.waitForTimeout(1500);
    // God mode: invincible + every weapon unlocked.
    try { await pg.keyboard.press('Control+Shift+G'); } catch (e) { }
    await pg.waitForTimeout(500);
    await pg.evaluate(BOT_SRC);
    console.log('[' + tag + '] playing ' + el());

    const shots = [];
    const digits = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
    const end = Date.now() + SECS * 1000;
    let tick = 0, nextShot = Date.now(), shotN = 0, advancing = false;
    while (Date.now() < end) {
      // Walk toward the target when it's far — enemies spawn beyond the fog, so
      // standing still gave empty grey footage and no kills.
      try {
        const want = await pg.evaluate(() => !!window.__wantAdvance);
        if (want && !advancing) { await pg.keyboard.down('KeyW'); advancing = true; }
        else if (!want && advancing) { await pg.keyboard.up('KeyW'); advancing = false; }
      } catch (e) { }
      // fire in bursts
      try { await pg.mouse.down(); } catch (e) { }
      await pg.waitForTimeout(320);
      try { await pg.mouse.up(); } catch (e) { }
      // switch weapons often so the clip shows the arsenal
      if (tick % 3 === 2) { try { await pg.keyboard.press(digits[(tick / 3 | 0) % digits.length]); } catch (e) { } }
      await pg.waitForTimeout(120);
      // screenshot every 5s
      if (Date.now() >= nextShot) {
        nextShot += 5000; shotN++;
        try {
          const d = await pg.evaluate(() => { try { return GameManager.captureFrame && GameManager.captureFrame(); } catch (e) { return null; } });
          if (d && d.indexOf('data:image/png') === 0) {
            const f = path.join(OUT, tag + '-t' + String((shotN - 1) * 5).padStart(2, '0') + 's.png');
            fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); shots.push(path.basename(f));
          }
        } catch (e) { }
      }
      tick++;
    }
    try { if (advancing) await pg.keyboard.up('KeyW'); } catch (e) { }
    const stats = await pg.evaluate(() => {
      var txt = document.body.innerText || '';
      var kills = (txt.match(/KILLS[:\s]*([0-9]+)/) || [])[1];
      var stage = (txt.match(/STAGE\s*\d+\s*:\s*([A-Z0-9 \-—']+?)(?:\s{2,}|SCORE|WAVE|$)/) || [])[1];
      return {
        hudKills: kills ? +kills : null,
        botKills: window.__botKills || 0,
        aliveNow: window.__botTargets || 0,
        stageName: stage ? stage.trim() : null,
        weapon: (window.Weapons && Weapons.getCurrentName) ? Weapons.getCurrentName() : null,
        goodWeapons: (window.__goodW || []).length,
        nearestDist: window.__nearestD,
        camYaw: window.__camYaw,
        hasCameraSystem: !!window.__hasCam,
        god: !!(window.GameManager && GameManager.isGodMode && GameManager.isGodMode())
      };
    });
    console.log('[' + tag + '] RESULT ' + JSON.stringify(stats) + ' shots=' + shots.length + ' ' + el());
    fs.writeFileSync(path.join(OUT, tag + '-stats.json'), JSON.stringify({ stage: STAGE, secs: SECS, shots: shots, stats: stats }, null, 1));
  } catch (e) {
    console.log('[' + tag + '] EXCEPTION ' + (e.message || e).slice(0, 200));
  }
  finished = true; clearTimeout(watchdog);
  const vid = pg.video();
  await ctx.close();                       // finalises the video file
  try {
    if (vid) {
      const p = await vid.path();
      const dest = path.join(OUT, tag + '.webm');
      fs.renameSync(p, dest);
      console.log('[' + tag + '] video -> ' + dest + ' (' + fs.statSync(dest).size + 'B)');
    }
  } catch (e) { console.log('[' + tag + '] video save failed: ' + e.message); }
  await browser.close(); server.close();
  process.exit(0);
})();
