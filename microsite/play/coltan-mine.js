window.ColtanMine = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var animations = [];
  var time = 0;

  // Color palette
  var COLORS = {
    dirt: 0xA0522D,
    jungle: 0x2D5A27,
    ore: 0x888888,
    militia: 0x8B7355,
    warning: 0xFF4400,
    metal: 0x666666,
    wood: 0x654321,
    sky: 0x87CEEB,
    water: 0x4A90E2,
    prisoner: 0xFFDEAD,
    concrete: 0x808080
  };

  function createOpenPitExcavation() {
    var pitGroup = new THREE.Group();
    pitGroup.name = 'open_pit';

    // Stepped terraces going down
    var terraceCount = 8;
    var startRadius = 80;
    var depth = 60;

    for (var i = 0; i < terraceCount; i++) {
      var radius = startRadius - (i * 8);
      var terraceHeight = depth / terraceCount;
      var yPos = -(i * terraceHeight);

      // Terrace platform
      var terraceGeom = new THREE.BoxGeometry(radius * 2.5, 3, radius * 2.5);
      var terraceMatl = new THREE.MeshLambertMaterial({ color: COLORS.dirt });
      var terrace = new THREE.Mesh(terraceGeom, terraceMatl);
      terrace.position.y = yPos;
      terrace.castShadow = true;
      terrace.receiveShadow = true;
      pitGroup.add(terrace);
      meshes.push(terrace);

      // Support rocks/rubble
      if (i % 2 === 0) {
        var rockCount = 4;
        for (var r = 0; r < rockCount; r++) {
          var rockGeom = new THREE.BoxGeometry(
            Math.random() * 6 + 3,
            Math.random() * 4 + 2,
            Math.random() * 6 + 3
          );
          var rockMatl = new THREE.MeshLambertMaterial({
            color: COLORS.dirt - 0x101010
          });
          var rock = new THREE.Mesh(rockGeom, rockMatl);
          var angle = (r / rockCount) * Math.PI * 2;
          rock.position.set(
            Math.cos(angle) * (radius - 15),
            yPos + 5,
            Math.sin(angle) * (radius - 15)
          );
          rock.castShadow = true;
          pitGroup.add(rock);
          meshes.push(rock);
        }
      }
    }

    // Ore vein markers at bottom
    var oreVeinCount = 6;
    for (var v = 0; v < oreVeinCount; v++) {
      var veinGeom = new THREE.BoxGeometry(12, 8, 12);
      var veinMatl = new THREE.MeshLambertMaterial({ color: COLORS.ore });
      var vein = new THREE.Mesh(veinGeom, veinMatl);
      var veinAngle = (v / oreVeinCount) * Math.PI * 2;
      vein.position.set(
        Math.cos(veinAngle) * 20,
        -depth + 10,
        Math.sin(veinAngle) * 20
      );
      vein.castShadow = true;
      pitGroup.add(vein);
      meshes.push(vein);
    }

    return pitGroup;
  }

  function createProcessingPlant() {
    var plantGroup = new THREE.Group();
    plantGroup.name = 'processing_plant';
    plantGroup.position.set(50, 8, 40);

    // Main processing building
    var buildingGeom = new THREE.BoxGeometry(40, 25, 30);
    var buildingMatl = new THREE.MeshLambertMaterial({
      color: COLORS.concrete
    });
    var building = new THREE.Mesh(buildingGeom, buildingMatl);
    building.castShadow = true;
    building.receiveShadow = true;
    plantGroup.add(building);
    meshes.push(building);

    // Conveyor belt system (3 belts at different heights)
    for (var b = 0; b < 3; b++) {
      var beltGeom = new THREE.BoxGeometry(35, 2, 8);
      var beltMatl = new THREE.MeshLambertMaterial({ color: COLORS.metal });
      var belt = new THREE.Mesh(beltGeom, beltMatl);
      belt.position.set(0, 8 + b * 6, -12 + b * 5);
      belt.castShadow = true;
      belt.receiveShadow = true;
      plantGroup.add(belt);
      meshes.push(belt);

      // Track conveyor belt animation
      animations.push({
        object: belt,
        type: 'conveyor',
        speed: 0.02
      });

      // Support pillars for belt
      for (var p = 0; p < 2; p++) {
        var pillarGeom = new THREE.CylinderGeometry(2, 2, 10, 8);
        var pillarMatl = new THREE.MeshLambertMaterial({
          color: COLORS.metal
        });
        var pillar = new THREE.Mesh(pillarGeom, pillarMatl);
        pillar.position.set(-15 + p * 30, 3, -12 + b * 5);
        pillar.castShadow = true;
        plantGroup.add(pillar);
        meshes.push(pillar);
      }
    }

    // Processing tanks (cylindrical)
    var tankCount = 4;
    for (var t = 0; t < tankCount; t++) {
      var tankGeom = new THREE.CylinderGeometry(6, 7, 14, 16);
      var tankMatl = new THREE.MeshLambertMaterial({
        color: COLORS.concrete
      });
      var tank = new THREE.Mesh(tankGeom, tankMatl);
      tank.position.set(-15 + t * 10, 12, 18);
      tank.castShadow = true;
      plantGroup.add(tank);
      meshes.push(tank);
    }

    // Dust clouds animation spawner
    animations.push({
      object: plantGroup,
      type: 'dust',
      count: 8
    });

    return plantGroup;
  }

  function createMiningEquipment() {
    var equipGroup = new THREE.Group();
    equipGroup.name = 'mining_equipment';
    equipGroup.position.set(-40, 15, -50);

    // Excavator arm base
    var baseGeom = new THREE.CylinderGeometry(8, 10, 6, 16);
    var baseMatl = new THREE.MeshLambertMaterial({ color: COLORS.warning });
    var base = new THREE.Mesh(baseGeom, baseMatl);
    base.castShadow = true;
    base.receiveShadow = true;
    equipGroup.add(base);
    meshes.push(base);

    // Main boom arm
    var boomGeom = new THREE.BoxGeometry(6, 4, 45);
    var boomMatl = new THREE.MeshLambertMaterial({ color: COLORS.warning });
    var boom = new THREE.Mesh(boomGeom, boomMatl);
    boom.position.set(0, 8, 15);
    boom.castShadow = true;
    equipGroup.add(boom);
    meshes.push(boom);

    // Add rotation animation to boom
    animations.push({
      object: boom,
      type: 'swing',
      amplitude: 0.5,
      speed: 0.3
    });

    // Second arm segment
    var armGeom = new THREE.BoxGeometry(5, 3, 30);
    var armMatl = new THREE.MeshLambertMaterial({ color: COLORS.militia });
    var arm = new THREE.Mesh(armGeom, armMatl);
    arm.position.set(0, 10, 35);
    boom.add(arm);
    meshes.push(arm);

    // Bucket attachment
    var bucketGeom = new THREE.BoxGeometry(10, 8, 12);
    var bucketMatl = new THREE.MeshLambertMaterial({ color: COLORS.metal });
    var bucket = new THREE.Mesh(bucketGeom, bucketMatl);
    bucket.position.set(0, -8, 28);
    arm.add(bucket);
    meshes.push(bucket);

    // Support structure
    for (var s = 0; s < 3; s++) {
      var supportGeom = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
      var supportMatl = new THREE.MeshLambertMaterial({
        color: COLORS.metal
      });
      var support = new THREE.Mesh(supportGeom, supportMatl);
      var angle = (s / 3) * Math.PI * 2;
      support.position.set(
        Math.cos(angle) * 12,
        12,
        Math.sin(angle) * 5
      );
      support.castShadow = true;
      equipGroup.add(support);
      meshes.push(support);
    }

    return equipGroup;
  }

  function createOreStockpile() {
    var stockGroup = new THREE.Group();
    stockGroup.name = 'ore_stockpile';
    stockGroup.position.set(60, 0, -60);

    // Large ore mountain
    var oreGeom = new THREE.ConeGeometry(35, 40, 16);
    var oreMatl = new THREE.MeshLambertMaterial({ color: COLORS.ore });
    var oreMound = new THREE.Mesh(oreGeom, oreMatl);
    oreMound.castShadow = true;
    oreMound.receiveShadow = true;
    stockGroup.add(oreMound);
    meshes.push(oreMound);

    // Ore chunks scattered around
    for (var o = 0; o < 12; o++) {
      var chunkGeom = new THREE.BoxGeometry(
        Math.random() * 5 + 2,
        Math.random() * 4 + 2,
        Math.random() * 5 + 2
      );
      var chunkMatl = new THREE.MeshLambertMaterial({
        color: COLORS.ore
      });
      var chunk = new THREE.Mesh(chunkGeom, chunkMatl);
      chunk.position.set(
        (Math.random() - 0.5) * 60,
        Math.random() * 15 + 5,
        (Math.random() - 0.5) * 60
      );
      chunk.castShadow = true;
      stockGroup.add(chunk);
      meshes.push(chunk);
    }

    return stockGroup;
  }

  function createPrisonerCampound() {
    var campGroup = new THREE.Group();
    campGroup.name = 'prisoner_camp';
    campGroup.position.set(-60, 8, 30);

    // Cage structures (3 cages)
    for (var c = 0; c < 3; c++) {
      var cageGeom = new THREE.BoxGeometry(15, 10, 15);
      var cageMatl = new THREE.MeshLambertMaterial({
        color: COLORS.metal,
        wireframe: true
      });
      var cage = new THREE.Mesh(cageGeom, cageMatl);
      cage.position.set(c * 20, 0, 0);
      cage.castShadow = true;
      campGroup.add(cage);
      meshes.push(cage);

      // Cage floor
      var floorGeom = new THREE.BoxGeometry(15, 0.5, 15);
      var floorMatl = new THREE.MeshLambertMaterial({
        color: COLORS.metal
      });
      var floor = new THREE.Mesh(floorGeom, floorMatl);
      floor.position.set(c * 20, -5, 0);
      campGroup.add(floor);
      meshes.push(floor);

      // Prisoner markers (simple boxes)
      for (var p = 0; p < 4; p++) {
        var prisonerGeom = new THREE.BoxGeometry(1.5, 3, 1.5);
        var prisonerMatl = new THREE.MeshLambertMaterial({
          color: COLORS.prisoner
        });
        var prisoner = new THREE.Mesh(prisonerGeom, prisonerMatl);
        var px = c * 20 + (Math.random() - 0.5) * 10;
        var pz = (Math.random() - 0.5) * 10;
        prisoner.position.set(px, -2, pz);
        campGroup.add(prisoner);
        meshes.push(prisoner);

        // Animate prisoners
        animations.push({
          object: prisoner,
          type: 'pace',
          speed: 0.01,
          range: 3
        });
      }
    }

    return campGroup;
  }

  function createMilitiaWatchtowers() {
    var towerGroup = new THREE.Group();
    towerGroup.name = 'watchtowers';

    var positions = [
      { x: 80, z: 80 },
      { x: -80, z: 80 },
      { x: 80, z: -80 },
      { x: -80, z: -80 }
    ];

    for (var t = 0; t < positions.length; t++) {
      var pos = positions[t];

      // Tower base
      var baseGeom = new THREE.CylinderGeometry(4, 5, 3, 8);
      var baseMatl = new THREE.MeshLambertMaterial({
        color: COLORS.concrete
      });
      var base = new THREE.Mesh(baseGeom, baseMatl);
      base.position.set(pos.x, 8, pos.z);
      base.castShadow = true;
      towerGroup.add(base);
      meshes.push(base);

      // Tower shaft
      var shaftGeom = new THREE.CylinderGeometry(2, 2, 20, 8);
      var shaftMatl = new THREE.MeshLambertMaterial({
        color: COLORS.concrete
      });
      var shaft = new THREE.Mesh(shaftGeom, shaftMatl);
      shaft.position.set(pos.x, 20, pos.z);
      shaft.castShadow = true;
      towerGroup.add(shaft);
      meshes.push(shaft);

      // Watch platform
      var platformGeom = new THREE.BoxGeometry(10, 1, 10);
      var platformMatl = new THREE.MeshLambertMaterial({
        color: COLORS.wood
      });
      var platform = new THREE.Mesh(platformGeom, platformMatl);
      platform.position.set(pos.x, 28, pos.z);
      platform.castShadow = true;
      towerGroup.add(platform);
      meshes.push(platform);

      // Guard station marker
      var guardGeom = new THREE.BoxGeometry(1, 2, 1);
      var guardMatl = new THREE.MeshLambertMaterial({
        color: COLORS.militia
      });
      var guard = new THREE.Mesh(guardGeom, guardMatl);
      guard.position.set(pos.x, 30, pos.z);
      towerGroup.add(guard);
      meshes.push(guard);

      // Patrol animation
      animations.push({
        object: guard,
        type: 'patrol',
        basePos: { x: pos.x, y: 30, z: pos.z },
        radius: 6,
        speed: 0.015
      });

      // Searchlight (cone from tower)
      var lightGeom = new THREE.ConeGeometry(8, 25, 16);
      var lightMatl = new THREE.MeshLambertMaterial({
        color: 0xFFFF00,
        transparent: true,
        opacity: 0.15
      });
      var light = new THREE.Mesh(lightGeom, lightMatl);
      light.position.set(pos.x, 20, pos.z);
      light.rotation.x = Math.PI / 6;
      towerGroup.add(light);
      meshes.push(light);
    }

    return towerGroup;
  }

  function createJungleCover() {
    var jungleGroup = new THREE.Group();
    jungleGroup.name = 'jungle';

    var treeCount = 25;
    for (var tr = 0; tr < treeCount; tr++) {
      var x = (Math.random() - 0.5) * 300;
      var z = (Math.random() - 0.5) * 300;

      // Skip areas with structures
      if (Math.abs(x) < 100 && Math.abs(z) < 100) continue;

      // Trunk
      var trunkGeom = new THREE.CylinderGeometry(2, 3, 15, 8);
      var trunkMatl = new THREE.MeshLambertMaterial({
        color: COLORS.wood
      });
      var trunk = new THREE.Mesh(trunkGeom, trunkMatl);
      trunk.position.set(x, 7.5, z);
      trunk.castShadow = true;
      jungleGroup.add(trunk);
      meshes.push(trunk);

      // Canopy
      var canopyGeom = new THREE.SphereGeometry(12, 8, 8);
      var canopyMatl = new THREE.MeshLambertMaterial({
        color: COLORS.jungle
      });
      var canopy = new THREE.Mesh(canopyGeom, canopyMatl);
      canopy.position.set(x, 20, z);
      canopy.scale.set(1, 1.2, 1);
      canopy.castShadow = true;
      jungleGroup.add(canopy);
      meshes.push(canopy);
    }

    return jungleGroup;
  }

  function createOreTransportTrucks() {
    var truckGroup = new THREE.Group();
    truckGroup.name = 'ore_trucks';

    // Truck 1 (moving on road)
    var truck1Geom = new THREE.BoxGeometry(8, 6, 16);
    var truck1Matl = new THREE.MeshLambertMaterial({
      color: COLORS.warning
    });
    var truck1 = new THREE.Mesh(truck1Geom, truck1Matl);
    truck1.position.set(-30, 3, 0);
    truck1.castShadow = true;
    truckGroup.add(truck1);
    meshes.push(truck1);

    // Truck cab
    var cab1Geom = new THREE.BoxGeometry(6, 4, 6);
    var cab1Matl = new THREE.MeshLambertMaterial({
      color: COLORS.militia
    });
    var cab1 = new THREE.Mesh(cab1Geom, cab1Matl);
    cab1.position.set(-30, 6, -5);
    truck1.add(cab1);
    meshes.push(cab1);

    // Wheel simulation (4 wheels per truck)
    for (var w = 0; w < 4; w++) {
      var wheelGeom = new THREE.CylinderGeometry(2, 2, 2, 16);
      var wheelMatl = new THREE.MeshLambertMaterial({
        color: 0x111111
      });
      var wheel = new THREE.Mesh(wheelGeom, wheelMatl);
      var wheelX = w < 2 ? -2 : 2;
      var wheelZ = w % 2 === 0 ? -5 : 5;
      wheel.position.set(wheelX, 2, wheelZ);
      wheel.rotation.z = Math.PI / 2;
      truck1.add(wheel);
      meshes.push(wheel);
    }

    // Truck movement animation
    animations.push({
      object: truck1,
      type: 'delivery',
      startPos: -30,
      endPos: 30,
      speed: 0.02
    });

    // Truck 2 (stationary at pit)
    var truck2Geom = new THREE.BoxGeometry(8, 6, 16);
    var truck2Matl = new THREE.MeshLambertMaterial({
      color: COLORS.militia
    });
    var truck2 = new THREE.Mesh(truck2Geom, truck2Matl);
    truck2.position.set(0, 3, -80);
    truck2.castShadow = true;
    truckGroup.add(truck2);
    meshes.push(truck2);

    return truckGroup;
  }

  function createExplosivesStorage() {
    var storageGroup = new THREE.Group();
    storageGroup.name = 'explosives_storage';
    storageGroup.position.set(-80, 8, -30);

    // Bunker structure
    var bunkerGeom = new THREE.BoxGeometry(20, 8, 16);
    var bunkerMatl = new THREE.MeshLambertMaterial({
      color: COLORS.concrete
    });
    var bunker = new THREE.Mesh(bunkerGeom, bunkerMatl);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    storageGroup.add(bunker);
    meshes.push(bunker);

    // Warning markings (red boxes)
    for (var w = 0; w < 4; w++) {
      var warnGeom = new THREE.BoxGeometry(3, 4, 2);
      var warnMatl = new THREE.MeshLambertMaterial({
        color: COLORS.warning
      });
      var warn = new THREE.Mesh(warnGeom, warnMatl);
      warn.position.set(-8 + w * 5, 6, 0);
      storageGroup.add(warn);
      meshes.push(warn);
    }

    // Storage crates
    for (var c = 0; c < 6; c++) {
      var crateGeom = new THREE.BoxGeometry(4, 4, 4);
      var crateMatl = new THREE.MeshLambertMaterial({
        color: COLORS.warning
      });
      var crate = new THREE.Mesh(crateGeom, crateMatl);
      crate.position.set(-8 + c * 3, 2, 0);
      storageGroup.add(crate);
      meshes.push(crate);
    }

    return storageGroup;
  }

  function createDirtRoad() {
    var roadGeom = new THREE.BoxGeometry(20, 0.5, 200);
    var roadMatl = new THREE.MeshLambertMaterial({
      color: COLORS.dirt - 0x202020
    });
    var road = new THREE.Mesh(roadGeom, roadMatl);
    road.position.set(0, 1, 0);
    road.receiveShadow = true;
    meshes.push(road);
    return road;
  }

  function createCheckpointGate() {
    var gateGroup = new THREE.Group();
    gateGroup.name = 'checkpoint';
    gateGroup.position.set(0, 8, -100);

    // Gate posts
    for (var p = 0; p < 2; p++) {
      var postGeom = new THREE.CylinderGeometry(2, 2, 8, 8);
      var postMatl = new THREE.MeshLambertMaterial({
        color: COLORS.metal
      });
      var post = new THREE.Mesh(postGeom, postMatl);
      post.position.set(-8 + p * 16, 4, 0);
      post.castShadow = true;
      gateGroup.add(post);
      meshes.push(post);
    }

    // Gate barrier
    var barrierGeom = new THREE.BoxGeometry(16, 2, 2);
    var barrierMatl = new THREE.MeshLambertMaterial({
      color: COLORS.warning
    });
    var barrier = new THREE.Mesh(barrierGeom, barrierMatl);
    barrier.position.set(0, 6, 0);
    barrier.castShadow = true;
    gateGroup.add(barrier);
    meshes.push(barrier);

    // Gate animation (raise/lower)
    animations.push({
      object: barrier,
      type: 'gate',
      minY: 6,
      maxY: 12,
      speed: 0.01
    });

    // Guard shack
    var shackGeom = new THREE.BoxGeometry(8, 5, 6);
    var shackMatl = new THREE.MeshLambertMaterial({
      color: COLORS.wood
    });
    var shack = new THREE.Mesh(shackGeom, shackMatl);
    shack.position.set(-12, 2.5, 10);
    shack.castShadow = true;
    gateGroup.add(shack);
    meshes.push(shack);

    return gateGroup;
  }

  function updateConveyor(belt, delta) {
    belt.rotation.z = (belt.rotation.z || 0) + delta * 0.5;
  }

  function updateDust(object, delta) {
    // Dust particles would spawn and fade
  }

  function updateSwing(arm, delta) {
    var swing = animations.find(function(a) {
      return a.object === arm && a.type === 'swing';
    });
    if (swing) {
      swing.angle = (swing.angle || 0) + delta * swing.speed;
      arm.rotation.z = Math.sin(swing.angle) * swing.amplitude;
    }
  }

  function updatePace(prisoner, delta) {
    var pace = animations.find(function(a) {
      return a.object === prisoner && a.type === 'pace';
    });
    if (pace) {
      pace.offset = (pace.offset || 0) + delta * pace.speed;
      if (pace.offset > pace.range) pace.offset = 0;
      prisoner.position.x += Math.sin(pace.offset) * 0.05;
    }
  }

  function updatePatrol(guard, delta) {
    var patrol = animations.find(function(a) {
      return a.object === guard && a.type === 'patrol';
    });
    if (patrol) {
      patrol.angle = (patrol.angle || 0) + delta * patrol.speed;
      guard.position.x = patrol.basePos.x + Math.cos(patrol.angle) * patrol.radius;
      guard.position.z = patrol.basePos.z + Math.sin(patrol.angle) * patrol.radius;
    }
  }

  function updateDelivery(truck, delta) {
    var delivery = animations.find(function(a) {
      return a.object === truck && a.type === 'delivery';
    });
    if (delivery) {
      delivery.progress = (delivery.progress || 0) + delta * delivery.speed;
      if (delivery.progress > 1) delivery.progress = 0;
      truck.position.x = delivery.startPos + (delivery.endPos - delivery.startPos) * delivery.progress;
    }
  }

  function updateGate(barrier, delta) {
    var gateAnim = animations.find(function(a) {
      return a.object === barrier && a.type === 'gate';
    });
    if (gateAnim) {
      gateAnim.direction = gateAnim.direction || 1;
      barrier.position.y += delta * gateAnim.speed * gateAnim.direction;
      if (barrier.position.y >= gateAnim.maxY) {
        gateAnim.direction = -1;
      } else if (barrier.position.y <= gateAnim.minY) {
        gateAnim.direction = 1;
      }
    }
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    animations = [];
    time = 0;

    // Ground terrain
    var groundGeom = new THREE.BoxGeometry(300, 2, 300);
    var groundMatl = new THREE.MeshLambertMaterial({
      color: COLORS.jungle
    });
    var ground = new THREE.Mesh(groundGeom, groundMatl);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    meshes.push(ground);

    // Add all structures
    scene.add(createOpenPitExcavation());
    scene.add(createProcessingPlant());
    scene.add(createMiningEquipment());
    scene.add(createOreStockpile());
    scene.add(createPrisonerCampound());
    scene.add(createMilitiaWatchtowers());
    scene.add(createJungleCover());
    scene.add(createOreTransportTrucks());
    scene.add(createExplosivesStorage());
    scene.add(createDirtRoad());
    scene.add(createCheckpointGate());

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);
  };

  var update = function(delta) {
    time += delta;

    // Update all animations
    for (var i = 0; i < animations.length; i++) {
      var anim = animations[i];
      switch (anim.type) {
        case 'conveyor':
          updateConveyor(anim.object, delta);
          break;
        case 'swing':
          updateSwing(anim.object, delta);
          break;
        case 'pace':
          updatePace(anim.object, delta);
          break;
        case 'patrol':
          updatePatrol(anim.object, delta);
          break;
        case 'delivery':
          updateDelivery(anim.object, delta);
          break;
        case 'gate':
          updateGate(anim.object, delta);
          break;
      }
    }
  };

  var reset = function() {
    // Clear all meshes from scene
    for (var m = 0; m < meshes.length; m++) {
      scene.remove(meshes[m]);
    }
    meshes = [];
    animations = [];
    time = 0;
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
