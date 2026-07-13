window.GuerrillaWar = (function() {
  'use strict';

  var active = false;
  var scene = null;
  var camera = null;
  var renderer = null;
  var gameObjects = [];
  var hudEl = null;

  // Timing
  var gameTime = 0;
  var maxTime = 900; // 15 minutes
  var heloTime = 720; // 12 minutes
  var heloArrived = false;
  var gameOver = false;
  var gameWon = false;

  // Player state
  var playerHP = 100;
  var playerPos = null;
  var playerDir = null;
  var radioCapturing = false;
  var radioHoldTime = 0;
  var radioCaptured = false;
  var radioTransmitted = false;
  var extracted = false;

  // Key tracking for activation
  var keysDown = {};
  var keyTimes = {};
  var gPressed = false;
  var wPressed = false;

  // Game objects
  var trees = [];
  var bushes = [];
  var roadSegments = [];
  var trucks = [];
  var apc = null;
  var motorcycles = [];
  var soldiers = [];
  var allies = [];
  var ieds = [];
  var grenades = [];
  var bullets = [];
  var extractionMarker = null;

  // Convoy
  var convoyAlerted = false;
  var convoyPath = [];
  var convoyProgress = 0;
  var convoySpeed = 3;
  var trucksDestroyed = 0;
  var allyMode = 'WAIT'; // WAIT, ATTACK, FALLBACK

  // IED placement
  var iedCount = 0;
  var maxIeds = 3;

  // Grenade cooldown
  var grenadeCooldown = 0;

  // Click shooting
  var canShoot = true;
  var shootCooldown = 0;

  // E-key hold for radio
  var eHeld = false;

  // Input state (internal)
  var inputKeys = {};

  // Raycaster for shooting
  var raycaster = null;

  // ---- Key listeners ----
  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    if (!keysDown[k]) {
      keysDown[k] = true;
      keyTimes[k] = Date.now();
    }
    // Check simultaneous G+W
    if (!active) {
      if (k === 'g') { gPressed = true; }
      if (k === 'w') { wPressed = true; }
      if (gPressed && wPressed) {
        var gt = keyTimes['g'] || 0;
        var wt = keyTimes['w'] || 0;
        if (Math.abs(gt - wt) < 400) {
          activateGame();
        }
      }
    } else {
      inputKeys[k] = true;
      if (k === 'f') { allyMode = 'ATTACK'; }
      if (k === 'r') { allyMode = 'FALLBACK'; }
      if (k === 'e') { eHeld = true; }
      if (k === 'g') { throwGrenade(); }
    }
  }

  function onKeyUp(e) {
    var k = e.key.toLowerCase();
    keysDown[k] = false;
    if (k === 'g') { gPressed = false; }
    if (k === 'w') { wPressed = false; }
    if (active) {
      inputKeys[k] = false;
      if (k === 'e') {
        eHeld = false;
        radioHoldTime = 0;
        radioCapturing = false;
      }
    }
  }

  function onClick(e) {
    if (!active || gameOver) return;
    if (e.button === 0) { fireRifle(); }
  }

  // ---- Activation ----
  function activateGame() {
    if (active) return;
    active = true;
    buildScene();
    createHUD();
  }

  // ---- Scene building ----
  function buildScene() {
    if (!scene) return;
    raycaster = new THREE.Raycaster();

    buildRoad();
    buildJungle();
    buildConvoy();
    buildSoldiers();
    buildAllies();
    buildExtractionMarker();
  }

  function addObj(mesh) {
    scene.add(mesh);
    gameObjects.push(mesh);
    return mesh;
  }

  // ---- Road ----
  function buildRoad() {
    // Winding path waypoints
    convoyPath = [
      new THREE.Vector3(-80, 0, 0),
      new THREE.Vector3(-60, 0, 10),
      new THREE.Vector3(-40, 0, 5),
      new THREE.Vector3(-20, 0, 15),
      new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(20, 0, 0),
      new THREE.Vector3(40, 0, -10),
      new THREE.Vector3(60, 0, -5),
      new THREE.Vector3(80, 0, 0)
    ];

    for (var i = 0; i < convoyPath.length - 1; i++) {
      var a = convoyPath[i];
      var b = convoyPath[i + 1];
      var mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      var len = a.distanceTo(b);
      var dir = new THREE.Vector3().subVectors(b, a).normalize();
      var angle = Math.atan2(dir.x, dir.z);

      var geo = new THREE.BoxGeometry(len + 1, 0.2, 5);
      var mat = new THREE.MeshLambertMaterial({ color: 0x886655 });
      var seg = new THREE.Mesh(geo, mat);
      seg.position.copy(mid);
      seg.position.y = -0.1;
      seg.rotation.y = angle;
      addObj(seg);
      roadSegments.push(seg);
    }
  }

  // ---- Jungle ----
  function buildJungle() {
    var treeColors = [0x225522, 0x336633];
    var placed = 0;
    var attempts = 0;

    while (placed < 80 && attempts < 400) {
      attempts++;
      var x = (Math.random() - 0.5) * 200;
      var z = (Math.random() - 0.5) * 200;

      // Avoid road
      var onRoad = false;
      for (var r = 0; r < roadSegments.length; r++) {
        var rp = roadSegments[r].position;
        if (Math.abs(x - rp.x) < 8 && Math.abs(z - rp.z) < 8) {
          onRoad = true;
          break;
        }
      }
      if (onRoad) continue;

      var h = 4 + Math.random() * 6;
      var col = treeColors[Math.floor(Math.random() * 2)];

      var trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, h * 0.4, 6);
      var trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, h * 0.2, z);
      addObj(trunk);

      var foliageGeo = new THREE.ConeGeometry(1.5 + Math.random(), h * 0.7, 7);
      var foliageMat = new THREE.MeshLambertMaterial({ color: col });
      var foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(x, h * 0.5 + h * 0.2, z);
      addObj(foliage);

      trees.push({ mesh: foliage, pos: new THREE.Vector3(x, 0, z), radius: 2 });
      placed++;
    }

    // Undergrowth bushes
    for (var b = 0; b < 120; b++) {
      var bx = (Math.random() - 0.5) * 200;
      var bz = (Math.random() - 0.5) * 200;
      var bs = 0.5 + Math.random() * 1.2;
      var bushGeo = new THREE.BoxGeometry(bs, bs * 0.7, bs);
      var bushMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a });
      var bush = new THREE.Mesh(bushGeo, bushMat);
      bush.position.set(bx, bs * 0.35, bz);
      addObj(bush);
      bushes.push({ mesh: bush, pos: new THREE.Vector3(bx, 0, bz), radius: bs });
    }

    // Ambient light
    var ambient = new THREE.AmbientLight(0x446644, 0.6);
    addObj(ambient);
    var sunLight = new THREE.DirectionalLight(0xffffcc, 0.8);
    sunLight.position.set(50, 100, 50);
    addObj(sunLight);

    // Ground
    var groundGeo = new THREE.BoxGeometry(220, 0.5, 220);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1b });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.25, 0);
    addObj(ground);
  }

  // ---- Convoy ----
  function buildConvoy() {
    // Motorcycles first (front)
    for (var m = 0; m < 2; m++) {
      var mGeo = new THREE.BoxGeometry(0.8, 0.7, 1.5);
      var mMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
      var moto = new THREE.Mesh(mGeo, mMat);
      moto.position.copy(convoyPath[0]);
      moto.position.x -= (m + 1) * 5;
      addObj(moto);
      motorcycles.push({
        mesh: moto,
        hp: 40,
        dead: false,
        pathT: -(m + 1) * 5 / totalPathLength(),
        speed: convoySpeed * 1.2
      });
    }

    // Trucks
    var cargoTypes = [
      { name: 'EXPLOSIVES', pts: 50, color: 0x885522 },
      { name: 'RADIO', pts: 100, color: 0x558855 },
      { name: 'SUPPLIES', pts: 20, color: 0x887755 }
    ];

    for (var t = 0; t < 3; t++) {
      var truckGroup = new THREE.Group();

      var bodyGeo = new THREE.BoxGeometry(2.5, 1.5, 4);
      var bodyMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.75;
      truckGroup.add(body);

      var cabGeo = new THREE.BoxGeometry(2.5, 1.2, 1.5);
      var cabMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
      var cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0, 1.9, 1.5);
      truckGroup.add(cab);

      var cargoGeo = new THREE.BoxGeometry(2.2, 0.8, 2.5);
      var cargoMat = new THREE.MeshLambertMaterial({ color: cargoTypes[t].color });
      var cargo = new THREE.Mesh(cargoGeo, cargoMat);
      cargo.position.set(0, 1.9, -0.5);
      truckGroup.add(cargo);

      truckGroup.position.copy(convoyPath[0]);
      truckGroup.position.x -= (t + 1) * 10;
      addObj(truckGroup);

      trucks.push({
        group: truckGroup,
        body: body,
        hp: 120,
        dead: false,
        cargo: cargoTypes[t],
        pathT: -(t + 1) * 10 / totalPathLength(),
        isRadioTruck: (t === 1)
      });
    }

    // APC
    var apcGroup = new THREE.Group();

    var apcBodyGeo = new THREE.BoxGeometry(3, 1.8, 5);
    var apcBodyMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var apcBody = new THREE.Mesh(apcBodyGeo, apcBodyMat);
    apcBody.position.y = 0.9;
    apcGroup.add(apcBody);

    var turretGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
    var turretMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(0, 2.1, 0);
    apcGroup.add(turret);

    var cannonGeo = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
    var cannonMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var cannon = new THREE.Mesh(cannonGeo, cannonMat);
    cannon.rotation.z = Math.PI / 2;
    cannon.position.set(0, 2.1, -1.2);
    apcGroup.add(cannon);

    apcGroup.position.copy(convoyPath[0]);
    apcGroup.position.x -= 45;
    addObj(apcGroup);

    apc = {
      group: apcGroup,
      turret: turret,
      cannon: cannon,
      hp: 150,
      dead: false,
      pathT: -45 / totalPathLength(),
      grenadeHits: 0,
      iedHit: false,
      suppressTimer: 0,
      fireTimer: 0
    };
  }

  function totalPathLength() {
    var total = 0;
    for (var i = 0; i < convoyPath.length - 1; i++) {
      total += convoyPath[i].distanceTo(convoyPath[i + 1]);
    }
    return total;
  }

  function getPathPosition(t) {
    // t in [0,1]
    var segments = [];
    var total = 0;
    for (var i = 0; i < convoyPath.length - 1; i++) {
      var d = convoyPath[i].distanceTo(convoyPath[i + 1]);
      segments.push({ start: convoyPath[i], end: convoyPath[i + 1], len: d, cumLen: total + d });
      total += d;
    }
    var dist = t * total;
    if (dist <= 0) return convoyPath[0].clone();
    for (var j = 0; j < segments.length; j++) {
      var seg = segments[j];
      var startDist = seg.cumLen - seg.len;
      if (dist <= seg.cumLen) {
        var alpha = (dist - startDist) / seg.len;
        return new THREE.Vector3().lerpVectors(seg.start, seg.end, alpha);
      }
    }
    return convoyPath[convoyPath.length - 1].clone();
  }

  function getPathDirection(t) {
    var eps = 0.01;
    var p1 = getPathPosition(t);
    var p2 = getPathPosition(Math.min(t + eps, 1));
    return new THREE.Vector3().subVectors(p2, p1).normalize();
  }

  // ---- Soldiers ----
  function buildSoldiers() {
    for (var i = 0; i < 20; i++) {
      var sGeo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
      var sMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
      var sMesh = new THREE.Mesh(sGeo, sMat);

      // Start on convoy path clustered around vehicles
      var pathT = 0.3 + Math.random() * 0.4;
      var pos = getPathPosition(pathT);
      pos.x += (Math.random() - 0.5) * 4;
      pos.z += (Math.random() - 0.5) * 4;
      pos.y = 0.8;
      sMesh.position.copy(pos);
      addObj(sMesh);

      soldiers.push({
        mesh: sMesh,
        hp: 80,
        dead: false,
        state: 'VEHICLE', // VEHICLE, DISMOUNTED, COVER, FIRE
        coverPos: null,
        fireTimer: 0 + Math.random() * 2,
        onVehicleIndex: Math.floor(i / 5)
      });
    }

    // APC gunner
    var gGeo = new THREE.BoxGeometry(0.5, 0.8, 0.4);
    var gMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var gMesh = new THREE.Mesh(gGeo, gMat);
    addObj(gMesh);
    apc.gunner = {
      mesh: gMesh,
      hp: 150,
      dead: false
    };
  }

  // ---- Allies ----
  function buildAllies() {
    var allyPositions = [
      new THREE.Vector3(-5, 0, 20),
      new THREE.Vector3(5, 0, 25),
      new THREE.Vector3(-10, 0, 30),
      new THREE.Vector3(10, 0, 18),
      new THREE.Vector3(0, 0, 35)
    ];

    for (var i = 0; i < 5; i++) {
      var aGeo = new THREE.BoxGeometry(0.6, 1.6, 0.4);
      var aMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
      var aMesh = new THREE.Mesh(aGeo, aMat);
      aMesh.position.copy(allyPositions[i]);
      aMesh.position.y = 0.8;
      addObj(aMesh);

      allies.push({
        mesh: aMesh,
        hp: 60,
        dead: false,
        state: 'WAIT', // WAIT, ATTACK, FALLBACK
        fireTimer: Math.random() * 3,
        basePos: allyPositions[i].clone()
      });
    }
  }

  // ---- Extraction marker ----
  function buildExtractionMarker() {
    var edgePos = new THREE.Vector3(0, 0, 90);

    var pts = [
      new THREE.Vector3(-3, 0, 0), new THREE.Vector3(3, 0, 0),
      new THREE.Vector3(0, 0, -3), new THREE.Vector3(0, 0, 3),
      new THREE.Vector3(-3, 3, 0), new THREE.Vector3(3, 3, 0),
      new THREE.Vector3(-3, 0, 0), new THREE.Vector3(-3, 3, 0),
      new THREE.Vector3(3, 0, 0), new THREE.Vector3(3, 3, 0),
      new THREE.Vector3(-3, 3, 0), new THREE.Vector3(3, 3, 0)
    ];

    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    var lines = new THREE.LineSegments(geo, mat);
    lines.position.copy(edgePos);
    addObj(lines);
    extractionMarker = { mesh: lines, pos: edgePos.clone() };
  }

  // ---- HUD ----
  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'guerrilla-hud';
    hudEl.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#00ff44;font-family:monospace;font-size:12px;padding:8px 14px;border:1px solid #00ff44;z-index:9999;white-space:nowrap;pointer-events:none;';
    document.body.appendChild(hudEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    var aliveAllies = 0;
    for (var i = 0; i < allies.length; i++) {
      if (!allies[i].dead) aliveAllies++;
    }
    var aliveEnemies = 0;
    for (var j = 0; j < soldiers.length; j++) {
      if (!soldiers[j].dead) aliveEnemies++;
    }
    if (apc && apc.gunner && !apc.gunner.dead) aliveEnemies++;

    var elapsed = Math.floor(gameTime);
    var remaining = Math.max(0, maxTime - elapsed);
    var mins = Math.floor(remaining / 60);
    var secs = remaining % 60;
    var timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

    var heloStr = '';
    if (!heloArrived) {
      var heloRemain = Math.max(0, Math.ceil(heloTime - gameTime));
      heloStr = ' [HELO: ARRIVING IN ' + heloRemain + 's]';
    } else {
      heloStr = ' [HELO: ARRIVED]';
    }

    var radioStr = radioCaptured ? (radioTransmitted ? 'TRANSMITTED' : 'CAPTURED') : 'NOT CAPTURED';

    hudEl.textContent = 'GUERRILLA WAR' +
      ' [TRUCKS DESTROYED: ' + trucksDestroyed + '/3]' +
      ' [RADIO: ' + radioStr + ']' +
      ' [ALLIES: ' + aliveAllies + '/5]' +
      ' [TIMER: ' + timeStr + ']' +
      ' [ENEMIES: ' + aliveEnemies + ']' +
      heloStr +
      ' [HP: ' + playerHP + ']';

    if (gameOver) {
      hudEl.textContent = gameWon ?
        '*** MISSION COMPLETE *** EXTRACTED SUCCESSFULLY' :
        '*** MISSION FAILED *** ' + (playerHP <= 0 ? 'KILLED IN ACTION' : heloArrived ? 'HELOS ARRIVED' : 'ALL ALLIES KIA');
      hudEl.style.color = gameWon ? '#00ff44' : '#ff2200';
    }
  }

  // ---- Shooting ----
  function fireRifle() {
    if (!active || gameOver || !canShoot) return;
    canShoot = false;
    shootCooldown = 0.3;

    if (!camera) return;

    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    raycaster.set(camera.position, dir);

    // Check enemies
    for (var i = 0; i < soldiers.length; i++) {
      var s = soldiers[i];
      if (s.dead) continue;
      var intersects = raycaster.intersectObject(s.mesh, false);
      if (intersects.length > 0) {
        damageEnemy(s, 25);
        spawnBulletTracer(camera.position, intersects[0].point);
        return;
      }
    }

    // Check APC gunner
    if (apc && apc.gunner && !apc.gunner.dead) {
      var gi = raycaster.intersectObject(apc.gunner.mesh, false);
      if (gi.length > 0) {
        // APC gunner is protected inside APC - reduced damage
        damageAPC(10);
        spawnBulletTracer(camera.position, gi[0].point);
        return;
      }
    }

    // Check trucks
    for (var t = 0; t < trucks.length; t++) {
      var tr = trucks[t];
      if (tr.dead) continue;
      var ti = raycaster.intersectObject(tr.body, false);
      if (ti.length > 0) {
        tr.hp -= 20;
        spawnBulletTracer(camera.position, ti[0].point);
        if (tr.hp <= 0) destroyTruck(t);
        return;
      }
    }

    // Check APC body (weak points - treads)
    if (apc && !apc.dead) {
      var ai = raycaster.intersectObject(apc.group.children[0], false);
      if (ai.length > 0) {
        // Direct rifle hits to APC body do minimal damage unless IED weakened
        var dmg = apc.iedHit ? 15 : 3;
        damageAPC(dmg);
        spawnBulletTracer(camera.position, ai[0].point);
      }
    }
  }

  function damageEnemy(s, dmg) {
    s.hp -= dmg;
    if (s.hp <= 0) {
      s.dead = true;
      s.mesh.visible = false;
    }
  }

  function damageAPC(dmg) {
    if (!apc || apc.dead) return;
    apc.hp -= dmg;
    if (apc.hp <= 0) destroyAPC();
  }

  function destroyTruck(idx) {
    var tr = trucks[idx];
    if (tr.dead) return;
    tr.dead = true;
    tr.group.traverse(function(child) {
      if (child.isMesh) {
        child.material.color.setHex(0x222222);
      }
    });
    trucksDestroyed++;
    // Make radio truck cargo capturable
    if (tr.isRadioTruck && !radioCaptured) {
      tr.radioAccessible = true;
    }
  }

  function destroyAPC() {
    if (!apc || apc.dead) return;
    apc.dead = true;
    apc.group.traverse(function(child) {
      if (child.isMesh) {
        child.material.color.setHex(0x111111);
      }
    });
    if (apc.gunner) {
      apc.gunner.dead = true;
      apc.gunner.mesh.visible = false;
    }
  }

  function spawnBulletTracer(from, to) {
    var pts = [from.clone(), to.clone()];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: 0xffff88 });
    var line = new THREE.LineSegments(geo, mat);
    addObj(line);
    bullets.push({ mesh: line, life: 0.1 });
  }

  // ---- Grenades ----
  function throwGrenade() {
    if (!active || gameOver) return;
    if (grenadeCooldown > 0) return;
    grenadeCooldown = 5;

    if (!camera || !playerPos) return;

    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var gGeo = new THREE.SphereGeometry(0.15, 6, 6);
    var gMat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var gMesh = new THREE.Mesh(gGeo, gMat);
    gMesh.position.copy(camera.position);
    addObj(gMesh);

    grenades.push({
      mesh: gMesh,
      vel: new THREE.Vector3(dir.x * 15, dir.y * 15 + 5, dir.z * 15),
      life: 1.5,
      exploded: false
    });
  }

  function explodeGrenade(g) {
    g.exploded = true;
    g.mesh.visible = false;
    var pos = g.mesh.position;

    // APC grenade hit
    if (apc && !apc.dead) {
      if (pos.distanceTo(apc.group.position) < 5) {
        apc.grenadeHits++;
        if (apc.grenadeHits >= 3 || (apc.iedHit && apc.grenadeHits >= 1)) {
          damageAPC(999);
        } else {
          damageAPC(40);
        }
      }
    }

    // Soldiers in radius
    for (var i = 0; i < soldiers.length; i++) {
      var s = soldiers[i];
      if (s.dead) continue;
      if (pos.distanceTo(s.mesh.position) < 6) {
        damageEnemy(s, 60 + Math.random() * 40);
      }
    }

    // Trucks
    for (var t = 0; t < trucks.length; t++) {
      var tr = trucks[t];
      if (tr.dead) continue;
      if (pos.distanceTo(tr.group.position) < 5) {
        tr.hp -= 50;
        if (tr.hp <= 0) destroyTruck(t);
      }
    }

    // Motorcycles
    for (var m = 0; m < motorcycles.length; m++) {
      var mo = motorcycles[m];
      if (mo.dead) continue;
      if (pos.distanceTo(mo.mesh.position) < 5) {
        mo.hp -= 80;
        if (mo.hp <= 0) {
          mo.dead = true;
          mo.mesh.visible = false;
        }
      }
    }
  }

  // ---- IEDs ----
  function placeIED() {
    if (!playerPos || iedCount >= maxIeds) return;

    // Check near road
    var nearRoad = false;
    for (var r = 0; r < roadSegments.length; r++) {
      if (playerPos.distanceTo(roadSegments[r].position) < 6) {
        nearRoad = true;
        break;
      }
    }
    if (!nearRoad) return;

    var iedGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    var iedMat = new THREE.MeshLambertMaterial({ color: 0x553311 });
    var iedMesh = new THREE.Mesh(iedGeo, iedMat);
    iedMesh.position.set(playerPos.x, 0.05, playerPos.z);
    addObj(iedMesh);

    ieds.push({
      mesh: iedMesh,
      pos: iedMesh.position.clone(),
      triggered: false,
      armed: true
    });
    iedCount++;
  }

  function checkIEDs() {
    for (var i = 0; i < ieds.length; i++) {
      var ied = ieds[i];
      if (!ied.armed || ied.triggered) continue;

      // Check all convoy vehicles
      var triggered = false;

      for (var t = 0; t < trucks.length; t++) {
        if (!trucks[t].dead && ied.pos.distanceTo(trucks[t].group.position) < 3) {
          triggered = true;
          break;
        }
      }

      if (!triggered && apc && !apc.dead) {
        if (ied.pos.distanceTo(apc.group.position) < 4) {
          triggered = true;
          apc.iedHit = true;
        }
      }

      if (!triggered) {
        for (var m = 0; m < motorcycles.length; m++) {
          if (!motorcycles[m].dead && ied.pos.distanceTo(motorcycles[m].mesh.position) < 2) {
            triggered = true;
            break;
          }
        }
      }

      if (triggered) {
        ied.triggered = true;
        ied.mesh.visible = false;
        triggerIEDExplosion(ied);
      }
    }
  }

  function triggerIEDExplosion(ied) {
    var pos = ied.pos;
    convoyAlerted = true;

    // Damage nearby trucks
    for (var t = 0; t < trucks.length; t++) {
      var tr = trucks[t];
      if (tr.dead) continue;
      var dist = pos.distanceTo(tr.group.position);
      if (dist < 6) {
        tr.hp -= 80;
        if (tr.hp <= 0) destroyTruck(t);
      }
    }

    // Damage APC (weak point hit)
    if (apc && !apc.dead) {
      var apcDist = pos.distanceTo(apc.group.position);
      if (apcDist < 7) {
        apc.iedHit = true;
        damageAPC(60);
      }
    }

    // Damage soldiers
    for (var i = 0; i < soldiers.length; i++) {
      var s = soldiers[i];
      if (s.dead) continue;
      if (pos.distanceTo(s.mesh.position) < 8) {
        damageEnemy(s, 70 + Math.random() * 30);
      }
    }

    // Dismount soldiers
    dismountSoldiers();
  }

  // ---- Convoy AI ----
  function updateConvoy(delta) {
    if (convoyAlerted) return; // Convoy stopped

    var pathLen = totalPathLength();
    var speedT = convoySpeed / pathLen;

    // Update motorcycles
    for (var m = 0; m < motorcycles.length; m++) {
      var mo = motorcycles[m];
      if (mo.dead) continue;
      mo.pathT += speedT * 1.2 * delta;
      if (mo.pathT > 1) {
        mo.pathT = 1;
      }
      var mPos = getPathPosition(mo.pathT);
      mPos.y = 0.35;
      mo.mesh.position.copy(mPos);
      var mDir = getPathDirection(mo.pathT);
      mo.mesh.rotation.y = Math.atan2(mDir.x, mDir.z);
    }

    // Update trucks
    for (var t = 0; t < trucks.length; t++) {
      var tr = trucks[t];
      if (tr.dead) continue;
      tr.pathT += speedT * delta;
      if (tr.pathT > 1) tr.pathT = 1;
      var tPos = getPathPosition(tr.pathT);
      tPos.y = 0;
      tr.group.position.copy(tPos);
      var tDir = getPathDirection(tr.pathT);
      tr.group.rotation.y = Math.atan2(tDir.x, tDir.z);
    }

    // Update APC
    if (apc && !apc.dead) {
      apc.pathT += speedT * 0.8 * delta;
      if (apc.pathT > 1) apc.pathT = 1;
      var aPos = getPathPosition(apc.pathT);
      aPos.y = 0;
      apc.group.position.copy(aPos);
      var aDir = getPathDirection(apc.pathT);
      apc.group.rotation.y = Math.atan2(aDir.x, aDir.z);

      // Update gunner position
      if (apc.gunner && !apc.gunner.dead) {
        apc.gunner.mesh.position.set(aPos.x, aPos.y + 2.5, aPos.z);
      }
    }

    // Update soldiers on vehicles
    for (var i = 0; i < soldiers.length; i++) {
      var s = soldiers[i];
      if (s.dead || s.state !== 'VEHICLE') continue;
      var vehicleIdx = s.onVehicleIndex;
      if (vehicleIdx < trucks.length && !trucks[vehicleIdx].dead) {
        var vp = trucks[vehicleIdx].group.position;
        s.mesh.position.set(
          vp.x + (Math.random() - 0.5) * 0.5,
          vp.y + 2.1,
          vp.z + (Math.random() - 0.5) * 0.5
        );
      }
    }

    // Check if player shoots - alert convoy
    // (handled in fireRifle via convoyAlerted flag when firing)
  }

  function dismountSoldiers() {
    for (var i = 0; i < soldiers.length; i++) {
      var s = soldiers[i];
      if (s.dead) continue;
      s.state = 'DISMOUNTED';
      // Move soldier off truck
      s.mesh.position.y = 0.8;
      // Find cover
      s.coverPos = findCover(s.mesh.position);
    }
  }

  function findCover(pos) {
    var bestDist = 999;
    var bestPos = null;
    for (var i = 0; i < trees.length; i++) {
      var tp = trees[i].pos;
      var d = pos.distanceTo(tp);
      if (d < bestDist && d > 2) {
        bestDist = d;
        bestPos = tp.clone();
        bestPos.y = 0.8;
      }
    }
    if (!bestPos) {
      bestPos = pos.clone();
      bestPos.x += (Math.random() - 0.5) * 10;
      bestPos.z += (Math.random() - 0.5) * 10;
      bestPos.y = 0.8;
    }
    return bestPos;
  }

  function updateSoldierAI(delta) {
    if (!convoyAlerted) return;
    if (!playerPos) return;

    for (var i = 0; i < soldiers.length; i++) {
      var s = soldiers[i];
      if (s.dead) continue;

      if (s.state === 'VEHICLE') {
        s.state = 'DISMOUNTED';
        s.coverPos = findCover(s.mesh.position);
      }

      if (s.state === 'DISMOUNTED') {
        // Move to cover
        if (s.coverPos) {
          var tocover = new THREE.Vector3().subVectors(s.coverPos, s.mesh.position);
          var dist = tocover.length();
          if (dist > 0.5) {
            tocover.normalize().multiplyScalar(Math.min(4 * delta, dist));
            s.mesh.position.add(tocover);
          } else {
            s.state = 'COVER';
          }
        } else {
          s.state = 'COVER';
        }
      }

      if (s.state === 'COVER') {
        // Fire at player
        s.fireTimer -= delta;
        if (s.fireTimer <= 0) {
          s.fireTimer = 1.5 + Math.random() * 2;
          var dist = s.mesh.position.distanceTo(playerPos);
          if (dist < 40) {
            soldierFireAtPlayer(s);
          }
        }
      }
    }

    // APC suppression
    if (apc && !apc.dead) {
      apc.suppressTimer -= delta;
      apc.fireTimer -= delta;

      // Rotate turret toward player
      var toPlayer = new THREE.Vector3().subVectors(playerPos, apc.group.position);
      var angle = Math.atan2(toPlayer.x, toPlayer.z);
      if (apc.turret) {
        apc.turret.rotation.y = angle - apc.group.rotation.y;
      }

      // APC fires at player periodically
      if (apc.fireTimer <= 0) {
        apc.fireTimer = 2 + Math.random() * 2;
        var aDist = apc.group.position.distanceTo(playerPos);
        if (aDist < 60) {
          var apcDmg = 20;
          if (isPlayerInCover()) apcDmg = 8;
          playerHP -= apcDmg;
        }
      }
    }
  }

  function soldierFireAtPlayer(s) {
    if (!playerPos) return;
    var dist = s.mesh.position.distanceTo(playerPos);
    var hitChance = Math.max(0.1, 0.6 - dist / 60);
    if (Math.random() < hitChance) {
      var dmg = 8 + Math.floor(Math.random() * 10);
      if (isPlayerInCover()) dmg = Math.floor(dmg * 0.4);
      playerHP -= dmg;
      playerHP = Math.max(0, playerHP);
    }
  }

  function isPlayerInCover() {
    if (!playerPos) return false;
    for (var i = 0; i < trees.length; i++) {
      if (playerPos.distanceTo(trees[i].pos) < trees[i].radius + 1) return true;
    }
    for (var j = 0; j < bushes.length; j++) {
      if (playerPos.distanceTo(bushes[j].pos) < bushes[j].radius + 1) return true;
    }
    return false;
  }

  // ---- Ally AI ----
  function updateAllyAI(delta) {
    for (var i = 0; i < allies.length; i++) {
      var a = allies[i];
      if (a.dead) continue;

      a.state = allyMode;

      if (a.state === 'FALLBACK') {
        // Move to base position
        var toBase = new THREE.Vector3().subVectors(a.basePos, a.mesh.position);
        var bd = toBase.length();
        if (bd > 1) {
          toBase.normalize().multiplyScalar(Math.min(3 * delta, bd));
          a.mesh.position.add(toBase);
        }
        continue;
      }

      if (a.state === 'ATTACK' && convoyAlerted) {
        // Find nearest living enemy
        var nearestEnemy = null;
        var nearestDist = 999;
        for (var j = 0; j < soldiers.length; j++) {
          var s = soldiers[j];
          if (s.dead) continue;
          var d = a.mesh.position.distanceTo(s.mesh.position);
          if (d < nearestDist) {
            nearestDist = d;
            nearestEnemy = s;
          }
        }

        if (nearestEnemy && nearestDist < 30) {
          a.fireTimer -= delta;
          if (a.fireTimer <= 0) {
            a.fireTimer = 1.2 + Math.random() * 1.5;
            damageEnemy(nearestEnemy, 15 + Math.random() * 10);
          }
        }

        // Also try to fire at APC
        if (apc && !apc.dead) {
          var apcDist = a.mesh.position.distanceTo(apc.group.position);
          if (apcDist < 25) {
            a.fireTimer -= delta * 0.5;
          }
        }
      }
    }
  }

  // ---- Radio capture ----
  function updateRadioCapture(delta) {
    if (radioCaptured || gameOver) return;

    // Find radio truck (truck index 1)
    var radioTruck = null;
    for (var t = 0; t < trucks.length; t++) {
      if (trucks[t].isRadioTruck) {
        radioTruck = trucks[t];
        break;
      }
    }

    if (!radioTruck) return;

    if (eHeld && playerPos) {
      var distToTruck = playerPos.distanceTo(radioTruck.group.position);
      if (distToTruck < 4 && radioTruck.dead) {
        // Capturing
        radioCapturing = true;
        radioHoldTime += delta;
        if (radioHoldTime >= 3) {
          radioCaptured = true;
          radioCapturing = false;
        }
      } else if (radioCaptured && extractionMarker) {
        // Transmit at jungle edge
        var distToExtract = playerPos.distanceTo(extractionMarker.pos);
        if (distToExtract < 5) {
          radioTransmitted = true;
        }
      } else {
        radioCapturing = false;
        radioHoldTime = 0;
      }
    } else {
      // If not near truck, check for IED placement
      if (eHeld && !radioCapturing) {
        placeIED();
      }
      radioCapturing = false;
      if (!eHeld) radioHoldTime = 0;
    }
  }

  // ---- Extraction check ----
  function checkExtraction() {
    if (!playerPos || !extractionMarker) return;
    var dist = playerPos.distanceTo(extractionMarker.pos);
    if (dist < 5 && !extracted) {
      extracted = true;
      // Check win conditions
      if (trucksDestroyed >= 2 && radioCaptured) {
        gameOver = true;
        gameWon = true;
      } else {
        // Extracted but didn't complete objectives
        // Can still win if conditions met later, but can't re-enter
      }
    }
  }

  // ---- Win/Lose checks ----
  function checkGameOver() {
    if (gameOver) return;

    // Player dead
    if (playerHP <= 0) {
      playerHP = 0;
      gameOver = true;
      gameWon = false;
      return;
    }

    // All allies dead
    var anyAlive = false;
    for (var i = 0; i < allies.length; i++) {
      if (!allies[i].dead) { anyAlive = true; break; }
    }
    if (!anyAlive) {
      gameOver = true;
      gameWon = false;
      return;
    }

    // Helos arrived
    if (heloArrived) {
      gameOver = true;
      gameWon = false;
      return;
    }

    // Win: extracted with objectives
    if (extracted && trucksDestroyed >= 2 && radioCaptured) {
      gameOver = true;
      gameWon = true;
    }
  }

  // ---- Update grenades ----
  function updateGrenades(delta) {
    for (var i = grenades.length - 1; i >= 0; i--) {
      var g = grenades[i];
      if (g.exploded) continue;
      g.life -= delta;
      // Gravity
      g.vel.y -= 9.8 * delta;
      g.mesh.position.addScaledVector(g.vel, delta);
      // Ground check
      if (g.mesh.position.y <= 0.1 || g.life <= 0) {
        g.mesh.position.y = Math.max(g.mesh.position.y, 0.1);
        explodeGrenade(g);
      }
    }
  }

  // ---- Update bullets ----
  function updateBullets(delta) {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.life -= delta;
      if (b.life <= 0) {
        scene.remove(b.mesh);
        var idx = gameObjects.indexOf(b.mesh);
        if (idx !== -1) gameObjects.splice(idx, 1);
        bullets.splice(i, 1);
      }
    }
  }

  // ---- Update cooldowns ----
  function updateCooldowns(delta) {
    if (grenadeCooldown > 0) grenadeCooldown -= delta;
    if (!canShoot) {
      shootCooldown -= delta;
      if (shootCooldown <= 0) canShoot = true;
    }
  }

  // ---- Update helo timer ----
  function updateHeloTimer(delta) {
    if (!heloArrived && gameTime >= heloTime) {
      heloArrived = true;
    }
  }

  // ---- Main update ----
  function update(delta, keys, pPos, pDir) {
    if (!active || gameOver) {
      if (gameOver) updateHUD();
      return;
    }

    gameTime += delta;

    // Store player position/direction
    if (pPos) playerPos = pPos;
    if (pDir) playerDir = pDir;

    // Use passed keys or internal keys
    var activeKeys = keys || inputKeys;

    // Alert convoy when player fires (tracked via fireRifle)
    // Handle E for IED or radio
    if (activeKeys['e'] || eHeld) {
      updateRadioCapture(delta);
    } else {
      radioCapturing = false;
    }

    updateHeloTimer(delta);
    updateConvoy(delta);
    checkIEDs();
    updateSoldierAI(delta);
    updateAllyAI(delta);
    updateGrenades(delta);
    updateBullets(delta);
    updateCooldowns(delta);
    checkExtraction();
    checkGameOver();
    updateHUD();

    // Animate extraction marker
    if (extractionMarker) {
      extractionMarker.mesh.rotation.y += delta;
    }
  }

  // ---- Init ----
  function init(scn, cam, rend) {
    if (active) return;
    scene = scn;
    camera = cam;
    renderer = rend;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onClick);
  }

  // ---- Reset ----
  function reset() {
    if (!active) return;

    // Remove all game objects from scene
    for (var i = 0; i < gameObjects.length; i++) {
      if (scene && gameObjects[i]) {
        scene.remove(gameObjects[i]);
        // Dispose geometry/material
        if (gameObjects[i].geometry) gameObjects[i].geometry.dispose();
        if (gameObjects[i].material) {
          if (Array.isArray(gameObjects[i].material)) {
            for (var j = 0; j < gameObjects[i].material.length; j++) {
              gameObjects[i].material[j].dispose();
            }
          } else {
            gameObjects[i].material.dispose();
          }
        }
      }
    }
    gameObjects = [];

    // Remove HUD
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
      hudEl = null;
    }

    // Remove event listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousedown', onClick);

    // Reset all state
    active = false;
    scene = null;
    camera = null;
    renderer = null;

    gameTime = 0;
    heloArrived = false;
    gameOver = false;
    gameWon = false;

    playerHP = 100;
    playerPos = null;
    playerDir = null;
    radioCapturing = false;
    radioHoldTime = 0;
    radioCaptured = false;
    radioTransmitted = false;
    extracted = false;

    keysDown = {};
    keyTimes = {};
    gPressed = false;
    wPressed = false;

    trees = [];
    bushes = [];
    roadSegments = [];
    trucks = [];
    apc = null;
    motorcycles = [];
    soldiers = [];
    allies = [];
    ieds = [];
    grenades = [];
    bullets = [];
    extractionMarker = null;

    convoyAlerted = false;
    convoyPath = [];
    convoyProgress = 0;
    trucksDestroyed = 0;
    allyMode = 'WAIT';

    iedCount = 0;
    grenadeCooldown = 0;
    canShoot = true;
    shootCooldown = 0;
    eHeld = false;
    inputKeys = {};
    raycaster = null;
  }

  return { init: init, update: update, reset: reset };
})();
