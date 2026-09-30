#!/usr/bin/env node
/*
  qa-keys.js — press every key a player can reach during combat and check that
  none of them takes the game away from them.

  Written after finding that R was bound to both RELOAD and the radio support
  radial (game-manager.js:4399 and :4400). The radial calls
  document.exitPointerLock(), and the pointerlockchange handler treats any lock
  loss during play as "the player opened a menu": STATE.PAUSED plus the
  inventory overlay. So reloading paused the game. That collision survived the
  project's entire history because nothing ever pressed a key and then asked
  whether the game was still being played.

  This presses each key in turn and records the state and pointer-lock status
  after it. Keys whose whole job is to open something (Escape, Tab, F9, B) are
  expected to; everything else must leave the player in the game. Where a key
  does pause, the run recovers (Escape, re-click, re-lock) before the next one,
  so one bad binding does not poison every result after it.

  Usage:
    node tools/qa-keys.js [--stage N] [--out DIR] [--port N]
*/
const http = require('http'), fs = require('fs'), path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); }
catch (e) {
  try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
  catch (e2) { console.error('Playwright required for qa-keys.js'); process.exit(1); }
}

const ROOT = process.env.OK_ROOT || path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const STAGE = parseInt(arg('stage', '0'), 10);
const PORT  = parseInt(arg('port', '4579'), 10);
const OUT   = arg('out', path.join(ROOT, 'tools', 'qa-keys-out'));
// 320x180. Under SwiftShader every texture and render target is host memory,
// and a boot at 480x270 took total Chromium RSS to ~7.9 GB before the
// renderer was killed; the one probe that survived three crashes did so at
// this size. The sweep cares about key handling, not pixels.
const W = parseInt(arg('w', '320'), 10), H = parseInt(arg('h', '180'), 10);

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

// Keys that are SUPPOSED to take over the screen. Everything else is a combat
// action and must leave the player in the game.
// Escape pauses, Tab and J open the inventory / shop, F9 opens settings, B is
// build mode. Those are menus on purpose.
const MENU_KEYS = new Set(['Escape', 'Tab', 'F9', 'KeyB', 'KeyJ']);

// Movement and fire are covered by qa-play.js; this is about the rest of the
// keyboard, which no test has ever pressed.
const KEYS = [
  // The menu keys go first and are pressed like any other. The first CI sweep
  // allowlisted Tab, Escape, F9 and B as "expected to open a menu" and then
  // never pressed one of them — so the check that would have caught Tab
  // leaving the inventory stranded could not fire. An allowlist for keys the
  // sweep does not press is not an allowlist, it is a blind spot.
  'Tab', 'Escape', 'F9', 'KeyB',
  'KeyE', 'KeyQ', 'KeyF', 'KeyG', 'KeyH', 'KeyI', 'KeyJ', 'KeyK', 'KeyL',
  'KeyM', 'KeyN', 'KeyO', 'KeyP', 'KeyR', 'KeyT', 'KeyU', 'KeyV', 'KeyX',
  'KeyY', 'KeyZ', 'KeyC',
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7',
  'Digit8', 'Digit9', 'Digit0',
  'Comma', 'Period', 'Backquote', 'Home',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
];

server.listen(PORT, async () => {
  const t0 = Date.now();
  const T = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(5) + 's';

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

  await page.goto('http://localhost:' + PORT + '/index.html', { waitUntil: 'commit', timeout: 30000 });
  const BOOT_WAIT = +(process.env.QA_BOOT_WAIT_MS || 120000);
  await page.waitForFunction(
    () => typeof window.GameManager !== 'undefined' && typeof window.VoxelWorld !== 'undefined'
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

  const probe = () => page.evaluate(() => {
    let state = null;
    try { state = GameManager.getState(); } catch (e) {}
    const overlay = Array.from(document.querySelectorAll('.overlay, #inventory-overlay'))
      .filter(el => getComputedStyle(el).display !== 'none')
      .map(el => el.id || el.className).slice(0, 3);
    return { state, locked: !!document.pointerLockElement, overlay };
  });

  // Put the player back in the game after a key that took them out of it.
  //
  // The previous version clicked the canvas corner to re-acquire pointer
  // lock. Every overlay it recovers from is full-screen, so "the canvas
  // corner" is really whatever element happens to be painted there — and in
  // CI one of those clicks hit something that quit to the main menu. From
  // STATE.MENU nothing recovers, so the sweep declared 39 of 43 keys
  // unjudged and the run told us nothing. A recovery routine that can lose
  // the game is worse than one that gives up early.
  //
  // So: never click blind. Escape to dismiss, and if that leaves us at the
  // main menu, restart the stage outright. Pointer lock is re-acquired by
  // clicking the canvas ONLY when no overlay is painted over it.
  const restartStage = async () => {
    await page.evaluate((s) => {
      window.__QA_MODE = true; window.__QA_START_STAGE = s; window.__chosenStartStage = s;
      try { GameManager.startGame(); } catch (e) {}
    }, STAGE);
    await page.waitForFunction(() => GameManager.getState() === 'playing', null, { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(800);
  };

  // "Restored" means the game is being played again with no menu in the way.
  // It does NOT mean pointer lock came back: Chrome throttles re-locking for
  // about a second after exitPointerLock(), so insisting on it made recovery
  // burn every iteration and report failure on a game that was already
  // playing again. That cost 12 of 43 keys their verdict in two runs, in CI
  // and locally, with identical results. Lock is re-acquired best-effort
  // because mouselook is nice to have, not because a verdict needs it.
  let escTraces = 0;   // how many Escape transitions have been traced in full
  // Recovery is not under test — only the measurement is. The verdict for a
  // key is recorded from real keyboard input before recovery runs, so
  // recovery is free to use the page API to get back to a known state. That
  // matters because Escape does not un-pause this game (the open bug this
  // sweep is chasing), so pressing it eight times per recovery, a dozen
  // times a run, was taking the job from four minutes to fifteen and toward
  // its timeout. Try Escape twice, then just set the state.
  const forceResume = async () => {
    await page.evaluate(() => {
      try {
        document.querySelectorAll('.overlay, #inventory-overlay').forEach(el => {
          if (getComputedStyle(el).display !== 'none') el.style.display = 'none';
        });
      } catch (e) {}
      try { GameManager.setState('playing'); } catch (e) {}
    });
    await page.waitForTimeout(300);
  };

  const recover = async () => {
    for (let i = 0; i < 8; i++) {
      // Two honest attempts with Escape, then stop paying for a key that
      // does not work and put the game back programmatically.
      if (i === 2) {
        say(T() + '  recovery: Escape did not clear it in two tries — restoring state directly');
        await forceResume();
      }
      const p = await probe();
      if (p.state === 'playing' && p.overlay.length === 0) return true;

      // Lost to the main menu (or the run ended) — only a restart comes back.
      if (p.state === 'menu' || p.state === 'dead' || p.state === 'gameover') {
        say(T() + '  recovery: game is at "' + p.state + '" — restarting stage ' + STAGE);
        await restartStage();
        continue;
      }

      if (p.overlay.length > 0) {
        // Escape pauses the game reliably but does not appear to un-pause it:
        // every probe so far ends at paused + inventory-overlay no matter how
        // many times Escape is pressed. The handler
        // (game-manager.js, the pause toggle) looks correct and is not gated,
        // getState() returns gameState directly, and nothing calls
        // stopImmediatePropagation — so the cause is something that happens
        // AFTER the handler runs. Leading suspect: Escape also makes the
        // browser exit pointer lock, and the pointerlockchange handler treats
        // lock loss during PLAYING as "player opened a menu" and pauses
        // again. Sample the state either side of the press so the next run
        // shows the transition instead of just the end state.
        // Sample the transition, but only for the first couple of Escapes in
        // the whole run. Doing it after every press cost three extra probes
        // per iteration, up to eight iterations per recovery, a dozen
        // recoveries — the sweep went from about four minutes to over
        // fifteen and was heading for its timeout. Two traces answer the
        // question; forty just make the job time out.
        await page.keyboard.press('Escape');
        if (escTraces < 2) {
          escTraces++;
          const t0e = Date.now();
          for (const ms of [120, 500, 1400]) {
            const left = ms - (Date.now() - t0e);
            if (left > 0) await page.waitForTimeout(left);
            const q = await probe();
            say(T() + '    esc+' + ms + 'ms: state=' + q.state + ' lock=' + q.locked
                + ' overlay=' + (q.overlay.join(',') || 'none'));
          }
        } else {
          await page.waitForTimeout(400);
        }
        continue;
      }

      // No overlay in the way: safe to click the canvas for pointer lock.
      // Give Chrome's post-Escape lock throttle time to lapse first.
      if (!p.locked) {
        await page.waitForTimeout(1200);
        try {
          const c = await page.$('canvas');
          if (c) await c.click({ position: { x: 6, y: 6 } });
        } catch (e) {}
        await page.waitForTimeout(400);
      }
    }
    return false;
  };

  await page.mouse.click(Math.floor(W / 2), Math.floor(H / 2));
  await page.waitForTimeout(500);
  if (!(await probe()).locked) say(T() + '  WARNING pointer lock never engaged — results below are weaker');

  // Event-order trace for the Escape bug. The 120/500/1400ms samples showed
  // the game never reading as 'playing' after Escape, yet pointer lock being
  // re-requested — which only the PAUSED->PLAYING branch does. So that
  // branch runs and is undone in under a frame. This logs, with timestamps:
  // the state as Escape arrives (capture phase, before game-manager's
  // handler), the state one macrotask after it, every pointerlockchange,
  // every exitPointerLock()/requestPointerLock() call, and every write to
  // the inventory overlay's display. Relayed via console so it lands in the
  // job log; only Escape-related lines are kept.
  page.on('console', m => { const t = m.text(); if (t.startsWith('[trace]')) say(T() + '    ' + t); });
  await page.evaluate(() => {
    const st = () => { try { return GameManager.getState(); } catch (e) { return '?'; } };
    const now = () => performance.now().toFixed(1);
    const log = (m) => console.log('[trace] ' + now() + 'ms ' + m + ' state=' + st() + ' lock=' + !!document.pointerLockElement);
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape') return;
      log('keydown Escape (capture, before handlers)');
      setTimeout(() => log('  macrotask after Escape handlers'), 0);
      requestAnimationFrame(() => log('  next frame after Escape'));
    }, true);
    document.addEventListener('pointerlockchange', () => log('pointerlockchange'));
    const ex = document.exitPointerLock.bind(document);
    document.exitPointerLock = function () { log('exitPointerLock() called from ' + (new Error().stack || '').split('\n')[2].trim().slice(0, 90)); return ex(); };
    const el = document.getElementById('inventory-overlay');
    if (el) new MutationObserver(() => log('inventory-overlay display=' + el.style.display)).observe(el, { attributes: true, attributeFilter: ['style'] });
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const rq = canvas.requestPointerLock.bind(canvas);
      canvas.requestPointerLock = function () { log('requestPointerLock() called'); return rq(); };
    }
  });

  const results = [], unrecovered = [];
  for (const key of KEYS) {
    let before = await probe();
    if (before.state !== 'playing' || !before.locked) {
      if (!(await recover())) {
        // One key that cannot be recovered from must not hide the other
        // thirty-odd. Record it and keep pressing.
        say(T() + '  could not restore play before ' + key + ' — its result is not trustworthy');
        unrecovered.push(key);
      }
      before = await probe();
    }
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
    const after = await probe();
    const tookOver = after.state !== 'playing' || (before.locked && !after.locked);
    const expected = MENU_KEYS.has(key);
    // A menu is allowed to take the screen; it is not allowed to sit on a
    // screen that is still being played. J left the shop display:flex with
    // the game back in 'playing' and the pointer re-locked — painted over a
    // live fight and unclickable. That is a failure for every key, menu keys
    // included, and no allowlist excuses it.
    const strandedMenu = after.state === 'playing' && after.overlay.length > 0;
    results.push({ key, state: after.state, locked: after.locked, overlay: after.overlay, tookOver, expected, strandedMenu,
                   // A verdict needs the game to have been in play and clear of
                   // menus before the press. Pointer lock is not part of that.
                   trustworthy: before.state === 'playing' });
    say(T() + '  ' + key.padEnd(11) + ' state=' + String(after.state).padEnd(8) + ' lock=' + String(after.locked).padEnd(5)
        + (tookOver ? '  <-- TOOK OVER' + (expected ? ' (expected)' : '') + (after.overlay.length ? ' overlay=' + after.overlay.join(',') : '') : '')
        + (strandedMenu ? '  <-- MENU STRANDED OVER LIVE PLAY overlay=' + after.overlay.join(',') : ''));
    if (tookOver || strandedMenu) await recover();
  }

  const offenders = results.filter(r => r.trustworthy && (r.strandedMenu || (r.tookOver && !r.expected)));
  const unjudged = results.filter(r => !r.trustworthy).map(r => r.key);
  // A sweep that could not get the player back into the game before a fifth
  // of the keyboard has not swept the keyboard, and reporting PASS for it
  // overstates what was checked. The first CI run did exactly that: "PASS —
  // 39 keys" with seven of them never judged.
  const missed = unjudged.length + unrecovered.length ? unjudged.length : 0;
  fs.writeFileSync(path.join(OUT, 'qa-keys.json'), JSON.stringify({ stage: STAGE, results, offenders, unjudged, unrecovered, pageErrors }, null, 1));

  say('');
  if (missed) say('  ' + missed + ' of ' + results.length + ' keys could not be judged — see below');
  if (offenders.length || missed) {
    offenders.forEach(o => say('  FAIL: ' + o.key + (o.strandedMenu
        ? ' left ' + o.overlay.join(',') + ' on screen while the game kept playing (lock=' + o.locked
          + ') — an open menu means the game is paused, or it is a wall the player cannot click through'
        : ' interrupted play (state=' + o.state + ', lock=' + o.locked
          + (o.overlay.length ? ', overlay=' + o.overlay.join(',') : '') + ') — a combat key must not take the screen')));
    say('  stage ' + STAGE + ' KEY SWEEP: FAIL (' + offenders.length + ' offending, '
        + missed + ' unjudged, of ' + results.length + ')');
  } else {
    say('  stage ' + STAGE + ' KEY SWEEP: PASS — ' + results.length + ' keys, none interrupted play');
  }
  if (unjudged.length) say('  NOT JUDGED (play could not be restored first): ' + unjudged.join(' '));
  if (pageErrors.length) { say('  page errors: ' + pageErrors.length); pageErrors.slice(0, 8).forEach(e => say('   ! ' + e)); }
  fs.writeFileSync(path.join(OUT, 'qa-keys.log'), log.join('\n'));

  await browser.close(); server.close();
  process.exit(offenders.length || missed ? 1 : 0);
});
