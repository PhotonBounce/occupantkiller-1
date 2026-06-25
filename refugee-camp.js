window.RefugeeCamp = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var allObjects = [];
  var delta = 0;
  var time = 0;

  // Animation state
  var generatorPulse = 0;
  var tentFlap = 0;
  var supplyTruckPos = 0;
  var waterTankLevel = 1;
  var tankDraining = true;
  var satelliteDishAngle = 0;

  // HUD state
  var aidWorkersFreed = 0;
  var militiaIdentified = 0;
  var civiliansProtected = true;
  var hudVisible = false;

  // Toggle tracking (R+C)
  var lastRKeyTime = 0;
  var rKeyPressed = false;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    allObjects = [];
    time = 0;
    aidWorkersFreed = 0;
    militiaIdentified = 0;
    civiliansProtected = true;
    hudVisible = false;

    // Fog for dusty atmosphere
    scene.fog = new THREE.Fog(0xD9C5A3, 100, 300);
    scene.background = new THREE.Color(0xD9C5A3);

    createTentShelters();
    createAidDistributionCenter();
    createWaterDistributionPoint();
    createPortableLatrines();
    createMedicalClinicTent();
    createFoodStorageWarehouse();
    createUNVehicle();
    createGenerator();
    createSolarChargingStation();
    createSatellitePhoneStation();
    createSupplyPalletStacks();
    createSandbagDefensivePosition();
    createPerimeterFence();
    createAidWorkerRegistrationDesk();
    createFlagPole();

    // Setup keyboard listener
    document.addEventListener('keydown', handleKeyDown);
  }

  function createTentShelters() {
    var tentColor = new THREE.Color(0xF5F5DC); // White/beige
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 3; j++) {
        var tent = new THREE.Mesh(
          new THREE.BoxGeometry(3, 2.5, 4),
          new THREE.MeshPhongMaterial({ color: tentColor })
        );
        tent.position.set(-8 + i * 6, 1.25, -15 + j * 8);
        tent.castShadow = true;
        scene.add(tent);
        allObjects.push(tent);
      }
    }
  }

  function createAidDistributionCenter() {
    var buildingColor = new THREE.Color(0xF5F5DC);
    var building = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4, 10),
      new THREE.MeshPhongMaterial({ color: buildingColor })
    );
    building.position.set(15, 2, 5);
    building.castShadow = true;
    scene.add(building);
    allObjects.push(building);

    // UN marking - line segments forming U and N
    var points = [];
    // U shape
    points.push(new THREE.Vector3(11, 3.5, 5));
    points.push(new THREE.Vector3(11, 2, 5));
    points.push(new THREE.Vector3(13, 0.5, 5));
    points.push(new THREE.Vector3(15, 2, 5));
    points.push(new THREE.Vector3(15, 3.5, 5));
    // N shape
    points.push(new THREE.Vector3(17, 3.5, 5));
    points.push(new THREE.Vector3(17, 0.5, 5));
    points.push(new THREE.Vector3(19, 3.5, 5));
    points.push(new THREE.Vector3(19, 0.5, 5));

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var unMarking = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 3 }));
    unMarking.position.set(0, 0, 0);
    scene.add(unMarking);
    allObjects.push(unMarking);
  }

  function createWaterDistributionPoint() {
    var tankColor = new THREE.Color(0x696969); // Dark gray
    var tank = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 4, 32),
      new THREE.MeshPhongMaterial({ color: tankColor })
    );
    tank.position.set(-5, 2, 25);
    tank.castShadow = true;
    tank.userData.isTank = true;
    scene.add(tank);
    allObjects.push(tank);

    // Tank stand
    var stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 2, 16),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    stand.position.set(-5, 1, 25);
    scene.add(stand);
    allObjects.push(stand);
  }

  function createPortableLatrines() {
    var latColor = new THREE.Color(0x8B8680); // Brown
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 2; j++) {
        var lat = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 2.5, 1.5),
          new THREE.MeshPhongMaterial({ color: latColor })
        );
        lat.position.set(25 + i * 3, 1.25, 10 + j * 3);
        lat.castShadow = true;
        scene.add(lat);
        allObjects.push(lat);
      }
    }
  }

  function createMedicalClinicTent() {
    var tentColor = new THREE.Color(0xFFFFFF); // Pure white
    var clinic = new THREE.Mesh(
      new THREE.BoxGeometry(5, 3, 6),
      new THREE.MeshPhongMaterial({ color: tentColor })
    );
    clinic.position.set(-18, 1.5, 10);
    clinic.castShadow = true;
    scene.add(clinic);
    allObjects.push(clinic);

    // Red cross
    var crossH = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 0.3),
      new THREE.MeshPhongMaterial({ color: 0xFF0000 })
    );
    crossH.position.set(-18, 2.5, 10);
    scene.add(crossH);
    allObjects.push(crossH);

    var crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 1.5, 0.3),
      new THREE.MeshPhongMaterial({ color: 0xFF0000 })
    );
    crossV.position.set(-18, 2.5, 10);
    scene.add(crossV);
    allObjects.push(crossV);
  }

  function createFoodStorageWarehouse() {
    var warehouseColor = new THREE.Color(0xC9A876); // Tan
    var warehouse = new THREE.Mesh(
      new THREE.BoxGeometry(14, 5, 8),
      new THREE.MeshPhongMaterial({ color: warehouseColor })
    );
    warehouse.position.set(8, 2.5, -25);
    warehouse.castShadow = true;
    scene.add(warehouse);
    allObjects.push(warehouse);
  }

  function createUNVehicle() {
    var vehicleColor = new THREE.Color(0xF5F5DC); // White
    // Body
    var body = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2, 5),
      new THREE.MeshPhongMaterial({ color: vehicleColor })
    );
    body.position.set(0, 1, -30);
    body.castShadow = true;
    body.userData.isVehicle = true;
    scene.add(body);
    allObjects.push(body);

    // Wheels
    var wheelColor = new THREE.Color(0x333333);
    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
        new THREE.MeshPhongMaterial({ color: wheelColor })
      );
      var offsetX = (i < 2) ? -1 : 1;
      var offsetZ = (i % 2 === 0) ? -1.5 : 1.5;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(offsetX, 0.6, -30 + offsetZ);
      scene.add(wheel);
      allObjects.push(wheel);
    }
  }

  function createGenerator() {
    var genColor = new THREE.Color(0x696969); // Dark gray
    var generator = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 2),
      new THREE.MeshPhongMaterial({ color: genColor })
    );
    generator.position.set(-12, 0.75, -8);
    generator.castShadow = true;
    generator.userData.isGenerator = true;
    scene.add(generator);
    allObjects.push(generator);
  }

  function createSolarChargingStation() {
    var solarColor = new THREE.Color(0x4A4A4A); // Dark gray
    // Panel (flat box on angle)
    var panel = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.3, 4),
      new THREE.MeshPhongMaterial({ color: solarColor })
    );
    panel.rotation.z = Math.PI / 6; // 30 degree angle
    panel.position.set(20, 2.5, -10);
    scene.add(panel);
    allObjects.push(panel);

    // Post
    var post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 2, 16),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    post.position.set(20, 1, -10);
    scene.add(post);
    allObjects.push(post);
  }

  function createSatellitePhoneStation() {
    var boxColor = new THREE.Color(0xC9A876);
    var box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshPhongMaterial({ color: boxColor })
    );
    box.position.set(-25, 0.75, 15);
    box.castShadow = true;
    box.userData.isSatellite = true;
    scene.add(box);
    allObjects.push(box);

    // Antenna
    var antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 3, 8),
      new THREE.MeshPhongMaterial({ color: 0x888888 })
    );
    antenna.position.set(-25, 2.5, 15);
    antenna.userData.isAntennaBase = true;
    scene.add(antenna);
    allObjects.push(antenna);

    // Dish (rotates)
    var dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 8),
      new THREE.MeshPhongMaterial({ color: 0xAAAAAA })
    );
    dish.scale.z = 0.3;
    dish.position.set(-25, 3, 15);
    dish.userData.isDish = true;
    scene.add(dish);
    allObjects.push(dish);
  }

  function createSupplyPalletStacks() {
    var paletColor = new THREE.Color(0x8B7355); // Brown
    for (var i = 0; i < 3; i++) {
      var palet = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.5, 3),
        new THREE.MeshPhongMaterial({ color: paletColor })
      );
      palet.position.set(10, 0.25 + i * 0.6, 15);
      scene.add(palet);
      allObjects.push(palet);
    }
  }

  function createSandbagDefensivePosition() {
    var sandbagColor = new THREE.Color(0xBDB76B); // Khaki
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 2; j++) {
        var sandbag = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 8, 8),
          new THREE.MeshPhongMaterial({ color: sandbagColor })
        );
        sandbag.scale.set(1, 1.5, 1);
        sandbag.position.set(30 + i * 2, 0.75 + j * 1.2, 25);
        scene.add(sandbag);
        allObjects.push(sandbag);
      }
    }
  }

  function createPerimeterFence() {
    var fenceColor = new THREE.Color(0x666666);
    // Fence posts (cylinders)
    for (var i = 0; i < 8; i++) {
      var post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 3, 12),
        new THREE.MeshPhongMaterial({ color: fenceColor })
      );
      var angle = (i / 8) * Math.PI * 2;
      var radius = 40;
      post.position.set(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius);
      scene.add(post);
      allObjects.push(post);
    }

    // Fence line segments
    var points = [];
    for (var i = 0; i <= 32; i++) {
      var angle = (i / 32) * Math.PI * 2;
      var radius = 40;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 1.5, Math.sin(angle) * radius));
    }
    var fenceGeom = new THREE.BufferGeometry().setFromPoints(points);
    var fence = new THREE.LineSegments(fenceGeom, new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 }));
    scene.add(fence);
    allObjects.push(fence);
  }

  function createAidWorkerRegistrationDesk() {
    var deskColor = new THREE.Color(0xC9A876);
    // Desk table
    var desk = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 2),
      new THREE.MeshPhongMaterial({ color: deskColor })
    );
    desk.position.set(0, 0.5, 20);
    desk.castShadow = true;
    scene.add(desk);
    allObjects.push(desk);

    // Chairs
    for (var i = 0; i < 2; i++) {
      var chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshPhongMaterial({ color: 0x8B4513 })
      );
      chair.position.set(-1.5 + i * 3, 0.4, 18);
      scene.add(chair);
      allObjects.push(chair);
    }
  }

  function createFlagPole() {
    // Pole (cylinder)
    var pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 6, 12),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    pole.position.set(-30, 3, -15);
    pole.castShadow = true;
    scene.add(pole);
    allObjects.push(pole);

    // UN Flag (box)
    var flag = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 0.2),
      new THREE.MeshPhongMaterial({ color: 0x4169E1 }) // Blue
    );
    flag.position.set(-30.5, 5.5, -15);
    scene.add(flag);
    allObjects.push(flag);
  }

  function handleKeyDown(event) {
    if (event.key === 'r' || event.key === 'R') {
      var now = Date.now();
      if (!rKeyPressed) {
        lastRKeyTime = now;
        rKeyPressed = true;
      }
      if (now - lastRKeyTime < 400) {
        // R pressed twice within 400ms
        if (event.key === 'r' || event.key === 'R') {
          // Check for second key press (C)
        }
      }
    }

    if ((event.key === 'c' || event.key === 'C') && rKeyPressed) {
      var now = Date.now();
      if (now - lastRKeyTime < 400) {
        toggleHUD();
        rKeyPressed = false;
      }
    } else if (event.key !== 'r' && event.key !== 'R' && event.key !== 'c' && event.key !== 'C') {
      rKeyPressed = false;
    }
  }

  function toggleHUD() {
    hudVisible = !hudVisible;
    var hudElement = document.getElementById('refugee-camp-hud');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'refugee-camp-hud';
      hudElement.style.position = 'absolute';
      hudElement.style.top = '20px';
      hudElement.style.right = '20px';
      hudElement.style.color = '#FFFFFF';
      hudElement.style.fontFamily = 'monospace';
      hudElement.style.fontSize = '16px';
      hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      hudElement.style.padding = '10px';
      hudElement.style.borderRadius = '5px';
      hudElement.style.zIndex = '1000';
      document.body.appendChild(hudElement);
    }

    if (hudVisible) {
      hudElement.innerHTML = 'AID WORKERS FREED: ' + aidWorkersFreed + '/6<br>' +
                             'MILITIA IDENTIFIED: ' + militiaIdentified + '/8<br>' +
                             'CIVILIANS PROTECTED: ' + (civiliansProtected ? 'YES' : 'NO');
      hudElement.style.display = 'block';
    } else {
      hudElement.style.display = 'none';
    }
  }

  function update(deltaTime) {
    delta = deltaTime;
    time += deltaTime;

    // Generator pulse
    for (var i = 0; i < allObjects.length; i++) {
      if (allObjects[i].userData.isGenerator) {
        generatorPulse += deltaTime * 2;
        allObjects[i].scale.x = 1 + Math.sin(generatorPulse) * 0.05;
        allObjects[i].scale.y = 1 + Math.sin(generatorPulse) * 0.05;
        allObjects[i].scale.z = 1 + Math.sin(generatorPulse) * 0.05;
      }

      // Tent flaps wave (rotation oscillation)
      if (allObjects[i].geometry && allObjects[i].geometry.type === 'BoxGeometry' && !allObjects[i].userData.isGenerator) {
        tentFlap += deltaTime * 1.5;
        var scale = 0.02;
        allObjects[i].rotation.z = Math.sin(tentFlap) * scale;
      }

      // Water tank level indicator (draining/refilling)
      if (allObjects[i].userData.isTank) {
        if (tankDraining) {
          waterTankLevel -= deltaTime * 0.3;
          if (waterTankLevel <= 0) {
            tankDraining = false;
            waterTankLevel = 0;
          }
        } else {
          waterTankLevel += deltaTime * 0.3;
          if (waterTankLevel >= 1) {
            tankDraining = true;
            waterTankLevel = 1;
          }
        }
        allObjects[i].scale.y = 0.5 + waterTankLevel * 0.5;
      }

      // Satellite dish tracking
      if (allObjects[i].userData.isDish) {
        satelliteDishAngle += deltaTime * 0.5;
        allObjects[i].rotation.y = Math.sin(satelliteDishAngle) * 0.8;
        allObjects[i].rotation.x = Math.cos(satelliteDishAngle * 0.7) * 0.3;
      }

      // Vehicle movement along route
      if (allObjects[i].userData.isVehicle) {
        supplyTruckPos = (time * 5) % 100;
        var pathX = Math.sin(supplyTruckPos / 10) * 10;
        var pathZ = supplyTruckPos - 30;
        allObjects[i].position.set(pathX, 1, pathZ);
      }
    }

    if (hudVisible) {
      updateHUD();
    }
  }

  function updateHUD() {
    var hudElement = document.getElementById('refugee-camp-hud');
    if (hudElement) {
      hudElement.innerHTML = 'AID WORKERS FREED: ' + aidWorkersFreed + '/6<br>' +
                             'MILITIA IDENTIFIED: ' + militiaIdentified + '/8<br>' +
                             'CIVILIANS PROTECTED: ' + (civiliansProtected ? 'YES' : 'NO');
    }
  }

  function reset() {
    // Remove all created objects from scene
    for (var i = allObjects.length - 1; i >= 0; i--) {
      scene.remove(allObjects[i]);
      if (allObjects[i].geometry) {
        allObjects[i].geometry.dispose();
      }
      if (allObjects[i].material) {
        if (Array.isArray(allObjects[i].material)) {
          for (var j = 0; j < allObjects[i].material.length; j++) {
            allObjects[i].material[j].dispose();
          }
        } else {
          allObjects[i].material.dispose();
        }
      }
    }
    allObjects = [];

    // Reset state
    time = 0;
    generatorPulse = 0;
    tentFlap = 0;
    supplyTruckPos = 0;
    waterTankLevel = 1;
    tankDraining = true;
    satelliteDishAngle = 0;
    aidWorkersFreed = 0;
    militiaIdentified = 0;
    civiliansProtected = true;
    hudVisible = false;

    // Remove HUD element
    var hudElement = document.getElementById('refugee-camp-hud');
    if (hudElement) {
      hudElement.remove();
    }

    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeyDown);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
