window.SkyPlatform = (function() {
  'use strict';

  var meshes = [];
  var radarDishes = [];
  var antigravGenerators = [];
  var droneBayDoors = [];
  var turrets = [];
  var fuelPods = [];
  var cloudWisps = [];
  var warningLights = [];
  var spawnPoints = [];
  var state = {
    radarRotation: 0,
    antigravPulse: 0,
    droneDoorPhase: 0,
    warningFlash: 0
  };

  function createMainPlatform(scene) {
    var platformGroup = new THREE.Group();

    // Main deck - large central platform
    var deckGeom = new THREE.BoxGeometry(200, 8, 180);
    var deckMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, roughness: 0.4 });
    var deck = new THREE.Mesh(deckGeom, deckMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    deck.position.set(0, 0, 0);
    platformGroup.add(deck);
    meshes.push(deck);

    // Forward platform extension
    var forwardGeom = new THREE.BoxGeometry(160, 6, 100);
    var forwardMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.6, roughness: 0.5 });
    var forward = new THREE.Mesh(forwardGeom, forwardMat);
    forward.castShadow = true;
    forward.receiveShadow = true;
    forward.position.set(0, -5, -110);
    platformGroup.add(forward);
    meshes.push(forward);

    // Starboard wing
    var wingGeom = new THREE.BoxGeometry(80, 5, 140);
    var wingMat = new THREE.MeshStandardMaterial({ color: 0x454545, metalness: 0.65, roughness: 0.45 });
    var wing = new THREE.Mesh(wingGeom, wingMat);
    wing.castShadow = true;
    wing.receiveShadow = true;
    wing.position.set(-110, -3, 20);
    platformGroup.add(wing);
    meshes.push(wing);

    // Port wing
    var portWingGeom = new THREE.BoxGeometry(80, 5, 140);
    var portWing = new THREE.Mesh(portWingGeom, wingMat);
    portWing.castShadow = true;
    portWing.receiveShadow = true;
    portWing.position.set(110, -3, 20);
    platformGroup.add(portWing);
    meshes.push(portWing);

    scene.add(platformGroup);
  }

  function createAntrigravGenerators(scene) {
    var positions = [
      { x: -80, z: -60 },
      { x: 80, z: -60 },
      { x: -80, z: 80 },
      { x: 80, z: 80 }
    ];

    positions.forEach(function(pos) {
      var genGroup = new THREE.Group();

      // Main generator column
      var colGeom = new THREE.CylinderGeometry(12, 14, 45, 16);
      var colMat = new THREE.MeshStandardMaterial({
        color: 0x1a3a4a,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x005588
      });
      var column = new THREE.Mesh(colGeom, colMat);
      column.castShadow = true;
      column.receiveShadow = true;
      column.position.y = 18;
      genGroup.add(column);
      meshes.push(column);

      // Generator core
      var coreGeom = new THREE.SphereGeometry(8, 16, 16);
      var coreMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00aa88,
        metalness: 0.9,
        roughness: 0.1
      });
      var core = new THREE.Mesh(coreGeom, coreMat);
      core.position.y = 25;
      genGroup.add(core);
      meshes.push(core);

      // Stabilizer ring
      var ringGeom = new THREE.CylinderGeometry(18, 18, 2, 32);
      var ringMat = new THREE.MeshStandardMaterial({ color: 0x0a5a7a, metalness: 0.85 });
      var ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.y = 30;
      genGroup.add(ring);
      meshes.push(ring);

      genGroup.position.set(pos.x, -10, pos.z);
      scene.add(genGroup);
      antigravGenerators.push({ group: genGroup, core: core, originalCoreScale: 1 });
    });
  }

  function createRadarArrays(scene) {
    var positions = [
      { x: -60, z: 60 },
      { x: 60, z: 60 }
    ];

    positions.forEach(function(pos) {
      var radarGroup = new THREE.Group();

      // Radar base pedestal
      var baseGeom = new THREE.CylinderGeometry(8, 10, 6, 12);
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.castShadow = true;
      base.position.y = 2;
      radarGroup.add(base);
      meshes.push(base);

      // Radar arm
      var armGeom = new THREE.BoxGeometry(2, 2, 40);
      var armMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.75 });
      var arm = new THREE.Mesh(armGeom, armMat);
      arm.castShadow = true;
      arm.position.set(0, 8, 18);
      radarGroup.add(arm);
      meshes.push(arm);

      // Radar dish
      var dishGeom = new THREE.BoxGeometry(35, 30, 3);
      var dishMat = new THREE.MeshStandardMaterial({
        color: 0xff8800,
        metalness: 0.8,
        emissive: 0xff4400
      });
      var dish = new THREE.Mesh(dishGeom, dishMat);
      dish.castShadow = true;
      dish.position.set(0, 10, 38);
      radarGroup.add(dish);
      meshes.push(dish);

      radarGroup.position.set(pos.x, 5, pos.z);
      scene.add(radarGroup);
      radarDishes.push({ group: radarGroup, arm: arm });
    });
  }

  function createDroneBay(scene) {
    var bayGroup = new THREE.Group();

    // Hangar structure
    var hangarGeom = new THREE.BoxGeometry(120, 40, 80);
    var hangarMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      metalness: 0.65,
      roughness: 0.5
    });
    var hangar = new THREE.Mesh(hangarGeom, hangarMat);
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    hangar.position.set(0, 15, -150);
    bayGroup.add(hangar);
    meshes.push(hangar);

    // Left bay door
    var leftDoorGeom = new THREE.BoxGeometry(55, 38, 3);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a3a, metalness: 0.8 });
    var leftDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    leftDoor.castShadow = true;
    leftDoor.position.set(-35, 15, -185);
    bayGroup.add(leftDoor);
    meshes.push(leftDoor);
    droneBayDoors.push({ mesh: leftDoor, originalX: -35, direction: -1 });

    // Right bay door
    var rightDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    rightDoor.castShadow = true;
    rightDoor.position.set(35, 15, -185);
    bayGroup.add(rightDoor);
    meshes.push(rightDoor);
    droneBayDoors.push({ mesh: rightDoor, originalX: 35, direction: 1 });

    // Launch ramp
    var rampGeom = new THREE.BoxGeometry(100, 3, 50);
    var rampMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7 });
    var ramp = new THREE.Mesh(rampGeom, rampMat);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    ramp.rotation.z = -0.15;
    ramp.position.set(0, 10, -190);
    bayGroup.add(ramp);
    meshes.push(ramp);

    bayGroup.position.set(0, 0, 0);
    scene.add(bayGroup);
  }

  function createWeaponTurrets(scene) {
    var positions = [
      { x: -70, z: -80 },
      { x: 70, z: -80 },
      { x: -90, z: 40 },
      { x: 90, z: 40 }
    ];

    positions.forEach(function(pos) {
      var turretGroup = new THREE.Group();

      // Turret base
      var baseGeom = new THREE.CylinderGeometry(10, 12, 8, 12);
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.75 });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.castShadow = true;
      base.position.y = 3;
      turretGroup.add(base);
      meshes.push(base);

      // Gun barrel
      var barrelGeom = new THREE.CylinderGeometry(2.5, 2.5, 35, 8);
      var barrelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9 });
      var barrel = new THREE.Mesh(barrelGeom, barrelMat);
      barrel.castShadow = true;
      barrel.rotation.z = 0.3;
      barrel.position.set(0, 8, 15);
      turretGroup.add(barrel);
      meshes.push(barrel);

      // Gun housing
      var housingGeom = new THREE.BoxGeometry(8, 8, 12);
      var housingMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.7 });
      var housing = new THREE.Mesh(housingGeom, housingMat);
      housing.castShadow = true;
      housing.position.set(0, 8, 6);
      turretGroup.add(housing);
      meshes.push(housing);

      turretGroup.position.set(pos.x, 5, pos.z);
      scene.add(turretGroup);
      turrets.push({ group: turretGroup, barrel: barrel, originalRotZ: 0.3 });
    });
  }

  function createCatwalks(scene) {
    var connections = [
      { startX: -60, startZ: 0, endX: -60, endZ: 60 },
      { startX: 60, startZ: 0, endX: 60, endZ: 60 },
      { startX: -60, startZ: 60, endX: 60, endZ: 60 },
      { startX: 0, startZ: -80, endX: 0, endZ: 0 }
    ];

    connections.forEach(function(conn) {
      var midX = (conn.startX + conn.endX) / 2;
      var midZ = (conn.startZ + conn.endZ) / 2;
      var distX = conn.endX - conn.startX;
      var distZ = conn.endZ - conn.startZ;
      var length = Math.sqrt(distX * distX + distZ * distZ);

      // Catwalk deck
      var deckGeom = new THREE.BoxGeometry(3, 2, length + 10);
      var deckMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6 });
      var deck = new THREE.Mesh(deckGeom, deckMat);
      deck.castShadow = true;
      deck.receiveShadow = true;
      deck.position.set(midX, 8, midZ);
      var angle = Math.atan2(distZ, distX);
      deck.rotation.y = angle;
      scene.add(deck);
      meshes.push(deck);

      // Railing posts
      for (var i = 0; i < length; i += 25) {
        var postGeom = new THREE.CylinderGeometry(0.8, 1, 6, 8);
        var postMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, metalness: 0.7 });
        var post = new THREE.Mesh(postGeom, postMat);
        post.castShadow = true;
        var ratio = i / length;
        var postX = conn.startX + distX * ratio;
        var postZ = conn.startZ + distZ * ratio;
        post.position.set(postX, 11, postZ);
        scene.add(post);
        meshes.push(post);
      }
    });
  }

  function createCommandTower(scene) {
    var towerGroup = new THREE.Group();

    // Main tower body
    var bodyGeom = new THREE.BoxGeometry(25, 70, 25);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.7 });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.set(0, 30, 0);
    towerGroup.add(body);
    meshes.push(body);

    // Observation dome top
    var domeGeom = new THREE.SphereGeometry(13, 16, 12);
    var domeMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a5a,
      metalness: 0.75,
      emissive: 0x003366
    });
    var dome = new THREE.Mesh(domeGeom, domeMat);
    dome.castShadow = true;
    dome.position.set(0, 73, 0);
    towerGroup.add(dome);
    meshes.push(dome);

    // Antenna mast
    var mastGeom = new THREE.CylinderGeometry(1.5, 2, 25, 8);
    var mastMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9 });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.castShadow = true;
    mast.position.set(0, 88, 0);
    towerGroup.add(mast);
    meshes.push(mast);

    // Communication array
    for (var i = 0; i < 3; i++) {
      var arrayGeom = new THREE.BoxGeometry(1, 8, 1);
      var arrayMat = new THREE.MeshStandardMaterial({ color: 0xff8800 });
      var array = new THREE.Mesh(arrayGeom, arrayMat);
      array.castShadow = true;
      var angle = (i / 3) * Math.PI * 2;
      array.position.set(Math.cos(angle) * 8, 82, Math.sin(angle) * 8);
      towerGroup.add(array);
      meshes.push(array);
    }

    towerGroup.position.set(0, 0, 100);
    scene.add(towerGroup);
  }

  function createFuelPods(scene) {
    var positions = [
      { x: -40, z: -40 },
      { x: 40, z: -40 },
      { x: -40, z: 40 },
      { x: 40, z: 40 }
    ];

    positions.forEach(function(pos) {
      var podGroup = new THREE.Group();

      // Main fuel tank
      var tankGeom = new THREE.SphereGeometry(10, 12, 12);
      var tankMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a2a,
        metalness: 0.7,
        emissive: 0x666600
      });
      var tank = new THREE.Mesh(tankGeom, tankMat);
      tank.castShadow = true;
      tank.position.y = 12;
      podGroup.add(tank);
      meshes.push(tank);
      fuelPods.push({ mesh: tank, originalScale: 1 });

      // Support bracket
      var bracketGeom = new THREE.BoxGeometry(3, 15, 3);
      var bracketMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8 });
      var bracket = new THREE.Mesh(bracketGeom, bracketMat);
      bracket.castShadow = true;
      bracket.position.y = 8;
      podGroup.add(bracket);
      meshes.push(bracket);

      podGroup.position.set(pos.x, 5, pos.z);
      scene.add(podGroup);
    });
  }

  function createEscapePods(scene) {
    var positions = [
      { x: -120, z: -120 },
      { x: 120, z: -120 },
      { x: -120, z: 120 },
      { x: 120, z: 120 }
    ];

    positions.forEach(function(pos) {
      var podGeom = new THREE.SphereGeometry(6, 12, 12);
      var podMat = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        metalness: 0.8,
        emissive: 0xff2200
      });
      var pod = new THREE.Mesh(podGeom, podMat);
      pod.castShadow = true;
      pod.position.set(pos.x, 15, pos.z);
      scene.add(pod);
      meshes.push(pod);
    });
  }

  function createAmmunitionDepot(scene) {
    var depotGroup = new THREE.Group();

    // Bunker structure
    var bunkerGeom = new THREE.BoxGeometry(60, 25, 50);
    var bunkerMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.6,
      roughness: 0.7
    });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    bunker.position.set(0, 10, -200);
    depotGroup.add(bunker);
    meshes.push(bunker);

    // Ammo storage containers
    for (var i = 0; i < 6; i++) {
      var containerGeom = new THREE.BoxGeometry(12, 12, 12);
      var containerMat = new THREE.MeshStandardMaterial({
        color: 0x4a3a1a,
        metalness: 0.7
      });
      var container = new THREE.Mesh(containerGeom, containerMat);
      container.castShadow = true;
      var xOffset = (i % 3 - 1) * 20;
      var zOffset = Math.floor(i / 3) * 20 - 10;
      container.position.set(xOffset, 18, zOffset - 200);
      scene.add(container);
      meshes.push(container);
    }

    scene.add(depotGroup);
  }

  function createCloudWisps(scene) {
    for (var i = 0; i < 8; i++) {
      var cloudGeom = new THREE.SphereGeometry(25 + Math.random() * 20, 8, 8);
      var cloudMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.3,
        metalness: 0.2,
        roughness: 0.8
      });
      var cloud = new THREE.Mesh(cloudGeom, cloudMat);
      cloud.position.set(
        Math.random() * 300 - 150,
        -120 - Math.random() * 100,
        Math.random() * 300 - 150
      );
      scene.add(cloud);
      meshes.push(cloud);
      cloudWisps.push({
        mesh: cloud,
        vx: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3
      });
    }
  }

  function createCableTethers(scene) {
    var towerPos = { x: 0, y: 0, z: 100 };
    var anchorPoints = [
      { x: -80, z: -60 },
      { x: 80, z: -60 },
      { x: -80, z: 80 },
      { x: 80, z: 80 },
      { x: -120, z: 0 },
      { x: 120, z: 0 }
    ];

    anchorPoints.forEach(function(anchor) {
      var points = [
        new THREE.Vector3(towerPos.x, 70, towerPos.z),
        new THREE.Vector3(anchor.x, 15, anchor.z)
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
      var line = new THREE.LineSegments(geometry, material);
      scene.add(line);
      meshes.push(line);
    });
  }

  function createWarningLights(scene) {
    var positions = [
      { x: 0, z: 100, y: 90 },
      { x: -120, z: 0, y: 25 },
      { x: 120, z: 0, y: 25 },
      { x: 0, z: -150, y: 30 }
    ];

    positions.forEach(function(pos) {
      var lightGroup = new THREE.Group();

      // Light base
      var baseGeom = new THREE.BoxGeometry(3, 3, 3);
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var base = new THREE.Mesh(baseGeom, baseMat);
      base.position.y = 1.5;
      lightGroup.add(base);
      meshes.push(base);

      // Light bulb
      var bulbGeom = new THREE.SphereGeometry(2, 8, 8);
      var bulbMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        metalness: 0.5
      });
      var bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.y = 4;
      lightGroup.add(bulb);
      meshes.push(bulb);

      lightGroup.position.set(pos.x, pos.y, pos.z);
      scene.add(lightGroup);
      warningLights.push({ bulb: bulb });
    });
  }

  function createSpawnPoints() {
    spawnPoints = [
      { x: -60, y: 25, z: 0 },
      { x: 60, y: 25, z: 0 },
      { x: 0, y: 25, z: 60 },
      { x: 0, y: 25, z: -100 },
      { x: -100, y: 20, z: 40 }
    ];
  }

  function init(scene, camera) {
    meshes = [];
    radarDishes = [];
    antigravGenerators = [];
    droneBayDoors = [];
    turrets = [];
    fuelPods = [];
    cloudWisps = [];
    warningLights = [];
    state = {
      radarRotation: 0,
      antigravPulse: 0,
      droneDoorPhase: 0,
      warningFlash: 0
    };

    createMainPlatform(scene);
    createAntrigravGenerators(scene);
    createRadarArrays(scene);
    createDroneBay(scene);
    createWeaponTurrets(scene);
    createCatwalks(scene);
    createCommandTower(scene);
    createFuelPods(scene);
    createEscapePods(scene);
    createAmmunitionDepot(scene);
    createCloudWisps(scene);
    createCableTethers(scene);
    createWarningLights(scene);
    createSpawnPoints();

    return {
      meshes: meshes,
      spawnPoints: spawnPoints
    };
  }

  function update(delta) {
    state.radarRotation += delta * 0.5;
    state.antigravPulse += delta * 2;
    state.droneDoorPhase += delta * 1.5;
    state.warningFlash += delta * 2;

    // Rotate radar dishes
    radarDishes.forEach(function(radar) {
      radar.group.rotation.y = state.radarRotation;
    });

    // Pulse anti-grav generators
    antigravGenerators.forEach(function(gen) {
      var pulse = 1 + Math.sin(state.antigravPulse) * 0.15;
      gen.core.scale.copy(new THREE.Vector3(pulse, pulse, pulse));
      gen.core.material.emissiveIntensity = 0.5 + Math.sin(state.antigravPulse) * 0.3;
    });

    // Cycle drone bay doors
    droneBayDoors.forEach(function(door) {
      var phase = state.droneDoorPhase % (Math.PI * 2);
      var openAmount = Math.sin(phase) > 0 ? Math.sin(phase) : 0;
      door.mesh.position.x = door.originalX + door.direction * openAmount * 40;
    });

    // Track turrets (slight rotation)
    turrets.forEach(function(turret) {
      turret.barrel.rotation.z = turret.originalRotZ + Math.sin(state.antigravPulse * 0.5) * 0.1;
    });

    // Fuel pod venting (scale pulse)
    fuelPods.forEach(function(pod) {
      var vent = 1 + Math.sin(state.antigravPulse) * 0.08;
      pod.mesh.scale.copy(new THREE.Vector3(vent, vent, vent));
    });

    // Cloud wisps drifting
    cloudWisps.forEach(function(wisp) {
      wisp.mesh.position.x += wisp.vx;
      wisp.mesh.position.z += wisp.vz;

      // Wrap around
      if (wisp.mesh.position.x > 200) wisp.mesh.position.x = -200;
      if (wisp.mesh.position.x < -200) wisp.mesh.position.x = 200;
      if (wisp.mesh.position.z > 200) wisp.mesh.position.z = -200;
      if (wisp.mesh.position.z < -200) wisp.mesh.position.z = 200;
    });

    // Warning light flashing
    warningLights.forEach(function(light) {
      var flash = Math.abs(Math.sin(state.warningFlash));
      light.bulb.material.emissiveIntensity = 0.3 + flash * 0.7;
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    meshes = [];
    radarDishes = [];
    antigravGenerators = [];
    droneBayDoors = [];
    turrets = [];
    fuelPods = [];
    cloudWisps = [];
    warningLights = [];
    spawnPoints = [];
    state = {
      radarRotation: 0,
      antigravPulse: 0,
      droneDoorPhase: 0,
      warningFlash: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
