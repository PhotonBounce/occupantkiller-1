window.RadioBunker = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var bunkerGroup = null;
  var reelRotations = [];
  var dialSweeps = [];
  var indicatorLights = [];
  var emergencyLight = null;
  var emergencyLightIntensity = 1;
  var emergencyLightDirection = 1;

  var init = function(sceneArg, cameraArg) {
    scene = sceneArg;
    camera = cameraArg;
    bunkerGroup = new THREE.Group();
    scene.add(bunkerGroup);

    var floorGeometry = new THREE.BoxGeometry(80, 0.5, 120);
    var floorMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.castShadow = true;
    floor.position.y = -2;
    bunkerGroup.add(floor);

    // Entrance corridor with reinforced concrete walls
    var wallThickness = 1.5;
    var corridorLength = 30;
    var corridorWidth = 12;
    var corridorHeight = 8;

    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });

    // Left wall
    var leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, corridorHeight, corridorLength), wallMaterial);
    leftWall.position.set(-corridorWidth / 2 - wallThickness / 2, corridorHeight / 2 - 2, -15);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    bunkerGroup.add(leftWall);

    // Right wall
    var rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, corridorHeight, corridorLength), wallMaterial);
    rightWall.position.set(corridorWidth / 2 + wallThickness / 2, corridorHeight / 2 - 2, -15);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    bunkerGroup.add(rightWall);

    // Blast door - massive steel
    var doorMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
    var doorGeometry = new THREE.BoxGeometry(10, 10, 0.8);
    var blastDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    blastDoor.position.set(0, 3, -35);
    blastDoor.castShadow = true;
    blastDoor.receiveShadow = true;
    bunkerGroup.add(blastDoor);

    // Door handle accent
    var handleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
    var handleMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(4, 3, -34.5);
    handle.castShadow = true;
    bunkerGroup.add(handle);

    // Main listening room
    var listeningRoomWidth = 40;
    var listeningRoomDepth = 50;
    var listeningRoomHeight = 9;

    var listeningFloor = new THREE.Mesh(new THREE.BoxGeometry(listeningRoomWidth, 0.5, listeningRoomDepth), floorMaterial);
    listeningFloor.position.set(0, -2, 10);
    listeningFloor.receiveShadow = true;
    listeningFloor.castShadow = true;
    bunkerGroup.add(listeningFloor);

    // Angled ceiling for blast resistance
    var ceilingGeometry = new THREE.BoxGeometry(listeningRoomWidth, 1, listeningRoomDepth);
    var ceilingMaterial = new THREE.MeshPhongMaterial({ color: 0x5a5a5a });
    var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, listeningRoomHeight - 2, 10);
    ceiling.rotation.z = 0.08;
    ceiling.castShadow = true;
    ceiling.receiveShadow = true;
    bunkerGroup.add(ceiling);

    // Radio operator consoles - multiple stations with tuning dials
    var consoleSpacing = 15;
    var consoleCount = 3;

    for (var i = 0; i < consoleCount; i++) {
      var consoleX = -20 + i * consoleSpacing;
      createOperatorConsole(consoleX, -1, 15);
    }

    // Reel-to-reel tape recorders
    createTapeRecorder(-25, -1, 35);
    createTapeRecorder(-5, -1, 35);
    createTapeRecorder(15, -1, 35);

    // Cryptography machines with indicator lights
    createCryptoMachine(25, -1, 20);
    createCryptoMachine(25, -1, 0);
    createCryptoMachine(25, -1, -15);

    // SIGINT display boards with grid markings
    createDisplayBoard(-35, 2, 25);
    createDisplayBoard(-35, 2, 5);

    // Teletype machines
    createTeletype(28, -1, 30);
    createTeletype(28, -1, 10);

    // Overhead cable bundles - dense LineSegments
    createCableBundles();

    // Emergency power battery wall
    createBatteryWall(-30, 1, -20);

    // Generator room with diesel engine
    createGeneratorRoom(30, -1, -25);

    // Air filtration unit
    createFiltrationUnit(-10, 2, -30);

    // Duty officer desk with flag
    createDutyOfficerDesk(5, -1, -5);

    // Secure document safe
    createSecureSafe(-15, -1, -15);

    // Underground escape shaft
    createEscapeShaft(35, -1, 40);

    // Coffee/break room
    createBreakRoom(-20, -1, 45);

    // Ambient lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    bunkerGroup.add(ambientLight);

    // Emergency beacon light
    var emergencyGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var emergencyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    emergencyLight = new THREE.Mesh(emergencyGeometry, emergencyMaterial);
    emergencyLight.position.set(-35, 7, 45);
    emergencyLight.castShadow = true;
    bunkerGroup.add(emergencyLight);

    // Point light from emergency beacon
    var emergencyPointLight = new THREE.PointLight(0xff0000, 0.5, 30);
    emergencyPointLight.position.copy(emergencyLight.position);
    bunkerGroup.add(emergencyPointLight);
  };

  var createOperatorConsole = function(x, y, z) {
    var mainBoxGeometry = new THREE.BoxGeometry(8, 5, 3);
    var consoleMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var mainBox = new THREE.Mesh(mainBoxGeometry, consoleMaterial);
    mainBox.position.set(x, y + 2.5, z);
    mainBox.castShadow = true;
    mainBox.receiveShadow = true;
    bunkerGroup.add(mainBox);

    // Tuning dials
    for (var i = 0; i < 4; i++) {
      var dialGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 32);
      var dialMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      var dial = new THREE.Mesh(dialGeometry, dialMaterial);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(x - 3 + i * 2, y + 4.5, z);
      dial.castShadow = true;
      bunkerGroup.add(dial);

      dialSweeps.push({
        mesh: dial,
        angle: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.5
      });
    }

    // Indicator light
    var lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    var lightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    var indicatorLight = new THREE.Mesh(lightGeometry, lightMaterial);
    indicatorLight.position.set(x + 3, y + 4, z);
    bunkerGroup.add(indicatorLight);

    indicatorLights.push({
      mesh: indicatorLight,
      state: 0,
      stateTime: 0,
      baseColor: new THREE.Color(0x00ff00)
    });
  };

  var createTapeRecorder = function(x, y, z) {
    var mainGeometry = new THREE.BoxGeometry(6, 4, 5);
    var tapeColor = 0x3a3a3a;
    var tapeMaterial = new THREE.MeshPhongMaterial({ color: tapeColor });
    var main = new THREE.Mesh(mainGeometry, tapeMaterial);
    main.position.set(x, y + 2, z);
    main.castShadow = true;
    main.receiveShadow = true;
    bunkerGroup.add(main);

    // Left reel
    var reelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
    var reelMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var leftReel = new THREE.Mesh(reelGeometry, reelMaterial);
    leftReel.rotation.z = Math.PI / 2;
    leftReel.position.set(x - 2, y + 2, z);
    leftReel.castShadow = true;
    bunkerGroup.add(leftReel);

    reelRotations.push({ mesh: leftReel, speed: 2.5 });

    // Right reel
    var rightReel = new THREE.Mesh(reelGeometry, reelMaterial);
    rightReel.rotation.z = Math.PI / 2;
    rightReel.position.set(x + 2, y + 2, z);
    rightReel.castShadow = true;
    bunkerGroup.add(rightReel);

    reelRotations.push({ mesh: rightReel, speed: 2.5 });

    // Tape counter window
    var counterGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.2);
    var counterMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    var counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.set(x, y + 2.5, z + 2.5);
    counter.castShadow = true;
    bunkerGroup.add(counter);
  };

  var createCryptoMachine = function(x, y, z) {
    var bodyGeometry = new THREE.BoxGeometry(4, 6, 3);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 3, z);
    body.castShadow = true;
    body.receiveShadow = true;
    bunkerGroup.add(body);

    // Rotor drums
    var rotorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 16);
    var rotorMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });

    for (var i = 0; i < 3; i++) {
      var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
      rotor.rotation.z = Math.PI / 2;
      rotor.position.set(x - 1.2 + i * 1.2, y + 4.5, z);
      rotor.castShadow = true;
      bunkerGroup.add(rotor);
    }

    // Indicator lights array
    for (var j = 0; j < 6; j++) {
      var lightGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      var lightMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(x - 1.5 + (j % 3) * 1.5, y + 5.5 + Math.floor(j / 3) * 0.8, z);
      bunkerGroup.add(light);

      indicatorLights.push({
        mesh: light,
        state: j,
        stateTime: 0,
        baseColor: new THREE.Color(0xff6600)
      });
    }
  };

  var createDisplayBoard = function(x, y, z) {
    var panelGeometry = new THREE.BoxGeometry(10, 8, 0.5);
    var panelMaterial = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(x, y + 4, z);
    panel.castShadow = true;
    panel.receiveShadow = true;
    bunkerGroup.add(panel);

    // Grid lines with LineSegments
    var gridGeometry = new THREE.BufferGeometry();
    var positions = [];
    var gridSize = 9;
    var gridSpacing = 0.8;

    // Vertical lines
    for (var i = 0; i <= gridSize; i++) {
      var xPos = -4.5 + i * gridSpacing;
      positions.push(xPos, 0, 0);
      positions.push(xPos, 8, 0);
    }

    // Horizontal lines
    for (var j = 0; j <= gridSize; j++) {
      var yPos = j * gridSpacing;
      positions.push(-4.5, yPos, 0);
      positions.push(4.5, yPos, 0);
    }

    gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var gridMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });
    var gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    gridLines.position.copy(panel.position);
    gridLines.position.z += 0.3;
    bunkerGroup.add(gridLines);
  };

  var createTeletype = function(x, y, z) {
    var bodyGeometry = new THREE.BoxGeometry(3, 3, 4);
    var bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(x, y + 1.5, z);
    body.castShadow = true;
    body.receiveShadow = true;
    bunkerGroup.add(body);

    // Paper feed roller
    var rollerGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 16);
    var rollerMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(x, y + 2, z);
    roller.castShadow = true;
    bunkerGroup.add(roller);

    // Keyboard area
    var keyboardGeometry = new THREE.BoxGeometry(2.5, 0.3, 1.5);
    var keyboardMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(x, y + 2.8, z + 1.5);
    keyboard.castShadow = true;
    bunkerGroup.add(keyboard);
  };

  var createCableBundles = function() {
    var bundleGeometry = new THREE.BufferGeometry();
    var positions = [];

    // Create multiple cable runs overhead
    for (var run = 0; run < 5; run++) {
      var startX = -40 + run * 20;
      var endX = -40 + run * 20;

      for (var i = 0; i < 15; i++) {
        var zStart = -40 + i * 6;
        var zEnd = -40 + (i + 1) * 6;

        positions.push(startX, 8, zStart);
        positions.push(endX, 8, zEnd);

        // Drooping cable curve approximation
        positions.push(startX + 2, 7.5, zStart);
        positions.push(startX + 2, 7.5, zEnd);
      }
    }

    bundleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var cables = new THREE.LineSegments(bundleGeometry, cableMaterial);
    bunkerGroup.add(cables);
  };

  var createBatteryWall = function(x, y, z) {
    var wallGeometry = new THREE.BoxGeometry(3, 6, 8);
    var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y + 3, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    bunkerGroup.add(wall);

    // Battery cells
    var cellMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 5; j++) {
        var cellGeometry = new THREE.BoxGeometry(0.6, 0.8, 1.2);
        var cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.set(x - 0.8 + i * 0.9, y + 1 + j * 1, z - 3 + i * 2);
        cell.castShadow = true;
        bunkerGroup.add(cell);
      }
    }
  };

  var createGeneratorRoom = function(x, y, z) {
    var roomGeometry = new THREE.BoxGeometry(12, 7, 10);
    var roomMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.set(x, y + 3.5, z);
    room.castShadow = true;
    room.receiveShadow = true;
    bunkerGroup.add(room);

    // Diesel engine - large cylinder
    var engineGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 32);
    var engineMaterial = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
    var engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(x, y + 3, z);
    engine.castShadow = true;
    bunkerGroup.add(engine);

    // Engine exhaust pipe
    var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 16);
    var pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.rotation.z = Math.PI / 3;
    pipe.position.set(x + 2, y + 6, z);
    pipe.castShadow = true;
    bunkerGroup.add(pipe);
  };

  var createFiltrationUnit = function(x, y, z) {
    var unitGeometry = new THREE.BoxGeometry(6, 8, 4);
    var unitMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var unit = new THREE.Mesh(unitGeometry, unitMaterial);
    unit.position.set(x, y + 4, z);
    unit.castShadow = true;
    unit.receiveShadow = true;
    bunkerGroup.add(unit);

    // Filter cylinders
    var filterGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
    var filterMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });

    for (var i = 0; i < 3; i++) {
      var filter = new THREE.Mesh(filterGeometry, filterMaterial);
      filter.position.set(x - 1.5 + i * 1.5, y + 4, z);
      filter.castShadow = true;
      bunkerGroup.add(filter);
    }

    // Air intake duct
    var ductGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 16);
    var ductMaterial = new THREE.MeshPhongMaterial({ color: 0x5a5a5a });
    var duct = new THREE.Mesh(ductGeometry, ductMaterial);
    duct.rotation.z = Math.PI / 2;
    duct.position.set(x, y + 4, z - 5);
    duct.castShadow = true;
    bunkerGroup.add(duct);
  };

  var createDutyOfficerDesk = function(x, y, z) {
    var deskGeometry = new THREE.BoxGeometry(6, 0.8, 4);
    var deskMaterial = new THREE.MeshPhongMaterial({ color: 0x5a3a1a });
    var desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x, y + 1.5, z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    bunkerGroup.add(desk);

    // Desk legs
    var legGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
    var legMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });

    for (var i = 0; i < 4; i++) {
      var leg = new THREE.Mesh(legGeometry, legMaterial);
      var legX = x - 2.5 + (i % 2) * 5;
      var legZ = z - 1.5 + Math.floor(i / 2) * 3;
      leg.position.set(legX, y + 0.75, legZ);
      leg.castShadow = true;
      bunkerGroup.add(leg);
    }

    // Flag pole and flag
    var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
    var poleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
    var pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x + 2.5, y + 2.5, z - 1.5);
    pole.castShadow = true;
    bunkerGroup.add(pole);

    // Flag
    var flagGeometry = new THREE.BoxGeometry(1.5, 1, 0.1);
    var flagMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(x + 3.5, y + 2.5, z - 1.5);
    flag.castShadow = true;
    bunkerGroup.add(flag);
  };

  var createSecureSafe = function(x, y, z) {
    var safeGeometry = new THREE.BoxGeometry(2, 3, 2);
    var safeMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.3 });
    var safe = new THREE.Mesh(safeGeometry, safeMaterial);
    safe.position.set(x, y + 1.5, z);
    safe.castShadow = true;
    safe.receiveShadow = true;
    bunkerGroup.add(safe);

    // Combination lock dial
    var dialGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    var dialMaterial = new THREE.MeshPhongMaterial({ color: 0x8a8a8a });
    var dial = new THREE.Mesh(dialGeometry, dialMaterial);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(x, y + 1.5, z + 1.05);
    dial.castShadow = true;
    bunkerGroup.add(dial);

    // Door handle
    var handleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
    var handleMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    var handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(x + 1.1, y + 0.8, z);
    handle.castShadow = true;
    bunkerGroup.add(handle);
  };

  var createEscapeShaft = function(x, y, z) {
    var shaftGeometry = new THREE.BoxGeometry(3, 15, 3);
    var shaftMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a3a });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set(x, y + 7.5, z);
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    bunkerGroup.add(shaft);

    // Ladder rungs with LineSegments
    var ladderGeometry = new THREE.BufferGeometry();
    var positions = [];

    for (var i = 0; i < 20; i++) {
      var yPos = y + i * 0.7;
      // Left rail
      positions.push(x - 1.2, yPos, z - 1.2);
      positions.push(x - 1.2, yPos, z + 1.2);
      // Right rail
      positions.push(x + 1.2, yPos, z - 1.2);
      positions.push(x + 1.2, yPos, z + 1.2);
      // Rungs
      positions.push(x - 1.2, yPos, z - 1.2);
      positions.push(x + 1.2, yPos, z - 1.2);
      positions.push(x - 1.2, yPos, z + 1.2);
      positions.push(x + 1.2, yPos, z + 1.2);
    }

    ladderGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    var ladderMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
    var ladder = new THREE.LineSegments(ladderGeometry, ladderMaterial);
    bunkerGroup.add(ladder);
  };

  var createBreakRoom = function(x, y, z) {
    var roomGeometry = new THREE.BoxGeometry(8, 6, 6);
    var roomMaterial = new THREE.MeshPhongMaterial({ color: 0x3a3a2a });
    var room = new THREE.Mesh(roomGeometry, roomMaterial);
    room.position.set(x, y + 3, z);
    room.castShadow = true;
    room.receiveShadow = true;
    bunkerGroup.add(room);

    // Table
    var tableTopGeometry = new THREE.BoxGeometry(4, 0.5, 3);
    var tableTopMaterial = new THREE.MeshPhongMaterial({ color: 0x5a4a3a });
    var tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.set(x, y + 1.5, z);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    bunkerGroup.add(tableTop);

    // Coffee mugs
    for (var i = 0; i < 3; i++) {
      var mugGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16);
      var mugMaterial = new THREE.MeshPhongMaterial({ color: 0xcc9900 });
      var mug = new THREE.Mesh(mugGeometry, mugMaterial);
      mug.position.set(x - 1 + i * 1, y + 2.1, z);
      mug.castShadow = true;
      bunkerGroup.add(mug);
    }

    // Benches
    for (var j = 0; j < 2; j++) {
      var benchGeometry = new THREE.BoxGeometry(4, 0.4, 0.8);
      var benchMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3a2a });
      var bench = new THREE.Mesh(benchGeometry, benchMaterial);
      bench.position.set(x, y + 0.5, z - 1.5 + j * 3);
      bench.castShadow = true;
      bunkerGroup.add(bench);
    }
  };

  var update = function(delta) {
    // Tape reel rotation
    for (var i = 0; i < reelRotations.length; i++) {
      reelRotations[i].mesh.rotation.z += reelRotations[i].speed * delta;
    }

    // Dial sweep animation
    for (var j = 0; j < dialSweeps.length; j++) {
      dialSweeps[j].angle += dialSweeps[j].speed * delta;
      if (dialSweeps[j].angle > Math.PI * 2) {
        dialSweeps[j].angle -= Math.PI * 2;
      }
      dialSweeps[j].mesh.rotation.z = dialSweeps[j].angle;
    }

    // Indicator lights cycle through states
    for (var k = 0; k < indicatorLights.length; k++) {
      indicatorLights[k].stateTime += delta;

      if (indicatorLights[k].stateTime > 0.3) {
        indicatorLights[k].state = (indicatorLights[k].state + 1) % 3;
        indicatorLights[k].stateTime = 0;

        var color;
        if (indicatorLights[k].state === 0) {
          color = new THREE.Color(indicatorLights[k].baseColor);
        } else if (indicatorLights[k].state === 1) {
          color = new THREE.Color(0x000000);
        } else {
          color = new THREE.Color(indicatorLights[k].baseColor).multiplyScalar(0.5);
        }

        indicatorLights[k].mesh.material.color.copy(color);
      }
    }

    // Emergency light strobe
    emergencyLightIntensity += emergencyLightDirection * delta * 3;
    if (emergencyLightIntensity > 1) {
      emergencyLightIntensity = 1;
      emergencyLightDirection = -1;
    } else if (emergencyLightIntensity < 0.2) {
      emergencyLightIntensity = 0.2;
      emergencyLightDirection = 1;
    }
    emergencyLight.material.color.setHSL(0, 1, emergencyLightIntensity * 0.5);
  };

  var reset = function() {
    reelRotations = [];
    dialSweeps = [];
    indicatorLights = [];
    emergencyLightIntensity = 1;
    emergencyLightDirection = 1;

    if (bunkerGroup && scene) {
      scene.remove(bunkerGroup);
      bunkerGroup = null;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
