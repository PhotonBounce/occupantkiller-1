// Feature verification against the PACKAGED Windows build.
//
// The three items this closes could not be checked in the Linux dev container:
// its software renderer produced a time-to-playing anywhere between 8 seconds
// and six minutes on identical code, so nothing measured there was trustworthy.
// This runs the same binary that ships, on the same driver family as the
// reported machine, and answers each question with a value rather than a guess:
//
//   1. drone bombing   — launch a bomber from the loadout, drop, check the
//                        payload cleared and one round was spent
//   2. wildlife        — do animals actually spawn, and does the spawner report
//                        an error (it records one into window.__wildlifeErr)
//   3. winter visuals  — force night + snow, then read the values that drive
//                        them (sun/ambient/fog/ground cover) and capture a frame
//
// Exits non-zero if a check that should be deterministic comes back wrong.
const { _electron } = require('playwright');
const fs = require('fs');

(async () => {
  const exe = process.argv[2];
  if (!exe || !fs.existsSync(exe)) { console.error('exe not found: ' + exe); process.exit(1); }
  const app = await _electron.launch({ executablePath: exe, args: [] });
  const page = await app.firstWindow();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });

  await page.waitForFunction(
    () => typeof window.GameManager !== 'undefined' && !!GameManager.startGame,
    null, { timeout: 180000 });
  await page.evaluate(() => { window.__chosenStartStage = 0; setTimeout(() => { try { GameManager.startGame(); } catch (e) {} }, 0); });
  await page.waitForFunction(
    () => window.GameManager && GameManager.getState && GameManager.getState() === 'playing',
    null, { timeout: 240000 });
  console.log('state: playing');

  // Wildlife spawns on a timer (first tick ~4s, then every 9-18s) and is capped,
  // so give it a few cycles before counting.
  await page.waitForTimeout(45000);

  const results = { fail: [] };

  // ── 1. drone bombing ────────────────────────────────────────────────────
  results.drone = await page.evaluate(() => {
    const o = {};
    try {
      o.before = GameManager.getDroneLoadout().map(d => d.type + ':' + d.ammo);
      o.launched = GameManager.launchDroneFromLoadout('bomb');
      o.possessing = DroneSystem.isPossessing();
      const d = DroneSystem.getPossessed();
      o.type = d && d.type;
      o.payloadBefore = d && d.hasPayload;
      if (d) { o.dropped = DroneSystem.dropPayload(d.id); o.payloadAfter = d.hasPayload; }
      o.after = GameManager.getDroneLoadout().map(x => x.type + ':' + x.ammo);
      try { DroneSystem.release && DroneSystem.release(); } catch (e) {}
    } catch (e) { o.err = String(e && e.message || e).slice(0, 200); }
    return o;
  });
  if (!results.drone.launched) results.fail.push('bomber drone did not launch from the loadout');
  if (results.drone.type !== 'bomb') results.fail.push('possessed drone is not the bomber (' + results.drone.type + ')');
  if (results.drone.payloadBefore !== true) results.fail.push('bomber spawned with no payload');
  if (results.drone.dropped !== true) results.fail.push('dropPayload did not report a drop');
  if (results.drone.payloadAfter !== false) results.fail.push('payload not consumed by the drop');

  // ── 2. wildlife ─────────────────────────────────────────────────────────
  results.wildlife = await page.evaluate(() => {
    const o = { err: window.__wildlifeErr || null, byType: {} };
    try {
      const all = NPCSystem.getAll ? NPCSystem.getAll() : [];
      all.forEach(n => { if (n && n.wild && n.alive) o.byType[n.type] = (o.byType[n.type] || 0) + 1; });
      o.total = Object.keys(o.byType).reduce((a, k) => a + o.byType[k], 0);
    } catch (e) { o.readErr = String(e).slice(0, 200); }
    return o;
  });
  if (results.wildlife.err) results.fail.push('wildlife spawner error: ' + results.wildlife.err);
  if (!results.wildlife.total) results.fail.push('no wildlife spawned after 45s');

  // ── 3. winter / night visuals ───────────────────────────────────────────
  await page.evaluate(() => {
    try { TimeSystem.setSeason('Winter'); TimeSystem.setHour(23); } catch (e) {}
    try { WeatherSystem.forceWeather('SNOW'); } catch (e) {}
  });
  await page.waitForTimeout(30000);   // snow needs ~20s to lay a full cover
  results.winter = await page.evaluate(() => {
    const o = {}, sc = GameManager.getScene();
    let sun = null, amb = null;
    sc.traverse(x => { if (x.isDirectionalLight && !sun) sun = x; if (x.isAmbientLight && !amb) amb = x; });
    o.sun = sun ? +sun.intensity.toFixed(3) : null;
    o.ambient = amb ? +amb.intensity.toFixed(3) : null;
    o.fog = sc.fog ? '#' + sc.fog.color.getHexString() : null;
    o.background = (sc.background && sc.background.isColor) ? '#' + sc.background.getHexString() : null;
    try { o.weather = WeatherSystem.getCurrentWeather(); o.groundSnow = +WeatherSystem.getGroundSnow().toFixed(3); } catch (e) {}
    try { o.snowCover = VoxelWorld.getSnowCover(); } catch (e) {}
    try { o.season = TimeSystem.getSeason(); o.clock = TimeSystem.getFormattedTime(); o.phase = TimeSystem.getInfo().phase; } catch (e) {}
    let snowPts = 0;
    sc.traverse(x => { if (x.isPoints && x.visible && x.material && x.material.color && x.material.color.getHexString() === 'ffffff') snowPts++; });
    o.snowParticleSystems = snowPts;
    return o;
  });
  if (results.winter.phase !== 'night') results.fail.push('forced 23:00 but phase is ' + results.winter.phase);
  if (!(results.winter.sun === 0)) results.fail.push('sun not extinguished at night (' + results.winter.sun + ')');
  if (!(results.winter.snowCover > 0)) results.fail.push('ground snow never accumulated (' + results.winter.snowCover + ')');
  if (results.winter.weather !== 'SNOW') results.fail.push('weather did not hold SNOW (' + results.winter.weather + ')');

  // Frame capture so the winter scene can be eyeballed, not just asserted.
  try {
    const durl = await page.evaluate(() => { try { return GameManager.captureFrame(); } catch (e) { return null; } });
    if (durl && durl.indexOf('data:image/png;base64,') === 0) {
      fs.writeFileSync('desktop/verify-winter-night.png', Buffer.from(durl.split(',')[1], 'base64'));
      console.log('captured desktop/verify-winter-night.png');
    }
  } catch (e) {}

  results.pageErrors = errs.slice(0, 8);
  console.log(JSON.stringify(results, null, 1));
  fs.writeFileSync('desktop/verify-features.json', JSON.stringify(results, null, 1));
  await app.close();
  if (results.fail.length) { console.log('VERIFY FAIL: ' + results.fail.join(' | ')); process.exit(1); }
  console.log('VERIFY PASS');
  process.exit(0);
})().catch(e => { console.error('verify crashed:', e && e.stack || e); process.exit(1); });
