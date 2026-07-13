window.SalvageBarge = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var objects = [];
  var lights = [];

  // Game state
  var equipmentRecovered = 0;
  var salvagersNeutralized = 0;
  var bargeSecure = false;
  var isActive = false;

  // Animation state
  var craneRotation = 0;
  var craneBoomHeight = 0;
  var exhaustPulseTime = 0;
  var torchFlickerTime = 0;
  var bargeRockTime = 0;
  var chainSwayTime = 0;
  var navigationBlinkTime = 0;

  // Keybind tracking
  var lastSKeyTime = 0;
  var keybindTimout = 400;

  // HUD tracking
  var hudElement = null;

  function init(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    objects = [];
    lights = [];
    equipmentRecovered = 0;
    salvagersNeutralized = 0;
    bargeSecure = false;
    isActive = false;
    craneRotation = 0;
    craneBoomHeight = 0;
    exhaustPulseTime = 0;
    torchFlickerTime = 0;
    bargeRockTime = 0;
    chainSwayTime = 0;
    navigationBlinkTime = 0;

    createEnvironment();
    createBarge();
    createCrane();
    createExhaustStack();
    createWheelhouse();
    createVehicleStorage();
    createStrippedTank();
    createPartsCluster();
    createTorchStation();
    createCargo();
    createRiver();
    createAnchorChain();
    createLiferaft();
    createMooringRope();
    createNavigationTower();
    createFuelDrums();
    createGangway();
    createRiverBanks();
    createEnemies();
    setupLighting();
    setupHUD();
    setupKeybinds();
  }

  function createEnvironment() {
    // River mist fog
    scene.fog = new THREE.Fog(0x8b8b7a, 50, 300);
    scene.background = new THREE.Color(0x6b7280);
  }

  function createBarge() {
    // Main barge hull - wide, low, flat
    var hullGeom = new THREE.BoxGeometry(80, 8, 40);
    var hullMat = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      metalness: 0.5,
      roughness: 0.8
    });
    var hull = new THREE.Mesh(hullGeom, hullMat);
    hull.position.set(0, -2, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    hull.name = 'barge_hull';
    scene.add(hull);
    objects.push(hull);

    // Deck plating - rust texture approximation
    var deckGeom = new THREE.BoxGeometry(78, 0.5, 38);
    var deckMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.4,
      roughness: 0.9
    });
    var deck = new THREE.Mesh(deckGeom, deckMat);
    deck.position.set(0, 3.5, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    deck.name = 'deck';
    scene.add(deck);
    objects.push(deck);
  }

  function createCrane() {
    // Crane base post
    var baseGeom = new THREE.CylinderGeometry(2, 2.5, 15, 12);
    var baseMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      metalness: 0.6,
      roughness: 0.7
    });
    var base = new THREE.Mesh(baseGeom, baseMat);
    base.position.set(-20, 8, -5);
    base.castShadow = true;
    base.receiveShadow = true;
    base.name = 'crane_base';
    scene.add(base);
    objects.push(base);

    // Crane boom - long box arm (angled)
    var boomGeom = new THREE.BoxGeometry(50, 2, 2);
    var boomMat = new THREE.MeshStandardMaterial({
      color: 0x3d3d3d,
      metalness: 0.7,
      roughness: 0.6
    });
    var boom = new THREE.Mesh(boomGeom, boomMat);
    boom.position.set(-20, 18, -5);
    boom.rotation.z = 0.3;
    boom.castShadow = true;
    boom.receiveShadow = true;
    boom.name = 'crane_boom';
    scene.add(boom);
    objects.push(boom);

    // Cable cylinder
    var cableGeom = new THREE.CylinderGeometry(0.3, 0.3, 25, 8);
    var cableMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.4
    });
    var cable = new THREE.Mesh(cableGeom, cableMat);
    cable.position.set(-5, 10, -5);
    cable.castShadow = true;
    cable.receiveShadow = true;
    cable.name = 'crane_cable';
    scene.add(cable);
    objects.push(cable);

    // Pulley block at end of boom
    var pulleyGeom = new THREE.BoxGeometry(3, 3, 2);
    var pulleyMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      metalness: 0.6,
      roughness: 0.5
    });
    var pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
    pulley.position.set(15, 15, -5);
    pulley.castShadow = true;
    pulley.receiveShadow = true;
    pulley.name = 'crane_pulley';
    scene.add(pulley);
    objects.push(pulley);
  }

  function createExhaustStack() {
    // Exhaust smokestack - tall cylinder
    var stackGeom = new THREE.CylinderGeometry(1.5, 1.8, 20, 12);
    var stackMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.5,
      roughness: 0.8
    });
    var stack = new THREE.Mesh(stackGeom, stackMat);
    stack.position.set(15, 12, 10);
    stack.castShadow = true;
    stack.receiveShadow = true;
    stack.name = 'exhaust_stack';
    scene.add(stack);
    objects.push(stack);

    // Exhaust puff smoke indicator (sphere)
    var smokeGeom = new THREE.SphereGeometry(2, 8, 8);
    var smokeMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.4,
      metalness: 0,
      roughness: 1
    });
    var smoke = new THREE.Mesh(smokeGeom, smokeMat);
    smoke.position.set(15, 25, 10);
    smoke.scale.set(1, 0.8, 1);
    smoke.name = 'exhaust_puff';
    scene.add(smoke);
    objects.push(smoke);
  }

  function createWheelhouse() {
    // Wheelhouse/pilot cabin - box structure
    var wheelGeom = new THREE.BoxGeometry(12, 8, 10);
    var wheelMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a2a,
      metalness: 0.3,
      roughness: 0.9
    });
    var wheelhouse = new THREE.Mesh(wheelGeom, wheelMat);
    wheelhouse.position.set(20, 8, 8);
    wheelhouse.castShadow = true;
    wheelhouse.receiveShadow = true;
    wheelhouse.name = 'wheelhouse';
    scene.add(wheelhouse);
    objects.push(wheelhouse);

    // Cabin roof
    var roofGeom = new THREE.BoxGeometry(13, 1, 11);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x2c3a1c,
      metalness: 0.4,
      roughness: 0.8
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(20, 12.5, 8);
    roof.castShadow = true;
    roof.receiveShadow = true;
    roof.name = 'cabin_roof';
    scene.add(roof);
    objects.push(roof);
  }

  function createVehicleStorage() {
    // Flat vehicle storage platform
    var storageGeom = new THREE.BoxGeometry(50, 1, 20);
    var storageMat = new THREE.MeshStandardMaterial({
      color: 0x5a5a4a,
      metalness: 0.4,
      roughness: 0.9
    });
    var storage = new THREE.Mesh(storageGeom, storageMat);
    storage.position.set(-10, 4.5, -15);
    storage.castShadow = true;
    storage.receiveShadow = true;
    storage.name = 'vehicle_storage';
    scene.add(storage);
    objects.push(storage);

    // Vehicle outline markers (small boxes for tracked vehicles)
    var vehiclePos = [
      [-25, 5, -18],
      [-10, 5, -20],
      [5, 5, -16]
    ];
    for (var i = 0; i < vehiclePos.length; i++) {
      var vGeo = new THREE.BoxGeometry(8, 0.5, 6);
      var vMat = new THREE.MeshStandardMaterial({
        color: 0x4a7a2a,
        metalness: 0.3,
        roughness: 0.7
      });
      var vehicle = new THREE.Mesh(vGeo, vMat);
      vehicle.position.set(vehiclePos[i][0], vehiclePos[i][1], vehiclePos[i][2]);
      vehicle.castShadow = true;
      vehicle.receiveShadow = true;
      vehicle.name = 'vehicle_outline_' + i;
      scene.add(vehicle);
      objects.push(vehicle);
    }
  }

  function createStrippedTank() {
    // Military tank being stripped - box hull
    var tankGeom = new THREE.BoxGeometry(12, 6, 20);
    var tankMat = new THREE.MeshStandardMaterial({
      color: 0x5a6a3a,
      metalness: 0.4,
      roughness: 0.8
    });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(35, 4, -5);
    tank.castShadow = true;
    tank.receiveShadow = true;
    tank.name = 'stripped_tank';
    scene.add(tank);
    objects.push(tank);

    // Missing turret indicator (empty space)
    var turretPlateGeom = new THREE.BoxGeometry(8, 0.5, 8);
    var turretPlateMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a1a,
      metalness: 0.3,
      roughness: 0.9
    });
    var turretPlate = new THREE.Mesh(turretPlateGeom, turretPlateMat);
    turretPlate.position.set(35, 7, -5);
    turretPlate.castShadow = true;
    turretPlate.receiveShadow = true;
    turretPlate.name = 'turret_platform';
    scene.add(turretPlate);
    objects.push(turretPlate);
  }

  function createPartsCluster() {
    // Irregular cluster of stripped vehicle parts
    var partsPos = [
      [-35, 4, -5],
      [-32, 5, 0],
      [-37, 4.5, 3],
      [-30, 6, 2],
      [-35, 5, -8]
    ];

    for (var i = 0; i < partsPos.length; i++) {
      var sizeX = 2 + Math.random() * 3;
      var sizeY = 1 + Math.random() * 2;
      var sizeZ = 2 + Math.random() * 3;
      var partGeom = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
      var partMat = new THREE.MeshStandardMaterial({
        color: 0x6a5a3a,
        metalness: 0.5,
        roughness: 0.7
      });
      var part = new THREE.Mesh(partGeom, partMat);
      part.position.set(partsPos[i][0], partsPos[i][1], partsPos[i][2]);
      part.rotation.set(
        Math.random() * 0.3,
        Math.random() * Math.PI * 2,
        Math.random() * 0.3
      );
      part.castShadow = true;
      part.receiveShadow = true;
      part.name = 'part_cluster_' + i;
      scene.add(part);
      objects.push(part);
    }
  }

  function createTorchStation() {
    // Cutting torch station with gas tank
    var tankGeom = new THREE.CylinderGeometry(1.2, 1.2, 4, 10);
    var tankMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a5a,
      metalness: 0.6,
      roughness: 0.6
    });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(-15, 5.5, 15);
    tank.castShadow = true;
    tank.receiveShadow = true;
    tank.name = 'torch_tank';
    scene.add(tank);
    objects.push(tank);

    // Torch flame sphere cluster
    var flamePositions = [
      [-15, 8, 15],
      [-14.5, 9, 15],
      [-15.5, 9, 15],
      [-15, 9.5, 14.5]
    ];

    for (var i = 0; i < flamePositions.length; i++) {
      var flameGeom = new THREE.SphereGeometry(0.5, 6, 6);
      var flameMat = new THREE.MeshStandardMaterial({
        color: 0xff8a00,
        emissive: 0xff4500,
        metalness: 0,
        roughness: 1,
        transparent: true,
        opacity: 0.7
      });
      var flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(flamePositions[i][0], flamePositions[i][1], flamePositions[i][2]);
      flame.name = 'spark_' + i;
      scene.add(flame);
      objects.push(flame);
    }
  }

  function createCargo() {
    // Cargo winch - cylinder drum
    var drumGeom = new THREE.CylinderGeometry(2.5, 2.5, 5, 12);
    var drumMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      metalness: 0.6,
      roughness: 0.7
    });
    var drum = new THREE.Mesh(drumGeom, drumMat);
    drum.position.set(5, 5, 10);
    drum.rotation.z = Math.PI / 2.5;
    drum.castShadow = true;
    drum.receiveShadow = true;
    drum.name = 'cargo_winch';
    scene.add(drum);
    objects.push(drum);
  }

  function createRiver() {
    // River water surrounding - flat dark box extending out
    var riverGeom = new THREE.BoxGeometry(200, 2, 150);
    var riverMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a4a,
      metalness: 0.3,
      roughness: 0.8
    });
    var river = new THREE.Mesh(riverGeom, riverMat);
    river.position.set(0, -12, 20);
    river.receiveShadow = true;
    river.name = 'river_water';
    scene.add(river);
    objects.push(river);
  }

  function createAnchorChain() {
    // Anchor chain as LineSegments (box links)
    var chainPoints = [];
    var chainX = 40;
    for (var i = 0; i < 8; i++) {
      chainPoints.push(new THREE.Vector3(chainX, 0 - i * 1.5, 0));
    }

    var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
    var chainMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 3 });
    var chain = new THREE.LineSegments(chainGeom, chainMat);
    chain.name = 'anchor_chain';
    scene.add(chain);
    objects.push(chain);

    // Chain link boxes for visual emphasis
    for (var i = 0; i < 6; i++) {
      var linkGeom = new THREE.BoxGeometry(1.2, 1, 0.8);
      var linkMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.7,
        roughness: 0.6
      });
      var link = new THREE.Mesh(linkGeom, linkMat);
      link.position.set(chainX, -i * 1.5 - 1, 0);
      link.castShadow = true;
      link.receiveShadow = true;
      link.name = 'chain_link_' + i;
      scene.add(link);
      objects.push(link);
    }
  }

  function createLiferaft() {
    // Liferaft rack - orange box
    var raftGeom = new THREE.BoxGeometry(8, 3, 5);
    var raftMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      metalness: 0.3,
      roughness: 0.8
    });
    var raft = new THREE.Mesh(raftGeom, raftMat);
    raft.position.set(-35, 6, 15);
    raft.castShadow = true;
    raft.receiveShadow = true;
    raft.name = 'liferaft_rack';
    scene.add(raft);
    objects.push(raft);
  }

  function createMooringRope() {
    // Mooring rope as LineSegments
    var ropePoints = [
      new THREE.Vector3(30, 2, 20),
      new THREE.Vector3(40, -8, 25)
    ];

    var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
    var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b6f47, linewidth: 4 });
    var rope = new THREE.LineSegments(ropeGeom, ropeMat);
    rope.name = 'mooring_rope';
    scene.add(rope);
    objects.push(rope);

    // Second rope
    var ropePoints2 = [
      new THREE.Vector3(-30, 2, -20),
      new THREE.Vector3(-45, -8, -28)
    ];

    var ropeGeom2 = new THREE.BufferGeometry().setFromPoints(ropePoints2);
    var rope2 = new THREE.LineSegments(ropeGeom2, ropeMat);
    rope2.name = 'mooring_rope_2';
    scene.add(rope2);
    objects.push(rope2);
  }

  function createNavigationTower() {
    // Navigation light tower - tall thin cylinder
    var towerGeom = new THREE.CylinderGeometry(0.8, 1, 18, 8);
    var towerMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      metalness: 0.5,
      roughness: 0.7
    });
    var tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(25, 15, -12);
    tower.castShadow = true;
    tower.receiveShadow = true;
    tower.name = 'navigation_tower';
    scene.add(tower);
    objects.push(tower);

    // Navigation light sphere at top
    var lightGeom = new THREE.SphereGeometry(0.6, 8, 8);
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      metalness: 0.2,
      roughness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    var navLight = new THREE.Mesh(lightGeom, lightMat);
    navLight.position.set(25, 25, -12);
    navLight.name = 'nav_light';
    scene.add(navLight);
    objects.push(navLight);
  }

  function createFuelDrums() {
    // Fuel drum cluster - cylinder barrels
    var drumPositions = [
      [-5, 5, -28],
      [0, 5, -28],
      [-2.5, 5, -32],
      [2.5, 5, -32],
      [-5, 8, -28]
    ];

    for (var i = 0; i < drumPositions.length; i++) {
      var drumGeom = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
      var drumMat = new THREE.MeshStandardMaterial({
        color: 0xcc3300,
        metalness: 0.5,
        roughness: 0.7
      });
      var drum = new THREE.Mesh(drumGeom, drumMat);
      drum.position.set(drumPositions[i][0], drumPositions[i][1], drumPositions[i][2]);
      drum.castShadow = true;
      drum.receiveShadow = true;
      drum.name = 'fuel_drum_' + i;
      scene.add(drum);
      objects.push(drum);
    }
  }

  function createGangway() {
    // Gangway ramp - angled box
    var rampGeom = new THREE.BoxGeometry(6, 1, 20);
    var rampMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      metalness: 0.4,
      roughness: 0.8
    });
    var ramp = new THREE.Mesh(rampGeom, rampMat);
    ramp.position.set(-45, 2, 0);
    ramp.rotation.z = 0.25;
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    ramp.name = 'gangway_ramp';
    scene.add(ramp);
    objects.push(ramp);
  }

  function createRiverBanks() {
    // River bank visible - low box terrain each side
    var leftBankGeom = new THREE.BoxGeometry(40, 3, 150);
    var bankMat = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      metalness: 0.2,
      roughness: 0.9
    });
    var leftBank = new THREE.Mesh(leftBankGeom, bankMat);
    leftBank.position.set(-90, -10, 20);
    leftBank.receiveShadow = true;
    leftBank.name = 'left_bank';
    scene.add(leftBank);
    objects.push(leftBank);

    var rightBankGeom = new THREE.BoxGeometry(40, 3, 150);
    var rightBank = new THREE.Mesh(rightBankGeom, bankMat);
    rightBank.position.set(90, -10, 20);
    rightBank.receiveShadow = true;
    rightBank.name = 'right_bank';
    scene.add(rightBank);
    objects.push(rightBank);
  }

  function createEnemies() {
    // Enemy salvage crew with cutting equipment
    var enemyPositions = [
      [-15, 5, 15],
      [-10, 5, 12],
      [5, 5, 18],
      [10, 5, 15],
      [-20, 5, -5]
    ];

    for (var i = 0; i < enemyPositions.length; i++) {
      // Body
      var bodyGeom = new THREE.BoxGeometry(1, 2, 1);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0x2a3a2a,
        metalness: 0.3,
        roughness: 0.8
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(enemyPositions[i][0], enemyPositions[i][1] + 1, enemyPositions[i][2]);
      body.castShadow = true;
      body.receiveShadow = true;
      body.name = 'enemy_body_' + i;
      scene.add(body);
      objects.push(body);

      // Head with welding mask
      var headGeom = new THREE.SphereGeometry(0.5, 8, 8);
      var headMat = new THREE.MeshStandardMaterial({
        color: 0x4a5a4a,
        metalness: 0.4,
        roughness: 0.7
      });
      var head = new THREE.Mesh(headGeom, headMat);
      head.position.set(enemyPositions[i][0], enemyPositions[i][1] + 3, enemyPositions[i][2]);
      head.castShadow = true;
      head.receiveShadow = true;
      head.name = 'enemy_head_' + i;
      scene.add(head);
      objects.push(head);
    }

    // Armed guards
    var guardPositions = [
      [20, 5, 10],
      [15, 5, -5],
      [-25, 5, 5]
    ];

    for (var j = 0; j < guardPositions.length; j++) {
      // Guard body
      var gBodyGeom = new THREE.BoxGeometry(0.8, 2.2, 0.8);
      var gBodyMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        metalness: 0.4,
        roughness: 0.8
      });
      var gBody = new THREE.Mesh(gBodyGeom, gBodyMat);
      gBody.position.set(guardPositions[j][0], guardPositions[j][1] + 1.2, guardPositions[j][2]);
      gBody.castShadow = true;
      gBody.receiveShadow = true;
      gBody.name = 'guard_body_' + j;
      scene.add(gBody);
      objects.push(gBody);

      // Guard head
      var gHeadGeom = new THREE.SphereGeometry(0.4, 8, 8);
      var gHeadMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a5a,
        metalness: 0.3,
        roughness: 0.8
      });
      var gHead = new THREE.Mesh(gHeadGeom, gHeadMat);
      gHead.position.set(guardPositions[j][0], guardPositions[j][1] + 3.2, guardPositions[j][2]);
      gHead.castShadow = true;
      gHead.receiveShadow = true;
      gHead.name = 'guard_head_' + j;
      scene.add(gHead);
      objects.push(gHead);
    }
  }

  function setupLighting() {
    // Ambient light
    var ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    lights.push(ambient);

    // Directional light for sun
    var directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(50, 50, 50);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.far = 200;
    directional.shadow.camera.left = -100;
    directional.shadow.camera.right = 100;
    directional.shadow.camera.top = 100;
    directional.shadow.camera.bottom = -100;
    scene.add(directional);
    lights.push(directional);

    // Point light from exhaust/torch station
    var pointLight = new THREE.PointLight(0xff8800, 0.5, 40);
    pointLight.position.set(-15, 10, 15);
    pointLight.castShadow = true;
    scene.add(pointLight);
    lights.push(pointLight);
  }

  function setupHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'salvage_barge_hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '15px';
    hudElement.style.borderRadius = '5px';
    hudElement.style.zIndex = '1000';
    hudElement.style.pointerEvents = 'none';
    hudElement.innerHTML = 'SALVAGE BARGE SECURE<br>EQUIPMENT RECOVERED: 0/5<br>SALVAGERS NEUTRALIZED: 0/10<br>BARGE SECURE: NO<br><br><span style="color: #ffff00;">Press S+B to toggle</span>';
    document.body.appendChild(hudElement);
  }

  function setupKeybinds() {
    window.addEventListener('keydown', function(e) {
      if (e.key.toLowerCase() === 's') {
        var now = Date.now();
        if (now - lastSKeyTime < keybindTimout) {
          // S was pressed twice quickly
          lastSKeyTime = 0;
        } else {
          lastSKeyTime = now;
        }
      }
      if (e.key.toLowerCase() === 'b' && isActive) {
        var now = Date.now();
        if (now - lastSKeyTime < keybindTimout && lastSKeyTime !== 0) {
          // S+B combo detected
          toggle();
          lastSKeyTime = 0;
        }
      }
    });
  }

  function toggle() {
    isActive = !isActive;
    if (hudElement) {
      hudElement.style.display = isActive ? 'block' : 'none';
    }
  }

  function updateHUD() {
    if (hudElement) {
      var bargeStatus = bargeSecure ? 'YES' : 'NO';
      var statusColor = bargeSecure ? '#00ff00' : '#ff0000';
      hudElement.innerHTML = 'SALVAGE BARGE SECURE<br>' +
        'EQUIPMENT RECOVERED: ' + equipmentRecovered + '/5<br>' +
        'SALVAGERS NEUTRALIZED: ' + salvagersNeutralized + '/10<br>' +
        'BARGE SECURE: <span style="color: ' + statusColor + '">' + bargeStatus + '</span><br>' +
        '<br><span style="color: #ffff00;">Press S+B to toggle</span>';
    }
  }

  function update(delta) {
    if (!isActive) return;

    // Animate crane - rotation and height
    craneRotation += delta * 0.3;
    var craneObj = null;
    var boomObj = null;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'crane_base') craneObj = objects[i];
      if (objects[i].name === 'crane_boom') boomObj = objects[i];
    }

    if (boomObj) {
      boomObj.rotation.z = 0.3 + Math.sin(craneRotation) * 0.2;
      boomObj.position.y = 18 + Math.sin(craneRotation * 2) * 2;
    }

    // Exhaust puff animation
    exhaustPulseTime += delta;
    var exhaustObj = null;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'exhaust_puff') exhaustObj = objects[i];
    }
    if (exhaustObj) {
      var pulseScale = 1 + Math.sin(exhaustPulseTime * 3) * 0.3;
      exhaustObj.scale.set(pulseScale, pulseScale * 0.8, pulseScale);
      exhaustObj.position.y = 25 + Math.sin(exhaustPulseTime * 2) * 1;
    }

    // Torch spark flicker
    torchFlickerTime += delta;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name && objects[i].name.indexOf('spark_') === 0) {
        var flicker = Math.random() * 0.5 + 0.5;
        objects[i].material.opacity = flicker;
        objects[i].scale.set(
          0.5 + Math.random() * 0.3,
          0.5 + Math.random() * 0.3,
          0.5 + Math.random() * 0.3
        );
      }
    }

    // Barge rocking motion
    bargeRockTime += delta;
    var hullObj = null;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'barge_hull') hullObj = objects[i];
    }
    if (hullObj) {
      hullObj.rotation.z = Math.sin(bargeRockTime * 0.8) * 0.05;
      hullObj.position.y = -2 + Math.sin(bargeRockTime * 1.2) * 0.3;
    }

    // Anchor chain sway
    chainSwayTime += delta;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name && objects[i].name.indexOf('chain_link_') === 0) {
        objects[i].position.x = 40 + Math.sin(chainSwayTime * 0.6 + i * 0.2) * 1.5;
      }
    }

    // Navigation light blink
    navigationBlinkTime += delta;
    for (var i = 0; i < objects.length; i++) {
      if (objects[i].name === 'nav_light') {
        var blinkOpacity = Math.sin(navigationBlinkTime * 4) > 0 ? 0.8 : 0.2;
        objects[i].material.opacity = blinkOpacity;
      }
    }

    // Update HUD periodically
    updateHUD();
  }

  function reset() {
    // Remove all objects from scene
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];

    // Remove all lights from scene
    for (var i = 0; i < lights.length; i++) {
      scene.remove(lights[i]);
    }
    lights = [];

    // Reset game state
    equipmentRecovered = 0;
    salvagersNeutralized = 0;
    bargeSecure = false;
    isActive = false;
    craneRotation = 0;
    craneBoomHeight = 0;
    exhaustPulseTime = 0;
    torchFlickerTime = 0;
    bargeRockTime = 0;
    chainSwayTime = 0;
    navigationBlinkTime = 0;

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
