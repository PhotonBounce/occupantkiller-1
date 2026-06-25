window.DarkMarket = (function() {
  'use strict';

  // Module state
  var scene = null;
  var camera = null;
  var objects = [];
  var neonSigns = [];
  var surveillanceCameras = [];
  var lights = [];
  var particleSystem = [];
  var time = 0;

  // Initialize dark web marketplace
  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    neonSigns = [];
    surveillanceCameras = [];
    lights = [];
    particleSystem = [];
    time = 0;

    // Warehouse shell - massive industrial ceiling
    var warehouseFloor = new THREE.Mesh(
      new THREE.BoxGeometry(150, 0.5, 120),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide })
    );
    warehouseFloor.receiveShadow = true;
    scene.add(warehouseFloor);
    objects.push(warehouseFloor);

    var warehouseCeiling = new THREE.Mesh(
      new THREE.BoxGeometry(150, 1, 120),
      new THREE.MeshPhongMaterial({ color: 0x0d0d0d, side: THREE.DoubleSide })
    );
    warehouseCeiling.position.y = 25;
    warehouseCeiling.receiveShadow = true;
    scene.add(warehouseCeiling);
    objects.push(warehouseCeiling);

    var wallNorth = new THREE.Mesh(
      new THREE.BoxGeometry(150, 26, 1),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    wallNorth.position.z = -60;
    wallNorth.position.y = 12.5;
    wallNorth.receiveShadow = true;
    scene.add(wallNorth);
    objects.push(wallNorth);

    var wallSouth = new THREE.Mesh(
      new THREE.BoxGeometry(150, 26, 1),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    wallSouth.position.z = 60;
    wallSouth.position.y = 12.5;
    wallSouth.receiveShadow = true;
    scene.add(wallSouth);
    objects.push(wallSouth);

    var wallEast = new THREE.Mesh(
      new THREE.BoxGeometry(1, 26, 120),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    wallEast.position.x = 75;
    wallEast.position.y = 12.5;
    wallEast.receiveShadow = true;
    scene.add(wallEast);
    objects.push(wallEast);

    var wallWest = new THREE.Mesh(
      new THREE.BoxGeometry(1, 26, 120),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    wallWest.position.x = -75;
    wallWest.position.y = 12.5;
    wallWest.receiveShadow = true;
    scene.add(wallWest);
    objects.push(wallWest);

    // Shipping container stalls
    createContainerStalls();

    // Neon sign panels
    createNeonSigns();

    // Weapons display table
    createWeaponsStall();

    // Currency exchange stall
    createCurrencyExchange();

    // Food and drink stall
    createFoodStall();

    // Surveillance camera network
    createSurveillanceCameras();

    // Armed guard posts
    createGuardPosts();

    // Escape tunnel exit
    createEscapeTunnel();

    // Confiscated goods locker
    createGoodsLocker();

    // Interrogation room
    createInterrogationRoom();

    // Power tap panel
    createPowerPanel();

    // Black curtain partitions
    createCurtainPartitions();

    // Illicit lab section
    createLabSection();

    // Crypto terminal kiosk
    createCryptoTerminal();

    // Dead drop boxes
    createDeadDropBoxes();

    // Concealed sniper position
    createSniperPosition();

    // Atmospheric lights
    createLighting();

    // Particle mist system
    createParticleMist();
  };

  var createContainerStalls = function() {
    var colors = [0xff0080, 0x00ff80, 0x0080ff, 0xffff00, 0xff8000, 0xff0000];
    var positions = [
      { x: -40, z: -30 },
      { x: 0, z: -30 },
      { x: 40, z: -30 },
      { x: -40, z: 0 },
      { x: 0, z: 0 },
      { x: 40, z: 0 },
      { x: -40, z: 30 },
      { x: 0, z: 30 },
      { x: 40, z: 30 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var colorIdx = i % colors.length;
      var containerMesh = new THREE.Mesh(
        new THREE.BoxGeometry(12, 8, 8),
        new THREE.MeshPhongMaterial({ color: colors[colorIdx] })
      );
      containerMesh.position.set(pos.x, 4, pos.z);
      containerMesh.castShadow = true;
      containerMesh.receiveShadow = true;
      scene.add(containerMesh);
      objects.push(containerMesh);

      // Add door-like dark panel to container
      var doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(10, 6, 0.3),
        new THREE.MeshPhongMaterial({ color: 0x000000, emissive: 0x111111 })
      );
      doorPanel.position.set(pos.x - 5.5, 4, pos.z + 3.5);
      scene.add(doorPanel);
      objects.push(doorPanel);
    }
  };

  var createNeonSigns = function() {
    var signs = [
      { text: 'WEAPONS', x: -50, z: -50, color: 0xff0000 },
      { text: 'CURRENCY', x: -50, z: 0, color: 0x00ff00 },
      { text: 'NARCOTICS', x: -50, z: 50, color: 0xff00ff },
      { text: 'INTERROGATION', x: 50, z: -50, color: 0xffff00 },
      { text: 'BLACKMARKET', x: 50, z: 0, color: 0x00ffff },
      { text: 'CRYPTO', x: 50, z: 50, color: 0xff8000 }
    ];

    for (var i = 0; i < signs.length; i++) {
      var sign = signs[i];
      var signPanel = new THREE.Mesh(
        new THREE.BoxGeometry(16, 3, 0.4),
        new THREE.MeshPhongMaterial({
          color: sign.color,
          emissive: sign.color,
          emissiveIntensity: 0.8
        })
      );
      signPanel.position.set(sign.x, 20, sign.z);
      signPanel.castShadow = false;
      scene.add(signPanel);
      neonSigns.push({
        mesh: signPanel,
        baseIntensity: 0.8,
        originalColor: sign.color,
        phase: i * 0.3
      });
      objects.push(signPanel);
    }
  };

  var createWeaponsStall = function() {
    // Table
    var tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.5, 8),
      new THREE.MeshPhongMaterial({ color: 0x3d3d3d })
    );
    tableTop.position.set(-30, 3, -10);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);
    objects.push(tableTop);

    // Table legs
    for (var i = 0; i < 4; i++) {
      var leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
      );
      var xPos = (i < 2) ? -35 : -25;
      var zPos = (i % 2 === 0) ? -13 : -7;
      leg.position.set(xPos, 1.5, zPos);
      leg.castShadow = true;
      scene.add(leg);
      objects.push(leg);
    }

    // Gun shapes - cylinders as gun barrels
    var gunPositions = [
      { x: -35, z: -12 },
      { x: -32, z: -12 },
      { x: -29, z: -12 },
      { x: -26, z: -12 },
      { x: -35, z: -8 },
      { x: -29, z: -8 }
    ];

    for (var j = 0; j < gunPositions.length; j++) {
      var gunPos = gunPositions[j];
      // Gun barrel
      var barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 2, 6),
        new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
      );
      barrel.position.set(gunPos.x, 3.8, gunPos.z);
      barrel.rotation.z = Math.PI / 2.5;
      barrel.castShadow = true;
      scene.add(barrel);
      objects.push(barrel);

      // Gun grip
      var grip = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1.5, 0.4),
        new THREE.MeshPhongMaterial({ color: 0x4a0000 })
      );
      grip.position.set(gunPos.x - 0.4, 3.5, gunPos.z);
      grip.castShadow = true;
      scene.add(grip);
      objects.push(grip);
    }
  };

  var createCurrencyExchange = function() {
    // Counter
    var counter = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1, 4),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
    );
    counter.position.set(30, 1, 20);
    counter.castShadow = true;
    counter.receiveShadow = true;
    scene.add(counter);
    objects.push(counter);

    // Money stacks - grouped as small boxes
    var stackPositions = [
      { x: 24, z: 19 },
      { x: 26, z: 19 },
      { x: 28, z: 19 },
      { x: 30, z: 19 },
      { x: 32, z: 19 },
      { x: 34, z: 19 },
      { x: 36, z: 19 },
      { x: 24, z: 21 },
      { x: 26, z: 21 },
      { x: 28, z: 21 },
      { x: 30, z: 21 },
      { x: 32, z: 21 },
      { x: 34, z: 21 },
      { x: 36, z: 21 }
    ];

    for (var i = 0; i < stackPositions.length; i++) {
      var stackPos = stackPositions[i];
      var moneyStack = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1.5, 1),
        new THREE.MeshPhongMaterial({ color: 0x00aa00 })
      );
      moneyStack.position.set(stackPos.x, 2, stackPos.z);
      moneyStack.castShadow = true;
      scene.add(moneyStack);
      objects.push(moneyStack);
    }
  };

  var createFoodStall = function() {
    // Counter
    var foodCounter = new THREE.Mesh(
      new THREE.BoxGeometry(8, 1, 3),
      new THREE.MeshPhongMaterial({ color: 0x3d3d3d })
    );
    foodCounter.position.set(-10, 1, 35);
    foodCounter.castShadow = true;
    scene.add(foodCounter);
    objects.push(foodCounter);

    // Barrel kegs
    for (var i = 0; i < 4; i++) {
      var keg = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 2, 8),
        new THREE.MeshPhongMaterial({ color: 0x8b4513 })
      );
      keg.position.set(-12 + i * 3, 1.5, 36);
      keg.castShadow = true;
      scene.add(keg);
      objects.push(keg);

      // Keg tap
      var tap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6),
        new THREE.MeshPhongMaterial({ color: 0xffa500 })
      );
      tap.position.set(-12 + i * 3, 2.2, 35.3);
      tap.rotation.z = Math.PI / 3;
      scene.add(tap);
      objects.push(tap);
    }
  };

  var createSurveillanceCameras = function() {
    var cameraPositions = [
      { x: -60, z: -50, y: 22 },
      { x: -60, z: 0, y: 22 },
      { x: -60, z: 50, y: 22 },
      { x: 60, z: -50, y: 22 },
      { x: 60, z: 0, y: 22 },
      { x: 60, z: 50, y: 22 },
      { x: 0, z: -55, y: 22 },
      { x: 0, z: 55, y: 22 }
    ];

    for (var i = 0; i < cameraPositions.length; i++) {
      var camPos = cameraPositions[i];

      // Camera mount
      var mount = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.5),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
      );
      mount.position.set(camPos.x, camPos.y, camPos.z);
      mount.castShadow = true;
      scene.add(mount);
      objects.push(mount);

      // Camera lens
      var lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0x000000, emissive: 0x330000 })
      );
      lens.position.set(camPos.x + 0.4, camPos.y, camPos.z);
      lens.castShadow = false;
      scene.add(lens);
      surveillanceCameras.push({
        mount: mount,
        lens: lens,
        baseX: camPos.x,
        baseZ: camPos.z,
        rotationAngle: Math.random() * Math.PI * 2
      });
      objects.push(lens);
    }
  };

  var createGuardPosts = function() {
    var postPositions = [
      { x: -50, z: -45 },
      { x: 50, z: 45 }
    ];

    for (var i = 0; i < postPositions.length; i++) {
      var postPos = postPositions[i];

      // Platform
      var platform = new THREE.Mesh(
        new THREE.BoxGeometry(6, 0.5, 6),
        new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
      );
      platform.position.set(postPos.x, 5, postPos.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      scene.add(platform);
      objects.push(platform);

      // Support pillars
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 5, 8),
        new THREE.MeshPhongMaterial({ color: 0x3d3d3d })
      );
      pillar.position.set(postPos.x, 2.5, postPos.z);
      pillar.castShadow = true;
      scene.add(pillar);
      objects.push(pillar);

      // Railings
      var railing = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 1, 0.3),
        new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
      );
      railing.position.set(postPos.x, 5.5, postPos.z - 2.8);
      scene.add(railing);
      objects.push(railing);
    }
  };

  var createEscapeTunnel = function() {
    // Large hole in floor
    var tunnelEntrance = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.5, 8),
      new THREE.MeshPhongMaterial({ color: 0x000000 })
    );
    tunnelEntrance.position.set(60, -0.2, 0);
    tunnelEntrance.receiveShadow = true;
    scene.add(tunnelEntrance);
    objects.push(tunnelEntrance);

    // Metal grate door
    var grateDoor = new THREE.Mesh(
      new THREE.BoxGeometry(7.5, 5, 0.4),
      new THREE.MeshPhongMaterial({ color: 0x666666, metalness: 0.8 })
    );
    grateDoor.position.set(60, 2.5, 0);
    grateDoor.castShadow = true;
    scene.add(grateDoor);
    objects.push(grateDoor);
  };

  var createGoodsLocker = function() {
    // Cage structure
    var cageFrameH = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.2, 4),
      new THREE.MeshPhongMaterial({ color: 0x444444 })
    );
    cageFrameH.position.set(-60, 5.8, 25);
    scene.add(cageFrameH);
    objects.push(cageFrameH);

    // Side bars
    for (var i = 0; i < 5; i++) {
      var bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 6, 6),
        new THREE.MeshPhongMaterial({ color: 0x444444 })
      );
      bar.position.set(-63 + i * 1.5, 3, 25);
      bar.rotation.z = Math.PI / 2;
      scene.add(bar);
      objects.push(bar);
    }

    // Cage door lock
    var padlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.6, 0.2),
      new THREE.MeshPhongMaterial({ color: 0xffaa00 })
    );
    padlock.position.set(-60, 2.5, 27);
    scene.add(padlock);
    objects.push(padlock);
  };

  var createInterrogationRoom = function() {
    // Soundproofed walls
    var soundWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide })
    );
    soundWall1.position.set(20, 4, -40);
    scene.add(soundWall1);
    objects.push(soundWall1);

    var soundWall2 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide })
    );
    soundWall2.position.set(20, 4, -30);
    scene.add(soundWall2);
    objects.push(soundWall2);

    // Metal chair
    var chairSeat = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      new THREE.MeshPhongMaterial({ color: 0x330000 })
    );
    chairSeat.position.set(20, 1, -35);
    chairSeat.castShadow = true;
    scene.add(chairSeat);
    objects.push(chairSeat);

    // Chair back
    var chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2, 0.3),
      new THREE.MeshPhongMaterial({ color: 0x330000 })
    );
    chairBack.position.set(20, 2.5, -33.5);
    chairBack.castShadow = true;
    scene.add(chairBack);
    objects.push(chairBack);

    // Rope - Line segment from ceiling to chair
    var ropeGeometry = new THREE.BufferGeometry();
    var ropePositions = new Float32Array([
      20, 7, -35,  // top
      20, 1.5, -35 // chair
    ]);
    ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
    var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xaa0000, linewidth: 2 });
    var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
    scene.add(rope);
    objects.push(rope);
  };

  var createPowerPanel = function() {
    // Illegal electrical tap panel
    var panelBox = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 0.4),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    panelBox.position.set(70, 2, -35);
    panelBox.castShadow = true;
    scene.add(panelBox);
    objects.push(panelBox);

    // Exposed wiring - Lines
    for (var i = 0; i < 3; i++) {
      var wireGeometry = new THREE.BufferGeometry();
      var wirePositions = new Float32Array([
        70, 2.5 - i * 0.5, -34.8,
        70, 2.5 - i * 0.5, -32
      ]);
      wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
      var wireMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 1 });
      var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
      scene.add(wire);
      objects.push(wire);
    }

    // Electrical hazard indicators
    for (var j = 0; j < 6; j++) {
      var indicator = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 })
      );
      indicator.position.set(69 + (j % 2) * 2, 3.5 - Math.floor(j / 2) * 0.7, -34.8);
      scene.add(indicator);
      objects.push(indicator);
    }
  };

  var createCurtainPartitions = function() {
    var curtainPositions = [
      { x: -20, z: 10 },
      { x: 10, z: 10 },
      { x: 0, z: -20 }
    ];

    for (var i = 0; i < curtainPositions.length; i++) {
      var curtPos = curtainPositions[i];
      var curtain = new THREE.Mesh(
        new THREE.BoxGeometry(8, 7, 0.2),
        new THREE.MeshPhongMaterial({ color: 0x0a0a0a, side: THREE.DoubleSide })
      );
      curtain.position.set(curtPos.x, 3.5, curtPos.z);
      scene.add(curtain);
      objects.push(curtain);
    }
  };

  var createLabSection = function() {
    // Lab bench
    var labBench = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1, 3),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
    );
    labBench.position.set(0, 1, -45);
    labBench.castShadow = true;
    scene.add(labBench);
    objects.push(labBench);

    // Lab equipment - cylinders and boxes
    var equipPositions = [
      { x: -5, z: -46, type: 'cylinder' },
      { x: 0, z: -46, type: 'box' },
      { x: 5, z: -46, type: 'cylinder' }
    ];

    for (var i = 0; i < equipPositions.length; i++) {
      var eq = equipPositions[i];
      var equipMesh;

      if (eq.type === 'cylinder') {
        equipMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8),
          new THREE.MeshPhongMaterial({ color: 0x4a4a4a })
        );
      } else {
        equipMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1.5, 0.8),
          new THREE.MeshPhongMaterial({ color: 0x4a0000 })
        );
      }

      equipMesh.position.set(eq.x, 2, eq.z);
      equipMesh.castShadow = true;
      scene.add(equipMesh);
      objects.push(equipMesh);
    }
  };

  var createCryptoTerminal = function() {
    // Terminal kiosk
    var kioskBody = new THREE.Mesh(
      new THREE.BoxGeometry(3, 4, 1.5),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    kioskBody.position.set(40, 2, -20);
    kioskBody.castShadow = true;
    scene.add(kioskBody);
    objects.push(kioskBody);

    // Screen display - sphere as holographic orb
    var display = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00aa00, emissiveIntensity: 0.5 })
    );
    display.position.set(40, 2.5, -20);
    display.castShadow = false;
    scene.add(display);
    objects.push(display);

    // Keypad
    for (var i = 0; i < 12; i++) {
      var key = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.1),
        new THREE.MeshPhongMaterial({ color: 0x005500 })
      );
      key.position.set(38.5 + (i % 4) * 0.4, 1 + Math.floor(i / 4) * 0.4, -19.8);
      scene.add(key);
      objects.push(key);
    }
  };

  var createDeadDropBoxes = function() {
    var dropPositions = [
      { x: -65, z: -45 },
      { x: -65, z: 0 },
      { x: -65, z: 45 }
    ];

    for (var i = 0; i < dropPositions.length; i++) {
      var dropPos = dropPositions[i];
      var dropBox = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 0.8),
        new THREE.MeshPhongMaterial({ color: 0x8b4513 })
      );
      dropBox.position.set(dropPos.x, 2, dropPos.z);
      dropBox.castShadow = true;
      scene.add(dropBox);
      objects.push(dropBox);

      // Mail slot
      var slot = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.3, 0.1),
        new THREE.MeshPhongMaterial({ color: 0x000000 })
      );
      slot.position.set(dropPos.x, 2.5, dropPos.z + 0.35);
      scene.add(slot);
      objects.push(slot);
    }
  };

  var createSniperPosition = function() {
    // Elevated hidden platform
    var sniperPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.3, 4),
      new THREE.MeshPhongMaterial({ color: 0x0d0d0d })
    );
    sniperPlatform.position.set(50, 15, 50);
    sniperPlatform.castShadow = true;
    scene.add(sniperPlatform);
    objects.push(sniperPlatform);

    // Support column
    var column = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.6, 15, 8),
      new THREE.MeshPhongMaterial({ color: 0x1a1a1a })
    );
    column.position.set(50, 7.5, 50);
    column.castShadow = true;
    scene.add(column);
    objects.push(column);

    // Weapon mount
    var weaponMount = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 0.5),
      new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
    );
    weaponMount.position.set(50, 15.8, 48);
    scene.add(weaponMount);
    objects.push(weaponMount);
  };

  var createLighting = function() {
    // Ambient dark lighting
    var ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Neon red light near weapons
    var redLight = new THREE.PointLight(0xff0000, 1.5, 50);
    redLight.position.set(-30, 8, -10);
    redLight.castShadow = true;
    scene.add(redLight);
    lights.push(redLight);

    // Neon green light near currency
    var greenLight = new THREE.PointLight(0x00ff00, 1.5, 50);
    greenLight.position.set(30, 8, 20);
    greenLight.castShadow = true;
    scene.add(greenLight);
    lights.push(greenLight);

    // Cyan light near crypto
    var cyanLight = new THREE.PointLight(0x00ffff, 1.5, 50);
    cyanLight.position.set(40, 6, -20);
    greenLight.castShadow = true;
    scene.add(cyanLight);
    lights.push(cyanLight);

    // Magenta light at interrogation
    var magentaLight = new THREE.PointLight(0xff00ff, 1.2, 40);
    magentaLight.position.set(20, 6, -35);
    magentaLight.castShadow = true;
    scene.add(magentaLight);
    lights.push(magentaLight);
  };

  var createParticleMist = function() {
    // Translucent mist spheres floating in air
    for (var i = 0; i < 15; i++) {
      var mistParticle = new THREE.Mesh(
        new THREE.SphereGeometry(2, 8, 8),
        new THREE.MeshPhongMaterial({
          color: 0x333333,
          transparent: true,
          opacity: 0.1,
          side: THREE.BackSide
        })
      );
      mistParticle.position.set(
        (Math.random() - 0.5) * 150,
        Math.random() * 20 + 5,
        (Math.random() - 0.5) * 120
      );
      scene.add(mistParticle);
      particleSystem.push({
        mesh: mistParticle,
        baseX: mistParticle.position.x,
        baseY: mistParticle.position.y,
        baseZ: mistParticle.position.z,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.2,
        speedZ: (Math.random() - 0.5) * 0.5
      });
    }
  };

  // Update function for animations
  var update = function(delta) {
    time += delta;

    // Neon sign flicker cycling
    for (var i = 0; i < neonSigns.length; i++) {
      var sign = neonSigns[i];
      var flicker = Math.sin(time * 4 + sign.phase) * 0.3 + 0.7;
      var intensity = sign.baseIntensity * flicker;
      sign.mesh.material.emissiveIntensity = Math.max(0.3, intensity);

      // Slight color shift
      var colorShift = Math.sin(time * 2 + sign.phase) * 50;
      sign.mesh.material.emissive.setHex(sign.originalColor);
    }

    // Surveillance camera network sweep
    for (var j = 0; j < surveillanceCameras.length; j++) {
      var cam = surveillanceCameras[j];
      cam.rotationAngle += delta * 0.3;
      var offset = Math.sin(cam.rotationAngle) * 15;
      cam.mount.rotation.y = Math.sin(time * 1.2 + j) * 0.5;
      cam.lens.position.x = cam.baseX + Math.cos(cam.rotationAngle) * 0.5;
    }

    // Contraband light pulse
    if (lights.length > 1) {
      for (var k = 1; k < lights.length; k++) {
        lights[k].intensity = 1.5 + Math.sin(time * 3 + k) * 0.5;
      }
    }

    // Particle mist drift
    for (var m = 0; m < particleSystem.length; m++) {
      var particle = particleSystem[m];
      particle.mesh.position.x += particle.speedX * delta;
      particle.mesh.position.y += Math.sin(time * 0.5 + m) * 0.3 * delta;
      particle.mesh.position.z += particle.speedZ * delta;

      // Wrap around boundaries
      if (particle.mesh.position.x < -80) particle.mesh.position.x = 80;
      if (particle.mesh.position.x > 80) particle.mesh.position.x = -80;
      if (particle.mesh.position.z < -65) particle.mesh.position.z = 65;
      if (particle.mesh.position.z > 65) particle.mesh.position.z = -65;
    }
  };

  // Reset function
  var reset = function() {
    time = 0;

    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }

    // Remove lights
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }

    objects = [];
    neonSigns = [];
    surveillanceCameras = [];
    lights = [];
    particleSystem = [];
  };

  // Public API
  return {
    init: init,
    update: update,
    reset: reset
  };
}());
