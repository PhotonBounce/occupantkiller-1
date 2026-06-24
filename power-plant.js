var window = window || {};

window.PowerPlant = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var hudElement = null;
  var gameState = {
    coreTemperature: 2400,
    coolantPressure: 8.5,
    powerOutput: 950,
    alarmLevel: 2,
    securityBreaches: 7,
    maxBreaches: 10
  };
  var coolingTowers = [];
  var reactorDome = null;
  var turbineHall = null;
  var fuelPool = null;
  var warningLights = [];
  var alarmLights = [];
  var coolantPipes = [];
  var pressureGauges = [];
  var generatorUnits = [];
  var transformers = [];
  var fenceSegments = [];
  var steamParticles = [];
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastMKeyTime = 0;
  var hudVisible = true;

  function createCoolingTower(x, z, isLeft) {
    var group = new THREE.Group();

    // Main tower body - large cylinder narrowing at top
    var baseRadius = 4;
    var topRadius = 2.5;
    var height = 16;
    var radialSegments = 24;

    var towerGeometry = new THREE.CylinderGeometry(topRadius, baseRadius, height, radialSegments);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.7,
      metalness: 0.1
    });
    var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    group.add(towerMesh);

    // Internal vent structure (darker inner cylinder)
    var ventGeometry = new THREE.CylinderGeometry(1.8, 2.8, height - 1, radialSegments);
    var ventMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.8,
      metalness: 0.2
    });
    var ventMesh = new THREE.Mesh(ventGeometry, ventMaterial);
    ventMesh.position.y = 0.5;
    ventMesh.castShadow = true;
    ventMesh.receiveShadow = true;
    group.add(ventMesh);

    // Top lip/ring
    var rimGeometry = new THREE.CylinderGeometry(2.6, 2.4, 0.4, radialSegments);
    var rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.6,
      metalness: 0.4
    });
    var rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.position.y = height / 2 + 0.2;
    rimMesh.castShadow = true;
    rimMesh.receiveShadow = true;
    group.add(rimMesh);

    // Base foundation ring
    var foundationGeometry = new THREE.CylinderGeometry(baseRadius + 0.5, baseRadius + 0.8, 0.8, radialSegments);
    var foundationMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.9,
      metalness: 0.1
    });
    var foundationMesh = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundationMesh.position.y = -height / 2 - 0.4;
    foundationMesh.castShadow = true;
    foundationMesh.receiveShadow = true;
    group.add(foundationMesh);

    group.position.set(x, 0, z);
    group.coolingTowerData = {
      baseRadius: baseRadius,
      topRadius: topRadius,
      height: height,
      steamOffset: 0,
      isLeft: isLeft
    };

    scene.add(group);
    sceneObjects.push(group);
    coolingTowers.push(group);
    return group;
  }

  function createReactorDome() {
    var group = new THREE.Group();

    // Main dome sphere
    var domeGeometry = new THREE.SphereGeometry(3.5, 32, 24);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 0.5,
      metalness: 0.6
    });
    var domeMesh = new THREE.Mesh(domeGeometry, domeMaterial);
    domeMesh.castShadow = true;
    domeMesh.receiveShadow = true;
    domeMesh.scale.y = 1.2;
    group.add(domeMesh);

    // Containment ring around base
    var ringGeometry = new THREE.CylinderGeometry(4, 4, 0.6, 32);
    var ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.8
    });
    var ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.position.y = -0.3;
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    group.add(ringMesh);

    // Upper dome cap (darker)
    var capGeometry = new THREE.SphereGeometry(3.4, 32, 12);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6,
      metalness: 0.5,
      emissive: 0x330000
    });
    var capMesh = new THREE.Mesh(capGeometry, capMaterial);
    capMesh.position.y = 2;
    capMesh.scale.y = 1;
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    group.add(capMesh);

    // Cooling vents on sides (small cylinders)
    var ventPositions = [
      { x: 3, y: 0.5, z: 0 },
      { x: -3, y: 0.5, z: 0 },
      { x: 0, y: 0.5, z: 3 },
      { x: 0, y: 0.5, z: -3 }
    ];

    ventPositions.forEach(function(pos) {
      var ventGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1, 12);
      var ventMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8
      });
      var ventMesh = new THREE.Mesh(ventGeometry, ventMaterial);
      ventMesh.position.set(pos.x, pos.y, pos.z);
      ventMesh.castShadow = true;
      ventMesh.receiveShadow = true;
      group.add(ventMesh);
    });

    group.position.set(0, 3, 0);
    group.reactorDomeData = {
      warningIntensity: 0,
      originalEmissive: 0x330000
    };

    scene.add(group);
    sceneObjects.push(group);
    reactorDome = group;
    return group;
  }

  function createTurbineHall() {
    var group = new THREE.Group();

    // Main building box - large rectangular structure
    var hallGeometry = new THREE.BoxGeometry(12, 8, 16);
    var hallMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.6,
      metalness: 0.3
    });
    var hallMesh = new THREE.Mesh(hallGeometry, hallMaterial);
    hallMesh.position.y = 4;
    hallMesh.castShadow = true;
    hallMesh.receiveShadow = true;
    group.add(hallMesh);

    // Large windows (6 x 2 grid)
    var windowSize = 1.8;
    var windowSpacing = 2;
    for (var wx = 0; wx < 3; wx++) {
      for (var wy = 0; wy < 2; wy++) {
        var windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.2);
        var windowMaterial = new THREE.MeshStandardMaterial({
          color: 0x4488FF,
          roughness: 0.3,
          metalness: 0.7,
          transparent: true,
          opacity: 0.8
        });
        var windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
        windowMesh.position.set(
          -5 + wx * windowSpacing,
          5 + wy * 2.5,
          8.1
        );
        windowMesh.castShadow = false;
        windowMesh.receiveShadow = false;
        group.add(windowMesh);
      }
    }

    // Turbine section (internal - visible through windows)
    var turbineGeometry = new THREE.CylinderGeometry(2, 2, 6, 16);
    var turbineMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7,
      metalness: 0.8
    });
    var turbineMesh = new THREE.Mesh(turbineGeometry, turbineMaterial);
    turbineMesh.position.set(0, 4, 2);
    turbineMesh.rotation.z = Math.PI / 2;
    turbineMesh.castShadow = true;
    turbineMesh.receiveShadow = true;
    group.add(turbineMesh);

    // Turbine blades (cones positioned around cylinder)
    for (var b = 0; b < 3; b++) {
      var bladeGeometry = new THREE.ConeGeometry(1.2, 2, 8);
      var bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.6
      });
      var bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
      bladeMesh.position.set(0, 4 + (1.5 * (b - 1)), 2);
      bladeMesh.rotation.z = Math.PI / 2;
      bladeMesh.castShadow = true;
      bladeMesh.receiveShadow = true;
      group.add(bladeMesh);
    }

    group.position.set(15, 0, -5);
    group.turbineHallData = {
      vibrationAmount: 0,
      originalY: 4
    };

    scene.add(group);
    sceneObjects.push(group);
    turbineHall = group;
    return group;
  }

  function createFuelPool() {
    var group = new THREE.Group();

    // Pool basin (large shallow cylinder)
    var basinGeometry = new THREE.CylinderGeometry(6, 6, 2, 32);
    var basinMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    var basinMesh = new THREE.Mesh(basinGeometry, basinMaterial);
    basinMesh.position.y = 1;
    basinMesh.castShadow = true;
    basinMesh.receiveShadow = true;
    group.add(basinMesh);

    // Water surface with glow (flat plane)
    var waterGeometry = new THREE.CylinderGeometry(5.8, 5.8, 0.1, 32);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488FF,
      emissive: 0x2244FF,
      roughness: 0.2,
      metalness: 0.3
    });
    var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.position.y = 2.05;
    waterMesh.castShadow = false;
    waterMesh.receiveShadow = true;
    group.add(waterMesh);

    // Walls (inner ring)
    var wallGeometry = new THREE.CylinderGeometry(5.5, 5.5, 1.8, 32);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1
    });
    var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.y = 1;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);

    // Support columns
    var columnGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 12);
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.6
    });

    var columnPositions = [
      { x: 4.5, z: 4.5 },
      { x: -4.5, z: 4.5 },
      { x: 4.5, z: -4.5 },
      { x: -4.5, z: -4.5 }
    ];

    columnPositions.forEach(function(pos) {
      var columnMesh = new THREE.Mesh(columnGeometry, columnMaterial);
      columnMesh.position.set(pos.x, 1, pos.z);
      columnMesh.castShadow = true;
      columnMesh.receiveShadow = true;
      group.add(columnMesh);
    });

    group.position.set(-18, 0, 8);
    group.fuelPoolData = {
      shimmerAmount: 0,
      originalEmissive: 0x2244FF
    };

    scene.add(group);
    sceneObjects.push(group);
    fuelPool = group;
    return group;
  }

  function createCoolantPipes() {
    // Network of large orange/hot colored pipes throughout plant
    var pipePositions = [
      { start: { x: 0, y: 2, z: 0 }, end: { x: 15, y: 2, z: -5 }, label: 'main' },
      { start: { x: 0, y: 2, z: 0 }, end: { x: -8, y: 2, z: 10 }, label: 'left' },
      { start: { x: 15, y: 2, z: -5 }, end: { x: 15, y: 5, z: -5 }, label: 'up1' },
      { start: { x: -8, y: 2, z: 10 }, end: { x: -18, y: 2, z: 8 }, label: 'pool' },
      { start: { x: -8, y: 2, z: 10 }, end: { x: -12, y: 3, z: 15 }, label: 'gen' }
    ];

    pipePositions.forEach(function(pipeData) {
      var start = pipeData.start;
      var end = pipeData.end;

      var length = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2) +
        Math.pow(end.z - start.z, 2)
      );

      var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, length, 16);
      var pipeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF8800,
        roughness: 0.4,
        metalness: 0.7,
        emissive: 0x662200
      });
      var pipeMesh = new THREE.Mesh(pipeGeometry, pipeMaterial);

      var midX = (start.x + end.x) / 2;
      var midY = (start.y + end.y) / 2;
      var midZ = (start.z + end.z) / 2;
      pipeMesh.position.set(midX, midY, midZ);

      var angle = Math.atan2(end.z - start.z, end.x - start.x);
      var elevation = Math.asin((end.y - start.y) / length);
      pipeMesh.rotation.z = elevation;
      pipeMesh.rotation.y = angle;

      pipeMesh.castShadow = true;
      pipeMesh.receiveShadow = true;
      scene.add(pipeMesh);
      sceneObjects.push(pipeMesh);
      coolantPipes.push({
        mesh: pipeMesh,
        label: pipeData.label,
        pressure: Math.random() * 3 + 7,
        originalEmissive: 0x662200
      });
    });
  }

  function createEmergencyGenerators() {
    var genPositions = [
      { x: -12, z: 15 },
      { x: -10, z: 18 },
      { x: -14, z: 18 }
    ];

    genPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Generator box
      var genGeometry = new THREE.BoxGeometry(2.5, 2, 3);
      var genMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.7,
        metalness: 0.5
      });
      var genMesh = new THREE.Mesh(genGeometry, genMaterial);
      genMesh.position.y = 1;
      genMesh.castShadow = true;
      genMesh.receiveShadow = true;
      group.add(genMesh);

      // Generator casing detail (inset)
      var caseGeometry = new THREE.BoxGeometry(2.2, 1.8, 2.8);
      var caseMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.3
      });
      var caseMesh = new THREE.Mesh(caseGeometry, caseMaterial);
      caseMesh.position.y = 1;
      caseMesh.castShadow = true;
      caseMesh.receiveShadow = true;
      group.add(caseMesh);

      // Exhaust pipe
      var exhaustGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
      var exhaustMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.3
      });
      var exhaustMesh = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
      exhaustMesh.position.set(0.7, 2.5, 0);
      exhaustMesh.castShadow = true;
      exhaustMesh.receiveShadow = true;
      group.add(exhaustMesh);

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      sceneObjects.push(group);
      generatorUnits.push(group);
    });
  }

  function createTransformers() {
    var transformerPositions = [
      { x: -25, z: -10 },
      { x: -28, z: -10 },
      { x: -31, z: -10 }
    ];

    transformerPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Main transformer box
      var boxGeometry = new THREE.BoxGeometry(2, 3, 2);
      var boxMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.4
      });
      var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.y = 1.5;
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      group.add(boxMesh);

      // Cooling fins (cylinders on sides)
      for (var f = 0; f < 2; f++) {
        var finGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16);
        var finMaterial = new THREE.MeshStandardMaterial({
          color: 0x666666,
          roughness: 0.7,
          metalness: 0.5
        });
        var finMesh = new THREE.Mesh(finGeometry, finMaterial);
        finMesh.position.set((f === 0 ? -1.2 : 1.2), 1.5, 0);
        finMesh.rotation.z = Math.PI / 2;
        finMesh.castShadow = true;
        finMesh.receiveShadow = true;
        group.add(finMesh);
      }

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      sceneObjects.push(group);
      transformers.push(group);
    });
  }

  function createWarningLights() {
    // Red warning lights mounted on tall poles throughout the plant
    var lightPositions = [
      { x: 12, y: 12, z: 15 },
      { x: -20, y: 12, z: 20 },
      { x: 8, y: 12, z: -15 }
    ];

    lightPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Pole (thin cylinder)
      var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, pos.y, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.6
      });
      var poleMesh = new THREE.Mesh(poleGeometry, poleMaterial);
      poleMesh.position.y = pos.y / 2;
      poleMesh.castShadow = true;
      poleMesh.receiveShadow = true;
      group.add(poleMesh);

      // Light bulb housing (small sphere)
      var bulbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      var bulbMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        roughness: 0.3,
        metalness: 0.5
      });
      var bulbMesh = new THREE.Mesh(bulbGeometry, bulbMaterial);
      bulbMesh.position.set(0, pos.y, 0);
      bulbMesh.castShadow = false;
      bulbMesh.receiveShadow = true;
      group.add(bulbMesh);

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      sceneObjects.push(group);
      warningLights.push({
        group: group,
        bulbMesh: bulbMesh,
        intensity: 0
      });
    });
  }

  function createAlarmTowers() {
    var alarmPositions = [
      { x: 20, z: 12 },
      { x: -30, z: 25 }
    ];

    alarmPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Tower base (cone)
      var baseGeometry = new THREE.ConeGeometry(1, 3, 12);
      var baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.3
      });
      var baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
      baseMesh.position.y = 1.5;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Speaker horn (inverted cone at top)
      var hornGeometry = new THREE.ConeGeometry(0.8, 1.5, 12);
      var hornMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF8800,
        emissive: 0x663300,
        roughness: 0.5,
        metalness: 0.6
      });
      var hornMesh = new THREE.Mesh(hornGeometry, hornMaterial);
      hornMesh.position.y = 4;
      hornMesh.rotation.z = Math.PI;
      hornMesh.castShadow = true;
      hornMesh.receiveShadow = true;
      group.add(hornMesh);

      // Flashing light on top
      var lightGeometry = new THREE.SphereGeometry(0.25, 12, 12);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        roughness: 0.2,
        metalness: 0.7
      });
      var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      lightMesh.position.y = 5.2;
      lightMesh.castShadow = false;
      lightMesh.receiveShadow = true;
      group.add(lightMesh);

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      sceneObjects.push(group);
      alarmLights.push({
        group: group,
        lightMesh: lightMesh,
        strobe: 0
      });
    });
  }

  function createPerimeterFence() {
    // Razor wire fence around the perimeter
    var fenceCorners = [
      { x: -35, z: -20 },
      { x: 30, z: -20 },
      { x: 30, z: 30 },
      { x: -35, z: 30 },
      { x: -35, z: -20 }
    ];

    for (var i = 0; i < fenceCorners.length - 1; i++) {
      var p1 = fenceCorners[i];
      var p2 = fenceCorners[i + 1];

      var length = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.z - p1.z, 2)
      );

      var posts = Math.floor(length / 3);
      for (var p = 0; p <= posts; p++) {
        var t = posts > 0 ? p / posts : 0;
        var postX = p1.x + (p2.x - p1.x) * t;
        var postZ = p1.z + (p2.z - p1.z) * t;

        var postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
        var postMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.9,
          metalness: 0.4
        });
        var postMesh = new THREE.Mesh(postGeometry, postMaterial);
        postMesh.position.set(postX, 1.25, postZ);
        postMesh.castShadow = true;
        postMesh.receiveShadow = true;
        scene.add(postMesh);
        sceneObjects.push(postMesh);

        // Barbed wire at top (small spikes using cones)
        for (var s = 0; s < 4; s++) {
          var spikeGeometry = new THREE.ConeGeometry(0.1, 0.6, 6);
          var spikeMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.6,
            metalness: 0.8
          });
          var spikeMesh = new THREE.Mesh(spikeGeometry, spikeMaterial);
          var angle = (s / 4) * Math.PI * 2;
          spikeMesh.position.set(
            postX + Math.cos(angle) * 0.25,
            2.8,
            postZ + Math.sin(angle) * 0.25
          );
          spikeMesh.castShadow = true;
          spikeMesh.receiveShadow = true;
          scene.add(spikeMesh);
          sceneObjects.push(spikeMesh);
        }
      }
    }
  }

  function createPressureGauges() {
    var gaugePositions = [
      { x: 10, y: 3, z: -8 },
      { x: -16, y: 3, z: 5 },
      { x: 18, y: 3, z: 2 }
    ];

    gaugePositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Main gauge face (flat disc)
      var faceGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 32);
      var faceMaterial = new THREE.MeshStandardMaterial({
        color: 0xEEEEEE,
        roughness: 0.4,
        metalness: 0.5
      });
      var faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
      faceMesh.castShadow = true;
      faceMesh.receiveShadow = true;
      group.add(faceMesh);

      // Center pivot point
      var pivotGeometry = new THREE.SphereGeometry(0.1, 12, 12);
      var pivotMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.8
      });
      var pivotMesh = new THREE.Mesh(pivotGeometry, pivotMaterial);
      pivotMesh.position.z = 0.1;
      pivotMesh.castShadow = true;
      pivotMesh.receiveShadow = true;
      group.add(pivotMesh);

      // Needle (thin cylinder)
      var needleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
      var needleMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        roughness: 0.3,
        metalness: 0.8
      });
      var needleMesh = new THREE.Mesh(needleGeometry, needleMaterial);
      needleMesh.position.y = 0.25;
      needleMesh.position.z = 0.1;
      needleMesh.castShadow = false;
      needleMesh.receiveShadow = false;
      group.add(needleMesh);

      group.position.set(pos.x, pos.y, pos.z);
      scene.add(group);
      sceneObjects.push(group);
      pressureGauges.push({
        group: group,
        needleMesh: needleMesh,
        pressure: Math.random() * 3 + 7
      });
    });
  }

  function createWaterIntakeCanal() {
    // Large rectangular canal for water intake
    var canalGeometry = new THREE.BoxGeometry(20, 2, 4);
    var canalMaterial = new THREE.MeshStandardMaterial({
      color: 0x2266AA,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x112244
    });
    var canalMesh = new THREE.Mesh(canalGeometry, canalMaterial);
    canalMesh.position.set(-15, 1, -28);
    canalMesh.castShadow = true;
    canalMesh.receiveShadow = true;
    scene.add(canalMesh);
    sceneObjects.push(canalMesh);

    // Intake pipes leading from canal
    var intakeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 15, 16);
    var intakeMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.6
    });
    var intakeMesh = new THREE.Mesh(intakeGeometry, intakeMaterial);
    intakeMesh.position.set(-15, 5, -18);
    intakeMesh.rotation.z = Math.PI / 2.5;
    intakeMesh.castShadow = true;
    intakeMesh.receiveShadow = true;
    scene.add(intakeMesh);
    sceneObjects.push(intakeMesh);
  }

  function createControlRoomConsoles() {
    // Inside turbine hall - control room with consoles
    var consolePositions = [
      { x: 12, y: 1, z: -8 },
      { x: 18, y: 1, z: -8 }
    ];

    consolePositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Console desk
      var deskGeometry = new THREE.BoxGeometry(2.5, 1, 1.5);
      var deskMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.5
      });
      var deskMesh = new THREE.Mesh(deskGeometry, deskMaterial);
      deskMesh.position.y = 0.5;
      deskMesh.castShadow = true;
      deskMesh.receiveShadow = true;
      group.add(deskMesh);

      // Monitor stand (small box behind desk)
      var standGeometry = new THREE.BoxGeometry(1, 0.8, 0.3);
      var standMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.4
      });
      var standMesh = new THREE.Mesh(standGeometry, standMaterial);
      standMesh.position.set(0, 1.1, -0.6);
      standMesh.castShadow = true;
      standMesh.receiveShadow = true;
      group.add(standMesh);

      // Button panels (small boxes)
      for (var b = 0; b < 3; b++) {
        var buttonGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.15);
        var buttonMaterial = new THREE.MeshStandardMaterial({
          color: (b === 0 ? 0xFF0000 : (b === 1 ? 0xFFFF00 : 0x00FF00)),
          emissive: (b === 0 ? 0xFF0000 : (b === 1 ? 0x888800 : 0x008800)),
          roughness: 0.4,
          metalness: 0.6
        });
        var buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
        buttonMesh.position.set(-0.8 + b * 0.6, 1.2, -0.7);
        buttonMesh.castShadow = false;
        buttonMesh.receiveShadow = true;
        group.add(buttonMesh);
      }

      group.position.set(pos.x, pos.y, pos.z);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createSteamParticles() {
    // Rising steam from cooling towers (simulated with upward-moving spheres)
    for (var i = 0; i < 5; i++) {
      var particleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xEEEEEE,
        transparent: true,
        opacity: 0.3,
        roughness: 0.9
      });
      var particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
      particleMesh.position.set(
        (Math.random() - 0.5) * 3,
        Math.random() * 5,
        (Math.random() - 0.5) * 3
      );
      particleMesh.castShadow = false;
      particleMesh.receiveShadow = false;
      scene.add(particleMesh);
      sceneObjects.push(particleMesh);
      steamParticles.push({
        mesh: particleMesh,
        baseY: particleMesh.position.y,
        speed: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'power-plant-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF00; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.7); padding: 10px; border: 1px solid #00FF00; ' +
                                  'z-index: 100; text-shadow: 0 0 5px #00FF00;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'CORE TEMP: ' + gameState.coreTemperature + 'C\n' +
                  'COOLANT PSI: ' + gameState.coolantPressure.toFixed(1) + '\n' +
                  'POWER OUTPUT: ' + gameState.powerOutput + ' MW\n' +
                  'ALARM LVL: ' + gameState.alarmLevel + '\n' +
                  'BREACHES: ' + gameState.securityBreaches + '/' + gameState.maxBreaches;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'a') {
        lastAKeyTime = now;
      }

      if (event.key.toLowerCase() === 'm') {
        if (now - lastAKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF00; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.8); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #00FF00; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastMKeyTime = now;
      }
    });
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    sceneObjects = [];
    warningLights = [];
    alarmLights = [];
    coolantPipes = [];
    pressureGauges = [];
    generatorUnits = [];
    transformers = [];
    coolingTowers = [];
    fenceSegments = [];
    steamParticles = [];
    elapsedTime = 0;

    createCoolingTower(-12, -8, true);
    createCoolingTower(12, -8, false);
    createReactorDome();
    createTurbineHall();
    createFuelPool();
    createCoolantPipes();
    createEmergencyGenerators();
    createTransformers();
    createWarningLights();
    createAlarmTowers();
    createPerimeterFence();
    createPressureGauges();
    createWaterIntakeCanal();
    createControlRoomConsoles();
    createSteamParticles();

    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    coolingTowers.forEach(function(tower) {
      if (tower.coolingTowerData) {
        tower.coolingTowerData.steamOffset += delta * 0.5;
      }
    });

    if (reactorDome && reactorDome.reactorDomeData) {
      reactorDome.reactorDomeData.warningIntensity = Math.sin(elapsedTime * 2) * 0.5 + 0.5;
      var domeChild = reactorDome.children[2];
      if (domeChild) {
        domeChild.material.emissive.setHex(
          Math.floor(0x330000 * (0.3 + reactorDome.reactorDomeData.warningIntensity))
        );
      }
    }

    if (turbineHall && turbineHall.turbineHallData) {
      turbineHall.turbineHallData.vibrationAmount = Math.sin(elapsedTime * 8) * 0.05;
      turbineHall.position.y = turbineHall.turbineHallData.vibrationAmount;
    }

    if (fuelPool && fuelPool.fuelPoolData) {
      fuelPool.fuelPoolData.shimmerAmount = Math.sin(elapsedTime * 3) * 0.08;
      var waterMesh = fuelPool.children[1];
      if (waterMesh) {
        waterMesh.position.y = 2.05 + fuelPool.fuelPoolData.shimmerAmount;
      }
    }

    warningLights.forEach(function(light) {
      light.intensity = Math.sin(elapsedTime * 3) * 0.5 + 0.5;
      if (light.bulbMesh) {
        light.bulbMesh.material.emissive.setHex(
          Math.floor(0xFF0000 * (0.2 + light.intensity * 0.8))
        );
      }
    });

    alarmLights.forEach(function(alarm) {
      alarm.strobe = Math.floor(elapsedTime * 5) % 2;
      if (alarm.lightMesh) {
        alarm.lightMesh.material.emissive.setHex(
          alarm.strobe === 0 ? 0xFF0000 : 0x440000
        );
      }
    });

    coolantPipes.forEach(function(pipe) {
      pipe.pressure = 7.5 + Math.sin(elapsedTime * 2 + pipe.mesh.position.x) * 1.5;
      pipe.mesh.material.emissive.setHex(
        Math.floor(0x662200 * (0.3 + (pipe.pressure - 6) / 3))
      );
    });

    pressureGauges.forEach(function(gauge) {
      gauge.pressure = 7 + Math.sin(elapsedTime * 1.5 + gauge.group.position.x) * 2;
      var needleRotation = (gauge.pressure - 6) / 5 * Math.PI;
      gauge.needleMesh.rotation.z = needleRotation - Math.PI / 2;
    });

    steamParticles.forEach(function(particle) {
      particle.mesh.position.y = particle.baseY + (elapsedTime * particle.speed) % 10;
      particle.mesh.position.x += Math.sin(elapsedTime * 0.5 + particle.phase) * 0.01;
      particle.mesh.position.z += Math.cos(elapsedTime * 0.5 + particle.phase) * 0.01;
      particle.mesh.material.opacity = 0.3 * (1 - (particle.mesh.position.y - particle.baseY) / 10);
    });

    gameState.coreTemperature = Math.floor(2200 + Math.sin(elapsedTime * 0.5) * 200);
    gameState.coolantPressure = 8 + Math.sin(elapsedTime * 1.5) * 1.5;
    gameState.powerOutput = Math.floor(900 + Math.sin(elapsedTime * 0.3) * 100);
    gameState.alarmLevel = Math.floor(1 + Math.sin(elapsedTime * 1) * 2);

    updateHUD();
  }

  function reset() {
    sceneObjects.forEach(function(obj) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(m) { m.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
      scene.remove(obj);
    });

    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    sceneObjects = [];
    warningLights = [];
    alarmLights = [];
    coolantPipes = [];
    pressureGauges = [];
    generatorUnits = [];
    transformers = [];
    coolingTowers = [];
    fenceSegments = [];
    steamParticles = [];
    gameState.securityBreaches = 0;
    gameState.coreTemperature = 2400;
    gameState.coolantPressure = 8.5;
    gameState.powerOutput = 950;
    gameState.alarmLevel = 1;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
