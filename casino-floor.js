window.CasinoFloor = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var slotMachines = [];
  var neonSigns = [];
  var chandelier = null;
  var chandelier_sway = 0;
  var chipScatters = [];
  var securityCameras = [];
  var rouletteTable = null;
  var rouletteWheel = null;
  var crapsTable = null;
  var pokerTables = [];
  var vipSeating = [];
  var cashierCage = null;
  var bartender_area = null;
  var atmMachines = [];
  var overturned_tables = [];
  var emergencyExitLights = [];
  var surveillanceWindow = null;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Set scene background and lighting
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 100, 150);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var pointLight1 = new THREE.PointLight(0xffffff, 1, 80);
    pointLight1.position.set(0, 20, 0);
    scene.add(pointLight1);

    var pointLight2 = new THREE.PointLight(0xff00ff, 0.8, 60);
    pointLight2.position.set(-30, 15, -30);
    scene.add(pointLight2);

    var pointLight3 = new THREE.PointLight(0x00ffff, 0.8, 60);
    pointLight3.position.set(30, 15, 30);
    scene.add(pointLight3);

    // MARBLE-LOOK FLOOR with emissive veining
    var floorGeometry = new THREE.BoxGeometry(100, 0.5, 100);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x1a1a1a
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor veining detail (visual only - using line segments)
    var veiningGeometry = new THREE.BufferGeometry();
    var veiningPositions = [];
    for (var i = 0; i < 20; i++) {
      var x1 = Math.random() * 100 - 50;
      var z1 = Math.random() * 100 - 50;
      var x2 = x1 + (Math.random() - 0.5) * 30;
      var z2 = z1 + (Math.random() - 0.5) * 30;
      veiningPositions.push(x1, 0.26, z1);
      veiningPositions.push(x2, 0.26, z2);
    }
    veiningGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(veiningPositions), 3));
    var veiningMaterial = new THREE.LineBasicMaterial({ color: 0x4a4a4a });
    var veining = new THREE.LineSegments(veiningGeometry, veiningMaterial);
    scene.add(veining);

    // SLOT MACHINE ROWS
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var slotX = -35 + col * 20;
        var slotZ = -35 + row * 20;
        var slotMachine = createSlotMachine(slotX, slotZ);
        scene.add(slotMachine);
        slotMachines.push(slotMachine);
      }
    }

    // POKER/CARD TABLES
    for (var t = 0; t < 2; t++) {
      var tableX = -25 + t * 50;
      var pokerTable = createPokerTable(tableX, 0, 10);
      scene.add(pokerTable);
      pokerTables.push(pokerTable);
    }

    // ROULETTE TABLE
    rouletteTable = createRouletteTable(0, 0, -40);
    scene.add(rouletteTable);

    // CRAPS TABLE
    crapsTable = createCrapsTable(0, 0, 35);
    scene.add(crapsTable);

    // CHANDELIER
    chandelier = createChandelier(0, 30, 0);
    scene.add(chandelier);

    // VIP LOUNGE SEATING
    for (var v = 0; v < 3; v++) {
      var chair = createVipChair(-40 + v * 15, 0, 45);
      scene.add(chair);
      vipSeating.push(chair);
    }

    // CASHIER CAGE
    cashierCage = createCashierCage(45, 0, 0);
    scene.add(cashierCage);

    // NEON SIGN PANELS
    var neonSign1 = createNeonSign(-45, 15, 0, 'JACKPOT', 0xff00ff);
    scene.add(neonSign1);
    neonSigns.push(neonSign1);

    var neonSign2 = createNeonSign(45, 15, 0, 'CASINO', 0x00ffff);
    scene.add(neonSign2);
    neonSigns.push(neonSign2);

    var neonSign3 = createNeonSign(0, 15, -45, 'HIGH ROLLER', 0xff0080);
    scene.add(neonSign3);
    neonSigns.push(neonSign3);

    // CHIP SCATTER ON FLOOR
    for (var c = 0; c < 30; c++) {
      var chipX = Math.random() * 80 - 40;
      var chipZ = Math.random() * 80 - 40;
      var chip = createChipScatter(chipX, 0.3, chipZ);
      scene.add(chip);
      chipScatters.push(chip);
    }

    // SECURITY CAMERAS
    for (var s = 0; s < 4; s++) {
      var camAngle = (s / 4) * Math.PI * 2;
      var camX = Math.cos(camAngle) * 45;
      var camZ = Math.sin(camAngle) * 45;
      var camera_mount = createSecurityCamera(camX, 22, camZ);
      scene.add(camera_mount);
      securityCameras.push(camera_mount);
    }

    // ATM MACHINES
    for (var a = 0; a < 2; a++) {
      var atmX = -48 + a * 50;
      var atm = createAtmMachine(atmX, 0, 48);
      scene.add(atm);
      atmMachines.push(atm);
    }

    // BAR COUNTER
    bartender_area = createBarCounter(-30, 0, 50);
    scene.add(bartender_area);

    // OVERTURNED TABLES AS COVER
    for (var o = 0; o < 3; o++) {
      var overturnX = -20 + o * 25;
      var overturn = createOverturnedTable(overturnX, 2, 20);
      scene.add(overturn);
      overturned_tables.push(overturn);
    }

    // EMERGENCY EXIT LIGHTS
    for (var e = 0; e < 4; e++) {
      var exitCorner = [[-48, -48], [48, -48], [-48, 48], [48, 48]];
      var exitLight = createEmergencyExitLight(exitCorner[e][0], 5, exitCorner[e][1]);
      scene.add(exitLight);
      emergencyExitLights.push(exitLight);
    }

    // SURVEILLANCE ROOM WINDOW (elevated glass room)
    surveillanceWindow = createSurveillanceWindow(50, 15, -50);
    scene.add(surveillanceWindow);
  }

  function createSlotMachine(x, z) {
    var group = new THREE.Group();

    // Body
    var bodyGeom = new THREE.BoxGeometry(3, 6, 2);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00,
      metalness: 0.6,
      roughness: 0.2
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 3;
    group.add(body);

    // Coin slot (sphere)
    var slotGeom = new THREE.SphereGeometry(0.3, 16, 16);
    var slotMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    var slot = new THREE.Mesh(slotGeom, slotMat);
    slot.position.set(0, 1.5, 1.1);
    group.add(slot);

    // Screen (box)
    var screenGeom = new THREE.BoxGeometry(2.5, 2, 0.1);
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00
    });
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(0, 3.5, 1);
    screen.userData = { isScreen: true, originalEmissive: 0x00aa00 };
    group.add(screen);

    // Top light indicator
    var lightGeom = new THREE.SphereGeometry(0.2, 8, 8);
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000
    });
    var light = new THREE.Mesh(lightGeom, lightMat);
    light.position.set(0, 5.5, 1);
    group.add(light);

    group.position.set(x, 0, z);
    return group;
  }

  function createPokerTable(x, y, z) {
    var group = new THREE.Group();

    // Table top (flat)
    var topGeom = new THREE.BoxGeometry(8, 0.3, 5);
    var topMat = new THREE.MeshStandardMaterial({
      color: 0x006400,
      roughness: 0.4
    });
    var top = new THREE.Mesh(topGeom, topMat);
    top.position.y = 1;
    group.add(top);

    // Legs (cylinders)
    for (var i = 0; i < 4; i++) {
      var legX = (i % 2 === 0) ? -3 : 3;
      var legZ = (i < 2) ? -2 : 2;
      var legGeom = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(legX, 0.5, legZ);
      group.add(leg);
    }

    // Cup holder divider (box)
    var dividerGeom = new THREE.BoxGeometry(0.2, 0.5, 5);
    var dividerMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var divider = new THREE.Mesh(dividerGeom, dividerMat);
    divider.position.set(0, 1.3, 0);
    group.add(divider);

    group.position.set(x, y, z);
    return group;
  }

  function createRouletteTable(x, y, z) {
    var group = new THREE.Group();

    // Table base (box)
    var baseGeom = new THREE.BoxGeometry(12, 1, 8);
    var baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 1;
    group.add(base);

    // Wheel (cylinder flat disk - NO TorusGeometry)
    var wheelGeom = new THREE.CylinderGeometry(3, 3, 0.5, 32);
    var wheelMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.8,
      roughness: 0.1
    });
    var wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(2, 1.5, 0);
    wheel.rotation.x = Math.PI * 0.1;
    group.add(wheel);
    rouletteWheel = wheel;

    // Betting layout (flat box)
    var layoutGeom = new THREE.BoxGeometry(6, 0.1, 6);
    var layoutMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
    var layout = new THREE.Mesh(layoutGeom, layoutMat);
    layout.position.set(-4, 2, 0);
    group.add(layout);

    group.position.set(x, y, z);
    return group;
  }

  function createCrapsTable(x, y, z) {
    var group = new THREE.Group();

    // Elongated table
    var tableGeom = new THREE.BoxGeometry(15, 0.5, 4);
    var tableMat = new THREE.MeshStandardMaterial({
      color: 0x006400,
      roughness: 0.4
    });
    var table = new THREE.Mesh(tableGeom, tableMat);
    table.position.y = 1;
    group.add(table);

    // Side rails (boxes)
    for (var i = 0; i < 2; i++) {
      var railZ = (i === 0) ? -2.5 : 2.5;
      var railGeom = new THREE.BoxGeometry(15, 0.5, 0.3);
      var railMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      var rail = new THREE.Mesh(railGeom, railMat);
      rail.position.set(0, 1.3, railZ);
      group.add(rail);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createChandelier(x, y, z) {
    var group = new THREE.Group();

    // Central sphere
    var centralGeom = new THREE.SphereGeometry(1.5, 16, 16);
    var centralMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffaa00
    });
    var central = new THREE.Mesh(centralGeom, centralMat);
    group.add(central);

    // Crystal drops (line segments)
    var crystalPositions = [];
    for (var i = 0; i < 20; i++) {
      var angle = (i / 20) * Math.PI * 2;
      var radius = 2;
      var px = Math.cos(angle) * radius;
      var pz = Math.sin(angle) * radius;
      crystalPositions.push(0, 0, 0);
      crystalPositions.push(px, -2, pz);
    }
    var crystalGeom = new THREE.BufferGeometry();
    crystalGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(crystalPositions), 3));
    var crystalMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    var crystals = new THREE.LineSegments(crystalGeom, crystalMat);
    group.add(crystals);

    // Light bulbs (spheres)
    for (var b = 0; b < 8; b++) {
      var bulbAngle = (b / 8) * Math.PI * 2;
      var bulbX = Math.cos(bulbAngle) * 1.8;
      var bulbZ = Math.sin(bulbAngle) * 1.8;
      var bulbGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00
      });
      var bulb = new THREE.Mesh(bulbGeom, bulbMat);
      bulb.position.set(bulbX, 0.5, bulbZ);
      group.add(bulb);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createVipChair(x, y, z) {
    var group = new THREE.Group();

    // Seat (box)
    var seatGeom = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    var seatMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      roughness: 0.5
    });
    var seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.y = 0.8;
    group.add(seat);

    // Backrest (box)
    var backGeom = new THREE.BoxGeometry(1.5, 2, 0.3);
    var backMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
    var back = new THREE.Mesh(backGeom, backMat);
    back.position.set(0, 2.2, -0.8);
    group.add(back);

    // Legs (boxes)
    for (var i = 0; i < 4; i++) {
      var legX = (i % 2 === 0) ? -0.6 : 0.6;
      var legZ = (i < 2) ? -0.6 : 0.6;
      var legGeom = new THREE.BoxGeometry(0.15, 0.8, 0.15);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(legX, 0.4, legZ);
      group.add(leg);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createCashierCage(x, y, z) {
    var group = new THREE.Group();

    // Counter (long box)
    var counterGeom = new THREE.BoxGeometry(6, 1.2, 2);
    var counterMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.7,
      roughness: 0.2
    });
    var counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.y = 0.6;
    group.add(counter);

    // Vertical bars (boxes)
    for (var i = 0; i < 6; i++) {
      var barX = -2.5 + i * 1;
      var barGeom = new THREE.BoxGeometry(0.15, 3, 0.15);
      var barMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var bar = new THREE.Mesh(barGeom, barMat);
      bar.position.set(barX, 1.5, 1);
      group.add(bar);
    }

    // Back wall (box)
    var wallGeom = new THREE.BoxGeometry(6, 2.5, 0.3);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(0, 1.25, 1.3);
    group.add(wall);

    group.position.set(x, y, z);
    return group;
  }

  function createNeonSign(x, y, z, text, color) {
    var group = new THREE.Group();

    // Sign panel (box)
    var panelGeom = new THREE.BoxGeometry(8, 2, 0.2);
    var panelMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.0
    });
    var panel = new THREE.Mesh(panelGeom, panelMat);
    panel.userData = { isNeon: true, originalColor: color, flashPhase: 0 };
    group.add(panel);

    // Support brackets (boxes)
    for (var i = 0; i < 2; i++) {
      var bracketX = (i === 0) ? -3.5 : 3.5;
      var bracketGeom = new THREE.BoxGeometry(0.3, 0.3, 1);
      var bracketMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var bracket = new THREE.Mesh(bracketGeom, bracketMat);
      bracket.position.set(bracketX, 0, 0.5);
      group.add(bracket);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createChipScatter(x, y, z) {
    var chipGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    var colors = [0xff0000, 0x000000, 0xffffff, 0x00ff00, 0xff00ff];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var chipMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.5
    });
    var chip = new THREE.Mesh(chipGeom, chipMat);
    chip.position.set(x, y, z);
    chip.rotation.x = Math.random() * Math.PI * 2;
    chip.rotation.z = Math.random() * Math.PI * 2;
    chip.userData = { isChip: true, sparkle: 0 };
    return chip;
  }

  function createSecurityCamera(x, y, z) {
    var group = new THREE.Group();

    // Mount (box)
    var mountGeom = new THREE.BoxGeometry(0.5, 0.5, 0.3);
    var mountMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var mount = new THREE.Mesh(mountGeom, mountMat);
    group.add(mount);

    // Lens (sphere)
    var lensGeom = new THREE.SphereGeometry(0.25, 16, 16);
    var lensMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.05
    });
    var lens = new THREE.Mesh(lensGeom, lensMat);
    lens.position.set(0, 0, 0.3);
    group.add(lens);

    group.position.set(x, y, z);
    return group;
  }

  function createAtmMachine(x, y, z) {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeom = new THREE.BoxGeometry(1.5, 2.5, 1);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.3
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 1.25;
    group.add(body);

    // Screen (box)
    var screenGeom = new THREE.BoxGeometry(1.2, 1.5, 0.1);
    var screenMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00
    });
    var screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.set(0, 1.5, 0.55);
    group.add(screen);

    // Card slot (box)
    var slotGeom = new THREE.BoxGeometry(0.8, 0.2, 0.1);
    var slotMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var slot = new THREE.Mesh(slotGeom, slotMat);
    slot.position.set(0, 0.5, 0.55);
    group.add(slot);

    group.position.set(x, y, z);
    return group;
  }

  function createBarCounter(x, y, z) {
    var group = new THREE.Group();

    // Counter (long box)
    var counterGeom = new THREE.BoxGeometry(12, 1, 2);
    var counterMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.4
    });
    var counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.y = 1;
    group.add(counter);

    // Bar stools (cylinder legs + box seats)
    for (var i = 0; i < 6; i++) {
      var stoolX = -4 + i * 2;

      // Leg
      var legGeom = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
      var legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(stoolX, 0.6, 0);
      group.add(leg);

      // Seat
      var seatGeom = new THREE.BoxGeometry(0.6, 0.2, 0.6);
      var seatMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
      var seat = new THREE.Mesh(seatGeom, seatMat);
      seat.position.set(stoolX, 1.3, 0);
      group.add(seat);
    }

    // Back shelf (box)
    var shelfGeom = new THREE.BoxGeometry(12, 0.5, 1);
    var shelfMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var shelf = new THREE.Mesh(shelfGeom, shelfMat);
    shelf.position.set(0, 2.5, 0);
    group.add(shelf);

    group.position.set(x, y, z);
    return group;
  }

  function createOverturnedTable(x, y, z) {
    var group = new THREE.Group();

    // Tilted top (box at angle)
    var topGeom = new THREE.BoxGeometry(6, 0.3, 4);
    var topMat = new THREE.MeshStandardMaterial({
      color: 0x006400,
      roughness: 0.4
    });
    var top = new THREE.Mesh(topGeom, topMat);
    top.rotation.z = Math.PI / 6;
    top.position.y = 1;
    group.add(top);

    // Visible leg
    var legGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(-2, 0.75, -1.5);
    group.add(leg);

    group.position.set(x, y, z);
    return group;
  }

  function createEmergencyExitLight(x, y, z) {
    var group = new THREE.Group();

    // Light box (emissive red)
    var lightGeom = new THREE.BoxGeometry(1, 0.5, 0.2);
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.0
    });
    var light = new THREE.Mesh(lightGeom, lightMat);
    light.userData = { isExitLight: true };
    group.add(light);

    // Mounting bracket (box)
    var bracketGeom = new THREE.BoxGeometry(0.3, 0.3, 1);
    var bracketMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var bracket = new THREE.Mesh(bracketGeom, bracketMat);
    bracket.position.z = -0.6;
    group.add(bracket);

    group.position.set(x, y, z);
    return group;
  }

  function createSurveillanceWindow(x, y, z) {
    var group = new THREE.Group();

    // Window frame (box)
    var frameGeom = new THREE.BoxGeometry(4, 3, 0.5);
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.7
    });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    group.add(frame);

    // Glass panes (boxes - semi-transparent)
    var glassGeom = new THREE.BoxGeometry(1.8, 1.4, 0.1);
    var glassMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.4,
      emissive: 0x00aaff,
      emissiveIntensity: 0.3
    });

    for (var i = 0; i < 4; i++) {
      var paneX = -1.2 + (i % 2) * 2.4;
      var paneY = 0.9 - Math.floor(i / 2) * 1.8;
      var pane = new THREE.Mesh(glassGeom, glassMat);
      pane.position.set(paneX, paneY, 0.3);
      group.add(pane);
    }

    group.position.set(x, y, z);
    return group;
  }

  function update(delta) {
    // Slot machine screen flash
    for (var i = 0; i < slotMachines.length; i++) {
      slotMachines[i].children.forEach(function(child) {
        if (child.userData && child.userData.isScreen) {
          var intensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
          child.material.emissiveIntensity = intensity;
        }
      });
    }

    // Neon sign flicker
    for (var n = 0; n < neonSigns.length; n++) {
      neonSigns[n].children.forEach(function(child) {
        if (child.userData && child.userData.isNeon) {
          var flicker = Math.random() > 0.95 ? 0.5 : 1.0;
          child.material.emissiveIntensity = flicker;
        }
      });
    }

    // Chandelier gentle sway
    if (chandelier) {
      chandelier_sway += delta * 1.5;
      chandelier.rotation.z = Math.sin(chandelier_sway) * 0.02;
      chandelier.rotation.x = Math.cos(chandelier_sway * 0.7) * 0.01;
    }

    // Roulette wheel spin
    if (rouletteWheel) {
      rouletteWheel.rotation.y += delta * 2;
    }

    // Chip scatter sparkle
    for (var c = 0; c < chipScatters.length; c++) {
      chipScatters[c].userData.sparkle += delta;
      if (chipScatters[c].userData.sparkle > Math.PI * 2) {
        chipScatters[c].userData.sparkle = 0;
      }
      var sparkleScale = 1 + Math.sin(chipScatters[c].userData.sparkle) * 0.2;
      chipScatters[c].scale.set(1, sparkleScale, 1);
    }

    // ATM screen flicker
    for (var a = 0; a < atmMachines.length; a++) {
      atmMachines[a].children.forEach(function(child) {
        if (child.material && child.material.color) {
          if (Math.random() > 0.98) {
            child.material.emissiveIntensity = Math.random() * 0.5 + 0.5;
          }
        }
      });
    }

    // Emergency exit light pulse
    for (var e = 0; e < emergencyExitLights.length; e++) {
      emergencyExitLights[e].children.forEach(function(child) {
        if (child.userData && child.userData.isExitLight) {
          var pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
          child.material.emissiveIntensity = pulse;
        }
      });
    }
  }

  function reset() {
    chandelier_sway = 0;
    slotMachines = [];
    neonSigns = [];
    chipScatters = [];
    securityCameras = [];
    pokerTables = [];
    vipSeating = [];
    atmMachines = [];
    overturned_tables = [];
    emergencyExitLights = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
