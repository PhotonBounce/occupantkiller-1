window.NuclearLab = (function() {
  'use strict';

  var scene;
  var camera;
  var meshes = [];
  var centrifuges = [];
  var warningLights = [];
  var radioactiveWater;
  var reactorCore;
  var geigerCounter;
  var deconShower;
  var coolingPipes = [];
  var radiationFog = [];
  var spawnPoints = [];
  var elapsedTime = 0;

  var colors = {
    leadGray: 0x444444,
    radYellow: 0xFFFF00,
    containmentOrange: 0xFF8C00,
    coreGlow: 0x00FF44,
    waterRadioactive: 0x00CCFF,
    darkSteel: 0x222222,
    warningRed: 0xFF0000,
    concrete: 0x999999
  };

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    centrifuges = [];
    warningLights = [];
    coolingPipes = [];
    radiationFog = [];
    spawnPoints = [];
    elapsedTime = 0;

    buildAirlockEntry();
    buildCentrifugeHall();
    buildHotCellGloveBox();
    buildRadiationMonitoringStations();
    buildUraniumStorage();
    buildRadiationBreach();
    buildVentilationHepaFilters();
    buildLeadLinedWalls();
    buildEmergencyContainmentDrums();
    buildCoolingWaterCircuit();
    buildControlRoom();
    buildReactorCoreMockup();
    buildDecontaminationShower();
    buildRadiationWarningSignsAndLights();
    createSpawnPoints();
  }

  function buildAirlockEntry() {
    var airlockGroup = new THREE.Group();

    var outerChamber = new THREE.Mesh(
      new THREE.BoxGeometry(8, 5, 6),
      new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.6 })
    );
    outerChamber.position.set(-35, 2.5, -20);
    outerChamber.castShadow = true;
    outerChamber.receiveShadow = true;
    airlockGroup.add(outerChamber);

    var innerChamber = new THREE.Mesh(
      new THREE.BoxGeometry(6, 4, 5),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.7 })
    );
    innerChamber.position.set(-20, 2, -20);
    innerChamber.castShadow = true;
    innerChamber.receiveShadow = true;
    airlockGroup.add(innerChamber);

    var airlock1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 5),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.8 })
    );
    airlock1.position.set(-28, 2, -20);
    airlock1.castShadow = true;
    airlockGroup.add(airlock1);

    var airlock2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 5),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.8 })
    );
    airlock2.position.set(-12, 2, -20);
    airlock2.castShadow = true;
    airlockGroup.add(airlock2);

    scene.add(airlockGroup);
    meshes.push(outerChamber, innerChamber, airlock1, airlock2);
  }

  function buildCentrifugeHall() {
    var hallMaterial = new THREE.MeshStandardMaterial({ color: colors.concrete, roughness: 0.8 });
    var floorBox = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 50), hallMaterial);
    floorBox.position.set(10, 0, 0);
    floorBox.receiveShadow = true;
    scene.add(floorBox);
    meshes.push(floorBox);

    var ceilingBox = new THREE.Mesh(new THREE.BoxGeometry(40, 0.5, 50), hallMaterial);
    ceilingBox.position.set(10, 10, 0);
    ceilingBox.receiveShadow = true;
    scene.add(ceilingBox);
    meshes.push(ceilingBox);

    var wallNorth = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 1), hallMaterial);
    wallNorth.position.set(10, 5, -25);
    wallNorth.castShadow = true;
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    meshes.push(wallNorth);

    var wallSouth = new THREE.Mesh(new THREE.BoxGeometry(40, 10, 1), hallMaterial);
    wallSouth.position.set(10, 5, 25);
    wallSouth.castShadow = true;
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    meshes.push(wallSouth);

    var rowSpacing = 12;
    var cols = 3;
    var rows = 4;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cx = -15 + c * 15;
        var cz = -12 + r * rowSpacing;

        var centrifuge = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 2, 16),
          new THREE.MeshStandardMaterial({ color: colors.radYellow, metalness: 0.5 })
        );
        centrifuge.position.set(cx, 1.5, cz);
        centrifuge.castShadow = true;
        centrifuge.receiveShadow = true;
        scene.add(centrifuge);
        centrifuges.push(centrifuge);
        meshes.push(centrifuge);

        var spinnerRing = new THREE.Mesh(
          new THREE.CylinderGeometry(2, 2, 0.3, 32),
          new THREE.MeshStandardMaterial({ color: colors.containmentOrange, metalness: 0.6 })
        );
        spinnerRing.position.set(cx, 2.8, cz);
        spinnerRing.castShadow = true;
        scene.add(spinnerRing);
        centrifuges.push(spinnerRing);
        meshes.push(spinnerRing);
      }
    }
  }

  function buildHotCellGloveBox() {
    var boxMaterial = new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.7 });
    var enclosure = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4), boxMaterial);
    enclosure.position.set(35, 1.5, 10);
    enclosure.castShadow = true;
    enclosure.receiveShadow = true;
    scene.add(enclosure);
    meshes.push(enclosure);

    for (var g = 0; g < 3; g++) {
      var glovePort = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.8 })
      );
      glovePort.rotation.z = Math.PI / 2;
      glovePort.position.set(32.5, 1.5 + g * 0.8, 10);
      glovePort.castShadow = true;
      scene.add(glovePort);
      meshes.push(glovePort);
    }

    var windowPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0x1A1A2E, metalness: 0.9, roughness: 0.1 })
    );
    windowPane.position.set(32, 1.5, 10);
    windowPane.castShadow = true;
    scene.add(windowPane);
    meshes.push(windowPane);
  }

  function buildRadiationMonitoringStations() {
    for (var s = 0; s < 3; s++) {
      var stationX = -20 + s * 25;

      var geigerUnit = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.8, 1.2),
        new THREE.MeshStandardMaterial({ color: colors.radYellow, metalness: 0.4 })
      );
      geigerUnit.position.set(stationX, 0.9, -15);
      geigerUnit.castShadow = true;
      geigerUnit.receiveShadow = true;
      scene.add(geigerUnit);
      meshes.push(geigerUnit);

      if (s === 0) {
        geigerCounter = geigerUnit;
      }

      var probe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 1.5, 12),
        new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.6 })
      );
      probe.position.set(stationX, 1.5, -15);
      probe.castShadow = true;
      scene.add(probe);
      meshes.push(probe);

      var probeHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: colors.coreGlow, emissive: colors.coreGlow, emissiveIntensity: 0.4 })
      );
      probeHead.position.set(stationX, 3, -15);
      probeHead.castShadow = true;
      scene.add(probeHead);
      meshes.push(probeHead);
    }
  }

  function buildUraniumStorage() {
    var storageX = 30;
    var storageZ = -18;

    for (var u = 0; u < 5; u++) {
      for (var v = 0; v < 2; v++) {
        var canister = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 1.8, 12),
          new THREE.MeshStandardMaterial({ color: colors.containmentOrange, metalness: 0.5 })
        );
        canister.position.set(storageX + u * 2.5, 0.9 + v * 2.2, storageZ);
        canister.castShadow = true;
        canister.receiveShadow = true;
        scene.add(canister);
        meshes.push(canister);

        var canizerCap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.65, 0.65, 0.2, 12),
          new THREE.MeshStandardMaterial({ color: colors.radYellow, metalness: 0.6 })
        );
        canizerCap.position.set(storageX + u * 2.5, 1.95 + v * 2.2, storageZ);
        canizerCap.castShadow = true;
        scene.add(canizerCap);
        meshes.push(canizerCap);
      }
    }
  }

  function buildRadiationBreach() {
    var basementFloor = new THREE.Mesh(
      new THREE.BoxGeometry(50, 0.5, 50),
      new THREE.MeshStandardMaterial({ color: colors.concrete, roughness: 0.9 })
    );
    basementFloor.position.set(10, -15, 0);
    basementFloor.receiveShadow = true;
    scene.add(basementFloor);
    meshes.push(basementFloor);

    radioactiveWater = new THREE.Mesh(
      new THREE.BoxGeometry(48, 1, 48),
      new THREE.MeshStandardMaterial({
        color: colors.waterRadioactive,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.6
      })
    );
    radioactiveWater.position.set(10, -13, 0);
    radioactiveWater.receiveShadow = true;
    radioactiveWater.castShadow = true;
    scene.add(radioactiveWater);
    meshes.push(radioactiveWater);

    var crackZone = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.7 })
    );
    crackZone.position.set(25, -15.5, 20);
    crackZone.castShadow = true;
    crackZone.receiveShadow = true;
    scene.add(crackZone);
    meshes.push(crackZone);
  }

  function buildVentilationHepaFilters() {
    var filterBankX = 40;
    var filterBankZ = 5;

    for (var f = 0; f < 3; f++) {
      var filterBank = new THREE.Mesh(
        new THREE.BoxGeometry(3, 6, 2.5),
        new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.5 })
      );
      filterBank.position.set(filterBankX, 3 + f * 0.5, filterBankZ - f * 3);
      filterBank.castShadow = true;
      filterBank.receiveShadow = true;
      scene.add(filterBank);
      meshes.push(filterBank);
    }

    var fanMotor = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.6 })
    );
    fanMotor.position.set(42, 7, 2);
    fanMotor.castShadow = true;
    scene.add(fanMotor);
    meshes.push(fanMotor);
  }

  function buildLeadLinedWalls() {
    var westWall = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 50),
      new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.6 })
    );
    westWall.position.set(-10, 6, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    meshes.push(westWall);

    var eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 50),
      new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.6 })
    );
    eastWall.position.set(40, 6, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    meshes.push(eastWall);
  }

  function buildEmergencyContainmentDrums() {
    var drumX = 5;
    var drumZ = -30;

    for (var d = 0; d < 4; d++) {
      var drum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 2, 16),
        new THREE.MeshStandardMaterial({ color: colors.radYellow, metalness: 0.3 })
      );
      drum.position.set(drumX + d * 2.2, 1, drumZ);
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);
      meshes.push(drum);

      var drumLabel = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 0.1),
        new THREE.MeshStandardMaterial({ color: colors.warningRed })
      );
      drumLabel.position.set(drumX + d * 2.2, 1.5, 0.85);
      drumLabel.castShadow = true;
      scene.add(drumLabel);
      meshes.push(drumLabel);
    }
  }

  function buildCoolingWaterCircuit() {
    var pipeStartX = 15;
    var pipeStartZ = -5;

    for (var p = 0; p < 6; p++) {
      var pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 4, 12),
        new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.7 })
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(pipeStartX + p * 3, 3.5, pipeStartZ);
      pipe.castShadow = true;
      scene.add(pipe);
      coolingPipes.push(pipe);
      meshes.push(pipe);
    }

    var heatExchanger = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.5, 3),
      new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.5 })
    );
    heatExchanger.position.set(30, 2.2, -5);
    heatExchanger.castShadow = true;
    heatExchanger.receiveShadow = true;
    scene.add(heatExchanger);
    meshes.push(heatExchanger);
  }

  function buildControlRoom() {
    var controlBox = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 8),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.5 })
    );
    controlBox.position.set(5, 2, 28);
    controlBox.castShadow = true;
    controlBox.receiveShadow = true;
    scene.add(controlBox);
    meshes.push(controlBox);

    for (var i = 0; i < 6; i++) {
      var panel = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.8, 0.2),
        new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.6 })
      );
      panel.position.set(-4 + i * 2, 2.5, 28.5);
      panel.castShadow = true;
      scene.add(panel);
      meshes.push(panel);

      var button = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: colors.radYellow, emissive: colors.radYellow, emissiveIntensity: 0.3 })
      );
      button.position.set(-4 + i * 2, 2, 28.6);
      button.castShadow = true;
      scene.add(button);
      meshes.push(button);
    }
  }

  function buildReactorCoreMockup() {
    var shielding = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 4, 32),
      new THREE.MeshStandardMaterial({ color: colors.leadGray, metalness: 0.6 })
    );
    shielding.position.set(20, 2.5, 15);
    shielding.castShadow = true;
    shielding.receiveShadow = true;
    scene.add(shielding);
    meshes.push(shielding);

    reactorCore = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshStandardMaterial({
        color: colors.coreGlow,
        emissive: colors.coreGlow,
        emissiveIntensity: 0.8,
        metalness: 0.7
      })
    );
    reactorCore.position.set(20, 2.5, 15);
    reactorCore.castShadow = true;
    scene.add(reactorCore);
    meshes.push(reactorCore);

    for (var c = 0; c < 8; c++) {
      var angle = (c / 8) * Math.PI * 2;
      var rodX = 20 + Math.cos(angle) * 3;
      var rodZ = 15 + Math.sin(angle) * 3;

      var controlRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 2.5, 12),
        new THREE.MeshStandardMaterial({ color: colors.containmentOrange, metalness: 0.5 })
      );
      controlRod.position.set(rodX, 2.5, rodZ);
      controlRod.castShadow = true;
      scene.add(controlRod);
      meshes.push(controlRod);
    }
  }

  function buildDecontaminationShower() {
    var showerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 4),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.6 })
    );
    showerFrame.position.set(-25, 1.5, 20);
    showerFrame.castShadow = true;
    showerFrame.receiveShadow = true;
    scene.add(showerFrame);
    meshes.push(showerFrame);

    deconShower = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: colors.waterRadioactive, metalness: 0.4 })
    );
    deconShower.position.set(-25, 2.8, 20);
    deconShower.castShadow = true;
    scene.add(deconShower);
    meshes.push(deconShower);

    var showerPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 2, 12),
      new THREE.MeshStandardMaterial({ color: colors.darkSteel, metalness: 0.7 })
    );
    showerPipe.position.set(-25, 3.5, 20);
    showerPipe.castShadow = true;
    scene.add(showerPipe);
    meshes.push(showerPipe);
  }

  function buildRadiationWarningSignsAndLights() {
    var signPositions = [
      { x: -5, y: 6, z: -25 },
      { x: 10, y: 6, z: 25 },
      { x: 35, y: 6, z: 10 },
      { x: 0, y: 6, z: 0 }
    ];

    for (var w = 0; w < signPositions.length; w++) {
      var sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 0.2),
        new THREE.MeshStandardMaterial({ color: colors.radYellow, metalness: 0.3 })
      );
      sign.position.set(signPositions[w].x, signPositions[w].y, signPositions[w].z);
      sign.castShadow = true;
      scene.add(sign);
      meshes.push(sign);

      var hazardMark = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: colors.warningRed, metalness: 0.4 })
      );
      hazardMark.position.set(signPositions[w].x, signPositions[w].y, signPositions[w].z + 0.15);
      hazardMark.castShadow = true;
      scene.add(hazardMark);
      meshes.push(hazardMark);

      var alarmLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshStandardMaterial({
          color: colors.warningRed,
          emissive: colors.warningRed,
          emissiveIntensity: 0.5
        })
      );
      alarmLight.position.set(signPositions[w].x, signPositions[w].y + 1, signPositions[w].z);
      alarmLight.castShadow = true;
      scene.add(alarmLight);
      warningLights.push(alarmLight);
      meshes.push(alarmLight);
    }
  }

  function createSpawnPoints() {
    spawnPoints = [
      { x: -28, y: 2, z: -20 },
      { x: 10, y: 1, z: 5 },
      { x: 35, y: 1, z: 10 },
      { x: 5, y: 2, z: 28 },
      { x: 10, y: -12, z: 0 }
    ];
  }

  function update(delta) {
    elapsedTime += delta;

    for (var i = 0; i < centrifuges.length; i++) {
      if (i % 2 === 0) {
        centrifuges[i].rotation.y += delta * 8;
      }
    }

    if (radioactiveWater) {
      var targetHeight = Math.min(-11, -13 + elapsedTime * 0.3);
      radioactiveWater.position.y += (targetHeight - radioactiveWater.position.y) * 0.1;
    }

    if (geigerCounter) {
      var flashIntensity = Math.sin(elapsedTime * 4) * 0.5 + 0.5;
      geigerCounter.material.emissiveIntensity = flashIntensity * 0.4;
    }

    if (reactorCore) {
      var corePulse = Math.sin(elapsedTime * 2) * 0.4 + 0.6;
      reactorCore.material.emissiveIntensity = corePulse;
      reactorCore.scale.set(1 + corePulse * 0.1, 1 + corePulse * 0.1, 1 + corePulse * 0.1);
    }

    for (var l = 0; l < warningLights.length; l++) {
      var strobeFlash = Math.sin(elapsedTime * 3) > 0 ? 0.8 : 0.2;
      warningLights[l].material.emissiveIntensity = strobeFlash;
    }

    if (deconShower) {
      var showerActive = Math.sin(elapsedTime * 2) > 0;
      deconShower.material.opacity = showerActive ? 0.7 : 0.2;
    }

    for (var p = 0; p < coolingPipes.length; p++) {
      var pipeGlow = Math.sin(elapsedTime * 1.5 + p) * 0.3 + 0.4;
      coolingPipes[p].material.emissiveIntensity = pipeGlow;
    }

    if (radiationFog.length < 5) {
      var fogSphere = new THREE.Mesh(
        new THREE.SphereGeometry(Math.random() * 1 + 0.5, 8, 8),
        new THREE.MeshStandardMaterial({
          color: colors.coreGlow,
          transparent: true,
          opacity: 0.3,
          emissive: colors.coreGlow,
          emissiveIntensity: 0.2
        })
      );
      var fogX = Math.random() * 50 - 10;
      var fogY = Math.random() * 4 + 1;
      var fogZ = Math.random() * 50 - 25;
      fogSphere.position.set(fogX, fogY, fogZ);
      scene.add(fogSphere);
      radiationFog.push(fogSphere);
      meshes.push(fogSphere);
    }

    for (var f = 0; f < radiationFog.length; f++) {
      radiationFog[f].position.x += Math.sin(elapsedTime + f) * 0.02;
      radiationFog[f].position.z += Math.cos(elapsedTime + f) * 0.02;
      radiationFog[f].position.y += Math.sin(elapsedTime * 0.5 + f) * 0.01;
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    centrifuges = [];
    warningLights = [];
    coolingPipes = [];
    radiationFog = [];
    spawnPoints = [];
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
