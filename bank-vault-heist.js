window.BankVaultHeist = (function () {
  'use strict';

  // ─── State variables ───────────────────────────────────────────────────────
  var scene, camera, renderer, inputState;
  var active = false;
  var gameOver = false;
  var gameWon = false;

  // Player state
  var playerHP = 100;
  var playerMaxHP = 100;
  var playerPos = new THREE.Vector3(0, 1.7, 30);
  var playerVelY = 0;
  var playerOnGround = true;
  var playerYaw = 0;
  var playerPitch = 0;
  var score = 0;

  // Input tracking
  var keys = {};
  var mouseButtons = {};
  var mouseDX = 0;
  var mouseDY = 0;
  var lastBKey = 0;

  // Timing
  var totalTime = 0;
  var firstAlarmTime = -1;
  var swatArrived = false;
  var shootCooldown = 0;
  var reloadTimer = 0;
  var ammo = 30;
  var maxAmmo = 30;

  // Alarm system
  var alarmLevel = 0; // 0-5
  var camerasDisabled = 0;

  // Vault puzzle
  var vaultOpen = false;
  var comboStep = 0;         // which target panel to shoot next
  var comboTimer = 0;        // countdown in seconds, active when > 0
  var comboStarted = false;
  var comboPanels = [];      // array of panel objects with mesh + index

  // Gold bars
  var goldBars = [];
  var goldCollected = 0;

  // Enemies
  var enemies = [];

  // Security cameras
  var securityCameras = [];

  // Smoke grenades
  var smokeClouds = [];

  // Briggs boss
  var briggs = null;
  var briggsDefeated = false;
  var briggsShieldActive = true;
  var briggsSmokeCooldown = 0;
  var briggsNextSmokeTime = 15;

  // Roof escape
  var escapeTrigger = null;
  var escaped = false;

  // Scene objects we need to track
  var sceneObjects = [];

  // Raycaster for shooting and camera detection
  var raycaster = new THREE.Raycaster();
  var shootRaycaster = new THREE.Raycaster();

  // HUD elements
  var hudContainer = null;
  var hudAlarm = null;
  var hudCams = null;
  var hudCombo = null;
  var hudGold = null;
  var hudBriggs = null;
  var hudHP = null;
  var hudAmmo = null;
  var hudScore = null;
  var hudMessage = null;
  var hudMessageTimer = 0;

  // Materials (reused)
  var matMarble = null;
  var matColumn = null;
  var matMetal = null;
  var matGlass = null;
  var matGuard = null;
  var matSwat = null;
  var matBriggs = null;
  var matGold = null;
  var matVaultDoor = null;
  var matCamera = null;
  var matSmoke = null;
  var matPanel0 = null;
  var matPanel1 = null;
  var matPanel2 = null;
  var matPanelDone = null;
  var matServer = null;
  var matRope = null;

  // Lighting refs
  var serverLEDs = [];

  // Zone definitions (for area-based AI)
  var LOBBY_Z_MIN = 10;
  var LOBBY_Z_MAX = 50;
  var CHECKPOINT_Z = 0;
  var SERVER_Z = -20;
  var ANTEROOM_Z = -40;
  var VAULT_Z = -58;
  var ROOF_Z = -75;

  // ─── Activation key sequence ───────────────────────────────────────────────
  function handleKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'KeyB') {
      lastBKey = Date.now();
    }
    if (e.code === 'KeyV' && active === false) {
      if (Date.now() - lastBKey < 400) {
        activate();
      }
    }
    if (!active) return;
    if (e.code === 'KeyR' && reloadTimer <= 0 && ammo < maxAmmo) {
      reloadTimer = 2.0;
    }
    if (e.code === 'KeyE') {
      tryPickupGold();
    }
  }

  function handleKeyUp(e) {
    keys[e.code] = false;
  }

  function handleMouseDown(e) {
    mouseButtons[e.button] = true;
    if (!active) return;
    if (e.button === 0) {
      tryShoot();
    }
  }

  function handleMouseUp(e) {
    mouseButtons[e.button] = false;
  }

  function handleMouseMove(e) {
    if (!active) return;
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
  }

  // ─── Activation ───────────────────────────────────────────────────────────
  function activate() {
    active = true;
    buildScene();
    buildHUD();
    showMessage('BANK VAULT HEIST — Reach the vault, crack the combo, grab the gold, escape via the roof!', 6);
  }

  // ─── Scene construction ───────────────────────────────────────────────────
  function buildMaterials() {
    matMarble    = new THREE.MeshLambertMaterial({ color: 0xd0ccc8 });
    matColumn    = new THREE.MeshLambertMaterial({ color: 0xe8e4df });
    matMetal     = new THREE.MeshLambertMaterial({ color: 0x556677 });
    matGlass     = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35 });
    matGuard     = new THREE.MeshLambertMaterial({ color: 0x334455 });
    matSwat      = new THREE.MeshLambertMaterial({ color: 0x223344 });
    matBriggs    = new THREE.MeshLambertMaterial({ color: 0x112233 });
    matGold      = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    matVaultDoor = new THREE.MeshLambertMaterial({ color: 0x778899 });
    matCamera    = new THREE.MeshLambertMaterial({ color: 0x222222 });
    matSmoke     = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.45 });
    matPanel0    = new THREE.MeshLambertMaterial({ color: 0xff4400 });
    matPanel1    = new THREE.MeshLambertMaterial({ color: 0x00cc44 });
    matPanel2    = new THREE.MeshLambertMaterial({ color: 0x0044ff });
    matPanelDone = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    matServer    = new THREE.MeshLambertMaterial({ color: 0x112211 });
    matRope      = new THREE.MeshLambertMaterial({ color: 0xcc9944 });
  }

  function makeBox(w, h, d, mat, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function makeCylinder(rt, rb, h, seg, mat, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function makeSphere(r, ws, hs, mat, x, y, z) {
    var geo = new THREE.SphereGeometry(r, ws, hs);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function makeLineBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    var mesh = new THREE.LineSegments(edges, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function buildScene() {
    buildMaterials();

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0x404060, 0.8);
    scene.add(ambient);
    var dir = new THREE.DirectionalLight(0xffeedd, 0.9);
    dir.position.set(10, 30, 20);
    scene.add(dir);

    buildLobby();
    buildCheckpoint();
    buildServerRoom();
    buildVaultAnteroom();
    buildVault();
    buildRoof();
    spawnEnemies();
    buildSecurityCameras();
    buildGoldBars();
    buildEscapeTrigger();
  }

  // ─── LOBBY ────────────────────────────────────────────────────────────────
  function buildLobby() {
    // Marble floor
    makeBox(60, 0.3, 50, matMarble, 0, -0.15, 30);
    // Ceiling
    makeBox(60, 0.3, 50, new THREE.MeshLambertMaterial({ color: 0xf5f0eb }), 0, 8, 30);
    // Walls
    makeBox(0.3, 8, 50, matMarble, -30, 4, 30);
    makeBox(0.3, 8, 50, matMarble,  30, 4, 30);
    makeBox(60, 8, 0.3, matMarble, 0, 4, 55);  // back wall
    // Front entrance opening handled by checkpoint

    // Ornate columns — 4 pairs
    var colMat = matColumn;
    var colPositions = [
      [-12, 15], [-12, 30], [-12, 45],
      [ 12, 15], [ 12, 30], [ 12, 45]
    ];
    for (var ci = 0; ci < colPositions.length; ci++) {
      var cx = colPositions[ci][0];
      var cz = colPositions[ci][1];
      makeCylinder(0.9, 1.1, 7.5, 12, colMat, cx, 3.75, cz);
      // capital
      makeBox(2.5, 0.4, 2.5, colMat, cx, 7.7, cz);
      // base
      makeBox(2.5, 0.3, 2.5, colMat, cx, 0.15, cz);
    }

    // Teller windows — partition walls with glass panels
    makeBox(0.3, 3, 16, matMetal, -8, 1.5, 45);   // left partition
    makeBox(0.3, 3, 16, matMetal,  8, 1.5, 45);   // right partition
    makeBox(16, 0.3, 0.3, matMetal, 0, 3, 37);    // top bar
    // Glass panels in teller windows
    makeBox(0.1, 1.5, 7, matGlass, -8, 2.0, 45);
    makeBox(0.1, 1.5, 7, matGlass,  8, 2.0, 45);
    // Teller counters
    makeBox(5, 1, 16, matMetal, -8, 0.5, 45);
    makeBox(5, 1, 16, matMetal,  8, 0.5, 45);

    // Central rope barrier posts
    for (var pi = 0; pi < 5; pi++) {
      makeCylinder(0.08, 0.08, 1.2, 6, matMetal, -10 + pi * 5, 0.6, 18);
    }

    // Lobby point light (chandelier area)
    var chandelier = new THREE.PointLight(0xfff8e0, 1.2, 35);
    chandelier.position.set(0, 7, 35);
    scene.add(chandelier);
    // Chandelier geometry
    makeSphere(0.6, 8, 6, new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0xffcc44, emissiveIntensity: 0.8 }), 0, 7.4, 35);
  }

  // ─── SECURITY CHECKPOINT ─────────────────────────────────────────────────
  function buildCheckpoint() {
    // Floor transition
    makeBox(60, 0.3, 12, matMetal, 0, -0.15, 5);
    // Walls
    makeBox(0.3, 8, 12, matMetal, -30, 4, 5);
    makeBox(0.3, 8, 12, matMetal,  30, 4, 5);

    // Metal detector arch — left post, right post, top bar
    makeBox(0.4, 3.5, 0.4, matMetal, -2.5, 1.75, 10);
    makeBox(0.4, 3.5, 0.4, matMetal,  2.5, 1.75, 10);
    makeBox(5.4, 0.4, 0.4, matMetal,  0, 3.5, 10);
    // Gate line
    makeLineBox(5.4, 3.5, 0.1, 0x00ff88, 0, 1.75, 10);

    // Guard station — desk + panic button
    makeBox(3, 1.1, 1.5, matMetal, -18, 0.55, 8);
    makeBox(0.4, 0.4, 0.4, new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.7 }), -17, 1.5, 8);

    // Ceiling / walls connecting to lobby
    makeBox(60, 8, 0.3, matMetal, 0, 4, 0);
    makeBox(60, 0.3, 12, new THREE.MeshLambertMaterial({ color: 0x445566 }), 0, 8, 5);

    // Overhead light
    var cpLight = new THREE.PointLight(0xffffff, 0.9, 18);
    cpLight.position.set(0, 7, 5);
    scene.add(cpLight);
  }

  // ─── SERVER ROOM ──────────────────────────────────────────────────────────
  function buildServerRoom() {
    makeBox(60, 0.3, 25, new THREE.MeshLambertMaterial({ color: 0x223322 }), 0, -0.15, -10);
    makeBox(60, 0.3, 25, new THREE.MeshLambertMaterial({ color: 0x334433 }), 0, 8, -10);
    makeBox(0.3, 8, 25, matMetal, -30, 4, -10);
    makeBox(0.3, 8, 25, matMetal,  30, 4, -10);
    makeBox(60, 8, 0.3, matMetal, 0, 4, -22);

    // Server racks — rows of boxes
    var serverMat = matServer;
    var rackPositions = [
      [-20, -10], [-15, -10], [-10, -10], [-5, -10], [0, -10],
      [ 5, -10],  [ 10, -10], [ 15, -10], [20, -10],
      [-20, -16], [-10, -16], [0, -16], [10, -16], [20, -16]
    ];
    for (var ri = 0; ri < rackPositions.length; ri++) {
      var rx = rackPositions[ri][0];
      var rz = rackPositions[ri][1];
      makeBox(2, 4, 1, serverMat, rx, 2, rz);
      // LED strips on each rack
      var ledMat = new THREE.MeshLambertMaterial({
        color: ri % 3 === 0 ? 0x00ff00 : ri % 3 === 1 ? 0xff4400 : 0x0088ff,
        emissive: ri % 3 === 0 ? 0x00ff00 : ri % 3 === 1 ? 0xff4400 : 0x0088ff,
        emissiveIntensity: 1.0
      });
      var led = makeBox(0.15, 3.5, 0.05, ledMat, rx + 1.1, 2, rz);
      serverLEDs.push({ mesh: led, timer: Math.random() * 2.0, baseIntensity: 1.0 });

      // Point light per rack cluster
      if (ri % 4 === 0) {
        var rackLight = new THREE.PointLight(0x00ff44, 0.4, 8);
        rackLight.position.set(rx, 3, rz);
        scene.add(rackLight);
      }
    }
  }

  // ─── VAULT ANTEROOM ───────────────────────────────────────────────────────
  function buildVaultAnteroom() {
    // Heavy reinforced walls
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
    makeBox(60, 0.3, 20, wallMat, 0, -0.15, -32);
    makeBox(60, 0.3, 20, wallMat, 0, 8, -32);
    makeBox(0.3, 8, 20, wallMat, -30, 4, -32);
    makeBox(0.3, 8, 20, wallMat,  30, 4, -32);
    makeBox(60, 8, 0.3, wallMat, 0, 4, -42);

    // Thick wall segments flanking vault door passage
    makeBox(18, 8, 2, wallMat, -21, 4, -40);
    makeBox(18, 8, 2, wallMat,  21, 4, -40);

    // Security camera array mounts (visual)
    for (var si = 0; si < 4; si++) {
      makeBox(0.2, 0.2, 1.5, matMetal, -20 + si * 14, 7.5, -28);
    }

    // Anteroom lighting — dim red
    var anteroomLight = new THREE.PointLight(0xff3300, 1.2, 28);
    anteroomLight.position.set(0, 7, -32);
    scene.add(anteroomLight);
  }

  // ─── VAULT ────────────────────────────────────────────────────────────────
  function buildVault() {
    var vaultMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    makeBox(40, 0.3, 20, vaultMat, 0, -0.15, -58);
    makeBox(40, 0.3, 20, vaultMat, 0, 8, -58);
    makeBox(0.3, 8, 20, vaultMat, -20, 4, -58);
    makeBox(0.3, 8, 20, vaultMat,  20, 4, -58);
    makeBox(40, 8, 0.3, vaultMat, 0, 4, -68);

    // Vault door — massive cylinder (closed, horizontal)
    var vaultDoor = makeCylinder(4.5, 4.5, 1.2, 32, matVaultDoor, 0, 4, -48);
    vaultDoor.rotation.x = Math.PI / 2;
    vaultDoor.userData.isVaultDoor = true;

    // Combination dial on vault door
    var dialEdgeGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.3, 24);
    var dialEdges = new THREE.EdgesGeometry(dialEdgeGeo);
    var dialLines = new THREE.LineSegments(dialEdges, new THREE.LineBasicMaterial({ color: 0xffdd44 }));
    dialLines.rotation.x = Math.PI / 2;
    dialLines.position.set(0, 4, -47.3);
    scene.add(dialLines);
    sceneObjects.push(dialLines);

    // Spoke lines on dial
    for (var ds = 0; ds < 8; ds++) {
      var angle = (ds / 8) * Math.PI * 2;
      var spokeGeo = new THREE.BoxGeometry(0.05, 0.05, 1.8);
      var spokeEdges = new THREE.EdgesGeometry(spokeGeo);
      var spokeLine = new THREE.LineSegments(spokeEdges, new THREE.LineBasicMaterial({ color: 0xffdd44 }));
      spokeLine.rotation.x = Math.PI / 2;
      spokeLine.rotation.z = angle;
      spokeLine.position.set(0, 4, -47.2);
      scene.add(spokeLine);
      sceneObjects.push(spokeLine);
    }

    // Numbered target panels for combo (3 panels on walls)
    var panelMats = [matPanel0, matPanel1, matPanel2];
    var panelPositions = [
      { x: -18, y: 3, z: -52, label: '1' },
      { x:  18, y: 3, z: -55, label: '2' },
      { x:   0, y: 3, z: -67, label: '3' }
    ];
    comboPanels = [];
    for (var pi2 = 0; pi2 < 3; pi2++) {
      var pp = panelPositions[pi2];
      var panelMesh = makeBox(1.5, 1.5, 0.3, panelMats[pi2], pp.x, pp.y, pp.z);
      panelMesh.userData.isComboPanel = true;
      panelMesh.userData.panelIndex = pi2;
      comboPanels.push({ mesh: panelMesh, hit: false });
    }

    // Vault interior light
    var vaultLight = new THREE.PointLight(0xffd080, 1.5, 25);
    vaultLight.position.set(0, 7, -58);
    scene.add(vaultLight);
  }

  // ─── ROOF ACCESS ──────────────────────────────────────────────────────────
  function buildRoof() {
    var roofMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    makeBox(40, 0.3, 12, roofMat, 0, -0.15, -75);
    makeBox(0.3, 8, 12, roofMat, -20, 4, -75);
    makeBox(0.3, 8, 12, roofMat,  20, 4, -75);
    makeBox(40, 8, 0.3, roofMat, 0, 4, -81);
    makeBox(40, 8, 0.3, roofMat, 0, 4, -69);

    // Skylight grid — LineSegments glass grid
    for (var gi = 0; gi < 5; gi++) {
      makeLineBox(40, 0.05, 0.05, 0x88ccff, 0, 8.05, -72 - gi * 2);
    }
    for (var gj = 0; gj < 5; gj++) {
      makeLineBox(0.05, 0.05, 10, 0x88ccff, -16 + gj * 8, 8.05, -75);
    }

    // Rappel rope — thin cylinder hanging from skylight
    var rope = makeCylinder(0.07, 0.07, 7, 6, matRope, 0, 4.5, -75);
    rope.userData.isRappelRope = true;

    // Roof landing zone marker
    makeLineBox(4, 0.05, 4, 0x00ff88, 0, 0.1, -75);

    // Ladder/hatch visual
    makeBox(1.5, 0.15, 1.5, new THREE.MeshLambertMaterial({ color: 0x445544 }), 0, 8.15, -75);
  }

  // ─── SECURITY CAMERAS ────────────────────────────────────────────────────
  function buildSecurityCameras() {
    var cameraPositions = [
      { x: -25, y: 7, z: 25, ry: 0 },
      { x:  25, y: 7, z: 15, ry: Math.PI },
      { x:  0,  y: 7, z: 5,  ry: Math.PI / 2 },
      { x: -25, y: 7, z: -25, ry: 0.5 },
      { x:  25, y: 7, z: -35, ry: -0.5 }
    ];
    securityCameras = [];
    for (var sci = 0; sci < cameraPositions.length; sci++) {
      var cp = cameraPositions[sci];
      var camBody = makeCylinder(0.25, 0.18, 0.6, 8, matCamera, cp.x, cp.y, cp.z);
      camBody.rotation.z = Math.PI / 2;
      var camLens = makeCylinder(0.12, 0.08, 0.25, 8, matCamera, cp.x + 0.42, cp.y, cp.z);
      camLens.rotation.z = Math.PI / 2;
      // LED indicator
      var ledGeo = new THREE.SphereGeometry(0.07, 6, 6);
      var ledMat2 = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1.0 });
      var ledMesh = new THREE.Mesh(ledGeo, ledMat2);
      ledMesh.position.set(cp.x + 0.3, cp.y - 0.15, cp.z);
      scene.add(ledMesh);
      sceneObjects.push(ledMesh);

      securityCameras.push({
        body: camBody,
        lens: camLens,
        led: ledMesh,
        ledMat: ledMat2,
        position: new THREE.Vector3(cp.x, cp.y, cp.z),
        rotDir: (sci % 2 === 0) ? 1 : -1,
        rotSpeed: 0.4 + sci * 0.05,
        angle: cp.ry,
        disabled: false,
        fov: Math.PI / 3,
        detected: false
      });
    }
  }

  // ─── GOLD BARS ────────────────────────────────────────────────────────────
  function buildGoldBars() {
    var barPositions = [
      { x: -8,  y: 0.3, z: -60 },
      { x: -5,  y: 0.3, z: -62 },
      { x: -3,  y: 0.3, z: -60 },
      { x:  3,  y: 0.3, z: -63 },
      { x:  6,  y: 0.3, z: -61 },
      { x:  9,  y: 0.3, z: -59 }
    ];
    goldBars = [];
    for (var gbi = 0; gbi < barPositions.length; gbi++) {
      var bp = barPositions[gbi];
      var barMesh = makeBox(0.6, 0.35, 1.1, matGold, bp.x, bp.y, bp.z);
      barMesh.rotation.y = (gbi * 0.3);
      barMesh.userData.isGoldBar = true;
      goldBars.push({ mesh: barMesh, collected: false, bobOffset: gbi * 1.1 });
    }
  }

  // ─── ESCAPE TRIGGER ───────────────────────────────────────────────────────
  function buildEscapeTrigger() {
    escapeTrigger = new THREE.Vector3(0, 1.7, -75);
  }

  // ─── ENEMIES ─────────────────────────────────────────────────────────────
  function spawnEnemies() {
    enemies = [];

    // 10 security guards — patrol lobby/checkpoint in pairs
    var guardPatrolRoutes = [
      [new THREE.Vector3(-15, 1.7, 20), new THREE.Vector3(15, 1.7, 20)],
      [new THREE.Vector3(-15, 1.7, 35), new THREE.Vector3(15, 1.7, 35)],
      [new THREE.Vector3(-15, 1.7, 48), new THREE.Vector3(15, 1.7, 48)],
      [new THREE.Vector3(-20, 1.7, 8),  new THREE.Vector3(20, 1.7, 8)],
      [new THREE.Vector3(-20, 1.7, 2),  new THREE.Vector3(20, 1.7, 2)]
    ];
    for (var gi2 = 0; gi2 < 10; gi2++) {
      var route = guardPatrolRoutes[Math.floor(gi2 / 2)];
      spawnEnemy(
        'guard',
        route[gi2 % 2].clone(),
        matGuard,
        80,
        route,
        gi2
      );
    }

    // Briggs boss
    briggs = spawnEnemy('briggs', new THREE.Vector3(0, 1.7, -35), matBriggs, 470, null, 99);
    briggs.isShielded = true;
    briggs.shieldMesh = makeCylinder(1.8, 1.8, 0.15, 16, new THREE.MeshLambertMaterial({ color: 0x8899aa, transparent: true, opacity: 0.55 }), 0, 1.7, -35);
    briggs.shieldMesh.rotation.x = Math.PI / 2;
  }

  function spawnEnemy(type, pos, mat, hp, patrolRoute, id) {
    // Body
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.6, 0.5);
    var bodyMesh = new THREE.Mesh(bodyGeo, mat);
    bodyMesh.position.copy(pos);
    scene.add(bodyMesh);
    sceneObjects.push(bodyMesh);

    // Head
    var headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    var headMesh = new THREE.Mesh(headGeo, mat);
    headMesh.position.set(pos.x, pos.y + 1.05, pos.z);
    scene.add(headMesh);
    sceneObjects.push(headMesh);

    var enemy = {
      type: type,
      id: id,
      hp: hp,
      maxHp: hp,
      alive: true,
      pos: pos.clone(),
      mesh: bodyMesh,
      headMesh: headMesh,
      patrolRoute: patrolRoute,
      patrolIndex: 0,
      patrolDir: 1,
      state: 'patrol',    // patrol | alert | combat | dead
      alertTimer: 0,
      shootTimer: 1.5 + Math.random(),
      shootCooldownMax: type === 'swat' ? 1.2 : type === 'briggs' ? 2.5 : 1.8,
      mat: mat,
      isShielded: false,
      shieldMesh: null,
      smokeTimer: 0,
      vel: new THREE.Vector3(),
      facingAngle: 0
    };
    enemies.push(enemy);
    return enemy;
  }

  function spawnSWAT() {
    var swatSpawns = [
      new THREE.Vector3(-25, 1.7, 12),
      new THREE.Vector3(25, 1.7, 12),
      new THREE.Vector3(-20, 1.7, 0),
      new THREE.Vector3(20, 1.7, 0),
      new THREE.Vector3(-10, 1.7, -5),
      new THREE.Vector3(10, 1.7, -5),
      new THREE.Vector3(0, 1.7, 8)
    ];
    for (var si2 = 0; si2 < 7; si2++) {
      var spawnPos = swatSpawns[si2 % swatSpawns.length].clone();
      spawnPos.x += (Math.random() - 0.5) * 4;
      spawnPos.z += (Math.random() - 0.5) * 4;
      spawnEnemy('swat', spawnPos, matSwat, 105, null, 100 + si2);
    }
    showMessage('ARMED RESPONSE UNIT ARRIVED!', 4);
  }

  // ─── ENEMY AI ─────────────────────────────────────────────────────────────
  function updateEnemies(delta) {
    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      if (!e.alive) continue;
      updateEnemy(e, delta);
    }
  }

  function updateEnemy(e, delta) {
    var distToPlayer = e.pos.distanceTo(playerPos);
    var canSeePlayer = (distToPlayer < 30 && alarmLevel > 0) ||
                       (distToPlayer < 12 && hasLineOfSight(e.pos, playerPos));

    // State transitions
    if (e.state === 'patrol' && canSeePlayer) {
      e.state = 'combat';
      e.alertTimer = 0;
      raiseAlarm(1);
    }
    if (e.state === 'combat' && !canSeePlayer) {
      e.alertTimer += delta;
      if (e.alertTimer > 6) {
        e.state = (e.patrolRoute && e.type === 'guard') ? 'patrol' : 'alert';
        e.alertTimer = 0;
      }
    }

    // Movement
    if (e.state === 'patrol' && e.patrolRoute) {
      var target = e.patrolRoute[e.patrolIndex];
      var diff = new THREE.Vector3().subVectors(target, e.pos);
      diff.y = 0;
      var dist2 = diff.length();
      if (dist2 < 0.5) {
        e.patrolIndex = (e.patrolIndex + e.patrolDir + e.patrolRoute.length) % e.patrolRoute.length;
      } else {
        diff.normalize();
        var speed = e.type === 'swat' ? 3.5 : 2.0;
        e.pos.addScaledVector(diff, speed * delta);
      }
    } else if (e.state === 'combat' || e.state === 'alert') {
      var toPlayer = new THREE.Vector3().subVectors(playerPos, e.pos);
      toPlayer.y = 0;
      var dpLen = toPlayer.length();

      // Briggs tactics: circle-strafe
      if (e.type === 'briggs' && dpLen < 15) {
        var strafe = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
        e.pos.addScaledVector(strafe, 1.5 * delta);
      }

      // Move toward player if far, maintain distance if close
      var moveSpeed = e.type === 'swat' ? 4.0 : e.type === 'briggs' ? 2.5 : 2.8;
      var desiredDist = e.type === 'briggs' ? 8 : 5;
      if (dpLen > desiredDist + 1) {
        toPlayer.normalize();
        e.pos.addScaledVector(toPlayer, moveSpeed * delta);
      } else if (dpLen < desiredDist - 1 && dpLen > 0.5) {
        toPlayer.normalize();
        e.pos.addScaledVector(toPlayer, -moveSpeed * 0.5 * delta);
      }
    }

    // Keep on floor
    e.pos.y = 1.7;

    // Update mesh positions
    e.mesh.position.copy(e.pos);
    e.headMesh.position.set(e.pos.x, e.pos.y + 1.05, e.pos.z);

    if (e.shieldMesh) {
      e.shieldMesh.position.set(e.pos.x, e.pos.y, e.pos.z);
    }

    // Facing toward player
    var faceDir = new THREE.Vector3().subVectors(playerPos, e.pos);
    if (faceDir.length() > 0.1) {
      e.facingAngle = Math.atan2(faceDir.x, faceDir.z);
      e.mesh.rotation.y = e.facingAngle;
    }

    // Shooting
    if (e.state === 'combat' && distToPlayer < 28) {
      e.shootTimer -= delta;
      if (e.shootTimer <= 0) {
        enemyShootAtPlayer(e);
        e.shootTimer = e.shootCooldownMax + Math.random() * 0.5;
      }
    }

    // Briggs smoke grenade
    if (e.type === 'briggs' && e.alive) {
      briggsSmokeCooldown -= delta;
      if (briggsSmokeCooldown <= 0 && e.state === 'combat') {
        throwSmokeGrenade(e.pos.clone());
        briggsSmokeCooldown = 12 + Math.random() * 8;
      }
    }
  }

  function hasLineOfSight(from, to) {
    var dir = new THREE.Vector3().subVectors(to, from).normalize();
    raycaster.set(from, dir);
    var hits = raycaster.intersectObjects(sceneObjects, false);
    if (hits.length === 0) return true;
    var hitDist = hits[0].distance;
    var targetDist = from.distanceTo(to);
    return hitDist >= targetDist - 0.5;
  }

  function enemyShootAtPlayer(e) {
    if (playerHP <= 0) return;
    // Check smoke cover
    if (playerInSmoke()) return;
    var dmg = e.type === 'swat' ? 18 : e.type === 'briggs' ? 25 : 12;
    // Small miss chance based on distance
    var distFactor = e.pos.distanceTo(playerPos) / 30;
    if (Math.random() < distFactor * 0.5) return;
    playerHP -= dmg;
    if (playerHP <= 0) {
      playerHP = 0;
      triggerGameOver();
    }
    updateHUD();
  }

  function playerInSmoke() {
    for (var si3 = 0; si3 < smokeClouds.length; si3++) {
      var s = smokeClouds[si3];
      if (s.active && playerPos.distanceTo(s.pos) < 3.5) return true;
    }
    return false;
  }

  // ─── BRIGGS SHIELD LOGIC ─────────────────────────────────────────────────
  function isBriggsFrontalShot(hitDir) {
    if (!briggs || !briggs.alive) return false;
    // hitDir = direction from player TO briggs
    var briggsForward = new THREE.Vector3(
      Math.sin(briggs.facingAngle), 0, Math.cos(briggs.facingAngle)
    );
    // If shot comes from roughly in front of briggs (dot product > 0.3)
    var dot = hitDir.dot(briggsForward);
    return dot > 0.3;
  }

  // ─── SHOOTING ─────────────────────────────────────────────────────────────
  function tryShoot() {
    if (!active || gameOver || gameWon) return;
    if (reloadTimer > 0) return;
    if (ammo <= 0) { reloadTimer = 2.0; return; }
    ammo--;
    updateHUD();

    // Cast ray from camera
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    shootRaycaster.set(camera.position, dir);

    var allMeshes = [];
    for (var ei2 = 0; ei2 < enemies.length; ei2++) {
      if (enemies[ei2].alive) {
        allMeshes.push(enemies[ei2].mesh);
        allMeshes.push(enemies[ei2].headMesh);
      }
    }
    for (var ci2 = 0; ci2 < securityCameras.length; ci2++) {
      if (!securityCameras[ci2].disabled) {
        allMeshes.push(securityCameras[ci2].body);
      }
    }
    for (var pi3 = 0; pi3 < comboPanels.length; pi3++) {
      if (!comboPanels[pi3].hit) allMeshes.push(comboPanels[pi3].mesh);
    }
    // Gold bars also shootable (to interact)
    for (var gbi2 = 0; gbi2 < goldBars.length; gbi2++) {
      if (!goldBars[gbi2].collected) allMeshes.push(goldBars[gbi2].mesh);
    }

    var hits = shootRaycaster.intersectObjects(allMeshes, false);
    if (hits.length === 0) return;

    var hit = hits[0];
    var hitObj = hit.object;

    // Check enemy
    for (var ei3 = 0; ei3 < enemies.length; ei3++) {
      var e2 = enemies[ei3];
      if (!e2.alive) continue;
      if (hitObj === e2.mesh || hitObj === e2.headMesh) {
        var isHead = (hitObj === e2.headMesh);
        var dmg2 = isHead ? 50 : 25;
        // Briggs frontal shield check
        if (e2.type === 'briggs' && e2.isShielded) {
          var shotDir = new THREE.Vector3().subVectors(e2.pos, playerPos).normalize();
          if (isBriggsFrontalShot(shotDir)) {
            showMessage('BLOCKED! Flank Briggs to damage him!', 2);
            return;
          }
        }
        e2.hp -= dmg2;
        if (e2.hp <= 0) killEnemy(e2);
        return;
      }
    }

    // Check security cameras
    for (var ci3 = 0; ci3 < securityCameras.length; ci3++) {
      var cam = securityCameras[ci3];
      if (!cam.disabled && hitObj === cam.body) {
        disableCamera(ci3);
        return;
      }
    }

    // Check combo panels
    for (var pi4 = 0; pi4 < comboPanels.length; pi4++) {
      var panel = comboPanels[pi4];
      if (!panel.hit && hitObj === panel.mesh) {
        hitComboPanel(pi4);
        return;
      }
    }
  }

  function killEnemy(e) {
    e.alive = false;
    e.state = 'dead';
    e.mesh.position.y = 0.35;
    e.mesh.rotation.z = Math.PI / 2;
    e.headMesh.visible = false;
    if (e.shieldMesh) {
      e.shieldMesh.visible = false;
    }
    var pts = e.type === 'briggs' ? 2000 : e.type === 'swat' ? 400 : 200;
    score += pts;
    if (e.type === 'briggs') {
      briggsDefeated = true;
      showMessage('BRIGGS DEFEATED! +2000', 4);
    }
    checkWinCondition();
    updateHUD();
  }

  // ─── SECURITY CAMERAS ────────────────────────────────────────────────────
  function disableCamera(idx) {
    var cam = securityCameras[idx];
    cam.disabled = true;
    cam.ledMat.color.setHex(0x440000);
    cam.ledMat.emissive.setHex(0x440000);
    camerasDisabled++;
    raiseAlarm(1);
    score += 150;
    showMessage('Camera ' + (idx + 1) + ' disabled! Alarm +1', 2);
    updateHUD();
  }

  function updateCameras(delta) {
    for (var ci4 = 0; ci4 < securityCameras.length; ci4++) {
      var cam2 = securityCameras[ci4];
      if (cam2.disabled) continue;
      cam2.angle += cam2.rotDir * cam2.rotSpeed * delta;
      cam2.body.rotation.y = cam2.angle;
      cam2.lens.rotation.y = cam2.angle;

      // Check if player is in camera FOV and line of sight
      if (detectPlayerCamera(cam2)) {
        if (!cam2.detected) {
          cam2.detected = true;
          raiseAlarm(2);
          showMessage('DETECTED BY CAMERA!', 3);
        }
      } else {
        cam2.detected = false;
      }
    }
  }

  function detectPlayerCamera(cam) {
    var toPlayer = new THREE.Vector3().subVectors(playerPos, cam.position);
    var dist = toPlayer.length();
    if (dist > 22) return false;
    // Camera forward based on rotation angle
    var camForward = new THREE.Vector3(
      Math.sin(cam.angle), 0, Math.cos(cam.angle)
    );
    toPlayer.normalize();
    var dot = camForward.dot(toPlayer);
    var halfFov = cam.fov / 2;
    if (dot < Math.cos(halfFov)) return false;
    return hasLineOfSight(cam.position, playerPos);
  }

  // ─── ALARM SYSTEM ─────────────────────────────────────────────────────────
  function raiseAlarm(levels) {
    var prevLevel = alarmLevel;
    alarmLevel = Math.min(5, alarmLevel + levels);
    if (prevLevel === 0 && alarmLevel > 0) {
      firstAlarmTime = totalTime;
    }
    updateHUD();
  }

  // ─── VAULT COMBO PUZZLE ───────────────────────────────────────────────────
  function hitComboPanel(idx) {
    if (vaultOpen) return;

    if (!comboStarted) {
      // Must hit panel 0 first
      if (idx !== 0) {
        showMessage('Shoot the RED panel first!', 2);
        return;
      }
      comboStarted = true;
      comboTimer = 10;
      comboStep = 0;
    }

    if (idx === comboStep) {
      comboPanels[idx].hit = true;
      comboPanels[idx].mesh.material = matPanelDone;
      comboStep++;
      score += 300;
      if (comboStep >= 3) {
        openVault();
      } else {
        showMessage('Combo: ' + comboStep + '/3 — keep going!', 2);
        comboTimer = 10; // reset timer for next panel
      }
    } else {
      // Wrong order — reset
      showMessage('WRONG SEQUENCE! Restart combo.', 3);
      resetCombo();
    }
    updateHUD();
  }

  function resetCombo() {
    comboStarted = false;
    comboStep = 0;
    comboTimer = 0;
    for (var pi5 = 0; pi5 < comboPanels.length; pi5++) {
      comboPanels[pi5].hit = false;
      var mats = [matPanel0, matPanel1, matPanel2];
      comboPanels[pi5].mesh.material = mats[pi5];
    }
  }

  function openVault() {
    vaultOpen = true;
    comboTimer = 0;
    // Animate vault door open — move it to the side
    for (var soi = 0; soi < sceneObjects.length; soi++) {
      if (sceneObjects[soi].userData && sceneObjects[soi].userData.isVaultDoor) {
        sceneObjects[soi].position.x = -10;
        sceneObjects[soi].position.y = 0;
        break;
      }
    }
    showMessage('VAULT OPEN! Grab the gold bars (press E)!', 5);
    score += 1000;
    updateHUD();
  }

  function updateComboTimer(delta) {
    if (comboStarted && comboTimer > 0 && !vaultOpen) {
      comboTimer -= delta;
      if (comboTimer <= 0) {
        showMessage('COMBO TIMED OUT! Restart.', 3);
        resetCombo();
        updateHUD();
      }
    }
  }

  // ─── GOLD COLLECTION ─────────────────────────────────────────────────────
  function tryPickupGold() {
    if (!vaultOpen) {
      showMessage('Vault must be open first!', 2);
      return;
    }
    for (var gbi3 = 0; gbi3 < goldBars.length; gbi3++) {
      var bar = goldBars[gbi3];
      if (bar.collected) continue;
      if (playerPos.distanceTo(bar.mesh.position) < 2.5) {
        bar.collected = true;
        bar.mesh.visible = false;
        goldCollected++;
        score += 800;
        showMessage('Gold bar collected! ' + goldCollected + '/6 (+800)', 2);
        updateHUD();
        checkWinCondition();
        return;
      }
    }
    showMessage('No gold nearby (get closer to gold bars)', 1.5);
  }

  function updateGoldBars(delta) {
    for (var gbi4 = 0; gbi4 < goldBars.length; gbi4++) {
      var bar2 = goldBars[gbi4];
      if (bar2.collected) continue;
      bar2.bobOffset += delta;
      bar2.mesh.position.y = 0.3 + Math.sin(bar2.bobOffset * 2) * 0.08;
      bar2.mesh.rotation.y += delta * 0.8;
    }
  }

  // ─── SMOKE GRENADES ───────────────────────────────────────────────────────
  function throwSmokeGrenade(pos) {
    var smkMat = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
    var smkMesh = makeSphere(2.2, 8, 8, smkMat, pos.x, pos.y + 1, pos.z);
    smokeClouds.push({
      mesh: smkMesh,
      mat: smkMat,
      pos: smkMesh.position.clone(),
      timer: 8.0,
      active: true
    });
    showMessage('Smoke grenade!', 1.5);
  }

  function updateSmoke(delta) {
    for (var si4 = 0; si4 < smokeClouds.length; si4++) {
      var s = smokeClouds[si4];
      if (!s.active) continue;
      s.timer -= delta;
      s.pos.copy(s.mesh.position);
      if (s.timer <= 0) {
        s.active = false;
        s.mesh.visible = false;
      } else if (s.timer < 2) {
        s.mat.opacity = 0.5 * (s.timer / 2);
      }
    }
  }

  // ─── LED BLINKING ─────────────────────────────────────────────────────────
  function updateServerLEDs(delta) {
    for (var li = 0; li < serverLEDs.length; li++) {
      var led = serverLEDs[li];
      led.timer -= delta;
      if (led.timer <= 0) {
        led.timer = 0.3 + Math.random() * 1.2;
        var mat = led.mesh.material;
        if (mat.emissiveIntensity > 0.1) {
          mat.emissiveIntensity = 0.0;
        } else {
          mat.emissiveIntensity = 1.0;
        }
      }
    }
  }

  // ─── SWAT TIMER ───────────────────────────────────────────────────────────
  function checkSWATTimer() {
    if (swatArrived || firstAlarmTime < 0) return;
    if (totalTime - firstAlarmTime >= 60) {
      swatArrived = true;
      spawnSWAT();
    }
  }

  // ─── PLAYER MOVEMENT ─────────────────────────────────────────────────────
  function updatePlayer(delta) {
    if (gameOver || gameWon) return;

    // Mouse look
    var sensitivity = 0.002;
    playerYaw -= mouseDX * sensitivity;
    playerPitch -= mouseDY * sensitivity;
    playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
    mouseDX = 0;
    mouseDY = 0;

    // Movement
    var forward = new THREE.Vector3(-Math.sin(playerYaw), 0, -Math.cos(playerYaw));
    var right = new THREE.Vector3(Math.cos(playerYaw), 0, -Math.sin(playerYaw));
    var speed = keys['ShiftLeft'] ? 10 : 6;
    var moveVec = new THREE.Vector3();

    if (keys['KeyW'] || keys['ArrowUp'])    moveVec.addScaledVector(forward, speed * delta);
    if (keys['KeyS'] || keys['ArrowDown'])  moveVec.addScaledVector(forward, -speed * delta);
    if (keys['KeyA'] || keys['ArrowLeft'])  moveVec.addScaledVector(right, -speed * delta);
    if (keys['KeyD'] || keys['ArrowRight']) moveVec.addScaledVector(right, speed * delta);

    playerPos.add(moveVec);

    // Simple boundary clamp
    playerPos.x = Math.max(-29, Math.min(29, playerPos.x));
    playerPos.z = Math.max(-80, Math.min(54, playerPos.z));

    // Jump
    if (keys['Space'] && playerOnGround) {
      playerVelY = 8;
      playerOnGround = false;
    }
    if (!playerOnGround) {
      playerVelY -= 20 * delta;
      playerPos.y += playerVelY * delta;
      if (playerPos.y <= 1.7) {
        playerPos.y = 1.7;
        playerOnGround = true;
        playerVelY = 0;
      }
    }

    // Update camera
    camera.position.copy(playerPos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;

    // Reload
    if (reloadTimer > 0) {
      reloadTimer -= delta;
      if (reloadTimer <= 0) {
        reloadTimer = 0;
        ammo = maxAmmo;
        showMessage('Reloaded!', 1);
        updateHUD();
      }
    }

    // Auto-shoot hold
    if (mouseButtons[0] && shootCooldown <= 0 && ammo > 0 && reloadTimer <= 0) {
      tryShoot();
      shootCooldown = 0.12;
    }
    if (shootCooldown > 0) shootCooldown -= delta;

    // Health regen (very slow)
    if (playerHP > 0 && playerHP < playerMaxHP) {
      playerHP = Math.min(playerMaxHP, playerHP + 2 * delta);
    }
  }

  // ─── ESCAPE TRIGGER ───────────────────────────────────────────────────────
  function checkEscapeTrigger() {
    if (!escapeTrigger || escaped) return;
    if (!briggsDefeated) return;
    if (goldCollected < 6) return;
    if (!vaultOpen) return;
    if (playerPos.distanceTo(escapeTrigger) < 3.5) {
      escaped = true;
      triggerWin();
    }
  }

  // ─── WIN / LOSS ───────────────────────────────────────────────────────────
  function checkWinCondition() {
    if (gameOver || gameWon) return;
    if (briggsDefeated && goldCollected >= 6 && vaultOpen) {
      // Show escape instruction
      showMessage('ALL OBJECTIVES DONE! Get to the roof (north) to escape!', 6);
    }
  }

  function triggerWin() {
    gameWon = true;
    score += 5000;
    updateHUD();
    showMessage('MISSION COMPLETE! You escaped with the gold! Final Score: ' + score, 10);
    if (hudContainer) {
      var winBanner = document.createElement('div');
      winBanner.style.cssText = 'position:absolute;top:35%;left:50%;transform:translateX(-50%);color:#ffd700;font-size:48px;font-weight:bold;text-shadow:0 0 20px #ffd700;text-align:center;pointer-events:none;z-index:9999;';
      winBanner.textContent = 'HEIST COMPLETE!';
      hudContainer.appendChild(winBanner);
    }
  }

  function triggerGameOver() {
    gameOver = true;
    showMessage('YOU DIED — Mission Failed', 10);
    if (hudContainer) {
      var overBanner = document.createElement('div');
      overBanner.style.cssText = 'position:absolute;top:35%;left:50%;transform:translateX(-50%);color:#ff2200;font-size:48px;font-weight:bold;text-shadow:0 0 20px #ff0000;text-align:center;pointer-events:none;z-index:9999;';
      overBanner.textContent = 'MISSION FAILED';
      hudContainer.appendChild(overBanner);
    }
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudContainer = document.createElement('div');
    hudContainer.id = 'bvh-hud';
    hudContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;font-family:monospace;';

    // Top-left panel
    var topLeft = document.createElement('div');
    topLeft.style.cssText = 'position:absolute;top:12px;left:12px;color:#eee;font-size:14px;background:rgba(0,0,0,0.65);padding:10px 14px;border-radius:6px;line-height:1.7;';

    hudAlarm  = document.createElement('div');
    hudCams   = document.createElement('div');
    hudCombo  = document.createElement('div');
    hudGold   = document.createElement('div');
    hudBriggs = document.createElement('div');
    hudScore  = document.createElement('div');

    topLeft.appendChild(hudAlarm);
    topLeft.appendChild(hudCams);
    topLeft.appendChild(hudCombo);
    topLeft.appendChild(hudGold);
    topLeft.appendChild(hudBriggs);
    topLeft.appendChild(hudScore);
    hudContainer.appendChild(topLeft);

    // Bottom bar: HP + Ammo
    var botBar = document.createElement('div');
    botBar.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#eee;font-size:16px;background:rgba(0,0,0,0.7);padding:8px 20px;border-radius:8px;text-align:center;';
    hudHP   = document.createElement('span');
    hudAmmo = document.createElement('span');
    botBar.appendChild(hudHP);
    botBar.appendChild(document.createTextNode('   |   '));
    botBar.appendChild(hudAmmo);
    hudContainer.appendChild(botBar);

    // Message display
    hudMessage = document.createElement('div');
    hudMessage.style.cssText = 'position:absolute;top:55%;left:50%;transform:translateX(-50%);color:#ffe566;font-size:18px;font-weight:bold;text-shadow:1px 1px 4px #000;text-align:center;pointer-events:none;min-width:400px;';
    hudMessage.textContent = '';
    hudContainer.appendChild(hudMessage);

    // Crosshair
    var crosshair = document.createElement('div');
    crosshair.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;pointer-events:none;';
    crosshair.innerHTML = '<svg width="18" height="18"><line x1="9" y1="0" x2="9" y2="7" stroke="white" stroke-width="1.5"/><line x1="9" y1="11" x2="9" y2="18" stroke="white" stroke-width="1.5"/><line x1="0" y1="9" x2="7" y2="9" stroke="white" stroke-width="1.5"/><line x1="11" y1="9" x2="18" y2="9" stroke="white" stroke-width="1.5"/></svg>';
    hudContainer.appendChild(crosshair);

    // Reload indicator
    var reloadBar = document.createElement('div');
    reloadBar.id = 'bvh-reloadbar';
    reloadBar.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);color:#ffcc44;font-size:13px;display:none;';
    reloadBar.textContent = 'RELOADING...';
    hudContainer.appendChild(reloadBar);

    document.body.appendChild(hudContainer);
    updateHUD();
  }

  function updateHUD() {
    if (!hudAlarm) return;
    var alarmColors = ['#00ff88', '#aaff00', '#ffcc00', '#ff8800', '#ff4400', '#ff0000'];
    var alarmStr = '';
    for (var ai = 0; ai <= 5; ai++) {
      alarmStr += ai <= alarmLevel ? '▮' : '▯';
    }
    hudAlarm.innerHTML  = '<span style="color:' + alarmColors[alarmLevel] + '">ALARM ' + alarmStr + ' Lv.' + alarmLevel + '</span>';
    hudCams.textContent  = 'Cameras Disabled: ' + camerasDisabled + '/5';
    hudCombo.innerHTML   = 'Vault Combo: ' + comboStep + '/3' + (vaultOpen ? ' <span style="color:#ffd700">OPEN!</span>' : '') + (comboTimer > 0 ? ' [' + comboTimer.toFixed(1) + 's]' : '');
    hudGold.textContent  = 'Gold Bars: ' + goldCollected + '/6';

    var briggsHP = briggs ? briggs.hp : 0;
    var briggsStr = briggsDefeated ? 'DEFEATED' : (briggs ? 'HP: ' + Math.max(0, Math.round(briggsHP)) + '/' + briggs.maxHp + (briggs.isShielded ? ' [FRONTAL SHIELD]' : '') : 'N/A');
    hudBriggs.innerHTML = 'Briggs: <span style="color:' + (briggsDefeated ? '#00ff88' : '#ff6644') + '">' + briggsStr + '</span>';
    hudScore.textContent = 'Score: ' + score;

    if (hudHP) {
      var hpColor = playerHP > 60 ? '#88ff88' : playerHP > 30 ? '#ffcc44' : '#ff4444';
      hudHP.innerHTML = '<span style="color:' + hpColor + '">HP: ' + Math.max(0, Math.round(playerHP)) + '/' + playerMaxHP + '</span>';
    }
    if (hudAmmo) {
      var ammoColor = ammo > 10 ? '#eee' : '#ff8844';
      hudAmmo.innerHTML = '<span style="color:' + ammoColor + '">AMMO: ' + ammo + '/' + maxAmmo + (reloadTimer > 0 ? ' RELOADING' : '') + '</span>';
    }

    var swatStr = swatArrived ? 'ARRIVED' : (firstAlarmTime >= 0 ? 'T-' + Math.max(0, Math.round(60 - (totalTime - firstAlarmTime))) + 's' : 'On standby');
    if (hudScore) {
      hudScore.textContent = 'Score: ' + score + '  |  SWAT: ' + swatStr;
    }
  }

  function showMessage(msg, duration) {
    if (!hudMessage) return;
    hudMessage.textContent = msg;
    hudMessageTimer = duration || 3;
  }

  function updateMessageTimer(delta) {
    if (hudMessageTimer > 0) {
      hudMessageTimer -= delta;
      if (hudMessageTimer <= 0) {
        hudMessageTimer = 0;
        if (hudMessage) hudMessage.textContent = '';
      }
    }

    // Reload bar
    var reloadBar = document.getElementById('bvh-reloadbar');
    if (reloadBar) {
      reloadBar.style.display = reloadTimer > 0 ? 'block' : 'none';
    }
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, rendererRef, inputRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    inputState = inputRef;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  function update(delta) {
    if (!active) return;
    totalTime += delta;

    updatePlayer(delta);
    updateEnemies(delta);
    updateCameras(delta);
    updateComboTimer(delta);
    updateGoldBars(delta);
    updateSmoke(delta);
    updateServerLEDs(delta);
    checkSWATTimer();
    checkEscapeTrigger();
    updateMessageTimer(delta);
    updateHUD();
  }

  // ─── RESET ────────────────────────────────────────────────────────────────
  function reset() {
    // Remove all scene objects we added
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
      if (sceneObjects[i].geometry) sceneObjects[i].geometry.dispose();
    }
    sceneObjects = [];

    // Remove HUD
    if (hudContainer && hudContainer.parentNode) {
      hudContainer.parentNode.removeChild(hudContainer);
    }
    hudContainer = null;
    hudAlarm = null;
    hudCams = null;
    hudCombo = null;
    hudGold = null;
    hudBriggs = null;
    hudHP = null;
    hudAmmo = null;
    hudScore = null;
    hudMessage = null;

    // Reset state
    active = false;
    gameOver = false;
    gameWon = false;
    playerHP = 100;
    playerPos.set(0, 1.7, 30);
    playerVelY = 0;
    playerOnGround = true;
    playerYaw = 0;
    playerPitch = 0;
    score = 0;
    totalTime = 0;
    firstAlarmTime = -1;
    swatArrived = false;
    shootCooldown = 0;
    reloadTimer = 0;
    ammo = 30;
    alarmLevel = 0;
    camerasDisabled = 0;
    vaultOpen = false;
    comboStep = 0;
    comboTimer = 0;
    comboStarted = false;
    comboPanels = [];
    goldBars = [];
    goldCollected = 0;
    enemies = [];
    securityCameras = [];
    smokeClouds = [];
    briggs = null;
    briggsDefeated = false;
    briggsShieldActive = true;
    briggsSmokeCooldown = 0;
    serverLEDs = [];
    escaped = false;
    keys = {};
    mouseButtons = {};
    mouseDX = 0;
    mouseDY = 0;
    hudMessageTimer = 0;

    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
  }

  return { init: init, update: update, reset: reset };

}());
