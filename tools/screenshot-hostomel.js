/**
 * screenshot-hostomel.js — 500 screenshots of Hostomel Airport level
 * God mode, all 56 weapons cycled, 4-second intervals, 8 camera angles.
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

    // __QA_START_STAGE = 0 loads Hostomel Airport (0-based index 0 = stage id 1)
    await p.evaluateOnNewDocument(() => {
      window.__QA_MODE = true;
      window.__QA_START_STAGE = 0;
    });
    await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 40000 });
    await waitFor(p, () => typeof GameManager !== 'undefined' && typeof Weapons !== 'undefined');
    console.log('Game loaded');

    await p.evaluate(() => {
      Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true });
      window.forceStartGame();
    });
    await sleep(3500); // extra time for Hostomel airport terrain generation

    const hostomelConfirm = await p.evaluate(() => {
      try {
        var idx = typeof GameManager !== 'undefined' && GameManager.getCurrentStage ? GameManager.getCurrentStage() : -1;
        return { stageIdx: idx, isHostomel: idx === 0 };
      } catch(e) { return { err: e.message }; }
    });
    console.log('Stage loaded:', hostomelConfirm);

    // Enable god mode, unlock all 56 weapons
    await p.evaluate(() => {
      try {
        var pl = GameManager.getPlayer && GameManager.getPlayer();
        if (pl) { pl.godMode = true; pl.hp = 9999; }
        var wc = Weapons.getWeaponCount ? Weapons.getWeaponCount() : 50;
        for (var i = 0; i < wc; i++) { try { Weapons.unlock(i); } catch(e) {} }
        GameManager.setState('playing');
      } catch(e) {}
    });
    await sleep(500);

    // Spawn VDV airborne wave (Hostomel assault)
    await p.evaluate(() => {
      try {
        if (typeof Enemies !== 'undefined' && Enemies.startWave) {
          Enemies.startWave(1, window._scene || null, 1.0, {}, 1,
            { groupDelta: 0, extraMultiplier: 1.0 }, { x: 0, y: 0, z: 40 });
        }
        try { Weapons.switchTo(0); } catch(e) {}
      } catch(e) {}
    });
    await sleep(1000);

    // Camera angles (varied to show the airport environment)
    const ANGLES = [
      { yaw: 0,    pitch: -0.1  },  // straight north (toward runways)
      { yaw: 0.5,  pitch: -0.05 },  // NE toward hangars
      { yaw: -0.5, pitch: -0.05 },  // NW toward An-225 hangar
      { yaw: 0,    pitch: -0.25 },  // sky (looking for drones)
      { yaw: 1.0,  pitch: 0.05  },  // east flank
      { yaw: -1.0, pitch: 0.05  },  // west flank
      { yaw: 3.14, pitch: -0.1  },  // south (behind player)
      { yaw: 0.25, pitch: 0.1   },  // look down / ground
    ];
    let angleIdx = 0;

    // Cycle through all 69 weapons
    const ALL_WEAPONS = Array.from({ length: 93 }, (_, i) => i);
    let shotCount = 0;
    let waveNum = 1;
    let weaponCycle = 0;

    console.log('Starting screenshot loop (Hostomel, 4s intervals)...');

    while (shotCount < TARGET) {
      // Refresh enemies when fewer than 4 remain
      const aliveCount = await p.evaluate(() => {
        try { return Enemies.getAliveCount(); }
        catch(e) { return 5; }
      });

      if (aliveCount < 4) {
        waveNum++;
        console.log(`Wave ${waveNum} — spawning VDV reinforcements`);
        await p.evaluate((wn) => {
          try {
            if (typeof Enemies !== 'undefined' && Enemies.startWave) {
              var spawnZ = 40 + (wn % 3) * 20;
              Enemies.startWave(wn, window._scene || null, 1.0 + wn * 0.1, {}, 1,
                { groupDelta: 0, extraMultiplier: 0.9 }, { x: 0, y: 0, z: spawnZ });
            }
          } catch(e) {}
        }, waveNum);
        await sleep(1500);
      }

      // Rotate camera every 5 shots
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

      // Fire
      await p.evaluate(() => {
        try {
          document.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
          setTimeout(() => document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })), 150);
        } catch(e) {}
      });
      await sleep(200);

      // Screenshot at 4-second intervals
      const fname = `H${String(shotCount + 1).padStart(4, '0')}-hostomel-w${waveNum}.jpg`;
      const fpath = path.join(GALLERY, `G${String(idx).padStart(4,'0')}-${fname}`);
      await p.screenshot({ path: fpath, type: 'jpeg', quality: 82 });
      idx++;
      shotCount++;

      if (shotCount % 50 === 0) {
        console.log(`  ${shotCount}/${TARGET} shots — wave ${waveNum}, weapon ${(weaponCycle-1) % 93}/${93}, ${aliveCount} enemies alive`);
      }
      await sleep(3600); // 4000ms total (200ms fire + 3600ms wait)
    }

    console.log(`\n✅ Hostomel: ${shotCount} screenshots saved. PageErrors: ${pageErrs.length}`);
    if (pageErrs.length) console.log('Errors:', pageErrs.slice(0, 5).join('\n'));

  } finally {
    await br.close();
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
