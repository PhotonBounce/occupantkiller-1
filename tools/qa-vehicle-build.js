// Exercise vehicle enter/fire/exit + build mode; watch for runtime errors.
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 720 });
  await p.evaluateOnNewDocument(() => { window.__QA_MODE = true; });
  const errs = [];
  p.on('pageerror', e => errs.push('CRASH: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') { const t = m.text(); if (!/ERR_CONNECTION_REFUSED|favicon|AudioContext|3001|MP3|JUKEBOX/.test(t)) errs.push('CONSOLE: ' + t); } });

  await p.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  for (let i = 0; i < 40 && !(await p.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(250);
  await p.evaluate(() => { if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3000);

  const r = await p.evaluate(async () => {
    const out = {};
    const VS = window.VehicleSystem;
    if (!VS) return { error: 'no VehicleSystem' };
    const all = VS.getAll ? VS.getAll() : [];
    out.vehicleCount = all.length;
    const v = all.find(x => x && x.alive !== false) || all[0];
    if (!v) return { ...out, error: 'no vehicle to test' };
    out.vehicleType = v.type;
    // enter
    out.enterOk = VS.enter(v.id);
    out.inVehicle = VS.isInVehicle();
    // simulate firing while inside
    if (VS.setVehicleKey) VS.setVehicleKey('fire', true);
    // exit WITHOUT releasing fire (tests audit #33: fire key must be cleared on exit)
    VS.exit();
    out.inVehicleAfterExit = VS.isInVehicle();
    // re-enter and check it does NOT auto-fire (fire key should have been cleared)
    out.reenterOk = VS.enter(v.id);
    // peek at internal fire key via update — we can't read _vKeys directly, but
    // we can confirm no error and state is consistent
    out.inVehicleAfterReenter = VS.isInVehicle();
    VS.exit();
    return out;
  });
  console.log('vehicle:', JSON.stringify(r));

  // Build mode toggle
  const bm = await p.evaluate(async () => {
    const out = {};
    // simulate pressing B (build toggle) via the key handler
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB', key: 'b', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    out.stateAfterB = window.GameManager.getState();
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyB', key: 'b', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    out.stateAfterB2 = window.GameManager.getState();
    return out;
  });
  console.log('build:', JSON.stringify(bm));

  await sleep(800);
  console.log('TOTAL errors:', errs.length);
  errs.slice(0, 8).forEach(e => console.log('  ' + e));
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
