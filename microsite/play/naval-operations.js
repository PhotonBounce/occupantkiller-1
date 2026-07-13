window.NavalOperations = (function() {
  'use strict';

  // --- State ---
  var scene, camera, renderer;
  var keys = {};
  var clock;

  // Boat state
  var playerBoat = null;
  var boatHP = 400;
  var boatSpeed = 0;
  var boatHeading = 0; // degrees
  var aboardBoat = false;
  var boatRecoil = 0;
  var nKey = false, vKey = false;

  // Ammo
  var ammo = 48;
  var torps = 2;

  // Wake
  var wakeParticles = [];

  // Shells
  var shells = [];

  // Torpedoes
  var torpedoes = [];

  // Enemy boat
  var enemyBoat = null;
  var enemyPatrolAngle = 0;
  var enemyFireTimer = 3;
  var enemyShells = [];

  // Depth charges
  var depthCharges = [];

  // Mines
  var mines = [];

  // Boarding
  var boardingRope = null;
  var cqbMode = false;

  // Coastal assault
  var coastalMode = false;
  var amphibiousNPCs = [];

  // Smoke
  var smokeParticles = [];
  var smokeClock = 0;

  // Explosions
  var explosions = [];

  // HUD
  var hudElement = null;

  // Water
  var waterPlane = null;

  // Camera shake
  var cameraShake = 0;

  // Sinking
  var sinking = false;
  var sinkTimer = 0;

  // Key tracking for N+V combo
  var nDown = false;
  var vDown = false;
  var boatSpawned = false;

  // ---- Mesh Builders ----

  function buildPatrolBoat(color) {
    var group = new THREE.Group();

    // Hull
    var hullGeo = new THREE.BoxGeometry(8, 1.5, 3);
    var hullMat = new THREE.MeshLambertMaterial({ color: color || 0x445566 });
    var hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    // Cabin (front)
    var cabinGeo = new THREE.BoxGeometry(3, 2, 2.5);
    var cabinMat = new THREE.MeshLambertMaterial({ color: (color === 0x663333) ? 0x774444 : 0x556677 });
    var cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(2, 1.75, 0);
    group.add(cabin);

    // Mast
    var mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
    var mastMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(1, 3.5, 0);
    group.add(mast);

    // Gun mount
    var mountGeo = new THREE.BoxGeometry(1, 0.5, 0.5);
    var mountMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.set(-1, 1.0, 0);
    group.add(mount);

    // Barrel
    var barrelGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
    var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(-2.25, 1.0, 0);
    group.add(barrel);

    return group;
  }

  function buildMine() {
    var group = new THREE.Group();
    var sphereGeo = new THREE.SphereGeometry(1, 8, 6);
    var sphereMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    var sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);
    return group;
  }

  function buildChain(mineGroup) {
    var points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -6, 0)
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0x888888 });
    var line = new THREE.LineSegments(geo, mat);
    mineGroup.add(line);
  }

  function buildNPC() {
    var group = new THREE.Group();
    var bodyGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    group.add(body);
    return group;
  }

  function buildSmokeParticle(offset) {
    var geo = new THREE.SphereGeometry(0.4 + offset * 0.2, 5, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // ---- Explosion ----

  function spawnExplosion(pos, radius, duration) {
    var geo = new THREE.SphereGeometry(radius || 3, 8, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF6600, transparent: true, opacity: 0.9 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    explosions.push({ mesh: mesh, timer: 0, duration: duration || 0.5 });
  }

  // ---- Water ----

  function createWater() {
    var geo = new THREE.BoxGeometry(200, 0.2, 200);
    var mat = new THREE.MeshLambertMaterial({ color: 0x003355, transparent: true, opacity: 0.7 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0;
    scene.add(mesh);
    waterPlane = mesh;
  }

  // ---- Mines ----

  function createMines() {
    var positions = [
      [15, 20], [-20, 10], [30, -15], [-10, -25]
    ];
    for (var i = 0; i < positions.length; i++) {
      var mineGroup = buildMine();
      mineGroup.position.set(positions[i][0], 0.5, positions[i][1]);
      buildChain(mineGroup);
      scene.add(mineGroup);
      mines.push({ mesh: mineGroup, active: true });
    }
  }

  // ---- Enemy Boat ----

  function createEnemyBoat() {
    var group = buildPatrolBoat(0x663333);
    group.position.set(40, 0.75, 0);
    scene.add(group);
    enemyBoat = { mesh: group, hp: 400, active: true, fireTimer: 3 + Math.random() };
  }

  // ---- HUD ----

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%)',
      'color:#00FF88',
      'font-family:monospace',
      'font-size:14px',
      'background:rgba(0,0,0,0.6)',
      'padding:6px 12px',
      'border-radius:4px',
      'display:none',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (!hudElement) return;
    if (aboardBoat && playerBoat) {
      hudElement.style.display = 'block';
      var spd = Math.round(Math.abs(boatSpeed) * 12);
      var hdg = Math.round(((boatHeading * 180 / Math.PI) % 360 + 360) % 360);
      hudElement.textContent = 'NAVAL [SPD: ' + spd + 'kt] [HEADING: ' + hdg + '°] [BOAT HP: ' + Math.max(0, Math.round(boatHP)) + '] [AMMO: ' + ammo + ' | TORP: ' + torps + ']';
    } else {
      hudElement.style.display = 'none';
    }
  }

  // ---- Wake Particles ----

  function spawnWake() {
    if (!playerBoat || !aboardBoat) return;
    for (var side = -1; side <= 1; side += 2) {
      var geo = new THREE.SphereGeometry(0.3, 4, 3);
      var mat = new THREE.MeshBasicMaterial({ color: 0xAAEEFF, transparent: true, opacity: 0.8 });
      var mesh = new THREE.Mesh(geo, mat);
      var wx = playerBoat.mesh.position.x + Math.cos(boatHeading + Math.PI) * 4;
      var wz = playerBoat.mesh.position.z + Math.sin(boatHeading + Math.PI) * 4 + side * 1;
      mesh.position.set(wx, 0.3, wz);
      scene.add(mesh);
      wakeParticles.push({ mesh: mesh, life: 1.5, mat: mat });
    }
  }

  // ---- Spawn Player Boat ----

  function spawnPlayerBoat() {
    if (playerBoat) return;
    var group = buildPatrolBoat(0x445566);
    var pos = camera ? camera.position.clone() : new THREE.Vector3(0, 0.75, 0);
    pos.y = 0.75;
    group.position.copy(pos);
    scene.add(group);
    playerBoat = { mesh: group, active: true };
    aboardBoat = true;
    boatHP = 400;
    boatSpeed = 0;
    boatHeading = 0;
    ammo = 48;
    torps = 2;
    sinking = false;
    boatSpawned = true;
  }

  // ---- Fire Shell ----

  function fireShell() {
    if (!aboardBoat || !playerBoat || ammo <= 0) return;
    ammo--;
    // Recoil
    boatRecoil = 0.5;

    var fwd = new THREE.Vector3(Math.cos(boatHeading), 0, Math.sin(boatHeading));
    var startPos = playerBoat.mesh.position.clone().add(fwd.clone().multiplyScalar(4.5));
    startPos.y = 1.0;

    var geo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 5);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFFCC00 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.copy(startPos);
    scene.add(mesh);

    shells.push({
      mesh: mesh,
      velocity: fwd.clone().multiplyScalar(40),
      distance: 0,
      active: true
    });
  }

  // ---- Fire Torpedo ----

  function fireTorpedo() {
    if (!aboardBoat || !playerBoat || torps <= 0 || !enemyBoat || !enemyBoat.active) return;
    torps--;

    var dir = new THREE.Vector3();
    dir.subVectors(enemyBoat.mesh.position, playerBoat.mesh.position).normalize();
    dir.y = 0;

    var startPos = playerBoat.mesh.position.clone();
    startPos.y = 0;

    var geo = new THREE.CylinderGeometry(0.2, 0.2, 2, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.copy(startPos);
    scene.add(mesh);

    torpedoes.push({
      mesh: mesh,
      velocity: dir.clone().multiplyScalar(60),
      active: true
    });
  }

  // ---- Drop Depth Charge ----

  function dropDepthCharge() {
    if (!aboardBoat || !playerBoat) return;
    var sternPos = playerBoat.mesh.position.clone();
    var back = new THREE.Vector3(Math.cos(boatHeading + Math.PI), 0, Math.sin(boatHeading + Math.PI));
    sternPos.add(back.multiplyScalar(4));
    sternPos.y = 0.5;

    var geo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    var mat = new THREE.MeshLambertMaterial({ color: 0x886644 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(sternPos);
    scene.add(mesh);

    depthCharges.push({ mesh: mesh, active: true, timer: 0 });
  }

  // ---- Board Operation ----

  function attemptBoard() {
    if (!playerBoat || !enemyBoat || !enemyBoat.active) return;
    var dist = playerBoat.mesh.position.distanceTo(enemyBoat.mesh.position);
    if (dist > 4) return;

    // Rope
    var points = [playerBoat.mesh.position.clone(), enemyBoat.mesh.position.clone()];
    var geo = new THREE.BufferGeometry().setFromPoints(points);
    var mat = new THREE.LineBasicMaterial({ color: 0xCCAA66 });
    boardingRope = new THREE.LineSegments(geo, mat);
    scene.add(boardingRope);

    // Teleport
    if (camera) {
      camera.position.copy(enemyBoat.mesh.position);
      camera.position.y += 2;
    }
    aboardBoat = false;
    cqbMode = true;

    // Remove rope after 1 second (flag for update)
    boardingRope.userData.removeTimer = 1.0;
  }

  // ---- Coastal Assault ----

  function triggerCoastalAssault() {
    if (!aboardBoat || !playerBoat) return;
    coastalMode = true;
    // Spawn 4 NPCs at stern
    for (var i = 0; i < 4; i++) {
      var npc = buildNPC();
      var angle = boatHeading + Math.PI + (i - 1.5) * 0.3;
      var dist2 = 3 + i * 0.5;
      npc.position.set(
        playerBoat.mesh.position.x + Math.cos(angle) * dist2,
        0.75,
        playerBoat.mesh.position.z + Math.sin(angle) * dist2
      );
      scene.add(npc);
      amphibiousNPCs.push({ mesh: npc, offset: i });
    }
  }

  // ---- Smoke Column ----

  function updateSmoke(dt) {
    if (!playerBoat || boatHP >= 200) {
      // Remove smoke if healed
      for (var i = smokeParticles.length - 1; i >= 0; i--) {
        scene.remove(smokeParticles[i].mesh);
      }
      smokeParticles = [];
      return;
    }
    smokeClock += dt;
    if (smokeClock > 0.3 && smokeParticles.length < 9) {
      smokeClock = 0;
      for (var j = 0; j < 3; j++) {
        var sp = buildSmokeParticle(j);
        sp.position.copy(playerBoat.mesh.position);
        sp.position.y += 1.5 + j * 1.2;
        scene.add(sp);
        smokeParticles.push({ mesh: sp, life: 2.0 + j * 0.5, mat: sp.material });
      }
    }
    for (var k = smokeParticles.length - 1; k >= 0; k--) {
      var s = smokeParticles[k];
      s.life -= dt;
      s.mesh.position.y += dt * 2;
      s.mat.opacity = Math.max(0, s.life / 2.5) * 0.6;
      if (s.life <= 0) {
        scene.remove(s.mesh);
        smokeParticles.splice(k, 1);
      }
    }
  }

  // ---- Enemy AI ----

  function updateEnemyBoat(dt) {
    if (!enemyBoat || !enemyBoat.active) return;

    enemyPatrolAngle += dt * 0.4;
    var ex = Math.cos(enemyPatrolAngle) * 40;
    var ez = Math.sin(enemyPatrolAngle) * 40;
    enemyBoat.mesh.position.set(ex, 0.75, ez);
    enemyBoat.mesh.rotation.y = -enemyPatrolAngle + Math.PI / 2;

    if (!aboardBoat || !playerBoat) return;

    enemyBoat.fireTimer -= dt;
    if (enemyBoat.fireTimer <= 0) {
      enemyBoat.fireTimer = 3 + Math.random();
      fireEnemyShell();
    }
  }

  function fireEnemyShell() {
    if (!playerBoat) return;
    var dir = new THREE.Vector3();
    dir.subVectors(playerBoat.mesh.position, enemyBoat.mesh.position).normalize();
    dir.y = 0;

    var startPos = enemyBoat.mesh.position.clone();
    startPos.y = 1.0;

    var geo = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 5);
    var mat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.copy(startPos);
    scene.add(mesh);

    enemyShells.push({
      mesh: mesh,
      velocity: dir.clone().multiplyScalar(30),
      distance: 0,
      active: true
    });
  }

  // ---- Key Handlers ----

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'KeyN') nDown = true;
    if (e.code === 'KeyV') vDown = true;
    if (nDown && vDown && !boatSpawned) spawnPlayerBoat();

    if (e.code === 'Space' && aboardBoat) fireShell();
    if (e.code === 'KeyT' && aboardBoat) fireTorpedo();
    if (e.code === 'KeyB' && aboardBoat) attemptBoard();
    if (e.code === 'KeyC' && aboardBoat) triggerCoastalAssault();
    if (e.code === 'KeyD' && aboardBoat) dropDepthCharge();
  }

  function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'KeyN') nDown = false;
    if (e.code === 'KeyV') vDown = false;
  }

  // ---- Init ----

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    clock = new THREE.Clock();

    createWater();
    createMines();
    createEnemyBoat();
    createHUD();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Ambient + directional light
    var ambient = new THREE.AmbientLight(0x446688, 0.8);
    scene.add(ambient);
    var sun = new THREE.DirectionalLight(0xFFEECC, 1.2);
    sun.position.set(50, 80, 30);
    scene.add(sun);
  }

  // ---- Update ----

  function update(dt) {
    if (!scene) return;
    if (!dt || dt <= 0) dt = 0.016;

    // ---- Boat Controls ----
    if (aboardBoat && playerBoat && !sinking) {
      var accel = 0;
      if (keys['KeyW']) accel = 1;
      if (keys['KeyS']) accel = -0.5;
      boatSpeed += (accel * 5 - boatSpeed * 0.98) * dt;
      boatSpeed = Math.max(-2, Math.min(boatSpeed, 8));

      var turnRate = 0;
      if (keys['KeyA']) turnRate = 1.2;
      if (keys['KeyD']) turnRate = -1.2;
      boatHeading += turnRate * dt;

      // Bank/tilt
      playerBoat.mesh.rotation.z = -turnRate * 0.15;
      playerBoat.mesh.rotation.x = accel * 0.07;
      playerBoat.mesh.rotation.y = -boatHeading;

      // Move boat
      playerBoat.mesh.position.x += Math.cos(boatHeading) * boatSpeed * dt;
      playerBoat.mesh.position.z += Math.sin(boatHeading) * boatSpeed * dt;
      playerBoat.mesh.position.y = 0.75;

      // Recoil
      if (boatRecoil > 0) {
        var back2 = new THREE.Vector3(Math.cos(boatHeading + Math.PI), 0, Math.sin(boatHeading + Math.PI));
        playerBoat.mesh.position.add(back2.multiplyScalar(boatRecoil * dt * 10));
        boatRecoil -= dt * 5;
        if (boatRecoil < 0) boatRecoil = 0;
      }

      // Camera follow
      if (camera) {
        var idealCamPos = playerBoat.mesh.position.clone();
        idealCamPos.y += 6;
        idealCamPos.x -= Math.cos(boatHeading) * 12;
        idealCamPos.z -= Math.sin(boatHeading) * 12;
        camera.position.lerp(idealCamPos, dt * 3);
        camera.lookAt(playerBoat.mesh.position);
      }

      // Wake
      if (Math.abs(boatSpeed) > 0.5) spawnWake();

      // Coastal halt
      if (coastalMode && Math.abs(boatSpeed) > 0.2) {
        boatSpeed *= 0.8;
        if (Math.abs(boatSpeed) < 0.5) {
          boatSpeed = 0;
          aboardBoat = false; // disembark
        }
      }
    }

    // Sinking
    if (sinking && playerBoat) {
      sinkTimer += dt;
      playerBoat.mesh.position.y = 0.75 - (sinkTimer / 5) * 8.75;
      if (sinkTimer >= 5) {
        scene.remove(playerBoat.mesh);
        playerBoat = null;
        sinking = false;
        aboardBoat = false;
      }
    }

    // ---- Wake Update ----
    for (var wi = wakeParticles.length - 1; wi >= 0; wi--) {
      var w = wakeParticles[wi];
      w.life -= dt;
      w.mat.opacity = Math.max(0, w.life / 1.5) * 0.8;
      if (w.life <= 0) {
        scene.remove(w.mesh);
        wakeParticles.splice(wi, 1);
      }
    }

    // ---- Shell Update ----
    for (var si = shells.length - 1; si >= 0; si--) {
      var sh = shells[si];
      if (!sh.active) { scene.remove(sh.mesh); shells.splice(si, 1); continue; }
      var move = sh.velocity.clone().multiplyScalar(dt);
      sh.mesh.position.add(move);
      sh.distance += move.length();

      // Hit enemy
      if (enemyBoat && enemyBoat.active) {
        var d = sh.mesh.position.distanceTo(enemyBoat.mesh.position);
        if (d < 3) {
          spawnExplosion(sh.mesh.position.clone(), 3, 0.4);
          enemyBoat.hp -= 80;
          if (enemyBoat.hp <= 0) {
            spawnExplosion(enemyBoat.mesh.position.clone(), 8, 1.0);
            scene.remove(enemyBoat.mesh);
            enemyBoat.active = false;
          }
          sh.active = false; continue;
        }
      }

      if (sh.distance >= 80) {
        spawnExplosion(sh.mesh.position.clone(), 2, 0.3);
        sh.active = false;
      }
    }

    // ---- Enemy Shell Update ----
    for (var esi = enemyShells.length - 1; esi >= 0; esi--) {
      var es = enemyShells[esi];
      if (!es.active) { scene.remove(es.mesh); enemyShells.splice(esi, 1); continue; }
      var emove = es.velocity.clone().multiplyScalar(dt);
      es.mesh.position.add(emove);
      es.distance += emove.length();

      if (playerBoat && aboardBoat) {
        var ed = es.mesh.position.distanceTo(playerBoat.mesh.position);
        if (ed < 3) {
          spawnExplosion(es.mesh.position.clone(), 3, 0.4);
          boatHP -= 40;
          if (boatHP <= 0 && !sinking) { sinking = true; sinkTimer = 0; }
          es.active = false; continue;
        }
      }
      if (es.distance >= 80) {
        spawnExplosion(es.mesh.position.clone(), 2, 0.3);
        es.active = false;
      }
    }

    // ---- Torpedo Update ----
    for (var ti = torpedoes.length - 1; ti >= 0; ti--) {
      var torp = torpedoes[ti];
      if (!torp.active) { scene.remove(torp.mesh); torpedoes.splice(ti, 1); continue; }
      torp.mesh.position.add(torp.velocity.clone().multiplyScalar(dt));
      torp.mesh.position.y = 0;

      if (enemyBoat && enemyBoat.active) {
        var td = torp.mesh.position.distanceTo(enemyBoat.mesh.position);
        if (td < 4) {
          spawnExplosion(torp.mesh.position.clone(), 15, 1.5);
          enemyBoat.hp = 0;
          scene.remove(enemyBoat.mesh);
          enemyBoat.active = false;
          torp.active = false; continue;
        }
      }
      // Auto-expire
      torp.mesh.userData.life = (torp.mesh.userData.life || 0) + dt;
      if (torp.mesh.userData.life > 5) torp.active = false;
    }

    // ---- Depth Charge Update ----
    for (var di = depthCharges.length - 1; di >= 0; di--) {
      var dc = depthCharges[di];
      if (!dc.active) { scene.remove(dc.mesh); depthCharges.splice(di, 1); continue; }
      dc.timer += dt;
      dc.mesh.position.y -= dt * 3; // sink

      if (dc.mesh.position.y <= -8) {
        spawnExplosion(dc.mesh.position.clone(), 20, 2.0);
        cameraShake = 0.8;
        dc.active = false;
      }
    }

    // ---- Mine Collision ----
    if (playerBoat && aboardBoat) {
      for (var mi = 0; mi < mines.length; mi++) {
        var mine = mines[mi];
        if (!mine.active) continue;
        var md = playerBoat.mesh.position.distanceTo(mine.mesh.position);
        if (md < 2.5) {
          spawnExplosion(mine.mesh.position.clone(), 5, 0.8);
          boatHP -= 100;
          mine.active = false;
          scene.remove(mine.mesh);
          if (boatHP <= 0 && !sinking) { sinking = true; sinkTimer = 0; }
        }
      }
    }

    // ---- Enemy Boat Update ----
    updateEnemyBoat(dt);

    // ---- Smoke ----
    updateSmoke(dt);

    // ---- NPC Follow ----
    if (coastalMode && amphibiousNPCs.length > 0 && playerBoat) {
      for (var ni = 0; ni < amphibiousNPCs.length; ni++) {
        var npc = amphibiousNPCs[ni];
        var col = ni % 2;
        var row = Math.floor(ni / 2);
        var targetX = playerBoat.mesh.position.x + Math.cos(boatHeading + Math.PI) * (3 + row * 2) + Math.cos(boatHeading + Math.PI / 2) * (col - 0.5) * 2;
        var targetZ = playerBoat.mesh.position.z + Math.sin(boatHeading + Math.PI) * (3 + row * 2) + Math.sin(boatHeading + Math.PI / 2) * (col - 0.5) * 2;
        npc.mesh.position.x += (targetX - npc.mesh.position.x) * dt * 2;
        npc.mesh.position.z += (targetZ - npc.mesh.position.z) * dt * 2;
        npc.mesh.position.y = 0.75;
      }
    }

    // ---- Boarding Rope ----
    if (boardingRope) {
      boardingRope.userData.removeTimer -= dt;
      if (boardingRope.userData.removeTimer <= 0) {
        scene.remove(boardingRope);
        boardingRope = null;
      }
    }

    // ---- Explosions ----
    for (var ei = explosions.length - 1; ei >= 0; ei--) {
      var exp = explosions[ei];
      exp.timer += dt;
      var prog = exp.timer / exp.duration;
      exp.mesh.material.opacity = 1 - prog;
      exp.mesh.scale.setScalar(1 + prog * 1.5);
      if (exp.timer >= exp.duration) {
        scene.remove(exp.mesh);
        explosions.splice(ei, 1);
      }
    }

    // ---- Camera Shake ----
    if (cameraShake > 0 && camera) {
      camera.position.x += (Math.random() - 0.5) * cameraShake;
      camera.position.y += (Math.random() - 0.5) * cameraShake;
      cameraShake -= dt * 3;
      if (cameraShake < 0) cameraShake = 0;
    }

    // ---- HUD ----
    updateHUD();
  }

  // ---- Reset ----

  function reset() {
    if (playerBoat) { scene.remove(playerBoat.mesh); playerBoat = null; }
    if (enemyBoat) { scene.remove(enemyBoat.mesh); }
    if (waterPlane) { scene.remove(waterPlane); waterPlane = null; }
    if (hudElement) { hudElement.style.display = 'none'; }

    for (var i = 0; i < wakeParticles.length; i++) scene.remove(wakeParticles[i].mesh);
    for (var j = 0; j < shells.length; j++) scene.remove(shells[j].mesh);
    for (var k = 0; k < torpedoes.length; k++) scene.remove(torpedoes[k].mesh);
    for (var l = 0; l < depthCharges.length; l++) scene.remove(depthCharges[l].mesh);
    for (var m = 0; m < mines.length; m++) scene.remove(mines[m].mesh);
    for (var n2 = 0; n2 < enemyShells.length; n2++) scene.remove(enemyShells[n2].mesh);
    for (var o = 0; o < explosions.length; o++) scene.remove(explosions[o].mesh);
    for (var p = 0; p < smokeParticles.length; p++) scene.remove(smokeParticles[p].mesh);
    for (var q = 0; q < amphibiousNPCs.length; q++) scene.remove(amphibiousNPCs[q].mesh);
    if (boardingRope) scene.remove(boardingRope);

    wakeParticles = [];
    shells = [];
    torpedoes = [];
    depthCharges = [];
    mines = [];
    enemyShells = [];
    explosions = [];
    smokeParticles = [];
    amphibiousNPCs = [];
    boardingRope = null;

    aboardBoat = false;
    boatHP = 400;
    boatSpeed = 0;
    boatHeading = 0;
    ammo = 48;
    torps = 2;
    nDown = false;
    vDown = false;
    boatSpawned = false;
    sinking = false;
    sinkTimer = 0;
    coastalMode = false;
    cqbMode = false;
    cameraShake = 0;
    smokeClock = 0;
    enemyPatrolAngle = 0;

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  }

  return { init: init, update: update, reset: reset };
})();
