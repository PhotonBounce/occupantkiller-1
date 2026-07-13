var window = window || {};

window.JungleOutpost = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var enemies = [];
  var hudElement = null;
  var elapsedTime = 0;
  var gameState = {
    targetsEliminated: 0,
    maxTargets: 12,
    plunderRecovered: 0,
    maxPlunder: 8
  };
  var antennaMast = null;
  var radioBoxes = [];
  var trailCameras = [];
  var ropeRungs = [];
  var generatorBox = null;
  var camouflageNets = [];
  var cameraSwayAngle = 0;

  function createTreeTrunkPillars() {
    // Main support pillars - large tree cylinders
    var trunkPositions = [
      [-12, 0, -10],
      [12, 0, -10],
      [-12, 0, 10],
      [12, 0, 10],
      [-6, 0, -15],
      [6, 0, -15],
      [0, 0, 15]
    ];

    trunkPositions.forEach(function(pos) {
      var trunkGeometry = new THREE.CylinderGeometry(1.2, 1.4, 16, 16);
      var trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x336622, roughness: 0.85 });
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos[0], pos[1] + 8, pos[2]);
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      scene.add(trunk);
      sceneObjects.push(trunk);
    });
  }

  function createElevatedPlatformDeck() {
    // Main wooden platform deck - large box at height
    var deckGeometry = new THREE.BoxGeometry(26, 0.8, 28);
    var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 });
    var deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 7.5, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    scene.add(deck);
    sceneObjects.push(deck);

    // Support beams underneath
    var beamGeometry = new THREE.BoxGeometry(1.5, 0.6, 24);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4910, roughness: 0.9 });

    var beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
    beam1.position.set(-8, 7, 0);
    beam1.castShadow = true;
    beam1.receiveShadow = true;
    scene.add(beam1);
    sceneObjects.push(beam1);

    var beam2 = new THREE.Mesh(beamGeometry, beamMaterial);
    beam2.position.set(8, 7, 0);
    beam2.castShadow = true;
    beam2.receiveShadow = true;
    scene.add(beam2);
    sceneObjects.push(beam2);

    // Cross-support beams
    var crossBeamGeometry = new THREE.BoxGeometry(24, 0.6, 1.5);
    var crossBeam1 = new THREE.Mesh(crossBeamGeometry, beamMaterial);
    crossBeam1.position.set(0, 7, -10);
    crossBeam1.castShadow = true;
    crossBeam1.receiveShadow = true;
    scene.add(crossBeam1);
    sceneObjects.push(crossBeam1);

    var crossBeam2 = new THREE.Mesh(crossBeamGeometry, beamMaterial);
    crossBeam2.position.set(0, 7, 10);
    crossBeam2.castShadow = true;
    crossBeam2.receiveShadow = true;
    scene.add(crossBeam2);
    sceneObjects.push(crossBeam2);
  }

  function createRopeLadder() {
    // Rope ladder with rungs on side of platform
    var ropeLeftLineGeometry = new THREE.BoxGeometry(0.08, 8, 0.08);
    var ropeMaterial = new THREE.MeshStandardMaterial({ color: 0xBBA55A, roughness: 0.8 });

    var ropeLeft = new THREE.Mesh(ropeLeftLineGeometry, ropeMaterial);
    ropeLeft.position.set(-10, 3.5, -12);
    ropeLeft.castShadow = true;
    ropeLeft.receiveShadow = true;
    scene.add(ropeLeft);
    sceneObjects.push(ropeLeft);

    var ropeRight = new THREE.Mesh(ropeLeftLineGeometry, ropeMaterial);
    ropeRight.position.set(-9.5, 3.5, -12);
    ropeRight.castShadow = true;
    ropeRight.receiveShadow = true;
    scene.add(ropeRight);
    sceneObjects.push(ropeRight);

    // Rungs (horizontal bars)
    var rungGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.08);
    var rungMaterial = new THREE.MeshStandardMaterial({ color: 0xA0825A, roughness: 0.8 });

    for (var i = 0; i < 7; i++) {
      var rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(-9.75, 1.5 + i * 1.1, -12);
      rung.castShadow = true;
      rung.receiveShadow = true;
      scene.add(rung);
      sceneObjects.push(rung);
      ropeRungs.push({ mesh: rung, baseRotation: 0 });
    }
  }

  function createRadioAntennaMast() {
    // Tall antenna mast (cylinder)
    var mastGeometry = new THREE.CylinderGeometry(0.12, 0.12, 12, 12);
    var mastMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9, roughness: 0.2 });
    antennaMast = new THREE.Mesh(mastGeometry, mastMaterial);
    antennaMast.position.set(-8, 14, 8);
    antennaMast.castShadow = true;
    antennaMast.receiveShadow = true;
    scene.add(antennaMast);
    sceneObjects.push(antennaMast);
    antennaMast.mastData = { blinkTime: 0, blinkState: false };

    // Antenna arm (cone at top)
    var antennaGeometry = new THREE.ConeGeometry(0.15, 2, 8);
    var antennaMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4400, emissive: 0xFF4400, emissiveIntensity: 0.6 });
    var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(-8, 19.5, 8);
    antenna.rotation.z = Math.PI / 4;
    antenna.castShadow = true;
    antenna.receiveShadow = true;
    scene.add(antenna);
    sceneObjects.push(antenna);

    // Signal light on mast (small sphere)
    var lightGeometry = new THREE.SphereGeometry(0.25, 12, 12);
    var lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.8
    });
    var signalLight = new THREE.Mesh(lightGeometry, lightMaterial);
    signalLight.position.set(-8, 13, 8);
    signalLight.castShadow = true;
    signalLight.receiveShadow = true;
    scene.add(signalLight);
    sceneObjects.push(signalLight);
    antennaMast.signalLight = signalLight;
  }

  function createSignalEquipmentBoxes() {
    // Radio equipment boxes on platform
    var boxPositions = [
      [-6, 7.8, 10],
      [-2, 7.8, 10],
      [2, 7.8, 10]
    ];

    boxPositions.forEach(function(pos) {
      var boxGeometry = new THREE.BoxGeometry(1.2, 1.8, 1.2);
      var boxMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(pos[0], pos[1], pos[2]);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      sceneObjects.push(box);
      radioBoxes.push({ mesh: box, pulseTime: Math.random() * Math.PI * 2 });

      // Small indicator lights on boxes
      var indicatorGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      var indicatorMaterial = new THREE.MeshStandardMaterial({
        color: 0x00FF00,
        emissive: 0x00FF00,
        emissiveIntensity: 0.5
      });
      var indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(pos[0] - 0.5, pos[1] + 0.8, pos[2]);
      indicator.castShadow = true;
      indicator.receiveShadow = true;
      scene.add(indicator);
      sceneObjects.push(indicator);
    });
  }

  function createTrailCameraMounts() {
    // Trail cameras mounted on trees looking outward
    var cameraPositions = [
      { pos: [-14, 9, -12], rot: Math.PI * 0.3 },
      { pos: [14, 9, -12], rot: -Math.PI * 0.3 },
      { pos: [-14, 9, 12], rot: Math.PI * 0.7 },
      { pos: [14, 9, 12], rot: -Math.PI * 0.7 }
    ];

    cameraPositions.forEach(function(data) {
      // Camera body (small box)
      var cameraGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.5);
      var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
      var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
      camera.position.set(data.pos[0], data.pos[1], data.pos[2]);
      camera.rotation.y = data.rot;
      camera.castShadow = true;
      camera.receiveShadow = true;
      scene.add(camera);
      sceneObjects.push(camera);
      trailCameras.push({ mesh: camera, baseRotation: data.rot, rotationSpeed: 0.02 });

      // Lens (small sphere)
      var lensGeometry = new THREE.SphereGeometry(0.12, 12, 12);
      var lensMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
      var lens = new THREE.Mesh(lensGeometry, lensMaterial);
      lens.position.set(data.pos[0] + Math.cos(data.rot) * 0.4, data.pos[1], data.pos[2] + Math.sin(data.rot) * 0.4);
      lens.castShadow = true;
      lens.receiveShadow = true;
      scene.add(lens);
      sceneObjects.push(lens);
    });
  }

  function createAnimalTrapMechanisms() {
    // Metal trap frames (box with attached spring mechanisms)
    var trapPositions = [
      [-10, 7.8, -8],
      [10, 7.8, -8],
      [-10, 7.8, 8],
      [10, 7.8, 8]
    ];

    trapPositions.forEach(function(pos) {
      // Base frame
      var frameGeometry = new THREE.BoxGeometry(1, 0.3, 1.2);
      var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.4 });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      frame.position.set(pos[0], pos[1], pos[2]);
      frame.castShadow = true;
      frame.receiveShadow = true;
      scene.add(frame);
      sceneObjects.push(frame);

      // Spring mechanism (small cylinders)
      var springGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
      var springMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });

      var spring1 = new THREE.Mesh(springGeometry, springMaterial);
      spring1.position.set(pos[0] - 0.3, pos[1] + 0.5, pos[2] - 0.4);
      spring1.castShadow = true;
      spring1.receiveShadow = true;
      scene.add(spring1);
      sceneObjects.push(spring1);

      var spring2 = new THREE.Mesh(springGeometry, springMaterial);
      spring2.position.set(pos[0] + 0.3, pos[1] + 0.5, pos[2] + 0.4);
      spring2.castShadow = true;
      spring2.receiveShadow = true;
      scene.add(spring2);
      sceneObjects.push(spring2);
    });
  }

  function createMacheteBladeWall() {
    // Decorative wall of machete blades (thin boxes)
    var bladePositions = [];
    for (var i = 0; i < 6; i++) {
      bladePositions.push([9, 7.8 + i * 1.2, -10]);
    }

    bladePositions.forEach(function(pos) {
      var bladeGeometry = new THREE.BoxGeometry(0.1, 1, 1.8);
      var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAAA, metalness: 0.9, roughness: 0.2 });
      var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(pos[0], pos[1], pos[2]);
      blade.rotation.z = Math.random() * 0.3;
      blade.castShadow = true;
      blade.receiveShadow = true;
      scene.add(blade);
      sceneObjects.push(blade);
    });
  }

  function createSupplyCratePile() {
    // Stack of wooden supply crates
    var crateSize = 1.5;
    var cratePositions = [
      [-2, 7.8, -10],
      [0, 7.8, -10],
      [2, 7.8, -10],
      [-1, 9.3, -10],
      [1, 9.3, -10],
      [0, 10.8, -10]
    ];

    cratePositions.forEach(function(pos) {
      var crateGeometry = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
      var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.85 });
      var crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set(pos[0], pos[1], pos[2]);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      sceneObjects.push(crate);

      // Metal bands on crates
      var bandGeometry = new THREE.BoxGeometry(1.6, 0.15, 0.1);
      var bandMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });
      var band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.set(pos[0], pos[1] + 0.7, pos[2]);
      band.castShadow = true;
      band.receiveShadow = true;
      scene.add(band);
      sceneObjects.push(band);
    });
  }

  function createCamouflazeNettingPanels() {
    // Translucent camouflage netting panels
    var netPositions = [
      { pos: [-12, 9, 0], rot: 0 },
      { pos: [12, 9, 0], rot: 0 },
      { pos: [0, 9, -13], rot: Math.PI / 2 },
      { pos: [0, 9, 13], rot: Math.PI / 2 }
    ];

    netPositions.forEach(function(data) {
      var netGeometry = new THREE.BoxGeometry(4, 3, 0.2);
      var netMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCCC44,
        transparent: true,
        opacity: 0.4,
        roughness: 0.8
      });
      var net = new THREE.Mesh(netGeometry, netMaterial);
      net.position.set(data.pos[0], data.pos[1], data.pos[2]);
      net.rotation.y = data.rot;
      net.castShadow = false;
      net.receiveShadow = true;
      scene.add(net);
      sceneObjects.push(net);
      camouflageNets.push({ mesh: net, basePos: data.pos, swayAmount: 0 });
    });
  }

  function createJungleFloorCanopy() {
    // Dense jungle canopy understory beneath platform
    var canopyGeometry = new THREE.BoxGeometry(50, 8, 50);
    var canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x44AA22, roughness: 0.95 });
    var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(0, 2, 0);
    canopy.receiveShadow = true;
    scene.add(canopy);
    sceneObjects.push(canopy);

    // Dense vegetation texture - random green boxes representing foliage
    for (var i = 0; i < 20; i++) {
      var foliageGeometry = new THREE.BoxGeometry(3 + Math.random() * 2, 2 + Math.random() * 3, 3 + Math.random() * 2);
      var foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x226611 + Math.floor(Math.random() * 0x002200),
        roughness: 0.95
      });
      var foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(
        Math.random() * 40 - 20,
        Math.random() * 6 + 1,
        Math.random() * 40 - 20
      );
      foliage.rotation.y = Math.random() * Math.PI;
      foliage.receiveShadow = true;
      scene.add(foliage);
      sceneObjects.push(foliage);
    }
  }

  function createVineCurtains() {
    // Vine curtains hanging from platform
    var vinePositions = [
      [-10, 7.5, 12],
      [-5, 7.5, 12],
      [0, 7.5, 12],
      [5, 7.5, 12],
      [10, 7.5, 12]
    ];

    vinePositions.forEach(function(pos) {
      var vineGeometry = new THREE.BoxGeometry(0.3, 4, 0.2);
      var vineMaterial = new THREE.MeshStandardMaterial({ color: 0x335533, roughness: 0.9 });
      var vine = new THREE.Mesh(vineGeometry, vineMaterial);
      vine.position.set(pos[0], pos[1], pos[2]);
      vine.castShadow = true;
      vine.receiveShadow = true;
      scene.add(vine);
      sceneObjects.push(vine);
    });
  }

  function createObservationPerch() {
    // Elevated observation platform
    var perchGeometry = new THREE.BoxGeometry(3, 0.5, 3);
    var perchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 });
    var perch = new THREE.Mesh(perchGeometry, perchMaterial);
    perch.position.set(10, 10, -8);
    perch.castShadow = true;
    perch.receiveShadow = true;
    scene.add(perch);
    sceneObjects.push(perch);

    // Support post for perch
    var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 12);
    var postMaterial = new THREE.MeshStandardMaterial({ color: 0x336622, roughness: 0.85 });
    var post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(10, 8.5, -8);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);
    sceneObjects.push(post);

    // Scope mount (small box)
    var scopeGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
    var scopeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
    var scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
    scope.position.set(10, 10.5, -8);
    scope.castShadow = true;
    scope.receiveShadow = true;
    scene.add(scope);
    sceneObjects.push(scope);
  }

  function createGeneratorHut() {
    // Small generator hut structure
    var hutGeometry = new THREE.BoxGeometry(2.5, 2, 3);
    var hutMaterial = new THREE.MeshStandardMaterial({ color: 0x6B4910, roughness: 0.9 });
    var hut = new THREE.Mesh(hutGeometry, hutMaterial);
    hut.position.set(-10, 8.5, -8);
    hut.castShadow = true;
    hut.receiveShadow = true;
    scene.add(hut);
    sceneObjects.push(hut);

    // Generator box inside/attached
    var generatorGeometry = new THREE.BoxGeometry(1.8, 1.2, 1.5);
    var generatorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    generatorBox = new THREE.Mesh(generatorGeometry, generatorMaterial);
    generatorBox.position.set(-10, 9.3, -7.5);
    generatorBox.castShadow = true;
    generatorBox.receiveShadow = true;
    scene.add(generatorBox);
    sceneObjects.push(generatorBox);
    generatorBox.generatorData = { vibeAmount: 0 };

    // Exhaust pipe
    var pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.5 });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(-10, 10.5, -8.5);
    pipe.castShadow = true;
    pipe.receiveShadow = true;
    scene.add(pipe);
    sceneObjects.push(pipe);
  }

  function createEnemies() {
    // Enemy soldiers positioned around outpost
    var enemyPositions = [
      [-8, 0, -15],
      [8, 0, -15],
      [-15, 0, 0],
      [15, 0, 0],
      [-8, 0, 15],
      [8, 0, 15],
      [0, 0, -18],
      [0, 0, 18],
      [-18, 0, -8],
      [18, 0, -8],
      [-18, 0, 8],
      [18, 0, 8]
    ];

    enemyPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Head
      var headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      var headMaterial = new THREE.MeshStandardMaterial({ color: 0xD4A574, roughness: 0.7 });
      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.8;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      group.position.set(pos[0], pos[1], pos[2]);
      group.enemyData = { health: 100, active: true, patrolPos: pos };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    });
  }

  function createTerrain() {
    // Ground plane
    var groundGeometry = new THREE.BoxGeometry(100, 1, 100);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2D5016, roughness: 0.95 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    sceneObjects.push(ground);

    // Jungle terrain variations - dirt/mud
    for (var i = 0; i < 12; i++) {
      var terrainGeometry = new THREE.BoxGeometry(
        6 + Math.random() * 4,
        0.3 + Math.random() * 0.5,
        8 + Math.random() * 4
      );
      var terrainMaterial = new THREE.MeshStandardMaterial({
        color: 0x3D6B24 + Math.floor(Math.random() * 0x001000),
        roughness: 0.98
      });
      var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
      terrain.position.set(
        Math.random() * 80 - 40,
        0,
        Math.random() * 80 - 40
      );
      terrain.rotation.y = Math.random() * Math.PI;
      terrain.receiveShadow = true;
      scene.add(terrain);
      sceneObjects.push(terrain);
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    animatedObjects = [];
    enemies = [];
    radioBoxes = [];
    trailCameras = [];
    ropeRungs = [];
    camouflageNets = [];
    elapsedTime = 0;
    gameState = {
      targetsEliminated: 0,
      maxTargets: 12,
      plunderRecovered: 0,
      maxPlunder: 8
    };

    // Jungle atmosphere
    scene.background = new THREE.Color(0x4D8C3D);
    scene.fog = new THREE.Fog(0x4D8C3D, 60, 100);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x88AA77, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFDD, 0.7);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create all scene objects
    createTerrain();
    createTreeTrunkPillars();
    createElevatedPlatformDeck();
    createRopeLadder();
    createRadioAntennaMast();
    createSignalEquipmentBoxes();
    createTrailCameraMounts();
    createAnimalTrapMechanisms();
    createMacheteBladeWall();
    createSupplyCratePile();
    createCamouflazeNettingPanels();
    createJungleFloorCanopy();
    createVineCurtains();
    createObservationPerch();
    createGeneratorHut();
    createEnemies();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'jungle-outpost-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00FF00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.5';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(0,255,0,0.7)';
      document.body.appendChild(hudElement);
    }

    updateHUD();
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'JUNGLE OUTPOST\n' +
                  'TARGETS ELIMINATED: ' + gameState.targetsEliminated + '/' + gameState.maxTargets + '\n' +
                  'PLUNDER RECOVERED: ' + gameState.plunderRecovered + '/' + gameState.maxPlunder;
    hudElement.textContent = hudText;
  }

  function update(delta) {
    elapsedTime += delta;

    // Antenna signal light blinking
    if (antennaMast) {
      antennaMast.mastData.blinkTime += delta;
      if (antennaMast.mastData.blinkTime > 0.5) {
        antennaMast.mastData.blinkState = !antennaMast.mastData.blinkState;
        antennaMast.mastData.blinkTime = 0;
      }
      if (antennaMast.signalLight) {
        antennaMast.signalLight.visible = antennaMast.mastData.blinkState;
      }
      antennaMast.rotation.z += 0.002;
    }

    // Radio equipment indicator pulsing
    radioBoxes.forEach(function(radioBox) {
      radioBox.pulseTime += delta * 2;
      var pulseFactor = Math.sin(radioBox.pulseTime) * 0.5 + 0.5;
      radioBox.mesh.material.emissiveIntensity = pulseFactor * 0.3;
    });

    // Camouflage netting swaying
    camouflageNets.forEach(function(net) {
      net.swayAmount = Math.sin(elapsedTime * 0.8 + net.mesh.position.x) * 0.05;
      net.mesh.rotation.x = net.swayAmount;
      net.mesh.position.y = net.basePos[1] + Math.sin(elapsedTime * 0.5 + net.mesh.position.z) * 0.1;
    });

    // Rope ladder swinging slightly
    ropeRungs.forEach(function(rung, idx) {
      var swingAmount = Math.sin(elapsedTime * 0.6 + idx * 0.15) * 0.08;
      rung.mesh.rotation.z = swingAmount;
    });

    // Trail camera rotating
    trailCameras.forEach(function(camera) {
      camera.mesh.rotation.y = camera.baseRotation + Math.sin(elapsedTime * camera.rotationSpeed) * 0.3;
    });

    // Generator vibrating
    if (generatorBox) {
      generatorBox.generatorData.vibeAmount = Math.random() * 0.02;
      generatorBox.position.x += (Math.random() - 0.5) * 0.02;
      generatorBox.position.z += (Math.random() - 0.5) * 0.02;
    }

    // Slowly increment game progress
    if (Math.random() < 0.008) {
      if (gameState.targetsEliminated < gameState.maxTargets) {
        gameState.targetsEliminated += 1;
      }
    }

    if (Math.random() < 0.006) {
      if (gameState.plunderRecovered < gameState.maxPlunder) {
        gameState.plunderRecovered += 1;
      }
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove enemies
    enemies.forEach(function(enemy) {
      scene.remove(enemy);
    });

    sceneObjects = [];
    animatedObjects = [];
    enemies = [];
    radioBoxes = [];
    trailCameras = [];
    ropeRungs = [];
    camouflageNets = [];
    antennaMast = null;
    generatorBox = null;
    elapsedTime = 0;
    gameState = {
      targetsEliminated: 0,
      maxTargets: 12,
      plunderRecovered: 0,
      maxPlunder: 8
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
