window.CourtroomSiege = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var allObjects = [];
  var gameState = {
    hostagesRemaining: 12,
    terroristsDown: 0,
    terroristsTotal: 8,
    keyWitnessProtected: false,
    time: 300,
    maxTime: 300
  };

  var keybindState = {
    cPressed: false,
    cTime: 0,
    rPressed: false,
    hudVisible: true
  };

  var entities = {
    terrorists: [],
    hostages: [],
    flags: [],
    timers: []
  };

  var hudElement = null;

  function createMaterial(color, emissive) {
    emissive = emissive || 0x000000;
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      metalness: 0.2,
      roughness: 0.8
    });
  }

  function addObject(obj) {
    allObjects.push(obj);
    scene.add(obj);
    return obj;
  }

  function createJudgeBench() {
    var benchGroup = new THREE.Group();

    var benchBase = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.2, 1.5),
      createMaterial(0x3d2817)
    );
    benchBase.position.set(0, 2.5, -8);
    benchBase.castShadow = true;
    benchBase.receiveShadow = true;
    benchGroup.add(benchBase);

    var benchBack = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 1.5, 0.3),
      createMaterial(0x2a1810)
    );
    benchBack.position.set(0, 3.4, -7.7);
    benchBack.castShadow = true;
    benchGroup.add(benchBack);

    return addObject(benchGroup);
  }

  function createJuryBox() {
    var juryGroup = new THREE.Group();

    var rows = 3;
    var cols = 4;
    var seatWidth = 0.6;
    var seatHeight = 0.7;
    var rowSpacing = 1.2;
    var colSpacing = 1.0;

    var startX = -1.5;
    var startZ = -2;
    var startY = 0.5;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var seat = new THREE.Mesh(
          new THREE.BoxGeometry(seatWidth, seatHeight, seatWidth),
          createMaterial(0x4a3728)
        );
        seat.position.set(
          startX + c * colSpacing,
          startY + r * rowSpacing,
          startZ
        );
        seat.castShadow = true;
        seat.receiveShadow = true;
        juryGroup.add(seat);
      }
    }

    return addObject(juryGroup);
  }

  function createWitnessStand() {
    var witnessGroup = new THREE.Group();

    var podium = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 1.0),
      createMaterial(0x5a4a3a)
    );
    podium.position.set(3, 0.75, -8);
    podium.castShadow = true;
    podium.receiveShadow = true;
    witnessGroup.add(podium);

    var barrier = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.0, 0.15),
      createMaterial(0x3a2a1a)
    );
    barrier.position.set(3, 0.5, -6.8);
    barrier.castShadow = true;
    witnessGroup.add(barrier);

    return addObject(witnessGroup);
  }

  function createGallerySeating() {
    var galleryGroup = new THREE.Group();

    var rows = 4;
    var cols = 6;
    var seatWidth = 0.5;
    var seatHeight = 0.6;
    var rowSpacing = 1.1;
    var colSpacing = 0.8;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var seat = new THREE.Mesh(
          new THREE.BoxGeometry(seatWidth, seatHeight, seatWidth),
          createMaterial(0x4a3a2a)
        );
        seat.position.set(
          -2.5 + c * colSpacing,
          0.3 + r * rowSpacing,
          2 + r * 0.3
        );
        seat.castShadow = true;
        seat.receiveShadow = true;
        galleryGroup.add(seat);
      }
    }

    return addObject(galleryGroup);
  }

  function createFlagPole(x, z, flagColor) {
    var flagGroup = new THREE.Group();

    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3, 16),
      createMaterial(0x1a1a1a)
    );
    pole.position.set(x, 1.5, z);
    pole.castShadow = true;
    pole.receiveShadow = true;
    flagGroup.add(pole);

    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.05),
      createMaterial(flagColor)
    );
    flag.position.set(x + 0.7, 2.8, z);
    flag.castShadow = true;
    flag.receiveShadow = true;
    flagGroup.add(flag);

    flagGroup.flagElement = flag;
    flagGroup.waveTime = Math.random() * Math.PI * 2;
    entities.flags.push(flagGroup);

    return addObject(flagGroup);
  }

  function createEvidenceTable() {
    var tableGroup = new THREE.Group();

    var tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.8, 1.5),
      createMaterial(0x4a3a2a)
    );
    tableTop.position.set(-3, 0.8, -4);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    var timerDisplay = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.3),
      createMaterial(0x222222, 0xff0000)
    );
    timerDisplay.position.set(-3, 1.8, -4);
    timerDisplay.castShadow = true;
    timerDisplay.receiveShadow = true;
    tableGroup.add(timerDisplay);
    timerDisplay.userData.isTimer = true;
    entities.timers.push(timerDisplay);

    var exhibit1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.4),
      createMaterial(0x6a5a4a)
    );
    exhibit1.position.set(-2.5, 1.1, -3.5);
    exhibit1.castShadow = true;
    tableGroup.add(exhibit1);

    var exhibit2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.4),
      createMaterial(0x7a6a5a)
    );
    exhibit2.position.set(-3.5, 1.1, -4.5);
    exhibit2.castShadow = true;
    tableGroup.add(exhibit2);

    return addObject(tableGroup);
  }

  function createSecurityDoors() {
    var doorsGroup = new THREE.Group();

    var door1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.5, 0.2),
      createMaterial(0x2a2a2a)
    );
    door1.position.set(-6, 1.25, 5);
    door1.castShadow = true;
    door1.receiveShadow = true;
    doorsGroup.add(door1);

    var door2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.5, 0.2),
      createMaterial(0x2a2a2a)
    );
    door2.position.set(6, 1.25, 5);
    door2.castShadow = true;
    door2.receiveShadow = true;
    doorsGroup.add(door2);

    return addObject(doorsGroup);
  }

  function createTerrorist(x, z) {
    var terroristGroup = new THREE.Group();

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.3, 0.3),
      createMaterial(0x1a1a1a)
    );
    body.position.set(x, 0.65, z);
    body.castShadow = true;
    body.receiveShadow = true;
    terroristGroup.add(body);

    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      createMaterial(0x0a0a0a)
    );
    head.position.set(x, 1.5, z);
    head.castShadow = true;
    terroristGroup.add(head);

    var legs = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.8, 0.25),
      createMaterial(0x151515)
    );
    legs.position.set(x, 0.15, z);
    legs.castShadow = true;
    terroristGroup.add(legs);

    terroristGroup.position.set(x, 0, z);
    terroristGroup.pathIndex = 0;
    terroristGroup.patrolSpeed = 0.5 + Math.random() * 0.3;
    terroristGroup.patrolTime = 0;
    entities.terrorists.push(terroristGroup);

    return addObject(terroristGroup);
  }

  function createHostage(x, z) {
    var hostageGroup = new THREE.Group();

    var body = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.9, 0.3),
      createMaterial(0x8a7a6a)
    );
    body.position.set(x, 0.45, z);
    body.castShadow = true;
    body.receiveShadow = true;
    hostageGroup.add(body);

    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      createMaterial(0xa89080)
    );
    head.position.set(x, 0.95, z);
    head.castShadow = true;
    hostageGroup.add(head);

    hostageGroup.position.set(x, 0, z);
    entities.hostages.push(hostageGroup);

    return addObject(hostageGroup);
  }

  function createWalls() {
    var walls = new THREE.Group();

    var leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4, 15),
      createMaterial(0x3d3d3d)
    );
    leftWall.position.set(-7, 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    walls.add(leftWall);

    var rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 4, 15),
      createMaterial(0x3d3d3d)
    );
    rightWall.position.set(7, 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    walls.add(rightWall);

    var backWall = new THREE.Mesh(
      new THREE.BoxGeometry(14.3, 4, 0.3),
      createMaterial(0x3d3d3d)
    );
    backWall.position.set(0, 2, -10);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    walls.add(backWall);

    var floor = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.2, 15),
      createMaterial(0x2a2a2a)
    );
    floor.position.set(0, -0.1, 0);
    floor.receiveShadow = true;
    walls.add(floor);

    return addObject(walls);
  }

  function updateFlags(delta) {
    for (var i = 0; i < entities.flags.length; i++) {
      var flagGroup = entities.flags[i];
      var flag = flagGroup.flagElement;
      flagGroup.waveTime += delta * 1.5;

      var waveAmount = Math.sin(flagGroup.waveTime) * 0.15;
      flag.rotation.z = waveAmount;
    }
  }

  function updateTerrorists(delta) {
    var patrolPaths = [
      { x: -2, z: 2 },
      { x: 2, z: 2 },
      { x: -2, z: -3 },
      { x: 2, z: -3 },
      { x: 0, z: 0 }
    ];

    for (var i = 0; i < entities.terrorists.length; i++) {
      var terrorist = entities.terrorists[i];
      terrorist.patrolTime += delta;

      var currentPath = patrolPaths[terrorist.pathIndex % patrolPaths.length];
      var dx = currentPath.x - terrorist.position.x;
      var dz = currentPath.z - terrorist.position.z;
      var dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.2) {
        terrorist.pathIndex++;
      } else if (dist > 0.01) {
        var moveSpeed = terrorist.patrolSpeed * delta;
        terrorist.position.x += (dx / dist) * moveSpeed;
        terrorist.position.z += (dz / dist) * moveSpeed;
      }
    }
  }

  function updateTimers(delta) {
    gameState.time = Math.max(0, gameState.time - delta);

    for (var i = 0; i < entities.timers.length; i++) {
      var timer = entities.timers[i];
      var ratio = gameState.time / gameState.maxTime;

      var emissiveColor;
      if (ratio > 0.5) {
        emissiveColor = 0x00ff00;
      } else if (ratio > 0.25) {
        emissiveColor = 0xffff00;
      } else {
        emissiveColor = 0xff0000;
      }

      timer.material.emissive.setHex(emissiveColor);
    }
  }

  function setupHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'courtroom-hud';
    hudElement.style.cssText = 'position: fixed; top: 10px; left: 10px; color: #00ff00; font-family: monospace; font-size: 14px; z-index: 1000; text-shadow: 0 0 5px #00ff00; pointer-events: none;';

    hudElement.innerHTML = '<div style="margin-bottom: 5px;">HOSTAGES: ' + gameState.hostagesRemaining + ' REMAINING</div>' +
                           '<div style="margin-bottom: 5px;">TERRORISTS DOWN: ' + gameState.terroristsDown + '/' + gameState.terroristsTotal + '</div>' +
                           '<div style="margin-bottom: 5px;">KEY WITNESS: ' + (gameState.keyWitnessProtected ? 'PROTECTED YES' : 'PROTECTED NO') + '</div>' +
                           '<div style="margin-bottom: 5px;">TIME: ' + Math.ceil(gameState.time) + 's</div>' +
                           '<div style="color: #ffff00; font-size: 12px;">Press C+R to toggle HUD</div>';

    if (keybindState.hudVisible) {
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }

    document.body.appendChild(hudElement);
  }

  function handleKeyDown(event) {
    if (event.key.toLowerCase() === 'c') {
      keybindState.cPressed = true;
      keybindState.cTime = Date.now();
    }
    if (event.key.toLowerCase() === 'r' && keybindState.cPressed) {
      var timeDiff = Date.now() - keybindState.cTime;
      if (timeDiff < 400) {
        keybindState.hudVisible = !keybindState.hudVisible;
        if (hudElement) {
          hudElement.style.display = keybindState.hudVisible ? 'block' : 'none';
        }
      }
      keybindState.cPressed = false;
    }
    if (event.key.toLowerCase() !== 'c') {
      if (Date.now() - keybindState.cTime > 400) {
        keybindState.cPressed = false;
      }
    }
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.FogExp2(0x2a2010, 0.15);

    var light = new THREE.DirectionalLight(0xffd9a3, 1.2);
    light.position.set(5, 6, 5);
    light.castShadow = true;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    scene.add(light);

    var ambientLight = new THREE.AmbientLight(0x8a7050, 0.6);
    scene.add(ambientLight);

    createWalls();
    createJudgeBench();
    createJuryBox();
    createWitnessStand();
    createGallerySeating();
    createFlagPole(-5.5, -8, 0xff0000);
    createFlagPole(5.5, -8, 0x0066cc);
    createEvidenceTable();
    createSecurityDoors();

    for (var i = 0; i < 8; i++) {
      var angle = (i / 8) * Math.PI * 2;
      var x = Math.cos(angle) * 3;
      var z = Math.sin(angle) * 3;
      createTerrorist(x, z);
    }

    for (var h = 0; h < 12; h++) {
      var hAngle = (h / 12) * Math.PI * 2;
      var hx = Math.cos(hAngle) * 4.5;
      var hz = Math.sin(hAngle) * 4.5;
      createHostage(hx, hz);
    }

    setupHUD();
    document.addEventListener('keydown', handleKeyDown);
  }

  function update(delta) {
    updateFlags(delta);
    updateTerrorists(delta);
    updateTimers(delta);
  }

  function reset() {
    for (var i = 0; i < allObjects.length; i++) {
      scene.remove(allObjects[i]);
    }
    allObjects = [];
    entities.terrorists = [];
    entities.hostages = [];
    entities.flags = [];
    entities.timers = [];

    gameState.hostagesRemaining = 12;
    gameState.terroristsDown = 0;
    gameState.time = 300;
    gameState.keyWitnessProtected = false;

    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }

    document.removeEventListener('keydown', handleKeyDown);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
