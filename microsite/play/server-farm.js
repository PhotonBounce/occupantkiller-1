var window = window || {};

window.ServerFarm = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    serversDown: 0,
    maxServers: 15,
    systemsBreached: 0,
    maxSystems: 5,
    coreTemp: 45
  };

  var serverRacks = [];
  var cracUnits = [];
  var ledIndicators = [];
  var cableBundles = [];
  var mainframe = null;
  var biometricDoor = null;
  var fireSuppressionPipes = [];
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastOKeyTime = 0;
  var hudVisible = true;

  function createServerRackRows() {
    // Create multiple rows of tall dark server racks with LED strips
    var positions = [
      [-12, 0, -8],
      [-6, 0, -8],
      [0, 0, -8],
      [6, 0, -8],
      [12, 0, -8],
      [-12, 0, 0],
      [-6, 0, 0],
      [0, 0, 0],
      [6, 0, 0],
      [12, 0, 0],
      [-12, 0, 8],
      [-6, 0, 8],
      [0, 0, 8],
      [6, 0, 8],
      [12, 0, 8]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Main rack body (tall dark box)
      var rackGeometry = new THREE.BoxGeometry(1.2, 3.5, 0.8);
      var rackMaterial = new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.9 });
      var rack = new THREE.Mesh(rackGeometry, rackMaterial);
      rack.position.y = 1.75;
      rack.castShadow = true;
      rack.receiveShadow = true;
      group.add(rack);

      // LED strips on front (small boxes)
      for (var i = 0; i < 7; i++) {
        var ledGeometry = new THREE.BoxGeometry(1.0, 0.15, 0.05);
        var ledMaterial = new THREE.MeshStandardMaterial({
          color: 0x00FF44,
          emissive: 0x00FF44,
          emissiveIntensity: 0.6
        });
        var led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.set(0, 0.8 + i * 0.42, 0.42);
        led.castShadow = true;
        group.add(led);
        ledIndicators.push({
          mesh: led,
          baseColor: 0x00FF44,
          activeColor: 0x00FF44,
          intensity: 0.6,
          phase: Math.random() * Math.PI * 2
        });
      }

      group.position.set(pos[0], pos[1], pos[2]);
      scene.add(group);
      sceneObjects.push(group);
      serverRacks.push(group);
    });
  }

  function createHotAisleColdAisleMarkers() {
    // Hot aisle (orange stripe)
    var hotAisleGeometry = new THREE.BoxGeometry(28, 0.05, 1.5);
    var hotAisleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAA00, roughness: 0.8 });
    var hotAisle = new THREE.Mesh(hotAisleGeometry, hotAisleMaterial);
    hotAisle.position.set(0, 0.025, -3);
    hotAisle.receiveShadow = true;
    scene.add(hotAisle);
    sceneObjects.push(hotAisle);

    // Cold aisle (blue stripe)
    var coldAisleGeometry = new THREE.BoxGeometry(28, 0.05, 1.5);
    var coldAisleMaterial = new THREE.MeshStandardMaterial({ color: 0x0088FF, roughness: 0.8 });
    var coldAisle = new THREE.Mesh(coldAisleGeometry, coldAisleMaterial);
    coldAisle.position.set(0, 0.025, 3);
    coldAisle.receiveShadow = true;
    scene.add(coldAisle);
    sceneObjects.push(coldAisle);

    // Raised floor tile grid pattern
    for (var x = -14; x <= 14; x += 2) {
      for (var z = -10; z <= 10; z += 2) {
        var tileGeometry = new THREE.BoxGeometry(1.8, 0.1, 1.8);
        var tileMaterial = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.85 });
        var tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(x, 0.05, z);
        tile.receiveShadow = true;
        scene.add(tile);
        sceneObjects.push(tile);
      }
    }
  }

  function createNetworkCableBundles() {
    // Network cable bundles using LineSegments
    var cablePositions = [
      { start: [-15, 0.3, -5], end: [-15, 2.5, -5] },
      { start: [-10, 0.3, -5], end: [-10, 2.5, -5] },
      { start: [-5, 0.3, -5], end: [-5, 2.5, -5] },
      { start: [5, 0.3, -5], end: [5, 2.5, -5] },
      { start: [10, 0.3, -5], end: [10, 2.5, -5] },
      { start: [15, 0.3, -5], end: [15, 2.5, -5] },
      { start: [-15, 0.3, 5], end: [-15, 2.5, 5] },
      { start: [-10, 0.3, 5], end: [-10, 2.5, 5] },
      { start: [-5, 0.3, 5], end: [-5, 2.5, 5] },
      { start: [5, 0.3, 5], end: [5, 2.5, 5] },
      { start: [10, 0.3, 5], end: [10, 2.5, 5] },
      { start: [15, 0.3, 5], end: [15, 2.5, 5] }
    ];

    cablePositions.forEach(function(cablePos) {
      var points = [
        new THREE.Vector3(cablePos.start[0], cablePos.start[1], cablePos.start[2]),
        new THREE.Vector3(cablePos.end[0], cablePos.end[1], cablePos.end[2])
      ];
      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var material = new THREE.LineBasicMaterial({ color: 0x0088FF, linewidth: 3 });
      var cable = new THREE.LineSegments(geometry, material);
      scene.add(cable);
      sceneObjects.push(cable);
      cableBundles.push({
        mesh: cable,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  function createUPSBatteryWall() {
    // Large wall of UPS battery units
    for (var x = 0; x < 3; x++) {
      for (var y = 0; y < 4; y++) {
        var batteryGeometry = new THREE.BoxGeometry(1.0, 0.7, 0.5);
        var batteryMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
        var battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
        battery.position.set(-18 + x * 1.2, 0.35 + y * 0.8, -2);
        battery.castShadow = true;
        battery.receiveShadow = true;
        scene.add(battery);
        sceneObjects.push(battery);
      }
    }

    // Warning label on wall
    var labelGeometry = new THREE.BoxGeometry(3.2, 0.8, 0.1);
    var labelMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.4 });
    var label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(-17, 3.8, -2);
    scene.add(label);
    sceneObjects.push(label);
  }

  function createMainDistributionFrame() {
    // Complex main distribution frame (MDF) with wire crosses
    var group = new THREE.Group();

    // Large frame box
    var frameGeometry = new THREE.BoxGeometry(2.5, 3.0, 0.5);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.85 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = 0;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Wire crosses (LineSegments) on frame
    for (var i = 0; i < 5; i++) {
      var xPos = -0.9 + i * 0.5;
      for (var j = 0; j < 6; j++) {
        var yPos = -1.3 + j * 0.5;
        var crossPoints = [
          new THREE.Vector3(xPos - 0.15, yPos, 0),
          new THREE.Vector3(xPos + 0.15, yPos, 0)
        ];
        var crossGeometry = new THREE.BufferGeometry().setFromPoints(crossPoints);
        var crossMaterial = new THREE.LineBasicMaterial({ color: 0x00FF44 });
        var cross = new THREE.LineSegments(crossGeometry, crossMaterial);
        group.add(cross);

        var vertPoints = [
          new THREE.Vector3(xPos, yPos - 0.15, 0),
          new THREE.Vector3(xPos, yPos + 0.15, 0)
        ];
        var vertGeometry = new THREE.BufferGeometry().setFromPoints(vertPoints);
        var vert = new THREE.LineSegments(vertGeometry, crossMaterial);
        group.add(vert);
      }
    }

    group.position.set(18, 1.5, -6);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createFireSuppressionSystem() {
    // Pipes running across ceiling
    for (var i = 0; i < 8; i++) {
      var pipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 28, 12);
      var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 3.8, -8 + i * 2.3);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      sceneObjects.push(pipe);
      fireSuppressionPipes.push({
        mesh: pipe,
        phase: Math.random() * Math.PI * 2,
        pulseFactor: 0.05
      });
    }

    // Nozzles on pipes
    for (var x = -12; x <= 12; x += 4) {
      for (var z = -8; z <= 8; z += 2.3) {
        var nozzleGeometry = new THREE.SphereGeometry(0.12, 8, 8);
        var nozzleMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.6 });
        var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.position.set(x, 3.75, z);
        scene.add(nozzle);
        sceneObjects.push(nozzle);
      }
    }
  }

  function createCRACUnits() {
    // Computer Room Air Conditioning units
    var cracPositions = [
      [-20, 0, -10],
      [-20, 0, 0],
      [-20, 0, 10],
      [20, 0, -10],
      [20, 0, 0],
      [20, 0, 10]
    ];

    cracPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Main unit box
      var unitGeometry = new THREE.BoxGeometry(1.8, 2.2, 1.2);
      var unitMaterial = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8 });
      var unit = new THREE.Mesh(unitGeometry, unitMaterial);
      unit.position.y = 1.1;
      unit.castShadow = true;
      unit.receiveShadow = true;
      group.add(unit);

      // Fan cylinder (spinning visual)
      var fanGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
      var fanMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.7 });
      var fan = new THREE.Mesh(fanGeometry, fanMaterial);
      fan.position.y = 2.0;
      fan.castShadow = true;
      group.add(fan);

      group.position.set(pos[0], pos[1], pos[2]);
      scene.add(group);
      sceneObjects.push(group);
      cracUnits.push({
        group: group,
        fan: fan,
        rotationSpeed: 0.05 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  function createMainframe() {
    // Central AI control mainframe (large glowing box)
    var group = new THREE.Group();

    // Large main box
    var mainGeometry = new THREE.BoxGeometry(3.0, 3.5, 2.0);
    var mainMaterial = new THREE.MeshStandardMaterial({
      color: 0x001155,
      emissive: 0x0044FF,
      emissiveIntensity: 0.5,
      roughness: 0.6,
      metalness: 0.4
    });
    mainframe = new THREE.Mesh(mainGeometry, mainMaterial);
    mainframe.position.y = 1.75;
    mainframe.castShadow = true;
    mainframe.receiveShadow = true;
    group.add(mainframe);

    // Glow panel on front
    var glowGeometry = new THREE.BoxGeometry(2.8, 3.3, 0.2);
    var glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x0066FF,
      emissive: 0x0088FF,
      emissiveIntensity: 0.8
    });
    var glowPanel = new THREE.Mesh(glowGeometry, glowMaterial);
    glowPanel.position.z = 1.05;
    group.add(glowPanel);
    group.glowPanel = glowPanel;

    // Data lights (small spheres)
    for (var i = 0; i < 12; i++) {
      var lightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FF44,
        emissive: 0x00FF44,
        emissiveIntensity: 0.7
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(-1.0 + (i % 4) * 0.7, 2.5 - Math.floor(i / 4) * 0.9, 1.1);
      group.add(light);
    }

    group.position.set(0, 0, 0);
    group.mainframeData = { glowPhase: 0, glowIntensity: 0.5 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createBiometricDoor() {
    // Security biometric door entrance
    var group = new THREE.Group();

    // Door frame
    var frameGeometry = new THREE.BoxGeometry(1.5, 2.8, 0.3);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.7 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 1.4;
    frame.castShadow = true;
    group.add(frame);

    // Door panel
    biometricDoor = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.8 }));
    biometricDoor.position.y = 1.4;
    biometricDoor.position.z = -0.2;
    biometricDoor.castShadow = true;
    group.add(biometricDoor);

    // Scanning light (small box that sweeps)
    var scannerGeometry = new THREE.BoxGeometry(0.1, 0.04, 0.15);
    var scannerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.8
    });
    var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
    scanner.position.set(0, 2.0, -0.25);
    group.add(scanner);
    group.scanner = scanner;
    group.scannerPhase = 0;

    group.position.set(-22, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createLoadingDock() {
    // Cargo loading dock area
    var group = new THREE.Group();

    // Dock platform
    var dockGeometry = new THREE.BoxGeometry(3.0, 0.5, 2.0);
    var dockMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
    var dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(0, 0.25, -14);
    dock.castShadow = true;
    dock.receiveShadow = true;
    group.add(dock);

    // Loading ramp
    var rampGeometry = new THREE.BoxGeometry(3.0, 0.3, 2.5);
    var rampMaterial = new THREE.MeshStandardMaterial({ color: 0x666677, roughness: 0.8 });
    var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.position.set(0, 0.3, -16.5);
    ramp.rotation.x = 0.2;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    group.add(ramp);

    // Gate door
    var gateGeometry = new THREE.BoxGeometry(3.2, 2.0, 0.3);
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.7 });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 1.0, -17.5);
    gate.castShadow = true;
    group.add(gate);

    scene.add(group);
    sceneObjects.push(group);
  }

  function createNetworkOperationsCenter() {
    // Operations station with monitoring screens
    var group = new THREE.Group();

    // Main desk
    var deskGeometry = new THREE.BoxGeometry(2.5, 0.8, 1.0);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(18, 0.4, 8);
    desk.castShadow = true;
    desk.receiveShadow = true;
    group.add(desk);

    // Monitor stands
    for (var i = 0; i < 3; i++) {
      var standGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
      var standMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(17 + i * 0.7, 0.4, 8);
      stand.castShadow = true;
      group.add(stand);

      // Monitor screens
      var screenGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.08);
      var screenMaterial = new THREE.MeshStandardMaterial({
        color: 0x001100,
        emissive: 0x00FF44,
        emissiveIntensity: 0.6
      });
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(17 + i * 0.7, 1.3, 8);
      screen.castShadow = true;
      group.add(screen);
    }

    scene.add(group);
    sceneObjects.push(group);
  }

  function createCableManagementTray() {
    // Overhead cable management tray
    var trayGeometry = new THREE.BoxGeometry(26, 0.2, 0.8);
    var trayMaterial = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.7, metalness: 0.5 });
    var tray = new THREE.Mesh(trayGeometry, trayMaterial);
    tray.position.set(0, 3.5, 0);
    tray.castShadow = true;
    scene.add(tray);
    sceneObjects.push(tray);

    // Support brackets
    for (var i = 0; i < 13; i++) {
      var bracketGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      var bracketMaterial = new THREE.MeshStandardMaterial({ color: 0x444455, roughness: 0.8 });
      var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
      bracket.position.set(-12 + i * 2, 3.0, 0);
      bracket.castShadow = true;
      scene.add(bracket);
      sceneObjects.push(bracket);
    }
  }

  function createAirHandlerUnits() {
    // Air handler units above
    for (var i = 0; i < 4; i++) {
      var unitGeometry = new THREE.BoxGeometry(2.0, 1.5, 1.5);
      var unitMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
      var unit = new THREE.Mesh(unitGeometry, unitMaterial);
      unit.position.set(-12 + i * 8, 4.5, -8);
      unit.castShadow = true;
      unit.receiveShadow = true;
      scene.add(unit);
      sceneObjects.push(unit);
    }
  }

  function createGround() {
    // Data center floor
    var groundGeometry = new THREE.BoxGeometry(50, 0.4, 30);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.9 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);
  }

  function createEnemies() {
    // Cyber security units / sentinels
    var positions = [
      [-10, 0, -6],
      [8, 0, -4],
      [5, 0, 6],
      [-8, 0, 8],
      [12, 0, -1],
      [-15, 0, 3],
      [0, 0, -10],
      [3, 0, 10],
      [-12, 0, -10],
      [15, 0, 6]
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Body (dark box)
      var bodyGeometry = new THREE.BoxGeometry(0.7, 1.8, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.9;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head (sphere)
      var headGeometry = new THREE.SphereGeometry(0.3, 12, 12);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.6
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 2.0;
      head.castShadow = true;
      group.add(head);

      group.position.set(pos[0], pos[1], pos[2]);
      group.enemyData = { health: 100, active: true, patrolPos: pos };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    });
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'SERVERS NEUTRALIZED: ' + gameState.serversDown + '/' + gameState.maxServers + '\n' +
                  'SYSTEMS BREACHED: ' + gameState.systemsBreached + '/' + gameState.maxSystems + '\n' +
                  'CORE TEMP: ' + gameState.coreTemp + '°C';
    hudElement.textContent = hudText;
  }

  function handleKeyDown(event) {
    var now = Date.now();
    if (event.key === 'a' || event.key === 'A') {
      lastAKeyTime = now;
    }
    if (event.key === 'o' || event.key === 'O') {
      lastOKeyTime = now;
      if (now - lastAKeyTime < 400) {
        hudVisible = !hudVisible;
        if (hudElement) {
          hudElement.style.display = hudVisible ? 'block' : 'none';
        }
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    enemies = [];
    serverRacks = [];
    cracUnits = [];
    ledIndicators = [];
    cableBundles = [];
    fireSuppressionPipes = [];
    elapsedTime = 0;
    gameState = {
      serversDown: 0,
      maxServers: 15,
      systemsBreached: 0,
      maxSystems: 5,
      coreTemp: 45
    };

    // Dark data center atmosphere
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 50, 80);

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0x444455, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Point lights for accent (blue and green)
    var blueLight = new THREE.PointLight(0x0088FF, 0.4, 20);
    blueLight.position.set(0, 2.0, 0);
    scene.add(blueLight);

    var greenLight = new THREE.PointLight(0x00FF44, 0.3, 15);
    greenLight.position.set(15, 1.5, -6);
    scene.add(greenLight);

    // Create all structures
    createGround();
    createServerRackRows();
    createHotAisleColdAisleMarkers();
    createNetworkCableBundles();
    createUPSBatteryWall();
    createMainDistributionFrame();
    createFireSuppressionSystem();
    createCRACUnits();
    createMainframe();
    createBiometricDoor();
    createLoadingDock();
    createNetworkOperationsCenter();
    createCableManagementTray();
    createAirHandlerUnits();
    createEnemies();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'server-farm-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00FF44';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.5';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(0,255,68,0.5)';
      document.body.appendChild(hudElement);
    }

    updateHUD();

    // Key listener
    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    elapsedTime += delta;

    // Update LED indicators (cycling)
    ledIndicators.forEach(function(led) {
      led.phase += delta * 2.0;
      var brightness = 0.4 + Math.sin(led.phase) * 0.3;
      led.mesh.material.emissiveIntensity = brightness;
    });

    // Update CRAC unit fans (spinning)
    cracUnits.forEach(function(crac) {
      crac.fan.rotation.z += crac.rotationSpeed;
    });

    // Update fire suppression pipes (pulsing glow)
    fireSuppressionPipes.forEach(function(pipe) {
      pipe.phase += delta * 1.5;
      var scale = 1.0 + Math.sin(pipe.phase) * pipe.pulseFactor;
      pipe.mesh.scale.y = scale;
    });

    // Update network cable ripples (color pulsing)
    cableBundles.forEach(function(cable) {
      cable.phase += delta * 1.8;
      var intensity = 0.5 + Math.sin(cable.phase) * 0.4;
      cable.mesh.material.linewidth = 1 + intensity * 2;
    });

    // Update mainframe glow pulsing
    if (mainframe && mainframe.parent) {
      mainframe.parent.mainframeData.glowPhase += delta * 1.2;
      var glowAmount = 0.4 + Math.sin(mainframe.parent.mainframeData.glowPhase) * 0.35;
      mainframe.material.emissiveIntensity = glowAmount;
      if (mainframe.parent.glowPanel) {
        mainframe.parent.glowPanel.material.emissiveIntensity = glowAmount + 0.2;
      }
    }

    // Update biometric door scanner sweep
    if (biometricDoor && biometricDoor.parent) {
      biometricDoor.parent.scannerPhase += delta * 3.0;
      var scanPos = Math.sin(biometricDoor.parent.scannerPhase) * 0.5;
      biometricDoor.parent.scanner.position.y = 2.0 + scanPos;
    }

    // Random server neutralization and system breach simulation
    if (Math.random() < 0.012) {
      if (gameState.serversDown < gameState.maxServers) {
        gameState.serversDown += 1;
      }
    }

    if (Math.random() < 0.008) {
      if (gameState.systemsBreached < gameState.maxSystems) {
        gameState.systemsBreached += 1;
      }
    }

    // Temperature fluctuation
    gameState.coreTemp = 45 + Math.sin(elapsedTime * 0.5) * 10;

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove enemies
    enemies.forEach(function(enemy) {
      scene.remove(enemy);
    });

    sceneObjects = [];
    enemies = [];
    serverRacks = [];
    cracUnits = [];
    ledIndicators = [];
    cableBundles = [];
    fireSuppressionPipes = [];
    mainframe = null;
    biometricDoor = null;
    elapsedTime = 0;
    gameState = {
      serversDown: 0,
      maxServers: 15,
      systemsBreached: 0,
      maxSystems: 5,
      coreTemp: 45
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
