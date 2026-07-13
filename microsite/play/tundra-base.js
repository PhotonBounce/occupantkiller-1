window.TundraBase = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var particles = [];
  var animatedObjects = [];
  var terrainBlocks = [];

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    particles = [];
    animatedObjects = [];
    terrainBlocks = [];

    // Frozen ground surface with snow drifts
    createTerrain();

    // Main operations building
    createOperationsBuilding();

    // Cryo-storage vaults
    createCryoVaults();

    // Guard towers
    createGuardTowers();

    // Frozen vehicles
    createFrozenVehicles();

    // Ice formations
    createIceFormations();

    // Supply depot warehouse
    createSupplyDepot();

    // Heating unit exhausts
    createHeatingExhausts();

    // Wire barriers and fence
    createWireBarriers();

    // Frozen puddle/lake
    createFrozenLake();

    // Blizzard particles
    createBlizzardParticles();
  };

  var createTerrain = function() {
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f8ff,
      roughness: 0.8,
      metalness: 0.1
    });

    var snowDriftMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffafa,
      roughness: 0.9,
      metalness: 0.0
    });

    // Main base platform
    var baseGeom = new THREE.BoxGeometry(500, 15, 500);
    var baseMesh = new THREE.Mesh(baseGeom, groundMaterial);
    baseMesh.position.y = -15;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);
    terrainBlocks.push(baseMesh);

    // Snow drifts around perimeter
    var driftPositions = [
      { x: 220, z: 220 },
      { x: -220, z: 220 },
      { x: 220, z: -220 },
      { x: -220, z: -220 },
      { x: 250, z: 0 },
      { x: -250, z: 0 },
      { x: 0, z: 250 },
      { x: 0, z: -250 }
    ];

    driftPositions.forEach(function(pos) {
      var driftGeom = new THREE.BoxGeometry(60, 25, 80);
      var driftMesh = new THREE.Mesh(driftGeom, snowDriftMaterial);
      driftMesh.position.set(pos.x, -5, pos.z);
      driftMesh.rotation.z = Math.random() * 0.3;
      driftMesh.castShadow = true;
      driftMesh.receiveShadow = true;
      scene.add(driftMesh);
      terrainBlocks.push(driftMesh);
    });
  };

  var createOperationsBuilding = function() {
    var outerWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.7,
      metalness: 0.3
    });

    var innerWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 0.6,
      metalness: 0.2
    });

    // Outer insulated wall
    var outerGeom = new THREE.BoxGeometry(120, 80, 100);
    var outerMesh = new THREE.Mesh(outerGeom, outerWallMaterial);
    outerMesh.position.set(0, 40, 0);
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    scene.add(outerMesh);

    // Inner reinforced wall (double layer)
    var innerGeom = new THREE.BoxGeometry(110, 70, 90);
    var innerMesh = new THREE.Mesh(innerGeom, innerWallMaterial);
    innerMesh.position.set(0, 45, 0);
    innerMesh.castShadow = true;
    innerMesh.receiveShadow = true;
    scene.add(innerMesh);

    // Roof structure
    var roofGeom = new THREE.BoxGeometry(125, 8, 105);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030,
      roughness: 0.5,
      metalness: 0.6
    });
    var roofMesh = new THREE.Mesh(roofGeom, roofMaterial);
    roofMesh.position.set(0, 85, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    scene.add(roofMesh);

    // Windows
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a52,
      roughness: 0.1,
      metalness: 0.8
    });

    var windowPositions = [
      { x: -40, z: -48 },
      { x: 40, z: -48 },
      { x: -40, z: 48 },
      { x: 40, z: 48 }
    ];

    windowPositions.forEach(function(pos) {
      var windowGeom = new THREE.BoxGeometry(15, 15, 2);
      var windowMesh = new THREE.Mesh(windowGeom, windowMaterial);
      windowMesh.position.set(pos.x, 50, pos.z);
      windowMesh.castShadow = true;
      scene.add(windowMesh);
    });
  };

  var createCryoVaults = function() {
    var vaultMaterial = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      roughness: 0.4,
      metalness: 0.7
    });

    var vaultPositions = [
      { x: -150, z: -120 },
      { x: -150, z: 120 },
      { x: 150, z: -120 },
      { x: 150, z: 120 }
    ];

    vaultPositions.forEach(function(pos) {
      // Cylindrical vault structure
      var vaultGeom = new THREE.CylinderGeometry(35, 35, 60, 16);
      var vaultMesh = new THREE.Mesh(vaultGeom, vaultMaterial);
      vaultMesh.position.set(pos.x, 20, pos.z);
      vaultMesh.castShadow = true;
      vaultMesh.receiveShadow = true;
      scene.add(vaultMesh);
      animatedObjects.push({ mesh: vaultMesh, type: 'vault' });

      // Dome top
      var domeGeom = new THREE.SphereGeometry(35, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      var domeMesh = new THREE.Mesh(domeGeom, vaultMaterial);
      domeMesh.position.set(pos.x, 50, pos.z);
      domeMesh.castShadow = true;
      domeMesh.receiveShadow = true;
      scene.add(domeMesh);

      // Frost effect around vault
      var frostGeom = new THREE.CylinderGeometry(40, 40, 5, 16);
      var frostMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.0
      });
      var frostMesh = new THREE.Mesh(frostGeom, frostMaterial);
      frostMesh.position.set(pos.x, 3, pos.z);
      frostMesh.castShadow = true;
      scene.add(frostMesh);
    });
  };

  var createGuardTowers = function() {
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.6,
      metalness: 0.4
    });

    var towerPositions = [
      { x: -200, z: -180 },
      { x: 200, z: -180 },
      { x: -200, z: 180 },
      { x: 200, z: 180 }
    ];

    towerPositions.forEach(function(pos) {
      // Tower base
      var baseGeom = new THREE.BoxGeometry(25, 70, 25);
      var baseMesh = new THREE.Mesh(baseGeom, towerMaterial);
      baseMesh.position.set(pos.x, 35, pos.z);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      scene.add(baseMesh);

      // Observation platform
      var platformGeom = new THREE.BoxGeometry(40, 4, 40);
      var platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        roughness: 0.5,
        metalness: 0.5
      });
      var platformMesh = new THREE.Mesh(platformGeom, platformMaterial);
      platformMesh.position.set(pos.x, 72, pos.z);
      platformMesh.castShadow = true;
      platformMesh.receiveShadow = true;
      scene.add(platformMesh);

      // Searchlight sphere
      var searchlightGeom = new THREE.SphereGeometry(8, 16, 12);
      var searchlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        roughness: 0.3,
        metalness: 0.9
      });
      var searchlightMesh = new THREE.Mesh(searchlightGeom, searchlightMaterial);
      searchlightMesh.position.set(pos.x, 78, pos.z);
      searchlightMesh.castShadow = true;
      scene.add(searchlightMesh);
      animatedObjects.push({
        mesh: searchlightMesh,
        type: 'searchlight',
        centerX: pos.x,
        centerZ: pos.z,
        angle: Math.random() * Math.PI * 2
      });
    });
  };

  var createFrozenVehicles = function() {
    var vehicleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.7,
      metalness: 0.4
    });

    // Truck 1
    var truck1BodyGeom = new THREE.BoxGeometry(15, 10, 35);
    var truck1Body = new THREE.Mesh(truck1BodyGeom, vehicleMaterial);
    truck1Body.position.set(-100, 5, -80);
    truck1Body.castShadow = true;
    truck1Body.receiveShadow = true;
    scene.add(truck1Body);

    // Truck 1 cabin
    var truck1CabinGeom = new THREE.BoxGeometry(12, 12, 12);
    var truck1Cabin = new THREE.Mesh(truck1CabinGeom, vehicleMaterial);
    truck1Cabin.position.set(-100, 12, -70);
    truck1Cabin.castShadow = true;
    scene.add(truck1Cabin);

    // Snowmobile
    var snowmobileBodyGeom = new THREE.BoxGeometry(8, 6, 25);
    var snowmobileBody = new THREE.Mesh(snowmobileBodyGeom, vehicleMaterial);
    snowmobileBody.position.set(120, 3, -100);
    snowmobileBody.castShadow = true;
    snowmobileBody.receiveShadow = true;
    scene.add(snowmobileBody);

    // Snowmobile seat
    var seatGeom = new THREE.BoxGeometry(8, 4, 8);
    var seatMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.2
    });
    var seat = new THREE.Mesh(seatGeom, seatMaterial);
    seat.position.set(120, 8, -95);
    seat.castShadow = true;
    scene.add(seat);

    // Half-buried snow on vehicles
    var snowDriftMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffafa,
      roughness: 0.9
    });

    var truck1DriftGeom = new THREE.BoxGeometry(18, 12, 40);
    var truck1Drift = new THREE.Mesh(truck1DriftGeom, snowDriftMaterial);
    truck1Drift.position.set(-100, -4, -80);
    truck1Drift.castShadow = true;
    scene.add(truck1Drift);

    var snowmobileDriftGeom = new THREE.BoxGeometry(10, 8, 28);
    var snowmobileDrift = new THREE.Mesh(snowmobileDriftGeom, snowDriftMaterial);
    snowmobileDrift.position.set(120, -3, -100);
    snowmobileDrift.castShadow = true;
    scene.add(snowmobileDrift);
  };

  var createIceFormations = function() {
    var iceSpikeMaterial = new THREE.MeshStandardMaterial({
      color: 0xcfe8f3,
      roughness: 0.3,
      metalness: 0.6
    });

    var perimeter = [
      { x: -270, z: -270 },
      { x: -270, z: 0 },
      { x: -270, z: 270 },
      { x: 0, z: -270 },
      { x: 0, z: 270 },
      { x: 270, z: -270 },
      { x: 270, z: 0 },
      { x: 270, z: 270 }
    ];

    perimeter.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        var offsetX = (Math.random() - 0.5) * 40;
        var offsetZ = (Math.random() - 0.5) * 40;
        var height = 30 + Math.random() * 40;

        var spikeGeom = new THREE.ConeGeometry(5 + Math.random() * 5, height, 8);
        var spikeMesh = new THREE.Mesh(spikeGeom, iceSpikeMaterial);
        spikeMesh.position.set(pos.x + offsetX, height * 0.5, pos.z + offsetZ);
        spikeMesh.rotation.x = (Math.random() - 0.5) * 0.4;
        spikeMesh.rotation.z = (Math.random() - 0.5) * 0.4;
        spikeMesh.castShadow = true;
        spikeMesh.receiveShadow = true;
        scene.add(spikeMesh);
      }
    });
  };

  var createSupplyDepot = function() {
    var warehouseMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a5a,
      roughness: 0.7,
      metalness: 0.3
    });

    // Main warehouse structure
    var warehouseGeom = new THREE.BoxGeometry(100, 50, 140);
    var warehouseMesh = new THREE.Mesh(warehouseGeom, warehouseMaterial);
    warehouseMesh.position.set(-180, 25, 0);
    warehouseMesh.castShadow = true;
    warehouseMesh.receiveShadow = true;
    scene.add(warehouseMesh);

    // Roof
    var roofGeom = new THREE.BoxGeometry(105, 6, 145);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.5,
      metalness: 0.6
    });
    var roofMesh = new THREE.Mesh(roofGeom, roofMaterial);
    roofMesh.position.set(-180, 54, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    scene.add(roofMesh);

    // Icicles hanging from eaves
    var icicleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd0e8f0,
      roughness: 0.2,
      metalness: 0.8
    });

    var eavePositions = [
      { x: -230, z: -70 },
      { x: -230, z: -35 },
      { x: -230, z: 0 },
      { x: -230, z: 35 },
      { x: -230, z: 70 },
      { x: -130, z: -70 },
      { x: -130, z: -35 },
      { x: -130, z: 0 },
      { x: -130, z: 35 },
      { x: -130, z: 70 }
    ];

    eavePositions.forEach(function(pos) {
      var icicleGeom = new THREE.ConeGeometry(2, 15, 6);
      var icicleMesh = new THREE.Mesh(icicleGeom, icicleMaterial);
      icicleMesh.position.set(pos.x, 48, pos.z);
      icicleMesh.castShadow = true;
      scene.add(icicleMesh);
    });

    // Loading bay doors
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.5
    });

    var doorGeom = new THREE.BoxGeometry(30, 35, 2);
    var door1 = new THREE.Mesh(doorGeom, doorMaterial);
    door1.position.set(-180, 28, -70);
    door1.castShadow = true;
    scene.add(door1);

    var door2 = new THREE.Mesh(doorGeom, doorMaterial);
    door2.position.set(-180, 28, 70);
    door2.castShadow = true;
    scene.add(door2);
  };

  var createHeatingExhausts = function() {
    var exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.6,
      metalness: 0.5
    });

    var exhaustPositions = [
      { x: -30, z: -45 },
      { x: 30, z: -45 },
      { x: -30, z: 45 },
      { x: 30, z: 45 }
    ];

    exhaustPositions.forEach(function(pos) {
      // Stack cylinder
      var stackGeom = new THREE.CylinderGeometry(8, 8, 35, 12);
      var stackMesh = new THREE.Mesh(stackGeom, exhaustMaterial);
      stackMesh.position.set(pos.x, 42, pos.z);
      stackMesh.castShadow = true;
      stackMesh.receiveShadow = true;
      scene.add(stackMesh);

      // Cap
      var capGeom = new THREE.CylinderGeometry(9, 8, 3, 12);
      var capMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        roughness: 0.5,
        metalness: 0.6
      });
      var capMesh = new THREE.Mesh(capGeom, capMaterial);
      capMesh.position.set(pos.x, 60, pos.z);
      capMesh.castShadow = true;
      scene.add(capMesh);

      // Exhaust puffs (particle spheres)
      for (var i = 0; i < 4; i++) {
        var puffGeom = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
        var puffMaterial = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          roughness: 0.8,
          metalness: 0.1,
          transparent: true,
          opacity: 0.5
        });
        var puffMesh = new THREE.Mesh(puffGeom, puffMaterial);
        puffMesh.position.set(pos.x, 65 + i * 5, pos.z);
        puffMesh.castShadow = true;
        scene.add(puffMesh);
        animatedObjects.push({
          mesh: puffMesh,
          type: 'exhaust',
          startY: puffMesh.position.y,
          speed: 15 + Math.random() * 10
        });
      }
    });
  };

  var createWireBarriers = function() {
    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0x4a4a4a,
      linewidth: 2
    });

    // Create perimeter fence using LineSegments
    var fencePoints = [];
    var corners = [
      new THREE.Vector3(-250, 10, -250),
      new THREE.Vector3(250, 10, -250),
      new THREE.Vector3(250, 10, 250),
      new THREE.Vector3(-250, 10, 250),
      new THREE.Vector3(-250, 10, -250)
    ];

    for (var i = 0; i < corners.length - 1; i++) {
      fencePoints.push(corners[i]);
      fencePoints.push(corners[i + 1]);
    }

    var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
    var fence = new THREE.LineSegments(fenceGeometry, lineMaterial);
    scene.add(fence);

    // Vertical posts for fence
    for (var j = 0; j < 20; j++) {
      var postPoints = [];
      var postX = -250 + j * 25;
      postPoints.push(new THREE.Vector3(postX, 0, -250));
      postPoints.push(new THREE.Vector3(postX, 25, -250));
      postPoints.push(new THREE.Vector3(postX, 0, 250));
      postPoints.push(new THREE.Vector3(postX, 25, 250));

      var postGeometry = new THREE.BufferGeometry().setFromPoints(postPoints);
      var posts = new THREE.LineSegments(postGeometry, lineMaterial);
      scene.add(posts);
    }

    // Barbed wire diagonal segments
    var wirePoints = [];
    for (var k = 0; k < 10; k++) {
      var wireX = -250 + k * 50;
      wirePoints.push(new THREE.Vector3(wireX, 15, -250));
      wirePoints.push(new THREE.Vector3(wireX + 25, 20, -250));
      wirePoints.push(new THREE.Vector3(wireX, 15, 250));
      wirePoints.push(new THREE.Vector3(wireX + 25, 20, 250));
    }

    var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var barbed = new THREE.LineSegments(wireGeometry, lineMaterial);
    scene.add(barbed);
  };

  var createFrozenLake = function() {
    var iceSheetMaterial = new THREE.MeshStandardMaterial({
      color: 0x4da6cc,
      roughness: 0.3,
      metalness: 0.7
    });

    // Main ice sheet
    var lakeGeom = new THREE.BoxGeometry(180, 2, 180);
    var lakeMesh = new THREE.Mesh(lakeGeom, iceSheetMaterial);
    lakeMesh.position.set(160, -5, -160);
    lakeMesh.castShadow = true;
    lakeMesh.receiveShadow = true;
    scene.add(lakeMesh);

    // Ice cracks using LineSegments
    var crackMaterial = new THREE.LineBasicMaterial({
      color: 0x0d47a1,
      linewidth: 1
    });

    var crackPoints = [];
    for (var i = 0; i < 15; i++) {
      var startX = 160 + (Math.random() - 0.5) * 160;
      var startZ = -160 + (Math.random() - 0.5) * 160;
      var endX = startX + (Math.random() - 0.5) * 80;
      var endZ = startZ + (Math.random() - 0.5) * 80;

      crackPoints.push(new THREE.Vector3(startX, -4, startZ));
      crackPoints.push(new THREE.Vector3(endX, -4, endZ));
    }

    var crackGeometry = new THREE.BufferGeometry().setFromPoints(crackPoints);
    var cracks = new THREE.LineSegments(crackGeometry, crackMaterial);
    scene.add(cracks);
  };

  var createBlizzardParticles = function() {
    var particleMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.7
    });

    var particleCount = 400;
    for (var i = 0; i < particleCount; i++) {
      var snowflakeGeom = new THREE.SphereGeometry(
        0.5 + Math.random() * 1.5,
        4,
        4
      );
      var snowflakeMesh = new THREE.Mesh(snowflakeGeom, particleMaterial);

      snowflakeMesh.position.x = (Math.random() - 0.5) * 600;
      snowflakeMesh.position.y = Math.random() * 300 - 50;
      snowflakeMesh.position.z = (Math.random() - 0.5) * 600;

      scene.add(snowflakeMesh);
      particles.push({
        mesh: snowflakeMesh,
        vx: (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 10,
        vz: (Math.random() - 0.5) * 20,
        life: 1.0,
        maxLife: 1.0
      });
    }
  };

  var update = function(delta) {
    // Update blizzard particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var particle = particles[i];
      particle.mesh.position.x += particle.vx * delta;
      particle.mesh.position.y += particle.vy * delta;
      particle.mesh.position.z += particle.vz * delta;

      // Fade out as life decreases
      particle.life -= delta * 0.3;
      particle.mesh.material.opacity = 0.7 * (particle.life / particle.maxLife);

      // Swirling motion
      particle.vx += Math.sin(particle.mesh.position.y * 0.01) * delta * 5;
      particle.vz += Math.cos(particle.mesh.position.y * 0.01) * delta * 5;

      // Respawn at top when particle dies or goes too low
      if (particle.mesh.position.y < -100 || particle.life <= 0) {
        particle.mesh.position.x = (Math.random() - 0.5) * 600;
        particle.mesh.position.y = 250;
        particle.mesh.position.z = (Math.random() - 0.5) * 600;
        particle.life = 1.0;
      }
    }

    // Update animated objects
    for (var j = 0; j < animatedObjects.length; j++) {
      var obj = animatedObjects[j];

      if (obj.type === 'searchlight') {
        // Rotate searchlight in circles
        obj.angle += delta * 0.5;
        obj.mesh.position.x = obj.centerX + Math.cos(obj.angle) * 15;
        obj.mesh.position.z = obj.centerZ + Math.sin(obj.angle) * 15;
      } else if (obj.type === 'exhaust') {
        // Float upward and fade
        obj.mesh.position.y += obj.speed * delta;
        obj.mesh.material.opacity = Math.max(0, 0.5 - (obj.mesh.position.y - obj.startY) / 30);

        // Respawn if too high
        if (obj.mesh.position.y > obj.startY + 30) {
          obj.mesh.position.y = obj.startY;
        }
      } else if (obj.type === 'vault') {
        // Subtle rotation
        obj.mesh.rotation.y += delta * 0.1;
      }
    }
  };

  var reset = function() {
    if (scene) {
      // Clear all particles
      particles.forEach(function(p) {
        scene.remove(p.mesh);
      });
      particles = [];

      // Clear all animated objects
      animatedObjects.forEach(function(obj) {
        scene.remove(obj.mesh);
      });
      animatedObjects = [];

      // Clear terrain
      terrainBlocks.forEach(function(block) {
        scene.remove(block);
      });
      terrainBlocks = [];

      // Remove all scene children for complete reset
      var toRemove = [];
      scene.traverse(function(child) {
        if (child !== scene) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(function(child) {
        scene.remove(child);
      });
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
