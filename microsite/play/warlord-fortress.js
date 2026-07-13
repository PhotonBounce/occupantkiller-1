window.WarlordFortress = (function() {
  'use strict';

  // Scene reference
  var scene;
  var camera;

  // Game state
  var militiaCount = 8;
  var peacekeepersCount = 4;
  var aidSecured = 0;
  var aidTotal = 10;

  // Animation state
  var time = 0;
  var keyPressLog = [];
  var lastHPressTime = 0;
  var lastXPressTime = 0;
  var showHUD = true;

  // Game objects storage
  var gameObjects = {
    militia: [],
    peacekeepers: [],
    aidCrates: [],
    technicals: [],
    flags: [],
    drums: [],
    livestock: []
  };

  var hudCanvas;
  var hudTexture;
  var hudMaterial;
  var hudMesh;

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Set scene background to dusk sky
    scene.background = new THREE.Color(0x4a3728);

    // Lighting setup
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 200);
    scene.add(directionalLight);

    // Build fortress elements
    buildMountainGround();
    buildFortressWalls();
    buildWatchtowers();
    buildMainGate();
    buildKeepBuilding();
    buildWarlordMilitia();
    buildUNPeacekeepers();
    buildAidSupplyCrates();
    buildStolenTechnicals();
    buildExecutionPost();
    buildWarlordThrone();
    buildHiddenWeaponCache();
    buildBattleFlags();
    buildBurningDrums();
    buildLivestockPen();
    buildSatelliteDish();

    // Setup HUD
    createHUD();

    // Setup keyboard controls
    document.addEventListener('keydown', handleKeyDown);
  }

  function buildMountainGround() {
    var geometry = new THREE.BoxGeometry(400, 0.3, 400);
    var material = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  function buildFortressWalls() {
    var wallHeight = 8;
    var wallThickness = 3;
    var fortressSize = 80;

    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x7a6d5d });

    // North wall
    var northGeom = new THREE.BoxGeometry(fortressSize + 20, wallHeight, wallThickness);
    var northWall = new THREE.Mesh(northGeom, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -fortressSize / 2 - wallThickness / 2);
    scene.add(northWall);

    // South wall
    var southGeom = new THREE.BoxGeometry(fortressSize + 20, wallHeight, wallThickness);
    var southWall = new THREE.Mesh(southGeom, wallMaterial);
    southWall.position.set(0, wallHeight / 2, fortressSize / 2 + wallThickness / 2);
    scene.add(southWall);

    // East wall
    var eastGeom = new THREE.BoxGeometry(wallThickness, wallHeight, fortressSize);
    var eastWall = new THREE.Mesh(eastGeom, wallMaterial);
    eastWall.position.set(fortressSize / 2 + wallThickness / 2, wallHeight / 2, 0);
    scene.add(eastWall);

    // West wall
    var westGeom = new THREE.BoxGeometry(wallThickness, wallHeight, fortressSize);
    var westWall = new THREE.Mesh(westGeom, wallMaterial);
    westWall.position.set(-fortressSize / 2 - wallThickness / 2, wallHeight / 2, 0);
    scene.add(westWall);
  }

  function buildWatchtowers() {
    var towerRadius = 2;
    var towerHeight = 14;
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5d4d });
    var capMaterial = new THREE.MeshStandardMaterial({ color: 0xc0522d });

    var fortressSize = 80;
    var cornerPositions = [
      { x: fortressSize / 2, z: fortressSize / 2 },
      { x: -fortressSize / 2, z: fortressSize / 2 },
      { x: -fortressSize / 2, z: -fortressSize / 2 }
    ];

    cornerPositions.forEach(function(pos) {
      // Tower body (as tall box)
      var towerGeom = new THREE.BoxGeometry(towerRadius * 4, towerHeight, towerRadius * 4);
      var tower = new THREE.Mesh(towerGeom, towerMaterial);
      tower.position.set(pos.x, towerHeight / 2, pos.z);
      scene.add(tower);

      // Tower cap/roof
      var capGeom = new THREE.BoxGeometry(towerRadius * 4.5, 1.5, towerRadius * 4.5);
      var cap = new THREE.Mesh(capGeom, capMaterial);
      cap.position.set(pos.x, towerHeight + 0.75, pos.z);
      scene.add(cap);
    });
  }

  function buildMainGate() {
    var gateWidth = 6;
    var gateHeight = 5;
    var gateDepth = 2;
    var woodColor = 0x6b4423;
    var metalColor = 0x4a4a4a;

    // Left door
    var leftDoorGeom = new THREE.BoxGeometry(gateWidth / 2, gateHeight, gateDepth);
    var doorMat = new THREE.MeshStandardMaterial({ color: woodColor });
    var leftDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    leftDoor.position.set(-gateWidth / 4, gateHeight / 2, 0);
    scene.add(leftDoor);

    // Right door
    var rightDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    rightDoor.position.set(gateWidth / 4, gateHeight / 2, 0);
    scene.add(rightDoor);

    // Stone archway (top)
    var archGeom = new THREE.BoxGeometry(gateWidth + 4, 2, 2);
    var stoneMat = new THREE.MeshStandardMaterial({ color: 0x7a6d5d });
    var arch = new THREE.Mesh(archGeom, stoneMat);
    arch.position.set(0, gateHeight + 1, 0);
    scene.add(arch);
  }

  function buildKeepBuilding() {
    var keepGeom = new THREE.BoxGeometry(20, 16, 20);
    var keepMaterial = new THREE.MeshStandardMaterial({ color: 0x6b6b6b });
    var keep = new THREE.Mesh(keepGeom, keepMaterial);
    keep.position.set(0, 8, 0);
    scene.add(keep);
  }

  function buildWarlordMilitia() {
    var militiaMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5a3a });

    var positions = [
      { x: -15, z: 15 },
      { x: 15, z: 15 },
      { x: -15, z: -15 },
      { x: 15, z: -15 },
      { x: -25, z: 0 },
      { x: 25, z: 0 },
      { x: 0, z: -25 },
      { x: 0, z: 25 }
    ];

    positions.forEach(function(pos, index) {
      // Body
      var bodyGeom = new THREE.BoxGeometry(0.8, 1.8, 0.4);
      var militia = new THREE.Mesh(bodyGeom, militiaMaterial);
      militia.position.set(pos.x, 1, pos.z);
      militia.castShadow = true;
      scene.add(militia);

      // Head
      var headGeom = new THREE.BoxGeometry(0.6, 0.6, 0.4);
      var headColor = index % 2 === 0 ? 0x3d2817 : 0x2c1810;
      var headMat = new THREE.MeshStandardMaterial({ color: headColor });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(pos.x, 2.2, pos.z);
      scene.add(head);

      // Weapon arm (box)
      var weaponGeom = new THREE.BoxGeometry(0.3, 0.8, 0.2);
      var weaponMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var weapon = new THREE.Mesh(weaponGeom, weaponMat);
      weapon.position.set(pos.x + 0.6, 1.5, pos.z);
      weapon.rotation.z = 0.4;
      scene.add(weapon);

      gameObjects.militia.push(militia);
    });
  }

  function buildUNPeacekeepers() {
    var helmetColor = 0x6db3f2;
    var uniformColor = 0x4a7ba7;

    var positions = [
      { x: -8, z: -30 },
      { x: -2, z: -35 },
      { x: 4, z: -32 },
      { x: 10, z: -28 }
    ];

    positions.forEach(function(pos) {
      // Body
      var bodyGeom = new THREE.BoxGeometry(0.7, 1.8, 0.4);
      var bodyMat = new THREE.MeshStandardMaterial({ color: uniformColor });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 1, pos.z);
      scene.add(body);

      // Helmet
      var helmetGeom = new THREE.BoxGeometry(0.8, 0.7, 0.5);
      var helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor });
      var helmet = new THREE.Mesh(helmetGeom, helmetMat);
      helmet.position.set(pos.x, 2.1, pos.z);
      scene.add(helmet);

      // Rifle
      var rifleGeom = new THREE.BoxGeometry(0.2, 0.9, 0.15);
      var rifleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var rifle = new THREE.Mesh(rifleGeom, rifleMat);
      rifle.position.set(pos.x + 0.5, 1.4, pos.z);
      rifle.rotation.z = 0.3;
      scene.add(rifle);

      gameObjects.peacekeepers.push(body);
    });
  }

  function buildAidSupplyCrates() {
    var crateGeom = new THREE.BoxGeometry(2, 2, 2);
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    var stackPositions = [
      { x: -5, z: 5, count: 2 },
      { x: 5, z: 5, count: 2 },
      { x: -5, z: -5, count: 3 },
      { x: 5, z: -5, count: 3 }
    ];

    var crateIndex = 0;
    stackPositions.forEach(function(stackPos) {
      for (var i = 0; i < stackPos.count; i++) {
        var crate = new THREE.Mesh(crateGeom, crateMaterial);
        crate.position.set(stackPos.x, 1 + (i * 2.5), stackPos.z);

        // Add red cross marking
        var crossGeom = new THREE.BoxGeometry(0.3, 1.2, 0.05);
        var crossMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        var vCross = new THREE.Mesh(crossGeom, crossMat);
        vCross.position.z = 1.05;
        crate.add(vCross);

        var hCross = new THREE.Mesh(crossGeom, crossMat);
        hCross.rotation.z = Math.PI / 2;
        hCross.position.z = 1.05;
        crate.add(hCross);

        scene.add(crate);
        gameObjects.aidCrates.push(crate);
        crateIndex++;
      }
    });
  }

  function buildStolenTechnicals() {
    var technicalPositions = [
      { x: -30, z: 20, rotation: 0 },
      { x: -20, z: 30, rotation: Math.PI / 4 },
      { x: 25, z: -25, rotation: -Math.PI / 3 }
    ];

    technicalPositions.forEach(function(pos) {
      // Truck body
      var bodyGeom = new THREE.BoxGeometry(2, 1.5, 5);
      var bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(pos.x, 1, pos.z);
      body.rotation.y = pos.rotation;
      scene.add(body);

      // Cabin
      var cabinGeom = new THREE.BoxGeometry(2, 1.2, 1.5);
      var cabin = new THREE.Mesh(cabinGeom, bodyMat);
      cabin.position.set(pos.x, 1.2, pos.z - 2.5);
      cabin.rotation.y = pos.rotation;
      scene.add(cabin);

      // Mounted gun (in bed)
      var gunGeom = new THREE.BoxGeometry(0.3, 1, 0.3);
      var gunMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
      var gun = new THREE.Mesh(gunGeom, gunMat);
      gun.position.set(pos.x + 0.8, 1.8, pos.z + 1);
      gun.rotation.y = pos.rotation;
      scene.add(gun);

      gameObjects.technicals.push(body);
    });
  }

  function buildExecutionPost() {
    // Vertical pole
    var poleGeom = new THREE.BoxGeometry(0.3, 8, 0.3);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(-35, 4, 0);
    scene.add(pole);

    // Rope
    var ropeGeom = new THREE.BoxGeometry(2, 0.2, 0.2);
    var ropeMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var rope = new THREE.Mesh(ropeGeom, ropeMat);
    rope.position.set(-35, 7.5, 0);
    scene.add(rope);

    // Dark stain on ground
    var stainGeom = new THREE.BoxGeometry(3, 0.05, 3);
    var stainMat = new THREE.MeshStandardMaterial({ color: 0x1a0000 });
    var stain = new THREE.Mesh(stainGeom, stainMat);
    stain.position.set(-35, 0.05, 0);
    scene.add(stain);
  }

  function buildWarlordThrone() {
    var throneX = 0;
    var throneZ = 0;
    var seatHeight = 6;

    // Seat
    var seatGeom = new THREE.BoxGeometry(2, 0.5, 2);
    var seatMat = new THREE.MeshStandardMaterial({ color: 0x8b1a1a });
    var seat = new THREE.Mesh(seatGeom, seatMat);
    seat.position.set(throneX, seatHeight, throneZ);
    scene.add(seat);

    // Back rest
    var backGeom = new THREE.BoxGeometry(2, 2, 0.3);
    var back = new THREE.Mesh(backGeom, seatMat);
    back.position.set(throneX, seatHeight + 1.5, throneZ + 0.8);
    scene.add(back);

    // Left armrest
    var armGeom = new THREE.BoxGeometry(0.3, 1, 2);
    var arm = new THREE.Mesh(armGeom, seatMat);
    arm.position.set(throneX - 1.2, seatHeight + 0.5, throneZ);
    scene.add(arm);

    // Right armrest
    var armRight = arm.clone();
    armRight.position.set(throneX + 1.2, seatHeight + 0.5, throneZ);
    scene.add(armRight);

    // Warlord figure on throne
    var figureGeom = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var figureMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    var warlord = new THREE.Mesh(figureGeom, figureMat);
    warlord.position.set(throneX, seatHeight + 0.8, throneZ - 0.2);
    scene.add(warlord);
    gameObjects.warlord = warlord;
  }

  function buildHiddenWeaponCache() {
    // Underground cellar (mostly buried box)
    var cellarGeom = new THREE.BoxGeometry(8, 6, 8);
    var cellarMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      emissive: 0x332211,
      emissiveIntensity: 0.4
    });
    var cellar = new THREE.Mesh(cellarGeom, cellarMat);
    cellar.position.set(20, -1, 20);
    scene.add(cellar);

    // Interior glow spheres
    for (var i = 0; i < 3; i++) {
      var glowGeom = new THREE.BoxGeometry(2, 1, 1);
      var glowMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 0.8
      });
      var glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.set(20 - 2 + i * 3, -1, 20);
      scene.add(glow);
    }
  }

  function buildBattleFlags() {
    var flagPolePositions = [
      { x: -40, z: -40, color: 0x1a1a1a },
      { x: 40, z: -40, color: 0xff6600 },
      { x: -40, z: 40, color: 0x6600ff },
      { x: 40, z: 40, color: 0x00aa00 }
    ];

    flagPolePositions.forEach(function(pos) {
      // Pole
      var poleGeom = new THREE.BoxGeometry(0.4, 10, 0.4);
      var poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, 5, pos.z);
      scene.add(pole);

      // Flag (flat box)
      var flagGeom = new THREE.BoxGeometry(3, 2, 0.1);
      var flagMat = new THREE.MeshStandardMaterial({ color: pos.color });
      var flag = new THREE.Mesh(flagGeom, flagMat);
      flag.position.set(pos.x + 2, 8, pos.z);
      flag.userData = { baseRotation: flag.rotation.z };
      scene.add(flag);
      gameObjects.flags.push(flag);
    });
  }

  function buildBurningDrums() {
    var drumPositions = [
      { x: -20, z: 20 },
      { x: -25, z: 25 },
      { x: -15, z: 25 },
      { x: 20, z: 20 },
      { x: 25, z: 25 },
      { x: 15, z: 25 }
    ];

    drumPositions.forEach(function(pos) {
      // Drum cylinder (as tall thin box)
      var drumGeom = new THREE.BoxGeometry(1.2, 2, 1.2);
      var drumMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
      var drum = new THREE.Mesh(drumGeom, drumMat);
      drum.position.set(pos.x, 1, pos.z);
      scene.add(drum);

      // Fire glow (emissive box)
      var fireGeom = new THREE.BoxGeometry(1.5, 2.5, 1.5);
      var fireMat = new THREE.MeshStandardMaterial({
        color: 0xff6600,
        emissive: 0xff6600,
        emissiveIntensity: 0.6
      });
      var fire = new THREE.Mesh(fireGeom, fireMat);
      fire.position.set(pos.x, 1.5, pos.z);
      fire.userData = { baseScale: 1 };
      scene.add(fire);
      gameObjects.drums.push(fire);
    });
  }

  function buildLivestockPen() {
    var penX = -30;
    var penZ = -30;

    // Fence segments
    var fenceGeom = new THREE.BoxGeometry(15, 1.5, 0.3);
    var fenceMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });

    // Front
    var frontFence = new THREE.Mesh(fenceGeom, fenceMat);
    frontFence.position.set(penX, 0.75, penZ - 8);
    scene.add(frontFence);

    // Back
    var backFence = new THREE.Mesh(fenceGeom, fenceMat);
    backFence.position.set(penX, 0.75, penZ + 8);
    scene.add(backFence);

    // Left side
    var leftFence = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 16), fenceMat);
    leftFence.position.set(penX - 7.5, 0.75, penZ);
    scene.add(leftFence);

    // Right side
    var rightFence = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 16), fenceMat);
    rightFence.position.set(penX + 7.5, 0.75, penZ);
    scene.add(rightFence);

    // Animals inside (simple boxes)
    for (var i = 0; i < 4; i++) {
      var animalGeom = new THREE.BoxGeometry(1.5, 1, 2);
      var animalMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47 });
      var animal = new THREE.Mesh(animalGeom, animalMat);
      animal.position.set(penX - 4 + (i % 2) * 4, 0.5, penZ - 2 + Math.floor(i / 2) * 4);
      scene.add(animal);
      gameObjects.livestock.push(animal);
    }
  }

  function buildSatelliteDish() {
    var keepTop = 16;
    var dishX = 8;
    var dishZ = 8;

    // Pole
    var poleGeom = new THREE.BoxGeometry(0.3, 3, 0.3);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
    var pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.set(dishX, keepTop + 1.5, dishZ);
    scene.add(pole);

    // Dish support arm
    var armGeom = new THREE.BoxGeometry(3, 0.3, 0.3);
    var armMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
    var arm = new THREE.Mesh(armGeom, armMat);
    arm.position.set(dishX + 1.5, keepTop + 3, dishZ);
    arm.rotation.z = 0.2;
    scene.add(arm);

    // Dish (flat box)
    var dishGeom = new THREE.BoxGeometry(3, 0.2, 3);
    var dishMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a });
    var dish = new THREE.Mesh(dishGeom, dishMat);
    dish.position.set(dishX + 2.5, keepTop + 2.8, dishZ);
    dish.rotation.z = 0.3;
    scene.add(dish);
  }

  function createHUD() {
    // Create canvas for HUD
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 512;
    hudCanvas.height = 128;

    var ctx = hudCanvas.getContext('2d');
    updateHUDTexture(ctx);

    hudTexture = new THREE.CanvasTexture(hudCanvas);
    hudMaterial = new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true });

    var hudGeom = new THREE.BoxGeometry(5, 1.5, 0.1);
    hudMesh = new THREE.Mesh(hudGeom, hudMaterial);
    hudMesh.position.set(-9, 7, -10);
    scene.add(hudMesh);
  }

  function updateHUDTexture(ctx) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 128);
    ctx.globalAlpha = 0.8;

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('MILITIA REMAINING: ' + militiaCount, 20, 40);
    ctx.fillText('PEACEKEEPERS: ' + peacekeepersCount, 20, 75);
    ctx.fillText('AID SECURED: ' + aidSecured + '/' + aidTotal, 20, 110);
  }

  function handleKeyDown(event) {
    if (event.key === 'h' || event.key === 'H') {
      var now = Date.now();
      if (now - lastHPressTime < 400) {
        lastHPressTime = 0;
      } else {
        lastHPressTime = now;
      }
    }

    if (event.key === 'x' || event.key === 'X') {
      var now = Date.now();
      if (lastHPressTime > 0 && now - lastHPressTime < 400) {
        showHUD = !showHUD;
        if (hudMesh) {
          hudMesh.visible = showHUD;
        }
        lastHPressTime = 0;
      } else {
        lastXPressTime = now;
      }
    }
  }

  function update(delta) {
    time += delta;

    // Update HUD if visible
    if (showHUD && hudCanvas) {
      var ctx = hudCanvas.getContext('2d');
      updateHUDTexture(ctx);
      hudTexture.needsUpdate = true;
    }

    // Animate UN peacekeepers advancing through gate
    gameObjects.peacekeepers.forEach(function(peacekeeper, index) {
      peacekeeper.position.z += delta * 2;
      if (peacekeeper.position.z > 15) {
        peacekeeper.position.z = -35;
      }
    });

    // Animate militia defending (slight movement)
    gameObjects.militia.forEach(function(militia, index) {
      militia.position.x += Math.sin(time * 0.5 + index) * delta * 0.3;
      militia.rotation.y = Math.sin(time * 0.3 + index) * 0.2;
    });

    // Wave flags
    gameObjects.flags.forEach(function(flag, index) {
      flag.rotation.z = Math.sin(time * 2 + index) * 0.3;
    });

    // Flicker burning drums
    gameObjects.drums.forEach(function(drum, index) {
      var flicker = 0.6 + Math.sin(time * 3 + index) * 0.2;
      drum.scale.y = drum.userData.baseScale * flicker;
      drum.material.emissiveIntensity = 0.4 + Math.sin(time * 3.5 + index) * 0.3;
    });

    // Subtle bob for warlord on throne
    if (gameObjects.warlord) {
      gameObjects.warlord.position.y = 6.8 + Math.sin(time * 0.8) * 0.2;
    }

    // Technicals circling
    gameObjects.technicals.forEach(function(technical, index) {
      var radius = 30;
      var angle = time * 0.5 + (index * Math.PI * 2 / 3);
      technical.position.x = Math.cos(angle) * radius;
      technical.position.z = Math.sin(angle) * radius;
      technical.rotation.y = angle;
    });
  }

  function reset() {
    militiaCount = 8;
    peacekeepersCount = 4;
    aidSecured = 0;
    time = 0;

    // Reset positions
    gameObjects.militia.forEach(function(militia) {
      militia.position.y = 1;
    });

    gameObjects.peacekeepers.forEach(function(peacekeeper) {
      peacekeeper.position.z = -35;
    });

    if (hudCanvas) {
      var ctx = hudCanvas.getContext('2d');
      updateHUDTexture(ctx);
      hudTexture.needsUpdate = true;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
