window.MuseumAssault = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var museum = {};
  var spotlights = [];
  var securityCameras = [];
  var fireSuppressionHeads = [];
  var shatteredGlass = [];
  var spotlightAngle = 0;
  var cameraRotation = 0;
  var fireTriggered = false;
  var fireParticles = [];

  function createGrandAtrium() {
    var atrium = new THREE.Group();
    atrium.name = 'Grand Atrium';

    // Main atrium hall - tall rectangular space
    var hallGeometry = new THREE.BoxGeometry(40, 50, 60);
    var hallMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
    var hallMesh = new THREE.Mesh(hallGeometry, hallMaterial);
    hallMesh.position.y = 25;
    hallMesh.castShadow = true;
    hallMesh.receiveShadow = true;
    atrium.add(hallMesh);

    // Floor - polished marble
    var floorGeometry = new THREE.BoxGeometry(40, 1, 60);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.5;
    floorMesh.receiveShadow = true;
    atrium.add(floorMesh);

    // Columns - cylindrical support pillars
    var columnRadius = 2;
    var columnHeight = 50;
    var columnGeometry = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 16);
    var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });

    var columnPositions = [[-15, 0, -20], [-15, 0, 20], [15, 0, -20], [15, 0, 20]];
    columnPositions.forEach(function(pos) {
      var column = new THREE.Mesh(columnGeometry, columnMaterial);
      column.position.set(pos[0], pos[1] + 25, pos[2]);
      column.castShadow = true;
      column.receiveShadow = true;
      atrium.add(column);
    });

    // Glass dome - transparent sphere at top
    var domeGeometry = new THREE.SphereGeometry(25, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    var domeMaterial = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.1
    });
    var domeMesh = new THREE.Mesh(domeGeometry, domeMaterial);
    domeMesh.position.y = 45;
    domeMesh.castShadow = true;
    atrium.add(domeMesh);

    // Spotlight in dome
    var spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 3, 0.5, 1);
    spotLight.position.set(0, 45, 0);
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    atrium.add(spotLight);
    spotlights.push({ light: spotLight, baseY: 45 });

    return atrium;
  }

  function createDinosaurHall() {
    var hall = new THREE.Group();
    hall.name = 'Dinosaur Hall';
    hall.position.set(-25, 0, 0);

    // Hall structure
    var hallGeometry = new THREE.BoxGeometry(30, 40, 50);
    var hallMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 });
    var hallMesh = new THREE.Mesh(hallGeometry, hallMaterial);
    hallMesh.position.y = 20;
    hallMesh.castShadow = true;
    hallMesh.receiveShadow = true;
    hall.add(hallMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(30, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xa0826d, roughness: 0.6 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.25;
    floorMesh.receiveShadow = true;
    hall.add(floorMesh);

    // Dinosaur skeleton - T-Rex style
    var skeletonGroup = new THREE.Group();
    skeletonGroup.position.set(0, 2, 0);

    // Spine - cylinder
    var spineGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
    var boneMaterial = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.7 });
    var spineMesh = new THREE.Mesh(spineGeometry, boneMaterial);
    spineMesh.rotation.z = Math.PI / 2;
    spineMesh.position.set(0, 8, 0);
    spineMesh.castShadow = true;
    skeletonGroup.add(spineMesh);

    // Ribcage - series of boxes
    for (var i = 0; i < 8; i++) {
      var ribGeometry = new THREE.BoxGeometry(0.5, 5, 0.3);
      var ribMesh = new THREE.Mesh(ribGeometry, boneMaterial);
      ribMesh.position.set(-3 - i * 0.5, 8, 2);
      ribMesh.rotation.z = (i - 4) * 0.2;
      ribMesh.castShadow = true;
      skeletonGroup.add(ribMesh);
    }

    // Skull - sphere
    var skullGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    var skullMesh = new THREE.Mesh(skullGeometry, boneMaterial);
    skullMesh.position.set(8, 10, 0);
    skullMesh.castShadow = true;
    skeletonGroup.add(skullMesh);

    // Legs - cylinders
    var legPositions = [[-2, 0, -2], [2, 0, -2], [-2, 0, 2], [2, 0, 2]];
    legPositions.forEach(function(pos) {
      var legGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
      var legMesh = new THREE.Mesh(legGeometry, boneMaterial);
      legMesh.position.set(pos[0], pos[1] + 3, pos[2]);
      legMesh.castShadow = true;
      skeletonGroup.add(legMesh);
    });

    // Tail - tapered cylinder
    var tailGeometry = new THREE.CylinderGeometry(1, 0.2, 12, 8);
    var tailMesh = new THREE.Mesh(tailGeometry, boneMaterial);
    tailMesh.rotation.z = Math.PI / 2;
    tailMesh.position.set(-10, 8, 0);
    tailMesh.castShadow = true;
    skeletonGroup.add(tailMesh);

    hall.add(skeletonGroup);
    museum.dinosaurSkeleton = skeletonGroup;

    return hall;
  }

  function createEgyptianWing() {
    var wing = new THREE.Group();
    wing.name = 'Egyptian Wing';
    wing.position.set(25, 0, 0);

    // Wing structure
    var wingGeometry = new THREE.BoxGeometry(30, 40, 50);
    var wingMaterial = new THREE.MeshStandardMaterial({ color: 0xe6b894, roughness: 0.8 });
    var wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
    wingMesh.position.y = 20;
    wingMesh.castShadow = true;
    wingMesh.receiveShadow = true;
    wing.add(wingMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(30, 0.5, 50);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.6 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.25;
    floorMesh.receiveShadow = true;
    wing.add(floorMesh);

    // Sarcophagus cases - rectangular boxes
    var sarcophagusGeometry = new THREE.BoxGeometry(4, 8, 2);
    var sarcophagusMaterial = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.6, metalness: 0.3 });

    var sarcPositions = [[-6, 4, -10], [-6, 4, 10], [6, 4, -10], [6, 4, 10]];
    sarcPositions.forEach(function(pos) {
      var sarc = new THREE.Mesh(sarcophagusGeometry, sarcophagusMaterial);
      sarc.position.set(pos[0], pos[1], pos[2]);
      sarc.castShadow = true;
      sarc.receiveShadow = true;
      wing.add(sarc);
    });

    // Stepped pyramid exhibit - stacked boxes
    var pyramidGroup = new THREE.Group();
    pyramidGroup.position.set(0, 0, 0);
    var pyramidMaterial = new THREE.MeshStandardMaterial({ color: 0xf4a460, roughness: 0.7 });

    for (var i = 0; i < 5; i++) {
      var stepGeometry = new THREE.BoxGeometry(12 - i * 2, 1, 12 - i * 2);
      var stepMesh = new THREE.Mesh(stepGeometry, pyramidMaterial);
      stepMesh.position.y = i + 4;
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      pyramidGroup.add(stepMesh);
    }
    wing.add(pyramidGroup);

    // Obelisk - tall tapered cylinder
    var obeliskGeometry = new THREE.CylinderGeometry(1.2, 1.5, 16, 8);
    var obeliskMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.5 });
    var obeliskMesh = new THREE.Mesh(obeliskGeometry, obeliskMaterial);
    obeliskMesh.position.set(0, 10, -18);
    obeliskMesh.castShadow = true;
    obeliskMesh.receiveShadow = true;
    wing.add(obeliskMesh);

    return wing;
  }

  function createAncientWeaponsRoom() {
    var room = new THREE.Group();
    room.name = 'Ancient Weapons Room';
    room.position.set(0, 0, -35);

    // Room structure
    var roomGeometry = new THREE.BoxGeometry(40, 35, 25);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.9 });
    var roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
    roomMesh.position.y = 17.5;
    roomMesh.castShadow = true;
    roomMesh.receiveShadow = true;
    room.add(roomMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(40, 0.5, 25);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.6 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.25;
    floorMesh.receiveShadow = true;
    room.add(floorMesh);

    // Wall display fixtures - boxes
    var displayGeometry = new THREE.BoxGeometry(0.5, 12, 3);
    var displayMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });

    var displayPositions = [[-18, 8, 0], [-8, 8, 0], [8, 8, 0], [18, 8, 0]];
    displayPositions.forEach(function(pos) {
      var display = new THREE.Mesh(displayGeometry, displayMaterial);
      display.position.set(pos[0], pos[1], pos[2]);
      display.castShadow = true;
      room.add(display);

      // Spears - tall thin cylinders on display
      var spearGeometry = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
      var spearMaterial = new THREE.MeshStandardMaterial({ color: 0x8b8b7a, roughness: 0.6 });
      var spear = new THREE.Mesh(spearGeometry, spearMaterial);
      spear.position.set(pos[0] - 1.5, pos[1] + 2, pos[2]);
      spear.castShadow = true;
      room.add(spear);

      // Shields - flat boxes
      var shieldGeometry = new THREE.BoxGeometry(3, 4, 0.3);
      var shieldMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.5 });
      var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      shield.position.set(pos[0] + 1, pos[1] + 2, pos[2]);
      shield.castShadow = true;
      room.add(shield);
    });

    return room;
  }

  function createModernArtWing() {
    var wing = new THREE.Group();
    wing.name = 'Modern Art Wing';
    wing.position.set(0, 0, 35);

    // Wing structure
    var wingGeometry = new THREE.BoxGeometry(40, 45, 25);
    var wingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
    var wingMesh = new THREE.Mesh(wingGeometry, wingMaterial);
    wingMesh.position.y = 22.5;
    wingMesh.castShadow = true;
    wingMesh.receiveShadow = true;
    wing.add(wingMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(40, 0.5, 25);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.4 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.25;
    floorMesh.receiveShadow = true;
    wing.add(floorMesh);

    // Abstract sculptures - varied geometric shapes
    var sculptureGeometry1 = new THREE.BoxGeometry(3, 12, 3);
    var sculptureGeometry2 = new THREE.CylinderGeometry(2, 2, 10, 8);
    var sculptureGeometry3 = new THREE.SphereGeometry(3, 16, 16);
    var sculptureGeometry4 = new THREE.ConeGeometry(2, 8, 8);

    var sculptMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, roughness: 0.5, metalness: 0.4 });
    var sculptMaterial2 = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.5, metalness: 0.4 });
    var sculptMaterial3 = new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.5, metalness: 0.4 });

    var scul1 = new THREE.Mesh(sculptureGeometry1, sculptMaterial);
    scul1.position.set(-12, 8, 0);
    scul1.castShadow = true;
    wing.add(scul1);

    var scul2 = new THREE.Mesh(sculptureGeometry2, sculptMaterial2);
    scul2.position.set(0, 7, 0);
    scul2.castShadow = true;
    wing.add(scul2);

    var scul3 = new THREE.Mesh(sculptureGeometry3, sculptMaterial3);
    scul3.position.set(12, 6, 0);
    scul3.castShadow = true;
    wing.add(scul3);

    var scul4 = new THREE.Mesh(sculptureGeometry4, sculptMaterial);
    scul4.position.set(-6, 6, -8);
    scul4.castShadow = true;
    wing.add(scul4);

    return wing;
  }

  function createGiftShop() {
    var shop = new THREE.Group();
    shop.name = 'Gift Shop';
    shop.position.set(0, 0, -60);

    // Shop structure
    var shopGeometry = new THREE.BoxGeometry(25, 30, 20);
    var shopMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc, roughness: 0.8 });
    var shopMesh = new THREE.Mesh(shopGeometry, shopMaterial);
    shopMesh.position.y = 15;
    shopMesh.castShadow = true;
    shopMesh.receiveShadow = true;
    shop.add(shopMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(25, 0.5, 20);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.6 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.25;
    floorMesh.receiveShadow = true;
    shop.add(floorMesh);

    // Counter - tall box
    var counterGeometry = new THREE.BoxGeometry(6, 3, 2);
    var counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
    var counterMesh = new THREE.Mesh(counterGeometry, counterMaterial);
    counterMesh.position.set(0, 1.5, 6);
    counterMesh.castShadow = true;
    shop.add(counterMesh);

    // Shelves - stacked boxes
    for (var i = 0; i < 3; i++) {
      var shelfGeometry = new THREE.BoxGeometry(8, 0.5, 3);
      var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7 });
      var shelfMesh = new THREE.Mesh(shelfGeometry, shelfMaterial);
      shelfMesh.position.set(-6, 2 + i * 3, -6);
      shelfMesh.castShadow = true;
      shop.add(shelfMesh);
    }

    return shop;
  }

  function createSecurityOffice() {
    var office = new THREE.Group();
    office.name = 'Security Office';
    office.position.set(-40, 0, 35);

    // Office structure
    var officeGeometry = new THREE.BoxGeometry(15, 25, 15);
    var officeMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.8 });
    var officeMesh = new THREE.Mesh(officeGeometry, officeMaterial);
    officeMesh.position.y = 12.5;
    officeMesh.castShadow = true;
    officeMesh.receiveShadow = true;
    office.add(officeMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(15, 0.5, 15);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.6 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.25;
    floorMesh.receiveShadow = true;
    office.add(floorMesh);

    // Monitor - sphere on wall
    var monitorGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    var monitorMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00aa00,
      emissiveIntensity: 0.5
    });
    var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(-6, 10, -6);
    monitor.castShadow = true;
    office.add(monitor);

    // Camera on pole - cylinder with sphere
    var cameraGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var cameraMount = new THREE.Mesh(cameraGeometry, cameraMaterial);
    cameraMount.position.set(0, 8, 0);
    office.add(cameraMount);

    var cameraHeadGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    var cameraHeadMesh = new THREE.Mesh(cameraHeadGeometry, cameraMaterial);
    cameraHeadMesh.position.set(0, 10, 0);
    cameraHeadMesh.castShadow = true;
    office.add(cameraHeadMesh);

    securityCameras.push({
      mesh: cameraHeadMesh,
      mount: cameraMount,
      baseRotation: 0
    });

    return office;
  }

  function createDisplayCases() {
    var casesGroup = new THREE.Group();
    casesGroup.name = 'Display Cases';

    var caseGeometry = new THREE.BoxGeometry(3, 4, 2);
    var caseMaterial = new THREE.MeshStandardMaterial({
      color: 0xccffff,
      transparent: true,
      opacity: 0.6,
      metalness: 0.3
    });

    var casePositions = [
      [-12, 2, 5], [-4, 2, 5], [4, 2, 5], [12, 2, 5],
      [-12, 2, -10], [4, 2, -10]
    ];

    casePositions.forEach(function(pos) {
      var caseBox = new THREE.Mesh(caseGeometry, caseMaterial);
      caseBox.position.set(pos[0], pos[1], pos[2]);
      caseBox.castShadow = true;
      caseBox.receiveShadow = true;
      casesGroup.add(caseBox);
    });

    return casesGroup;
  }

  function createMarbleStaircase() {
    var staircase = new THREE.Group();
    staircase.name = 'Marble Staircase';
    staircase.position.set(40, 0, 0);

    var stepMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

    for (var i = 0; i < 10; i++) {
      var stepGeometry = new THREE.BoxGeometry(8, 1, 1);
      var stepMesh = new THREE.Mesh(stepGeometry, stepMaterial);
      stepMesh.position.set(0, i * 1.5, i * 1.2);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      staircase.add(stepMesh);
    }

    // Bannister - cylinder posts and rails
    var banisterGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
    var banisterMaterial = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.5, metalness: 0.8 });

    for (var j = 0; j < 10; j++) {
      var post = new THREE.Mesh(banisterGeometry, banisterMaterial);
      post.position.set(4.5, j * 1.5 + 1, j * 1.2);
      post.castShadow = true;
      staircase.add(post);
    }

    return staircase;
  }

  function createUndergroundVault() {
    var vault = new THREE.Group();
    vault.name = 'Underground Vault';
    vault.position.set(0, -30, 0);

    // Reinforced vault structure - thick walls
    var vaultGeometry = new THREE.BoxGeometry(30, 20, 30);
    var vaultMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9, metalness: 0.6 });
    var vaultMesh = new THREE.Mesh(vaultGeometry, vaultMaterial);
    vaultMesh.position.y = 10;
    vaultMesh.castShadow = true;
    vaultMesh.receiveShadow = true;
    vault.add(vaultMesh);

    // Floor
    var floorGeometry = new THREE.BoxGeometry(30, 1, 30);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    var floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.position.y = 0.5;
    floorMesh.receiveShadow = true;
    vault.add(floorMesh);

    // Vault door - large reinforced box
    var doorGeometry = new THREE.BoxGeometry(8, 10, 0.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.9 });
    var doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(0, 6, 15);
    doorMesh.castShadow = true;
    vault.add(doorMesh);

    return vault;
  }

  function createEnvironmentalDetails() {
    var detailsGroup = new THREE.Group();
    detailsGroup.name = 'Environmental Details';

    // Fire suppression heads - spheres scattered
    var fireHeadGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var fireHeadMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });

    var fireHeadPositions = [
      [10, 48, 0], [-10, 48, 0], [0, 48, 15], [0, 48, -15],
      [-20, 40, -20], [20, 40, 20], [15, 40, 0], [-15, 40, 0]
    ];

    fireHeadPositions.forEach(function(pos) {
      var head = new THREE.Mesh(fireHeadGeometry, fireHeadMaterial);
      head.position.set(pos[0], pos[1], pos[2]);
      head.castShadow = true;
      detailsGroup.add(head);
      fireSuppressionHeads.push(head);
    });

    // Sandbag barricade - stacked boxes
    var sandbagGeometry = new THREE.BoxGeometry(1, 0.8, 1);
    var sandbagMaterial = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.9 });

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 5; j++) {
        var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
        sandbag.position.set(-35 + j * 1.1, 0.4 + i * 0.9, 10);
        sandbag.castShadow = true;
        sandbag.receiveShadow = true;
        detailsGroup.add(sandbag);
      }
    }

    // Looted artifacts on floor - scattered small boxes
    var artifactGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var artifactMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.7 });

    var artifactPositions = [
      [5, 0.3, 8], [8, 0.3, 12], [-8, 0.3, 6], [2, 0.3, -10], [-5, 0.3, -8]
    ];

    artifactPositions.forEach(function(pos) {
      var artifact = new THREE.Mesh(artifactGeometry, artifactMaterial);
      artifact.position.set(pos[0], pos[1], pos[2]);
      artifact.castShadow = true;
      artifact.receiveShadow = true;
      detailsGroup.add(artifact);
    });

    // Broken display case - shattered appearance
    var brokenGeometry = new THREE.BoxGeometry(3, 4, 2);
    var brokenMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.8,
      wireframe: true
    });
    var brokenCase = new THREE.Mesh(brokenGeometry, brokenMaterial);
    brokenCase.position.set(15, 2, -8);
    brokenCase.castShadow = true;
    brokenCase.receiveShadow = true;
    detailsGroup.add(brokenCase);
    museum.brokenCase = brokenCase;

    return detailsGroup;
  }

  function init(inScene, inCamera) {
    scene = inScene;
    camera = inCamera;

    // Add all museum sections
    var atrium = createGrandAtrium();
    scene.add(atrium);

    var dinoHall = createDinosaurHall();
    scene.add(dinoHall);

    var egyptWing = createEgyptianWing();
    scene.add(egyptWing);

    var weaponsRoom = createAncientWeaponsRoom();
    scene.add(weaponsRoom);

    var artWing = createModernArtWing();
    scene.add(artWing);

    var giftShop = createGiftShop();
    scene.add(giftShop);

    var secOffice = createSecurityOffice();
    scene.add(secOffice);

    var displayCases = createDisplayCases();
    scene.add(displayCases);

    var staircase = createMarbleStaircase();
    scene.add(staircase);

    var vault = createUndergroundVault();
    scene.add(vault);

    var details = createEnvironmentalDetails();
    scene.add(details);

    // Setup lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
  }

  function update(delta) {
    // Spotlight sweep animation
    spotlightAngle += delta * 0.5;
    spotlights.forEach(function(spotlight) {
      var angle = spotlightAngle;
      spotlight.light.position.x = Math.sin(angle) * 30;
      spotlight.light.position.z = Math.cos(angle) * 30;
    });

    // Security camera rotation
    cameraRotation += delta * 0.3;
    securityCameras.forEach(function(camera) {
      camera.mesh.rotation.y = Math.sin(cameraRotation) * 0.5;
    });

    // Broken case shimmer effect
    if (museum.brokenCase) {
      museum.brokenCase.rotation.x += delta * 0.05;
      museum.brokenCase.rotation.z += delta * 0.03;
    }

    // Dinosaur skeleton slight sway
    if (museum.dinosaurSkeleton) {
      museum.dinosaurSkeleton.rotation.z = Math.sin(spotlightAngle * 0.3) * 0.02;
    }

    // Fire suppression trigger animation
    if (fireTriggered && fireParticles.length > 0) {
      fireParticles.forEach(function(particle, index) {
        particle.position.y += delta * 5;
        particle.position.x += (Math.random() - 0.5) * delta * 3;
        particle.position.z += (Math.random() - 0.5) * delta * 3;
        particle.material.opacity -= delta * 0.5;

        if (particle.material.opacity <= 0) {
          scene.remove(particle);
          fireParticles.splice(index, 1);
        }
      });
    }

    // Reset fire trigger if particles gone
    if (fireParticles.length === 0) {
      fireTriggered = false;
    }
  }

  function reset() {
    spotlightAngle = 0;
    cameraRotation = 0;
    fireTriggered = false;

    fireParticles.forEach(function(particle) {
      scene.remove(particle);
    });
    fireParticles = [];

    if (museum.brokenCase) {
      museum.brokenCase.rotation.set(0, 0, 0);
    }

    if (museum.dinosaurSkeleton) {
      museum.dinosaurSkeleton.rotation.set(0, 0, 0);
    }

    spotlights.forEach(function(spotlight) {
      spotlight.light.position.set(0, spotlight.baseY, 0);
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
