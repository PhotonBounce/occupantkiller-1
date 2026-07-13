window.CyberVault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var meshes = [];
  var updateFunctions = [];

  // Color scheme
  var COLORS = {
    void: 0x050505,
    neonBlue: 0x0044FF,
    hologramCyan: 0x00FFFF,
    securityRed: 0xFF0000,
    neuralPurple: 0x8800FF,
    darkGray: 0x1a1a1a,
    white: 0xFFFFFF
  };

  // Spawn points
  var spawnPoints = [
    { x: 0, y: 1.7, z: -50 },      // vault entrance
    { x: 0, y: 1.7, z: -20 },      // laser corridor
    { x: -25, y: 1.7, z: 0 },      // server room
    { x: 25, y: 1.7, z: 0 },       // turret hall
    { x: 0, y: 1.7, z: 40 }        // vault chamber
  ];

  function addMesh(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
  }

  function createEntryCorridorFloor() {
    var geometry = new THREE.BoxGeometry(30, 0.5, 80);
    var material = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.8, roughness: 0.2 });
    var floor = new THREE.Mesh(geometry, material);
    floor.position.y = 0;
    floor.receiveShadow = true;
    addMesh(floor);
  }

  function createCorridorWalls() {
    // Left wall
    var leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 80),
      new THREE.MeshStandardMaterial({ color: COLORS.void, metalness: 0.9, roughness: 0.1 })
    );
    leftWall.position.set(-15, 4, 0);
    leftWall.castShadow = true;
    addMesh(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 8, 80),
      new THREE.MeshStandardMaterial({ color: COLORS.void, metalness: 0.9, roughness: 0.1 })
    );
    rightWall.position.set(15, 4, 0);
    rightWall.castShadow = true;
    addMesh(rightWall);

    // Ceiling
    var ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(32, 0.5, 80),
      new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.7, roughness: 0.3 })
    );
    ceiling.position.y = 8;
    addMesh(ceiling);
  }

  function createLaserGrid() {
    var laserMaterial = new THREE.LineBasicMaterial({ color: COLORS.neonBlue, linewidth: 2 });
    var geometry = new THREE.BufferGeometry();
    var positions = [];

    // Vertical lasers
    for (var i = -14; i <= 14; i += 4) {
      positions.push(i, 1, -40, i, 7, -40);
      positions.push(i, 1, 40, i, 7, 40);
    }

    // Horizontal lasers
    for (var j = -40; j <= 40; j += 5) {
      positions.push(-14, 1, j, 14, 1, j);
      positions.push(-14, 5, j, 14, 5, j);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var laserGrid = new THREE.LineSegments(geometry, laserMaterial);
    laserGrid.userData.pulsePhase = 0;
    laserGrid.userData.isLaserGrid = true;
    addMesh(laserGrid);

    updateFunctions.push(function(delta) {
      laserGrid.userData.pulsePhase += delta;
      if (laserGrid.userData.pulsePhase > 2) {
        laserGrid.userData.pulsePhase = 0;
      }
      var intensity = Math.sin(laserGrid.userData.pulsePhase * Math.PI / 2);
      laserMaterial.opacity = 0.5 + intensity * 0.5;
    });
  }

  function createAIGuardianTurret(x, z) {
    // Base pedestal
    var baseGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.securityRed, metalness: 0.8, roughness: 0.3 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.5, z);
    base.castShadow = true;
    addMesh(base);

    // Turret head
    var headGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var headMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonBlue, metalness: 0.9, roughness: 0.2 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, 2.5, z);
    head.castShadow = true;
    addMesh(head);

    // Barrel
    var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    var barrelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.95, roughness: 0.1 });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 4;
    barrel.position.set(x + 1.2, 2.5, z);
    barrel.castShadow = true;
    addMesh(barrel);

    // Tracking logic
    var turretData = { head: head, barrel: barrel, angle: 0 };
    updateFunctions.push(function(delta) {
      turretData.angle += delta * 0.5;
      turretData.head.rotation.y = turretData.angle;
      turretData.barrel.rotation.y = turretData.angle;
    });
  }

  function createHolographicPanel(x, y, z) {
    var panelGeometry = new THREE.BoxGeometry(2, 3, 0.2);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.hologramCyan,
      emissive: COLORS.hologramCyan,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.4
    });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y, z);
    panel.castShadow = true;
    addMesh(panel);

    var panelData = { material: panelMaterial, colorPhase: 0 };
    updateFunctions.push(function(delta) {
      panelData.colorPhase += delta * 2;
      var intensity = 0.3 + Math.sin(panelData.colorPhase) * 0.4;
      panelData.material.emissiveIntensity = intensity;
    });
  }

  function createQuantumServerStack(x, z) {
    var stackGeometry = new THREE.BoxGeometry(3, 5, 2);
    var stackMaterial = new THREE.MeshStandardMaterial({ color: COLORS.void, metalness: 0.9, roughness: 0.2 });
    var stack = new THREE.Mesh(stackGeometry, stackMaterial);
    stack.position.set(x, 2.5, z);
    stack.castShadow = true;
    addMesh(stack);

    // LED grid surface
    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 3; col++) {
        var ledGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
        var ledMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.neonBlue,
          emissive: COLORS.neonBlue,
          emissiveIntensity: 0.8
        });
        var led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(
          x - 1 + col * 0.8,
          1.5 + row * 0.8,
          z + 1.2
        );
        led.userData.ledIndex = row * 3 + col;
        led.userData.material = ledMaterial;
        addMesh(led);

        updateFunctions.push((function(ledData) {
          return function(delta) {
            var blinkPattern = (Date.now() / 100 + ledData.userData.ledIndex * 0.3) % 1;
            ledData.userData.material.emissiveIntensity = blinkPattern < 0.5 ? 0.8 : 0.2;
          };
        })(led));
      }
    }
  }

  function createMainVaultRoom() {
    // Octagonal chamber (simplified as overlapping boxes)
    var vaultGeometry = new THREE.BoxGeometry(40, 6, 40);
    var vaultMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.7, roughness: 0.3 });
    var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vault.position.set(0, 3, 40);
    vault.castShadow = true;
    addMesh(vault);

    // Vault door frame
    var doorGeometry = new THREE.BoxGeometry(8, 10, 0.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.securityRed, metalness: 0.95, roughness: 0.1 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 5, 32);
    door.castShadow = true;
    door.userData.isVaultDoor = true;
    door.userData.locked = true;
    addMesh(door);

    updateFunctions.push(function(delta) {
      var cycle = (Date.now() / 3000) % 1;
      door.userData.locked = cycle < 0.5;
      doorMaterial.emissive = door.userData.locked ? new THREE.Color(COLORS.securityRed) : new THREE.Color(COLORS.neonBlue);
      doorMaterial.emissiveIntensity = 0.4;
    });
  }

  function createNeuralDataCore() {
    // Central glowing sphere
    var coreGeometry = new THREE.SphereGeometry(3, 32, 32);
    var coreMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.neuralPurple,
      emissive: COLORS.neuralPurple,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.5
    });
    var core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 4, 40);
    core.castShadow = true;
    addMesh(core);

    // Ring structures around core
    for (var ring = 0; ring < 3; ring++) {
      var ringGeometry = new THREE.BoxGeometry(8 + ring * 3, 0.3, 8 + ring * 3);
      var ringMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.hologramCyan,
        emissive: COLORS.hologramCyan,
        emissiveIntensity: 0.6
      });
      var ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.set(0, 4 + ring * 0.5, 40);
      ringMesh.rotation.y = ring * Math.PI / 3;
      addMesh(ringMesh);
    }

    var coreData = { core: core, rotation: 0 };
    updateFunctions.push(function(delta) {
      coreData.rotation += delta * 0.3;
      coreData.core.rotation.x = coreData.rotation;
      coreData.core.rotation.y = coreData.rotation * 0.7;

      var pulseIntensity = 0.6 + Math.sin(coreData.rotation * 2) * 0.2;
      coreMaterial.emissiveIntensity = pulseIntensity;
    });
  }

  function createCoolingDuctSystem() {
    // Main overhead duct
    var ductGeometry = new THREE.BoxGeometry(25, 0.8, 5);
    var ductMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonBlue, metalness: 0.8, roughness: 0.2 });
    var duct = new THREE.Mesh(ductGeometry, ductMaterial);
    duct.position.set(0, 7.5, 0);
    addMesh(duct);

    // Vents along duct
    for (var v = 0; v < 5; v++) {
      var ventGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 8);
      var ventMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.7, roughness: 0.3 });
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(-10 + v * 5, 7, 0);
      vent.rotation.z = Math.PI / 2;
      addMesh(vent);

      updateFunctions.push((function(ventData) {
        return function(delta) {
          var cycle = (Date.now() / 1500 + ventData.index * 0.2) % 1;
          ventData.scale.z = 1 + Math.sin(cycle * Math.PI) * 0.2;
        };
      }).call({ index: v, scale: vent.scale }));
    }
  }

  function createBulkheadDoor(x, z) {
    var doorGeometry = new THREE.BoxGeometry(4, 5, 0.3);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.securityRed, metalness: 0.9, roughness: 0.1 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, 2.5, z);
    door.castShadow = true;
    door.userData.doorPosition = x;
    addMesh(door);

    updateFunctions.push(function(delta) {
      var cycle = (Date.now() / 2000) % 1;
      var offset = Math.sin(cycle * Math.PI) * 0.8;
      door.position.x = door.userData.doorPosition + offset;
    });
  }

  function createFloorPanelGrid() {
    for (var px = -12; px <= 12; px += 4) {
      for (var pz = -45; pz <= 50; pz += 4) {
        var panelGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.8);
        var panelMaterial = new THREE.MeshStandardMaterial({
          color: COLORS.hologramCyan,
          emissive: COLORS.hologramCyan,
          emissiveIntensity: 0.3
        });
        var panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(px, 0.05, pz);
        panel.userData.gridX = px;
        panel.userData.gridZ = pz;
        panel.userData.material = panelMaterial;
        addMesh(panel);

        updateFunctions.push((function(panelData) {
          return function(delta) {
            var distFromCenter = Math.sqrt(panelData.userData.gridX * panelData.userData.gridX + panelData.userData.gridZ * panelData.userData.gridZ);
            var wave = (Date.now() / 100 - distFromCenter * 0.05) % 1;
            panelData.userData.material.emissiveIntensity = wave < 0.3 ? 0.6 : 0.2;
          };
        })(panel));
      }
    }
  }

  function createSecurityCamera(x, y, z) {
    // Camera body
    var bodyGeometry = new THREE.BoxGeometry(0.8, 0.8, 1.2);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonBlue, metalness: 0.8, roughness: 0.2 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    addMesh(body);

    // Lens
    var lensGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    var lensMaterial = new THREE.MeshStandardMaterial({ color: COLORS.securityRed, metalness: 0.95, roughness: 0.05 });
    var lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(x, y, z + 0.7);
    lens.rotation.x = Math.PI / 2;
    addMesh(lens);

    var cameraData = { body: body, angle: 0 };
    updateFunctions.push(function(delta) {
      cameraData.angle += delta * 0.8;
      cameraData.body.rotation.y = Math.sin(cameraData.angle) * 0.6;
    });
  }

  function createPowerConduitTubes() {
    for (var i = 0; i < 3; i++) {
      var tubeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 80, 8);
      var tubeMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.hologramCyan,
        emissive: COLORS.hologramCyan,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.3
      });
      var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tube.position.set(-8 + i * 8, 7, 0);
      tube.userData.material = tubeMaterial;
      addMesh(tube);

      updateFunctions.push((function(tubeData) {
        return function(delta) {
          var pulse = 0.4 + Math.sin(Date.now() / 500 + tubeData.index * 0.5) * 0.3;
          tubeData.userData.material.emissiveIntensity = pulse;
        };
      }).call({ index: i, userData: tube.userData }));
    }
  }

  function createDeactivatedSecurityBot() {
    // Chassis
    var chassisGeometry = new THREE.BoxGeometry(1.5, 2, 1);
    var chassisMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.8, roughness: 0.3 });
    var chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
    chassis.position.set(-8, 1, -35);
    chassis.castShadow = true;
    addMesh(chassis);

    // Head
    var headGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    var headMaterial = new THREE.MeshStandardMaterial({ color: COLORS.void, metalness: 0.9, roughness: 0.2 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(-8, 2.3, -35);
    addMesh(head);

    // Arm (left)
    var armGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var armMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonBlue, metalness: 0.8, roughness: 0.2 });
    var armLeft = new THREE.Mesh(armGeometry, armMaterial);
    armLeft.position.set(-8.8, 1.5, -35);
    armLeft.rotation.z = Math.PI / 3;
    addMesh(armLeft);

    var armRight = new THREE.Mesh(armGeometry, armMaterial);
    armRight.position.set(-7.2, 1.5, -35);
    armRight.rotation.z = -Math.PI / 3;
    addMesh(armRight);
  }

  function createBiometricScannerArch() {
    // Arch frame
    var archGeometry = new THREE.BoxGeometry(5, 7, 0.5);
    var archMaterial = new THREE.MeshStandardMaterial({ color: COLORS.securityRed, metalness: 0.8, roughness: 0.2 });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.set(12, 4, -40);
    arch.castShadow = true;
    addMesh(arch);

    // Scanner eyes
    var eyeGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    var eyeMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.hologramCyan,
      emissive: COLORS.hologramCyan,
      emissiveIntensity: 0.8
    });

    var eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeLeft.position.set(10.5, 5, -39.7);
    addMesh(eyeLeft);

    var eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeRight.position.set(13.5, 5, -39.7);
    addMesh(eyeRight);
  }

  function createEncryptedKeyCardReader() {
    // Kiosk body
    var kioskGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
    var kioskMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonBlue, metalness: 0.9, roughness: 0.2 });
    var kiosk = new THREE.Mesh(kioskGeometry, kioskMaterial);
    kiosk.position.set(-12, 1, -40);
    kiosk.castShadow = true;
    addMesh(kiosk);

    // Card slot
    var slotGeometry = new THREE.BoxGeometry(1, 0.3, 0.2);
    var slotMaterial = new THREE.MeshStandardMaterial({ color: COLORS.securityRed, metalness: 0.8, roughness: 0.2 });
    var slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(-12, 1.2, 0.5);
    addMesh(slot);

    // Display screen
    var screenGeometry = new THREE.BoxGeometry(0.9, 1.2, 0.1);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.hologramCyan,
      emissive: COLORS.hologramCyan,
      emissiveIntensity: 0.5
    });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(-12, 1.3, 0.2);
    addMesh(screen);
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    updateFunctions = [];

    // Build the cyber vault
    createEntryCorridorFloor();
    createCorridorWalls();
    createLaserGrid();

    // AI Guardian turrets
    createAIGuardianTurret(-10, -30);
    createAIGuardianTurret(10, -30);
    createAIGuardianTurret(-10, 10);
    createAIGuardianTurret(10, 10);

    // Holographic panels
    createHolographicPanel(-6, 4, -25);
    createHolographicPanel(6, 4, -25);
    createHolographicPanel(-6, 4, 25);
    createHolographicPanel(6, 4, 25);

    // Quantum server stacks
    createQuantumServerStack(-20, 0);
    createQuantumServerStack(-20, 15);
    createQuantumServerStack(20, 0);
    createQuantumServerStack(20, 15);

    // Main vault room
    createMainVaultRoom();

    // Neural data core
    createNeuralDataCore();

    // Cooling duct system
    createCoolingDuctSystem();

    // Bulkhead doors
    createBulkheadDoor(-15, 30);
    createBulkheadDoor(15, 30);

    // Floor panel grid
    createFloorPanelGrid();

    // Security camera
    createSecurityCamera(0, 7.5, 10);

    // Power conduit tubes
    createPowerConduitTubes();

    // Deactivated security bot
    createDeactivatedSecurityBot();

    // Biometric scanner arch
    createBiometricScannerArch();

    // Encrypted key card reader
    createEncryptedKeyCardReader();

    return {
      spawnPoints: spawnPoints
    };
  }

  function update(delta) {
    for (var i = 0; i < updateFunctions.length; i++) {
      updateFunctions[i](delta);
    }
  }

  function reset() {
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    updateFunctions = [];
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
