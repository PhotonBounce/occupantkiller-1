var window = window || {};

window.MissileSilo = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var hudElement = null;
  var elapsedTime = 0;
  var gameState = {
    countdownSeconds: 120,
    missilesFueled: 0,
    maxMissiles: 3,
    launchReady: false,
    doorOpen: false
  };
  var elevatorMesh = null;
  var countdownBoard = null;
  var keyTerminals = [];
  var fuelIndicators = [];
  var statusLights = [];

  function createSiloShaft() {
    // Main deep silo shaft (large vertical cylinder going down)
    var shaftGeometry = new THREE.CylinderGeometry(12, 12, 60, 32);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x333355,
      roughness: 0.85,
      metalness: 0.3
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = -30;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    scene.add(shaft);
    sceneObjects.push(shaft);

    // Reinforced concrete wall rings for shaft
    for (var i = 0; i < 8; i++) {
      var ringGeometry = new THREE.CylinderGeometry(12.5, 12.5, 0.5, 32);
      var ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a4a,
        roughness: 0.9
      });
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = -5 - i * 7;
      scene.add(ring);
      sceneObjects.push(ring);
    }
  }

  function createICBMMissile() {
    var group = new THREE.Group();

    // Main missile body (elongated white cylinder)
    var bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 24);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.4,
      metalness: 0.7
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cone tip (red warning)
    var tipGeometry = new THREE.ConeGeometry(1.5, 4, 24);
    var tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF2200,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    var tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.y = 17;
    tip.castShadow = true;
    tip.receiveShadow = true;
    group.add(tip);

    // Base ring
    var baseGeometry = new THREE.CylinderGeometry(1.8, 1.5, 0.8, 24);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -8;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Missile data for animation
    group.missileData = { fueling: 0, pulseCycle: 0 };
    animatedObjects.push(group.missileData);

    group.position.set(0, -25, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createLaunchControlConsole() {
    var group = new THREE.Group();

    // Main console desk
    var deskGeometry = new THREE.BoxGeometry(8, 1, 2);
    var deskMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0.5;
    desk.castShadow = true;
    desk.receiveShadow = true;
    group.add(desk);

    // Dual key slot terminals
    var terminalPositions = [-2, 2];
    terminalPositions.forEach(function(xPos) {
      var termGroup = new THREE.Group();

      // Terminal box
      var boxGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.8);
      var boxMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.7,
        emissive: 0x1a1a2a
      });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.y = 1.5;
      box.castShadow = true;
      box.receiveShadow = true;
      termGroup.add(box);

      // Key slot cylinder (gold)
      var slotGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16);
      var slotMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        metalness: 0.8,
        roughness: 0.2
      });
      var slot = new THREE.Mesh(slotGeometry, slotMaterial);
      slot.rotation.z = Math.PI / 2;
      slot.position.set(0, 2, 0.5);
      slot.castShadow = true;
      termGroup.add(slot);

      // Status light (small blinking sphere)
      var lightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 1.0
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(0, 0.8, 0.5);
      termGroup.add(light);
      statusLights.push({ mesh: light, blinkCycle: 0 });

      termGroup.position.x = xPos;
      group.add(termGroup);
      keyTerminals.push(termGroup);
    });

    group.position.set(-5, 8, 3);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createCrewQuarters() {
    // Bunk beds and crew area
    var group = new THREE.Group();

    // Two bunk beds
    for (var b = 0; b < 2; b++) {
      var bunkGeometry = new THREE.BoxGeometry(2, 0.5, 1);
      var bunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.7
      });
      var bunk1 = new THREE.Mesh(bunkGeometry, bunkMaterial);
      bunk1.position.set(-2 + b * 4, 3, 0);
      bunk1.castShadow = true;
      bunk1.receiveShadow = true;
      group.add(bunk1);

      var bunk2 = new THREE.Mesh(bunkGeometry, bunkMaterial);
      bunk2.position.set(-2 + b * 4, 4.5, 0);
      bunk2.castShadow = true;
      bunk2.receiveShadow = true;
      group.add(bunk2);
    }

    // Storage lockers
    for (var l = 0; l < 4; l++) {
      var lockerGeometry = new THREE.BoxGeometry(1.2, 2, 0.6);
      var lockerMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.8
      });
      var locker = new THREE.Mesh(lockerGeometry, lockerMaterial);
      locker.position.set(-3.5 + l * 2.4, 1, -3);
      locker.castShadow = true;
      locker.receiveShadow = true;
      group.add(locker);
    }

    group.position.set(8, 0, -8);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createBlastDoorRings() {
    // Multiple reinforced blast door rings at shaft top
    for (var d = 0; d < 3; d++) {
      var doorGeometry = new THREE.CylinderGeometry(11.5, 11.5, 1.5, 32);
      var doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: 0.6,
        roughness: 0.3,
        emissive: gameState.doorOpen ? 0x00FF00 : 0x1a1a1a
      });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.y = 18 + d * 1.8;
      door.castShadow = true;
      door.receiveShadow = true;
      scene.add(door);
      sceneObjects.push(door);
      door.doorData = { index: d };
    }
  }

  function createServiceElevator() {
    var group = new THREE.Group();

    // Elevator cage frame
    var frameGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x555566,
      metalness: 0.7,
      roughness: 0.4
    });
    var cage = new THREE.Mesh(frameGeometry, frameMaterial);
    cage.castShadow = true;
    cage.receiveShadow = true;
    group.add(cage);

    // Elevator cable (line)
    var cablePoints = [
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(0, 30, 0)
    ];
    var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
    group.add(cable);

    group.position.set(-8, 15, 0);
    elevatorMesh = group;
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createGantryArm() {
    var group = new THREE.Group();

    // Horizontal boom (long cylinder)
    var boomGeometry = new THREE.CylinderGeometry(0.3, 0.3, 12, 16);
    var boomMaterial = new THREE.MeshStandardMaterial({
      color: 0x888866,
      metalness: 0.8,
      roughness: 0.3
    });
    var boom = new THREE.Mesh(boomGeometry, boomMaterial);
    boom.rotation.z = Math.PI / 2;
    boom.position.set(0, 0, 0);
    boom.castShadow = true;
    boom.receiveShadow = true;
    group.add(boom);

    // Vertical support column
    var supportGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
    var supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x777755,
      metalness: 0.7,
      roughness: 0.4
    });
    var support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.y = -4;
    support.castShadow = true;
    support.receiveShadow = true;
    group.add(support);

    // Hoist hook (small cylinder hanging)
    var hookGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 12);
    var hookMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      metalness: 0.9,
      roughness: 0.2
    });
    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(3, -4, 0);
    hook.castShadow = true;
    scene.add(hook);
    sceneObjects.push(hook);

    group.position.set(0, 10, 5);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createFuelFeedPipes() {
    // Multiple fuel pipes along shaft wall
    for (var p = 0; p < 5; p++) {
      var angle = (Math.PI * 2 / 5) * p;
      var pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 50, 12);
      var pipeMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF6600,
        emissive: 0xFF4400,
        emissiveIntensity: 0.3,
        roughness: 0.5
      });
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      var radius = 11;
      pipe.position.set(
        Math.cos(angle) * radius,
        -30,
        Math.sin(angle) * radius
      );
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      scene.add(pipe);
      sceneObjects.push(pipe);
      pipe.pipeData = { pressureCycle: Math.random() * Math.PI * 2 };
      animatedObjects.push(pipe.pipeData);
    }
  }

  function createLaunchKeyTerminals() {
    // Additional launch key terminals around control room
    var positions = [
      [4, 2, 5],
      [-4, 2, 5],
      [0, 2, -4]
    ];

    positions.forEach(function(pos) {
      var termGroup = new THREE.Group();

      // Terminal body
      var bodyGeometry = new THREE.BoxGeometry(1, 1.5, 1);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a4a,
        roughness: 0.7
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      body.receiveShadow = true;
      termGroup.add(body);

      // Key slot (smaller brass cylinder)
      var slotGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 12);
      var slotMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCC00,
        metalness: 0.7,
        roughness: 0.3
      });
      var slot = new THREE.Mesh(slotGeometry, slotMaterial);
      slot.rotation.z = Math.PI / 2;
      slot.position.set(0, 0.3, 0.6);
      termGroup.add(slot);

      // Status indicator light
      var indicatorGeometry = new THREE.SphereGeometry(0.06, 12, 12);
      var indicatorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFDD00,
        emissive: 0xFFDD00,
        emissiveIntensity: 0.8
      });
      var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(0, -0.4, 0.6);
      termGroup.add(indicator);
      statusLights.push({ mesh: indicator, blinkCycle: Math.random() * Math.PI * 2 });

      termGroup.position.set(pos[0], pos[1], pos[2]);
      scene.add(termGroup);
      sceneObjects.push(termGroup);
      keyTerminals.push(termGroup);
    });
  }

  function createStatusBoard() {
    var group = new THREE.Group();

    // Main board panel
    var panelGeometry = new THREE.BoxGeometry(5, 3, 0.3);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);

    // Countdown display (text mesh simulation with box)
    var displayGeometry = new THREE.BoxGeometry(3, 1.5, 0.2);
    var displayMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00FF00,
      emissiveIntensity: 0.7
    });
    countdownBoard = new THREE.Mesh(displayGeometry, displayMaterial);
    countdownBoard.position.z = 0.2;
    countdownBoard.castShadow = true;
    group.add(countdownBoard);
    countdownBoard.boardData = { displayValue: 120 };
    animatedObjects.push(countdownBoard.boardData);

    // Status indicator lights (3 row x 3 col grid)
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        var colors = [0xFF0000, 0xFFDD00, 0x00FF00];
        var lightMaterial = new THREE.MeshStandardMaterial({
          color: colors[r % 3],
          emissive: colors[r % 3],
          emissiveIntensity: 0.8
        });
        var light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(-1.2 + c * 1.2, 1.5 - r * 0.8, 0.2);
        group.add(light);
        statusLights.push({ mesh: light, blinkCycle: Math.random() * Math.PI * 2, colorIndex: r });
      }
    }

    group.position.set(6, 12, 0);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createEmergencyBlastShield() {
    var group = new THREE.Group();

    // Reinforced door-like shield
    var shieldGeometry = new THREE.BoxGeometry(4, 5, 0.8);
    var shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x1a1a1a
    });
    var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.castShadow = true;
    shield.receiveShadow = true;
    group.add(shield);

    // Warning stripe pattern (alternate color box)
    var stripeGeometry = new THREE.BoxGeometry(4.2, 0.4, 0.9);
    var stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF2200,
      emissiveIntensity: 0.5
    });

    for (var s = 0; s < 6; s++) {
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = -1.5 + s * 0.9;
      group.add(stripe);
    }

    group.position.set(-10, 8, -12);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createCommunicationAntenna() {
    var group = new THREE.Group();

    // Base box
    var baseGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.7,
      roughness: 0.4
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Antenna mast (tall thin cylinder)
    var mastGeometry = new THREE.CylinderGeometry(0.08, 0.08, 8, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.8,
      roughness: 0.3
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.position.y = 4.5;
    mast.castShadow = true;
    mast.receiveShadow = true;
    group.add(mast);

    // Antenna transmission indicator (blinking small sphere)
    var indicatorGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    var indicatorMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF00FF,
      emissive: 0xFF00FF,
      emissiveIntensity: 1.0
    });
    var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.y = 8.5;
    group.add(indicator);
    statusLights.push({ mesh: indicator, blinkCycle: 0 });

    group.position.set(10, 5, -10);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createLadderRungs() {
    // Ladder rungs along shaft wall for maintenance
    for (var rung = 0; rung < 15; rung++) {
      var rungGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 12);
      var rungMaterial = new THREE.MeshStandardMaterial({
        color: 0x777755,
        metalness: 0.7,
        roughness: 0.5
      });
      var bar = new THREE.Mesh(rungGeometry, rungMaterial);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(11.5, -5 - rung * 3.5, 0);
      scene.add(bar);
      sceneObjects.push(bar);
    }
  }

  function createFuelIndicator() {
    // Fuel indicator tank with pulsing material
    var group = new THREE.Group();

    // Tank body
    var tankGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      roughness: 0.6,
      metalness: 0.5
    });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);
    tank.fuelData = { pulseLevel: 0 };
    animatedObjects.push(tank.fuelData);

    // Indicator cap
    var capGeometry = new THREE.SphereGeometry(0.65, 16, 16);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 1.2;
    cap.castShadow = true;
    group.add(cap);

    group.position.set(8, 10, -5);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'MISSILE SILO COMMAND CENTER\n' +
                  'COUNTDOWN: ' + Math.max(0, Math.floor(gameState.countdownSeconds)) + 's\n' +
                  'MISSILES FUELED: ' + gameState.missilesFueled + '/' + gameState.maxMissiles + '\n' +
                  'LAUNCH READY: ' + (gameState.launchReady ? 'YES' : 'NO') + '\n' +
                  'BLAST DOORS: ' + (gameState.doorOpen ? 'OPEN' : 'CLOSED');
    hudElement.textContent = hudText;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    animatedObjects = [];
    keyTerminals = [];
    fuelIndicators = [];
    statusLights = [];
    elapsedTime = 0;
    gameState = {
      countdownSeconds: 120,
      missilesFueled: 0,
      maxMissiles: 3,
      launchReady: false,
      doorOpen: false
    };

    // Deep underground atmosphere
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 40, 80);

    // Dim ambient lighting for underground feel
    var ambientLight = new THREE.AmbientLight(0x444444, 0.5);
    scene.add(ambientLight);

    // Red emergency lighting
    var redLight = new THREE.DirectionalLight(0xFF4400, 0.6);
    redLight.position.set(20, 30, 20);
    redLight.castShadow = true;
    redLight.shadow.mapSize.width = 2048;
    redLight.shadow.mapSize.height = 2048;
    scene.add(redLight);

    // Create all game objects
    createSiloShaft();
    createICBMMissile();
    createLaunchControlConsole();
    createCrewQuarters();
    createBlastDoorRings();
    createServiceElevator();
    createGantryArm();
    createFuelFeedPipes();
    createLaunchKeyTerminals();
    createStatusBoard();
    createEmergencyBlastShield();
    createCommunicationAntenna();
    createLadderRungs();
    createFuelIndicator();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'missile-silo-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#FF4400';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.6';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(255,68,0,0.8)';
      hudElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
      hudElement.style.padding = '10px';
      hudElement.style.border = '2px solid #FF4400';
      document.body.appendChild(hudElement);
    }

    updateHUD();
  }

  function update(delta) {
    elapsedTime += delta;

    // Countdown timer
    gameState.countdownSeconds -= delta;
    if (gameState.countdownSeconds <= 0) {
      gameState.countdownSeconds = 120;
      gameState.launchReady = !gameState.launchReady;
    }

    // Update missile fueling indicator
    if (Math.random() < 0.02) {
      if (gameState.missilesFueled < gameState.maxMissiles) {
        gameState.missilesFueled += 1;
      }
    }

    // Elevator oscillation (up and down)
    if (elevatorMesh) {
      var elevPos = Math.sin(elapsedTime * 0.5) * 8;
      elevatorMesh.position.y = 15 + elevPos;
    }

    // Status lights blinking
    statusLights.forEach(function(light) {
      light.blinkCycle += delta * 3;
      var blinkValue = Math.sin(light.blinkCycle) * 0.5 + 0.5;
      light.mesh.material.emissiveIntensity = blinkValue;
    });

    // Fuel pipes pressurizing pulse
    sceneObjects.forEach(function(obj) {
      if (obj.pipeData) {
        obj.pipeData.pressureCycle += delta * 2;
        var pulseValue = Math.sin(obj.pipeData.pressureCycle) * 0.4 + 0.3;
        obj.material.emissiveIntensity = pulseValue;
      }
    });

    // Countdown board display
    if (countdownBoard && countdownBoard.boardData) {
      countdownBoard.boardData.displayValue = Math.max(0, Math.floor(gameState.countdownSeconds));
      var displayPulse = Math.sin(elapsedTime * 2) * 0.2 + 0.7;
      countdownBoard.material.emissiveIntensity = displayPulse;
    }

    // Missile fueling indicator pulsing
    sceneObjects.forEach(function(obj) {
      if (obj.fuelData) {
        obj.fuelData.pulseLevel += delta * 1.5;
        var fuelPulse = Math.sin(obj.fuelData.pulseLevel) * 0.6 + 0.5;
        obj.material.emissiveIntensity = fuelPulse;
      }
    });

    // Launch key terminal status blinking
    keyTerminals.forEach(function(term) {
      var statusLight = term.children[1];
      if (statusLight && statusLight.material) {
        var readyBlink = Math.sin(elapsedTime * 4) * 0.4 + 0.6;
        statusLight.material.emissiveIntensity = readyBlink;
      }
    });

    // Randomly toggle launch ready state
    if (Math.random() < 0.005) {
      gameState.launchReady = !gameState.launchReady;
    }

    // Door open/close simulation
    if (Math.random() < 0.003) {
      gameState.doorOpen = !gameState.doorOpen;
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    sceneObjects = [];
    animatedObjects = [];
    keyTerminals = [];
    fuelIndicators = [];
    statusLights = [];
    elevatorMesh = null;
    countdownBoard = null;
    elapsedTime = 0;
    gameState = {
      countdownSeconds: 120,
      missilesFueled: 0,
      maxMissiles: 3,
      launchReady: false,
      doorOpen: false
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
