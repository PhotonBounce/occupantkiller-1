window.DoomsdayVault = (function () {
  'use strict';

  // ─── Activation keys: D=68, V=86 ───────────────────────────────────────────
  var KEY_D = 68;
  var KEY_V = 86;
  var ACTIVATION_WINDOW = 400;

  // ─── State ──────────────────────────────────────────────────────────────────
  var scene, camera, renderer, canvas;
  var active = false;
  var sceneObjects = [];

  var playerPos = { x: 0, y: 1.7, z: -55 };
  var playerVel = { x: 0, y: 0, z: 0 };
  var playerHP = 100;
  var playerYaw = 0;
  var playerPitch = 0;
  var playerOnGround = true;
  var hasCryoSuit = false;
  var carriedCores = 0;
  var extractedCores = 0;
  var depositedCores = 0;
  var gameWon = false;
  var gameLost = false;
  var loseReason = '';

  var selfDestructActive = false;
  var selfDestructTimer = 300; // 5 minutes
  var commanderAlerted = false;
  var commanderDead = false;
  var hasKeycard = false;
  var terminalDisarmed = false;

  var level2Entered = false;
  var level2Temp = 20;
  var level2TempMax = 45;
  var level2TempRate = 0.5;

  var soldiers = [];
  var commander = null;
  var interactables = [];
  var dataCores = [];
  var tempRegulators = [];
  var walls = [];
  var floors = [];

  var podCoresDeposited = 0;
  var podLaunching = false;
  var podLaunchTimer = 0;

  var elevatorY = 0;
  var elevatorTargetY = 0;
  var elevatorMoving = false;
  var elevatorPlatformMesh = null;
  var elevatorCallButtons = [];
  var playerInElevator = false;

  var hudEl = null;
  var crosshairEl = null;
  var promptEl = null;
  var timerEl = null;

  var gameTimer = 0;
  var interactTarget = null;
  var interactHoldTimer = 0;
  var interactHoldRequired = 2;

  var raycaster = null;
  var pointerLocked = false;
  var keyTimes = {};

  var alertedAll = false;
  var allSoldiersChase = false;

  var lights = [];
  var searchlightMeshes = [];
  var searchlightAngle = 0;

  var snowParticles = [];
  var particleSystem = null;

  var keycardMesh = null;

  // ─── Constants ──────────────────────────────────────────────────────────────
  var MOVE_SPEED = 7;
  var GRAVITY = -20;
  var PLAYER_HEIGHT = 1.7;
  var INTERACT_DIST = 3;
  var SOLDIER_SIGHT = 15;
  var SOLDIER_HP = 100;
  var COMMANDER_HP = 400;
  var SHOOT_DAMAGE = 25;
  var SOLDIER_DAMAGE = 10;
  var SOLDIER_SHOOT_RANGE = 14;
  var SOLDIER_SHOOT_CD = 1.5;
  var TEMP_DAMAGE_RATE = 3;
  var SELF_DESTRUCT_DURATION = 300;

  var L1_Y = 0;
  var L2_Y = -12;
  var L3_Y = -24;
  var L4_Y = -36;
  var LEVEL_H = 8;

  var ELEVATOR_X = 20;
  var STAIRS_X = -20;

  // ─── Init ───────────────────────────────────────────────────────────────────
  function init(cvs, cam, scn, rend) {
    canvas = cvs;
    camera = cam;
    scene = scn;
    renderer = rend;
    active = true;

    raycaster = new THREE.Raycaster();

    camera.position.set(playerPos.x, playerPos.y, playerPos.z);
    camera.rotation.order = 'YXZ';

    buildWorld();
    buildSoldiers();
    buildCommander();
    buildHUD();
    setupPointerLock();

    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.018);
    scene.background = new THREE.Color(0x0a0f1a);
  }

  // ─── World ──────────────────────────────────────────────────────────────────
  function buildWorld() {
    buildLighting();
    buildArcticExterior();
    buildLevel1();
    buildLevel2();
    buildLevel3();
    buildLevel4();
    buildElevator();
    buildStairs();
    buildParticles();
  }

  function buildLighting() {
    var ambient = new THREE.AmbientLight(0x112233, 0.4);
    scene.add(ambient);
    sceneObjects.push(ambient);

    var sun = new THREE.DirectionalLight(0x8899aa, 0.6);
    sun.position.set(50, 100, -50);
    scene.add(sun);
    sceneObjects.push(sun);

    // Level spotlights
    var lvlPositions = [
      [0, L1_Y + 7, 20],
      [0, L2_Y + 7, 20],
      [0, L3_Y + 7, 20],
      [0, L4_Y + 7, 20]
    ];
    var lvlColors = [0x99aacc, 0x44aaff, 0x4466ff, 0xff4422];
    for (var li = 0; li < lvlPositions.length; li++) {
      var sp = new THREE.SpotLight(lvlColors[li], 0.8, 50, Math.PI / 3, 0.5);
      sp.position.set(lvlPositions[li][0], lvlPositions[li][1], lvlPositions[li][2]);
      sp.target.position.set(lvlPositions[li][0], lvlPositions[li][1] - 7, lvlPositions[li][2]);
      scene.add(sp);
      scene.add(sp.target);
      sceneObjects.push(sp);
      sceneObjects.push(sp.target);
    }
  }

  function makeMesh(geo, mat, x, y, z, parent) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    var container = parent || scene;
    container.add(mesh);
    if (!parent) sceneObjects.push(mesh);
    return mesh;
  }

  function makeBox(w, h, d, color, x, y, z, opts) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    if (opts) {
      if (opts.emissive) mat.emissive = new THREE.Color(opts.emissive);
      if (opts.opacity !== undefined) { mat.transparent = true; mat.opacity = opts.opacity; }
      if (opts.wireframe) mat.wireframe = opts.wireframe;
    }
    var geo = new THREE.BoxGeometry(w, h, d);
    return makeMesh(geo, mat, x, y, z);
  }

  function addFloor(mesh) { floors.push(mesh); }
  function addWall(mesh) { walls.push(mesh); }

  // ─── Arctic Exterior ────────────────────────────────────────────────────────
  function buildArcticExterior() {
    // Snow ground
    var ground = makeBox(200, 1, 200, 0xDDEEFF, 0, -0.5, -30);
    addFloor(ground);

    // Snow banks / mountains
    for (var mi = 0; mi < 8; mi++) {
      var mx = (mi % 4) * 30 - 45;
      var mz = -80 - Math.floor(mi / 4) * 20;
      var mh = 15 + Math.random() * 20;
      makeBox(20 + Math.random() * 15, mh, 20 + Math.random() * 15, 0xCCDDEE, mx, mh / 2 - 1, mz);
    }

    // Icicles above entrance
    for (var ii = 0; ii < 12; ii++) {
      var ix = (ii - 6) * 2.5;
      var iLen = 1.5 + Math.random() * 3;
      var geo = new THREE.ConeGeometry(0.2 + Math.random() * 0.2, iLen, 5);
      var mat = new THREE.MeshLambertMaterial({ color: 0xaaccee });
      var ic = new THREE.Mesh(geo, mat);
      ic.position.set(ix, 5.5 - iLen / 2, -55);
      ic.rotation.z = Math.PI;
      scene.add(ic);
      sceneObjects.push(ic);
    }

    // Blast door
    var door = makeBox(12, 8, 1.5, 0x556677, 0, 4, -54);
    door.name = 'blastDoor';
    addWall(door);

    // Door frame
    makeBox(14, 10, 1, 0x334455, 0, 4, -55);

    // Searchlights
    buildSearchlights();

    // Entry tunnel
    makeBox(12, 8, 4, 0x445566, 0, 4, -52);  // ceiling of tunnel
    var tunnelFloor = makeBox(12, 1, 10, 0x334455, 0, -0.5, -50);
    addFloor(tunnelFloor);
    var tWallL = makeBox(1, 8, 10, 0x445566, -6, 4, -50);
    var tWallR = makeBox(1, 8, 10, 0x445566, 6, 4, -50);
    addWall(tWallL); addWall(tWallR);
  }

  function buildSearchlights() {
    var slPositions = [[-15, 0, -58], [15, 0, -58]];
    for (var si = 0; si < slPositions.length; si++) {
      var sp = slPositions[si];
      // Base
      makeBox(1.5, 0.5, 1.5, 0x334455, sp[0], sp[1] + 0.25, sp[2]);
      // Beam housing cylinder
      var geo = new THREE.CylinderGeometry(0.4, 0.5, 1, 8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x667788 });
      var housing = new THREE.Mesh(geo, mat);
      housing.position.set(sp[0], sp[1] + 1, sp[2]);
      scene.add(housing);
      sceneObjects.push(housing);
      searchlightMeshes.push({ mesh: housing, baseX: sp[0], baseZ: sp[2], phase: si * Math.PI });
      // SpotLight
      var spot = new THREE.SpotLight(0xffffff, 2, 40, Math.PI / 12, 0.3);
      spot.position.set(sp[0], sp[1] + 1.5, sp[2]);
      scene.add(spot);
      sceneObjects.push(spot);
      var tgt = new THREE.Object3D();
      tgt.position.set(sp[0] + 10, 0, sp[2] - 10);
      scene.add(tgt);
      sceneObjects.push(tgt);
      spot.target = tgt;
      searchlightMeshes[si].spot = spot;
      searchlightMeshes[si].target = tgt;
    }
  }

  // ─── Level 1: Security ──────────────────────────────────────────────────────
  function buildLevel1() {
    var y = L1_Y;

    // Main floor
    var fl = makeBox(50, 1, 50, 0x334455, 0, y - 0.5, 20);
    addFloor(fl);

    // Ceiling
    makeBox(50, 1, 50, 0x223344, 0, y + LEVEL_H, 20);

    // Outer walls
    var w1 = makeBox(1, LEVEL_H, 50, 0x445566, -25, y + LEVEL_H / 2, 20);
    var w2 = makeBox(1, LEVEL_H, 50, 0x445566, 25, y + LEVEL_H / 2, 20);
    var w3 = makeBox(50, LEVEL_H, 1, 0x445566, 0, y + LEVEL_H / 2, -5);
    var w4 = makeBox(50, LEVEL_H, 1, 0x445566, 0, y + LEVEL_H / 2, 45);
    addWall(w1); addWall(w2); addWall(w3); addWall(w4);

    // Guard desks
    var deskPositions = [[-10, y, 5], [10, y, 5], [-10, y, 15], [10, y, 15]];
    for (var di = 0; di < deskPositions.length; di++) {
      var dp = deskPositions[di];
      makeBox(3, 1, 1.5, 0x556677, dp[0], dp[1] + 0.5, dp[2]);
      makeBox(2.8, 0.1, 1.3, 0x334455, dp[0], dp[1] + 1.05, dp[2]); // desk top
      // Keycard reader - LineSegments frame
      var kfGeo = new THREE.BoxGeometry(0.3, 0.5, 0.1);
      var kfEdges = new THREE.EdgesGeometry(kfGeo);
      var kfLine = new THREE.LineSegments(kfEdges, new THREE.LineBasicMaterial({ color: 0xff7700 }));
      kfLine.position.set(dp[0] + 1.8, dp[1] + 1.2, dp[2] - 0.8);
      scene.add(kfLine);
      sceneObjects.push(kfLine);
      // Orange indicator light
      var pl = new THREE.PointLight(0xff7700, 0.5, 3);
      pl.position.set(dp[0] + 1.8, dp[1] + 1.4, dp[2] - 0.8);
      scene.add(pl);
      sceneObjects.push(pl);
    }

    // Security cameras
    var camPositions = [[-23, y + 6, 10], [23, y + 6, 10], [0, y + 6, 43]];
    for (var ci = 0; ci < camPositions.length; ci++) {
      var cp = camPositions[ci];
      var camGeo = new THREE.SphereGeometry(0.3, 8, 8);
      var camMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
      var camMesh = new THREE.Mesh(camGeo, camMat);
      camMesh.position.set(cp[0], cp[1], cp[2]);
      scene.add(camMesh);
      sceneObjects.push(camMesh);
      makeBox(0.2, 0.5, 0.2, 0x334455, cp[0], cp[1] + 0.4, cp[2]);
      var redPl = new THREE.PointLight(0xff0000, 0.3, 2);
      redPl.position.set(cp[0], cp[1], cp[2]);
      scene.add(redPl);
      sceneObjects.push(redPl);
    }

    // Extraction pod
    buildExtractionPod(y);

    // Separator wall between entrance and main area
    var sep = makeBox(18, LEVEL_H, 1, 0x445566, -4, y + LEVEL_H / 2, -4);
    addWall(sep);
    var sep2 = makeBox(10, LEVEL_H, 1, 0x445566, 17, y + LEVEL_H / 2, -4);
    addWall(sep2);
  }

  function buildExtractionPod(y) {
    // Extraction pod platform
    var pod = makeBox(6, 0.5, 6, 0x556688, 0, y + 0.25, 35);
    pod.name = 'extractionPod';

    // Pod structure - cylindrical capsule
    var podGeo = new THREE.CylinderGeometry(2, 2.5, 3, 10);
    var podMat = new THREE.MeshLambertMaterial({ color: 0x667799, emissive: new THREE.Color(0x001122) });
    var podMesh = new THREE.Mesh(podGeo, podMat);
    podMesh.position.set(0, y + 2.5, 35);
    scene.add(podMesh);
    sceneObjects.push(podMesh);

    // Pod glow
    var podLight = new THREE.PointLight(0x2244ff, 1.5, 8);
    podLight.position.set(0, y + 3, 35);
    scene.add(podLight);
    sceneObjects.push(podLight);

    // Edge lines
    var podEdges = new THREE.EdgesGeometry(podGeo);
    var podLines = new THREE.LineSegments(podEdges, new THREE.LineBasicMaterial({ color: 0x4488ff }));
    podLines.position.set(0, y + 2.5, 35);
    scene.add(podLines);
    sceneObjects.push(podLines);

    interactables.push({
      type: 'pod',
      mesh: pod,
      pos: { x: 0, y: y + 1, z: 35 },
      holdTime: 3,
      label: 'LAUNCH POD [Hold E]'
    });
  }

  // ─── Level 2: Seed Bank ─────────────────────────────────────────────────────
  function buildLevel2() {
    var y = L2_Y;

    var fl = makeBox(50, 1, 50, 0x223344, 0, y - 0.5, 20);
    addFloor(fl);
    makeBox(50, 1, 50, 0x1a2233, 0, y + LEVEL_H, 20);

    var w1 = makeBox(1, LEVEL_H, 50, 0x334455, -25, y + LEVEL_H / 2, 20);
    var w2 = makeBox(1, LEVEL_H, 50, 0x334455, 25, y + LEVEL_H / 2, 20);
    var w3 = makeBox(50, LEVEL_H, 1, 0x334455, 0, y + LEVEL_H / 2, -5);
    var w4 = makeBox(50, LEVEL_H, 1, 0x334455, 0, y + LEVEL_H / 2, 45);
    addWall(w1); addWall(w2); addWall(w3); addWall(w4);

    // Climate-controlled chambers
    var chamberCols = 5;
    var chamberRows = 4;
    for (var row = 0; row < chamberRows; row++) {
      for (var col = 0; col < chamberCols; col++) {
        var cx = -18 + col * 9;
        var cz = 5 + row * 9;
        var chamber = makeBox(4, 5, 3, 0x445566, cx, y + 3, cz);
        chamber.name = 'chamber_' + row + '_' + col;
        // Green indicator light on each chamber
        var gl = new THREE.PointLight(0x00ff44, 0.4, 4);
        gl.position.set(cx, y + 5.5, cz - 1.5);
        scene.add(gl);
        sceneObjects.push(gl);
        // Glass panel effect (transparent box)
        var panelGeo = new THREE.BoxGeometry(3.5, 4, 0.1);
        var panelMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.25 });
        var panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(cx, y + 3, cz - 1.55);
        scene.add(panel);
        sceneObjects.push(panel);
      }
    }

    // Temperature regulators
    var regPositions = [[-20, y, 20], [0, y, 40], [20, y, 20]];
    for (var ri = 0; ri < regPositions.length; ri++) {
      var rp = regPositions[ri];
      var reg = makeBox(2, 3, 2, 0x336688, rp[0], rp[1] + 1.5, rp[2]);
      reg.name = 'regulator_' + ri;
      var rl = new THREE.PointLight(0x0088ff, 0.8, 5);
      rl.position.set(rp[0], rp[1] + 3.5, rp[2]);
      scene.add(rl);
      sceneObjects.push(rl);
      tempRegulators.push({ mesh: reg, pos: { x: rp[0], y: rp[1] + 1.5, z: rp[2] }, active: true, light: rl });
    }

    // Cryo-suit pickup
    buildCryoSuit(y);
  }

  function buildCryoSuit(y) {
    var cryoGeo = new THREE.BoxGeometry(1, 2, 0.5);
    var cryoMat = new THREE.MeshLambertMaterial({ color: 0x00ffee, emissive: new THREE.Color(0x004444) });
    var cryoMesh = new THREE.Mesh(cryoGeo, cryoMat);
    cryoMesh.position.set(-5, y + 1, 30);
    scene.add(cryoMesh);
    sceneObjects.push(cryoMesh);

    var cryoLight = new THREE.PointLight(0x00ffee, 1, 5);
    cryoLight.position.set(-5, y + 2, 30);
    scene.add(cryoLight);
    sceneObjects.push(cryoLight);

    // Edge highlight
    var cryoEdges = new THREE.EdgesGeometry(cryoGeo);
    var cryoLines = new THREE.LineSegments(cryoEdges, new THREE.LineBasicMaterial({ color: 0x00ffff }));
    cryoLines.position.set(-5, y + 1, 30);
    scene.add(cryoLines);
    sceneObjects.push(cryoLines);

    interactables.push({
      type: 'cryo',
      mesh: cryoMesh,
      linesObj: cryoLines,
      lightObj: cryoLight,
      pos: { x: -5, y: y + 1, z: 30 },
      holdTime: 0.5,
      label: 'PICK UP CRYO-SUIT [E]',
      collected: false
    });
  }

  // ─── Level 3: Data Storage ──────────────────────────────────────────────────
  function buildLevel3() {
    var y = L3_Y;

    var fl = makeBox(50, 1, 50, 0x1a2233, 0, y - 0.5, 20);
    addFloor(fl);
    makeBox(50, 1, 50, 0x111827, 0, y + LEVEL_H, 20);

    var w1 = makeBox(1, LEVEL_H, 50, 0x223344, -25, y + LEVEL_H / 2, 20);
    var w2 = makeBox(1, LEVEL_H, 50, 0x223344, 25, y + LEVEL_H / 2, 20);
    var w3 = makeBox(50, LEVEL_H, 1, 0x223344, 0, y + LEVEL_H / 2, -5);
    var w4 = makeBox(50, LEVEL_H, 1, 0x223344, 0, y + LEVEL_H / 2, 45);
    addWall(w1); addWall(w2); addWall(w3); addWall(w4);

    // Server towers
    var towerPositions = [
      [-15, y, 8], [-5, y, 8], [5, y, 8], [15, y, 8],
      [-15, y, 20], [-5, y, 20], [5, y, 20], [15, y, 20],
      [-15, y, 32], [-5, y, 32], [5, y, 32], [15, y, 32]
    ];
    for (var ti = 0; ti < towerPositions.length; ti++) {
      var tp = towerPositions[ti];
      var tGeo = new THREE.CylinderGeometry(0.6, 0.7, 5, 8);
      var tMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(tp[0], tp[1] + 3, tp[2]);
      scene.add(tMesh);
      sceneObjects.push(tMesh);
      var tLight = new THREE.PointLight(0x0044ff, 0.3, 4);
      tLight.position.set(tp[0], tp[1] + 5.5, tp[2]);
      scene.add(tLight);
      sceneObjects.push(tLight);
      // Blinking LED box
      makeBox(0.15, 0.15, 0.05, 0x00aaff, tp[0], tp[1] + 3, tp[2] - 0.75);
    }

    // Data cores on pedestals
    var corePositions = [
      { x: -10, z: 15 },
      { x: 10, z: 15 },
      { x: -10, z: 30 },
      { x: 10, z: 30 }
    ];
    for (var ki = 0; ki < corePositions.length; ki++) {
      buildDataCore(ki, corePositions[ki].x, y, corePositions[ki].z);
    }
  }

  function buildDataCore(idx, cx, y, cz) {
    // Pedestal
    var ped = makeBox(1.5, 1, 1.5, 0x334466, cx, y + 0.5, cz);

    // Core (glowing cylinder)
    var coreGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 10);
    var coreMat = new THREE.MeshLambertMaterial({ color: 0x00aaff, emissive: new THREE.Color(0x002244) });
    var coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(cx, y + 1.4, cz);
    scene.add(coreMesh);
    sceneObjects.push(coreMesh);

    // Edge lines
    var coreEdges = new THREE.EdgesGeometry(coreGeo);
    var coreLines = new THREE.LineSegments(coreEdges, new THREE.LineBasicMaterial({ color: 0x44ccff }));
    coreLines.position.set(cx, y + 1.4, cz);
    scene.add(coreLines);
    sceneObjects.push(coreLines);

    var coreLight = new THREE.PointLight(0x0088ff, 1.2, 6);
    coreLight.position.set(cx, y + 2.2, cz);
    scene.add(coreLight);
    sceneObjects.push(coreLight);

    var coreObj = {
      type: 'core',
      idx: idx,
      mesh: coreMesh,
      linesObj: coreLines,
      pedMesh: ped,
      lightObj: coreLight,
      pos: { x: cx, y: y + 1.4, z: cz },
      holdTime: 2,
      label: 'EXTRACT DATA CORE ' + (idx + 1) + ' [Hold E 2s]',
      collected: false
    };
    dataCores.push(coreObj);
    interactables.push(coreObj);
  }

  // ─── Level 4: Control Hub ───────────────────────────────────────────────────
  function buildLevel4() {
    var y = L4_Y;

    var fl = makeBox(50, 1, 50, 0x1a1522, 0, y - 0.5, 20);
    addFloor(fl);
    makeBox(50, 1, 50, 0x110f18, 0, y + LEVEL_H, 20);

    var w1 = makeBox(1, LEVEL_H, 50, 0x221833, -25, y + LEVEL_H / 2, 20);
    var w2 = makeBox(1, LEVEL_H, 50, 0x221833, 25, y + LEVEL_H / 2, 20);
    var w3 = makeBox(50, LEVEL_H, 1, 0x221833, 0, y + LEVEL_H / 2, -5);
    var w4 = makeBox(50, LEVEL_H, 1, 0x221833, 0, y + LEVEL_H / 2, 45);
    addWall(w1); addWall(w2); addWall(w3); addWall(w4);

    // Control panels (LineSegments)
    buildControlPanels(y);

    // Commander's office partition
    var offWall1 = makeBox(20, LEVEL_H, 1, 0x332244, 5, y + LEVEL_H / 2, 25);
    var offWall2 = makeBox(1, LEVEL_H, 15, 0x332244, -5, y + LEVEL_H / 2, 32.5);
    addWall(offWall1); addWall(offWall2);
    // Office desk
    makeBox(4, 1, 2, 0x443355, 10, y + 0.5, 35);

    // Self-destruct terminal
    buildSelfDestructTerminal(y);

    // Red ambient for level 4
    var redAmbient = new THREE.PointLight(0xff2200, 0.4, 60);
    redAmbient.position.set(0, y + 5, 20);
    scene.add(redAmbient);
    sceneObjects.push(redAmbient);
  }

  function buildControlPanels(y) {
    var panelPositions = [
      [-20, y, 5], [-12, y, 5], [-4, y, 5], [4, y, 5]
    ];
    for (var pi = 0; pi < panelPositions.length; pi++) {
      var pp = panelPositions[pi];
      // Panel base box
      makeBox(5, 2, 1, 0x221133, pp[0], pp[1] + 2, pp[2]);
      // LineSegments face details
      var panGeo = new THREE.BoxGeometry(4.5, 1.8, 0.05);
      var panEdges = new THREE.EdgesGeometry(panGeo);
      var panLines = new THREE.LineSegments(panEdges, new THREE.LineBasicMaterial({ color: 0xff3300 }));
      panLines.position.set(pp[0], pp[1] + 2, pp[2] + 0.55);
      scene.add(panLines);
      sceneObjects.push(panLines);
      // Indicator lights
      var iLight = new THREE.PointLight(0xff2200, 0.5, 4);
      iLight.position.set(pp[0], pp[1] + 3.2, pp[2]);
      scene.add(iLight);
      sceneObjects.push(iLight);
    }
  }

  function buildSelfDestructTerminal(y) {
    // Terminal structure
    var term = makeBox(2, 3, 1, 0x441122, 0, y + 1.5, 40);
    term.name = 'selfDestructTerminal';

    var termEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 3, 1));
    var termLines = new THREE.LineSegments(termEdges, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    termLines.position.set(0, y + 1.5, 40);
    scene.add(termLines);
    sceneObjects.push(termLines);

    var termLight = new THREE.PointLight(0xff0000, 1, 8);
    termLight.position.set(0, y + 3.5, 40);
    scene.add(termLight);
    sceneObjects.push(termLight);

    // Screen
    makeBox(1.6, 1, 0.05, 0x220011, 0, y + 2.2, 39.5);

    interactables.push({
      type: 'terminal',
      mesh: term,
      pos: { x: 0, y: y + 1.5, z: 40 },
      holdTime: 2,
      label: 'DISARM SELF-DESTRUCT [Hold E 2s] (Need Keycard)',
      collected: false
    });
  }

  // ─── Elevator ───────────────────────────────────────────────────────────────
  function buildElevator() {
    // Shaft
    var shaftGeo = new THREE.CylinderGeometry(2.5, 2.5, 48, 12, 1, true);
    var shaftMat = new THREE.MeshLambertMaterial({ color: 0x334455, side: THREE.BackSide, transparent: true, opacity: 0.6 });
    var shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set(ELEVATOR_X, L1_Y - 24, 20);
    scene.add(shaft);
    sceneObjects.push(shaft);

    // Shaft wall cutouts / guides
    for (var gi = 0; gi < 8; gi++) {
      var gy = L1_Y - gi * 6;
      makeBox(0.2, 0.5, 0.2, 0x556677, ELEVATOR_X + 2.3, gy, 20);
      makeBox(0.2, 0.5, 0.2, 0x556677, ELEVATOR_X - 2.3, gy, 20);
    }

    // Platform
    var platGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.3, 12);
    var platMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    elevatorPlatformMesh = new THREE.Mesh(platGeo, platMat);
    elevatorPlatformMesh.position.set(ELEVATOR_X, L1_Y + 0.15, 20);
    scene.add(elevatorPlatformMesh);
    sceneObjects.push(elevatorPlatformMesh);
    elevatorY = L1_Y + 0.15;
    elevatorTargetY = L1_Y + 0.15;

    // Elevator floor (solid)
    var eFloor = makeBox(4, 0.2, 4, 0x556677, ELEVATOR_X, L1_Y + 0.1, 20);
    addFloor(eFloor);

    // Call buttons at each level
    var levelYs = [L1_Y, L2_Y, L3_Y, L4_Y];
    var levelNames = ['L1', 'L2', 'L3', 'L4'];
    for (var bi = 0; bi < levelYs.length; bi++) {
      var by = levelYs[bi];
      var btnBox = makeBox(0.4, 0.4, 0.2, 0x667788, ELEVATOR_X + 3, by + 1.5, 22);
      var btnLight = new THREE.PointLight(0x88aaff, 0.4, 2);
      btnLight.position.set(ELEVATOR_X + 3, by + 1.7, 22);
      scene.add(btnLight);
      sceneObjects.push(btnLight);
      elevatorCallButtons.push({
        mesh: btnBox,
        pos: { x: ELEVATOR_X + 3, y: by + 1.5, z: 22 },
        targetY: by + 0.15,
        label: 'ELEVATOR TO ' + levelNames[bi] + ' [E]'
      });
      interactables.push({
        type: 'elevator',
        mesh: btnBox,
        pos: { x: ELEVATOR_X + 3, y: by + 1.5, z: 22 },
        holdTime: 0.1,
        label: 'CALL ELEVATOR TO ' + levelNames[bi] + ' [E]',
        targetY: by + 0.15,
        collected: false
      });
    }
  }

  // ─── Stairs ─────────────────────────────────────────────────────────────────
  function buildStairs() {
    var levelYs = [L1_Y, L2_Y, L3_Y, L4_Y];
    for (var li = 0; li < levelYs.length - 1; li++) {
      var startY = levelYs[li];
      var endY = levelYs[li + 1];
      var totalH = startY - endY;
      var numSteps = 16;
      for (var si = 0; si < numSteps; si++) {
        var stepY = startY - (si / numSteps) * totalH;
        var stepZ = 5 + si * (30 / numSteps);
        var step = makeBox(4, 0.5, 1.8, 0x445566, STAIRS_X, stepY - 0.25, stepZ - 5 + li * 2);
        addFloor(step);
      }
      // Landing
      var landing = makeBox(4, 0.5, 4, 0x556677, STAIRS_X, endY - 0.25, 5 + li * 2);
      addFloor(landing);
      // Railing
      makeBox(0.1, 1, 30, 0x334455, STAIRS_X + 2, startY - totalH / 2, 5 + li * 2 + 15);
      makeBox(0.1, 1, 30, 0x334455, STAIRS_X - 2, startY - totalH / 2, 5 + li * 2 + 15);
    }

    // Openings in level floors for stairs
    for (var oi = 0; oi < 3; oi++) {
      // Mark a hole area – we handle it as an access zone
      interactables.push({
        type: 'stairAccess',
        pos: { x: STAIRS_X, y: levelYs[oi], z: 3 + oi * 2 },
        holdTime: 0,
        label: '',
        collected: false
      });
    }
  }

  // ─── Snow Particles ──────────────────────────────────────────────────────────
  function buildParticles() {
    var count = 300;
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    for (var pi = 0; pi < count; pi++) {
      positions[pi * 3] = (Math.random() - 0.5) * 80;
      positions[pi * 3 + 1] = Math.random() * 20 - 2;
      positions[pi * 3 + 2] = -80 + Math.random() * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8 });
    particleSystem = new THREE.Points(geo, mat);
    scene.add(particleSystem);
    sceneObjects.push(particleSystem);
  }

  // ─── Soldiers ───────────────────────────────────────────────────────────────
  function buildSoldiers() {
    var waypointSets = [
      // Level 1 soldiers
      [{ x: -10, y: L1_Y + PLAYER_HEIGHT, z: 5 }, { x: 10, y: L1_Y + PLAYER_HEIGHT, z: 5 }],
      [{ x: -10, y: L1_Y + PLAYER_HEIGHT, z: 15 }, { x: 10, y: L1_Y + PLAYER_HEIGHT, z: 15 }],
      [{ x: -20, y: L1_Y + PLAYER_HEIGHT, z: 25 }, { x: 20, y: L1_Y + PLAYER_HEIGHT, z: 25 }],
      [{ x: 0, y: L1_Y + PLAYER_HEIGHT, z: 35 }, { x: -15, y: L1_Y + PLAYER_HEIGHT, z: 10 }],
      [{ x: 15, y: L1_Y + PLAYER_HEIGHT, z: 35 }, { x: 0, y: L1_Y + PLAYER_HEIGHT, z: 10 }],
      [{ x: -5, y: L1_Y + PLAYER_HEIGHT, z: -2 }, { x: 5, y: L1_Y + PLAYER_HEIGHT, z: -2 }],
      // Level 2 soldiers
      [{ x: -15, y: L2_Y + PLAYER_HEIGHT, z: 10 }, { x: 15, y: L2_Y + PLAYER_HEIGHT, z: 10 }],
      [{ x: -15, y: L2_Y + PLAYER_HEIGHT, z: 30 }, { x: 15, y: L2_Y + PLAYER_HEIGHT, z: 30 }],
      [{ x: 0, y: L2_Y + PLAYER_HEIGHT, z: 20 }, { x: -20, y: L2_Y + PLAYER_HEIGHT, z: 20 }],
      [{ x: 20, y: L2_Y + PLAYER_HEIGHT, z: 20 }, { x: 0, y: L2_Y + PLAYER_HEIGHT, z: 40 }],
      [{ x: 5, y: L2_Y + PLAYER_HEIGHT, z: 5 }, { x: -5, y: L2_Y + PLAYER_HEIGHT, z: 40 }],
      // Level 3 soldiers
      [{ x: -15, y: L3_Y + PLAYER_HEIGHT, z: 10 }, { x: 15, y: L3_Y + PLAYER_HEIGHT, z: 10 }],
      [{ x: -15, y: L3_Y + PLAYER_HEIGHT, z: 30 }, { x: 15, y: L3_Y + PLAYER_HEIGHT, z: 30 }],
      [{ x: 0, y: L3_Y + PLAYER_HEIGHT, z: 15 }, { x: 0, y: L3_Y + PLAYER_HEIGHT, z: 35 }],
      [{ x: -20, y: L3_Y + PLAYER_HEIGHT, z: 20 }, { x: 20, y: L3_Y + PLAYER_HEIGHT, z: 20 }],
      [{ x: 10, y: L3_Y + PLAYER_HEIGHT, z: 5 }, { x: -10, y: L3_Y + PLAYER_HEIGHT, z: 40 }],
      [{ x: -5, y: L3_Y + PLAYER_HEIGHT, z: 5 }, { x: 5, y: L3_Y + PLAYER_HEIGHT, z: 40 }],
      // Level 4 soldiers
      [{ x: -15, y: L4_Y + PLAYER_HEIGHT, z: 10 }, { x: 15, y: L4_Y + PLAYER_HEIGHT, z: 10 }],
      [{ x: -15, y: L4_Y + PLAYER_HEIGHT, z: 30 }, { x: 15, y: L4_Y + PLAYER_HEIGHT, z: 30 }],
      [{ x: 0, y: L4_Y + PLAYER_HEIGHT, z: 15 }, { x: 0, y: L4_Y + PLAYER_HEIGHT, z: 38 }],
      [{ x: -10, y: L4_Y + PLAYER_HEIGHT, z: 20 }, { x: 10, y: L4_Y + PLAYER_HEIGHT, z: 20 }],
      [{ x: 5, y: L4_Y + PLAYER_HEIGHT, z: 5 }, { x: -5, y: L4_Y + PLAYER_HEIGHT, z: 35 }],
      [{ x: -20, y: L4_Y + PLAYER_HEIGHT, z: 25 }, { x: 20, y: L4_Y + PLAYER_HEIGHT, z: 25 }],
      [{ x: 0, y: L4_Y + PLAYER_HEIGHT, z: 38 }, { x: -15, y: L4_Y + PLAYER_HEIGHT, z: 38 }],
      [{ x: 15, y: L4_Y + PLAYER_HEIGHT, z: 38 }, { x: 0, y: L4_Y + PLAYER_HEIGHT, z: 5 }]
    ];

    for (var si = 0; si < 25; si++) {
      var wpts = waypointSets[si];
      var startWpt = wpts[0];
      var soldier = buildHumanoid(startWpt.x, startWpt.y - PLAYER_HEIGHT, startWpt.z, 0x2244aa, 0.9);
      soldiers.push({
        mesh: soldier.group,
        headMesh: soldier.head,
        bodyMesh: soldier.body,
        hp: SOLDIER_HP,
        state: 'patrol',
        waypoints: wpts,
        waypointIndex: 0,
        shootCooldown: 0,
        alertTimer: 0,
        dead: false,
        pos: { x: startWpt.x, y: startWpt.y, z: startWpt.z },
        vel: { x: 0, y: 0, z: 0 }
      });
    }
  }

  function buildCommander() {
    var comPos = { x: 10, y: L4_Y, z: 35 };
    var com = buildHumanoid(comPos.x, comPos.y, comPos.z, 0x223344, 1.2);
    // Rank marker - gold helmet
    var rankGeo = new THREE.SphereGeometry(0.45, 8, 8);
    var rankMat = new THREE.MeshLambertMaterial({ color: 0xddaa00 });
    var rankMesh = new THREE.Mesh(rankGeo, rankMat);
    rankMesh.position.set(0, 0.55, 0);
    com.group.add(rankMesh);
    // Keycard on commander
    keycardMesh = makeBox(0.3, 0.05, 0.5, 0xff8800, comPos.x + 0.6, L4_Y + 1.2, comPos.z);

    commander = {
      mesh: com.group,
      headMesh: com.head,
      bodyMesh: com.body,
      hp: COMMANDER_HP,
      state: 'patrol',
      waypoints: [
        { x: 5, y: L4_Y + PLAYER_HEIGHT, z: 30 },
        { x: 15, y: L4_Y + PLAYER_HEIGHT, z: 38 },
        { x: 15, y: L4_Y + PLAYER_HEIGHT, z: 25 }
      ],
      waypointIndex: 0,
      shootCooldown: 0,
      alertTimer: 0,
      dead: false,
      pos: { x: comPos.x, y: comPos.y + PLAYER_HEIGHT, z: comPos.z },
      vel: { x: 0, y: 0, z: 0 }
    };
  }

  function buildHumanoid(x, y, z, color, scale) {
    var group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale || 1);

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.35);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.05, 0);
    group.add(body);

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x998877 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.7, 0);
    group.add(head);

    // Helmet
    var helmGeo = new THREE.SphereGeometry(0.24, 8, 8);
    var helmMat = new THREE.MeshLambertMaterial({ color: color });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.set(0, 1.78, 0);
    group.add(helm);

    // Left leg
    var legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.9, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: color });
    var legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.18, 0.45, 0);
    group.add(legL);

    // Right leg
    var legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.18, 0.45, 0);
    group.add(legR);

    // Left arm
    var armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.7, 6);
    var armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.42, 1.1, 0);
    armL.rotation.z = 0.3;
    group.add(armL);

    // Right arm
    var armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.42, 1.1, 0);
    armR.rotation.z = -0.3;
    group.add(armR);

    scene.add(group);
    sceneObjects.push(group);

    return { group: group, head: head, body: body };
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'dv-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100%',
      'padding:8px 14px',
      'box-sizing:border-box',
      'color:#00ff88',
      'background:rgba(0,10,20,0.72)',
      'font-family:monospace',
      'font-size:13px',
      'z-index:1000',
      'user-select:none',
      'pointer-events:none',
      'letter-spacing:0.04em'
    ].join(';');
    document.body.appendChild(hudEl);

    crosshairEl = document.createElement('div');
    crosshairEl.id = 'dv-crosshair';
    crosshairEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'width:20px',
      'height:20px',
      'pointer-events:none',
      'z-index:1001'
    ].join(';');
    crosshairEl.innerHTML = '<svg width="20" height="20"><line x1="10" y1="0" x2="10" y2="8" stroke="#00ff88" stroke-width="1.5"/><line x1="10" y1="12" x2="10" y2="20" stroke="#00ff88" stroke-width="1.5"/><line x1="0" y1="10" x2="8" y2="10" stroke="#00ff88" stroke-width="1.5"/><line x1="12" y1="10" x2="20" y2="10" stroke="#00ff88" stroke-width="1.5"/></svg>';
    document.body.appendChild(crosshairEl);

    promptEl = document.createElement('div');
    promptEl.id = 'dv-prompt';
    promptEl.style.cssText = [
      'position:fixed',
      'bottom:80px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#ffee00',
      'background:rgba(0,0,0,0.7)',
      'padding:6px 16px',
      'font-family:monospace',
      'font-size:14px',
      'border:1px solid #ffee00',
      'border-radius:4px',
      'display:none',
      'z-index:1001',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(promptEl);

    updateHUD();
  }

  function updateHUD() {
    if (!hudEl) return;

    var soldierCount = 0;
    for (var si = 0; si < soldiers.length; si++) {
      if (!soldiers[si].dead) soldierCount++;
    }

    var sdStr = 'INACTIVE';
    if (selfDestructActive && !terminalDisarmed) {
      var rem = Math.max(0, selfDestructTimer);
      var mm = Math.floor(rem / 60);
      var ss = Math.floor(rem % 60);
      sdStr = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    } else if (terminalDisarmed) {
      sdStr = 'DISARMED';
    }

    var gt = Math.floor(gameTimer);
    var gm = Math.floor(gt / 60);
    var gs = gt % 60;
    var timerStr = (gm < 10 ? '0' : '') + gm + ':' + (gs < 10 ? '0' : '') + gs;

    var tempStr = (level2Entered && level2Temp > 35) ? ('<span style="color:#ff4422">DANGER ' + Math.floor(level2Temp) + '°</span>') : 'SAFE';
    var hpColor = playerHP > 50 ? '#00ff88' : (playerHP > 25 ? '#ffaa00' : '#ff3300');
    var sdColor = selfDestructActive && !terminalDisarmed ? '#ff3300' : '#00ff88';

    hudEl.innerHTML =
      'DOOMSDAY VAULT &nbsp;|&nbsp; ' +
      'CORES: ' + extractedCores + '/4 EXTRACTED &nbsp;|&nbsp; ' +
      'CARRYING: ' + carriedCores + ' &nbsp;|&nbsp; ' +
      'SELF-DESTRUCT: <span style="color:' + sdColor + '">' + sdStr + '</span> &nbsp;|&nbsp; ' +
      'COMMANDER: ' + (commanderDead ? '<span style="color:#888">DEAD</span>' : '<span style="color:#ff8800">ALIVE</span>') + ' &nbsp;|&nbsp; ' +
      'TEMP: ' + tempStr + ' &nbsp;|&nbsp; ' +
      'SOLDIERS: ' + soldierCount + ' &nbsp;|&nbsp; ' +
      'TIMER: ' + timerStr + ' &nbsp;|&nbsp; ' +
      'HP: <span style="color:' + hpColor + '">' + Math.ceil(playerHP) + '</span>';

    if (gameWon) {
      hudEl.innerHTML = '<span style="color:#00ffaa;font-size:18px">MISSION COMPLETE — DATA CORES EXTRACTED AND SECURED</span>';
    }
    if (gameLost) {
      hudEl.innerHTML = '<span style="color:#ff2200;font-size:18px">MISSION FAILED — ' + loseReason + '</span>';
    }
  }

  // ─── Pointer Lock ────────────────────────────────────────────────────────────
  function setupPointerLock() {
    if (!canvas) return;
    canvas.addEventListener('click', function () {
      if (!pointerLocked && active) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', function () {
      pointerLocked = (document.pointerLockElement === canvas);
    });
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  function update(delta, keys, mouse) {
    if (!active || gameWon || gameLost) return;

    gameTimer += delta;

    handleMouseLook(mouse);
    handleMovement(delta, keys);
    applyGravity(delta);
    handleCollision();

    updateElevator(delta);
    updateSearchlights(delta);
    updateParticles(delta);
    updateTemperature(delta);
    updateSelfDestruct(delta);
    updateSoldiers(delta);
    updateCommander(delta);
    updateInteraction(delta, keys);
    checkWinLose();
    updateHUD();
  }

  function handleMouseLook(mouse) {
    if (!pointerLocked || !mouse) return;
    var sens = 0.002;
    playerYaw -= (mouse.dx || 0) * sens;
    playerPitch -= (mouse.dy || 0) * sens;
    playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;
  }

  function handleMovement(delta, keys) {
    if (!keys) return;
    var speed = MOVE_SPEED;
    var moveX = 0, moveZ = 0;
    if (keys['KeyW'] || keys['ArrowUp']) { moveZ -= 1; }
    if (keys['KeyS'] || keys['ArrowDown']) { moveZ += 1; }
    if (keys['KeyA'] || keys['ArrowLeft']) { moveX -= 1; }
    if (keys['KeyD'] || keys['ArrowRight']) { moveX += 1; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    var cos = Math.cos(playerYaw);
    var sin = Math.sin(playerYaw);
    var worldX = moveX * cos - moveZ * sin;
    var worldZ = moveX * sin + moveZ * cos;

    playerPos.x += worldX * speed * delta;
    playerPos.z += worldZ * speed * delta;

    // Shooting
    if (mouse && mouse.leftClick) {
      mouse.leftClick = false;
      shootRaycast();
    }
  }

  function applyGravity(delta) {
    if (!playerOnGround) {
      playerVel.y += GRAVITY * delta;
    }
    playerPos.y += playerVel.y * delta;
    playerOnGround = false;
  }

  function handleCollision() {
    // Floor collision
    for (var fi = 0; fi < floors.length; fi++) {
      var fm = floors[fi];
      var fb = new THREE.Box3().setFromObject(fm);
      var fTop = fb.max.y;
      var pBottom = playerPos.y - PLAYER_HEIGHT;
      if (
        playerPos.x > fb.min.x + 0.3 && playerPos.x < fb.max.x - 0.3 &&
        playerPos.z > fb.min.z + 0.3 && playerPos.z < fb.max.z - 0.3 &&
        pBottom <= fTop + 0.2 && pBottom >= fb.min.y - 0.3
      ) {
        playerPos.y = fTop + PLAYER_HEIGHT;
        playerVel.y = 0;
        playerOnGround = true;
      }
    }

    // Wall collision (simple push-out)
    for (var wi = 0; wi < walls.length; wi++) {
      var wm = walls[wi];
      var wb = new THREE.Box3().setFromObject(wm);
      var margin = 0.5;
      if (
        playerPos.y - PLAYER_HEIGHT < wb.max.y &&
        playerPos.y > wb.min.y &&
        playerPos.x > wb.min.x - margin && playerPos.x < wb.max.x + margin &&
        playerPos.z > wb.min.z - margin && playerPos.z < wb.max.z + margin
      ) {
        var cx2 = (wb.min.x + wb.max.x) / 2;
        var cz2 = (wb.min.z + wb.max.z) / 2;
        var dx2 = playerPos.x - cx2;
        var dz2 = playerPos.z - cz2;
        var hw = (wb.max.x - wb.min.x) / 2 + margin;
        var hd = (wb.max.z - wb.min.z) / 2 + margin;
        var ox = hw - Math.abs(dx2);
        var oz = hd - Math.abs(dz2);
        if (ox > 0 && oz > 0) {
          if (ox < oz) {
            playerPos.x += ox * (dx2 < 0 ? -1 : 1);
          } else {
            playerPos.z += oz * (dz2 < 0 ? -1 : 1);
          }
        }
      }
    }

    // World bounds
    playerPos.x = Math.max(-60, Math.min(60, playerPos.x));
    playerPos.z = Math.max(-60, Math.min(60, playerPos.z));
    playerPos.y = Math.max(L4_Y - 2, Math.min(L1_Y + 20, playerPos.y));

    camera.position.set(playerPos.x, playerPos.y, playerPos.z);
  }

  // ─── Elevator ───────────────────────────────────────────────────────────────
  function updateElevator(delta) {
    if (!elevatorMoving) return;
    var diff = elevatorTargetY - elevatorY;
    var speed = 5;
    if (Math.abs(diff) < speed * delta) {
      elevatorY = elevatorTargetY;
      elevatorMoving = false;
    } else {
      elevatorY += Math.sign(diff) * speed * delta;
    }
    if (elevatorPlatformMesh) {
      elevatorPlatformMesh.position.y = elevatorY;
    }
    // Move player if in elevator
    if (playerInElevator) {
      playerPos.y = elevatorY + PLAYER_HEIGHT + 0.3;
      playerPos.x = ELEVATOR_X;
      playerPos.z = 20;
      camera.position.set(playerPos.x, playerPos.y, playerPos.z);
      if (!elevatorMoving) playerInElevator = false;
    }
  }

  // ─── Searchlights ────────────────────────────────────────────────────────────
  function updateSearchlights(delta) {
    searchlightAngle += delta * 0.5;
    for (var si = 0; si < searchlightMeshes.length; si++) {
      var sl = searchlightMeshes[si];
      var angle = searchlightAngle + sl.phase;
      var tx = sl.baseX + Math.sin(angle) * 20;
      var tz = sl.baseZ + Math.cos(angle) * 20;
      if (sl.target) sl.target.position.set(tx, -2, tz);
    }
  }

  // ─── Particles ───────────────────────────────────────────────────────────────
  function updateParticles(delta) {
    if (!particleSystem) return;
    var pos = particleSystem.geometry.attributes.position;
    for (var pi = 0; pi < pos.count; pi++) {
      pos.setY(pi, pos.getY(pi) - delta * 2);
      if (pos.getY(pi) < -5) pos.setY(pi, 18);
    }
    pos.needsUpdate = true;
  }

  // ─── Temperature ─────────────────────────────────────────────────────────────
  function updateTemperature(delta) {
    var inL2 = playerPos.y < L2_Y + 2 && playerPos.y > L2_Y - 2;
    if (inL2) {
      level2Entered = true;
      level2Temp = Math.min(level2TempMax, level2Temp + level2TempRate * delta);
      if (level2Temp > 35 && !hasCryoSuit) {
        playerHP -= TEMP_DAMAGE_RATE * delta;
      }
    }
  }

  // ─── Self-Destruct ───────────────────────────────────────────────────────────
  function updateSelfDestruct(delta) {
    if (!selfDestructActive || terminalDisarmed) return;
    selfDestructTimer -= delta;
    if (selfDestructTimer <= 0) {
      gameLost = true;
      loseReason = 'SELF-DESTRUCT DETONATED — VAULT DESTROYED';
    }
  }

  // ─── AI ──────────────────────────────────────────────────────────────────────
  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function soldierCanSeePlayer(sol) {
    var d = dist3(sol.pos, playerPos);
    if (d > SOLDIER_SIGHT) return false;
    // Simple line-of-sight: just use distance (full raycasting too expensive per frame)
    return true;
  }

  function moveSoldierToward(sol, target, speed, delta) {
    var dx = target.x - sol.pos.x;
    var dz = target.z - sol.pos.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.5) return;
    sol.pos.x += (dx / d) * speed * delta;
    sol.pos.z += (dz / d) * speed * delta;
    if (sol.mesh) {
      sol.mesh.position.set(sol.pos.x, sol.pos.y - PLAYER_HEIGHT, sol.pos.z);
      sol.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  function updateSoldiers(delta) {
    for (var si = 0; si < soldiers.length; si++) {
      var sol = soldiers[si];
      if (sol.dead) continue;
      sol.shootCooldown = Math.max(0, sol.shootCooldown - delta);

      var sees = soldierCanSeePlayer(sol);
      if (sees && !commanderAlerted) {
        triggerAlert();
      }
      if (allSoldiersChase || sees) {
        sol.state = 'chase';
      }

      if (sol.state === 'patrol') {
        var wpt = sol.waypoints[sol.waypointIndex];
        moveSoldierToward(sol, wpt, 2.5, delta);
        if (dist3(sol.pos, wpt) < 1) {
          sol.waypointIndex = (sol.waypointIndex + 1) % sol.waypoints.length;
        }
      } else if (sol.state === 'chase') {
        var dToPlayer = dist3(sol.pos, playerPos);
        if (dToPlayer > SOLDIER_SHOOT_RANGE) {
          moveSoldierToward(sol, playerPos, 4, delta);
        } else {
          // Attack
          if (sol.shootCooldown <= 0) {
            playerHP -= SOLDIER_DAMAGE;
            sol.shootCooldown = SOLDIER_SHOOT_CD;
          }
          // Face player
          if (sol.mesh) {
            var dxp = playerPos.x - sol.pos.x;
            var dzp = playerPos.z - sol.pos.z;
            sol.mesh.rotation.y = Math.atan2(dxp, dzp);
          }
        }
      }
    }
  }

  function updateCommander(delta) {
    if (!commander || commander.dead) return;
    commander.shootCooldown = Math.max(0, commander.shootCooldown - delta);

    if (keycardMesh) {
      keycardMesh.position.set(commander.pos.x + 0.6, commander.pos.y - 0.5, commander.pos.z);
      keycardMesh.rotation.y += delta;
    }

    var seesPlayer = soldierCanSeePlayer(commander);
    if (seesPlayer && !commanderAlerted) {
      triggerAlert();
    }

    if (commanderAlerted || seesPlayer) {
      commander.state = 'chase';
    }

    if (commander.state === 'patrol') {
      var wpt = commander.waypoints[commander.waypointIndex];
      moveSoldierToward(commander, wpt, 2, delta);
      if (dist3(commander.pos, wpt) < 1) {
        commander.waypointIndex = (commander.waypointIndex + 1) % commander.waypoints.length;
      }
    } else {
      var dToP = dist3(commander.pos, playerPos);
      if (dToP > SOLDIER_SHOOT_RANGE + 2) {
        moveSoldierToward(commander, playerPos, 3.5, delta);
      } else {
        if (commander.shootCooldown <= 0) {
          playerHP -= SOLDIER_DAMAGE * 1.5;
          commander.shootCooldown = SOLDIER_SHOOT_CD * 0.8;
        }
        if (commander.mesh) {
          var dxc = playerPos.x - commander.pos.x;
          var dzc = playerPos.z - commander.pos.z;
          commander.mesh.rotation.y = Math.atan2(dxc, dzc);
        }
      }
    }
  }

  function triggerAlert() {
    if (commanderAlerted) return;
    commanderAlerted = true;
    allSoldiersChase = true;
    selfDestructActive = true;
    selfDestructTimer = SELF_DESTRUCT_DURATION;
    for (var si = 0; si < soldiers.length; si++) {
      soldiers[si].state = 'chase';
    }
    if (commander) commander.state = 'chase';
  }

  // ─── Shooting ────────────────────────────────────────────────────────────────
  function shootRaycast() {
    if (!camera) return;
    // Alert on first shot
    triggerAlert();

    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    // Check soldiers
    for (var si = 0; si < soldiers.length; si++) {
      var sol = soldiers[si];
      if (sol.dead || !sol.mesh) continue;
      var bb = new THREE.Box3().setFromObject(sol.mesh);
      var hit = raycaster.ray.intersectsBox(bb);
      if (hit) {
        damageSoldier(sol, SHOOT_DAMAGE);
        spawnHitFlash(sol.pos.x, sol.pos.y, sol.pos.z);
        return;
      }
    }

    // Check commander
    if (commander && !commander.dead && commander.mesh) {
      var bb2 = new THREE.Box3().setFromObject(commander.mesh);
      var hit2 = raycaster.ray.intersectsBox(bb2);
      if (hit2) {
        damageCommander(SHOOT_DAMAGE);
        spawnHitFlash(commander.pos.x, commander.pos.y, commander.pos.z);
        return;
      }
    }
  }

  function damageSoldier(sol, dmg) {
    sol.hp -= dmg;
    if (sol.hp <= 0) killSoldier(sol);
  }

  function killSoldier(sol) {
    sol.dead = true;
    if (sol.mesh) {
      sol.mesh.rotation.z = Math.PI / 2;
      sol.mesh.position.y -= 0.5;
    }
  }

  function damageCommander(dmg) {
    commander.hp -= dmg;
    if (commander.hp <= 0) {
      commander.dead = true;
      commanderDead = true;
      if (commander.mesh) {
        commander.mesh.rotation.z = Math.PI / 2;
        commander.mesh.position.y -= 0.5;
      }
      // Drop keycard
      if (keycardMesh) {
        keycardMesh.position.y = commander.pos.y - PLAYER_HEIGHT + 0.2;
        interactables.push({
          type: 'keycard',
          mesh: keycardMesh,
          pos: { x: commander.pos.x, y: commander.pos.y - PLAYER_HEIGHT + 0.2, z: commander.pos.z },
          holdTime: 0.3,
          label: 'PICK UP KEYCARD [E]',
          collected: false
        });
      }
    }
  }

  function spawnHitFlash(x, y, z) {
    var geo = new THREE.SphereGeometry(0.3, 6, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: new THREE.Color(0xff5500) });
    var flash = new THREE.Mesh(geo, mat);
    flash.position.set(x, y, z);
    flash.userData.ttl = 0.12;
    scene.add(flash);
    sceneObjects.push(flash);
    // auto remove via update
    flash.userData.isFlash = true;
  }

  // ─── Interaction ─────────────────────────────────────────────────────────────
  function updateInteraction(delta, keys) {
    // Remove expired hit flashes
    for (var oi = sceneObjects.length - 1; oi >= 0; oi--) {
      var obj = sceneObjects[oi];
      if (obj && obj.userData && obj.userData.isFlash) {
        obj.userData.ttl -= delta;
        if (obj.userData.ttl <= 0) {
          scene.remove(obj);
          sceneObjects.splice(oi, 1);
        }
      }
    }

    var nearest = null;
    var nearestDist = INTERACT_DIST + 1;

    for (var ii = 0; ii < interactables.length; ii++) {
      var it = interactables[ii];
      if (it.collected) continue;
      if (it.type === 'stairAccess') continue;
      var d = dist3(playerPos, it.pos);
      if (d < INTERACT_DIST && d < nearestDist) {
        nearestDist = d;
        nearest = it;
      }
    }

    interactTarget = nearest;

    if (nearest) {
      var label = nearest.label;
      // Extra context for pod
      if (nearest.type === 'pod') {
        label = 'EXTRACTION POD — ' + depositedCores + '/4 CORES DEPOSITED';
        if (depositedCores >= 4) label = 'LAUNCH POD [Hold E 3s]';
        else if (carriedCores > 0) label = 'DEPOSIT CORES [E] (' + carriedCores + ' carried)';
        else label = 'EXTRACTION POD (' + depositedCores + '/4 deposited)';
      }
      if (nearest.type === 'terminal') {
        if (!hasKeycard) label = 'DISARM TERMINAL (Need Master Keycard)';
        else if (terminalDisarmed) label = 'TERMINAL: DISARMED';
        else label = 'DISARM SELF-DESTRUCT [Hold E 2s]';
      }
      promptEl.textContent = label;
      promptEl.style.display = 'block';
    } else {
      promptEl.style.display = 'none';
      interactHoldTimer = 0;
    }

    var eDown = keys && (keys['KeyE'] || keys['e'] || keys['E']);
    if (eDown && nearest) {
      interactHoldTimer += delta;
      var required = nearest.holdTime || 2;
      if (nearest.type === 'pod' && depositedCores >= 4) required = 3;
      if (interactHoldTimer >= required) {
        performInteract(nearest);
        interactHoldTimer = 0;
      } else {
        // Show progress
        var pct = Math.floor((interactHoldTimer / required) * 100);
        promptEl.textContent = (nearest.label || '') + ' [' + pct + '%]';
      }
    } else {
      if (!eDown) interactHoldTimer = 0;
    }
  }

  function performInteract(it) {
    if (it.type === 'core') {
      if (it.collected) return;
      if (carriedCores >= 2) {
        promptEl.textContent = 'CANNOT CARRY MORE THAN 2 CORES';
        return;
      }
      it.collected = true;
      carriedCores++;
      if (it.mesh) { scene.remove(it.mesh); }
      if (it.linesObj) { scene.remove(it.linesObj); }
      if (it.pedMesh) { it.pedMesh.material.color.setHex(0x222222); }
      if (it.lightObj) { it.lightObj.intensity = 0; }
    } else if (it.type === 'cryo') {
      if (it.collected) return;
      it.collected = true;
      hasCryoSuit = true;
      if (it.mesh) { scene.remove(it.mesh); }
      if (it.linesObj) { scene.remove(it.linesObj); }
      if (it.lightObj) { it.lightObj.intensity = 0; }
    } else if (it.type === 'keycard') {
      if (it.collected) return;
      it.collected = true;
      hasKeycard = true;
      if (it.mesh) { scene.remove(it.mesh); }
    } else if (it.type === 'terminal') {
      if (!hasKeycard) return;
      if (terminalDisarmed) return;
      terminalDisarmed = true;
      selfDestructActive = false;
    } else if (it.type === 'pod') {
      if (carriedCores > 0) {
        depositedCores += carriedCores;
        extractedCores = depositedCores;
        carriedCores = 0;
      } else if (depositedCores >= 4) {
        // Launch
        gameWon = true;
        it.collected = true;
      }
    } else if (it.type === 'elevator') {
      elevatorTargetY = it.targetY;
      elevatorMoving = true;
      playerInElevator = true;
      playerPos.x = ELEVATOR_X;
      playerPos.z = 20;
    }
  }

  // ─── Win/Lose ────────────────────────────────────────────────────────────────
  function checkWinLose() {
    if (playerHP <= 0) {
      gameLost = true;
      loseReason = 'OPERATIVE KIA';
    }
  }

  // ─── Reset ───────────────────────────────────────────────────────────────────
  function reset() {
    if (!active) return;

    // Remove all scene objects
    for (var oi = 0; oi < sceneObjects.length; oi++) {
      if (sceneObjects[oi] && sceneObjects[oi].parent) {
        scene.remove(sceneObjects[oi]);
      }
    }
    sceneObjects = [];

    // Remove HUD
    if (hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl);
    if (crosshairEl && crosshairEl.parentNode) crosshairEl.parentNode.removeChild(crosshairEl);
    if (promptEl && promptEl.parentNode) promptEl.parentNode.removeChild(promptEl);
    hudEl = null; crosshairEl = null; promptEl = null;

    // Reset state
    active = false;
    playerPos = { x: 0, y: 1.7, z: -55 };
    playerVel = { x: 0, y: 0, z: 0 };
    playerHP = 100;
    playerYaw = 0;
    playerPitch = 0;
    playerOnGround = true;
    hasCryoSuit = false;
    carriedCores = 0;
    extractedCores = 0;
    depositedCores = 0;
    gameWon = false;
    gameLost = false;
    loseReason = '';
    selfDestructActive = false;
    selfDestructTimer = SELF_DESTRUCT_DURATION;
    commanderAlerted = false;
    commanderDead = false;
    hasKeycard = false;
    terminalDisarmed = false;
    level2Entered = false;
    level2Temp = 20;
    soldiers = [];
    commander = null;
    interactables = [];
    dataCores = [];
    tempRegulators = [];
    walls = [];
    floors = [];
    podCoresDeposited = 0;
    elevatorY = 0;
    elevatorTargetY = 0;
    elevatorMoving = false;
    elevatorPlatformMesh = null;
    elevatorCallButtons = [];
    playerInElevator = false;
    searchlightMeshes = [];
    searchlightAngle = 0;
    particleSystem = null;
    gameTimer = 0;
    interactTarget = null;
    interactHoldTimer = 0;
    allSoldiersChase = false;
    pointerLocked = false;
    keycardMesh = null;

    if (scene) {
      scene.fog = null;
      scene.background = null;
    }
  }

  // ─── Activation key tracking (D+V within 400ms) ─────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.keyCode === KEY_D) keyTimes[KEY_D] = Date.now();
    if (e.keyCode === KEY_V) {
      if (keyTimes[KEY_D] && (Date.now() - keyTimes[KEY_D]) < ACTIVATION_WINDOW) {
        // Signal activation — callers use init() directly but we flag readiness
        keyTimes = {};
      }
    }
  });

  return {
    init: init,
    update: update,
    reset: reset
  };
})();
