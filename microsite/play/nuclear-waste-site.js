window.NuclearWasteSite = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var state = {
    barrelPulse: 0,
    poolRipple: 0,
    steamTime: 0,
    monitorFlicker: 0,
    ecoTerroristPos: 0,
    radiationMeterAngle: 0,
    bombAssemblyProgress: 0
  };

  var colors = {
    radioactiveGreen: 0x44FF44,
    wasteYellow: 0xCCCC00,
    hazmatOrange: 0xFF6600,
    concreteGray: 0x888888,
    dangerRed: 0xFF0000,
    poolGlow: 0x00FF88,
    darkGray: 0x444444,
    black: 0x000000,
    white: 0xFFFFFF,
    steelBlue: 0x4169E1
  };

  function createMesh(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(position.x, position.y, position.z);
    if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
    if (scale) mesh.scale.set(scale.x, scale.y, scale.z);
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createContainmentBuilding() {
    // Main containment structure - large concrete box
    var geometry = new THREE.BoxGeometry(60, 40, 50);
    var material = new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.8 });
    var building = createMesh(geometry, material, { x: 0, y: 20, z: 0 });

    // Reinforced walls (inner containment)
    var innerGeometry = new THREE.BoxGeometry(55, 35, 45);
    var innerMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
    createMesh(innerGeometry, innerMaterial, { x: 0, y: 20, z: 0 });

    // Roof
    var roofGeometry = new THREE.BoxGeometry(65, 2, 55);
    var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3 });
    createMesh(roofGeometry, roofMaterial, { x: 0, y: 41, z: 0 });
  }

  function createRadioactiveBarrels() {
    var barrelPositions = [
      { x: -15, y: 8, z: -15 },
      { x: -10, y: 8, z: -15 },
      { x: -5, y: 8, z: -15 },
      { x: 0, y: 8, z: -15 },
      { x: 5, y: 8, z: -15 },
      { x: 10, y: 8, z: -15 },
      { x: 15, y: 8, z: -15 },
      { x: -15, y: 8, z: -10 },
      { x: -15, y: 8, z: -5 },
      { x: -15, y: 8, z: 0 },
      { x: -15, y: 8, z: 5 },
      { x: -15, y: 8, z: 10 },
      { x: -15, y: 8, z: 15 },
      { x: 15, y: 8, z: -10 },
      { x: 15, y: 8, z: 10 },
      { x: 0, y: 8, z: 15 },
      { x: 10, y: 8, z: 0 },
      { x: -10, y: 8, z: 0 }
    ];

    barrelPositions.forEach(function(pos) {
      var geometry = new THREE.CylinderGeometry(2, 2, 5, 16);
      var material = new THREE.MeshStandardMaterial({
        color: colors.radioactiveGreen,
        emissive: colors.radioactiveGreen,
        emissiveIntensity: 0.3,
        metalness: 0.1,
        roughness: 0.6
      });
      var barrel = createMesh(geometry, material, pos);
      barrel.userData.isBarrel = true;
      barrel.userData.pulsePhase = Math.random() * Math.PI * 2;

      // Barrel bands
      var bandGeometry = new THREE.CylinderGeometry(2.1, 2.1, 0.3, 16);
      var bandMaterial = new THREE.MeshStandardMaterial({ color: colors.wasteYellow });
      createMesh(bandGeometry, bandMaterial, { x: pos.x, y: pos.y + 1.5, z: pos.z });
      createMesh(bandGeometry, bandMaterial, { x: pos.x, y: pos.y - 1.5, z: pos.z });

      // Radiation symbol on barrel (small yellow cylinder)
      var symbolGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 8);
      var symbolMaterial = new THREE.MeshStandardMaterial({ color: colors.wasteYellow });
      createMesh(symbolGeometry, symbolMaterial, { x: pos.x + 2, y: pos.y, z: pos.z });
    });
  }

  function createContainmentPool() {
    // Pool basin
    var poolGeometry = new THREE.BoxGeometry(70, 15, 60);
    var poolMaterial = new THREE.MeshStandardMaterial({
      color: 0x001100,
      emissive: colors.poolGlow,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.4
    });
    var pool = createMesh(poolGeometry, poolMaterial, { x: 50, y: -8, z: 30 });
    pool.userData.isPool = true;
    pool.userData.originalY = -8;

    // Pool walls (concrete)
    var wallThickness = 2;
    var wallMaterial = new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.9 });

    // Front wall
    var frontWallGeometry = new THREE.BoxGeometry(70, 15, wallThickness);
    createMesh(frontWallGeometry, wallMaterial, { x: 50, y: -8, z: 60 });

    // Back wall
    createMesh(frontWallGeometry, wallMaterial, { x: 50, y: -8, z: 0 });

    // Left wall
    var sideWallGeometry = new THREE.BoxGeometry(wallThickness, 15, 60);
    createMesh(sideWallGeometry, wallMaterial, { x: 15, y: -8, z: 30 });

    // Right wall
    createMesh(sideWallGeometry, wallMaterial, { x: 85, y: -8, z: 30 });

    // Radioactive liquid surface indicator
    var liquidGeometry = new THREE.BoxGeometry(68, 0.5, 58);
    var liquidMaterial = new THREE.MeshStandardMaterial({
      color: colors.poolGlow,
      emissive: colors.poolGlow,
      emissiveIntensity: 0.6
    });
    var liquid = createMesh(liquidGeometry, liquidMaterial, { x: 50, y: -0.5, z: 30 });
    liquid.userData.isLiquid = true;
  }

  function createDecontaminationCorridor() {
    // Arch frame structure
    var archBase = 30;
    var archHeight = 8;

    // Floor
    var floorGeometry = new THREE.BoxGeometry(40, 0.5, 15);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    createMesh(floorGeometry, floorMaterial, { x: -40, y: 0.25, z: -40 });

    // Left arch post
    var postGeometry = new THREE.BoxGeometry(2, archHeight, 2);
    var postMaterial = new THREE.MeshStandardMaterial({ color: colors.steelBlue, metalness: 0.6 });
    createMesh(postGeometry, postMaterial, { x: -60, y: archHeight / 2, z: -40 });

    // Right arch post
    createMesh(postGeometry, postMaterial, { x: -20, y: archHeight / 2, z: -40 });

    // Arch top beam
    var archGeometry = new THREE.BoxGeometry(42, 2, 2);
    createMesh(archGeometry, postMaterial, { x: -40, y: archHeight + 1, z: -40 });

    // Shower heads (cylinders)
    for (var i = 0; i < 6; i++) {
      var showerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
      var showerMaterial = new THREE.MeshStandardMaterial({ color: colors.steelBlue, metalness: 0.7 });
      var xPos = -60 + (i * 8);
      createMesh(showerGeometry, showerMaterial, { x: xPos, y: archHeight, z: -40 });
    }

    // Water indicator spheres
    for (var j = 0; j < 4; j++) {
      var waterGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488FF,
        emissive: 0x2244FF,
        emissiveIntensity: 0.3
      });
      createMesh(waterGeometry, waterMaterial, { x: -60 + (j * 12), y: archHeight - 2, z: -40 });
    }
  }

  function createHazmatLockers() {
    // Locker wall
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 6; col++) {
        var lockerGeometry = new THREE.BoxGeometry(3, 3, 1.5);
        var lockerMaterial = new THREE.MeshStandardMaterial({
          color: colors.hazmatOrange,
          roughness: 0.7
        });
        var xPos = -50 + (col * 4);
        var yPos = 2 + (row * 3.5);
        var locker = createMesh(lockerGeometry, lockerMaterial, { x: xPos, y: yPos, z: -60 });

        // Locker door handle
        var handleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
        var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.8 });
        createMesh(handleGeometry, handleMaterial, { x: xPos + 1.4, y: yPos, z: -59.5 });
      }
    }
  }

  function createControlCenter() {
    // Control building
    var buildingGeometry = new THREE.BoxGeometry(25, 20, 20);
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: colors.darkGray, roughness: 0.8 });
    createMesh(buildingGeometry, buildingMaterial, { x: -70, y: 10, z: 20 });

    // Monitor screens
    for (var i = 0; i < 8; i++) {
      var screenGeometry = new THREE.BoxGeometry(2, 3, 0.2);
      var screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x001100,
        emissive: 0x00FF00,
        emissiveIntensity: 0.4
      });
      var xPos = -82 + (i % 4) * 3;
      var yPos = 5 + Math.floor(i / 4) * 4;
      var screen = createMesh(screenGeometry, screenMaterial, { x: xPos, y: yPos, z: 29.5 });
      screen.userData.isMonitor = true;
    }

    // Antenna on roof
    var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: colors.steelBlue, metalness: 0.9 });
    var antenna = createMesh(antennaGeometry, antennaMaterial, { x: -70, y: 24, z: 20 });
    antenna.userData.isAntenna = true;
  }

  function createCoolingTower() {
    // Cooling tower main cylinder
    var towerGeometry = new THREE.CylinderGeometry(8, 10, 35, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: colors.concreteGray, roughness: 0.7 });
    var tower = createMesh(towerGeometry, towerMaterial, { x: 70, y: 17.5, z: -50 });
    tower.userData.isCoolingTower = true;

    // Steam output indicators (small cylinders)
    for (var i = 0; i < 6; i++) {
      var steamGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
      var steamMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        transparent: true,
        opacity: 0.3
      });
      var angle = (i / 6) * Math.PI * 2;
      var xPos = 70 + Math.cos(angle) * 9;
      var zPos = -50 + Math.sin(angle) * 9;
      createMesh(steamGeometry, steamMaterial, { x: xPos, y: 35, z: zPos });
    }
  }

  function createRadiationWarningPoles() {
    // Poles with warning signs
    var polePositions = [
      { x: -80, z: -80 },
      { x: 80, z: -80 },
      { x: -80, z: 80 },
      { x: 80, z: 80 },
      { x: 0, z: -80 },
      { x: 0, z: 80 }
    ];

    polePositions.forEach(function(pos) {
      // Pole
      var poleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
      var poleMaterial = new THREE.MeshStandardMaterial({ color: colors.wasteYellow });
      createMesh(poleGeometry, poleMaterial, { x: pos.x, y: 7.5, z: pos.z });

      // Warning sign
      var signGeometry = new THREE.BoxGeometry(3, 3, 0.2);
      var signMaterial = new THREE.MeshStandardMaterial({ color: colors.dangerRed });
      createMesh(signGeometry, signMaterial, { x: pos.x, y: 14, z: pos.z });

      // Radiation symbol (yellow cross)
      var crossGeometry = new THREE.BoxGeometry(0.3, 2, 0.1);
      var crossMaterial = new THREE.MeshStandardMaterial({ color: colors.wasteYellow });
      createMesh(crossGeometry, crossMaterial, { x: pos.x, y: 14, z: pos.z + 0.15 });
      createMesh(crossGeometry, crossMaterial, { x: pos.x, y: 14, z: pos.z + 0.15 }, { y: Math.PI / 2 });
    });
  }

  function createChainLinkPerimeter() {
    // Fence posts
    var fencePositions = [
      { x: -85, z: -85 },
      { x: 85, z: -85 },
      { x: -85, z: 85 },
      { x: 85, z: 85 }
    ];

    fencePositions.forEach(function(pos) {
      var postGeometry = new THREE.BoxGeometry(1, 10, 1);
      var postMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 });
      createMesh(postGeometry, postMaterial, { x: pos.x, y: 5, z: pos.z });
    });

    // Fence lines with danger tape
    var linePositions = [
      { x1: -85, z1: -85, x2: 85, z2: -85 },
      { x1: 85, z1: -85, x2: 85, z2: 85 },
      { x1: 85, z1: 85, x2: -85, z2: 85 },
      { x1: -85, z1: 85, x2: -85, z2: -85 }
    ];

    linePositions.forEach(function(pos) {
      var geometry = new THREE.BoxGeometry(
        Math.abs(pos.x2 - pos.x1) || 1,
        0.5,
        Math.abs(pos.z2 - pos.z1) || 1
      );
      var material = new THREE.MeshStandardMaterial({ color: colors.dangerRed });
      createMesh(geometry, material, {
        x: (pos.x1 + pos.x2) / 2,
        y: 6,
        z: (pos.z1 + pos.z2) / 2
      });
    });
  }

  function createDirtyBombAssemblyArea() {
    // Work table
    var tableGeometry = new THREE.BoxGeometry(12, 1, 8);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x4d4d4d, roughness: 0.6 });
    createMesh(tableGeometry, tableMaterial, { x: 30, y: 0.5, z: -70 });

    // Table legs
    for (var i = 0; i < 4; i++) {
      var legGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      var legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var xOffset = i < 2 ? -5 : 5;
      var zOffset = i % 2 === 0 ? -3 : 3;
      createMesh(legGeometry, legMaterial, { x: 30 + xOffset, y: 0.25, z: -70 + zOffset });
    }

    // Assembly components (small boxes)
    var components = [
      { x: 20, color: colors.radioactiveGreen },
      { x: 30, color: colors.wasteYellow },
      { x: 40, color: colors.hazmatOrange }
    ];

    components.forEach(function(comp) {
      var compGeometry = new THREE.BoxGeometry(2, 1.5, 2);
      var compMaterial = new THREE.MeshStandardMaterial({
        color: comp.color,
        emissive: comp.color,
        emissiveIntensity: 0.2
      });
      var component = createMesh(compGeometry, compMaterial, { x: comp.x, y: 1.5, z: -70 });
      component.userData.isBombComponent = true;
    });

    // Progress indicator (vertical bar)
    var progressGeometry = new THREE.BoxGeometry(1, 2, 1);
    var progressMaterial = new THREE.MeshStandardMaterial({
      color: colors.dangerRed,
      emissive: colors.dangerRed,
      emissiveIntensity: 0.3
    });
    var progress = createMesh(progressGeometry, progressMaterial, { x: 30, y: 2, z: -65 });
    progress.userData.isBombProgress = true;
  }

  function createEmergencyShowerStations() {
    var stationPositions = [
      { x: -30, z: -60 },
      { x: 30, z: -60 },
      { x: -30, z: 60 },
      { x: 30, z: 60 }
    ];

    stationPositions.forEach(function(pos) {
      // Station enclosure
      var enclosureGeometry = new THREE.BoxGeometry(4, 5, 4);
      var enclosureMaterial = new THREE.MeshStandardMaterial({
        color: colors.dangerRed,
        metalness: 0.3
      });
      createMesh(enclosureGeometry, enclosureMaterial, { x: pos.x, y: 2.5, z: pos.z });

      // Shower head
      var headGeometry = new THREE.SphereGeometry(0.8, 12, 12);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: colors.steelBlue,
        metalness: 0.8
      });
      createMesh(headGeometry, headMaterial, { x: pos.x, y: 4.5, z: pos.z });

      // Emergency label
      var labelGeometry = new THREE.BoxGeometry(1.5, 0.5, 0.1);
      var labelMaterial = new THREE.MeshStandardMaterial({ color: colors.dangerRed });
      createMesh(labelGeometry, labelMaterial, { x: pos.x, y: 4.5, z: pos.z + 2.1 });
    });
  }

  function createEcoTerrorist() {
    // Hazmat suit (central body)
    var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    var hazmatMaterial = new THREE.MeshStandardMaterial({
      color: colors.hazmatOrange,
      roughness: 0.6
    });
    var body = createMesh(bodyGeometry, hazmatMaterial, { x: 0, y: 5, z: 0 });
    body.userData.isEcoTerrorist = true;
    body.userData.bodyPart = true;

    // Head
    var headGeometry = new THREE.SphereGeometry(0.5, 12, 12);
    var head = createMesh(headGeometry, hazmatMaterial, { x: 0, y: 6.2, z: 0 });
    head.userData.bodyPart = true;

    // Visor (glowing)
    var visorGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    var visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1100FF,
      emissive: 0x2200FF,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.7
    });
    createMesh(visorGeometry, visorMaterial, { x: 0.2, y: 6.2, z: 0.4 });

    // Arms
    var armGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    createMesh(armGeometry, hazmatMaterial, { x: -0.8, y: 5, z: 0 });
    createMesh(armGeometry, hazmatMaterial, { x: 0.8, y: 5, z: 0 });

    // Legs
    var legGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    createMesh(legGeometry, hazmatMaterial, { x: -0.3, y: 3, z: 0 });
    createMesh(legGeometry, hazmatMaterial, { x: 0.3, y: 3, z: 0 });
  }

  function createRadiationMeter() {
    // Gauge body
    var gaugeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
    var gaugeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
    createMesh(gaugeGeometry, gaugeMaterial, { x: -85, y: 15, z: 15 });

    // Needle (rotating indicator)
    var needleGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.1);
    var needleMaterial = new THREE.MeshStandardMaterial({ color: colors.dangerRed });
    var needle = createMesh(needleGeometry, needleMaterial, { x: -85, y: 15.5, z: 15.2 });
    needle.userData.isRadiationMeter = true;

    // Scale markings
    for (var i = 0; i < 8; i++) {
      var markGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.05);
      var markMaterial = new THREE.MeshStandardMaterial({ color: colors.wasteYellow });
      var angle = (i / 8) * Math.PI;
      var xPos = -85 + Math.cos(angle - Math.PI / 2) * 1.2;
      var yPos = 15 + Math.sin(angle - Math.PI / 2) * 1.2;
      createMesh(markGeometry, markMaterial, { x: xPos, y: yPos, z: 15.2 });
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    state = {
      barrelPulse: 0,
      poolRipple: 0,
      steamTime: 0,
      monitorFlicker: 0,
      ecoTerroristPos: 0,
      radiationMeterAngle: 0,
      bombAssemblyProgress: 0
    };

    createContainmentBuilding();
    createRadioactiveBarrels();
    createContainmentPool();
    createDecontaminationCorridor();
    createHazmatLockers();
    createControlCenter();
    createCoolingTower();
    createRadiationWarningPoles();
    createChainLinkPerimeter();
    createDirtyBombAssemblyArea();
    createEmergencyShowerStations();
    createEcoTerrorist();
    createRadiationMeter();
  }

  function update(delta) {
    state.barrelPulse += delta * 2;
    state.poolRipple += delta * 1.5;
    state.steamTime += delta;
    state.monitorFlicker += delta * 3;
    state.ecoTerroristPos += delta * 0.3;
    state.radiationMeterAngle += delta * 0.5;
    state.bombAssemblyProgress += delta * 0.1;

    meshes.forEach(function(mesh) {
      // Barrel pulsing glow
      if (mesh.userData.isBarrel) {
        var pulsePhase = mesh.userData.pulsePhase || 0;
        var pulse = Math.sin(state.barrelPulse + pulsePhase) * 0.3 + 0.3;
        mesh.material.emissiveIntensity = pulse;
        mesh.scale.y = 1 + Math.sin(state.barrelPulse + pulsePhase) * 0.05;
      }

      // Pool rippling
      if (mesh.userData.isPool) {
        mesh.position.y = mesh.userData.originalY + Math.sin(state.poolRipple) * 0.2;
        mesh.scale.z = 1 + Math.sin(state.poolRipple * 0.7) * 0.02;
      }

      // Liquid surface ripple
      if (mesh.userData.isLiquid) {
        mesh.position.y = -0.5 + Math.sin(state.poolRipple * 0.5) * 0.1;
      }

      // Monitor flickering
      if (mesh.userData.isMonitor) {
        var flicker = Math.sin(state.monitorFlicker) > 0.7 ? 0.6 : 0.4;
        mesh.material.emissiveIntensity = flicker;
      }

      // Cooling tower steam animation
      if (mesh.userData.isCoolingTower) {
        mesh.rotation.z += delta * 0.1;
      }

      // Radiation meter spinning
      if (mesh.userData.isRadiationMeter) {
        var meterRotation = Math.sin(state.radiationMeterAngle) * 1.2;
        mesh.rotation.z = meterRotation;
      }

      // Bomb progress indicator scaling
      if (mesh.userData.isBombProgress) {
        var progress = Math.min(state.bombAssemblyProgress, 1);
        mesh.scale.y = 0.5 + progress * 1.5;
        mesh.position.y = 2 + progress * 0.3;
      }

      // Eco-terrorist patrol movement
      if (mesh.userData.isEcoTerrorist) {
        var patrolX = Math.cos(state.ecoTerroristPos) * 40;
        var patrolZ = Math.sin(state.ecoTerroristPos) * 40;
        mesh.position.x = patrolX;
        mesh.position.z = patrolZ;
      }

      // Antenna rotation
      if (mesh.userData.isAntenna) {
        mesh.rotation.y += delta * 0.3;
      }
    });
  }

  function reset() {
    meshes.forEach(function(mesh) {
      scene.remove(mesh);
    });
    meshes = [];
    state = {
      barrelPulse: 0,
      poolRipple: 0,
      steamTime: 0,
      monitorFlicker: 0,
      ecoTerroristPos: 0,
      radiationMeterAngle: 0,
      bombAssemblyProgress: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
