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
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  try {
    ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
  } catch (e2) {
    try {
      ({ chromium } = require(path.join(process.env.USERPROFILE || process.env.HOME || '', 'AppData/Roaming/npm/node_modules/playwright')));
    } catch (e3) {
      console.error('Playwright required for qa-play.js');
      process.exit(1);   // without it every later line crashes anyway — fail here, clearly
    }
  }
}

const ROOT = process.env.OK_ROOT || path.resolve(__dirname, '..');
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
  // A screenshot is evidence, not a check. On a loaded CI runner rendering
  // through SwiftShader, page.screenshot() blows its default 30s timeout and
  // the uncaught rejection killed the whole session — stage 5 of run 2 lost
  // three attempts to it after playing fine for 95s. Give it room, and if it
  // still will not come, record the miss and keep playing.
  let shotFailures = 0;
  const shot = async (pg, name) => {
    const f = path.join(OUT, name + '.png');
    try {
      await pg.screenshot({ path: f, timeout: 120000, animations: 'disabled' });
      shots.push(name + '.png');
      say(T() + '  shot ' + name);
    } catch (e) {
      shotFailures++;
      say(T() + '  shot ' + name + ' FAILED: ' + String(e.message).split('\n')[0].slice(0, 100));
    }
  };

  // Lets a container with a pre-installed Chromium that does not match this
  // Playwright's pinned build run the harness without re-downloading one.
  const EXE = process.env.QA_CHROMIUM || undefined;
  const browser = await chromium.launch({
    headless: true,
    executablePath: EXE,
    // No --autoplay-policy override. Allowing autoplay makes the audio system
    // initialise during boot, and in a container with no sound device that
    // wedged the page every time: three runs in a row stalled at the boot bar
    // for 300s and then crashed the renderer, while an otherwise identical
    // script without the flag booted in 2.9s. QA here is about input and
    // logic; sound is not worth a hung browser.
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage',
           '--no-sandbox', '--mute-audio'],
  });
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();

  // Everything the game complains about, kept for the report. Page errors are
  // the ones that matter — a thrown exception in a handler silently kills that
  // feature for the rest of the session.
  const pageErrors = [], consoleErrors = [];
  page.on('pageerror', e => {
    // The message alone ("Cannot read properties of null") names no file and
    // no function, which makes a real fault unactionable. Keep the top frame.
    const frame = String(e.stack || '').split('\n').find(l => /\.js:\d+/.test(l)) || '';
    pageErrors.push((String(e.message).slice(0, 160) + (frame ? '  @' + frame.trim().slice(0, 120) : '')));
  });
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  await page.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
  // 300s here bought nothing: every healthy boot in CI reached this in under
  // 10s, and the only runs that ever hit the ceiling were wedged ones — which
  // then burned five minutes each before the workflow could retry them. Two of
  // six stages in run 2 lost all three attempts that way. 120s is still more
  // than ten times the slowest healthy boot observed.
  const BOOT_WAIT = +(process.env.QA_BOOT_WAIT_MS || 120000);
  try {
    await page.waitForFunction(
      () => typeof window.GameManager !== 'undefined' && typeof window.VoxelWorld !== 'undefined'
         && typeof window.THREE !== 'undefined' && typeof window.Enemies !== 'undefined',
      null, { timeout: BOOT_WAIT });
  } catch (e) {
    // Say which of them is missing rather than "timeout", and leave a frame
    // behind — a wedge that produces no evidence gets diagnosed by guesswork,
    // which has already cost this project several wrong answers.
    let missing = 'unknown (page unreachable)';
    try {
      missing = await page.evaluate(() => ['GameManager', 'VoxelWorld', 'THREE', 'Enemies']
        .filter(n => typeof window[n] === 'undefined').join(', ') || 'none');
    } catch (_) {}
    say(T() + '  BOOT WEDGED — missing globals after ' + (BOOT_WAIT / 1000) + 's: ' + missing);
    await shot(page, '00-boot-wedge');
    fs.writeFileSync(path.join(OUT, 'qa-play.log'), log.join('\n'));
    // No verdict.json: this is a harness/environment wedge, not a judgement on
    // the game, and the workflow retries exactly on that distinction.
    await browser.close(); server.close();
    process.exit(1);
  }
  say(T() + '  modules present');
  // Wait for the boot bar too. Globals appear well before the world is built,
  // and starting early is not a harmless race: the player spawns into terrain
  // that does not exist yet, and the collision test — which blocks a movement
  // axis when the corners of the player's cylinder are inside solid voxels —
  // then pins them at the spawn point with no way to tell that from a genuinely
  // broken movement system. Cost me a false bug report before I caught it.
  await page.waitForFunction(
    () => { const f = document.getElementById('boot-progress-bar-fill'); return f && f.style.width === '100%'; },
    null, { timeout: BOOT_WAIT }).catch(() => say(T() + '  WARNING boot bar never reached 100%'));
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

  // Whether mouselook WORKS, by whichever path this environment supports.
  // realMouseWorks above is an environment capability, not a game property:
  // headless Chromium often reports movementX as 0 under pointer lock, which
  // is exactly why the fallback below this exists. Failing a build on it
  // reports a broken game when the game is fine. What matters is that looking
  // turns the camera — so measure that, through look() itself.
  const yawPre = await readYaw();
  await look(200, 0);
  await page.waitForTimeout(200);
  const yawPost = await readYaw();
  const mouselookWorks = yawPre !== null && yawPost !== null && yawPre !== yawPost;
  say(T() + '  mouselook (' + (realMouseWorks ? 'real mouse' : 'synthesised') + '): '
      + (mouselookWorks ? 'WORKS' : 'DEAD (yaw ' + yawPre + ' -> ' + yawPost + ')'));

  const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); };

  // Movement sanity check, run before anything else and reported explicitly.
  // A session where the player silently never moves still produces a full log
  // of beats and screenshots that all look plausible, which is worse than a
  // failure — so establish up front whether walking works at all.
  //
  // Not every stage is walked. Stage index 17 (REFINERY STRIKE) possesses an
  // FPV drone at mission start and stage index 18 (BRADLEY DUEL) crews a
  // Bradley; in both, game-manager's updatePlayer() returns early
  // (game-manager.js:7728) and WASD is routed to the drone/vehicle instead
  // (game-manager.js:4429, bradley.js:637). Measuring the player body on
  // those stages reports "PLAYER CANNOT MOVE" for a game that is behaving
  // exactly as designed. So ask the page what the player is actually
  // driving, and measure THAT — which keeps the check real on drone and
  // vehicle missions instead of exempting them.
  const subjectOf = () => page.evaluate(() => {
    const v3 = (o) => [+o.x.toFixed(2), +o.y.toFixed(2), +o.z.toFixed(2)];
    try {
      if (typeof DroneSystem !== 'undefined' && DroneSystem.isPossessing && DroneSystem.isPossessing()) {
        const d = DroneSystem.getPossessed && DroneSystem.getPossessed();
        if (d && d.position) return { kind: 'drone', pos: v3(d.position) };
      }
    } catch (e) {}
    try {
      if (typeof Bradley !== 'undefined' && Bradley.isActive && Bradley.isActive()) {
        const b = Bradley.getVehicle && Bradley.getVehicle();
        if (b && b.group && b.group.position) return { kind: 'bradley', pos: v3(b.group.position) };
      }
    } catch (e) {}
    try {
      if (typeof VehicleSystem !== 'undefined' && VehicleSystem.isInVehicle && VehicleSystem.isInVehicle()) {
        const v = VehicleSystem.getOccupied ? VehicleSystem.getOccupied() : null;
        const g = v && (v.position ? v : (v.group || v.mesh));
        if (g && g.position) return { kind: 'vehicle', pos: v3(g.position) };
      }
    } catch (e) {}
    return { kind: 'player', pos: v3(GameManager.getPlayer().position) };
  });
  // The player's body, always, whatever they are driving. When the two
  // disagree the player is in two places at once, which is how the Bradley
  // desync looked from the outside: the view rode the hull while the
  // collision box, the audio listener and every enemy's target walked away.
  const bodyOf = () => page.evaluate(() => {
    const p = GameManager.getPlayer().position;
    return [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)];
  });
  // Hold W until the subject has plainly moved, or a frame budget runs out.
  //
  // This was a flat 2.5s hold against a 0.2m gate, and that is a wall-clock
  // measurement of a thing that advances per frame. Physics delta is clamped
  // to 0.1s, so on a CI runner rendering through SwiftShader at 2-3 fps those
  // 2.5 seconds buy well under a second of simulated movement. Stage 11
  // passed twice and then failed at 0.19m — 0.01m under the gate — with the
  // same code. A check that swings on runner load is worse than no check,
  // because it teaches everyone to ignore it.
  const frameNo = () => page.evaluate(() => {
    try { return GameManager.getRenderer().info.render.frame; } catch (e) { return null; }
  });
  const MOVE_TARGET = 0.5, FRAME_BUDGET = 90, WALL_CAP_MS = 20000;
  const sBefore = await subjectOf(), bBefore = await bodyOf();
  const f0 = await frameNo(), w0 = Date.now();
  let sAfter = sBefore, bAfter = bBefore, framesUsed = 0;
  await page.keyboard.down('KeyW');
  while (Date.now() - w0 < WALL_CAP_MS) {
    await page.waitForTimeout(400);
    sAfter = await subjectOf(); bAfter = await bodyOf();
    const f = await frameNo();
    framesUsed = (f !== null && f0 !== null) ? f - f0 : 0;
    const d = sAfter.kind === 'drone'
      ? Math.hypot(sAfter.pos[0] - sBefore.pos[0], sAfter.pos[1] - sBefore.pos[1], sAfter.pos[2] - sBefore.pos[2])
      : Math.hypot(sAfter.pos[0] - sBefore.pos[0], sAfter.pos[2] - sBefore.pos[2]);
    if (d > MOVE_TARGET) break;
    if (framesUsed >= FRAME_BUDGET) break;
  }
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(300);
  sAfter = await subjectOf(); bAfter = await bodyOf();
  const subject = sAfter.kind;
  const mvBefore = sBefore.pos, mvAfter = sAfter.pos;
  // A drone climbs and dives, so its forward run is a 3D displacement; a
  // walker's Y is gravity and stairs, which is noise here.
  const moved = subject === 'drone'
    ? Math.hypot(mvAfter[0] - mvBefore[0], mvAfter[1] - mvBefore[1], mvAfter[2] - mvBefore[2])
    : Math.hypot(mvAfter[0] - mvBefore[0], mvAfter[2] - mvBefore[2]);
  const canMove = moved > 0.2;
  say(T() + '  movement check [' + subject + ']: ' + (canMove ? 'OK' : subject.toUpperCase() + ' DID NOT MOVE')
      + ' ' + JSON.stringify(mvBefore) + ' -> ' + JSON.stringify(mvAfter)
      + '  (' + moved.toFixed(2) + 'm over ' + framesUsed + ' frames, '
      + ((Date.now() - w0) / 1000).toFixed(1) + 's wall)');
  if (sBefore.kind !== sAfter.kind) say(T() + '  note: control subject changed mid-check: ' + sBefore.kind + ' -> ' + sAfter.kind);

  // Riding something means the body rides with it.
  const bodyMoved = Math.hypot(bAfter[0] - bBefore[0], bAfter[2] - bBefore[2]);
  const gap = Math.hypot(bAfter[0] - mvAfter[0], bAfter[2] - mvAfter[2]);
  // Only for things the player is INSIDE. A drone is flown remotely — the
  // pilot stands at the launch point and the aircraft flies away, which is
  // the whole premise of the mission and is what game-manager means by
  // "player body is passive while piloting drone". Asserting co-location
  // there failed stage 17 for working exactly as designed; that was my
  // mistake, not the game's.
  const RIDDEN = new Set(['bradley', 'vehicle']);
  const desynced = RIDDEN.has(subject) && gap > 6;
  if (subject !== 'player') {
    say(T() + '  body-vs-' + subject + (RIDDEN.has(subject) ? '' : ' (remote — gap expected)')
        + ': body ' + JSON.stringify(bAfter)
        + ' vs ' + subject + ' ' + JSON.stringify(mvAfter) + '  gap ' + gap.toFixed(2) + 'm'
        + ' (body walked ' + bodyMoved.toFixed(2) + 'm)');
  }

  const sample = () => page.evaluate(() => {
    const o = {};
    try { o.state = GameManager.getState(); } catch (e) {}
    try { const p = GameManager.getPlayer(); o.hp = Math.round(p.hp); o.pos = [p.position.x, p.position.y, p.position.z].map(v => +v.toFixed(1)); } catch (e) {}
    try { o.enemies = Enemies.getAliveCount(); } catch (e) {}
    try { o.yaw = +CameraSystem.getYaw().toFixed(3); } catch (e) {}
    try { o.weapon = Weapons.getCurrent && Weapons.getCurrent().name; } catch (e) {}
    try { const r = GameManager.getRenderer(); o.draw = r.info.render.calls; o.progs = r.info.programs ? r.info.programs.length : null; } catch (e) {}
    try { o.wave = window.__hudWave || null; } catch (e) {}
    try { o.locked = !!document.pointerLockElement; } catch (e) {}
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

  // A session that pauses plays out as a full log of plausible-looking beats
  // in which nothing moves, and the old verdict passed it. Track it.
  let pausedBeats = 0, pauseEpisodes = 0, wasPaused = false;
  const timeline = [];
  const deadline = Date.now() + SECS * 1000;
  const shotEvery = Math.max(1, Math.floor((SECS * 1000) / Math.max(1, SHOTS)));
  let nextShot = Date.now() + shotEvery, shotN = 1, beat = 0;

  while (Date.now() < deadline) {
    const b = beats[beat % beats.length]; beat++;
    const before = await sample();
    try { await b.run(); } catch (e) { say(T() + '  beat ' + b.name + ' THREW: ' + e.message.slice(0, 100)); }
    const after = await sample();
    const nowPaused = after.state === 'paused';
    if (nowPaused) { pausedBeats++; if (!wasPaused) { pauseEpisodes++; say(T() + '  !! GAME PAUSED during "' + b.name + '" (lock=' + after.locked + ')'); } }
    wasPaused = nowPaused;
    timeline.push({ t: +((Date.now() - t0) / 1000).toFixed(1), beat: b.name, before, after });
    say(T() + '  ' + b.name.padEnd(14) + ' state=' + after.state + ' lock=' + after.locked
        + ' hp=' + after.hp + ' enemies=' + after.enemies
        + ' weapon=' + after.weapon + ' pos=' + JSON.stringify(after.pos));
    if (Date.now() >= nextShot && shotN <= SHOTS) { await shot(page, String(shotN).padStart(2, '0') + '-' + b.name); shotN++; nextShot = Date.now() + shotEvery; }
  }

  await shot(page, '99-final');
  const final = await sample();

  const report = {
    stage: STAGE, seconds: SECS,
    pointerLock: locked,
    // Environment capability, reported not asserted.
    mouselookViaRealMouse: realMouseWorks,
    mouselookWorks: mouselookWorks,
    controlSubject: subject, bodyGapMetres: +gap.toFixed(2), bodyDesynced: desynced,
    pauseEpisodes, pausedBeats, beatsPlayed: timeline.length, shotFailures,
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

  /* Turn what was already measured into a verdict.
   *
   * This harness collected pointer lock, real-mouse look, whether the player
   * could move at all, and every page error — and then exited 0 no matter
   * what any of them said. A check that cannot fail is not a check, and this
   * is the one harness that exercises the input path, which is exactly where
   * the worst bug in this project's history lived: a speedMod/speedMult typo
   * left WASD dead for every player and no test caught it for the project's
   * entire history.
   */
  const failures = [];
  if (!canMove)        failures.push(subject.toUpperCase() + ' CANNOT MOVE — WASD produced no displacement (moved ' + moved.toFixed(2) + 'm)');
  if (!locked)         failures.push('POINTER LOCK NEVER ENGAGED — the player cannot aim');
  if (!mouselookWorks) failures.push('MOUSELOOK DEAD — looking did not turn the camera (yaw unchanged)');
  if (desynced)        failures.push('PLAYER IS IN TWO PLACES — riding the ' + subject + ' at ' + JSON.stringify(mvAfter)
                                     + ' while the body stands at ' + JSON.stringify(bAfter) + ' (' + gap.toFixed(1) + 'm apart); '
                                     + 'enemies, audio and collision all track the body, not the view');
  if (pauseEpisodes)   failures.push('GAME PAUSED ITSELF ' + pauseEpisodes + 'x DURING PLAY — ' + pausedBeats + ' of '
                                     + timeline.length + ' beats ran with the game paused (nothing the player did should pause it)');
  if (pageErrors.length) failures.push(pageErrors.length + ' uncaught page error(s) during play: ' + pageErrors[0].slice(0, 160));

  say('');
  if (failures.length) {
    failures.forEach(f => say('  FAIL: ' + f));
    say('  stage ' + STAGE + ' VERDICT: FAIL (' + failures.length + ')');
  } else {
    say('  stage ' + STAGE + ' VERDICT: PASS — ' + subject + ' moved ' + moved.toFixed(2) + 'm, pointer lock ok, mouselook ok, no page errors');
  }
  fs.writeFileSync(path.join(OUT, 'qa-play.log'), log.join('\n'));
  fs.writeFileSync(path.join(OUT, 'verdict.json'), JSON.stringify({ stage: STAGE, pass: !failures.length, subject, movedMetres: +moved.toFixed(2), pauseEpisodes, pausedBeats, beatsPlayed: timeline.length, failures }, null, 1));

  await browser.close(); server.close();
  process.exit(failures.length ? 1 : 0);
});
