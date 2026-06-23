window.EscapeEvade = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────
  var scene, camera, renderer;
  var active = false;
  var started = false;
  var clock;

  // Player state
  var player = {
    pos: { x: 0, y: 0, z: 0 },
    hp: 100,
    detection: 0,
    crouching: false,
    prone: false,
    proneTimer: 0,
    disguised: false,
    disguiseTimer: 0,
    dogScent: true,
    dogScentTimer: 0,
    inWater: false,
    moving: false,
    velocity: { x: 0, z: 0 },
    mesh: null
  };

  // Keys
  var keys = {};

  // Enemies
  var enemies = [];
  var dog = null;
  var dogMesh = null;
  var dogLastKnownPos = null;
  var dogConfused = false;

  // Map objects
  var hidingSpots = [];
  var safeHouses = [];
  var civilianNPC = null;
  var waterStream = null;
  var extractionPoint = null;

  // Score tracking
  var gameStart = 0;
  var safeHousesVisited = 0;
  var detectionPeaks = 0;
  var disguiseUsed = false;
  var gameEndTime = 0;
  var missionResult = '';

  // HUD
  var hudDiv = null;
  var radioDiv = null;
  var radioVisible = false;
  var radioTimer = 0;

  // ── Key Handlers ───────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.code] = true;

    if (!started) {
      if (keys['KeyE'] && keys['KeyV']) {
        startScenario();
      }
      return;
    }

    // D = disguise
    if (e.code === 'KeyD') {
      tryDisguise();
    }
    // R = double-back
    if (e.code === 'KeyR') {
      doubleBack();
    }
    // C = radio contact
    if (e.code === 'KeyC') {
      toggleRadio();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init(sceneRef, cameraRef, rendererRef) {
    scene = sceneRef;
    camera = cameraRef;
    renderer = rendererRef;
    clock = new THREE.Clock();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    buildHUD();
  }

  function buildHUD() {
    hudDiv = document.createElement('div');
    hudDiv.id = 'ee-hud';
    hudDiv.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);' +
      'color:#00ff88;font-family:monospace;font-size:14px;background:rgba(0,0,0,0.6);' +
      'padding:6px 12px;border-radius:4px;pointer-events:none;display:none;z-index:1000;';
    document.body.appendChild(hudDiv);

    radioDiv = document.createElement('div');
    radioDiv.id = 'ee-radio';
    radioDiv.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
      'color:#ffcc00;font-family:monospace;font-size:13px;background:rgba(0,0,0,0.7);' +
      'padding:8px 16px;border-radius:4px;pointer-events:none;display:none;z-index:1000;';
    document.body.appendChild(radioDiv);
  }

  // ── Scenario Setup ─────────────────────────────────────────────────────
  function startScenario() {
    if (started) return;
    started = true;
    active = true;
    gameStart = performance.now();

    // Reset player
    player.pos = { x: 0, y: 0, z: 0 };
    player.hp = 100;
    player.detection = 0;
    player.crouching = false;
    player.prone = false;
    player.proneTimer = 0;
    player.disguised = false;
    player.disguiseTimer = 0;
    player.dogScent = true;
    player.inWater = false;
    player.moving = false;
    safeHousesVisited = 0;
    detectionPeaks = 0;
    disguiseUsed = false;
    missionResult = '';

    buildMap();
    buildPlayer();
    buildEnemies();
    buildDog();
    buildCivilian();
    buildWater();
    buildExtractionPoint();

    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);

    hudDiv.style.display = 'block';
  }

  // Ground
  function buildMap() {
    // Ground plane
    var groundGeo = new THREE.PlaneGeometry(200, 200);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x2d4a1e });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ambient + directional light
    var amb = new THREE.AmbientLight(0x303040, 0.6);
    scene.add(amb);
    var dir = new THREE.DirectionalLight(0x8899aa, 0.8);
    dir.position.set(30, 60, 20);
    scene.add(dir);

    // Hiding spots: 5 varied BoxGeometry objects
    var coverDefs = [
      { label: 'bush',   color: 0x1a5e1a, w: 2.5, h: 1.5, d: 2.5, pos: { x: 10, z: 8 } },
      { label: 'bush2',  color: 0x226622, w: 2,   h: 1.8, d: 2,   pos: { x: -12, z: 15 } },
      { label: 'dumpster', color: 0x445544, w: 2, h: 1.5, d: 3, pos: { x: -8, z: -10 } },
      { label: 'car',    color: 0x556677, w: 4,   h: 1.4, d: 2,   pos: { x: 18, z: -14 } },
      { label: 'crates', color: 0x8B7355, w: 2,   h: 2,   d: 2,   pos: { x: -20, z: 5 } }
    ];

    for (var i = 0; i < coverDefs.length; i++) {
      var def = coverDefs[i];
      var geo = new THREE.BoxGeometry(def.w, def.h, def.d);
      var mat = new THREE.MeshLambertMaterial({ color: def.color });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(def.pos.x, def.h / 2, def.pos.z);
      scene.add(mesh);
      hidingSpots.push({ mesh: mesh, pos: def.pos, label: def.label });
    }

    // Safe houses: 3x3x3 boxes with a white cross on roof
    var shPositions = [
      { x: 35, z: -25 },
      { x: -40, z: 20 },
      { x: 25, z: 45 }
    ];

    for (var j = 0; j < shPositions.length; j++) {
      var shp = shPositions[j];
      var shGeo = new THREE.BoxGeometry(3, 3, 3);
      var shMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
      var shMesh = new THREE.Mesh(shGeo, shMat);
      shMesh.position.set(shp.x, 1.5, shp.z);
      scene.add(shMesh);

      // White cross on roof
      var crossH = new THREE.BoxGeometry(1.4, 0.15, 0.3);
      var crossV = new THREE.BoxGeometry(0.3, 0.15, 1.4);
      var wMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      var cH = new THREE.Mesh(crossH, wMat);
      var cV = new THREE.Mesh(crossV, wMat);
      cH.position.set(shp.x, 3.1, shp.z);
      cV.position.set(shp.x, 3.1, shp.z);
      scene.add(cH);
      scene.add(cV);

      safeHouses.push({ mesh: shMesh, pos: shp, visited: false });
    }
  }

  function buildPlayer() {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    player.mesh = new THREE.Mesh(geo, mat);
    player.mesh.position.set(0, 0.9, 0);
    scene.add(player.mesh);
  }

  function buildEnemies() {
    var enemyPositions = [
      { x: 20, z: 20, patrolA: { x: 20, z: 20 }, patrolB: { x: 30, z: 10 } },
      { x: -25, z: 15, patrolA: { x: -25, z: 15 }, patrolB: { x: -15, z: 25 } },
      { x: 10, z: -30, patrolA: { x: 10, z: -30 }, patrolB: { x: 20, z: -20 } },
      { x: -15, z: -20, patrolA: { x: -15, z: -20 }, patrolB: { x: -25, z: -10 } },
      { x: 40, z: 0, patrolA: { x: 40, z: 0 }, patrolB: { x: 30, z: 10 } },
      { x: -35, z: -5, patrolA: { x: -35, z: -5 }, patrolB: { x: -25, z: -15 } }
    ];

    for (var i = 0; i < enemyPositions.length; i++) {
      var ep = enemyPositions[i];
      var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
      var mat = new THREE.MeshLambertMaterial({ color: 0x334455 });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(ep.x, 0.9, ep.z);
      scene.add(mesh);

      // Search light (PointLight as proxy for search arc)
      var light = new THREE.PointLight(0xffdd88, 1.5, 12);
      light.position.set(ep.x, 2, ep.z);
      scene.add(light);

      // Visual cone for search arc
      var coneGeo = new THREE.ConeGeometry(4, 8, 8, 1, true);
      var coneMat = new THREE.MeshBasicMaterial({ color: 0xffdd88, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
      var coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.rotation.x = Math.PI / 2;
      mesh.add(coneMesh);
      coneMesh.position.set(0, 0.5, -4);

      enemies.push({
        mesh: mesh,
        light: light,
        pos: { x: ep.x, z: ep.z },
        patrolA: ep.patrolA,
        patrolB: ep.patrolB,
        patrolTarget: 'B',
        state: 'patrol',     // patrol | search | chase
        searchTimer: 0,
        confusedTimer: 0,
        angle: 0,            // facing angle (radians)
        speed: 3,
        alertLevel: 0
      });
    }
  }

  function buildDog() {
    var geo = new THREE.BoxGeometry(1, 0.6, 2);
    var mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    dogMesh = new THREE.Mesh(geo, mat);
    // Attach to enemy 0
    var e0 = enemies[0];
    dogMesh.position.set(e0.pos.x + 1.5, 0.3, e0.pos.z);
    scene.add(dogMesh);

    dog = {
      pos: { x: e0.pos.x + 1.5, z: e0.pos.z },
      speed: 8,
      chasing: false,
      lastKnownPos: null,
      confused: false,
      confusedTimer: 0
    };
  }

  function buildCivilian() {
    var geo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    var mat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
    civilianNPC = new THREE.Mesh(geo, mat);
    civilianNPC.position.set(-5, 0.9, -5);
    scene.add(civilianNPC);
    civilianNPC.userData.clothingAvailable = true;
  }

  function buildWater() {
    var geo = new THREE.BoxGeometry(40, 0.3, 5);
    var mat = new THREE.MeshLambertMaterial({ color: 0x223355, transparent: true, opacity: 0.7 });
    waterStream = new THREE.Mesh(geo, mat);
    waterStream.position.set(0, 0.15, 30);
    scene.add(waterStream);
  }

  function buildExtractionPoint() {
    var geo = new THREE.CylinderGeometry(5, 5, 0.3, 32, 1, true);
    var mat = new THREE.MeshBasicMaterial({ color: 0x00FF88, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    extractionPoint = new THREE.Mesh(geo, mat);
    extractionPoint.position.set(60, 0.15, 60);
    scene.add(extractionPoint);

    // Pulsing ring marker
    var ringGeo = new THREE.TorusGeometry(5, 0.2, 8, 32);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x00FF88 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(60, 0.5, 60);
    scene.add(ring);
  }

  // ── Gameplay Logic ─────────────────────────────────────────────────────

  function tryDisguise() {
    if (player.disguised) return;
    if (!civilianNPC || !civilianNPC.userData.clothingAvailable) return;
    var dx = player.pos.x - civilianNPC.position.x;
    var dz = player.pos.z - civilianNPC.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= 3) {
      player.disguised = true;
      player.disguiseTimer = 90;
      disguiseUsed = true;
      civilianNPC.userData.clothingAvailable = false;
      // Tint civilian grey to show clothing taken
      civilianNPC.material.color.setHex(0x888888);
    }
  }

  function doubleBack() {
    // Move player 8 units backward (away from camera look direction)
    var bx = -Math.sin(camera.rotation.y) * 8;
    var bz = -Math.cos(camera.rotation.y) * 8;
    // Clamp to map
    player.pos.x = Math.max(-95, Math.min(95, player.pos.x + bx));
    player.pos.z = Math.max(-95, Math.min(95, player.pos.z + bz));

    // Confuse nearest pursuer for 15s
    var nearest = null;
    var nearDist = Infinity;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      var dx = e.pos.x - player.pos.x;
      var dz = e.pos.z - player.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearDist) {
        nearDist = d;
        nearest = e;
      }
    }
    if (nearest) {
      nearest.confusedTimer = 15;
      nearest.state = 'patrol';
    }
  }

  function toggleRadio() {
    radioVisible = !radioVisible;
    radioTimer = radioVisible ? 5 : 0;
  }

  function getDistance2D(ax, az, bx, bz) {
    var dx = ax - bx;
    var dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function getBearing(fromX, fromZ, toX, toZ) {
    var dx = toX - fromX;
    var dz = toZ - fromZ;
    var angle = Math.atan2(dx, -dz) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    var idx = Math.round(angle / 45) % 8;
    return dirs[idx];
  }

  function isPlayerInSearchCone(enemy) {
    var dx = player.pos.x - enemy.pos.x;
    var dz = player.pos.z - enemy.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);

    var detectionRange = player.disguised ? 5 : 15;

    if (dist > detectionRange) return false;

    // Check cone angle (enemy faces along its angle)
    var toPlayerAngle = Math.atan2(dx, dz);
    var angleDiff = toPlayerAngle - enemy.angle;
    // Normalize to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    return Math.abs(angleDiff) < Math.PI / 4; // 45 deg half-cone
  }

  function updatePlayer(dt) {
    if (!active) return;

    var speed = 6;
    var moveX = 0;
    var moveZ = 0;

    // Prone = no movement, undetectable for 5s
    if (player.prone) {
      player.proneTimer -= dt;
      if (player.proneTimer <= 0) {
        player.prone = false;
        camera.rotation.z = 0;
      }
      return;
    }

    // Crouch = slower
    player.crouching = keys['ShiftLeft'] || keys['ShiftRight'];
    if (player.crouching) speed = 3;

    // Check for dive-to-cover (S key while moving)
    if (keys['KeyS'] && player.moving && !player.prone) {
      player.prone = true;
      player.proneTimer = 5;
      camera.rotation.z = Math.PI / 2;
      return;
    }

    if (keys['ArrowUp'] || keys['KeyW']) { moveZ -= 1; }
    if (keys['ArrowDown']) { moveZ += 1; }
    if (keys['ArrowLeft'] || keys['KeyA']) { moveX -= 1; }
    if (keys['ArrowRight']) { moveX += 1; }

    var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    player.moving = len > 0;
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    player.pos.x += moveX * speed * dt;
    player.pos.z += moveZ * speed * dt;
    player.pos.x = Math.max(-95, Math.min(95, player.pos.x));
    player.pos.z = Math.max(-95, Math.min(95, player.pos.z));

    if (player.mesh) {
      player.mesh.position.set(player.pos.x, player.crouching ? 0.45 : 0.9, player.pos.z);
      player.mesh.scale.y = player.crouching ? 0.5 : 1;
    }

    // Camera follows player (top-down-ish)
    camera.position.x = player.pos.x;
    camera.position.z = player.pos.z + 25;
    camera.position.y = 18;
    camera.lookAt(player.pos.x, 0, player.pos.z);

    // Check water
    var wasInWater = player.inWater;
    if (waterStream) {
      var wx = Math.abs(player.pos.x - waterStream.position.x);
      var wz = Math.abs(player.pos.z - waterStream.position.z);
      player.inWater = (wx < 20 && wz < 2.5);
      if (!wasInWater && player.inWater) {
        // Entered water — dogs lose scent for 20s
        dog.confusedTimer = 20;
        dog.confused = true;
        dog.chasing = false;
      }
    }

    // Update disguise timer
    if (player.disguised) {
      player.disguiseTimer -= dt;
      if (player.disguiseTimer <= 0) {
        player.disguised = false;
        player.disguiseTimer = 0;
      }
    }
  }

  function updateDetection(dt) {
    if (!active) return;
    if (player.prone) return; // undetectable while prone

    var inCover = false;
    for (var i = 0; i < hidingSpots.length; i++) {
      var hs = hidingSpots[i];
      var dist = getDistance2D(player.pos.x, player.pos.z, hs.pos.x, hs.pos.z);
      if (dist <= 1.5) {
        inCover = true;
        break;
      }
    }

    var detectedByAny = false;
    for (var j = 0; j < enemies.length; j++) {
      var e = enemies[j];
      if (e.confusedTimer > 0) continue;
      if (isPlayerInSearchCone(e)) {
        detectedByAny = true;
        break;
      }
    }

    if (detectedByAny && !inCover) {
      var rate = 15; // % per second
      player.detection += rate * dt;
      if (player.detection > 100) player.detection = 100;
    } else {
      var dropRate = inCover && player.crouching ? 9 : 3;
      player.detection -= dropRate * dt;
      if (player.detection < 0) player.detection = 0;
    }

    // Track peaks
    if (player.detection >= 99 && missionResult === '') {
      detectionPeaks++;
      // Mission fail
      missionResult = 'CAPTURED';
      active = false;
      showResult();
    }
  }

  function updateEnemies(dt) {
    if (!active) return;

    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];

      // Confused timer
      if (e.confusedTimer > 0) {
        e.confusedTimer -= dt;
        continue;
      }

      var distToPlayer = getDistance2D(e.pos.x, e.pos.z, player.pos.x, player.pos.z);

      // State transitions
      if (e.state === 'patrol') {
        if (isPlayerInSearchCone(e) && !player.prone) {
          e.state = 'chase';
          e.searchTimer = 0;
        }
      } else if (e.state === 'search') {
        e.searchTimer -= dt;
        if (e.searchTimer <= 0) e.state = 'patrol';
        if (isPlayerInSearchCone(e) && !player.prone) e.state = 'chase';
      } else if (e.state === 'chase') {
        if (distToPlayer > 20) {
          e.state = 'search';
          e.searchTimer = 10;
        }
      }

      // Movement
      var target;
      if (e.state === 'patrol') {
        target = e.patrolTarget === 'A' ? e.patrolA : e.patrolB;
        var distTarget = getDistance2D(e.pos.x, e.pos.z, target.x, target.z);
        if (distTarget < 1) {
          e.patrolTarget = e.patrolTarget === 'A' ? 'B' : 'A';
          target = e.patrolTarget === 'A' ? e.patrolA : e.patrolB;
        }
      } else if (e.state === 'chase' || e.state === 'search') {
        target = { x: player.pos.x, z: player.pos.z };
      } else {
        target = e.patrolTarget === 'A' ? e.patrolA : e.patrolB;
      }

      var tdx = target.x - e.pos.x;
      var tdz = target.z - e.pos.z;
      var dist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (dist > 0.1) {
        var nx = tdx / dist;
        var nz = tdz / dist;
        e.pos.x += nx * e.speed * dt;
        e.pos.z += nz * e.speed * dt;
        e.angle = Math.atan2(nx, nz);
      }

      e.mesh.position.set(e.pos.x, 0.9, e.pos.z);
      e.mesh.rotation.y = e.angle;
      e.light.position.set(e.pos.x, 2, e.pos.z);
    }
  }

  function updateDog(dt) {
    if (!active || !dog) return;

    if (dog.confused) {
      dog.confusedTimer -= dt;
      if (dog.confusedTimer <= 0) {
        dog.confused = false;
        dog.chasing = false;
      }
      return;
    }

    var distToPlayer = getDistance2D(dog.pos.x, dog.pos.z, player.pos.x, player.pos.z);

    if (distToPlayer < 20 && player.dogScent) {
      dog.chasing = true;
      dog.lastKnownPos = { x: player.pos.x, z: player.pos.z };
    }

    if (dog.chasing && dog.lastKnownPos) {
      var target = dog.lastKnownPos;
      var dx = target.x - dog.pos.x;
      var dz = target.z - dog.pos.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 1) {
        dog.pos.x += (dx / dist) * dog.speed * dt;
        dog.pos.z += (dz / dist) * dog.speed * dt;
      } else {
        // Reached last known pos — stop
        dog.chasing = false;
      }

      // If player moved >30 units away from dog
      if (distToPlayer > 30) {
        dog.chasing = false;
        dog.lastKnownPos = null;
      }
    }

    if (dogMesh) {
      dogMesh.position.set(dog.pos.x, 0.3, dog.pos.z);
    }
  }

  function updateSafeHouses(dt) {
    if (!active) return;
    for (var i = 0; i < safeHouses.length; i++) {
      var sh = safeHouses[i];
      if (sh.visited) continue;
      var dist = getDistance2D(player.pos.x, player.pos.z, sh.pos.x, sh.pos.z);
      if (dist <= 3) {
        sh.visited = true;
        safeHousesVisited++;
        player.detection = 0;
        player.hp = Math.min(100, player.hp + 30);
        // Visual feedback: flash the safe house
        sh.mesh.material.color.setHex(0xffaa00);
      }
    }
  }

  function checkExtraction() {
    if (!active) return;
    var dist = getDistance2D(player.pos.x, player.pos.z, 60, 60);
    if (dist <= 5) {
      active = false;
      gameEndTime = performance.now();
      computeResult();
      showResult();
    }
  }

  function computeResult() {
    var elapsed = (gameEndTime - gameStart) / 1000;
    var score = 0;

    // Time bonus (under 180s = good)
    if (elapsed < 120) score += 3;
    else if (elapsed < 180) score += 2;
    else if (elapsed < 300) score += 1;

    // Safe houses
    score += safeHousesVisited;

    // Disguise bonus
    if (disguiseUsed) score += 1;

    // Detection peaks penalty
    score -= detectionPeaks;

    if (score >= 5 && detectionPeaks === 0) {
      missionResult = 'EVADED CLEAN';
    } else if (score >= 3) {
      missionResult = 'EVADED';
    } else if (score >= 1) {
      missionResult = 'CLOSE CALL';
    } else {
      missionResult = 'COMPROMISED';
    }
  }

  function showResult() {
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'color:#00ff88;font-family:monospace;font-size:28px;background:rgba(0,0,0,0.85);' +
      'padding:30px 50px;border-radius:8px;text-align:center;z-index:2000;';
    var elapsed = ((gameEndTime || performance.now()) - gameStart) / 1000;
    var mins = Math.floor(elapsed / 60);
    var secs = Math.floor(elapsed % 60);
    div.innerHTML = 'E&E MISSION COMPLETE<br>' +
      '<span style="font-size:36px;color:#ffcc00">' + missionResult + '</span><br>' +
      '<span style="font-size:16px">Time: ' + mins + ':' + (secs < 10 ? '0' : '') + secs + ' | ' +
      'Safe Houses: ' + safeHousesVisited + '/3 | ' +
      'Detection Peaks: ' + detectionPeaks + ' | ' +
      'Disguise: ' + (disguiseUsed ? 'YES' : 'NO') + '</span><br>' +
      '<span style="font-size:13px;color:#aaa">Press E+V to restart</span>';
    document.body.appendChild(div);
    hudDiv.style.display = 'none';
  }

  function updateHUD() {
    if (!started || !hudDiv) return;

    var detPct = Math.floor(player.detection);
    var disguiseStr = '';
    if (player.disguised) {
      var dm = Math.floor(player.disguiseTimer / 60);
      var ds = Math.floor(player.disguiseTimer % 60);
      disguiseStr = ' [DISGUISED: ' + dm + ':' + (ds < 10 ? '0' : '') + ds + ']';
    }

    var shStr = '[SAFE HOUSES: ' + safeHousesVisited + '/3]';
    var dist = Math.floor(getDistance2D(player.pos.x, player.pos.z, 60, 60));
    var bearing = getBearing(player.pos.x, player.pos.z, 60, 60);
    var extractStr = 'EXTRACT: ' + dist + 'm ' + bearing;

    hudDiv.textContent = 'E&E [DETECTION: ' + detPct + '%]' + disguiseStr + ' ' + shStr + ' | ' + extractStr;

    // Color based on detection
    if (detPct > 70) {
      hudDiv.style.color = '#ff3300';
    } else if (detPct > 40) {
      hudDiv.style.color = '#ffaa00';
    } else {
      hudDiv.style.color = '#00ff88';
    }
  }

  function updateRadio(dt) {
    if (!radioDiv) return;
    if (radioVisible) {
      radioTimer -= dt;
      if (radioTimer <= 0) {
        radioVisible = false;
        radioDiv.style.display = 'none';
        return;
      }
      var dist = Math.floor(getDistance2D(player.pos.x, player.pos.z, 60, 60));
      var bearing = getBearing(player.pos.x, player.pos.z, 60, 60);
      radioDiv.textContent = '[RADIO] EXTRACTION: ' + dist + 'm ' + bearing + ' | HP: ' + Math.floor(player.hp) + ' | DETECTION: ' + Math.floor(player.detection) + '%';
      radioDiv.style.display = 'block';
    } else {
      radioDiv.style.display = 'none';
    }
  }

  // ── Main Update ────────────────────────────────────────────────────────
  function update() {
    if (!started || !clock) return;
    var dt = clock.getDelta();
    if (dt > 0.1) dt = 0.1; // cap

    if (active) {
      updatePlayer(dt);
      updateEnemies(dt);
      updateDog(dt);
      updateDetection(dt);
      updateSafeHouses(dt);
      checkExtraction();
    }

    updateHUD();
    updateRadio(dt);
  }

  // ── Reset ──────────────────────────────────────────────────────────────
  function reset() {
    active = false;
    started = false;

    // Remove meshes
    if (player.mesh) { scene.remove(player.mesh); player.mesh = null; }
    if (dogMesh) { scene.remove(dogMesh); dogMesh = null; }
    if (civilianNPC) { scene.remove(civilianNPC); civilianNPC = null; }
    if (waterStream) { scene.remove(waterStream); waterStream = null; }
    if (extractionPoint) { scene.remove(extractionPoint); extractionPoint = null; }

    for (var i = 0; i < enemies.length; i++) {
      scene.remove(enemies[i].mesh);
      scene.remove(enemies[i].light);
    }
    enemies = [];

    for (var j = 0; j < hidingSpots.length; j++) {
      scene.remove(hidingSpots[j].mesh);
    }
    hidingSpots = [];

    for (var k = 0; k < safeHouses.length; k++) {
      scene.remove(safeHouses[k].mesh);
    }
    safeHouses = [];

    keys = {};

    if (hudDiv) { hudDiv.style.display = 'none'; }
    if (radioDiv) { radioDiv.style.display = 'none'; }

    dog = null;
    dogLastKnownPos = null;
    safeHousesVisited = 0;
    detectionPeaks = 0;
    disguiseUsed = false;
    missionResult = '';
  }

  return { init: init, update: update, reset: reset };

})();
