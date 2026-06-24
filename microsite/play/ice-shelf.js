var window = window || {};

window.IceShelf = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    depth: 0,
    baseStatus: 'SEARCHING',
    evacCount: 0,
    maxEvac: 12,
    penguinWarnings: 0
  };
  var penguins = [];
  var waterfall = null;
  var weatherStation = null;
  var submarineHatch = null;
  var crevasse = null;
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastMKeyTime = 0;
  var hudVisible = true;

  function createIceShelfSurface() {
    // Massive flat ice shelf - main platform
    var surfaceGeometry = new THREE.BoxGeometry(60, 1, 80);
    var surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0xDDEEFF,
      roughness: 0.6,
      metalness: 0.1
    });
    var surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.position.set(0, -0.5, 0);
    surface.receiveShadow = true;
    scene.add(surface);
    sceneObjects.push(surface);
  }

  function createIceCliffFace() {
    // Sheer ice cliff at the edge
    var cliffGeometry = new THREE.BoxGeometry(60, 20, 2);
    var cliffMaterial = new THREE.MeshStandardMaterial({
      color: 0x88AACC,
      roughness: 0.5,
      metalness: 0.15
    });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(0, 8, 42);
    cliff.castShadow = true;
    cliff.receiveShadow = true;
    scene.add(cliff);
    sceneObjects.push(cliff);

    // Ice fissure lines on cliff face
    var fissureGeometry = new THREE.BoxGeometry(50, 15, 0.3);
    var fissureMaterial = new THREE.MeshStandardMaterial({
      color: 0x4477BB,
      roughness: 0.7
    });
    var fissure = new THREE.Mesh(fissureGeometry, fissureMaterial);
    fissure.position.set(0, 8, 42.5);
    fissure.castShadow = true;
    scene.add(fissure);
    sceneObjects.push(fissure);
  }

  function createCrevasse() {
    var group = new THREE.Group();

    // Crevasse walls (deep blue boxes)
    var leftWallGeometry = new THREE.BoxGeometry(3, 8, 0.8);
    var crevasseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1144AA,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0x2255CC,
      emissiveIntensity: 0.3
    });
    var leftWall = new THREE.Mesh(leftWallGeometry, crevasseMaterial);
    leftWall.position.set(-8, 3, 15);
    leftWall.castShadow = true;
    group.add(leftWall);

    var rightWallGeometry = new THREE.BoxGeometry(3, 8, 0.8);
    var rightWall = new THREE.Mesh(rightWallGeometry, crevasseMaterial);
    rightWall.position.set(8, 3, 15);
    rightWall.castShadow = true;
    group.add(rightWall);

    // Ice bridge across crevasse (narrow)
    var bridgeGeometry = new THREE.BoxGeometry(2, 0.5, 6);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xBBCCDD,
      roughness: 0.6
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, 5, 15);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    group.add(bridge);

    group.crevasse = {
      glowPhase: Math.random() * Math.PI * 2,
      walls: [leftWall, rightWall]
    };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createBaseEntranceHatch() {
    var group = new THREE.Group();

    // Hatch door (circular-ish, using cylinder)
    var hatchGeometry = new THREE.CylinderGeometry(2, 2, 0.4, 12);
    var hatchMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      roughness: 0.5,
      metalness: 0.8
    });
    var hatch = new THREE.Mesh(hatchGeometry, hatchMaterial);
    hatch.rotation.x = Math.PI / 2;
    hatch.castShadow = true;
    group.add(hatch);

    // Hatch frame
    var frameGeometry = new THREE.CylinderGeometry(2.1, 2.1, 0.2, 12);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xAA6633,
      roughness: 0.6,
      metalness: 0.7
    });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.rotation.x = Math.PI / 2;
    frame.position.z = -0.2;
    group.add(frame);

    // Hatch warning stripes (boxes)
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var stripeGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.8);
      var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.x = Math.cos(angle) * 1.5;
      stripe.position.y = Math.sin(angle) * 1.5;
      stripe.rotation.z = angle;
      group.add(stripe);
    }

    group.position.set(-10, 0.2, -15);
    group.hatchData = { angle: 0, isOpen: false };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createPenguin() {
    var group = new THREE.Group();

    // Penguin body (black cylinder)
    var bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 12);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Penguin head (black sphere)
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.8
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.3;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // White belly patch
    var bellyGeometry = new THREE.BoxGeometry(0.25, 0.4, 0.1);
    var bellyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var belly = new THREE.Mesh(bellyGeometry, bellyMaterial);
    belly.position.set(0, 0.5, 0.15);
    group.add(belly);

    // Flippers (side boxes)
    var flipperGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.25);
    var flipperMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var leftFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
    leftFlipper.position.set(-0.3, 0.5, 0);
    group.add(leftFlipper);

    var rightFlipper = new THREE.Mesh(flipperGeometry, flipperMaterial);
    rightFlipper.position.set(0.3, 0.5, 0);
    group.add(rightFlipper);

    var startX = -15 + Math.random() * 30;
    var startZ = -20 + Math.random() * 40;
    group.position.set(startX, 0.5, startZ);
    group.penguin = {
      baseX: startX,
      baseZ: startZ,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 0.5
    };
    scene.add(group);
    sceneObjects.push(group);
    penguins.push(group);
    return group;
  }

  function createIceMeltWaterfall() {
    var group = new THREE.Group();

    // Main waterfall body
    var waterfallGeometry = new THREE.BoxGeometry(4, 8, 0.8);
    var waterfallMaterial = new THREE.MeshStandardMaterial({
      color: 0x4488FF,
      roughness: 0.3,
      metalness: 0.4,
      transparent: true,
      opacity: 0.7
    });
    var waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
    waterfall.position.set(20, 2, -8);
    group.add(waterfall);

    // Water mist particles (small spheres)
    var mistGeometry = new THREE.SphereGeometry(0.15, 4, 4);
    var mistMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCEEFF,
      transparent: true,
      opacity: 0.5
    });
    for (var i = 0; i < 6; i++) {
      var mist = new THREE.Mesh(mistGeometry, mistMaterial);
      mist.position.set(
        20 + (Math.random() - 0.5) * 3,
        6 + Math.random() * 3,
        -8 + (Math.random() - 0.5) * 2
      );
      group.add(mist);
    }

    group.position.set(0, 0, 0);
    group.waterfallData = {
      flowIntensity: 1,
      mistOffset: 0,
      phase: Math.random() * Math.PI * 2
    };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createWeatherStation() {
    var group = new THREE.Group();

    // Tower base (tall cylinder)
    var baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 6, 12);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xAAAAAA,
      roughness: 0.6,
      metalness: 0.8
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 3;
    base.castShadow = true;
    group.add(base);

    // Anemometer cups (spheres on top)
    var cupGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var cupMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      roughness: 0.5
    });
    for (var i = 0; i < 3; i++) {
      var angle = (i / 3) * Math.PI * 2;
      var cup = new THREE.Mesh(cupGeometry, cupMaterial);
      cup.position.set(
        Math.cos(angle) * 0.8,
        6 + 0.3,
        Math.sin(angle) * 0.8
      );
      cup.castShadow = true;
      group.add(cup);
    }

    // Weather vane (box rotating indicator)
    var vaneGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.2);
    var vaneMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00 });
    var vane = new THREE.Mesh(vaneGeometry, vaneMaterial);
    vane.position.y = 5.5;
    group.add(vane);

    // Instruments cluster (boxes)
    for (var j = 0; j < 4; j++) {
      var instGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      var instMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400 });
      var instrument = new THREE.Mesh(instGeometry, instMaterial);
      instrument.position.set(
        (j % 2 - 0.5) * 0.6,
        4.5 - Math.floor(j / 2) * 0.5,
        0.3
      );
      group.add(instrument);
    }

    group.position.set(25, 0, 20);
    group.weatherData = {
      anemometerRotation: 0,
      vaneRotation: 0,
      vaneTarget: 0
    };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createSubmarineHatch() {
    var group = new THREE.Group();

    // Hatch dome (sphere)
    var domeGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      roughness: 0.4,
      metalness: 0.9
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0.8;
    dome.castShadow = true;
    group.add(dome);

    // Hull base (cylinder)
    var hullGeometry = new THREE.CylinderGeometry(1.8, 2, 1, 12);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: 0xDD3333,
      roughness: 0.5,
      metalness: 0.85
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    group.add(hull);

    // Emergency door (small red hatch)
    var doorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 8);
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.2
    });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.rotation.x = Math.PI / 2;
    door.position.y = 1.8;
    group.add(door);

    group.position.set(-25, -0.3, 30);
    group.submarineData = {
      doorOpen: false,
      doorAngle: 0,
      cyclePhase: 0,
      cycle: 3
    };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createPressureIceRidges() {
    // Jagged ice ridges across surface
    var ridgePositions = [
      { x: 0, z: -25 },
      { x: 15, z: -5 },
      { x: -15, z: 10 },
      { x: 10, z: 25 },
      { x: -20, z: 35 }
    ];

    ridgePositions.forEach(function(pos) {
      var ridgeGeometry = new THREE.BoxGeometry(2, 1.5, 8);
      var ridgeMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCDDEE,
        roughness: 0.5
      });
      var ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
      ridge.position.set(pos.x, 0.7, pos.z);
      ridge.rotation.z = (Math.random() - 0.5) * 0.3;
      ridge.castShadow = true;
      ridge.receiveShadow = true;
      scene.add(ridge);
      sceneObjects.push(ridge);
    });
  }

  function createBlowingSnowLayer() {
    // Drifting snow surface layer
    var snowGeometry = new THREE.BoxGeometry(60, 0.2, 80);
    var snowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      transparent: true,
      opacity: 0.3
    });
    var snow = new THREE.Mesh(snowGeometry, snowMaterial);
    snow.position.set(0, 0.1, 0);
    scene.add(snow);
    sceneObjects.push(snow);
  }

  function createEquipmentCache() {
    var group = new THREE.Group();

    // Buried equipment box
    var cacheGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.2);
    var cacheMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.7,
      metalness: 0.5
    });
    var cache = new THREE.Mesh(cacheGeometry, cacheMaterial);
    cache.castShadow = true;
    group.add(cache);

    // Visible equipment items (small cylinders and boxes)
    var itemGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
    var itemMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600 });
    for (var i = 0; i < 3; i++) {
      var item = new THREE.Mesh(itemGeometry, itemMaterial);
      item.position.set(
        -0.3 + i * 0.3,
        0.5,
        -0.4
      );
      item.castShadow = true;
      group.add(item);
    }

    var cachePositions = [
      { x: -12, z: -12 },
      { x: 15, z: 8 },
      { x: -8, z: 25 }
    ];

    var selectedPos = cachePositions[Math.floor(Math.random() * cachePositions.length)];
    group.position.set(selectedPos.x, 0.3, selectedPos.z);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createObservationBunkerDome() {
    var group = new THREE.Group();

    // Dome top (half sphere)
    var domeGeometry = new THREE.SphereGeometry(2, 16, 16);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0xBBCCDD,
      roughness: 0.5,
      metalness: 0.3
    });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 1.5;
    dome.castShadow = true;
    group.add(dome);

    // Observation windows (small boxes)
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var windowGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.2);
      var windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x2288FF,
        transparent: true,
        opacity: 0.6
      });
      var window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(
        Math.cos(angle) * 1.8,
        1.8,
        Math.sin(angle) * 1.8
      );
      group.add(window);
    }

    // Base ring (cylinder)
    var baseGeometry = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.7,
      metalness: 0.4
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    group.add(base);

    group.position.set(30, 0, -20);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createIceAnchorPoints() {
    // Strategic ice anchors
    for (var i = 0; i < 5; i++) {
      var anchorGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
      var anchorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF9900,
        roughness: 0.6,
        metalness: 0.7
      });
      var anchor = new THREE.Mesh(anchorGeometry, anchorMaterial);
      anchor.position.set(
        -25 + i * 12,
        0.6,
        -30 + Math.random() * 10
      );
      anchor.castShadow = true;
      scene.add(anchor);
      sceneObjects.push(anchor);
    }
  }

  function createPolarEnemies() {
    // Create a few polar enemies patrolling
    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      // Enemy body (box)
      var bodyGeometry = new THREE.BoxGeometry(0.7, 1, 1.2);
      var bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9
      });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);

      // Enemy head (sphere)
      var headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var headMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.8
      });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.3;
      head.castShadow = true;
      group.add(head);

      // Glowing sensor (emissive)
      var sensorGeometry = new THREE.SphereGeometry(0.1, 6, 6);
      var sensorMaterial = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0xFF0000,
        emissiveIntensity: 0.8
      });
      var sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
      sensor.position.set(0, 1.35, 0.3);
      group.add(sensor);

      var startX = -20 + i * 20;
      var startZ = -25 + Math.random() * 15;
      group.position.set(startX, 0.5, startZ);
      group.enemyData = {
        baseX: startX,
        baseZ: startZ,
        patrolPhase: i * (Math.PI * 2 / 3),
        speed: 0.015 + Math.random() * 0.01,
        radius: 12
      };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    }
  }

  function updatePenguins(delta) {
    penguins.forEach(function(penguin) {
      var data = penguin.penguin;
      data.wobblePhase += delta * data.wobbleSpeed;

      // Waddling motion
      penguin.rotation.z = Math.sin(data.wobblePhase) * 0.15;
      penguin.position.x = data.baseX + Math.sin(elapsedTime * 0.3 + data.wobblePhase) * 0.5;
      penguin.position.z = data.baseZ + Math.cos(elapsedTime * 0.4 + data.wobblePhase) * 0.3;
    });
  }

  function updateWaterfall(delta) {
    if (!waterfall) return;

    var data = waterfall.waterfallData;
    data.mistOffset += 0.08;
    if (data.mistOffset > 4) {
      data.mistOffset = -2;
    }

    data.flowIntensity = 0.7 + Math.sin(elapsedTime * 1.5) * 0.3;
    waterfall.children.forEach(function(child, idx) {
      if (idx > 0) {
        child.position.y += data.mistOffset * 0.05;
      }
    });
  }

  function updateWeatherStation(delta) {
    if (!weatherStation) return;

    var data = weatherStation.weatherData;
    data.anemometerRotation += 0.08;

    // Update anemometer cups
    for (var i = 0; i < weatherStation.children.length; i++) {
      var child = weatherStation.children[i];
      if (child.geometry && child.geometry instanceof THREE.SphereGeometry) {
        var angle = (i / 3) * Math.PI * 2 + data.anemometerRotation;
        child.position.x = Math.cos(angle) * 0.8;
        child.position.z = Math.sin(angle) * 0.8;
      }
    }

    data.vaneTarget = Math.sin(elapsedTime * 0.5) * Math.PI * 2;
    data.vaneRotation += (data.vaneTarget - data.vaneRotation) * 0.05;
  }

  function updateSubmarineHatch(delta) {
    if (!submarineHatch) return;

    var data = submarineHatch.submarineData;
    data.cyclePhase += delta / data.cycle;

    if (data.cyclePhase > 1) {
      data.cyclePhase = 0;
    }

    // Opening and closing door
    if (data.cyclePhase < 0.3) {
      data.doorAngle = (data.cyclePhase / 0.3) * (Math.PI / 2);
    } else if (data.cyclePhase > 0.7) {
      data.doorAngle = ((1 - data.cyclePhase) / 0.3) * (Math.PI / 2);
    } else {
      data.doorAngle = Math.PI / 2;
    }

    submarineHatch.children.forEach(function(child) {
      if (child.geometry && child.geometry instanceof THREE.CylinderGeometry && child.position.y > 1.5) {
        child.rotation.z = data.doorAngle;
      }
    });
  }

  function updateCrevasse(delta) {
    if (!crevasse) return;

    var data = crevasse.crevasse;
    data.glowPhase += delta * 0.5;

    var glowIntensity = 0.3 + Math.sin(data.glowPhase) * 0.2;
    data.walls.forEach(function(wall) {
      wall.material.emissiveIntensity = glowIntensity;
    });
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;
      data.patrolPhase += data.speed;

      var patrolX = data.baseX + Math.cos(data.patrolPhase) * data.radius;
      var patrolZ = data.baseZ + Math.sin(data.patrolPhase) * data.radius;

      enemy.position.set(patrolX, 0.5, patrolZ);
      enemy.rotation.y = data.patrolPhase;
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'ANTARCTIC BASE - ICE SHELF\n' +
                  'STATUS: ' + gameState.baseStatus + '\n' +
                  'DEPTH: ' + gameState.depth + 'm\n' +
                  'EVACUATIONS: ' + gameState.evacCount + '/' + gameState.maxEvac + '\n' +
                  'PENGUIN WARNINGS: ' + gameState.penguinWarnings;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'ice-shelf-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00CCFF; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 20, 40, 0.8); padding: 10px; border: 2px solid #00CCFF; ' +
                                  'z-index: 100; text-shadow: 0 0 5px #00CCFF;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'A') {
        lastAKeyTime = now;
      }

      if (event.key.toLowerCase() === 'm' || event.key.toLowerCase() === 'M') {
        if (now - lastAKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00CCFF; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 20, 40, 0.9); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #00CCFF; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastMKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0xE8F4F8);
    scene.fog = new THREE.FogExp2(0xCCDDEE, 0.015);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Create ice shelf environment
    createIceShelfSurface();
    createIceCliffFace();
    crevasse = createCrevasse();
    createBaseEntranceHatch();
    createPressureIceRidges();
    createBlowingSnowLayer();
    createEquipmentCache();
    createObservationBunkerDome();
    createIceAnchorPoints();

    // Create interactive elements
    waterfall = createIceMeltWaterfall();
    weatherStation = createWeatherStation();
    submarineHatch = createSubmarineHatch();

    // Create penguins
    for (var i = 0; i < 5; i++) {
      createPenguin();
    }

    // Create enemies
    createPolarEnemies();

    // Setup HUD
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updatePenguins(delta);
    updateWaterfall(delta);
    updateWeatherStation(delta);
    updateSubmarineHatch(delta);
    updateCrevasse(delta);
    updateEnemies(delta);
    updateHUD();

    // Periodic events
    if (Math.floor(elapsedTime) % 5 === 0 && elapsedTime % 1 < delta) {
      gameState.depth += Math.floor(Math.random() * 50);
      gameState.evacCount = Math.min(gameState.maxEvac, gameState.evacCount + Math.floor(Math.random() * 2));
    }

    if (Math.random() < 0.001) {
      gameState.penguinWarnings += 1;
    }
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    penguins = [];
    waterfall = null;
    weatherStation = null;
    submarineHatch = null;
    crevasse = null;
    gameState.depth = 0;
    gameState.baseStatus = 'SEARCHING';
    gameState.evacCount = 0;
    gameState.penguinWarnings = 0;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
