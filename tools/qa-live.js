/**
 * qa-live.js — automated QA against the live GitHub Pages build
 * Loads the game, boots into Kyiv stage, cycles all weapons,
 * captures every JS error, and prints a pass/fail report.
 * Usage: node tools/qa-live.js
 */
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const URL = 'https://lindapot-art.github.io/occupantkiller/';
const WEAPON_COUNT = 117;

(async () => {
  console.log(`\nQA: ${URL}`);
  console.log(`Weapons to test: ${WEAPON_COUNT}\n`);

  const br = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--window-size=1280,720'],
    protocolTimeout: 120000,
    defaultViewport: { width: 1280, height: 720 },
  });

  const errors   = [];   // { phase, msg }
  const warnings = [];

  try {
    const p = await br.newPage();
    const notFound404s = [];
    p.on('response', r => {
      if (r.status() >= 400 && !r.url().match(/favicon\.ico/i))
        notFound404s.push(r.url());
    });
    p.on('pageerror',  e => errors.push({ phase: 'runtime', msg: e.message }));
    p.on('requestfailed', r => {
      if (!r.url().match(/favicon/i))
        errors.push({ phase: 'network', msg: `FAILED: ${r.url()} — ${r.failure().errorText}` });
    });
    p.on('console', m => {
      if (m.type() === 'error') {
        // Suppress vague "Failed to load resource" — tracked via response handler above
        if (m.text().includes('Failed to load resource')) return;
        errors.push({ phase: 'console', msg: m.text() });
      }
      if (m.type() === 'warning') warnings.push(m.text());
    });

    // ── 1. Load ───────────────────────────────────────────────────────
    console.log('1/5  Loading game...');
    await p.evaluateOnNewDocument(() => {
      window.__QA_MODE = true;
      window.__QA_START_STAGE = 12; // Kyiv defense
    });
    const resp = await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!resp.ok()) errors.push({ phase: 'load', msg: `HTTP ${resp.status()} on index` });

    // Wait for game engine globals
    const booted = await p.evaluate(() => new Promise(res => {
      const t = Date.now();
      const check = () => {
        if (typeof Weapons !== 'undefined' && typeof GameManager !== 'undefined') return res(true);
        if (Date.now() - t > 30000) return res(false);
        setTimeout(check, 200);
      };
      check();
    }));
    if (!booted) { errors.push({ phase: 'boot', msg: 'Timeout waiting for Weapons/GameManager' }); }

    // ── 2. Start game ─────────────────────────────────────────────────
    console.log('2/5  Starting game in Kyiv stage...');
    await p.evaluate(() => {
      Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true });
      window.forceStartGame();
    });
    await sleep(4000);

    // Confirm stage
    const stageInfo = await p.evaluate(() => {
      try { return { idx: GameManager.getCurrentStage(), wc: Weapons.getWeaponCount() }; }
      catch(e) { return { err: e.message }; }
    });
    console.log('   Stage:', stageInfo);
    if (stageInfo.err) errors.push({ phase: 'stage', msg: stageInfo.err });

    // Enable god mode + unlock all
    await p.evaluate((wc) => {
      try { var pl = GameManager.getPlayer(); if (pl) { pl.godMode = true; pl.hp = 9999; } } catch(e) {}
      for (var i = 0; i < wc; i++) { try { Weapons.unlock(i); } catch(e) {} }
      GameManager.setState('playing');
    }, WEAPON_COUNT);
    await sleep(500);

    // ── 3. Cycle every weapon ─────────────────────────────────────────
    console.log(`3/5  Cycling all ${WEAPON_COUNT} weapons...`);
    const weaponErrors = [];
    for (let i = 0; i < WEAPON_COUNT; i++) {
      const prevErrCount = errors.length;
      await p.evaluate((wi) => {
        try { Weapons.switchTo(wi); } catch(e) { console.error('switchTo(' + wi + '): ' + e.message); }
        // Fire once
        try {
          document.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
          setTimeout(() => document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })), 80);
        } catch(e) {}
      }, i);
      await sleep(350);

      // Check if new errors appeared for this weapon
      if (errors.length > prevErrCount) {
        const newErrs = errors.slice(prevErrCount);
        weaponErrors.push({ weapon: i, errors: newErrs.map(e => e.msg) });
      }

      if (i % 20 === 19) console.log(`   ...weapon ${i+1}/${WEAPON_COUNT}`);
    }

    // ── 4. Mesh detach check ──────────────────────────────────────────
    console.log('4/5  Checking for detached mesh parts...');
    const meshReport = await p.evaluate((wc) => {
      const issues = [];
      try {
        // Check each weapon's mesh: all groups should be selfContained or have no orphan meshes
        for (let i = 0; i < wc; i++) {
          try {
            Weapons.switchTo(i);
            // Check if weapon mesh is properly parented
            var cam = GameManager.getCamera && GameManager.getCamera();
            if (!cam) continue;
            // Look for any floating mesh objects in scene root that shouldn't be there
            var scene = window._scene;
            if (!scene) continue;
            var orphans = [];
            scene.children.forEach(function(c) {
              if (c.isMesh && c.userData && c.userData._weaponOrphan) orphans.push(i);
            });
            if (orphans.length) issues.push({ weapon: i, issue: 'orphan mesh in scene root' });
          } catch(e) {}
        }
      } catch(e) { issues.push({ weapon: -1, issue: e.message }); }
      return issues;
    }, WEAPON_COUNT);

    // ── 5. Report ─────────────────────────────────────────────────────
    console.log('5/5  Generating report...\n');
    console.log('═'.repeat(60));
    console.log('  QA REPORT — OccupantKiller Live Build');
    console.log('═'.repeat(60));

    const bootErrs = errors.filter(e => ['load','boot','stage'].includes(e.phase));
    const runtimeErrs = errors.filter(e => e.phase === 'runtime');
    const consoleErrs = errors.filter(e => e.phase === 'console');
    const networkErrs = errors.filter(e => e.phase === 'network');

    console.log(`\nBoot errors:      ${bootErrs.length}`);
    bootErrs.forEach(e => console.log(`  ✗ [${e.phase}] ${e.msg.slice(0,120)}`));

    console.log(`\nRuntime errors:   ${runtimeErrs.length}`);
    runtimeErrs.slice(0,20).forEach(e => console.log(`  ✗ ${e.msg.slice(0,120)}`));
    if (runtimeErrs.length > 20) console.log(`  ... and ${runtimeErrs.length - 20} more`);

    console.log(`\nConsole errors:   ${consoleErrs.length}`);
    consoleErrs.slice(0,20).forEach(e => console.log(`  ✗ ${e.msg.slice(0,120)}`));

    console.log(`\nMissing assets (non-favicon 404s): ${notFound404s.length}`);
    notFound404s.forEach(u => console.log(`  ✗ 404: ${u}`));

    console.log(`\nNetwork errors:   ${networkErrs.length}`);
    networkErrs.forEach(e => console.log(`  ✗ ${e.msg.slice(0,120)}`));

    console.log(`\nWeapon-specific errors (${weaponErrors.length} weapons affected):`);
    weaponErrors.forEach(w => {
      const wName = `weapon[${w.weapon}]`;
      w.errors.forEach(e => console.log(`  ✗ ${wName}: ${e.slice(0,120)}`));
    });

    console.log(`\nMesh detach issues: ${meshReport.length}`);
    meshReport.forEach(m => console.log(`  ✗ weapon[${m.weapon}]: ${m.issue}`));

    console.log(`\nWarnings:         ${warnings.length}`);

    const totalIssues = errors.length + meshReport.length + notFound404s.length;
    console.log('\n' + '═'.repeat(60));
    if (totalIssues === 0) {
      console.log('  ✓ PASS — no errors detected across all 117 weapons');
    } else {
      console.log(`  ✗ FAIL — ${totalIssues} issue(s) found`);
    }
    console.log('═'.repeat(60) + '\n');

  } finally {
    await br.close();
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
