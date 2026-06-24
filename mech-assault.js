window.MechAssault = (function () {
  'use strict';

  // ─── State ───────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;

  var keys = {};
  var mouse = { x: 0, y: 0, dx: 0, dy: 0, left: false, right: false };
  var mouseAccX = 0, mouseAccY = 0;

  // Activation
  var activationKeys = {};
  var activationTimers = {};
  var MODULE_ACTIVE = false;

  // Player state
  var playerInMech = false;
  var playerPos = { x: 0, y: 1, z: 0 };
  var playerYaw = 0;
  var playerPitch = 0;
  var playerMesh = null;
  var playerHP = 100;

  // Mech state
  var mechMesh = null;
  var mechPos = { x: 0, y: 0, z: 0 };
  var mechYaw = 0;
  var mechPitch = 0;
  var mechHP = 500;
  var mechMaxHP = 500;
  var mechMissiles = 10;
  var mechMaxMissiles = 10;
  var mechEnergy = 100;
  var mechMaxEnergy = 100;
  var mechMissileReload = 0;
  var mechMissileReloadTime = 5;
  var shieldActive = false;
  var shieldTimer = 0;
  var shieldDuration = 3;
  var shieldCooldown = 0;
  var shieldCooldownMax = 60;
  var shieldMesh = null;
  var mechLeftLeg = null, mechRightLeg = null, mechLeftArm = null, mechRightArm = null;
  var mechCockpit = null;
  var mechFootstepTimer = 0;
  var mechFootstepInterval = 0.4;
  var cameraShake = 0;
  var cameraShakeX = 0, cameraShakeY = 0;
  var mechMoving = false;
  var nearMech = false;

  // Weapons
  var missiles = [];
  var laserActive = false;
  var laserMesh = null;
  var laserDmgTimer = 0;

  // Enemies
  var tanks = [];
  var helicopters = [];
  var enemyMechs = [];
  var waveNumber = 0;
  var waveTimer = 90;
  var waveTimerMax = 90;
  var totalWaves = 5;
  var gameWon = false;
  var gameLost = false;
  var gameActive = false;

  // Terrain
  var buildings = [];
  var craters = [];
  var fuelDepots = [];
  var powerups = [];

  // HUD
  var hudEl = null;

  // Raycaster / intersections
  var laserRay = null;

  // ─── Materials (reused) ───────────────────────────────────────────────────
  var MAT = {};

  function initMaterials() {
    MAT.mech        = new THREE.MeshLambertMaterial({ color: 0x557799 });
    MAT.mechDark    = new THREE.MeshLambertMaterial({ color: 0x334455 });
    MAT.glass       = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });
    MAT.tank        = new THREE.MeshLambertMaterial({ color: 0x556633 });
    MAT.tankBarrel  = new THREE.MeshLambertMaterial({ color: 0x443322 });
    MAT.heli        = new THREE.MeshLambertMaterial({ color: 0x886644 });
    MAT.rotor       = new THREE.MeshLambertMaterial({ color: 0x222222 });
    MAT.enemyMech   = new THREE.MeshLambertMaterial({ color: 0x553311 });
    MAT.building    = new THREE.MeshLambertMaterial({ color: 0x444444 });
    MAT.crater      = new THREE.MeshLambertMaterial({ color: 0x333333 });
    MAT.fuel        = new THREE.MeshLambertMaterial({ color: 0xff4400 });
    MAT.missile     = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
    MAT.shell       = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
    MAT.explosion   = new THREE.MeshLambertMaterial({ color: 0xff6600, transparent: true, opacity: 0.85 });
    MAT.shield      = new THREE.MeshLambertMaterial({ color: 0x44aaff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    MAT.laser       = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    MAT.ammoBox     = new THREE.MeshLambertMaterial({ color: 0x338833 });
    MAT.repairBox   = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    MAT.energyBox   = new THREE.MeshLambertMaterial({ color: 0x4488ff });
    MAT.player      = new THREE.MeshLambertMaterial({ color: 0xddcc99 });
    MAT.ground      = new THREE.MeshLambertMaterial({ color: 0x554433 });
    MAT.heliShell   = new THREE.MeshLambertMaterial({ color: 0xff8800 });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function makeMesh(geo, mat, px, py, pz, rx, ry, rz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(px || 0, py || 0, pz || 0);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    scene.add(m);
    return m;
  }

  function addTo(parent, geo, mat, px, py, pz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(px || 0, py || 0, pz || 0);
    parent.add(m);
    return m;
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return dx * dx + dz * dz;
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function spawnExplosion(px, py, pz, radius) {
    var geo = new THREE.SphereGeometry(radius, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
    var m = makeMesh(geo, mat, px, py, pz);
    m._life = 0.6;
    m._type = 'explosion';
    missiles.push(m); // reuse missiles array for cleanup with typed check
  }

  function spawnExplosionFull(px, py, pz) {
    spawnExplosion(px, py, pz, 3);
    cameraShake = 0.4;
  }

  function removeFromScene(arr, idx) {
    scene.remove(arr[idx]);
    arr.splice(idx, 1);
  }

  // ─── Terrain ─────────────────────────────────────────────────────────────
  function buildTerrain() {
    // Ground
    var groundGeo = new THREE.PlaneGeometry(200, 200);
    var ground = makeMesh(groundGeo, MAT.ground, 0, 0, 0, -Math.PI / 2, 0, 0);
    ground.receiveShadow = false;

    // 6 destroyed buildings
    var bldPositions = [
      [-30, -30], [30, -25], [-40, 20], [40, 30], [-15, 40], [20, -45]
    ];
    for (var bi = 0; bi < bldPositions.length; bi++) {
      var bw = 5 + Math.random() * 5;
      var bh = 3 + Math.random() * 6;
      var bd = 5 + Math.random() * 5;
      var bGeo = new THREE.BoxGeometry(bw, bh, bd);
      var bm = makeMesh(bGeo, MAT.building, bldPositions[bi][0], bh / 2, bldPositions[bi][1]);
      bm._type = 'building';
      bm._bbox = { x: bldPositions[bi][0], z: bldPositions[bi][1], w: bw, d: bd };
      buildings.push(bm);
    }

    // Craters (PlaneGeometry tilted, flat discs)
    var craterPositions = [
      [-10, 15], [15, -10], [-25, -5], [35, 0], [5, 35]
    ];
    for (var ci = 0; ci < craterPositions.length; ci++) {
      var cr = 3 + Math.random() * 3;
      var cGeo = new THREE.PlaneGeometry(cr * 2, cr * 2, 4, 4);
      var cm = makeMesh(cGeo, MAT.crater, craterPositions[ci][0], 0.02, craterPositions[ci][1], -Math.PI / 2, 0, 0);
      craters.push(cm);
    }

    // 3 fuel depots
    var fuelPositions = [[-20, 10], [25, 20], [0, -30]];
    for (var fi = 0; fi < fuelPositions.length; fi++) {
      var fGroup = new THREE.Group();
      fGroup.position.set(fuelPositions[fi][0], 0, fuelPositions[fi][1]);
      scene.add(fGroup);

      var fBase = addTo(fGroup, new THREE.CylinderGeometry(1.5, 1.5, 0.3, 8), MAT.fuel, 0, 0.15, 0);
      var fTank = addTo(fGroup, new THREE.CylinderGeometry(1, 1, 3, 8), MAT.fuel, 0, 1.65, 0);
      var fTop  = addTo(fGroup, new THREE.CylinderGeometry(0.3, 1, 0.6, 8), MAT.fuel, 0, 3.45, 0);

      fGroup._type = 'fueldepot';
      fGroup._hp = 100;
      fGroup._pos = { x: fuelPositions[fi][0], y: 2, z: fuelPositions[fi][1] };
      fGroup._alive = true;
      fuelDepots.push(fGroup);
    }
  }

  // ─── Mech ─────────────────────────────────────────────────────────────────
  function buildPlayerMech() {
    mechMesh = new THREE.Group();
    mechMesh.position.set(0, 0, -10);
    scene.add(mechMesh);

    // Torso 3x6x2
    var torso = addTo(mechMesh, new THREE.BoxGeometry(3, 6, 2), MAT.mech, 0, 3, 0);
    // Cockpit glass viewport
    mechCockpit = addTo(mechMesh, new THREE.BoxGeometry(1.5, 1, 0.5), MAT.glass, 0, 5, -1.1);
    // Head
    addTo(mechMesh, new THREE.BoxGeometry(1.5, 1.2, 1.5), MAT.mechDark, 0, 6.6, 0);

    // Arms
    mechLeftArm  = addTo(mechMesh, new THREE.BoxGeometry(0.8, 3.5, 0.8), MAT.mech, -2.2, 3.5, 0);
    mechRightArm = addTo(mechMesh, new THREE.BoxGeometry(0.8, 3.5, 0.8), MAT.mech, 2.2, 3.5, 0);
    // Shoulder pads
    addTo(mechMesh, new THREE.BoxGeometry(1.2, 0.6, 1.2), MAT.mechDark, -1.9, 5.5, 0);
    addTo(mechMesh, new THREE.BoxGeometry(1.2, 0.6, 1.2), MAT.mechDark,  1.9, 5.5, 0);
    // Missile launcher on left shoulder
    addTo(mechMesh, new THREE.BoxGeometry(0.7, 0.7, 1.5), MAT.tankBarrel, -2.1, 5.9, -0.5);

    // Legs
    mechLeftLeg  = addTo(mechMesh, new THREE.BoxGeometry(1.1, 3, 1), MAT.mech, -1, -1.5, 0);
    mechRightLeg = addTo(mechMesh, new THREE.BoxGeometry(1.1, 3, 1), MAT.mech,  1, -1.5, 0);
    // Feet
    addTo(mechMesh, new THREE.BoxGeometry(1.3, 0.6, 1.8), MAT.mechDark, -1, -3.3, 0.2);
    addTo(mechMesh, new THREE.BoxGeometry(1.3, 0.6, 1.8), MAT.mechDark,  1, -3.3, 0.2);

    mechPos = { x: 0, y: 0, z: -10 };
    mechYaw = 0;
  }

  function buildShieldMesh() {
    var sGeo = new THREE.SphereGeometry(5, 12, 12);
    shieldMesh = new THREE.Mesh(sGeo, MAT.shield);
    shieldMesh.visible = false;
    mechMesh.add(shieldMesh);
    shieldMesh.position.set(0, 3, 0);
  }

  // ─── Player mesh ──────────────────────────────────────────────────────────
  function buildPlayerMesh() {
    playerMesh = new THREE.Group();
    playerMesh.position.set(3, 0, -10);
    scene.add(playerMesh);
    addTo(playerMesh, new THREE.BoxGeometry(0.5, 1.4, 0.3), MAT.player, 0, 0.7, 0);
    addTo(playerMesh, new THREE.SphereGeometry(0.25, 6, 6), MAT.player, 0, 1.55, 0);
  }

  // ─── Enemies ─────────────────────────────────────────────────────────────
  function spawnTank(px, pz) {
    var g = new THREE.Group();
    g.position.set(px, 0, pz);
    scene.add(g);

    // Body 3x1.2x2
    addTo(g, new THREE.BoxGeometry(3, 1.2, 2), MAT.tank, 0, 0.6, 0);
    // Tracks
    addTo(g, new THREE.BoxGeometry(3.2, 0.4, 0.4), MAT.tankBarrel, 0, 0.2, 1.1);
    addTo(g, new THREE.BoxGeometry(3.2, 0.4, 0.4), MAT.tankBarrel, 0, 0.2, -1.1);
    // Turret
    var turret = addTo(g, new THREE.CylinderGeometry(0.7, 0.7, 0.6, 8), MAT.tank, 0, 1.5, 0);
    // Barrel
    addTo(g, new THREE.CylinderGeometry(0.15, 0.15, 2, 6), MAT.tankBarrel, 0, 1.5, -1.5, Math.PI / 2, 0, 0);

    g._type = 'tank';
    g._hp = 200;
    g._maxHp = 200;
    g._fireTimer = 1 + Math.random() * 2;
    g._fireCooldown = 3;
    g._pos = { x: px, y: 0.6, z: pz };
    g._alive = true;
    tanks.push(g);
  }

  function spawnHelicopter(px, pz) {
    var g = new THREE.Group();
    g.position.set(px, 10, pz);
    scene.add(g);

    // Fuselage BoxGeometry
    addTo(g, new THREE.BoxGeometry(2.5, 0.8, 1), MAT.heli, 0, 0, 0);
    // Tail
    addTo(g, new THREE.BoxGeometry(1.5, 0.3, 0.3), MAT.heli, 1.8, 0, 0);
    // Cabin front
    addTo(g, new THREE.BoxGeometry(1, 0.7, 0.8), MAT.glass, -0.5, 0.1, 0);
    // Main rotor (CylinderGeometry very flat)
    var rotor = addTo(g, new THREE.CylinderGeometry(2, 2, 0.1, 6), MAT.rotor, 0, 0.5, 0);
    rotor._isRotor = true;
    // Tail rotor
    var tailRotor = addTo(g, new THREE.CylinderGeometry(0.4, 0.4, 0.08, 6), MAT.rotor, 2.6, 0, 0, 0, 0, Math.PI / 2);
    tailRotor._isRotor = true;

    g._type = 'helicopter';
    g._hp = 150;
    g._maxHp = 150;
    g._rotor = rotor;
    g._tailRotor = tailRotor;
    g._fireTimer = 1.5 + Math.random() * 2;
    g._fireCooldown = 2;
    g._strafeAngle = Math.random() * Math.PI * 2;
    g._strafeRadius = 15 + Math.random() * 10;
    g._strafeSpeed = 0.5 + Math.random() * 0.5;
    g._pos = { x: px, y: 10, z: pz };
    g._alive = true;
    helicopters.push(g);
  }

  function spawnEnemyMech(px, pz) {
    var g = new THREE.Group();
    g.position.set(px, 0, pz);
    scene.add(g);

    // Torso 3x6x2 in enemy color
    addTo(g, new THREE.BoxGeometry(3, 6, 2), MAT.enemyMech, 0, 3, 0);
    addTo(g, new THREE.BoxGeometry(1.5, 1.2, 1.5), MAT.enemyMech, 0, 6.6, 0);
    addTo(g, new THREE.BoxGeometry(0.8, 3.5, 0.8), MAT.enemyMech, -2.2, 3.5, 0);
    addTo(g, new THREE.BoxGeometry(0.8, 3.5, 0.8), MAT.enemyMech,  2.2, 3.5, 0);
    addTo(g, new THREE.BoxGeometry(1.1, 3, 1), MAT.enemyMech, -1, -1.5, 0);
    addTo(g, new THREE.BoxGeometry(1.1, 3, 1), MAT.enemyMech,  1, -1.5, 0);
    addTo(g, new THREE.BoxGeometry(1.3, 0.6, 1.8), MAT.enemyMech, -1, -3.3, 0.2);
    addTo(g, new THREE.BoxGeometry(1.3, 0.6, 1.8), MAT.enemyMech,  1, -3.3, 0.2);

    g._type = 'enemymech';
    g._hp = 400;
    g._maxHp = 400;
    g._fireTimer = 2 + Math.random() * 2;
    g._fireCooldown = 4;
    g._pos = { x: px, y: 0, z: pz };
    g._alive = true;
    enemyMechs.push(g);
  }

  function spawnWave() {
    waveNumber++;
    var spread = 40 + waveNumber * 5;

    // 4 tanks
    for (var ti = 0; ti < 4; ti++) {
      var tx = (Math.random() - 0.5) * spread;
      var tz = (Math.random() - 0.5) * spread;
      // keep away from player spawn
      if (Math.abs(tx) < 10) tx += (tx < 0 ? -15 : 15);
      if (Math.abs(tz) < 10) tz += (tz < 0 ? -15 : 15);
      spawnTank(tx, tz);
    }

    // 2 helicopters
    for (var hi = 0; hi < 2; hi++) {
      var hx = (Math.random() - 0.5) * spread;
      var hz = (Math.random() - 0.5) * spread;
      spawnHelicopter(hx, hz);
    }

    // Wave 3+: 2 enemy mechs
    if (waveNumber >= 3) {
      for (var emi = 0; emi < 2; emi++) {
        var emx = (Math.random() - 0.5) * (spread + 10);
        var emz = (Math.random() - 0.5) * (spread + 10);
        spawnEnemyMech(emx, emz);
      }
    }

    // Spawn powerups each wave
    spawnPowerup();
    spawnPowerup();
    spawnPowerup();
  }

  // ─── Powerups ─────────────────────────────────────────────────────────────
  function spawnPowerup() {
    var types = ['ammo', 'repair', 'energy'];
    var t = types[Math.floor(Math.random() * types.length)];
    var px = (Math.random() - 0.5) * 60;
    var pz = (Math.random() - 0.5) * 60;
    var mat = t === 'ammo' ? MAT.ammoBox : (t === 'repair' ? MAT.repairBox : MAT.energyBox);
    var m = makeMesh(new THREE.BoxGeometry(1, 1, 1), mat, px, 0.5, pz);
    m._type = 'powerup';
    m._pwType = t;
    m._pos = { x: px, y: 0.5, z: pz };
    m._alive = true;
    powerups.push(m);
  }

  // ─── Scene Setup ──────────────────────────────────────────────────────────
  function buildScene() {
    // Lighting
    var ambient = new THREE.AmbientLight(0x888888);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 10);
    scene.add(dirLight);

    // Sky color
    scene.background = new THREE.Color(0x223344);
    scene.fog = new THREE.Fog(0x223344, 80, 200);

    initMaterials();
    buildTerrain();
    buildPlayerMech();
    buildShieldMesh();
    buildPlayerMesh();

    // Laser
    laserRay = new THREE.Raycaster();
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'mech-assault-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'padding:8px 16px',
      'background:rgba(0,0,0,0.7)',
      'color:#00ff88',
      'font:bold 14px monospace',
      'z-index:9999',
      'pointer-events:none',
      'text-shadow:0 0 6px #00ff88',
      'letter-spacing:1px'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var shieldStr;
    if (shieldActive) {
      shieldStr = 'ACTIVE(' + Math.ceil(shieldTimer) + 's)';
    } else if (shieldCooldown > 0) {
      shieldStr = Math.ceil(shieldCooldown) + 's CD';
    } else {
      shieldStr = 'READY';
    }
    var totalEnemies = tanks.length + helicopters.length + enemyMechs.length;
    var energyPct = Math.round((mechEnergy / mechMaxEnergy) * 100);

    hudEl.textContent = 'MECH ASSAULT' +
      ' | MECH HP: ' + mechHP + '/' + mechMaxHP +
      ' | MISSILES: ' + mechMissiles + (mechMissileReload > 0 ? '(' + Math.ceil(mechMissileReload) + 's)' : '') +
      ' | ENERGY: ' + energyPct + '%' +
      ' | WAVE: ' + waveNumber + '/' + totalWaves +
      ' | ENEMIES: ' + totalEnemies +
      ' | SHIELD: ' + shieldStr +
      (playerInMech ? ' | [IN MECH]' : ' | [ON FOOT - E:board Q:exit]') +
      (gameWon ? ' | *** MISSION COMPLETE ***' : '') +
      (gameLost ? ' | *** MECH DESTROYED ***' : '');
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.code] = true;

    // Activation: M+A within 400ms
    if (e.code === 'KeyM' || e.code === 'KeyA') {
      var now = Date.now();
      activationKeys[e.code] = now;
      if (activationKeys['KeyM'] && activationKeys['KeyA']) {
        var dt = Math.abs(activationKeys['KeyM'] - activationKeys['KeyA']);
        if (dt < 400 && !MODULE_ACTIVE) {
          activateModule();
        }
      }
    }

    if (!MODULE_ACTIVE || !gameActive) return;

    // Board mech
    if (e.code === 'KeyE' && !playerInMech && nearMech) {
      boardMech();
    }
    // Exit mech
    if (e.code === 'KeyQ' && playerInMech) {
      exitMech();
    }
    // Shield
    if (e.code === 'Space' && playerInMech) {
      activateShield();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onMouseMove(e) {
    mouse.dx += e.movementX || 0;
    mouse.dy += e.movementY || 0;
  }

  function onMouseDown(e) {
    if (!MODULE_ACTIVE || !gameActive) return;
    if (e.button === 0) { mouse.left = true; fireMissile(); }
    if (e.button === 2) { mouse.right = true; }
    e.preventDefault();
  }

  function onMouseUp(e) {
    if (e.button === 0) mouse.left = false;
    if (e.button === 2) { mouse.right = false; deactivateLaser(); }
  }

  function onContextMenu(e) {
    if (MODULE_ACTIVE) e.preventDefault();
  }

  function onPointerLock() {
    // pointer lock handled by renderer click
  }

  function requestPointerLock() {
    var el = renderer.domElement;
    if (el.requestPointerLock) el.requestPointerLock();
  }

  function onRendererClick() {
    if (MODULE_ACTIVE) requestPointerLock();
  }

  // ─── Activation / Deactivation ────────────────────────────────────────────
  function activateModule() {
    MODULE_ACTIVE = true;
    gameActive = true;
    buildScene();
    buildHUD();
    spawnWave();
    requestPointerLock();
  }

  function deactivateModule() {
    MODULE_ACTIVE = false;
    gameActive = false;
    if (document.exitPointerLock) document.exitPointerLock();
    removeHUD();
    // clean scene
    while (scene.children.length > 0) scene.remove(scene.children[0]);
    // reset all state
    tanks = []; helicopters = []; enemyMechs = []; missiles = [];
    buildings = []; craters = []; fuelDepots = []; powerups = [];
    waveNumber = 0; waveTimer = waveTimerMax;
    mechHP = 500; mechMissiles = 10; mechEnergy = 100;
    mechMissileReload = 0; shieldActive = false; shieldCooldown = 0;
    playerInMech = false; gameWon = false; gameLost = false;
    mechMesh = null; playerMesh = null; shieldMesh = null;
    mechLeftLeg = null; mechRightLeg = null;
    mechLeftArm = null; mechRightArm = null;
    mechCockpit = null; laserMesh = null;
  }

  // ─── Board / Exit Mech ────────────────────────────────────────────────────
  function boardMech() {
    playerInMech = true;
    if (playerMesh) playerMesh.visible = false;
  }

  function exitMech() {
    playerInMech = false;
    // place player beside mech
    playerPos.x = mechPos.x + 4;
    playerPos.y = 1;
    playerPos.z = mechPos.z;
    if (playerMesh) {
      playerMesh.visible = true;
      playerMesh.position.set(playerPos.x, 0, playerPos.z);
    }
    playerYaw = mechYaw;
  }

  // ─── Weapons ─────────────────────────────────────────────────────────────
  function fireMissile() {
    if (!playerInMech) return;
    if (mechMissiles <= 0) return;
    if (mechMissileReload > 0) return;

    mechMissiles--;
    if (mechMissiles <= 0) mechMissileReload = mechMissileReloadTime;

    var mGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
    var m = makeMesh(mGeo, MAT.missile,
      mechPos.x - Math.sin(mechYaw) * 2.5,
      mechPos.y + 5.5,
      mechPos.z - Math.cos(mechYaw) * 2.5
    );

    var speed = 40;
    var pitch = mechPitch;
    m._vel = {
      x: -Math.sin(mechYaw) * Math.cos(pitch) * speed,
      y: -Math.sin(pitch) * speed,
      z: -Math.cos(mechYaw) * Math.cos(pitch) * speed
    };
    m._life = 3;
    m._dmg = 150;
    m._type = 'missile';
    missiles.push(m);
  }

  function fireEnemyShell(pos, targetPos, dmg, matKey) {
    var dx = targetPos.x - pos.x;
    var dy = targetPos.y - pos.y;
    var dz = targetPos.z - pos.z;
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.001) return;
    var speed = 25;
    var geo = new THREE.BoxGeometry(0.25, 0.25, 0.8);
    var m = makeMesh(geo, matKey || MAT.shell, pos.x, pos.y, pos.z);
    m._vel = { x: dx / len * speed, y: dy / len * speed, z: dz / len * speed };
    m._life = 3;
    m._dmg = dmg;
    m._type = 'enemyshell';
    missiles.push(m);
  }

  function activateLaser() {
    if (laserMesh) return;
    var points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -50)];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    laserMesh = new THREE.LineSegments(geo, MAT.laser);
    mechMesh.add(laserMesh);
    laserMesh.position.set(2.2, 3.5, 0);
    laserActive = true;
  }

  function deactivateLaser() {
    laserActive = false;
    if (laserMesh) {
      mechMesh.remove(laserMesh);
      laserMesh = null;
    }
  }

  // ─── Shield ───────────────────────────────────────────────────────────────
  function activateShield() {
    if (shieldActive) return;
    if (shieldCooldown > 0) return;
    shieldActive = true;
    shieldTimer = shieldDuration;
    shieldCooldown = shieldCooldownMax;
    if (shieldMesh) shieldMesh.visible = true;
  }

  // ─── Damage ───────────────────────────────────────────────────────────────
  function damageMech(dmg) {
    if (shieldActive) dmg = dmg * 0.2;
    mechHP -= dmg;
    cameraShake = 0.3;
    if (mechHP <= 0) {
      mechHP = 0;
      if (playerInMech) {
        gameLost = true;
        gameActive = false;
      }
    }
  }

  // ─── Laser update ─────────────────────────────────────────────────────────
  function updateLaser(dt) {
    if (!playerInMech) { deactivateLaser(); return; }
    if (mouse.right && mechEnergy > 0) {
      if (!laserActive) activateLaser();
      mechEnergy -= dt * 30; // drains energy
      if (mechEnergy < 0) mechEnergy = 0;

      // deal damage via proximity check (simulate ray)
      laserDmgTimer -= dt;
      if (laserDmgTimer <= 0) {
        laserDmgTimer = 0.1;
        var laserDir = new THREE.Vector3(-Math.sin(mechYaw), -Math.sin(mechPitch), -Math.cos(mechYaw));
        var laserOrigin = new THREE.Vector3(
          mechPos.x + Math.sin(-mechYaw) * 2.2,
          mechPos.y + 3.5,
          mechPos.z + Math.cos(-mechYaw) * 2.2
        );
        // Check tanks
        for (var ti = tanks.length - 1; ti >= 0; ti--) {
          var tk = tanks[ti];
          if (!tk._alive) continue;
          var td = dist3(laserOrigin, tk._pos);
          if (td < 60) {
            // Check rough alignment
            var toTk = new THREE.Vector3(tk._pos.x - laserOrigin.x, 0, tk._pos.z - laserOrigin.z).normalize();
            var dot = toTk.dot(new THREE.Vector3(laserDir.x, 0, laserDir.z).normalize());
            if (dot > 0.97 && td < 40) {
              tk._hp -= 8;
              if (tk._hp <= 0) killTank(ti);
            }
          }
        }
        // Check helicopters
        for (var hi = helicopters.length - 1; hi >= 0; hi--) {
          var heli = helicopters[hi];
          if (!heli._alive) continue;
          var hd = dist3(laserOrigin, heli._pos);
          if (hd < 60) {
            var toH = new THREE.Vector3(heli._pos.x - laserOrigin.x, heli._pos.y - laserOrigin.y, heli._pos.z - laserOrigin.z).normalize();
            var dotH = toH.dot(new THREE.Vector3(laserDir.x, laserDir.y, laserDir.z).normalize());
            if (dotH > 0.97 && hd < 40) {
              heli._hp -= 8;
              if (heli._hp <= 0) killHelicopter(hi);
            }
          }
        }
        // Check enemy mechs
        for (var emi = enemyMechs.length - 1; emi >= 0; emi--) {
          var em = enemyMechs[emi];
          if (!em._alive) continue;
          var emd = dist3(laserOrigin, em._pos);
          if (emd < 60) {
            var toEm = new THREE.Vector3(em._pos.x - laserOrigin.x, 0, em._pos.z - laserOrigin.z).normalize();
            var dotEm = toEm.dot(new THREE.Vector3(laserDir.x, 0, laserDir.z).normalize());
            if (dotEm > 0.97 && emd < 40) {
              em._hp -= 8;
              if (em._hp <= 0) killEnemyMech(emi);
            }
          }
        }
      }
      if (mechEnergy <= 0) deactivateLaser();
    } else {
      if (laserActive) deactivateLaser();
    }
  }

  // ─── Kill helpers ─────────────────────────────────────────────────────────
  function killTank(idx) {
    var tk = tanks[idx];
    tk._alive = false;
    spawnExplosionFull(tk._pos.x, tk._pos.y, tk._pos.z);
    scene.remove(tk);
    tanks.splice(idx, 1);
    checkFuelChain(tk._pos);
  }

  function killHelicopter(idx) {
    var h = helicopters[idx];
    h._alive = false;
    spawnExplosionFull(h._pos.x, h._pos.y, h._pos.z);
    scene.remove(h);
    helicopters.splice(idx, 1);
  }

  function killEnemyMech(idx) {
    var em = enemyMechs[idx];
    em._alive = false;
    spawnExplosionFull(em._pos.x, em._pos.y, em._pos.z);
    scene.remove(em);
    enemyMechs.splice(idx, 1);
  }

  function checkFuelChain(pos) {
    for (var fi = fuelDepots.length - 1; fi >= 0; fi--) {
      var fd = fuelDepots[fi];
      if (!fd._alive) continue;
      var d = dist3(pos, fd._pos);
      if (d < 12) {
        fd._alive = false;
        spawnExplosionFull(fd._pos.x, fd._pos.y, fd._pos.z);
        // chain: check adjacent depots
        var chainPos = { x: fd._pos.x, y: fd._pos.y, z: fd._pos.z };
        scene.remove(fd);
        fuelDepots.splice(fi, 1);
        checkFuelChain(chainPos);
        break;
      }
    }
  }

  // ─── Missile Update ───────────────────────────────────────────────────────
  function updateMissiles(dt) {
    for (var i = missiles.length - 1; i >= 0; i--) {
      var m = missiles[i];

      if (m._type === 'explosion') {
        m._life -= dt;
        m.material.opacity = Math.max(0, m._life / 0.6 * 0.9);
        if (m._life <= 0) {
          scene.remove(m);
          missiles.splice(i, 1);
        }
        continue;
      }

      m._life -= dt;
      if (m._life <= 0) {
        scene.remove(m);
        missiles.splice(i, 1);
        continue;
      }

      m.position.x += m._vel.x * dt;
      m.position.y += m._vel.y * dt;
      m.position.z += m._vel.z * dt;

      var mPos = { x: m.position.x, y: m.position.y, z: m.position.z };

      // Ground hit
      if (m.position.y < 0.2) {
        spawnExplosion(mPos.x, 0.5, mPos.z, 2);
        scene.remove(m);
        missiles.splice(i, 1);
        continue;
      }

      var hit = false;

      if (m._type === 'missile') {
        // vs tanks
        for (var ti = tanks.length - 1; ti >= 0; ti--) {
          if (!tanks[ti]._alive) continue;
          if (dist3(mPos, tanks[ti]._pos) < 3) {
            tanks[ti]._hp -= m._dmg;
            spawnExplosionFull(mPos.x, mPos.y, mPos.z);
            if (tanks[ti]._hp <= 0) killTank(ti);
            hit = true; break;
          }
        }
        if (hit) { scene.remove(m); missiles.splice(i, 1); continue; }
        // vs helicopters
        for (var hi = helicopters.length - 1; hi >= 0; hi--) {
          if (!helicopters[hi]._alive) continue;
          if (dist3(mPos, helicopters[hi]._pos) < 3) {
            helicopters[hi]._hp -= m._dmg;
            spawnExplosionFull(mPos.x, mPos.y, mPos.z);
            if (helicopters[hi]._hp <= 0) killHelicopter(hi);
            hit = true; break;
          }
        }
        if (hit) { scene.remove(m); missiles.splice(i, 1); continue; }
        // vs enemy mechs
        for (var emi = enemyMechs.length - 1; emi >= 0; emi--) {
          if (!enemyMechs[emi]._alive) continue;
          if (dist3(mPos, enemyMechs[emi]._pos) < 4) {
            enemyMechs[emi]._hp -= m._dmg;
            spawnExplosionFull(mPos.x, mPos.y, mPos.z);
            if (enemyMechs[emi]._hp <= 0) killEnemyMech(emi);
            hit = true; break;
          }
        }
        if (hit) { scene.remove(m); missiles.splice(i, 1); continue; }
        // vs fuel depots
        for (var fdi = fuelDepots.length - 1; fdi >= 0; fdi--) {
          if (!fuelDepots[fdi]._alive) continue;
          if (dist3(mPos, fuelDepots[fdi]._pos) < 3) {
            fuelDepots[fdi]._alive = false;
            spawnExplosionFull(mPos.x, mPos.y, mPos.z);
            var chainP = { x: fuelDepots[fdi]._pos.x, y: fuelDepots[fdi]._pos.y, z: fuelDepots[fdi]._pos.z };
            scene.remove(fuelDepots[fdi]);
            fuelDepots.splice(fdi, 1);
            checkFuelChain(chainP);
            hit = true; break;
          }
        }
        if (hit) { scene.remove(m); missiles.splice(i, 1); continue; }

      } else if (m._type === 'enemyshell') {
        // vs player mech
        var mechTarget = { x: mechPos.x, y: mechPos.y + 3, z: mechPos.z };
        if (dist3(mPos, mechTarget) < 4) {
          damageMech(m._dmg);
          spawnExplosion(mPos.x, mPos.y, mPos.z, 1.5);
          scene.remove(m);
          missiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  // ─── Enemy AI ─────────────────────────────────────────────────────────────
  function updateTanks(dt) {
    for (var ti = tanks.length - 1; ti >= 0; ti--) {
      var tk = tanks[ti];
      if (!tk._alive) continue;

      var target = playerInMech
        ? { x: mechPos.x, y: 0.6, z: mechPos.z }
        : { x: mechPos.x, y: 0.6, z: mechPos.z }; // mech acts as decoy when on foot

      // Move toward target slowly
      var dx = target.x - tk._pos.x;
      var dz = target.z - tk._pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > 15) {
        var spd = 3;
        tk._pos.x += (dx / d) * spd * dt;
        tk._pos.z += (dz / d) * spd * dt;
        tk.position.x = tk._pos.x;
        tk.position.z = tk._pos.z;
        // rotate toward target
        tk.rotation.y = Math.atan2(dx, dz);
      }

      // Fire
      tk._fireTimer -= dt;
      if (tk._fireTimer <= 0) {
        tk._fireTimer = tk._fireCooldown + (Math.random() - 0.5);
        if (d < 40) {
          fireEnemyShell(
            { x: tk._pos.x, y: 1.5, z: tk._pos.z },
            { x: target.x, y: target.y + 3, z: target.z },
            80
          );
        }
      }
    }
  }

  function updateHelicopters(dt) {
    for (var hi = helicopters.length - 1; hi >= 0; hi--) {
      var h = helicopters[hi];
      if (!h._alive) continue;

      // Strafe in circle around mech
      h._strafeAngle += h._strafeSpeed * dt;
      var tx = mechPos.x + Math.cos(h._strafeAngle) * h._strafeRadius;
      var tz = mechPos.z + Math.sin(h._strafeAngle) * h._strafeRadius;
      var ty = 10 + Math.sin(h._strafeAngle * 0.5) * 3;

      h._pos.x += (tx - h._pos.x) * dt * 2;
      h._pos.y += (ty - h._pos.y) * dt * 2;
      h._pos.z += (tz - h._pos.z) * dt * 2;
      h.position.set(h._pos.x, h._pos.y, h._pos.z);

      // Rotate main rotor
      if (h._rotor) h._rotor.rotation.y += dt * 10;
      if (h._tailRotor) h._tailRotor.rotation.z += dt * 15;

      // Face movement direction
      h.rotation.y = h._strafeAngle + Math.PI / 2;

      // Fire bursts
      h._fireTimer -= dt;
      if (h._fireTimer <= 0) {
        h._fireTimer = h._fireCooldown + (Math.random() * 0.5 - 0.25);
        var targetPos = playerInMech
          ? { x: mechPos.x, y: mechPos.y + 3, z: mechPos.z }
          : { x: mechPos.x, y: mechPos.y + 3, z: mechPos.z };
        var dh = dist3(h._pos, targetPos);
        if (dh < 50) {
          // fire 2-shot burst
          fireEnemyShell(h._pos, targetPos, 40, MAT.heliShell);
          var self = h;
          // slight offset second shot (defer ~0.15s via game timer — just fire both now)
          var p2 = { x: h._pos.x + 0.5, y: h._pos.y, z: h._pos.z + 0.5 };
          fireEnemyShell(p2, targetPos, 40, MAT.heliShell);
        }
      }
    }
  }

  function updateEnemyMechs(dt) {
    for (var emi = enemyMechs.length - 1; emi >= 0; emi--) {
      var em = enemyMechs[emi];
      if (!em._alive) continue;

      var target = { x: mechPos.x, y: 0, z: mechPos.z };
      var dx = target.x - em._pos.x;
      var dz = target.z - em._pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);

      if (d > 6) {
        var spd = 4;
        em._pos.x += (dx / d) * spd * dt;
        em._pos.z += (dz / d) * spd * dt;
        em.position.x = em._pos.x;
        em.position.z = em._pos.z;
        em.rotation.y = Math.atan2(dx, dz);
      }

      em._fireTimer -= dt;
      if (em._fireTimer <= 0 && d < 10) {
        em._fireTimer = em._fireCooldown;
        // Punch/stomp: direct damage
        damageMech(120);
        cameraShake = 0.5;
      }
    }
  }

  // ─── Powerup pickup ───────────────────────────────────────────────────────
  function updatePowerups() {
    var pickupPos = playerInMech ? mechPos : playerPos;
    for (var pi = powerups.length - 1; pi >= 0; pi--) {
      var pu = powerups[pi];
      if (!pu._alive) continue;
      var d = dist3(pickupPos, pu._pos);
      if (d < 3) {
        pu._alive = false;
        scene.remove(pu);
        var t = pu._pwType;
        if (t === 'ammo') {
          mechMissiles = Math.min(mechMaxMissiles, mechMissiles + 10);
          mechMissileReload = 0;
        } else if (t === 'repair') {
          mechHP = Math.min(mechMaxHP, mechHP + 150);
        } else if (t === 'energy') {
          mechEnergy = Math.min(mechMaxEnergy, mechEnergy + 50);
        }
        powerups.splice(pi, 1);
      }
    }
  }

  // ─── Camera & Mech Control ────────────────────────────────────────────────
  function updateMechControls(dt) {
    var moveSpeed = 6;
    var rotSpeed = 1.5;

    // Mouse look
    mechYaw   -= mouse.dx * 0.003;
    mechPitch -= mouse.dy * 0.003;
    mechPitch = Math.max(-0.4, Math.min(0.4, mechPitch));
    mouse.dx = 0;
    mouse.dy = 0;

    var moved = false;
    var fw = 0, str = 0;
    if (keys['KeyW'] || keys['ArrowUp'])    { fw  =  1; moved = true; }
    if (keys['KeyS'] || keys['ArrowDown'])  { fw  = -1; moved = true; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { str = -1; moved = true; }
    if (keys['KeyD'] || keys['ArrowRight']) { str =  1; moved = true; }

    // Mech slower than normal
    var actualSpeed = moveSpeed * 0.65;
    mechPos.x += (-Math.sin(mechYaw) * fw + -Math.cos(mechYaw) * str) * actualSpeed * dt;
    mechPos.z += (-Math.cos(mechYaw) * fw +  Math.sin(mechYaw) * str) * actualSpeed * dt;

    // clamp to terrain
    mechPos.x = Math.max(-98, Math.min(98, mechPos.x));
    mechPos.z = Math.max(-98, Math.min(98, mechPos.z));

    mechMesh.position.x = mechPos.x;
    mechMesh.position.y = mechPos.y;
    mechMesh.position.z = mechPos.z;
    mechMesh.rotation.y = mechYaw;

    mechMoving = moved;

    // Leg animation
    if (moved) {
      mechFootstepTimer += dt;
      var legAngle = Math.sin(mechFootstepTimer / mechFootstepInterval * Math.PI) * 0.4;
      if (mechLeftLeg)  mechLeftLeg.rotation.x  =  legAngle;
      if (mechRightLeg) mechRightLeg.rotation.x = -legAngle;
      if (mechLeftArm)  mechLeftArm.rotation.x  = -legAngle * 0.5;
      if (mechRightArm) mechRightArm.rotation.x =  legAngle * 0.5;

      // footstep shake
      if (mechFootstepTimer >= mechFootstepInterval) {
        mechFootstepTimer -= mechFootstepInterval;
        cameraShake = 0.15;
      }
    } else {
      mechFootstepTimer = 0;
      if (mechLeftLeg)  mechLeftLeg.rotation.x  = 0;
      if (mechRightLeg) mechRightLeg.rotation.x = 0;
      if (mechLeftArm)  mechLeftArm.rotation.x  = 0;
      if (mechRightArm) mechRightArm.rotation.x = 0;
    }
  }

  function updatePlayerControls(dt) {
    var speed = 8;
    playerYaw  -= mouse.dx * 0.003;
    mouse.dx = 0; mouse.dy = 0;

    if (keys['KeyW'] || keys['ArrowUp'])    { playerPos.x -= Math.sin(playerYaw) * speed * dt; playerPos.z -= Math.cos(playerYaw) * speed * dt; }
    if (keys['KeyS'] || keys['ArrowDown'])  { playerPos.x += Math.sin(playerYaw) * speed * dt; playerPos.z += Math.cos(playerYaw) * speed * dt; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { playerPos.x -= Math.cos(playerYaw) * speed * dt; playerPos.z += Math.sin(playerYaw) * speed * dt; }
    if (keys['KeyD'] || keys['ArrowRight']) { playerPos.x += Math.cos(playerYaw) * speed * dt; playerPos.z -= Math.sin(playerYaw) * speed * dt; }

    playerPos.x = Math.max(-98, Math.min(98, playerPos.x));
    playerPos.z = Math.max(-98, Math.min(98, playerPos.z));

    if (playerMesh) {
      playerMesh.position.x = playerPos.x;
      playerMesh.position.y = 0;
      playerMesh.position.z = playerPos.z;
      playerMesh.rotation.y = playerYaw;
    }

    // Check if near mech
    nearMech = dist3(playerPos, { x: mechPos.x, y: 0, z: mechPos.z }) < 5;
  }

  function updateCamera() {
    var shake = 0, shakex = 0, shakey = 0;
    if (cameraShake > 0) {
      shakex = (Math.random() - 0.5) * cameraShake * 0.3;
      shakey = (Math.random() - 0.5) * cameraShake * 0.3;
      cameraShake -= 0.05;
      if (cameraShake < 0) cameraShake = 0;
    }

    if (playerInMech) {
      // Cockpit cam: inside mech head
      var camX = mechPos.x + shakex;
      var camY = mechPos.y + 6.8 + shakey;
      var camZ = mechPos.z;
      camera.position.set(camX, camY, camZ);
      var lookDir = new THREE.Vector3(
        -Math.sin(mechYaw) * Math.cos(mechPitch),
        -Math.sin(mechPitch),
        -Math.cos(mechYaw) * Math.cos(mechPitch)
      );
      camera.lookAt(
        camX + lookDir.x * 50,
        camY + lookDir.y * 50,
        camZ + lookDir.z * 50
      );
    } else {
      // Third-person behind player
      var behind = 4;
      var cpx = playerPos.x + Math.sin(playerYaw) * behind + shakex;
      var cpz = playerPos.z + Math.cos(playerYaw) * behind + shakey;
      camera.position.set(cpx, playerPos.y + 2.5, cpz);
      camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);
    }
  }

  // ─── Wave Management ──────────────────────────────────────────────────────
  function updateWaves(dt) {
    if (waveNumber >= totalWaves) {
      // Check if all enemies cleared
      if (tanks.length === 0 && helicopters.length === 0 && enemyMechs.length === 0) {
        gameWon = true;
        gameActive = false;
      }
      return;
    }

    // Check if wave is cleared to start timer for next
    if (tanks.length === 0 && helicopters.length === 0 && enemyMechs.length === 0 && waveNumber > 0) {
      waveTimer -= dt;
      if (waveTimer <= 0) {
        waveTimer = waveTimerMax;
        spawnWave();
      }
    } else if (waveNumber === 0) {
      // handled at activation
    }
  }

  // ─── Reload & Energy ──────────────────────────────────────────────────────
  function updateResources(dt) {
    // Missile reload
    if (mechMissileReload > 0) {
      mechMissileReload -= dt;
      if (mechMissileReload <= 0) {
        mechMissileReload = 0;
        mechMissiles = mechMaxMissiles;
      }
    }

    // Energy recharge (when laser not active)
    if (!laserActive && mechEnergy < mechMaxEnergy) {
      mechEnergy += 10 * dt;
      if (mechEnergy > mechMaxEnergy) mechEnergy = mechMaxEnergy;
    }

    // Shield timer
    if (shieldActive) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) {
        shieldActive = false;
        shieldTimer = 0;
        if (shieldMesh) shieldMesh.visible = false;
      }
    }

    // Shield cooldown (starts when shield deactivates)
    if (!shieldActive && shieldCooldown > 0) {
      shieldCooldown -= dt;
      if (shieldCooldown < 0) shieldCooldown = 0;
    }
  }

  // ─── Main Update ──────────────────────────────────────────────────────────
  function update() {
    if (!MODULE_ACTIVE || !scene || !camera) return;

    var dt = clock.getDelta();
    if (dt > 0.1) dt = 0.1; // cap

    if (!gameActive) {
      updateHUD();
      return;
    }

    // Controls
    if (playerInMech) {
      updateMechControls(dt);
    } else {
      updatePlayerControls(dt);
    }

    updateCamera();
    updateResources(dt);
    updateLaser(dt);
    updateMissiles(dt);
    updateTanks(dt);
    updateHelicopters(dt);
    updateEnemyMechs(dt);
    updatePowerups(dt);
    updateWaves(dt);
    updateHUD();

    // Render
    renderer.render(scene, camera);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init(existingScene, existingCamera, existingRenderer) {
    scene    = existingScene;
    camera   = existingCamera;
    renderer = existingRenderer;
    clock    = new THREE.Clock();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('contextmenu', onContextMenu);
    if (renderer && renderer.domElement) {
      renderer.domElement.addEventListener('click', onRendererClick);
    }
  }

  // ─── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    if (MODULE_ACTIVE) deactivateModule();
    activationKeys = {};
  }

  return { init: init, update: update, reset: reset };

}());
