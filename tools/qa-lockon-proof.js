// Prove the ATGM lock-on bracket draws over a target, end-to-end, on stage 0.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const URL_BASE = process.argv[2] || 'http://localhost:3000';
const OUT = path.join(__dirname, 'screenshots', 'lockon-proof');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.evaluateOnNewDocument(() => { window.__QA_MODE = true; });
  await page.goto(URL_BASE, { waitUntil: 'networkidle0', timeout: 30000 });
  for (let i = 0; i < 40 && !(await page.evaluate(() => typeof window.GameManager !== 'undefined')); i++) await sleep(250);
  await page.evaluate(() => { if (window.forceStartGame) window.forceStartGame(); });
  await sleep(3500);

  const setup = await page.evaluate(() => {
    const gm = window.GameManager;
    try { if (!gm.isGodMode()) gm.toggleGodMode(); } catch (e) {}
    // Switch to a homing weapon (Javelin/Stugna/Igla)
    let hIdx = -1;
    const n = Weapons.getWeaponCount();
    for (let i = 0; i < n; i++) { const d = Weapons.getWeaponDef(i); if (d && d.homing) { hIdx = i; break; } }
    if (hIdx >= 0) Weapons.switchTo(hIdx);
    // Move an enemy directly in front of the camera along its forward vector.
    const cam = gm.getCamera();
    const camPos = cam.getWorldPosition(new THREE.Vector3());
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
    const target = camPos.clone().addScaledVector(fwd, 45);
    let moved = false, eid = null;
    const all = (typeof Enemies !== 'undefined' && Enemies.getAll) ? Enemies.getAll() : [];
    for (const e of all) { if (e && e.alive && e.mesh) { e.mesh.position.copy(target); if (e.position) e.position.copy(target); moved = true; eid = e.id; break; } }
    // Engage ADS/zoom so the homing lock logic runs.
    if (Weapons.handleRightDown) Weapons.handleRightDown();
    return { homingIdx: hIdx, homingId: hIdx >= 0 ? Weapons.getWeaponId(hIdx) : null, enemyMoved: moved, zoomed: Weapons.isZoomed ? Weapons.isZoomed() : null };
  });
  console.log('setup:', JSON.stringify(setup));
  await sleep(1500); // let a few update ticks run the lock logic

  const lockState = await page.evaluate(() => {
    const b = [...document.querySelectorAll('div')].find(d => d.style && d.style.width === '64px' && /LOCK/.test(d.textContent));
    if (!b) return { bracketExists: false };
    const r = b.getBoundingClientRect();
    return { bracketExists: true, opacity: b.style.opacity, left: b.style.left, top: b.style.top, cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2) };
  });
  console.log('lockState:', JSON.stringify(lockState));
  await page.screenshot({ path: path.join(OUT, 'lockon.png'), type: 'png' });
  await browser.close();
  process.exit(lockState.bracketExists && lockState.opacity === '1' ? 0 : 2);
})();
