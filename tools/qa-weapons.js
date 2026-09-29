#!/usr/bin/env node
/*
  qa-weapons.js — cycle through EVERY weapon with real input and check that
  each one switches in, fires, and reloads without the page throwing.

  The gallery capture proved every weapon renders. Nothing had ever proved
  that every weapon works: the play harness only ever touches slots 1 and 2,
  and 125 weapons is exactly the kind of long tail where a broken clipSize, a
  missing sound handle or a null mesh sits unnoticed for months.

  Setup uses the game's own cheat — Ctrl+Shift+G (a real keypress) toggles
  god mode, which unlocks every weapon and refills ammo. Everything measured
  after that is real input: the mouse wheel to change weapon (the documented
  player path — game-manager's wheel listener calls Weapons.switchNext), the
  left button to fire, R to reload.

  Per weapon it records: switched (index actually changed), fired (clip went
  down, or a reload was triggered by firing dry), reloaded (isReloading or
  clip refilled after R), and any page error thrown while it was selected.
  Melee weapons have clipSize 0 and no ammo signal, so "fired" is recorded as
  not-measurable for them rather than as a pass.

  God mode refills ammo once when toggled; tryFire still decrements the clip
  on every shot (weapons.js), so the ammo signal is valid under it.

  Usage:
    node tools/qa-weapons.js [--stage N] [--out DIR] [--port N] [--hold MS]
*/
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  catch (e2) { console.error('Playwright required for qa-weapons.js'); process.exit(1); }
}

const ROOT = process.env.OK_ROOT || path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const STAGE = parseInt(arg('stage', '0'), 10);
const PORT  = parseInt(arg('port', '4581'), 10);
const OUT   = arg('out', path.join(ROOT, 'tools', 'qa-weapons-out'));
// How long the trigger is held per weapon. The Gatling needs 0.3s of spin-up
// before its first round; anything shorter would report it as unable to fire.
const HOLD  = parseInt(arg('hold', '650'), 10);
const W = parseInt(arg('w', '480'), 10), H = parseInt(arg('h', '270'), 10);

fs.mkdirSync(OUT, { recursive: true });
const log = [];
const say = (m) => { console.log(m); log.push(m); };
const flush = () => fs.writeFileSync(path.join(OUT, 'qa-weapons.log'), log.join('\n'));

const server = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT)) { s.writeHead(403); return s.end(); }
  fs.readFile(fp, (e, d) => { if (e) { s.writeHead(404); return s.end('404'); } s.end(d); });
});

server.listen(PORT, async () => {
  const t0 = Date.now();
  const T = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6) + 's';

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.QA_CHROMIUM || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--disable-dev-shm-usage',
           '--no-sandbox', '--mute-audio'],
  });
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => {
    const frame = String(e.stack || '').split('\n').find(l => /\.js:\d+/.test(l)) || '';
    pageErrors.push(String(e.message).slice(0, 160) + (frame ? '  @' + frame.trim().slice(0, 120) : ''));
  });

  const shot = async (name) => {
    try { await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 60000, animations: 'disabled' }); }
    catch (e) { say(T() + '  shot ' + name + ' failed: ' + String(e.message).split('\n')[0].slice(0, 80)); }
  };

  await page.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
  const BOOT_WAIT = +(process.env.QA_BOOT_WAIT_MS || 120000);
  await page.waitForFunction(
    () => typeof window.GameManager !== 'undefined' && typeof window.Weapons !== 'undefined'
       && typeof window.THREE !== 'undefined' && typeof window.Enemies !== 'undefined',
    null, { timeout: BOOT_WAIT });
  await page.waitForFunction(
    () => { const f = document.getElementById('boot-progress-bar-fill'); return f && f.style.width === '100%'; },
    null, { timeout: BOOT_WAIT }).catch(() => say(T() + '  WARNING boot bar never reached 100%'));
  say(T() + '  boot complete');

  await page.evaluate((s) => { window.__QA_MODE = true; window.__QA_START_STAGE = s; window.__chosenStartStage = s; }, STAGE);
  const clicked = await page.evaluate(() => {
    const b = document.getElementById('quick-start-btn');
    if (b && b.offsetParent !== null) { b.click(); return true; }
    return false;
  });
  if (!clicked) await page.evaluate(() => GameManager.startGame());
  await page.waitForFunction(() => GameManager.getState() === 'playing', null, { timeout: 120000 });
  say(T() + '  stage ' + STAGE + ' playing');
  await page.mouse.click(Math.floor(W / 2), Math.floor(H / 2));
  await page.waitForTimeout(600);

  // ── Setup: god mode by real keypress, verify it unlocked everything ────
  await page.keyboard.down('Control'); await page.keyboard.down('Shift');
  await page.keyboard.press('KeyG');
  await page.keyboard.up('Shift'); await page.keyboard.up('Control');
  await page.waitForTimeout(400);
  let setup = await page.evaluate(() => ({
    god: !!GameManager.getPlayer().godMode,
    count: Weapons.getWeaponCount(),
    unlocked: Weapons.getUnlockedList().length,
    state: GameManager.getState(),
  }));
  let setupPath = 'Ctrl+Shift+G (real keys)';
  if (!setup.god || setup.unlocked < setup.count) {
    // Report the shortfall honestly, then fall back to the API for SETUP
    // only — the measurements below still come from real input.
    say(T() + '  god mode via keys: god=' + setup.god + ' unlocked=' + setup.unlocked + '/' + setup.count
        + ' — falling back to API for setup');
    await page.evaluate(() => {
      const p = GameManager.getPlayer(); p.godMode = true;
      for (let i = 0; i < Weapons.getWeaponCount(); i++) { try { Weapons.unlockWeapon(i); } catch (e) {} }
      try { Weapons.refillAllAmmo(); } catch (e) {}
    });
    setupPath = 'API fallback (Ctrl+Shift+G did not unlock everything)';
    setup = await page.evaluate(() => ({
      god: !!GameManager.getPlayer().godMode, count: Weapons.getWeaponCount(),
      unlocked: Weapons.getUnlockedList().length, state: GameManager.getState(),
    }));
  }
  say(T() + '  setup: ' + setupPath + ' -> god=' + setup.god + ' unlocked=' + setup.unlocked + '/' + setup.count);
  if (setup.state !== 'playing') {
    // The cheat toggle must not have paused or otherwise left play.
    say(T() + '  state after god-mode toggle: ' + setup.state);
  }

  const readCur = () => page.evaluate(() => {
    const i = Weapons.getCurrentIdx();
    const d = Weapons.getWeaponDef(i) || {};
    let frame = null; try { frame = GameManager.getRenderer().info.render.frame; } catch (e) {}
    return { idx: i, id: d.id, name: d.name, type: d.type, clipSize: d.clipSize || 0,
             clip: Weapons.getClip(), reserve: Weapons.getReserve(),
             reloading: !!Weapons.isReloading(), state: GameManager.getState(), frame };
  });

  // Wait until pred(cur) holds, or a budget of RENDERED FRAMES runs out.
  //
  // The first version of this harness waited fixed milliseconds after every
  // action, and its verdict was nonsense: the same weapon measured twice on
  // consecutive rows, clips going UP during "fire" because the before-read
  // came from one weapon and the after-read from the next, and the Gatling
  // reported as unable to fire because its 0.3s spin-up is longer than 650ms
  // of wall clock buys at 2-3 fps with delta clamped to 0.1s per frame. The
  // game advances per frame; on a software renderer wall time says nothing
  // about how far it has advanced. Same lesson as the movement check.
  const until = async (pred, frames, wallMs) => {
    const first = await readCur();
    const f0 = first.frame, w0 = Date.now();
    let cur = first;
    for (;;) {
      if (pred(cur)) return { ok: true, cur, frames: cur.frame != null && f0 != null ? cur.frame - f0 : null };
      const used = cur.frame != null && f0 != null ? cur.frame - f0 : null;
      if ((used != null && used >= frames) || Date.now() - w0 > wallMs) return { ok: false, cur, frames: used };
      await page.waitForTimeout(120);
      cur = await readCur();
    }
  };

  // ── The loop: wheel to each weapon, fire it, reload it ─────────────────
  const rows = [];
  const seen = new Set();
  const total = setup.count;
  let errIdx = pageErrors.length;

  for (let k = 0; k < total; k++) {
    const prevIdx = rows.length ? rows[rows.length - 1].idx : null;
    let before, switched, swFrames = 0;
    if (k === 0) { before = await readCur(); switched = true; }
    else {
      await page.mouse.wheel(0, 120);     // one notch down = Weapons.switchNext()
      const sw = await until(c => c.idx !== prevIdx, 40, 8000);
      before = sw.cur; switched = sw.ok; swFrames = sw.frames;
    }
    if (before.state !== 'playing') {
      say(T() + '  !! state=' + before.state + ' after switching to #' + before.idx + ' ' + before.name);
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    }
    seen.add(before.idx);
    const measurable = before.clipSize > 0;

    let fired = null, reloaded = null, afterFire = before, afterReload = before, fireFrames = null, reloadFrames = null;
    if (switched) {
      // Fire: hold the trigger until the clip drops or a dry-fire reload
      // starts, within a frame budget generous enough for a spin-up.
      await page.mouse.down();
      if (measurable) {
        const fr = await until(c => c.clip < before.clip || c.reloading, 30, 8000);
        afterFire = fr.cur; fired = fr.ok; fireFrames = fr.frames;
      } else {
        const fr = await until(() => false, 4, 1500);   // melee: swing a few frames, nothing to measure
        afterFire = fr.cur;
      }
      await page.mouse.up();

      // Reload: press R, then look for a reload in progress or the clip back
      // up, again within a frame budget.
      await page.keyboard.press('KeyR');
      if (measurable) {
        const rl = await until(c => c.reloading || c.clip > afterFire.clip || c.clip === before.clipSize, 30, 8000);
        afterReload = rl.cur; reloaded = rl.ok; reloadFrames = rl.frames;
      }
    }

    const errs = pageErrors.slice(errIdx); errIdx = pageErrors.length;
    const row = {
      k, idx: before.idx, id: before.id, name: before.name, type: before.type,
      clipSize: before.clipSize, clipBefore: before.clip, clipAfterFire: afterFire.clip,
      switched, swFrames, fired, fireFrames, reloaded, reloadFrames, errors: errs,
    };
    rows.push(row);
    const flag = (!switched ? ' <-- DID NOT SWITCH (idx still ' + before.idx + ' after ' + swFrames + ' frames)' : '')
      + (fired === false ? ' <-- DID NOT FIRE in ' + fireFrames + ' frames' : '')
      + (reloaded === false ? ' <-- DID NOT RELOAD in ' + reloadFrames + ' frames' : '')
      + (errs.length ? ' <-- ' + errs.length + ' PAGE ERROR(S): ' + errs[0].slice(0, 90) : '');
    say(T() + '  #' + String(before.idx).padStart(3) + ' ' + String(before.name).padEnd(30).slice(0, 30)
        + ' ' + String(before.type || '').padEnd(9)
        + ' clip ' + String(before.clip).padStart(3) + '->' + String(afterFire.clip).padStart(3)
        + '  fire=' + (fired === null ? 'n/a ' : fired ? 'ok  ' : 'NO  ')
        + ' reload=' + (reloaded === null ? 'n/a' : reloaded ? 'ok ' : 'NO ') + flag);
    if (k % 12 === 0 || flag) await shot('wpn-' + String(before.idx).padStart(3, '0') + '-' + String(before.id || 'x').toLowerCase());
    if (k % 10 === 0) flush();
  }

  // ── Verdict ────────────────────────────────────────────────────────────
  const coverage = seen.size;
  const notSwitched = rows.filter(r => !r.switched);
  const notFired    = rows.filter(r => r.fired === false);
  const notReloaded = rows.filter(r => r.reloaded === false);
  const withErrors  = rows.filter(r => r.errors.length);
  const unmeasurable = rows.filter(r => r.fired === null).length;

  const failures = [];
  if (setup.unlocked < setup.count) failures.push('SETUP: only ' + setup.unlocked + ' of ' + setup.count + ' weapons could be unlocked');
  if (coverage < total)   failures.push('COVERAGE: the wheel reached ' + coverage + ' of ' + total + ' weapons (' + notSwitched.length + ' ticks did not change weapon)');
  if (notFired.length)    failures.push(notFired.length + ' weapon(s) did not fire: ' + notFired.slice(0, 6).map(r => '#' + r.idx + ' ' + r.name).join(', ') + (notFired.length > 6 ? ', …' : ''));
  if (notReloaded.length) failures.push(notReloaded.length + ' weapon(s) did not reload: ' + notReloaded.slice(0, 6).map(r => '#' + r.idx + ' ' + r.name).join(', ') + (notReloaded.length > 6 ? ', …' : ''));
  if (withErrors.length)  failures.push(withErrors.length + ' weapon(s) threw page errors: ' + withErrors.slice(0, 4).map(r => '#' + r.idx + ' ' + r.name + ' (' + r.errors[0].slice(0, 70) + ')').join('; '));

  say('');
  say('  weapons: ' + total + ' total, ' + coverage + ' reached, '
      + (rows.length - notFired.length - unmeasurable) + ' fired, ' + unmeasurable + ' melee/no-clip (fire not measurable), '
      + (rows.length - notReloaded.length - unmeasurable) + ' reloaded, ' + withErrors.length + ' with page errors');
  if (failures.length) { failures.forEach(f => say('  FAIL: ' + f)); say('  WEAPONS: FAIL (' + failures.length + ')'); }
  else say('  WEAPONS: PASS — every weapon switched in, fired (where measurable) and reloaded, no page errors');

  fs.writeFileSync(path.join(OUT, 'weapons.json'), JSON.stringify({ stage: STAGE, setupPath, setup, total, coverage, rows }, null, 1));
  fs.writeFileSync(path.join(OUT, 'verdict.json'), JSON.stringify({
    kind: 'weapons', stage: STAGE, pass: !failures.length, total, coverage,
    fired: rows.length - notFired.length - unmeasurable, unmeasurable,
    reloaded: rows.length - notReloaded.length - unmeasurable,
    notFired: notFired.map(r => r.idx), notReloaded: notReloaded.map(r => r.idx),
    withErrors: withErrors.map(r => ({ idx: r.idx, name: r.name, error: r.errors[0] })),
    failures,
  }, null, 1));
  flush();
  await browser.close(); server.close();
  process.exit(failures.length ? 1 : 0);
});
