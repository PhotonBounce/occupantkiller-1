window.AirbaseDefense = (function() {
  'use strict';

  var scene, camera;
  var sceneElements = {};
  var animations = {};
  var hudCanvas, hudCtx;
  var state = {
    perimetrBreach: true,
    aircraftSecure: 2,
    totalAircraft: 3,
    enemyCommandos: 5,
    defenderCount: 6,
    keyPressLog: [],
    hudVisible: false
  };

  var COLOR = {
    tarmac: 0x444444,
    runway: 0x666666,
    concrete: 0x555555,
    jetGray: 0x333333,
    jetCockpit: 0x1a1a1a,
    aaGun: 0x222222,
    commandoBlack: 0x1a1a1a,
    defenderGray: 0x4a4a6a,
    fuelYellow: 0xffcc00,
    fuelWhite: 0xffffff,
    fireRed: 0xcc0000,
    radarGreen: 0x00cc00,
    guardGray: 0x555555,
    tractorYellow: 0xffdd00,
    wireGray: 0x888888
  };

  function createBoxMesh(width, height, depth, color, x, y, z) {
    var geom = new THREE.BoxGeometry(width, height, depth);
    var mat = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createSphereMesh(radius, color, x, y, z, emissive) {
    var geom = new THREE.SphereGeometry(radius, 16, 16);
    var matOpts = { color: color };
    if (emissive) {
      matOpts.emissive = color;
      matOpts.emissiveIntensity = 0.8;
    }
    var mat = new THREE.MeshStandardMaterial(matOpts);
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function createCylinderMesh(radiusTop, radiusBottom, height, color, x, y, z) {
    var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 8);
    var mat = new THREE.MeshStandardMaterial({ color: color });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 500, 1000);

    var light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(100, 150, 100);
    light.castShadow = true;
    light.shadow.camera.left = -300;
    light.shadow.camera.right = 300;
    light.shadow.camera.top = 300;
    light.shadow.camera.bottom = -300;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add(light);

    var ambLight = new THREE.AmbientLight(0x404040);
    scene.add(ambLight);

    // 1. Tarmac ground
    sceneElements.tarmac = createBoxMesh(400, 0.3, 400, COLOR.tarmac, 0, 0, 0);
    scene.add(sceneElements.tarmac);

    // 2. Runway strip with markings
    sceneElements.runway = createBoxMesh(8, 0.1, 200, COLOR.runway, 0, 0.2, 0);
    scene.add(sceneElements.runway);

    var runwayMarking;
    for (var i = 0; i < 10; i++) {
      runwayMarking = createBoxMesh(6, 0.05, 2, 0xffffff, 0, 0.3, -90 + i * 20);
      scene.add(runwayMarking);
    }

    // 3. Fighter jets (2)
    var jet1 = createFighterJet(-80, 1, -150);
    sceneElements.jet1 = jet1;
    scene.add(jet1);

    var jet2 = createFighterJet(80, 1, -50);
    sceneElements.jet2 = jet2;
    scene.add(jet2);

    animations.jet1Taxi = { position: jet1.position, startX: -80, speed: 5, maxZ: 150 };

    // 4. Hardened aircraft shelters (3)
    var shelter1 = createAircraftShelter(-120, 10, 100);
    sceneElements.shelter1 = shelter1;
    scene.add(shelter1);

    var shelter2 = createAircraftShelter(0, 10, 100);
    sceneElements.shelter2 = shelter2;
    scene.add(shelter2);

    var shelter3 = createAircraftShelter(120, 10, 100);
    sceneElements.shelter3 = shelter3;
    scene.add(shelter3);

    // 5. Control tower
    var tower = createControlTower(0, 0, 150);
    sceneElements.tower = tower;
    scene.add(tower);

    // 6. AA gun positions (2)
    var aaGun1 = createAAGunPosition(-150, 2, -120);
    sceneElements.aaGun1 = aaGun1;
    scene.add(aaGun1);
    animations.aaGun1Rotate = { object: aaGun1, currentAngle: 0 };

    var aaGun2 = createAAGunPosition(150, 2, -120);
    sceneElements.aaGun2 = aaGun2;
    scene.add(aaGun2);
    animations.aaGun2Rotate = { object: aaGun2, currentAngle: 0 };

    // 7. Enemy commandos (5) breaching from south
    for (var i = 0; i < 5; i++) {
      var commando = createCommandoFigure(-80 + i * 35, 2, -190 - i * 5);
      sceneElements['commando' + i] = commando;
      scene.add(commando);
      animations['commando' + i + 'Advance'] = { object: commando, baseZ: -190 - i * 5, speed: 20 };
    }

    // 8. Airbase defenders (6) at defensive positions
    var defensePositions = [
      { x: -80, z: -100 },
      { x: 0, z: -100 },
      { x: 80, z: -100 },
      { x: -120, z: 0 },
      { x: 120, z: 0 },
      { x: 0, z: 50 }
    ];
    for (var i = 0; i < 6; i++) {
      var defender = createDefenderFigure(defensePositions[i].x, 2, defensePositions[i].z);
      sceneElements['defender' + i] = defender;
      scene.add(defender);
    }

    // 9. Fuel bowser trucks (2)
    var bowser1 = createFuelBowser(-100, 1.5, 50);
    sceneElements.bowser1 = bowser1;
    scene.add(bowser1);
    animations.bowser1Reverse = { object: bowser1, baseX: -100, speed: 15 };

    var bowser2 = createFuelBowser(100, 1.5, 40);
    sceneElements.bowser2 = bowser2;
    scene.add(bowser2);

    // 10. Perimeter razor wire fence
    createPerimeterFence(scene);

    // 11. Radar dish
    var radar = createRadarDish(0, 5, -180);
    sceneElements.radar = radar;
    scene.add(radar);
    animations.radarSpin = { object: radar, speed: 3 };

    // 12. Fire truck
    var fireTruck = createFireTruck(-150, 1.5, 50);
    sceneElements.fireTruck = fireTruck;
    scene.add(fireTruck);

    // 13. Bomb trolley
    var bombTrolley = createBombTrolley(150, 1, -80);
    sceneElements.bombTrolley = bombTrolley;
    scene.add(bombTrolley);

    // 14. Aircraft tow tractor
    var tractor = createAircraftTractor(-120, 1.2, -200);
    sceneElements.tractor = tractor;
    scene.add(tractor);

    // 15. Floodlight towers (4)
    var floodPositions = [
      { x: -180, z: -180 },
      { x: 180, z: -180 },
      { x: -180, z: 180 },
      { x: 180, z: 180 }
    ];
    for (var i = 0; i < 4; i++) {
      var flood = createFloodlightTower(floodPositions[i].x, floodPositions[i].z);
      sceneElements['flood' + i] = flood;
      scene.add(flood);
      animations['flood' + i + 'Sweep'] = { object: flood, baseAngle: i * 1.57, speed: 2 };
    }

    // 16. Guardhouse at gate
    var guardhouse = createGuardhouse(-200, 3, 0);
    sceneElements.guardhouse = guardhouse;
    scene.add(guardhouse);

    // Setup HUD
    setupHUD();

    // Keyboard input
    document.addEventListener('keydown', function(e) {
      state.keyPressLog.push(e.key.toUpperCase());
      if (state.keyPressLog.length > 10) {
        state.keyPressLog.shift();
      }
      checkHUDToggle();
    });
  }

  function createFighterJet(x, y, z) {
    var group = new THREE.Group();

    var fuselage = createBoxMesh(2, 1.5, 8, COLOR.jetGray, 0, 0, 0);
    group.add(fuselage);

    var wing = createBoxMesh(10, 0.3, 3, COLOR.jetGray, 0, -0.2, 0);
    group.add(wing);

    var tailFin = createBoxMesh(0.5, 3, 2, COLOR.jetGray, 0, 1, 3);
    group.add(tailFin);

    var cockpit = createSphereMesh(0.8, COLOR.jetCockpit, 0, 0.8, -2, false);
    group.add(cockpit);

    var cockpitDome = createBoxMesh(1.2, 0.6, 1.2, 0x333388, 0, 1.2, -2);
    group.add(cockpitDome);

    group.position.set(x, y, z);
    return group;
  }

  function createAircraftShelter(x, y, z) {
    var group = new THREE.Group();

    var base = createBoxMesh(25, 0.5, 20, COLOR.concrete, 0, 0, 0);
    group.add(base);

    var wall1 = createBoxMesh(25, 6, 0.8, COLOR.concrete, 0, 3, -9.6);
    group.add(wall1);

    var wall2 = createBoxMesh(25, 6, 0.8, COLOR.concrete, 0, 3, 9.6);
    group.add(wall2);

    var roofBase = createBoxMesh(25, 0.5, 20, COLOR.concrete, 0, 6, 0);
    group.add(roofBase);

    var roofCurve1 = createBoxMesh(24, 2, 20, COLOR.concrete, 0, 7.5, 0);
    group.add(roofCurve1);

    var roofCurve2 = createBoxMesh(22, 1.5, 20, COLOR.concrete, 0, 9, 0);
    group.add(roofCurve2);

    var roofTop = createBoxMesh(20, 0.8, 20, COLOR.concrete, 0, 10, 0);
    group.add(roofTop);

    group.position.set(x, y, z);
    return group;
  }

  function createControlTower(x, y, z) {
    var group = new THREE.Group();

    var base = createBoxMesh(6, 30, 6, COLOR.jetGray, 0, 0, 0);
    group.add(base);

    var cab = createBoxMesh(10, 4, 10, COLOR.jetGray, 0, 16, 0);
    group.add(cab);

    var window1 = createBoxMesh(2, 2, 0.3, 0x4488ff, -3, 16, 5.2);
    group.add(window1);

    var window2 = createBoxMesh(2, 2, 0.3, 0x4488ff, 3, 16, 5.2);
    group.add(window2);

    group.position.set(x, y, z);
    return group;
  }

  function createAAGunPosition(x, y, z) {
    var group = new THREE.Group();

    var platform = createBoxMesh(12, 0.8, 12, COLOR.aaGun, 0, 0, 0);
    group.add(platform);

    var gunMount = createBoxMesh(3, 4, 3, COLOR.aaGun, 0, 2.5, 0);
    group.add(gunMount);

    var gunBase = new THREE.Group();

    var barrel1 = createCylinderMesh(0.4, 0.4, 6, 0x222222, -1.5, 0, 0);
    gunBase.add(barrel1);

    var barrel2 = createCylinderMesh(0.4, 0.4, 6, 0x222222, 1.5, 0, 0);
    gunBase.add(barrel2);

    gunBase.position.set(0, 3, 0);
    group.add(gunBase);

    group.position.set(x, y, z);
    group.userData.gunBase = gunBase;
    return group;
  }

  function createCommandoFigure(x, y, z) {
    var group = new THREE.Group();

    var body = createBoxMesh(1.2, 2, 0.8, COLOR.commandoBlack, 0, 0, 0);
    group.add(body);

    var head = createSphereMesh(0.5, COLOR.commandoBlack, 0, 1.2, 0, false);
    group.add(head);

    var leg1 = createBoxMesh(0.4, 1.5, 0.4, COLOR.commandoBlack, -0.4, -1, 0);
    group.add(leg1);

    var leg2 = createBoxMesh(0.4, 1.5, 0.4, COLOR.commandoBlack, 0.4, -1, 0);
    group.add(leg2);

    var arm1 = createBoxMesh(0.3, 1.2, 0.3, COLOR.commandoBlack, -0.8, 0.2, 0);
    group.add(arm1);

    var arm2 = createBoxMesh(0.3, 1.2, 0.3, COLOR.commandoBlack, 0.8, 0.2, 0);
    group.add(arm2);

    group.position.set(x, y, z);
    return group;
  }

  function createDefenderFigure(x, y, z) {
    var group = new THREE.Group();

    var body = createBoxMesh(1.2, 2, 0.8, COLOR.defenderGray, 0, 0, 0);
    group.add(body);

    var head = createSphereMesh(0.5, COLOR.defenderGray, 0, 1.2, 0, false);
    group.add(head);

    var leg1 = createBoxMesh(0.4, 1.5, 0.4, COLOR.defenderGray, -0.4, -1, 0);
    group.add(leg1);

    var leg2 = createBoxMesh(0.4, 1.5, 0.4, COLOR.defenderGray, 0.4, -1, 0);
    group.add(leg2);

    var arm1 = createBoxMesh(0.3, 1.2, 0.3, COLOR.defenderGray, -0.8, 0.2, 0);
    group.add(arm1);

    var arm2 = createBoxMesh(0.3, 1.2, 0.3, COLOR.defenderGray, 0.8, 0.2, 0);
    group.add(arm2);

    group.position.set(x, y, z);
    return group;
  }

  function createFuelBowser(x, y, z) {
    var group = new THREE.Group();

    var tankBody = createBoxMesh(3, 2.5, 10, COLOR.fuelYellow, 0, 0, 0);
    group.add(tankBody);

    var cabin = createBoxMesh(2.5, 2, 2.5, COLOR.fuelYellow, 0, 0.5, -5.5);
    group.add(cabin);

    var wheel1 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, -1.5, -1.2, -3);
    group.add(wheel1);

    var wheel2 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, 1.5, -1.2, -3);
    group.add(wheel2);

    var wheel3 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, -1.5, -1.2, 3);
    group.add(wheel3);

    var wheel4 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, 1.5, -1.2, 3);
    group.add(wheel4);

    var nozzle = createBoxMesh(0.4, 0.4, 3, COLOR.fuelWhite, -1.8, 0, 0);
    group.add(nozzle);

    group.position.set(x, y, z);
    return group;
  }

  function createPerimeterFence(scene) {
    var fenceSegments = [
      { x: -200, z: -200, type: 'corner' },
      { x: -200, z: -100, type: 'straight' },
      { x: -200, z: 0, type: 'straight' },
      { x: -200, z: 100, type: 'straight' },
      { x: -200, z: 200, type: 'corner' },
      { x: -100, z: 200, type: 'straight' },
      { x: 0, z: 200, type: 'straight' },
      { x: 100, z: 200, type: 'straight' },
      { x: 200, z: 200, type: 'corner' },
      { x: 200, z: 100, type: 'straight' },
      { x: 200, z: 0, type: 'straight' },
      { x: 200, z: -100, type: 'straight' },
      { x: 200, z: -200, type: 'corner' },
      { x: 100, z: -200, type: 'straight' },
      { x: 0, z: -200, type: 'gap' }
    ];

    for (var i = 0; i < fenceSegments.length; i++) {
      var seg = fenceSegments[i];
      if (seg.type !== 'gap') {
        var fence = createBoxMesh(2, 3, 2, COLOR.wireGray, seg.x, 1.5, seg.z);
        scene.add(fence);
      }
    }
  }

  function createRadarDish(x, y, z) {
    var group = new THREE.Group();

    var tower = createCylinderMesh(0.8, 0.8, 8, COLOR.jetGray, 0, 0, 0);
    group.add(tower);

    var dishBase = createBoxMesh(6, 0.5, 6, COLOR.concrete, 0, 4.5, 0);
    group.add(dishBase);

    var dishRotor = new THREE.Group();
    var dish = createBoxMesh(5, 3, 0.4, COLOR.radarGreen, 0, 0, 0);
    dishRotor.add(dish);
    dishRotor.position.set(0, 4.5, 0);
    group.add(dishRotor);

    group.position.set(x, y, z);
    group.userData.dishRotor = dishRotor;
    return group;
  }

  function createFireTruck(x, y, z) {
    var group = new THREE.Group();

    var cabin = createBoxMesh(2.5, 2.5, 2.5, COLOR.fireRed, -2, 0, 0);
    group.add(cabin);

    var tankBody = createBoxMesh(3, 2.2, 8, COLOR.fireRed, 1, 0, 0);
    group.add(tankBody);

    var ladder = createBoxMesh(0.5, 4, 4, COLOR.fireRed, 3, 1, 0);
    group.add(ladder);

    var cannon = createCylinderMesh(0.3, 0.3, 3, COLOR.fireRed, 3, 2.5, 0);
    group.add(cannon);

    var wheel1 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, -1.5, -1.2, -3);
    group.add(wheel1);

    var wheel2 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, -1.5, -1.2, 3);
    group.add(wheel2);

    var wheel3 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, 2, -1.2, -3);
    group.add(wheel3);

    var wheel4 = createCylinderMesh(0.6, 0.6, 0.5, 0x333333, 2, -1.2, 3);
    group.add(wheel4);

    group.position.set(x, y, z);
    return group;
  }

  function createBombTrolley(x, y, z) {
    var group = new THREE.Group();

    var cartFrame = createBoxMesh(4, 0.8, 6, COLOR.aaGun, 0, 0, 0);
    group.add(cartFrame);

    var wheel1 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, -2, -0.5, -2.5);
    group.add(wheel1);

    var wheel2 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, 2, -0.5, -2.5);
    group.add(wheel2);

    var wheel3 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, -2, -0.5, 2.5);
    group.add(wheel3);

    var wheel4 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, 2, -0.5, 2.5);
    group.add(wheel4);

    for (var i = 0; i < 3; i++) {
      var bomb = createCylinderMesh(0.8, 0.8, 2.5, 0x333333, -1.2, 1.5 + i * 1.2, 0);
      group.add(bomb);
    }

    for (var i = 0; i < 3; i++) {
      var bomb = createCylinderMesh(0.8, 0.8, 2.5, 0x333333, 1.2, 1.5 + i * 1.2, 0);
      group.add(bomb);
    }

    group.position.set(x, y, z);
    return group;
  }

  function createAircraftTractor(x, y, z) {
    var group = new THREE.Group();

    var cabin = createBoxMesh(2, 1.5, 2.5, COLOR.tractorYellow, 0, 0, 0);
    group.add(cabin);

    var wheel1 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, -0.8, -0.8, -1);
    group.add(wheel1);

    var wheel2 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, 0.8, -0.8, -1);
    group.add(wheel2);

    var wheel3 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, -0.8, -0.8, 1);
    group.add(wheel3);

    var wheel4 = createCylinderMesh(0.5, 0.5, 0.4, 0x333333, 0.8, -0.8, 1);
    group.add(wheel4);

    var towBar = createBoxMesh(2.5, 0.3, 0.8, 0x888888, 0, -0.2, 1.5);
    group.add(towBar);

    group.position.set(x, y, z);
    return group;
  }

  function createFloodlightTower(x, z) {
    var group = new THREE.Group();

    var pole = createCylinderMesh(0.4, 0.4, 20, COLOR.jetGray, 0, 10, 0);
    group.add(pole);

    var lightArray = new THREE.Group();

    var light1 = createSphereMesh(0.8, 0xffffff, -2, 0, 0, true);
    lightArray.add(light1);

    var light2 = createSphereMesh(0.8, 0xffffff, 0, 0, 0, true);
    lightArray.add(light2);

    var light3 = createSphereMesh(0.8, 0xffffff, 2, 0, 0, true);
    lightArray.add(light3);

    lightArray.position.set(0, 18, 0);
    group.add(lightArray);

    group.position.set(x, 0, z);
    group.userData.lightArray = lightArray;
    return group;
  }

  function createGuardhouse(x, y, z) {
    var group = new THREE.Group();

    var walls = createBoxMesh(6, 4, 6, COLOR.guardGray, 0, 0, 0);
    group.add(walls);

    var roof = createBoxMesh(6.5, 0.5, 6.5, COLOR.guardGray, 0, 2.5, 0);
    group.add(roof);

    var door = createBoxMesh(2, 2.5, 0.2, 0x8B4513, -2.5, 0, 3.1);
    group.add(door);

    var window1 = createBoxMesh(1.5, 1.5, 0.2, 0x4488ff, 2.5, 0.5, 3.1);
    group.add(window1);

    var barrierPole = createCylinderMesh(0.3, 0.3, 3, 0xff0000, 5, 1.5, 0);
    group.add(barrierPole);

    var barrierBar = createBoxMesh(8, 0.2, 0.3, 0xff0000, 5, 1.3, 0);
    group.add(barrierBar);

    group.position.set(x, y, z);
    return group;
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = 800;
    hudCanvas.height = 120;
    hudCanvas.style.position = 'fixed';
    hudCanvas.style.top = '10px';
    hudCanvas.style.left = '10px';
    hudCanvas.style.zIndex = '1000';
    hudCanvas.style.display = 'none';
    document.body.appendChild(hudCanvas);
    hudCtx = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    if (!state.hudVisible) return;

    hudCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudCtx.fillStyle = '#00ff00';
    hudCtx.font = 'bold 16px monospace';

    var yPos = 25;
    hudCtx.fillText('PERIMETER BREACH: ' + (state.perimetrBreach ? 'YES' : 'NO'), 20, yPos);
    yPos += 25;
    hudCtx.fillText('AIRCRAFT SECURE: ' + state.aircraftSecure + '/' + state.totalAircraft, 20, yPos);
    yPos += 25;
    hudCtx.fillText('ENEMY COMMANDOS: ' + state.enemyCommandos, 20, yPos);
  }

  function checkHUDToggle() {
    var log = state.keyPressLog.join('');
    if (log.includes('HA')) {
      var idx = log.indexOf('HA');
      if (idx >= 0 && log.length - idx <= 2) {
        state.hudVisible = !state.hudVisible;
        hudCanvas.style.display = state.hudVisible ? 'block' : 'none';
        state.keyPressLog = [];
      }
    }
  }

  function update(delta) {
    // Jet taxi animation
    if (animations.jet1Taxi) {
      var taxi = animations.jet1Taxi;
      if (taxi.position.z < taxi.maxZ) {
        taxi.position.z += taxi.speed * delta;
      }
    }

    // AA gun tracking
    if (animations.aaGun1Rotate && sceneElements.aaGun1) {
      var aaGun = sceneElements.aaGun1;
      var gunBase = aaGun.userData.gunBase;
      if (gunBase) {
        animations.aaGun1Rotate.currentAngle += 0.5 * delta;
        if (animations.aaGun1Rotate.currentAngle > Math.PI * 2) {
          animations.aaGun1Rotate.currentAngle = 0;
        }
        gunBase.rotation.y = animations.aaGun1Rotate.currentAngle;
      }
    }

    if (animations.aaGun2Rotate && sceneElements.aaGun2) {
      var aaGun = sceneElements.aaGun2;
      var gunBase = aaGun.userData.gunBase;
      if (gunBase) {
        animations.aaGun2Rotate.currentAngle -= 0.5 * delta;
        if (animations.aaGun2Rotate.currentAngle < -Math.PI * 2) {
          animations.aaGun2Rotate.currentAngle = 0;
        }
        gunBase.rotation.y = animations.aaGun2Rotate.currentAngle;
      }
    }

    // Commando advance
    for (var i = 0; i < 5; i++) {
      var key = 'commando' + i + 'Advance';
      if (animations[key]) {
        var anim = animations[key];
        anim.object.position.z += anim.speed * delta;
      }
    }

    // Radar spin
    if (animations.radarSpin && sceneElements.radar) {
      var radar = sceneElements.radar;
      var dishRotor = radar.userData.dishRotor;
      if (dishRotor) {
        dishRotor.rotation.y += animations.radarSpin.speed * delta;
      }
    }

    // Floodlight sweep
    for (var i = 0; i < 4; i++) {
      var key = 'flood' + i + 'Sweep';
      if (animations[key] && sceneElements['flood' + i]) {
        var flood = sceneElements['flood' + i];
        var lightArray = flood.userData.lightArray;
        if (lightArray) {
          animations[key].baseAngle += animations[key].speed * delta;
          lightArray.rotation.y = animations[key].baseAngle;
        }
      }
    }

    // Bowser reverse
    if (animations.bowser1Reverse) {
      var anim = animations.bowser1Reverse;
      anim.object.position.x -= anim.speed * delta;
    }

    updateHUD();
  }

  function reset() {
    state.perimetrBreach = true;
    state.aircraftSecure = 2;
    state.enemyCommandos = 5;
    state.keyPressLog = [];
    state.hudVisible = false;
    if (hudCanvas) {
      hudCanvas.style.display = 'none';
    }

    if (sceneElements.jet1) {
      sceneElements.jet1.position.z = -150;
    }

    for (var i = 0; i < 5; i++) {
      if (sceneElements['commando' + i]) {
        sceneElements['commando' + i].position.z = -190 - i * 5;
      }
    }

    if (sceneElements.bowser1) {
      sceneElements.bowser1.position.x = -100;
    }

    if (animations.aaGun1Rotate) {
      animations.aaGun1Rotate.currentAngle = 0;
    }
    if (animations.aaGun2Rotate) {
      animations.aaGun2Rotate.currentAngle = 0;
    }

    if (sceneElements.aaGun1 && sceneElements.aaGun1.userData.gunBase) {
      sceneElements.aaGun1.userData.gunBase.rotation.y = 0;
    }
    if (sceneElements.aaGun2 && sceneElements.aaGun2.userData.gunBase) {
      sceneElements.aaGun2.userData.gunBase.rotation.y = 0;
    }
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
