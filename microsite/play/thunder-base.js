window.ThunderBase = (function() {
  'use strict';

  var scene;
  var camera;
  var rainParticles;
  var lightningLight;
  var radarDish;
  var radarGroup;
  var buildings;
  var structures;
  var lastLightningTime;
  var lightningInterval;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    buildings = [];
    structures = [];
    lastLightningTime = 0;
    lightningInterval = 2.0;

    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 150, 250);

    var ambientLight = new THREE.AmbientLight(0x4a5f7f, 0.4);
    scene.add(ambientLight);

    lightningLight = new THREE.PointLight(0x8fbfff, 0, 150);
    lightningLight.position.set(40, 80, 30);
    scene.add(lightningLight);

    createGround();
    createMainCommandBuilding();
    createGeneratorBuilding();
    createTentCluster();
    createFloodTrenches();
    createSandbagBarriers();
    createVehicles();
    createRadarTowers();
    createLightningRods();
    createFloodlights();
    createCommunicationTowers();
    createStorageBunkers();
    createSmallSheds();
    createFuelTanks();
    createAntennaArray();
    createRainParticles();
  }

  function createGround() {
    var groundGeometry = new THREE.BoxGeometry(80, 1, 80);
    var groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a4a5f,
      roughness: 0.9,
      metalness: 0.1
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    structures.push(ground);
  }

  function createMainCommandBuilding() {
    var buildingGeometry = new THREE.BoxGeometry(20, 15, 25);
    var buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a3a4a,
      roughness: 0.8,
      metalness: 0.2
    });
    var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(-20, 7.5, 0);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    buildings.push(building);

    var roofGeometry = new THREE.ConeGeometry(12, 4, 4);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2a,
      roughness: 0.7
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-20, 19.5, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);
    structures.push(roof);

    var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
    var windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a5a,
      emissive: 0x4a6f8f,
      emissiveIntensity: 0.3
    });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-28, 10, 12.5);
    scene.add(window1);
    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(-12, 10, 12.5);
    scene.add(window2);
    var window3 = new THREE.Mesh(windowGeometry, windowMaterial);
    window3.position.set(-20, 13, -12.5);
    scene.add(window3);
  }

  function createGeneratorBuilding() {
    var genGeometry = new THREE.BoxGeometry(15, 12, 12);
    var genMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.85,
      metalness: 0.3
    });
    var genBuilding = new THREE.Mesh(genGeometry, genMaterial);
    genBuilding.position.set(20, 6, -25);
    genBuilding.castShadow = true;
    genBuilding.receiveShadow = true;
    scene.add(genBuilding);
    buildings.push(genBuilding);

    var panelGeometry = new THREE.BoxGeometry(3, 4, 0.3);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a4a2a,
      metalness: 0.6,
      roughness: 0.4,
      emissive: 0xff6600,
      emissiveIntensity: 0.2
    });
    var panel1 = new THREE.Mesh(panelGeometry, panelMaterial);
    panel1.position.set(16, 8, -25);
    scene.add(panel1);

    var exhaustGeometry = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
    var exhaustMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.7
    });
    var exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(18, 15, -25);
    exhaust.castShadow = true;
    scene.add(exhaust);
  }

  function createTentCluster() {
    var tentPositions = [
      [-35, 0, 20],
      [-40, 0, 30],
      [-28, 0, 28],
      [-45, 0, 15]
    ];

    for (var i = 0; i < tentPositions.length; i++) {
      var tentGeometry = new THREE.ConeGeometry(5, 8, 8);
      var tentMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,
        roughness: 0.9,
        emissive: 0x1a1a1a,
        emissiveIntensity: 0.15
      });
      var tent = new THREE.Mesh(tentGeometry, tentMaterial);
      tent.position.set(tentPositions[i][0], tentPositions[i][1], tentPositions[i][2]);
      tent.rotation.z = (Math.random() - 0.5) * 0.3;
      tent.scale.y = 0.8 + Math.random() * 0.3;
      tent.castShadow = true;
      tent.receiveShadow = true;
      scene.add(tent);
      structures.push(tent);
    }
  }

  function createFloodTrenches() {
    var trench1Geometry = new THREE.BoxGeometry(50, 3, 4);
    var trenchMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a3a,
      roughness: 0.95
    });
    var trench1 = new THREE.Mesh(trench1Geometry, trenchMaterial);
    trench1.position.set(0, -1.5, 30);
    trench1.receiveShadow = true;
    scene.add(trench1);
    structures.push(trench1);

    var waterGeometry = new THREE.BoxGeometry(50, 2, 4);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a5a,
      metalness: 0.3,
      roughness: 0.2,
      emissive: 0x0a1a2a,
      emissiveIntensity: 0.3
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, -0.5, 30);
    scene.add(water);

    var trench2Geometry = new THREE.BoxGeometry(4, 3, 40);
    var trench2 = new THREE.Mesh(trench2Geometry, trenchMaterial);
    trench2.position.set(-25, -1.5, 5);
    trench2.receiveShadow = true;
    scene.add(trench2);
    structures.push(trench2);
  }

  function createSandbagBarriers() {
    var barrierPositions = [
      [10, 0, -35],
      [20, 0, -40],
      [5, 0, -30],
      [-15, 0, 40],
      [35, 0, 25]
    ];

    for (var i = 0; i < barrierPositions.length; i++) {
      var barrierGeometry = new THREE.BoxGeometry(12, 2, 2);
      var barrierMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a5a4a,
        roughness: 0.95
      });
      var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(barrierPositions[i][0], barrierPositions[i][1], barrierPositions[i][2]);
      barrier.rotation.z = Math.random() * 0.1;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      scene.add(barrier);
      structures.push(barrier);
    }
  }

  function createVehicles() {
    var vehiclePositions = [
      [35, 0, -15],
      [40, 0, 5],
      [-30, 0, -35]
    ];

    for (var i = 0; i < vehiclePositions.length; i++) {
      var bodyGeometry = new THREE.BoxGeometry(8, 5, 14);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a3a4a,
        roughness: 0.8,
        metalness: 0.4
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(vehiclePositions[i][0], vehiclePositions[i][1], vehiclePositions[i][2]);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);

      var tireGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
      var tireMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.9,
        metalness: 0.2
      });
      var tire1 = new THREE.Mesh(tireGeometry, tireMaterial);
      tire1.position.set(vehiclePositions[i][0] - 2, 1.5, vehiclePositions[i][2] - 4);
      tire1.rotation.z = Math.PI / 2;
      scene.add(tire1);

      var tire2 = new THREE.Mesh(tireGeometry, tireMaterial);
      tire2.position.set(vehiclePositions[i][0] + 2, 1.5, vehiclePositions[i][2] - 4);
      tire2.rotation.z = Math.PI / 2;
      scene.add(tire2);

      var tire3 = new THREE.Mesh(tireGeometry, tireMaterial);
      tire3.position.set(vehiclePositions[i][0] - 2, 1.5, vehiclePositions[i][2] + 4);
      tire3.rotation.z = Math.PI / 2;
      scene.add(tire3);

      var tire4 = new THREE.Mesh(tireGeometry, tireMaterial);
      tire4.position.set(vehiclePositions[i][0] + 2, 1.5, vehiclePositions[i][2] + 4);
      tire4.rotation.z = Math.PI / 2;
      scene.add(tire4);
    }
  }

  function createRadarTowers() {
    radarGroup = new THREE.Group();

    var towerGeometry = new THREE.CylinderGeometry(2, 2.5, 25, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5a6a,
      metalness: 0.5,
      roughness: 0.6
    });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(30, 12.5, 35);
    tower.castShadow = true;
    scene.add(tower);
    structures.push(tower);

    radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(6, 12, 8),
      new THREE.MeshStandardMaterial({
        color: 0x7a8a9a,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x3a4a5a,
        emissiveIntensity: 0.2
      })
    );
    radarDish.position.set(30, 27, 35);
    radarDish.scale.set(1, 0.4, 1);
    radarDish.castShadow = true;
    radarDish.receiveShadow = true;
    radarGroup.add(radarDish);
    scene.add(radarGroup);

    var radarArmGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
    var radarArmMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a6a7a,
      metalness: 0.7
    });
    var radarArm = new THREE.Mesh(radarArmGeometry, radarArmMaterial);
    radarArm.position.set(30, 27, 35);
    radarArm.castShadow = true;
    radarGroup.add(radarArm);
  }

  function createLightningRods() {
    var rodPositions = [
      [-20, 19.5, -12],
      [-20, 19.5, 12],
      [20, 15, -25],
      [30, 27, 35],
      [-35, 8, 20]
    ];

    for (var i = 0; i < rodPositions.length; i++) {
      var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 4);
      var rodMaterial = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.9,
        roughness: 0.2
      });
      var rod = new THREE.Mesh(rodGeometry, rodMaterial);
      rod.position.set(rodPositions[i][0], rodPositions[i][1], rodPositions[i][2]);
      rod.castShadow = true;
      scene.add(rod);
      structures.push(rod);
    }
  }

  function createFloodlights() {
    var floodPositions = [
      [-30, 8, -35],
      [30, 8, 35],
      [0, 8, -35],
      [-25, 8, 35]
    ];

    for (var i = 0; i < floodPositions.length; i++) {
      var lightGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a2a,
        metalness: 0.4
      });
      var lightFixture = new THREE.Mesh(lightGeometry, lightMaterial);
      lightFixture.position.set(floodPositions[i][0], floodPositions[i][1], floodPositions[i][2]);
      lightFixture.castShadow = true;
      scene.add(lightFixture);

      var lampGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      var lampMaterial = new THREE.MeshStandardMaterial({
        color: 0xffff99,
        emissive: 0xffff33,
        emissiveIntensity: 0.4,
        metalness: 0.3
      });
      var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
      lamp.position.set(floodPositions[i][0], floodPositions[i][1] + 2, floodPositions[i][2]);
      scene.add(lamp);
    }
  }

  function createCommunicationTowers() {
    var towerGeometry = new THREE.CylinderGeometry(1.5, 1.8, 30, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5a6a,
      metalness: 0.6,
      roughness: 0.5
    });
    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-35, 15, 35);
    tower1.castShadow = true;
    scene.add(tower1);
    structures.push(tower1);

    var antenna1Geometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 4);
    var antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a6a7a,
      metalness: 0.8
    });
    var antenna1 = new THREE.Mesh(antenna1Geometry, antennaMaterial);
    antenna1.position.set(-35, 30, 35);
    antenna1.rotation.z = Math.PI / 6;
    antenna1.castShadow = true;
    scene.add(antenna1);

    var antenna2 = new THREE.Mesh(antenna1Geometry, antennaMaterial);
    antenna2.position.set(-35, 28, 35);
    antenna2.rotation.z = -Math.PI / 6;
    antenna2.castShadow = true;
    scene.add(antenna2);
  }

  function createStorageBunkers() {
    var bunkerPositions = [
      [15, 3, 20],
      [-15, 3, -20],
      [25, 3, -15]
    ];

    for (var i = 0; i < bunkerPositions.length; i++) {
      var bunkerGeometry = new THREE.BoxGeometry(10, 6, 8);
      var bunkerMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a2a,
        roughness: 0.85,
        metalness: 0.3
      });
      var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
      bunker.position.set(bunkerPositions[i][0], bunkerPositions[i][1], bunkerPositions[i][2]);
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      scene.add(bunker);
      structures.push(bunker);

      var doorGeometry = new THREE.BoxGeometry(2, 3, 0.5);
      var doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.7
      });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(bunkerPositions[i][0], bunkerPositions[i][1], bunkerPositions[i][2] + 4.5);
      scene.add(door);
    }
  }

  function createSmallSheds() {
    var shedPositions = [
      [-20, 2, 20],
      [10, 2, -25],
      [35, 2, 10],
      [-40, 2, -15]
    ];

    for (var i = 0; i < shedPositions.length; i++) {
      var shedGeometry = new THREE.BoxGeometry(6, 5, 8);
      var shedMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a3a2a,
        roughness: 0.9
      });
      var shed = new THREE.Mesh(shedGeometry, shedMaterial);
      shed.position.set(shedPositions[i][0], shedPositions[i][1], shedPositions[i][2]);
      shed.castShadow = true;
      shed.receiveShadow = true;
      scene.add(shed);
      structures.push(shed);
    }
  }

  function createFuelTanks() {
    var tankGeometry = new THREE.CylinderGeometry(3, 3, 7, 12);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a4a2a,
      metalness: 0.6,
      roughness: 0.5,
      emissive: 0x2a1a0a,
      emissiveIntensity: 0.1
    });
    var tank1 = new THREE.Mesh(tankGeometry, tankMaterial);
    tank1.position.set(20, 3.5, 20);
    tank1.castShadow = true;
    tank1.receiveShadow = true;
    scene.add(tank1);

    var tank2 = new THREE.Mesh(tankGeometry, tankMaterial);
    tank2.position.set(28, 3.5, 20);
    tank2.castShadow = true;
    tank2.receiveShadow = true;
    scene.add(tank2);
  }

  function createAntennaArray() {
    for (var i = 0; i < 6; i++) {
      var antennaGeometry = new THREE.CylinderGeometry(0.15, 0.15, 6, 4);
      var antennaMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a7a8a,
        metalness: 0.85,
        roughness: 0.3
      });
      var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
      antenna.position.set(-15 + i * 3, 20, -35);
      antenna.rotation.z = (Math.PI / 8) * (i % 2 === 0 ? 1 : -1);
      antenna.castShadow = true;
      scene.add(antenna);
      structures.push(antenna);
    }
  }

  function createRainParticles() {
    var particleCount = 2000;
    var rainGeometry = new THREE.BufferGeometry();
    var positions = new Float32Array(particleCount * 3);

    for (var i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = Math.random() * 80 + 40;
      positions[i + 2] = (Math.random() - 0.5) * 100;
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    var rainMaterial = new THREE.PointsMaterial({
      color: 0x6a7f9f,
      size: 0.3,
      sizeAttenuation: true,
      fog: true
    });

    rainParticles = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rainParticles);
  }

  function triggerLightning() {
    lightningLight.intensity = 2.0;
    setTimeout(function() {
      lightningLight.intensity = 0;
    }, 150);
  }

  function update(delta) {
    if (rainParticles) {
      var positions = rainParticles.geometry.attributes.position.array;
      for (var i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= delta * 25;
        if (positions[i + 1] < 0) {
          positions[i + 1] = 80;
        }
        positions[i] += Math.sin(positions[i + 1] * 0.1) * delta * 3;
      }
      rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    if (radarDish) {
      radarDish.rotation.y += delta * 0.5;
    }

    lastLightningTime += delta;
    if (lastLightningTime >= lightningInterval) {
      triggerLightning();
      lastLightningTime = 0;
      lightningInterval = 1.5 + Math.random() * 3.0;
    }
  }

  function reset() {
    lastLightningTime = 0;
    lightningInterval = 2.0;
    lightningLight.intensity = 0;
    if (rainParticles && rainParticles.geometry.attributes.position) {
      var positions = rainParticles.geometry.attributes.position.array;
      for (var i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = Math.random() * 80 + 40;
        positions[i + 2] = (Math.random() - 0.5) * 100;
      }
      rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
