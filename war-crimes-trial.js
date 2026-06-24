window.WarCrimesTrial = (function () {
  'use strict';

  // State
  var scene, camera;
  var active = false;
  var sceneObjects = [];
  var enemies = [];
  var friendlyNPCs = [];
  var breachPoints = [];
  var bullets = [];
  var hudEl = null;
  var notifEl = null;
  var lastWKey = 0;
  var keys = {};
  var playerVelocity = { x: 0, z: 0 };
  var PLAYER_SPEED = 8;
  var ENEMY_SPEED = 1.5;
  var BULLET_SPEED = 30;
  var SHOOT_COOLDOWN = 0.3;
  var shootTimer = 0;
  var judgesAlive = 3;
  var judgesTotal = 3;
  var breachSealed = 0;
  var breachTotal = 3;
  var missionFailed = false;
  var missionSuccess = false;
  var spawnTimer = 0;
  var SPAWN_INTERVAL = 4;
  var clock = null;
  var raycaster = null;
  var mouse = { x: 0, y: 0 };
  var pointerLocked = false;
  var yaw = 0;
  var pitch = 0;

  // ---- helpers ----

  function tracked(obj) {
    scene.add(obj);
    sceneObjects.push(obj);
    return obj;
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return tracked(mesh);
  }

  function makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 8, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return tracked(mesh);
  }

  function makeCylinder(rt, rb, h, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return tracked(mesh);
  }

  function makeCone(r, h, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, 8);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    return tracked(mesh);
  }

  function makeWireBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    var lines = new THREE.LineSegments(edges, mat);
    lines.position.set(x, y, z);
    return tracked(lines);
  }

  function notify(msg, duration) {
    if (!notifEl) return;
    notifEl.textContent = msg;
    notifEl.style.display = 'block';
    clearTimeout(notifEl._timer);
    notifEl._timer = setTimeout(function () {
      notifEl.style.display = 'none';
    }, duration || 2000);
  }

  // ---- HUD ----

  function createHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'wct-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:12px',
      'left:12px',
      'color:#fff',
      'font:bold 14px monospace',
      'text-shadow:1px 1px 2px #000',
      'pointer-events:none',
      'z-index:9999',
      'display:none',
      'line-height:1.6'
    ].join(';');
    document.body.appendChild(hudEl);

    notifEl = document.createElement('div');
    notifEl.id = 'wct-notif';
    notifEl.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'color:#ff0',
      'font:bold 20px monospace',
      'text-shadow:2px 2px 4px #000',
      'pointer-events:none',
      'z-index:10000',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(notifEl);
  }

  function updateHUD() {
    if (!hudEl) return;
    hudEl.innerHTML =
      'JUDGES ALIVE: ' + judgesAlive + '/' + judgesTotal + '<br>' +
      'BREACH POINTS SEALED: ' + breachSealed + '/' + breachTotal + '<br>' +
      '<span style="font-size:11px;color:#aaa">[WASD] Move  [Click] Shoot  [W+T] Toggle</span>';
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) hudEl.parentNode.removeChild(hudEl);
    if (notifEl && notifEl.parentNode) notifEl.parentNode.removeChild(notifEl);
    hudEl = null;
    notifEl = null;
  }

  // ---- Build courtroom ----

  function buildCourtroom() {
    // Floor
    makeBox(40, 0.4, 30, 0x8B7355, 0, -0.2, 0);
    // Ceiling
    makeBox(40, 0.4, 30, 0xDDCCBB, 0, 6, 0);
    // Back wall
    makeBox(40, 7, 0.4, 0xCCBBA0, 0, 3.3, -15);
    // Front wall
    makeBox(40, 7, 0.4, 0xCCBBA0, 0, 3.3, 15);
    // Left wall
    makeBox(0.4, 7, 30, 0xCCBBA0, -20, 3.3, 0);
    // Right wall
    makeBox(0.4, 7, 30, 0xCCBBA0, 20, 3.3, 0);

    // Judge bench platform (elevated)
    makeBox(14, 0.8, 3, 0x5C3A1E, 0, 0.4, -10);
    // Bench top
    makeBox(14, 0.5, 1.5, 0x3B2007, 0, 1.05, -10);

    // Three judge figures (gray robes)
    var judgePositions = [[-4, 0, -10], [0, 0, -10], [4, 0, -10]];
    for (var ji = 0; ji < judgePositions.length; ji++) {
      var jp = judgePositions[ji];
      var judge = createFriendlyNPC(jp[0], jp[2], 0x333333, 'judge');
      judge.userData.type = 'judge';
    }

    // Witness stand
    makeBox(2.5, 1, 2.5, 0x5C3A1E, -8, 0.5, -5);
    makeBox(2.5, 0.3, 2.5, 0x3B2007, -8, 1.15, -5);
    // Witness NPC
    createFriendlyNPC(-8, -5, 0x555555, 'witness');

    // Gallery seating - rows of flat boxes
    var rowZ = [2, 4, 6, 8];
    for (var ri = 0; ri < rowZ.length; ri++) {
      makeBox(18, 0.3, 1, 0x7B5E3A, 0, 0.15, rowZ[ri]);
      makeBox(18, 0.6, 0.2, 0x5C3A1E, 0, 0.45, rowZ[ri] - 0.5);
    }

    // Scales of justice statue (center right area)
    makeBox(0.15, 2.5, 0.15, 0xD4AF37, 10, 1.25, -3);  // pole
    makeBox(2, 0.1, 0.1, 0xD4AF37, 10, 2.5, -3);        // crossbar
    makeSphere(0.3, 0xD4AF37, 10, 2.7, -3);              // top orb
    makeSphere(0.25, 0xD4AF37, 9.1, 2.0, -3);            // left pan
    makeSphere(0.25, 0xD4AF37, 10.9, 2.0, -3);           // right pan

    // Security barriers (concrete-colored boxes)
    makeBox(3, 1.2, 0.4, 0x888888, -6, 0.6, 1);
    makeBox(3, 1.2, 0.4, 0x888888, 6, 0.6, 1);
    makeBox(0.4, 1.2, 3, 0x888888, -9, 0.6, -2);
    makeBox(0.4, 1.2, 3, 0x888888, 9, 0.6, -2);

    // Glass-encased defendant box (wireframe to simulate glass)
    makeWireBox(2.5, 2.5, 2.5, 0x88CCFF, 5, 1.25, -5);
    // Defendant inside (orange jumpsuit)
    var defGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    var defMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
    var defendant = new THREE.Mesh(defGeo, defMat);
    defendant.position.set(5, 0.6, -5);
    tracked(defendant);

    // Lights
    var ambient = new THREE.AmbientLight(0xffffff, 0.6);
    tracked(ambient);
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    tracked(dirLight);
    var pointLight = new THREE.PointLight(0xFFEECC, 0.6, 25);
    pointLight.position.set(0, 5, 0);
    tracked(pointLight);
  }

  // ---- NPCs ----

  function createFriendlyNPC(x, z, color, type) {
    var group = new THREE.Group();
    // Body
    var bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.4);
    var mat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 1.35;
    group.add(body);
    // Head
    var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    var head = new THREE.Mesh(headGeo, mat);
    head.position.y = 2.0;
    group.add(head);
    group.position.set(x, 0, z);
    group.userData.hp = 1;
    group.userData.type = type;
    group.userData.friendly = true;
    scene.add(group);
    sceneObjects.push(group);
    friendlyNPCs.push(group);
    return group;
  }

  // ---- Breach points ----

  function setupBreachPoints() {
    var bpDefs = [
      { x: -19.5, z: 0,   label: 'LEFT DOOR' },
      { x: 19.5,  z: 0,   label: 'RIGHT DOOR' },
      { x: 0,     z: 14.5, label: 'MAIN ENTRANCE' }
    ];
    for (var bi = 0; bi < bpDefs.length; bi++) {
      var def = bpDefs[bi];
      var indicatorGeo = new THREE.BoxGeometry(1.5, 3, 0.3);
      var indicatorMat = new THREE.MeshLambertMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 });
      var indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
      indicator.position.set(def.x, 1.5, def.z);
      tracked(indicator);
      breachPoints.push({
        x: def.x,
        z: def.z,
        label: def.label,
        sealed: false,
        indicator: indicator,
        flashTimer: 0,
        enemyCount: 0
      });
    }
  }

  // ---- Enemies ----

  function spawnEnemy(bpIndex) {
    var bp = breachPoints[bpIndex];
    if (!bp || bp.sealed) return;

    var group = new THREE.Group();
    var armorColor = 0x2A2A2A;
    var helmetColor = 0x1A1A1A;

    // Armored body (bigger than regular figure)
    var bodyGeo = new THREE.BoxGeometry(0.8, 1.1, 0.5);
    var bodyMat = new THREE.MeshLambertMaterial({ color: armorColor });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.35;
    group.add(body);

    // Helmet
    var helmGeo = new THREE.BoxGeometry(0.5, 0.4, 0.5);
    var helmMat = new THREE.MeshLambertMaterial({ color: helmetColor });
    var helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 2.05;
    group.add(helm);

    // Rifle (box)
    var rifleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    var rifleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    var rifle = new THREE.Mesh(rifleGeo, rifleMat);
    rifle.position.set(0.5, 1.35, -0.4);
    group.add(rifle);

    // Shoulder armor cones
    var shoulderGeo = new THREE.ConeGeometry(0.2, 0.3, 6);
    var shoulderMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    leftShoulder.position.set(-0.55, 1.65, 0);
    leftShoulder.rotation.z = Math.PI / 2;
    group.add(leftShoulder);
    var rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
    rightShoulder.position.set(0.55, 1.65, 0);
    rightShoulder.rotation.z = -Math.PI / 2;
    group.add(rightShoulder);

    group.position.set(bp.x, 0, bp.z);
    group.userData.hp = 3;
    group.userData.bpIndex = bpIndex;
    group.userData.speed = ENEMY_SPEED + Math.random() * 0.5;
    group.userData.shootTimer = Math.random() * 2;
    group.userData.dead = false;
    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    bp.enemyCount++;
  }

  // ---- Bullets ----

  function fireBullet() {
    if (!active || missionFailed || missionSuccess) return;
    var dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    dir.normalize();

    var geo = new THREE.SphereGeometry(0.06, 4, 4);
    var mat = new THREE.MeshLambertMaterial({ color: 0xFFFF00, emissive: 0xFFAA00 });
    var bullet = new THREE.Mesh(geo, mat);
    bullet.position.copy(camera.position);
    bullet.userData.velocity = dir.clone().multiplyScalar(BULLET_SPEED);
    bullet.userData.life = 3.0;
    scene.add(bullet);
    sceneObjects.push(bullet);
    bullets.push(bullet);
  }

  // ---- Input ----

  function onKeyDown(e) {
    if (!active && e.key !== 'w' && e.key !== 'W') return;
    keys[e.key.toLowerCase()] = true;

    if ((e.key === 'w' || e.key === 'W') && active) {
      lastWKey = Date.now();
    }
    if ((e.key === 't' || e.key === 'T')) {
      var now = Date.now();
      if (now - lastWKey < 400) {
        toggleModule();
      }
    }

    // First W press when inactive starts a sequence
    if (!active && (e.key === 'w' || e.key === 'W')) {
      lastWKey = Date.now();
    }
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function onMouseMove(e) {
    if (!active || !pointerLocked) return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    yaw -= dx * 0.002;
    pitch -= dy * 0.002;
    pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
  }

  function onClick() {
    if (!active) return;
    if (!pointerLocked) {
      document.body.requestPointerLock && document.body.requestPointerLock();
      return;
    }
    if (shootTimer <= 0) {
      fireBullet();
      shootTimer = SHOOT_COOLDOWN;
    }
  }

  function onPointerLockChange() {
    pointerLocked = (document.pointerLockElement === document.body);
  }

  // ---- Toggle ----

  function toggleModule() {
    if (active) {
      active = false;
      if (hudEl) hudEl.style.display = 'none';
      notify('WAR CRIMES TRIAL: OFF', 1500);
    } else {
      active = true;
      if (hudEl) hudEl.style.display = 'block';
      notify('WAR CRIMES TRIAL: ON — DEFEND THE COURT!', 2000);
    }
  }

  // ---- Distance helper ----

  function dist2D(a, b) {
    var dx = a.position.x - b.x;
    var dz = a.position.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // ---- Update ----

  function update(delta) {
    if (!active || !scene || !camera) return;

    shootTimer -= delta;
    spawnTimer -= delta;

    // Flash breach indicators
    for (var fi = 0; fi < breachPoints.length; fi++) {
      var bp = breachPoints[fi];
      if (!bp.sealed) {
        bp.flashTimer += delta * 3;
        var intensity = (Math.sin(bp.flashTimer) + 1) / 2;
        bp.indicator.material.emissiveIntensity = intensity;
      }
    }

    // Spawn enemies
    if (spawnTimer <= 0 && !missionFailed && !missionSuccess) {
      spawnTimer = SPAWN_INTERVAL;
      var unsealed = [];
      for (var ui = 0; ui < breachPoints.length; ui++) {
        if (!breachPoints[ui].sealed) unsealed.push(ui);
      }
      if (unsealed.length > 0) {
        var bpi = unsealed[Math.floor(Math.random() * unsealed.length)];
        spawnEnemy(bpi);
      }
    }

    // Player movement
    var forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(new THREE.Euler(0, yaw, 0));
    var right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(new THREE.Euler(0, yaw, 0));

    var moveVec = new THREE.Vector3(0, 0, 0);
    if (keys['w']) moveVec.add(forward);
    if (keys['s']) moveVec.sub(forward);
    if (keys['a']) moveVec.sub(right);
    if (keys['d']) moveVec.add(right);
    if (moveVec.length() > 0) moveVec.normalize();

    camera.position.x += moveVec.x * PLAYER_SPEED * delta;
    camera.position.z += moveVec.z * PLAYER_SPEED * delta;
    camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
    camera.position.z = Math.max(-14, Math.min(14, camera.position.z));
    camera.position.y = 1.7;

    // Camera rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    // Update bullets
    for (var bi = bullets.length - 1; bi >= 0; bi--) {
      var bullet = bullets[bi];
      bullet.userData.life -= delta;
      if (bullet.userData.life <= 0) {
        scene.remove(bullet);
        bullets.splice(bi, 1);
        continue;
      }
      bullet.position.addScaledVector(bullet.userData.velocity, delta);

      // Check bullet vs enemies
      var hitEnemy = false;
      for (var ei = enemies.length - 1; ei >= 0; ei--) {
        var enemy = enemies[ei];
        if (enemy.userData.dead) continue;
        var ex = bullet.position.x - enemy.position.x;
        var ey = bullet.position.y - 1.5;
        var ez = bullet.position.z - enemy.position.z;
        var dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
        if (dist < 0.9) {
          enemy.userData.hp--;
          hitEnemy = true;
          scene.remove(bullet);
          bullets.splice(bi, 1);
          if (enemy.userData.hp <= 0) {
            enemy.userData.dead = true;
            scene.remove(enemy);
            var eidx = sceneObjects.indexOf(enemy);
            if (eidx !== -1) sceneObjects.splice(eidx, 1);
            enemies.splice(ei, 1);
            // Decrease breach point enemy count
            var enemyBP = breachPoints[enemy.userData.bpIndex];
            if (enemyBP) {
              enemyBP.enemyCount = Math.max(0, enemyBP.enemyCount - 1);
              // Check if breach point can be sealed (no enemies left there)
              if (enemyBP.enemyCount === 0 && !enemyBP.sealed) {
                enemyBP.sealed = true;
                enemyBP.indicator.material.color.setHex(0x00FF00);
                enemyBP.indicator.material.emissive.setHex(0x00FF00);
                enemyBP.indicator.material.emissiveIntensity = 0.3;
                breachSealed++;
                notify('BREACH POINT SEALED!', 2000);
                if (breachSealed >= breachTotal) {
                  missionSuccess = true;
                  notify('MISSION SUCCESS! THE COURT IS SECURE!', 5000);
                }
              }
            }
          }
          break;
        }
      }
      if (hitEnemy) continue;
    }

    // Update enemies
    for (var eni = enemies.length - 1; eni >= 0; eni--) {
      var en = enemies[eni];
      if (en.userData.dead) continue;

      // Move toward center of court
      var targetX = 0;
      var targetZ = -8;
      var dx2 = targetX - en.position.x;
      var dz2 = targetZ - en.position.z;
      var dlen = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      if (dlen > 0.1) {
        en.position.x += (dx2 / dlen) * en.userData.speed * delta;
        en.position.z += (dz2 / dlen) * en.userData.speed * delta;
      }
      en.rotation.y = Math.atan2(dx2, dz2);

      // Enemy shoots at friendly NPCs
      en.userData.shootTimer -= delta;
      if (en.userData.shootTimer <= 0) {
        en.userData.shootTimer = 2 + Math.random() * 2;
        // Pick closest friendly NPC
        var closestNPC = null;
        var closestDist = 999;
        for (var ni = 0; ni < friendlyNPCs.length; ni++) {
          var npc = friendlyNPCs[ni];
          if (npc.userData.hp <= 0) continue;
          var ndx = en.position.x - npc.position.x;
          var ndz = en.position.z - npc.position.z;
          var nd = Math.sqrt(ndx * ndx + ndz * ndz);
          if (nd < closestDist) {
            closestDist = nd;
            closestNPC = npc;
          }
        }
        if (closestNPC && closestDist < 20) {
          closestNPC.userData.hp--;
          if (closestNPC.userData.hp <= 0) {
            closestNPC.children.forEach(function (child) {
              child.material.color.setHex(0x880000);
            });
            if (closestNPC.userData.type === 'judge') {
              judgesAlive = Math.max(0, judgesAlive - 1);
              if (judgesAlive === 0) {
                missionFailed = true;
                notify('MISSION FAILED! ALL JUDGES ELIMINATED!', 6000);
              } else {
                notify('A JUDGE HAS FALLEN! PROTECT THE COURT!', 2500);
              }
            } else {
              notify('WITNESS ELIMINATED!', 2000);
            }
          }
        }
      }

      // If enemy reaches defendant box area, mission fails
      var distToDefendant = Math.sqrt(
        Math.pow(en.position.x - 5, 2) + Math.pow(en.position.z - (-5), 2)
      );
      if (distToDefendant < 1.5) {
        missionFailed = true;
        notify('MISSION FAILED! PRISONER HAS ESCAPED!', 6000);
      }
    }

    updateHUD();
  }

  // ---- Init ----

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Reset state
    enemies = [];
    friendlyNPCs = [];
    breachPoints = [];
    bullets = [];
    judgesAlive = 3;
    breachSealed = 0;
    missionFailed = false;
    missionSuccess = false;
    spawnTimer = 2;
    shootTimer = 0;
    yaw = 0;
    pitch = 0;
    lastWKey = 0;

    // Camera starting position
    camera.position.set(0, 1.7, 8);
    camera.rotation.set(0, Math.PI, 0);
    yaw = Math.PI;

    // Build scene
    buildCourtroom();
    setupBreachPoints();

    // HUD
    createHUD();

    // Input listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Start inactive
    active = false;
    if (hudEl) hudEl.style.display = 'none';
    notify('WAR CRIMES TRIAL LOADED — Press W then T to activate', 3000);
  }

  // ---- Reset ----

  function reset() {
    active = false;

    // Remove all tracked objects
    for (var i = 0; i < sceneObjects.length; i++) {
      scene.remove(sceneObjects[i]);
    }
    sceneObjects = [];
    enemies = [];
    friendlyNPCs = [];
    breachPoints = [];
    bullets = [];

    // Remove input listeners
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerlockchange', onPointerLockChange);

    // Exit pointer lock
    if (document.exitPointerLock) document.exitPointerLock();

    // Remove HUD
    removeHUD();

    judgesAlive = 3;
    breachSealed = 0;
    missionFailed = false;
    missionSuccess = false;
  }

  return { init: init, update: update, reset: reset };
}());
