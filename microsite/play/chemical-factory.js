/* ───────────────────────────────────────────────────────────────────────────
   chemical-factory.js — Chemical Weapons Factory Demolition Mission
   API: window.ChemicalFactory = { init, update, reset }
   Activation: C then F within 400ms

   Theme: Destroy a chemical weapons factory before the next batch ships —
   plant charges on 4 reactors and escape before detonation.

   Win:  All 4 charges planted + Director Chen defeated + escape to loading dock
   Lose: All charges detonated without escape, OR player HP reaches 0
   ─────────────────────────────────────────────────────────────────────────── */
window.ChemicalFactory = (function () {
  'use strict';

  /* ── Scene references ──────────────────────────────────────────────────── */
  var _scene  = null;
  var _camera = null;
  var _canvas = null;

  /* ── Activation combo: C then F within 400ms ──────────────────────────── */
  var _cfPressTime = { C: 0, F: 0 };
  var CF_WINDOW    = 400;

  /* ── Game state ────────────────────────────────────────────────────────── */
  var _active          = false;
  var _victory         = false;
  var _defeat          = false;
  var _missionTimer    = 0;

  /* ── Charges system ────────────────────────────────────────────────────── */
  var _chargesPlanted    = 0;     // 0-4
  var _detonationTimer   = 0;     // 60s countdown after all 4 planted
  var _detonationArmed   = false;
  var _plantingCharge    = false;
  var _plantTimer        = 0;
  var _plantTarget       = -1;    // reactor index being charged

  /* ── Reactor charge state (per reactor) ───────────────────────────────── */
  var _reactorCharged    = [false, false, false, false];

  /* ── Toxic gas (Chen at 50%) ───────────────────────────────────────────── */
  var _toxicGasActive    = false;
  var _gasParticles      = [];
  var _gasVentActive     = false;
  var _ventingTerminal   = false;
  var _ventTimer         = 0;

  /* ── Master shutdown terminal ─────────────────────────────────────────── */
  var _terminalMesh      = null;
  var _terminalInteract  = false;
  var _terminalTimer     = 0;
  var TERMINAL_DURATION  = 5;

  /* ── Player ────────────────────────────────────────────────────────────── */
  var _playerMesh   = null;
  var _playerPos    = { x: 0, y: 1, z: 22 };
  var _playerHP     = 100;
  var _playerYaw    = 0;
  var _playerSpeed  = 7;
  var _fireCooldown = 0;
  var _eHeld        = false;
  var _keys         = {};

  /* ── Enemy arrays ──────────────────────────────────────────────────────── */
  var _guards      = [];   // 12 factory workers/guards
  var _engineers   = [];   // 5 chemical engineers
  var _boss        = null; // Plant Director Chen

  /* ── Projectiles ───────────────────────────────────────────────────────── */
  var _playerBullets = [];
  var _enemyBullets  = [];

  /* ── Environment meshes / lights ──────────────────────────────────────── */
  var _envMeshes    = [];
  var _envLights    = [];

  /* ── Reactors ──────────────────────────────────────────────────────────── */
  var _reactors     = [];  // { mesh, pos, chargeMesh, hp }

  /* ── Chemical drums (explosive) ───────────────────────────────────────── */
  var _drums        = [];  // { mesh, pos, hp, exploded }

  /* ── Conveyor items ────────────────────────────────────────────────────── */
  var _conveyorItems = [];

  /* ── Explosions / debris / fire ───────────────────────────────────────── */
  var _explosions   = [];
  var _fireParticles = [];
  var _debris       = [];

  /* ── Escape zone ───────────────────────────────────────────────────────── */
  var _escapeMesh   = null;
  var _escapeActive = false;

  /* ── HUD element ───────────────────────────────────────────────────────── */
  var _hud          = null;
  var _hudResult    = null;

  /* ── Reactor positions ─────────────────────────────────────────────────── */
  var REACTOR_POSITIONS = [
    { x: -14, z: -8  },
    { x: -14, z:  8  },
    { x:  14, z: -8  },
    { x:  14, z:  8  }
  ];

  /* ══════════════════════════════════════════════════════════════════════════
     GEOMETRY / MATERIAL HELPERS
  ══════════════════════════════════════════════════════════════════════════ */

  function makeBox(w, h, d, color, emissive) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.4;
    }
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  }

  function makeCyl(rt, rb, h, segs, color, emissive) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.3;
    }
    return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs || 12), mat);
  }

  function makeSphere(r, segs, color, emissive, opacity) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (emissive !== undefined) {
      mat.emissive = new THREE.Color(emissive);
      mat.emissiveIntensity = 0.5;
    }
    if (opacity !== undefined) {
      mat.transparent = true;
      mat.opacity = opacity;
    }
    return new THREE.Mesh(new THREE.SphereGeometry(r, segs || 8, segs || 8), mat);
  }

  function makeCone(r, h, segs, color) {
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, segs || 8),
      new THREE.MeshLambertMaterial({ color: color }));
  }

  function addToScene(mesh) {
    _scene.add(mesh);
    _envMeshes.push(mesh);
    return mesh;
  }

  function addLight(light) {
    _scene.add(light);
    _envLights.push(light);
    return light;
  }

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = (a.y || 0) - (b.y || 0), dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD ENVIRONMENT
  ══════════════════════════════════════════════════════════════════════════ */

  function buildEnvironment() {
    /* Ambient */
    addLight(new THREE.AmbientLight(0x223322, 0.55));

    /* Main factory floor */
    var floor = makeBox(50, 0.4, 55, 0x444444);
    floor.position.set(0, -0.2, 0);
    addToScene(floor);

    /* Main building walls — hollow large box approximated with 4 wall slabs */
    var wallN = makeBox(50, 12, 1.2, 0x556655);
    wallN.position.set(0, 6, -26);
    addToScene(wallN);

    var wallS = makeBox(50, 12, 1.2, 0x556655);
    wallS.position.set(0, 6, 26);
    addToScene(wallS);

    var wallE = makeBox(1.2, 12, 55, 0x556655);
    wallE.position.set(25, 6, 0);
    addToScene(wallE);

    var wallW = makeBox(1.2, 12, 55, 0x556655);
    wallW.position.set(-25, 6, 0);
    addToScene(wallW);

    /* Sawtooth roof — 6 triangular BoxGeometry ridges */
    buildSawtoothRoof();

    /* Reactor area dividers */
    var divW = makeBox(1, 4, 22, 0x445544);
    divW.position.set(-10, 2, 0);
    addToScene(divW);

    var divE = makeBox(1, 4, 22, 0x445544);
    divE.position.set(10, 2, 0);
    addToScene(divE);

    /* Production line area */
    buildProductionLine();

    /* Hazmat storage */
    buildHazmatStorage();

    /* Control room */
    buildControlRoom();

    /* Loading dock */
    buildLoadingDock();

    /* Ventilation ducts */
    buildVentilation();

    /* Ceiling lights */
    var ceilLights = [
      { x: -16, z: -12 }, { x: -16, z: 0 }, { x: -16, z: 12 },
      { x:  0,  z: -12 }, { x:  0,  z: 0 }, { x:  0,  z: 12 },
      { x:  16, z: -12 }, { x:  16, z: 0 }, { x:  16, z: 12 }
    ];
    var i;
    for (i = 0; i < ceilLights.length; i++) {
      var cl = new THREE.PointLight(0xFFEECC, 0.7, 24);
      cl.position.set(ceilLights[i].x, 10, ceilLights[i].z);
      addLight(cl);
    }
  }

  function buildSawtoothRoof() {
    /* 6 triangular ridge sections approximated with rotated boxes */
    var i;
    for (i = 0; i < 6; i++) {
      var ridge = makeBox(50, 0.5, 3.5, 0x445544);
      ridge.position.set(0, 12.5, -22 + i * 8);
      addToScene(ridge);

      /* Slope A */
      var slopeA = makeBox(50, 3.5, 0.5, 0x4A5E4A);
      slopeA.rotation.x = -Math.PI / 5;
      slopeA.position.set(0, 11.2, -23.5 + i * 8);
      addToScene(slopeA);

      /* Slope B */
      var slopeB = makeBox(50, 3.5, 0.5, 0x4A5E4A);
      slopeB.rotation.x = Math.PI / 5;
      slopeB.position.set(0, 11.2, -20.5 + i * 8);
      addToScene(slopeB);
    }
  }

  function buildProductionLine() {
    /* Flat conveyor base */
    var belt = makeBox(24, 0.4, 2.5, 0x333333);
    belt.position.set(0, 0.2, 2);
    addToScene(belt);

    /* Roller cylinders under conveyor */
    var i;
    for (i = 0; i < 8; i++) {
      var roller = makeCyl(0.25, 0.25, 2.5, 8, 0x555555);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(-10.5 + i * 3, 0.45, 2);
      addToScene(roller);
    }

    /* Chemical drums on conveyor */
    var drumColors = [0xDDAA00, 0xCC8800, 0xEEBB11, 0xCC7700];
    for (i = 0; i < 8; i++) {
      var drum = makeCyl(0.4, 0.4, 0.9, 10, drumColors[i % 4]);
      drum.position.set(-9 + i * 2.8, 0.85, 2);
      _scene.add(drum);
      _drums.push({
        mesh: drum,
        pos:  { x: -9 + i * 2.8, z: 2 },
        hp:   30,
        exploded: false
      });
      _conveyorItems.push(drum);
    }
  }

  function buildHazmatStorage() {
    var i, shelf, barrel;

    /* 3 shelving units — tall BoxGeometry racks */
    var shelfPositions = [
      { x:  18, z: -18 },
      { x:  18, z: -10 },
      { x:  18, z:  -2 }
    ];
    for (i = 0; i < 3; i++) {
      /* Main shelf frame */
      shelf = makeBox(3, 5, 1.2, 0x887755);
      shelf.position.set(shelfPositions[i].x, 2.5, shelfPositions[i].z);
      addToScene(shelf);

      /* Shelf planks */
      var s1 = makeBox(3, 0.15, 1.2, 0x998866);
      s1.position.set(shelfPositions[i].x, 1.5, shelfPositions[i].z);
      addToScene(s1);
      var s2 = makeBox(3, 0.15, 1.2, 0x998866);
      s2.position.set(shelfPositions[i].x, 3.2, shelfPositions[i].z);
      addToScene(s2);

      /* Hazmat barrels on shelves — yellow/orange cylinders */
      var barrelColor = (i % 2 === 0) ? 0xFFCC00 : 0xFF8800;
      var j;
      for (j = 0; j < 3; j++) {
        barrel = makeCyl(0.28, 0.28, 0.7, 10, barrelColor);
        barrel.position.set(shelfPositions[i].x - 0.9 + j * 0.9, 1.95, shelfPositions[i].z);
        addToScene(barrel);

        /* Hazard stripe */
        var stripe = makeBox(0.6, 0.1, 0.62, 0x222222);
        stripe.position.set(shelfPositions[i].x - 0.9 + j * 0.9, 2.1, shelfPositions[i].z);
        addToScene(stripe);

        /* Upper shelf barrels */
        barrel = makeCyl(0.28, 0.28, 0.7, 10, barrelColor);
        barrel.position.set(shelfPositions[i].x - 0.9 + j * 0.9, 3.65, shelfPositions[i].z);
        addToScene(barrel);
      }
    }

    /* Additional loose hazmat barrels on floor */
    var floorBarrels = [
      { x: 16, z: 5, c: 0xFFAA00 },
      { x: 17, z: 5, c: 0xFF8800 },
      { x: 16, z: 7, c: 0xFFCC00 },
      { x: 17, z: 6, c: 0xFFAA00 }
    ];
    for (i = 0; i < 4; i++) {
      var fb = floorBarrels[i];
      var flb = makeCyl(0.38, 0.38, 0.85, 10, fb.c);
      flb.position.set(fb.x, 0.425, fb.z);
      _scene.add(flb);
      _drums.push({
        mesh: flb,
        pos: { x: fb.x, z: fb.z },
        hp: 30,
        exploded: false
      });
    }
  }

  function buildControlRoom() {
    /* Elevated platform */
    var platform = makeBox(10, 0.5, 8, 0x445544);
    platform.position.set(0, 0.25, -18);
    addToScene(platform);

    /* Control room walls */
    var crWall = makeBox(10, 5, 0.4, 0x334433);
    crWall.position.set(0, 3, -22.2);
    addToScene(crWall);

    var crWallL = makeBox(0.4, 5, 8, 0x334433);
    crWallL.position.set(-5, 3, -18);
    addToScene(crWallL);

    var crWallR = makeBox(0.4, 5, 8, 0x334433);
    crWallR.position.set(5, 3, -18);
    addToScene(crWallR);

    /* Slanted window panels — angled boxes */
    var winL = makeBox(3, 2, 0.2, 0x224433, 0x002211);
    winL.rotation.x = 0.3;
    winL.position.set(-2.5, 4.5, -22);
    addToScene(winL);

    var winR = makeBox(3, 2, 0.2, 0x224433, 0x002211);
    winR.rotation.x = 0.3;
    winR.position.set(2.5, 4.5, -22);
    addToScene(winR);

    /* Master shutdown terminal */
    _terminalMesh = makeBox(1.2, 1.8, 0.4, 0x112244, 0x001133);
    _terminalMesh.position.set(0, 1.15, -21.5);
    _scene.add(_terminalMesh);
    _envMeshes.push(_terminalMesh);

    /* Terminal glow */
    var termLight = new THREE.PointLight(0x0044FF, 0.8, 5);
    termLight.position.set(0, 2, -21.5);
    addLight(termLight);

    /* Control room interior lights */
    var crLight = new THREE.PointLight(0x336633, 1.0, 14);
    crLight.position.set(0, 4, -18);
    addLight(crLight);

    /* Steps up to platform */
    var step1 = makeBox(3, 0.3, 0.8, 0x445544);
    step1.position.set(0, 0.15, -13.9);
    addToScene(step1);
    var step2 = makeBox(3, 0.6, 0.8, 0x445544);
    step2.position.set(0, 0.3, -14.7);
    addToScene(step2);
  }

  function buildLoadingDock() {
    /* Loading dock floor — slightly different shade */
    var dockFloor = makeBox(18, 0.4, 10, 0x555545);
    dockFloor.position.set(0, -0.15, 20);
    addToScene(dockFloor);

    /* Rolling door — large flat box on north wall, marked green */
    var rollingDoor = makeBox(8, 8, 0.6, 0x445544);
    rollingDoor.position.set(0, 4, 25.3);
    addToScene(rollingDoor);

    /* Door stripes */
    var i;
    for (i = 0; i < 5; i++) {
      var stripe = makeBox(8, 0.3, 0.7, 0xFFCC00);
      stripe.position.set(0, 1 + i * 1.4, 25.4);
      addToScene(stripe);
    }

    /* Escape zone marker (visible after arming) */
    _escapeMesh = makeCyl(2.5, 2.5, 0.2, 24, 0x00FF88, 0x00AA44);
    _escapeMesh.position.set(0, 0.1, 22);
    _escapeMesh.visible = false;
    _scene.add(_escapeMesh);

    /* Dock lights */
    var dockLight = new THREE.PointLight(0xFFEEAA, 1.0, 20);
    dockLight.position.set(0, 8, 20);
    addLight(dockLight);

    /* Two BoxGeometry trucks */
    buildTruck(-7, 20);
    buildTruck( 7, 20);
  }

  function buildTruck(x, z) {
    var grp = new THREE.Group();

    /* Cab */
    var cab = makeBox(3, 2.5, 3, 0x667755);
    cab.position.set(0, 1.25, -2.5);
    grp.add(cab);

    /* Trailer */
    var trailer = makeBox(3, 2, 6, 0x556644);
    trailer.position.set(0, 1, 1.5);
    grp.add(trailer);

    /* Wheels */
    var wheelColor = 0x222222;
    var wPositions = [
      { x: -1.6, y: 0.4, z: -3 }, { x: 1.6, y: 0.4, z: -3 },
      { x: -1.6, y: 0.4, z:  0 }, { x: 1.6, y: 0.4, z:  0 },
      { x: -1.6, y: 0.4, z:  3 }, { x: 1.6, y: 0.4, z:  3 }
    ];
    var i;
    for (i = 0; i < wPositions.length; i++) {
      var w = makeCyl(0.4, 0.4, 0.3, 10, wheelColor);
      w.rotation.z = Math.PI / 2;
      w.position.set(wPositions[i].x, wPositions[i].y, wPositions[i].z);
      grp.add(w);
    }

    grp.position.set(x, 0, z);
    _scene.add(grp);
    _envMeshes.push(grp);
  }

  function buildVentilation() {
    /* Large horizontal ducts across ceiling */
    var i;

    /* Main longitudinal duct */
    var ductMain = makeCyl(0.8, 0.8, 48, 10, 0x668877);
    ductMain.rotation.z = Math.PI / 2;
    ductMain.position.set(0, 10, 0);
    addToScene(ductMain);

    /* Cross ducts */
    var crossZ = [-12, -4, 4, 12];
    for (i = 0; i < 4; i++) {
      var duct = makeCyl(0.6, 0.6, 46, 10, 0x557766);
      duct.rotation.x = Math.PI / 2;
      duct.position.set(0, 9.5, crossZ[i]);
      addToScene(duct);
    }

    /* Duct joints — SphereGeometry connectors */
    var joints = [
      { x: 0, z: -12 }, { x: 0, z: -4 }, { x: 0, z: 4 }, { x: 0, z: 12 }
    ];
    for (i = 0; i < joints.length; i++) {
      var joint = makeSphere(0.85, 10, 0x668877);
      joint.position.set(joints[i].x, 9.8, joints[i].z);
      addToScene(joint);
    }

    /* Vent openings — thin cylinders hanging down */
    var ventPositions = [
      { x: -12, z: -4 }, { x: 12, z: -4 },
      { x: -12, z:  4 }, { x: 12, z:  4 }
    ];
    for (i = 0; i < ventPositions.length; i++) {
      var vent = makeCyl(0.5, 0.5, 1.5, 8, 0x557766);
      vent.position.set(ventPositions[i].x, 8.5, ventPositions[i].z);
      addToScene(vent);

      var ventGrill = makeBox(1.1, 0.1, 1.1, 0x444444);
      ventGrill.position.set(ventPositions[i].x, 7.7, ventPositions[i].z);
      addToScene(ventGrill);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD REACTORS (4)
  ══════════════════════════════════════════════════════════════════════════ */

  function buildReactors() {
    var i, pos, grp, vessel, cap, base, gauge, pipeA, pipeB, chargeSlot;
    for (i = 0; i < 4; i++) {
      pos = REACTOR_POSITIONS[i];
      grp = new THREE.Group();

      /* Main vessel — large CylinderGeometry */
      vessel = makeCyl(2, 2.2, 7, 14, 0x4A6A5A, 0x1A3A2A);
      vessel.position.set(0, 3.5, 0);
      grp.add(vessel);

      /* Top cap — ConeGeometry */
      cap = makeCone(2, 2, 14, 0x3A5A4A);
      cap.position.set(0, 8, 0);
      grp.add(cap);

      /* Base ring */
      base = makeCyl(2.8, 2.8, 0.4, 14, 0x334433);
      base.position.set(0, 0.2, 0);
      grp.add(base);

      /* Pressure gauge — SphereGeometry */
      gauge = makeSphere(0.35, 8, 0xCCDD88, 0x888822);
      gauge.position.set(2.1, 4.5, 0);
      grp.add(gauge);

      var gaugeLight = new THREE.PointLight(0xAACC33, 0.4, 3);
      gaugeLight.position.set(2.2, 4.5, 0);
      grp.add(gaugeLight);

      /* Inlet pipe — thin CylinderGeometry */
      pipeA = makeCyl(0.22, 0.22, 4, 8, 0x556655);
      pipeA.rotation.z = Math.PI / 2;
      pipeA.position.set(-3, 5, 0);
      grp.add(pipeA);

      /* Outlet pipe — angled downward */
      pipeB = makeCyl(0.22, 0.22, 3, 8, 0x556655);
      pipeB.rotation.z = Math.PI / 4;
      pipeB.position.set(2.5, 2, 0);
      grp.add(pipeB);

      /* Second gauge on pipe */
      var gauge2 = makeSphere(0.25, 6, 0xDDEE99);
      gauge2.position.set(-4.5, 5, 0);
      grp.add(gauge2);

      /* Charge slot indicator — glows when charge planted */
      chargeSlot = makeBox(0.6, 0.6, 0.6, 0x333333);
      chargeSlot.position.set(0, 1.5, 2.3);
      grp.add(chargeSlot);

      grp.position.set(pos.x, 0, pos.z);
      _scene.add(grp);

      _reactors.push({
        mesh:       grp,
        pos:        { x: pos.x, z: pos.z },
        chargeMesh: chargeSlot,
        hp:         200,
        charged:    false,
        index:      i
      });

      _envMeshes.push(grp);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD PLAYER
  ══════════════════════════════════════════════════════════════════════════ */

  function buildPlayer() {
    var grp = new THREE.Group();

    /* Body */
    var body = makeBox(0.6, 1.4, 0.4, 0x334455);
    body.position.set(0, 0.7, 0);
    grp.add(body);

    /* Head */
    var head = makeBox(0.5, 0.5, 0.5, 0xCCAA88);
    head.position.set(0, 1.65, 0);
    grp.add(head);

    /* Helmet */
    var helmet = makeBox(0.58, 0.32, 0.58, 0x223344);
    helmet.position.set(0, 1.82, 0);
    grp.add(helmet);

    grp.position.set(_playerPos.x, 0, _playerPos.z);
    _scene.add(grp);
    _playerMesh = grp;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD ENEMIES
  ══════════════════════════════════════════════════════════════════════════ */

  function buildGuards() {
    /* 12 guards total — mix of hazmat suit (white) and guard uniform (green) */
    var positions = [
      { x: -8, z: -5 }, { x: 8, z: -5 }, { x: -8, z: 5 }, { x: 8, z: 5 },
      { x: -3, z: -20 }, { x: 3, z: -20 }, { x: -6, z: 10 }, { x: 6, z: 10 },
      { x: -20, z: -4 }, { x: 20, z: -4 }, { x: 0, z: -8 }, { x: 0, z: 15 }
    ];
    var i, grp, body, head, helmet;
    for (i = 0; i < 12; i++) {
      grp = new THREE.Group();

      var isHazmat = (i % 3 === 0);
      var bodyColor = isHazmat ? 0xEEEEEE : 0x446644;

      body = makeBox(0.55, 1.3, 0.4, bodyColor);
      body.position.set(0, 0.65, 0);
      grp.add(body);

      head = makeBox(0.45, 0.45, 0.45, isHazmat ? 0xDDEEDD : 0xBB9977);
      head.position.set(0, 1.5, 0);
      grp.add(head);

      if (isHazmat) {
        helmet = makeSphere(0.28, 6, 0xCCDDCC);
        helmet.position.set(0, 1.62, 0);
        grp.add(helmet);
      } else {
        helmet = makeBox(0.52, 0.26, 0.52, 0x223322);
        helmet.position.set(0, 1.68, 0);
        grp.add(helmet);
      }

      grp.position.set(positions[i].x, 0, positions[i].z);
      _scene.add(grp);

      _guards.push({
        mesh:      grp,
        pos:       { x: positions[i].x, z: positions[i].z },
        hp:        75,
        maxHP:     75,
        alive:     true,
        state:     'patrol',
        fireTimer: 2 + Math.random() * 2,
        patrolTimer: 0,
        patrolTarget: { x: positions[i].x + (Math.random() - 0.5) * 10,
                        z: positions[i].z + (Math.random() - 0.5) * 10 }
      });
    }
  }

  function buildEngineers() {
    /* 5 chemical engineers — flee and undo charges */
    var positions = [
      { x: -14, z:  0 }, { x: 14,  z:  0 },
      { x:  -6, z: -12 }, { x: 6, z: -12 },
      { x:   0, z:   6 }
    ];
    var i, grp, body, head, coat;
    for (i = 0; i < 5; i++) {
      grp = new THREE.Group();

      body = makeBox(0.55, 1.3, 0.4, 0x334433);
      body.position.set(0, 0.65, 0);
      grp.add(body);

      /* Lab coat overlay */
      coat = makeBox(0.65, 1.1, 0.5, 0xDDDDBB);
      coat.position.set(0, 0.55, 0);
      grp.add(coat);

      head = makeBox(0.45, 0.45, 0.45, 0xBBAA88);
      head.position.set(0, 1.5, 0);
      grp.add(head);

      /* Hard hat */
      var hat = makeBox(0.55, 0.22, 0.55, 0xFFAA00);
      hat.position.set(0, 1.72, 0);
      grp.add(hat);

      grp.position.set(positions[i].x, 0, positions[i].z);
      _scene.add(grp);

      _engineers.push({
        mesh:        grp,
        pos:         { x: positions[i].x, z: positions[i].z },
        hp:          70,
        maxHP:       70,
        alive:       true,
        state:       'patrol',  /* patrol | flee | sabotage */
        fleeTimer:   0,
        sabotageTimer: 0,
        sabotageTarget: -1,
        fireTimer:   0,
        patrolTimer: 0,
        patrolTarget: { x: positions[i].x, z: positions[i].z }
      });
    }
  }

  function buildBoss() {
    var grp = new THREE.Group();

    /* Executive body — darker suit */
    var body = makeBox(0.65, 1.5, 0.45, 0x223322);
    body.position.set(0, 0.75, 0);
    grp.add(body);

    /* Head */
    var head = makeBox(0.5, 0.5, 0.5, 0xCC9966);
    head.position.set(0, 1.7, 0);
    grp.add(head);

    /* Suit jacket — lighter overlay */
    var jacket = makeBox(0.7, 0.9, 0.5, 0x334433);
    jacket.position.set(0, 0.9, 0);
    grp.add(jacket);

    /* Boss indicator — small sphere above head */
    var marker = makeSphere(0.2, 6, 0xFF2200, 0xFF0000);
    marker.position.set(0, 2.1, 0);
    grp.add(marker);

    grp.position.set(2, 0, -19);  /* Starts in executive office area (control room) */
    _scene.add(grp);

    _boss = {
      mesh:         grp,
      pos:          { x: 2, z: -19 },
      hp:           470,
      maxHP:        470,
      alive:        true,
      phase:        1,        /* 1=normal, 2=gasPhase */
      gasReleased:  false,
      state:        'patrol',
      fireTimer:    1.5,
      moveTimer:    0,
      patrolTarget: { x: 2, z: -17 }
    };
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BUILD HUD
  ══════════════════════════════════════════════════════════════════════════ */

  function buildHUD() {
    _hud = document.createElement('div');
    _hud.id = 'chemical-factory-hud';
    _hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,15,5,0.88)',
      'color:#44FF88',
      'font-family:monospace', 'font-size:13px',
      'padding:7px 16px',
      'border:1px solid #226633',
      'border-radius:3px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap',
      'line-height:1.7',
      'display:none'
    ].join(';');
    document.body.appendChild(_hud);

    _hudResult = document.createElement('div');
    _hudResult.style.cssText = [
      'position:fixed', 'top:40%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,10,0,0.92)',
      'color:#44FF88',
      'font-family:monospace', 'font-size:28px', 'font-weight:bold',
      'padding:24px 42px',
      'border:2px solid #44FF44',
      'border-radius:6px',
      'pointer-events:none',
      'z-index:10000',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(_hudResult);
  }

  function updateHUD() {
    if (!_hud) return;
    var engineersAlive = 0;
    var i;
    for (i = 0; i < _engineers.length; i++) {
      if (_engineers[i].alive) engineersAlive++;
    }

    var bossStr = _boss && _boss.alive
      ? 'HP: ' + _boss.hp + '/' + _boss.maxHP
      : '<span style="color:#888">ELIMINATED</span>';

    var chargeStr = '';
    for (i = 0; i < 4; i++) {
      chargeStr += _reactorCharged[i]
        ? '<span style="color:#FF6600">▣</span>'
        : '<span style="color:#444">□</span>';
    }

    var timerStr = '';
    if (_detonationArmed) {
      var tSec = Math.ceil(_detonationTimer);
      var tColor = tSec <= 15 ? '#FF2222' : '#FF8800';
      timerStr = ' | <span style="color:' + tColor + '">DETONATION: ' + tSec + 's</span>';
    }

    var gasStr = _toxicGasActive && !_gasVentActive
      ? ' | <span style="color:#AAFF00">⚠ TOXIC GAS ACTIVE</span>'
      : (_gasVentActive ? ' | <span style="color:#88FFAA">GAS VENTING...</span>' : '');

    var hpColor = _playerHP > 60 ? '#44FF88' : (_playerHP > 30 ? '#FFAA22' : '#FF3333');

    _hud.innerHTML =
      'CHARGES: ' + chargeStr + ' [' + _chargesPlanted + '/4]' +
      timerStr + gasStr +
      '<br>HP: <span style="color:' + hpColor + '">' + Math.ceil(_playerHP) + '</span>' +
      ' | ENGINEERS: ' + engineersAlive +
      ' | DIRECTOR CHEN — ' + bossStr;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PLAYER MOVEMENT & INPUT
  ══════════════════════════════════════════════════════════════════════════ */

  function movePlayer(dt) {
    var dx = 0, dz = 0;
    var cos = Math.cos(_playerYaw);
    var sin = Math.sin(_playerYaw);

    if (_keys['KeyW'] || _keys['ArrowUp'])    { dx += sin; dz += cos; }
    if (_keys['KeyS'] || _keys['ArrowDown'])  { dx -= sin; dz -= cos; }
    if (_keys['KeyA'] || _keys['ArrowLeft'])  { dx += cos; dz -= sin; }
    if (_keys['KeyD'] || _keys['ArrowRight']) { dx -= cos; dz += sin; }

    var len = Math.sqrt(dx * dx + dz * dz);
    if (len > 0) { dx /= len; dz /= len; }

    _playerPos.x += dx * _playerSpeed * dt;
    _playerPos.z += dz * _playerSpeed * dt;

    /* Clamp inside factory */
    _playerPos.x = Math.max(-24, Math.min(24, _playerPos.x));
    _playerPos.z = Math.max(-25, Math.min(25, _playerPos.z));

    if (_playerMesh) {
      _playerMesh.position.set(_playerPos.x, 0, _playerPos.z);
      _playerMesh.rotation.y = -_playerYaw;
    }

    /* Camera follow — isometric-ish third person */
    if (_camera) {
      _camera.position.set(
        _playerPos.x,
        _playerPos.y + 14,
        _playerPos.z + 18
      );
      _camera.lookAt(_playerPos.x, _playerPos.y, _playerPos.z);
    }
  }

  function fireBullet() {
    var geo = new THREE.BoxGeometry(0.12, 0.12, 0.45);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFF88, emissive: 0xAAAA22 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(_playerPos.x, _playerPos.y + 0.5, _playerPos.z);
    _scene.add(mesh);

    var vx = Math.sin(_playerYaw) * 28;
    var vz = Math.cos(_playerYaw) * 28;

    _playerBullets.push({ mesh: mesh, vel: { x: vx, z: vz }, life: 2 });
  }

  function updatePlayerBullets(dt) {
    var i, j, b, guard, eng, dx, dz, d;
    for (i = _playerBullets.length - 1; i >= 0; i--) {
      b = _playerBullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.z += b.vel.z * dt;

      /* Hit guards */
      for (j = 0; j < _guards.length; j++) {
        guard = _guards[j];
        if (!guard.alive) continue;
        dx = b.mesh.position.x - guard.pos.x;
        dz = b.mesh.position.z - guard.pos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.1) {
          guard.hp -= 22;
          if (guard.hp <= 0) killGuard(j);
          b.life = 0;
          break;
        }
      }

      /* Hit engineers */
      if (b.life > 0) {
        for (j = 0; j < _engineers.length; j++) {
          eng = _engineers[j];
          if (!eng.alive) continue;
          dx = b.mesh.position.x - eng.pos.x;
          dz = b.mesh.position.z - eng.pos.z;
          if (Math.sqrt(dx * dx + dz * dz) < 1.1) {
            eng.hp -= 22;
            if (eng.hp <= 0) killEngineer(j);
            b.life = 0;
            break;
          }
        }
      }

      /* Hit boss */
      if (b.life > 0 && _boss && _boss.alive) {
        dx = b.mesh.position.x - _boss.pos.x;
        dz = b.mesh.position.z - _boss.pos.z;
        if (Math.sqrt(dx * dx + dz * dz) < 1.3) {
          damageBoss(22);
          b.life = 0;
        }
      }

      /* Hit drums */
      if (b.life > 0) {
        for (j = 0; j < _drums.length; j++) {
          var drum = _drums[j];
          if (drum.exploded) continue;
          dx = b.mesh.position.x - drum.pos.x;
          dz = b.mesh.position.z - drum.pos.z;
          if (Math.sqrt(dx * dx + dz * dz) < 0.8) {
            drum.hp -= 20;
            if (drum.hp <= 0) explodeDrum(j);
            b.life = 0;
            break;
          }
        }
      }

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _playerBullets.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY AI
  ══════════════════════════════════════════════════════════════════════════ */

  function updateGuards(dt) {
    var i, g, dx, dz, d, angle;
    for (i = 0; i < _guards.length; i++) {
      g = _guards[i];
      if (!g.alive) continue;

      dx = _playerPos.x - g.pos.x;
      dz = _playerPos.z - g.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);

      if (d < 20) {
        /* Attack mode */
        g.state = 'attack';
        if (d > 2.5) {
          var spd = 3.5 * dt;
          g.pos.x += (dx / d) * spd;
          g.pos.z += (dz / d) * spd;
        } else {
          /* Melee */
          _playerHP -= 10 * dt;
        }
        angle = Math.atan2(dx, dz);
        g.mesh.position.set(g.pos.x, 0, g.pos.z);
        g.mesh.rotation.y = angle;

        /* Fire */
        g.fireTimer -= dt;
        if (g.fireTimer <= 0 && d < 15) {
          fireEnemyBullet(g.pos, 1);
          g.fireTimer = 2.2 + Math.random() * 1.5;
        }
      } else {
        /* Patrol */
        g.state = 'patrol';
        g.patrolTimer -= dt;
        if (g.patrolTimer <= 0) {
          g.patrolTarget = {
            x: g.pos.x + (Math.random() - 0.5) * 14,
            z: g.pos.z + (Math.random() - 0.5) * 14
          };
          g.patrolTimer = 2 + Math.random() * 3;
        }
        var pdx = g.patrolTarget.x - g.pos.x;
        var pdz = g.patrolTarget.z - g.pos.z;
        var pd  = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pd > 0.5) {
          g.pos.x += (pdx / pd) * 2.5 * dt;
          g.pos.z += (pdz / pd) * 2.5 * dt;
          g.mesh.position.set(g.pos.x, 0, g.pos.z);
          g.mesh.rotation.y = Math.atan2(pdx, pdz);
        }
      }
    }
  }

  function updateEngineers(dt) {
    var i, eng, dx, dz, d;
    for (i = 0; i < _engineers.length; i++) {
      eng = _engineers[i];
      if (!eng.alive) continue;

      dx = _playerPos.x - eng.pos.x;
      dz = _playerPos.z - eng.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);

      /* Engineer spots player — flee! */
      if (d < 16) {
        eng.state = 'flee';

        /* Flee direction: opposite of player */
        var fleeDx = -dx / d;
        var fleeDz = -dz / d;
        eng.pos.x += fleeDx * 4 * dt;
        eng.pos.z += fleeDz * 4 * dt;
        eng.pos.x = Math.max(-23, Math.min(23, eng.pos.x));
        eng.pos.z = Math.max(-24, Math.min(24, eng.pos.z));
        eng.mesh.position.set(eng.pos.x, 0, eng.pos.z);
        eng.mesh.rotation.y = Math.atan2(-dx, -dz);

        /* Check if engineer is near a charged reactor — undo the charge */
        checkEngineerUndoCharge(i, dt);
      } else {
        /* Patrol normally */
        eng.state = 'patrol';
        eng.patrolTimer -= dt;
        if (eng.patrolTimer <= 0) {
          eng.patrolTarget = {
            x: eng.pos.x + (Math.random() - 0.5) * 10,
            z: eng.pos.z + (Math.random() - 0.5) * 10
          };
          eng.patrolTimer = 3 + Math.random() * 4;
        }
        var pdx = eng.patrolTarget.x - eng.pos.x;
        var pdz = eng.patrolTarget.z - eng.pos.z;
        var pd  = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pd > 0.5) {
          eng.pos.x += (pdx / pd) * 2 * dt;
          eng.pos.z += (pdz / pd) * 2 * dt;
          eng.mesh.position.set(eng.pos.x, 0, eng.pos.z);
          eng.mesh.rotation.y = Math.atan2(pdx, pdz);

          /* Patrol toward planted charges to undo them */
          checkEngineerUndoCharge(i, dt);
        }
      }
    }
  }

  function checkEngineerUndoCharge(engIdx, dt) {
    var eng = _engineers[engIdx];
    if (!eng.alive) return;
    var r, rx, rz, d;
    var i;
    for (i = 0; i < 4; i++) {
      if (!_reactorCharged[i]) continue;
      rx = _reactors[i].pos.x;
      rz = _reactors[i].pos.z;
      d  = dist2(eng.pos.x, eng.pos.z, rx, rz);
      if (d < 3.0) {
        /* Engineer is sabotaging the charge */
        eng.sabotageTimer += dt;
        if (eng.sabotageTimer >= 4.0) {
          /* Charge undone! */
          eng.sabotageTimer = 0;
          _reactorCharged[i] = false;
          _chargesPlanted--;
          if (_detonationArmed && _chargesPlanted < 4) {
            _detonationArmed = false;
            _detonationTimer = 0;
            _escapeActive    = false;
            if (_escapeMesh) { _escapeMesh.visible = false; }
          }
          /* Visual feedback */
          _reactors[i].chargeMesh.material.color.setHex(0x333333);
          _reactors[i].chargeMesh.material.emissive = new THREE.Color(0x000000);
        }
        return;
      }
    }
    eng.sabotageTimer = 0;
  }

  function updateBoss(dt) {
    if (!_boss || !_boss.alive) return;

    var dx = _playerPos.x - _boss.pos.x;
    var dz = _playerPos.z - _boss.pos.z;
    var d  = Math.sqrt(dx * dx + dz * dz);

    /* Phase 2 at 50% HP — release toxic gas */
    if (!_boss.gasReleased && _boss.hp <= _boss.maxHP * 0.5) {
      _boss.gasReleased = true;
      _boss.phase = 2;
      if (!_toxicGasActive) {
        _toxicGasActive = true;
        spawnToxicGas();
      }
    }

    /* Combat AI */
    if (d < 22) {
      if (d > 3) {
        var spd = (_boss.phase === 2 ? 5 : 3.5) * dt;
        _boss.pos.x += (dx / d) * spd;
        _boss.pos.z += (dz / d) * spd;
      } else {
        /* Melee */
        _playerHP -= 14 * dt;
      }
      _boss.mesh.position.set(_boss.pos.x, 0, _boss.pos.z);
      _boss.mesh.rotation.y = Math.atan2(dx, dz);

      /* Fire — more aggressive in phase 2 */
      _boss.fireTimer -= dt;
      var fireRate = _boss.phase === 2 ? 0.9 : 1.6;
      if (_boss.fireTimer <= 0 && d < 18) {
        fireEnemyBullet(_boss.pos, 3);
        _boss.fireTimer = fireRate + Math.random() * 0.8;
      }
    } else {
      /* Patrol around control room area */
      _boss.moveTimer -= dt;
      if (_boss.moveTimer <= 0) {
        _boss.patrolTarget = {
          x: (Math.random() - 0.5) * 10,
          z: -17 + (Math.random() - 0.5) * 6
        };
        _boss.moveTimer = 3 + Math.random() * 3;
      }
      var pdx = _boss.patrolTarget.x - _boss.pos.x;
      var pdz = _boss.patrolTarget.z - _boss.pos.z;
      var pd  = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pd > 0.5) {
        _boss.pos.x += (pdx / pd) * 3 * dt;
        _boss.pos.z += (pdz / pd) * 3 * dt;
        _boss.mesh.position.set(_boss.pos.x, 0, _boss.pos.z);
        _boss.mesh.rotation.y = Math.atan2(pdx, pdz);
      }
    }
  }

  function damageBoss(amount) {
    if (!_boss || !_boss.alive) return;
    _boss.hp -= amount;
    if (_boss.hp <= 0) {
      _boss.hp    = 0;
      _boss.alive = false;
      _boss.mesh.visible = false;
      spawnExplosion(_boss.pos.x, 1, _boss.pos.z, 2.5);
    }
  }

  function killGuard(idx) {
    var g = _guards[idx];
    g.alive = false;
    g.mesh.visible = false;
    spawnExplosion(g.pos.x, 0.5, g.pos.z, 1.2);
  }

  function killEngineer(idx) {
    var eng = _engineers[idx];
    eng.alive = false;
    eng.mesh.visible = false;
    spawnExplosion(eng.pos.x, 0.5, eng.pos.z, 1.2);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENEMY BULLETS
  ══════════════════════════════════════════════════════════════════════════ */

  function fireEnemyBullet(fromPos, damage) {
    var geo = new THREE.BoxGeometry(0.1, 0.1, 0.38);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF6633, emissive: 0x662211 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(fromPos.x, 1.0, fromPos.z);
    _scene.add(mesh);

    var dx = _playerPos.x - fromPos.x;
    var dz = _playerPos.z - fromPos.z;
    var d  = Math.sqrt(dx * dx + dz * dz) || 1;
    /* Add inaccuracy */
    var spread = 0.15;
    var vx = (dx / d + (Math.random() - 0.5) * spread) * 18;
    var vz = (dz / d + (Math.random() - 0.5) * spread) * 18;

    _enemyBullets.push({ mesh: mesh, vel: { x: vx, z: vz }, life: 2, damage: damage });
  }

  function updateEnemyBullets(dt) {
    var i, b, dx, dz, d;
    for (i = _enemyBullets.length - 1; i >= 0; i--) {
      b = _enemyBullets[i];
      b.life -= dt;
      b.mesh.position.x += b.vel.x * dt;
      b.mesh.position.z += b.vel.z * dt;

      dx = b.mesh.position.x - _playerPos.x;
      dz = b.mesh.position.z - _playerPos.z;
      d  = Math.sqrt(dx * dx + dz * dz);

      if (d < 0.85) {
        _playerHP -= b.damage;
        b.life = 0;
      }

      if (b.life <= 0) {
        _scene.remove(b.mesh);
        _enemyBullets.splice(i, 1);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CHARGE PLANTING
  ══════════════════════════════════════════════════════════════════════════ */

  function tryPlantCharge(dt) {
    if (!_eHeld) {
      /* Cancel any in-progress plant */
      _plantingCharge = false;
      _plantTimer     = 0;
      _plantTarget    = -1;
      return;
    }

    /* Check if terminal interaction takes priority */
    var tDist = dist2(_playerPos.x, _playerPos.z, 0, -21.5);
    if (tDist < 3) {
      tryShutdownTerminal(dt);
      return;
    }

    /* Find nearest uncharged reactor */
    var i, r, d, nearest = -1, nearestDist = 999;
    for (i = 0; i < 4; i++) {
      if (_reactorCharged[i]) continue;
      r = _reactors[i];
      d = dist2(_playerPos.x, _playerPos.z, r.pos.x, r.pos.z);
      if (d < 4 && d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }

    if (nearest === -1) {
      _plantingCharge = false;
      _plantTimer     = 0;
      _plantTarget    = -1;
      return;
    }

    if (_plantTarget !== nearest) {
      /* New target */
      _plantTarget    = nearest;
      _plantTimer     = 0;
      _plantingCharge = true;
    }

    _plantTimer += dt;

    /* 3 second plant duration */
    if (_plantTimer >= 3.0) {
      plantCharge(nearest);
      _plantTimer     = 0;
      _plantTarget    = -1;
      _plantingCharge = false;
    }
  }

  function plantCharge(reactorIdx) {
    if (_reactorCharged[reactorIdx]) return;
    _reactorCharged[reactorIdx] = true;
    _chargesPlanted++;

    /* Visual — charge cube glows red */
    _reactors[reactorIdx].chargeMesh.material.color.setHex(0xFF3300);
    _reactors[reactorIdx].chargeMesh.material.emissive = new THREE.Color(0xFF1100);
    _reactors[reactorIdx].chargeMesh.material.emissiveIntensity = 0.8;

    /* Charge indicator light */
    var cLight = new THREE.PointLight(0xFF4400, 1.2, 5);
    cLight.position.set(_reactors[reactorIdx].pos.x, 2, _reactors[reactorIdx].pos.z);
    _scene.add(cLight);
    _envLights.push(cLight);

    /* All 4 planted — start countdown */
    if (_chargesPlanted >= 4) {
      armDetonation();
    }
  }

  function armDetonation() {
    _detonationArmed = true;
    _detonationTimer = 60;
    _escapeActive    = true;
    if (_escapeMesh) { _escapeMesh.visible = true; }
    checkWinCondition();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MASTER SHUTDOWN TERMINAL
  ══════════════════════════════════════════════════════════════════════════ */

  function tryShutdownTerminal(dt) {
    if (_gasVentActive || !_toxicGasActive) return;
    if (!_eHeld) {
      _terminalInteract = false;
      _terminalTimer    = 0;
      return;
    }
    _terminalInteract = true;
    _ventTimer += dt;

    /* Flash terminal */
    if (_terminalMesh) {
      _terminalMesh.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.02) * 0.3;
    }

    if (_ventTimer >= TERMINAL_DURATION) {
      _gasVentActive    = true;
      _terminalInteract = false;
      _ventTimer        = 0;
      clearToxicGas();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     TOXIC GAS
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnToxicGas() {
    /* Spawn SphereGeometry gas clouds throughout the factory */
    var gasPositions = [
      { x:  0,  z:  0 }, { x: -8,  z: -8 }, { x:  8,  z: -8 },
      { x: -8,  z:  8 }, { x:  8,  z:  8 }, { x:  0,  z: -14 },
      { x: -5,  z:  5 }, { x:  5,  z:  5 }, { x:  0,  z:  10 },
      { x: -12, z:  0 }, { x:  12, z:  0 }, { x:  0,  z: -5  },
      { x: -4,  z: -4 }, { x:  4,  z: -4 }, { x: -4,  z:  4 },
      { x:  4,  z:  4 }
    ];
    var i, sphere;
    for (i = 0; i < gasPositions.length; i++) {
      sphere = makeSphere(1.8 + Math.random() * 1.2, 8, 0xAAFF33, 0x88CC22, 0.35);
      sphere.position.set(
        gasPositions[i].x + (Math.random() - 0.5) * 4,
        1.5 + Math.random() * 2,
        gasPositions[i].z + (Math.random() - 0.5) * 4
      );
      _scene.add(sphere);
      _gasParticles.push({
        mesh:   sphere,
        baseX:  sphere.position.x,
        baseY:  sphere.position.y,
        baseZ:  sphere.position.z,
        drift:  (Math.random() - 0.5) * 0.5,
        phase:  Math.random() * Math.PI * 2,
        active: true
      });
    }

    /* Ominous yellow-green ambient light */
    var gasLight = new THREE.PointLight(0x88FF22, 0.6, 50);
    gasLight.position.set(0, 6, 0);
    _scene.add(gasLight);
    _envLights.push(gasLight);
  }

  function updateToxicGas(dt) {
    if (!_toxicGasActive) return;

    var i, gp, dx, dz, d;
    for (i = 0; i < _gasParticles.length; i++) {
      gp = _gasParticles[i];
      if (!gp.active) continue;

      /* Drift motion */
      gp.phase += dt * 0.8;
      gp.mesh.position.x = gp.baseX + Math.sin(gp.phase) * 1.2;
      gp.mesh.position.y = gp.baseY + Math.sin(gp.phase * 1.3) * 0.6;
      gp.mesh.position.z = gp.baseZ + Math.cos(gp.phase * 0.9) * 1.0;

      /* Damage player if inside gas cloud */
      dx = _playerPos.x - gp.mesh.position.x;
      dz = _playerPos.z - gp.mesh.position.z;
      d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 3) {
        _playerHP -= 5 * dt;
      }
    }
  }

  function clearToxicGas() {
    var i;
    for (i = 0; i < _gasParticles.length; i++) {
      _scene.remove(_gasParticles[i].mesh);
      _gasParticles[i].active = false;
    }
    _gasParticles  = [];
    _toxicGasActive = false;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DRUM EXPLOSIONS
  ══════════════════════════════════════════════════════════════════════════ */

  function explodeDrum(drumIdx) {
    var drum = _drums[drumIdx];
    if (drum.exploded) return;
    drum.exploded = true;
    _scene.remove(drum.mesh);

    spawnExplosion(drum.pos.x, 1, drum.pos.z, 5);

    /* Check chain reaction — damage nearby drums */
    var i, other, dx, dz, d;
    for (i = 0; i < _drums.length; i++) {
      if (i === drumIdx || _drums[i].exploded) continue;
      other = _drums[i];
      dx = other.pos.x - drum.pos.x;
      dz = other.pos.z - drum.pos.z;
      d  = Math.sqrt(dx * dx + dz * dz);
      if (d < 6) {
        /* Chain: damage nearby drum after short delay — simulate with reduced HP */
        other.hp -= 35;
        if (other.hp <= 0) {
          explodeDrum(i);
        }
      }
    }

    /* Damage player if close */
    var px = _playerPos.x - drum.pos.x;
    var pz = _playerPos.z - drum.pos.z;
    var pd = Math.sqrt(px * px + pz * pz);
    if (pd < 6) {
      _playerHP -= Math.max(0, 40 * (1 - pd / 6));
    }

    /* Damage enemies in AoE */
    var j;
    for (j = 0; j < _guards.length; j++) {
      if (!_guards[j].alive) continue;
      dx = _guards[j].pos.x - drum.pos.x;
      dz = _guards[j].pos.z - drum.pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 6) {
        _guards[j].hp -= 40;
        if (_guards[j].hp <= 0) killGuard(j);
      }
    }
    for (j = 0; j < _engineers.length; j++) {
      if (!_engineers[j].alive) continue;
      dx = _engineers[j].pos.x - drum.pos.x;
      dz = _engineers[j].pos.z - drum.pos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 6) {
        _engineers[j].hp -= 40;
        if (_engineers[j].hp <= 0) killEngineer(j);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EXPLOSIONS / VFX
  ══════════════════════════════════════════════════════════════════════════ */

  function spawnExplosion(x, y, z, radius) {
    /* Expanding sphere */
    var sphere = makeSphere(radius, 10, 0xFF4400, 0xFF2200, 0.85);
    sphere.position.set(x, y, z);
    _scene.add(sphere);

    /* Flash light */
    var light = new THREE.PointLight(0xFF6600, 6, radius * 5);
    light.position.set(x, y, z);
    _scene.add(light);

    _explosions.push({
      mesh:  sphere,
      light: light,
      life:  0.8,
      maxLife: 0.8,
      baseRadius: radius
    });

    /* Spawn debris */
    spawnDebris(x, y, z, Math.floor(radius * 2));
  }

  function spawnDebris(x, y, z, count) {
    var i, d, ox, oy, oz;
    for (i = 0; i < count; i++) {
      ox = (Math.random() - 0.5) * 3;
      oy = Math.random() * 2;
      oz = (Math.random() - 0.5) * 3;
      d  = makeBox(0.18, 0.18, 0.18, 0x443322);
      d.position.set(x + ox, y + oy, z + oz);
      _scene.add(d);
      _debris.push({
        mesh: d,
        vel:  { x: (Math.random() - 0.5) * 5, y: 3 + Math.random() * 4, z: (Math.random() - 0.5) * 5 },
        life: 1.5 + Math.random() * 2
      });
    }
  }

  function updateExplosions(dt) {
    var i, exp, t;
    for (i = _explosions.length - 1; i >= 0; i--) {
      exp = _explosions[i];
      exp.life -= dt;
      t = exp.life / exp.maxLife;
      var scale = (1 + (1 - t) * 1.5);
      exp.mesh.scale.set(scale, scale, scale);
      exp.mesh.material.opacity = t * 0.8;
      exp.light.intensity = Math.max(0, t * 6);
      if (exp.life <= 0) {
        _scene.remove(exp.mesh);
        _scene.remove(exp.light);
        _explosions.splice(i, 1);
      }
    }
  }

  function updateDebris(dt) {
    var i, d;
    for (i = _debris.length - 1; i >= 0; i--) {
      d = _debris[i];
      d.life -= dt;
      d.vel.y -= 9 * dt;
      d.mesh.position.x += d.vel.x * dt;
      d.mesh.position.y += d.vel.y * dt;
      d.mesh.position.z += d.vel.z * dt;
      d.mesh.rotation.x += 3 * dt;
      d.mesh.rotation.z += 2 * dt;
      if (d.mesh.position.y < 0) {
        d.mesh.position.y = 0;
        d.vel.y *= -0.3;
        d.vel.x *= 0.7;
        d.vel.z *= 0.7;
      }
      if (d.life <= 0) {
        _scene.remove(d.mesh);
        _debris.splice(i, 1);
      }
    }
  }

  function updateConveyor(dt) {
    var i;
    for (i = 0; i < _conveyorItems.length; i++) {
      _conveyorItems[i].position.x -= 1.5 * dt;
      if (_conveyorItems[i].position.x < -13) {
        _conveyorItems[i].position.x = 13;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     DETONATION / ESCAPE
  ══════════════════════════════════════════════════════════════════════════ */

  function updateDetonation(dt) {
    if (!_detonationArmed) return;
    _detonationTimer -= dt;

    /* Pulse reactor charge lights */
    var i;
    for (i = 0; i < 4; i++) {
      if (!_reactorCharged[i]) continue;
      _reactors[i].chargeMesh.material.emissiveIntensity =
        0.4 + Math.abs(Math.sin(Date.now() * 0.006)) * 0.8;
    }

    /* Spin escape marker */
    if (_escapeMesh) {
      _escapeMesh.rotation.y += dt * 2.5;
    }

    /* Check player at escape zone */
    if (_escapeActive && _boss && !_boss.alive) {
      var ed = dist2(_playerPos.x, _playerPos.z, 0, 22);
      if (ed < 3.5) {
        triggerVictory();
        return;
      }
    }

    if (_detonationTimer <= 0) {
      /* BOOM — factory destroyed */
      triggerDetonation();
    }
  }

  function triggerDetonation() {
    var i;
    for (i = 0; i < 4; i++) {
      var r = _reactors[i];
      spawnExplosion(r.pos.x, 3, r.pos.z, 8);
    }
    /* Player dies if not escaped */
    if (!_victory) {
      _playerHP = 0;
      triggerDefeat('FACTORY DESTROYED\nESCAPE FAILED');
    }
  }

  function checkWinCondition() {
    /* Win: 4 charges planted + boss dead + escape (checked in updateDetonation) */
    /* This checks whether escape is unlocked */
    if (_chargesPlanted >= 4 && _boss && !_boss.alive && _escapeActive) {
      /* escape check is in updateDetonation loop */
    }
  }

  function triggerVictory() {
    if (_victory || _defeat) return;
    _victory = true;
    _active  = false;

    /* Final detonation sequence */
    var i;
    for (i = 0; i < 4; i++) {
      spawnExplosion(_reactors[i].pos.x, 3, _reactors[i].pos.z, 7);
    }

    showResult(
      'MISSION COMPLETE',
      'Factory Destroyed — Batch Eliminated',
      '#44FF88', '#226633'
    );
  }

  function triggerDefeat(msg) {
    if (_victory || _defeat) return;
    _defeat = true;
    _active = false;
    showResult(
      'MISSION FAILED',
      msg || 'Operator Down',
      '#FF4444', '#661111'
    );
  }

  function showResult(title, sub, color, borderColor) {
    if (!_hudResult) return;
    _hudResult.style.borderColor = borderColor;
    _hudResult.style.color = color;
    _hudResult.innerHTML = title + '<br><span style="font-size:15px;color:#AACCAA">' + sub + '</span>';
    _hudResult.style.display = 'block';
    setTimeout(function () {
      if (_hudResult) { _hudResult.style.display = 'none'; }
      reset();
    }, 6000);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ESCAPE ZONE ANIMATION
  ══════════════════════════════════════════════════════════════════════════ */

  function updateEscapeMarker(dt) {
    if (!_escapeMesh || !_escapeMesh.visible) return;
    _escapeMesh.rotation.y += dt * 2;
    _escapeMesh.material.emissiveIntensity = 0.3 + Math.abs(Math.sin(Date.now() * 0.005)) * 0.5;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     INPUT HANDLING
  ══════════════════════════════════════════════════════════════════════════ */

  function onKeyDown(e) {
    _keys[e.code] = true;

    var now = Date.now();

    /* Activation: C then F within 400ms */
    if (e.code === 'KeyC') { _cfPressTime.C = now; }
    if (e.code === 'KeyF') { _cfPressTime.F = now; }

    /* Check combo: C pressed first, then F */
    if (e.code === 'KeyF' && _cfPressTime.C > 0) {
      if ((now - _cfPressTime.C) <= CF_WINDOW && !_active && !_victory && !_defeat) {
        _cfPressTime.C = 0;
        _cfPressTime.F = 0;
        launch();
        return;
      }
    }

    if (!_active) return;

    if (e.code === 'KeyE') {
      _eHeld = true;
    }
  }

  function onKeyUp(e) {
    _keys[e.code] = false;
    if (e.code === 'KeyE') {
      _eHeld          = false;
      _plantingCharge = false;
      _plantTimer     = 0;
      _plantTarget    = -1;
      _terminalInteract = false;
      _ventTimer      = 0;
    }
  }

  function onMouseMove(e) {
    if (!_active) return;
    var rect = _canvas
      ? _canvas.getBoundingClientRect()
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    var nx = (e.clientX - rect.left) / rect.width * 2 - 1;
    _playerYaw = -nx * Math.PI;
  }

  function onMouseDown(e) {
    if (!_active) return;
    if (e.button === 0 && _fireCooldown <= 0) {
      fireBullet();
      _fireCooldown = 0.15;
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LAUNCH
  ══════════════════════════════════════════════════════════════════════════ */

  function launch() {
    if (_active) return;
    _active          = true;
    _victory         = false;
    _defeat          = false;
    _missionTimer    = 0;
    _playerHP        = 100;
    _playerPos       = { x: 0, y: 1, z: 22 };
    _playerYaw       = 0;
    _chargesPlanted  = 0;
    _reactorCharged  = [false, false, false, false];
    _detonationArmed = false;
    _detonationTimer = 0;
    _escapeActive    = false;
    _toxicGasActive  = false;
    _gasVentActive   = false;
    _terminalInteract = false;
    _ventTimer       = 0;
    _plantingCharge  = false;
    _plantTimer      = 0;
    _plantTarget     = -1;
    _eHeld           = false;
    _fireCooldown    = 0;

    buildEnvironment();
    buildReactors();
    buildPlayer();
    buildGuards();
    buildEngineers();
    buildBoss();

    if (_camera) {
      _camera.position.set(0, 20, 30);
      _camera.lookAt(0, 0, 0);
    }

    if (_hud) { _hud.style.display = 'block'; }
    if (_hudResult) { _hudResult.style.display = 'none'; }
    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC: init
  ══════════════════════════════════════════════════════════════════════════ */

  function init(scene, camera, canvas) {
    _scene  = scene;
    _camera = camera;
    _canvas = canvas;

    buildHUD();
    if (_hud) { _hud.style.display = 'none'; }

    window.addEventListener('keydown',   onKeyDown);
    window.addEventListener('keyup',     onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC: update
  ══════════════════════════════════════════════════════════════════════════ */

  function update(dt, scene, camera, canvas) {
    if (scene)  { _scene  = scene;  }
    if (camera) { _camera = camera; }
    if (canvas) { _canvas = canvas; }

    if (!_active) return;

    if (dt > 0.1) { dt = 0.1; }

    _missionTimer    += dt;
    _fireCooldown    -= dt;
    if (_fireCooldown < 0) { _fireCooldown = 0; }

    /* Player */
    movePlayer(dt);

    /* Charge planting / terminal interaction */
    tryPlantCharge(dt);

    /* Enemies */
    updateGuards(dt);
    updateEngineers(dt);
    updateBoss(dt);

    /* Bullets */
    updatePlayerBullets(dt);
    updateEnemyBullets(dt);

    /* Toxic gas */
    updateToxicGas(dt);

    /* Detonation countdown */
    updateDetonation(dt);

    /* Environment */
    updateConveyor(dt);
    updateEscapeMarker(dt);

    /* VFX */
    updateExplosions(dt);
    updateDebris(dt);

    /* Win/lose checks */
    if (_playerHP <= 0 && !_defeat && !_victory) {
      triggerDefeat('Operator Down');
    }

    updateHUD();
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PUBLIC: reset
  ══════════════════════════════════════════════════════════════════════════ */

  function reset() {
    _active  = false;
    _victory = false;
    _defeat  = false;

    var i, s = _scene;

    /* Remove environment */
    for (i = 0; i < _envMeshes.length; i++) {
      if (s) { s.remove(_envMeshes[i]); }
    }
    for (i = 0; i < _envLights.length; i++) {
      if (s) { s.remove(_envLights[i]); }
    }

    /* Remove reactors */
    for (i = 0; i < _reactors.length; i++) {
      if (s) { s.remove(_reactors[i].mesh); }
    }

    /* Remove player */
    if (_playerMesh && s) { s.remove(_playerMesh); }

    /* Remove guards */
    for (i = 0; i < _guards.length; i++) {
      if (s) { s.remove(_guards[i].mesh); }
    }

    /* Remove engineers */
    for (i = 0; i < _engineers.length; i++) {
      if (s) { s.remove(_engineers[i].mesh); }
    }

    /* Remove boss */
    if (_boss && s) { s.remove(_boss.mesh); }

    /* Remove drums */
    for (i = 0; i < _drums.length; i++) {
      if (!_drums[i].exploded && s) { s.remove(_drums[i].mesh); }
    }

    /* Remove conveyor items */
    for (i = 0; i < _conveyorItems.length; i++) {
      if (s) { s.remove(_conveyorItems[i]); }
    }

    /* Remove escape mesh */
    if (_escapeMesh && s) { s.remove(_escapeMesh); }

    /* Remove gas particles */
    for (i = 0; i < _gasParticles.length; i++) {
      if (s) { s.remove(_gasParticles[i].mesh); }
    }

    /* Remove player bullets */
    for (i = 0; i < _playerBullets.length; i++) {
      if (s) { s.remove(_playerBullets[i].mesh); }
    }

    /* Remove enemy bullets */
    for (i = 0; i < _enemyBullets.length; i++) {
      if (s) { s.remove(_enemyBullets[i].mesh); }
    }

    /* Remove explosions */
    for (i = 0; i < _explosions.length; i++) {
      if (s) {
        s.remove(_explosions[i].mesh);
        s.remove(_explosions[i].light);
      }
    }

    /* Remove debris */
    for (i = 0; i < _debris.length; i++) {
      if (s) { s.remove(_debris[i].mesh); }
    }

    /* Clear arrays */
    _envMeshes     = [];
    _envLights     = [];
    _reactors      = [];
    _guards        = [];
    _engineers     = [];
    _boss          = null;
    _drums         = [];
    _conveyorItems = [];
    _gasParticles  = [];
    _playerBullets = [];
    _enemyBullets  = [];
    _explosions    = [];
    _debris        = [];
    _fireParticles = [];
    _playerMesh    = null;
    _terminalMesh  = null;
    _escapeMesh    = null;

    /* Reset state */
    _playerHP        = 100;
    _chargesPlanted  = 0;
    _reactorCharged  = [false, false, false, false];
    _detonationArmed = false;
    _detonationTimer = 0;
    _escapeActive    = false;
    _toxicGasActive  = false;
    _gasVentActive   = false;
    _terminalInteract = false;
    _ventTimer       = 0;
    _plantingCharge  = false;
    _plantTimer      = 0;
    _plantTarget     = -1;
    _eHeld           = false;
    _fireCooldown    = 0;
    _missionTimer    = 0;

    if (_hud)       { _hud.style.display       = 'none'; }
    if (_hudResult) { _hudResult.style.display  = 'none'; }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════════════════════════════════════ */

  return { init: init, update: update, reset: reset };

}());
