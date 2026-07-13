window.ArmoryRaid = (function() {
  'use strict';

  var scene;
  var camera;
  var armoryObjects = [];
  var lights = [];
  var animationState = {
    vaultDoorRotation: 0,
    securityLightRotation: 0,
    alarmPulse: 0,
    guardBootLights: []
  };

  function createMainStorageHall() {
    var hallGroup = new THREE.Group();

    // Main room floor - large box with tiny Y for flatness
    var floorGeom = new THREE.BoxGeometry(80, 0.5, 100);
    var floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6, roughness: 0.4 });
    var floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = 0;
    hallGroup.add(floor);

    // Ceiling
    var ceilingGeom = new THREE.BoxGeometry(80, 0.5, 100);
    var ceilingMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.5 });
    var ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.y = 15;
    hallGroup.add(ceiling);

    // North wall
    var northWallGeom = new THREE.BoxGeometry(80, 15, 0.8);
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.6 });
    var northWall = new THREE.Mesh(northWallGeom, wallMat);
    northWall.position.set(0, 7.5, -50);
    hallGroup.add(northWall);

    // South wall
    var southWall = new THREE.Mesh(northWallGeom, wallMat);
    southWall.position.set(0, 7.5, 50);
    hallGroup.add(southWall);

    // East wall
    var eastWallGeom = new THREE.BoxGeometry(0.8, 15, 100);
    var eastWall = new THREE.Mesh(eastWallGeom, wallMat);
    eastWall.position.set(40, 7.5, 0);
    hallGroup.add(eastWall);

    // West wall
    var westWall = new THREE.Mesh(eastWallGeom, wallMat);
    westWall.position.set(-40, 7.5, 0);
    hallGroup.add(westWall);

    // Metal shelving on walls - structural beams
    for (var z = -40; z <= 40; z += 20) {
      var shelfGeom = new THREE.BoxGeometry(78, 0.3, 0.6);
      var shelfMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
      for (var y = 2; y <= 12; y += 2) {
        var shelf = new THREE.Mesh(shelfGeom, shelfMat);
        shelf.position.set(0, y, z);
        hallGroup.add(shelf);
      }
    }

    armoryObjects.push(hallGroup);
    return hallGroup;
  }

  function createRifleRacks() {
    var racksGroup = new THREE.Group();
    racksGroup.position.set(-25, 0, 0);

    // Create rifle rack columns and frames
    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 4; col++) {
        var frameGeom = new THREE.BoxGeometry(1.2, 8, 0.4);
        var frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
        var frame = new THREE.Mesh(frameGeom, frameMat);
        frame.position.set(col * 5, 5, row * 5 - 8);
        racksGroup.add(frame);

        // Add rifles as cylinder stubs
        for (var i = 0; i < 6; i++) {
          var rifleGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
          var rifleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2 });
          var rifle = new THREE.Mesh(rifleGeom, rifleMat);
          rifle.rotation.z = Math.PI / 2;
          rifle.position.set(col * 5 - 0.4, 3 + i * 0.8, row * 5 - 8);
          racksGroup.add(rifle);
        }
      }
    }

    armoryObjects.push(racksGroup);
    return racksGroup;
  }

  function createHandgunCaseDisplay() {
    var caseGroup = new THREE.Group();
    caseGroup.position.set(25, 0, -30);

    // Display cases - BoxGeometry glass cabinets
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 4; col++) {
        var caseGeom = new THREE.BoxGeometry(3, 4, 2);
        var caseMat = new THREE.MeshStandardMaterial({
          color: 0x222255,
          metalness: 0.3,
          roughness: 0.1,
          transparent: true,
          opacity: 0.6
        });
        var displayCase = new THREE.Mesh(caseGeom, caseMat);
        displayCase.position.set(col * 4, 3 + row * 5, 0);
        caseGroup.add(displayCase);

        // Handgun stubs inside
        for (var j = 0; j < 3; j++) {
          var handgunGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
          var handgunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95 });
          var handgun = new THREE.Mesh(handgunGeom, handgunMat);
          handgun.rotation.z = Math.PI / 2;
          handgun.position.set(col * 4 - 0.6 + j * 0.4, 3 + row * 5, 0);
          caseGroup.add(handgun);
        }
      }
    }

    armoryObjects.push(caseGroup);
    return caseGroup;
  }

  function createHeavyWeaponsBay() {
    var bayGroup = new THREE.Group();
    bayGroup.position.set(0, 0, 30);

    // Separated room walls
    var bayWallGeom = new THREE.BoxGeometry(25, 10, 0.6);
    var bayWallMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 });
    var bayNorthWall = new THREE.Mesh(bayWallGeom, bayWallMat);
    bayNorthWall.position.set(0, 5, -12.5);
    bayGroup.add(bayNorthWall);

    var baySouthWall = new THREE.Mesh(bayWallGeom, bayWallMat);
    baySouthWall.position.set(0, 5, 12.5);
    bayGroup.add(baySouthWall);

    var bayEastWallGeom = new THREE.BoxGeometry(0.6, 10, 25);
    var bayEastWall = new THREE.Mesh(bayEastWallGeom, bayWallMat);
    bayEastWall.position.set(12.5, 5, 0);
    bayGroup.add(bayEastWall);

    var bayWestWall = new THREE.Mesh(bayEastWallGeom, bayWallMat);
    bayWestWall.position.set(-12.5, 5, 0);
    bayGroup.add(bayWestWall);

    // Rocket launcher pedestals
    for (var i = 0; i < 3; i++) {
      var pedestal = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), bayWallMat);
      pedestal.position.set(-6 + i * 6, 2.5, 0);
      bayGroup.add(pedestal);

      // Launcher tube
      var tubeGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 16);
      var tubeMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
      var tube = new THREE.Mesh(tubeGeom, tubeMat);
      tube.rotation.z = Math.PI / 3.5;
      tube.position.set(-6 + i * 6, 6, 0);
      bayGroup.add(tube);

      // Barrel section
      var barrelGeom = new THREE.CylinderGeometry(0.35, 0.35, 3, 12);
      var barrel = new THREE.Mesh(barrelGeom, tubeMat);
      barrel.rotation.z = Math.PI / 3.5;
      barrel.position.set(-6 + i * 6, 7.5, 0.5);
      bayGroup.add(barrel);
    }

    armoryObjects.push(bayGroup);
    return bayGroup;
  }

  function createGrenadeCrates() {
    var crateGroup = new THREE.Group();
    crateGroup.position.set(25, 0, 0);

    // Crate stacks
    for (var stack = 0; stack < 3; stack++) {
      for (var level = 0; level < 4; level++) {
        var crateGeom = new THREE.BoxGeometry(4, 2, 3);
        var crateMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, metalness: 0.2 });
        var crate = new THREE.Mesh(crateGeom, crateMat);
        crate.position.set(stack * 6, 1 + level * 2, -20);
        crateGroup.add(crate);

        // Visible grenades as spheres
        for (var g = 0; g < 4; g++) {
          var grenadeGeom = new THREE.SphereGeometry(0.25, 8, 8);
          var grenadeMat = new THREE.MeshStandardMaterial({ color: 0x2a6a1a, metalness: 0.6 });
          var grenade = new THREE.Mesh(grenadeGeom, grenadeMat);
          grenade.position.set(stack * 6 - 1.2 + g * 0.8, 2 + level * 2, -20);
          crateGroup.add(grenade);
        }
      }
    }

    armoryObjects.push(crateGroup);
    return crateGroup;
  }

  function createExplosivesVault() {
    var vaultGroup = new THREE.Group();
    vaultGroup.position.set(-20, 0, 30);

    // Reinforced vault door frame
    var doorFrameGeom = new THREE.BoxGeometry(6, 8, 0.4);
    var doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 });
    var doorFrame = new THREE.Mesh(doorFrameGeom, doorFrameMat);
    doorFrame.position.set(0, 4, 0);
    vaultGroup.add(doorFrame);

    // Vault door - will animate
    var doorGeom = new THREE.BoxGeometry(5.8, 7.8, 0.5);
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    var vaultDoor = new THREE.Mesh(doorGeom, doorMat);
    vaultDoor.position.set(0, 4, 2);
    vaultDoor.name = 'vaultDoor';
    vaultGroup.add(vaultDoor);

    // Bolt mechanism - cylinders
    for (var bx = -2; bx <= 2; bx += 1.5) {
      for (var by = 1; by <= 7; by += 2) {
        var boltGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        var boltMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.85 });
        var bolt = new THREE.Mesh(boltGeom, boltMat);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(bx, by, 2.5);
        vaultGroup.add(bolt);
      }
    }

    armoryObjects.push(vaultGroup);
    return vaultGroup;
  }

  function createAmmunitionStorage() {
    var ammoGroup = new THREE.Group();
    ammoGroup.position.set(-30, 0, 10);

    // Shelving system
    for (var shelf = 0; shelf < 6; shelf++) {
      var shelfGeom = new THREE.BoxGeometry(8, 0.3, 6);
      var shelfMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
      var shelfMesh = new THREE.Mesh(shelfGeom, shelfMat);
      shelfMesh.position.set(0, 2 + shelf * 2, 0);
      ammoGroup.add(shelfMesh);

      // Ammunition cans as cylinders
      for (var can = 0; can < 5; can++) {
        var canGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
        var canMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, metalness: 0.5 });
        var canMesh = new THREE.Mesh(canGeom, canMat);
        canMesh.position.set(-3 + can * 1.6, 3 + shelf * 2, 0);
        ammoGroup.add(canMesh);
      }
    }

    armoryObjects.push(ammoGroup);
    return ammoGroup;
  }

  function createCleaningMaintenance() {
    var maintenanceGroup = new THREE.Group();
    maintenanceGroup.position.set(15, 0, -25);

    // Workbench - BoxGeometry table
    var benchGeom = new THREE.BoxGeometry(8, 4, 3);
    var benchMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6 });
    var bench = new THREE.Mesh(benchGeom, benchMat);
    bench.position.set(0, 2, 0);
    maintenanceGroup.add(bench);

    // Tools as cylinder stubs
    var toolPositions = [
      { x: -3, y: 4.5, z: -1 },
      { x: -1.5, y: 4.5, z: -1 },
      { x: 0, y: 4.5, z: -1 },
      { x: 1.5, y: 4.5, z: -1 },
      { x: 3, y: 4.5, z: -1 }
    ];

    for (var t = 0; t < toolPositions.length; t++) {
      var toolGeom = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 6);
      var toolMat = new THREE.MeshStandardMaterial({ color: 0xaaaa55, metalness: 0.7 });
      var tool = new THREE.Mesh(toolGeom, toolMat);
      tool.position.set(toolPositions[t].x, toolPositions[t].y, toolPositions[t].z);
      maintenanceGroup.add(tool);
    }

    // Tool rack frame
    var rackGeom = new THREE.BoxGeometry(9, 3, 0.5);
    var rackMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.65 });
    var rack = new THREE.Mesh(rackGeom, rackMat);
    rack.position.set(0, 6, -2);
    maintenanceGroup.add(rack);

    armoryObjects.push(maintenanceGroup);
    return maintenanceGroup;
  }

  function createCommandersOffice() {
    var officeGroup = new THREE.Group();
    officeGroup.position.set(-35, 0, -30);

    // Desk - BoxGeometry
    var deskGeom = new THREE.BoxGeometry(6, 3, 3);
    var deskMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, metalness: 0.4 });
    var desk = new THREE.Mesh(deskGeom, deskMat);
    desk.position.set(0, 1.5, 0);
    officeGroup.add(desk);

    // Chair base
    var chairGeom = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    var chairMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.3 });
    var chairBase = new THREE.Mesh(chairGeom, chairMat);
    chairBase.position.set(0, 0.25, 3);
    officeGroup.add(chairBase);

    // Chair back
    var backGeom = new THREE.BoxGeometry(1.5, 3, 0.3);
    var back = new THREE.Mesh(backGeom, chairMat);
    back.position.set(0, 2, 3.5);
    officeGroup.add(back);

    // Flagpole
    var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 6, 12);
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
    var flagpole = new THREE.Mesh(poleGeom, poleMat);
    flagpole.position.set(3, 3, -2);
    officeGroup.add(flagpole);

    // Flag as box
    var flagGeom = new THREE.BoxGeometry(2, 1.2, 0.1);
    var flagMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, metalness: 0.2 });
    var flag = new THREE.Mesh(flagGeom, flagMat);
    flag.position.set(4.2, 5, -2);
    officeGroup.add(flag);

    armoryObjects.push(officeGroup);
    return officeGroup;
  }

  function createArmorerToolWall() {
    var toolWallGroup = new THREE.Group();
    toolWallGroup.position.set(35, 0, -20);

    // Pegboard backing
    var boardGeom = new THREE.BoxGeometry(10, 8, 0.5);
    var boardMat = new THREE.MeshStandardMaterial({ color: 0x6a5a4a, metalness: 0.3 });
    var board = new THREE.Mesh(boardGeom, boardMat);
    board.position.set(0, 4, 0);
    toolWallGroup.add(board);

    // Tool outlines as LineSegments
    var points = [];
    for (var tx = -4; tx <= 4; tx += 2) {
      for (var ty = 1; ty <= 7; ty += 2) {
        // Tool silhouette outline
        points.push(new THREE.Vector3(tx - 0.4, ty, 0.3));
        points.push(new THREE.Vector3(tx + 0.4, ty, 0.3));
        points.push(new THREE.Vector3(tx + 0.4, ty - 0.6, 0.3));
        points.push(new THREE.Vector3(tx - 0.4, ty - 0.6, 0.3));
      }
    }

    var lineGeom = new THREE.BufferGeometry();
    lineGeom.setFromPoints(points);
    var lineMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    var toolOutlines = new THREE.LineSegments(lineGeom, lineMat);
    toolWallGroup.add(toolOutlines);

    armoryObjects.push(toolWallGroup);
    return toolWallGroup;
  }

  function createSecurityKeypads() {
    var keypadGroup = new THREE.Group();

    // Keypad panels on walls - glowing boxes
    var keypadPositions = [
      { x: -39, y: 6, z: 0 },
      { x: 39, y: 6, z: 0 },
      { x: 0, y: 6, z: -49 },
      { x: 0, y: 6, z: 49 }
    ];

    for (var k = 0; k < keypadPositions.length; k++) {
      var padGeom = new THREE.BoxGeometry(1.2, 1.5, 0.3);
      var padMat = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        emissive: 0x00aa00,
        metalness: 0.7
      });
      var pad = new THREE.Mesh(padGeom, padMat);
      pad.position.set(keypadPositions[k].x, keypadPositions[k].y, keypadPositions[k].z);
      keypadGroup.add(pad);
    }

    armoryObjects.push(keypadGroup);
    return keypadGroup;
  }

  function createSecurityLights() {
    var lightsGroup = new THREE.Group();

    // Rotating spotlight beacon
    var beaconGeom = new THREE.SphereGeometry(0.4, 12, 12);
    var beaconMat = new THREE.MeshStandardMaterial({
      color: 0xffffaa,
      emissive: 0xffff00,
      metalness: 0.8
    });
    var beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(0, 14, 0);
    beacon.name = 'securityBeacon';
    lightsGroup.add(beacon);

    // Alarm strobe light
    var strobeGeom = new THREE.SphereGeometry(0.3, 10, 10);
    var strobeMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xaa0000,
      metalness: 0.8
    });
    var strobe = new THREE.Mesh(strobeGeom, strobeMat);
    strobe.position.set(20, 14, 20);
    strobe.name = 'alarmStrobe';
    lightsGroup.add(strobe);

    armoryObjects.push(lightsGroup);
    return lightsGroup;
  }

  function createHardenedEntry() {
    var entryGroup = new THREE.Group();
    entryGroup.position.set(0, 0, -48);

    // Thick reinforced door sections
    for (var layer = 0; layer < 3; layer++) {
      var doorLayerGeom = new THREE.BoxGeometry(6, 7, 0.8);
      var doorLayerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85 });
      var doorLayer = new THREE.Mesh(doorLayerGeom, doorLayerMat);
      doorLayer.position.set(0, 3.5, -0.5 - layer * 1.2);
      entryGroup.add(doorLayer);
    }

    // Security frame
    var frameGeom = new THREE.BoxGeometry(7, 8, 0.5);
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(0, 4, -3);
    entryGroup.add(frame);

    armoryObjects.push(entryGroup);
    return entryGroup;
  }

  function createGuardBooth() {
    var boothGroup = new THREE.Group();
    boothGroup.position.set(35, 0, 40);

    // Booth structure
    var boothGeom = new THREE.BoxGeometry(4, 5, 4);
    var boothMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5 });
    var booth = new THREE.Mesh(boothGeom, boothMat);
    booth.position.set(0, 2.5, 0);
    boothGroup.add(booth);

    // Window - glass panel
    var windowGeom = new THREE.BoxGeometry(2.5, 2.5, 0.2);
    var windowMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      metalness: 0.2,
      transparent: true,
      opacity: 0.5
    });
    var window = new THREE.Mesh(windowGeom, windowMat);
    window.position.set(0, 3, 2.3);
    boothGroup.add(window);

    // Desk inside
    var boothDeskGeom = new THREE.BoxGeometry(3, 2, 2);
    var boothDeskMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.4 });
    var boothDesk = new THREE.Mesh(boothDeskGeom, boothDeskMat);
    boothDesk.position.set(0, 1.5, 0);
    boothGroup.add(boothDesk);

    // Booth light
    var boothLightGeom = new THREE.SphereGeometry(0.25, 8, 8);
    var boothLightMat = new THREE.MeshStandardMaterial({
      color: 0xffccaa,
      emissive: 0xffaa00,
      metalness: 0.7
    });
    var boothLight = new THREE.Mesh(boothLightGeom, boothLightMat);
    boothLight.position.set(0, 4.8, 0);
    boothLight.name = 'boothLight1';
    boothGroup.add(boothLight);
    animationState.guardBootLights.push(boothLight);

    armoryObjects.push(boothGroup);
    return boothGroup;
  }

  function createEvidenceRoom() {
    var evidenceGroup = new THREE.Group();
    evidenceGroup.position.set(-35, 0, 10);

    // Mesh cage frame
    var cageGeom = new THREE.BoxGeometry(6, 5, 6);
    var cageMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      wireframe: true,
      metalness: 0.8
    });
    var cageFrame = new THREE.Mesh(cageGeom, cageMat);
    cageFrame.position.set(0, 2.5, 0);
    evidenceGroup.add(cageFrame);

    // Cage door
    var doorGeom = new THREE.BoxGeometry(2, 4.5, 0.2);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      wireframe: true,
      metalness: 0.8
    });
    var cageDoor = new THREE.Mesh(doorGeom, doorMat);
    cageDoor.position.set(-3.2, 2.5, 3.2);
    evidenceGroup.add(cageDoor);

    // Items inside as spheres
    for (var ei = 0; ei < 5; ei++) {
      var itemGeom = new THREE.SphereGeometry(0.3, 8, 8);
      var itemMat = new THREE.MeshStandardMaterial({ color: 0x8844ff, metalness: 0.5 });
      var item = new THREE.Mesh(itemGeom, itemMat);
      item.position.set(-1.5 + ei * 1, 1.5, 0);
      evidenceGroup.add(item);
    }

    armoryObjects.push(evidenceGroup);
    return evidenceGroup;
  }

  function createLoadingZone() {
    var loadingGroup = new THREE.Group();
    loadingGroup.position.set(20, 0, 50);

    // Loading dock platform
    var dockGeom = new THREE.BoxGeometry(15, 1, 8);
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x5a5a3a, metalness: 0.4 });
    var dock = new THREE.Mesh(dockGeom, dockMat);
    dock.position.set(0, 0.5, 0);
    loadingGroup.add(dock);

    // Transport vehicles outside
    var vehicleGeom = new THREE.BoxGeometry(8, 3, 4);
    var vehicleMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6 });
    var vehicle1 = new THREE.Mesh(vehicleGeom, vehicleMat);
    vehicle1.position.set(-10, 1.5, 0);
    loadingGroup.add(vehicle1);

    var vehicle2 = new THREE.Mesh(vehicleGeom, vehicleMat);
    vehicle2.position.set(10, 1.5, 0);
    loadingGroup.add(vehicle2);

    // Wheels as cylinders
    var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    var wheelPositions = [
      { x: -10, y: 0.6, z: -2 },
      { x: -10, y: 0.6, z: 2 },
      { x: 10, y: 0.6, z: -2 },
      { x: 10, y: 0.6, z: 2 }
    ];

    for (var w = 0; w < wheelPositions.length; w++) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelPositions[w].x, wheelPositions[w].y, wheelPositions[w].z);
      loadingGroup.add(wheel);
    }

    armoryObjects.push(loadingGroup);
    return loadingGroup;
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    armoryObjects = [];
    animationState.vaultDoorRotation = 0;
    animationState.securityLightRotation = 0;
    animationState.alarmPulse = 0;
    animationState.guardBootLights = [];

    // Add all armory sections
    scene.add(createMainStorageHall());
    scene.add(createRifleRacks());
    scene.add(createHandgunCaseDisplay());
    scene.add(createHeavyWeaponsBay());
    scene.add(createGrenadeCrates());
    scene.add(createExplosivesVault());
    scene.add(createAmmunitionStorage());
    scene.add(createCleaningMaintenance());
    scene.add(createCommandersOffice());
    scene.add(createArmorerToolWall());
    scene.add(createSecurityKeypads());
    scene.add(createSecurityLights());
    scene.add(createHardenedEntry());
    scene.add(createGuardBooth());
    scene.add(createEvidenceRoom());
    scene.add(createLoadingZone());

    // Add directional light for main illumination
    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 20, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Add some ambient light
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Add point lights near security beacons
    var beaconLight = new THREE.PointLight(0xffff00, 1.5, 40);
    beaconLight.position.set(0, 14, 0);
    scene.add(beaconLight);

    var strobeLight = new THREE.PointLight(0xff0000, 1, 30);
    strobeLight.position.set(20, 14, 20);
    scene.add(strobeLight);

    lights.push(dirLight);
    lights.push(ambientLight);
    lights.push(beaconLight);
    lights.push(strobeLight);
  }

  function update(delta) {
    // Security beacon rotation
    var beacon = scene.getObjectByName('securityBeacon');
    if (beacon) {
      beacon.rotation.y += delta * 2;
    }

    // Alarm strobe pulse
    var strobe = scene.getObjectByName('alarmStrobe');
    if (strobe) {
      animationState.alarmPulse += delta * 3;
      var pulseValue = Math.sin(animationState.alarmPulse) * 0.5 + 0.5;
      strobe.material.emissiveIntensity = pulseValue;
    }

    // Vault door slow opening animation
    var vaultDoor = scene.getObjectByName('vaultDoor');
    if (vaultDoor && animationState.vaultDoorRotation < 1.2) {
      animationState.vaultDoorRotation += delta * 0.3;
      vaultDoor.rotation.y = Math.min(animationState.vaultDoorRotation, 1.2);
    }

    // Guard booth lights flicker effect
    for (var i = 0; i < animationState.guardBootLights.length; i++) {
      var light = animationState.guardBootLights[i];
      var flicker = Math.random() * 0.3 + 0.7;
      light.material.emissiveIntensity = flicker;
    }
  }

  function reset() {
    animationState.vaultDoorRotation = 0;
    animationState.securityLightRotation = 0;
    animationState.alarmPulse = 0;

    var vaultDoor = scene.getObjectByName('vaultDoor');
    if (vaultDoor) {
      vaultDoor.rotation.y = 0;
    }

    var strobe = scene.getObjectByName('alarmStrobe');
    if (strobe) {
      strobe.material.emissiveIntensity = 1;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
