window.SpaceHub = (function() {
  'use strict';

  var scene = null;
  var camera = null;
  var stationCore = null;
  var dockingBays = [];
  var dockedShips = [];
  var airlocks = [];
  var reactorCore = null;
  var reactorSphere = null;
  var gyroscopeRings = [];
  var navigationLights = [];
  var cargoArm = null;
  var cargoArmBase = null;
  var cargoArmJoint = null;
  var cargoArmEnd = null;
  var time = 0;
  var initialPositions = {};

  var init = function(sceneIn, cameraIn) {
    scene = sceneIn;
    camera = cameraIn;
    scene.background = new THREE.Color(0x000814);

    // Station core cylinder - large central body
    var coreGeometry = new THREE.CylinderGeometry(40, 40, 100, 32);
    var coreMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.7, roughness: 0.3 });
    stationCore = new THREE.Mesh(coreGeometry, coreMaterial);
    stationCore.castShadow = true;
    stationCore.receiveShadow = true;
    stationCore.position.set(0, 0, 0);
    scene.add(stationCore);
    initialPositions.stationCore = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 };

    // Docking bay arms extending from core
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var bayGeometry = new THREE.BoxGeometry(15, 8, 60);
      var bayMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460, metalness: 0.6, roughness: 0.4 });
      var bay = new THREE.Mesh(bayGeometry, bayMaterial);
      bay.position.set(Math.cos(angle) * 50, 0, Math.sin(angle) * 50);
      bay.rotation.z = angle;
      bay.castShadow = true;
      bay.receiveShadow = true;
      scene.add(bay);
      dockingBays.push(bay);
      initialPositions['bay' + i] = { x: bay.position.x, y: bay.position.y, z: bay.position.z, rotX: 0, rotY: 0, rotZ: bay.rotation.z };
    }

    // Docked ships at each bay
    for (var i = 0; i < 4; i++) {
      var angle = (i / 4) * Math.PI * 2;
      var shipGroup = new THREE.Group();

      // Ship hull
      var hullGeometry = new THREE.BoxGeometry(8, 6, 25);
      var hullMaterial = new THREE.MeshStandardMaterial({ color: 0x3c6382, metalness: 0.8, roughness: 0.2 });
      var hull = new THREE.Mesh(hullGeometry, hullMaterial);
      hull.castShadow = true;
      hull.receiveShadow = true;
      hull.position.z = 12;
      shipGroup.add(hull);

      // Ship nose cone
      var noseGeometry = new THREE.ConeGeometry(4, 12, 16);
      var noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.7, roughness: 0.3 });
      var nose = new THREE.Mesh(noseGeometry, noseMaterial);
      nose.castShadow = true;
      nose.position.z = 24;
      nose.rotation.x = Math.PI / 2;
      shipGroup.add(nose);

      // Ship wings
      for (var w = 0; w < 2; w++) {
        var wingGeometry = new THREE.BoxGeometry(2, 12, 16);
        var wingMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.6, roughness: 0.4 });
        var wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set((w === 0 ? -6 : 6), 0, 12);
        wing.castShadow = true;
        wing.receiveShadow = true;
        shipGroup.add(wing);
      }

      // Navigation lights
      var lightGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      var lightMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
      var navLight = new THREE.Mesh(lightGeometry, lightMaterial);
      navLight.position.set(0, 4, 25);
      navLight.castShadow = true;
      shipGroup.add(navLight);
      navigationLights.push({ light: navLight, intensity: 0 });

      shipGroup.position.set(Math.cos(angle) * 50 + Math.cos(angle) * 35, 0, Math.sin(angle) * 50 + Math.sin(angle) * 35);
      shipGroup.rotation.y = angle;
      scene.add(shipGroup);
      dockedShips.push(shipGroup);
      initialPositions['ship' + i] = { x: shipGroup.position.x, y: shipGroup.position.y, z: shipGroup.position.z, rotX: 0, rotY: shipGroup.rotation.y, rotZ: 0 };
    }

    // Airlock chambers - double-wall modules
    for (var i = 0; i < 6; i++) {
      var airlockGroup = new THREE.Group();

      var outerGeometry = new THREE.BoxGeometry(12, 12, 12);
      var outerMaterial = new THREE.MeshStandardMaterial({ color: 0x16213e, metalness: 0.7, roughness: 0.3 });
      var outer = new THREE.Mesh(outerGeometry, outerMaterial);
      outer.castShadow = true;
      outer.receiveShadow = true;
      airlockGroup.add(outer);

      var innerGeometry = new THREE.BoxGeometry(10, 10, 10);
      var innerMaterial = new THREE.MeshStandardMaterial({ color: 0x0f3460, metalness: 0.6, roughness: 0.4 });
      var inner = new THREE.Mesh(innerGeometry, innerMaterial);
      inner.castShadow = true;
      inner.position.z = 0.1;
      airlockGroup.add(inner);

      var angle = (i / 6) * Math.PI * 2;
      airlockGroup.position.set(Math.cos(angle) * 60, -30 + (i % 3) * 15, Math.sin(angle) * 60);
      scene.add(airlockGroup);
      airlocks.push(airlockGroup);
      initialPositions['airlock' + i] = { x: airlockGroup.position.x, y: airlockGroup.position.y, z: airlockGroup.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // Reactor core - glowing blue sphere with housing and grating
    var reactorGroup = new THREE.Group();

    var sphereGeometry = new THREE.SphereGeometry(8, 32, 32);
    var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0033ff, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.7 });
    reactorSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    reactorSphere.castShadow = true;
    reactorSphere.receiveShadow = true;
    reactorGroup.add(reactorSphere);

    var housingGeometry = new THREE.CylinderGeometry(12, 12, 20, 24);
    var housingMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a3a, metalness: 0.8, roughness: 0.2 });
    var housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.castShadow = true;
    housing.receiveShadow = true;
    reactorGroup.add(housing);

    // Reactor grating - LineSegments grid
    var gratingGeometry = new THREE.BufferGeometry();
    var gratingVertices = [];
    for (var x = -10; x <= 10; x += 5) {
      gratingVertices.push(x, -12, -10, x, -12, 10);
    }
    for (var z = -10; z <= 10; z += 5) {
      gratingVertices.push(-10, -12, z, 10, -12, z);
    }
    gratingGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gratingVertices), 3));
    var gratingMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });
    var grating = new THREE.LineSegments(gratingGeometry, gratingMaterial);
    reactorGroup.add(grating);

    reactorGroup.position.set(0, 50, 0);
    scene.add(reactorGroup);
    reactorCore = reactorGroup;
    initialPositions.reactor = { x: 0, y: 50, z: 0, rotX: 0, rotY: 0, rotZ: 0 };

    // Security checkpoint - BoxGeometry scanner arch + SphereGeometry scanner lights
    var checkpointGroup = new THREE.Group();

    var archGeometry = new THREE.BoxGeometry(20, 25, 4);
    var archMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.7, roughness: 0.3 });
    var arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.castShadow = true;
    arch.receiveShadow = true;
    checkpointGroup.add(arch);

    for (var i = 0; i < 8; i++) {
      var scannerGeometry = new THREE.SphereGeometry(2, 16, 16);
      var scannerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.7 });
      var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
      var posX = -8 + (i % 4) * 5;
      var posY = -8 + Math.floor(i / 4) * 15;
      scanner.position.set(posX, posY, 3);
      scanner.castShadow = true;
      checkpointGroup.add(scanner);
    }

    checkpointGroup.position.set(0, 0, -80);
    scene.add(checkpointGroup);
    initialPositions.checkpoint = { x: 0, y: 0, z: -80, rotX: 0, rotY: 0, rotZ: 0 };

    // Commercial shops - BoxGeometry stall fronts
    for (var i = 0; i < 3; i++) {
      var shopGeometry = new THREE.BoxGeometry(20, 15, 10);
      var shopMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4e69, metalness: 0.5, roughness: 0.5 });
      var shop = new THREE.Mesh(shopGeometry, shopMaterial);
      shop.position.set(-50 + i * 40, -35, 60);
      shop.castShadow = true;
      shop.receiveShadow = true;
      scene.add(shop);
      initialPositions['shop' + i] = { x: shop.position.x, y: shop.position.y, z: shop.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // Transit lounge - BoxGeometry seating pods
    for (var i = 0; i < 12; i++) {
      var podGeometry = new THREE.BoxGeometry(3, 3, 3);
      var podMaterial = new THREE.MeshStandardMaterial({ color: 0x3c6382, metalness: 0.6, roughness: 0.4 });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      var gridX = (i % 4) * 8 - 12;
      var gridY = -40;
      var gridZ = Math.floor(i / 4) * 8 - 8;
      pod.position.set(gridX, gridY, gridZ);
      pod.castShadow = true;
      pod.receiveShadow = true;
      scene.add(pod);
      initialPositions['pod' + i] = { x: pod.position.x, y: pod.position.y, z: pod.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // Fuel depot - CylinderGeometry storage spheres
    for (var i = 0; i < 4; i++) {
      var tankGeometry = new THREE.CylinderGeometry(6, 6, 20, 16);
      var tankMaterial = new THREE.MeshStandardMaterial({ color: 0x9d4edd, metalness: 0.7, roughness: 0.3 });
      var tank = new THREE.Mesh(tankGeometry, tankMaterial);
      tank.position.set(-30 + i * 20, 25, -50);
      tank.castShadow = true;
      tank.receiveShadow = true;
      scene.add(tank);
      initialPositions['tank' + i] = { x: tank.position.x, y: tank.position.y, z: tank.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // EVA suit lockers - BoxGeometry wall rack
    for (var i = 0; i < 8; i++) {
      var lockerGeometry = new THREE.BoxGeometry(4, 8, 2);
      var lockerMaterial = new THREE.MeshStandardMaterial({ color: 0xff006e, metalness: 0.6, roughness: 0.4 });
      var locker = new THREE.Mesh(lockerGeometry, lockerMaterial);
      var gridX = (i % 4) * 6 - 9;
      var gridY = 20 + Math.floor(i / 4) * 10;
      locker.position.set(gridX, gridY, -75);
      locker.castShadow = true;
      locker.receiveShadow = true;
      scene.add(locker);
      initialPositions['locker' + i] = { x: locker.position.x, y: locker.position.y, z: locker.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // Communications array - CylinderGeometry dish cluster + LineSegments signal
    var commGroup = new THREE.Group();

    for (var i = 0; i < 3; i++) {
      var dishGeometry = new THREE.CylinderGeometry(8, 8, 1, 32);
      var dishMaterial = new THREE.MeshStandardMaterial({ color: 0xffbe0b, metalness: 0.8, roughness: 0.2 });
      var dish = new THREE.Mesh(dishGeometry, dishMaterial);
      dish.position.set((i - 1) * 15, 0, 0);
      dish.rotation.x = Math.PI / 4;
      dish.castShadow = true;
      dish.receiveShadow = true;
      commGroup.add(dish);
    }

    // Signal lines
    var signalGeometry = new THREE.BufferGeometry();
    var signalVertices = [];
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2;
      signalVertices.push(Math.cos(angle) * 20, Math.sin(angle) * 20, 0);
      signalVertices.push(Math.cos(angle) * 25, Math.sin(angle) * 25, 5);
    }
    signalGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(signalVertices), 3));
    var signalMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
    var signal = new THREE.LineSegments(signalGeometry, signalMaterial);
    commGroup.add(signal);

    commGroup.position.set(70, 60, -40);
    scene.add(commGroup);
    initialPositions.comms = { x: 70, y: 60, z: -40, rotX: 0, rotY: 0, rotZ: 0 };

    // Gyroscope rings - CylinderGeometry flat disc layers nested
    for (var i = 0; i < 3; i++) {
      var ringGeometry = new THREE.CylinderGeometry(25 - i * 5, 25 - i * 5, 1, 32);
      var ringMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.6 });
      var ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(-70, 30, 0);
      ring.rotation.x = (Math.PI / 3) * (i + 1);
      ring.castShadow = true;
      scene.add(ring);
      gyroscopeRings.push({ mesh: ring, baseRotX: ring.rotation.x, baseRotY: ring.rotation.y, baseRotZ: ring.rotation.z, speed: 0.5 + i * 0.3 });
      initialPositions['gyro' + i] = { x: ring.position.x, y: ring.position.y, z: ring.position.z, rotX: ring.rotation.x, rotY: ring.rotation.y, rotZ: ring.rotation.z };
    }

    // Escape pod bays - BoxGeometry individual pods in rack
    for (var i = 0; i < 6; i++) {
      var podGeometry = new THREE.BoxGeometry(4, 6, 4);
      var podMaterial = new THREE.MeshStandardMaterial({ color: 0xfb5607, metalness: 0.6, roughness: 0.4 });
      var pod = new THREE.Mesh(podGeometry, podMaterial);
      pod.position.set(60, -30 + (i % 3) * 10, 60 - Math.floor(i / 3) * 15);
      pod.castShadow = true;
      pod.receiveShadow = true;
      scene.add(pod);
      initialPositions['escapepod' + i] = { x: pod.position.x, y: pod.position.y, z: pod.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // Cargo transfer arm - BoxGeometry robotic + CylinderGeometry joints
    cargoArmBase = new THREE.Group();

    var baseGeometry = new THREE.BoxGeometry(8, 4, 8);
    var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
    var baseBody = new THREE.Mesh(baseGeometry, baseMaterial);
    baseBody.castShadow = true;
    baseBody.receiveShadow = true;
    cargoArmBase.add(baseBody);

    cargoArmJoint = new THREE.Group();
    var jointGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
    var jointMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.2 });
    var joint = new THREE.Mesh(jointGeometry, jointMaterial);
    joint.castShadow = true;
    cargoArmJoint.add(joint);
    cargoArmJoint.position.y = 4;
    cargoArmBase.add(cargoArmJoint);

    cargoArmEnd = new THREE.Group();
    var endGeometry = new THREE.BoxGeometry(6, 12, 6);
    var endMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6, roughness: 0.4 });
    var endBody = new THREE.Mesh(endGeometry, endMaterial);
    endBody.position.z = 15;
    endBody.castShadow = true;
    endBody.receiveShadow = true;
    cargoArmEnd.add(endBody);
    cargoArmEnd.position.y = 4;
    cargoArmJoint.add(cargoArmEnd);

    cargoArm = cargoArmBase;
    cargoArm.position.set(50, -40, -70);
    scene.add(cargoArm);
    initialPositions.cargoArm = { x: 50, y: -40, z: -70, rotX: 0, rotY: 0, rotZ: 0 };

    // Alien smuggler hideout - hidden compartment
    var hideoutGeometry = new THREE.BoxGeometry(10, 10, 10);
    var hideoutMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.5, transparent: true, opacity: 0.4 });
    var hideout = new THREE.Mesh(hideoutGeometry, hideoutMaterial);
    hideout.position.set(-60, 15, 40);
    hideout.castShadow = true;
    scene.add(hideout);
    initialPositions.hideout = { x: -60, y: 15, z: 40, rotX: 0, rotY: 0, rotZ: 0 };

    // Zero-G warning signs - BoxGeometry emissive
    var warningPositions = [
      [0, 70, 0],
      [-80, 0, 0],
      [80, 0, 0],
      [0, 0, 80],
      [0, 0, -80]
    ];
    for (var i = 0; i < warningPositions.length; i++) {
      var signGeometry = new THREE.BoxGeometry(5, 5, 0.5);
      var signMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.9 });
      var sign = new THREE.Mesh(signGeometry, signMaterial);
      sign.position.set(warningPositions[i][0], warningPositions[i][1], warningPositions[i][2]);
      sign.castShadow = true;
      scene.add(sign);
      initialPositions['warning' + i] = { x: sign.position.x, y: sign.position.y, z: sign.position.z, rotX: 0, rotY: 0, rotZ: 0 };
    }

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    var pointLight = new THREE.PointLight(0x0066ff, 1, 150);
    pointLight.position.set(0, 50, 0);
    scene.add(pointLight);

    var pointLight2 = new THREE.PointLight(0xff0066, 0.8, 120);
    pointLight2.position.set(-60, 15, 40);
    scene.add(pointLight2);
  };

  var update = function(delta) {
    time += delta;

    // Reactor core pulse - emissive intensity change
    if (reactorSphere) {
      var pulseFactor = 0.5 + 0.5 * Math.sin(time * 2);
      reactorSphere.material.emissiveIntensity = 0.3 + pulseFactor * 0.5;
    }

    // Gyroscope rings rotation
    for (var i = 0; i < gyroscopeRings.length; i++) {
      var gyro = gyroscopeRings[i];
      gyro.mesh.rotation.x = gyro.baseRotX + time * gyro.speed;
      gyro.mesh.rotation.y = gyro.baseRotY + time * gyro.speed * 0.5;
      gyro.mesh.rotation.z = gyro.baseRotZ + time * gyro.speed * 0.3;
    }

    // Navigation lights blink
    for (var i = 0; i < navigationLights.length; i++) {
      var blinkFactor = Math.sin(time * 3 + i) > 0 ? 1 : 0.2;
      navigationLights[i].light.material.emissiveIntensity = 0.8 * blinkFactor;
    }

    // Cargo arm sweep
    if (cargoArmJoint) {
      cargoArmJoint.rotation.y = Math.sin(time * 0.5) * 0.8;
      cargoArmEnd.rotation.x = Math.sin(time * 0.7) * 0.6;
    }
  };

  var reset = function() {
    time = 0;
    if (reactorSphere) {
      reactorSphere.material.emissiveIntensity = 0.6;
    }
    for (var i = 0; i < gyroscopeRings.length; i++) {
      gyroscopeRings[i].mesh.rotation.x = gyroscopeRings[i].baseRotX;
      gyroscopeRings[i].mesh.rotation.y = gyroscopeRings[i].baseRotY;
      gyroscopeRings[i].mesh.rotation.z = gyroscopeRings[i].baseRotZ;
    }
    for (var i = 0; i < navigationLights.length; i++) {
      navigationLights[i].light.material.emissiveIntensity = 0.8;
    }
    if (cargoArmJoint) {
      cargoArmJoint.rotation.y = 0;
      cargoArmEnd.rotation.x = 0;
    }
  };

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
