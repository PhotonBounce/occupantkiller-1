window.SkyscraperSiege = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // --- State ---
  var active = false;
  var scene, camera, renderer, clock;
  var keys = {};
  var keyTimestamps = {};
  var playerHP = 100;
  var currentFloor = 1;
  var hostagesFreed = 0;
  var ceoAlive = true;
  var gameOver = false;
  var gameWon = false;
  var terroristCount = 25;
  var startTime = 0;
  var elapsedTime = 0;
  var hudEl = null;

  // Geometry containers
  var skyscraperGroup = null;
  var floors = [];
  var terrorists = [];
  var hostages = [];
  var elevators = [];
  var stairwells = [];
  var droppedReinforcements = false;

  // Player
  var playerPos = { x: 0, y: 2, z: 0 };
  var playerVel = { x: 0, y: 0, z: 0 };
  var playerYaw = 0;
  var playerPitch = 0;
  var onGround = true;
  var isRappeling = false;
  var rappelFloor = 0;
  var rappelTimer = 0;

  // Elevator state
  var elevatorActive = false;
  var elevatorFloor = 1;
  var elevatorTarget = 1;
  var elevatorTimer = 0;
  var elevatorTravel = 8;
  var elevatorCabin = null;
  var nearElevator = false;

  // Hostage interaction
  var holdingE = false;
  var holdETimer = 0;
  var nearHostage = null;

  // CEO
  var ceoMesh = null;
  var ceoHP = 400;
  var ceoArmorHP = 100;
  var ceoArmorBroken = false;
  var ceoDrone = null;
  var sniperMesh = null;
  var sniperAlive = true;

  // Alarm
  var alarmActive = false;
  var alarmTimer = 0;

  // Rappel
  var nearWindow = false;

  // Floor Y positions (floor number -> Y)
  var FLOOR_Y = {
    1: 2,
    5: 14,
    10: 29,
    15: 44,
    20: 59,
    25: 74,
    30: 89
  };

  // Refs for meshes
  var terroristMeshes = [];
  var hostageObjects = [];
  var bulletParticles = [];

  // Shooting
  var shootCooldown = 0;
  var SHOOT_INTERVAL = 0.25;

  // Mouse look
  var mouseDX = 0;
  var mouseDY = 0;

  // ---- Helpers ----

  function floorYFromIndex(n) {
    // linear interpolation: floor 1 = y2, floor 30 = y89
    return 2 + (n - 1) * 3;
  }

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return pad2(m) + ':' + pad2(s);
  }

  function makeBox(w, h, d, color, opacity, transparent) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({
      color: color,
      opacity: opacity !== undefined ? opacity : 1,
      transparent: !!transparent
    });
    return new THREE.Mesh(geo, mat);
  }

  function makeCylinder(rt, rb, h, segs, color) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeSphere(r, color) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeCone(r, h, color) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function makeLineSegments(points, color) {
    var geo = new THREE.BufferGeometry();
    var verts = [];
    for (var i = 0; i < points.length; i++) {
      verts.push(points[i].x, points[i].y, points[i].z);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    var mat = new THREE.LineBasicMaterial({ color: color });
    return new THREE.LineSegments(geo, mat);
  }

  // ---- Building ----

  function buildSkyscraper() {
    skyscraperGroup = new THREE.Group();

    // Core building box
    var core = makeBox(20, 90, 20, 0x112233);
    core.position.set(0, 45, 0);
    skyscraperGroup.add(core);

    // Glass panels — front face rows of windows
    var panelPositions = [];
    for (var fl = 0; fl < 30; fl++) {
      var py = 3 + fl * 3;
      // front face windows
      for (var wx = -2; wx <= 2; wx++) {
        var panel = makeBox(3, 2, 0.15, 0x224466, 0.4, true);
        panel.position.set(wx * 4, py, 10.1);
        skyscraperGroup.add(panel);
      }
      // back face
      for (var wx2 = -2; wx2 <= 2; wx2++) {
        var panel2 = makeBox(3, 2, 0.15, 0x224466, 0.4, true);
        panel2.position.set(wx2 * 4, py, -10.1);
        skyscraperGroup.add(panel2);
      }
      // side faces
      for (var wz = -2; wz <= 2; wz++) {
        var panel3 = makeBox(0.15, 2, 3, 0x224466, 0.4, true);
        panel3.position.set(10.1, py, wz * 4);
        skyscraperGroup.add(panel3);
        var panel4 = makeBox(0.15, 2, 3, 0x224466, 0.4, true);
        panel4.position.set(-10.1, py, wz * 4);
        skyscraperGroup.add(panel4);
      }
    }

    // Window reflection LineSegments (grid lines on front face)
    var reflPts = [];
    for (var row = 0; row < 30; row++) {
      var ry = 2 + row * 3;
      reflPts.push({ x: -9, y: ry, z: 10.2 });
      reflPts.push({ x: 9, y: ry, z: 10.2 });
    }
    for (var col = -9; col <= 9; col += 4) {
      reflPts.push({ x: col, y: 2, z: 10.2 });
      reflPts.push({ x: col, y: 92, z: 10.2 });
    }
    var reflLines = makeLineSegments(reflPts, 0x99ccff);
    skyscraperGroup.add(reflLines);

    scene.add(skyscraperGroup);
  }

  function buildFloors() {
    // Key floors
    var floorDefs = [
      { n: 1, name: 'Lobby', color: 0x334455 },
      { n: 5, name: 'Security', color: 0x445566 },
      { n: 10, name: 'Server Room', color: 0x112244 },
      { n: 15, name: 'Mid Floor', color: 0x334455 },
      { n: 20, name: 'Executive Suite', color: 0x443322 },
      { n: 25, name: 'Penthouse Bar', color: 0x223344 },
      { n: 30, name: 'Rooftop Helipad', color: 0x333333 }
    ];

    for (var i = 0; i < floorDefs.length; i++) {
      var fd = floorDefs[i];
      var fy = floorYFromIndex(fd.n) - 1.5;
      var floorMesh = makeBox(18, 0.5, 18, fd.color);
      floorMesh.position.set(0, fy, 0);
      floorMesh.userData = { floorNum: fd.n, name: fd.name };
      scene.add(floorMesh);
      floors.push(floorMesh);

      // Ceiling
      var ceilMesh = makeBox(18, 0.3, 18, 0x222233);
      ceilMesh.position.set(0, fy + 3, 0);
      scene.add(ceilMesh);

      // Furniture per floor
      buildFloorFurniture(fd.n, fy);
    }

    // Helipad markings (LineSegments H)
    var helY = floorYFromIndex(30) + 0.5;
    var hPts = [
      { x: -3, y: helY, z: 0 }, { x: 3, y: helY, z: 0 },
      { x: 0, y: helY, z: -3 }, { x: 0, y: helY, z: 3 },
      { x: -3, y: helY, z: -3 }, { x: -3, y: helY, z: 3 },
      { x: 3, y: helY, z: -3 }, { x: 3, y: helY, z: 3 }
    ];
    var heliLines = makeLineSegments(hPts, 0xffff00);
    scene.add(heliLines);
  }

  function buildFloorFurniture(floorNum, fy) {
    // Lobby: reception desk, pillars
    if (floorNum === 1) {
      var desk = makeBox(4, 1, 1.5, 0x8B7355);
      desk.position.set(0, fy + 0.75, -3);
      scene.add(desk);
      var pil1 = makeCylinder(0.3, 0.3, 2.5, 8, 0x667788);
      pil1.position.set(-6, fy + 1.25, -6);
      scene.add(pil1);
      var pil2 = makeCylinder(0.3, 0.3, 2.5, 8, 0x667788);
      pil2.position.set(6, fy + 1.25, -6);
      scene.add(pil2);
    }
    // Security floor
    if (floorNum === 5) {
      var rack = makeBox(1, 2, 3, 0x445566);
      rack.position.set(-4, fy + 1, 0);
      scene.add(rack);
      var rack2 = makeBox(1, 2, 3, 0x445566);
      rack2.position.set(4, fy + 1, 0);
      scene.add(rack2);
    }
    // Server room
    if (floorNum === 10) {
      for (var s = -3; s <= 3; s += 2) {
        var srv = makeBox(0.8, 2, 3, 0x223344);
        srv.position.set(s, fy + 1, -2);
        scene.add(srv);
      }
    }
    // Executive suite
    if (floorNum === 20) {
      var table = makeBox(6, 0.2, 2, 0x664422);
      table.position.set(0, fy + 0.9, 0);
      scene.add(table);
      var chair = makeBox(0.8, 1, 0.8, 0x332211);
      chair.position.set(0, fy + 0.5, 2);
      scene.add(chair);
    }
    // Penthouse bar
    if (floorNum === 25) {
      var bar = makeBox(8, 1, 1, 0x553311);
      bar.position.set(0, fy + 0.5, -5);
      scene.add(bar);
      for (var bc = -3; bc <= 3; bc += 1.5) {
        var stool = makeCylinder(0.2, 0.2, 0.8, 6, 0x996633);
        stool.position.set(bc, fy + 0.4, -3.5);
        scene.add(stool);
      }
    }
  }

  function buildElevator() {
    // Elevator shaft cylinder
    var shaft = makeCylinder(0.8, 0.8, 92, 12, 0x334455);
    shaft.position.set(8, 46, 0);
    scene.add(shaft);

    // Elevator cabin
    elevatorCabin = makeBox(2, 2.5, 2, 0x556677);
    elevatorCabin.position.set(8, floorYFromIndex(1), 0);
    scene.add(elevatorCabin);
  }

  function buildStairwells() {
    // Ramps between each key floor
    var stairFloors = [1, 5, 10, 15, 20, 25, 30];
    for (var i = 0; i < stairFloors.length - 1; i++) {
      var f1 = stairFloors[i];
      var f2 = stairFloors[i + 1];
      var y1 = floorYFromIndex(f1);
      var y2 = floorYFromIndex(f2);
      var midY = (y1 + y2) / 2;
      var height = y2 - y1;
      var ramp = makeBox(1.5, height, 1.5, 0x445566);
      ramp.position.set(-8, midY, 0);
      ramp.userData = { isStair: true, fromFloor: f1, toFloor: f2 };
      scene.add(ramp);
      stairwells.push(ramp);
    }
  }

  function buildHostages() {
    var hostageFloors = [5, 10, 20, 25];
    var hostagePositions = [
      { x: 3, z: 4 },
      { x: -5, z: -5 },
      { x: 4, z: -3 },
      { x: -4, z: 5 }
    ];
    for (var i = 0; i < 4; i++) {
      var fn = hostageFloors[i];
      var fy = floorYFromIndex(fn);
      var hp = hostagePositions[i];
      var hm = makeBox(0.5, 1.5, 0.5, 0x886655);
      hm.position.set(hp.x, fy + 0.75, hp.z);
      hm.userData = { isHostage: true, freed: false, floorNum: fn, index: i };
      scene.add(hm);
      hostageObjects.push(hm);
    }
  }

  function buildTerrorists() {
    // Distribute 25 terrorists across floors
    var terroristFloorDist = [
      { floor: 1, count: 4 },
      { floor: 5, count: 4 },
      { floor: 10, count: 4 },
      { floor: 15, count: 4 },
      { floor: 20, count: 4 },
      { floor: 25, count: 5 },
      { floor: 30, count: 0 }  // CEO is separate
    ];
    var idx = 0;
    for (var gi = 0; gi < terroristFloorDist.length; gi++) {
      var td = terroristFloorDist[gi];
      var tfy = floorYFromIndex(td.floor);
      for (var j = 0; j < td.count; j++) {
        var tx = (Math.random() - 0.5) * 14;
        var tz = (Math.random() - 0.5) * 14;
        var tm = makeBox(0.5, 1.5, 0.5, 0x334433);
        tm.position.set(tx, tfy + 0.75, tz);
        // Head
        var tHead = makeSphere(0.3, 0x886644);
        tHead.position.set(tx, tfy + 1.8, tz);
        scene.add(tHead);
        tm.userData = {
          isTerrorist: true,
          hp: 100,
          alive: true,
          floorNum: td.floor,
          patrol: true,
          patrolDir: Math.random() * Math.PI * 2,
          patrolTimer: 0,
          headMesh: tHead,
          index: idx
        };
        scene.add(tm);
        terroristMeshes.push(tm);
        idx++;
      }
    }
  }

  function buildSniper() {
    // Sniper on floor 15
    var sfy = floorYFromIndex(15);
    sniperMesh = makeBox(0.5, 1.7, 0.5, 0x553333);
    sniperMesh.position.set(5, sfy + 0.85, -5);
    sniperMesh.userData = { isSniper: true, hp: 150, alive: true };
    scene.add(sniperMesh);
    terroristMeshes.push(sniperMesh);
    terroristCount++;
  }

  function buildCEO() {
    var cfy = floorYFromIndex(30);
    ceoMesh = makeBox(0.6, 1.8, 0.6, 0x223344);
    ceoMesh.position.set(0, cfy + 0.9, -3);
    ceoMesh.userData = { isCEO: true, hp: 400, alive: true };
    scene.add(ceoMesh);

    // CEO drone: small SphereGeometry
    ceoDrone = makeSphere(0.3, 0x445566);
    ceoDrone.position.set(3, cfy + 2.5, -3);
    ceoDrone.userData = { isDrone: true, alive: true };
    scene.add(ceoDrone);
  }

  function buildGround() {
    var ground = makeBox(200, 0.5, 200, 0x223322);
    ground.position.set(0, -0.25, 0);
    scene.add(ground);
  }

  function buildLighting() {
    var ambient = new THREE.AmbientLight(0x334455, 0.8);
    scene.add(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 80, 30);
    scene.add(dirLight);
    var pointFloor1 = new THREE.PointLight(0xffaa44, 1, 20);
    pointFloor1.position.set(0, 5, 0);
    scene.add(pointFloor1);
  }

  // ---- HUD ----

  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'skyscraper-siege-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:10px',
      'color:#00ff88',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.7)',
      'padding:8px 12px',
      'border:1px solid #00ff88',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:pre'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var ceoStatus = ceoAlive ? 'ALIVE' : 'ELIMINATED';
    var aliveCount = 0;
    for (var i = 0; i < terroristMeshes.length; i++) {
      if (terroristMeshes[i].userData.alive) aliveCount++;
    }
    hudEl.textContent = [
      'SKYSCRAPER SIEGE',
      '[FLOOR: ' + currentFloor + '/30]',
      '[HOSTAGES: ' + hostagesFreed + '/4]',
      '[CEO: ' + ceoStatus + ']',
      '[TIMER: ' + fmtTime(elapsedTime) + ']',
      '[TERRORISTS: ' + aliveCount + ']',
      '[HP: ' + playerHP + ']'
    ].join('  ');

    if (gameOver) {
      hudEl.textContent += '\n\n*** MISSION FAILED ***';
      hudEl.style.color = '#ff3333';
    }
    if (gameWon) {
      hudEl.textContent += '\n\n*** MISSION COMPLETE ***';
      hudEl.style.color = '#ffff00';
    }
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }
  }

  // ---- Input ----

  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (!active) {
      // Check activation: S+K within 400ms
      keys[k] = true;
      keyTimestamps[k] = Date.now();
      if (keys['s'] && keys['k']) {
        var ts = keyTimestamps['s'] || 0;
        var tk = keyTimestamps['k'] || 0;
        if (Math.abs(ts - tk) < 400) {
          startGame();
        }
      }
      return;
    }
    keys[k] = true;
    if (k === 'e') {
      holdingE = true;
      holdETimer = 0;
    }
    if (k === 'g') {
      if (nearWindow) attemptRappel();
    }
    if (k === ' ') {
      if (onGround) {
        playerVel.y = 8;
        onGround = false;
      }
    }
    if (k === 'f') {
      shoot();
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    keys[k] = false;
    if (k === 'e') {
      holdingE = false;
      holdETimer = 0;
    }
  }

  function onMouseMove(e) {
    if (!active) return;
    mouseDX += e.movementX || 0;
    mouseDY += e.movementY || 0;
  }

  function onMouseDown(e) {
    if (!active) return;
    if (e.button === 0) shoot();
  }

  // ---- Shooting ----

  function shoot() {
    if (!active || gameOver || gameWon) return;
    if (shootCooldown > 0) return;
    shootCooldown = SHOOT_INTERVAL;

    // Raycast from camera forward
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(playerPitch, playerYaw, 0, 'YXZ'));

    var origin = new THREE.Vector3(playerPos.x, playerPos.y + 1.7, playerPos.z);

    // Check terrorists
    for (var i = 0; i < terroristMeshes.length; i++) {
      var tm = terroristMeshes[i];
      if (!tm.userData.alive) continue;
      var toT = new THREE.Vector3().subVectors(tm.position, origin);
      var dist = toT.length();
      if (dist > 40) continue;
      toT.normalize();
      var dot = dir.dot(toT);
      if (dot > 0.97) {
        // Hit!
        if (tm.userData.isCEO) {
          hitCEO(10);
        } else if (tm.userData.isSniper) {
          tm.userData.hp -= 25;
          if (tm.userData.hp <= 0) {
            tm.userData.alive = false;
            tm.visible = false;
            sniperAlive = false;
          }
        } else {
          tm.userData.hp -= 25;
          if (tm.userData.hp <= 0) {
            tm.userData.alive = false;
            tm.visible = false;
            if (tm.userData.headMesh) tm.userData.headMesh.visible = false;
          }
        }
        // Trigger alarm
        if (!alarmActive) {
          alarmActive = true;
          alarmTimer = 0;
        }
        spawnBulletEffect(origin, tm.position.clone());
        break;
      }
    }
  }

  function hitCEO(dmg) {
    if (!ceoAlive) return;
    if (!ceoArmorBroken) {
      ceoArmorHP -= dmg;
      if (ceoArmorHP <= 0) {
        ceoArmorBroken = true;
      }
      return;
    }
    ceoHP -= dmg;
    if (ceoHP <= 0) {
      ceoAlive = false;
      ceoMesh.visible = false;
      if (ceoDrone) ceoDrone.visible = false;
    }
  }

  function spawnBulletEffect(from, to) {
    var pts = [
      { x: from.x, y: from.y, z: from.z },
      { x: to.x, y: to.y, z: to.z }
    ];
    var line = makeLineSegments(pts, 0xffff44);
    scene.add(line);
    bulletParticles.push({ mesh: line, ttl: 0.1 });
  }

  // ---- Elevator ----

  function callElevator(targetFloor) {
    if (elevatorActive) return;
    elevatorActive = true;
    elevatorFloor = currentFloor;
    elevatorTarget = targetFloor;
    elevatorTimer = 0;
  }

  function updateElevator(dt) {
    if (!elevatorCabin) return;
    if (!elevatorActive) {
      elevatorCabin.position.y = floorYFromIndex(elevatorFloor);
      return;
    }
    elevatorTimer += dt;
    var t = Math.min(elevatorTimer / elevatorTravel, 1);
    var startY = floorYFromIndex(elevatorFloor);
    var endY = floorYFromIndex(elevatorTarget);
    elevatorCabin.position.y = startY + (endY - startY) * t;

    // If player is near elevator (riding it), move player too
    var dx = playerPos.x - elevatorCabin.position.x;
    var dz = playerPos.z - elevatorCabin.position.z;
    if (Math.sqrt(dx * dx + dz * dz) < 1.5) {
      playerPos.y = elevatorCabin.position.y + 1.5;
    }

    if (elevatorTimer >= elevatorTravel) {
      elevatorActive = false;
      elevatorFloor = elevatorTarget;
      currentFloor = elevatorTarget;
    }
  }

  // ---- Rappel / Window Breach ----

  function attemptRappel() {
    if (isRappeling) return;
    // Check if player is near exterior window (x near ±10 or z near ±10)
    var atFront = Math.abs(playerPos.z - 9) < 2;
    var atBack = Math.abs(playerPos.z + 9) < 2;
    var atLeft = Math.abs(playerPos.x - 9) < 2;
    var atRight = Math.abs(playerPos.x + 9) < 2;
    if (!(atFront || atBack || atLeft || atRight)) return;

    isRappeling = true;
    rappelFloor = currentFloor;
    rappelTimer = 0;

    // Move player to exterior
    if (atFront) playerPos.z = 12;
    else if (atBack) playerPos.z = -12;
    else if (atLeft) playerPos.x = 12;
    else playerPos.x = -12;
  }

  function updateRappel(dt) {
    if (!isRappeling) return;
    rappelTimer += dt;
    // Descend or ascend slowly
    var nextFloor = rappelFloor - 1;
    if (nextFloor < 1) nextFloor = 1;
    if (rappelTimer > 2) {
      currentFloor = nextFloor;
      playerPos.y = floorYFromIndex(currentFloor) + 1;
      // Reenter building
      if (Math.abs(playerPos.z) > 10) playerPos.z = playerPos.z > 0 ? 8 : -8;
      if (Math.abs(playerPos.x) > 10) playerPos.x = playerPos.x > 0 ? 8 : -8;
      isRappeling = false;
      rappelTimer = 0;
    }
  }

  // ---- Hostage Rescue ----

  function updateHostageInteraction(dt) {
    nearHostage = null;
    for (var i = 0; i < hostageObjects.length; i++) {
      var ho = hostageObjects[i];
      if (ho.userData.freed) continue;
      var dx = playerPos.x - ho.position.x;
      var dy = playerPos.y - ho.position.y;
      var dz = playerPos.z - ho.position.z;
      var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2) {
        nearHostage = ho;
        break;
      }
    }

    if (holdingE && nearHostage) {
      holdETimer += dt;
      if (holdETimer >= 2) {
        nearHostage.userData.freed = true;
        nearHostage.material.color.setHex(0x00ff88);
        hostagesFreed++;
        holdETimer = 0;
        nearHostage = null;
      }
    } else if (!holdingE) {
      holdETimer = 0;
    }
  }

  // ---- Terrorist AI ----

  function updateTerroristAI(dt) {
    for (var i = 0; i < terroristMeshes.length; i++) {
      var tm = terroristMeshes[i];
      if (!tm.userData.alive) continue;
      if (tm.userData.isCEO) continue;

      var tFloor = tm.userData.floorNum;
      var onSameFloor = (tFloor === currentFloor);

      // Patrol behavior
      tm.userData.patrolTimer += dt;
      if (tm.userData.patrolTimer > 2) {
        tm.userData.patrolDir = Math.random() * Math.PI * 2;
        tm.userData.patrolTimer = 0;
      }

      if (alarmActive && onSameFloor) {
        // Move toward player
        var dx = playerPos.x - tm.position.x;
        var dz = playerPos.z - tm.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 1) {
          tm.position.x += (dx / dist) * dt * 2;
          tm.position.z += (dz / dist) * dt * 2;
        }
        if (tm.userData.headMesh) {
          tm.userData.headMesh.position.x = tm.position.x;
          tm.userData.headMesh.position.z = tm.position.z;
        }
        // Shoot player if close
        if (dist < 5) {
          playerHP -= dt * 15;
          if (playerHP <= 0) {
            playerHP = 0;
            triggerLoss('player death');
          }
        }
      } else if (alarmActive) {
        // Move toward hostages on this floor
        var closestHostage = null;
        var closestDist = 999;
        for (var h = 0; h < hostageObjects.length; h++) {
          var ho = hostageObjects[h];
          if (ho.userData.freed) continue;
          if (ho.userData.floorNum !== tFloor) continue;
          var hdx = ho.position.x - tm.position.x;
          var hdz = ho.position.z - tm.position.z;
          var hd = Math.sqrt(hdx * hdx + hdz * hdz);
          if (hd < closestDist) {
            closestDist = hd;
            closestHostage = ho;
          }
        }
        if (closestHostage) {
          var hdx2 = closestHostage.position.x - tm.position.x;
          var hdz2 = closestHostage.position.z - tm.position.z;
          var hd2 = Math.sqrt(hdx2 * hdx2 + hdz2 * hdz2);
          if (hd2 > 1) {
            tm.position.x += (hdx2 / hd2) * dt * 1.5;
            tm.position.z += (hdz2 / hd2) * dt * 1.5;
          }
          if (hd2 < 1.5 && !closestHostage.userData.freed) {
            triggerLoss('hostage executed');
          }
          if (tm.userData.headMesh) {
            tm.userData.headMesh.position.x = tm.position.x;
            tm.userData.headMesh.position.z = tm.position.z;
          }
        }
      } else {
        // Patrol
        var spd = 1;
        tm.position.x += Math.cos(tm.userData.patrolDir) * spd * dt;
        tm.position.z += Math.sin(tm.userData.patrolDir) * spd * dt;
        // Clamp to floor bounds
        tm.position.x = Math.max(-8, Math.min(8, tm.position.x));
        tm.position.z = Math.max(-8, Math.min(8, tm.position.z));
        if (tm.userData.headMesh) {
          tm.userData.headMesh.position.x = tm.position.x;
          tm.userData.headMesh.position.z = tm.position.z;
        }
      }
    }

    // CEO drone orbit
    if (ceoAlive && ceoDrone && ceoDrone.userData.alive) {
      var cfy = floorYFromIndex(30);
      var t2 = elapsedTime;
      ceoDrone.position.x = ceoMesh.position.x + Math.cos(t2 * 1.5) * 3;
      ceoDrone.position.z = ceoMesh.position.z + Math.sin(t2 * 1.5) * 3;
      ceoDrone.position.y = ceoMesh.position.y + 1.5;

      // Drone shoots player if on floor 30
      if (currentFloor === 30) {
        var ddx = playerPos.x - ceoDrone.position.x;
        var ddz = playerPos.z - ceoDrone.position.z;
        var ddist = Math.sqrt(ddx * ddx + ddz * ddz);
        if (ddist < 8) {
          playerHP -= dt * 10;
          if (playerHP <= 0) {
            playerHP = 0;
            triggerLoss('player death');
          }
        }
      }
    }
  }

  // ---- Reinforcements ----

  function spawnReinforcements() {
    if (droppedReinforcements) return;
    droppedReinforcements = true;
    // 5 new terrorists rappel down from roof
    var roofY = floorYFromIndex(30);
    for (var i = 0; i < 5; i++) {
      var rx = (Math.random() - 0.5) * 14;
      var rz = (Math.random() - 0.5) * 14;
      var rm = makeBox(0.5, 1.5, 0.5, 0x664433);
      rm.position.set(rx, roofY + 0.75, rz);
      var rHead = makeSphere(0.3, 0x886644);
      rHead.position.set(rx, roofY + 1.8, rz);
      scene.add(rHead);
      rm.userData = {
        isTerrorist: true,
        hp: 100,
        alive: true,
        floorNum: 30,
        patrol: true,
        patrolDir: Math.random() * Math.PI * 2,
        patrolTimer: 0,
        headMesh: rHead,
        index: terroristMeshes.length
      };
      scene.add(rm);
      terroristMeshes.push(rm);
    }
    terroristCount += 5;
  }

  // ---- Win / Lose ----

  function checkWin() {
    if (!ceoAlive && hostagesFreed >= 4 && currentFloor === 30) {
      gameWon = true;
    }
  }

  function triggerLoss(reason) {
    if (gameOver || gameWon) return;
    gameOver = true;
  }

  // ---- Player movement ----

  function updatePlayer(dt) {
    if (gameOver || gameWon) return;

    // Mouse look
    var sensitivity = 0.002;
    playerYaw -= mouseDX * sensitivity;
    playerPitch -= mouseDY * sensitivity;
    playerPitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, playerPitch));
    mouseDX = 0;
    mouseDY = 0;

    // Movement
    var speed = 7;
    var moveX = 0;
    var moveZ = 0;
    if (keys['w'] || keys['arrowup']) moveZ -= 1;
    if (keys['s'] || keys['arrowdown']) moveZ += 1;
    if (keys['a'] || keys['arrowleft']) moveX -= 1;
    if (keys['d'] || keys['arrowright']) moveX += 1;

    // Rotate movement by yaw
    var cosY = Math.cos(playerYaw);
    var sinY = Math.sin(playerYaw);
    var worldX = moveX * cosY - moveZ * sinY;
    var worldZ = moveX * sinY + moveZ * cosY;
    var len = Math.sqrt(worldX * worldX + worldZ * worldZ);
    if (len > 0) {
      worldX /= len;
      worldZ /= len;
    }

    playerPos.x += worldX * speed * dt;
    playerPos.z += worldZ * speed * dt;

    // Clamp to building interior (unless rappeling)
    if (!isRappeling) {
      playerPos.x = Math.max(-9, Math.min(9, playerPos.x));
      playerPos.z = Math.max(-9, Math.min(9, playerPos.z));
    }

    // Gravity
    if (!onGround) {
      playerVel.y -= 20 * dt;
    }
    playerPos.y += playerVel.y * dt;

    // Floor collision
    var floorY = floorYFromIndex(currentFloor);
    if (playerPos.y <= floorY) {
      playerPos.y = floorY;
      playerVel.y = 0;
      onGround = true;
    } else {
      onGround = false;
    }

    // Detect near elevator
    var edx = playerPos.x - 8;
    var edz = playerPos.z - 0;
    nearElevator = Math.sqrt(edx * edx + edz * edz) < 2;

    // E to call elevator
    if (keys['e'] && nearElevator && !elevatorActive && !nearHostage) {
      // Cycle to next floor up
      var floorList = [1, 5, 10, 15, 20, 25, 30];
      var ci = floorList.indexOf(currentFloor);
      var nextF = floorList[(ci + 1) % floorList.length];
      // Check sniper restriction: can't pass floor 15 if sniper alive
      if (nextF > 15 && sniperAlive) {
        // Block — sniper must be eliminated
      } else {
        callElevator(nextF);
      }
    }

    // Detect near window
    var nx = playerPos.x;
    var nz = playerPos.z;
    nearWindow = (Math.abs(nx) > 7.5 || Math.abs(nz) > 7.5);

    // Update camera
    camera.position.set(playerPos.x, playerPos.y + 1.7, playerPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = playerYaw;
    camera.rotation.x = playerPitch;

    // Update current floor detection (from Y position)
    var detectedFloor = 1;
    var floorList2 = [1, 5, 10, 15, 20, 25, 30];
    for (var fi = 0; fi < floorList2.length; fi++) {
      var fy2 = floorYFromIndex(floorList2[fi]);
      if (playerPos.y >= fy2 - 0.5) {
        detectedFloor = floorList2[fi];
      }
    }
    currentFloor = detectedFloor;
  }

  // ---- Bullet particles ----

  function updateBullets(dt) {
    for (var i = bulletParticles.length - 1; i >= 0; i--) {
      bulletParticles[i].ttl -= dt;
      if (bulletParticles[i].ttl <= 0) {
        scene.remove(bulletParticles[i].mesh);
        bulletParticles.splice(i, 1);
      }
    }
  }

  // ---- Game loop ----

  function startGame() {
    if (active) return;
    active = true;
    startTime = Date.now();

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb);
    document.body.appendChild(renderer.domElement);

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 3, 8);

    clock = new THREE.Clock();

    // Build world
    buildGround();
    buildSkyscraper();
    buildFloors();
    buildElevator();
    buildStairwells();
    buildHostages();
    buildTerrorists();
    buildSniper();
    buildCEO();
    buildLighting();

    createHUD();

    // Pointer lock
    renderer.domElement.addEventListener('click', function () {
      renderer.domElement.requestPointerLock();
    });

    renderer.domElement.requestPointerLock = renderer.domElement.requestPointerLock || renderer.domElement.mozRequestPointerLock;

    // Reset player position
    playerPos.x = 0;
    playerPos.y = floorYFromIndex(1);
    playerPos.z = 5;

    requestAnimationFrame(gameLoop);
  }

  function gameLoop() {
    if (!active) return;
    requestAnimationFrame(gameLoop);

    var dt = clock.getDelta();
    dt = Math.min(dt, 0.05); // cap

    elapsedTime = (Date.now() - startTime) / 1000;

    // Reinforcements at 5 min
    if (elapsedTime >= 300 && !droppedReinforcements) {
      spawnReinforcements();
    }

    if (!gameOver && !gameWon) {
      updatePlayer(dt);
      updateElevator(dt);
      updateRappel(dt);
      updateHostageInteraction(dt);
      updateTerroristAI(dt);
      updateBullets(dt);
      checkWin();
    }

    if (shootCooldown > 0) shootCooldown -= dt;

    updateHUD();
    if (renderer) renderer.render(scene, camera);
  }

  // ---- Public API ----

  function init(mountScene, mountCamera, mountRenderer) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

    // Register input handlers
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
  }

  function update(dt) {
    // External update hook (no-op; game loop self-drives)
  }

  function reset() {
    active = false;
    gameOver = false;
    gameWon = false;
    playerHP = 100;
    currentFloor = 1;
    hostagesFreed = 0;
    ceoAlive = true;
    ceoHP = 400;
    ceoArmorHP = 100;
    ceoArmorBroken = false;
    terroristCount = 25;
    elapsedTime = 0;
    droppedReinforcements = false;
    alarmActive = false;
    sniperAlive = true;
    terroristMeshes = [];
    hostageObjects = [];
    bulletParticles = [];
    floors = [];
    stairwells = [];
    holdingE = false;
    holdETimer = 0;
    isRappeling = false;

    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    removeHUD();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mousedown', onMouseDown);
  }

  // Register key listeners for activation immediately
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  return { init: init, update: update, reset: reset };
})();
