const WaveManager = (function() {
  'use strict';

  /* ── Private Wave State ─────────────────────────────────────────── */
  let currentWave = 0;
  const SCORE_WAVE_BONUS = 500;
  let _eventLog = [];
  let _deps = {};          // Injected via init()
  let _rfFlagObjects = []; // Russian flag meshes placed each wave — cleared at wave start

  /* ── Battlefield Events ─────────────────────────────────────────── */
  const BATTLE_EVENTS = [
    { id: 'ARTILLERY',     label: '💥 ARTILLERY BARRAGE!',      color: '#ff4444', chance: 0.15 },
    { id: 'SUPPLY_DROP',   label: '📦 SUPPLY DROP INCOMING!',   color: '#44ff88', chance: 0.13 },
    { id: 'MORTAR',        label: '💣 MORTAR STRIKE!',          color: '#ff8800', chance: 0.10 },
    { id: 'REINFORCEMENT', label: '🛡 ALLIED REINFORCEMENTS!',  color: '#4488ff', chance: 0.09 },
    { id: 'AMBUSH',        label: '⚠ ENEMY AMBUSH!',           color: '#ff2222', chance: 0.09 },
    { id: 'SNIPER_DUEL',   label: '🎯 SNIPER DUEL!',           color: '#ffaa00', chance: 0.07 },
    { id: 'ARMOR_PUSH',    label: '🛡 ENEMY ARMOR PUSH!',      color: '#cc0000', chance: 0.07 },
    { id: 'AIR_SUPPORT',   label: '✈ FRIENDLY AIR SUPPORT!',   color: '#00aaff', chance: 0.08 },
    { id: 'DRONE_SWARM',   label: '🤖 FPV DRONE SUPPORT!',      color: '#44ffcc', chance: 0.07 },
    { id: 'CHEMICAL',       label: '☣ CHEMICAL ATTACK!',       color: '#aaff00', chance: 0.05 },
    { id: 'EMP',            label: '⚡ EMP BLAST!',             color: '#4400ff', chance: 0.04 },
    { id: 'TUNNEL_BREACH',  label: '🕳 TUNNEL BREACH!',        color: '#884400', chance: 0.06 },
  ];

  /* ── Init ───────────────────────────────────────────────────────── */
  function init(options) {
    _deps = options || {};
    // TODO: wire to GameManager — expected dependencies include:
    // player, scene, HUD, Enemies, STAGES, getCurrentStage, getGameState,
    // setGameState, STATE, MLSystem, MissionSystem, EnemyTypes, VehicleSystem,
    // NPCSystem, ConvoySystem, DroneSystem, VoxelWorld, WorldFeatures, Weapons,
    // Pickups, CameraSystem, Feedback, Tracers, Progression, Marketplace,
    // RankSystem, Economy, WeatherSystem, TimeSystem, CombatExtras, MissionTypes,
    // Bradley, RefineryStrike, showOverlay, saveGame, updateAIIndicator,
    // _lastKillPos, _camera, _killFovKick, _skyDome
  }

function beginWave(w) {
  // ── Dependency aliases (TODO: wire to GameManager via init()) ──
  var player = _deps.player || {};
  var _scene = _deps.scene || null;
  var HUD = _deps.HUD || {};
  var Enemies = _deps.Enemies || {};
  var STAGES = _deps.STAGES || [];
  var currentStage = (_deps.getCurrentStage ? _deps.getCurrentStage() : 0);
  var STATE = _deps.STATE || {};
  var MLSystem = _deps.MLSystem || {};
  var MissionSystem = _deps.MissionSystem || {};
  var EnemyTypes = _deps.EnemyTypes || {};
  var VehicleSystem = _deps.VehicleSystem || {};
  var NPCSystem = _deps.NPCSystem || {};
  var ConvoySystem = _deps.ConvoySystem || {};
  var DroneSystem = _deps.DroneSystem || {};
  var VoxelWorld = _deps.VoxelWorld || {};
  var WorldFeatures = _deps.WorldFeatures || {};
  var Weapons = _deps.Weapons || {};
  var Pickups = _deps.Pickups || {};
  var CameraSystem = _deps.CameraSystem || {};
  var Feedback = _deps.Feedback || {};
  var Tracers = _deps.Tracers || {};
  var Progression = _deps.Progression || {};
  var Marketplace = _deps.Marketplace || {};
  var RankSystem = _deps.RankSystem || {};
  var Economy = _deps.Economy || {};
  var WeatherSystem = _deps.WeatherSystem || {};
  var TimeSystem = _deps.TimeSystem || {};
  var CombatExtras = _deps.CombatExtras || {};
  var MissionTypes = _deps.MissionTypes || {};
  var Bradley = _deps.Bradley || {};
  var RefineryStrike = _deps.RefineryStrike || {};
  var showOverlay = _deps.showOverlay || function(){};
  var saveGame = _deps.saveGame || function(){};
  var updateAIIndicator = _deps.updateAIIndicator || function(){};
  var _lastKillPos = _deps._lastKillPos || null;
  var _camera = _deps._camera || null;
  var _skyDome = _deps._skyDome || null;
  var _gameState = _deps.getGameState ? _deps.getGameState() : 'PLAYING';
  if (typeof window !== 'undefined') {
    console.log('[QA] beginWave called, __QA_MODE:', window.__QA_MODE, 'gameState:', _gameState);
  }
  if (typeof window !== 'undefined' && window.__QA_MODE) {
    // In QA mode, always allow wave start
    _deps.setGameState(STATE.PLAYING); // TODO: wire to GameManager
  } else {
    if (_gameState !== STATE.PLAYING && _gameState !== STATE.BUILD_MODE) return;
  }
  currentWave = w;
  player._waveStartCount = 0; // reset before any early-return path (droneOnly etc.)
  // Remove flag meshes from previous wave (they accumulate otherwise)
  for (var _rfi = 0; _rfi < _rfFlagObjects.length; _rfi++) {
    var _rfm = _rfFlagObjects[_rfi];
    if (_scene) _scene.remove(_rfm);
    if (_rfm && _rfm.geometry) _rfm.geometry.dispose();
    if (_rfm && _rfm.material) _rfm.material.dispose();
  }
  _rfFlagObjects.length = 0;
  player.waveStartTime = performance.now();
  player._secondWindTriggered = false;
  if (typeof MissionSystem !== 'undefined' && MissionSystem.generateSideObjective && !MissionSystem.getSideObjective()) MissionSystem.generateSideObjective();
  const stageDef = STAGES[currentStage];
  const mlDiff = MLSystem.getDifficultyMult();

  // AI Smart Learning: classify combat style each wave and pass counter-strategy
  MLSystem.classifyCombatStyle();
  var aiStrategy = MLSystem.generateCounterStrategy();

  // Show AI adaptation notification
  if (aiStrategy.adaptationLevel > 0 && HUD.notifyPickup) {
    HUD.notifyPickup(aiStrategy.adaptationMessage, '#ff00ff');
  }

  // ═══ bradleyAssault stages (Treeline Assault) ═══
  // Skip normal wave spawning; the bradley_assault mission builds the woods,
  // spawns the dug-in ambush + the Bradley, and clears the stage when wiped out.
  if (stageDef.bradleyAssault) {
    window.AudioSystem.playWaveStart();
    HUD.setWave(w, stageDef.wavesPerStage);
    HUD.announceWave(w, 0, stageDef.wavesPerStage);
    if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_start');
    if (w === 1 && stageDef.hintWeapons && stageDef.hintWeapons.length && HUD.notifyPickup) {
      HUD.notifyPickup('💡 RECOMMENDED: ' + stageDef.hintWeapons.slice(0, 3).join(' · '), '#88ccff');
    }
    if (typeof MissionSystem !== 'undefined' && MissionSystem.generateMission) {
      MissionSystem.generateMission('bradley_assault');
    }
    if (typeof Bradley !== 'undefined' && Bradley.setRapidFire) Bradley.setRapidFire(true);
    return;
  }

  // ═══ DroneOnly stages (e.g. Refinery Strike) ═══
  // Skip enemy spawning entirely; instead launch the FPV drone mission.
  // Wave clears when all refinery targets destroyed.
  if (stageDef.droneOnly && typeof RefineryStrike !== 'undefined' && RefineryStrike.startMission) {
    window.AudioSystem.playWaveStart();
    HUD.setWave(w, stageDef.wavesPerStage);
    HUD.announceWave(w, 0, stageDef.wavesPerStage);
    if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_start');
    RefineryStrike.startMission({
      onComplete: function () {
        // Treat refinery destruction as wave complete -> stage clear
        completeWave();
      }
    });
    return;
  }

  // Pass AI strategy to enemies for adaptive behavior.
  // Capital defense (Kyiv): infantry is just the column escort — thin it out
  // so the armored convoy is the main course.
  var _battlePlan = (stageDef && stageDef.capitalDefense)
    ? { groupDelta: -1, extraMultiplier: 0.6 }
    : null;
  Enemies.startWave(w, _scene, stageDef.difficulty * mlDiff, aiStrategy, stageDef.id, _battlePlan, player.position);
  window.AudioSystem.playWaveStart();
  HUD.setWave(w, stageDef.wavesPerStage);
  HUD.announceWave(w, Enemies.getAliveCount(), stageDef.wavesPerStage);
  // Announce enemy's randomly chosen formation as an intel report
  var _enemyForms = ['WEDGE', 'LINE', 'COLUMN', 'STAGGERED'];
  var _eFLabel = ['▲ WEDGE', '━ LINE', '| COLUMN', '⋮ STAGGERED'];
  var _efi = (w + stageDef.id + Math.floor(Math.random() * 2)) % _enemyForms.length;
  if (HUD.notifyPickup) HUD.notifyPickup('INTEL: Enemy formation — ' + _eFLabel[_efi], '#ff8800');
  var _sideObj = (typeof MissionSystem !== 'undefined' && MissionSystem.getSideObjective) ? MissionSystem.getSideObjective() : null;
  if (_sideObj && HUD.notifyPickup) HUD.notifyPickup('⭐ SIDE OBJ: ' + _sideObj.name + ' — ' + _sideObj.desc + ' (+' + _sideObj.reward + ' OKC)', '#ffcc00');
  if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_start');
  // Show recommended weapons hint on wave 1 if stage defines them
  if (w === 1 && stageDef.hintWeapons && stageDef.hintWeapons.length && HUD.notifyPickup) {
    HUD.notifyPickup('💡 RECOMMENDED: ' + stageDef.hintWeapons.slice(0, 3).join(' · '), '#88ccff');
  }

  // ═══ Stage Boss on final wave ═══
  if (w === stageDef.wavesPerStage) {
    var bossType = (typeof EnemyTypes !== 'undefined' && EnemyTypes.getBossForStage)
      ? EnemyTypes.getBossForStage(stageDef.id) : 'BOSS';
    var _bx = player.position.x + (Math.random() - 0.5) * 20;
    var _bz = player.position.z + 30 + Math.random() * 10;
    Enemies.spawnSingle(bossType, {
      x: _bx,
      z: _bz,
      // omit y so spawnOne() resolves terrain height itself
    });
    HUD.notifyPickup('⚠ BOSS INCOMING: ' + (typeof EnemyTypes !== 'undefined' && EnemyTypes.TYPES && EnemyTypes.TYPES[bossType] ? EnemyTypes.TYPES[bossType].name : 'COMMANDER'), '#ff0000');
  }

  // ═══ Blood Moon effect on final 2 waves ═══
  var isBloodMoon = (w >= stageDef.wavesPerStage - 1);
  if (isBloodMoon && _skyDome) {
    var skyAttr = _skyDome.geometry.attributes.color;
    for (var bmi = 0; bmi < skyAttr.count; bmi++) {
      var bmy = _skyDome.geometry.attributes.position.getY(bmi);
      var bmt = Math.max(0, Math.min(1, (bmy + 180) / 360));
      skyAttr.setXYZ(bmi,
        0.55 + bmt * 0.35,   // heavy red
        0.08 + bmt * 0.06,   // minimal green
        0.08 + bmt * 0.10    // minimal blue
      );
    }
    skyAttr.needsUpdate = true;
    if (_scene.fog) {
      _scene.fog.color.setHex(0x330505);
    }
    _scene.background = new THREE.Color(0x1a0303);
    if (HUD.notifyPickup) HUD.notifyPickup('🌑 BLOOD MOON RISING', '#ff2200');
  }

  // AI Smart Learning: update NPC assist strategy
  if (typeof NPCSystem !== 'undefined' && NPCSystem.setMLStrategy) {
    NPCSystem.setMLStrategy(MLSystem.getNPCAssistStrategy());
  }

  // Update AI learning indicator on HUD
  updateAIIndicator(aiStrategy);

  // AI Anti-camping: if player was camping, send flush squad
  if (aiStrategy.antiCampFlush) {
    var campPos = MLSystem.getCampingPosition();
    if (campPos) {
      HUD.notifyPickup('⚠ ENEMIES TARGETING YOUR POSITION!', '#ff2222');
      // Spawn stormers aimed at camping position from multiple angles
      for (var fi = 0; fi < 3; fi++) {
        var flushAngle = (fi / 3) * Math.PI * 2 + Math.random() * 0.5;
        var flushDist = 20 + Math.random() * 10;
        var flushX = campPos.x + Math.cos(flushAngle) * flushDist;
        var flushZ = campPos.z + Math.sin(flushAngle) * flushDist;
        Enemies.spawnSingle('STORMER', { x: flushX, z: flushZ });
      }
    }
  }

  // ═══ Capital defense (Battle of Kyiv): armored COLUMNS instead of the
  // generic scattered vehicle spawns. Columns advance down the boulevard
  // toward the defended Maidan zone via ConvoySystem. ═══
  var capitalDefense = !!(stageDef && stageDef.capitalDefense);
  if (capitalDefense && typeof ConvoySystem !== 'undefined') {
    ConvoySystem.spawnConvoy(w, { route: 'north' });
    // Waves 3+: flanking infantry squads from the sides of the approach
    if (w >= 3 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _flankSide = (w % 2 === 0) ? 1 : -1;
      var _flankPositions = [
        { x: _flankSide * 38, z: 60 }, { x: _flankSide * 42, z: 80 },
        { x: _flankSide * 36, z: 100 },
      ];
      for (var _fi = 0; _fi < _flankPositions.length; _fi++) {
        var _fp = _flankPositions[_fi];
        var _fType = (_fi === 0) ? 'STORMER' : (_fi === 1 ? 'CONSCRIPT' : 'ENGINEER');
        Enemies.spawnSingle(_fType, { x: _fp.x, z: _fp.z });
      }
      if (w === 3) HUD.notifyPickup('⚠ FLANKING ASSAULT — PROTECT YOUR SIDES!', '#ff4444');
    }
    // Waves 4 and 7: second column on a flanking axis
    if (w === 4) ConvoySystem.spawnConvoy(w, { route: 'east', tanks: 2, btrs: 1 });
    if (w === 7) ConvoySystem.spawnConvoy(w, { route: 'west', tanks: 3, btrs: 1 });
    if (w === 1) HUD.notifyPickup('🚀 GRAB AN NLAW — STOP THE COLUMNS!', '#ffcc44');
    // Air support: a Bayraktar TB2 comes on station with the wave (auto-
    // engages armor with MAM-L; respects its own 90s rearm cooldown).
    if (typeof DroneSystem !== 'undefined' && DroneSystem.callBayraktar) {
      DroneSystem.callBayraktar();
    }
    // Building snipers — enemy sharpshooters on Soviet apartment rooftops
    // (buildings at x=-15,z=-33/-17/-1 and x=+21,z=-33/-17 per world gen)
    if (w >= 2 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _kyivBuildingPos = [
        { x: -15, z: -33 }, { x: 21, z: -33 },
        { x: -15, z: -17 }, { x: 21, z: -17 },
        { x: -15, z: -1  }, { x: 52, z:  16 },
        { x: -13, z:  39 }, { x: 17, z:  39 }, // approach corridor (z=30)
        { x: -13, z:  59 }, { x: 17, z:  59 }, // approach corridor (z=50)
      ];
      var _snipersThisWave = Math.min(2 + Math.floor(w / 2), 4);
      for (var _si = 0; _si < _snipersThisWave; _si++) {
        var _sb = _kyivBuildingPos[(_si + w) % _kyivBuildingPos.length];
        var _sby = (VoxelWorld.getTopSolidY ? VoxelWorld.getTopSolidY(_sb.x, _sb.z) : VoxelWorld.getTerrainHeight(_sb.x, _sb.z) + 18);
        Enemies.spawnSingle('SNIPER', new THREE.Vector3(_sb.x, _sby, _sb.z));
      }
      if (w === 2) HUD.notifyPickup('⚠ SNIPERS ON ROOFTOPS — CLEAR THE APARTMENT BLOCKS!', '#ff6622');
    }
    // Wave 5+: FPV drone operators appear on building rooftops
    if (w >= 5 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
      var _dronePosRooftops = [
        { x: -15, z: -33 }, { x: 21, z: -17 },
        { x: -15, z: -17 }, { x: 21, z: -33 },
      ];
      var _droneOpsCount = Math.min(1 + Math.floor((w - 5) / 2), 3);
      for (var _doi = 0; _doi < _droneOpsCount; _doi++) {
        var _dp = _dronePosRooftops[(_doi + w) % _dronePosRooftops.length];
        var _dpy = (VoxelWorld.getTopSolidY ? VoxelWorld.getTopSolidY(_dp.x, _dp.z) : VoxelWorld.getTerrainHeight(_dp.x, _dp.z) + 18);
        try { Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_dp.x, _dpy, _dp.z)); } catch(e) {}
      }
      if (w === 5) HUD.notifyPickup('⚡ FPV DRONE OPERATORS ON THE ROOFTOPS — ELIMINATE THEM!', '#ff8800');
    }
    // Wave 6+: Grad/Uragan artillery salvo warning — area denial for ~8s
    if (w >= 6 && typeof HUD !== 'undefined') {
      HUD.notifyPickup('💥 INCOMING GRAD SALVO — TAKE COVER!', '#ff2222');
      // Spawn rubble/fire at random spots in the approach corridor
      if (typeof VoxelWorld !== 'undefined' && VoxelWorld.setBlock) {
        for (var _gs = 0; _gs < 4; _gs++) {
          var _gx = (Math.random() - 0.5) * 20;
          var _gz = 40 + Math.random() * 80;
          var _gy = VoxelWorld.getTerrainHeight(_gx, _gz);
          try { VoxelWorld.setBlock(Math.round(_gx), _gy + 1, Math.round(_gz), window.BLOCK ? window.BLOCK.FIRE : 37); } catch(e) {}
        }
      }
    }
    // Resupply: AT weapons carry 1+3 rockets — drop ammo crates at the
    // defended line each wave so launchers stay fed.
    if (typeof Pickups !== 'undefined' && Pickups.spawn) {
      var _dz = ConvoySystem.getDefenseZone();
      for (var _ai = 0; _ai < 3; _ai++) {
        var _aa = (_ai / 3) * Math.PI * 2;
        var _ax = _dz.x + Math.cos(_aa) * 5, _az = _dz.z + Math.sin(_aa) * 5;
        Pickups.spawn(new THREE.Vector3(_ax, VoxelWorld.getTerrainHeight(_ax, _az) + 1, _az), 'AMMO');
      }
    }
  }

  // Spawn enemy vehicles on later waves (Russian armored assault)
  // tankFocus stages (e.g. Siege of Kyiv) get heavy armor from wave 1
  var tankFocus = !!(stageDef && stageDef.tankFocus) && !capitalDefense;
  var armorMinWave = tankFocus ? 1 : 3;
  var transportMinWave = tankFocus ? 2 : 5;
  var extraTanks = tankFocus ? 1 + Math.min(3, Math.floor(w / 2)) : 0;

  // Helper: pick a random road waypoint for vehicle spawning (tanks/BMPs only on roads)
  var _roadWPs = (typeof VoxelWorld !== 'undefined' && VoxelWorld.getRoadWaypoints) ? VoxelWorld.getRoadWaypoints() : [];
  function _roadSpawnPos(minDist) {
    if (_roadWPs.length > 0) {
      var _rIdx = Math.floor(Math.random() * _roadWPs.length);
      var _rwp = _roadWPs[_rIdx];
      // Ensure it's far enough from player if minDist specified
      if (minDist) {
        var _rpd = new THREE.Vector3(_rwp.x, 0, _rwp.z).distanceTo(player.position);
        if (_rpd < minDist) {
          // Try a few more times
          for (var _rt = 0; _rt < 5; _rt++) {
            _rIdx = Math.floor(Math.random() * _roadWPs.length);
            _rwp = _roadWPs[_rIdx];
            _rpd = new THREE.Vector3(_rwp.x, 0, _rwp.z).distanceTo(player.position);
            if (_rpd >= minDist) break;
          }
        }
      }
      return { x: _rwp.x, z: _rwp.z };
    }
    // Fallback: random position (if no roads)
    var _fa = Math.random() * Math.PI * 2;
    var _fd = (minDist || 35) + Math.random() * 10;
    return { x: Math.cos(_fa) * _fd, z: Math.sin(_fa) * _fd };
  }

  if (w >= armorMinWave && !capitalDefense) {
    var _rsp = _roadSpawnPos(30);
    var evx = _rsp.x, evz = _rsp.z;
    var evy = VoxelWorld.getTerrainHeight(evx, evz);
    VehicleSystem.spawnEnemy(evx, evy, evz, 'combat');
    HUD.notifyPickup('⚠ ENEMY ARMOR SPOTTED!', '#ff4444');
  }
  if (w >= transportMinWave && !capitalDefense) {
    var _rsp2 = _roadSpawnPos(25);
    var evx2 = _rsp2.x, evz2 = _rsp2.z;
    var evy2 = VoxelWorld.getTerrainHeight(evx2, evz2);
    VehicleSystem.spawnEnemy(evx2, evy2, evz2, 'transport');
  }
  // tankFocus extra armored column — convoy-style spawn pattern on roads
  for (var et = 0; et < extraTanks; et++) {
    var _rsp3 = _roadSpawnPos(35);
    var ctx = _rsp3.x, ctz = _rsp3.z;
    var cty = VoxelWorld.getTerrainHeight(ctx, ctz);
    VehicleSystem.spawnEnemy(ctx, cty, ctz, 'combat');
  }
  if (tankFocus && w === 1) {
    var _tStageId = stageDef ? stageDef.id : 0;
    if (_tStageId === 16) {
      // Vuhledar: minefield tank graveyard — hint mines + AT weapons
      HUD.notifyPickup('💣 MINEFIELD ACTIVE — USE NLAW/STUGNA + PLACE MINES!', '#ffcc44');
      // Seed the approach corridor with enemy mines to simulate the real minefield
      if (typeof WorldFeatures !== 'undefined' && WorldFeatures.placeMine &&
          typeof VoxelWorld !== 'undefined' && VoxelWorld.getTerrainHeight) {
        for (var _vm = 0; _vm < 12; _vm++) {
          var _va = (_vm / 12) * Math.PI * 2;
          var _vd = 18 + (_vm % 3) * 6 + Math.random() * 4;
          var _vx = Math.cos(_va) * _vd;
          var _vz = Math.sin(_va) * _vd;
          var _vy = VoxelWorld.getTerrainHeight(_vx, _vz);
          WorldFeatures.placeMine(_vx, _vy, _vz, 'enemy');
        }
      }
    } else {
      HUD.notifyPickup('🚀 GRAB AN NLAW OR JAVELIN — STOP THE ARMOR!', '#ffcc44');
    }
  }

  // ═══ Building Garrison — enemies occupy buildings each wave ═══
  if (w >= 2 && typeof VoxelWorld !== 'undefined' && VoxelWorld.getBuildings) {
    var buildings = VoxelWorld.getBuildings();
    for (var bi = 0; bi < buildings.length; bi++) {
      var bld = buildings[bi];
      if (!bld || bld.kind !== 'apartment') continue;
      // Scale garrison size with wave
      var garrisonSize = Math.min(bld.floors, 1 + Math.floor(w / 3));
      var garrisonTypes = ['CONSCRIPT','STORMER','SNIPER'];
      if (w >= 5) garrisonTypes.push('ARMORED','FLAMETHROWER');
      if (w >= 8) garrisonTypes.push('SPETSNAZ','KADYROVITE');
      // Window positions on front face (x offsets 2,8,14 are open air every other)
      var _winXOffsets = [2, 8, 14];
      for (var gf = 0; gf < garrisonSize; gf++) {
        var floorY = bld.baseY + gf * bld.floorH + 1;
        // 2 enemies per floor — 1 at a window opening for visibility, 1 deeper
        for (var gr = 0; gr < 2; gr++) {
          var gpx, gpz;
          if (gr === 0) {
            // At an open window on front wall — visible from outside
            var _wo = _winXOffsets[(gf + w) % _winXOffsets.length];
            gpx = bld.x + _wo;
            gpz = bld.z + 1; // just inside front wall
          } else {
            gpx = bld.x + 3 + Math.floor(Math.random() * (bld.w - 6));
            gpz = bld.cz + (Math.random() < 0.5 ? -2 : 2);
          }
          var gtype = garrisonTypes[Math.floor(Math.random() * garrisonTypes.length)];
          Enemies.spawnSingle(gtype, new THREE.Vector3(gpx + 0.5, floorY, gpz + 0.5), {
            guardPost: { x: gpx + 0.5, y: floorY, z: gpz + 0.5 },
            guardRadius: 3,
            garrisonRole: 'building_defender'
          });
        }
      }
    }
  }

  // ═══ Russian Federation Flag markers at enemy positions ═══
  (function _placeRFFlags() {
    if (!_scene) return;
    var _rfColors = [0xffffff, 0x0033aa, 0xff0000]; // white, blue, red
    var _flagPositions = [];
    // Place flags near enemy spawn points (assault group centers)
    var _egroups = Enemies.getAssaultGroups ? Enemies.getAssaultGroups() : [];
    for (var fgi = 0; fgi < _egroups.length; fgi++) {
      var _eg = _egroups[fgi];
      if (_eg && _eg.center) _flagPositions.push(_eg.center);
    }
    // Also place flags near buildings
    if (typeof VoxelWorld !== 'undefined' && VoxelWorld.getBuildings) {
      var _fblds = VoxelWorld.getBuildings();
      for (var fbi = 0; fbi < _fblds.length; fbi++) {
        var _fb = _fblds[fbi];
        if (_fb) _flagPositions.push(new THREE.Vector3(_fb.cx, _fb.baseY + _fb.floors * _fb.floorH, _fb.cz));
      }
    }
    for (var fpi = 0; fpi < _flagPositions.length; fpi++) {
      var fp = _flagPositions[fpi];
      if (!fp) continue;
      // Simple flag pole + cloth
      var poleH = 4 + Math.random() * 2;
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, poleH, 6),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      );
      pole.position.set(fp.x, poleH * 0.5, fp.z);
      _scene.add(pole); _rfFlagObjects.push(pole);
      var clothW = 0.9, clothH = 0.5;
      var clothGeo = new THREE.PlaneGeometry(clothW, clothH, 4, 2);
      var clothMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      var cloth = new THREE.Mesh(clothGeo, clothMat);
      cloth.position.set(fp.x + clothW * 0.5, poleH - clothH * 0.5, fp.z);
      _scene.add(cloth); _rfFlagObjects.push(cloth);
      // Stripe overlays (simplified tricolor)
      var stripeB = new THREE.Mesh(
        new THREE.PlaneGeometry(clothW, clothH * 0.33, 2, 1),
        new THREE.MeshBasicMaterial({ color: 0x0033aa, side: THREE.DoubleSide })
      );
      stripeB.position.set(fp.x + clothW * 0.5, poleH - clothH * 0.83, fp.z + 0.01);
      _scene.add(stripeB); _rfFlagObjects.push(stripeB);
      var stripeR = new THREE.Mesh(
        new THREE.PlaneGeometry(clothW, clothH * 0.33, 2, 1),
        new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
      );
      stripeR.position.set(fp.x + clothW * 0.5, poleH - clothH * 0.17, fp.z + 0.01);
      _scene.add(stripeR); _rfFlagObjects.push(stripeR);
    }
  })();

  // Spawn enemy drones (from nests if alive, reduced if nests destroyed)
  if (w >= 2 && typeof DroneSystem !== 'undefined' && DroneSystem.spawnEnemyDrone) {
    var aliveNests = DroneSystem.getAliveNestCount();
    var nestMult = aliveNests > 0 ? 1.0 : 0.3;
    var nests = DroneSystem.getNests();
    var droneSpawnH = 20 + Math.random() * 10;

    function _nestSpawnPos(idx) {
      if (nests.length > 0 && nests[idx % nests.length] && nests[idx % nests.length].alive) {
        var n = nests[idx % nests.length];
        return { x: n.x + (Math.random() - 0.5) * 6, z: n.z + (Math.random() - 0.5) * 6 };
      }
      var a = Math.random() * Math.PI * 2;
      var d = 30 + Math.random() * 15;
      return { x: player.position.x + Math.cos(a) * d, z: player.position.z + Math.sin(a) * d };
    }

    // Enemy FPVs — w2: 1-2, w3+: guaranteed pair
    DroneSystem.spawnEnemyDrone(_nestSpawnPos(0).x, droneSpawnH, _nestSpawnPos(0).z, 'enemy_fpv');
    if (w >= 3 || Math.random() < nestMult * 0.5) {
      var fp2e = _nestSpawnPos(6);
      DroneSystem.spawnEnemyDrone(fp2e.x, droneSpawnH, fp2e.z, 'enemy_fpv');
    }

    // Enemy surveillance observer drones — wave 2+, reliable
    if (Math.random() < nestMult * 0.85) {
      var obsP = _nestSpawnPos(5);
      DroneSystem.spawnEnemyDrone(obsP.x, droneSpawnH + 8, obsP.z, 'enemy_observer');
    }

    // Enemy bomber + extra FPVs — wave 4+
    if (w >= 4 && Math.random() < nestMult) {
      var bp = _nestSpawnPos(1);
      DroneSystem.spawnEnemyDrone(bp.x, droneSpawnH + 5, bp.z, 'enemy_bomber');
      var fp3 = _nestSpawnPos(2);
      DroneSystem.spawnEnemyDrone(fp3.x, droneSpawnH, fp3.z, 'enemy_fpv');
      var fp4 = _nestSpawnPos(3);
      DroneSystem.spawnEnemyDrone(fp4.x, droneSpawnH, fp4.z, 'enemy_fpv');
    }

    // Heavy enemy drone wave — wave 6+
    if (w >= 6 && Math.random() < nestMult) {
      for (var ei = 0; ei < 4; ei++) {
        var ep = _nestSpawnPos(ei);
        DroneSystem.spawnEnemyDrone(ep.x, droneSpawnH + ei * 2, ep.z,
          ei === 0 ? 'enemy_bomber' : (ei === 3 ? 'enemy_observer' : 'enemy_fpv'));
      }
    }

    // Ukrainian incendiary drone (friendly fire-support) — wave 3+
    if (w >= 3 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
      var incPos = _nestSpawnPos(99);
      var incDrone = DroneSystem.spawn(incPos.x, droneSpawnH + 5, incPos.z, 'incendiary');
      if (incDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('🔥 UKRAINIAN INCENDIARY DRONE DEPLOYED — [F] when possessing to drop fire', '#ff6600');
      }
    }

    // Ukrainian surveillance drone — wave 2+, every other wave (more reliable than before)
    if (w >= 2 && w % 2 === 0 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
      var survPos = _nestSpawnPos(77);
      var survDrone = DroneSystem.spawn(survPos.x, droneSpawnH + 10, survPos.z, 'surveillance');
      if (survDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('👁 UKRAINIAN SURVEILLANCE DRONE — [F] to possess, marks enemy positions', '#44aaff');
      }
    }

    // Ukrainian FPV attack — wave 3+ (guaranteed)
    if (w >= 3 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
      var ufpvPos = _nestSpawnPos(55);
      DroneSystem.spawn(ufpvPos.x, droneSpawnH, ufpvPos.z, 'fpv_attack');
      // Second FPV on later waves
      if (w >= 5) {
        var ufpvPos2 = _nestSpawnPos(56);
        DroneSystem.spawn(ufpvPos2.x, droneSpawnH, ufpvPos2.z, 'fpv_attack');
      }
    }

    // Ukrainian Baba Yaga fire-dropper — wave 4+, every other wave
    if (w >= 4 && w % 2 === 0 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
      var byPos = _nestSpawnPos(88);
      var byDrone = DroneSystem.spawn(byPos.x, droneSpawnH + 8, byPos.z, 'baba_yaga');
      if (byDrone && typeof HUD !== 'undefined' && HUD.notifyPickup) {
        HUD.notifyPickup('🔥 BABA YAGA DEPLOYED — heavy thermite fire-dropper! [F] to possess, [LMB] to drop', '#ff8800');
      }
    }

    // Ukrainian bomb drone — wave 5+
    if (w >= 5 && typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
      var bombPos = _nestSpawnPos(42);
      DroneSystem.spawn(bombPos.x, droneSpawnH + 3, bombPos.z, 'bomb');
    }

    if (aliveNests > 0) {
      HUD.notifyPickup('⚠ ENEMY DRONES FROM NESTS! Destroy nests to stop them!', '#ff4488');
    } else if (nestMult < 1) {
      HUD.notifyPickup('⚠ Enemy drone operations crippled!', '#44ff88');
    } else {
      HUD.notifyPickup('⚠ ENEMY DRONES DETECTED!', '#ff4488');
    }
  }

  // ═══ NEW: Wave-begin integrations for 59 features ═══
  // Generate bounties for this wave
  if (typeof Progression !== 'undefined') {
    Progression.generateBounties(w);
    Progression.trackStat('wavesCleared', 0); // track at begin; increment at complete
  }
  // Spawn a random mission type every 3 waves
  // ASSAULT_DUGOUTS excluded — it pre-spawns 16 extra garrison enemies which spikes difficulty mid-wave.
  // Only start if no scripted mission already active (avoids silently overwriting in-progress missions).
  // Skip for capitalDefense (Kyiv) — convoy columns are already the priority objective.
  if (w % 3 === 0 && typeof MissionTypes !== 'undefined' && !MissionTypes.getActive() && !capitalDefense) {
    var _mSafeTypes = ['DEMOLITION', 'CAPTURE_ZONE', 'ASSASSINATION', 'RESCUE', 'DEFUSE'];
    var mType = _mSafeTypes[Math.floor(Math.random() * _mSafeTypes.length)];
    var _mzX = player.position.x + (Math.random() - 0.5) * 40;
    var _mzZ = player.position.z + (Math.random() - 0.5) * 40;
    for (var _mzTry = 0; _mzTry < 7 && typeof VoxelWorld !== 'undefined' && VoxelWorld.getBlock &&
         VoxelWorld.getBlock(Math.floor(_mzX), VoxelWorld.getTerrainHeight(_mzX, _mzZ), Math.floor(_mzZ)) === 8; _mzTry++) {
      _mzX = player.position.x + (Math.random() - 0.5) * 40;
      _mzZ = player.position.z + (Math.random() - 0.5) * 40;
    }
    MissionTypes.startMission(mType, _mzX, _mzZ);
    HUD.notifyPickup('📍 NEW MISSION: ' + MissionTypes.TYPES[mType].name, '#ffcc00');
  }
  // Spawn supply airdrop every 4 waves
  if (w % 4 === 0 && typeof WorldFeatures !== 'undefined') {
    var adX = player.position.x + (Math.random() - 0.5) * 30;
    var adZ = player.position.z + (Math.random() - 0.5) * 30;
    var adY = VoxelWorld.getTerrainHeight(adX, adZ);
    WorldFeatures.spawnAirdrop(adX, adZ, adY);
    HUD.notifyPickup('📦 SUPPLY DROP INCOMING!', '#44ff88');
  }
  // Place enemy landmines on later waves
  if (w >= 4 && typeof WorldFeatures !== 'undefined') {
    for (var lmi = 0; lmi < Math.min(w, 8); lmi++) {
      var lmAngle = Math.random() * Math.PI * 2;
      var lmDist = 10 + Math.random() * 20;
      var lmX = player.position.x + Math.cos(lmAngle) * lmDist;
      var lmZ = player.position.z + Math.sin(lmAngle) * lmDist;
      var lmY = VoxelWorld.getTerrainHeight(lmX, lmZ);
      WorldFeatures.placeMine(lmX, lmY, lmZ, 'enemy');
    }
  }
  // Hostomel (id 1): VDV paratroop landing + anti-air warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 1) {
    HUD.notifyPickup('⚡ VDV PARATROOPERS LANDING — HOLD THE AIRFIELD!', '#ffcc44');
  }
  // Avdiivka (id 2): sniper warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 2) {
    HUD.notifyPickup('⚠ SNIPERS IN THE RUINS — KEEP MOVING, USE COVER!', '#ffaa44');
  }
  // Bakhmut (id 3): Wagner multi-directional assault warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 3) {
    HUD.notifyPickup('☠ WAGNER MERCENARIES — COMING FROM ALL SIDES!', '#ff4444');
  }
  // Kherson (id 4): river/armor warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 4) {
    HUD.notifyPickup('🌊 DNIPRO CROSSING — LURE ENEMY ARMOR INTO THE RIVER!', '#44aaff');
  }
  // Snake Island (id 14): warn about Moskva bombardment at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 14) {
    HUD.notifyPickup('⚓ MOSKVA IS SHELLING — SHELTER AND HOLD THE ISLAND!', '#4477ff');
  }
  // Sevastopol (id 9): ship artillery warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 9) {
    HUD.notifyPickup('💥 SHIP ARTILLERY INCOMING — DESTROY THE FLEET!', '#4488ff');
  }
  // Hostomel (id 1): VDV paratroopers drop from altitude each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 1 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _vdvCount = Math.min(3, 1 + Math.floor(w / 2));
    for (var _vi = 0; _vi < _vdvCount; _vi++) {
      var _vA = Math.random() * Math.PI * 2;
      var _vD = 20 + Math.random() * 15;
      var _vX = player.position.x + Math.cos(_vA) * _vD;
      var _vZ = player.position.z + Math.sin(_vA) * _vD;
      var _vY = VoxelWorld.getTerrainHeight(_vX, _vZ) + 14 + Math.random() * 6;
      Enemies.spawnSingle('PARATROOP', new THREE.Vector3(_vX, _vY, _vZ));
    }
    if (w >= 4) {
      // Later waves add a drone operator directing the drop
      var _voA = Math.random() * Math.PI * 2;
      var _voX = player.position.x + Math.cos(_voA) * 28;
      var _voZ = player.position.z + Math.sin(_voA) * 28;
      Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_voX, VoxelWorld.getTerrainHeight(_voX, _voZ), _voZ));
    }
  }
  // Belgorod (id 11): heavy counter-attack warning + extra armor at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 11) {
    HUD.notifyPickup('⚠ HEAVY ARMORED COUNTER-ATTACK — GRAB ANTI-TANK WEAPONS!', '#ff8800');
    // Extra BTR spawn from wave 1 to reflect "tanks and mech infantry counter-attack"
    if (!capitalDefense && typeof VehicleSystem !== 'undefined') {
      var _bgrSP = _roadSpawnPos(35);
      var _bgrX = _bgrSP.x, _bgrZ = _bgrSP.z;
      VehicleSystem.spawnEnemy(_bgrX, VoxelWorld.getTerrainHeight(_bgrX, _bgrZ), _bgrZ, 'combat');
    }
  }
  // Saky airbase (id 15): extra drone spawns each wave + jammer hint at wave 1
  if (STAGES[currentStage] && STAGES[currentStage].id === 15) {
    if (w === 1) HUD.notifyPickup('📡 GRAB A JAMMER RIFLE — HEAVY DRONE PRESENCE!', '#ff6600');
    // Spawn 1+floor(w/2) extra KAMIKAZE_DRONEs at the airbase perimeter
    var _sakySurge = 1 + Math.floor(w / 2);
    for (var _sdi = 0; _sdi < _sakySurge; _sdi++) {
      var _sa = Math.random() * Math.PI * 2;
      var _sd = 28 + _sdi * 5 + Math.random() * 5;
      var _sx = player.position.x + Math.cos(_sa) * _sd;
      var _sz = player.position.z + Math.sin(_sa) * _sd;
      var _sy = VoxelWorld.getTerrainHeight(_sx, _sz) + 7;
      if (typeof Enemies !== 'undefined' && Enemies.spawnSingle) Enemies.spawnSingle('KAMIKAZE_DRONE', new THREE.Vector3(_sx, _sy, _sz));
    }
  }
  // Mariupol (id 5): fire hazard warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 5) {
    HUD.notifyPickup('🔥 STEELWORKS INFERNO — FIRE DEALS CONSTANT DAMAGE!', '#ff6600');
  }
  // Crimea Bridge (id 6): naval marines + drone warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 6) {
    HUD.notifyPickup('⚓ NAVAL MARINES AND DRONE STRIKES — HOLD THE KERCH CROSSING!', '#4477ff');
  }
  // Chornobyl (id 7): radiation warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 7) {
    HUD.notifyPickup('☢ RADIATION ACTIVE — CONSTANT EXPOSURE, WATCH YOUR HP!', '#00ff44');
  }
  // Outer Moscow (id 8): elite defenders warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 8) {
    HUD.notifyPickup('🛡 FSB ELITE & ROSGVARDIYA — MAXIMUM RESISTANCE!', '#cc44ff');
  }
  // Donbas (id 10): thermobaric weapons reminder at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 10) {
    HUD.notifyPickup('☠ DONBAS STRONGHOLD — THERMOBARIC WEAPONS CLEAR TRENCHES!', '#ff4444');
  }
  // Kremlin (id 12): final battle warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 12) {
    HUD.notifyPickup('🏛 KREMLIN — EVERY ENEMY TYPE. MAXIMUM DIFFICULTY. HOLD THE LINE!', '#ff3300');
  }
  // Kyiv (id 13): defend the capital at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 13) {
    HUD.notifyPickup('🇺🇦 DEFEND KYIV — STOP THE ARMORED COLUMNS AT ALL COSTS!', '#0057b7');
  }
  // Antonov (id 17): long-range artillery duel warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 17) {
    HUD.notifyPickup('🎯 ARTILLERY DUELS — PRECISION WEAPONS REQUIRED. WATCH YOUR RANGE!', '#ffcc44');
  }
  // Vuhledar (id 16): tank graveyard warning at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 16) {
    HUD.notifyPickup('⚰ TANK GRAVEYARD — USE MINES AND ANTI-TANK WEAPONS!', '#ff8800');
  }
  // Refinery (id 18): FPV drone mission start at wave 1
  if (w === 1 && STAGES[currentStage] && STAGES[currentStage].id === 18) {
    HUD.notifyPickup('💥 FPV DRONE ARMED — FLY INTO THE REFINERY. NO SECOND CHANCES!', '#ff6600');
  }
  // Spawn radiation zones in Chornobyl stage (ID 7) on wave 6
  if (w === 6 && typeof WorldFeatures !== 'undefined' && STAGES[currentStage] && STAGES[currentStage].id === 7) {
    WorldFeatures.addRadiationZone(player.position.x + 30, player.position.z + 30, 8);
    WorldFeatures.addRadiationZone(player.position.x - 25, player.position.z + 15, 6);
    HUD.notifyPickup('☢ CHORNOBYL RADIATION ZONES ACTIVE!', '#00ff00');
  }
  // Bakhmut (id 3): Wagner surrounds from all angles each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 3 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _wagnCount = Math.min(4, 2 + Math.floor(w / 3));
    for (var _wi = 0; _wi < _wagnCount; _wi++) {
      var _wa = (_wi / _wagnCount) * Math.PI * 2 + Math.random() * 0.4;
      var _wd = 25 + Math.random() * 10;
      var _wx = player.position.x + Math.cos(_wa) * _wd;
      var _wz = player.position.z + Math.sin(_wa) * _wd;
      Enemies.spawnSingle(w >= 4 ? 'WAGNER' : 'STORMER', new THREE.Vector3(_wx, VoxelWorld.getTerrainHeight(_wx, _wz), _wz));
    }
    if (w >= 5) {
      var _mortA = Math.random() * Math.PI * 2;
      var _mortX = player.position.x + Math.cos(_mortA) * 32;
      var _mortZ = player.position.z + Math.sin(_mortA) * 32;
      Enemies.spawnSingle('MORTAR', new THREE.Vector3(_mortX, VoxelWorld.getTerrainHeight(_mortX, _mortZ), _mortZ));
    }
  }
  // Mariupol siege (id 5): shield-and-engineer breach squads storm ruins each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 5 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _marCount = Math.min(4, 2 + Math.floor(w / 2));
    for (var _mari = 0; _mari < _marCount; _mari++) {
      var _marA = (_mari / _marCount) * Math.PI * 2 + Math.random() * 0.4;
      var _marD = 20 + Math.random() * 10;
      var _marX = player.position.x + Math.cos(_marA) * _marD;
      var _marZ = player.position.z + Math.sin(_marA) * _marD;
      Enemies.spawnSingle(w >= 5 ? 'SHIELD_BEARER' : 'STORMER', new THREE.Vector3(_marX, VoxelWorld.getTerrainHeight(_marX, _marZ), _marZ));
    }
    if (w >= 3) {
      var _marEngA = Math.random() * Math.PI * 2;
      var _marEngX = player.position.x + Math.cos(_marEngA) * 28;
      var _marEngZ = player.position.z + Math.sin(_marEngA) * 28;
      Enemies.spawnSingle('ENGINEER', new THREE.Vector3(_marEngX, VoxelWorld.getTerrainHeight(_marEngX, _marEngZ), _marEngZ));
    }
  }
  // Moscow FSB (id 8): Rosgvardiya response teams deploy each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 8 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _moscCount = Math.min(5, 2 + Math.floor(w / 2));
    for (var _mosci = 0; _mosci < _moscCount; _mosci++) {
      var _moscA = (_mosci / _moscCount) * Math.PI * 2 + Math.random() * 0.3;
      var _moscD = 22 + Math.random() * 12;
      var _moscX = player.position.x + Math.cos(_moscA) * _moscD;
      var _moscZ = player.position.z + Math.sin(_moscA) * _moscD;
      Enemies.spawnSingle(w >= 6 ? 'SPETSNAZ' : (w >= 3 ? 'RIOT' : 'STORMER'), new THREE.Vector3(_moscX, VoxelWorld.getTerrainHeight(_moscX, _moscZ), _moscZ));
    }
    if (w >= 4) {
      var _moscSniA = Math.random() * Math.PI * 2;
      var _moscSniX = player.position.x + Math.cos(_moscSniA) * 35;
      var _moscSniZ = player.position.z + Math.sin(_moscSniA) * 35;
      Enemies.spawnSingle('SNIPER_ELITE', new THREE.Vector3(_moscSniX, VoxelWorld.getTerrainHeight(_moscSniX, _moscSniZ), _moscSniZ));
    }
  }
  // Donbas trenches (id 10): trench-clearing assault each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 10 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _donCount = Math.min(5, 2 + Math.floor(w / 2));
    for (var _doni = 0; _doni < _donCount; _doni++) {
      var _donA = Math.random() * Math.PI * 2;
      var _donD = 18 + Math.random() * 14;
      var _donX = player.position.x + Math.cos(_donA) * _donD;
      var _donZ = player.position.z + Math.sin(_donA) * _donD;
      Enemies.spawnSingle(w >= 5 ? 'KADYROVITE' : 'CONSCRIPT', new THREE.Vector3(_donX, VoxelWorld.getTerrainHeight(_donX, _donZ), _donZ));
    }
    if (w >= 3) {
      var _donThermA = Math.random() * Math.PI * 2;
      var _donThermX = player.position.x + Math.cos(_donThermA) * 30;
      var _donThermZ = player.position.z + Math.sin(_donThermA) * 30;
      Enemies.spawnSingle('THERMOBARIC', new THREE.Vector3(_donThermX, VoxelWorld.getTerrainHeight(_donThermX, _donThermZ), _donThermZ));
    }
    if (w >= 5) {
      var _donMortA = Math.random() * Math.PI * 2;
      var _donMortX = player.position.x + Math.cos(_donMortA) * 36;
      var _donMortZ = player.position.z + Math.sin(_donMortA) * 36;
      Enemies.spawnSingle('MORTAR', new THREE.Vector3(_donMortX, VoxelWorld.getTerrainHeight(_donMortX, _donMortZ), _donMortZ));
    }
  }
  // Chornobyl (id 7): irradiated stalkers emerge from the hot zone each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 7 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _chnCount = Math.min(3, 1 + Math.floor(w / 3));
    for (var _chi = 0; _chi < _chnCount; _chi++) {
      var _chA = Math.random() * Math.PI * 2;
      var _chD = 22 + Math.random() * 12;
      var _chX = player.position.x + Math.cos(_chA) * _chD;
      var _chZ = player.position.z + Math.sin(_chA) * _chD;
      Enemies.spawnSingle(w >= 5 ? 'SPETSNAZ' : 'STORMER', new THREE.Vector3(_chX, VoxelWorld.getTerrainHeight(_chX, _chZ), _chZ));
    }
    if (w >= 4) {
      var _chEwA = Math.random() * Math.PI * 2;
      var _chEwX = player.position.x + Math.cos(_chEwA) * 30;
      var _chEwZ = player.position.z + Math.sin(_chEwA) * 30;
      Enemies.spawnSingle('EW_OPERATOR', new THREE.Vector3(_chEwX, VoxelWorld.getTerrainHeight(_chEwX, _chEwZ), _chEwZ));
    }
  }
  // Sevastopol naval base (id 9): naval marines storm ashore each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 9 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _sevCount = Math.min(4, 2 + Math.floor(w / 2));
    for (var _sevi = 0; _sevi < _sevCount; _sevi++) {
      var _sevA = Math.random() * Math.PI * 2;
      var _sevD = 20 + Math.random() * 12;
      var _sevX = player.position.x + Math.cos(_sevA) * _sevD;
      var _sevZ = player.position.z + Math.sin(_sevA) * _sevD;
      Enemies.spawnSingle(w >= 5 ? 'SPETSNAZ' : 'STORMER', new THREE.Vector3(_sevX, VoxelWorld.getTerrainHeight(_sevX, _sevZ), _sevZ));
    }
    if (w >= 3) {
      var _sevSnA = Math.random() * Math.PI * 2;
      var _sevSnX = player.position.x + Math.cos(_sevSnA) * 35;
      var _sevSnZ = player.position.z + Math.sin(_sevSnA) * 35;
      Enemies.spawnSingle('HEAVY_SNIPER', new THREE.Vector3(_sevSnX, VoxelWorld.getTerrainHeight(_sevSnX, _sevSnZ), _sevSnZ));
    }
  }
  // Kremlin (id 12): Kremlin Guard surge each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 12 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _krCount = Math.min(5, 2 + Math.floor(w / 2));
    for (var _kri = 0; _kri < _krCount; _kri++) {
      var _krA = (_kri / _krCount) * Math.PI * 2 + Math.random() * 0.3;
      var _krD = 22 + Math.random() * 12;
      var _krX = player.position.x + Math.cos(_krA) * _krD;
      var _krZ = player.position.z + Math.sin(_krA) * _krD;
      Enemies.spawnSingle(w >= 6 ? 'HEAVY_SNIPER' : 'SPETSNAZ', new THREE.Vector3(_krX, VoxelWorld.getTerrainHeight(_krX, _krZ), _krZ));
    }
    if (w >= 4) {
      var _krCommA = Math.random() * Math.PI * 2;
      var _krCommX = player.position.x + Math.cos(_krCommA) * 28;
      var _krCommZ = player.position.z + Math.sin(_krCommA) * 28;
      Enemies.spawnSingle('COMMISSAR', new THREE.Vector3(_krCommX, VoxelWorld.getTerrainHeight(_krCommX, _krCommZ), _krCommZ));
    }
  }
  // Snake Island (id 14): Russian naval marines land each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 14 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _snkCount = Math.min(4, 1 + Math.floor(w / 2));
    for (var _sni = 0; _sni < _snkCount; _sni++) {
      var _snA = Math.random() * Math.PI * 2;
      var _snD = 22 + Math.random() * 12;
      var _snX = player.position.x + Math.cos(_snA) * _snD;
      var _snZ = player.position.z + Math.sin(_snA) * _snD;
      Enemies.spawnSingle('STORMER', new THREE.Vector3(_snX, VoxelWorld.getTerrainHeight(_snX, _snZ), _snZ));
    }
    if (w >= 3) {
      var _snA2 = Math.random() * Math.PI * 2;
      var _snX2 = player.position.x + Math.cos(_snA2) * 30;
      var _snZ2 = player.position.z + Math.sin(_snA2) * 30;
      Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_snX2, VoxelWorld.getTerrainHeight(_snX2, _snZ2), _snZ2));
    }
  }
  // Belgorod offensive (id 11): mechanized territorial counter-attack each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 11 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _bgrInfCount = Math.min(4, 1 + Math.floor(w / 2));
    for (var _bgri = 0; _bgri < _bgrInfCount; _bgri++) {
      var _bgriA = Math.random() * Math.PI * 2;
      var _bgriD = 20 + Math.random() * 12;
      var _bgriX = player.position.x + Math.cos(_bgriA) * _bgriD;
      var _bgriZ = player.position.z + Math.sin(_bgriA) * _bgriD;
      Enemies.spawnSingle(w >= 5 ? 'ARMORED' : 'STORMER', new THREE.Vector3(_bgriX, VoxelWorld.getTerrainHeight(_bgriX, _bgriZ), _bgriZ));
    }
    if (w >= 3) {
      var _bgrEngA = Math.random() * Math.PI * 2;
      var _bgrEngX = player.position.x + Math.cos(_bgrEngA) * 30;
      var _bgrEngZ = player.position.z + Math.sin(_bgrEngA) * 30;
      Enemies.spawnSingle('ENGINEER', new THREE.Vector3(_bgrEngX, VoxelWorld.getTerrainHeight(_bgrEngX, _bgrEngZ), _bgrEngZ));
    }
    if (w >= 5) {
      var _bgrMortA = Math.random() * Math.PI * 2;
      var _bgrMortX = player.position.x + Math.cos(_bgrMortA) * 38;
      var _bgrMortZ = player.position.z + Math.sin(_bgrMortA) * 38;
      Enemies.spawnSingle('MORTAR', new THREE.Vector3(_bgrMortX, VoxelWorld.getTerrainHeight(_bgrMortX, _bgrMortZ), _bgrMortZ));
    }
  }
  // Avdiivka (id 2): assault squads probe the frontline each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 2 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _avdCount = Math.min(3, 1 + Math.floor(w / 3));
    for (var _avdi = 0; _avdi < _avdCount; _avdi++) {
      var _avdA = Math.random() * Math.PI * 2;
      var _avdD = 20 + Math.random() * 10;
      var _avdX = player.position.x + Math.cos(_avdA) * _avdD;
      var _avdZ = player.position.z + Math.sin(_avdA) * _avdD;
      Enemies.spawnSingle(w >= 4 ? 'ARMORED' : 'STORMER', new THREE.Vector3(_avdX, VoxelWorld.getTerrainHeight(_avdX, _avdZ), _avdZ));
    }
  }
  // Kherson (id 4): river-crossing assault — BTR + amphibious infantry
  if (STAGES[currentStage] && STAGES[currentStage].id === 4 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _khsCount = Math.min(3, 1 + Math.floor(w / 3));
    for (var _khsi = 0; _khsi < _khsCount; _khsi++) {
      var _khsA = Math.random() * Math.PI * 2;
      var _khsD = 22 + Math.random() * 12;
      var _khsX = player.position.x + Math.cos(_khsA) * _khsD;
      var _khsZ = player.position.z + Math.sin(_khsA) * _khsD;
      Enemies.spawnSingle('STORMER', new THREE.Vector3(_khsX, VoxelWorld.getTerrainHeight(_khsX, _khsZ), _khsZ));
    }
    if (w >= 4) {
      var _khsBtrA = Math.random() * Math.PI * 2;
      var _khsBtrX = player.position.x + Math.cos(_khsBtrA) * 30;
      var _khsBtrZ = player.position.z + Math.sin(_khsBtrA) * 30;
      Enemies.spawnSingle('BTR', new THREE.Vector3(_khsBtrX, VoxelWorld.getTerrainHeight(_khsBtrX, _khsBtrZ), _khsBtrZ));
    }
  }
  // Crimea (id 6): naval infantry land from the coast each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 6 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _criCount = Math.min(4, 2 + Math.floor(w / 3));
    for (var _crii = 0; _crii < _criCount; _crii++) {
      var _criA = Math.random() * Math.PI * 2;
      var _criD = 22 + Math.random() * 12;
      var _criX = player.position.x + Math.cos(_criA) * _criD;
      var _criZ = player.position.z + Math.sin(_criA) * _criD;
      Enemies.spawnSingle(w >= 5 ? 'PARATROOP' : 'STORMER', new THREE.Vector3(_criX, VoxelWorld.getTerrainHeight(_criX, _criZ), _criZ));
    }
    if (w >= 3) {
      var _criDrA = Math.random() * Math.PI * 2;
      var _criDrX = player.position.x + Math.cos(_criDrA) * 28;
      var _criDrZ = player.position.z + Math.sin(_criDrA) * 28;
      Enemies.spawnSingle('DRONE_OP', new THREE.Vector3(_criDrX, VoxelWorld.getTerrainHeight(_criDrX, _criDrZ) + 5, _criDrZ));
    }
  }
  // Vuhledar tank graveyard (id 16): armor columns advance each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 16 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _vuhTankA = Math.random() * Math.PI * 2;
    var _vuhTankX = player.position.x + Math.cos(_vuhTankA) * 30;
    var _vuhTankZ = player.position.z + Math.sin(_vuhTankA) * 30;
    Enemies.spawnSingle(w >= 6 ? 'ASSAULT_MECH' : 'TANK', new THREE.Vector3(_vuhTankX, VoxelWorld.getTerrainHeight(_vuhTankX, _vuhTankZ), _vuhTankZ));
    if (w >= 3) {
      var _vuhBtrA = _vuhTankA + Math.PI * 0.5 + Math.random() * 0.4;
      var _vuhBtrX = player.position.x + Math.cos(_vuhBtrA) * 26;
      var _vuhBtrZ = player.position.z + Math.sin(_vuhBtrA) * 26;
      Enemies.spawnSingle('BTR', new THREE.Vector3(_vuhBtrX, VoxelWorld.getTerrainHeight(_vuhBtrX, _vuhBtrZ), _vuhBtrZ));
    }
    if (w >= 5) {
      var _vuhMortA = Math.random() * Math.PI * 2;
      var _vuhMortX = player.position.x + Math.cos(_vuhMortA) * 38;
      var _vuhMortZ = player.position.z + Math.sin(_vuhMortA) * 38;
      Enemies.spawnSingle('MORTAR', new THREE.Vector3(_vuhMortX, VoxelWorld.getTerrainHeight(_vuhMortX, _vuhMortZ), _vuhMortZ));
    }
  }
  // Antonov Airport (id 17): paratroopers drop + saboteurs infiltrate each wave
  if (STAGES[currentStage] && STAGES[currentStage].id === 17 && typeof Enemies !== 'undefined' && Enemies.spawnSingle) {
    var _antCount = Math.min(4, 2 + Math.floor(w / 2));
    for (var _anti = 0; _anti < _antCount; _anti++) {
      var _antA = Math.random() * Math.PI * 2;
      var _antD = 25 + Math.random() * 12;
      var _antX = player.position.x + Math.cos(_antA) * _antD;
      var _antZ = player.position.z + Math.sin(_antA) * _antD;
      var _antY = VoxelWorld.getTerrainHeight(_antX, _antZ) + 18;
      Enemies.spawnSingle('PARATROOP', new THREE.Vector3(_antX, _antY, _antZ));
    }
    if (w >= 3) {
      var _antSabA = Math.random() * Math.PI * 2;
      var _antSabX = player.position.x + Math.cos(_antSabA) * 20;
      var _antSabZ = player.position.z + Math.sin(_antSabA) * 20;
      Enemies.spawnSingle('SABOTEUR', new THREE.Vector3(_antSabX, VoxelWorld.getTerrainHeight(_antSabX, _antSabZ), _antSabZ));
    }
    if (w >= 5) {
      var _antEwA = Math.random() * Math.PI * 2;
      var _antEwX = player.position.x + Math.cos(_antEwA) * 32;
      var _antEwZ = player.position.z + Math.sin(_antEwA) * 32;
      Enemies.spawnSingle('EW_OPERATOR', new THREE.Vector3(_antEwX, VoxelWorld.getTerrainHeight(_antEwX, _antEwZ), _antEwZ));
    }
  }
  // Reset combat extras per wave
  if (typeof CombatExtras !== 'undefined') {
    CombatExtras.reset();
  }
  // Capture total after ALL spawning (garrison, convoys, stage-specific) for correct progress bar denominator
  player._waveStartCount = Enemies.getAliveCount();
  // Re-announce with correct enemy count now that all spawning is complete
  HUD.announceWave(w, player._waveStartCount, stageDef.wavesPerStage);
}


function completeWave() {
  // ── Dependency aliases (TODO: wire to GameManager via init()) ──
  var player = _deps.player || {};
  var HUD = _deps.HUD || {};
  var MLSystem = _deps.MLSystem || {};
  var MissionSystem = _deps.MissionSystem || {};
  var RankSystem = _deps.RankSystem || {};
  var Feedback = _deps.Feedback || {};
  var Tracers = _deps.Tracers || {};
  var _scene = _deps.scene || null;
  var CameraSystem = _deps.CameraSystem || {};
  var Progression = _deps.Progression || {};
  var Marketplace = _deps.Marketplace || {};
  var Weapons = _deps.Weapons || {};
  var NPCSystem = _deps.NPCSystem || {};
  var VoxelWorld = _deps.VoxelWorld || {};
  var Economy = _deps.Economy || {};
  var WeatherSystem = _deps.WeatherSystem || {};
  var TimeSystem = _deps.TimeSystem || {};
  var STAGES = _deps.STAGES || [];
  var currentStage = (_deps.getCurrentStage ? _deps.getCurrentStage() : 0);
  var STATE = _deps.STATE || {};
  var showOverlay = _deps.showOverlay || function(){};
  var saveGame = _deps.saveGame || function(){};
  var _lastKillPos = _deps._lastKillPos || null;
  var _camera = _deps._camera || null;
  try {
  player.score += SCORE_WAVE_BONUS;
  HUD.setScore(player.score);
  MLSystem.onWaveComplete(currentWave, currentStage, player.hp / player.maxHp);
  RankSystem.onWaveComplete(currentWave);
  MissionSystem.onWaveCompleted();

  // Slow-mo on wave clear (dramatic final-kill moment)
  if (typeof Feedback !== 'undefined' && Feedback.triggerSlowMo) Feedback.triggerSlowMo(0.4, 0.2);
  // Confetti / spark burst above player as celebration
  try {
    if (typeof Tracers !== 'undefined' && Tracers.spawnPickupBurst && _scene && player) {
      var _wcPos = player.position.clone(); _wcPos.y += 1.5;
      Tracers.spawnPickupBurst(_wcPos, 0xffd700);
      var _wcPos2 = player.position.clone(); _wcPos2.y += 2.2; _wcPos2.x += 0.6;
      Tracers.spawnPickupBurst(_wcPos2, 0x44ff88);
      var _wcPos3 = player.position.clone(); _wcPos3.y += 2.2; _wcPos3.x -= 0.6;
      Tracers.spawnPickupBurst(_wcPos3, 0x44aaff);
    }
    if (_deps._killFovKick !== undefined) _deps._killFovKick = Math.max(_deps._killFovKick, 5); // TODO: wire to GameManager
  } catch (eWC) {}
  // Kill cam: brief camera override toward last killed enemy
  if (_lastKillPos && CameraSystem.playLastKillCam) {
    CameraSystem.playLastKillCam(_lastKillPos, _camera.position);
  }

  // Show wave stats (Feature 50)
  if (HUD.showWaveStats) {
    var elapsed = ((performance.now() - player.waveStartTime) / 1000);
    var mins = Math.floor(elapsed / 60);
    var secs = Math.floor(elapsed % 60);
    HUD.showWaveStats({
      kills: player.waveKills,
      accuracy: player.waveShots > 0 ? Math.round((player.waveHits / player.waveShots) * 100) : 0,
      headshots: player.waveHeadshots,
      time: mins + 'm ' + secs + 's',
      damageTaken: Math.round(player.waveDamageTaken),
      bestStreak: player.bestStreak,
    });
  }

  // Show last wave summary overlay (NEW FEATURE)
  if (typeof HUD !== 'undefined' && HUD.showWaveSummary) {
    var elapsedSec = Math.round((performance.now() - player.waveStartTime) / 1000);
    HUD.showWaveSummary({
      wave: currentWave,
      kills: player.waveKills,
      score: player.score,
      headshots: player.waveHeadshots,
      damageTaken: Math.round(player.waveDamageTaken),
      time: elapsedSec
    });
  }
  // Play-to-Earn: OKC for wave clear
  if (typeof Marketplace !== 'undefined') {
    Marketplace.onWaveClear();
    HUD.updateOKC(Marketplace.getOKC());
  }

  // ═══ NEW: Wave-complete integrations for 59 features ═══
  // Mark player as experienced (for quick-start flow)
  try { localStorage.setItem('ok_has_played', '1'); } catch (e) {}
  // Progression stats (BEFORE resetting wave stats so values are accurate)
  if (typeof Progression !== 'undefined') {
    Progression.trackStat('wavesCleared', 1);
    // Check flawless wave
    if (player.waveDamageTaken === 0) {
      Progression.trackStat('flawlessWaves', 1);
    }
    // Speed wave bounty
    var waveTime = (performance.now() - player.waveStartTime) / 1000;
    Progression.updateBounty('speed_wave', 1);
    Progression.updateBounty('survive', 1);
    Progression.updateBounty('low_damage', Math.round(player.waveDamageTaken));
    Progression.save();
  }
  // Radio chatter on wave clear
  if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('wave_clear');
  // Achievement checks
  if (typeof Feedback !== 'undefined') {
    if (currentWave >= 5) Feedback.unlockAchievement('SURVIVOR');
    if (currentWave >= 10) Feedback.unlockAchievement('WAVE_10');
    if (player.waveDamageTaken === 0) Feedback.unlockAchievement('NO_DAMAGE');
    var waveElapsed = (performance.now() - player.waveStartTime) / 1000;
    if (waveElapsed < 30) Feedback.unlockAchievement('SPEED_RUN');
  }
  // Journal unlocks by wave
  if (typeof Progression !== 'undefined') {
    if (currentWave >= 3) Progression.unlockJournalEntry('entry_flanking');
    if (currentWave >= 5) Progression.unlockJournalEntry('entry_shield');
    if (currentWave >= 7) Progression.unlockJournalEntry('entry_mortar');
  }

  // ── B28: Side objective check (must run BEFORE stats reset) ──
  if (typeof MissionSystem !== 'undefined' && MissionSystem.checkSideObjective) {
    var waveElapsed2 = (performance.now() - player.waveStartTime) / 1000;
    var _ammoPercent = 50;
    try {
      var _wst = Weapons.getState(); var _wdef = Weapons.getCurrent();
      if (_wst && _wdef && (_wdef.clipSize + _wdef.maxReserve) > 0)
        _ammoPercent = Math.round((_wst.clip + _wst.reserve) / (_wdef.clipSize + _wdef.maxReserve) * 100);
    } catch (e) {}
    var sideResult = MissionSystem.checkSideObjective({
      damageTaken: player.waveDamageTaken,
      kills: player.waveKills,
      headshots: player.waveHeadshots,
      waveTime: waveElapsed2,
      shotsFired: player.waveShots,
      shotsHit: player.waveHits,
      hpAtEnd: player.hp,
      ammoPercent: _ammoPercent,
      meleeKills: player.waveMeleeKills,
      firstKillTime: player.waveFirstKillTime,
      undetectedTime: 0,
      maxExplosiveKill: player.waveMaxExplosiveKill,
    });
    if (sideResult && sideResult.completed) {
      if (typeof Marketplace !== 'undefined' && Marketplace.awardCustomOKC) {
        Marketplace.awardCustomOKC(sideResult.reward, 'side_objective', {
          name: sideResult.name || 'side-objective', wave: currentWave,
        }).then(function () {
          if (HUD && HUD.updateOKC) HUD.updateOKC(Marketplace.getOKC());
        });
      } else if (typeof Marketplace !== 'undefined') {
        Marketplace.addOKC(sideResult.reward);
      }
      HUD.notifyPickup('⭐ SIDE OBJ COMPLETE: ' + sideResult.name + ' (+' + sideResult.reward + ' OKC)', '#ffdd00');
    }
    if (MissionSystem.generateSideObjective) MissionSystem.generateSideObjective();
  }

  // Snapshot wave stats before resetting (used by shop display and B31 achievements)
  var _snapWaveKills = player.waveKills;
  var _snapWaveShots = player.waveShots;
  var _snapWaveHits = player.waveHits;
  var _snapWaveDmg = player.waveDamageTaken;
  var _snapWaveTime = Math.round((performance.now() - (player.waveStartTime || performance.now())) / 1000);

  // Reset wave stats (AFTER all tracking above)
  player.waveKills = 0;
  player.waveShots = 0;
  player.waveHits = 0;
  player.waveHeadshots = 0;
  player.waveDamageTaken = 0;
  player.waveMeleeKills = 0;
  player.waveFirstKillTime = 999;
  player.waveMaxExplosiveKill = 0;

  // ── Weapon unlock on wave clear: 1 new weapon per wave ──
  var newWep = Weapons.unlockNext();
  if (newWep >= 0) {
    HUD.setWeapon(Weapons.getCurrentName(), Weapons.getCurrentIdx());
    if (HUD.showWeaponUnlockCard && Weapons.getWeaponDef) HUD.showWeaponUnlockCard(Weapons.getWeaponDef(newWep));
  }

  // ── NPC reinforcement: replace losses, keep force viable ──
  if (typeof NPCSystem !== 'undefined') {
    var aliveNPCs = NPCSystem.getCount();
    if (aliveNPCs < 12) {
      var reinforceCount = Math.min(3, 12 - aliveNPCs);
      for (var ri = 0; ri < reinforceCount; ri++) {
        var rAngle = Math.random() * Math.PI * 2;
        var rDist = 6 + Math.random() * 8;
        var rnx = player.position.x + Math.cos(rAngle) * rDist;
        var rnz = player.position.z + Math.sin(rAngle) * rDist;
        var rnh = VoxelWorld.getTerrainHeight(rnx, rnz);
        var rRank = Math.random() < 0.3 ? 'veteran' : 'infantry';
        NPCSystem.spawn(rnx, rnh, rnz, rRank);
      }
      HUD.notifyPickup('🔄 Reinforcements arrived! (+' + reinforceCount + ')', '#44ff88');
    }
  }

  // ── B27: Economy wave hooks ──
  if (typeof Economy !== 'undefined') {
    Economy.produce(); // production cycle per wave
    if (Economy.processInvestments) Economy.processInvestments();
    if (Economy.triggerRandomEvent && Math.random() < 0.3) {
      Economy.triggerRandomEvent();
      var evt = Economy.getActiveEvent ? Economy.getActiveEvent() : null;
      if (evt) HUD.notifyPickup('📢 ' + evt.name, '#ffaa00');
    }
    if (Economy.refreshBlackMarket) Economy.refreshBlackMarket();
  }

  // ── B31: Achievement checks on wave clear ──
  if (typeof Progression !== 'undefined' && Progression.checkAchievement) {
    Progression.checkAchievement('SURVIVOR', currentWave);
    Progression.checkAchievement('SLAYER', player.kills);
    Progression.checkAchievement('HEADHUNTER', player.totalHeadshots);
    if (_snapWaveDmg === 0) Progression.checkAchievement('IRONMAN', 1);
    if (typeof Marketplace !== 'undefined') Progression.checkAchievement('WEALTHY', Marketplace.getOKC());
    Progression.checkAchievement('LEGENDARY', player.level);
    if (Progression.addSeasonXP) Progression.addSeasonXP(50 + currentWave * 10);
  }

  // ── B32: Weather forecast & temperature update ──
  if (typeof WeatherSystem !== 'undefined') {
    if (WeatherSystem.generateForecast) WeatherSystem.generateForecast();
    if (WeatherSystem.updateTemperature) {
      var _tsInfo = typeof TimeSystem !== 'undefined' ? TimeSystem.getInfo() : null;
      var tod = _tsInfo ? _tsInfo.timeOfDay : 0.5;
      var season = _tsInfo ? _tsInfo.season : 'Summer';
      WeatherSystem.updateTemperature(tod, season);
    }
  }

  // Trigger a random battlefield event between waves (from wave 2+)
  if (currentWave >= 3) {
    setTimeout(triggerEvent, 1500);
  }

  const stageDef = STAGES[currentStage];

  // Check if all waves in this stage are done
  if (currentWave >= stageDef.wavesPerStage) {
    // Stage clear!
    // Stage clear bonus
    player.score += 1000; // Stage clear bonus
    HUD.setScore(player.score);
    if (typeof Feedback !== 'undefined' && Feedback.radioChatter) Feedback.radioChatter('stage_clear');

    // Auto-save checkpoint on stage clear
    saveGame();

    // Track highest stage reached for save/load
    if (typeof Progression !== 'undefined' && Progression.setHighestStage) {
      Progression.setHighestStage(currentStage + 1);
      Progression.save();
    }

    // Play-to-Earn: OKC for stage clear
    if (typeof Marketplace !== 'undefined') {
      Marketplace.onStageClear();
      HUD.updateOKC(Marketplace.getOKC());
      // Off-chain NFT badge mint for veteran stages
      if (Marketplace.mintStageBadge) {
        var stageDefForBadge = STAGES[currentStage];
        var minted = Marketplace.mintStageBadge(stageDefForBadge && stageDefForBadge.id);
        if (minted && HUD.notifyPickup) {
          HUD.notifyPickup('🏅 NFT BADGE MINTED — view in Marketplace', '#ffcc44');
        }
      }
    }

    if (currentStage >= STAGES.length - 1) {
      // Final stage cleared — win!
      _deps.setGameState(STATE.WIN); // TODO: wire to GameManager
      if (window.AudioSystem.playMusic) window.AudioSystem.playMusic('victory');
      showOverlay('win');
      document.getElementById('win-score').textContent = player.score;
      document.getElementById('win-kills').textContent = player.kills;
      document.getElementById('win-stages').textContent = STAGES.length;
      return;
    }

    // Show stage clear overlay
    _deps.setGameState(STATE.STAGE_CLEAR); // TODO: wire to GameManager
    if (typeof window.AudioSystem !== 'undefined' && window.AudioSystem.playLevelComplete) window.AudioSystem.playLevelComplete();
    showOverlay('stageclear');
    var _scn = document.getElementById('stageclear-num');   if (_scn) _scn.textContent = stageDef.id;
    var _scna = document.getElementById('stageclear-name'); if (_scna) _scna.textContent = stageDef.name;
    var _scs = document.getElementById('stageclear-score'); if (_scs) _scs.textContent = player.score;
    var _sck = document.getElementById('stageclear-kills'); if (_sck) _sck.textContent = player.kills;

    // Show heal preview
    const missingHp = player.maxHp - player.hp;
    const healAmount = Math.ceil(missingHp * 0.5);
    const healEl = document.getElementById('stageclear-heal');
    if (healEl) {
      healEl.textContent = healAmount > 0
        ? '❤ +' + healAmount + ' HP will be restored'
        : '❤ Full health!';
    }

    const nextStageDef = STAGES[currentStage + 1];
    var _scnn = document.getElementById('stageclear-next-name');   if (_scnn) _scnn.textContent = nextStageDef ? nextStageDef.name : 'VICTORY';
    var _scnl = document.getElementById('stageclear-next-label');  if (_scnl) _scnl.style.display = nextStageDef ? '' : 'none';
    // Defensive: ensure no lingering auto-countdown can bypass stage clear
    if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
    return;
  }

  _deps.setGameState(STATE.WAVE_CLEAR); // TODO: wire to GameManager
  showOverlay('waveclear');
  var _wvn = document.getElementById('waveclear-num');   if (_wvn) _wvn.textContent = currentWave;
  var _wvt = document.getElementById('waveclear-total'); if (_wvt) _wvt.textContent = stageDef.wavesPerStage;
  var _wvi = document.getElementById('waveclear-stage-info');
  if (_wvi) _wvi.textContent = 'Stage ' + stageDef.id + ': ' + stageDef.name;

  // Populate wave shop stats
  var shopKills = document.getElementById('shop-kills');
  var shopAcc = document.getElementById('shop-accuracy');
  var shopTime = document.getElementById('shop-time');
  var shopBal = document.getElementById('shop-balance');
  var shopNext = document.getElementById('shop-next-wave');
  var shopEnemies = document.getElementById('shop-next-enemies');
  if (shopKills) shopKills.textContent = 'Kills: ' + (_snapWaveKills || 0);
  if (shopAcc) {
    var acc = _snapWaveShots > 0 ? Math.round((_snapWaveHits / _snapWaveShots) * 100) : 0;
    shopAcc.textContent = 'Accuracy: ' + acc + '%';
  }
  if (shopTime) shopTime.textContent = 'Time: ' + _snapWaveTime + 's';
  if (shopBal && typeof Economy !== 'undefined') shopBal.textContent = '\u{1F4B0} ' + Economy.getCurrency() + ' OKC';
  if (shopNext) shopNext.textContent = 'Wave ' + (currentWave + 1);
  if (shopEnemies) {
    var nextCount = 3 + currentWave * 2;
    shopEnemies.textContent = nextCount + ' enemies incoming';
  }
  // Reset shop buttons
  var shopBtns = document.querySelectorAll('.shop-buy-btn');
  for (var si = 0; si < shopBtns.length; si++) {
    shopBtns[si].disabled = false;
    shopBtns[si].style.borderColor = '';
    shopBtns[si].style.color = '';
  }
  // Restore button text
  var btnTexts = { health: '\u2764\uFE0F Health +50 \u00B7 40 OKC', armor: '\uD83D\uDEE1\uFE0F Armor Pack \u00B7 60 OKC', ammo: '\uD83D\uDD2B Full Ammo \u00B7 30 OKC', stim: '\uD83D\uDC89 Stim Pack \u00B7 50 OKC' };
  for (var si2 = 0; si2 < shopBtns.length; si2++) {
    var itemId = shopBtns[si2].getAttribute('data-item');
    if (btnTexts[itemId]) shopBtns[si2].textContent = btnTexts[itemId];
  }
  // Auto-start countdown (5s) — short so wave-clear feels snappy.
  // Click anywhere on the overlay or press SPACE to skip immediately.
  if (window._shopCountdownId) clearInterval(window._shopCountdownId);
  var _shopSec = 5;
  var countdownEl = document.getElementById('shop-countdown');
  if (countdownEl) countdownEl.textContent = _shopSec;
  window._shopCountdownId = setInterval(function () {
    _shopSec--;
    if (countdownEl) countdownEl.textContent = _shopSec;
    if (_shopSec <= 0) {
      clearInterval(window._shopCountdownId);
      window._shopCountdownId = null;
      var nwBtn = document.getElementById('next-wave-btn');
      if (nwBtn) nwBtn.click();
    }
  }, 1000);
  // Tap-to-skip / Space-to-skip. 300ms grace period prevents a stray
  // mouseup (from killing the last enemy) from instantly skipping the
  // shop the player wanted to use. Re-armed on every wave-clear.
  var ovWC = document.getElementById('overlay-waveclear');
  if (ovWC) {
    ovWC.__skipArmedAt = Date.now() + 300;
    if (!ovWC.__skipBound) {
      ovWC.__skipBound = true;
      var skip = function (e) {
        if (Date.now() < (ovWC.__skipArmedAt || 0)) return;
        // Don't skip when the user clicked a shop button or the next-wave button itself.
        if (e && e.target) {
          var cls = e.target.classList;
          if ((cls && cls.contains && cls.contains('shop-buy-btn')) || e.target.id === 'next-wave-btn') return;
        }
        if (window._shopCountdownId) { clearInterval(window._shopCountdownId); window._shopCountdownId = null; }
        var nwBtn = document.getElementById('next-wave-btn');
        if (nwBtn) nwBtn.click();
      };
      ovWC.addEventListener('click', skip);
      ovWC.addEventListener('touchstart', skip, { passive: true });
      // Single window-level keydown listener (NOT re-added per wave).
      window.addEventListener('keydown', function (e) {
        if (e.code === 'Space' && ovWC.style.display !== 'none') { e.preventDefault(); skip(e); }
      });
    }
  }
  } catch (e) { console.error('[onWaveComplete] error:', e); }
}


function triggerEvent() {
  // ── Dependency aliases (TODO: wire to GameManager via init()) ──
  var player = _deps.player || {};
  var HUD = _deps.HUD || {};
  var Enemies = _deps.Enemies || {};
  var CameraSystem = _deps.CameraSystem || {};
  var VoxelWorld = _deps.VoxelWorld || {};
  var Pickups = _deps.Pickups || {};
  var NPCSystem = _deps.NPCSystem || {};
  var DroneSystem = _deps.DroneSystem || {};
  var Weapons = _deps.Weapons || {};
  const roll = Math.random();
  let cumulative = 0;
  let event = null;
  for (const ev of BATTLE_EVENTS) {
    cumulative += ev.chance;
    if (roll < cumulative) { event = ev; break; }
  }
  if (!event) return;

  HUD.notifyPickup(event.label, event.color);

  switch (event.id) {
    case 'ARTILLERY':
      // Damage enemies in a random area + screen shake
      for (let i = 0; i < 5; i++) {
        const bx = player.position.x + (Math.random() - 0.5) * 30;
        const bz = player.position.z + (Math.random() - 0.5) * 30;
        const bh = window.VoxelWorld.getTerrainHeight(bx, bz);
        Enemies.damageInRadius(new THREE.Vector3(bx, bh, bz), 5, 40);
      }
      if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.06, 0.8);
      break;
    case 'SUPPLY_DROP':
      // Drop pickups near player
      for (let i = 0; i < 4; i++) {
        const sx = player.position.x + (Math.random() - 0.5) * 12;
        const sz = player.position.z + (Math.random() - 0.5) * 12;
        const sh = window.VoxelWorld.getTerrainHeight(sx, sz);
        const types = ['HEALTH', 'AMMO', 'ARMOR', 'MEDKIT', 'GRENADE', 'STIM'];
        Pickups.spawn(new THREE.Vector3(sx, sh, sz), types[Math.floor(Math.random() * types.length)]);
      }
      break;
    case 'MORTAR':
      // Single large explosion near enemies + screen shake
      const all = Enemies.getAll();
      if (all.length > 0) {
        const target = all[Math.floor(Math.random() * all.length)];
        if (target.alive && target.mesh) {
          Enemies.damageInRadius(target.mesh.position, 8, 80);
          if (typeof CameraSystem !== 'undefined' && CameraSystem.shake) CameraSystem.shake(0.1, 0.6);
        }
      }
      break;
    case 'REINFORCEMENT':
      // Spawn extra friendly NPCs
      if (typeof NPCSystem !== 'undefined' && NPCSystem.spawn) {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 4 + Math.random() * 6;
          const nx = player.position.x + Math.cos(angle) * dist;
          const nz = player.position.z + Math.sin(angle) * dist;
          const nh = window.VoxelWorld.getTerrainHeight(nx, nz);
          NPCSystem.spawn(nx, nh, nz, 'infantry');
        }
      }
      break;
    case 'AMBUSH':
      // Enemy ambush: spawn fast stormers all around the player
      for (let i = 0; i < 6; i++) {
        const aa = (i / 6) * Math.PI * 2;
        const ad = 8 + Math.random() * 4;
        Enemies.spawnSingle('STORMER', {
          x: player.position.x + Math.cos(aa) * ad,
          z: player.position.z + Math.sin(aa) * ad
        });
      }
      break;
    case 'SNIPER_DUEL':
      // Spawn enemy snipers at long range + give player ammo
      for (let i = 0; i < 3; i++) {
        const sa = Math.random() * Math.PI * 2;
        const sd = 18 + Math.random() * 8;
        Enemies.spawnSingle('SNIPER', {
          x: player.position.x + Math.cos(sa) * sd,
          z: player.position.z + Math.sin(sa) * sd
        });
      }
      Weapons.addAmmo(20);
      break;
    case 'ARMOR_PUSH':
      // Spawn armored enemies in formation (full 360° around player)
      for (let i = 0; i < 4; i++) {
        const fa = Math.random() * Math.PI * 2;
        const fd = 15 + Math.random() * 6;
        Enemies.spawnSingle('ARMORED', {
          x: player.position.x + Math.cos(fa) * fd,
          z: player.position.z + Math.sin(fa) * fd
        });
      }
      break;
    case 'AIR_SUPPORT':
      // Massive damage to enemies in a large area
      const allEnemies = Enemies.getAll();
      for (let i = 0; i < allEnemies.length && i < 10; i++) {
        if (allEnemies[i].alive && allEnemies[i].mesh) {
          Enemies.damageInRadius(allEnemies[i].mesh.position, 6, 60);
        }
      }
      break;
    case 'DRONE_SWARM':
      // Spawn extra drones for the player
      if (typeof DroneSystem !== 'undefined' && DroneSystem.spawn) {
        for (let i = 0; i < 2; i++) {
          const dx = player.position.x + (Math.random() - 0.5) * 10;
          const dz = player.position.z + (Math.random() - 0.5) * 10;
          const dh = window.VoxelWorld.getTerrainHeight(dx, dz) + 8;
          DroneSystem.spawn(dx, dh, dz, i === 0 ? 'fpv_attack' : 'bomb');
        }
      }
      break;
    case 'CHEMICAL':
      // Chemical attack: slow damage to all enemies in area + player warning
      for (let i = 0; i < 8; i++) {
        const cx = player.position.x + (Math.random() - 0.5) * 20;
        const cz = player.position.z + (Math.random() - 0.5) * 20;
        const ch = window.VoxelWorld.getTerrainHeight(cx, cz);
        Enemies.damageInRadius(new THREE.Vector3(cx, ch, cz), 4, 25);
      }
      // Player takes minor damage if not stealth
      if (!player.stealth) {
        player.hp = Math.max(1, player.hp - 10);
        HUD.setHealth(player.hp, player.maxHp);
      }
      break;
    case 'EMP':
      // EMP: destroys kamikaze drones, severely damages drone operators
      Enemies.getAll().forEach(function (e) {
        if (e.typeName === 'DRONE_OP') Enemies.damage(e, 80);
        else if (e.typeName === 'KAMIKAZE_DRONE') Enemies.damage(e, 999);
      });
      break;
    case 'TUNNEL_BREACH':
      // Enemies emerge from underground behind the player
      var _tbYaw = (typeof CameraSystem !== 'undefined' && CameraSystem.getYaw) ? CameraSystem.getYaw() : Math.random() * Math.PI * 2;
      for (let i = 0; i < 4; i++) {
        const ta = Math.PI + (Math.random() - 0.5) * 1.0; // behind player
        const td = 5 + Math.random() * 5;
        Enemies.spawnSingle('STORMER', {
          x: player.position.x + Math.cos(_tbYaw + ta) * td,
          z: player.position.z + Math.sin(_tbYaw + ta) * td
        });
      }
      break;
  }
}


  /* ── Public Getters ─────────────────────────────────────────────── */
  function getCurrentWave() { return currentWave; }
  function getEventLog() { return _eventLog.slice(); }

  return {
    init: init,
    beginWave: beginWave,
    completeWave: completeWave,
    getCurrentWave: getCurrentWave,
    triggerEvent: triggerEvent,
    getEventLog: getEventLog,
  };
})();
