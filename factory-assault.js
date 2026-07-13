window.FactoryAssault = (function() {
  'use strict';

  var scene;
  var camera;
  var gameObjects = [];
  var conveyorBelt;
  var roboticArms = [];
  var furnaceGlow;
  var craneBeam;
  var time = 0;

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    time = 0;
    gameObjects = [];
    roboticArms = [];

    // Factory shell - large industrial building
    var factoryGeometry = new THREE.BoxGeometry(200, 80, 150);
    var factoryMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    var factoryShell = new THREE.Mesh(factoryGeometry, factoryMaterial);
    factoryShell.position.set(0, 40, -50);
    factoryShell.castShadow = true;
    factoryShell.receiveShadow = true;
    scene.add(factoryShell);
    gameObjects.push(factoryShell);

    // Assembly line conveyor - main belt
    var conveyorBeltGeometry = new THREE.BoxGeometry(80, 2, 40);
    var conveyorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    conveyorBelt = new THREE.Mesh(conveyorBeltGeometry, conveyorMaterial);
    conveyorBelt.position.set(-60, 5, -40);
    conveyorBelt.castShadow = true;
    conveyorBelt.receiveShadow = true;
    scene.add(conveyorBelt);
    gameObjects.push(conveyorBelt);
    conveyorBelt.userData.originalX = conveyorBelt.position.x;

    // Conveyor rollers (left and right)
    var rollerGeometry = new THREE.CylinderGeometry(3, 3, 80, 16);
    var rollerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    var rollerLeft = new THREE.Mesh(rollerGeometry, rollerMaterial);
    rollerLeft.rotation.z = Math.PI / 2;
    rollerLeft.position.set(-60, 2, -20);
    rollerLeft.castShadow = true;
    scene.add(rollerLeft);
    gameObjects.push(rollerLeft);

    var rollerRight = new THREE.Mesh(rollerGeometry, rollerMaterial);
    rollerRight.rotation.z = Math.PI / 2;
    rollerRight.position.set(-60, 2, -60);
    rollerRight.castShadow = true;
    scene.add(rollerRight);
    gameObjects.push(rollerRight);

    // Robotic arm stations (3 stations)
    createRoboticArmStation(-40, 8, -30);
    createRoboticArmStation(0, 8, -40);
    createRoboticArmStation(40, 8, -50);

    // Industrial furnace
    var furnaceGeometry = new THREE.BoxGeometry(30, 35, 25);
    var furnaceMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    var furnace = new THREE.Mesh(furnaceGeometry, furnaceMaterial);
    furnace.position.set(80, 18, -20);
    furnace.castShadow = true;
    furnace.receiveShadow = true;
    scene.add(furnace);
    gameObjects.push(furnace);

    // Furnace glow effect
    var furnaceGlowGeometry = new THREE.SphereGeometry(12, 16, 16);
    var furnaceGlowMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6600,
      emissive: 0xFF4400,
      roughness: 0.5
    });
    furnaceGlow = new THREE.Mesh(furnaceGlowGeometry, furnaceGlowMaterial);
    furnaceGlow.position.set(80, 18, -20);
    furnaceGlow.castShadow = true;
    scene.add(furnaceGlow);
    gameObjects.push(furnaceGlow);
    furnaceGlow.userData.baseScale = 1;

    // Overhead crane I-beam
    var craneBeamGeometry = new THREE.BoxGeometry(140, 3, 3);
    var craneMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
    craneBeam = new THREE.Mesh(craneBeamGeometry, craneMaterial);
    craneBeam.position.set(-30, 75, -40);
    craneBeam.castShadow = true;
    craneBeam.receiveShadow = true;
    scene.add(craneBeam);
    gameObjects.push(craneBeam);
    craneBeam.userData.originalX = craneBeam.position.x;
    craneBeam.userData.maxTraverse = 40;

    // Chain hoist with LineSegments
    var chainGeometry = new THREE.BufferGeometry();
    var chainPositions = new Float32Array([
      0, 0, 0,
      0, -20, 0,
      2, -20, 0,
      2, 0, 0
    ]);
    chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
    var chainMaterial = new THREE.LineBasicMaterial({ color: 0xCCCCCC });
    var chainLines = new THREE.LineSegments(chainGeometry, chainMaterial);
    chainLines.position.set(-30, 75, -40);
    scene.add(chainLines);
    gameObjects.push(chainLines);

    // Stack of metal stock (raw material piles)
    createMetalStockPile(60, 0, 20);
    createMetalStockPile(70, 0, 40);
    createMetalStockPile(80, 0, 60);

    // Quality inspection station
    var inspectionTableGeometry = new THREE.BoxGeometry(25, 3, 20);
    var inspectionMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, roughness: 0.6 });
    var inspectionTable = new THREE.Mesh(inspectionTableGeometry, inspectionMaterial);
    inspectionTable.position.set(-80, 15, 30);
    inspectionTable.castShadow = true;
    inspectionTable.receiveShadow = true;
    scene.add(inspectionTable);
    gameObjects.push(inspectionTable);

    // Inspection lights
    var inspectionLightGeometry = new THREE.SphereGeometry(2, 12, 12);
    var inspectionLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFFFF,
      roughness: 0.4
    });
    for (var i = 0; i < 3; i++) {
      var light = new THREE.Mesh(inspectionLightGeometry, inspectionLightMaterial);
      light.position.set(-85 + i * 10, 20, 30);
      light.castShadow = true;
      scene.add(light);
      gameObjects.push(light);
    }

    // Loading dock - raised platform
    var loadingDockGeometry = new THREE.BoxGeometry(50, 4, 35);
    var dockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    var loadingDock = new THREE.Mesh(loadingDockGeometry, dockMaterial);
    loadingDock.position.set(-60, 15, 50);
    loadingDock.castShadow = true;
    loadingDock.receiveShadow = true;
    scene.add(loadingDock);
    gameObjects.push(loadingDock);

    // Truck bay
    var truckBayGeometry = new THREE.BoxGeometry(45, 25, 30);
    var truckMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    var truckBay = new THREE.Mesh(truckBayGeometry, truckMaterial);
    truckBay.position.set(-60, 13, 50);
    truckBay.castShadow = true;
    truckBay.receiveShadow = true;
    scene.add(truckBay);
    gameObjects.push(truckBay);

    // Safety cage enclosures (BoxGeometry posts)
    createSafetyCageEnclosure(-20, 10, 20);
    createSafetyCageEnclosure(20, 10, -60);

    // Emergency stop buttons (red spheres)
    var emergencyButtonGeometry = new THREE.SphereGeometry(2, 12, 12);
    var emergencyButtonMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xCC0000,
      roughness: 0.3
    });
    for (var j = 0; j < 4; j++) {
      var button = new THREE.Mesh(emergencyButtonGeometry, emergencyButtonMaterial);
      button.position.set(-90 + j * 60, 35, -50);
      button.castShadow = true;
      scene.add(button);
      gameObjects.push(button);
    }

    // Industrial fire suppression pipes (overhead cylinders)
    var pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 180, 8);
    var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
    for (var k = 0; k < 5; k++) {
      var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(-80 + k * 40, 70, -40);
      pipe.castShadow = true;
      scene.add(pipe);
      gameObjects.push(pipe);
    }

    // Forklift fleet (BoxGeometry body + CylinderGeometry wheels)
    createForklifts();

    // Packing station (tables + boxes)
    createPackingStation(-30, 8, 60);
    createPackingStation(30, 8, 70);

    // Storage racking (tall shelves)
    createStorageRack(70, 15, 20);
    createStorageRack(80, 15, 50);

    // Chemical tank (large cylinder)
    var chemicalTankGeometry = new THREE.CylinderGeometry(12, 12, 35, 16);
    var chemicalMaterial = new THREE.MeshStandardMaterial({ color: 0x00AA00, roughness: 0.9 });
    var chemicalTank = new THREE.Mesh(chemicalTankGeometry, chemicalMaterial);
    chemicalTank.position.set(0, 18, 60);
    chemicalTank.castShadow = true;
    chemicalTank.receiveShadow = true;
    scene.add(chemicalTank);
    gameObjects.push(chemicalTank);

    // Electrical panel (BoxGeometry bank)
    createElectricalPanel(-85, 25, -30);

    // Locker room (wall of lockers)
    createLockerRoom(-75, 20, 0);

    // Waste skip (large bin)
    var wasteSkipGeometry = new THREE.BoxGeometry(25, 20, 20);
    var wasteSkipMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.85 });
    var wasteSkip = new THREE.Mesh(wasteSkipGeometry, wasteSkipMaterial);
    wasteSkip.position.set(50, 10, 30);
    wasteSkip.castShadow = true;
    wasteSkip.receiveShadow = true;
    scene.add(wasteSkip);
    gameObjects.push(wasteSkip);
  }

  function createRoboticArmStation(x, y, z) {
    // Base of robotic arm
    var baseGeometry = new THREE.BoxGeometry(12, 4, 12);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, y, z);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);
    gameObjects.push(base);

    // Arm segments (CylinderGeometry)
    var segment1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
    var armMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
    var segment1 = new THREE.Mesh(segment1Geometry, armMaterial);
    segment1.rotation.z = Math.PI / 2.5;
    segment1.position.set(x + 5, y + 12, z);
    segment1.castShadow = true;
    scene.add(segment1);
    gameObjects.push(segment1);

    var segment2Geometry = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
    var segment2 = new THREE.Mesh(segment2Geometry, armMaterial);
    segment2.rotation.z = Math.PI / 3;
    segment2.position.set(x + 12, y + 18, z);
    segment2.castShadow = true;
    scene.add(segment2);
    gameObjects.push(segment2);

    // Gripper (BoxGeometry)
    var gripperGeometry = new THREE.BoxGeometry(5, 2, 5);
    var gripperMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
    var gripper = new THREE.Mesh(gripperGeometry, gripperMaterial);
    gripper.position.set(x + 18, y + 22, z);
    gripper.castShadow = true;
    scene.add(gripper);
    gameObjects.push(gripper);
    gripper.userData.baseY = gripper.position.y;
    gripper.userData.oscillationAmount = 2;
    gripper.userData.speed = 0.5 + Math.random() * 0.5;

    roboticArms.push({
      base: base,
      segment1: segment1,
      segment2: segment2,
      gripper: gripper,
      baseX: x,
      baseY: y,
      baseZ: z
    });
  }

  function createMetalStockPile(x, y, z) {
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 3; j++) {
        var stockGeometry = new THREE.BoxGeometry(8, 8, 8);
        var stockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 });
        var stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(x + i * 9, y + 4 + j * 9, z);
        stock.castShadow = true;
        stock.receiveShadow = true;
        scene.add(stock);
        gameObjects.push(stock);
      }
    }
  }

  function createSafetyCageEnclosure(x, y, z) {
    // Posts (BoxGeometry)
    for (var i = 0; i < 4; i++) {
      var postGeometry = new THREE.BoxGeometry(1.5, 25, 1.5);
      var postMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.7 });
      var post = new THREE.Mesh(postGeometry, postMaterial);
      var offsetX = (i % 2) === 0 ? -10 : 10;
      var offsetZ = (i < 2) ? -10 : 10;
      post.position.set(x + offsetX, y + 12.5, z + offsetZ);
      post.castShadow = true;
      scene.add(post);
      gameObjects.push(post);
    }

    // Mesh (LineSegments)
    var meshGeometry = new THREE.BufferGeometry();
    var meshPositions = new Float32Array([
      -10, 0, -10,
      10, 0, -10,
      10, 0, 10,
      -10, 0, 10,
      -10, 0, -10
    ]);
    meshGeometry.setAttribute('position', new THREE.BufferAttribute(meshPositions, 3));
    var meshMaterial = new THREE.LineBasicMaterial({ color: 0xFFCC00, linewidth: 2 });
    var meshLines = new THREE.LineSegments(meshGeometry, meshMaterial);
    meshLines.position.set(x, y, z);
    scene.add(meshLines);
    gameObjects.push(meshLines);
  }

  function createForklifts() {
    var positions = [
      { x: -50, z: 70 },
      { x: 20, z: 80 },
      { x: 60, z: 30 }
    ];

    positions.forEach(function(pos) {
      // Body
      var bodyGeometry = new THREE.BoxGeometry(6, 8, 10);
      var forkMaterial = new THREE.MeshStandardMaterial({ color: 0xFF6600, roughness: 0.8 });
      var body = new THREE.Mesh(bodyGeometry, forkMaterial);
      body.position.set(pos.x, 4, pos.z);
      body.castShadow = true;
      body.receiveShadow = true;
      scene.add(body);
      gameObjects.push(body);

      // Wheels (4 CylinderGeometry wheels)
      for (var w = 0; w < 4; w++) {
        var wheelGeometry = new THREE.CylinderGeometry(2, 2, 3, 16);
        var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9 });
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        var wheelX = (w < 2) ? pos.x - 2 : pos.x + 2;
        var wheelZ = (w % 2 === 0) ? pos.z - 4 : pos.z + 4;
        wheel.position.set(wheelX, 2, wheelZ);
        wheel.castShadow = true;
        scene.add(wheel);
        gameObjects.push(wheel);
      }

      // Lifting mast (BoxGeometry)
      var mastGeometry = new THREE.BoxGeometry(4, 12, 2);
      var mastMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.6 });
      var mast = new THREE.Mesh(mastGeometry, mastMaterial);
      mast.position.set(pos.x, 10, pos.z + 2);
      mast.castShadow = true;
      scene.add(mast);
      gameObjects.push(mast);
    });
  }

  function createPackingStation(x, y, z) {
    // Table (BoxGeometry)
    var tableGeometry = new THREE.BoxGeometry(20, 3, 15);
    var tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7 });
    var table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.set(x, y, z);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    gameObjects.push(table);

    // Boxes on table
    for (var b = 0; b < 5; b++) {
      var boxGeometry = new THREE.BoxGeometry(4, 4, 4);
      var boxMaterial = new THREE.MeshStandardMaterial({ color: 0xBB8844, roughness: 0.8 });
      var box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.set(x - 8 + b * 4, y + 4, z);
      box.castShadow = true;
      box.receiveShadow = true;
      scene.add(box);
      gameObjects.push(box);
    }
  }

  function createStorageRack(x, y, z) {
    // Frame (BoxGeometry)
    var frameGeometry = new THREE.BoxGeometry(20, 40, 15);
    var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y + 20, z);
    frame.castShadow = true;
    frame.receiveShadow = true;
    scene.add(frame);
    gameObjects.push(frame);

    // Shelves (BoxGeometry)
    for (var s = 0; s < 5; s++) {
      var shelfGeometry = new THREE.BoxGeometry(18, 2, 13);
      var shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 });
      var shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
      shelf.position.set(x, y + 8 + s * 8, z);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      scene.add(shelf);
      gameObjects.push(shelf);
    }
  }

  function createElectricalPanel(x, y, z) {
    // Main panel (BoxGeometry)
    var panelGeometry = new THREE.BoxGeometry(15, 30, 3);
    var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y, z);
    panel.castShadow = true;
    panel.receiveShadow = true;
    scene.add(panel);
    gameObjects.push(panel);

    // Circuit breakers (small BoxGeometry units)
    for (var c = 0; c < 12; c++) {
      var breakerGeometry = new THREE.BoxGeometry(2, 2, 1);
      var breakerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
      var breaker = new THREE.Mesh(breakerGeometry, breakerMaterial);
      var bx = -6 + (c % 4) * 4;
      var by = 6 + Math.floor(c / 4) * 4;
      breaker.position.set(x + bx, y + by, z + 2);
      breaker.castShadow = true;
      scene.add(breaker);
      gameObjects.push(breaker);
    }
  }

  function createLockerRoom(x, y, z) {
    // Wall of lockers
    for (var row = 0; row < 3; row++) {
      for (var col = 0; col < 6; col++) {
        var lockerGeometry = new THREE.BoxGeometry(4, 5, 2);
        var lockerMaterial = new THREE.MeshStandardMaterial({ color: 0xCC6633, roughness: 0.8 });
        var locker = new THREE.Mesh(lockerGeometry, lockerMaterial);
        locker.position.set(x + col * 5, y + 10 + row * 6, z);
        locker.castShadow = true;
        locker.receiveShadow = true;
        scene.add(locker);
        gameObjects.push(locker);
      }
    }

    // Bench (BoxGeometry)
    var benchGeometry = new THREE.BoxGeometry(30, 2, 4);
    var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    var bench = new THREE.Mesh(benchGeometry, benchMaterial);
    bench.position.set(x + 7, y + 2, z);
    bench.castShadow = true;
    bench.receiveShadow = true;
    scene.add(bench);
    gameObjects.push(bench);
  }

  function update(delta) {
    time += delta;

    // Conveyor belt animation - simulate texture scroll
    if (conveyorBelt) {
      var scrollDistance = (time * 20) % 40;
      conveyorBelt.position.z = conveyorBelt.userData.originalZ - (scrollDistance - 20);
    }

    // Robotic arm oscillation
    roboticArms.forEach(function(arm) {
      if (arm.gripper) {
        var oscillation = Math.sin(time * arm.gripper.userData.speed) * arm.gripper.userData.oscillationAmount;
        arm.gripper.position.y = arm.gripper.userData.baseY + oscillation;

        // Arm segment rotation
        arm.segment1.rotation.z = Math.PI / 2.5 + Math.sin(time * 0.3) * 0.3;
        arm.segment2.rotation.z = Math.PI / 3 + Math.sin(time * 0.25) * 0.25;
      }
    });

    // Furnace glow pulse
    if (furnaceGlow) {
      var glowScale = 1 + Math.sin(time * 1.5) * 0.3;
      furnaceGlow.scale.set(glowScale, glowScale, glowScale);
    }

    // Overhead crane traverse
    if (craneBeam) {
      var craneTraverse = Math.sin(time * 0.4) * craneBeam.userData.maxTraverse;
      craneBeam.position.x = craneBeam.userData.originalX + craneTraverse;
    }
  }

  function reset() {
    time = 0;
    if (conveyorBelt && conveyorBelt.userData.originalX) {
      conveyorBelt.position.x = conveyorBelt.userData.originalX;
    }
    if (craneBeam && craneBeam.userData.originalX) {
      craneBeam.position.x = craneBeam.userData.originalX;
    }
    if (furnaceGlow) {
      furnaceGlow.scale.set(1, 1, 1);
    }
    roboticArms.forEach(function(arm) {
      if (arm.gripper) {
        arm.gripper.position.y = arm.gripper.userData.baseY;
      }
      arm.segment1.rotation.z = Math.PI / 2.5;
      arm.segment2.rotation.z = Math.PI / 3;
    });
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
