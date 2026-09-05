window.BloodDiamond = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ─── State ───────────────────────────────────────────────────────────────────
  var state = {
    active: false,
    // activation keys B+D simultaneous within 400ms
    bDown: false,
    dDown: false,
    bDownTime: 0,
    dDownTime: 0,
    // scene
    scene: null,
    camera: null,
    renderer: null,
    animFrameId: null,
    lastTime: 0,
    canvas: null,
    // player
    playerPos: { x: 0, y: 1.8, z: 60 },
    playerYaw: 0,
    playerPitch: 0,
    playerVelX: 0,
    playerVelZ: 0,
    moveKeys: {},
    pointerLocked: false,
    playerHP: 100,
    playerMaxHP: 100,
    // level: 0=surface, 1=mid-level, 2=deep-level
    currentLevel: 0,
    // diamonds
    diamonds: [],
    diamondsCollected: 0,
    totalDiamonds: 5,
    // workers
    workers: [],
    workersFreed: 0,
    totalWorkers: 10,
    // rebels
    rebels: [],
    totalRebels: 25,
    rebelsRemaining: 25,
    // bosses
    foreman: null,
    warlord: null,
    warlordEliminated: false,
    // timer
    missionTime: 720, // 12 minutes in seconds
    timerRunning: false,
    // interaction
    eDown: false,
    eHoldTime: 0,
    eHoldTarget: null,
    eHoldRequired: 0,
    // movement
    canJump: false,
    velocityY: 0,
    inTunnel: false,
    // elevator
    elevatorMesh: null,
    elevatorPos: 0,
    elevatorMoving: false,
    elevatorTarget: 0,
    elevatorKey: false,
    // pump / flooding
    pumpShot: false,
    waterLevel: -20,
    // gas pocket
    gasPocket: null,
    gasTriggerRadius: 4,
    // explosive charges
    charges: [],
    // followed workers (freed)
    followingWorkers: [],
    // extraction
    extractionUnlocked: false,
    extractionReached: false,
    // game result
    gameOver: false,
    gameWon: false,
    // HUD element
    hudEl: null,
    overlayEl: null,
    // shooting
    shootCooldown: 0,
    // raycaster
    raycaster: null,
    // meshes for scene
    meshes: [],
    // checkpoint alarm
    checkpointAlarm: false,
    // sprint
    sprinting: false,
    // ammo
    ammo: 90,
    maxAmmo: 90
  };

  // ─── Constants ───────────────────────────────────────────────────────────────
  var PLAYER_SPEED = 6;
  var SPRINT_SPEED = 10;
  var DIAMOND_SLOW = 0.9;
  var GRAVITY = -18;
  var INTERACT_RADIUS = 2.5;
  var ACTIVATION_WINDOW = 400;
  var REBEL_SHOOT_RANGE = 20;
  var REBEL_MOVE_SPEED = 2.5;
  var BULLET_RANGE = 60;
  var SHOOT_COOLDOWN = 0.25;
  var WORKER_FOLLOW_SPEED = 4;
  var EXTRACTION_RADIUS = 8;

  // ─── Build Scene ─────────────────────────────────────────────────────────────

  function buildScene() {
    var scene = state.scene;

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0x664433, 0.6);
    scene.add(ambient);

    var sun = new THREE.DirectionalLight(0xFFCC88, 0.8);
    sun.position.set(30, 50, 20);
    scene.add(sun);

    // ── SURFACE LEVEL (Y=0 plane) ──
    buildSurface(scene);

    // ── MINE SHAFT ──
    buildShaft(scene);

    // ── LEVEL 1 – MID ──
    buildLevel1(scene);

    // ── LEVEL 2 – DEEP ──
    buildLevel2(scene);

    // ── WARLORD HUT ──
    buildWarlordHut(scene);

    // ── AIRSTRIP ──
    buildAirstrip(scene);

    // Raycaster
    state.raycaster = new THREE.Raycaster();
  }

  function makeMesh(geom, color, x, y, z, rx, ry, rz) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    state.scene.add(mesh);
    state.meshes.push(mesh);
    return mesh;
  }

  function buildSurface(scene) {
    // Ground clearing – reddish-brown laterite soil
    var groundGeo = new THREE.BoxGeometry(150, 0.5, 150);
    makeMesh(groundGeo, 0x886644, 0, -0.25, 0);

    // Mine entrance hut 15×5×20
    var hutGeo = new THREE.BoxGeometry(15, 5, 20);
    var hutMesh = makeMesh(hutGeo, 0x776633, 0, 2.5, 30);
    hutMesh.userData.isWall = true;

    // Hut roof
    var roofGeo = new THREE.BoxGeometry(16, 0.4, 21);
    makeMesh(roofGeo, 0x554422, 0, 5.2, 30);

    // Rebel checkpoint – barrier
    var barrierGeo = new THREE.BoxGeometry(20, 1.5, 0.5);
    var barrier = makeMesh(barrierGeo, 0x665533, 0, 0.75, 45);
    barrier.userData.isWall = true;

    // Sandbags
    for (var sb = 0; sb < 5; sb++) {
      var sbGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
      var sbMesh = makeMesh(sbGeo, 0x887755, -4 + sb * 2, 0.4, 44);
      sbMesh.userData.isWall = true;
    }

    // Trees around clearing
    buildTrees(scene);

    // Spawn 4 surface guards at checkpoint
    spawnRebelAt(0, 1, 46, 'rpg', 90);
    spawnRebelAt(-3, 1, 47, 'ak', 70);
    spawnRebelAt(3, 1, 47, 'ak', 70);
    spawnRebelAt(0, 1, 48, 'ak', 70);
  }

  function buildTrees(scene) {
    var treePositions = [
      [-40, 0, -30], [40, 0, -30], [-50, 0, 10], [50, 0, 10],
      [-35, 0, 50], [35, 0, 50], [-20, 0, -40], [20, 0, -40]
    ];
    for (var t = 0; t < treePositions.length; t++) {
      var tp = treePositions[t];
      var trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 6);
      makeMesh(trunkGeo, 0x553311, tp[0], 2, tp[2]);
      var leafGeo = new THREE.ConeGeometry(2.5, 5, 7);
      makeMesh(leafGeo, 0x225511, tp[0], 7, tp[2]);
    }
  }

  function buildShaft(scene) {
    // Vertical mine shaft CylinderGeometry r=3 h=30
    var shaftGeo = new THREE.CylinderGeometry(3, 3, 30, 12);
    var shaftMat = new THREE.MeshLambertMaterial({ color: 0x554422, side: THREE.BackSide });
    var shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
    shaftMesh.position.set(0, -7.5, 20);
    scene.add(shaftMesh);
    state.meshes.push(shaftMesh);

    // Elevator platform
    var elevGeo = new THREE.BoxGeometry(3.5, 0.3, 3.5);
    var elevMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var elevMesh = new THREE.Mesh(elevGeo, elevMat);
    elevMesh.position.set(0, 0, 20);
    scene.add(elevMesh);
    state.elevatorMesh = elevMesh;
    state.elevatorPos = 0; // surface

    // Elevator shaft walls (box surround at top)
    var shaftRimGeo = new THREE.BoxGeometry(8, 1, 8);
    var shaftRim = makeMesh(shaftRimGeo, 0x665533, 0, 0.5, 20);
    shaftRim.userData.isWall = true;

    // Mine foreman near shaft entrance
    spawnForemanAt(-4, 1, 22);
  }

  function buildLevel1(scene) {
    var baseY = -15; // mid-level Y

    // Floor
    var floorGeo = new THREE.BoxGeometry(60, 0.5, 60);
    makeMesh(floorGeo, 0x554433, 0, baseY - 0.25, 0);

    // Main tunnel 3×3×40
    var tunnelGeo = new THREE.BoxGeometry(40, 3, 3);
    var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x554433, side: THREE.BackSide });
    var tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.position.set(0, baseY + 1.5, 0);
    scene.add(tunnelMesh);
    state.meshes.push(tunnelMesh);

    // Cross-tunnel
    var crossGeo = new THREE.BoxGeometry(3, 3, 30);
    var crossMat = new THREE.MeshLambertMaterial({ color: 0x554433, side: THREE.BackSide });
    var crossMesh = new THREE.Mesh(crossGeo, crossMat);
    crossMesh.position.set(10, baseY + 1.5, 0);
    scene.add(crossMesh);
    state.meshes.push(crossMesh);

    // Wooden support beams
    var supportPositions = [-15, -5, 5, 15];
    for (var sp = 0; sp < supportPositions.length; sp++) {
      var beamGeo = new THREE.BoxGeometry(0.3, 3.2, 0.3);
      makeMesh(beamGeo, 0x886633, supportPositions[sp] - 1, baseY + 1.6, 1);
      makeMesh(beamGeo, 0x886633, supportPositions[sp] + 1, baseY + 1.6, 1);
      var crossBeamGeo = new THREE.BoxGeometry(2.5, 0.3, 0.3);
      makeMesh(crossBeamGeo, 0x886633, supportPositions[sp], baseY + 3, 1);
    }

    // Dim mining light (level 1)
    var light1 = new THREE.PointLight(0xFFAA44, 0.8, 20);
    light1.position.set(0, baseY + 2.5, 0);
    scene.add(light1);
    var light2 = new THREE.PointLight(0xFFAA44, 0.8, 20);
    light2.position.set(15, baseY + 2.5, 0);
    scene.add(light2);

    // 4 rebels in level 1
    spawnRebelAt(-10, baseY + 1, -5, 'ak', 70);
    spawnRebelAt(5, baseY + 1, 5, 'ak', 70);
    spawnRebelAt(15, baseY + 1, -8, 'ak', 70);
    spawnRebelAt(-5, baseY + 1, 8, 'ak', 70);

    // 3 workers in level 1
    spawnWorkerAt(-12, baseY + 1, 0, 1);
    spawnWorkerAt(8, baseY + 1, -6, 1);
    spawnWorkerAt(18, baseY + 1, 4, 1);

    // 2 diamond caches in level 1
    spawnDiamond(-8, baseY + 1, -10, 1);
    spawnDiamond(20, baseY + 1, 6, 1);

    // Explosive charges in level 1 – open shortcuts when shot
    spawnCharge(-18, baseY + 0.5, 0, 1);
    spawnCharge(22, baseY + 0.5, -2, 1);
  }

  function buildLevel2(scene) {
    var baseY = -32; // deep level Y

    // Wider chamber 20×5×30
    var chamberGeo = new THREE.BoxGeometry(20, 5, 30);
    var chamberMat = new THREE.MeshLambertMaterial({ color: 0x443322, side: THREE.BackSide });
    var chamberMesh = new THREE.Mesh(chamberGeo, chamberMat);
    chamberMesh.position.set(0, baseY + 2.5, 0);
    scene.add(chamberMesh);
    state.meshes.push(chamberMesh);

    // Floor
    var floorGeo = new THREE.BoxGeometry(25, 0.5, 35);
    makeMesh(floorGeo, 0x332211, 0, baseY - 0.25, 0);

    // Water seeping in (wall seep panel)
    var waterGeo = new THREE.BoxGeometry(6, 3, 0.3);
    makeMesh(waterGeo, 0x224466, -5, baseY + 1.5, -14.8);

    // Water surface (rises when pump shot)
    var waterSurfGeo = new THREE.BoxGeometry(24, 0.2, 34);
    var waterMat = new THREE.MeshLambertMaterial({ color: 0x224466, transparent: true, opacity: 0.7 });
    var waterSurf = new THREE.Mesh(waterSurfGeo, waterMat);
    waterSurf.position.set(0, baseY - 1, 0);
    waterSurf.userData.isWater = true;
    scene.add(waterSurf);
    state.meshes.push(waterSurf);

    // Gas pocket
    var gasGeo = new THREE.SphereGeometry(1, 8, 6);
    var gasMat = new THREE.MeshLambertMaterial({ color: 0xFFFF88, transparent: true, opacity: 0.5 });
    var gasMesh = new THREE.Mesh(gasGeo, gasMat);
    gasMesh.position.set(8, baseY + 3, 10);
    scene.add(gasMesh);
    state.gasPocket = gasMesh;
    state.meshes.push(gasMesh);
    var gasLight = new THREE.PointLight(0xFFFF00, 1.2, 8);
    gasLight.position.set(8, baseY + 3, 10);
    scene.add(gasLight);

    // Pump (box on wall, shoot it to flood)
    var pumpGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var pumpMesh = makeMesh(pumpGeo, 0x885533, -8, baseY + 1, -14);
    pumpMesh.userData.isPump = true;
    pumpMesh.userData.hp = 30;

    // Mining cart tracks (decorative)
    var trackGeo = new THREE.BoxGeometry(0.15, 0.1, 30);
    makeMesh(trackGeo, 0x665544, -1, baseY, 0);
    makeMesh(trackGeo, 0x665544, 1, baseY, 0);

    // Deep light
    var dLight1 = new THREE.PointLight(0xFF6633, 0.7, 18);
    dLight1.position.set(0, baseY + 4, -5);
    scene.add(dLight1);
    var dLight2 = new THREE.PointLight(0xFF6633, 0.7, 18);
    dLight2.position.set(5, baseY + 4, 10);
    scene.add(dLight2);

    // 8 rebels in level 2
    spawnRebelAt(-6, baseY + 1, -8, 'ak', 70);
    spawnRebelAt(6, baseY + 1, -10, 'ak', 70);
    spawnRebelAt(-4, baseY + 1, 5, 'ak', 70);
    spawnRebelAt(4, baseY + 1, 8, 'ak', 70);
    spawnRebelAt(-7, baseY + 1, 12, 'ak', 70);
    spawnRebelAt(7, baseY + 1, -4, 'ak', 70);
    spawnRebelAt(0, baseY + 1, 14, 'ak', 70);
    spawnRebelAt(-3, baseY + 1, -12, 'ak', 70);

    // 7 workers in level 2
    for (var w = 0; w < 7; w++) {
      spawnWorkerAt(-8 + w * 2.5, baseY + 1, -6 + (w % 3) * 4, 2);
    }

    // 3 diamond caches in level 2
    spawnDiamond(-7, baseY + 1, -13, 2);
    spawnDiamond(6, baseY + 1, 13, 2);
    spawnDiamond(0, baseY + 1, -11, 2);

    // Explosive charges in level 2
    spawnCharge(9, baseY + 0.5, 0, 2);
    spawnCharge(-9, baseY + 0.5, 8, 2);
  }

  function buildWarlordHut(scene) {
    // 15×5×12 hut surface, to the side
    var hutGeo = new THREE.BoxGeometry(15, 5, 12);
    var hutMesh = makeMesh(hutGeo, 0x665533, -35, 2.5, 10);
    hutMesh.userData.isWall = true;

    var hutRoofGeo = new THREE.BoxGeometry(16, 0.4, 13);
    makeMesh(hutRoofGeo, 0x554422, -35, 5.2, 10);

    // Safe (box inside)
    var safeGeo = new THREE.BoxGeometry(1.5, 1.5, 1);
    var safeMesh = makeMesh(safeGeo, 0x444444, -35, 1, 5);
    safeMesh.userData.isSafe = true;

    // Guards
    spawnRebelAt(-33, 1, 17, 'ak', 70);
    spawnRebelAt(-37, 1, 17, 'ak', 70);
    spawnRebelAt(-30, 1, 10, 'ak', 70);

    // Warlord inside
    spawnWarlordAt(-35, 1, 8);
  }

  function buildAirstrip(scene) {
    // Airstrip runway
    var runwayGeo = new THREE.BoxGeometry(12, 0.2, 60);
    var runway = makeMesh(runwayGeo, 0x555555, 60, 0.1, 0);
    runway.userData.isAirstrip = true;

    // White centerline
    for (var cl = 0; cl < 6; cl++) {
      var lineGeo = new THREE.BoxGeometry(0.5, 0.05, 6);
      makeMesh(lineGeo, 0xFFFFFF, 60, 0.22, -20 + cl * 8);
    }

    // Extraction zone marker
    var markerGeo = new THREE.BoxGeometry(8, 0.15, 8);
    var markerMat = new THREE.MeshLambertMaterial({ color: 0x00FF44, transparent: true, opacity: 0.6 });
    var markerMesh = new THREE.Mesh(markerGeo, markerMat);
    markerMesh.position.set(60, 0.22, -15);
    markerMesh.userData.isExtractionMarker = true;
    scene.add(markerMesh);
    state.meshes.push(markerMesh);

    // Plane silhouette (rough)
    var bodyGeo = new THREE.BoxGeometry(4, 2, 12);
    var planeMesh = makeMesh(bodyGeo, 0x888899, 60, 2, -25);
    var wingGeo = new THREE.BoxGeometry(18, 0.4, 3);
    makeMesh(wingGeo, 0x777788, 60, 2, -24);
    var tailGeo = new THREE.BoxGeometry(5, 2.5, 0.5);
    makeMesh(tailGeo, 0x777788, 60, 3, -31);
  }

  // ─── Spawn helpers ───────────────────────────────────────────────────────────

  function spawnRebelAt(x, y, z, weaponType, hp) {
    var rebelGeo = new THREE.BoxGeometry(0.7, 1.7, 0.4);
    var rebelMat = new THREE.MeshLambertMaterial({ color: 0x665533 });
    var mesh = new THREE.Mesh(rebelGeo, rebelMat);
    mesh.position.set(x, y + 0.85, z);
    state.scene.add(mesh);

    // Head
    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x886655 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.1, 0);
    mesh.add(headMesh);

    // Gun barrel
    var gunGeo = new THREE.BoxGeometry(0.08, 0.08, 0.6);
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var gunMesh = new THREE.Mesh(gunGeo, gunMat);
    gunMesh.position.set(0.25, 0.4, 0.5);
    mesh.add(gunMesh);

    var rebel = {
      mesh: mesh,
      hp: hp || 70,
      maxHp: hp || 70,
      weapon: weaponType || 'ak',
      alive: true,
      shootTimer: Math.random() * 2,
      patrolDir: (Math.random() > 0.5) ? 1 : -1,
      patrolTimer: 2 + Math.random() * 3,
      alerted: false,
      patrolOriginX: x,
      patrolOriginZ: z
    };

    state.rebels.push(rebel);
    return rebel;
  }

  function spawnForemanAt(x, y, z) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x554422 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.9, z);
    state.scene.add(mesh);

    var headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x775544 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.15, 0);
    mesh.add(headMesh);

    state.foreman = {
      mesh: mesh,
      hp: 180,
      maxHp: 180,
      weapon: 'ak',
      alive: true,
      shootTimer: 1,
      alerted: false,
      hasKey: true,
      patrolOriginX: x,
      patrolOriginZ: z
    };
    state.rebels.push(state.foreman);
  }

  function spawnWarlordAt(x, y, z) {
    var geo = new THREE.BoxGeometry(1.0, 1.9, 0.6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x443311 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.95, z);
    state.scene.add(mesh);

    var headGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.25, 0);
    mesh.add(headMesh);

    // Shoulder insignia blocks
    var epGeo = new THREE.BoxGeometry(0.25, 0.1, 0.2);
    var epMat = new THREE.MeshLambertMaterial({ color: 0xCCCC00 });
    var ep1 = new THREE.Mesh(epGeo, epMat);
    ep1.position.set(0.55, 0.6, 0);
    mesh.add(ep1);
    var ep2 = new THREE.Mesh(epGeo, epMat);
    ep2.position.set(-0.55, 0.6, 0);
    mesh.add(ep2);

    var warlordObj = {
      mesh: mesh,
      hp: 400,
      maxHp: 400,
      weapon: 'mg',
      alive: true,
      shootTimer: 0.5,
      alerted: false,
      isWarlord: true,
      patrolOriginX: x,
      patrolOriginZ: z
    };
    state.warlord = warlordObj;
    state.rebels.push(warlordObj);
  }

  function spawnWorkerAt(x, y, z, level) {
    var geo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x886655 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.8, z);
    state.scene.add(mesh);

    // Head
    var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var headMat = new THREE.MeshLambertMaterial({ color: 0x997766 });
    var headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.0, 0);
    mesh.add(headMesh);

    // Bound hands (LineSegments)
    var bindPoints = new Float32Array([
      -0.15, -0.3, 0.25,
       0.15, -0.3, 0.25
    ]);
    var bindGeo = new THREE.BufferGeometry();
    bindGeo.setAttribute('position', new THREE.BufferAttribute(bindPoints, 3));
    var bindMat = new THREE.LineBasicMaterial({ color: 0x885522 });
    var bindLines = new THREE.LineSegments(bindGeo, bindMat);
    mesh.add(bindLines);

    var worker = {
      mesh: mesh,
      bindLines: bindLines,
      hp: 100,
      alive: true,
      freed: false,
      level: level,
      following: false,
      freeing: false,
      freeProgress: 0
    };
    state.workers.push(worker);
    return worker;
  }

  function spawnDiamond(x, y, z, level) {
    var geo = new THREE.SphereGeometry(0.35, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCCEEFF, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.4, z);
    state.scene.add(mesh);

    var dLight = new THREE.PointLight(0x88AAFF, 1.2, 5);
    dLight.position.set(x, y + 0.5, z);
    state.scene.add(dLight);

    var diamond = {
      mesh: mesh,
      light: dLight,
      level: level,
      collected: false,
      pickingUp: false,
      pickupProgress: 0
    };
    state.diamonds.push(diamond);
    return diamond;
  }

  function spawnCharge(x, y, z, level) {
    var geo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFF4400 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.3, z);
    state.scene.add(mesh);

    // Warning stripe
    var stripeGeo = new THREE.BoxGeometry(0.52, 0.1, 0.52);
    var stripeMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
    var stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.set(0, 0.1, 0);
    mesh.add(stripeMesh);

    var charge = {
      mesh: mesh,
      level: level,
      triggered: false,
      hp: 15
    };
    state.charges.push(charge);
    return charge;
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────────

  function buildHUD() {
    var hud = document.createElement('div');
    hud.id = 'bd-hud';
    hud.style.cssText = [
      'position:fixed', 'top:10px', 'left:50%', 'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.7)', 'color:#FFCC44', 'font:bold 13px monospace',
      'padding:8px 16px', 'border:1px solid #885522', 'z-index:9999',
      'pointer-events:none', 'text-align:center', 'border-radius:4px',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(hud);
    state.hudEl = hud;

    // Crosshair
    var ch = document.createElement('div');
    ch.id = 'bd-crosshair';
    ch.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:16px', 'height:16px', 'pointer-events:none', 'z-index:9999'
    ].join(';');
    ch.innerHTML = '<svg width="16" height="16"><line x1="8" y1="2" x2="8" y2="14" stroke="#FFF" stroke-width="1.5"/><line x1="2" y1="8" x2="14" y2="8" stroke="#FFF" stroke-width="1.5"/></svg>';
    document.body.appendChild(ch);
    state.crosshairEl = ch;

    // Overlay for game over / win
    var overlay = document.createElement('div');
    overlay.id = 'bd-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,0.85)', 'color:#FF4400', 'font:bold 32px monospace',
      'display:none', 'align-items:center', 'justify-content:center',
      'flex-direction:column', 'z-index:99999', 'text-align:center'
    ].join(';');
    document.body.appendChild(overlay);
    state.overlayEl = overlay;

    // HP bar
    var hpBar = document.createElement('div');
    hpBar.id = 'bd-hpbar';
    hpBar.style.cssText = [
      'position:fixed', 'bottom:30px', 'left:20px',
      'width:180px', 'height:12px', 'background:#333',
      'border:1px solid #885522', 'z-index:9999'
    ].join(';');
    var hpFill = document.createElement('div');
    hpFill.id = 'bd-hpfill';
    hpFill.style.cssText = 'height:100%;background:#CC2200;width:100%;transition:width 0.1s';
    hpBar.appendChild(hpFill);
    document.body.appendChild(hpBar);
    state.hpBarEl = hpBar;
    state.hpFillEl = hpFill;

    // Ammo
    var ammoEl = document.createElement('div');
    ammoEl.id = 'bd-ammo';
    ammoEl.style.cssText = [
      'position:fixed', 'bottom:50px', 'right:20px',
      'color:#FFCC44', 'font:bold 18px monospace', 'z-index:9999'
    ].join(';');
    document.body.appendChild(ammoEl);
    state.ammoEl = ammoEl;

    // Interaction prompt
    var promptEl = document.createElement('div');
    promptEl.id = 'bd-prompt';
    promptEl.style.cssText = [
      'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
      'color:#FFFF44', 'font:bold 14px monospace', 'z-index:9999',
      'background:rgba(0,0,0,0.6)', 'padding:4px 12px', 'border-radius:3px',
      'display:none'
    ].join(';');
    document.body.appendChild(promptEl);
    state.promptEl = promptEl;
  }

  function updateHUD() {
    if (!state.hudEl) return;

    var mins = Math.floor(state.missionTime / 60);
    var secs = Math.floor(state.missionTime % 60);
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    var warlordStatus = state.warlordEliminated ? 'ELIMINATED' : 'ALIVE';
    var rebelsLeft = 0;
    for (var r = 0; r < state.rebels.length; r++) {
      if (state.rebels[r].alive) rebelsLeft++;
    }
    state.rebelsRemaining = rebelsLeft;

    state.hudEl.textContent = 'BLOOD DIAMOND  [DIAMONDS: ' + state.diamondsCollected + '/5]' +
      '  [WORKERS: ' + state.workersFreed + '/10 FREED]' +
      '  [WARLORD: ' + warlordStatus + ']' +
      '  [TIMER: ' + timeStr + ']' +
      '  [REBELS: ' + rebelsLeft + ']';

    if (state.hpFillEl) {
      state.hpFillEl.style.width = Math.max(0, (state.playerHP / state.playerMaxHP) * 100) + '%';
    }
    if (state.ammoEl) {
      state.ammoEl.textContent = 'AMMO ' + state.ammo + '/' + state.maxAmmo;
    }
  }

  function showOverlay(title, sub, color) {
    if (!state.overlayEl) return;
    state.overlayEl.style.display = 'flex';
    state.overlayEl.style.color = color || '#FF4400';
    state.overlayEl.innerHTML = '<div style="font-size:40px;margin-bottom:16px">' + title + '</div>' +
      '<div style="font-size:18px;color:#FFD700;margin-bottom:24px">' + sub + '</div>' +
      '<div style="font-size:14px;color:#AAAAAA">Press R to restart  |  Press Escape to exit</div>';
  }

  // ─── Input ────────────────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    state.moveKeys[k] = true;

    // Activation: B+D within 400ms
    if (!state.active) {
      if (k === 'b') {
        state.bDown = true;
        state.bDownTime = Date.now();
      }
      if (k === 'd') {
        state.dDown = true;
        state.dDownTime = Date.now();
      }
      if (state.bDown && state.dDown) {
        var diff = Math.abs(state.bDownTime - state.dDownTime);
        if (diff < ACTIVATION_WINDOW) {
          activate();
        }
      }
      return;
    }

    if (state.gameOver) {
      if (k === 'r') { reset(); init(); }
      return;
    }

    if (k === 'escape') {
      deactivate();
      return;
    }
    if (k === 'r') {
      state.ammo = state.maxAmmo;
      return;
    }
    if (k === 'e') {
      if (!state.eDown) {
        state.eDown = true;
        state.eHoldTime = 0;
        state.eHoldTarget = findInteractTarget();
      }
    }
    if (k === ' ') {
      if (state.canJump && !state.inTunnel) {
        state.velocityY = 6;
        state.canJump = false;
      }
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    state.moveKeys[k] = false;
    if (k === 'b') state.bDown = false;
    if (k === 'd') state.dDown = false;
    if (k === 'e') {
      state.eDown = false;
      state.eHoldTarget = null;
      state.eHoldTime = 0;
      if (state.promptEl) state.promptEl.style.display = 'none';
    }
  }

  function onMouseMove(e) {
    if (!state.active || !state.pointerLocked) return;
    var sens = 0.002;
    state.playerYaw -= e.movementX * sens;
    state.playerPitch -= e.movementY * sens;
    state.playerPitch = Math.max(-1.2, Math.min(1.2, state.playerPitch));
  }

  function onMouseDown(e) {
    if (!state.active) return;
    if (e.button === 0) {
      if (!state.pointerLocked) {
        state.canvas.requestPointerLock();
        return;
      }
      shoot();
    }
  }

  function onPointerLockChange() {
    state.pointerLocked = (document.pointerLockElement === state.canvas);
  }

  // ─── Shooting ─────────────────────────────────────────────────────────────────

  function shoot() {
    if (state.gameOver) return;
    if (state.shootCooldown > 0) return;
    if (state.ammo <= 0) return;

    state.ammo--;
    state.shootCooldown = SHOOT_COOLDOWN;

    // Direction from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(state.playerPitch, state.playerYaw, 0, 'YXZ'));

    var origin = new THREE.Vector3(
      state.playerPos.x, state.playerPos.y + 0.5, state.playerPos.z
    );
    state.raycaster.set(origin, dir.normalize());

    // Check rebels
    for (var r = 0; r < state.rebels.length; r++) {
      var rebel = state.rebels[r];
      if (!rebel.alive) continue;
      var d = origin.distanceTo(rebel.mesh.position);
      if (d > BULLET_RANGE) continue;
      var toRebel = new THREE.Vector3().subVectors(rebel.mesh.position, origin).normalize();
      var dot = dir.dot(toRebel);
      if (dot > 0.97) {
        var dmg = (rebel.isWarlord) ? 25 : 35;
        rebel.hp -= dmg;
        rebel.alerted = true;
        // Alert nearby rebels
        alertNearby(rebel.mesh.position, 15);
        if (rebel.hp <= 0) {
          killRebel(rebel);
        }
        break;
      }
    }

    // Check explosive charges
    for (var c = 0; c < state.charges.length; c++) {
      var charge = state.charges[c];
      if (charge.triggered) continue;
      var dc = origin.distanceTo(charge.mesh.position);
      if (dc > BULLET_RANGE) continue;
      var toCharge = new THREE.Vector3().subVectors(charge.mesh.position, origin).normalize();
      var dotC = dir.dot(toCharge);
      if (dotC > 0.96) {
        triggerCharge(charge);
        break;
      }
    }

    // Check pump
    for (var m = 0; m < state.meshes.length; m++) {
      var mesh = state.meshes[m];
      if (!mesh.userData.isPump) continue;
      if (state.pumpShot) continue;
      var dp = origin.distanceTo(mesh.position);
      if (dp > BULLET_RANGE) continue;
      var toPump = new THREE.Vector3().subVectors(mesh.position, origin).normalize();
      var dotP = dir.dot(toPump);
      if (dotP > 0.96 && dp < 20) {
        state.pumpShot = true;
        mesh.material.color.setHex(0x331100);
        break;
      }
    }

    // Gas pocket explosion if shot near it
    if (state.gasPocket && !state.gasPocketExploded) {
      var gp = state.gasPocket.position;
      var dgp = origin.distanceTo(gp);
      if (dgp < 20) {
        var toGas = new THREE.Vector3().subVectors(gp, origin).normalize();
        var dotG = dir.dot(toGas);
        if (dotG > 0.95 && dgp < 15) {
          triggerGasExplosion(gp);
        }
      }
    }
  }

  function alertNearby(pos, radius) {
    for (var r = 0; r < state.rebels.length; r++) {
      var reb = state.rebels[r];
      if (!reb.alive) continue;
      var d = pos.distanceTo(reb.mesh.position);
      if (d < radius) reb.alerted = true;
    }
  }

  function killRebel(rebel) {
    rebel.alive = false;
    rebel.mesh.visible = false;
    // Drop key if foreman
    if (rebel === state.foreman && rebel.hasKey) {
      state.elevatorKey = true;
    }
    // Check warlord
    if (rebel.isWarlord) {
      state.warlordEliminated = true;
    }
  }

  function triggerCharge(charge) {
    if (charge.triggered) return;
    charge.triggered = true;

    var pos = charge.mesh.position.clone();
    charge.mesh.visible = false;

    // Flash
    var flashLight = new THREE.PointLight(0xFF8800, 8, 20);
    flashLight.position.copy(pos);
    state.scene.add(flashLight);

    // Damage nearby rebels
    for (var r = 0; r < state.rebels.length; r++) {
      var reb = state.rebels[r];
      if (!reb.alive) continue;
      var d = pos.distanceTo(reb.mesh.position);
      if (d < 6) {
        reb.hp -= 80;
        if (reb.hp <= 0) killRebel(reb);
      }
    }

    // Damage nearby workers
    for (var w = 0; w < state.workers.length; w++) {
      var wk = state.workers[w];
      if (!wk.alive) continue;
      var dw = pos.distanceTo(wk.mesh.position);
      if (dw < 5) {
        wk.hp -= 60;
        if (wk.hp <= 0) killWorker(wk);
      }
    }

    // Damage player
    var dp = pos.distanceTo(
      new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z)
    );
    if (dp < 6) {
      state.playerHP -= 40;
    }

    // Remove flash after 200ms
    setTimeout(function () { state.scene.remove(flashLight); }, 200);
  }

  function triggerGasExplosion(pos) {
    state.gasPocketExploded = true;
    if (state.gasPocket) state.gasPocket.visible = false;

    var flashLight = new THREE.PointLight(0xFFFF00, 12, 30);
    flashLight.position.copy(pos);
    state.scene.add(flashLight);

    // Massive area damage
    for (var r = 0; r < state.rebels.length; r++) {
      var reb = state.rebels[r];
      if (!reb.alive) continue;
      var d = pos.distanceTo(reb.mesh.position);
      if (d < 12) {
        reb.hp -= 150;
        if (reb.hp <= 0) killRebel(reb);
      }
    }

    var dp = pos.distanceTo(
      new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z)
    );
    if (dp < 10) state.playerHP -= 60;

    setTimeout(function () { state.scene.remove(flashLight); }, 400);
  }

  function killWorker(worker) {
    if (!worker.alive) return;
    worker.alive = false;
    worker.mesh.visible = false;
  }

  // ─── Interaction ──────────────────────────────────────────────────────────────

  function findInteractTarget() {
    var px = state.playerPos.x;
    var py = state.playerPos.y;
    var pz = state.playerPos.z;

    // Check diamonds
    for (var d = 0; d < state.diamonds.length; d++) {
      var dm = state.diamonds[d];
      if (dm.collected) continue;
      var dist = dm.mesh.position.distanceTo(new THREE.Vector3(px, py, pz));
      if (dist < INTERACT_RADIUS) {
        return { type: 'diamond', target: dm, required: 2.0 };
      }
    }

    // Check workers
    for (var w = 0; w < state.workers.length; w++) {
      var wk = state.workers[w];
      if (!wk.alive || wk.freed) continue;
      var distw = wk.mesh.position.distanceTo(new THREE.Vector3(px, py, pz));
      if (distw < INTERACT_RADIUS) {
        return { type: 'worker', target: wk, required: 1.5 };
      }
    }

    // Check elevator
    if (state.elevatorMesh) {
      var distE = state.elevatorMesh.position.distanceTo(new THREE.Vector3(px, py, pz));
      if (distE < 3) {
        return { type: 'elevator', target: null, required: 0.3 };
      }
    }

    return null;
  }

  function processInteraction(dt) {
    if (!state.eDown) return;

    var target = state.eHoldTarget;
    if (!target) {
      state.eHoldTarget = findInteractTarget();
      target = state.eHoldTarget;
    }
    if (!target) {
      if (state.promptEl) state.promptEl.style.display = 'none';
      return;
    }

    // Re-validate distance
    var px = state.playerPos.x, py = state.playerPos.y, pz = state.playerPos.z;
    var interactPos;
    if (target.type === 'diamond') {
      interactPos = target.target.mesh.position;
    } else if (target.type === 'worker') {
      interactPos = target.target.mesh.position;
    } else if (target.type === 'elevator') {
      interactPos = state.elevatorMesh.position;
    }

    if (interactPos) {
      var d = interactPos.distanceTo(new THREE.Vector3(px, py, pz));
      if (d > INTERACT_RADIUS + 0.5) {
        state.eHoldTarget = null;
        if (state.promptEl) state.promptEl.style.display = 'none';
        return;
      }
    }

    state.eHoldTime += dt;

    var pct = Math.min(1, state.eHoldTime / target.required);

    if (state.promptEl) {
      state.promptEl.style.display = 'block';
      if (target.type === 'diamond') {
        state.promptEl.textContent = '[E] PICK UP DIAMOND  ' + Math.floor(pct * 100) + '%';
      } else if (target.type === 'worker') {
        state.promptEl.textContent = '[E] CUT BONDS  ' + Math.floor(pct * 100) + '%';
      } else if (target.type === 'elevator') {
        state.promptEl.textContent = '[E] USE ELEVATOR';
      }
    }

    if (state.eHoldTime >= target.required) {
      if (target.type === 'diamond') {
        collectDiamond(target.target);
      } else if (target.type === 'worker') {
        freeWorker(target.target);
      } else if (target.type === 'elevator') {
        useElevator();
      }
      state.eDown = false;
      state.eHoldTime = 0;
      state.eHoldTarget = null;
      if (state.promptEl) state.promptEl.style.display = 'none';
    }
  }

  function collectDiamond(diamond) {
    diamond.collected = true;
    diamond.mesh.visible = false;
    if (diamond.light) diamond.light.intensity = 0;
    state.diamondsCollected++;
    if (state.diamondsCollected >= 5) {
      state.extractionUnlocked = true;
    }
  }

  function freeWorker(worker) {
    worker.freed = true;
    worker.following = true;
    if (worker.bindLines) worker.bindLines.visible = false;
    worker.mesh.material.color.setHex(0xAABB99);
    state.workersFreed++;
    state.followingWorkers.push(worker);
  }

  function useElevator() {
    if (!state.elevatorKey && state.currentLevel === 0) {
      if (state.promptEl) {
        state.promptEl.style.display = 'block';
        state.promptEl.textContent = 'NEED ELEVATOR KEY FROM FOREMAN';
      }
      return;
    }
    // Toggle between levels
    if (state.currentLevel === 0) {
      // Go to level 1
      state.elevatorTarget = -15;
      state.currentLevel = 1;
    } else if (state.currentLevel === 1) {
      // Go down to level 2 or up to surface
      if (state.playerPos.y < -10) {
        state.elevatorTarget = -32;
        state.currentLevel = 2;
      } else {
        state.elevatorTarget = 0;
        state.currentLevel = 0;
      }
    } else if (state.currentLevel === 2) {
      state.elevatorTarget = -15;
      state.currentLevel = 1;
    }
    state.elevatorMoving = true;
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  function updateElevator(dt) {
    if (!state.elevatorMoving) return;
    var elev = state.elevatorMesh;
    var target = state.elevatorTarget;
    var spd = 8 * dt;

    if (Math.abs(elev.position.y - target) < spd + 0.1) {
      elev.position.y = target;
      state.elevatorMoving = false;
    } else {
      elev.position.y += (target > elev.position.y ? 1 : -1) * spd;
    }

    // Move player if on elevator
    var px = state.playerPos.x, pz = state.playerPos.z;
    var ex = elev.position.x, ez = elev.position.z;
    var onElevator = (Math.abs(px - ex) < 2 && Math.abs(pz - ez) < 2);
    if (onElevator) {
      state.playerPos.y = elev.position.y + 1.8;
    }
  }

  function updatePlayer(dt) {
    if (state.gameOver) return;

    var speed = PLAYER_SPEED;
    state.sprinting = state.moveKeys['shift'] && !state.diamondsCollected;
    if (state.sprinting) speed = SPRINT_SPEED;
    if (state.diamondsCollected > 0) speed *= DIAMOND_SLOW;

    // Movement direction
    var yaw = state.playerYaw;
    var fwdX = -Math.sin(yaw);
    var fwdZ = -Math.cos(yaw);
    var rightX = Math.cos(yaw);
    var rightZ = -Math.sin(yaw);

    var moveX = 0, moveZ = 0;
    if (state.moveKeys['w'] || state.moveKeys['arrowup']) { moveX += fwdX; moveZ += fwdZ; }
    if (state.moveKeys['s'] || state.moveKeys['arrowdown']) { moveX -= fwdX; moveZ -= fwdZ; }
    if (state.moveKeys['a'] || state.moveKeys['arrowleft']) { moveX -= rightX; moveZ -= rightZ; }
    if (state.moveKeys['d'] || state.moveKeys['arrowright']) { moveX += rightX; moveZ += rightZ; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    state.playerPos.x += moveX * speed * dt;
    state.playerPos.z += moveZ * speed * dt;

    // Gravity
    state.velocityY += GRAVITY * dt;
    state.playerPos.y += state.velocityY * dt;

    // Ground check – find floor level based on current zone
    var floorY = getFloorY(state.playerPos.x, state.playerPos.z);
    var waterFloor = getWaterY();

    var effectiveFloor = Math.max(floorY, waterFloor);
    if (state.pumpShot) {
      // Wade through water – slow movement
      if (state.playerPos.y < waterFloor + 0.5 && waterFloor > floorY) {
        speed *= 0.5;
        if (state.playerPos.y < waterFloor) {
          state.playerPos.y = waterFloor;
          state.velocityY = 0;
          state.canJump = true;
        }
      }
    }

    if (state.playerPos.y <= floorY) {
      state.playerPos.y = floorY;
      state.velocityY = 0;
      state.canJump = true;
    }

    // Ceiling check in tunnels (no jump)
    state.inTunnel = (state.playerPos.y < -10 && state.playerPos.y > -35);

    // Clamp to world bounds
    state.playerPos.x = Math.max(-74, Math.min(74, state.playerPos.x));
    state.playerPos.z = Math.max(-74, Math.min(74, state.playerPos.z));

    // Update camera
    state.camera.position.set(
      state.playerPos.x,
      state.playerPos.y + 0.4,
      state.playerPos.z
    );
    state.camera.rotation.order = 'YXZ';
    state.camera.rotation.y = state.playerYaw;
    state.camera.rotation.x = state.playerPitch;

    // Shoot cooldown
    if (state.shootCooldown > 0) state.shootCooldown -= dt;
  }

  function getFloorY(x, z) {
    // Deep level
    if (x > -12 && x < 12 && z > -17 && z < 17 && state.currentLevel >= 2) {
      return -32;
    }
    // Mid level tunnels
    if (((x > -22 && x < 22 && z > -3 && z < 3) ||
         (x > 7 && x < 13 && z > -17 && z < 17)) && state.currentLevel >= 1) {
      return -15;
    }
    // Surface
    return 0;
  }

  function getWaterY() {
    if (!state.pumpShot) return -999;
    // Water rises in level 2
    return state.waterLevel;
  }

  function updateWater(dt) {
    if (!state.pumpShot) return;
    if (state.waterLevel < -27) {
      state.waterLevel += (1.0 / 60.0) * dt; // 1 unit per minute
    }
    // Update water mesh
    for (var m = 0; m < state.meshes.length; m++) {
      if (state.meshes[m].userData.isWater) {
        state.meshes[m].position.y = state.waterLevel;
        break;
      }
    }
  }

  function updateRebels(dt) {
    var playerVec = new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z);

    for (var r = 0; r < state.rebels.length; r++) {
      var rebel = state.rebels[r];
      if (!rebel.alive) continue;

      var rebelPos = rebel.mesh.position;
      var distToPlayer = rebelPos.distanceTo(playerVec);

      // Detection
      if (distToPlayer < 14) rebel.alerted = true;

      // Face player when alerted
      if (rebel.alerted) {
        var dx = playerVec.x - rebelPos.x;
        var dz = playerVec.z - rebelPos.z;
        rebel.mesh.rotation.y = Math.atan2(dx, dz);

        // Move toward player if far
        if (distToPlayer > 6 && distToPlayer < REBEL_SHOOT_RANGE) {
          var spd = REBEL_MOVE_SPEED * dt;
          var len = Math.sqrt(dx * dx + dz * dz);
          if (len > 0) {
            rebelPos.x += (dx / len) * spd;
            rebelPos.z += (dz / len) * spd;
          }
        }

        // Shoot at player
        rebel.shootTimer -= dt;
        if (rebel.shootTimer <= 0 && distToPlayer < REBEL_SHOOT_RANGE) {
          var firerate = (rebel.weapon === 'mg') ? 0.15 : (rebel.weapon === 'rpg') ? 3.0 : 0.8;
          rebel.shootTimer = firerate + Math.random() * 0.5;
          var dmg = (rebel.weapon === 'mg') ? 8 : (rebel.weapon === 'rpg') ? 35 : 12;
          // Accuracy drops with distance
          var hitChance = Math.max(0.1, 0.75 - distToPlayer / 40);
          if (Math.random() < hitChance) {
            state.playerHP -= dmg;
          }
          // Workers in combat zone take damage
          damageWorkersNearCombat(rebelPos, 8);
        }
      } else {
        // Patrol
        rebel.patrolTimer -= dt;
        if (rebel.patrolTimer <= 0) {
          rebel.patrolDir *= -1;
          rebel.patrolTimer = 2 + Math.random() * 3;
        }
        rebelPos.x += rebel.patrolDir * 1.5 * dt;
        // Clamp patrol around origin
        if (Math.abs(rebelPos.x - rebel.patrolOriginX) > 5) {
          rebelPos.x = rebel.patrolOriginX + rebel.patrolDir * 5;
          rebel.patrolDir *= -1;
        }
      }
    }
  }

  function damageWorkersNearCombat(combatPos, radius) {
    for (var w = 0; w < state.workers.length; w++) {
      var wk = state.workers[w];
      if (!wk.alive || !wk.freed) continue;
      var d = combatPos.distanceTo(wk.mesh.position);
      if (d < radius) {
        wk.hp -= 5 * (1 / 60); // per second scaled
      }
      if (wk.hp <= 0) killWorker(wk);
    }
  }

  function updateWorkers(dt) {
    var playerVec = new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z);

    for (var w = 0; w < state.workers.length; w++) {
      var wk = state.workers[w];
      if (!wk.alive || !wk.freed || !wk.following) continue;

      var wpos = wk.mesh.position;
      var offset = new THREE.Vector3(
        (w % 3 - 1) * 1.2,
        0,
        1.5 + Math.floor(w / 3) * 1.0
      );
      var targetPos = playerVec.clone().add(offset);
      var dx = targetPos.x - wpos.x;
      var dz = targetPos.z - wpos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 1.5) {
        var spd = WORKER_FOLLOW_SPEED * dt;
        wpos.x += (dx / dist) * spd;
        wpos.z += (dz / dist) * spd;
        wk.mesh.rotation.y = Math.atan2(dx, dz);
      }

      // Keep on floor
      var floor = getFloorY(wpos.x, wpos.z);
      wpos.y = floor + 0.8;
    }
  }

  function checkExtraction() {
    if (!state.extractionUnlocked) return;
    if (state.warlordEliminated || true) { // can extract without warlord if needed
      var extractPos = new THREE.Vector3(60, 0, -15);
      var playerVec = new THREE.Vector3(state.playerPos.x, state.playerPos.y, state.playerPos.z);
      var dist = playerVec.distanceTo(extractPos);
      if (dist < EXTRACTION_RADIUS && state.currentLevel === 0) {
        // Count freed workers that followed
        var followCount = 0;
        for (var w = 0; w < state.workers.length; w++) {
          if (state.workers[w].freed && state.workers[w].alive) followCount++;
        }
        if (state.diamondsCollected >= 5 && followCount >= 8) {
          triggerWin();
        } else if (state.diamondsCollected >= 5 && followCount < 8) {
          if (state.promptEl) {
            state.promptEl.style.display = 'block';
            state.promptEl.textContent = 'NEED 8+ WORKERS TO EXTRACT! (' + followCount + '/8)';
          }
        }
      }
    }
  }

  function checkLoseConditions() {
    if (state.playerHP <= 0) {
      state.playerHP = 0;
      triggerLose('KIA — MISSION FAILED', 'You were killed in action.');
      return;
    }
    if (state.missionTime <= 0) {
      triggerLose('TIME EXPIRED — MISSION FAILED', 'Reinforcements cut off your escape route.');
      return;
    }
    // Check if all workers are dead
    var aliveWorkers = 0;
    for (var w = 0; w < state.workers.length; w++) {
      if (state.workers[w].alive) aliveWorkers++;
    }
    if (aliveWorkers === 0) {
      triggerLose('ALL WORKERS KILLED', 'No survivors to rescue. Mission failed.');
      return;
    }
  }

  function triggerWin() {
    if (state.gameOver) return;
    state.gameOver = true;
    state.gameWon = true;
    state.timerRunning = false;
    var freed = state.workersFreed;
    showOverlay(
      'MISSION COMPLETE',
      'Diamonds extracted: ' + state.diamondsCollected + '/5\n' +
      'Workers freed: ' + freed + '/10\n' +
      'Warlord: ' + (state.warlordEliminated ? 'ELIMINATED' : 'ESCAPED') + '\n' +
      'Time remaining: ' + Math.floor(state.missionTime / 60) + 'm ' + Math.floor(state.missionTime % 60) + 's',
      '#00FF44'
    );
  }

  function triggerLose(title, sub) {
    if (state.gameOver) return;
    state.gameOver = true;
    state.gameWon = false;
    state.timerRunning = false;
    showOverlay(title, sub, '#FF2200');
  }

  function updateDiamondGlow(dt) {
    for (var d = 0; d < state.diamonds.length; d++) {
      var dm = state.diamonds[d];
      if (dm.collected) continue;
      dm.mesh.rotation.y += dt * 1.5;
      dm.mesh.position.y += Math.sin(Date.now() * 0.003 + d) * 0.002;
      if (dm.light) dm.light.intensity = 1.0 + 0.3 * Math.sin(Date.now() * 0.004 + d);
    }
  }

  function updateProximityPrompts() {
    if (state.eDown) return;
    var px = state.playerPos.x, py = state.playerPos.y, pz = state.playerPos.z;
    var playerVec = new THREE.Vector3(px, py, pz);
    var nearest = null;
    var nearestDist = INTERACT_RADIUS + 0.5;

    for (var d = 0; d < state.diamonds.length; d++) {
      var dm = state.diamonds[d];
      if (dm.collected) continue;
      var dist = dm.mesh.position.distanceTo(playerVec);
      if (dist < nearestDist) { nearestDist = dist; nearest = 'diamond'; }
    }

    for (var w = 0; w < state.workers.length; w++) {
      var wk = state.workers[w];
      if (!wk.alive || wk.freed) continue;
      var distw = wk.mesh.position.distanceTo(playerVec);
      if (distw < nearestDist) { nearestDist = distw; nearest = 'worker'; }
    }

    if (state.elevatorMesh) {
      var distE = state.elevatorMesh.position.distanceTo(playerVec);
      if (distE < 3) { nearest = 'elevator'; }
    }

    if (nearest && state.promptEl) {
      state.promptEl.style.display = 'block';
      if (nearest === 'diamond') state.promptEl.textContent = '[Hold E] Pick Up Diamond';
      else if (nearest === 'worker') state.promptEl.textContent = '[Hold E] Free Worker';
      else if (nearest === 'elevator') {
        state.promptEl.textContent = state.elevatorKey ? '[Hold E] Use Elevator' : '[E] Elevator (Need Foreman Key)';
      }
    } else if (state.promptEl) {
      state.promptEl.style.display = 'none';
    }
  }

  // ─── Render loop ──────────────────────────────────────────────────────────────

  function loop(now) {
    if (!state.active) return;
    state.animFrameId = requestAnimationFrame(loop);

    var dt = Math.min((now - state.lastTime) / 1000, 0.05);
    state.lastTime = now;

    if (!state.gameOver) {
      if (state.timerRunning) {
        state.missionTime -= dt;
        if (state.missionTime < 0) state.missionTime = 0;
      }
      updatePlayer(dt);
      updateElevator(dt);
      updateRebels(dt);
      updateWorkers(dt);
      updateDiamondGlow(dt);
      updateWater(dt);
      processInteraction(dt);
      checkExtraction();
      checkLoseConditions();
      updateProximityPrompts();
    }

    updateHUD();
    state.renderer.render(state.scene, state.camera);
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────────

  function activate() {
    if (state.active) return;
    state.active = true;

    // Create renderer
    var canvas = document.createElement('canvas');
    canvas.id = 'bd-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9990';
    document.body.appendChild(canvas);
    state.canvas = canvas;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x221100);
    state.renderer = renderer;

    // Camera
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    state.camera = camera;

    // Scene
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x221100, 30, 120);
    state.scene = scene;

    buildScene();
    buildHUD();

    // Reset player position
    state.playerPos = { x: 0, y: 1.8, z: 60 };
    state.playerYaw = Math.PI; // face toward mine
    state.playerHP = 100;
    state.missionTime = 720;
    state.timerRunning = true;
    state.gameOver = false;
    state.gameWon = false;
    state.shootCooldown = 0;
    state.ammo = 90;
    state.currentLevel = 0;
    state.velocityY = 0;
    state.canJump = true;

    // Events
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    window.addEventListener('resize', onResize);

    state.lastTime = performance.now();
    state.animFrameId = requestAnimationFrame(loop);

    // Show briefing
    if (state.overlayEl) {
      state.overlayEl.style.display = 'flex';
      state.overlayEl.style.color = '#FFCC44';
      state.overlayEl.innerHTML =
        '<div style="font-size:32px;margin-bottom:12px;color:#FF4400">BLOOD DIAMOND</div>' +
        '<div style="font-size:16px;color:#FFCC44;margin-bottom:8px">MISSION BRIEFING</div>' +
        '<div style="font-size:13px;color:#CCAA88;max-width:500px;line-height:1.7;margin-bottom:20px">' +
        'Infiltrate rebel-controlled diamond mine in West Africa.<br>' +
        'Secure 5 raw diamond caches. Free at least 8 enslaved workers.<br>' +
        'Neutralize the warlord. Reach the airstrip in 12 minutes.<br><br>' +
        'WASD = Move &nbsp; Mouse = Aim &nbsp; Click = Shoot<br>' +
        'Hold E = Interact &nbsp; Shift = Sprint &nbsp; Space = Jump<br>' +
        'R = Reload &nbsp; Esc = Exit' +
        '</div>' +
        '<div style="font-size:14px;color:#FF4400">Click to begin</div>';
      canvas.addEventListener('click', function dismissBriefing() {
        if (state.overlayEl) state.overlayEl.style.display = 'none';
        canvas.requestPointerLock();
        canvas.removeEventListener('click', dismissBriefing);
      });
    }
  }

  function deactivate() {
    if (!state.active) return;
    state.active = false;

    if (state.animFrameId) cancelAnimationFrame(state.animFrameId);

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLockChange);
    window.removeEventListener('resize', onResize);

    if (document.pointerLockElement === state.canvas) document.exitPointerLock();

    if (state.canvas) { state.canvas.remove(); state.canvas = null; }
    if (state.hudEl) { state.hudEl.remove(); state.hudEl = null; }
    if (state.crosshairEl) { state.crosshairEl.remove(); state.crosshairEl = null; }
    if (state.overlayEl) { state.overlayEl.remove(); state.overlayEl = null; }
    if (state.hpBarEl) { state.hpBarEl.remove(); state.hpBarEl = null; }
    if (state.ammoEl) { state.ammoEl.remove(); state.ammoEl = null; }
    if (state.promptEl) { state.promptEl.remove(); state.promptEl = null; }

    if (state.renderer) { state.renderer.dispose(); state.renderer = null; }

    // Clear state
    state.scene = null;
    state.camera = null;
    state.rebels = [];
    state.workers = [];
    state.diamonds = [];
    state.charges = [];
    state.meshes = [];
    state.followingWorkers = [];
    state.foreman = null;
    state.warlord = null;
    state.gasPocket = null;
    state.elevatorMesh = null;
  }

  function onResize() {
    if (!state.renderer || !state.camera) return;
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    // Already handled in activate
  }

  function update(dt) {
    // Driven by internal loop
  }

  function reset() {
    deactivate();
  }

  // Global keydown listener for activation (before game starts)
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (!state.active) {
      if (k === 'b') { state.bDown = true; state.bDownTime = Date.now(); }
      if (k === 'd') { state.dDown = true; state.dDownTime = Date.now(); }
      if (state.bDown && state.dDown) {
        var diff = Math.abs(state.bDownTime - state.dDownTime);
        if (diff < ACTIVATION_WINDOW) activate();
      }
    }
  });

  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (!state.active) {
      if (k === 'b') state.bDown = false;
      if (k === 'd') state.dDown = false;
    }
  });

  return { init: init, update: update, reset: reset };

})();
