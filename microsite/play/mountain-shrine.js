window.MountainShrine = (function() {
  'use strict';

  var scene;
  var camera;
  var prayerWheels = [];
  var prayerFlags = [];
  var incenseSmokeParticles = [];
  var bells = [];
  var swayingObjects = [];
  var elapsedTime = 0;

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    prayerWheels = [];
    prayerFlags = [];
    incenseSmokeParticles = [];
    bells = [];
    swayingObjects = [];
    elapsedTime = 0;

    // Cliff face - layered rock formations using BoxGeometry
    createCliffFace();

    // Carved stone steps leading up the mountain
    createCarvedSteps();

    // Main monastery hall with ornate roof
    createMonasteryHall();

    // Prayer wheels with spinning drums
    createPrayerWheels();

    // Stone stupa towers (cylindrical base + conical dome + spherical finial)
    createStupaTowers();

    // Prayer flags strung between poles using LineSegments
    createPrayerFlags();

    // Incense burner
    createIncenseBurner();

    // Meditation courtyard
    createCourt();

    // Stone carved doorway with relief panels
    createCarvedDoorway();

    // Hidden weapon cache room interior
    createWeaponCache();

    // Snow patches scattered about
    createSnowPatches();

    // Rock boulders
    createBoulders();

    // Pine trees on cliff
    createPineTrees();

    // Prayer flag mast poles
    createFlagMastPoles();

    // Stone water fountain
    createWaterFountain();

    // Hanging brass bells
    createHangingBells();
  };

  var createCliffFace = function() {
    var cliffMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
    var darkRockMaterial = new THREE.MeshPhongMaterial({ color: 0x4A4A4A });

    // Large layered cliff sections
    var baseCliff = new THREE.BoxGeometry(80, 120, 15);
    var cliffMesh = new THREE.Mesh(baseCliff, cliffMaterial);
    cliffMesh.position.set(-20, 40, -30);
    cliffMesh.castShadow = true;
    cliffMesh.receiveShadow = true;
    scene.add(cliffMesh);

    // Upper cliff layer (darker)
    var upperCliff = new THREE.BoxGeometry(85, 60, 12);
    var upperMesh = new THREE.Mesh(upperCliff, darkRockMaterial);
    upperMesh.position.set(-15, 95, -32);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    scene.add(upperMesh);

    // Side cliff formations
    var sideCliff = new THREE.BoxGeometry(25, 100, 18);
    var sideMesh1 = new THREE.Mesh(sideCliff, cliffMaterial);
    sideMesh1.position.set(-50, 50, -25);
    sideMesh1.rotation.z = 0.15;
    sideMesh1.castShadow = true;
    sideMesh1.receiveShadow = true;
    scene.add(sideMesh1);

    var sideMesh2 = new THREE.Mesh(sideCliff, darkRockMaterial);
    sideMesh2.position.set(35, 45, -28);
    sideMesh2.rotation.z = -0.12;
    sideMesh2.castShadow = true;
    sideMesh2.receiveShadow = true;
    scene.add(sideMesh2);
  };

  var createCarvedSteps = function() {
    var stepMaterial = new THREE.MeshPhongMaterial({ color: 0x9B8B7E });
    var stepWidth = 8;
    var stepHeight = 1.5;
    var stepDepth = 4;

    for (var i = 0; i < 18; i++) {
      var stepGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      var stepMesh = new THREE.Mesh(stepGeo, stepMaterial);
      stepMesh.position.set(-5, 10 + i * 5.5, -10 - i * 1.2);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      scene.add(stepMesh);
    }

    // Handrail on side of steps
    var railMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    for (var i = 0; i < 16; i++) {
      var railPost = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
      var railMesh = new THREE.Mesh(railPost, railMaterial);
      railMesh.position.set(-12, 15 + i * 5.5, -12 - i * 1.2);
      railMesh.castShadow = true;
      scene.add(railMesh);
    }
  };

  var createMonasteryHall = function() {
    var stoneMaterial = new THREE.MeshPhongMaterial({ color: 0xA0826D });
    var goldMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
    var redMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });

    // Main hall walls
    var hallGeo = new THREE.BoxGeometry(35, 25, 30);
    var hallMesh = new THREE.Mesh(hallGeo, stoneMaterial);
    hallMesh.position.set(0, 55, 5);
    hallMesh.castShadow = true;
    hallMesh.receiveShadow = true;
    scene.add(hallMesh);

    // Ornate roof - multiple layers
    var roofGeo1 = new THREE.BoxGeometry(40, 3, 32);
    var roofMesh1 = new THREE.Mesh(roofGeo1, redMaterial);
    roofMesh1.position.set(0, 77, 5);
    roofMesh1.castShadow = true;
    roofMesh1.receiveShadow = true;
    scene.add(roofMesh1);

    var roofGeo2 = new THREE.BoxGeometry(38, 2, 30);
    var roofMesh2 = new THREE.Mesh(roofGeo2, goldMaterial);
    roofMesh2.position.set(0, 80, 5);
    roofMesh2.castShadow = true;
    roofMesh2.receiveShadow = true;
    scene.add(roofMesh2);

    // Corner columns with CylinderGeometry
    var columnGeo = new THREE.CylinderGeometry(1.5, 1.8, 28, 12);
    var columnMaterial = new THREE.MeshPhongMaterial({ color: 0x8B7355 });

    var positions = [
      [-15, 55, -10],
      [15, 55, -10],
      [-15, 55, 20],
      [15, 55, 20]
    ];

    for (var i = 0; i < positions.length; i++) {
      var colMesh = new THREE.Mesh(columnGeo, columnMaterial);
      colMesh.position.set(positions[i][0], positions[i][1], positions[i][2]);
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      scene.add(colMesh);
    }

    // Roof ornament at top
    var ornamentGeo = new THREE.ConeGeometry(2.5, 4, 8);
    var ornamentMesh = new THREE.Mesh(ornamentGeo, goldMaterial);
    ornamentMesh.position.set(0, 84, 5);
    ornamentMesh.castShadow = true;
    scene.add(ornamentMesh);
  };

  var createPrayerWheels = function() {
    var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });

    var drumGeo = new THREE.CylinderGeometry(2.5, 2.5, 2, 12);
    var drumMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6B35 });

    var positions = [
      [-25, 40, 10],
      [-20, 40, 18],
      [20, 40, 15],
      [25, 40, 8]
    ];

    for (var i = 0; i < positions.length; i++) {
      var poleMesh = new THREE.Mesh(poleGeo, poleMaterial);
      poleMesh.position.copy(new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]));
      poleMesh.castShadow = true;
      scene.add(poleMesh);

      var drumMesh = new THREE.Mesh(drumGeo, drumMaterial);
      drumMesh.position.copy(new THREE.Vector3(positions[i][0], positions[i][1] + 8, positions[i][2]));
      drumMesh.castShadow = true;
      scene.add(drumMesh);

      prayerWheels.push({
        mesh: drumMesh,
        angularVelocity: 2 + Math.random() * 1.5
      });
    }
  };

  var createStupaTowers = function() {
    var baseMaterial = new THREE.MeshPhongMaterial({ color: 0xD4A574 });
    var domeMaterial = new THREE.MeshPhongMaterial({ color: 0xC19A6B });
    var finialMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });

    var stupaPositions = [
      { x: -30, y: 35, z: 25 },
      { x: 30, y: 35, z: 20 },
      { x: -5, y: 38, z: 35 }
    ];

    for (var i = 0; i < stupaPositions.length; i++) {
      var pos = stupaPositions[i];

      // Base (cylindrical)
      var baseGeo = new THREE.CylinderGeometry(3, 4, 2, 16);
      var baseMesh = new THREE.Mesh(baseGeo, baseMaterial);
      baseMesh.position.set(pos.x, pos.y, pos.z);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      scene.add(baseMesh);

      // Dome (conical)
      var domeGeo = new THREE.ConeGeometry(3, 8, 16);
      var domeMesh = new THREE.Mesh(domeGeo, domeMaterial);
      domeMesh.position.set(pos.x, pos.y + 6, pos.z);
      domeMesh.castShadow = true;
      domeMesh.receiveShadow = true;
      scene.add(domeMesh);

      // Finial (spherical)
      var finialGeo = new THREE.SphereGeometry(0.8, 8, 8);
      var finialMesh = new THREE.Mesh(finialGeo, finialMaterial);
      finialMesh.position.set(pos.x, pos.y + 14, pos.z);
      finialMesh.castShadow = true;
      scene.add(finialMesh);
    }
  };

  var createPrayerFlags = function() {
    var flagMaterial = new THREE.MeshPhongMaterial({ color: 0xFF4500 });
    var line1Material = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });

    var polePositions = [
      { start: [-35, 50, 8], end: [-20, 48, 15] },
      { start: [15, 52, 12], end: [35, 50, 8] },
      { start: [-10, 55, 25], end: [10, 53, 30] }
    ];

    for (var i = 0; i < polePositions.length; i++) {
      var pos = polePositions[i];

      // String line using LineSegments
      var points = [
        new THREE.Vector3(pos.start[0], pos.start[1], pos.start[2]),
        new THREE.Vector3(pos.end[0], pos.end[1], pos.end[2])
      ];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.LineSegments(lineGeo, line1Material);
      scene.add(line);

      // Small flag boxes along the string
      var numFlags = 12;
      for (var j = 0; j < numFlags; j++) {
        var t = j / numFlags;
        var flagX = pos.start[0] + t * (pos.end[0] - pos.start[0]);
        var flagY = pos.start[1] + t * (pos.end[1] - pos.start[1]);
        var flagZ = pos.start[2] + t * (pos.end[2] - pos.start[2]);

        var colors = [0xFF0000, 0xFFFF00, 0x0000FF, 0xFFFFFF, 0x32CD32];
        var flagColor = colors[j % colors.length];
        var flagMat = new THREE.MeshPhongMaterial({ color: flagColor });

        var flagGeo = new THREE.BoxGeometry(0.8, 0.4, 0.3);
        var flagMesh = new THREE.Mesh(flagGeo, flagMat);
        flagMesh.position.set(flagX, flagY, flagZ);
        flagMesh.castShadow = true;
        scene.add(flagMesh);

        prayerFlags.push({
          mesh: flagMesh,
          baseY: flagY,
          amplitude: 0.3,
          frequency: 2 + Math.random() * 1
        });
      }
    }
  };

  var createIncenseBurner = function() {
    var bronzeMaterial = new THREE.MeshPhongMaterial({ color: 0xCD7F32 });

    // Burner vessel (cylindrical)
    var vesselGeo = new THREE.CylinderGeometry(2.2, 2.5, 3, 16);
    var vesselMesh = new THREE.Mesh(vesselGeo, bronzeMaterial);
    vesselMesh.position.set(-2, 35, 12);
    vesselMesh.castShadow = true;
    vesselMesh.receiveShadow = true;
    scene.add(vesselMesh);

    // Rim (thin cylinder)
    var rimGeo = new THREE.CylinderGeometry(2.3, 2.3, 0.3, 16);
    var rimMesh = new THREE.Mesh(rimGeo, bronzeMaterial);
    rimMesh.position.set(-2, 37, 12);
    rimMesh.castShadow = true;
    scene.add(rimMesh);

    // Incense smoke particles
    var smokeColor = 0xDDDDDD;
    for (var i = 0; i < 8; i++) {
      var smokeMat = new THREE.MeshPhongMaterial({ color: smokeColor });
      var smokeGeo = new THREE.SphereGeometry(0.4, 4, 4);
      var smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
      smokeMesh.position.set(-2 + (Math.random() - 0.5) * 1.5, 38 + i * 2, 12 + (Math.random() - 0.5) * 0.8);
      smokeMesh.castShadow = false;
      scene.add(smokeMesh);

      incenseSmokeParticles.push({
        mesh: smokeMesh,
        startY: smokeMesh.position.y,
        riseSpeed: 1.5 + Math.random() * 0.8,
        driftX: (Math.random() - 0.5) * 0.5,
        driftZ: (Math.random() - 0.5) * 0.5,
        life: 0,
        maxLife: 4 + Math.random() * 2
      });
    }
  };

  var createCourt = function() {
    var courtMaterial = new THREE.MeshPhongMaterial({ color: 0x8B8680 });
    var courtGeo = new THREE.BoxGeometry(50, 0.5, 45);
    var courtMesh = new THREE.Mesh(courtGeo, courtMaterial);
    courtMesh.position.set(5, 30, 8);
    courtMesh.receiveShadow = true;
    scene.add(courtMesh);

    // Courtyard lines decoration
    var lineMaterial = new THREE.LineBasicMaterial({ color: 0x696969, linewidth: 2 });
    for (var i = 0; i < 5; i++) {
      var linePoints = [
        new THREE.Vector3(-20, 30.3, -15 + i * 10),
        new THREE.Vector3(30, 30.3, -15 + i * 10)
      ];
      var lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
      var line = new THREE.LineSegments(lineGeo, lineMaterial);
      scene.add(line);
    }
  };

  var createCarvedDoorway = function() {
    var frameMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var reliefMaterial = new THREE.MeshPhongMaterial({ color: 0x8B6F47 });

    // Door frame
    var frameGeo = new THREE.BoxGeometry(6, 10, 0.5);
    var frameMesh = new THREE.Mesh(frameGeo, frameMaterial);
    frameMesh.position.set(15, 55, 0.5);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    scene.add(frameMesh);

    // Carved relief panels
    var panelPositions = [
      { x: 12, y: 60, z: 1 },
      { x: 18, y: 60, z: 1 },
      { x: 12, y: 50, z: 1 },
      { x: 18, y: 50, z: 1 }
    ];

    for (var i = 0; i < panelPositions.length; i++) {
      var panelGeo = new THREE.BoxGeometry(2, 3, 0.3);
      var panelMesh = new THREE.Mesh(panelGeo, reliefMaterial);
      panelMesh.position.set(panelPositions[i].x, panelPositions[i].y, panelPositions[i].z);
      panelMesh.castShadow = true;
      scene.add(panelMesh);
    }
  };

  var createWeaponCache = function() {
    var roomMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
    var crateMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });

    // Hidden cache room floor
    var floorGeo = new THREE.BoxGeometry(15, 0.5, 20);
    var floorMesh = new THREE.Mesh(floorGeo, roomMaterial);
    floorMesh.position.set(20, 30, 5);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Walls
    var wallGeo = new THREE.BoxGeometry(0.5, 12, 20);
    var wallMesh1 = new THREE.Mesh(wallGeo, roomMaterial);
    wallMesh1.position.set(12.5, 36, 5);
    wallMesh1.castShadow = true;
    wallMesh1.receiveShadow = true;
    scene.add(wallMesh1);

    var wallMesh2 = new THREE.Mesh(wallGeo, roomMaterial);
    wallMesh2.position.set(27.5, 36, 5);
    wallMesh2.castShadow = true;
    wallMesh2.receiveShadow = true;
    scene.add(wallMesh2);

    // Weapon crate stacks
    var crateSize = 2;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var crateGeo = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
        var crateMesh = new THREE.Mesh(crateGeo, crateMaterial);
        crateMesh.position.set(15 + i * 3, 32 + j * 3, 0);
        crateMesh.castShadow = true;
        crateMesh.receiveShadow = true;
        scene.add(crateMesh);
      }
    }
  };

  var createSnowPatches = function() {
    var snowMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });

    var positions = [
      { x: -40, y: 42, z: -5 },
      { x: -35, y: 38, z: 18 },
      { x: 25, y: 40, z: -8 },
      { x: 10, y: 36, z: 28 },
      { x: -15, y: 35, z: 35 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var snowGeo = new THREE.BoxGeometry(6 + Math.random() * 4, 1.5, 5 + Math.random() * 3);
      var snowMesh = new THREE.Mesh(snowGeo, snowMaterial);
      snowMesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      snowMesh.receiveShadow = true;
      scene.add(snowMesh);
    }
  };

  var createBoulders = function() {
    var boulderMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });

    var positions = [
      { x: -45, y: 35, z: -15, scale: 2.5 },
      { x: 40, y: 34, z: 25, scale: 2 },
      { x: -25, y: 32, z: 30, scale: 1.8 },
      { x: 15, y: 33, z: -20, scale: 2.2 },
      { x: 0, y: 31, z: 40, scale: 1.5 },
      { x: -50, y: 36, z: 15, scale: 2.8 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var boulderGeo = new THREE.SphereGeometry(positions[i].scale, 6, 6);
      var boulderMesh = new THREE.Mesh(boulderGeo, boulderMaterial);
      boulderMesh.position.set(positions[i].x, positions[i].y, positions[i].z);
      boulderMesh.castShadow = true;
      boulderMesh.receiveShadow = true;
      scene.add(boulderMesh);
    }
  };

  var createPineTrees = function() {
    var trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
    var foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });

    var treePositions = [
      { x: -50, y: 50, z: -20 },
      { x: -40, y: 55, z: 5 },
      { x: 35, y: 48, z: 20 },
      { x: -30, y: 60, z: 25 },
      { x: 20, y: 52, z: -15 }
    ];

    for (var i = 0; i < treePositions.length; i++) {
      var pos = treePositions[i];

      // Trunk
      var trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 8, 8);
      var trunkMesh = new THREE.Mesh(trunkGeo, trunkMaterial);
      trunkMesh.position.set(pos.x, pos.y, pos.z);
      trunkMesh.castShadow = true;
      scene.add(trunkMesh);

      // Foliage (stacked cones)
      for (var j = 0; j < 3; j++) {
        var foliageGeo = new THREE.ConeGeometry(3 - j * 0.7, 4, 8);
        var foliageMesh = new THREE.Mesh(foliageGeo, foliageMaterial);
        foliageMesh.position.set(pos.x, pos.y + 4 + j * 2.5, pos.z);
        foliageMesh.castShadow = true;
        scene.add(foliageMesh);
      }
    }
  };

  var createFlagMastPoles = function() {
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });

    var polePositions = [
      { x: -40, y: 50, z: 8 },
      { x: 30, y: 50, z: 15 },
      { x: -5, y: 55, z: 28 }
    ];

    for (var i = 0; i < polePositions.length; i++) {
      var poleGeo = new THREE.CylinderGeometry(0.5, 0.6, 18, 8);
      var poleMesh = new THREE.Mesh(poleGeo, poleMaterial);
      poleMesh.position.set(polePositions[i].x, polePositions[i].y, polePositions[i].z);
      poleMesh.castShadow = true;
      scene.add(poleMesh);
    }
  };

  var createWaterFountain = function() {
    var stoneMaterial = new THREE.MeshPhongMaterial({ color: 0x9B9B7A });
    var bronzeMaterial = new THREE.MeshPhongMaterial({ color: 0xCD7F32 });

    // Basin (cylindrical)
    var basinGeo = new THREE.CylinderGeometry(3, 3.5, 1.5, 16);
    var basinMesh = new THREE.Mesh(basinGeo, stoneMaterial);
    basinMesh.position.set(0, 33, 15);
    basinMesh.castShadow = true;
    basinMesh.receiveShadow = true;
    scene.add(basinMesh);

    // Spout (small cylinder reaching up)
    var spoutGeo = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
    var spoutMesh = new THREE.Mesh(spoutGeo, bronzeMaterial);
    spoutMesh.position.set(0, 35.5, 15);
    spoutMesh.castShadow = true;
    scene.add(spoutMesh);

    // Water stream (falling spheres)
    for (var i = 0; i < 3; i++) {
      var dropGeo = new THREE.SphereGeometry(0.2, 4, 4);
      var waterMat = new THREE.MeshPhongMaterial({ color: 0x4DD0E1 });
      var dropMesh = new THREE.Mesh(dropGeo, waterMat);
      dropMesh.position.set(0, 35 - i * 0.8, 15);
      scene.add(dropMesh);
    }
  };

  var createHangingBells = function() {
    var brassMaterial = new THREE.MeshPhongMaterial({ color: 0xB8860B });

    var bellPositions = [
      { x: -15, y: 78, z: 0 },
      { x: 0, y: 78, z: 0 },
      { x: 15, y: 78, z: 0 },
      { x: -10, y: 75, z: 12 },
      { x: 10, y: 75, z: 12 }
    ];

    for (var i = 0; i < bellPositions.length; i++) {
      var bellGeo = new THREE.SphereGeometry(0.6, 8, 8);
      var bellMesh = new THREE.Mesh(bellGeo, brassMaterial);
      bellMesh.position.copy(new THREE.Vector3(bellPositions[i].x, bellPositions[i].y, bellPositions[i].z));
      bellMesh.castShadow = true;
      scene.add(bellMesh);

      bells.push({
        mesh: bellMesh,
        baseX: bellMesh.position.x,
        baseZ: bellMesh.position.z,
        amplitude: 0.15,
        frequency: 1.2 + Math.random() * 0.5
      });
    }
  };

  var update = function(delta) {
    elapsedTime += delta;

    // Spin prayer wheels
    for (var i = 0; i < prayerWheels.length; i++) {
      prayerWheels[i].mesh.rotation.x += prayerWheels[i].angularVelocity * delta;
    }

    // Flutter prayer flags
    for (var i = 0; i < prayerFlags.length; i++) {
      var flag = prayerFlags[i];
      var newY = flag.baseY + Math.sin(elapsedTime * flag.frequency) * flag.amplitude;
      flag.mesh.position.y = newY;
    }

    // Update incense smoke particles
    for (var i = 0; i < incenseSmokeParticles.length; i++) {
      var smoke = incenseSmokeParticles[i];
      smoke.life += delta;
      smoke.mesh.position.y += smoke.riseSpeed * delta;
      smoke.mesh.position.x += smoke.driftX * delta;
      smoke.mesh.position.z += smoke.driftZ * delta;

      var opacity = 1 - (smoke.life / smoke.maxLife);
      smoke.mesh.material.opacity = opacity * 0.6;

      if (smoke.life >= smoke.maxLife) {
        scene.remove(smoke.mesh);
        incenseSmokeParticles.splice(i, 1);
        i--;

        // Create new smoke particle
        var newSmokeMat = new THREE.MeshPhongMaterial({ color: 0xDDDDDD });
        var newSmokeGeo = new THREE.SphereGeometry(0.4, 4, 4);
        var newSmokeMesh = new THREE.Mesh(newSmokeGeo, newSmokeMat);
        newSmokeMesh.position.set(-2 + (Math.random() - 0.5) * 1.5, 38, 12 + (Math.random() - 0.5) * 0.8);
        newSmokeMesh.castShadow = false;
        scene.add(newSmokeMesh);

        incenseSmokeParticles.push({
          mesh: newSmokeMesh,
          startY: newSmokeMesh.position.y,
          riseSpeed: 1.5 + Math.random() * 0.8,
          driftX: (Math.random() - 0.5) * 0.5,
          driftZ: (Math.random() - 0.5) * 0.5,
          life: 0,
          maxLife: 4 + Math.random() * 2
        });
      }
    }

    // Sway hanging bells
    for (var i = 0; i < bells.length; i++) {
      var bell = bells[i];
      var swayX = bell.baseX + Math.sin(elapsedTime * bell.frequency) * bell.amplitude;
      var swayZ = bell.baseZ + Math.cos(elapsedTime * bell.frequency * 0.7) * bell.amplitude * 0.7;
      bell.mesh.position.x = swayX;
      bell.mesh.position.z = swayZ;
    }
  };

  var reset = function() {
    prayerWheels = [];
    prayerFlags = [];
    incenseSmokeParticles = [];
    bells = [];
    swayingObjects = [];
    elapsedTime = 0;

    // Clear all objects from scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Reinitialize
    init(scene, camera);
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
