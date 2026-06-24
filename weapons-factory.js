/* ───────────────────────────────────────────────────────────────────────────
   weapons-factory.js — Infiltrate & Destroy Illegal Weapons Manufacturing Plant
   API: window.WeaponsFactory = { init, update, reset }
   Activation: W then F within 400ms
   Controls:
     WASD            → move player
     Mouse           → look
     Click           → shoot
     E (3s hold)     → arm weapon crate / activate terminal / drive crane
     R               → interact with override terminal (opens blast doors)
   Objectives:
     1. Arm all 6 weapon crates in loading bay (E 3s each)
     2. Kill Director Steele on executive mezzanine
     3. Escape loading bay before 90s detonation timer expires
   ─────────────────────────────────────────────────────────────────────────── */
window.WeaponsFactory = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key combo tracking ────────────────────────────────────── */
  var _wPressTime  = 0;
  var _fPressTime  = 0;
  var COMBO_WINDOW = 0.4;

  /* ── Module state ──────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionComplete = false;
  var _missionFailed   = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerPos    = null;   // THREE.Vector3
  var _playerHP     = 100;
  var _playerGroup  = null;
  var _keys         = {};
  var _moveSpeed    = 8;
  var _yaw          = 0;
  var _pitch        = 0;
  var _lastTime     = 0;

  /* ── Mouse look ────────────────────────────────────────────────────────── */
  var _mouseSensitivity = 0.002;
  var _pointerLocked    = false;

  /* ── Shooting ──────────────────────────────────────────────────────────── */
  var _bullets      = [];
  var _bulletSpeed  = 40;
  var _shootCooldown = 0;
  var SHOOT_RATE    = 0.12;

  /* ── Objectives ────────────────────────────────────────────────────────── */
  var _cratesArmed    = 0;
  var _crateObjects   = [];   // { mesh, armed, arming, armProgress, charge }
  var _steeleDefeated = false;
  var _escapeActive   = false;
  var _escapeTimer    = 90;
  var _escaped        = false;

  /* ── Lockdown system ───────────────────────────────────────────────────── */
  var _alarmTriggered   = false;
  var _lockdownSections = [false, false, false];  // 3 sections
  var _blastDoors       = [];     // 3 blast door meshes
  var _blastDoorY       = [];     // current Y slide positions
  var _blastDoorTarget  = [];     // target Y positions (closed vs open)
  var _overrideTerminals = [];    // { mesh, section, activating, progress }
  var BLAST_DOOR_CLOSED_Y = 2.5;
  var BLAST_DOOR_OPEN_Y   = 7.5;

  /* ── Blast furnaces ────────────────────────────────────────────────────── */
  var _furnaces      = [];   // { mesh, light, pulseT }
  var _furnaceHeat   = false;
  var _furnaceWarning = false;
  var FURNACE_DAMAGE_DIST = 6;
  var FURNACE_HP_PER_SEC  = 15;

  /* ── Crane ─────────────────────────────────────────────────────────────── */
  var _craneGroup     = null;
  var _craneMesh      = null;
  var _cranePayload   = null;     // hanging crate
  var _craneControl   = null;     // control panel mesh
  var _craneDriven    = false;
  var _craneFired     = false;
  var _cranePayloadFalling = false;
  var _cranePayloadVelY    = 0;
  var _cranePayloadPos     = null; // THREE.Vector3

  /* ── Enemies ───────────────────────────────────────────────────────────── */
  var _guards    = [];   // 12 factory guards
  var _workers   = [];   // 7 production workers
  var _steele    = null; // Director Steele boss object
  var _reinforcements = []; // 4 boss reinforcements (spawn at 50%)
  var _steeleReinforced = false;

  /* ── Director Steele weapon ────────────────────────────────────────────── */
  var _steeleShotTimer   = 0;
  var STEELE_SHOT_RATE   = 8;
  var _energyBolts       = []; // { mesh, vel, damage }

  /* ── Environment meshes ────────────────────────────────────────────────── */
  var _factoryGroup   = null;
  var _conveyorBelts  = [];
  var _assemblyProps  = [];
  var _qualityLabMeshes = [];
  var _mezzanineMeshes  = [];
  var _truckMeshes      = [];
  var _moltenParticles  = [];

  /* ── Ambient lighting ──────────────────────────────────────────────────── */
  var _ambientLight   = null;
  var _alarmLights    = [];   // red flash lights
  var _alarmFlashT    = 0;

  /* ── Interaction ───────────────────────────────────────────────────────── */
  var _interactKey      = false;
  var _interactHeld     = 0;
  var _interactTarget   = null;   // current nearby interactable object
  var INTERACT_RANGE    = 3.5;
  var INTERACT_HOLD_TIME = 3.0;

  /* ── HUD element ───────────────────────────────────────────────────────── */
  var _hud = null;

  /* ── Debris / effects ──────────────────────────────────────────────────── */
  var _explosionParticles = [];
  var _flashEffects       = [];

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY / MATERIAL HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function makeMesh(geo, color, opts) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts && opts.emissive) { mat.emissive = new THREE.Color(opts.emissive); }
    if (opts && opts.wireframe) { mat.wireframe = true; }
    var m = new THREE.Mesh(geo, mat);
    if (opts && opts.transparent) {
      mat.transparent = true;
      mat.opacity = opts.opacity !== undefined ? opts.opacity : 0.7;
    }
    return m;
  }

  function makeBox(w, h, d, color, opts) {
    return makeMesh(new THREE.BoxGeometry(w, h, d), color, opts);
  }

  function makeCyl(rt, rb, h, segs, color, opts) {
    return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), color, opts);
  }

  function makeSphere(r, wSegs, hSegs, color, opts) {
    return makeMesh(new THREE.SphereGeometry(r, wSegs || 8, hSegs || 6), color, opts);
  }

  function makeCone(r, h, segs, color, opts) {
    return makeMesh(new THREE.ConeGeometry(r, h, segs || 8), color, opts);
  }

  function makeLineSegs(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    var i;
    for (i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENVIRONMENT BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    _factoryGroup = new THREE.Group();

    buildFactoryFloor();
    buildWalls();
    buildOverheadCranes();
    buildAssemblyLines();
    buildBlastFurnaces();
    buildQualityControlLab();
    buildExecutiveMezzanine();
    buildLoadingBay();
    buildBlastDoors();
    buildOverrideTerminals();
    buildSemiTrucks();

    _scene.add(_factoryGroup);
  }

  function buildFactoryFloor() {
    /* Massive open floor */
    var floor = makeBox(100, 0.4, 80, 0x333333);
    floor.position.set(0, -0.2, 0);
    _factoryGroup.add(floor);

    /* Ceiling */
    var ceiling = makeBox(100, 0.4, 80, 0x2a2a2a);
    ceiling.position.set(0, 14, 0);
    _factoryGroup.add(ceiling);

    /* Industrial floor markings — yellow stripe lines */
    var i, stripe;
    for (i = 0; i < 5; i++) {
      stripe = makeBox(0.3, 0.05, 60, 0xddaa00);
      stripe.position.set(-20 + i * 10, 0.01, -5);
      _factoryGroup.add(stripe);
    }

    /* Drain grates in floor */
    var g;
    for (g = 0; g < 6; g++) {
      var grate = makeBox(1.5, 0.05, 1.5, 0x222222, { wireframe: true });
      grate.position.set(-25 + g * 10, 0.02, 10);
      _factoryGroup.add(grate);
    }
  }

  function buildWalls() {
    /* Perimeter walls */
    var wallMat = 0x3a3a3a;
    /* North wall */
    var wn = makeBox(100, 14, 1.5, wallMat);
    wn.position.set(0, 7, -40);
    _factoryGroup.add(wn);
    /* South wall */
    var ws = makeBox(100, 14, 1.5, wallMat);
    ws.position.set(0, 7, 40);
    _factoryGroup.add(ws);
    /* East wall */
    var we = makeBox(1.5, 14, 80, wallMat);
    we.position.set(50, 7, 0);
    _factoryGroup.add(we);
    /* West wall */
    var ww = makeBox(1.5, 14, 80, wallMat);
    ww.position.set(-50, 7, 0);
    _factoryGroup.add(ww);

    /* Support pillars */
    var p, px, pz;
    var pillarPositions = [
      [-35, 0, -20], [-35, 0, 20], [-10, 0, -20], [-10, 0, 20],
      [15, 0, -20],  [15, 0, 20],  [40, 0, -20],  [40, 0, 20]
    ];
    for (p = 0; p < pillarPositions.length; p++) {
      var pillar = makeBox(2, 14, 2, 0x444444);
      pillar.position.set(pillarPositions[p][0], 7, pillarPositions[p][2]);
      _factoryGroup.add(pillar);
    }

    /* Wall-mounted alarm lights (for red flash on alarm) */
    var al, alightMesh;
    var alarmPositions = [[-30, 11, -39], [0, 11, -39], [30, 11, -39],
                          [-30, 11, 39],  [0, 11, 39],  [30, 11, 39]];
    for (al = 0; al < alarmPositions.length; al++) {
      alightMesh = makeCyl(0.3, 0.3, 0.5, 8, 0x880000);
      alightMesh.position.set(alarmPositions[al][0], alarmPositions[al][1], alarmPositions[al][2]);
      _factoryGroup.add(alightMesh);

      var alPt = new THREE.PointLight(0xff0000, 0, 20);
      alPt.position.set(alarmPositions[al][0], alarmPositions[al][1], alarmPositions[al][2]);
      _scene.add(alPt);
      _alarmLights.push(alPt);
    }
  }

  function buildOverheadCranes() {
    /* Two overhead crane tracks running along ceiling */
    var trackColor = 0x555566;

    /* Track rails */
    var t;
    for (t = 0; t < 2; t++) {
      var rail = makeBox(90, 0.6, 0.6, trackColor);
      rail.position.set(0, 13.5, -15 + t * 30);
      _factoryGroup.add(rail);
    }

    /* Cross beams connecting tracks */
    var b;
    for (b = 0; b < 4; b++) {
      var beam = makeBox(1.2, 0.8, 32, trackColor);
      beam.position.set(-30 + b * 20, 13.2, 0);
      _factoryGroup.add(beam);
    }

    /* Main driveable crane — positioned at beam B (index 1) */
    _craneGroup = new THREE.Group();
    _craneMesh = makeBox(18, 1.2, 2.5, 0x4455aa);
    _craneGroup.add(_craneMesh);

    /* Crane hoist housing */
    var hoist = makeBox(3, 1.5, 2, 0x334499);
    hoist.position.set(0, -1.2, 0);
    _craneGroup.add(hoist);

    /* Cable from hoist to payload — LineSegments */
    var cablePoints = [
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, -6, 0)
    ];
    var cable = makeLineSegs(cablePoints, 0x888888);
    _craneGroup.add(cable);

    /* Payload crate hanging from crane */
    _cranePayload = makeBox(2.5, 2.5, 2.5, 0x886644);
    _cranePayload.position.set(0, -8, 0);
    _craneGroup.add(_cranePayload);
    _cranePayloadPos = new THREE.Vector3(0, 6, 0);

    _craneGroup.position.set(-10, 13.8, -1);
    _factoryGroup.add(_craneGroup);

    /* Crane control panel on ground level */
    _craneControl = makeBox(1, 1.5, 0.5, 0x334466);
    _craneControl.position.set(-10, 0.75, 5);
    _craneControl.userData.type = 'crane_control';
    _factoryGroup.add(_craneControl);

    /* Side cables of crane (decorative LineSegments) */
    var sidePoints = [
      new THREE.Vector3(-9, 13.5, -15),
      new THREE.Vector3(-10, 13.8, -1),
      new THREE.Vector3(-1, 13.5, -15),
      new THREE.Vector3(-10, 13.8, -1),
      new THREE.Vector3(-9, 13.5, 15),
      new THREE.Vector3(-10, 13.8, -1),
      new THREE.Vector3(-1, 13.5, 15),
      new THREE.Vector3(-10, 13.8, -1)
    ];
    var sideWires = makeLineSegs(sidePoints, 0x666677);
    _factoryGroup.add(sideWires);
  }

  function buildAssemblyLines() {
    /* Three conveyor belt runs with partially assembled weapon props */
    var lineConfigs = [
      { x: -30, z: -5,  dir: 'x', len: 16 },
      { x: 5,   z: -15, dir: 'x', len: 20 },
      { x: 20,  z: 5,   dir: 'z', len: 14 }
    ];
    var li, seg, i, prop;
    for (li = 0; li < lineConfigs.length; li++) {
      var cfg = lineConfigs[li];
      /* Conveyor frame */
      var frame;
      if (cfg.dir === 'x') {
        frame = makeBox(cfg.len, 0.3, 2.5, 0x3a3a3a);
        frame.position.set(cfg.x, 0.15, cfg.z);
      } else {
        frame = makeBox(2.5, 0.3, cfg.len, 0x3a3a3a);
        frame.position.set(cfg.x, 0.15, cfg.z);
      }
      _factoryGroup.add(frame);
      _conveyorBelts.push(frame);

      /* Belt surface (darker strip) */
      var belt;
      if (cfg.dir === 'x') {
        belt = makeBox(cfg.len - 0.4, 0.1, 1.8, 0x222222);
        belt.position.set(cfg.x, 0.31, cfg.z);
      } else {
        belt = makeBox(1.8, 0.1, cfg.len - 0.4, 0x222222);
        belt.position.set(cfg.x, 0.31, cfg.z);
      }
      _factoryGroup.add(belt);

      /* Leg supports every 4 units */
      var segCount = Math.floor(cfg.len / 4);
      for (seg = 0; seg <= segCount; seg++) {
        var leg;
        if (cfg.dir === 'x') {
          leg = makeBox(0.2, 0.9, 0.2, 0x444444);
          leg.position.set(cfg.x - cfg.len/2 + seg * 4, 0.0, cfg.z + 0.9);
        } else {
          leg = makeBox(0.2, 0.9, 0.2, 0x444444);
          leg.position.set(cfg.x + 0.9, 0.0, cfg.z - cfg.len/2 + seg * 4);
        }
        _factoryGroup.add(leg);
      }

      /* Partially assembled weapon props on conveyor */
      var propCount = Math.floor(cfg.len / 4);
      for (i = 0; i < propCount; i++) {
        /* Weapon body (BoxGeometry) */
        prop = makeBox(1.2, 0.4, 0.3, 0x556655);
        if (cfg.dir === 'x') {
          prop.position.set(cfg.x - cfg.len/2 + 2 + i * 4, 0.55, cfg.z);
        } else {
          prop.position.set(cfg.x, 0.55, cfg.z - cfg.len/2 + 2 + i * 4);
        }
        _factoryGroup.add(prop);
        _assemblyProps.push(prop);

        /* Barrel (CylinderGeometry) */
        var barrel = makeCyl(0.06, 0.06, 1.0, 6, 0x445544);
        barrel.rotation.z = Math.PI / 2;
        if (cfg.dir === 'x') {
          barrel.position.set(prop.position.x + 0.7, prop.position.y + 0.05, prop.position.z);
        } else {
          barrel.position.set(prop.position.x, prop.position.y + 0.05, prop.position.z + 0.7);
          barrel.rotation.x = Math.PI / 2;
          barrel.rotation.z = 0;
        }
        _factoryGroup.add(barrel);
        _assemblyProps.push(barrel);

        /* Stock component (smaller box) */
        var stock = makeBox(0.5, 0.3, 0.25, 0x443333);
        stock.position.set(prop.position.x - 0.65, prop.position.y, prop.position.z);
        _factoryGroup.add(stock);
        _assemblyProps.push(stock);
      }
    }

    /* Robotic arm assemblies over conveyor lines */
    var armPos = [[-30, 5, -8], [5, 5, -18], [20, 5, 5]];
    var a;
    for (a = 0; a < armPos.length; a++) {
      var armBase = makeCyl(0.5, 0.5, 4, 8, 0x445544);
      armBase.position.set(armPos[a][0], armPos[a][1], armPos[a][2]);
      _factoryGroup.add(armBase);

      var armElbow = makeBox(3, 0.4, 0.4, 0x334433);
      armElbow.position.set(armPos[a][0] + 1.5, armPos[a][1] + 1.5, armPos[a][2]);
      _factoryGroup.add(armElbow);

      var armTip = makeCyl(0.15, 0.15, 1.2, 6, 0x556655);
      armTip.position.set(armPos[a][0] + 3, armPos[a][1] + 1.5, armPos[a][2]);
      armTip.rotation.z = Math.PI / 2;
      _factoryGroup.add(armTip);
    }
  }

  function buildBlastFurnaces() {
    /* 2 large blast furnaces with orange point lights */
    var furnaceConfigs = [
      { x: -40, z: -25 },
      { x: -40, z: 25 }
    ];
    var fi;
    for (fi = 0; fi < furnaceConfigs.length; fi++) {
      var fc = furnaceConfigs[fi];

      /* Main furnace body */
      var body = makeCyl(4, 5, 9, 12, 0x556655);
      body.position.set(fc.x, 4.5, fc.z);
      _factoryGroup.add(body);

      /* Furnace dome top */
      var dome = makeSphere(4, 10, 6, 0x445544);
      dome.scale.y = 0.5;
      dome.position.set(fc.x, 9.5, fc.z);
      _factoryGroup.add(dome);

      /* Chimney stack */
      var chimney = makeCyl(0.8, 1.0, 5, 8, 0x444444);
      chimney.position.set(fc.x + 2, 11, fc.z);
      _factoryGroup.add(chimney);

      /* Chimney cap */
      var cap = makeCone(1.4, 0.8, 8, 0x333333);
      cap.position.set(fc.x + 2, 13.8, fc.z);
      _factoryGroup.add(cap);

      /* Molten trough leading out */
      var trough = makeBox(8, 0.4, 1.2, 0x333322);
      trough.position.set(fc.x + 8, 0.6, fc.z);
      _factoryGroup.add(trough);

      /* Glowing molten metal surface in trough */
      var molten = makeBox(7.5, 0.15, 0.9, 0xff6600, { emissive: 0xee4400, transparent: true, opacity: 0.9 });
      molten.position.set(fc.x + 8, 0.82, fc.z);
      _factoryGroup.add(molten);
      _moltenParticles.push({ mesh: molten, baseX: fc.x + 8, baseZ: fc.z, t: fi * 1.3 });

      /* Access ports on the furnace */
      var port = makeBox(1.5, 2, 0.3, 0x222211, { emissive: 0xff4400 });
      port.position.set(fc.x + 4.8, 2, fc.z);
      _factoryGroup.add(port);

      /* Orange glow point light */
      var glow = new THREE.PointLight(0xff6600, 3, 22);
      glow.position.set(fc.x, 3, fc.z);
      _scene.add(glow);

      /* Safety barrier around furnace */
      var bar1 = makeBox(12, 1, 0.3, 0xcc8800);
      bar1.position.set(fc.x, 0.5, fc.z - 7);
      _factoryGroup.add(bar1);
      var bar2 = makeBox(12, 1, 0.3, 0xcc8800);
      bar2.position.set(fc.x, 0.5, fc.z + 7);
      _factoryGroup.add(bar2);

      _furnaces.push({ mesh: body, light: glow, port: port, x: fc.x, z: fc.z, pulseT: fi * 2.1 });
    }
  }

  function buildQualityControlLab() {
    /* Enclosed room with glass walls in factory corner */
    var labX = 35, labZ = -28;

    /* Floor */
    var labFloor = makeBox(14, 0.15, 12, 0x2a3a2a);
    labFloor.position.set(labX, 0.08, labZ);
    _factoryGroup.add(labFloor);

    /* Walls (partial — door gap on south side) */
    var labWallN = makeBox(14, 5, 0.3, 0x334433, { transparent: true, opacity: 0.7 });
    labWallN.position.set(labX, 2.5, labZ - 6);
    _factoryGroup.add(labWallN);
    _qualityLabMeshes.push(labWallN);

    var labWallE = makeBox(0.3, 5, 12, 0x334433, { transparent: true, opacity: 0.7 });
    labWallE.position.set(labX + 7, 2.5, labZ);
    _factoryGroup.add(labWallE);
    _qualityLabMeshes.push(labWallE);

    var labWallW = makeBox(0.3, 5, 12, 0x334433, { transparent: true, opacity: 0.7 });
    labWallW.position.set(labX - 7, 2.5, labZ);
    _factoryGroup.add(labWallW);
    _qualityLabMeshes.push(labWallW);

    /* South wall with door gap */
    var labWallS1 = makeBox(5, 5, 0.3, 0x334433, { transparent: true, opacity: 0.7 });
    labWallS1.position.set(labX - 4.5, 2.5, labZ + 6);
    _factoryGroup.add(labWallS1);

    var labWallS2 = makeBox(5, 5, 0.3, 0x334433, { transparent: true, opacity: 0.7 });
    labWallS2.position.set(labX + 4.5, 2.5, labZ + 6);
    _factoryGroup.add(labWallS2);

    /* Lab ceiling */
    var labCeiling = makeBox(14, 0.2, 12, 0x2a3a2a);
    labCeiling.position.set(labX, 5.1, labZ);
    _factoryGroup.add(labCeiling);

    /* Lab interior — testing equipment */
    var testBench = makeBox(8, 1.0, 1.5, 0x334433);
    testBench.position.set(labX, 0.5, labZ - 3);
    _factoryGroup.add(testBench);
    _qualityLabMeshes.push(testBench);

    /* Monitor screens on bench */
    var sc, scrn;
    for (sc = 0; sc < 3; sc++) {
      scrn = makeBox(1.2, 0.8, 0.1, 0x223322, { emissive: 0x004400 });
      scrn.position.set(labX - 3 + sc * 3, 1.45, labZ - 3.7);
      _factoryGroup.add(scrn);
    }

    /* Weapon testing fixture */
    var fixture = makeBox(3, 0.6, 1, 0x3a4a3a);
    fixture.position.set(labX + 2, 1.3, labZ + 2);
    _factoryGroup.add(fixture);

    /* Clamped weapon on fixture */
    var testWeapon = makeBox(1.5, 0.35, 0.28, 0x556655);
    testWeapon.position.set(labX + 2, 1.78, labZ + 2);
    _factoryGroup.add(testWeapon);

    var testBarrel = makeCyl(0.05, 0.05, 1.3, 6, 0x445544);
    testBarrel.rotation.z = Math.PI / 2;
    testBarrel.position.set(labX + 2.8, 1.78, labZ + 2);
    _factoryGroup.add(testBarrel);

    /* Lab overhead light */
    var labLight = new THREE.PointLight(0x88ffaa, 2, 15);
    labLight.position.set(labX, 4.5, labZ);
    _scene.add(labLight);

    /* Blueprints on wall */
    var blueprint = makeBox(2, 1.5, 0.05, 0x223366, { emissive: 0x111133 });
    blueprint.position.set(labX + 6.8, 3, labZ - 3);
    blueprint.rotation.y = Math.PI / 2;
    _factoryGroup.add(blueprint);
  }

  function buildExecutiveMezzanine() {
    /* Mezzanine level — elevated platform above loading bay area */
    var mezZ = 30;

    /* Mezzanine floor slab */
    var mezFloor = makeBox(20, 0.5, 14, 0x2f2f3a);
    mezFloor.position.set(35, 7.25, mezZ);
    _factoryGroup.add(mezFloor);
    _mezzanineMeshes.push(mezFloor);

    /* Railing */
    var railColor = 0x555566;
    var rl1 = makeBox(20, 1, 0.2, railColor);
    rl1.position.set(35, 7.8, mezZ - 7);
    _factoryGroup.add(rl1);

    var rl2 = makeBox(20, 1, 0.2, railColor);
    rl2.position.set(35, 7.8, mezZ + 7);
    _factoryGroup.add(rl2);

    var rl3 = makeBox(0.2, 1, 14, railColor);
    rl3.position.set(25, 7.8, mezZ);
    _factoryGroup.add(rl3);

    /* Railing posts */
    var rp;
    for (rp = 0; rp < 6; rp++) {
      var post = makeBox(0.15, 1.2, 0.15, railColor);
      post.position.set(26 + rp * 3.5, 7.8, mezZ - 7);
      _factoryGroup.add(post);
      var post2 = makeBox(0.15, 1.2, 0.15, railColor);
      post2.position.set(26 + rp * 3.5, 7.8, mezZ + 7);
      _factoryGroup.add(post2);
    }

    /* Staircase up to mezzanine */
    var st;
    for (st = 0; st < 8; st++) {
      var step = makeBox(3, 0.3, 0.9, 0x3a3a44);
      step.position.set(26, st * 0.92 + 0.15, mezZ + 7 + st * 0.8);
      _factoryGroup.add(step);
    }

    /* Executive office furniture */
    var desk = makeBox(3.5, 0.8, 1.8, 0x4a3a2a);
    desk.position.set(40, 7.9, mezZ);
    _factoryGroup.add(desk);
    _mezzanineMeshes.push(desk);

    /* Monitor on desk */
    var mon = makeBox(1.6, 1.0, 0.1, 0x112211, { emissive: 0x003300 });
    mon.position.set(40, 8.7, mezZ - 0.8);
    _factoryGroup.add(mon);

    /* Files and blueprints stacked on desk */
    var files1 = makeBox(1, 0.1, 0.8, 0xddcc99);
    files1.position.set(38.5, 8.3, mezZ + 0.5);
    _factoryGroup.add(files1);

    var files2 = makeBox(0.9, 0.08, 0.7, 0xccbb88);
    files2.rotation.y = 0.3;
    files2.position.set(38.4, 8.38, mezZ + 0.5);
    _factoryGroup.add(files2);

    /* Blueprint roll */
    var blueroll = makeCyl(0.15, 0.15, 1.2, 6, 0x334499);
    blueroll.rotation.z = Math.PI / 2;
    blueroll.position.set(40.5, 8.35, mezZ - 0.2);
    _factoryGroup.add(blueroll);

    /* Prototype weapon display case */
    var displayCase = makeBox(2.5, 1.5, 1, 0x334433, { transparent: true, opacity: 0.5 });
    displayCase.position.set(43, 8.25, mezZ);
    _factoryGroup.add(displayCase);
    _mezzanineMeshes.push(displayCase);

    var protoWeapon = makeBox(2.0, 0.5, 0.4, 0x223322, { emissive: 0x004422 });
    protoWeapon.position.set(43, 8.25, mezZ);
    _factoryGroup.add(protoWeapon);

    /* Overhead executive lighting */
    var execLight = new THREE.PointLight(0xaaaaff, 1.5, 20);
    execLight.position.set(35, 11, mezZ);
    _scene.add(execLight);
  }

  function buildLoadingBay() {
    /* Loading bay on south-east side of factory */
    var bayX = 30, bayZ = 20;

    /* Bay floor marking */
    var bayMark = makeBox(22, 0.05, 16, 0x2a2a22);
    bayMark.position.set(bayX, 0.01, bayZ);
    _factoryGroup.add(bayMark);

    /* Loading dock raised platform */
    var dock = makeBox(22, 0.6, 4, 0x444433);
    dock.position.set(bayX, 0.3, bayZ + 8.5);
    _factoryGroup.add(dock);

    /* Bay door opening (gap in south wall — framed) */
    var doorFrameL = makeBox(0.5, 6, 2, 0x3a3a3a);
    doorFrameL.position.set(bayX - 5, 3, 39.5);
    _factoryGroup.add(doorFrameL);

    var doorFrameR = makeBox(0.5, 6, 2, 0x3a3a3a);
    doorFrameR.position.set(bayX + 5, 3, 39.5);
    _factoryGroup.add(doorFrameR);

    var doorFrameTop = makeBox(10.5, 0.5, 2, 0x3a3a3a);
    doorFrameTop.position.set(bayX, 6.25, 39.5);
    _factoryGroup.add(doorFrameTop);

    /* 6 weapon crates in two rows */
    var cratePositions = [
      { x: bayX - 7, z: bayZ + 2 },
      { x: bayX - 3, z: bayZ + 2 },
      { x: bayX + 1, z: bayZ + 2 },
      { x: bayX - 7, z: bayZ + 6 },
      { x: bayX - 3, z: bayZ + 6 },
      { x: bayX + 1, z: bayZ + 6 }
    ];
    var ci;
    for (ci = 0; ci < 6; ci++) {
      var crate = makeBox(2, 2, 2, 0x667744);
      crate.position.set(cratePositions[ci].x, 1, cratePositions[ci].z);
      /* Crate markings */
      var crateStripe = makeBox(2.05, 0.3, 0.05, 0xaacc55);
      crateStripe.position.set(cratePositions[ci].x, 1, cratePositions[ci].z + 1);
      _factoryGroup.add(crate);
      _factoryGroup.add(crateStripe);

      /* Warning marker (small box on top that turns red when armed) */
      var marker = makeBox(0.6, 0.15, 0.6, 0x888888);
      marker.position.set(cratePositions[ci].x, 2.08, cratePositions[ci].z);
      _factoryGroup.add(marker);

      _crateObjects.push({
        mesh: crate,
        marker: marker,
        armed: false,
        arming: false,
        armProgress: 0,
        pos: new THREE.Vector3(cratePositions[ci].x, 1, cratePositions[ci].z)
      });
    }

    /* Forklift parked in bay */
    var forkBody = makeBox(2.5, 1.5, 4, 0xddaa00);
    forkBody.position.set(bayX + 7, 0.75, bayZ + 3);
    _factoryGroup.add(forkBody);

    var forkMast = makeBox(0.3, 4, 0.2, 0xbbbb00);
    forkMast.position.set(bayX + 7, 2.5, bayZ + 1.2);
    _factoryGroup.add(forkMast);

    var fork1 = makeBox(1.5, 0.2, 0.3, 0xbbbb00);
    fork1.position.set(bayX + 7 - 0.5, 1.0, bayZ + 0.8);
    _factoryGroup.add(fork1);

    var fork2 = makeBox(1.5, 0.2, 0.3, 0xbbbb00);
    fork2.position.set(bayX + 7 + 0.5, 1.0, bayZ + 0.8);
    _factoryGroup.add(fork2);

    /* Bay overhead light */
    var bayLight = new THREE.PointLight(0xffffaa, 2, 25);
    bayLight.position.set(bayX, 12, bayZ);
    _scene.add(bayLight);
  }

  function buildBlastDoors() {
    /* 3 blast doors at section chokepoints — slide down when alarm triggers */
    var doorConfigs = [
      { x: -10, z: 0,   rot: 0 },       /* between furnace area and assembly */
      { x: 15,  z: -10, rot: 0 },       /* between assembly and loading bay approach */
      { x: 25,  z: 7,   rot: Math.PI/2 } /* loading bay entrance */
    ];
    var di;
    for (di = 0; di < doorConfigs.length; di++) {
      var dc = doorConfigs[di];
      var door = makeBox(8, 5, 0.5, 0x445544);
      door.position.set(dc.x, BLAST_DOOR_OPEN_Y, dc.z);
      door.rotation.y = dc.rot;
      _factoryGroup.add(door);
      _blastDoors.push(door);
      _blastDoorY.push(BLAST_DOOR_OPEN_Y);
      _blastDoorTarget.push(BLAST_DOOR_OPEN_Y);

      /* Door frame */
      var frameL = makeBox(0.5, 5.5, 0.7, 0x333333);
      frameL.position.set(dc.x - 4.25, 5.75, dc.z);
      frameL.rotation.y = dc.rot;
      _factoryGroup.add(frameL);

      var frameR = makeBox(0.5, 5.5, 0.7, 0x333333);
      frameR.position.set(dc.x + 4.25, 5.75, dc.z);
      frameR.rotation.y = dc.rot;
      _factoryGroup.add(frameR);
    }
  }

  function buildOverrideTerminals() {
    /* 3 override terminals near blast doors */
    var termConfigs = [
      { x: -8,  z: 3,   section: 0 },
      { x: 17,  z: -7,  section: 1 },
      { x: 23,  z: 10,  section: 2 }
    ];
    var ti;
    for (ti = 0; ti < termConfigs.length; ti++) {
      var tc = termConfigs[ti];
      var term = makeBox(0.7, 1.4, 0.4, 0x225522, { emissive: 0x003300 });
      term.position.set(tc.x, 0.7, tc.z);
      _factoryGroup.add(term);

      /* Terminal screen */
      var screen = makeBox(0.55, 0.5, 0.05, 0x113311, { emissive: 0x005500 });
      screen.position.set(tc.x, 0.95, tc.z - 0.22);
      _factoryGroup.add(screen);

      _overrideTerminals.push({
        mesh: term,
        section: tc.section,
        activating: false,
        progress: 0,
        done: false,
        pos: new THREE.Vector3(tc.x, 0.7, tc.z)
      });
    }
  }

  function buildSemiTrucks() {
    /* 2 semi-trucks in loading bay area */
    var truckConfigs = [
      { x: 32, z: 38 },
      { x: 22, z: 38 }
    ];
    var ti;
    for (ti = 0; ti < truckConfigs.length; ti++) {
      var tc = truckConfigs[ti];

      /* Cab */
      var cab = makeBox(4, 3.5, 5, 0x556677);
      cab.position.set(tc.x, 1.75, tc.z - 3);
      _factoryGroup.add(cab);
      _truckMeshes.push(cab);

      /* Windshield */
      var wind = makeBox(3.8, 1.5, 0.1, 0x334455, { transparent: true, opacity: 0.5 });
      wind.position.set(tc.x, 2.5, tc.z - 5.55);
      _factoryGroup.add(wind);

      /* Trailer */
      var trailer = makeBox(4, 3, 10, 0x445566);
      trailer.position.set(tc.x, 1.7, tc.z + 4);
      _factoryGroup.add(trailer);
      _truckMeshes.push(trailer);

      /* Wheels */
      var tw;
      for (tw = 0; tw < 4; tw++) {
        var whl = makeCyl(0.7, 0.7, 0.6, 8, 0x222222);
        whl.rotation.z = Math.PI / 2;
        whl.position.set(tc.x + (tw < 2 ? -2.3 : 2.3), 0.7, tc.z + (tw % 2 === 0 ? -4 : 4));
        _factoryGroup.add(whl);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     ENEMY BUILDERS
  ════════════════════════════════════════════════════════════════════════ */

  function createEnemy(x, y, z, hp, color, type, patrol) {
    var group = new THREE.Group();

    /* Body */
    var body = makeBox(0.7, 1.1, 0.5, color);
    body.position.y = 0.55;
    group.add(body);

    /* Head */
    var head = makeSphere(0.3, 6, 4, color);
    head.position.y = 1.4;
    group.add(head);

    /* Arms */
    var armL = makeBox(0.2, 0.7, 0.2, color);
    armL.position.set(-0.5, 0.8, 0);
    group.add(armL);
    var armR = makeBox(0.2, 0.7, 0.2, color);
    armR.position.set(0.5, 0.8, 0);
    group.add(armR);

    /* Weapon prop */
    var gun = makeBox(0.6, 0.15, 0.1, 0x222222);
    gun.position.set(0.6, 0.85, -0.3);
    group.add(gun);

    group.position.set(x, y, z);
    _scene.add(group);

    var patrolPoints = patrol || [
      new THREE.Vector3(x - 5, y, z),
      new THREE.Vector3(x + 5, y, z)
    ];

    return {
      group: group,
      body: body,
      hp: hp,
      maxHp: hp,
      type: type,
      alive: true,
      alerted: false,
      patrolPoints: patrolPoints,
      patrolIdx: 0,
      patrolT: Math.random() * 2,
      aimDir: new THREE.Vector3(1, 0, 0),
      shootCooldown: 2 + Math.random() * 3,
      pos: new THREE.Vector3(x, y, z)
    };
  }

  function spawnGuards() {
    /* 12 factory guards — green-grey, 80HP */
    var guardPatrols = [
      /* Assembly area */
      { x: -30, z: -5,  path: [{x:-35,z:-5},{x:-22,z:-5}] },
      { x: -20, z: 5,   path: [{x:-25,z:5},{x:-12,z:5}] },
      { x: -10, z: -15, path: [{x:-15,z:-15},{x:-5,z:-15}] },
      { x: 5,   z: -10, path: [{x:0,z:-10},{x:12,z:-10}] },
      { x: 10,  z: 5,   path: [{x:5,z:5},{x:20,z:5}] },
      { x: 0,   z: 15,  path: [{x:-5,z:15},{x:10,z:15}] },
      /* Loading bay guards */
      { x: 25,  z: 22,  path: [{x:20,z:22},{x:35,z:22}] },
      { x: 30,  z: 15,  path: [{x:28,z:12},{x:35,z:18}] },
      /* Furnace area guards */
      { x: -40, z: -10, path: [{x:-45,z:-10},{x:-32,z:-10}] },
      { x: -38, z: 10,  path: [{x:-45,z:10},{x:-30,z:10}] },
      /* Mezzanine area guards */
      { x: 30,  z: 30,  path: [{x:26,z:28},{x:44,z:32}] },
      { x: 42,  z: 27,  path: [{x:38,z:27},{x:48,z:33}] }
    ];
    var gi;
    for (gi = 0; gi < 12; gi++) {
      var gd = guardPatrols[gi];
      var pts = gd.path.map(function(p) { return new THREE.Vector3(p.x, 0, p.z); });
      var guard = createEnemy(gd.x, 0, gd.z, 80, 0x334433, 'guard', pts);
      _guards.push(guard);
    }
  }

  function spawnWorkers() {
    /* 7 production workers — brownish, 60HP, near assembly lines */
    var workerPositions = [
      { x: -30, z: -8 }, { x: -26, z: -5 }, { x: 5, z: -12 },
      { x: 8, z: -18 }, { x: 20, z: 3 }, { x: 18, z: 8 }, { x: 12, z: -5 }
    ];
    var wi;
    for (wi = 0; wi < 7; wi++) {
      var wp = workerPositions[wi];
      var worker = createEnemy(wp.x, 0, wp.z, 60, 0x444433, 'worker', [
        new THREE.Vector3(wp.x - 3, 0, wp.z),
        new THREE.Vector3(wp.x + 3, 0, wp.z)
      ]);
      worker.hostile = false; /* workers only hostile on alarm */
      _workers.push(worker);
    }
  }

  function spawnDirectorSteele() {
    /* Director Steele — boss on executive mezzanine */
    var steeleGroup = new THREE.Group();

    /* Body — taller, darker */
    var body = makeBox(0.8, 1.3, 0.55, 0x223322);
    body.position.y = 0.65;
    steeleGroup.add(body);

    /* Head */
    var head = makeSphere(0.35, 8, 6, 0x223322);
    head.position.y = 1.55;
    steeleGroup.add(head);

    /* Uniform details */
    var epL = makeBox(0.3, 0.15, 0.5, 0x334433);
    epL.position.set(-0.5, 1.2, 0);
    steeleGroup.add(epL);
    var epR = makeBox(0.3, 0.15, 0.5, 0x334433);
    epR.position.set(0.5, 1.2, 0);
    steeleGroup.add(epR);

    /* Prototype weapon (large, glowing) */
    var protoGun = makeBox(1.2, 0.2, 0.2, 0x112211, { emissive: 0x002200 });
    protoGun.position.set(0.7, 1.0, -0.5);
    steeleGroup.add(protoGun);

    /* Energy cell on prototype */
    var cell = makeCyl(0.15, 0.15, 0.5, 6, 0x00aa33, { emissive: 0x004400 });
    cell.rotation.z = Math.PI / 2;
    cell.position.set(0.4, 1.0, -0.5);
    steeleGroup.add(cell);

    steeleGroup.position.set(40, 7.5, 30);
    _scene.add(steeleGroup);

    _steele = {
      group: steeleGroup,
      hp: 510,
      maxHp: 510,
      alive: true,
      alerted: false,
      pos: new THREE.Vector3(40, 7.5, 30),
      patrolPoints: [
        new THREE.Vector3(36, 7.5, 28),
        new THREE.Vector3(44, 7.5, 32)
      ],
      patrolIdx: 0,
      patrolT: 0,
      aimDir: new THREE.Vector3(-1, 0, 0),
      shotTimer: 0,
      reinforced: false
    };
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER SETUP
  ════════════════════════════════════════════════════════════════════════ */

  function setupPlayer() {
    _playerPos = new THREE.Vector3(-5, 1.7, 0);
    _camera.position.copy(_playerPos);
    _camera.rotation.set(0, 0, 0);
    _playerHP = 100;
    _yaw = 0;
    _pitch = 0;
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    if (_hud) { _hud.remove(); }
    _hud = document.createElement('div');
    _hud.id = 'wf-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:14px',
      'left:14px',
      'color:#88ff88',
      'font:bold 13px/1.5 monospace',
      'background:rgba(0,0,0,0.65)',
      'padding:10px 14px',
      'border-radius:6px',
      'border:1px solid #335533',
      'pointer-events:none',
      'z-index:9999',
      'min-width:220px'
    ].join(';');
    document.body.appendChild(_hud);
    updateHUD();
  }

  function updateHUD() {
    if (!_hud) { return; }
    var lockStr = '';
    var i;
    for (i = 0; i < 3; i++) {
      lockStr += _lockdownSections[i] ? '[LOCKED] ' : '[OPEN] ';
    }
    var furnaceStr = _furnaceWarning ? ' ⚠ HEAT HAZARD' : '';
    var escStr = _escapeActive ? '\n<span style="color:#ff4444">ESCAPE: ' + Math.ceil(_escapeTimer) + 's</span>' : '';
    var steeleHpStr = _steele ? ('STEELE HP: ' + Math.max(0, _steele.hp) + '/' + _steele.maxHp) : '';
    var missionStr = _missionComplete ? '<span style="color:#ffff44">MISSION COMPLETE!</span>' : '';
    var failStr    = _missionFailed   ? '<span style="color:#ff3333">MISSION FAILED</span>' : '';
    _hud.innerHTML = [
      '<b>WEAPONS FACTORY</b>',
      'HP: ' + _playerHP,
      'CRATES ARMED: ' + _cratesArmed + '/6',
      'LOCKDOWN SECTIONS: ' + lockStr,
      _alarmTriggered ? '<span style="color:#ff4444">!! FACTORY LOCKDOWN !!</span>' : 'STEALTH MODE',
      steeleHpStr,
      furnaceStr ? '<span style="color:#ff8844">' + furnaceStr + '</span>' : '',
      escStr,
      missionStr,
      failStr
    ].filter(Boolean).join('<br>');
  }

  /* ════════════════════════════════════════════════════════════════════════
     ALARM SYSTEM
  ════════════════════════════════════════════════════════════════════════ */

  function triggerAlarm() {
    if (_alarmTriggered) { return; }
    _alarmTriggered = true;

    /* Close all blast doors */
    var i;
    for (i = 0; i < 3; i++) {
      _lockdownSections[i] = true;
      _blastDoorTarget[i] = BLAST_DOOR_CLOSED_Y;
    }

    /* Workers become hostile */
    for (i = 0; i < _workers.length; i++) {
      _workers[i].hostile = true;
      _workers[i].alerted = true;
    }

    /* Guards go to alert patrol */
    for (i = 0; i < _guards.length; i++) {
      _guards[i].alerted = true;
    }

    /* Alert Steele */
    if (_steele && _steele.alive) {
      _steele.alerted = true;
    }
  }

  function overrideTerminal(terminal) {
    _lockdownSections[terminal.section] = false;
    _blastDoorTarget[terminal.section] = BLAST_DOOR_OPEN_Y;
    terminal.done = true;
    terminal.mesh.material.emissive = new THREE.Color(0x005500);
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function playerShoot() {
    var dir = new THREE.Vector3();
    _camera.getWorldDirection(dir);

    var bullet = makeBox(0.12, 0.12, 0.4, 0xffee44);
    bullet.position.copy(_playerPos);
    bullet.position.addScaledVector(dir, 1.2);
    _scene.add(bullet);

    _bullets.push({
      mesh: bullet,
      vel: dir.clone().multiplyScalar(_bulletSpeed),
      life: 2.0,
      owner: 'player',
      damage: 20
    });
  }

  function enemyShoot(enemy) {
    var dir = enemy.aimDir.clone().normalize();
    var bullet = makeBox(0.15, 0.15, 0.4, 0xff4444);
    bullet.position.set(enemy.pos.x, enemy.pos.y + 1.1, enemy.pos.z);
    bullet.position.addScaledVector(dir, 0.8);
    _scene.add(bullet);
    _bullets.push({
      mesh: bullet,
      vel: dir.clone().multiplyScalar(18),
      life: 3.0,
      owner: 'enemy',
      damage: 10
    });
  }

  function steeleFireEnergyBolt() {
    if (!_steele || !_steele.alive) { return; }

    /* Predict player lead position */
    var dx = _playerPos.x - _steele.pos.x;
    var dz = _playerPos.z - _steele.pos.z;
    var dist = Math.sqrt(dx*dx + dz*dz);
    var travelTime = dist / 22;

    /* Lead aim — approximate player velocity from key state */
    var pvx = (_keys['KeyD'] ? 1 : 0) - (_keys['KeyA'] ? 1 : 0);
    var pvz = (_keys['KeyS'] ? 1 : 0) - (_keys['KeyW'] ? 1 : 0);
    var leadX = _playerPos.x + pvx * _moveSpeed * travelTime;
    var leadZ = _playerPos.z + pvz * _moveSpeed * travelTime;

    var aimDir = new THREE.Vector3(leadX - _steele.pos.x, 0.05, leadZ - _steele.pos.z).normalize();

    /* Energy bolt — larger, glowing green box */
    var bolt = makeBox(0.5, 0.5, 1.2, 0x00ff55, { emissive: 0x004422 });
    bolt.position.set(_steele.pos.x, _steele.pos.y + 1.0, _steele.pos.z);
    bolt.position.addScaledVector(aimDir, 1.5);
    _scene.add(bolt);

    _energyBolts.push({
      mesh: bolt,
      vel: aimDir.clone().multiplyScalar(22),
      life: 4.0,
      damage: 40
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     CRANE MECHANICS
  ════════════════════════════════════════════════════════════════════════ */

  function dropCrane() {
    if (_craneFired || !_craneDriven) { return; }
    _craneFired = true;
    _cranePayloadFalling = true;
    _cranePayloadVelY = 0;

    /* Get crane world position */
    var worldPos = new THREE.Vector3();
    _cranePayload.getWorldPosition(worldPos);
    _cranePayloadPos = worldPos.clone();

    /* Detach from group — move to scene for free fall */
    _craneGroup.remove(_cranePayload);
    _cranePayload.position.copy(_cranePayloadPos);
    _scene.add(_cranePayload);
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSION / EFFECTS
  ════════════════════════════════════════════════════════════════════════ */

  function createExplosion(x, y, z, radius) {
    var i;
    for (i = 0; i < 12; i++) {
      var piece = makeBox(
        0.2 + Math.random() * 0.5,
        0.2 + Math.random() * 0.5,
        0.2 + Math.random() * 0.5,
        i % 2 === 0 ? 0xff6600 : 0xffcc00,
        { emissive: i % 2 === 0 ? 0xcc2200 : 0xaa8800 }
      );
      piece.position.set(x, y, z);
      _scene.add(piece);
      _explosionParticles.push({
        mesh: piece,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 10 + 2,
          (Math.random() - 0.5) * 12
        ),
        life: 1.2 + Math.random() * 0.8,
        gravity: -15
      });
    }

    /* Flash light */
    var flash = new THREE.PointLight(0xff8800, 8, radius * 3);
    flash.position.set(x, y, z);
    _scene.add(flash);
    _flashEffects.push({ light: flash, life: 0.3 });
  }

  function craneDropAoE(x, y, z) {
    /* Damage all enemies within 6 units */
    var aoeRadius = 6;
    var aoeRange2 = aoeRadius * aoeRadius;
    var i, e, dx, dz, d2;
    var allEnemies = _guards.concat(_workers);
    if (_reinforcements.length) { allEnemies = allEnemies.concat(_reinforcements); }

    for (i = 0; i < allEnemies.length; i++) {
      e = allEnemies[i];
      if (!e.alive) { continue; }
      dx = e.pos.x - x;
      dz = e.pos.z - z;
      d2 = dx*dx + dz*dz;
      if (d2 < aoeRange2) {
        e.hp -= 60;
        if (e.hp <= 0) { killEnemy(e); }
      }
    }
    createExplosion(x, y + 2, z, 6);
  }

  function killEnemy(e) {
    if (!e.alive) { return; }
    e.alive = false;
    /* Drop body */
    if (e.group) {
      e.group.rotation.z = Math.PI / 2;
      e.group.position.y = 0;
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     STEELE REINFORCEMENTS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnReinforcements() {
    if (_steeleReinforced) { return; }
    _steeleReinforced = true;
    var spawnPos = [
      { x: 36, z: 26 }, { x: 44, z: 26 }, { x: 36, z: 34 }, { x: 44, z: 34 }
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var r = createEnemy(spawnPos[i].x, 7.5, spawnPos[i].z, 80, 0x334433, 'guard', [
        new THREE.Vector3(spawnPos[i].x - 3, 7.5, spawnPos[i].z),
        new THREE.Vector3(spawnPos[i].x + 3, 7.5, spawnPos[i].z)
      ]);
      r.alerted = true;
      _reinforcements.push(r);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     INTERACTION (E key hold)
  ════════════════════════════════════════════════════════════════════════ */

  function findNearbyInteractable() {
    var i, d;

    /* Check weapon crates */
    for (i = 0; i < _crateObjects.length; i++) {
      var cr = _crateObjects[i];
      if (cr.armed) { continue; }
      d = _playerPos.distanceTo(cr.pos);
      if (d < INTERACT_RANGE) { return { type: 'crate', obj: cr }; }
    }

    /* Check override terminals */
    for (i = 0; i < _overrideTerminals.length; i++) {
      var tm = _overrideTerminals[i];
      if (tm.done) { continue; }
      d = _playerPos.distanceTo(tm.pos);
      if (d < INTERACT_RANGE) { return { type: 'terminal', obj: tm }; }
    }

    /* Check crane control panel */
    var craneCtrlPos = new THREE.Vector3(-10, 0.75, 5);
    if (_playerPos.distanceTo(craneCtrlPos) < INTERACT_RANGE && !_craneDriven) {
      return { type: 'crane', obj: _craneControl };
    }

    return null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;

    /* Activation combo: W then F within 400ms */
    if (!_active) {
      if (e.code === 'KeyW') { _wPressTime = performance.now() / 1000; }
      if (e.code === 'KeyF') {
        _fPressTime = performance.now() / 1000;
        if ((_fPressTime - _wPressTime) < COMBO_WINDOW && _wPressTime > 0) {
          activate();
        }
      }
      return;
    }

    /* In-game inputs */
    if (e.code === 'KeyE') { _interactKey = true; }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') {
      _interactKey = false;
      /* Cancel in-progress interact */
      if (_interactTarget && _interactTarget.type === 'crate') {
        _interactTarget.obj.arming = false;
        _interactTarget.obj.armProgress = 0;
      }
      if (_interactTarget && _interactTarget.type === 'terminal') {
        _interactTarget.obj.activating = false;
        _interactTarget.obj.progress = 0;
      }
      _interactHeld = 0;
      _interactTarget = null;
    }
  }

  function onMouseMove(e) {
    if (!_active || !_pointerLocked) { return; }
    _yaw   -= e.movementX * _mouseSensitivity;
    _pitch -= e.movementY * _mouseSensitivity;
    _pitch = Math.max(-Math.PI/3, Math.min(Math.PI/3, _pitch));
    _camera.rotation.order = 'YXZ';
    _camera.rotation.y = _yaw;
    _camera.rotation.x = _pitch;
  }

  function onMouseDown(e) {
    if (!_active) { return; }
    if (e.button === 0) {
      if (!_pointerLocked) {
        _canvas.requestPointerLock();
        return;
      }
      if (_shootCooldown <= 0) {
        playerShoot();
        _shootCooldown = SHOOT_RATE;
      }
    }
  }

  function onPointerLockChange() {
    _pointerLocked = document.pointerLockElement === _canvas;
  }

  /* ════════════════════════════════════════════════════════════════════════
     ACTIVATION
  ════════════════════════════════════════════════════════════════════════ */

  function activate() {
    if (_active) { return; }
    _active = true;
    buildEnvironment();
    spawnGuards();
    spawnWorkers();
    spawnDirectorSteele();
    setupPlayer();
    buildHUD();
    setupLighting();
    updateHUD();
  }

  function setupLighting() {
    _ambientLight = new THREE.AmbientLight(0x334433, 0.6);
    _scene.add(_ambientLight);

    /* Industrial overhead lights */
    var positions = [[-30,12,-10],[-10,12,-10],[10,12,0],[30,12,10],[-30,12,20],[10,12,25]];
    var i;
    for (i = 0; i < positions.length; i++) {
      var pt = new THREE.PointLight(0xffffee, 1.5, 35);
      pt.position.set(positions[i][0], positions[i][1], positions[i][2]);
      _scene.add(pt);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    /* Store references on first call */
    if (!_scene)  { _scene  = scene;  }
    if (!_camera) { _camera = camera; }
    if (!_canvas) {
      _canvas = canvas;
      _canvas.addEventListener('mousedown',  onMouseDown);
      _canvas.addEventListener('mousemove',  onMouseMove);
      document.addEventListener('keydown',   onKeyDown);
      document.addEventListener('keyup',     onKeyUp);
      document.addEventListener('pointerlockchange', onPointerLockChange);
    }

    if (!_active || _missionComplete || _missionFailed) { return; }

    var now = performance.now() / 1000;
    dt = Math.min(dt, 0.05);

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateSteele(dt);
    updateEnergyBolts(dt);
    updateBlastDoors(dt);
    updateFurnaces(dt);
    updateMoltenEffect(dt);
    updateCrane(dt);
    updateInteraction(dt);
    updateAlarmFlash(dt);
    updateEscapeTimer(dt);
    updateExplosionParticles(dt);
    updateFlashEffects(dt);
    checkWinConditions();
    updateHUD();
  }

  /* ── Player movement ───────────────────────────────────────────────────── */

  function updatePlayer(dt) {
    var forward = new THREE.Vector3();
    _camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    var moved = false;
    if (_keys['KeyW']) { _playerPos.addScaledVector(forward,  _moveSpeed * dt); moved = true; }
    if (_keys['KeyS']) { _playerPos.addScaledVector(forward, -_moveSpeed * dt); moved = true; }
    if (_keys['KeyA']) { _playerPos.addScaledVector(right,   -_moveSpeed * dt); moved = true; }
    if (_keys['KeyD']) { _playerPos.addScaledVector(right,    _moveSpeed * dt); moved = true; }

    /* Clamp to factory bounds */
    _playerPos.x = Math.max(-49, Math.min(49, _playerPos.x));
    _playerPos.z = Math.max(-39, Math.min(39, _playerPos.z));
    _playerPos.y = 1.7;

    _camera.position.copy(_playerPos);
    _shootCooldown -= dt;

    /* Alarm: if player is spotted by a guard within range */
    if (!_alarmTriggered && moved) {
      var i, e, dx, dz, d2;
      for (i = 0; i < _guards.length; i++) {
        e = _guards[i];
        if (!e.alive) { continue; }
        dx = _playerPos.x - e.pos.x;
        dz = _playerPos.z - e.pos.z;
        d2 = dx*dx + dz*dz;
        if (d2 < 64) {
          /* Check dot product — enemy facing player */
          var toDot = new THREE.Vector3(dx, 0, dz).normalize();
          if (toDot.dot(e.aimDir) > 0.5) {
            triggerAlarm();
            break;
          }
        }
      }
    }
  }

  /* ── Bullets ───────────────────────────────────────────────────────────── */

  function updateBullets(dt) {
    var i, b, dx, dz, dy, d2;
    for (i = _bullets.length - 1; i >= 0; i--) {
      b = _bullets[i];
      b.mesh.position.addScaledVector(b.vel, dt);
      b.life -= dt;

      /* Orient bullet along velocity */
      if (b.vel.length() > 0.1) {
        b.mesh.lookAt(b.mesh.position.clone().add(b.vel));
      }

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(i, 1);
        continue;
      }

      /* Player bullet vs enemies */
      if (b.owner === 'player') {
        var allEnemies = _guards.concat(_workers).concat(_reinforcements);
        if (_steele && _steele.alive) { allEnemies.push(_steele); }
        var hit = false;
        var j;
        for (j = 0; j < allEnemies.length; j++) {
          var e = allEnemies[j];
          if (!e.alive) { continue; }
          dx = b.mesh.position.x - e.pos.x;
          dy = b.mesh.position.y - (e.pos.y + 1.0);
          dz = b.mesh.position.z - e.pos.z;
          d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < 1.2) {
            e.hp -= b.damage;
            if (e.hp <= 0) { killEnemy(e); }
            if (!_alarmTriggered) { triggerAlarm(); }
            _scene.remove(b.mesh);
            _bullets.splice(i, 1);
            hit = true;
            /* Check Steele reinforcements */
            if (e === _steele && !_steeleReinforced && _steele.hp < _steele.maxHp * 0.5) {
              spawnReinforcements();
            }
            break;
          }
        }
        if (hit) { continue; }
      }

      /* Enemy bullet vs player */
      if (b.owner === 'enemy') {
        dx = b.mesh.position.x - _playerPos.x;
        dy = b.mesh.position.y - _playerPos.y;
        dz = b.mesh.position.z - _playerPos.z;
        d2 = dx*dx + dy*dy + dz*dz;
        if (d2 < 1.5) {
          _playerHP -= b.damage;
          _scene.remove(b.mesh);
          _bullets.splice(i, 1);
          if (_playerHP <= 0) { _missionFailed = true; }
        }
      }
    }
  }

  /* ── Enemy AI ──────────────────────────────────────────────────────────── */

  function updateEnemies(dt) {
    var allEnemies = _guards.concat(_workers).concat(_reinforcements);
    var i, e;
    for (i = 0; i < allEnemies.length; i++) {
      e = allEnemies[i];
      if (!e.alive) { continue; }

      /* Skip workers until alerted */
      if (e.type === 'worker' && !e.hostile) {
        /* Idle animation */
        e.group.position.x = e.patrolPoints[0].x + Math.sin(e.patrolT) * 0.5;
        e.patrolT += dt * 0.5;
        continue;
      }

      var dx = _playerPos.x - e.pos.x;
      var dz = _playerPos.z - e.pos.z;
      var d2 = dx*dx + dz*dz;

      if (e.alerted && d2 < 625) {
        /* Chase player */
        var spd = (e.type === 'guard') ? 3.5 : 2.5;
        var dist = Math.sqrt(d2);
        if (dist > 2.5) {
          e.pos.x += (dx / dist) * spd * dt;
          e.pos.z += (dz / dist) * spd * dt;
        }
        e.aimDir.set(dx, 0, dz).normalize();
      } else {
        /* Patrol */
        var target = e.patrolPoints[e.patrolIdx];
        var pdx = target.x - e.pos.x;
        var pdz = target.z - e.pos.z;
        var pd2 = pdx*pdx + pdz*pdz;
        if (pd2 < 1) {
          e.patrolIdx = (e.patrolIdx + 1) % e.patrolPoints.length;
        } else {
          var pDist = Math.sqrt(pd2);
          e.pos.x += (pdx / pDist) * 2 * dt;
          e.pos.z += (pdz / pDist) * 2 * dt;
          e.aimDir.set(pdx, 0, pdz).normalize();
        }
      }

      /* Sync mesh */
      e.group.position.copy(e.pos);
      e.group.lookAt(e.pos.x + e.aimDir.x, e.pos.y, e.pos.z + e.aimDir.z);

      /* Shoot at player when alerted and in range */
      if (e.alerted && d2 < 400) {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          enemyShoot(e);
          e.shootCooldown = 1.5 + Math.random() * 2;
        }
      }

      e.patrolT += dt;
    }
  }

  /* ── Director Steele ───────────────────────────────────────────────────── */

  function updateSteele(dt) {
    if (!_steele || !_steele.alive) { return; }

    var dx = _playerPos.x - _steele.pos.x;
    var dz = _playerPos.z - _steele.pos.z;
    var d2 = dx*dx + dz*dz;

    if (_steele.alerted) {
      _steele.aimDir.set(dx, 0, dz).normalize();
      /* Steele moves slowly — keeps distance */
      if (d2 > 100) {
        var dist = Math.sqrt(d2);
        _steele.pos.x += (dx / dist) * 2 * dt;
        _steele.pos.z += (dz / dist) * 2 * dt;
      }

      /* Energy bolt every 8s */
      _steele.shotTimer += dt;
      if (_steele.shotTimer >= STEELE_SHOT_RATE) {
        _steele.shotTimer = 0;
        steeleFireEnergyBolt();
      }

      /* Also fires normal shots when player close */
      _steele.shootCooldown -= dt;
      if (_steele.shootCooldown <= 0 && d2 < 300) {
        enemyShoot(_steele);
        _steele.shootCooldown = 2.0 + Math.random() * 1.5;
      }
    } else {
      /* Patrol mezzanine */
      var tgt = _steele.patrolPoints[_steele.patrolIdx];
      var pdx = tgt.x - _steele.pos.x;
      var pdz = tgt.z - _steele.pos.z;
      var pd2 = pdx*pdx + pdz*pdz;
      if (pd2 < 1) {
        _steele.patrolIdx = (_steele.patrolIdx + 1) % _steele.patrolPoints.length;
      } else {
        var pDist = Math.sqrt(pd2);
        _steele.pos.x += (pdx / pDist) * 1.5 * dt;
        _steele.pos.z += (pdz / pDist) * 1.5 * dt;
      }
      _steele.aimDir.set(pdx || 1, 0, pdz).normalize();

      /* Alert when player reaches mezzanine */
      if (d2 < 225) { _steele.alerted = true; }
    }

    _steele.group.position.copy(_steele.pos);
    _steele.group.lookAt(_steele.pos.x + _steele.aimDir.x, _steele.pos.y, _steele.pos.z + _steele.aimDir.z);

    /* Check 50% HP reinforcement */
    if (!_steeleReinforced && _steele.hp < _steele.maxHp * 0.5) {
      spawnReinforcements();
    }

    /* Check death */
    if (_steele.hp <= 0) {
      killEnemy(_steele);
      _steeleDefeated = true;
      createExplosion(_steele.pos.x, _steele.pos.y + 1, _steele.pos.z, 5);
    }
  }

  /* ── Energy bolts ──────────────────────────────────────────────────────── */

  function updateEnergyBolts(dt) {
    var i, b, dx, dy, dz, d2;
    for (i = _energyBolts.length - 1; i >= 0; i--) {
      b = _energyBolts[i];
      b.mesh.position.addScaledVector(b.vel, dt);
      b.mesh.rotation.y += dt * 5;
      b.life -= dt;
      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _energyBolts.splice(i, 1);
        continue;
      }
      dx = b.mesh.position.x - _playerPos.x;
      dy = b.mesh.position.y - _playerPos.y;
      dz = b.mesh.position.z - _playerPos.z;
      d2 = dx*dx + dy*dy + dz*dz;
      if (d2 < 2.0) {
        _playerHP -= b.damage;
        _scene.remove(b.mesh);
        _energyBolts.splice(i, 1);
        if (_playerHP <= 0) { _missionFailed = true; }
      }
    }
  }

  /* ── Blast doors ───────────────────────────────────────────────────────── */

  function updateBlastDoors(dt) {
    var i, door;
    for (i = 0; i < _blastDoors.length; i++) {
      door = _blastDoors[i];
      var target = _blastDoorTarget[i];
      var current = _blastDoorY[i];
      if (Math.abs(current - target) > 0.05) {
        var dir = target > current ? 1 : -1;
        _blastDoorY[i] += dir * 4 * dt;
        _blastDoorY[i] = dir > 0
          ? Math.min(_blastDoorY[i], target)
          : Math.max(_blastDoorY[i], target);
        door.position.y = _blastDoorY[i];
      }
    }
  }

  /* ── Blast furnace heat hazard ─────────────────────────────────────────── */

  function updateFurnaces(dt) {
    var i, f, dx, dz, d2;
    _furnaceWarning = false;
    _furnaceHeat = false;

    for (i = 0; i < _furnaces.length; i++) {
      f = _furnaces[i];
      f.pulseT += dt;

      /* Pulsing orange light */
      var pulse = 2.5 + Math.sin(f.pulseT * 3) * 1.0;
      f.light.intensity = pulse;

      dx = _playerPos.x - f.x;
      dz = _playerPos.z - f.z;
      d2 = dx*dx + dz*dz;

      if (d2 < FURNACE_DAMAGE_DIST * FURNACE_DAMAGE_DIST) {
        _furnaceHeat = true;
        _furnaceWarning = true;
        _playerHP -= FURNACE_HP_PER_SEC * dt;
        if (_playerHP <= 0) { _missionFailed = true; }
      } else if (d2 < (FURNACE_DAMAGE_DIST + 4) * (FURNACE_DAMAGE_DIST + 4)) {
        _furnaceWarning = true;
      }
    }
  }

  /* ── Molten metal animation ────────────────────────────────────────────── */

  function updateMoltenEffect(dt) {
    var i, m;
    for (i = 0; i < _moltenParticles.length; i++) {
      m = _moltenParticles[i];
      m.t += dt;
      /* Ripple effect on Y */
      m.mesh.position.y = 0.82 + Math.sin(m.t * 2.5) * 0.04;
      /* Color shift between orange and red */
      var r = 1.0;
      var g = 0.3 + Math.abs(Math.sin(m.t * 1.8)) * 0.3;
      m.mesh.material.color.setRGB(r, g, 0);
      m.mesh.material.emissive.setRGB(0.7, g * 0.5, 0);
    }
  }

  /* ── Crane update ──────────────────────────────────────────────────────── */

  function updateCrane(dt) {
    if (_cranePayloadFalling) {
      _cranePayloadVelY -= 18 * dt;
      _cranePayload.position.y += _cranePayloadVelY * dt;

      if (_cranePayload.position.y <= 0.5) {
        /* Impact */
        _cranePayload.position.y = 0.5;
        _cranePayloadFalling = false;
        craneDropAoE(_cranePayload.position.x, 0, _cranePayload.position.z);
      }
    }
  }

  /* ── Interaction (E key hold) ──────────────────────────────────────────── */

  function updateInteraction(dt) {
    _interactTarget = findNearbyInteractable();

    if (!_interactKey || !_interactTarget) {
      _interactHeld = 0;
      return;
    }

    _interactHeld += dt;

    if (_interactTarget.type === 'crate') {
      var cr = _interactTarget.obj;
      cr.arming = true;
      cr.armProgress = _interactHeld / INTERACT_HOLD_TIME;
      if (_interactHeld >= INTERACT_HOLD_TIME) {
        cr.armed = true;
        cr.arming = false;
        cr.armProgress = 1;
        cr.marker.material.color.setHex(0xff3300);
        cr.marker.material.emissive = new THREE.Color(0xaa1100);
        _cratesArmed++;
        _interactHeld = 0;
        /* Trigger alarm if not already */
        if (!_alarmTriggered) { triggerAlarm(); }
        /* Start escape timer once all 6 crates armed */
        if (_cratesArmed >= 6 && _steeleDefeated && !_escapeActive) {
          startEscapeTimer();
        }
      }
    }

    if (_interactTarget.type === 'terminal') {
      var tm = _interactTarget.obj;
      if (!_alarmTriggered) { return; }
      tm.activating = true;
      tm.progress = _interactHeld / INTERACT_HOLD_TIME;
      if (_interactHeld >= INTERACT_HOLD_TIME) {
        overrideTerminal(tm);
        _interactHeld = 0;
      }
    }

    if (_interactTarget.type === 'crane') {
      if (_interactHeld >= INTERACT_HOLD_TIME) {
        _craneDriven = true;
        dropCrane();
        _interactHeld = 0;
      }
    }
  }

  /* ── Alarm flash ───────────────────────────────────────────────────────── */

  function updateAlarmFlash(dt) {
    if (!_alarmTriggered) { return; }
    _alarmFlashT += dt;
    var on = Math.sin(_alarmFlashT * 6) > 0;
    var i;
    for (i = 0; i < _alarmLights.length; i++) {
      _alarmLights[i].intensity = on ? 4 : 0;
    }
  }

  /* ── Escape timer ──────────────────────────────────────────────────────── */

  function startEscapeTimer() {
    _escapeActive = true;
    _escapeTimer = 90;
  }

  function updateEscapeTimer(dt) {
    if (!_escapeActive) { return; }
    _escapeTimer -= dt;

    /* Check if player reached south wall escape zone */
    if (_playerPos.z > 36 && _playerPos.x > 18 && _playerPos.x < 42) {
      _escaped = true;
      _missionComplete = true;
    }

    if (_escapeTimer <= 0 && !_escaped) {
      /* Detonate — mission failed */
      var i;
      for (i = 0; i < _crateObjects.length; i++) {
        if (_crateObjects[i].armed) {
          createExplosion(_crateObjects[i].pos.x, 1, _crateObjects[i].pos.z, 8);
        }
      }
      _missionFailed = true;
    }
  }

  /* ── Particle / effect updates ─────────────────────────────────────────── */

  function updateExplosionParticles(dt) {
    var i, p;
    for (i = _explosionParticles.length - 1; i >= 0; i--) {
      p = _explosionParticles[i];
      p.vel.y += p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.life -= dt;
      if (p.life <= 0) {
        _scene.remove(p.mesh);
        _explosionParticles.splice(i, 1);
      }
    }
  }

  function updateFlashEffects(dt) {
    var i, f;
    for (i = _flashEffects.length - 1; i >= 0; i--) {
      f = _flashEffects[i];
      f.life -= dt;
      f.light.intensity = Math.max(0, f.light.intensity - 20 * dt);
      if (f.life <= 0) {
        _scene.remove(f.light);
        _flashEffects.splice(i, 1);
      }
    }
  }

  /* ── Win condition check ───────────────────────────────────────────────── */

  function checkWinConditions() {
    if (_missionComplete || _missionFailed) { return; }
    if (_cratesArmed >= 6 && _steeleDefeated && !_escapeActive) {
      startEscapeTimer();
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active = false;
    _missionComplete = false;
    _missionFailed = false;
    _alarmTriggered = false;
    _cratesArmed = 0;
    _steeleDefeated = false;
    _escapeActive = false;
    _escapeTimer = 90;
    _escaped = false;
    _steeleReinforced = false;
    _craneDriven = false;
    _craneFired = false;
    _cranePayloadFalling = false;
    _lockdownSections = [false, false, false];
    _blastDoorY = [];
    _blastDoorTarget = [];
    _furnaceWarning = false;
    _furnaceHeat = false;
    _pointerLocked = false;

    /* Remove all bullets */
    var i;
    for (i = 0; i < _bullets.length; i++) { _scene.remove(_bullets[i].mesh); }
    _bullets = [];
    for (i = 0; i < _energyBolts.length; i++) { _scene.remove(_energyBolts[i].mesh); }
    _energyBolts = [];
    for (i = 0; i < _explosionParticles.length; i++) { _scene.remove(_explosionParticles[i].mesh); }
    _explosionParticles = [];
    for (i = 0; i < _flashEffects.length; i++) { _scene.remove(_flashEffects[i].light); }
    _flashEffects = [];
    for (i = 0; i < _alarmLights.length; i++) { _alarmLights[i].intensity = 0; }

    if (_factoryGroup && _scene) { _scene.remove(_factoryGroup); }
    _factoryGroup = null;

    if (_steele && _steele.group && _scene) { _scene.remove(_steele.group); }
    _steele = null;

    for (i = 0; i < _guards.length; i++) {
      if (_guards[i].group && _scene) { _scene.remove(_guards[i].group); }
    }
    _guards = [];
    for (i = 0; i < _workers.length; i++) {
      if (_workers[i].group && _scene) { _scene.remove(_workers[i].group); }
    }
    _workers = [];
    for (i = 0; i < _reinforcements.length; i++) {
      if (_reinforcements[i].group && _scene) { _scene.remove(_reinforcements[i].group); }
    }
    _reinforcements = [];

    if (_ambientLight && _scene) { _scene.remove(_ambientLight); }
    _ambientLight = null;
    _alarmLights = [];

    _crateObjects = [];
    _conveyorBelts = [];
    _assemblyProps = [];
    _qualityLabMeshes = [];
    _mezzanineMeshes = [];
    _truckMeshes = [];
    _moltenParticles = [];
    _furnaces = [];
    _blastDoors = [];
    _overrideTerminals = [];

    if (_cranePayload && _scene) { _scene.remove(_cranePayload); }
    _craneGroup = null;
    _craneMesh = null;
    _cranePayload = null;
    _craneControl = null;

    if (_hud) { _hud.remove(); _hud = null; }

    _wPressTime = 0;
    _fPressTime = 0;
    _interactHeld = 0;
    _interactTarget = null;
    _interactKey = false;
    _alarmFlashT = 0;
    _steeleShotTimer = 0;
    _shootCooldown = 0;
    _keys = {};
    _playerHP = 100;
    _playerPos = null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('mousemove',  onMouseMove);
    document.addEventListener('keydown',  onKeyDown);
    document.addEventListener('keyup',    onKeyUp);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
