window.DataCenter = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var lights = [];
  var animationData = {};

  var COLORS = {
    serverBlack: 0x111111,
    indicatorGreen: 0x00CC44,
    indicatorBlue: 0x0044FF,
    steelGray: 0x778899,
    coolingWhite: 0xEEEEEE,
    alarmRed: 0xFF2200,
    darkGray: 0x333333,
    lightGray: 0xAAAAAA
  };

  var spawnPoints = [];

  function createServerRack(x, y, z) {
    var rackGroup = new THREE.Group();

    var rackGeometry = new THREE.BoxGeometry(0.6, 2.2, 0.8);
    var rackMaterial = new THREE.MeshStandardMaterial({ color: COLORS.serverBlack });
    var rackMesh = new THREE.Mesh(rackGeometry, rackMaterial);
    rackMesh.position.set(0, 1.1, 0);
    rackGroup.add(rackMesh);
    meshes.push(rackMesh);

    for (var i = 0; i < 12; i++) {
      var slotGeometry = new THREE.BoxGeometry(0.55, 0.15, 0.05);
      var slotMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
      var slotMesh = new THREE.Mesh(slotGeometry, slotMaterial);
      slotMesh.position.set(0, 1.8 - (i * 0.18), 0.35);
      rackGroup.add(slotMesh);
      meshes.push(slotMesh);

      var ledGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.02);
      var ledMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.indicatorGreen,
        emissive: COLORS.indicatorGreen,
        emissiveIntensity: 0.5
      });
      var ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
      ledMesh.position.set(0.22, 1.78 - (i * 0.18), 0.38);
      rackGroup.add(ledMesh);
      meshes.push(ledMesh);

      if (!animationData.ledLights) animationData.ledLights = [];
      animationData.ledLights.push({
        mesh: ledMesh,
        baseIntensity: 0.5,
        blinkSpeed: 2 + Math.random() * 3,
        offset: Math.random() * Math.PI * 2
      });
    }

    var powerGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.25);
    var powerMaterial = new THREE.MeshStandardMaterial({ color: COLORS.alarmRed });
    var powerMesh = new THREE.Mesh(powerGeometry, powerMaterial);
    powerMesh.position.set(-0.3, 0.3, 0.4);
    rackGroup.add(powerMesh);
    meshes.push(powerMesh);

    rackGroup.position.set(x, y, z);
    scene.add(rackGroup);
    return rackGroup;
  }

  function createCoolingUnit(x, y, z) {
    var coolingGroup = new THREE.Group();

    var housingGeometry = new THREE.BoxGeometry(1.2, 1.0, 0.9);
    var housingMaterial = new THREE.MeshStandardMaterial({ color: COLORS.coolingWhite });
    var housingMesh = new THREE.Mesh(housingGeometry, housingMaterial);
    coolingGroup.add(housingMesh);
    meshes.push(housingMesh);

    for (var i = 0; i < 4; i++) {
      var fanGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 32);
      var fanMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
      var fanMesh = new THREE.Mesh(fanGeometry, fanMaterial);
      fanMesh.rotation.z = Math.PI / 2;
      fanMesh.position.set(-0.3 + (i * 0.2), 0.2, 0);
      coolingGroup.add(fanMesh);
      meshes.push(fanMesh);

      if (!animationData.fans) animationData.fans = [];
      animationData.fans.push({ mesh: fanMesh, speed: 5 + Math.random() * 3 });
    }

    var filterGeometry = new THREE.BoxGeometry(1.1, 0.95, 0.15);
    var filterMaterial = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
    var filterMesh = new THREE.Mesh(filterGeometry, filterMaterial);
    filterMesh.position.set(0, 0, 0.4);
    coolingGroup.add(filterMesh);
    meshes.push(filterMesh);

    coolingGroup.position.set(x, y, z);
    scene.add(coolingGroup);
    return coolingGroup;
  }

  function createFiberCableTray(x, y, z, length) {
    var trayGroup = new THREE.Group();

    var trayGeometry = new THREE.BoxGeometry(length, 0.15, 0.3);
    var trayMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray });
    var trayMesh = new THREE.Mesh(trayGeometry, trayMaterial);
    trayGroup.add(trayMesh);
    meshes.push(trayMesh);

    var segmentCount = Math.floor(length / 0.4);
    for (var i = 0; i < segmentCount; i++) {
      var ledGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.02);
      var ledMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.indicatorBlue,
        emissive: COLORS.indicatorBlue,
        emissiveIntensity: 0.6
      });
      var ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
      ledMesh.position.set(-length / 2 + 0.3 + (i * 0.4), 0.1, 0.2);
      trayGroup.add(ledMesh);
      meshes.push(ledMesh);

      if (!animationData.fiberLeds) animationData.fiberLeds = [];
      animationData.fiberLeds.push({
        mesh: ledMesh,
        pulseSpeed: 3 + Math.random() * 2,
        offset: Math.random() * Math.PI * 2
      });
    }

    trayGroup.position.set(x, y, z);
    scene.add(trayGroup);
    return trayGroup;
  }

  function createUPSRoom(x, y, z) {
    var upsGroup = new THREE.Group();

    for (var i = 0; i < 6; i++) {
      var bankGeometry = new THREE.BoxGeometry(0.5, 2.0, 0.6);
      var bankMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
      var bankMesh = new THREE.Mesh(bankGeometry, bankMaterial);
      bankMesh.position.set(-1.5 + (i * 0.6), 1.0, 0);
      upsGroup.add(bankMesh);
      meshes.push(bankMesh);

      var statusGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.03);
      var statusMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.indicatorGreen,
        emissive: COLORS.indicatorGreen
      });
      var statusMesh = new THREE.Mesh(statusGeometry, statusMaterial);
      statusMesh.position.set(-1.5 + (i * 0.6), 0.2, 0.32);
      upsGroup.add(statusMesh);
      meshes.push(statusMesh);
    }

    upsGroup.position.set(x, y, z);
    scene.add(upsGroup);
    spawnPoints.push({ position: new THREE.Vector3(x, y + 0.5, z + 2) });
    return upsGroup;
  }

  function createNOCRoom(x, y, z) {
    var nocGroup = new THREE.Group();

    var deskGeometry = new THREE.BoxGeometry(3.0, 0.8, 1.2);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var deskMesh = new THREE.Mesh(deskGeometry, deskMaterial);
    deskMesh.position.set(0, 0.4, 0);
    nocGroup.add(deskMesh);
    meshes.push(deskMesh);

    for (var i = 0; i < 6; i++) {
      var screenGeometry = new THREE.BoxGeometry(0.6, 0.45, 0.08);
      var screenMaterial = new THREE.MeshStandardMaterial({ color: COLORS.indicatorBlue });
      var screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
      screenMesh.position.set(-1.3 + (i * 0.5), 1.2, 0.5);
      nocGroup.add(screenMesh);
      meshes.push(screenMesh);

      if (!animationData.screens) animationData.screens = [];
      animationData.screens.push({
        mesh: screenMesh,
        glowIntensity: 0.4,
        pulseSpeed: 1.5 + Math.random() * 1
      });
    }

    var consoleGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.8);
    var consoleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.serverBlack });
    var consoleMesh = new THREE.Mesh(consoleGeometry, consoleMaterial);
    consoleMesh.position.set(0, 1.1, 0);
    nocGroup.add(consoleMesh);
    meshes.push(consoleMesh);

    var keyboardGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.3);
    var keyboardMaterial = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
    var keyboardMesh = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboardMesh.position.set(0, 1.3, 0.3);
    nocGroup.add(keyboardMesh);
    meshes.push(keyboardMesh);

    var progressGeometry = new THREE.BoxGeometry(1.5, 0.15, 0.08);
    var progressMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.alarmRed,
      emissive: COLORS.alarmRed
    });
    var progressMesh = new THREE.Mesh(progressGeometry, progressMaterial);
    progressMesh.position.set(0, 0.3, 0.6);
    nocGroup.add(progressMesh);
    meshes.push(progressMesh);
    animationData.exfilProgress = { mesh: progressMesh, progress: 0 };

    nocGroup.position.set(x, y, z);
    scene.add(nocGroup);
    spawnPoints.push({ position: new THREE.Vector3(x, y + 1.0, z + 2) });
    return nocGroup;
  }

  function createHalonSystem(x, y, z) {
    var halonGroup = new THREE.Group();

    for (var i = 0; i < 2; i++) {
      var tankGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 16);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray });
      var tankMesh = new THREE.Mesh(tankGeometry, tankMaterial);
      tankMesh.position.set(-0.5 + (i * 1.0), 0.9, 0);
      halonGroup.add(tankMesh);
      meshes.push(tankMesh);

      var gaugeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      var gaugeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
      var gaugeMesh = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
      gaugeMesh.position.set(-0.5 + (i * 1.0), 1.8, 0.35);
      halonGroup.add(gaugeMesh);
      meshes.push(gaugeMesh);
    }

    var pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 4.0, 16);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var pipeMesh = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipeMesh.rotation.z = Math.PI / 2;
    pipeMesh.position.set(0, 2.8, 0);
    halonGroup.add(pipeMesh);
    meshes.push(pipeMesh);

    for (var i = 0; i < 8; i++) {
      var nozzleGeometry = new THREE.ConeGeometry(0.12, 0.35, 12);
      var nozzleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray });
      var nozzleMesh = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
      nozzleMesh.position.set(-1.8 + (i * 0.5), 2.65, 0);
      nozzleMesh.rotation.x = Math.PI * 0.3;
      halonGroup.add(nozzleMesh);
      meshes.push(nozzleMesh);
    }

    halonGroup.position.set(x, y, z);
    scene.add(halonGroup);
    return halonGroup;
  }

  function createBiometricDoor(x, y, z) {
    var doorGroup = new THREE.Group();

    var frameGeometry = new THREE.BoxGeometry(1.2, 2.5, 0.15);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray });
    var frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    doorGroup.add(frameMesh);
    meshes.push(frameMesh);

    var panelGeometry = new THREE.BoxGeometry(1.0, 2.3, 0.08);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
    panelMesh.position.set(0, 0, 0.05);
    doorGroup.add(panelMesh);
    meshes.push(panelMesh);
    animationData.doorPanel = { mesh: panelMesh, isOpen: false };

    var scannerGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.08);
    var scannerMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.indicatorGreen,
      emissive: COLORS.indicatorGreen,
      emissiveIntensity: 0.3
    });
    var scannerMesh = new THREE.Mesh(scannerGeometry, scannerMaterial);
    scannerMesh.position.set(-0.3, 0.8, 0.12);
    doorGroup.add(scannerMesh);
    meshes.push(scannerMesh);

    var lockGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.06);
    var lockMaterial = new THREE.MeshStandardMaterial({ color: COLORS.alarmRed });
    var lockMesh = new THREE.Mesh(lockGeometry, lockMaterial);
    lockMesh.position.set(0.3, 1.0, 0.12);
    doorGroup.add(lockMesh);
    meshes.push(lockMesh);
    animationData.lockIndicator = { mesh: lockMesh, locked: true };

    doorGroup.position.set(x, y, z);
    scene.add(doorGroup);
    spawnPoints.push({ position: new THREE.Vector3(x + 2, y, z) });
    return doorGroup;
  }

  function createPowerDistributionUnit(x, y, z) {
    var pduGroup = new THREE.Group();

    var cabinetGeometry = new THREE.BoxGeometry(0.5, 2.0, 0.6);
    var cabinetMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var cabinetMesh = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
    pduGroup.add(cabinetMesh);
    meshes.push(cabinetMesh);

    for (var i = 0; i < 16; i++) {
      var outletGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.04);
      var outletMaterial = new THREE.MeshStandardMaterial({ color: COLORS.alarmRed });
      var outletMesh = new THREE.Mesh(outletGeometry, outletMaterial);
      outletMesh.position.set(0.15, 1.8 - (i * 0.23), 0.32);
      pduGroup.add(outletMesh);
      meshes.push(outletMesh);
    }

    var breakerGeometry = new THREE.BoxGeometry(0.12, 0.25, 0.1);
    var breakerMaterial = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
    var breakerMesh = new THREE.Mesh(breakerGeometry, breakerMaterial);
    breakerMesh.position.set(-0.2, 1.7, 0.35);
    pduGroup.add(breakerMesh);
    meshes.push(breakerMesh);

    pduGroup.position.set(x, y, z);
    scene.add(pduGroup);
    return pduGroup;
  }

  function createRaisedFloor(x, y, z, width, depth) {
    var floorGroup = new THREE.Group();

    var tileSize = 0.6;
    var tilesX = Math.ceil(width / tileSize);
    var tilesZ = Math.ceil(depth / tileSize);

    for (var ix = 0; ix < tilesX; ix++) {
      for (var iz = 0; iz < tilesZ; iz++) {
        var tileGeometry = new THREE.BoxGeometry(tileSize, 0.01, tileSize);
        var tileMaterial = new THREE.MeshStandardMaterial({ color: COLORS.lightGray });
        var tileMesh = new THREE.Mesh(tileGeometry, tileMaterial);
        tileMesh.position.set(
          -width / 2 + (ix * tileSize) + tileSize / 2,
          0,
          -depth / 2 + (iz * tileSize) + tileSize / 2
        );
        floorGroup.add(tileMesh);
        meshes.push(tileMesh);
      }
    }

    for (var ix = 0; ix < tilesX; ix++) {
      for (var iz = 0; iz < tilesZ; iz++) {
        var pedestalGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.15);
        var pedestalMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray });
        var pedestalMesh = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        pedestalMesh.position.set(
          -width / 2 + (ix * tileSize) + tileSize / 2,
          -0.15,
          -depth / 2 + (iz * tileSize) + tileSize / 2
        );
        floorGroup.add(pedestalMesh);
        meshes.push(pedestalMesh);
      }
    }

    floorGroup.position.set(x, y, z);
    scene.add(floorGroup);
    return floorGroup;
  }

  function createCCTVCamera(x, y, z) {
    var cameraGroup = new THREE.Group();

    var mountGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.08);
    var mountMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steelGray });
    var mountMesh = new THREE.Mesh(mountGeometry, mountMaterial);
    mountMesh.position.set(0, -0.1, 0);
    cameraGroup.add(mountMesh);
    meshes.push(mountMesh);

    var bodyGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(0, 0.1, 0);
    cameraGroup.add(bodyMesh);
    meshes.push(bodyMesh);

    var lensGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    var lensMaterial = new THREE.MeshStandardMaterial({ color: COLORS.indicatorBlue });
    var lensMesh = new THREE.Mesh(lensGeometry, lensMaterial);
    lensMesh.position.set(0, 0.1, 0.1);
    cameraGroup.add(lensMesh);
    meshes.push(lensMesh);

    var indicatorGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.03);
    var indicatorMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.indicatorGreen,
      emissive: COLORS.indicatorGreen
    });
    var indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicatorMesh.position.set(0.08, 0.15, 0);
    cameraGroup.add(indicatorMesh);
    meshes.push(indicatorMesh);

    cameraGroup.position.set(x, y, z);
    scene.add(cameraGroup);
    return cameraGroup;
  }

  function createHotColdAisle(x, y, z, width) {
    var aisleGroup = new THREE.Group();

    var coldGeometry = new THREE.BoxGeometry(width, 1.8, 0.1);
    var coldMaterial = new THREE.MeshStandardMaterial({ color: COLORS.indicatorBlue });
    var coldMesh = new THREE.Mesh(coldGeometry, coldMaterial);
    coldMesh.position.set(0, 0.9, -0.5);
    aisleGroup.add(coldMesh);
    meshes.push(coldMesh);

    var hotGeometry = new THREE.BoxGeometry(width, 1.8, 0.1);
    var hotMaterial = new THREE.MeshStandardMaterial({ color: COLORS.alarmRed });
    var hotMesh = new THREE.Mesh(hotGeometry, hotMaterial);
    hotMesh.position.set(0, 0.9, 0.5);
    aisleGroup.add(hotMesh);
    meshes.push(hotMesh);

    aisleGroup.position.set(x, y, z);
    scene.add(aisleGroup);
    return aisleGroup;
  }

  function init(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;
    meshes = [];
    lights = [];
    animationData = {};

    createRaisedFloor(0, 0, 0, 20, 20);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 5; col++) {
        createServerRack(-8 + (col * 3.5), 0.1, -6 + (row * 3.5));
      }
      spawnPoints.push({ position: new THREE.Vector3(-10, 1.0, -8 + (row * 3.5)) });
    }

    for (var i = 0; i < 3; i++) {
      createCoolingUnit(8, 0.5, -6 + (i * 4));
    }

    createFiberCableTray(-10, 3.0, -8, 18);
    createFiberCableTray(-10, 3.0, 0, 18);
    createFiberCableTray(-10, 3.0, 8, 18);

    createUPSRoom(-8, 0, 9);
    createNOCRoom(6, 0, -8);
    createHalonSystem(0, 2.0, 10);
    createBiometricDoor(-9, 0, -10);
    createPowerDistributionUnit(4, 0, 8);
    createPowerDistributionUnit(-6, 0, 10);
    createHotColdAisle(-5, 0, 0, 8);
    createHotColdAisle(3, 0, 0, 8);

    createCCTVCamera(-9, 2.8, -9);
    createCCTVCamera(7, 2.8, 7);
    createCCTVCamera(-2, 2.8, 9);
    createCCTVCamera(8, 2.8, -6);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var pointLight1 = new THREE.PointLight(0x0088FF, 0.6, 20);
    pointLight1.position.set(6, 2, -8);
    scene.add(pointLight1);
    lights.push(pointLight1);

    var pointLight2 = new THREE.PointLight(0xFF2200, 0.5, 15);
    pointLight2.position.set(-8, 2, 9);
    scene.add(pointLight2);
    lights.push(pointLight2);

    return {
      spawnPoints: spawnPoints,
      meshes: meshes
    };
  }

  function update(delta) {
    if (animationData.ledLights) {
      for (var i = 0; i < animationData.ledLights.length; i++) {
        var led = animationData.ledLights[i];
        var blink = Math.sin(Date.now() * 0.001 * led.blinkSpeed + led.offset) * 0.5 + 0.5;
        led.mesh.material.emissiveIntensity = led.baseIntensity * blink;
      }
    }

    if (animationData.fans) {
      for (var i = 0; i < animationData.fans.length; i++) {
        var fan = animationData.fans[i];
        fan.mesh.rotation.x += (fan.speed * delta);
      }
    }

    if (animationData.fiberLeds) {
      for (var i = 0; i < animationData.fiberLeds.length; i++) {
        var fiberLed = animationData.fiberLeds[i];
        var pulse = Math.sin(Date.now() * 0.001 * fiberLed.pulseSpeed + fiberLed.offset) * 0.5 + 0.5;
        fiberLed.mesh.material.emissiveIntensity = 0.6 * pulse;
      }
    }

    if (animationData.screens) {
      for (var i = 0; i < animationData.screens.length; i++) {
        var screen = animationData.screens[i];
        var screenGlow = Math.sin(Date.now() * 0.001 * screen.pulseSpeed) * 0.3 + 0.4;
        screen.mesh.material.emissiveIntensity = screenGlow;
      }
    }

    if (animationData.exfilProgress) {
      animationData.exfilProgress.progress = (animationData.exfilProgress.progress + delta * 0.15) % 1.0;
      var progressScale = animationData.exfilProgress.progress;
      animationData.exfilProgress.mesh.scale.x = progressScale;
    }

    if (animationData.doorPanel && animationData.doorPanel.isOpen) {
      animationData.doorPanel.mesh.position.z += delta * 2.0;
      if (animationData.doorPanel.mesh.position.z > 1.0) {
        animationData.doorPanel.isOpen = false;
      }
    }

    if (animationData.lockIndicator) {
      var locked = animationData.lockIndicator.locked;
      animationData.lockIndicator.mesh.material.color.setHex(
        locked ? COLORS.alarmRed : COLORS.indicatorGreen
      );
      animationData.lockIndicator.mesh.material.emissive.setHex(
        locked ? COLORS.alarmRed : COLORS.indicatorGreen
      );
    }
  }

  function reset() {
    for (var i = meshes.length - 1; i >= 0; i--) {
      if (meshes[i].parent) {
        meshes[i].parent.remove(meshes[i]);
      }
    }

    for (var i = lights.length - 1; i >= 0; i--) {
      scene.remove(lights[i]);
    }

    meshes = [];
    lights = [];
    spawnPoints = [];
    animationData = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
