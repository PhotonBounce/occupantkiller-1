var window = window || {};

window.AircraftHangar = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var sceneObjects = [];
  var enemies = [];
  var hudElement = null;
  var gameState = {
    aircraftDisabled: 0,
    maxAircraft: 2,
    fuelLinesCut: 0,
    maxFuelLines: 3,
    baseAlarm: 'SILENT'
  };
  var hangarDoors = [];
  var gantryCrane = null;
  var fuelTanker = null;
  var elapsedTime = 0;
  var lastAKeyTime = 0;
  var lastHKeyTime = 0;
  var hudVisible = true;

  function createHangarBuilding() {
    // Main hangar structure - very tall and wide box
    var bodyGeometry = new THREE.BoxGeometry(60, 40, 80);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.7,
      metalness: 0.3
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 20, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    scene.add(body);
    sceneObjects.push(body);

    // Concrete floor
    var floorGeometry = new THREE.BoxGeometry(80, 1, 100);
    var floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9
    });
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    sceneObjects.push(floor);
  }

  function createStealthBomber() {
    var group = new THREE.Group();

    // Aircraft body - flat angular box
    var bodyGeometry = new THREE.BoxGeometry(3, 1.5, 12);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.8
    });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Swept wings - box wings
    var wingGeometry = new THREE.BoxGeometry(20, 0.5, 3);
    var wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f0f0f,
      roughness: 0.7,
      metalness: 0.9
    });
    var wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = 2;
    wings.castShadow = true;
    wings.receiveShadow = true;
    group.add(wings);

    // Cockpit (small box on top)
    var cockpitGeometry = new THREE.BoxGeometry(1.5, 0.8, 2);
    var cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5
    });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 3, 3);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    group.add(cockpit);

    // Landing gear (cylinder wheels)
    var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8
    });

    var wheelPositions = [
      [-2, 0.4, -2],
      [2, 0.4, -2],
      [0, 0.4, 4]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    });

    group.position.set(-15, 0.4, -20);
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createFuelTankerTruck() {
    var group = new THREE.Group();

    // Truck cab
    var cabGeometry = new THREE.BoxGeometry(3, 3, 4);
    var cabMaterial = new THREE.MeshStandardMaterial({
      color: 0xdd6633,
      roughness: 0.7
    });
    var cab = new THREE.Mesh(cabGeometry, cabMaterial);
    cab.position.set(0, 2, 0);
    cab.castShadow = true;
    cab.receiveShadow = true;
    group.add(cab);

    // Tank trailer (cylinder)
    var tankGeometry = new THREE.CylinderGeometry(2, 2, 8, 16);
    var tankMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.6,
      metalness: 0.5
    });
    var tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.position.set(0, 1.5, -6);
    tank.rotation.z = Math.PI / 2;
    tank.castShadow = true;
    tank.receiveShadow = true;
    group.add(tank);

    // Wheels
    var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
    var wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9
    });

    var wheelPositions = [
      [-1.5, 0.6, -1],
      [1.5, 0.6, -1],
      [-1.5, 0.6, -8],
      [1.5, 0.6, -8]
    ];

    wheelPositions.forEach(function(pos) {
      var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      group.add(wheel);
    });

    group.position.set(25, 0.4, 0);
    group.tankerData = { trackX: 25, speed: 0.8, maxX: 30, minX: 15 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createMaintenanceScaffold() {
    var group = new THREE.Group();

    // Frame structure around aircraft
    var frameVertical1Geometry = new THREE.BoxGeometry(0.5, 20, 0.5);
    var frameVertical2Geometry = new THREE.BoxGeometry(0.5, 20, 0.5);
    var frameHorizontalGeometry = new THREE.BoxGeometry(12, 0.5, 0.5);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.6
    });

    var vertical1 = new THREE.Mesh(frameVertical1Geometry, frameMaterial);
    vertical1.position.set(-5, 10, 0);
    vertical1.castShadow = true;
    vertical1.receiveShadow = true;
    group.add(vertical1);

    var vertical2 = new THREE.Mesh(frameVertical2Geometry, frameMaterial);
    vertical2.position.set(5, 10, 0);
    vertical2.castShadow = true;
    vertical2.receiveShadow = true;
    group.add(vertical2);

    var horizontal1 = new THREE.Mesh(frameHorizontalGeometry, frameMaterial);
    horizontal1.position.set(0, 5, 0);
    horizontal1.castShadow = true;
    horizontal1.receiveShadow = true;
    group.add(horizontal1);

    var horizontal2 = new THREE.Mesh(frameHorizontalGeometry, frameMaterial);
    horizontal2.position.set(0, 15, 0);
    horizontal2.castShadow = true;
    horizontal2.receiveShadow = true;
    group.add(horizontal2);

    group.position.set(-15, 0, -20);
    scene.add(group);
    sceneObjects.push(group);
  }

  function createHangarDoors() {
    var doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.7,
      metalness: 0.5
    });

    // Left door
    var leftDoorGeometry = new THREE.BoxGeometry(15, 35, 2);
    var leftDoor = new THREE.Mesh(leftDoorGeometry, doorMaterial);
    leftDoor.position.set(-20, 18, 38);
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    scene.add(leftDoor);
    sceneObjects.push(leftDoor);
    hangarDoors.push({ mesh: leftDoor, direction: -1, speed: 2, maxX: 5 });

    // Right door
    var rightDoorGeometry = new THREE.BoxGeometry(15, 35, 2);
    var rightDoor = new THREE.Mesh(rightDoorGeometry, doorMaterial);
    rightDoor.position.set(20, 18, 38);
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    scene.add(rightDoor);
    sceneObjects.push(rightDoor);
    hangarDoors.push({ mesh: rightDoor, direction: 1, speed: 2, maxX: -5 });
  }

  function createGantryCrane() {
    var group = new THREE.Group();

    // Crossbeam
    var beamGeometry = new THREE.BoxGeometry(50, 1.5, 1.5);
    var beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.7,
      metalness: 0.7
    });
    var beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 35;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    // Support columns (thin boxes)
    var columnGeometry = new THREE.BoxGeometry(1, 35, 1);
    var columnMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.5
    });

    var column1 = new THREE.Mesh(columnGeometry, columnMaterial);
    column1.position.set(-20, 17.5, 0);
    column1.castShadow = true;
    column1.receiveShadow = true;
    group.add(column1);

    var column2 = new THREE.Mesh(columnGeometry, columnMaterial);
    column2.position.set(20, 17.5, 0);
    column2.castShadow = true;
    column2.receiveShadow = true;
    group.add(column2);

    // Hoist (small box hanging from beam)
    var hoistGeometry = new THREE.BoxGeometry(2, 2, 2);
    var hoistMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.6
    });
    var hoist = new THREE.Mesh(hoistGeometry, hoistMaterial);
    hoist.position.set(0, 34, 0);
    hoist.castShadow = true;
    hoist.receiveShadow = true;
    group.add(hoist);

    group.position.z = 10;
    group.craneData = { trackZ: 10, speed: 1, maxZ: 25, minZ: -15 };
    scene.add(group);
    sceneObjects.push(group);
    return group;
  }

  function createToolCarts() {
    var toolCartGeometry = new THREE.BoxGeometry(2, 1.5, 3);
    var toolCartMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9900,
      roughness: 0.7
    });

    var wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    var wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8
    });

    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      var cart = new THREE.Mesh(toolCartGeometry, toolCartMaterial);
      cart.position.y = 0.9;
      cart.castShadow = true;
      cart.receiveShadow = true;
      group.add(cart);

      var wheelPositions = [
        [-0.8, 0.3, -0.8],
        [0.8, 0.3, -0.8],
        [-0.8, 0.3, 0.8],
        [0.8, 0.3, 0.8]
      ];

      wheelPositions.forEach(function(pos) {
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        group.add(wheel);
      });

      group.position.set(10 + i * 8, 0, -10 + i * 5);
      scene.add(group);
      sceneObjects.push(group);
    }
  }

  function createOrangeTechnicians() {
    var bodyGeometry = new THREE.BoxGeometry(1, 2, 0.6);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9900,
      roughness: 0.6
    });

    var headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      roughness: 0.5
    });

    for (var i = 0; i < 3; i++) {
      var group = new THREE.Group();

      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 2.3;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      group.position.set(5 + i * 10, 0, 15 + i * 8);
      group.technicianData = {
        position: group.position.clone(),
        animOffset: i * Math.PI / 3
      };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    }
  }

  function createArmedSecurityGuards() {
    var bodyGeometry = new THREE.BoxGeometry(0.8, 2, 0.5);
    var bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.7
    });

    var headGeometry = new THREE.SphereGeometry(0.35, 8, 8);
    var headMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc99,
      roughness: 0.5
    });

    var gunGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
    var gunMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
      metalness: 0.8
    });

    for (var i = 0; i < 2; i++) {
      var group = new THREE.Group();

      var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      var head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 2.25;
      head.castShadow = true;
      head.receiveShadow = true;
      group.add(head);

      var gun = new THREE.Mesh(gunGeometry, gunMaterial);
      gun.position.set(0.5, 1.5, 1);
      gun.castShadow = true;
      gun.receiveShadow = true;
      group.add(gun);

      group.position.set(-25 + i * 15, 0, 25);
      group.guardData = {
        position: group.position.clone(),
        patrolRange: 8
      };
      scene.add(group);
      sceneObjects.push(group);
      enemies.push(group);
    }
  }

  function updateHangarDoors(delta) {
    hangarDoors.forEach(function(doorData) {
      var door = doorData.mesh;
      var newX = door.position.x + doorData.direction * doorData.speed * delta;

      if (doorData.direction === -1) {
        if (newX >= doorData.maxX) {
          door.position.x = doorData.maxX;
        } else {
          door.position.x = newX;
        }
      } else {
        if (newX <= doorData.maxX) {
          door.position.x = doorData.maxX;
        } else {
          door.position.x = newX;
        }
      }
    });
  }

  function updateGantryCrane(delta) {
    if (!gantryCrane) return;

    var craneData = gantryCrane.craneData;
    var newZ = gantryCrane.position.z + craneData.speed * delta;

    if (newZ > craneData.maxZ) {
      craneData.speed = -craneData.speed;
      newZ = craneData.maxZ;
    } else if (newZ < craneData.minZ) {
      craneData.speed = -craneData.speed;
      newZ = craneData.minZ;
    }

    gantryCrane.position.z = newZ;
  }

  function updateFuelTanker(delta) {
    if (!fuelTanker) return;

    var tankerData = fuelTanker.tankerData;
    var newX = fuelTanker.position.x + tankerData.speed * delta;

    if (newX > tankerData.maxX) {
      tankerData.speed = -tankerData.speed;
      newX = tankerData.maxX;
    } else if (newX < tankerData.minX) {
      tankerData.speed = -tankerData.speed;
      newX = tankerData.minX;
    }

    fuelTanker.position.x = newX;
  }

  function updateEnemies(delta) {
    enemies.forEach(function(enemy) {
      if (enemy.technicianData) {
        var data = enemy.technicianData;
        var originalPos = data.position;
        enemy.position.x = originalPos.x + Math.sin(elapsedTime + data.animOffset) * 2;
        enemy.position.z = originalPos.z + Math.cos(elapsedTime + data.animOffset) * 1.5;
      } else if (enemy.guardData) {
        var gData = enemy.guardData;
        var originalPos = gData.position;
        var patrolPhase = Math.sin(elapsedTime * 0.5 + enemies.indexOf(enemy));
        enemy.position.x = originalPos.x + patrolPhase * gData.patrolRange;
      }
    });
  }

  function updateHUD() {
    if (!hudElement) return;

    var hudText = 'AIRCRAFT DISABLED: ' + gameState.aircraftDisabled + '/' + gameState.maxAircraft + '\n' +
                  'FUEL LINES CUT: ' + gameState.fuelLinesCut + '/' + gameState.maxFuelLines + '\n' +
                  'BASE ALARM: ' + gameState.baseAlarm;

    hudElement.textContent = hudText;
    hudElement.style.display = hudVisible ? 'block' : 'none';
  }

  function createHUD() {
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'aircraft-hangar-hud';
      hudElement.style.cssText = 'position: absolute; top: 20px; left: 20px; color: #00FF00; ' +
                                  'font-family: monospace; font-size: 14px; white-space: pre; ' +
                                  'background: rgba(0, 0, 0, 0.7); padding: 10px; border: 1px solid #00FF00; ' +
                                  'z-index: 100; text-shadow: 0 0 5px #00FF00;';
      document.body.appendChild(hudElement);
    }
    updateHUD();
  }

  function setupKeyListener() {
    document.addEventListener('keydown', function(event) {
      var now = Date.now();

      if (event.key.toLowerCase() === 'a' || event.key.toLowerCase() === 'A') {
        lastAKeyTime = now;
      }

      if (event.key.toLowerCase() === 'h' || event.key.toLowerCase() === 'H') {
        if (now - lastAKeyTime < 400) {
          hudVisible = !hudVisible;
          var notif = document.createElement('div');
          notif.textContent = hudVisible ? 'HUD: ON' : 'HUD: OFF';
          notif.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); ' +
                                'color: #00FF00; font-family: monospace; font-size: 20px; ' +
                                'background: rgba(0, 0, 0, 0.8); padding: 20px; z-index: 200; ' +
                                'border: 2px solid #00FF00; pointer-events: none;';
          document.body.appendChild(notif);
          setTimeout(function() { notif.remove(); }, 1000);
        }
        lastHKeyTime = now;
      }
    });
  }

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;

    // Setup scene
    scene.background = new THREE.Color(0xb0b0b0);
    scene.fog = new THREE.FogExp2(0x909090, 0.03);

    // Lighting - bright industrial
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(20, 30, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Create hangar structure
    createHangarBuilding();
    createHangarDoors();
    createGantryCrane();
    createMaintenanceScaffold();

    // Create equipment and vehicles
    createStealthBomber();
    fuelTanker = createFuelTankerTruck();
    gantryCrane = createGantryCrane();
    createToolCarts();

    // Create enemies
    createOrangeTechnicians();
    createArmedSecurityGuards();

    // Setup HUD
    createHUD();
    setupKeyListener();
  }

  function update(delta) {
    elapsedTime += delta;

    updateHangarDoors(delta);
    updateGantryCrane(delta);
    updateFuelTanker(delta);
    updateEnemies(delta);
    updateHUD();
  }

  function reset() {
    // Remove all scene objects
    sceneObjects.forEach(function(obj) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(function(mat) { mat.dispose(); });
        } else {
          obj.material.dispose();
        }
      }
    });

    // Remove lights
    var lightsToRemove = [];
    scene.children.forEach(function(child) {
      if (child instanceof THREE.Light) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach(function(light) {
      scene.remove(light);
    });

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Reset state
    sceneObjects = [];
    enemies = [];
    hangarDoors = [];
    gantryCrane = null;
    fuelTanker = null;
    gameState.aircraftDisabled = 0;
    gameState.fuelLinesCut = 0;
    gameState.baseAlarm = 'SILENT';
    elapsedTime = 0;
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
