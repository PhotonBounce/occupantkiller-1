window.UnderwaterCave = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var spawnPoints = [];
  var biolumObjects = [];
  var fishSchool = [];
  var bubbleParticles = [];
  var stalactiteDrips = [];

  var OCEAN_BLUE = 0x0A1A3A;
  var BIOLUM_CYAN = 0x00FFFF;
  var BIOLUM_PURPLE = 0xBB00FF;
  var CAVE_ROCK = 0x2A2A3A;
  var AIR_POCKET_BLUE = 0x4A7BA7;
  var SAND_BEIGE = 0x8B7355;

  var time = 0;
  var dripCooldown = 0;
  var beaconFlash = 0;

  function createMaterial(color, emissive, transparency) {
    return new THREE.MeshPhongMaterial({
      color: color,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.4 : 0,
      transparent: transparency || false,
      opacity: transparency ? 0.6 : 1.0,
      wireframe: false
    });
  }

  function addMesh(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);
    if (scale) mesh.scale.copy(scale);
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createCavern() {
    // Large irregular cave walls using BoxGeometry sections
    var wallMaterial = createMaterial(CAVE_ROCK);

    // Left wall
    var leftWall = new THREE.BoxGeometry(15, 60, 80);
    var leftWallMesh = addMesh(leftWall, wallMaterial, new THREE.Vector3(-40, 0, 0));
    leftWallMesh.rotation.z = 0.15;

    // Right wall
    var rightWall = new THREE.BoxGeometry(12, 65, 85);
    var rightWallMesh = addMesh(rightWall, wallMaterial, new THREE.Vector3(45, -2, 0));
    rightWallMesh.rotation.z = -0.12;

    // Rear wall
    var rearWall = new THREE.BoxGeometry(95, 55, 8);
    var rearWallMesh = addMesh(rearWall, wallMaterial, new THREE.Vector3(0, 0, -45));

    // Front wall (partial - exit area)
    var frontWall = new THREE.BoxGeometry(70, 50, 6);
    var frontWallMesh = addMesh(frontWall, wallMaterial, new THREE.Vector3(-5, -5, 42));

    // Cave floor
    var floorMaterial = createMaterial(SAND_BEIGE);
    var floor = new THREE.BoxGeometry(100, 4, 100);
    var floorMesh = addMesh(floor, floorMaterial, new THREE.Vector3(0, -32, 0));

    // Cavern ceiling - darker blue-gray
    var ceilingMaterial = createMaterial(0x1A2A4A);
    var ceiling = new THREE.BoxGeometry(98, 3, 95);
    var ceilingMesh = addMesh(ceiling, ceilingMaterial, new THREE.Vector3(0, 28, 0));
  }

  function createAirPocket() {
    // Air pocket dome at ceiling
    var airMaterial = createMaterial(AIR_POCKET_BLUE, 0x6699DD, true);

    // Dome cap
    var domeTop = new THREE.BoxGeometry(35, 12, 35);
    var domeMesh = addMesh(domeTop, airMaterial, new THREE.Vector3(0, 28, -20));

    // Air pocket lights (positioned upward)
    var airLightMaterial = createMaterial(0xCCEEFF, 0xCCEEFF);
    var airLight1 = new THREE.BoxGeometry(3, 2, 3);
    addMesh(airLight1, airLightMaterial, new THREE.Vector3(-10, 35, -20));
    addMesh(airLight1, airLightMaterial, new THREE.Vector3(10, 35, -20));

    var airLight2 = new THREE.BoxGeometry(2, 2, 2);
    addMesh(airLight2, airLightMaterial, new THREE.Vector3(0, 36, -15));
    addMesh(airLight2, airLightMaterial, new THREE.Vector3(0, 36, -25));
  }

  function createWaterZone() {
    // Large semi-transparent water volume
    var waterMaterial = createMaterial(OCEAN_BLUE, 0x001144, true);
    var waterBox = new THREE.BoxGeometry(90, 25, 85);
    var waterMesh = addMesh(waterBox, waterMaterial, new THREE.Vector3(0, -5, 0));
    waterMesh.renderOrder = 1;
  }

  function createSubmarinePen() {
    // Dry dock platform
    var dockMaterial = createMaterial(0x4A4A5A);
    var dock = new THREE.BoxGeometry(30, 2, 20);
    addMesh(dock, dockMaterial, new THREE.Vector3(-20, -25, 25));

    // Submarine body
    var subMaterial = createMaterial(0x1A1A2A, 0x002244);
    var subBody = new THREE.BoxGeometry(18, 6, 12);
    var subMesh = addMesh(subBody, subMaterial, new THREE.Vector3(-20, -23, 25));

    // Submarine nose cone
    var noseMaterial = createMaterial(0x0A0A1A);
    var noseCone = new THREE.ConeGeometry(3, 8, 16);
    addMesh(noseCone, noseMaterial, new THREE.Vector3(-29, -23, 25));

    // Propeller cylinder
    var propellerMaterial = createMaterial(0x3A3A4A);
    var propeller = new THREE.CylinderGeometry(2, 2, 1, 8);
    addMesh(propeller, propellerMaterial, new THREE.Vector3(-11, -23, 25));

    // Submarine tower/conning
    var tower = new THREE.BoxGeometry(4, 4, 3);
    addMesh(tower, subMaterial, new THREE.Vector3(-20, -20, 25));
  }

  function createDivingGear() {
    // Equipment rack structure
    var rackMaterial = createMaterial(0x5A5A6A);
    var rackFrame = new THREE.BoxGeometry(2, 15, 8);
    addMesh(rackFrame, rackMaterial, new THREE.Vector3(25, -10, -20));

    // Oxygen tanks on rack
    var tankMaterial = createMaterial(0x2A5A8A);
    var tank1 = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
    addMesh(tank1, tankMaterial, new THREE.Vector3(25, -5, -25));
    addMesh(tank1, tankMaterial, new THREE.Vector3(25, -5, -15));
    addMesh(tank1, tankMaterial, new THREE.Vector3(25, 5, -20));

    // Regulator boxes
    var regulatorMaterial = createMaterial(0x3A3A4A);
    var regulator = new THREE.BoxGeometry(2, 2, 2);
    addMesh(regulator, regulatorMaterial, new THREE.Vector3(25, -15, -20));
    addMesh(regulator, regulatorMaterial, new THREE.Vector3(25, 5, -18));
  }

  function createBioluminecentCoral() {
    // Glowing coral formations
    var coralLocations = [
      { pos: new THREE.Vector3(-35, -20, 20), col: BIOLUM_CYAN },
      { pos: new THREE.Vector3(-30, -15, -30), col: BIOLUM_PURPLE },
      { pos: new THREE.Vector3(30, -18, 10), col: BIOLUM_CYAN },
      { pos: new THREE.Vector3(35, -22, -25), col: BIOLUM_PURPLE },
      { pos: new THREE.Vector3(0, -25, -35), col: BIOLUM_CYAN }
    ];

    coralLocations.forEach(function(coral) {
      var material = createMaterial(coral.col, coral.col);

      // Base sphere
      var base = new THREE.SphereGeometry(2, 8, 8);
      var baseMesh = addMesh(base, material, coral.pos);
      biolumObjects.push(baseMesh);

      // Coral spikes
      var spike = new THREE.ConeGeometry(0.8, 4, 6);
      var spike1 = addMesh(spike, material, new THREE.Vector3(coral.pos.x + 2, coral.pos.y + 3, coral.pos.z));
      var spike2 = addMesh(spike, material, new THREE.Vector3(coral.pos.x - 2, coral.pos.y + 2, coral.pos.z + 2));
      var spike3 = addMesh(spike, material, new THREE.Vector3(coral.pos.x, coral.pos.y + 3, coral.pos.z - 2));

      biolumObjects.push(spike1);
      biolumObjects.push(spike2);
      biolumObjects.push(spike3);
    });
  }

  function createStalactites() {
    // Hanging stalactites from ceiling
    var stalactiteMaterial = createMaterial(0x1A3A4A);

    var positions = [
      new THREE.Vector3(-20, 20, -10),
      new THREE.Vector3(0, 22, 0),
      new THREE.Vector3(20, 21, 10),
      new THREE.Vector3(-15, 19, -30),
      new THREE.Vector3(15, 20, -35),
      new THREE.Vector3(25, 18, 20),
      new THREE.Vector3(-25, 19, 25)
    ];

    positions.forEach(function(pos) {
      var stalactite = new THREE.ConeGeometry(1.2, 8, 12);
      var mesh = addMesh(stalactite, stalactiteMaterial, pos);
      mesh.rotation.z = Math.PI;
    });
  }

  function createCavePools() {
    // Airlocks and pressure chambers
    var chamberMaterial = createMaterial(0x3A5A7A);
    var chamber1 = new THREE.BoxGeometry(8, 6, 8);
    addMesh(chamber1, chamberMaterial, new THREE.Vector3(-35, -22, 0));

    var chamber2 = new THREE.BoxGeometry(7, 5, 7);
    addMesh(chamber2, chamberMaterial, new THREE.Vector3(38, -24, -10));

    // Chamber doors (BoxGeometry panels)
    var doorMaterial = createMaterial(0x2A4A6A);
    var door = new THREE.BoxGeometry(3, 4, 0.5);
    addMesh(door, doorMaterial, new THREE.Vector3(-35, -20, -4.5));
    addMesh(door, doorMaterial, new THREE.Vector3(38, -22, -4.5));
  }

  function createSmuggledCargo() {
    // Cargo crates stacked
    var crateMaterial = createMaterial(0x5A4A2A);

    // Bottom row
    var crate1 = new THREE.BoxGeometry(6, 4, 6);
    addMesh(crate1, crateMaterial, new THREE.Vector3(-10, -25, 30));

    var crate2 = new THREE.BoxGeometry(5, 4, 6);
    addMesh(crate2, crateMaterial, new THREE.Vector3(0, -25, 30));

    var crate3 = new THREE.BoxGeometry(6, 4, 5);
    addMesh(crate3, crateMaterial, new THREE.Vector3(10, -25, 32));

    // Middle row
    var crate4 = new THREE.BoxGeometry(5, 3, 5);
    addMesh(crate4, crateMaterial, new THREE.Vector3(-8, -21, 30));

    var crate5 = new THREE.BoxGeometry(5, 3, 5);
    addMesh(crate5, crateMaterial, new THREE.Vector3(2, -21, 32));
  }

  function createCommunicationBuoy() {
    // Communication buoy with antenna
    var buoyMaterial = createMaterial(0xFFAA00, 0xFFAA00);
    var buoy = new THREE.SphereGeometry(3, 16, 12);
    var buoyMesh = addMesh(buoy, buoyMaterial, new THREE.Vector3(0, 10, -10));
    biolumObjects.push(buoyMesh);

    // Antenna
    var antennaMaterial = createMaterial(0xCCCCCC);
    var antenna = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
    addMesh(antenna, antennaMaterial, new THREE.Vector3(0, 14, -10));

    // Antenna top
    var tip = new THREE.SphereGeometry(0.5, 8, 8);
    addMesh(tip, antennaMaterial, new THREE.Vector3(0, 18, -10));
  }

  function createCavefish() {
    // Small glowing bioluminescent fish
    var fishMaterial = createMaterial(0x00FF88, 0x00FF88);

    var fishPositions = [
      new THREE.Vector3(-20, -10, 10),
      new THREE.Vector3(-10, -5, -20),
      new THREE.Vector3(20, -12, 15),
      new THREE.Vector3(15, -8, -25),
      new THREE.Vector3(-25, -15, 0),
      new THREE.Vector3(25, -10, 25)
    ];

    fishPositions.forEach(function(pos) {
      var body = new THREE.SphereGeometry(0.8, 6, 6);
      var fishMesh = addMesh(body, fishMaterial, pos);
      fishSchool.push({
        mesh: fishMesh,
        basePos: pos.clone(),
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4
      });

      // Tail fin
      var tail = new THREE.ConeGeometry(0.4, 1.2, 6);
      addMesh(tail, fishMaterial, new THREE.Vector3(pos.x - 1, pos.y, pos.z));
    });
  }

  function createRopeGuides() {
    // Guide ropes through cave passages
    var ropePositions = [];
    var ropeGeometry = new THREE.BufferGeometry();

    // Route 1: Entry to air pocket
    ropePositions.push(0, -20, -40);
    ropePositions.push(0, 10, -20);
    ropePositions.push(0, 25, 0);

    // Route 2: Air pocket to sub pen
    ropePositions.push(0, 25, 0);
    ropePositions.push(-15, 10, 20);
    ropePositions.push(-20, -20, 25);

    // Route 3: Cargo area route
    ropePositions.push(-20, -20, 25);
    ropePositions.push(0, -25, 30);
    ropePositions.push(10, -25, 32);

    // Route 4: Exit tunnel
    ropePositions.push(10, -25, 32);
    ropePositions.push(20, -20, 38);
    ropePositions.push(30, -10, 40);

    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePositions), 3));
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    scene.add(rope);
    meshes.push(rope);
  }

  function createUnderwaterScooters() {
    // Diver scooters
    var scooterMaterial = createMaterial(0x2A6A8A);
    var propMaterial = createMaterial(0x3A4A5A);

    // Scooter 1
    var body1 = new THREE.BoxGeometry(4, 1.5, 2);
    addMesh(body1, scooterMaterial, new THREE.Vector3(-30, -15, 5));

    var prop1 = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 12);
    addMesh(prop1, propMaterial, new THREE.Vector3(-26, -15, 5));

    // Scooter 2
    var body2 = new THREE.BoxGeometry(4, 1.5, 2);
    addMesh(body2, scooterMaterial, new THREE.Vector3(35, -12, -15));

    var prop2 = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 12);
    addMesh(prop2, propMaterial, new THREE.Vector3(39, -12, -15));
  }

  function createEmergencyBeacon() {
    // Pulsing emergency beacon
    var beaconMaterial = createMaterial(0xFF0000, 0xFF0000);
    var beacon = new THREE.SphereGeometry(1.5, 12, 8);
    var beaconMesh = addMesh(beacon, beaconMaterial, new THREE.Vector3(0, -28, -35));
    biolumObjects.push(beaconMesh);
  }

  function createBubbleStreams() {
    // Rising bubble particles
    var bubbleMaterial = createMaterial(0x88CCFF, 0x88CCFF, true);

    var streamLocations = [
      { x: -20, z: 10 },
      { x: 20, z: -20 },
      { x: 0, z: 25 },
      { x: 30, z: 0 }
    ];

    streamLocations.forEach(function(loc) {
      for (var i = 0; i < 5; i++) {
        var bubble = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 6);
        var bubbleMesh = addMesh(bubble, bubbleMaterial, new THREE.Vector3(loc.x + (Math.random() - 0.5) * 2, -25 + i * 2, loc.z + (Math.random() - 0.5) * 2));
        bubbleParticles.push({
          mesh: bubbleMesh,
          startY: bubbleMesh.position.y,
          vx: (Math.random() - 0.5) * 0.1,
          vy: 0.08 + Math.random() * 0.04
        });
      }
    });
  }

  function createSpawnPoints() {
    // Cave entrance
    spawnPoints.push(new THREE.Vector3(0, -20, 40));

    // Air pocket
    spawnPoints.push(new THREE.Vector3(0, 20, -20));

    // Submarine pen
    spawnPoints.push(new THREE.Vector3(-20, -20, 25));

    // Cargo area
    spawnPoints.push(new THREE.Vector3(0, -25, 30));

    // Exit tunnel
    spawnPoints.push(new THREE.Vector3(30, -15, 40));
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    spawnPoints = [];
    biolumObjects = [];
    fishSchool = [];
    bubbleParticles = [];
    stalactiteDrips = [];
    time = 0;
    dripCooldown = 0;
    beaconFlash = 0;

    // Build the complete underwater cave environment
    createCavern();
    createAirPocket();
    createWaterZone();
    createSubmarinePen();
    createDivingGear();
    createBioluminecentCoral();
    createStalactites();
    createCavePools();
    createSmuggledCargo();
    createCommunicationBuoy();
    createCavefish();
    createRopeGuides();
    createUnderwaterScooters();
    createEmergencyBeacon();
    createBubbleStreams();
    createSpawnPoints();

    // Add ambient and bioluminescent lights
    var ambientLight = new THREE.AmbientLight(0x1A3A4A, 0.3);
    scene.add(ambientLight);

    // Bioluminescent point lights
    var bioLight1 = new THREE.PointLight(BIOLUM_CYAN, 1.5, 40);
    bioLight1.position.set(-35, -20, 20);
    scene.add(bioLight1);

    var bioLight2 = new THREE.PointLight(BIOLUM_PURPLE, 1.5, 40);
    bioLight2.position.set(30, -18, 10);
    scene.add(bioLight2);

    var bioLight3 = new THREE.PointLight(0x00FF88, 1, 30);
    bioLight3.position.set(0, 10, -10);
    scene.add(bioLight3);

    // Emergency beacon light
    var beaconLight = new THREE.PointLight(0xFF0000, 0.5, 30);
    beaconLight.position.set(0, -28, -35);
    scene.add(beaconLight);
  }

  function update(delta) {
    time += delta;
    dripCooldown -= delta;
    beaconFlash -= delta;

    // Bioluminescent glow pulsing in waves
    biolumObjects.forEach(function(obj) {
      var pulse = Math.sin(time * 2 + obj.position.x * 0.05) * 0.5 + 0.5;
      obj.material.emissiveIntensity = 0.3 + pulse * 0.4;
    });

    // Cave fish darting through corridors
    fishSchool.forEach(function(fish) {
      fish.angle += fish.speed * delta;
      fish.mesh.position.x = fish.basePos.x + Math.cos(fish.angle) * 8;
      fish.mesh.position.z = fish.basePos.z + Math.sin(fish.angle) * 8;
      fish.mesh.position.y = fish.basePos.y + Math.sin(time * 2 + fish.angle) * 2;
    });

    // Stalactite drips falling
    if (dripCooldown <= 0) {
      var dripGeometry = new THREE.SphereGeometry(0.15, 6, 6);
      var dripMaterial = createMaterial(0x0A3A5A);
      var randomStalk = Math.floor(Math.random() * 7);
      var dripPositions = [
        new THREE.Vector3(-20, 12, -10),
        new THREE.Vector3(0, 14, 0),
        new THREE.Vector3(20, 13, 10),
        new THREE.Vector3(-15, 11, -30),
        new THREE.Vector3(15, 12, -35),
        new THREE.Vector3(25, 10, 20),
        new THREE.Vector3(-25, 11, 25)
      ];
      var dripPos = dripPositions[randomStalk].clone();
      var drip = addMesh(dripGeometry, dripMaterial, dripPos);
      stalactiteDrips.push({
        mesh: drip,
        startY: drip.position.y,
        vy: 5
      });
      dripCooldown = 2 + Math.random() * 2;
    }

    // Update falling drips
    for (var i = stalactiteDrips.length - 1; i >= 0; i--) {
      var drip = stalactiteDrips[i];
      drip.mesh.position.y -= drip.vy * delta;
      if (drip.mesh.position.y < -30) {
        scene.remove(drip.mesh);
        var meshIndex = meshes.indexOf(drip.mesh);
        if (meshIndex > -1) meshes.splice(meshIndex, 1);
        stalactiteDrips.splice(i, 1);
      }
    }

    // Water current turbulence effect
    meshes.forEach(function(mesh) {
      if (mesh.material && mesh.material.color && mesh.material.color.getHex() === OCEAN_BLUE) {
        mesh.position.y += Math.sin(time * 0.5) * 0.02;
        mesh.position.x += Math.sin(time * 0.3 + mesh.position.z * 0.01) * 0.02;
      }
    });

    // Submarine pen pressure venting (propeller rotation)
    meshes.forEach(function(mesh) {
      if (mesh.geometry && mesh.geometry.type === 'CylinderGeometry' && mesh.position.x > -15 && mesh.position.x < -10) {
        mesh.rotation.z += delta * 3;
      }
    });

    // Emergency beacon flashing
    beaconFlash += delta;
    var beaconPulse = Math.sin(time * 5) > 0 ? 1 : 0;
    var beaconIntensity = beaconPulse * 0.8;

    // Air bubble streams rising
    bubbleParticles.forEach(function(bubble) {
      bubble.mesh.position.y += bubble.vy;
      bubble.mesh.position.x += bubble.vx;
      bubble.mesh.scale.x = Math.max(0.1, bubble.mesh.scale.x - delta * 0.2);
      bubble.mesh.scale.y = bubble.mesh.scale.x;
      bubble.mesh.scale.z = bubble.mesh.scale.x;
      if (bubble.mesh.position.y > 15) {
        bubble.mesh.scale.set(0.01, 0.01, 0.01);
      }
    });

    // Cargo net swaying (rope guide animation)
    // Rope positions can oscillate slightly via vertex position offset in renderer
    time += delta * 0.001;
  }

  function reset() {
    // Clear all meshes from scene
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(function(m) { m.dispose(); });
        } else {
          mesh.material.dispose();
        }
      }
    });

    // Clear arrays
    meshes = [];
    spawnPoints = [];
    biolumObjects = [];
    fishSchool = [];
    bubbleParticles = [];
    stalactiteDrips = [];
    time = 0;
    dripCooldown = 0;
    beaconFlash = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getMeshes: function() { return meshes; }
  };
}());
