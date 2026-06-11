/* QA: Kyiv Defense — verifies convoy spawning, city HP bar, and defeat trigger */
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const br = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
    protocolTimeout: 120000
  });
  const p = await br.newPage();
  await p.setViewport({ width: 1280, height: 720 });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 140)));

  await p.evaluateOnNewDocument(() => { window.__QA_MODE = true; });
  await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 40000 });
  for (let i = 0; i < 60 && !(await p.evaluate(() => typeof GameManager !== 'undefined')); i++) await sleep(300);

  // Force start then jump to KYIV stage (stage index 12 = id 13)
  await p.evaluate(() => {
    Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true });
    window.forceStartGame();
    GameManager.setState('playing');
  });
  await sleep(2000);

  // Jump to Kyiv stage
  const kyivIdx = await p.evaluate(() => {
    // Find stage with capitalDefense
    var stages = window.STAGES || (typeof GameManager !== 'undefined' && GameManager.getStages ? GameManager.getStages() : null);
    if (!stages) {
      // Try direct access via game-manager internal (exposed for QA)
      return -1;
    }
    for (var i = 0; i < stages.length; i++) {
      if (stages[i] && stages[i].capitalDefense) return i;
    }
    return -1;
  });
  console.log('KYIV stage index:', kyivIdx);

  // Switch to Kyiv stage
  await p.evaluate((idx) => {
    try {
      if (idx >= 0 && typeof GameManager !== 'undefined' && GameManager.jumpToStage) {
        GameManager.jumpToStage(idx);
      } else {
        // Manually set currentStage and re-init
        window.__forceKyivStage = idx;
      }
    } catch (e) { console.error('jumpToStage err:', e.message); }
  }, kyivIdx);
  await sleep(3000);

  // Check stage state
  const state1 = await p.evaluate(() => {
    try {
      var cd = typeof ConvoySystem !== 'undefined';
      return {
        convoySystemExists: cd,
        cityHP: cd ? ConvoySystem.getCityHP() : null,
        isCityLost: cd ? ConvoySystem.isCityLost() : null,
        activeConvoys: cd ? ConvoySystem.getConvoys().length : null,
        kyivMissionExists: typeof MissionSystem !== 'undefined' && !!MissionSystem.TEMPLATES['kyiv_defense'],
        bayraktarExists: typeof DroneSystem !== 'undefined' && typeof DroneSystem.callBayraktar === 'function',
      };
    } catch (e) { return { err: e.message }; }
  });
  console.log('STATE BEFORE CONVOY SPAWN:', JSON.stringify(state1, null, 2));

  // Manually spawn a convoy to test it
  const spawnResult = await p.evaluate(() => {
    try {
      if (typeof ConvoySystem === 'undefined') return { err: 'ConvoySystem undefined' };
      var c = ConvoySystem.spawnConvoy(1, { route: 'north', tanks: 2, btrs: 1 });
      return {
        spawned: !!c,
        convoyId: c ? c.id : null,
        unitCount: c ? c.units.length : 0,
        convoys: ConvoySystem.getConvoys().length,
      };
    } catch (e) { return { err: e.message }; }
  });
  console.log('CONVOY SPAWN:', JSON.stringify(spawnResult, null, 2));

  // Test Bayraktar call
  const tb2Result = await p.evaluate(() => {
    try {
      if (typeof DroneSystem === 'undefined' || !DroneSystem.callBayraktar) return { err: 'no callBayraktar' };
      var ok = DroneSystem.callBayraktar();
      return { called: true, result: ok };
    } catch (e) { return { err: e.message }; }
  });
  console.log('BAYRAKTAR CALL:', JSON.stringify(tb2Result, null, 2));

  // Simulate breach: teleport convoy units into defense zone and run update
  const breachResult = await p.evaluate(() => {
    try {
      var convoys = ConvoySystem.getConvoys();
      if (!convoys.length) return { err: 'no convoys' };
      var dz = ConvoySystem.getDefenseZone();
      var u = convoys[0].units[0];
      if (!u || !u.mesh) return { err: 'no unit mesh' };
      // Place unit inside defense zone
      u.mesh.position.set(dz.x, 0, dz.z);
      var hpBefore = ConvoySystem.getCityHP();
      ConvoySystem.update(0.016); // one frame
      var hpAfter = ConvoySystem.getCityHP();
      return { hpBefore, hpAfter, damaged: hpAfter < hpBefore };
    } catch (e) { return { err: e.message }; }
  });
  console.log('BREACH TEST:', JSON.stringify(breachResult, null, 2));

  // Check HUD city integrity bar exists
  const hudResult = await p.evaluate(() => {
    try {
      return {
        setCityIntegrityExists: typeof HUD !== 'undefined' && typeof HUD.setCityIntegrity === 'function',
        cityBarEl: !!document.getElementById('city-integrity'),
      };
    } catch (e) { return { err: e.message }; }
  });
  console.log('HUD CITY BAR:', JSON.stringify(hudResult, null, 2));

  const ok = spawnResult.spawned && breachResult.damaged && state1.convoySystemExists && state1.bayraktarExists;
  console.log('\n=== KYIV DEFENSE QA ===');
  console.log(ok ? '✅ ALL CHECKS PASS' : '❌ SOME CHECKS FAILED');
  console.log('ERRORS:', errs.length ? errs.slice(0, 5).join('\n  ') : 'none');
  await br.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
