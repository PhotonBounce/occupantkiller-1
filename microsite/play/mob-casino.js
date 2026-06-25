window.MobCasino = (function() {
  'use strict';

  // Color palette
  var COLORS = {
    casinoRed: 0xCC0011,
    gold: 0xD4AF37,
    neonPink: 0xFF1493,
    neonBlue: 0x00BFFF,
    mobBlack: 0x1A1A1A,
    feltGreen: 0x1B7A1B,
    white: 0xFFFFFF,
    darkGray: 0x333333,
    brass: 0xB8860B
  };

  // Game state
  var state = {
    meshes: [],
    lights: [],
    slotMachineStates: {},
    neonStates: {},
    chandelier: null,
    chandelierRotation: 0,
    enforcer: null,
    enforcerPath: 0,
    vaultOpen: false,
    moneyMeshes: [],
    spotlight: null,
    spotlightIntensity: 0.5
  };

  function init(scene, camera) {
    // Clear previous state
    reset();

    // Main floor: large box base
    var floorGeometry = new THREE.BoxGeometry(60, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2A2A2A });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    state.meshes.push(floor);

    // Slot machine row 1 (left side)
    createSlotMachineRow(scene, -20, 5, -15, 5);

    // Slot machine row 2 (center)
    createSlotMachineRow(scene, -20, 5, 0, 5);

    // Slot machine row 3 (right side)
    createSlotMachineRow(scene, -20, 5, 15, 5);

    // Poker tables in the center
    createPokerTable(scene, 5, 0.5, -10);
    createPokerTable(scene, 5, 0.5, 0);
    createPokerTable(scene, 5, 0.5, 10);

    // Bar counter
    createBarCounter(scene, 20, 0, 0);

    // VIP booth partitions
    createVIPBooth(scene, 15, 3, -18);
    createVIPBooth(scene, 15, 3, 18);

    // Neon signs on walls
    createNeonSign(scene, -29, 8, -15, 'CASINO');
    createNeonSign(scene, -29, 8, 15, 'LUCK');
    createNeonSign(scene, 29, 8, 0, 'HIGH STAKES');

    // Vault door on far back wall
    createVaultDoor(scene, -28, 3, 22);

    // Boss office setup
    createBossOffice(scene, 25, 3, 22);

    // Decorative columns
    createColumn(scene, -15, 8, -20);
    createColumn(scene, -15, 8, 20);
    createColumn(scene, 15, 8, -20);
    createColumn(scene, 15, 8, 20);

    // Chandelier in center
    createChandelier(scene, 0, 15, 0);

    // Security cameras on walls
    createSecurityCamera(scene, -28, 12, -15);
    createSecurityCamera(scene, -28, 12, 15);
    createSecurityCamera(scene, 28, 12, -15);
    createSecurityCamera(scene, 28, 12, 15);

    // Stage with spotlight
    createStage(scene, 22, 0.5, -18);
    createSpotlight(scene, 22, 10, -18);

    // Corridor entrance
    createCorridor(scene, 28, 5, 0);

    // Money pile near vault (scattered coins)
    createMoneyPile(scene, -20, 1, 20);

    // Mob enforcer patrol
    createMobEnforcer(scene, 0, 1, 0);
  }

  function createSlotMachineRow(scene, x, count, zStart, zSpacing) {
    for (var i = 0; i < count; i++) {
      var z = zStart + (i - (count - 1) / 2) * zSpacing;
      createSlotMachine(scene, x + i * 3, 1.5, z);
    }
  }

  function createSlotMachine(scene, x, y, z) {
    // Machine body
    var bodyGeometry = new THREE.BoxGeometry(1.8, 3.5, 1.2);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.casinoRed });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    scene.add(body);
    state.meshes.push(body);

    // Screen
    var screenGeometry = new THREE.BoxGeometry(1.6, 2.5, 0.15);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: 0x00FF00
    });
    var screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(x, y + 0.3, z + 0.6);
    scene.add(screen);
    state.meshes.push(screen);

    // Flashing light strip (3 colored cubes)
    for (var i = 0; i < 3; i++) {
      var lightGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.2);
      var lightColor = [COLORS.neonPink, COLORS.neonBlue, COLORS.gold][i];
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: lightColor,
        emissive: lightColor
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(x - 0.6 + i * 0.6, y + 1.6, z + 0.7);
      scene.add(light);
      state.meshes.push(light);
      state.slotMachineStates[x + ',' + z + ',' + i] = { mesh: light, cycle: Math.random() * Math.PI * 2 };
    }

    // Coin slot opening
    var coinSlotGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    var coinSlotMaterial = new THREE.MeshStandardMaterial({ color: COLORS.brass });
    var coinSlot = new THREE.Mesh(coinSlotGeometry, coinSlotMaterial);
    coinSlot.position.set(x, y - 1.5, z + 0.6);
    scene.add(coinSlot);
    state.meshes.push(coinSlot);
  }

  function createPokerTable(scene, x, y, z) {
    // Table top (using cylinder for flat surface)
    var topGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
    var topMaterial = new THREE.MeshStandardMaterial({ color: COLORS.feltGreen });
    var top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(x, y + 1, z);
    top.receiveShadow = true;
    scene.add(top);
    state.meshes.push(top);

    // Table legs
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var legX = x + Math.cos(angle) * 1.8;
      var legZ = z + Math.sin(angle) * 1.8;
      var legGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
      var legMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(legX, y + 0.5, legZ);
      scene.add(leg);
      state.meshes.push(leg);
    }

    // Chip stack on table
    var chipGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    var chipMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
    for (var j = 0; j < 5; j++) {
      var chip = new THREE.Mesh(chipGeometry, chipMaterial);
      chip.position.set(x, y + 1.2 + j * 0.05, z);
      scene.add(chip);
      state.meshes.push(chip);
    }
  }

  function createBarCounter(scene, x, y, z) {
    // Counter surface
    var counterGeometry = new THREE.BoxGeometry(8, 1.5, 1.2);
    var counterMaterial = new THREE.MeshStandardMaterial({ color: COLORS.brass });
    var counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(x, y + 0.75, z);
    counter.castShadow = true;
    scene.add(counter);
    state.meshes.push(counter);

    // Back panel
    var panelGeometry = new THREE.BoxGeometry(8, 2, 0.3);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: COLORS.mobBlack });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y + 2, z + 0.75);
    scene.add(panel);
    state.meshes.push(panel);

    // Bottles
    for (var i = 0; i < 8; i++) {
      var bottleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 12);
      var bottleColor = [COLORS.neonBlue, COLORS.casinoRed, COLORS.gold, COLORS.neonPink][i % 4];
      var bottleMaterial = new THREE.MeshStandardMaterial({ color: bottleColor, transparent: true, opacity: 0.6 });
      var bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
      bottle.position.set(x - 3 + i, y + 1.5, z + 0.5);
      scene.add(bottle);
      state.meshes.push(bottle);
    }
  }

  function createVIPBooth(scene, x, y, z) {
    // Back wall
    var backGeometry = new THREE.BoxGeometry(3, 2.5, 0.2);
    var backMaterial = new THREE.MeshStandardMaterial({ color: COLORS.casinoRed });
    var back = new THREE.Mesh(backGeometry, backMaterial);
    back.position.set(x, y, z);
    scene.add(back);
    state.meshes.push(back);

    // Side divider
    var sideGeometry = new THREE.BoxGeometry(0.2, 2.5, 3);
    var sideMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonPink });
    var side = new THREE.Mesh(sideGeometry, sideMaterial);
    side.position.set(x - 1.6, y, z);
    scene.add(side);
    state.meshes.push(side);

    // Cushioned seat (using cylinder base)
    var seatGeometry = new THREE.CylinderGeometry(1, 1.2, 0.4, 16);
    var seatMaterial = new THREE.MeshStandardMaterial({ color: COLORS.mobBlack });
    var seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(x - 1, 0.4, z);
    scene.add(seat);
    state.meshes.push(seat);
  }

  function createNeonSign(scene, x, y, z, text) {
    var key = x + ',' + y + ',' + z;
    state.neonStates[key] = { intensity: 1, increasing: false };

    // Sign background box
    var bgGeometry = new THREE.BoxGeometry(4, 1.2, 0.2);
    var bgMaterial = new THREE.MeshStandardMaterial({ color: COLORS.mobBlack });
    var bg = new THREE.Mesh(bgGeometry, bgMaterial);
    bg.position.set(x, y, z);
    scene.add(bg);
    state.meshes.push(bg);

    // Neon glow letters (simplified as glowing boxes)
    var letterCount = text.length;
    var spacing = 3.5 / letterCount;
    for (var i = 0; i < letterCount; i++) {
      var letterGeometry = new THREE.BoxGeometry(spacing * 0.7, 0.8, 0.1);
      var letterMaterial = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? COLORS.neonPink : COLORS.neonBlue,
        emissive: i % 2 === 0 ? COLORS.neonPink : COLORS.neonBlue
      });
      var letter = new THREE.Mesh(letterGeometry, letterMaterial);
      letter.position.set(x - 1.5 + i * spacing, y, z + 0.15);
      scene.add(letter);
      state.meshes.push(letter);
    }
  }

  function createVaultDoor(scene, x, y, z) {
    // Door frame
    var frameGeometry = new THREE.BoxGeometry(3, 3.5, 0.3);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z);
    scene.add(frame);
    state.meshes.push(frame);

    // Vault door
    var doorGeometry = new THREE.BoxGeometry(2.8, 3.3, 0.2);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x4A4A4A });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, y, z + 0.2);
    door.userData.isVaultDoor = true;
    door.castShadow = true;
    scene.add(door);
    state.meshes.push(door);

    // Vault dial (cylinder)
    var dialGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16);
    var dialMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
    var dial = new THREE.Mesh(dialGeometry, dialMaterial);
    dial.rotation.z = Math.PI / 2;
    dial.position.set(x, y, z + 0.3);
    scene.add(dial);
    state.meshes.push(dial);

    // Gold bars inside (visible when vault opens)
    for (var i = 0; i < 5; i++) {
      var barGeometry = new THREE.BoxGeometry(0.4, 0.2, 2);
      var barMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
      var bar = new THREE.Mesh(barGeometry, barMaterial);
      bar.position.set(x - 0.8 + i * 0.4, y - 0.5, z - 0.8);
      bar.userData.isGoldBar = true;
      scene.add(bar);
      state.meshes.push(bar);
    }
  }

  function createBossOffice(scene, x, y, z) {
    // Desk
    var deskGeometry = new THREE.BoxGeometry(3, 0.8, 1.5);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x, y, z);
    desk.castShadow = true;
    scene.add(desk);
    state.meshes.push(desk);

    // Desk leg
    var legGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    var legMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x - 1.2, y - 0.4, z - 0.5);
    scene.add(leg);
    state.meshes.push(leg);

    // Money stacks on desk
    for (var i = 0; i < 3; i++) {
      var stackGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
      var stackMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00 });
      var stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.set(x - 1 + i * 1, y + 0.5, z);
      scene.add(stack);
      state.meshes.push(stack);
    }

    // Office chair
    var chairSeatGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 16);
    var chairMaterial = new THREE.MeshStandardMaterial({ color: COLORS.mobBlack });
    var chairSeat = new THREE.Mesh(chairSeatGeometry, chairMaterial);
    chairSeat.position.set(x + 1.5, y + 0.3, z);
    scene.add(chairSeat);
    state.meshes.push(chairSeat);

    // Chair back
    var backGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.2);
    var back = new THREE.Mesh(backGeometry, chairMaterial);
    back.position.set(x + 1.5, y + 0.9, z - 0.3);
    scene.add(back);
    state.meshes.push(back);

    // Safe on wall
    var safeGeometry = new THREE.BoxGeometry(0.8, 1, 0.6);
    var safeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var safe = new THREE.Mesh(safeGeometry, safeMaterial);
    safe.position.set(x, y + 1.5, z + 0.6);
    scene.add(safe);
    state.meshes.push(safe);
  }

  function createColumn(scene, x, y, z) {
    // Column shaft
    var shaftGeometry = new THREE.CylinderGeometry(0.4, 0.4, y, 16);
    var shaftMaterial = new THREE.MeshStandardMaterial({ color: COLORS.brass });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(x, y / 2, z);
    shaft.castShadow = true;
    scene.add(shaft);
    state.meshes.push(shaft);

    // Capital (top)
    var capitalGeometry = new THREE.CylinderGeometry(0.5, 0.4, 0.3, 16);
    var capitalMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
    var capital = new THREE.Mesh(capitalGeometry, capitalMaterial);
    capital.position.set(x, y + 0.15, z);
    scene.add(capital);
    state.meshes.push(capital);

    // Base
    var baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.1, z);
    scene.add(base);
    state.meshes.push(base);
  }

  function createChandelier(scene, x, y, z) {
    // Main sphere (chandelier body)
    var bodyGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    body.castShadow = true;
    scene.add(body);
    state.meshes.push(body);
    state.chandelier = body;

    // Crystal candles (small spheres)
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      var candleX = x + Math.cos(angle) * 2;
      var candleZ = z + Math.sin(angle) * 2;
      var candleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      var candleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.neonPink, emissive: COLORS.neonPink });
      var candle = new THREE.Mesh(candleGeometry, candleMaterial);
      candle.position.set(candleX, y - 0.5, candleZ);
      scene.add(candle);
      state.meshes.push(candle);
    }

    // Hanging chain (LineSegments)
    var chainGeometry = new THREE.BufferGeometry();
    var chainPositions = new Float32Array([
      x, y + 1.5, z,
      x, y + 4, z
    ]);
    chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: COLORS.gold, linewidth: 3 });
    var chain = new THREE.LineSegments(chainGeometry, chainMaterial);
    scene.add(chain);
    state.meshes.push(chain);
  }

  function createSecurityCamera(scene, x, y, z) {
    // Camera body (sphere)
    var bodyGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y, z);
    scene.add(body);
    state.meshes.push(body);

    // Lens
    var lensGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var lensMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    var lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(x + 0.2, y, z);
    scene.add(lens);
    state.meshes.push(lens);

    // Mounting bracket
    var bracketGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.1);
    var bracketMaterial = new THREE.MeshStandardMaterial({ color: COLORS.brass });
    var bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
    bracket.position.set(x, y - 0.3, z);
    scene.add(bracket);
    state.meshes.push(bracket);
  }

  function createStage(scene, x, y, z) {
    // Stage platform
    var platformGeometry = new THREE.BoxGeometry(8, 0.8, 4);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: COLORS.casinoRed });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, y, z);
    platform.receiveShadow = true;
    scene.add(platform);
    state.meshes.push(platform);

    // Stage edge lights
    for (var i = 0; i < 8; i++) {
      var lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.neonBlue,
        emissive: COLORS.neonBlue
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(x - 3.5 + i, y + 0.5, z - 2);
      scene.add(light);
      state.meshes.push(light);
    }
  }

  function createSpotlight(scene, x, y, z) {
    // Spotlight cone body
    var coneGeometry = new THREE.ConeGeometry(1, 3, 16);
    var coneMaterial = new THREE.MeshStandardMaterial({ color: COLORS.gold });
    var cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.set(x, y, z);
    scene.add(cone);
    state.meshes.push(cone);
    state.spotlight = cone;

    // Light source
    var light = new THREE.PointLight(COLORS.gold, 1, 50);
    light.position.set(x, y - 1.5, z);
    scene.add(light);
    state.lights.push(light);
  }

  function createCorridor(scene, x, y, z) {
    // Left wall
    var leftGeometry = new THREE.BoxGeometry(0.5, 4, 8);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var left = new THREE.Mesh(leftGeometry, wallMaterial);
    left.position.set(x - 2.5, y, z);
    scene.add(left);
    state.meshes.push(left);

    // Right wall
    var right = new THREE.Mesh(leftGeometry, wallMaterial);
    right.position.set(x + 2.5, y, z);
    scene.add(right);
    state.meshes.push(right);

    // Ceiling
    var ceilingGeometry = new THREE.BoxGeometry(5, 0.3, 8);
    var ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
    ceiling.position.set(x, y + 2, z);
    scene.add(ceiling);
    state.meshes.push(ceiling);

    // Door frame
    var doorFrameGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.3);
    var doorFrameMaterial = new THREE.MeshStandardMaterial({ color: COLORS.brass });
    var doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(x, y + 0.75, z - 3.5);
    scene.add(doorFrame);
    state.meshes.push(doorFrame);
  }

  function createMoneyPile(scene, x, y, z) {
    // Scattered money coins (cylinders)
    for (var i = 0; i < 20; i++) {
      var offsetX = (Math.random() - 0.5) * 2;
      var offsetZ = (Math.random() - 0.5) * 2;
      var coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16);
      var coinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
      var coin = new THREE.Mesh(coinGeometry, coinMaterial);
      coin.position.set(x + offsetX, y + Math.random() * 0.3, z + offsetZ);
      coin.rotation.x = Math.random() * Math.PI;
      scene.add(coin);
      state.meshes.push(coin);
      state.moneyMeshes.push(coin);
    }
  }

  function createMobEnforcer(scene, x, y, z) {
    // Body (box)
    var bodyGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.3);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.mobBlack });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 0.9, z);
    body.castShadow = true;
    scene.add(body);
    state.meshes.push(body);

    // Head (sphere)
    var headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({ color: 0xDDB892 });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(x, y + 2, z);
    head.castShadow = true;
    scene.add(head);
    state.meshes.push(head);

    // Left arm
    var armGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.2);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0xDDB892 });
    var leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(x - 0.4, y + 1.2, z);
    scene.add(leftArm);
    state.meshes.push(leftArm);

    // Right arm
    var rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(x + 0.4, y + 1.2, z);
    scene.add(rightArm);
    state.meshes.push(rightArm);

    // Legs
    for (var i = 0; i < 2; i++) {
      var legGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
      var legMaterial = new THREE.MeshStandardMaterial({ color: COLORS.mobBlack });
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x + (i === 0 ? -0.15 : 0.15), y + 0.4, z);
      scene.add(leg);
      state.meshes.push(leg);
    }

    state.enforcer = { body: body, head: head, leftArm: leftArm, rightArm: rightArm };
  }

  function update(delta) {
    // Slot machine lights cycling
    for (var key in state.slotMachineStates) {
      var light = state.slotMachineStates[key];
      light.cycle += delta * 3;
      var intensity = Math.sin(light.cycle) * 0.5 + 0.5;
      light.mesh.material.emissiveIntensity = intensity;
    }

    // Neon signs flickering
    for (var neonKey in state.neonStates) {
      var neon = state.neonStates[neonKey];
      if (Math.random() > 0.95) {
        neon.increasing = !neon.increasing;
      }
      neon.intensity += (neon.increasing ? 0.02 : -0.02);
      neon.intensity = Math.max(0.3, Math.min(1, neon.intensity));
    }

    // Chandelier swaying
    if (state.chandelier) {
      state.chandelierRotation += delta * 0.5;
      state.chandelier.position.x = Math.sin(state.chandelierRotation) * 0.3;
      state.chandelier.position.z = Math.cos(state.chandelierRotation * 0.7) * 0.2;
    }

    // Mob enforcer patrolling
    if (state.enforcer) {
      state.enforcerPath += delta * 2;
      var pathX = Math.sin(state.enforcerPath * 0.3) * 15;
      var pathZ = Math.cos(state.enforcerPath * 0.2) * 18;
      state.enforcer.body.position.set(pathX, state.enforcer.body.position.y, pathZ);
      state.enforcer.head.position.set(pathX, state.enforcer.head.position.y, pathZ);
      state.enforcer.leftArm.position.x = pathX - 0.4 + Math.sin(state.enforcerPath * 2) * 0.2;
      state.enforcer.rightArm.position.x = pathX + 0.4 - Math.sin(state.enforcerPath * 2) * 0.2;
    }

    // Spotlight intensity pulse
    if (state.spotlight) {
      state.spotlightIntensity = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
      for (var i = 0; i < state.lights.length; i++) {
        state.lights[i].intensity = state.spotlightIntensity;
      }
    }

    // Money scatter animation when vault is triggered
    for (var m = 0; m < state.moneyMeshes.length; m++) {
      var money = state.moneyMeshes[m];
      money.rotation.z += delta * 3;
      money.position.y += Math.sin(Date.now() * 0.002 + m) * 0.1 * delta;
    }
  }

  function reset() {
    // Remove all meshes
    for (var i = 0; i < state.meshes.length; i++) {
      if (state.meshes[i].parent) {
        state.meshes[i].parent.remove(state.meshes[i]);
      }
    }

    // Remove all lights
    for (var j = 0; j < state.lights.length; j++) {
      if (state.lights[j].parent) {
        state.lights[j].parent.remove(state.lights[j]);
      }
    }

    // Reset state
    state.meshes = [];
    state.lights = [];
    state.slotMachineStates = {};
    state.neonStates = {};
    state.chandelier = null;
    state.chandelierRotation = 0;
    state.enforcer = null;
    state.enforcerPath = 0;
    state.vaultOpen = false;
    state.moneyMeshes = [];
    state.spotlight = null;
    state.spotlightIntensity = 0.5;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
