window.PrisonEscapeB = (function() {
  'use strict';

  var COLORS = {
    concrete: 0x888888,
    institutionalGreen: 0x4A7A4A,
    warningOrange: 0xFF8C00,
    steel: 0x444444,
    bloodRed: 0xCC0000,
    darkGray: 0x333333,
    lightGray: 0xAAAAAA
  };

  var scene = null;
  var camera = null;
  var meshes = [];
  var guards = [];
  var spotlights = [];
  var barriers = [];
  var alarmLights = [];
  var spawnPoints = [];
  var gameState = {
    alarmActive: false,
    lockdownActive: false,
    time: 0
  };

  function addMesh(mesh) {
    meshes.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  function createCellBlockWing(x, y, z) {
    var group = new THREE.Group();

    // Outer block structure
    var blockGeometry = new THREE.BoxGeometry(30, 12, 20);
    var blockMaterial = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
    var block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.position.set(x, y, z);
    group.add(block);

    // Individual cells in rows
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var cellX = x - 12 + col * 8;
        var cellY = y - 4 + row * 8;
        var cellZ = z;

        var cellGeometry = new THREE.BoxGeometry(6, 3, 6);
        var cellMaterial = new THREE.MeshStandardMaterial({ color: COLORS.institutionalGreen });
        var cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.set(cellX, cellY, cellZ);
        cell.castShadow = true;
        cell.receiveShadow = true;
        group.add(cell);

        // Cell door made with BoxGeometry thin slats + LineSegments for bars
        var doorGeometry = new THREE.BoxGeometry(0.3, 2.8, 5.8);
        var doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.8 });
        var door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(cellX + 2.85, cellY, cellZ);
        door.castShadow = true;
        group.add(door);

        // Bars using LineSegments
        var barPoints = [];
        for (var b = 0; b < 4; b++) {
          barPoints.push(new THREE.Vector3(cellX + 2.85, cellY - 1.5 + b * 1.2, cellZ - 2.8));
          barPoints.push(new THREE.Vector3(cellX + 2.85, cellY - 1.5 + b * 1.2, cellZ + 2.8));
        }
        var barGeometry = new THREE.BufferGeometry().setFromPoints(barPoints);
        var barMaterial = new THREE.LineBasicMaterial({ color: COLORS.darkGray, linewidth: 2 });
        var bars = new THREE.LineSegments(barGeometry, barMaterial);
        group.add(bars);
      }
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createPrisonYard(x, y, z) {
    var group = new THREE.Group();

    // Open yard ground
    var yardGeometry = new THREE.BoxGeometry(50, 0.5, 40);
    var yardMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var yard = new THREE.Mesh(yardGeometry, yardMaterial);
    yard.position.set(x, y, z);
    yard.receiveShadow = true;
    group.add(yard);

    // Exercise equipment - bars and stands
    var barStandGeometry = new THREE.BoxGeometry(2, 4, 2);
    var barStandMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel });

    var barStand1 = new THREE.Mesh(barStandGeometry, barStandMaterial);
    barStand1.position.set(x - 15, y + 2, z - 10);
    barStand1.castShadow = true;
    group.add(barStand1);

    var barStand2 = new THREE.Mesh(barStandGeometry, barStandMaterial);
    barStand2.position.set(x + 15, y + 2, z + 10);
    barStand2.castShadow = true;
    group.add(barStand2);

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createGuardTower(x, y, z) {
    var group = new THREE.Group();

    // Tower base cylinder
    var baseGeometry = new THREE.CylinderGeometry(6, 7, 2, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, y, z);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Tower structure box
    var towerGeometry = new THREE.BoxGeometry(8, 15, 8);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: COLORS.institutionalGreen });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(x, y + 8, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // Guard platform
    var platformGeometry = new THREE.BoxGeometry(10, 0.5, 10);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(x, y + 15.5, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // Spotlight on tower - will animate
    var spotlightGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    var spotlightMaterial = new THREE.MeshStandardMaterial({ color: COLORS.warningOrange });
    var spotlightMesh = new THREE.Mesh(spotlightGeometry, spotlightMaterial);
    spotlightMesh.position.set(x, y + 16, z);
    spotlightMesh.castShadow = true;
    group.add(spotlightMesh);

    // Actual light for the spotlight
    var light = new THREE.SpotLight(0xFFFFFF, 1000, 150, Math.PI / 6, 0.8, 2);
    light.position.set(x, y + 16, z);
    light.target.position.set(x + 40, y, z + 40);
    light.castShadow = true;
    group.add(light);
    group.add(light.target);
    spotlights.push({ light: light, mesh: spotlightMesh, angle: 0, baseX: x, baseZ: z });

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createPerimeterWall(x, y, z, length, height) {
    var group = new THREE.Group();

    // Main wall structure
    var wallGeometry = new THREE.BoxGeometry(length, height, 2);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Razor wire on top using LineSegments
    var wirePoints = [];
    for (var i = 0; i < 20; i++) {
      var xPos = x - length / 2 + (i * length / 20);
      wirePoints.push(new THREE.Vector3(xPos, y + height / 2 + 0.2, z - 0.5));
      wirePoints.push(new THREE.Vector3(xPos + length / 40, y + height / 2 + 0.4, z + 0.5));
    }
    var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
    var wireMaterial = new THREE.LineBasicMaterial({ color: COLORS.steel, linewidth: 1 });
    var razorWire = new THREE.LineSegments(wireGeometry, wireMaterial);
    group.add(razorWire);

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createArmoryRoom(x, y, z) {
    var group = new THREE.Group();

    // Room structure
    var roomGeometry = new THREE.BoxGeometry(12, 5, 10);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.set(x, y, z);
    room.castShadow = true;
    room.receiveShadow = true;
    group.add(room);

    // Heavy security door
    var doorGeometry = new THREE.BoxGeometry(2.5, 4, 0.3);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.9 });
    var door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x - 5.5, y + 0.5, z + 4.8);
    door.castShadow = true;
    group.add(door);

    // Weapon racks using BoxGeometry
    for (var rack = 0; rack < 3; rack++) {
      var rackGeometry = new THREE.BoxGeometry(8, 3, 1);
      var rackMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
      var rackMesh = new THREE.Mesh(rackGeometry, rackMaterial);
      rackMesh.position.set(x + 1, y - 1 + rack * 2, z - 3);
      rackMesh.castShadow = true;
      group.add(rackMesh);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createSolitaryWing(x, y, z) {
    var group = new THREE.Group();

    // Narrow corridor
    var corridorGeometry = new THREE.BoxGeometry(4, 4, 20);
    var corridorMaterial = new THREE.MeshStandardMaterial({ color: COLORS.concrete });
    var corridor = new THREE.Mesh(corridorGeometry, corridorMaterial);
    corridor.position.set(x, y, z);
    corridor.castShadow = true;
    corridor.receiveShadow = true;
    group.add(corridor);

    // Padded cells on both sides
    for (var i = 0; i < 4; i++) {
      var cellPosZ = z - 7.5 + i * 5;

      // Left cell
      var leftCellGeometry = new THREE.BoxGeometry(2, 3, 4);
      var leftCellMaterial = new THREE.MeshStandardMaterial({ color: 0x996666 });
      var leftCell = new THREE.Mesh(leftCellGeometry, leftCellMaterial);
      leftCell.position.set(x - 3, y, cellPosZ);
      leftCell.castShadow = true;
      group.add(leftCell);

      // Right cell
      var rightCell = new THREE.Mesh(leftCellGeometry, leftCellMaterial);
      rightCell.position.set(x + 3, y, cellPosZ);
      rightCell.castShadow = true;
      group.add(rightCell);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createWardensOffice(x, y, z) {
    var group = new THREE.Group();

    // Office room
    var officeGeometry = new THREE.BoxGeometry(10, 4, 12);
    var officeMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var office = new THREE.Mesh(officeGeometry, officeMaterial);
    office.position.set(x, y, z);
    office.castShadow = true;
    office.receiveShadow = true;
    group.add(office);

    // Desk
    var deskGeometry = new THREE.BoxGeometry(6, 1, 3);
    var deskMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x - 2, y - 1.5, z - 3);
    desk.castShadow = true;
    group.add(desk);

    // Safe
    var safeGeometry = new THREE.BoxGeometry(1.5, 2, 1);
    var safeMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray, metalness: 0.7 });
    var safe = new THREE.Mesh(safeGeometry, safeMaterial);
    safe.position.set(x + 4, y, z + 4);
    safe.castShadow = true;
    group.add(safe);

    // Bookshelf
    var shelfGeometry = new THREE.BoxGeometry(4, 3, 1.5);
    var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3728 });
    var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.set(x + 3, y, z - 5);
    shelf.castShadow = true;
    group.add(shelf);

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createControlRoom(x, y, z) {
    var group = new THREE.Group();

    // Control room
    var roomGeometry = new THREE.BoxGeometry(8, 4, 6);
    var roomMaterial = new THREE.MeshStandardMaterial({ color: COLORS.darkGray });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.set(x, y, z);
    room.castShadow = true;
    room.receiveShadow = true;
    group.add(room);

    // Monitor wall using BoxGeometry panels
    for (var monX = 0; monX < 2; monX++) {
      for (var monY = 0; monY < 2; monY++) {
        var monitorGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
        var monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x00FF00 });
        var monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
        monitor.position.set(x - 2 + monX * 2, y + 0.5 + monY * 1.8, z + 2.8);
        monitor.castShadow = true;
        group.add(monitor);
      }
    }

    // Control console
    var consoleGeometry = new THREE.BoxGeometry(6, 1, 2);
    var consoleMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var console = new THREE.Mesh(consoleGeometry, consoleMaterial);
    console.position.set(x, y - 1.5, z - 2);
    console.castShadow = true;
    group.add(console);

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createSewerTunnel(x, y, z) {
    var group = new THREE.Group();

    // Tunnel structure - cylindrical passage made with BoxGeometry
    var tunnelGeometry = new THREE.BoxGeometry(3, 2.5, 25);
    var tunnelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel.position.set(x, y, z);
    tunnel.castShadow = true;
    tunnel.receiveShadow = true;
    group.add(tunnel);

    // Water droplets using SphereGeometry
    for (var drop = 0; drop < 8; drop++) {
      var dropGeometry = new THREE.SphereGeometry(0.1, 4, 4);
      var dropMaterial = new THREE.MeshStandardMaterial({ color: 0x3366CC, transparent: true, opacity: 0.7 });
      var dropMesh = new THREE.Mesh(dropGeometry, dropMaterial);
      dropMesh.position.set(x - 1 + Math.random() * 2, y + 1, z - 10 + drop * 3);
      dropMesh.userData.dropIndex = drop;
      group.add(dropMesh);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createCafeteria(x, y, z) {
    var group = new THREE.Group();

    // Main room
    var cafGeometry = new THREE.BoxGeometry(20, 5, 15);
    var cafMaterial = new THREE.MeshStandardMaterial({ color: COLORS.institutionalGreen });
    var cafeteria = new THREE.Mesh(cafGeometry, cafMaterial);
    cafeteria.position.set(x, y, z);
    cafeteria.castShadow = true;
    cafeteria.receiveShadow = true;
    group.add(cafeteria);

    // Long tables
    for (var t = 0; t < 3; t++) {
      var tableGeometry = new THREE.BoxGeometry(15, 1, 2);
      var tableMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
      var table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(x, y - 1.5, z - 4 + t * 4);
      table.castShadow = true;
      group.add(table);
    }

    // Kitchen area - stove
    var stoveGeometry = new THREE.BoxGeometry(3, 2, 2);
    var stoveMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel });
    var stove = new THREE.Mesh(stoveGeometry, stoveMaterial);
    stove.position.set(x + 8, y - 1, z + 5);
    stove.castShadow = true;
    group.add(stove);

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createMedicalWing(x, y, z) {
    var group = new THREE.Group();

    // Medical wing room
    var medGeometry = new THREE.BoxGeometry(12, 4, 10);
    var medMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    var medical = new THREE.Mesh(medGeometry, medMaterial);
    medical.position.set(x, y, z);
    medical.castShadow = true;
    medical.receiveShadow = true;
    group.add(medical);

    // Hospital beds
    for (var bed = 0; bed < 3; bed++) {
      var bedGeometry = new THREE.BoxGeometry(2, 1, 4);
      var bedMaterial = new THREE.MeshStandardMaterial({ color: 0xE6E6FA });
      var bedMesh = new THREE.Mesh(bedGeometry, bedMaterial);
      bedMesh.position.set(x - 4 + bed * 4, y - 1, z - 3);
      bedMesh.castShadow = true;
      group.add(bedMesh);

      // IV stand using CylinderGeometry
      var standGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 6);
      var standMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel });
      var stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.set(x - 3.5 + bed * 4, y + 1, z - 3);
      stand.castShadow = true;
      group.add(stand);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createLockdownBarriers(x, y, z) {
    var group = new THREE.Group();

    // Multiple drop gates
    for (var i = 0; i < 3; i++) {
      var gateGeometry = new THREE.BoxGeometry(6, 3.5, 0.3);
      var gateMaterial = new THREE.MeshStandardMaterial({ color: COLORS.steel, metalness: 0.9 });
      var gate = new THREE.Mesh(gateGeometry, gateMaterial);
      gate.position.set(x - 10 + i * 10, y, z);
      gate.castShadow = true;
      gate.userData.gateIndex = i;
      gate.userData.isDown = false;
      group.add(gate);
      barriers.push(gate);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createAlarmLights(x, y, z) {
    var group = new THREE.Group();

    // Multiple alarm light fixtures
    for (var light = 0; light < 4; light++) {
      var lightGeometry = new THREE.SphereGeometry(0.3, 4, 4);
      var lightMaterial = new THREE.MeshStandardMaterial({ color: COLORS.bloodRed, emissive: COLORS.bloodRed });
      var lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      lightMesh.position.set(x - 8 + light * 6, y + 4, z);
      lightMesh.userData.alarmIndex = light;
      lightMesh.userData.isFlashing = false;
      group.add(lightMesh);
      alarmLights.push(lightMesh);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function createRiotShieldStations(x, y, z) {
    var group = new THREE.Group();

    // Shield wall mounts
    for (var station = 0; station < 2; station++) {
      var wallGeometry = new THREE.BoxGeometry(4, 2, 0.5);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: COLORS.institutionalGreen });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(x - 6 + station * 12, y, z);
      wall.castShadow = true;
      group.add(wall);

      // Shield rack
      var shieldGeometry = new THREE.BoxGeometry(2.5, 1.5, 0.3);
      var shieldMaterial = new THREE.MeshStandardMaterial({ color: COLORS.warningOrange });
      var shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      shield.position.set(x - 6 + station * 12, y, z - 1);
      shield.castShadow = true;
      group.add(shield);
    }

    group.castShadow = true;
    group.receiveShadow = true;
    scene.add(group);
    meshes.push(group);
    return group;
  }

  function initSpawnPoints() {
    spawnPoints = [
      { name: 'Cell Block', x: -20, y: 2, z: 0 },
      { name: 'Yard', x: 40, y: 1, z: 30 },
      { name: 'Armory', x: 20, y: 2, z: 40 },
      { name: 'Warden Office', x: 0, y: 2, z: 50 },
      { name: 'Tunnel Exit', x: 0, y: -10, z: -40 }
    ];
  }

  var init = function(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    meshes = [];
    guards = [];
    spotlights = [];
    barriers = [];
    alarmLights = [];
    gameState = { alarmActive: false, lockdownActive: false, time: 0 };

    // Add ambient and directional light
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var dirLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    dirLight.position.set(50, 50, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 200;
    scene.add(dirLight);

    // Prison structures
    createCellBlockWing(-20, 0, 0);
    createPrisonYard(40, 0, 30);
    createGuardTower(-40, 0, -30);
    createPerimeterWall(-60, 8, 0, 100, 15);
    createPerimeterWall(60, 8, 0, 100, 15);
    createArmoryRoom(20, 0, 40);
    createSolitaryWing(-15, 0, 30);
    createWardensOffice(0, 0, 50);
    createControlRoom(15, 0, 20);
    createSewerTunnel(0, -10, -40);
    createCafeteria(10, 0, -20);
    createMedicalWing(-10, 0, -35);
    createLockdownBarriers(0, 2, 10);
    createAlarmLights(0, 3, 0);
    createRiotShieldStations(30, 0, 0);

    // Initialize spawn points
    initSpawnPoints();
  };

  var update = function(delta) {
    gameState.time += delta;

    // Guard tower spotlight sweep
    for (var s = 0; s < spotlights.length; s++) {
      var sp = spotlights[s];
      sp.angle += delta * 0.3;
      var offsetX = Math.cos(sp.angle) * 40;
      var offsetZ = Math.sin(sp.angle) * 40;
      sp.light.target.position.set(sp.baseX + offsetX, 0, sp.baseZ + offsetZ);
      sp.mesh.rotation.y = sp.angle;
    }

    // Lockdown barriers cycling
    for (var b = 0; b < barriers.length; b++) {
      var barrier = barriers[b];
      var cyclePhase = (gameState.time + barrier.userData.gateIndex * 1.5) % 6;
      if (cyclePhase < 3) {
        barrier.position.y = Math.sin(cyclePhase * Math.PI / 3) * 3;
      } else {
        barrier.position.y = Math.sin((6 - cyclePhase) * Math.PI / 3) * 3;
      }
    }

    // Cell door animation - opening and closing
    for (var m = 0; m < meshes.length; m++) {
      var mesh = meshes[m];
      if (mesh.children) {
        for (var c = 0; c < mesh.children.length; c++) {
          var child = mesh.children[c];
          if (child.geometry && child.geometry.type === 'BoxGeometry' && child.material.color.getHex() === COLORS.steel) {
            child.rotation.y = Math.sin(gameState.time * 0.5) * 0.3;
          }
        }
      }
    }

    // Sewer water droplet animation
    for (var m = 0; m < meshes.length; m++) {
      var mesh = meshes[m];
      if (mesh.children) {
        for (var c = 0; c < mesh.children.length; c++) {
          var child = mesh.children[c];
          if (child.geometry && child.geometry.type === 'SphereGeometry' && child.userData.dropIndex !== undefined) {
            var dropIdx = child.userData.dropIndex;
            var period = 2 + dropIdx * 0.3;
            var cyclePos = (gameState.time + dropIdx) % period;
            child.position.y -= cyclePos * delta * 5;
            if (child.position.y < -15) {
              child.position.y = 1;
            }
          }
        }
      }
    }

    // Alarm lights flashing
    for (var a = 0; a < alarmLights.length; a++) {
      var alarmLight = alarmLights[a];
      var flashPhase = Math.sin(gameState.time * 3) * 0.5 + 0.5;
      alarmLight.material.emissiveIntensity = flashPhase;
    }

    // Trigger occasional alarms
    if (Math.sin(gameState.time * 0.2) > 0.95) {
      gameState.alarmActive = true;
    } else if (Math.sin(gameState.time * 0.2) < 0.8) {
      gameState.alarmActive = false;
    }
  };

  var reset = function() {
    // Clear all meshes from scene
    for (var i = meshes.length - 1; i >= 0; i--) {
      scene.remove(meshes[i]);
    }
    meshes = [];
    guards = [];
    spotlights = [];
    barriers = [];
    alarmLights = [];
    spawnPoints = [];
    gameState = { alarmActive: false, lockdownActive: false, time: 0 };
  };

  return {
    init: init,
    update: update,
    reset: reset,
    getSpawnPoints: function() { return spawnPoints; },
    getGameState: function() { return gameState; },
    setLockdown: function(active) { gameState.lockdownActive = active; },
    setAlarm: function(active) { gameState.alarmActive = active; }
  };
}());
