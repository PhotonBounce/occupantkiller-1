// Autonomous play session against the PACKAGED .exe on a real Windows machine.
// Not a launch check — it plays: god mode, auto-aim kill bot, weapon cycling,
// across multiple levels, while sampling performance every 2s.
//
// Its main job is diagnostic: three.js exposes a cacheKey per compiled shader
// program, so we diff the program list over time and print the keys that are
// NEW. That names the exact material feature combination causing the recompile
// churn that still pins frame time (progs 20->63 with lights held constant).
//
// Usage: node play-session.js <exe> [secsPerStage] [stages]
const { _electron } = require('playwright');
const fs = require('fs'), path = require('path');

const EXE = process.argv[2];
const SECS = parseInt(process.argv[3] || '45', 10);
const STAGES = (process.argv[4] || '0,2,4').split(',').map(Number);
const OUT = process.cwd();

function BOT() {
  try {
    const cv = document.querySelector('#game-container canvas') || document.querySelector('canvas');
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => cv });
  } catch (e) {}
  window.__kills = 0; window.__prevAlive = null;
  window.__good = [];
  try {
    const GOOD = /^(ASSAULT|RIFLE|LMG|SMG|HMG|HMG_HEAVY|SNIPER|SHOTGUN|SILENT|NATO)$/;
    for (let i = 0; i < Weapons.getWeaponCount(); i++) {
      const d = Weapons.getWeaponDef && Weapons.getWeaponDef(i);
      if (d && GOOD.test(String(d.type || ''))) window.__good.push(i);
    }
  } catch (e) {}
  let wi = 0;
  window.__wsw = setInterval(() => { try { if (window.__good.length) Weapons.switchTo(window.__good[wi++ % window.__good.length]); } catch (e) {} }, 3000);
  window.__bot = setInterval(() => {
    try {
      const cam = GameManager.getCamera(); if (!cam || !window.Enemies) return;
      const all = Enemies.getAll() || [];
      if (!window.__v) { window.__v = new THREE.Vector3(); window.__v2 = new THREE.Vector3(); }
      const cw = cam.getWorldPosition(window.__v2);
      let alive = 0, best = null, bd = 1e12;
      for (const e of all) {
        if (!e || e.alive === false) continue;
        const m = e.mesh || e.group; if (!m) continue;
        alive++;
        const wp = m.getWorldPosition(window.__v);
        const dx = wp.x - cw.x, dy = (wp.y + 1.1) - cw.y, dz = wp.z - cw.z;
        const d2 = dx * dx + dz * dz;
        if (d2 > 8100) continue;
        if (d2 < bd) { bd = d2; best = { dx, dy, dz }; }
      }
      if (window.__prevAlive != null && alive < window.__prevAlive) window.__kills += (window.__prevAlive - alive);
      window.__prevAlive = alive; window.__alive = alive;
      const CS = (typeof CameraSystem !== 'undefined') ? CameraSystem : null;
      if (best && CS && CS.setYaw) {
        CS.setYaw(Math.atan2(-best.dx, -best.dz));
        CS.setPitch(Math.atan2(best.dy, Math.sqrt(best.dx * best.dx + best.dz * best.dz)));
        window.__advance = Math.sqrt(bd) > 9;
      }
    } catch (e) {}
  }, 80);
}

(async () => {
  if (!EXE || !fs.existsSync(EXE)) { console.error('exe missing: ' + EXE); process.exit(1); }
  const app = await _electron.launch({ executablePath: EXE });
  const page = await app.firstWindow();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') { const t = m.text().slice(0, 200); if (!/ERR_FILE_NOT_FOUND/.test(t)) errors.push(t); } });
  page.on('pageerror', e => errors.push('PAGEERROR ' + String(e.message).slice(0, 200)));

  await page.waitForFunction(() => ['THREE','VoxelWorld','Weapons','Enemies','HUD','GameManager']
    .every(m => typeof window[m] !== 'undefined') && !!window.GameManager.startGame, null, { timeout: 180000 });

  const report = { stages: [], newProgramKeys: [], errors: [] };
  let seenKeys = new Set();

  for (const stage of STAGES) {
    console.log('=== STAGE ' + stage + ' ===');
    await page.evaluate(s => { window.__chosenStartStage = s; setTimeout(() => { try { GameManager.startGame(); } catch (e) {} }, 0); }, stage);
    try {
      await page.waitForFunction(() => GameManager.getState && GameManager.getState() === 'playing', null, { timeout: 240000 });
    } catch (e) { console.log('stage ' + stage + ': never reached playing'); report.stages.push({ stage, error: 'never playing' }); continue; }
    await page.waitForTimeout(3000);
    await page.evaluate(BOT);
    await page.evaluate(() => { window.__pf = 0; (function l(){ window.__pf++; requestAnimationFrame(l); })(); });

    const samples = [];
    const t0 = Date.now();
    let advancing = false;
    while (Date.now() - t0 < SECS * 1000) {
      try { await page.mouse.down(); } catch (e) {}
      await page.waitForTimeout(300);
      try { await page.mouse.up(); } catch (e) {}
      try {
        const want = await page.evaluate(() => !!window.__advance);
        if (want && !advancing) { await page.keyboard.down('KeyW'); advancing = true; }
        else if (!want && advancing) { await page.keyboard.up('KeyW'); advancing = false; }
      } catch (e) {}
      await page.waitForTimeout(200);

      // sample perf + collect NEW shader program cache keys
      const s = await page.evaluate(() => {
        const r = GameManager.getRenderer();
        const h = window.__renderHealth || {};
        const keys = (r && r.info && r.info.programs) ? r.info.programs.map(p => String(p.cacheKey || '')) : [];
        const f = window.__pf; window.__pf = 0;
        return { frames: f, renderMs: h.renderMs, draw: h.drawCalls, lights: h.lights, tris: h.triangles, kills: window.__kills, alive: window.__alive, keys };
      });
      const fresh = s.keys.filter(k => !seenKeys.has(k));
      fresh.forEach(k => seenKeys.add(k));
      if (fresh.length) report.newProgramKeys.push(...fresh.slice(0, 4).map(k => k.slice(0, 150)));
      delete s.keys;
      s.newPrograms = fresh.length; s.totalPrograms = seenKeys.size;
      samples.push(s);
    }
    try { if (advancing) await page.keyboard.up('KeyW'); } catch (e) {}
    await page.evaluate(() => { clearInterval(window.__bot); clearInterval(window.__wsw); });

    const mid = samples.slice(Math.floor(samples.length / 2));
    const avg = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null;
    const st = {
      stage,
      fpsEarly: avg(samples.slice(0, 5).map(x => x.frames / 0.5)),
      fpsLate: avg(mid.map(x => x.frames / 0.5)),
      renderMsLate: avg(mid.map(x => x.renderMs).filter(Number.isFinite)),
      drawLate: avg(mid.map(x => x.draw).filter(Number.isFinite)),
      lights: samples.length ? samples[samples.length - 1].lights : null,
      kills: samples.length ? samples[samples.length - 1].kills : 0,
      newProgramsLate: mid.reduce((a, b) => a + b.newPrograms, 0),
      totalPrograms: seenKeys.size,
    };
    console.log('STAGE ' + stage + ' ' + JSON.stringify(st));
    report.stages.push(st);
    try { await page.screenshot({ path: path.join(OUT, 'play-stage-' + String(stage).padStart(2, '0') + '.png') }); } catch (e) {}
  }

  report.errors = errors.slice(0, 15);
  fs.writeFileSync(path.join(OUT, 'play-report.json'), JSON.stringify(report, null, 1));
  console.log('--- NEW PROGRAM KEYS (churn source) ---');
  report.newProgramKeys.slice(0, 12).forEach(k => console.log('  ' + k));
  console.log('--- JS ERRORS (' + errors.length + ') ---');
  report.errors.slice(0, 8).forEach(e => console.log('  ' + e));
  await app.close();
  process.exit(0);
})().catch(e => { console.error('PLAY SESSION ERROR', e && e.message); process.exit(1); });
