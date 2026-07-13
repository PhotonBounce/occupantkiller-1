/* ───────────────────────────────────────────────────────────────────────────
   submarine-hunter.js — Board a Rogue Submarine & Destroy the Launch System
   API: window.SubmarineHunter = { init, update, reset }
   Controls:
     S then U (within 400ms) → activate module
     W / S                   → move forward / back
     A / D                   → strafe left / right
     Mouse move              → look (pointer-lock)
     SPACE                   → shoot / fire weapon
     E                       → interact (vent, panel, door)
     F                       → use compressed air vent (push enemies)
   ─────────────────────────────────────────────────────────────────────────── */
window.SubmarineHunter = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key tracking (S then U within 400ms) ─────────────────── */
  var _keyPressTimes = { KeyS: 0, KeyU: 0 };
  var ACTIVATE_WINDOW = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionComplete = false;
  var _missionFailed   = false;

  /* ── Player state ──────────────────────────────────────────────────────── */
  var _playerPos   = { x: 0, y: 1.7, z: 60 };
  var _playerYaw   = 0;
  var _playerPitch = 0;
  var _playerHP    = 100;
  var _playerMaxHP = 100;
  var _keys        = {};
  var _keysPrev    = {};

  /* ── Missile countdown ─────────────────────────────────────────────────── */
  var MISSILE_COUNTDOWN_TOTAL = 120;
  var _missileCountdown = MISSILE_COUNTDOWN_TOTAL;
  var _silosDisabled    = 0;
  var SILO_COUNT        = 4;
  /* Each silo needs 3 hits on its control panel */
  var _siloHits         = [0, 0, 0, 0]; /* hits taken per silo (need 3 each) */
  var _siloDisabled     = [false, false, false, false];

  /* ── Hull breach ───────────────────────────────────────────────────────── */
  var _hullBreach       = false;
  var _hullBreachTimer  = 30;  /* 30s to reach pressure hatch */
  var _hullIntegrity    = 100;

  /* ── Compressed air vents ─────────────────────────────────────────────── */
  var VENT_COUNT   = 3;
  var _ventCooldowns = [0, 0, 0];

  /* ── Torpedo tubes (loaded = can be triggered) ────────────────────────── */
  var TORPEDO_TUBE_COUNT = 4;
  var _torpedoTubeLoaded = [true, true, false, true];

  /* ── Enemy state ───────────────────────────────────────────────────────── */
  /* 12 crew + 5 navy SF + 1 boss */
  var _enemies   = [];  /* { mesh, hp, maxHp, type, pos, yaw, state, timer, alive } */
  var _boss      = null; /* special ref to Admiral Voronov */
  var _bossPhase = 0;   /* 0 = normal, 1 = auto-torpedo defense (<50% HP) */

  /* ── Projectiles / torpedoes ──────────────────────────────────────────── */
  var _bullets    = [];   /* { mesh, vel, life, friendly } */
  var _torpedoes  = [];   /* { mesh, vel, life, aoe } */
  var _explosions = [];   /* { mesh, life, light } */

  /* ── Scene objects ────────────────────────────────────────────────────── */
  var _subGroup        = null;  /* entire submarine group */
  var _exteriorGroup   = null;
  var _torpedoRoomGroup = null;
  var _engineRoomGroup  = null;
  var _controlRoomGroup = null;
  var _missileBayGroup  = null;
  var _commanderCabinGroup = null;
  var _siloPanelMeshes  = [];   /* 4 panels, each shootable */
  var _ventMeshes       = [];   /* 3 vent meshes */
  var _torpedoTubeMeshes = [];  /* torpedo tube geometry */
  var _hatchMesh        = null;
  var _pressureHatchMesh = null;

  /* ── CountdownDisplays (LineSegments) ────────────────────────────────── */
  var _countdownDisplays = [];  /* one per silo */

  /* ── Ambient / lighting ───────────────────────────────────────────────── */
  var _savedBackground = null;
  var _savedFog        = null;
  var _redAlertLight   = null;
  var _redAlertTimer   = 0;

  /* ── HUD DOM elements ─────────────────────────────────────────────────── */
  var _hud          = null;
  var _messageEl    = null;
  var _endEl        = null;
  var _messageTimer = 0;

  /* ── Timing ───────────────────────────────────────────────────────────── */
  var _lastTime = 0;

  /* ── Mouse state ──────────────────────────────────────────────────────── */
  var _mouseMovX = 0;
  var _mouseMovY = 0;

  /* ── Shooting cooldown ────────────────────────────────────────────────── */
  var _shootCooldown = 0;
  var SHOOT_INTERVAL = 0.18;

  /* ══════════════════════════════════════════════════════════════════════════
     GEOMETRY BUILDERS
  ══════════════════════════════════════════════════════════════════════════ */

  /* ── LineSegments digit display for countdown ────────────────────────── */
  function buildDigitSegments(x, y, z, scale) {
    var s = scale || 0.4;
    /* 7-segment style points forming digits "- -" outline */
    var pts = new Float32Array([
      /* top bar */     x,       y+s,   z,   x+s*0.6, y+s,   z,
      /* top-left */    x,       y+s,   z,   x,       y,     z,
      /* top-right */   x+s*0.6, y+s,   z,   x+s*0.6, y,     z,
      /* mid bar */     x,       y,     z,   x+s*0.6, y,     z,
      /* bot-left */    x,       y,     z,   x,       y-s,   z,
      /* bot-right */   x+s*0.6, y,     z,   x+s*0.6, y-s,   z,
      /* bot bar */     x,       y-s,   z,   x+s*0.6, y-s,   z,
      /* colon top */   x+s*0.75,y+s*0.4,z,  x+s*0.85,y+s*0.4,z,
      /* colon bot */   x+s*0.75,y-s*0.1,z,  x+s*0.85,y-s*0.1,z,
      /* sec top */     x+s,     y+s,   z,   x+s*1.6, y+s,   z,
      /* sec top-l */   x+s,     y+s,   z,   x+s,     y,     z,
      /* sec top-r */   x+s*1.6, y+s,   z,   x+s*1.6, y,     z,
      /* sec mid */     x+s,     y,     z,   x+s*1.6, y,     z,
      /* sec bot-l */   x+s,     y,     z,   x+s,     y-s,   z,
      /* sec bot-r */   x+s*1.6, y,     z,   x+s*1.6, y-s,   z,
      /* sec bot */     x+s,     y-s,   z,   x+s*1.6, y-s,   z
    ]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat  = new THREE.LineBasicMaterial({ color: 0xFF4400 });
    return new THREE.LineSegments(geo, mat);
  }

  /* ── Hull breach warning indicator (LineSegments) ────────────────────── */
  function buildBreachIndicator(x, y, z) {
    var pts = new Float32Array([
      x-0.3, y+0.4, z,   x+0.3, y+0.4, z,
      x+0.3, y+0.4, z,   x,     y-0.4, z,
      x,     y-0.4, z,   x-0.3, y+0.4, z,
      /* exclamation */
      x,     y+0.1, z,   x,     y+0.3, z,
      x,     y-0.2, z,   x,     y-0.1, z
    ]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({ color: 0xFF0000 });
    return new THREE.LineSegments(geo, mat);
  }

  /* ── Submarine exterior ──────────────────────────────────────────────── */
  function buildExterior() {
    var group = new THREE.Group();
    group.name = '_sh_exterior';

    /* Main hull — long cylinder (horizontal) */
    var hullGeo = new THREE.CylinderGeometry(4, 4, 80, 12);
    var hullMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
    var hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.rotation.z = Math.PI / 2;
    hullMesh.position.set(0, 0, 0);
    group.add(hullMesh);

    /* Bow cap */
    var bowGeo = new THREE.CylinderGeometry(0.2, 4, 6, 12);
    var bowMat = new THREE.MeshLambertMaterial({ color: 0x162030 });
    var bowMesh = new THREE.Mesh(bowGeo, bowMat);
    bowMesh.rotation.z = Math.PI / 2;
    bowMesh.position.set(43, 0, 0);
    group.add(bowMesh);

    /* Stern cap */
    var sternGeo = new THREE.CylinderGeometry(4, 0.2, 6, 12);
    var sternMat = new THREE.MeshLambertMaterial({ color: 0x162030 });
    var sternMesh = new THREE.Mesh(sternGeo, sternMat);
    sternMesh.rotation.z = Math.PI / 2;
    sternMesh.position.set(-43, 0, 0);
    group.add(sternMesh);

    /* Conning tower (sail) */
    var sailGeo = new THREE.BoxGeometry(6, 5, 4);
    var sailMat = new THREE.MeshLambertMaterial({ color: 0x1a2535 });
    var sailMesh = new THREE.Mesh(sailGeo, sailMat);
    sailMesh.position.set(-5, 6.5, 0);
    group.add(sailMesh);

    /* Periscope mast */
    var mast1Geo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
    var mast1Mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var mast1Mesh = new THREE.Mesh(mast1Geo, mast1Mat);
    mast1Mesh.position.set(-4.5, 11, 0);
    group.add(mast1Mesh);

    /* Antenna mast */
    var mast2Geo = new THREE.CylinderGeometry(0.08, 0.08, 3, 6);
    var mast2Mat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var mast2Mesh = new THREE.Mesh(mast2Geo, mast2Mat);
    mast2Mesh.position.set(-5.5, 11.5, 0.5);
    group.add(mast2Mesh);

    /* Hatch entry point on top of hull */
    var hatchGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 10);
    var hatchMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    _hatchMesh = new THREE.Mesh(hatchGeo, hatchMat);
    _hatchMesh.position.set(20, 4.2, 0);
    _hatchMesh.name = '_sh_hatch';
    group.add(_hatchMesh);

    /* Pressure escape hatch (aft) */
    var phGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.4, 8);
    var phMat = new THREE.MeshLambertMaterial({ color: 0xCC4400 });
    _pressureHatchMesh = new THREE.Mesh(phGeo, phMat);
    _pressureHatchMesh.position.set(-30, 4.2, 0);
    _pressureHatchMesh.name = '_sh_pressure_hatch';
    group.add(_pressureHatchMesh);

    /* Rudder / fins */
    var finGeo = new THREE.BoxGeometry(0.3, 5, 3);
    var finMat = new THREE.MeshLambertMaterial({ color: 0x162030 });
    var finH   = new THREE.Mesh(finGeo, finMat);
    finH.position.set(-45, 0, 0);
    group.add(finH);
    var finV = new THREE.Mesh(finGeo, finMat);
    finV.rotation.z = Math.PI / 2;
    finV.position.set(-45, 0, 0);
    group.add(finV);

    return group;
  }

  /* ── Torpedo room ─────────────────────────────────────────────────────── */
  function buildTorpedoRoom() {
    var group = new THREE.Group();
    group.name = '_sh_torpedo_room';
    group.position.set(25, 0, 0);

    /* Room walls */
    var wallGeo = new THREE.BoxGeometry(22, 8, 14);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x1e2e3e });
    var wallMesh = new THREE.Mesh(wallGeo, wallMat);
    group.add(wallMesh);

    /* Torpedo tubes — 4 tubes in 2 rows */
    _torpedoTubeMeshes = [];
    var tubePositions = [
      { x: 8, y: 1.5, z: -3 },
      { x: 8, y: 1.5, z:  3 },
      { x: 8, y: -1.5, z: -3 },
      { x: 8, y: -1.5, z:  3 }
    ];
    for (var ti = 0; ti < TORPEDO_TUBE_COUNT; ti++) {
      var tp = tubePositions[ti];
      var tubeGeo = new THREE.CylinderGeometry(0.7, 0.7, 8, 10);
      var tubeMat = new THREE.MeshLambertMaterial({
        color: _torpedoTubeLoaded[ti] ? 0x334455 : 0x223344
      });
      var tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.rotation.z = Math.PI / 2;
      tubeMesh.position.set(tp.x, tp.y, tp.z);
      tubeMesh.name = '_sh_tube_' + ti;
      tubeMesh.userData.tubeIndex = ti;
      group.add(tubeMesh);
      _torpedoTubeMeshes.push(tubeMesh);
    }

    /* Rack mounts */
    for (var ri = 0; ri < 6; ri++) {
      var rackGeo = new THREE.BoxGeometry(9, 0.3, 0.2);
      var rackMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
      var rackMesh = new THREE.Mesh(rackGeo, rackMat);
      rackMesh.position.set(5, -2.5 + ri * 0.8, ri % 2 === 0 ? -5 : 5);
      group.add(rackMesh);
    }

    /* Spare torpedoes on racks */
    for (var sti = 0; sti < 3; sti++) {
      var spareGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
      var spareMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
      var spareMesh = new THREE.Mesh(spareGeo, spareMat);
      spareMesh.rotation.z = Math.PI / 2;
      spareMesh.position.set(4 + sti * 0.5, -2, -5);
      group.add(spareMesh);
    }

    /* Breach warning indicator */
    var breachWarn = buildBreachIndicator(0, 3.5, -6);
    breachWarn.name = '_sh_breach_warn_torpedo';
    breachWarn.visible = false;
    group.add(breachWarn);

    return group;
  }

  /* ── Engine room ──────────────────────────────────────────────────────── */
  function buildEngineRoom() {
    var group = new THREE.Group();
    group.name = '_sh_engine_room';
    group.position.set(-15, 0, 0);

    /* Room walls */
    var wallGeo = new THREE.BoxGeometry(28, 8, 14);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1e22 });
    group.add(new THREE.Mesh(wallGeo, wallMat));

    /* Large engine blocks */
    var enginePositions = [
      { x: -3, z: -4 },
      { x: -3, z:  4 },
      { x:  3, z: -4 },
      { x:  3, z:  4 }
    ];
    for (var ei = 0; ei < enginePositions.length; ei++) {
      var ep = enginePositions[ei];
      var engGeo = new THREE.BoxGeometry(4, 3.5, 3.5);
      var engMat = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
      var engMesh = new THREE.Mesh(engGeo, engMat);
      engMesh.position.set(ep.x, -1.5, ep.z);
      group.add(engMesh);

      /* Engine detail top */
      var detGeo = new THREE.BoxGeometry(3.5, 0.4, 3);
      var detMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
      var detMesh = new THREE.Mesh(detGeo, detMat);
      detMesh.position.set(ep.x, 0.2, ep.z);
      group.add(detMesh);
    }

    /* Horizontal pipes connecting engines */
    var pipePositions = [
      { sx: -5, ex: 5, y: 1.8, z: -3 },
      { sx: -5, ex: 5, y: 1.8, z:  3 },
      { sx: -5, ex: 5, y: -0.5, z: 0 }
    ];
    for (var pi = 0; pi < pipePositions.length; pi++) {
      var pp = pipePositions[pi];
      var len = Math.abs(pp.ex - pp.sx);
      var pipeGeo = new THREE.CylinderGeometry(0.25, 0.25, len, 8);
      var pipeMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
      var pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
      pipeMesh.rotation.z = Math.PI / 2;
      pipeMesh.position.set((pp.sx + pp.ex) / 2, pp.y, pp.z);
      group.add(pipeMesh);
    }

    /* Steam vents — 3 total (interactive) */
    _ventMeshes = [];
    var ventPos = [
      { x: -6, z: -5 },
      { x:  0, z:  6 },
      { x:  6, z: -2 }
    ];
    for (var vi = 0; vi < VENT_COUNT; vi++) {
      var vp = ventPos[vi];
      var ventGeo = new THREE.CylinderGeometry(0.35, 0.5, 1.5, 8);
      var ventMat = new THREE.MeshLambertMaterial({ color: 0x889988 });
      var ventMesh = new THREE.Mesh(ventGeo, ventMat);
      ventMesh.position.set(vp.x, -1.5, vp.z);
      ventMesh.name = '_sh_vent_' + vi;
      ventMesh.userData.ventIndex = vi;
      group.add(ventMesh);
      _ventMeshes.push(ventMesh);
    }

    /* Reactor core glow block */
    var reactGeo = new THREE.BoxGeometry(3, 4, 3);
    var reactMat = new THREE.MeshLambertMaterial({ color: 0x223322, emissive: 0x00FF44, emissiveIntensity: 0.3 });
    var reactMesh = new THREE.Mesh(reactGeo, reactMat);
    reactMesh.position.set(-8, -1, 0);
    group.add(reactMesh);

    /* Engine room light */
    var engLight = new THREE.PointLight(0x88FFAA, 1.5, 20);
    engLight.position.set(-8, 2, 0);
    engLight.name = '_sh_eng_light';
    group.add(engLight);

    return group;
  }

  /* ── Control room ─────────────────────────────────────────────────────── */
  function buildControlRoom() {
    var group = new THREE.Group();
    group.name = '_sh_control_room';
    group.position.set(0, 0, 0);

    /* Room walls */
    var wallGeo = new THREE.BoxGeometry(18, 8, 14);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x1a2030 });
    group.add(new THREE.Mesh(wallGeo, wallMat));

    /* Semicircular console — approximated with BoxGeometry arc pieces */
    var consoleAngles = [-60, -30, 0, 30, 60];
    var consoleRadius = 4;
    for (var ci = 0; ci < consoleAngles.length; ci++) {
      var ang = consoleAngles[ci] * Math.PI / 180;
      var cGeo = new THREE.BoxGeometry(2.2, 0.8, 0.8);
      var cMat = new THREE.MeshLambertMaterial({ color: 0x334466 });
      var cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(
        Math.sin(ang) * consoleRadius,
        -2.0,
        Math.cos(ang) * consoleRadius
      );
      cMesh.rotation.y = -ang;
      group.add(cMesh);

      /* Console screen */
      var scrGeo = new THREE.BoxGeometry(1.8, 0.5, 0.05);
      var scrMat = new THREE.MeshLambertMaterial({ color: 0x001144, emissive: 0x002288, emissiveIntensity: 0.6 });
      var scrMesh = new THREE.Mesh(scrGeo, scrMat);
      scrMesh.position.set(
        Math.sin(ang) * consoleRadius,
        -1.6,
        Math.cos(ang) * consoleRadius - 0.42
      );
      scrMesh.rotation.y = -ang;
      group.add(scrMesh);
    }

    /* Periscope — thin vertical cylinder */
    var periGeo = new THREE.CylinderGeometry(0.12, 0.14, 5, 8);
    var periMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    var periMesh = new THREE.Mesh(periGeo, periMat);
    periMesh.position.set(-2, 0.5, 0);
    group.add(periMesh);

    /* Periscope handle */
    var pHandleGeo = new THREE.BoxGeometry(1.2, 0.1, 0.1);
    var pHandleMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
    var pHandleMesh = new THREE.Mesh(pHandleGeo, pHandleMat);
    pHandleMesh.position.set(-2, 2.8, 0);
    group.add(pHandleMesh);

    /* Radar screens — flat boxes */
    var radarPositions = [
      { x: -6, z: -5 },
      { x: -6, z:  5 },
      { x: 6,  z: -6 }
    ];
    for (var ri = 0; ri < radarPositions.length; ri++) {
      var rp = radarPositions[ri];
      var radGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
      var radMat = new THREE.MeshLambertMaterial({ color: 0x001122, emissive: 0x004411, emissiveIntensity: 0.5 });
      var radMesh = new THREE.Mesh(radGeo, radMat);
      radMesh.position.set(rp.x, 0.5, rp.z);
      group.add(radMesh);

      /* Radar sweep line (LineSegments) */
      var sweepPts = new Float32Array([
        rp.x, 0.5, rp.z,   rp.x + 0.8, 0.5, rp.z + 0.5
      ]);
      var sweepGeo = new THREE.BufferGeometry();
      sweepGeo.setAttribute('position', new THREE.BufferAttribute(sweepPts, 3));
      var sweepMat = new THREE.LineBasicMaterial({ color: 0x00FF44 });
      var sweepLine = new THREE.LineSegments(sweepGeo, sweepMat);
      group.add(sweepLine);
    }

    /* Overhead light */
    var ctrlLight = new THREE.PointLight(0x4488CC, 1.8, 22);
    ctrlLight.position.set(0, 3.5, 0);
    ctrlLight.name = '_sh_ctrl_light';
    group.add(ctrlLight);

    /* Red alert light */
    _redAlertLight = new THREE.PointLight(0xFF2200, 0, 18);
    _redAlertLight.position.set(0, 3, 0);
    group.add(_redAlertLight);

    return group;
  }

  /* ── Missile bay ──────────────────────────────────────────────────────── */
  function buildMissileBay() {
    var group = new THREE.Group();
    group.name = '_sh_missile_bay';
    group.position.set(-40, 0, 0);

    /* Room */
    var wallGeo = new THREE.BoxGeometry(20, 8, 16);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
    group.add(new THREE.Mesh(wallGeo, wallMat));

    /* Silo positions — 4 silos */
    _siloPanelMeshes = [];
    _countdownDisplays = [];
    var siloPos = [
      { x: -4, z: -5 },
      { x: -4, z:  5 },
      { x:  4, z: -5 },
      { x:  4, z:  5 }
    ];
    for (var si = 0; si < SILO_COUNT; si++) {
      var sp = siloPos[si];

      /* Missile silo cylinder */
      var siloGeo = new THREE.CylinderGeometry(1.0, 1.0, 7, 10);
      var siloMat = new THREE.MeshLambertMaterial({ color: 0x2a2a44 });
      var siloMesh = new THREE.Mesh(siloGeo, siloMat);
      siloMesh.position.set(sp.x, -0.5, sp.z);
      group.add(siloMesh);

      /* Missile inside silo */
      var missileGeo = new THREE.CylinderGeometry(0.5, 0.6, 5.5, 8);
      var missileMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
      var missileMesh = new THREE.Mesh(missileGeo, missileMat);
      missileMesh.position.set(sp.x, -0.2, sp.z);
      missileMesh.name = '_sh_missile_' + si;
      group.add(missileMesh);

      /* Missile nose cone */
      var noseGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
      var noseMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var noseMesh = new THREE.Mesh(noseGeo, noseMat);
      noseMesh.position.set(sp.x, 3.2, sp.z);
      group.add(noseMesh);

      /* Control panel next to silo — shootable */
      var panelGeo = new THREE.BoxGeometry(0.8, 1.2, 0.2);
      var panelMat = new THREE.MeshLambertMaterial({ color: 0x446688 });
      var panelMesh = new THREE.Mesh(panelGeo, panelMat);
      panelMesh.position.set(sp.x + 1.4, -1.0, sp.z);
      panelMesh.name = '_sh_silo_panel_' + si;
      panelMesh.userData.siloIndex = si;
      group.add(panelMesh);
      _siloPanelMeshes.push(panelMesh);

      /* Countdown display (LineSegments digits) */
      var dispSeg = buildDigitSegments(sp.x - 0.5, 1.2, sp.z - 0.7, 0.35);
      dispSeg.name = '_sh_countdown_' + si;
      group.add(dispSeg);
      _countdownDisplays.push(dispSeg);
    }

    /* Silo bay light */
    var bayLight = new THREE.PointLight(0xFF4422, 1.5, 20);
    bayLight.position.set(0, 3, 0);
    bayLight.name = '_sh_bay_light';
    group.add(bayLight);

    return group;
  }

  /* ── Commander's cabin ────────────────────────────────────────────────── */
  function buildCommanderCabin() {
    var group = new THREE.Group();
    group.name = '_sh_commander_cabin';
    group.position.set(-5, 0, -8);

    /* Room walls */
    var wallGeo = new THREE.BoxGeometry(10, 7, 9);
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x2a1e14 });
    group.add(new THREE.Mesh(wallGeo, wallMat));

    /* Wooden desk */
    var deskTopGeo = new THREE.BoxGeometry(4, 0.2, 2);
    var deskMat    = new THREE.MeshLambertMaterial({ color: 0x6b3a1f });
    var deskTop    = new THREE.Mesh(deskTopGeo, deskMat);
    deskTop.position.set(1, -0.8, 0);
    group.add(deskTop);

    /* Desk legs */
    var legGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x5a2e12 });
    var legOffsets = [[-1.7, 0.9], [-1.7, -0.9], [1.7, 0.9], [1.7, -0.9]];
    for (var li = 0; li < legOffsets.length; li++) {
      var leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(legOffsets[li][0] + 1, -1.65, legOffsets[li][1]);
      group.add(leg);
    }

    /* Chart table (flat top) */
    var chartGeo = new THREE.BoxGeometry(3, 0.15, 2.5);
    var chartMat = new THREE.MeshLambertMaterial({ color: 0x8b5e2f });
    var chartMesh = new THREE.Mesh(chartGeo, chartMat);
    chartMesh.position.set(-2, -0.5, 1);
    group.add(chartMesh);

    /* Map/paper on chart table */
    var mapGeo = new THREE.BoxGeometry(2.5, 0.05, 2);
    var mapMat = new THREE.MeshLambertMaterial({ color: 0xf5e6a8 });
    var mapMesh = new THREE.Mesh(mapGeo, mapMat);
    mapMesh.position.set(-2, -0.4, 1);
    group.add(mapMesh);

    /* Bookshelf */
    var shelfGeo = new THREE.BoxGeometry(0.3, 3, 2);
    var shelfMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1f });
    var shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(-4.5, 0, -3);
    group.add(shelfMesh);

    /* Books */
    for (var bi = 0; bi < 6; bi++) {
      var bookGeo = new THREE.BoxGeometry(0.25, 0.4 + Math.random() * 0.4, 0.2);
      var bookMat = new THREE.MeshLambertMaterial({ color: (bi % 3 === 0) ? 0x882222 : (bi % 3 === 1) ? 0x226688 : 0x228822 });
      var bookMesh = new THREE.Mesh(bookGeo, bookMat);
      bookMesh.position.set(-4.5, -0.5 + bi * 0.5, -2.5 + bi * 0.1);
      group.add(bookMesh);
    }

    /* Cabin light */
    var cabLight = new THREE.PointLight(0xFFAA44, 1.0, 12);
    cabLight.position.set(0, 2.5, 0);
    group.add(cabLight);

    return group;
  }

  /* ── Enemy mesh builder ───────────────────────────────────────────────── */
  function buildEnemyMesh(type) {
    var color = (type === 'crew') ? 0x334466
              : (type === 'special_forces') ? 0x334433
              : 0x222255;
    var group = new THREE.Group();

    /* Body */
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0;
    group.add(body);

    /* Head */
    var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xddbb99 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.8;
    group.add(head);

    /* Arms */
    var armGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
    var armMat = new THREE.MeshLambertMaterial({ color: color });
    var armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-0.42, 0.1, 0);
    group.add(armL);
    var armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.42, 0.1, 0);
    group.add(armR);

    /* Gun */
    var gunGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.38, 0.1, -0.35);
    group.add(gun);

    /* Boss: special hat / epaulettes */
    if (type === 'boss') {
      var hatGeo = new THREE.BoxGeometry(0.45, 0.15, 0.45);
      var hatMat = new THREE.MeshLambertMaterial({ color: 0x111144 });
      var hat = new THREE.Mesh(hatGeo, hatMat);
      hat.position.y = 1.08;
      group.add(hat);

      var epL = new THREE.BoxGeometry(0.25, 0.06, 0.3);
      var epMat = new THREE.MeshLambertMaterial({ color: 0xDDAA00 });
      var epaulL = new THREE.Mesh(epL, epMat);
      epaulL.position.set(-0.43, 0.6, 0);
      group.add(epaulL);
      var epaulR = new THREE.Mesh(epL, epMat);
      epaulR.position.set(0.43, 0.6, 0);
      group.add(epaulR);
    }

    return group;
  }

  /* ── Bullet mesh ──────────────────────────────────────────────────────── */
  function buildBulletMesh(friendly) {
    var geo = new THREE.SphereGeometry(0.07, 5, 5);
    var mat = new THREE.MeshLambertMaterial({ color: friendly ? 0xFFDD00 : 0xFF4400 });
    return new THREE.Mesh(geo, mat);
  }

  /* ── Explosion builder ────────────────────────────────────────────────── */
  function buildExplosion(pos, radius) {
    var r   = radius || 3;
    var geo = new THREE.SphereGeometry(r, 8, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    var light = new THREE.PointLight(0xFF4400, 3, r * 5);
    light.position.copy(pos);
    _scene.add(mesh);
    _scene.add(light);
    _explosions.push({ mesh: mesh, light: light, life: 1.0 });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SPAWN ENEMIES
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnEnemies() {
    _enemies = [];

    /* 12 submarine crew scattered across compartments */
    var crewPositions = [
      { x: 28,  y: 1.7, z: -3  },
      { x: 28,  y: 1.7, z:  3  },
      { x: 22,  y: 1.7, z:  5  },
      { x: 18,  y: 1.7, z: -4  },
      { x: -10, y: 1.7, z: -4  },
      { x: -10, y: 1.7, z:  4  },
      { x: -18, y: 1.7, z:  2  },
      { x: -18, y: 1.7, z: -2  },
      { x: 2,   y: 1.7, z: -4  },
      { x: 5,   y: 1.7, z:  5  },
      { x: -5,  y: 1.7, z:  3  },
      { x: 8,   y: 1.7, z: -6  }
    ];
    for (var ci = 0; ci < 12; ci++) {
      var cp = crewPositions[ci];
      var mesh = buildEnemyMesh('crew');
      mesh.position.set(cp.x, cp.y, cp.z);
      _scene.add(mesh);
      _enemies.push({
        mesh:    mesh,
        hp:      80,
        maxHp:   80,
        type:    'crew',
        pos:     { x: cp.x, y: cp.y, z: cp.z },
        yaw:     Math.random() * Math.PI * 2,
        state:   'idle',
        timer:   1 + Math.random() * 2,
        shootTimer: 1 + Math.random() * 1.5,
        alive:   true,
        knockback: 0
      });
    }

    /* 5 navy special forces (board from above, start on hull top) */
    var sfPositions = [
      { x: 10, y: 5, z: -2 },
      { x: 14, y: 5, z:  3 },
      { x: 18, y: 5, z: -3 },
      { x: 6,  y: 5, z:  4 },
      { x: 22, y: 5, z:  0 }
    ];
    for (var si = 0; si < 5; si++) {
      var sfp = sfPositions[si];
      var sfMesh = buildEnemyMesh('special_forces');
      sfMesh.position.set(sfp.x, sfp.y, sfp.z);
      _scene.add(sfMesh);
      _enemies.push({
        mesh:    sfMesh,
        hp:      110,
        maxHp:   110,
        type:    'special_forces',
        pos:     { x: sfp.x, y: sfp.y, z: sfp.z },
        yaw:     Math.PI,
        state:   'patrol',
        timer:   0.5 + Math.random(),
        shootTimer: 2 + Math.random(),
        alive:   true,
        knockback: 0
      });
    }

    /* Boss: Admiral Voronov — in the control room */
    var bossMesh = buildEnemyMesh('boss');
    bossMesh.position.set(2, 1.7, 2);
    _scene.add(bossMesh);
    _boss = {
      mesh:      bossMesh,
      hp:        500,
      maxHp:     500,
      type:      'boss',
      pos:       { x: 2, y: 1.7, z: 2 },
      yaw:       0,
      state:     'idle',
      timer:     3,
      shootTimer: 1.5,
      alive:     true,
      knockback: 0,
      phaseTwo:  false
    };
    _enemies.push(_boss);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function createHUD() {
    _hud = document.createElement('div');
    _hud.id = '_sh_hud';
    _hud.style.cssText = [
      'position:fixed',
      'bottom:10px',
      'left:10px',
      'right:10px',
      'color:#00FFCC',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,5,15,0.78)',
      'padding:6px 12px',
      'border-radius:4px',
      'border:1px solid #006688',
      'display:none',
      'z-index:9999',
      'pointer-events:none',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(_hud);

    _messageEl = document.createElement('div');
    _messageEl.id = '_sh_msg';
    _messageEl.style.cssText = [
      'position:fixed',
      'top:14px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#FFEE55',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,5,15,0.85)',
      'padding:6px 18px',
      'border-radius:4px',
      'border:1px solid #776600',
      'display:none',
      'z-index:10001',
      'pointer-events:none',
      'text-align:center',
      'max-width:600px'
    ].join(';');
    document.body.appendChild(_messageEl);

    _endEl = document.createElement('div');
    _endEl.id = '_sh_end';
    _endEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#00FFAA',
      'font-family:monospace',
      'font-size:20px',
      'font-weight:bold',
      'background:rgba(0,10,5,0.94)',
      'padding:24px 40px',
      'border-radius:8px',
      'border:2px solid #00FFAA',
      'display:none',
      'z-index:10002',
      'pointer-events:none',
      'text-align:center',
      'text-shadow:0 0 10px #00FFAA',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(_endEl);
  }

  function showHUD() {
    if (_hud) _hud.style.display = 'block';
    updateHUD();
  }

  function hideHUD() {
    if (_hud) _hud.style.display = 'none';
  }

  function updateHUD() {
    if (!_hud || _hud.style.display === 'none') return;

    var mins = Math.floor(Math.max(0, _missileCountdown) / 60);
    var secs = Math.floor(Math.max(0, _missileCountdown) % 60);
    var timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;

    /* Urgency color */
    var timeColor = _missileCountdown > 60 ? '#00FFCC' :
                    (_missileCountdown > 30 ? '#FFAA00' : '#FF2200');

    var siloStr = _silosDisabled + '/' + SILO_COUNT;
    var hullStr = _hullBreach
      ? ('BREACHED! Seal in: ' + Math.ceil(_hullBreachTimer) + 's')
      : (_hullIntegrity + '%');
    var bossStr = _boss && _boss.alive
      ? ('VORONOV: ' + _boss.hp + '/' + _boss.maxHp)
      : 'VORONOV: ELIMINATED';

    _hud.innerHTML =
      '<span style="color:' + timeColor + '">MISSILES T-' + timeStr + '</span>' +
      '  |  SILOS DISABLED: ' + siloStr +
      '  |  HULL: ' + hullStr +
      '  |  HP: ' + _playerHP + '/' + _playerMaxHP +
      '  |  ' + bossStr;
  }

  function showMessage(txt, dur) {
    if (!_messageEl) return;
    _messageEl.textContent = txt;
    _messageEl.style.display = 'block';
    _messageTimer = dur || 3500;
  }

  function showEndScreen(success, txt) {
    if (!_endEl) return;
    _endEl.style.color      = success ? '#00FFAA' : '#FF4444';
    _endEl.style.border     = '2px solid ' + (success ? '#00FFAA' : '#FF4444');
    _endEl.style.textShadow = '0 0 12px ' + (success ? '#00FFAA' : '#FF4444');
    _endEl.textContent      = txt;
    _endEl.style.display    = 'block';
    hideHUD();
    if (_messageEl) _messageEl.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LAUNCH
  ══════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) return;
    _active          = true;
    _missionComplete = false;
    _missionFailed   = false;

    /* Reset counters */
    _missileCountdown = MISSILE_COUNTDOWN_TOTAL;
    _silosDisabled    = 0;
    _siloHits         = [0, 0, 0, 0];
    _siloDisabled     = [false, false, false, false];
    _hullBreach       = false;
    _hullBreachTimer  = 30;
    _hullIntegrity    = 100;
    _ventCooldowns    = [0, 0, 0];
    _torpedoTubeLoaded = [true, true, false, true];
    _playerHP         = 100;
    _playerPos        = { x: 20, y: 1.7, z: 0 };
    _playerYaw        = Math.PI;
    _playerPitch      = 0;
    _shootCooldown    = 0;
    _bullets          = [];
    _torpedoes        = [];
    _explosions       = [];
    _bossPhase        = 0;
    _redAlertTimer    = 0;
    _lastTime         = 0;
    _messageTimer     = 0;

    /* Save scene state */
    _savedBackground = _scene.background ? _scene.background.clone() : null;
    _savedFog        = _scene.fog || null;
    _scene.background = new THREE.Color(0x000a14);
    _scene.fog        = new THREE.FogExp2(0x000a14, 0.018);

    /* Ambient light */
    var amb = new THREE.AmbientLight(0x112233, 0.7);
    amb.name = '_sh_ambient';
    _scene.add(amb);

    /* Build submarine world */
    _subGroup = new THREE.Group();
    _subGroup.name = '_sh_sub';
    _subGroup.position.set(0, -2, 0);

    _exteriorGroup    = buildExterior();
    _torpedoRoomGroup = buildTorpedoRoom();
    _engineRoomGroup  = buildEngineRoom();
    _controlRoomGroup = buildControlRoom();
    _missileBayGroup  = buildMissileBay();
    _commanderCabinGroup = buildCommanderCabin();

    _subGroup.add(_exteriorGroup);
    _subGroup.add(_torpedoRoomGroup);
    _subGroup.add(_engineRoomGroup);
    _subGroup.add(_controlRoomGroup);
    _subGroup.add(_missileBayGroup);
    _subGroup.add(_commanderCabinGroup);
    _scene.add(_subGroup);

    /* Spawn enemies */
    spawnEnemies();

    /* Camera initial position */
    if (_camera) {
      _camera.position.set(
        _playerPos.x,
        _playerPos.y + 0.3,
        _playerPos.z
      );
      _camera.rotation.set(0, _playerYaw, 0, 'YXZ');
    }

    showHUD();
    showMessage('BOARDING PARTY — Disable all 4 missile silos before T=0:00! [S+U to activate]', 5000);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SHOOTING
  ══════════════════════════════════════════════════════════════════════════ */

  function shootBullet() {
    if (!_active || _shootCooldown > 0) return;
    _shootCooldown = SHOOT_INTERVAL;

    /* Direction from player yaw + pitch */
    var cosP = Math.cos(_playerPitch);
    var dx = -Math.sin(_playerYaw) * cosP;
    var dy = Math.sin(_playerPitch);
    var dz = -Math.cos(_playerYaw) * cosP;

    var bMesh = buildBulletMesh(true);
    bMesh.position.set(
      _playerPos.x + dx * 0.5,
      _playerPos.y + 0.1,
      _playerPos.z + dz * 0.5
    );
    var speed = 40;
    _scene.add(bMesh);
    _bullets.push({
      mesh:     bMesh,
      vel:      { x: dx * speed, y: dy * speed, z: dz * speed },
      life:     1.5,
      friendly: true
    });
  }

  /* ── Enemy fires at player ────────────────────────────────────────────── */
  function enemyShoot(enemy) {
    var ex = enemy.pos.x;
    var ey = enemy.pos.y;
    var ez = enemy.pos.z;
    var tx = _playerPos.x - ex;
    var ty = (_playerPos.y - ey);
    var tz = _playerPos.z - ez;
    var len = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
    tx /= len; ty /= len; tz /= len;

    var eMesh = buildBulletMesh(false);
    eMesh.position.set(ex + tx * 0.6, ey + 0.3, ez + tz * 0.6);
    var speed = 20;
    _scene.add(eMesh);
    _bullets.push({
      mesh:     eMesh,
      vel:      { x: tx * speed, y: ty * speed, z: tz * speed },
      life:     2.0,
      friendly: false
    });
  }

  /* ── Boss fires auto-torpedo (phase 2) ────────────────────────────────── */
  function bossFireTorpedo() {
    if (!_boss || !_boss.alive) return;
    var bx = _boss.pos.x;
    var bz = _boss.pos.z;
    var tx = _playerPos.x - bx;
    var tz = _playerPos.z - bz;
    var len = Math.sqrt(tx * tx + tz * tz) || 1;
    tx /= len; tz /= len;

    var torpGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 6);
    var torpMat = new THREE.MeshLambertMaterial({ color: 0xFF2200 });
    var tMesh = new THREE.Mesh(torpGeo, torpMat);
    tMesh.rotation.z = Math.PI / 2;
    tMesh.position.set(bx + tx, _boss.pos.y, bz + tz);
    _scene.add(tMesh);

    _torpedoes.push({
      mesh: tMesh,
      vel:  { x: tx * 12, z: tz * 12 },
      life: 3.0,
      aoe:  5
    });
  }

  /* ── Torpedo tube explosion (AOE) ─────────────────────────────────────── */
  function triggerTorpedoTubeExplosion(tubeIndex) {
    if (tubeIndex < 0 || tubeIndex >= TORPEDO_TUBE_COUNT) return;
    if (!_torpedoTubeLoaded[tubeIndex]) return;

    _torpedoTubeLoaded[tubeIndex] = false;

    /* Update tube color to grey */
    if (_torpedoTubeMeshes[tubeIndex]) {
      _torpedoTubeMeshes[tubeIndex].material.color.setHex(0x223344);
    }

    /* Get tube world position */
    var tubePositions = [
      { x: 25 + 8, y: 1.5, z: -3 },
      { x: 25 + 8, y: 1.5, z:  3 },
      { x: 25 + 8, y: -1.5, z: -3 },
      { x: 25 + 8, y: -1.5, z:  3 }
    ];
    var tp = tubePositions[tubeIndex];
    var pos = new THREE.Vector3(tp.x, tp.y - 2, tp.z);

    buildExplosion(pos, 8);

    /* Deal AOE damage to enemies near explosion */
    for (var ei = 0; ei < _enemies.length; ei++) {
      var en = _enemies[ei];
      if (!en.alive) continue;
      var dx = en.pos.x - pos.x;
      var dz = en.pos.z - pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 8) {
        var dmg = Math.round(60 * (1 - dist / 8));
        en.hp -= dmg;
        if (en.hp <= 0) killEnemy(ei);
      }
    }

    showMessage('TORPEDO TUBE ' + (tubeIndex + 1) + ' DETONATED — 60 AoE damage!', 3000);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     COMPRESSED AIR VENT
  ══════════════════════════════════════════════════════════════════════════ */

  function activateVent(ventIndex) {
    if (ventIndex < 0 || ventIndex >= VENT_COUNT) return;
    if (_ventCooldowns[ventIndex] > 0) {
      showMessage('VENT ' + (ventIndex + 1) + ' cooling down: ' + Math.ceil(_ventCooldowns[ventIndex]) + 's', 2000);
      return;
    }
    _ventCooldowns[ventIndex] = 15;

    /* Vent world positions (engine room offset -15) */
    var ventWorldPos = [
      { x: -15 + (-6), z: -5 },
      { x: -15 +   0,  z:  6 },
      { x: -15 +   6,  z: -2 }
    ];
    var vp = ventWorldPos[ventIndex];

    /* Knockback any enemies within 7 units */
    var knockCount = 0;
    for (var ei = 0; ei < _enemies.length; ei++) {
      var en = _enemies[ei];
      if (!en.alive) continue;
      var dx = en.pos.x - vp.x;
      var dz = en.pos.z - vp.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 7) {
        /* Knockback direction away from vent */
        var len = dist || 1;
        var kbx = (dx / len) * 6;
        var kbz = (dz / len) * 6;
        en.pos.x += kbx;
        en.pos.z += kbz;
        en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
        en.knockback = 0.5;
        en.state = 'staggered';
        en.timer = 1.5;
        knockCount++;
      }
    }

    showMessage('COMPRESSED AIR VENT — ' + knockCount + ' enemies knocked back!', 2500);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     SILO PANEL HIT
  ══════════════════════════════════════════════════════════════════════════ */

  function hitSiloPanel(siloIndex) {
    if (siloIndex < 0 || siloIndex >= SILO_COUNT) return;
    if (_siloDisabled[siloIndex]) return;

    _siloHits[siloIndex]++;
    var hitsLeft = 3 - _siloHits[siloIndex];

    if (_siloHits[siloIndex] >= 3) {
      /* Silo disabled! */
      _siloDisabled[siloIndex] = true;
      _silosDisabled++;

      /* Turn silo panel red */
      if (_siloPanelMeshes[siloIndex]) {
        _siloPanelMeshes[siloIndex].material.color.setHex(0x660000);
      }

      /* Dim the countdown display */
      if (_countdownDisplays[siloIndex]) {
        _countdownDisplays[siloIndex].material.color.setHex(0x330000);
      }

      showMessage('SILO ' + (siloIndex + 1) + ' DISABLED! (' + _silosDisabled + '/' + SILO_COUNT + ')', 3500);

      /* Trigger explosion effect */
      var siloOffset = [-40, -40, -40, -40];
      var siloX = [siloOffset[0] + (-4), siloOffset[1] + (-4), siloOffset[2] + 4, siloOffset[3] + 4];
      var siloZ = [-5, 5, -5, 5];
      buildExplosion(new THREE.Vector3(siloX[siloIndex], 0, siloZ[siloIndex]), 3);

      checkWinCondition();
    } else {
      showMessage('SILO ' + (siloIndex + 1) + ' PANEL HIT — ' + hitsLeft + ' more hits needed', 2000);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     HULL BREACH
  ══════════════════════════════════════════════════════════════════════════ */

  function triggerHullBreach() {
    if (_hullBreach) return;
    _hullBreach      = true;
    _hullBreachTimer = 30;

    /* Show breach warnings */
    var warn = _torpedoRoomGroup ? _torpedoRoomGroup.getObjectByName('_sh_breach_warn_torpedo') : null;
    if (warn) warn.visible = true;

    showMessage('HULL BREACH! Get to the PRESSURE HATCH (aft section) within 30 seconds or take 10HP/s!', 5000);
  }

  function checkPressureHatch() {
    if (!_pressureHatchMesh) return;
    var hatchWorldPos = new THREE.Vector3();
    _pressureHatchMesh.getWorldPosition(hatchWorldPos);
    var dx = _playerPos.x - hatchWorldPos.x;
    var dz = _playerPos.z - hatchWorldPos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 3) {
      /* Seal the breach */
      _hullBreach      = false;
      _hullBreachTimer = 30;
      showMessage('HULL BREACH SEALED at pressure hatch!', 3000);

      var warn = _torpedoRoomGroup ? _torpedoRoomGroup.getObjectByName('_sh_breach_warn_torpedo') : null;
      if (warn) warn.visible = false;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     WIN / LOSE CONDITIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function checkWinCondition() {
    if (_missionComplete || _missionFailed) return;
    if (_silosDisabled >= SILO_COUNT && _boss && !_boss.alive) {
      _missionComplete = true;
      _active          = false;
      showEndScreen(true,
        'MISSION COMPLETE\n\nAll 4 missile silos disabled.\nAdmiral Voronov eliminated.\n\nThe world is safe — for now.\n\n[Press R to reset]'
      );
    } else if (_silosDisabled >= SILO_COUNT && _boss && _boss.alive) {
      showMessage('All silos disabled! Eliminate Admiral Voronov to complete mission!', 4000);
    } else if (!_boss.alive && _silosDisabled < SILO_COUNT) {
      showMessage('Voronov down! Disable remaining silos! (' + _silosDisabled + '/' + SILO_COUNT + ')', 4000);
    }
  }

  function missionFail(reason) {
    if (_missionFailed || _missionComplete) return;
    _missionFailed = true;
    _active        = false;
    showEndScreen(false, 'MISSION FAILED\n\n' + reason + '\n\n[Press R to reset]');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     KILL ENEMY
  ══════════════════════════════════════════════════════════════════════════ */

  function killEnemy(index) {
    var en = _enemies[index];
    if (!en || !en.alive) return;
    en.alive = false;
    _scene.remove(en.mesh);

    if (en.type === 'boss') {
      showMessage('ADMIRAL VORONOV ELIMINATED!', 5000);
      checkWinCondition();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RAYCASTING — hit detection for bullet vs panel/tube
  ══════════════════════════════════════════════════════════════════════════ */

  function checkBulletHitsScene(bullet) {
    /* Check against silo panels */
    for (var si = 0; si < _siloPanelMeshes.length; si++) {
      var panel = _siloPanelMeshes[si];
      if (!panel) continue;
      var panelWorld = new THREE.Vector3();
      panel.getWorldPosition(panelWorld);
      var dx = bullet.mesh.position.x - panelWorld.x;
      var dy = bullet.mesh.position.y - panelWorld.y;
      var dz = bullet.mesh.position.z - panelWorld.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.0) {
        hitSiloPanel(si);
        return true;
      }
    }

    /* Check against torpedo tube meshes */
    for (var ti = 0; ti < _torpedoTubeMeshes.length; ti++) {
      var tube = _torpedoTubeMeshes[ti];
      if (!tube) continue;
      var tubeWorld = new THREE.Vector3();
      tube.getWorldPosition(tubeWorld);
      var dx2 = bullet.mesh.position.x - tubeWorld.x;
      var dy2 = bullet.mesh.position.y - tubeWorld.y;
      var dz2 = bullet.mesh.position.z - tubeWorld.z;
      var dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + dz2 * dz2);
      if (dist2 < 1.5 && _torpedoTubeLoaded[ti]) {
        triggerTorpedoTubeExplosion(ti);
        return true;
      }
    }

    return false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INTERACT (E key)
  ══════════════════════════════════════════════════════════════════════════ */

  function interact() {
    if (!_active) return;

    /* Check proximity to air vents */
    var ventWorldOffsets = [
      { x: -21, z: -5 },
      { x: -15, z:  6 },
      { x: -9,  z: -2 }
    ];
    for (var vi = 0; vi < VENT_COUNT; vi++) {
      var vw = ventWorldOffsets[vi];
      var dx = _playerPos.x - vw.x;
      var dz = _playerPos.z - vw.z;
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        activateVent(vi);
        return;
      }
    }

    /* Check proximity to hull breach locations */
    if (_hullIntegrity < 100) {
      checkPressureHatch();
    }

    showMessage('[E] Nothing interactive nearby', 1500);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY AI UPDATE
  ══════════════════════════════════════════════════════════════════════════ */

  function updateEnemyAI(en, dt) {
    if (!en.alive) return;

    var dx = _playerPos.x - en.pos.x;
    var dz = _playerPos.z - en.pos.z;
    var distToPlayer = Math.sqrt(dx * dx + dz * dz);
    var dirX = distToPlayer > 0 ? dx / distToPlayer : 0;
    var dirZ = distToPlayer > 0 ? dz / distToPlayer : 0;

    /* Update knockback */
    if (en.knockback > 0) {
      en.knockback -= dt;
    }

    en.timer -= dt;

    /* Staggered: skip AI for duration */
    if (en.state === 'staggered') {
      if (en.timer <= 0) {
        en.state = 'alert';
        en.timer = 2;
      }
      en.mesh.position.set(en.pos.x, en.pos.y, en.pos.z);
      return;
    }

    /* State machine */
    if (distToPlayer < 18) {
      en.state = 'alert';
    }

    if (en.state === 'idle' && en.timer <= 0) {
      /* Wander randomly */
      en.yaw += (Math.random() - 0.5) * 1.5;
      en.timer = 1.5 + Math.random() * 2;
    }

    if (en.state === 'patrol') {
      /* SF patrol moves toward sub hatch */
      en.pos.x += Math.sin(en.yaw) * 2.5 * dt;
      en.pos.z += Math.cos(en.yaw) * 2.5 * dt;
      if (en.timer <= 0) {
        en.yaw = Math.atan2(dx, dz);
        en.timer = 1.5;
      }
    }

    if (en.state === 'alert') {
      /* Chase player */
      var speed = (en.type === 'special_forces') ? 4.0 : 2.8;
      if (en.type === 'boss') speed = 2.0;

      if (distToPlayer > 3) {
        en.pos.x += dirX * speed * dt;
        en.pos.z += dirZ * speed * dt;
      }

      /* Face player */
      en.yaw = Math.atan2(dx, dz);

      /* Shoot timer */
      en.shootTimer -= dt;
      if (en.shootTimer <= 0 && distToPlayer < 20) {
        var shotInterval = (en.type === 'crew') ? 1.2 : (en.type === 'special_forces') ? 0.9 : 1.8;
        en.shootTimer = shotInterval + Math.random() * 0.5;
        enemyShoot(en);

        /* Boss phase 2: also fire torpedo */
        if (en.type === 'boss' && _bossPhase >= 1) {
          if (Math.random() < 0.4) {
            bossFireTorpedo();
          }
        }
      }

      /* Melee if too close (crew shotgun) */
      if (distToPlayer < 2 && en.type === 'crew') {
        en.shootTimer = 0.6;
        _playerHP -= 8;
        if (_playerHP <= 0) {
          _playerHP = 0;
          missionFail('You were killed in the submarine compartments.');
          return;
        }
      }
    }

    /* Clamp inside sub (rough bounds) */
    en.pos.x = Math.max(-50, Math.min(46, en.pos.x));
    en.pos.z = Math.max(-8,  Math.min(8,  en.pos.z));

    /* Update mesh position and rotation */
    en.mesh.position.set(en.pos.x, en.pos.y - 2, en.pos.z);
    en.mesh.rotation.y = en.yaw;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ══════════════════════════════════════════════════════════════════════════ */

  function update(now) {
    if (!_active) return;

    if (_lastTime === 0) { _lastTime = now; return; }
    var dt = Math.min((now - _lastTime) / 1000, 0.1);
    _lastTime = now;

    /* ── Message timer ──────────────────────────────────────────────────── */
    if (_messageTimer > 0) {
      _messageTimer -= dt * 1000;
      if (_messageTimer <= 0) {
        _messageTimer = 0;
        if (_messageEl) _messageEl.style.display = 'none';
      }
    }

    /* ── Missile countdown ──────────────────────────────────────────────── */
    _missileCountdown -= dt;
    if (_missileCountdown <= 0) {
      _missileCountdown = 0;
      /* Count remaining active silos */
      var activeSilos = 0;
      for (var si = 0; si < SILO_COUNT; si++) {
        if (!_siloDisabled[si]) activeSilos++;
      }
      if (activeSilos > 0) {
        missionFail(activeSilos + ' missile(s) launched! Nuclear strike inbound!');
        return;
      }
    }

    /* ── Red alert pulsing when countdown < 30s ─────────────────────────── */
    if (_redAlertLight) {
      if (_missileCountdown < 30) {
        _redAlertTimer += dt * 6;
        _redAlertLight.intensity = 1.0 + Math.abs(Math.sin(_redAlertTimer)) * 2.5;
      } else {
        _redAlertLight.intensity = 0;
      }
    }

    /* ── Hull breach damage ─────────────────────────────────────────────── */
    if (_hullBreach) {
      _hullBreachTimer -= dt;
      if (_hullBreachTimer <= 0) {
        /* Inside breach zone — take damage */
        _playerHP -= 10 * dt;
        if (_playerHP <= 0) {
          _playerHP = 0;
          missionFail('Drowned in hull breach — you should have reached the pressure hatch!');
          return;
        }
      } else {
        checkPressureHatch();
      }
    }

    /* ── Shoot cooldown ─────────────────────────────────────────────────── */
    if (_shootCooldown > 0) {
      _shootCooldown -= dt;
    }

    /* ── Auto-fire when SPACE held ──────────────────────────────────────── */
    if (_keys['Space'] && _shootCooldown <= 0) {
      shootBullet();
    }

    /* ── Vent cooldowns ─────────────────────────────────────────────────── */
    for (var vi = 0; vi < VENT_COUNT; vi++) {
      if (_ventCooldowns[vi] > 0) _ventCooldowns[vi] -= dt;
    }

    /* ── Player movement ────────────────────────────────────────────────── */
    var moveSpeed = 7;
    var fwdX = -Math.sin(_playerYaw);
    var fwdZ = -Math.cos(_playerYaw);
    var sideX = Math.cos(_playerYaw);
    var sideZ = -Math.sin(_playerYaw);

    var moveX = 0;
    var moveZ = 0;
    if (_keys['KeyW']) { moveX += fwdX; moveZ += fwdZ; }
    if (_keys['KeyS'] && !_keys['KeyU']) { moveX -= fwdX; moveZ -= fwdZ; }
    if (_keys['KeyA']) { moveX -= sideX; moveZ -= sideZ; }
    if (_keys['KeyD']) { moveX += sideX; moveZ += sideZ; }

    var movLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (movLen > 0) {
      moveX /= movLen;
      moveZ /= movLen;
      _playerPos.x += moveX * moveSpeed * dt;
      _playerPos.z += moveZ * moveSpeed * dt;
    }

    /* Clamp player within sub bounds */
    _playerPos.x = Math.max(-49, Math.min(45, _playerPos.x));
    _playerPos.z = Math.max(-7.5, Math.min(7.5, _playerPos.z));

    /* ── Mouse look ─────────────────────────────────────────────────────── */
    _playerYaw   -= _mouseMovX * 0.0025;
    _playerPitch -= _mouseMovY * 0.0025;
    _playerPitch  = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, _playerPitch));
    _mouseMovX    = 0;
    _mouseMovY    = 0;

    /* ── Camera follows player ──────────────────────────────────────────── */
    if (_camera) {
      _camera.position.set(_playerPos.x, _playerPos.y + 0.3, _playerPos.z);
      _camera.rotation.order = 'YXZ';
      _camera.rotation.y = _playerYaw;
      _camera.rotation.x = _playerPitch;
    }

    /* ── Bullet update ──────────────────────────────────────────────────── */
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var blt = _bullets[bi];
      blt.life -= dt;
      if (blt.life <= 0) {
        _scene.remove(blt.mesh);
        _bullets.splice(bi, 1);
        continue;
      }

      blt.mesh.position.x += blt.vel.x * dt;
      blt.mesh.position.y += blt.vel.y * dt;
      blt.mesh.position.z += blt.vel.z * dt;

      if (blt.friendly) {
        /* Check hits vs enemies */
        var hitEnemy = false;
        for (var ei = 0; ei < _enemies.length; ei++) {
          var en = _enemies[ei];
          if (!en.alive) continue;
          var bdx = blt.mesh.position.x - en.pos.x;
          var bdy = blt.mesh.position.y - (en.pos.y - 2);
          var bdz = blt.mesh.position.z - en.pos.z;
          var bdist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz);
          if (bdist < 1.2) {
            /* Hit! */
            var dmg = (en.type === 'boss') ? 18 : 22;
            en.hp -= dmg;
            en.state = 'alert';
            if (en.hp <= 0) {
              killEnemy(ei);
            } else if (en.type === 'boss' && !en.phaseTwo && en.hp < en.maxHp * 0.5) {
              /* Boss phase 2 trigger */
              en.phaseTwo = true;
              _bossPhase  = 1;
              showMessage('VORONOV activates AUTO-TORPEDO DEFENSE SYSTEM!', 4000);
            }
            _scene.remove(blt.mesh);
            _bullets.splice(bi, 1);
            hitEnemy = true;
            break;
          }
        }
        if (hitEnemy) continue;

        /* Check hits vs scene objects */
        if (checkBulletHitsScene(blt)) {
          _scene.remove(blt.mesh);
          _bullets.splice(bi, 1);
          continue;
        }

      } else {
        /* Enemy bullet — check vs player */
        var pdx = blt.mesh.position.x - _playerPos.x;
        var pdy = blt.mesh.position.y - _playerPos.y;
        var pdz = blt.mesh.position.z - _playerPos.z;
        var pdist = Math.sqrt(pdx * pdx + pdy * pdy + pdz * pdz);
        if (pdist < 0.8) {
          _playerHP -= 12;
          _scene.remove(blt.mesh);
          _bullets.splice(bi, 1);
          if (_playerHP <= 0) {
            _playerHP = 0;
            missionFail('You were shot and killed aboard the submarine.');
            return;
          }
          continue;
        }
      }
    }

    /* ── Enemy torpedoes ────────────────────────────────────────────────── */
    for (var trpi = _torpedoes.length - 1; trpi >= 0; trpi--) {
      var trp = _torpedoes[trpi];
      trp.life -= dt;
      if (trp.life <= 0) {
        _scene.remove(trp.mesh);
        _torpedoes.splice(trpi, 1);
        continue;
      }

      trp.mesh.position.x += trp.vel.x * dt;
      trp.mesh.position.z += trp.vel.z * dt;

      /* Check vs player */
      var tpdx = trp.mesh.position.x - _playerPos.x;
      var tpdz = trp.mesh.position.z - _playerPos.z;
      var tpdist = Math.sqrt(tpdx * tpdx + tpdz * tpdz);
      if (tpdist < 1.5) {
        buildExplosion(trp.mesh.position.clone(), trp.aoe || 5);
        _scene.remove(trp.mesh);
        _torpedoes.splice(trpi, 1);
        _playerHP -= 35;
        showMessage('TORPEDO HIT! HP: ' + Math.max(0, _playerHP), 2000);
        if (_playerHP <= 0) {
          _playerHP = 0;
          missionFail('You were destroyed by Admiral Voronov\'s torpedo defense system.');
          return;
        }
        continue;
      }
    }

    /* ── Explosion particles ────────────────────────────────────────────── */
    for (var xi = _explosions.length - 1; xi >= 0; xi--) {
      var exp = _explosions[xi];
      exp.life -= dt;
      var frac = exp.life;
      exp.mesh.scale.setScalar(1 + (1 - frac) * 2.5);
      exp.mesh.material.opacity = frac * 0.9;
      exp.light.intensity = 3 * frac;
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _scene.remove(exp.light);
        _explosions.splice(xi, 1);
      }
    }

    /* ── Enemy AI ───────────────────────────────────────────────────────── */
    for (var aii = 0; aii < _enemies.length; aii++) {
      updateEnemyAI(_enemies[aii], dt);
    }

    /* ── Countdown display flicker ──────────────────────────────────────── */
    for (var cdi = 0; cdi < _countdownDisplays.length; cdi++) {
      if (_siloDisabled[cdi]) continue;
      var urgency = _missileCountdown / MISSILE_COUNTDOWN_TOTAL;
      var col = urgency > 0.5 ? 0xFF4400 : (urgency > 0.25 ? 0xFF8800 : 0xFF0000);
      _countdownDisplays[cdi].material.color.setHex(col);
    }

    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     KEY HANDLERS
  ══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keysPrev[e.code] = _keys[e.code];
    _keys[e.code]     = true;

    /* ── S then U activation (within 400ms) ─────────────────────────────── */
    if (e.code === 'KeyS') { _keyPressTimes.KeyS = Date.now(); }
    if (e.code === 'KeyU') { _keyPressTimes.KeyU = Date.now(); }
    if ((e.code === 'KeyS' || e.code === 'KeyU') && !_active) {
      var gap = Math.abs(_keyPressTimes.KeyS - _keyPressTimes.KeyU);
      if (gap <= ACTIVATE_WINDOW && _keyPressTimes.KeyS > 0 && _keyPressTimes.KeyU > 0) {
        launch();
        _keyPressTimes.KeyS = 0;
        _keyPressTimes.KeyU = 0;
      }
    }

    if (!_active) return;

    /* ── Space: single shot on keydown (held handled in update) ────────── */
    if (e.code === 'Space') {
      e.preventDefault();
      shootBullet();
    }

    /* ── E: interact ─────────────────────────────────────────────────────── */
    if (e.code === 'KeyE') {
      interact();
    }

    /* ── F: use nearest vent ─────────────────────────────────────────────── */
    if (e.code === 'KeyF') {
      var ventWorldOffsets2 = [
        { x: -21, z: -5 },
        { x: -15, z:  6 },
        { x: -9,  z: -2 }
      ];
      var nearestVent = -1;
      var nearestDist = 6;
      for (var fvi = 0; fvi < VENT_COUNT; fvi++) {
        var fvw = ventWorldOffsets2[fvi];
        var fvdx = _playerPos.x - fvw.x;
        var fvdz = _playerPos.z - fvw.z;
        var fvdist = Math.sqrt(fvdx * fvdx + fvdz * fvdz);
        if (fvdist < nearestDist) {
          nearestDist = fvdist;
          nearestVent = fvi;
        }
      }
      if (nearestVent >= 0) {
        activateVent(nearestVent);
      } else {
        showMessage('[F] No air vent in range (must be within 6 units)', 2000);
      }
    }

    /* ── R: reset when game over ─────────────────────────────────────────── */
    if (e.code === 'KeyR' && (_missionComplete || _missionFailed)) {
      reset();
    }
  }

  function onKeyUp(e) {
    _keysPrev[e.code] = _keys[e.code];
    _keys[e.code]     = false;
  }

  function onMouseMove(e) {
    if (!_active) return;
    _mouseMovX += e.movementX || 0;
    _mouseMovY += e.movementY || 0;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0) {
      shootBullet();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     RESET
  ══════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active        = false;
    _missionComplete = false;
    _missionFailed   = false;

    /* Remove submarine world */
    if (_subGroup) {
      _scene.remove(_subGroup);
      _subGroup = null;
    }
    _exteriorGroup       = null;
    _torpedoRoomGroup    = null;
    _engineRoomGroup     = null;
    _controlRoomGroup    = null;
    _missileBayGroup     = null;
    _commanderCabinGroup = null;
    _siloPanelMeshes     = [];
    _ventMeshes          = [];
    _torpedoTubeMeshes   = [];
    _countdownDisplays   = [];
    _hatchMesh           = null;
    _pressureHatchMesh   = null;
    _redAlertLight       = null;

    /* Remove enemies */
    for (var ei = 0; ei < _enemies.length; ei++) {
      if (_enemies[ei].mesh) _scene.remove(_enemies[ei].mesh);
    }
    _enemies = [];
    _boss    = null;

    /* Remove bullets / torpedoes / explosions */
    for (var bi = 0; bi < _bullets.length; bi++) {
      _scene.remove(_bullets[bi].mesh);
    }
    _bullets = [];

    for (var ti = 0; ti < _torpedoes.length; ti++) {
      _scene.remove(_torpedoes[ti].mesh);
    }
    _torpedoes = [];

    for (var xi = 0; xi < _explosions.length; xi++) {
      _scene.remove(_explosions[xi].mesh);
      _scene.remove(_explosions[xi].light);
    }
    _explosions = [];

    /* Remove ambient */
    var shAmb = _scene.getObjectByName('_sh_ambient');
    if (shAmb) _scene.remove(shAmb);

    /* Restore scene */
    if (_savedBackground !== null) { _scene.background = _savedBackground; }
    if (_savedFog        !== null) { _scene.fog        = _savedFog; }
    _savedBackground = null;
    _savedFog        = null;

    /* Hide HUD */
    hideHUD();
    if (_messageEl) _messageEl.style.display = 'none';
    if (_endEl)     _endEl.style.display     = 'none';

    /* Reset state */
    _lastTime         = 0;
    _messageTimer     = 0;
    _keys             = {};
    _keysPrev         = {};
    _mouseMovX        = 0;
    _mouseMovY        = 0;
    _missileCountdown = MISSILE_COUNTDOWN_TOTAL;
    _silosDisabled    = 0;
    _siloHits         = [0, 0, 0, 0];
    _siloDisabled     = [false, false, false, false];
    _hullBreach       = false;
    _hullIntegrity    = 100;
    _bossPhase        = 0;
    _playerHP         = 100;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;
    _keys      = {};
    _keysPrev  = {};
    _keyPressTimes = { KeyS: 0, KeyU: 0 };

    createHUD();

    window.addEventListener('keydown',   onKeyDown);
    window.addEventListener('keyup',     onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
  }

  function publicUpdate(now) {
    update(now);
  }

  function publicReset() {
    reset();
  }

  return {
    init:   init,
    update: publicUpdate,
    reset:  publicReset
  };

}());
