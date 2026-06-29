const SaveManager = (function() {
  "use strict";

  /* =====================================================================
     Stage Definitions (copied from game-manager.js)
     ===================================================================== */
  const STAGES = [
    {
      id:           1,
      name:         'HOSTOMEL AIRPORT',
      theme:        'grassland',
      wavesPerStage: 7,
      difficulty:   0.8,
      fogColor:     0x4a5a3a,
      bgColor:      0x4a5a3a,
      sunColor:     0xff8833,
      sunIntensity: 0.85,
      exposure:     0.9,
      hintWeapons:  ['AK-74M','RPG-7','NLAW'],
      description:  'Stop the airborne assault at Hostomel Airport.',
      objective:    'Repel VDV paratroopers and secure Hostomel Airport. Survive 7 waves.',
    },
    {
      id:           2,
      name:         'AVDIIVKA SECTOR',
      theme:        'urban',
      wavesPerStage: 7,
      difficulty:   1.0,
      fogColor:     0x3a3028,
      bgColor:      0x3a3028,
      sunColor:     0xccccdd,
      sunIntensity: 0.7,
      exposure:     0.8,
      hintWeapons:  ['SVD Dragunov','NLAW','FGM-148 Javelin'],
      description:  'Industrial ruins of Avdiivka. Defend the coking plant.',
      objective:    'Hold the coking plant against ground assault and armor. Watch for snipers in the ruins.',
    },
    {
      id:           3,
      name:         'BAKHMUT RUINS',
      theme:        'urban',
      wavesPerStage: 7,
      difficulty:   1.4,
      fogColor:     0x2a2a2a,
      bgColor:      0x2a2a2a,
      sunColor:     0xccccdd,
      sunIntensity: 0.65,
      exposure:     0.7,
      hintWeapons:  ['AK-74M','PKM','RPO-A Shmel'],
      description:  'Total destruction in Bakhmut. The city is a graveyard.',
      objective:    'Navigate the ruins. Wagner mercenaries attack from all angles. Clear 7 waves.',
    },
    {
      id:           4,
      name:         'KHERSON CROSSING',
      theme:        'grassland',
      wavesPerStage: 7,
      difficulty:   1.8,
      fogColor:     0x4a5a3a,
      bgColor:      0x4a5a3a,
      sunColor:     0xffcc55,
      sunIntensity: 0.9,
      exposure:     0.9,
      hintWeapons:  ['NLAW','FGM-148 Javelin','Stugna-P'],
      description:  'Cross the Dnipro at Kherson. Liberate the bridgehead.',
      objective:    'Secure the Dnipro crossing. Drown enemy armor in the river. 7 waves.',
    },
    {
      id:           5,
      name:         'MARIUPOL STEELWORKS',
      theme:        'industrial',
      wavesPerStage: 7,
      difficulty:   2.2,
      fogColor:     0x1a1a20,
      bgColor:      0x1a1a20,
      sunColor:     0xff6622,
      sunIntensity: 0.5,
      exposure:     0.65,
      hintWeapons:  ['M4A1','PKM','RPO-A Shmel'],
      description:  'Fight through the burning Azovstal steelworks. No retreat.',
      objective:    'Survive the steelworks inferno. Fire deals constant damage. Clear all 7 waves.',
    },
    {
      id:           6,
      name:         'CRIMEA BRIDGE',
      theme:        'coastal',
      wavesPerStage: 7,
      difficulty:   2.5,
      fogColor:     0x5577aa,
      bgColor:      0x5577aa,
      sunColor:     0xffddaa,
      sunIntensity: 0.95,
      exposure:     0.9,
      hintWeapons:  ['M142 HIMARS (GMLRS Strike)','RPG-7','C4 Explosive'],
      description:  'Assault the Kerch Strait bridge. Cut off their supply line.',
      objective:    'Repel naval marines at the Kerch Strait crossing. Drone strikes and naval bombardment incoming. 7 waves.',
    },
    {
      id:           7,
      name:         'CHORNOBYL ZONE',
      theme:        'wasteland',
      wavesPerStage: 7,
      difficulty:   2.8,
      fogColor:     0x3a3520,
      bgColor:      0x3a3520,
      sunColor:     0xaacc44,
      sunIntensity: 0.55,
      exposure:     0.75,
      hintWeapons:  ['Barrett M82','AK-74M','RPO-A Shmel'],
      description:  'The irradiated exclusion zone. Radiation adds periodic damage.',
      objective:    'Survive Chornobyl. Constant radiation drains HP — watch your health bar. Spetsnaz and feral threats. 7 waves.',
    },
    {
      id:           8,
      name:         'OUTER MOSCOW',
      theme:        'cityscape',
      wavesPerStage: 9,
      difficulty:   3.5,
      fogColor:     0x222228,
      bgColor:      0x222228,
      sunColor:     0xeeeeff,
      sunIntensity: 0.4,
      exposure:     0.6,
      hintWeapons:  ['Barrett M82','M2HB Browning .50cal','FGM-148 Javelin'],
      description:  'The armored push into Moscow\'s outer ring. FSB elite and Rosgvardiya defend the suburbs.',
      objective:    'Break through the outer Moscow defensive ring. 9 waves of elite defenders.',
    },
    {
      id:           9,
      name:         'SEVASTOPOL NAVAL BASE',
      theme:        'coastal',
      wavesPerStage: 7,
      difficulty:   3.8,
      fogColor:     0x3355aa,
      bgColor:      0x3355aa,
      sunColor:     0xddccaa,
      sunIntensity: 0.85,
      exposure:     0.85,
      hintWeapons:  ['M142 HIMARS (GMLRS Strike)','RPG-7','NLAW'],
      description:  'Destroy the Black Sea Fleet at Sevastopol. Sink them all.',
      objective:    'Naval base assault. Ship artillery rains down. Destroy all fleet defenders. 7 waves.',
    },
    {
      id:           10,
      name:         'DONBAS FINAL PUSH',
      theme:        'urban',
      wavesPerStage: 8,
      difficulty:   4.2,
      fogColor:     0x2a2020,
      bgColor:      0x2a2020,
      sunColor:     0xdd6633,
      sunIntensity: 0.6,
      exposure:     0.7,
      hintWeapons:  ['RPO-A Shmel','TOS-1A Buratino (Thermobaric MLRS)','M142 HIMARS (GMLRS Strike)'],
      description:  'Liberate the last occupied stronghold in Donbas.',
      objective:    'Break the Donbas line. Kadyrovites, Wagner, mortar teams, and suppressive trench fire. 8 waves.',
    },
    {
      id:           11,
      name:         'BELGOROD OFFENSIVE',
      theme:        'grassland',
      wavesPerStage: 8,
      difficulty:   4.6,
      fogColor:     0x3a4a2a,
      bgColor:      0x3a4a2a,
      sunColor:     0xffaa44,
      sunIntensity: 0.75,
      exposure:     0.85,
      hintWeapons:  ['NLAW','FGM-148 Javelin','M142 HIMARS (GMLRS Strike)'],
      description:  'Cross into enemy territory. Take the fight to them.',
      objective:    'Invade Belgorod. Tanks and mechanized infantry counter-attack hard. 8 waves.',
    },
    {
      id:           12,
      name:         'KREMLIN SHOWDOWN',
      theme:        'cityscape',
      wavesPerStage: 10,
      difficulty:   5.0,
      fogColor:     0x111118,
      bgColor:      0x111118,
      sunColor:     0xff3322,
      sunIntensity: 0.3,
      exposure:     0.5,
      hintWeapons:  ['FGM-148 Javelin','M142 HIMARS (GMLRS Strike)','Barrett M82'],
      description:  'The ultimate battle for peace. Storm the Kremlin. End the war.',
      objective:    'Final assault. Every enemy type. Maximum difficulty. Survive 10 waves.',
    },
    {
      id:           13,
      name:         'BATTLE OF KYIV',
      theme:        'urban',
      wavesPerStage: 8,
      difficulty:   1.5,
      fogColor:     0x6a7080,
      bgColor:      0x6a7080,
      sunColor:     0xc8d0dc,
      sunIntensity: 0.55,
      exposure:     0.75,
      tankFocus:    true,
      capitalDefense: true,
      hintWeapons:  ['NLAW','FGM-148 Javelin','RPG-7','Stugna-P'],
      description:  'Feb 2022. Russian armored columns push down the boulevard toward Maidan. NLAW teams and Bayraktar strikes hold the capital.',
      objective:    'DEFEND KYIV: stop every armored column before it breaches the line. City integrity must survive 8 waves.',
    },
    {
      id:           14,
      name:         'SNAKE ISLAND DEFENSE',
      theme:        'coastal',
      wavesPerStage: 6,
      difficulty:   1.4,
      fogColor:     0x4a6680,
      bgColor:      0x4a6680,
      sunColor:     0xddddff,
      sunIntensity: 0.65,
      exposure:     0.8,
      hintWeapons:  ['Igla MANPADS','RPG-7','NLAW'],
      description:  'Feb 24, 2022. Russian warship Moskva approaches Snake Island. Reply: "Russian warship, go fuck yourself."',
      objective:    'Hold Snake Island against naval bombardment. Only 6 waves — make them count.',
    },
    {
      id:           15,
      name:         'SAKY AIRBASE STRIKE',
      theme:        'coastal',
      wavesPerStage: 7,
      difficulty:   1.7,
      fogColor:     0x886644,
      bgColor:      0xa8845a,
      sunColor:     0xfff0d0,
      sunIntensity: 0.95,
      exposure:     0.95,
      hintWeapons:  ['Drone Jammer Rifle','Igla MANPADS','Strela-2M (SA-7 MANPADS)'],
      description:  'Aug 2022. Crimea. Light up the Saky airbase — every parked Su-24 is a war crime grounded.',
      objective:    'Airbase raid. Heavy bomber drone presence. Jammer rifle recommended. 7 waves.',
    },
    {
      id:           16,
      name:         'VUHLEDAR TANK GRAVEYARD',
      theme:        'wasteland',
      wavesPerStage: 8,
      difficulty:   1.9,
      fogColor:     0x4a4030,
      bgColor:      0x5a5040,
      sunColor:     0xddccaa,
      sunIntensity: 0.5,
      exposure:     0.7,
      tankFocus:    true,
      hintWeapons:  ['NLAW','FGM-148 Javelin','Stugna-P','RPG-7'],
      description:  'Feb 2023. The 155th Naval Infantry Brigade walks into a minefield. Make Vuhledar the largest tank graveyard of the war.',
      objective:    'Tank graveyard. Mines and AT weapons are your friends. 8 waves of armor.',
    },
    {
      hintWeapons:  ['SV-98 Precision Sniper Rifle','Barrett M82','SVD Dragunov'],
      id:           17,
      name:         'ANTONOV BRIDGE STRIKE',
      theme:        'urban',
      wavesPerStage: 7,
      difficulty:   2.0,
      fogColor:     0x556677,
      bgColor:      0x6a7888,
      sunColor:     0xffeecc,
      sunIntensity: 0.85,
      exposure:     0.85,
      description:  'Jul-Aug 2022. HIMARS season. Cut the Antonov Bridge supply line and trap the Russian forces in Kherson.',
      objective:    'Bridge strike. Long-range artillery duels. Precision weapons matter. 7 waves.',
    },
    {
      id:           18,
      name:         'REFINERY STRIKE — FPV DRONE',
      theme:        'industrial',
      wavesPerStage: 1,
      difficulty:   1.6,
      fogColor:     0x2a2620,
      bgColor:      0x3a342a,
      sunColor:     0xffaa66,
      sunIntensity: 0.6,
      exposure:     0.75,
      droneOnly:    true,
      description:  'Pilot a one-way FPV drone deep into a Russian oil refinery. No respawns at the wheel — only at the launch pad.',
      objective:    'FPV drone mission. Fly into the refinery. Blow the fuel tanks. One wave, one chance.',
    },
    {
      id:           19,
      name:         'TREELINE ASSAULT',
      theme:        'grassland',
      wavesPerStage: 1,
      difficulty:   1.6,
      fogColor:     0x4a5a3a,
      bgColor:      0x4a5a3a,
      sunColor:     0xffcc55,
      sunIntensity: 0.9,
      exposure:     0.9,
      bradleyAssault: true,
      hintWeapons:  ['M2A2 Bradley (25mm Bushmaster)','M240 Coax','TOW-2'],
      description:  '47th Mechanized Brigade. A Russian platoon is dug into the treeline. Mount the Bradley and rake the woods with the 25mm.',
      objective:    'Drive the Bradley. Rake the treeline with the 25mm Bushmaster. Clear every occupant from the woods.',
    },
    {
      id:           20,
      name:         'SIEGE OF MOSCOW',
      theme:        'cityscape',
      wavesPerStage: 10,
      difficulty:   5.2,
      fogColor:     0x1a1a22,
      bgColor:      0x1a1a22,
      sunColor:     0xff4422,
      sunIntensity: 0.35,
      exposure:     0.55,
      hintWeapons:  ['FGM-148 Javelin','M142 HIMARS (GMLRS Strike)','Barrett M82','M2HB Browning .50cal'],
      description:  'The siege of the capital. Ukrainian fighters storm Red Square — the Kremlin walls, St Basil\'s and the Senate. Raise the flag and end the war.',
      objective:    'STORM MOSCOW: fight across Red Square, breach the Kremlin walls, clear every defender. Survive 10 waves.',
    },
  ];

  /* =====================================================================
     Private state
     ===================================================================== */
  let currentStage = 0;  // 0-based index into STAGES

  /* =====================================================================
     Placeholder callbacks for GameManager integration
     ===================================================================== */
  var callbacks = {
    onStartGame:        null,
    onClearWaveTimer:   null,
    onBeforeNextStage:  null,
    onAfterNextStage:   null,
    onWin:              null,
    onApplyStage:       null,
    getPlayer:          null,
    setCurrentWave:     null,
    setGameState:       null,
    hideOverlays:       null,
    showOverlay:        null,
    requestPointerLock: null,
    beginWave:          null,
    onLoadApplied:      null,
  };

  function init(opts) {
    if (opts && typeof opts === 'object') {
      for (var key in opts) {
        if (Object.prototype.hasOwnProperty.call(opts, key)) {
          callbacks[key] = opts[key];
        }
      }
    }
  }

  /* =====================================================================
     Utility: find dry spawn (copied from game-manager.js)
     ===================================================================== */
  function findDrySpawnXZ() {
    var VW = (typeof window !== 'undefined') ? window.VoxelWorld : null;
    if (!VW || !VW.getBlock || !VW.getTerrainHeight) return { x: 0, z: 0, h: 0 };
    var WATER = 8;
    function wet(x, z) {
      var h = Math.floor(VW.getTerrainHeight(x, z));
      for (var dy = -1; dy <= 3; dy++) {
        if (VW.getBlock(Math.floor(x), h + dy, Math.floor(z)) === WATER) return true;
      }
      return false;
    }
    if (!wet(0, 0)) return { x: 0, z: 0, h: VW.getTerrainHeight(0, 0) };
    for (var r = 3; r <= 70; r += 3) {
      for (var a = 0; a < 16; a++) {
        var ang = (a / 16) * Math.PI * 2;
        var x = Math.round(Math.cos(ang) * r);
        var z = Math.round(Math.sin(ang) * r);
        if (!wet(x, z)) return { x: x, z: z, h: VW.getTerrainHeight(x, z) };
      }
    }
    return { x: 0, z: 0, h: VW.getTerrainHeight(0, 0) };
  }

  /* =====================================================================
     Save / Load Core
     ===================================================================== */
  function hasSave() {
    try {
      return !!localStorage.getItem('ok_save');
    } catch (_e) {
      return false;
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem('ok_save');
      if (!raw) return null;
      var save = JSON.parse(raw);
      if (!save || typeof save !== 'object') return null;

      if (typeof save.stage === 'number' && isFinite(save.stage)) {
        currentStage = Math.max(0, Math.min(STAGES.length - 1, Math.floor(save.stage) - 1));
      }
      var result = {
        wave:  (typeof save.wave === 'number' && isFinite(save.wave))  ? Math.max(0, Math.floor(save.wave)) : 0,
        stage: currentStage,
        score: (typeof save.score === 'number' && isFinite(save.score)) ? Math.max(0, Math.floor(save.score)) : 0,
        kills: (typeof save.kills === 'number' && isFinite(save.kills)) ? Math.max(0, Math.floor(save.kills)) : 0,
        hp:    (typeof save.hp === 'number' && isFinite(save.hp))      ? save.hp : null,
      };
      if (typeof callbacks.onLoadApplied === 'function') {
        callbacks.onLoadApplied(result);
      }
      return result;
    } catch (_e) {
      return null;
    }
  }

  function save(data) {
    try {
      data = data || {};
      var save = {
        wave:      (typeof data.wave === 'number')  ? data.wave  : 0,
        stage:     currentStage + 1, // store 1-based for human readability
        score:     (typeof data.score === 'number') ? data.score : 0,
        kills:     (typeof data.kills === 'number') ? data.kills : 0,
        hp:        (typeof data.hp === 'number')    ? data.hp    : null,
        timestamp: Date.now(),
      };
      localStorage.setItem('ok_save', JSON.stringify(save));
    } catch (_e) {
      // noop (private mode, quota exceeded, etc.)
    }
  }

  function deleteSave() {
    try {
      localStorage.removeItem('ok_save');
    } catch (_e) {
      // noop
    }
  }

  /* =====================================================================
     Continue Game
     ===================================================================== */
  function continueGame() {
    if (typeof callbacks.onStartGame === 'function') {
      callbacks.onStartGame();
    }
    if (typeof callbacks.onClearWaveTimer === 'function') {
      callbacks.onClearWaveTimer();
    }
    load();
    nextStage();
  }

  /* =====================================================================
     Stage getters
     ===================================================================== */
  function getCurrentStage() {
    return STAGES[currentStage];
  }

  function getStageInfo(index) {
    return STAGES[index] || null;
  }

  function getStageCount() {
    return STAGES.length;
  }

  /* =====================================================================
     Apply Stage
     ===================================================================== */
  function applyStage(stageIndex) {
    const stageDef = STAGES[stageIndex];
    if (!stageDef) {
      console.warn('[applyStage] invalid stage index', stageIndex);
      return;
    }

    // Delegate entirely if a custom apply handler is registered
    if (typeof callbacks.onApplyStage === 'function') {
      callbacks.onApplyStage(stageIndex, stageDef);
      return;
    }

    var scene = null;
    if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.getScene === 'function') {
      scene = window.GameManager.getScene();
    }
    if (!scene) {
      console.warn('[applyStage] No scene available; skipping visual update for stage', stageIndex);
      return;
    }

    // Generate level terrain and features
    if (typeof window !== 'undefined' && window.VoxelWorld && typeof window.VoxelWorld.generateLevel === 'function') {
      window.VoxelWorld.generateLevel(stageIndex);
    }

    // Capital defense (Kyiv): fresh city integrity + defense zone at Maidan.
    if (typeof window !== 'undefined' && typeof window.ConvoySystem !== 'undefined' && window.ConvoySystem.reset) {
      window.ConvoySystem.reset();
      if (stageDef.capitalDefense && window.ConvoySystem.setDefenseZone) {
        window.ConvoySystem.setDefenseZone(0, 1, 12);
      }
    }

    // Update scene colors
    if (scene && typeof THREE !== 'undefined') {
      scene.background = new THREE.Color(stageDef.bgColor);
      scene.fog = new THREE.Fog(stageDef.fogColor, 18, 105);
    }

    // Update sky dome colors for this stage
    var skyDome = (typeof window !== 'undefined') ? (window._skyDome || null) : null;
    if (skyDome && skyDome.geometry && skyDome.geometry.attributes.color && typeof THREE !== 'undefined') {
      var bgCol = new THREE.Color(stageDef.bgColor);
      var skyAttr = skyDome.geometry.attributes.color;
      for (var si = 0; si < skyAttr.count; si++) {
        var y = skyDome.geometry.attributes.position.getY(si);
        var t = Math.max(0, Math.min(1, (y + 180) / 360));
        var topCol = new THREE.Color(stageDef.sunColor || 0xffffff);
        skyAttr.setXYZ(si,
          bgCol.r * (1 - t * 0.5) + topCol.r * t * 0.5,
          bgCol.g * (1 - t * 0.5) + topCol.g * t * 0.5,
          bgCol.b * (1 - t * 0.3) + topCol.b * t * 0.3 + t * 0.15
        );
      }
      skyAttr.needsUpdate = true;
    }

    // Update lighting
    var sunLight = (typeof window !== 'undefined') ? (window.sunLight || null) : null;
    if (sunLight) {
      sunLight.color.setHex(stageDef.sunColor);
      sunLight.intensity = stageDef.sunIntensity;
    }

    // Update tone mapping exposure per stage
    var renderer = (typeof window !== 'undefined') ? (window._renderer || null) : null;
    if (renderer) {
      renderer.toneMappingExposure = stageDef.exposure || 0.85;
    }

    // Start stage-specific ambient sound loop
    if (typeof window !== 'undefined' && typeof window.AudioSystem !== 'undefined' && window.AudioSystem.startAmbientLoop) {
      window.AudioSystem.startAmbientLoop(stageDef.theme);
    }

    // Start stage-specific environmental VFX
    if (typeof window !== 'undefined' && typeof window.StageVFX !== 'undefined' && window.StageVFX.startStageEffects) {
      window.StageVFX.startStageEffects(stageDef.theme, { warzone: !!stageDef.capitalDefense });
    }

    // Spawn water bodies per stage
    if (typeof window !== 'undefined' && typeof window.WorldFeatures !== 'undefined' && window.WorldFeatures.spawnWaterBody) {
      var waterConfigs = [
        // Stage 0 — Hostomel: marshland ponds
        [{ cx: 25, cz: -15, rx: 10, rz: 7, d: 1.5 }, { cx: -20, cz: 30, rx: 6, rz: 12, d: 2 }],
        // Stage 1 — Avdiivka: shell crater pools
        [{ cx: 15, cz: 20, rx: 5, rz: 5, d: 1 }, { cx: -30, cz: -10, rx: 4, rz: 4, d: 0.8 }, { cx: 10, cz: -35, rx: 3, rz: 3, d: 0.6 }],
        // Stage 2 — Bakhmut: river crossing
        [{ cx: 0, cz: 25, rx: 30, rz: 5, d: 2.5 }, { cx: -25, cz: -20, rx: 7, rz: 6, d: 1.2 }],
        // Stage 3 — Kherson: Dnipro river edge
        [{ cx: 0, cz: 40, rx: 50, rz: 8, d: 3 }, { cx: 35, cz: -15, rx: 8, rz: 6, d: 1.5 }],
        // Stage 4 — Mariupol: flooded steelworks trenches
        [{ cx: -10, cz: 20, rx: 8, rz: 4, d: 1 }, { cx: 18, cz: -12, rx: 5, rz: 5, d: 0.8 }],
        // Stage 5 — Crimea: coastal sea inlet
        [{ cx: 0, cz: 55, rx: 60, rz: 10, d: 3 }, { cx: -40, cz: 20, rx: 12, rz: 8, d: 2 }],
        // Stage 6 — Chornobyl: contaminated cooling ponds
        [{ cx: 30, cz: 30, rx: 15, rz: 10, d: 2.5 }, { cx: -20, cz: 15, rx: 8, rz: 8, d: 1.5 }],
        // Stage 7 — Moscow outskirts: Moscow River
        [{ cx: 0, cz: 60, rx: 70, rz: 8, d: 3 }],
        // Stage 8 — Sevastopol: harbour inlet
        [{ cx: 0, cz: 50, rx: 55, rz: 12, d: 4 }, { cx: -35, cz: 0, rx: 10, rz: 6, d: 2 }],
        // Stage 9 — Donbas: mine drainage ponds
        [{ cx: 20, cz: -25, rx: 7, rz: 5, d: 1.2 }, { cx: -15, cz: 30, rx: 6, rz: 4, d: 1 }],
        // Stage 10 — Belgorod: small lakes
        [{ cx: 30, cz: 20, rx: 10, rz: 8, d: 2 }, { cx: -25, cz: -20, rx: 7, rz: 7, d: 1.5 }],
        // Stage 11 — Kremlin: Moskva River
        [{ cx: 0, cz: 65, rx: 75, rz: 10, d: 4 }],
        // Stage 12 — Kyiv: Dnipro/canal strip
        [{ cx: 0, cz: 50, rx: 45, rz: 7, d: 2.5 }, { cx: 30, cz: -10, rx: 6, rz: 4, d: 1 }],
        // Stage 13 — Snake Island: surrounding sea
        [{ cx: 0, cz: 60, rx: 80, rz: 15, d: 5 }, { cx: -50, cz: 0, rx: 12, rz: 8, d: 3 }],
        // Stage 14 — Saky: coastal lagoon
        [{ cx: 0, cz: 50, rx: 50, rz: 10, d: 3 }, { cx: 30, cz: -10, rx: 8, rz: 5, d: 1.5 }],
        // Stage 15 — Vuhledar: none (wasteland)
        [],
        // Stage 16 — Antonov: Dnipro crossing
        [{ cx: 0, cz: 45, rx: 55, rz: 8, d: 3 }],
        // Stage 17 — Refinery: drainage canal
        [{ cx: 15, cz: 30, rx: 10, rz: 5, d: 1.5 }, { cx: -20, cz: -15, rx: 6, rz: 4, d: 1 }],
      ];
      var wc = waterConfigs[stageIndex] || [];
      for (var wi = 0; wi < wc.length; wi++) {
        window.WorldFeatures.spawnWaterBody(wc[wi].cx, wc[wi].cz, wc[wi].rx, wc[wi].rz, wc[wi].d);
      }
    }
  }

  /* =====================================================================
     Next Stage
     ===================================================================== */
  function nextStage() {
    if (typeof callbacks.onBeforeNextStage === 'function') {
      callbacks.onBeforeNextStage();
    } else if (typeof callbacks.hideOverlays === 'function') {
      callbacks.hideOverlays();
    } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.hideOverlays === 'function') {
      window.GameManager.hideOverlays();
    }

    if (typeof window !== 'undefined' && window._shopCountdownId) {
      clearInterval(window._shopCountdownId);
      window._shopCountdownId = null;
    }

    try {
      currentStage++;
      if (currentStage >= STAGES.length) {
        // All stages done — win!
        if (typeof callbacks.onWin === 'function') {
          callbacks.onWin(STAGES.length);
        } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.setState === 'function') {
          var GM = window.GameManager;
          GM.setState(GM.STATE.WIN);
          if (typeof GM.showOverlay === 'function') GM.showOverlay('win');
        }
        return;
      }

      // Stage-based weapon unlocks
      var stageUnlocks = [
        [],                          // Stage 0→1: nothing extra (player earns via drops)
        [2, 3, 4, 5],               // Stage 1→2: AK-74M, RPK-74, SVD, PKM
        [6, 7, 8, 9, 10, 11, 12, 13], // Stage 2→3: NLAW thru SCAR-H
        [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], // Stage 3→4: DShK thru Glock
        [30, 31, 32, 33, 34, 35],  // Stage 4→5: KS-23 thru C4
        [36, 37, 38, 39, 40, 41],  // Stage 5→6: Drone Jammer thru Panzerfaust
        [42, 43, 44, 45, 46, 47],  // Stage 6→7: NSV thru PKP Pecheneg
        [48, 49, 50, 51, 52, 53],  // Stage 7→8: SPG-9 thru Spike LR
        [54, 55, 56, 57, 58, 59],  // Stage 8→9: Kord thru RPG-29
        [60, 61, 62, 63, 64, 65],  // Stage 9→10: HIMARS thru BGM-71 TOW
        [66, 67, 68, 69, 70, 71],  // Stage 10→11: RPG-29 thru Switchblade 300
        [72, 73, 74, 75, 76, 77],  // Stage 11→12: Saiga thru FAB-500
        [78, 79, 80, 81, 82, 83],  // Stage 12→13: M777 thru DP-27
        [84, 85, 86, 87, 88, 89],  // Stage 13→14: SV-98 thru Neptune
        [90, 91, 92, 93, 94, 95],  // Stage 14→15: Metis-M1 thru RGO
        [96, 97, 98, 99, 100, 101], // Stage 15→16: Gepard thru AI AXMC
        [102, 103, 104, 105, 106],  // Stage 16→17: Malyutka thru RPG-32
        [107, 108, 109, 110, 111, 112, 113, 114, 115, 116], // Stage 17→18: Vasilek thru ATACMS
      ];
      var rewards = stageUnlocks[currentStage] || [];
      for (var ri = 0; ri < rewards.length; ri++) {
        if (typeof window !== 'undefined' && window.Weapons && typeof window.Weapons.isUnlocked === 'function' && !window.Weapons.isUnlocked(rewards[ri])) {
          window.Weapons.unlockWeapon(rewards[ri]);
          if (typeof window !== 'undefined' && window.HUD && window.HUD.notifyPickup) {
            window.HUD.notifyPickup('WEAPON UNLOCKED: ' + window.Weapons.getWeaponName(rewards[ri]), '#ff8800');
          }
          if (typeof window !== 'undefined' && window.HUD && window.HUD.showWeaponUnlockCard && window.Weapons.getWeaponDef) {
            window.HUD.showWeaponUnlockCard(window.Weapons.getWeaponDef(rewards[ri]));
          }
        }
      }
      if (rewards.length > 0 && typeof window !== 'undefined' && window.HUD && window.HUD.setWeapon && window.Weapons) {
        window.HUD.setWeapon(window.Weapons.getCurrentName(), window.Weapons.getCurrentIdx());
      }

      const stageDef = STAGES[currentStage];
      applyStage(currentStage);

      // Reset wave count for new stage
      if (typeof callbacks.setCurrentWave === 'function') {
        callbacks.setCurrentWave(0);
      }

      // Heal player between stages (50% of missing HP restored)
      var player = null;
      if (typeof callbacks.getPlayer === 'function') {
        player = callbacks.getPlayer();
      } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.getPlayer === 'function') {
        player = window.GameManager.getPlayer();
      }
      if (player) {
        const missingHp = player.maxHp - player.hp;
        player.hp = Math.min(player.maxHp, player.hp + Math.ceil(missingHp * 0.5));
        if (typeof window !== 'undefined' && window.HUD && window.HUD.setHealth) {
          window.HUD.setHealth(player.hp, player.maxHp);
        }

        // Reset player position on new (possibly water) terrain — find dry ground
        var _dsReset = findDrySpawnXZ();
        const spawnH = _dsReset.h;
        if (player.position && typeof player.position.set === 'function') {
          player.position.set(_dsReset.x, spawnH + (player.height || 1.7), _dsReset.z);
        }
        if (player.velocity && typeof player.velocity.set === 'function') {
          player.velocity.set(0, 0, 0);
        }
      }

      // Clear enemies, pickups, and module state from old stage
      if (typeof window !== 'undefined' && window.Enemies && window.Enemies.clear) window.Enemies.clear();
      if (typeof window !== 'undefined' && window.Pickups && window.Pickups.clear) window.Pickups.clear();
      if (typeof window !== 'undefined' && window.DroneSystem && window.DroneSystem.clear) window.DroneSystem.clear();
      if (typeof window !== 'undefined' && window.EnemyArtillery && window.EnemyArtillery.clear) window.EnemyArtillery.clear();
      if (typeof window !== 'undefined' && window.RefineryStrike && window.RefineryStrike.clear) window.RefineryStrike.clear();
      if (typeof window !== 'undefined' && window.Building && window.Building.clear) window.Building.clear();
      if (typeof window !== 'undefined' && window.Tracers && window.Tracers.clear) window.Tracers.clear();
      if (typeof window !== 'undefined' && window.StageVFX && window.StageVFX.clear) window.StageVFX.clear();
      if (typeof window !== 'undefined' && window.Environment && window.Environment.clear) window.Environment.clear();
      if (typeof window !== 'undefined' && window.WorldFeatures && window.WorldFeatures.clear) window.WorldFeatures.clear();
      if (typeof window !== 'undefined' && window.CombatExtras && window.CombatExtras.reset) window.CombatExtras.reset();
      if (typeof window !== 'undefined' && window.Traversal && window.Traversal.reset) window.Traversal.reset();
      if (typeof window !== 'undefined' && window.MissionTypes && window.MissionTypes.clear) window.MissionTypes.clear();
      if (typeof window !== 'undefined' && window.Feedback && window.Feedback.clear) window.Feedback.clear();
      if (typeof window !== 'undefined' && window.WeatherSystem && window.WeatherSystem.clear) window.WeatherSystem.clear();
      if (typeof window !== 'undefined' && window.WeatherSystem && window.WeatherSystem.init) {
        var _scene = (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.getScene === 'function') ? window.GameManager.getScene() : null;
        var _camera = (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.getCamera === 'function') ? window.GameManager.getCamera() : null;
        window.WeatherSystem.init(_scene, _camera);
      }
      if (typeof window !== 'undefined' && window.Bradley && window.Bradley.clear) window.Bradley.clear();

      // Respawn organized assault groups on new terrain (BRIGADE role only)
      if (typeof window !== 'undefined' && window.NPCSystem && window.NPCSystem.clear) window.NPCSystem.clear();
      if (typeof window !== 'undefined' && window.NPCSystem && window.NPCSystem.setPlayerFormation) {
        window.NPCSystem.setPlayerFormation((typeof window !== 'undefined' && window.__chosenFormation) ? window.__chosenFormation : 'wedge');
      }
      if (player && player.role === 'brigade' && typeof window !== 'undefined' && window.NPCSystem && window.NPCSystem.spawnAssaultGroups) {
        window.NPCSystem.spawnAssaultGroups();
      }

      // ── Urban stages: spawn Ukrainian civilian/infantry NPCs inside buildings ──
      if (stageDef && (stageDef.theme === 'urban' || stageDef.theme === 'cityscape') &&
          typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getBuildings &&
          typeof window !== 'undefined' && window.NPCSystem && window.NPCSystem.spawn) {
        var _urbBuildings = window.VoxelWorld.getBuildings();
        for (var _ubi = 0; _ubi < _urbBuildings.length; _ubi++) {
          var _ubb = _urbBuildings[_ubi];
          if (!_ubb || _ubb.kind !== 'apartment') continue;
          var _ubCount = 1 + Math.floor(Math.random() * 2);
          for (var _ubni = 0; _ubni < _ubCount; _ubni++) {
            var _ubFloor = Math.floor(Math.random() * Math.min(_ubb.floors, 3));
            var _ubY = _ubb.baseY + _ubFloor * (_ubb.floorH || 3) + 1;
            var _ubX = _ubb.x + 3 + Math.floor(Math.random() * Math.max(1, (_ubb.w || 18) - 6));
            var _ubZ = (_ubb.cz || (_ubb.z + 5)) + (Math.random() < 0.5 ? -2 : 2);
            window.NPCSystem.spawn(_ubX, _ubY, _ubZ, Math.random() < 0.4 ? 'civilian' : 'infantry');
          }
        }
      }

      // Respawn vehicle fleet on roads
      var _nsWps = [];
      if (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getRoadWaypoints) {
        _nsWps = window.VoxelWorld.getRoadWaypoints();
      }
      var _mkVec = function(x, y, z) {
        if (typeof THREE !== 'undefined' && THREE.Vector3) return new THREE.Vector3(x, y, z);
        return { x: x, y: y, z: z };
      };
      var _nsp0 = _nsWps.length > 2 ? _nsWps[2] : _mkVec(8, 0, 20);
      var _nsp1 = _nsWps.length > 6 ? _nsWps[6] : _mkVec(12, 0, 20);
      var _nsp2 = _nsWps.length > 10 ? _nsWps[10] : _mkVec(-8, 0, 20);
      var _nsp3 = _nsWps.length > 14 ? _nsWps[14] : _mkVec(0, 0, 15);

      if (typeof window !== 'undefined' && window.VehicleSystem && window.VehicleSystem.clear) window.VehicleSystem.clear();
      if (typeof window !== 'undefined' && window.VehicleSystem && window.VehicleSystem.spawn && window.VoxelWorld && window.VoxelWorld.getTerrainHeight) {
        var vh = window.VoxelWorld.getTerrainHeight(_nsp0.x, _nsp0.z);
        window.VehicleSystem.spawn(_nsp0.x, vh, _nsp0.z, 'transport');
        var vh2 = window.VoxelWorld.getTerrainHeight(_nsp1.x, _nsp1.z);
        window.VehicleSystem.spawn(_nsp1.x, vh2, _nsp1.z, 'combat');
        var vh3 = window.VoxelWorld.getTerrainHeight(_nsp2.x, _nsp2.z);
        window.VehicleSystem.spawn(_nsp2.x, vh3, _nsp2.z, 'turret_rover');
        var vh4 = window.VoxelWorld.getTerrainHeight(_nsp3.x, _nsp3.z);
        window.VehicleSystem.spawn(_nsp3.x, vh4, _nsp3.z, 'tank');
      }

      // Spawn drones
      if (typeof window !== 'undefined' && window.VoxelWorld && window.VoxelWorld.getTerrainHeight && window.DroneSystem && window.DroneSystem.spawn) {
        const dh1 = window.VoxelWorld.getTerrainHeight(5, 5) + 8;
        window.DroneSystem.spawn(5, dh1, 5, 'recon');
        const dh2 = window.VoxelWorld.getTerrainHeight(-5, 5) + 8;
        window.DroneSystem.spawn(-5, dh2, 5, 'fpv_attack');
        const dh3 = window.VoxelWorld.getTerrainHeight(0, -10) + 10;
        window.DroneSystem.spawn(0, dh3, -10, 'bomb');
      }

      // Update HUD
      if (typeof window !== 'undefined' && window.HUD) {
        if (window.HUD.setStage) window.HUD.setStage(stageDef.id, stageDef.name);
        if (window.HUD.setWave) window.HUD.setWave(0);
      }

      // Hide overlays and set state
      if (typeof callbacks.hideOverlays === 'function') {
        callbacks.hideOverlays();
      } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.hideOverlays === 'function') {
        window.GameManager.hideOverlays();
      }

      if (typeof callbacks.setGameState === 'function') {
        callbacks.setGameState('PLAYING');
      } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.setState === 'function') {
        window.GameManager.setState(window.GameManager.STATE.PLAYING);
      }

      if (typeof callbacks.requestPointerLock === 'function') {
        callbacks.requestPointerLock();
      } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.requestPointerLock === 'function') {
        window.GameManager.requestPointerLock();
      }

      // Clear stale missions from prior stage and seed a fresh stage-appropriate one
      if (typeof window !== 'undefined' && window.MissionSystem && window.MissionSystem.init) window.MissionSystem.init();
      if (typeof window !== 'undefined' && window.MissionSystem && !stageDef.droneOnly && !stageDef.bradleyAssault) {
        if (stageDef.capitalDefense) {
          if (window.MissionSystem.generateMission) window.MissionSystem.generateMission('kyiv_defense');
        } else if (stageDef.id === 1) {
          if (window.MissionSystem.generateMission) window.MissionSystem.generateMission('airborne_assault');
        } else if (window.MissionSystem.generateRandom) {
          var _nsM = window.MissionSystem.generateRandom();
          if (typeof window !== 'undefined' && window._autoReconDroneForMission) window._autoReconDroneForMission(_nsM);
        }
      }

      // Announce new stage then show drone selection
      if (typeof window !== 'undefined' && window.HUD && window.HUD.announceStage) {
        window.HUD.announceStage(stageDef.id, stageDef.name, stageDef.description, stageDef.objective);
      }

      // Begin wave
      if (typeof callbacks.beginWave === 'function') {
        callbacks.beginWave(1);
      } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.beginWave === 'function') {
        window.GameManager.beginWave(1);
      }

      // First-run onboarding (core controls + goal). Shows once ever.
      try {
        if (typeof window !== 'undefined' && window.Feedback && window.Feedback.startOnboarding) window.Feedback.startOnboarding();
      } catch (_e) {}

      if (typeof callbacks.onAfterNextStage === 'function') {
        callbacks.onAfterNextStage(currentStage, stageDef);
      }
    } catch (err) {
      console.error('[nextStage] error:', err);
      if (typeof callbacks.setGameState === 'function') {
        callbacks.setGameState('PLAYING');
      } else if (typeof window !== 'undefined' && window.GameManager && typeof window.GameManager.setState === 'function') {
        window.GameManager.setState(window.GameManager.STATE.PLAYING);
      }
    }
  }

  /* =====================================================================
     Public API
     ===================================================================== */
  return {
    init:               init,
    hasSave:            hasSave,
    load:               load,
    save:               save,
    deleteSave:         deleteSave,
    continue:           continueGame,
    nextStage:          nextStage,
    getCurrentStage:    getCurrentStage,
    getStageInfo:       getStageInfo,
    getStageCount:      getStageCount,
    applyStage:         applyStage,
  };
})();

// Export for both browser and Node.js (headless / QA) environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SaveManager;
}
if (typeof window !== 'undefined') {
  window.SaveManager = SaveManager;
}
