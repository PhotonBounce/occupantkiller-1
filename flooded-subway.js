window.FloodedSubway = (function() {
  'use strict';

  var scene;
  var camera;
  var objects = [];
  var animatedObjects = [];

  function init(sceneParam, cameraParam) {
    scene = sceneParam;
    camera = cameraParam;
    objects = [];
    animatedObjects = [];

    // Subway tunnel sections - concrete cylindrical passages
    var tunnelGeometry = new THREE.BoxGeometry(8, 6, 20);
    var tunnelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    var tunnel1 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel1.position.set(0, 3, -20);
    scene.add(tunnel1);
    objects.push(tunnel1);

    var tunnel2 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel2.position.set(0, 3, 0);
    scene.add(tunnel2);
    objects.push(tunnel2);

    var tunnel3 = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    tunnel3.position.set(0, 3, 20);
    scene.add(tunnel3);
    objects.push(tunnel3);

    // Station platform - raised concrete
    var platformGeometry = new THREE.BoxGeometry(12, 2, 15);
    var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    var platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 1, 0);
    scene.add(platform);
    objects.push(platform);

    // Abandoned subway train cars - blue with dark windows
    var trainCarGeometry = new THREE.BoxGeometry(3, 3.5, 8);
    var trainCarMaterial = new THREE.MeshStandardMaterial({ color: 0x2244AA });
    var trainCar1 = new THREE.Mesh(trainCarGeometry, trainCarMaterial);
    trainCar1.position.set(-5, 2, 5);
    scene.add(trainCar1);
    objects.push(trainCar1);

    var trainCar2 = new THREE.Mesh(trainCarGeometry, trainCarMaterial);
    trainCar2.position.set(5, 2, 5);
    scene.add(trainCar2);
    objects.push(trainCar2);

    // Train windows - dark glass
    var windowGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.2);
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x001111, metalness: 0.6 });
    var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(-5, 3, 9.2);
    scene.add(window1);
    objects.push(window1);

    var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
    window2.position.set(5, 3, 9.2);
    scene.add(window2);
    objects.push(window2);

    // Flooded tunnel water - dark water with emissive shimmer
    var waterGeometry = new THREE.BoxGeometry(10, 2, 40);
    var waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x001133,
      emissive: 0x003366,
      emissiveIntensity: 0.3
    });
    var water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(0, 0.5, 0);
    scene.add(water);
    objects.push(water);
    animatedObjects.push({
      object: water,
      type: 'water',
      baseEmissive: 0x003366,
      time: 0
    });

    // Emergency lighting strips on walls - orange
    var emergencyLightGeometry = new THREE.BoxGeometry(0.5, 0.3, 10);
    var emergencyMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF4400,
      emissive: 0xFF4400,
      emissiveIntensity: 0.5
    });
    var emergencyLight1 = new THREE.Mesh(emergencyLightGeometry, emergencyMaterial);
    emergencyLight1.position.set(-4.5, 5, 0);
    scene.add(emergencyLight1);
    objects.push(emergencyLight1);
    animatedObjects.push({
      object: emergencyLight1,
      type: 'emergency',
      time: 0
    });

    var emergencyLight2 = new THREE.Mesh(emergencyLightGeometry, emergencyMaterial);
    emergencyLight2.position.set(4.5, 5, 0);
    scene.add(emergencyLight2);
    objects.push(emergencyLight2);
    animatedObjects.push({
      object: emergencyLight2,
      type: 'emergency',
      time: 0.5
    });

    // Turnstile gates - frame + rotating bars
    var turnstileFrameGeometry = new THREE.BoxGeometry(1.2, 1.2, 1);
    var turnstileMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    var turnstile1 = new THREE.Mesh(turnstileFrameGeometry, turnstileMaterial);
    turnstile1.position.set(-3, 1, -8);
    scene.add(turnstile1);
    objects.push(turnstile1);

    var turnstile2 = new THREE.Mesh(turnstileFrameGeometry, turnstileMaterial);
    turnstile2.position.set(3, 1, -8);
    scene.add(turnstile2);
    objects.push(turnstile2);

    // Ticket booth
    var ticketBoothGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    var ticketBoothMaterial = new THREE.MeshStandardMaterial({ color: 0x223344 });
    var ticketBooth = new THREE.Mesh(ticketBoothGeometry, ticketBoothMaterial);
    ticketBooth.position.set(-6, 1.5, -12);
    scene.add(ticketBooth);
    objects.push(ticketBooth);

    // Glass window on booth
    var boothGlassGeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
    var glassMaterial = new THREE.MeshStandardMaterial({ color: 0x88AACC, transparent: true, opacity: 0.6 });
    var boothGlass = new THREE.Mesh(boothGlassGeometry, glassMaterial);
    boothGlass.position.set(-6, 1.5, -1.6);
    ticketBooth.add(boothGlass);

    // Submerged escalators - angled boxGeometry
    var escalatorGeometry = new THREE.BoxGeometry(2, 0.5, 6);
    var escalatorMaterial = new THREE.MeshStandardMaterial({ color: 0x666655 });
    var escalator = new THREE.Mesh(escalatorGeometry, escalatorMaterial);
    escalator.position.set(6, 0.5, -10);
    escalator.rotation.z = 0.3;
    scene.add(escalator);
    objects.push(escalator);

    // Drowned enemy patrol boats - small boxGeometry
    var boatGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
    var boatMaterial = new THREE.MeshStandardMaterial({ color: 0x334444 });
    var boat1 = new THREE.Mesh(boatGeometry, boatMaterial);
    boat1.position.set(-3, 0.8, 15);
    scene.add(boat1);
    objects.push(boat1);
    animatedObjects.push({
      object: boat1,
      type: 'boat',
      baseY: 0.8,
      time: 0
    });

    var boat2 = new THREE.Mesh(boatGeometry, boatMaterial);
    boat2.position.set(4, 0.8, 10);
    scene.add(boat2);
    objects.push(boat2);
    animatedObjects.push({
      object: boat2,
      type: 'boat',
      baseY: 0.8,
      time: 1.2
    });

    // Electrical hazards - sparking cables
    var cableGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
    var cableMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFAA00,
      emissive: 0xFFAA00,
      emissiveIntensity: 0.6
    });
    var cable1 = new THREE.Mesh(cableGeometry, cableMaterial);
    cable1.position.set(3, 4.5, 20);
    scene.add(cable1);
    objects.push(cable1);
    animatedObjects.push({
      object: cable1,
      type: 'spark',
      time: 0
    });

    var cable2 = new THREE.Mesh(cableGeometry, cableMaterial);
    cable2.position.set(-3, 4.5, -15);
    scene.add(cable2);
    objects.push(cable2);
    animatedObjects.push({
      object: cable2,
      type: 'spark',
      time: 0.7
    });

    // Wall map boards - flat with route lines
    var mapBoardGeometry = new THREE.BoxGeometry(3, 2, 0.3);
    var mapBoardMaterial = new THREE.MeshStandardMaterial({ color: 0x222233 });
    var mapBoard = new THREE.Mesh(mapBoardGeometry, mapBoardMaterial);
    mapBoard.position.set(-4.5, 3, 15);
    scene.add(mapBoard);
    objects.push(mapBoard);

    // Route line on map - colored
    var routeLineGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.4);
    var routeMaterial = new THREE.MeshStandardMaterial({
      color: 0xCC0000,
      emissive: 0xCC0000,
      emissiveIntensity: 0.3
    });
    var routeLine = new THREE.Mesh(routeLineGeometry, routeMaterial);
    routeLine.position.set(-4.5, 3, 15.2);
    scene.add(routeLine);
    objects.push(routeLine);

    // Support columns - cylinders
    var columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
    var columnMaterial = new THREE.MeshStandardMaterial({ color: 0x555544 });
    var column1 = new THREE.Mesh(columnGeometry, columnMaterial);
    column1.position.set(-6, 3, -10);
    scene.add(column1);
    objects.push(column1);

    var column2 = new THREE.Mesh(columnGeometry, columnMaterial);
    column2.position.set(6, 3, -10);
    scene.add(column2);
    objects.push(column2);

    var column3 = new THREE.Mesh(columnGeometry, columnMaterial);
    column3.position.set(-6, 3, 10);
    scene.add(column3);
    objects.push(column3);

    var column4 = new THREE.Mesh(columnGeometry, columnMaterial);
    column4.position.set(6, 3, 10);
    scene.add(column4);
    objects.push(column4);

    // Ventilation grate covers - with LineSegments grid pattern
    var grateGeometry = new THREE.BoxGeometry(2, 2, 0.2);
    var grateMaterial = new THREE.MeshStandardMaterial({ color: 0x444433 });
    var grate1 = new THREE.Mesh(grateGeometry, grateMaterial);
    grate1.position.set(4.5, 5.5, -5);
    scene.add(grate1);
    objects.push(grate1);

    // Grate grid lines using LineSegments
    var grateGridPoints = [];
    for (var i = 0; i <= 4; i++) {
      grateGridPoints.push(new THREE.Vector3(-1 + i * 0.5, -1, 0.1));
      grateGridPoints.push(new THREE.Vector3(-1 + i * 0.5, 1, 0.1));
    }
    for (var j = 0; j <= 4; j++) {
      grateGridPoints.push(new THREE.Vector3(-1, -1 + j * 0.5, 0.1));
      grateGridPoints.push(new THREE.Vector3(1, -1 + j * 0.5, 0.1));
    }
    var grateGridGeometry = new THREE.BufferGeometry().setFromPoints(grateGridPoints);
    var linesMaterial = new THREE.LineBasicMaterial({ color: 0x666655 });
    var grateGrid = new THREE.LineSegments(grateGridGeometry, linesMaterial);
    grateGrid.position.set(4.5, 5.5, -5);
    scene.add(grateGrid);
    objects.push(grateGrid);

    // Floating debris - various small boxes drifting
    var debrisGeometry1 = new THREE.BoxGeometry(0.5, 0.3, 0.5);
    var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    var debris1 = new THREE.Mesh(debrisGeometry1, debrisMaterial);
    debris1.position.set(-2, 1.5, 8);
    scene.add(debris1);
    objects.push(debris1);
    animatedObjects.push({
      object: debris1,
      type: 'debris',
      baseX: -2,
      baseZ: 8,
      time: 0
    });

    var debrisGeometry2 = new THREE.BoxGeometry(0.4, 0.2, 0.6);
    var debris2 = new THREE.Mesh(debrisGeometry2, debrisMaterial);
    debris2.position.set(2, 1.2, 12);
    scene.add(debris2);
    objects.push(debris2);
    animatedObjects.push({
      object: debris2,
      type: 'debris',
      baseX: 2,
      baseZ: 12,
      time: 1.5
    });

    var debrisGeometry3 = new THREE.BoxGeometry(0.3, 0.4, 0.4);
    var debris3 = new THREE.Mesh(debrisGeometry3, debrisMaterial);
    debris3.position.set(-5, 1.8, -2);
    scene.add(debris3);
    objects.push(debris3);
    animatedObjects.push({
      object: debris3,
      type: 'debris',
      baseX: -5,
      baseZ: -2,
      time: 0.8
    });

    // Tunnel drips - water drops using SphereGeometry
    var dropGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    var dropMaterial = new THREE.MeshStandardMaterial({
      color: 0x0088FF,
      emissive: 0x0044FF,
      emissiveIntensity: 0.2
    });
    var drop1 = new THREE.Mesh(dropGeometry, dropMaterial);
    drop1.position.set(-2, 5.5, 5);
    scene.add(drop1);
    objects.push(drop1);
    animatedObjects.push({
      object: drop1,
      type: 'drip',
      baseY: 5.5,
      time: 0
    });

    var drop2 = new THREE.Mesh(dropGeometry, dropMaterial);
    drop2.position.set(3, 5.5, -8);
    scene.add(drop2);
    objects.push(drop2);
    animatedObjects.push({
      object: drop2,
      type: 'drip',
      baseY: 5.5,
      time: 1.0
    });
  }

  function update(delta) {
    for (var i = 0; i < animatedObjects.length; i++) {
      var anim = animatedObjects[i];
      anim.time += delta;

      if (anim.type === 'water') {
        var waterShimmer = 0.3 + 0.15 * Math.sin(anim.time * 2);
        anim.object.material.emissiveIntensity = waterShimmer;
      }

      if (anim.type === 'emergency') {
        var pulseFactor = 0.4 + 0.6 * Math.abs(Math.sin(anim.time * 3));
        anim.object.material.emissiveIntensity = pulseFactor;
      }

      if (anim.type === 'spark') {
        var sparkIntensity = 0.3 + 0.7 * Math.random();
        anim.object.material.emissiveIntensity = sparkIntensity;
        anim.object.rotation.z += delta * 2;
      }

      if (anim.type === 'boat') {
        anim.object.position.y = anim.baseY + 0.4 * Math.sin(anim.time * 1.5);
      }

      if (anim.type === 'debris') {
        anim.object.position.x = anim.baseX + 0.5 * Math.sin(anim.time * 0.8);
        anim.object.position.z = anim.baseZ + 0.5 * Math.cos(anim.time * 0.6);
      }

      if (anim.type === 'drip') {
        var dripCycle = anim.time % 2.0;
        if (dripCycle < 1.0) {
          anim.object.position.y = anim.baseY - dripCycle * 0.8;
        } else {
          anim.object.position.y = anim.baseY - (2.0 - dripCycle) * 0.8;
        }
      }
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
    }
    objects = [];
    animatedObjects = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
