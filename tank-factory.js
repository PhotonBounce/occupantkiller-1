window.TankFactory = (function() {
  'use strict';

  var scene, camera;
  var state = {
    tankDisabled: 0,
    saboteurCount: 4,
    factoryAlert: false,
    craneX: 0,
    craneMoveDirection: 1,
    turretSwayAngle: 0,
    weldingBrightness: 0,
    saboteurPositions: [],
    guardPositions: [],
    hPressed: false,
    fPressed: false,
    lastHPressTime: 0,
    lastFPressTime: 0
  };

  var meshes = {};
  var animations = {};

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    // 1. Factory floor — concrete dark gray flat box
    var floorGeometry = new THREE.BoxGeometry(400, 0.3, 400);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.castShadow = true;
    floor.receiveShadow = true;
    scene.add(floor);
    meshes.floor = floor;

    // 2. Factory walls — 4 tall box walls
    var wallHeight = 25;
    var wallLength = 200;
    var wallThickness = 2;
    var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    // North wall
    var northWallGeom = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
    var northWall = new THREE.Mesh(northWallGeom, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -wallLength / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);

    // South wall
    var southWall = new THREE.Mesh(northWallGeom, wallMaterial);
    southWall.position.set(0, wallHeight / 2, wallLength / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);

    // East wall
    var eastWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
    var eastWall = new THREE.Mesh(eastWallGeom, wallMaterial);
    eastWall.position.set(wallLength / 2, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);

    // West wall
    var westWall = new THREE.Mesh(eastWallGeom, wallMaterial);
    westWall.position.set(-wallLength / 2, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);

    // 3. Assembly line track — raised flat box rail
    var trackGeometry = new THREE.BoxGeometry(300, 0.8, 8);
    var trackMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
    var track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.position.set(0, 2, 0);
    track.castShadow = true;
    track.receiveShadow = true;
    scene.add(track);
    meshes.assemblyTrack = track;

    // 4. Three partially assembled tank hulls
    var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var hullPositions = [
      { x: -80, z: -40 },
      { x: 0, z: -60 },
      { x: 80, z: -30 }
    ];

    for (var i = 0; i < hullPositions.length; i++) {
      var hullGeom = new THREE.BoxGeometry(30, 15, 50);
      var hull = new THREE.Mesh(hullGeom, hullMaterial);
      hull.position.set(hullPositions[i].x, 7.5, hullPositions[i].z);
      hull.castShadow = true;
      hull.receiveShadow = true;
      scene.add(hull);
    }

    // 5. Two completed tanks with turrets, barrels, and wheels
    var completedTanks = createCompletedTanks();
    for (var j = 0; j < completedTanks.length; j++) {
      scene.add(completedTanks[j]);
    }

    // 6. Overhead gantry crane — H-beam frame + trolley + hook
    var craneGroup = createCrane();
    scene.add(craneGroup);
    meshes.craneGroup = craneGroup;

    // 7. Tank turret being lifted — hanging from crane hook
    var suspendedTurret = createSuspendedTurret();
    craneGroup.add(suspendedTurret);
    meshes.suspendedTurret = suspendedTurret;

    // 8. Six factory worker guards
    createGuards();

    // 9. Four partisan saboteurs
    createSaboteurs();

    // 10. Welding arc stations
    createWeldingStations();

    // 11. Ammunition storage room
    createAmmoRoom();

    // 12. Oil/coolant drums
    createDrums();

    // 13. Control booth
    createControlBooth();

    // 14. Ventilation shafts
    createVentilationShafts();

    // 15. Factory skylights with light shafts
    createSkylights();

    // 16. Loading dock with roll-up door
    createLoadingDock();

    // Setup keyboard listeners for HUD toggle (H+F within 400ms)
    document.addEventListener('keydown', function(evt) {
      if (evt.key === 'h' || evt.key === 'H') {
        state.hPressed = true;
        state.lastHPressTime = Date.now();
      }
      if (evt.key === 'f' || evt.key === 'F') {
        state.fPressed = true;
        state.lastFPressTime = Date.now();
      }
      checkHudToggle();
    });

    document.addEventListener('keyup', function(evt) {
      if (evt.key === 'h' || evt.key === 'H') {
        state.hPressed = false;
      }
      if (evt.key === 'f' || evt.key === 'F') {
        state.fPressed = false;
      }
    });

    createHUD();
  }

  function createCompletedTanks() {
    var tanks = [];
    var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });

    var tankPositions = [
      { x: -120, z: 60 },
      { x: 120, z: 60 }
    ];

    for (var i = 0; i < tankPositions.length; i++) {
      var tankGroup = new THREE.Group();

      // Tank hull (body)
      var hullGeom = new THREE.BoxGeometry(30, 12, 50);
      var hull = new THREE.Mesh(hullGeom, tankMaterial);
      hull.position.y = 6;
      hull.castShadow = true;
      hull.receiveShadow = true;
      tankGroup.add(hull);

      // Tank turret (rotating box on hull)
      var turretGeom = new THREE.BoxGeometry(20, 10, 25);
      var turret = new THREE.Mesh(turretGeom, tankMaterial);
      turret.position.set(0, 15, 5);
      turret.castShadow = true;
      turret.receiveShadow = true;
      tankGroup.add(turret);

      // Barrel (cylinder)
      var barrelGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 8);
      var barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
      var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
      barrel.rotation.z = Math.PI / 2;
      barrel.position.set(18, 15, 15);
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      tankGroup.add(barrel);

      // Six road wheels
      var wheelGeom = new THREE.BoxGeometry(4, 6, 4);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var wheelPositions = [
        { x: -10, z: -15 },
        { x: -5, z: -15 },
        { x: 0, z: -15 },
        { x: -10, z: 15 },
        { x: -5, z: 15 },
        { x: 0, z: 15 }
      ];

      for (var w = 0; w < wheelPositions.length; w++) {
        var wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
        wheel.position.set(wheelPositions[w].x, 2, wheelPositions[w].z);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        tankGroup.add(wheel);
      }

      tankGroup.position.set(tankPositions[i].x, 0, tankPositions[i].z);
      tanks.push(tankGroup);
    }

    return tanks;
  }

  function createCrane() {
    var craneGroup = new THREE.Group();

    // H-beam horizontal spans (support beams)
    var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });

    // Main horizontal beam (X direction, the trolley slides on this)
    var mainBeamGeom = new THREE.BoxGeometry(280, 2, 3);
    var mainBeam = new THREE.Mesh(mainBeamGeom, beamMaterial);
    mainBeam.position.set(0, 22, 0);
    mainBeam.castShadow = true;
    mainBeam.receiveShadow = true;
    craneGroup.add(mainBeam);

    // Support columns (vertical box spans)
    var columnGeom = new THREE.BoxGeometry(3, 20, 3);
    var column1 = new THREE.Mesh(columnGeom, beamMaterial);
    column1.position.set(-130, 12, 0);
    column1.castShadow = true;
    column1.receiveShadow = true;
    craneGroup.add(column1);

    var column2 = new THREE.Mesh(columnGeom, beamMaterial);
    column2.position.set(130, 12, 0);
    column2.castShadow = true;
    column2.receiveShadow = true;
    craneGroup.add(column2);

    // Trolley that moves along the beam
    var trolleyGeom = new THREE.BoxGeometry(15, 3, 15);
    var trolley = new THREE.Mesh(trolleyGeom, beamMaterial);
    trolley.position.set(0, 20, 0);
    trolley.castShadow = true;
    trolley.receiveShadow = true;
    craneGroup.add(trolley);
    meshes.trolley = trolley;

    // Hook box hanging from trolley
    var hookGeom = new THREE.BoxGeometry(3, 8, 3);
    var hookMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
    var hook = new THREE.Mesh(hookGeom, hookMaterial);
    hook.position.set(0, -5, 0);
    hook.castShadow = true;
    hook.receiveShadow = true;
    trolley.add(hook);

    return craneGroup;
  }

  function createSuspendedTurret() {
    var turretGroup = new THREE.Group();

    // Suspended turret box
    var turretGeom = new THREE.BoxGeometry(20, 10, 25);
    var turretMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a2d });
    var turret = new THREE.Mesh(turretGeom, turretMaterial);
    turret.castShadow = true;
    turret.receiveShadow = true;
    turretGroup.add(turret);

    turretGroup.position.set(0, -8, 0);

    return turretGroup;
  }

  function createGuards() {
    var guardMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var guardCount = 6;
    var guardRadius = 80;

    for (var i = 0; i < guardCount; i++) {
      var angle = (i / guardCount) * Math.PI * 2;
      var x = Math.cos(angle) * guardRadius;
      var z = Math.sin(angle) * guardRadius;

      // Guard figure (stacked boxes for torso, head, limbs)
      var guardGroup = new THREE.Group();

      // Torso
      var torsoGeom = new THREE.BoxGeometry(4, 8, 3);
      var torso = new THREE.Mesh(torsoGeom, guardMaterial);
      torso.position.y = 4;
      torso.castShadow = true;
      torso.receiveShadow = true;
      guardGroup.add(torso);

      // Head
      var headGeom = new THREE.BoxGeometry(3, 3, 3);
      var head = new THREE.Mesh(headGeom, guardMaterial);
      head.position.y = 10;
      head.castShadow = true;
      head.receiveShadow = true;
      guardGroup.add(head);

      guardGroup.position.set(x, 0, z);
      scene.add(guardGroup);
      state.guardPositions.push({ x: x, z: z });
    }
  }

  function createSaboteurs() {
    var saboteurMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var saboteurCount = 4;

    var saboteurStartPositions = [
      { x: -150, z: -150 },
      { x: 150, z: -150 },
      { x: -150, z: 150 },
      { x: 150, z: 150 }
    ];

    for (var i = 0; i < saboteurCount; i++) {
      var saboteurGroup = new THREE.Group();

      // Saboteur body
      var bodyGeom = new THREE.BoxGeometry(4, 8, 3);
      var body = new THREE.Mesh(bodyGeom, saboteurMaterial);
      body.position.y = 4;
      body.castShadow = true;
      body.receiveShadow = true;
      saboteurGroup.add(body);

      // Saboteur head
      var headGeom = new THREE.BoxGeometry(3, 3, 3);
      var head = new THREE.Mesh(headGeom, saboteurMaterial);
      head.position.y = 10;
      head.castShadow = true;
      head.receiveShadow = true;
      saboteurGroup.add(head);

      // Satchel charge (small box)
      var satchelGeom = new THREE.BoxGeometry(3, 2, 5);
      var satchelMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
      var satchel = new THREE.Mesh(satchelGeom, satchelMaterial);
      satchel.position.set(3, 4, 0);
      satchel.castShadow = true;
      satchel.receiveShadow = true;
      saboteurGroup.add(satchel);

      saboteurGroup.position.set(saboteurStartPositions[i].x, 0, saboteurStartPositions[i].z);
      scene.add(saboteurGroup);
      state.saboteurPositions.push({
        x: saboteurStartPositions[i].x,
        z: saboteurStartPositions[i].z,
        mesh: saboteurGroup,
        targetX: 0,
        targetZ: 0
      });
    }
  }

  function createWeldingStations() {
    var tripodMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var sparkMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8
    });

    var stations = [
      { x: -100, z: 0 },
      { x: -50, z: 20 },
      { x: 50, z: -20 },
      { x: 100, z: 0 }
    ];

    for (var i = 0; i < stations.length; i++) {
      var stationGroup = new THREE.Group();

      // Tripod frame (3 box legs)
      var legGeom = new THREE.BoxGeometry(1, 10, 1);
      var leg1 = new THREE.Mesh(legGeom, tripodMaterial);
      leg1.position.set(-2, 5, 0);
      leg1.castShadow = true;
      leg1.receiveShadow = true;
      stationGroup.add(leg1);

      var leg2 = new THREE.Mesh(legGeom, tripodMaterial);
      leg2.position.set(2, 5, 0);
      leg2.castShadow = true;
      leg2.receiveShadow = true;
      stationGroup.add(leg2);

      var leg3 = new THREE.Mesh(legGeom, tripodMaterial);
      leg3.position.set(0, 5, 2);
      leg3.castShadow = true;
      leg3.receiveShadow = true;
      stationGroup.add(leg3);

      // Bright welding spark sphere
      var sparkGeom = new THREE.SphereGeometry(0.8, 8, 8);
      var spark = new THREE.Mesh(sparkGeom, sparkMaterial);
      spark.position.set(0, 10, 1);
      spark.castShadow = true;
      spark.receiveShadow = true;
      stationGroup.add(spark);

      stationGroup.position.set(stations[i].x, 0, stations[i].z);
      scene.add(stationGroup);
      animations['weld_' + i] = { spark: spark, station: stationGroup };
    }
  }

  function createAmmoRoom() {
    var roomMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var shellMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });

    // Ammunition storage room walls
    var roomGeom = new THREE.BoxGeometry(40, 15, 30);
    var room = new THREE.Mesh(roomGeom, roomMaterial);
    room.position.set(180, 7.5, -80);
    room.castShadow = true;
    room.receiveShadow = true;
    scene.add(room);

    // Stack of shell boxes
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        var shellGeom = new THREE.BoxGeometry(5, 8, 5);
        var shell = new THREE.Mesh(shellGeom, shellMaterial);
        shell.position.set(170 + (i * 6), 4 + (j * 8), -80);
        shell.castShadow = true;
        shell.receiveShadow = true;
        scene.add(shell);
      }
    }
  }

  function createDrums() {
    var drumMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 });

    var drumPositions = [
      { x: -180, z: 150 },
      { x: -170, z: 150 },
      { x: -180, z: 160 },
      { x: -170, z: 160 }
    ];

    for (var i = 0; i < drumPositions.length; i++) {
      var drumGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
      var drum = new THREE.Mesh(drumGeom, drumMaterial);
      drum.position.set(drumPositions[i].x, 4, drumPositions[i].z);
      drum.castShadow = true;
      drum.receiveShadow = true;
      scene.add(drum);
    }
  }

  function createControlBooth() {
    var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x6699ff,
      transparent: true,
      opacity: 0.4,
      metalness: 0.3
    });

    // Booth structure (elevated box)
    var boothGeom = new THREE.BoxGeometry(25, 12, 20);
    var booth = new THREE.Mesh(boothGeom, boothMaterial);
    booth.position.set(-180, 16, 80);
    booth.castShadow = true;
    booth.receiveShadow = true;
    scene.add(booth);

    // Glass windows (flat boxes with small depth)
    var windowGeom = new THREE.BoxGeometry(20, 8, 0.5);
    var window = new THREE.Mesh(windowGeom, glassMaterial);
    window.position.set(-180, 16, 90);
    window.castShadow = true;
    window.receiveShadow = true;
    scene.add(window);
  }

  function createVentilationShafts() {
    var ductMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

    // Ceiling-level duct runs (long boxes)
    var ductGeom = new THREE.BoxGeometry(250, 4, 8);
    var duct1 = new THREE.Mesh(ductGeom, ductMaterial);
    duct1.position.set(0, 23.5, -80);
    duct1.castShadow = true;
    duct1.receiveShadow = true;
    scene.add(duct1);

    var duct2 = new THREE.Mesh(ductGeom, ductMaterial);
    duct2.position.set(0, 23.5, 80);
    duct2.castShadow = true;
    duct2.receiveShadow = true;
    scene.add(duct2);
  }

  function createSkylights() {
    var skylightMaterial = new THREE.MeshStandardMaterial({
      color: 0x99ccff,
      transparent: true,
      opacity: 0.3,
      emissive: 0x4488ff,
      emissiveIntensity: 0.4
    });

    // Flat glass skylights in roof with light shafts
    var skylightGeom = new THREE.BoxGeometry(30, 0.5, 30);
    var positions = [
      { x: -80, z: -80 },
      { x: 80, z: -80 },
      { x: -80, z: 80 },
      { x: 80, z: 80 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var skylight = new THREE.Mesh(skylightGeom, skylightMaterial);
      skylight.position.set(positions[i].x, 24.5, positions[i].z);
      skylight.castShadow = true;
      skylight.receiveShadow = true;
      scene.add(skylight);
    }
  }

  function createLoadingDock() {
    var dockMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    var truckMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });

    // Loading dock ramp (flat box)
    var rampGeom = new THREE.BoxGeometry(40, 0.8, 20);
    var ramp = new THREE.Mesh(rampGeom, dockMaterial);
    ramp.position.set(190, 1, -180);
    ramp.castShadow = true;
    ramp.receiveShadow = true;
    scene.add(ramp);

    // Roll-up door opening (represented as a frame box)
    var doorGeom = new THREE.BoxGeometry(40, 12, 0.5);
    var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    var door = new THREE.Mesh(doorGeom, doorMaterial);
    door.position.set(190, 6, -170);
    door.castShadow = true;
    door.receiveShadow = true;
    scene.add(door);

    // Truck outside (box body)
    var truckBodyGeom = new THREE.BoxGeometry(25, 10, 40);
    var truckBody = new THREE.Mesh(truckBodyGeom, truckMaterial);
    truckBody.position.set(190, 5, -220);
    truckBody.castShadow = true;
    truckBody.receiveShadow = true;
    scene.add(truckBody);

    // Truck wheels
    var wheelGeom = new THREE.CylinderGeometry(2, 2, 4, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    var wheelPositions = [
      { x: 200, z: -210 },
      { x: 200, z: -230 },
      { x: 180, z: -210 },
      { x: 180, z: -230 }
    ];

    for (var i = 0; i < wheelPositions.length; i++) {
      var wheel = new THREE.Mesh(wheelGeom, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelPositions[i].x, 2, wheelPositions[i].z);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      scene.add(wheel);
    }
  }

  function createHUD() {
    // Remove existing HUD if any
    var existing = document.getElementById('factory-hud');
    if (existing) {
      existing.remove();
    }

    // Create HUD element
    var hud = document.createElement('div');
    hud.id = 'factory-hud';
    hud.style.position = 'fixed';
    hud.style.top = '20px';
    hud.style.left = '20px';
    hud.style.color = '#00ff00';
    hud.style.fontFamily = 'monospace';
    hud.style.fontSize = '14px';
    hud.style.textShadow = '0 0 10px #00ff00';
    hud.style.zIndex = '1000';
    hud.style.pointerEvents = 'none';
    hud.innerHTML =
      'TANKS DISABLED: ' + state.tankDisabled + '/5<br>' +
      'SABOTEURS ALIVE: ' + state.saboteurCount + '<br>' +
      'FACTORY ALERT: ' + (state.factoryAlert ? 'YES' : 'NO');

    document.body.appendChild(hud);
    meshes.hud = hud;
  }

  function checkHudToggle() {
    if (state.hPressed && state.fPressed) {
      var timeDiff = Math.abs(state.lastHPressTime - state.lastFPressTime);
      if (timeDiff < 400) {
        updateHUD();
        state.hPressed = false;
        state.fPressed = false;
      }
    }
  }

  function updateHUD() {
    if (meshes.hud) {
      meshes.hud.innerHTML =
        'TANKS DISABLED: ' + state.tankDisabled + '/5<br>' +
        'SABOTEURS ALIVE: ' + state.saboteurCount + '<br>' +
        'FACTORY ALERT: ' + (state.factoryAlert ? 'YES' : 'NO');
    }
  }

  function update(delta) {
    // Animate crane trolley sliding along beam
    state.craneX += state.craneMoveDirection * 40 * delta;
    if (state.craneX > 130 || state.craneX < -130) {
      state.craneMoveDirection *= -1;
    }
    if (meshes.trolley) {
      meshes.trolley.position.x = state.craneX;
    }

    // Suspended turret sways gently
    if (meshes.suspendedTurret) {
      state.turretSwayAngle += delta * 1.5;
      meshes.suspendedTurret.rotation.z = Math.sin(state.turretSwayAngle) * 0.1;
    }

    // Welding sparks flash (brightness oscillation)
    state.weldingBrightness += delta * 3;
    for (var key in animations) {
      if (animations[key].spark) {
        var brightness = 0.4 + Math.sin(state.weldingBrightness) * 0.4;
        animations[key].spark.material.emissiveIntensity = brightness;
      }
    }

    // Saboteurs move toward tanks (simple linear movement)
    for (var i = 0; i < state.saboteurPositions.length; i++) {
      var sab = state.saboteurPositions[i];
      var speed = 20;
      var dx = sab.targetX - sab.x;
      var dz = sab.targetZ - sab.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2) {
        var moveX = (dx / dist) * speed * delta;
        var moveZ = (dz / dist) * speed * delta;
        sab.x += moveX;
        sab.z += moveZ;
        if (sab.mesh) {
          sab.mesh.position.x = sab.x;
          sab.mesh.position.z = sab.z;
        }
      } else {
        sab.targetX = Math.random() * 200 - 100;
        sab.targetZ = Math.random() * 200 - 100;
      }
    }

    // Assembly line track scrolls (texture coordinate animation)
    if (meshes.assemblyTrack) {
      meshes.assemblyTrack.position.z += 10 * delta;
      if (meshes.assemblyTrack.position.z > 20) {
        meshes.assemblyTrack.position.z = -20;
      }
    }

    // Guards patrol floor (sinusoidal path)
    for (var g = 0; g < state.guardPositions.length; g++) {
      var guard = state.guardPositions[g];
      guard.time = (guard.time || 0) + delta;
      var patrolZ = guard.z + Math.sin(guard.time * 0.5) * 10;
      // Position would be updated on actual guard mesh if stored
    }
  }

  function reset() {
    state.tankDisabled = 0;
    state.saboteurCount = 4;
    state.factoryAlert = false;
    state.craneX = 0;
    state.craneMoveDirection = 1;
    state.turretSwayAngle = 0;
    state.weldingBrightness = 0;
    updateHUD();

    // Reset saboteur positions
    var saboteurStartPositions = [
      { x: -150, z: -150 },
      { x: 150, z: -150 },
      { x: -150, z: 150 },
      { x: 150, z: 150 }
    ];

    for (var i = 0; i < state.saboteurPositions.length; i++) {
      state.saboteurPositions[i].x = saboteurStartPositions[i].x;
      state.saboteurPositions[i].z = saboteurStartPositions[i].z;
      state.saboteurPositions[i].targetX = 0;
      state.saboteurPositions[i].targetZ = 0;
      if (state.saboteurPositions[i].mesh) {
        state.saboteurPositions[i].mesh.position.x = saboteurStartPositions[i].x;
        state.saboteurPositions[i].mesh.position.z = saboteurStartPositions[i].z;
      }
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
