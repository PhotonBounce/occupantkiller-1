window.BlastedBridge = (function() {
  'use strict';

  var objects = [];
  var fireGlows = [];
  var bridgeGroup = null;
  var swayRotation = 0;

  function createMaterial(color, emissive) {
    emissive = emissive || 0x000000;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      metalness: 0.4,
      roughness: 0.7
    });
  }

  function createLineSegments(points, color) {
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    var material = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    var line = new THREE.LineSegments(geometry, material);
    return line;
  }

  function addObject(mesh) {
    objects.push(mesh);
    bridgeGroup.add(mesh);
  }

  function createMainBridgeDeck(scene) {
    var deckLength = 70;
    var deckWidth = 8;
    var deckThickness = 1.2;

    // Left half of deck (intact)
    var leftDeckGeo = new THREE.BoxGeometry(30, deckThickness, deckWidth);
    var leftDeckMat = createMaterial(0x888888);
    var leftDeck = new THREE.Mesh(leftDeckGeo, leftDeckMat);
    leftDeck.position.set(-20, 8, 0);
    leftDeck.castShadow = true;
    leftDeck.receiveShadow = true;
    addObject(leftDeck);

    // Right half of deck (damaged but exists)
    var rightDeckGeo = new THREE.BoxGeometry(25, deckThickness, deckWidth);
    var rightDeckMat = createMaterial(0x777777);
    var rightDeck = new THREE.Mesh(rightDeckGeo, rightDeckMat);
    rightDeck.position.set(22, 7.5, 0);
    rightDeck.rotation.z = 0.15;
    rightDeck.castShadow = true;
    rightDeck.receiveShadow = true;
    addObject(rightDeck);

    // Collapsed middle section - create jagged gap
    var gapStart = -5;
    var gapEnd = 5;

    // Add some remaining broken pieces in gap
    for (var i = 0; i < 5; i++) {
      var rubbleGeo = new THREE.BoxGeometry(2, 0.8, deckWidth + 2);
      var rubbleMat = createMaterial(0x666666);
      var rubble = new THREE.Mesh(rubbleGeo, rubbleMat);
      rubble.position.set(gapStart + (i * 2.5), 6 + Math.random() * 2, Math.random() * 1 - 0.5);
      rubble.rotation.z = (Math.random() - 0.5) * 0.5;
      rubble.rotation.x = (Math.random() - 0.5) * 0.3;
      rubble.castShadow = true;
      rubble.receiveShadow = true;
      addObject(rubble);
    }
  }

  function createBridgeTowers() {
    var towerHeight = 22;
    var towerWidth = 3;
    var towerDepth = 4;

    // Left tower
    var leftTowerGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
    var towerMat = createMaterial(0x555555);
    var leftTower = new THREE.Mesh(leftTowerGeo, towerMat);
    leftTower.position.set(-33, 9, 0);
    leftTower.castShadow = true;
    leftTower.receiveShadow = true;
    addObject(leftTower);

    // Right tower
    var rightTowerGeo = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
    var rightTower = new THREE.Mesh(rightTowerGeo, towerMat);
    rightTower.position.set(33, 9, 0);
    rightTower.castShadow = true;
    rightTower.receiveShadow = true;
    addObject(rightTower);

    // Mid-span tower (damaged)
    var midTowerGeo = new THREE.BoxGeometry(towerWidth * 1.2, towerHeight * 0.8, towerDepth * 1.2);
    var midTowerMat = createMaterial(0x444444);
    var midTower = new THREE.Mesh(midTowerGeo, midTowerMat);
    midTower.position.set(0, 8, 0);
    midTower.rotation.z = 0.1;
    midTower.castShadow = true;
    midTower.receiveShadow = true;
    addObject(midTower);
  }

  function createSuspensionCables() {
    var cableColor = 0x333333;

    // Left tower to left deck cables (4 cables)
    for (var i = 0; i < 4; i++) {
      var offset = (i - 1.5) * 2;
      var points = [
        -33, 20, offset,
        -20, 8, offset,
      ];
      var cable = createLineSegments(points, cableColor);
      addObject(cable);
    }

    // Right tower to right deck cables (4 cables)
    for (var i = 0; i < 4; i++) {
      var offset = (i - 1.5) * 2;
      var points = [
        33, 20, offset,
        22, 8, offset,
      ];
      var cable = createLineSegments(points, cableColor);
      addObject(cable);
    }

    // Mid-tower to left deck (damaged)
    for (var i = 0; i < 3; i++) {
      var offset = (i - 1) * 1.5;
      var points = [
        0, 15, offset,
        -15, 8, offset + 1,
      ];
      var cable = createLineSegments(points, 0x222222);
      addObject(cable);
    }

    // Mid-tower to right deck (damaged)
    for (var i = 0; i < 3; i++) {
      var offset = (i - 1) * 1.5;
      var points = [
        0, 15, offset,
        15, 8, offset + 1,
      ];
      var cable = createLineSegments(points, 0x222222);
      addObject(cable);
    }
  }

  function createSupportPillars() {
    var pillarRadius = 1.2;
    var pillarHeight = 18;

    // Left support pillar
    var leftPillarGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.1, pillarHeight, 12);
    var pillarMat = createMaterial(0x999999);
    var leftPillar = new THREE.Mesh(leftPillarGeo, pillarMat);
    leftPillar.position.set(-35, 9, -5);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    addObject(leftPillar);

    // Right support pillar
    var rightPillarGeo = new THREE.CylinderGeometry(pillarRadius, pillarRadius * 1.1, pillarHeight, 12);
    var rightPillar = new THREE.Mesh(rightPillarGeo, pillarMat);
    rightPillar.position.set(35, 9, -5);
    rightPillar.castShadow = true;
    rightPillar.receiveShadow = true;
    addObject(rightPillar);

    // Center support pillar (damaged, tilted)
    var centerPillarGeo = new THREE.CylinderGeometry(pillarRadius * 0.9, pillarRadius, pillarHeight * 0.9, 12);
    var centerPillar = new THREE.Mesh(centerPillarGeo, pillarMat);
    centerPillar.position.set(0, 8, 5);
    centerPillar.rotation.z = 0.2;
    centerPillar.castShadow = true;
    centerPillar.receiveShadow = true;
    addObject(centerPillar);

    // Extra support columns under left deck
    for (var i = 0; i < 2; i++) {
      var extraGeo = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
      var extra = new THREE.Mesh(extraGeo, pillarMat);
      extra.position.set(-25 + i * 8, 7.5, -6);
      extra.castShadow = true;
      extra.receiveShadow = true;
      addObject(extra);
    }

    // Extra support columns under right deck
    for (var i = 0; i < 2; i++) {
      var extraGeo = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
      var extra = new THREE.Mesh(extraGeo, pillarMat);
      extra.position.set(15 + i * 10, 7.5, -6);
      extra.castShadow = true;
      extra.receiveShadow = true;
      addObject(extra);
    }
  }

  function createCollapsedDebris() {
    var debrisCount = 16;

    for (var i = 0; i < debrisCount; i++) {
      var width = 3 + Math.random() * 4;
      var height = 1 + Math.random() * 2;
      var depth = 2 + Math.random() * 3;

      var debrisGeo = new THREE.BoxGeometry(width, height, depth);
      var debrisMat = createMaterial(0x777777);
      var debris = new THREE.Mesh(debrisGeo, debrisMat);

      var spreadX = -8 + Math.random() * 16;
      var spreadZ = -15 + Math.random() * 10;
      debris.position.set(spreadX, -8 + Math.random() * 4, spreadZ);
      debris.rotation.x = (Math.random() - 0.5) * Math.PI * 0.6;
      debris.rotation.y = (Math.random() - 0.5) * Math.PI * 0.6;
      debris.rotation.z = (Math.random() - 0.5) * Math.PI * 0.5;
      debris.castShadow = true;
      debris.receiveShadow = true;
      addObject(debris);
    }
  }

  function createGorgeWalls() {
    var wallThickness = 15;
    var wallHeight = 25;
    var wallLength = 80;

    // Left gorge wall
    var leftWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var wallMat = createMaterial(0x666666);
    var leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-45, 0, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    addObject(leftWall);

    // Right gorge wall
    var rightWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(45, 0, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    addObject(rightWall);

    // Far gorge walls for depth
    var farWallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var farWallMat = createMaterial(0x555555);

    var farWallNear = new THREE.Mesh(farWallGeo, farWallMat);
    farWallNear.position.set(0, 0, -45);
    farWallNear.castShadow = true;
    farWallNear.receiveShadow = true;
    addObject(farWallNear);

    var farWallFar = new THREE.Mesh(farWallGeo, farWallMat);
    farWallFar.position.set(0, 0, 45);
    farWallFar.castShadow = true;
    farWallFar.receiveShadow = true;
    addObject(farWallFar);
  }

  function createRiverWater() {
    var waterGeo = new THREE.BoxGeometry(90, 0.5, 90);
    var waterMat = createMaterial(0x2a4a6a, 0x1a2a4a);
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, -18, 0);
    water.castShadow = true;
    water.receiveShadow = true;
    addObject(water);
  }

  function createCraters() {
    var craterCount = 6;

    for (var i = 0; i < craterCount; i++) {
      var craterGeo = new THREE.BoxGeometry(3, 0.5, 3);
      var craterMat = createMaterial(0x555555);
      var crater = new THREE.Mesh(craterGeo, craterMat);

      var posX = -25 + Math.random() * 40;
      var posZ = -3 + Math.random() * 6;
      crater.position.set(posX, 6.5, posZ);
      crater.scale.set(1, 0.3, 1);
      crater.castShadow = true;
      crater.receiveShadow = true;
      addObject(crater);

      // Crater rim detail
      var rimGeo = new THREE.BoxGeometry(3.5, 0.2, 3.5);
      var rimMat = createMaterial(0x666666);
      var rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(posX, 7.1, posZ);
      rim.castShadow = true;
      rim.receiveShadow = true;
      addObject(rim);
    }
  }

  function createDestroyedVehicles() {
    // Destroyed truck on left deck
    var truck1BodyGeo = new THREE.BoxGeometry(3, 2, 6);
    var vehicleMat = createMaterial(0x554433);
    var truck1Body = new THREE.Mesh(truck1BodyGeo, vehicleMat);
    truck1Body.position.set(-22, 9.5, 2);
    truck1Body.rotation.z = 0.3;
    truck1Body.castShadow = true;
    truck1Body.receiveShadow = true;
    addObject(truck1Body);

    // Truck cabin
    var truck1CabinGeo = new THREE.BoxGeometry(2.5, 1.8, 2);
    var truck1Cabin = new THREE.Mesh(truck1CabinGeo, vehicleMat);
    truck1Cabin.position.set(-20, 10.5, 3.5);
    truck1Cabin.rotation.z = 0.3;
    truck1Cabin.castShadow = true;
    truck1Cabin.receiveShadow = true;
    addObject(truck1Cabin);

    // Truck wheels
    for (var i = 0; i < 2; i++) {
      var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
      var wheelMat = createMaterial(0x222222);
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(-23 + i * 4, 8, 0.5);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      addObject(wheel);
    }

    // Fire glow in truck 1
    var fireGeo1 = new THREE.SphereGeometry(1.5, 8, 8);
    var fireMat1 = new THREE.MeshBasicMaterial({ color: 0xff6633 });
    var fire1 = new THREE.Mesh(fireGeo1, fireMat1);
    fire1.position.set(-20, 10.8, 3);
    addObject(fire1);
    fireGlows.push({ mesh: fire1, intensity: 1, phase: 0 });

    // Destroyed tank on right deck
    var tankBodyGeo = new THREE.BoxGeometry(3.5, 2.2, 8);
    var tankMat = createMaterial(0x556655);
    var tankBody = new THREE.Mesh(tankBodyGeo, tankMat);
    tankBody.position.set(20, 8.5, -1);
    tankBody.rotation.z = -0.25;
    tankBody.castShadow = true;
    tankBody.receiveShadow = true;
    addObject(tankBody);

    // Tank turret (knocked askew)
    var turretGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 12);
    var turretMat = createMaterial(0x445544);
    var turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.set(20.5, 10.5, -1.5);
    turret.rotation.z = 0.4;
    turret.castShadow = true;
    turret.receiveShadow = true;
    addObject(turret);

    // Tank gun barrel
    var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var barrelMat = createMaterial(0x333333);
    var barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = 0.5;
    barrel.position.set(22, 10.5, -1.5);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    addObject(barrel);

    // Fire glow in tank
    var fireGeo2 = new THREE.SphereGeometry(1.3, 8, 8);
    var fireMat2 = new THREE.MeshBasicMaterial({ color: 0xff5522 });
    var fire2 = new THREE.Mesh(fireGeo2, fireMat2);
    fire2.position.set(21, 10, -0.5);
    addObject(fire2);
    fireGlows.push({ mesh: fire2, intensity: 1, phase: Math.PI / 2 });

    // Additional vehicle debris pieces
    var debrisVehicleCount = 8;
    for (var i = 0; i < debrisVehicleCount; i++) {
      var pieceGeo = new THREE.BoxGeometry(1 + Math.random() * 1.5, 0.5 + Math.random() * 0.8, 1 + Math.random() * 1.5);
      var pieceMat = createMaterial(0x664444);
      var piece = new THREE.Mesh(pieceGeo, pieceMat);
      piece.position.set(-15 + Math.random() * 30, 7 + Math.random() * 3, -2 + Math.random() * 4);
      piece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      piece.castShadow = true;
      piece.receiveShadow = true;
      addObject(piece);
    }
  }

  function createGuardBunkers() {
    // Left bunker
    var leftBunkerGeo = new THREE.BoxGeometry(4, 2.5, 5);
    var bunkerMat = createMaterial(0x888877);
    var leftBunker = new THREE.Mesh(leftBunkerGeo, bunkerMat);
    leftBunker.position.set(-30, 8.5, -4);
    leftBunker.castShadow = true;
    leftBunker.receiveShadow = true;
    addObject(leftBunker);

    // Left bunker firing port
    var leftPortGeo = new THREE.BoxGeometry(1, 0.8, 0.2);
    var portMat = createMaterial(0x333333);
    var leftPort = new THREE.Mesh(leftPortGeo, portMat);
    leftPort.position.set(-30, 9.5, -7);
    leftPort.castShadow = true;
    leftPort.receiveShadow = true;
    addObject(leftPort);

    // Right bunker
    var rightBunkerGeo = new THREE.BoxGeometry(4, 2.5, 5);
    var rightBunker = new THREE.Mesh(rightBunkerGeo, bunkerMat);
    rightBunker.position.set(28, 8.5, -4);
    rightBunker.castShadow = true;
    rightBunker.receiveShadow = true;
    addObject(rightBunker);

    // Right bunker firing port
    var rightPortGeo = new THREE.BoxGeometry(1, 0.8, 0.2);
    var rightPort = new THREE.Mesh(rightPortGeo, portMat);
    rightPort.position.set(28, 9.5, -7);
    rightPort.castShadow = true;
    rightPort.receiveShadow = true;
    addObject(rightPort);

    // Bunker roof details (slanted)
    var leftRoofGeo = new THREE.BoxGeometry(4.2, 0.3, 5.2);
    var roofMat = createMaterial(0x777766);
    var leftRoof = new THREE.Mesh(leftRoofGeo, roofMat);
    leftRoof.position.set(-30, 11, -4);
    leftRoof.castShadow = true;
    leftRoof.receiveShadow = true;
    addObject(leftRoof);

    var rightRoof = new THREE.Mesh(leftRoofGeo, roofMat);
    rightRoof.position.set(28, 11, -4);
    rightRoof.castShadow = true;
    rightRoof.receiveShadow = true;
    addObject(rightRoof);
  }

  function createRopeBridge() {
    var ropeColor = 0x8B7355;

    // Two main support ropes on sides
    var leftRopePoints = [
      -5, 6, -3,
      5, 6, -3,
    ];
    var leftRope = createLineSegments(leftRopePoints, ropeColor);
    addObject(leftRope);

    var rightRopePoints = [
      -5, 6, 3,
      5, 6, 3,
    ];
    var rightRope = createLineSegments(rightRopePoints, ropeColor);
    addObject(rightRope);

    // Vertical support ropes
    for (var i = 0; i < 6; i++) {
      var xPos = -4 + (i * 1.8);
      var verticalRopePoints = [
        xPos, 6.5, -3,
        xPos, 4.5, -3,
      ];
      var verticalRope = createLineSegments(verticalRopePoints, ropeColor);
      addObject(verticalRope);

      var verticalRope2Points = [
        xPos, 6.5, 3,
        xPos, 4.5, 3,
      ];
      var verticalRope2 = createLineSegments(verticalRope2Points, ropeColor);
      addObject(verticalRope2);
    }

    // Diagonal cross bracing
    for (var i = 0; i < 5; i++) {
      var xStart = -4 + (i * 1.8);
      var xEnd = -4 + ((i + 1) * 1.8);

      var diag1Points = [
        xStart, 6, -3,
        xEnd, 5, 3,
      ];
      var diag1 = createLineSegments(diag1Points, ropeColor);
      addObject(diag1);

      var diag2Points = [
        xStart, 6, 3,
        xEnd, 5, -3,
      ];
      var diag2 = createLineSegments(diag2Points, ropeColor);
      addObject(diag2);
    }

    // Rope bridge wooden platform (small boxes)
    for (var i = 0; i < 8; i++) {
      var plankGeo = new THREE.BoxGeometry(0.3, 0.1, 2);
      var plankMat = createMaterial(0x8B6F47);
      var plank = new THREE.Mesh(plankGeo, plankMat);
      plank.position.set(-3.5 + i * 1.2, 4.5, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      addObject(plank);
    }
  }

  function createSandbagPositions() {
    // Left deck sandbag position
    for (var i = 0; i < 4; i++) {
      var bagGeo = new THREE.BoxGeometry(1, 0.8, 0.6);
      var bagMat = createMaterial(0x997744);
      var bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(-28 + i * 1.2, 8.8, 3.5);
      bag.castShadow = true;
      bag.receiveShadow = true;
      addObject(bag);
    }

    // Right deck sandbag position
    for (var i = 0; i < 4; i++) {
      var bagGeo = new THREE.BoxGeometry(1, 0.8, 0.6);
      var bagMat = createMaterial(0x997744);
      var bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(15 + i * 1.2, 8.3, -3.5);
      bag.castShadow = true;
      bag.receiveShadow = true;
      addObject(bag);
    }

    // Center gap sandbag defensive line
    for (var i = 0; i < 3; i++) {
      var bagGeo = new THREE.BoxGeometry(1, 0.8, 0.6);
      var bagMat = createMaterial(0x997744);
      var bag = new THREE.Mesh(bagGeo, bagMat);
      bag.position.set(-3 + i * 2, 8.2, 0);
      bag.castShadow = true;
      bag.receiveShadow = true;
      addObject(bag);
    }

    // Additional stacked sandbag formations
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        var stackGeo = new THREE.BoxGeometry(0.9, 0.7, 0.6);
        var stackMat = createMaterial(0x887733);
        var stack = new THREE.Mesh(stackGeo, stackMat);
        stack.position.set(-12 + i * 3, 8.5 + j * 0.8, 4 - j * 0.3);
        stack.castShadow = true;
        stack.receiveShadow = true;
        addObject(stack);
      }
    }

    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        var stackGeo = new THREE.BoxGeometry(0.9, 0.7, 0.6);
        var stackMat = createMaterial(0x887733);
        var stack = new THREE.Mesh(stackGeo, stackMat);
        stack.position.set(8 + i * 3, 8.5 + j * 0.8, -4 + j * 0.3);
        stack.castShadow = true;
        stack.receiveShadow = true;
        addObject(stack);
      }
    }
  }

  function createAdditionalDetail() {
    // Explosion impact craters and scorch marks (more crater boxes)
    for (var i = 0; i < 8; i++) {
      var scorchGeo = new THREE.BoxGeometry(2 + Math.random() * 2, 0.3, 2 + Math.random() * 2);
      var scorchMat = createMaterial(0x333333);
      var scorch = new THREE.Mesh(scorchGeo, scorchMat);
      scorch.position.set(-20 + Math.random() * 40, 8.05, -3 + Math.random() * 6);
      scorch.castShadow = true;
      scorch.receiveShadow = true;
      addObject(scorch);
    }

    // Broken guardrail segments
    for (var i = 0; i < 12; i++) {
      var railGeo = new THREE.BoxGeometry(0.2, 1, 4);
      var railMat = createMaterial(0x999999);
      var rail = new THREE.Mesh(railGeo, railMat);
      var posX = -30 + i * 5;
      rail.position.set(posX, 9.5, 4.5);
      rail.rotation.z = (Math.random() - 0.5) * 0.4;
      rail.rotation.x = (Math.random() - 0.5) * 0.3;
      rail.castShadow = true;
      rail.receiveShadow = true;
      addObject(rail);
    }

    // Damaged highway sign structure
    var signPostGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 8);
    var signPostMat = createMaterial(0x666666);
    var signPost = new THREE.Mesh(signPostGeo, signPostMat);
    signPost.position.set(-40, 8, -8);
    signPost.rotation.z = 0.3;
    signPost.castShadow = true;
    signPost.receiveShadow = true;
    addObject(signPost);

    var signBoardGeo = new THREE.BoxGeometry(6, 2, 0.2);
    var signBoardMat = createMaterial(0xAA6633);
    var signBoard = new THREE.Mesh(signBoardGeo, signBoardMat);
    signBoard.position.set(-40, 11, -8);
    signBoard.castShadow = true;
    signBoard.receiveShadow = true;
    addObject(signBoard);

    // Debris pile details
    for (var i = 0; i < 12; i++) {
      var dustGeo = new THREE.BoxGeometry(0.5 + Math.random() * 1, 0.3, 0.5 + Math.random() * 1);
      var dustMat = createMaterial(0x555555);
      var dust = new THREE.Mesh(dustGeo, dustMat);
      dust.position.set(-5 + Math.random() * 10, -10 + Math.random() * 4, -10 + Math.random() * 10);
      dust.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dust.castShadow = true;
      dust.receiveShadow = true;
      addObject(dust);
    }

    // Barbed wire fences (line segments)
    var wireColor = 0x444444;
    for (var i = 0; i < 4; i++) {
      var wirePoints = [
        -32, 8 + i * 0.5, -6,
        32, 8 + i * 0.5, -6,
      ];
      var wire = createLineSegments(wirePoints, wireColor);
      addObject(wire);
    }

    // Additional cone shapes for scenery variation (smoke/debris cones)
    for (var i = 0; i < 4; i++) {
      var coneGeo = new THREE.ConeGeometry(1.5 + Math.random() * 1, 2 + Math.random() * 1.5, 8);
      var coneMat = createMaterial(0x444444);
      var cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(-25 + i * 15, 7 + Math.random() * 2, -8 + Math.random() * 4);
      cone.castShadow = true;
      cone.receiveShadow = true;
      addObject(cone);
    }
  }

  function init(scene, camera) {
    bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, 0);
    scene.add(bridgeGroup);

    createMainBridgeDeck(scene);
    createBridgeTowers();
    createSuspensionCables();
    createSupportPillars();
    createCollapsedDebris();
    createGorgeWalls();
    createRiverWater();
    createCraters();
    createDestroyedVehicles();
    createGuardBunkers();
    createRopeBridge();
    createSandbagPositions();
    createAdditionalDetail();

    return objects.length;
  }

  function update(delta) {
    // Bridge sway animation
    swayRotation += delta * 0.3;
    if (bridgeGroup) {
      bridgeGroup.rotation.z = Math.sin(swayRotation) * 0.008;
      bridgeGroup.rotation.x = Math.cos(swayRotation * 0.7) * 0.005;
    }

    // Fire glow pulsing
    for (var i = 0; i < fireGlows.length; i++) {
      var fire = fireGlows[i];
      fire.phase += delta * 3;
      var pulse = 0.6 + Math.sin(fire.phase) * 0.4;
      fire.mesh.scale.set(pulse, pulse, pulse);
      fire.mesh.material.color.setHSL(0.05, 0.8, 0.5 * pulse);
    }
  }

  function reset() {
    for (var i = objects.length - 1; i >= 0; i--) {
      bridgeGroup.remove(objects[i]);
    }
    objects = [];
    fireGlows = [];
    swayRotation = 0;
    if (bridgeGroup && bridgeGroup.parent) {
      bridgeGroup.parent.remove(bridgeGroup);
    }
    bridgeGroup = null;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
