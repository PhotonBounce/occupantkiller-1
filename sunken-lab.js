window.SunkenLab = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var animatedObjects = [];
  var waterLevel = 0;
  var initialWaterLevel = -20;
  var waterRiseSpeed = 0.5;
  var maxWaterLevel = 15;

  function createObject(geometry, material, x, y, z, rotX, rotY, rotZ, scaleX, scaleY, scaleZ) {
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rotX !== undefined) mesh.rotation.x = rotX;
    if (rotY !== undefined) mesh.rotation.y = rotY;
    if (rotZ !== undefined) mesh.rotation.z = rotZ;
    if (scaleX !== undefined) {
      mesh.scale.set(scaleX, scaleY !== undefined ? scaleY : scaleX, scaleZ !== undefined ? scaleZ : scaleX);
    }
    scene.add(mesh);
    objects.push(mesh);
    return mesh;
  }

  function createBubbleCluster(x, y, z, count) {
    var bubbles = [];
    for (var i = 0; i < count; i++) {
      var bubbleMaterial = new THREE.MeshPhongMaterial({
        color: 0x4da6ff,
        transparent: true,
        opacity: 0.4,
        emissive: 0x2d5a99
      });
      var bubbleGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 8, 8);
      var bubble = new THREE.Mesh(bubbleGeo, bubbleMaterial);
      var offsetX = (Math.random() - 0.5) * 3;
      var offsetY = (Math.random() - 0.5) * 1;
      var offsetZ = (Math.random() - 0.5) * 3;
      bubble.position.set(x + offsetX, y + offsetY, z + offsetZ);
      bubble.startY = bubble.position.y;
      bubble.riseSpeed = 2 + Math.random() * 3;
      bubble.wobbleAmount = Math.random() * 0.1;
      bubble.wobbleSpeed = 0.5 + Math.random() * 1;
      scene.add(bubble);
      objects.push(bubble);
      animatedObjects.push({
        type: 'bubble',
        mesh: bubble
      });
      bubbles.push(bubble);
    }
    return bubbles;
  }

  function createSparkEffect(x, y, z, count) {
    var sparks = [];
    for (var i = 0; i < count; i++) {
      var sparkMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        emissive: 0xffff00
      });
      var sparkGeo = new THREE.SphereGeometry(0.15, 4, 4);
      var spark = new THREE.Mesh(sparkGeo, sparkMaterial);
      var offsetX = (Math.random() - 0.5) * 2;
      var offsetY = (Math.random() - 0.5) * 2;
      var offsetZ = (Math.random() - 0.5) * 2;
      spark.position.set(x + offsetX, y + offsetY, z + offsetZ);
      spark.velocity = {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10
      };
      spark.lifetime = 1 + Math.random() * 2;
      spark.maxLifetime = spark.lifetime;
      scene.add(spark);
      objects.push(spark);
      animatedObjects.push({
        type: 'spark',
        mesh: spark
      });
      sparks.push(spark);
    }
    return sparks;
  }

  function createGlowingSpecimen(x, y, z, color) {
    var specimenGeo = new THREE.SphereGeometry(0.8, 16, 16);
    var specimenMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8
    });
    var specimen = new THREE.Mesh(specimenGeo, specimenMaterial);
    specimen.position.set(x, y, z);
    specimen.baseScale = 1;
    specimen.glowIntensity = 0.5;
    specimen.glowSpeed = 2;
    scene.add(specimen);
    objects.push(specimen);
    animatedObjects.push({
      type: 'specimen',
      mesh: specimen
    });
    return specimen;
  }

  function createWarningLight(x, y, z) {
    var lightGeo = new THREE.SphereGeometry(0.4, 16, 16);
    var lightMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    var light = new THREE.Mesh(lightGeo, lightMaterial);
    light.position.set(x, y, z);
    light.blinkSpeed = 3 + Math.random() * 2;
    light.blinkPhase = Math.random() * Math.PI * 2;
    scene.add(light);
    objects.push(light);
    animatedObjects.push({
      type: 'warningLight',
      mesh: light
    });
    return light;
  }

  function createCrackedWindow(x, y, z) {
    var windowGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32, 1);
    var windowMaterial = new THREE.MeshPhongMaterial({
      color: 0x003366,
      transparent: true,
      opacity: 0.6,
      emissive: 0x001a33
    });
    var windowMesh = new THREE.Mesh(windowGeo, windowMaterial);
    windowMesh.position.set(x, y, z);
    windowMesh.rotation.z = Math.PI / 2;
    scene.add(windowMesh);
    objects.push(windowMesh);

    var crackMaterial = new THREE.LineBasicMaterial({ color: 0x4da6ff });
    var crackGeo = new THREE.BufferGeometry();
    var crackPoints = [
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0.5, 0.5, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(-0.5, -0.5, 0),
      new THREE.Vector3(-1, 0, 0)
    ];
    crackGeo.setFromPoints(crackPoints);
    var crackLines = new THREE.LineSegments(crackGeo, crackMaterial);
    crackLines.position.copy(windowMesh.position);
    crackLines.rotation.z = Math.PI / 2;
    scene.add(crackLines);
    objects.push(crackLines);

    return windowMesh;
  }

  function createTankWithSpecimens(x, y, z) {
    var tankGeo = new THREE.CylinderGeometry(2, 2, 5, 16, 4);
    var tankMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a4d66,
      transparent: true,
      opacity: 0.7,
      emissive: 0x0d2633
    });
    var tank = new THREE.Mesh(tankGeo, tankMaterial);
    tank.position.set(x, y, z);
    scene.add(tank);
    objects.push(tank);

    var specimenCount = 4;
    for (var i = 0; i < specimenCount; i++) {
      var offsetX = (Math.random() - 0.5) * 2;
      var offsetY = -1 + (i / specimenCount) * 3;
      var offsetZ = (Math.random() - 0.5) * 1.5;
      var specimenColor = Math.random() > 0.5 ? 0x00ff88 : 0x00ccff;
      createGlowingSpecimen(x + offsetX, y + offsetY, z + offsetZ, specimenColor);
    }

    return tank;
  }

  function createComputerStation(x, y, z) {
    var material = new THREE.MeshPhongMaterial({
      color: 0x1a3a4d,
      emissive: 0x003366
    });

    var baseGeo = new THREE.BoxGeometry(1.5, 0.3, 1, 4, 2, 4);
    createObject(baseGeo, material, x, y, z);

    var screenGeo = new THREE.BoxGeometry(1, 0.05, 0.5, 4, 1, 2);
    var screenMaterial = new THREE.MeshPhongMaterial({
      color: 0x00cc00,
      emissive: 0x00aa00,
      emissiveIntensity: 0.5
    });
    createObject(screenGeo, screenMaterial, x, y + 0.6, z);

    var standGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2, 2, 4, 2);
    createObject(standGeo, material, x + 0.3, y + 0.3, z + 0.1);
    createObject(standGeo, material, x - 0.3, y + 0.3, z + 0.1);

    return {
      screen: null
    };
  }

  function createStorageLocker(x, y, z) {
    var material = new THREE.MeshPhongMaterial({
      color: 0x2a4d5f
    });

    var doorGeo = new THREE.BoxGeometry(0.8, 1.5, 0.1, 4, 8, 1);
    var door1 = createObject(doorGeo, material, x - 0.5, y, z, 0, 0.3, 0);

    var door2 = createObject(doorGeo, material, x + 0.5, y, z, 0, -0.3, 0);

    var frameGeo = new THREE.BoxGeometry(1.6, 1.5, 0.2, 4, 8, 1);
    createObject(frameGeo, material, x, y, z);

    var interiorGeo = new THREE.BoxGeometry(1.4, 1.3, 0.05, 4, 8, 1);
    var interiorMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a3a4d
    });
    createObject(interiorGeo, interiorMaterial, x, y, z + 0.1);

    return {
      doors: [door1, door2]
    };
  }

  function createPressureSuit(x, y, z) {
    var material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      emissive: 0x666666
    });

    var torsoGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 12, 4);
    createObject(torsoGeo, material, x, y, z);

    var headGeo = new THREE.SphereGeometry(0.3, 12, 12);
    createObject(headGeo, material, x, y + 0.7, z);

    var legGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8, 3);
    createObject(legGeo, material, x - 0.15, y - 0.5, z);
    createObject(legGeo, material, x + 0.15, y - 0.5, z);

    var armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8, 3);
    createObject(armGeo, material, x - 0.5, y + 0.2, z);
    createObject(armGeo, material, x + 0.5, y + 0.2, z);

    return null;
  }

  function createElectricalEquipment(x, y, z) {
    var material = new THREE.MeshPhongMaterial({
      color: 0x3a3a2a
    });

    var cabinetGeo = new THREE.BoxGeometry(0.8, 2, 0.6, 4, 8, 3);
    createObject(cabinetGeo, material, x, y, z);

    var panelGeo = new THREE.BoxGeometry(0.7, 1.8, 0.05, 4, 8, 1);
    var panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a0a
    });
    createObject(panelGeo, panelMaterial, x, y, z + 0.35);

    var wireGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 6, 2);
    createObject(wireGeo, material, x - 0.5, y + 0.5, z - 0.5);
    createObject(wireGeo, material, x + 0.5, y + 0.5, z - 0.5);

    return null;
  }

  function createEmergencyBulkhead(x, y, z, isOpen) {
    var material = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      emissive: 0xcc3300
    });

    var frameGeo = new THREE.BoxGeometry(3, 4, 0.2, 6, 8, 1);
    createObject(frameGeo, material, x, y, z);

    var doorGeo = new THREE.BoxGeometry(2.8, 3.8, 0.15, 6, 8, 1);
    var doorMaterial = new THREE.MeshPhongMaterial({
      color: 0xcc5500
    });
    var door = createObject(doorGeo, doorMaterial, x + (isOpen ? 2 : 0), y, z + 0.1);
    if (!isOpen) {
      door.userData.opening = false;
    }

    var labelGeo = new THREE.BoxGeometry(2, 0.4, 0.02, 4, 2, 1);
    var labelMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00
    });
    createObject(labelGeo, labelMaterial, x, y + 2.2, z + 0.12);

    return {
      door: door
    };
  }

  function createAirlockChamber(x, y, z) {
    var material = new THREE.MeshPhongMaterial({
      color: 0x4d7a99
    });

    var cylinderGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 24, 4);
    createObject(cylinderGeo, material, x, y, z);

    var innerGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.8, 24, 4);
    var innerMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a5a7a
    });
    createObject(innerGeo, innerMaterial, x, y, z);

    var hatchGeo = new THREE.BoxGeometry(1.2, 1.2, 0.1, 4, 4, 1);
    var hatchMaterial = new THREE.MeshPhongMaterial({
      color: 0x669999
    });
    createObject(hatchGeo, hatchMaterial, x - 1.6, y + 0.5, z);
    createObject(hatchGeo, hatchMaterial, x + 1.6, y + 0.5, z);

    var wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16, 1);
    var wheelMaterial = new THREE.MeshPhongMaterial({
      color: 0xaa8844
    });
    createObject(wheelGeo, wheelMaterial, x - 1.6, y + 1.3, z);
    createObject(wheelGeo, wheelMaterial, x + 1.6, y + 1.3, z);

    return null;
  }

  function createFloatingDebris(x, y, z) {
    var debrisTypes = Math.floor(Math.random() * 3);

    if (debrisTypes === 0) {
      var fileBoxGeo = new THREE.BoxGeometry(0.3, 0.4, 0.2, 2, 4, 2);
      var fileBoxMaterial = new THREE.MeshPhongMaterial({
        color: 0xccaa66
      });
      var fileBox = createObject(fileBoxGeo, fileBoxMaterial, x, y, z);
      fileBox.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    } else if (debrisTypes === 1) {
      var panelGeo = new THREE.BoxGeometry(0.8, 0.1, 0.6, 4, 1, 3);
      var panelMaterial = new THREE.MeshPhongMaterial({
        color: 0x556677
      });
      var panel = createObject(panelGeo, panelMaterial, x, y, z);
      panel.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    } else {
      var canisterGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8, 2);
      var canisterMaterial = new THREE.MeshPhongMaterial({
        color: 0xdd4444
      });
      var canister = createObject(canisterGeo, canisterMaterial, x, y, z);
      canister.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }
  }

  function createDeepSeaCreature(x, y, z) {
    var creatureColor = 0x00ff99;
    var creatureMaterial = new THREE.MeshPhongMaterial({
      color: creatureColor,
      emissive: creatureColor,
      emissiveIntensity: 0.4
    });

    var bodyGeo = new THREE.SphereGeometry(0.5, 12, 12);
    var creature = createObject(bodyGeo, creatureMaterial, x, y, z);
    creature.userData.speed = 5 + Math.random() * 5;
    creature.userData.amplitude = 2 + Math.random() * 3;
    creature.userData.angle = Math.random() * Math.PI * 2;
    creature.userData.swimSpeed = 1 + Math.random() * 2;

    var tentacleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6, 4);
    for (var i = 0; i < 3; i++) {
      var angle = (Math.PI * 2 / 3) * i;
      var offsetX = Math.cos(angle) * 0.4;
      var offsetZ = Math.sin(angle) * 0.4;
      var tentacle = createObject(tentacleGeo, creatureMaterial, x + offsetX, y - 0.5, z + offsetZ);
      tentacle.userData.parentCreature = creature;
    }

    animatedObjects.push({
      type: 'creature',
      mesh: creature
    });

    return creature;
  }

  function createWaterVolume() {
    var waterMaterial = new THREE.MeshPhongMaterial({
      color: 0x001a4d,
      transparent: true,
      opacity: 0.3,
      emissive: 0x000d26,
      emissiveIntensity: 0.2
    });

    var waterGeo = new THREE.BoxGeometry(70, 40, 70, 8, 8, 8);
    var water = new THREE.Mesh(waterGeo, waterMaterial);
    water.position.y = initialWaterLevel;
    scene.add(water);
    objects.push(water);

    return water;
  }

  function createLabStructure() {
    var wallMaterial = new THREE.MeshPhongMaterial({
      color: 0x2a4d5f
    });

    var floorGeo = new THREE.BoxGeometry(60, 1, 60, 12, 2, 12);
    createObject(floorGeo, wallMaterial, 0, -25, 0);

    var ceilingGeo = new THREE.BoxGeometry(60, 1, 60, 12, 2, 12);
    createObject(ceilingGeo, wallMaterial, 0, 25, 0);

    var northWallGeo = new THREE.BoxGeometry(60, 50, 1, 12, 10, 1);
    createObject(northWallGeo, wallMaterial, 0, 0, -30);

    var southWallGeo = new THREE.BoxGeometry(60, 50, 1, 12, 10, 1);
    createObject(southWallGeo, wallMaterial, 0, 0, 30);

    var eastWallGeo = new THREE.BoxGeometry(1, 50, 60, 1, 10, 12);
    createObject(eastWallGeo, wallMaterial, 30, 0, 0);

    var westWallGeo = new THREE.BoxGeometry(1, 50, 60, 1, 10, 12);
    createObject(westWallGeo, wallMaterial, -30, 0, 0);

    var supportsSpacing = 15;
    for (var i = -25; i <= 25; i += supportsSpacing) {
      for (var j = -25; j <= 25; j += supportsSpacing) {
        var supportGeo = new THREE.CylinderGeometry(0.5, 0.5, 50, 8, 10);
        createObject(supportGeo, wallMaterial, i, 0, j);
      }
    }

    var crackedSectionMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a3a4d,
      emissive: 0x0d1a26
    });

    var crackGeo1 = new THREE.BoxGeometry(15, 20, 1, 3, 4, 1);
    createObject(crackGeo1, crackedSectionMaterial, -20, 5, -29);

    var crackGeo2 = new THREE.BoxGeometry(1, 20, 15, 1, 4, 3);
    createObject(crackGeo2, crackedSectionMaterial, 29, 5, 15);

    var breachGeo = new THREE.BoxGeometry(8, 8, 1, 2, 2, 1);
    createObject(breachGeo, crackedSectionMaterial, 25, -15, 29);
  }

  function createResearchLab() {
    createComputerStation(-15, -15, -15);
    createComputerStation(-15, -15, 0);
    createComputerStation(-15, -15, 15);
    createComputerStation(0, -15, -20);
    createComputerStation(0, -15, 20);

    createStorageLocker(-20, -5, -20);
    createStorageLocker(-20, -5, 0);
    createStorageLocker(-20, -5, 20);

    createTankWithSpecimens(15, 0, -20);
    createTankWithSpecimens(20, 5, 0);
    createTankWithSpecimens(15, 0, 20);

    createCrackedWindow(-25, 10, -15);
    createCrackedWindow(-25, 10, 0);
    createCrackedWindow(-25, 10, 15);
    createCrackedWindow(25, 10, -15);
    createCrackedWindow(25, 10, 0);
    createCrackedWindow(25, 10, 15);
  }

  function createPowerRoom() {
    var material = new THREE.MeshPhongMaterial({
      color: 0x3a3a2a
    });

    createElectricalEquipment(-10, -5, -25);
    createElectricalEquipment(0, -5, -25);
    createElectricalEquipment(10, -5, -25);

    createWarningLight(-12, 5, -26);
    createWarningLight(0, 5, -26);
    createWarningLight(12, 5, -26);

    for (var i = 0; i < 15; i++) {
      var sparkX = -15 + Math.random() * 30;
      var sparkY = -8 + Math.random() * 8;
      var sparkZ = -29 + Math.random() * 4;
      createSparkEffect(sparkX, sparkY, sparkZ, 2);
    }
  }

  function createFloodedSection() {
    var bulkhead1 = createEmergencyBulkhead(-20, 5, 25, false);
    var bulkhead2 = createEmergencyBulkhead(20, 5, 25, false);

    createCrackedWindow(-15, 8, 28);
    createCrackedWindow(15, 8, 28);

    for (var i = 0; i < 12; i++) {
      var debrisX = -20 + Math.random() * 40;
      var debrisY = -5 + Math.random() * 15;
      var debrisZ = 20 + Math.random() * 15;
      createFloatingDebris(debrisX, debrisY, debrisZ);
    }

    for (var j = 0; j < 8; j++) {
      var bubbleX = -15 + Math.random() * 30;
      var bubbleY = 5 + Math.random() * 15;
      var bubbleZ = 20 + Math.random() * 15;
      createBubbleCluster(bubbleX, bubbleY, bubbleZ, 5);
    }
  }

  function createPressureSuitStorage() {
    var materialDark = new THREE.MeshPhongMaterial({
      color: 0x1a3a4d
    });

    var storageGeo = new THREE.BoxGeometry(3, 3, 10, 6, 6, 4);
    createObject(storageGeo, materialDark, 0, -10, -22);

    for (var i = 0; i < 6; i++) {
      var offsetX = -2 + (i % 3) * 2;
      var offsetY = -8 + Math.floor(i / 3) * 2;
      createPressureSuit(offsetX, offsetY, -22);
    }
  }

  function createExteriorWater() {
    var waterColor = 0x000d1a;
    var waterMaterial = new THREE.MeshPhongMaterial({
      color: waterColor,
      transparent: true,
      opacity: 0.5,
      emissive: 0x000505,
      emissiveIntensity: 0.1
    });

    var largeWaterGeo = new THREE.BoxGeometry(150, 80, 150, 4, 4, 4);
    var largeWater = new THREE.Mesh(largeWaterGeo, waterMaterial);
    largeWater.position.y = -30;
    largeWater.position.z = 80;
    scene.add(largeWater);
    objects.push(largeWater);

    for (var i = 0; i < 6; i++) {
      var creatureX = -40 + Math.random() * 80;
      var creatureY = -30 + Math.random() * 20;
      var creatureZ = 40 + Math.random() * 60;
      createDeepSeaCreature(creatureX, creatureY, creatureZ);
    }
  }

  function createAirlock() {
    createAirlockChamber(-25, -5, 0);
    createAirlockChamber(25, -5, 0);

    var doorGeo = new THREE.BoxGeometry(1.5, 1.5, 0.2, 3, 3, 1);
    var doorMaterial = new THREE.MeshPhongMaterial({
      color: 0x669999
    });
    createObject(doorGeo, doorMaterial, -25, -5, 2.5);
    createObject(doorGeo, doorMaterial, 25, -5, 2.5);
  }

  function tiltEnvironment() {
    var tiltAngle = 15 * (Math.PI / 180);
    for (var i = 0; i < objects.length; i++) {
      objects[i].rotation.z += tiltAngle;
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];
    waterLevel = initialWaterLevel;

    createLabStructure();
    createResearchLab();
    createPowerRoom();
    createFloodedSection();
    createPressureSuitStorage();
    createExteriorWater();
    createAirlock();

    createWaterVolume();

    tiltEnvironment();

    var lightCount = 0;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].userData && objects[i].userData.type === 'light') {
        lightCount++;
      }
    }

    return true;
  }

  function update(delta) {
    waterLevel = Math.min(waterLevel + waterRiseSpeed * delta * 0.1, maxWaterLevel);

    for (var i = 0; i < animatedObjects.length; i++) {
      var animated = animatedObjects[i];

      if (animated.type === 'bubble') {
        var mesh = animated.mesh;
        mesh.position.y += mesh.riseSpeed * delta;
        mesh.position.x += Math.sin(mesh.position.y * mesh.wobbleSpeed) * mesh.wobbleAmount;

        if (mesh.position.y > mesh.startY + 20) {
          mesh.position.y = mesh.startY;
        }
      } else if (animated.type === 'spark') {
        var spark = animated.mesh;
        spark.position.x += spark.velocity.x * delta * 0.2;
        spark.position.y += spark.velocity.y * delta * 0.2;
        spark.position.z += spark.velocity.z * delta * 0.2;
        spark.lifetime -= delta;
        spark.material.opacity = Math.max(0, spark.lifetime / spark.maxLifetime);

        if (spark.lifetime <= 0) {
          scene.remove(spark);
          animatedObjects.splice(i, 1);
          i--;
        }
      } else if (animated.type === 'specimen') {
        var specimen = animated.mesh;
        var scale = specimen.baseScale + Math.sin(Date.now() * 0.001 * specimen.glowSpeed) * 0.15;
        specimen.scale.set(scale, scale, scale);
        specimen.material.emissiveIntensity = 0.4 + Math.sin(Date.now() * 0.002) * 0.3;
      } else if (animated.type === 'warningLight') {
        var light = animated.mesh;
        var blinkValue = Math.sin(Date.now() * 0.001 * light.blinkSpeed + light.blinkPhase) * 0.5 + 0.5;
        light.material.emissiveIntensity = 0.3 + blinkValue * 0.7;
      } else if (animated.type === 'creature') {
        var creature = animated.mesh;
        creature.userData.angle += creature.userData.swimSpeed * delta;
        creature.position.x += Math.cos(creature.userData.angle) * creature.userData.speed * delta * 0.1;
        creature.position.z += Math.sin(creature.userData.angle) * creature.userData.speed * delta * 0.1;

        var boundsX = 35;
        var boundsZ = 35;
        if (creature.position.x > boundsX || creature.position.x < -boundsX) {
          creature.userData.angle = Math.PI - creature.userData.angle;
        }
        if (creature.position.z > boundsZ || creature.position.z < -boundsZ) {
          creature.userData.angle = -creature.userData.angle;
        }

        creature.position.y += Math.sin(Date.now() * 0.0005 + creature.userData.angle) * 0.5;
      }
    }

    return {
      waterLevel: waterLevel
    };
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
    waterLevel = initialWaterLevel;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
