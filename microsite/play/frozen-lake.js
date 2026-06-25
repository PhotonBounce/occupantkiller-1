window.FrozenLake = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  // Game state
  var gameObjects = [];
  var enemies = [];
  var particles = [];
  var mines = [];
  var crackAnimations = [];
  var gunPositions = [];
  var time = 0;

  // Colors
  var ICE_WHITE = 0xDDEEFF;
  var SNOW_WHITE = 0xF8F8FF;
  var WATER_DARK = 0x1A2A4A;
  var HUT_WOOD = 0x8B6914;
  var DANGER_RED = 0xFF2200;
  var ARCTIC_BLUE = 0x6688AA;
  var ICE_DARK = 0x7799BB;

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    gameObjects = [];
    enemies = [];
    particles = [];
    mines = [];
    crackAnimations = [];
    gunPositions = [];
    time = 0;

    // Create frozen lake surface - large ice tiles
    createLakeBase();

    // Create broken ice sections with hazards
    createCrackedIce();

    // Create ice fishing huts as fortifications
    createIceFishingHuts();

    // Create anti-tank gun positions
    createAntiTankPositions();

    // Create snowdrift berms
    createSnowdriftBerms();

    // Create visible broken ice holes
    createBrokenIceHoles();

    // Create frozen-in vehicle hull
    createFrozenVehicleHull();

    // Create mine markers
    createMineMarkers();

    // Create supply crate drops
    createSupplyCrates();

    // Create frozen tree stumps at shore
    createFrozenTrees();

    // Create enemy trench in snow
    createEnemyTrench();

    // Spawn initial enemies
    spawnEnemies();
  }

  function createLakeBase() {
    // Main ice surface - 200x200 unit frozen lake
    var iceGeometry = new THREE.BoxGeometry(200, 0.5, 200);
    var iceMaterial = new THREE.MeshStandardMaterial({
      color: ICE_WHITE,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x88CCFF,
      emissiveIntensity: 0.1
    });
    var iceMesh = new THREE.Mesh(iceGeometry, iceMaterial);
    iceMesh.position.y = -10;
    iceMesh.castShadow = true;
    iceMesh.receiveShadow = true;
    scene.add(iceMesh);
    gameObjects.push({ mesh: iceMesh, type: 'ice' });

    // Add secondary ice surface with slight variation
    var iceGeometry2 = new THREE.BoxGeometry(190, 0.3, 190);
    var iceMaterial2 = new THREE.MeshStandardMaterial({
      color: 0xEEF5FF,
      metalness: 0.3,
      roughness: 0.4
    });
    var iceMesh2 = new THREE.Mesh(iceGeometry2, iceMaterial2);
    iceMesh2.position.y = -9.5;
    iceMesh2.castShadow = true;
    iceMesh2.receiveShadow = true;
    scene.add(iceMesh2);
    gameObjects.push({ mesh: iceMesh2, type: 'ice' });
  }

  function createCrackedIce() {
    // Create fragmented ice shards in grid pattern
    var crackPositions = [
      { x: -50, z: 30 },
      { x: 60, z: -40 },
      { x: -80, z: -60 },
      { x: 40, z: 50 },
      { x: 0, z: 70 }
    ];

    crackPositions.forEach(function(pos) {
      // Create cluster of broken ice shards
      for (var i = 0; i < 3; i++) {
        var crackGeometry = new THREE.BoxGeometry(
          8 + Math.random() * 6,
          0.8,
          8 + Math.random() * 6
        );
        var crackMaterial = new THREE.MeshStandardMaterial({
          color: ICE_DARK,
          metalness: 0.5,
          roughness: 0.4,
          emissive: 0x4466AA,
          emissiveIntensity: 0.2
        });
        var crackMesh = new THREE.Mesh(crackGeometry, crackMaterial);
        crackMesh.position.set(
          pos.x + (Math.random() - 0.5) * 15,
          -9 + Math.random() * 0.5,
          pos.z + (Math.random() - 0.5) * 15
        );
        crackMesh.rotation.z = Math.random() * Math.PI;
        crackMesh.castShadow = true;
        crackMesh.receiveShadow = true;
        scene.add(crackMesh);
        gameObjects.push({ mesh: crackMesh, type: 'cracked_ice' });
        crackAnimations.push({
          mesh: crackMesh,
          originalScale: { x: crackMesh.scale.x, y: crackMesh.scale.y, z: crackMesh.scale.z },
          crackTime: 0,
          active: false
        });
      }
    });
  }

  function createIceFishingHuts() {
    // Create 3 ice fishing hut fortifications
    var hutPositions = [
      { x: -60, z: -70 },
      { x: 70, z: 0 },
      { x: 0, z: 80 }
    ];

    hutPositions.forEach(function(pos) {
      // Hut main structure
      var hutGeometry = new THREE.BoxGeometry(15, 12, 15);
      var hutMaterial = new THREE.MeshStandardMaterial({
        color: HUT_WOOD,
        metalness: 0.1,
        roughness: 0.8
      });
      var hutMesh = new THREE.Mesh(hutGeometry, hutMaterial);
      hutMesh.position.set(pos.x, -4, pos.z);
      hutMesh.castShadow = true;
      hutMesh.receiveShadow = true;
      scene.add(hutMesh);
      gameObjects.push({ mesh: hutMesh, type: 'hut', spawnPoint: true });

      // Hut roof (cone)
      var roofGeometry = new THREE.ConeGeometry(10, 8, 8);
      var roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x663333,
        metalness: 0.0,
        roughness: 0.9
      });
      var roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
      roofMesh.position.set(pos.x, 6, pos.z);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      scene.add(roofMesh);
      gameObjects.push({ mesh: roofMesh, type: 'roof' });

      // Hut door (recessed BoxGeometry)
      var doorGeometry = new THREE.BoxGeometry(4, 6, 0.5);
      var doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2A2A2A,
        metalness: 0.0,
        roughness: 0.7
      });
      var doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
      doorMesh.position.set(pos.x, -2, pos.z + 7.8);
      doorMesh.castShadow = true;
      doorMesh.receiveShadow = true;
      scene.add(doorMesh);
      gameObjects.push({
        mesh: doorMesh,
        type: 'door',
        animation: {
          state: 'closed',
          angle: 0,
          targetAngle: 0
        }
      });

      // Chimney smoke indicator (SphereGeometry)
      var smokeGeometry = new THREE.SphereGeometry(1.5, 6, 6);
      var smokeMaterial = new THREE.MeshStandardMaterial({
        color: 0xAAAAAAA,
        metalness: 0.0,
        roughness: 0.8,
        transparent: true,
        opacity: 0.6
      });
      var smokeMesh = new THREE.Mesh(smokeGeometry, smokeMaterial);
      smokeMesh.position.set(pos.x, 8, pos.z);
      scene.add(smokeMesh);
      gameObjects.push({ mesh: smokeMesh, type: 'smoke' });
    });
  }

  function createAntiTankPositions() {
    // Create 3 anti-tank gun positions
    var gunPositions_data = [
      { x: -85, z: 40 },
      { x: 75, z: 60 },
      { x: 30, z: -85 }
    ];

    gunPositions_data.forEach(function(pos) {
      // Sandbag ring (BoxGeometry cylinders)
      var sandbagGeometry = new THREE.CylinderGeometry(8, 8, 2, 16);
      var sandbagMaterial = new THREE.MeshStandardMaterial({
        color: 0xD4A76A,
        metalness: 0.0,
        roughness: 0.9
      });
      var sandbagMesh = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
      sandbagMesh.position.set(pos.x, -8.5, pos.z);
      sandbagMesh.castShadow = true;
      sandbagMesh.receiveShadow = true;
      scene.add(sandbagMesh);
      gameObjects.push({ mesh: sandbagMesh, type: 'sandbag' });

      // Gun barrel (BoxGeometry)
      var barrelGeometry = new THREE.BoxGeometry(1, 0.6, 12);
      var barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A,
        metalness: 0.8,
        roughness: 0.2
      });
      var barrelMesh = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrelMesh.position.set(pos.x, -6, pos.z + 2);
      barrelMesh.castShadow = true;
      barrelMesh.receiveShadow = true;
      scene.add(barrelMesh);
      gameObjects.push({ mesh: barrelMesh, type: 'gun_barrel' });

      // Gun breech (SphereGeometry)
      var breechGeometry = new THREE.SphereGeometry(2, 8, 8);
      var breechMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
      });
      var breechMesh = new THREE.Mesh(breechGeometry, breechMaterial);
      breechMesh.position.set(pos.x, -6, pos.z - 2);
      breechMesh.castShadow = true;
      breechMesh.receiveShadow = true;
      scene.add(breechMesh);
      gameObjects.push({ mesh: breechMesh, type: 'breech' });

      // Gun mount pivot (CylinderGeometry)
      var mountGeometry = new THREE.CylinderGeometry(3, 3, 1, 8);
      var mountMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.6,
        roughness: 0.4
      });
      var mountMesh = new THREE.Mesh(mountGeometry, mountMaterial);
      mountMesh.position.set(pos.x, -7, pos.z);
      mountMesh.castShadow = true;
      mountMesh.receiveShadow = true;
      scene.add(mountMesh);
      gameObjects.push({ mesh: mountMesh, type: 'mount' });

      gunPositions.push({
        barrel: barrelMesh,
        breech: breechMesh,
        x: pos.x,
        z: pos.z,
        angle: 0,
        rotationSpeed: 0.02
      });
    });
  }

  function createSnowdriftBerms() {
    // Create snowdrift mounds using SphereGeometry
    var driftPositions = [
      { x: -40, z: -50, scale: 2 },
      { x: 50, z: 20, scale: 2.5 },
      { x: -30, z: 60, scale: 1.8 },
      { x: 85, z: -30, scale: 2.2 },
      { x: 20, z: -70, scale: 2 }
    ];

    driftPositions.forEach(function(pos) {
      var driftGeometry = new THREE.SphereGeometry(12 * pos.scale, 8, 6);
      var driftMaterial = new THREE.MeshStandardMaterial({
        color: SNOW_WHITE,
        metalness: 0.0,
        roughness: 0.95,
        emissive: 0xEEEEEE,
        emissiveIntensity: 0.2
      });
      var driftMesh = new THREE.Mesh(driftGeometry, driftMaterial);
      driftMesh.position.set(pos.x, -5, pos.z);
      driftMesh.scale.set(1, 0.6, 1);
      driftMesh.castShadow = true;
      driftMesh.receiveShadow = true;
      scene.add(driftMesh);
      gameObjects.push({ mesh: driftMesh, type: 'snowdrift', spawnPoint: true });
    });
  }

  function createBrokenIceHoles() {
    // Create dark water holes in ice
    var holePositions = [
      { x: 35, z: -45 },
      { x: -65, z: 55 },
      { x: 45, z: 65 }
    ];

    holePositions.forEach(function(pos) {
      // Hole rim (dark BoxGeometry)
      var rimGeometry = new THREE.BoxGeometry(20, 0.5, 20);
      var rimMaterial = new THREE.MeshStandardMaterial({
        color: WATER_DARK,
        metalness: 0.2,
        roughness: 0.7,
        emissive: 0x000033,
        emissiveIntensity: 0.3
      });
      var rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
      rimMesh.position.set(pos.x, -8.8, pos.z);
      rimMesh.castShadow = true;
      rimMesh.receiveShadow = true;
      scene.add(rimMesh);
      gameObjects.push({ mesh: rimMesh, type: 'ice_hole', hazard: true });

      // Hole interior (darker water)
      var holeGeometry = new THREE.BoxGeometry(19, 3, 19);
      var holeMaterial = new THREE.MeshStandardMaterial({
        color: 0x0A1A2A,
        metalness: 0.1,
        roughness: 0.5,
        emissive: 0x001122,
        emissiveIntensity: 0.5
      });
      var holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
      holeMesh.position.set(pos.x, -12, pos.z);
      holeMesh.castShadow = true;
      holeMesh.receiveShadow = true;
      scene.add(holeMesh);
      gameObjects.push({ mesh: holeMesh, type: 'water', hazard: true });
    });
  }

  function createFrozenVehicleHull() {
    // Create frozen-in tank hull visible through ice
    var hullGeometry = new THREE.BoxGeometry(12, 5, 20);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x2A3A4A,
      metalness: 0.6,
      roughness: 0.5,
      emissive: 0x1A2A3A,
      emissiveIntensity: 0.2
    });
    var hullMesh = new THREE.Mesh(hullGeometry, hullMaterial);
    hullMesh.position.set(60, -11, -50);
    hullMesh.rotation.y = 0.3;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    scene.add(hullMesh);
    gameObjects.push({ mesh: hullMesh, type: 'vehicle_hull', destructible: true });

    // Turret
    var turretGeometry = new THREE.CylinderGeometry(4, 4, 3, 12);
    var turretMaterial = new THREE.MeshStandardMaterial({
      color: 0x1A2A3A,
      metalness: 0.6,
      roughness: 0.5
    });
    var turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
    turretMesh.position.set(60, -6, -50);
    turretMesh.castShadow = true;
    turretMesh.receiveShadow = true;
    scene.add(turretMesh);
    gameObjects.push({ mesh: turretMesh, type: 'turret' });
  }

  function createMineMarkers() {
    // Create barely visible mine markers
    var minePositions = [
      { x: -70, z: 20 },
      { x: 50, z: 40 },
      { x: 10, z: -60 },
      { x: -45, z: -30 },
      { x: 80, z: -60 }
    ];

    minePositions.forEach(function(pos) {
      var markerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 8);
      var markerMaterial = new THREE.MeshStandardMaterial({
        color: DANGER_RED,
        metalness: 0.3,
        roughness: 0.6,
        emissive: 0xFF0000,
        emissiveIntensity: 0.3
      });
      var markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
      markerMesh.position.set(pos.x, -9.4, pos.z);
      markerMesh.castShadow = true;
      markerMesh.receiveShadow = true;
      scene.add(markerMesh);
      gameObjects.push({ mesh: markerMesh, type: 'mine_marker', hazard: true });

      mines.push({
        position: { x: pos.x, z: pos.z },
        triggered: false,
        mesh: markerMesh
      });
    });
  }

  function createSupplyCrates() {
    // Create scattered supply crates
    var cratePositions = [
      { x: -75, z: -75 },
      { x: 90, z: 30 }
    ];

    cratePositions.forEach(function(pos) {
      var crateGeometry = new THREE.BoxGeometry(6, 6, 6);
      var crateMaterial = new THREE.MeshStandardMaterial({
        color: 0xCC8800,
        metalness: 0.0,
        roughness: 0.8
      });
      var crateMesh = new THREE.Mesh(crateGeometry, crateMaterial);
      crateMesh.position.set(pos.x, -6.5, pos.z);
      crateMesh.castShadow = true;
      crateMesh.receiveShadow = true;
      scene.add(crateMesh);
      gameObjects.push({ mesh: crateMesh, type: 'supply_crate', collectible: true });
    });
  }

  function createFrozenTrees() {
    // Create frozen tree stumps at shore
    var treePositions = [
      { x: -95, z: 0 },
      { x: -90, z: 30 },
      { x: 95, z: -20 },
      { x: 90, z: 50 }
    ];

    treePositions.forEach(function(pos) {
      // Trunk (CylinderGeometry)
      var trunkGeometry = new THREE.CylinderGeometry(2, 2.5, 8, 8);
      var trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x554433,
        metalness: 0.0,
        roughness: 0.9
      });
      var trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunkMesh.position.set(pos.x, -5, pos.z);
      trunkMesh.castShadow = true;
      trunkMesh.receiveShadow = true;
      scene.add(trunkMesh);
      gameObjects.push({ mesh: trunkMesh, type: 'tree_trunk', spawnPoint: true });

      // Frost crown (SphereGeometry)
      var crownGeometry = new THREE.SphereGeometry(3, 6, 6);
      var crownMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCEEFF,
        metalness: 0.2,
        roughness: 0.7,
        emissive: 0x6688AA,
        emissiveIntensity: 0.2
      });
      var crownMesh = new THREE.Mesh(crownGeometry, crownMaterial);
      crownMesh.position.set(pos.x, 1, pos.z);
      crownMesh.castShadow = true;
      crownMesh.receiveShadow = true;
      scene.add(crownMesh);
      gameObjects.push({ mesh: crownMesh, type: 'frost_crown' });
    });
  }

  function createEnemyTrench() {
    // Create enemy trench cut into snow
    var trenchGeometry = new THREE.BoxGeometry(60, 8, 3);
    var trenchMaterial = new THREE.MeshStandardMaterial({
      color: 0x7A6A5A,
      metalness: 0.0,
      roughness: 0.9
    });
    var trenchMesh = new THREE.Mesh(trenchGeometry, trenchMaterial);
    trenchMesh.position.set(20, -8, -95);
    trenchMesh.castShadow = true;
    trenchMesh.receiveShadow = true;
    scene.add(trenchMesh);
    gameObjects.push({ mesh: trenchMesh, type: 'trench', spawnPoint: true });

    // Trench parapet (BoxGeometry berms)
    var parapetGeometry = new THREE.BoxGeometry(60, 2, 2);
    var parapetMaterial = new THREE.MeshStandardMaterial({
      color: 0x8A7A6A,
      metalness: 0.0,
      roughness: 0.9
    });
    var parapetMesh = new THREE.Mesh(parapetGeometry, parapetMaterial);
    parapetMesh.position.set(20, -3, -97);
    parapetMesh.castShadow = true;
    parapetMesh.receiveShadow = true;
    scene.add(parapetMesh);
    gameObjects.push({ mesh: parapetMesh, type: 'parapet' });
  }

  function spawnEnemies() {
    // Spawn enemies at fortification points
    var spawnPoints = [
      { x: -60, z: -70, type: 'hut' },
      { x: 70, z: 0, type: 'hut' },
      { x: -85, z: 40, type: 'gun' },
      { x: 75, z: 60, type: 'gun' },
      { x: 20, z: -95, type: 'trench' }
    ];

    spawnPoints.forEach(function(point, index) {
      if (index < 3) {
        var enemy = {
          position: { x: point.x, y: -6, z: point.z },
          type: point.type,
          health: 100,
          active: true,
          crawlProgress: Math.random(),
          mesh: null
        };
        enemies.push(enemy);
      }
    });
  }

  function update(delta) {
    time += delta;

    // Animate ice cracking
    animateIceCracks(delta);

    // Animate snow blizzard particles
    animateBlizzardParticles(delta);

    // Animate gun tracking
    animateGunTracking(delta);

    // Animate doors
    animateDoors(delta);

    // Update enemy positions and animations
    updateEnemies(delta);

    // Check mine triggers
    checkMineTriggers();
  }

  function animateIceCracks(delta) {
    crackAnimations.forEach(function(crack) {
      if (Math.random() < 0.02) {
        crack.active = true;
        crack.crackTime = 0;
      }

      if (crack.active) {
        crack.crackTime += delta;
        var flicker = Math.sin(crack.crackTime * 20) * 0.05;
        crack.mesh.scale.y = crack.originalScale.y * (0.95 + flicker);

        if (crack.crackTime > 0.3) {
          crack.active = false;
          crack.mesh.scale.y = crack.originalScale.y;
        }
      }
    });
  }

  function animateBlizzardParticles(delta) {
    // Create blizzard particles effect
    if (Math.random() < 0.3) {
      var snowGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var snowMaterial = new THREE.MeshStandardMaterial({
        color: SNOW_WHITE,
        metalness: 0.0,
        roughness: 0.9,
        transparent: true,
        opacity: 0.6
      });
      var snowMesh = new THREE.Mesh(snowGeometry, snowMaterial);
      snowMesh.position.set(
        (Math.random() - 0.5) * 200,
        50 + Math.random() * 50,
        (Math.random() - 0.5) * 200
      );
      scene.add(snowMesh);
      particles.push({
        mesh: snowMesh,
        velocity: { x: Math.random() * 2 - 1, y: -5 - Math.random() * 5, z: Math.random() * 2 - 1 },
        life: 8 + Math.random() * 4
      });
    }

    // Update particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.mesh.position.add(new THREE.Vector3(p.velocity.x * delta, p.velocity.y * delta, p.velocity.z * delta));
      p.life -= delta;

      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
      }
    }
  }

  function animateGunTracking(delta) {
    if (camera && gunPositions.length > 0) {
      gunPositions.forEach(function(gun) {
        // Track toward camera with slow rotation
        var targetAngle = Math.atan2(camera.position.x - gun.x, camera.position.z - gun.z);
        gun.angle += (targetAngle - gun.angle) * gun.rotationSpeed;

        gun.barrel.rotation.y = gun.angle;
        gun.breech.rotation.y = gun.angle;

        // Slight oscillation for idle tracking
        gun.barrel.rotation.x = Math.sin(time * 0.5) * 0.1 - 0.2;
      });
    }
  }

  function animateDoors(delta) {
    gameObjects.forEach(function(obj) {
      if (obj.type === 'door' && obj.animation) {
        // Random door opening animation
        if (Math.random() < 0.01) {
          obj.animation.targetAngle = obj.animation.targetAngle === 0 ? 1.5 : 0;
        }

        obj.animation.angle += (obj.animation.targetAngle - obj.animation.angle) * 0.05;
        obj.mesh.rotation.y = obj.animation.angle;
      }
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      if (enemy.active) {
        // Crawl animation
        enemy.crawlProgress += delta * 0.3;
        enemy.position.y = -6 + Math.sin(enemy.crawlProgress * 2) * 0.5;
      }
    });
  }

  function checkMineTriggers() {
    // Mines could be triggered by proximity (placeholder)
    mines.forEach(function(mine) {
      if (camera && !mine.triggered) {
        var dist = Math.sqrt(
          Math.pow(camera.position.x - mine.position.x, 2) +
          Math.pow(camera.position.z - mine.position.z, 2)
        );
        if (dist < 3) {
          triggerMine(mine);
        }
      }
    });
  }

  function triggerMine(mine) {
    mine.triggered = true;

    // Mine detonation effect
    var explosionGeometry = new THREE.SphereGeometry(8, 8, 8);
    var explosionMaterial = new THREE.MeshStandardMaterial({
      color: DANGER_RED,
      emissive: 0xFF6600,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.5
    });
    var explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosionMesh.position.set(mine.position.x, -5, mine.position.z);
    scene.add(explosionMesh);

    // Remove explosion after brief flash
    setTimeout(function() {
      scene.remove(explosionMesh);
    }, 200);

    // Mark hole as open
    mine.mesh.visible = false;
  }

  function reset() {
    // Remove all game objects
    gameObjects.forEach(function(obj) {
      scene.remove(obj.mesh);
    });
    gameObjects = [];

    // Remove all enemies
    enemies = [];

    // Remove all particles
    particles.forEach(function(p) {
      scene.remove(p.mesh);
    });
    particles = [];

    // Clear other state
    mines = [];
    crackAnimations = [];
    gunPositions = [];
    time = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
