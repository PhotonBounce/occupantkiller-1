var window = window || {};

window.AuctionHouse = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    artifactsRecovered: 0,
    maxArtifacts: 5,
    securityDown: 0,
    auctionDisrupted: false
  };
  var displayScreen = null;
  var gavel = null;
  var spotlight = null;
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastUKeyTime = 0;
  var hudVisible = true;
  var currentItemIndex = 0;
  var auctionItems = [
    { name: 'Diamond Scarab', color: 0x00FFFF },
    { name: 'Golden Sphinx Head', color: 0xFFD700 },
    { name: 'Jade Dragon Statue', color: 0x00FF00 },
    { name: 'Emerald Crown', color: 0x00AA44 },
    { name: 'Sapphire Amulet', color: 0x4466FF }
  ];

  function createAuctionPodium() {
    var group = new THREE.Group();

    // Main cylinder pedestal
    var pedestalGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16);
    var pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.7,
      metalness: 0.2
    });
    var pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
    pedestal.position.y = 1.25;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    group.add(pedestal);

    // Flat lectern surface (box)
    var lecternGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.8);
    var lecternMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      roughness: 0.6,
      metalness: 0.3
    });
    var lectern = new THREE.Mesh(lecternGeometry, lecternMaterial);
    lectern.position.y = 2.8;
    lectern.castShadow = true;
    lectern.receiveShadow = true;
    group.add(lectern);

    // Gavel (rotating box on top)
    var gavelGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.15);
    var gavelMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFCC99,
      roughness: 0.5,
      metalness: 0.4
    });
    gavel = new THREE.Mesh(gavelGeometry, gavelMaterial);
    gavel.position.y = 3.2;
    gavel.castShadow = true;
    gavel.receiveShadow = true;
    gavel.gavelData = { rotation: 0, speed: 0.08 };
    group.add(gavel);

    group.position.set(0, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createDisplayScreen() {
    // Large flat emissive screen
    var screenGeometry = new THREE.BoxGeometry(3, 2.5, 0.2);
    var screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      emissive: 0xFF8844,
      emissiveIntensity: 0.7,
      roughness: 0.3,
      metalness: 0.5
    });
    displayScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    displayScreen.position.set(8, 2, -8);
    displayScreen.castShadow = true;
    displayScreen.receiveShadow = true;
    displayScreen.screenData = {
      itemIndex: 0,
      cycleTime: 0,
      cycleDuration: 2.0
    };

    // Screen frame (box)
    var frameGeometry = new THREE.BoxGeometry(3.3, 2.8, 0.1);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.9,
      roughness: 0.2
    });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.copy(displayScreen.position);
    frame.position.z -= 0.15;
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);
    sceneObjects.push(frame);

    scene.add(displayScreen);
    sceneObjects.push(displayScreen);
  }

  function createDisplayPedestals() {
    var positions = [
      { x: -6, z: 4 },
      { x: -6, z: -4 },
      { x: 6, z: 4 },
      { x: 6, z: -4 }
    ];

    positions.forEach(function(pos) {
      var group = new THREE.Group();

      // Pedestal cylinder column
      var columnGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.8, 12);
      var columnMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.7,
        roughness: 0.3
      });
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.y = 0.9;
      column.castShadow = true;
      column.receiveShadow = true;
      group.add(column);

      // Artifact on top (sphere)
      var artifactGeometry = new THREE.SphereGeometry(0.35, 16, 16);
      var artifactMaterial = new THREE.MeshStandardMaterial({
        color: auctionItems[Math.floor(Math.random() * auctionItems.length)].color,
        emissive: auctionItems[Math.floor(Math.random() * auctionItems.length)].color,
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.3
      });
      var artifact = new THREE.Mesh(artifactGeometry, artifactMaterial);
      artifact.position.y = 2.3;
      artifact.castShadow = true;
      artifact.receiveShadow = true;
      group.add(artifact);

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createBidderSeating() {
    // Rows of seating benches
    var rowPositions = [
      { x: -4, z: 8 },
      { x: 0, z: 8 },
      { x: 4, z: 8 },
      { x: -4, z: 12 },
      { x: 0, z: 12 },
      { x: 4, z: 12 }
    ];

    rowPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Bench (flat box)
      var benchGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.8);
      var benchMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a1810,
        roughness: 0.8
      });
      var bench = new THREE.Mesh(benchGeometry, benchMaterial);
      bench.position.y = 0.4;
      bench.castShadow = true;
      bench.receiveShadow = true;
      group.add(bench);

      // Bidder silhouette (box figure)
      var figureGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      var figureMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.9
      });
      var figure = new THREE.Mesh(figureGeometry, figureMaterial);
      figure.position.y = 0.9;
      figure.castShadow = true;
      figure.receiveShadow = true;
      group.add(figure);

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createSecurityCheckpoint() {
    var group = new THREE.Group();

    // Frame structure (boxes)
    var frameTopGeometry = new THREE.BoxGeometry(2, 0.2, 0.15);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });

    var frameTop = new THREE.Mesh(frameTopGeometry, frameMaterial);
    frameTop.position.y = 2.2;
    frameTop.castShadow = true;
    frameTop.receiveShadow = true;
    group.add(frameTop);

    var frameLeft = new THREE.Mesh(frameTopGeometry, frameMaterial);
    frameLeft.rotation.z = Math.PI / 2;
    frameLeft.position.set(-1, 1.1, 0);
    frameLeft.scale.set(1, 5, 1);
    frameLeft.castShadow = true;
    frameLeft.receiveShadow = true;
    group.add(frameLeft);

    var frameRight = new THREE.Mesh(frameTopGeometry, frameMaterial);
    frameRight.rotation.z = Math.PI / 2;
    frameRight.position.set(1, 1.1, 0);
    frameRight.scale.set(1, 5, 1);
    frameRight.castShadow = true;
    frameRight.receiveShadow = true;
    group.add(frameRight);

    // Scanner (cylinder)
    var scannerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12);
    var scannerMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });
    var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
    scanner.rotation.z = Math.PI / 2;
    scanner.position.set(0, 1, 0);
    scanner.castShadow = true;
    scanner.receiveShadow = true;
    group.add(scanner);

    group.position.set(-10, 0, 6);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createVaultRoom() {
    var group = new THREE.Group();

    // Thick walls (boxes)
    var wallGeometry = new THREE.BoxGeometry(4, 3, 8);
    var wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.6,
      roughness: 0.4
    });
    var wallBack = new THREE.Mesh(wallGeometry, wallMaterial);
    wallBack.position.set(0, 1.5, -14);
    wallBack.castShadow = true;
    wallBack.receiveShadow = true;
    group.add(wallBack);

    // Massive vault door (large cylinder)
    var vaultDoorGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16);
    var vaultDoorMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.9,
      roughness: 0.1
    });
    var vaultDoor = new THREE.Mesh(vaultDoorGeometry, vaultDoorMaterial);
    vaultDoor.rotation.z = Math.PI / 2;
    vaultDoor.position.set(1.5, 1.5, -14);
    vaultDoor.castShadow = true;
    vaultDoor.receiveShadow = true;
    group.add(vaultDoor);

    // Vault handle (small box)
    var handleGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.1);
    var handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFCC99,
      metalness: 0.7
    });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(2.5, 1.5, -14);
    handle.castShadow = true;
    handle.receiveShadow = true;
    group.add(handle);

    group.position.set(0, 0, 0);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createVelvetRopeDividers() {
    // Rope dividers with cylinder posts
    var ropeLines = [
      { x1: -8, z1: 5, x2: -8, z2: 14 },
      { x1: 8, z1: 5, x2: 8, z2: 14 }
    ];

    ropeLines.forEach(function(line) {
      // Posts at both ends
      var postPositions = [
        { x: line.x1, z: line.z1 },
        { x: line.x2, z: line.z2 }
      ];

      postPositions.forEach(function(pos) {
        var postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        var postMaterial = new THREE.MeshStandardMaterial({
          color: 0x8B4513,
          roughness: 0.8
        });
        var post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(pos.x, 1, pos.z);
        post.castShadow = true;
        post.receiveShadow = true;
        scene.add(post);
        sceneObjects.push(post);
      });

      // Rope line (LineSegments)
      var ropeGeometry = new THREE.BufferGeometry();
      var vertices = new Float32Array([
        line.x1, 1.3, line.z1,
        line.x2, 1.3, line.z2
      ]);
      ropeGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      var ropeMaterial = new THREE.LineBasicMaterial({ color: 0xFFCC99, linewidth: 3 });
      var rope = new THREE.LineSegments(ropeGeometry, ropeMaterial);
      scene.add(rope);
      sceneObjects.push(rope);
    });
  }

  function createSecurityGuard(posX, posZ) {
    var group = new THREE.Group();

    // Body (box)
    var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.4);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Head (box for suit)
    var headGeometry = new THREE.BoxGeometry(0.28, 0.35, 0.3);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7
    });
    var head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.35;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    // Earpiece (small box)
    var earpieceGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.08);
    var earpieceMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.6
    });
    var earpiece = new THREE.Mesh(earpieceGeometry, earpieceMaterial);
    earpiece.position.set(0.15, 1.35, -0.2);
    group.add(earpiece);

    group.enemyData = {
      position: new THREE.Vector3(posX, 0, posZ),
      speed: 0.015 + Math.random() * 0.01,
      health: 150
    };
    group.position.copy(group.enemyData.position);
    group.castShadow = true;
    group.receiveShadow = true;

    scene.add(group);
    sceneObjects.push(group);
    enemies.push(group);
    return group;
  }

  function createSpotlight() {
    // Spotlight cone that rotates to track items
    var coneGeometry = new THREE.ConeGeometry(1.5, 4, 16);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.4
    });
    spotlight = new THREE.Mesh(coneGeometry, coneMaterial);
    spotlight.position.set(-2, 4, -6);
    spotlight.rotation.z = Math.PI / 2;
    spotlight.spotlightData = { rotation: 0, speed: 0.02 };
    spotlight.castShadow = true;
    spotlight.receiveShadow = true;

    scene.add(spotlight);
    sceneObjects.push(spotlight);
  }

  function updateGavel(delta) {
    if (!gavel) return;

    var data = gavel.gavelData;
    data.rotation += data.speed;
    gavel.rotation.z = Math.sin(data.rotation) * 0.3;
  }

  function updateDisplayScreen(delta) {
    if (!displayScreen) return;

    var data = displayScreen.screenData;
    data.cycleTime += delta;

    if (data.cycleTime >= data.cycleDuration) {
      data.cycleTime = 0;
      data.itemIndex = (data.itemIndex + 1) % auctionItems.length;
      currentItemIndex = data.itemIndex;

      // Change screen color based on current item
      var newColor = auctionItems[data.itemIndex].color;
      displayScreen.material.emissive.setHex(newColor);
    }
  }

  function updateSpotlight(delta) {
    if (!spotlight) return;

    var data = spotlight.spotlightData;
    data.rotation += data.speed;

    // Rotate spotlight to sweep across scene
    spotlight.position.x = Math.cos(data.rotation) * 6 - 2;
    spotlight.position.z = Math.sin(data.rotation) * 6 - 6;
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      var data = enemy.enemyData;

      // Patrol movement
      data.position.x += Math.cos(elapsedTime * 0.3 + data.position.z) * data.speed;
      data.position.z += data.speed * 0.5;

      // Boundary wrapping
      if (data.position.z > 15) {
        data.position.z = -5;
      }
      if (data.position.x > 12) {
        data.position.x = -12;
      }
      if (data.position.x < -12) {
        data.position.x = 12;
      }

      enemy.position.copy(data.position);
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'ARTIFACTS RECOVERED: ' + gameState.artifactsRecovered + '/' + gameState.maxArtifacts + '\n' +
                  'SECURITY DOWN: ' + gameState.securityDown + '\n' +
                  'AUCTION DISRUPTED: ' + (gameState.auctionDisrupted ? 'YES' : 'NO') + '\n' +
                  'CURRENT ITEM: ' + auctionItems[currentItemIndex].name;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'auction-house-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #FFD700; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.8); padding: 10px; border: 2px solid #FFD700; ' +
                                  'z-index: 100; text-shadow: 0 0 8px #FFD700;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();
      var key = event.key.toLowerCase();

      if (key === 'a') {
        lastAKeyTime = now;
      }

      if (key === 'u') {
        if (now - lastAKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ACTIVE' : 'HUD: HIDDEN';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #FFD700; font-family: monospace; font-size: 18px; ' +
                                'background: rgba(0, 0, 0, 0.9); padding: 15px; z-index: 200; ' +
                                'border: 3px solid #FFD700; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1200);
        }
        lastUKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene with luxury interior aesthetic
    scene.background = new THREE.Color(0x1a1410);
    scene.fog = new THREE.FogExp2(0x0a0805, 0.02);

    // Warm amber ambient lighting
    var ambientLight = new THREE.AmbientLight(0xCDAA70, 0.9);
    scene.add(ambientLight);

    // Directional light from above
    var directionalLight = new THREE.DirectionalLight(0xFFEECC, 0.8);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(30, 0.5, 30);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2f1a,
      roughness: 0.8,
      metalness: 0.1
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // Main structures
    createAuctionPodium();
    createDisplayScreen();
    createDisplayPedestals();
    createBidderSeating();
    createSecurityCheckpoint();
    createVaultRoom();
    createVelvetRopeDividers();
    createSpotlight();

    // Enemies: security guards
    createSecurityGuard(-8, 3);
    createSecurityGuard(8, -5);
    createSecurityGuard(0, 10);
    createSecurityGuard(6, 15);

    // Setup HUD and controls
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateGavel(delta);
    updateDisplayScreen(delta);
    updateSpotlight(delta);
    updateEnemies(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        scene.remove(child);
      }
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    displayScreen = null;
    gavel = null;
    spotlight = null;
    currentItemIndex = 0;
    gameState.artifactsRecovered = 0;
    gameState.securityDown = 0;
    gameState.auctionDisrupted = false;
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
