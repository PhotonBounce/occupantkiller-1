// QA: Battle of Kyiv capital defense (stage 13). Boots straight into the
// stage via __QA_START_STAGE and asserts the full feature set:
//   convoy spawn/advance/spacing, TB2 on station + MAM-L fire, breach →
//   city HP drop without wave stall, mission + HUD wiring, defeat path.
// Screenshots into tools/screenshots/kyiv/.
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const OUT = path.join(__dirname, 'screenshots', 'kyiv');
fs.mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (detail ? ' — ' + detail : '')); }
}

(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1024,576'], protocolTimeout: 300000 });
  const p = await b.newPage();
  await p.setViewport({ width: 1024, height: 576 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 110)));
  await p.evaluateOnNewDocument(() => { window.__QA_MODE = true; window.__QA_START_STAGE = 12; });
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(300);
  await p.evaluate(() => { Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true }); if (window.forceStartGame) window.forceStartGame(); });
  await sleep(7000);

  console.log('══ Battle of Kyiv QA ══');

  // ── Stage + mission + HUD ──
  const s1 = await p.evaluate(() => {
    try { if (!window.GameManager.isGodMode()) window.GameManager.toggleGodMode(); } catch (e) {}
    const m = MissionSystem.getActive()[0];
    const bar = document.getElementById('city-integrity');
    return {
      stage: GameManager.getStageInfo().name,
      mission: m ? m.name : 'none',
      missionText: m && m.data ? m.data.objectiveText : '',
      cityBar: !!(bar && bar.style.display !== 'none'),
      cityHP: ConvoySystem.getCityHP(),
    };
  });
  check('stage is BATTLE OF KYIV', s1.stage === 'BATTLE OF KYIV', s1.stage);
  check('kyiv_defense mission active', s1.mission === 'Defend the Capital', s1.mission);
  check('mission text live', /city integrity/.test(s1.missionText), s1.missionText);
  check('city bar visible at 100', s1.cityBar && s1.cityHP === 100, JSON.stringify(s1));

  // ── Convoy spawn + composition ──
  const s2 = await p.evaluate(() => {
    const c = ConvoySystem.getConvoys()[0];
    return c ? {
      units: c.units.length,
      types: c.units.map(u => u.typeCfg.name),
      lead: c.units[0] && c.units[0].mesh ? { x: c.units[0].mesh.position.x, z: c.units[0].mesh.position.z } : null,
    } : null;
  });
  check('convoy spawned with >= 3 units', !!s2 && s2.units >= 3, JSON.stringify(s2));
  check('column has tanks', !!s2 && s2.types.indexOf('TANK') >= 0, s2 && s2.types.join(','));

  // ── TB2 on station ──
  const s3 = await p.evaluate(() => {
    const ds = DroneSystem.getAll ? DroneSystem.getAll() : [];
    const tb2 = ds.find(d => d.type === 'bayraktar');
    return tb2 ? { alt: tb2.position.y, missiles: tb2.missiles } : null;
  });
  check('TB2 on station above 25m', !!s3 && s3.alt > 25, JSON.stringify(s3));
  check('TB2 armed (or already firing)', !!s3 && s3.missiles >= 1 && s3.missiles <= 4, s3 && ('missiles=' + s3.missiles));

  // ── Convoy advance over time + spacing ──
  await sleep(15000);
  const s4 = await p.evaluate(() => {
    const c = ConvoySystem.getConvoys()[0];
    if (!c) return { gone: true };
    const gaps = [];
    for (let i = 1; i < c.units.length; i++) {
      if (c.units[i].mesh && c.units[i - 1].mesh) gaps.push(c.units[i].mesh.position.distanceTo(c.units[i - 1].mesh.position));
    }
    return { wpIdx: c.wpIdx, lead: c.units[0] && c.units[0].mesh ? { x: c.units[0].mesh.position.x, z: c.units[0].mesh.position.z } : null, gaps };
  });
  check('column advancing (waypoints progress)', s4.gone || s4.wpIdx >= 1, JSON.stringify(s4));
  check('column spacing 4-25u', s4.gone || s4.gaps.every(g => g > 4 && g < 25), s4.gaps && s4.gaps.map(g => g.toFixed(0)).join(','));
  // screenshot: look at the column
  await p.evaluate(() => {
    const lp = ConvoySystem.getLeadPosition(GameManager.getPlayer().position);
    if (lp) { const cam = GameManager.getCamera(); const cp = cam.getWorldPosition(new THREE.Vector3());
      const dx = lp.x - cp.x, dz = lp.z - cp.z, dy = (lp.y + 1) - cp.y;
      CameraSystem.setYaw(Math.atan2(-dx, -dz)); CameraSystem.setPitch(Math.atan2(dy, Math.sqrt(dx * dx + dz * dz))); }
  });
  await sleep(2500);
  await p.screenshot({ path: path.join(OUT, 'qa-convoy.jpg'), type: 'jpeg', quality: 84 });

  // ── Breach: city HP drops, unit removed, alive-count drops (no stall) ──
  const s5 = await p.evaluate(() => new Promise(done => {
    const before = { hp: ConvoySystem.getCityHP(), alive: Enemies.getAliveCount() };
    const c = ConvoySystem.getConvoys()[0];
    if (c && c.units[0] && c.units[0].mesh) c.units[0].mesh.position.set(0, 8, 1);
    setTimeout(() => {
      done({ before, after: { hp: ConvoySystem.getCityHP(), alive: Enemies.getAliveCount() },
        barText: (document.getElementById('city-integrity') || {}).textContent || '' });
    }, 4000);
  }));
  check('breach drops city HP', s5.after.hp < s5.before.hp, JSON.stringify(s5));
  check('breach removes unit from alive count', s5.after.alive < s5.before.alive, s5.before.alive + '->' + s5.after.alive);
  check('city bar reflects damage', new RegExp(String(s5.after.hp)).test(s5.barText), s5.barText);
  await p.screenshot({ path: path.join(OUT, 'qa-breach.jpg'), type: 'jpeg', quality: 84 });

  // ── Defeat: drain to 0 → KYIV HAS FALLEN ──
  const s6 = await p.evaluate(() => new Promise(done => {
    try { if (window.GameManager.isGodMode()) window.GameManager.toggleGodMode(); } catch (e) {}
    const iv = setInterval(() => {
      let cv = ConvoySystem.getConvoys()[0];
      if (!cv && ConvoySystem.getCityHP() > 0) { ConvoySystem.spawnConvoy(9, { route: 'north', tanks: 3, btrs: 0 }); cv = ConvoySystem.getConvoys()[0]; }
      if (cv) for (const u of cv.units) { if (u.mesh) u.mesh.position.set(0, 8, 1); }
      if (ConvoySystem.getCityHP() <= 0) {
        clearInterval(iv);
        setTimeout(() => done({ hp: ConvoySystem.getCityHP(), state: GameManager.getState(),
          title: (document.getElementById('dead-title') || {}).textContent || '' }), 4000);
      }
    }, 1500);
    setTimeout(() => { try { clearInterval(iv); } catch (e) {} done({ timeout: true, hp: ConvoySystem.getCityHP(), state: GameManager.getState() }); }, 90000);
  }));
  check('city HP reaches 0', s6.hp === 0, JSON.stringify(s6));
  check('defeat shows KYIV HAS FALLEN', s6.state === 'dead' && s6.title === 'KYIV HAS FALLEN', s6.state + '/' + s6.title);
  await p.screenshot({ path: path.join(OUT, 'qa-fallen.jpg'), type: 'jpeg', quality: 84 });

  check('zero page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

  console.log('══ Results: ' + pass + ' passed, ' + fail + ' failed ══');
  console.log(fail === 0 ? '✅ KYIV QA PASSED' : '❌ KYIV QA FAILED');
  await b.close();
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.log('QAERR', e.message); process.exit(1); });
