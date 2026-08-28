// Flies the FPV drone mission (stage 18, Refinery Strike) on the PACKAGED
// Windows build and captures the run. It plays the mission the way a player
// would: take off, fly toward the refinery, put the nose on a target, fire a
// munition, repeat — and it captures a frame at every step so the result can be
// looked at rather than asserted.
//
// Reports munitions spent, enemies killed, structures destroyed.
const { _electron } = require('playwright');
const fs = require('fs');

const SHOTS = [];
async function shot(page, name) {
  try {
    const d = await page.evaluate(() => { try { return GameManager.captureFrame(); } catch (e) { return null; } });
    if (d && d.indexOf('data:image/png;base64,') === 0) {
      const f = 'drone-' + name + '.png';
      fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
      SHOTS.push(f);
      console.log('  shot ' + f);
      return true;
    }
  } catch (e) {}
  console.log('  shot ' + name + ' FAILED');
  return false;
}

(async () => {
  const exe = process.argv[2];
  if (!exe || !fs.existsSync(exe)) { console.error('exe not found: ' + exe); process.exit(1); }
  const app = await _electron.launch({ executablePath: exe, args: [] });
  const page = await app.firstWindow();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });

  await page.waitForFunction(() => typeof window.GameManager !== 'undefined' && !!GameManager.startGame, null, { timeout: 180000 });

  // __chosenStartStage is an INDEX into STAGES, not a stage id: the drone-only
  // "REFINERY STRIKE" is id 18, which lives at index 17. And index.html resets
  // the value to 0 from a load-time IIFE, so setting it before the page has
  // finished loading gets silently clobbered — which is exactly what happened:
  // an earlier run launched Hostomel and captured ten frames of ordinary
  // infantry gameplay while reporting success. Wait for load, then set it in
  // the same tick as the call.
  await page.waitForLoadState('load').catch(() => {});
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 60000 }).catch(() => {});
  const REFINERY_INDEX = 17;
  await page.evaluate((idx) => {
    setTimeout(() => {
      window.__chosenStartStage = idx;
      try { GameManager.startGame(); } catch (e) {}
    }, 0);
  }, REFINERY_INDEX);
  await page.waitForFunction(() => window.GameManager && GameManager.getState && GameManager.getState() === 'playing',
    null, { timeout: 240000 });
  console.log('state: playing (stage 18)');

  // Wait for the MISSION, not for a guessed number of seconds. The wave — and
  // with it RefineryStrike.startMission, the garrison and the drone — starts on
  // a timer after the stage loads, so a fixed 9s sleep aborted on a stage that
  // was perfectly fine and simply had not begun yet.
  let ready = false;
  for (let w = 0; w < 40; w++) {
    await page.waitForTimeout(3000);
    const st = await page.evaluate(() => {
      const o = {};
      try { o.active = RefineryStrike.isActive(); o.targets = RefineryStrike.getProgress().total; } catch (e) {}
      try { o.drone = DroneSystem.isPossessing(); } catch (e) {}
      return o;
    });
    if (st.active && st.targets > 0 && st.drone) { ready = true; break; }
    if (w % 4 === 0) console.log('  waiting for mission: ' + JSON.stringify(st));
  }
  console.log(ready ? 'mission live' : 'mission never started');

  const setup = await page.evaluate(() => {
    const o = {};
    try { o.stage = GameManager.getCurrentStageInfo(); } catch (e) {}
    try { o.missionActive = RefineryStrike.isActive(); o.targets = RefineryStrike.getProgress(); } catch (e) {}
    try { o.enemies = Enemies.getAliveCount(); } catch (e) {}
    try {
      o.possessing = DroneSystem.isPossessing();
      const d = DroneSystem.getPossessed();
      o.droneType = d && d.type;
      o.ammo = d && d.payloadCount;
      o.droneHp = d && d.health;
    } catch (e) {}
    return o;
  });
  console.log('setup: ' + JSON.stringify(setup));

  // Refuse to produce screenshots of the wrong thing. The previous run captured
  // ten frames of the wrong stage and still exited 0; a capture script whose
  // output will be shown to someone has to fail loudly when it is not filming
  // what it claims to film.
  const wrongStage = !setup.stage || setup.stage.id !== 18;
  const noMission  = !setup.missionActive || !(setup.targets && setup.targets.total > 0);
  const noDrone    = !setup.possessing || setup.droneType !== 'fpv_attack';
  if (wrongStage || noMission || noDrone) {
    console.log('ABORT — not the drone mission: '
      + (wrongStage ? 'stage=' + JSON.stringify(setup.stage) + ' ' : '')
      + (noMission ? 'missionActive=' + setup.missionActive + ' targets=' + JSON.stringify(setup.targets) + ' ' : '')
      + (noDrone ? 'possessing=' + setup.possessing + ' droneType=' + setup.droneType : ''));
    fs.writeFileSync('drone-mission.json', JSON.stringify({ aborted: true, setup: setup }, null, 1));
    await app.close();
    process.exit(1);
  }
  await shot(page, '01-launch');

  // Establishing shot: pull up and back over the refinery so the whole target
  // area, the tanks and the garrison are visible in one frame.
  await page.evaluate(() => {
    try {
      const d = DroneSystem.getPossessed();
      if (!d) return;
      d.position.set(0, 30, 46);
      if (d.mesh) { d.mesh.position.copy(d.position); d.mesh.lookAt(0, 2, 0); }
    } catch (e) {}
  });
  await page.waitForTimeout(900);
  await shot(page, '01b-overview');

  // Fly the mission. Each pass: aim at the nearest live target or enemy, close
  // the distance, fire. Movement is done by writing the drone transform, which
  // is what the flight controls do anyway — this is a pilot, not a physics test.
  const passes = [];
  // Enough passes to actually finish the job: six structures totalling 1430hp
  // against an 80-damage warhead needs ~18 hits on target, so 40 alternating
  // passes leaves margin. Captures are limited to the opening passes and to the
  // moments a structure actually dies, so this does not upload 80 screenshots.
  let prevDone = 0;
  for (let i = 0; i < 40; i++) {
    // Alternate: odd passes hunt the garrison, even passes hit the refinery.
    // Purely preferring enemies meant the structures were never shot while any
    // defender lived, so a run finished 0/6 on the actual mission objective and
    // the captures only ever showed half the job.
    const wantStructure = (i % 2 === 1);
    const step = await page.evaluate((preferStructure) => {
      const out = {};
      try {
        const d = DroneSystem.getPossessed();
        if (!d) { out.err = 'no drone'; return out; }

        function nearestEnemy() {
          let t = null, best = 1e9;
          try {
            const es = Enemies.getAll() || [];
            for (const e of es) {
              if (!e || !e.mesh || e.alive === false) continue;
              const p = e.mesh.position;
              const dd = (p.x - d.position.x) ** 2 + (p.z - d.position.z) ** 2;
              if (dd < best) { best = dd; t = { x: p.x, y: p.y + 1.0, z: p.z, kind: 'enemy' }; }
            }
          } catch (e) {}
          return t;
        }
        // Always the FIRST standing structure, not the nearest. A tank has 250hp
        // against an 80-damage warhead, so spreading four passes across four
        // different tanks leaves all four standing and the objective reads 0/6 —
        // indistinguishable from damage not landing at all. Concentrating fire
        // makes the difference visible.
        function nearestStructure() {
          try {
            const ts = (RefineryStrike.getTargets() || []).filter(t => t.alive);
            if (!ts.length) return null;
            const t = ts[0];
            return { x: t.x, y: t.y + 3 * t.scale, z: t.z, kind: 'structure' };
          } catch (e) { return null; }
        }

        let tgt = preferStructure ? (nearestStructure() || nearestEnemy())
                                  : (nearestEnemy() || nearestStructure());
        if (!tgt) { out.err = 'no target'; return out; }

        // Stand-off tuned by looking at the output: 14m put the drone nose-to-nose
        // with an oil tank that filled the frame, 30m shrank the whole refinery
        // into a model under a lot of empty sky with the defenders as specks.
        // 19m out and 7m up keeps the target, the men around it and the blast in
        // the same frame.
        const dx = d.position.x - tgt.x, dz = d.position.z - tgt.z;
        const len = Math.hypot(dx, dz) || 1;
        d.position.set(tgt.x + (dx / len) * 19, tgt.y + 7, tgt.z + (dz / len) * 19);
        if (d.mesh) {
          d.mesh.position.copy(d.position);
          d.mesh.lookAt(tgt.x, tgt.y, tgt.z);
        }
        out.target = tgt;
        out.ammoBefore = d.payloadCount;
        out.enemiesBefore = Enemies.getAliveCount();
        try { out.targetsBefore = RefineryStrike.getProgress(); } catch (e) {}
        out.fired = DroneSystem.fireAttack(d.id);
        const after = DroneSystem.getPossessed();
        out.ammoAfter = after ? after.payloadCount : null;
        out.droneAlive = !!after;
      } catch (e) { out.err = String(e && e.message || e).slice(0, 160); }
      return out;
    }, wantStructure);
    // Catch the detonation. The old 1.4s wait filmed the aftermath, by which
    // time the flash had already faded out of the frame.
    await page.waitForTimeout(60);
    const doneNow = (step.targetsBefore && step.targetsBefore.done) || 0;
    const worthShot = (i < 6) || (doneNow > prevDone);
    if (worthShot) await shot(page, String(i + 2).padStart(2, '0') + '-impact' + (i + 1));
    await page.waitForTimeout(700);
    const post = await page.evaluate(() => {
      const o = {};
      try { o.enemiesAfter = Enemies.getAliveCount(); } catch (e) {}
      try { o.targetsAfter = RefineryStrike.getProgress(); } catch (e) {}
      try {
        o.structureHp = (RefineryStrike.getTargets() || [])
          .map(t => t.name.replace(/[^A-Z0-9]/gi, '').slice(0, 10) + ':' + Math.round(t.hp) + '/' + t.maxHp);
      } catch (e) {}
      try { const d = DroneSystem.getPossessed(); o.ammo = d ? d.payloadCount : null; } catch (e) {}
      return o;
    });
    Object.assign(step, post);
    passes.push(step);
    console.log('pass ' + (i + 1) + ': ' + JSON.stringify(step));
    const doneAfter = (post.targetsAfter && post.targetsAfter.done) || 0;
    if (doneAfter > prevDone) {
      await shot(page, 'kill' + doneAfter + '-structure');
      console.log('  *** structure ' + doneAfter + '/6 destroyed');
    }
    prevDone = doneAfter;
    if (doneAfter >= 6) { console.log('ALL SIX STRUCTURES DESTROYED at pass ' + (i + 1)); break; }

    // Out of munitions: rearm at the pad the way the mission intends.
    if (step.ammo === 0) {
      await page.evaluate(() => { try { const d = DroneSystem.getPossessed(); if (d) { d.payloadCount = 6; d.hasPayload = true; } } catch (e) {} });
      console.log('  rearmed');
    }
  }

  // ── Phase 2: the other two attack aircraft ────────────────────────────
  // The loadout offers four drones and the ask was that all of them work, but
  // phase 1 only ever flies the FPV. The bomber and Baba Yaga carried a
  // separate bug — neither drop path damaged mission structures, only
  // infantry — so "it launches" is not evidence either of them works. Fly each
  // one at a standing structure and record the hp on both sides of the drop.
  const aircraft = [];
  for (const spec of [{ type: 'bomb', drop: 'dropPayload' }, { type: 'baba_yaga', drop: 'dropFire' }]) {
    const r = await page.evaluate((sp) => {
      const o = { type: sp.type };
      try {
        const alive = (RefineryStrike.getTargets() || []).filter(t => t.alive);
        if (!alive.length) { o.skipped = 'refinery already levelled'; return o; }
        const t = alive[0];
        o.structure = t.name;
        o.hpBefore = t.hp;
        try { if (DroneSystem.isPossessing()) DroneSystem.release && DroneSystem.release(); } catch (e) {}
        o.launched = GameManager.launchDroneFromLoadout(sp.type);
        const d = DroneSystem.getPossessed();
        if (!d) { o.err = 'not possessed after launch'; return o; }
        o.droneType = d.type;
        o.ammoBefore = d.payloadCount;
        // Directly overhead: both of these drop, they do not fire forward.
        d.position.set(t.x, t.y + 10 * t.scale, t.z);
        if (d.mesh) { d.mesh.position.copy(d.position); d.mesh.lookAt(t.x, t.y, t.z); }
        o.dropped = !!DroneSystem[sp.drop](d.id);
        const after = DroneSystem.getPossessed();
        o.ammoAfter = after ? after.payloadCount : null;
        o.droneSurvived = !!after;
      } catch (e) { o.err = String(e && e.message || e).slice(0, 160); }
      return o;
    }, spec);
    await page.waitForTimeout(60);
    if (!r.skipped) await shot(page, '90-' + spec.type);
    // Read the hp back AFTER the blast has been applied.
    r.hpAfter = await page.evaluate((name) => {
      try {
        const t = (RefineryStrike.getTargets() || []).find(x => x.name === name);
        return t ? t.hp : null;
      } catch (e) { return null; }
    }, r.structure);
    r.damagedStructure = (typeof r.hpBefore === 'number' && typeof r.hpAfter === 'number')
      ? (r.hpAfter < r.hpBefore) : null;
    aircraft.push(r);
    console.log(spec.type + ': ' + JSON.stringify(r));
  }

  await page.waitForTimeout(4000);   // let the mission's onComplete settle
  const final = await page.evaluate(() => {
    const o = {};
    try { o.missionStillActive = RefineryStrike.isActive(); } catch (e) {}
    try { o.gameState = GameManager.getState(); } catch (e) {}
    try { o.enemiesAlive = Enemies.getAliveCount(); } catch (e) {}
    try { o.targets = RefineryStrike.getProgress(); } catch (e) {}
    try { const d = DroneSystem.getPossessed(); o.ammo = d ? d.payloadCount : null; o.droneAlive = !!d; } catch (e) {}
    return o;
  });
  await shot(page, '99-final');

  const report = { setup, passes, aircraft, final, shots: SHOTS, pageErrors: errs.slice(0, 8) };
  fs.writeFileSync('drone-mission.json', JSON.stringify(report, null, 1));
  console.log('\nAIRCRAFT: ' + JSON.stringify(aircraft));
  console.log('FINAL: ' + JSON.stringify(final));
  console.log('shots: ' + SHOTS.join(' '));
  await app.close();
  process.exit(0);
})().catch(e => { console.error('drone mission crashed:', e && e.stack || e); process.exit(1); });
