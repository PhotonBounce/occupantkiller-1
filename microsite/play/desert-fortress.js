window.DesertFortress = (function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var active = false;
  var objects = [];

  // Heat shimmer
  var heatTimer = 0;
  var heatBaseY = 0;

  // Enemy / wave system
  var enemies = [];
  var bullets = [];
  var currentWave = 0;
  var waveCleared = false;
  var waveTimer = 0;
  var totalEnemiesKilled = 0;
  var totalEnemiesInGame = 16; // 3+5+8
  var fortressControl = 0;
  var flagMesh = null;
  var fortressCaptured = false;

  // Input
  var keys = {};
  var lastDTime = 0;
  var shootCooldown = 0;
  var mouseDown = false;

  // HUD
  var hud = null;
  var waveMsg = null;
  var waveMsgTimer = 0;

  // ── Utility ────────────────────────────────────────────────────────────────
  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function makeMesh(geo, color) {
    var mat = new THREE.MeshLambertMaterial({ color: color });
    return new THREE.Mesh(geo, mat);
  }

  function addObj(mesh) {
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  function createHUD() {
    hud = document.createElement('div');
    hud.id = 'df-hud';
    hud.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(20,10,0,0.75)',
      'color:#f5d060',
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 20px',
      'border:1px solid #c8900a',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none',
      'text-align:center',
      'min-width:260px'
    ].join(';');
    hud.innerHTML = 'FORTRESS CONTROL: 0%<br><span style="font-size:11px">WAVE 1 — DEFEND THE FORTRESS</span>';
    document.body.appendChild(hud);

    waveMsg = document.createElement('div');
    waveMsg.id = 'df-wave-msg';
    waveMsg.style.cssText = [
      'position:fixed',
      'top:50%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(20,10,0,0.88)',
      'color:#f5d060',
      'font-family:monospace',
      'font-size:26px',
      'font-weight:bold',
      'padding:18px 40px',
      'border:2px solid #c8900a',
      'border-radius:6px',
      'z-index:10000',
      'pointer-events:none',
      'display:none',
      'text-align:center'
    ].join(';');
    document.body.appendChild(waveMsg);
  }

  function removeHUD() {
    if (hud && hud.parentNode) { hud.parentNode.removeChild(hud); }
    hud = null;
    if (waveMsg && waveMsg.parentNode) { waveMsg.parentNode.removeChild(waveMsg); }
    waveMsg = null;
  }

  function updateHUD() {
    if (!hud) { return; }
    fortressControl = Math.round((totalEnemiesKilled / totalEnemiesInGame) * 100);
    if (fortressControl > 100) { fortressControl = 100; }
    var waveLabel = currentWave < 3
      ? 'WAVE ' + (currentWave + 1) + ' — ' + enemies.length + ' ENEMIES REMAIN'
      : 'ALL WAVES CLEARED';
    hud.innerHTML = 'FORTRESS CONTROL: ' + fortressControl + '%<br>'
      + '<span style="font-size:11px">' + waveLabel + '</span>';
  }

  function showWaveMessage(msg, duration) {
    if (!waveMsg) { return; }
    waveMsg.textContent = msg;
    waveMsg.style.display = 'block';
    waveMsgTimer = duration || 3;
  }

  function showNotification(msg) {
    var n = document.createElement('div');
    n.style.cssText = [
      'position:fixed',
      'top:70px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(20,10,0,0.85)',
      'color:#f5d060',
      'font-family:monospace',
      'font-size:14px',
      'padding:6px 18px',
      'border:1px solid #c8900a',
      'border-radius:4px',
      'z-index:9999',
      'pointer-events:none'
    ].join(';');
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(function () {
      if (n.parentNode) { n.parentNode.removeChild(n); }
    }, 2500);
  }

  // ── Scene Building ─────────────────────────────────────────────────────────
  function buildScene() {
    // Ground — sandy desert floor
    var groundGeo = new THREE.BoxGeometry(120, 0.5, 120);
    var ground = makeMesh(groundGeo, 0xC8A256);
    ground.position.set(0, -0.25, 0);
    addObj(ground);

    // Ambient light
    var amb = new THREE.AmbientLight(0xFFE8A0, 0.7);
    addObj(amb);

    // Sun directional light
    var sun = new THREE.DirectionalLight(0xFFF4CC, 1.2);
    sun.position.set(30, 60, -20);
    addObj(sun);

    // ── Sand Dune Ramps (inclined BoxGeometry) ──
    var duneMat = new THREE.MeshLambertMaterial({ color: 0xBF9A44 });

    var duneData = [
      { x: -22, z: 18, rx: 0.3, w: 14, h: 3, d: 8 },
      { x: 20, z: -15, rx: -0.25, w: 12, h: 2.5, d: 7 },
      { x: 30, z: 22, rx: 0.2, w: 10, h: 2, d: 6 },
      { x: -35, z: -20, rx: -0.3, w: 16, h: 3.5, d: 9 }
    ];

    for (var di = 0; di < duneData.length; di++) {
      var dd = duneData[di];
      var dGeo = new THREE.BoxGeometry(dd.w, dd.h, dd.d);
      var dMesh = new THREE.Mesh(dGeo, duneMat);
      dMesh.position.set(dd.x, dd.h * 0.5, dd.z);
      dMesh.rotation.x = dd.rx;
      addObj(dMesh);
    }

    // ── Ancient Stone Towers (tall narrow boxes) ──
    var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

    var towerPositions = [
      { x: -18, z: -18 },
      { x: 18, z: -18 },
      { x: -18, z: 18 },
      { x: 18, z: 18 }
    ];

    for (var ti = 0; ti < towerPositions.length; ti++) {
      var tp = towerPositions[ti];
      // Tower base
      var tGeo = new THREE.BoxGeometry(4, 16, 4);
      var tMesh = new THREE.Mesh(tGeo, stoneMat);
      tMesh.position.set(tp.x, 8, tp.z);
      addObj(tMesh);

      // Tower battlements (top crenels)
      for (var ci = 0; ci < 4; ci++) {
        var cGeo = new THREE.BoxGeometry(1.2, 2, 1.2);
        var cMesh = new THREE.Mesh(cGeo, stoneMat);
        var cAngle = (ci / 4) * Math.PI * 2;
        cMesh.position.set(
          tp.x + Math.cos(cAngle) * 1.4,
          17,
          tp.z + Math.sin(cAngle) * 1.4
        );
        addObj(cMesh);
      }
    }

    // ── Fortress Walls (connecting towers) ──
    var wallMat = new THREE.MeshLambertMaterial({ color: 0x7A6548 });

    // North wall
    var wallN = makeMesh(new THREE.BoxGeometry(32, 8, 2), 0x7A6548);
    wallN.position.set(0, 4, -18);
    addObj(wallN);

    // South wall
    var wallS = makeMesh(new THREE.BoxGeometry(32, 8, 2), 0x7A6548);
    wallS.position.set(0, 4, 18);
    addObj(wallS);

    // East wall
    var wallE = makeMesh(new THREE.BoxGeometry(2, 8, 32), 0x7A6548);
    wallE.position.set(18, 4, 0);
    addObj(wallE);

    // West wall
    var wallW = makeMesh(new THREE.BoxGeometry(2, 8, 32), 0x7A6548);
    wallW.position.set(-18, 4, 0);
    addObj(wallW);

    // ── Modern Radar Dish on Ancient Parapet ──
    // Mount on north-east tower (18, -18)
    var dishBaseMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
    var dishBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), dishBaseMat);
    dishBase.position.set(18, 19.5, -18);
    addObj(dishBase);

    // Radar dish: CylinderGeometry with top radius 0 → cone shape = dish bowl
    var dishMat = new THREE.MeshLambertMaterial({ color: 0x778877, wireframe: false });
    var dishGeo = new THREE.CylinderGeometry(0, 2, 1.5, 16, 1, true);
    var dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(18, 22, -18);
    dish.rotation.x = Math.PI; // flip so open end faces outward/up
    addObj(dish);

    // Dish rim accent
    var rimGeo = new THREE.CylinderGeometry(2, 2, 0.1, 16);
    var rim = new THREE.Mesh(rimGeo, dishMat);
    rim.position.set(18, 21.2, -18);
    addObj(rim);

    // Radar rotate arm
    var armGeo = new THREE.BoxGeometry(2.5, 0.2, 0.2);
    var arm = new THREE.Mesh(armGeo, dishBaseMat);
    arm.position.set(18, 22.5, -18);
    addObj(arm);

    // ── Sandbag Walls (stacked small boxes) ──
    var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xA89060 });

    var sbWalls = [
      { x: -5, z: 0, rows: 2, cols: 5, dir: 'x' },
      { x: 5, z: -8, rows: 2, cols: 4, dir: 'z' },
      { x: -10, z: 12, rows: 3, cols: 5, dir: 'x' }
    ];

    for (var si = 0; si < sbWalls.length; si++) {
      var sw = sbWalls[si];
      for (var row = 0; row < sw.rows; row++) {
        for (var col = 0; col < sw.cols; col++) {
          var sbGeo = new THREE.BoxGeometry(1.2, 0.6, 0.7);
          var sb = new THREE.Mesh(sbGeo, sandbagMat);
          var ox = sw.dir === 'x' ? col * 1.3 : 0;
          var oz = sw.dir === 'z' ? col * 0.9 : 0;
          sb.position.set(
            sw.x + ox,
            0.3 + row * 0.65,
            sw.z + oz
          );
          if (row % 2 === 1) { sb.rotation.y = 0.1; }
          addObj(sb);
        }
      }
    }

    // ── Oil Drum Cluster (cylinders) ──
    var drumMat = new THREE.MeshLambertMaterial({ color: 0x223322 });
    var drumAccentMat = new THREE.MeshLambertMaterial({ color: 0x884422 });

    var drumPositions = [
      { x: 8, z: 5 }, { x: 9.2, z: 5 }, { x: 8.6, z: 6.1 },
      { x: 8, z: 7.2 }, { x: 9.2, z: 7.2 }
    ];

    for (var dri = 0; dri < drumPositions.length; dri++) {
      var dp = drumPositions[dri];
      var drumGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12);
      var drum = new THREE.Mesh(drumGeo, drumMat);
      drum.position.set(dp.x, 0.6, dp.z);
      addObj(drum);

      // Drum stripe
      var stripeGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.15, 12);
      var stripe = new THREE.Mesh(stripeGeo, drumAccentMat);
      stripe.position.set(dp.x, 0.7, dp.z);
      addObj(stripe);
    }

    // ── Desert Palm Trees (cylinder trunk + green sphere top) ──
    var trunkMat = new THREE.MeshLambertMaterial({ color: 0x7A5C30 });
    var frondMat = new THREE.MeshLambertMaterial({ color: 0x3A6B2A });

    var palmPositions = [
      { x: -30, z: 5 }, { x: -28, z: -8 }, { x: 35, z: -12 },
      { x: 32, z: 8 }, { x: -14, z: -32 }, { x: 12, z: 30 }
    ];

    for (var pi = 0; pi < palmPositions.length; pi++) {
      var pp = palmPositions[pi];
      var lean = rand(-0.15, 0.15);

      // Trunk
      var trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 5, 8);
      var trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(pp.x, 2.5, pp.z);
      trunk.rotation.z = lean;
      addObj(trunk);

      // Frond sphere
      var frondGeo = new THREE.SphereGeometry(1.5, 8, 6);
      var frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(
        pp.x + Math.sin(lean) * 2.5,
        5.5,
        pp.z
      );
      frond.scale.y = 0.6;
      addObj(frond);
    }

    // ── Flag on Center Tower ──
    var flagPoleGeo = new THREE.CylinderGeometry(0.08, 0.08, 4, 6);
    var flagPoleMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    var flagPole = new THREE.Mesh(flagPoleGeo, flagPoleMat);
    flagPole.position.set(-18, 20, -18); // on south-west tower
    addObj(flagPole);

    var flagGeo = new THREE.BoxGeometry(1.8, 1, 0.08);
    var flagMat = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(-18 + 0.9, 21.5, -18);
    addObj(flagMesh);
  }

  // ── Enemy System ───────────────────────────────────────────────────────────
  function spawnWave(waveNum) {
    var count = waveNum === 0 ? 3 : waveNum === 1 ? 5 : 8;
    for (var i = 0; i < count; i++) {
      spawnEnemy(waveNum);
    }
  }

  function spawnEnemy(waveNum) {
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0xC8A870 }); // desert camo tan
    var headMat = new THREE.MeshLambertMaterial({ color: 0xC89060 });

    // Body
    var bodyGeo = new THREE.BoxGeometry(0.7, 1.0, 0.5);
    var body = new THREE.Mesh(bodyGeo, bodyMat);

    // Head
    var headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.75;
    body.add(head);

    // Spawn outside the fortress walls
    var angle = Math.random() * Math.PI * 2;
    var spawnDist = 28 + Math.random() * 12;
    body.position.set(
      Math.cos(angle) * spawnDist,
      0.5,
      Math.sin(angle) * spawnDist
    );

    scene.add(body);
    objects.push(body);

    var speed = 1.5 + waveNum * 0.8;
    enemies.push({
      mesh: body,
      hp: 2,
      speed: speed,
      wave: waveNum
    });
  }

  // ── Bullet System ──────────────────────────────────────────────────────────
  function shoot() {
    if (!camera) { return; }
    var bulletGeo = new THREE.SphereGeometry(0.12, 6, 6);
    var bulletMat = new THREE.MeshLambertMaterial({ color: 0xFFFF44 });
    var bullet = new THREE.Mesh(bulletGeo, bulletMat);

    bullet.position.copy(camera.position);

    // Direction = where camera looks
    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    scene.add(bullet);
    objects.push(bullet);

    bullets.push({
      mesh: bullet,
      velocity: dir.clone().multiplyScalar(30),
      life: 2.5
    });
  }

  // ── Input Handlers ─────────────────────────────────────────────────────────
  function onKeyDown(e) {
    keys[e.code] = true;

    // D+F toggle: press D then F within 500ms
    if (e.code === 'KeyD') {
      lastDTime = Date.now();
    }
    if (e.code === 'KeyF') {
      if (Date.now() - lastDTime < 500) {
        toggleModule();
      }
    }

    // Spacebar shoot
    if (e.code === 'Space' && active && shootCooldown <= 0) {
      shoot();
      shootCooldown = 0.25;
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function onClick() {
    if (!active) { return; }
    if (shootCooldown <= 0) {
      shoot();
      shootCooldown = 0.25;
    }
  }

  function toggleModule() {
    active = !active;
    if (active) {
      showNotification('DESERT FORTRESS — ACTIVATED');
      if (scene && camera) {
        buildScene();
        createHUD();
        currentWave = 0;
        waveCleared = false;
        totalEnemiesKilled = 0;
        fortressControl = 0;
        fortressCaptured = false;
        spawnWave(0);
        updateHUD();
      }
    } else {
      showNotification('DESERT FORTRESS — DEACTIVATED');
      resetInternals();
    }
  }

  // ── Core API ───────────────────────────────────────────────────────────────
  function init(sc, cam) {
    scene = sc;
    camera = cam;
    heatBaseY = cam ? cam.position.y : 1.6;

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('click', onClick);
  }

  function update(delta) {
    if (!active) { return; }

    // ── Heat shimmer ──
    heatTimer += delta;
    if (camera) {
      camera.position.y = heatBaseY + Math.sin(heatTimer * 8) * 0.018;
    }

    // ── Shoot cooldown ──
    if (shootCooldown > 0) { shootCooldown -= delta; }

    // ── Update bullets ──
    for (var bi = bullets.length - 1; bi >= 0; bi--) {
      var b = bullets[bi];
      b.life -= delta;

      b.mesh.position.x += b.velocity.x * delta;
      b.mesh.position.y += b.velocity.y * delta;
      b.mesh.position.z += b.velocity.z * delta;

      // Remove expired bullets
      if (b.life <= 0) {
        scene.remove(b.mesh);
        var bObjIdx = objects.indexOf(b.mesh);
        if (bObjIdx !== -1) { objects.splice(bObjIdx, 1); }
        bullets.splice(bi, 1);
        continue;
      }

      // Check bullet-enemy collision
      for (var ei = enemies.length - 1; ei >= 0; ei--) {
        var en = enemies[ei];
        if (dist3(b.mesh.position, en.mesh.position) < 0.9) {
          en.hp -= 1;
          // Remove bullet
          scene.remove(b.mesh);
          var bIdx2 = objects.indexOf(b.mesh);
          if (bIdx2 !== -1) { objects.splice(bIdx2, 1); }
          bullets.splice(bi, 1);

          if (en.hp <= 0) {
            // Kill enemy
            scene.remove(en.mesh);
            var eIdx = objects.indexOf(en.mesh);
            if (eIdx !== -1) { objects.splice(eIdx, 1); }
            enemies.splice(ei, 1);
            totalEnemiesKilled += 1;
          }
          break;
        }
      }
    }

    // ── Update enemies ──
    if (camera) {
      for (var ei2 = 0; ei2 < enemies.length; ei2++) {
        var en2 = enemies[ei2];
        var dx = camera.position.x - en2.mesh.position.x;
        var dz = camera.position.z - en2.mesh.position.z;
        var dLen = Math.sqrt(dx * dx + dz * dz);
        if (dLen > 0.5) {
          en2.mesh.position.x += (dx / dLen) * en2.speed * delta;
          en2.mesh.position.z += (dz / dLen) * en2.speed * delta;
          en2.mesh.rotation.y = Math.atan2(dx, dz);
        }
      }
    }

    // ── Wave progression ──
    if (!waveCleared && enemies.length === 0 && currentWave <= 2) {
      waveCleared = true;
      waveTimer = 3;
      if (currentWave < 2) {
        showWaveMessage('WAVE ' + (currentWave + 1) + ' CLEARED!', 3);
      } else {
        showWaveMessage('ALL WAVES CLEARED! FORTRESS CAPTURED!', 5);
        // Turn flag green
        if (flagMesh) {
          flagMesh.material.color.setHex(0x22CC22);
          fortressCaptured = true;
        }
      }
    }

    if (waveCleared && waveTimer > 0) {
      waveTimer -= delta;
      if (waveTimer <= 0 && currentWave < 2) {
        currentWave += 1;
        waveCleared = false;
        spawnWave(currentWave);
      }
    }

    // ── Wave message timer ──
    if (waveMsgTimer > 0) {
      waveMsgTimer -= delta;
      if (waveMsgTimer <= 0 && waveMsg) {
        waveMsg.style.display = 'none';
      }
    }

    updateHUD();
  }

  function resetInternals() {
    // Remove all scene objects
    for (var i = 0; i < objects.length; i++) {
      if (scene) { scene.remove(objects[i]); }
    }
    objects = [];

    // Clear bullets array (meshes already removed above)
    bullets = [];

    // Clear enemies array (meshes already removed above)
    enemies = [];

    // Reset state
    currentWave = 0;
    waveCleared = false;
    waveTimer = 0;
    totalEnemiesKilled = 0;
    fortressControl = 0;
    fortressCaptured = false;
    flagMesh = null;
    heatTimer = 0;
    shootCooldown = 0;
    waveMsgTimer = 0;

    removeHUD();
  }

  function reset() {
    active = false;
    resetInternals();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('click', onClick);

    scene = null;
    camera = null;
  }

  return { init: init, update: update, reset: reset };
}());
