window.DesertOutpost = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var spawnPoints = [];
  var mirageObjects = [];
  var animationTime = 0;

  // Desert color palette
  var SAND_COLOR = 0xC2A05A;
  var DARK_SAND_COLOR = 0xA68C4A;
  var CONCRETE_GRAY = 0x808080;
  var LIGHT_GRAY = 0x999999;
  var RUSTY_ORANGE = 0xC85A17;
  var KHAKI_GREEN = 0x8B8B47;
  var DARK_BROWN = 0x654321;
  var BLACK = 0x000000;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    spawnPoints = [];
    mirageObjects = [];
    animationTime = 0;

    // Set scene background to desert sky
    scene.background = new THREE.Color(0xE8D4B8);
    scene.fog = new THREE.Fog(0xE8D4B8, 300, 500);

    // Create sand dune berms (stacked mounds using BoxGeometry)
    createSandDunes();

    // Create hardened concrete bunkers
    createBunkers();

    // Create sandbag walls
    createSandbagWalls();

    // Create watchtowers
    createWatchtowers();

    // Create anti-tank ditch
    createAntiTankDitch();

    // Create barbed wire barriers (LineSegments)
    createBarbedWire();

    // Create generator shelter
    createGeneratorShelter();

    // Create water supply tank (CylinderGeometry)
    createWaterTank();

    // Create communications mast
    createCommunicationsMast();

    // Create vehicle wrecks
    createVehicleWrecks();

    // Create ammo cache crates
    createAmmoCrates();

    // Create mirage shimmer effects
    createMirageEffects();

    // Create sun heat shimmer ground effects
    createHeatShimmer();

    // Define spawn points at outpost entry points and dune positions
    spawnPoints = [
      { x: -40, y: 0, z: 60 },
      { x: 40, y: 0, z: 60 },
      { x: -50, y: 0, z: 0 },
      { x: 50, y: 0, z: 0 },
      { x: 0, y: 0, z: -60 }
    ];

    console.log('Desert Outpost initialized with', objects.length, 'objects and', spawnPoints.length, 'spawn points');
  }

  function createSandDunes() {
    // Large sand dune berms - stacked mounds
    var dunePositions = [
      { x: -60, y: 0, z: -80 },
      { x: 60, y: 0, z: -80 },
      { x: -80, y: 0, z: 0 },
      { x: 80, y: 0, z: 0 },
      { x: 0, y: 0, z: -100 }
    ];

    dunePositions.forEach(function(pos) {
      // Base dune mound
      var duneGeom = new THREE.BoxGeometry(50, 25, 40);
      var duneMat = new THREE.MeshStandardMaterial({
        color: SAND_COLOR,
        roughness: 0.8,
        metalness: 0
      });
      var dune = new THREE.Mesh(duneGeom, duneMat);
      dune.position.set(pos.x, 12, pos.z);
      dune.castShadow = true;
      dune.receiveShadow = true;
      scene.add(dune);
      objects.push(dune);

      // Second layer smaller dune
      var dune2Geom = new THREE.BoxGeometry(35, 15, 30);
      var dune2Mat = new THREE.MeshStandardMaterial({
        color: DARK_SAND_COLOR,
        roughness: 0.85,
        metalness: 0
      });
      var dune2 = new THREE.Mesh(dune2Geom, dune2Mat);
      dune2.position.set(pos.x + 8, 25, pos.z + 5);
      dune2.rotation.z = 0.2;
      dune2.castShadow = true;
      dune2.receiveShadow = true;
      scene.add(dune2);
      objects.push(dune2);
    });
  }

  function createBunkers() {
    // Concrete bunker positions
    var bunkerPositions = [
      { x: 0, y: 0, z: 0 },
      { x: -30, y: 0, z: 25 },
      { x: 30, y: 0, z: 25 },
      { x: -25, y: 0, z: -30 },
      { x: 25, y: 0, z: -30 }
    ];

    bunkerPositions.forEach(function(pos) {
      // Main bunker box - thick walls
      var bunkerGeom = new THREE.BoxGeometry(25, 12, 30);
      var bunkerMat = new THREE.MeshStandardMaterial({
        color: CONCRETE_GRAY,
        roughness: 0.7,
        metalness: 0.1
      });
      var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
      bunker.position.set(pos.x, 6, pos.z);
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      scene.add(bunker);
      objects.push(bunker);

      // Roof reinforcement - darker concrete
      var roofGeom = new THREE.BoxGeometry(28, 2, 32);
      var roofMat = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.7,
        metalness: 0.05
      });
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(pos.x, 12.5, pos.z);
      roof.castShadow = true;
      roof.receiveShadow = true;
      scene.add(roof);
      objects.push(roof);

      // Gun port opening - dark interior
      var portGeom = new THREE.BoxGeometry(4, 3, 2);
      var portMat = new THREE.MeshStandardMaterial({
        color: BLACK,
        roughness: 0.9,
        metalness: 0
      });
      var port = new THREE.Mesh(portGeom, portMat);
      port.position.set(pos.x, 8, pos.z + 15.5);
      port.castShadow = true;
      port.receiveShadow = true;
      scene.add(port);
      objects.push(port);
    });
  }

  function createSandbagWalls() {
    // Sandbag wall sections using stacked small BoxGeometry
    var wallSegments = [
      { startX: -20, startZ: 40, endX: 20, endZ: 40, count: 8 },
      { startX: -45, startZ: 20, endX: -45, endZ: -20, count: 8 },
      { startX: 45, startZ: 20, endX: 45, endZ: -20, count: 8 },
      { startX: -30, startZ: -45, endX: 30, endZ: -45, count: 12 }
    ];

    wallSegments.forEach(function(segment) {
      for (var i = 0; i < segment.count; i++) {
        var t = i / segment.count;
        var x = segment.startX + (segment.endX - segment.startX) * t;
        var z = segment.startZ + (segment.endZ - segment.startZ) * t;

        // Individual sandbag
        var bagGeom = new THREE.BoxGeometry(3, 2, 3);
        var bagMat = new THREE.MeshStandardMaterial({
          color: KHAKI_GREEN,
          roughness: 0.85,
          metalness: 0
        });
        var bag = new THREE.Mesh(bagGeom, bagMat);
        bag.position.set(x, 1, z);
        bag.castShadow = true;
        bag.receiveShadow = true;
        scene.add(bag);
        objects.push(bag);

        // Second layer sandbag
        var bag2Geom = new THREE.BoxGeometry(3, 2, 3);
        var bag2 = new THREE.Mesh(bag2Geom, bagMat);
        bag2.position.set(x + 0.3, 3.2, z + 0.3);
        bag2.castShadow = true;
        bag2.receiveShadow = true;
        scene.add(bag2);
        objects.push(bag2);
      }
    });
  }

  function createWatchtowers() {
    // Watchtower positions
    var towerPositions = [
      { x: -50, z: 40 },
      { x: 50, z: 40 },
      { x: -60, z: -50 },
      { x: 60, z: -50 }
    ];

    towerPositions.forEach(function(pos) {
      // Tower platform - BoxGeometry base
      var platformGeom = new THREE.BoxGeometry(15, 1, 15);
      var platformMat = new THREE.MeshStandardMaterial({
        color: CONCRETE_GRAY,
        roughness: 0.7,
        metalness: 0.1
      });
      var platform = new THREE.Mesh(platformGeom, platformMat);
      platform.position.set(pos.x, 15, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      objects.push(platform);

      // Tower legs - CylinderGeometry
      for (var i = -1; i <= 1; i += 2) {
        for (var j = -1; j <= 1; j += 2) {
          var legGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
          var legMat = new THREE.MeshStandardMaterial({
            color: RUSTY_ORANGE,
            roughness: 0.8,
            metalness: 0.3
          });
          var leg = new THREE.Mesh(legGeom, legMat);
          leg.position.set(pos.x + i * 6, 7.5, pos.z + j * 6);
          leg.castShadow = true;
          leg.receiveShadow = true;
          scene.add(leg);
          objects.push(leg);
        }
      }

      // Tower cabin - BoxGeometry
      var cabinGeom = new THREE.BoxGeometry(10, 8, 10);
      var cabinMat = new THREE.MeshStandardMaterial({
        color: CONCRETE_GRAY,
        roughness: 0.7,
        metalness: 0.1
      });
      var cabin = new THREE.Mesh(cabinGeom, cabinMat);
      cabin.position.set(pos.x, 19, pos.z);
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      scene.add(cabin);
      objects.push(cabin);

      // Spotlight mounting - small cylinder on top
      var spotGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 6);
      var spotMat = new THREE.MeshStandardMaterial({
        color: BLACK,
        roughness: 0.5,
        metalness: 0.8
      });
      var spot = new THREE.Mesh(spotGeom, spotMat);
      spot.position.set(pos.x, 23, pos.z);
      spot.castShadow = true;
      spot.receiveShadow = true;
      scene.add(spot);
      objects.push(spot);
    });
  }

  function createAntiTankDitch() {
    // Anti-tank ditch - recessed BoxGeometry trench
    var ditchGeom = new THREE.BoxGeometry(80, 8, 6);
    var ditchMat = new THREE.MeshStandardMaterial({
      color: DARK_BROWN,
      roughness: 0.9,
      metalness: 0
    });
    var ditch = new THREE.Mesh(ditchGeom, ditchMat);
    ditch.position.set(0, -4, -70);
    ditch.castShadow = true;
    ditch.receiveShadow = true;
    scene.add(ditch);
    objects.push(ditch);

    // Ditch edge reinforcement - sand piles on sides
    var edgePositions = [-40, -30, -20, -10, 0, 10, 20, 30, 40];
    edgePositions.forEach(function(xPos) {
      // Left edge
      var edgeGeom = new THREE.BoxGeometry(4, 3, 8);
      var edgeMat = new THREE.MeshStandardMaterial({
        color: DARK_SAND_COLOR,
        roughness: 0.85,
        metalness: 0
      });
      var leftEdge = new THREE.Mesh(edgeGeom, edgeMat);
      leftEdge.position.set(xPos, 0, -68);
      leftEdge.castShadow = true;
      leftEdge.receiveShadow = true;
      scene.add(leftEdge);
      objects.push(leftEdge);

      // Right edge
      var rightEdge = new THREE.Mesh(edgeGeom, edgeMat);
      rightEdge.position.set(xPos, 0, -72);
      rightEdge.castShadow = true;
      rightEdge.receiveShadow = true;
      scene.add(rightEdge);
      objects.push(rightEdge);
    });
  }

  function createBarbedWire() {
    // Barbed wire barriers using LineSegments with zigzag pattern
    var wirePositions = [
      { x: -50, z: 50, length: 100 },
      { x: 50, z: 50, length: 100 },
      { x: -70, z: 0, length: 80 }
    ];

    wirePositions.forEach(function(wire) {
      var points = [];
      var segments = 20;
      for (var i = 0; i <= segments; i++) {
        var t = i / segments;
        var x = wire.x;
        var z = wire.z + (t * wire.length - wire.length / 2);
        var y = 2 + (i % 2) * 0.8;
        points.push(new THREE.Vector3(x, y, z));
      }
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: RUSTY_ORANGE, linewidth: 2 });
      var wireframe = new THREE.LineSegments(geometry, material);
      scene.add(wireframe);
      objects.push(wireframe);
    });
  }

  function createGeneratorShelter() {
    // Generator shelter main structure - BoxGeometry
    var shelterGeom = new THREE.BoxGeometry(20, 10, 15);
    var shelterMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      roughness: 0.75,
      metalness: 0.2
    });
    var shelter = new THREE.Mesh(shelterGeom, shelterMat);
    shelter.position.set(-40, 5, -30);
    shelter.castShadow = true;
    shelter.receiveShadow = true;
    scene.add(shelter);
    objects.push(shelter);

    // Corrugated roof panels - thin BoxGeometry slats
    for (var i = 0; i < 5; i++) {
      var roofGeom = new THREE.BoxGeometry(20, 0.5, 2);
      var roofMat = new THREE.MeshStandardMaterial({
        color: RUSTY_ORANGE,
        roughness: 0.8,
        metalness: 0.3
      });
      var roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.set(-40, 10 + i * 0.8, -30 + (i - 2) * 1.5);
      roof.castShadow = true;
      roof.receiveShadow = true;
      scene.add(roof);
      objects.push(roof);
    }

    // Generator exhaust pipe - CylinderGeometry
    var exhaustGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
    var exhaustMat = new THREE.MeshStandardMaterial({
      color: DARK_BROWN,
      roughness: 0.9,
      metalness: 0.2
    });
    var exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
    exhaust.position.set(-35, 14, -25);
    exhaust.castShadow = true;
    exhaust.receiveShadow = true;
    scene.add(exhaust);
    objects.push(exhaust);
  }

  function createWaterTank() {
    // Water supply tank - elevated CylinderGeometry
    var tankGeom = new THREE.CylinderGeometry(8, 8, 12, 16);
    var tankMat = new THREE.MeshStandardMaterial({
      color: 0x4A7C59,
      roughness: 0.7,
      metalness: 0.3
    });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(40, 8, -25);
    tank.castShadow = true;
    tank.receiveShadow = true;
    scene.add(tank);
    objects.push(tank);

    // Tank support legs - CylinderGeometry
    for (var i = -1; i <= 1; i += 2) {
      for (var j = -1; j <= 1; j += 2) {
        var legGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        var legMat = new THREE.MeshStandardMaterial({
          color: CONCRETE_GRAY,
          roughness: 0.7,
          metalness: 0.2
        });
        var leg = new THREE.Mesh(legGeom, legMat);
        leg.position.set(40 + i * 6, 4, -25 + j * 6);
        leg.castShadow = true;
        leg.receiveShadow = true;
        scene.add(leg);
        objects.push(leg);
      }
    }
  }

  function createCommunicationsMast() {
    // Communications mast - tall CylinderGeometry pole
    var mastGeom = new THREE.CylinderGeometry(0.4, 0.5, 35, 8);
    var mastMat = new THREE.MeshStandardMaterial({
      color: LIGHT_GRAY,
      roughness: 0.7,
      metalness: 0.4
    });
    var mast = new THREE.Mesh(mastGeom, mastMat);
    mast.position.set(0, 17.5, 30);
    mast.castShadow = true;
    mast.receiveShadow = true;
    scene.add(mast);
    objects.push(mast);

    // Antenna dish at top - ConeGeometry
    var dishGeom = new THREE.ConeGeometry(3, 1, 16);
    var dishMat = new THREE.MeshStandardMaterial({
      color: 0xB0C4DE,
      roughness: 0.5,
      metalness: 0.6
    });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(0, 35.5, 30);
    dish.castShadow = true;
    dish.receiveShadow = true;
    scene.add(dish);
    objects.push(dish);

    // Support cables - LineSegments
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var cablePoints = [
        new THREE.Vector3(0, 32, 30),
        new THREE.Vector3(Math.cos(angle) * 12, 15, 30 + Math.sin(angle) * 12)
      ];
      var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
      var cableMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 });
      var cable = new THREE.LineSegments(cableGeom, cableMat);
      scene.add(cable);
      objects.push(cable);
    }
  }

  function createVehicleWrecks() {
    // Burned-out vehicle hulks
    var wreckPositions = [
      { x: -70, z: 30 },
      { x: 70, z: -20 },
      { x: 0, z: 50 }
    ];

    wreckPositions.forEach(function(pos) {
      // Main hull - BoxGeometry
      var hullGeom = new THREE.BoxGeometry(8, 4, 14);
      var hullMat = new THREE.MeshStandardMaterial({
        color: DARK_BROWN,
        roughness: 0.95,
        metalness: 0.1
      });
      var hull = new THREE.Mesh(hullGeom, hullMat);
      hull.position.set(pos.x, 2, pos.z);
      hull.rotation.z = (Math.random() - 0.5) * 0.3;
      hull.castShadow = true;
      hull.receiveShadow = true;
      scene.add(hull);
      objects.push(hull);

      // Scorched armor plating
      var plateGeom = new THREE.BoxGeometry(9, 0.3, 15);
      var plateMat = new THREE.MeshStandardMaterial({
        color: 0x2F2F2F,
        roughness: 0.9,
        metalness: 0.15
      });
      var plate = new THREE.Mesh(plateGeom, plateMat);
      plate.position.set(pos.x, 4.2, pos.z);
      plate.castShadow = true;
      plate.receiveShadow = true;
      scene.add(plate);
      objects.push(plate);

      // Turret wreckage - small sphere/cylinder
      var turretGeom = new THREE.ConeGeometry(2, 3, 12);
      var turretMat = new THREE.MeshStandardMaterial({
        color: RUSTY_ORANGE,
        roughness: 0.85,
        metalness: 0.2
      });
      var turret = new THREE.Mesh(turretGeom, turretMat);
      turret.position.set(pos.x, 5, pos.z - 2);
      turret.rotation.x = Math.random() * Math.PI;
      turret.castShadow = true;
      turret.receiveShadow = true;
      scene.add(turret);
      objects.push(turret);
    });
  }

  function createAmmoCrates() {
    // Ammo and supply crates - stacked BoxGeometry
    var cratePositions = [
      { x: -35, z: 50 },
      { x: 35, z: 45 },
      { x: 0, z: -40 }
    ];

    cratePositions.forEach(function(pos) {
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 2; j++) {
          var crateGeom = new THREE.BoxGeometry(4, 3, 4);
          var crateMat = new THREE.MeshStandardMaterial({
            color: KHAKI_GREEN,
            roughness: 0.8,
            metalness: 0.1
          });
          var crate = new THREE.Mesh(crateGeom, crateMat);
          crate.position.set(pos.x + j * 5, 1.5 + i * 3.5, pos.z);
          crate.castShadow = true;
          crate.receiveShadow = true;
          scene.add(crate);
          objects.push(crate);
        }
      }
    });
  }

  function createMirageEffects() {
    // Mirage shimmer objects - SphereGeometry heat haze
    var miragePositions = [
      { x: -80, z: -60 },
      { x: 80, z: 40 },
      { x: 0, z: -90 },
      { x: -50, z: 60 }
    ];

    miragePositions.forEach(function(pos) {
      var mirageGeom = new THREE.SphereGeometry(6, 8, 6);
      var mirageMat = new THREE.MeshStandardMaterial({
        color: 0xE8D4B8,
        transparent: true,
        opacity: 0.15,
        emissive: 0xFFD700,
        emissiveIntensity: 0.2,
        roughness: 0.9,
        metalness: 0
      });
      var mirage = new THREE.Mesh(mirageGeom, mirageMat);
      mirage.position.set(pos.x, 8, pos.z);
      scene.add(mirage);
      mirageObjects.push({
        mesh: mirage,
        initialScale: 1,
        baseX: pos.x,
        baseY: 8,
        baseZ: pos.z,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  function createHeatShimmer() {
    // Ground heat shimmer effect - flat SphereGeometry distortion patches
    var shimmerPositions = [
      { x: -60, z: -30 },
      { x: 0, z: 0 },
      { x: 60, z: -50 },
      { x: -40, z: 40 },
      { x: 40, z: 30 }
    ];

    shimmerPositions.forEach(function(pos) {
      var shimmerGeom = new THREE.SphereGeometry(8, 6, 4);
      var shimmerMat = new THREE.MeshStandardMaterial({
        color: SAND_COLOR,
        transparent: true,
        opacity: 0.08,
        emissive: 0xFFA500,
        emissiveIntensity: 0.15,
        roughness: 0.95,
        metalness: 0
      });
      var shimmer = new THREE.Mesh(shimmerGeom, shimmerMat);
      shimmer.position.set(pos.x, 0.5, pos.z);
      shimmer.scale.z = 0.3;
      scene.add(shimmer);
      mirageObjects.push({
        mesh: shimmer,
        initialScale: 1,
        baseX: pos.x,
        baseY: 0.5,
        baseZ: pos.z,
        phase: Math.random() * Math.PI * 2,
        isShimmer: true
      });
    });
  }

  function update(delta) {
    animationTime += delta;

    // Update mirage wobbling and scaling
    mirageObjects.forEach(function(mirage) {
      var wobbleAmount = 0.15;
      var wobbleSpeed = 2;
      var yOffset = Math.sin(animationTime * wobbleSpeed + mirage.phase) * wobbleAmount;
      mirage.mesh.position.y = mirage.baseY + yOffset;

      // Scale pulsing
      var scaleAmount = 0.1;
      var scale = mirage.initialScale + Math.cos(animationTime * 1.5 + mirage.phase) * scaleAmount;
      mirage.mesh.scale.set(scale, scale * 0.8, scale);

      if (mirage.isShimmer) {
        mirage.mesh.rotation.z = animationTime * 0.5 + mirage.phase;
      }
    });

    // Animate watchtower spotlights (sweeping)
    var lightSweepSpeed = 1;
    var lightRotation = (animationTime * lightSweepSpeed) % (Math.PI * 2);

    // Barbed wire shadow flickering effect
    objects.forEach(function(obj) {
      if (obj instanceof THREE.LineSegments) {
        // Flicker material opacity
        if (obj.material && obj.material.linewidth !== undefined) {
          var flicker = 0.5 + Math.sin(animationTime * 5) * 0.5;
          obj.material.opacity = 0.7 + flicker * 0.3;
        }
      }

      // Generator light flickering
      if (obj.position.x < -35 && obj.position.x > -45 && obj.position.z < -20 && obj.position.z > -40) {
        var flicker = Math.sin(animationTime * 8) * 0.1;
        if (obj.material && obj.material.emissiveIntensity !== undefined) {
          obj.material.emissiveIntensity = 0.1 + flicker;
        }
      }
    });

    // Sand particles rising (simulated with mirage scaling)
    mirageObjects.forEach(function(mirage) {
      if (mirage.isShimmer) {
        var rise = Math.sin(animationTime * 3 + mirage.phase) * 2;
        mirage.mesh.position.y = mirage.baseY + rise;
      }
    });
  }

  function reset() {
    // Clear all objects from scene
    objects.forEach(function(obj) {
      if (obj.parent) {
        obj.parent.remove(obj);
      }
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) {
            mat.dispose();
          });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Clear mirage objects
    mirageObjects.forEach(function(mirage) {
      if (mirage.mesh.parent) {
        mirage.mesh.parent.remove(mirage.mesh);
      }
      if (mirage.mesh.geometry) {
        mirage.mesh.geometry.dispose();
      }
      if (mirage.mesh.material) {
        mirage.mesh.material.dispose();
      }
    });

    objects = [];
    mirageObjects = [];
    spawnPoints = [];
    animationTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() {
      return spawnPoints;
    },
    getObjects: function() {
      return objects;
    }
  };
}());
