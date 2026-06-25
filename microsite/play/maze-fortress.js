window.MazeFortress = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var mazeGroup = new THREE.Group();
  var animatedObjects = [];
  var lights = [];

  var murderDoorAngle = 0;
  var tripwireBlinkPhase = 0;
  var commandRoomLightIntensity = 1.0;
  var beaconRotation = 0;

  function createMazeWalls() {
    var wallGroup = new THREE.Group();
    var wallHeight = 8;
    var wallThickness = 0.5;
    var cellSize = 6;
    var gridSize = 6;

    // Outer perimeter wall
    var outerSize = cellSize * gridSize;
    var outerWall = new THREE.BoxGeometry(outerSize + wallThickness * 2, wallHeight, wallThickness);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });

    // North wall
    var northWall = new THREE.Mesh(outerWall, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -outerSize / 2 - wallThickness / 2);
    wallGroup.add(northWall);

    // South wall
    var southWall = new THREE.Mesh(outerWall, wallMaterial);
    southWall.position.set(0, wallHeight / 2, outerSize / 2 + wallThickness / 2);
    wallGroup.add(southWall);

    // East wall (vertical)
    var eastWall = new THREE.BoxGeometry(wallThickness, wallHeight, outerSize + wallThickness * 2);
    var eastMesh = new THREE.Mesh(eastWall, wallMaterial);
    eastMesh.position.set(outerSize / 2 + wallThickness / 2, wallHeight / 2, 0);
    wallGroup.add(eastMesh);

    // West wall (vertical)
    var westMesh = new THREE.Mesh(eastWall, wallMaterial);
    westMesh.position.set(-outerSize / 2 - wallThickness / 2, wallHeight / 2, 0);
    wallGroup.add(westMesh);

    // Interior maze walls - 6x6 grid of cells
    for (var i = 0; i < gridSize; i++) {
      for (var j = 0; j < gridSize; j++) {
        var cellX = -outerSize / 2 + cellSize / 2 + i * cellSize;
        var cellZ = -outerSize / 2 + cellSize / 2 + j * cellSize;

        // Random wall placement for maze corridors
        var wallChance = Math.sin(i * 2.3 + j * 3.7) > 0.2;
        if (wallChance && !(i === 2 && j === 2) && !(i === 3 && j === 3)) {
          var wallSide = (i + j) % 4;

          if (wallSide === 0 && i < gridSize - 1) {
            var vWall = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize);
            var vMesh = new THREE.Mesh(vWall, wallMaterial);
            vMesh.position.set(cellX + cellSize / 2, wallHeight / 2, cellZ);
            wallGroup.add(vMesh);
          } else if (wallSide === 1 && j < gridSize - 1) {
            var hWall = new THREE.BoxGeometry(cellSize, wallHeight, wallThickness);
            var hMesh = new THREE.Mesh(hWall, wallMaterial);
            hMesh.position.set(cellX, wallHeight / 2, cellZ + cellSize / 2);
            wallGroup.add(hMesh);
          } else if (wallSide === 2 && i > 0) {
            var vWall2 = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize);
            var vMesh2 = new THREE.Mesh(vWall2, wallMaterial);
            vMesh2.position.set(cellX - cellSize / 2, wallHeight / 2, cellZ);
            wallGroup.add(vMesh2);
          } else if (wallSide === 3 && j > 0) {
            var hWall2 = new THREE.BoxGeometry(cellSize, wallHeight, wallThickness);
            var hMesh2 = new THREE.Mesh(hWall2, wallMaterial);
            hMesh2.position.set(cellX, wallHeight / 2, cellZ - cellSize / 2);
            wallGroup.add(hMesh2);
          }
        }

        // Create dead ends
        if ((i + j) % 5 === 0 && !(i === 2 && j === 2)) {
          var deadEndWall = new THREE.BoxGeometry(cellSize * 0.8, wallHeight, wallThickness);
          var deadEndMesh = new THREE.Mesh(deadEndWall, wallMaterial);
          deadEndMesh.position.set(cellX, wallHeight / 2, cellZ + cellSize / 2 - 0.2);
          wallGroup.add(deadEndMesh);
        }
      }
    }

    mazeGroup.add(wallGroup);
  }

  function createGuardTowers() {
    var outerSize = 36;
    var towerSize = 3;
    var towerHeight = 12;
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });

    var corners = [
      { x: -outerSize / 2, z: -outerSize / 2 },
      { x: outerSize / 2, z: -outerSize / 2 },
      { x: outerSize / 2, z: outerSize / 2 },
      { x: -outerSize / 2, z: outerSize / 2 }
    ];

    corners.forEach(function(corner) {
      var tower = new THREE.BoxGeometry(towerSize, towerHeight, towerSize);
      var towerMesh = new THREE.Mesh(tower, towerMaterial);
      towerMesh.position.set(corner.x, towerHeight / 2, corner.z);
      mazeGroup.add(towerMesh);

      // Tower platform
      var platform = new THREE.BoxGeometry(towerSize * 1.3, 0.3, towerSize * 1.3);
      var platformMesh = new THREE.Mesh(platform, towerMaterial);
      platformMesh.position.set(corner.x, towerHeight - 0.15, corner.z);
      mazeGroup.add(platformMesh);
    });
  }

  function createSniperGallery() {
    var galleryLength = 18;
    var galleryWidth = 3;
    var galleryHeight = 0.5;
    var galleryMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });

    var gallery = new THREE.BoxGeometry(galleryLength, galleryHeight, galleryWidth);
    var galleryMesh = new THREE.Mesh(gallery, galleryMaterial);
    galleryMesh.position.set(0, 9.5, 0);
    mazeGroup.add(galleryMesh);

    // Support pillars
    var pillar = new THREE.BoxGeometry(0.8, 9.5, 0.8);
    var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    for (var i = -3; i <= 3; i++) {
      var pillarMesh = new THREE.Mesh(pillar, pillarMaterial);
      pillarMesh.position.set(i * 3, 4.75, 1.5);
      mazeGroup.add(pillarMesh);
    }
  }

  function createMurderDoor() {
    var doorWidth = 4;
    var doorHeight = 8;
    var doorThickness = 0.3;
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.9, metalness: 0.3 });

    var door = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
    var doorMesh = new THREE.Mesh(door, doorMaterial);
    doorMesh.position.set(-15, doorHeight / 2, 10);

    // Store reference for animation
    doorMesh.userData.basePosition = { x: -15, y: doorHeight / 2, z: 10 };
    doorMesh.userData.isMurderDoor = true;

    mazeGroup.add(doorMesh);
    animatedObjects.push(doorMesh);

    // Door frame
    var frameThickness = 0.4;
    var frameVertical = new THREE.BoxGeometry(frameThickness, doorHeight + 1, frameThickness);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    var leftFrame = new THREE.Mesh(frameVertical, frameMaterial);
    leftFrame.position.set(-15 - doorWidth / 2 - frameThickness / 2, doorHeight / 2, 10);
    mazeGroup.add(leftFrame);

    var rightFrame = new THREE.Mesh(frameVertical, frameMaterial);
    rightFrame.position.set(-15 + doorWidth / 2 + frameThickness / 2, doorHeight / 2, 10);
    mazeGroup.add(rightFrame);
  }

  function createTripwireIndicators() {
    var tripwireMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    var tripwirePositions = [
      { x: -8, z: 4 },
      { x: 8, z: -4 },
      { x: -2, z: 12 },
      { x: 6, z: 2 },
      { x: -12, z: -8 }
    ];

    tripwirePositions.forEach(function(pos) {
      var sphere = new THREE.SphereGeometry(0.2, 8, 8);
      var sphereMesh = new THREE.Mesh(sphere, tripwireMaterial);
      sphereMesh.position.set(pos.x, 0.3, pos.z);
      sphereMesh.userData.isTripwire = true;
      mazeGroup.add(sphereMesh);
      animatedObjects.push(sphereMesh);
    });
  }

  function createCommandRoom() {
    var roomSize = 8;
    var roomHeight = 6;
    var floorGrating = new THREE.BoxGeometry(roomSize, 0.3, roomSize);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 });

    var floor = new THREE.Mesh(floorGrating, floorMaterial);
    floor.position.set(0, 0.15, 0);
    mazeGroup.add(floor);

    // Command table
    var tableTop = new THREE.BoxGeometry(5, 0.4, 3);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var table = new THREE.Mesh(tableTop, tableMaterial);
    table.position.set(0, 1.5, 0);
    mazeGroup.add(table);

    // Table legs
    var tableLeg = new THREE.BoxGeometry(0.3, 1.4, 0.3);
    for (var i = -1; i <= 1; i += 2) {
      for (var j = -1; j <= 1; j += 2) {
        var leg = new THREE.Mesh(tableLeg, tableMaterial);
        leg.position.set(i * 2, 0.7, j * 1.3);
        mazeGroup.add(leg);
      }
    }

    // Overhead command room light
    var lightBulb = new THREE.SphereGeometry(0.3, 8, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1.0 });
    var lightMesh = new THREE.Mesh(lightBulb, lightMaterial);
    lightMesh.position.set(0, roomHeight - 1, 0);
    lightMesh.userData.isCommandRoomLight = true;
    mazeGroup.add(lightMesh);
    animatedObjects.push(lightMesh);

    // Add actual light source
    var commandLight = new THREE.PointLight(0xffff88, 1.5, 30);
    commandLight.position.set(0, roomHeight - 1, 0);
    lights.push(commandLight);
    mazeGroup.add(commandLight);
  }

  function createHiddenAlcoves() {
    var alcoveMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
    var alcovePositions = [
      { x: -18, z: -15 },
      { x: 18, z: 15 },
      { x: -15, z: 18 },
      { x: 15, z: -18 }
    ];

    alcovePositions.forEach(function(pos) {
      var alcove = new THREE.BoxGeometry(2, 6, 1.5);
      var alcoveMesh = new THREE.Mesh(alcove, alcoveMaterial);
      alcoveMesh.position.set(pos.x, 3, pos.z);
      mazeGroup.add(alcoveMesh);
    });
  }

  function createFalseDeadEnd() {
    var doorWidth = 3;
    var doorHeight = 7;
    var doorThickness = 0.4;
    var falseDoorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

    var falseDoor = new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness);
    var falseDoorMesh = new THREE.Mesh(falseDoor, falseDoorMaterial);
    falseDoorMesh.position.set(12, doorHeight / 2, -12);
    falseDoorMesh.userData.isFalseDoor = true;
    mazeGroup.add(falseDoorMesh);
    animatedObjects.push(falseDoorMesh);
  }

  function createFloorGratingSection() {
    var gratingMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.7 });
    var gratingSize = 5;
    var gratingThickness = 0.2;

    var grating = new THREE.BoxGeometry(gratingSize, gratingThickness, gratingSize);
    var gratingMesh = new THREE.Mesh(grating, gratingMaterial);
    gratingMesh.position.set(6, 0.1, -6);
    mazeGroup.add(gratingMesh);

    // Grating bars using LineSegments
    var gratingGeometry = new THREE.BufferGeometry();
    var gratingVertices = new Float32Array();
    for (var i = 0; i <= 10; i++) {
      gratingVertices = new Float32Array([
        ...Array.from(gratingVertices),
        -gratingSize / 2 + i * (gratingSize / 10), gratingThickness + 0.05, -gratingSize / 2,
        -gratingSize / 2 + i * (gratingSize / 10), gratingThickness + 0.05, gratingSize / 2,
        -gratingSize / 2, gratingThickness + 0.05, -gratingSize / 2 + i * (gratingSize / 10),
        gratingSize / 2, gratingThickness + 0.05, -gratingSize / 2 + i * (gratingSize / 10)
      ]);
    }
    gratingGeometry.setAttribute('position', new THREE.BufferAttribute(gratingVertices, 3));
    var gratingLines = new THREE.LineSegments(gratingGeometry, new THREE.LineBasicMaterial({ color: 0x666666 }));
    gratingLines.position.set(6, 0, -6);
    mazeGroup.add(gratingLines);
  }

  function createWeaponCache() {
    var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9 });
    var crateSize = 1.2;

    var crate = new THREE.BoxGeometry(crateSize, crateSize * 1.5, crateSize);
    var crateMesh = new THREE.Mesh(crate, crateMaterial);
    crateMesh.position.set(-12, crateSize * 0.75, -18);
    mazeGroup.add(crateMesh);

    // Stack crates
    for (var i = 0; i < 3; i++) {
      var stackedCrate = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
      var stackedMesh = new THREE.Mesh(stackedCrate, crateMaterial);
      stackedMesh.position.set(-12 + i * 1.5, crateSize * 1.5 + i * crateSize, -18);
      mazeGroup.add(stackedMesh);
    }
  }

  function createFirstAidStation() {
    var stationMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var station = new THREE.BoxGeometry(2, 4, 0.5);
    var stationMesh = new THREE.Mesh(station, stationMaterial);
    stationMesh.position.set(18, 2, 6);
    mazeGroup.add(stationMesh);

    // Red cross symbol
    var crossSize = 0.3;
    var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    var verticalCross = new THREE.BoxGeometry(crossSize, 1.5, crossSize);
    var verticalMesh = new THREE.Mesh(verticalCross, crossMaterial);
    verticalMesh.position.set(18, 2.5, 0.6);
    mazeGroup.add(verticalMesh);

    var horizontalCross = new THREE.BoxGeometry(1.5, crossSize, crossSize);
    var horizontalMesh = new THREE.Mesh(horizontalCross, crossMaterial);
    horizontalMesh.position.set(18, 2.5, 0.6);
    mazeGroup.add(horizontalMesh);
  }

  function createLadderAccessToGallery() {
    var ladderGeometry = new THREE.BufferGeometry();
    var ladderVertices = new Float32Array();

    for (var i = 0; i < 12; i++) {
      var y = i * 0.8;
      ladderVertices = new Float32Array([
        ...Array.from(ladderVertices),
        -0.3, y, 0,
        0.3, y, 0,
        -0.3, y + 0.8, 0,
        0.3, y + 0.8, 0,
        -0.3, y, 0,
        -0.3, y + 0.8, 0,
        0.3, y, 0,
        0.3, y + 0.8, 0
      ]);
    }

    ladderGeometry.setAttribute('position', new THREE.BufferAttribute(ladderVertices, 3));
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
    ladder.position.set(-12, 0.5, -12);
    mazeGroup.add(ladder);
  }

  function createGuardDogKennel() {
    var kennelMaterial = new THREE.MeshStandardMaterial({ color: 0x664422 });
    var kennel = new THREE.BoxGeometry(3, 3, 3);
    var kennelMesh = new THREE.Mesh(kennel, kennelMaterial);
    kennelMesh.position.set(12, 1.5, 12);
    mazeGroup.add(kennelMesh);

    // Kennel bars
    var barGeometry = new THREE.BufferGeometry();
    var barVertices = new Float32Array();
    for (var i = 0; i < 5; i++) {
      barVertices = new Float32Array([
        ...Array.from(barVertices),
        -1.5 + i * 0.75, 0, -1.5,
        -1.5 + i * 0.75, 2.5, -1.5,
        -1.5, 0, -1.5 + i * 0.75,
        -1.5, 2.5, -1.5 + i * 0.75
      ]);
    }
    barGeometry.setAttribute('position', new THREE.BufferAttribute(barVertices, 3));
    var barMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
    var bars = new THREE.LineSegments(barGeometry, barMaterial);
    bars.position.set(12, 1, 12);
    mazeGroup.add(bars);
  }

  function createElectricalControlRoom() {
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var panelSize = 2;
    var panelHeight = 5;

    var panel = new THREE.BoxGeometry(panelSize, panelHeight, 0.5);
    var panelMesh = new THREE.Mesh(panel, panelMaterial);
    panelMesh.position.set(-18, panelHeight / 2, 12);
    mazeGroup.add(panelMesh);

    // Control buttons
    var buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var buttonGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 3; j++) {
        var button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(-18 + j * 0.6 - 0.6, panelHeight - 1 - i * 0.7, 0.35);
        mazeGroup.add(button);
      }
    }
  }

  function createCagedHoldingCells() {
    var cellMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
    var cellPositions = [
      { x: -16, z: -16 },
      { x: 16, z: -16 },
      { x: 16, z: 16 },
      { x: -16, z: 16 }
    ];

    cellPositions.forEach(function(pos) {
      var cellBox = new THREE.BoxGeometry(3, 5, 3);
      var cellMesh = new THREE.Mesh(cellBox, cellMaterial);
      cellMesh.position.set(pos.x, 2.5, pos.z);
      mazeGroup.add(cellMesh);

      // Cell bars
      var barGeometry = new THREE.BufferGeometry();
      var barVertices = new Float32Array();
      for (var i = 0; i < 6; i++) {
        barVertices = new Float32Array([
          ...Array.from(barVertices),
          -1.5 + i * 0.6, 0, -1.5,
          -1.5 + i * 0.6, 4.5, -1.5,
          -1.5, 0, -1.5 + i * 0.6,
          -1.5, 4.5, -1.5 + i * 0.6
        ]);
      }
      barGeometry.setAttribute('position', new THREE.BufferAttribute(barVertices, 3));
      var barMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
      var bars = new THREE.LineSegments(barGeometry, barMaterial);
      bars.position.set(pos.x, 0.1, pos.z);
      mazeGroup.add(bars);
    });
  }

  function createPatrolBeacon() {
    var beaconGeometry = new THREE.ConeGeometry(1.5, 2, 16);
    var beaconMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff6600, emissiveIntensity: 0.8 });
    var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.set(0, 10.5, 0);
    beacon.userData.isBeacon = true;
    mazeGroup.add(beacon);
    animatedObjects.push(beacon);

    // Beacon light
    var beaconLight = new THREE.PointLight(0xff6600, 1.0, 40);
    beaconLight.position.set(0, 10.5, 0);
    lights.push(beaconLight);
    mazeGroup.add(beaconLight);
  }

  var exports = {};

  exports.init = function(initScene, initCamera) {
    scene = initScene;
    camera = initCamera;

    createMazeWalls();
    createGuardTowers();
    createSniperGallery();
    createMurderDoor();
    createTripwireIndicators();
    createCommandRoom();
    createHiddenAlcoves();
    createFalseDeadEnd();
    createFloorGratingSection();
    createWeaponCache();
    createFirstAidStation();
    createLadderAccessToGallery();
    createGuardDogKennel();
    createElectricalControlRoom();
    createCagedHoldingCells();
    createPatrolBeacon();

    scene.add(mazeGroup);

    // Add ambient light
    var ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    // Add directional light
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);
  };

  exports.update = function(delta) {
    var i;

    // Murder door slow pivot animation
    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.userData.isMurderDoor) {
        murderDoorAngle += delta * 0.3;
        if (murderDoorAngle > Math.PI / 4) {
          murderDoorAngle = Math.PI / 4;
        }
        obj.rotation.y = murderDoorAngle;
      }
    }

    // Tripwire light blink
    tripwireBlinkPhase += delta * 3;
    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.userData.isTripwire) {
        var blinkIntensity = Math.sin(tripwireBlinkPhase) * 0.5 + 0.5;
        obj.material.emissiveIntensity = blinkIntensity;
        obj.material.opacity = blinkIntensity * 0.7 + 0.3;
      }
    }

    // Command room overhead light pulse
    commandRoomLightIntensity = Math.sin(Date.now() * 0.001) * 0.4 + 1.0;
    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.userData.isCommandRoomLight) {
        obj.material.emissiveIntensity = commandRoomLightIntensity * 0.8;
      }
    }

    // Guard patrol beacon rotation
    beaconRotation += delta * 2;
    for (i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.userData.isBeacon) {
        obj.rotation.z = beaconRotation;
      }
    }

    // Update light intensities
    for (i = 0; i < lights.length; i++) {
      if (lights[i].userData && lights[i].userData.isCommandLight) {
        lights[i].intensity = commandRoomLightIntensity * 1.5;
      }
    }
  };

  exports.reset = function() {
    murderDoorAngle = 0;
    tripwireBlinkPhase = 0;
    commandRoomLightIntensity = 1.0;
    beaconRotation = 0;

    for (var i = 0; i < animatedObjects.length; i++) {
      var obj = animatedObjects[i];
      if (obj.userData.isMurderDoor) {
        obj.rotation.y = 0;
        obj.position.copy(obj.userData.basePosition);
      }
    }
  };

  return exports;
}());
