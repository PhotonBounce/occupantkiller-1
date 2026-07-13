window.PalaceRaid = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var palace = {};
  var animationStates = {};
  var doorAngles = {};

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    palace = {};
    animationStates = {
      chandelierRotation: 0,
      chandelierSway: 0,
      fountainWave: 0,
      cameraRotation: 0
    };
    doorAngles = {};

    buildGrandMarbleHall();
    buildGoldTrimmeddoors();
    buildThroneRoom();
    buildBallroom();
    buildPortraitGallery();
    buildOrnateStaircase();
    buildUndergroundTunnel();
    buildPresidentialBunker();
    buildGuardBarracks();
    buildKitchenServiceArea();
    buildCommunicationsRoom();
    buildRoofHelipad();
    buildPerimeterGarden();
    buildFountain();
    buildTreasuryVault();
  }

  function buildGrandMarbleHall() {
    var hallWidth = 40;
    var hallLength = 60;
    var hallHeight = 15;

    // Polished marble floor
    var floorGeom = new THREE.BoxGeometry(hallWidth, 0.5, hallLength);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.6,
      roughness: 0.2
    });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = -0.25;
    scene.add(floor);
    palace.floor = floor;

    // Walls
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
    var wallThickness = 0.8;
    var wallHeight = hallHeight;

    // Front wall
    var frontWallGeom = new THREE.BoxGeometry(hallWidth, wallHeight, wallThickness);
    var frontWall = new THREE.Mesh(frontWallGeom, wallMat);
    frontWall.position.set(0, hallHeight / 2, -hallLength / 2);
    scene.add(frontWall);

    // Back wall
    var backWall = new THREE.Mesh(frontWallGeom, wallMat);
    backWall.position.set(0, hallHeight / 2, hallLength / 2);
    scene.add(backWall);

    // Left wall
    var sideWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, hallLength);
    var leftWall = new THREE.Mesh(sideWallGeom, wallMat);
    leftWall.position.set(-hallWidth / 2, hallHeight / 2, 0);
    scene.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(sideWallGeom, wallMat);
    rightWall.position.set(hallWidth / 2, hallHeight / 2, 0);
    scene.add(rightWall);

    // Ornate marble columns
    var columnCount = 6;
    var columnRadius = 1.2;
    var columnHeight = hallHeight - 1;
    var columnMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.4,
      roughness: 0.3
    });

    for (var i = 0; i < columnCount; i++) {
      var columnGeom = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 16);
      var column = new THREE.Mesh(columnGeom, columnMat);
      var zPos = -hallLength / 2 + 10 + (i * 12);
      column.position.set(-15, columnHeight / 2, zPos);
      scene.add(column);

      var column2 = new THREE.Mesh(columnGeom, columnMat);
      column2.position.set(15, columnHeight / 2, zPos);
      scene.add(column2);

      // Gold capitals
      var capitalGeom = new THREE.CylinderGeometry(columnRadius * 1.3, columnRadius, 0.6, 16);
      var capitalMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.1
      });
      var capital = new THREE.Mesh(capitalGeom, capitalMat);
      capital.position.set(-15, columnHeight - 0.3, zPos);
      scene.add(capital);

      var capital2 = new THREE.Mesh(capitalGeom, capitalMat);
      capital2.position.set(15, columnHeight - 0.3, zPos);
      scene.add(capital2);
    }
  }

  function buildGoldTrimmeddoors() {
    var doorWidth = 4;
    var doorHeight = 10;
    var doorThickness = 0.3;

    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.2,
      roughness: 0.6
    });

    // Left door
    var leftDoorGeom = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
    var leftDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    leftDoor.position.set(-doorWidth / 2 - 0.5, doorHeight / 2, 25);
    leftDoor.userData.originalPosition = leftDoor.position.clone();
    scene.add(leftDoor);
    palace.leftDoor = leftDoor;
    doorAngles.leftDoor = 0;

    // Right door
    var rightDoor = new THREE.Mesh(leftDoorGeom, doorMat);
    rightDoor.position.set(doorWidth / 2 + 0.5, doorHeight / 2, 25);
    rightDoor.userData.originalPosition = rightDoor.position.clone();
    scene.add(rightDoor);
    palace.rightDoor = rightDoor;
    doorAngles.rightDoor = 0;

    // Gold trim strips
    var trimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.05
    });

    var trimGeom = new THREE.BoxGeometry(0.3, doorHeight, doorThickness);
    var leftTrim = new THREE.Mesh(trimGeom, trimMat);
    leftTrim.position.set(-doorWidth / 2 - 0.5, doorHeight / 2, 25);
    scene.add(leftTrim);

    var rightTrim = new THREE.Mesh(trimGeom, trimMat);
    rightTrim.position.set(doorWidth / 2 + 0.5, doorHeight / 2, 25);
    scene.add(rightTrim);

    var topTrimGeom = new THREE.BoxGeometry(doorWidth, 0.4, doorThickness);
    var topTrim = new THREE.Mesh(topTrimGeom, trimMat);
    topTrim.position.set(0, doorHeight - 0.2, 25);
    scene.add(topTrim);
  }

  function buildThroneRoom() {
    var throneX = 0;
    var throneZ = -35;

    // Elevated dais
    var daisGeom = new THREE.BoxGeometry(15, 1.5, 12);
    var daisMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.6,
      roughness: 0.3
    });
    var dais = new THREE.Mesh(daisGeom, daisMat);
    dais.position.set(throneX, 0.75, throneZ);
    scene.add(dais);
    palace.dais = dais;

    // Throne chair - ornate backrest
    var throneBackGeom = new THREE.BoxGeometry(4, 8, 0.5);
    var throneMat = new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      metalness: 0.3,
      roughness: 0.5
    });
    var throneBack = new THREE.Mesh(throneBackGeom, throneMat);
    throneBack.position.set(throneX, 4.5, throneZ);
    scene.add(throneBack);

    // Throne seat
    var throneSeatGeom = new THREE.BoxGeometry(4, 2, 3);
    var throneSeat = new THREE.Mesh(throneSeatGeom, throneMat);
    throneSeat.position.set(throneX, 2.5, throneZ + 0.5);
    scene.add(throneSeat);

    // Throne armrests
    var armrestGeom = new THREE.BoxGeometry(0.5, 3, 3);
    var leftArmrest = new THREE.Mesh(armrestGeom, throneMat);
    leftArmrest.position.set(throneX - 2.5, 3.5, throneZ + 0.5);
    scene.add(leftArmrest);

    var rightArmrest = new THREE.Mesh(armrestGeom, throneMat);
    rightArmrest.position.set(throneX + 2.5, 3.5, throneZ + 0.5);
    scene.add(rightArmrest);

    // Ornate framing columns
    var frameColGeom = new THREE.CylinderGeometry(0.8, 0.8, 9, 16);
    var frameColMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.1
    });
    var leftFrameCol = new THREE.Mesh(frameColGeom, frameColMat);
    leftFrameCol.position.set(throneX - 6, 4.5, throneZ);
    scene.add(leftFrameCol);

    var rightFrameCol = new THREE.Mesh(frameColGeom, frameColMat);
    rightFrameCol.position.set(throneX + 6, 4.5, throneZ);
    scene.add(rightFrameCol);
  }

  function buildBallroom() {
    var ballroomX = 25;
    var ballroomZ = 0;
    var ballroomWidth = 20;
    var ballroomLength = 25;

    // Open floor
    var ballroomFloorGeom = new THREE.BoxGeometry(ballroomWidth, 0.3, ballroomLength);
    var ballroomFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf0e68c,
      metalness: 0.5,
      roughness: 0.4
    });
    var ballroomFloor = new THREE.Mesh(ballroomFloorGeom, ballroomFloorMat);
    ballroomFloor.position.set(ballroomX, 0.15, ballroomZ);
    scene.add(ballroomFloor);

    // Walls
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
    var wallGeom1 = new THREE.BoxGeometry(ballroomWidth, 12, 0.5);
    var wall1 = new THREE.Mesh(wallGeom1, wallMat);
    wall1.position.set(ballroomX, 6, ballroomZ - ballroomLength / 2);
    scene.add(wall1);

    var wall2 = new THREE.Mesh(wallGeom1, wallMat);
    wall2.position.set(ballroomX, 6, ballroomZ + ballroomLength / 2);
    scene.add(wall2);

    var wallGeom2 = new THREE.BoxGeometry(0.5, 12, ballroomLength);
    var wall3 = new THREE.Mesh(wallGeom2, wallMat);
    wall3.position.set(ballroomX - ballroomWidth / 2, 6, ballroomZ);
    scene.add(wall3);

    var wall4 = new THREE.Mesh(wallGeom2, wallMat);
    wall4.position.set(ballroomX + ballroomWidth / 2, 6, ballroomZ);
    scene.add(wall4);

    // Chandelier
    var chandelierGeom = new THREE.SphereGeometry(1.5, 8, 8);
    var chandelierMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.05
    });
    var chandelier = new THREE.Mesh(chandelierGeom, chandelierMat);
    chandelier.position.set(ballroomX, 11, ballroomZ);
    scene.add(chandelier);
    palace.chandelier = chandelier;

    // Crystal lines
    var crystalMat = new THREE.LineBasicMaterial({
      color: 0x87ceeb,
      linewidth: 2
    });
    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var points = [
        new THREE.Vector3(
          ballroomX + Math.cos(angle) * 1.5,
          11,
          ballroomZ + Math.sin(angle) * 1.5
        ),
        new THREE.Vector3(
          ballroomX + Math.cos(angle) * 2.5,
          8,
          ballroomZ + Math.sin(angle) * 2.5
        )
      ];
      var crystalLine = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(points),
        crystalMat
      );
      scene.add(crystalLine);
    }
  }

  function buildPortraitGallery() {
    var galleryX = -25;
    var galleryZ = 0;
    var galleryLength = 30;

    // Gallery walls
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
    var galleryWallGeom = new THREE.BoxGeometry(8, 12, galleryLength);
    var galleryWall = new THREE.Mesh(galleryWallGeom, wallMat);
    galleryWall.position.set(galleryX, 6, galleryZ);
    scene.add(galleryWall);

    // Framed artwork
    var frameCount = 5;
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.7,
      roughness: 0.2
    });

    for (var i = 0; i < frameCount; i++) {
      var frameGeom = new THREE.BoxGeometry(3, 5, 0.3);
      var frame = new THREE.Mesh(frameGeom, frameMat);
      var zPos = -galleryLength / 2 + 5 + (i * 7);
      frame.position.set(galleryX + 1, 8, zPos);
      scene.add(frame);

      // Artwork backing
      var artworkGeom = new THREE.BoxGeometry(2.8, 4.8, 0.1);
      var artworkMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x8b0000 : 0x000080,
        metalness: 0,
        roughness: 1
      });
      var artwork = new THREE.Mesh(artworkGeom, artworkMat);
      artwork.position.set(galleryX + 1, 8, zPos + 0.2);
      scene.add(artwork);
    }
  }

  function buildOrnateStaircase() {
    var stairX = -18;
    var stairZ = -20;
    var stepCount = 12;
    var stepWidth = 6;
    var stepHeight = 0.8;
    var stepDepth = 1.2;

    var stepMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.4
    });

    for (var i = 0; i < stepCount; i++) {
      var stepGeom = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      var step = new THREE.Mesh(stepGeom, stepMat);
      step.position.set(
        stairX,
        stepHeight / 2 + i * stepHeight,
        stairZ + i * stepDepth
      );
      scene.add(step);
    }

    // Bannister posts
    var banisterPostGeom = new THREE.CylinderGeometry(0.4, 0.4, stepCount * stepHeight, 16);
    var banisterMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.1
    });

    var leftPost = new THREE.Mesh(banisterPostGeom, banisterMat);
    leftPost.position.set(stairX - stepWidth / 2 - 0.5, stepCount * stepHeight / 2, stairZ + stepCount * stepDepth / 2);
    scene.add(leftPost);

    var rightPost = new THREE.Mesh(banisterPostGeom, banisterMat);
    rightPost.position.set(stairX + stepWidth / 2 + 0.5, stepCount * stepHeight / 2, stairZ + stepCount * stepDepth / 2);
    scene.add(rightPost);

    // Rail
    var railPoints = [];
    for (var i = 0; i < stepCount; i++) {
      railPoints.push(
        new THREE.Vector3(stairX - stepWidth / 2 - 0.5, stepHeight / 2 + i * stepHeight + 0.3, stairZ + i * stepDepth)
      );
    }
    railPoints.push(
      new THREE.Vector3(stairX + stepWidth / 2 + 0.5, stepCount * stepHeight, stairZ + stepCount * stepDepth)
    );
    var railMat = new THREE.LineBasicMaterial({ color: 0xffd700, linewidth: 3 });
    var railGeom = new THREE.BufferGeometry().setFromPoints(railPoints);
    var rail = new THREE.LineSegments(railGeom, railMat);
    scene.add(rail);
  }

  function buildUndergroundTunnel() {
    var tunnelX = -30;
    var tunnelZ = 35;

    // Hidden panel
    var panelGeom = new THREE.BoxGeometry(3, 4, 0.2);
    var panelMat = new THREE.MeshStandardMaterial({
      color: 0x654321,
      metalness: 0.1,
      roughness: 0.7
    });
    var panel = new THREE.Mesh(panelGeom, panelMat);
    panel.position.set(tunnelX, 2, tunnelZ);
    scene.add(panel);
    palace.hiddenPanel = panel;

    // Tunnel section
    var tunnelLength = 20;
    var tunnelHeight = 2.5;
    var tunnelWidth = 3;

    // Tunnel floor
    var tunnelFloorGeom = new THREE.BoxGeometry(tunnelWidth, 0.3, tunnelLength);
    var tunnelFloorMat = new THREE.MeshStandardMaterial({
      color: 0x696969,
      metalness: 0.2,
      roughness: 0.8
    });
    var tunnelFloor = new THREE.Mesh(tunnelFloorGeom, tunnelFloorMat);
    tunnelFloor.position.set(tunnelX, 0.15, tunnelZ - tunnelLength / 2);
    scene.add(tunnelFloor);

    // Tunnel walls
    var wallGeom = new THREE.BoxGeometry(0.4, tunnelHeight, tunnelLength);
    var tunnelWallMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.1,
      roughness: 0.9
    });
    var leftWall = new THREE.Mesh(wallGeom, tunnelWallMat);
    leftWall.position.set(tunnelX - tunnelWidth / 2, tunnelHeight / 2, tunnelZ - tunnelLength / 2);
    scene.add(leftWall);

    var rightWall = new THREE.Mesh(wallGeom, tunnelWallMat);
    rightWall.position.set(tunnelX + tunnelWidth / 2, tunnelHeight / 2, tunnelZ - tunnelLength / 2);
    scene.add(rightWall);

    // Ceiling
    var ceilingGeom = new THREE.BoxGeometry(tunnelWidth, 0.3, tunnelLength);
    var ceiling = new THREE.Mesh(ceilingGeom, tunnelWallMat);
    ceiling.position.set(tunnelX, tunnelHeight, tunnelZ - tunnelLength / 2);
    scene.add(ceiling);
  }

  function buildPresidentialBunker() {
    var bunkerX = 20;
    var bunkerZ = -40;

    // Reinforced room
    var bunkerWallMat = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      metalness: 0.5,
      roughness: 0.6
    });

    var bunkerGeom = new THREE.BoxGeometry(8, 6, 8);
    var bunkerWall1 = new THREE.Mesh(bunkerGeom, bunkerWallMat);
    bunkerWall1.position.set(bunkerX, 3, bunkerZ);
    scene.add(bunkerWall1);

    // Reinforced door
    var doorGeom = new THREE.BoxGeometry(2, 3, 0.4);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2
    });
    var bunkerDoor = new THREE.Mesh(doorGeom, doorMat);
    bunkerDoor.position.set(bunkerX - 3, 1.5, bunkerZ + 4);
    scene.add(bunkerDoor);

    // Desk
    var deskGeom = new THREE.BoxGeometry(4, 1.5, 2);
    var deskMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.2,
      roughness: 0.5
    });
    var desk = new THREE.Mesh(deskGeom, deskMat);
    desk.position.set(bunkerX, 0.75, bunkerZ - 2);
    scene.add(desk);

    // Desk supports
    var supportGeom = new THREE.BoxGeometry(0.3, 0.7, 0.3);
    var supportMat = new THREE.MeshStandardMaterial({
      color: 0x654321,
      metalness: 0.1,
      roughness: 0.6
    });
    for (var i = -1; i <= 1; i++) {
      var support = new THREE.Mesh(supportGeom, supportMat);
      support.position.set(bunkerX + i * 1.5, 0.35, bunkerZ - 2);
      scene.add(support);
    }
  }

  function buildGuardBarracks() {
    var barracksX = -8;
    var barracksZ = 25;

    // Bunk frames
    var bunksPerRow = 3;
    var bunksPerColumn = 2;
    var frameGeom = new THREE.BoxGeometry(1.8, 0.5, 3.5);
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.2,
      roughness: 0.6
    });

    for (var row = 0; row < bunksPerRow; row++) {
      for (var col = 0; col < bunksPerColumn; col++) {
        var frame = new THREE.Mesh(frameGeom, frameMat);
        frame.position.set(
          barracksX - 3 + row * 3,
          1 + col * 2.5,
          barracksZ
        );
        scene.add(frame);

        // Mattress
        var mattressGeom = new THREE.BoxGeometry(1.6, 0.3, 3.3);
        var mattressMat = new THREE.MeshStandardMaterial({
          color: 0x696969,
          metalness: 0,
          roughness: 1
        });
        var mattress = new THREE.Mesh(mattressGeom, mattressMat);
        mattress.position.set(
          barracksX - 3 + row * 3,
          1.3 + col * 2.5,
          barracksZ
        );
        scene.add(mattress);
      }
    }
  }

  function buildKitchenServiceArea() {
    var kitchenX = 0;
    var kitchenZ = 45;

    // Stainless steel counter
    var counterGeom = new THREE.BoxGeometry(12, 1.2, 2.5);
    var counterMat = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.2
    });
    var counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.set(kitchenX, 0.6, kitchenZ);
    scene.add(counter);

    // Pots and cookware (cylinders)
    var potMat = new THREE.MeshStandardMaterial({
      color: 0xff6347,
      metalness: 0.5,
      roughness: 0.4
    });

    for (var i = 0; i < 4; i++) {
      var potGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12);
      var pot = new THREE.Mesh(potGeom, potMat);
      pot.position.set(kitchenX - 4 + i * 2, 1.5, kitchenZ);
      scene.add(pot);
    }
  }

  function buildCommunicationsRoom() {
    var commX = 15;
    var commZ = 40;

    // Equipment rack
    var rackGeom = new THREE.BoxGeometry(3, 5, 1.2);
    var rackMat = new THREE.MeshStandardMaterial({
      color: 0x2f4f4f,
      metalness: 0.4,
      roughness: 0.5
    });
    var rack = new THREE.Mesh(rackGeom, rackMat);
    rack.position.set(commX, 2.5, commZ);
    scene.add(rack);

    // Indicator lights (spheres)
    var lightMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.8,
      roughness: 0.1,
      emissive: 0x00aa00
    });

    for (var i = 0; i < 6; i++) {
      var lightGeom = new THREE.SphereGeometry(0.15, 8, 8);
      var light = new THREE.Mesh(lightGeom, lightMat);
      light.position.set(commX - 1, 1.5 + i * 0.6, commZ + 0.6);
      scene.add(light);

      var light2 = new THREE.Mesh(lightGeom, lightMat);
      light2.position.set(commX + 1, 1.5 + i * 0.6, commZ + 0.6);
      scene.add(light2);
    }
  }

  function buildRoofHelipad() {
    var helipadX = 0;
    var helipadZ = -45;

    // Helipad platform
    var helipadGeom = new THREE.BoxGeometry(15, 0.4, 15);
    var helipadMat = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.6,
      roughness: 0.3
    });
    var helipad = new THREE.Mesh(helipadGeom, helipadMat);
    helipad.position.set(helipadX, 15.2, helipadZ);
    scene.add(helipad);
    palace.helipad = helipad;

    // Helipad markings
    var markerGeom = new THREE.BoxGeometry(0.2, 0.1, 3);
    var markerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.4
    });
    var marker1 = new THREE.Mesh(markerGeom, markerMat);
    marker1.position.set(helipadX, 15.25, helipadZ);
    scene.add(marker1);

    var marker2 = new THREE.Mesh(markerGeom, markerMat);
    marker2.rotation.z = Math.PI / 2;
    marker2.position.set(helipadX, 15.25, helipadZ);
    scene.add(marker2);
  }

  function buildPerimeterGarden() {
    var gardenX = -35;
    var gardenZ = -35;
    var wallLength = 50;

    // Stone wall
    var wallGeom = new THREE.BoxGeometry(0.8, 4, wallLength);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0xa9a9a9,
      metalness: 0.3,
      roughness: 0.8
    });
    var wall = new THREE.Mesh(wallGeom, wallMat);
    wall.position.set(gardenX, 2, gardenZ);
    scene.add(wall);

    // Ornate pillars on gate
    var pillarGeom = new THREE.CylinderGeometry(0.6, 0.6, 5, 16);
    var pillarMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.7,
      roughness: 0.2
    });
    var pillar1 = new THREE.Mesh(pillarGeom, pillarMat);
    pillar1.position.set(gardenX - 2, 2.5, gardenZ + wallLength / 2 - 5);
    scene.add(pillar1);

    var pillar2 = new THREE.Mesh(pillarGeom, pillarMat);
    pillar2.position.set(gardenX + 2, 2.5, gardenZ + wallLength / 2 - 5);
    scene.add(pillar2);
  }

  function buildFountain() {
    var fountainX = 8;
    var fountainZ = 15;

    // Basin
    var basinGeom = new THREE.CylinderGeometry(3, 3.2, 1.2, 16);
    var basinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.4
    });
    var basin = new THREE.Mesh(basinGeom, basinMat);
    basin.position.set(fountainX, 0.6, fountainZ);
    scene.add(basin);
    palace.fountainBasin = basin;

    // Central pillar
    var pillarGeom = new THREE.CylinderGeometry(0.8, 1, 4, 16);
    var pillarMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.1
    });
    var pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(fountainX, 2, fountainZ);
    scene.add(pillar);

    // Water jets (sphere at top)
    var jetGeom = new THREE.SphereGeometry(0.5, 8, 8);
    var jetMat = new THREE.MeshStandardMaterial({
      color: 0x87ceeb,
      metalness: 0.6,
      roughness: 0.2
    });
    var jet = new THREE.Mesh(jetGeom, jetMat);
    jet.position.set(fountainX, 4.2, fountainZ);
    scene.add(jet);
    palace.waterJet = jet;
  }

  function buildTreasuryVault() {
    var vaultX = -10;
    var vaultZ = -50;

    // Reinforced vault door
    var doorGeom = new THREE.BoxGeometry(3.5, 4.5, 0.6);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.95,
      roughness: 0.1
    });
    var vaultDoor = new THREE.Mesh(doorGeom, doorMat);
    vaultDoor.position.set(vaultX, 2.25, vaultZ);
    scene.add(vaultDoor);
    palace.vaultDoor = vaultDoor;

    // Vault frame
    var frameGeom = new THREE.BoxGeometry(4, 5, 0.4);
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x696969,
      metalness: 0.6,
      roughness: 0.3
    });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(vaultX, 2.25, vaultZ - 0.2);
    scene.add(frame);
  }

  function update(delta) {
    // Chandelier sway
    if (palace.chandelier) {
      animationStates.chandelierSway += delta * 0.5;
      palace.chandelier.position.x += Math.sin(animationStates.chandelierSway) * 0.01;
      palace.chandelier.rotation.z = Math.sin(animationStates.chandelierSway) * 0.1;
    }

    // Fountain water shimmer
    if (palace.waterJet) {
      animationStates.fountainWave += delta;
      var waveHeight = Math.sin(animationStates.fountainWave * 2) * 0.3;
      palace.waterJet.position.y = 4.2 + waveHeight;
      palace.waterJet.scale.y = 1 + Math.sin(animationStates.fountainWave * 3) * 0.2;
    }

    // Security camera sweep
    if (palace.floor) {
      animationStates.cameraRotation += delta * 0.3;
    }

    // Door opening animation
    if (palace.leftDoor && palace.rightDoor) {
      doorAngles.leftDoor = Math.sin(animationStates.cameraRotation * 0.5) * 0.3;
      doorAngles.rightDoor = -Math.sin(animationStates.cameraRotation * 0.5) * 0.3;

      palace.leftDoor.rotation.y = doorAngles.leftDoor;
      palace.rightDoor.rotation.y = doorAngles.rightDoor;
    }
  }

  function reset() {
    animationStates = {
      chandelierRotation: 0,
      chandelierSway: 0,
      fountainWave: 0,
      cameraRotation: 0
    };
    doorAngles = {};

    if (palace.leftDoor && palace.leftDoor.userData.originalPosition) {
      palace.leftDoor.position.copy(palace.leftDoor.userData.originalPosition);
      palace.leftDoor.rotation.y = 0;
    }

    if (palace.rightDoor && palace.rightDoor.userData.originalPosition) {
      palace.rightDoor.position.copy(palace.rightDoor.userData.originalPosition);
      palace.rightDoor.rotation.y = 0;
    }

    if (palace.chandelier) {
      palace.chandelier.position.x = 25;
      palace.chandelier.rotation.z = 0;
    }

    if (palace.waterJet) {
      palace.waterJet.position.y = 4.2;
      palace.waterJet.scale.y = 1;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
