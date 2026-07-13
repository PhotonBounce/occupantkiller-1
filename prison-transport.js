window.PrisonTransport = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var particles = [];
  var scene = null;
  var camera = null;
  var fireFlicker = 0;
  var helicopterSmoke = 0;
  var alarmLight = 0;
  var vanRock = 0;

  function init(sceneRef, cameraRef) {
    scene = sceneRef;
    camera = cameraRef;
    objects = [];
    lights = [];
    particles = [];
    fireFlicker = 0;
    helicopterSmoke = 0;
    alarmLight = 0;
    vanRock = 0;

    buildMountainRoad();
    buildPrisonVan();
    buildPoliceEscorts();
    buildRoadblockBarriers();
    buildHillsideSlopes();
    buildAttackVehicles();
    buildRockFormations();
    buildGuardRails();
    buildCrashedHelicopter();
    buildWeaponCache();
    buildLighting();
  }

  function buildMountainRoad() {
    var roadMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });

    var roadSegment1 = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.3, 8),
      roadMaterial
    );
    roadSegment1.position.set(0, 0.15, -20);
    roadSegment1.castShadow = true;
    roadSegment1.receiveShadow = true;
    scene.add(roadSegment1);
    objects.push(roadSegment1);

    var roadSegment2 = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.3, 10),
      roadMaterial
    );
    roadSegment2.position.set(15, 1.5, 0);
    roadSegment2.rotation.z = -0.15;
    roadSegment2.castShadow = true;
    roadSegment2.receiveShadow = true;
    scene.add(roadSegment2);
    objects.push(roadSegment2);

    var roadSegment3 = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.3, 12),
      roadMaterial
    );
    roadSegment3.position.set(28, 4, 15);
    roadSegment3.rotation.z = -0.25;
    roadSegment3.castShadow = true;
    roadSegment3.receiveShadow = true;
    scene.add(roadSegment3);
    objects.push(roadSegment3);

    var roadSegment4 = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.3, 10),
      roadMaterial
    );
    roadSegment4.position.set(35, 7, 30);
    roadSegment4.rotation.z = -0.3;
    roadSegment4.castShadow = true;
    roadSegment4.receiveShadow = true;
    scene.add(roadSegment4);
    objects.push(roadSegment4);

    var roadMarking1 = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.01, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xFFFF00 })
    );
    roadMarking1.position.set(0, 0.35, -20);
    scene.add(roadMarking1);
    objects.push(roadMarking1);

    var roadMarking2 = new THREE.Mesh(
      new THREE.BoxGeometry(28, 0.01, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xFFFF00 })
    );
    roadMarking2.position.set(15, 1.65, 0);
    roadMarking2.rotation.z = -0.15;
    scene.add(roadMarking2);
    objects.push(roadMarking2);
  }

  function buildPrisonVan() {
    var vanBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x0A3A66, metalness: 0.8 });

    var vanBody = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3.5, 4),
      vanBodyMaterial
    );
    vanBody.position.set(5, 2.2, -18);
    vanBody.castShadow = true;
    vanBody.receiveShadow = true;
    scene.add(vanBody);
    objects.push(vanBody);

    var vanRoof = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.4, 4.2),
      vanBodyMaterial
    );
    vanRoof.position.set(5, 4, -18);
    vanRoof.castShadow = true;
    scene.add(vanRoof);
    objects.push(vanRoof);

    var windowFront = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 0.1),
      windowMaterial
    );
    windowFront.position.set(8.5, 2.5, -18);
    scene.add(windowFront);
    objects.push(windowFront);

    var windowSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.2, 1.5),
      windowMaterial
    );
    windowSide.position.set(1.5, 2.5, -18);
    scene.add(windowSide);
    objects.push(windowSide);

    for (var i = 0; i < 4; i++) {
      var wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16),
        wheelMaterial
      );
      var xPos = i < 2 ? 2 : 8;
      var zPos = i % 2 === 0 ? -19.5 : -16.5;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(xPos, 0.8, zPos);
      wheel.castShadow = true;
      scene.add(wheel);
      objects.push(wheel);
    }

    var bumper = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.6, 0.4),
      vanBodyMaterial
    );
    bumper.position.set(5, 0.5, -20);
    scene.add(bumper);
    objects.push(bumper);
  }

  function buildPoliceEscorts() {
    var policeBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x003399, roughness: 0.5 });
    var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    var lightMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000 });

    for (var c = 0; c < 2; c++) {
      var xOffset = c === 0 ? -6 : 16;

      var carBody = new THREE.Mesh(
        new THREE.BoxGeometry(5, 2.2, 2.5),
        policeBodyMaterial
      );
      carBody.position.set(xOffset, 1.3, -18);
      carBody.castShadow = true;
      carBody.receiveShadow = true;
      scene.add(carBody);
      objects.push(carBody);

      var carRoof = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.3, 1.8),
        policeBodyMaterial
      );
      carRoof.position.set(xOffset, 2.8, -18);
      carRoof.castShadow = true;
      scene.add(carRoof);
      objects.push(carRoof);

      for (var w = 0; w < 4; w++) {
        var wheel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12),
          wheelMaterial
        );
        var wheelX = xOffset + (w < 2 ? -1 : 1);
        var wheelZ = w % 2 === 0 ? -19 : -17;
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wheelX, 0.6, wheelZ);
        wheel.castShadow = true;
        scene.add(wheel);
        objects.push(wheel);
      }

      var light1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.1),
        lightMaterial
      );
      light1.position.set(xOffset + 2.2, 2.2, -19);
      scene.add(light1);
      objects.push(light1);

      var light2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 0.1),
        lightMaterial
      );
      light2.position.set(xOffset + 2.2, 2.2, -17);
      scene.add(light2);
      objects.push(light2);
    }
  }

  function buildRoadblockBarriers() {
    var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
    var spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

    for (var b = 0; b < 3; b++) {
      var barrier = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1.2, 0.5),
        barrierMaterial
      );
      barrier.position.set(-8 + b * 5, 0.8, 5);
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      scene.add(barrier);
      objects.push(barrier);

      var spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.6, 8),
        spikeMaterial
      );
      spike.position.set(-8 + b * 5, 1.8, 5);
      spike.castShadow = true;
      scene.add(spike);
      objects.push(spike);
    }

    var stripMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    for (var s = 0; s < 4; s++) {
      var strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.01, 12),
        stripMaterial
      );
      strip.position.set(-12 + s * 4, 0.35, 0);
      scene.add(strip);
      objects.push(strip);
    }
  }

  function buildHillsideSlopes() {
    var slopeMaterial = new THREE.MeshStandardMaterial({ color: 0x6B5D50, roughness: 0.9 });
    var grassMaterial = new THREE.MeshStandardMaterial({ color: 0x3A5C2A, roughness: 0.95 });

    var leftSlope = new THREE.Mesh(
      new THREE.BoxGeometry(35, 25, 40),
      slopeMaterial
    );
    leftSlope.position.set(-25, 5, 10);
    leftSlope.rotation.z = 0.35;
    leftSlope.castShadow = true;
    leftSlope.receiveShadow = true;
    scene.add(leftSlope);
    objects.push(leftSlope);

    var rightSlope = new THREE.Mesh(
      new THREE.BoxGeometry(40, 30, 45),
      slopeMaterial
    );
    rightSlope.position.set(40, 8, 15);
    rightSlope.rotation.z = -0.4;
    rightSlope.castShadow = true;
    rightSlope.receiveShadow = true;
    scene.add(rightSlope);
    objects.push(rightSlope);

    var grassTurf1 = new THREE.Mesh(
      new THREE.BoxGeometry(25, 0.2, 35),
      grassMaterial
    );
    grassTurf1.position.set(-20, 28, 12);
    scene.add(grassTurf1);
    objects.push(grassTurf1);

    var grassTurf2 = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.2, 40),
      grassMaterial
    );
    grassTurf2.position.set(35, 35, 18);
    scene.add(grassTurf2);
    objects.push(grassTurf2);
  }

  function buildAttackVehicles() {
    var burningCarMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 });
    var truckMaterial = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.7 });

    var burningCarBody = new THREE.Mesh(
      new THREE.BoxGeometry(5, 2, 2),
      burningCarMaterial
    );
    burningCarBody.position.set(0, 1.2, 8);
    burningCarBody.castShadow = true;
    burningCarBody.receiveShadow = true;
    scene.add(burningCarBody);
    objects.push(burningCarBody);

    for (var w = 0; w < 4; w++) {
      var wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      var wheelX = w < 2 ? -1.5 : 1.5;
      var wheelZ = w % 2 === 0 ? 7 : 9;
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.6, wheelZ);
      scene.add(wheel);
      objects.push(wheel);
    }

    var truckCab = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 2.5),
      truckMaterial
    );
    truckCab.position.set(12, 1.8, 10);
    truckCab.castShadow = true;
    scene.add(truckCab);
    objects.push(truckCab);

    var truckBed = new THREE.Mesh(
      new THREE.BoxGeometry(6, 2, 3),
      truckMaterial
    );
    truckBed.position.set(18, 1.5, 10);
    truckBed.castShadow = true;
    scene.add(truckBed);
    objects.push(truckBed);

    for (var tw = 0; tw < 6; tw++) {
      var truckWheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.3, 12),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
      );
      var twX = 10 + (tw < 3 ? 0 : 8);
      var twZ = tw % 2 === 0 ? 8.5 : 11.5;
      truckWheel.rotation.z = Math.PI / 2;
      truckWheel.position.set(twX, 0.7, twZ);
      scene.add(truckWheel);
      objects.push(truckWheel);
    }
  }

  function buildRockFormations() {
    var rockMaterial = new THREE.MeshStandardMaterial({ color: 0x7A5C3A, roughness: 0.95 });

    var largeRock1 = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 5),
      rockMaterial
    );
    largeRock1.position.set(-18, 15, 20);
    largeRock1.rotation.set(0.3, 0.5, 0.2);
    largeRock1.castShadow = true;
    largeRock1.receiveShadow = true;
    scene.add(largeRock1);
    objects.push(largeRock1);

    var largeRock2 = new THREE.Mesh(
      new THREE.BoxGeometry(10, 8, 6),
      rockMaterial
    );
    largeRock2.position.set(32, 20, 25);
    largeRock2.rotation.set(-0.2, -0.4, 0.3);
    largeRock2.castShadow = true;
    largeRock2.receiveShadow = true;
    scene.add(largeRock2);
    objects.push(largeRock2);

    var mediumRock1 = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 3),
      rockMaterial
    );
    mediumRock1.position.set(-10, 12, 15);
    mediumRock1.rotation.set(0.2, 0.3, -0.1);
    mediumRock1.castShadow = true;
    scene.add(mediumRock1);
    objects.push(mediumRock1);

    var mediumRock2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 3.5),
      rockMaterial
    );
    mediumRock2.position.set(28, 18, 22);
    mediumRock2.rotation.set(-0.1, 0.2, 0.15);
    mediumRock2.castShadow = true;
    scene.add(mediumRock2);
    objects.push(mediumRock2);
  }

  function buildGuardRails() {
    var railMaterial = new THREE.MeshStandardMaterial({ color: 0xCC0000, roughness: 0.5 });
    var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });

    for (var p = 0; p < 5; p++) {
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
        poleMaterial
      );
      pole.position.set(-15 + p * 10, 0.8, 32);
      pole.castShadow = true;
      scene.add(pole);
      objects.push(pole);

      if (p < 4) {
        var rail = new THREE.Mesh(
          new THREE.BoxGeometry(10, 0.08, 0.08),
          railMaterial
        );
        rail.position.set(-10 + p * 10, 1.0, 32);
        scene.add(rail);
        objects.push(rail);
      }
    }
  }

  function buildCrashedHelicopter() {
    var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
    var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });

    var fuselage = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 10),
      fuselageMaterial
    );
    fuselage.position.set(-15, 8, 25);
    fuselage.rotation.set(0.5, 0.3, -0.4);
    fuselage.castShadow = true;
    scene.add(fuselage);
    objects.push(fuselage);

    var tailBoom = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.8, 6),
      fuselageMaterial
    );
    tailBoom.position.set(-16, 7, 32);
    tailBoom.rotation.set(-0.3, 0.2, 0.4);
    tailBoom.castShadow = true;
    scene.add(tailBoom);
    objects.push(tailBoom);

    var mainRotor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.1, 0.8),
      rotorMaterial
    );
    mainRotor.position.set(-15, 9.5, 25);
    mainRotor.castShadow = true;
    scene.add(mainRotor);
    objects.push(mainRotor);

    var tailRotor = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.1, 0.5),
      rotorMaterial
    );
    tailRotor.position.set(-16, 7.5, 33);
    scene.add(tailRotor);
    objects.push(tailRotor);

    var cockpitWindow = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0A3A66, metalness: 0.7 })
    );
    cockpitWindow.position.set(-14.5, 8.5, 20);
    scene.add(cockpitWindow);
    objects.push(cockpitWindow);
  }

  function buildWeaponCache() {
    var cratesMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.8 });

    var crate1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      cratesMaterial
    );
    crate1.position.set(-22, 14.5, 18);
    crate1.castShadow = true;
    scene.add(crate1);
    objects.push(crate1);

    var crate2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      cratesMaterial
    );
    crate2.position.set(-20, 14.5, 17);
    crate2.castShadow = true;
    scene.add(crate2);
    objects.push(crate2);

    var crate3 = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      cratesMaterial
    );
    crate3.position.set(-21, 16.2, 18.5);
    crate3.castShadow = true;
    scene.add(crate3);
    objects.push(crate3);

    var ammoBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xCC0000 })
    );
    ammoBox.position.set(-22.5, 16, 17);
    scene.add(ammoBox);
    objects.push(ammoBox);
  }

  function buildLighting() {
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directionalLight.position.set(30, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var pointLight1 = new THREE.PointLight(0xFF5500, 1.5, 25);
    pointLight1.position.set(0, 2.5, 8);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    lights.push(pointLight1);

    var warningLight = new THREE.PointLight(0xFF0000, 1, 15);
    warningLight.position.set(5, 3, -18);
    warningLight.castShadow = true;
    scene.add(warningLight);
    lights.push(warningLight);
  }

  function update(delta) {
    fireFlicker += delta;
    helicopterSmoke += delta;
    alarmLight += delta;
    vanRock += delta;

    if (fireFlicker > 0.08) {
      fireFlicker = 0;
      if (lights.length > 0 && lights[0]) {
        lights[0].intensity = 0.5 + Math.random() * 0.5;
      }
    }

    if (helicopterSmoke > 0.05) {
      helicopterSmoke = 0;
      if (objects.length > 20) {
        var heliRot = objects[20];
        if (heliRot) {
          heliRot.rotation.y += 0.3;
        }
      }
    }

    if (alarmLight > 0.12) {
      alarmLight = 0;
      if (lights.length > 2) {
        lights[2].intensity = lights[2].intensity > 1 ? 0.5 : 1.5;
      }
    }

    if (vanRock > 0.06) {
      vanRock = 0;
      if (objects.length > 0) {
        var van = objects[0];
        if (van) {
          van.position.y = 2.2 + (Math.random() - 0.5) * 0.1;
        }
      }
    }

    var policeLight1 = objects.length > 15 ? objects[15] : null;
    var policeLight2 = objects.length > 16 ? objects[16] : null;
    if (policeLight1) {
      policeLight1.material.emissive.setHex((Math.sin(alarmLight * Math.PI * 5) > 0.5) ? 0xFF0000 : 0x000000);
    }
    if (policeLight2) {
      policeLight2.material.emissive.setHex((Math.sin(alarmLight * Math.PI * 5 + Math.PI) > 0.5) ? 0xFF0000 : 0x000000);
    }

    var policeLight3 = objects.length > 24 ? objects[24] : null;
    var policeLight4 = objects.length > 25 ? objects[25] : null;
    if (policeLight3) {
      policeLight3.material.emissive.setHex((Math.cos(alarmLight * Math.PI * 5) > 0.5) ? 0xFF0000 : 0x000000);
    }
    if (policeLight4) {
      policeLight4.material.emissive.setHex((Math.cos(alarmLight * Math.PI * 5 + Math.PI) > 0.5) ? 0xFF0000 : 0x000000);
    }
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      scene.remove(objects[i]);
      if (objects[i].geometry) {
        objects[i].geometry.dispose();
      }
      if (objects[i].material) {
        objects[i].material.dispose();
      }
    }
    for (var j = 0; j < lights.length; j++) {
      scene.remove(lights[j]);
    }
    objects = [];
    lights = [];
    particles = [];
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
