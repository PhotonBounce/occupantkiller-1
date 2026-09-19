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
    STAGES=a,b,c         several missions in one run (overrides STAGE)
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
// A list lets one job cover several missions from a single boot. The 24-job
// fan-out this replaced exceeded the runner concurrency available, so most
// shards sat waiting rather than running.
const STAGES = (process.env.STAGES || '').split(',').map(x => x.trim()).filter(Boolean).map(Number);
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
const errs = [];
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pad = n => String(n).padStart(3, '0');

const T0 = Date.now();
function log(m) {
  process.stdout.write('[' + ((Date.now() - T0) / 1000).toFixed(1) + 's] ' + m + '\n');
}

/* Every call that can hang gets an explicit deadline and a name.
 *
 * Four capture jobs in a row burned the full hour and printed NOTHING — not
 * one line — then were killed with node and chrome both still alive. Nothing
 * in the boot path can take that long: goto is capped at 60s and both boot
 * waits at 180/240s, and each of those either logs or throws. The calls that
 * CAN hang forever are browser.newContext() and context.newPage(), because
 * Playwright accepts no timeout on either; when the browser wedges bringing up
 * SwiftShader they simply never return.
 *
 * Racing a timer cannot cancel the underlying call, but it lets us abandon
 * that browser and bring up a fresh one — and, just as importantly, the label
 * lands in the log, so the next failure names itself instead of costing
 * another hour of guessing.
 */
function deadline(p, ms, label) {
  let t;
  return Promise.race([
    p,
    new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timed out after ' + ms + 'ms in: ' + label)), ms); }),
  ]).finally(() => clearTimeout(t));
}

let browser = null;
let pg = null;
let stageName = null;

// Written after every single frame, not once at the end. When a job is killed
// at the runner limit the uploaded artifact still describes what was captured,
// instead of the run being a total loss.
function writeManifest() {
  try {
    fs.writeFileSync(path.join(OUT, 'manifest-' + SHARD + '.json'), JSON.stringify({
      shard: SHARD, mode: MODE, stage: STAGE, stageName, shots, pageErrors: errs.slice(0, 6),
    }, null, 1));
  } catch (e) { log('manifest write failed: ' + e.message); }
}

async function finish(code) {
  writeManifest();
  log(shots.length + ' shots -> ' + OUT + ' (manifest-' + SHARD + '.json)');
  if (errs.length) log('page errors: ' + errs.slice(0, 4).join(' | '));
  try { if (browser) await deadline(browser.close(), 10000, 'browser.close'); } catch (e) {}
  try { server.close(); } catch (e) {}
  process.exit(code);
}

// Stop with time to spare before the runner's own timeout, so the shots taken
// so far are still uploaded. A job that dies at the limit uploads nothing.
const BUDGET_MS = parseInt(process.env.BUDGET_MS || String(40 * 60 * 1000), 10);
setTimeout(() => {
  log('BUDGET REACHED (' + (BUDGET_MS / 60000).toFixed(0) + ' min) — stopping with ' + shots.length + ' shots');
  finish(shots.length ? 0 : 1);
}, BUDGET_MS).unref();

process.on('unhandledRejection', (e) => {
  log('UNHANDLED: ' + (e && e.message ? e.message : String(e)));
  finish(shots.length ? 0 : 1);
});

// Bring up browser + page + booted game. Retried as a unit: if the wedge is in
// context/page creation, the only cure is a different browser process.
async function bringUp(attempt) {
  log('attempt ' + attempt + ': launching chromium');
  browser = await deadline(chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--mute-audio', '--no-sandbox'],
  }), 120000, 'chromium.launch');
  log('browser up');

  const ctx = await deadline(browser.newContext({ viewport: { width: VW, height: VH } }), 90000, 'newContext');
  log('context up');
  // Present as a returning player so the full start screen (not QUICK START) is live.
  await deadline(ctx.addInitScript(() => { try { localStorage.setItem('ok_has_played', '1'); } catch (e) {} }), 30000, 'addInitScript');

  pg = await deadline(ctx.newPage(), 90000, 'newPage');
  log('page up');
  pg.on('pageerror', e => errs.push(e.message));

  await deadline(pg.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 60000 }), 75000, 'goto');
  log('navigated');

  await pg.waitForFunction(
    () => typeof window.GameManager !== 'undefined' && typeof window.Weapons !== 'undefined' && typeof window.Enemies !== 'undefined',
    { timeout: 180000 }).catch(() => log('[warn] game globals never appeared; continuing'));
  log('globals up');

  // Wait for the boot bar to actually finish. Starting on globals alone races
  // the world build and yields a frozen-looking first frame.
  await pg.waitForFunction(() => {
    const p = document.getElementById('boot-preloader');
    return !p || p.style.opacity === '0' || getComputedStyle(p).display === 'none';
  }, { timeout: 240000 }).catch(() => log('[warn] boot bar wait timed out; continuing'));
  log('booted');
}

async function bringUpWithRetry() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await bringUp(attempt);
      return;
    } catch (e) {
      log('bring-up failed: ' + e.message);
      try { if (browser) await deadline(browser.close(), 10000, 'close after failure'); } catch (e2) {}
      browser = null; pg = null;
      if (attempt === 3) throw e;
    }
  }
}

// Jump straight to a mission and arm god mode + clean HUD. Re-run per stage,
// because startGame() resets the loadout and the HUD along with the world.
async function enterStage(stage) {
  await deadline(pg.evaluate((s) => {
    window.__chosenStartStage = s;
    try { GameManager.startGame(); } catch (e) { window.__startErr = String(e); }
  }, stage), 30000, 'startGame stage ' + stage);

  await pg.waitForFunction(() => GameManager.getState && GameManager.getState() === 'playing', { timeout: 120000 })
    .catch(() => log('[warn] stage ' + stage + ': state never reached playing'));
  await pg.waitForTimeout(6000);   // let the world settle and shaders prewarm

  const info = await deadline(pg.evaluate((cleanHud) => {
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
      if (cleanHud && window.Cinematic) {
        window.Cinematic.set(false);   // reset across stages, then re-apply
        o.cleanHud = window.Cinematic.set(true);
      }
    } catch (e) { o.err = String(e); }
    return o;
  }, CLEAN_HUD), 60000, 'arm stage ' + stage);

  stageName = info.stageName || stageName;
  log('stage ' + stage + ' ready: ' + JSON.stringify(info));
  return info;
}

// One combined per-frame step: keep enemies on the field, aim at the nearest
// one and pull the real trigger, so muzzle flash and impacts are genuine.
async function beat(fireMs) {
  return await deadline(pg.evaluate(async (fms) => {
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
  }, fireMs), 30000, 'beat').catch(e => ({ err: e.message }));
}

async function snap(name, meta) {
  const file = name + '.jpg';
  const dest = path.join(OUT, file);
  let ok = false;
  // Take JPEG straight off the renderer. Playwright's page.screenshot() blocks
  // on font readiness before it will shoot, and in this environment that stall
  // hits essentially every frame — measured locally as "waiting for fonts to
  // load". Reading the canvas touches no page lifecycle at all.
  // GameManager.captureFrame() does the same render but returns PNG, and 315
  // lossless 720p frames make a gallery far too heavy to serve.
  try {
    const durl = await deadline(pg.evaluate(() => {
      try {
        const r = GameManager.getRenderer(), sc = GameManager.getScene(), cam = GameManager.getCamera();
        if (!r || !sc || !cam) return GameManager.captureFrame();
        r.render(sc, cam);
        return r.domElement.toDataURL('image/jpeg', 0.82);
      } catch (e) {
        try { return GameManager.captureFrame(); } catch (e2) { return null; }
      }
    }), 30000, 'renderer capture');
    if (durl && durl.indexOf('data:image/') === 0) {
      fs.writeFileSync(dest, Buffer.from(durl.split(',')[1], 'base64'));
      ok = true;
    }
  } catch (e) { log('  [renderer capture] ' + e.message); }
  if (!ok) {
    // Only if the renderer refused. Kept short so a bad frame cannot dominate.
    try {
      await pg.screenshot({ path: dest, type: 'jpeg', quality: 82, timeout: 8000, animations: 'disabled' });
      meta.via = 'screenshot';
      ok = true;
    } catch (e) { /* skipped below */ }
  }
  if (!ok) { log('  [SKIPPED] ' + file); return; }
  shots.push(Object.assign({ file }, meta));
  writeManifest();
  log('  ' + file + '  ' + JSON.stringify(meta));
}

async function captureWeapons(setup) {
  const count = Math.min(setup.weaponCount || 0, WEND + 1);
  for (let i = WSTART; i < count; i++) {
    const info = await deadline(pg.evaluate((idx) => {
      try {
        Weapons.switchTo(idx);
        Weapons.refillAllAmmo && Weapons.refillAllAmmo();
        return { name: Weapons.getCurrentName(), idx: Weapons.getCurrentIdx() };
      } catch (e) { return { err: String(e) }; }
    }, i), 30000, 'switch weapon ' + i).catch(e => ({ err: e.message }));
    if (info.err) { log('  weapon ' + i + ' skipped: ' + info.err); continue; }
    // Let the weapon draw/equip, then fire into the frame before capturing.
    await pg.waitForTimeout(900);
    const r = await beat(420);
    if (r.err) log('  [beat] ' + r.err);
    await pg.waitForTimeout(500);
    await snap('wpn-' + pad(i) + '-' + slug(info.name), {
      kind: 'weapon', weaponIdx: i, weapon: info.name,
      stage: setup.stage, stageName: setup.stageName, enemies: r.enemies, beatErr: r.err,
    });
  }
}

async function captureStages(stageList, setup) {
  for (let si = 0; si < stageList.length; si++) {
    // One bad mission must not cost the rest of the shard. Each is entered and
    // played inside its own guard, so a stage that refuses to start just gets
    // skipped and the job moves on.
    try {
      // The first stage was entered before the loop so a single-stage run
      // behaves exactly as before; the rest re-enter from the same boot.
      if (si > 0) setup = await enterStage(stageList[si]);
      for (let f = 0; f < FRAMES; f++) {
        const r = await beat(300);
        if (r.err) log('  [beat] ' + r.err);
        await snap('stage-' + pad(stageList[si]) + '-' + slug(setup.stageName || 'stage') + '-f' + pad(f), {
          kind: 'stage', stage: setup.stage, stageName: setup.stageName,
          frame: f, tSec: f * (INTERVAL_MS / 1000),
          weapon: r.weapon, enemies: r.enemies, beatErr: r.err,
        });
        if (f < FRAMES - 1) await pg.waitForTimeout(INTERVAL_MS);
      }
    } catch (e) {
      log('stage ' + stageList[si] + ' aborted: ' + e.message);
    }
  }
}

server.listen(PORT, async () => {
  log('serving ' + ROOT + ' on :' + PORT + '  mode=' + MODE + ' shard=' + SHARD);
  try {
    await bringUpWithRetry();
    const stageList = STAGES.length ? STAGES : [STAGE];
    const setup = await enterStage(stageList[0]);
    if (MODE === 'weapons') await captureWeapons(setup);
    else await captureStages(stageList, setup);
  } catch (e) {
    // A shard that dies partway must still hand back what it captured.
    log('capture aborted: ' + e.message);
  }
  await finish(shots.length ? 0 : 1);
});
