/* ============================================================
 *  qa-megasweep.js — full-game QA capture sweep
 *
 *  Plays every stage in BOTH god mode and regular mode, cycling
 *  through every weapon, taking a screenshot every 3 seconds.
 *  Captures console/page errors per stage. Writes a manifest +
 *  error log + per-stage summary. Output to D: project folder.
 *
 *  Usage:
 *    node tools/qa-megasweep.js [URL] [godShots] [regShots] [modes]
 *    node tools/qa-megasweep.js http://localhost:3000 50 25 god,regular
 *
 *  Output: tools/screenshots/megasweep-<stamp>/<mode>/stageNN-<id>/NNN.jpg
 * ============================================================ */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const URL       = process.argv[2] || 'http://localhost:3000';
const GOD_SHOTS = parseInt(process.argv[3] || '50', 10);   // shots per stage in god mode
const REG_SHOTS = parseInt(process.argv[4] || '25', 10);   // shots per stage in regular mode
const MODES     = (process.argv[5] || 'god,regular').split(',').map(s => s.trim()).filter(Boolean);
// Per-shot processing (render + readback) on software-WebGL already exceeds ~3s,
// so captures are naturally >=3s apart; keep only a small settle delay so the
// game advances between frames without adding dead time.
const SHOT_MS   = parseInt(process.env.SHOT_MS || '600', 10);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const ROOT  = path.join(__dirname, 'screenshots', `megasweep-${stamp}`);
fs.mkdirSync(ROOT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pad   = (n, w) => String(n).padStart(w, '0');

const manifest = [];
const errorLog = [];
let shotTotal = 0;

function log(...a) { console.log('[MEGASWEEP]', ...a); }

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage();
  // Small viewport — software-WebGL screenshot cost scales with pixel count;
  // 640x360 is ~4x cheaper than 1280x720 and still clearly QA-viewable.
  await page.setViewport({ width: 640, height: 360 });

  let curStageLabel = 'boot';
  const pushErr = (kind, txt) => {
    if (/ERR_CONNECTION_REFUSED|favicon|AudioContext|:3001|\.mp3|JUKEBOX|net::ERR/i.test(txt)) return;
    errorLog.push(`[${curStageLabel}] ${kind}: ${txt}`);
  };
  page.on('pageerror', e => pushErr('CRASH', e.message || String(e)));
  page.on('console', m => { if (m.type() === 'error') pushErr('CONSOLE', m.text()); });

  await page.evaluateOnNewDocument(() => {
    window.__QA_MODE = true;
    try { localStorage.setItem('ok_has_played', '1'); } catch (e) {}
  });

  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => typeof window.GameManager !== 'undefined', { timeout: 20000 });

  const stageCount = await page.evaluate(() => {
    try { return (window.GameManager.STAGES || []).length || (window.GameManager.getStageCount && window.GameManager.getStageCount()) || 20; }
    catch (e) { return 20; }
  });
  const weaponCount = await page.evaluate(() => {
    try { return (window.Weapons && window.Weapons.getWeaponCount) ? window.Weapons.getWeaponCount() : 10; }
    catch (e) { return 10; }
  });
  log('stages:', stageCount, '| weapons:', weaponCount, '| modes:', MODES.join(','), '| cadence:', SHOT_MS + 'ms');

  async function startStage(stageIdx, god) {
    // Hard reset between stages for a clean slate.
    await page.evaluate(() => { try { if (window.GameManager && GameManager.getState && GameManager.getState() !== 'menu') location.reload(); } catch (e) {} });
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction(() => typeof window.GameManager !== 'undefined', { timeout: 20000 });
    await page.evaluate((s) => {
      window.__QA_MODE = true;
      window.__QA_START_STAGE = s;
      window.__chosenStartStage = s;
      if (window.forceStartGame) window.forceStartGame();
      else if (window.GameManager && GameManager.forceStartGame) GameManager.forceStartGame();
    }, stageIdx);

    // Wait until playing.
    for (let i = 0; i < 40; i++) {
      const st = await page.evaluate(() => { try { return window.GameManager.getState ? GameManager.getState() : '?'; } catch (e) { return '?'; } });
      if (st === 'playing' || st === 'preWave' || st === 'wave') break;
      await sleep(300);
    }
    // Ensure god mode matches the requested mode.
    await page.evaluate((wantGod) => {
      try {
        const isGod = GameManager.isGodMode ? GameManager.isGodMode() : false;
        if (wantGod && !isGod && GameManager.toggleGodMode) GameManager.toggleGodMode();
        if (!wantGod && isGod && GameManager.toggleGodMode) GameManager.toggleGodMode();
      } catch (e) {}
    }, god);
    await sleep(1500);
  }

  async function probe() {
    return await page.evaluate(() => {
      const out = { state: '?', stage: '?', wave: '?', enemies: -1, hp: -1, weapon: '?', nan: false };
      try {
        const gm = window.GameManager;
        out.state = gm.getState ? gm.getState() : '?';
        out.stage = gm.getCurrentStage ? gm.getCurrentStage() : '?';
        out.wave  = gm.getCurrentWave ? gm.getCurrentWave() : '?';
        if (window.Enemies && Enemies.getAll) out.enemies = Enemies.getAll().filter(e => e && e.hp > 0).length;
        if (window.player) out.hp = window.player.hp;
        if (window.Weapons && Weapons.getCurrentType) out.weapon = Weapons.getCurrentType();
        const c = gm.getCamera ? gm.getCamera().position : null;
        const p = window.player ? window.player.position : null;
        if (c && p) out.nan = [c.x, c.y, c.z, p.x, p.y, p.z].some(v => !Number.isFinite(v));
      } catch (e) {}
      return out;
    });
  }

  async function fireWeapon() {
    // Attempt to fire so muzzle flash / tracers show in the shot (best-effort).
    try {
      await page.evaluate(() => {
        const cv = document.querySelector('canvas');
        if (!cv) return;
        const r = cv.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const opt = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 };
        cv.dispatchEvent(new MouseEvent('mousedown', opt));
        document.dispatchEvent(new MouseEvent('mousedown', opt));
      });
      await sleep(220);
      await page.evaluate(() => {
        const cv = document.querySelector('canvas');
        const opt = { bubbles: true, cancelable: true, button: 0 };
        if (cv) cv.dispatchEvent(new MouseEvent('mouseup', opt));
        document.dispatchEvent(new MouseEvent('mouseup', opt));
      });
    } catch (e) {}
  }

  for (const mode of MODES) {
    const god = mode === 'god';
    const shots = god ? GOD_SHOTS : REG_SHOTS;
    for (let s = 0; s < stageCount; s++) {
      curStageLabel = `${mode}/stage${pad(s, 2)}`;
      let stageId = 's' + s;
      try {
        await startStage(s, god);
        stageId = await page.evaluate(() => { try { const i = GameManager.getStageInfo ? GameManager.getStageInfo() : null; return (i && (i.name || i.id)) ? String(i.name || i.id) : ''; } catch (e) { return ''; } }) || ('stage' + s);
      } catch (e) {
        errorLog.push(`[${curStageLabel}] START_FAIL: ${e.message}`);
      }
      const safeId = String(stageId).replace(/[^a-z0-9]+/gi, '_').slice(0, 28);
      const dir = path.join(ROOT, mode, `stage${pad(s, 2)}-${safeId}`);
      fs.mkdirSync(dir, { recursive: true });
      log(`${mode} stage ${s} "${stageId}" → ${shots} shots`);

      let deadStreak = 0;
      for (let k = 0; k < shots; k++) {
        // ONE combined round-trip: rotate weapon, fire a tap, return probe.
        let st = { state: '?', wave: '?', enemies: -1, hp: -1, weapon: '?', nan: false };
        try {
          st = await page.evaluate((idx) => {
            const out = { state: '?', wave: '?', enemies: -1, hp: -1, weapon: '?', nan: false };
            try {
              if (window.Weapons && Weapons.switchTo && Weapons.getWeaponCount) Weapons.switchTo(idx % Weapons.getWeaponCount());
              const cv = document.querySelector('canvas');
              if (cv) { const r = cv.getBoundingClientRect(); const o = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
                cv.dispatchEvent(new MouseEvent('mousedown', o)); document.dispatchEvent(new MouseEvent('mousedown', o)); }
              const gm = window.GameManager;
              out.state = gm.getState ? gm.getState() : '?';
              out.wave  = gm.getCurrentWave ? gm.getCurrentWave() : '?';
              if (window.Enemies && Enemies.getAll) out.enemies = Enemies.getAll().filter(e => e && e.hp > 0).length;
              if (window.player) out.hp = window.player.hp;
              if (window.Weapons && Weapons.getCurrentType) out.weapon = Weapons.getCurrentType();
              const c = gm.getCamera ? gm.getCamera().position : null, p = window.player ? window.player.position : null;
              if (c && p) out.nan = [c.x, c.y, c.z, p.x, p.y, p.z].some(v => !Number.isFinite(v));
            } catch (e) {}
            return out;
          }, k);
        } catch (e) {}
        const file = path.join(dir, `${pad(k, 3)}.jpg`);
        try { await page.screenshot({ path: file, type: 'jpeg', quality: 68, optimizeForSpeed: true, captureBeyondViewport: false }); shotTotal++; } catch (e) { errorLog.push(`[${curStageLabel}] SHOT_FAIL ${k}: ${e.message}`); }
        // release fire
        try { await page.evaluate(() => { const o = { bubbles: true, cancelable: true, button: 0 }; const cv = document.querySelector('canvas'); if (cv) cv.dispatchEvent(new MouseEvent('mouseup', o)); document.dispatchEvent(new MouseEvent('mouseup', o)); }); } catch (e) {}
        manifest.push({ mode, stage: s, stageId, shot: k, file: path.relative(ROOT, file), state: st.state, wave: st.wave, enemies: st.enemies, hp: st.hp, weapon: st.weapon, nan: st.nan });
        if (st.nan) errorLog.push(`[${curStageLabel}] NaN in camera/player at shot ${k}`);
        // Throttled progress flush so monitoring + crash-recovery work mid-stage.
        if (k % 10 === 0) { try { fs.writeFileSync(path.join(ROOT, 'progress.txt'), `${curStageLabel} shot ${k}/${shots} total=${shotTotal} ${new Date().toISOString()}`); } catch (e) {} }
        // Regular mode: if player died and game left 'playing', stop this stage early.
        if (!god && (st.state === 'gameover' || st.state === 'dead' || st.hp === 0)) {
          deadStreak++; if (deadStreak >= 2) { log(`  regular stage ${s}: player down at shot ${k}, advancing`); break; }
        } else deadStreak = 0;
        await sleep(SHOT_MS);
      }
      // Flush manifest periodically so progress survives a crash.
      fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 0));
      fs.writeFileSync(path.join(ROOT, 'errors.txt'), errorLog.join('\n'));
    }
  }

  const summary = {
    finishedAt: new Date().toISOString(),
    url: URL, stages: stageCount, weapons: weaponCount, modes: MODES,
    godShots: GOD_SHOTS, regShots: REG_SHOTS, cadenceMs: SHOT_MS,
    totalScreenshots: shotTotal, totalErrors: errorLog.length,
    root: ROOT,
  };
  fs.writeFileSync(path.join(ROOT, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 0));
  fs.writeFileSync(path.join(ROOT, 'errors.txt'), errorLog.join('\n'));
  log('DONE. screenshots:', shotTotal, '| errors:', errorLog.length, '| out:', ROOT);

  await browser.close();
  // Write a DONE marker last so the loop can detect completion.
  fs.writeFileSync(path.join(ROOT, 'DONE.txt'), `${shotTotal} shots, ${errorLog.length} errors\n`);
})().catch(e => { console.error('[MEGASWEEP] FATAL', e); try { fs.writeFileSync(path.join(ROOT, 'FATAL.txt'), String(e.stack || e)); } catch (_) {} process.exit(1); });
