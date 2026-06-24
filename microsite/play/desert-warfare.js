window.DesertWarfare = (function () {
  'use strict';

  // ── State ─────────────────────────────────────────────────────────────────
  var scene = null;
  var camera = null;
  var renderer = null;

  var desertActive = false;
  var originalFog = null;
  var originalBackground = null;

  // Heat mirage
  var mirageLight = null;
  var heatTimer = 0;
  var heatMax = 300; // 5-minute heat timer (seconds)
  var heatLevel = 0; // 0-100 percent
  var inShade = false;

  // Sandstorm
  var sandstormActive = false;
  var sandstormTimer = 240; // 4 minutes until first storm
  var sandstormDuration = 0;
  var sandstormMaxDuration = 60;
  var sandstormParticles = [];
  var sandstormParticleData = [];
  var sandstormLight = null;
  var normalFogDensity = 0.006;
  var sandstormFogDensity = 0.08;

  // Enemies
  var desertEnemies = [];
  var enemyCount = 18;

  // Oil pumps
  var oilPumps = [];
  var oilBurning = [false, false, false, false];
  var oilFireLights = [];
  var oilSmokeLights = [];

  // Vehicles (technicals)
  var technicals = [];
  var playerInVehicle = false;
  var playerVehicle = null;

  // Water jerrycan
  var jerrycans = [];

  // Command post
  var commandPostActive = true;
  var radioArray = null;
  var commandPostDestroyed = false;
  var c4Timer = 0;
  var c4Active = false;
  var eliteGuards = [];

  // Ground and dunes
  var ground = null;
  var sandDunes = [];
  var outpost = null;

  // HUD
  var hudEl = null;

  // Key tracking
  var keys = {};
  var dKeyTime = 0;
  var wKeyTime = 0;
  var activationWindow = 0.4; // 400ms

  // Player speed modifier
  var speedModifier = 1.0;
  var canShoot = true;

  // Clock
  var clock = null;
  var totalTime = 0;

  // ── Helpers ───────────────────────────────────────────────────────────────

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function distXZ(a, b) {
    var dx = a.x - b.x;
    var dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  function getPlayerPos() {
    if (camera) { return camera.position; }
    return { x: 0, y: 0, z: 0 };
  }

  // ── Desert Environment ────────────────────────────────────────────────────

  function buildDesertEnvironment() {
    if (!scene) { return; }

    // Sky background
    originalBackground = scene.background;
    scene.background = new THREE.Color(0xDDAA55);

    // Fog
    originalFog = scene.fog;
    scene.fog = new THREE.FogExp2(0xCCAA44, normalFogDensity);

    // Ground plane
    var groundGeo = new THREE.PlaneGeometry(100, 100);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0xCC9944 });
    ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground._desertOwned = true;
    scene.add(ground);

    // 8 sand dunes
    var duneMat = new THREE.MeshLambertMaterial({ color: 0xBB8833 });
    var dunePositions = [
      [-20, 10], [15, -18], [-30, -10], [25, 20],
      [-10, 30], [35, -5], [-35, 25], [10, -35]
    ];
    var duneWidths = [8, 6, 10, 7, 5, 9, 4, 6];
    var duneHeights = [3, 2, 4, 2.5, 2, 3.5, 2, 3];

    for (var i = 0; i < 8; i++) {
      var w = duneWidths[i];
      var h = duneHeights[i];
      var dGeo = new THREE.BoxGeometry(w, h, w * 0.7);
      var dMesh = new THREE.Mesh(dGeo, duneMat);
      dMesh.position.set(dunePositions[i][0], h / 2, dunePositions[i][1]);
      dMesh._desertOwned = true;
      dMesh._isDune = true;
      dMesh._shadeRadius = w * 0.5;
      scene.add(dMesh);
      sandDunes.push(dMesh);
    }

    // Abandoned outpost
    var outpostMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var outpostGeo = new THREE.BoxGeometry(8, 4, 6);
    outpost = new THREE.Mesh(outpostGeo, outpostMat);
    outpost.position.set(-40, 2, -40);
    outpost._desertOwned = true;
    scene.add(outpost);

    // Heat mirage light (ground-level shimmer)
    mirageLight = new THREE.PointLight(0xFFCC44, 1.2, 30);
    mirageLight.position.set(0, 0.3, 0);
    mirageLight._desertOwned = true;
    scene.add(mirageLight);

    buildOilfield();
    buildCommandPost();
    buildEnemies();
    buildTechnicals();
    buildJerryCans();
  }

  function removeDesertEnvironment() {
    if (!scene) { return; }

    scene.background = originalBackground || null;
    scene.fog = originalFog || null;

    if (ground) { scene.remove(ground); ground = null; }

    for (var i = 0; i < sandDunes.length; i++) { scene.remove(sandDunes[i]); }
    sandDunes = [];

    if (outpost) { scene.remove(outpost); outpost = null; }
    if (mirageLight) { scene.remove(mirageLight); mirageLight = null; }

    removeOilfield();
    removeCommandPost();
    removeEnemies();
    removeTechnicals();
    removeJerryCans();
    removeSandstorm();
  }

  // ── Oilfield ──────────────────────────────────────────────────────────────

  function buildOilfield() {
    var pumpPositions = [
      [-15, -20], [-15, -25], [-20, -20], [-20, -25]
    ];
    var baseMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
    var pumpMat = new THREE.MeshLambertMaterial({ color: 0x334433 });

    for (var i = 0; i < 4; i++) {
      var baseGeo = new THREE.BoxGeometry(2, 1, 2);
      var base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(pumpPositions[i][0], 0.5, pumpPositions[i][1]);
      base._desertOwned = true;
      base._oilPumpIndex = i;
      scene.add(base);

      var pumpGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
      var pump = new THREE.Mesh(pumpGeo, pumpMat);
      pump.position.set(pumpPositions[i][0], 2, pumpPositions[i][1]);
      pump._desertOwned = true;
      scene.add(pump);

      oilPumps.push({ base: base, pump: pump, index: i, pos: { x: pumpPositions[i][0], y: 1, z: pumpPositions[i][1] } });

      // Fire light (hidden initially)
      var fireLight = new THREE.PointLight(0xFF4400, 0, 10);
      fireLight.position.set(pumpPositions[i][0], 3, pumpPositions[i][1]);
      fireLight._desertOwned = true;
      scene.add(fireLight);
      oilFireLights.push(fireLight);

      // Smoke light (hidden initially)
      var smokeLight = new THREE.PointLight(0x222211, 0, 15);
      smokeLight.position.set(pumpPositions[i][0], 6, pumpPositions[i][1]);
      smokeLight._desertOwned = true;
      scene.add(smokeLight);
      oilSmokeLights.push(smokeLight);
    }
  }

  function igniteOilPump(index) {
    if (oilBurning[index]) { return; }
    oilBurning[index] = true;
    oilFireLights[index].intensity = 2.5;
    oilSmokeLights[index].intensity = 1.5;

    // Check if all 4 burning → enemies retreat
    var allBurning = true;
    for (var i = 0; i < 4; i++) {
      if (!oilBurning[i]) { allBurning = false; break; }
    }
    if (allBurning) { triggerOilfieldInferno(); }
  }

  function triggerOilfieldInferno() {
    // All pumps burning: enemies retreat
    for (var i = 0; i < desertEnemies.length; i++) {
      var e = desertEnemies[i];
      if (e.mesh) {
        e.retreating = true;
        e.retreatDir = { x: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 };
      }
    }
    showNotification('OILFIELD INFERNO - ENEMIES RETREATING');
  }

  function removeOilfield() {
    for (var i = 0; i < oilPumps.length; i++) {
      if (scene) {
        scene.remove(oilPumps[i].base);
        scene.remove(oilPumps[i].pump);
      }
    }
    for (var j = 0; j < oilFireLights.length; j++) {
      if (scene) { scene.remove(oilFireLights[j]); }
    }
    for (var k = 0; k < oilSmokeLights.length; k++) {
      if (scene) { scene.remove(oilSmokeLights[k]); }
    }
    oilPumps = [];
    oilFireLights = [];
    oilSmokeLights = [];
    oilBurning = [false, false, false, false];
  }

  // ── Command Post ──────────────────────────────────────────────────────────

  function buildCommandPost() {
    var cpMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
    var cpGeo = new THREE.BoxGeometry(12, 5, 8);
    var cp = new THREE.Mesh(cpGeo, cpMat);
    cp.position.set(0, 2.5, 0);
    cp._desertOwned = true;
    scene.add(cp);

    // Radio array
    var radioMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    var radioGeo = new THREE.CylinderGeometry(0.4, 0.6, 6, 8);
    radioArray = new THREE.Mesh(radioGeo, radioMat);
    radioArray.position.set(0, 8, 0);
    radioArray._desertOwned = true;
    scene.add(radioArray);

    // 6 elite guards
    var guardMat = new THREE.MeshLambertMaterial({ color: 0x556644 });
    var guardPositions = [
      [4, 1], [-4, 1], [0, 5], [6, -3], [-6, -3], [0, -5]
    ];
    for (var i = 0; i < 6; i++) {
      var gGeo = new THREE.BoxGeometry(0.6, 1.8, 0.5);
      var guard = new THREE.Mesh(gGeo, guardMat);
      guard.position.set(guardPositions[i][0], 1, guardPositions[i][1]);
      guard._desertOwned = true;
      guard._isEliteGuard = true;
      scene.add(guard);
      eliteGuards.push({ mesh: guard, hp: 150, alive: true, pos: guard.position });
    }
  }

  function removeCommandPost() {
    if (radioArray && scene) { scene.remove(radioArray); radioArray = null; }
    for (var i = 0; i < eliteGuards.length; i++) {
      if (eliteGuards[i].mesh && scene) { scene.remove(eliteGuards[i].mesh); }
    }
    eliteGuards = [];
    commandPostActive = true;
    commandPostDestroyed = false;
  }

  function activateC4() {
    if (!radioArray || commandPostDestroyed) { return; }
    var playerPos = getPlayerPos();
    var dx = playerPos.x - radioArray.position.x;
    var dz = playerPos.z - radioArray.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 8) {
      c4Active = true;
    }
  }

  function deactivateC4() {
    c4Active = false;
    c4Timer = 0;
  }

  // ── Enemy Soldiers ────────────────────────────────────────────────────────

  function buildEnemies() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x887744 });
    var positions = [
      // cover positions near dunes
      [-18, 12], [13, -20], [-28, -8], [23, 22],
      [-8, 32], [33, -3], [-33, 27], [8, -37],
      // flanking teams (left/right)
      [-45, 0], [-45, 10], [-45, -10],
      [45, 0], [45, 10], [45, -10],
      // marksmen (far from center for sniping)
      [42, 42], [-42, 42], [42, -42], [-42, -42]
    ];

    for (var i = 0; i < enemyCount; i++) {
      var px = positions[i] ? positions[i][0] : rand(-40, 40);
      var pz = positions[i] ? positions[i][1] : rand(-40, 40);
      var isMarksman = (i >= 14);
      var isFlankLeft = (i >= 8 && i < 11);
      var isFlankRight = (i >= 11 && i < 14);

      // Prone geometry (flat box)
      var standGeo = new THREE.BoxGeometry(0.6, 1.8, 0.5);
      var proneGeo = new THREE.BoxGeometry(0.6, 0.3, 1.8);

      var mesh = new THREE.Mesh(standGeo, mat);
      mesh.position.set(px, 1, pz);
      mesh._desertOwned = true;
      scene.add(mesh);

      desertEnemies.push({
        mesh: mesh,
        standGeo: standGeo,
        proneGeo: proneGeo,
        hp: isMarksman ? 80 : 100,
        alive: true,
        prone: false,
        isMarksman: isMarksman,
        isFlankLeft: isFlankLeft,
        isFlankRight: isFlankRight,
        shootTimer: rand(1, 4),
        markTimer: 0,
        markInterval: 4,
        moveTimer: rand(0, 2),
        coverPos: { x: px, y: 1, z: pz },
        retreating: false,
        retreatDir: { x: 0, z: 0 },
        jitter: { x: 0, z: 0 },
        jitterTimer: 0
      });
    }
  }

  function removeEnemies() {
    for (var i = 0; i < desertEnemies.length; i++) {
      if (desertEnemies[i].mesh && scene) { scene.remove(desertEnemies[i].mesh); }
    }
    desertEnemies = [];
  }

  function updateEnemies(dt, time) {
    var playerPos = getPlayerPos();
    var speedMult = sandstormActive ? 0.6 : 1.0;
    var aliveCount = 0;

    for (var i = 0; i < desertEnemies.length; i++) {
      var e = desertEnemies[i];
      if (!e.alive) { continue; }
      aliveCount++;

      var dist = distXZ(e.mesh.position, playerPos);

      // Heat mirage jitter at long range
      if (dist > 40) {
        e.jitterTimer -= dt;
        if (e.jitterTimer <= 0) {
          e.jitter.x = (Math.random() - 0.5) * 1.0;
          e.jitter.z = (Math.random() - 0.5) * 1.0;
          e.jitterTimer = 0.1;
        }
        e.mesh.position.x = e.coverPos.x + e.jitter.x;
        e.mesh.position.z = e.coverPos.z + e.jitter.z;
      } else {
        e.mesh.position.x = e.coverPos.x;
        e.mesh.position.z = e.coverPos.z;
      }

      // Retreating behavior
      if (e.retreating) {
        e.coverPos.x += e.retreatDir.x * 5 * dt * speedMult;
        e.coverPos.z += e.retreatDir.z * 5 * dt * speedMult;
        continue;
      }

      // Prone when stationary
      e.moveTimer -= dt;
      if (e.moveTimer <= 0) {
        var movingNow = Math.random() > 0.5;
        if (movingNow) {
          // Stand up
          if (e.prone) {
            e.prone = false;
            e.mesh.geometry = e.standGeo;
            e.mesh.position.y = 1;
            e.coverPos.y = 1;
          }
          // Move toward cover / flanking
          if (e.isFlankLeft) {
            e.coverPos.x -= rand(1, 3) * speedMult;
            e.coverPos.z += (Math.random() - 0.5) * 2;
          } else if (e.isFlankRight) {
            e.coverPos.x += rand(1, 3) * speedMult;
            e.coverPos.z += (Math.random() - 0.5) * 2;
          } else {
            e.coverPos.x += (Math.random() - 0.5) * 4 * speedMult;
            e.coverPos.z += (Math.random() - 0.5) * 4 * speedMult;
          }
          e.coverPos.x = Math.max(-48, Math.min(48, e.coverPos.x));
          e.coverPos.z = Math.max(-48, Math.min(48, e.coverPos.z));
          e.moveTimer = rand(1, 3);
        } else {
          // Go prone
          if (!e.prone) {
            e.prone = true;
            e.mesh.geometry = e.proneGeo;
            e.mesh.position.y = 0.15;
            e.coverPos.y = 0.15;
          }
          e.moveTimer = rand(2, 5);
        }
      }

      // Marksman sniping
      if (e.isMarksman && dist > 30) {
        e.markTimer -= dt;
        if (e.markTimer <= 0) {
          // Simulate sniper shot (damage handled by main game)
          e.markTimer = e.markInterval;
        }
      }

      // General shoot timer
      if (!e.isMarksman) {
        e.shootTimer -= dt;
        if (e.shootTimer <= 0) {
          e.shootTimer = sandstormActive ? rand(3, 6) : rand(1, 4);
        }
      }
    }

    return aliveCount;
  }

  // ── Technicals ────────────────────────────────────────────────────────────

  function buildTechnicals() {
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x887744 });
    var gunMat = new THREE.MeshLambertMaterial({ color: 0x334433 });

    var techPositions = [
      { x: 30, z: 10 },
      { x: -30, z: -10 }
    ];

    for (var i = 0; i < 2; i++) {
      var bodyGeo = new THREE.BoxGeometry(5, 1.8, 2.5);
      var body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(techPositions[i].x, 0.9, techPositions[i].z);
      body._desertOwned = true;
      scene.add(body);

      var gunGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.5, 6);
      var gun = new THREE.Mesh(gunGeo, gunMat);
      gun.rotation.z = Math.PI / 2;
      gun.position.set(techPositions[i].x + 1.5, 2.2, techPositions[i].z);
      gun._desertOwned = true;
      scene.add(gun);

      technicals.push({
        body: body,
        gun: gun,
        alive: true,
        driverAlive: true,
        patrolDir: (i === 0) ? 1 : -1,
        patrolTimer: 0,
        commandeered: false,
        pos: { x: techPositions[i].x, z: techPositions[i].z }
      });
    }
  }

  function removeTechnicals() {
    for (var i = 0; i < technicals.length; i++) {
      if (scene) {
        scene.remove(technicals[i].body);
        scene.remove(technicals[i].gun);
      }
    }
    technicals = [];
    playerInVehicle = false;
    playerVehicle = null;
  }

  function updateTechnicals(dt) {
    var speedMult = sandstormActive ? 0.6 : 1.0;
    for (var i = 0; i < technicals.length; i++) {
      var t = technicals[i];
      if (!t.alive || t.commandeered) { continue; }

      t.patrolTimer += dt;
      var speed = 8 * speedMult;
      var moveAmt = speed * dt * t.patrolDir;
      t.pos.x += moveAmt;
      t.body.position.x = t.pos.x;
      t.gun.position.x = t.pos.x + 1.5;

      if (t.pos.x > 45 || t.pos.x < -45) {
        t.patrolDir *= -1;
      }
    }
  }

  // ── Water Jerrycans ───────────────────────────────────────────────────────

  function buildJerryCans() {
    var mat = new THREE.MeshLambertMaterial({ color: 0x44AAFF });
    var positions = [
      { x: 20, z: 35 }, { x: -35, z: 15 }, { x: 10, z: -30 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var geo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(positions[i].x, 0.4, positions[i].z);
      mesh._desertOwned = true;
      scene.add(mesh);
      jerrycans.push({ mesh: mesh, collected: false });
    }
  }

  function removeJerryCans() {
    for (var i = 0; i < jerrycans.length; i++) {
      if (jerrycans[i].mesh && scene) { scene.remove(jerrycans[i].mesh); }
    }
    jerrycans = [];
  }

  function checkJerryCans() {
    var playerPos = getPlayerPos();
    for (var i = 0; i < jerrycans.length; i++) {
      var jc = jerrycans[i];
      if (jc.collected) { continue; }
      var dx = playerPos.x - jc.mesh.position.x;
      var dz = playerPos.z - jc.mesh.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 2) {
        jc.collected = true;
        scene.remove(jc.mesh);
        heatTimer = heatMax; // reset heat timer
        heatLevel = 0;
        showNotification('WATER FOUND - HEAT RESET');
      }
    }
  }

  function checkShade() {
    var playerPos = getPlayerPos();
    inShade = false;
    for (var i = 0; i < sandDunes.length; i++) {
      var d = sandDunes[i];
      var dx = playerPos.x - d.position.x;
      var dz = playerPos.z - d.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < d._shadeRadius + 1.5) {
        inShade = true;
        break;
      }
    }
  }

  // ── Sandstorm ─────────────────────────────────────────────────────────────

  function startSandstorm() {
    sandstormActive = true;
    sandstormDuration = sandstormMaxDuration;
    if (scene) {
      scene.fog = new THREE.FogExp2(0xCCAA44, sandstormFogDensity);
    }
    speedModifier = 0.6;
    buildSandstormParticles();
    showNotification('SANDSTORM INCOMING');
  }

  function endSandstorm() {
    sandstormActive = false;
    sandstormTimer = 240; // 4 minutes
    if (scene) {
      scene.fog = new THREE.FogExp2(0xCCAA44, normalFogDensity);
    }
    speedModifier = 1.0;
    removeSandstorm();
    showNotification('SANDSTORM CLEARING');
  }

  function buildSandstormParticles() {
    if (!scene) { return; }
    var mat = new THREE.MeshBasicMaterial({ color: 0xCC9933 });
    sandstormLight = new THREE.PointLight(0xCC9933, 1.5, 40);
    sandstormLight.position.set(0, 5, 0);
    sandstormLight._desertOwned = true;
    scene.add(sandstormLight);

    for (var i = 0; i < 150; i++) {
      var geo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(rand(-50, 50), rand(0.5, 8), rand(-50, 50));
      mesh._desertOwned = true;
      scene.add(mesh);
      sandstormParticles.push(mesh);
      sandstormParticleData.push({
        speed: rand(8, 20),
        phase: rand(0, Math.PI * 2),
        radius: rand(5, 30),
        angle: rand(0, Math.PI * 2),
        height: rand(0.5, 8)
      });
    }
  }

  function removeSandstorm() {
    for (var i = 0; i < sandstormParticles.length; i++) {
      if (scene) { scene.remove(sandstormParticles[i]); }
    }
    sandstormParticles = [];
    sandstormParticleData = [];
    if (sandstormLight && scene) {
      scene.remove(sandstormLight);
      sandstormLight = null;
    }
  }

  function updateSandstormParticles(dt, time) {
    for (var i = 0; i < sandstormParticles.length; i++) {
      var p = sandstormParticles[i];
      var d = sandstormParticleData[i];
      d.angle += d.speed * dt * 0.05;
      p.position.x = Math.cos(d.angle + d.phase) * d.radius;
      p.position.z = Math.sin(d.angle + d.phase) * d.radius;
      p.position.y = d.height + Math.sin(time * 2 + d.phase) * 0.5;
    }
  }

  // ── Heat System ───────────────────────────────────────────────────────────

  function updateHeat(dt) {
    checkShade();
    var drainRate = inShade ? 0.5 : 1.0; // shade = 2x slower buildup
    heatTimer -= dt * drainRate;
    if (heatTimer < 0) { heatTimer = 0; }
    heatLevel = Math.round((1 - heatTimer / heatMax) * 100);
  }

  // ── Mirage Animation ──────────────────────────────────────────────────────

  function updateMirage(time) {
    if (!mirageLight) { return; }
    mirageLight.intensity = 0.8 + Math.sin(time * 3) * 0.4 + Math.sin(time * 7) * 0.2;
    mirageLight.position.x = Math.sin(time * 0.5) * 5;
    mirageLight.position.z = Math.cos(time * 0.4) * 5;
  }

  // ── C4 / Mission Complete ─────────────────────────────────────────────────

  function updateC4(dt) {
    if (!c4Active || commandPostDestroyed) { return; }
    c4Timer += dt;
    if (c4Timer >= 3) {
      commandPostDestroyed = true;
      commandPostActive = false;
      c4Active = false;
      c4Timer = 0;
      if (radioArray && scene) {
        scene.remove(radioArray);
        radioArray = null;
      }
      showNotification('MISSION COMPLETE - RADIO DESTROYED');
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  function buildHUD() {
    hudEl = document.createElement('div');
    hudEl.id = 'desert-warfare-hud';
    hudEl.style.cssText = [
      'position:fixed',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.65)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:13px',
      'padding:6px 14px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(hudEl);
  }

  function updateHUD(aliveCount) {
    if (!hudEl) { return; }

    var stormStr;
    if (sandstormActive) {
      stormStr = Math.ceil(sandstormDuration) + 's';
    } else {
      stormStr = 'CLEAR';
    }

    var burningCount = 0;
    for (var i = 0; i < 4; i++) {
      if (oilBurning[i]) { burningCount++; }
    }

    var cpStr = commandPostDestroyed ? 'DESTROYED' : 'ACTIVE';

    hudEl.textContent = 'DESERT [HEAT: ' + heatLevel + '%] [SANDSTORM: ' + stormStr + '] [SOLDIERS: ' + aliveCount + '] [OILFIELD: ' + burningCount + '/4 BURNING] | COMMAND POST: ' + cpStr;
  }

  function removeHUD() {
    if (hudEl && hudEl.parentNode) {
      hudEl.parentNode.removeChild(hudEl);
    }
    hudEl = null;
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  function showNotification(msg) {
    var el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:50px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.8)',
      'color:#FFCC44',
      'font-family:monospace',
      'font-size:15px',
      'padding:8px 18px',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:10000'
    ].join(';');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) { el.parentNode.removeChild(el); }
    }, 3000);
  }

  // ── Key Handling ──────────────────────────────────────────────────────────

  function onKeyDown(e) {
    var key = e.key.toLowerCase();
    keys[key] = true;

    var now = performance.now() / 1000;

    if (key === 'd') {
      dKeyTime = now;
      if (wKeyTime > 0 && (now - wKeyTime) <= activationWindow) {
        if (!desertActive) { activate(); }
        return;
      }
    }
    if (key === 'w') {
      wKeyTime = now;
      if (dKeyTime > 0 && (now - dKeyTime) <= activationWindow) {
        if (!desertActive) { activate(); }
        return;
      }
    }

    if (!desertActive) { return; }

    // C4 placement (E held 3s near radio)
    if (key === 'e') {
      activateC4();
    }

    // Vehicle gun (SPACE fires)
    if (key === ' ' && playerInVehicle && playerVehicle) {
      fireMountedGun();
    }
  }

  function onKeyUp(e) {
    var key = e.key.toLowerCase();
    keys[key] = false;

    if (key === 'e') {
      deactivateC4();
    }
  }

  function fireMountedGun() {
    // Signal to main game system (stub)
    if (window.GameEvents) {
      window.GameEvents.emit('mountedGunFire', { vehicleIndex: playerVehicle });
    }
  }

  // ── Main Loop ─────────────────────────────────────────────────────────────

  var animFrameId = null;
  var lastTime = 0;

  function animate(timestamp) {
    if (!desertActive) { return; }
    animFrameId = requestAnimationFrame(animate);

    var dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    totalTime += dt;

    // Sandstorm cycle
    if (sandstormActive) {
      sandstormDuration -= dt;
      if (sandstormDuration <= 0) {
        endSandstorm();
      } else {
        updateSandstormParticles(dt, totalTime);
      }
    } else {
      sandstormTimer -= dt;
      if (sandstormTimer <= 0) {
        startSandstorm();
      }
    }

    updateMirage(totalTime);
    updateHeat(dt);
    checkJerryCans();

    // Oil pump fire flicker
    for (var i = 0; i < 4; i++) {
      if (oilBurning[i]) {
        oilFireLights[i].intensity = 2 + Math.sin(totalTime * 10 + i) * 0.8;
        oilSmokeLights[i].intensity = 1 + Math.sin(totalTime * 3 + i) * 0.3;
      }
    }

    // C4 timer
    if (keys['e']) {
      updateC4(dt);
    } else {
      if (c4Active) { deactivateC4(); }
    }

    var aliveCount = updateEnemies(dt, totalTime);
    updateTechnicals(dt);

    updateHUD(aliveCount);
  }

  // ── Activation / Deactivation ─────────────────────────────────────────────

  function activate() {
    if (desertActive) { return; }

    // Acquire scene, camera, renderer from main game
    if (window.GAME) {
      scene = window.GAME.scene || null;
      camera = window.GAME.camera || null;
      renderer = window.GAME.renderer || null;
    } else {
      // Fallback: search globals
      scene = window.scene || null;
      camera = window.camera || null;
      renderer = window.renderer || null;
    }

    if (!scene) {
      showNotification('DESERT WARFARE: no scene found');
      return;
    }

    desertActive = true;
    heatTimer = heatMax;
    heatLevel = 0;
    sandstormTimer = 240;
    sandstormActive = false;
    commandPostActive = true;
    commandPostDestroyed = false;
    c4Active = false;
    c4Timer = 0;
    playerInVehicle = false;
    playerVehicle = null;

    buildDesertEnvironment();
    buildHUD();

    clock = new THREE.Clock();
    lastTime = performance.now();
    animFrameId = requestAnimationFrame(animate);

    showNotification('DESERT WARFARE ACTIVATED - D+W');
  }

  function deactivate() {
    if (!desertActive) { return; }
    desertActive = false;

    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    removeDesertEnvironment();
    removeHUD();
    speedModifier = 1.0;
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    if (desertActive) { deactivate(); }
  }

  init();

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    activate: activate,
    deactivate: deactivate,
    destroy: destroy,
    isActive: function () { return desertActive; },
    igniteOilPump: igniteOilPump,
    getHeatLevel: function () { return heatLevel; },
    isSandstormActive: function () { return sandstormActive; }
  };
}());
