window.Monorail = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var gameObjects = [];
  var trainPosition = 0;
  var trainSpeed = 85;
  var carsCleared = 0;
  var hostagesFreed = 0;
  var isEnabled = true;
  var hudElement = null;
  var trainRotation = 0;
  var keyPressLog = [];
  var lastKeyTime = 0;
  var animatedObjects = [];

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    gameObjects = [];
    animatedObjects = [];
    trainPosition = 0;
    trainSpeed = 85;
    carsCleared = 0;
    hostagesFreed = 0;
    keyPressLog = [];

    createGuideWay();
    createPylons();
    createTrainCars();
    createTrainCabin();
    createCatenaryRail();
    createMaintenanceCatwalk();
    createStationPlatform();
    createTurnstile();
    createCCTVCameras();
    createCityStreet();
    createAdjacentBuildings();
    createEmergencyPanel();
    createOverheadCables();
    createEscalatorShaft();
    createTicketBooth();
    createEnemies();

    createHUD();
    setupKeyBindings();

    var fogColor = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(fogColor, 200, 1000);
    scene.background = new THREE.Color(0x0f0f1e);
  }

  function createGuideWay() {
    var guideWayGeometry = new THREE.BoxGeometry(0.8, 0.4, 600);
    var guideWayMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.1
    });
    var guideWay = new THREE.Mesh(guideWayGeometry, guideWayMaterial);
    guideWay.position.y = 80;
    guideWay.castShadow = true;
    scene.add(guideWay);
    gameObjects.push(guideWay);
  }

  function createPylons() {
    var pylonHeight = 80;
    for (var i = 0; i < 50; i++) {
      var pylonGeometry = new THREE.CylinderGeometry(2, 2.5, pylonHeight, 8);
      var pylonMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.3,
        roughness: 0.7
      });
      var pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
      pylon.position.set(-15 + (i % 2) * 30, pylonHeight / 2, i * 12 - 300);
      pylon.castShadow = true;
      scene.add(pylon);
      gameObjects.push(pylon);
    }
  }

  function createTrainCars() {
    var carLength = 30;
    var carWidth = 8;
    var carHeight = 6;
    var carColors = [0x1a1a2e, 0x0f3460, 0x16213e];

    for (var i = 0; i < 3; i++) {
      var carGeometry = new THREE.BoxGeometry(carWidth, carHeight, carLength);
      var carMaterial = new THREE.MeshStandardMaterial({
        color: carColors[i],
        metalness: 0.7,
        roughness: 0.2
      });
      var car = new THREE.Mesh(carGeometry, carMaterial);
      car.position.set(0, 83, i * carLength - carLength);
      car.castShadow = true;
      scene.add(car);
      gameObjects.push(car);

      // Add window panels
      for (var w = 0; w < 4; w++) {
        var windowGeometry = new THREE.BoxGeometry(carWidth - 1, 2, 1);
        var windowMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x0088ff,
          emissiveIntensity: 0.3
        });
        var window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(0, carHeight / 2 + 0.5, -carLength / 2 + 5 + w * 6);
        car.add(window);
      }

      // Store reference for animation
      car.originalPosition = car.position.clone();
      animatedObjects.push({ object: car, type: 'train' });
    }
  }

  function createTrainCabin() {
    var cabinGeometry = new THREE.BoxGeometry(8, 6, 20);
    var cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a3a,
      metalness: 0.6,
      roughness: 0.3
    });
    var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 83, -80);
    cabin.castShadow = true;
    scene.add(cabin);
    gameObjects.push(cabin);

    // Driver console
    var consoleGeometry = new THREE.BoxGeometry(6, 2, 3);
    var consoleMaterial = new THREE.MeshStandardMaterial({
      color: 0x003366,
      emissive: 0x0066cc,
      emissiveIntensity: 0.2
    });
    var driverConsole = new THREE.Mesh(consoleGeometry, consoleMaterial);
    driverConsole.position.set(0, 82, -75);
    scene.add(driverConsole);
    gameObjects.push(driverConsole);

    // Cabin seats
    for (var s = 0; s < 6; s++) {
      var seatGeometry = new THREE.BoxGeometry(2, 2, 2);
      var seatMaterial = new THREE.MeshStandardMaterial({
        color: 0x663333,
        metalness: 0.3,
        roughness: 0.7
      });
      var seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(-2 + (s % 3) * 2, 82, -80 + Math.floor(s / 3) * 4);
      scene.add(seat);
      gameObjects.push(seat);
    }
  }

  function createCatenaryRail() {
    var catenaryGeometry = new THREE.BoxGeometry(0.3, 0.3, 600);
    var catenaryMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 0.95,
      roughness: 0.05
    });
    var catenary = new THREE.Mesh(catenaryGeometry, catenaryMaterial);
    catenary.position.set(0, 87, 0);
    catenary.castShadow = true;
    scene.add(catenary);
    gameObjects.push(catenary);
  }

  function createMaintenanceCatwalk() {
    var walkwayGeometry = new THREE.BoxGeometry(2, 0.5, 600);
    var walkwayMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.4,
      roughness: 0.6
    });
    var walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
    walkway.position.set(12, 82, 0);
    walkway.castShadow = true;
    scene.add(walkway);
    gameObjects.push(walkway);

    // Railing with LineSegments
    var railingGeometry = new THREE.BufferGeometry();
    var points = [];
    for (var r = 0; r < 50; r++) {
      var z = r * 12 - 300;
      points.push(new THREE.Vector3(12, 85, z));
      points.push(new THREE.Vector3(12, 82, z));
    }
    railingGeometry.setFromPoints(points);
    var railingMaterial = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 });
    var railing = new THREE.LineSegments(railingGeometry, railingMaterial);
    scene.add(railing);
    gameObjects.push(railing);
  }

  function createStationPlatform() {
    var platformGeometry = new THREE.BoxGeometry(25, 1, 40);
    var platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      metalness: 0.2,
      roughness: 0.8
    });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(-20, 78, -200);
    platform.castShadow = true;
    scene.add(platform);
    gameObjects.push(platform);

    // Platform shelter roof
    var roofGeometry = new THREE.BoxGeometry(30, 1, 45);
    var roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.6,
      roughness: 0.4
    });
    var roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-20, 90, -200);
    scene.add(roof);
    gameObjects.push(roof);
  }

  function createTurnstile() {
    var frameGeometry = new THREE.BoxGeometry(3, 4, 1);
    var frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.8,
      roughness: 0.3
    });
    var frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(-25, 80, -210);
    scene.add(frame);
    gameObjects.push(frame);
  }

  function createCCTVCameras() {
    for (var c = 0; c < 8; c++) {
      var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 6);
      var poleMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.5,
        roughness: 0.6
      });
      var pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.set(-10 + c * 20, 75, 100 + c * 50);
      scene.add(pole);
      gameObjects.push(pole);

      var cameraGeometry = new THREE.BoxGeometry(1.5, 1, 2);
      var cameraMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.2
      });
      var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
      camera.position.set(-10 + c * 20, 87, 100 + c * 50);
      scene.add(camera);
      gameObjects.push(camera);

      camera.originalRotation = camera.rotation.y;
      animatedObjects.push({ object: camera, type: 'camera' });
    }
  }

  function createCityStreet() {
    var streetGeometry = new THREE.BoxGeometry(200, 1, 800);
    var streetMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.1,
      roughness: 0.9
    });
    var street = new THREE.Mesh(streetGeometry, streetMaterial);
    street.position.set(0, -20, 0);
    scene.add(street);
    gameObjects.push(street);

    // City lights below
    for (var l = 0; l < 20; l++) {
      var lightGeometry = new THREE.BoxGeometry(5, 0.5, 5);
      var lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088ff,
        emissiveIntensity: 0.5
      });
      var light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(-80 + (l % 4) * 40, -18, -300 + Math.floor(l / 4) * 80);
      scene.add(light);
      gameObjects.push(light);

      light.originalIntensity = 0.5;
      animatedObjects.push({ object: light, type: 'citylight' });
    }
  }

  function createAdjacentBuildings() {
    var buildingColors = [0x333333, 0x404040, 0x2a2a2a, 0x454545];
    for (var b = 0; b < 12; b++) {
      var buildingHeight = 40 + (b % 3) * 30;
      var buildingGeometry = new THREE.BoxGeometry(25, buildingHeight, 25);
      var buildingMaterial = new THREE.MeshStandardMaterial({
        color: buildingColors[b % 4],
        metalness: 0.2,
        roughness: 0.8
      });
      var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
      var xPos = b < 6 ? -100 : 100;
      building.position.set(xPos, buildingHeight / 2 - 20, -200 + (b % 6) * 100);
      building.castShadow = true;
      scene.add(building);
      gameObjects.push(building);

      // Building windows
      for (var bw = 0; bw < 12; bw++) {
        var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
        var windowMaterial = new THREE.MeshStandardMaterial({
          color: 0xffff00,
          emissive: 0xffaa00,
          emissiveIntensity: 0.3
        });
        var buildingWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        buildingWindow.position.set(0, -buildingHeight / 2 + 5 + (bw % 6) * 5, 12);
        building.add(buildingWindow);
      }
    }
  }

  function createEmergencyPanel() {
    var panelGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    var panelMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff3333,
      emissiveIntensity: 0.5
    });
    var panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(13, 85, -150);
    scene.add(panel);
    gameObjects.push(panel);
  }

  function createOverheadCables() {
    var cableGeometry = new THREE.BufferGeometry();
    var cablePoints = [];
    for (var p = 0; p < 60; p++) {
      var z = p * 10 - 300;
      cablePoints.push(new THREE.Vector3(-5, 95, z));
      cablePoints.push(new THREE.Vector3(5, 95, z));
    }
    cableGeometry.setFromPoints(cablePoints);
    var cableMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 1 });
    var cables = new THREE.LineSegments(cableGeometry, cableMaterial);
    scene.add(cables);
    gameObjects.push(cables);
  }

  function createEscalatorShaft() {
    var shaftGeometry = new THREE.BoxGeometry(4, 20, 3);
    var shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.5,
      roughness: 0.5
    });
    var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.z = Math.PI / 6;
    shaft.position.set(-30, 70, -220);
    scene.add(shaft);
    gameObjects.push(shaft);
  }

  function createTicketBooth() {
    var boothGeometry = new THREE.BoxGeometry(4, 3, 4);
    var boothMaterial = new THREE.MeshStandardMaterial({
      color: 0x554400,
      metalness: 0.3,
      roughness: 0.7
    });
    var booth = new THREE.Mesh(boothGeometry, boothMaterial);
    booth.position.set(-40, 79, -200);
    scene.add(booth);
    gameObjects.push(booth);

    // Booth window
    var boothWindowGeometry = new THREE.BoxGeometry(2, 1.5, 0.3);
    var boothWindowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x0066ff,
      emissiveIntensity: 0.3
    });
    var boothWindow = new THREE.Mesh(boothWindowGeometry, boothWindowMaterial);
    boothWindow.position.set(0, 1, 2.1);
    booth.add(boothWindow);
  }

  function createEnemies() {
    // Hijackers on train roof
    for (var e = 0; e < 2; e++) {
      var enemyGeometry = new THREE.BoxGeometry(1.5, 3, 1);
      var enemyMaterial = new THREE.MeshStandardMaterial({
        color: 0x222200,
        metalness: 0.4,
        roughness: 0.6
      });
      var enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
      enemy.position.set(-2 + e * 4, 90, -30 + e * 20);
      scene.add(enemy);
      gameObjects.push(enemy);
    }

    // Station security (turned hostile)
    var securityGeometry = new THREE.BoxGeometry(1.5, 3, 1);
    var securityMaterial = new THREE.MeshStandardMaterial({
      color: 0x001166,
      metalness: 0.4,
      roughness: 0.6
    });
    var security = new THREE.Mesh(securityGeometry, securityMaterial);
    security.position.set(-30, 80, -200);
    scene.add(security);
    gameObjects.push(security);

    // Conductor (hostage)
    var conductorGeometry = new THREE.BoxGeometry(1.5, 3, 1);
    var conductorMaterial = new THREE.MeshStandardMaterial({
      color: 0x336633,
      metalness: 0.4,
      roughness: 0.6
    });
    var conductor = new THREE.Mesh(conductorGeometry, conductorMaterial);
    conductor.position.set(0, 82, -75);
    scene.add(conductor);
    gameObjects.push(conductor);
  }

  function createHUD() {
    hudElement = document.createElement('div');
    hudElement.id = 'monorail-hud';
    hudElement.style.position = 'fixed';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.style.zIndex = '1000';
    hudElement.style.display = isEnabled ? 'block' : 'none';
    hudElement.innerHTML = 'MONORAIL SYSTEM<br/>TRAIN SPEED: ' + trainSpeed + ' KM/H<br/>CARS CLEARED: ' + carsCleared + '/3<br/>HOSTAGES FREED: ' + hostagesFreed + '/8<br/>[M+R] Toggle HUD';
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (hudElement) {
      hudElement.innerHTML = 'MONORAIL SYSTEM<br/>TRAIN SPEED: ' + Math.round(trainSpeed) + ' KM/H<br/>CARS CLEARED: ' + carsCleared + '/3<br/>HOSTAGES FREED: ' + hostagesFreed + '/8<br/>[M+R] Toggle HUD';
    }
  }

  function setupKeyBindings() {
    document.addEventListener('keydown', function(event) {
      var currentTime = Date.now();

      if (event.key.toLowerCase() === 'm') {
        keyPressLog.push('m');
        lastKeyTime = currentTime;
      } else if (event.key.toLowerCase() === 'r' && keyPressLog.length > 0) {
        if (currentTime - lastKeyTime < 400) {
          keyPressLog.push('r');
          if (keyPressLog.length >= 2) {
            var recentKeys = keyPressLog.slice(-2);
            if (recentKeys[0] === 'm' && recentKeys[1] === 'r') {
              toggleHUD();
            }
          }
        }
      }

      // Clear old key presses
      if (currentTime - lastKeyTime > 400) {
        keyPressLog = [];
      }
    });
  }

  function toggleHUD() {
    isEnabled = !isEnabled;
    if (hudElement) {
      hudElement.style.display = isEnabled ? 'block' : 'none';
      if (isEnabled) {
        hudElement.innerHTML += '<br/>HUD ENABLED';
      }
    }
  }

  function update(delta) {
    // Train movement along path
    trainPosition += trainSpeed * delta;
    if (trainPosition > 600) {
      trainPosition = 0;
    }

    // Update train cars
    for (var i = 0; i < gameObjects.length; i++) {
      var obj = gameObjects[i];
      if (obj.geometry instanceof THREE.BoxGeometry && obj.position.z !== undefined) {
        // Check if this is a train car by checking position pattern
        if (Math.abs(obj.position.y - 83) < 0.1 && Math.abs(obj.position.x) < 5) {
          obj.position.z = trainPosition - 30 * (i % 3) - 150;
        }
      }
    }

    // Animate CCTV cameras panning
    for (var a = 0; a < animatedObjects.length; a++) {
      var animated = animatedObjects[a];
      if (animated.type === 'camera') {
        animated.object.rotation.y = (animated.object.originalRotation || 0) + Math.sin(Date.now() * 0.001) * 0.5;
      } else if (animated.type === 'citylight') {
        var intensity = animated.object.material.emissiveIntensity;
        var newIntensity = 0.2 + Math.sin(Date.now() * 0.002 + a) * 0.3;
        animated.object.material.emissiveIntensity = newIntensity;
      }
    }

    // Simulate train speed variation
    trainSpeed = 70 + Math.sin(Date.now() * 0.0003) * 15;

    updateHUD();
  }

  function reset() {
    // Remove all objects from scene
    for (var i = gameObjects.length - 1; i >= 0; i--) {
      scene.remove(gameObjects[i]);
    }
    gameObjects = [];
    animatedObjects = [];
    trainPosition = 0;
    trainSpeed = 85;
    carsCleared = 0;
    hostagesFreed = 0;

    if (hudElement && hudElement.parentNode) {
      hudElement.parentNode.removeChild(hudElement);
      hudElement = null;
    }

    // Re-initialize
    init(scene, camera);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
