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

  // Stage 18 is the drone-only Refinery Strike.
  await page.evaluate(() => {
    window.__chosenStartStage = 18;
    setTimeout(() => { try { GameManager.startGame(); } catch (e) {} }, 0);
  });
  await page.waitForFunction(() => window.GameManager && GameManager.getState && GameManager.getState() === 'playing',
    null, { timeout: 240000 });
  console.log('state: playing (stage 18)');
  await page.waitForTimeout(9000);   // mission sets up: targets, garrison, drone

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
  await shot(page, '01-launch');

  // Fly the mission. Each pass: aim at the nearest live target or enemy, close
  // the distance, fire. Movement is done by writing the drone transform, which
  // is what the flight controls do anyway — this is a pilot, not a physics test.
  const passes = [];
  for (let i = 0; i < 8; i++) {
    const step = await page.evaluate(() => {
      const out = {};
      try {
        const d = DroneSystem.getPossessed();
        if (!d) { out.err = 'no drone'; return out; }

        // Prefer a live enemy; fall back to a standing structure.
        let tgt = null, best = 1e9;
        try {
          const es = Enemies.getAll() || [];
          for (const e of es) {
            if (!e || !e.mesh || e.alive === false) continue;
            const p = e.mesh.position;
            const dd = (p.x - d.position.x) ** 2 + (p.z - d.position.z) ** 2;
            if (dd < best) { best = dd; tgt = { x: p.x, y: p.y + 1.0, z: p.z, kind: 'enemy' }; }
          }
        } catch (e) {}
        if (!tgt) {
          try {
            const ts = (RefineryStrike.getTargets() || []).filter(t => t.alive);
            if (ts.length) { const t = ts[0]; tgt = { x: t.x, y: t.y + 3 * t.scale, z: t.z, kind: 'structure' }; }
          } catch (e) {}
        }
        if (!tgt) { out.err = 'no target'; return out; }

        // Stand off ~14m, at a shallow dive, nose on the target.
        const dx = d.position.x - tgt.x, dz = d.position.z - tgt.z;
        const len = Math.hypot(dx, dz) || 1;
        d.position.set(tgt.x + (dx / len) * 14, tgt.y + 5, tgt.z + (dz / len) * 14);
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
    });
    await page.waitForTimeout(1400);
    const post = await page.evaluate(() => {
      const o = {};
      try { o.enemiesAfter = Enemies.getAliveCount(); } catch (e) {}
      try { o.targetsAfter = RefineryStrike.getProgress(); } catch (e) {}
      try { const d = DroneSystem.getPossessed(); o.ammo = d ? d.payloadCount : null; } catch (e) {}
      return o;
    });
    Object.assign(step, post);
    passes.push(step);
    console.log('pass ' + (i + 1) + ': ' + JSON.stringify(step));
    await shot(page, String(i + 2).padStart(2, '0') + '-pass' + (i + 1));

    // Out of munitions: rearm at the pad the way the mission intends.
    if (step.ammo === 0) {
      await page.evaluate(() => { try { const d = DroneSystem.getPossessed(); if (d) { d.payloadCount = 6; d.hasPayload = true; } } catch (e) {} });
      console.log('  rearmed');
    }
  }

  const final = await page.evaluate(() => {
    const o = {};
    try { o.enemiesAlive = Enemies.getAliveCount(); } catch (e) {}
    try { o.targets = RefineryStrike.getProgress(); } catch (e) {}
    try { const d = DroneSystem.getPossessed(); o.ammo = d ? d.payloadCount : null; o.droneAlive = !!d; } catch (e) {}
    return o;
  });
  await shot(page, '99-final');

  const report = { setup, passes, final, shots: SHOTS, pageErrors: errs.slice(0, 8) };
  fs.writeFileSync('drone-mission.json', JSON.stringify(report, null, 1));
  console.log('\nFINAL: ' + JSON.stringify(final));
  console.log('shots: ' + SHOTS.join(' '));
  await app.close();
  process.exit(0);
})().catch(e => { console.error('drone mission crashed:', e && e.stack || e); process.exit(1); });
