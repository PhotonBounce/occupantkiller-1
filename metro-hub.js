window.MetroHub = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var departureBoard = null;
  var emergencyLights = [];
  var generatorMeshes = [];
  var shakeableObjects = [];
  var time = 0;
  var boardFlicker = 0;
  var emergencyPulse = 0;
  var generatorVibration = 0;

  function createGrandVault() {
    var vaultGroup = new THREE.Group();

    // Central arched vault ceiling sections
    var vaultHeight = 25;
    var vaultLength = 80;
    var vaultWidth = 50;

    // Main central vault arch
    var archSegments = 6;
    for (var i = 0; i < archSegments; i++) {
      var archBox = new THREE.Mesh(
        new THREE.BoxGeometry(vaultWidth * 0.9, 3, vaultLength / archSegments),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 })
      );
      archBox.position.y = 20 + Math.sin((i / archSegments) * Math.PI) * 4;
      archBox.position.z = (vaultLength / 2) - (i * vaultLength / archSegments) - 5;
      archBox.castShadow = true;
      archBox.receiveShadow = true;
      vaultGroup.add(archBox);
      meshes.push(archBox);
    }

    // Side vault ribs
    for (var i = 0; i < 4; i++) {
      var ribBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, vaultHeight, vaultLength),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })
      );
      ribBox.position.x = (vaultWidth / 2 - 2) * (i < 2 ? 1 : -1);
      ribBox.position.y = vaultHeight / 2;
      ribBox.castShadow = true;
      ribBox.receiveShadow = true;
      vaultGroup.add(ribBox);
      meshes.push(ribBox);
    }

    // Floor platform
    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(vaultWidth, 0.5, vaultLength),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 1.0, metalness: 0.1 })
    );
    floor.position.y = 0.25;
    floor.receiveShadow = true;
    vaultGroup.add(floor);
    meshes.push(floor);

    return vaultGroup;
  }

  function createPlatforms() {
    var platformGroup = new THREE.Group();

    // Multiple platform levels
    var platformLength = 60;
    var platformWidth = 12;
    var platformHeight = 2;

    for (var p = 0; p < 3; p++) {
      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(platformWidth, platformHeight, platformLength),
        new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7, metalness: 0.2 })
      );
      platform.position.x = (p - 1) * 20;
      platform.position.y = 2;
      platform.position.z = 0;
      platform.castShadow = true;
      platform.receiveShadow = true;
      platformGroup.add(platform);
      meshes.push(platform);
    }

    // Rail track pairs
    var trackLength = 65;
    for (var t = 0; t < 6; t++) {
      var rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, trackLength),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.9 })
      );
      rail.position.x = -25 + (t * 10);
      rail.position.y = 1.5;
      rail.position.z = 0;
      rail.castShadow = true;
      rail.receiveShadow = true;
      platformGroup.add(rail);
      meshes.push(rail);
    }

    return platformGroup;
  }

  function createColumns() {
    var columnGroup = new THREE.Group();

    var columnPositions = [
      { x: -20, z: -25 }, { x: -20, z: 0 }, { x: -20, z: 25 },
      { x: 20, z: -25 }, { x: 20, z: 0 }, { x: 20, z: 25 }
    ];

    columnPositions.forEach(function(pos) {
      // Main column shaft
      var columnShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 22, 8),
        new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.7 })
      );
      columnShaft.position.x = pos.x;
      columnShaft.position.y = 11;
      columnShaft.position.z = pos.z;
      columnShaft.castShadow = true;
      columnShaft.receiveShadow = true;
      columnGroup.add(columnShaft);
      meshes.push(columnShaft);

      // Decorative rings
      for (var r = 0; r < 5; r++) {
        var ring = new THREE.Mesh(
          new THREE.BoxGeometry(3.5, 0.6, 3.5),
          new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6 })
        );
        ring.position.x = pos.x;
        ring.position.y = 3 + (r * 4);
        ring.position.z = pos.z;
        ring.castShadow = true;
        ring.receiveShadow = true;
        columnGroup.add(ring);
        meshes.push(ring);
      }
    });

    return columnGroup;
  }

  function createClockTower() {
    var towerGroup = new THREE.Group();

    // Tower base and shaft
    var towerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2.5, 18, 8),
      new THREE.MeshStandardMaterial({ color: 0x7a7a7a, roughness: 0.8 })
    );
    towerShaft.position.x = -35;
    towerShaft.position.y = 9;
    towerShaft.position.z = -30;
    towerShaft.castShadow = true;
    towerShaft.receiveShadow = true;
    towerGroup.add(towerShaft);
    meshes.push(towerShaft);

    // Clock face frame
    var clockFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 })
    );
    clockFrame.position.x = -35;
    clockFrame.position.y = 18;
    clockFrame.position.z = -27;
    clockFrame.castShadow = true;
    towerGroup.add(clockFrame);
    meshes.push(clockFrame);

    // Clock face (emissive)
    var clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 0.8 })
    );
    clockFace.position.x = -35;
    clockFace.position.y = 18;
    clockFace.position.z = -26;
    clockFace.castShadow = true;
    towerGroup.add(clockFace);
    meshes.push(clockFace);

    return towerGroup;
  }

  function createDepartureBoard() {
    var boardGroup = new THREE.Group();

    // Large board structure
    var boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(20, 8, 1),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })
    );
    boardFrame.position.x = 0;
    boardFrame.position.y = 14;
    boardFrame.position.z = -38;
    boardFrame.castShadow = true;
    boardGroup.add(boardFrame);
    meshes.push(boardFrame);

    // Display surface (flickering emissive)
    var boardDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(19, 7, 0.1),
      new THREE.MeshStandardMaterial({
        color: 0x001100,
        emissive: 0x00ff00,
        emissiveIntensity: 0.6,
        roughness: 0.3
      })
    );
    boardDisplay.position.x = 0;
    boardDisplay.position.y = 14;
    boardDisplay.position.z = -37;
    boardGroup.add(boardDisplay);
    departureBoard = boardDisplay;
    meshes.push(boardDisplay);

    // Frame edges
    for (var e = 0; e < 4; e++) {
      var edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
      );
      if (e < 2) {
        edge.position.y = 14 + (7 * (e === 0 ? 0.5 : -0.5));
        edge.position.x = 9.5 * (e === 0 ? 1 : -1);
      } else {
        edge.position.x = 10 * (e === 2 ? 1 : -1);
        edge.position.y = 14;
      }
      edge.position.z = -37.5;
      boardGroup.add(edge);
      meshes.push(edge);
    }

    return boardGroup;
  }

  function createKiosks() {
    var kioskGroup = new THREE.Group();

    var kioskPositions = [
      { x: 15, z: 10 }, { x: 15, z: -10 }, { x: -15, z: 10 }, { x: -15, z: -10 }
    ];

    kioskPositions.forEach(function(pos) {
      // Kiosk base
      var kioskBox = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 })
      );
      kioskBox.position.x = pos.x;
      kioskBox.position.y = 2;
      kioskBox.position.z = pos.z;
      kioskBox.castShadow = true;
      kioskBox.receiveShadow = true;
      kioskGroup.add(kioskBox);
      meshes.push(kioskBox);

      // Kiosk counter top
      var counter = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.6, 6.5),
        new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.3 })
      );
      counter.position.x = pos.x;
      counter.position.y = 4.3;
      counter.position.z = pos.z;
      counter.castShadow = true;
      kioskGroup.add(counter);
      meshes.push(counter);
    });

    return kioskGroup;
  }

  function createEscalators() {
    var escalatorGroup = new THREE.Group();

    var escalatorCount = 3;
    for (var e = 0; e < escalatorCount; e++) {
      // Escalator steps
      var stepCount = 8;
      for (var s = 0; s < stepCount; s++) {
        var step = new THREE.Mesh(
          new THREE.BoxGeometry(3, 0.4, 2),
          new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8 })
        );
        step.position.x = -25 + (e * 25);
        step.position.y = 1 + (s * 1.5);
        step.position.z = 25;
        step.castShadow = true;
        step.receiveShadow = true;
        escalatorGroup.add(step);
        meshes.push(step);
      }

      // Escalator railings
      var railing = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.4, 14),
        new THREE.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 })
      );
      railing.position.x = -25 + (e * 25);
      railing.position.y = 13;
      railing.position.z = 25;
      railing.castShadow = true;
      escalatorGroup.add(railing);
      meshes.push(railing);
    }

    return escalatorGroup;
  }

  function createBunkCots() {
    var cotGroup = new THREE.Group();

    // Rows of emergency bunk cots
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 6; col++) {
        var cotFrame = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.3, 4),
          new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.8 })
        );
        cotFrame.position.x = -20 + (col * 7);
        cotFrame.position.y = 0.5;
        cotFrame.position.z = -15 + (row * 12);
        cotFrame.castShadow = true;
        cotFrame.receiveShadow = true;
        cotGroup.add(cotFrame);
        meshes.push(cotFrame);

        // Cot legs
        for (var leg = 0; leg < 2; leg++) {
          var legBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.5, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
          );
          legBox.position.x = cotFrame.position.x + (leg === 0 ? -0.8 : 0.8);
          legBox.position.y = 0.25;
          legBox.position.z = cotFrame.position.z;
          cotGroup.add(legBox);
          meshes.push(legBox);
        }
      }
    }

    return cotGroup;
  }

  function createSupplyDepot() {
    var depotGroup = new THREE.Group();

    // Stacked supply crates
    for (var stack = 0; stack < 3; stack++) {
      for (var layer = 0; layer < 4; layer++) {
        var crate = new THREE.Mesh(
          new THREE.BoxGeometry(3, 2, 3),
          new THREE.MeshStandardMaterial({ color: 0xaa8844, roughness: 0.9 })
        );
        crate.position.x = 25 + (stack * 4);
        crate.position.y = 1 + (layer * 2.2);
        crate.position.z = -20;
        crate.castShadow = true;
        crate.receiveShadow = true;
        depotGroup.add(crate);
        meshes.push(crate);
      }
    }

    // Shelving unit
    for (var shelf = 0; shelf < 5; shelf++) {
      var shelfPlank = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.4, 3),
        new THREE.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.8 })
      );
      shelfPlank.position.x = 25;
      shelfPlank.position.y = 0.5 + (shelf * 3);
      shelfPlank.position.z = -10;
      shelfPlank.castShadow = true;
      depotGroup.add(shelfPlank);
      meshes.push(shelfPlank);
    }

    return depotGroup;
  }

  function createCommandPost() {
    var commandGroup = new THREE.Group();

    // Command table
    var tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.6, 5),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7, metalness: 0.3 })
    );
    tableTop.position.x = -30;
    tableTop.position.y = 4.5;
    tableTop.position.z = 20;
    tableTop.castShadow = true;
    commandGroup.add(tableTop);
    meshes.push(tableTop);

    // Table legs
    for (var leg = 0; leg < 4; leg++) {
      var legBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
      );
      legBox.position.x = tableTop.position.x + (leg % 2 === 0 ? -3.5 : 3.5);
      legBox.position.y = 2.5;
      legBox.position.z = tableTop.position.z + (leg < 2 ? -2 : 2);
      commandGroup.add(legBox);
      meshes.push(legBox);
    }

    // Indicator light spheres
    for (var i = 0; i < 5; i++) {
      var indicatorLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({
          color: i === 0 ? 0xff0000 : 0x00ff00,
          emissive: i === 0 ? 0xff0000 : 0x00ff00,
          emissiveIntensity: 0.9
        })
      );
      indicatorLight.position.x = -30 + (i * 1.5) - 3;
      indicatorLight.position.y = 5.5;
      indicatorLight.position.z = 20;
      commandGroup.add(indicatorLight);
      meshes.push(indicatorLight);
    }

    // Radio antenna (using LineSegments)
    var antennaGeometry = new THREE.BufferGeometry();
    var antennaPoints = [
      new THREE.Vector3(-30, 5.5, 20),
      new THREE.Vector3(-30, 8, 20),
      new THREE.Vector3(-28, 9, 22)
    ];
    antennaGeometry.setFromPoints(antennaPoints);
    var antennaLine = new THREE.LineSegments(
      antennaGeometry,
      new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 })
    );
    commandGroup.add(antennaLine);

    return commandGroup;
  }

  function createPowerJunction() {
    var junctionGroup = new THREE.Group();

    // Main junction box
    var junctionBox = new THREE.Mesh(
      new THREE.BoxGeometry(5, 6, 2),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8, metalness: 0.4 })
    );
    junctionBox.position.x = 30;
    junctionBox.position.y = 3;
    junctionBox.position.z = 30;
    junctionBox.castShadow = true;
    junctionGroup.add(junctionBox);
    meshes.push(junctionBox);

    // Circuit panels
    for (var p = 0; p < 4; p++) {
      var panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 })
      );
      panel.position.x = 30 + (p < 2 ? -1.5 : 1.5);
      panel.position.y = 2 + (p % 2) * 2;
      panel.position.z = 31;
      junctionGroup.add(panel);
      meshes.push(panel);
    }

    return junctionGroup;
  }

  function createBarricade() {
    var barricadeGroup = new THREE.Group();

    // Overturned benches
    for (var b = 0; b < 5; b++) {
      var bench = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.5, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 })
      );
      bench.position.x = -40 + (b * 3);
      bench.position.y = 1.5 + (b * 0.3);
      bench.position.z = -38;
      bench.rotation.z = 0.3 * b;
      bench.castShadow = true;
      bench.receiveShadow = true;
      barricadeGroup.add(bench);
      meshes.push(bench);
    }

    // Metal barriers
    for (var bar = 0; bar < 4; bar++) {
      var barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 6),
        new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.5, metalness: 0.8 })
      );
      barrier.position.x = -50 + (bar * 4);
      barrier.position.y = 1.5;
      barrier.position.z = -40;
      barrier.castShadow = true;
      barricadeGroup.add(barrier);
      meshes.push(barrier);
    }

    return barricadeGroup;
  }

  function createLuggage() {
    var luggageGroup = new THREE.Group();

    // Scattered luggage pile
    var colors = [0xaa3333, 0x3333aa, 0xaa8833, 0x33aa33];
    for (var i = 0; i < 15; i++) {
      var luggage = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.8 + Math.random() * 1.2,
          0.6 + Math.random() * 1,
          0.5 + Math.random() * 0.8
        ),
        new THREE.MeshStandardMaterial({ color: colors[i % 4], roughness: 0.8 })
      );
      luggage.position.x = -25 + Math.random() * 8;
      luggage.position.y = 0.5;
      luggage.position.z = 35 + Math.random() * 6;
      luggage.rotation.z = Math.random() * 0.5;
      luggage.castShadow = true;
      luggage.receiveShadow = true;
      luggageGroup.add(luggage);
      meshes.push(luggage);
      shakeableObjects.push(luggage);
    }

    return luggageGroup;
  }

  function createWaterSupply() {
    var waterGroup = new THREE.Group();

    // Water drums
    for (var d = 0; d < 6; d++) {
      var drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x0055aa, roughness: 0.7, metalness: 0.6 })
      );
      drum.position.x = 35 + (d % 3) * 1.5;
      drum.position.y = 0.75;
      drum.position.z = 5 + Math.floor(d / 3) * 2;
      drum.castShadow = true;
      drum.receiveShadow = true;
      waterGroup.add(drum);
      meshes.push(drum);
    }

    return waterGroup;
  }

  function createEmergencyLighting() {
    var lightGroup = new THREE.Group();

    // Emergency light strips (red-orange emissive)
    var positions = [
      { x: -40, y: 22, z: -35 },
      { x: 0, y: 22, z: -35 },
      { x: 40, y: 22, z: -35 },
      { x: -40, y: 22, z: 35 },
      { x: 0, y: 22, z: 35 },
      { x: 40, y: 22, z: 35 }
    ];

    positions.forEach(function(pos) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.5, 1),
        new THREE.MeshStandardMaterial({
          color: 0xff3300,
          emissive: 0xff3300,
          emissiveIntensity: 0.7
        })
      );
      strip.position.copy(pos);
      lightGroup.add(strip);
      emergencyLights.push(strip);
      meshes.push(strip);
    });

    return lightGroup;
  }

  function createSleepingCivilians() {
    var civilianGroup = new THREE.Group();

    // Sleeping civilian shapes (huddled)
    for (var c = 0; c < 8; c++) {
      var body = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 })
      );
      body.position.x = -30 + Math.random() * 15;
      body.position.y = 0.8;
      body.position.z = -30 + Math.random() * 15;
      body.rotation.z = (Math.random() - 0.5) * 0.4;
      body.castShadow = true;
      body.receiveShadow = true;
      civilianGroup.add(body);
      meshes.push(body);
      shakeableObjects.push(body);
    }

    return civilianGroup;
  }

  function createGenerator() {
    var generatorGroup = new THREE.Group();

    // Generator main unit
    var generatorBody = new THREE.Mesh(
      new THREE.BoxGeometry(4, 2.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8, metalness: 0.3 })
    );
    generatorBody.position.x = 40;
    generatorBody.position.y = 1.5;
    generatorBody.position.z = -30;
    generatorBody.castShadow = true;
    generatorBody.receiveShadow = true;
    generatorGroup.add(generatorBody);
    generatorMeshes.push(generatorBody);
    meshes.push(generatorBody);

    // Exhaust cylinder
    var exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.8 })
    );
    exhaust.position.x = 40;
    exhaust.position.y = 4;
    exhaust.position.z = -30;
    exhaust.castShadow = true;
    generatorGroup.add(exhaust);
    generatorMeshes.push(exhaust);
    meshes.push(exhaust);

    return generatorGroup;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;

    // Build all components
    var vault = createGrandVault();
    scene.add(vault);

    var platforms = createPlatforms();
    scene.add(platforms);

    var columns = createColumns();
    scene.add(columns);

    var tower = createClockTower();
    scene.add(tower);

    var board = createDepartureBoard();
    scene.add(board);

    var kiosks = createKiosks();
    scene.add(kiosks);

    var escalators = createEscalators();
    scene.add(escalators);

    var cots = createBunkCots();
    scene.add(cots);

    var depot = createSupplyDepot();
    scene.add(depot);

    var command = createCommandPost();
    scene.add(command);

    var junction = createPowerJunction();
    scene.add(junction);

    var barricade = createBarricade();
    scene.add(barricade);

    var luggage = createLuggage();
    scene.add(luggage);

    var water = createWaterSupply();
    scene.add(water);

    var lighting = createEmergencyLighting();
    scene.add(lighting);

    var civilians = createSleepingCivilians();
    scene.add(civilians);

    var generator = createGenerator();
    scene.add(generator);

    // Add ambient and point light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xff3300, 0.8, 100);
    pointLight.position.set(0, 20, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
    lights.push(pointLight);
  }

  function update(delta) {
    time += delta;
    boardFlicker += delta;
    emergencyPulse += delta;
    generatorVibration += delta;

    // Departure board flicker and color cycling
    if (departureBoard) {
      var flicker = Math.sin(boardFlicker * 4) * 0.3 + 0.7;
      departureBoard.material.emissiveIntensity = flicker;
      if (boardFlicker > 2) {
        boardFlicker = 0;
      }
    }

    // Emergency light pulse
    emergencyLights.forEach(function(light) {
      var pulse = Math.sin(emergencyPulse * 3) * 0.4 + 0.6;
      light.material.emissiveIntensity = pulse;
    });
    if (emergencyPulse > 2 * Math.PI) {
      emergencyPulse = 0;
    }

    // Generator vibration
    generatorMeshes.forEach(function(mesh) {
      var vibration = Math.sin(generatorVibration * 8) * 0.05;
      mesh.position.y += vibration;
    });

    // Small object shake from generator rumble
    shakeableObjects.forEach(function(obj) {
      var shake = Math.sin(time * 7) * 0.02;
      obj.position.y += shake;
    });
  }

  function reset() {
    time = 0;
    boardFlicker = 0;
    emergencyPulse = 0;
    generatorVibration = 0;
    meshes = [];
    lights = [];
    emergencyLights = [];
    generatorMeshes = [];
    shakeableObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
