window.CityHall = (function() {
  'use strict';

  var sceneObjects = [];
  var scene = null;
  var camera = null;
  var gameState = {
    bombsDefused: 0,
    hostagesFreed: 0,
    terroristsDown: 0,
    bombTimers: [180, 240, 200],
    keySequence: [],
    lastKeyTime: 0,
    hudVisible: true,
    timer: 0
  };

  var keyCodes = {
    C: 67,
    H: 72
  };

  var materials = {
    marble: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3, metalness: 0.1 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7, metalness: 0 }),
    red: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 0.3 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.8 }),
    black: new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.9, metalness: 0.2 }),
    terrorist: new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.6, metalness: 0 })
  };

  function addMesh(geometry, material, position, rotation, scale) {
    var mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.copy(position);
    if (rotation) mesh.rotation.copy(rotation);
    if (scale) mesh.scale.copy(scale);
    scene.add(mesh);
    sceneObjects.push(mesh);
    return mesh;
  }

  function createCityHallExterior() {
    // Main neoclassical building: large box with cylinder columns
    var buildingGeo = new THREE.BoxGeometry(40, 30, 25);
    addMesh(buildingGeo, materials.marble, new THREE.Vector3(0, 15, 0));

    // Portico: 4 cylinder columns
    var columnGeo = new THREE.CylinderGeometry(1.5, 1.5, 25, 16);
    addMesh(columnGeo, materials.marble, new THREE.Vector3(-12, 12.5, -12));
    addMesh(columnGeo, materials.marble, new THREE.Vector3(12, 12.5, -12));
    addMesh(columnGeo, materials.marble, new THREE.Vector3(-12, 12.5, -10));
    addMesh(columnGeo, materials.marble, new THREE.Vector3(12, 12.5, -10));

    // Municipal flag poles: 3 cylinders with box flags
    var poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 20, 8);
    var pole1 = addMesh(poleGeo, materials.steel, new THREE.Vector3(-15, 10, -13));
    var pole2 = addMesh(poleGeo, materials.steel, new THREE.Vector3(0, 10, -13));
    var pole3 = addMesh(poleGeo, materials.steel, new THREE.Vector3(15, 10, -13));

    // Flags: box shapes at top of poles
    var flagGeo = new THREE.BoxGeometry(3, 2, 0.3);
    var flag1 = addMesh(flagGeo, materials.red, new THREE.Vector3(-15, 20, -13));
    var flag2 = addMesh(flagGeo, materials.red, new THREE.Vector3(0, 20, -13));
    var flag3 = addMesh(flagGeo, materials.red, new THREE.Vector3(15, 20, -13));
    flag1.name = 'flag1';
    flag2.name = 'flag2';
    flag3.name = 'flag3';
  }

  function createMainCouncilChamber() {
    // Large circular chamber: tall cylinder room
    var chamberGeo = new THREE.CylinderGeometry(12, 12, 15, 32);
    addMesh(chamberGeo, materials.marble, new THREE.Vector3(0, 7.5, 15));

    // Council desks: arranged in semi-circle as boxes
    for (var i = 0; i < 5; i++) {
      var angle = (Math.PI / 6) + (i * Math.PI / 6);
      var x = Math.cos(angle) * 8;
      var z = 15 + Math.sin(angle) * 8;
      var deskGeo = new THREE.BoxGeometry(2, 1, 3);
      addMesh(deskGeo, materials.wood, new THREE.Vector3(x, 1, z));

      // Council chairs: small boxes
      var chairGeo = new THREE.BoxGeometry(1, 1.5, 1);
      addMesh(chairGeo, materials.black, new THREE.Vector3(x, 2, z + 2));
    }

    // Overhead projector: box
    var projectorGeo = new THREE.BoxGeometry(1, 0.5, 1);
    var projector = addMesh(projectorGeo, materials.steel, new THREE.Vector3(0, 13, 18));
    projector.name = 'projector';
  }

  function createMayorsOffice() {
    // Wood-paneled box room
    var officeGeo = new THREE.BoxGeometry(10, 10, 12);
    addMesh(officeGeo, materials.wood, new THREE.Vector3(-18, 5, 8));

    // Mayor's large desk: oversized box
    var deskGeo = new THREE.BoxGeometry(6, 1.5, 3);
    addMesh(deskGeo, materials.wood, new THREE.Vector3(-18, 1.5, 8));

    // Mayor's chair: box
    var chairGeo = new THREE.BoxGeometry(1, 1.5, 1);
    var mayorChair = addMesh(chairGeo, materials.black, new THREE.Vector3(-18, 2, 6));
    mayorChair.name = 'mayorChair';

    // Terrorist group leader at desk: tall box figure
    var leaderGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
    var leader = addMesh(leaderGeo, materials.terrorist, new THREE.Vector3(-18, 3, 10));
    leader.name = 'groupLeader';
  }

  function createPublicLobby() {
    // Tall box atrium
    var lobbyGeo = new THREE.BoxGeometry(25, 25, 15);
    addMesh(lobbyGeo, materials.marble, new THREE.Vector3(5, 12.5, -15));

    // Reception desk: large cylinder
    var deskGeo = new THREE.CylinderGeometry(3, 3, 1.5, 16);
    addMesh(deskGeo, materials.wood, new THREE.Vector3(5, 1, -15));
  }

  function createStaircase() {
    // Stepped staircase: multiple boxes going up
    for (var i = 0; i < 8; i++) {
      var stepGeo = new THREE.BoxGeometry(3, 1.5, 2);
      addMesh(stepGeo, materials.marble, new THREE.Vector3(10 + i * 0.5, 2 + i * 1.5, 0));
    }
  }

  function createBalcony() {
    // Elevated box railing overlooking lobby
    var railingGeo = new THREE.BoxGeometry(20, 1, 0.3);
    addMesh(railingGeo, materials.steel, new THREE.Vector3(5, 15, -5));

    // Support posts: cylinders
    var postGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
    addMesh(postGeo, materials.steel, new THREE.Vector3(-5, 8, -5));
    addMesh(postGeo, materials.steel, new THREE.Vector3(15, 8, -5));
  }

  function createElevatorShaft() {
    // Box housing
    var shaftGeo = new THREE.BoxGeometry(2.5, 20, 3);
    addMesh(shaftGeo, materials.steel, new THREE.Vector3(-20, 10, 10));
  }

  function createBreakRoom() {
    // Box room with table
    var tableGeo = new THREE.BoxGeometry(4, 1, 2.5);
    addMesh(tableGeo, materials.wood, new THREE.Vector3(20, 1, 5));

    // Coffee maker: cylinder
    var coffeeGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
    addMesh(coffeeGeo, materials.black, new THREE.Vector3(22, 1, 5));
  }

  function createServerRoom() {
    // Box racks with emissive effect
    for (var i = 0; i < 3; i++) {
      var rackGeo = new THREE.BoxGeometry(2, 8, 1.5);
      var rack = addMesh(rackGeo, materials.steel, new THREE.Vector3(22 + i * 3, 4, 18));
      rack.name = 'serverRack' + i;
    }

    // Emissive record storage: bright box
    var recordsGeo = new THREE.BoxGeometry(5, 6, 4);
    var recordsMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.4
    });
    var records = addMesh(recordsGeo, recordsMat, new THREE.Vector3(25, 3, 25));
    records.name = 'records';
  }

  function createBombDevice() {
    // Main box device body
    var deviceGeo = new THREE.BoxGeometry(2, 3, 2);
    var deviceMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.5,
      metalness: 0.6
    });
    var device = addMesh(deviceGeo, deviceMat, new THREE.Vector3(-5, 2, 20));
    device.name = 'bombDevice1';

    // Timer display: emissive red cylinder
    var timerGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    var timerMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.8
    });
    var timer = addMesh(timerGeo, timerMat, new THREE.Vector3(-5, 3.5, 20));
    timer.name = 'bombTimer1';

    // Second bomb
    var device2 = addMesh(deviceGeo, deviceMat, new THREE.Vector3(8, 2, 22));
    device2.name = 'bombDevice2';
    var timer2 = addMesh(timerGeo, timerMat, new THREE.Vector3(8, 3.5, 22));
    timer2.name = 'bombTimer2';

    // Third bomb
    var device3 = addMesh(deviceGeo, deviceMat, new THREE.Vector3(-8, 2, 25));
    device3.name = 'bombDevice3';
    var timer3 = addMesh(timerGeo, timerMat, new THREE.Vector3(-8, 3.5, 25));
    timer3.name = 'bombTimer3';
  }

  function createCCTVBank() {
    // Wall of small box screens
    for (var row = 0; row < 2; row++) {
      for (var col = 0; col < 4; col++) {
        var screenGeo = new THREE.BoxGeometry(1, 1, 0.3);
        var screenMat = new THREE.MeshStandardMaterial({
          color: 0x001100,
          emissive: 0x00ff00,
          emissiveIntensity: 0.3
        });
        var screen = addMesh(screenGeo, screenMat, new THREE.Vector3(-18 + col * 1.5, 15 + row * 1.5, 0.1));
        screen.name = 'camera' + (row * 4 + col);
      }
    }
  }

  function createPoliceBarrier() {
    // Box barricades outside
    for (var i = 0; i < 4; i++) {
      var barrierGeo = new THREE.BoxGeometry(2, 1.5, 0.5);
      addMesh(barrierGeo, materials.black, new THREE.Vector3(-15 + i * 5, 0.75, -18));
    }

    // Sphere warning lights
    var lightGeo = new THREE.SphereGeometry(0.4, 8, 8);
    for (var j = 0; j < 4; j++) {
      var light = addMesh(lightGeo, materials.red, new THREE.Vector3(-15 + j * 5, 2.5, -18));
      light.name = 'policeLight' + j;
    }
  }

  function createEmergencyGenerator() {
    // Box generator body
    var genGeo = new THREE.BoxGeometry(2, 3, 2.5);
    var gen = addMesh(genGeo, materials.steel, new THREE.Vector3(28, 1.5, 15));
    gen.name = 'generator';

    // Cylinder exhaust pipe
    var exhaustGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
    var exhaust = addMesh(exhaustGeo, materials.steel, new THREE.Vector3(28, 5, 15));
    exhaust.name = 'exhaust';
  }

  function createFireHoseCabinet() {
    // Box on wall
    var cabinetGeo = new THREE.BoxGeometry(1.5, 1.5, 0.5);
    var cabinet = addMesh(cabinetGeo, materials.red, new THREE.Vector3(-25, 2, 20));
    cabinet.name = 'fireCabinet';
  }

  function createTerrorists() {
    // Box figure: height 2, width 0.6, depth 0.6
    var terroristGeo = new THREE.BoxGeometry(0.6, 2, 0.6);

    // Terrorist 1: patrolling in lobby
    var t1 = addMesh(terroristGeo, materials.terrorist, new THREE.Vector3(3, 2, -12));
    t1.name = 'terrorist1';

    // Terrorist 2: in council chamber
    var t2 = addMesh(terroristGeo, materials.terrorist, new THREE.Vector3(-2, 2, 18));
    t2.name = 'terrorist2';

    // Terrorist 3: guarding server room
    var t3 = addMesh(terroristGeo, materials.terrorist, new THREE.Vector3(23, 2, 22));
    t3.name = 'terrorist3';

    // Bomb technician: near bomb device
    var bombTechGeo = new THREE.BoxGeometry(0.6, 2.2, 0.6);
    var bombTech = addMesh(bombTechGeo, materials.terrorist, new THREE.Vector3(-5, 2.2, 21));
    bombTech.name = 'bombTech';
  }

  function setupScene() {
    // Fog: marble white and wood brown atmosphere
    scene.fog = new THREE.FogExp2(0xccccbb, 0.08);
    scene.background = new THREE.Color(0xccccbb);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    sceneObjects.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 30, 20);
    scene.add(directionalLight);
    sceneObjects.push(directionalLight);

    // Emergency red area light near bombs
    var areaLight = new THREE.PointLight(0xff0000, 1, 50);
    areaLight.position.set(-5, 5, 20);
    scene.add(areaLight);
    sceneObjects.push(areaLight);

    // Create all objects
    createCityHallExterior();
    createMainCouncilChamber();
    createMayorsOffice();
    createPublicLobby();
    createStaircase();
    createBalcony();
    createElevatorShaft();
    createBreakRoom();
    createServerRoom();
    createBombDevice();
    createCCTVBank();
    createPoliceBarrier();
    createEmergencyGenerator();
    createFireHoseCabinet();
    createTerrorists();
  }

  function handleKeyPress(event) {
    var now = Date.now();

    // Check for C+H keybind (400ms window)
    if (event.keyCode === keyCodes.C) {
      gameState.keySequence = ['C'];
      gameState.lastKeyTime = now;
    } else if (event.keyCode === keyCodes.H && gameState.keySequence.length === 1 && gameState.keySequence[0] === 'C') {
      if (now - gameState.lastKeyTime < 400) {
        gameState.hudVisible = !gameState.hudVisible;
        showHUDNotification(gameState.hudVisible ? 'HUD ON' : 'HUD OFF');
      }
      gameState.keySequence = [];
    } else {
      if (now - gameState.lastKeyTime > 400) {
        gameState.keySequence = [];
      }
    }
  }

  function showHUDNotification(message) {
    var existing = document.getElementById('hud-notification');
    if (existing) existing.remove();

    var notification = document.createElement('div');
    notification.id = 'hud-notification';
    notification.style.position = 'fixed';
    notification.style.top = '50px';
    notification.style.right = '20px';
    notification.style.padding = '10px 15px';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    notification.style.color = '#00ff00';
    notification.style.fontFamily = 'monospace';
    notification.style.fontSize = '14px';
    notification.style.zIndex = '1000';
    notification.style.borderLeft = '3px solid #00ff00';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
      if (notification.parentNode) notification.parentNode.removeChild(notification);
    }, 2000);
  }

  function updateAnimations(delta) {
    gameState.timer += delta;

    // Animate flags: flutter
    for (var i = 1; i <= 3; i++) {
      var flag = scene.getObjectByName('flag' + i);
      if (flag) {
        flag.rotation.z = Math.sin(gameState.timer * 2) * 0.2;
      }
    }

    // Animate bomb timers: pulse emissive faster as timer counts down
    for (var j = 0; j < 3; j++) {
      var timer = scene.getObjectByName('bombTimer' + (j + 1));
      if (timer && gameState.bombTimers[j] > 0) {
        gameState.bombTimers[j] -= delta;
        var intensity = 0.4 + Math.sin(gameState.timer * 4 + j) * 0.4;
        timer.material.emissiveIntensity = intensity;

        if (gameState.bombTimers[j] <= 0) {
          gameState.bombsDefused++;
          gameState.bombTimers[j] = 0;
        }
      }
    }

    // Overhead projector flickers
    var projector = scene.getObjectByName('projector');
    if (projector) {
      projector.material.emissiveIntensity = Math.random() > 0.8 ? 0.3 : 0;
    }

    // Police lights flash red/blue
    for (var k = 0; k < 4; k++) {
      var light = scene.getObjectByName('policeLight' + k);
      if (light) {
        var phase = Math.sin(gameState.timer * 3 + k * Math.PI / 2);
        if (phase > 0) {
          light.material.color.setHex(0xff0000);
        } else {
          light.material.color.setHex(0x0000ff);
        }
      }
    }

    // Security cameras pan
    for (var c = 0; c < 8; c++) {
      var camera = scene.getObjectByName('camera' + c);
      if (camera) {
        camera.rotation.z = Math.sin(gameState.timer + c) * 0.3;
      }
    }

    // Emergency generator hums: subtle oscillation
    var gen = scene.getObjectByName('generator');
    if (gen) {
      gen.position.y = 1.5 + Math.sin(gameState.timer * 4) * 0.05;
    }

    // Exhaust pipe: subtle rotation
    var exhaust = scene.getObjectByName('exhaust');
    if (exhaust) {
      exhaust.rotation.z += delta * 0.3;
    }
  }

  function createHUD() {
    var hudContainer = document.createElement('div');
    hudContainer.id = 'game-hud';
    hudContainer.style.position = 'fixed';
    hudContainer.style.top = '20px';
    hudContainer.style.left = '20px';
    hudContainer.style.fontFamily = 'monospace';
    hudContainer.style.fontSize = '16px';
    hudContainer.style.color = '#00ff00';
    hudContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudContainer.style.padding = '15px';
    hudContainer.style.zIndex = '999';
    hudContainer.style.border = '2px solid #00ff00';
    hudContainer.style.minWidth = '250px';

    hudContainer.innerHTML =
      '<div>BOMBS DEFUSED: <span id="bombsCount">0</span>/3</div>' +
      '<div>HOSTAGES FREED: <span id="hostagesCount">0</span>/9</div>' +
      '<div>TERRORISTS DOWN: <span id="terroristsCount">0</span></div>' +
      '<div style="margin-top: 10px; font-size: 12px; color: #00aa00;">Press C+H to toggle HUD</div>';

    document.body.appendChild(hudContainer);
  }

  function updateHUD() {
    var bombsElem = document.getElementById('bombsCount');
    var hostagesElem = document.getElementById('hostagesCount');
    var terroristsElem = document.getElementById('terroristsCount');
    var hudContainer = document.getElementById('game-hud');

    if (bombsElem) bombsElem.textContent = gameState.bombsDefused;
    if (hostagesElem) hostagesElem.textContent = gameState.hostagesFreed;
    if (terroristsElem) terroristsElem.textContent = gameState.terroristsDown;
    if (hudContainer) {
      hudContainer.style.display = gameState.hudVisible ? 'block' : 'none';
    }
  }

  return {
    init: function(sceneRef, cameraRef) {
      scene = sceneRef;
      camera = cameraRef;
      sceneObjects = [];
      gameState = {
        bombsDefused: 0,
        hostagesFreed: 0,
        terroristsDown: 0,
        bombTimers: [180, 240, 200],
        keySequence: [],
        lastKeyTime: 0,
        hudVisible: true,
        timer: 0
      };

      setupScene();
      createHUD();
      document.addEventListener('keydown', handleKeyPress);
    },

    update: function(delta) {
      updateAnimations(delta);
      updateHUD();
    },

    reset: function() {
      sceneObjects.forEach(function(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(function(mat) { mat.dispose(); });
          } else {
            obj.material.dispose();
          }
        }
        scene.remove(obj);
      });
      sceneObjects = [];

      var hud = document.getElementById('game-hud');
      if (hud) hud.remove();

      document.removeEventListener('keydown', handleKeyPress);

      gameState = {
        bombsDefused: 0,
        hostagesFreed: 0,
        terroristsDown: 0,
        bombTimers: [180, 240, 200],
        keySequence: [],
        lastKeyTime: 0,
        hudVisible: true,
        timer: 0
      };
    }
  };
}());
