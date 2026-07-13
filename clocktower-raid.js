window.ClocktowerRaid = (function() {
  'use strict';

  var scene, camera;
  var clockTowerGroup, belfryGroup, sniperFigures, counterSnipers, policeOfficers, climbingTeam;
  var clockHandHour, clockHandMinute, bell, searchlightBeam, policeVehicles;
  var hudDisplay, keyPressTimings, hPressed, kPressed;
  var floatingObjects = [];

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;
    scene.background = new THREE.Color(0x87ceeb);

    keyPressTimings = [];
    hPressed = false;
    kPressed = false;

    buildEnvironment();
    createHUD();
    setupEventListeners();
  }

  function buildEnvironment() {
    clockTowerGroup = new THREE.Group();
    scene.add(clockTowerGroup);

    // 1. City square ground - gray stone flat box (400×0.3×400)
    var groundGeometry = new THREE.BoxGeometry(400, 0.3, 400);
    var groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Clock tower base - massive stone box (16×50×16)
    var towerBaseGeometry = new THREE.BoxGeometry(16, 50, 16);
    var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x7a6a50 });
    var towerBase = new THREE.Mesh(towerBaseGeometry, towerMaterial);
    towerBase.position.y = 25;
    towerBase.castShadow = true;
    clockTowerGroup.add(towerBase);

    // 3. Clock faces - 4 circular indicators on each side at Y=35
    createClockFaces(towerBase);

    // 4. Belfry level - open box section at top (18×8×18)
    belfryGroup = new THREE.Group();
    belfryGroup.position.y = 54;
    clockTowerGroup.add(belfryGroup);
    createBelfry();

    // 5. Gothic spire cap - pointed pyramid box stack above belfry
    createSpire();

    // 6. 3 terrorist sniper figures - dark box bodies prone at belfry openings
    sniperFigures = [];
    createSnipers();

    // 7. 4 counter-sniper officers - blue/black boxes on rooftops
    counterSnipers = [];
    createCounterSnipers();

    // 8. 5 police officers - blue boxes on ground maintaining cordon
    policeOfficers = [];
    createPoliceOfficers();

    // 9. 2 police barricade vehicles - white/blue box vehicles
    policeVehicles = [];
    createPoliceVehicles();

    // 10. Counter-sniper team climbing - 3 figures at different heights
    climbingTeam = [];
    createClimbingTeam();

    // 11. Tower exterior ladder - series of thin horizontal rungs
    createExteriorLadder();

    // 12. Interior clockwork - large cylinder gears + connecting rods
    createClockwork();

    // 13. 2 adjacent buildings - tall office box buildings
    createAdjacentBuildings();

    // 14. City clock square fountain - round cylinder base + water effect
    createFountain();

    // 15. Searchlight beam - emissive cone from helicopter
    createSearchlight();

    // 16. Bell suspended in belfry - toroid approximation, animated swing
    createBell();

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
  }

  function createClockFaces(tower) {
    var positions = [
      { pos: [8, 35, 0], rot: [0, 0, 0] },           // Front
      { pos: [-8, 35, 0], rot: [0, Math.PI, 0] },   // Back
      { pos: [0, 35, 8], rot: [0, Math.PI/2, 0] },  // Right
      { pos: [0, 35, -8], rot: [0, -Math.PI/2, 0] } // Left
    ];

    positions.forEach(function(p) {
      var faceGroup = new THREE.Group();
      faceGroup.position.set(p.pos[0], p.pos[1], p.pos[2]);
      faceGroup.rotation.set(p.rot[0], p.rot[1], p.rot[2]);

      // Frame around clock
      var frameGeometry = new THREE.BoxGeometry(7, 7, 0.2);
      var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var frame = new THREE.Mesh(frameGeometry, frameMaterial);
      faceGroup.add(frame);

      // Clock face background
      var faceGeometry = new THREE.BoxGeometry(6.5, 6.5, 0.1);
      var faceMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var face = new THREE.Mesh(faceGeometry, faceMaterial);
      face.position.z = 0.15;
      faceGroup.add(face);

      // Hour hand
      var hourGeometry = new THREE.BoxGeometry(0.3, 2, 0.1);
      hourMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      clockHandHour = new THREE.Mesh(hourGeometry, hourMaterial);
      clockHandHour.position.set(0, 0.8, 0.2);
      faceGroup.add(clockHandHour);

      // Minute hand
      var minuteGeometry = new THREE.BoxGeometry(0.2, 2.8, 0.1);
      var minuteMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      clockHandMinute = new THREE.Mesh(minuteGeometry, minuteMaterial);
      clockHandMinute.position.set(0, 1.1, 0.2);
      faceGroup.add(clockHandMinute);

      clockTowerGroup.add(faceGroup);
    });
  }

  function createBelfry() {
    // Open box frame for belfry
    var wallThickness = 0.4;

    // Front wall
    var frontGeometry = new THREE.BoxGeometry(18, 8, wallThickness);
    var belfryMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    var front = new THREE.Mesh(frontGeometry, belfryMaterial);
    front.position.z = 9;
    belfryGroup.add(front);

    // Back wall
    var back = new THREE.Mesh(frontGeometry, belfryMaterial);
    back.position.z = -9;
    belfryGroup.add(back);

    // Left wall
    var sideGeometry = new THREE.BoxGeometry(wallThickness, 8, 18);
    var left = new THREE.Mesh(sideGeometry, belfryMaterial);
    left.position.x = -9;
    belfryGroup.add(left);

    // Right wall
    var right = new THREE.Mesh(sideGeometry, belfryMaterial);
    right.position.x = 9;
    belfryGroup.add(right);

    // Belfry floor
    var floorGeometry = new THREE.BoxGeometry(18, 0.5, 18);
    var floorMaterial = new THREE.MeshStandardMaterial({ color: 0x6b5544 });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -3.75;
    belfryGroup.add(floor);
  }

  function createSpire() {
    // Stacked boxes forming pyramid point
    var spireGroup = new THREE.Group();
    spireGroup.position.y = 58;
    clockTowerGroup.add(spireGroup);

    var spireMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });

    var sizes = [
      { w: 12, h: 3, z: 12 },
      { w: 8, h: 3, z: 8 },
      { w: 4, h: 4, z: 4 }
    ];

    var yOffset = 0;
    sizes.forEach(function(size, idx) {
      var geom = new THREE.BoxGeometry(size.w, size.h, size.z);
      var mesh = new THREE.Mesh(geom, spireMaterial);
      mesh.position.y = yOffset;
      yOffset += size.h;
      spireGroup.add(mesh);
    });

    // Spire cross on top
    var crossMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa00 });
    var crossHGeometry = new THREE.BoxGeometry(2, 0.2, 0.2);
    var crossH = new THREE.Mesh(crossHGeometry, crossMaterial);
    crossH.position.y = yOffset + 0.5;
    spireGroup.add(crossH);

    var crossVGeometry = new THREE.BoxGeometry(0.2, 2, 0.2);
    var crossV = new THREE.Mesh(crossVGeometry, crossMaterial);
    crossV.position.y = yOffset + 1.5;
    spireGroup.add(crossV);
  }

  function createSnipers() {
    var sniperPositions = [
      { x: -4, y: 56, z: 9, rot: 0 },
      { x: 4, y: 56, z: -9, rot: Math.PI },
      { x: 0, y: 56, z: 0, rot: Math.PI/2 }
    ];

    sniperPositions.forEach(function(pos) {
      var sniperGroup = new THREE.Group();
      sniperGroup.position.set(pos.x, pos.y, pos.z);

      // Body - prone position
      var bodyGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.2);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.z = Math.PI / 4;
      sniperGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.set(0, 0.3, 0.6);
      sniperGroup.add(head);

      // Rifle - long thin box
      var rifleGeometry = new THREE.BoxGeometry(0.15, 0.1, 1.8);
      var rifleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      var rifle = new THREE.Mesh(rifleGeometry, rifleMaterial);
      rifle.position.set(0.4, 0, 0.3);
      sniperGroup.add(rifle);

      belfryGroup.add(sniperGroup);
      sniperFigures.push({ group: sniperGroup, originalPos: pos });
    });
  }

  function createCounterSnipers() {
    var positions = [
      { x: -60, y: 40, z: -50 },
      { x: 60, y: 42, z: 50 },
      { x: -70, y: 38, z: 50 },
      { x: 70, y: 40, z: -50 }
    ];

    positions.forEach(function(pos) {
      var officerGroup = new THREE.Group();
      officerGroup.position.set(pos.x, pos.y, pos.z);

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a3a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      officerGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.y = 0.8;
      officerGroup.add(head);

      // Weapon
      var weaponGeometry = new THREE.BoxGeometry(0.1, 0.8, 1.5);
      var weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
      var weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
      weapon.position.set(0.3, 0.3, 0.5);
      officerGroup.add(weapon);

      scene.add(officerGroup);
      counterSnipers.push(officerGroup);
    });
  }

  function createPoliceOfficers() {
    var positions = [
      { x: -80, y: 0.3, z: -80 },
      { x: 80, y: 0.3, z: 80 },
      { x: -100, y: 0.3, z: 0 },
      { x: 100, y: 0.3, z: 0 },
      { x: 0, y: 0.3, z: -120 }
    ];

    positions.forEach(function(pos) {
      var officerGroup = new THREE.Group();
      officerGroup.position.set(pos.x, pos.y, pos.z);

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2a5a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      officerGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.y = 0.8;
      officerGroup.add(head);

      // Visibility indicator vest
      var vestGeometry = new THREE.BoxGeometry(0.55, 1.2, 0.1);
      var vestMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff8800 });
      var vest = new THREE.Mesh(vestGeometry, vestMaterial);
      vest.position.z = 0.25;
      officerGroup.add(vest);

      scene.add(officerGroup);
      policeOfficers.push(officerGroup);
    });
  }

  function createPoliceVehicles() {
    var positions = [
      { x: -120, y: 1.5, z: 40 },
      { x: 120, y: 1.5, z: -40 }
    ];

    positions.forEach(function(pos) {
      var vehicleGroup = new THREE.Group();
      vehicleGroup.position.set(pos.x, pos.y, pos.z);

      // Vehicle body - elongated box
      var bodyGeometry = new THREE.BoxGeometry(6, 2.5, 3);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      vehicleGroup.add(body);

      // Vehicle stripe - blue
      var stripeGeometry = new THREE.BoxGeometry(6.1, 0.5, 3.1);
      var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2a5a });
      var stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.y = 1.1;
      vehicleGroup.add(stripe);

      // Wheel 1
      var wheelGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.5);
      var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      var wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel1.position.set(-2, -1.5, 1.5);
      vehicleGroup.add(wheel1);

      // Wheel 2
      var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel2.position.set(2, -1.5, 1.5);
      vehicleGroup.add(wheel2);

      // Wheel 3
      var wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel3.position.set(-2, -1.5, -1.5);
      vehicleGroup.add(wheel3);

      // Wheel 4
      var wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel4.position.set(2, -1.5, -1.5);
      vehicleGroup.add(wheel4);

      scene.add(vehicleGroup);
      policeVehicles.push(vehicleGroup);
    });
  }

  function createClimbingTeam() {
    var heights = [30, 40, 50];
    var xOffsets = [12, 14, 11];

    heights.forEach(function(height, idx) {
      var climberGroup = new THREE.Group();
      climberGroup.position.set(xOffsets[idx], height, 12);

      // Body
      var bodyGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3a5a });
      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      climberGroup.add(body);

      // Head
      var headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      var head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.y = 0.7;
      climberGroup.add(head);

      // Climbing gear indicator
      var gearGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
      var gearMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
      var gear = new THREE.Mesh(gearGeometry, gearMaterial);
      gear.position.set(0.3, 0, 0);
      climberGroup.add(gear);

      scene.add(climberGroup);
      climbingTeam.push({ group: climberGroup, targetHeight: 58, startHeight: height });
    });
  }

  function createExteriorLadder() {
    var rungMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

    for (var y = 5; y < 60; y += 2.5) {
      // Rung 1 - left side
      var rung1Geometry = new THREE.BoxGeometry(0.3, 0.15, 8);
      var rung1 = new THREE.Mesh(rung1Geometry, rungMaterial);
      rung1.position.set(-8.5, y, 0);
      clockTowerGroup.add(rung1);

      // Rung 2 - right side
      var rung2 = new THREE.Mesh(rung1Geometry, rungMaterial);
      rung2.position.set(8.5, y, 0);
      clockTowerGroup.add(rung2);

      // Horizontal connecting rung
      var connGeometry = new THREE.BoxGeometry(1.5, 0.15, 0.3);
      var conn = new THREE.Mesh(connGeometry, rungMaterial);
      conn.position.set(0, y, 8);
      clockTowerGroup.add(conn);
    }
  }

  function createClockwork() {
    var mechanismGroup = new THREE.Group();
    mechanismGroup.position.set(0, 35, 0);
    belfryGroup.add(mechanismGroup);

    // Large gear 1 - cylinder approximation
    var gear1Geometry = new THREE.BoxGeometry(2, 2, 0.5);
    var gearMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.6 });
    var gear1 = new THREE.Mesh(gear1Geometry, gearMaterial);
    gear1.position.set(-3, -2, 0);
    mechanismGroup.add(gear1);

    // Large gear 2
    var gear2 = new THREE.Mesh(gear1Geometry, gearMaterial);
    gear2.position.set(3, -2, 0);
    mechanismGroup.add(gear2);

    // Connecting rod - thin box
    var rodGeometry = new THREE.BoxGeometry(0.3, 0.3, 7);
    var rodMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.set(0, -2.5, 0);
    mechanismGroup.add(rod);

    // Small gear
    var smallGearGeometry = new THREE.BoxGeometry(1, 1, 0.4);
    var smallGear = new THREE.Mesh(smallGearGeometry, gearMaterial);
    smallGear.position.set(0, 0, 3.5);
    mechanismGroup.add(smallGear);

    floatingObjects.push(gear1);
    floatingObjects.push(gear2);
    floatingObjects.push(smallGear);
  }

  function createAdjacentBuildings() {
    var buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xaa9966 });

    // Building 1 - left side
    var building1Geometry = new THREE.BoxGeometry(20, 45, 15);
    var building1 = new THREE.Mesh(building1Geometry, buildingMaterial);
    building1.position.set(-50, 22.5, -20);
    building1.castShadow = true;
    scene.add(building1);

    // Building 2 - right side
    var building2 = new THREE.Mesh(building1Geometry, buildingMaterial);
    building2.position.set(50, 22.5, 20);
    building2.castShadow = true;
    scene.add(building2);

    // Windows on buildings
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x333366, emissive: 0x444488 });
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 8; j++) {
        var windowGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.1);
        var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
        window1.position.set(-50 + (i - 1.5) * 4, 8 + j * 4.5, -20 + 8);
        scene.add(window1);

        var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
        window2.position.set(50 - (i - 1.5) * 4, 8 + j * 4.5, 20 + 8);
        scene.add(window2);
      }
    }
  }

  function createFountain() {
    var fountainGroup = new THREE.Group();
    fountainGroup.position.set(-120, 0.3, -120);
    scene.add(fountainGroup);

    // Base cylinder approximation
    var baseGeometry = new THREE.BoxGeometry(8, 1, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    var base = new THREE.Mesh(baseGeometry, baseMaterial);
    fountainGroup.add(base);

    // Water effect - flat box with blue color
    var waterGeometry = new THREE.BoxGeometry(7, 0.2, 7);
    var waterMaterial = new THREE.MeshStandardMaterial({ color: 0x4488ff, transparent: true, opacity: 0.6 });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.y = 0.6;
    fountainGroup.add(water);

    // Center column
    var columnGeometry = new THREE.BoxGeometry(1, 3, 1);
    var columnMaterial = new THREE.MeshStandardMaterial({ color: 0xbbbbbb });
    var column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.y = 1.5;
    fountainGroup.add(column);

    floatingObjects.push(water);
  }

  function createSearchlight() {
    var searchlightGroup = new THREE.Group();
    searchlightGroup.position.set(0, 80, -150);
    scene.add(searchlightGroup);

    // Light cone
    var coneGeometry = new THREE.BoxGeometry(2, 60, 2);
    var coneMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffff88,
      wireframe: false
    });
    searchlightBeam = new THREE.Mesh(coneGeometry, coneMaterial);
    searchlightBeam.position.z = 30;
    searchlightBeam.transparent = true;
    searchlightBeam.opacity = 0.3;
    searchlightGroup.add(searchlightBeam);

    // Spotlight light source
    var spotLight = new THREE.SpotLight(0xffff88, 1, 200, Math.PI / 4, 0.5, 1);
    spotLight.position.set(0, 80, -150);
    spotLight.target.position.set(0, 40, 20);
    scene.add(spotLight);
    scene.add(spotLight.target);

    floatingObjects.push(searchlightGroup);
  }

  function createBell() {
    var bellGroup = new THREE.Group();
    bellGroup.position.set(0, 57, 0);
    belfryGroup.add(bellGroup);

    // Toroid approximation using stacked cylinders (represented as boxes)
    var ringGeometry = new THREE.BoxGeometry(4, 1.5, 4);
    var bellMaterial = new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.8 });
    var ring = new THREE.Mesh(ringGeometry, bellMaterial);
    bellGroup.add(ring);

    // Bell clapper
    var clapperGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
    var clapper = new THREE.Mesh(clapperGeometry, bellMaterial);
    clapper.position.y = -1;
    bellGroup.add(clapper);

    bell = bellGroup;
  }

  function createHUD() {
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'Bold 32px monospace';
    ctx.fillText('FLOOR LEVEL: GROUND', 20, 60);
    ctx.fillText('SNIPERS: 3', 20, 120);
    ctx.fillText('TEAM ASCENDING: YES', 20, 180);
    ctx.fillStyle = '#ffff00';
    ctx.font = '16px monospace';
    ctx.fillText('Press H+K to toggle', 20, 240);

    var texture = new THREE.CanvasTexture(canvas);
    var hudGeometry = new THREE.BoxGeometry(4, 3, 0.01);
    var hudMaterial = new THREE.MeshBasicMaterial({ map: texture });
    hudDisplay = new THREE.Mesh(hudGeometry, hudMaterial);
    hudDisplay.position.set(-18, 65, -10);
    scene.add(hudDisplay);
  }

  function setupEventListeners() {
    document.addEventListener('keydown', function(event) {
      if (event.key.toUpperCase() === 'H') {
        hPressed = true;
        keyPressTimings.push({ key: 'H', time: Date.now() });
        checkToggle();
      }
      if (event.key.toUpperCase() === 'K') {
        kPressed = true;
        keyPressTimings.push({ key: 'K', time: Date.now() });
        checkToggle();
      }
    });

    document.addEventListener('keyup', function(event) {
      if (event.key.toUpperCase() === 'H') {
        hPressed = false;
      }
      if (event.key.toUpperCase() === 'K') {
        kPressed = false;
      }
    });
  }

  function checkToggle() {
    var now = Date.now();
    var recent = keyPressTimings.filter(function(k) { return now - k.time < 400; });

    if (recent.length >= 2) {
      var hasH = recent.some(function(k) { return k.key === 'H'; });
      var hasK = recent.some(function(k) { return k.key === 'K'; });

      if (hasH && hasK) {
        hudDisplay.visible = !hudDisplay.visible;
        keyPressTimings = [];
      }
    }
  }

  function update(delta) {
    if (!scene) return;

    // Animate clock hands
    var now = new Date();
    var hours = now.getHours() % 12;
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();

    var hourAngle = (hours + minutes / 60) * (Math.PI / 6);
    var minuteAngle = (minutes + seconds / 60) * (Math.PI / 30);

    if (clockHandHour) {
      clockHandHour.rotation.z = hourAngle;
    }
    if (clockHandMinute) {
      clockHandMinute.rotation.z = minuteAngle;
    }

    // Animate bell swing
    if (bell) {
      var swing = Math.sin(Date.now() * 0.001) * 0.3;
      bell.rotation.z = swing;
    }

    // Animate searchlight orbit
    if (searchlightBeam && searchlightBeam.parent) {
      var angle = Date.now() * 0.0001;
      searchlightBeam.parent.position.x = Math.cos(angle) * 150;
      searchlightBeam.parent.position.z = Math.sin(angle) * 150 - 150;
    }

    // Animate climbing team ascension
    climbingTeam.forEach(function(climber, idx) {
      var progress = (Math.sin(Date.now() * 0.0003 + idx) + 1) / 2;
      var targetY = climber.startHeight + (climber.targetHeight - climber.startHeight) * progress;
      climber.group.position.y = targetY;
    });

    // Rotate gears slowly
    floatingObjects.forEach(function(obj) {
      if (obj.rotation) {
        obj.rotation.x += 0.002;
        obj.rotation.y += 0.003;
      }
    });

    // Subtle police cordon movement
    policeOfficers.forEach(function(officer, idx) {
      var bobbing = Math.sin(Date.now() * 0.0005 + idx) * 0.1;
      officer.position.y = 0.3 + bobbing;
    });
  }

  function reset() {
    if (scene) {
      clockTowerGroup.children.forEach(function(child) {
        scene.remove(child);
      });
      counterSnipers.forEach(function(sniper) {
        scene.remove(sniper);
      });
      policeOfficers.forEach(function(officer) {
        scene.remove(officer);
      });
      climbingTeam.forEach(function(climber) {
        scene.remove(climber.group);
      });
      policeVehicles.forEach(function(vehicle) {
        scene.remove(vehicle);
      });
      scene.remove(hudDisplay);
    }

    sniperFigures = [];
    counterSnipers = [];
    policeOfficers = [];
    climbingTeam = [];
    policeVehicles = [];
    floatingObjects = [];
    keyPressTimings = [];
    hPressed = false;
    kPressed = false;

    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
