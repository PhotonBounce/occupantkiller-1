window.FuelStation = (function() {
  'use strict';

  var scene, camera;
  var stationGroup;
  var burningTanker;
  var fireEmitters = [];
  var smokeSpheres = [];
  var emergencyLights = [];
  var fuelSpill;
  var hoseReels = [];
  var priceSigns = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    stationGroup = new THREE.Group();
    scene.add(stationGroup);

    // Ground reference plane (very thin)
    var groundGeom = new THREE.BoxGeometry(200, 0.1, 200);
    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a3a,
      roughness: 0.9,
      metalness: 0.1
    });
    var ground = new THREE.Mesh(groundGeom, groundMat);
    ground.receiveShadow = true;
    stationGroup.add(ground);

    // Pump island canopy with BoxGeometry roof and CylinderGeometry columns
    createPumpIsland();

    // Individual fuel pump dispensers
    createFuelPumps();

    // Underground tank vents
    createTankVents();

    // Large fuel tanker truck
    createFuelTankerTruck();

    // Fuel bowser trailer
    createBowserTrailer();

    // Service building/office
    createServiceBuilding();

    // Fire extinguisher station
    createExtinguisherStation();

    // Drip tray containment
    createDripTray();

    // Fuel hose reels
    createHoseReels();

    // Price/fuel grade signs
    createSigns();

    // Emergency fuel shutoff posts
    createShutoffPosts();

    // Burning overturned tanker
    createBurningTanker();

    // Spilled fuel
    createFuelSpill();

    // Ammo dump temporary storage
    createAmmoDump();

    // Sandbag perimeter
    createSandbagPerimeter();

    // Crash barrier posts
    createBarrierPosts();

    // Tire tracks in ground
    createTireTracks();

    return stationGroup;
  }

  function createPumpIsland() {
    var islandGroup = new THREE.Group();
    islandGroup.position.set(-20, 0, -10);
    stationGroup.add(islandGroup);

    // Canopy roof - BoxGeometry
    var roofGeom = new THREE.BoxGeometry(12, 0.3, 8);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.3
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 4.5;
    roof.castShadow = true;
    roof.receiveShadow = true;
    islandGroup.add(roof);

    // Support columns - CylinderGeometry
    var columnGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
    var columnMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8,
      metalness: 0.4
    });

    var corners = [
      { x: -5, z: -3 },
      { x: 5, z: -3 },
      { x: -5, z: 3 },
      { x: 5, z: 3 }
    ];

    corners.forEach(function(pos) {
      var col = new THREE.Mesh(columnGeom, columnMat);
      col.position.set(pos.x, 2, pos.z);
      col.castShadow = true;
      col.receiveShadow = true;
      islandGroup.add(col);
    });
  }

  function createFuelPumps() {
    var pumpsGroup = new THREE.Group();
    pumpsGroup.position.set(-20, 0.5, -10);
    stationGroup.add(pumpsGroup);

    var pumpPositions = [
      { x: -3, z: -2 },
      { x: 3, z: -2 },
      { x: -3, z: 2 },
      { x: 3, z: 2 }
    ];

    pumpPositions.forEach(function(pos) {
      var pumpGroup = new THREE.Group();
      pumpGroup.position.set(pos.x, 0, pos.z);
      pumpsGroup.add(pumpGroup);

      // Pump body - BoxGeometry
      var bodyGeom = new THREE.BoxGeometry(0.6, 1.2, 0.5);
      var bodyMat = new THREE.MeshStandardMaterial({
        color: 0xdd3333,
        roughness: 0.6,
        metalness: 0.5
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      pumpGroup.add(body);

      // Pump nozzle hose - CylinderGeometry
      var nozzleGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12);
      var nozzleMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.7
      });
      var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
      nozzle.position.set(0.4, 1.1, 0);
      nozzle.rotation.z = Math.PI / 4;
      nozzle.castShadow = true;
      pumpGroup.add(nozzle);

      // Display screen - BoxGeometry
      var screenGeom = new THREE.BoxGeometry(0.5, 0.4, 0.05);
      var screenMat = new THREE.MeshStandardMaterial({
        color: 0x001100,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8
      });
      var screen = new THREE.Mesh(screenGeom, screenMat);
      screen.position.set(0, 1.0, 0.3);
      pumpGroup.add(screen);
    });
  }

  function createTankVents() {
    var ventsGroup = new THREE.Group();
    ventsGroup.position.set(0, 0, 0);
    stationGroup.add(ventsGroup);

    var ventPositions = [
      { x: -15, z: -20 },
      { x: -5, z: -25 },
      { x: 10, z: -22 }
    ];

    ventPositions.forEach(function(pos) {
      // Underground vent pipe - CylinderGeometry
      var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12);
      var pipeMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.9,
        metalness: 0.3
      });
      var pipe = new THREE.Mesh(pipeGeom, pipeMat);
      pipe.position.set(pos.x, 0.4, pos.z);
      pipe.castShadow = true;
      ventsGroup.add(pipe);

      // Vent grate top - BoxGeometry
      var grateGeom = new THREE.BoxGeometry(0.8, 0.1, 0.8);
      var grateMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.6
      });
      var grate = new THREE.Mesh(grateGeom, grateMat);
      grate.position.set(pos.x, 0.85, pos.z);
      ventsGroup.add(grate);
    });
  }

  function createFuelTankerTruck() {
    var tankerGroup = new THREE.Group();
    tankerGroup.position.set(30, 0, -15);
    tankerGroup.rotation.y = Math.PI / 6;
    stationGroup.add(tankerGroup);

    // Truck cab - BoxGeometry
    var cabGeom = new THREE.BoxGeometry(1.8, 1.5, 2.0);
    var cabMat = new THREE.MeshStandardMaterial({
      color: 0x1a5a1a,
      roughness: 0.6,
      metalness: 0.4
    });
    var cab = new THREE.Mesh(cabGeom, cabMat);
    cab.position.set(0, 1.0, -3);
    cab.castShadow = true;
    tankerGroup.add(cab);

    // Large cylindrical tank - CylinderGeometry
    var tankGeom = new THREE.CylinderGeometry(1.8, 1.8, 6, 16);
    var tankMat = new THREE.MeshStandardMaterial({
      color: 0xccaa00,
      roughness: 0.5,
      metalness: 0.7
    });
    var tank = new THREE.Mesh(tankGeom, tankMat);
    tank.position.set(0, 1.5, 0);
    tank.rotation.z = Math.PI / 2;
    tank.castShadow = true;
    tank.receiveShadow = true;
    tankerGroup.add(tank);

    // Wheels - CylinderGeometry
    var wheelGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
    var wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.8,
      metalness: 0.2
    });

    var wheelPositions = [
      { x: -1.2, z: -3.5 },
      { x: 1.2, z: -3.5 },
      { x: -1.2, z: 1.5 },
      { x: 1.2, z: 1.5 }
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(pos.x, 0.65, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      tankerGroup.add(wheel);
    });
  }

  function createBowserTrailer() {
    var bowserGroup = new THREE.Group();
    bowserGroup.position.set(50, 0, 5);
    bowserGroup.rotation.y = -Math.PI / 8;
    stationGroup.add(bowserGroup);

    // Trailer frame - BoxGeometry
    var frameGeom = new THREE.BoxGeometry(1.2, 1.0, 4);
    var frameMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.7,
      metalness: 0.5
    });
    var frame = new THREE.Mesh(frameGeom, frameMat);
    frame.position.set(0, 0.5, 0);
    frame.castShadow = true;
    bowserGroup.add(frame);

    // Cylindrical tank - CylinderGeometry
    var bowserTankGeom = new THREE.CylinderGeometry(1.5, 1.5, 3.5, 16);
    var bowserMat = new THREE.MeshStandardMaterial({
      color: 0xaa8833,
      roughness: 0.5,
      metalness: 0.6
    });
    var bowserTank = new THREE.Mesh(bowserTankGeom, bowserMat);
    bowserTank.position.set(0, 1.5, 0);
    bowserTank.rotation.z = Math.PI / 2;
    bowserTank.castShadow = true;
    bowserGroup.add(bowserTank);

    // Small wheels - CylinderGeometry
    var smallWheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12);
    var smallWheelMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.8,
      metalness: 0.2
    });

    var bowserWheels = [
      { x: -0.8, z: -1.2 },
      { x: 0.8, z: -1.2 },
      { x: -0.8, z: 1.2 },
      { x: 0.8, z: 1.2 }
    ];

    bowserWheels.forEach(function(pos) {
      var wheel = new THREE.Mesh(smallWheelGeom, smallWheelMat);
      wheel.position.set(pos.x, 0.45, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      bowserGroup.add(wheel);
    });
  }

  function createServiceBuilding() {
    var buildingGroup = new THREE.Group();
    buildingGroup.position.set(-40, 0, 20);
    stationGroup.add(buildingGroup);

    // Main structure - BoxGeometry
    var wallGeom = new THREE.BoxGeometry(8, 4, 6);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x664444,
      roughness: 0.8,
      metalness: 0.2
    });
    var walls = new THREE.Mesh(wallGeom, wallMat);
    walls.position.y = 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    buildingGroup.add(walls);

    // Roof - BoxGeometry
    var roofGeom = new THREE.BoxGeometry(8.5, 0.4, 6.5);
    var roofMat = new THREE.MeshStandardMaterial({
      color: 0x664422,
      roughness: 0.7,
      metalness: 0.3
    });
    var roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.y = 4.2;
    roof.castShadow = true;
    buildingGroup.add(roof);

    // Windows - BoxGeometry
    var windowGeom = new THREE.BoxGeometry(1, 1, 0.1);
    var windowMat = new THREE.MeshStandardMaterial({
      color: 0x223366,
      roughness: 0.3,
      metalness: 0.2
    });

    var windowPositions = [
      { x: -2.5, z: -3.5, y: 2 },
      { x: 2.5, z: -3.5, y: 2 },
      { x: -3.5, z: 0, y: 2 }
    ];

    windowPositions.forEach(function(pos) {
      var window = new THREE.Mesh(windowGeom, windowMat);
      window.position.set(pos.x, pos.y, pos.z);
      buildingGroup.add(window);
    });

    // Door - BoxGeometry
    var doorGeom = new THREE.BoxGeometry(1.2, 2, 0.1);
    var doorMat = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.6,
      metalness: 0.4
    });
    var door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(3.5, 1, -3.5);
    buildingGroup.add(door);
  }

  function createExtinguisherStation() {
    var stationGroup = new THREE.Group();
    stationGroup.position.set(-50, 0, -5);
    stationGroup.add(stationGroup);
    scene.add(stationGroup);

    // Red cabinet - BoxGeometry
    var cabinetGeom = new THREE.BoxGeometry(1.2, 1.8, 0.5);
    var cabinetMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      roughness: 0.5,
      metalness: 0.4
    });
    var cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
    cabinet.position.y = 0.9;
    cabinet.castShadow = true;
    stationGroup.add(cabinet);

    // Extinguisher cylinders - CylinderGeometry
    var extGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    var extMat = new THREE.MeshStandardMaterial({
      color: 0xdd0000,
      roughness: 0.4,
      metalness: 0.6
    });

    var extPositions = [
      { x: -0.3 },
      { x: 0.3 }
    ];

    extPositions.forEach(function(pos) {
      var ext = new THREE.Mesh(extGeom, extMat);
      ext.position.set(pos.x, 1.0, 0);
      ext.castShadow = true;
      stationGroup.add(ext);
    });
  }

  function createDripTray() {
    var trayGroup = new THREE.Group();
    trayGroup.position.set(-22, 0.05, -8);
    stationGroup.add(trayGroup);

    // Tray bottom - BoxGeometry
    var bottomGeom = new THREE.BoxGeometry(10, 0.1, 8);
    var bottomMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.6,
      metalness: 0.7
    });
    var bottom = new THREE.Mesh(bottomGeom, bottomMat);
    bottom.position.y = 0;
    bottom.receiveShadow = true;
    trayGroup.add(bottom);

    // Containment walls - BoxGeometry (low height)
    var wallGeom = new THREE.BoxGeometry(10.2, 0.3, 0.3);
    var wallMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.6
    });

    var walls = [
      { pos: [0, 0.15, 3.8], scale: [1, 1, 1] },
      { pos: [0, 0.15, -3.8], scale: [1, 1, 1] }
    ];

    walls.forEach(function(wall) {
      var w = new THREE.Mesh(wallGeom, wallMat);
      w.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
      w.castShadow = true;
      trayGroup.add(w);
    });
  }

  function createHoseReels() {
    var reelsGroup = new THREE.Group();
    reelsGroup.position.set(-35, 0, -20);
    stationGroup.add(reelsGroup);

    var reelPositions = [
      { x: 0 },
      { x: 6 }
    ];

    reelPositions.forEach(function(pos) {
      var reelGroup = new THREE.Group();
      reelGroup.position.x = pos.x;
      reelsGroup.add(reelGroup);

      // Drum - CylinderGeometry
      var drumGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
      var drumMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.7,
        metalness: 0.5
      });
      var drum = new THREE.Mesh(drumGeom, drumMat);
      drum.position.y = 1.2;
      drum.rotation.z = Math.PI / 2;
      drum.castShadow = true;
      reelGroup.add(drum);

      // Hose coil - LineSegments simulating rope
      var hosePoints = [];
      for (var i = 0; i < 20; i++) {
        var angle = (i / 20) * Math.PI * 4;
        var r = 0.3 + (i / 20) * 0.8;
        hosePoints.push(new THREE.Vector3(
          Math.cos(angle) * r,
          0.8 - (i / 20) * 0.4,
          Math.sin(angle) * r
        ));
      }

      var hoseGeom = new THREE.BufferGeometry().setFromPoints(hosePoints);
      var hoseLine = new THREE.LineSegments(hoseGeom, new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 }));
      reelGroup.add(hoseLine);

      hoseReels.push(reelGroup);
    });
  }

  function createSigns() {
    var signsGroup = new THREE.Group();
    stationGroup.add(signsGroup);

    var signPositions = [
      { pos: [-30, 2, -35], text: 'DIESEL' },
      { pos: [0, 2, -35], text: 'UNLEADED' }
    ];

    signPositions.forEach(function(sign) {
      var signGroup = new THREE.Group();
      signGroup.position.set(sign.pos[0], sign.pos[1], sign.pos[2]);
      signsGroup.add(signGroup);

      // Sign pole - CylinderGeometry
      var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
      var poleMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.7,
        metalness: 0.5
      });
      var pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = 1;
      pole.castShadow = true;
      signGroup.add(pole);

      // Sign board - BoxGeometry
      var boardGeom = new THREE.BoxGeometry(1.5, 1, 0.1);
      var boardMat = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.3
      });
      var board = new THREE.Mesh(boardGeom, boardMat);
      board.position.y = 2.2;
      board.castShadow = true;
      signGroup.add(board);

      priceSigns.push({
        group: signGroup,
        board: board
      });
    });
  }

  function createShutoffPosts() {
    var postsGroup = new THREE.Group();
    postsGroup.position.set(0, 0, 0);
    stationGroup.add(postsGroup);

    var postPositions = [
      { x: -15, z: -5 },
      { x: 15, z: -5 },
      { x: -15, z: 5 },
      { x: 15, z: 5 }
    ];

    postPositions.forEach(function(pos) {
      var postGeom = new THREE.BoxGeometry(0.6, 1.2, 0.6);
      var postMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        roughness: 0.6,
        metalness: 0.5
      });
      var post = new THREE.Mesh(postGeom, postMat);
      post.position.set(pos.x, 0.6, pos.z);
      post.castShadow = true;
      postsGroup.add(post);
    });
  }

  function createBurningTanker() {
    var tankerGroup = new THREE.Group();
    tankerGroup.position.set(70, 0, 20);
    tankerGroup.rotation.z = Math.PI / 6;
    stationGroup.add(tankerGroup);

    burningTanker = tankerGroup;

    // Overturned tanker body - BoxGeometry tilted
    var bodyGeom = new THREE.BoxGeometry(2.0, 2.0, 7);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x332211,
      roughness: 0.8,
      metalness: 0.3
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(0, 1.5, 0);
    body.castShadow = true;
    tankerGroup.add(body);

    // Fire spheres - SphereGeometry
    var firePositions = [
      { pos: [0, 2.5, -1.5], scale: 1.2 },
      { pos: [0.5, 3.0, 0], scale: 1.5 },
      { pos: [-0.3, 2.8, 1], scale: 1.3 },
      { pos: [0, 3.5, 0.5], scale: 1.0 }
    ];

    firePositions.forEach(function(fire) {
      var fireGeom = new THREE.SphereGeometry(fire.scale, 8, 8);
      var fireMat = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        emissive: 0xff6600,
        emissiveIntensity: 1.0,
        roughness: 0.9,
        metalness: 0
      });
      var fireSphere = new THREE.Mesh(fireGeom, fireMat);
      fireSphere.position.set(fire.pos[0], fire.pos[1], fire.pos[2]);
      fireSphere.scale.set(1, 1, 1);
      fireEmitters.push({
        mesh: fireSphere,
        baseScale: fire.scale,
        time: Math.random() * Math.PI * 2
      });
      tankerGroup.add(fireSphere);
    });
  }

  function createFuelSpill() {
    var spillGroup = new THREE.Group();
    spillGroup.position.set(65, 0.02, 18);
    stationGroup.add(spillGroup);

    // Spilled fuel pool - BoxGeometry flat
    var spillGeom = new THREE.BoxGeometry(12, 0.05, 10);
    var spillMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a00,
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0x333300,
      emissiveIntensity: 0.3
    });
    fuelSpill = new THREE.Mesh(spillGeom, spillMat);
    fuelSpill.receiveShadow = true;
    spillGroup.add(fuelSpill);
  }

  function createAmmoDump() {
    var dumpGroup = new THREE.Group();
    dumpGroup.position.set(-60, 0, 10);
    stationGroup.add(dumpGroup);

    // Ammunition crates - BoxGeometry
    var crateGeom = new THREE.BoxGeometry(1.2, 1.0, 1.2);
    var crateMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a3a,
      roughness: 0.8,
      metalness: 0.2
    });

    var cratePositions = [
      { pos: [0, 0.5, 0] },
      { pos: [1.5, 0.5, 0] },
      { pos: [-1.5, 0.5, 0] },
      { pos: [0, 1.6, 1] },
      { pos: [0, 1.6, -1] }
    ];

    cratePositions.forEach(function(crate) {
      var c = new THREE.Mesh(crateGeom, crateMat);
      c.position.set(crate.pos[0], crate.pos[1], crate.pos[2]);
      c.castShadow = true;
      c.receiveShadow = true;
      dumpGroup.add(c);
    });
  }

  function createSandbagPerimeter() {
    var bagGroup = new THREE.Group();
    bagGroup.position.set(0, 0, 0);
    stationGroup.add(bagGroup);

    // Sandbags forming barrier - BoxGeometry
    var bagGeom = new THREE.BoxGeometry(0.8, 0.5, 0.4);
    var bagMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.1
    });

    var perimeter = [
      { x: -25, z: -35 },
      { x: -25, z: 35 },
      { x: 25, z: -35 },
      { x: 25, z: 35 },
      { x: 0, z: -35 }
    ];

    perimeter.forEach(function(pos) {
      var bag = new THREE.Mesh(bagGeom, bagMat);
      bag.position.set(pos.x, 0.25, pos.z);
      bag.castShadow = true;
      bag.receiveShadow = true;
      bagGroup.add(bag);
    });
  }

  function createBarrierPosts() {
    var postsGroup = new THREE.Group();
    postsGroup.position.set(0, 0, 0);
    stationGroup.add(postsGroup);

    // Crash barriers - CylinderGeometry yellow bollards
    var bollardGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);
    var bollardMat = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      roughness: 0.5,
      metalness: 0.6
    });

    var bollardPositions = [
      { x: -10, z: -40 },
      { x: 0, z: -40 },
      { x: 10, z: -40 },
      { x: -5, z: 40 },
      { x: 5, z: 40 }
    ];

    bollardPositions.forEach(function(pos) {
      var bollard = new THREE.Mesh(bollardGeom, bollardMat);
      bollard.position.set(pos.x, 0.4, pos.z);
      bollard.castShadow = true;
      postsGroup.add(bollard);
    });
  }

  function createTireTracks() {
    var tracksGroup = new THREE.Group();
    tracksGroup.position.set(0, 0.01, 0);
    stationGroup.add(tracksGroup);

    // Tire tracks - dark streaks on ground using thin BoxGeometry
    var trackGeom = new THREE.BoxGeometry(2, 0.02, 15);
    var trackMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a00,
      roughness: 0.8,
      metalness: 0.1
    });

    var trackPositions = [
      { x: -3, z: 0 },
      { x: 3, z: 0 },
      { x: -8, z: -5 },
      { x: 8, z: -5 }
    ];

    trackPositions.forEach(function(pos) {
      var track = new THREE.Mesh(trackGeom, trackMat);
      track.position.set(pos.x, 0, pos.z);
      track.receiveShadow = true;
      tracksGroup.add(track);
    });
  }

  function update(delta) {
    if (!burningTanker) return;

    // Fire flicker and growth
    fireEmitters.forEach(function(fire) {
      fire.time += delta * 3;
      var flicker = 0.8 + Math.sin(fire.time) * 0.3 + Math.sin(fire.time * 0.5) * 0.2;
      var scaleVariation = fire.baseScale * flicker;
      fire.mesh.scale.set(scaleVariation, scaleVariation, scaleVariation);

      // Color shift in fire
      var hue = 0.05 + Math.sin(fire.time * 1.5) * 0.03;
      fire.mesh.material.emissiveIntensity = 0.8 + Math.sin(fire.time * 2) * 0.3;
    });

    // Smoke column rising - SphereGeometry
    if (Math.random() < delta * 0.3) {
      var smokeGeom = new THREE.SphereGeometry(0.8, 6, 6);
      var smokeMat = new THREE.MeshStandardMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.4,
        emissive: 0x444444,
        emissiveIntensity: 0.2,
        roughness: 0.8,
        metalness: 0
      });
      var smokeSphere = new THREE.Mesh(smokeGeom, smokeMat);
      smokeSphere.position.set(
        burningTanker.position.x + (Math.random() - 0.5) * 2,
        burningTanker.position.y + 3 + Math.random() * 1,
        burningTanker.position.z + (Math.random() - 0.5) * 2
      );
      smokeSphere.lifeTime = 0;
      smokeSphere.maxLife = 3;
      smokeSpheres.push(smokeSphere);
      stationGroup.add(smokeSphere);
    }

    // Update smoke particles
    for (var i = smokeSpheres.length - 1; i >= 0; i--) {
      var smoke = smokeSpheres[i];
      smoke.lifeTime += delta;
      smoke.position.y += delta * 2;
      smoke.scale.x += delta * 0.5;
      smoke.scale.y += delta * 0.5;
      smoke.scale.z += delta * 0.5;
      smoke.material.opacity = 0.4 * (1 - smoke.lifeTime / smoke.maxLife);

      if (smoke.lifeTime > smoke.maxLife) {
        stationGroup.remove(smoke);
        smokeSpheres.splice(i, 1);
      }
    }

    // Fuel spill shimmer
    if (fuelSpill) {
      fuelSpill.material.emissiveIntensity = 0.3 + Math.sin(Date.now() * 0.002) * 0.2;
    }

    // Emergency light rotation
    emergencyLights.forEach(function(light) {
      light.rotation.y += delta * 8;
    });

    // Hose reel gentle spin
    hoseReels.forEach(function(reel) {
      reel.rotation.z += delta * 0.3;
    });

    // Price sign flicker
    priceSigns.forEach(function(sign) {
      sign.board.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;
    });
  }

  function reset() {
    // Clear fire emitters
    fireEmitters.forEach(function(fire) {
      burningTanker.remove(fire.mesh);
    });
    fireEmitters.length = 0;

    // Clear smoke
    smokeSpheres.forEach(function(smoke) {
      stationGroup.remove(smoke);
    });
    smokeSpheres.length = 0;

    // Reset burning tanker rotation
    if (burningTanker) {
      burningTanker.rotation.z = Math.PI / 6;
    }

    // Reset fuel spill opacity
    if (fuelSpill) {
      fuelSpill.material.opacity = 1;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
