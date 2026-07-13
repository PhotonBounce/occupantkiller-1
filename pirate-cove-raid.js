window.PirateCoveRaid = (function() {
  'use strict';

  var scene, camera;
  var elements = {};
  var animations = {};
  var hudElement = null;
  var hKeyPressed = false;
  var rKeyPressed = false;
  var lastHTime = 0;
  var lastRTime = 0;
  var gameState = {
    compoundBreached: false,
    piratesDown: 0,
    shipSecured: false
  };

  // Color definitions
  var COLORS = {
    BROWN_SAND: 0x9a7a50,
    OCEAN_BLUE: 0x1a3a6a,
    DARK_GRAY: 0x2a2a2a,
    LIGHT_GRAY: 0x808080,
    DARK_ORANGE: 0xff6a00,
    GOLD: 0xffd700,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    RED: 0xff0000
  };

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // Create all scene elements
    createBeachGround();
    createOceanWater();
    createPirateCompound();
    createWatchtowers();
    createCargoShip();
    createSpeedboats();
    createPirates();
    createSealTeam();
    createTreasureCave();
    createRockFormations();
    createBonfire();
    createSmugglersCreates();
    createRopeBridge();
    createSearchFloodlight();
    createAnchorChain();
    createSatelliteDish();
    createSunsetSky();

    // Create HUD overlay
    createHUD();

    // Setup animations
    setupAnimations();

    // Setup keyboard for HUD toggle
    setupKeyboardControls();
  }

  function createBeachGround() {
    var geometry = new THREE.BoxGeometry(400, 0.3, 400);
    var material = new THREE.MeshStandardMaterial({ color: COLORS.BROWN_SAND });
    var ground = new THREE.Mesh(geometry, material);
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    elements.ground = ground;
  }

  function createOceanWater() {
    var geometry = new THREE.BoxGeometry(200, 3, 200);
    var material = new THREE.MeshStandardMaterial({
      color: COLORS.OCEAN_BLUE,
      emissive: 0x0a1a3a
    });
    var water = new THREE.Mesh(geometry, material);
    water.position.set(-150, -1.5, -100);
    water.receiveShadow = true;
    scene.add(water);
    elements.water = water;
  }

  function createPirateCompound() {
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.LIGHT_GRAY,
      roughness: 0.8
    });

    // Compound walls (perimeter)
    var wallGeometry = new THREE.BoxGeometry(30, 4, 1);

    // Front wall
    var frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.set(0, 2, 20);
    frontWall.castShadow = true;
    scene.add(frontWall);

    // Back wall
    var backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, 2, -20);
    backWall.castShadow = true;
    scene.add(backWall);

    // Left wall
    var leftWallGeometry = new THREE.BoxGeometry(1, 4, 40);
    var leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-15, 2, 0);
    leftWall.castShadow = true;
    scene.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.set(15, 2, 0);
    rightWall.castShadow = true;
    scene.add(rightWall);

    // Plank gate
    var gateGeometry = new THREE.BoxGeometry(5, 3, 0.5);
    var gateMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
    var gate = new THREE.Mesh(gateGeometry, gateMaterial);
    gate.position.set(0, 1.5, 20.25);
    gate.castShadow = true;
    scene.add(gate);

    elements.compound = { front: frontWall, back: backWall, left: leftWall, right: rightWall, gate: gate };
  }

  function createWatchtowers() {
    var towerGeometry = new THREE.BoxGeometry(3, 12, 3);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_GRAY });

    // Tower 1 (top-left)
    var tower1 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower1.position.set(-14, 6, 18);
    tower1.castShadow = true;
    scene.add(tower1);

    // Tower 2 (top-right)
    var tower2 = new THREE.Mesh(towerGeometry, towerMaterial);
    tower2.position.set(14, 6, 18);
    tower2.castShadow = true;
    scene.add(tower2);

    // Guard platforms
    var platformGeometry = new THREE.BoxGeometry(5, 0.5, 5);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });

    var platform1 = new THREE.Mesh(platformGeometry, platformMaterial);
    platform1.position.set(-14, 12.5, 18);
    scene.add(platform1);

    var platform2 = new THREE.Mesh(platformGeometry, platformMaterial);
    platform2.position.set(14, 12.5, 18);
    scene.add(platform2);

    elements.watchtowers = [tower1, tower2, platform1, platform2];
  }

  function createCargoShip() {
    var shipGroup = new THREE.Group();

    // Hull
    var hullGeometry = new THREE.BoxGeometry(60, 10, 20);
    var hullMaterial = new THREE.MeshStandardMaterial({ color: COLORS.DARK_GRAY });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 5;
    hull.castShadow = true;
    shipGroup.add(hull);

    // Bridge
    var bridgeGeometry = new THREE.BoxGeometry(15, 8, 10);
    var bridgeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_GRAY });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(-15, 13, 0);
    bridge.castShadow = true;
    shipGroup.add(bridge);

    // Crane arm (left)
    var craneArmGeometry = new THREE.BoxGeometry(25, 0.8, 0.8);
    var crameMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_GRAY });
    var craneArm1 = new THREE.Mesh(craneArmGeometry, crameMaterial);
    craneArm1.position.set(-5, 18, -5);
    craneArm1.rotation.z = 0.2;
    craneArm1.castShadow = true;
    shipGroup.add(craneArm1);

    // Crane arm (right)
    var craneArm2 = new THREE.Mesh(craneArmGeometry, crameMaterial);
    craneArm2.position.set(5, 18, 5);
    craneArm2.rotation.z = -0.2;
    craneArm2.castShadow = true;
    shipGroup.add(craneArm2);

    shipGroup.position.set(-120, 0, -80);
    scene.add(shipGroup);
    elements.ship = shipGroup;
  }

  function createSpeedboats() {
    var boats = [];
    var positions = [
      { x: -80, z: -50 },
      { x: -60, z: -45 },
      { x: 50, z: 10 },
      { x: 70, z: 5 }
    ];

    positions.forEach(function(pos, idx) {
      var boatGroup = new THREE.Group();

      // Hull
      var hullGeometry = new THREE.BoxGeometry(8, 1.5, 3);
      var hullMaterial = new THREE.MeshStandardMaterial({ color: idx < 2 ? COLORS.LIGHT_GRAY : 0xcccccc });
      var hull = new THREE.Mesh(hullGeometry, hullMaterial);
      hull.castShadow = true;
      boatGroup.add(hull);

      // Outboard motor
      var motorGeometry = new THREE.BoxGeometry(1, 2, 1);
      var motorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.DARK_GRAY });
      var motor = new THREE.Mesh(motorGeometry, motorMaterial);
      motor.position.set(3, 0, 1.5);
      motor.castShadow = true;
      boatGroup.add(motor);

      boatGroup.position.set(pos.x, 0.75, pos.z);
      scene.add(boatGroup);
      boats.push(boatGroup);
    });

    elements.boats = boats;
  }

  function createPirates() {
    var pirates = [];
    var positions = [
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: 0, z: 8 },
      { x: -8, z: -5 },
      { x: 8, z: -5 },
      { x: 0, z: -10 },
      { x: -10, z: 5 },
      { x: 10, z: 5 }
    ];

    positions.forEach(function(pos) {
      var pirateGroup = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.6, 2, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a2a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      pirateGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.5);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a3a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.4;
      head.castShadow = true;
      pirateGroup.add(head);

      // Weapon (rifle shape)
      var weaponGeometry = new THREE.BoxGeometry(0.2, 0.15, 1.5);
      var weaponMaterial = new THREE.MeshStandardMaterial({ color: COLORS.BLACK });
      var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(0.3, 0.5, 0);
      weapon.rotation.z = 0.3;
      weapon.castShadow = true;
      pirateGroup.add(weapon);

      pirateGroup.position.set(pos.x, 1, pos.z);
      scene.add(pirateGroup);
      pirates.push(pirateGroup);
    });

    elements.pirates = pirates;
  }

  function createSealTeam() {
    var seals = [];
    var positions = [
      { x: 80, z: 50 },
      { x: 85, z: 45 },
      { x: 75, z: 55 },
      { x: 90, z: 48 },
      { x: 70, z: 52 }
    ];

    positions.forEach(function(pos) {
      var sealGroup = new THREE.Group();

      // Body (wetsuit)
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.8, 0.35);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: COLORS.BLACK });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;
      sealGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.45, 0.5, 0.45);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.2;
      head.castShadow = true;
      sealGroup.add(head);

      // Rifle
      var rifleGeometry = new THREE.BoxGeometry(0.15, 0.12, 1.2);
      var rifleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.DARK_GRAY });
      var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
      rifle.position.set(0.2, 0.4, 0);
      rifle.rotation.z = 0.25;
      rifle.castShadow = true;
      sealGroup.add(rifle);

      sealGroup.position.set(pos.x, 0.9, pos.z);
      scene.add(sealGroup);
      seals.push(sealGroup);
    });

    elements.seals = seals;
  }

  function createTreasureCave() {
    var caveGroup = new THREE.Group();

    // Cave entrance overhang (dark rock box)
    var entranceGeometry = new THREE.BoxGeometry(15, 8, 3);
    var entranceMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9
    });
    var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
    entrance.position.set(-80, 4, 30);
    entrance.castShadow = true;
    caveGroup.add(entrance);

    // Interior emissive gold light
    var interiorGeometry = new THREE.BoxGeometry(12, 6, 2);
    var interiorMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.GOLD,
      emissive: COLORS.GOLD,
      emissiveIntensity: 0.6
    });
    var interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
    interior.position.set(-80, 3, 31);
    caveGroup.add(interior);

    scene.add(caveGroup);
    elements.cave = caveGroup;
  }

  function createRockFormations() {
    var rocks = [];
    var positions = [
      { x: -100, z: 15 },
      { x: -70, z: 45 },
      { x: 30, z: 35 },
      { x: 60, z: 25 },
      { x: 20, z: -30 },
      { x: -40, z: -20 }
    ];

    positions.forEach(function(pos) {
      var rockGroup = new THREE.Group();

      // Create irregular cluster of boxes
      var baseGeometry = new THREE.BoxGeometry(12, 15, 10);
      var rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.95
      });
      var base = new THREE.Mesh(baseGeometry, rockMaterial);
      base.castShadow = true;
      base.receiveShadow = true;
      rockGroup.add(base);

      // Top outcrop
      var topGeometry = new THREE.BoxGeometry(8, 6, 7);
      var top = new THREE.Mesh(topGeometry, rockMaterial);
      top.position.y = 10;
      top.castShadow = true;
      rockGroup.add(top);

      rockGroup.position.set(pos.x, 7.5, pos.z);
      scene.add(rockGroup);
      rocks.push(rockGroup);
    });

    elements.rocks = rocks;
  }

  function createBonfire() {
    var bonfireGroup = new THREE.Group();

    // Base (logs)
    var baseGeometry = new THREE.BoxGeometry(4, 0.5, 4);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x3a1a0a });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    bonfireGroup.add(base);

    // Fire sphere (emissive orange)
    var fireGeometry = new THREE.SphereGeometry(2.5, 8, 8);
    var fireMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6a1a,
      emissive: 0xff6a1a,
      emissiveIntensity: 0.8
    });
    var fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.y = 3;
    fire.castShadow = true;
    bonfireGroup.add(fire);

    bonfireGroup.position.set(60, 0, 60);
    scene.add(bonfireGroup);
    elements.bonfire = { group: bonfireGroup, fire: fire };
  }

  function createSmugglersCreates() {
    var crates = [];
    var baseX = -75;
    var baseZ = 28;

    for (var i = 0; i < 8; i++) {
      var crateGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      var crateMaterial = new THREE.MeshStandardMaterial({
        color: 0x6a5a4a
      });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);

      var row = Math.floor(i / 4);
      var col = i % 4;
      crate.position.set(baseX + col * 3, row * 2.5 + 1.25, baseZ);
      crate.castShadow = true;
      scene.add(crate);
      crates.push(crate);

      // Add some open crates (skip rendering lid on some)
      if (i > 4) {
        var lidGeometry = new THREE.BoxGeometry(2.5, 0.3, 2.5);
        var lidMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
        var lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.copy(crate.position);
        lid.position.y += 1.5;
        scene.add(lid);
      }
    }

    elements.crates = crates;
  }

  function createRopeBridge() {
    var bridgeGroup = new THREE.Group();

    // Horizontal rope segments
    for (var i = 0; i < 8; i++) {
      var plankGeometry = new THREE.BoxGeometry(12, 0.3, 0.8);
      var plankMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
      var plank = new THREE.Mesh(plankGeometry, plankMaterial);
      plank.position.y = i * 0.5;
      plank.castShadow = true;
      bridgeGroup.add(plank);

      // Vertical rope posts
      var postGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
      var postMaterial = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });

      var postLeft = new THREE.Mesh(postGeometry, postMaterial);
      postLeft.position.set(-6, i * 0.5 + 0.25, 0);
      postLeft.castShadow = true;
      bridgeGroup.add(postLeft);

      var postRight = new THREE.Mesh(postGeometry, postMaterial);
      postRight.position.set(6, i * 0.5 + 0.25, 0);
      postRight.castShadow = true;
      bridgeGroup.add(postRight);
    }

    bridgeGroup.position.set(-50, 8, -45);
    scene.add(bridgeGroup);
    elements.bridge = bridgeGroup;
  }

  function createSearchFloodlight() {
    var lightGroup = new THREE.Group();

    // Pole
    var poleGeometry = new THREE.BoxGeometry(0.5, 18, 0.5);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_GRAY });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 9;
    pole.castShadow = true;
    lightGroup.add(pole);

    // Spotlight cone (emissive)
    var lightGeometry = new THREE.SphereGeometry(2, 8, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.WHITE,
      emissive: 0xcccccc,
      emissiveIntensity: 0.9
    });
    var light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 17;
    light.castShadow = true;
    lightGroup.add(light);

    lightGroup.position.set(-120, 0, 40);
    scene.add(lightGroup);
    elements.floodlight = { group: lightGroup, light: light };
  }

  function createAnchorChain() {
    var chainGroup = new THREE.Group();

    // Chain links descending from ship
    for (var i = 0; i < 12; i++) {
      var linkGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
      var linkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
      var link = new THREE.Mesh(linkGeometry, linkMaterial);
      link.position.set(0, -i * 1.2, 0);
      link.castShadow = true;
      chainGroup.add(link);
    }

    chainGroup.position.set(-120, 5, -80);
    scene.add(chainGroup);
    elements.anchor = chainGroup;
  }

  function createSatelliteDish() {
    var dishGroup = new THREE.Group();

    // Pole
    var poleGeometry = new THREE.BoxGeometry(0.4, 6, 0.4);
    var poleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_GRAY });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 3;
    pole.castShadow = true;
    dishGroup.add(pole);

    // Dish (curved box approximation)
    var dishGeometry = new THREE.BoxGeometry(5, 0.3, 4);
    var dishMaterial = new THREE.MeshStandardMaterial({ color: COLORS.LIGHT_GRAY });
    var dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(3, 6, 0);
    dish.rotation.z = 0.3;
    dish.castShadow = true;
    dishGroup.add(dish);

    dishGroup.position.set(14, 3, -18);
    scene.add(dishGroup);
    elements.satellite = dishGroup;
  }

  function createSunsetSky() {
    var skyGeometry = new THREE.BoxGeometry(600, 300, 600);
    var skyMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.DARK_ORANGE,
      emissive: COLORS.DARK_ORANGE,
      emissiveIntensity: 0.5,
      side: THREE.BackSide
    });
    var sky = new THREE.Mesh(skyGeometry, skyMaterial);
    sky.position.y = 100;
    scene.add(sky);
    elements.sky = sky;
  }

  function createHUD() {
    var hudContainer = document.createElement('div');
    hudContainer.id = 'pirate-cove-hud';
    hudContainer.style.position = 'absolute';
    hudContainer.style.top = '20px';
    hudContainer.style.left = '20px';
    hudContainer.style.color = '#00ff00';
    hudContainer.style.fontFamily = 'monospace';
    hudContainer.style.fontSize = '14px';
    hudContainer.style.textShadow = '0 0 10px #00ff00';
    hudContainer.style.zIndex = '100';
    hudContainer.style.userSelect = 'none';

    hudContainer.innerHTML = 'COMPOUND BREACH: NO\n' +
                            'PIRATES DOWN: 0/8\n' +
                            'SHIP SECURED: NO';

    document.body.appendChild(hudContainer);
    hudElement = hudContainer;
  }

  function setupKeyboardControls() {
    document.addEventListener('keydown', function(event) {
      if (event.key.toLowerCase() === 'h') {
        var now = Date.now();
        if (now - lastHTime < 400) {
          hKeyPressed = true;
        }
        lastHTime = now;
      }

      if (event.key.toLowerCase() === 'r') {
        var now = Date.now();
        if (hKeyPressed && now - lastHTime < 400) {
          // H+R pressed within 400ms
          toggleHUD();
          hKeyPressed = false;
        }
        lastRTime = now;
      }
    });

    document.addEventListener('keyup', function(event) {
      if (event.key.toLowerCase() === 'h') {
        setTimeout(function() {
          hKeyPressed = false;
        }, 400);
      }
    });
  }

  function toggleHUD() {
    if (hudElement) {
      hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
    }
  }

  function setupAnimations() {
    // Initialize animation state
    animations.time = 0;
    animations.boatOscillation = 0;
    animations.fireFlicker = 0;
    animations.searchlightAngle = 0;
  }

  function update(delta) {
    animations.time += delta;

    // Pirate boats bobbing animation
    if (elements.boats) {
      elements.boats.forEach(function(boat, idx) {
        var originalY = 0.75;
        boat.position.y = originalY + Math.sin(animations.time * 1.5 + idx) * 0.3;
      });
    }

    // Bonfire flickering
    if (elements.bonfire && elements.bonfire.fire) {
      var flicker = 0.6 + Math.sin(animations.time * 4) * 0.2;
      elements.bonfire.fire.material.emissiveIntensity = flicker;

      // Scale flicker
      var scale = 1 + Math.sin(animations.time * 3.5) * 0.1;
      elements.bonfire.fire.scale.setScalar(scale);
    }

    // Searchlight sweeping
    if (elements.floodlight && elements.floodlight.group) {
      var angle = Math.sin(animations.time * 0.8) * Math.PI * 0.4;
      elements.floodlight.group.rotation.y = angle;
    }

    // SEAL team advancing
    if (elements.seals) {
      elements.seals.forEach(function(seal, idx) {
        var advanceDistance = Math.min(animations.time * 2, 40);
        seal.position.x = 80 - advanceDistance + Math.sin(animations.time + idx) * 0.5;
      });
    }

    // Pirates patrolling
    if (elements.pirates) {
      elements.pirates.forEach(function(pirate, idx) {
        pirate.rotation.y = Math.sin(animations.time * 0.6 + idx) * 0.3;
      });
    }

    // Cargo ship gentle rocking
    if (elements.ship) {
      var rockAmount = Math.sin(animations.time * 0.5) * 0.2;
      elements.ship.rotation.z = rockAmount;
      elements.ship.position.y = Math.sin(animations.time * 0.4) * 0.1;
    }

    // Update HUD with simulated state
    updateHUD();
  }

  function updateHUD() {
    if (hudElement) {
      // Simulate state changes based on time
      var progressTowardObjectives = (animations.time / 120) % 1;

      gameState.piratesDown = Math.floor(progressTowardObjectives * 8);

      if (animations.time > 30) {
        gameState.compoundBreached = true;
      }

      if (animations.time > 60) {
        gameState.shipSecured = true;
      }

      hudElement.innerHTML = 'COMPOUND BREACH: ' + (gameState.compoundBreached ? 'YES' : 'NO') + '\n' +
                            'PIRATES DOWN: ' + gameState.piratesDown + '/8\n' +
                            'SHIP SECURED: ' + (gameState.shipSecured ? 'YES' : 'NO');
    }
  }

  function reset() {
    // Reset game state
    gameState.compoundBreached = false;
    gameState.piratesDown = 0;
    gameState.shipSecured = false;
    animations.time = 0;

    // Reset positions
    if (elements.seals) {
      elements.seals.forEach(function(seal) {
        seal.position.set(80, 0.9, 50 + Math.random() * 10);
      });
    }

    if (elements.boats) {
      var positions = [
        { x: -80, z: -50 },
        { x: -60, z: -45 },
        { x: 50, z: 10 },
        { x: 70, z: 5 }
      ];
      elements.boats.forEach(function(boat, idx) {
        boat.position.set(positions[idx].x, 0.75, positions[idx].z);
      });
    }

    // Reset HUD
    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
