var window = window || {};

window.WeaponsDepot = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var animatedObjects = [];
  var hudElement = null;
  var elapsedTime = 0;
  var gameState = {
    weaponsSecured: 0,
    maxWeapons: 12,
    vehiclesDestroyed: 0,
    maxVehicles: 5,
    alarmsTriggered: 0
  };
  var overheadCrane = null;
  var forklift = null;
  var vaultDoor = null;
  var warningLights = [];
  var securityLasers = [];
  var hudVisible = true;
  var lastAKeyTime = 0;
  var lastOKeyTime = 0;

  function createWarehouseFloor() {
    // Massive concrete floor - military gray
    var floorGeometry = new THREE.BoxGeometry(80, 0.5, 80);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);

    // Floor markings - yellow caution lines
    for (var i = 0; i < 4; i++) {
      var markGeometry = new THREE.BoxGeometry(0.3, 0.05, 70);
      var markMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.8 });
      var mark = new THREE.Mesh(markGeometry, markMaterial);
      mark.position.set(-30 + i * 20, 0.15, 0);
      scene.add(mark);
      sceneObjects.push(mark);
    }
  }

  function createWarehouseWalls() {
    // Back wall
    var backWallGeometry = new THREE.BoxGeometry(80, 10, 1);
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.85 });
    var backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, 5, -40);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);
    sceneObjects.push(backWall);

    // Front wall
    var frontWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    frontWall.position.set(0, 5, 40);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    scene.add(frontWall);
    sceneObjects.push(frontWall);

    // Left wall
    var sideWallGeometry = new THREE.BoxGeometry(1, 10, 80);
    var leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-40, 5, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    sceneObjects.push(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(40, 5, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
    sceneObjects.push(rightWall);
  }

  function createShelvingAisles() {
    // Create tall warehouse shelving rows with weapon crates
    var aisleCenterZ = [-20, -5, 5, 20];

    aisleCenterZ.forEach(function(centerZ) {
      // Left shelf row
      for (var i = 0; i < 3; i++) {
        var shelfGeometry = new THREE.BoxGeometry(1, 6, 8);
        var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf.position.set(-25 + i * 10, 3, centerZ);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        scene.add(shelf);
        sceneObjects.push(shelf);
      }

      // Crates on shelves (olive drab military boxes)
      for (var j = 0; j < 3; j++) {
        var crateGeometry = new THREE.BoxGeometry(2, 2, 2.5);
        var crateMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.7 });
        var crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(-25 + j * 10, 4.5, centerZ - 1.5);
        crate.castShadow = true;
        crate.receiveShadow = true;
        scene.add(crate);
        sceneObjects.push(crate);

        // Yellow caution marking on crate
        var markGeometry = new THREE.BoxGeometry(2, 0.2, 2.5);
        var markMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.8 });
        var mark = new THREE.Mesh(markGeometry, markMaterial);
        mark.position.set(-25 + j * 10, 5.5, centerZ - 1.5);
        scene.add(mark);
        sceneObjects.push(mark);
      }

      // Right shelf row
      for (var k = 0; k < 3; k++) {
        var rshelfGeometry = new THREE.BoxGeometry(1, 6, 8);
        var rshelfMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        var rshelf = new THREE.Mesh(rshelfGeometry, rshelfMaterial);
        rshelf.position.set(15 + k * 10, 3, centerZ);
        rshelf.castShadow = true;
        rshelf.receiveShadow = true;
        scene.add(rshelf);
        sceneObjects.push(rshelf);
      }

      // Crates on right shelves
      for (var l = 0; l < 3; l++) {
        var rcrateGeometry = new THREE.BoxGeometry(2, 2, 2.5);
        var rcrateMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F, roughness: 0.7 });
        var rcrate = new THREE.Mesh(rcrateGeometry, rcrateMaterial);
        rcrate.position.set(15 + l * 10, 4.5, centerZ - 1.5);
        rcrate.castShadow = true;
        rcrate.receiveShadow = true;
        scene.add(rcrate);
        sceneObjects.push(rcrate);

        var rmarkGeometry = new THREE.BoxGeometry(2, 0.2, 2.5);
        var rmarkMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.8 });
        var rmark = new THREE.Mesh(rmarkGeometry, rmarkMaterial);
        rmark.position.set(15 + l * 10, 5.5, centerZ - 1.5);
        scene.add(rmark);
        sceneObjects.push(rmark);
      }
    });
  }

  function createMissileSilos() {
    // Vertical silo shafts going deep into ground
    var siloPositions = [[-30, -3, -35], [30, -3, -35], [-25, -3, 35], [25, -3, 35]];

    siloPositions.forEach(function(pos) {
      var siloGeometry = new THREE.CylinderGeometry(2, 2, 12, 16);
      var siloMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.4 });
      var silo = new THREE.Mesh(siloGeometry, siloMaterial);
      silo.position.set(pos[0], pos[1], pos[2]);
      silo.castShadow = true;
      silo.receiveShadow = true;
      scene.add(silo);
      sceneObjects.push(silo);

      // Silo cap (cone on top)
      var capGeometry = new THREE.ConeGeometry(2.2, 1.5, 16);
      var capMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
      var cap = new THREE.Mesh(capGeometry, capMaterial);
      cap.position.set(pos[0], pos[1] + 6.5, pos[2]);
      cap.castShadow = true;
      cap.receiveShadow = true;
      scene.add(cap);
      sceneObjects.push(cap);

      // Red warning light on cap
      var lightGeometry = new THREE.SphereGeometry(0.3, 12, 12);
      var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.8 });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(pos[0], pos[1] + 7.8, pos[2]);
      scene.add(light);
      sceneObjects.push(light);
      warningLights.push({ mesh: light, intensity: 0.8, time: 0 });
    });
  }

  function createTankParkingBay() {
    // Tank parking area with multiple tank shapes
    var tankPositions = [
      [-15, 0, 25],
      [-10, 0, 25],
      [-5, 0, 25],
      [5, 0, 25],
      [10, 0, 25]
    ];

    tankPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Tank body (large rectangular box)
      var bodyGeometry = new THREE.BoxGeometry(3, 1.5, 5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.75;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Turret (cylinder on top)
      var turretGeometry = new THREE.CylinderGeometry(1, 1, 1.2, 12);
      var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.8 });
      var turret = new THREE.Mesh(turretGeometry, turretMaterial);
      turret.position.y = 2.2;
      turret.castShadow = true;
      turret.receiveShadow = true;
      group.add(turret);

      // Gun barrel (cylinder pointing forward)
      var barrelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 12);
      var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
      var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(1.8, 2.2, 0);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      group.add(barrel);

      // Track section (boxes on sides)
      var trackGeometry = new THREE.BoxGeometry(0.4, 0.6, 5);
      var trackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
      var track1 = new THREE.Mesh(trackGeometry, trackMaterial);
      track1.position.set(-1.5, 0.3, 0);
      track1.castShadow = true;
      track1.receiveShadow = true;
      group.add(track1);

      var track2 = new THREE.Mesh(trackGeometry, trackMaterial);
      track2.position.set(1.5, 0.3, 0);
      track2.castShadow = true;
      track2.receiveShadow = true;
      group.add(track2);

      group.position.set(pos[0], pos[1], pos[2]);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createAmmoBunkers() {
    // Reinforced blast walls for ammunition storage
    var bunkerPositions = [[-35, 0, -10], [-35, 0, 10], [35, 0, -10], [35, 0, 10]];

    bunkerPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Main reinforced wall (very thick concrete)
      var wallGeometry = new THREE.BoxGeometry(4, 4, 6);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.y = 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);

      // Door (recessed metal door)
      var doorGeometry = new THREE.BoxGeometry(2, 2.5, 0.3);
      var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.5 });
      var door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set(0, 2, -2.8);
      door.castShadow = true;
      door.receiveShadow = true;
      group.add(door);

      // Yellow warning stripes on door
      for (var i = 0; i < 3; i++) {
        var stripeGeometry = new THREE.BoxGeometry(2, 0.4, 0.4);
        var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.8 });
        var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0, 1.2 + i * 0.6, -2.6);
        group.add(stripe);
      }

      group.position.set(pos[0], pos[1], pos[2]);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createForklift() {
    var group = new THREE.Group();

    // Main body (yellow)
    var bodyGeometry = new THREE.BoxGeometry(2, 1.2, 3);
    var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.7 });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin (darker yellow/orange)
    var cabinGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xCC8800, roughness: 0.8 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 1.7, -0.5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Fork lift arms (two cylinders)
    var forkGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
    var forkMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var fork1 = new THREE.Mesh(forkGeometry, forkMaterial);
    fork1.rotation.z = Math.PI / 2;
    fork1.position.set(-0.5, 1.2, 1);
    fork1.castShadow = true;
    fork1.receiveShadow = true;
    group.add(fork1);

    var fork2 = new THREE.Mesh(forkGeometry, forkMaterial);
    fork2.rotation.z = Math.PI / 2;
    fork2.position.set(0.5, 1.2, 1);
    fork2.castShadow = true;
    fork2.receiveShadow = true;
    group.add(fork2);

    // Wheels
    var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      var xOffset = i < 2 ? -0.8 : 0.8;
      var zOffset = i % 2 === 0 ? -1 : 1;
      wheel.position.set(xOffset, 0.4, zOffset);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    }

    group.position.set(-20, 0, 0);
    forklift = group;
    forklift.forkData = { baseX: -20, direction: 1, speed: 5 };
    scene.add(group);
    sceneObjects.push(group);
    animatedObjects.push(forklift);
  }

  function createClassifiedVault() {
    var group = new THREE.Group();

    // Vault frame (reinforced steel)
    var frameGeometry = new THREE.BoxGeometry(4, 5, 3);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 2.5;
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);

    // Vault door (thick blue steel)
    var doorGeometry = new THREE.BoxGeometry(3.5, 4.5, 0.4);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x4444AA, metalness: 0.8, roughness: 0.3 });
    vaultDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    vaultDoor.position.set(0, 2.5, 1.5);
    vaultDoor.castShadow = true;
    vaultDoor.receiveShadow = true;
    group.add(vaultDoor);
    vaultDoor.doorData = { angle: 0, state: 'closed', cycle: 0 };

    // Door handle
    var handleGeometry = new THREE.SphereGeometry(0.25, 12, 12);
    var handleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.6 });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(1.5, 2.5, 1.9);
    handle.castShadow = true;
    handle.receiveShadow = true;
    group.add(handle);

    // Warning sign (red)
    var signGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    var signMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.6 });
    var sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 4.5, 1.5);
    group.add(sign);

    group.position.set(30, 0, -25);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createLoadingDock() {
    var group = new THREE.Group();

    // Dock platform (raised concrete)
    var platformGeometry = new THREE.BoxGeometry(8, 1, 6);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 0.5, -30);
    platform.castShadow = true;
    platform.receiveShadow = true;
    scene.add(platform);
    sceneObjects.push(platform);

    // Loading truck (large green box)
    var truckGeometry = new THREE.BoxGeometry(4, 2.5, 6);
    var truckMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.8 });
    var truck = new THREE.Mesh(truckGeometry, truckMaterial);
    truck.position.set(0, 2, -30);
    truck.castShadow = true;
    truck.receiveShadow = true;
    scene.add(truck);
    sceneObjects.push(truck);

    // Truck cabin (smaller darker section)
    var cabinGeometry = new THREE.BoxGeometry(3, 2, 2);
    var cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2e0a, roughness: 0.85 });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.5, -27);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    scene.add(cabin);
    sceneObjects.push(cabin);

    // Loading ramp
    var rampGeometry = new THREE.BoxGeometry(4, 0.3, 4);
    var rampMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.85 });
    var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
    ramp.rotation.z = -0.3;
    ramp.position.set(0, 1.8, -26);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);
    sceneObjects.push(ramp);
  }

  function createOverheadCrane() {
    var group = new THREE.Group();

    // Horizontal beam spanning across
    var beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 50, 8);
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.rotation.z = Math.PI / 2;
    beam.position.y = 8;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    // Support columns
    var columnGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
    var columnMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.5 });
    var col1 = new THREE.Mesh(columnGeometry, columnMaterial);
    col1.position.set(-23, 4, 0);
    col1.castShadow = true;
    col1.receiveShadow = true;
    scene.add(col1);
    sceneObjects.push(col1);

    var col2 = new THREE.Mesh(columnGeometry, columnMaterial);
    col2.position.set(23, 4, 0);
    col2.castShadow = true;
    col2.receiveShadow = true;
    scene.add(col2);
    sceneObjects.push(col2);

    // Trolley (moving carriage)
    var trolleyGeometry = new THREE.BoxGeometry(3, 0.8, 2);
    var trolleyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.7 });
    var trolley = new THREE.Mesh(trolleyGeometry, trolleyMaterial);
    trolley.position.set(-15, 7.8, 0);
    trolley.castShadow = true;
    trolley.receiveShadow = true;
    group.add(trolley);

    // Lift hook (cable and hook)
    var hookGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var hookMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.2 });
    var hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(-15, 4.5, 0);
    hook.castShadow = true;
    hook.receiveShadow = true;
    group.add(hook);

    overheadCrane = group;
    overheadCrane.craneData = { trolleyPos: -15, direction: 1, speed: 3 };
    scene.add(group);
    sceneObjects.push(group);
    animatedObjects.push(overheadCrane);
  }

  function createWeaponsInspectionTable() {
    // Large work table with weapon inspection setup
    var group = new THREE.Group();

    // Table surface (metallic)
    var surfaceGeometry = new THREE.BoxGeometry(4, 0.3, 3);
    var surfaceMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.4 });
    var surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface.position.y = 1;
    surface.castShadow = true;
    surface.receiveShadow = true;
    group.add(surface);

    // Legs
    var legGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
    var legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    for (var i = 0; i < 4; i++) {
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set((i < 2 ? -1.8 : 1.8), 0.5, (i % 2 === 0 ? -1.2 : 1.2));
      leg.castShadow = true;
      leg.receiveShadow = true;
      group.add(leg);
    }

    // Inspection lights (hanging above)
    var lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.9 });
    for (var j = 0; j < 2; j++) {
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(-1 + j * 2, 2, 0);
      group.add(light);
    }

    group.position.set(-10, 0, 12);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createSecurityCheckpoint() {
    // Guard station with barrier
    var group = new THREE.Group();

    // Guard booth
    var boothGeometry = new THREE.BoxGeometry(2.5, 2, 2);
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.y = 1;
    booth.castShadow = true;
    booth.receiveShadow = true;
    group.add(booth);

    // Window
    var windowGeometry = new THREE.BoxGeometry(1, 0.8, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.5 });
    var window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(0, 1.3, 1.1);
    group.add(window);

    // Security barrier (red and white striped)
    var barrierGeometry = new THREE.BoxGeometry(4, 1, 0.3);
    var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.8 });
    var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    barrier.position.set(0, 0.5, 2.5);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    group.add(barrier);

    // Warning light on booth
    var alertGeometry = new THREE.SphereGeometry(0.25, 12, 12);
    var alertMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.8 });
    var alert = new THREE.Mesh(alertGeometry, alertMaterial);
    alert.position.set(0, 2.3, 0);
    scene.add(alert);
    sceneObjects.push(alert);
    warningLights.push({ mesh: alert, intensity: 0.8, time: 0 });

    group.position.set(-25, 0, -20);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createBarrelStacks() {
    // Stacked ammunition and fuel barrels
    var stackPositions = [[15, 0, -25], [-5, 0, 30], [35, 0, 15]];

    stackPositions.forEach(function(pos) {
      // Bottom row
      for (var i = 0; i < 3; i++) {
        var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 12);
        var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0xCC3333, roughness: 0.7 });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(pos[0] + i * 1.5 - 1.5, pos[1] + 0.75, pos[2]);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        scene.add(barrel);
        sceneObjects.push(barrel);
      }

      // Middle row
      for (var j = 0; j < 2; j++) {
        var mbarrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 12);
        var mbarrelMaterial = new THREE.MeshStandardMaterial({ color: 0xCC3333, roughness: 0.7 });
        var mbarrel = new THREE.Mesh(mbarrelGeometry, mbarrelMaterial);
        mbarrel.position.set(pos[0] + j * 1.5 - 0.75, pos[1] + 2.25, pos[2]);
        mbarrel.castShadow = true;
        mbarrel.receiveShadow = true;
        scene.add(mbarrel);
        sceneObjects.push(mbarrel);
      }

      // Top barrel
      var tbarrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 12);
      var tbarrelMaterial = new THREE.MeshStandardMaterial({ color: 0xCC3333, roughness: 0.7 });
      var tbarrel = new THREE.Mesh(tbarrelGeometry, tbarrelMaterial);
      tbarrel.position.set(pos[0], pos[1] + 3.75, pos[2]);
      tbarrel.castShadow = true;
      tbarrel.receiveShadow = true;
      scene.add(tbarrel);
      sceneObjects.push(tbarrel);
    });
  }

  function createWeaponsTestRange() {
    // Target walls for weapons testing
    var targetPositions = [[10, 2, 38], [-10, 2, 38], [0, 2, 38]];

    targetPositions.forEach(function(pos) {
      var group = new THREE.Group();

      // Target backing wall (concrete)
      var wallGeometry = new THREE.BoxGeometry(3, 4, 0.5);
      var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.85 });
      var wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.y = 2;
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);

      // Bullseye target (circles)
      var bullseyeGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      var bullseyeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 0.3 });
      var bullseye = new THREE.Mesh(bullseyeGeometry, bullseyeMaterial);
      bullseye.position.set(0, 2, -0.3);
      group.add(bullseye);

      // Red center
      var centerGeometry = new THREE.SphereGeometry(0.5, 12, 12);
      var centerMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.5 });
      var center = new THREE.Mesh(centerGeometry, centerMaterial);
      center.position.set(0, 2, -0.25);
      group.add(center);

      group.position.set(pos[0], pos[1], pos[2]);
      scene.add(group);
      sceneObjects.push(group);
    });
  }

  function createSecurityLasers() {
    // Sweeping security laser grid pattern
    var laserPositions = [
      { startX: -35, startY: 2, startZ: -15, endX: 35, endY: 2, endZ: -15 },
      { startX: -35, startY: 3.5, startZ: 0, endX: 35, endY: 3.5, endZ: 0 },
      { startX: -35, startY: 5, startZ: 15, endX: 35, endY: 5, endZ: 15 }
    ];

    laserPositions.forEach(function(laser) {
      var points = [
        new THREE.Vector3(laser.startX, laser.startY, laser.startZ),
        new THREE.Vector3(laser.endX, laser.endY, laser.endZ)
      ];
      var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 2 });
      var line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      sceneObjects.push(line);
      securityLasers.push({ line: line, time: 0, position: laser });
    });
  }

  function createArmuredVehicleHangar() {
    // Large hangar section for armored vehicles
    var hangarGeometry = new THREE.BoxGeometry(15, 6, 20);
    var hangarMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var hangar = new THREE.Mesh(hangarGeometry, hangarMaterial);
    hangar.position.set(0, 3, -15);
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    scene.add(hangar);
    sceneObjects.push(hangar);

    // Hangar door (metal rolling door - segmented)
    for (var i = 0; i < 3; i++) {
      var segmentGeometry = new THREE.BoxGeometry(15, 1.8, 0.3);
      var segmentMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
      var segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
      segment.position.set(0, 2.5 + i * 1.8, -15.2);
      segment.castShadow = true;
      segment.receiveShadow = true;
      scene.add(segment);
      sceneObjects.push(segment);
    }

    // Yellow warning stripes on hangar door
    for (var j = 0; j < 6; j++) {
      var stripeGeometry = new THREE.BoxGeometry(15, 0.25, 0.2);
      var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.8 });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, 2 + j * 1.2, -14.95);
      scene.add(stripe);
      sceneObjects.push(stripe);
    }
  }

  function updateHUD() {
    if (!hudElement) return;
    var hudText = 'WEAPONS SECURED: ' + gameState.weaponsSecured + '/' + gameState.maxWeapons + '\n' +
                  'VEHICLES NEUTRALIZED: ' + gameState.vehiclesDestroyed + '/' + gameState.maxVehicles + '\n' +
                  'ALARMS TRIGGERED: ' + gameState.alarmsTriggered;
    hudElement.textContent = hudText;
  }

  function handleKeyDown(event) {
    var now = Date.now();
    if (event.key === 'a' || event.key === 'A') {
      lastAKeyTime = now;
    }
    if (event.key === 'o' || event.key === 'O') {
      lastOKeyTime = now;
      if (now - lastAKeyTime < 400) {
        hudVisible = !hudVisible;
        if (hudElement) {
          hudElement.style.display = hudVisible ? 'block' : 'none';
        }
      }
    }
  }

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    sceneObjects = [];
    animatedObjects = [];
    warningLights = [];
    securityLasers = [];
    elapsedTime = 0;
    gameState = {
      weaponsSecured: 0,
      maxWeapons: 12,
      vehiclesDestroyed: 0,
      maxVehicles: 5,
      alarmsTriggered: 0
    };

    // Industrial warehouse atmosphere - dark and shadowy
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 100, 150);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0x444444, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    directionalLight.position.set(40, 50, 40);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    scene.add(directionalLight);

    // Create all environment objects
    createWarehouseFloor();
    createWarehouseWalls();
    createShelvingAisles();
    createMissileSilos();
    createTankParkingBay();
    createAmmoBunkers();
    createForklift();
    createClassifiedVault();
    createLoadingDock();
    createOverheadCrane();
    createWeaponsInspectionTable();
    createSecurityCheckpoint();
    createBarrelStacks();
    createWeaponsTestRange();
    createSecurityLasers();
    createArmuredVehicleHangar();

    // HUD setup
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'weapons-depot-hud';
      hudElement.style.position = 'fixed';
      hudElement.style.top = '20px';
      hudElement.style.left = '20px';
      hudElement.style.color = '#00FF00';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.lineHeight = '1.5';
      hudElement.style.zIndex = '1000';
      hudElement.style.textShadow = '0 0 10px rgba(0,255,0,0.5)';
      document.body.appendChild(hudElement);
    }

    updateHUD();

    // Key listener
    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    elapsedTime += delta;

    // Update overhead crane movement (traverse side to side)
    if (overheadCrane) {
      overheadCrane.craneData.trolleyPos += overheadCrane.craneData.direction * overheadCrane.craneData.speed * delta;
      if (overheadCrane.craneData.trolleyPos > 20 || overheadCrane.craneData.trolleyPos < -20) {
        overheadCrane.craneData.direction *= -1;
      }
      overheadCrane.children[1].position.x = overheadCrane.craneData.trolleyPos;
      overheadCrane.children[2].position.x = overheadCrane.craneData.trolleyPos;
    }

    // Update forklift movement (move along aisle)
    if (forklift) {
      forklift.forkData.baseX += forklift.forkData.direction * forklift.forkData.speed * delta;
      if (forklift.forkData.baseX > 15 || forklift.forkData.baseX < -30) {
        forklift.forkData.direction *= -1;
      }
      forklift.position.x = forklift.forkData.baseX;
    }

    // Update vault door opening/closing cycle
    if (vaultDoor) {
      vaultDoor.doorData.cycle += delta;
      if (vaultDoor.doorData.cycle < 2) {
        vaultDoor.doorData.state = 'opening';
        vaultDoor.doorData.angle = (vaultDoor.doorData.cycle / 2) * (Math.PI / 2);
      } else if (vaultDoor.doorData.cycle < 4) {
        vaultDoor.doorData.state = 'open';
      } else if (vaultDoor.doorData.cycle < 6) {
        vaultDoor.doorData.state = 'closing';
        vaultDoor.doorData.angle = ((6 - vaultDoor.doorData.cycle) / 2) * (Math.PI / 2);
      } else {
        vaultDoor.doorData.cycle = 0;
      }
      vaultDoor.rotation.y = vaultDoor.doorData.angle;
    }

    // Update warning lights flashing
    warningLights.forEach(function(light) {
      light.time += delta;
      var flash = Math.sin(light.time * 4) > 0 ? 1 : 0.3;
      light.mesh.material.emissiveIntensity = light.intensity * flash;
    });

    // Update security laser grid sweep animation
    securityLasers.forEach(function(laser) {
      laser.time += delta;
      var sweep = Math.sin(laser.time * 2) * 0.3;
      var startX = laser.position.startX + sweep;
      var endX = laser.position.endX + sweep;
      var points = [
        new THREE.Vector3(startX, laser.position.startY, laser.position.startZ),
        new THREE.Vector3(endX, laser.position.endY, laser.position.endZ)
      ];
      laser.line.geometry.dispose();
      laser.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
    });

    // Game state updates
    if (Math.random() < 0.008) {
      if (gameState.weaponsSecured < gameState.maxWeapons) {
        gameState.weaponsSecured += 1;
      }
    }

    if (Math.random() < 0.012) {
      if (gameState.vehiclesDestroyed < gameState.maxVehicles) {
        gameState.vehiclesDestroyed += 1;
      }
    }

    if (Math.random() < 0.005) {
      gameState.alarmsTriggered += 1;
    }

    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    // Remove animated objects
    animatedObjects.forEach(function(obj) {
      scene.remove(obj);
    });

    // Remove security lasers
    securityLasers.forEach(function(laser) {
      scene.remove(laser.line);
      if (laser.line.geometry) laser.line.geometry.dispose();
      if (laser.line.material) laser.line.material.dispose();
    });

    sceneObjects = [];
    animatedObjects = [];
    warningLights = [];
    securityLasers = [];
    overheadCrane = null;
    forklift = null;
    vaultDoor = null;
    elapsedTime = 0;
    gameState = {
      weaponsSecured: 0,
      maxWeapons: 12,
      vehiclesDestroyed: 0,
      maxVehicles: 5,
      alarmsTriggered: 0
    };

    updateHUD();
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
