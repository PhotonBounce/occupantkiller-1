// Mass gallery capture (sharded). JPEG + small viewport for speed under swiftshader.
// Env: PREFIX (filename letter), STARTW, ENDW (weapon idx range), DOFEAT(=1), TARGET
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'screenshots', 'gallery');
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PREFIX = process.env.PREFIX || 'A';
const STARTW = parseInt(process.env.STARTW || '0', 10);
const ENDW = process.env.ENDW ? parseInt(process.env.ENDW, 10) : 999;
const DOFEAT = process.env.DOFEAT === '1';
const TARGET = parseInt(process.env.TARGET || '360', 10);
const VW = parseInt(process.env.VW || '900', 10);
const VH = parseInt(process.env.VH || '506', 10);
const FIRE_MS = parseInt(process.env.FIRE_MS || '230', 10);
let idx = 0;
const pad = n => String(n).padStart(4, '0');

async function snap(p, tag) {
  try {
    await p.screenshot({ path: path.join(OUT, `${PREFIX}${pad(++idx)}-${tag}.jpg`.replace(/[^a-z0-9.\-]/gi, '_')), type: 'jpeg', quality: 80 });
  } catch (e) { idx--; }
}
// Single combined eval per frame: ensure enemies, aim, fire, return kills.
async function step(p, wave, fireMs) {
  return await p.evaluate((w, fms) => {
    try {
      if (window.Enemies.getAliveCount() < 6) {
        if (window.GameManager.beginWave) window.GameManager.beginWave(w);
        else if (window.Enemies.startWave) window.Enemies.startWave(w);
        for (let i = 0; i < 5; i++) { if (window.Enemies.spawnReinforcement) window.Enemies.spawnReinforcement(); else if (window.Enemies.spawnSingle) window.Enemies.spawnSingle(); }
      }
      const cam = window.GameManager.getCamera();
      const cp = cam.getWorldPosition(new THREE.Vector3());
      const es = window.Enemies.getAll().filter(e => e && e.alive && e.mesh);
      if (es.length) {
        let best = null, bd = 1e9;
        for (const e of es) { const d = e.mesh.position.distanceTo(cp); if (d < bd) { bd = d; best = e; } }
        const dx = best.mesh.position.x - cp.x, dz = best.mesh.position.z - cp.z, dy = (best.mesh.position.y + 1.2) - cp.y;
        CameraSystem.setYaw(Math.atan2(-dx, -dz));
        CameraSystem.setPitch(Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)));
      } else { CameraSystem.setYaw((CameraSystem.getYaw ? CameraSystem.getYaw() : 0) + 0.5); }
      // real fire path (produces muzzle flash + actual hits)
      if (window.GameManager._testFireStart) { window.GameManager._testFireStart(); setTimeout(() => { if (window.GameManager._testFireStop) window.GameManager._testFireStop(); }, fms); }
      const c = document.querySelector('canvas:not([id])');
      if (c) { c.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true })); setTimeout(() => c.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })), fms); }
      return window.GameManager.getPlayer().kills | 0;
    } catch (e) { return 0; }
  }, wave, fireMs);
}
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--window-size='+VW+','+VH], protocolTimeout: 1800000 });
  const p = await browser.newPage();
  await p.setViewport({ width: VW, height: VH });
  await p.evaluateOnNewDocument(() => { window.__QA_MODE = true; });
  const errs = [];
  p.on('pageerror', e => errs.push('CRASH:' + e.message));
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(300);
  await p.evaluate(() => { Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true }); if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3500);
  const wc = await p.evaluate(() => { try { if (!window.GameManager.isGodMode()) window.GameManager.toggleGodMode(); } catch (e) {} return window.Weapons.getWeaponCount(); });
  console.log(PREFIX + ' weapons=' + wc + ' god=' + await p.evaluate(() => window.GameManager.isGodMode()));
  let wave = 1 + STARTW;
  const lastW = Math.min(ENDW, wc - 1);
  const span = (lastW - STARTW + 1);
  const fpw = Math.max(8, Math.ceil((TARGET * (DOFEAT ? 0.75 : 0.95)) / span));
  for (let w = STARTW; w <= lastW && idx < TARGET; w++) {
    await p.evaluate((wi) => { try { window.GameManager.setState('playing'); window.Weapons.switchTo(wi); } catch (e) {} }, w);
    await sleep(160);
    const wname = await p.evaluate(() => (window.Weapons.getCurrentName() || 'wpn').replace(/[^a-z0-9]/gi, '').slice(0, 14));
    for (let f = 0; f < fpw && idx < TARGET; f++) {
      const k = await step(p, wave++, FIRE_MS); await sleep(120);
      await snap(p, `w${pad(w).slice(2)}-${wname}-k${k}`);
    }
  }
  if (DOFEAT) {
    async function feature(name, fn, frames) {
      try { await p.evaluate(fn); } catch (e) {}
      await sleep(900);
      for (let f = 0; f < frames && idx < TARGET; f++) { await step(p, wave++, FIRE_MS); await sleep(120); await snap(p, 'feat-' + name); }
    }
    await feature('mortar', () => { try { if (window.Mortar && window.Mortar.deploy) window.Mortar.deploy(); } catch (e) {} }, 10);
    await feature('bradley', () => { try { const cp = window.GameManager.getCamera().getWorldPosition(new THREE.Vector3()); if (window.Bradley && window.Bradley.spawnAt) window.Bradley.spawnAt(cp.x + 6, cp.z); } catch (e) {} }, 12);
    await feature('drone', () => { try { if (window.DroneSystem && window.DroneSystem.callRecon) window.DroneSystem.callRecon(); } catch (e) {} }, 10);
    await feature('airwar', () => { try { for (let i = 0; i < 4; i++) if (window.DroneSystem && window.DroneSystem.spawnEnemyDrone) window.DroneSystem.spawnEnemyDrone(); } catch (e) {} }, 10);
    await feature('night', () => { try { if (window.TimeSystem && window.TimeSystem.setHour) window.TimeSystem.setHour(23); } catch (e) {} }, 12);
    await feature('storm', () => { try { if (window.WeatherSystem) { (window.WeatherSystem.setWeather||window.WeatherSystem.set).call(window.WeatherSystem,'rain'); } } catch (e) {} }, 12);
    await feature('day', () => { try { if (window.TimeSystem && window.TimeSystem.setHour) window.TimeSystem.setHour(12); } catch (e) {} }, 8);
  }
  // top up
  let guard = 0;
  while (idx < TARGET && guard++ < 800) {
    await p.evaluate((s, e) => { try { window.Weapons.switchTo(s + Math.floor(Math.random() * (e - s + 1))); } catch (x) {} }, STARTW, lastW);
    for (let f = 0; f < 6 && idx < TARGET; f++) { const k = await step(p, wave++, FIRE_MS); await sleep(110); await snap(p, 'combat-k' + k); }
  }
  const fin = await p.evaluate(() => { try { return { kills: window.GameManager.getPlayer().kills, god: window.GameManager.isGodMode() }; } catch (e) { return {}; } });
  console.log(`${PREFIX} DONE frames=${idx} kills=${fin.kills} god=${fin.god} errs=${errs.length}`);
  await browser.close();
})().catch(e => console.log(PREFIX + ' SCRIPTERR:', e.message, '| frames:', idx));
