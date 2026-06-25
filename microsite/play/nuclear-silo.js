window.NuclearSilo = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lightBlinkStates = {};
  var consoleFlickers = [];

  function createMaterial(color, emissive) {
    return new THREE.MeshPhongMaterial({
      color: color,
      emissive: emissive || 0x000000,
      shininess: 100
    });
  }

  function addObject(obj) {
    objects.push(obj);
    scene.add(obj);
    return obj;
  }

  function createSiloShaft() {
    var shaftGeometry = new THREE.CylinderGeometry(12, 12, 30, 32, 16, false);
    var shaftMaterial = createMaterial(0x606060, 0x0a0a0a);
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(0, -15, 0);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    addObject(shaft);

    // Ladder rungs
    for (var i = 0; i < 10; i++) {
      var rungHeight = -5 + (i * 2.5);
      var leftRung = new THREE.BoxGeometry(1, 0.3, 10);
      var rungMaterial = createMaterial(0x404040);
      var leftRungMesh = new THREE.Mesh(leftRung, rungMaterial);
      leftRungMesh.position.set(-8, rungHeight, 0);
      leftRungMesh.castShadow = true;
      addObject(leftRungMesh);

      var rightRung = new THREE.BoxGeometry(1, 0.3, 10);
      var rightRungMesh = new THREE.Mesh(rightRung, rungMaterial);
      rightRungMesh.position.set(8, rungHeight, 0);
      rightRungMesh.castShadow = true;
      addObject(rightRungMesh);

      var verticalSupport = new THREE.BoxGeometry(0.2, 2.5, 0.2);
      var supportMaterial = createMaterial(0x303030);
      var supportMesh = new THREE.Mesh(verticalSupport, supportMaterial);
      supportMesh.position.set(-8, rungHeight, 0);
      supportMesh.castShadow = true;
      addObject(supportMesh);
    }
  }

  function createICBMMissile() {
    // Missile body
    var bodyGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 16, 8, false);
    var bodyMaterial = createMaterial(0x2a2a2a, 0x050505);
    var missileBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    missileBody.position.set(0, -8, 0);
    missileBody.castShadow = true;
    missileBody.receiveShadow = true;
    addObject(missileBody);

    // Nose cone
    var coneGeometry = new THREE.ConeGeometry(1.5, 5, 16, 8, false);
    var coneMaterial = createMaterial(0xff4444, 0x330000);
    var noseCone = new THREE.Mesh(coneGeometry, coneMaterial);
    noseCone.position.set(0, 2, 0);
    noseCone.castShadow = true;
    addObject(noseCone);

    // Fins (4 box geometries)
    for (var i = 0; i < 4; i++) {
      var angle = (i * Math.PI / 2);
      var finGeometry = new THREE.BoxGeometry(0.3, 4, 3);
      var finMaterial = createMaterial(0x1a1a1a);
      var fin = new THREE.Mesh(finGeometry, finMaterial);
      fin.position.set(
        Math.cos(angle) * 2,
        -14,
        Math.sin(angle) * 2
      );
      fin.rotation.z = angle;
      fin.castShadow = true;
      addObject(fin);
    }
  }

  function createControlRoom() {
    var roomWidth = 15;
    var roomDepth = 12;
    var roomHeight = 5;

    // Main bunker structure
    var bunkerGeometry = new THREE.BoxGeometry(roomWidth, roomHeight, roomDepth);
    var bunkerMaterial = createMaterial(0x505050, 0x0a0a0a);
    var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
    bunker.position.set(-35, -2, 0);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    addObject(bunker);

    // Launch consoles (3 stations)
    for (var i = 0; i < 3; i++) {
      var consoleX = -40 + (i * 5);
      var consoleY = 0;

      // Console desk
      var deskGeometry = new THREE.BoxGeometry(4, 1, 2.5);
      var deskMaterial = createMaterial(0x404040);
      var desk = new THREE.Mesh(deskGeometry, deskMaterial);
      desk.position.set(consoleX, consoleY, 0);
      desk.castShadow = true;
      addObject(desk);

      // Console screen panel
      var screenGeometry = new THREE.BoxGeometry(3.5, 3, 0.3);
      var screenMaterial = createMaterial(0x0a0a0a, 0x0f0f0f);
      var screen = new THREE.Mesh(screenGeometry, screenMaterial);
      screen.position.set(consoleX, consoleY + 2.5, 0);
      screen.castShadow = true;
      consoleFlickers.push({
        mesh: screen,
        emissiveBase: 0x0f0f0f,
        index: i
      });
      addObject(screen);

      // Button panel
      var buttonGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
      var buttonMaterial = createMaterial(0x333333);
      var buttons = new THREE.Mesh(buttonGeometry, buttonMaterial);
      buttons.position.set(consoleX, consoleY, -1.5);
      buttons.castShadow = true;
      addObject(buttons);
    }

    // Control room walls (inner panels)
    for (var i = 0; i < 4; i++) {
      var panelGeometry = new THREE.BoxGeometry(2, 4, 0.3);
      var panelMaterial = createMaterial(0x606060);
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);

      if (i === 0) {
        panel.position.set(-28, 0, 6);
      } else if (i === 1) {
        panel.position.set(-28, 0, -6);
      } else if (i === 2) {
        panel.position.set(-42, 0, 6);
      } else {
        panel.position.set(-42, 0, -6);
      }
      panel.castShadow = true;
      addObject(panel);
    }
  }

  function createKeyStations() {
    // Left key station
    var leftPedestalGeometry = new THREE.BoxGeometry(3, 3.5, 3);
    var pedestalMaterial = createMaterial(0x808080);
    var leftPedestal = new THREE.Mesh(leftPedestalGeometry, pedestalMaterial);
    leftPedestal.position.set(-25, -2, -18);
    leftPedestal.castShadow = true;
    addObject(leftPedestal);

    var leftKeyLockGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16, 4, false);
    var keyLockMaterial = createMaterial(0xffaa00, 0x330000);
    var leftKeyLock = new THREE.Mesh(leftKeyLockGeometry, keyLockMaterial);
    leftKeyLock.position.set(-25, 1.5, -18);
    leftKeyLock.castShadow = true;
    lightBlinkStates['leftKey'] = { mesh: leftKeyLock, blink: false };
    addObject(leftKeyLock);

    // Right key station
    var rightPedestalGeometry = new THREE.BoxGeometry(3, 3.5, 3);
    var rightPedestal = new THREE.Mesh(rightPedestalGeometry, pedestalMaterial);
    rightPedestal.position.set(-25, -2, 18);
    rightPedestal.castShadow = true;
    addObject(rightPedestal);

    var rightKeyLock = new THREE.Mesh(leftKeyLockGeometry, keyLockMaterial);
    rightKeyLock.position.set(-25, 1.5, 18);
    rightKeyLock.castShadow = true;
    lightBlinkStates['rightKey'] = { mesh: rightKeyLock, blink: false };
    addObject(rightKeyLock);

    // Key covers
    for (var i = 0; i < 2; i++) {
      var coverGeometry = new THREE.BoxGeometry(2.5, 2.5, 0.3);
      var coverMaterial = createMaterial(0xffff00, 0x333300);
      var cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.position.set(-25 + (i * 50), 3, (i === 0 ? -18 : 18));
      cover.castShadow = true;
      addObject(cover);
    }
  }

  function createBlastDoors() {
    // Left blast door
    var leftDoorGeometry = new THREE.BoxGeometry(1, 8, 10);
    var doorMaterial = createMaterial(0x303030, 0x050505);
    var leftDoor = new THREE.Mesh(leftDoorGeometry, doorMaterial);
    leftDoor.position.set(-55, 0, 0);
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    addObject(leftDoor);

    // Right blast door
    var rightDoor = new THREE.Mesh(leftDoorGeometry, doorMaterial);
    rightDoor.position.set(-48, 0, 0);
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    addObject(rightDoor);

    // Hydraulic pistons (4 cylinders)
    for (var i = 0; i < 4; i++) {
      var pistonGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8, 4, false);
      var pistonMaterial = createMaterial(0x555555);
      var piston = new THREE.Mesh(pistonGeometry, pistonMaterial);
      piston.position.set(-51.5, (i < 2 ? 3 : -3), (i % 2 === 0 ? 3 : -3));
      piston.rotation.z = Math.PI / 2;
      piston.castShadow = true;
      addObject(piston);
    }

    // Door reinforcement ribs
    for (var i = 0; i < 6; i++) {
      var ribGeometry = new THREE.BoxGeometry(0.8, 0.3, 10);
      var ribMaterial = createMaterial(0x404040);
      var rib = new THREE.Mesh(ribGeometry, ribMaterial);
      rib.position.set(-55, -3 + (i * 1.2), 0);
      rib.castShadow = true;
      addObject(rib);

      var rib2 = new THREE.Mesh(ribGeometry, ribMaterial);
      rib2.position.set(-48, -3 + (i * 1.2), 0);
      rib2.castShadow = true;
      addObject(rib2);
    }
  }

  function createCoolingTowers() {
    var towerPositions = [
      { x: 35, z: -25 },
      { x: 35, z: 25 },
      { x: 50, z: -15 },
      { x: 50, z: 15 }
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var pos = towerPositions[i];

      // Tower cylinder
      var towerGeometry = new THREE.CylinderGeometry(2.5, 2.8, 12, 16, 8, false);
      var towerMaterial = createMaterial(0x707070);
      var tower = new THREE.Mesh(towerGeometry, towerMaterial);
      tower.position.set(pos.x, 0, pos.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      addObject(tower);

      // Steam effect (sphere cluster)
      for (var j = 0; j < 5; j++) {
        var steamGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        var steamMaterial = createMaterial(0xcccccc, 0x333333);
        var steam = new THREE.Mesh(steamGeometry, steamMaterial);
        steam.position.set(
          pos.x + (Math.random() - 0.5) * 3,
          6 + j * 1.2,
          pos.z + (Math.random() - 0.5) * 3
        );
        steam.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);
        steam.castShadow = true;
        addObject(steam);
      }

      // Cooling fan vent (cylinder)
      var ventGeometry = new THREE.CylinderGeometry(2.3, 2.3, 0.5, 16, 2, false);
      var ventMaterial = createMaterial(0x606060);
      var vent = new THREE.Mesh(ventGeometry, ventMaterial);
      vent.position.set(pos.x, 6.5, pos.z);
      vent.castShadow = true;
      addObject(vent);
    }
  }

  function createUndergroundCorridors() {
    // Main corridor spanning X
    var corridorGeometry = new THREE.BoxGeometry(100, 4, 6);
    var corridorMaterial = createMaterial(0x505050);
    var mainCorridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
    mainCorridor.position.set(0, -5, 0);
    mainCorridor.castShadow = true;
    mainCorridor.receiveShadow = true;
    addObject(mainCorridor);

    // Side corridor 1
    var sideCorridor1Geometry = new THREE.BoxGeometry(6, 4, 40);
    var sideCorridor1 = new THREE.Mesh(sideCorridor1Geometry, corridorMaterial);
    sideCorridor1.position.set(20, -5, 0);
    sideCorridor1.castShadow = true;
    sideCorridor1.receiveShadow = true;
    addObject(sideCorridor1);

    // Side corridor 2
    var sideCorridor2 = new THREE.Mesh(sideCorridor1Geometry, corridorMaterial);
    sideCorridor2.position.set(-20, -5, 0);
    sideCorridor2.castShadow = true;
    sideCorridor2.receiveShadow = true;
    addObject(sideCorridor2);

    // Corridor support pillars
    for (var i = 0; i < 8; i++) {
      var pillarGeometry = new THREE.BoxGeometry(2, 4, 2);
      var pillarMaterial = createMaterial(0x404040);
      var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(-35 + (i * 10), -5, -15);
      pillar.castShadow = true;
      addObject(pillar);

      var pillar2 = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar2.position.set(-35 + (i * 10), -5, 15);
      pillar2.castShadow = true;
      addObject(pillar2);
    }

    // Tunnel wall panels
    for (var i = 0; i < 12; i++) {
      var panelGeometry = new THREE.BoxGeometry(6, 3, 0.3);
      var panelMaterial = createMaterial(0x606060);
      var panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-45 + (i * 8), -3, 5.5);
      panel.castShadow = true;
      addObject(panel);

      var panel2 = new THREE.Mesh(panelGeometry, panelMaterial);
      panel2.position.set(-45 + (i * 8), -3, -5.5);
      panel2.castShadow = true;
      addObject(panel2);
    }
  }

  function createEmergencyGenerators() {
    var genPositions = [
      { x: -60, z: -20 },
      { x: -60, z: 20 }
    ];

    for (var i = 0; i < genPositions.length; i++) {
      var pos = genPositions[i];

      // Generator main block
      var genGeometry = new THREE.BoxGeometry(6, 5, 4);
      var genMaterial = createMaterial(0x404040, 0x0a0a0a);
      var generator = new THREE.Mesh(genGeometry, genMaterial);
      generator.position.set(pos.x, -2, pos.z);
      generator.castShadow = true;
      generator.receiveShadow = true;
      addObject(generator);

      // Exhaust pipes (4 cylinders)
      for (var j = 0; j < 4; j++) {
        var pipeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 12, 4, false);
        var pipeMaterial = createMaterial(0x555555);
        var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(
          pos.x - 2.5 + (j % 2) * 5,
          3.5,
          pos.z - 1.5 + Math.floor(j / 2) * 3
        );
        pipe.castShadow = true;
        addObject(pipe);
      }

      // Fuel ports
      for (var j = 0; j < 3; j++) {
        var portGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8, 2, false);
        var portMaterial = createMaterial(0x333333);
        var port = new THREE.Mesh(portGeometry, portMaterial);
        port.position.set(pos.x - 2 + (j * 2), -4.5, pos.z);
        port.rotation.z = Math.PI / 2;
        port.castShadow = true;
        addObject(port);
      }
    }
  }

  function createRadiationWarning() {
    var warningPositions = [
      { x: -35, y: 0, z: -30 },
      { x: -35, y: 0, z: 30 },
      { x: 20, y: 0, z: -25 },
      { x: 40, y: 0, z: 0 },
      { x: 0, y: -20, z: 0 }
    ];

    for (var i = 0; i < warningPositions.length; i++) {
      var pos = warningPositions[i];

      // Warning sign panel
      var signGeometry = new THREE.BoxGeometry(2, 2, 0.2);
      var signMaterial = createMaterial(0xffff00, 0x333300);
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(pos.x, pos.y, pos.z);
      sign.castShadow = true;
      lightBlinkStates['warning' + i] = { mesh: sign, blink: false };
      addObject(sign);

      // Support post
      var postGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
      var postMaterial = createMaterial(0x404040);
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos.x, pos.y - 2, pos.z - 1);
      post.castShadow = true;
      addObject(post);
    }
  }

  function createGuardBarracks() {
    // Barracks building
    var barracksGeometry = new THREE.BoxGeometry(12, 4, 10);
    var barracksMaterial = createMaterial(0x606060);
    var barracks = new THREE.Mesh(barracksGeometry, barracksMaterial);
    barracks.position.set(55, -2, -25);
    barracks.castShadow = true;
    barracks.receiveShadow = true;
    addObject(barracks);

    // Bunk beds (4 units, 2 per unit)
    for (var i = 0; i < 4; i++) {
      var bunkX = 50 + (i % 2) * 5;
      var bunkZ = -30 + Math.floor(i / 2) * 8;

      // Top bunk
      var topBunkGeometry = new THREE.BoxGeometry(2, 0.5, 1.5);
      var bunkMaterial = createMaterial(0x3a3a3a);
      var topBunk = new THREE.Mesh(topBunkGeometry, bunkMaterial);
      topBunk.position.set(bunkX, 0, bunkZ);
      topBunk.castShadow = true;
      addObject(topBunk);

      // Bottom bunk
      var bottomBunk = new THREE.Mesh(topBunkGeometry, bunkMaterial);
      bottomBunk.position.set(bunkX, -1.5, bunkZ);
      bottomBunk.castShadow = true;
      addObject(bottomBunk);

      // Bunk frame support
      var frameGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
      var frameMaterial = createMaterial(0x303030);
      for (var j = 0; j < 4; j++) {
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(
          bunkX - 1 + (j % 2) * 2,
          -0.75,
          bunkZ - 0.6 + Math.floor(j / 2) * 1.2
        );
        frame.castShadow = true;
        addObject(frame);
      }
    }

    // Barracks interior walls
    for (var i = 0; i < 3; i++) {
      var dividerGeometry = new THREE.BoxGeometry(0.3, 3.5, 10);
      var dividerMaterial = createMaterial(0x707070);
      var divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
      divider.position.set(50 + (i * 3), -0.5, -25);
      divider.castShadow = true;
      addObject(divider);
    }
  }

  function createPerimeterFence() {
    var fencePositions = [
      { x: -40, z: -40 },
      { x: -40, z: 40 },
      { x: 40, z: -40 },
      { x: 40, z: 40 },
      { x: 0, z: -40 },
      { x: 0, z: 40 },
      { x: -40, z: 0 },
      { x: 40, z: 0 }
    ];

    for (var i = 0; i < fencePositions.length; i++) {
      var pos = fencePositions[i];

      // Fence post
      var postGeometry = new THREE.BoxGeometry(0.8, 5, 0.8);
      var postMaterial = createMaterial(0x505050);
      var post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(pos.x, 0, pos.z);
      post.castShadow = true;
      addObject(post);
    }

    // Fence wire connectors (LineSegments)
    var wireGeometry = new THREE.BufferGeometry();
    var wirePositions = [];
    var wireColors = [];

    for (var i = 0; i < fencePositions.length - 1; i++) {
      var p1 = fencePositions[i];
      var p2 = fencePositions[i + 1];
      wirePositions.push(p1.x, 2, p1.z);
      wirePositions.push(p2.x, 2, p2.z);
      wireColors.push(0.5, 0.5, 0.5);
      wireColors.push(0.5, 0.5, 0.5);
    }

    wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
    wireGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(wireColors), 3));
    var wireMaterial = new THREE.LineBasicMaterial({ color: 0x808080, linewidth: 2 });
    var wireLines = new THREE.LineSegments(wireGeometry, wireMaterial);
    addObject(wireLines);

    // Additional horizontal wires
    for (var h = 1; h <= 4; h++) {
      var wireGeo = new THREE.BufferGeometry();
      var positions = [];
      var colors = [];

      for (var i = 0; i < fencePositions.length - 1; i++) {
        var p1 = fencePositions[i];
        var p2 = fencePositions[i + 1];
        positions.push(p1.x, h, p1.z);
        positions.push(p2.x, h, p2.z);
        colors.push(0.5, 0.5, 0.5);
        colors.push(0.5, 0.5, 0.5);
      }

      wireGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
      wireGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
      var wireLines2 = new THREE.LineSegments(wireGeo, wireMaterial);
      addObject(wireLines2);
    }
  }

  function createWatchTowers() {
    var towerPositions = [
      { x: -45, z: -45 },
      { x: -45, z: 45 },
      { x: 45, z: -45 },
      { x: 45, z: 45 }
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var pos = towerPositions[i];

      // Tower pole
      var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 10, 12, 4, false);
      var poleMaterial = createMaterial(0x505050);
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(pos.x, 2, pos.z);
      pole.castShadow = true;
      addObject(pole);

      // Tower platform
      var platformGeometry = new THREE.BoxGeometry(4, 0.4, 4);
      var platformMaterial = createMaterial(0x606060);
      var platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, 7, pos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      addObject(platform);

      // Guard shelter (box)
      var shelterGeometry = new THREE.BoxGeometry(3, 2, 3);
      var shelterMaterial = createMaterial(0x707070);
      var shelter = new THREE.Mesh(shelterGeometry, shelterMaterial);
      shelter.position.set(pos.x, 8.5, pos.z);
      shelter.castShadow = true;
      addObject(shelter);

      // Spotlight cylinder
      var spotGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12, 3, false);
      var spotMaterial = createMaterial(0xffff99, 0x333300);
      var spotlight = new THREE.Mesh(spotGeometry, spotMaterial);
      spotlight.position.set(pos.x, 9.5, pos.z - 1.5);
      spotlight.rotation.z = Math.PI / 4;
      spotlight.castShadow = true;
      lightBlinkStates['spot' + i] = { mesh: spotlight, blink: false };
      addObject(spotlight);

      // Railing (4 segments)
      for (var j = 0; j < 4; j++) {
        var railingGeometry = new THREE.BoxGeometry(4, 0.5, 0.3);
        var railingMaterial = createMaterial(0x505050);
        var railing = new THREE.Mesh(railingGeometry, railingMaterial);
        var angle = (j * Math.PI / 2);
        railing.position.set(
          pos.x + Math.cos(angle) * 2,
          7,
          pos.z + Math.sin(angle) * 2
        );
        railing.castShadow = true;
        addObject(railing);
      }
    }
  }

  function createFloor() {
    // Ground surface
    var floorGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var floorMaterial = createMaterial(0x404040, 0x0a0a0a);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(0, -10, 0);
    floor.receiveShadow = true;
    addObject(floor);

    // Surface details
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        var tileGeometry = new THREE.BoxGeometry(10, 0.2, 10);
        var tileMaterial = createMaterial(0x454545);
        var tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(-35 + (i * 10), -9.75, -35 + (j * 10));
        tile.receiveShadow = true;
        addObject(tile);
      }
    }
  }

  function createEnvironmentLighting() {
    // Ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Directional light for silo
    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(40, 30, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Point light in control room
    var pointLight1 = new THREE.PointLight(0xffffff, 0.8, 30);
    pointLight1.position.set(-35, 2, 0);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    // Point light in silo
    var pointLight2 = new THREE.PointLight(0xffccff, 0.6, 25);
    pointLight2.position.set(0, -8, 0);
    pointLight2.castShadow = true;
    scene.add(pointLight2);
  }

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    lightBlinkStates = {};
    consoleFlickers = [];

    createFloor();
    createSiloShaft();
    createICBMMissile();
    createControlRoom();
    createKeyStations();
    createBlastDoors();
    createCoolingTowers();
    createUndergroundCorridors();
    createEmergencyGenerators();
    createRadiationWarning();
    createGuardBarracks();
    createPerimeterFence();
    createWatchTowers();
    createEnvironmentLighting();

    // Initialize light blink states
    for (var key in lightBlinkStates) {
      if (lightBlinkStates.hasOwnProperty(key)) {
        lightBlinkStates[key].blink = false;
        lightBlinkStates[key].time = 0;
      }
    }
  }

  function update(delta) {
    // Update warning light blinks
    for (var key in lightBlinkStates) {
      if (lightBlinkStates.hasOwnProperty(key)) {
        var light = lightBlinkStates[key];
        light.time = (light.time + delta) % 1.0;

        if (light.time < 0.5) {
          light.mesh.material.emissive.setHex(0xffaa00);
        } else {
          light.mesh.material.emissive.setHex(0x330000);
        }
      }
    }

    // Update console screen flickers
    for (var i = 0; i < consoleFlickers.length; i++) {
      var console = consoleFlickers[i];
      var flicker = Math.random();

      if (flicker > 0.7) {
        console.mesh.material.emissive.setHex(0x00ff00);
      } else if (flicker > 0.4) {
        console.mesh.material.emissive.setHex(0x0f0f0f);
      } else {
        console.mesh.material.emissive.setHex(0x00aa00);
      }
    }
  }

  function reset() {
    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    lightBlinkStates = {};
    consoleFlickers = [];

    // Remove all lights except essential ones
    for (var i = scene.children.length - 1; i >= 0; i--) {
      if (scene.children[i] instanceof THREE.Light &&
          !(scene.children[i] instanceof THREE.AmbientLight) &&
          !(scene.children[i] instanceof THREE.DirectionalLight)) {
        scene.remove(scene.children[i]);
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
