window.ArcticConvoy = (function () {
  'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

  // ── state ────────────────────────────────────────────────────────────────
  var scene, camera, renderer, clock;
  var active = false;
  var keyA_time = 0;
  var ACTIVATION_WINDOW = 400;

  // game objects
  var ground, frozenRiver, iceRidges, iceBridge, outpost, outpostAntenna;
  var convoyTrucks = [];          // [{mesh, hp, isWarhead}]
  var enemies = [];               // [{mesh, hp, type, state, stateTimer, speed}]
  var blizzardParticles = [];
  var pineClusters = [];
  var boss = null;                // {mesh, snowmobile, hp, state, stateTimer}
  var extractionZone = null;

  // HUD elements
  var hudContainer, truckBars, blizzardTimerEl, frostbiteEl, enemyCountEl, msgEl;

  // game state
  var gameState = 'idle'; // idle | playing | won | lost
  var wave = 0;
  var enemiesRemaining = 0;
  var totalEnemies = 0;

  // blizzard
  var blizzardCycle = 0;         // seconds since last blizzard start
  var BLIZZARD_INTERVAL = 60;
  var BLIZZARD_DURATION = 20;
  var blizzardActive = false;
  var blizzardTimer = 0;

  // frostbite
  var frostbite = 0;             // 0-100
  var stillTimer = 0;
  var STILL_THRESHOLD = 5;
  var playerMoved = false;

  // player
  var playerVelocity = { x: 0, z: 0 };
  var playerOnBridge = false;
  var playerFell = false;
  var lastFireTime = 0;
  var BASE_FIRE_RATE = 0.25;     // seconds between shots
  var keys = {};
  var bullets = [];

  // convoy movement
  var convoySpeed = 2.5;
  var convoyStartZ = 60;
  var convoyExtractionZ = -80;
  var convoyStarted = false;

  // ── helpers ──────────────────────────────────────────────────────────────
  function makeMat(color, wireframe) {
    return new THREE.MeshLambertMaterial({ color: color, wireframe: !!wireframe });
  }

  function makeBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function makeSphere(r, color, x, y, z) {
    var geo = new THREE.SphereGeometry(r, 6, 6);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function makeCylinder(rt, rb, h, color, x, y, z) {
    var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function makeCone(r, h, color, x, y, z) {
    var geo = new THREE.ConeGeometry(r, h, 6);
    var mat = makeMat(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  function makeLineBox(w, h, d, color, x, y, z) {
    var geo = new THREE.BoxGeometry(w, h, d);
    var edges = new THREE.EdgesGeometry(geo);
    var mat = new THREE.LineBasicMaterial({ color: color });
    var lines = new THREE.LineSegments(edges, mat);
    lines.position.set(x, y, z);
    scene.add(lines);
    return lines;
  }

  function dist2D(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function removeFromScene(mesh) {
    if (mesh && mesh.parent) {
      scene.remove(mesh);
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function buildHUD() {
    hudContainer = document.createElement('div');
    hudContainer.id = 'arctic-hud';
    hudContainer.style.cssText = [
      'position:fixed', 'top:10px', 'left:10px',
      'color:#cceeff', 'font-family:monospace', 'font-size:13px',
      'pointer-events:none', 'z-index:1000',
      'text-shadow:1px 1px 2px #000'
    ].join(';');
    document.body.appendChild(hudContainer);

    // truck bars
    truckBars = [];
    for (var i = 0; i < 3; i++) {
      var label = document.createElement('div');
      label.style.marginBottom = '3px';
      label.innerHTML = (i === 1 ? 'WARHEAD TRUCK' : 'ESCORT ' + (i === 0 ? 'A' : 'B')) + ': ';
      var bar = document.createElement('span');
      bar.style.cssText = 'display:inline-block;width:100px;height:10px;background:#0f4;vertical-align:middle;border:1px solid #fff';
      label.appendChild(bar);
      hudContainer.appendChild(label);
      truckBars.push(bar);
    }

    blizzardTimerEl = document.createElement('div');
    blizzardTimerEl.style.marginTop = '6px';
    hudContainer.appendChild(blizzardTimerEl);

    frostbiteEl = document.createElement('div');
    hudContainer.appendChild(frostbiteEl);

    enemyCountEl = document.createElement('div');
    hudContainer.appendChild(enemyCountEl);

    msgEl = document.createElement('div');
    msgEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:28px;font-family:monospace;color:#fff;text-shadow:2px 2px 4px #000;pointer-events:none;z-index:1001;display:none';
    document.body.appendChild(msgEl);
  }

  function updateHUD() {
    for (var i = 0; i < convoyTrucks.length; i++) {
      var pct = Math.max(0, convoyTrucks[i].hp / 150);
      truckBars[i].style.width = Math.round(pct * 100) + 'px';
      truckBars[i].style.background = pct > 0.5 ? '#0f4' : pct > 0.25 ? '#ff0' : '#f30';
    }

    if (blizzardActive) {
      var rem = Math.max(0, BLIZZARD_DURATION - blizzardTimer);
      blizzardTimerEl.textContent = 'BLIZZARD: ' + rem.toFixed(1) + 's';
      blizzardTimerEl.style.color = '#88ddff';
    } else {
      var nextIn = Math.max(0, BLIZZARD_INTERVAL - blizzardCycle);
      blizzardTimerEl.textContent = 'Next blizzard in: ' + nextIn.toFixed(0) + 's';
      blizzardTimerEl.style.color = '#aaa';
    }

    frostbiteEl.textContent = 'FROSTBITE: ' + frostbite.toFixed(0) + '%' + (frostbite >= 60 ? ' [SLOW]' : '');
    frostbiteEl.style.color = frostbite >= 60 ? '#f90' : '#cceeff';

    enemyCountEl.textContent = 'ENEMIES: ' + enemiesRemaining + ' / ' + totalEnemies +
      (boss ? '  | COL. FROST: ' + (boss.hp > 0 ? boss.hp + 'HP' : 'DEAD') : '');
  }

  function removeHUD() {
    if (hudContainer && hudContainer.parentNode) {
      hudContainer.parentNode.removeChild(hudContainer);
    }
    if (msgEl && msgEl.parentNode) {
      msgEl.parentNode.removeChild(msgEl);
    }
    hudContainer = null;
    msgEl = null;
  }

  function showMsg(text, color) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = color || '#fff';
    msgEl.style.display = 'block';
  }

  function hideMsg() {
    if (msgEl) msgEl.style.display = 'none';
  }

  // ── environment ──────────────────────────────────────────────────────────
  function buildEnvironment() {
    // ground — frozen tundra
    ground = makeBox(200, 0.5, 250, 0xdce8f0, 0, -0.25, -10);

    // ice ridges along sides and scattered
    iceRidges = [];
    var ridgeData = [
      [-30, 0.8, -20], [-35, 1.2, 10], [-28, 0.6, 40],
      [30, 1.0, -15], [32, 0.9, 20], [25, 1.3, 50],
      [-20, 0.7, -50], [20, 0.8, -55], [0, 1.1, 30]
    ];
    for (var i = 0; i < ridgeData.length; i++) {
      var r = ridgeData[i];
      var ridge = makeBox(8 + Math.random() * 10, r[1], 3 + Math.random() * 4, 0xb8d4e8, r[0], r[1] / 2, r[2]);
      iceRidges.push(ridge);
    }

    // frozen river gorge — at z = -30 to -20
    frozenRiver = makeBox(200, 1, 12, 0x7ab8d4, 0, -4, -25);

    // ice bridge over gorge
    iceBridge = makeBox(6, 0.4, 12, 0xc8e4f0, 0, -0.1, -25);

    // cliff edges (gorge walls)
    makeBox(200, 8, 1.5, 0xa0b8c8, 0, -3, -19);
    makeBox(200, 8, 1.5, 0xa0b8c8, 0, -3, -31);

    // abandoned research outpost
    outpost = makeBox(8, 5, 8, 0x6a7a8a, -40, 2.5, -5);
    outpostAntenna = makeCylinder(0.15, 0.15, 10, 0x445566, -40, 10, -5);
    // outpost windows (line boxes)
    makeLineBox(2, 1.5, 0.1, 0x88aacc, -40, 3, -1.05);
    makeLineBox(2, 1.5, 0.1, 0x88aacc, -40, 3, -8.95);

    // extraction zone marker at north edge
    extractionZone = makeLineBox(20, 0.1, 20, 0x00ff88, 0, 0.1, -85);
    // extra markers
    makeLineBox(20, 0.1, 20, 0x00ff88, 0, 0.3, -85);

    // pine tree clusters (BoxGeometry trunks + cone tops)
    buildPineClusters();

    // blizzard particles
    buildBlizzard();

    // lighting
    var ambLight = new THREE.AmbientLight(0x9ab8cc, 0.7);
    scene.add(ambLight);
    var dirLight = new THREE.DirectionalLight(0xddeeff, 0.8);
    dirLight.position.set(30, 60, 20);
    scene.add(dirLight);

    // fog (starts normal)
    scene.fog = new THREE.Fog(0xb8d4e8, 5, 80);
  }

  function buildPineClusters() {
    var clusters = [
      { x: -55, z: -60 }, { x: -50, z: 20 }, { x: -60, z: 50 },
      { x: 55, z: -55 }, { x: 50, z: 15 }, { x: 58, z: 45 },
      { x: -45, z: -80 }, { x: 45, z: -75 }
    ];
    for (var c = 0; c < clusters.length; c++) {
      var cx = clusters[c].x, cz = clusters[c].z;
      for (var t = 0; t < 6; t++) {
        var ox = (Math.random() - 0.5) * 18;
        var oz = (Math.random() - 0.5) * 18;
        var trunkH = 2 + Math.random() * 2;
        var trunk = makeBox(0.5, trunkH, 0.5, 0x5a4030, cx + ox, trunkH / 2, cz + oz);
        var cone = makeCone(2, 4, 0x1a3a1a, cx + ox, trunkH + 2, cz + oz);
        pineClusters.push({ trunk: trunk, cone: cone });
      }
    }
  }

  function buildBlizzard() {
    for (var i = 0; i < 300; i++) {
      var p = makeSphere(0.08, 0xffffff, (Math.random() - 0.5) * 100, Math.random() * 15, (Math.random() - 0.5) * 100);
      p.userData.vx = (Math.random() - 0.3) * 3;
      p.userData.vy = -0.5 - Math.random() * 1.5;
      p.userData.vz = (Math.random() - 0.5) * 1.5;
      p.visible = false;
      blizzardParticles.push(p);
    }
  }

  // ── convoy ────────────────────────────────────────────────────────────────
  function buildConvoy() {
    var offsets = [-12, 0, 12];
    var colors = [0x3a5a3a, 0x4a6a4a, 0x3a5a3a];
    for (var i = 0; i < 3; i++) {
      var truck = makeBox(4, 2.5, 8, colors[i], 0, 1.25, convoyStartZ + offsets[i]);
      // cab
      var cab = makeBox(4, 1.5, 3, colors[i] - 0x0a0a0a, 0, 2.75, convoyStartZ + offsets[i] - 2.5);
      cab.userData.truckIndex = i;
      // wheels (decorative)
      makeBox(1, 1, 1, 0x222222, -2.5, 0.5, convoyStartZ + offsets[i] - 2.5);
      makeBox(1, 1, 1, 0x222222, 2.5, 0.5, convoyStartZ + offsets[i] - 2.5);
      makeBox(1, 1, 1, 0x222222, -2.5, 0.5, convoyStartZ + offsets[i] + 2.5);
      makeBox(1, 1, 1, 0x222222, 2.5, 0.5, convoyStartZ + offsets[i] + 2.5);

      var obj = { mesh: truck, cab: cab, hp: 150, isWarhead: (i === 1), index: i };

      if (i === 1) {
        // warhead container on top of center truck
        var container = makeBox(2, 1.5, 4, 0x556644, 0, 3.25, convoyStartZ);
        // LINE markings on warhead container
        var lineMarks = makeLineBox(2, 1.5, 4, 0xffff00, 0, 3.25, convoyStartZ);
        obj.container = container;
        obj.lineMarks = lineMarks;
      }

      convoyTrucks.push(obj);
    }
    convoyStarted = true;
  }

  function updateConvoy(dt) {
    if (!convoyStarted) return;
    var warheadAlive = false;
    var warheadZ = 999;

    for (var i = 0; i < convoyTrucks.length; i++) {
      var t = convoyTrucks[i];
      if (t.hp <= 0) {
        if (t.isWarhead) {
          gameState = 'lost';
          showMsg('MISSION FAILED — WARHEAD DESTROYED', '#f44');
          return;
        }
        continue;
      }
      // advance north (negative Z)
      t.mesh.position.z -= convoySpeed * dt;
      if (t.cab) t.cab.position.z = t.mesh.position.z - 2.5;
      if (t.container) {
        t.container.position.z = t.mesh.position.z;
        t.lineMarks.position.z = t.mesh.position.z;
      }
      if (t.isWarhead) {
        warheadAlive = true;
        warheadZ = t.mesh.position.z;
      }
    }

    // check win
    if (warheadAlive && warheadZ <= convoyExtractionZ && (!boss || boss.hp <= 0)) {
      gameState = 'won';
      showMsg('MISSION COMPLETE — CONVOY EXTRACTED!', '#0f4');
    }
  }

  // ── enemies ───────────────────────────────────────────────────────────────
  function spawnWave(waveNum) {
    wave = waveNum;
    if (waveNum === 1) {
      // 8 special forces, 2 snipers
      for (var i = 0; i < 8; i++) {
        spawnEnemy('interceptor', randomSpawnPos(waveNum));
      }
      for (var j = 0; j < 2; j++) {
        spawnSniper(waveNum);
      }
    } else if (waveNum === 2) {
      // 4 interceptors, 3 snipers
      for (var k = 0; k < 4; k++) {
        spawnEnemy('interceptor', randomSpawnPos(waveNum));
      }
      for (var l = 0; l < 3; l++) {
        spawnSniper(waveNum);
      }
    } else if (waveNum === 3) {
      // boss wave + 2 flankers via bridge
      spawnBoss();
      for (var m = 0; m < 2; m++) {
        spawnEnemy('flanker', { x: (m === 0 ? -4 : 4), z: -35 });
      }
    }
  }

  function randomSpawnPos(waveNum) {
    var side = Math.random() > 0.5 ? 1 : -1;
    var zRange = waveNum === 1 ? [40, 70] : [-10, 40];
    return {
      x: side * (45 + Math.random() * 15),
      z: zRange[0] + Math.random() * (zRange[1] - zRange[0])
    };
  }

  function spawnEnemy(type, pos) {
    var color = (type === 'flanker') ? 0x334455 : 0x334455;
    var body = makeBox(1, 2, 0.8, color, pos.x, 1, pos.z);
    // head
    var head = makeBox(0.8, 0.8, 0.8, 0x334455, pos.x, 2.4, pos.z);
    // winter gear — white overcoat overlay
    var coat = makeBox(1.1, 1.8, 0.9, 0xddeeff, pos.x, 1.1, pos.z);
    coat.material.transparent = true;
    coat.material.opacity = 0.5;

    var obj = {
      mesh: body, head: head, coat: coat,
      hp: 90, type: type,
      state: 'patrol', stateTimer: 0,
      speed: type === 'flanker' ? 4 : 3,
      fireTimer: Math.random() * 2,
      patrolTarget: { x: pos.x + (Math.random() - 0.5) * 10, z: pos.z + (Math.random() - 0.5) * 10 },
      alive: true, dead: false
    };
    enemies.push(obj);
    enemiesRemaining++;
    totalEnemies++;
    return obj;
  }

  function spawnSniper(waveNum) {
    // place on ice ridge
    var ridge = iceRidges[Math.floor(Math.random() * iceRidges.length)];
    var rx = ridge.position.x, rz = ridge.position.z, ry = ridge.position.y * 2;
    var body = makeBox(1, 2, 0.8, 0x223344, rx, ry + 1, rz);
    var head = makeBox(0.8, 0.8, 0.8, 0x223344, rx, ry + 2.4, rz);
    var obj = {
      mesh: body, head: head, coat: null,
      hp: 100, type: 'sniper',
      state: 'aim', stateTimer: 0,
      speed: 0,
      fireTimer: 2 + Math.random() * 2,
      patrolTarget: { x: rx, z: rz },
      alive: true, dead: false
    };
    enemies.push(obj);
    enemiesRemaining++;
    totalEnemies++;
    return obj;
  }

  function spawnBoss() {
    var snowmobile = makeBox(3, 1, 6, 0x334455, 30, 0.5, 50);
    // boss on top
    var bossBody = makeBox(1.2, 2.2, 1, 0x112233, 30, 2.1, 50);
    var bossHead = makeBox(1, 1, 1, 0x112233, 30, 3.6, 50);
    // heavy weapon (rifle-like box)
    var weapon = makeBox(0.2, 0.2, 2.5, 0x111111, 30.8, 2.5, 48.5);
    boss = {
      mesh: bossBody, head: bossHead, weapon: weapon,
      snowmobile: snowmobile,
      hp: 520, maxHp: 520,
      state: 'approach', stateTimer: 0,
      speed: 8, fireTimer: 1.5,
      alive: true
    };
    enemiesRemaining++;
    totalEnemies++;
  }

  function updateEnemies(dt) {
    var cam = camera.position;
    var fireRate = getFireRateForEnemy();

    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (!e.alive) continue;
      if (e.hp <= 0) {
        killEnemy(e);
        enemies.splice(i, 1);
        enemiesRemaining = Math.max(0, enemiesRemaining - 1);
        continue;
      }

      e.stateTimer += dt;
      e.fireTimer -= dt;

      var dCam = dist2D(e.mesh.position, cam);
      var dConvoy = nearestConvoyDist(e.mesh.position);

      // state machine
      if (e.type === 'sniper') {
        // snipers stay put, fire at player or convoy
        if (e.fireTimer <= 0) {
          e.fireTimer = 3 + Math.random() * 2;
          if (dCam < 60) {
            // "hit" player — minor damage feedback (no player HP in spec)
          }
          if (dConvoy.dist < 50) {
            damageNearestConvoy(dConvoy, 8);
          }
        }
      } else {
        // interceptors / flankers
        var target = chooseEnemyTarget(e, cam, dConvoy);
        moveEnemyToward(e, target, dt);

        // attack
        if (e.fireTimer <= 0) {
          e.fireTimer = fireRate + Math.random();
          if (dConvoy.dist < 15) {
            damageNearestConvoy(dConvoy, 12);
          }
        }
      }

      // sync head / coat positions
      e.head.position.set(e.mesh.position.x, e.mesh.position.y + 1.4, e.mesh.position.z);
      if (e.coat) e.coat.position.set(e.mesh.position.x, e.mesh.position.y + 0.1, e.mesh.position.z);

      // during blizzard make harder to see — handled by fog
    }

    // boss update
    if (boss && boss.alive) {
      updateBoss(dt, cam);
    }

    // auto-spawn next wave
    if (enemiesRemaining === 0 && wave < 3) {
      spawnWave(wave + 1);
    }
  }

  function getFireRateForEnemy() {
    return 1.5;
  }

  function chooseEnemyTarget(e, cam, dConvoy) {
    // flankers go for bridge → convoy
    if (e.type === 'flanker') {
      // first cross bridge (z ~ -25) then attack convoy
      var bz = e.mesh.position.z;
      if (bz > -25) {
        return { x: e.mesh.position.x * 0.1, z: -25 };
      }
      return getNearestConvoyPos();
    }
    // interceptors: if player close, engage player, else attack convoy
    var dCamDist = dist2D(e.mesh.position, cam);
    if (dCamDist < 25 && dCamDist < dConvoy.dist) {
      return { x: cam.x, z: cam.z };
    }
    return getNearestConvoyPos();
  }

  function moveEnemyToward(e, target, dt) {
    var dx = target.x - e.mesh.position.x;
    var dz = target.z - e.mesh.position.z;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1.5) return;
    dx /= len; dz /= len;
    e.mesh.position.x += dx * e.speed * dt;
    e.mesh.position.z += dz * e.speed * dt;
    e.mesh.rotation.y = Math.atan2(dx, dz);
  }

  function nearestConvoyDist(pos) {
    var best = { dist: 9999, truck: null };
    for (var i = 0; i < convoyTrucks.length; i++) {
      var t = convoyTrucks[i];
      if (t.hp <= 0) continue;
      var d = dist2D(pos, t.mesh.position);
      if (d < best.dist) { best.dist = d; best.truck = t; }
    }
    return best;
  }

  function getNearestConvoyPos() {
    var best = { x: 0, z: convoyStartZ };
    for (var i = 0; i < convoyTrucks.length; i++) {
      var t = convoyTrucks[i];
      if (t.hp > 0) { return { x: t.mesh.position.x, z: t.mesh.position.z }; }
    }
    return best;
  }

  function damageNearestConvoy(dConvoy, amount) {
    if (dConvoy.truck) {
      dConvoy.truck.hp = Math.max(0, dConvoy.truck.hp - amount);
      if (dConvoy.truck.hp <= 0 && dConvoy.truck.isWarhead) {
        gameState = 'lost';
        showMsg('MISSION FAILED — WARHEAD DESTROYED', '#f44');
      }
    }
  }

  function killEnemy(e) {
    removeFromScene(e.mesh);
    removeFromScene(e.head);
    if (e.coat) removeFromScene(e.coat);
  }

  // ── boss ──────────────────────────────────────────────────────────────────
  function updateBoss(dt, cam) {
    if (boss.hp <= 0) {
      if (boss.alive) {
        boss.alive = false;
        removeFromScene(boss.mesh);
        removeFromScene(boss.head);
        removeFromScene(boss.weapon);
        removeFromScene(boss.snowmobile);
        enemiesRemaining = Math.max(0, enemiesRemaining - 1);
      }
      return;
    }

    boss.stateTimer += dt;
    boss.fireTimer -= dt;

    var dx, dz, len;

    if (boss.state === 'approach') {
      // drive snowmobile toward convoy
      var cpos = getNearestConvoyPos();
      dx = cpos.x - boss.snowmobile.position.x;
      dz = cpos.z - boss.snowmobile.position.z;
      len = Math.sqrt(dx * dx + dz * dz);
      if (len > 2) {
        dx /= len; dz /= len;
        boss.snowmobile.position.x += dx * boss.speed * dt;
        boss.snowmobile.position.z += dz * boss.speed * dt;
        boss.mesh.position.set(boss.snowmobile.position.x, 2.1, boss.snowmobile.position.z);
        boss.head.position.set(boss.snowmobile.position.x, 3.6, boss.snowmobile.position.z);
        boss.weapon.position.set(boss.snowmobile.position.x + 0.8, 2.5, boss.snowmobile.position.z - 1.5);

        // ram damage to convoy
        var nearConvoy = nearestConvoyDist(boss.snowmobile.position);
        if (nearConvoy.dist < 5) {
          damageNearestConvoy(nearConvoy, 30 * dt);
        }
      } else {
        boss.state = 'combat';
      }
    } else if (boss.state === 'combat') {
      // circle strafe, fire at player
      var angle = boss.stateTimer * 1.2;
      boss.mesh.position.x += Math.cos(angle) * boss.speed * 0.3 * dt;
      boss.mesh.position.z += Math.sin(angle) * boss.speed * 0.3 * dt;
      boss.head.position.set(boss.mesh.position.x, 3.6, boss.mesh.position.z);
      boss.weapon.position.set(boss.mesh.position.x + 0.8, 2.5, boss.mesh.position.z - 1.5);
      boss.snowmobile.position.set(boss.mesh.position.x, 0.5, boss.mesh.position.z + 1);

      if (boss.fireTimer <= 0) {
        boss.fireTimer = 0.8;
        // fire burst at player + convoy
        var dCamB = dist2D(boss.mesh.position, cam);
        if (dCamB < 40) {
          // visual: enemy bullet flash only
        }
        var nearC = nearestConvoyDist(boss.mesh.position);
        if (nearC.dist < 35) {
          damageNearestConvoy(nearC, 15);
        }
      }

      // check if phase change
      if (boss.hp < boss.maxHp * 0.5 && boss.state !== 'berserk') {
        boss.state = 'berserk';
        boss.speed = 12;
      }
    } else if (boss.state === 'berserk') {
      // charge player
      dx = cam.x - boss.mesh.position.x;
      dz = cam.z - boss.mesh.position.z;
      len = Math.sqrt(dx * dx + dz * dz);
      if (len > 1) {
        dx /= len; dz /= len;
        boss.mesh.position.x += dx * boss.speed * dt;
        boss.mesh.position.z += dz * boss.speed * dt;
        boss.head.position.set(boss.mesh.position.x, 3.6, boss.mesh.position.z);
        boss.weapon.position.set(boss.mesh.position.x + 0.8, 2.5, boss.mesh.position.z - 1.5);
        boss.snowmobile.position.set(boss.mesh.position.x, 0.5, boss.mesh.position.z + 1);
      }
      if (boss.fireTimer <= 0) {
        boss.fireTimer = 0.4;
        var nearC2 = nearestConvoyDist(boss.mesh.position);
        if (nearC2.dist < 30) {
          damageNearestConvoy(nearC2, 20);
        }
      }
    }
  }

  // ── bullets ───────────────────────────────────────────────────────────────
  function shoot() {
    var now = clock.getElapsedTime();
    var fireRate = BASE_FIRE_RATE;
    if (frostbite >= 60) fireRate *= 2.5;
    if (now - lastFireTime < fireRate) return;
    lastFireTime = now;

    var dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    var bulletGeo = new THREE.SphereGeometry(0.08, 4, 4);
    var bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff44 });
    var bullet = new THREE.Mesh(bulletGeo, bulletMat);
    bullet.position.copy(camera.position);
    bullet.position.addScaledVector(dir, 0.5);
    scene.add(bullet);

    bullets.push({
      mesh: bullet,
      vel: dir.clone().multiplyScalar(80),
      life: 1.5
    });
  }

  function updateBullets(dt) {
    for (var i = bullets.length - 1; i >= 0; i--) {
      var b = bullets[i];
      b.life -= dt;
      if (b.life <= 0) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.vel, dt);

      // check enemy hits
      var hit = false;
      for (var j = 0; j < enemies.length; j++) {
        var e = enemies[j];
        if (!e.alive || e.hp <= 0) continue;
        if (b.mesh.position.distanceTo(e.mesh.position) < 1.2) {
          e.hp -= 25;
          hit = true;
          break;
        }
        if (b.mesh.position.distanceTo(e.head.position) < 0.7) {
          e.hp -= 50; // headshot
          hit = true;
          break;
        }
      }

      // check boss hit
      if (!hit && boss && boss.alive && boss.hp > 0) {
        if (b.mesh.position.distanceTo(boss.mesh.position) < 1.5) {
          boss.hp -= 20;
          hit = true;
        } else if (b.mesh.position.distanceTo(boss.head.position) < 0.8) {
          boss.hp -= 45;
          hit = true;
        }
      }

      if (hit) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }
  }

  // ── blizzard ──────────────────────────────────────────────────────────────
  function updateBlizzard(dt) {
    blizzardCycle += dt;

    if (!blizzardActive && blizzardCycle >= BLIZZARD_INTERVAL) {
      blizzardActive = true;
      blizzardTimer = 0;
      blizzardCycle = 0;
      // reduce fog distance
      if (scene.fog) scene.fog.far = 25;
      // show particles
      for (var i = 0; i < blizzardParticles.length; i++) {
        blizzardParticles[i].visible = true;
      }
    }

    if (blizzardActive) {
      blizzardTimer += dt;
      // animate particles
      for (var j = 0; j < blizzardParticles.length; j++) {
        var p = blizzardParticles[j];
        p.position.x += p.userData.vx * dt;
        p.position.y += p.userData.vy * dt;
        p.position.z += p.userData.vz * dt;
        if (p.position.y < -1) {
          p.position.y = 15;
          p.position.x = (Math.random() - 0.5) * 100;
          p.position.z = (Math.random() - 0.5) * 100;
        }
        if (p.position.x > 50) p.position.x = -50;
        if (p.position.x < -50) p.position.x = 50;
      }

      if (blizzardTimer >= BLIZZARD_DURATION) {
        blizzardActive = false;
        if (scene.fog) scene.fog.far = 80;
        for (var k = 0; k < blizzardParticles.length; k++) {
          blizzardParticles[k].visible = false;
        }
      }
    }
  }

  // ── frostbite ─────────────────────────────────────────────────────────────
  function updateFrostbite(dt) {
    if (!blizzardActive) {
      // recover slowly
      frostbite = Math.max(0, frostbite - 5 * dt);
      stillTimer = 0;
      return;
    }

    if (!playerMoved) {
      stillTimer += dt;
      if (stillTimer >= STILL_THRESHOLD) {
        frostbite = Math.min(100, frostbite + 10 * dt);
      }
    } else {
      stillTimer = 0;
      frostbite = Math.max(0, frostbite - 2 * dt);
    }
  }

  // ── player movement ───────────────────────────────────────────────────────
  function updatePlayer(dt) {
    if (!camera) return;

    var speed = 8;
    var moved = false;

    var forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    var right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    var move = new THREE.Vector3();
    if (keys['w'] || keys['arrowup'])    { move.addScaledVector(forward, 1); moved = true; }
    if (keys['s'] || keys['arrowdown'])  { move.addScaledVector(forward, -1); moved = true; }
    if (keys['a'] || keys['arrowleft'])  { move.addScaledVector(right, -1); moved = true; }
    if (keys['d'] || keys['arrowright']) { move.addScaledVector(right, 1); moved = true; }

    if (move.length() > 0) move.normalize();
    camera.position.addScaledVector(move, speed * dt);

    // clamp to ground
    var groundY = 1.6;
    if (camera.position.y < groundY) camera.position.y = groundY;

    // check if on bridge or in gorge
    var px = camera.position.x, pz = camera.position.z;
    var inGorge = (pz > -31 && pz < -19);
    var onBridge = inGorge && (Math.abs(px) < 3);

    if (inGorge && !onBridge) {
      // fell into gorge
      if (camera.position.y <= -2) {
        playerFell = true;
        gameState = 'lost';
        showMsg('MISSION FAILED — FELL INTO FROZEN RIVER', '#f44');
      }
      camera.position.y -= 10 * dt;
    }

    // shoot
    if (keys[' '] || keys['f']) {
      shoot();
    }

    playerMoved = moved;
  }

  // ── input ─────────────────────────────────────────────────────────────────
  function onKeyDown(e) {
    var k = e.key.toLowerCase();
    keys[k] = true;

    if (!active) {
      if (k === 'a') {
        keyA_time = Date.now();
      } else if (k === 'c') {
        if (Date.now() - keyA_time <= ACTIVATION_WINDOW) {
          activateModule();
        }
      }
    }
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function onMouseMove(e) {
    if (!active || gameState !== 'playing') return;
    var dx = e.movementX || 0;
    var dy = e.movementY || 0;
    camera.rotation.order = 'YXZ';
    camera.rotation.y -= dx * 0.002;
    camera.rotation.x -= dy * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, camera.rotation.x));
  }

  function onClick() {
    if (active && gameState === 'playing') {
      shoot();
      if (document.body.requestPointerLock) {
        document.body.requestPointerLock();
      }
    }
  }

  // ── core lifecycle ─────────────────────────────────────────────────────────
  function activateModule() {
    if (active) return;
    active = true;

    // find or create renderer / scene / camera from host app
    if (window.gameRenderer) {
      renderer = window.gameRenderer;
    } else {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0xb8d4e8);
      document.body.appendChild(renderer.domElement);
      window.gameRenderer = renderer;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.set(0, 1.6, 70);
    clock = new THREE.Clock();

    buildEnvironment();
    buildConvoy();
    buildHUD();

    gameState = 'playing';
    spawnWave(1);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ── update loop (called by host) ──────────────────────────────────────────
  function update() {
    if (!active || !clock) return;
    var dt = Math.min(clock.getDelta(), 0.05);

    if (gameState === 'playing') {
      updatePlayer(dt);
      updateConvoy(dt);
      updateEnemies(dt);
      updateBullets(dt);
      updateBlizzard(dt);
      updateFrostbite(dt);
      updateHUD();
    } else if (gameState !== 'idle') {
      // won/lost — keep rendering but stop updates
    }

    if (renderer && scene && camera) {
      if (renderer) renderer.render(scene, camera);
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function reset() {
    if (!active) return;

    // remove event listeners
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('click', onClick);
    window.removeEventListener('resize', onResize);

    // clear scene
    if (scene) {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }

    // remove HUD
    removeHUD();

    // reset state
    active = false;
    gameState = 'idle';
    convoyTrucks = [];
    enemies = [];
    blizzardParticles = [];
    pineClusters = [];
    bullets = [];
    boss = null;
    iceRidges = [];
    wave = 0;
    enemiesRemaining = 0;
    totalEnemies = 0;
    blizzardCycle = 0;
    blizzardActive = false;
    blizzardTimer = 0;
    frostbite = 0;
    stillTimer = 0;
    playerMoved = false;
    playerFell = false;
    convoyStarted = false;
    keys = {};
    keyA_time = 0;
  }

  // ── public init (called on page load to register key listener) ────────────
  function init() {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: was auto-launching over the main game */

    window.addEventListener('keydown', onKeyDown);
  }

  return { init: init, update: update, reset: reset };

}());
