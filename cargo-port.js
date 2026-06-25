window.CargoPort = (function() {
  'use strict';

  var sceneRef = null;
  var cameraRef = null;
  var objectsToClean = [];
  var craneArms = [];
  var searchlights = [];
  var animations = {};

  function createMaterial(color, metalness, roughness) {
    var mat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness || 0.6,
      roughness: roughness || 0.4
    });
    return mat;
  }

  function addObject(obj) {
    objectsToClean.push(obj);
    sceneRef.add(obj);
    return obj;
  }

  function createPortCrane(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Base tower
    var towerGeo = new THREE.BoxGeometry(3, 35, 3);
    var towerMat = createMaterial(0x2c2c2c, 0.4, 0.7);
    var tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 17.5;
    group.add(tower);

    // Tower top platform
    var platformGeo = new THREE.BoxGeometry(8, 1.5, 8);
    var platformMat = createMaterial(0x404040, 0.5, 0.6);
    var platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 35;
    group.add(platform);

    // Horizontal arm (BoxGeometry)
    var armGeo = new THREE.BoxGeometry(30, 2, 2);
    var armMat = createMaterial(0x3d3d3d, 0.5, 0.6);
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(15, 35.5, 0);
    arm.rotation.z = -0.05;
    group.add(arm);
    craneArms.push(arm);

    // Cable drum (CylinderGeometry)
    var drumGeo = new THREE.CylinderGeometry(2.5, 2.5, 3, 16);
    var drumMat = createMaterial(0x1a1a1a, 0.7, 0.5);
    var drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(5, 36.5, 0);
    drum.rotation.z = Math.PI / 2;
    group.add(drum);

    // Lifting hook (CylinderGeometry)
    var hookGeo = new THREE.CylinderGeometry(0.6, 0.6, 3, 12);
    var hookMat = createMaterial(0x444444, 0.6, 0.5);
    var hook = new THREE.Mesh(hookGeo, hookMat);
    hook.position.set(20, 15, 0);
    group.add(hook);

    // Hook latch details (small cylinders)
    var latchGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 8);
    var latchMat = createMaterial(0x555555, 0.6, 0.5);
    for (var i = 0; i < 4; i++) {
      var latch = new THREE.Mesh(latchGeo, latchMat);
      latch.position.set(20 + Math.cos(i * Math.PI / 2) * 0.7, 15, Math.sin(i * Math.PI / 2) * 0.7);
      group.add(latch);
    }

    animations[group.uuid] = { type: 'crane', arm: arm, originalRotation: arm.rotation.z };

    return addObject(group);
  }

  function createShippingContainer(x, y, z, color) {
    var containerGeo = new THREE.BoxGeometry(4, 4, 8);
    var containerMat = createMaterial(color, 0.3, 0.8);
    var container = new THREE.Mesh(containerGeo, containerMat);
    container.position.set(x, y, z);

    // Container door details (small boxes)
    var doorGeo = new THREE.BoxGeometry(3.5, 3.5, 0.3);
    var doorMat = createMaterial(0x1a1a1a, 0.2, 0.9);
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.z = 4.15;
    container.add(door);

    // Door handle
    var handleGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 8);
    var handleMat = createMaterial(0x666666, 0.7, 0.5);
    var handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(1.5, 1, 4.3);
    handle.rotation.z = Math.PI / 2;
    container.add(handle);

    return addObject(container);
  }

  function createContainerStack(baseX, baseY, baseZ) {
    var colors = [0xcc3333, 0x3333cc, 0xcccc33, 0xcc6600, 0x999999];
    var stackGroup = new THREE.Group();

    // Create 4-high stacks in various arrangements
    for (var i = 0; i < 4; i++) {
      var container = createShippingContainer(
        baseX + (i % 2) * 4.5,
        baseY + 2 + (i * 4),
        baseZ + Math.floor(i / 2) * 8.5,
        colors[Math.floor(Math.random() * colors.length)]
      );
      stackGroup.add(container);
    }

    return stackGroup;
  }

  function createDockPier(x, y, z, width, depth) {
    var pierGroup = new THREE.Group();
    pierGroup.position.set(x, y, z);

    // Main pier surface
    var pierGeo = new THREE.BoxGeometry(width, 1.5, depth);
    var pierMat = createMaterial(0x8b6f47, 0.4, 0.7);
    var pier = new THREE.Mesh(pierGeo, pierMat);
    pierGroup.add(pier);

    // Pier support pillars (CylinderGeometry)
    var pillarGeo = new THREE.CylinderGeometry(1.2, 1.5, 8, 12);
    var pillarMat = createMaterial(0x556b7a, 0.5, 0.6);
    var pillarSpacing = width / 4;
    for (var i = 1; i < 4; i++) {
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set((i - 1.5) * pillarSpacing, -4, 0);
      pierGroup.add(pillar);
    }

    // Pier edge railings (BoxGeometry)
    var railGeo = new THREE.BoxGeometry(width, 0.8, 0.4);
    var railMat = createMaterial(0xcc9900, 0.5, 0.6);
    var rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.z = depth / 2 + 0.2;
    pierGroup.add(rail1);
    var rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.z = -depth / 2 - 0.2;
    pierGroup.add(rail2);

    return addObject(pierGroup);
  }

  function createWaterArea(x, y, z, width, depth) {
    var waterGeo = new THREE.BoxGeometry(width, 0.5, depth);
    var waterMat = createMaterial(0x1a3a4a, 0.8, 0.4);
    var water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(x, y, z);
    return addObject(water);
  }

  function createCargoShip(x, y, z) {
    var shipGroup = new THREE.Group();
    shipGroup.position.set(x, y, z);

    // Hull
    var hullGeo = new THREE.BoxGeometry(20, 12, 45);
    var hullMat = createMaterial(0x1a1a2e, 0.5, 0.6);
    var hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 6;
    shipGroup.add(hull);

    // Deck
    var deckGeo = new THREE.BoxGeometry(22, 0.8, 47);
    var deckMat = createMaterial(0x4a4a4a, 0.4, 0.7);
    var deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 12;
    shipGroup.add(deck);

    // Bridge superstructure (BoxGeometry)
    var bridgeGeo = new THREE.BoxGeometry(8, 8, 12);
    var bridgeMat = createMaterial(0x2c2c2c, 0.5, 0.6);
    var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(0, 16, -15);
    shipGroup.add(bridge);

    // Bridge windows
    var windowGeo = new THREE.BoxGeometry(1.5, 1.5, 0.3);
    var windowMat = createMaterial(0x3366cc, 0.1, 0.9);
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(-2 + i * 2, 16 + j * 2, -15.2);
        shipGroup.add(window);
      }
    }

    // Funnels (CylinderGeometry)
    var funnelGeo = new THREE.CylinderGeometry(1.8, 2, 12, 16);
    var funnelMat = createMaterial(0xcc3333, 0.4, 0.7);
    var funnel1 = new THREE.Mesh(funnelGeo, funnelMat);
    funnel1.position.set(-3, 20, -12);
    shipGroup.add(funnel1);
    var funnel2 = new THREE.Mesh(funnelGeo, funnelMat);
    funnel2.position.set(3, 20, -12);
    shipGroup.add(funnel2);

    // Mast (CylinderGeometry)
    var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 20, 12);
    var mastMat = createMaterial(0x333333, 0.6, 0.5);
    var mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 22, 0);
    shipGroup.add(mast);

    return addObject(shipGroup);
  }

  function createWarehouse(x, y, z, width, height, depth) {
    var warehouseGroup = new THREE.Group();
    warehouseGroup.position.set(x, y, z);

    // Main structure
    var buildingGeo = new THREE.BoxGeometry(width, height, depth);
    var buildingMat = createMaterial(0x4a4a4a, 0.4, 0.7);
    var building = new THREE.Mesh(buildingGeo, buildingMat);
    building.position.y = height / 2;
    warehouseGroup.add(building);

    // Sliding door gap
    var doorGeo = new THREE.BoxGeometry(width * 0.8, height * 0.7, 0.3);
    var doorMat = createMaterial(0x1a1a1a, 0.1, 0.9);
    var door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, height * 0.35, depth / 2 + 0.2);
    warehouseGroup.add(door);

    // Roof
    var roofGeo = new THREE.BoxGeometry(width + 2, 1, depth + 2);
    var roofMat = createMaterial(0x5a5a5a, 0.5, 0.6);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + 0.5;
    warehouseGroup.add(roof);

    // Roof vents (small boxes)
    for (var i = 0; i < 4; i++) {
      var ventGeo = new THREE.BoxGeometry(2, 1.5, 2);
      var ventMat = createMaterial(0x666666, 0.5, 0.6);
      var vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(-width / 3 + i * width / 3, height + 2, 0);
      warehouseGroup.add(vent);
    }

    return addObject(warehouseGroup);
  }

  function createForklift(x, y, z) {
    var forkGroup = new THREE.Group();
    forkGroup.position.set(x, y, z);

    // Cab body
    var cabGeo = new THREE.BoxGeometry(2.5, 2.5, 3);
    var cabMat = createMaterial(0xcc6600, 0.3, 0.8);
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.y = 1.5;
    forkGroup.add(cab);

    // Engine block
    var engineGeo = new THREE.BoxGeometry(2.2, 1.5, 1.5);
    var engineMat = createMaterial(0x333333, 0.6, 0.5);
    var engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(0, 1, -1.5);
    forkGroup.add(engine);

    // Wheels (CylinderGeometry)
    var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
    var wheelMat = createMaterial(0x1a1a1a, 0.7, 0.4);
    var wheelPositions = [
      [-1, 0.8, -1],
      [1, 0.8, -1],
      [-1, 0.8, 1],
      [1, 0.8, 1]
    ];
    for (var i = 0; i < wheelPositions.length; i++) {
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
      wheel.rotation.z = Math.PI / 2;
      forkGroup.add(wheel);
    }

    // Lifting fork arms (BoxGeometry)
    var forkArmGeo = new THREE.BoxGeometry(0.4, 2.5, 0.6);
    var forkMat = createMaterial(0x666666, 0.6, 0.5);
    var forkLeft = new THREE.Mesh(forkArmGeo, forkMat);
    forkLeft.position.set(-0.8, 1, 1.5);
    forkGroup.add(forkLeft);
    var forkRight = new THREE.Mesh(forkArmGeo, forkMat);
    forkRight.position.set(0.8, 1, 1.5);
    forkGroup.add(forkRight);

    // Fork base plate
    var baseGeo = new THREE.BoxGeometry(2, 0.4, 1.2);
    var baseMat = createMaterial(0x777777, 0.6, 0.5);
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.8, 1.2);
    forkGroup.add(base);

    return addObject(forkGroup);
  }

  function createFuelTankerTruck(x, y, z) {
    var tankerGroup = new THREE.Group();
    tankerGroup.position.set(x, y, z);

    // Cab (BoxGeometry)
    var cabGeo = new THREE.BoxGeometry(2, 2.5, 2.5);
    var cabMat = createMaterial(0xcc3333, 0.4, 0.7);
    var cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(-4, 1.5, 0);
    tankerGroup.add(cab);

    // Tank body (CylinderGeometry)
    var tankGeo = new THREE.CylinderGeometry(2.5, 2.5, 12, 16);
    var tankMat = createMaterial(0x999999, 0.5, 0.6);
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(2, 2.5, 0);
    tank.rotation.z = Math.PI / 2;
    tankerGroup.add(tank);

    // Tank caps (small spheres - using CylinderGeometry instead)
    var capGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 12);
    var capMat = createMaterial(0x666666, 0.6, 0.5);
    var cap1 = new THREE.Mesh(capGeo, capMat);
    cap1.position.set(-3, 4.5, 0);
    cap1.rotation.z = Math.PI / 2;
    tankerGroup.add(cap1);
    var cap2 = new THREE.Mesh(capGeo, capMat);
    cap2.position.set(7, 4.5, 0);
    cap2.rotation.z = Math.PI / 2;
    tankerGroup.add(cap2);

    // Wheels (CylinderGeometry)
    var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
    var wheelMat = createMaterial(0x1a1a1a, 0.7, 0.4);
    var wheelPositions = [
      [-4.5, 0.8, -1.2],
      [-4.5, 0.8, 1.2],
      [-1, 0.8, -1.2],
      [-1, 0.8, 1.2],
      [2, 0.8, -1.2],
      [2, 0.8, 1.2],
      [5, 0.8, -1.2],
      [5, 0.8, 1.2]
    ];
    for (var i = 0; i < wheelPositions.length; i++) {
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
      wheel.rotation.z = Math.PI / 2;
      tankerGroup.add(wheel);
    }

    return addObject(tankerGroup);
  }

  function createGuardPost(x, y, z) {
    var guardGroup = new THREE.Group();
    guardGroup.position.set(x, y, z);

    // Kiosk structure
    var kiosk = new THREE.BoxGeometry(3, 3, 3);
    var kioskMat = createMaterial(0x2c2c2c, 0.4, 0.7);
    var kioskMesh = new THREE.Mesh(kiosk, kioskMat);
    kioskMesh.position.y = 1.5;
    guardGroup.add(kioskMesh);

    // Roof
    var roofGeo = new THREE.BoxGeometry(3.5, 0.8, 3.5);
    var roofMat = createMaterial(0x4a4a4a, 0.4, 0.7);
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.2;
    guardGroup.add(roof);

    // Barrier arm (BoxGeometry pole rotates)
    var armGeo = new THREE.BoxGeometry(0.4, 0.4, 4);
    var armMat = createMaterial(0xcc6600, 0.5, 0.6);
    var arm = new THREE.Mesh(armGeo, armMat);
    arm.position.set(3, 1.5, 0);
    guardGroup.add(arm);

    // Barrier supports
    var supportGeo = new THREE.BoxGeometry(0.6, 2, 0.6);
    var supportMat = createMaterial(0x666666, 0.6, 0.5);
    var support = new THREE.Mesh(supportGeo, supportMat);
    support.position.set(3.5, 1, 0);
    guardGroup.add(support);

    // Window
    var windowGeo = new THREE.BoxGeometry(1.2, 1.2, 0.3);
    var windowMat = createMaterial(0x3366cc, 0.1, 0.9);
    var window = new THREE.Mesh(windowGeo, windowMat);
    window.position.set(0, 2, 1.6);
    guardGroup.add(window);

    animations[guardGroup.uuid] = { type: 'barrier', object: arm, originalPos: arm.position.x };

    return addObject(guardGroup);
  }

  function createSearchlightTower(x, y, z) {
    var towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    // Pole (CylinderGeometry)
    var poleGeo = new THREE.CylinderGeometry(0.4, 0.6, 20, 12);
    var poleMat = createMaterial(0x333333, 0.6, 0.5);
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 10;
    towerGroup.add(pole);

    // Light head (SphereGeometry)
    var lightGeo = new THREE.SphereGeometry(1.5, 16, 12);
    var lightMat = createMaterial(0xffff00, 0.8, 0.3);
    var light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 20;
    towerGroup.add(light);

    // Light housing (BoxGeometry around sphere)
    var housingGeo = new THREE.BoxGeometry(2, 2, 2.5);
    var housingMat = createMaterial(0x444444, 0.5, 0.6);
    var housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.y = 20;
    towerGroup.add(housing);

    // Base foundation
    var baseGeo = new THREE.BoxGeometry(3, 1, 3);
    var baseMat = createMaterial(0x556b7a, 0.5, 0.6);
    var base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.5;
    towerGroup.add(base);

    // Support struts (BoxGeometry)
    var strutGeo = new THREE.BoxGeometry(0.3, 8, 0.3);
    for (var i = 0; i < 4; i++) {
      var strut = new THREE.Mesh(strutGeo, createMaterial(0x666666, 0.6, 0.5));
      var angle = i * Math.PI / 2;
      strut.position.set(Math.cos(angle) * 1.5, 4, Math.sin(angle) * 1.5);
      strut.rotation.z = angle;
      towerGroup.add(strut);
    }

    searchlights.push({ group: towerGroup, light: light, angle: 0 });
    animations[towerGroup.uuid] = { type: 'searchlight', group: towerGroup };

    return addObject(towerGroup);
  }

  function createCargoNet(x, y, z, width, height) {
    var netGroup = new THREE.Group();
    netGroup.position.set(x, y, z);

    var points = [];
    var segments = 8;
    var verticalSegments = 6;

    // Create diamond pattern grid
    for (var i = 0; i <= segments; i++) {
      for (var j = 0; j <= verticalSegments; j++) {
        var px = (i - segments / 2) * (width / segments);
        var py = j * (height / verticalSegments);
        points.push(new THREE.Vector3(px, py, 0));
      }
    }

    // Create LineSegments for net pattern
    var lineGeo = new THREE.BufferGeometry();
    var positions = [];

    // Horizontal lines
    for (var i = 0; i <= segments; i++) {
      for (var j = 0; j < verticalSegments; j++) {
        var idx1 = i * (verticalSegments + 1) + j;
        var idx2 = i * (verticalSegments + 1) + j + 1;
        if (idx1 < points.length && idx2 < points.length) {
          positions.push(points[idx1].x, points[idx1].y, points[idx1].z);
          positions.push(points[idx2].x, points[idx2].y, points[idx2].z);
        }
      }
    }

    // Vertical lines
    for (var i = 0; i < segments; i++) {
      for (var j = 0; j <= verticalSegments; j++) {
        var idx1 = i * (verticalSegments + 1) + j;
        var idx2 = (i + 1) * (verticalSegments + 1) + j;
        if (idx1 < points.length && idx2 < points.length) {
          positions.push(points[idx1].x, points[idx1].y, points[idx1].z);
          positions.push(points[idx2].x, points[idx2].y, points[idx2].z);
        }
      }
    }

    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var lineMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    netGroup.add(lines);

    return addObject(netGroup);
  }

  function createRailroadTracks(startX, startY, startZ, length) {
    var trackGroup = new THREE.Group();
    trackGroup.position.set(startX, startY, startZ);

    var railSpacing = 1.5;
    var tieSpacing = 0.6;

    // Left rail
    var railGeo = new THREE.BoxGeometry(0.3, 0.4, length);
    var railMat = createMaterial(0x4a4a4a, 0.6, 0.5);
    var railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.position.x = -railSpacing / 2;
    trackGroup.add(railLeft);

    // Right rail
    var railRight = new THREE.Mesh(railGeo, railMat);
    railRight.position.x = railSpacing / 2;
    trackGroup.add(railRight);

    // Sleepers (ties)
    var sleepCount = Math.floor(length / tieSpacing);
    for (var i = 0; i < sleepCount; i++) {
      var sleepGeo = new THREE.BoxGeometry(3, 0.3, 0.4);
      var sleepMat = createMaterial(0x5a5a5a, 0.5, 0.6);
      var sleep = new THREE.Mesh(sleepGeo, sleepMat);
      sleep.position.set(0, 0, -length / 2 + i * tieSpacing);
      trackGroup.add(sleep);
    }

    return addObject(trackGroup);
  }

  function init(scene, camera) {
    sceneRef = scene;
    cameraRef = camera;

    // Ground plane (water area)
    createWaterArea(0, -2, 0, 80, 80);

    // Multiple dock piers
    createDockPier(0, 0, -20, 15, 25);
    createDockPier(25, 0, -10, 12, 20);
    createDockPier(-25, 0, -5, 12, 20);

    // Port cranes at various locations
    createPortCrane(-15, 0, -15);
    createPortCrane(0, 0, -25);
    createPortCrane(15, 0, -20);
    createPortCrane(-20, 0, 10);

    // Cargo ships docked
    createCargoShip(0, 0, 30);
    createCargoShip(-35, 0, 35);

    // Warehouses
    createWarehouse(-30, 0, -25, 20, 15, 25);
    createWarehouse(30, 0, -30, 18, 14, 20);
    createWarehouse(-10, 0, 20, 16, 12, 18);

    // Shipping containers in multiple stacks
    var containerColors = [0xcc3333, 0x3333cc, 0xcccc33, 0xcc6600, 0x999999];
    for (var i = 0; i < 8; i++) {
      var baseX = -35 + i * 10;
      for (var j = 0; j < 3; j++) {
        var baseZ = -10 + j * 12;
        createContainerStack(baseX, 0, baseZ);
      }
    }

    // Individual containers scattered
    for (var i = 0; i < 25; i++) {
      var randX = -35 + Math.random() * 70;
      var randZ = -30 + Math.random() * 50;
      var color = containerColors[Math.floor(Math.random() * containerColors.length)];
      createShippingContainer(randX, 2, randZ, color);
    }

    // Forklifts
    createForklift(-25, 0, -10);
    createForklift(10, 0, 5);
    createForklift(-5, 0, 15);
    createForklift(20, 0, -5);

    // Fuel tanker trucks
    createFuelTankerTruck(-30, 0, 20);
    createFuelTankerTruck(25, 0, 15);

    // Guard posts at entrances
    createGuardPost(-40, 0, 0);
    createGuardPost(40, 0, 0);

    // Searchlight towers
    createSearchlightTower(-35, 0, -35);
    createSearchlightTower(35, 0, -35);
    createSearchlightTower(-35, 0, 35);
    createSearchlightTower(35, 0, 35);

    // Cargo nets over container stacks
    createCargoNet(-30, 16, -10, 8, 10);
    createCargoNet(0, 16, 5, 8, 10);
    createCargoNet(20, 16, -15, 8, 10);

    // Railroad tracks
    createRailroadTracks(-20, 0, 40, 35);
    createRailroadTracks(20, 0, 30, 30);

    // More detailed container formations
    for (var i = 0; i < 4; i++) {
      var x = -30 + i * 20;
      for (var j = 0; j < 3; j++) {
        var z = 0 + j * 15;
        for (var k = 0; k < 5; k++) {
          var color = containerColors[(i + j + k) % containerColors.length];
          createShippingContainer(x + (k % 2) * 4.5, 2 + Math.floor(k / 2) * 4, z + (k % 3) * 8, color);
        }
      }
    }

    // Additional scattered elements
    for (var i = 0; i < 3; i++) {
      createSearchlightTower(-20 + i * 20, 0, -40);
    }

    // Ensure we have at least 200 geometry objects
    // Add more containers if needed
    var containerCount = 0;
    for (var i = 0; i < 60; i++) {
      var randX = -40 + Math.random() * 80;
      var randZ = -40 + Math.random() * 70;
      var randY = 2 + Math.floor(Math.random() * 3) * 4;
      var color = containerColors[Math.floor(Math.random() * containerColors.length)];
      if (Math.random() > 0.3) {
        createShippingContainer(randX, randY, randZ, color);
        containerCount++;
      }
    }
  }

  function update(delta) {
    var time = Date.now() * 0.001;

    // Animate crane arms
    for (var i = 0; i < craneArms.length; i++) {
      var arm = craneArms[i];
      var swingAmount = Math.sin(time * 0.3) * 0.15;
      arm.rotation.z = -0.05 + swingAmount;
    }

    // Animate searchlight rotations
    for (var i = 0; i < searchlights.length; i++) {
      var searchlight = searchlights[i];
      searchlight.group.rotation.y += delta * 0.5;
    }

    // Animate barrier arms
    for (var key in animations) {
      var anim = animations[key];
      if (anim.type === 'barrier') {
        var angle = Math.sin(time * 0.4) * 0.5;
        anim.object.rotation.z = angle;
      }
    }
  }

  function reset() {
    for (var i = 0; i < objectsToClean.length; i++) {
      var obj = objectsToClean[i];
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      sceneRef.remove(obj);
    }
    objectsToClean = [];
    craneArms = [];
    searchlights = [];
    animations = {};
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
