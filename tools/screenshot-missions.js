/**
 * screenshot-missions.js — 299 screenshots per mission type (11 types = 3289 total)
 * Forces each mission template, enables god mode, fires through enemy waves,
 * saves to microsite/gallery/ continuing from current G-series index.
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const GALLERY = path.resolve(__dirname, '../microsite/gallery');
const PER_MISSION = 299;

function nextIdx() {
  const files = fs.readdirSync(GALLERY).filter(f => /^G\d+.*\.jpg$/.test(f));
  if (!files.length) return 1;
  const nums = files.map(f => parseInt(f.match(/^G(\d+)/)[1], 10));
  return Math.max(...nums) + 1;
}

async function waitForGame(p, tries = 100) {
  for (let i = 0; i < tries; i++) {
    const ok = await p.evaluate(() =>
      typeof GameManager !== 'undefined' &&
      typeof Weapons !== 'undefined' &&
      typeof Enemies !== 'undefined'
    );
    if (ok) return true;
    await sleep(300);
  }
  return false;
}

// Per-mission config: weapon indices to cycle + enemy spawn instructions
const MISSION_CFG = {
  bradley_mission: {
    label: 'bradley',
    weapons: [7, 8, 10, 11, 39, 40, 5], // AT weapons
    spawnFn: `
      // Spawn Bradley IFVs as heavy enemies + infantry escort
      if (typeof ConvoySystem !== 'undefined') {
        ConvoySystem.spawnConvoy(1, { route: 'north', tanks: 2, btrs: 3 });
      }
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 2.0, { forceBradley: true }, 1,
          { groupDelta: -1, extraMultiplier: 1.2 }, { x: 0, y: 0, z: 0 });
      }
    `,
    refreshAt: 3,
  },
  airborne_assault: {
    label: 'airborne',
    weapons: [3, 5, 6, 2, 13], // AK, SVD, PKM, M4, Dragunov
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        // Spawn multiple waves of infantry (simulating air insertion)
        Enemies.startWave(1, null, 2.5, { airborne: true }, 2,
          { groupDelta: 0, extraMultiplier: 1.5 }, { x: 0, y: 8, z: 15 });
      }
    `,
    refreshAt: 4,
  },
  urban_breakout: {
    label: 'urban',
    weapons: [3, 2, 0, 1, 13, 43], // close-quarters weapons
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 2.0, { urban: true }, 3,
          { groupDelta: 0, extraMultiplier: 1.3 }, { x: 8, y: 0, z: 12 });
        Enemies.startWave(1, null, 2.0, { urban: true }, 3,
          { groupDelta: 0, extraMultiplier: 1.3 }, { x: -8, y: 0, z: 10 });
      }
    `,
    refreshAt: 5,
  },
  gather: {
    label: 'gather',
    weapons: [3, 2, 0, 6, 5, 1], // mixed infantry weapons
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 1.5, {}, 4,
          { groupDelta: 1, extraMultiplier: 1.0 }, { x: 5, y: 0, z: 20 });
      }
    `,
    refreshAt: 4,
  },
  expand: {
    label: 'expand',
    weapons: [3, 5, 6, 7, 11, 2],
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 1.8, {}, 5,
          { groupDelta: 0, extraMultiplier: 1.2 }, { x: 0, y: 0, z: 25 });
        Enemies.startWave(1, null, 1.8, {}, 5,
          { groupDelta: 0, extraMultiplier: 1.2 }, { x: 20, y: 0, z: 0 });
      }
    `,
    refreshAt: 4,
  },
  recon: {
    label: 'recon',
    weapons: [14, 3, 5, 2, 13], // FPV drone + snipers
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 1.5, { recon: true }, 6,
          { groupDelta: 2, extraMultiplier: 0.9 }, { x: 0, y: 0, z: 40 });
      }
      if (typeof DroneSystem !== 'undefined' && DroneSystem.callBayraktar) {
        DroneSystem.callBayraktar();
      }
    `,
    refreshAt: 5,
  },
  defense: {
    label: 'defense',
    weapons: [3, 5, 6, 11, 7, 8, 2],
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 2.2, { defense: true }, 7,
          { groupDelta: -2, extraMultiplier: 1.4 }, { x: 0, y: 0, z: 30 });
        Enemies.startWave(1, null, 2.2, { defense: true }, 7,
          { groupDelta: -2, extraMultiplier: 1.4 }, { x: -15, y: 0, z: 20 });
      }
      if (typeof ConvoySystem !== 'undefined') {
        ConvoySystem.spawnConvoy(1, { route: 'north', tanks: 1, btrs: 2 });
      }
    `,
    refreshAt: 3,
  },
  kyiv_defense: {
    label: 'kyiv-def',
    weapons: [7, 8, 10, 11, 39, 40, 3, 5, 6],
    spawnFn: `
      if (typeof ConvoySystem !== 'undefined') {
        ConvoySystem.spawnConvoy(1, { route: 'north', tanks: 3, btrs: 2 });
        ConvoySystem.spawnConvoy(1, { route: 'east',  tanks: 2, btrs: 1 });
      }
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        Enemies.startWave(1, null, 1.8, {}, 13,
          { groupDelta: -1, extraMultiplier: 0.9 }, { x: 0, y: 0, z: 0 });
      }
      if (typeof DroneSystem !== 'undefined' && DroneSystem.callBayraktar) {
        DroneSystem.callBayraktar();
      }
    `,
    refreshAt: 3,
  },
  escort: {
    label: 'escort',
    weapons: [3, 2, 0, 6, 13, 5],
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        // Ambushers — spawn ahead and flanking
        Enemies.startWave(1, null, 1.8, { escort: true }, 8,
          { groupDelta: 1, extraMultiplier: 1.1 }, { x: 10, y: 0, z: 30 });
        Enemies.startWave(1, null, 1.8, { escort: true }, 8,
          { groupDelta: 1, extraMultiplier: 1.1 }, { x: -10, y: 0, z: 28 });
      }
    `,
    refreshAt: 5,
  },
  infiltrate: {
    label: 'infiltrate',
    weapons: [0, 15, 2, 13, 5], // silenced weapons for infiltration
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        // Patrol guards
        Enemies.startWave(1, null, 1.4, { patrol: true }, 9,
          { groupDelta: 3, extraMultiplier: 0.8 }, { x: 0, y: 0, z: 35 });
      }
    `,
    refreshAt: 6,
  },
  clear_building: {
    label: 'clear-bldg',
    weapons: [0, 1, 3, 2, 28, 29, 27], // CQB + explosives
    spawnFn: `
      if (typeof Enemies !== 'undefined' && Enemies.startWave) {
        // Dense indoor enemies — spawn close
        Enemies.startWave(1, null, 2.0, { indoor: true }, 10,
          { groupDelta: -3, extraMultiplier: 1.2 }, { x: 3, y: 0, z: 8 });
        Enemies.startWave(1, null, 2.0, { indoor: true }, 10,
          { groupDelta: -3, extraMultiplier: 1.2 }, { x: -3, y: 2, z: 12 });
      }
    `,
    refreshAt: 4,
  },
};

const MISSION_KEYS = Object.keys(MISSION_CFG);

// Camera yaw offsets applied over time for variety
const ANGLE_SEQ = [0, 0.3, -0.3, 0.6, -0.6, 0.15, -0.15, 0.9, -0.9, 0, 1.2, -1.2, 0.45, -0.45, 0];

(async () => {
  let globalIdx = nextIdx();
  console.log(`Starting at gallery index G${String(globalIdx).padStart(4,'0')}`);
  console.log(`Missions: ${MISSION_KEYS.length} × ${PER_MISSION} = ${MISSION_KEYS.length * PER_MISSION} screenshots\n`);

  const br = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--window-size=1280,720'],
    protocolTimeout: 600000,
    defaultViewport: { width: 1280, height: 720 },
  });

  try {
    for (let mi = 0; mi < MISSION_KEYS.length; mi++) {
      const mKey = MISSION_KEYS[mi];
      const cfg = MISSION_CFG[mKey];
      console.log(`\n[${mi + 1}/${MISSION_KEYS.length}] Mission: ${mKey} (${cfg.label})`);

      // Fresh page per mission to avoid state bleed
      const p = await br.newPage();
      const pageErrs = [];
      p.on('pageerror', e => pageErrs.push(e.message.slice(0, 80)));

      const startStage = mKey === 'kyiv_defense' ? 12 : 0;
      await p.evaluateOnNewDocument(`
        window.__QA_MODE = true;
        window.__QA_START_STAGE = ${startStage};
      `);
      await p.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 40000 });

      const loaded = await waitForGame(p);
      if (!loaded) {
        console.warn(`  SKIP ${mKey}: game did not load`);
        await p.close();
        continue;
      }

      // Start game
      await p.evaluate(() => {
        Object.defineProperty(document, 'pointerLockElement', { get: () => document.body, configurable: true });
        window.forceStartGame();
        GameManager.setState('playing');
      });
      await sleep(1800);

      // Enable god mode + unlock all weapons
      await p.evaluate(() => {
        try {
          var pl = GameManager.getPlayer && GameManager.getPlayer();
          if (pl) { pl.godMode = true; pl.hp = 9999; }
          // Try unlocking all weapons so we can switch freely
          if (typeof Weapons !== 'undefined') {
            var count = Weapons.getWeaponCount ? Weapons.getWeaponCount() : 44;
            for (var i = 0; i < count; i++) {
              try { Weapons.unlock(i); } catch(e) {}
            }
          }
          if (typeof ConvoySystem !== 'undefined') ConvoySystem.reset();
          GameManager.setState('playing');
        } catch(e) {}
      });
      await sleep(500);

      // Force generate the target mission type
      await p.evaluate((mk) => {
        try {
          if (typeof MissionSystem === 'undefined') return;
          // Try direct mission generation by template key
          if (MissionSystem.forceGenerate) {
            MissionSystem.forceGenerate(mk);
          } else if (MissionSystem.generateMission) {
            MissionSystem.generateMission(mk);
          } else {
            // Manually create a mission from the template
            var tmpl = MissionSystem.TEMPLATES && MissionSystem.TEMPLATES[mk];
            if (tmpl && MissionSystem.activateMission) {
              MissionSystem.activateMission(Object.assign({ id: mk + '_1', templateKey: mk }, tmpl));
            }
          }
        } catch(e) { console.warn('mission gen:', e.message); }
      }, mKey);
      await sleep(800);

      // Spawn enemies for this mission type
      await p.evaluate(new Function(cfg.spawnFn));
      await sleep(1500);

      let shotCount = 0;
      let waveNum = 1;
      let weaponIdx = 0;
      let angleStep = 0;

      console.log(`  Shooting ${PER_MISSION} frames...`);

      while (shotCount < PER_MISSION) {
        // Check enemy count and refresh if depleted
        const alive = await p.evaluate(() => {
          try {
            var ec = Enemies.getAliveCount ? Enemies.getAliveCount() : 0;
            var cc = (typeof ConvoySystem !== 'undefined' && ConvoySystem.getConvoys) ? ConvoySystem.getConvoys().length * 2 : 0;
            return ec + cc;
          } catch(e) { return 3; }
        });

        if (alive < cfg.refreshAt) {
          waveNum++;
          await p.evaluate(new Function(`
            var wn = ${waveNum};
            ${cfg.spawnFn}
          `));
          await sleep(1200);
        }

        // Rotate camera for visual variety
        if (shotCount % 4 === 0) {
          const yawDelta = ANGLE_SEQ[angleStep % ANGLE_SEQ.length];
          angleStep++;
          await p.evaluate((yd) => {
            try {
              var pl = GameManager.getPlayer();
              if (pl) pl.yaw = (pl.yaw || 0) + yd;
            } catch(e) {}
          }, yawDelta);
        }

        // Cycle weapons every 10 shots
        if (shotCount % 10 === 0) {
          const wList = cfg.weapons;
          const wi = wList[weaponIdx % wList.length];
          weaponIdx++;
          await p.evaluate((wi2) => {
            try {
              if (typeof Weapons !== 'undefined') {
                if (Weapons.isUnlocked && !Weapons.isUnlocked(wi2)) Weapons.unlock(wi2);
                Weapons.switchTo(wi2);
              }
            } catch(e) {}
          }, wi);
          await sleep(150);
        }

        // Fire
        await p.evaluate(() => {
          try {
            document.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
            setTimeout(() => document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })), 100);
          } catch(e) {}
        });
        await sleep(70);

        // Save screenshot
        const tag = `${cfg.label}-w${waveNum}-s${String(shotCount + 1).padStart(3,'0')}`;
        const fname = path.join(GALLERY, `G${String(globalIdx).padStart(4,'0')}-${tag}.jpg`);
        await p.screenshot({ path: fname, type: 'jpeg', quality: 82 });
        globalIdx++;
        shotCount++;

        if (shotCount % 50 === 0) {
          process.stdout.write(`  ${shotCount}/${PER_MISSION} `);
        }
        await sleep(450);
      }

      console.log(`\n  Done: ${shotCount} screenshots. Errors: ${pageErrs.length}`);
      await p.close();
    }

    console.log(`\n✅ All missions complete. Gallery now at index G${String(globalIdx - 1).padStart(4,'0')}`);

  } finally {
    await br.close();
  }
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
