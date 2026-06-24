window.ResearchStation = (function () {
  'use strict';

  var MODULE_NAME = 'ResearchStation';
  var ACTIVATION_KEY_A = 'r';
  var ACTIVATION_KEY_B = 's';
  var ACTIVATION_WINDOW = 400;

  // ─── State ────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    scene: null,
    camera: null,
    renderer: null,
    hudEl: null,
    hudInterval: null,
    animFrameId: null,
    lastTime: 0,

    // Player
    playerPos: { x: 0, y: 1.6, z: 60 },
    playerHP: 100,
    playerSpeed: 6,
    keysDown: {},
    keyTimes: {},
    yaw: 0,
    pitch: 0,
    mouseLocked: false,

    // Win / lose
    gameOver: false,
    gameWon: false,

    // Artifacts
    artifactTotal: 5,
    artifactsSecured: 0,
    artifactObjects: [],        // { mesh, glassMesh, broken, secured, secureTimer, secureActive }
    selfDestructTriggered: false,
    selfDestructTimer: 90,

    // Enemies
    enemies: [],                // { mesh, hp, maxHp, type, alive, patrol, timer, speed }
    bossAlive: true,
    bossMesh: null,
    bossHP: 480,
    bossMaxHP: 480,
    bossTeleportTimer: 0,
    bossTeleportCooldown: 20,
    bossShieldHP: 3,
    bossShieldMax: 3,
    bossShieldRecharging: false,
    bossShieldRechargeTimer: 0,
    bossShieldRechargeDuration: 10,
    bossShieldMesh: null,
    bossShieldActive: true,

    // Specimen
    specimenAlive: true,
    specimenMesh: null,
    specimenHP: 30,
    specimenStunned: false,
    specimenStunTimer: 0,
    specimenKilled: false,

    // Power relay arc
    arcAvailable: true,
    arcUsed: false,
    transformerMesh: null,
    arcStunTimer: 0,
    arcStunActive: false,
    arcStunDuration: 5,

    // Environment objects
    allObjects: [],
    displayCases: [],
    centrifuges: [],
    corridorMeshes: [],
    buildings: [],

    // Interact prompt
    interactPromptEl: null,
    eHoldTimer: 0,
    eHoldTarget: null,

    // Shooting
    shootCooldown: 0,
    muzzleFlashTimer: 0,
    muzzleFlashMesh: null,

    // Win overlay timeout
    winTimeout: null
  };

  // ─── Colours ──────────────────────────────────────────────────────────────
  var C_GROUND        = 0xDDEEFF;
  var C_SNOW          = 0xEEF4FF;
  var C_BUILDING      = 0x334455;
  var C_BUILDING2     = 0x2A3A4A;
  var C_CORRIDOR      = 0x3A4A5A;
  var C_GLASS         = 0x88CCEE;
  var C_ARTIFACT      = 0x00FFCC;
  var C_GUARD         = 0x334455;
  var C_CONTAIN       = 0x223344;
  var C_BOSS          = 0x112233;
  var C_SPECIMEN      = 0x223300;
  var C_SHIELD        = 0x0088FF;
  var C_TRANSFORMER   = 0x445566;
  var C_CENTRIFUGE    = 0x556677;
  var C_MICROSCOPE    = 0x667788;
  var C_JET           = 0x445566;
  var C_CELL          = 0x334455;
  var C_FLOOR         = 0x2A3A4A;
  var C_ARC           = 0x44FFFF;

  // ─── Pending activation keys ───────────────────────────────────────────────
  var _pendingKeyTimes = {};

  // ═══════════════════════════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════════════════════════
  function init() {
    if (state.active) return;
    state.active = true;

    if (typeof THREE === 'undefined') {
      console.warn('[' + MODULE_NAME + '] THREE.js not found');
      return;
    }

    resetState();
    setupScene();
    buildGround();
    buildComplexLayout();
    buildArtifactHall();
    buildLaboratory();
    buildContainmentWing();
    buildPowerRelayRoom();
    buildEscapeHangar();
    buildEnemies();
    buildBoss();
    buildSpecimen();
    buildHUD();
    buildInteractPrompt();
    buildMuzzleFlash();
    bindKeys();
    bindMouse();
    animate(0);
  }

  function resetState() {
    state.playerPos = { x: 0, y: 1.6, z: 60 };
    state.playerHP = 100;
    state.yaw = 0;
    state.pitch = 0;
    state.gameOver = false;
    state.gameWon = false;
    state.artifactsSecured = 0;
    state.artifactObjects = [];
    state.selfDestructTriggered = false;
    state.selfDestructTimer = 90;
    state.enemies = [];
    state.bossAlive = true;
    state.bossHP = 480;
    state.bossTeleportTimer = 0;
    state.bossShieldHP = 3;
    state.bossShieldRecharging = false;
    state.bossShieldRechargeTimer = 0;
    state.bossShieldActive = true;
    state.specimenAlive = true;
    state.specimenHP = 30;
    state.specimenStunned = false;
    state.specimenKilled = false;
    state.arcAvailable = true;
    state.arcUsed = false;
    state.arcStunActive = false;
    state.arcStunTimer = 0;
    state.allObjects = [];
    state.displayCases = [];
    state.centrifuges = [];
    state.corridorMeshes = [];
    state.buildings = [];
    state.eHoldTimer = 0;
    state.eHoldTarget = null;
    state.shootCooldown = 0;
    state.keysDown = {};
    state.keyTimes = {};
    state.lastTime = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SCENE SETUP
  // ═══════════════════════════════════════════════════════════════════════════
  function setupScene() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x99BBCC);
    state.scene.fog = new THREE.FogExp2(0x99BBCC, 0.018);

    state.camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 800);
    state.camera.position.set(0, 1.6, 60);

    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(w, h);
    state.renderer.shadowMap.enabled = true;
    state.renderer.domElement.style.position = 'fixed';
    state.renderer.domElement.style.top = '0';
    state.renderer.domElement.style.left = '0';
    state.renderer.domElement.style.zIndex = '9000';
    document.body.appendChild(state.renderer.domElement);

    var ambient = new THREE.AmbientLight(0xCCDDFF, 0.45);
    state.scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xDDEEFF, 0.9);
    sun.position.set(30, 80, 40);
    sun.castShadow = true;
    state.scene.add(sun);

    var fill = new THREE.DirectionalLight(0x334455, 0.3);
    fill.position.set(-30, 20, -40);
    state.scene.add(fill);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  function addMesh(mesh) {
    state.scene.add(mesh);
    state.allObjects.push(mesh);
    return mesh;
  }

  function makeMesh(geo, mat) {
    var m = new THREE.Mesh(geo, mat);
    return addMesh(m);
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return addMesh(m);
  }

  function makeCyl(rt, rb, h, segs, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    return addMesh(m);
  }

  function makeSphere(r, ws, hs, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return addMesh(m);
  }

  function makeCone(r, h, segs, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, segs);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return addMesh(m);
  }

  function makeLines(pts, color) {
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    var ls = new THREE.LineSegments(geo, mat);
    state.scene.add(ls);
    return ls;
  }

  function dist2(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  GROUND
  // ═══════════════════════════════════════════════════════════════════════════
  function buildGround() {
    var geo = new THREE.BoxGeometry(400, 1, 400);
    var mat = new THREE.MeshLambertMaterial({ color: C_SNOW });
    var g = new THREE.Mesh(geo, mat);
    g.position.set(0, -0.5, 0);
    g.receiveShadow = true;
    state.scene.add(g);
    state.allObjects.push(g);

    // Perimeter snow mounds
    for (var i = 0; i < 24; i++) {
      var angle = (i / 24) * Math.PI * 2;
      var r = 90 + Math.random() * 20;
      makeBox(
        4 + Math.random() * 6, 1 + Math.random() * 3, 4 + Math.random() * 6,
        C_SNOW,
        Math.cos(angle) * r, 0.5 + Math.random(),
        Math.sin(angle) * r
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  COMPLEX LAYOUT — modular prefab buildings + corridors
  // ═══════════════════════════════════════════════════════════════════════════
  function buildComplexLayout() {
    // Main buildings: artifact hall (centre), lab (W), containment (E), power (N), hangar (NW)
    // Entrance south

    // Outer wall ring (partial — north side open for escape)
    var wallSegs = [
      { x: 0,   z: 75, w: 120, d: 2 },  // south perimeter
      { x: -60, z: 30, w: 2,   d: 90 }, // west wall
      { x:  60, z: 30, w: 2,   d: 90 }, // east wall
      { x: -30, z: -45, w: 60, d: 2 },  // north partial
      { x:  40, z: -45, w: 40, d: 2 }
    ];
    for (var i = 0; i < wallSegs.length; i++) {
      var ws = wallSegs[i];
      makeBox(ws.w, 4, ws.d, C_BUILDING2, ws.x, 2, ws.z);
    }

    // Guard post at entrance
    makeBox(5, 4, 5, C_BUILDING, -8, 2, 68);
    makeBox(5, 4, 5, C_BUILDING,  8, 2, 68);
    // Barrier
    makeBox(6, 1.5, 1, C_BUILDING2, 0, 0.75, 68);

    // Roof antenna
    makeCyl(0.15, 0.15, 6, 6, 0x667788, -8, 7, 68);
    makeSphere(0.4, 6, 4, 0xFF3300, -8, 10, 68);

    // Build the 5 main rooms as large box prefabs
    // Artifact Hall — centre
    buildRoom(-1, 0,   C_BUILDING,  30, 7, 26, 'artifact_hall');
    // Laboratory — west
    buildRoom(-36, -5, C_BUILDING,  24, 6, 20, 'lab');
    // Containment Wing — east
    buildRoom( 36, -5, C_BUILDING,  24, 6, 20, 'containment');
    // Power Relay — north centre
    buildRoom(-1, -38, C_BUILDING,  22, 6, 18, 'power');
    // Escape Hangar — northwest
    buildRoom(-50, -42, C_BUILDING2, 28, 8, 22, 'hangar');

    // Connecting corridors
    buildCorridor( -16, -2,  0,  -36, -5,  0);   // hall ↔ lab
    buildCorridor(  15, -2,  0,   36, -5,  0);   // hall ↔ containment
    buildCorridor(  -1, 13,  0,   -1, -25,  0);  // hall ↔ power (north)
    buildCorridor( -13, -38, 0,  -37, -38, 0);   // power ↔ hangar
  }

  function buildRoom(cx, cz, color, w, h, d, tag) {
    var body = makeBox(w, h, d, color, cx, h / 2, cz);
    body.userData.room = tag;
    body.userData.bounds = {
      minX: cx - w / 2, maxX: cx + w / 2,
      minZ: cz - d / 2, maxZ: cz + d / 2
    };
    state.buildings.push(body);

    // Roof slab
    makeBox(w + 0.4, 0.4, d + 0.4, C_BUILDING2, cx, h + 0.2, cz);

    // Floor detail
    makeBox(w - 1, 0.15, d - 1, C_FLOOR, cx, 0.08, cz);

    // Edge lights along roofline
    var pts = [
      cx - w / 2, h, cz - d / 2,
      cx + w / 2, h, cz - d / 2,
      cx + w / 2, h, cz - d / 2,
      cx + w / 2, h, cz + d / 2,
      cx + w / 2, h, cz + d / 2,
      cx - w / 2, h, cz + d / 2,
      cx - w / 2, h, cz + d / 2,
      cx - w / 2, h, cz - d / 2
    ];
    makeLines(pts, 0x334466);
  }

  function buildCorridor(x1, z1, dummy1, x2, z2, dummy2) {
    var mx = (x1 + x2) / 2;
    var mz = (z1 + z2) / 2;
    var dx = x2 - x1;
    var dz = z2 - z1;
    var len = Math.sqrt(dx * dx + dz * dz);
    var ang = Math.atan2(dx, dz);

    var geo = new THREE.BoxGeometry(5, 4, len);
    var mat = new THREE.MeshLambertMaterial({ color: C_CORRIDOR });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(mx, 2, mz);
    m.rotation.y = ang;
    m.castShadow = true;
    m.receiveShadow = true;
    state.scene.add(m);
    state.allObjects.push(m);
    state.corridorMeshes.push(m);

    // Ceiling stripe lights
    var roofGeo = new THREE.BoxGeometry(5.2, 0.2, len + 0.2);
    var roofMat = new THREE.MeshLambertMaterial({ color: C_BUILDING2 });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(mx, 4.1, mz);
    roof.rotation.y = ang;
    state.scene.add(roof);
    state.allObjects.push(roof);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ARTIFACT HALL
  // ═══════════════════════════════════════════════════════════════════════════
  function buildArtifactHall() {
    // 5 display pedestals + glass cases + glowing sphere artifacts
    var positions = [
      { x: -10, z: -8  },
      { x: -5,  z:  6  },
      { x:  0,  z: -8  },
      { x:  5,  z:  6  },
      { x:  10, z: -8  }
    ];

    for (var i = 0; i < positions.length; i++) {
      var p = positions[i];
      var px = p.x - 1;
      var pz = p.z;

      // Pedestal
      makeBox(1.5, 1, 1.5, 0x4A5A6A, px, 0.5, pz);
      makeBox(1.2, 0.15, 1.2, 0x556677, px, 1.08, pz);

      // Glass case (BoxGeometry, semi-transparent)
      var glassGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      var glassMat = new THREE.MeshLambertMaterial({
        color: C_GLASS,
        transparent: true,
        opacity: 0.35
      });
      var glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(px, 1.75, pz);
      state.scene.add(glassMesh);
      state.allObjects.push(glassMesh);

      // Artifact glow light
      var aLight = new THREE.PointLight(C_ARTIFACT, 1.2, 5);
      aLight.position.set(px, 2.2, pz);
      state.scene.add(aLight);

      // Artifact sphere
      var artifactGeo = new THREE.SphereGeometry(0.28, 12, 8);
      var artifactMat = new THREE.MeshLambertMaterial({ color: C_ARTIFACT });
      var artifactMesh = new THREE.Mesh(artifactGeo, artifactMat);
      artifactMesh.position.set(px, 1.75, pz);
      state.scene.add(artifactMesh);
      state.allObjects.push(artifactMesh);

      // Frame outline on glass
      var frameSize = 1.22;
      var framePts = [
        px - frameSize / 2, 1.09, pz - frameSize / 2,
        px + frameSize / 2, 1.09, pz - frameSize / 2,
        px + frameSize / 2, 1.09, pz - frameSize / 2,
        px + frameSize / 2, 1.09, pz + frameSize / 2,
        px + frameSize / 2, 1.09, pz + frameSize / 2,
        px - frameSize / 2, 1.09, pz + frameSize / 2,
        px - frameSize / 2, 1.09, pz + frameSize / 2,
        px - frameSize / 2, 1.09, pz - frameSize / 2
      ];
      makeLines(framePts, 0x336688);

      state.displayCases.push({
        index: i,
        glassMesh: glassMesh,
        artifactMesh: artifactMesh,
        artifactLight: aLight,
        pedX: px,
        pedZ: pz,
        glassBroken: false,
        secured: false,
        secureTimer: 0,
        secureActive: false
      });
    }

    // Decorative columns
    var colPositions = [
      { x: -14, z: -14 }, { x: -14, z: 13 },
      { x:  12, z: -14 }, { x:  12, z: 13 }
    ];
    for (var ci = 0; ci < colPositions.length; ci++) {
      makeCyl(0.4, 0.4, 7, 8, 0x4A5A6A, colPositions[ci].x, 3.5, colPositions[ci].z);
      makeSphere(0.5, 8, 6, 0x556677, colPositions[ci].x, 7.2, colPositions[ci].z);
    }

    // Overhead info panel (flat box)
    makeBox(12, 0.3, 2, 0x223344, -1, 6.5, -1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LABORATORY
  // ═══════════════════════════════════════════════════════════════════════════
  function buildLaboratory() {
    var ox = -36;
    var oz = -5;

    // Lab bench row
    for (var i = 0; i < 4; i++) {
      makeBox(3, 0.8, 1, 0x4A5A6A, ox - 7 + i * 4, 0.4, oz - 4);
    }

    // Centrifuges (CylinderGeometry, will spin)
    var centPos = [
      { x: ox - 7, z: oz - 4.2 },
      { x: ox - 3, z: oz - 4.2 },
      { x: ox + 1, z: oz - 4.2 }
    ];
    for (var ci = 0; ci < centPos.length; ci++) {
      var cGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 10);
      var cMat = new THREE.MeshLambertMaterial({ color: C_CENTRIFUGE });
      var cm = new THREE.Mesh(cGeo, cMat);
      cm.position.set(centPos[ci].x, 1.1, centPos[ci].z);
      cm.userData.spinSpeed = 3 + Math.random() * 2;
      state.scene.add(cm);
      state.allObjects.push(cm);
      state.centrifuges.push(cm);

      // Centrifuge rotor disc
      var rotorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 10);
      var rotorMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
      var rotor = new THREE.Mesh(rotorGeo, rotorMat);
      rotor.position.set(centPos[ci].x, 1.45, centPos[ci].z);
      rotor.userData.spinSpeed = cm.userData.spinSpeed * 4;
      state.scene.add(rotor);
      state.allObjects.push(rotor);
      state.centrifuges.push(rotor);
    }

    // Microscopes (composite shapes)
    var microPos = [
      { x: ox + 5, z: oz - 4 },
      { x: ox + 8, z: oz - 4 }
    ];
    for (var mi = 0; mi < microPos.length; mi++) {
      var mpx = microPos[mi].x;
      var mpz = microPos[mi].z;
      makeBox(0.4, 0.05, 0.4, C_MICROSCOPE, mpx, 0.83, mpz);  // base
      makeCyl(0.06, 0.06, 0.7, 6, C_MICROSCOPE, mpx, 1.2, mpz); // stem
      makeBox(0.3, 0.04, 0.06, C_MICROSCOPE, mpx, 1.58, mpz);   // arm
      makeCyl(0.08, 0.05, 0.3, 6, C_MICROSCOPE, mpx - 0.18, 1.44, mpz); // objective
    }

    // Chemical storage cabinets
    makeBox(2.5, 3.5, 0.6, C_BUILDING2, ox + 9, 1.75, oz + 7);
    makeBox(2.5, 3.5, 0.6, C_BUILDING2, ox + 6, 1.75, oz + 7);

    // Hazard sign (flat box)
    makeBox(0.8, 0.6, 0.05, 0xFF9900, ox + 9, 2.2, oz + 6.7);

    // Overhead lighting strip
    makeBox(20, 0.12, 0.5, 0xCCDDFF, ox, 5.85, oz);
    var labLight = new THREE.PointLight(0xCCDDFF, 0.8, 20);
    labLight.position.set(ox, 5.5, oz);
    state.scene.add(labLight);

    // Fume hood (box with opening)
    makeBox(3, 2.5, 1, C_BUILDING2, ox - 9, 1.25, oz + 6.5);
    makeBox(2.6, 1.8, 0.05, 0x88AABB, ox - 9, 1.25, oz + 6.0);

    // Specimen jars (spheres on bench)
    for (var ji = 0; ji < 5; ji++) {
      var jarColor = [0x00CC88, 0xCC4400, 0x8844CC, 0x22AACC, 0xCCCC00][ji];
      makeSphere(0.1, 6, 4, jarColor, ox - 6 + ji * 1.5, 0.95, oz - 4);
    }

    // Cable runs on floor
    var cablePts = [
      ox - 10, 0.02, oz - 6,
      ox + 10, 0.02, oz - 6,
      ox + 10, 0.02, oz - 6,
      ox + 10, 0.02, oz + 8
    ];
    makeLines(cablePts, 0x223344);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONTAINMENT WING
  // ═══════════════════════════════════════════════════════════════════════════
  function buildContainmentWing() {
    var ox = 36;
    var oz = -5;

    // 4 reinforced cells
    var cellDefs = [
      { x: ox - 7, z: oz - 6, breached: false },
      { x: ox - 2, z: oz - 6, breached: false },
      { x: ox + 3, z: oz - 6, breached: false },
      { x: ox + 7, z: oz - 6, breached: true  }  // breached — specimen spawned here
    ];

    for (var i = 0; i < cellDefs.length; i++) {
      var cd = cellDefs[i];
      var cx2 = cd.x;
      var cz2 = cd.z;

      // Cell walls
      makeBox(4, 4, 0.25, C_CELL, cx2,     2, cz2 - 1.8);  // back
      makeBox(4, 4, 0.25, C_CELL, cx2,     2, cz2 + 1.8);  // front (door)
      makeBox(0.25, 4, 3.6, C_CELL, cx2 - 1.9, 2, cz2);    // left
      makeBox(0.25, 4, 3.6, C_CELL, cx2 + 1.9, 2, cz2);    // right

      if (cd.breached) {
        // Breached door — knocked aside
        var brokenGeo = new THREE.BoxGeometry(3.5, 3.5, 0.25);
        var brokenMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
        var broken = new THREE.Mesh(brokenGeo, brokenMat);
        broken.position.set(cx2 + 1, 1.75, cz2 + 1.8);
        broken.rotation.z = 0.6;
        broken.rotation.y = 0.4;
        state.scene.add(broken);
        state.allObjects.push(broken);

        // Breach warning light (red)
        var warnLight = new THREE.PointLight(0xFF2200, 2, 8);
        warnLight.position.set(cx2, 3.5, cz2);
        state.scene.add(warnLight);

        // Scorch marks on floor
        makeBox(3, 0.05, 3, 0x111111, cx2, 0.03, cz2);
      } else {
        // Intact bars as LineSegments
        var barPts = [];
        for (var b = 0; b < 5; b++) {
          var bx = cx2 - 1.6 + b * 0.8;
          barPts.push(bx, 0.1, cz2 + 1.8, bx, 3.9, cz2 + 1.8);
        }
        makeLines(barPts, 0x445566);
      }

      // Cell number label (box marker)
      makeBox(0.4, 0.4, 0.05, 0x223344, cx2 - 1.6, 3.5, cz2 - 1.75);
    }

    // Containment control panel
    makeBox(3, 2, 0.6, C_BUILDING2, ox + 5, 1, oz + 7);
    makeBox(2.8, 0.1, 0.5, 0x334455, ox + 5, 2.05, oz + 7);
    for (var bi = 0; bi < 4; bi++) {
      makeSphere(0.08, 6, 4, [0xFF0000, 0xFFFF00, 0x00FF00, 0x0088FF][bi], ox + 3.7 + bi * 0.6, 1.5, oz + 6.7);
    }

    // Biohazard containers
    makeCyl(0.5, 0.5, 1.2, 8, 0x443300, ox - 8, 0.6, oz + 6);
    makeSphere(0.55, 8, 6, 0x553300, ox - 8, 1.35, oz + 6);
    makeCyl(0.5, 0.5, 1.2, 8, 0x443300, ox - 6, 0.6, oz + 6);

    // Overhead warning lights
    for (var wi = 0; wi < 3; wi++) {
      var wl = new THREE.PointLight(0xFF2200, 0.4, 6);
      wl.position.set(ox - 4 + wi * 4, 5.5, oz);
      state.scene.add(wl);
    }

    // Forcefields (LineSegments simulation)
    makeLines([
      ox - 10, 0.1, oz - 2,
      ox - 10, 4.0, oz - 2,
      ox - 10, 0.1, oz - 2,
      ox + 10, 0.1, oz - 2
    ], 0x00AAFF);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  POWER RELAY ROOM
  // ═══════════════════════════════════════════════════════════════════════════
  function buildPowerRelayRoom() {
    var ox = -1;
    var oz = -38;

    // Large transformer (CylinderGeometry)
    var tfGeo = new THREE.CylinderGeometry(2, 2.4, 5, 12);
    var tfMat = new THREE.MeshLambertMaterial({ color: C_TRANSFORMER });
    var tf = new THREE.Mesh(tfGeo, tfMat);
    tf.position.set(ox, 2.5, oz);
    tf.castShadow = true;
    state.scene.add(tf);
    state.allObjects.push(tf);
    state.transformerMesh = tf;
    tf.userData.isTransformer = true;

    // Transformer top dome
    var topGeo = new THREE.SphereGeometry(2.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    var topMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    var top = new THREE.Mesh(topGeo, topMat);
    top.position.set(ox, 5.05, oz);
    state.scene.add(top);
    state.allObjects.push(top);

    // Arc conductor rods
    for (var ri = 0; ri < 4; ri++) {
      var ra = (ri / 4) * Math.PI * 2;
      var rx = ox + Math.cos(ra) * 2.6;
      var rz = oz + Math.sin(ra) * 2.6;
      makeCyl(0.08, 0.08, 5.5, 6, 0x556677, rx, 2.75, rz);
      makeSphere(0.15, 6, 4, 0x44CCFF, rx, 5.5, rz);
    }

    // Arc lightning (LineSegments — static representation)
    var arcPts = [
      ox - 2.6, 5.5, oz,
      ox, 6.5, oz,
      ox, 6.5, oz,
      ox + 2.6, 5.5, oz,
      ox, 6.5, oz,
      ox, 6.5, oz - 2.6,
      ox, 6.5, oz,
      ox, 6.5, oz + 2.6
    ];
    var arcLines = makeLines(arcPts, C_ARC);
    arcLines.userData.isArc = true;
    state.transformerArcLines = arcLines;

    // Electrical panels along walls
    for (var pi = 0; pi < 4; pi++) {
      makeBox(1.5, 3, 0.3, C_BUILDING2, ox - 8 + pi * 4, 1.5, oz - 8);
      // Panel dials
      for (var di = 0; di < 3; di++) {
        makeSphere(0.1, 6, 4, 0x00FF44, ox - 8 + pi * 4 - 0.4 + di * 0.4, 1.7, oz - 7.86);
      }
    }

    // Cable conduits
    var condPts = [
      ox - 9, 4, oz - 7,
      ox,     4, oz - 7,
      ox,     4, oz - 7,
      ox,     4, oz,
      ox,     4, oz,
      ox,     4, oz + 7
    ];
    makeLines(condPts, 0x223344);

    // Generator unit (box)
    makeBox(4, 2.5, 2, 0x334455, ox + 8, 1.25, oz + 6);
    makeCyl(0.8, 0.8, 1, 8, 0x223344, ox + 8, 2.75, oz + 6);
    // Exhaust pipe
    makeCyl(0.2, 0.2, 3, 6, 0x334455, ox + 9, 3.5, oz + 5);
    makeCone(0.35, 0.5, 6, 0x223344, ox + 9, 5.1, oz + 5);

    // Ambient electrical glow
    var arcLight = new THREE.PointLight(C_ARC, 1.5, 15);
    arcLight.position.set(ox, 6.5, oz);
    state.scene.add(arcLight);
    state.arcLight = arcLight;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ESCAPE HANGAR
  // ═══════════════════════════════════════════════════════════════════════════
  function buildEscapeHangar() {
    var ox = -50;
    var oz = -42;

    // Hangar floor markings
    makeBox(26, 0.08, 20, 0x334455, ox, 0.04, oz);

    // Runway stripe lights
    for (var i = 0; i < 6; i++) {
      makeBox(0.3, 0.06, 1.5, 0xFFEE00, ox - 4, 0.07, oz - 7 + i * 2.8);
      makeBox(0.3, 0.06, 1.5, 0xFFEE00, ox + 4, 0.07, oz - 7 + i * 2.8);
    }

    // BoxGeometry jet shape — fuselage
    makeBox(3, 2, 14, C_JET, ox, 1.2, oz);
    // Nose cone
    makeCone(1.3, 4, 8, C_JET, ox, 1.2, oz - 9);
    // Wings
    makeBox(18, 0.4, 4, C_JET, ox, 0.9, oz + 1);
    // Tail fins
    makeBox(6, 3, 0.4, C_JET, ox, 2.5, oz + 6);
    makeBox(0.4, 2.5, 3, C_JET, ox - 1.2, 2.8, oz + 6);
    makeBox(0.4, 2.5, 3, C_JET, ox + 1.2, 2.8, oz + 6);
    // Engine nacelles
    makeCyl(0.7, 0.8, 5, 8, 0x334455, ox - 4, 0.5, oz + 2);
    makeCyl(0.7, 0.8, 5, 8, 0x334455, ox + 4, 0.5, oz + 2);
    // Cockpit canopy
    makeBox(1.6, 0.8, 2.5, 0x88AABB, ox, 2.45, oz - 4);

    // Hangar doors (open — two sliding panels)
    makeBox(1, 8, 20, C_BUILDING2, ox - 15, 4, oz);
    makeBox(1, 8, 20, C_BUILDING2, ox + 15, 4, oz);

    // Scaffolding / maintenance gantry
    makeCyl(0.15, 0.15, 8, 6, 0x556677, ox - 8, 4, oz - 5);
    makeCyl(0.15, 0.15, 8, 6, 0x556677, ox + 8, 4, oz - 5);
    makeBox(18, 0.3, 0.3, 0x556677, ox, 8, oz - 5);

    // Gantry supports
    var ganPts = [
      ox - 8, 8, oz - 5,
      ox - 6, 5.5, oz - 5,
      ox + 8, 8, oz - 5,
      ox + 6, 5.5, oz - 5
    ];
    makeLines(ganPts, 0x445566);

    // Tool cart
    makeBox(1.2, 0.8, 0.6, 0x445566, ox + 10, 0.4, oz + 4);
    // Fuel drum
    makeCyl(0.6, 0.6, 1.4, 8, 0x223344, ox + 11.5, 0.7, oz + 3);

    // EXIT marker
    makeBox(2.5, 0.8, 0.1, 0x00FF44, ox, 2.5, oz - 10.5);

    // Hangar point light
    var hLight = new THREE.PointLight(0xFFEECC, 1.2, 35);
    hLight.position.set(ox, 7, oz);
    state.scene.add(hLight);

    // Mark exit zone
    state.hangarBounds = {
      minX: ox - 13, maxX: ox + 13,
      minZ: oz - 11, maxZ: oz + 11
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ENEMIES
  // ═══════════════════════════════════════════════════════════════════════════
  function buildEnemies() {
    // 10 research guards
    var guardPositions = [
      { x:  5,  z: 60 }, { x: -5,  z: 60 },
      { x: -30, z:  5 }, { x: -42, z: -10 },
      { x: -28, z: -2 }, { x:  30, z:  5 },
      { x:  42, z: -10 }, { x:  28, z: -2 },
      { x: -10, z: 20 }, { x:  10, z: 20 }
    ];

    for (var i = 0; i < guardPositions.length; i++) {
      var gp = guardPositions[i];
      spawnEnemy(gp.x, 0.9, gp.z, C_GUARD, 80, 'guard', 2.2);
    }

    // 5 containment team (hazmat)
    var hazPos = [
      { x: 36, z: -8 }, { x: 44, z: -3 },
      { x: 40, z: -12 }, { x: 32, z: -14 },
      { x: 38, z: -18 }
    ];
    for (var hi = 0; hi < hazPos.length; hi++) {
      var he = spawnEnemy(hazPos[hi].x, 0.9, hazPos[hi].z, C_CONTAIN, 95, 'containment', 1.8);
      // Hazmat helmet dome
      var helmetGeo = new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.65);
      var helmetMat = new THREE.MeshLambertMaterial({ color: 0xCCEE88, transparent: true, opacity: 0.7 });
      var helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.set(0, 0.95, 0);
      he.mesh.add(helmet);
    }
  }

  function spawnEnemy(x, y, z, color, hp, type, speed) {
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(bodyGeo, bodyMat);
    mesh.position.set(x, y, z);
    mesh.userData.isEnemy = true;
    state.scene.add(mesh);
    state.allObjects.push(mesh);

    // Head
    var headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    var headMat = new THREE.MeshLambertMaterial({ color: color });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.2, 0);
    mesh.add(head);

    var entry = {
      mesh: mesh,
      hp: hp,
      maxHp: hp,
      type: type,
      alive: true,
      speed: speed,
      patrolTimer: Math.random() * 3,
      patrolDir: { x: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 },
      stunned: false,
      stunTimer: 0,
      aggroTimer: 0,
      aggroRange: 20,
      fireTimer: 0,
      fireCooldown: 2 + Math.random() * 2
    };
    state.enemies.push(entry);
    return entry;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  BOSS: PROJECT DIRECTOR KALA
  // ═══════════════════════════════════════════════════════════════════════════
  function buildBoss() {
    // Boss in artifact hall
    var geo = new THREE.BoxGeometry(1.0, 2.0, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: C_BOSS });
    var boss = new THREE.Mesh(geo, mat);
    boss.position.set(0, 1.0, -3);
    boss.castShadow = true;
    state.scene.add(boss);
    state.allObjects.push(boss);
    state.bossMesh = boss;
    boss.userData.isBoss = true;

    // Boss head
    var hGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    var hMat = new THREE.MeshLambertMaterial({ color: C_BOSS });
    var bHead = new THREE.Mesh(hGeo, hMat);
    bHead.position.set(0, 1.35, 0);
    boss.add(bHead);

    // Alien enhancement glow
    var bLight = new THREE.PointLight(0x0055FF, 1.5, 8);
    bLight.position.set(0, 2.5, -3);
    state.scene.add(bLight);
    state.bossLight = bLight;

    // Energy shield bubble
    var shieldGeo = new THREE.SphereGeometry(1.8, 12, 8);
    var shieldMat = new THREE.MeshLambertMaterial({
      color: C_SHIELD,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    var shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 1.0, -3);
    state.scene.add(shieldMesh);
    state.allObjects.push(shieldMesh);
    state.bossShieldMesh = shieldMesh;

    // Shield outline
    var shieldLinePts = [];
    var slSegs = 12;
    for (var si = 0; si < slSegs; si++) {
      var sa = (si / slSegs) * Math.PI * 2;
      var sb = ((si + 1) / slSegs) * Math.PI * 2;
      shieldLinePts.push(
        Math.cos(sa) * 1.85, 1.0, -3 + Math.sin(sa) * 1.85,
        Math.cos(sb) * 1.85, 1.0, -3 + Math.sin(sb) * 1.85
      );
    }
    var shieldLines = makeLines(shieldLinePts, 0x4499FF);
    state.bossShieldLines = shieldLines;

    // "Kala" name plate float (thin box)
    makeBox(2.5, 0.4, 0.1, 0x112244, 0, 3.5, -3.1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SPECIMEN
  // ═══════════════════════════════════════════════════════════════════════════
  function buildSpecimen() {
    // Fast BoxGeometry — escaped alien creature
    var geo = new THREE.BoxGeometry(0.6, 0.9, 1.2);
    var mat = new THREE.MeshLambertMaterial({ color: C_SPECIMEN });
    var s = new THREE.Mesh(geo, mat);
    s.position.set(44, 0.45, -14);   // spawns near breached cell
    state.scene.add(s);
    state.allObjects.push(s);
    state.specimenMesh = s;
    s.userData.isSpecimen = true;

    // Alien eyes (spheres)
    var eyeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var eyeGeoL = new THREE.SphereGeometry(0.08, 6, 4);
    var eyeGeoR = new THREE.SphereGeometry(0.08, 6, 4);
    var eyeL = new THREE.Mesh(eyeGeoL, eyeMat);
    var eyeR = new THREE.Mesh(eyeGeoR, eyeMat);
    eyeL.position.set(-0.15, 0.2, -0.55);
    eyeR.position.set( 0.15, 0.2, -0.55);
    s.add(eyeL);
    s.add(eyeR);

    // Red glow
    var sLight = new THREE.PointLight(0xFF0000, 1.0, 5);
    sLight.position.set(44, 1.5, -14);
    state.scene.add(sLight);
    state.specimenLight = sLight;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  HUD
  // ═══════════════════════════════════════════════════════════════════════════
  function buildHUD() {
    state.hudEl = document.createElement('div');
    state.hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'padding:12px 16px',
      'box-sizing:border-box',
      'color:#CCFFEE',
      'font-family:monospace',
      'font-size:13px',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 8px #003322',
      'background:linear-gradient(to bottom,rgba(0,10,20,0.7) 0%,transparent 100%)'
    ].join(';');
    document.body.appendChild(state.hudEl);
    updateHUD();
    state.hudInterval = setInterval(updateHUD, 150);
  }

  function updateHUD() {
    if (!state.hudEl) return;

    var timerStr = '';
    if (state.selfDestructTriggered) {
      var t = Math.max(0, Math.ceil(state.selfDestructTimer));
      var tColor = t < 30 ? '#FF4400' : (t < 60 ? '#FFAA00' : '#FFFF00');
      timerStr = ' | <span style="color:' + tColor + '">SELF-DESTRUCT: ' + t + 's</span>';
    }

    var shieldStr = '';
    if (state.bossAlive) {
      if (state.bossShieldRecharging) {
        shieldStr = ' KALA-SHIELD:<span style="color:#FF8800">RECHARGING</span>';
      } else if (state.bossShieldActive) {
        shieldStr = ' KALA-SHIELD:<span style="color:#44AAFF">' + state.bossShieldHP + '/3</span>';
      } else {
        shieldStr = ' KALA-SHIELD:<span style="color:#FF4444">DOWN</span>';
      }
    } else {
      shieldStr = ' KALA:<span style="color:#FF4444">NEUTRALISED</span>';
    }

    var specimenStr = state.specimenKilled
      ? ' SPECIMEN:<span style="color:#44FF44">CONTAINED</span>'
      : (state.specimenAlive
          ? ' SPECIMEN:<span style="color:#FF2200">ACTIVE</span>'
          : ' SPECIMEN:<span style="color:#44FF44">CONTAINED</span>');

    var arcStr = state.arcUsed
      ? ' ARC:<span style="color:#888888">USED</span>'
      : ' ARC:<span style="color:#44FFFF">READY</span>';

    state.hudEl.innerHTML =
      'HP:<span style="color:#FF4444">' + Math.max(0, Math.ceil(state.playerHP)) + '</span>' +
      ' | ARTIFACTS:<span style="color:#00FFCC">' + state.artifactsSecured + '/5</span>' +
      timerStr +
      ' |' + shieldStr +
      ' |' + specimenStr +
      ' |' + arcStr +
      '<br><span style="color:#88AACC;font-size:11px">' +
      'WASD:move  MOUSE:look  LMB:shoot  E:secure-artifact  F:shoot-transformer  R:toggle-module' +
      '</span>';
  }

  // ─── Interact prompt ──────────────────────────────────────────────────────
  function buildInteractPrompt() {
    state.interactPromptEl = document.createElement('div');
    state.interactPromptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#CCFFEE',
      'font-family:monospace',
      'font-size:16px',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 10px #00FF88',
      'display:none'
    ].join(';');
    document.body.appendChild(state.interactPromptEl);
  }

  function showPrompt(msg) {
    if (!state.interactPromptEl) return;
    state.interactPromptEl.textContent = msg;
    state.interactPromptEl.style.display = 'block';
  }

  function hidePrompt() {
    if (!state.interactPromptEl) return;
    state.interactPromptEl.style.display = 'none';
  }

  // ─── Muzzle flash ─────────────────────────────────────────────────────────
  function buildMuzzleFlash() {
    var geo = new THREE.SphereGeometry(0.18, 6, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFEE88 });
    var m = new THREE.Mesh(geo, mat);
    m.visible = false;
    m.position.set(0, 0, -2);
    state.camera.add(m);
    state.scene.add(state.camera);
    state.muzzleFlashMesh = m;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SHOOTING
  // ═══════════════════════════════════════════════════════════════════════════
  function shoot() {
    if (!state.active || state.gameOver || state.gameWon) return;
    if (state.shootCooldown > 0) return;
    state.shootCooldown = 0.12;

    // Muzzle flash
    state.muzzleFlashMesh.visible = true;
    state.muzzleFlashTimer = 0.06;

    // Ray from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(state.camera.quaternion);

    var origin = state.camera.position.clone();
    var bestDist = 80;
    var hitEnemy = null;
    var hitBoss = false;
    var hitTransformer = false;

    // Check enemies
    for (var i = 0; i < state.enemies.length; i++) {
      var en = state.enemies[i];
      if (!en.alive) continue;
      var d = rayHitBox(origin, dir, en.mesh, 0.6, 1.8, 0.6);
      if (d > 0 && d < bestDist) {
        bestDist = d;
        hitEnemy = en;
        hitBoss = false;
        hitTransformer = false;
      }
    }

    // Check boss
    if (state.bossAlive && state.bossMesh) {
      var bd = rayHitBox(origin, dir, state.bossMesh, 1.2, 2.2, 0.8);
      if (bd > 0 && bd < bestDist) {
        bestDist = bd;
        hitEnemy = null;
        hitBoss = true;
        hitTransformer = false;
      }
    }

    // Check transformer
    if (!state.arcUsed && state.transformerMesh) {
      var td = rayHitBox(origin, dir, state.transformerMesh, 2.5, 5.5, 2.5);
      if (td > 0 && td < bestDist) {
        bestDist = td;
        hitEnemy = null;
        hitBoss = false;
        hitTransformer = true;
      }
    }

    // Check artifact glass
    for (var ai = 0; ai < state.displayCases.length; ai++) {
      var dc = state.displayCases[ai];
      if (dc.glassBroken || dc.secured) continue;
      var gd = rayHitBox(origin, dir, dc.glassMesh, 1.3, 1.3, 1.3);
      if (gd > 0 && gd < bestDist) {
        bestDist = gd;
        hitEnemy = null;
        hitBoss = false;
        hitTransformer = false;
        breakGlass(dc);
      }
    }

    if (hitEnemy) {
      damageEnemy(hitEnemy, 25);
    }

    if (hitBoss) {
      damageBoss(25);
    }

    if (hitTransformer) {
      triggerArc();
    }
  }

  function rayHitBox(origin, dir, mesh, hw, hh, hd) {
    var mp = mesh.position;
    var half = { x: hw / 2, y: hh / 2, z: hd / 2 };

    var tminX = (mp.x - half.x - origin.x) / dir.x;
    var tmaxX = (mp.x + half.x - origin.x) / dir.x;
    if (tminX > tmaxX) { var tx = tminX; tminX = tmaxX; tmaxX = tx; }

    var tminY = (mp.y - half.y - origin.y) / dir.y;
    var tmaxY = (mp.y + half.y - origin.y) / dir.y;
    if (tminY > tmaxY) { var ty = tminY; tminY = tmaxY; tmaxY = ty; }

    var tminZ = (mp.z - half.z - origin.z) / dir.z;
    var tmaxZ = (mp.z + half.z - origin.z) / dir.z;
    if (tminZ > tmaxZ) { var tz = tminZ; tminZ = tmaxZ; tmaxZ = tz; }

    var tEnter = Math.max(tminX, tminY, tminZ);
    var tExit  = Math.min(tmaxX, tmaxY, tmaxZ);

    if (tEnter > tExit || tExit < 0) return -1;
    return tEnter > 0 ? tEnter : tExit;
  }

  function damageEnemy(en, dmg) {
    if (!en.alive) return;
    // Specimen immune to normal attacks
    if (en.type === 'specimen') return;
    en.hp -= dmg;
    if (en.hp <= 0) {
      en.alive = false;
      en.mesh.visible = false;
      spawnDeathMarker(en.mesh.position.x, en.mesh.position.z);
    } else {
      // Flash red briefly
      en.mesh.material.color.setHex(0xFF2200);
      setTimeout(function () {
        if (en.alive && en.mesh) {
          en.mesh.material.color.setHex(en.type === 'guard' ? C_GUARD : C_CONTAIN);
        }
      }, 80);
    }
  }

  function damageBoss(dmg) {
    if (!state.bossAlive || !state.bossMesh) return;

    // Shield absorbs hits
    if (state.bossShieldActive && state.bossShieldHP > 0) {
      state.bossShieldHP--;
      // Shield flare
      if (state.bossShieldMesh) {
        state.bossShieldMesh.material.color.setHex(0xFFFFFF);
        setTimeout(function () {
          if (state.bossShieldMesh) {
            state.bossShieldMesh.material.color.setHex(C_SHIELD);
          }
        }, 100);
      }
      if (state.bossShieldHP <= 0) {
        state.bossShieldActive = false;
        state.bossShieldRecharging = true;
        state.bossShieldRechargeTimer = 0;
        if (state.bossShieldMesh) state.bossShieldMesh.visible = false;
        if (state.bossShieldLines) state.bossShieldLines.visible = false;
      }
      return;
    }

    // Shield down — damage goes through
    state.bossHP -= dmg;
    if (state.bossHP <= 0) {
      state.bossHP = 0;
      state.bossAlive = false;
      if (state.bossMesh) state.bossMesh.visible = false;
      if (state.bossShieldMesh) state.bossShieldMesh.visible = false;
      if (state.bossShieldLines) state.bossShieldLines.visible = false;
      if (state.bossLight) state.bossLight.intensity = 0;
    } else {
      state.bossMesh.material.color.setHex(0xFF0033);
      setTimeout(function () {
        if (state.bossAlive && state.bossMesh) {
          state.bossMesh.material.color.setHex(C_BOSS);
        }
      }, 100);
    }
  }

  function spawnDeathMarker(x, z) {
    var geo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x550000 });
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, 0.03, z);
    state.scene.add(m);
    state.allObjects.push(m);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ARTIFACT MECHANICS
  // ═══════════════════════════════════════════════════════════════════════════
  function breakGlass(dc) {
    if (dc.glassBroken) return;
    dc.glassBroken = true;
    dc.glassMesh.visible = false;

    // Shatter fragments
    for (var i = 0; i < 6; i++) {
      var fGeo = new THREE.BoxGeometry(
        0.1 + Math.random() * 0.3,
        0.1 + Math.random() * 0.3,
        0.05
      );
      var fMat = new THREE.MeshLambertMaterial({ color: C_GLASS, transparent: true, opacity: 0.6 });
      var frag = new THREE.Mesh(fGeo, fMat);
      frag.position.set(
        dc.pedX + (Math.random() - 0.5) * 1.5,
        1.0 + Math.random() * 0.5,
        dc.pedZ + (Math.random() - 0.5) * 1.5
      );
      frag.rotation.set(Math.random(), Math.random(), Math.random());
      state.scene.add(frag);
      state.allObjects.push(frag);
    }
  }

  function trySecureArtifact() {
    var closest = null;
    var closestDist = 999;

    for (var i = 0; i < state.displayCases.length; i++) {
      var dc = state.displayCases[i];
      if (!dc.glassBroken || dc.secured) continue;
      var d = dist2(state.playerPos.x, state.playerPos.z, dc.pedX, dc.pedZ);
      if (d < 3.5 && d < closestDist) {
        closestDist = d;
        closest = dc;
      }
    }

    return closest;
  }

  function secureArtifact(dc) {
    dc.secured = true;
    dc.artifactMesh.visible = false;
    dc.artifactLight.intensity = 0;
    state.artifactsSecured++;

    // 3rd artifact triggers self-destruct
    if (state.artifactsSecured === 3 && !state.selfDestructTriggered) {
      triggerSelfDestruct();
    }

    // Win check
    checkWinCondition();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SELF-DESTRUCT
  // ═══════════════════════════════════════════════════════════════════════════
  function triggerSelfDestruct() {
    state.selfDestructTriggered = true;
    state.selfDestructTimer = 90;

    // Red alert lights
    var alertLight1 = new THREE.PointLight(0xFF0000, 2, 40);
    alertLight1.position.set(0, 6, 0);
    state.scene.add(alertLight1);
    state.alertLight = alertLight1;

    showOverlayMessage('SELF-DESTRUCT INITIATED — 90 SECONDS', '#FF4400', 4000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  POWER ARC
  // ═══════════════════════════════════════════════════════════════════════════
  function triggerArc() {
    if (state.arcUsed) return;
    state.arcUsed = true;
    state.arcStunActive = true;
    state.arcStunTimer = state.arcStunDuration;

    // Stun all living enemies + boss temporarily
    for (var i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].alive) {
        state.enemies[i].stunned = true;
        state.enemies[i].stunTimer = state.arcStunDuration;
      }
    }

    // Stun specimen
    if (state.specimenAlive && state.specimenMesh) {
      state.specimenStunned = true;
      state.specimenStunTimer = state.arcStunDuration;
    }

    // Arc light strobe
    if (state.arcLight) {
      state.arcLight.intensity = 5;
      state.arcLight.color.setHex(0xFFFFFF);
    }

    showOverlayMessage('POWER ARC DISCHARGED — ENEMIES STUNNED 5s', '#44FFFF', 2500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  WIN / LOSE
  // ═══════════════════════════════════════════════════════════════════════════
  function checkWinCondition() {
    if (state.gameWon || state.gameOver) return;
    if (
      state.artifactsSecured >= 5 &&
      !state.bossAlive &&
      isInHangar()
    ) {
      state.gameWon = true;
      triggerVictory();
    }
  }

  function isInHangar() {
    if (!state.hangarBounds) return false;
    var hb = state.hangarBounds;
    return (
      state.playerPos.x > hb.minX && state.playerPos.x < hb.maxX &&
      state.playerPos.z > hb.minZ && state.playerPos.z < hb.maxZ
    );
  }

  function triggerVictory() {
    state.gameWon = true;
    showOverlayMessage('MISSION COMPLETE\nALL ARTIFACTS SECURED — ESCAPED RESEARCH STATION', '#00FF88', 0);
  }

  function triggerGameOver(reason) {
    if (state.gameOver || state.gameWon) return;
    state.gameOver = true;
    showOverlayMessage('MISSION FAILED\n' + reason, '#FF4444', 0);
  }

  function showOverlayMessage(msg, color, duration) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:38%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:' + color,
      'font-family:monospace',
      'font-size:24px',
      'z-index:99999',
      'text-align:center',
      'white-space:pre',
      'text-shadow:0 0 16px ' + color,
      'background:rgba(0,0,0,0.6)',
      'padding:16px 28px',
      'border:1px solid ' + color
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    if (duration > 0) {
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, duration);
    }
    state._lastOverlay = el;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UPDATE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function updatePlayer(dt) {
    if (state.gameOver || state.gameWon) return;

    var speed = state.playerSpeed;
    var fwd = new THREE.Vector3(0, 0, -1);
    fwd.applyEuler(new THREE.Euler(0, state.yaw, 0));
    var right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(new THREE.Euler(0, state.yaw, 0));

    if (state.keysDown['w'] || state.keysDown['W'] || state.keysDown['ArrowUp']) {
      state.playerPos.x += fwd.x * speed * dt;
      state.playerPos.z += fwd.z * speed * dt;
    }
    if (state.keysDown['s'] || state.keysDown['S'] || state.keysDown['ArrowDown']) {
      state.playerPos.x -= fwd.x * speed * dt;
      state.playerPos.z -= fwd.z * speed * dt;
    }
    if (state.keysDown['a'] || state.keysDown['A'] || state.keysDown['ArrowLeft']) {
      state.playerPos.x -= right.x * speed * dt;
      state.playerPos.z -= right.z * speed * dt;
    }
    if (state.keysDown['d'] || state.keysDown['D'] || state.keysDown['ArrowRight']) {
      state.playerPos.x += right.x * speed * dt;
      state.playerPos.z += right.z * speed * dt;
    }

    // Clamp to world
    state.playerPos.x = Math.max(-80, Math.min(80, state.playerPos.x));
    state.playerPos.z = Math.max(-80, Math.min(80, state.playerPos.z));
  }

  function updateCamera() {
    state.camera.position.set(state.playerPos.x, state.playerPos.y, state.playerPos.z);
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.yaw;
    state.camera.rotation.x = state.pitch;
  }

  function updateEnemies(dt) {
    for (var i = 0; i < state.enemies.length; i++) {
      var en = state.enemies[i];
      if (!en.alive) continue;

      // Stun handling
      if (en.stunned) {
        en.stunTimer -= dt;
        if (en.stunTimer <= 0) {
          en.stunned = false;
          en.stunTimer = 0;
        }
        continue;
      }

      // AI: patrol / chase
      var dx = state.playerPos.x - en.mesh.position.x;
      var dz = state.playerPos.z - en.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < en.aggroRange) {
        // Chase player
        var nx = dx / dist;
        var nz = dz / dist;
        en.mesh.position.x += nx * en.speed * dt;
        en.mesh.position.z += nz * en.speed * dt;
        en.mesh.lookAt(state.playerPos.x, en.mesh.position.y, state.playerPos.z);

        // Fire at player
        en.fireTimer += dt;
        if (en.fireTimer >= en.fireCooldown && dist < 15) {
          en.fireTimer = 0;
          var dmg = en.type === 'containment' ? 12 : 8;
          if (Math.random() < 0.45) {
            state.playerHP -= dmg;
            if (state.playerHP <= 0) {
              state.playerHP = 0;
              triggerGameOver('ELIMINATED BY STATION SECURITY');
            }
          }
        }
      } else {
        // Patrol
        en.patrolTimer += dt;
        if (en.patrolTimer > 4) {
          en.patrolTimer = 0;
          en.patrolDir.x = (Math.random() - 0.5) * 2;
          en.patrolDir.z = (Math.random() - 0.5) * 2;
          var pLen = Math.sqrt(en.patrolDir.x * en.patrolDir.x + en.patrolDir.z * en.patrolDir.z);
          en.patrolDir.x /= pLen;
          en.patrolDir.z /= pLen;
        }
        en.mesh.position.x += en.patrolDir.x * (en.speed * 0.4) * dt;
        en.mesh.position.z += en.patrolDir.z * (en.speed * 0.4) * dt;
      }
    }
  }

  function updateBoss(dt) {
    if (!state.bossAlive || !state.bossMesh) return;

    // Teleport every 20s
    state.bossTeleportTimer += dt;
    if (state.bossTeleportTimer >= state.bossTeleportCooldown) {
      state.bossTeleportTimer = 0;
      bossTeleport();
    }

    // Chase player when shield is down
    var bx = state.bossMesh.position.x;
    var bz = state.bossMesh.position.z;
    var pdx = state.playerPos.x - bx;
    var pdz = state.playerPos.z - bz;
    var pDist = Math.sqrt(pdx * pdx + pdz * pdz);

    if (!state.bossShieldActive || state.bossShieldHP < state.bossShieldMax) {
      if (pDist > 3) {
        var speed = 2.5;
        state.bossMesh.position.x += (pdx / pDist) * speed * dt;
        state.bossMesh.position.z += (pdz / pDist) * speed * dt;
        if (state.bossShieldMesh) {
          state.bossShieldMesh.position.copy(state.bossMesh.position);
        }
        if (state.bossLight) {
          state.bossLight.position.x = state.bossMesh.position.x;
          state.bossLight.position.z = state.bossMesh.position.z;
        }
      }
    }

    // Boss attack
    if (pDist < 18) {
      state.bossMesh.userData.fireTimer = (state.bossMesh.userData.fireTimer || 0) + dt;
      if (state.bossMesh.userData.fireTimer > 1.5) {
        state.bossMesh.userData.fireTimer = 0;
        if (Math.random() < 0.5) {
          state.playerHP -= 18;
          if (state.playerHP <= 0) {
            state.playerHP = 0;
            triggerGameOver('ELIMINATED BY PROJECT DIRECTOR KALA');
          }
        }
      }
    }

    // Shield recharge
    if (state.bossShieldRecharging) {
      state.bossShieldRechargeTimer += dt;
      if (state.bossShieldRechargeTimer >= state.bossShieldRechargeDuration) {
        state.bossShieldRecharging = false;
        state.bossShieldRechargeTimer = 0;
        state.bossShieldHP = state.bossShieldMax;
        state.bossShieldActive = true;
        if (state.bossShieldMesh) state.bossShieldMesh.visible = true;
        if (state.bossShieldLines) state.bossShieldLines.visible = true;
      }
    }

    // Animate shield pulse
    if (state.bossShieldActive && state.bossShieldMesh) {
      var pulse = 0.3 + 0.05 * Math.sin(Date.now() * 0.004);
      state.bossShieldMesh.material.opacity = pulse;
      var scale = 1 + 0.03 * Math.sin(Date.now() * 0.003);
      state.bossShieldMesh.scale.set(scale, scale, scale);
    }

    // Rotate boss to face player
    state.bossMesh.lookAt(state.playerPos.x, state.bossMesh.position.y, state.playerPos.z);
  }

  function bossTeleport() {
    // Teleport 15m in a random direction
    var angle = Math.random() * Math.PI * 2;
    var nx = state.bossMesh.position.x + Math.cos(angle) * 15;
    var nz = state.bossMesh.position.z + Math.sin(angle) * 15;
    nx = Math.max(-10, Math.min(10, nx));
    nz = Math.max(-16, Math.min(13, nz));
    state.bossMesh.position.set(nx, 1.0, nz);
    if (state.bossShieldMesh) state.bossShieldMesh.position.set(nx, 1.0, nz);
    if (state.bossLight) state.bossLight.position.set(nx, 2.5, nz);

    // Teleport flash
    var flashGeo = new THREE.SphereGeometry(2, 8, 6);
    var flashMat = new THREE.MeshLambertMaterial({ color: 0x0088FF, transparent: true, opacity: 0.7 });
    var flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(nx, 1.5, nz);
    state.scene.add(flash);
    state.allObjects.push(flash);
    setTimeout(function () { flash.visible = false; }, 300);
  }

  function updateSpecimen(dt) {
    if (!state.specimenAlive || !state.specimenMesh || state.specimenKilled) return;

    // Stun handling
    if (state.specimenStunned) {
      state.specimenStunTimer -= dt;
      if (state.specimenStunTimer <= 0) {
        state.specimenStunned = false;
        state.specimenStunTimer = 0;

        // If stunned near transformer — kill it
        var sdx = state.specimenMesh.position.x - (state.transformerMesh ? state.transformerMesh.position.x : 0);
        var sdz = state.specimenMesh.position.z - (state.transformerMesh ? state.transformerMesh.position.z : 0);
        var sDist = Math.sqrt(sdx * sdx + sdz * sdz);
        if (sDist < 10 && state.arcUsed) {
          state.specimenKilled = true;
          state.specimenAlive = false;
          state.specimenMesh.visible = false;
          if (state.specimenLight) state.specimenLight.intensity = 0;
          showOverlayMessage('SPECIMEN CONTAINED BY POWER ARC', '#44FFFF', 2500);
        }
      }
      return;
    }

    // Hunt player — fast
    var sx = state.specimenMesh.position.x;
    var sz = state.specimenMesh.position.z;
    var sdx2 = state.playerPos.x - sx;
    var sdz2 = state.playerPos.z - sz;
    var sDist2 = Math.sqrt(sdx2 * sdx2 + sdz2 * sdz2);

    if (sDist2 > 0.5) {
      var spd = 4.5;
      state.specimenMesh.position.x += (sdx2 / sDist2) * spd * dt;
      state.specimenMesh.position.z += (sdz2 / sDist2) * spd * dt;
      state.specimenMesh.lookAt(state.playerPos.x, state.specimenMesh.position.y, state.playerPos.z);

      if (state.specimenLight) {
        state.specimenLight.position.set(
          state.specimenMesh.position.x,
          1.5,
          state.specimenMesh.position.z
        );
      }
    }

    // Attack player on contact
    if (sDist2 < 1.5) {
      state.specimenMesh.userData.attackTimer = (state.specimenMesh.userData.attackTimer || 0) + dt;
      if (state.specimenMesh.userData.attackTimer > 0.5) {
        state.specimenMesh.userData.attackTimer = 0;
        state.playerHP -= 20;
        if (state.playerHP <= 0) {
          state.playerHP = 0;
          triggerGameOver('KILLED BY ESCAPED SPECIMEN');
        }
      }
    }
  }

  function updateArcStun(dt) {
    if (!state.arcStunActive) return;
    state.arcStunTimer -= dt;

    // Animate arc light
    if (state.arcLight) {
      state.arcLight.intensity = 3 + 2 * Math.sin(Date.now() * 0.02);
    }

    if (state.arcStunTimer <= 0) {
      state.arcStunActive = false;
      if (state.arcLight) {
        state.arcLight.intensity = 1.5;
        state.arcLight.color.setHex(C_ARC);
      }
    }
  }

  function updateSelfDestruct(dt) {
    if (!state.selfDestructTriggered || state.gameOver || state.gameWon) return;
    state.selfDestructTimer -= dt;

    // Alert light strobe
    if (state.alertLight) {
      state.alertLight.intensity = 1.5 + 1.5 * Math.sin(Date.now() * 0.01);
    }

    if (state.selfDestructTimer <= 0) {
      state.selfDestructTimer = 0;
      triggerGameOver('SELF-DESTRUCT DETONATED — STATION DESTROYED');
    }
  }

  function updateCentrifuges(dt) {
    for (var i = 0; i < state.centrifuges.length; i++) {
      var cm = state.centrifuges[i];
      cm.rotation.y += cm.userData.spinSpeed * dt;
    }
  }

  function updateShootCooldown(dt) {
    if (state.shootCooldown > 0) {
      state.shootCooldown -= dt;
      if (state.shootCooldown < 0) state.shootCooldown = 0;
    }
    if (state.muzzleFlashTimer > 0) {
      state.muzzleFlashTimer -= dt;
      if (state.muzzleFlashTimer <= 0) {
        state.muzzleFlashMesh.visible = false;
      }
    }
  }

  function updateInteractPrompts() {
    if (state.gameOver || state.gameWon) { hidePrompt(); return; }

    // Check nearby breakable/securable cases
    var candidate = trySecureArtifact();
    if (candidate) {
      // Show progress if actively holding E
      if (state.eHoldTarget === candidate && state.eHoldTimer > 0) {
        var pct = Math.min(1, state.eHoldTimer / 2);
        showPrompt('[E] SECURING ARTIFACT... ' + Math.round(pct * 100) + '%');
      } else {
        showPrompt('[E] HOLD TO SECURE ARTIFACT');
      }
      return;
    }

    // Check unbroken cases in range
    for (var i = 0; i < state.displayCases.length; i++) {
      var dc = state.displayCases[i];
      if (!dc.glassBroken && !dc.secured) {
        var d = dist2(state.playerPos.x, state.playerPos.z, dc.pedX, dc.pedZ);
        if (d < 3.5) {
          showPrompt('[SHOOT] BREAK GLASS CASE');
          return;
        }
      }
    }

    // Check transformer
    if (!state.arcUsed && state.transformerMesh) {
      var td = dist2(
        state.playerPos.x, state.playerPos.z,
        state.transformerMesh.position.x,
        state.transformerMesh.position.z
      );
      if (td < 10) {
        showPrompt('[F / SHOOT] FIRE ON TRANSFORMER TO TRIGGER ARC');
        return;
      }
    }

    // Win check proximity (hangar)
    if (isInHangar() && state.artifactsSecured >= 5 && !state.bossAlive) {
      showPrompt('[ENTER HANGAR] ESCAPE READY');
      checkWinCondition();
      return;
    }

    hidePrompt();
  }

  function updateEHold(dt) {
    if (state.gameOver || state.gameWon) return;
    var candidate = trySecureArtifact();

    if (candidate && (state.keysDown['e'] || state.keysDown['E'])) {
      if (state.eHoldTarget !== candidate) {
        state.eHoldTarget = candidate;
        state.eHoldTimer = 0;
      }
      state.eHoldTimer += dt;
      if (state.eHoldTimer >= 2) {
        state.eHoldTimer = 0;
        state.eHoldTarget = null;
        secureArtifact(candidate);
      }
    } else {
      state.eHoldTimer = 0;
      state.eHoldTarget = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MAIN LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  function animate(timestamp) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
    state.lastTime = timestamp;
    if (dt <= 0) dt = 0.016;

    updatePlayer(dt);
    updateCamera();
    updateEnemies(dt);
    updateBoss(dt);
    updateSpecimen(dt);
    updateArcStun(dt);
    updateSelfDestruct(dt);
    updateCentrifuges(dt);
    updateShootCooldown(dt);
    updateEHold(dt);
    updateInteractPrompts();

    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  INPUT
  // ═══════════════════════════════════════════════════════════════════════════
  function onKeyDown(e) {
    state.keysDown[e.key] = true;
    state.keyTimes[e.key] = Date.now();

    // F key — shoot transformer
    if (e.key === 'f' || e.key === 'F') {
      if (!state.arcUsed && state.transformerMesh) {
        var td = dist2(
          state.playerPos.x, state.playerPos.z,
          state.transformerMesh.position.x,
          state.transformerMesh.position.z
        );
        if (td < 30) {
          triggerArc();
        }
      }
    }
  }

  function onKeyUp(e) {
    state.keysDown[e.key] = false;
  }

  function onMouseMove(e) {
    if (!state.active || !state.mouseLocked) return;
    var sens = 0.002;
    state.yaw   -= e.movementX * sens;
    state.pitch -= e.movementY * sens;
    state.pitch  = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, state.pitch));
  }

  function onMouseDown(e) {
    if (!state.active) return;
    if (!state.mouseLocked) {
      state.renderer.domElement.requestPointerLock();
      return;
    }
    if (e.button === 0) {
      shoot();
    }
  }

  function onPointerLockChange() {
    state.mouseLocked = document.pointerLockElement === state.renderer.domElement;
  }

  function onResize() {
    if (!state.camera || !state.renderer) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(w, h);
  }

  function bindKeys() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
  }

  function bindMouse() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  function unbindKeys() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
  }

  function unbindMouse() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    if (document.exitPointerLock) document.exitPointerLock();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  ACTIVATION / DEACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════
  function handleActivationKey(e) {
    var key = (e.key || '').toLowerCase();
    var now = Date.now();
    if (key === 'r') _pendingKeyTimes['R'] = now;
    if (key === 's') _pendingKeyTimes['S'] = now;

    var tR = _pendingKeyTimes['R'] || 0;
    var tS = _pendingKeyTimes['S'] || 0;

    if (tR && tS && Math.abs(tR - tS) < ACTIVATION_WINDOW) {
      _pendingKeyTimes = {};
      if (!state.active) {
        init();
      } else {
        destroy();
      }
    }
  }

  function destroy() {
    if (!state.active) return;
    state.active = false;

    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }

    if (state.renderer) {
      if (state.renderer.domElement.parentNode) {
        state.renderer.domElement.parentNode.removeChild(state.renderer.domElement);
      }
      if (document.exitPointerLock) document.exitPointerLock();
      state.renderer.dispose();
      state.renderer = null;
    }

    if (state.hudEl && state.hudEl.parentNode) {
      state.hudEl.parentNode.removeChild(state.hudEl);
      state.hudEl = null;
    }

    if (state.hudInterval) {
      clearInterval(state.hudInterval);
      state.hudInterval = null;
    }

    if (state.interactPromptEl && state.interactPromptEl.parentNode) {
      state.interactPromptEl.parentNode.removeChild(state.interactPromptEl);
      state.interactPromptEl = null;
    }

    if (state._lastOverlay && state._lastOverlay.parentNode) {
      state._lastOverlay.parentNode.removeChild(state._lastOverlay);
      state._lastOverlay = null;
    }

    if (state.winTimeout) {
      clearTimeout(state.winTimeout);
      state.winTimeout = null;
    }

    unbindKeys();
    unbindMouse();

    state.scene = null;
    state.camera = null;
    state.allObjects = [];
    state.enemies = [];
    state.displayCases = [];
    state.centrifuges = [];
    state.bossMesh = null;
    state.specimenMesh = null;
    state.transformerMesh = null;
  }

  function update(dt) {
    // External update hook — main loop uses requestAnimationFrame internally
  }

  function reset() {
    destroy();
    init();
  }

  // Install global activation listener
  document.addEventListener('keydown', handleActivationKey);

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
