#!/usr/bin/env node
/*
  qa-play.js — actually PLAY the game and report what happened.

  The other qa-* scripts and the desktop probes drive the game by calling into
  its modules (DroneSystem.fireAttack(), Enemies.spawnSingle(), ...). That
  verifies the systems but skips the entire input path, which is where a
  player's problems actually start: a key that does nothing, a pointer lock
  that drops you into the pause menu, a weapon that will not switch. This one
  presses keys and moves the mouse like a person and looks at what comes back.

  Usage:
    node tools/qa-play.js [--stage N] [--secs N] [--shots N] [--out DIR] [--port N]
*/
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = '/home/user/occupantkiller-1';
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const STAGE = parseInt(arg('stage', '0'), 10);
const SECS  = parseInt(arg('secs', '45'), 10);
const SHOTS = parseInt(arg('shots', '6'), 10);
const PORT  = parseInt(arg('port', '4577'), 10);
const OUT   = arg('out', path.join(ROOT, 'tools', 'qa-play-out'));
// Small on purpose. This container has no GPU, so every pixel is rasterised on
// the CPU and fill rate decides whether the game responds to input at all. At
// 960x540 a single 900ms keypress took 19 real seconds to round-trip; at
// 480x270 there are a quarter as many fragments. QA here is about logic and the
// input path, and neither needs a big window.
const W = parseInt(arg('w', '480'), 10), H = parseInt(arg('h', '270'), 10);

fs.mkdirSync(OUT, { recursive: true });
const log = [];
const say = (m) => { console.log(m); log.push(m); };

const server = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(fp, (e, d) => { if (e) { s.writeHead(404); return s.end('404'); } s.end(d); });
});

server.listen(PORT, async () => {
  const t0 = Date.now();
  const T = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(5) + 's';
  const shots = [];
  const shot = async (pg, name) => {
    const f = path.join(OUT, name + '.png');
    await pg.screenshot({ path: f });
    shots.push(name + '.png');
    say(T() + '  shot ' + name);
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage',
           '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();

  // Everything the game complains about, kept for the report. Page errors are
  // the ones that matter — a thrown exception in a handler silently kills that
  // feature for the rest of the session.
  const pageErrors = [], consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  await page.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForFunction(
    () => typeof window.GameManager !== 'undefined' && typeof window.VoxelWorld !== 'undefined'
       && typeof window.THREE !== 'undefined' && typeof window.Enemies !== 'undefined',
    null, { timeout: 300000 });
  say(T() + '  modules present');
  // Wait for the boot bar too. Globals appear well before the world is built,
  // and starting early is not a harmless race: the player spawns into terrain
  // that does not exist yet, and the collision test — which blocks a movement
  // axis when the corners of the player's cylinder are inside solid voxels —
  // then pins them at the spawn point with no way to tell that from a genuinely
  // broken movement system. Cost me a false bug report before I caught it.
  await page.waitForFunction(
    () => { const f = document.getElementById('boot-progress-bar-fill'); return f && f.style.width === '100%'; },
    null, { timeout: 300000 }).catch(() => say(T() + '  WARNING boot bar never reached 100%'));
  say(T() + '  boot complete');

  // Start the stage. __chosenStartStage is an INDEX and index.html resets it to
  // 0 in a load-time IIFE, so it has to be set after that has run, not before.
  await page.evaluate((s) => { window.__QA_START_STAGE = s; window.__chosenStartStage = s; }, STAGE);
  const startedByClick = await page.evaluate(() => {
    const b = document.getElementById('quick-start-btn');
    if (b && b.offsetParent !== null) { b.click(); return true; }
    return false;
  });
  if (!startedByClick) await page.evaluate(() => GameManager.startGame());
  say(T() + '  start requested (' + (startedByClick ? 'clicked QUICK START' : 'startGame()') + ')');

  try {
    await page.waitForFunction(() => GameManager.getState() === 'playing', null, { timeout: 120000 });
  } catch (e) {
    say(T() + '  NEVER REACHED PLAYING — state=' + await page.evaluate(() => GameManager.getState()));
  }
  say(T() + '  state=' + await page.evaluate(() => GameManager.getState()));
  await shot(page, '00-start');

  // A real click on the canvas is a user gesture, which is what lets the page
  // take pointer lock. Without lock the game ignores every mousemove, so
  // without this the "player" can walk but never turn their head.
  // Wait for the adaptive ladder to bottom out before playing. It has an
  // emergency branch that jumps straight to the deepest tier under 15fps, so
  // this costs a few seconds and buys a session that responds to input. Not
  // forced from the outside: letting the game's own calibration do it means
  // the session is played at a setting a real low-end player would also get.
  try {
    await page.waitForFunction(() => window._perfLevel >= 3, null, { timeout: 60000 });
  } catch (e) { say(T() + '  quality ladder did not reach tier 3 (still ' + await page.evaluate(() => window._perfLevel) + ')'); }
  say(T() + '  quality tier=' + await page.evaluate(() => window._perfLevel + '/' + (window.__qualityLabel || '?')));
  await page.mouse.click(Math.floor(W / 2), Math.floor(H / 2));
  await page.waitForTimeout(500);
  const locked = await page.evaluate(() => !!document.pointerLockElement);
  say(T() + '  pointerLock=' + locked);

  // Does a Playwright mouse move actually deliver movementX under lock? If not,
  // fall back to synthesised events — the handler does not check isTrusted.
  const readYaw = () => page.evaluate(() => { try { return +CameraSystem.getYaw().toFixed(4); } catch (e) { return null; } });
  const yawBefore = await readYaw();
  await page.mouse.move(Math.floor(W / 2) + 220, Math.floor(H / 2));
  await page.waitForTimeout(200);
  const yawAfterReal = await readYaw();
  const realMouseWorks = yawBefore !== null && yawAfterReal !== null && yawBefore !== yawAfterReal;
  say(T() + '  mouselook via real mouse: ' + (realMouseWorks ? 'WORKS' : 'NO EFFECT (yaw ' + yawBefore + ' -> ' + yawAfterReal + ')'));

  const look = async (dx, dy) => {
    if (realMouseWorks) {
      const p = await page.evaluate(() => ({ x: window.innerWidth / 2, y: window.innerHeight / 2 }));
      await page.mouse.move(p.x + dx, p.y + dy);
    } else {
      await page.evaluate(([x, y]) => {
        document.dispatchEvent(new MouseEvent('mousemove', { movementX: x, movementY: y, bubbles: true }));
      }, [dx, dy]);
    }
  };

  const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };

  // Movement sanity check, run before anything else and reported explicitly.
  // A session where the player silently never moves still produces a full log
  // of beats and screenshots that all look plausible, which is worse than a
  // failure — so establish up front whether walking works at all.
  const posOf = () => page.evaluate(() => { const p = GameManager.getPlayer(); return [+p.position.x.toFixed(2), +p.position.y.toFixed(2), +p.position.z.toFixed(2)]; });
  const mvBefore = await posOf();
  await hold('KeyW', 2500);
  await page.waitForTimeout(500);
  const mvAfter = await posOf();
  const moved = Math.hypot(mvAfter[0] - mvBefore[0], mvAfter[2] - mvBefore[2]);
  const canMove = moved > 0.2;
  say(T() + '  movement check: ' + (canMove ? 'OK' : 'PLAYER DID NOT MOVE')
      + ' ' + JSON.stringify(mvBefore) + ' -> ' + JSON.stringify(mvAfter) + '  (' + moved.toFixed(2) + 'm)');

  const sample = () => page.evaluate(() => {
    const o = {};
    try { o.state = GameManager.getState(); } catch (e) {}
    try { const p = GameManager.getPlayer(); o.hp = Math.round(p.hp); o.pos = [p.position.x, p.position.y, p.position.z].map(v => +v.toFixed(1)); } catch (e) {}
    try { o.enemies = Enemies.getAliveCount(); } catch (e) {}
    try { o.yaw = +CameraSystem.getYaw().toFixed(3); } catch (e) {}
    try { o.weapon = Weapons.getCurrent && Weapons.getCurrent().name; } catch (e) {}
    try { const r = GameManager.getRenderer(); o.draw = r.info.render.calls; o.progs = r.info.programs ? r.info.programs.length : null; } catch (e) {}
    try { o.wave = window.__hudWave || null; } catch (e) {}
    return o;
  });

  // ── The play loop ──────────────────────────────────────────────────────
  // A rotation of things a player actually does, so a session exercises
  // movement, aiming, firing, reloading, weapon switching and grenades rather
  // than standing still in a corner producing a clean-looking log.
  const beats = [
    { name: 'walk-forward', run: async () => { await hold('KeyW', 900); } },
    { name: 'look-around',  run: async () => { for (let i = 0; i < 6; i++) { await look(120, 0); await page.waitForTimeout(90); } } },
    { name: 'strafe',       run: async () => { await hold('KeyA', 500); await hold('KeyD', 500); } },
    { name: 'fire',         run: async () => { await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); } },
    { name: 'aim-and-fire', run: async () => { await look(-60, 10); await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up(); } },
    { name: 'reload',       run: async () => { await page.keyboard.press('KeyR'); await page.waitForTimeout(400); } },
    { name: 'switch-weapon',run: async () => { await page.keyboard.press('Digit2'); await page.waitForTimeout(300); await page.keyboard.press('Digit1'); } },
    { name: 'sprint',       run: async () => { await page.keyboard.down('ShiftLeft'); await hold('KeyW', 700); await page.keyboard.up('ShiftLeft'); } },
    { name: 'jump',         run: async () => { await page.keyboard.press('Space'); await page.waitForTimeout(400); } },
    { name: 'grenade',      run: async () => { await page.keyboard.press('KeyG'); await page.waitForTimeout(600); } },
  ];

  const timeline = [];
  const deadline = Date.now() + SECS * 1000;
  const shotEvery = Math.max(1, Math.floor((SECS * 1000) / Math.max(1, SHOTS)));
  let nextShot = Date.now() + shotEvery, shotN = 1, beat = 0;

  while (Date.now() < deadline) {
    const b = beats[beat % beats.length]; beat++;
    const before = await sample();
    try { await b.run(); } catch (e) { say(T() + '  beat ' + b.name + ' THREW: ' + e.message.slice(0, 100)); }
    const after = await sample();
    timeline.push({ t: +((Date.now() - t0) / 1000).toFixed(1), beat: b.name, before, after });
    say(T() + '  ' + b.name.padEnd(14) + ' hp=' + after.hp + ' enemies=' + after.enemies
        + ' weapon=' + after.weapon + ' pos=' + JSON.stringify(after.pos));
    if (Date.now() >= nextShot && shotN <= SHOTS) { await shot(page, String(shotN).padStart(2, '0') + '-' + b.name); shotN++; nextShot = Date.now() + shotEvery; }
  }

  await shot(page, '99-final');
  const final = await sample();

  const report = {
    stage: STAGE, seconds: SECS,
    pointerLock: locked, mouselookViaRealMouse: realMouseWorks,
    movementWorks: canMove, movedMetres: +moved.toFixed(2),
    final, timeline, shots,
    pageErrors: pageErrors.slice(0, 20),
    consoleErrors: consoleErrors.slice(0, 20),
  };
  fs.writeFileSync(path.join(OUT, 'qa-play.json'), JSON.stringify(report, null, 1));
  say('');
  say('FINAL ' + JSON.stringify(final));
  say('pageErrors: ' + (pageErrors.length ? pageErrors.length : 'none'));
  pageErrors.slice(0, 8).forEach(e => say('   ! ' + e));
  fs.writeFileSync(path.join(OUT, 'qa-play.log'), log.join('\n'));
  await browser.close(); server.close(); process.exit(0);
});
