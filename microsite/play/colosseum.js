var window = window || {};

window.Colosseum = (function() {
  'use strict';

  var scene = null;
  var camera = null;

  // State tracking
  var elevatorPlatform = null;
  var torchStands = [];
  var broadcastScreens = [];
  var trapDoors = [];
  var elevatorOffset = 0;
  var elevatorDirection = 1;
  var torchFlicker = [];
  var screenCycles = [];

  var ARENA_WIDTH = 160;
  var ARENA_LENGTH = 240;
  var ARENA_HEIGHT = 0.5;
  var SPECTATOR_HEIGHT = 35;
  var COLOSSEUM_RADIUS = 150;

  // ============ GEOMETRY HELPERS ============

  var createBoxMesh = function(width, height, depth, x, y, z, color, material) {
    var geometry = new THREE.BoxGeometry(width, height, depth);
    var mat = material || new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createCylinderMesh = function(radiusTop, radiusBottom, height, segments, x, y, z, color, material) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    var mat = material || new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createSphereMesh = function(radius, widthSegments, heightSegments, x, y, z, color, material) {
    var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    var mat = material || new THREE.MeshStandardMaterial({ color: color, roughness: 0.6, metalness: 0.2 });
    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createConeMesh = function(radius, height, segments, x, y, z, color, material) {
    var geometry = new THREE.ConeGeometry(radius, height, segments);
    var mat = material || new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.3 });
    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  var createLineSegments = function(points, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var lines = new THREE.LineSegments(geometry, material);
    lines.castShadow = false;
    lines.receiveShadow = false;
    return lines;
  };

  // ============ ARENA FLOOR & SAND ============

  var buildArenaSand = function() {
    // Main sand floor - elliptical (approximate with large box)
    var sandFloor = createBoxMesh(ARENA_WIDTH, ARENA_HEIGHT, ARENA_LENGTH, 0, 0, 0, 0xD4A574,
      new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.9, metalness: 0 }));
    scene.add(sandFloor);

    // Blood-stained sand patches
    var bloodStains = [
      { x: -30, z: 50, w: 15, d: 20 },
      { x: 40, z: -60, w: 18, d: 15 },
      { x: -50, z: -30, w: 12, d: 16 },
      { x: 35, z: 30, w: 20, d: 12 }
    ];

    var bloodMaterial = new THREE.MeshStandardMaterial({ color: 0x4A0E0E, roughness: 0.8, metalness: 0 });

    for (var i = 0; i < bloodStains.length; i++) {
      var stain = bloodStains[i];
      var bloodBox = createBoxMesh(stain.w, ARENA_HEIGHT * 0.9, stain.d, stain.x, ARENA_HEIGHT * 0.5, stain.z, 0x4A0E0E, bloodMaterial);
      scene.add(bloodBox);
    }
  };

  // ============ SPECTATOR TIERS ============

  var buildSpectatorTiers = function() {
    var tierHeights = [8, 16, 26];
    var tierWidths = [120, 100, 80];
    var segmentsPerTier = 24;

    for (var tier = 0; tier < 3; tier++) {
      var tierHeight = tierHeights[tier];
      var tierWidth = tierWidths[tier];
      var color = 0x888888 + (tier * 0x101010);

      // Build curved tier sections using radial boxes
      for (var seg = 0; seg < segmentsPerTier; seg++) {
        var angle = (seg / segmentsPerTier) * Math.PI * 2;
        var radius = COLOSSEUM_RADIUS - (tier * 25);
        var x = Math.cos(angle) * radius;
        var z = Math.sin(angle) * radius;

        var tierSection = createBoxMesh(10, 3, 12, x, tierHeight, z, color);
        tierSection.rotation.y = angle;
        scene.add(tierSection);
      }
    }
  };

  // ============ STONE ARCHWAYS ============

  var buildArchways = function() {
    var archPositions = [
      { x: 0, z: 140 },
      { x: 0, z: -140 },
      { x: 140, z: 0 },
      { x: -140, z: 0 }
    ];

    var stoneMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8, metalness: 0.05 });

    for (var i = 0; i < archPositions.length; i++) {
      var pos = archPositions[i];
      var rotY = (pos.x === 0) ? 0 : Math.PI / 2;

      // Left arch support
      var archLeft = createBoxMesh(5, 20, 15, pos.x - 12, 10, pos.z, 0x696969, stoneMaterial);
      archLeft.rotation.y = rotY;
      scene.add(archLeft);

      // Right arch support
      var archRight = createBoxMesh(5, 20, 15, pos.x + 12, 10, pos.z, 0x696969, stoneMaterial);
      archRight.rotation.y = rotY;
      scene.add(archRight);

      // Lintel top
      var lintel = createBoxMesh(24, 3, 15, pos.x, 20, pos.z, 0x696969, stoneMaterial);
      lintel.rotation.y = rotY;
      scene.add(lintel);

      // Decorative stone blocks above
      var archBlock1 = createBoxMesh(4, 4, 15, pos.x - 8, 24, pos.z, 0x808080, stoneMaterial);
      archBlock1.rotation.y = rotY;
      scene.add(archBlock1);

      var archBlock2 = createBoxMesh(4, 4, 15, pos.x, 24, pos.z, 0x808080, stoneMaterial);
      archBlock2.rotation.y = rotY;
      scene.add(archBlock2);

      var archBlock3 = createBoxMesh(4, 4, 15, pos.x + 8, 24, pos.z, 0x808080, stoneMaterial);
      archBlock3.rotation.y = rotY;
      scene.add(archBlock3);
    }
  };

  // ============ GATE TUNNELS & DOORS ============

  var buildGateTunnels = function() {
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.9, metalness: 0 });
    var ironMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.8 });

    var gatePositions = [
      { x: 0, z: 150, rotY: 0 },
      { x: 0, z: -150, rotY: Math.PI },
      { x: 150, z: 0, rotY: Math.PI / 2 },
      { x: -150, z: 0, rotY: -Math.PI / 2 }
    ];

    for (var i = 0; i < gatePositions.length; i++) {
      var gPos = gatePositions[i];

      // Tunnel walls
      var tunnelLeft = createBoxMesh(8, 12, 30, gPos.x - 10, 5, gPos.z, 0x4A4A4A, gateMaterial);
      scene.add(tunnelLeft);

      var tunnelRight = createBoxMesh(8, 12, 30, gPos.x + 10, 5, gPos.z, 0x4A4A4A, gateMaterial);
      scene.add(tunnelRight);

      // Tunnel ceiling
      var tunnelCeiling = createBoxMesh(20, 2, 30, gPos.x, 12, gPos.z, 0x4A4A4A, gateMaterial);
      scene.add(tunnelCeiling);

      // Heavy wooden gate door
      var gateDoor = createBoxMesh(18, 11, 2, gPos.x, 5, gPos.z - 15, 0x5C4033,
        new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.8, metalness: 0.2 }));
      scene.add(gateDoor);

      // Iron gate bars
      var barsCount = 6;
      for (var b = 0; b < barsCount; b++) {
        var barX = gPos.x - 8 + (b * 3);
        var ironBar = createCylinderMesh(0.3, 0.3, 10, 8, barX, 5, gPos.z - 15, 0x333333, ironMaterial);
        scene.add(ironBar);
      }
    }
  };

  // ============ HYPOGEUM UNDERGROUND PASSAGES ============

  var buildHypogeum = function() {
    var hypGeometry = 0x2C2C2C;
    var hypMaterial = new THREE.MeshStandardMaterial({ color: hypGeometry, roughness: 0.95, metalness: 0 });

    // Underground passage tunnels below arena
    var hypTunnels = [
      { x: 0, z: 0, w: 15, d: 100 },
      { x: 80, z: 0, w: 12, d: 80 },
      { x: -80, z: 0, w: 12, d: 80 }
    ];

    for (var i = 0; i < hypTunnels.length; i++) {
      var tun = hypTunnels[i];
      var tunnel = createBoxMesh(tun.w, 6, tun.d, tun.x, -5, tun.z, hypGeometry, hypMaterial);
      scene.add(tunnel);
    }

    // Metal grating for hypogeum (LineSegments grid pattern)
    var gratingPoints = [];
    var gratSpacing = 4;
    for (var gx = -40; gx <= 40; gx += gratSpacing) {
      gratingPoints.push(gx, -0.5, -50, gx, -0.5, 50);
      gratingPoints.push(-40, -0.5, gx - 50, 40, -0.5, gx - 50);
    }
    var gratingLines = createLineSegments(gratingPoints, 0x555555);
    scene.add(gratingLines);
  };

  // ============ ELEVATOR PLATFORM ============

  var buildElevatorPlatform = function() {
    elevatorPlatform = createBoxMesh(16, 1.5, 16, 0, 0, 0, 0xFFD700,
      new THREE.MeshStandardMaterial({ color: 0xFFD700, roughness: 0.3, metalness: 0.8 }));
    scene.add(elevatorPlatform);

    // Elevator support posts
    var elevPost1 = createCylinderMesh(1.2, 1.2, 8, 8, -6, 3, -6, 0xAA8844);
    var elevPost2 = createCylinderMesh(1.2, 1.2, 8, 8, 6, 3, -6, 0xAA8844);
    var elevPost3 = createCylinderMesh(1.2, 1.2, 8, 8, -6, 3, 6, 0xAA8844);
    var elevPost4 = createCylinderMesh(1.2, 1.2, 8, 8, 6, 3, 6, 0xAA8844);

    scene.add(elevPost1);
    scene.add(elevPost2);
    scene.add(elevPost3);
    scene.add(elevPost4);
  };

  // ============ GLADIATOR GATE ============

  var buildGladiatorGate = function() {
    // Heavy wooden gate at south entrance
    var woodColor = 0x654321;
    var ironColor = 0x2C2C2C;

    var gladGateMain = createBoxMesh(14, 9, 1.5, 0, 4, 125, woodColor,
      new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.85, metalness: 0.1 }));
    scene.add(gladGateMain);

    // Iron reinforcement bands
    var bandTop = createBoxMesh(15, 0.8, 1.5, 0, 8, 125, ironColor);
    var bandMid = createBoxMesh(15, 0.8, 1.5, 0, 4.5, 125, ironColor);
    var bandBot = createBoxMesh(15, 0.8, 1.5, 0, 1, 125, ironColor);

    scene.add(bandTop);
    scene.add(bandMid);
    scene.add(bandBot);
  };

  // ============ ANIMAL PEN GATES ============

  var buildAnimalPens = function() {
    var penPositions = [
      { x: -60, z: -100 },
      { x: 60, z: -100 },
      { x: -60, z: 100 },
      { x: 60, z: 100 }
    ];

    var barMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.6 });

    for (var i = 0; i < penPositions.length; i++) {
      var pen = penPositions[i];

      // Pen enclosure
      var penWall = createBoxMesh(12, 8, 12, pen.x, 3, pen.z, 0x5A5A5A);
      scene.add(penWall);

      // Barred gate
      var barCount = 5;
      for (var b = 0; b < barCount; b++) {
        var barZ = pen.z - 5 + (b * 2.5);
        var penBar = createCylinderMesh(0.4, 0.4, 8, 8, pen.x, 3, barZ, 0x444444, barMaterial);
        scene.add(penBar);
      }
    }
  };

  // ============ MARBLE COLUMNS & RUINS ============

  var buildColumnRuins = function() {
    var columnPositions = [
      { x: -50, z: -80 },
      { x: 50, z: -80 },
      { x: -50, z: 80 },
      { x: 50, z: 80 },
      { x: 0, z: -120 },
      { x: 0, z: 120 }
    ];

    var marbleMaterial = new THREE.MeshStandardMaterial({ color: 0xE8E8E8, roughness: 0.4, metalness: 0.1 });

    for (var i = 0; i < columnPositions.length; i++) {
      var col = columnPositions[i];

      // Marble column (partial - some broken)
      var height = (i < 4) ? 18 : 14;
      var columnMesh = createCylinderMesh(2.5, 2.5, height, 12, col.x, height / 2, col.z, 0xE8E8E8, marbleMaterial);
      scene.add(columnMesh);

      // Fallen capital stone
      if (i % 2 === 0) {
        var capital = createBoxMesh(6, 2, 6, col.x + 3, height + 1, col.z + 2, 0xD3D3D3, marbleMaterial);
        scene.add(capital);
      }
    }
  };

  // ============ WEAPON RACKS ============

  var buildWeaponRacks = function() {
    var rackPositions = [
      { x: -70, z: 50 },
      { x: 70, z: 50 },
      { x: -70, z: -50 },
      { x: 70, z: -50 }
    ];

    var woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8, metalness: 0 });
    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.7 });

    for (var i = 0; i < rackPositions.length; i++) {
      var rack = rackPositions[i];

      // Rack frame
      var rackFrame = createBoxMesh(8, 10, 3, rack.x, 5, rack.z, 0x8B4513, woodMaterial);
      scene.add(rackFrame);

      // Weapon representations (boxes with metallic shine)
      var weaponSlots = [
        { xOff: -2.5, yOff: 8 },
        { xOff: 0, yOff: 8 },
        { xOff: 2.5, yOff: 8 },
        { xOff: -2.5, yOff: 5 },
        { xOff: 0, yOff: 5 },
        { xOff: 2.5, yOff: 5 }
      ];

      for (var w = 0; w < weaponSlots.length; w++) {
        var ws = weaponSlots[w];
        var weapon = createBoxMesh(1.5, 0.5, 2.5, rack.x + ws.xOff, ws.yOff, rack.z, 0x666666, metalMaterial);
        scene.add(weapon);
      }
    }
  };

  // ============ TORCH STANDS ============

  var buildTorchStands = function() {
    var torchPositions = [
      { x: -90, z: -110 },
      { x: 90, z: -110 },
      { x: -90, z: 110 },
      { x: 90, z: 110 },
      { x: 0, z: -140 },
      { x: 0, z: 140 },
      { x: 140, z: 0 },
      { x: -140, z: 0 }
    ];

    var metalMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6, metalness: 0.7 });
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF3300,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0
    });

    for (var i = 0; i < torchPositions.length; i++) {
      var tPos = torchPositions[i];

      // Torch stand pole
      var torchPole = createCylinderMesh(1, 1, 12, 8, tPos.x, 6, tPos.z, 0x444444, metalMaterial);
      scene.add(torchPole);

      // Fire sphere
      var fireSphere = createSphereMesh(2.5, 8, 8, tPos.x, 13, tPos.z, 0xFF6600, fireMaterial);
      torchStands.push({
        mesh: fireSphere,
        baseIntensity: 0.6,
        flicker: Math.random() * 0.5
      });
      scene.add(fireSphere);
    }
  };

  // ============ BROADCAST TOWER & EQUIPMENT ============

  var buildBroadcastTower = function() {
    var towerBase = createBoxMesh(8, 1, 8, -100, 0.5, -100, 0x333333);
    scene.add(towerBase);

    // Tower structure (BoxGeometry sections stacked)
    var towerSection1 = createBoxMesh(6, 15, 6, -100, 8, -100, 0x444444);
    var towerSection2 = createBoxMesh(4, 15, 4, -100, 23, -100, 0x555555);
    var towerSection3 = createBoxMesh(2, 10, 2, -100, 36, -100, 0x666666);

    scene.add(towerSection1);
    scene.add(towerSection2);
    scene.add(towerSection3);

    // Antenna masts (CylinderGeometry)
    var mast1 = createCylinderMesh(0.4, 0.4, 8, 6, -100, 45, -100, 0x888888);
    var mast2 = createCylinderMesh(0.3, 0.3, 6, 6, -95, 48, -100, 0x888888);
    var mast3 = createCylinderMesh(0.3, 0.3, 6, 6, -105, 48, -100, 0x888888);

    scene.add(mast1);
    scene.add(mast2);
    scene.add(mast3);
  };

  // ============ CAMERA DRONE PLATFORM ============

  var buildDronePlatform = function() {
    var dronePlatform = createBoxMesh(10, 1.5, 10, 100, 30, -100, 0x1A1A1A,
      new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.5, metalness: 0.6 }));
    scene.add(dronePlatform);

    // Platform support posts
    var post1 = createCylinderMesh(1, 1, 28, 8, 95, 15, -95, 0x333333);
    var post2 = createCylinderMesh(1, 1, 28, 8, 105, 15, -95, 0x333333);
    var post3 = createCylinderMesh(1, 1, 28, 8, 95, 15, -105, 0x333333);
    var post4 = createCylinderMesh(1, 1, 28, 8, 105, 15, -105, 0x333333);

    scene.add(post1);
    scene.add(post2);
    scene.add(post3);
    scene.add(post4);

    // Camera equipment (BoxGeometry)
    var cameraMount = createBoxMesh(4, 4, 4, 100, 32, -100, 0x222222);
    scene.add(cameraMount);
  };

  // ============ BROADCAST SCREENS ============

  var buildBroadcastScreens = function() {
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00FF00,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });

    var screenPositions = [
      { x: 0, z: 130, rotY: 0 },
      { x: 0, z: -130, rotY: Math.PI },
      { x: 130, z: 0, rotY: Math.PI / 2 },
      { x: -130, z: 0, rotY: -Math.PI / 2 }
    ];

    for (var i = 0; i < screenPositions.length; i++) {
      var sPos = screenPositions[i];

      // HD screen panel
      var screenPanel = createBoxMesh(20, 12, 1, sPos.x, 18, sPos.z, 0x000000, screenMaterial);
      scene.add(screenPanel);

      broadcastScreens.push({
        mesh: screenPanel,
        baseIntensity: 0.8,
        cycle: 0
      });

      screenCycles.push(0);
    }
  };

  // ============ SCOREBOARD ============

  var buildScoreboard = function() {
    var scoreboardMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      emissive: 0xFF0000,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.9
    });

    var scoreboard = createBoxMesh(16, 6, 1, 0, 28, 0, 0x111111, scoreboardMaterial);
    scene.add(scoreboard);

    broadcastScreens.push({
      mesh: scoreboard,
      baseIntensity: 0.7,
      cycle: 0
    });
  };

  // ============ TRAP DOORS & ARENA FEATURES ============

  var buildTrapDoors = function() {
    var trapPositions = [
      { x: -30, z: 20 },
      { x: 30, z: -30 },
      { x: 0, z: 0 }
    ];

    var trapMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    });

    for (var i = 0; i < trapPositions.length; i++) {
      var tPos = trapPositions[i];

      var trapDoor = createBoxMesh(8, 0.5, 8, tPos.x, ARENA_HEIGHT + 0.2, tPos.z, 0x8B4513, trapMaterial);
      scene.add(trapDoor);

      trapDoors.push({
        mesh: trapDoor,
        originalY: ARENA_HEIGHT + 0.2,
        isOpen: false,
        openAmount: 0
      });
    }
  };

  // ============ FALLBACK PYRAMID & MISCELLANEOUS ============

  var buildMiscellaneousStructures = function() {
    // Fallen stone blocks
    var fallenBlocks = [
      { x: -60, y: 0.5, z: 20, w: 8, h: 4, d: 12 },
      { x: 45, y: 0.8, z: -70, w: 10, h: 3, d: 10 },
      { x: -20, y: 0.6, z: -90, w: 6, h: 5, d: 8 }
    ];

    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.85, metalness: 0 });

    for (var i = 0; i < fallenBlocks.length; i++) {
      var block = fallenBlocks[i];
      var rubble = createBoxMesh(block.w, block.h, block.d, block.x, block.y, block.z, 0x808080, stoneMat);
      scene.add(rubble);
    }
  };

  // ============ INIT FUNCTION ============

  var init = function(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    scene.add(directionalLight);

    // Build colosseum components
    buildArenaSand();
    buildSpectatorTiers();
    buildArchways();
    buildGateTunnels();
    buildHypogeum();
    buildElevatorPlatform();
    buildGladiatorGate();
    buildAnimalPens();
    buildColumnRuins();
    buildWeaponRacks();
    buildTorchStands();
    buildBroadcastTower();
    buildDronePlatform();
    buildBroadcastScreens();
    buildScoreboard();
    buildTrapDoors();
    buildMiscellaneousStructures();

    // Initialize torch flicker state
    for (var i = 0; i < torchStands.length; i++) {
      torchFlicker.push({
        time: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  };

  // ============ UPDATE FUNCTION ============

  var update = function(delta) {
    if (!scene) return;

    // Elevator platform animation - rise and fall
    if (elevatorPlatform) {
      elevatorOffset += elevatorDirection * delta * 0.8;
      if (elevatorOffset > 3) elevatorDirection = -1;
      if (elevatorOffset < 0) elevatorDirection = 1;
      elevatorPlatform.position.y = elevatorOffset;
    }

    // Torch flicker animation
    for (var i = 0; i < torchStands.length; i++) {
      var torch = torchStands[i];
      if (torch.mesh) {
        torch.time += delta * torch.speed;
        var flicker = 0.5 + Math.sin(torch.time * 3) * 0.3;
        var material = torch.mesh.material;
        if (material) {
          material.emissiveIntensity = torch.baseIntensity * flicker;
        }
      }
    }

    // Broadcast screen content cycling
    for (var s = 0; s < broadcastScreens.length; s++) {
      var screen = broadcastScreens[s];
      if (screen.mesh && screen.mesh.material) {
        screenCycles[s] = (screenCycles[s] + delta) % 4;
        var intensity = 0.5 + Math.sin(screenCycles[s] * Math.PI) * 0.3;
        screen.mesh.material.emissiveIntensity = intensity;
      }
    }

    // Trap door open/close animation
    for (var t = 0; t < trapDoors.length; t++) {
      var trap = trapDoors[t];
      if (trap.isOpen) {
        trap.openAmount += delta * 1.2;
        if (trap.openAmount > Math.PI / 2) {
          trap.openAmount = Math.PI / 2;
          trap.isOpen = false;
        }
      } else {
        trap.openAmount = Math.max(0, trap.openAmount - delta * 0.5);
      }

      trap.mesh.rotation.x = trap.openAmount;
      trap.mesh.position.y = trap.originalY + Math.sin(trap.openAmount) * 2;
    }
  };

  // ============ RESET FUNCTION ============

  var reset = function() {
    elevatorOffset = 0;
    elevatorDirection = 1;

    if (elevatorPlatform) {
      elevatorPlatform.position.y = 0;
    }

    for (var i = 0; i < torchFlicker.length; i++) {
      torchFlicker[i].time = Math.random() * Math.PI * 2;
    }

    for (var s = 0; s < screenCycles.length; s++) {
      screenCycles[s] = 0;
    }

    for (var t = 0; t < trapDoors.length; t++) {
      trapDoors[t].isOpen = false;
      trapDoors[t].openAmount = 0;
      trapDoors[t].mesh.rotation.x = 0;
      trapDoors[t].mesh.position.y = trapDoors[t].originalY;
    }
  };

  // ============ PUBLIC API ============

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
