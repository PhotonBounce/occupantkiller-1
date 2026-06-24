window.OilWar = (function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  var MODULE_NAME = 'OilWar';
  var ACTIVATION_WINDOW = 0.4; // 400ms
  var PUMP_COUNT = 6;
  var CAPTURE_TIME = 8;      // seconds to plant flag
  var REPAIR_TIME = 6;       // seconds to repair pipeline
  var SABOTAGE_TIME = 6;     // seconds to sabotage pipeline
  var CHARGE_TIME = 5;       // seconds to plant refinery charge
  var RESPAWN_TIME = 240;    // 4 minutes enemy respawn
  var INCOME_INTERVAL = 30;  // seconds between income ticks
  var INCOME_PER_PUMP = 15;  // gold per pump per tick
  var SANDSTORM_INTERVAL = 300; // 5 minutes between storms
  var SANDSTORM_DURATION = 60;  // 1 minute storm duration
  var NORMAL_FOG = 0.006;
  var STORM_FOG = 0.05;
  var ALLY_COUNT = 3;
  var ENEMY_SQUAD_SIZE = 5;  // enemies per pump
  var LAST_STAND_COUNT = 10; // enemies at refinery for last stand

  // ── State ─────────────────────────────────────────────────────────────────
  var active = false;
  var scene = null;
  var camera = null;
  var renderer = null;
  var animFrameId = null;
  var lastTime = 0;
  var originalFog = null;
  var originalBackground = null;

  // Keys
  var keys = {};
  var oKeyTime = 0;
  var wKeyTime = 0;

  // Player
  var playerHP = 100;
  var playerGold = 0;
  var playerHasVest = false;
  var playerHasRPG = false;
  var playerAirstrikes = 0;

  // Pump state: 0=red,1=blue
  var pumpOwner = [1, 1, 0, 0, 0, 0]; // player holds 2 at start
  var pumpMeshes = [];
  var pumpFlagMeshes = [];
  var pumpPositions = [
    { x: -30, z: -30 },
    { x:  30, z: -30 },
    { x: -30, z:   0 },
    { x:  30, z:   0 },
    { x: -30, z:  30 },
    { x:  30, z:  30 }
  ];

  // Capture progress
  var capturingPump = -1;
  var captureTimer = 0;
  var captureIsBlue = false;

  // Pipelines
  var pipelineMeshes = [];
  var pipelineBroken = [false, false, false, false, false]; // one per connection
  var pipelineFireMeshes = [];
  var pipelineFireLights = [];
  var repairingPipeline = -1;
  var repairTimer = 0;
  var sabotagingPipeline = -1;
  var sabotageTimer = 0;

  // Storage tanks
  var storageTankMeshes = [];

  // Checkpoints
  var checkpointMeshes = [];

  // Refinery
  var refineryMesh = null;
  var refineryState = 'neutral'; // neutral, contested, critical
  var refineryChargePlanted = false;
  var refineryChargeTimer = 0;
  var refineryChargeMesh = null;

  // Allies
  var allies = [];

  // Enemies
  var enemies = [];
  var enemyRespawnTimers = [];
  var enemyCount = 0;

  // Last-stand enemies (refinery)
  var lastStandSpawned = false;

  // Income
  var incomeTimer = 0;

  // Sandstorm
  var sandstormActive = false;
  var sandstormTimer = SANDSTORM_INTERVAL;
  var sandstormDuration = 0;
  var sandstormParticles = [];
  var sandstormParticleData = [];

  // HUD
  var hudEl = null;

  // Scene objects list for cleanup
  var ownedObjects = [];

  // Ally orders
  var selectedAlly = -1;

  // Near-object tracking
  var nearPump = -1;
  var nearCache = false;
  var nearPipeline = -1;
  var nearRefinery = false;

  // Supply cache mesh
  var cacheMesh = null;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function dist3(a, b) {
    var dx = a.x - b.x;
    var dy = (a.y || 0) - (b.y || 0);
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function getPlayerPos() {
    if (camera) { return camera.position; }
    return { x: 0, y: 1.7, z: 0 };
  }

  function addOwned(mesh) {
    scene.add(mesh);
    ownedObjects.push(mesh);
    return mesh;
  }

  function showNotification(msg) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;font-size:18px;' +
      'font-family:monospace;border:1px solid #888;pointer-events:none;z-index:9999;' +
      'border-radius:4px;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 3000);
  }

  function countBluePumps() {
    var n = 0;
    for (var i = 0; i < PUMP_COUNT; i++) {
      if (pumpOwner[i] === 1) { n++; }
    }
    return n;
  }

  function isPipelineBroken() {
    for (var i = 0; i < pipelineBroken.length; i++) {
      if (pipelineBroken[i]) { return true; }
    }
    return false;
  }

  // ── Build Environment ──────────────────────────────────────────────────────

  function buildEnvironment() {
    // Background + fog
    originalBackground = scene.background;
    originalFog = scene.fog;
    scene.background = new THREE.Color(0xAA9966);
    scene.fog = new THREE.FogExp2(0xAA9966, NORMAL_FOG);

    // Ambient light
    var ambient = new THREE.AmbientLight(0x888866, 0.8);
    addOwned(ambient);

    // Directional sun
    var sun = new THREE.DirectionalLight(0xFFDD88, 1.2);
    sun.position.set(40, 60, 30);
    addOwned(sun);

    // Ground — desert oilfield
    var groundGeo = new THREE.PlaneGeometry(160, 160);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0xBB9944 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    addOwned(ground);

    buildPumpJacks();
    buildStorageTanks();
    buildPipelines();
    buildCheckpoints();
    buildRefinery();
    buildSupplyCache();
    buildAllies();
    buildEnemies();
  }

  function buildPumpJacks() {
    // 6 pump jacks using CylinderGeometry — dark green (0x334433)
    var mat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var flagMatBlue = new THREE.MeshLambertMaterial({ color: 0x334488 });
    var flagMatRed  = new THREE.MeshLambertMaterial({ color: 0x882222 });

    for (var i = 0; i < PUMP_COUNT; i++) {
      var px = pumpPositions[i].x;
      var pz = pumpPositions[i].z;

      // Shaft
      var shaftGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 8);
      var shaft = new THREE.Mesh(shaftGeo, mat);
      shaft.position.set(px, 3, pz);
      addOwned(shaft);

      // Pump head (nodding donkey shape — cylinder on top)
      var headGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
      var head = new THREE.Mesh(headGeo, mat);
      head.position.set(px, 7.5, pz);
      addOwned(head);

      // Arm
      var armGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
      var arm = new THREE.Mesh(armGeo, mat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(px + 1.5, 7.5, pz);
      addOwned(arm);

      // Base
      var baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 1, 8);
      var base = new THREE.Mesh(baseGeo, mat);
      base.position.set(px, 0.5, pz);
      addOwned(base);

      pumpMeshes.push(shaft);

      // Flag pole
      var poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 4);
      var poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      var pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(px + 2, 1.5, pz);
      addOwned(pole);

      // Flag
      var flagGeo = new THREE.BoxGeometry(1, 0.5, 0.05);
      var flagMat2 = (pumpOwner[i] === 1) ? flagMatBlue : flagMatRed;
      var flag = new THREE.Mesh(flagGeo, flagMat2);
      flag.position.set(px + 2.5, 3, pz);
      addOwned(flag);
      pumpFlagMeshes.push(flag);

      // Respawn timer slot
      enemyRespawnTimers.push(0);
    }
  }

  function buildStorageTanks() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x445544 });
    var tankPositions = [
      { x: 0, z: -35 },
      { x: -15, z: 35 },
      { x: 15, z: 35 }
    ];
    for (var i = 0; i < tankPositions.length; i++) {
      var geo = new THREE.CylinderGeometry(4, 4, 6, 12);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(tankPositions[i].x, 3, tankPositions[i].z);
      addOwned(mesh);
      storageTankMeshes.push(mesh);
    }
  }

  function buildPipelines() {
    // Connect pumps with BoxGeometry pipelines 1x0.5x30
    var mat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    // 5 pipeline sections connecting adjacent pumps
    var connections = [
      [0, 1], // pump 0 to pump 1
      [2, 3], // pump 2 to pump 3
      [4, 5], // pump 4 to pump 5
      [0, 2], // pump 0 to pump 2
      [1, 3]  // pump 1 to pump 3
    ];

    for (var i = 0; i < connections.length; i++) {
      var a = pumpPositions[connections[i][0]];
      var b = pumpPositions[connections[i][1]];
      var cx = (a.x + b.x) / 2;
      var cz = (a.z + b.z) / 2;
      var dx = b.x - a.x;
      var dz = b.z - a.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      var angle = Math.atan2(dx, dz);

      var geo = new THREE.BoxGeometry(1, 0.5, len);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cx, 0.25, cz);
      mesh.rotation.y = angle;
      addOwned(mesh);
      pipelineMeshes.push(mesh);
      pipelineFireMeshes.push(null);
      pipelineFireLights.push(null);
    }
  }

  function buildCheckpoints() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x334433 });
    var cpPositions = [
      { x: -15, z: -15 },
      { x: 15, z: 15 }
    ];
    for (var i = 0; i < cpPositions.length; i++) {
      var geo = new THREE.BoxGeometry(5, 4, 4);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cpPositions[i].x, 2, cpPositions[i].z);
      addOwned(mesh);
      checkpointMeshes.push(mesh);
    }
  }

  function buildRefinery() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x445533 });
    var geo = new THREE.BoxGeometry(20, 8, 15);
    refineryMesh = new THREE.Mesh(geo, mat);
    refineryMesh.position.set(0, 4, 0);
    addOwned(refineryMesh);

    // Chimney stacks
    var stackMat = new THREE.MeshLambertMaterial({ color: 0x334422 });
    var stackPositions = [
      { x: -7, z: -4 }, { x: 7, z: -4 },
      { x: -7, z:  4 }, { x: 7, z:  4 }
    ];
    for (var i = 0; i < stackPositions.length; i++) {
      var sGeo = new THREE.CylinderGeometry(0.5, 0.7, 6, 6);
      var stack = new THREE.Mesh(sGeo, stackMat);
      stack.position.set(stackPositions[i].x, 11, stackPositions[i].z);
      addOwned(stack);
    }
  }

  function buildSupplyCache() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x44FF44 });
    var geo = new THREE.BoxGeometry(4, 3, 4);
    cacheMesh = new THREE.Mesh(geo, mat);
    cacheMesh.position.set(-40, 1.5, 0);
    addOwned(cacheMesh);

    // Label sign
    var signMat = new THREE.MeshLambertMaterial({ color: 0x228822 });
    var signGeo = new THREE.BoxGeometry(3, 1, 0.1);
    var sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(-40, 4, 0);
    addOwned(sign);
  }

  function buildAllies() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x334488 });
    var allyStartPositions = [
      { x: -28, z: -28 },
      { x:  28, z: -28 },
      { x: -5, z: -8 }
    ];
    for (var i = 0; i < ALLY_COUNT; i++) {
      var geo = new THREE.BoxGeometry(1, 2, 1);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(allyStartPositions[i].x, 1, allyStartPositions[i].z);
      addOwned(mesh);
      allies.push({
        mesh: mesh,
        hp: 100,
        alive: true,
        state: 'follow',    // follow, defend, advance
        targetPump: -1,
        pos: { x: allyStartPositions[i].x, z: allyStartPositions[i].z },
        attackTimer: 0
      });
    }
  }

  function buildEnemies() {
    // Spawn enemies near red-owned pumps (pumps 2-5 at start)
    for (var i = 0; i < PUMP_COUNT; i++) {
      if (pumpOwner[i] === 0) {
        spawnEnemiesAtPump(i, 2);
      }
    }
  }

  function spawnEnemiesAtPump(pumpIdx, count) {
    var mat = new THREE.MeshLambertMaterial({ color: 0x882222 });
    var px = pumpPositions[pumpIdx].x;
    var pz = pumpPositions[pumpIdx].z;
    for (var i = 0; i < count; i++) {
      var geo = new THREE.BoxGeometry(1, 2, 1);
      var mesh = new THREE.Mesh(geo, mat);
      var ex = px + rand(-5, 5);
      var ez = pz + rand(-5, 5);
      mesh.position.set(ex, 1, ez);
      addOwned(mesh);
      enemies.push({
        mesh: mesh,
        hp: 60,
        alive: true,
        pumpIdx: pumpIdx,
        pos: { x: ex, z: ez },
        state: 'patrol',
        attackTimer: 0,
        moveTimer: rand(0, 3),
        moveDir: { x: rand(-1, 1), z: rand(-1, 1) }
      });
      enemyCount++;
    }
  }

  function spawnLastStandEnemies() {
    if (lastStandSpawned) { return; }
    lastStandSpawned = true;
    var mat = new THREE.MeshLambertMaterial({ color: 0xAA1111 });
    for (var i = 0; i < LAST_STAND_COUNT; i++) {
      var geo = new THREE.BoxGeometry(1.2, 2.2, 1.2);
      var mesh = new THREE.Mesh(geo, mat);
      var ex = rand(-12, 12);
      var ez = rand(-8, 8);
      mesh.position.set(ex, 1, ez);
      addOwned(mesh);
      enemies.push({
        mesh: mesh,
        hp: 80,
        alive: true,
        pumpIdx: -1,
        pos: { x: ex, z: ez },
        state: 'guard-refinery',
        attackTimer: 0,
        moveTimer: rand(0, 2),
        moveDir: { x: rand(-1, 1), z: rand(-1, 1) }
      });
      enemyCount++;
    }
    showNotification('REFINERY LAST STAND — 10 REBELS SPAWNED!');
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'oil-war-hud';
    hudEl.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.75);color:#ddff88;padding:8px 16px;font-family:monospace;' +
      'font-size:14px;border:1px solid #556644;border-radius:4px;pointer-events:none;' +
      'z-index:9000;white-space:nowrap;';
    document.body.appendChild(hudEl);
    updateHUD();
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
    }
    hudEl = null;
  }

  function updateHUD() {
    if (!hudEl) { return; }
    var pumps = countBluePumps();
    var pipeline = isPipelineBroken() ? 'BREACHED' : 'OK';
    var rebels = 0;
    for (var i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) { rebels++; }
    }
    var refStr = refineryState.toUpperCase();
    hudEl.textContent = 'OIL WAR [PUMPS: ' + pumps + '/6] [GOLD: ' + playerGold + '] ' +
      '[PIPELINE: ' + pipeline + '] [REBELS: ' + rebels + '] | REFINERY: ' + refStr;
  }

  // ── Pipeline Sabotage / Fire ───────────────────────────────────────────────

  function breakPipeline(idx) {
    if (pipelineBroken[idx]) { return; }
    pipelineBroken[idx] = true;

    // Turn pipeline segment dark/broken
    if (pipelineMeshes[idx]) {
      pipelineMeshes[idx].material = new THREE.MeshLambertMaterial({ color: 0x332200 });
    }

    // Create fire mesh
    var pm = pipelineMeshes[idx];
    if (pm) {
      var fireGeo = new THREE.BoxGeometry(2, 2, 2);
      var fireMat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0xFF2200 });
      var fireMesh = new THREE.Mesh(fireGeo, fireMat);
      fireMesh.position.set(pm.position.x, 1.5, pm.position.z);
      addOwned(fireMesh);
      pipelineFireMeshes[idx] = fireMesh;

      // Fire light
      var fireLight = new THREE.PointLight(0xFF4400, 2, 12);
      fireLight.position.set(pm.position.x, 2, pm.position.z);
      addOwned(fireLight);
      pipelineFireLights[idx] = fireLight;
    }
  }

  function repairPipeline(idx) {
    if (!pipelineBroken[idx]) { return; }
    pipelineBroken[idx] = false;

    if (pipelineMeshes[idx]) {
      pipelineMeshes[idx].material = new THREE.MeshLambertMaterial({ color: 0x556644 });
    }
    if (pipelineFireMeshes[idx]) {
      scene.remove(pipelineFireMeshes[idx]);
      pipelineFireMeshes[idx] = null;
    }
    if (pipelineFireLights[idx]) {
      scene.remove(pipelineFireLights[idx]);
      pipelineFireLights[idx] = null;
    }
    showNotification('PIPELINE REPAIRED');
  }

  // ── Pump Capture ──────────────────────────────────────────────────────────

  function updatePumpFlag(pumpIdx) {
    var flag = pumpFlagMeshes[pumpIdx];
    if (!flag) { return; }
    if (pumpOwner[pumpIdx] === 1) {
      flag.material = new THREE.MeshLambertMaterial({ color: 0x334488 });
    } else {
      flag.material = new THREE.MeshLambertMaterial({ color: 0x882222 });
    }
  }

  function capturePump(pumpIdx, blue) {
    pumpOwner[pumpIdx] = blue ? 1 : 0;
    updatePumpFlag(pumpIdx);
    if (blue) {
      showNotification('PUMP ' + (pumpIdx + 1) + ' CAPTURED!');
      var bluePumps = countBluePumps();
      if (bluePumps >= 5 && refineryState === 'neutral') {
        refineryState = 'critical';
        spawnLastStandEnemies();
        showNotification('5 PUMPS HELD — REFINERY CRITICAL! PLANT CHARGE TO WIN!');
      } else if (bluePumps >= 5) {
        refineryState = 'critical';
      } else if (bluePumps >= 3) {
        refineryState = 'contested';
      }
    } else {
      showNotification('PUMP ' + (pumpIdx + 1) + ' LOST TO REBELS!');
      var bluePumps2 = countBluePumps();
      if (bluePumps2 < 5 && refineryState === 'critical') {
        refineryState = 'contested';
      }
      if (bluePumps2 < 3) {
        refineryState = 'neutral';
      }
      // Spawn enemy defenders to retake
      spawnEnemiesAtPump(pumpIdx, 2);
    }
  }

  // ── Sandstorm ─────────────────────────────────────────────────────────────

  function startSandstorm() {
    sandstormActive = true;
    sandstormDuration = 0;
    if (scene) {
      scene.fog = new THREE.FogExp2(0xAA8833, STORM_FOG);
    }
    showNotification('SANDSTORM INCOMING — VISIBILITY REDUCED');

    // Spawn sandstorm particles
    var mat = new THREE.MeshLambertMaterial({ color: 0xBB9933 });
    for (var i = 0; i < 200; i++) {
      var geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var mesh = new THREE.Mesh(geo, mat);
      var px = rand(-50, 50);
      var py = rand(0.5, 8);
      var pz = rand(-50, 50);
      mesh.position.set(px, py, pz);
      addOwned(mesh);
      sandstormParticles.push(mesh);
      sandstormParticleData.push({
        vx: rand(-5, -2),
        vy: rand(-0.5, 0.5),
        vz: rand(-2, 2)
      });
    }
  }

  function endSandstorm() {
    sandstormActive = false;
    if (scene) {
      scene.fog = new THREE.FogExp2(0xAA9966, NORMAL_FOG);
    }

    // Remove particles
    for (var i = 0; i < sandstormParticles.length; i++) {
      if (scene) { scene.remove(sandstormParticles[i]); }
      var idx2 = ownedObjects.indexOf(sandstormParticles[i]);
      if (idx2 !== -1) { ownedObjects.splice(idx2, 1); }
    }
    sandstormParticles = [];
    sandstormParticleData = [];
    showNotification('SANDSTORM PASSED');
  }

  function updateSandstorm(dt) {
    if (!sandstormActive) {
      sandstormTimer -= dt;
      if (sandstormTimer <= 0) {
        startSandstorm();
        sandstormTimer = SANDSTORM_INTERVAL;
      }
    } else {
      sandstormDuration += dt;
      if (sandstormDuration >= SANDSTORM_DURATION) {
        endSandstorm();
      }
      // Animate particles
      for (var i = 0; i < sandstormParticles.length; i++) {
        var p = sandstormParticles[i];
        var pd = sandstormParticleData[i];
        p.position.x += pd.vx * dt;
        p.position.y += pd.vy * dt;
        p.position.z += pd.vz * dt;
        // Wrap
        if (p.position.x < -55) { p.position.x = 55; }
        if (p.position.x > 55) { p.position.x = -55; }
        if (p.position.y < 0.3) { p.position.y = rand(2, 8); }
        if (p.position.y > 10) { p.position.y = 0.5; }
        if (p.position.z < -55) { p.position.z = 55; }
        if (p.position.z > 55) { p.position.z = -55; }
      }
      // Flicker fire lights in storm
      for (var j = 0; j < pipelineFireLights.length; j++) {
        if (pipelineFireLights[j]) {
          pipelineFireLights[j].intensity = 1 + Math.sin(Date.now() * 0.01) * 0.5;
        }
      }
    }
  }

  // ── Income System ─────────────────────────────────────────────────────────

  function updateIncome(dt) {
    incomeTimer += dt;
    if (incomeTimer >= INCOME_INTERVAL) {
      incomeTimer = 0;
      var income = countBluePumps() * INCOME_PER_PUMP;
      playerGold += income;
      if (income > 0) {
        showNotification('+' + income + ' GOLD (pumps: ' + countBluePumps() + ')');
      }
    }
  }

  // ── Allies AI ─────────────────────────────────────────────────────────────

  function updateAllies(dt) {
    var playerPos = getPlayerPos();
    for (var i = 0; i < allies.length; i++) {
      var al = allies[i];
      if (!al.alive) { continue; }

      var ax = al.mesh.position.x;
      var az = al.mesh.position.z;
      var speed = 6;

      if (al.state === 'follow') {
        // Move toward player
        var fdx = playerPos.x - ax;
        var fdz = playerPos.z - az;
        var fd = Math.sqrt(fdx * fdx + fdz * fdz);
        if (fd > 5) {
          al.mesh.position.x += (fdx / fd) * speed * dt;
          al.mesh.position.z += (fdz / fd) * speed * dt;
        }
      } else if (al.state === 'defend' && al.targetPump >= 0) {
        // Move to pump
        var tp = pumpPositions[al.targetPump];
        var ddx = tp.x - ax;
        var ddz = tp.z - az;
        var dd = Math.sqrt(ddx * ddx + ddz * ddz);
        if (dd > 3) {
          al.mesh.position.x += (ddx / dd) * speed * dt;
          al.mesh.position.z += (ddz / dd) * speed * dt;
        }
      } else if (al.state === 'advance') {
        // Move toward nearest red pump
        var nearestRed = -1;
        var nearestDist = 999;
        for (var pi = 0; pi < PUMP_COUNT; pi++) {
          if (pumpOwner[pi] === 0) {
            var pdx = pumpPositions[pi].x - ax;
            var pdz = pumpPositions[pi].z - az;
            var pd2 = Math.sqrt(pdx * pdx + pdz * pdz);
            if (pd2 < nearestDist) {
              nearestDist = pd2;
              nearestRed = pi;
            }
          }
        }
        if (nearestRed >= 0) {
          var tp2 = pumpPositions[nearestRed];
          var adx = tp2.x - ax;
          var adz = tp2.z - az;
          var ad = Math.sqrt(adx * adx + adz * adz);
          if (ad > 3) {
            al.mesh.position.x += (adx / ad) * speed * dt;
            al.mesh.position.z += (adz / ad) * speed * dt;
          }
        }
      }

      // Ally attacks nearby enemies
      al.attackTimer += dt;
      if (al.attackTimer >= 2) {
        al.attackTimer = 0;
        for (var ei = 0; ei < enemies.length; ei++) {
          var en = enemies[ei];
          if (!en.alive) { continue; }
          var edx = en.mesh.position.x - al.mesh.position.x;
          var edz = en.mesh.position.z - al.mesh.position.z;
          var ed = Math.sqrt(edx * edx + edz * edz);
          if (ed < 8) {
            en.hp -= 20;
            if (en.hp <= 0) {
              en.alive = false;
              scene.remove(en.mesh);
              enemyCount--;
            }
            break;
          }
        }
      }
    }
  }

  // ── Enemy AI ──────────────────────────────────────────────────────────────

  function updateEnemies(dt) {
    var playerPos = getPlayerPos();
    var sightRange = sandstormActive ? 15 : 30;

    for (var i = 0; i < enemies.length; i++) {
      var en = enemies[i];
      if (!en.alive) { continue; }

      var ex = en.mesh.position.x;
      var ez = en.mesh.position.z;
      var speed = 4;

      // Move toward player if in sight
      var pdx = playerPos.x - ex;
      var pdz = playerPos.z - ez;
      var pd = Math.sqrt(pdx * pdx + pdz * pdz);

      if (pd < sightRange) {
        // Chase player
        if (pd > 3) {
          en.mesh.position.x += (pdx / pd) * speed * dt;
          en.mesh.position.z += (pdz / pd) * speed * dt;
        }
        // Attack player
        en.attackTimer += dt;
        if (en.attackTimer >= 2 && pd < 5) {
          en.attackTimer = 0;
          var dmg = playerHasVest ? 5 : 10;
          playerHP -= dmg;
          if (playerHP <= 0) {
            playerHP = 0;
            showNotification('YOU WERE KILLED — RESPAWNING...');
            setTimeout(function () {
              playerHP = 100;
              if (camera) { camera.position.set(0, 1.7, -20); }
              showNotification('RESPAWNED');
            }, 3000);
          }
        }
      } else if (en.state === 'guard-refinery') {
        // Patrol near refinery
        en.moveTimer -= dt;
        if (en.moveTimer <= 0) {
          en.moveTimer = rand(2, 4);
          en.moveDir = { x: rand(-1, 1), z: rand(-1, 1) };
          var mlen = Math.sqrt(en.moveDir.x * en.moveDir.x + en.moveDir.z * en.moveDir.z);
          if (mlen > 0) { en.moveDir.x /= mlen; en.moveDir.z /= mlen; }
        }
        var nx = en.mesh.position.x + en.moveDir.x * speed * dt;
        var nz = en.mesh.position.z + en.moveDir.z * speed * dt;
        // Keep near refinery (0,0)
        if (Math.abs(nx) < 20 && Math.abs(nz) < 15) {
          en.mesh.position.x = nx;
          en.mesh.position.z = nz;
        }
      } else if (en.pumpIdx >= 0) {
        // Try to retake/defend their pump
        var tp = pumpPositions[en.pumpIdx];
        var tdx = tp.x - ex;
        var tdz = tp.z - ez;
        var td = Math.sqrt(tdx * tdx + tdz * tdz);
        if (td > 5) {
          en.mesh.position.x += (tdx / td) * speed * dt;
          en.mesh.position.z += (tdz / td) * speed * dt;
        } else {
          // Near their pump — try to recapture
          if (pumpOwner[en.pumpIdx] === 1) {
            // Blue-owned — attack
            en.attackTimer += dt;
            if (en.attackTimer >= 5) {
              en.attackTimer = 0;
              capturePump(en.pumpIdx, false);
            }
          }
        }
      } else {
        // Random patrol
        en.moveTimer -= dt;
        if (en.moveTimer <= 0) {
          en.moveTimer = rand(2, 4);
          en.moveDir = { x: rand(-1, 1), z: rand(-1, 1) };
          var ml = Math.sqrt(en.moveDir.x * en.moveDir.x + en.moveDir.z * en.moveDir.z);
          if (ml > 0) { en.moveDir.x /= ml; en.moveDir.z /= ml; }
        }
        en.mesh.position.x += en.moveDir.x * speed * dt;
        en.mesh.position.z += en.moveDir.z * speed * dt;
        // Clamp to field
        en.mesh.position.x = Math.max(-50, Math.min(50, en.mesh.position.x));
        en.mesh.position.z = Math.max(-50, Math.min(50, en.mesh.position.z));
      }
    }

    // Enemy pipeline sabotage — random chance
    if (Math.random() < 0.001 && !sandstormActive) {
      var idx = Math.floor(Math.random() * pipelineMeshes.length);
      if (!pipelineBroken[idx]) {
        breakPipeline(idx);
        showNotification('PIPELINE SECTION SABOTAGED BY REBELS!');
      }
    }
  }

  // ── Enemy Respawn ─────────────────────────────────────────────────────────

  function updateRespawns(dt) {
    for (var i = 0; i < PUMP_COUNT; i++) {
      if (pumpOwner[i] === 0) {
        // Red-owned pump — respawn enemies
        enemyRespawnTimers[i] -= dt;
        if (enemyRespawnTimers[i] <= 0) {
          enemyRespawnTimers[i] = RESPAWN_TIME;
          spawnEnemiesAtPump(i, 1);
        }
      }
    }
  }

  // ── Proximity Checks ──────────────────────────────────────────────────────

  function checkProximities() {
    var pp = getPlayerPos();

    // Check pump proximity
    nearPump = -1;
    for (var i = 0; i < PUMP_COUNT; i++) {
      var dx = pp.x - pumpPositions[i].x;
      var dz = pp.z - pumpPositions[i].z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < 5) {
        nearPump = i;
        break;
      }
    }

    // Check supply cache proximity
    nearCache = false;
    if (cacheMesh) {
      var cdx = pp.x - cacheMesh.position.x;
      var cdz = pp.z - cacheMesh.position.z;
      if (Math.sqrt(cdx * cdx + cdz * cdz) < 5) {
        nearCache = true;
      }
    }

    // Check pipeline proximity
    nearPipeline = -1;
    for (var j = 0; j < pipelineMeshes.length; j++) {
      var pm = pipelineMeshes[j];
      if (!pm) { continue; }
      var pmdx = pp.x - pm.position.x;
      var pmdz = pp.z - pm.position.z;
      var pmd = Math.sqrt(pmdx * pmdx + pmdz * pmdz);
      if (pmd < 6) {
        nearPipeline = j;
        break;
      }
    }

    // Check refinery proximity
    nearRefinery = false;
    if (refineryMesh) {
      var rdx = pp.x - refineryMesh.position.x;
      var rdz = pp.z - refineryMesh.position.z;
      if (Math.sqrt(rdx * rdx + rdz * rdz) < 12) {
        nearRefinery = true;
      }
    }
  }

  // ── Interaction (E key) ───────────────────────────────────────────────────

  function handleEDown() {
    if (!active) { return; }

    var pp = getPlayerPos();

    // Refinery charge plant
    if (nearRefinery && refineryState === 'critical' && !refineryChargePlanted) {
      refineryChargePlanted = true;
      refineryChargeTimer = 0;
      // Visual charge
      var cGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      var cMat = new THREE.MeshLambertMaterial({ color: 0xFF2200, emissive: 0xFF0000 });
      refineryChargeMesh = new THREE.Mesh(cGeo, cMat);
      refineryChargeMesh.position.set(pp.x, 1, pp.z);
      addOwned(refineryChargeMesh);
      showNotification('PLANTING CHARGE... HOLD E FOR 5s');
      return;
    }

    // Pump capture
    if (nearPump >= 0) {
      var pump = nearPump;

      // Check if selected ally wants to defend
      if (selectedAlly >= 0 && selectedAlly < allies.length && allies[selectedAlly].alive) {
        allies[selectedAlly].state = 'defend';
        allies[selectedAlly].targetPump = pump;
        showNotification('SOLDIER ' + (selectedAlly + 1) + ' ORDERED TO DEFEND PUMP ' + (pump + 1));
        selectedAlly = -1;
        return;
      }

      if (pumpOwner[pump] === 0) {
        // Start capture
        capturingPump = pump;
        captureTimer = 0;
        captureIsBlue = true;
        showNotification('CAPTURING PUMP ' + (pump + 1) + '... HOLD E FOR 8s');
      } else {
        showNotification('PUMP ' + (pump + 1) + ' ALREADY HELD');
      }
      return;
    }

    // Pipeline repair / sabotage
    if (nearPipeline >= 0) {
      var pi = nearPipeline;
      if (pipelineBroken[pi]) {
        // Repair our broken pipeline
        repairingPipeline = pi;
        repairTimer = 0;
        showNotification('REPAIRING PIPELINE... HOLD E FOR 6s');
      } else {
        // Check if near red territory — sabotage
        var pm = pipelineMeshes[pi];
        if (pm) {
          sabotagingPipeline = pi;
          sabotageTimer = 0;
          showNotification('SABOTAGING PIPELINE... HOLD E FOR 6s');
        }
      }
      return;
    }

    // Supply cache
    if (nearCache) {
      showShop();
    }
  }

  function handleEUp() {
    // Cancel captures/repairs
    if (capturingPump >= 0) {
      capturingPump = -1;
      captureTimer = 0;
    }
    if (repairingPipeline >= 0) {
      repairingPipeline = -1;
      repairTimer = 0;
    }
    if (sabotagingPipeline >= 0) {
      sabotagingPipeline = -1;
      sabotageTimer = 0;
    }
    if (refineryChargePlanted) {
      // Cancel if released
      refineryChargePlanted = false;
      refineryChargeTimer = 0;
      if (refineryChargeMesh) {
        scene.remove(refineryChargeMesh);
        var idx3 = ownedObjects.indexOf(refineryChargeMesh);
        if (idx3 !== -1) { ownedObjects.splice(idx3, 1); }
        refineryChargeMesh = null;
      }
      showNotification('CHARGE DISARMED');
    }
  }

  // ── Interaction Progress ──────────────────────────────────────────────────

  function updateInteractions(dt) {
    // Pump capture
    if (capturingPump >= 0) {
      captureTimer += dt;
      if (captureTimer >= CAPTURE_TIME) {
        capturePump(capturingPump, captureIsBlue);
        capturingPump = -1;
        captureTimer = 0;
      }
    }

    // Pipeline repair
    if (repairingPipeline >= 0) {
      repairTimer += dt;
      if (repairTimer >= REPAIR_TIME) {
        repairPipeline(repairingPipeline);
        repairingPipeline = -1;
        repairTimer = 0;
      }
    }

    // Pipeline sabotage
    if (sabotagingPipeline >= 0) {
      sabotageTimer += dt;
      if (sabotageTimer >= SABOTAGE_TIME) {
        breakPipeline(sabotagingPipeline);
        showNotification('PIPELINE SABOTAGED! ENEMY INCOME CUT');
        sabotagingPipeline = -1;
        sabotageTimer = 0;
      }
    }

    // Refinery charge
    if (refineryChargePlanted) {
      refineryChargeTimer += dt;
      if (refineryChargeMesh) {
        // Pulse
        var scale = 1 + Math.sin(Date.now() * 0.005) * 0.3;
        refineryChargeMesh.scale.setScalar(scale);
      }
      if (refineryChargeTimer >= CHARGE_TIME) {
        triggerWin();
      }
    }
  }

  // ── Shop ──────────────────────────────────────────────────────────────────

  function showShop() {
    var shopEl = document.createElement('div');
    shopEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:rgba(0,20,0,0.95);color:#88ff88;padding:20px;font-family:monospace;' +
      'font-size:14px;border:2px solid #44ff44;border-radius:6px;z-index:10000;min-width:260px;';
    shopEl.innerHTML = '<div style="font-size:16px;margin-bottom:10px;">SUPPLY CACHE — GOLD: ' + playerGold + '</div>' +
      '<div style="margin:6px 0;">[1] RPG Launcher — 300g</div>' +
      '<div style="margin:6px 0;">[2] Airstrike — 500g</div>' +
      '<div style="margin:6px 0;">[3] Armored Vest — 150g</div>' +
      '<div style="margin-top:12px;color:#aaa;">[ESC] Close</div>';
    document.body.appendChild(shopEl);

    function onShopKey(e) {
      var k = e.key;
      if (k === '1' && playerGold >= 300) {
        playerGold -= 300;
        playerHasRPG = true;
        showNotification('RPG LAUNCHER ACQUIRED');
        closeShop();
      } else if (k === '2' && playerGold >= 500) {
        playerGold -= 500;
        playerAirstrikes++;
        triggerAirstrike();
        closeShop();
      } else if (k === '3' && playerGold >= 150) {
        playerGold -= 150;
        playerHasVest = true;
        showNotification('ARMORED VEST EQUIPPED — DAMAGE HALVED');
        closeShop();
      } else if (k === '1' || k === '2' || k === '3') {
        showNotification('NOT ENOUGH GOLD');
      } else if (k === 'Escape') {
        closeShop();
      }
    }

    function closeShop() {
      document.removeEventListener('keydown', onShopKey);
      if (shopEl.parentNode) { shopEl.parentNode.removeChild(shopEl); }
      updateHUD();
    }

    document.addEventListener('keydown', onShopKey);
  }

  // ── Airstrike ─────────────────────────────────────────────────────────────

  function triggerAirstrike() {
    showNotification('AIRSTRIKE INCOMING — 5 IMPACT POINTS');
    var pp = getPlayerPos();
    var impactPositions = [];
    for (var i = 0; i < 5; i++) {
      impactPositions.push({
        x: pp.x + rand(-20, 20),
        z: pp.z + rand(-20, 20)
      });
    }

    // Spawn bomb spheres dropping down
    for (var j = 0; j < impactPositions.length; j++) {
      (function (impact) {
        var geo = new THREE.SphereGeometry(0.4, 6, 6);
        var mat2 = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var bomb = new THREE.Mesh(geo, mat2);
        bomb.position.set(impact.x, 30, impact.z);
        addOwned(bomb);

        var dropInterval = setInterval(function () {
          if (!active) { clearInterval(dropInterval); return; }
          bomb.position.y -= 2;
          if (bomb.position.y <= 1) {
            clearInterval(dropInterval);
            scene.remove(bomb);
            var bidx = ownedObjects.indexOf(bomb);
            if (bidx !== -1) { ownedObjects.splice(bidx, 1); }
            // Damage enemies in radius
            var expLight = new THREE.PointLight(0xFF8800, 3, 20);
            expLight.position.set(impact.x, 3, impact.z);
            addOwned(expLight);
            setTimeout(function () {
              if (scene) {
                scene.remove(expLight);
                var eidx = ownedObjects.indexOf(expLight);
                if (eidx !== -1) { ownedObjects.splice(eidx, 1); }
              }
            }, 1000);
            for (var ei = 0; ei < enemies.length; ei++) {
              var en = enemies[ei];
              if (!en.alive) { continue; }
              var edx = en.mesh.position.x - impact.x;
              var edz = en.mesh.position.z - impact.z;
              var ed = Math.sqrt(edx * edx + edz * edz);
              if (ed < 8) {
                en.hp -= 60;
                if (en.hp <= 0) {
                  en.alive = false;
                  scene.remove(en.mesh);
                  enemyCount--;
                }
              }
            }
          }
        }, 50);
      }(impactPositions[j]));
    }
  }

  // ── Win / Lose ────────────────────────────────────────────────────────────

  function triggerWin() {
    showNotification('REFINERY DESTROYED — OIL WAR VICTORY!');
    var winEl = document.createElement('div');
    winEl.style.cssText = 'position:fixed;top:40%;left:50%;transform:translateX(-50%);' +
      'background:rgba(0,0,0,0.9);color:#44ff44;padding:30px 50px;font-size:28px;' +
      'font-family:monospace;border:2px solid #44ff44;border-radius:8px;z-index:10001;';
    winEl.innerHTML = 'VICTORY<br><span style="font-size:14px;">All 6 pumps captured &amp; refinery destroyed.<br>[Press R to restart]</span>';
    document.body.appendChild(winEl);

    setTimeout(function () {
      if (winEl.parentNode) { winEl.parentNode.removeChild(winEl); }
      deactivate();
    }, 10000);
  }

  // ── Ally Selection ────────────────────────────────────────────────────────

  function selectNearestAlly() {
    var pp = getPlayerPos();
    var bestIdx = -1;
    var bestDist = 999;
    for (var i = 0; i < allies.length; i++) {
      if (!allies[i].alive) { continue; }
      var dx = pp.x - allies[i].mesh.position.x;
      var dz = pp.z - allies[i].mesh.position.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < 8 && d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      selectedAlly = bestIdx;
      showNotification('SOLDIER ' + (bestIdx + 1) + ' SELECTED — PRESS E NEAR PUMP TO ASSIGN');
    }
  }

  // ── Key Handlers ──────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var key = e.key.toLowerCase();
    keys[key] = true;

    var now = performance.now() / 1000;

    if (key === 'o') {
      oKeyTime = now;
      if (wKeyTime > 0 && (now - wKeyTime) <= ACTIVATION_WINDOW) {
        if (!active) { activate(); }
        return;
      }
    }
    if (key === 'w') {
      wKeyTime = now;
      if (oKeyTime > 0 && (now - oKeyTime) <= ACTIVATION_WINDOW) {
        if (!active) { activate(); }
        return;
      }
    }

    if (!active) { return; }

    if (key === 'e') {
      handleEDown();
    }

    if (key === 'q') {
      selectNearestAlly();
    }

    if (key === 'h') {
      // Order selected ally to hold
      if (selectedAlly >= 0 && selectedAlly < allies.length) {
        allies[selectedAlly].state = 'defend';
        showNotification('SOLDIER ' + (selectedAlly + 1) + ' — HOLD POSITION');
      }
    }

    if (key === 'f') {
      // Order selected ally to advance
      if (selectedAlly >= 0 && selectedAlly < allies.length) {
        allies[selectedAlly].state = 'advance';
        showNotification('SOLDIER ' + (selectedAlly + 1) + ' — ADVANCE ORDER');
        selectedAlly = -1;
      }
    }

    if (key === 'r' && !active) {
      activate();
    }

    // RPG fire
    if (key === 'x' && playerHasRPG) {
      fireRPG();
    }
  }

  function onKeyUp(e) {
    var key = e.key.toLowerCase();
    keys[key] = false;

    if (!active) { return; }

    if (key === 'e') {
      handleEUp();
    }
  }

  function fireRPG() {
    var pp = getPlayerPos();
    // Damage nearby enemies
    for (var i = 0; i < enemies.length; i++) {
      if (!enemies[i].alive) { continue; }
      var dx = enemies[i].mesh.position.x - pp.x;
      var dz = enemies[i].mesh.position.z - pp.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      var range = sandstormActive ? 10 : 20;
      if (d < range) {
        enemies[i].hp -= 80;
        if (enemies[i].hp <= 0) {
          enemies[i].alive = false;
          scene.remove(enemies[i].mesh);
          enemyCount--;
        }
      }
    }
    // Visual flash
    var flashLight = new THREE.PointLight(0xFF6600, 5, 30);
    flashLight.position.set(pp.x, 2, pp.z);
    addOwned(flashLight);
    setTimeout(function () {
      if (scene) {
        scene.remove(flashLight);
        var fidx = ownedObjects.indexOf(flashLight);
        if (fidx !== -1) { ownedObjects.splice(fidx, 1); }
      }
    }, 400);
    showNotification('RPG FIRED!');
  }

  // ── Main Loop ─────────────────────────────────────────────────────────────

  function animate(timestamp) {
    if (!active) { return; }
    animFrameId = requestAnimationFrame(animate);

    var now = timestamp || performance.now();
    var dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (dt <= 0) { return; }

    checkProximities();
    updateInteractions(dt);
    updateAllies(dt);
    updateEnemies(dt);
    updateRespawns(dt);
    updateIncome(dt);
    updateSandstorm(dt);
    updateHUD();

    // Pump head nod animation
    for (var i = 0; i < pumpMeshes.length; i++) {
      if (pumpMeshes[i]) {
        pumpMeshes[i].rotation.y += dt * 0.5;
      }
    }
  }

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  function activate() {
    if (active) { return; }

    if (window.GAME) {
      scene    = window.GAME.scene    || null;
      camera   = window.GAME.camera   || null;
      renderer = window.GAME.renderer || null;
    } else {
      scene    = window.scene    || null;
      camera   = window.camera   || null;
      renderer = window.renderer || null;
    }

    if (!scene) {
      showNotification('OIL WAR: no scene found');
      return;
    }

    active = true;

    // Reset state
    playerHP = 100;
    playerGold = 0;
    playerHasVest = false;
    playerHasRPG = false;
    playerAirstrikes = 0;
    pumpOwner = [1, 1, 0, 0, 0, 0];
    pumpMeshes = [];
    pumpFlagMeshes = [];
    pipelineMeshes = [];
    pipelineBroken = [false, false, false, false, false];
    pipelineFireMeshes = [];
    pipelineFireLights = [];
    storageTankMeshes = [];
    checkpointMeshes = [];
    refineryMesh = null;
    refineryState = 'neutral';
    refineryChargePlanted = false;
    refineryChargeTimer = 0;
    refineryChargeMesh = null;
    allies = [];
    enemies = [];
    enemyRespawnTimers = [];
    enemyCount = 0;
    lastStandSpawned = false;
    incomeTimer = 0;
    sandstormActive = false;
    sandstormTimer = SANDSTORM_INTERVAL;
    sandstormDuration = 0;
    sandstormParticles = [];
    sandstormParticleData = [];
    capturingPump = -1;
    captureTimer = 0;
    repairingPipeline = -1;
    repairTimer = 0;
    sabotagingPipeline = -1;
    sabotageTimer = 0;
    nearPump = -1;
    nearCache = false;
    nearPipeline = -1;
    nearRefinery = false;
    selectedAlly = -1;
    ownedObjects = [];
    cacheMesh = null;

    buildEnvironment();
    buildHUD();

    lastTime = performance.now();
    animFrameId = requestAnimationFrame(animate);

    showNotification('OIL WAR ACTIVATED — Q:SELECT ALLY E:INTERACT H:HOLD F:ADVANCE X:RPG');
  }

  function deactivate() {
    if (!active) { return; }
    active = false;

    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    // Remove all owned objects
    for (var i = 0; i < ownedObjects.length; i++) {
      if (scene) { scene.remove(ownedObjects[i]); }
    }
    ownedObjects = [];

    // Restore fog/background
    if (scene) {
      scene.fog        = originalFog        || null;
      scene.background = originalBackground || null;
    }

    removeHUD();

    pumpMeshes = [];
    pumpFlagMeshes = [];
    pipelineMeshes = [];
    pipelineFireMeshes = [];
    pipelineFireLights = [];
    storageTankMeshes = [];
    checkpointMeshes = [];
    refineryMesh = null;
    allies = [];
    enemies = [];
    sandstormParticles = [];
    sandstormParticleData = [];
    cacheMesh = null;
    scene    = null;
    camera   = null;
    renderer = null;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    if (active) { deactivate(); }
  }

  init();

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    activate:   activate,
    deactivate: deactivate,
    destroy:    destroy,
    isActive:   function () { return active; },
    getGold:    function () { return playerGold; },
    getPumps:   function () { return countBluePumps(); },
    getRefinery: function () { return refineryState; }
  };
}());
