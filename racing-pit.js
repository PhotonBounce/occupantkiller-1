window.RacingPit = (function() {
  'use strict';

  var scene, camera, renderer;
  var racingPitObjects = [];
  var raceCars = [];
  var mechs = [];
  var saboteur;
  var carFire;
  var safetyCrewMembers = [];
  var timingBoard;
  var hudCanvas, hudCtx;
  var clockTime = 0;

  // HUD state
  var hudState = {
    saboteursCaught: 0,
    maxSaboteurs: 1,
    carsSecured: 0,
    maxCars: 2,
    fireSuppressed: false
  };

  // Keybind tracking for R+P
  var keyStates = {};
  var lastRTime = 0;

  function init() {
    // Three.js setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
    document.body.appendChild(renderer.domElement);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    // Build pit lane scene
    buildPitLane();
    buildRaceCars();
    buildPitBoxGarage();
    buildWheelGun();
    buildTireStack();
    buildPitCrewMechanics();
    buildSaboteur();
    buildTeamPrincipal();
    buildPitWallGantry();
    buildFuelRig();
    buildDataMonitorScreens();
    buildCarFire();
    buildSafetyCrewMembers();
    buildGrandstandCrowd();
    buildTimingBoard();
    buildToolTrolley();

    // Setup HUD
    setupHUD();

    // Setup keyboard
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
  }

  function buildPitLane() {
    // Pit lane surface - long flat dark asphalt
    var pitLaneGeo = new THREE.BoxGeometry(80, 0.5, 20);
    var pitLaneMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var pitLane = new THREE.Mesh(pitLaneGeo, pitLaneMat);
    pitLane.receiveShadow = true;
    scene.add(pitLane);
    racingPitObjects.push(pitLane);
  }

  function buildRaceCars() {
    // Car #1 - low elongated box + box wing + cylinder wheels
    var car1 = createRaceCar(0xCC0000, -15, 2, 0);
    raceCars.push(car1);
    scene.add(car1);
    racingPitObjects.push(car1);

    // Car #2 - same but different color
    var car2 = createRaceCar(0x0000CC, 15, 2, 0);
    raceCars.push(car2);
    scene.add(car2);
    racingPitObjects.push(car2);
  }

  function createRaceCar(color, x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Main body - elongated box
    var bodyGeo = new THREE.BoxGeometry(8, 2, 3);
    var bodyMat = new THREE.MeshPhongMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Wing - box on top
    var wingGeo = new THREE.BoxGeometry(6, 0.5, 1.5);
    var wingMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 1.5, 0);
    wing.castShadow = true;
    group.add(wing);

    // Wheels - 4 cylinders
    for (var i = 0; i < 4; i++) {
      var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
      var wheelMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;

      var xPos = (i < 2) ? -3 : 3;
      var zPos = (i % 2 === 0) ? -1.2 : 1.2;
      wheel.position.set(xPos, -1.2, zPos);
      group.add(wheel);
    }

    return group;
  }

  function buildPitBoxGarage() {
    // Pit box walls for 2 bays
    // Left bay back wall
    var wallGeo = new THREE.BoxGeometry(15, 8, 0.5);
    var wallMat = new THREE.MeshPhongMaterial({ color: 0x444444 });

    var leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-12, 4, -12);
    leftWall.castShadow = true;
    scene.add(leftWall);
    racingPitObjects.push(leftWall);

    var rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(12, 4, -12);
    rightWall.castShadow = true;
    scene.add(rightWall);
    racingPitObjects.push(rightWall);

    // Side walls
    var sideWallGeo = new THREE.BoxGeometry(0.5, 8, 20);
    var sideWall = new THREE.Mesh(sideWallGeo, wallMat);
    sideWall.position.set(-27, 4, 0);
    sideWall.castShadow = true;
    scene.add(sideWall);
    racingPitObjects.push(sideWall);

    var sideWall2 = new THREE.Mesh(sideWallGeo, wallMat);
    sideWall2.position.set(27, 4, 0);
    sideWall2.castShadow = true;
    scene.add(sideWall2);
    racingPitObjects.push(sideWall2);
  }

  function buildWheelGun() {
    // Wheel gun equipment - box with cylinder air hose
    var gunGroupLeft = new THREE.Group();
    gunGroupLeft.position.set(-15, 2, 5);

    var gunBodyGeo = new THREE.BoxGeometry(1, 1.5, 0.8);
    var gunMat = new THREE.MeshPhongMaterial({ color: 0xFFCC00 });
    var gunBody = new THREE.Mesh(gunBodyGeo, gunMat);
    gunBody.castShadow = true;
    gunGroupLeft.add(gunBody);

    var hoseGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
    var hoseMat = new THREE.MeshPhongMaterial({ color: 0xEE0000 });
    var hose = new THREE.Mesh(hoseGeo, hoseMat);
    hose.position.set(0, 2, 0);
    hose.rotation.z = Math.PI / 4;
    hose.castShadow = true;
    gunGroupLeft.add(hose);

    scene.add(gunGroupLeft);
    racingPitObjects.push(gunGroupLeft);

    var gunGroupRight = new THREE.Group();
    gunGroupRight.position.set(15, 2, 5);
    var gunBody2 = new THREE.Mesh(gunBodyGeo, gunMat);
    gunBody2.castShadow = true;
    gunGroupRight.add(gunBody2);
    var hose2 = new THREE.Mesh(hoseGeo, hoseMat);
    hose2.position.set(0, 2, 0);
    hose2.rotation.z = Math.PI / 4;
    hose2.castShadow = true;
    gunGroupRight.add(hose2);

    scene.add(gunGroupRight);
    racingPitObjects.push(gunGroupRight);
  }

  function buildTireStack() {
    // Tire stack - 4 cylinder tires stacked
    var tireStackGroup = new THREE.Group();
    tireStackGroup.position.set(35, 0, 0);

    for (var i = 0; i < 4; i++) {
      var tireGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16);
      var tireMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.y = i * 1.6;
      tire.castShadow = true;
      tireStackGroup.add(tire);
    }

    scene.add(tireStackGroup);
    racingPitObjects.push(tireStackGroup);
  }

  function buildPitCrewMechanics() {
    // 6 pit crew mechanics in racing suits
    var positions = [
      { x: -18, z: 2 },
      { x: -12, z: 2 },
      { x: -6, z: 2 },
      { x: 6, z: 2 },
      { x: 12, z: 2 },
      { x: 18, z: 2 }
    ];

    var colors = [0xFF6600, 0xFF6600, 0xFF6600, 0x0066FF, 0x0066FF, 0x0066FF];

    for (var i = 0; i < positions.length; i++) {
      var mech = createMechanic(colors[i], positions[i].x, 0.75, positions[i].z);
      mechs.push(mech);
      scene.add(mech);
      racingPitObjects.push(mech);
    }
  }

  function createMechanic(color, x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    // Body - box
    var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMat = new THREE.MeshPhongMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    // Head - sphere
    var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var headMat = new THREE.MeshPhongMaterial({ color: 0xFFCDB3 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.8;
    head.castShadow = true;
    group.add(head);

    group.mechIndex = mechs.length;
    return group;
  }

  function buildSaboteur() {
    // Saboteur figure - box+sphere in disguise (dark gray)
    var sabGroup = new THREE.Group();
    sabGroup.position.set(5, 0.75, -8);

    var sabBodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var sabMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var sabBody = new THREE.Mesh(sabBodyGeo, sabMat);
    sabBody.castShadow = true;
    sabGroup.add(sabBody);

    var sabHeadGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var sabHeadMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    var sabHead = new THREE.Mesh(sabHeadGeo, sabHeadMat);
    sabHead.position.y = 0.8;
    sabHead.castShadow = true;
    sabGroup.add(sabHead);

    // Small device - glowing cube
    var deviceGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    var deviceMat = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.8
    });
    var device = new THREE.Mesh(deviceGeo, deviceMat);
    device.position.set(0, 0, -0.5);
    sabGroup.add(device);

    saboteur = sabGroup;
    saboteur.caught = false;
    scene.add(saboteur);
    racingPitObjects.push(saboteur);
  }

  function buildTeamPrincipal() {
    // Team principal figure - box+sphere with headset
    var tpGroup = new THREE.Group();
    tpGroup.position.set(-40, 0.75, 5);

    var tpBodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var tpMat = new THREE.MeshPhongMaterial({ color: 0x000080 });
    var tpBody = new THREE.Mesh(tpBodyGeo, tpMat);
    tpBody.castShadow = true;
    tpGroup.add(tpBody);

    var tpHeadGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var tpHeadMat = new THREE.MeshPhongMaterial({ color: 0xFFCDB3 });
    var tpHead = new THREE.Mesh(tpHeadGeo, tpHeadMat);
    tpHead.position.y = 0.8;
    tpHead.castShadow = true;
    tpGroup.add(tpHead);

    // Headset - small box
    var headsetGeo = new THREE.BoxGeometry(0.4, 0.2, 0.3);
    var headsetMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
    var headset = new THREE.Mesh(headsetGeo, headsetMat);
    headset.position.set(0, 0.95, 0);
    tpGroup.add(headset);

    scene.add(tpGroup);
    racingPitObjects.push(tpGroup);
  }

  function buildPitWallGantry() {
    // Pit wall gantry - box frame above pit lane
    var gantryGroup = new THREE.Group();

    // Vertical supports
    var supportGeo = new THREE.BoxGeometry(0.8, 6, 0.8);
    var supportMat = new THREE.MeshPhongMaterial({ color: 0x666666 });

    var support1 = new THREE.Mesh(supportGeo, supportMat);
    support1.position.set(-20, 3, -10);
    support1.castShadow = true;
    gantryGroup.add(support1);

    var support2 = new THREE.Mesh(supportGeo, supportMat);
    support2.position.set(20, 3, -10);
    support2.castShadow = true;
    gantryGroup.add(support2);

    // Top beam
    var beamGeo = new THREE.BoxGeometry(42, 1, 1);
    var beamMat = new THREE.MeshPhongMaterial({ color: 0x777777 });
    var beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 6, -10);
    beam.castShadow = true;
    gantryGroup.add(beam);

    scene.add(gantryGroup);
    racingPitObjects.push(gantryGroup);
  }

  function buildFuelRig() {
    // Fuel rig - cylinder tank + hose LineSegments
    var fuelGroup = new THREE.Group();
    fuelGroup.position.set(-35, 0, 0);

    var tankGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
    var tankMat = new THREE.MeshPhongMaterial({ color: 0xFFAA00 });
    var tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.y = 2;
    tank.castShadow = true;
    fuelGroup.add(tank);

    // Hose - line segments
    var hosePoints = [
      new THREE.Vector3(0, 3, 0),
      new THREE.Vector3(2, 3, 0),
      new THREE.Vector3(2, 1, 0)
    ];
    var hoseGeo = new THREE.BufferGeometry().setFromPoints(hosePoints);
    var hoseMat = new THREE.LineBasicMaterial({ color: 0xFF6600, linewidth: 3 });
    var hose = new THREE.Line(hoseGeo, hoseMat);
    fuelGroup.add(hose);

    scene.add(fuelGroup);
    racingPitObjects.push(fuelGroup);
  }

  function buildDataMonitorScreens() {
    // Data monitor screens - box with emissive displays
    var monitorGroup = new THREE.Group();
    monitorGroup.position.set(-45, 2, 0);

    var screenGeo = new THREE.BoxGeometry(3, 2, 0.3);
    var screenMat = new THREE.MeshPhongMaterial({
      color: 0x001a4d,
      emissive: 0x0033FF,
      emissiveIntensity: 0.5
    });
    var screen = new THREE.Mesh(screenGeo, screenMat);
    screen.castShadow = true;
    monitorGroup.add(screen);

    // Frame
    var frameGeo = new THREE.BoxGeometry(3.5, 2.5, 0.1);
    var frameMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.2;
    monitorGroup.add(frame);

    scene.add(monitorGroup);
    racingPitObjects.push(monitorGroup);
  }

  function buildCarFire() {
    // Car on fire - emissive orange sphere cluster under box
    var fireGroup = new THREE.Group();
    fireGroup.position.set(20, 1.5, 5);

    var carGeo = new THREE.BoxGeometry(8, 2, 3);
    var carMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
    var car = new THREE.Mesh(carGeo, carMat);
    car.castShadow = true;
    fireGroup.add(car);

    // Fire - cluster of emissive spheres
    for (var i = 0; i < 5; i++) {
      var fireGeo = new THREE.SphereGeometry(0.8, 8, 8);
      var fireMat = new THREE.MeshPhongMaterial({
        color: 0xFF4400,
        emissive: 0xFF6600,
        emissiveIntensity: 0.9
      });
      var fireSphere = new THREE.Mesh(fireGeo, fireMat);
      fireSphere.position.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 1,
        (Math.random() - 0.5) * 2
      );
      fireGroup.add(fireSphere);
    }

    carFire = fireGroup;
    carFire.fireIntensity = 0.9;
    scene.add(carFire);
    racingPitObjects.push(carFire);
  }

  function buildSafetyCrewMembers() {
    // Safety crew in red fire suits
    var safetyPositions = [
      { x: 30, z: 5 },
      { x: 35, z: 5 },
      { x: 40, z: 5 }
    ];

    for (var i = 0; i < safetyPositions.length; i++) {
      var safetyCrew = createSafetyCrew(safetyPositions[i].x, 0.75, safetyPositions[i].z);
      safetyCrewMembers.push(safetyCrew);
      scene.add(safetyCrew);
      racingPitObjects.push(safetyCrew);
    }
  }

  function createSafetyCrew(x, y, z) {
    var group = new THREE.Group();
    group.position.set(x, y, z);

    var bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
    var bodyMat = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.35, 8, 8);
    var headMat = new THREE.MeshPhongMaterial({ color: 0xFFCDB3 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.8;
    head.castShadow = true;
    group.add(head);

    group.safetyIndex = safetyCrewMembers.length;
    return group;
  }

  function buildGrandstandCrowd() {
    // Grandstand crowd - rows of box+sphere spectators
    var crowdGroup = new THREE.Group();
    crowdGroup.position.set(0, 0, -50);

    var rowCount = 4;
    var colCount = 8;

    for (var row = 0; row < rowCount; row++) {
      for (var col = 0; col < colCount; col++) {
        var spectator = createSpectator();
        spectator.position.set(
          (col - colCount / 2) * 2,
          row * 1.5,
          row * 3
        );
        crowdGroup.add(spectator);
      }
    }

    scene.add(crowdGroup);
    racingPitObjects.push(crowdGroup);
  }

  function createSpectator() {
    var group = new THREE.Group();

    var colors = [0xFF0000, 0x0000FF, 0xFFFF00, 0x00FF00];
    var color = colors[Math.floor(Math.random() * colors.length)];

    var bodyGeo = new THREE.BoxGeometry(0.5, 0.8, 0.3);
    var bodyMat = new THREE.MeshPhongMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.2, 6, 6);
    var headMat = new THREE.MeshPhongMaterial({ color: 0xFFCDB3 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.55;
    group.add(head);

    return group;
  }

  function buildTimingBoard() {
    // Timing display board - box with emissive digits
    var boardGroup = new THREE.Group();
    boardGroup.position.set(0, 8, -15);

    var boardGeo = new THREE.BoxGeometry(8, 3, 0.3);
    var boardMat = new THREE.MeshPhongMaterial({
      color: 0x000000,
      emissive: 0x000000,
      emissiveIntensity: 0
    });
    var board = new THREE.Mesh(boardGeo, boardMat);
    board.castShadow = true;
    boardGroup.add(board);

    // Frame
    var frameGeo = new THREE.BoxGeometry(8.5, 3.5, 0.1);
    var frameMat = new THREE.MeshPhongMaterial({ color: 0xAAAAAA });
    var frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.z = -0.2;
    boardGroup.add(frame);

    timingBoard = boardGroup;
    timingBoard.displayIntensity = 0.5;
    scene.add(boardGroup);
    racingPitObjects.push(boardGroup);
  }

  function buildToolTrolley() {
    // Tool trolley - box on cylinder wheels
    var trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(45, 0.5, -5);

    var trolleyGeo = new THREE.BoxGeometry(2, 1, 1.5);
    var trolleyMat = new THREE.MeshPhongMaterial({ color: 0xFFCC00 });
    var trolley = new THREE.Mesh(trolleyGeo, trolleyMat);
    trolley.castShadow = true;
    trolleyGroup.add(trolley);

    // Wheels
    for (var i = 0; i < 4; i++) {
      var wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
      var wheelMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
      var wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;

      var xPos = (i < 2) ? -0.8 : 0.8;
      var zPos = (i % 2 === 0) ? -0.6 : 0.6;
      wheel.position.set(xPos, -0.5, zPos);
      trolleyGroup.add(wheel);
    }

    scene.add(trolleyGroup);
    racingPitObjects.push(trolleyGroup);
  }

  function setupHUD() {
    hudCanvas = document.createElement('canvas');
    hudCanvas.width = window.innerWidth;
    hudCanvas.height = window.innerHeight;
    hudCanvas.style.position = 'absolute';
    hudCanvas.style.top = '0';
    hudCanvas.style.left = '0';
    hudCanvas.style.pointerEvents = 'none';
    document.body.appendChild(hudCanvas);

    hudCtx = hudCanvas.getContext('2d');
  }

  function updateHUD() {
    hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

    hudCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    hudCtx.font = 'bold 24px monospace';
    hudCtx.textAlign = 'left';

    var text1 = 'SABOTEURS CAUGHT: ' + hudState.saboteursCaught + '/' + hudState.maxSaboteurs;
    var text2 = 'CARS SECURED: ' + hudState.carsSecured + '/' + hudState.maxCars;
    var text3 = 'FIRE SUPPRESSED: ' + (hudState.fireSuppressed ? 'YES' : 'NO');

    hudCtx.fillText(text1, 20, 50);
    hudCtx.fillText(text2, 20, 90);
    hudCtx.fillText(text3, 20, 130);

    hudCtx.font = 'bold 16px monospace';
    hudCtx.fillStyle = 'rgba(200, 200, 200, 0.6)';
    hudCtx.fillText('Press R+P to toggle HUD', 20, hudCanvas.height - 30);
  }

  function animateRaceCars() {
    for (var i = 0; i < raceCars.length; i++) {
      var car = raceCars[i];
      var speed = 0.02;
      car.position.z += speed;

      if (car.position.z > 15) {
        car.position.z = -20;
      }
    }
  }

  function animatePitCrew() {
    for (var i = 0; i < mechs.length; i++) {
      var mech = mechs[i];

      // Rotating around car
      var angle = clockTime * 0.05 + (i * Math.PI / 3);
      var radius = 4;
      mech.position.x = Math.cos(angle) * radius + (i < 3 ? -12 : 12);
      mech.position.z = 2 + Math.sin(clockTime * 0.1) * 0.5;

      // Bobbing motion
      mech.position.y = 0.75 + Math.sin(clockTime * 0.08 + i) * 0.2;
    }
  }

  function animateSaboteur() {
    if (saboteur && !saboteur.caught) {
      // Crouching motion
      var crouch = Math.sin(clockTime * 0.06) * 0.1;
      saboteur.position.y = 0.75 + crouch;

      // Slight left-right movement
      saboteur.position.x = 5 + Math.sin(clockTime * 0.04) * 0.3;
    }
  }

  function animateCarFire() {
    if (carFire) {
      // Flicker emissive
      carFire.fireIntensity += (Math.random() - 0.5) * 0.05;
      carFire.fireIntensity = Math.max(0.3, Math.min(1, carFire.fireIntensity));

      for (var i = 1; i < carFire.children.length; i++) {
        var child = carFire.children[i];
        if (child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = carFire.fireIntensity;
        }
      }
    }
  }

  function animateSafetyCrewRush() {
    for (var i = 0; i < safetyCrewMembers.length; i++) {
      var member = safetyCrewMembers[i];
      var moveSpeed = 0.03;
      member.position.x -= moveSpeed;

      if (member.position.x < 0) {
        member.position.x = 45;
      }
    }
  }

  function animateTimingBoard() {
    if (timingBoard) {
      var newIntensity = 0.3 + Math.sin(clockTime * 0.08) * 0.4;
      timingBoard.displayIntensity = newIntensity;

      for (var i = 0; i < timingBoard.children.length; i++) {
        var child = timingBoard.children[i];
        if (child.material && child.material.emissive) {
          child.material.emissiveIntensity = newIntensity;
        }
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);

    clockTime += 1;

    animateRaceCars();
    animatePitCrew();
    animateSaboteur();
    animateCarFire();
    animateSafetyCrewRush();
    animateTimingBoard();

    updateHUD();

    renderer.render(scene, camera);
  }

  function onKeyDown(event) {
    var key = event.key.toUpperCase();
    keyStates[key] = true;

    if (key === 'R') {
      lastRTime = Date.now();
    }

    if (key === 'P' && Date.now() - lastRTime < 400) {
      hudCanvas.style.display = hudCanvas.style.display === 'none' ? 'block' : 'none';
    }
  }

  function onKeyUp(event) {
    var key = event.key.toUpperCase();
    keyStates[key] = false;
  }

  function onWindowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    hudCanvas.width = width;
    hudCanvas.height = height;
  }

  function reset() {
    // Clear all objects
    for (var i = 0; i < racingPitObjects.length; i++) {
      var obj = racingPitObjects[i];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          for (var j = 0; j < obj.material.length; j++) {
            obj.material[j].dispose();
          }
        } else {
          obj.material.dispose();
        }
      }
    }

    // Clear scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Clear arrays
    racingPitObjects = [];
    raceCars = [];
    mechs = [];
    safetyCrewMembers = [];

    saboteur = null;
    carFire = null;
    timingBoard = null;

    // Dispose renderer
    if (renderer) {
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    }

    // Remove HUD
    if (hudCanvas && hudCanvas.parentNode) {
      document.body.removeChild(hudCanvas);
      hudCanvas = null;
      hudCtx = null;
    }

    // Clear listeners
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onWindowResize);
  }

  return {
    init: init,
    update: animate,
    reset: reset
  };
}());
