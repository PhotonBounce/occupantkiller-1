/* ───────────────────────────────────────────────────────────────────────────
   supply-depot.js — Military Supply Depot Raid
   API: window.SupplyDepot = { init, update, reset }
   Activation: S + D simultaneous keypress (both within 400ms)

   Mission: Lead a 4-person assault team to destroy 6 key targets inside
   a heavily guarded military supply depot before 8-minute reinforcements
   arrive, then escape by convoy truck.

   Controls:
     WASD       — move
     Mouse      — aim / look
     Click      — shoot
     E (hold)   — plant C4 (3s hold near target)
     F          — detonate all planted C4
     SPACE      — interact / open gate
   ─────────────────────────────────────────────────────────────────────────── */
window.SupplyDepot = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation key tracking ───────────────────────────────────────────── */
  var _sdPressTime = { S: 0, D: 0 };
  var SD_WINDOW    = 400; // ms

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _missionComplete = false;
  var _missionFailed   = false;

  /* ── Timer ─────────────────────────────────────────────────────────────── */
  var _reinforcementTimer = 480; // 8 minutes in seconds
  var _reinforcementsArrived = false;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerPos   = new THREE.Vector3(0, 1, 105);
  var _playerHP    = 100;
  var _playerGroup = null;
  var _playerVel   = new THREE.Vector3();
  var _playerYaw   = 0;

  /* ── C4 system ─────────────────────────────────────────────────────────── */
  var _c4Count         = 6;
  var _plantedC4       = []; // { mesh, targetIndex, pos, lit }
  var _plantProgress   = 0;
  var _plantingTarget  = -1;
  var _plantHoldTime   = 0;
  var C4_PLANT_TIME    = 3.0;

  /* ── Targets (6 objectives) ─────────────────────────────────────────────── */
  var _targets = []; // { name, mesh/group, destroyed, c4Index, pos, radius }
  var _targetsDestroyed = 0;

  /* ── Guards ─────────────────────────────────────────────────────────────── */
  var _guards    = []; // { group, hp, maxHp, alive, alert, pos, vel, role, fireTimer, patrolDir, patrolTimer }
  var _guardsAlive = 0;

  /* ── Assault team ─────────────────────────────────────────────────────────*/
  var _teamMembers = []; // { group, pos, alive }

  /* ── Gate ──────────────────────────────────────────────────────────────── */
  var _gateOpen   = false;
  var _gateMesh   = null;
  var _controlPanel = null;

  /* ── Convoy truck ──────────────────────────────────────────────────────── */
  var _truckGroup   = null;
  var _truckAlive   = true;
  var _truckPos     = new THREE.Vector3(0, 1.5, -105);

  /* ── Shooting ──────────────────────────────────────────────────────────── */
  var _bullets       = []; // { mesh, vel, life }
  var _shootCooldown = 0;
  var _mouseX        = 0;
  var _mouseY        = 0;

  /* ── Explosions ─────────────────────────────────────────────────────────── */
  var _explosions = []; // { mesh, life, maxLife }

  /* ── Input ──────────────────────────────────────────────────────────────── */
  var _keys = {};
  var _eHeld = false;
  var _eHoldTimer = 0;

  /* ── Static scene objects ─────────────────────────────────────────────── */
  var _sceneObjects = [];
  var _depotGroup   = null;

  /* ── HUD / DOM ───────────────────────────────────────────────────────────── */
  var _hud       = null;
  var _msgEl     = null;
  var _msgTimer  = 0;
  var _promptEl  = null;

  /* ════════════════════════════════════════════════════════════════════════
     GEOMETRY HELPERS
  ════════════════════════════════════════════════════════════════════════ */

  function box(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function cyl(rTop, rBot, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function sphere(r, segs, color) {
    var geo = new THREE.SphereGeometry(r, segs, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function wireBox(w, h, d, color) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(edges, mat);
  }

  function addTo(parent, child, x, y, z) {
    child.position.set(x, y, z);
    parent.add(child);
    return child;
  }

  /* ════════════════════════════════════════════════════════════════════════
     DEPOT BUILD
  ════════════════════════════════════════════════════════════════════════ */

  function buildDepot() {
    _depotGroup = new THREE.Group();
    _scene.add(_depotGroup);

    /* Ground */
    var ground = box(220, 0.3, 220, 0x4a4a3a);
    ground.position.set(0, -0.15, 0);
    _depotGroup.add(ground);

    /* ── Outer perimeter walls (200 length each side) ─────────────────── */
    var wallColor = 0x554433;
    var wallH = 4;
    var wallW = 2;
    var wallLen = 200;
    var halfLen = wallLen / 2;

    /* North wall */
    var wallN = box(wallLen, wallH, wallW, wallColor);
    wallN.position.set(0, wallH / 2, -halfLen);
    _depotGroup.add(wallN);

    /* South wall */
    var wallS = box(wallLen, wallH, wallW, wallColor);
    wallS.position.set(0, wallH / 2, halfLen);
    _depotGroup.add(wallS);

    /* East wall */
    var wallE = box(wallW, wallH, wallLen, wallColor);
    wallE.position.set(halfLen, wallH / 2, 0);
    _depotGroup.add(wallE);

    /* West wall */
    var wallW2 = box(wallW, wallH, wallLen, wallColor);
    wallW2.position.set(-halfLen, wallH / 2, 0);
    _depotGroup.add(wallW2);

    /* ── Guard towers at corners ─────────────────────────────────────── */
    var towerPositions = [
      new THREE.Vector3(-halfLen, 0, -halfLen),
      new THREE.Vector3(halfLen, 0, -halfLen),
      new THREE.Vector3(-halfLen, 0, halfLen),
      new THREE.Vector3(halfLen, 0, halfLen)
    ];
    for (var ti = 0; ti < 4; ti++) {
      var tg = new THREE.Group();
      tg.position.copy(towerPositions[ti]);
      /* Tower base */
      var tBase = box(5, 8, 5, 0x665544);
      tBase.position.set(0, 4, 0);
      tg.add(tBase);
      /* Platform */
      var tPlatform = box(7, 0.5, 7, 0x776655);
      tPlatform.position.set(0, 8.25, 0);
      tg.add(tPlatform);
      /* Roof */
      var tRoof = box(8, 1, 8, 0x665544);
      tRoof.position.set(0, 10, 0);
      tg.add(tRoof);
      _depotGroup.add(tg);
    }

    /* ── Gate house (south entrance) ──────────────────────────────────── */
    var ghGroup = new THREE.Group();
    ghGroup.position.set(0, 0, halfLen);
    var gh = box(6, 4, 8, 0x665544);
    gh.position.set(-10, 2, -4);
    ghGroup.add(gh);
    var gh2 = box(6, 4, 8, 0x665544);
    gh2.position.set(10, 2, -4);
    ghGroup.add(gh2);

    /* Control panel */
    _controlPanel = box(1.5, 2, 0.5, 0x336633);
    _controlPanel.position.set(-10, 1.5, -8);
    ghGroup.add(_controlPanel);

    /* Gate (closes by default) */
    _gateMesh = box(12, 4, 0.5, 0x887755);
    _gateMesh.position.set(0, 2, 0);
    ghGroup.add(_gateMesh);
    _scene.add(ghGroup);

    /* ── Fuel storage (4 tanks) ──────────────────────────────────────── */
    var fuelGroup = new THREE.Group();
    fuelGroup.position.set(-60, 0, -30);
    _scene.add(fuelGroup);

    var tankPositions2 = [
      [-6, 4, -6], [6, 4, -6],
      [-6, 4, 6],  [6, 4, 6]
    ];
    var fuelMeshes = [];
    for (var fi = 0; fi < 4; fi++) {
      var tank = cyl(5, 5, 8, 12, 0x446655);
      tank.position.set(tankPositions2[fi][0], tankPositions2[fi][1], tankPositions2[fi][2]);
      fuelGroup.add(tank);
      fuelMeshes.push(tank);
    }
    /* Tank banding details */
    for (var fb = 0; fb < 4; fb++) {
      var band = cyl(5.1, 5.1, 0.4, 12, 0x334455);
      band.position.set(tankPositions2[fb][0], tankPositions2[fb][1], tankPositions2[fb][2]);
      fuelGroup.add(band);
    }

    _targets.push({
      name:    'Fuel Tank Array',
      group:   fuelGroup,
      mesh:    fuelMeshes[0],
      destroyed: false,
      pos:     new THREE.Vector3(-60, 4, -30),
      radius:  14
    });

    /* ── Ammo bunker ─────────────────────────────────────────────────── */
    var ammoGroup = new THREE.Group();
    ammoGroup.position.set(40, 0, 20);
    _scene.add(ammoGroup);

    var bunkerBody = box(20, 4, 15, 0x554433);
    bunkerBody.position.set(0, 2, 0);
    ammoGroup.add(bunkerBody);

    /* Reinforced top layer */
    var bunkerRoof = box(21, 1, 16, 0x443322);
    bunkerRoof.position.set(0, 4.5, 0);
    ammoGroup.add(bunkerRoof);

    /* Ammo stacks inside */
    for (var ai = 0; ai < 3; ai++) {
      var ammoStack = box(2, 2, 2, 0x887733);
      ammoStack.position.set(-6 + ai * 6, 1.5, 0);
      ammoGroup.add(ammoStack);
    }

    _targets.push({
      name:    'Ammo Bunker Store',
      group:   ammoGroup,
      mesh:    bunkerBody,
      destroyed: false,
      pos:     new THREE.Vector3(40, 2, 20),
      radius:  12
    });

    /* ── Vehicle yard ────────────────────────────────────────────────── */
    var vehicleGroup = new THREE.Group();
    vehicleGroup.position.set(-30, 0, 30);
    _scene.add(vehicleGroup);

    /* 4 APCs */
    for (var vi = 0; vi < 4; vi++) {
      var apc = box(4, 2.5, 7, 0x334433);
      apc.position.set(-15 + vi * 10, 1.25, -8);
      vehicleGroup.add(apc);
      /* APC turret */
      var turret = box(1.5, 1, 1.5, 0x445544);
      turret.position.set(-15 + vi * 10, 3, -8);
      vehicleGroup.add(turret);
    }

    /* Tank hulls */
    for (var vj = 0; vj < 4; vj++) {
      var tankHull = box(5, 2, 8, 0x334433);
      tankHull.position.set(-15 + vj * 10, 1, 8);
      vehicleGroup.add(tankHull);
      var tankTurret = cyl(0.8, 0.8, 2, 8, 0x445544);
      tankTurret.rotation.z = Math.PI / 2;
      tankTurret.position.set(-15 + vj * 10 + 1.5, 3, 8);
      vehicleGroup.add(tankTurret);
    }

    /* Fuel manifold pipe (target) */
    var manifold = cyl(0.6, 0.6, 12, 8, 0x665533);
    manifold.rotation.z = Math.PI / 2;
    manifold.position.set(0, 1.5, 0);
    vehicleGroup.add(manifold);

    _targets.push({
      name:    'Vehicle Bay Fuel Manifold',
      group:   vehicleGroup,
      mesh:    manifold,
      destroyed: false,
      pos:     new THREE.Vector3(-30, 1.5, 30),
      radius:  10
    });

    /* ── Communications tower ────────────────────────────────────────── */
    var commsGroup = new THREE.Group();
    commsGroup.position.set(60, 0, -60);
    _scene.add(commsGroup);

    var commsTower = cyl(1, 1, 20, 8, 0x556677);
    commsTower.position.set(0, 10, 0);
    commsGroup.add(commsTower);

    /* Antenna lines (LineSegments) */
    var antPoints = [];
    antPoints.push(new THREE.Vector3(0, 20, 0));
    antPoints.push(new THREE.Vector3(0, 24, 0));
    antPoints.push(new THREE.Vector3(0, 22, 0));
    antPoints.push(new THREE.Vector3(3, 24, 0));
    antPoints.push(new THREE.Vector3(0, 22, 0));
    antPoints.push(new THREE.Vector3(-3, 24, 0));
    antPoints.push(new THREE.Vector3(0, 22, 0));
    antPoints.push(new THREE.Vector3(0, 24, 2));
    antPoints.push(new THREE.Vector3(0, 22, 0));
    antPoints.push(new THREE.Vector3(0, 24, -2));
    var antGeo = new THREE.BufferGeometry().setFromPoints(antPoints);
    var antMat = new THREE.LineBasicMaterial({ color: 0x88AACC });
    var antLines = new THREE.LineSegments(antGeo, antMat);
    commsGroup.add(antLines);

    /* Satellite dish on tower */
    var dish = box(4, 0.3, 3, 0x667788);
    dish.position.set(2, 18, 0);
    dish.rotation.z = -0.4;
    commsGroup.add(dish);

    _targets.push({
      name:    'Communications Tower',
      group:   commsGroup,
      mesh:    commsTower,
      destroyed: false,
      pos:     new THREE.Vector3(60, 10, -60),
      radius:  8
    });

    /* ── Repair depot ────────────────────────────────────────────────── */
    var repairGroup = new THREE.Group();
    repairGroup.position.set(-20, 0, -50);
    _scene.add(repairGroup);

    var repairBuilding = box(20, 6, 30, 0x445544);
    repairBuilding.position.set(0, 3, 0);
    repairGroup.add(repairBuilding);

    /* Large garage doors */
    var door1 = box(7, 5, 0.4, 0x556655);
    door1.position.set(-5, 2.5, 15);
    repairGroup.add(door1);
    var door2 = box(7, 5, 0.4, 0x556655);
    door2.position.set(5, 2.5, 15);
    repairGroup.add(door2);

    /* Crane (target 5) */
    var craneGroup = new THREE.Group();
    craneGroup.position.set(0, 0, 0);
    repairGroup.add(craneGroup);

    var craneBase = box(3, 2, 3, 0x667766);
    craneBase.position.set(8, 1, 5);
    craneGroup.add(craneBase);

    var craneArm = box(2, 15, 2, 0x778877);
    craneArm.position.set(8, 10.5, 5);
    craneGroup.add(craneArm);

    var craneBeam = box(10, 1, 1, 0x778877);
    craneBeam.position.set(4, 18, 5);
    craneGroup.add(craneBeam);

    var craneHook = box(0.5, 2, 0.5, 0x666666);
    craneHook.position.set(0, 15, 5);
    craneGroup.add(craneHook);

    _targets.push({
      name:    'Repair Depot Crane',
      group:   craneGroup,
      mesh:    craneArm,
      destroyed: false,
      pos:     new THREE.Vector3(-20 + 8, 10, -50 + 5),
      radius:  5
    });

    /* ── Command post ─────────────────────────────────────────────────── */
    var cmdGroup = new THREE.Group();
    cmdGroup.position.set(50, 0, -50);
    _scene.add(cmdGroup);

    var cmdBuilding = box(12, 4, 10, 0x445566);
    cmdBuilding.position.set(0, 2, 0);
    cmdGroup.add(cmdBuilding);

    /* Windows */
    var win1 = box(2, 1.5, 0.2, 0x6688AA);
    win1.position.set(-3, 2.5, 5.1);
    cmdGroup.add(win1);
    var win2 = box(2, 1.5, 0.2, 0x6688AA);
    win2.position.set(3, 2.5, 5.1);
    cmdGroup.add(win2);

    /* Officer's vehicle (Target 6) — armored car */
    var officerCar = box(4, 2.5, 6, 0x334433);
    officerCar.position.set(8, 1.25, 2);
    cmdGroup.add(officerCar);

    /* Armored car details */
    var carRoof = box(3, 1, 4, 0x445544);
    carRoof.position.set(8, 3, 2);
    cmdGroup.add(carRoof);
    var carWheel1 = cyl(0.6, 0.6, 0.5, 8, 0x222222);
    carWheel1.rotation.z = Math.PI / 2;
    carWheel1.position.set(8 - 2.5, 0.6, 0);
    cmdGroup.add(carWheel1);
    var carWheel2 = cyl(0.6, 0.6, 0.5, 8, 0x222222);
    carWheel2.rotation.z = Math.PI / 2;
    carWheel2.position.set(8 + 2.5, 0.6, 0);
    cmdGroup.add(carWheel2);

    _targets.push({
      name:    "Officer's Armored Vehicle",
      group:   cmdGroup,
      mesh:    officerCar,
      destroyed: false,
      pos:     new THREE.Vector3(50 + 8, 1.25, -50 + 2),
      radius:  5
    });

    /* ── Convoy truck (escape) at north gate ─────────────────────────── */
    _truckGroup = new THREE.Group();
    _truckGroup.position.copy(_truckPos);
    _scene.add(_truckGroup);

    var truckBody = box(4, 3, 8, 0x665544);
    truckBody.position.set(0, 0, 0);
    _truckGroup.add(truckBody);

    var truckCab = box(4, 2, 4, 0x776655);
    truckCab.position.set(0, 1, 4);
    _truckGroup.add(truckCab);

    var truckWindshield = box(3.5, 1.5, 0.2, 0x8899AA);
    truckWindshield.position.set(0, 2.5, 6);
    _truckGroup.add(truckWindshield);

    /* Truck wheels */
    var truckWheelPositions = [[-2.5, -1, -3], [2.5, -1, -3], [-2.5, -1, 3], [2.5, -1, 3]];
    for (var tw = 0; tw < 4; tw++) {
      var tWheel = cyl(0.8, 0.8, 0.6, 8, 0x222222);
      tWheel.rotation.z = Math.PI / 2;
      tWheel.position.set(truckWheelPositions[tw][0], truckWheelPositions[tw][1] + 1, truckWheelPositions[tw][2]);
      _truckGroup.add(tWheel);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARDS BUILD
  ════════════════════════════════════════════════════════════════════════ */

  function buildGuard(x, y, z, role, hp, color) {
    var grp = new THREE.Group();

    var body = box(0.8, 1.8, 0.6, color || 0x334433);
    body.position.set(0, 0.9, 0);
    grp.add(body);

    var head = box(0.6, 0.6, 0.6, 0xBBAA88);
    head.position.set(0, 1.9, 0);
    grp.add(head);

    var helmet = box(0.65, 0.3, 0.65, 0x334433);
    helmet.position.set(0, 2.15, 0);
    grp.add(helmet);

    var gun = box(0.12, 0.12, 0.8, 0x222222);
    gun.position.set(0.5, 1, 0.4);
    grp.add(gun);

    grp.position.set(x, y, z);
    _scene.add(grp);

    _guards.push({
      group:       grp,
      hp:          hp,
      maxHp:       hp,
      alive:       true,
      alert:       false,
      pos:         grp.position,
      vel:         new THREE.Vector3(),
      role:        role,
      fireTimer:   1.5 + Math.random() * 2,
      patrolDir:   new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize(),
      patrolTimer: Math.random() * 4,
      shootC4Timer: 2 + Math.random() * 3
    });
    _guardsAlive++;
    return grp;
  }

  function buildAllGuards() {
    _guards = [];
    _guardsAlive = 0;

    /* 30 standard soldiers spread around depot */
    var soldierPositions = [
      [0, 0, 80], [15, 0, 80], [-15, 0, 80],
      [-60, 0, -30], [-70, 0, -25], [-50, 0, -35],
      [40, 0, 20], [30, 0, 25], [50, 0, 15], [45, 0, 30], [35, 0, 10], [55, 0, 25],
      [-30, 0, 30], [-20, 0, 35], [-40, 0, 25],
      [60, 0, -60], [50, 0, -55], [70, 0, -65],
      [-20, 0, -50], [-10, 0, -55], [-30, 0, -45], [-20, 0, -40],
      [50, 0, -50], [55, 0, -40], [45, 0, -55], [60, 0, -45],
      [10, 0, 0], [-10, 0, 0], [25, 0, -20], [-25, 0, -20]
    ];
    for (var si = 0; si < soldierPositions.length; si++) {
      buildGuard(soldierPositions[si][0], 0, soldierPositions[si][2], 'soldier', 80, 0x334433);
    }

    /* 4 tower sentries — elevated positions */
    var halfLen = 100;
    var towerXZ = [
      [-halfLen, -halfLen], [halfLen, -halfLen],
      [-halfLen, halfLen],  [halfLen, halfLen]
    ];
    for (var ti2 = 0; ti2 < 4; ti2++) {
      buildGuard(towerXZ[ti2][0], 8, towerXZ[ti2][1], 'sentry', 120, 0x445544);
    }

    /* 4 truck guards */
    buildGuard(-5, 0, -100, 'truck_guard', 80, 0x334433);
    buildGuard(5, 0, -100, 'truck_guard', 80, 0x334433);
    buildGuard(-8, 0, -108, 'truck_guard', 80, 0x334433);
    buildGuard(8, 0, -108, 'truck_guard', 80, 0x334433);

    /* Depot commander */
    buildGuard(52, 0, -48, 'commander', 250, 0x443322);
  }

  /* ════════════════════════════════════════════════════════════════════════
     ASSAULT TEAM
  ════════════════════════════════════════════════════════════════════════ */

  function buildTeam() {
    _teamMembers = [];
    var offsets = [[-3, 0, 2], [3, 0, 2], [-3, 0, -2]];
    for (var ti3 = 0; ti3 < 3; ti3++) {
      var tg = new THREE.Group();
      var tbody = box(0.7, 1.6, 0.5, 0x2244AA);
      tbody.position.set(0, 0.8, 0);
      tg.add(tbody);
      var thead = box(0.55, 0.55, 0.55, 0xBBAA88);
      thead.position.set(0, 1.75, 0);
      tg.add(thead);
      tg.position.set(
        _playerPos.x + offsets[ti3][0],
        _playerPos.y + offsets[ti3][1],
        _playerPos.z + offsets[ti3][2]
      );
      _scene.add(tg);
      _teamMembers.push({ group: tg, pos: tg.position, alive: true, fireTimer: 2 });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER BUILD
  ════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    _playerGroup = new THREE.Group();
    _playerGroup.position.copy(_playerPos);

    var pBody = box(0.7, 1.6, 0.5, 0x2244AA);
    pBody.position.set(0, 0.8, 0);
    _playerGroup.add(pBody);

    var pHead = box(0.55, 0.55, 0.55, 0xBBAA88);
    pHead.position.set(0, 1.75, 0);
    _playerGroup.add(pHead);

    _scene.add(_playerGroup);
  }

  /* ════════════════════════════════════════════════════════════════════════
     HUD
  ════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'sd-hud';
    _hud.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.75)',
      'color:#CCDD88',
      'font:bold 13px monospace',
      'padding:8px 16px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hud);

    _msgEl = document.createElement('div');
    _msgEl.id = 'sd-msg';
    _msgEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#EEDDAA',
      'font:bold 22px monospace',
      'padding:20px 36px',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:10000',
      'text-align:center',
      'display:none',
      'white-space:pre-line'
    ].join(';');
    document.body.appendChild(_msgEl);

    _promptEl = document.createElement('div');
    _promptEl.id = 'sd-prompt';
    _promptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)',
      'color:#AAFFAA',
      'font:bold 14px monospace',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'display:none'
    ].join(';');
    document.body.appendChild(_promptEl);
  }

  function updateHUD() {
    if (!_hud) return;
    var mins = Math.floor(_reinforcementTimer / 60);
    var secs = Math.floor(_reinforcementTimer % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var cmdAlive = false;
    for (var ci = 0; ci < _guards.length; ci++) {
      if (_guards[ci].role === 'commander' && _guards[ci].alive) {
        cmdAlive = true;
        break;
      }
    }
    _hud.textContent = [
      'SUPPLY DEPOT',
      '[TARGETS: ' + _targetsDestroyed + '/6 DESTROYED]',
      '[TIMER: ' + timeStr + ']',
      '[GUARDS: ' + _guardsAlive + ']',
      '[TRUCK: ' + (_truckAlive ? 'INTACT' : 'DISABLED') + ']',
      '[COMMANDER: ' + (cmdAlive ? 'ALIVE' : 'ELIMINATED') + ']'
    ].join('  ');
  }

  function showMessage(txt, dur) {
    if (!_msgEl) return;
    _msgEl.textContent = txt;
    _msgEl.style.display = 'block';
    _msgTimer = dur / 1000;
  }

  function hideMessage() {
    if (_msgEl) _msgEl.style.display = 'none';
  }

  function showPrompt(txt) {
    if (!_promptEl) return;
    _promptEl.textContent = txt;
    _promptEl.style.display = 'block';
  }

  function hidePrompt() {
    if (_promptEl) _promptEl.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(x, y, z, radius, big) {
    var r = radius || 3;
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshBasicMaterial({ color: big ? 0xFF8800 : 0xFF4400, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    _scene.add(mesh);
    _explosions.push({ mesh: mesh, life: 1.2, maxLife: 1.2 });

    /* Secondary sparks */
    for (var es = 0; es < (big ? 8 : 4); es++) {
      var sg = new THREE.SphereGeometry(r * 0.3, 6, 6);
      var sm = new THREE.MeshBasicMaterial({ color: 0xFFCC00, transparent: true, opacity: 0.8 });
      var sph = new THREE.Mesh(sg, sm);
      var angle2 = Math.random() * Math.PI * 2;
      var dist = Math.random() * r * 1.5;
      sph.position.set(x + Math.cos(angle2) * dist, y + Math.random() * r, z + Math.sin(angle2) * dist);
      _scene.add(sph);
      _explosions.push({ mesh: sph, life: 0.8, maxLife: 0.8 });
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     C4 SYSTEM
  ════════════════════════════════════════════════════════════════════════ */

  function spawnC4Mesh(x, y, z) {
    var c4m = box(0.4, 0.2, 0.3, 0xCCCC44);
    c4m.position.set(x, y, z);
    _scene.add(c4m);
    /* Blinking indicator */
    var indicator = box(0.1, 0.1, 0.1, 0xFF0000);
    indicator.position.set(0, 0.15, 0);
    c4m.add(indicator);
    return c4m;
  }

  function detonateAllC4() {
    if (_plantedC4.length === 0) {
      showMessage('No C4 planted!', 1500);
      return;
    }

    var anyDetonated = false;
    for (var ci2 = 0; ci2 < _plantedC4.length; ci2++) {
      var charge = _plantedC4[ci2];
      if (!charge.lit) continue;
      anyDetonated = true;

      var cp = charge.mesh.position;
      spawnExplosion(cp.x, cp.y, cp.z, 6, true);
      _scene.remove(charge.mesh);

      /* Destroy target if C4 was near enough */
      var tIdx = charge.targetIndex;
      if (tIdx >= 0 && tIdx < _targets.length && !_targets[tIdx].destroyed) {
        destroyTarget(tIdx);
      }

      /* Damage guards in radius */
      for (var gi = 0; gi < _guards.length; gi++) {
        var gd = _guards[gi];
        if (!gd.alive) continue;
        var gDist = gd.group.position.distanceTo(cp);
        if (gDist < 10) {
          var dmg = (1 - gDist / 10) * 200;
          damageGuard(gi, dmg);
        }
      }

      /* Chain explosion: if fuel tank — extra big boom */
      if (tIdx === 0) {
        /* Fuel tanks: trigger chain */
        for (var fi2 = 0; fi2 < 4; fi2++) {
          spawnExplosion(cp.x + (Math.random() - 0.5) * 16, cp.y + Math.random() * 4, cp.z + (Math.random() - 0.5) * 16, 8, true);
        }
        /* Damage nearby ammo bunker or vehicle yard */
        for (var tj = 0; tj < _targets.length; tj++) {
          if (tj === 0 || _targets[tj].destroyed) continue;
          var chainDist = _targets[tj].pos.distanceTo(new THREE.Vector3(cp.x, cp.y, cp.z));
          if (chainDist < 30) {
            showMessage('CHAIN EXPLOSION! ' + _targets[tj].name + ' caught in blast!', 2000);
          }
        }
      }
    }

    if (!anyDetonated) {
      showMessage('No armed C4!', 1500);
    }

    _plantedC4 = [];
  }

  function destroyTarget(idx) {
    if (idx < 0 || idx >= _targets.length) return;
    var t = _targets[idx];
    if (t.destroyed) return;
    t.destroyed = true;
    _targetsDestroyed++;

    /* Visual: make mesh dark/rubble */
    if (t.mesh && t.mesh.material) {
      t.mesh.material.color.setHex(0x222211);
    }

    spawnExplosion(t.pos.x, t.pos.y, t.pos.z, 8, true);
    showMessage('TARGET DESTROYED: ' + t.name + '\n(' + _targetsDestroyed + '/6)', 3000);

    /* Check win */
    if (_targetsDestroyed >= 6) {
      showMessage('ALL TARGETS DESTROYED!\nReach the convoy truck to escape!', 4000);
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     GUARD AI
  ════════════════════════════════════════════════════════════════════════ */

  function damageGuard(idx, amount) {
    var gd = _guards[idx];
    if (!gd || !gd.alive) return;
    gd.hp -= amount;
    gd.alert = true;
    if (gd.hp <= 0) {
      gd.alive = false;
      _guardsAlive--;
      _scene.remove(gd.group);
    }
  }

  function updateGuards(dt) {
    for (var gi = 0; gi < _guards.length; gi++) {
      var gd = _guards[gi];
      if (!gd.alive) continue;

      var distToPlayer = gd.group.position.distanceTo(_playerGroup.position);

      /* Detection radius */
      var detectRange = (gd.role === 'sentry') ? 60 : 25;
      if (distToPlayer < detectRange && !gd.alert) {
        gd.alert = true;
      }

      if (!gd.alert) {
        /* Patrol */
        gd.patrolTimer -= dt;
        if (gd.patrolTimer <= 0) {
          gd.patrolDir.set((Math.random() - 0.5), 0, (Math.random() - 0.5)).normalize();
          gd.patrolTimer = 3 + Math.random() * 4;
        }
        if (gd.role !== 'sentry') {
          var patrolSpeed = 3;
          gd.group.position.x += gd.patrolDir.x * patrolSpeed * dt;
          gd.group.position.z += gd.patrolDir.z * patrolSpeed * dt;
          /* Stay within depot bounds */
          gd.group.position.x = Math.max(-90, Math.min(90, gd.group.position.x));
          gd.group.position.z = Math.max(-90, Math.min(90, gd.group.position.z));
        }
      } else {
        /* Chase player (sentries stay elevated) */
        if (gd.role !== 'sentry') {
          var chaseDir = new THREE.Vector3().subVectors(_playerGroup.position, gd.group.position);
          chaseDir.y = 0;
          var chaseDist = chaseDir.length();
          if (chaseDist > 0.5) {
            chaseDir.normalize();
            var chaseSpeed = (gd.role === 'commander') ? 6 : 4;
            gd.group.position.x += chaseDir.x * chaseSpeed * dt;
            gd.group.position.z += chaseDir.z * chaseSpeed * dt;
          }
        }

        /* Shoot player */
        if (gd.role !== 'truck_guard' || _targetsDestroyed >= 6) {
          gd.fireTimer -= dt;
          if (gd.fireTimer <= 0) {
            var shotDist = gd.group.position.distanceTo(_playerGroup.position);
            var maxRange = (gd.role === 'sentry') ? 70 : 30;
            if (shotDist < maxRange) {
              var accuracy = (gd.role === 'commander') ? 0.85 : (gd.role === 'sentry') ? 0.7 : 0.6;
              if (Math.random() < accuracy) {
                var dmgAmt = (gd.role === 'commander') ? 25 : (gd.role === 'sentry') ? 15 : 10;
                _playerHP -= dmgAmt;
                if (_playerHP <= 0) {
                  endMissionFail('Player eliminated!');
                }
              }
              gd.fireTimer = 1.5 + Math.random() * 1.5;
            } else {
              gd.fireTimer = 1;
            }
          }
        }

        /* Shoot planted C4 */
        gd.shootC4Timer -= dt;
        if (gd.shootC4Timer <= 0 && _plantedC4.length > 0) {
          for (var ci3 = 0; ci3 < _plantedC4.length; ci3++) {
            var charge2 = _plantedC4[ci3];
            var c4dist = gd.group.position.distanceTo(charge2.mesh.position);
            if (c4dist < 20) {
              /* Destroy the C4 charge */
              _scene.remove(charge2.mesh);
              _plantedC4.splice(ci3, 1);
              showMessage('C4 CHARGE DESTROYED by enemy fire!\nRe-plant with E key.', 2500);
              /* Give a C4 back so player can re-plant */
              _c4Count++;
              break;
            }
          }
          gd.shootC4Timer = 3 + Math.random() * 4;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     TEAM AI
  ════════════════════════════════════════════════════════════════════════ */

  function updateTeam(dt) {
    for (var ti4 = 0; ti4 < _teamMembers.length; ti4++) {
      var tm = _teamMembers[ti4];
      if (!tm.alive) continue;

      /* Follow player loosely */
      var toPlayer = new THREE.Vector3().subVectors(_playerGroup.position, tm.group.position);
      var toPDist = toPlayer.length();
      if (toPDist > 6) {
        toPlayer.normalize();
        tm.group.position.x += toPlayer.x * 5 * dt;
        tm.group.position.z += toPlayer.z * 5 * dt;
      }

      /* Shoot nearest alert guard */
      tm.fireTimer -= dt;
      if (tm.fireTimer <= 0) {
        var nearestGuard = null;
        var nearestDist = 35;
        for (var gi2 = 0; gi2 < _guards.length; gi2++) {
          var gd2 = _guards[gi2];
          if (!gd2.alive) continue;
          var gdist2 = tm.group.position.distanceTo(gd2.group.position);
          if (gdist2 < nearestDist) {
            nearestDist = gdist2;
            nearestGuard = gi2;
          }
        }
        if (nearestGuard !== null) {
          damageGuard(nearestGuard, 20 + Math.random() * 15);
        }
        tm.fireTimer = 1 + Math.random() * 1.5;
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     SHOOTING
  ════════════════════════════════════════════════════════════════════════ */

  function shootBullet() {
    if (_shootCooldown > 0) return;
    _shootCooldown = 0.12;

    var bGeo = new THREE.SphereGeometry(0.08, 4, 4);
    var bMat = new THREE.MeshBasicMaterial({ color: 0xFFDD00 });
    var bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.copy(_playerGroup.position);
    bMesh.position.y += 1.5;

    /* Direction from player yaw */
    var dir = new THREE.Vector3(Math.sin(_playerYaw), (_mouseY - 0.5) * 0.5, Math.cos(_playerYaw));
    dir.normalize();
    var spd = 60;

    _scene.add(bMesh);
    _bullets.push({ mesh: bMesh, vel: dir.multiplyScalar(spd), life: 2 });
  }

  function updateBullets(dt) {
    for (var bi = _bullets.length - 1; bi >= 0; bi--) {
      var b = _bullets[bi];
      b.life -= dt;
      b.mesh.position.addScaledVector(b.vel, dt);

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _bullets.splice(bi, 1);
        continue;
      }

      /* Hit guards */
      var bHit = false;
      for (var gi3 = 0; gi3 < _guards.length; gi3++) {
        var gd3 = _guards[gi3];
        if (!gd3.alive) continue;
        if (b.mesh.position.distanceTo(gd3.group.position) < 1.2) {
          damageGuard(gi3, 35 + Math.random() * 20);
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
          bHit = true;
          break;
        }
      }
      if (bHit) continue;

      /* Hit control panel to open gate */
      if (!_gateOpen && _controlPanel) {
        var cpWorld = new THREE.Vector3();
        _controlPanel.getWorldPosition(cpWorld);
        if (b.mesh.position.distanceTo(cpWorld) < 1.5) {
          _gateOpen = true;
          if (_gateMesh) _gateMesh.visible = false;
          showMessage('Gate control panel shot! Gate open!', 2000);
          _scene.remove(b.mesh);
          _bullets.splice(bi, 1);
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT
  ════════════════════════════════════════════════════════════════════════ */

  function updatePlayer(dt) {
    var speed = 10;
    var dx = 0;
    var dz = 0;

    if (_keys['w'] || _keys['W'] || _keys['ArrowUp'])    dz = -1;
    if (_keys['s'] || _keys['S'] || _keys['ArrowDown'])  dz = 1;
    if (_keys['a'] || _keys['A'] || _keys['ArrowLeft'])  dx = -1;
    if (_keys['d'] || _keys['D'] || _keys['ArrowRight']) dx = 1;

    /* Yaw from mouse */
    var fwd = new THREE.Vector3(
      dx * Math.cos(_playerYaw) + dz * Math.sin(_playerYaw),
      0,
      -dx * Math.sin(_playerYaw) + dz * Math.cos(_playerYaw)
    );

    _playerGroup.position.x += fwd.x * speed * dt;
    _playerGroup.position.z += fwd.z * speed * dt;

    /* Clamp within depot perimeter */
    _playerGroup.position.x = Math.max(-98, Math.min(98, _playerGroup.position.x));
    _playerGroup.position.z = Math.max(-108, Math.min(108, _playerGroup.position.z));

    /* Rotate player to face movement direction */
    _playerGroup.rotation.y = -_playerYaw;

    /* Update internal position ref */
    _playerPos.copy(_playerGroup.position);

    /* E key: plant C4 near target */
    if (_keys['e'] || _keys['E']) {
      _eHoldTimer += dt;
      var nearTarget = findNearTarget(4);
      if (nearTarget >= 0 && !_targets[nearTarget].destroyed) {
        var pct = Math.min(1, _eHoldTimer / C4_PLANT_TIME);
        showPrompt('Planting C4: ' + Math.floor(pct * 100) + '% — ' + _targets[nearTarget].name);
        if (_eHoldTimer >= C4_PLANT_TIME) {
          plantC4OnTarget(nearTarget);
          _eHoldTimer = 0;
        }
      } else if (_eHoldTimer > 0.2) {
        showPrompt('No target in range to plant C4');
      }
    } else {
      if (_eHeld) hidePrompt();
      _eHoldTimer = 0;
      _eHeld = false;
    }

    /* Gate open via SPACE near gatehouse */
    if (_keys[' ']) {
      var gateDist = _playerGroup.position.distanceTo(new THREE.Vector3(0, 0, 100));
      if (gateDist < 12 && !_gateOpen) {
        var cpW = new THREE.Vector3();
        if (_controlPanel) {
          _controlPanel.getWorldPosition(cpW);
          var cpDist = _playerGroup.position.distanceTo(cpW);
          if (cpDist < 8) {
            _gateOpen = true;
            if (_gateMesh) _gateMesh.visible = false;
            showMessage('Gate opened!', 2000);
          }
        }
      }
    }

    /* Escape condition: near truck with all targets done */
    if (_targetsDestroyed >= 6 && _truckAlive) {
      var escDist = _playerGroup.position.distanceTo(_truckPos);
      if (escDist < 8) {
        endMissionSuccess();
      } else if (escDist < 20) {
        showPrompt('BOARD CONVOY TRUCK — Move closer! [' + Math.floor(escDist) + 'm]');
      }
    }

    /* HP regeneration hint */
    if (_playerHP < 30) {
      showPrompt('CRITICAL HEALTH: ' + Math.floor(_playerHP) + '/100');
    }
  }

  function findNearTarget(radius) {
    var best = -1;
    var bestDist = radius;
    for (var ti5 = 0; ti5 < _targets.length; ti5++) {
      if (_targets[ti5].destroyed) continue;
      var dist = _playerGroup.position.distanceTo(_targets[ti5].pos);
      if (dist < bestDist) {
        bestDist = dist;
        best = ti5;
      }
    }
    return best;
  }

  function plantC4OnTarget(targetIndex) {
    if (_c4Count <= 0) {
      showMessage('No C4 charges remaining!', 2000);
      return;
    }

    /* Check if already planted on this target */
    for (var ci4 = 0; ci4 < _plantedC4.length; ci4++) {
      if (_plantedC4[ci4].targetIndex === targetIndex) {
        showMessage('C4 already planted on this target!', 1500);
        return;
      }
    }

    var tPos = _targets[targetIndex].pos;
    var c4Mesh = spawnC4Mesh(tPos.x, tPos.y + 0.5, tPos.z);
    _plantedC4.push({ mesh: c4Mesh, targetIndex: targetIndex, lit: true });
    _c4Count--;

    showMessage('C4 PLANTED on ' + _targets[targetIndex].name + '!\nPress F to detonate. C4 left: ' + _c4Count, 2000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     CAMERA
  ════════════════════════════════════════════════════════════════════════ */

  function updateCamera() {
    if (!_camera) return;
    var camOffset = new THREE.Vector3(
      Math.sin(_playerYaw) * 12,
      8,
      Math.cos(_playerYaw) * 12
    );
    _camera.position.lerp(
      new THREE.Vector3(
        _playerGroup.position.x + camOffset.x,
        _playerGroup.position.y + camOffset.y,
        _playerGroup.position.z + camOffset.z
      ),
      0.12
    );
    _camera.lookAt(
      _playerGroup.position.x,
      _playerGroup.position.y + 1,
      _playerGroup.position.z
    );
  }

  /* ════════════════════════════════════════════════════════════════════════
     REINFORCEMENTS
  ════════════════════════════════════════════════════════════════════════ */

  function spawnReinforcements() {
    _reinforcementsArrived = true;
    showMessage('REINFORCEMENTS ARRIVED!\n40 more soldiers + 2 APCs inbound!', 5000);

    /* 40 extra soldiers from south */
    for (var ri = 0; ri < 40; ri++) {
      var rx = (Math.random() - 0.5) * 30;
      var rz = 100 + Math.random() * 10;
      buildGuard(rx, 0, rz, 'soldier', 80, 0x555533);
    }

    /* 2 APC icons (static for now) */
    var apc1 = box(4, 2.5, 7, 0x334433);
    apc1.position.set(-8, 1.25, 105);
    _scene.add(apc1);
    var apc2 = box(4, 2.5, 7, 0x334433);
    apc2.position.set(8, 1.25, 105);
    _scene.add(apc2);
  }

  function updateTruckGuards(dt) {
    /* Truck guards try to disable convoy */
    if (_truckAlive && _targetsDestroyed >= 6) {
      for (var tgi = 0; tgi < _guards.length; tgi++) {
        var tg2 = _guards[tgi];
        if (!tg2.alive || tg2.role !== 'truck_guard') continue;
        var tdist = tg2.group.position.distanceTo(_truckPos);
        if (tdist < 6) {
          /* Guard disables truck slowly */
          _truckAlive = false;
          showMessage('CONVOY TRUCK DISABLED!\nMission failed — escape route gone.', 4000);
          endMissionFail('Convoy truck disabled!');
          break;
        }
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     WIN / LOSE
  ════════════════════════════════════════════════════════════════════════ */

  function endMissionSuccess() {
    if (_missionComplete || _missionFailed) return;
    _missionComplete = true;
    showMessage('MISSION COMPLETE!\nAll targets destroyed. Convoy escaped!\n\nPress R to reset.', 0);
    _active = false;
  }

  function endMissionFail(reason) {
    if (_missionComplete || _missionFailed) return;
    _missionFailed = true;
    showMessage('MISSION FAILED\n' + reason + '\n\nPress R to reset.', 0);
    _active = false;
  }

  /* ════════════════════════════════════════════════════════════════════════
     INIT / LAUNCH
  ════════════════════════════════════════════════════════════════════════ */

  function launchMission() {
    if (_active) return;
    _active                = true;
    _missionComplete       = false;
    _missionFailed         = false;
    _reinforcementTimer    = 480;
    _reinforcementsArrived = false;
    _gateOpen              = false;
    _gateMesh              = null;
    _controlPanel          = null;
    _truckAlive            = true;
    _truckPos.set(0, 1.5, -105);
    _c4Count               = 6;
    _plantedC4             = [];
    _plantProgress         = 0;
    _plantingTarget        = -1;
    _plantHoldTime         = 0;
    _targets               = [];
    _targetsDestroyed      = 0;
    _guards                = [];
    _guardsAlive           = 0;
    _teamMembers           = [];
    _bullets               = [];
    _explosions            = [];
    _shootCooldown         = 0;
    _playerHP              = 100;
    _playerPos.set(0, 1, 105);
    _playerVel.set(0, 0, 0);
    _playerYaw             = Math.PI; /* face north */
    _eHeld                 = false;
    _eHoldTimer            = 0;
    _sceneObjects          = [];

    /* Clear previous scene objects if any */
    if (_depotGroup && _scene) {
      _scene.remove(_depotGroup);
    }

    /* Lights */
    var ambient = new THREE.AmbientLight(0x334455, 0.5);
    _scene.add(ambient);
    _sceneObjects.push(ambient);

    var sun = new THREE.DirectionalLight(0xFFEECC, 0.9);
    sun.position.set(60, 100, 40);
    _scene.add(sun);
    _sceneObjects.push(sun);

    var fillLight = new THREE.PointLight(0x334466, 0.4, 200);
    fillLight.position.set(-40, 30, -40);
    _scene.add(fillLight);
    _sceneObjects.push(fillLight);

    buildDepot();
    buildAllGuards();
    buildPlayer();
    buildTeam();

    buildHUD();
    updateHUD();
    showMessage('SUPPLY DEPOT RAID\nDestroy 6 targets before reinforcements arrive.\nE-hold to plant C4, F to detonate, SPACE to open gate.\n8 minutes remain.', 5000);
  }

  /* ════════════════════════════════════════════════════════════════════════
     EXPLOSIONS UPDATE
  ════════════════════════════════════════════════════════════════════════ */

  function updateExplosions(dt) {
    for (var ei = _explosions.length - 1; ei >= 0; ei--) {
      var ex = _explosions[ei];
      ex.life -= dt;
      var t2 = ex.life / ex.maxLife;
      ex.mesh.material.opacity = t2;
      ex.mesh.scale.setScalar(1 + (1 - t2) * 1.5);
      if (ex.life <= 0) {
        _scene.remove(ex.mesh);
        _explosions.splice(ei, 1);
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     UPDATE LOOP
  ════════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    /* Check activation keys */
    var now = Date.now();
    if (!_active) {
      if (_keys['s'] || _keys['S']) _sdPressTime.S = now;
      if (_keys['d'] || _keys['D']) _sdPressTime.D = now;
      if (_sdPressTime.S > 0 && _sdPressTime.D > 0 &&
          Math.abs(_sdPressTime.S - _sdPressTime.D) < SD_WINDOW) {
        _sdPressTime.S = 0;
        _sdPressTime.D = 0;
        _scene  = scene;
        _camera = camera;
        _canvas = canvas;
        launchMission();
      }
      return;
    }

    if (_missionComplete || _missionFailed) {
      if (_keys['r'] || _keys['R']) reset();
      return;
    }

    dt = Math.min(dt, 0.05); /* cap to avoid spiral of death */

    /* Cooldowns */
    if (_shootCooldown > 0) _shootCooldown -= dt;

    /* Reinf timer */
    if (!_reinforcementsArrived) {
      _reinforcementTimer -= dt;
      if (_reinforcementTimer <= 0) {
        _reinforcementTimer = 0;
        spawnReinforcements();
        endMissionFail('Reinforcements arrived before all targets destroyed!');
        return;
      }
    }

    /* Msg timer */
    if (_msgTimer > 0) {
      _msgTimer -= dt;
      if (_msgTimer <= 0) {
        hideMessage();
      }
    }

    /* Systems */
    updatePlayer(dt);
    updateGuards(dt);
    updateTeam(dt);
    updateBullets(dt);
    updateExplosions(dt);
    updateTruckGuards(dt);
    updateCamera();
    updateHUD();

    /* Keyboard shortcuts reminder */
    if (!(_keys['e'] || _keys['E'])) {
      var nearT = findNearTarget(5);
      if (nearT >= 0 && !_targets[nearT].destroyed && _c4Count > 0) {
        showPrompt('Near: ' + _targets[nearT].name + '  [Hold E to plant C4]  C4: ' + _c4Count);
      } else if (nearT >= 0 && !_targets[nearT].destroyed && _c4Count === 0) {
        showPrompt('No C4 left! Defend planted charges.');
      } else if (_plantedC4.length > 0) {
        showPrompt('[F] Detonate ' + _plantedC4.length + ' planted C4 charge(s)');
      } else {
        hidePrompt();
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════════
     RESET
  ════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active          = false;
    _missionComplete = false;
    _missionFailed   = false;

    /* Remove DOM */
    if (_hud && _hud.parentNode) _hud.parentNode.removeChild(_hud);
    if (_msgEl && _msgEl.parentNode) _msgEl.parentNode.removeChild(_msgEl);
    if (_promptEl && _promptEl.parentNode) _promptEl.parentNode.removeChild(_promptEl);
    _hud = null;
    _msgEl = null;
    _promptEl = null;

    /* Clean scene objects */
    for (var si = 0; si < _sceneObjects.length; si++) {
      if (_scene) _scene.remove(_sceneObjects[si]);
    }
    _sceneObjects = [];

    /* Remove dynamic objects */
    for (var gi4 = 0; gi4 < _guards.length; gi4++) {
      if (_scene && _guards[gi4].group) _scene.remove(_guards[gi4].group);
    }
    for (var ti6 = 0; ti6 < _teamMembers.length; ti6++) {
      if (_scene && _teamMembers[ti6].group) _scene.remove(_teamMembers[ti6].group);
    }
    for (var bi2 = 0; bi2 < _bullets.length; bi2++) {
      if (_scene && _bullets[bi2].mesh) _scene.remove(_bullets[bi2].mesh);
    }
    for (var ei2 = 0; ei2 < _explosions.length; ei2++) {
      if (_scene && _explosions[ei2].mesh) _scene.remove(_explosions[ei2].mesh);
    }
    for (var ci5 = 0; ci5 < _plantedC4.length; ci5++) {
      if (_scene && _plantedC4[ci5].mesh) _scene.remove(_plantedC4[ci5].mesh);
    }

    if (_playerGroup && _scene) _scene.remove(_playerGroup);
    if (_truckGroup && _scene) _scene.remove(_truckGroup);
    if (_depotGroup && _scene) _scene.remove(_depotGroup);

    _guards    = [];
    _teamMembers = [];
    _bullets   = [];
    _explosions = [];
    _plantedC4 = [];
    _targets   = [];
    _playerGroup = null;
    _truckGroup  = null;
    _depotGroup  = null;

    _sdPressTime.S = 0;
    _sdPressTime.D = 0;

    /* Remove key handlers */
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('click', onClick);
    document.removeEventListener('mousemove', onMouseMove);
  }

  /* ════════════════════════════════════════════════════════════════════════
     INPUT HANDLERS
  ════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.key] = true;

    if (!_active || _missionComplete || _missionFailed) return;

    /* F — detonate C4 */
    if (e.key === 'f' || e.key === 'F') {
      detonateAllC4();
    }
    /* R — reset */
    if (e.key === 'r' || e.key === 'R') {
      if (_missionComplete || _missionFailed) reset();
    }
  }

  function onKeyUp(e) {
    _keys[e.key] = false;
  }

  function onClick(e) {
    if (!_active || _missionComplete || _missionFailed) return;
    shootBullet();
  }

  function onMouseMove(e) {
    if (!_canvas) return;
    _mouseX = e.clientX / window.innerWidth;
    _mouseY = e.clientY / window.innerHeight;
    /* Horizontal mouse = yaw */
    _playerYaw += (e.movementX || 0) * 0.003;
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC INIT
  ════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);
  }

  /* ════════════════════════════════════════════════════════════════════════
     PUBLIC API
  ════════════════════════════════════════════════════════════════════════ */

  return {
    init:   init,
    update: update,
    reset:  reset
  };

}());
