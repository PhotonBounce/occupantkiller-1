var window = window || {};

window.FactoryTakeover = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var lights = [];
  var hudElement = null;
  var hudVisible = true;
  var elapsedTime = 0;
  var lastFKeyTime = 0;

  // Scene sub-object references for animation
  var conveyorBelt = null;
  var conveyorRollers = [];
  var workerFigures = [];
  var swatFigures = [];
  var craneBeam = null;
  var craneHook = null;
  var alarmLight = null;
  var alarmPole = null;
  var steamVents = [];
  var forklift = null;
  var loadingBayDoor = null;

  var gameState = {
    workersDetained: 0,
    totalWorkers: 8,
    swatCasualties: 0,
    factoryControl: 'HOSTILE'
  };

  // Animation state
  var craneAngle = 0;
  var craneRadius = 12;
  var alarmPhase = 0;
  var steamPhase = 0;
  var workerAdvancePhase = 0;
  var swatBreachPhase = 0;
  var forkPhase = 0;
  var doorOpenPhase = 0;

  // -------------------------------------------------------
  // 1. Factory floor
  // -------------------------------------------------------
  function createFactoryFloor() {
    var geo = new THREE.BoxGeometry(60, 0.4, 50);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x7a7a70,
      roughness: 0.95,
      metalness: 0.05
    });
    var floor = new THREE.Mesh(geo, mat);
    floor.position.set(0, -0.2, 0);
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  // -------------------------------------------------------
  // 2. Assembly-line conveyor belt + rollers
  // -------------------------------------------------------
  function createConveyorBelt() {
    var beltGeo = new THREE.BoxGeometry(22, 0.3, 2.5);
    var beltMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.4
    });
    conveyorBelt = new THREE.Mesh(beltGeo, beltMat);
    conveyorBelt.position.set(-8, 1.2, -10);
    conveyorBelt.castShadow = true;
    scene.add(conveyorBelt);
    sceneObjects.push(conveyorBelt);

    // Side rails (flat boxes)
    var railGeo = new THREE.BoxGeometry(22, 0.5, 0.15);
    var railMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.4 });
    var railL = new THREE.Mesh(railGeo, railMat);
    railL.position.set(-8, 1.5, -11.15);
    scene.add(railL);
    sceneObjects.push(railL);
    var railR = new THREE.Mesh(railGeo, railMat);
    railR.position.set(-8, 1.5, -8.85);
    scene.add(railR);
    sceneObjects.push(railR);

    // Cylinder rollers
    var rollerGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.5, 8);
    var rollerMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
    for (var r = 0; r < 11; r++) {
      var roller = new THREE.Mesh(rollerGeo, rollerMat);
      roller.rotation.x = Math.PI / 2;
      roller.position.set(-18 + r * 2.2, 1.05, -10);
      scene.add(roller);
      sceneObjects.push(roller);
      conveyorRollers.push(roller);
    }

    // Support legs (flat boxes)
    var legGeo = new THREE.BoxGeometry(0.2, 1.1, 0.2);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.5 });
    var legXs = [-18, -8, 2];
    for (var l = 0; l < legXs.length; l++) {
      var legA = new THREE.Mesh(legGeo, legMat);
      legA.position.set(legXs[l], 0.55, -11);
      scene.add(legA);
      sceneObjects.push(legA);
      var legB = new THREE.Mesh(legGeo, legMat);
      legB.position.set(legXs[l], 0.55, -9);
      scene.add(legB);
      sceneObjects.push(legB);
    }
  }

  // -------------------------------------------------------
  // 3. Industrial press machines (3)
  // -------------------------------------------------------
  function createPressMachines() {
    var baseGeo = new THREE.BoxGeometry(3, 3.5, 2.5);
    var armGeo  = new THREE.BoxGeometry(2.2, 1, 2);
    var mat = new THREE.MeshStandardMaterial({ color: 0x3a4a3a, roughness: 0.7, metalness: 0.6 });
    var positions = [
      { x: 15, z: -14 },
      { x: 15, z: -8 },
      { x: 15, z: -2 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var base = new THREE.Mesh(baseGeo, mat);
      base.position.set(positions[i].x, 1.75, positions[i].z);
      base.castShadow = true;
      scene.add(base);
      sceneObjects.push(base);
      var arm = new THREE.Mesh(armGeo, mat);
      arm.position.set(positions[i].x, 3.9, positions[i].z);
      arm.castShadow = true;
      scene.add(arm);
      sceneObjects.push(arm);
    }
  }

  // -------------------------------------------------------
  // 4. Storage shelving units (4)
  // -------------------------------------------------------
  function createShelvingUnits() {
    var shelfMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8, metalness: 0.3 });
    var upright = new THREE.BoxGeometry(0.15, 5, 0.15);
    var shelfBoard = new THREE.BoxGeometry(3, 0.12, 0.9);
    var positions = [
      { x: -22, z: 5 },
      { x: -22, z: 12 },
      { x: 20, z: 8 },
      { x: 20, z: 14 }
    ];
    for (var u = 0; u < positions.length; u++) {
      var px = positions[u].x;
      var pz = positions[u].z;
      // 4 uprights
      var corners = [[-1.4, -0.4], [-1.4, 0.4], [1.4, -0.4], [1.4, 0.4]];
      for (var c = 0; c < corners.length; c++) {
        var up = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 0.15), shelfMat);
        up.position.set(px + corners[c][0], 2.5, pz + corners[c][1]);
        scene.add(up);
        sceneObjects.push(up);
      }
      // 3 shelves
      for (var s = 0; s < 3; s++) {
        var shelf = new THREE.Mesh(shelfBoard, shelfMat);
        shelf.position.set(px, 0.8 + s * 1.7, pz);
        scene.add(shelf);
        sceneObjects.push(shelf);
      }
    }
  }

  // -------------------------------------------------------
  // 5. Armed worker figures (8)
  // -------------------------------------------------------
  function createWorkerFigures() {
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.8, metalness: 0.1 }); // orange coveralls
    var headMat = new THREE.MeshStandardMaterial({ color: 0xf0c070, roughness: 0.6, metalness: 0.0 });
    var weaponMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.7 });
    var startPositions = [
      { x: -5, z: -5 }, { x: -3, z: -8 }, { x: -7, z: -3 },
      { x: 0, z: -10 }, { x: 2, z: -5 }, { x: -9, z: -12 },
      { x: 5, z: -15 }, { x: -12, z: -7 }
    ];
    for (var w = 0; w < startPositions.length; w++) {
      var group = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.35), bodyMat);
      body.position.y = 0.5;
      group.add(body);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), headMat);
      head.position.y = 1.22;
      group.add(head);
      // makeshift weapon: pipe/bat (flat box)
      var weapon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), weaponMat);
      weapon.position.set(0.4, 0.85, 0);
      weapon.rotation.z = -0.4;
      group.add(weapon);
      group.position.set(startPositions[w].x, 0, startPositions[w].z);
      scene.add(group);
      sceneObjects.push(group);
      workerFigures.push({ group: group, baseX: startPositions[w].x, baseZ: startPositions[w].z, detained: false });
    }
  }

  // -------------------------------------------------------
  // 6. SWAT figures (5 in tactical gear)
  // -------------------------------------------------------
  function createSwatFigures() {
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7, metalness: 0.2 }); // dark tactical
    var headMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.4 }); // helmet
    var rifleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.8 });
    var startPositions = [
      { x: -24, z: 18 }, { x: -21, z: 20 }, { x: -18, z: 19 },
      { x: -15, z: 21 }, { x: -12, z: 18 }
    ];
    for (var s = 0; s < startPositions.length; s++) {
      var group = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.05, 0.4), bodyMat);
      body.position.y = 0.525;
      group.add(body);
      // Vest detail
      var vest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.5, 0.42), new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.6, metalness: 0.3 }));
      vest.position.y = 0.65;
      group.add(vest);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), headMat);
      head.position.y = 1.3;
      group.add(head);
      // Rifle (flat box)
      var rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.75), rifleMat);
      rifle.position.set(0.42, 0.7, -0.1);
      group.add(rifle);
      group.position.set(startPositions[s].x, 0, startPositions[s].z);
      group.rotation.y = -Math.PI / 2; // facing inward
      scene.add(group);
      sceneObjects.push(group);
      swatFigures.push({ group: group, baseX: startPositions[s].x, baseZ: startPositions[s].z });
    }
  }

  // -------------------------------------------------------
  // 7. Forklift
  // -------------------------------------------------------
  function createForklift() {
    forklift = new THREE.Group();

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0xe8a000, roughness: 0.5, metalness: 0.5 });
    var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9, metalness: 0.2 });

    // Chassis (flat box)
    var chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 3.2), bodyMat);
    chassis.position.y = 0.85;
    forklift.add(chassis);

    // Cab (flat box)
    var cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.4), bodyMat);
    cab.position.set(0, 1.85, 0.6);
    forklift.add(cab);

    // Mast (vertical flat box)
    var mast = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.5, 0.25), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.4 }));
    mast.position.set(0, 2.05, -1.3);
    forklift.add(mast);

    // Fork arms (flat boxes)
    var forkGeo = new THREE.BoxGeometry(0.15, 0.12, 1.8);
    var forkMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.3 });
    var forkL = new THREE.Mesh(forkGeo, forkMat);
    forkL.position.set(-0.35, 0.56, -2.0);
    forklift.add(forkL);
    var forkR = new THREE.Mesh(forkGeo, forkMat);
    forkR.position.set(0.35, 0.56, -2.0);
    forklift.add(forkR);

    // Wheels (cylinders)
    var wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 12);
    var wheelPositions = [
      { x: -1.1, z: -1.1 }, { x: 1.1, z: -1.1 },
      { x: -1.1, z: 1.1 },  { x: 1.1, z: 1.1 }
    ];
    for (var wh = 0; wh < wheelPositions.length; wh++) {
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelPositions[wh].x, 0.4, wheelPositions[wh].z);
      forklift.add(wheel);
    }

    forklift.position.set(8, 0, 5);
    scene.add(forklift);
    sceneObjects.push(forklift);
  }

  // -------------------------------------------------------
  // 8. Explosive barrel stack (6 cylinders)
  // -------------------------------------------------------
  function createBarrelStack() {
    var barrelMat = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.6, metalness: 0.5 });
    var stripMat  = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5, metalness: 0.3 });
    var barrelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.85, 12);
    var stripGeo  = new THREE.CylinderGeometry(0.39, 0.39, 0.1, 12);
    // Ground row: 3 barrels; top row: 2; topmost: 1
    var layout = [
      { x: -0.42, y: 0.43, z: 0 }, { x: 0, y: 0.43, z: 0 }, { x: 0.42, y: 0.43, z: 0 },
      { x: -0.21, y: 1.28, z: 0 }, { x: 0.21, y: 1.28, z: 0 },
      { x: 0, y: 2.13, z: 0 }
    ];
    var group = new THREE.Group();
    for (var b = 0; b < layout.length; b++) {
      var barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(layout[b].x, layout[b].y, layout[b].z);
      group.add(barrel);
      var strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(layout[b].x, layout[b].y, layout[b].z);
      group.add(strip);
    }
    group.position.set(-18, 0, -5);
    scene.add(group);
    sceneObjects.push(group);
  }

  // -------------------------------------------------------
  // 9. Overhead crane
  // -------------------------------------------------------
  function createOverheadCrane() {
    var craneMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.8 });
    var trackMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.7 });

    // Overhead rails (flat boxes)
    var trackGeo = new THREE.BoxGeometry(50, 0.3, 0.4);
    var trackA = new THREE.Mesh(trackGeo, trackMat);
    trackA.position.set(0, 9, -5);
    scene.add(trackA);
    sceneObjects.push(trackA);
    var trackB = new THREE.Mesh(trackGeo, trackMat);
    trackB.position.set(0, 9, 5);
    scene.add(trackB);
    sceneObjects.push(trackB);

    // Crane beam (flat box) — will rotate
    craneBeam = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 0.3), craneMat);
    craneBeam.position.set(0, 8.7, 0);
    scene.add(craneBeam);
    sceneObjects.push(craneBeam);

    // Hook (cylinder)
    craneHook = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), craneMat);
    craneHook.position.set(craneRadius, 7.4, 0);
    scene.add(craneHook);
    sceneObjects.push(craneHook);
  }

  // -------------------------------------------------------
  // 10. Control room
  // -------------------------------------------------------
  function createControlRoom() {
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.7, metalness: 0.3 });
    var room = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), wallMat);
    room.position.set(22, 5, 18);
    room.castShadow = true;
    scene.add(room);
    sceneObjects.push(room);

    // Elevated platform (flat box)
    var platform = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8, metalness: 0.4 }));
    platform.position.set(22, 3.05, 18);
    scene.add(platform);
    sceneObjects.push(platform);

    // Platform supports (flat boxes)
    var supportGeo = new THREE.BoxGeometry(0.25, 3, 0.25);
    var supportMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.4 });
    var corners = [[-3, -2.5], [-3, 2.5], [3, -2.5], [3, 2.5]];
    for (var sc = 0; sc < corners.length; sc++) {
      var support = new THREE.Mesh(supportGeo, supportMat);
      support.position.set(22 + corners[sc][0], 1.5, 18 + corners[sc][1]);
      scene.add(support);
      sceneObjects.push(support);
    }

    // Emissive window (flat box)
    var windowMat = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      emissive: 0x2244cc,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.0
    });
    var win = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 0.1), windowMat);
    win.position.set(22, 5.5, 15.46);
    scene.add(win);
    sceneObjects.push(win);
  }

  // -------------------------------------------------------
  // 11. Steam pipe system
  // -------------------------------------------------------
  function createSteamPipes() {
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.5, metalness: 0.7 });

    // Horizontal pipe (cylinder rotated)
    var horizPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 28, 10), pipeMat);
    horizPipe.rotation.z = Math.PI / 2;
    horizPipe.position.set(0, 6.5, 8);
    scene.add(horizPipe);
    sceneObjects.push(horizPipe);

    // Vertical drop pipes + steam vent caps
    var ventPositions = [-10, -4, 2, 8, 14];
    var steamMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.35,
      roughness: 1.0,
      metalness: 0.0
    });
    for (var v = 0; v < ventPositions.length; v++) {
      var dropPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.5, 8), pipeMat);
      dropPipe.position.set(ventPositions[v], 5.25, 8);
      scene.add(dropPipe);
      sceneObjects.push(dropPipe);

      // Steam puff sphere (semi-transparent, for animation)
      var steam = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), steamMat.clone());
      steam.position.set(ventPositions[v], 4.2, 8);
      scene.add(steam);
      sceneObjects.push(steam);
      steamVents.push(steam);
    }
  }

  // -------------------------------------------------------
  // 12. Fire suppression system
  // -------------------------------------------------------
  function createFireSuppression() {
    var pipeMat = new THREE.MeshStandardMaterial({ color: 0xdd2200, roughness: 0.5, metalness: 0.6 });
    var headMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff1100,
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.3
    });

    // Main supply pipe (flat cylinder)
    var mainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 40, 8), pipeMat);
    mainPipe.rotation.z = Math.PI / 2;
    mainPipe.position.set(0, 8.2, -15);
    scene.add(mainPipe);
    sceneObjects.push(mainPipe);

    // Sprinkler heads (emissive cylinders)
    for (var sp = 0; sp < 8; sp++) {
      var head = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 8), headMat);
      head.position.set(-17 + sp * 5, 7.95, -15);
      scene.add(head);
      sceneObjects.push(head);
    }
  }

  // -------------------------------------------------------
  // 13. Catwalk
  // -------------------------------------------------------
  function createCatwalk() {
    var walkMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.6 });
    var rungMat = new THREE.LineBasicMaterial({ color: 0x888888 });

    // Catwalk deck (flat box)
    var deck = new THREE.Mesh(new THREE.BoxGeometry(30, 0.15, 1.5), walkMat);
    deck.position.set(-5, 7.5, 0);
    scene.add(deck);
    sceneObjects.push(deck);

    // Support brackets (flat boxes)
    var bracketGeo = new THREE.BoxGeometry(0.1, 2.0, 0.1);
    var bracketMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7, roughness: 0.4 });
    for (var br = 0; br < 7; br++) {
      var bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(-19 + br * 5, 6.5, 0);
      scene.add(bracket);
      sceneObjects.push(bracket);
    }

    // Railing via LineSegments
    var railPoints = [];
    for (var rp = 0; rp <= 30; rp += 2) {
      railPoints.push(-20 + rp, 8.1, 0.6);
      railPoints.push(-20 + rp + 2, 8.1, 0.6);
    }
    // Vertical posts
    for (var vp = 0; vp <= 30; vp += 3) {
      railPoints.push(-20 + vp, 7.55, 0.6);
      railPoints.push(-20 + vp, 8.1, 0.6);
    }
    var railGeo = new THREE.BufferGeometry();
    var railVerts = new Float32Array(railPoints);
    railGeo.setAttribute('position', new THREE.BufferAttribute(railVerts, 3));
    var railing = new THREE.LineSegments(railGeo, rungMat);
    scene.add(railing);
    sceneObjects.push(railing);
  }

  // -------------------------------------------------------
  // 14. Loading bay door (large flat box, slides open)
  // -------------------------------------------------------
  function createLoadingBayDoor() {
    var doorMat = new THREE.MeshStandardMaterial({ color: 0x445566, roughness: 0.6, metalness: 0.7 });
    loadingBayDoor = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.3), doorMat);
    loadingBayDoor.position.set(-20, 2.5, 20);
    loadingBayDoor.castShadow = true;
    scene.add(loadingBayDoor);
    sceneObjects.push(loadingBayDoor);

    // Door frame (flat boxes)
    var frameMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.5 });
    var topFrame = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 0.4), frameMat);
    topFrame.position.set(-20, 5.2, 20);
    scene.add(topFrame);
    sceneObjects.push(topFrame);
    var leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 0.4), frameMat);
    leftFrame.position.set(-24.2, 2.5, 20);
    scene.add(leftFrame);
    sceneObjects.push(leftFrame);
    var rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 0.4), frameMat);
    rightFrame.position.set(-15.8, 2.5, 20);
    scene.add(rightFrame);
    sceneObjects.push(rightFrame);
  }

  // -------------------------------------------------------
  // 15. Emergency alarm light
  // -------------------------------------------------------
  function createAlarmLight() {
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6, metalness: 0.7 });
    alarmPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.0, 8), poleMat);
    alarmPole.position.set(0, 2.0, 0);
    scene.add(alarmPole);
    sceneObjects.push(alarmPole);

    var lightMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff2200,
      emissiveIntensity: 2.0,
      roughness: 0.3,
      metalness: 0.2
    });
    alarmLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), lightMat);
    alarmLight.position.set(0, 4.3, 0);
    scene.add(alarmLight);
    sceneObjects.push(alarmLight);
  }

  // -------------------------------------------------------
  // 16. Machinery debris (scattered flat box chunks)
  // -------------------------------------------------------
  function createMachineryDebris() {
    var debrisMat = new THREE.MeshStandardMaterial({ color: 0x555540, roughness: 0.9, metalness: 0.4 });
    var debrisPositions = [
      { x: -2, z: 3, ry: 0.4 }, { x: 6, z: -3, ry: 1.1 }, { x: -14, z: 2, ry: 0.8 },
      { x: 10, z: 2, ry: 0.2 }, { x: -6, z: 7, ry: 1.7 }, { x: 3, z: 10, ry: 0.6 },
      { x: -18, z: 10, ry: 0.9 }, { x: 14, z: -5, ry: 1.3 }
    ];
    for (var d = 0; d < debrisPositions.length; d++) {
      var dp = debrisPositions[d];
      var w = 0.3 + Math.random() * 0.8;
      var h = 0.1 + Math.random() * 0.3;
      var dep = 0.2 + Math.random() * 0.5;
      var chunk = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), debrisMat);
      chunk.position.set(dp.x, h / 2, dp.z);
      chunk.rotation.y = dp.ry;
      scene.add(chunk);
      sceneObjects.push(chunk);
    }
  }

  // -------------------------------------------------------
  // 17. Smoke/steam cloud (semi-transparent sphere)
  // -------------------------------------------------------
  function createSmokeCloud() {
    var smokeMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      transparent: true,
      opacity: 0.22,
      roughness: 1.0,
      metalness: 0.0,
      depthWrite: false
    });
    var positions = [
      { x: -5, y: 3.5, z: 3, r: 1.8 },
      { x: -3, y: 4.2, z: 5, r: 2.2 },
      { x: -8, y: 3.0, z: 2, r: 1.5 }
    ];
    for (var sm = 0; sm < positions.length; sm++) {
      var sp = positions[sm];
      var cloud = new THREE.Mesh(new THREE.SphereGeometry(sp.r, 10, 10), smokeMat.clone());
      cloud.position.set(sp.x, sp.y, sp.z);
      scene.add(cloud);
      sceneObjects.push(cloud);
    }
  }

  // -------------------------------------------------------
  // Lighting
  // -------------------------------------------------------
  function createLighting() {
    var ambient = new THREE.AmbientLight(0x334455, 0.6);
    scene.add(ambient);
    lights.push(ambient);

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    lights.push(dirLight);

    // Red alarm point light
    var alarmPL = new THREE.PointLight(0xff2200, 2.0, 18);
    alarmPL.position.set(0, 5, 0);
    scene.add(alarmPL);
    lights.push(alarmPL);

    // Industrial overhead (yellow-orange)
    var factoryLight = new THREE.PointLight(0xffaa44, 1.2, 30);
    factoryLight.position.set(0, 8, 0);
    scene.add(factoryLight);
    lights.push(factoryLight);
  }

  // -------------------------------------------------------
  // HUD
  // -------------------------------------------------------
  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.style.cssText = [
      'position:fixed',
      'top:16px',
      'left:16px',
      'background:rgba(0,0,0,0.72)',
      'color:#ff4400',
      'font-family:monospace',
      'font-size:14px',
      'padding:10px 16px',
      'border:1px solid #cc2200',
      'border-radius:4px',
      'pointer-events:none',
      'z-index:9999',
      'line-height:1.7'
    ].join(';');
    updateHUDContent();
    document.body.appendChild(hudElement);
  }

  function updateHUDContent() {
    if (!hudElement) { return; }
    hudElement.innerHTML = [
      '<b style="color:#ff6600">&#9888; FACTORY TAKEOVER</b>',
      'WORKERS DETAINED: ' + gameState.workersDetained + '/' + gameState.totalWorkers,
      'SWAT CASUALTIES:  ' + gameState.swatCasualties,
      'FACTORY CONTROL:  <span style="color:#ff2200">' + gameState.factoryControl + '</span>',
      '<span style="color:#888;font-size:11px">[F+T] toggle HUD</span>'
    ].join('<br>');
  }

  function onKeyDown(e) {
    var key = e.key ? e.key.toUpperCase() : '';
    if (key === 'F') {
      lastFKeyTime = Date.now();
    } else if (key === 'T') {
      if (Date.now() - lastFKeyTime <= 400) {
        hudVisible = !hudVisible;
        if (hudElement) {
          hudElement.style.display = hudVisible ? 'block' : 'none';
        }
      }
    }
  }

  // -------------------------------------------------------
  // init
  // -------------------------------------------------------
  function init(threeScene, threeCamera) {
    scene  = threeScene;
    camera = threeCamera;
    elapsedTime = 0;

    createFactoryFloor();
    createConveyorBelt();
    createPressMachines();
    createShelvingUnits();
    createWorkerFigures();
    createSwatFigures();
    createForklift();
    createBarrelStack();
    createOverheadCrane();
    createControlRoom();
    createSteamPipes();
    createFireSuppression();
    createCatwalk();
    createLoadingBayDoor();
    createAlarmLight();
    createMachineryDebris();
    createSmokeCloud();
    createLighting();
    createHUD();

    document.addEventListener('keydown', onKeyDown);

    if (camera) {
      camera.position.set(0, 14, 35);
      camera.lookAt(0, 2, 0);
    }
  }

  // -------------------------------------------------------
  // update
  // -------------------------------------------------------
  function update(delta) {
    elapsedTime += delta;

    // Conveyor belt: animate rollers spinning
    for (var r = 0; r < conveyorRollers.length; r++) {
      conveyorRollers[r].rotation.y += delta * 2.5;
    }

    // Workers advance from machines toward center
    workerAdvancePhase += delta * 0.25;
    for (var w = 0; w < workerFigures.length; w++) {
      if (!workerFigures[w].detained) {
        var wg = workerFigures[w].group;
        var targetZ = workerFigures[w].baseZ + Math.sin(workerAdvancePhase + w) * 1.5 + elapsedTime * 0.08;
        wg.position.z = workerFigures[w].baseZ + elapsedTime * 0.04 * (w % 2 === 0 ? 1 : -1);
        wg.rotation.y = Math.sin(elapsedTime * 0.5 + w) * 0.15;
      }
    }

    // SWAT breach from loading bay (slide forward)
    swatBreachPhase += delta;
    for (var s = 0; s < swatFigures.length; s++) {
      var sg = swatFigures[s].group;
      var breachProgress = Math.min(elapsedTime * 0.15, 10);
      sg.position.z = swatFigures[s].baseZ - breachProgress - Math.sin(swatBreachPhase * 0.6 + s * 0.5) * 0.3;
    }

    // Crane swings overhead
    craneAngle += delta * 0.3;
    if (craneBeam) {
      craneBeam.rotation.y = craneAngle;
    }
    if (craneHook) {
      craneHook.position.x = Math.cos(craneAngle) * craneRadius;
      craneHook.position.z = Math.sin(craneAngle) * craneRadius;
    }

    // Emergency alarm strobe
    alarmPhase += delta * 3.5;
    if (alarmLight && alarmLight.material) {
      var strobeOn = Math.sin(alarmPhase) > 0;
      alarmLight.material.emissiveIntensity = strobeOn ? 2.5 : 0.1;
    }

    // Steam vents pulse
    steamPhase += delta * 1.8;
    for (var sv = 0; sv < steamVents.length; sv++) {
      var vent = steamVents[sv];
      var pulse = 0.5 + 0.45 * Math.abs(Math.sin(steamPhase + sv * 0.7));
      vent.material.opacity = pulse * 0.5;
      vent.scale.setScalar(0.8 + pulse * 0.6);
    }

    // Forklift patrols back and forth
    forkPhase += delta * 0.4;
    if (forklift) {
      forklift.position.x = 8 + Math.sin(forkPhase) * 6;
      forklift.rotation.y = Math.cos(forkPhase) > 0 ? 0 : Math.PI;
    }

    // Loading bay door slides open over first 5 seconds
    if (loadingBayDoor) {
      doorOpenPhase = Math.min(elapsedTime / 5.0, 1.0);
      loadingBayDoor.position.y = 2.5 + doorOpenPhase * 5.2;
    }

    // Update HUD detention status
    var detained = 0;
    for (var wd = 0; wd < workerFigures.length; wd++) {
      if (workerFigures[wd].detained) { detained++; }
    }
    gameState.workersDetained = detained;
    if (detained >= gameState.totalWorkers) {
      gameState.factoryControl = 'SECURED';
    }
    updateHUDContent();
  }

  // -------------------------------------------------------
  // reset
  // -------------------------------------------------------
  function reset() {
    // Remove event listener
    document.removeEventListener('keydown', onKeyDown);

    // Dispose all scene objects
    for (var i = 0; i < sceneObjects.length; i++) {
      var obj = sceneObjects[i];
      if (scene) { scene.remove(obj); }
      if (obj.geometry) { obj.geometry.dispose(); }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var m = 0; m < obj.material.length; m++) {
            obj.material[m].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
      // For Groups, dispose children
      if (obj.children) {
        for (var ch = 0; ch < obj.children.length; ch++) {
          var child = obj.children[ch];
          if (child.geometry) { child.geometry.dispose(); }
          if (child.material) { child.material.dispose(); }
        }
      }
    }
    sceneObjects = [];

    // Remove lights
    for (var l = 0; l < lights.length; l++) {
      if (scene) { scene.remove(lights[l]); }
    }
    lights = [];

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
    }
    hudElement = null;

    // Reset state
    scene = null;
    camera = null;
    conveyorBelt = null;
    conveyorRollers = [];
    workerFigures = [];
    swatFigures = [];
    craneBeam = null;
    craneHook = null;
    alarmLight = null;
    alarmPole = null;
    steamVents = [];
    forklift = null;
    loadingBayDoor = null;
    elapsedTime = 0;
    craneAngle = 0;
    alarmPhase = 0;
    steamPhase = 0;
    workerAdvancePhase = 0;
    swatBreachPhase = 0;
    forkPhase = 0;
    doorOpenPhase = 0;
    gameState.workersDetained = 0;
    gameState.swatCasualties = 0;
    gameState.factoryControl = 'HOSTILE';
    hudVisible = true;
    lastFKeyTime = 0;
  }

  return { init: init, update: update, reset: reset };

}());
