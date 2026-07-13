window.ShipwreckReef = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var shipObjects = [];
  var spawnPoints = [];
  var state = {
    time: 0,
    shipRoll: 0,
    wavePhase: 0
  };

  var COLORS = {
    rustOrange: 0xB84A0A,
    corrodedGray: 0x7A7A7A,
    coralCyan: 0x00D9FF,
    coralOrange: 0xFF8C42,
    oceanBlue: 0x1A4D6D,
    darkWater: 0x0D2B3D,
    gunMetal: 0x36454F,
    sand: 0xD4A574
  };

  var SHIP_ANGLE = 0.349; // 20 degrees in radians, listing to port

  function createShipHull() {
    var hullGroup = new THREE.Group();
    hullGroup.rotation.z = SHIP_ANGLE;
    hullGroup.position.y = 0;

    // Main hull body - large rotated box
    var hullGeometry = new THREE.BoxGeometry(60, 40, 120);
    var hullMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.rustOrange,
      metalness: 0.8,
      roughness: 0.7
    });
    var hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.z = -10;
    hull.castShadow = true;
    hull.receiveShadow = true;
    hullGroup.add(hull);
    shipObjects.push(hull);

    // Hull cross-sections
    var section2Geometry = new THREE.BoxGeometry(55, 35, 25);
    var section2Material = new THREE.MeshStandardMaterial({
      color: 0x9A3D0B,
      metalness: 0.7,
      roughness: 0.8
    });
    var section2 = new THREE.Mesh(section2Geometry, section2Material);
    section2.position.z = -50;
    section2.castShadow = true;
    section2.receiveShadow = true;
    hullGroup.add(section2);
    shipObjects.push(section2);

    var section3Geometry = new THREE.BoxGeometry(52, 32, 22);
    var section3Material = new THREE.MeshStandardMaterial({
      color: 0x8B3A09,
      metalness: 0.75,
      roughness: 0.75
    });
    var section3 = new THREE.Mesh(section3Geometry, section3Material);
    section3.position.z = 35;
    section3.castShadow = true;
    section3.receiveShadow = true;
    hullGroup.add(section3);
    shipObjects.push(section3);

    return hullGroup;
  }

  function createDeck() {
    var deckGeometry = new THREE.BoxGeometry(50, 3, 100);
    var deckMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.corrodedGray,
      metalness: 0.6,
      roughness: 0.85
    });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 22;
    deck.position.z = 0;
    deck.rotation.z = SHIP_ANGLE;
    deck.castShadow = true;
    deck.receiveShadow = true;
    shipObjects.push(deck);
    return deck;
  }

  function createBridgeTower() {
    var bridgeGroup = new THREE.Group();
    bridgeGroup.position.y = 22;
    bridgeGroup.position.z = -45;
    bridgeGroup.rotation.z = SHIP_ANGLE;

    // Bridge structure
    var bridgeGeometry = new THREE.BoxGeometry(25, 30, 20);
    var bridgeMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.corrodedGray,
      metalness: 0.7,
      roughness: 0.8
    });
    var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.y = 15;
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    bridgeGroup.add(bridge);
    shipObjects.push(bridge);

    // Radar tower
    var radarGeometry = new THREE.CylinderGeometry(3, 3, 25, 16);
    var radarMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gunMetal,
      metalness: 0.85,
      roughness: 0.6
    });
    var radar = new THREE.Mesh(radarGeometry, radarMaterial);
    radar.position.y = 28;
    radar.position.x = 8;
    radar.castShadow = true;
    radar.receiveShadow = true;
    bridgeGroup.add(radar);
    shipObjects.push(radar);

    return bridgeGroup;
  }

  function createGunTurrets() {
    var turretGroup = new THREE.Group();

    // Front turret
    var turret1 = createSingleTurret(0, 25, -30);
    turretGroup.add(turret1);

    // Rear turret
    var turret2 = createSingleTurret(0, 25, 40);
    turretGroup.add(turret2);

    turretGroup.rotation.z = SHIP_ANGLE;
    return turretGroup;
  }

  function createSingleTurret(x, y, z) {
    var turretGroup = new THREE.Group();
    turretGroup.position.set(x, y, z);

    // Turret base
    var baseGeometry = new THREE.CylinderGeometry(8, 10, 6, 32);
    var baseMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gunMetal,
      metalness: 0.85,
      roughness: 0.65
    });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    turretGroup.add(base);
    shipObjects.push(base);

    // Gun barrel
    var barrelGeometry = new THREE.CylinderGeometry(2.5, 2.5, 35, 16);
    var barrelMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gunMetal,
      metalness: 0.9,
      roughness: 0.5
    });
    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = 0.2;
    barrel.position.z = 17;
    barrel.position.y = 3;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    turretGroup.add(barrel);
    shipObjects.push(barrel);

    // Gun shield
    var shieldGeometry = new THREE.BoxGeometry(16, 12, 4);
    var shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x4A4A4A,
      metalness: 0.8,
      roughness: 0.7
    });
    var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    shield.position.z = 10;
    shield.position.y = 2;
    shield.castShadow = true;
    shield.receiveShadow = true;
    turretGroup.add(shield);
    shipObjects.push(shield);

    return turretGroup;
  }

  function createCoralReef() {
    var coralGroup = new THREE.Group();

    // Coral cluster 1 - port side
    var coral1 = createCoralCluster(-35, 5, -20);
    coralGroup.add(coral1);

    // Coral cluster 2 - starboard side
    var coral2 = createCoralCluster(35, 4, 10);
    coralGroup.add(coral2);

    // Coral cluster 3 - bow
    var coral3 = createCoralCluster(-5, 6, -60);
    coralGroup.add(coral3);

    // Coral cluster 4 - stern
    var coral4 = createCoralCluster(10, 3, 55);
    coralGroup.add(coral4);

    return coralGroup;
  }

  function createCoralCluster(x, y, z) {
    var clusterGroup = new THREE.Group();
    clusterGroup.position.set(x, y, z);

    // Large coral sphere
    var coral1Geometry = new THREE.SphereGeometry(6, 16, 16);
    var coral1Material = new THREE.MeshStandardMaterial({
      color: COLORS.coralCyan,
      metalness: 0.1,
      roughness: 0.9
    });
    var coral1 = new THREE.Mesh(coral1Geometry, coral1Material);
    coral1.scale.set(1, 0.8, 1);
    coral1.castShadow = true;
    coral1.receiveShadow = true;
    clusterGroup.add(coral1);
    shipObjects.push(coral1);

    // Medium coral sphere
    var coral2Geometry = new THREE.SphereGeometry(4.5, 14, 14);
    var coral2Material = new THREE.MeshStandardMaterial({
      color: COLORS.coralOrange,
      metalness: 0.1,
      roughness: 0.95
    });
    var coral2 = new THREE.Mesh(coral2Geometry, coral2Material);
    coral2.position.set(5, -2, 3);
    coral2.castShadow = true;
    coral2.receiveShadow = true;
    clusterGroup.add(coral2);
    shipObjects.push(coral2);

    // Small coral sphere
    var coral3Geometry = new THREE.SphereGeometry(3, 12, 12);
    var coral3Material = new THREE.MeshStandardMaterial({
      color: 0x00E5FF,
      metalness: 0.05,
      roughness: 0.98
    });
    var coral3 = new THREE.Mesh(coral3Geometry, coral3Material);
    coral3.position.set(-4, -3, -4);
    coral3.castShadow = true;
    coral3.receiveShadow = true;
    clusterGroup.add(coral3);
    shipObjects.push(coral3);

    // Coral formations as boxes
    var coralFormGeometry = new THREE.BoxGeometry(3, 8, 3);
    var coralFormMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF9000,
      metalness: 0.05,
      roughness: 0.9
    });
    var coralForm = new THREE.Mesh(coralFormGeometry, coralFormMaterial);
    coralForm.position.set(-6, 2, 5);
    coralForm.castShadow = true;
    coralForm.receiveShadow = true;
    clusterGroup.add(coralForm);
    shipObjects.push(coralForm);

    return clusterGroup;
  }

  function createHullHoles() {
    var holesGroup = new THREE.Group();
    holesGroup.rotation.z = SHIP_ANGLE;

    // Port side hole
    var hole1Geometry = new THREE.BoxGeometry(8, 6, 2);
    var hole1Material = new THREE.MeshStandardMaterial({
      color: COLORS.oceanBlue,
      metalness: 0,
      roughness: 1,
      emissive: 0x000000
    });
    var hole1 = new THREE.Mesh(hole1Geometry, hole1Material);
    hole1.position.set(-28, 5, -35);
    holesGroup.add(hole1);
    shipObjects.push(hole1);

    // Starboard hole
    var hole2Geometry = new THREE.BoxGeometry(7, 5, 2);
    var hole2 = new THREE.Mesh(hole2Geometry, hole1Material);
    hole2.position.set(26, -2, 20);
    holesGroup.add(hole2);
    shipObjects.push(hole2);

    return holesGroup;
  }

  function createFloodedDeck() {
    var floodGeometry = new THREE.BoxGeometry(48, 8, 95);
    var floodMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.darkWater,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.7
    });
    var flood = new THREE.Mesh(floodGeometry, floodMaterial);
    flood.position.y = -10;
    flood.position.z = 0;
    flood.rotation.z = SHIP_ANGLE;
    flood.castShadow = true;
    flood.receiveShadow = true;
    shipObjects.push(flood);
    return flood;
  }

  function createEngineRoom() {
    var engineGroup = new THREE.Group();
    engineGroup.position.y = -5;
    engineGroup.position.z = 25;
    engineGroup.rotation.z = SHIP_ANGLE;

    // Main engine block
    var engineGeometry = new THREE.BoxGeometry(40, 25, 30);
    var engineMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.corrodedGray,
      metalness: 0.75,
      roughness: 0.8
    });
    var engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.castShadow = true;
    engine.receiveShadow = true;
    engineGroup.add(engine);
    shipObjects.push(engine);

    // Piston rods
    var piston1Geometry = new THREE.CylinderGeometry(3, 3, 40, 16);
    var pistonMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.gunMetal,
      metalness: 0.85,
      roughness: 0.6
    });
    var piston1 = new THREE.Mesh(piston1Geometry, pistonMaterial);
    piston1.rotation.z = Math.PI / 2;
    piston1.position.set(-10, 8, 0);
    piston1.castShadow = true;
    piston1.receiveShadow = true;
    engineGroup.add(piston1);
    shipObjects.push(piston1);

    var piston2 = new THREE.Mesh(piston1Geometry, pistonMaterial);
    piston2.rotation.z = Math.PI / 2;
    piston2.position.set(10, 8, 0);
    piston2.castShadow = true;
    piston2.receiveShadow = true;
    engineGroup.add(piston2);
    shipObjects.push(piston2);

    // Machinery boxes
    var machineryGeometry = new THREE.BoxGeometry(12, 18, 8);
    var machineryMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.7,
      roughness: 0.8
    });
    var machinery1 = new THREE.Mesh(machineryGeometry, machineryMaterial);
    machinery1.position.set(-15, -5, -12);
    machinery1.castShadow = true;
    machinery1.receiveShadow = true;
    engineGroup.add(machinery1);
    shipObjects.push(machinery1);

    var machinery2 = new THREE.Mesh(machineryGeometry, machineryMaterial);
    machinery2.position.set(15, -6, 10);
    machinery2.castShadow = true;
    machinery2.receiveShadow = true;
    engineGroup.add(machinery2);
    shipObjects.push(machinery2);

    return engineGroup;
  }

  function createLifeboatDavits() {
    var davitGroup = new THREE.Group();
    davitGroup.position.y = 25;
    davitGroup.rotation.z = SHIP_ANGLE;

    // Port davit
    var davit1Geometry = new THREE.BoxGeometry(3, 40, 3);
    var davitMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.corrodedGray,
      metalness: 0.7,
      roughness: 0.85
    });
    var davit1 = new THREE.Mesh(davit1Geometry, davitMaterial);
    davit1.position.set(-20, 0, -25);
    davit1.rotation.z = 0.4;
    davit1.castShadow = true;
    davit1.receiveShadow = true;
    davitGroup.add(davit1);
    shipObjects.push(davit1);

    // Starboard davit
    var davit2 = new THREE.Mesh(davit1Geometry, davitMaterial);
    davit2.position.set(20, 0, -25);
    davit2.rotation.z = -0.4;
    davit2.castShadow = true;
    davit2.receiveShadow = true;
    davitGroup.add(davit2);
    shipObjects.push(davit2);

    return davitGroup;
  }

  function createRopeNets() {
    var netGroup = new THREE.Group();
    netGroup.position.y = 20;
    netGroup.rotation.z = SHIP_ANGLE;

    // Rope net made with LineSegments
    var netPoints = [];
    var ropeSpacing = 3;
    var netWidth = 30;
    var netHeight = 20;

    // Vertical lines
    for (var x = -netWidth / 2; x <= netWidth / 2; x += ropeSpacing) {
      netPoints.push(new THREE.Vector3(x, 0, -5));
      netPoints.push(new THREE.Vector3(x, -netHeight, -5));
    }

    // Horizontal lines
    for (var y = 0; y >= -netHeight; y -= ropeSpacing) {
      netPoints.push(new THREE.Vector3(-netWidth / 2, y, -5));
      netPoints.push(new THREE.Vector3(netWidth / 2, y, -5));
    }

    var netGeometry = new THREE.BufferGeometry();
    netGeometry.setFromPoints(netPoints);
    var netMaterial = new THREE.LineBasicMaterial({ color: 0x8B7355, linewidth: 2 });
    var net = new THREE.LineSegments(netGeometry, netMaterial);
    net.position.set(-15, 0, -20);
    netGroup.add(net);
    shipObjects.push(net);

    return netGroup;
  }

  function createPirateFlagMast() {
    var mastGroup = new THREE.Group();
    mastGroup.position.y = 35;
    mastGroup.position.z = -40;
    mastGroup.rotation.z = SHIP_ANGLE;

    // Mast pole
    var mastGeometry = new THREE.CylinderGeometry(2, 2, 50, 16);
    var mastMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.corrodedGray,
      metalness: 0.8,
      roughness: 0.7
    });
    var mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.castShadow = true;
    mast.receiveShadow = true;
    mastGroup.add(mast);
    shipObjects.push(mast);

    // Flag
    var flagGeometry = new THREE.BoxGeometry(20, 12, 0.5);
    var flagMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.3,
      roughness: 0.9
    });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(11, 0, 0);
    flag.castShadow = true;
    flag.receiveShadow = true;
    flag.userData.isFlag = true;
    mastGroup.add(flag);
    shipObjects.push(flag);

    // Skull symbol on flag
    var skullGeometry = new THREE.SphereGeometry(2, 8, 8);
    var skullMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0x666666
    });
    var skull = new THREE.Mesh(skullGeometry, skullMaterial);
    skull.position.set(11, 2, 1);
    skull.scale.set(0.8, 1, 0.2);
    mastGroup.add(skull);
    shipObjects.push(skull);

    return mastGroup;
  }

  function createAnchorChain() {
    var chainGroup = new THREE.Group();
    chainGroup.position.set(-25, -15, 50);
    chainGroup.rotation.z = SHIP_ANGLE;

    var linkHeight = 3;
    var chainLength = 40;
    var linkCount = Math.floor(chainLength / linkHeight);

    for (var i = 0; i < linkCount; i++) {
      var linkGeometry = new THREE.CylinderGeometry(1.5, 1.5, linkHeight, 8);
      var linkMaterial = new THREE.MeshStandardMaterial({
        color: COLORS.corrodedGray,
        metalness: 0.8,
        roughness: 0.85
      });
      var link = new THREE.Mesh(linkGeometry, linkMaterial);
      link.position.y = -i * linkHeight;
      link.castShadow = true;
      link.receiveShadow = true;
      chainGroup.add(link);
      if (i % 3 === 0) {
        shipObjects.push(link);
      }
    }

    return chainGroup;
  }

  function createMetalLadders() {
    var ladderGroup = new THREE.Group();
    ladderGroup.position.y = -5;
    ladderGroup.position.z = -15;
    ladderGroup.rotation.z = SHIP_ANGLE;

    var rungSpacing = 2.5;
    var ladderHeight = 35;
    var ladderWidth = 4;
    var rungCount = Math.floor(ladderHeight / rungSpacing);

    // Left rail
    var leftRailPoints = [];
    leftRailPoints.push(new THREE.Vector3(-ladderWidth / 2, 0, 0));
    leftRailPoints.push(new THREE.Vector3(-ladderWidth / 2, ladderHeight, 0));

    var leftRailGeometry = new THREE.BufferGeometry();
    leftRailGeometry.setFromPoints(leftRailPoints);
    var railMaterial = new THREE.LineBasicMaterial({ color: COLORS.gunMetal, linewidth: 3 });
    var leftRail = new THREE.LineSegments(leftRailGeometry, railMaterial);
    ladderGroup.add(leftRail);
    shipObjects.push(leftRail);

    // Right rail
    var rightRailPoints = [];
    rightRailPoints.push(new THREE.Vector3(ladderWidth / 2, 0, 0));
    rightRailPoints.push(new THREE.Vector3(ladderWidth / 2, ladderHeight, 0));

    var rightRailGeometry = new THREE.BufferGeometry();
    rightRailGeometry.setFromPoints(rightRailPoints);
    var rightRail = new THREE.LineSegments(rightRailGeometry, railMaterial);
    ladderGroup.add(rightRail);
    shipObjects.push(rightRail);

    // Rungs
    for (var i = 0; i < rungCount; i++) {
      var rungPoints = [];
      var rungY = i * rungSpacing;
      rungPoints.push(new THREE.Vector3(-ladderWidth / 2, rungY, 0));
      rungPoints.push(new THREE.Vector3(ladderWidth / 2, rungY, 0));

      var rungGeometry = new THREE.BufferGeometry();
      rungGeometry.setFromPoints(rungPoints);
      var rung = new THREE.LineSegments(rungGeometry, railMaterial);
      ladderGroup.add(rung);
      if (i % 4 === 0) {
        shipObjects.push(rung);
      }
    }

    return ladderGroup;
  }

  function createSmokestack() {
    var stackGroup = new THREE.Group();
    stackGroup.position.set(12, 30, 5);
    stackGroup.rotation.z = SHIP_ANGLE + 0.15;

    // Stack cylinder
    var stackGeometry = new THREE.CylinderGeometry(5, 6, 45, 20);
    var stackMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.corrodedGray,
      metalness: 0.7,
      roughness: 0.9
    });
    var stack = new THREE.Mesh(stackGeometry, stackMaterial);
    stack.castShadow = true;
    stack.receiveShadow = true;
    stackGroup.add(stack);
    shipObjects.push(stack);

    // Stack cap
    var capGeometry = new THREE.CylinderGeometry(5.5, 5, 3, 20);
    var capMaterial = new THREE.MeshStandardMaterial({
      color: 0x5A5A5A,
      metalness: 0.75,
      roughness: 0.85
    });
    var cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 24;
    cap.castShadow = true;
    cap.receiveShadow = true;
    stackGroup.add(cap);
    shipObjects.push(cap);

    return stackGroup;
  }

  function createAmbulationDeck() {
    var ambGroup = new THREE.Group();
    ambGroup.position.y = 24;
    ambGroup.position.z = 0;
    ambGroup.rotation.z = SHIP_ANGLE;

    // Left walkway
    var walkGeometry = new THREE.BoxGeometry(6, 1, 80);
    var walkMaterial = new THREE.MeshStandardMaterial({
      color: 0x9A8B7E,
      metalness: 0.5,
      roughness: 0.8
    });
    var walkLeft = new THREE.Mesh(walkGeometry, walkMaterial);
    walkLeft.position.x = -23;
    walkLeft.castShadow = true;
    walkLeft.receiveShadow = true;
    ambGroup.add(walkLeft);
    shipObjects.push(walkLeft);

    // Right walkway
    var walkRight = new THREE.Mesh(walkGeometry, walkMaterial);
    walkRight.position.x = 23;
    walkRight.castShadow = true;
    walkRight.receiveShadow = true;
    ambGroup.add(walkRight);
    shipObjects.push(walkRight);

    return ambGroup;
  }

  function createSpawnPoints() {
    spawnPoints = [];

    // Deck spawn points
    spawnPoints.push({
      position: new THREE.Vector3(-15, 26, -30),
      description: 'Deck Port'
    });
    spawnPoints.push({
      position: new THREE.Vector3(15, 26, 30),
      description: 'Deck Starboard'
    });

    // Coral cover points
    spawnPoints.push({
      position: new THREE.Vector3(-35, 10, -20),
      description: 'Coral Port'
    });
    spawnPoints.push({
      position: new THREE.Vector3(35, 10, 10),
      description: 'Coral Starboard'
    });

    // Engine room
    spawnPoints.push({
      position: new THREE.Vector3(0, 5, 25),
      description: 'Engine Room'
    });
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    shipObjects = [];

    // Create main ship components
    var hull = createShipHull();
    scene.add(hull);

    var deck = createDeck();
    scene.add(deck);

    var bridge = createBridgeTower();
    scene.add(bridge);

    var turrets = createGunTurrets();
    scene.add(turrets);

    var coral = createCoralReef();
    scene.add(coral);

    var holes = createHullHoles();
    scene.add(holes);

    var flood = createFloodedDeck();
    scene.add(flood);

    var engine = createEngineRoom();
    scene.add(engine);

    var davits = createLifeboatDavits();
    scene.add(davits);

    var nets = createRopeNets();
    scene.add(nets);

    var mast = createPirateFlagMast();
    scene.add(mast);

    var chain = createAnchorChain();
    scene.add(chain);

    var ladders = createMetalLadders();
    scene.add(ladders);

    var stack = createSmokestack();
    scene.add(stack);

    var ambulation = createAmbulationDeck();
    scene.add(ambulation);

    createSpawnPoints();

    state.time = 0;
    state.shipRoll = 0;
    state.wavePhase = 0;
  }

  function update(delta) {
    state.time += delta;
    state.wavePhase = (state.time * 0.5) % (Math.PI * 2);
    state.shipRoll = Math.sin(state.wavePhase) * 0.02;

    // Rock ship gently
    for (var i = 0; i < shipObjects.length; i++) {
      if (shipObjects[i].parent && shipObjects[i].parent.rotation) {
        shipObjects[i].parent.rotation.x = state.shipRoll * 0.3;
      }
    }

    // Flag flapping animation
    for (var i = 0; i < shipObjects.length; i++) {
      var obj = shipObjects[i];
      if (obj.userData && obj.userData.isFlag) {
        obj.rotation.z = Math.sin(state.wavePhase * 1.5) * 0.15;
        obj.scale.y = 1 + Math.sin(state.wavePhase * 2) * 0.05;
      }
    }

    // Flooded deck ripple effect (visual)
    for (var i = 0; i < shipObjects.length; i++) {
      if (shipObjects[i].material && shipObjects[i].material.color) {
        var colorShift = Math.sin(state.wavePhase) * 0.05;
        shipObjects[i].material.opacity = 0.7 + colorShift * 0.1;
      }
    }
  }

  function reset() {
    if (scene) {
      for (var i = shipObjects.length - 1; i >= 0; i--) {
        if (shipObjects[i].parent) {
          shipObjects[i].parent.remove(shipObjects[i]);
        } else {
          scene.remove(shipObjects[i]);
        }
      }
    }
    shipObjects = [];
    spawnPoints = [];
    state = {
      time: 0,
      shipRoll: 0,
      wavePhase: 0
    };
  }

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; }
  };
}());
