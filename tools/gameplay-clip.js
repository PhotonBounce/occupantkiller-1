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
  // Cycle weapons through the real API (digit keys are unreliable headless).
  window.__wpnSwap = setInterval(function () {
    try { if (window.Weapons && Weapons.switchNext) Weapons.switchNext(); } catch (e) { }
  }, 2500);
  window.__bot = setInterval(function () {
    try {
      var cam = window.GameManager && GameManager.getCamera && GameManager.getCamera();
      if (!cam || !window.Enemies || !Enemies.getAll) return;
      var all = Enemies.getAll() || [];
      var alive = 0, best = null, bd = 1e12;
      for (var i = 0; i < all.length; i++) {
        var e = all[i]; if (!e || e.alive === false) continue;
        var m = e.mesh || e.group; if (!m || !m.position) continue;
        alive++;
        var dx = m.position.x - cam.position.x;
        var dy = (m.position.y + 1.0) - cam.position.y;
        var dz = m.position.z - cam.position.z;
        var d2 = dx * dx + dz * dz;
        if (d2 < bd) { bd = d2; best = { dx: dx, dy: dy, dz: dz }; }
      }
      // Falling alive-count across ticks is the kill signal.
      if (window.__botPrevAlive != null && alive < window.__botPrevAlive) {
        window.__botKills += (window.__botPrevAlive - alive);
      }
      window.__botPrevAlive = alive;
      window.__botTargets = alive;
      if (best && window.CameraSystem && CameraSystem.setYaw) {
        var horiz = Math.sqrt(best.dx * best.dx + best.dz * best.dz);
        CameraSystem.setYaw(Math.atan2(-best.dx, -best.dz));
        CameraSystem.setPitch(Math.atan2(best.dy, horiz));
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
  try {
    await pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
    await pg.waitForFunction(() => ['THREE', 'VoxelWorld', 'Weapons', 'Enemies', 'HUD', 'GameManager'].every(m => typeof window[m] !== 'undefined') && !!window.GameManager.startGame, { timeout: 180000 });
    console.log('[' + tag + '] booted ' + el());

    await pg.evaluate((i) => { window.__chosenStartStage = i; GameManager.startGame(); }, STAGE);
    await pg.waitForTimeout(2500);
    try { await pg.mouse.click(W / 2, H / 2); } catch (e) { }
    await pg.waitForTimeout(4000);
    // God mode: invincible + every weapon unlocked.
    try { await pg.keyboard.press('Control+Shift+G'); } catch (e) { }
    await pg.waitForTimeout(500);
    await pg.evaluate(BOT_SRC);
    console.log('[' + tag + '] playing ' + el());

    const shots = [];
    const digits = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0'];
    const end = Date.now() + SECS * 1000;
    let tick = 0, nextShot = Date.now(), shotN = 0;
    while (Date.now() < end) {
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
        god: !!(window.GameManager && GameManager.isGodMode && GameManager.isGodMode())
      };
    });
    console.log('[' + tag + '] RESULT ' + JSON.stringify(stats) + ' shots=' + shots.length + ' ' + el());
    fs.writeFileSync(path.join(OUT, tag + '-stats.json'), JSON.stringify({ stage: STAGE, secs: SECS, shots: shots, stats: stats }, null, 1));
  } catch (e) {
    console.log('[' + tag + '] EXCEPTION ' + (e.message || e).slice(0, 200));
  }
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
