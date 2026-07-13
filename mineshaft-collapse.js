window.MineshaftCollapse = (function() {
  'use strict';

  var scene, camera;
  var meshes = [];
  var rockFallIndexes = [];
  var lights = [];
  var dustParticles = [];
  var mineCart = null;
  var cartTrackPos = 0;
  var cartDirection = 1;
  var supportBeams = [];
  var emergencyLights = [];
  var dustClouds = [];
  var ceilingCracks = [];
  var particleEmitters = [];
  var lastHKeyTime = 0;
  var lastNKeyTime = 0;
  var hudElement = null;
  var tunnelIntegrity = 70;
  var goldExtracted = 0;
  var rescueTeamApproaching = true;
  var gameTime = 0;

  function createBoxGeometry(w, h, d) {
    var geometry = new THREE.BoxGeometry(w, h, d);
    return geometry;
  }

  function createTunnelFloor() {
    var geometry = createBoxGeometry(400, 0.3, 80);
    var material = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9, metalness: 0.1 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.position.y = -1;
    mesh.userData.name = 'tunnelFloor';
    scene.add(mesh);
    meshes.push(mesh);
    return mesh;
  }

  function createTunnelWalls() {
    var wallLeft = new THREE.Mesh(
      createBoxGeometry(0.8, 12, 80),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 })
    );
    wallLeft.position.set(-15, 4, 0);
    wallLeft.receiveShadow = true;
    wallLeft.castShadow = true;
    wallLeft.userData.name = 'wallLeft';
    scene.add(wallLeft);
    meshes.push(wallLeft);

    var wallRight = new THREE.Mesh(
      createBoxGeometry(0.8, 12, 80),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.95 })
    );
    wallRight.position.set(15, 4, 0);
    wallRight.receiveShadow = true;
    wallRight.castShadow = true;
    wallRight.userData.name = 'wallRight';
    scene.add(wallRight);
    meshes.push(wallRight);
  }

  function createTunnelCeiling() {
    var geometry = createBoxGeometry(400, 0.6, 80);
    var material = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.9 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 10;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.userData.name = 'tunnelCeiling';
    scene.add(mesh);
    meshes.push(mesh);

    // Cracked sections for visual detail
    for (var i = 0; i < 5; i++) {
      var crack = new THREE.Mesh(
        createBoxGeometry(15, 0.3, 4),
        new THREE.MeshStandardMaterial({ color: 0x0a0000, roughness: 0.95 })
      );
      crack.position.set(-160 + i * 80, 10.4, -30 + i * 15);
      crack.rotation.z = Math.random() * 0.3;
      crack.receiveShadow = true;
      crack.userData.name = 'ceilingCrack';
      scene.add(crack);
      meshes.push(crack);
      ceilingCracks.push(crack);
    }
  }

  function createSupportBeams() {
    // 4 wooden support beam frames (H-shape in cross-section)
    var positions = [-120, -40, 40, 120];
    for (var i = 0; i < positions.length; i++) {
      var z = positions[i];

      // Vertical beam
      var vertical = new THREE.Mesh(
        createBoxGeometry(0.6, 8, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.7, metalness: 0.2 })
      );
      vertical.position.set(-8, 2, z);
      vertical.receiveShadow = true;
      vertical.castShadow = true;
      vertical.userData.name = 'supportVertical';
      scene.add(vertical);
      meshes.push(vertical);

      // Horizontal top beam
      var horizTop = new THREE.Mesh(
        createBoxGeometry(16, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.7, metalness: 0.2 })
      );
      horizTop.position.set(0, 6, z);
      horizTop.receiveShadow = true;
      horizTop.castShadow = true;
      horizTop.userData.name = 'supportHorizontal';
      scene.add(horizTop);
      meshes.push(horizTop);

      // Horizontal bottom beam
      var horizBot = new THREE.Mesh(
        createBoxGeometry(16, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.7, metalness: 0.2 })
      );
      horizBot.position.set(0, 2, z);
      horizBot.receiveShadow = true;
      horizBot.castShadow = true;
      horizBot.userData.name = 'supportHorizontal';
      scene.add(horizBot);
      meshes.push(horizBot);

      supportBeams.push({ vertical: vertical, top: horizTop, bottom: horizBot, z: z });
    }
  }

  function createFailingBeams() {
    // 2 cracked/failing beams at angles
    var beam1 = new THREE.Mesh(
      createBoxGeometry(0.8, 10, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.8 })
    );
    beam1.position.set(0, 3, -80);
    beam1.rotation.z = 0.4;
    beam1.receiveShadow = true;
    beam1.castShadow = true;
    beam1.userData.name = 'failingBeam';
    scene.add(beam1);
    meshes.push(beam1);

    var beam2 = new THREE.Mesh(
      createBoxGeometry(0.8, 10, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.8 })
    );
    beam2.position.set(5, 3, 80);
    beam2.rotation.z = -0.5;
    beam2.receiveShadow = true;
    beam2.castShadow = true;
    beam2.userData.name = 'failingBeam';
    scene.add(beam2);
    meshes.push(beam2);
  }

  function createTrackRails() {
    // Left rail
    var railLeft = new THREE.Mesh(
      createBoxGeometry(0.3, 0.1, 250),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8 })
    );
    railLeft.position.set(-3, -0.7, 0);
    railLeft.receiveShadow = true;
    railLeft.castShadow = true;
    railLeft.userData.name = 'trackRail';
    scene.add(railLeft);
    meshes.push(railLeft);

    // Right rail
    var railRight = new THREE.Mesh(
      createBoxGeometry(0.3, 0.1, 250),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8 })
    );
    railRight.position.set(3, -0.7, 0);
    railRight.receiveShadow = true;
    railRight.castShadow = true;
    railRight.userData.name = 'trackRail';
    scene.add(railRight);
    meshes.push(railRight);
  }

  function createMineCarts() {
    // Mine cart 1 - normal on track
    var cart1 = new THREE.Mesh(
      createBoxGeometry(2, 1.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x8a4a0a, metalness: 0.6 })
    );
    cart1.position.set(0, 0, -60);
    cart1.receiveShadow = true;
    cart1.castShadow = true;
    cart1.userData.name = 'mineCart';
    scene.add(cart1);
    meshes.push(cart1);
    mineCart = cart1;

    // Mine cart 2 - tipped over
    var cart2 = new THREE.Mesh(
      createBoxGeometry(2, 1.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x6a3a0a, metalness: 0.6 })
    );
    cart2.position.set(0, 1.2, 40);
    cart2.rotation.z = 1.2;
    cart2.receiveShadow = true;
    cart2.castShadow = true;
    cart2.userData.name = 'tippedCart';
    scene.add(cart2);
    meshes.push(cart2);

    // Mine cart 3 - with gold bars (will be filled with gold meshes)
    var cart3 = new THREE.Mesh(
      createBoxGeometry(2, 1.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x8a4a0a, metalness: 0.6 })
    );
    cart3.position.set(0, 0, 80);
    cart3.receiveShadow = true;
    cart3.castShadow = true;
    cart3.userData.name = 'goldCart';
    scene.add(cart3);
    meshes.push(cart3);
  }

  function createGoldBarStack() {
    // Main gold bar stack - emissive metallic yellow
    var gold = new THREE.Mesh(
      createBoxGeometry(3, 2, 2),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xff9900,
        metalness: 0.9,
        roughness: 0.2
      })
    );
    gold.position.set(-8, 1.5, -100);
    gold.receiveShadow = true;
    gold.castShadow = true;
    gold.userData.name = 'goldStack';
    scene.add(gold);
    meshes.push(gold);

    // Additional gold bars scattered
    for (var i = 0; i < 4; i++) {
      var bar = new THREE.Mesh(
        createBoxGeometry(0.8, 0.5, 1.2),
        new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffaa00,
          metalness: 0.95,
          roughness: 0.1
        })
      );
      bar.position.set(-6 + i * 1.5, 0.3 + i * 0.5, -99);
      bar.rotation.z = Math.random() * 0.3;
      bar.receiveShadow = true;
      bar.castShadow = true;
      bar.userData.name = 'goldBar';
      scene.add(bar);
      meshes.push(bar);
    }
  }

  function createCriminalFigures() {
    // 4 criminal thief figures - dark box figures
    var positions = [
      { x: -10, z: -95 },
      { x: -6, z: -100 },
      { x: -2, z: -95 },
      { x: 2, z: -100 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      // Body
      var body = new THREE.Mesh(
        createBoxGeometry(0.8, 1.4, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })
      );
      body.position.set(pos.x, 1, pos.z);
      body.receiveShadow = true;
      body.castShadow = true;
      body.userData.name = 'criminal';
      scene.add(body);
      meshes.push(body);

      // Head
      var head = new THREE.Mesh(
        createBoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 0.7 })
      );
      head.position.set(pos.x, 2.2, pos.z);
      head.receiveShadow = true;
      head.castShadow = true;
      head.userData.name = 'criminal';
      scene.add(head);
      meshes.push(head);

      // Equipment box (backpack/gear)
      var gear = new THREE.Mesh(
        createBoxGeometry(0.6, 0.8, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x2a2a1a, roughness: 0.9 })
      );
      gear.position.set(pos.x - 0.5, 1.2, pos.z - 0.4);
      gear.receiveShadow = true;
      gear.castShadow = true;
      gear.userData.name = 'criminal';
      scene.add(gear);
      meshes.push(gear);
    }
  }

  function createRescueTeam() {
    // 3 rescue team miners - orange vests entering from surface
    var positions = [
      { x: -5, z: 120 },
      { x: 0, z: 125 },
      { x: 5, z: 130 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];

      // Body with orange vest
      var body = new THREE.Mesh(
        createBoxGeometry(0.9, 1.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xee8800, roughness: 0.6 })
      );
      body.position.set(pos.x, 1.2, pos.z);
      body.receiveShadow = true;
      body.castShadow = true;
      body.userData.name = 'rescuer';
      scene.add(body);
      meshes.push(body);

      // Head with helmet
      var head = new THREE.Mesh(
        createBoxGeometry(0.5, 0.6, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.3 })
      );
      head.position.set(pos.x, 2.3, pos.z);
      head.receiveShadow = true;
      head.castShadow = true;
      head.userData.name = 'rescuer';
      scene.add(head);
      meshes.push(head);

      // Equipment
      var equipment = new THREE.Mesh(
        createBoxGeometry(0.7, 1.2, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 })
      );
      equipment.position.set(pos.x, 1.5, pos.z - 0.5);
      equipment.receiveShadow = true;
      equipment.castShadow = true;
      equipment.userData.name = 'rescuer';
      scene.add(equipment);
      meshes.push(equipment);
    }
  }

  function createRockFallDebris() {
    // 15 irregular box chunks scattered on floor and some falling from ceiling
    var positions = [
      { x: -12, y: 0.3, z: 0 },
      { x: -8, y: 0.4, z: -20 },
      { x: -5, y: 0.3, z: 40 },
      { x: 0, y: 0.5, z: -60 },
      { x: 3, y: 0.3, z: 20 },
      { x: 8, y: 0.4, z: 50 },
      { x: 10, y: 0.3, z: -30 },
      { x: -15, y: 0.4, z: 70 },
      { x: 12, y: 0.3, z: 10 },
      { x: 5, y: 0.4, z: -80 },
      { x: -10, y: 0.3, z: 90 },
      { x: 0, y: 0.5, z: 60 },
      { x: 13, y: 0.3, z: -50 },
      { x: -7, y: 0.4, z: 100 },
      { x: 6, y: 0.3, z: -10 }
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var w = 0.5 + Math.random() * 1.5;
      var h = 0.3 + Math.random() * 0.8;
      var d = 0.5 + Math.random() * 1.2;

      var rock = new THREE.Mesh(
        createBoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.95 })
      );
      rock.position.set(pos.x, pos.y, pos.z);
      rock.rotation.x = Math.random() * Math.PI;
      rock.rotation.y = Math.random() * Math.PI;
      rock.rotation.z = Math.random() * Math.PI;
      rock.receiveShadow = true;
      rock.castShadow = true;
      rock.userData.name = 'rockDebris';
      scene.add(rock);
      meshes.push(rock);

      // Some rocks that will fall from ceiling
      if (i < 8) {
        rockFallIndexes.push(meshes.length - 1);
      }
    }

    // Additional falling rocks starting high above
    for (var j = 0; j < 4; j++) {
      var fallRock = new THREE.Mesh(
        createBoxGeometry(1 + Math.random() * 0.8, 0.5 + Math.random() * 0.5, 1),
        new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 })
      );
      fallRock.position.set(-15 + j * 8, 12, -50 + j * 30);
      fallRock.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
      fallRock.receiveShadow = true;
      fallRock.castShadow = true;
      fallRock.userData.name = 'fallingRock';
      fallRock.userData.initialY = fallRock.position.y;
      scene.add(fallRock);
      meshes.push(fallRock);
      rockFallIndexes.push(meshes.length - 1);
    }
  }

  function createEmergencyLighting() {
    // Red emissive spheres on walls every 10 units, some flickering
    for (var i = -120; i <= 120; i += 10) {
      var radius = 0.3;
      var sphereGeom = new THREE.SphereGeometry(radius, 8, 8);
      var sphereMat = new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        metalness: 0.5
      });

      var lightLeft = new THREE.Mesh(sphereGeom, sphereMat);
      lightLeft.position.set(-14.5, 2, i);
      lightLeft.receiveShadow = true;
      lightLeft.userData.name = 'emergencyLight';
      lightLeft.userData.flicker = Math.random() > 0.7;
      scene.add(lightLeft);
      meshes.push(lightLeft);
      emergencyLights.push(lightLeft);

      var lightRight = new THREE.Mesh(sphereGeom, sphereMat);
      lightRight.position.set(14.5, 2, i);
      lightRight.receiveShadow = true;
      lightRight.userData.name = 'emergencyLight';
      lightRight.userData.flicker = Math.random() > 0.7;
      scene.add(lightRight);
      meshes.push(lightRight);
      emergencyLights.push(lightRight);
    }

    // Three.js lights for illumination
    var ambientLight = new THREE.AmbientLight(0x4a4a3a, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 15, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    lights.push(directionalLight);

    var redLight = new THREE.PointLight(0xff3333, 0.5, 50);
    redLight.position.set(0, 8, -100);
    scene.add(redLight);
    lights.push(redLight);
  }

  function createDustCloud() {
    // Large semi-transparent box cluster at collapse point (center tunnel)
    var cloudPositions = [
      { x: 0, y: 6, z: 0 },
      { x: -3, y: 5, z: -2 },
      { x: 3, y: 7, z: 2 },
      { x: -2, y: 6.5, z: 3 },
      { x: 2, y: 5.5, z: -3 }
    ];

    for (var i = 0; i < cloudPositions.length; i++) {
      var pos = cloudPositions[i];
      var cloud = new THREE.Mesh(
        createBoxGeometry(5, 4, 4),
        new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          transparent: true,
          opacity: 0.3,
          roughness: 0.9
        })
      );
      cloud.position.set(pos.x, pos.y, pos.z);
      cloud.userData.name = 'dustCloud';
      cloud.userData.initialScale = cloud.scale.clone();
      scene.add(cloud);
      meshes.push(cloud);
      dustClouds.push(cloud);
    }
  }

  function createVentilationPipe() {
    // Long thin box duct along ceiling
    var pipe = new THREE.Mesh(
      createBoxGeometry(1, 0.8, 250),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.7, roughness: 0.4 })
    );
    pipe.position.set(10, 9.5, 0);
    pipe.receiveShadow = true;
    pipe.castShadow = true;
    pipe.userData.name = 'ventPipe';
    scene.add(pipe);
    meshes.push(pipe);
  }

  function createSurfaceEntrance() {
    // Angled mine entrance opening at one end with daylight
    var entranceFrame = new THREE.Mesh(
      createBoxGeometry(25, 10, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.8 })
    );
    entranceFrame.position.set(0, 3, 140);
    entranceFrame.rotation.x = 0.4;
    entranceFrame.receiveShadow = true;
    entranceFrame.castShadow = true;
    entranceFrame.userData.name = 'entranceFrame';
    scene.add(entranceFrame);
    meshes.push(entranceFrame);

    // Entrance opening (lighter color simulating daylight)
    var entranceOpening = new THREE.Mesh(
      createBoxGeometry(20, 8, 0.2),
      new THREE.MeshStandardMaterial({
        color: 0xddddaa,
        emissive: 0xffffcc,
        emissiveIntensity: 0.5
      })
    );
    entranceOpening.position.set(0, 3, 140);
    entranceOpening.userData.name = 'entranceOpening';
    scene.add(entranceOpening);
    meshes.push(entranceOpening);
  }

  function createCompressedAirTank() {
    // Large cylinder box near entrance with valve wheel
    var tank = new THREE.Mesh(
      createBoxGeometry(1.5, 3, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.3 })
    );
    tank.position.set(12, 1.5, 130);
    tank.receiveShadow = true;
    tank.castShadow = true;
    tank.userData.name = 'airTank';
    scene.add(tank);
    meshes.push(tank);

    // Valve wheel (flat circular box)
    var valve = new THREE.Mesh(
      createBoxGeometry(0.8, 0.8, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9 })
    );
    valve.position.set(12, 3.2, 130);
    valve.receiveShadow = true;
    valve.castShadow = true;
    valve.userData.name = 'valve';
    scene.add(valve);
    meshes.push(valve);
  }

  function createHUD() {
    if (hudElement) {
      document.body.removeChild(hudElement);
    }

    hudElement = document.createElement('div');
    hudElement.id = 'mineshaft-hud';
    hudElement.style.position = 'absolute';
    hudElement.style.top = '20px';
    hudElement.style.left = '20px';
    hudElement.style.color = '#00ff00';
    hudElement.style.fontFamily = 'monospace';
    hudElement.style.fontSize = '14px';
    hudElement.style.zIndex = '1000';
    hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hudElement.style.padding = '10px';
    hudElement.style.border = '2px solid #00ff00';
    hudElement.innerHTML = 'GOLD EXTRACTED: 0%<br/>TUNNEL INTEGRITY: 70%<br/>RESCUE TEAM: APPROACHING';
    document.body.appendChild(hudElement);
  }

  function updateHUD() {
    if (hudElement) {
      var integrity = Math.max(0, Math.floor(tunnelIntegrity));
      var status = rescueTeamApproaching ? 'APPROACHING' : 'ENTERED';
      hudElement.innerHTML = 'GOLD EXTRACTED: ' + Math.floor(goldExtracted) + '%<br/>TUNNEL INTEGRITY: ' + integrity + '%<br/>RESCUE TEAM: ' + status;
    }
  }

  function handleKeyDown(event) {
    var now = Date.now();

    if (event.key === 'h' || event.key === 'H') {
      if (now - lastHKeyTime < 400) {
        // H pressed twice within 400ms, now wait for N
        lastHKeyTime = now;
      } else {
        lastHKeyTime = now;
      }
    }

    if (event.key === 'n' || event.key === 'N') {
      if (now - lastHKeyTime < 400) {
        // H+N detected within timeframe
        console.log('H+N detected - HUD toggle');
        if (hudElement) {
          hudElement.style.display = hudElement.style.display === 'none' ? 'block' : 'none';
        }
      }
      lastNKeyTime = now;
    }
  }

  function updateRockFall(delta) {
    for (var i = 0; i < rockFallIndexes.length; i++) {
      var idx = rockFallIndexes[i];
      var rock = meshes[idx];
      if (rock && rock.userData.name === 'fallingRock') {
        rock.position.y -= 15 * delta;
        if (rock.position.y < -2) {
          rock.position.y = rock.userData.initialY;
        }
      }
    }
  }

  function updateCeilingCracks(delta) {
    for (var i = 0; i < ceilingCracks.length; i++) {
      var crack = ceilingCracks[i];
      crack.rotation.z += 0.02 * Math.sin(gameTime);
    }
  }

  function updateMineCart(delta) {
    if (mineCart) {
      cartTrackPos += cartDirection * 20 * delta;
      if (cartTrackPos > 80) {
        cartDirection = -1;
      } else if (cartTrackPos < -80) {
        cartDirection = 1;
      }
      mineCart.position.z = cartTrackPos;
    }
  }

  function updateSupportBeams(delta) {
    for (var i = 0; i < supportBeams.length; i++) {
      var beam = supportBeams[i];
      var creakAmount = 0.01 * Math.sin(gameTime * 2 + i);
      beam.vertical.rotation.x = creakAmount;
      beam.top.rotation.x = creakAmount;
      beam.bottom.rotation.x = creakAmount;
    }
  }

  function updateEmergencyLights(delta) {
    for (var i = 0; i < emergencyLights.length; i++) {
      var light = emergencyLights[i];
      if (light.userData.flicker) {
        var flicker = Math.random() > 0.5 ? 1 : 0.3;
        light.material.emissiveIntensity = flicker;
      }
    }
  }

  function updateDustCloud(delta) {
    for (var i = 0; i < dustClouds.length; i++) {
      var cloud = dustClouds[i];
      var pulseScale = 1 + 0.2 * Math.sin(gameTime * 3);
      cloud.scale.copy(cloud.userData.initialScale);
      cloud.scale.multiplyScalar(pulseScale);
    }
  }

  function updateGameState(delta) {
    // Decrease tunnel integrity over time
    tunnelIntegrity -= 0.05 * delta;

    // Increase gold extracted (from criminals loading carts)
    goldExtracted += 0.2 * delta;

    // Rescue team approaching (moves forward over time)
    if (rescueTeamApproaching && goldExtracted > 15) {
      rescueTeamApproaching = false;
    }

    updateHUD();
  }

  function init(_scene, _camera) {
    scene = _scene;
    camera = _camera;

    createTunnelFloor();
    createTunnelWalls();
    createTunnelCeiling();
    createSupportBeams();
    createFailingBeams();
    createTrackRails();
    createMineCarts();
    createGoldBarStack();
    createCriminalFigures();
    createRescueTeam();
    createRockFallDebris();
    createEmergencyLighting();
    createDustCloud();
    createVentilationPipe();
    createSurfaceEntrance();
    createCompressedAirTank();
    createHUD();

    window.addEventListener('keydown', handleKeyDown, false);

    return true;
  }

  function update(delta) {
    gameTime += delta;

    updateRockFall(delta);
    updateCeilingCracks(delta);
    updateMineCart(delta);
    updateSupportBeams(delta);
    updateEmergencyLights(delta);
    updateDustCloud(delta);
    updateGameState(delta);
  }

  function reset() {
    // Remove all meshes
    for (var i = 0; i < meshes.length; i++) {
      scene.remove(meshes[i]);
      if (meshes[i].geometry) {
        meshes[i].geometry.dispose();
      }
      if (meshes[i].material) {
        if (Array.isArray(meshes[i].material)) {
          for (var j = 0; j < meshes[i].material.length; j++) {
            meshes[i].material[j].dispose();
          }
        } else {
          meshes[i].material.dispose();
        }
      }
    }

    // Remove all lights
    for (var k = 0; k < lights.length; k++) {
      scene.remove(lights[k]);
    }

    // Reset arrays
    meshes = [];
    rockFallIndexes = [];
    lights = [];
    dustParticles = [];
    supportBeams = [];
    emergencyLights = [];
    dustClouds = [];
    ceilingCracks = [];
    particleEmitters = [];
    cartTrackPos = 0;
    cartDirection = 1;
    tunnelIntegrity = 70;
    goldExtracted = 0;
    rescueTeamApproaching = true;
    gameTime = 0;

    // Remove HUD
    if (hudElement && hudElement.parentNode) {
      document.body.removeChild(hudElement);
      hudElement = null;
    }

    // Remove event listener
    window.removeEventListener('keydown', handleKeyDown, false);
  }

  return {
    init: init,
    update: update,
    reset: reset
  };
}());
