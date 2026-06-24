window.BunkerHill = (function() {
  'use strict';

  // ==================== STATE ====================
  var state = {
    active: false,
    wave: 1,
    maxWaves: 5,
    attackersRepelled: 0,
    bunkerIntegrity: 100,
    nextWaveTime: 0,
    waveInterval: 8000,
    lastKeyTime: 0,
    scene: null,
    camera: null,
    hudElement: null
  };

  var objects = [];
  var enemies = [];
  var particles = [];
  var inputManager = {
    keys: {},
    lastB: 0
  };

  // ==================== INITIALIZATION ====================
  var createBunkerBuilding = function(scene) {
    // Thick concrete walls with narrow window slots
    var bunkerGroup = new THREE.Group();

    // Main bunker box (thick concrete)
    var bunkerGeom = new THREE.BoxGeometry(12, 6, 12);
    var bunkerMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.8,
      metalness: 0.1
    });
    var bunkerMesh = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunkerMesh.position.set(0, 2, 0);
    bunkerGroup.add(bunkerMesh);
    objects.push(bunkerMesh);

    // Window slots (small thin boxes)
    var windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (var i = 0; i < 4; i++) {
      var windowGeom = new THREE.BoxGeometry(0.5, 1.5, 0.3);
      var windowMesh = new THREE.Mesh(windowGeom, windowMat);
      if (i === 0) windowMesh.position.set(4, 2.5, 0);
      else if (i === 1) windowMesh.position.set(-4, 2.5, 0);
      else if (i === 2) windowMesh.position.set(0, 2.5, 4);
      else windowMesh.position.set(0, 2.5, -4);
      bunkerGroup.add(windowMesh);
      objects.push(windowMesh);
    }

    scene.add(bunkerGroup);
    objects.push(bunkerGroup);
    return bunkerGroup;
  };

  var createDefensiveTrench = function(scene) {
    var trenchGroup = new THREE.Group();

    // Recessed trench floor
    var trenchFloorGeom = new THREE.BoxGeometry(30, 1, 6);
    var earthMat = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.9
    });
    var trenchFloor = new THREE.Mesh(trenchFloorGeom, earthMat);
    trenchFloor.position.set(0, -1, 15);
    trenchGroup.add(trenchFloor);
    objects.push(trenchFloor);

    // Parapet walls (sandbag-like walls)
    var parapetMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85
    });
    var parapetGeom = new THREE.BoxGeometry(30, 2, 1);
    var parapet1 = new THREE.Mesh(parapetGeom, parapetMat);
    parapet1.position.set(0, 0.5, 18);
    trenchGroup.add(parapet1);
    objects.push(parapet1);

    var parapet2 = new THREE.Mesh(parapetGeom, parapetMat);
    parapet2.position.set(0, 0.5, 12);
    trenchGroup.add(parapet2);
    objects.push(parapet2);

    scene.add(trenchGroup);
    objects.push(trenchGroup);
    return trenchGroup;
  };

  var createMachineGunEmplacement = function(scene) {
    var emplaceGroup = new THREE.Group();

    // Box mount
    var mountGeom = new THREE.BoxGeometry(3, 2, 3);
    var steelMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.4
    });
    var mount = new THREE.Mesh(mountGeom, steelMat);
    mount.position.set(-8, 1.5, 5);
    emplaceGroup.add(mount);
    objects.push(mount);

    // Gun barrel (cylinder)
    var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
    var barrelMesh = new THREE.Mesh(barrelGeom, steelMat);
    barrelMesh.rotation.z = Math.PI / 2;
    barrelMesh.position.set(-8, 3, 5);
    barrelMesh.name = 'gunBarrel';
    emplaceGroup.add(barrelMesh);
    objects.push(barrelMesh);

    scene.add(emplaceGroup);
    objects.push(emplaceGroup);
    return emplaceGroup;
  };

  var createBarbedWire = function(scene) {
    var wireGroup = new THREE.Group();

    // Wire lines using LineSegments
    var wireMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 2 });

    // Multiple rows of wire
    for (var row = 0; row < 3; row++) {
      var points = [];
      var z = 25 + row * 2;
      for (var x = -30; x <= 30; x += 5) {
        points.push(new THREE.Vector3(x, 1.5 + row * 0.8, z));
      }
      var wireGeom = new THREE.BufferGeometry().setFromPoints(points);
      var wireSegments = new THREE.LineSegments(wireGeom, wireMat);
      wireGroup.add(wireSegments);
      objects.push(wireSegments);
    }

    // Wire posts (small cylinders)
    var postMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
    for (var i = 0; i < 12; i++) {
      var postGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(-25 + i * 5, 1, 25);
      wireGroup.add(post);
      objects.push(post);
    }

    scene.add(wireGroup);
    objects.push(wireGroup);
    return wireGroup;
  };

  var createSandbagWalls = function(scene) {
    var sandbagGroup = new THREE.Group();
    var bagMat = new THREE.MeshStandardMaterial({
      color: 0x9d8b6a,
      roughness: 0.9
    });

    // Stacked sandbag walls (clusters of small boxes)
    var positions = [
      { x: 10, z: 8 },
      { x: -10, z: 8 },
      { x: 8, z: -8 },
      { x: -8, z: -8 }
    ];

    positions.forEach(function(pos) {
      for (var layer = 0; layer < 3; layer++) {
        for (var i = 0; i < 4; i++) {
          var bagGeom = new THREE.BoxGeometry(1.2, 0.8, 1.2);
          var bag = new THREE.Mesh(bagGeom, bagMat);
          bag.position.set(
            pos.x + (i - 1.5) * 1.3,
            0.4 + layer * 0.8,
            pos.z
          );
          sandbagGroup.add(bag);
          objects.push(bag);
        }
      }
    });

    scene.add(sandbagGroup);
    objects.push(sandbagGroup);
    return sandbagGroup;
  };

  var createArtilleryObservationPost = function(scene) {
    var obsGroup = new THREE.Group();

    // Elevated platform on cylinder legs
    var legMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.3
    });

    for (var i = 0; i < 4; i++) {
      var legGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
      var leg = new THREE.Mesh(legGeom, legMat);
      var offset = 2;
      if (i === 0) leg.position.set(offset, 2.5, -10 + offset);
      else if (i === 1) leg.position.set(-offset, 2.5, -10 + offset);
      else if (i === 2) leg.position.set(offset, 2.5, -10 - offset);
      else leg.position.set(-offset, 2.5, -10 - offset);
      obsGroup.add(leg);
      objects.push(leg);
    }

    // Platform box
    var platformGeom = new THREE.BoxGeometry(5, 0.8, 5);
    var platformMat = new THREE.MeshStandardMaterial({
      color: 0x6a5a4a,
      roughness: 0.8
    });
    var platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.set(0, 6, -10);
    obsGroup.add(platform);
    objects.push(platform);

    // Observation booth (small box on platform)
    var boothGeom = new THREE.BoxGeometry(2.5, 2, 2.5);
    var booth = new THREE.Mesh(boothGeom, platformMat);
    booth.position.set(0, 7.5, -10);
    obsGroup.add(booth);
    objects.push(booth);

    scene.add(obsGroup);
    objects.push(obsGroup);
    return obsGroup;
  };

  var createSupplyDepot = function(scene) {
    var depotGroup = new THREE.Group();
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.85
    });

    // Stacked crates inside a depot area
    var cratePositions = [
      { x: 15, y: 0.5, z: -8 },
      { x: 15, y: 1.4, z: -8 },
      { x: 15, y: 2.3, z: -8 },
      { x: 16.2, y: 0.5, z: -8 },
      { x: 16.2, y: 1.4, z: -8 },
      { x: 17.4, y: 0.5, z: -8 }
    ];

    cratePositions.forEach(function(pos) {
      var crateGeom = new THREE.BoxGeometry(1.1, 0.9, 1.1);
      var crate = new THREE.Mesh(crateGeom, crateMat);
      crate.position.set(pos.x, pos.y, pos.z);
      depotGroup.add(crate);
      objects.push(crate);
    });

    // Depot roof/cover
    var roofGeom = new THREE.BoxGeometry(4, 0.5, 3);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(16, 3.5, -8);
    depotGroup.add(roof);
    objects.push(roof);

    scene.add(depotGroup);
    objects.push(depotGroup);
    return depotGroup;
  };

  var createEnvironment = function(scene) {
    // Hilltop ground
    var groundGeom = new THREE.BoxGeometry(200, 2, 200);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x6b6b4a,
      roughness: 0.95
    });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.set(0, -2, 0);
    scene.add(ground);
    objects.push(ground);

    // Fog for atmosphere
    scene.fog = new THREE.Fog(0x8a8a7a, 80, 150);
    scene.background = new THREE.Color(0x7a7a6a);
  };

  var createEnemyWave = function(count, waveNumber) {
    var wave = [];
    var spacing = 40 / count;

    for (var i = 0; i < count; i++) {
      var enemyGeom = new THREE.BoxGeometry(0.6, 1.8, 0.4);
      var enemyMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        roughness: 0.8
      });
      var enemyMesh = new THREE.Mesh(enemyGeom, enemyMat);

      // Spread formation downhill
      var startX = -20 + i * spacing;
      var startZ = 50 + (Math.random() - 0.5) * 10;
      var startY = 0;

      enemyMesh.position.set(startX, startY, startZ);
      enemyMesh.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          0,
          -3 - waveNumber * 0.5
        ),
        health: 1,
        alive: true
      };

      state.scene.add(enemyMesh);
      objects.push(enemyMesh);
      wave.push(enemyMesh);
    }

    return wave;
  };

  var spawnMortarImpact = function(x, z) {
    var impactGeom = new THREE.SphereGeometry(0.5, 8, 8);
    var impactMat = new THREE.MeshStandardMaterial({
      color: 0x8a6a4a,
      emissive: 0x4a3a2a
    });
    var impactMesh = new THREE.Mesh(impactGeom, impactMat);
    impactMesh.position.set(x, 0.5, z);

    state.scene.add(impactMesh);
    objects.push(impactMesh);

    particles.push({
      mesh: impactMesh,
      type: 'crater',
      startScale: 0.1,
      maxScale: 2,
      duration: 1.5,
      elapsed: 0
    });
  };

  var spawnIncomingTracer = function() {
    var tracerGeom = new THREE.SphereGeometry(0.2, 6, 6);
    var tracerMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff6600
    });
    var tracerMesh = new THREE.Mesh(tracerGeom, tracerMat);

    var startX = (Math.random() - 0.5) * 60;
    var startZ = 60 + Math.random() * 20;
    var targetX = (Math.random() - 0.5) * 15;
    var targetZ = (Math.random() - 0.5) * 15;

    tracerMesh.position.set(startX, 15, startZ);

    state.scene.add(tracerMesh);
    objects.push(tracerMesh);

    particles.push({
      mesh: tracerMesh,
      type: 'tracer',
      startPos: new THREE.Vector3(startX, 15, startZ),
      targetPos: new THREE.Vector3(targetX, 2, targetZ),
      duration: 1.2,
      elapsed: 0
    });
  };

  var updateGunBarrel = function(delta) {
    var scene = state.scene;
    if (!scene) return;

    scene.traverse(function(obj) {
      if (obj.name === 'gunBarrel') {
        obj.rotation.y += delta * 1.5;
        if (obj.rotation.y > Math.PI) obj.rotation.y = -Math.PI;
      }
    });
  };

  var updateParticles = function(delta) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.elapsed += delta;

      if (p.type === 'crater') {
        var progress = p.elapsed / p.duration;
        if (progress < 0.5) {
          // Expand
          p.mesh.scale.setScalar(p.startScale + (p.maxScale - p.startScale) * (progress * 2));
        } else {
          // Shrink
          p.mesh.scale.setScalar(p.maxScale * (2 - progress * 2));
        }

        if (p.elapsed >= p.duration) {
          state.scene.remove(p.mesh);
          objects.splice(objects.indexOf(p.mesh), 1);
          particles.splice(i, 1);
        }
      } else if (p.type === 'tracer') {
        var t = p.elapsed / p.duration;
        if (t <= 1) {
          p.mesh.position.lerpVectors(p.startPos, p.targetPos, t);
        } else {
          state.scene.remove(p.mesh);
          objects.splice(objects.indexOf(p.mesh), 1);
          particles.splice(i, 1);
        }
      }
    }
  };

  var updateEnemies = function(delta) {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var enemy = enemies[i];
      if (!enemy.userData.alive) {
        state.scene.remove(enemy);
        objects.splice(objects.indexOf(enemy), 1);
        enemies.splice(i, 1);
        state.attackersRepelled++;
        continue;
      }

      // Move enemy
      enemy.position.add(enemy.userData.velocity.clone().multiplyScalar(delta));

      // Check if reached bunker (collision)
      if (enemy.position.z < -5) {
        enemy.userData.alive = false;
        state.bunkerIntegrity = Math.max(0, state.bunkerIntegrity - 5);
      }
    }
  };

  var updateWaves = function(delta) {
    state.nextWaveTime -= delta;

    if (state.nextWaveTime <= 0 && state.wave <= state.maxWaves) {
      var enemyCount = 3 + state.wave;
      var newWave = createEnemyWave(enemyCount, state.wave);
      enemies = enemies.concat(newWave);
      state.wave++;
      state.nextWaveTime = state.waveInterval;
    }
  };

  var updateHUD = function() {
    if (!state.hudElement) return;

    var waveText = 'WAVE: ' + state.wave + '/' + state.maxWaves;
    var repelledText = 'ATTACKERS REPELLED: ' + state.attackersRepelled;
    var integrityText = 'BUNKER INTEGRITY: ' + Math.max(0, Math.floor(state.bunkerIntegrity)) + '%';

    state.hudElement.innerHTML =
      '<div style="position: absolute; top: 20px; left: 20px; color: #00ff00; font-family: monospace; font-size: 16px; text-shadow: 0 0 10px rgba(0, 255, 0, 0.5); z-index: 100;">' +
      waveText + '<br/>' +
      repelledText + '<br/>' +
      integrityText +
      '</div>';
  };

  var updateKeyBindings = function() {
    if (inputManager.keys['b'] || inputManager.keys['B']) {
      var now = Date.now();
      if (now - inputManager.lastB < 400 && inputManager.keys['h']) {
        state.active = !state.active;
        inputManager.keys['b'] = false;
        inputManager.keys['h'] = false;

        // Show HUD notification
        if (state.hudElement) {
          var notif = document.createElement('div');
          notif.textContent = state.active ? 'BUNKER DEFENSE ACTIVE' : 'BUNKER DEFENSE INACTIVE';
          notif.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
            'color: #00ff00; font-family: monospace; font-size: 20px; ' +
            'text-shadow: 0 0 20px rgba(0, 255, 0, 0.8); z-index: 101;';
          state.hudElement.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1500);
        }
      }
      if (inputManager.keys['b']) {
        inputManager.lastB = now;
      }
    }
  };

  // ==================== PUBLIC API ====================
  var init = function(scene, camera) {
    state.scene = scene;
    state.camera = camera;
    state.active = true;
    state.wave = 1;
    state.attackersRepelled = 0;
    state.bunkerIntegrity = 100;
    state.nextWaveTime = 0;

    objects = [];
    enemies = [];
    particles = [];

    // Create HUD element
    if (!state.hudElement) {
      state.hudElement = document.createElement('div');
      document.body.appendChild(state.hudElement);
    }

    // Build scene
    createEnvironment(scene);
    createBunkerBuilding(scene);
    createDefensiveTrench(scene);
    createMachineGunEmplacement(scene);
    createBarbedWire(scene);
    createSandbagWalls(scene);
    createArtilleryObservationPost(scene);
    createSupplyDepot(scene);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 40, 30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Input listeners
    window.addEventListener('keydown', function(e) {
      inputManager.keys[e.key.toLowerCase()] = true;
      updateKeyBindings();
    });
    window.addEventListener('keyup', function(e) {
      inputManager.keys[e.key.toLowerCase()] = false;
    });

    updateHUD();
  };

  var update = function(delta) {
    if (!state.active) return;

    updateGunBarrel(delta);
    updateParticles(delta);
    updateEnemies(delta);
    updateWaves(delta);
    updateHUD();

    // Random events
    if (Math.random() < delta * 0.3) {
      spawnMortarImpact(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );
    }

    if (Math.random() < delta * 0.2) {
      spawnIncomingTracer();
    }
  };

  var reset = function() {
    // Remove all created objects
    objects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
    });

    objects = [];
    enemies = [];
    particles = [];

    state.active = false;
    state.wave = 1;
    state.attackersRepelled = 0;
    state.bunkerIntegrity = 100;
    state.nextWaveTime = 0;

    if (state.hudElement) {
      state.hudElement.innerHTML = '';
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
