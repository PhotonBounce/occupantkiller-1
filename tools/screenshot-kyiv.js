/**
 * screenshot-kyiv.js — 500 screenshots of Kyiv Defense level combat
 * Jumps to the capitalDefense stage, enables god mode, runs 8 waves
 * with convoy tanks + infantry, rotates view and cycles AT weapons.
 * Saves to microsite/gallery/ starting from the next sequential number.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const GALLERY = path.resolve(__dirname, '../microsite/gallery');
const TARGET = 500;

function nextIdx() {
  const files = fs.readdirSync(GALLERY).filter(f => /^G\d+.*\.jpg$/.test(f));
  if (!files.length) return 1;
  const nums = files.map(f => parseInt(f.replace(/^G/, ''), 10)).filter(n => !isNaN(n));
  return Math.max(...nums) + 1;
}

async function waitFor(page, expr, tries = 80) {
  for (let i = 0; i < tries; i++) {
    if (await page.evaluate(expr)) return true;
    await sleep(300);
  }
  return false;
}

(async () => {
  let idx = nextIdx();
  console.log(`Starting at gallery index G${String(idx).padStart(4,'0')}`);

  const br = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1280,720'],
    protocolTimeout: 300000,
    defaultViewport: { width: 1280, height: 720 },
  });

  try {
    const p = await br.newPage();
    const pageErrs = [];
    p.on('pageerror', e => pageErrs.push(e.message.slice(0, 80)));

    // __QA_START_STAGE = 12 loads Battle of Kyiv (0-based index 12 = id 13)
    await p.evaluateOnNewDocument(() => {
      window.__QA_MODE = true;
      window.__QA_START_STAGE = 12;
    });
    await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 40000 });
    await waitFor(p, () => typeof GameManager !== 'undefined' && typeof Weapons !== 'undefined');
    console.log('Game loaded');

    // Start game — __QA_START_STAGE already set, so Kyiv loads directly
    await p.evaluate(() => {
      Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true });
      window.forceStartGame();
    });
    await sleep(3000); // extra time for Kyiv terrain generation

    // Verify we're on the Kyiv stage (getCurrentStage returns 0-based index)
    const kyivConfirm = await p.evaluate(() => {
      try {
        var idx = typeof GameManager !== 'undefined' && GameManager.getCurrentStage ? GameManager.getCurrentStage() : -1;
        return { stageIdx: idx, isKyiv: idx === 12 };
      } catch(e) { return { err: e.message }; }
    });
    console.log('Stage loaded:', kyivConfirm);

    // Enable god mode, unlock all weapons
    await p.evaluate(() => {
      try {
        var pl = GameManager.getPlayer && GameManager.getPlayer();
        if (pl) { pl.godMode = true; pl.hp = 9999; }
        if (typeof Weapons !== 'undefined') {
          var wc = Weapons.getWeaponCount ? Weapons.getWeaponCount() : 47;
          for (var i = 0; i < wc; i++) { try { Weapons.unlock(i); } catch(e) {} }
        }
        if (typeof ConvoySystem !== 'undefined') ConvoySystem.reset();
        GameManager.setState('playing');
      } catch(e) {}
    });
    await sleep(500);

    // Spawn initial convoy wave from 3 directions
    await p.evaluate(() => {
      try {
        if (typeof ConvoySystem !== 'undefined') {
          ConvoySystem.spawnConvoy(1, { route: 'north', tanks: 3, btrs: 2 });
          ConvoySystem.spawnConvoy(1, { route: 'east',  tanks: 2, btrs: 1 });
        }
        if (typeof Enemies !== 'undefined' && Enemies.startWave) {
          Enemies.startWave(1, window._scene || null, 1.5, {}, 13, { groupDelta: -1, extraMultiplier: 0.8 }, {x:0,y:0,z:0});
        }
        // Switch to NLAW for anti-tank shots
        try { Weapons.switchTo(Weapons.getWeaponCount ? [7, 8, 10, 11, 39, 40].find(i => i < Weapons.getWeaponCount()) : 7); } catch(e) {}
      } catch(e) {}
    });
    await sleep(1000);

    // Cycle through all 65 weapons (indices 0-64)
    const ALL_WEAPONS = Array.from({ length: 65 }, (_, i) => i);
    let shotCount = 0;
    let waveNum = 1;
    let weaponCycle = 0;

    // Camera angle cycling for variety
    const ANGLES = [
      { yaw: 0, pitch: -0.1 },    // straight ahead
      { yaw: 0.4, pitch: -0.05 }, // slight right
      { yaw: -0.4, pitch: -0.05 },// slight left
      { yaw: 0, pitch: -0.2 },    // slightly up
      { yaw: 0.8, pitch: 0.05 },  // wide right
      { yaw: -0.8, pitch: 0.05 }, // wide left
      { yaw: 1.6, pitch: -0.1 },  // 180° look back
      { yaw: 0, pitch: 0.1 },     // look down slightly
    ];
    let angleIdx = 0;

    console.log('Starting screenshot loop...');

    while (shotCount < TARGET) {
      // Refresh enemies every 30 shots or when too few remain
      const aliveCount = await p.evaluate(() => {
        try { return Enemies.getAliveCount() + (typeof ConvoySystem !== 'undefined' ? ConvoySystem.getConvoys().length * 3 : 0); }
        catch(e) { return 5; }
      });

      if (aliveCount < 4) {
        waveNum++;
        console.log(`Wave ${waveNum} — spawning fresh enemies`);
        await p.evaluate((wn) => {
          try {
            if (typeof ConvoySystem !== 'undefined') {
              const routes = ['north', 'east', 'west'];
              ConvoySystem.spawnConvoy(wn, { route: routes[wn % 3], tanks: 2 + Math.floor(wn / 2), btrs: 1 });
              if (wn % 3 === 0) ConvoySystem.spawnConvoy(wn, { route: 'south', tanks: 2, btrs: 1 });
            }
            if (typeof Enemies !== 'undefined' && Enemies.startWave) {
              Enemies.startWave(wn, window._scene || null, 1.5 + wn * 0.1, {}, 13,
                { groupDelta: -1, extraMultiplier: 0.8 }, { x: 0, y: 0, z: 0 });
            }
            if (wn === 4 && typeof DroneSystem !== 'undefined' && DroneSystem.callBayraktar) {
              DroneSystem.callBayraktar();
            }
          } catch(e) {}
        }, waveNum);
        await sleep(1500);
      }

      // Rotate camera angle every 5 shots for visual variety
      if (shotCount % 5 === 0) {
        const ang = ANGLES[angleIdx % ANGLES.length];
        angleIdx++;
        await p.evaluate((yaw, pitch) => {
          try {
            var pl = GameManager.getPlayer();
            if (pl) { pl.yaw = (pl.yaw || 0) + yaw; pl.pitch = pitch; }
          } catch(e) {}
        }, ang.yaw, ang.pitch);
      }

      // Cycle through all weapons every 8 shots
      if (shotCount % 8 === 0) {
        const wIdx = ALL_WEAPONS[weaponCycle % ALL_WEAPONS.length];
        weaponCycle++;
        await p.evaluate((wi) => {
          try { if (wi < Weapons.getWeaponCount()) Weapons.switchTo(wi); } catch(e) {}
        }, wIdx);
        await sleep(300);
      }

      // Fire (simulate mousedown + mouseup)
      await p.evaluate(() => {
        try {
          document.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
          setTimeout(() => document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })), 150);
        } catch(e) {}
      });
      await sleep(200);

      // Take screenshot at 4-second intervals
      const fname = `K${String(shotCount + 1).padStart(4, '0')}-kyiv-w${waveNum}.jpg`;
      const fpath = path.join(GALLERY, `G${String(idx).padStart(4,'0')}-${fname}`);
      await p.screenshot({ path: fpath, type: 'jpeg', quality: 82 });
      idx++;
      shotCount++;

      if (shotCount % 50 === 0) {
        console.log(`  ${shotCount}/${TARGET} shots — wave ${waveNum}, weapon ${(weaponCycle-1) % 65}/${65}, ${aliveCount} enemies alive`);
      }
      await sleep(3600); // 4000ms total (200 fire delay + 3600 wait = 4s intervals
    }

    console.log(`\n✅ Kyiv: ${shotCount} screenshots saved. PageErrors: ${pageErrs.length}`);
    if (pageErrs.length) console.log('Errors:', pageErrs.slice(0, 5).join('\n'));

  } finally {
    await br.close();
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
