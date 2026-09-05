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
  // Console only says "Failed to load resource: net::ERR_FILE_NOT_FOUND" — it
  // never names the file, so the packaged app has been reporting missing assets
  // in a form nobody could act on. requestfailed carries the URL.
  const missing = [];
  page.on('requestfailed', r => {
    try {
      const u = r.url();
      if (missing.length < 20 && !missing.some(x => x.url === u)) {
        missing.push({ url: u.length > 160 ? u.slice(-160) : u, why: (r.failure() && r.failure().errorText) || '?' });
      }
    } catch (e) {}
  });

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
      o.bombsBefore = d && d.payloadCount;
      if (d) {
        o.dropped = DroneSystem.dropPayload(d.id);
        o.payloadAfter = d.hasPayload;
        o.bombsAfter = d.payloadCount;
        // Empty the rest of the bay one bomb at a time and check the aircraft
        // goes dry exactly when it runs out, not before and not never.
        o.dropsToEmpty = 1;
        for (let g = 0; g < 12 && d.hasPayload; g++) {
          if (!DroneSystem.dropPayload(d.id)) break;
          o.dropsToEmpty++;
        }
        o.payloadWhenEmpty = d.hasPayload;
        o.bombsWhenEmpty = d.payloadCount;
      }
      o.after = GameManager.getDroneLoadout().map(x => x.type + ':' + x.ammo);
      try { DroneSystem.release && DroneSystem.release(); } catch (e) {}
    } catch (e) { o.err = String(e && e.message || e).slice(0, 200); }
    return o;
  });
  if (!results.drone.launched) results.fail.push('bomber drone did not launch from the loadout');
  if (results.drone.type !== 'bomb') results.fail.push('possessed drone is not the bomber (' + results.drone.type + ')');
  if (results.drone.payloadBefore !== true) results.fail.push('bomber spawned with no payload');
  // dropPayload returns the drop descriptor ({position, damage}), not a boolean.
  if (!results.drone.dropped) results.fail.push('dropPayload did not report a drop');
  else if (!(results.drone.dropped.damage > 0)) results.fail.push('drop carried no damage');
  // The bomber carries a real bomb bay now, so one drop must spend ONE bomb and
  // leave the aircraft armed. The old assertion — hasPayload false after a
  // single drop — described the one-shot bomber and would now pass only if the
  // bay were being dumped all at once, which is the bug it looks like a check
  // against. Assert the whole contract instead: the count goes down by one, the
  // aircraft stays armed while bombs remain, and it goes dry exactly on empty.
  const dr = results.drone;
  if (typeof dr.bombsBefore !== 'number' || dr.bombsBefore < 2) {
    results.fail.push('bomber carries no bomb bay (payloadCount=' + dr.bombsBefore + ')');
  } else {
    if (dr.bombsAfter !== dr.bombsBefore - 1) {
      results.fail.push('one drop did not spend exactly one bomb ('
        + dr.bombsBefore + ' -> ' + dr.bombsAfter + ')');
    }
    if (dr.payloadAfter !== true) {
      results.fail.push('bomber went dry with ' + dr.bombsAfter + ' bombs still loaded');
    }
    if (dr.dropsToEmpty !== dr.bombsBefore) {
      results.fail.push('bay of ' + dr.bombsBefore + ' took ' + dr.dropsToEmpty + ' drops to empty');
    }
    if (dr.payloadWhenEmpty !== false) {
      results.fail.push('bomber still reports a payload with an empty bay');
    }
  }

  // ── 2. wildlife ─────────────────────────────────────────────────────────
  results.wildlife = await page.evaluate(() => {
    const o = { err: window.__wildlifeErr || null, byType: {} };
    try {
      // Count ALL wildlife, not just the `wild` ones. `wild` distinguishes
      // countryside animals from befriendable strays; on a built-up level the
      // set is crow/rabbit/cat/dog, and cats and dogs are pets, so a wild-only
      // count reported zero while animals were plainly spawning. "Are there
      // animals" is a question about faction, not about temperament.
      const all = NPCSystem.getAll ? NPCSystem.getAll() : [];
      all.forEach(n => {
        if (!n || !n.alive) return;
        const isAnimal = n.rank === 'wildlife' || n.wild ||
          (n.mesh && n.mesh.userData && n.mesh.userData.faction === 'wildlife');
        if (isAnimal) o.byType[n.type] = (o.byType[n.type] || 0) + 1;
      });
      o.total = Object.keys(o.byType).reduce((a, k) => a + o.byType[k], 0);
      o.wildOnly = all.filter(n => n && n.alive && n.wild).length;
      o.allNpcs = all.length;
      o.status = window.__wildlifeStatus || null;   // why a spawn produced nothing
      o.updateTicks = window.__npcUpdateTicks || 0; // proof NPCSystem.update runs
      // Count wildlife meshes straight off the scene too, in case they exist but
      // are not reachable through getAll().
      let inScene = 0;
      try { GameManager.getScene().traverse(x => { if (x.userData && x.userData.faction === 'wildlife') inScene++; }); } catch (e) {}
      o.wildlifeMeshesInScene = inScene;
    } catch (e) { o.readErr = String(e).slice(0, 200); }
    return o;
  });
  if (results.wildlife.err) results.fail.push('wildlife spawner error: ' + results.wildlife.err);
  if (!results.wildlife.total) {
    results.fail.push('no wildlife spawned after 45s (status: '
      + JSON.stringify(results.wildlife.status) + ', updateTicks: ' + results.wildlife.updateTicks
      + ', meshesInScene: ' + results.wildlife.wildlifeMeshesInScene + ')');
  }

  // ── 2b. does in-game time keep up with wall time? ───────────────────────
  // The frame loop clamps delta to 0.1s, so on a machine that renders slowly
  // the world clock advances slower than real time — every timed system (the
  // day/night cycle, weather, spawn cadences) stretches with it. That is a
  // candidate explanation for "I don't see day-night changes", so measure the
  // ratio rather than argue about it.
  const t0 = await page.evaluate(() => {
    try { return { clock: TimeSystem.getInfo().timeOfDay, ticks: window.__npcUpdateTicks || 0 }; }
    catch (e) { return null; }
  });
  const wallStart = Date.now();
  await page.waitForTimeout(20000);
  const t1 = await page.evaluate(() => {
    try { return { clock: TimeSystem.getInfo().timeOfDay, ticks: window.__npcUpdateTicks || 0 }; }
    catch (e) { return null; }
  });
  if (t0 && t1) {
    const wallSec = (Date.now() - wallStart) / 1000;
    // timeOfDay is 0..1 over TimeSystem.DAY_DURATION seconds of GAME time.
    const dayLen = await page.evaluate(() => { try { return TimeSystem.getDayDuration(); } catch (e) { return 600; } });
    let d = t1.clock - t0.clock; if (d < 0) d += 1;          // handle midnight wrap
    const gameSec = d * dayLen;
    results.timeRate = {
      wallSec: +wallSec.toFixed(1),
      gameSec: +gameSec.toFixed(1),
      ratio: +(gameSec / wallSec).toFixed(3),   // 1.0 == game time tracks real time
      framesInWindow: t1.ticks - t0.ticks,
      fpsInWindow: +((t1.ticks - t0.ticks) / wallSec).toFixed(1)
    };
  }

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
      fs.writeFileSync('verify-winter-night.png', Buffer.from(durl.split(',')[1], 'base64'));
      console.log('captured verify-winter-night.png');
    }
  } catch (e) {}

  results.pageErrors = errs.slice(0, 8);
  results.missingResources = missing;
  console.log(JSON.stringify(results, null, 1));
  fs.writeFileSync('verify-features.json', JSON.stringify(results, null, 1));
  await app.close();
  if (results.fail.length) { console.log('VERIFY FAIL: ' + results.fail.join(' | ')); process.exit(1); }
  console.log('VERIFY PASS');
  process.exit(0);
})().catch(e => { console.error('verify crashed:', e && e.stack || e); process.exit(1); });
