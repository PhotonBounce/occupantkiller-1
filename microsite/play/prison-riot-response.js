window.PrisonRiotResponse = (function () {
  'use strict';

  // ── Module-level state ──────────────────────────────────────────────────────
  var scene, camera, renderer;
  var active = false;

  // Key-combo tracking
  var lastKey = '';
  var lastKeyTime = 0;

  // Player state
  var playerHP = 100;
  var playerYaw = 0;
  var playerPitch = 0;
  var moveForward = false, moveBack = false, moveLeft = false, moveRight = false;
  var pointerLocked = false;

  // Weapons / items
  var taserAmmo = 20;
  var tearGasCount = 3;
  var hasExtinguisher = false;
  var primaryCooldown = 0;
  var taserCooldown = 0;
  var tearGasCooldown = 0;

  // E-key hold for hostage rescue
  var eKeyDown = false;
  var eHoldTime = 0;
  var eTargetIndex = -1;

  // Game objects arrays
  var enemies = [];          // { mesh, hp, maxHp, isLeader, area, stunTimer, attackTimer, areaIndex }
  var hostages = [];         // { mesh, freed, freeTimer, freeing, guardHelper }
  var guardHelpers = [];     // { mesh, hp, attackTimer }
  var controlPoints = [];    // { mesh, name, secured, securingTime, light }
  var collectibles = [];     // { mesh, type, collected }
  var warden_keys = 0;
  var maxSecWingUnlocked = false;
  var allObjects = [];       // for cleanup

  // Win/lose flags
  var cellBlocksSecured = 0;
  var hostagesFreed = 0;
  var leadersDown = 0;
  var riotSpreadToControlRoom = false;
  var gameOver = false;
  var gameWon = false;

  // Area state
  var areas = [
    { name: 'Cell Block A', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: 1 },
    { name: 'Cell Block B', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: 2 },
    { name: 'Cell Block C', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
    { name: 'Cafeteria',    rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
    { name: 'Yard',         rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
    { name: 'Guard Station',rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
    { name: 'Infirmary',    rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
    { name: 'Max-Sec Wing', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 }
  ];

  // Fire / fog
  var fireLight = null;
  var fireDamageTimer = 0;

  // Tear gas AoE clouds
  var gasclouds = [];   // { mesh, timer, position }

  // Timer
  var elapsed = 0;

  // HUD
  var hud = null;

  // Textures / materials cache
  var matCache = {};

  // Area bounds for proximity checks (set during init)
  var areaBounds = [];

  // Control room flag position
  var controlRoomPos = null;

  // ── Utility ─────────────────────────────────────────────────────────────────

  function getMat(hex, wire) {
    var key = hex + (wire ? '_w' : '');
    if (!matCache[key]) {
      matCache[key] = new THREE.MeshLambertMaterial({ color: hex, wireframe: !!wire });
    }
    return matCache[key];
  }

  function addToScene(obj) {
    scene.add(obj);
    allObjects.push(obj);
    return obj;
  }

  function makeMesh(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return addToScene(m);
  }

  function dist2(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function dist3(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // ── Build Environment ───────────────────────────────────────────────────────

  function buildEnvironment() {
    // Ground
    makeMesh(new THREE.BoxGeometry(200, 1, 200), getMat(0x445544), 0, -0.5, 0);

    // Ambient light
    var ambient = new THREE.AmbientLight(0x888888);
    scene.add(ambient);
    allObjects.push(ambient);

    var sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(50, 80, 30);
    scene.add(sunLight);
    allObjects.push(sunLight);

    // ── Cell Block A  (x: -60..−20, z: -40..0) ──────────────────────────────
    var cbA = makeMesh(new THREE.BoxGeometry(40, 8, 40), getMat(0x556655), -40, 4, -20);
    cbA._areaIndex = 0;
    buildCellBars(-40, 4, -20, 40, 40, 8);
    areaBounds.push({ x: -60, z: -40, w: 40, d: 40, index: 0 });

    // ── Cell Block B  (x: -10..30, z: -40..0) ───────────────────────────────
    var cbB = makeMesh(new THREE.BoxGeometry(40, 8, 40), getMat(0x556655), 10, 4, -20);
    cbB._areaIndex = 1;
    buildCellBars(10, 4, -20, 40, 40, 8);
    areaBounds.push({ x: -10, z: -40, w: 40, d: 40, index: 1 });

    // ── Cell Block C  (x: 40..80, z: -40..0) ────────────────────────────────
    var cbC = makeMesh(new THREE.BoxGeometry(40, 8, 40), getMat(0x556655), 60, 4, -20);
    cbC._areaIndex = 2;
    buildCellBars(60, 4, -20, 40, 40, 8);
    areaBounds.push({ x: 40, z: -40, w: 40, d: 40, index: 2 });

    // ── Guard Station  (x: -20..0, z: -70..−40) ─────────────────────────────
    makeMesh(new THREE.BoxGeometry(20, 8, 30), getMat(0x445566), -10, 4, -55);
    areaBounds.push({ x: -20, z: -70, w: 20, d: 30, index: 5 });
    controlRoomPos = new THREE.Vector3(-10, 0, -55);

    // ── Cafeteria  (x: -60..−20, z: 10..60) ─────────────────────────────────
    makeMesh(new THREE.BoxGeometry(40, 8, 50), getMat(0x667744), -40, 4, 35);
    areaBounds.push({ x: -60, z: 10, w: 40, d: 50, index: 3 });

    // Fire hazard in cafeteria
    fireLight = new THREE.PointLight(0xFF4400, 3, 30);
    fireLight.position.set(-40, 4, 35);
    scene.add(fireLight);
    allObjects.push(fireLight);

    // ── Yard  (x: 10..80, z: 10..70) ────────────────────────────────────────
    makeMesh(new THREE.BoxGeometry(70, 0.5, 60), getMat(0x667755), 45, 0.25, 40);
    areaBounds.push({ x: 10, z: 10, w: 70, d: 60, index: 4 });

    // Yard perimeter walls (LineSegments)
    buildYardWalls(45, 0, 40, 70, 60);

    // ── Infirmary  (x: 40..80, z: -70..−40) ─────────────────────────────────
    makeMesh(new THREE.BoxGeometry(40, 8, 30), getMat(0x557766), 60, 4, -55);
    areaBounds.push({ x: 40, z: -70, w: 40, d: 30, index: 6 });

    // ── Max-Sec Wing  (x: 90..130, z: -70..−10) — initially locked ──────────
    makeMesh(new THREE.BoxGeometry(40, 8, 60), getMat(0x443333), 110, 4, -40);
    areaBounds.push({ x: 90, z: -70, w: 40, d: 60, index: 7 });

    // ── Control points ───────────────────────────────────────────────────────
    buildControlPoints();
  }

  function buildCellBars(cx, cy, cz, w, d, h) {
    var barGeo = new THREE.BufferGeometry();
    var verts = [];
    var step = 4;
    var hw = w / 2, hd = d / 2;
    var i, xp, zp;
    for (i = -hw; i <= hw; i += step) {
      xp = cx + i;
      verts.push(xp, cy - h / 2, cz - hd,  xp, cy + h / 2, cz - hd);
      verts.push(xp, cy - h / 2, cz + hd,  xp, cy + h / 2, cz + hd);
    }
    for (i = -hd; i <= hd; i += step) {
      zp = cz + i;
      verts.push(cx - hw, cy - h / 2, zp,  cx - hw, cy + h / 2, zp);
      verts.push(cx + hw, cy - h / 2, zp,  cx + hw, cy + h / 2, zp);
    }
    barGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var bars = new THREE.LineSegments(barGeo, new THREE.LineBasicMaterial({ color: 0x888888 }));
    scene.add(bars);
    allObjects.push(bars);
  }

  function buildYardWalls(cx, cy, cz, w, d) {
    var geo = new THREE.BufferGeometry();
    var hw = w / 2, hd = d / 2, top = 6;
    var verts = [
      cx - hw, cy, cz - hd,  cx + hw, cy, cz - hd,
      cx + hw, cy, cz - hd,  cx + hw, cy, cz + hd,
      cx + hw, cy, cz + hd,  cx - hw, cy, cz + hd,
      cx - hw, cy, cz + hd,  cx - hw, cy, cz - hd,
      cx - hw, cy + top, cz - hd,  cx + hw, cy + top, cz - hd,
      cx + hw, cy + top, cz - hd,  cx + hw, cy + top, cz + hd,
      cx + hw, cy + top, cz + hd,  cx - hw, cy + top, cz + hd,
      cx - hw, cy + top, cz + hd,  cx - hw, cy + top, cz - hd,
      cx - hw, cy, cz - hd,  cx - hw, cy + top, cz - hd,
      cx + hw, cy, cz - hd,  cx + hw, cy + top, cz - hd,
      cx + hw, cy, cz + hd,  cx + hw, cy + top, cz + hd,
      cx - hw, cy, cz + hd,  cx - hw, cy + top, cz + hd
    ];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x889966 }));
    scene.add(ls);
    allObjects.push(ls);
  }

  function buildControlPoints() {
    // Radio tower in yard
    var rtGeo = new THREE.CylinderGeometry(0.3, 0.5, 10, 6);
    var rt = makeMesh(rtGeo, getMat(0xaaaaaa), 45, 5, 40);
    controlPoints.push({ mesh: rt, name: 'Radio Tower', secured: false, securingTime: 0, pos: new THREE.Vector3(45, 0, 40) });

    // Medical station in infirmary
    var msGeo = new THREE.BoxGeometry(3, 2, 3);
    var ms = makeMesh(msGeo, getMat(0xffffff), 55, 1, -50);
    controlPoints.push({ mesh: ms, name: 'Medical Station', secured: false, securingTime: 0, pos: new THREE.Vector3(55, 0, -50) });

    // Armory (near guard station)
    var arGeo = new THREE.BoxGeometry(4, 3, 4);
    var ar = makeMesh(arGeo, getMat(0x334455), -5, 1.5, -60);
    controlPoints.push({ mesh: ar, name: 'Armory', secured: false, securingTime: 0, pos: new THREE.Vector3(-5, 0, -60) });
  }

  // ── Build Enemies ───────────────────────────────────────────────────────────

  function buildEnemies() {
    var i, x, z, areaIdx;
    // 30 rioting prisoners spread across cell blocks and cafeteria/yard
    var spawnZones = [
      { x: -40, z: -20, a: 0 },
      { x: 10,  z: -20, a: 1 },
      { x: 60,  z: -20, a: 2 },
      { x: -40, z: 35,  a: 3 },
      { x: 45,  z: 40,  a: 4 }
    ];
    for (i = 0; i < 30; i++) {
      var zone = spawnZones[i % spawnZones.length];
      x = zone.x + (Math.random() - 0.5) * 20;
      z = zone.z + (Math.random() - 0.5) * 20;
      areaIdx = zone.a;
      spawnPrisoner(x, z, areaIdx);
    }

    // 5 riot leaders, one per area
    var leaderPositions = [
      { x: -40, z: -15, a: 0 },
      { x: 10,  z: -15, a: 1 },
      { x: 60,  z: -15, a: 2 },
      { x: -30, z: 50,  a: 3 },
      { x: 50,  z: 60,  a: 4 }
    ];
    for (i = 0; i < 5; i++) {
      var lp = leaderPositions[i];
      spawnLeader(lp.x, lp.z, lp.a, i);
    }
  }

  function spawnPrisoner(x, z, areaIndex) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = getMat(0x554433);
    var m = makeMesh(geo, mat, x, 0.9, z);
    var e = { mesh: m, hp: 60, maxHp: 60, isLeader: false, area: areaIndex, stunTimer: 0, attackTimer: 0, areaIndex: areaIndex };
    enemies.push(e);
    areas[areaIndex].rioterCount++;
    return e;
  }

  function spawnLeader(x, z, areaIndex, leaderNum) {
    var geo = new THREE.BoxGeometry(1.1, 2.0, 1.1);
    var mat = getMat(0x443322);
    var m = makeMesh(geo, mat, x, 1.0, z);
    var e = { mesh: m, hp: 180, maxHp: 180, isLeader: true, area: areaIndex, stunTimer: 0, attackTimer: 0, areaIndex: areaIndex, keysDropped: false, leaderNum: leaderNum };
    enemies.push(e);
    // Leader has a guard hostage nearby
    spawnHostage(x + 3, z + 2, leaderNum);
    return e;
  }

  // ── Build Hostages ──────────────────────────────────────────────────────────

  function spawnHostage(x, z, idx) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = getMat(0x334455);
    var m = makeMesh(geo, mat, x, 0.9, z);
    hostages.push({ mesh: m, freed: false, freeTimer: 0, freeing: false, guardHelperActive: false });
  }

  // ── Build Collectibles ──────────────────────────────────────────────────────

  function buildCollectibles() {
    // Fire extinguisher in cafeteria
    var geo = new THREE.CylinderGeometry(0.2, 0.25, 1.2, 8);
    var m = makeMesh(geo, getMat(0xff2222), -50, 0.6, 30);
    collectibles.push({ mesh: m, type: 'extinguisher', collected: false });

    // Tear gas stockpile in max-sec wing (only accessible after warden keys)
    var tgGeo = new THREE.SphereGeometry(0.4, 6, 6);
    var tgm = makeMesh(tgGeo, getMat(0x88cc88), 110, 0.4, -40);
    collectibles.push({ mesh: tgm, type: 'teargas_stockpile', collected: false });
  }

  // ── Build HUD ───────────────────────────────────────────────────────────────

  function buildHUD() {
    if (hud) { return; }
    hud = document.createElement('div');
    hud.id = 'prison-riot-hud';
    hud.style.cssText = [
      'position:absolute',
      'top:10px',
      'left:10px',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:13px',
      'background:rgba(0,0,0,0.65)',
      'padding:8px 12px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'line-height:1.6',
      'min-width:340px'
    ].join(';');
    hud.innerHTML = 'PRISON RIOT | ACTIVATING...';
    document.body.appendChild(hud);
  }

  function updateHUD() {
    if (!hud) { return; }
    var mins = Math.floor(elapsed / 60);
    var secs = Math.floor(elapsed % 60);
    var secStr = (secs < 10 ? '0' : '') + secs;
    var minStr = (mins < 10 ? '0' : '') + mins;

    var areaStatus = getAreaStatus();
    var rioterCount = countAliveRioters();
    var spread = getSpreadWarning();

    hud.innerHTML = [
      'PRISON RIOT | CELL BLOCKS SECURED: ' + cellBlocksSecured + '/3 | HOSTAGES: ' + hostagesFreed + '/4 FREED | LEADERS: ' + leadersDown + '/5 DOWN',
      'AREA STATUS: ' + areaStatus + (spread ? ' | ⚠ ' + spread : ''),
      'TIMER: ' + minStr + ':' + secStr + ' | RIOTERS: ' + rioterCount + ' | HP: ' + Math.max(0, Math.floor(playerHP)),
      'TASER: ' + taserAmmo + '/20 | TEAR GAS: ' + tearGasCount + ' | EXTINGUISHER: ' + (hasExtinguisher ? 'HELD' : 'NO') + ' | KEYS: ' + warden_keys,
      (gameOver ? '<span style="color:#ff4444">GAME OVER - RIOT LOST</span>' : '') +
      (gameWon  ? '<span style="color:#44ff44">VICTORY - ORDER RESTORED</span>' : '')
    ].join('<br>');
  }

  function getAreaStatus() {
    var parts = [];
    var i;
    for (i = 0; i < 3; i++) {
      if (areas[i].breached) { parts.push(areas[i].name + ':BREACHED'); }
      else { parts.push(areas[i].name + ':ACTIVE'); }
    }
    return parts.join(' ');
  }

  function getSpreadWarning() {
    var i, a;
    for (i = 0; i < areas.length; i++) {
      a = areas[i];
      if (a.rioterCount >= 5 && !a.breached && a.spreadTimer > 0) {
        var rem = Math.ceil(90 - a.spreadTimer);
        if (rem <= 30) { return a.name + ' BREACHING IN ' + rem + 's'; }
      }
    }
    return '';
  }

  function countAliveRioters() {
    var n = 0, i;
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].hp > 0) { n++; }
    }
    return n;
  }

  // ── Input Handlers ──────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var now = Date.now();
    var k = e.key;

    // Activation combo: P then R within 400ms
    if (k === 'p' || k === 'P') {
      lastKey = 'P';
      lastKeyTime = now;
    } else if ((k === 'r' || k === 'R') && lastKey === 'P' && (now - lastKeyTime) < 400) {
      if (!active) {
        active = true;
        buildHUD();
      }
      lastKey = '';
      return;
    } else {
      lastKey = k;
      lastKeyTime = now;
    }

    if (!active) { return; }

    if (k === 'w' || k === 'W' || k === 'ArrowUp')    { moveForward = true; }
    if (k === 's' || k === 'S' || k === 'ArrowDown')  { moveBack = true; }
    if (k === 'a' || k === 'A' || k === 'ArrowLeft')  { moveLeft = true; }
    if (k === 'd' || k === 'D' || k === 'ArrowRight') { moveRight = true; }
    if (k === 'e' || k === 'E') { eKeyDown = true; }
    if ((k === 't' || k === 'T') && !gameOver && !gameWon) { fireTaser(); }
    if ((k === 'g' || k === 'G') && !gameOver && !gameWon) { throwTearGas(); }
  }

  function onKeyUp(e) {
    var k = e.key;
    if (k === 'w' || k === 'W' || k === 'ArrowUp')    { moveForward = false; }
    if (k === 's' || k === 'S' || k === 'ArrowDown')  { moveBack = false; }
    if (k === 'a' || k === 'A' || k === 'ArrowLeft')  { moveLeft = false; }
    if (k === 'd' || k === 'D' || k === 'ArrowRight') { moveRight = false; }
    if (k === 'e' || k === 'E') { eKeyDown = false; eHoldTime = 0; eTargetIndex = -1; }
  }

  function onMouseMove(e) {
    if (!active || !pointerLocked || gameOver || gameWon) { return; }
    var sens = 0.002;
    playerYaw   -= e.movementX * sens;
    playerPitch -= e.movementY * sens;
    playerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, playerPitch));
  }

  function onMouseDown(e) {
    if (!active || gameOver || gameWon) { return; }
    if (e.button === 0) {
      // Request pointer lock on first click
      if (!pointerLocked && renderer && renderer.domElement) {
        renderer.domElement.requestPointerLock();
      }
      firePrimary();
    }
  }

  function onPointerLockChange() {
    pointerLocked = (document.pointerLockElement === (renderer && renderer.domElement));
  }

  // ── Weapons ─────────────────────────────────────────────────────────────────

  function firePrimary() {
    if (primaryCooldown > 0) { return; }
    primaryCooldown = 0.5;
    // Raycast from camera forward
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    var origin = camera.position.clone();
    var best = null, bestDist = 30, i, e, d, ep;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.hp <= 0) { continue; }
      ep = e.mesh.position;
      // Simple cone check
      var toEnemy = ep.clone().sub(origin);
      d = toEnemy.length();
      if (d < 2 || d > 30) { continue; }
      toEnemy.normalize();
      var dot = dir.dot(toEnemy);
      if (dot > 0.92) {
        if (d < bestDist) { bestDist = d; best = e; }
      }
    }
    if (best) {
      best.hp -= 25;
      if (best.hp <= 0) { killEnemy(best); }
    }
  }

  function fireTaser() {
    if (taserAmmo <= 0 || taserCooldown > 0) { return; }
    taserAmmo--;
    taserCooldown = 1.5;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    var origin = camera.position.clone();
    var i, e, ep, toEnemy, d, dot;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.hp <= 0) { continue; }
      ep = e.mesh.position;
      toEnemy = ep.clone().sub(origin);
      d = toEnemy.length();
      if (d > 15) { continue; }
      toEnemy.normalize();
      dot = dir.dot(toEnemy);
      if (dot > 0.9) {
        e.stunTimer = 5;
        break;
      }
    }
  }

  function throwTearGas() {
    if (tearGasCount <= 0 || tearGasCooldown > 0) { return; }
    tearGasCount--;
    tearGasCooldown = 2;
    // Throw forward 10 units
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(camera.quaternion);
    var gPos = camera.position.clone().add(dir.multiplyScalar(10));
    gPos.y = 0;
    var gGeo = new THREE.SphereGeometry(5, 8, 8);
    var gMat = new THREE.MeshLambertMaterial({ color: 0x88cc88, transparent: true, opacity: 0.4 });
    var gMesh = new THREE.Mesh(gGeo, gMat);
    gMesh.position.copy(gPos);
    gMesh.position.y = 2.5;
    scene.add(gMesh);
    allObjects.push(gMesh);
    gasclouds.push({ mesh: gMesh, timer: 10, position: gPos.clone() });
    // Stun all enemies in radius immediately
    var i, e;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.hp <= 0) { continue; }
      if (dist2(e.mesh.position, gPos) < 8) {
        e.stunTimer = 10;
      }
    }
  }

  function killEnemy(e) {
    e.hp = 0;
    e.mesh.visible = false;
    areas[e.areaIndex].rioterCount = Math.max(0, areas[e.areaIndex].rioterCount - 1);
    if (e.isLeader) {
      leadersDown++;
      warden_keys++;
      if (!maxSecWingUnlocked && warden_keys >= 1) {
        maxSecWingUnlocked = true;
      }
    }
  }

  // ── Guard Helpers (freed hostages) ──────────────────────────────────────────

  function spawnGuardHelper(pos) {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = getMat(0x5577aa);
    var m = new THREE.Mesh(geo, mat);
    m.position.copy(pos);
    m.position.y = 0.9;
    scene.add(m);
    allObjects.push(m);
    guardHelpers.push({ mesh: m, hp: 40, attackTimer: 0 });
  }

  // ── Riot Spread / Area Logic ─────────────────────────────────────────────────

  function getPlayerAreaIndex() {
    var px = camera.position.x, pz = camera.position.z;
    var i, b;
    for (i = 0; i < areaBounds.length; i++) {
      b = areaBounds[i];
      if (px >= b.x && px <= b.x + b.w && pz >= b.z && pz <= b.z + b.d) {
        return b.index;
      }
    }
    return -1;
  }

  function getEnemyAreaIndex(pos) {
    var i, b;
    for (i = 0; i < areaBounds.length; i++) {
      b = areaBounds[i];
      if (pos.x >= b.x && pos.x <= b.x + b.w && pos.z >= b.z && pos.z <= b.z + b.d) {
        return b.index;
      }
    }
    return -1;
  }

  function updateAreaRioterCounts() {
    var i, idx;
    for (i = 0; i < areas.length; i++) { areas[i].rioterCount = 0; }
    for (i = 0; i < enemies.length; i++) {
      if (enemies[i].hp <= 0) { continue; }
      idx = getEnemyAreaIndex(enemies[i].mesh.position);
      if (idx >= 0) { areas[idx].rioterCount++; }
      enemies[i].areaIndex = (idx >= 0) ? idx : enemies[i].areaIndex;
    }
  }

  function checkCellBlockSecured() {
    var secured = 0, i, e, anyAlive;
    for (i = 0; i < 3; i++) {
      anyAlive = false;
      var j;
      for (j = 0; j < enemies.length; j++) {
        e = enemies[j];
        if (e.hp > 0 && e.areaIndex === i) { anyAlive = true; break; }
      }
      if (!anyAlive) { secured++; }
    }
    cellBlocksSecured = secured;
  }

  // ── Control Points ───────────────────────────────────────────────────────────

  function updateControlPoints(delta) {
    var i, cp, d;
    for (i = 0; i < controlPoints.length; i++) {
      cp = controlPoints[i];
      if (cp.secured) { continue; }
      d = dist2(camera.position, cp.pos);
      if (d < 5) {
        cp.securingTime += delta;
        if (cp.securingTime >= 3) {
          cp.secured = true;
          cp.mesh.material = getMat(0x44ff44);
        }
      } else {
        cp.securingTime = Math.max(0, cp.securingTime - delta * 0.5);
      }
    }
  }

  // ── Hostage Rescue ───────────────────────────────────────────────────────────

  function updateHostages(delta) {
    var i, h, d;
    for (i = 0; i < hostages.length; i++) {
      h = hostages[i];
      if (h.freed) { continue; }
      d = dist2(camera.position, h.mesh.position);
      if (d < 3 && eKeyDown) {
        h.freeing = true;
        h.freeTimer += delta;
        if (h.freeTimer >= 3) {
          h.freed = true;
          h.freeing = false;
          hostagesFreed++;
          spawnGuardHelper(h.mesh.position.clone());
          h.mesh.visible = false;
        }
      } else {
        h.freeing = false;
        h.freeTimer = Math.max(0, h.freeTimer - delta);
      }
    }
  }

  // ── Collectibles ─────────────────────────────────────────────────────────────

  function updateCollectibles() {
    var i, c, d;
    for (i = 0; i < collectibles.length; i++) {
      c = collectibles[i];
      if (c.collected) { continue; }
      if (c.type === 'teargas_stockpile' && !maxSecWingUnlocked) { continue; }
      d = dist3(camera.position, c.mesh.position);
      if (d < 3) {
        c.collected = true;
        c.mesh.visible = false;
        if (c.type === 'extinguisher') { hasExtinguisher = true; }
        if (c.type === 'teargas_stockpile') { tearGasCount += 6; }
      }
    }
  }

  // ── Fire Damage ──────────────────────────────────────────────────────────────

  function updateFire(delta) {
    if (hasExtinguisher) { return; }
    var px = camera.position.x, pz = camera.position.z;
    // Cafeteria bounds: x: -60..-20, z: 10..60 but fire epicenter at -40,35
    var inCafe = (px >= -60 && px <= -20 && pz >= 10 && pz <= 60);
    if (inCafe) {
      fireDamageTimer += delta;
      if (fireDamageTimer >= 0.5) {
        playerHP -= 2 * fireDamageTimer; // ~2HP/s
        fireDamageTimer = 0;
      }
    } else {
      fireDamageTimer = 0;
    }
    // Flicker fire light
    if (fireLight) {
      fireLight.intensity = 2.5 + Math.sin(Date.now() * 0.01) * 1.5;
    }
  }

  // ── Enemy AI ─────────────────────────────────────────────────────────────────

  function updateEnemies(delta) {
    var i, e, ep, cp, dx, dz, d, speed, nx, nz;
    for (i = 0; i < enemies.length; i++) {
      e = enemies[i];
      if (e.hp <= 0) { continue; }

      // Stun
      if (e.stunTimer > 0) {
        e.stunTimer -= delta;
        continue;
      }

      ep = e.mesh.position;
      cp = camera.position;
      dx = cp.x - ep.x;
      dz = cp.z - ep.z;
      d = Math.sqrt(dx * dx + dz * dz);

      // Move toward player
      if (d > 2) {
        speed = e.isLeader ? 2.5 : 2.0;
        nx = dx / d * speed * delta;
        nz = dz / d * speed * delta;
        ep.x += nx;
        ep.z += nz;
        e.mesh.rotation.y = Math.atan2(dx, dz);
      }

      // Attack player
      if (d < 2.5) {
        e.attackTimer -= delta;
        if (e.attackTimer <= 0) {
          var dmg = e.isLeader ? 15 : 8;
          playerHP -= dmg;
          e.attackTimer = e.isLeader ? 1.2 : 1.8;
        }
      }
    }

    // Guard helpers attack nearby enemies
    var j, gh, gep, ged;
    for (j = 0; j < guardHelpers.length; j++) {
      gh = guardHelpers[j];
      if (gh.hp <= 0) { continue; }
      gh.attackTimer -= delta;
      if (gh.attackTimer <= 0) {
        // Find nearest enemy
        var nearEnemy = null, nearDist = 8;
        for (i = 0; i < enemies.length; i++) {
          e = enemies[i];
          if (e.hp <= 0) { continue; }
          gep = gh.mesh.position;
          ged = dist2(gep, e.mesh.position);
          if (ged < nearDist) { nearDist = ged; nearEnemy = e; }
        }
        if (nearEnemy) {
          nearEnemy.hp -= 10;
          if (nearEnemy.hp <= 0) { killEnemy(nearEnemy); }
        }
        gh.attackTimer = 2;
      }
      // Guard helpers take damage if near enemies
      for (i = 0; i < enemies.length; i++) {
        e = enemies[i];
        if (e.hp <= 0) { continue; }
        if (dist2(gh.mesh.position, e.mesh.position) < 2.5) {
          gh.hp -= 5 * delta;
          if (gh.hp <= 0) { gh.mesh.visible = false; }
        }
      }
    }
  }

  // ── Riot Spread ───────────────────────────────────────────────────────────────

  function updateRiotSpread(delta) {
    var i, a, nextA, j;
    for (i = 0; i < areas.length; i++) {
      a = areas[i];
      if (a.breached) { continue; }
      if (a.rioterCount >= 5) {
        a.spreadTimer += delta;
        if (a.spreadTimer >= 90) {
          a.breached = true;
          a.spreadTimer = 0;
          // Escalate: spawn more rioters or spread to control room
          if (i < 3 && a.nextArea >= 0) {
            // Spread within cell blocks → eventually to control room
            var numNew = 3;
            for (j = 0; j < numNew; j++) {
              spawnPrisoner(
                areaBounds[a.nextArea].x + areaBounds[a.nextArea].w / 2 + (Math.random() - 0.5) * 10,
                areaBounds[a.nextArea].z + areaBounds[a.nextArea].d / 2 + (Math.random() - 0.5) * 10,
                a.nextArea
              );
            }
          }
          // If cell block C breaches with no next area → riot spreads to control room
          if (i === 2) {
            riotSpreadToControlRoom = true;
          }
        }
      } else {
        a.spreadTimer = Math.max(0, a.spreadTimer - delta * 0.3);
      }
    }
  }

  // ── Gas Cloud Updates ─────────────────────────────────────────────────────────

  function updateGasClouds(delta) {
    var i, gc;
    for (i = gasclouds.length - 1; i >= 0; i--) {
      gc = gasclouds[i];
      gc.timer -= delta;
      if (gc.timer <= 0) {
        scene.remove(gc.mesh);
        gascloud_removeFromAllObjects(gc.mesh);
        gasclouds.splice(i, 1);
      }
    }
  }

  function gascloud_removeFromAllObjects(mesh) {
    var idx = allObjects.indexOf(mesh);
    if (idx >= 0) { allObjects.splice(idx, 1); }
  }

  // ── Win / Lose ────────────────────────────────────────────────────────────────

  function checkWinLose() {
    if (gameOver || gameWon) { return; }
    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      return;
    }
    if (riotSpreadToControlRoom) {
      gameOver = true;
      return;
    }
    checkCellBlockSecured();
    if (cellBlocksSecured >= 3 && hostagesFreed >= 4 && leadersDown >= 5) {
      gameWon = true;
    }
  }

  // ── Player Movement ───────────────────────────────────────────────────────────

  function updatePlayer(delta) {
    var speed = 8;
    var forward = new THREE.Vector3(-Math.sin(playerYaw), 0, -Math.cos(playerYaw));
    var right   = new THREE.Vector3(Math.cos(playerYaw), 0, -Math.sin(playerYaw));
    var move    = new THREE.Vector3();

    if (moveForward) { move.add(forward); }
    if (moveBack)    { move.sub(forward); }
    if (moveRight)   { move.add(right); }
    if (moveLeft)    { move.sub(right); }

    if (move.length() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      camera.position.add(move);
    }

    // Keep player above ground
    camera.position.y = 1.7;

    // Apply camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;
  }

  // ── Cooldowns ────────────────────────────────────────────────────────────────

  function updateCooldowns(delta) {
    if (primaryCooldown > 0) { primaryCooldown -= delta; }
    if (taserCooldown > 0)   { taserCooldown -= delta; }
    if (tearGasCooldown > 0) { tearGasCooldown -= delta; }
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  function init(sc, cam, ren) {
    scene    = sc;
    camera   = cam;
    renderer = ren;

    // Reset state
    active                 = false;
    playerHP               = 100;
    playerYaw              = 0;
    playerPitch            = 0;
    moveForward = moveBack = moveLeft = moveRight = false;
    pointerLocked          = false;
    taserAmmo              = 20;
    tearGasCount           = 3;
    hasExtinguisher        = false;
    primaryCooldown        = 0;
    taserCooldown          = 0;
    tearGasCooldown        = 0;
    eKeyDown               = false;
    eHoldTime              = 0;
    eTargetIndex           = -1;
    enemies                = [];
    hostages               = [];
    guardHelpers           = [];
    controlPoints          = [];
    collectibles           = [];
    gasclouds              = [];
    warden_keys            = 0;
    maxSecWingUnlocked     = false;
    cellBlocksSecured      = 0;
    hostagesFreed          = 0;
    leadersDown            = 0;
    riotSpreadToControlRoom = false;
    gameOver               = false;
    gameWon                = false;
    elapsed                = 0;
    lastKey                = '';
    lastKeyTime            = 0;
    fireDamageTimer        = 0;
    matCache               = {};
    allObjects             = [];
    areaBounds             = [];
    fireLight              = null;
    controlRoomPos         = null;

    areas = [
      { name: 'Cell Block A', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: 1 },
      { name: 'Cell Block B', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: 2 },
      { name: 'Cell Block C', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
      { name: 'Cafeteria',    rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
      { name: 'Yard',         rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
      { name: 'Guard Station',rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
      { name: 'Infirmary',    rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 },
      { name: 'Max-Sec Wing', rioterCount: 0, spreadTimer: 0, breached: false, nextArea: -1 }
    ];

    // Position camera (player start — in front of guard station)
    camera.position.set(-10, 1.7, -45);

    // Build scene
    buildEnvironment();
    buildEnemies();
    buildCollectibles();

    // Fog
    scene.fog = new THREE.Fog(0x222222, 20, 120);
    scene.background = new THREE.Color(0x222222);

    // Listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('pointerlockchange', onPointerLockChange);
  }

  function update(delta) {
    if (!active) { return; }
    if (gameOver || gameWon) {
      updateHUD();
      return;
    }

    elapsed += delta;

    updatePlayer(delta);
    updateCooldowns(delta);
    updateAreaRioterCounts();
    updateEnemies(delta);
    updateRiotSpread(delta);
    updateFire(delta);
    updateHostages(delta);
    updateControlPoints(delta);
    updateCollectibles();
    updateGasClouds(delta);
    checkWinLose();
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    var i;
    for (i = 0; i < allObjects.length; i++) {
      if (scene && allObjects[i]) { scene.remove(allObjects[i]); }
    }
    allObjects = [];
    enemies    = [];
    hostages   = [];
    guardHelpers = [];
    controlPoints = [];
    collectibles = [];
    gasclouds = [];

    // Remove HUD
    if (hud && hud.parentNode) {
      hud.parentNode.removeChild(hud);
    }
    hud = null;

    // Remove listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('pointerlockchange', onPointerLockChange);

    // Exit pointer lock
    if (document.exitPointerLock) { document.exitPointerLock(); }

    // Reset flags
    active      = false;
    gameOver    = false;
    gameWon     = false;
    fireLight   = null;

    // Clear fog / background
    if (scene) {
      scene.fog        = null;
      scene.background = null;
    }
  }

  return { init: init, update: update, reset: reset };

})();
