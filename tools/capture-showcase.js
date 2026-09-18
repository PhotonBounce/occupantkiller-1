#!/usr/bin/env node
/*
  capture-showcase.js — gameplay capture for the public gallery.

  Two modes, both driven through the game's own APIs so what lands in the
  screenshot is real play, not a posed scene:

    MODE=stage    play one stage in god mode and capture every INTERVAL_MS
    MODE=weapons  cycle a range of weapons on one stage, firing each

  God mode is on for both: it unlocks every weapon, makes the player
  invincible and makes them invisible to the AI. The first two are what let a
  capture run unattended; the third means enemies keep patrolling instead of
  converging on the camera, which reads better in a gallery shot anyway.

  Env:
    MODE=stage|weapons   what to capture            (default stage)
    STAGE=N              stage index to play        (default 0)
    FRAMES=N             frames for stage mode      (default 12)
    INTERVAL_MS=N        wall-clock gap per frame   (default 5000)
    WSTART / WEND        weapon index range         (weapons mode)
    OUT=dir              output directory
    VW / VH              viewport                   (default 1280x720)
    CLEAN_HUD=0          keep the full HUD (default strips it)
    PORT=N               static server port

  Writes <OUT>/*.jpg plus <OUT>/manifest-<shard>.json describing each shot.
*/
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
catch (e) { ({ chromium } = require('playwright')); }

const ROOT = process.env.OK_ROOT || path.resolve(__dirname, '..');
const MODE = process.env.MODE || 'stage';
const STAGE = parseInt(process.env.STAGE || '0', 10);
const FRAMES = parseInt(process.env.FRAMES || '12', 10);
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '5000', 10);
const WSTART = parseInt(process.env.WSTART || '0', 10);
const WEND = parseInt(process.env.WEND || '999', 10);
const VW = parseInt(process.env.VW || '1280', 10);
const VH = parseInt(process.env.VH || '720', 10);
const PORT = parseInt(process.env.PORT || '4801', 10);
const OUT = process.env.OUT || path.join(ROOT, 'showcase-out');
// Clean HUD is on by default: these images are the game's shop window.
const CLEAN_HUD = process.env.CLEAN_HUD !== '0';
const SHARD = process.env.SHARD || (MODE === 'weapons' ? `w${WSTART}-${WEND}` : `s${STAGE}`);

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

const shots = [];
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pad = n => String(n).padStart(3, '0');

server.listen(PORT, async () => {
  const t0 = Date.now();
  const b = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--mute-audio', '--no-sandbox'],
  });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH } });
  // Present as a returning player so the full start screen (not QUICK START) is live.
  await ctx.addInitScript(() => { try { localStorage.setItem('ok_has_played', '1'); } catch (e) {} });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(e.message));

  await pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 60000 });
  await pg.waitForFunction(
    () => typeof window.GameManager !== 'undefined' && typeof window.Weapons !== 'undefined' && typeof window.Enemies !== 'undefined',
    { timeout: 180000 });
  // Wait for the boot bar to actually finish. Starting on globals alone races
  // the world build and yields a frozen-looking first frame.
  await pg.waitForFunction(() => {
    const p = document.getElementById('boot-preloader');
    return !p || p.style.opacity === '0' || getComputedStyle(p).display === 'none';
  }, { timeout: 240000 }).catch(() => console.log('[warn] boot bar wait timed out; continuing'));
  console.log('booted in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');

  // Jump straight to the stage under test and arm god mode.
  await pg.evaluate((stage) => {
    window.__chosenStartStage = stage;
    try { GameManager.startGame(); } catch (e) { window.__startErr = String(e); }
  }, STAGE);
  await pg.waitForFunction(() => GameManager.getState && GameManager.getState() === 'playing', { timeout: 120000 })
    .catch(() => console.log('[warn] state never reached playing'));
  await pg.waitForTimeout(6000);   // let the world settle and shaders prewarm

  const setup = await pg.evaluate((cleanHud) => {
    const o = {};
    try {
      if (!GameManager.isGodMode()) GameManager.toggleGodMode();
      o.god = GameManager.isGodMode();
      o.weaponCount = Weapons.getWeaponCount();
      for (let i = 0; i < o.weaponCount; i++) { try { Weapons.unlockWeapon(i); } catch (e) {} }
      try { Weapons.refillAllAmmo(); } catch (e) {}
      o.stage = GameManager.getCurrentStage();
      o.stageName = (GameManager.getCurrentStageInfo && GameManager.getCurrentStageInfo().name) || null;
      // Strip the HUD down to crosshair/health/ammo/weapon. With the full HUD
      // up, roughly twenty overlapping panels cover the frame and the shot
      // shows interface instead of game.
      if (cleanHud && window.Cinematic) o.cleanHud = window.Cinematic.set(true);
    } catch (e) { o.err = String(e); }
    return o;
  }, CLEAN_HUD);
  console.log('setup: ' + JSON.stringify(setup));

  // One combined per-frame step: keep enemies on the field, aim at the nearest
  // one and pull the real trigger, so muzzle flash and impacts are genuine.
  async function beat(fireMs) {
    return await pg.evaluate(async (fms) => {
      const out = {};
      try {
        const alive = Enemies.getAliveCount ? Enemies.getAliveCount() : (Enemies.getAll() || []).filter(e => e && e.alive).length;
        if (alive < 5) {
          for (let i = 0; i < 6; i++) {
            try { if (Enemies.spawnReinforcement) Enemies.spawnReinforcement(); else if (Enemies.spawnSingle) Enemies.spawnSingle(); } catch (e) {}
          }
        }
        const cam = GameManager.getCamera();
        const cp = cam.getWorldPosition(new THREE.Vector3());
        const es = (Enemies.getAll() || []).filter(e => e && e.alive && e.mesh);
        if (es.length) {
          let best = null, bd = 1e9;
          for (const e of es) { const d = e.mesh.position.distanceTo(cp); if (d < bd) { bd = d; best = e; } }
          const dx = best.mesh.position.x - cp.x, dz = best.mesh.position.z - cp.z, dy = (best.mesh.position.y + 1.2) - cp.y;
          if (window.CameraSystem) {
            CameraSystem.setYaw(Math.atan2(-dx, -dz));
            CameraSystem.setPitch(Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)));
          }
          out.targetDist = +bd.toFixed(1);
        } else if (window.CameraSystem && CameraSystem.getYaw) {
          CameraSystem.setYaw(CameraSystem.getYaw() + 0.6);
        }
        out.enemies = es.length;
        if (GameManager._testFireStart) {
          GameManager._testFireStart();
          setTimeout(() => { try { GameManager._testFireStop && GameManager._testFireStop(); } catch (e) {} }, fms);
        }
        out.weapon = Weapons.getCurrentName();
        out.hp = GameManager.getPlayer ? GameManager.getPlayer().health : null;
      } catch (e) { out.err = String(e); }
      return out;
    }, fireMs);
  }

  async function snap(name, meta) {
    const file = `${name}.jpg`;
    const dest = path.join(OUT, file);
    // Playwright's screenshot blocks on "waiting for fonts to load", which on a
    // software rasteriser running the game at a few fps can outlast any sane
    // timeout. Fall back to the game's own canvas capture, which goes straight
    // to the renderer and cannot stall on page lifecycle.
    let ok = false;
    try {
      await pg.screenshot({ path: dest, type: 'jpeg', quality: 82, timeout: 20000, animations: 'disabled' });
      ok = true;
    } catch (e) {
      console.log('  [screenshot timed out, using captureFrame] ' + file);
      try {
        const durl = await pg.evaluate(() => { try { return GameManager.captureFrame(); } catch (e) { return null; } });
        if (durl && durl.indexOf('data:image/') === 0) {
          fs.writeFileSync(dest, Buffer.from(durl.split(',')[1], 'base64'));
          meta.via = 'captureFrame';
          ok = true;
        }
      } catch (e2) { /* fall through to the skip below */ }
    }
    if (!ok) { console.log('  [SKIPPED] ' + file); return; }
    shots.push(Object.assign({ file }, meta));
    console.log('  ' + file + '  ' + JSON.stringify(meta));
  }

  try {
    if (MODE === 'weapons') {
      const count = Math.min(setup.weaponCount || 0, WEND + 1);
      for (let i = WSTART; i < count; i++) {
        const info = await pg.evaluate((idx) => {
          try {
            Weapons.switchTo(idx);
            Weapons.refillAllAmmo && Weapons.refillAllAmmo();
            return { name: Weapons.getCurrentName(), idx: Weapons.getCurrentIdx() };
          } catch (e) { return { err: String(e) }; }
        }, i);
        if (info.err) { console.log('  weapon ' + i + ' skipped: ' + info.err); continue; }
        // Let the weapon draw/equip, then fire into the frame before capturing.
        await pg.waitForTimeout(900);
        const r = await beat(420);
        if (r.err) console.log('  [beat] ' + r.err);
        await pg.waitForTimeout(500);
        await snap(`wpn-${pad(i)}-${slug(info.name)}`, {
          kind: 'weapon', weaponIdx: i, weapon: info.name,
          stage: setup.stage, stageName: setup.stageName, enemies: r.enemies, beatErr: r.err,
        });
      }
    } else {
      for (let f = 0; f < FRAMES; f++) {
        const r = await beat(300);
        if (r.err) console.log('  [beat] ' + r.err);
        await snap(`stage-${pad(STAGE)}-${slug(setup.stageName || 'stage')}-f${pad(f)}`, {
          kind: 'stage', stage: setup.stage, stageName: setup.stageName,
          frame: f, tSec: f * (INTERVAL_MS / 1000),
          weapon: r.weapon, enemies: r.enemies, beatErr: r.err,
        });
        if (f < FRAMES - 1) await pg.waitForTimeout(INTERVAL_MS);
      }
    }
  } catch (e) {
    // A shard that dies partway must still hand back what it captured.
    console.log('capture aborted: ' + e.message);
  }

  fs.writeFileSync(path.join(OUT, `manifest-${SHARD}.json`),
    JSON.stringify({ shard: SHARD, mode: MODE, stage: STAGE, stageName: setup.stageName, shots, pageErrors: errs.slice(0, 6) }, null, 1));
  console.log(`\n${shots.length} shots -> ${OUT} (manifest-${SHARD}.json)`);
  if (errs.length) console.log('page errors: ' + errs.slice(0, 4).join(' | '));
  await b.close(); server.close();
  process.exit(shots.length ? 0 : 1);
});
